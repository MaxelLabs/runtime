/**
 * 渲染数据存储
 * 专门为渲染优化的 TypedArray 存储系统
 *
 * @remarks
 * **设计目标**:
 * - 整合 Transform、GPU 同步、Change Detection
 * - 支持 Instancing 渲染
 * - 支持骨骼动画
 * - 支持粒子系统
 *
 * **内存布局**:
 * ```
 * RenderDataStorage
 * ├── transforms: Float32Array (世界矩阵 16 floats/entity)
 * ├── positions: Float32Array (位置 3 floats/entity)
 * ├── rotations: Float32Array (四元数 4 floats/entity)
 * ├── scales: Float32Array (缩放 3 floats/entity)
 * ├── colors: Float32Array (颜色 4 floats/entity)
 * └── custom: Map<string, Float32Array>
 * ```
 *
 * @example
 * ```typescript
 * // 创建渲染数据存储
 * const renderData = new RenderDataStorage(1000);
 *
 * // 分配实体槽位
 * const slot = renderData.allocate(entity);
 *
 * // 设置 Transform
 * renderData.setPosition(slot, 10, 0, 0);
 * renderData.setRotation(slot, 0, 0, 0, 1);
 * renderData.setScale(slot, 1, 1, 1);
 *
 * // 更新世界矩阵
 * renderData.updateWorldMatrices();
 *
 * // 同步到 GPU
 * renderData.syncToGPU(device);
 *
 * // 获取 GPU Buffer 用于 Instancing
 * const transformBuffer = renderData.getGPUBuffer('transforms');
 * ```
 */

import type { EntityId } from './entity-id';
import { GPUBufferSync, GPUBufferUsage, type IRHIDeviceMinimal } from './gpu-buffer-sync';
import { ChangeTracker, ChangeType } from './change-detection';

/**
 * 渲染数据槽位 ID
 */
export type RenderSlotId = number;

/**
 * 无效槽位
 */
export const INVALID_RENDER_SLOT: RenderSlotId = -1;

/**
 * 数据字段定义
 */
interface DataFieldDef {
  /** 字段名称 */
  name: string;
  /** 每个实体的元素数量 */
  stride: number;
  /** 数据数组 */
  data: Float32Array;
  /** 是否需要 GPU 同步 */
  gpuSync: boolean;
}

/**
 * 渲染数据存储选项
 */
export interface RenderDataStorageOptions {
  /** 初始容量 */
  initialCapacity?: number;
  /** 是否启用 Change Detection */
  enableChangeDetection?: boolean;
  /** 是否启用 GPU 同步 */
  enableGPUSync?: boolean;
  /** 标签 */
  label?: string;
}

/**
 * 渲染数据存储
 */
export class RenderDataStorage {
  /** 存储标签 */
  readonly label: string;

  /** 容量 */
  private capacity: number;

  /** 已分配数量 */
  private count: number = 0;

  /** 实体到槽位的映射 */
  private entityToSlot: Map<EntityId, RenderSlotId> = new Map();

  /** 槽位到实体的映射 */
  private slotToEntity: EntityId[] = [];

  /** 空闲槽位 */
  private freeSlots: RenderSlotId[] = [];

  /** 下一个槽位 */
  private nextSlot: RenderSlotId = 0;

  // ============ 核心数据字段 ============

  /** 位置 (x, y, z) */
  private positions: Float32Array;

  /** 旋转四元数 (x, y, z, w) */
  private rotations: Float32Array;

  /** 缩放 (x, y, z) */
  private scales: Float32Array;

  /** 本地矩阵 (16 floats) */
  private localMatrices: Float32Array;

  /** 世界矩阵 (16 floats) */
  private worldMatrices: Float32Array;

  /** 父级槽位 (-1 表示无父级) */
  private parentSlots: Int32Array;

  /** 脏标记 */
  private dirtyFlags: Uint8Array;

  /** 颜色 (r, g, b, a) */
  private colors: Float32Array;

  // ============ 自定义数据字段 ============

