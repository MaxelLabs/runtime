/**
 * instancing/InstanceBuffer.ts
 * 实例数据缓冲区管理器
 *
 * 负责管理实例化渲染的 GPU 缓冲区和数据更新。
 * 提供高效的批量更新接口，避免频繁的 GPU 数据传输。
 *
 * 核心特性：
 * - 预分配 CPU 和 GPU 缓冲区，避免渲染循环中的内存分配
 * - 支持单个实例和批量实例的高效更新
 * - 动态扩容支持（resize）
 * - 详细的统计信息（内存使用、实例数等）
 *
 * @example
 * ```typescript
 * const buffer = runner.track(new InstanceBuffer(runner.device, {
 *   maxInstances: 10000,
 *   instanceLayout: getStandardInstanceLayout(2),
 *   dynamic: true,
 *   label: 'MyInstanceBuffer',
 * }));
 *
 * // 更新单个实例
 * const instanceData = new Float32Array(20); // 80 bytes = 20 floats
 * // [0-15]: mat4 modelMatrix
 * // [16-19]: vec4 color
 * buffer.updateInstance(0, instanceData);
 *
 * // 批量更新
 * const batchData = new Float32Array(100 * 20); // 100 instances
 * buffer.updateInstances(0, batchData, 100);
 *
 * // 获取统计信息
 * const stats = buffer.getStats();
 * console.log(`Using ${stats.usage * 100}% of buffer capacity`);
 * ```
 */

import { MSpec } from '@maxellabs/core';
import type { InstancedRenderOptions, InstanceStats, InstanceAttribute } from './types';
import { calculateInstanceStride } from './types';

export class InstanceBuffer {
  private device: MSpec.IRHIDevice;
  private gpuBuffer: MSpec.IRHIBuffer;
  private cpuBuffer: Float32Array;

  private maxInstances: number;
  private currentInstanceCount: number = 0;
  private strideBytes: number;
  private strideFloats: number;
  private dynamic: boolean;
  private label: string;

  private instanceLayout: InstanceAttribute[];

  /**
   * 创建实例缓冲区
   *
   * @param device RHI 设备
   * @param options 配置选项
   */
  constructor(device: MSpec.IRHIDevice, options: InstancedRenderOptions) {
    this.device = device;
    this.maxInstances = options.maxInstances ?? 10000;
    this.instanceLayout = options.instanceLayout;
    this.dynamic = options.dynamic ?? true;
    this.label = options.label ?? 'InstanceBuffer';

    // 计算步长
    this.strideBytes = calculateInstanceStride(this.instanceLayout);
    this.strideFloats = this.strideBytes / 4;

    if (this.strideBytes === 0) {
      throw new Error('[InstanceBuffer] Instance layout is empty or invalid');
    }

    // 预分配 CPU 缓冲区
    const totalFloats = this.maxInstances * this.strideFloats;
    this.cpuBuffer = new Float32Array(totalFloats);

    // 创建 GPU 缓冲区
    this.gpuBuffer = device.createBuffer({
      label: `${this.label}_GPU`,
      size: this.maxInstances * this.strideBytes,
      usage: MSpec.RHIBufferUsage.VERTEX,
      hint: this.dynamic ? 'dynamic' : 'static',
    });
  }

  /**
   * 更新单个实例的数据
   *
   * @param index 实例索引（0-based）
   * @param data 实例数据（长度必须等于 strideFloats）
   *
   * @example
   * ```typescript
   * // 标准布局：80 bytes = 20 floats (mat4 + vec4)
   * const data = new Float32Array(20);
   * // 设置 modelMatrix (16 floats)
   * data.set([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1], 0);
   * // 设置 color (4 floats)
   * data.set([1, 0, 0, 1], 16);
   * buffer.updateInstance(0, data);
   * ```
   */
  updateInstance(index: number, data: Float32Array): void {
    if (index < 0 || index >= this.maxInstances) {
      console.error(`[InstanceBuffer] Index out of range: ${index} (max: ${this.maxInstances - 1})`);
      return;
    }

    if (data.length !== this.strideFloats) {
      console.error(`[InstanceBuffer] Data length mismatch: expected ${this.strideFloats}, got ${data.length}`);
      return;
    }

    // 更新 CPU 缓冲区
    const offset = index * this.strideFloats;
    this.cpuBuffer.set(data, offset);

    // 更新 GPU 缓冲区（单个实例）
    this.gpuBuffer.update(data as unknown as BufferSource, index * this.strideBytes);

    // 更新实例计数
    if (index >= this.currentInstanceCount) {
      this.currentInstanceCount = index + 1;
    }
  }

