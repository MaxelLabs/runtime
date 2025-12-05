# Specification 包类型重构实施计划

## 执行日期
2025-12-05

## 概述

本文档详细说明 `@maxellabs/specification` 包中 43+ 个重复类型定义的全面重构方案。重构目标是建立清晰的类型层次、消除冗余定义、统一设计模式。

**重构策略**: 全面重构，允许破坏性变更

---

## 1. 新的模块职责划分

### 1.1 理想的分层架构

```
Layer 0: core (无依赖)
├── 基础枚举 (enums.ts)
├── 基础接口 (interfaces.ts)
├── 泛型基类 (generics.ts)
├── 数学类型 (math.ts)
└── USD 核心 (usd.ts)

Layer 1: common (仅依赖 core)
├── 通用运行时数据模型
├── 跨模块共享的类型实现
└── 不包含特定领域逻辑

Layer 2: 功能模块 (仅依赖 core + common)
├── animation/ - 动画系统扩展
├── rendering/ - 渲染管线扩展
├── design/ - 设计系统扩展
└── workflow/ - 工作流扩展

Layer 3: package (依赖所有模块)
└── 整合打包、导出格式
```

### 1.2 各模块职责明确

| 模块 | 职责 | 不应该包含 |
|------|------|-----------|
| core | 基础枚举、接口、泛型基类 | 具体实现、业务逻辑 |
| common | 通用数据模型、共享类型 | 特定领域扩展 |
| animation | 动画系统特有的扩展类型 | 通用关键帧定义 |
| rendering | 渲染管线特有的扩展类型 | 通用材质定义 |
| design | 设计系统特有的类型 | 通用组件定义 |
| workflow | 工作流特有的类型 | 通用约束定义 |

---

## 2. 统一类型设计方案

### 2.1 Animation 类型统一

#### 2.1.1 统一关键帧 (UnifiedKeyframe)

**现状问题**: 4个不同的关键帧定义，结构不一致

**统一方案**:

```typescript
// core/generics.ts - 新增

/**
 * 统一的关键帧基类
 * @template T 关键帧值类型
 */
export interface UnifiedKeyframe<T = any> {
  /** 时间点 */
  time: number;
  /** 值 */
  value: T;
  /** 插值模式 */
  interpolation?: InterpolationMode;
  /** 入切线 (用于曲线插值) */
  inTangent?: Vector2Like;
  /** 出切线 (用于曲线插值) */
  outTangent?: Vector2Like;
  /** 缓动函数 */
  easing?: EasingFunction | string;
}

// 类型别名 - 便于特定场景使用
export type NumberKeyframe = UnifiedKeyframe<number>;
export type Vector3Keyframe = UnifiedKeyframe<Vector3Like>;
export type QuaternionKeyframe = UnifiedKeyframe<QuaternionLike>;
export type ColorKeyframe = UnifiedKeyframe<ColorLike>;
export type TransformKeyframe = UnifiedKeyframe<ITransform>;
```

#### 2.1.2 统一动画轨道 (UnifiedAnimationTrack)

**现状问题**: AnimationTrack、TransformAnimationTrack、MaterialAnimationTrack 结构相似但独立定义

**统一方案**:

```typescript
// core/generics.ts - 新增

/**
 * 统一的动画轨道基类
 * @template K 关键帧类型
 */
export interface UnifiedAnimationTrack<K extends UnifiedKeyframe = UnifiedKeyframe> {
  /** 轨道名称 */
  name: string;
  /** 目标路径 (如 "/root/mesh") */
  targetPath: string;
  /** 目标属性名 (如 "position", "opacity") */
  propertyName: string;
  /** 关键帧列表 */
  keyframes: K[];
  /** 是否启用 */
  enabled: boolean;
  /** 混合权重 */
  weight: number;
  /** 混合模式 */
  blendMode?: BlendMode;
  /** 数据类型标识 */
  dataType?: string;
}

// 特化类型
export interface TransformAnimationTrack extends UnifiedAnimationTrack<TransformKeyframe> {
  dataType: 'transform';
  property: 'position' | 'rotation' | 'scale' | 'transform';
}

export interface MaterialAnimationTrack extends UnifiedAnimationTrack<UnifiedKeyframe> {
  dataType: 'material';
  targetProperty: string;
}

export interface ColorAnimationTrack extends UnifiedAnimationTrack<ColorKeyframe> {
  dataType: 'color';
}
```

### 2.2 Material 和 Texture 类型统一

#### 2.2.1 统一纹理引用 (TextureReference)

**现状问题**: CommonTextureRef 和 TextureReference 是同义词但定义不同

**统一方案**:

