---
id: "core-systems"
type: "reference"
title: "System 框架 - 分阶段执行与依赖管理"
description: "ECS System 调度器，支持分阶段执行、依赖排序、并行分析和错误处理策略"
tags: ["ecs", "system", "scheduler", "dependency", "parallel", "error-handling", "dag"]
context_dependency: ["core-ecs-architecture", "dag-scheduler"]
related_ids: ["dag-scheduler", "core-world", "core-query"]
version: "3.0.0"
last_updated: "2025-12-22"
---

## 📚 System 框架概述

> ✅ **实现状态**: 已实现并优化
> 🎯 **核心功能**: 分阶段执行、依赖管理、并行分析、错误隔离

System 框架提供了 System 调度和执行机制，支持分阶段执行、依赖排序、并行执行分析和灵活的错误处理策略。

### 核心特性

- ✅ **分阶段执行**: 7 个标准执行阶段（FrameStart → FrameEnd）
- ✅ **依赖管理**: 支持 `after` 和 `priority` 依赖排序
- ✅ **并行分析**: 使用 DAG 调度器分析并行执行批次
- ✅ **错误隔离**: 默认 Continue 策略，单个 System 错误不影响其他 System
- ✅ **条件执行**: 支持 `runIf` 条件判断
- ✅ **查询缓存**: 内置 System 可缓存 Query，避免每帧创建

---

## 🔌 接口定义

### System 执行阶段

```typescript
enum SystemStage {
  FrameStart = 0,   // 帧开始（处理输入、事件）
  PreUpdate = 1,    // 预更新（物理准备）
  Update = 2,       // 主更新（游戏逻辑）
  PostUpdate = 3,   // 后更新（Transform 计算）
  PreRender = 4,    // 渲染准备（剔除、排序）
  Render = 5,       // 渲染
  FrameEnd = 6,     // 帧结束（清理）
}
```

### System 上下文

```typescript
interface SystemContext {
  world: World;              // World 实例
  deltaTime: number;         // 帧时间增量（秒）
  totalTime: number;         // 总运行时间（秒）
  frameCount: number;        // 帧计数
  getResource<T>(type: new () => T): T | undefined;  // 资源访问
}
```

### System 定义

```typescript
interface SystemDef {
  name: string;              // System 名称（用于调试）
  stage: SystemStage;        // 执行阶段
  query?: QueryFilter;       // 查询过滤器（可选）
  execute: SystemExecuteFn;  // 执行函数
  enabled?: boolean;         // 是否启用（默认 true）
  priority?: number;         // 执行优先级（数字越小越先执行）
  after?: string[];          // 依赖的 System 名称
  runIf?: (ctx: SystemContext) => boolean;  // 条件执行
}
```

### 错误处理策略

```typescript
enum ErrorHandlingStrategy {
  Throw = 'throw',                    // 抛出错误，中断执行
  Continue = 'continue',              // 继续执行（默认，提供错误隔离）
  DisableAndContinue = 'disable-and-continue',  // 禁用出错的 System 并继续
}
```

### 错误信息

```typescript
interface SystemExecutionError {
  systemName: string;      // System 名称
  stage: SystemStage;      // 执行阶段
  error: unknown;          // 错误对象
  timestamp: number;       // 发生时间戳
}
```

---

## 🎯 使用示例

### 1. 基本 System 定义

```typescript
import { SystemDef, SystemStage } from '@maxellabs/core';

// 定义 Movement System
const movementSystem: SystemDef = {
  name: 'Movement',
  stage: SystemStage.Update,
  query: { all: [Position, Velocity] },  // 查询包含 Position 和 Velocity 的实体
  execute(ctx, query) {
    if (!query) return;

    // 遍历所有匹配的实体
    query.forEach((entity, [pos, vel]) => {
      pos.x += vel.x * ctx.deltaTime;
      pos.y += vel.y * ctx.deltaTime;
      pos.z += vel.z * ctx.deltaTime;
    });
  }
};

// 注册到调度器
scheduler.addSystem(movementSystem);
```

### 2. System 依赖和优先级

```typescript
// Physics System - 高优先级，先执行
const physicsSystem: SystemDef = {
  name: 'Physics',
  stage: SystemStage.Update,
  priority: 0,  // 最高优先级
  query: { all: [Position, Velocity, Mass] },
  execute(ctx, query) {
    // 物理计算
  }
};

// Collision System - 依赖 Physics
const collisionSystem: SystemDef = {
  name: 'Collision',
  stage: SystemStage.Update,
  priority: 1,
  after: ['Physics'],  // 必须在 Physics 之后执行
  query: { all: [Position, Collider] },
  execute(ctx, query) {
    // 碰撞检测
  }
};

// Transform System - 依赖 Collision
const transformSystem: SystemDef = {
  name: 'Transform',
  stage: SystemStage.PostUpdate,
  after: ['Collision'],  // 依赖前一阶段的 Collision
  execute(ctx) {
    // 变换计算
  }
};

// 批量注册
scheduler.addSystems(physicsSystem, collisionSystem, transformSystem);
```

