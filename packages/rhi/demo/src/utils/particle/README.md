# Particle System Module

GPU 加速的粒子系统，支持大规模粒子渲染（烟雾、火焰、爆炸、雨雪等效果）。

## 核心特性

- ✅ **预分配粒子池**：默认 10000 个粒子，避免运行时内存分配
- ✅ **实例化渲染**：基于 InstancedRenderer 的批量渲染
- ✅ **Billboard 效果**：粒子始终面向相机
- ✅ **多种发射器形状**：点、盒、球、锥
- ✅ **生命周期动画**：颜色、大小、透明度渐变
- ✅ **力场支持**：重力、风力、涡流、吸引器
- ✅ **透明混合**：Alpha 混合和加法混合

## 快速开始

### 1. 基础用法

```typescript
import { ParticleBuffer, ParticleEmitter, ParticleRenderer } from '@maxellabs/rhi-demo/utils';

// 创建粒子缓冲区
const particleBuffer = runner.track(new ParticleBuffer(runner.device, {
  maxParticles: 10000,
  label: 'MyParticles',
}));

// 创建发射器
const emitter = new ParticleEmitter(particleBuffer, {
  shape: 'point',
  rate: 100, // 100 粒子/秒
  lifetime: 5.0,
  velocity: new Float32Array([0, 5, 0]),
  velocityVariance: new Float32Array([2, 1, 2]),
  color: new Float32Array([1, 0.5, 0, 1]),
  size: 0.1,
});

// 创建渲染器
const renderer = runner.track(new ParticleRenderer(runner.device, particleBuffer, {
  billboardSize: 0.1,
  blendMode: 'alpha',
}));

// 每帧更新
runner.start((dt) => {
  // 发射新粒子
  emitter.update(dt);

  // 更新粒子状态
  particleBuffer.update(dt);

  // 上传到 GPU
  particleBuffer.uploadToGPU();

  // 渲染
  renderPass.setPipeline(pipeline);
  renderer.render(renderPass);
});
```

### 2. 创建渲染管线

```typescript
import { particleVertexShader, particleFragmentShader } from '@maxellabs/rhi-demo/utils';

// 获取顶点布局
const vertexBufferLayouts = renderer.getVertexBufferLayouts();

// 创建着色器
const vertexShader = runner.device.createShaderModule({
  label: 'Particle Vertex Shader',
  code: particleVertexShader,
});

const fragmentShader = runner.device.createShaderModule({
  label: 'Particle Fragment Shader',
  code: particleFragmentShader,
});

// 创建管线
const pipeline = runner.device.createRenderPipeline({
  label: 'Particle Pipeline',
  vertex: {
    module: vertexShader,
    entryPoint: 'main',
    buffers: vertexBufferLayouts,
  },
  fragment: {
    module: fragmentShader,
    entryPoint: 'main',
    targets: [
      {
        format: runner.getSwapChainFormat(),
        blend: renderer.getBlendState(), // 自动获取混合状态
      },
    ],
  },
  primitive: {
    topology: 'triangle-list',
    cullMode: 'none', // 粒子不需要背面剔除
  },
  depthStencil: {
    format: 'depth24plus',
    depthWriteEnabled: false, // 粒子不写入深度
    depthCompare: 'less',
  },
});
```

### 3. 生命周期动画

```typescript
import { ParticleAnimator } from '@maxellabs/rhi-demo/utils';

const animator = new ParticleAnimator(particleBuffer, {
  // 颜色渐变：黄色 -> 红色透明
  colorOverLifetime: {
    start: new Float32Array([1, 1, 0, 1]),
    end: new Float32Array([1, 0, 0, 0]),
  },
  // 大小渐变：小 -> 大
  sizeOverLifetime: {
    start: 0.1,
    end: 0.5,
  },
  // 透明度渐变：不透明 -> 透明
  alphaOverLifetime: {
    start: 1.0,
    end: 0.0,
  },
});

// 每帧更新动画
runner.start((dt) => {
  emitter.update(dt);
  particleBuffer.update(dt);
  animator.update(dt); // 应用动画
  particleBuffer.uploadToGPU();
});
```

### 4. 力场效果

```typescript
// 添加重力
animator.addForceField({
  type: 'gravity',
  strength: 9.8,
});

// 添加风力
animator.addForceField({
  type: 'wind',
  strength: 5.0,
  direction: new Float32Array([1, 0, 0]),
});

// 添加涡流
animator.addForceField({
  type: 'vortex',
  strength: 10.0,
  position: new Float32Array([0, 0, 0]),
  radius: 5.0,
});

// 添加吸引器
animator.addForceField({
  type: 'attractor',
  strength: 15.0,
  position: new Float32Array([0, 5, 0]),
  radius: 10.0,
});
```

## 发射器形状

### 点发射器（Point）

所有粒子从同一点发射。

```typescript
const emitter = new ParticleEmitter(particleBuffer, {
  shape: 'point',
  position: new Float32Array([0, 0, 0]),
  // ...
});
```

### 盒发射器（Box）

粒子在盒内随机位置发射。

```typescript
const emitter = new ParticleEmitter(particleBuffer, {
  shape: 'box',
  position: new Float32Array([0, 0, 0]),
  emitterSize: new Float32Array([2, 2, 2]), // 盒子尺寸
  // ...
});
```

### 球发射器（Sphere）

