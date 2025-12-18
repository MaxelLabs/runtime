import type { CoreObjectPoolStats } from './object-pool';
import { ObjectPool } from './object-pool';
import { EventDispatcher } from './event-dispatcher';

/**
 * 对象池管理器事件类型
 */
export enum ObjectPoolManagerEventType {
  /** 对象池创建事件 */
  POOL_CREATED = 'pool-created',
  /** 对象池析构事件 */
  POOL_DESTROYED = 'pool-destroyed',
  /** 性能分析事件 */
  PERFORMANCE_ANALYSIS = 'performance-analysis',
  /** 内存警告事件 */
  MEMORY_WARNING = 'memory-warning',
  /** 错误事件 */
  ERROR = 'error',
}

/**
 * 对象池配置选项
 */
export interface ObjectPoolOptions {
  /** 初始容量 */
  initialCapacity?: number;
  /** 最大容量 */
  maxSize?: number;
  /** 是否记录统计数据 */
  logStats?: boolean;
  /** 内存警告阈值 */
  memoryWarningThreshold?: number;
}

/**
 * 对象池管理器，用于统一管理和监控引擎中的所有对象池
 */
export class ObjectPoolManager extends EventDispatcher {
  /** 单例实例 */
  private static instance: ObjectPoolManager;

  /** 所有注册的对象池 */
  private pools: Map<string, ObjectPool<any>> = new Map();

  /** 是否自动分析性能 */
  private autoAnalysis: boolean = false;

  /** 自动分析间隔（毫秒） */
  private analysisInterval: number = 10000;

  /** 上次分析时间 */
  private lastAnalysisTime: number = 0;

  /** 是否已经初始化 */
  private initialized: boolean = false;

  /** 全局配置选项 */
  private globalOptions: ObjectPoolOptions = {
    initialCapacity: 0,
    maxSize: 1000,
    logStats: false,
    memoryWarningThreshold: 10000,
  };