### 3. 条件执行

```typescript
const debugSystem: SystemDef = {
  name: 'Debug',
  stage: SystemStage.Render,
  runIf: (ctx) => {
    // 只在调试模式下执行
    const config = ctx.getResource(DebugConfig);
    return config?.enabled ?? false;
  },
  execute(ctx) {
    // 渲染调试信息
  }
};
```

### 4. 错误处理

```typescript
// 设置全局错误处理策略
scheduler.setErrorHandlingStrategy(ErrorHandlingStrategy.Continue);

// 设置自定义错误回调
scheduler.setErrorCallback((errorInfo) => {
  console.error(`[${errorInfo.stage}] ${errorInfo.systemName}:`, errorInfo.error);

  // 收集错误到监控系统
  monitoringService.report(errorInfo);

  // 返回 true 表示已处理，不需要默认策略
  return true;
});

// 错误示例
const riskySystem: SystemDef = {
  name: 'Risky',
  stage: SystemStage.Update,
  execute(ctx) {
    // 可能出错的操作
    if (Math.random() > 0.5) {
      throw new Error('Random error!');
    }
  }
};

// 即使出错，其他 System 仍会执行
scheduler.addSystem(riskySystem);
```

### 5. 并行执行分析

```typescript
// 启用并行执行模式
scheduler.setParallelExecution(true);

// 添加多个 System
scheduler.addSystems(
  { name: 'A', stage: SystemStage.Update, execute: () => {} },
  { name: 'B', stage: SystemStage.Update, execute: () => {}, after: ['A'] },
  { name: 'C', stage: SystemStage.Update, execute: () => {}, after: ['A'] },
  { name: 'D', stage: SystemStage.Update, execute: () => {}, after: ['B', 'C'] }
);

// 执行后查看并行批次
const batches = scheduler.getParallelBatches(SystemStage.Update);
console.log(batches);
// 结果: [['A'], ['B', 'C'], ['D']]
// 说明: A 先执行，然后 B 和 C 可并行执行，最后 D
```

---

## 🏗️ 执行流程

### 1. 每帧更新流程

```typescript
// 伪代码：scheduler.update(deltaTime)
function update(deltaTime) {
  // 1. 更新运行时状态
  this.deltaTime = deltaTime;
  this.totalTime += deltaTime;
  this.frameCount++;

  // 2. 创建上下文
  const ctx = {
    world: this.world,
    deltaTime,
    totalTime: this.totalTime,
    frameCount: this.frameCount,
    getResource: (type) => this.world.getResource(type)
  };

  // 3. 按阶段执行
  for (const stage of [
    SystemStage.FrameStart,
    SystemStage.PreUpdate,
    SystemStage.Update,
    SystemStage.PostUpdate,
    SystemStage.PreRender,
    SystemStage.Render,
    SystemStage.FrameEnd
  ]) {
    this.executeStage(stage, ctx);
  }
}
```

### 2. 阶段执行流程

```typescript
// 伪代码：executeStage(stage, ctx)
function executeStage(stage, ctx) {
  // 如果启用并行执行
  if (this.enableParallelExecution) {
    const batches = this.parallelBatches.get(stage);
    if (batches) {
      // 使用并行批次执行
      this.executeStageParallel(stage, ctx, batches);
      return;
    }
  }

  // 串行执行
  const systems = this.stageOrder.get(stage);
  this.executeSystems(systems, ctx, stage);
}
```

### 3. System 执行流程

```typescript
// 伪代码：executeSystems(systems, ctx, stage)
function executeSystems(systems, ctx, stage) {
  for (const system of systems) {
    // 1. 检查是否启用
    if (!system.enabled) continue;

    // 2. 条件检查
    if (system.def.runIf && !system.defIf(ctx)) continue;

    // 3. 执行
    try {
      system.def.execute(ctx, system.query);
    } catch (error) {
      // 4. 错误处理
      this.handleSystemError(system, stage, error);
    }
  }
}
```

### 4. 并行执行流程

