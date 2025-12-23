---
id: "traits-pattern"
type: "reference"
title: "Traits 模式架构（开发宪法）"
description: "基于组合优于继承的可组合接口设计模式，用于构建灵活、可扩展的类型系统 - 项目开发宪法"
tags: ["architecture", "design-pattern", "composition", "typescript", "interface-design", "constitution"]
context_dependency: ["specification-type-system"]
related_ids: ["specification-type-system", "component-architecture", "core-components"]
---

## 📜 开发宪法地位

> **重要**: 本文档是项目的**开发宪法**，所有接口设计必须遵循本文档定义的 Traits 模式原则。

**源代码位置**: `packages/specification/src/core/traits.ts`

---

## 🔌 接口定义

### 核心设计原则

```typescript
// Traits 模式的核心：每个 Trait 定义一个单一职责的能力
interface Trait {
  // 只包含相关属性，保持最小化
}

// 通过 extends 组合多个 Traits
interface ComplexEntity extends Trait1, Trait2, Trait3 {}
```

### 基础 Traits 分类

#### 1. 标识类 Traits
```typescript
// 可命名的 - 单一语义：名称属性
export interface Nameable {
  name: string;
}

// 可选命名 - 支持可选场景
export interface OptionalNameable {
  name?: string;
}

// 可描述的 - 描述性元数据
export interface Describable {
  description?: string;
}

// 可标记的 - 标签系统
export interface Taggable {
  tags?: string[];
}

// 可扩展的 - 自定义数据
export interface Extensible {
  customData?: Record<string, unknown>;
}
```

#### 2. 资源引用类 Traits
```typescript
// 资源引用能力
export interface AssetReferable {
  assetId: string;
}

// 启用状态（可选）
export interface Enableable {
  enabled?: boolean;
}

// 必须启用状态
export interface RequiredEnableable {
  enabled: boolean;
}
```

#### 3. 时间相关 Traits
```typescript
// 持续时间
export interface Durable {
  duration: number; // 秒
}

// 播放状态
export interface Playable {
  playing: boolean;
}

// 播放速度
export interface Speedy {
  speed: number;
}

// 循环属性
export interface Loopable {
  loop: boolean;
}
```

#### 4. 值容器 Traits
```typescript
// 布尔值容器
export interface BooleanValue {
  value: boolean;
}

// 数值容器
export interface NumberValue {
  value: number;
}

// 字符串容器
export interface StringValue {
  value: string;
}
```

#### 5. 审计与版本 Traits
```typescript
// 版本信息
export interface Versionable {
  version: VersionInfo;
}

// 审计信息
export interface Auditable {
  creator?: string;
  createdAt?: string;
  lastModified?: string;
}
```

### 组合模式

#### 基础组合
```typescript
// 基础元数据 - 组合常用标识能力
export interface BaseMetadata
  extends OptionalNameable, Describable, Taggable, Extensible {}

// 完整元数据 - 包含版本和审计
export interface FullMetadata
  extends Nameable, Describable, Taggable, Extensible, Versionable, Auditable {}

// 播放状态 - 组合时间相关能力
export interface PlaybackState
  extends Playable, Speedy, Loopable, Durable {}
```

## 🏗️ 架构原理

### 设计原则

1. **单一职责**：每个 Trait 只定义一个语义明确的能力
2. **最小化接口**：避免包含不相关的属性
3. **可组合性**：通过 extends 实现灵活组合
4. **可选性支持**：提供可选版本的 Trait 适应不同场景
5. **消除重复**：避免在多个接口中重复定义相同字段

### 使用模式

#### 1. 接口定义阶段
```typescript
// 步骤 1: 定义基础 Traits
interface Transformable {
  position: Vector3Like;
  rotation: QuaternionLike;
  scale: Vector3Like;
}

interface Renderable {
  visible: boolean;
  layer: number;
}

// 步骤 2: 组合成完整接口
interface MeshComponent extends Transformable, Renderable, AssetReferable {
  // 可以添加特定字段
  materialId?: string;
}
```

#### 2. 实现阶段
```typescript
class MeshComponentImpl implements MeshComponent {
  // 来自 Transformable
  position: Vector3Like;
  rotation: QuaternionLike;
  scale: Vector3Like;

  // 来自 Renderable
  visible: boolean;
  layer: number;

  // 来自 AssetReferable
  assetId: string;

  // 自有字段
  materialId?: string;

  // fromData 方法 - 统一创建模式
  static fromData(data: Partial<MeshComponent>): MeshComponentImpl {
    const instance = new MeshComponentImpl();
    instance.position = data.position || { x: 0, y: 0, z: 0 };
    instance.rotation = data.rotation || { x: 0, y: 0, z: 0, w: 1 };
    instance.scale = data.scale || { x: 1, y: 1, z: 1 };
    instance.visible = data.visible ?? true;
    instance.layer = data.layer || 0;
    instance.assetId = data.assetId || '';
    instance.materialId = data.materialId;
    return instance;
  }
}
```

