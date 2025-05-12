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

  /**
   * 创建对象池
   * @param name 对象池名称
   * @param factory 创建对象的工厂函数
   * @param reset 重置对象状态的函数
   * @param initialSize 初始池大小
   * @param maxSize 池最大容量
   */
  constructor(name: string, factory: () => T, reset: (obj: T) => void, initialSize: number = 0, maxSize: number = 1000) {
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
    for (let i = 0; i < count; i++) {
      this.pool.push(this.factory());
    }
  }

  /**
   * 从池中获取一个对象
   * @returns 池中的对象或新创建的对象
   */
  get(): T {
    let obj: T;

    if (this.pool.length > 0) {
      // 从池中取出对象
      obj = this.pool.pop()!;
    } else {
      // 创建新对象
      obj = this.factory();
    }

    this.activeCount++;
    return obj;
  }

  /**
   * 将对象放回池中
   * @param obj 要放回的对象
   */
  release(obj: T): void {
    if (!obj) {return;}

    // 重置对象状态
    this.reset(obj);

    // 如果池未满，则放回池中
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }

    this.activeCount = Math.max(0, this.activeCount - 1);
  }

  /**
   * 清空对象池
   */
  clear(): void {
    this.pool.length = 0;
    this.activeCount = 0;
  }

  /**
   * 调整对象池最大容量
   * @param maxSize 新的最大容量
   */
  setMaxSize(maxSize: number): void {
    this.maxSize = maxSize;
    
    // 如果当前池大小超过新的最大容量，裁剪掉多余对象
    if (this.pool.length > maxSize) {
      this.pool.length = maxSize;
    }
  }

  /**
   * 获取池中当前空闲对象数量
   */
  get size(): number {
    return this.pool.length;
  }

  /**
   * 获取当前活跃对象数量
   */
  get active(): number {
    return this.activeCount;
  }

  /**
   * 获取对象池总容量（活跃+空闲）
   */
  get capacity(): number {
    return this.activeCount + this.pool.length;
  }
}