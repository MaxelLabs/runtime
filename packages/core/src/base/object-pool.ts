import { logError, logWarning } from './errors';

/**
 * Core包对象池性能统计
 */
export interface CoreObjectPoolStats {
  /** 对象池ID */
  poolId: string;
  /** 池中可用对象数量 */
  available: number;
  /** 当前使用中对象数量 */
  inUse: number;
  /** 池中总对象数量 */
  total: number;
  /** 对象重用率 */
  efficiency: number;
  /** 总获取对象次数 */
  totalGets?: number;
  /** 总创建对象次数 */
  totalCreated?: number;
  /** 总释放对象次数 */
  totalReleased?: number;
}

/**
 * 通用对象池类，用于对象重用减少内存分配
 */
export class ObjectPool<T> {
  /** 对象池名称 */
  name: string;
  /** 存储空闲对象的数组 */
  private pool: T[] = [];
  /** 当前活跃对象数量 */
  private activeCount: number = 0;
  /** 对象创建工厂函数 */
  private factory: () => T;
  /** 对象重置函数 */
  private reset: (obj: T) => void;
  /** 对象池最大容量，超过后释放而不是放回池中 */
  private maxSize: number;
  /** 跟踪从此池创建的所有对象 */
  private poolObjects: WeakSet<object> = new WeakSet();
  /** 对象池是否已销毁 */
  private isDestroyed: boolean = false;

  // 性能统计指标
  private _totalGets: number = 0;
  private _totalCreated: number = 0;
  private _totalReleased: number = 0;

  /**
   * 创建对象池
   * @param name 对象池名称
   * @param factory 创建对象的工厂函数
   * @param reset 重置对象状态的函数
   * @param initialSize 初始池大小
   * @param maxSize 池最大容量
   */
  constructor(
    name: string,
    factory: () => T,
    reset: (obj: T) => void,
    initialSize: number = 0,
    maxSize: number = 1000
  ) {
    this.name = name;
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    // 预创建对象
    this.preAllocate(initialSize);
  }

  /**
   * 预分配对象
   * @param count 预分配数量
   */
  preAllocate(count: number): void {
    if (this.isDestroyed) {
      const errorMsg = `对象池 ${this.name} 已销毁，无法预分配对象`;

      logError(errorMsg, 'ObjectPool', undefined);

      return;
    }

    try {
      for (let i = 0; i < count; i++) {
        const obj = this.factory();

        this._totalCreated++;

        this.trackObject(obj);
        this.pool.push(obj);
      }
    } catch (error) {
      const errorMsg = `对象池 ${this.name} 预分配对象时发生错误`;

      logError(errorMsg, 'ObjectPool', error instanceof Error ? error : undefined);
    }
  }

  /**
   * 预热对象池 - 创建对象并预热
   * @param count 预热数量
   * @returns 预热结果，包含成功预热数量
   */
  warmUp(count: number): { success: boolean; count: number } {
    if (this.isDestroyed) {
      const errorMsg = `对象池 ${this.name} 已销毁，无法预热对象池`;

      logError(errorMsg, 'ObjectPool', undefined);

      return { success: false, count: 0 };
    }

    let warmedUpCount = 0;

    try {
      // 获取并立即释放对象来预热
      for (let i = 0; i < count; i++) {
        const obj = this.get();

        this.release(obj);
        warmedUpCount++;
      }

      return {
        success: true,
        count: warmedUpCount,
      };
    } catch (error) {
      const errorMsg = `对象池 ${this.name} 预热时发生错误`;

      logError(errorMsg, 'ObjectPool', error instanceof Error ? error : undefined);

      return {
        success: false,
        count: warmedUpCount,
      };
    }
  }

  /**
   * 跟踪对象，将其标记为由此池创建
   * @param obj 需要跟踪的对象
   */
  private trackObject(obj: T): void {
    // 只有对象类型才能加入WeakSet
    // 对于原始值类型（number, string, boolean等），无法使用WeakSet追踪
    if (obj && typeof obj === 'object' && obj !== null) {
      this.poolObjects.add(obj as object);
    }
  }

  /**
   * 检查对象是否由此池创建
   * @param obj 需要检查的对象
   * @returns 是否为池对象（原始值类型返回false，因为无法追踪）
   */
  private isPoolObject(obj: T): boolean {
    // 原始值类型无法使用 WeakSet 追踪，返回 false
    // 这意味着对象池不应该用于原始值类型
    if (!obj || typeof obj !== 'object' || obj === null) {
      return false;
    }

    return this.poolObjects.has(obj as object);
  }

