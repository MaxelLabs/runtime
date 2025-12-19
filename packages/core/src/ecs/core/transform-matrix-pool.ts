/**
 * Transform 矩阵池
 * 使用 Float32Array 连续存储所有 Transform 的世界矩阵
 *
 * @remarks
 * **设计目标**:
 * - 所有 Transform 矩阵在连续内存中
 * - 可直接上传到 GPU（Uniform Buffer / Instance Buffer）
 * - 支持批量计算和更新
 * - 与现有 Transform 组件兼容
 *
 * **内存布局**:
 * ```
 * [mat0_m00, mat0_m01, ..., mat0_m33, mat1_m00, mat1_m01, ..., mat1_m33, ...]
 *  |<-------- 16 floats -------->|  |<-------- 16 floats -------->|
 * ```
 *
 * @example
 * ```typescript
 * const pool = new TransformMatrixPool(1000);
 *
 * // 分配矩阵槽位
 * const slot = pool.allocate();
 *
 * // 设置矩阵数据
 * pool.setMatrix(slot, worldMatrix);
 *
 * // 获取用于 WebGL 的缓冲区
 * const buffer = pool.getBuffer();
 * gl.bufferData(gl.UNIFORM_BUFFER, buffer, gl.DYNAMIC_DRAW);
 * ```
 */

import type { Matrix4Like } from '@maxellabs/specification';

/**
 * 矩阵槽位 ID
 */
export type MatrixSlotId = number;

/**
 * 无效槽位
 */
export const INVALID_SLOT: MatrixSlotId = -1;

/**
 * 每个矩阵的 float 数量
 */
const MATRIX_SIZE = 16;

/**
 * Transform 矩阵池
 */
export class TransformMatrixPool {
  /** 本地矩阵存储 */
  private localMatrices: Float32Array;

  /** 世界矩阵存储 */
  private worldMatrices: Float32Array;

  /** 脏标记（每个矩阵一个 bit） */
  private dirtyFlags: Uint8Array;

  /** 父级索引（-1 表示无父级） */
  private parentIndices: Int32Array;

  /** 空闲槽位列表 */
  private freeSlots: number[] = [];

  /** 下一个可用槽位 */
  private nextSlot: number = 0;

  /** 当前容量 */
  private capacity: number;

  /** 已分配数量 */
  private allocatedCount: number = 0;

  /**
   * 创建矩阵池
   * @param initialCapacity 初始容量
   */
  constructor(initialCapacity: number = 1024) {
    this.capacity = initialCapacity;
    this.localMatrices = new Float32Array(initialCapacity * MATRIX_SIZE);
    this.worldMatrices = new Float32Array(initialCapacity * MATRIX_SIZE);
    this.dirtyFlags = new Uint8Array(initialCapacity);
    this.parentIndices = new Int32Array(initialCapacity).fill(-1);

    // 初始化所有矩阵为单位矩阵
    for (let i = 0; i < initialCapacity; i++) {
      this.setIdentity(this.localMatrices, i);
      this.setIdentity(this.worldMatrices, i);
    }
  }

  /**
   * 分配一个矩阵槽位
   * @returns 槽位 ID
   */
  allocate(): MatrixSlotId {
    let slot: MatrixSlotId;

    if (this.freeSlots.length > 0) {
      slot = this.freeSlots.pop()!;
    } else {
      if (this.nextSlot >= this.capacity) {
        this.grow();
      }
      slot = this.nextSlot++;
    }

    // 重置为单位矩阵
    this.setIdentity(this.localMatrices, slot);
    this.setIdentity(this.worldMatrices, slot);
    this.dirtyFlags[slot] = 1;
    this.parentIndices[slot] = -1;

    this.allocatedCount++;
    return slot;
  }

  /**
   * 释放矩阵槽位
   * @param slot 槽位 ID
   */
  free(slot: MatrixSlotId): void {
    if (slot < 0 || slot >= this.nextSlot) {
      return;
    }

    this.freeSlots.push(slot);
    this.parentIndices[slot] = -1;
    this.allocatedCount--;
  }

