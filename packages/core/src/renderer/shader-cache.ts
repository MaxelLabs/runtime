/**
 * shader-cache.ts
 * ShaderCache 着色器缓存管理器
 *
 * @packageDocumentation
 *
 * @remarks
 * 管理着色器程序的生命周期和缓存，提供：
 * - 基于哈希的缓存查找（避免重复编译）
 * - 引用计数管理（自动释放未使用的着色器）
 * - 大小限制和 LRU 淘汰（防止内存泄漏）
 * - 统计接口（监控缓存大小）
 *
 * ## 缓存策略
 * - 键：着色器源码的哈希值（由 ShaderCompiler 计算）
 * - 值：ShaderProgram 实例 + 最后访问时间
 * - 生命周期：当 refCount 降为 0 时自动从缓存移除
 * - 大小限制：默认 100 个程序，超过时 LRU 淘汰（refCount=0 的程序）
 */

import type { ShaderProgram } from './shader-program';

/**
 * 缓存项（内部使用）
 */
interface CacheEntry {
  program: ShaderProgram;
  lastAccessTime: number;
}

/**
 * 着色器缓存配置
 */
export interface ShaderCacheConfig {
  /**
   * 最大缓存数量（默认 100）
   */
  maxSize?: number;
}

/**
 * 着色器缓存
 *
 * @remarks
 * 管理着色器程序的生命周期和缓存，带 LRU 淘汰策略。
 *
 * ## 缓存键
 * - 使用着色器源码的哈希值作为键
 * - 由 ShaderCompiler 计算并传入
 *
 * ## 引用计数 + LRU
 * - refCount > 0：正在使用，不会被淘汰
 * - refCount = 0：可被淘汰，按 lastAccessTime 排序
 * - 当缓存满时，自动淘汰最久未使用的 refCount=0 程序
 *
 * ## 示例
 * ```typescript
 * const cache = new ShaderCache({ maxSize: 50 });
 *
 * // 缓存程序
 * cache.set('hash123', program);
 *
 * // 获取程序（自动更新 lastAccessTime）
 * const cached = cache.get('hash123');
 *
 * // 释放程序（refCount--）
 * cache.release('hash123');
 * ```
 */
export class ShaderCache {
  /**
   * 哈希 → 缓存项映射
   * @internal
   */
  private cache: Map<string, CacheEntry> = new Map();

  /**
   * 最大缓存大小
   * @internal
   */
  private maxSize: number;

  /**
   * 创建着色器缓存
   *
   * @param config 缓存配置
   */
  constructor(config: ShaderCacheConfig = {}) {
    this.maxSize = config.maxSize ?? 100;
  }

  /**
   * 获取缓存的着色器程序
   *
   * @param hash 着色器源码哈希
   * @returns 着色器程序，如果不存在返回 undefined
   *
   * @remarks
   * 此方法不会自动递增 refCount，但会更新 lastAccessTime。
   *
   * @example
   * ```typescript
   * const program = cache.get('hash123');
   * if (program) {
   *   program.refCount++; // 手动递增引用计数
   *   return program;
   * }
   * ```
   */
  get(hash: string): ShaderProgram | undefined {
    const entry = this.cache.get(hash);
    if (entry) {
      entry.lastAccessTime = performance.now();
      return entry.program;
    }
    return undefined;
  }

  /**
   * 缓存着色器程序
   *
   * @param hash 着色器源码哈希
   * @param program 着色器程序
   *
   * @remarks
   * 如果缓存已满，会先尝试 LRU 淘汰 refCount=0 的程序。
   * 如果哈希已存在，会覆盖旧值（通常不应发生）。
   *
   * @example
   * ```typescript
   * const program = new ShaderProgram('hash123', vertexModule, fragmentModule);
   * cache.set('hash123', program);
   * ```
   */
  set(hash: string, program: ShaderProgram): void {
    // 如果已存在，直接更新
    if (this.cache.has(hash)) {
      this.cache.set(hash, {
        program,
        lastAccessTime: performance.now(),
      });
      return;
    }

    // 检查缓存是否已满
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    // 添加新条目
    this.cache.set(hash, {
      program,
      lastAccessTime: performance.now(),
    });
  }

  /**
   * 检查缓存是否存在
   *
   * @param hash 着色器源码哈希
   * @returns 是否存在
   *
   * @example
   * ```typescript
   * if (cache.has('hash123')) {
   *   // 使用缓存
   * } else {
   *   // 编译新程序
   * }
   * ```
   */
  has(hash: string): boolean {
    return this.cache.has(hash);
  }

  /**
   * 释放着色器程序（减少引用计数）
   *
   * @param hash 着色器源码哈希
   * @returns 是否完全释放（refCount = 0）
   *
   * @remarks
   * 引用计数递减，如果降为 0 则：
   * 1. 调用 program.destroy() 释放 GPU 资源
   * 2. 从缓存中移除
   *
   * @example
   * ```typescript
   * const fullyReleased = cache.release('hash123');
   * if (fullyReleased) {
   *   console.log('Program destroyed and removed from cache');
   * }
   * ```
   */
  release(hash: string): boolean {
    const entry = this.cache.get(hash);
    if (!entry) {
      return false;
    }

    entry.program.refCount--;
    if (entry.program.refCount <= 0) {
      entry.program.destroy();
      this.cache.delete(hash);
      return true;
    }
    return false;
  }

  /**
   * LRU 淘汰策略（内部方法）
   *
   * @remarks
   * 找到 refCount=0 且 lastAccessTime 最小的程序并删除。
   * 如果所有程序都在使用（refCount>0），不执行淘汰。
   *
   * @internal
   */
  private evictLRU(): void {
    let oldestHash: string | null = null;
    let oldestTime = Infinity;

    // 找到最久未使用的 refCount=0 程序
    for (const [hash, entry] of this.cache.entries()) {
      if (entry.program.refCount === 0 && entry.lastAccessTime < oldestTime) {
        oldestHash = hash;
        oldestTime = entry.lastAccessTime;
      }
    }

    // 如果找到，删除它
    if (oldestHash !== null) {
      const entry = this.cache.get(oldestHash)!;
      entry.program.destroy();
      this.cache.delete(oldestHash);
    }
  }

  /**
   * 清空缓存
   *
   * @remarks
   * 释放所有着色器程序，无论引用计数。
   * 通常在 Renderer dispose() 时调用。
   *
   * @example
   * ```typescript
   * // 在 Renderer 释放时清空缓存
   * dispose(): void {
   *   this.shaderCache.clear();
   *   super.dispose();
   * }
   * ```
   */
  clear(): void {
    for (const entry of this.cache.values()) {
      entry.program.destroy();
    }
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   *
   * @returns 缓存的着色器程序数量
   *
   * @remarks
   * 用于监控和调试，例如在开发模式下定期打印缓存大小。
   *
   * @example
   * ```typescript
   * console.log(`Cached shaders: ${cache.getSize()}`);
   * ```
   */
  getSize(): number {
    return this.cache.size;
  }
}
