---
id: "core-world"
type: "reference"
title: "World - ECS中央调度器"
description: "ECS核心调度器，管理所有实体、组件、Archetype和查询系统"
tags: ["ecs", "world", "core", "scheduler", "entity-manager", "component-registry"]
context_dependency: ["core-ecs-architecture", "core-entity-manager", "core-archetype"]
related_ids: ["core-query", "core-command-buffer", "core-archetype"]
version: "3.0.0"
last_updated: "2025-12-19"
---

# World - ECS中央调度器

> **核心作用**: World 是 ECS 架构的"上帝对象"，统一管理所有 ECS 核心组件。

---

## 🔌 接口定义

### World 类定义

```typescript
class World {
  // 构造函数
  constructor();

  // 实体生命周期管理
  createEntity(): EntityId;
  destroyEntity(entity: EntityId): void;
  isAlive(entity: EntityId): boolean;

  // 组件管理
  registerComponent<T>(type: ComponentClass<T>): ComponentTypeId;

  addComponent<T>(
    entity: EntityId,
    componentType: ComponentClass<T>,
    data?: Partial<T>
  ): void;

  removeComponent<T>(entity: EntityId, componentType: ComponentClass<T>): void;

  getComponent<T>(
    entity: EntityId,
    componentType: ComponentClass<T>
  ): Readonly<T> | undefined;

  getComponentMut<T>(
    entity: EntityId,
    componentType: ComponentClass<T>
  ): T | undefined;

  hasComponent(entity: EntityId, componentType: ComponentClass): boolean;

  // 查询系统
  query(filter: QueryFilter): Query;

  // 资源管理
  insertResource<T>(resource: T): void;
  getResource<T>(type: new () => T): T | undefined;
  removeResource<T>(type: new () => T): void;
  hasResource(type: new () => any): boolean;

  // 命令缓冲
  getCommandBuffer(): CommandBuffer;
  applyCommands(): void;

  // 更新循环
  update(deltaTime: number): void;

  // 系统管理
  addSystem(name: string, system: SystemFunction, stage?: SystemStage): void;
  removeSystem(name: string): void;

  // 状态查询
  getEntityCount(): number;
  getArchetypeCount(): number;
  getQueryCount(): number;
}
```

### 类型定义

```typescript
// 系统函数类型
type SystemFunction = (world: World, deltaTime?: number) => void;

// 系统阶段
enum SystemStage {
  PreUpdate = "preUpdate",
  Update = "update",
  PostUpdate = "postUpdate",
  Render = "render"
}

// 实体位置信息
interface EntityLocation {
  archetype: Archetype;
  row: number;
}
```

---

## ⚙️ 实现逻辑

### 1. 实体创建流程

```typescript
Pseudocode:
FUNCTION createEntity():
  // 1. 分配 Entity ID
  entity = entityManager.create()

  // 2. 创建空 Archetype（无组件）
  emptyArchetype = getOrCreateArchetype(emptyMask)

  // 3. 添加实体到空 Archetype
  row = emptyArchetype.addEntity(entity, [])

  // 4. 记录实体位置
  entityLocations.set(entity, { archetype: emptyArchetype, row })

  RETURN entity
```

### 2. 组件添加流程

```typescript
Pseudocode:
FUNCTION addComponent(entity, componentType, data):
  // 1. 获取当前实体位置
  location = entityLocations.get(entity)
  oldArchetype = location.archetype
  oldRow = location.row

  // 2. 提取现有组件数据
  oldData = extractAllComponents(oldArchetype, oldRow)

  // 3. 创建新掩码（旧掩码 + 新组件）
  newMask = oldArchetype.mask.with(componentType)

  // 4. 获取或创建新 Archetype
  newArchetype = getOrCreateArchetype(newMask)

  // 5. 从旧 Archetype 移除
  oldArchetype.removeEntity(entity)

  // 6. 添加到新 Archetype
  newData = [...oldData, data || new componentType()]
  newRow = newArchetype.addEntity(entity, newData)

  // 7. 更新位置映射
  entityLocations.set(entity, { archetype: newArchetype, row: newRow })

  // 8. 更新所有 Query 缓存
  updateQueryCaches(newArchetype)
```

