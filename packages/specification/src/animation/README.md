# Animation 动画模块

Maxellabs 3D Engine 的动画系统规范，基于 USD (Universal Scene Description) 标准，提供完整的动画、动效、粒子系统和状态机功能。

## 📁 模块结构

### 🎯 核心文件

| 文件 | 描述 | 主要功能 |
|------|------|----------|
| `index.ts` | 模块入口 | 统一导出所有动画相关类型 |
| `core.ts` | 动画核心 | USD动画基础类型、动画剪辑、轨道定义 |
| `stateMachine.ts` | 状态机 | 动画状态机、状态转换管理 |
| `controller.ts` | 控制器 | 动画控制器、图层、遮罩管理 |
| `easing.ts` | 缓动函数 | 缓动算法、播放方向、填充模式 |
| `timeline.ts` | 时间轴 | 时间轴动画、属性动画管理 |
| `blender.ts` | 混合器 | 动画混合、权重控制 |
| `curve.ts` | 动画曲线 | 关键帧曲线、数值范围定义 |
| `particle.ts` | 粒子系统 | 粒子发射器、渲染器、配置 |
| `particlePhysics.ts` | 粒子物理 | 物理模拟、碰撞、力场 |

## 🚀 核心能力

### 1. 动画剪辑管理 (`core.ts`)

**功能特性：**
- 基于 USD 标准的动画剪辑定义
- 支持多种循环模式和插值算法
- 完整的动画轨道和关键帧系统
- 动画事件系统

**主要类型：**
```typescript
// 动画剪辑
interface AnimationClip {
  attributes: {
    name: UsdValue;        // 动画名称
    duration: UsdValue;    // 持续时间
    frameRate: UsdValue;   // 帧率
    loopMode: UsdValue;    // 循环模式
  };
  tracks: AnimationTrack[];  // 动画轨道
  events?: AnimationEvent[]; // 动画事件
}

// 动画轨道
interface AnimationTrack {
  name: string;
  targetPath: string;
  propertyName: string;
  type: AnimationTrackType;
  keyframes: AnimationKeyframe[];
  interpolation: InterpolationMode;
}
```

**使用示例：**
```typescript
import { AnimationClip, AnimationTrackType } from '@maxellabs/specification/animation';

const walkClip: AnimationClip = {
  typeName: 'Animation',
  attributes: {
    name: { value: 'Walk', type: 'string' },
    duration: { value: 2.0, type: 'float' },
    frameRate: { value: 30, type: 'float' },
    loopMode: { value: 'loop', type: 'string' }
  },
  tracks: [
    {
      name: 'position',
      targetPath: '/Character/Root',
      propertyName: 'position',
      type: AnimationTrackType.Position,
      keyframes: [],
      interpolation: 'linear',
      enabled: true
    }
  ]
};
```

### 2. 状态机系统 (`stateMachine.ts`)

**功能特性：**
- 基于通用状态机类型的扩展
- 支持状态转换和条件判断
- 中断源控制
- 参数化状态管理

**主要类型：**
```typescript
// 动画状态机
interface AnimationStateMachine {
  name: string;
  states: AnimationState[];           // 使用common中的类型
  transitions: AnimationTransition[]; // 使用common中的类型
  defaultState: string;
  parameters: AnimationParameter[];   // 使用common中的类型
}

// 扩展的转换（添加中断源）
interface ExtendedAnimationTransition extends AnimationTransition {
  interruptionSource?: InterruptionSource;
  offset?: number;
}
```

**使用示例：**
```typescript
import { AnimationStateMachine, InterruptionSource } from '@maxellabs/specification/animation';

const characterStateMachine: AnimationStateMachine = {
  name: 'CharacterController',
  states: [
    { name: 'Idle', clip: 'idle_anim', speed: 1.0, loop: true, weight: 1.0 },
    { name: 'Walk', clip: 'walk_anim', speed: 1.0, loop: true, weight: 1.0 },
    { name: 'Run', clip: 'run_anim', speed: 1.2, loop: true, weight: 1.0 }
  ],
  transitions: [
    {
      fromState: 'Idle',
      toState: 'Walk',
      duration: 0.3,
      conditions: [{ parameter: 'speed', type: 'greater', threshold: 0.1 }]
    }
  ],
  defaultState: 'Idle',
  parameters: [
    { name: 'speed', type: 'float', defaultValue: 0.0 }
  ]
};
```

### 3. 缓动系统 (`easing.ts`)

**功能特性：**
- 丰富的缓动函数类型
- 自定义贝塞尔曲线支持
- 播放方向控制
- 填充模式设置

**主要类型：**
```typescript
// 扩展的缓动类型
enum ExtendedEasingType {
  Linear = 'linear',
  EaseIn = 'ease-in',
  EaseOut = 'ease-out',
  EaseInOut = 'ease-in-out',
  // ... 更多详细类型
  QuadIn = 'quad-in',
  CubicBezier = 'cubic-bezier'
}

// 缓动函数定义
interface EasingFunction {
  type: EasingType | ExtendedEasingType;
  controlPoints?: [number, number, number, number];
  parameters?: Record<string, number>;
}
```

