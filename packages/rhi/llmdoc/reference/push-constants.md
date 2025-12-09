# Push Constants 实现参考

## 1. Core Summary

Push Constants 是 RHI 中的一种高效参数传递机制。在 WebGL 2.0 上，通过 Uniform Buffer Object (UBO) 实现 WebGPU 风格的 push constants。Push Constants 支持完整的 std140 内存布局规范，包括标量、向量、矩阵和数组，确保与其他图形 API 的一致性。

## 2. Source of Truth

**接口定义**：
- `packages/specification/src/common/rhi/pipeline.ts` - `IRHIRenderPipeline.pushConstants()` 方法

**std140 布局工具**：
- `packages/rhi/src/webgl/utils/Std140Layout.ts:1-444` - 完整的 std140 计算引擎
  - `Std140Calculator` 类：核心计算器
  - `Std140Type` 枚举：支持的数据类型
  - 类型信息表 (`TYPE_INFO`)：所有类型的对齐和大小规则

**WebGL 实现**：
- `packages/rhi/src/webgl/pipeline/GLRenderPipeline.ts:720-794` - Push Constants 实现
  - `updatePushConstants()` - 更新 UBO 数据
  - `bindPushConstantsUBO()` - 绑定 UBO 到 binding point
  - `hasPushConstantsUBO()` - 检查 UBO 可用性
  - `updatePushConstantsLegacy()` - WebGL 1.0 降级方案

**WebGL 渲染通道**：
- `packages/rhi/src/webgl/commands/GLRenderPass.ts:637-650` - 渲染通道中的 `pushConstants()` 方法

## 3. std140 布局规范

### 类型对齐规则

| 类型 | 基础对齐 | 大小 | 注释 |
|------|----------|------|------|
| float / int / uint / bool | 4 | 4 | 标量 |
| vec2 / ivec2 / uvec2 / bvec2 | 8 | 8 | 2 分量向量 |
| vec3 / ivec3 / uvec3 / bvec3 | **16** | **12** | 3 分量向量（特殊规则！） |
| vec4 / ivec4 / uvec4 / bvec4 | 16 | 16 | 4 分量向量 |
| mat2 / mat3 / mat4 | 16 | 32/48/64 | 矩阵按列存储，每列 16 字节 |
| 数组 `T[N]` | 16 | 16*N | 数组元素步长必须是 16 字节 |

### 计算示例

给定以下 std140 布局定义：
```typescript
const fields = [
  { name: 'time', type: Std140Type.FLOAT },          // 偏移 0，大小 4
  { name: 'color', type: Std140Type.VEC3 },          // 需要对齐到 16，偏移 16，大小 12
  { name: 'matrix', type: Std140Type.MAT4 },         // 偏移 32，大小 64
];
```

计算结果：
```
- time:   offset=0,  size=4,   alignment=4
- color:  offset=16, size=12,  alignment=16（对齐填充 12 字节）
- matrix: offset=32, size=64,  alignment=16
- total size: 96（对齐到 16 字节边界）
```

## 4. API 快速参考

### 初始化（自动）

Push Constants UBO 在 `GLRenderPipeline` 构造时自动初始化。着色器需要声明：

```glsl
layout(std140, binding = N) uniform _PushConstants {
  float time;
  vec3 color;
  mat4 matrix;
};
```

### 更新数据

```typescript
// 方法 1：更新单个字段（偏移推送）
const data = new Float32Array([3.14]);  // float 数据
pipeline.updatePushConstants(0, data);  // offset=0（time 字段的偏移）

// 方法 2：更新多个字段（批量）
const allData = new Float32Array(24);   // 总共 96 字节 / 4
allData[0] = 3.14;          // time
allData[4] = 1.0;           // color.x（offset 16/4 = 4）
allData[5] = 0.5;           // color.y
allData[6] = 0.2;           // color.z
// ... 更新 matrix ...
pipeline.flushPushConstants();  // 一次性上传
```

