---
id: "core-ecs-architecture"
type: "architecture"
status: "partial_implemented"
implementation_status: "current_production"
title: "Core ECS Architecture Bible"
description: "Core包架构文档：当前GameObject+Component实现与未来Archetype ECS规划"
tags: ["ecs", "architecture", "core", "component", "entity", "transform", "hierarchy", "production"]
context_dependency: ["spec-type-system", "coding-conventions"]
related_ids: ["engine-architecture", "rhi-architecture"]
version: "2.1.0-current"
breaking_changes: false
token_cost: "high"
last_updated: "2025-12-18"
---

# Core ECS Architecture Bible

> ⚠️ **架构状态说明**:
> **当前实现**: Core 包采用 **GameObject + Component 模式** (`Entity extends ReferResource`)
> - ✅ **已实现**: 生产环境中运行
> - 📋 **RFC 提案**: Archetype ECS (标记为"Future Goals"章节)
>
> **核心差异**:
> - **当前**: 类 Unity GameObject 模式，Entity 是类实例，Component 有完整生命周期
> - **未来**: Archetype ECS，Entity 是纯数字 ID，Component 是纯数据结构 (SoA)
>
> **文件映射**:
> - 当前实现: `packages/core/src/base/`
> - RFC 提案: 本文档第 6-7 章节 (Future Goals)

---

## 1. 核心理念与边界 (Core Philosophy)

### 1.1 核心定位
`@maxellabs/core` 是世界的**唯一真理源 (Single Source of Truth)**。
它负责维护对象的数据状态、空间关系和生命周期。它**不知道** WebGL 是什么，也不依赖 DOM。

* **Core 的职责**: 数据存储、变换计算 (`Matrix4`), 层级管理、脏标记传播、通用输入状态
* **Engine 的职责**: 作为 Core 的“观察者”，消费 Core 的数据进行渲染、音效播放或物理碰撞检测

### 1.2 当前架构: GameObject + Component (已实现)
当前实现采用经典的 GameObject-Component 模式（类似 Unity/Unreal）:

* **引用计数资源**: `Entity extends ReferResource`，支持自动内存管理
* **类实例组件**: `Component` 是具有完整生命周期的类实例（awake/update/destroy）
* **层级管理**: 通过实体父子关系构建场景图
* **脏标记优化**: Transform 使用脏标记避免不必要的矩阵计算

### 1.3 未来规划: Archetype ECS (RFC)
为了满足未来 WebGL/WebGPU 对数据连续性的高性能要求，我们规划向 **Archetype (原型)** 内存布局迁移:

* **SoA (Structure of Arrays)**: 同一种 Component 的数据在内存中是连续的
* **纯数据组件**: Component 变为纯数据结构 (POD)
* **数字实体 ID**: Entity 从类实例变为纯数字 ID
* **Zero-Copy Extraction**: Core 计算出的矩阵数组可直接传递给 RHI

---

## 2. 当前实现: 核心类型定义

### 2.1 Entity (实体)

```typescript
// 文件: packages/core/src/base/entity.ts
export class Entity extends ReferResource {
  private active: boolean = true;
  private parent: Entity | null = null;
  private children: Entity[] = [];
  private components: Map<string, Component> = new Map();

  /** 每个实体默认包含 Transform 组件 */
  readonly transform: Transform;

  // 层级管理
  setParent(parent: Entity | null): this;
  addChild(child: Entity): this;
  getChildren(): ReadonlyArray<Entity>;

  // 组件管理
  addComponent<T extends Component>(component: T): T;
  getComponent<T extends Component>(type: new (entity: Entity) => T): T | null;
  removeComponent<T extends Component>(type: new (entity: Entity) => T): this;

  // 激活状态 (递归传播)
  setActive(value: boolean): void;
  getActive(): boolean; // 自动检查父级链

  // 更新 (递归调用)
  update(deltaTime: number): void;
}
```

**关键特性**:
- Entity 是**类实例**，不是纯数字 ID
- 支持完整的**生命周期管理**（创建、激活、销毁）
- 自动维护**父子层级**（实体层级 + 变换层级）

### 2.2 Component (组件基类)

