# 动态缓冲区 Demo 参考

本文档提供动态缓冲区架构的完整实现参考，展示如何使用 `DYNAMIC_DRAW` hint 进行顶点缓冲区的实时更新。

## 1. 核心架构

### 动态缓冲区创建

动态缓冲区用于频繁更新的场景，如动画、物理模拟等：

```typescript
// 创建动态缓冲区
const vertexBuffer = runner.track(
  runner.device.createBuffer({
    size: VERTEX_COUNT * STRIDE,
    usage: MSpec.RHIBufferUsage.VERTEX,
    hint: 'dynamic',  // 使用 DYNAMIC_DRAW hint
    label: 'Dynamic Vertex Buffer',
  })
);

// 创建索引缓冲区（静态）
const indexBuffer = runner.track(
  runner.device.createBuffer({
    size: INDICES.byteLength,
    usage: MSpec.RHIBufferUsage.INDEX,
    hint: 'static',
    initialData: INDICES,
    label: 'Static Index Buffer',
  })
);
```

### 数据更新流程

动态缓冲区需要每帧更新数据：

```typescript
// 1. 准备更新数据
const positions = new Float32Array(VERTEX_COUNT * 3);

// 2. 生成波浪动画
function updateWave(time: number) {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const idx = i * GRID_SIZE + j;
      const x = (i - GRID_SIZE / 2) * SPACING;
      const z = (j - GRID_SIZE / 2) * SPACING;

      // 使用正弦函数创建波浪效果
      const y = Math.sin(time + x * 0.5) * Math.cos(time + z * 0.5) * 0.3;

      positions[idx * 3] = x;     // x
      positions[idx * 3 + 1] = y;  // y
      positions[idx * 3 + 2] = z;  // z
    }
  }
  return positions;
}

// 3. 每帧更新
runner.start((dt) => {
  // 更新波浪数据
  const waveData = updateWave(time);

  // 更新缓冲区
  vertexBuffer.update(waveData, 0);

  // 渲染...
});
```

## 2. 渲染管线设置

### 顶点布局

使用简单的单一顶点布局：

```typescript
const vertexLayout: MSpec.RHIVertexLayout = {
  buffers: [
    {
      index: 0,
      stride: 12, // 3 * 4 bytes (vec3)
      stepMode: 'vertex',
      attributes: [
        {
          name: 'aPosition',
          format: MSpec.RHIVertexFormat.FLOAT32x3,
          offset: 0,
          shaderLocation: 0,
        },
        {
          name: 'aNormal',
          format: MSpec.RHIVertexFormat.FLOAT32x3,
          offset: 0,
          shaderLocation: 1,
        },
        {
          name: 'aColor',
          format: MSpec.RHIVertexFormat.FLOAT32x3,
          offset: 0,
          shaderLocation: 2,
        },
      ],
    },
  ],
};
```

### 着色器实现

着色器处理动态更新的顶点数据：

```glsl
// 顶点着色器
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aColor;

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
  vNormal = aNormal;
  vPosition = aPosition;

  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
```

## 3. 动画实现

### 波浪效果算法

使用双正弦函数创建平滑的波浪效果：

```typescript
function updateWave(time: number) {
  const positions = new Float32Array(GRID_SIZE * GRID_SIZE * 3);
  const colors = new Float32Array(GRID_SIZE * GRID_SIZE * 3);
  const normals = new Float32Array(GRID_SIZE * GRID_SIZE * 3);

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const idx = i * GRID_SIZE + j;
      const x = (i - GRID_SIZE / 2) * SPACING;
      const z = (j - GRID_SIZE / 2) * SPACING;

      // 计算波浪高度
      const y = Math.sin(time + x * 0.5) * Math.cos(time + z * 0.5) * 0.3;

      // 设置位置
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;

      // 设置颜色（根据高度渐变）
      const colorIntensity = (y + 0.3) / 0.6; // 归一化到 0-1
      colors[idx * 3] = colorIntensity;        // R
      colors[idx * 3 + 1] = 0.5;              // G
      colors[idx * 3 + 2] = 1.0 - colorIntensity; // B

      // 设置法线（简化计算）
      normals[idx * 3] = 0;
      normals[idx * 3 + 1] = 1;
      normals[idx * 3 + 2] = 0;
    }
  }

  return { positions, colors, normals };
}
```

### 渲染循环

完整的动态更新渲染循环：

```typescript
let time = 0;

runner.start((dt) => {
  // 更新时间和动画
  time += dt * 2; // 控制动画速度

  // 更新相机
  orbit.update(dt);

  // 开始性能统计
  stats.begin();

  // 更新动态数据
  const { positions, colors, normals } = updateWave(time);

  // 更新缓冲区
  positionBuffer.update(positions, 0);
  colorBuffer.update(colors, 0);
  normalBuffer.update(normals, 0);

  // 渲染
  const { encoder, passDescriptor } = runner.beginFrame();

  // 绑定管线
  encoder.setPipeline(renderPipeline);

  // 绑定缓冲区
  renderPass.setVertexBuffer(0, positionBuffer);
  renderPass.setVertexBuffer(1, colorBuffer);
  renderPass.setVertexBuffer(2, normalBuffer);
  renderPass.setIndexBuffer(indexBuffer, MSpec.RHIIndexFormat.UINT16);

  // 设置 Uniform
  const transformData = new Float32Array(64);
  transformData.set(modelMatrix.toArray(), 0);
  transformData.set(orbit.getViewMatrix(), 16);
  transformData.set(
    orbit.getProjectionMatrix(runner.width / runner.height),
    32
  );
  transformBuffer.update(transformData, 0);
  encoder.setBindGroup(0, bindGroup);

  // 绘制
  renderPass.drawIndexed(INDICES.length);

  runner.endFrame(encoder);

  // 结束性能统计
  stats.end();
});
```

## 4. 性能优化

### Buffer Hint 选择

- `'dynamic'` - 适用于频繁更新的缓冲区
- `'static'` - 适用于一次性写入的数据
- `'stream'` - 适用于单次使用的数据

### 更新策略

1. **局部更新**：使用 `offset` 参数只更新变化的数据
2. **批量更新**：合并多个更新为一次操作
3. **交错布局**：将相关数据放在同一缓冲区中

```typescript
// 局部更新示例
const partialData = new Float32Array(3); // 只更新3个float
vertexBuffer.update(partialData, 12);     // 从第12字节开始更新
```

## 5. 使用场景

### 适用场景

- **波浪动画**：水面、旗帜、布料模拟
- **粒子系统**：大量粒子的实时位置更新
- **变形动画**：网格的形变和扭曲
- **程序化几何**：实时生成的几何体

### 不适用场景

- **静态物体**：一次性创建的几何体
- **稀疏更新**：大部分时间不变化的数据
- **高频率小更新**：应使用其他优化策略

## 6. 源码位置

- **Demo 实现**：`packages/rhi/demo/src/dynamic-buffer.ts`
- **HTML 页面**：`packages/rhi/demo/html/dynamic-buffer.html`
- **Demo 演示**：`packages/rhi/demo/html/dynamic-buffer.html`

## 7. 相关文档

- [顶点缓冲区接口](../reference/rhi-interfaces.md#顶点缓冲区接口)
- [渲染管线创建](../reference/rhi-interfaces.md#渲染管线接口)
- [多顶点缓冲区 Demo](../reference/multiple-buffers-demo.md)
- [Demo 开发指南](../guides/demo-development.md)