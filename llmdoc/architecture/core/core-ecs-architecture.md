---
id: "core-ecs-architecture"
type: "constitution"
title: "Core ECS Architecture Bible"
description: "Core包ECS架构的核心规范，定义Entity、Component、System的实现标准和执行模式"
tags: ["ecs", "architecture", "core", "entity", "component", "system", "data-oriented"]
context_dependency: ["graphics-system-bible", "coding-conventions"]
related_ids: ["core-integration-boundary", "engine-architecture", "rhi-architecture"]
token_cost: "high"
---

# Core ECS Architecture Bible

## Context

本文档是 `@maxellabs/core` 包的架构宪法，定义ECS（Entity-Component-System）架构的实现规范。Core包与渲染层（RHI）完全解耦，通过 `@maxellabs/engine` 进行最终组装。

## Goal

提供统一、准确、完整的ECS架构标准，确保：
1. 组件化设计的一致性
2. 数据与逻辑的完全分离
3. 高性能的批处理能力
4. 与渲染层的清晰边界

---

## 第一章：核心概念与接口定义

### 1.1 ECS三元组定义

```typescript
// ============= ENTITY =============
/**
 * Entity: 纯粹的唯一标识符
 * 约束：Entity本身不持有任何数据或逻辑
 */
type EntityId = number;

interface IEntityManager {
  /** 创建新实体 */
  create(): EntityId;

  /** 销毁实体及其所有组件 */
  destroy(entity: EntityId): void;

  /** 检查实体是否存在 */
  exists(entity: EntityId): boolean;

  /** 获取实体的代数（用于验证引用有效性） */
  getGeneration(entity: EntityId): number;
}

// ============= COMPONENT =============
/**
 * Component: 纯数据结构，无方法
 * 约束：只包含数据字段，不包含任何业务逻辑
 */
interface IComponent {
  /** 组件类型标识（用于查询） */
  readonly __type: symbol;
}

/**
 * 组件存储策略
 */
interface IComponentStorage<T extends IComponent> {
  /** 为实体添加组件 */
  add(entity: EntityId, component: T): void;

  /** 移除实体的组件 */
  remove(entity: EntityId): boolean;

  /** 获取实体的组件（只读） */
  get(entity: EntityId): Readonly<T> | undefined;

  /** 获取实体的组件（可变） */
  getMut(entity: EntityId): T | undefined;

  /** 检查实体是否拥有此组件 */
  has(entity: EntityId): boolean;

  /** 批量迭代 */
  iter(): IterableIterator<[EntityId, T]>;
}

// ============= SYSTEM =============
/**
 * System: 处理特定组件组合的逻辑单元
 * 约束：System不持有状态，所有状态都在Component或Resource中
 */
interface ISystem {
  /** 系统唯一标识 */
  readonly id: string;

  /** 执行优先级（数字越小越先执行） */
  readonly priority: number;

  /** 系统执行 */
  execute(world: IWorld, deltaTime: number): void;

  /** 系统是否启用 */
  enabled: boolean;
}

/**
 * 查询构建器 - 用于组件组合查询
 */
interface IQuery<T extends IComponent[]> {
  /** 必须拥有的组件 */
  with<C extends IComponent>(...components: C[]): IQuery<[...T, C]>;

  /** 不能拥有的组件 */
  without<C extends IComponent>(...components: C[]): IQuery<T>;

  /** 执行查询 */
  iter(world: IWorld): IterableIterator<[EntityId, ...T]>;
}
```

### 1.2 World容器

```typescript
/**
 * World: ECS世界容器
 * 职责：管理所有Entity、Component、System、Resource
 */
interface IWorld {
  // === Entity Management ===
  readonly entities: IEntityManager;

  // === Component Management ===
  registerComponent<T extends IComponent>(type: new () => T): void;
  getStorage<T extends IComponent>(type: new () => T): IComponentStorage<T>;

  // === System Management ===
  addSystem(system: ISystem): void;
  removeSystem(systemId: string): void;
  getSystem(systemId: string): ISystem | undefined;

  // === Resource Management ===
  insertResource<T>(resource: T): void;
  getResource<T>(type: new () => T): T | undefined;
  getResourceMut<T>(type: new () => T): T | undefined;

  // === Query ===
  query<T extends IComponent[]>(): IQuery<T>;

  // === Lifecycle ===
  update(deltaTime: number): void;
}
```

---

## 第二章：组件设计规范

### 2.1 组件类型分类