  /**
   * 设置本地矩阵
   * @param slot 槽位 ID
   * @param matrix 矩阵数据
   */
  setLocalMatrix(slot: MatrixSlotId, matrix: Matrix4Like | Float32Array | number[]): void {
    const offset = slot * MATRIX_SIZE;

    if (matrix instanceof Float32Array || Array.isArray(matrix)) {
      for (let i = 0; i < MATRIX_SIZE; i++) {
        this.localMatrices[offset + i] = matrix[i];
      }
    } else {
      // Matrix4Like 格式（列主序）
      this.localMatrices[offset + 0] = matrix.m00;
      this.localMatrices[offset + 1] = matrix.m01;
      this.localMatrices[offset + 2] = matrix.m02;
      this.localMatrices[offset + 3] = matrix.m03;
      this.localMatrices[offset + 4] = matrix.m10;
      this.localMatrices[offset + 5] = matrix.m11;
      this.localMatrices[offset + 6] = matrix.m12;
      this.localMatrices[offset + 7] = matrix.m13;
      this.localMatrices[offset + 8] = matrix.m20;
      this.localMatrices[offset + 9] = matrix.m21;
      this.localMatrices[offset + 10] = matrix.m22;
      this.localMatrices[offset + 11] = matrix.m23;
      this.localMatrices[offset + 12] = matrix.m30;
      this.localMatrices[offset + 13] = matrix.m31;
      this.localMatrices[offset + 14] = matrix.m32;
      this.localMatrices[offset + 15] = matrix.m33;
    }

    this.dirtyFlags[slot] = 1;
  }

  /**
   * 从 TRS 设置本地矩阵
   * @param slot 槽位 ID
   * @param tx 位置 X
   * @param ty 位置 Y
   * @param tz 位置 Z
   * @param qx 旋转四元数 X
   * @param qy 旋转四元数 Y
   * @param qz 旋转四元数 Z
   * @param qw 旋转四元数 W
   * @param sx 缩放 X
   * @param sy 缩放 Y
   * @param sz 缩放 Z
   */
  setLocalFromTRS(
    slot: MatrixSlotId,
    tx: number,
    ty: number,
    tz: number,
    qx: number,
    qy: number,
    qz: number,
    qw: number,
    sx: number,
    sy: number,
    sz: number
  ): void {
    const offset = slot * MATRIX_SIZE;

    // 从四元数计算旋转矩阵元素
    const x2 = qx + qx;
    const y2 = qy + qy;
    const z2 = qz + qz;
    const xx = qx * x2;
    const xy = qx * y2;
    const xz = qx * z2;
    const yy = qy * y2;
    const yz = qy * z2;
    const zz = qz * z2;
    const wx = qw * x2;
    const wy = qw * y2;
    const wz = qw * z2;

    // 组合 TRS（列主序）
    this.localMatrices[offset + 0] = (1 - (yy + zz)) * sx;
    this.localMatrices[offset + 1] = (xy + wz) * sx;
    this.localMatrices[offset + 2] = (xz - wy) * sx;
    this.localMatrices[offset + 3] = 0;

    this.localMatrices[offset + 4] = (xy - wz) * sy;
    this.localMatrices[offset + 5] = (1 - (xx + zz)) * sy;
    this.localMatrices[offset + 6] = (yz + wx) * sy;
    this.localMatrices[offset + 7] = 0;

    this.localMatrices[offset + 8] = (xz + wy) * sz;
    this.localMatrices[offset + 9] = (yz - wx) * sz;
    this.localMatrices[offset + 10] = (1 - (xx + yy)) * sz;
    this.localMatrices[offset + 11] = 0;

    this.localMatrices[offset + 12] = tx;
    this.localMatrices[offset + 13] = ty;
    this.localMatrices[offset + 14] = tz;
    this.localMatrices[offset + 15] = 1;

    this.dirtyFlags[slot] = 1;
  }

  /**
   * 设置父级
   * @param slot 槽位 ID
   * @param parentSlot 父级槽位 ID（-1 表示无父级）
   */
  setParent(slot: MatrixSlotId, parentSlot: MatrixSlotId): void {
    this.parentIndices[slot] = parentSlot;
    this.dirtyFlags[slot] = 1;
  }

