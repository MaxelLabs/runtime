# Specification 类型系统架构

## 1. Identity

**Specification 类型系统** 是基于 TypeScript 的统一类型定义体系，通过泛型基类为 3D 渲染和动画系统提供核心数据结构和类型支持。

**Purpose**: 解决类型重复问题，建立统一、可扩展的类型继承体系，确保类型安全性和代码复用。

## 2. 核心组件

- `packages/specification/src/core/generics.ts` (BaseKeyframe, UnifiedKeyframe, UnifiedAnimationTrack, BaseTextureRef): 泛型基类定义
- `packages/specification/src/core/interfaces.ts` (ITransform, CommonTransform3D, FullEventConfig, FullControllerState): 核心接口定义
- `packages/specification/src/core/enums.ts` (EasingFunction, FullEasingType): 枚举类型定义
- `packages/specification/src/common/frame.ts` (AnimationKeyframe, AnimationTrack, TransformKeyframe): 通用动画类型
- `packages/specification/src/common/transform.ts` (CommonTransform3D): 变换类型
- `packages/specification/src/common/material.ts` (CommonTextureRef): 材质纹理类型
- `packages/specification/src/animation/core.ts` (UsdKeyframe, UsdAnimationTrack): USD 动画类型
- `packages/specification/src/rendering/material.ts` (MaterialKeyframe, MaterialAnimationTrack, TextureReference): 渲染材质类型

## 3. 执行流程 (LLM Retrieval Map)

- **1. 泛型定义**: 在 `core/generics.ts` 中定义所有基础泛型接口
- **2. 接口扩展**: 各模块类型继承基础泛型，实现特定功能扩展
- **3. 类型别名**: 使用 `type` 为特定场景创建简化的类型别名
- **4. 枚举统一**: 整合 easing 相关枚举，提供完整类型支持
- **5. 循环依赖解决**: 重组文件依赖关系，消除循环引用

## 4. 设计原理

### 4.1 泛型基类体系

```typescript
// 关键帧泛型基类
interface BaseKeyframe<T = any> {
  time: number;
  value: T;
  easing?: string;
}

// 统一关键帧接口
interface UnifiedKeyframe<T = any> extends BaseKeyframe<T> {
  interpolation?: InterpolationMode;
  inTangent?: Vector2Like;
  outTangent?: Vector2Like;
  bezierControlPoints?: { inTangent: [number, number]; outTangent: [number, number]; };
}

// 动画轨道泛型基类
interface UnifiedAnimationTrack<K extends MinimalKeyframe = UnifiedKeyframe>
  extends BlendableAnimationTrack<K> {
  targetPath: string;
  property: string;
  dataType?: string;
}

// 纹理引用基类
interface BaseTextureRef {
  assetId: string;
  slot?: string;
  uvChannel?: number;
  transform?: TextureTransform;
  sampler?: TextureSampler;
  intensity?: number;
}
```

### 4.2 类型继承层次

```
关键帧层次:
BaseKeyframe<T>
├── TangentKeyframe<T> (增加切线支持)
├── InterpolatedKeyframe<T> (增加插值模式)
└── FullKeyframe<T> (两者都支持)
    └── UnifiedKeyframe<T> (统一接口)
        ├── AnimationKeyframe (type alias = UnifiedKeyframe<any>)
        ├── MaterialKeyframe (type alias = UnifiedKeyframe<any>)
        ├── TransformKeyframe (extends Omit<UnifiedKeyframe<CommonTransform>, ...>)
        └── UsdKeyframe (extends Omit<UnifiedKeyframe<any>, tangents>)

动画轨道层次:
MinimalKeyframe (只要求 time)
└── BaseAnimationTrack<K>
    ├── TargetedAnimationTrack<K> (增加 targetPath)
    └── BlendableAnimationTrack<K> (增加 blendMode)
        └── UnifiedAnimationTrack<K> (统一接口)
            ├── AnimationTrack (extends)
            ├── MaterialAnimationTrack (extends)
            ├── TransformAnimationTrack (extends)
            └── UsdAnimationTrack (extends)

纹理引用层次:
BaseTextureRef
├── CommonTextureRef (extends, 来自 common/material.ts)
└── TextureReference (extends, 来自 rendering/material.ts)

变换层次:
ITransform
└── CommonTransform3D (extends, 只增加 eulerRotation)

枚举层次:
EasingFunction
└── FullEasingType = EasingFunction | ExtendedEasingType (精简后的扩展)
```

### 4.3 循环依赖解决

**重组策略**:
- 将共享类型移至 `common/` 目录
- 使用 `index.ts` 重新导出类型
- 建立清晰的依赖方向：`core → common → package → design`

### 4.4 类型别名策略

**使用场景**:
- 为复杂泛型类型创建简单别名
- 保持向后兼容性
- 提供语义化的类型名称

```typescript
// 类型别名示例
type AnimationKeyframe = UnifiedKeyframe<any>;
type MaterialKeyframe = UnifiedKeyframe<any>;
```

### 4.5 枚举整合

**Easing 类型整合**:
- 保留 `EasingFunction` 作为基础枚举
- 精简 `ExtendedEasingType` 移除重复值
- 提供 `FullEasingType` 作为完整类型支持

### 4.6 接口重命名

**语义化命名**:
- `BaseEvent` → `FullEventConfig` (明确配置语义)
- `BaseController` → `FullControllerState` (明确状态语义)
- `TextureTransform` → `MaterialTextureTransform` (避免命名冲突)