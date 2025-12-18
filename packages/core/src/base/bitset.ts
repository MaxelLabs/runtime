/**
 * 位集合（BitSet）
 *
 * @remarks
 * 高效的位操作数据结构，用于：
 * - ECS 中的组件掩码匹配
 * - 快速集合操作（并集、交集、差集）
 * - 紧凑的布尔数组存储
 *
 * 使用 Uint32Array 存储位，每个元素存储 32 位。
 *
 * @example
 * ```typescript
 * const bitset = new BitSet(128); // 支持 0-127 的位
 *
 * bitset.set(5);
 * bitset.set(10);
 * bitset.set(100);
 *
 * console.log(bitset.has(5));   // true
 * console.log(bitset.has(6));   // false
 *
 * // 集合操作
 * const other = new BitSet(128);
 * other.set(5);
 * other.set(20);
 *
 * const intersection = bitset.and(other);
 * console.log(intersection.has(5));  // true
 * console.log(intersection.has(10)); // false
 * ```
 */
export class BitSet {
  /** 每个 Uint32 存储的位数 */
  private static readonly BITS_PER_WORD = 32;

  /** 位存储数组 */
  private words: Uint32Array;

  /** 位集合的容量（最大位数） */
  private _capacity: number;

  /**
   * 创建位集合
   * @param capacity 容量（最大位数），会向上取整到 32 的倍数
   */
  constructor(capacity: number = 64) {
    const wordCount = Math.ceil(capacity / BitSet.BITS_PER_WORD);

    this.words = new Uint32Array(wordCount);
    this._capacity = wordCount * BitSet.BITS_PER_WORD;
  }

  /**
   * 获取容量
   */
  get capacity(): number {
    return this._capacity;
  }

  /**
   * 获取字数组长度
   */
  get wordCount(): number {
    return this.words.length;
  }

  /**
   * 设置指定位为 1
   * @param index 位索引
   * @returns this，支持链式调用
   */
  set(index: number): this {
    this.ensureCapacity(index + 1);
    const wordIndex = Math.floor(index / BitSet.BITS_PER_WORD);
    const bitIndex = index % BitSet.BITS_PER_WORD;

    this.words[wordIndex] |= 1 << bitIndex;

    return this;
  }

  /**
   * 清除指定位（设为 0）
   * @param index 位索引
   * @returns this，支持链式调用
   */
  clear(index: number): this {
    if (index >= this._capacity) {
      return this;
    }

    const wordIndex = Math.floor(index / BitSet.BITS_PER_WORD);
    const bitIndex = index % BitSet.BITS_PER_WORD;

    this.words[wordIndex] &= ~(1 << bitIndex);

    return this;
  }

  /**
   * 翻转指定位
   * @param index 位索引
   * @returns this，支持链式调用
   */
  flip(index: number): this {
    this.ensureCapacity(index + 1);
    const wordIndex = Math.floor(index / BitSet.BITS_PER_WORD);
    const bitIndex = index % BitSet.BITS_PER_WORD;

    this.words[wordIndex] ^= 1 << bitIndex;

    return this;
  }

  /**
   * 检查指定位是否为 1
   * @param index 位索引
   * @returns 是否为 1
   */
  has(index: number): boolean {
    if (index >= this._capacity) {
      return false;
    }

    const wordIndex = Math.floor(index / BitSet.BITS_PER_WORD);
    const bitIndex = index % BitSet.BITS_PER_WORD;

    return (this.words[wordIndex] & (1 << bitIndex)) !== 0;
  }

  /**
   * 获取指定位的值
   * @param index 位索引
   * @returns 0 或 1
   */
  get(index: number): 0 | 1 {
    return this.has(index) ? 1 : 0;
  }

  /**
   * 清除所有位
   * @returns this，支持链式调用
   */
  clearAll(): this {
    this.words.fill(0);

    return this;
  }

  /**
   * 设置所有位为 1
   * @returns this，支持链式调用
   */
  setAll(): this {
    this.words.fill(0xffffffff);

    return this;
  }

  /**
   * 计算设置为 1 的位数（popcount）
   * @returns 1 的个数
   */
  count(): number {
    let count = 0;

    for (let i = 0; i < this.words.length; i++) {
      count += this.popcount32(this.words[i]);
    }

    return count;
  }