  /**
   * 标记为脏
   * @param slot 槽位 ID
   */
  markDirty(slot: MatrixSlotId): void {
    this.dirtyFlags[slot] = 1;
  }

  /**
   * 更新所有脏矩阵的世界变换
   * @remarks
   * 批量计算所有需要更新的世界矩阵
   * 这是性能关键路径，应在每帧渲染前调用一次
   */
  updateWorldMatrices(): void {
    // 按层级顺序更新（确保父级先于子级更新）
    // 简单实现：多次遍历直到没有脏标记
    // TODO: 优化为拓扑排序或层级遍历

    let hasUpdates = true;
    let iterations = 0;
    const maxIterations = 100; // 防止无限循环

    while (hasUpdates && iterations < maxIterations) {
      hasUpdates = false;
      iterations++;

      for (let slot = 0; slot < this.nextSlot; slot++) {
        if (this.dirtyFlags[slot] === 0) {
          continue;
        }

        const parentSlot = this.parentIndices[slot];

        // 如果有父级且父级也是脏的，跳过等待下一轮
        if (parentSlot >= 0 && this.dirtyFlags[parentSlot] !== 0) {
          hasUpdates = true;
          continue;
        }

        // 计算世界矩阵
        if (parentSlot < 0) {
          // 无父级，世界矩阵 = 本地矩阵
          this.copyMatrix(this.localMatrices, slot, this.worldMatrices, slot);
        } else {
          // 有父级，世界矩阵 = 父级世界矩阵 * 本地矩阵
          this.multiplyMatrices(parentSlot, slot, slot);
        }

        this.dirtyFlags[slot] = 0;
      }
    }
  }

  /**
   * 获取世界矩阵视图
   * @param slot 槽位 ID
   * @returns Float32Array 视图（16 个元素）
   */
  getWorldMatrix(slot: MatrixSlotId): Float32Array {
    const offset = slot * MATRIX_SIZE;
    return this.worldMatrices.subarray(offset, offset + MATRIX_SIZE);
  }

  /**
   * 获取本地矩阵视图
   * @param slot 槽位 ID
   * @returns Float32Array 视图（16 个元素）
   */
  getLocalMatrix(slot: MatrixSlotId): Float32Array {
    const offset = slot * MATRIX_SIZE;
    return this.localMatrices.subarray(offset, offset + MATRIX_SIZE);
  }

  /**
   * 获取所有世界矩阵缓冲区（用于 GPU 上传）
   * @returns 包含所有已分配矩阵的 Float32Array
   */
  getWorldMatrixBuffer(): Float32Array {
    return this.worldMatrices.subarray(0, this.nextSlot * MATRIX_SIZE);
  }

  /**
   * 获取完整的世界矩阵数组
   */
  getFullWorldMatrixBuffer(): Float32Array {
    return this.worldMatrices;
  }

  /**
   * 获取已分配数量
   */
  getAllocatedCount(): number {
    return this.allocatedCount;
  }

  /**
   * 获取容量
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * 清空池
   */
  clear(): void {
    this.freeSlots.length = 0;
    this.nextSlot = 0;
    this.allocatedCount = 0;
    this.dirtyFlags.fill(0);
    this.parentIndices.fill(-1);
  }

  /**
   * 设置单位矩阵
   */
  private setIdentity(buffer: Float32Array, slot: number): void {
    const offset = slot * MATRIX_SIZE;
    buffer.fill(0, offset, offset + MATRIX_SIZE);
    buffer[offset + 0] = 1; // m00
    buffer[offset + 5] = 1; // m11
    buffer[offset + 10] = 1; // m22
    buffer[offset + 15] = 1; // m33
  }

  /**
   * 复制矩阵
   */
  private copyMatrix(src: Float32Array, srcSlot: number, dst: Float32Array, dstSlot: number): void {
    const srcOffset = srcSlot * MATRIX_SIZE;
    const dstOffset = dstSlot * MATRIX_SIZE;
    for (let i = 0; i < MATRIX_SIZE; i++) {
      dst[dstOffset + i] = src[srcOffset + i];
    }
  }