```typescript
// core/generics.ts - 新增

/**
 * 纹理变换
 */
export interface TextureTransform {
  /** UV 偏移 */
  offset: Vector2Like;
  /** UV 旋转 (弧度) */
  rotation: number;
  /** UV 缩放 */
  scale: Vector2Like;
}

/**
 * 统一的纹理引用
 */
export interface TextureReference {
  /** 纹理ID或路径 */
  textureId: string;
  /** 纹理类型 */
  type?: RHITextureType;
  /** 纹理槽位 */
  slot?: TextureSlot;
  /** UV 通道 */
  uvChannel?: number;
  /** 采样器名称 */
  samplerName?: string;
  /** 纹理变换 */
  transform?: TextureTransform;
}

// common/material.ts - 使用别名
export type CommonTextureRef = TextureReference;
```

#### 2.2.2 Material 类型分工

**现状问题**: CommonMaterial 和 IMaterial 职责不清

**明确分工**:

```typescript
// core/interfaces.ts - 保持 MaterialProperties 作为 PBR 属性定义
export interface MaterialProperties {
  baseColor?: ColorLike;
  metallic?: number;
  roughness?: number;
  // ... 其他 PBR 属性
}

// common/material.ts - 运行时数据模型
export interface CommonMaterial {
  id: string;
  name: string;
  type: MaterialType;
  properties: MaterialProperties;
  textures: TextureReference[];
  renderPriority?: number;
  // ... 运行时配置
}

// rendering/material.ts - USD/渲染管线定义
export interface IMaterial extends UsdPrim {
  typeName: 'Material';
  shaderNetwork?: ShaderNetwork;
  renderState?: MaterialRenderState;
  // ... USD 特有属性
}
```

**职责划分**:
- `MaterialProperties` (core): PBR 属性列表，面向属性定义
- `CommonMaterial` (common): 运行时数据模型，面向应用层
- `IMaterial` (rendering): USD 格式定义，面向渲染管线

### 2.3 Transform 类型层次

**现状问题**: ITransform、CommonTransform、CommonTransform2D/3D 层次混乱

**统一方案**:

```typescript
// core/interfaces.ts - 基础接口
export interface ITransform {
  position: Vector3Like;
  rotation: QuaternionLike;
  scale: Vector3Like;
  matrix?: Matrix4Like;
}

// common/transform.ts - 维度特化
export interface Transform2D {
  position: Vector2Like;
  rotation: number;
  scale: Vector2Like;
  anchor?: Vector2Like;
  skew?: Vector2Like;
}

export interface Transform3D extends ITransform {
  anchor?: Vector3Like;
  eulerRotation?: EulerLike;
  space?: TransformSpace;
}

// common/transform.ts - USD 集成版本 (重命名)
export interface UsdTransform {
  position: UsdValue;    // Vector3f
  rotation: UsdValue;    // Quatf
  scale: UsdValue;       // Vector3f
  matrix?: UsdValue;     // Matrix4d
  space?: TransformSpace;
  inheritTransform?: boolean;
}

// 向后兼容
/** @deprecated 使用 UsdTransform 代替 */
export type CommonTransform = UsdTransform;
```

### 2.4 Easing 类型统一

**现状问题**: EasingFunction (31个) 和 ExtendedEasingType (69个，完全重复) 冗余

**统一方案**:

```typescript
// core/enums.ts - 保持完整的 EasingFunction
export enum EasingFunction {
  Linear = 'linear',
  EaseIn = 'easeIn',
  EaseOut = 'easeOut',
  EaseInOut = 'easeInOut',
  // ... 所有 31 个值
}

// animation/easing.ts - 删除 ExtendedEasingType，使用别名
export type EasingType = EasingFunction;

// 如需自定义缓动
export interface CustomEasing {
  type: 'bezier' | 'spring' | 'custom';
  parameters: number[];
}

export type AnimationEasing = EasingFunction | CustomEasing;
```

### 2.5 State 类型统一

**现状问题**: InteractionState、ComponentState、AnimationState 无统一基础

**统一方案**:

```typescript
// core/interfaces.ts - 统一基础
export interface BaseState {
  id: string;
  name: string;
  metadata?: Record<string, any>;
}

export enum StateCategory {
  Interaction = 'interaction',
  Component = 'component',
  Animation = 'animation',
}

// common/interaction.ts
export interface InteractionState extends BaseState {
  category: StateCategory.Interaction;
  value: 'normal' | 'hover' | 'pressed' | 'selected' | 'disabled' | 'focused' | 'dragging';
}

// design/components.ts
export interface ComponentState extends BaseState {
  category: StateCategory.Component;
  type: ComponentStateType;
  properties: Record<string, any>;
  transitions?: ComponentTransition[];
}

// animation/stateMachine.ts
export interface AnimationState extends BaseState {
  category: StateCategory.Animation;
  clip: string;
  speed: number;
  loop: boolean;
  weight: number;
}
```

---

## 3. 具体文件修改清单

