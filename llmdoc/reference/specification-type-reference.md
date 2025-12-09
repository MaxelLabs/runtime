# Specification 类型参考

## 1. 核心摘要

本文档提供了 `@maxellabs/specification` 包中核心类型的完整定义和接口规范，包括统一的泛型基类系统、动画轨道系统、纹理引用系统和变换系统等关键组件。

## 2. 源代码定义

### 泛型基类

**文件**: `packages/specification/src/core/generics.ts`
- BaseKeyframe<T> - 基础关键帧接口
- TangentKeyframe<T> - 带切线支持的关键帧
- InterpolatedKeyframe<T> - 带插值模式的关键帧
- FullKeyframe<T> - 完整功能的关键帧
- MinimalKeyframe - 最小关键帧约束
- BaseAnimationTrack<K> - 基础动画轨道
- TargetedAnimationTrack<K> - 带目标路径的动画轨道
- BlendableAnimationTrack<K> - 支持混合的动画轨道
- BaseTextureRef - 纹理引用基类
- UnifiedKeyframe<T> - 统一关键帧接口
- UnifiedAnimationTrack<K> - 统一动画轨道接口

### 核心接口

**文件**: `packages/specification/src/core/interfaces.ts`
```typescript
// 变换接口
export interface ITransform {
  position: Vector3Like;
  rotation: QuaternionLike;
  scale: Vector3Like;
  localMatrix: Matrix4Like;
  worldMatrix: Matrix4Like;
}

// 统一变换 3D（继承 ITransform）
export interface CommonTransform3D extends ITransform {
  eulerRotation: Vector3Like; // 额外属性
}

// 事件配置（重命名自 BaseEvent）
export interface FullEventConfig {
  type: string;
  target?: string;
  data?: any;
  timestamp?: number;
}

// 控制器状态（重命名自 BaseController）
export interface FullControllerState {
  id: string;
  type: string;
  active: boolean;
  properties: Record<string, any>;
}
```

### Easing 枚举

**文件**: `packages/specification/src/core/enums.ts`
```typescript
// 基础缓动函数
export enum EasingFunction {
  Linear = 'linear',
  Step = 'step',
  EaseIn = 'easeIn',
  EaseOut = 'easeOut',
  EaseInOut = 'easeInOut',
  // ... 更多基础函数
}

// 扩展缓动类型（已精简）
export enum ExtendedEasingType {
  Elastic = 'elastic',
  Back = 'back',
  Bounce = 'bounce',
  // ... 特殊效果
}

// 完整缓动类型
export type FullEasingType = EasingFunction | ExtendedEasingType;
```

### 动画类型（通用）

**文件**: `packages/specification/src/common/frame.ts`
```typescript
// 动画关键帧（类型别名）
export type AnimationKeyframe = UnifiedKeyframe<any>;

// 动画轨道（继承）
export interface AnimationTrack extends UnifiedAnimationTrack<AnimationKeyframe> {
  blendMode?: BlendMode;
  weight?: number;
}

// 变换关键帧（继承，限制属性）
export interface TransformKeyframe extends Omit<UnifiedKeyframe<CommonTransform>, 'bezierControlPoints'> {
  // 特定属性
}

// 变换动画轨道（继承）
export interface TransformAnimationTrack extends UnifiedAnimationTrack<TransformKeyframe> {
  space?: TransformSpace;
}
```

### 材质类型（通用）

**文件**: `packages/specification/src/common/material.ts`
```typescript
// 通用纹理引用（继承 BaseTextureRef）
export interface CommonTextureRef extends BaseTextureRef {
  // 通用扩展属性
}

// 材质关键帧（类型别名）
export type MaterialKeyframe = UnifiedKeyframe<any>;
```

### USD 动画类型