```typescript
/**
 * 1. 标记组件（Marker Component）
 * 用途：标记实体具有某种属性，无数据
 */
class VisibleTag implements IComponent {
  readonly __type = Symbol('VisibleTag');
}

class StaticTag implements IComponent {
  readonly __type = Symbol('StaticTag');
}

/**
 * 2. 数据组件（Data Component）
 * 用途：存储实体的具体数据
 */
class TransformComponent implements IComponent {
  readonly __type = Symbol('Transform');

  position: Vector3 = Vector3.zero();
  rotation: Quaternion = Quaternion.identity();
  scale: Vector3 = Vector3.one();

  // 缓存的世界矩阵
  worldMatrix: Matrix4 = Matrix4.identity();
  localMatrix: Matrix4 = Matrix4.identity();

  // 脏标记
  dirty: boolean = true;
}

/**
 * 3. 关系组件（Relationship Component）
 * 用途：描述实体间的关系
 */
class ParentComponent implements IComponent {
  readonly __type = Symbol('Parent');

  parentId: EntityId = -1;
}

class ChildrenComponent implements IComponent {
  readonly __type = Symbol('Children');

  childIds: EntityId[] = [];
}

/**
 * 4. 渲染相关组件（由engine包定义，core包只定义接口）
 */
interface IMeshComponent extends IComponent {
  geometryId: string;
  materialId: string;
}

interface ICameraComponent extends IComponent {
  projectionType: 'perspective' | 'orthographic';
  fov: number;
  near: number;
  far: number;
  aspect: number;
}
```

### 2.2 组件设计约束

```typescript
// ✅ 正确：纯数据结构
class HealthComponent implements IComponent {
  readonly __type = Symbol('Health');

  current: number = 100;
  max: number = 100;
}

// ❌ 错误：包含业务逻辑
class BadHealthComponent implements IComponent {
  readonly __type = Symbol('Health');

  current: number = 100;
  max: number = 100;

  // ❌ 禁止在组件中定义方法
  takeDamage(amount: number): void {
    this.current = Math.max(0, this.current - amount);
  }

  // ❌ 禁止在组件中定义计算属性
  get isDead(): boolean {
    return this.current <= 0;
  }
}
```

**负面约束：**
- 🚫 禁止在组件中定义方法
- 🚫 禁止在组件中定义getter/setter逻辑
- 🚫 禁止组件之间直接引用（使用EntityId）
- 🚫 禁止在组件中持有对World的引用

---

## 第三章：系统设计规范

### 3.1 系统执行顺序

```typescript
/**
 * 系统执行阶段定义
 */
enum SystemStage {
  /** 输入处理 */
  PreUpdate = 0,

  /** 主更新逻辑 */
  Update = 100,

  /** 变换计算 */
  PostUpdate = 200,

  /** 渲染准备（仅在engine包中） */
  PreRender = 300,

  /** 渲染执行（仅在engine包中） */
  Render = 400,

  /** 渲染后处理 */
  PostRender = 500,
}

/**
 * 系统依赖声明
 */
interface SystemDescriptor {
  id: string;
  stage: SystemStage;

  /** 必须在这些系统之后执行 */
  after?: string[];

  /** 必须在这些系统之前执行 */
  before?: string[];
}
```

### 3.2 系统实现模式

```typescript
/**
 * 变换系统 - 处理层级变换
 */
class TransformSystem implements ISystem {
  readonly id = 'TransformSystem';
  readonly priority = SystemStage.PostUpdate;
  enabled = true;

  execute(world: IWorld, deltaTime: number): void {
    // 1. 查询所有带Transform的根实体（无Parent）
    const roots = world.query<[TransformComponent]>()
      .with(TransformComponent)
      .without(ParentComponent)
      .iter(world);

    // 2. 递归更新变换层级
    for (const [entity, transform] of roots) {
      this.updateTransformHierarchy(world, entity, transform, Matrix4.identity());
    }
  }

  private updateTransformHierarchy(
    world: IWorld,
    entity: EntityId,
    transform: TransformComponent,
    parentWorldMatrix: Matrix4
  ): void {
    // 更新本地矩阵
    if (transform.dirty) {
      Matrix4.compose(
        transform.position,
        transform.rotation,
        transform.scale,
        transform.localMatrix
      );
    }

    // 计算世界矩阵
    Matrix4.multiply(parentWorldMatrix, transform.localMatrix, transform.worldMatrix);
    transform.dirty = false;

    // 处理子节点
    const children = world.getStorage(ChildrenComponent).get(entity);
    if (children) {
      for (const childId of children.childIds) {
        const childTransform = world.getStorage(TransformComponent).getMut(childId);
        if (childTransform) {
          this.updateTransformHierarchy(world, childId, childTransform, transform.worldMatrix);
        }
      }
    }
  }
}
```

### 3.3 系统设计约束

