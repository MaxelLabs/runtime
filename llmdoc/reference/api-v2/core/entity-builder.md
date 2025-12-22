---
id: "core-entity-builder"
type: "reference"
title: "EntityBuilder - 流式实体构建器"
description: "提供流式 API 创建实体，支持父子关系和循环引用检查"
tags: ["ecs", "entity-builder", "flow-api", "hierarchy", "parent-child"]
context_dependency: ["core-ecs-architecture", "core-world"]
related_ids: ["core-world", "core-archetype", "core-transform-matrix-pool"]
version: "3.0.0"
last_updated: "2025-12-19"
---

# EntityBuilder - 流式实体构建器

> **核心作用**: 提供类似 GameObject 的流式 API，底层使用 Archetype 模式，支持父子关系管理。

---

## 🔌 接口定义

### EntityBuilder 类定义

```typescript
class EntityBuilder {
  // 构造函数
  constructor(world: World, entity: EntityId, name?: string);

  // 变换操作
  position(x: number, y: number, z: number): this;
  rotation(x: number, y: number, z: number, w: number): this;
  scale(x: number, y: number, z: number): this;
  uniformScale(value: number): this;

  // 父子关系
  parent(parentEntity: EntityId): this;

  // 标签和状态
  tag(...tags: string[]): this;
  active(value: boolean): this;

  // 组件操作
  add<T extends object>(type: ComponentClass<T>, data?: Partial<T>): this;
  addIf<T extends object>(condition: boolean, type: ComponentClass<T>, data?: Partial<T>): this;
  addMany(components: Array<[ComponentClass, any?]>): this;

  // 构建
  build(): EntityId;
  id(): EntityId;
}
```

### 扩展 World 接口

```typescript
interface World {
  // 流式创建
  spawn(name?: string): EntityBuilder;

  // 批量创建
  spawnBatch(count: number, callback: (builder: EntityBuilder, index: number) => void): EntityId[];

  // 父子关系操作
  getChildren(entity: EntityId): EntityId[];
  getParent(entity: EntityId): EntityId | undefined;
  setParent(entity: EntityId, parent: EntityId | null): void;
}
```

---

## ⚙️ 核心机制

### 1. 父子关系循环引用检查

#### parent() 方法（EntityBuilder）

```typescript
Pseudocode:
FUNCTION parent(parentEntity):
  // 1. 检查自引用（直接循环）
  IF parentEntity == this.entity:
    THROW Error("Cannot set entity as its own parent")

  // 2. 设置父级（延迟到 build() 时应用）
  pendingComponents.set(Parent, new Parent(parentEntity))

  RETURN this
```

**限制**:
- ⚠️ 仅检查自引用（parent === entity）
- ⚠️ 不检查间接循环（parent 是当前实体的后代）
- 📝 这种检查在构建时完成，不在这里进行完整验证

#### setParent() 方法（World）

```typescript
Pseudocode:
FUNCTION setParent(entity, parent):
  // 1. 检查自引用
  IF parent == entity:
    logError(`Cannot set entity ${entity} as its own parent`)
    RETURN

  // 2. 检查循环引用（完整检查）
  IF parent != null:
    wouldCreateCycle = checkCircularReference(entity, parent, getParentFn)
    IF wouldCreateCycle:
      logError(`Setting ${parent} as parent of ${entity} would create circular reference`)
      RETURN

  // 3. 移除旧父子关系
  oldParent = getComponent(entity, Parent)
  IF oldParent != null AND oldParent != INVALID_ENTITY:
    removeChild(oldParent, entity)

  // 4. 设置新父子关系
  IF parent != null:
    setComponent(entity, Parent, new Parent(parent))
    addChild(parent, entity)
  ELSE:
    removeComponent(entity, Parent)
```

**错误处理策略对比**:

| 方法 | 错误处理 | 是否继续执行 | 一致性 |
|------|---------|-------------|--------|
| `parent()` | `throw new Error()` | ❌ 否 | 严格（构建时） |
| `setParent()` | `logError()` | ✅ 是 | 宽松（运行时） |