  /** 自定义数据字段 */
  private customFields: Map<string, DataFieldDef> = new Map();

  // ============ 子系统 ============

  /** GPU 同步管理器 */
  private gpuSync: GPUBufferSync | null = null;

  /** 变化追踪器 */
  private changeTracker: ChangeTracker | null = null;

  /** 是否启用 GPU 同步 */
  private gpuSyncEnabled: boolean;

  /** 是否启用变化检测 */
  private changeDetectionEnabled: boolean;

  /** RHI Device */
  private device: IRHIDeviceMinimal | null = null;

  /**
   * 创建渲染数据存储
   * @param options 选项
   */
  constructor(options: RenderDataStorageOptions = {}) {
    this.capacity = options.initialCapacity ?? 1024;
    this.label = options.label ?? 'RenderData';
    this.gpuSyncEnabled = options.enableGPUSync ?? true;
    this.changeDetectionEnabled = options.enableChangeDetection ?? true;

    // 分配核心数据数组
    this.positions = new Float32Array(this.capacity * 3);
    this.rotations = new Float32Array(this.capacity * 4);
    this.scales = new Float32Array(this.capacity * 3);
    this.localMatrices = new Float32Array(this.capacity * 16);
    this.worldMatrices = new Float32Array(this.capacity * 16);
    this.parentSlots = new Int32Array(this.capacity).fill(-1);
    this.dirtyFlags = new Uint8Array(this.capacity);
    this.colors = new Float32Array(this.capacity * 4);

    // 初始化默认值
    for (let i = 0; i < this.capacity; i++) {
      // 默认缩放为 1
      this.scales[i * 3 + 0] = 1;
      this.scales[i * 3 + 1] = 1;
      this.scales[i * 3 + 2] = 1;

      // 默认旋转为单位四元数
      this.rotations[i * 4 + 3] = 1;

      // 默认颜色为白色
      this.colors[i * 4 + 0] = 1;
      this.colors[i * 4 + 1] = 1;
      this.colors[i * 4 + 2] = 1;
      this.colors[i * 4 + 3] = 1;

      // 初始化为单位矩阵
      this.setIdentityMatrix(this.localMatrices, i);
      this.setIdentityMatrix(this.worldMatrices, i);
    }

    // 初始化子系统
    if (this.gpuSyncEnabled) {
      this.gpuSync = new GPUBufferSync();
    }

    if (this.changeDetectionEnabled) {
      this.changeTracker = new ChangeTracker();
    }
  }

  /**
   * 初始化 GPU 同步
   * @param device RHI Device
   */
  initializeGPU(device: IRHIDeviceMinimal): void {
    this.device = device;

    if (this.gpuSync) {
      this.gpuSync.initialize(device);

      // 注册核心数据到 GPU 同步
      this.gpuSync.registerStorage(`${this.label}_worldMatrices`, this.worldMatrices, {
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        hint: 'dynamic',
        label: `${this.label}_WorldMatrices`,
        autoResize: true,
      });

      this.gpuSync.registerStorage(`${this.label}_colors`, this.colors, {
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        hint: 'dynamic',
        label: `${this.label}_Colors`,
        autoResize: true,
      });
    }
  }

  /**
   * 分配槽位
   * @param entity 实体 ID
   * @returns 槽位 ID
   */
  allocate(entity: EntityId): RenderSlotId {
    // 检查是否已分配
    const existing = this.entityToSlot.get(entity);
    if (existing !== undefined) {
      return existing;
    }

    // 获取槽位
    let slot: RenderSlotId;
    if (this.freeSlots.length > 0) {
      slot = this.freeSlots.pop()!;
    } else {
      if (this.nextSlot >= this.capacity) {
        this.grow();
      }
      slot = this.nextSlot++;
    }

    // 建立映射
    this.entityToSlot.set(entity, slot);
    this.slotToEntity[slot] = entity;
    this.count++;

    // 重置数据
    this.resetSlot(slot);

    // 标记变化
    if (this.changeTracker) {
      // 使用虚拟组件类型
      this.changeTracker.markAdded(entity, RenderDataStorage as any);
    }

    return slot;
  }