**使用示例：**
```typescript
import { EasingFunction, ExtendedEasingType, PlaybackDirection } from '@maxellabs/specification/animation';

const bounceEasing: EasingFunction = {
  type: ExtendedEasingType.BounceOut,
  parameters: {
    amplitude: 1.0,
    period: 0.3
  }
};

const customBezier: EasingFunction = {
  type: ExtendedEasingType.CubicBezier,
  controlPoints: [0.25, 0.1, 0.25, 1.0]
};
```

### 4. 时间轴系统 (`timeline.ts`)

**功能特性：**
- 扩展通用时间轴类型
- 复杂动画序列管理
- 属性动画支持
- 变换函数集成

**主要类型：**
```typescript
// 时间轴（扩展通用类型）
interface Timeline extends Omit<AnimationTimeline, 'tracks' | 'events'> {
  playbackRate: number;
  iterations: number;
  direction: PlaybackDirection;
  fillMode: AnimationFillMode;
  animations: TimelineAnimation[];
}

// 时间轴动画
interface TimelineAnimation {
  name: string;
  target: string;
  startTime: number;
  duration: number;
  easing: EasingFunction;
  properties: PropertyAnimation[];
}
```

**使用示例：**
```typescript
import { Timeline, PropertyAnimation } from '@maxellabs/specification/animation';

const complexTimeline: Timeline = {
  name: 'UI_Entrance',
  duration: 3000,
  speed: 1.0,
  loop: false,
  playbackRate: 1.0,
  iterations: 1,
  direction: 'normal',
  fillMode: 'forwards',
  delay: 0,
  endDelay: 0,
  animations: [
    {
      name: 'fade_in',
      target: '#button',
      startTime: 0,
      duration: 1000,
      easing: { type: 'ease-out' },
      properties: [
        { property: 'opacity', from: 0, to: 1 },
        { property: 'scale', from: 0.8, to: 1 }
      ]
    }
  ]
};
```

### 5. 动画控制器 (`controller.ts`)

**功能特性：**
- 扩展通用控制器类型
- 多层动画管理
- 遮罩系统
- 骨骼动画支持

**主要类型：**
```typescript
// 扩展的动画控制器
interface ExtendedAnimationController extends AnimationController {
  name: string;
  stateMachine?: AnimationStateMachine;
  currentState?: string;
}

// 骨骼动画遮罩
interface BoneAnimationMask extends AnimationMask {
  includedBones: string[];
  excludedBones: string[];
}
```

### 6. 混合器系统 (`blender.ts`)

**功能特性：**
- 基于通用混合器的扩展
- 多种混合模式支持
- 权重控制
- 时间偏移

**使用示例：**
```typescript
import { AnimationBlender, AnimationBlendInput } from '@maxellabs/specification/animation';

const walkRunBlender: AnimationBlender = {
  name: 'WalkRunBlender',
  enabled: true,
  type: 'additive',
  inputs: [
    { clip: 'walk', weight: 0.7, timeOffset: 0 },
    { clip: 'run', weight: 0.3, timeOffset: 0 }
  ],
  weights: [0.7, 0.3]
};
```

### 7. 粒子系统 (`particle.ts`)

**功能特性：**
- 完整的粒子发射器系统
- 多种发射形状支持
- 粒子生命周期管理
- 渲染配置

**主要组件：**
```typescript
// 粒子系统
interface ParticleSystem {
  name: string;
  emitter: ParticleEmitter;     // 发射器
  particle: ParticleConfig;     // 粒子配置
  renderer: ParticleRenderer;   // 渲染器
  physics?: ParticlePhysics;    // 物理系统
}

// 发射器形状
enum EmitterShape {
  Point = 'point',
  Line = 'line',
  Rectangle = 'rectangle',
  Circle = 'circle',
  Sphere = 'sphere',
  Box = 'box',
  Cone = 'cone'
}
```

**使用示例：**
```typescript
import { ParticleSystem, EmitterShape } from '@maxellabs/specification/animation';

const fireEffect: ParticleSystem = {
  name: 'Fire',
  emitter: {
    shape: EmitterShape.Circle,
    rate: 50,
    lifetime: 2.0,
    loop: true
  },
  particle: {
    lifetime: { min: 1.0, max: 3.0 },
    startVelocity: { min: 5.0, max: 15.0 },
    startSize: { min: 0.1, max: 0.5 },
    startColor: { 
      start: [1, 0.5, 0, 1], 
      end: [1, 0, 0, 0] 
    }
  },
  renderer: {
    mode: 'transparent',
    material: 'fire_material',
    blendMode: 'additive',
    sortMode: 'distance'
  }
};
```

