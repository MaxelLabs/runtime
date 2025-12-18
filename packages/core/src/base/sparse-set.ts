/**
 * 稀疏集合（SparseSet）
 *
 * @remarks
 * 高效的整数集合数据结构，特别适用于 ECS 中的 Entity ID 管理。
 *
 * 特点：
 * - O(1) 的添加、删除、查找操作
 * - O(n) 的遍历（n 为集合大小，非容量）
 * - 紧凑的密集数组，缓存友好
 * - 支持快速清空
 *
 * 实现原理：
 * - sparse 数组：索引为值，存储在 dense 中的位置
 * - dense 数组：紧凑存储所有值
 *
 * @example
 * ```typescript
 * const set = new SparseSet(1000); // 支持 0-999 的值
 *
 * set.add(5);
 * set.add(100);
 * set.add(50);
 *
 * console.log(set.has(5));   // true
 * console.log(set.has(6));   // false
 * console.log(set.size);     // 3
 *
 * // 高效遍历
 * for (const value of set) {
 *   console.log(value);
 * }
 *
 * set.remove(100);
 * console.log(set.size);     // 2
 * ```
 */
export class SparseSet {
  /** 稀疏数组：索引为值，存储在 dense 中的位置 */
  private sparse: Uint32Array;

  /** 密集数组：紧凑存储所有值 */
  private dense: Uint32Array;

  /** 当前元素数量 */
  private _size: number = 0;

  /** 最大容量 */
  private _capacity: number;

  /** 无效索引标记 */
  private static readonly INVALID = 0xffffffff;

  /**
   * 创建稀疏集合
   * @param capacity 最大容量（支持的最大值 + 1）
   */
  constructor(capacity: number = 1024) {
    this._capacity = capacity;
    this.sparse = new Uint32Array(capacity).fill(SparseSet.INVALID);
    this.dense = new Uint32Array(capacity);
  }

  /**
   * 获取当前元素数量
   */
  get size(): number {
    return this._size;
  }

  /**
   * 获取最大容量
   */
  get capacity(): number {
    return this._capacity;
  }

  /**
   * 检查集合是否为空
   */
  get isEmpty(): boolean {
    return this._size === 0;
  }

  /**
   * 添加值到集合
   * @param value 要添加的值
   * @returns 是否成功添加（如果已存在则返回 false）
   */
  add(value: number): boolean {
    if (value >= this._capacity) {
      this.grow(value + 1);
    }

    // 如果已存在，返回 false
    if (this.has(value)) {
      return false;
    }

    // 添加到 dense 数组末尾
    this.dense[this._size] = value;
    // 在 sparse 中记录位置
    this.sparse[value] = this._size;
    this._size++;

    return true;
  }

  /**
   * 从集合中移除值
   * @param value 要移除的值
   * @returns 是否成功移除（如果不存在则返回 false）
   */
  remove(value: number): boolean {
    if (value >= this._capacity || !this.has(value)) {
      return false;
    }

    // 获取要移除元素在 dense 中的位置
    const denseIndex = this.sparse[value];
    // 获取 dense 数组最后一个元素
    const lastValue = this.dense[this._size - 1];

    // 用最后一个元素覆盖要移除的元素
    this.dense[denseIndex] = lastValue;
    // 更新最后一个元素在 sparse 中的位置
    this.sparse[lastValue] = denseIndex;
    // 标记被移除的元素为无效
    this.sparse[value] = SparseSet.INVALID;

    this._size--;

    return true;
  }

  /**
   * 检查值是否在集合中
   * @param value 要检查的值
   * @returns 是否存在
   */
  has(value: number): boolean {
    if (value >= this._capacity) {
      return false;
    }

    const denseIndex = this.sparse[value];

    return denseIndex !== SparseSet.INVALID && denseIndex < this._size && this.dense[denseIndex] === value;
  }

  /**
   * 清空集合
   */
  clear(): void {
    // 只需要重置 sparse 数组中已使用的部分
    for (let i = 0; i < this._size; i++) {
      this.sparse[this.dense[i]] = SparseSet.INVALID;
    }
    this._size = 0;
  }

  /**
   * 获取指定索引处的值
   * @param index 索引（0 到 size-1）
   * @returns 值
   */
  at(index: number): number {
    if (index < 0 || index >= this._size) {
      throw new RangeError(`Index ${index} out of bounds [0, ${this._size})`);
    }

    return this.dense[index];
  }

  /**
   * 获取值在密集数组中的索引
   * @param value 值
   * @returns 索引，如果不存在返回 -1
   */
  indexOf(value: number): number {
    if (!this.has(value)) {
      return -1;
    }

    return this.sparse[value];
  }