  /**
   * 从池中获取一个对象
   * @returns 池中的对象或新创建的对象
   * @throws 如果对象池已销毁或创建对象失败
   */
  get(): T {
    if (this.isDestroyed) {
      throw new Error(`对象池 ${this.name} 已销毁，无法获取对象`);
    }

    this._totalGets++;
    let obj: T;

    try {
      if (this.pool.length > 0) {
        // 从池中取出对象
        obj = this.pool.pop()!;
      } else {
        // 创建新对象
        obj = this.factory();
        this._totalCreated++;
        this.trackObject(obj);
      }

      this.activeCount++;

      return obj;
    } catch (error) {
      const errorMsg = `对象池 ${this.name} 获取对象时发生错误`;

      logError(errorMsg, 'ObjectPool', error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * 将对象放回池中
   * @param obj 要放回的对象
   * @returns 是否成功释放对象
   * @throws {Error} 当尝试释放 null、原始值类型或非池对象时抛出错误
   */
  release(obj: T): boolean {
    if (this.isDestroyed) {
      throw new Error(`对象池 ${this.name} 已销毁，无法释放对象`);
    }

    // 检查是否为 null 或 undefined
    if (obj == null) {
      const errorMsg = `对象池 ${this.name} 不能释放 null 或 undefined`;

      logError(errorMsg, 'ObjectPool', undefined);

      return false;
    }

    // 检查是否为原始值类型
    if (typeof obj !== 'object') {
      const errorMsg = `对象池 ${this.name} 不能释放原始值类型 (${typeof obj})。对象池仅支持对象类型。`;

      logError(errorMsg, 'ObjectPool', undefined);

      return false;
    }

    // 验证对象是否由此池创建
    if (!this.isPoolObject(obj)) {
      const errorMsg = `对象池 ${this.name} 尝试释放非池对象。请确保对象来自此对象池。`;

      logError(errorMsg, 'ObjectPool', undefined);

      return false;
    }

    try {
      // 重置对象状态
      this.reset(obj);
      this._totalReleased++;

      // 如果池未满，则放回池中
      if (this.pool.length < this.maxSize) {
        this.pool.push(obj);
      }

      this.activeCount = Math.max(0, this.activeCount - 1);

      return true;
    } catch (error) {
      const errorMsg = `对象池 ${this.name} 释放对象时发生错误`;

      logError(errorMsg, 'ObjectPool', error instanceof Error ? error : undefined);
      this.activeCount = Math.max(0, this.activeCount - 1);

      return false;
    }
  }

  /**
   * 清空对象池
   */
  clear(): void {
    this.pool.length = 0;
    this.activeCount = 0;
  }

  /**
   * 完全销毁对象池，释放所有资源
   */
  destroy(): void {
    this.clear();
    this.isDestroyed = true;
  }

  /**
   * 获取对象池当前状态统计
   * @returns 对象池性能统计
   */
  getStatus(): CoreObjectPoolStats {
    const available = this.pool.length;
    const inUse = this.activeCount;
    const total = available + inUse;

    // 计算对象重用率: (获取次数 - 创建次数) / 获取次数
    // 如果获取次数为0，则返回0
    const efficiency = this._totalGets === 0 ? 0 : (this._totalGets - this._totalCreated) / this._totalGets;

    return {
      poolId: this.name,
      available,
      inUse,
      total,
      efficiency,
      totalGets: this._totalGets,
      totalCreated: this._totalCreated,
      totalReleased: this._totalReleased,
    };
  }

  /**
   * 调整对象池最大容量
   * @param maxSize 新的最大容量
   */
  setMaxSize(maxSize: number): void {
    if (this.isDestroyed) {
      logWarning(`对象池 ${this.name} 已销毁，无法调整容量`, 'ObjectPool');

      return;
    }

    this.maxSize = maxSize;

    // 如果当前池大小超过新的最大容量，裁剪掉多余对象
    if (this.pool.length > maxSize) {
      this.pool.length = maxSize;
    }
  }

  /**
   * 获取池中当前空闲对象数量
   */
  getSize(): number {
    return this.pool.length;
  }

  /**
   * 获取对象池总容量（活跃+空闲）
   */
  getCapacity(): number {
    return this.activeCount + this.pool.length;
  }

  /**
   * 检查对象池是否已销毁
   */
  getDestroyed(): boolean {
    return this.isDestroyed;
  }
}