### 3. 查询匹配流程

```typescript
Pseudocode:
FUNCTION query(filter):
  // 1. 创建 Query 对象
  query = new Query(filter, componentRegistry)

  // 2. 遍历所有 Archetype
  FOR archetype IN archetypes:
    // 3. 使用 BitSet 快速匹配
    IF query.matches(archetype):
      query.addArchetype(archetype)

  // 4. 缓存查询结果
  queries.push(query)

  RETURN query
```

### 4. 更新循环流程

```typescript
Pseudocode:
FUNCTION update(deltaTime):
  // Stage 1: 应用延迟命令
  commandBuffer.apply(this)

  // Stage 2: Pre-Update Systems
  FOR system IN systems.preUpdate:
    system(this, deltaTime)

  // Stage 3: Update Systems (用户逻辑)
  FOR system IN systems.update:
    system(this, deltaTime)

  // Stage 4: Post-Update Systems (核心系统)
  FOR system IN systems.postUpdate:
    system(this, deltaTime)

  // Stage 5: 清理脏标记
  clearDirtyFlags()

  // Stage 6: 提取渲染数据
  extractRenderData()
```

---

## 📚 使用示例

### 基础使用

```typescript
import { World } from '@maxellabs/core';

// 1. 创建世界
const world = new World();

// 2. 定义组件（纯数据结构）
class Position {
  x: number = 0;
  y: number = 0;
  z: number = 0;
}

class Velocity {
  x: number = 0;
  y: number = 0;
  z: number = 0;
}

// 3. 注册组件
world.registerComponent(Position);
world.registerComponent(Velocity);

// 4. 创建实体
const entity = world.createEntity();

// 5. 添加组件
world.addComponent(entity, Position, { x: 10, y: 0, z: 0 });
world.addComponent(entity, Velocity, { x: 1, y: 0, z: 0 });

// 6. 查询实体
const query = world.query({ all: [Position, Velocity] });

// 7. 遍历更新
query.forEach((e, [pos, vel]) => {
  pos.x += vel.x;
  pos.y += vel.y;
  pos.z += vel.z;
});
```

### 高级用法

```typescript
// 资源管理
world.insertResource(new TimeManager());
world.insertResource(new InputManager());

// 在 System 中使用资源
function physicsSystem(world: World, deltaTime: number) {
  const time = world.getResource(TimeManager);
  const input = world.getResource(InputManager);

  const query = world.query({ all: [Position, Velocity, PlayerController] });

  query.forEach((entity, [pos, vel, controller]) => {
    // 读取输入
    const moveX = input.getAxis("Horizontal");
    const moveZ = input.getAxis("Vertical");

    // 更新速度
    vel.x = moveX * controller.speed;
    vel.z = moveZ * controller.speed;

    // 更新位置
    pos.x += vel.x * time.deltaTime;
    pos.z += vel.z * time.deltaTime;
  });
}

// 注册系统
world.addSystem("Physics", physicsSystem, SystemStage.Update);
```

### 命令缓冲区

```typescript
// 在遍历中安全地修改结构
function spawnSystem(world: World) {
  const buffer = world.getCommandBuffer();
  const query = world.query({ all: [Spawner] });

  query.forEach((entity, [spawner]) => {
    spawner.cooldown -= world.getResource(TimeManager).deltaTime;

    if (spawner.cooldown <= 0) {
      // 延迟创建实体
      buffer.createEntity(newEntity => {
        buffer.addComponent(newEntity, Position, spawner.position);
        buffer.addComponent(newEntity, Velocity, spawner.velocity);
        buffer.addComponent(newEntity, Lifetime, { duration: 5 });
      });

      spawner.cooldown = spawner.interval;
    }
  });

  // 帧末尾统一应用
  buffer.apply(world);
}
```

---

## 🏗️ 内部架构

### World 内部存储