  /**
   * 释放槽位
   * @param entity 实体 ID
   */
  free(entity: EntityId): void {
    const slot = this.entityToSlot.get(entity);
    if (slot === undefined) {
      return;
    }

    // 清除映射
    this.entityToSlot.delete(entity);
    this.freeSlots.push(slot);
    this.count--;

    // 标记变化
    if (this.changeTracker) {
      this.changeTracker.markRemoved(entity, RenderDataStorage as any);
    }
  }

  /**
   * 获取实体的槽位
   * @param entity 实体 ID
   */
  getSlot(entity: EntityId): RenderSlotId {
    return this.entityToSlot.get(entity) ?? INVALID_RENDER_SLOT;
  }

  /**
   * 获取槽位的实体
   * @param slot 槽位 ID
   */
  getEntity(slot: RenderSlotId): EntityId | undefined {
    return this.slotToEntity[slot];
  }

  // ============ 位置操作 ============

  /**
   * 设置位置
   */
  setPosition(slot: RenderSlotId, x: number, y: number, z: number): void {
    const offset = slot * 3;
    this.positions[offset + 0] = x;
    this.positions[offset + 1] = y;
    this.positions[offset + 2] = z;
    this.markDirty(slot);
  }

  /**
   * 获取位置
   */
  getPosition(slot: RenderSlotId): [number, number, number] {
    const offset = slot * 3;
    return [this.positions[offset + 0], this.positions[offset + 1], this.positions[offset + 2]];
  }

  /**
   * 获取位置视图
   */
  getPositionView(slot: RenderSlotId): Float32Array {
    const offset = slot * 3;
    return this.positions.subarray(offset, offset + 3);
  }

  // ============ 旋转操作 ============

  /**
   * 设置旋转（四元数）
   */
  setRotation(slot: RenderSlotId, x: number, y: number, z: number, w: number): void {
    const offset = slot * 4;
    this.rotations[offset + 0] = x;
    this.rotations[offset + 1] = y;
    this.rotations[offset + 2] = z;
    this.rotations[offset + 3] = w;
    this.markDirty(slot);
  }

  /**
   * 设置旋转（欧拉角，弧度）
   */
  setRotationEuler(slot: RenderSlotId, x: number, y: number, z: number): void {
    const c1 = Math.cos(x / 2);
    const c2 = Math.cos(y / 2);
    const c3 = Math.cos(z / 2);
    const s1 = Math.sin(x / 2);
    const s2 = Math.sin(y / 2);
    const s3 = Math.sin(z / 2);

    const qx = s1 * c2 * c3 + c1 * s2 * s3;
    const qy = c1 * s2 * c3 - s1 * c2 * s3;
    const qz = c1 * c2 * s3 + s1 * s2 * c3;
    const qw = c1 * c2 * c3 - s1 * s2 * s3;

    this.setRotation(slot, qx, qy, qz, qw);
  }

  /**
   * 获取旋转
   */
  getRotation(slot: RenderSlotId): [number, number, number, number] {
    const offset = slot * 4;
    return [
      this.rotations[offset + 0],
      this.rotations[offset + 1],
      this.rotations[offset + 2],
      this.rotations[offset + 3],
    ];
  }

  // ============ 缩放操作 ============

  /**
   * 设置缩放
   */
  setScale(slot: RenderSlotId, x: number, y: number, z: number): void {
    const offset = slot * 3;
    this.scales[offset + 0] = x;
    this.scales[offset + 1] = y;
    this.scales[offset + 2] = z;
    this.markDirty(slot);
  }

  /**
   * 设置统一缩放
   */
  setUniformScale(slot: RenderSlotId, scale: number): void {
    this.setScale(slot, scale, scale, scale);
  }

  /**
   * 获取缩放
   */
  getScale(slot: RenderSlotId): [number, number, number] {
    const offset = slot * 3;
    return [this.scales[offset + 0], this.scales[offset + 1], this.scales[offset + 2]];
  }

