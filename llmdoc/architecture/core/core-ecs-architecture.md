---
id: "core-ecs-architecture"
type: "constitution"
title: "Core ECS Architecture Bible"
description: "Core包架构宪法：定义基于Archetype的高性能、空间感知型ECS标准"
tags: ["ecs", "architecture", "core", "performance", "archetype", "transform", "spatial"]
context_dependency: ["spec-type-system", "coding-conventions"]
related_ids: ["engine-architecture", "rhi-architecture"]
version: "2.0.0 (Spatial-Core Revision)"
token_cost: "high"
last_updated: "2025-12-18"
---

# Core ECS Architecture Bible

## 1. 核心理念与边界 (Core Philosophy)

### 1.1 核心定位
`@maxellabs/core` 是世界的**唯一真理源 (Single Source of Truth)**。
它负责维护对象的数据状态、空间关系和生命周期。它**不知道** WebGL 是什么，也不依赖 DOM。

* **Core 的职责**：数据存储、变换计算 (`Matrix4`), 层级管理、脏标记传播、通用输入状态。
* **Engine 的职责**：作为 Core 的“观察者”，消费 Core 的数据进行渲染、音效播放或物理碰撞检测。

### 1.2 架构模式：Archetype ECS
为了满足 WebGL/WebGPU 对数据连续性的苛刻要求，我们采用 **Archetype (原型)** 内存布局。

* **SoA (Structure of Arrays)**：同一种 Component 的数据在内存中是连续的。
* **Zero-Copy Extraction**：在理想情况下，Core 计算出的 `WorldTransform` 矩阵数组可以直接传递给 RHI 进行 Instance Drawing。

---

## 2. 核心类型定义 (Type Definitions)

### 2.1 基础单元

```typescript
// Entity: 纯数字 ID (20位 Index + 12位 Generation)
export type Entity = number;

// Component: 必须是具体的类，纯数据结构 (POD)
export interface ComponentClass<T> {
  new (): T;
  readonly componentId: number; // 运行时自动生成或静态注入
}

// 标记组件: 用于逻辑分类 (如 "IsDirty", "UIElement", "BillBoard")
export abstract class TagComponent {}

```

### 2.2 World 接口

```typescript
export interface IWorld {
  // === 实体管理 (立即生效) ===
  // 注意：在 System 循环中严禁调用，必须使用 CommandBuffer
  createEntity(): Entity;
  destroyEntity(entity: Entity): void;

  // === 组件操作 ===
  add<T>(entity: Entity, component: ComponentClass<T>, data?: Partial<T>): void;
  remove<T>(entity: Entity, component: ComponentClass<T>): void;
  get<T>(entity: Entity, component: ComponentClass<T>): Readonly<T> | undefined;
  getMut<T>(entity: Entity, component: ComponentClass<T>): T | undefined; // 获取可变引用，触发脏标记

  // === 资源 (全局单例) ===
  insertResource<T>(resource: T): void;
  getResource<T>(resourceClass: new () => T): T | undefined;

  // === 帧循环 ===
  update(deltaTime: number): void;
}

```

---

## 3. 内置核心组件 (Built-in Components)

**边界修正说明**：以下组件是所有上层业务（UI、3D、报表）的公约数，必须驻留在 Core 中。

### 3.1 空间变换 (The Transform System)

采用 **双组件设计** 以分离“用户意图”和“系统计算”。

```typescript
/**
 * LocalTransform: 用户操作的数据源
 * 适用于 3D 物体和相对定位的 UI 元素
 */
export class LocalTransform {
  position: Vector3 = Vector3.ZERO;
  rotation: Quaternion = Quaternion.IDENTITY;
  scale: Vector3 = Vector3.ONE;

  //脏标记：当用户修改属性时，系统会自动标记（或需手动标记，视Proxy开销而定）
  dirty: boolean = true;
}

/**
 * WorldTransform: 系统计算出的最终结果
 * Engine 层只读取这个组件用于渲染
 */
export class WorldTransform {
  // 最终的模型矩阵 (Local -> World)
  matrix: Matrix4 = Matrix4.IDENTITY;

  // 可选：如果支持 UI 布局，可能包含 computedWidth/Height
}

```

### 3.2 场景图 (Hierarchy)

用于支撑 3D 父子节点或 UI DOM 树结构。

```typescript
export class Parent {
  entity: Entity;
}

export class Children {
  // 使用数组或链表存储子节点 ID
  entities: Entity[] = [];
}

```

### 3.3 基础状态

```typescript
/**
 * 显式可见性
 * 用户手动设置: "我想隐藏这个物体"
 */
export class Visible {
  value: boolean = true;
}

/**
 * 计算可见性
 * 系统计算: 父节点隐藏 -> 子节点也隐藏
 * Engine 渲染剔除以此为准
 */
export class ComputedVisible {
  isVisible: boolean = true;
}

```