```typescript
// ✅ 正确：无状态系统
class CorrectSystem implements ISystem {
  readonly id = 'CorrectSystem';
  readonly priority = 0;
  enabled = true;

  execute(world: IWorld, deltaTime: number): void {
    // 所有数据从world获取
    const query = world.query<[TransformComponent]>();
    // ...
  }
}

// ❌ 错误：有状态系统
class BadSystem implements ISystem {
  readonly id = 'BadSystem';
  readonly priority = 0;
  enabled = true;

  // ❌ 禁止系统持有状态
  private cachedEntities: EntityId[] = [];
  private lastFrameTime: number = 0;

  execute(world: IWorld, deltaTime: number): void {
    // ❌ 使用缓存状态
    for (const entity of this.cachedEntities) {
      // ...
    }
  }
}
```

**负面约束：**
- 🚫 禁止系统持有可变状态（使用Resource代替）
- 🚫 禁止系统直接创建/销毁实体（使用CommandBuffer）
- 🚫 禁止系统之间直接调用（使用事件或依赖声明）
- 🚫 禁止在系统中进行同步I/O操作

---

## 第四章：资源系统

### 4.1 资源定义

```typescript
/**
 * Resource: 全局单例数据
 * 用途：存储不属于特定实体的全局状态
 */

// 时间资源
class TimeResource {
  deltaTime: number = 0;
  totalTime: number = 0;
  frameCount: number = 0;
}

// 输入资源
class InputResource {
  keys: Map<string, boolean> = new Map();
  mousePosition: Vector2 = Vector2.zero();
  mouseButtons: boolean[] = [false, false, false];
}

// 配置资源
class ConfigResource {
  readonly targetFrameRate: number = 60;
  readonly enablePhysics: boolean = false;
  readonly debugMode: boolean = false;
}

// 事件队列资源
class EventQueueResource<T> {
  private events: T[] = [];

  push(event: T): void {
    this.events.push(event);
  }

  drain(): T[] {
    const events = this.events;
    this.events = [];
    return events;
  }
}
```

### 4.2 命令缓冲区

```typescript
/**
 * CommandBuffer: 延迟执行的世界修改命令
 * 用途：避免在迭代过程中修改数据结构
 */
interface ICommandBuffer {
  /** 延迟创建实体 */
  spawn(): EntityId;

  /** 延迟销毁实体 */
  despawn(entity: EntityId): void;

  /** 延迟添加组件 */
  insert<T extends IComponent>(entity: EntityId, component: T): void;

  /** 延迟移除组件 */
  remove<T extends IComponent>(entity: EntityId, type: new () => T): void;

  /** 执行所有命令 */
  flush(world: IWorld): void;
}
```

---

## 第五章：性能优化规范

### 5.1 组件存储策略

```typescript
/**
 * 稀疏集合存储（SparseSet）
 * 适用：大多数组件
 * 优点：O(1)访问，高效迭代
 */
class SparseSetStorage<T extends IComponent> implements IComponentStorage<T> {
  private sparse: number[] = [];  // EntityId -> dense index
  private dense: EntityId[] = [];  // 连续的EntityId
  private data: T[] = [];         // 连续的组件数据

  // 实现方法...
}

/**
 * 原型存储（Archetype）
 * 适用：频繁查询的组件组合
 * 优点：极高的缓存友好性
 */
interface Archetype {
  /** 此原型包含的组件类型集合 */
  componentTypes: Set<symbol>;

  /** 属于此原型的实体列表 */
  entities: EntityId[];

  /** 组件数据表（按类型分列） */
  columns: Map<symbol, unknown[]>;
}
```

### 5.2 查询缓存

```typescript
/**
 * 查询缓存策略
 */
class QueryCache {
  private cachedQueries: Map<string, EntityId[]> = new Map();

  /** 生成查询键 */
  private generateKey(withTypes: symbol[], withoutTypes: symbol[]): string {
    const withStr = withTypes.sort().join(',');
    const withoutStr = withoutTypes.sort().join(',');
    return `${withStr}|${withoutStr}`;
  }

  /** 使缓存失效（当组件添加/移除时调用） */
  invalidate(componentType: symbol): void {
    // 使所有包含此组件类型的查询失效
    for (const [key] of this.cachedQueries) {
      if (key.includes(componentType.toString())) {
        this.cachedQueries.delete(key);
      }
    }
  }
}
```

### 5.3 批处理模式