  // ============ 颜色操作 ============

  /**
   * 设置颜色
   */
  setColor(slot: RenderSlotId, r: number, g: number, b: number, a: number = 1): void {
    const offset = slot * 4;
    this.colors[offset + 0] = r;
    this.colors[offset + 1] = g;
    this.colors[offset + 2] = b;
    this.colors[offset + 3] = a;

    if (this.gpuSync) {
      this.gpuSync.markDirty(`${this.label}_colors`, offset * 4, 16);
    }
  }

  /**
   * 获取颜色
   */
  getColor(slot: RenderSlotId): [number, number, number, number] {
    const offset = slot * 4;
    return [this.colors[offset + 0], this.colors[offset + 1], this.colors[offset + 2], this.colors[offset + 3]];
  }

  // ============ 层级操作 ============

  /**
   * 设置父级
   */
  setParent(slot: RenderSlotId, parentSlot: RenderSlotId): void {
    this.parentSlots[slot] = parentSlot;
    this.markDirty(slot);
  }

  /**
   * 获取父级
   */
  getParent(slot: RenderSlotId): RenderSlotId {
    return this.parentSlots[slot];
  }

  /**
   * 清除父级
   */
  clearParent(slot: RenderSlotId): void {
    this.parentSlots[slot] = -1;
    this.markDirty(slot);
  }

  // ============ 矩阵操作 ============

  /**
   * 获取世界矩阵视图
   */
  getWorldMatrix(slot: RenderSlotId): Float32Array {
    const offset = slot * 16;
    return this.worldMatrices.subarray(offset, offset + 16);
  }

  /**
   * 获取本地矩阵视图
   */
  getLocalMatrix(slot: RenderSlotId): Float32Array {
    const offset = slot * 16;
    return this.localMatrices.subarray(offset, offset + 16);
  }

  /**
   * 获取所有世界矩阵（用于 GPU 上传）
   */
  getWorldMatrixBuffer(): Float32Array {
    return this.worldMatrices.subarray(0, this.nextSlot * 16);
  }

  // ============ 批量更新 ============

  /**
   * 更新所有脏矩阵
   * @returns 更新的矩阵数量
   */
  updateWorldMatrices(): number {
    let updateCount = 0;

    // 多次遍历确保父级先于子级更新
    let hasUpdates = true;
    let iterations = 0;
    const maxIterations = 100;

    while (hasUpdates && iterations < maxIterations) {
      hasUpdates = false;
      iterations++;

      for (let slot = 0; slot < this.nextSlot; slot++) {
        if (this.dirtyFlags[slot] === 0) {
          continue;
        }

        const parentSlot = this.parentSlots[slot];

        // 如果父级也是脏的，等待下一轮
        if (parentSlot >= 0 && this.dirtyFlags[parentSlot] !== 0) {
          hasUpdates = true;
          continue;
        }

        // 计算本地矩阵
        this.composeLocalMatrix(slot);

        // 计算世界矩阵
        if (parentSlot < 0) {
          // 无父级
          this.copyMatrix(this.localMatrices, slot, this.worldMatrices, slot);
        } else {
          // 有父级
          this.multiplyMatrices(this.worldMatrices, parentSlot, this.localMatrices, slot, this.worldMatrices, slot);
        }

        this.dirtyFlags[slot] = 0;
        updateCount++;
      }
    }

    // 标记 GPU 需要同步
    if (updateCount > 0 && this.gpuSync) {
      this.gpuSync.markFullDirty(`${this.label}_worldMatrices`);
    }

    return updateCount;
  }

  /**
   * 同步到 GPU
   * @returns 同步的 Buffer 数量
   */
  syncToGPU(): number {
    if (!this.gpuSync) {
      return 0;
    }
    return this.gpuSync.syncAll();
  }

  /**
   * 获取 GPU Buffer
   * @param name Buffer 名称（'worldMatrices' | 'colors' | 自定义）
   */
  getGPUBuffer(name: string): any | null {
    if (!this.gpuSync) {
      return null;
    }
    return this.gpuSync.getBuffer(`${this.label}_${name}`);
  }

