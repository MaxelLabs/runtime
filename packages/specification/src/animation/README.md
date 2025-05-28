# Maxellabs 动画模块

动画模块提供基于USD标准的动画系统和扩展缓动功能，专注于动画特有的类型定义和USD集成。

## 功能概述

动画模块在核心模块基础上，提供USD特有的动画类型定义和扩展的缓动函数，支持复杂的动画制作流程。

## 主要组件

### USD动画核心 (core.ts)
USD特有的动画类型定义：

- **UsdAnimationClip**: USD动画剪辑，扩展通用动画剪辑
- **UsdKeyframe**: USD特定的关键帧，支持USD切线定义
- **UsdTangent**: USD切线类型，用于高精度动画插值
- **UsdAnimationTrack**: USD动画轨道，包含USD路径和类型信息

```typescript
import { UsdAnimationClip, UsdKeyframe } from '@maxellabs/specification/animation';

// USD动画剪辑定义
const usdClip: UsdAnimationClip = {
  typeName: 'Animation',
  path: '/World/Characters/Hero/Animations/Walk',
  attributes: {
    name: { value: 'WalkCycle', type: 'string' },
    duration: { value: 2.0, type: 'float' },
    frameRate: { value: 24.0, type: 'float' },
    loopMode: { value: 'loop', type: 'token' }
  },
  tracks: [], // USD动画轨道
  events: []  // 动画事件
};
```

### 扩展缓动系统 (easing.ts)
动画特有的详细缓动类型和变换函数：

- **ExtendedEasingType**: 详细的缓动函数枚举（Quad、Cubic、Quart等系列）
- **AnimationTransformFunction**: 动画特有的变换函数，支持关键帧插值

```typescript
import { ExtendedEasingType, AnimationTransformFunction } from '@maxellabs/specification/animation';

// 使用扩展缓动类型
const smoothAnimation: AnimationTransformFunction = {
  type: 'scale',  // 使用核心TransformType
  parameters: [1, 1, 1],
  interpolation: ExtendedEasingType.QuadInOut,
  keyframes: [0, 0.5, 1.0]
};
```

### 粒子动画 (particle.ts)
专门的粒子系统动画类型：

- **ParticleAnimation**: 粒子动画配置
- **ParticleEmissionCurve**: 发射曲线定义
- **ParticleLifecycleCurve**: 生命周期曲线

### 动画控制器 (controller.ts)
高级动画控制功能：

- **AnimationController**: 动画控制器实现
- **AnimationBlender**: 动画混合器
- **AnimationStateMachine**: 状态机管理

### 动画曲线 (curve.ts)
专业的动画曲线编辑：

- **AnimationCurve**: 动画曲线定义
- **CurveKeyframe**: 曲线关键帧
- **TangentType**: 切线类型

### 状态机 (stateMachine.ts)
动画状态机系统：

- **AnimationStateMachine**: 状态机定义
- **AnimationState**: 动画状态
- **StateTransition**: 状态转换

### 时间轴 (timeline.ts)
时间轴编辑功能：

- **AnimationTimeline**: 时间轴定义
- **TimelineClip**: 时间轴片段
- **TimelineMarker**: 时间轴标记

### Blender集成 (blender.ts)
Blender软件集成支持：

- **BlenderAnimationData**: Blender动画数据
- **BlenderAction**: Blender动作
- **BlenderFCurve**: Blender F曲线

### 粒子物理 (particlePhysics.ts)
粒子物理动画：

- **ParticlePhysicsAnimation**: 粒子物理动画
- **PhysicsForce**: 物理力
- **CollisionResponse**: 碰撞响应

## 与核心模块的关系

动画模块继承并扩展了核心模块的类型：

### 重新导出核心类型
```typescript
// 从core模块导入通用动画类型
import { PlayState, BlendMode, LoopMode } from '@maxellabs/specification/core';

// 重新导出供使用
export { PlayState as AnimationPlayState } from '@maxellabs/specification/core';
export { BlendMode as AnimationBlendMode } from '@maxellabs/specification/core';
```

### 扩展核心接口
```typescript
// 扩展核心动画配置
interface UsdAnimationConfig extends BaseAnimationConfig {
  // USD特有的属性
  usdPath: string;
  usdType: string;
}
```

## 设计原则

### 1. USD优先
所有动画类型都优先考虑USD兼容性，确保与标准制作流程的集成。

### 2. 专业级精度
提供电影级动画制作所需的精度和控制能力。

### 3. 扩展性
支持自定义缓动函数和动画类型的扩展。

### 4. 性能优化
考虑实时渲染的性能需求，优化数据结构。

## 使用示例

### 创建USD动画
```typescript
import { 
  UsdAnimationClip, 
  UsdKeyframe, 
  ExtendedEasingType 
} from '@maxellabs/specification/animation';
import { InterpolationMode } from '@maxellabs/specification/core';

// 创建关键帧
const keyframes: UsdKeyframe[] = [
  {
    time: 0,
    value: { x: 0, y: 0, z: 0 },
    interpolation: InterpolationMode.Bezier,
    inTangent: { x: 0, y: 0 },
    outTangent: { x: 0.3, y: 0 }
  },
  {
    time: 1,
    value: { x: 10, y: 0, z: 0 },
    interpolation: InterpolationMode.Bezier,
    inTangent: { x: 0.7, y: 0 },
    outTangent: { x: 1, y: 0 }
  }
];
```

### 使用扩展缓动
```typescript
import { ExtendedEasingType } from '@maxellabs/specification/animation';

// 使用详细的缓动类型
const bounceAnimation = {
  easing: ExtendedEasingType.BounceOut,
  duration: 0.8,
  keyframes: [
    { time: 0, value: 0 },
    { time: 1, value: 100 }
  ]
};
```

## 模块特色

### 1. USD深度集成
完全支持USD动画规范，包括时间采样、属性动画、关系动画等。

### 2. 专业工具支持
与Blender、Maya等主流动画软件的数据格式兼容。

### 3. 实时优化
针对实时渲染优化的动画数据结构和算法。

### 4. 扩展缓动库
提供比CSS动画更丰富的缓动函数库。

## 版本历史

- **v1.2.0**: 重构模块，将通用类型移至core模块
- **v1.1.0**: 添加粒子物理动画支持
- **v1.0.0**: 初始版本，基础USD动画支持

## 注意事项

1. **导入顺序**: 需要先导入core模块的基础类型
2. **USD兼容**: 确保动画数据符合USD规范
3. **性能考虑**: 复杂动画可能影响实时性能
4. **类型安全**: 使用TypeScript类型检查确保动画数据正确性 