```typescript
// 文件: packages/core/src/base/component.ts
export abstract class Component extends ReferResource {
  readonly entity: Entity;
  private enabled: boolean = true;
  private lifecycleState: ComponentLifecycleState;

  // 生命周期钩子
  protected onAwake(): void {}
  protected onEnable(): void {}
  protected onDisable(): void {}

  // 每帧调用 (由 Entity.update 导出)
  update(deltaTime: number): void {}
  lateUpdate(deltaTime: number): void {}

  // 激活控制
  getEnabled(): boolean;
  setEnabled(value: boolean): void;
}

enum ComponentLifecycleState {
  CREATED = 0,
  INITIALIZED = 1,
  ENABLED = 2,
  DISABLED = 3,
  DESTROYED = 4
}
```

### 2.3 Transform (变换组件)

```typescript
// 文件: packages/core/src/base/transform.ts
export class Transform extends Component {
  // === 本地变换数据 ===
  private _position: Vector3;
  private _rotation: Quaternion;
  private _scale: Vector3;

  // === 层级关系 ===
  private parent: Transform | null = null;
  private children: Transform[] = [];

  // === 世界变换缓存 ===
  private worldPosition: Vector3;
  private worldRotation: Quaternion;
  private worldScale: Vector3;
  private worldMatrix: Matrix4;

  // === 脏标记系统 ===
  private localMatrixDirty: boolean = true;
  private worldMatrixDirty: boolean = true;
  private directionsDirty: boolean = true;

  // === 属性访问器 (自动触发脏标记) ===
  get position(): Vector3 { return this._position; }
  set position(value: Vector3Like) {
    this._position.copyFrom(value);
    this.markDirty();
    this.onTransformChanged(); // 递归通知子节点
  }

  // === 矩阵计算 (懒惰计算) ===
  getLocalMatrix(): Matrix4;   // compose(pos, rot, scale)
  getWorldMatrix(): Matrix4;   // parent * local (递归)

  // === 世界空间操作 (需要计算) ===
  getWorldPosition(): Vector3;
  setWorldPosition(position: Vector3): this;
  getWorldRotation(): Quaternion;
  setWorldRotation(quaternion): this;

  lookAt(target: Vector3, up?: Vector3): this;
  rotate(axis: Vector3, angle: number): this;
  translate(translation: Vector3): this;

  // === 方向向量 ===
  getForward(): Vector3;  // Z轴负方向
  getUp(): Vector3;       // Y轴正方向
  getRight(): Vector3;    // X轴正方向
}
```

**核心机制**: 脏标记 + 懒惰计算
```typescript
set position(value) {
  this.worldMatrixDirty = true;
  this.onTransformChanged(); // 递归传播
}

getWorldMatrix(): Matrix4 {
  if (this.worldMatrixDirty) {
    this.updateWorldMatrix(); // 实际计算
  }
  return this.worldMatrix;
}
```

---

## 3. 执行流: 更新机制 (当前 vs RFC)

### 3.1 当前实现: 递归遍历

**核心**: 通过 `Entity.update()` 自递归，**无分阶段系统**

```typescript
// === 入口 (Scene/Engine 调用) ===
scene.update(deltaTime) {
  for (const e of rootEntities) {
    e.update(deltaTime); // 深度优先递归
  }
}

// === Entity 内部 ===
class Entity {
  update(deltaTime: number): void {
    if (!this.getActive()) return;

    // 1. 更新所有组件 (仅当前实体)
    for (const c of this.components.values()) {
      if (c.getEnabled() && c.lifecycleState === ENABLED) {
        c.update(deltaTime); // 用户逻辑
      }
    }

    // 2. 递归更新子实体
    for (const child of this.children) {
      if (child.getActive()) {
        child.update(deltaTime); // 深度优先
      }
    }
  }
}
```

### 3.2 Transform 更新: 懒惰计算模式

