# Strategy: Particle System Module

## 1. Mission Overview
实现GPU加速的粒子系统，支持大规模粒子渲染（烟雾、火焰、爆炸、雨雪等效果）

## 2. Module Architecture

### Class Diagram
```
ParticleSystem
├── ParticleBuffer (GPU数据管理)
│   ├── positionBuffer: GPUBuffer
│   ├── velocityBuffer: GPUBuffer
│   ├── lifeBuffer: GPUBuffer
│   └── colorBuffer: GPUBuffer
├── ParticleEmitter (粒子发射器)
│   ├── emitPoint()
│   ├── emitBox()
│   └── emitSphere()
└── ParticleRenderer (渲染器)
    └── render(instanceBuffer)
```

### Data Flow
1. Emitter 生成新粒子 → ParticleBuffer
2. Update循环更新粒子状态（位置、生命周期）
3. ParticleRenderer 使用 InstancedRenderer 批量渲染

## 3. Core Algorithm (Pseudo-code)

### Particle Update
```typescript
function updateParticles(deltaTime: number) {
  for (let i = 0; i < activeCount; i++) {
    // 更新位置
    position[i] += velocity[i] * deltaTime

    // 应用重力
    velocity[i].y -= gravity * deltaTime

    // 更新生命周期
    life[i] -= deltaTime

    // 回收死亡粒子
    if (life[i] <= 0) {
      swapWithLast(i)
      activeCount--
    }
  }
}
```

### Emitter Logic
```typescript
function emitParticles(count: number, config: EmitterConfig) {
  for (let i = 0; i < count; i++) {
    const particle = {
      position: sampleEmissionShape(config.shape),
      velocity: config.velocity + randomOffset(),
      life: config.lifetime,
      color: config.color,
      size: config.size
    }
    particleBuffer.add(particle)
  }
}
```

## 4. Resource Management

### Memory Layout
```
Particle Data (per particle):
- Position: vec3 (12 bytes + 4 padding = 16 bytes)
- Velocity: vec3 (12 bytes + 4 padding = 16 bytes)
- Life: float (4 bytes)
- Size: float (4 bytes)
- Color: vec4 (16 bytes)
Total: 56 bytes per particle
```

### Buffer Strategy
- 预分配固定大小的粒子池（如10000个粒子）
- 使用双缓冲进行GPU数据更新
- 所有Buffer通过 `runner.track()` 管理

## 5. Constitutional Compliance

✅ **右手坐标系**: 粒子位置和速度使用标准坐标系
✅ **列主序矩阵**: 使用InstancedRenderer的变换矩阵
✅ **性能约束**: 预分配粒子池，循环中复用对象
✅ **资源管理**: 所有Buffer添加label并track

## 6. Implementation Steps

### Phase 1: Core Classes
1. 创建 `types.ts` - 定义接口和配置
2. 创建 `ParticleBuffer.ts` - GPU数据管理
3. 创建 `ParticleEmitter.ts` - 发射器逻辑

### Phase 2: Rendering
4. 创建 `ParticleRenderer.ts` - 集成InstancedRenderer
5. 实现粒子着色器（Billboard效果）

### Phase 3: Features
6. 添加多种发射器形状（点、盒、球、锥）
7. 添加粒子力场（重力、风力、涡流）
8. 添加颜色和大小的生命周期动画

### Phase 4: Examples
9. 创建烟雾效果Demo
10. 创建火焰效果Demo
11. 创建降雨/降雪效果Demo
