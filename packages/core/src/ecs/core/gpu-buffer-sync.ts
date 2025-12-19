/**
 * GPU Buffer 同步系统
 * 负责将 ECS 数据高效同步到 GPU
 *
 * @remarks
 * **设计目标**:
 * - 零拷贝：TypedArray 直接上传到 GPU
 * - 增量更新：只同步变化的数据
 * - 批量操作：合并多个小更新为一次 GPU 调用
 * - 双缓冲：避免 GPU/CPU 竞争
 *
 * **使用场景**:
 * - Transform 矩阵批量上传（Instancing）
 * - 粒子系统数据更新
 * - 骨骼动画矩阵
 * - 任何需要频繁更新的渲染数据
 *
 * @example
 * ```typescript
 * // 创建 GPU 同步管理器
 * const gpuSync = new GPUBufferSync(device);
 *
 * // 注册 Transform 数据
 * gpuSync.registerStorage('transforms', transformPool.getWorldMatrixBuffer(), {
 *   usage: RHIBufferUsage.UNIFORM | RHIBufferUsage.COPY_DST,
 *   hint: 'dynamic'
 * });
 *
 * // 每帧同步
 * gpuSync.sync('transforms');
 *
 * // 获取 GPU Buffer 用于渲染
 * const buffer = gpuSync.getBuffer('transforms');
 * ```
 */

import type { TypedArrayInstance } from './typed-component-storage';

/**
 * GPU Buffer 使用标志（与 RHI 兼容）
 */
export enum GPUBufferUsage {
  /** 顶点缓冲区 */
  VERTEX = 0x0020,
  /** 索引缓冲区 */
  INDEX = 0x0010,
  /** Uniform 缓冲区 */
  UNIFORM = 0x0040,
  /** 存储缓冲区 */
  STORAGE = 0x0080,
  /** 可复制目标 */
  COPY_DST = 0x0008,
  /** 可复制源 */
  COPY_SRC = 0x0004,
}

/**
 * Buffer 同步选项
 */
export interface BufferSyncOptions {
  /** Buffer 用途 */
  usage: number;
  /** 使用提示 */
  hint?: 'static' | 'dynamic' | 'stream';
  /** 标签 */
  label?: string;
  /** 是否启用双缓冲 */
  doubleBuffer?: boolean;
  /** 自动扩容 */
  autoResize?: boolean;
}

/**
 * 脏区域（用于增量更新）
 */
interface DirtyRegion {
  /** 起始偏移（字节） */
  offset: number;
  /** 大小（字节） */
  size: number;
}

/**
 * 已注册的 Buffer 信息
 */
interface RegisteredBuffer {
  /** CPU 端数据源 */
  source: TypedArrayInstance;
  /** GPU Buffer（由 RHI 创建） */
  gpuBuffer: any | null;
  /** 备用 Buffer（双缓冲） */
  backBuffer: any | null;
  /** 同步选项 */
  options: BufferSyncOptions;
  /** 脏区域列表 */
  dirtyRegions: DirtyRegion[];
  /** 是否完全脏（需要全量更新） */
  fullDirty: boolean;
  /** 当前 Buffer 大小 */
  currentSize: number;
  /** 上次同步的数据版本 */
  lastSyncVersion: number;
  /** 当前数据版本 */
  currentVersion: number;
}

/**
 * RHI Device 接口（最小化依赖）
 */
export interface IRHIDeviceMinimal {
  createBuffer(descriptor: { size: number; usage: number; hint?: 'static' | 'dynamic' | 'stream'; label?: string }): {
    update(data: BufferSource, offset?: number): void;
    destroy(): void;
  };
}

/**
 * GPU Buffer 同步管理器
 */
export class GPUBufferSync {
  /** RHI Device */
  private device: IRHIDeviceMinimal | null = null;

  /** 已注册的 Buffer */
  private buffers: Map<string, RegisteredBuffer> = new Map();

  /** 全局版本号（用于检测变化） */
  private globalVersion: number = 0;

  /** 是否已初始化 */
  private initialized: boolean = false;

  /**
   * 初始化（延迟绑定 Device）
   * @param device RHI Device
   */
  initialize(device: IRHIDeviceMinimal): void {
    this.device = device;
    this.initialized = true;

    // 为已注册的 Buffer 创建 GPU 资源
    for (const [name, buffer] of this.buffers) {
      this.createGPUBuffer(name, buffer);
    }
  }