```typescript
class Transform {
  // 用户修改变换时
  set position(value: Vector3Like) {
    this._position.copyFrom(value);
    this.worldMatrixDirty = true;
    this.onTransformChanged(); // 递归标记子节点
  }

  // 渲染请求世界矩阵时
  getWorldMatrix(): Matrix4 {
    if (this.worldMatrixDirty) {
      this.updateWorldMatrix(); // 发现脏了才计算
    }
    return this.worldMatrix;
  }

  // 递归计算 (仅在需要时)
  private updateWorldMatrix(depth: number = 0): void {
    if (this.localMatrixDirty) {
      this.localMatrix.compose(this.position, this.rotation, this.scale);
      this.localMatrixDirty = false;
    }

    if (this.parent) {
      // 确保父级最新
      if (this.parent.worldMatrixDirty) {
        this.parent.updateWorldMatrix(depth + 1);
      }
      // 矩阵乘法: parent * local
      Matrix4.multiply(this.parent.worldMatrix, this.localMatrix, this.worldMatrix);
      this.worldMatrix.decompose(...);
    } else {
      this.worldMatrix.copyFrom(this.localMatrix);
    }

    this.worldMatrixDirty = false;
    this.directionsDirty = true;
  }

  // 脏标记传播: 当父变时，递归标记所有子级为脏
  private onTransformChanged(depth: number = 0): void {
    if (depth >= Transform.MAX_HIERARCHY_DEPTH) return;
    for (const child of this.children) {
      child.worldMatrixDirty = true;
      child.directionsDirty = true;
      child.onTransformChanged(depth + 1);
    }
  }
}
```

### 3.3 与 RFC 提案的对比

| 方面 | 当前实现 | RFC 提案 (Future) |
| --- | --- | --- |
| **调度模式** | 递归 `Entity.update()` | 分阶段 Systems 顺序执行 |
| **Transform 更新** | 懒惰计算 + 隐式递归 | TransformSystem 统一处理 |
| **脏标记传播** | `onTransformChanged()` 递归调用 | Archetype 原地更新 |
| **数据访问** | 直接方法调用 | Query API + Batch 操作 |
| **优化目标** | 代码可读性 | 数据连续性 (SoA) |

---

## 4. 层级管理: 双重同步

### 4.1 Entity 与 Transform 的关系

**当前实现**: Entity 和 Transform 都维护层级，**自动同步**

```typescript
// Entity 层级 (对象关系)
class Entity {
  setParent(parent: Entity | null): this {
    this.parent = parent;
    this.transform.setParent(parent?.transform ?? null); // 同步到 Transform
    return this;
  }
}

// Transform 层级 (空间关系)
class Transform {
  setParent(parent: Transform | null): void {
    if (this.parent) {
      this.parent.children.splice(...);
    }
    this.parent = parent;
    if (parent) parent.children.push(this);
    this.worldMatrixDirty = true;
    this.onTransformChanged(); // 传播脏标记
  }
}
```

### 4.2 激活状态继承

```typescript
getActive(): boolean {
  if (!this.active) return false;
  // 检查所有父级
  let p = this.parent;
  while (p) {
    if (!p.active) return false;
    p = p.parent;
  }
  return true;
}

setActive(value: boolean): void {
  this.active = value;
  this.updateActiveState(); // 递归更新组件和子实体
}
```

---

## 5. 当前 vs RFC: 全面对比

### 5.1 核心差异总结

| 特性 | 当前实现 (Production) | RFC 提案 (Future) |
| --- | --- | --- |
| **架构模式** | GameObject + Component | Archetype ECS |
| **Entity 类型** | `class Entity extends ReferResource` | 纯数字 ID (number: 20+12位) |
| **Component 类型** | 带生命周期的类实例 | 纯数据结构 (POD) |
| **实体创建** | `new Entity("name", scene)` | `world.createEntity(): Entity` |
| **实体销毁** | `entity.destroy()` | `world.destroyEntity(Entity)` |
| **组件操作** | `entity.addComponent(new T(e))` | `world.add(entity, T, data)` |
| **组件查询** | `entity.getComponent(T)` | `world.get(entity, T)` |
| **遍历查询** | `for (const e of entities)` | `world.query({ all: [T] })` |
| **Transform更新** | 懒惰计算 (渲染时触发) | TransformSystem 统一计算 |
| **层级管理** | `entity.setParent()`，自动同步 | Parent/Children 组件，显式系统 |
| **更新流** | 递归 `Entity.update()` | 分阶段 Systems |
| **数据布局** | 分散对象 | SoA (内存连续) |

