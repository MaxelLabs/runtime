/**
 * System 框架
 * 提供 System 调度和执行机制
 *
 * @remarks
 * **设计目标**:
 * - 分阶段执行（PreUpdate, Update, PostUpdate, Render）
 * - 支持 System 依赖和排序
 * - 支持条件执行
 * - 支持并行执行（未来）
 *
 * @example
 * ```typescript
 * // 定义 System
 * const movementSystem: System = {
 *   name: 'Movement',
 *   stage: SystemStage.Update,
 *   query: { all: [Position, Velocity] },
 *   execute(world, query) {
 *     query.forEach((entity, [pos, vel]) => {
 *       pos.x += vel.x * world.deltaTime;
 *       pos.y += vel.y * world.deltaTime;
 *     });
 *   }
 * };
 *
 * // 注册 System
 * scheduler.addSystem(movementSystem);
 *
 * // 每帧执行
 * scheduler.update(deltaTime);
 * ```
 */

import type { World } from './world';
import type { Query, QueryFilter } from './query';
import type { EntityId } from './entity-id';
import { DAGScheduler } from './dag-scheduler';

// ============ System 阶段 ============

/**
 * System 执行阶段
 */
export enum SystemStage {
  /** 帧开始（处理输入、事件） */
  FrameStart = 0,
  /** 预更新（物理准备） */
  PreUpdate = 1,
  /** 主更新（游戏逻辑） */
  Update = 2,
  /** 后更新（Transform 计算） */
  PostUpdate = 3,
  /** 渲染准备（剔除、排序） */
  PreRender = 4,
  /** 渲染 */
  Render = 5,
  /** 帧结束（清理） */
  FrameEnd = 6,
}

// ============ System 定义 ============

/**
 * System 上下文
 */
export interface SystemContext {
  /** World 实例 */
  world: World;
  /** 帧时间增量（秒） */
  deltaTime: number;
  /** 总运行时间（秒） */
  totalTime: number;
  /** 帧计数 */
  frameCount: number;
  /** 资源访问 */
  getResource<T>(type: new () => T): T | undefined;
}

/**
 * System 执行函数
 */
export type SystemExecuteFn = (ctx: SystemContext, query?: Query) => void;

/**
 * System 定义
 */
export interface SystemDef {
  /** System 名称（用于调试） */
  name: string;
  /** 执行阶段 */
  stage: SystemStage;
  /** 查询过滤器（可选） */
  query?: QueryFilter;
  /** 执行函数 */
  execute: SystemExecuteFn;
  /** 是否启用 */
  enabled?: boolean;
  /** 执行优先级（同阶段内，数字越小越先执行） */
  priority?: number;
  /** 依赖的 System 名称 */
  after?: string[];
  /** 条件执行 */
  runIf?: (ctx: SystemContext) => boolean;
}

/**
 * 已注册的 System
 */
interface RegisteredSystem {
  def: SystemDef;
  query?: Query;
  enabled: boolean;
}

/**
 * 并行批次类型别名
 * 每个批次包含可并行执行的 System 列表
 */
type ParallelBatchMap = Map<SystemStage, Array<RegisteredSystem[]>>;

/**
 * System 执行错误信息
 */
export interface SystemExecutionError {
  /** System 名称 */
  systemName: string;
  /** 执行阶段 */
  stage: SystemStage;
  /** 错误对象 */
  error: unknown;
  /** 发生时间戳 */
  timestamp: number;
}

/**
 * System 错误回调函数
 */
export type SystemErrorCallback = (error: SystemExecutionError) => void;

// ============ System 调度器 ============

/**
 * System 调度器
 */
export class SystemScheduler {
  private world: World;
  private systems: Map<string, RegisteredSystem> = new Map();
  private stageOrder: Map<SystemStage, RegisteredSystem[]> = new Map();
  private needsSort: boolean = false;

  // 运行时状态
  private deltaTime: number = 0;
  private totalTime: number = 0;
  private frameCount: number = 0;

  // 并行执行相关
  private enableParallelExecution: boolean = false;
  private parallelBatches: ParallelBatchMap = new Map();

  // 错误处理
  private errorCallback?: SystemErrorCallback;

