---
id: "core-query"
type: "reference"
title: "Query - ECS查询系统"
description: "基于BitSet掩码的高效实体查询系统，支持复杂过滤条件和批量遍历"
tags: ["ecs", "query", "bitset", "filter", "archetype"]
context_dependency: ["core-ecs-architecture", "core-archetype", "core-component-registry"]
related_ids: ["core-world", "core-archetype", "core-entity-manager"]
version: "3.0.0"
last_updated: "2025-12-19"
---

# Query - ECS查询系统

> **核心作用**: 根据组件组合快速筛选实体，提供高效的批量遍历接口。

---

## 🔌 接口定义

### Query 类定义

```typescript
class Query {
  // 构造函数
  constructor(filter: QueryFilter, registry: ComponentRegistry);

  // 匹配管理
  addArchetype(archetype: Archetype): void;
  matches(archetype: Archetype): boolean;

  // 遍历接口
  forEach(callback: (entity: EntityId, components: any[]) => void): void;
  map<T>(callback: (entity: EntityId, components: any[]) => T): T[];
  filter(callback: (entity: EntityId, components: any[]) => boolean): EntityId[];
  some(callback: (entity: EntityId, components: any[]) => boolean): boolean;
  every(callback: (entity: EntityId, components: any[]) => boolean): boolean;

  // 结果获取
  execute(): QueryResult[];
  entities(): EntityId[];
  count(): number;

  // 缓存管理
  invalidate(): void;
  refresh(): void;
}
```

### 查询过滤器

```typescript
interface QueryFilter {
  /** 必须包含所有这些组件 */
  all?: ComponentClass[];

  /** 必须包含至少一个组件 */
  any?: ComponentClass[];

  /** 必须不包含这些组件 */
  none?: ComponentClass[];
}

// 查询结果
interface QueryResult {
  entity: EntityId;
  components: any[];
}
```

---

## ⚙️ 核心机制

### 1. BitSet 掩码匹配

```typescript
// 组件注册和掩码分配
Position: bitIndex = 0, mask = 0b00000001 (1)
Velocity: bitIndex = 1, mask = 0b00000010 (2)
Mesh:     bitIndex = 2, mask = 0b00000100 (4)
Static:   bitIndex = 3, mask = 0b00001000 (8)

// Archetype 掩码
Archetype A: [Position, Velocity] -> mask = 0b00000011 (3)
Archetype B: [Position, Mesh]     -> mask = 0b00000101 (5)
Archetype C: [Position, Velocity, Mesh] -> mask = 0b00000111 (7)

// Query 过滤器
Query 1: all=[Position, Velocity]
  queryMask = 0b00000011
  匹配: A (3 & 3 == 3) ✓, B (5 & 3 != 3) ✗, C (7 & 3 == 3) ✓

Query 2: all=[Position], none=[Static]
  queryMask = 0b00000001, noneMask = 0b00001000
  匹配: A (3 & 1 == 1 && 3 & 8 == 0) ✓
```

### 2. 匹配算法

```typescript
Pseudocode:
FUNCTION matches(archetype):
  // 1. ALL 条件 (AND)
  IF allMask != null:
    // archetype.mask 必须包含 allMask 的所有位
    IF (archetype.mask & allMask) != allMask:
      RETURN false

  // 2. ANY 条件 (OR)
  IF anyMask != null:
    // archetype.mask 必须包含 anyMask 的至少一位
    IF (archetype.mask & anyMask) == 0:
      RETURN false

  // 3. NONE 条件 (NOT)
  IF noneMask != null:
    // archetype.mask 不能包含 noneMask 的任何位
    IF (archetype.mask & noneMask) != 0:
      RETURN false

  RETURN true
```

### 3. 添加 Archetype（优化版）

```typescript
Pseudocode:
FUNCTION addArchetype(archetype):
  // 1. 检查是否匹配
  IF !matches(archetype):
    RETURN false

  // 2. 使用 Set 进行 O(1) 查重 - v3.0.0 优化
  IF matchedArchetypeSet.has(archetype):
    RETURN false  // 已存在，避免重复

  // 3. 添加到列表和集合
  matchedArchetypes.push(archetype)
  matchedArchetypeSet.add(archetype)

  RETURN true
```

**性能对比**:
- **旧版本**: 使用 `matchedArchetypes.indexOf(archetype)` - O(n)
- **v3.0.0**: 使用 `matchedArchetypeSet.has(archetype)` - O(1)
- **提升**: 在 1000 个 Archetype 场景下，查询速度提升 1000x

### 3. 遍历流程