  // ============ 自定义数据字段 ============

  /**
   * 添加自定义数据字段
   * @param name 字段名称
   * @param stride 每个实体的元素数量
   * @param gpuSync 是否需要 GPU 同步
   */
  addCustomField(name: string, stride: number, gpuSync: boolean = false): void {
    if (this.customFields.has(name)) {
      console.warn(`RenderDataStorage: Field "${name}" already exists`);
      return;
    }

    const data = new Float32Array(this.capacity * stride);

    this.customFields.set(name, {
      name,
      stride,
      data,
      gpuSync,
    });

    // 注册到 GPU 同步
    if (gpuSync && this.gpuSync && this.device) {
      this.gpuSync.registerStorage(`${this.label}_${name}`, data, {
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        hint: 'dynamic',
        label: `${this.label}_${name}`,
        autoResize: true,
      });
    }
  }

  /**
   * 设置自定义字段数据
   */
  setCustomField(slot: RenderSlotId, name: string, values: ArrayLike<number>): void {
    const field = this.customFields.get(name);
    if (!field) {
      console.warn(`RenderDataStorage: Field "${name}" not found`);
      return;
    }

    const offset = slot * field.stride;
    const len = Math.min(values.length, field.stride);
    for (let i = 0; i < len; i++) {
      field.data[offset + i] = values[i];
    }

    if (field.gpuSync && this.gpuSync) {
      this.gpuSync.markDirty(`${this.label}_${name}`, offset * 4, field.stride * 4);
    }
  }

  /**
   * 获取自定义字段数据
   */
  getCustomField(slot: RenderSlotId, name: string): Float32Array | null {
    const field = this.customFields.get(name);
    if (!field) {
      return null;
    }

    const offset = slot * field.stride;
    return field.data.subarray(offset, offset + field.stride);
  }

  // ============ 帧结束清理 ============

  /**
   * 帧结束清理
   * @remarks 应在每帧渲染后调用
   */
  endFrame(): void {
    if (this.changeTracker) {
      this.changeTracker.clearAll();
    }
  }

  // ============ 统计信息 ============

  /**
   * 获取统计信息
   */
  getStats(): {
    capacity: number;
    count: number;
    freeSlots: number;
    memoryBytes: number;
    gpuStats: any;
    changeStats: any;
  } {
    const coreMemory =
      this.positions.byteLength +
      this.rotations.byteLength +
      this.scales.byteLength +
      this.localMatrices.byteLength +
      this.worldMatrices.byteLength +
      this.parentSlots.byteLength +
      this.dirtyFlags.byteLength +
      this.colors.byteLength;

    let customMemory = 0;
    for (const field of this.customFields.values()) {
      customMemory += field.data.byteLength;
    }

    return {
      capacity: this.capacity,
      count: this.count,
      freeSlots: this.freeSlots.length,
      memoryBytes: coreMemory + customMemory,
      gpuStats: this.gpuSync?.getStats() ?? null,
      changeStats: this.changeTracker?.getStats() ?? null,
    };
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.gpuSync?.destroy();
    this.entityToSlot.clear();
    this.slotToEntity.length = 0;
    this.freeSlots.length = 0;
    this.customFields.clear();
  }

  // ============ 私有方法 ============

  /**
   * 标记槽位为脏
   */
  private markDirty(slot: RenderSlotId): void {
    this.dirtyFlags[slot] = 1;

    // 标记变化
    if (this.changeTracker) {
      const entity = this.slotToEntity[slot];
      if (entity !== undefined) {
        this.changeTracker.markChanged(entity, RenderDataStorage as any, ChangeType.Modified);
      }
    }
  }