### 3.1 Phase 1: 修复循环依赖 (优先级: 紧急)

**问题**: common ↔ animation 循环依赖

| 文件 | 修改内容 |
|------|---------|
| `common/animation.ts:20` | 删除 `import { AnimationState, AnimationTransition } from '../animation'` |
| `animation/stateMachine.ts` | 将 `AnimationState`、`AnimationTransition` 移动到 `common/animation.ts` |
| `animation/index.ts` | 重新导出从 common 移入的类型 |

### 3.2 Phase 2: 统一动画类型 (优先级: 高)

| 文件 | 修改内容 |
|------|---------|
| `core/generics.ts` | 新增 `UnifiedKeyframe<T>`、`UnifiedAnimationTrack<K>` |
| `common/frame.ts` | `AnimationKeyframe` 改为 `type AnimationKeyframe = UnifiedKeyframe` |
| `common/frame.ts` | `AnimationTrack` 继承 `UnifiedAnimationTrack` |
| `common/transform.ts` | `TransformKeyframe` 改为 `type TransformKeyframe = UnifiedKeyframe<ITransform>` |
| `common/transform.ts` | `TransformAnimationTrack` 继承 `UnifiedAnimationTrack<TransformKeyframe>` |
| `animation/core.ts` | `UsdKeyframe` 改为 `type UsdKeyframe = UnifiedKeyframe` |
| `rendering/material.ts` | `MaterialKeyframe` 改为 `type MaterialKeyframe = UnifiedKeyframe` |
| `rendering/material.ts` | `MaterialAnimationTrack` 继承 `UnifiedAnimationTrack` |

### 3.3 Phase 3: 统一材质和纹理类型 (优先级: 高)

| 文件 | 修改内容 |
|------|---------|
| `core/generics.ts` | 新增 `TextureTransform`、`TextureReference` |
| `common/material.ts` | 删除 `CommonTextureRef`，改为 `type CommonTextureRef = TextureReference` |
| `rendering/material.ts` | 删除 `TextureReference` 定义，从 core 导入 |
| `rendering/material.ts` | 删除 `TextureTransform` 定义，从 core 导入 |
| `rendering/material.ts` | 删除 `MaterialProperty` 接口 (未使用) |
| `common/material.ts` | 添加注释说明 CommonMaterial 是运行时数据模型 |
| `rendering/material.ts` | 添加注释说明 IMaterial 是 USD 渲染定义 |

### 3.4 Phase 4: 统一 Transform 类型 (优先级: 中)

| 文件 | 修改内容 |
|------|---------|
| `core/interfaces.ts` | 保持 `ITransform` 作为基础接口 |
| `common/transform.ts` | 重命名 `CommonTransform` → `UsdTransform` |
| `common/transform.ts` | 添加 `type CommonTransform = UsdTransform` 向后兼容 |
| `common/transform.ts` | 重命名 `CommonTransform2D` → `Transform2D` |
| `common/transform.ts` | 重命名 `CommonTransform3D` → `Transform3D` |
| `common/transform.ts` | `Transform3D` 继承 `ITransform` |

### 3.5 Phase 5: 清理 Easing/State/Property 冗余 (优先级: 中)

| 文件 | 修改内容 |
|------|---------|
| `animation/easing.ts` | 删除 `ExtendedEasingType` 枚举 |
| `animation/easing.ts` | 添加 `type EasingType = EasingFunction` |
| `core/interfaces.ts` | 新增 `BaseState` 接口 |
| `core/enums.ts` | 新增 `StateCategory` 枚举 |
| `common/interaction.ts` | `InteractionState` 继承 `BaseState` |
| `design/components.ts` | `ComponentState` 继承 `BaseState` |
| `animation/stateMachine.ts` | `AnimationState` 继承 `BaseState` |

### 3.6 Phase 6: 验证和文档更新 (优先级: 低)

| 文件 | 修改内容 |
|------|---------|
| `index.ts` | 检查并解决可能的命名冲突 |
| `llmdoc/reference/usd-core-types.md` | 更新类型定义文档 |
| `llmdoc/guides/usd-animation.md` | 更新代码示例 |
| `docs/duplicate-analysis-report.md` | 标记为已解决 |

---

## 4. 分阶段执行步骤

### Phase 1: 修复循环依赖 (预计 0.5 天)

**步骤**:
1. 将 `AnimationState`、`AnimationTransition` 从 `animation/stateMachine.ts` 移动到 `common/animation.ts`
2. 更新 `common/animation.ts` 删除对 animation 模块的导入
3. 更新 `animation/index.ts` 重新导出这些类型
4. 运行 `pnpm typecheck` 验证

**验证检查点**:
- [ ] `pnpm typecheck` 无循环依赖警告
- [ ] 所有导入路径正确

### Phase 2: 统一动画类型 (预计 1 天)