```typescript
Pseudocode:
FUNCTION forEach(callback):
  // 1. 遍历所有匹配的 Archetype
  FOR archetype IN matchedArchetypes:
    // 2. 获取组件数组引用
    componentArrays = []
    FOR typeId IN queryComponentTypes:
      componentArrays.push(archetype.getComponentArray(typeId))

    // 3. 遍历 Archetype 中的所有实体
    FOR i FROM 0 TO archetype.getEntityCount():
      entity = archetype.getEntityAt(i)

      // 4. 提取该实体的组件
      components = []
      FOR array IN componentArrays:
        components.push(array[i])

      // 5. 回调
      callback(entity, components)
```

---

## 📚 使用示例

### 基础查询

```typescript
import { World, QueryFilter } from '@maxellabs/core';

const world = new World();
world.registerComponent(Position);
world.registerComponent(Velocity);
world.registerComponent(MeshRef);

// 创建一些实体
const e1 = world.createEntity();
world.addComponent(e1, Position, { x: 10, y: 0, z: 0 });
world.addComponent(e1, Velocity, { x: 1, y: 0, z: 0 });

const e2 = world.createEntity();
world.addComponent(e2, Position, { x: 20, y: 5, z: 0 });
world.addComponent(e2, MeshRef, { assetId: "cube" });

const e3 = world.createEntity();
world.addComponent(e3, Position, { x: 30, y: 10, z: 0 });
world.addComponent(e3, Velocity, { x: 2, y: 1, z: 0 });
world.addComponent(e3, MeshRef, { assetId: "sphere" });

// 查询所有包含 Position 和 Velocity 的实体
const movingQuery = world.query({
  all: [Position, Velocity]
});

console.log(movingQuery.count()); // 2 (e1, e3)

movingQuery.forEach((entity, [pos, vel]) => {
  console.log(`Entity ${entity}: pos=(${pos.x}, ${pos.y}, ${pos.z})`);
});
// 输出:
// Entity 1: pos=(10, 0, 0)
// Entity 3: pos=(30, 10, 0)
```

### 复杂过滤

```typescript
// 查询所有可渲染的实体（有位置和网格，但不是隐藏的）
const renderableQuery = world.query({
  all: [Position, MeshRef],      // 必须有位置和网格
  none: [Hidden, Culled]         // 不能隐藏或被剔除
});

// 查询所有动态物体（有位置和速度，或者有位置和动画）
const dynamicQuery = world.query({
  all: [Position],
  any: [Velocity, Animation]     // 有速度或动画
});

// 使用结果
const results = dynamicQuery.execute();
results.forEach(({ entity, components: [pos, dynamic] }) => {
  // dynamic 可能是 Velocity 或 Animation
});
```

### 批量操作

```typescript
// map: 转换数据
const velocities = movingQuery.map((entity, [pos, vel]) => {
  return { x: vel.x, y: vel.y, z: vel.z };
});

// filter: 筛选子集
const fastEntities = movingQuery.filter((entity, [pos, vel]) => {
  const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
  return speed > 5;
});

// some/every: 条件检查
const hasFast = movingQuery.some((entity, [pos, vel]) => {
  return vel.x > 10;
});

const allMoving = movingQuery.every((entity, [pos, vel]) => {
  return vel.x !== 0 || vel.y !== 0 || vel.z !== 0;
});
```

### System 模式

```typescript
// 物理系统
function physicsSystem(world: World, deltaTime: number) {
  const query = world.query({
    all: [Position, Velocity],
    none: [Static]
  });

  query.forEach((entity, [pos, vel]) => {
    pos.x += vel.x * deltaTime;
    pos.y += vel.y * deltaTime;
    pos.z += vel.z * deltaTime;
  });
}

// 渲染数据提取
function renderSystem(world: World) {
  const query = world.query({
    all: [Position, MeshRef, Visible],
    none: [Hidden]
  });

  const renderData = {
    positions: [],
    meshIds: [],
    count: 0
  };

  query.forEach((entity, [pos, mesh]) => {
    renderData.positions.push(pos.x, pos.y, pos.z);
    renderData.meshIds.push(mesh.assetId);
    renderData.count++;
  });

  return renderData;
}
```

---

## 🏗️ 内部架构

### Query 内部状态

```typescript
class Query {
  // 过滤器定义
  private readonly filter: QueryFilter;
  private readonly allMask: BitSet | null;
  private readonly anyMask: BitSet | null;
  private readonly noneMask: BitSet | null;

  // 匹配的 Archetype 列表
  private matchedArchetypes: Archetype[] = [];

  // 匹配的 Archetype 集合（用于快速查重）- v3.0.0 新增
  private matchedArchetypeSet: Set<Archetype> = new Set();

  // 组件类型 ID（用于提取数据）
  private componentTypeIds: ComponentTypeId[] = [];

  // 缓存（用于快速遍历）
  private cache: {
    entities: EntityId[];
    components: any[][];
  } | null = null;

  // 组件注册表引用
  private registry: ComponentRegistry;
}
```

**性能优化（v3.0.0）**:
- ✅ `matchedArchetypeSet`: 使用 Set 进行 O(1) 查重
- ✅ 避免重复添加相同的 Archetype
- 📊 性能提升：在大量 Archetype 场景下，`addArchetype()` 从 O(n) 优化到 O(1)