```typescript
/**
 * 批处理优化示例
 */
class BatchTransformSystem implements ISystem {
  readonly id = 'BatchTransformSystem';
  readonly priority = SystemStage.PostUpdate;
  enabled = true;

  // 预分配的临时矩阵（避免GC）
  private static readonly tempMatrix = Matrix4.identity();

  execute(world: IWorld, deltaTime: number): void {
    const storage = world.getStorage(TransformComponent);

    // 批量处理，利用数据局部性
    for (const [entity, transform] of storage.iter()) {
      if (transform.dirty) {
        // 使用预分配矩阵
        Matrix4.compose(
          transform.position,
          transform.rotation,
          transform.scale,
          BatchTransformSystem.tempMatrix
        );

        // 复制到目标
        transform.localMatrix.copyFrom(BatchTransformSystem.tempMatrix);
        transform.dirty = false;
      }
    }
  }
}
```

---

## 第六章：与渲染层边界

### 6.1 Core包职责边界

```
┌─────────────────────────────────────────────────────────┐
│                    @maxellabs/core                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Entity     │  │  Component   │  │   System     │   │
│  │   Manager    │  │   Storage    │  │   Executor   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Transform   │  │   Parent/    │  │   Query      │   │
│  │  Component   │  │   Children   │  │   Builder    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Resource   │  │   Command    │  │   Event      │   │
│  │   Manager    │  │   Buffer     │  │   System     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ 接口抽象
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   @maxellabs/engine                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Mesh       │  │   Camera     │  │   Light      │   │
│  │  Component   │  │  Component   │  │  Component   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Render     │  │   Culling    │  │   Scene      │   │
│  │   System     │  │   System     │  │   Manager    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ 命令生成
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    @maxellabs/rhi                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Device     │  │   Pipeline   │  │   Command    │   │
│  │              │  │   State      │  │   Buffer     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 6.2 渲染组件接口（Core定义，Engine实现）

```typescript
// ===== Core包中定义的接口 =====

/**
 * 可渲染组件接口
 * Core包只定义接口，不包含具体实现
 */
interface IRenderableComponent extends IComponent {
  /** 是否可见 */
  visible: boolean;

  /** 渲染层级 */
  renderLayer: number;

  /** 渲染排序优先级 */
  renderOrder: number;
}

/**
 * 几何体引用组件接口
 */
interface IGeometryComponent extends IComponent {
  /** 几何体资源ID */
  geometryId: string;

  /** 边界盒（用于剔除） */
  boundingBox: {
    min: Vector3Like;
    max: Vector3Like;
  };
}

/**
 * 材质引用组件接口
 */
interface IMaterialComponent extends IComponent {
  /** 材质资源ID */
  materialId: string;

  /** 材质变体 */
  variant?: string;
}
```

---

## Few-Shot示例

### 示例1：创建带Transform的实体

```typescript
// 正确的实体创建流程
function createEntity(world: IWorld): EntityId {
  const entity = world.entities.create();

  // 添加Transform组件
  const transform = new TransformComponent();
  transform.position.set(0, 1, 0);
  transform.scale.set(1, 1, 1);
  world.getStorage(TransformComponent).add(entity, transform);

  return entity;
}
```

### 示例2：创建父子层级关系

```typescript
// 正确的层级关系建立
function setParent(world: IWorld, child: EntityId, parent: EntityId): void {
  // 1. 添加Parent组件到子实体
  const parentComp = new ParentComponent();
  parentComp.parentId = parent;
  world.getStorage(ParentComponent).add(child, parentComp);

  // 2. 更新父实体的Children组件
  const childrenStorage = world.getStorage(ChildrenComponent);
  let children = childrenStorage.getMut(parent);

  if (!children) {
    children = new ChildrenComponent();
    childrenStorage.add(parent, children);
  }

  children.childIds.push(child);

  // 3. 标记变换为脏
  const childTransform = world.getStorage(TransformComponent).getMut(child);
  if (childTransform) {
    childTransform.dirty = true;
  }
}
```

### 示例3：查询特定组件组合

```typescript
// 查询所有可见的、带Transform和Mesh的实体
function queryVisibleMeshes(world: IWorld): IterableIterator<[EntityId, TransformComponent]> {
  return world.query<[TransformComponent]>()
    .with(TransformComponent)
    .with(VisibleTag)
    .without(StaticTag)
    .iter(world);
}
```

---

## 相关文档

### 核心规范
- [图形系统圣经](../../foundations/graphics-bible.md) - 坐标系和矩阵规范
- [编码规范](../../foundations/coding-conventions.md) - TypeScript代码规范

### 集成文档
- [Core-Engine-RHI集成边界](./core-integration-boundary.md) - 包间集成规范
- [Engine架构](./engine-architecture.md) - Engine包架构

### API参考
- [Math API](../../reference/api-v2/math/index.md) - 数学库API
- [Specification API](../../reference/api-v2/specification/index.md) - 类型定义