  /**
   * 注册数据源
   * @param name 唯一名称
   * @param source CPU 端 TypedArray
   * @param options 同步选项
   */
  registerStorage(name: string, source: TypedArrayInstance, options: BufferSyncOptions): void {
    if (this.buffers.has(name)) {
      console.warn(`GPUBufferSync: Buffer "${name}" already registered, replacing...`);
      this.unregisterStorage(name);
    }

    const buffer: RegisteredBuffer = {
      source,
      gpuBuffer: null,
      backBuffer: null,
      options,
      dirtyRegions: [],
      fullDirty: true,
      currentSize: source.byteLength,
      lastSyncVersion: -1,
      currentVersion: 0,
    };

    this.buffers.set(name, buffer);

    // 如果已初始化，立即创建 GPU Buffer
    if (this.initialized && this.device) {
      this.createGPUBuffer(name, buffer);
    }
  }

  /**
   * 取消注册
   * @param name Buffer 名称
   */
  unregisterStorage(name: string): void {
    const buffer = this.buffers.get(name);
    if (!buffer) {
      return;
    }

    // 销毁 GPU 资源
    buffer.gpuBuffer?.destroy();
    buffer.backBuffer?.destroy();

    this.buffers.delete(name);
  }

  /**
   * 更新数据源引用（当 TypedArray 扩容时调用）
   * @param name Buffer 名称
   * @param newSource 新的 TypedArray
   */
  updateSource(name: string, newSource: TypedArrayInstance): void {
    const buffer = this.buffers.get(name);
    if (!buffer) {
      console.warn(`GPUBufferSync: Buffer "${name}" not found`);
      return;
    }

    buffer.source = newSource;
    buffer.fullDirty = true;
    buffer.currentVersion++;

    // 检查是否需要扩容 GPU Buffer
    if (newSource.byteLength > buffer.currentSize && buffer.options.autoResize) {
      this.resizeGPUBuffer(name, buffer, newSource.byteLength);
    }
  }

  /**
   * 标记脏区域（增量更新）
   * @param name Buffer 名称
   * @param offset 起始偏移（字节）
   * @param size 大小（字节）
   */
  markDirty(name: string, offset: number, size: number): void {
    const buffer = this.buffers.get(name);
    if (!buffer) {
      return;
    }

    // 合并相邻或重叠的脏区域
    const newRegion: DirtyRegion = { offset, size };
    buffer.dirtyRegions = this.mergeRegions([...buffer.dirtyRegions, newRegion]);
    buffer.currentVersion++;
  }

  /**
   * 标记整个 Buffer 为脏
   * @param name Buffer 名称
   */
  markFullDirty(name: string): void {
    const buffer = this.buffers.get(name);
    if (!buffer) {
      return;
    }

    buffer.fullDirty = true;
    buffer.dirtyRegions = [];
    buffer.currentVersion++;
  }

  /**
   * 同步单个 Buffer 到 GPU
   * @param name Buffer 名称
   * @returns 是否有数据被同步
   */
  sync(name: string): boolean {
    const buffer = this.buffers.get(name);
    if (!buffer || !buffer.gpuBuffer) {
      return false;
    }

    // 检查是否需要同步
    if (buffer.lastSyncVersion === buffer.currentVersion && !buffer.fullDirty) {
      return false;
    }

    // 检查数据源大小变化
    if (buffer.source.byteLength > buffer.currentSize) {
      if (buffer.options.autoResize) {
        this.resizeGPUBuffer(name, buffer, buffer.source.byteLength);
      } else {
        console.warn(`GPUBufferSync: Buffer "${name}" source size exceeds GPU buffer size`);
      }
    }

    // 执行同步
    if (buffer.fullDirty) {
      // 全量更新
      buffer.gpuBuffer.update(buffer.source, 0);
      buffer.fullDirty = false;
      buffer.dirtyRegions = [];
    } else if (buffer.dirtyRegions.length > 0) {
      // 增量更新
      for (const region of buffer.dirtyRegions) {
        const view = new Uint8Array(buffer.source.buffer, buffer.source.byteOffset + region.offset, region.size);
        buffer.gpuBuffer.update(view, region.offset);
      }
      buffer.dirtyRegions = [];
    }

    buffer.lastSyncVersion = buffer.currentVersion;
    return true;
  }

  /**
   * 同步所有 Buffer
   * @returns 同步的 Buffer 数量
   */
  syncAll(): number {
    let count = 0;
    for (const name of this.buffers.keys()) {
      if (this.sync(name)) {
        count++;
      }
    }
    return count;
  }

  /**
   * 获取 GPU Buffer
   * @param name Buffer 名称
   * @returns GPU Buffer 或 null
   */
  getBuffer(name: string): any | null {
    return this.buffers.get(name)?.gpuBuffer ?? null;
  }