粒子在球面上随机位置发射。

```typescript
const emitter = new ParticleEmitter(particleBuffer, {
  shape: 'sphere',
  position: new Float32Array([0, 0, 0]),
  emitterSize: new Float32Array([1, 0, 0]), // [0] = 半径
  // ...
});
```

### 锥发射器（Cone）

粒子在锥体内随机位置发射。

```typescript
const emitter = new ParticleEmitter(particleBuffer, {
  shape: 'cone',
  position: new Float32Array([0, 0, 0]),
  emitterSize: new Float32Array([0.5, 2, 0]), // [0] = 半径, [1] = 高度
  // ...
});
```

## 混合模式

### Alpha 混合（适合烟雾、雨雪）

```typescript
const renderer = new ParticleRenderer(runner.device, particleBuffer, {
  blendMode: 'alpha',
});
```

### 加法混合（适合火焰、爆炸）

```typescript
const renderer = new ParticleRenderer(runner.device, particleBuffer, {
  blendMode: 'additive',
});
```

## 性能优化

### 1. 预分配粒子池

```typescript
const particleBuffer = new ParticleBuffer(runner.device, {
  maxParticles: 10000, // 根据需求调整
});
```

### 2. 批量更新

```typescript
// ✅ 好：每帧一次批量上传
particleBuffer.uploadToGPU();

// ❌ 差：每个粒子单独上传
for (let i = 0; i < count; i++) {
  particleBuffer.uploadToGPU(); // 不要这样做！
}
```

### 3. 控制发射速率

```typescript
const emitter = new ParticleEmitter(particleBuffer, {
  rate: 100, // 100 粒子/秒（根据性能调整）
  // ...
});
```

## 内存布局

### 粒子数据（CPU）

每个粒子 64 bytes（std140 对齐）：

```
[0-15]   vec3 position + padding (16 bytes)
[16-31]  vec3 velocity + padding (16 bytes)
[32-47]  vec4 color (16 bytes)
[48-51]  float life (4 bytes)
[52-55]  float size (4 bytes)
[56-59]  float age (4 bytes)
[60-63]  padding (4 bytes)
```

### 实例数据（GPU）

每个实例 40 bytes（用于渲染）：

```
[0-15]   vec3 position + padding (16 bytes)
[16-31]  vec4 color (16 bytes)
[32-35]  float size (4 bytes)
[36-39]  padding (4 bytes)
```

## 着色器接口

### 顶点着色器输入

```glsl
// Buffer 0 (per-vertex)
layout(location = 0) in vec3 aPosition;    // Billboard 局部坐标
layout(location = 1) in vec2 aTexCoord;    // UV 坐标

// Buffer 1 (per-instance)
layout(location = 2) in vec3 instancePosition; // 粒子世界位置
layout(location = 3) in vec4 instanceColor;    // 粒子颜色
layout(location = 4) in float instanceSize;    // 粒子大小
```

### Uniform Buffer

```glsl
uniform Transforms {
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};
```

## 示例效果

### 烟雾效果

```typescript
const emitter = new ParticleEmitter(particleBuffer, {
  shape: 'point',
  rate: 50,
  lifetime: 3.0,
  velocity: new Float32Array([0, 2, 0]),
  velocityVariance: new Float32Array([0.5, 0.5, 0.5]),
  color: new Float32Array([0.8, 0.8, 0.8, 0.5]),
  size: 0.2,
});

const animator = new ParticleAnimator(particleBuffer, {
  sizeOverLifetime: { start: 0.2, end: 0.8 },
  alphaOverLifetime: { start: 0.5, end: 0.0 },
});
```

### 火焰效果

```typescript
const emitter = new ParticleEmitter(particleBuffer, {
  shape: 'cone',
  rate: 200,
  lifetime: 1.0,
  velocity: new Float32Array([0, 5, 0]),
  velocityVariance: new Float32Array([1, 1, 1]),
  color: new Float32Array([1, 0.5, 0, 1]),
  size: 0.1,
  emitterSize: new Float32Array([0.3, 1, 0]),
});

const animator = new ParticleAnimator(particleBuffer, {
  colorOverLifetime: {
    start: new Float32Array([1, 1, 0, 1]),
    end: new Float32Array([1, 0, 0, 0]),
  },
});

const renderer = new ParticleRenderer(runner.device, particleBuffer, {
  blendMode: 'additive', // 加法混合
});
```

### 降雨效果

```typescript
const emitter = new ParticleEmitter(particleBuffer, {
  shape: 'box',
  rate: 500,
  lifetime: 5.0,
  velocity: new Float32Array([0, -10, 0]),
  velocityVariance: new Float32Array([0.5, 1, 0.5]),
  color: new Float32Array([0.7, 0.7, 1, 0.6]),
  size: 0.05,
  emitterSize: new Float32Array([10, 0, 10]),
});

animator.addForceField({
  type: 'wind',
  strength: 2.0,
  direction: new Float32Array([1, 0, 0]),
});
```

## API 参考

详见各模块的 TypeScript 类型定义和 JSDoc 注释。

## 宪法约束

- ✅ 右手坐标系
- ✅ 列主序矩阵
- ✅ 所有 Buffer 通过 `runner.track()` 管理
- ✅ 所有资源添加 `label`
- ✅ std140 对齐规则
- ✅ 预分配粒子池，避免运行时内存分配
