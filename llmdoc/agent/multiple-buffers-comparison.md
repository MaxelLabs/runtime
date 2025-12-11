<!-- This entire block is your raw intelligence report for other agents. It is NOT a final document. -->

### Code Sections (The Evidence)

- `/Users/mac/Desktop/project/max/runtime/packages/rhi/demo/src/colored-triangle.ts` (正常工作的Demo): 单缓冲区实现，使用简单的三角形几何体
  - 着色器声明 (第16-17行): 使用标准的 `in vec3 aPosition` 和 `in vec3 aColor`
  - 顶点布局 (第158行): 使用 `geometry.layout` 由 GeometryGenerator 生成
  - 缓冲区绑定 (第219行): `renderPass.setVertexBuffer(0, vertexBuffer)`
  - 绘制调用 (第220行): `renderPass.draw(geometry.vertexCount)` 使用非索引绘制

- `/Users/mac/Desktop/project/max/runtime/packages/rhi/demo/src/multiple-buffers.ts` (黑屏Demo): 多缓冲区实现，使用四面体几何体
  - 着色器声明 (第16-18行): 使用 `layout(location = N)` 限定符
  - 顶点布局 (第225-267行): 手动定义三个缓冲区的布局
  - 缓冲区绑定 (第369-371行): 绑定三个不同的缓冲区到不同槽位
  - 绘制调用 (第377行): `renderPass.drawIndexed(geometry.indexCount)` 使用索引绘制

- `/Users/mac/Desktop/project/max/runtime/packages/rhi/demo/src/utils/geometry/GeometryGenerator.ts` (几何体生成器): 生成标准几何体
  - triangle 方法 (源码未显示): 生成三角形几何体，包含正确的顶点布局
  - 支持索引和非索引两种绘制模式

### Report (The Answers)

#### result

通过对比 `colored-triangle.ts`（正常工作）和 `multiple-buffers.ts`（黑屏），发现以下关键差异：

##### 1. **着色器属性声明差异**
- **colored-triangle.ts**: 使用标准 WebGL 声明方式
  ```glsl
  in vec3 aPosition;
  in vec3 aColor;
  ```
- **multiple-buffers.ts**: 使用 WebGL 的 `layout(location = N)` 声明
  ```glsl
  layout(location = 0) in vec3 aPosition;
  layout(location = 1) in vec3 aColor;
  layout(location = 2) in vec3 aNormal;
  ```

##### 2. **顶点布局定义差异**
- **colored-triangle.ts**: 使用 GeometryGenerator 生成的 layout
  ```typescript
  vertexLayout: geometry.layout,
  ```
- **multiple-buffers.ts**: 手动定义多缓冲区 layout，但缓冲区索引可能有问题
  ```typescript
  buffers: [
    {
      index: 0, // 位置缓冲区
      stride: 12,
      attributes: [{ shaderLocation: 0, ... }],
    },
    {
      index: 1, // 颜色缓冲区
      stride: 12,
      attributes: [{ shaderLocation: 1, ... }],
    },
    {
      index: 2, // 法线缓冲区
      stride: 12,
      attributes: [{ shaderLocation: 2, ... }],
    },
  ],
  ```

##### 3. **绘制方式差异**
- **colored-triangle.ts**: 使用非索引绘制
  ```typescript
  renderPass.draw(geometry.vertexCount);
  ```
- **multiple-buffers.ts**: 使用索引绘制
  ```typescript
  renderPass.drawIndexed(geometry.indexCount);
  ```

##### 4. **几何体复杂度差异**
- **colored-triangle.ts**: 简单的三角形（3个顶点）
- **multiple-buffers.ts**: 四面体（4个顶点，12个索引）

##### 5. **轨道控制器初始距离**
- **colored-triangle.ts**: `distance: 2`
- **multiple-buffers.ts**: `distance: 2.5`（可能过远）

#### conclusions

##### 主要问题诊断：

1. **shaderLocation 与 layout location 不匹配**
   - 着色器使用 `layout(location = N)` 声明
   - 顶点布局也使用 `shaderLocation: N`
   - 但 WebGL 实现可能不支持这种方式，需要统一

2. **多缓冲区索引绑定问题**
   - `setVertexBuffer(slot, buffer)` 中的 slot 必须与顶点布局中的缓冲区索引匹配
   - 当前代码中缓冲区定义的 `index` 属性可能不是正确的属性名

3. **索引缓冲区绑定问题**
   - `drawIndexed` 调用前需要确保索引缓冲区正确绑定
   - 索引格式（`MSpec.RHIIndexFormat.UINT16`）需要与数据类型匹配

4. **法线数据可能不正确**
   - 手动计算的四面体法线可能不准确
   - 归一化后的法线值应该在 [-1, 1] 范围内

#### relations

- 两个 Demo 都使用相同的 `DemoRunner` 框架和渲染循环结构
- 两个 Demo 都使用相同的 MVP 矩阵传递机制（Uniform 缓冲区）
- 关键差异在于顶点数据的组织方式（单缓冲区 vs 多缓冲区）
- `colored-triangle.ts` 依赖 `GeometryGenerator` 生成正确的顶点布局
- `multiple-buffers.ts` 手动定义顶点布局，容易出错

### 修复建议

#### 1. 统一着色器属性声明方式
```glsl
// 移除 layout(location = N) 限定符，使用标准声明
in vec3 aPosition;   // 位置属性（location 由 shaderLocation 决定）
in vec3 aColor;      // 颜色属性
in vec3 aNormal;     // 法线属性
```

#### 2. 修正顶点布局定义
```typescript
const vertexLayout: MSpec.RHIVertexLayout = {
  buffers: [
    {
      arrayStride: 12, // 移除 index 属性，使用默认顺序
      stepMode: 'vertex',
      attributes: [
        {
          shaderLocation: 0, // 对应 aPosition
          offset: 0,
          format: MSpec.RHIVertexFormat.FLOAT32x3,
        },
      ],
    },
    // ... 其他缓冲区类似
  ],
};
```

#### 3. 添加调试信息
```typescript
// 在渲染循环中添加
console.log('Drawing', geometry.indexCount, 'indices');
console.log('Position buffer size:', positionBuffer.size);
console.log('Index buffer size:', indexBuffer.size);
```

#### 4. 验证几何体数据
```typescript
// 验证法线是否归一化
for (let i = 0; i < geometry.normals.length; i += 3) {
  const n = [geometry.normals[i], geometry.normals[i+1], geometry.normals[i+2]];
  const len = Math.sqrt(n[0]*n[0] + n[1]*n[1] + n[2]*n[2]);
  if (Math.abs(len - 1.0) > 0.001) {
    console.warn('Normal not normalized:', n, 'length:', len);
  }
}
```

#### 5. 简化测试
先使用与 colored-triangle 相同的三角形几何体，确保多缓冲区渲染工作正常，再切换到四面体。