  // 缓存的内部查询（避免每帧创建新 Query）
  private cachedQueries: Map<string, Query> = new Map();

  constructor(world: World) {
    this.world = world;

    // 初始化阶段列表
    for (const stage of Object.values(SystemStage)) {
      if (typeof stage === 'number') {
        this.stageOrder.set(stage, []);
      }
    }
  }

  /**
   * 获取或创建缓存的查询
   * @param key 查询的唯一标识
   * @param filter 查询过滤器
   * @returns Query 实例
   * @remarks
   * 用于内置 System 避免每帧创建新 Query
   */
  getOrCreateCachedQuery(key: string, filter: QueryFilter): Query {
    let query = this.cachedQueries.get(key);
    if (!query) {
      query = this.world.query(filter);
      this.cachedQueries.set(key, query);
    }
    return query;
  }

  /**
   * 添加 System
   */
  addSystem(def: SystemDef): this {
    if (this.systems.has(def.name)) {
      console.warn(`System "${def.name}" already exists, replacing...`);
      this.removeSystem(def.name);
    }

    // 创建查询（如果有）
    let query: Query | undefined;
    if (def.query) {
      query = this.world.query(def.query);
    }

    const registered: RegisteredSystem = {
      def,
      query,
      enabled: def.enabled ?? true,
    };

    this.systems.set(def.name, registered);
    this.stageOrder.get(def.stage)!.push(registered);
    this.needsSort = true;

    return this;
  }

  /**
   * 批量添加 System
   */
  addSystems(...defs: SystemDef[]): this {
    for (const def of defs) {
      this.addSystem(def);
    }
    return this;
  }

  /**
   * 移除 System
   * @remarks
   * 同时清理关联的 Query 以避免内存泄漏
   */
  removeSystem(name: string): boolean {
    const system = this.systems.get(name);
    if (!system) {
      return false;
    }

    // 清理关联的 Query
    if (system.query) {
      this.world.removeQuery(system.query);
    }

    this.systems.delete(name);

    const stageList = this.stageOrder.get(system.def.stage)!;
    const index = stageList.indexOf(system);
    if (index !== -1) {
      stageList.splice(index, 1);
    }

    return true;
  }

  /**
   * 启用/禁用 System
   */
  setSystemEnabled(name: string, enabled: boolean): boolean {
    const system = this.systems.get(name);
    if (!system) {
      return false;
    }
    system.enabled = enabled;
    return true;
  }

  /**
   * 检查 System 是否启用
   */
  isSystemEnabled(name: string): boolean {
    return this.systems.get(name)?.enabled ?? false;
  }

  /**
   * 执行一帧
   */
  update(deltaTime: number): void {
    this.deltaTime = deltaTime;
    this.totalTime += deltaTime;
    this.frameCount++;

    // 排序（如果需要）
    if (this.needsSort) {
      this.sortSystems();
      this.needsSort = false;
    }

    // 创建上下文
    const ctx: SystemContext = {
      world: this.world,
      deltaTime: this.deltaTime,
      totalTime: this.totalTime,
      frameCount: this.frameCount,
      getResource: <T>(type: new () => T) => this.world.getResource(type),
    };

    // 按阶段执行
    for (const stage of [
      SystemStage.FrameStart,
      SystemStage.PreUpdate,
      SystemStage.Update,
      SystemStage.PostUpdate,
      SystemStage.PreRender,
      SystemStage.Render,
      SystemStage.FrameEnd,
    ]) {
      this.executeStage(stage, ctx);
    }
  }

  /**
   * 执行指定阶段
   * @remarks
   * 当启用并行执行时，会使用预先分析的并行批次来执行 System。
   * 同一批次内的 System 可以并行执行（无依赖冲突），
   * 不同批次之间必须串行执行（有依赖关系）。
   */
  private executeStage(stage: SystemStage, ctx: SystemContext): void {
    // 如果启用并行执行，优先使用并行批次执行
    if (this.enableParallelExecution) {
      const batches = this.parallelBatches.get(stage);
      if (batches && batches.length > 0) {
        this.executeStageParallel(stage, ctx, batches);
        return;
      }
      // 如果没有并行批次信息（可能是没有 after 依赖的阶段），
      // 所有 System 可以视为一个批次并行执行
      const systems = this.stageOrder.get(stage)!;
      if (systems.length > 0) {
        this.executeStageParallel(stage, ctx, [systems]);
        return;
      }
    }

    // 串行执行
    const systems = this.stageOrder.get(stage)!;
    this.executeSystems(systems, ctx, stage);
  }