### 5.2 代码风格对比

**当前实现**:
```typescript
// 创建对象式
const player = new Entity("Player", scene);
player.transform.position.set(10, 0, 0);
player.addComponent(new MeshRenderer(player));
player.addChild(new Entity("Weapon"));

// 每帧自动递归
scene.update(deltaTime); // -> player.update() -> child.update()
```

**RFC 提案 (未实现)**:
```typescript
// 创建数据式
const player = world.createEntity();
world.add(player, Position, { x: 10, y: 0, z: 0 });
world.add(player, MeshRef, { assetId: "cube" });
world.add(player, Parent, { entity: sceneEntity });

// Systems 分阶段执行
world.update(deltaTime); // Input -> Update -> Systems -> FrameEnd
```

### 5.3 性能与开发体验

| 维度 | 当前实现 | RFC 提案 |
| --- | --- | --- |
| **开发直观性** | ✅ 高 (类似 Unity) | ⚠️ 需要学习 ECS 思维 |
| **调试友好性** | ✅ 好 (对象可检查) | ⚠️ 数据分散，难调试 |
| **运行时性能** | ⚠️ 递归开销 + GC | ✅ 理论上更高 |
| **数据连续性** | ❌ 对象分散 | ✅ SoA，Cache 友好 |
| **生态系统** | ✅ 现有代码兼容 | ❌ 需要完全重写 |
| **并行潜力** | ❌ 困难 | ✅ 天然支持 |

---

## 6. Future Goal: Archetype ECS (RFC)

>[!NOTE]
> 以下章节为 **RFC 提案**，描述未来可能实施的架构，**未在当前生产环境中实现**。

### 6.1 目标架构定义

```typescript
// packages/core/src/base/archetype-entity.ts (未来)

// Entity 是纯数字 ID
export type Entity = number; // 32位: 20位Index + 12位Generation

// Component 是纯数据接口
export interface Position { x: number; y: number; z: number; }
export interface Rotation { x: number; y: number; z: number; w: number; }
export interface MeshRef { assetId: string; }

// World 是管理器
export interface IWorld {
  createEntity(): Entity;
  destroyEntity(e: Entity): void;

  add<T>(e: Entity, comp: ComponentClass<T>, data?: Partial<T>): void;
  remove<T>(e: Entity, comp: ComponentClass<T>): void;
  get<T>(e: Entity, comp: ComponentClass<T>): Readonly<T> | undefined;
  getMut<T>(e: Entity, comp: ComponentClass<T>): T | undefined;

  query(filter: QueryFilter): Query<any[]>;
  update(deltaTime: number): void;

  // 资源管理
  insertResource<T>(resource: T): void;
  getResource<T>(type: new () => T): T | undefined;
}

interface QueryFilter {
  all: ComponentClass<any>[];
  any?: ComponentClass<any>[];
  none?: ComponentClass<any>[];
}
```

### 6.2 Archetype 内存布局

```
Archetype 1: [Position + Rotation] (实体 1, 3, 5)
--------------------------------------------------
| Entity | Position.x | Position.y | Position.z | Rotation.x | ... |
|--------|------------|------------|------------|------------|-----|
| 1      | 10         | 0          | 0          | 0          | ... |
| 3      | 20         | 5          | 0          | 0          | ... |
| 5      | 30         | 10         | 0          | 0          | ... |

Archetype 2: [Position + MeshRef] (实体 2, 4)
--------------------------------------------------
| Entity | Position.x | Position.y | Position.z | MeshRef.id | ... |
|--------|------------|------------|------------|------------|-----|
| 2      | 15         | 0          | 0          | "cube"     | ... |
| 4      | 25         | 20         | 0          | "sphere"   | ... |
```

**优势**:
- 连续的内存块 → Cache 友好
- 批量操作 → SIMD 友好
- 增量查询 → 只处理变化的部分

### 6.3 分阶段执行流