  /**
   * 矩阵乘法：result = worldMatrices[parentSlot] * localMatrices[childSlot]
   * 结果存入 worldMatrices[resultSlot]
   */
  private multiplyMatrices(parentSlot: number, childSlot: number, resultSlot: number): void {
    const a = this.worldMatrices;
    const b = this.localMatrices;
    const c = this.worldMatrices;

    const ao = parentSlot * MATRIX_SIZE;
    const bo = childSlot * MATRIX_SIZE;
    const co = resultSlot * MATRIX_SIZE;

    // 列主序 4x4 矩阵乘法
    const a00 = a[ao + 0],
      a01 = a[ao + 1],
      a02 = a[ao + 2],
      a03 = a[ao + 3];
    const a10 = a[ao + 4],
      a11 = a[ao + 5],
      a12 = a[ao + 6],
      a13 = a[ao + 7];
    const a20 = a[ao + 8],
      a21 = a[ao + 9],
      a22 = a[ao + 10],
      a23 = a[ao + 11];
    const a30 = a[ao + 12],
      a31 = a[ao + 13],
      a32 = a[ao + 14],
      a33 = a[ao + 15];

    const b00 = b[bo + 0],
      b01 = b[bo + 1],
      b02 = b[bo + 2],
      b03 = b[bo + 3];
    const b10 = b[bo + 4],
      b11 = b[bo + 5],
      b12 = b[bo + 6],
      b13 = b[bo + 7];
    const b20 = b[bo + 8],
      b21 = b[bo + 9],
      b22 = b[bo + 10],
      b23 = b[bo + 11];
    const b30 = b[bo + 12],
      b31 = b[bo + 13],
      b32 = b[bo + 14],
      b33 = b[bo + 15];

    c[co + 0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
    c[co + 1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
    c[co + 2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
    c[co + 3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;

    c[co + 4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
    c[co + 5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
    c[co + 6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
    c[co + 7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;

    c[co + 8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
    c[co + 9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
    c[co + 10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
    c[co + 11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;

    c[co + 12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
    c[co + 13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
    c[co + 14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
    c[co + 15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
  }

  /**
   * 扩容
   */
  private grow(): void {
    const newCapacity = this.capacity * 2;

    const newLocalMatrices = new Float32Array(newCapacity * MATRIX_SIZE);
    newLocalMatrices.set(this.localMatrices);

    const newWorldMatrices = new Float32Array(newCapacity * MATRIX_SIZE);
    newWorldMatrices.set(this.worldMatrices);

    const newDirtyFlags = new Uint8Array(newCapacity);
    newDirtyFlags.set(this.dirtyFlags);

    const newParentIndices = new Int32Array(newCapacity).fill(-1);
    newParentIndices.set(this.parentIndices);

    // 初始化新增部分为单位矩阵
    for (let i = this.capacity; i < newCapacity; i++) {
      this.setIdentity(newLocalMatrices, i);
      this.setIdentity(newWorldMatrices, i);
    }

    this.localMatrices = newLocalMatrices;
    this.worldMatrices = newWorldMatrices;
    this.dirtyFlags = newDirtyFlags;
    this.parentIndices = newParentIndices;
    this.capacity = newCapacity;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    allocated: number;
    capacity: number;
    freeSlots: number;
    memoryBytes: number;
    utilizationRate: number;
  } {
    const memoryBytes =
      this.localMatrices.byteLength +
      this.worldMatrices.byteLength +
      this.dirtyFlags.byteLength +
      this.parentIndices.byteLength;

    return {
      allocated: this.allocatedCount,
      capacity: this.capacity,
      freeSlots: this.freeSlots.length,
      memoryBytes,
      utilizationRate: this.allocatedCount / this.capacity,
    };
  }
}

/**
 * 全局矩阵池单例
 */
let globalMatrixPool: TransformMatrixPool | null = null;

/**
 * 获取全局矩阵池
 * @param initialCapacity 初始容量（仅首次调用有效）
 */
export function getGlobalMatrixPool(initialCapacity: number = 4096): TransformMatrixPool {
  if (!globalMatrixPool) {
    globalMatrixPool = new TransformMatrixPool(initialCapacity);
  }
  return globalMatrixPool;
}

/**
 * 重置全局矩阵池
 */
export function resetGlobalMatrixPool(): void {
  globalMatrixPool = null;
}