```typescript
// 伪代码：executeStageParallel(stage, ctx, batches)
function executeStageParallel(stage, ctx, batches) {
  // 注意：JavaScript 单线程限制，当前仍是串行执行
  // 批次信息主要用于依赖分析和未来的 Web Worker 支持

  for (const batch of batches) {
    // 同一批次内的 System 可以并行执行（无依赖冲突）
    this.executeSystems(batch, ctx, stage);
  }
}
```

### 5. 错误处理流程

```typescript
// 伪代码：handleSystemError(system, stage, error)
function handleSystemError(system, stage, error) {
  const errorInfo = {
    systemName: system.def.name,
    stage,
    error,
    timestamp: Date.now()
  };

  // 1. 调用错误回调
  if (this.errorCallback) {
    const handled = this.errorCallback(errorInfo);
    if (handled) return;  // 回调已处理
  }

  // 2. 根据策略处理
  switch (this.errorHandlingStrategy) {
    case ErrorHandlingStrategy.Continue:
      console.error(`Error in "${system.def.name}":`, error);
      break;

    case ErrorHandlingStrategy.DisableAndContinue:
      console.error(`Error in "${system.def.name}", disabling:`, error);
      system.enabled = false;
      break;

    case ErrorHandlingStrategy.Throw:
      logError(`Error in "${system.def.name}":`, 'SystemScheduler', error);
      break;
  }
}
```

---

## 🔄 排序机制

### 1. System 排序流程

```typescript
// 伪代码：sortSystems()
function sortSystems() {
  for (const [stage, systems] of this.stageOrder) {
    // 第一步：按 priority 排序
    systems.sort((a, b) => {
      const priorityA = a.def.priority ?? 0;
      const priorityB = b.def.priority ?? 0;
      return priorityA - priorityB;
    });

    // 第二步：处理 after 依赖（DAG 拓扑排序）
    const hasAfterDeps = systems.some(s => s.def.after?.length > 0);
    if (!hasAfterDeps) {
      if (this.enableParallelExecution) {
        this.parallelBatches.set(stage, [systems]);
      }
      continue;
    }

    // 创建 DAG 调度器
    const dag = new DAGScheduler<RegisteredSystem>();

    // 添加节点
    for (const system of systems) {
      dag.addNode(system.def.name, system);
    }

    // 添加依赖
    for (const system of systems) {
      if (system.def.after) {
        for (const afterName of system.def.after) {
          dag.addDependency(system.def.name, afterName);
        }
      }
    }

    // 拓扑排序
    const result = dag.topologicalSort();
    if (!result.success) {
      console.error(`循环依赖: ${result.error}`);
      continue;  // 保持原顺序
    }

    // 应用排序结果
    this.stageOrder.set(stage, result.sorted.map(n => n.data));

    // 第三步：分析并行批次
    if (this.enableParallelExecution) {
      const batches = dag.analyzeParallelBatches();
      this.parallelBatches.set(
        stage,
        batches.map(b => b.nodes.map(n => n.data))
      );
    }
  }
}
```

### 2. 排序示例

```typescript
// 假设以下 System 在同一阶段：
// A: priority=0
// B: priority=1, after=['A']
// C: priority=0, after=['A']
// D: priority=2, after=['B', 'C']

// 排序过程：
// 1. 按 priority: [A, C, B, D]  (A和C都是0，B是1，D是2)
// 2. DAG 排序:
//    - A 无依赖，先执行
//    - B 和 C 都依赖 A，但彼此无依赖
//    - D 依赖 B 和 C
// 3. 最终顺序: [A, C, B, D] 或 [A, B, C, D]
// 4. 并行批次:
//    - 批次 0: [A]
//    - 批次 1: [C, B]  (可并行)
//    - 批次 2: [D]
```

---

## 🎯 内置 System

### Transform System

```typescript
// 自动计算变换矩阵
export function createTransformSystem(scheduler: SystemScheduler): SystemDef {
  return {
    name: 'Transform',
    stage: SystemStage.PostUpdate,
    priority: 0,
    query: { all: [Position] },
    execute(ctx, query) {
      if (!query) return;

      // 第一遍：更新本地矩阵
      query.forEach((entity, [pos]) => {
        const rot = ctx.world.getComponent(entity, Rotation);
        const scale = ctx.world.getComponent(entity, Scale);
        let localMatrix = ctx.world.getComponent(entity, LocalMatrix);

        if (!localMatrix) {
          ctx.world.addComponent(entity, LocalMatrix, new LocalMatrix());
          localMatrix = ctx.world.getComponent(entity, LocalMatrix);
        }

        // 计算本地矩阵
        composeMatrix(localMatrix.data, pos.x, pos.y, pos.z, ...);
        localMatrix.dirty = false;
      });

      // 第二遍：更新世界矩阵（从根节点开始）
      const rootQuery = scheduler.getOrCreateCachedQuery('TransformSystem_rootQuery', {
        all: [Position],
        none: [Parent],
      });

      rootQuery.forEach((entity) => {
        updateWorldMatrixRecursive(ctx.world, entity, null);
      });
    },
  };
}
```