  /**
   * 私有构造函数，使用单例模式
   */
  private constructor() {
    super();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ObjectPoolManager {
    if (!ObjectPoolManager.instance) {
      ObjectPoolManager.instance = new ObjectPoolManager();
    }

    return ObjectPoolManager.instance;
  }

  /**
   * 初始化对象池管理器
   * @param options 全局配置选项
   */
  public initialize(options?: Partial<ObjectPoolOptions>): void {
    if (this.initialized) {
      console.warn('[ObjectPoolManager] 管理器已初始化，忽略重复调用');

      return;
    }

    if (options) {
      this.globalOptions = { ...this.globalOptions, ...options };
    }

    this.initialized = true;
  }

  /**
   * 注册对象池
   * @param id 对象池ID
   * @param pool 对象池实例
   */
  registerPool<T>(id: string, pool: ObjectPool<T>): void {
    try {
      if (this.pools.has(id)) {
        console.warn(`[ObjectPoolManager] 对象池ID '${id}' 已存在，将被覆盖`);
        // 销毁旧池以避免内存泄漏
        const oldPool = this.pools.get(id);

        if (oldPool) {
          oldPool.destroy();
        }
      }

      this.pools.set(id, pool);
      this.dispatchEvent(ObjectPoolManagerEventType.POOL_CREATED, { poolId: id, pool });
    } catch (error) {
      this.dispatchEvent(ObjectPoolManagerEventType.ERROR, {
        message: `注册对象池 '${id}' 失败`,
        error,
      });
      console.error(`[ObjectPoolManager] 注册对象池 '${id}' 失败:`, error);
    }
  }

  /**
   * 创建并注册新对象池
   * @param id 对象池ID
   * @param factory 工厂函数
   * @param resetFunc 重置函数
   * @param options 对象池选项
   * @returns 创建的对象池
   */
  createPool<T>(
    id: string,
    factory: () => T,
    resetFunc: (obj: T) => void,
    options: ObjectPoolOptions = {}
  ): ObjectPool<T> {
    try {
      // 确保带有命名空间的ID
      const fullId = id.includes(':') ? id : `default:${id}`;

      // 合并全局选项和特定选项
      const poolOptions = {
        initialCapacity: options.initialCapacity ?? this.globalOptions.initialCapacity,
        maxSize: options.maxSize ?? this.globalOptions.maxSize,
      };

      // 创建对象池
      const pool = new ObjectPool<T>(id, factory, resetFunc, poolOptions.initialCapacity, poolOptions.maxSize);

      // 注册对象池
      this.registerPool(fullId, pool);

      return pool;
    } catch (error) {
      this.dispatchEvent(ObjectPoolManagerEventType.ERROR, {
        message: `创建对象池 '${id}' 失败`,
        error,
      });
      console.error(`[ObjectPoolManager] 创建对象池 '${id}' 失败:`, error);
      throw error; // 重新抛出错误，使调用者能够捕获
    }
  }

  /**
   * 获取对象池
   * @param id 对象池ID
   * @returns 对象池实例，不存在则返回null
   */
  getPool<T>(id: string): ObjectPool<T> | null {
    const fullId = id.includes(':') ? id : `default:${id}`;

    return (this.pools.get(fullId) as ObjectPool<T>) || null;
  }

  /**
   * 销毁对象池
   * @param id 对象池ID
   * @returns 是否成功销毁
   */
  destroyPool(id: string): boolean {
    try {
      const fullId = id.includes(':') ? id : `default:${id}`;

      if (this.pools.has(fullId)) {
        const pool = this.pools.get(fullId) as ObjectPool<any>;

        // 完全销毁对象池，而不是清空
        pool.destroy();
        this.pools.delete(fullId);

        this.dispatchEvent(ObjectPoolManagerEventType.POOL_DESTROYED, { poolId: fullId });

        return true;
      }

      return false;
    } catch (error) {
      this.dispatchEvent(ObjectPoolManagerEventType.ERROR, {
        message: `销毁对象池 '${id}' 失败`,
        error,
      });
      console.error(`[ObjectPoolManager] 销毁对象池 '${id}' 失败:`, error);

      return false;
    }
  }

  /**
   * 获取所有对象池的状态
   * @param detailed 是否包含详细统计信息
   * @returns 对象池状态映射
   */
  getAllPoolStats(detailed: boolean = false): Map<string, CoreObjectPoolStats> {
    const stats = new Map<string, CoreObjectPoolStats>();

    for (const [id, pool] of this.pools.entries()) {
      const poolStats = pool.getStatus();

      // 如果不需要详细信息，删除非必要字段
      if (!detailed) {
        delete poolStats.totalGets;
        delete poolStats.totalCreated;
        delete poolStats.totalReleased;
      }

      stats.set(id, poolStats);
    }

    return stats;
  }

  /**
   * 更新对象池配置
   * @param id 对象池ID
   * @param options 新配置选项
   * @returns 是否成功更新
   */
  updatePoolConfig(id: string, options: Partial<ObjectPoolOptions>): boolean {
    try {
      const fullId = id.includes(':') ? id : `default:${id}`;
      const pool = this.getPool(fullId);

      if (!pool) {
        console.warn(`[ObjectPoolManager] 找不到对象池 '${fullId}'`);

        return false;
      }

      // 更新最大容量
      if (options.maxSize !== undefined) {
        pool.setMaxSize(options.maxSize);
      }

      // 预热至初始容量
      if (options.initialCapacity !== undefined) {
        const currentSize = pool.getSize();

        if (currentSize < options.initialCapacity) {
          pool.preAllocate(options.initialCapacity - currentSize);
        }
      }

      return true;
    } catch (error) {
      console.error(`[ObjectPoolManager] 更新对象池 '${id}' 配置失败:`, error);

      return false;
    }
  }

  /**
   * 预热对象池
   * @param id 对象池ID
   * @param count 预热数量
   * @returns 是否成功预热
   */
  warmUpPool(id: string, count: number): boolean {
    try {
      const fullId = id.includes(':') ? id : `default:${id}`;
      const pool = this.getPool(fullId);

      if (!pool) {
        console.warn(`[ObjectPoolManager] 找不到对象池 '${fullId}'`);

        return false;
      }

      const result = pool.warmUp(count);

      return result.success;
    } catch (error) {
      this.dispatchEvent(ObjectPoolManagerEventType.ERROR, {
        message: `预热对象池 '${id}' 失败`,
        error,
      });
      console.error(`[ObjectPoolManager] 预热对象池 '${id}' 失败:`, error);

      return false;
    }
  }

  /**
   * 预热所有对象池
   * @param count 每个池的预热数量
   * @returns 预热结果映射
   */
  warmUpAllPools(count: number): Map<string, boolean> {
    const results = new Map<string, boolean>();

    for (const [id] of this.pools) {
      const success = this.warmUpPool(id, count);

      results.set(id, success);
    }

    return results;
  }

  /**
   * 清空所有对象池
   */
  clearAllPools(): void {
    try {
      for (const [, pool] of this.pools) {
        pool.clear();
      }
    } catch (error) {
      this.dispatchEvent(ObjectPoolManagerEventType.ERROR, {
        message: '清空所有对象池失败',
        error,
      });
      console.error('[ObjectPoolManager] 清空所有对象池失败:', error);
    }
  }

  /**
   * 销毁所有对象池
   */
  destroyAllPools(): void {
    try {
      const poolIds = Array.from(this.pools.keys());

      for (const id of poolIds) {
        this.destroyPool(id);
      }
    } catch (error) {
      this.dispatchEvent(ObjectPoolManagerEventType.ERROR, {
        message: '销毁所有对象池失败',
        error,
      });
      console.error('[ObjectPoolManager] 销毁所有对象池失败:', error);
    }
  }

  /**
   * 启用或禁用自动性能分析
   * @param enabled 是否启用
   * @param interval 分析间隔(毫秒)
   */
  enableAutoAnalysis(enabled: boolean, interval: number = 10000): void {
    this.autoAnalysis = enabled;
    this.analysisInterval = Math.max(1000, interval);
    this.lastAnalysisTime = Date.now();
  }

  /**
   * 分析对象池性能
   * @param force 是否强制分析，忽略时间间隔
   * @returns 对象池状态映射，如果未到分析时间则返回null
   */
  analyzePerformance(force: boolean = false): Map<string, CoreObjectPoolStats> | null {
    const now = Date.now();
    const elapsed = now - this.lastAnalysisTime;

    // 如果未启用自动分析且未强制，返回null
    if (!this.autoAnalysis && !force) {
      return null;
    }

    // 如果未到分析间隔且未强制，返回null
    if (elapsed < this.analysisInterval && !force) {
      return null;
    }

    this.lastAnalysisTime = now;

    // 收集状态
    const stats = this.getAllPoolStats(true);
    let totalObjects = 0;
    let totalActive = 0;
    let hasWarning = false;

    // 计算总数并检查内存警告阈值
    for (const [, poolStats] of stats) {
      totalObjects += poolStats.total;
      totalActive += poolStats.inUse;

      // 检查是否超出警告阈值
      if (poolStats.total > this.globalOptions.memoryWarningThreshold!) {
        hasWarning = true;
      }
    }

    // 发出内存警告事件
    if (hasWarning) {
      this.dispatchEvent(ObjectPoolManagerEventType.MEMORY_WARNING, {
        totalObjects,
        totalActive,
        warning: `对象池总对象数量 ${totalObjects} 超过警告阈值`,
        pools: stats,
      });
    }

    // 发出性能分析事件
    this.dispatchEvent(ObjectPoolManagerEventType.PERFORMANCE_ANALYSIS, {
      totalObjects,
      totalActive,
      pools: stats,
      timestamp: now,
    });

    return stats;
  }

  /**
   * 更新对象池管理器，通常在每帧调用
   */
  update(): void {
    if (this.autoAnalysis) {
      this.analyzePerformance();
    }
  }

  /**
   * 获取所有对象池的总对象数量
   * @returns 总对象数量
   */
  getTotalObjectCount(): number {
    let total = 0;

    for (const [, pool] of this.pools) {
      const status = pool.getStatus();

      total += status.total;
    }

    return total;
  }

  /**
   * 获取所有对象池的使用中对象数量
   * @returns 使用中对象数量
   */
  getTotalInUseCount(): number {
    let total = 0;

    for (const [, pool] of this.pools) {
      const status = pool.getStatus();

      total += status.inUse;
    }

    return total;
  }

  /**
   * 销毁单例实例
   */
  public static destroyInstance(): void {
    if (ObjectPoolManager.instance) {
      ObjectPoolManager.instance.destroyAllPools();
      ObjectPoolManager.instance.destroy();
      ObjectPoolManager.instance = null as any;
    }
  }
}