```typescript
// 命令缓冲 (结构变更)
interface CommandBuffer {
  spawn(entity: Entity, components: ComponentData[]): void;
  despawn(entity: Entity): void;
  add<T>(entity: Entity, comp: ComponentClass<T>): void;
  remove<T>(entity: Entity, comp: ComponentClass<T>): void;
}

// Systems 分阶段
world.addSystem("PreUpdate", inputSystem);
world.addSystem("Update", physicsSystem);
world.addSystem("Update", animationSystem);
world.addSystem("PostUpdate", transformSystem); // 批量计算矩阵
world.addSystem("PostUpdate", hierarchySystem);
world.addSystem("PostUpdate", visibilitySystem);

// 每帧执行
function worldUpdate(deltaTime: number) {
  // Stage 1: FrameStart
  applyCommandBuffer(); // 处理结构变更

  // Stage 2: Input
  for (const sys of systems.input) sys(world);

  // Stage 3: PreUpdate
  for (const sys of systems.preUpdate) sys(world);

  // Stage 4: Update
  for (const sys of systems.update) sys(world);

  // Stage 5: PostUpdate (Core Systems)
  transformSystem(world);   // 批量计算所有矩阵
  hierarchySystem(world);   // 父子同步
  visibilitySystem(world);  // 剔除计算

  // Stage 6: FrameEnd
  clearDirtyFlags();
  extractForRender(); // 批量提取
}
```

### 6.4 命题 TransformSystem (RFC)

```typescript
function transformSystem(world: IWorld) {
  // 1. 获取所有需要更新的根节点
  const roots = world.query({
    all: [LocalTransform],
    none: [Parent]  // 无父级
  });

  // 2. 批量迭代，无递归调用
  roots.forEach((entity, local) => {
    if (!local.dirty) return;
    updateRecursive(world, entity, Matrix4.IDENTITY);
  });
}

function updateRecursive(world: IWorld, entity: Entity, parentMatrix: Matrix4) {
  const local = world.get(entity, LocalTransform);
  const worldTx = world.getMut(entity, WorldTransform);

  // 计算: parent * local = world
  const localMat = Matrix4.compose(local.position, local.rotation, local.scale);
  Matrix4.multiply(parentMatrix, localMat, worldTx.matrix);

  // 处理子节点 (通过 Children 组件)
  const children = world.get(entity, Children);
  if (children) {
    for (const child of children.entities) {
      updateRecursive(world, child, worldTx.matrix);
    }
  }
}
```

### 6.5 迁移路径 (Migration Plan)

**虽然时间未定，但规划如下**:

| 阶段 | 任务 | 影响 |
| --- | --- | --- |
| **Phase 1** | Archetype 原型实现 + 基准测试 | 无 |
| **Phase 2** | `IWorld` 接口 + API 适配层 | 新增/WIP |
| **Phase 3** | Component 迁移为纯数据 | 重大变更 |
| **Phase 4** | Engine 重写 Query 系统 | 重大变更 |
| **Phase 5** | 删除旧 Entity/Component | Breaking |

**风险**:
- ❌ 现有代码全部失效
- ⚠️ 学习曲线陡峭
- ❌ 调试困难
- ✅ 长期性能收益

---

## 7. 开发指南 (当前生产环境)

### 7.1 最佳实践

```typescript
// ✅ 推荐: 批量操作变换
function updatePlayerRoot(player: Entity, input: InputState) {
  const t = player.transform;
  t.position.x += input.moveX;
  t.position.z += input.moveZ;
  // 无需手动标记，访问器自动处理

  // 渲染时自动计算
  render(t.getWorldMatrix());
}

// ❌ 避免: 单属性多次修改
function badUpdate(t: Transform) {
  t.position.x = 10; // 触发脏标记
  t.position.y = 20; // 触发脏标记
  t.position.z = 30; // 触发脏标记
  // 应使用 t.position.set(10, 20, 30)
}

// ✅ 推荐: 利用层级批量更新
player.setActive(true); // 自动递归更新所有子对象
```

### 7.2 调试技巧

```typescript
// 检查状态
console.log('活动状态:', entity.getActive()); // 自动检查父级
console.log('组件列表:', [...entity.components.keys()]);
console.log('子实体:', entity.getChildren());
console.log('变换脏状态:', transform.isDirty());

// 循环检测 (Transform/Entity 均内置)
// 如有循环父级，会输出错误但不会崩溃
```

