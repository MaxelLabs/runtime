# Specification 类型参考

## 1. 核心摘要

本文档提供了 `@maxellabs/specification` 包中核心类型的完整定义和接口规范，包括统一的关键帧系统、动画轨道系统、纹理引用系统和变换系统等关键组件。

## 2. 源代码定义

### 泛型基类

**文件**: `packages/specification/src/core/generics.ts:1-62`
```typescript
// 最小关键帧约束
export interface MinimalKeyframe {
  time: number;
}

// 统一关键帧接口
export interface UnifiedKeyframe<T = any> extends BaseKeyframe<T> {
  interpolation?: InterpolationMode;
  inTangent?: Vector2Like;
  outTangent?: Vector2Like;
  bezierControlPoints?: { inTangent: [number, number]; outTangent: [number, number]; };
}

// 统一动画轨道接口
export interface UnifiedAnimationTrack<K extends MinimalKeyframe = UnifiedKeyframe>
  extends BlendableAnimationTrack<K> {
  targetPath: string;
  property: string;
  dataType?: string;
}

// 纹理引用基类
export interface BaseTextureRef {
  textureId: string;
  samplerId?: string;
  transform?: TextureTransform;
}
```

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
  EaseInSine = 'easeInSine',
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
```

### 变换类型

**文件**: `packages/specification/src/common/transform.ts`
```typescript
// 变换关键帧（继承，限制属性）
export interface TransformKeyframe extends Omit<UnifiedKeyframe<CommonTransform>, 'bezierControlPoints'> {
  // 特定属性
}

// 变换动画轨道（继承）
export interface TransformAnimationTrack extends UnifiedAnimationTrack<TransformKeyframe> {
  space?: TransformSpace;
}

// 通用变换 3D
export interface CommonTransform3D extends ITransform {
  eulerRotation: Vector3Like;
}
```

### 材质类型（通用）

**文件**: `packages/specification/src/common/material.ts`
```typescript
// 通用纹理引用（继承）
export interface CommonTextureRef extends BaseTextureRef {
  // 通用扩展属性
}

// 材质关键帧（类型别名）
export type MaterialKeyframe = UnifiedKeyframe<any>;

// 材质动画轨道（继承）
export interface MaterialAnimationTrack extends UnifiedAnimationTrack<MaterialKeyframe> {
  materialId: string;
}
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
// 纹理引用（继承）
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

// 材质纹理变换（重命名避免冲突）
export interface MaterialTextureTransform extends TextureTransform {
  // 材质特定属性
}
```

## 3. 使用示例

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
  textureId: 'texture-1',
  samplerId: 'sampler-1',
  transform: {
    translation: [0, 0],
    rotation: 0,
    scale: [1, 1]
  }
};

// 渲染纹理引用
const renderTexture: TextureReference = {
  textureId: 'diffuse-map',
  samplerId: 'diffuse-sampler',
  transform: {
    translation: [0, 0],
    rotation: 0,
    scale: [1, 1]
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

## 4. 相关文档

- **架构设计**: `/llmdoc/architecture/specification-type-system.md` - 类型系统整体架构
- **编码约定**: `/llmdoc/reference/coding-conventions.md` - TypeScript 编码规范
- **USD 数据模型**: `/llmdoc/architecture/usd-data-model.md` - USD 类型系统
- **USD 核心类型**: `/llmdoc/reference/usd-core-types.md` - USD 核心类型定义