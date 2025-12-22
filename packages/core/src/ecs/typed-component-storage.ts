/**
 * TypedArray 组件存储
 * 针对 JavaScript 环境优化的数值组件存储方案
 *
 * @remarks
 * **设计目标**:
 * - 真正的连续内存（Float32Array/Int32Array）
 * - 可直接传给 WebGL（零拷贝）
 * - GC 压力极低
 * - 批量操作友好
 *
 * **适用场景**:
 * - Position, Velocity, Scale 等数值组件
 * - Transform 矩阵
 * - 颜色、UV 等渲染数据
 *
 * @example
 * ```typescript
 * // 创建 Position 存储（每个实体 3 个 float: x, y, z）
 * const positions = new TypedComponentStorage(Float32Array, 3, 1000);
 *
 * // 添加实体数据
 * const index = positions.add(entityId, [10, 20, 30]);
 *
 * // 获取数据视图
 * const pos = positions.getView(entityId);
 * console.log(pos[0], pos[1], pos[2]); // 10, 20, 30
 *
 * // 直接传给 WebGL
 * gl.bufferData(gl.ARRAY_BUFFER, positions.getRawBuffer(), gl.DYNAMIC_DRAW);
 * ```
 */

import type { EntityId } from './entity-id';

/**
 * TypedArray 构造函数类型
 */
export type TypedArrayConstructor =
  | Float32ArrayConstructor
  | Float64ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int8ArrayConstructor
  | Uint8ArrayConstructor;

/**
 * TypedArray 实例类型
 */
export type TypedArrayInstance =
  | Float32Array
  | Float64Array
  | Int32Array
  | Uint32Array
  | Int16Array
  | Uint16Array
  | Int8Array
  | Uint8Array;

/**
 * 组件字段定义
 */
export interface ComponentFieldDef {
  /** 字段名称 */
  name: string;
  /** 字段类型 */
  type: TypedArrayConstructor;
  /** 字段元素数量（如 vec3 = 3） */
  size: number;
  /** 在组件中的偏移量（自动计算） */
  offset?: number;
}

/**
 * TypedArray 组件存储
 * 使用连续内存存储同类型组件的所有实例
 */
export class TypedComponentStorage<T extends TypedArrayInstance = Float32Array> {
  /** 数据存储 */
  private data: T;

  /** TypedArray 构造函数 */
  private readonly ArrayType: TypedArrayConstructor;

  /** 每个组件的元素数量 */
  private readonly stride: number;

  /** 当前实体数量 */
  private count: number = 0;

  /** 容量（最大实体数） */
  private capacity: number;

  /** 实体 ID 到索引的映射 */
  private entityToIndex: Map<EntityId, number> = new Map();

  /** 索引到实体 ID 的映射（用于 swap-remove） */
  private indexToEntity: EntityId[] = [];

  /**
   * 创建 TypedArray 组件存储
   * @param ArrayType TypedArray 构造函数
   * @param stride 每个组件的元素数量
   * @param initialCapacity 初始容量
   */
  constructor(ArrayType: TypedArrayConstructor, stride: number, initialCapacity: number = 1024) {
    this.ArrayType = ArrayType;
    this.stride = stride;
    this.capacity = initialCapacity;
    this.data = new ArrayType(initialCapacity * stride) as T;
  }

  /**
   * 添加实体数据
   * @param entity 实体 ID
   * @param values 初始值数组
   * @returns 实体在存储中的索引
   */
  add(entity: EntityId, values?: ArrayLike<number>): number {
    // 检查是否已存在
    if (this.entityToIndex.has(entity)) {
      const index = this.entityToIndex.get(entity)!;
      if (values) {
        this.setValues(index, values);
      }
      return index;
    }

    // 扩容检查
    if (this.count >= this.capacity) {
      this.grow();
    }

    const index = this.count;
    this.entityToIndex.set(entity, index);
    this.indexToEntity[index] = entity;

    // 设置初始值
    if (values) {
      this.setValues(index, values);
    } else {
      // 清零
      const offset = index * this.stride;
      for (let i = 0; i < this.stride; i++) {
        this.data[offset + i] = 0;
      }
    }

    this.count++;
    return index;
  }

  /**
   * 移除实体数据（swap-remove）
   * @param entity 实体 ID
   * @returns 是否成功移除
   */
  remove(entity: EntityId): boolean {
    const index = this.entityToIndex.get(entity);
    if (index === undefined) {
      return false;
    }

    const lastIndex = this.count - 1;

    // 如果不是最后一个，进行 swap
    if (index !== lastIndex) {
      const lastEntity = this.indexToEntity[lastIndex];

      // 复制最后一个实体的数据到当前位置
      const srcOffset = lastIndex * this.stride;
      const dstOffset = index * this.stride;
      for (let i = 0; i < this.stride; i++) {
        this.data[dstOffset + i] = this.data[srcOffset + i];
      }

      // 更新映射
      this.entityToIndex.set(lastEntity, index);
      this.indexToEntity[index] = lastEntity;
    }

    // 移除最后一个
    this.entityToIndex.delete(entity);
    this.indexToEntity.pop();
    this.count--;

    return true;
  }

  /**
   * 检查是否包含实体
   * @param entity 实体 ID
   */
  has(entity: EntityId): boolean {
    return this.entityToIndex.has(entity);
  }

  /**
   * 获取实体的索引
   * @param entity 实体 ID
   * @returns 索引，不存在返回 -1
   */
  getIndex(entity: EntityId): number {
    return this.entityToIndex.get(entity) ?? -1;
  }