```typescript
class World {
  // 实体管理
  private entityManager: EntityManager;

  // 组件注册
  private componentRegistry: ComponentRegistry;

  // 实体位置映射
  private entityLocations = new Map<EntityId, EntityLocation>();

  // Archetype 缓存
  private archetypes = new Map<string, Archetype>();

  // 查询列表
  private queries: Query[] = [];

  // 空 Archetype
  private emptyArchetype: Archetype;

  // 全局资源
  private resources = new Map<any, any>();

  // 命令缓冲
  private commandBuffer: CommandBuffer;

  // 系统管理
  private systems = {
    preUpdate: [],
    update: [],
    postUpdate: [],
    render: []
  };
}
```

### Archetype 管理

```typescript
// 内部方法
private getOrCreateArchetype(mask: BitSet): Archetype {
  const hash = mask.toString();

  // 尝试获取现有
  const existing = this.archetypes.get(hash);
  if (existing) return existing;

  // 创建新 Archetype
  const componentTypes = this.componentRegistry.getTypesFromMask(mask);
  const archetype = new Archetype(mask, componentTypes);

  // 缓存
  this.archetypes.set(hash, archetype);

  // 通知所有查询
  for (const query of this.queries) {
    if (query.matches(archetype)) {
      query.addArchetype(archetype);
    }
  }

  return archetype;
}
```

---

## 🚫 负面约束

### 禁止事项

- 🚫 **不要在 Query 遍历中直接添加/删除组件**
  - 原因：会导致 Query 缓存失效
  - 正确：使用 CommandBuffer

- 🚫 **不要直接访问 Archetype 内部数组**
  - 原因：破坏封装性，可能导致数据不一致
  - 正确：通过 World API 操作

- 🚫 **不要在 System 中创建实体而不使用 CommandBuffer**
  - 原因：可能导致遍历过程中结构变化
  - 正确：使用延迟命令

- 🚫 **不要存储组件引用**
  - 原因：ECS 中组件可能被迁移，引用会失效
  - 正确：每次通过 getComponent 获取

### 常见错误

```typescript
// ❌ 错误: 在遍历中修改结构
query.forEach((entity, [pos]) => {
  world.removeComponent(entity, Velocity); // 导致 Query 失效！
});

// ✅ 正确: 使用 CommandBuffer
const buffer = world.getCommandBuffer();
query.forEach((entity, [pos]) => {
  buffer.removeComponent(entity, Velocity);
});
buffer.apply(world);

// ❌ 错误: 忘记注册组件
const world = new World();
const entity = world.createEntity();
world.addComponent(entity, Position); // 错误！Position 未注册

// ✅ 正确: 先注册
world.registerComponent(Position);
world.addComponent(entity, Position);
```

---

## 📊 性能特征

### 时间复杂度

| 操作 | 复杂度 | 说明 |
| --- | --- | --- |
| `createEntity()` | O(1) | 实体ID分配 |
| `addComponent()` | O(m + a) | m=组件数, a=Archetype数 |
| `removeComponent()` | O(m + a) | 同上 |
| `getComponent()` | O(1) | 直接数组访问 |
| `query()` | O(a) | a=Archetype总数 |
| `query.forEach()` | O(n) | n=匹配实体数 |

### 内存占用

```
World 对象: ~500 bytes
  - EntityManager: ~200 bytes + 实体数组
  - ComponentRegistry: ~100 bytes + 组件元数据
  - Archetype 缓存: ~100 bytes + Archetype 对象
  - Query 缓存: ~100 bytes + Query 对象

Per Entity: ~4 bytes (仅 ID)
Per Component: ~8-64 bytes (取决于数据大小)
Per Archetype: ~200 bytes + 存储数组
```

---

## 🔗 相关文档

### 核心模块
- [Core ECS Architecture](../../architecture/core/core-ecs-architecture.md) - 整体架构
- [EntityManager](./entity-manager.md) - 实体ID管理
- [Archetype](./archetype.md) - 内存布局
- [Query](./query.md) - 查询系统
- [CommandBuffer](./command-buffer.md) - 延迟命令

### 使用指南
- [ECS 编程指南](../guides/ecs-programming.md) - 最佳实践
- [性能优化](../guides/performance-optimization.md) - 性能调优

---

**版本**: 3.0.0
**状态**: ✅ 生产就绪
**最后更新**: 2025-12-19