  /**
   * 并行执行阶段（按批次）
   * @remarks
   * 同一批次内的 System 可以并行执行（无依赖冲突）
   * 不同批次之间必须串行执行（有依赖关系）
   */
  private executeStageParallel(stage: SystemStage, ctx: SystemContext, batches: Array<RegisteredSystem[]>): void {
    for (const batch of batches) {
      // 目前使用 Promise.all 模拟并行执行
      // 未来可以使用 Web Workers 或其他并行机制
      // 注意：JavaScript 是单线程的，这里的"并行"主要用于：
      // 1. 异步 System 的并发执行
      // 2. 为未来的 Web Worker 支持做准备
      // 3. 明确表达 System 之间的依赖关系
      this.executeSystems(batch, ctx, stage);
    }
  }

  /**
   * 执行一组 System
   */
  private executeSystems(systems: RegisteredSystem[], ctx: SystemContext, stage: SystemStage): void {
    for (const system of systems) {
      if (!system.enabled) {
        continue;
      }

      // 条件检查
      if (system.def.runIf && !system.def.runIf(ctx)) {
        continue;
      }

      // 执行
      try {
        system.def.execute(ctx, system.query);
      } catch (error) {
        const errorInfo: SystemExecutionError = {
          systemName: system.def.name,
          stage,
          error,
          timestamp: Date.now(),
        };

        // 调用错误回调（如果设置）
        if (this.errorCallback) {
          this.errorCallback(errorInfo);
        }

        // 始终输出到控制台
        logError(`Error in system "${system.def.name}":`);
      }
    }
  }

  /**
   * 排序 System
   * @remarks
   * 1. 按 priority 排序（数字越小越先执行）
   * 2. 使用 DAG 拓扑排序处理 after 依赖
   * 3. 检测并报告循环依赖
   * 4. 分析并行执行批次（如果启用）
   */
  private sortSystems(): void {
    for (const [stage, systems] of this.stageOrder) {
      if (systems.length === 0) {
        continue;
      }

      // 第一步：按 priority 排序
      systems.sort((a, b) => {
        const priorityA = a.def.priority ?? 0;
        const priorityB = b.def.priority ?? 0;
        return priorityA - priorityB;
      });

      // 第二步：处理 after 依赖（DAG 拓扑排序）
      const hasAfterDeps = systems.some((s) => s.def.after && s.def.after.length > 0);
      if (!hasAfterDeps) {
        // 没有 after 依赖，跳过 DAG 排序
        if (this.enableParallelExecution) {
          // 所有 System 可并行执行
          this.parallelBatches.set(stage, [systems]);
        }
        continue;
      }

      // 创建 DAG 调度器
      const dag = new DAGScheduler<RegisteredSystem>();

      // 添加所有节点
      for (const system of systems) {
        dag.addNode(system.def.name, system);
      }

      // 添加依赖关系
      for (const system of systems) {
        if (system.def.after) {
          for (const afterName of system.def.after) {
            // system 依赖 afterName，即 afterName 必须在 system 之前执行
            const success = dag.addDependency(system.def.name, afterName);
            if (!success) {
              console.warn(
                `SystemScheduler: System "${system.def.name}" depends on "${afterName}", but "${afterName}" does not exist in stage ${SystemStage[stage]}`
              );
            }
          }
        }
      }

      // 拓扑排序
      const result = dag.topologicalSort();
      if (!result.success) {
        console.error(`SystemScheduler: ${result.error}`);
        console.error(`  Stage: ${SystemStage[stage]}`);
        console.error(`  Affected systems: ${systems.map((s) => s.def.name).join(', ')}`);
        // 循环依赖时保持原顺序
        continue;
      }

      // 应用排序结果
      this.stageOrder.set(
        stage,
        result.sorted.map((node) => node.data)
      );

      // 第三步：分析并行执行批次（如果启用）
      if (this.enableParallelExecution) {
        const batches = dag.analyzeParallelBatches();
        this.parallelBatches.set(
          stage,
          batches.map((batch) => batch.nodes.map((node) => node.data))
        );
      }
    }
  }

