---
id: "core-entity-manager"
type: "reference"
title: "EntityManager - 实体ID管理器"
description: "负责Entity ID的生成、回收和版本管理，防止悬空引用"
tags: ["ecs", "entity", "id", "generation", "recycling"]
context_dependency: ["core-ecs-architecture"]
related_ids: ["core-world", "core-entity-id"]
version: "3.0.0"
last_updated: "2025-12-19"
---

# EntityManager - 实体ID管理器

> **核心职责**: 管理 Entity ID 的生命周期，包括分配、回收和版本控制。

---

## 🔌 接口定义

### EntityManager 类定义

```typescript
class EntityManager {
  // 构造函数
  constructor();

  // 实体生命周期
  create(): EntityId;
  destroy(entity: EntityId): void;
  isAlive(entity: EntityId): boolean;

  // 状态查询
  getCount(): number;
  getAliveCount(): number;
  getMaximumIndex(): number;
}
```

### EntityId 工具

```typescript
namespace EntityId {
  // 创建 Entity ID
  function create(index: number, generation: number): EntityId;

  // 提取信息
  function index(entity: EntityId): number;
  function generation(entity: EntityId): number;

  // 比较
  function equals(a: EntityId, b: EntityId): boolean;

  // 格式化
  function toString(entity: EntityId): string;
}

// 常量
const MAX_INDEX = 0xFFFFF;      // 20位: 1,048,576
const MAX_GENERATION = 0xFFF;   // 12位: 4,096
```

---

## 🏗️ ID 结构设计

### Entity ID 位布局

```
Entity ID (32位整数):
┌─────────────────────────┬──────────────┐
│  Index (20位)           │ Gen (12位)   │
│  0 - 1,048,575          │ 0 - 4,095    │
└─────────────────────────┴──────────────┘
Bit: 31                  11 10          0

示例:
Entity 1: index=0, generation=0 -> 0x00000000
Entity 2: index=1, generation=0 -> 0x00000001
复用后: index=0, generation=1 -> 0x00001000
```

### 版本号机制

```typescript
// 实体元数据
interface EntityMeta {
  generation: number;  // 版本号
  alive: boolean;      // 存活状态
}

// 存储结构
class EntityManager {
  private entities: EntityMeta[] = [];      // 索引 -> 元数据
  private freeList: number[] = [];          // 可复用的索引
  private nextIndex: number = 0;            // 下一个新索引
  private aliveCount: number = 0;           // 当前存活数
}
```

---

## ⚙️ 核心流程

### 1. 实体创建

```typescript
Pseudocode:
FUNCTION create():
  // 1. 优先从回收列表获取索引
  IF freeList.length > 0:
    index = freeList.pop()
    meta = entities[index]

    // 2. 版本号递增
    generation = meta.generation + 1

    // 3. 溢出检查
    IF generation > MAX_GENERATION:
      // 跳过该索引，继续尝试
      RETURN create()

    // 4. 更新元数据
    meta.generation = generation
    meta.alive = true
  ELSE:
    // 5. 分配新索引
    index = nextIndex

    // 6. 索引溢出检查
    IF index > MAX_INDEX:
      THROW Error("实体数量超过上限")

    // 7. 创建新元数据
    entities[index] = {
      generation: 0,
      alive: true
    }

    nextIndex++

  aliveCount++

  // 8. 组合成 Entity ID
  RETURN EntityId.create(index, generation)
```

### 2. 实体销毁

```typescript
Pseudocode:
FUNCTION destroy(entity):
  // 1. 提取信息
  index = EntityId.index(entity)
  generation = EntityId.generation(entity)

  // 2. 验证
  IF index >= entities.length:
    RETURN  // 无效索引

  meta = entities[index]

  // 3. 检查版本匹配
  IF meta.generation != generation:
    RETURN  // 已销毁并复用

  IF !meta.alive:
    RETURN  // 已销毁

  // 4. 标记为死亡
  meta.alive = false

  // 5. 添加到回收列表
  freeList.push(index)

  aliveCount--
```

### 3. 实体存活检查

```typescript
Pseudocode:
FUNCTION isAlive(entity):
  index = EntityId.index(entity)
  generation = EntityId.generation(entity)

  // 1. 边界检查
  IF index >= entities.length:
    RETURN false

  // 2. 获取元数据
  meta = entities[index]

  // 3. 检查存活和版本
  RETURN meta.alive && meta.generation == generation
```

---

## 📚 使用示例

### 基础使用

```typescript
import { EntityManager, EntityId } from '@maxellabs/core';

const manager = new EntityManager();

// 创建实体
const e1 = manager.create();  // index=0, gen=0
const e2 = manager.create();  // index=1, gen=0
const e3 = manager.create();  // index=2, gen=0

console.log(EntityId.toString(e1)); // "0:0"
console.log(EntityId.index(e1));    // 0
console.log(EntityId.generation(e1)); // 0

// 检查存活
console.log(manager.isAlive(e1)); // true

// 销毁实体
manager.destroy(e1);
console.log(manager.isAlive(e1)); // false

// 复用索引
const e4 = manager.create();  // index=0, gen=1 (复用 e1 的索引)
console.log(EntityId.index(e4) === EntityId.index(e1)); // true
console.log(EntityId.generation(e4) > EntityId.generation(e1)); // true

// 悬空引用检测
console.log(manager.isAlive(e1)); // false (版本不匹配)
console.log(manager.isAlive(e4)); // true
```