  /**
   * 重置槽位数据
   */
  private resetSlot(slot: RenderSlotId): void {
    // 位置归零
    const posOffset = slot * 3;
    this.positions[posOffset + 0] = 0;
    this.positions[posOffset + 1] = 0;
    this.positions[posOffset + 2] = 0;

    // 旋转为单位四元数
    const rotOffset = slot * 4;
    this.rotations[rotOffset + 0] = 0;
    this.rotations[rotOffset + 1] = 0;
    this.rotations[rotOffset + 2] = 0;
    this.rotations[rotOffset + 3] = 1;

    // 缩放为 1
    const scaleOffset = slot * 3;
    this.scales[scaleOffset + 0] = 1;
    this.scales[scaleOffset + 1] = 1;
    this.scales[scaleOffset + 2] = 1;

    // 颜色为白色
    const colorOffset = slot * 4;
    this.colors[colorOffset + 0] = 1;
    this.colors[colorOffset + 1] = 1;
    this.colors[colorOffset + 2] = 1;
    this.colors[colorOffset + 3] = 1;

    // 无父级
    this.parentSlots[slot] = -1;

    // 单位矩阵
    this.setIdentityMatrix(this.localMatrices, slot);
    this.setIdentityMatrix(this.worldMatrices, slot);

    // 标记脏
    this.dirtyFlags[slot] = 1;
  }

  /**
   * 设置单位矩阵
   */
  private setIdentityMatrix(buffer: Float32Array, slot: number): void {
    const offset = slot * 16;
    buffer.fill(0, offset, offset + 16);
    buffer[offset + 0] = 1;
    buffer[offset + 5] = 1;
    buffer[offset + 10] = 1;
    buffer[offset + 15] = 1;
  }

  /**
   * 复制矩阵
   */
  private copyMatrix(src: Float32Array, srcSlot: number, dst: Float32Array, dstSlot: number): void {
    const srcOffset = srcSlot * 16;
    const dstOffset = dstSlot * 16;
    for (let i = 0; i < 16; i++) {
      dst[dstOffset + i] = src[srcOffset + i];
    }
  }

  /**
   * 从 TRS 组合本地矩阵
   */
  private composeLocalMatrix(slot: number): void {
    const posOffset = slot * 3;
    const rotOffset = slot * 4;
    const scaleOffset = slot * 3;
    const matOffset = slot * 16;

    const tx = this.positions[posOffset + 0];
    const ty = this.positions[posOffset + 1];
    const tz = this.positions[posOffset + 2];

    const qx = this.rotations[rotOffset + 0];
    const qy = this.rotations[rotOffset + 1];
    const qz = this.rotations[rotOffset + 2];
    const qw = this.rotations[rotOffset + 3];

    const sx = this.scales[scaleOffset + 0];
    const sy = this.scales[scaleOffset + 1];
    const sz = this.scales[scaleOffset + 2];

    // 四元数转旋转矩阵
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
    this.localMatrices[matOffset + 0] = (1 - (yy + zz)) * sx;
    this.localMatrices[matOffset + 1] = (xy + wz) * sx;
    this.localMatrices[matOffset + 2] = (xz - wy) * sx;
    this.localMatrices[matOffset + 3] = 0;

    this.localMatrices[matOffset + 4] = (xy - wz) * sy;
    this.localMatrices[matOffset + 5] = (1 - (xx + zz)) * sy;
    this.localMatrices[matOffset + 6] = (yz + wx) * sy;
    this.localMatrices[matOffset + 7] = 0;

    this.localMatrices[matOffset + 8] = (xz + wy) * sz;
    this.localMatrices[matOffset + 9] = (yz - wx) * sz;
    this.localMatrices[matOffset + 10] = (1 - (xx + yy)) * sz;
    this.localMatrices[matOffset + 11] = 0;

    this.localMatrices[matOffset + 12] = tx;
    this.localMatrices[matOffset + 13] = ty;
    this.localMatrices[matOffset + 14] = tz;
    this.localMatrices[matOffset + 15] = 1;
  }

