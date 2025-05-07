/**
 * 通用对象池，用于管理频繁创建和销毁的对象，减少垃圾回收压力
 */
export class ObjectPool<T> {
  /** 可用对象数组 */
  private available: T[] = [];

  /** 使用中的对象集合 */
  private inUse: Set<T> = new Set();

  /** 对象创建工厂函数 */
  private factory: () => T;

  /** 对象重置函数 */
  private resetFunc: (obj: T) => void;

  /** 对象池标识符 */
  private identifier: string;

  /** 最大对象数量，超过此数量时不会缓存新对象 */
  private maxSize: number;

  /** 是否在日志中显示统计信息 */
  private logStats: boolean;

  /** 总计创建的对象数量 */
  private totalCreated = 0;

  /** 总计获取的对象数量 */
  private totalGets = 0;

  /** 总计释放的对象数量 */
  private totalReleases = 0;

  /** 上次性能分析时间戳 */
  private lastAnalysisTime = 0;

  /**
   * 创建对象池实例
   * @param factory 创建对象的工厂函数
   * @param resetFunc 重置对象状态的函数
   * @param options 对象池选项
   */
  constructor (
    factory: () => T,
    resetFunc: (obj: T) => void,
    options: {
      identifier?: string,
      initialCapacity?: number,
      maxSize?: number,
      logStats?: boolean,
    } = {}
  ) {
    this.factory = factory;
    this.resetFunc = resetFunc;
    this.identifier = options.identifier || 'ObjectPool';
    this.maxSize = options.maxSize || 1000;
    this.logStats = options.logStats || false;

    // 预创建对象
    const initialCapacity = options.initialCapacity || 0;

    for (let i = 0; i < initialCapacity; i++) {
      this.available.push(this.factory());
      this.totalCreated++;
    }
  }

  /**
   * 从对象池获取对象
   * @returns 池中对象
   */
  get (): T {
    let obj: T;

    this.totalGets++;

    if (this.available.length > 0) {
      // 使用非空断言操作符确保编译器知道这不会是undefined
      obj = this.available.pop()!;
    } else {
      obj = this.factory();
      this.totalCreated++;
    }

    this.inUse.add(obj);

    if (this.logStats) {
      this.logPoolStats('获取对象');
    }

    return obj;
  }

  /**
   * 释放对象回对象池
   * @param obj 要释放的对象
   */
  release (obj: T): void {
    if (!obj) {
      return;
    }

    if (this.inUse.has(obj)) {
      this.inUse.delete(obj);
      this.totalReleases++;

      // 重置对象状态
      this.resetFunc(obj);

      // 如果池中对象数量未超过最大值，则返回对象池
      if (this.available.length < this.maxSize) {
        this.available.push(obj);
      }

      if (this.logStats) {
        this.logPoolStats('释放对象');
      }
    }
  }

  /**
   * 批量释放多个对象
   * @param objects 要释放的对象数组
   */
  releaseAll (objects: T[]): void {
    if (!objects || objects.length === 0) {
      return;
    }

    for (const obj of objects) {
      this.release(obj);
    }
  }

  /**
   * 清空对象池
   */
  clear (): void {
    this.available = [];
    this.inUse.clear();

    if (this.logStats) {
      this.logPoolStats('清空对象池');
    }
  }

  /**
   * 获取对象池状态
   * @returns 对象池状态信息
   */
  getStatus (): { available: number, inUse: number, total: number, efficiency: number } {
    const total = this.available.length + this.inUse.size;
    // 计算对象重用率
    const efficiency = this.totalGets > 0 ?
      (this.totalGets - this.totalCreated) / this.totalGets * 100 : 0;

    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total,
      efficiency,
    };
  }

  /**
   * 预热对象池，创建指定数量的对象
   * @param count 要预创建的对象数量
   */
  warmUp (count: number): void {
    if (count <= 0) {
      return;
    }

    const createCount = Math.min(count, this.maxSize - this.available.length);

    for (let i = 0; i < createCount; i++) {
      this.available.push(this.factory());
      this.totalCreated++;
    }

    if (this.logStats) {
      this.logPoolStats(`预热对象池: 创建了${createCount}个对象`);
    }
  }

  /**
   * 分析对象池性能
   * @param minimumInterval 最小分析间隔（毫秒）
   */
  analyzePerformance (minimumInterval = 5000): void {
    const now = Date.now();

    if (now - this.lastAnalysisTime < minimumInterval) {
      return;
    }

    this.lastAnalysisTime = now;
    const status = this.getStatus();

    // 使用性能分析日志替代普通console
    // eslint-disable-next-line no-console
    console.info(
      `[${this.identifier}] 性能分析:\n` +
      `- 总创建: ${this.totalCreated}\n` +
      `- 总获取: ${this.totalGets}\n` +
      `- 总释放: ${this.totalReleases}\n` +
      `- 当前可用: ${status.available}\n` +
      `- 当前使用: ${status.inUse}\n` +
      `- 对象重用率: ${status.efficiency.toFixed(2)}%`
    );
  }

  /**
   * 记录对象池统计信息
   * @param action 当前执行的操作
   */
  private logPoolStats (action: string): void {
    if (!this.logStats) {
      return;
    }

    // eslint-disable-next-line no-console
    console.log(
      `[${this.identifier}] ${action}: ` +
      `可用=${this.available.length}, ` +
      `使用中=${this.inUse.size}, ` +
      `总创建=${this.totalCreated}`
    );
  }
}