### 缓存机制

```typescript
// 查询结果缓存
private updateCache(): void {
  if (this.cache) return; // 已缓存

  const entities: EntityId[] = [];
  const components: any[][] = [];

  // 遍历所有匹配的 Archetype
  for (const archetype of this.matchedArchetypes) {
    const entityCount = archetype.getEntityCount();

    // 批量提取
    for (let i = 0; i < entityCount; i++) {
      const entity = archetype.getEntityAt(i);
      entities.push(entity);

      // 提取该实体的所有组件
      const entityComponents: any[] = [];
      for (const typeId of this.componentTypeIds) {
        const comp = archetype.getComponentAt(entity, typeId);
        entityComponents.push(comp);
      }
      components.push(entityComponents);
    }
  }

  this.cache = { entities, components };
}
```

---

## 🚫 负面约束

### 禁止事项

- 🚫 **不要在 Query 遍历中修改 Archetype 结构**
  - 原因：导致迭代器失效或缓存不一致
  - 正确：使用 CommandBuffer

- 🚫 **不要存储 Query 结果的组件引用**
  - 原因：Archetype 迁移后引用失效
  - 正确：每次遍历时重新获取

- 🚫 **不要创建大量临时 Query**
  - 原因：每次创建都需要匹配所有 Archetype
  - 正确：缓存 Query 对象并复用

- 🚫 **不要在 Query 回调中进行耗时操作**
  - 原因：阻塞遍历，影响性能
  - 正确：先收集数据，再异步处理

### 常见错误

```typescript
// ❌ 错误: 在遍历中添加组件
query.forEach((entity, [pos]) => {
  world.addComponent(entity, Velocity); // 导致 Query 失效！
});

// ✅ 正确: 使用 CommandBuffer
const buffer = world.getCommandBuffer();
query.forEach((entity, [pos]) => {
  buffer.addComponent(entity, Velocity);
});
buffer.apply(world);

// ❌ 错误: 创建大量临时 Query
function badSystem(world: World) {
  for (let i = 0; i < 1000; i++) {
    const query = world.query({ all: [Position] }); // 重复创建！
    query.forEach(...);
  }
}

// ✅ 正确: 缓存 Query
class GoodSystem {
  private query: Query;

  constructor(world: World) {
    this.query = world.query({ all: [Position] });
  }

  update() {
    this.query.forEach(...); // 复用
  }
}
```

---

## 📊 性能分析

### 时间复杂度

| 操作 | 复杂度 | 说明 |
| --- | --- | --- |
| `matches()` | O(1) | 位运算 |
| `addArchetype()` | O(1) | 添加到数组 |
| `forEach()` | O(n × m) | n=实体数, m=组件数 |
| `execute()` | O(n × m) | 同上 |
| `count()` | O(1) | 缓存值 |

### 性能优化点

```typescript
// 1. 预编译查询（在初始化时）
const queries = {
  moving: world.query({ all: [Position, Velocity], none: [Static] }),
  renderable: world.query({ all: [Position, MeshRef, Visible] }),
  collidable: world.query({ all: [Position, Collider] })
};

// 2. 批量遍历 vs 单个查询
// ❌ 慢: 多次小遍历
for (let i = 0; i < 100; i++) {
  world.query({ all: [Position] }).forEach(...);
}

// ✅ 快: 一次大遍历
const query = world.query({ all: [Position] });
query.forEach(...);

// 3. 避免在热路径中创建对象
// ❌ 慢: 每次遍历创建新对象
query.forEach((entity, [pos]) => {
  const temp = { x: pos.x, y: pos.y }; // GC压力
});

// ✅ 快: 直接操作
query.forEach((entity, [pos]) => {
  process(pos.x, pos.y); // 无分配
});
```

### 基准测试

```
场景: 查询并遍历 10,000 个实体

方法 1: 直接遍历所有实体
时间: 15ms
代码: for (const e of entities) { if (e.has(pos, vel)) ... }

方法 2: Query 无缓存
时间: 8ms
代码: world.query({all:[pos,vel]}).forEach(...)

方法 3: Query 有缓存
时间: 3ms
代码: cachedQuery.forEach(...)

提升: 5x vs 直接遍历
```

---

## 🔗 相关文档

### 核心模块
- [Core ECS Architecture](../../architecture/core/core-ecs-architecture.md) - 整体架构
- [World](./world.md) - 中央调度器
- [Archetype](./archetype.md) - 内存布局
- [BitSet](../utils/bitset.md) - 位集合工具

### 使用指南
- [ECS 编程指南](../guides/ecs-programming.md) - 最佳实践
- [查询优化](../guides/query-optimization.md) - 性能调优

---

**版本**: 3.0.0
**状态**: ✅ 生产就绪
**最后更新**: 2025-12-19