  /**
   * 获取密集数组的只读视图
   * @returns 包含所有值的数组视图
   */
  getValues(): Uint32Array {
    return this.dense.subarray(0, this._size);
  }

  /**
   * 转换为普通数组
   * @returns 包含所有值的数组
   */
  toArray(): number[] {
    return Array.from(this.dense.subarray(0, this._size));
  }

  /**
   * 从数组创建稀疏集合
   * @param values 值数组
   * @returns 新的稀疏集合
   */
  static fromArray(values: number[]): SparseSet {
    if (values.length === 0) {
      return new SparseSet();
    }

    const maxValue = Math.max(...values);
    const set = new SparseSet(maxValue + 1);

    for (const value of values) {
      set.add(value);
    }

    return set;
  }

  /**
   * 迭代所有值
   */
  *[Symbol.iterator](): Iterator<number> {
    for (let i = 0; i < this._size; i++) {
      yield this.dense[i];
    }
  }

  /**
   * 遍历所有值
   * @param callback 回调函数
   */
  forEach(callback: (value: number, index: number) => void): void {
    for (let i = 0; i < this._size; i++) {
      callback(this.dense[i], i);
    }
  }

  /**
   * 检查是否包含另一个集合的所有元素
   * @param other 另一个集合
   * @returns 是否包含
   */
  containsAll(other: SparseSet): boolean {
    for (let i = 0; i < other._size; i++) {
      if (!this.has(other.dense[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * 检查是否与另一个集合有交集
   * @param other 另一个集合
   * @returns 是否有交集
   */
  intersects(other: SparseSet): boolean {
    // 遍历较小的集合
    const [smaller, larger] = this._size <= other._size ? [this, other] : [other, this];

    for (let i = 0; i < smaller._size; i++) {
      if (larger.has(smaller.dense[i])) {
        return true;
      }
    }

    return false;
  }

  /**
   * 计算与另一个集合的交集
   * @param other 另一个集合
   * @returns 新的稀疏集合
   */
  intersection(other: SparseSet): SparseSet {
    const result = new SparseSet(Math.max(this._capacity, other._capacity));

    // 遍历较小的集合
    const [smaller, larger] = this._size <= other._size ? [this, other] : [other, this];

    for (let i = 0; i < smaller._size; i++) {
      const value = smaller.dense[i];

      if (larger.has(value)) {
        result.add(value);
      }
    }

    return result;
  }

  /**
   * 计算与另一个集合的并集
   * @param other 另一个集合
   * @returns 新的稀疏集合
   */
  union(other: SparseSet): SparseSet {
    const result = new SparseSet(Math.max(this._capacity, other._capacity));

    for (let i = 0; i < this._size; i++) {
      result.add(this.dense[i]);
    }

    for (let i = 0; i < other._size; i++) {
      result.add(other.dense[i]);
    }

    return result;
  }

  /**
   * 计算与另一个集合的差集（this - other）
   * @param other 另一个集合
   * @returns 新的稀疏集合
   */
  difference(other: SparseSet): SparseSet {
    const result = new SparseSet(this._capacity);

    for (let i = 0; i < this._size; i++) {
      const value = this.dense[i];

      if (!other.has(value)) {
        result.add(value);
      }
    }

    return result;
  }

  /**
   * 克隆集合
   * @returns 新的稀疏集合
   */
  clone(): SparseSet {
    const result = new SparseSet(this._capacity);

    result.sparse.set(this.sparse);
    result.dense.set(this.dense);
    result._size = this._size;

    return result;
  }

  /**
   * 检查是否与另一个集合相等
   * @param other 另一个集合
   * @returns 是否相等
   */
  equals(other: SparseSet): boolean {
    if (this._size !== other._size) {
      return false;
    }

    for (let i = 0; i < this._size; i++) {
      if (!other.has(this.dense[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * 扩展容量
   * @param minCapacity 最小容量
   */
  private grow(minCapacity: number): void {
    const newCapacity = Math.max(minCapacity, this._capacity * 2);

    const newSparse = new Uint32Array(newCapacity).fill(SparseSet.INVALID);

    newSparse.set(this.sparse);

    const newDense = new Uint32Array(newCapacity);

    newDense.set(this.dense);

    this.sparse = newSparse;
    this.dense = newDense;
    this._capacity = newCapacity;
  }
}

/**
 * 带数据的稀疏集合
 *
 * @remarks
 * 扩展 SparseSet，允许为每个值关联数据。
 * 适用于 ECS 中存储组件数据。
 *
 * @example
 * ```typescript
 * interface Position { x: number; y: number; }
 *
 * const positions = new SparseMap<Position>(1000);
 *
 * positions.set(entityId, { x: 10, y: 20 });
 * const pos = positions.get(entityId);
 * ```
 */
export class SparseMap<T> {
  /** 稀疏数组：索引为键，存储在 dense 中的位置 */
  private sparse: Uint32Array;

  /** 密集键数组 */
  private denseKeys: Uint32Array;

  /** 密集值数组 */
  private denseValues: T[];

  /** 当前元素数量 */
  private _size: number = 0;

  /** 最大容量 */
  private _capacity: number;

  /** 无效索引标记 */
  private static readonly INVALID = 0xffffffff;

  /**
   * 创建稀疏映射
   * @param capacity 最大容量
   */
  constructor(capacity: number = 1024) {
    this._capacity = capacity;
    this.sparse = new Uint32Array(capacity).fill(SparseMap.INVALID);
    this.denseKeys = new Uint32Array(capacity);
    this.denseValues = [];
  }

  /**
   * 获取当前元素数量
   */
  get size(): number {
    return this._size;
  }

  /**
   * 获取最大容量
   */
  get capacity(): number {
    return this._capacity;
  }

  /**
   * 设置键值对
   * @param key 键
   * @param value 值
   */
  set(key: number, value: T): void {
    if (key >= this._capacity) {
      this.grow(key + 1);
    }

    if (this.has(key)) {
      // 更新现有值
      const denseIndex = this.sparse[key];

      this.denseValues[denseIndex] = value;
    } else {
      // 添加新值
      this.denseKeys[this._size] = key;
      this.denseValues[this._size] = value;
      this.sparse[key] = this._size;
      this._size++;
    }
  }

  /**
   * 获取值
   * @param key 键
   * @returns 值，如果不存在返回 undefined
   */
  get(key: number): T | undefined {
    if (!this.has(key)) {
      return undefined;
    }

    return this.denseValues[this.sparse[key]];
  }

  /**
   * 检查键是否存在
   * @param key 键
   * @returns 是否存在
   */
  has(key: number): boolean {
    if (key >= this._capacity) {
      return false;
    }

    const denseIndex = this.sparse[key];

    return denseIndex !== SparseMap.INVALID && denseIndex < this._size && this.denseKeys[denseIndex] === key;
  }

  /**
   * 删除键值对
   * @param key 键
   * @returns 是否成功删除
   */
  delete(key: number): boolean {
    if (!this.has(key)) {
      return false;
    }

    const denseIndex = this.sparse[key];
    const lastIndex = this._size - 1;
    const lastKey = this.denseKeys[lastIndex];

    // 用最后一个元素覆盖要删除的元素
    this.denseKeys[denseIndex] = lastKey;
    this.denseValues[denseIndex] = this.denseValues[lastIndex];
    this.sparse[lastKey] = denseIndex;
    this.sparse[key] = SparseMap.INVALID;

    // 清理最后一个位置
    this.denseValues.pop();
    this._size--;

    return true;
  }

  /**
   * 清空映射
   */
  clear(): void {
    for (let i = 0; i < this._size; i++) {
      this.sparse[this.denseKeys[i]] = SparseMap.INVALID;
    }
    this.denseValues.length = 0;
    this._size = 0;
  }

  /**
   * 获取所有键
   * @returns 键数组
   */
  keys(): number[] {
    return Array.from(this.denseKeys.subarray(0, this._size));
  }

  /**
   * 获取所有值
   * @returns 值数组
   */
  values(): T[] {
    return this.denseValues.slice(0, this._size);
  }

  /**
   * 遍历所有键值对
   * @param callback 回调函数
   */
  forEach(callback: (value: T, key: number) => void): void {
    for (let i = 0; i < this._size; i++) {
      callback(this.denseValues[i], this.denseKeys[i]);
    }
  }

  /**
   * 迭代所有键值对
   */
  *[Symbol.iterator](): Iterator<[number, T]> {
    for (let i = 0; i < this._size; i++) {
      yield [this.denseKeys[i], this.denseValues[i]];
    }
  }

  /**
   * 扩展容量
   * @param minCapacity 最小容量
   */
  private grow(minCapacity: number): void {
    const newCapacity = Math.max(minCapacity, this._capacity * 2);

    const newSparse = new Uint32Array(newCapacity).fill(SparseMap.INVALID);

    newSparse.set(this.sparse);

    const newDenseKeys = new Uint32Array(newCapacity);

    newDenseKeys.set(this.denseKeys);

    this.sparse = newSparse;
    this.denseKeys = newDenseKeys;
    this._capacity = newCapacity;
  }
}
