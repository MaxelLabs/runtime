# 动态缓冲区 Demo 参考

**演示文件**: `packages/rhi/demo/src/dynamic-buffer.ts`
**HTML 页面**: `packages/rhi/demo/html/dynamic-buffer.html`

## 1. Identity

- **What it is**: 展示如何实时更新顶点缓冲区数据，创建流畅的动画效果。
- **Purpose**: 演示动态缓冲区的使用，适用于需要每帧修改顶点数据的场景。

## 2. 技术要点

### 动态缓冲区创建

```typescript
// 创建动态缓冲区
const waveBuffer = runner.track(
  runner.device.createBuffer({
    size: vertexCount * 3 * Float32Array.BYTES_PER_ELEMENT,
    usage: MSpec.RHIBufferUsage.VERTEX,
    hint: 'dynamic',  // 关键：告诉驱动此缓冲区将频繁更新
    label: 'Wave Animation Buffer',
  })
);
```

### 实时数据更新

```typescript
// 渲染循环中更新顶点位置
runner.start((dt) => {
  // 1. 计算新的顶点位置
  const newPositions = new Float32Array(originalPositions);
  for (let i = 0; i < vertexCount; i++) {
    const x = originalPositions[i * 3];
    const z = originalPositions[i * 3 + 2];

    // 使用正弦函数创建波浪效果
    const waveHeight = Math.sin(x * frequency + time) * amplitude;
    const waveHeight2 = Math.cos(z * frequency2 + time * 0.7) * amplitude2;

    newPositions[i * 3 + 1] = baseY + waveHeight + waveHeight2;
  }

  // 2. 更新缓冲区
  waveBuffer.update(newPositions, 0);

  // 3. 渲染...
});
```

### 着色器中的波浪效果

```glsl
#version 300 es

in vec3 aPosition;
in vec3 aColor;

out vec3 vColor;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};
uniform float uTime;  // 时间uniform，用于同步波浪动画

void main() {
  // 在着色器中也可以添加额外的波浪效果
  vec3 position = aPosition;
  position.y += sin(position.x * 3.0 + uTime) * 0.1;
  position.y += cos(position.z * 2.0 + uTime * 0.8) * 0.05;

  vColor = aColor;

  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(position, 1.0);
}
```

## 3. 性能优化技巧

### hint: 'dynamic' 的作用
- **提示驱动程序**：告诉此缓冲区将频繁更新
- **优化内存分配**：使用适合动态更新的内存池
- **减少延迟**：避免某些同步操作

### 更新策略
```typescript
// 批量更新而非逐个更新
waveBuffer.update(entireVertexArray, 0);

// 避免不必要的映射
// ❌ 不推荐：map/unmap 每帧
const mapped = waveBuffer.getMappedRange();
mapped.set(data);
waveBuffer.unmap();

// ✅ 推荐：使用 update 方法
waveBuffer.update(data, 0);
```

## 4. 动画控制参数

```typescript
// 可调节的动画参数
const animationParams = {
  frequency: 2.0,      // 波浪频率
  amplitude: 0.3,      // 波浪振幅
  speed: 1.0,          // 动画速度
  damping: 0.95,       // 阻尼系数
  waveCount: 3,        // 波浪数量
};

// 通过 GUI 控制
gui.add('frequency', {
  value: animationParams.frequency,
  min: 0.1,
  max: 5.0,
  step: 0.1,
  onChange: (v) => animationParams.frequency = v
});
```

## 5. 实际应用场景

- **水面模拟**：真实的波浪和涟漪效果
- **旗帜飘动**：布料的动态变形
- **粒子系统**：粒子的生命周期运动
- **变形动画**：模型的 morph 目标动画
- **程序化生成**：实时生成的地形和高度场

## 6. 性能监控

```typescript
// 在 Stats 中监控更新性能
stats.addBufferUpdateTime(() => {
  waveBuffer.update(newPositions, 0);
});

// 监控内存带宽使用
const stats = {
  bytesPerFrame: newPositions.byteLength,
  updatesPerSecond: 60,
  bandwidthGBps: (newPositions.byteLength * 60) / (1024 * 1024 * 1024)
};
```

## 7. 相关文件

- **源代码**: `packages/rhi/demo/src/dynamic-buffer.ts`
- **演示页面**: `packages/rhi/demo/html/dynamic-buffer.html`
- **着色器实现**: `packages/rhi/demo/src/shaders/dynamic-buffer.vert`
- **开发指南**: `/packages/rhi/llmdoc/guides/demo-development.md`
- **多缓冲区参考**: `/packages/rhi/llmdoc/reference/multiple-buffers-demo.md`

## 8. 下一步学习

在掌握动态缓冲区后，可以继续探索：

1. **顶点格式优化**：`packages/rhi/llmdoc/reference/vertex-formats-demo.md`
2. **GPU 驱动动画**：使用 transform feedback 进行动画计算
3. **物理模拟**：在着色器中实现简单的物理效果
4. **程序化内容**：结合噪声函数生成复杂动画