---

## 4. 系统调度与执行流 (Scheduling)

Core 的 `update` 循环被严格划分为多个阶段。**Engine 的渲染通常发生在整个 Core Update 完成之后。**

### 4.1 阶段定义 (Stages)

| 阶段 | 名称 | 职责 |
| --- | --- | --- |
| 1 | **FrameStart** | 处理 `CommandBuffer` (结构变更)，更新 `TimeResource`。 |
| 2 | **Input** | 处理输入事件，更新 `InputResource`。 |
| 3 | **PreUpdate** | 游戏逻辑准备。 |
| 4 | **Update** | **核心业务逻辑** (用户脚本、物理结算、动画播放)。 |
| 5 | **PostUpdate** | **Core 系统接管**：<br>

<br>1. TransformSystem (计算矩阵)<br>

<br>2. HierarchySystem (同步父子关系)<br>

<br>3. VisibilitySystem (计算剔除状态) |
| 6 | **FrameEnd** | 清理脏标记，准备供 Engine 提取数据。 |

### 4.2 关键系统实现逻辑 (伪代码)

**TransformSystem (位于 PostUpdate 阶段)**
这是连接 UI/3D 的枢纽。

```typescript
function transformSystem(world: IWorld) {
  // 1. 获取所有脏的根节点 (无 Parent 且 LocalTransform.dirty)
  const roots = world.query([LocalTransform]).without(Parent).filter(t => t.dirty);

  // 2. 深度优先遍历，传递父矩阵
  roots.forEach(entity => updateRecursive(entity, Matrix4.IDENTITY));
}

function updateRecursive(entity: Entity, parentMatrix: Matrix4) {
  const local = world.get(entity, LocalTransform);
  const worldTx = world.getMut(entity, WorldTransform);

  // 3. 计算: Parent * Local = World
  const localMat = Matrix4.compose(local.position, local.rotation, local.scale);
  Matrix4.multiply(parentMatrix, localMat, worldTx.matrix);

  // 4. 处理子节点
  const children = world.get(entity, Children);
  if (children) {
    children.entities.forEach(child => updateRecursive(child, worldTx.matrix));
  }
}

```

---

## 5. 查询与响应式 (Queries & Reactivity)

为了避免每帧遍历所有实体，Core 必须提供高效的变更检测。

### 5.1 Query 描述符

```typescript
interface QueryFilter {
  all: ComponentClass<any>[];    // 必须包含
  any?: ComponentClass<any>[];   // 包含任意
  none?: ComponentClass<any>[];  // 必须不含
}

```

### 5.2 响应式迭代 (Reactive Iteration)

Engine 需要知道“哪些 Mesh 是新加的”以便上传 GPU Buffer。

```typescript
interface Query<T> {
  // 基础迭代 (O(N) 遍历匹配的原型)
  forEach(fn: (entity: Entity, ...comps: T) => void): void;

  // 增量迭代 (仅遍历本帧发生变化的实体)
  // 实现原理：通过 Archetype 迁移记录或 Dirty Bitmask
  forEachAdded(fn: (entity: Entity, ...comps: T) => void): void;
  forEachRemoved(fn: (entity: Entity) => void): void;
}

```

---

## 6. Core 与 Engine 的集成协议

### 6.1 数据流向

`Core (计算)` -> `Extraction (复制)` -> `Engine (渲染)`

### 6.2 提取器 (The Extractor)

Engine 包中将包含一系列 Extractor System，它们在渲染帧开始时运行。

**示例：MeshRenderExtractor**

```typescript
class MeshRenderExtractor {
  // 关注：具有 WorldTransform 和 MeshRef 的实体
  query = world.query({ all: [WorldTransform, MeshRef, ComputedVisible] });

  extract(renderScene: RenderScene) {
    this.query.forEach((entity, transform, meshRef, visible) => {
      if (!visible.isVisible) return;

      // 将 Core 的数据扁平化到 RenderScene 的 Arrays 中
      renderScene.addRenderable(
        meshRef.assetId,
        transform.matrix // 直接拷贝 float32 数组
      );
    });
  }
}

```

---

## 7. 性能规约 (Performance Rules)

1. **禁止动态闭包**：在 `forEach` 循环中，避免创建闭包函数。尽量使用预定义的 Handler。
2. **结构变更缓冲**：`add/remove` 组件涉及内存搬运。**绝对禁止**在每帧 Update 中对同一批实体反复添加/移除组件（例如：不要用添加 `IsSelected` 组件来表示选中，应该用 `Selection` 组件的一个 bool 字段）。
3. **对象池化**：Core 内部的 `Matrix4`、`Vector3` 运算必须使用全局对象池，实现 **Zero GC (零垃圾回收)** 循环。

