# 多顶点缓冲区 Demo 参考

本文档提供多顶点缓冲区架构的完整实现参考，展示如何将顶点数据分离到不同的缓冲区中。

## 1. 核心架构

### 多缓冲区设计

多顶点缓冲区架构允许将不同的顶点属性（位置、颜色、法线等）存储在独立的缓冲区中，通过 `setVertexBuffer(slot, buffer)` 绑定到不同的槽位。

```typescript
// 创建三个独立的顶点缓冲区
const positionBuffer = runner.track(
  runner.device.createBuffer({
    size: geometry.positions.byteLength,
    usage: MSpec.RHIBufferUsage.VERTEX,
    hint: 'static',
    initialData: geometry.positions as BufferSource,
    label: 'Position Buffer',
  })
);

const colorBuffer = runner.track(
  runner.device.createBuffer({
    size: geometry.colors.byteLength,
    usage: MSpec.RHIBufferUsage.VERTEX,
    hint: 'static',
    initialData: geometry.colors as BufferSource,
    label: 'Color Buffer',
  })
);

const normalBuffer = runner.track(
  runner.device.createBuffer({
    size: geometry.normals.byteLength,
    usage: MSpec.RHIBufferUsage.VERTEX,
    hint: 'static',
    initialData: geometry.normals as BufferSource,
    label: 'Normal Buffer',
  })
);
```

### 顶点布局配置

在顶点布局中定义每个缓冲区的槽位和属性：

```typescript
const vertexLayout: MSpec.RHIVertexLayout = {
  buffers: [
    {
      index: 0, // 位置缓冲区
      stride: 12, // 3 * 4 bytes
      stepMode: 'vertex',
      attributes: [
        {
          name: 'aPosition',
          format: MSpec.RHIVertexFormat.FLOAT32x3,
          offset: 0,
          shaderLocation: 0,
        },
      ],
    },
    {
      index: 1, // 颜色缓冲区
      stride: 12, // 3 * 4 bytes
      stepMode: 'vertex',
      attributes: [
        {
          name: 'aColor',
          format: MSpec.RHIVertexFormat.FLOAT32x3,
          offset: 0,
          shaderLocation: 1,
        },
      ],
    },
    {
      index: 2, // 法线缓冲区
      stride: 12, // 3 * 4 bytes
      stepMode: 'vertex',
      attributes: [
        {
          name: 'aNormal',
          format: MSpec.RHIVertexFormat.FLOAT32x3,
          offset: 0,
          shaderLocation: 2,
        },
      ],
    },
  ],
};
```

## 2. 渲染管线设置

### 着色器实现

着色器需要声明来自不同缓冲区的顶点属性：

```glsl
// 顶点着色器
layout(location = 0) in vec3 aPosition;  // 来自 buffer 0
layout(location = 1) in vec3 aColor;     // 来自 buffer 1
layout(location = 2) in vec3 aNormal;    // 来自 buffer 2

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

out vec3 vColor;
out vec3 vNormal;
out vec3 vPosition;

void main() {
  vColor = aColor;
  vPosition = aPosition;
  vNormal = mat3(uModelMatrix) * aNormal;

  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
```

### 绑定缓冲区

在渲染过程中绑定多个顶点缓冲区：

```typescript
// 绑定三个顶点缓冲区到不同的槽位
renderPass.setVertexBuffer(0, positionBuffer);
renderPass.setVertexBuffer(1, colorBuffer);
renderPass.setVertexBuffer(2, normalBuffer);

// 绑定索引缓冲区
renderPass.setIndexBuffer(indexBuffer, MSpec.RHIIndexFormat.UINT16);

// 使用索引缓冲区进行绘制
renderPass.drawIndexed(geometry.indexCount);
```

## 3. 顶点数据结构

### 数据分离原则

每个顶点属性独立存储：
- 位置数据：包含 x, y, z 坐标
- 颜色数据：包含 r, g, b 颜色值
- 法线数据：包含 nx, ny, nz 法线方向

