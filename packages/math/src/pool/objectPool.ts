/**
 * 通用对象池系统
 * 提供高效的对象复用机制，减少GC压力
 */

/**
 * 对象池统计信息
 */
export interface PoolStats {
  /** 总共创建的对象数量 */
  totalCreated: number;
  /** 总共释放的对象数量 */
  totalReleased: number;
  /** 当前活跃的对象数量 */
  currentActive: number;
  /** 池中可用对象数量 */
  poolSize: number;
  /** 命中率（从池中获取的比例） */
  hitRate: number;
  /** 池的最大容量 */
  maxPoolSize: number;
}

/**
 * 可池化对象接口
 */
export interface Poolable {
  /** 重置对象状态，准备复用 */
  reset?(): void;
  /** 对象是否可以被池化 */
  isPoolable?(): boolean;
}

/**
 * 对象工厂函数类型
 */
export type ObjectFactory<T> = (...args: any[]) => T;

/**
 * 通用对象池实现
 */
export class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private maxSize: number;
  private factory: ObjectFactory<T>;
  private stats: PoolStats;

  /**
   * 构造函数
   * @param factory 对象工厂函数
   * @param maxSize 池的最大容量
   */
  constructor(factory: ObjectFactory<T>, maxSize = 100) {
    this.factory = factory;
    this.maxSize = maxSize;
    this.stats = {
      totalCreated: 0,
      totalReleased: 0,
      currentActive: 0,
      poolSize: 0,
      hitRate: 0,
      maxPoolSize: maxSize,
    };
  }

  /**
   * 从池中获取对象
   * @param args 构造参数
   * @returns 对象实例
   */
  create(...args: any[]): T {
    let obj: T;

    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
      this.stats.poolSize--;

      // 如果对象有重置方法，调用它
      if (obj.reset) {
        obj.reset();
      }
    } else {
      obj = this.factory(...args);
      this.stats.totalCreated++;
    }

    this.stats.currentActive++;
    this.updateHitRate();

    return obj;
  }

  /**
   * 释放对象到池中
   * @param obj 要释放的对象
   */
  release(obj: T): void {
    if (!obj) {
      return;
    }

    // 检查对象是否可以被池化
    if (obj.isPoolable && !obj.isPoolable()) {
      this.stats.currentActive--;
      return;
    }

    // 如果池未满，将对象放回池中
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
      this.stats.poolSize++;
      this.stats.totalReleased++;
    }

    this.stats.currentActive--;
    this.updateHitRate();
  }

  /**
   * 预分配指定数量的对象
   * @param count 预分配数量
   */
  preallocate(count: number): void {
    const allocateCount = Math.min(count, this.maxSize - this.pool.length);

    for (let i = 0; i < allocateCount; i++) {
      const obj = this.factory();
      this.pool.push(obj);
      this.stats.totalCreated++;
      this.stats.poolSize++;
    }
  }

  /**
   * 清空池
   */
  clear(): void {
    this.pool.length = 0;
    this.stats.poolSize = 0;
    this.stats.currentActive = 0;
  }

  /**
   * 获取统计信息
   */
  getStats(): Readonly<PoolStats> {
    return { ...this.stats };
  }

  /**
   * 设置池的最大容量
   * @param maxSize 最大容量
   */
  setMaxSize(maxSize: number): void {
    this.maxSize = maxSize;
    this.stats.maxPoolSize = maxSize;

    // 如果当前池大小超过新的最大容量，移除多余的对象
    while (this.pool.length > maxSize) {
      this.pool.pop();
      this.stats.poolSize--;
    }
  }

  /**
   * 获取池的最大容量
   */
  getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * 获取当前池中可用对象数量
   */
  getAvailableCount(): number {
    return this.pool.length;
  }

  /**
   * 获取当前活跃对象数量
   */
  getActiveCount(): number {
    return this.stats.currentActive;
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    const totalRequests = this.stats.totalCreated + this.stats.totalReleased;
    if (totalRequests > 0) {
      this.stats.hitRate = this.stats.totalReleased / totalRequests;
    }
  }

  /**
   * 压缩池（移除多余的对象）
   * @param targetSize 目标大小，默认为最大容量的一半
   */
  compact(targetSize?: number): void {
    const target = targetSize ?? Math.floor(this.maxSize / 2);
    while (this.pool.length > target) {
      this.pool.pop();
      this.stats.poolSize--;
    }
  }

  /**
   * 检查池的健康状态
   */
  getHealthStatus(): {
    isHealthy: boolean;
    utilization: number;
    hitRate: number;
    recommendations: string[];
  } {
    const utilization = this.stats.poolSize / this.maxSize;
    const recommendations: string[] = [];
    let isHealthy = true;

    // 检查利用率
    if (utilization < 0.1) {
      recommendations.push('池利用率过低，考虑减小池大小');
      isHealthy = false;
    } else if (utilization > 0.9) {
      recommendations.push('池利用率过高，考虑增大池大小');
    }

    // 检查命中率
    if (this.stats.hitRate < 0.5) {
      recommendations.push('命中率过低，可能需要预分配更多对象');
      isHealthy = false;
    }

    // 检查活跃对象数量
    if (this.stats.currentActive > this.maxSize * 2) {
      recommendations.push('活跃对象数量过多，可能存在内存泄漏');
      isHealthy = false;
    }

    return {
      isHealthy,
      utilization,
      hitRate: this.stats.hitRate,
      recommendations,
    };
  }
}

/**
 * 对象池管理器
 * 管理多个对象池实例
 */
export class PoolManager {
  private static pools = new Map<string, ObjectPool<any>>();

  /**
   * 注册对象池
   * @param name 池名称
   * @param pool 池实例
   */
  static registerPool<T extends Poolable>(name: string, pool: ObjectPool<T>): void {
    this.pools.set(name, pool);
  }

  /**
   * 获取对象池
   * @param name 池名称
   */
  static getPool<T extends Poolable>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name);
  }

  /**
   * 移除对象池
   * @param name 池名称
   */
  static removePool(name: string): boolean {
    return this.pools.delete(name);
  }

  /**
   * 清空所有池
   */
  static clearAllPools(): void {
    for (const pool of this.pools.values()) {
      pool.clear();
    }
  }

  /**
   * 获取所有池的统计信息
   */
  static getAllStats(): Record<string, PoolStats> {
    const stats: Record<string, PoolStats> = {};
    for (const [name, pool] of this.pools.entries()) {
      stats[name] = pool.getStats();
    }
    return stats;
  }

  /**
   * 获取所有池的健康状态
   */
  static getHealthReport(): Record<string, ReturnType<ObjectPool<any>['getHealthStatus']>> {
    const report: Record<string, ReturnType<ObjectPool<any>['getHealthStatus']>> = {};
    for (const [name, pool] of this.pools.entries()) {
      report[name] = pool.getHealthStatus();
    }
    return report;
  }

  /**
   * 压缩所有池
   */
  static compactAllPools(): void {
    for (const pool of this.pools.values()) {
      pool.compact();
    }
  }
}