  /**
   * 获取 System 列表
   */
  getSystems(): SystemDef[] {
    return Array.from(this.systems.values()).map((s) => s.def);
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalSystems: number;
    enabledSystems: number;
    stageBreakdown: Record<string, number>;
    frameCount: number;
    totalTime: number;
    parallelExecutionEnabled: boolean;
    parallelBatchCount?: Record<string, number>;
  } {
    const stageBreakdown: Record<string, number> = {};
    const parallelBatchCount: Record<string, number> = {};

    for (const [stage, systems] of this.stageOrder) {
      stageBreakdown[SystemStage[stage]] = systems.filter((s) => s.enabled).length;

      if (this.enableParallelExecution) {
        const batches = this.parallelBatches.get(stage);
        parallelBatchCount[SystemStage[stage]] = batches?.length ?? 0;
      }
    }

    return {
      totalSystems: this.systems.size,
      enabledSystems: Array.from(this.systems.values()).filter((s) => s.enabled).length,
      stageBreakdown,
      frameCount: this.frameCount,
      totalTime: this.totalTime,
      parallelExecutionEnabled: this.enableParallelExecution,
      ...(this.enableParallelExecution && { parallelBatchCount }),
    };
  }

  /**
   * 启用/禁用并行执行
   * @param enabled 是否启用
   * @remarks
   * 启用后，调度器会分析 System 依赖关系，将无依赖冲突的 System 分组为并行批次。
   * 注意：并行执行分析会在下一次 sortSystems() 时生效。
   */
  setParallelExecution(enabled: boolean): void {
    if (this.enableParallelExecution !== enabled) {
      this.enableParallelExecution = enabled;
      this.needsSort = true;
    }
  }

  /**
   * 获取并行执行状态
   */
  isParallelExecutionEnabled(): boolean {
    return this.enableParallelExecution;
  }

  /**
   * 设置错误回调函数
   * @param callback 错误回调函数，传入 undefined 可清除回调
   * @remarks
   * 当 System 执行出错时，除了输出到控制台，还会调用此回调。
   * 可用于：
   * - 收集错误日志
   * - 触发错误恢复机制
   * - 通知上层应用
   */
  setErrorCallback(callback: SystemErrorCallback | undefined): void {
    this.errorCallback = callback;
  }

  /**
   * 获取当前错误回调函数
   */
  getErrorCallback(): SystemErrorCallback | undefined {
    return this.errorCallback;
  }

  /**
   * 获取指定阶段的并行批次信息（用于调试）
   * @param stage 执行阶段
   * @returns 并行批次列表，每个批次包含可并行执行的 System 名称
   */
  getParallelBatches(stage: SystemStage): string[][] | undefined {
    if (!this.enableParallelExecution) {
      return undefined;
    }

    const batches = this.parallelBatches.get(stage);
    if (!batches) {
      return undefined;
    }

    return batches.map((batch) => batch.map((system) => system.def.name));
  }
}

// ============ 内置 System ============

import { Position, Rotation, Scale, Parent, Children, LocalMatrix, WorldMatrix } from './entity-builder';
import { logError } from '../utils';

/**
 * 创建 Transform System
 * @param scheduler System 调度器（用于缓存查询）
 * @returns TransformSystem 定义
 * @remarks
 * 使用工厂函数而不是常量，以便访问调度器的缓存查询功能
 */