### 防止悬空引用

```typescript
// 场景: 存储实体引用的组件
class TargetComponent {
  target: EntityId;  // 引用另一个实体
}

// 安全访问
function getTargetSafe(world: World, entity: EntityId): EntityId | null {
  const targetComp = world.getComponent(entity, TargetComponent);
  if (!targetComp) return null;

  const target = targetComp.target;

  // 检查目标是否存活
  if (!world.isAlive(target)) {
    console.warn(`Target ${EntityId.toString(target)} is dead`);
    return null;
  }

  return target;
}

// 自动清理失效引用
function cleanupInvalidReferences(world: World) {
  const query = world.query({ all: [TargetComponent] });

  query.forEach((entity, [targetComp]) => {
    if (!world.isAlive(targetComp.target)) {
      // 移除失效的组件
      world.removeComponent(entity, TargetComponent);
    }
  });
}
```

### 实体池模式

```typescript
class EntityPool {
  private pool: EntityId[] = [];
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  // 预创建实体
  warmup(count: number) {
    for (let i = 0; i < count; i++) {
      const entity = this.world.createEntity();
      this.world.destroyEntity(entity); // 立即销毁，加入回收
      this.pool.push(entity);
    }
  }

  // 获取实体
  get(): EntityId {
    if (this.pool.length > 0) {
      const entity = this.pool.pop()!;
      // 重新激活
      this.world.addComponent(entity, Active);
      return entity;
    }
    return this.world.createEntity();
  }

  // 归还实体
  release(entity: EntityId) {
    // 移除所有组件
    const components = this.world.getAllComponents(entity);
    for (const comp of components) {
      this.world.removeComponent(entity, comp.constructor as any);
    }

    // 添加到池
    this.pool.push(entity);
  }
}
```

---

## 📊 性能特征

### 时间复杂度

| 操作 | 复杂度 | 说明 |
| --- | --- | --- |
| `create()` | O(1) | 均摊 |
| `destroy()` | O(1) | 直接操作 |
| `isAlive()` | O(1) | 数组访问 |

### 内存占用

```
Per Entity (元数据):
- generation: 2 bytes (uint16)
- alive: 1 byte (boolean)
- 对象开销: ~16 bytes
总计: ~19 bytes / 实体

10,000 实体: ~190 KB
1,000,000 实体: ~19 MB
```

### 版本号溢出处理

```typescript
// 场景: 实体频繁创建/销毁
// 假设: 每帧创建/销毁 100 个实体，60 FPS

// 索引 0 的复用频率:
// 每 100 帧复用一次
// 版本号递增: 100 * 60 = 6000 次/分钟

// MAX_GENERATION = 4096
// 约 6.8 分钟后溢出

// 溢出处理:
// 1. 检测到 generation > MAX_GENERATION
// 2. 跳过该索引，继续尝试下一个
// 3. 该索引进入"冷却期"
// 4. 最终会被回收或重新使用
```

---

## 🚫 负面约束

### 禁止事项

- 🚫 **不要手动构造 Entity ID**
  - 原因：可能破坏版本一致性
  - 正确：始终通过 EntityManager.create()

- 🚫 **不要存储 Entity ID 而不检查存活**
  - 原因：可能引用已销毁的实体
  - 正确：使用前调用 isAlive() 检查

- 🚫 **不要假设索引连续**
  - 原因：回收会导致索引跳跃
  - 正确：使用 EntityId.index() 提取

- 🚫 **不要忽略版本号**
  - 原因：版本不匹配表示悬空引用
  - 正确：始终比较版本

### 常见错误

```typescript
// ❌ 错误: 手动创建 ID
const badEntity = 0; // 直接使用数字
world.addComponent(badEntity, Position); // 可能无效

// ✅ 正确: 通过管理器创建
const goodEntity = world.createEntity();
world.addComponent(goodEntity, Position);

// ❌ 错误: 不检查存活
class BadComponent {
  target: EntityId;

  update() {
    // 直接使用，可能已销毁
    const targetPos = world.getComponent(this.target, Position);
  }
}

// ✅ 正确: 检查存活
class GoodComponent {
  target: EntityId;

  update() {
    if (!world.isAlive(this.target)) {
      return; // 目标已销毁
    }
    const targetPos = world.getComponent(this.target, Position);
  }
}

// ❌ 错误: 忽略版本号
function badEquals(a: EntityId, b: EntityId) {
  return EntityId.index(a) === EntityId.index(b); // 错误！
}

// ✅ 正确: 完整比较
function goodEquals(a: EntityId, b: EntityId) {
  return EntityId.equals(a, b); // 比较 index + generation
}
```

---

## 🔗 相关文档

### 核心模块
- [Core ECS Architecture](../../architecture/core/core-ecs-architecture.md) - 整体架构
- [World](./world.md) - 中央调度器
- [EntityId](./entity-id.md) - ID 工具函数

### 设计模式
- [Entity ID 设计](../patterns/entity-id-design.md) - ID 系统设计
- [内存管理](../patterns/memory-management.md) - 内存回收策略

---

**版本**: 3.0.0
**状态**: ✅ 生产就绪
**最后更新**: 2025-12-19
