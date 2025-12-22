---
id: "core-modules"
type: "reference"
title: "Core Modules - ECS架构与基础组件"
description: "ECS核心架构模块（v3.0）与基础组件模块（v2.x兼容层）"
context_dependency: ["core-ecs-architecture"]
related_ids: [
  "core-world", "core-archetype", "core-query", "core-entity-manager",
  "core-component-registry", "core-command-buffer",
  "core-entity-builder", "core-transform-matrix-pool",
  "core-event-dispatcher", "core-time", "core-object-pool",
  "dag-scheduler", "core-systems", "core-components"
]
version: "3.0.0"
last_updated: "2025-12-19"
---

## 📚 核心模块概览

> ✅ **v3.0 ECS 架构已上线** | 🟡 **v2.x 旧架构标记为兼容层**

本目录包含运行时架构的核心组件，分为两个层级：

1. **ECS 内核 (v3.0)**: 新架构，高性能实体组件系统
2. **基础组件 (v2.x)**: 保留用于兼容，建议逐步迁移

### 模块结构

#### 🆕 ECS 内核 (v3.0) - 推荐使用
```
core/
├── world.md                    # World - ECS中央调度器 ⭐
├── archetype.md                # Archetype - SoA内存布局 ⭐
├── query.md                    # Query - 查询系统 ⭐
├── entity-manager.md           # EntityManager - 实体ID管理 ⭐
├── component-registry.md       # ComponentRegistry - 组件注册表 ⭐
├── command-buffer.md           # CommandBuffer - 延迟命令 ⭐
├── entity-builder.md           # EntityBuilder - 流式构建器 ⭐ NEW
├── transform-matrix-pool.md    # TransformMatrixPool - 矩阵池 ⭐ NEW
├── dag-scheduler.md            # DAGScheduler - 拓扑排序调度器 ⭐ NEW
├── systems.md                  # SystemScheduler - 系统调度器 ⭐ NEW
├── components.md               # Components - 数据组件集合 ⭐ NEW
├── entity-id.ts                # EntityId - ID工具函数
├── systems.ts                  # Systems - 系统管理实现
├── change-detection.ts         # ChangeDetection - 变更检测
├── gpu-buffer-sync.ts          # GPUBufferSync - GPU同步
└── render-data-storage.ts      # RenderDataStorage - 渲染数据
```

#### 🟡 基础组件 (v2.x) - 兼容层
```
core/
├── max-object.md               # MaxObject (旧) - 对象基类
├── refer-resource.md           # ReferResource (旧) - 引用计数
├── entity.md                   # Entity (旧) - 实体类 ⚠️ 已废弃
├── component.md                # Component (旧) - 组件基类 ⚠️ 已废弃
├── transform-component.md      # Transform (旧) - 变换组件 ⚠️ 已废弃
├── event.md                    # Event - 事件对象
├── event-dispatcher.md         # EventDispatcher - 事件分发器
├── object-pool.md              # ObjectPool - 对象池
├── object-pool-manager.md      # ObjectPoolManager - 池管理器
├── time.md                     # Time - 时间管理
├── ioc-container.md            # IOCContainer - 依赖注入
├── canvas-wrapper.md           # CanvasWrapper - 环境验证
├── hierarchy-utils.md          # HierarchyUtils - 层级工具
├── bitset.md                   # BitSet - 位集合
├── sparse-set.md               # SparseSet - 稀疏集合
└── disposable.md               # Disposable - 资源释放
```

## 🔑 关键特性

### 🆕 ECS 架构 (v3.0)
- **World**: 中央调度器，统一管理实体、组件、查询
- **Archetype**: SoA 内存布局，缓存友好，性能提升 4-5x
- **Query**: 基于 BitSet 的快速实体查询，支持复杂过滤
- **EntityManager**: 版本化实体 ID，防止悬空引用
- **CommandBuffer**: 延迟命令，遍历中安全修改结构
- **DAGScheduler**: 拓扑排序调度器，支持依赖管理和并行分析
- **SystemScheduler**: 分阶段系统执行，支持错误隔离和条件执行
- **Components**: 基于 Specification 的纯数据组件集合