### 绑定和使用

```typescript
// 在绘制前调用
if (pipeline.hasPushConstantsUBO()) {
  pipeline.bindPushConstantsUBO();
}

// 执行绘制
renderPass.drawIndexed(indexCount);
```

## 5. Std140Calculator 工具

### 计算布局

```typescript
const layout = Std140Calculator.calculateLayout([
  { name: 'position', type: Std140Type.VEC3 },
  { name: 'velocity', type: Std140Type.VEC3 },
  { name: 'scale', type: Std140Type.FLOAT },
  { name: 'colors', type: Std140Type.VEC4, arrayLength: 10 },
]);

console.log(layout.totalSize);        // 总字节数
console.log(layout.fieldMap.get('position').offset);  // 字段偏移
```

### 创建和填充缓冲区

```typescript
const buffer = Std140Calculator.createBuffer(layout);  // Float32Array

// 写入标量
Std140Calculator.writeField(buffer, layout, 'scale', 2.0);

// 写入向量
Std140Calculator.writeField(buffer, layout, 'position', [1.0, 2.0, 3.0]);

// 写入数组
const colors = new Array(40).fill(0);  // 10 个 vec4
for (let i = 0; i < 10; i++) {
  colors[i * 4 + 0] = Math.random();
  colors[i * 4 + 1] = Math.random();
  colors[i * 4 + 2] = Math.random();
  colors[i * 4 + 3] = 1.0;
}
Std140Calculator.writeField(buffer, layout, 'colors', colors);
```

## 6. 兼容性和降级

| 后端 | 支持 | 说明 |
|------|------|------|
| WebGL 2.0 | ✅ | 完整支持 UBO |
| WebGL 1.0 | ⚠️ | 降级到标量 uniform（性能较差） |
| WebGPU | ✅ | 原生 push constants |
| Vulkan | ✅ | 原生 push constants |

WebGL 1.0 降级时，控制台会输出警告：
```
[PipelineLabel] WebGL1 不支持 UBO, pushConstants 需要通过标量 uniform 实现。
```

## 7. 性能建议

1. **批量更新**：累积多个字段的更新后，调用 `flushPushConstants()` 一次性上传
2. **避免频繁重新绑定**：仅在切换管线时调用 `bindPushConstantsUBO()`
3. **使用灵活的数据布局**：通过 `Std140Calculator` 计算布局，避免手动计算导致的错误

## 8. 常见错误

### 错误 1：向量对齐不正确
```typescript
// 错误：假设 vec3 占 12 字节，可以紧密排列
const badLayout = [
  { name: 'v1', type: Std140Type.VEC3 },  // offset 0, size 12
  { name: 'f1', type: Std140Type.FLOAT }, // 应该是 offset 12，实际应该是 16！
];
```

正确方式：使用 `Std140Calculator.calculateLayout()` 自动处理对齐。

### 错误 2：矩阵数据格式错误
```typescript
// 错误：按行主序输入（C 风格），但 std140 要求列主序
const wrongMatrix = [
  1, 2, 3, 4,
  5, 6, 7, 8,
  9, 10, 11, 12,
  13, 14, 15, 16,
];

// 正确：按列主序输入
const correctMatrix = [
  1, 5, 9, 13,   // 第 1 列
  2, 6, 10, 14,  // 第 2 列
  3, 7, 11, 15,  // 第 3 列
  4, 8, 12, 16,  // 第 4 列
];
```

### 错误 3：忘记对齐 UBO 起始位置
```typescript
// 错误：数组元素没有 16 字节对齐
const badArrayLayout = [
  { name: 'count', type: Std140Type.INT },           // size 4
  { name: 'values', type: Std140Type.FLOAT, arrayLength: 10 },  // 应该对齐到 16
];

// 正确：Std140Calculator 自动处理
const correctLayout = Std140Calculator.calculateLayout(badArrayLayout);
```
