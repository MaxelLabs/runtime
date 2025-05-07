import { ObjectPool } from './ObjectPool';
import { Time } from './Time';
import { EventDispatcher } from './eventDispatcher';

/**
 * 对象池管理器事件类型
 */
export enum ObjectPoolManagerEventType {
  /** 对象池创建事件 */
  POOL_CREATED = 'pool-created',
  /** 对象池析构事件 */
  POOL_DESTROYED = 'pool-destroyed',
  /** 性能分析事件 */
  PERFORMANCE_ANALYSIS = 'performance-analysis'
}

/**
 * 对象池性能统计
 */
export interface ObjectPoolStats {
  /** 对象池ID */
  poolId: string,
  /** 池中可用对象数量 */
  available: number,
  /** 当前使用中对象数量 */
  inUse: number,
  /** 池中总对象数量 */
  total: number,
  /** 对象重用率 */
  efficiency: number,
  /** 总获取对象次数 */
  totalGets?: number,
  /** 总创建对象次数 */
  totalCreated?: number,
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

  /** 自动分析间隔 */
  private analysisInterval: number = 10000;

  /** 上次分析时间 */
  private lastAnalysisTime: number = 0;

  /**
   * 私有构造函数，使用单例模式
   */
  private constructor () {
    super();
  }

  /**
   * 获取单例实例
   */
  public static getInstance (): ObjectPoolManager {
    if (!ObjectPoolManager.instance) {
      ObjectPoolManager.instance = new ObjectPoolManager();
    }

    return ObjectPoolManager.instance;
  }

  /**
   * 注册对象池
   * @param id 对象池ID
   * @param pool 对象池实例
   */
  registerPool<T>(id: string, pool: ObjectPool<T>): void {
    if (this.pools.has(id)) {
      console.warn(`[ObjectPoolManager] 对象池ID '${id}' 已存在，将被覆盖`);
    }

    this.pools.set(id, pool);
    this.dispatchEvent(ObjectPoolManagerEventType.POOL_CREATED, { poolId: id, pool });
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
    options: {
      initialCapacity?: number,
      maxSize?: number,
      logStats?: boolean,
    } = {}
  ): ObjectPool<T> {
    // 确保带有命名空间的ID
    const fullId = id.includes(':') ? id : `default:${id}`;

    // 创建对象池
    const pool = new ObjectPool<T>(
      factory,
      resetFunc,
      {
        identifier: fullId,
        initialCapacity: options.initialCapacity,
        maxSize: options.maxSize,
        logStats: options.logStats,
      }
    );

    // 注册对象池
    this.registerPool(fullId, pool);

    return pool;
  }

  /**
   * 获取对象池
   * @param id 对象池ID
   * @returns 对象池实例，不存在则返回null
   */
  getPool<T>(id: string): ObjectPool<T> | null {
    const fullId = id.includes(':') ? id : `default:${id}`;

    return this.pools.get(fullId) as ObjectPool<T> || null;
  }

  /**
   * 销毁对象池
   * @param id 对象池ID
   */
  destroyPool (id: string): void {
    const fullId = id.includes(':') ? id : `default:${id}`;

    if (this.pools.has(fullId)) {
      const pool = this.pools.get(fullId) as ObjectPool<any>;

      pool.clear();
      this.pools.delete(fullId);

      this.dispatchEvent(ObjectPoolManagerEventType.POOL_DESTROYED, { poolId: fullId });
    }
  }

  /**
   * 获取所有对象池统计信息
   * @param detailed 是否包含详细统计信息
   * @returns 所有对象池的统计信息
   */
  getAllPoolStats (detailed: boolean = false): Map<string, ObjectPoolStats> {
    const stats = new Map<string, ObjectPoolStats>();

    for (const [id, pool] of this.pools.entries()) {
      const poolStatus = pool.getStatus();
      const poolStats: ObjectPoolStats = {
        poolId: id,
        available: poolStatus.available,
        inUse: poolStatus.inUse,
        total: poolStatus.total,
        efficiency: poolStatus.efficiency,
      };

      if (detailed) {
        // 详细模式包含更多信息
        poolStats.totalGets = (pool as any).totalGets;
        poolStats.totalCreated = (pool as any).totalCreated;
      }

      stats.set(id, poolStats);
    }

    return stats;
  }

  /**
   * 预热指定对象池
   * @param id 对象池ID
   * @param count 预创建数量
   */
  warmUpPool (id: string, count: number): void {
    const pool = this.getPool(id);

    if (pool) {
      pool.warmUp(count);
    }
  }

  /**
   * 预热所有对象池
   * @param count 每个池的预创建数量
   */
  warmUpAllPools (count: number): void {
    for (const pool of this.pools.values()) {
      pool.warmUp(count);
    }
  }

  /**
   * 清理所有对象池
   */
  clearAllPools (): void {
    for (const pool of this.pools.values()) {
      pool.clear();
    }
  }

  /**
   * 启用自动性能分析
   * @param enabled 是否启用
   * @param interval 分析间隔（毫秒）
   */
  enableAutoAnalysis (enabled: boolean, interval: number = 10000): void {
    this.autoAnalysis = enabled;
    this.analysisInterval = interval;
  }

  /**
   * 执行性能分析
   * @param force 是否强制执行，忽略时间间隔
   */
  analyzePerformance (force: boolean = false): void {
    const currentTime = Time.now;

    if (!force && currentTime - this.lastAnalysisTime < this.analysisInterval) {
      return;
    }

    this.lastAnalysisTime = currentTime;
    const stats = this.getAllPoolStats(true);

    // 计算汇总信息
    let totalObjects = 0;
    let totalInUse = 0;
    const totalPoolCount = stats.size;

    for (const stat of stats.values()) {
      totalObjects += stat.total;
      totalInUse += stat.inUse;
    }

    // 触发性能分析事件
    this.dispatchEvent(ObjectPoolManagerEventType.PERFORMANCE_ANALYSIS, {
      timestamp: currentTime,
      stats,
      summary: {
        poolCount: totalPoolCount,
        totalObjects,
        totalInUse,
        usage: totalInUse / (totalObjects > 0 ? totalObjects : 1),
      },
    });

    return stats;
  }

  /**
   * 更新函数，在引擎每帧调用
   */
  update (): void {
    if (this.autoAnalysis) {
      this.analyzePerformance();
    }
  }

  /**
   * 获取池中总对象数量
   * @returns 所有对象池中的对象总数
   */
  getTotalObjectCount (): number {
    let count = 0;

    for (const pool of this.pools.values()) {
      count += pool.getStatus().total;
    }

    return count;
  }

  /**
   * 获取当前使用中对象数量
   * @returns 所有对象池中正在使用的对象总数
   */
  getTotalInUseCount (): number {
    let count = 0;

    for (const pool of this.pools.values()) {
      count += pool.getStatus().inUse;
    }

    return count;
  }
}