### 7.3 性能优化点

```typescript
// 1. 避免频繁变换修改
// 批量修改 > 多次修改

// 2. 使用 Transform 空间转换函数
{
  // 世界空间移动 (推荐)
  entity.transform.translate(new Vector3(0, 1, 0));
}

// 3. 激用状态检查优化
entity.getActive(); // 会遍历父级链，考虑缓存

// 4. 层级深度优化
// 当前没有深度限制，但建议保持 < 1000 层
```

---

## 8. 附录: 当前实现核心文件

### 8.1 文件清单与行数

| 文件 | 路径 | 类型 | 行数 | 描述 |
| --- | --- | --- | --- | --- |
| **Entity** | `packages/core/src/base/entity.ts` | 生产 | 551 | 实体基类 |
| **Component** | `packages/core/src/base/component.ts` | 生产 | 196 | 组件基类 |
| **Transform** | `packages/core/src/base/transform.ts` | 生产 | 828 | 变换组件 |
| **ReferResource** | `packages/core/src/base/refer-resource.ts` | 生产 | 164 | 引用计数 |
| **MaxObject** | `packages/core/src/base/max-object.ts` | 生产 | ~50 | 基础对象 |

### 8.2 基础使用示例

```typescript
// === 场景构建 ===
const scene = new Scene("GameScene");

// === 实体创建 ===
const player = new Entity("Player", scene);
player.transform.position.set(0, 5, 0);

// === 组件添加 ===
player.addComponent(new MeshRenderer(player, playerMesh));
player.addComponent(new PlayerController(player));

// === 层级构建 ===
const weapon = new Entity("Weapon", scene);
weapon.transform.position.set(1, 0, 0);
player.addChild(weapon);

// === 激活与更新 ===
scene.update(deltaTime); // 自动递归更新所有实体
```

### 8.3 与 RFC 映射速查

| 操作 | 当前 API | RFC API (未实现) |
| --- | --- | --- |
| 创建实体 | `new Entity("name", scene)` | `world.createEntity()` |
| 销毁实体 | `entity.destroy()` | `world.destroyEntity(e)` |
| 添加组件 | `entity.addComponent(new T(e))` | `world.add(e, T, data)` |
| 获取组件 | `entity.getComponent(T)` | `world.get(e, T)` |
| 修改位置 | `entity.transform.position = v` | `world.getMut(e, Position)` |
| 遍历实体 | `[...scene.entities]` | `world.query({ all: [T] })` |
| 设置父子 | `child.setParent(parent)` | `world.add(child, Parent, { parent })` |
| 设置激活 | `entity.setActive(x)` | `world.getMut(e, Active).value = x` |

### 8.4 性能测试数据 (待收集)

> **TODO**: 需要在 10k 实体场景下进行基准测试

| 场景 | 当前模式 | Archetype (预计) |
| --- | --- | --- |
| 创建 10k 实体 | ? ms | ? ms |
| 更新 10k Transform | ? ms | ? ms |
| 遍历 Transform | ? ms | ? ms |
| 内存占用 | ? MB | ? MB |
| GC 压力 | ? | ? |

---

## 9. 参考文档

### 核心规范
- [图形系统圣经](../../reference/graphics-bible.md) - 坐标系 + 规范
- [编码规范](../../reference/coding-conventions.md) - TypeScript 约定

### 当前实现源码
- [Entity.ts](../../../packages/core/src/base/entity.ts) - 551 行
- [Component.ts](../../../packages/core/src/base/component.ts) - 196 行
- [Transform.ts](../../../packages/core/src/base/transform.ts) - 828 行
- [ReferResource.ts](../../../packages/core/src/base/refer-resource.ts) - 164 行

### 集成文档
- [Core-Engine集成边界](./core-integration-boundary.md)
- [Engine架构](../engine/engine-architecture.md)
- [RHI架构](../rhi/rhi-architecture.md)

### RFC 相关
- Archetype ECS 论文资料 (待整理)
- Unity DOTS 架构文档
- Bevy ECS 源码分析 (Rust)