### 🟡 旧架构 (v2.x) - 兼容
- **Entity/Component**: GameObject 模式，类 Unity 设计
- **Transform**: 递归层级，脏标记优化
- **ReferResource**: 引用计数资源管理
- **MaxObject**: 统一 ID 和生命周期

### 通用系统
- **事件系统**: 优先级、冒泡/捕获、错误隔离
- **内存管理**: 对象池、引用计数、中央监控
- **时间系统**: 时间缩放、固定步长、FPS 独立
- **工具模块**: BitSet、SparseSet、HierarchyUtils

### 性能优化
- **SoA 布局**: 连续内存，SIMD 友好
- **批量遍历**: 减少函数调用开销
- **缓存优化**: 高缓存命中率
- **零拷贝**: 直接引用，无数据复制

## 🎯 使用场景

### ECS 游戏引擎架构
```typescript
// 1. 创建世界
const world = new World();

// 2. 注册组件
world.registerComponent(Position);
world.registerComponent(Velocity);
world.registerComponent(MeshRef);

// 3. 创建实体
const player = world.createEntity();
world.addComponent(player, Position, { x: 10, y: 0, z: 0 });
world.addComponent(player, Velocity, { x: 1, y: 0, z: 0 });

// 4. 查询和更新
const query = world.query({ all: [Position, Velocity] });
query.forEach((entity, [pos, vel]) => {
  pos.x += vel.x;
});

// 5. 更新循环
world.update(deltaTime);
```

### 系统架构
```typescript
// 物理系统
function physicsSystem(world: World, deltaTime: number) {
  const query = world.query({ all: [Position, Velocity] });
  query.forEach((entity, [pos, vel]) => {
    pos.x += vel.x * deltaTime;
    pos.y += vel.y * deltaTime;
  });
}

// 注册系统
world.addSystem("Physics", physicsSystem, SystemStage.Update);
```

### 延迟操作
```typescript
// 在遍历中安全修改结构
function spawnSystem(world: World) {
  const buffer = world.getCommandBuffer();
  const query = world.query({ all: [Spawner] });

  query.forEach((entity, [spawner]) => {
    if (spawner.shouldSpawn) {
      buffer.createEntity(newEntity => {
        buffer.addComponent(newEntity, Position, spawner.pos);
        buffer.addComponent(newEntity, Velocity, spawner.vel);
      });
    }
  });

  buffer.apply(world);
}
```

## 📊 模块依赖关系

```
┌─────────────────────────────────────────┐
│         Application Layer               │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      ECS Core (v3.0)                    │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │  World   │◄─┤  Query   │            │
│  └────┬─────┘  └────┬─────┘            │
│       │             │                  │
│  ┌────▼─────┐  ┌────▼─────┐            │
│  │Archetype │  │Component │            │
│  │  (SoA)   │  │Registry  │            │
│  └────┬─────┘  └────┬─────┘            │
│       │             │                  │
│  ┌────▼─────────────▼─────┐            │
│  │  EntityManager + ID    │            │
│  └────────┬───────────────┘            │
│           │                            │
│  ┌────────▼────────┐                   │
│  │ CommandBuffer   │                   │
│  └─────────────────┘                   │
└─────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      Legacy (v2.x) - Compatibility      │
│  ┌─────────┐  ┌─────────┐              │
│  │ Entity  │  │Component│ ⚠️ Deprecated │
│  └─────────┘  └─────────┘              │
│       ▲             ▲                  │
│       │             │                  │
│  ┌────┴─────┐  ┌────┴─────┐            │
│  │ Transform│  │  Events  │            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      Supporting Libraries               │
│  (Math, RHI, Specification, Utils)      │
└─────────────────────────────────────────┘
```

## 🚀 快速入门 (ECS v3.0)

### 1. 创建世界和注册组件
```typescript
import { World } from '@maxellabs/core';

// 创建世界
const world = new World();

// 定义组件（纯数据结构）
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

// 注册组件
world.registerComponent(Position);
world.registerComponent(Velocity);
```