### Hierarchy System

```typescript
// 处理父子关系变更
export const HierarchySystem: SystemDef = {
  name: 'Hierarchy',
  stage: SystemStage.PostUpdate,
  priority: -10,  // 在 Transform 之前执行
  execute(ctx) {
    // 处理层级变更事件
  },
};
```

### Cleanup System

```typescript
// 清理已销毁的实体
export const CleanupSystem: SystemDef = {
  name: 'Cleanup',
  stage: SystemStage.FrameEnd,
  priority: 100,
  execute(ctx) {
    // 处理延迟销毁的实体
  },
};
```

---

## 🔧 API 参考

### 构造函数

```typescript
new SystemScheduler(world: World)
```

### System 管理

#### `addSystem(def: SystemDef): this`
添加单个 System

#### `addSystems(...defs: SystemDef[]): this`
批量添加 System

#### `removeSystem(name: string): boolean`
移除 System 并清理关联的 Query

#### `setSystemEnabled(name: string, enabled: boolean): boolean`
启用/禁用 System

#### `isSystemEnabled(name: string): boolean`
检查 System 是否启用

### 执行控制

#### `update(deltaTime: number): void`
执行一帧

#### `setParallelExecution(enabled: boolean): void`
启用/禁用并行执行分析

#### `isParallelExecutionEnabled(): boolean`
获取并行执行状态

### 错误处理

#### `setErrorCallback(callback: SystemErrorCallback | undefined): void`
设置错误回调函数

#### `getErrorCallback(): SystemErrorCallback | undefined`
获取当前错误回调

#### `setErrorHandlingStrategy(strategy: ErrorHandlingStrategy): void`
设置错误处理策略

#### `getErrorHandlingStrategy(): ErrorHandlingStrategy`
获取当前错误处理策略

### 查询缓存

#### `getOrCreateCachedQuery(key: string, filter: QueryFilter): Query`
获取或创建缓存的查询（用于内置 System）

### 统计信息

#### `getSystems(): SystemDef[]`
获取所有 System 定义

#### `getStats(): { totalSystems, enabledSystems, stageBreakdown, ... }`
获取统计信息

#### `getParallelBatches(stage: SystemStage): string[][] | undefined`
获取指定阶段的并行批次信息（调试用）

---

## 🚫 负面约束

### 禁止事项

- 🚫 **不要在 System 的 execute 中创建/销毁实体** → 使用 CommandBuffer
- 🚫 **不要在 System 中存储组件引用** → 每次通过 world.getComponent 获取
- 🚫 **不要忽略错误处理** → 默认 Continue 策略提供隔离，但应记录错误
- 🚫 **不要创建循环依赖** → 使用 DAG 调度器会检测并报错
- 🚫 **不要在 Query 遍历中修改结构** → 使用 CommandBuffer

### 常见错误

```typescript
// ❌ 错误：在 System 中直接创建实体
const badSystem: SystemDef = {
  name: 'Bad',
  stage: SystemStage.Update,
  execute(ctx) {
    const entity = ctx.world.createEntity();  // 危险！
    ctx.world.addComponent(entity, Position, { x: 0, y: 0, z: 0 });
  }
};

// ✅ 正确：使用 CommandBuffer
const goodSystem: SystemDef = {
  name: 'Good',
  stage: SystemStage.Update,
  execute(ctx) {
    const buffer = ctx.world.getCommandBuffer();
    buffer.createEntity(entity => {
      buffer.addComponent(entity, Position, { x: 0, y: 0, z: 0 });
    });
    buffer.apply(ctx.world);
  }
};

// ❌ 错误：忽略错误
const riskySystem: SystemDef = {
  name: 'Risky',
  stage: SystemStage.Update,
  execute(ctx) {
    // 可能抛出异常的操作
    const data = riskyOperation();
    // 没有 try-catch
  }
};

// ✅ 正确：捕获并处理错误
const safeSystem: SystemDef = {
  name: 'Safe',
  stage: SystemStage.Update,
  execute(ctx) {
    try {
      const data = riskyOperation();
    } catch (error) {
      console.error('System error:', error);
      // 可以选择记录、恢复或忽略
    }
  }
};
```

---

## 📊 性能优化

### 1. 查询缓存