**v3.0.0 实现状态**:
- ✅ `parent()`：检查自引用，抛出异常（防止无效构建）
- ✅ `setParent()`：使用 `checkCircularReference` 完整检查，记录错误但继续执行
- ✅ 循环引用检测：使用 Set 记录已访问节点，防止无限循环
- ⚠️ 注意：两种方法的错误处理策略不同，这是设计选择
  - `parent()` 在构建时调用，严格检查防止无效实体
  - `setParent()` 在运行时调用，宽松处理避免程序崩溃

### 2. 循环引用检测算法

```typescript
Pseudocode:
FUNCTION checkCircularReference(entity, parent, getParentFn):
  // 使用 Set 记录已访问的节点，防止无限循环
  visited = new Set()
  current = parent

  WHILE current != null:
    IF visited.has(current):
      RETURN true  // 发现循环

    visited.add(current)

    // 获取当前节点的父级
    current = getParentFn(current)

    // 如果找到 entity，说明形成循环
    IF current == entity:
      RETURN true

  RETURN false
```

**示例场景**:
```
情况 1: A -> B -> A (循环)
checkCircularReference(A, B, ...) → true ✓

情况 2: A -> B -> C (无循环)
checkCircularReference(A, B, ...) → false ✓

情况 3: A -> B -> C -> B (循环)
checkCircularReference(A, B, ...) → true ✓
```

---

## 📚 使用示例

### 基础实体创建

```typescript
import { World } from '@maxellabs/core';

const world = new World();

// 流式创建玩家实体
const player = world.spawn('Player')
  .position(10, 0, 0)
  .rotation(0, 0, 0, 1)
  .scale(1, 1, 1)
  .add(Velocity, { x: 1, y: 0, z: 0 })
  .add(Health, { current: 100, max: 100 })
  .tag('player', 'controllable')
  .build();

console.log(player); // EntityId(1)
```

### 父子关系

```typescript
// 创建子实体
const weapon = world.spawn('Weapon')
  .position(1, 0, 0)  // 相对父级的位置
  .parent(player)     // 设置父级
  .add(Damage, { value: 50 })
  .build();

// 获取父子关系
const children = world.getChildren(player);  // [weapon]
const parent = world.getParent(weapon);      // player

// 运行时修改父级
world.setParent(weapon, null);  // 解除父子关系
world.setParent(weapon, player); // 重新设置
```

### 批量创建

```typescript
// 创建 100 个敌人
const enemies = world.spawnBatch(100, (builder, index) => {
  builder
    .name(`Enemy_${index}`)
    .position(Math.random() * 100, 0, Math.random() * 100)
    .add(Enemy, { type: 'grunt', health: 50 })
    .addIf(index % 5 === 0, Elite);  // 每 5 个添加 Elite 标记
});

// 返回 EntityId 数组
console.log(enemies.length); // 100
```

### 错误处理

```typescript
// ❌ 错误：自引用
try {
  const entity = world.spawn('Self')
    .parent(INVALID_ENTITY)  // 无效
    .build();
} catch (e) {
  console.error(e.message);
}

// ✅ 正确：父子关系
const parent = world.spawn('Parent').build();
const child = world.spawn('Child').parent(parent).build();

// ⚠️ 注意：循环引用在 setParent 中仅记录错误
world.setParent(parent, child); // logError，但继续执行
// 结果：父子关系未设置，但程序不崩溃
```

---

## 🏗️ 内部架构

### EntityBuilder 内部状态

```typescript
class EntityBuilder {
  private world: World;
  private entity: EntityId;
  private pendingComponents: Map<ComponentClass, object>;

  // 构建流程
  build(): EntityId {
    // 1. 应用所有 pending 组件
    for (const [type, data] of this.pendingComponents) {
      this.world.addComponent(this.entity, type, data);
    }

    // 2. 处理父子关系（如果有）
    const parent = this.pendingComponents.get(Parent);
    if (parent) {
      this.world.setParent(this.entity, parent.entity);
    }

    return this.entity;
  }
}
```

### World 扩展实现