### 2. 创建实体和添加组件
```typescript
// 创建实体
const entity = world.createEntity();

// 添加组件
world.addComponent(entity, Position, { x: 10, y: 0, z: 0 });
world.addComponent(entity, Velocity, { x: 1, y: 0, z: 0 });

// 获取组件
const pos = world.getComponent(entity, Position);
console.log(pos); // { x: 10, y: 0, z: 0 }
```

### 3. 查询和遍历
```typescript
// 创建查询
const query = world.query({
  all: [Position, Velocity]
});

// 遍历更新
query.forEach((entity, [pos, vel]) => {
  pos.x += vel.x;
  pos.y += vel.y;
  pos.z += vel.z;
});

// 批量操作
const count = query.count(); // 匹配的实体数
const results = query.execute(); // 获取所有结果
```

### 4. 更新循环
```typescript
// 在游戏循环中
function gameLoop(deltaTime: number) {
  // 应用延迟命令
  world.applyCommands();

  // 执行系统
  physicsSystem(world, deltaTime);
  renderSystem(world, deltaTime);

  // 更新世界
  world.update(deltaTime);
}

// 注册系统
world.addSystem("Physics", physicsSystem, SystemStage.Update);
```

### 5. 延迟操作
```typescript
// 在遍历中安全修改结构
function spawnSystem(world: World) {
  const buffer = world.getCommandBuffer();
  const query = world.query({ all: [Spawner] });

  query.forEach((entity, [spawner]) => {
    if (spawner.cooldown <= 0) {
      // 延迟创建
      buffer.createEntity(newEntity => {
        buffer.addComponent(newEntity, Position, spawner.position);
        buffer.addComponent(newEntity, Velocity, spawner.velocity);
      });
      spawner.cooldown = spawner.interval;
    }
  });

  // 统一应用
  buffer.apply(world);
}
```

## 🔒 安全准则

### ECS 安全规则
- 🚫 **不要在 Query 遍历中修改结构** → 使用 CommandBuffer
- 🚫 **不要存储组件引用** → 每次通过 getComponent 获取
- 🚫 **不要手动构造 Entity ID** → 使用 EntityManager.create()
- 🚫 **不要忽略版本号检查** → 防止悬空引用

### 内存安全
- ✅ 组件注册只执行一次
- ✅ Query 对象缓存复用
- ✅ 及时销毁实体和清理资源
- ✅ 避免在热路径中创建临时对象

### 错误处理
- ✅ 检查实体存活后再操作
- ✅ 验证组件是否已注册
- ✅ 捕获命令缓冲区应用错误

## 🎯 最佳实践

### 1. 组件设计
```typescript
// ✅ 推荐：纯数据结构
class Position {
  x: number = 0;
  y: number = 0;
  z: number = 0;
}

// ❌ 避免：带方法的组件
class BadPosition {
  x: number = 0;
  set(x: number) { this.x = x; } // ECS 中不需要
}
```

### 2. 系统组织
```typescript
// ✅ 推荐：缓存 Query
class PhysicsSystem {
  private query: Query;

  constructor(world: World) {
    this.query = world.query({ all: [Position, Velocity] });
  }

  update(world: World, deltaTime: number) {
    this.query.forEach((entity, [pos, vel]) => {
      pos.x += vel.x * deltaTime;
    });
  }
}

// ❌ 避免：每次创建 Query
function badPhysics(world: World, deltaTime: number) {
  for (let i = 0; i < 1000; i++) {
    world.query({ all: [Position] }).forEach(...); // 重复创建
  }
}
```

### 3. 命令缓冲区使用
```typescript
// ✅ 推荐：延迟操作
function spawnSystem(world: World) {
  const buffer = world.getCommandBuffer();
  const query = world.query({ all: [Spawner] });

  query.forEach((entity, [spawner]) => {
    buffer.createEntity(newEntity => {
      buffer.addComponent(newEntity, Position, spawner.pos);
    });
  });

  buffer.apply(world);
}

// ❌ 避免：直接修改
function badSpawn(world: World) {
  const query = world.query({ all: [Spawner] });
  query.forEach((entity, [spawner]) => {
    const newEntity = world.createEntity(); // 危险！
    world.addComponent(newEntity, Position, spawner.pos);
  });
}
```

