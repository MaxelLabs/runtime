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
import { DAGScheduler } from './dag-scheduler';
import { logError } from '../utils';

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
 * 错误处理策略
 */
export enum ErrorHandlingStrategy {
  /** 抛出错误，中断执行 */
  Throw = 'throw',
  /** 继续执行其他 System（默认行为，提供错误隔离） */
  Continue = 'continue',
  /** 禁用出错的 System 并继续执行 */
  DisableAndContinue = 'disable-and-continue',
}

/**
 * System 错误回调函数
 * @returns 返回 true 表示错误已处理，不需要进一步处理；返回 false 或 undefined 表示使用默认策略
 */
export type SystemErrorCallback = (error: SystemExecutionError) => boolean | void;

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
  private errorHandlingStrategy: ErrorHandlingStrategy = ErrorHandlingStrategy.Continue;

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
   * 同一批次内的 System 理论上可以并行执行（无依赖冲突）
   * 不同批次之间必须串行执行（有依赖关系）
   *
   * **当前实现限制**:
   * JavaScript 是单线程的，当前实现仍然是串行执行。
   * 启用并行执行模式的主要价值在于：
   * 1. 明确表达 System 之间的依赖关系
   * 2. 为未来的 Web Worker 支持做准备
   * 3. 提供并行批次分析信息用于调试和优化
   *
   * **未来计划**:
   * - 使用 Web Workers 实现 CPU 密集型 System 的真正并行
   * - 支持异步 System 的并发执行（如果 System 返回 Promise）
   */
  private executeStageParallel(stage: SystemStage, ctx: SystemContext, batches: Array<RegisteredSystem[]>): void {
    // 注意：由于 JavaScript 单线程限制，当前实现仍然是串行执行
    // 批次信息主要用于依赖分析和未来的 Web Worker 支持
    for (const batch of batches) {
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
        this.handleSystemError(system, stage, error);
      }
    }
  }

  /**
   * 处理 System 执行错误
   * @param system 出错的 System
   * @param stage 执行阶段
   * @param error 错误对象
   */
  private handleSystemError(system: RegisteredSystem, stage: SystemStage, error: unknown): void {
    const errorInfo: SystemExecutionError = {
      systemName: system.def.name,
      stage,
      error,
      timestamp: Date.now(),
    };

    // 调用错误回调（如果设置）
    let handled = false;
    if (this.errorCallback) {
      const result = this.errorCallback(errorInfo);
      handled = result === true;
    }

    // 如果回调已处理错误，直接返回
    if (handled) {
      return;
    }

    // 根据错误处理策略决定行为
    switch (this.errorHandlingStrategy) {
      case ErrorHandlingStrategy.Continue:
        // 记录错误但继续执行
        console.error(`[SystemScheduler] Error in system "${system.def.name}":`, error);
        break;

      case ErrorHandlingStrategy.DisableAndContinue:
        // 禁用出错的 System 并继续执行
        console.error(`[SystemScheduler] Error in system "${system.def.name}", disabling system:`, error);
        system.enabled = false;
        break;

      case ErrorHandlingStrategy.Throw:
      default:
        // 记录错误到全局错误收集系统
        logError(
          `Error in system "${system.def.name}":`,
          'SystemScheduler',
          error instanceof Error ? error : undefined
        );
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
   *
   * **当前实现限制**:
   * - JavaScript 是单线程的，当前实现仍然是串行执行
   * - 并行批次分析主要用于：
   *   1. 明确表达 System 之间的依赖关系
   *   2. 为未来的 Web Worker 支持做准备
   *   3. 支持异步 System 的并发执行（如果 System 返回 Promise）
   *
   * **未来计划**:
   * - 使用 Web Workers 实现真正的并行执行
   * - 使用 Promise.all 实现异步 System 的并发执行
   *
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
   * 当 System 执行出错时，会先调用此回调。
   * 回调可以返回 `true` 表示错误已处理，不需要进一步处理。
   * 如果返回 `false` 或 `undefined`，则根据 `errorHandlingStrategy` 决定行为。
   *
   * 可用于：
   * - 收集错误日志
   * - 触发错误恢复机制
   * - 通知上层应用
   * - 自定义错误处理逻辑
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
   * 设置错误处理策略
   * @param strategy 错误处理策略
   * @remarks
   * - `Continue`: 记录错误但继续执行其他 System（默认行为，提供错误隔离）
   * - `Throw`: 抛出错误，中断当前帧的执行
   * - `DisableAndContinue`: 禁用出错的 System 并继续执行
   *
   * 默认使用 `Continue` 策略，确保单个 System 的错误不会影响其他 System 的执行。
   * 如果需要严格的错误处理（如开发环境），可以切换到 `Throw` 策略。
   *
   * 注意：如果设置了错误回调且回调返回 `true`，则不会应用此策略。
   */
  setErrorHandlingStrategy(strategy: ErrorHandlingStrategy): void {
    this.errorHandlingStrategy = strategy;
  }

  /**
   * 获取当前错误处理策略
   */
  getErrorHandlingStrategy(): ErrorHandlingStrategy {
    return this.errorHandlingStrategy;
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
