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
 * - 统计接口（监控缓存大小）
 *
 * ## 缓存策略
 * - 键：着色器源码的哈希值（由 ShaderCompiler 计算）
 * - 值：ShaderProgram 实例
 * - 生命周期：当 refCount 降为 0 时自动从缓存移除
 *
 * ## 未来优化
 * - 可考虑 LRU 淘汰策略（当前无限制）
 * - 可添加内存占用监控
 */

import type { ShaderProgram } from './shader-program';

/**
 * 着色器缓存
 *
 * @remarks
 * 管理着色器程序的生命周期和缓存。
 *
 * ## 缓存键
 * - 使用着色器源码的哈希值作为键
 * - 由 ShaderCompiler 计算并传入
 *
 * ## 引用计数
 * - 每次 get() 返回缓存的程序时，应手动递增 refCount
 * - 调用 release() 时递减 refCount，降为 0 时自动销毁并移除
 *
 * ## 示例
 * ```typescript
 * const cache = new ShaderCache();
 *
 * // 缓存程序
 * cache.set('hash123', program);
 *
 * // 获取程序（需手动管理引用计数）
 * const cached = cache.get('hash123');
 * if (cached) {
 *   cached.refCount++;
 * }
 *
 * // 释放程序
 * cache.release('hash123'); // refCount--，降为 0 时自动销毁
 * ```
 */
export class ShaderCache {
  /**
   * 哈希 → 程序映射
   * @internal
   */
  private cache: Map<string, ShaderProgram> = new Map();

  /**
   * 获取缓存的着色器程序
   *
   * @param hash 着色器源码哈希
   * @returns 着色器程序，如果不存在返回 undefined
   *
   * @remarks
   * 此方法不会自动递增 refCount，调用者需手动管理。
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
    return this.cache.get(hash);
  }

  /**
   * 缓存着色器程序
   *
   * @param hash 着色器源码哈希
   * @param program 着色器程序
   *
   * @remarks
   * 如果哈希已存在，会覆盖旧值（通常不应发生）。
   *
   * @example
   * ```typescript
   * const program = new ShaderProgram('hash123', vertexModule, fragmentModule);
   * cache.set('hash123', program);
   * ```
   */
  set(hash: string, program: ShaderProgram): void {
    this.cache.set(hash, program);
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
    const program = this.cache.get(hash);
    if (!program) {
      return false;
    }

    program.refCount--;
    if (program.refCount <= 0) {
      program.destroy();
      this.cache.delete(hash);
      return true;
    }
    return false;
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
    for (const program of this.cache.values()) {
      program.destroy();
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