**步骤**:
1. 在 `core/generics.ts` 添加 `UnifiedKeyframe<T>` 和 `UnifiedAnimationTrack<K>`
2. 更新 `common/frame.ts` 使用新的基类
3. 更新 `common/transform.ts` 的关键帧和轨道类型
4. 更新 `animation/core.ts` 的 USD 类型
5. 更新 `rendering/material.ts` 的材质动画类型
6. 运行类型检查

**验证检查点**:
- [ ] 所有 *Keyframe 类型统一使用 UnifiedKeyframe
- [ ] 所有 *AnimationTrack 类型统一继承 UnifiedAnimationTrack
- [ ] `pnpm typecheck` 通过

### Phase 3: 统一材质和纹理类型 (预计 1 天)

**步骤**:
1. 在 `core/generics.ts` 添加 `TextureTransform` 和 `TextureReference`
2. 更新 `common/material.ts` 使用类型别名
3. 删除 `rendering/material.ts` 中的重复定义
4. 更新所有导入
5. 运行类型检查

**验证检查点**:
- [ ] 只有一个 TextureReference 定义 (在 core)
- [ ] 只有一个 TextureTransform 定义 (在 core)
- [ ] `pnpm typecheck` 通过

### Phase 4: 统一 Transform 类型 (预计 0.5 天)

**步骤**:
1. 重命名 `CommonTransform` → `UsdTransform`
2. 添加向后兼容的类型别名
3. 让 `Transform3D` 继承 `ITransform`
4. 更新所有使用这些类型的文件
5. 运行类型检查

**验证检查点**:
- [ ] Transform 层次清晰: ITransform → Transform3D → UsdTransform
- [ ] 向后兼容: CommonTransform 仍可用
- [ ] `pnpm typecheck` 通过

### Phase 5: 清理冗余类型 (预计 1 天)

**步骤**:
1. 删除 `ExtendedEasingType`，添加类型别名
2. 添加 `BaseState` 和 `StateCategory`
3. 更新所有 State 类型继承 BaseState
4. 运行类型检查

**验证检查点**:
- [ ] 无重复的 Easing 定义
- [ ] 所有 State 类型有统一基础
- [ ] `pnpm typecheck` 通过

### Phase 6: 验证和文档 (预计 0.5 天)

**步骤**:
1. 运行完整的类型检查
2. 检查 index.ts 导出是否有命名冲突
3. 更新 llmdoc 文档
4. 创建迁移指南

**验证检查点**:
- [ ] `pnpm typecheck` 通过
- [ ] `pnpm build` 通过
- [ ] 文档已更新
- [ ] 无导出命名冲突

---

## 5. 验证方案

### 5.1 类型完整性验证

```bash
# 运行 TypeScript 类型检查
pnpm typecheck

# 构建包
pnpm build

# 检查导出
node -e "const spec = require('./dist'); console.log(Object.keys(spec).length, 'exports');"
```

### 5.2 导出冲突检测

```typescript
// scripts/check-exports.ts
import * as spec from '../src';

const exports = Object.keys(spec);
const duplicates = exports.filter((item, index) => exports.indexOf(item) !== index);

if (duplicates.length > 0) {
  console.error('发现重复导出:', duplicates);
  process.exit(1);
}

console.log(`✓ 共 ${exports.length} 个导出，无冲突`);
```

### 5.3 依赖关系验证

```bash
# 使用 madge 检查循环依赖
npx madge --circular --extensions ts src/
```

---

## 6. 风险评估和缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 破坏下游代码 | 高 | 提供向后兼容的类型别名和 @deprecated 标记 |
| 导入路径变更 | 中 | 保持原有导出，新类型额外导出 |
| 遗漏某些使用点 | 中 | 使用 TypeScript 编译器自动检测 |
| 文档过时 | 低 | 在重构完成后统一更新文档 |

---

## 7. 预计工时

| 阶段 | 工时 |
|------|------|
| Phase 1: 修复循环依赖 | 0.5 天 |
| Phase 2: 统一动画类型 | 1 天 |
| Phase 3: 统一材质和纹理类型 | 1 天 |
| Phase 4: 统一 Transform 类型 | 0.5 天 |
| Phase 5: 清理冗余类型 | 1 天 |
| Phase 6: 验证和文档 | 0.5 天 |
| **总计** | **4.5 天** |

---

## 8. 后续行动

1. **确认计划**: 审阅本文档，确认重构范围和优先级
2. **创建分支**: `git checkout -b refactor/type-deduplication`
3. **按阶段执行**: 每个 Phase 完成后提交，便于回滚
4. **代码审查**: 每个 Phase 完成后进行 PR 审查
5. **合并发布**: 所有 Phase 完成后合并到主分支

---

*本文档由 Scout 调查代理综合生成，基于对 specification 包的全面分析*

生成时间: 2025-12-05