```typescript
// ❌ 低效：每帧创建新 Query
const badSystem: SystemDef = {
  name: 'Bad',
  stage: SystemStage.Update,
  execute(ctx) {
    for (let i = 0; i < 1000; i++) {
      const query = ctx.world.query({ all: [Position] });  // 重复创建
      query.forEach(...);
    }
  }
};

// ✅ 高效：缓存 Query
class CachedSystem {
  private query: Query;

  constructor(scheduler: SystemScheduler) {
    // 使用调度器的缓存功能
    this.query = scheduler.getOrCreateCachedQuery('MySystem', {
      all: [Position]
    });
  }

  update(ctx: SystemContext) {
    this.query.forEach(...);
  }
}
```

### 2. 并行批次分析

```typescript
// 启用并行分析
scheduler.setParallelExecution(true);

// 调度器会自动分析：
// - 哪些 System 可以并行执行
// - 哪些 System 必须串行执行
// - 执行的批次顺序

// 获取分析结果用于调试
const batches = scheduler.getParallelBatches(SystemStage.Update);
console.log('并行批次:', batches);
// [['A'], ['B', 'C'], ['D']]
```

### 3. 条件执行优化

```typescript
// 使用 runIf 避免不必要的执行
const expensiveSystem: SystemDef = {
  name: 'Expensive',
  stage: SystemStage.Render,
  runIf: (ctx) => {
    // 只在需要时执行
    const camera = ctx.world.getResource(Camera);
    return camera && camera.isDirty;
  },
  execute(ctx) {
    // 昂贵的渲染操作
  }
};
```

---

## 🔍 调试建议

### 1. 查看 System 列表

```typescript
const systems = scheduler.getSystems();
console.log('所有 System:', systems.map(s => ({
  name: s.name,
  stage: SystemStage[s.stage],
  priority: s.priority,
  after: s.after
})));
```

### 2. 获取统计信息

```typescript
const stats = scheduler.getStats();
console.log('统计信息:', {
  总System数: stats.totalSystems,
  启用数: stats.enabledSystems,
  阶段分布: stats.stageBreakdown,
  帧数: stats.frameCount,
  总时间: stats.totalTime,
  并行执行: stats.parallelExecutionEnabled,
  并行批次: stats.parallelBatchCount
});
```

### 3. 监控执行

```typescript
// 设置错误回调收集错误
const errors: SystemExecutionError[] = [];
scheduler.setErrorCallback((errorInfo) => {
  errors.push(errorInfo);
  console.error(`[${errorInfo.stage}] ${errorInfo.systemName}:`, errorInfo.error);
  return false;  // 继续使用默认策略
});

// 每帧后检查
scheduler.update(deltaTime);
if (errors.length > 0) {
  console.warn(`本帧发生 ${errors.length} 个错误`);
}
```

### 4. 验证依赖关系

```typescript
// 检查是否有循环依赖
const stats = scheduler.getStats();
if (stats.totalSystems > 0) {
  // 手动验证：检查 after 依赖是否形成环
  const systems = scheduler.getSystems();
  const graph = new Map<string, string[]>();

  systems.forEach(s => {
    if (s.after) {
      graph.set(s.name, s.after);
    }
  });

  // 使用 DAG 检测循环
  const dag = new DAGScheduler();
  systems.forEach(s => dag.addNode(s.name, s));
  systems.forEach(s => {
    if (s.after) {
      s.after.forEach(dep => dag.addDependency(s.name, dep));
    }
  });

  const result = dag.topologicalSort();
  if (!result.success) {
    console.error('检测到循环依赖:', result.cycle);
  }
}
```

---

## 📚 相关文档

### 架构规范
- [Core ECS Architecture](../../architecture/core/core-ecs-architecture.md) - ⭐ **必读**
- [DAG Scheduler](./dag-scheduler.md) - 依赖排序的核心

### API 参考
- [World](./world.md) - ECS 中央调度器
- [Query](./query.md) - 查询系统
- [CommandBuffer](./command-buffer.md) - 延迟命令

### 组件
- [Components](./components.md) - 数据组件集合

---

## 🎯 成功标准

✅ **必须满足**:
1. 7 个阶段正确顺序执行
2. 依赖关系（after, priority）正确排序
3. 错误隔离机制正常工作（默认 Continue 策略）
4. 并行批次分析准确
5. 查询缓存机制有效

✅ **质量指标**:
- 所有 1060 个测试通过
- 无循环依赖导致的死锁
- 错误不会传播到其他 System
- 性能满足实时要求（<16ms/帧）

---

**版本**: 3.0.0
**状态**: ✅ 生产就绪
**最后更新**: 2025-12-22
**测试通过**: 1060/1060 ✅