**文件**: `packages/specification/src/animation/core.ts`
```typescript
// USD 关键帧（继承，移除切线）
export interface UsdKeyframe extends Omit<UnifiedKeyframe<any>, 'inTangent' | 'outTangent' | 'bezierControlPoints'> {
  // USD 特定属性
}

// USD 动画轨道（继承）
export interface UsdAnimationTrack extends UnifiedAnimationTrack<UsdKeyframe> {
  primPath: string;
  attributeName: string;
}
```

### 渲染材质类型

**文件**: `packages/specification/src/rendering/material.ts`
```typescript
// 纹理引用（继承 BaseTextureRef）
export interface TextureReference extends BaseTextureRef {
  // 渲染特定属性
}

// 材质关键帧（类型别名）
export type MaterialKeyframe = UnifiedKeyframe<any>;

// 材质动画轨道（继承）
export interface MaterialAnimationTrack extends UnifiedAnimationTrack<MaterialKeyframe> {
  materialId: string;
  channel?: string;
}
```

## 3. 类型继承关系

### 关键帧类型继承

```typescript
BaseKeyframe<T>
├── TangentKeyframe<T>
├── InterpolatedKeyframe<T>
└── FullKeyframe<T>
    └── UnifiedKeyframe<T>
        ├── AnimationKeyframe (type alias)
        ├── MaterialKeyframe (type alias)
        ├── TransformKeyframe (extends)
        └── UsdKeyframe (extends)
```

### 动画轨道类型继承

```typescript
MinimalKeyframe
└── BaseAnimationTrack<K>
    ├── TargetedAnimationTrack<K>
    └── BlendableAnimationTrack<K>
        └── UnifiedAnimationTrack<K>
            ├── AnimationTrack (extends)
            ├── MaterialAnimationTrack (extends)
            ├── TransformAnimationTrack (extends)
            └── UsdAnimationTrack (extends)
```

### 纹理引用类型继承

```typescript
BaseTextureRef
├── CommonTextureRef (extends)
└── TextureReference (extends)
```

## 4. 使用示例

### 创建动画轨道

```typescript
// 通用动画轨道
const animationTrack: AnimationTrack = {
  id: 'rotate-track',
  targetPath: '/model',
  property: 'rotation',
  keyframes: [
    { time: 0, value: { x: 0, y: 0, z: 0, w: 1 } },
    { time: 1, value: { x: 0, y: Math.PI, z: 0, w: 1 } }
  ],
  interpolation: InterpolationMode.Linear
};

// USD 动画轨道
const usdTrack: UsdAnimationTrack = {
  primPath: '/MyObject',
  attributeName: 'xformOp:rotate',
  keyframes: [
    { time: 0, value: (0, 0, 0) },
    { time: 60, value: (0, 360, 0) }
  ]
};
```

### 创建纹理引用

```typescript
// 通用纹理引用
const commonTexture: CommonTextureRef = {
  assetId: 'texture-1',
  slot: 'diffuse',
  transform: {
    scale: [1, 1],
    offset: [0, 0],
    rotation: 0
  }
};

// 渲染纹理引用
const renderTexture: TextureReference = {
  assetId: 'diffuse-map',
  slot: 'diffuse',
  uvChannel: 0,
  transform: {
    scale: [1, 1],
    offset: [0, 0],
    rotation: 0
  }
};
```

### 使用 Easing 类型

```typescript
// 使用完整缓动类型
const easing: FullEasingType = EasingFunction.EaseInOut;

// 处理不同缓动类型
function applyEasing(easing: FullEasingType, t: number): number {
  switch (easing) {
    case EasingFunction.Linear:
      return t;
    case ExtendedEasingType.Elastic:
      return elasticEasing(t);
    // ... 其他处理
  }
}
```

## 5. 相关文档

- **架构设计**: `/llmdoc/architecture/specification-type-system.md` - 类型系统整体架构
- **编码约定**: `/llmdoc/reference/coding-conventions.md` - TypeScript 编码规范
- **USD 数据模型**: `/llmdoc/architecture/usd-data-model.md` - USD 类型系统
- **USD 核心类型**: `/llmdoc/reference/usd-core-types.md` - USD 核心类型定义