```typescript
// 扩展 World 的 spawn 方法
extended.spawn = function(name?: string): EntityBuilder {
  const entity = this.createEntity();

  // 添加 Name 组件（如果提供了名称）
  if (name) {
    this.addComponent(entity, Name, { value: name });
  }

  return new EntityBuilder(this, entity, name);
};

// 扩展父子关系方法
extended.getChildren = function(entity: EntityId): EntityId[] {
  const children = this.getComponent(entity, Children);
  return children?.entities ?? [];
};

extended.getParent = function(entity: EntityId): EntityId | undefined {
  const parent = this.getComponent(entity, Parent);
  return parent?.entity !== INVALID_ENTITY ? parent?.entity : undefined;
};
```

---

## 🚫 负面约束

### 禁止事项

- 🚫 **不要在 parent() 中设置无效的父级**
  - 原因：会导致运行时错误
  - 正确：始终使用有效的 EntityId

- 🚫 **不要忽略循环引用检查**
  - 原因：可能导致无限循环或栈溢出
  - 正确：使用 `checkCircularReference` 完整检查

- 🚫 **不要在构建后修改 pendingComponents**
  - 原因：不会影响已构建的实体
  - 正确：使用 World 的 API 修改实体

### 常见错误

```typescript
// ❌ 错误：自引用
const entity = world.spawn('Self')
  .parent(entity)  // entity 尚未构建！
  .build();

// ✅ 正确：先构建，再设置父子关系
const parent = world.spawn('Parent').build();
const child = world.spawn('Child').parent(parent).build();

// ❌ 错误：忽略错误处理
world.setParent(entity, entity); // 仅 logError，可能忽略

// ✅ 正确：检查返回值
const success = world.setParent(entity, parent);
if (!success) {
  console.warn('设置父级失败');
}

// ❌ 错误：深层循环未检测
const a = world.spawn('A').build();
const b = world.spawn('B').parent(a).build();
const c = world.spawn('C').parent(b).build();
world.setParent(a, c); // 形成 A->B->C->A 循环

// ✅ 正确：使用 checkCircularReference
if (checkCircularReference(a, c, getParent)) {
  console.error('检测到循环引用');
}
```

---

## 📊 性能分析

### 时间复杂度

| 操作 | 复杂度 | 说明 |
|------|--------|------|
| `spawn()` | O(1) | 创建实体 |
| `parent()` | O(1) | 设置待处理父级 |
| `build()` | O(m) | m=组件数量 |
| `setParent()` | O(d) | d=树深度（循环引用检查）|
| `getChildren()` | O(1) | 直接访问 |
| `getParent()` | O(1) | 直接访问 |

### 内存开销

```
EntityBuilder:
- pendingComponents: Map<ComponentClass, object>
  - 每个 builder 一个 Map
  - 构建后释放

父子关系组件:
- Parent: { entity: EntityId }
- Children: { entities: EntityId[] }
  - 每个实体最多一个 Parent
  - 每个实体可有多个 Children
```

### 性能优化建议

```typescript
// ❌ 慢：频繁创建临时 Builder
for (let i = 0; i < 1000; i++) {
  world.spawn(`Temp_${i}`).position(i, 0, 0).build();
}

// ✅ 快：批量创建
world.spawnBatch(1000, (builder, i) => {
  builder.position(i, 0, 0);
});

// ❌ 慢：深层循环引用检查
// 每次 setParent 都遍历整个树

// ✅ 快：缓存父子关系
// 使用 getChildren/getParent 快速验证
```

---

## 🔗 相关文档

### 核心模块
- [Core ECS Architecture](../../architecture/core/core-ecs-architecture.md) - 整体架构
- [World](./world.md) - 中央调度器
- [Archetype](./archetype.md) - 内存布局
- [TransformMatrixPool](./transform-matrix-pool.md) - 变换矩阵

### 工具模块
- [HierarchyUtils](../utils/hierarchy-utils.md) - 层级工具
- [EntityId](./entity-id.md) - 实体 ID 管理

### 使用指南
- [ECS 编程指南](../guides/ecs-programming.md) - 最佳实践
- [父子关系系统](../guides/hierarchy-system.md) - 层级管理

---

**版本**: 3.0.0
**状态**: ✅ 生产就绪
**最后更新**: 2025-12-19
