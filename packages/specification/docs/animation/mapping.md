# 动画模块代码与文档一一对应映射

本文档详细映射了动画模块的代码文件与文档文件之间的一一对应关系。

## 代码文件与文档文件映射表

| 代码文件 | 文档文件 | 对应关系说明 |
|---------|----------|-------------|
| `src/animation/index.ts` | `docs/animation/index.md` | 主入口文件对应主文档 |
| `src/animation/controller.ts` | `docs/animation/controller.md` | 控制器实现对应控制器文档 |
| `src/animation/blender.ts` | `docs/animation/blender.md` | 混合器实现对应混合器文档 |
| `src/animation/core.ts` | **缺失** | 核心动画类型定义 |
| `src/animation/stateMachine.ts` | **缺失** | 状态机实现 |
| `src/animation/curve.ts` | **缺失** | 动画曲线定义 |
| `src/animation/easing.ts` | **缺失** | 缓动函数定义 |
| `src/animation/particle.ts` | **部分存在** | 粒子动画在index.md中 |
| `src/animation/particlePhysics.ts` | **部分存在** | 粒子物理在index.md中 |
| `src/animation/timeline.ts` | **缺失** | 时间轴系统 |

## 详细映射关系

### 1. 主入口文件 (index.ts ↔ index.md)

**代码位置**: `src/animation/index.ts:1-10`
```typescript
export * from './core';
export * from './stateMachine';
export * from './controller';
export * from './blender';
export * from './curve';
export * from './easing';
export * from './particle';
export * from './particlePhysics';
export * from './timeline';
```

**文档位置**: `docs/animation/index.md:1-216`
- 当前文档主要聚焦粒子物理系统，未涵盖其他导出模块
- 需要扩展以匹配index.ts的完整导出

### 2. 控制器模块 (controller.ts ↔ controller.md)

**代码接口**: `src/animation/controller.ts:13-26`
```typescript
export interface ExtendedAnimationController extends AnimationController {
  name: string;
  stateMachine?: AnimationStateMachine;
  currentState?: string;
}
```

**文档对应**: `docs/animation/controller.md:11-19`
```typescript
interface ExtendedAnimationController extends AnimationController {
  name: string;
  stateMachine?: AnimationStateMachine;
  currentState?: string;
}
```

**完全匹配** ✅

### 3. 混合器模块 (blender.ts ↔ blender.md)

**代码接口**: `src/animation/blender.ts:12-25`
```typescript
export interface AnimationBlender extends Omit<AnimationMixer, 'layers'> {
  type: BlendMode;
  inputs: AnimationBlendInput[];
  weights: number[];
}
```

**文档对应**: `docs/animation/blender.md:11-19`
```typescript
interface AnimationBlender extends Omit<AnimationMixer, 'layers'> {
  type: BlendMode;
  inputs: AnimationBlendInput[];
  weights: number[];
}
```

**完全匹配** ✅

### 4. 核心模块 (core.ts ↔ 缺失文档)

**代码接口**: `src/animation/core.ts:68-116`
```typescript
export interface AnimationPrim extends Omit<UsdPrim, 'metadata'> {
  typeName: 'Animation';
  metadata?: CommonMetadata;
}

export interface UsdAnimationClip extends AnimationPrim {
  attributes: {
    name: UsdValue;
    duration: UsdValue;
    frameRate: UsdValue;
    loopMode: UsdValue;
    startTime?: UsdValue;
    endTime?: UsdValue;
  };
  tracks: AnimationTrack[];
  events?: AnimationEvent[];
}
```

**缺失文档**: 需要创建 `docs/animation/core.md`

### 5. 状态机模块 (stateMachine.ts ↔ 缺失文档)

**代码接口**: `src/animation/stateMachine.ts:54-111`
```typescript
export interface AnimationState {
  id: string;
  name: string;
  clip: string;
  speed: number;
  loop: boolean;
  weight: number;
  // ... 其他属性
}

export interface AnimationStateMachine {
  name: string;
  states: AnimationState[];
  transitions: AnimationTransition[];
  defaultState: string;
  parameters: AnimationParameter[];
}
```

**缺失文档**: 需要创建 `docs/animation/state-machine.md`

### 6. 曲线模块 (curve.ts ↔ 缺失文档)

**代码接口**: `src/animation/curve.ts:39-59`
```typescript
export interface AnimationCurve {
  keys: AnimationKeyframe[];
  preset?: CurvePreset;
}

export enum CurvePreset {
  Constant = 'constant',
  Linear = 'linear',
  Random = 'random',
  Custom = 'custom',
}
```

**缺失文档**: 需要创建 `docs/animation/curve.md`

### 7. 缓动模块 (easing.ts ↔ 缺失文档)

**代码接口**: `src/animation/easing.ts:8-69`
```typescript
export enum ExtendedEasingType {
  Linear = 'linear',
  EaseIn = 'ease-in',
  EaseOut = 'ease-out',
  // ... 更多类型
  BounceInOut = 'bounce-in-out',
}
```

**缺失文档**: 需要创建 `docs/animation/easing.md`

## 文档状态总结

### 已文档化 ✅
- **controller.ts**: 完整对应 `controller.md`
- **blender.ts**: 完整对应 `blender.md`

### 部分文档化 ⚠️
- **particle.ts & particlePhysics.ts**: 在 `index.md` 中有部分内容

### 缺失文档 ❌
- **core.ts**: 基础动画类型定义
- **stateMachine.ts**: 状态机系统
- **curve.ts**: 动画曲线
- **easing.ts**: 缓动函数
- **timeline.ts**: 时间轴系统

### 文档扩展建议

1. **扩展index.md**: 添加除粒子物理外的其他动画系统概览
2. **创建缺失文档**: 为核心模块创建详细文档
3. **统一命名**: 确保文档命名与代码模块一致
4. **交叉引用**: 在文档中添加代码文件链接