#### 3. 组合验证
```typescript
// 验证组合的有效性
type ValidCombination = Transformable & Renderable & AssetReferable;

// 编译时检查：确保所有必需字段都存在
const test: ValidCombination = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
  visible: true,
  layer: 0,
  assetId: 'mesh-001'
};
```

## 📋 使用示例

### 示例 1: 动画组件设计
```typescript
// 基础动画 Traits
interface Animatable {
  currentTime: number;
  duration: number;
}

interface Controllable {
  playing: boolean;
  speed: number;
  loop: boolean;
}

// 组合成动画状态组件
export interface AnimationState
  extends Animatable, Controllable, OptionalNameable {
  clips?: string[];
}

// 实现
export class AnimationStateImpl implements AnimationState {
  currentTime: number = 0;
  duration: number = 0;
  playing: boolean = false;
  speed: number = 1.0;
  loop: boolean = false;
  name?: string;
  clips?: string[];

  static fromData(data: Partial<AnimationState>): AnimationStateImpl {
    const state = new AnimationStateImpl();
    state.currentTime = data.currentTime || 0;
    state.duration = data.duration || 0;
    state.playing = data.playing ?? false;
    state.speed = data.speed ?? 1.0;
    state.loop = data.loop ?? false;
    state.name = data.name;
    state.clips = data.clips ? [...data.clips] : undefined;
    return state;
  }
}
```

### 示例 2: 物理组件设计
```typescript
// 物理相关 Traits
interface Kinematic {
  position: Vector3Like;
  velocity: Vector3Like;
}

interface Dynamic {
  acceleration: Vector3Like;
  mass: number;
}

interface Gravitational {
  gravity: Vector3Like;
  damping: number;
}

// 组合
export interface PhysicsState
  extends Kinematic, Dynamic, Gravitational, Enableable {}

// 实现
export class PhysicsStateImpl implements PhysicsState {
  position: Vector3Like = { x: 0, y: 0, z: 0 };
  velocity: Vector3Like = { x: 0, y: 0, z: 0 };
  acceleration: Vector3Like = { x: 0, y: 0, z: 0 };
  mass: number = 1.0;
  gravity: Vector3Like = { x: 0, y: -9.8, z: 0 };
  damping: number = 0.01;
  enabled: boolean = true;

  static fromData(data: Partial<PhysicsState>): PhysicsStateImpl {
    const state = new PhysicsStateImpl();
    state.position = data.position || { x: 0, y: 0, z: 0 };
    state.velocity = data.velocity || { x: 0, y: 0, z: 0 };
    state.acceleration = data.acceleration || { x: 0, y: 0, z: 0 };
    state.mass = data.mass ?? 1.0;
    state.gravity = data.gravity || { x: 0, y: -9.8, z: 0 };
    state.damping = data.damping ?? 0.01;
    state.enabled = data.enabled ?? true;
    return state;
  }
}
```

### 示例 3: 视觉组件设计
```typescript
// 视觉相关 Traits
interface Renderable {
  visible: boolean;
  layer: number;
}

interface ShadowCaster {
  castShadow: boolean;
  receiveShadow: boolean;
}

interface MaterialUser {
  materialId: string;
  textureIds?: string[];
}

// 组合
export interface VisualState
  extends Renderable, ShadowCaster, MaterialUser, AssetReferable {}

// 实现
export class VisualStateImpl implements VisualState {
  visible: boolean = true;
  layer: number = 0;
  castShadow: boolean = false;
  receiveShadow: boolean = false;
  materialId: string = '';
  textureIds?: string[];
  assetId: string = '';

  static fromData(data: Partial<VisualState>): VisualStateImpl {
    const state = new VisualStateImpl();
    state.visible = data.visible ?? true;
    state.layer = data.layer || 0;
    state.castShadow = data.castShadow ?? false;
    state.receiveShadow = data.receiveShadow ?? false;
    state.materialId = data.materialId || '';
    state.textureIds = data.textureIds ? [...data.textureIds] : undefined;
    state.assetId = data.assetId || '';
    return state;
  }
}
```

## ⚠️ 开发宪法 - 禁止事项

### 🔴 一级约束（必须遵守）

- 🚫 **禁止类继承**：永远不要使用 `class extends` 来复用逻辑
  - ❌ 错误: `class MyComponent extends BaseComponent { ... }`
  - ✅ 正确: `interface MyComponent extends Trait1, Trait2 { ... }`

- 🚫 **禁止重复字段**：相同的字段不能在多个 Trait 中重复定义
  - ❌ 错误: `TraitA { id: string }` 和 `TraitB { id: string }`
  - ✅ 正确: `interface Identifiable { id: string }` 然后 `extends Identifiable`