### 8. 动画曲线 (`curve.ts`)

**功能特性：**
- 基于通用关键帧的曲线系统
- 多种曲线预设
- 颜色和速度曲线支持
- 数值范围定义

**使用示例：**
```typescript
import { AnimationCurve, ColorCurve, ValueRange } from '@maxellabs/specification/animation';

const fadeInCurve: AnimationCurve = {
  keys: [
    { time: 0, value: 0, interpolation: 'linear', easing: 'ease-in' },
    { time: 1, value: 1, interpolation: 'linear', easing: 'ease-out' }
  ],
  preset: 'custom'
};

const sizeRange: ValueRange = {
  min: 0.1,
  max: 2.0
};
```

## 🎮 使用指南

### 基础动画创建

```typescript
import { 
  AnimationClip, 
  AnimationStateMachine, 
  ExtendedAnimationController 
} from '@maxellabs/specification/animation';

// 1. 创建动画剪辑
const jumpClip: AnimationClip = {
  typeName: 'Animation',
  attributes: {
    name: { value: 'Jump', type: 'string' },
    duration: { value: 1.5, type: 'float' },
    frameRate: { value: 60, type: 'float' },
    loopMode: { value: 'none', type: 'string' }
  },
  tracks: [],
  metadata: {}
};

// 2. 创建状态机
const characterStateMachine: AnimationStateMachine = {
  name: 'Character',
  states: [
    { name: 'Jump', clip: 'jump', speed: 1.0, loop: false, weight: 1.0 }
  ],
  transitions: [],
  defaultState: 'Jump',
  parameters: []
};

// 3. 创建控制器
const controller: ExtendedAnimationController = {
  name: 'CharacterController',
  playState: 'stopped',
  currentTime: 0,
  playbackSpeed: 1.0,
  enabled: true,
  weight: 1.0,
  currentLoop: 0,
  direction: 1,
  stateMachine: characterStateMachine
};
```

### 复杂粒子效果

```typescript
import { ParticleSystem, ParticlePhysics } from '@maxellabs/specification/animation';

const magicSpell: ParticleSystem = {
  name: 'MagicSpell',
  emitter: {
    shape: 'sphere',
    rate: 100,
    bursts: [
      { time: 0, count: 50, cycles: 1, interval: 0 }
    ],
    lifetime: 3.0,
    loop: false
  },
  particle: {
    lifetime: { min: 2.0, max: 4.0 },
    startVelocity: { min: 1.0, max: 5.0 },
    startSize: { min: 0.05, max: 0.2 },
    startColor: { 
      start: [0.5, 0.5, 1, 1], 
      end: [1, 1, 1, 0] 
    },
    startRotation: { min: 0, max: 360 }
  },
  renderer: {
    mode: 'transparent',
    material: 'magic_material',
    blendMode: 'additive',
    sortMode: 'distance'
  },
  physics: {
    gravity: [0, -9.8, 0],
    damping: 0.1,
    forceFields: [
      {
        type: 'point',
        strength: 5.0,
        position: [0, 2, 0],
        range: 3.0,
        falloff: 2.0
      }
    ]
  }
};
```

## ⚠️ 注意事项

### 类型导入建议

```typescript
// ✅ 推荐：从主模块导入
import { AnimationClip, AnimationState } from '@maxellabs/specification/animation';

// ❌ 避免：直接从子模块导入
import { AnimationClip } from '@maxellabs/specification/animation/core';
```

### 性能优化

1. **状态机优化**
   - 避免过多的状态转换
   - 合理设置转换条件
   - 使用遮罩减少不必要的骨骼计算

2. **粒子系统优化**
   - 控制粒子数量
   - 使用合适的排序模式
   - 启用距离剔除

3. **动画混合优化**
   - 限制同时播放的动画数量
   - 使用权重控制避免无效计算
   - 合理设置混合模式

### 兼容性说明

- 所有类型基于 USD 标准设计，确保跨平台兼容性
- 优先使用 `common` 模块中的通用类型
- 扩展类型向后兼容，支持渐进式升级
- 重新导出机制保证 API 稳定性

### 调试建议

1. **动画状态调试**
   ```typescript
   // 添加状态变化监听
   const debugController = {
     ...controller,
     onStateChange: (from: string, to: string) => {
       console.log(`State changed: ${from} -> ${to}`);
     }
   };
   ```

2. **粒子系统调试**
   ```typescript
   // 启用粒子数量统计
   const debugParticleSystem = {
     ...particleSystem,
     debug: {
       showParticleCount: true,
       showEmitterBounds: true
     }
   };
   ```

## 🔗 相关模块

- **[Common](../common/README.md)** - 通用类型和接口
- **[Core](../core/README.md)** - 核心类型和枚举
- **[Design](../design/README.md)** - 设计工具集成
- **[Media](../media/README.md)** - 媒体处理 