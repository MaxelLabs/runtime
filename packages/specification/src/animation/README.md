# Animation 动画模块

Maxellabs 3D Engine 的动画系统规范，基于 USD (Universal Scene Description) 标准，提供完整的动画、动效、粒子系统和状态机功能。

## 模块结构

### 核心模块 (Core)
- **文件**: `core.ts`
- **功能**: 动画系统的基础类型和接口定义
- **主要内容**:
  - `AnimationPrim` - 动画基础接口
  - `AnimationClip` - 动画剪辑
  - `AnimationTrack` - 动画轨道
  - `Keyframe` - 关键帧
  - `AnimationEvent` - 动画事件

### 状态机模块 (State Machine)
- **文件**: `stateMachine.ts`
- **功能**: 动画状态机、状态和转换管理
- **主要内容**:
  - `AnimationStateMachine` - 动画状态机
  - `AnimationState` - 动画状态
  - `AnimationTransition` - 状态转换
  - `AnimationCondition` - 转换条件
  - `AnimationParameter` - 状态参数

### 控制器模块 (Controller)
- **文件**: `controller.ts`
- **功能**: 动画控制器、图层和遮罩管理
- **主要内容**:
  - `AnimationController` - 动画控制器
  - `AnimationLayer` - 动画图层
  - `AnimationMask` - 动画遮罩

### 混合器模块 (Blender)
- **文件**: `blender.ts`
- **功能**: 动画混合器和混合策略
- **主要内容**:
  - `AnimationBlender` - 动画混合器
  - `AnimationBlendInput` - 混合输入

### 缓动函数模块 (Easing)
- **文件**: `easing.ts`
- **功能**: 动效引擎的缓动函数和变换定义
- **主要内容**:
  - `EasingType` - 缓动函数类型枚举
  - `EasingFunction` - 缓动函数定义
  - `TransformType` - 变换函数类型
  - `PlaybackDirection` - 播放方向
  - `AnimationFillMode` - 填充模式

### 时间轴模块 (Timeline)
- **文件**: `timeline.ts`
- **功能**: 时间轴和属性动画管理
- **主要内容**:
  - `Timeline` - 时间轴
  - `TimelineAnimation` - 时间轴动画
  - `PropertyAnimation` - 属性动画

### 曲线模块 (Curve)
- **文件**: `curve.ts`
- **功能**: 动画曲线、关键点和数值范围定义
- **主要内容**:
  - `AnimationCurve` - 动画曲线
  - `ColorCurve` - 颜色曲线
  - `VelocityCurve` - 速度曲线
  - `ValueRange` - 数值范围
  - `ColorRange` - 颜色范围

### 粒子系统模块 (Particle)
- **文件**: `particle.ts`
- **功能**: 粒子系统、发射器和渲染配置
- **主要内容**:
  - `ParticleSystem` - 粒子系统
  - `ParticleEmitter` - 粒子发射器
  - `ParticleConfig` - 粒子配置
  - `ParticleRenderer` - 粒子渲染器

### 粒子物理模块 (Particle Physics)
- **文件**: `particlePhysics.ts`
- **功能**: 粒子物理、碰撞和力场系统
- **主要内容**:
  - `ParticlePhysics` - 粒子物理
  - `ParticleCollision` - 粒子碰撞
  - `ForceField` - 力场系统

## 设计原则

### 1. 模块化设计
- 每个模块专注于特定功能领域
- 模块间通过接口进行解耦
- 单个文件不超过200行代码

### 2. 基于核心规范
- 统一使用 `core` 模块的基础类型和枚举
- 遵循 USD 标准的数据结构
- 保持与其他模块的一致性

### 3. 类型安全
- 完整的 TypeScript 类型定义
- 严格的接口约束
- 支持类型推导和检查

### 4. 扩展性
- 支持自定义动画类型
- 可扩展的状态机系统
- 灵活的粒子系统配置

## 使用示例

```typescript
import {
  AnimationClip,
  AnimationStateMachine,
  Timeline,
  ParticleSystem,
  EasingType
} from '@maxellabs/specification/animation';

// 创建动画剪辑
const clip: AnimationClip = {
  typeName: 'Animation',
  attributes: {
    name: { value: 'walkCycle', type: 'string' },
    duration: { value: 2.0, type: 'float' },
    frameRate: { value: 30, type: 'float' },
    loopMode: { value: 'loop', type: 'string' }
  },
  tracks: [],
  metadata: {
    name: 'Walk Cycle',
    version: { major: 1, minor: 0, patch: 0 }
  }
};

// 创建状态机
const stateMachine: AnimationStateMachine = {
  name: 'CharacterController',
  states: [
    { name: 'idle', speed: 1.0, loop: true },
    { name: 'walk', speed: 1.0, loop: true }
  ],
  transitions: [],
  defaultState: 'idle',
  parameters: []
};
```

## 文件依赖关系

```
animation/
├── core.ts (基础接口)
├── stateMachine.ts → core
├── controller.ts → stateMachine, core/enums
├── blender.ts → core/enums
├── easing.ts (独立)
├── timeline.ts → easing, curve
├── curve.ts (独立)
├── particle.ts → core/enums, curve, particlePhysics
├── particlePhysics.ts (独立)
└── index.ts (导出所有模块)
```

## 注意事项

1. **私有变量命名**: 不使用下划线前缀，遵循项目规范
2. **方法命名**: 使用 `getXXX()` 和 `setXXX()` 方法而非 getter/setter
3. **枚举值**: 使用字符串字面量便于序列化和调试
4. **可选属性**: 合理使用可选属性减少必填字段
5. **类型导入**: 使用 `type` 关键字进行类型导入 