  /**
   * 获取实体数据的视图（子数组）
   * @param entity 实体 ID
   * @returns 数据视图，不存在返回 undefined
   */
  getView(entity: EntityId): T | undefined {
    const index = this.entityToIndex.get(entity);
    if (index === undefined) {
      return undefined;
    }
    const offset = index * this.stride;
    return this.data.subarray(offset, offset + this.stride) as T;
  }

  /**
   * 通过索引获取数据视图
   * @param index 索引
   * @returns 数据视图
   */
  getViewByIndex(index: number): T {
    const offset = index * this.stride;
    return this.data.subarray(offset, offset + this.stride) as T;
  }

  /**
   * 设置实体数据
   * @param entity 实体 ID
   * @param values 值数组
   */
  set(entity: EntityId, values: ArrayLike<number>): boolean {
    const index = this.entityToIndex.get(entity);
    if (index === undefined) {
      return false;
    }
    this.setValues(index, values);
    return true;
  }

  /**
   * 通过索引设置数据
   * @param index 索引
   * @param values 值数组
   */
  setValues(index: number, values: ArrayLike<number>): void {
    const offset = index * this.stride;
    const len = Math.min(values.length, this.stride);
    for (let i = 0; i < len; i++) {
      this.data[offset + i] = values[i];
    }
  }

  /**
   * 获取单个元素值
   * @param entity 实体 ID
   * @param elementIndex 元素索引（0 到 stride-1）
   */
  getElement(entity: EntityId, elementIndex: number): number | undefined {
    const index = this.entityToIndex.get(entity);
    if (index === undefined) {
      return undefined;
    }
    return this.data[index * this.stride + elementIndex];
  }

  /**
   * 设置单个元素值
   * @param entity 实体 ID
   * @param elementIndex 元素索引
   * @param value 值
   */
  setElement(entity: EntityId, elementIndex: number, value: number): boolean {
    const index = this.entityToIndex.get(entity);
    if (index === undefined) {
      return false;
    }
    this.data[index * this.stride + elementIndex] = value;
    return true;
  }

  /**
   * 获取原始数据缓冲区（用于 WebGL）
   * @returns 包含所有有效数据的 TypedArray
   */
  getRawBuffer(): T {
    return this.data.subarray(0, this.count * this.stride) as T;
  }

  /**
   * 获取完整数据数组（包括未使用部分）
   */
  getFullBuffer(): T {
    return this.data;
  }

  /**
   * 获取当前实体数量
   */
  getCount(): number {
    return this.count;
  }

  /**
   * 获取容量
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * 获取步长（每个组件的元素数）
   */
  getStride(): number {
    return this.stride;
  }

  /**
   * 遍历所有实体数据
   * @param callback 回调函数
   */
  forEach(callback: (entity: EntityId, data: T, index: number) => void): void {
    for (let i = 0; i < this.count; i++) {
      const entity = this.indexToEntity[i];
      const view = this.getViewByIndex(i);
      callback(entity, view, i);
    }
  }

  /**
   * 批量操作（高性能遍历）
   * @param callback 回调函数，直接操作原始数组
   */
  forEachRaw(callback: (data: T, count: number, stride: number) => void): void {
    callback(this.data as T, this.count, this.stride);
  }

  /**
   * 清空存储
   */
  clear(): void {
    this.count = 0;
    this.entityToIndex.clear();
    this.indexToEntity.length = 0;
  }

  /**
   * 扩容
   */
  private grow(): void {
    const newCapacity = this.capacity * 2;
    const newData = new this.ArrayType(newCapacity * this.stride);
    newData.set(this.data);
    this.data = newData as T;
    this.capacity = newCapacity;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    count: number;
    capacity: number;
    stride: number;
    memoryBytes: number;
    utilizationRate: number;
  } {
    return {
      count: this.count,
      capacity: this.capacity,
      stride: this.stride,
      memoryBytes: this.data.byteLength,
      utilizationRate: this.count / this.capacity,
    };
  }
}

/**
 * 预定义的数值组件类型
 */
export const NumericComponentTypes = {
  /** 3D 位置 (x, y, z) */
  Position: { stride: 3, type: Float32Array as TypedArrayConstructor },
  /** 3D 速度 (x, y, z) */
  Velocity: { stride: 3, type: Float32Array as TypedArrayConstructor },
  /** 3D 缩放 (x, y, z) */
  Scale: { stride: 3, type: Float32Array as TypedArrayConstructor },
  /** 四元数旋转 (x, y, z, w) */
  Rotation: { stride: 4, type: Float32Array as TypedArrayConstructor },
  /** 4x4 矩阵 */
  Matrix4: { stride: 16, type: Float32Array as TypedArrayConstructor },
  /** RGBA 颜色 */
  Color: { stride: 4, type: Float32Array as TypedArrayConstructor },
  /** 2D UV 坐标 */
  UV: { stride: 2, type: Float32Array as TypedArrayConstructor },
  /** 3D 法线 */
  Normal: { stride: 3, type: Float32Array as TypedArrayConstructor },
} as const;

/**
 * 创建预定义类型的存储
 */
export function createNumericStorage<T extends keyof typeof NumericComponentTypes>(
  typeName: T,
  initialCapacity: number = 1024
): TypedComponentStorage<Float32Array> {
  const def = NumericComponentTypes[typeName];
  return new TypedComponentStorage(def.type, def.stride, initialCapacity);
}