```typescript
function generateTetrahedronData() {
  // 四面体顶点位置
  const positions = [
    -0.5, -0.4, 0.5,
    0.5, -0.4, 0.5,
    0.0, -0.4, -0.5,
    0.0, 0.5, 0.0,
  ];

  // 颜色数据
  const colors = [
    1.0, 0.2, 0.2, // 红色
    0.2, 1.0, 0.2, // 绿色
    0.2, 0.2, 1.0, // 蓝色
    1.0, 1.0, 0.2, // 黄色
  ];

  // 法线数据
  const normals = [
    -0.707, -0.707, 0.0,
    0.707, -0.707, 0.0,
    0.0, -0.707, -0.707,
    0.0, 0.707, 0.0,
  ];

  // 面索引
  const indices = [
    0, 1, 2, // 底面
    0, 3, 1, // 前面
    0, 2, 3, // 左面
    1, 3, 2, // 右面
  ];

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    vertexCount: 4,
    indexCount: indices.length,
  };
}
```

## 4. 技术优势

### 内存布局优化

- **独立管理**：每个属性类型独立管理，便于更新和复用
- **灵活扩展**：可轻松添加新的顶点属性而不影响现有数据
- **缓存友好**：GPU 可以更好地利用缓存，提高渲染效率

### 性能考虑

- **批量更新**：可单独更新某个属性缓冲区而不影响其他
- **属性复用**：相同属性可在不同几何体间复用
- **内存对齐**：每个缓冲区使用适当的数据类型确保对齐

## 5. 使用场景

- **大型场景**：复杂模型的顶点数据分离
- **动画系统**：需要单独更新位置或法线
- **动态光照**：法线数据的实时更新
- **多材质**：颜色数据的动态变化

## 6. 源码位置

- **Demo 实现**：`packages/rhi/demo/src/multiple-buffers.ts`
- **HTML 页面**：`packages/rhi/demo/html/multiple-buffers.html`
- **Demo 演示**：`packages/rhi/demo/html/multiple-buffers.html`

## 7. 常见问题与解决方案

### 黑屏问题修复

**问题**: 多顶点缓冲区绑定后出现黑屏，几何体无法正确渲染。

**原因**: `GLRenderPipeline.applyVertexBufferLayout` 方法在每次调用时会禁用所有已启用的顶点属性，导致多缓冲区绑定时只有最后一个缓冲区的属性保持启用状态。

**解决方案**: 修复了顶点属性管理逻辑，移除了不必要的 `disableVertexAttribArray` 循环。现在每个顶点属性可以独立启用，互不干扰。

**技术细节**:
- 修复位置: `packages/rhi/src/webgl/pipeline/GLRenderPipeline.ts:560-563`
- 修复时间: 2024-12-11
- 影响范围: 所有使用多顶点缓冲区的应用

### 调试技巧

1. **验证缓冲区绑定**:
```typescript
// 在渲染前检查每个缓冲区是否正确绑定
console.log('Position buffer slot:', 0);
console.log('Color buffer slot:', 1);
console.log('Normal buffer slot:', 2);
```

2. **检查顶点属性位置**:
```typescript
// 验证着色器中的属性位置与布局匹配
console.log('aPosition location:', gl.getAttribLocation(program, 'aPosition'));
console.log('aColor location:', gl.getAttribLocation(program, 'aColor'));
console.log('aNormal location:', gl.getAttribLocation(program, 'aNormal'));
```

3. **验证数据传递**:
```typescript
// 在着色器中添加调试输出
gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
// 调试时可以输出固定颜色验证渲染管线
vColor = vec3(1.0, 0.0, 0.0); // 红色调试
```

## 8. 相关文档

- [顶点缓冲区参考](../reference/rhi-interfaces.md#顶点缓冲区接口)
- [顶点布局规范](../reference/rhi-interfaces.md#顶点布局接口)
- [渲染管线创建](../reference/rhi-interfaces.md#渲染管线接口)
- [动态缓冲区 Demo](../reference/dynamic-buffer-demo.md)
- [问题调查报告](../../agent/multiple-buffers-demo-black-screen-investigation.md) - 完整的问题分析和修复过程