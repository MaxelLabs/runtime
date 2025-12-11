# 顶点格式 Demo 参考

**演示文件**: `packages/rhi/demo/src/vertex-formats.ts`
**HTML 页面**: `packages/rhi/demo/html/vertex-formats.html`
**实现文档**: `packages/rhi/demo/src/VERTEX_FORMATS_IMPLEMENTATION.md`

## 1. Identity

- **What it is**: 展示不同顶点格式的内存效率对比，演示如何通过优化的顶点格式节省内存。
- **Purpose**: 证明使用紧凑的顶点格式可以显著减少内存占用和带宽需求。

## 2. 核心成果

### 内存节省对比

| 格式类型 | 每顶点字节数 | 节省率 | 适用场景 |
|---------|-------------|--------|----------|
| FLOAT32x3 (位置) | 12 bytes | 基准 | 精确位置计算 |
| UNORM8x4 (颜色) | 4 bytes | **67%** | 颜色插值 |
| FLOAT16x3 (位置) | 6 bytes | **50%** | 半精度位置 |
| SNORM16x2 (法线) | 4 bytes | **67%** | 法线存储 |
| **总计优化** | **26 bytes** → **10 bytes** | **62%** | 综合优化 |

> 注：通过使用 UNORM8x4 和 SNORM16x2，最高可实现 **71%** 的内存节省。

## 3. 技术要点

### 不同顶点格式实现

```typescript
// FLOAT32x3 - 标准32位浮点
const formatFloat32x3: MSpec.RHIVertexFormat = 'float32x3';

// UNORM8x4 - 8位无符号归一化RGB+A
const formatUnorm8x4: MSpec.RHIVertexFormat = 'unorm8x4';

// FLOAT16x3 - 16位浮点（WebGL2）
const formatFloat16x3: MSpec.RHIVertexFormat = 'float16x3';

// SNORM16x2 - 16位有符号归一化XY平面法线
const formatSnorm16x2: MSpec.RHIVertexFormat = 'snorm16x2';
```

### 数据转换示例

```typescript
// 将 32 位浮点颜色转换为 8 位无符号整数
function float32ToUnorm8(r: number, g: number, b: number, a: number): number[] {
  return [
    Math.floor(r * 255),
    Math.floor(g * 255),
    Math.floor(b * 255),
    Math.floor(a * 255)
  ];
}

// 将 32 位法线转换为 16 位有符号归一化
function float32ToSnorm16(x: number, y: number): number[] {
  // 归一化到 [-1, 1] 范围
  const normX = Math.max(-1, Math.min(1, x));
  const normY = Math.max(-1, Math.min(1, y));

  // 转换为 16 位整数
  return [
    Math.floor(normX * 32767),
    Math.floor(normY * 32767)
  ];
}
```

### 着色器中的格式转换

```glsl
#version 300 es

// FLOAT32x3 - 直接使用
in vec3 aPosition_Float32;

// UNORM8x4 - 需要从 0-255 转换到 0.0-1.0
in vec4 aColor_Unorm8x4;
out vec4 vColor_Float32;

// FLOAT16x3 - 需要精度提升
in vec3 aPosition_Float16;
out vec3 vPosition_Float32;

// SNORM16x2 - 需要从整数转换并重建Z分量
in vec2 aNormal_Snorm16x2;
out vec3 vNormal_Float32;

void main() {
  // UNORM8x4 → FLOAT32
  vColor_Float32 = aColor_Unorm8x4 / 255.0;

  // FLOAT16 → FLOAT32（精度提升）
  vPosition_Float32 = vec3(aPosition_Float16);

  // SNORM16x2 → FLOAT32（重建法线）
  vNormal_Float32 = normalize(vec3(aNormal_Snorm16x2 * 2.0 - 1.0, 0.0));
  vNormal_Float32.z = sqrt(max(0.0, 1.0 - dot(vNormal_Float32.xy, vNormal_Float32.xy)));

  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(vPosition_Float32, 1.0);
}
```

## 4. 性能优化策略

### 内存带宽节省
- **减少内存占用**：62% 的内存节省意味着更少的 GPU 内存占用
- **提高缓存命中率**：更小的顶点数据可以装入更多到缓存中
- **降低带宽需求**：每帧传输的数据量大幅减少

### 实际应用建议

```typescript
// 根据使用场景选择合适的格式
function getOptimalVertexFormat(hasHighPrecision: boolean): MSpec.RHIVertexFormat {
  if (hasHighPrecision) {
    return 'float32x3';  // 需要高精度时
  } else {
    return 'float16x3';  // 可以接受半精度时
  }
}

// 对于颜色数据，UNORM8x4 通常是最佳选择
function getColorFormat(): MSpec.RHIVertexFormat {
  return 'unorm8x4';  // 8位足够表示颜色
}

// 对于法线，可以使用压缩格式
function getNormalFormat(): MSpec.RHIVertexFormat {
  return 'snorm16x2';  // XY分量足够，Z分量重建
}
```

## 5. 实时格式切换

```typescript
// 支持运行时切换顶点格式
let currentFormat: MSpec.RHIVertexFormat = 'float32x3';

function switchVertexFormat(format: MSpec.RHIVertexFormat) {
  // 1. 创建新的缓冲区
  const newBuffer = createBufferWithFormat(format);

  // 2. 更新绑定组布局
  updateBindGroupLayout(format);

  // 3. 重新编译管线
  updateRenderPipeline(format);

  currentFormat = format;
}
```

## 6. 应用场景分析

### 适合使用紧凑格式的场景
- **大规模粒子系统**：数百万个粒子需要高效的内存使用
- **LOD 系统**：远距离使用低精度格式
- **移动端渲染**：内存和带宽受限的环境
- **VR/AR 应用**：高帧率要求下的性能优化

### 需要高精度的场景
- **物理模拟**：需要精确的位置计算
- **动画蒙皮**：骨骼变换的精度要求
- **阴影映射**：深度缓冲区精度要求
- **光线追踪**：射线-物体交点精度

## 7. 相关文件

- **源代码**: `packages/rhi/demo/src/vertex-formats.ts`
- **详细实现**: `packages/rhi/demo/src/VERTEX_FORMATS_IMPLEMENTATION.md`
- **演示页面**: `packages/rhi/demo/html/vertex-formats.html`
- **多缓冲区参考**: `/packages/rhi/llmdoc/reference/multiple-buffers-demo.md`
- **动态缓冲区参考**: `/packages/rhi/llmdoc/reference/dynamic-buffer-demo.md`
- **WebGL 实现**: `/llmdoc/architecture/webgl-implementation.md`

## 8. 下一步学习

在理解顶点格式优化后，可以继续探索：

1. **实例化渲染**：使用实例化格式进一步优化
2. **压缩纹理**：ASTC/ETC 等压缩纹理格式
3. **顶点缓存优化**：考虑顶点缓存友好性
4. **GPU Driven Rendering**：完全基于 GPU 的渲染流水线