  /**
   * 获取 Buffer 统计信息
   * @param name Buffer 名称
   */
  getBufferStats(name: string): {
    cpuSize: number;
    gpuSize: number;
    dirtyRegions: number;
    needsSync: boolean;
  } | null {
    const buffer = this.buffers.get(name);
    if (!buffer) {
      return null;
    }

    return {
      cpuSize: buffer.source.byteLength,
      gpuSize: buffer.currentSize,
      dirtyRegions: buffer.dirtyRegions.length,
      needsSync: buffer.fullDirty || buffer.dirtyRegions.length > 0,
    };
  }

  /**
   * 获取全局统计信息
   */
  getStats(): {
    totalBuffers: number;
    totalCPUMemory: number;
    totalGPUMemory: number;
    buffersNeedingSync: number;
  } {
    let totalCPUMemory = 0;
    let totalGPUMemory = 0;
    let buffersNeedingSync = 0;

    for (const buffer of this.buffers.values()) {
      totalCPUMemory += buffer.source.byteLength;
      totalGPUMemory += buffer.currentSize;
      if (buffer.fullDirty || buffer.dirtyRegions.length > 0) {
        buffersNeedingSync++;
      }
    }

    return {
      totalBuffers: this.buffers.size,
      totalCPUMemory,
      totalGPUMemory,
      buffersNeedingSync,
    };
  }

  /**
   * 销毁所有资源
   */
  destroy(): void {
    for (const buffer of this.buffers.values()) {
      buffer.gpuBuffer?.destroy();
      buffer.backBuffer?.destroy();
    }
    this.buffers.clear();
    this.device = null;
    this.initialized = false;
  }

  /**
   * 创建 GPU Buffer
   */
  private createGPUBuffer(name: string, buffer: RegisteredBuffer): void {
    if (!this.device) {
      return;
    }

    const size = Math.max(buffer.source.byteLength, 256); // 最小 256 字节

    buffer.gpuBuffer = this.device.createBuffer({
      size,
      usage: buffer.options.usage,
      hint: buffer.options.hint,
      label: buffer.options.label ?? `ECS_${name}`,
    });

    buffer.currentSize = size;

    // 双缓冲
    if (buffer.options.doubleBuffer) {
      buffer.backBuffer = this.device.createBuffer({
        size,
        usage: buffer.options.usage,
        hint: buffer.options.hint,
        label: `${buffer.options.label ?? `ECS_${name}`}_back`,
      });
    }
  }

  /**
   * 扩容 GPU Buffer
   */
  private resizeGPUBuffer(name: string, buffer: RegisteredBuffer, newSize: number): void {
    if (!this.device) {
      return;
    }

    // 销毁旧 Buffer
    buffer.gpuBuffer?.destroy();
    buffer.backBuffer?.destroy();

    // 创建新 Buffer（2 倍扩容）
    const size = Math.max(newSize * 2, 256);

    buffer.gpuBuffer = this.device.createBuffer({
      size,
      usage: buffer.options.usage,
      hint: buffer.options.hint,
      label: buffer.options.label ?? `ECS_${name}`,
    });

    buffer.currentSize = size;
    buffer.fullDirty = true;

    if (buffer.options.doubleBuffer) {
      buffer.backBuffer = this.device.createBuffer({
        size,
        usage: buffer.options.usage,
        hint: buffer.options.hint,
        label: `${buffer.options.label ?? `ECS_${name}`}_back`,
      });
    }
  }

  /**
   * 合并脏区域
   */
  private mergeRegions(regions: DirtyRegion[]): DirtyRegion[] {
    if (regions.length <= 1) {
      return regions;
    }

    // 按偏移排序
    regions.sort((a, b) => a.offset - b.offset);

    const merged: DirtyRegion[] = [];
    let current = regions[0];

    for (let i = 1; i < regions.length; i++) {
      const next = regions[i];
      const currentEnd = current.offset + current.size;

      // 检查是否重叠或相邻
      if (next.offset <= currentEnd) {
        // 合并
        const newEnd = Math.max(currentEnd, next.offset + next.size);
        current = {
          offset: current.offset,
          size: newEnd - current.offset,
        };
      } else {
        merged.push(current);
        current = next;
      }
    }

    merged.push(current);
    return merged;
  }
}

/**
 * 全局 GPU 同步管理器单例
 */
let globalGPUSync: GPUBufferSync | null = null;

/**
 * 获取全局 GPU 同步管理器
 */
export function getGlobalGPUSync(): GPUBufferSync {
  if (!globalGPUSync) {
    globalGPUSync = new GPUBufferSync();
  }
  return globalGPUSync;
}

/**
 * 重置全局 GPU 同步管理器
 */
export function resetGlobalGPUSync(): void {
  globalGPUSync?.destroy();
  globalGPUSync = null;
}