  /**
   * 批量更新多个实例的数据（高效）
   *
   * @param startIndex 起始实例索引
   * @param data 实例数据数组（长度 = count * strideFloats）
   * @param count 实例数量
   *
   * @example
   * ```typescript
   * // 批量更新 100 个实例
   * const batchData = new Float32Array(100 * 20);
   * for (let i = 0; i < 100; i++) {
   *   const offset = i * 20;
   *   // 设置第 i 个实例的数据
   *   batchData.set([...matrixData, ...colorData], offset);
   * }
   * buffer.updateInstances(0, batchData, 100);
   * ```
   */
  updateInstances(startIndex: number, data: Float32Array, count: number): void {
    if (startIndex < 0 || startIndex + count > this.maxInstances) {
      console.error(
        `[InstanceBuffer] Batch range out of bounds: ` + `start=${startIndex}, count=${count}, max=${this.maxInstances}`
      );
      return;
    }

    const expectedLength = count * this.strideFloats;
    if (data.length < expectedLength) {
      console.error(
        `[InstanceBuffer] Batch data length insufficient: ` + `expected ${expectedLength}, got ${data.length}`
      );
      return;
    }

    // 更新 CPU 缓冲区
    const cpuOffset = startIndex * this.strideFloats;
    this.cpuBuffer.set(data.subarray(0, expectedLength), cpuOffset);

    // 批量更新 GPU 缓冲区
    this.gpuBuffer.update(data.subarray(0, expectedLength) as unknown as BufferSource, startIndex * this.strideBytes);

    // 更新实例计数
    const endIndex = startIndex + count;
    if (endIndex > this.currentInstanceCount) {
      this.currentInstanceCount = endIndex;
    }
  }

  /**
   * 更新全部实例数据（最高效）
   *
   * @param data 所有实例数据（长度 = count * strideFloats）
   * @param count 实例数量
   *
   * @example
   * ```typescript
   * const allData = new Float32Array(10000 * 20);
   * // ... 填充数据
   * buffer.updateAll(allData, 10000);
   * ```
   */
  updateAll(data: Float32Array, count: number): void {
    this.updateInstances(0, data, count);
  }

  /**
   * 动态扩容缓冲区
   * 注意：会复制现有数据到新缓冲区
   *
   * @param newMaxInstances 新的最大实例数
   */
  resize(newMaxInstances: number): void {
    if (newMaxInstances <= this.maxInstances) {
      console.warn(
        `[InstanceBuffer] Resize ignored: new size (${newMaxInstances}) ` + `<= current size (${this.maxInstances})`
      );
      return;
    }

    console.info(`[InstanceBuffer] Resizing from ${this.maxInstances} to ${newMaxInstances} instances`);

    // 保存旧数据
    const oldCpuBuffer = this.cpuBuffer;
    const oldInstanceCount = this.currentInstanceCount;

    // 创建新的 CPU 缓冲区
    const newTotalFloats = newMaxInstances * this.strideFloats;
    this.cpuBuffer = new Float32Array(newTotalFloats);
    this.cpuBuffer.set(oldCpuBuffer.subarray(0, oldInstanceCount * this.strideFloats));

    // 创建新的 GPU 缓冲区
    const oldGpuBuffer = this.gpuBuffer;

    this.gpuBuffer = this.device.createBuffer({
      label: `${this.label}_GPU_Resized`,
      size: newMaxInstances * this.strideBytes,
      usage: MSpec.RHIBufferUsage.VERTEX,
      hint: this.dynamic ? 'dynamic' : 'static',
    });

    // 复制旧数据到新 GPU 缓冲区
    if (oldInstanceCount > 0) {
      this.gpuBuffer.update(
        this.cpuBuffer.subarray(0, oldInstanceCount * this.strideFloats) as unknown as BufferSource,
        0
      );
    }

    // 销毁旧 GPU 缓冲区
    oldGpuBuffer.destroy();

    this.maxInstances = newMaxInstances;

    console.info(`[InstanceBuffer] Resize complete: newSize=${(newMaxInstances * this.strideBytes) / 1024}KB`);
  }

  /**
   * 获取 GPU 缓冲区（用于绑定到渲染管线）
   *
   * @returns GPU 缓冲区句柄
   */
  getBuffer(): MSpec.IRHIBuffer {
    return this.gpuBuffer;
  }

  /**
   * 获取当前实例数
   *
   * @returns 当前已更新的实例数量
   */
  getInstanceCount(): number {
    return this.currentInstanceCount;
  }

  /**
   * 设置当前实例数（用于手动控制渲染的实例数量）
   *
   * @param count 实例数量
   */
  setInstanceCount(count: number): void {
    if (count < 0 || count > this.maxInstances) {
      console.error(`[InstanceBuffer] Invalid instance count: ${count} (max: ${this.maxInstances})`);
      return;
    }
    this.currentInstanceCount = count;
  }

  /**
   * 获取统计信息
   *
   * @returns 实例缓冲区统计信息
   */
  getStats(): InstanceStats {
    return {
      instanceCount: this.currentInstanceCount,
      maxInstances: this.maxInstances,
      bufferSize: this.maxInstances * this.strideBytes,
      usage: this.currentInstanceCount / this.maxInstances,
      strideBytes: this.strideBytes,
    };
  }

  /**
   * 获取实例布局（用于创建渲染管线）
   *
   * @returns 实例属性布局数组
   */
  getLayout(): InstanceAttribute[] {
    return this.instanceLayout;
  }

  /**
   * 获取步长（字节数）
   *
   * @returns 每实例数据的字节数
   */
  getStrideBytes(): number {
    return this.strideBytes;
  }

  /**
   * 清空缓冲区（重置实例计数）
   * 不会清除数据，只是将实例计数归零
   */
  clear(): void {
    this.currentInstanceCount = 0;
  }

  /**
   * 销毁资源
   */
  destroy(): void {
    console.info(`[InstanceBuffer] Destroying: ${this.label}`);
    this.gpuBuffer.destroy();
  }
}
