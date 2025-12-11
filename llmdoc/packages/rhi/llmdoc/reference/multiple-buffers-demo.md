# 多顶点缓冲区 Demo 参考

**演示文件**: `packages/rhi/demo/src/multiple-buffers.ts`
**HTML 页面**: `packages/rhi/demo/html/multiple-buffers.html`

## 1. Identity

- **What it is**: 展示如何将顶点数据分离到多个缓冲区，实现更灵活的顶点属性管理。
- **Purpose**: 演示多缓冲区架构设计，提升渲染性能和灵活性。

## 2. 技术要点

### 多缓冲区架构

```typescript
// 位置缓冲区
const positionBuffer = runner.track(
  runner.device.createBuffer({
    size: positionData.byteLength,
    usage: MSpec.RHIBufferUsage.VERTEX,
    mappedAtCreation: true,
  })
);
positionBuffer.getMappedRange().set(positionData);

// 颜色缓冲区
const colorBuffer = runner.track(
  runner.device.createBuffer({
    size: colorData.byteLength,
    usage: MSpec.RHIBufferUsage.VERTEX,
    mappedAtCreation: true,
  })
);
colorBuffer.getMappedRange().set(colorData);

// 法线缓冲区
const normalBuffer = runner.track(
  runner.device.createBuffer({
    size: normalData.byteLength,
    usage: MSpec.RHIBufferUsage.VERTEX,
    mappedAtCreation: true,
  })
);
normalBuffer.getMappedRange().set(normalData);
```

### 顶点属性绑定配置

```typescript
const vertexBufferLayouts = [
  // 位置属性（缓冲区0）
  {
    arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
    attributes: [
      {
        shaderLocation: 0,
        offset: 0,
        format: MSpec.RHIVertexFormat.FLOAT32x3,
      },
    ],
  },
  // 颜色属性（缓冲区1）
  {
    arrayStride: 4 * Float32Array.BYTES_PER_ELEMENT,
    attributes: [
      {
        shaderLocation: 1,
        offset: 0,
        format: MSpec.RHIVertexFormat.UNORM8x4,
      },
    ],
  },
  // 法线属性（缓冲区2）
  {
    arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
    attributes: [
      {
        shaderLocation: 2,
        offset: 0,
        format: MSpec.RHIVertexFormat.FLOAT32x3,
      },
    ],
  },
];
```

### 着色器代码

```glsl
#version 300 es

in vec3 aPosition;
in vec4 aColor;
in vec3 aNormal;

out vec4 vColor;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

void main() {
  // 顶点颜色直接传递
  vColor = aColor;

  // MVP 变换
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
}
```

## 3. 架构优势

### 性能优化
- **批处理效率**：不同更新的数据分离，减少缓冲区更新开销
- **内存局部性**：相关数据连续存储，提高缓存命中率
- **灵活性**：可以独立更新特定属性而不影响其他数据

### 渲染流程
1. **几何体生成**：使用 GeometryGenerator 生成带有多重属性的几何体
2. **缓冲区创建**：为每种属性创建独立的缓冲区
3. **绑定组配置**：设置多个顶点缓冲区的绑定关系
4. **渲染执行**：使用 setVertexBuffer 绑定多个缓冲区进行绘制

## 4. 实际应用场景

- **大型场景渲染**：复杂的模型包含大量顶点属性
- **动画系统**：需要频繁更新某些顶点属性（如位置、UV）
- **GPU 驱动的渲染**：需要更灵活的数据布局以配合着色器
- **内存受限环境**：通过精确控制数据布局优化内存使用

## 5. 相关文件

- **源代码**: `packages/rhi/demo/src/multiple-buffers.ts`
- **演示页面**: `packages/rhi/demo/html/multiple-buffers.html`
- **着色器实现**: `packages/rhi/demo/src/shaders/multiple-buffers.vert`
- **架构文档**: `/llmdoc/architecture/mvp-matrix-implementation.md`
- **开发指南**: `/packages/rhi/llmdoc/guides/demo-development.md`

## 6. 下一步学习

在理解多顶点缓冲区后，可以继续学习：

1. **动态缓冲区**：`packages/rhi/llmdoc/reference/dynamic-buffer-demo.md`
2. **顶点格式优化**：`packages/rhi/llmdoc/reference/vertex-formats-demo.md`
3. **索引缓冲区**：`packages/rhi/demo/src/quad-indexed.ts`
4. **实例化渲染**（高级）：WebGL2 的实例化绘制功能