### 4. 查询优化
```typescript
// ✅ 推荐：精确过滤
const query = world.query({
  all: [Position, Velocity],
  none: [Static, Hidden]  // 排除不需要的
});

// ❌ 避免：过度宽泛
const query = world.query({ all: [Position] });
// 然后在遍历中手动过滤
query.forEach((entity, [pos]) => {
  if (!entity.hasComponent(Velocity)) return; // 浪费遍历
});
```

## 📚 相关文档

### 🏗️ 架构规范
- [Core ECS Architecture](../../architecture/core/core-ecs-architecture.md) - ⭐ **必读**
- [Core-Engine-RHI集成边界](../../architecture/core/core-integration-boundary.md) - 包间契约

### 📖 API 参考 (ECS v3.0)
- [World](./world.md) - 中央调度器 ⭐
- [Archetype](./archetype.md) - 内存布局 ⭐
- [Query](./query.md) - 查询系统 ⭐
- [EntityManager](./entity-manager.md) - 实体管理 ⭐
- [ComponentRegistry](./component-registry.md) - 组件注册 ⭐
- [CommandBuffer](./command-buffer.md) - 延迟命令 ⭐

### 📖 旧架构参考 (v2.x - 兼容)
- [Entity](./entity.md) - ⚠️ 已废弃
- [Component](./component.md) - ⚠️ 已废弃
- [TransformComponent](./transform-component.md) - ⚠️ 已废弃
- [EventDispatcher](./event-dispatcher.md) - 仍可用
- [ObjectPool](./object-pool.md) - 仍可用

### 📖 工具模块
- [BitSet](../utils/bitset.md) - ECS 核心工具
- [SparseSet](../utils/sparse-set.md) - 高效集合
- [HierarchyUtils](../utils/hierarchy-utils.md) - 层级工具
- [Time](../utils/time.md) - 时间管理

### 🎯 使用指南
- [ECS 编程指南](../guides/ecs-programming.md) - 最佳实践
- [性能优化](../guides/performance-optimization.md) - 性能调优
- [迁移指南](../guides/migration-v2-to-v3.md) - 从 v2 迁移到 v3

## 🔍 调试建议

### 查询调试
```typescript
// 检查匹配的 Archetype 数量
const query = world.query({ all: [Position, Velocity] });
console.log(`匹配 Archetype: ${query.matchedArchetypes?.length || 'N/A'}`);
console.log(`匹配实体: ${query.count()}`);

// 查看所有组件
const allComponents = world.getAllComponents(entity);
console.log('实体组件:', allComponents.map(c => c.constructor.name));
```

### 性能监控
```typescript
// 实体统计
console.log({
  totalEntities: world.getEntityCount(),
  archetypes: world.getArchetypeCount(),
  queries: world.getQueryCount()
});

// 内存使用估算
const posArray = archetype.getComponentArray<Position>(0);
console.log(`Position 数组大小: ${posArray.length}`);
```

### 常见问题

**问题：查询不到实体**
```typescript
// 检查组件是否注册
if (!world.isRegistered(Position)) {
  console.error('Position 未注册！');
}

// 检查实体是否有该组件
if (!world.hasComponent(entity, Position)) {
  console.error('实体没有 Position 组件！');
}
```

**问题：遍历中崩溃**
```typescript
// 可能是在遍历中修改了结构
// 解决方案：使用 CommandBuffer
const buffer = world.getCommandBuffer();
query.forEach((entity, [pos]) => {
  buffer.removeComponent(entity, Velocity); // 安全
});
buffer.apply(world);
```

---

**文档状态**: ✅ 完成
**版本**: 3.0.0
**最后更新**: 2025-12-19
**ECS 重构**: 已完成
**测试通过**: 169/169