- 🚫 **禁止业务逻辑**：Trait 只能包含数据字段定义
  - ❌ 错误: `interface Calculatable { calculate(): void; }`
  - ✅ 正确: `interface Calculatable { value: number; }`

### 🟡 二级约束（强烈建议）

- 🚫 **避免过度耦合**：一个 Trait 只定义一个语义明确的能力
- 🚫 **避免上帝接口**：不要创建包含所有字段的"万能接口"
- 🚫 **避免复杂泛型**：保持接口组合的可读性
- 🚫 **避免可选滥用**：必需字段用基础 Trait，可选用可选版本

### ✅ 最佳实践

- ✅ **单一职责**：每个 Trait 只做一件事
- ✅ **清晰命名**：使用描述性名称（如 `Nameable`, `Enableable`）
- ✅ **完整文档**：每个 Trait 必须有 JSDoc 说明
- ✅ **组合验证**：使用 TypeScript 编译时检查组合完整性
- ✅ **版本意识**：变更时考虑向后兼容

### 📋 实际代码对照

```typescript
// ✅ 正确：从 traits.ts 的实际实现
export interface Nameable { name: string; }
export interface Describable { description?: string; }
export interface Taggable { tags?: string[]; }
export interface Extensible { customData?: Record<string, unknown>; }

// ✅ 正确：组合使用
export interface BaseMetadata
  extends Nameable, Describable, Taggable, Extensible {}

// ✅ 正确：在组件中实现
export class Metadata implements BaseMetadata {
  name: string = '';
  description?: string;
  tags?: string[];
  customData?: Record<string, unknown>;
}
```

## 🔗 相关架构

### 依赖关系
- **上游**：TypeScript 接口系统、泛型编程
- **下游**：ECS 组件设计、数据序列化
- **平行**：Specification 类型系统

### 使用场景
1. **ECS 组件**：定义组件数据结构
2. **配置接口**：构建可组合的配置类型
3. **API 设计**：设计灵活的接口契约
4. **数据验证**：基于 Trait 的数据结构验证
5. **序列化**：统一的数据格式定义

### 扩展模式
```typescript
// 1. 特定领域扩展
interface GameEntity extends BaseMetadata, Transformable, Renderable {
  // 游戏特定字段
  readonly entityType: string;
}

// 2. 条件组合
type ConditionalTraits<T> = T extends { enabled: true }
  ? RequiredEnableable & Renderable
  : Renderable;

// 3. 工厂模式
interface TraitFactory {
  create<T extends Trait>(data: Partial<T>): T;
}
```

---

## 📊 实际应用统计

### 当前项目中的 Traits 使用情况

| Trait 类型 | 数量 | 示例 |
|-----------|------|------|
| **标识类** | 5 | `Nameable`, `Describable`, `Taggable`, `Extensible`, `OptionalNameable` |
| **资源引用** | 3 | `AssetReferable`, `Enableable`, `RequiredEnableable` |
| **时间相关** | 4 | `Durable`, `Playable`, `Speedy`, `Loopable` |
| **值容器** | 3 | `BooleanValue`, `NumberValue`, `StringValue` |
| **审计版本** | 2 | `Versionable`, `Auditable` |
| **组合接口** | 3 | `BaseMetadata`, `FullMetadata`, `PlaybackState` |
| **总计** | **20** | - |

### 组件中的应用

```typescript
// 示例：基于 Traits 的 ECS 组件
export interface IAnimationState extends PlaybackState, OptionalNameable {
  currentClipId: string;
}

export class AnimationState implements IAnimationState {
  // 来自 Playable
  playing: boolean = false;
  // 来自 Speedy
  speed: number = 1;
  // 来自 Loopable
  loop: boolean = true;
  // 来自 Durable
  duration: number = 0;
  // 来自 OptionalNameable
  name?: string;
  // 自有字段
  currentClipId: string = '';

  static fromData(data: Partial<IAnimationState>): AnimationState {
    const state = new AnimationState();
    state.playing = data.playing ?? false;
    state.speed = data.speed ?? 1;
    state.loop = data.loop ?? true;
    state.duration = data.duration ?? 0;
    state.name = data.name;
    state.currentClipId = data.currentClipId ?? '';
    return state;
  }
 ```

---

## 🎯 设计原则总结

**Traits 模式**通过组合优于继承的方式，构建灵活、可扩展、类型安全的接口系统，是现代 TypeScript 架构的核心设计模式。

**核心价值**：
- ✅ **类型安全**：编译时检查接口完整性
- ✅ **代码复用**：通过 extends 避免重复定义
- ✅ **灵活组合**：按需组合所需能力
- ✅ **易于维护**：单一职责，变更隔离

**开发宪法地位**：所有新接口设计必须遵循本文档定义的 Traits 模式原则。