  /**
   * 矩阵乘法
   */
  private multiplyMatrices(
    a: Float32Array,
    aSlot: number,
    b: Float32Array,
    bSlot: number,
    out: Float32Array,
    outSlot: number
  ): void {
    const ao = aSlot * 16;
    const bo = bSlot * 16;
    const co = outSlot * 16;

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

    out[co + 0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
    out[co + 1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
    out[co + 2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
    out[co + 3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;

    out[co + 4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
    out[co + 5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
    out[co + 6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
    out[co + 7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;

    out[co + 8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
    out[co + 9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
    out[co + 10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
    out[co + 11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;

    out[co + 12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
    out[co + 13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
    out[co + 14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
    out[co + 15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
  }

  /**
   * 扩容
   */
  private grow(): void {
    const newCapacity = this.capacity * 2;

    // 扩容所有数组
    const newPositions = new Float32Array(newCapacity * 3);
    newPositions.set(this.positions);
    this.positions = newPositions;

    const newRotations = new Float32Array(newCapacity * 4);
    newRotations.set(this.rotations);
    // 初始化新增部分为单位四元数
    for (let i = this.capacity; i < newCapacity; i++) {
      newRotations[i * 4 + 3] = 1;
    }
    this.rotations = newRotations;

    const newScales = new Float32Array(newCapacity * 3);
    newScales.set(this.scales);
    // 初始化新增部分为 1
    for (let i = this.capacity; i < newCapacity; i++) {
      newScales[i * 3 + 0] = 1;
      newScales[i * 3 + 1] = 1;
      newScales[i * 3 + 2] = 1;
    }
    this.scales = newScales;

    const newLocalMatrices = new Float32Array(newCapacity * 16);
    newLocalMatrices.set(this.localMatrices);
    for (let i = this.capacity; i < newCapacity; i++) {
      this.setIdentityMatrix(newLocalMatrices, i);
    }
    this.localMatrices = newLocalMatrices;

    const newWorldMatrices = new Float32Array(newCapacity * 16);
    newWorldMatrices.set(this.worldMatrices);
    for (let i = this.capacity; i < newCapacity; i++) {
      this.setIdentityMatrix(newWorldMatrices, i);
    }
    this.worldMatrices = newWorldMatrices;

    const newParentSlots = new Int32Array(newCapacity).fill(-1);
    newParentSlots.set(this.parentSlots);
    this.parentSlots = newParentSlots;

    const newDirtyFlags = new Uint8Array(newCapacity);
    newDirtyFlags.set(this.dirtyFlags);
    this.dirtyFlags = newDirtyFlags;

    const newColors = new Float32Array(newCapacity * 4);
    newColors.set(this.colors);
    // 初始化新增部分为白色
    for (let i = this.capacity; i < newCapacity; i++) {
      newColors[i * 4 + 0] = 1;
      newColors[i * 4 + 1] = 1;
      newColors[i * 4 + 2] = 1;
      newColors[i * 4 + 3] = 1;
    }
    this.colors = newColors;

    // 扩容自定义字段
    for (const field of this.customFields.values()) {
      const newData = new Float32Array(newCapacity * field.stride);
      newData.set(field.data);
      field.data = newData;

      // 更新 GPU 同步源
      if (field.gpuSync && this.gpuSync) {
        this.gpuSync.updateSource(`${this.label}_${field.name}`, newData);
      }
    }

    // 更新 GPU 同步源
    if (this.gpuSync) {
      this.gpuSync.updateSource(`${this.label}_worldMatrices`, this.worldMatrices);
      this.gpuSync.updateSource(`${this.label}_colors`, this.colors);
    }

    this.capacity = newCapacity;
  }
}

/**
 * 全局渲染数据存储单例
 */
let globalRenderData: RenderDataStorage | null = null;

/**
 * 获取全局渲染数据存储
 */
export function getGlobalRenderData(options?: RenderDataStorageOptions): RenderDataStorage {
  if (!globalRenderData) {
    globalRenderData = new RenderDataStorage(options);
  }
  return globalRenderData;
}

/**
 * 重置全局渲染数据存储
 */
export function resetGlobalRenderData(): void {
  globalRenderData?.destroy();
  globalRenderData = null;
}