  /**
   * 检查是否为空（没有位被设置）
   * @returns 是否为空
   */
  isEmpty(): boolean {
    for (let i = 0; i < this.words.length; i++) {
      if (this.words[i] !== 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * 检查是否包含另一个位集合的所有位
   * @param other 另一个位集合
   * @returns 是否包含
   */
  contains(other: BitSet): boolean {
    const minLength = Math.min(this.words.length, other.words.length);

    // 检查重叠部分
    for (let i = 0; i < minLength; i++) {
      if ((this.words[i] & other.words[i]) !== other.words[i]) {
        return false;
      }
    }

    // 检查 other 超出部分是否全为 0
    for (let i = minLength; i < other.words.length; i++) {
      if (other.words[i] !== 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * 检查是否与另一个位集合有交集
   * @param other 另一个位集合
   * @returns 是否有交集
   */
  intersects(other: BitSet): boolean {
    const minLength = Math.min(this.words.length, other.words.length);

    for (let i = 0; i < minLength; i++) {
      if ((this.words[i] & other.words[i]) !== 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * 检查是否与另一个位集合相等
   * @param other 另一个位集合
   * @returns 是否相等
   */
  equals(other: BitSet): boolean {
    const maxLength = Math.max(this.words.length, other.words.length);

    for (let i = 0; i < maxLength; i++) {
      const a = i < this.words.length ? this.words[i] : 0;
      const b = i < other.words.length ? other.words[i] : 0;

      if (a !== b) {
        return false;
      }
    }

    return true;
  }

  /**
   * 与操作（交集）
   * @param other 另一个位集合
   * @returns 新的位集合
   */
  and(other: BitSet): BitSet {
    const result = new BitSet(Math.max(this._capacity, other._capacity));
    const minLength = Math.min(this.words.length, other.words.length);

    for (let i = 0; i < minLength; i++) {
      result.words[i] = this.words[i] & other.words[i];
    }

    return result;
  }

  /**
   * 或操作（并集）
   * @param other 另一个位集合
   * @returns 新的位集合
   */
  or(other: BitSet): BitSet {
    const result = new BitSet(Math.max(this._capacity, other._capacity));
    const maxLength = Math.max(this.words.length, other.words.length);

    for (let i = 0; i < maxLength; i++) {
      const a = i < this.words.length ? this.words[i] : 0;
      const b = i < other.words.length ? other.words[i] : 0;

      result.words[i] = a | b;
    }

    return result;
  }

  /**
   * 异或操作（对称差集）
   * @param other 另一个位集合
   * @returns 新的位集合
   */
  xor(other: BitSet): BitSet {
    const result = new BitSet(Math.max(this._capacity, other._capacity));
    const maxLength = Math.max(this.words.length, other.words.length);

    for (let i = 0; i < maxLength; i++) {
      const a = i < this.words.length ? this.words[i] : 0;
      const b = i < other.words.length ? other.words[i] : 0;

      result.words[i] = a ^ b;
    }

    return result;
  }

  /**
   * 非操作（取反）
   * @returns 新的位集合
   */
  not(): BitSet {
    const result = new BitSet(this._capacity);

    for (let i = 0; i < this.words.length; i++) {
      result.words[i] = ~this.words[i];
    }

    return result;
  }

  /**
   * 差集操作（this - other）
   * @param other 另一个位集合
   * @returns 新的位集合
   */
  andNot(other: BitSet): BitSet {
    const result = new BitSet(this._capacity);

    for (let i = 0; i < this.words.length; i++) {
      const b = i < other.words.length ? other.words[i] : 0;

      result.words[i] = this.words[i] & ~b;
    }

    return result;
  }

  /**
   * 原地与操作
   * @param other 另一个位集合
   * @returns this，支持链式调用
   */
  andInPlace(other: BitSet): this {
    const minLength = Math.min(this.words.length, other.words.length);

    for (let i = 0; i < minLength; i++) {
      this.words[i] &= other.words[i];
    }

    // 超出部分清零
    for (let i = minLength; i < this.words.length; i++) {
      this.words[i] = 0;
    }

    return this;
  }

  /**
   * 原地或操作
   * @param other 另一个位集合
   * @returns this，支持链式调用
   */
  orInPlace(other: BitSet): this {
    this.ensureCapacity(other._capacity);

    for (let i = 0; i < other.words.length; i++) {
      this.words[i] |= other.words[i];
    }

    return this;
  }

  /**
   * 克隆位集合
   * @returns 新的位集合
   */
  clone(): BitSet {
    const result = new BitSet(this._capacity);

    result.words.set(this.words);

    return result;
  }

  /**
   * 获取所有设置为 1 的位索引
   * @returns 位索引数组
   */
  toArray(): number[] {
    const result: number[] = [];

    for (let i = 0; i < this.words.length; i++) {
      let word = this.words[i];
      let bitIndex = i * BitSet.BITS_PER_WORD;

      while (word !== 0) {
        if ((word & 1) !== 0) {
          result.push(bitIndex);
        }
        word >>>= 1;
        bitIndex++;
      }
    }

    return result;
  }

  /**
   * 从数组创建位集合
   * @param indices 位索引数组
   * @returns 新的位集合
   */
  static fromArray(indices: number[]): BitSet {
    if (indices.length === 0) {
      return new BitSet();
    }

    const maxIndex = Math.max(...indices);
    const bitset = new BitSet(maxIndex + 1);

    for (const index of indices) {
      bitset.set(index);
    }

    return bitset;
  }

  /**
   * 迭代所有设置为 1 的位索引
   */
  *[Symbol.iterator](): Iterator<number> {
    for (let i = 0; i < this.words.length; i++) {
      let word = this.words[i];
      let bitIndex = i * BitSet.BITS_PER_WORD;

      while (word !== 0) {
        if ((word & 1) !== 0) {
          yield bitIndex;
        }
        word >>>= 1;
        bitIndex++;
      }
    }
  }

  /**
   * 转换为字符串表示
   * @returns 二进制字符串
   */
  toString(): string {
    const bits: string[] = [];

    for (let i = this._capacity - 1; i >= 0; i--) {
      bits.push(this.has(i) ? '1' : '0');
    }

    return bits.join('');
  }

  /**
   * 确保容量足够
   * @param minCapacity 最小容量
   */
  private ensureCapacity(minCapacity: number): void {
    if (minCapacity <= this._capacity) {
      return;
    }

    const newWordCount = Math.ceil(minCapacity / BitSet.BITS_PER_WORD);
    const newWords = new Uint32Array(newWordCount);

    newWords.set(this.words);
    this.words = newWords;
    this._capacity = newWordCount * BitSet.BITS_PER_WORD;
  }

  /**
   * 计算 32 位整数中 1 的个数（Brian Kernighan 算法）
   * @param n 32 位整数
   * @returns 1 的个数
   */
  private popcount32(n: number): number {
    let count = 0;

    while (n !== 0) {
      n &= n - 1;
      count++;
    }

    return count;
  }
}