export function createTransformSystem(scheduler: SystemScheduler): SystemDef {
  return {
    name: 'Transform',
    stage: SystemStage.PostUpdate,
    priority: 0,
    query: { all: [Position] },
    execute(ctx, query) {
      if (!query) {
        return;
      }

      // 第一遍：更新本地矩阵
      query.forEach((entity, [pos]) => {
        const rot = ctx.world.getComponent(entity, Rotation);
        const scale = ctx.world.getComponent(entity, Scale);
        let localMatrix = ctx.world.getComponent(entity, LocalMatrix);

        if (!localMatrix) {
          ctx.world.addComponent(entity, LocalMatrix, new LocalMatrix());
          localMatrix = ctx.world.getComponent(entity, LocalMatrix)!;
        }

        // 计算本地矩阵
        composeMatrix(
          localMatrix.data,
          pos.x,
          pos.y,
          pos.z,
          rot?.x ?? 0,
          rot?.y ?? 0,
          rot?.z ?? 0,
          rot?.w ?? 1,
          scale?.x ?? 1,
          scale?.y ?? 1,
          scale?.z ?? 1
        );

        localMatrix.dirty = false;
      });

      // 第二遍：更新世界矩阵（从根节点开始）
      // 使用缓存的查询避免每帧创建新 Query
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

/**
 * 递归更新世界矩阵
 */
function updateWorldMatrixRecursive(world: World, entity: EntityId, parentWorldMatrix: Float32Array | null): void {
  const localMatrix = world.getComponent(entity, LocalMatrix);
  if (!localMatrix) {
    return;
  }

  let worldMatrix = world.getComponent(entity, WorldMatrix);
  if (!worldMatrix) {
    world.addComponent(entity, WorldMatrix, new WorldMatrix());
    worldMatrix = world.getComponent(entity, WorldMatrix)!;
  }

  if (parentWorldMatrix) {
    // 世界矩阵 = 父级世界矩阵 * 本地矩阵
    multiplyMatrices(parentWorldMatrix, localMatrix.data, worldMatrix.data);
  } else {
    // 无父级，世界矩阵 = 本地矩阵
    worldMatrix.data.set(localMatrix.data);
  }

  worldMatrix.dirty = false;

  // 递归处理子节点
  const children = world.getComponent(entity, Children);
  if (children) {
    for (const child of children.entities) {
      updateWorldMatrixRecursive(world, child, worldMatrix.data);
    }
  }
}

/**
 * 从 TRS 组合矩阵
 */
function composeMatrix(
  out: Float32Array,
  tx: number,
  ty: number,
  tz: number,
  qx: number,
  qy: number,
  qz: number,
  qw: number,
  sx: number,
  sy: number,
  sz: number
): void {
  const x2 = qx + qx;
  const y2 = qy + qy;
  const z2 = qz + qz;
  const xx = qx * x2;
  const xy = qx * y2;
  const xz = qx * z2;
  const yy = qy * y2;
  const yz = qy * z2;
  const zz = qz * z2;
  const wx = qw * x2;
  const wy = qw * y2;
  const wz = qw * z2;

  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;

  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;

  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;

  out[12] = tx;
  out[13] = ty;
  out[14] = tz;
  out[15] = 1;
}

/**
 * 矩阵乘法
 */
function multiplyMatrices(a: Float32Array, b: Float32Array, out: Float32Array): void {
  const a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  const a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  const a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  const a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];

  const b00 = b[0],
    b01 = b[1],
    b02 = b[2],
    b03 = b[3];
  const b10 = b[4],
    b11 = b[5],
    b12 = b[6],
    b13 = b[7];
  const b20 = b[8],
    b21 = b[9],
    b22 = b[10],
    b23 = b[11];
  const b30 = b[12],
    b31 = b[13],
    b32 = b[14],
    b33 = b[15];

  out[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
  out[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
  out[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
  out[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;

  out[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
  out[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
  out[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
  out[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;

  out[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
  out[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
  out[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
  out[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;

  out[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
  out[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
  out[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
  out[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
}

/**
 * Hierarchy System
 * 处理父子关系变更
 */
export const HierarchySystem: SystemDef = {
  name: 'Hierarchy',
  stage: SystemStage.PostUpdate,
  priority: -10, // 在 Transform 之前执行
  execute(ctx) {
    // 这里可以处理层级变更事件
    // 目前层级关系在 EntityBuilder 中直接处理
  },
};

/**
 * Cleanup System
 * 清理已销毁的实体
 */
export const CleanupSystem: SystemDef = {
  name: 'Cleanup',
  stage: SystemStage.FrameEnd,
  priority: 100,
  execute(ctx) {
    // 这里可以处理延迟销毁的实体
    // 目前实体销毁是立即执行的
  },
};
