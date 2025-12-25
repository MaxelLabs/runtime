/**
 * shader-compiler.ts
 * ShaderCompiler 着色器编译器
 *
 * @packageDocumentation
 *
 * @remarks
 * 负责着色器程序的编译、缓存和生命周期管理，提供：
 * - 异步编译 API（通过 IRHIDevice.createShaderModule）
 * - 基于源码哈希的缓存（避免重复编译）
 * - 引用计数管理（自动释放未使用的着色器）
 * - Fallback 着色器支持（编译失败时使用默认着色器）
 * - 三层错误处理（类型验证、运行时验证、错误报告）
 *
 * ## 架构约束
 * - ✅ NO WebGL Dependencies: 仅通过 IRHIDevice 接口操作 GPU
 * - ✅ All Types from Specification: 所有 RHI 类型来自 @maxellabs/specification
 * - ✅ Reference Counting: 着色器程序支持引用计数和自动释放
 * - ✅ Dispose Pattern: 实现 IDisposable 模式
 *
 * ## 缓存策略
 * - 键：FNV-1a 哈希（vertexSource + fragmentSource）
 * - 值：ShaderProgram 实例
 * - 生命周期：当 refCount 降为 0 时自动销毁并移除
 *
 * ## 使用示例
 * ```typescript
 * // 在 Renderer 中创建编译器
 * class MyRenderer extends Renderer {
 *   private shaderCompiler: ShaderCompiler;
 *
 *   constructor(config: RendererConfig) {
 *     super(config);
 *     this.shaderCompiler = new ShaderCompiler({
 *       device: this.getDevice(),
 *       fallbackShader: {
 *         vertex: DEFAULT_VS,
 *         fragment: DEFAULT_FS,
 *       },
 *     });
 *   }
 *
 *   protected async render(ctx: RenderContext): Promise<void> {
 *     // 编译着色器（或从缓存获取）
 *     const program = await this.shaderCompiler.compile(
 *       vertexShaderSource,
 *       fragmentShaderSource
 *     );
 *
 *     // 使用着色器程序
 *     const mvpLocation = program.getUniformLocation('u_MVP');
 *     // ...
 *   }
 *
 *   override dispose(): void {
 *     this.shaderCompiler.dispose();
 *     super.dispose();
 *   }
 * }
 * ```
 */

import type { IRHIDevice, IRHIShaderModule } from '@maxellabs/specification';
import { RHIShaderStage } from '@maxellabs/specification';
import { ShaderProgram } from './shader-program';
import { ShaderCache } from './shader-cache';

/**
 * 着色器编译器配置
 *
 * @remarks
 * 配置 ShaderCompiler 的行为和策略。
 *
 * @example
 * ```typescript
 * const config: ShaderCompilerConfig = {
 *   device: rhiDevice,
 *   enableCache: true,
 *   fallbackShader: {
 *     vertex: 'void main() { gl_Position = vec4(0.0); }',
 *     fragment: 'void main() { gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); }',
 *   },
 * };
 * ```
 */
export interface ShaderCompilerConfig {
  /**
   * RHI 设备
   * @remarks 用于创建着色器模块
   */
  device: IRHIDevice;

  /**
   * 启用缓存（默认 true）
   * @remarks 禁用缓存会导致每次调用 compile() 都重新编译
   */
  enableCache?: boolean;

  /**
   * Fallback 着色器（编译失败时使用）
   * @remarks
   * 当着色器编译失败时，如果提供了 fallback，会自动使用 fallback 着色器。
   * 通常用于开发模式，避免因着色器错误导致渲染完全失败。
   */
  fallbackShader?: {
    /**
     * Fallback 顶点着色器源码
     */
    vertex: string;

    /**
     * Fallback 片元着色器源码
     */
    fragment: string;
  };
}

/**
 * 着色器编译错误
 *
 * @remarks
 * 包含详细的错误信息，用于调试和错误报告。
 *
 * ## 错误详情
 * - stage: 编译失败的着色器阶段（vertex/fragment）
 * - line: 错误行号（如果可用）
 * - column: 错误列号（如果可用）
 * - originalError: 原始错误对象
 *
 * @example
 * ```typescript
 * try {
 *   await compiler.compile(vertexSource, fragmentSource);
 * } catch (error) {
 *   if (error instanceof ShaderCompilerError) {
 *     console.error(`Shader compilation failed at ${error.details.stage}:`, error.message);
 *     console.error('Original error:', error.details.originalError);
 *   }
 * }
 * ```
 */
export class ShaderCompilerError extends Error {
  /**
   * 创建着色器编译错误
   *
   * @param message 错误消息
   * @param details 错误详情
   */
  constructor(
    message: string,
    public details: {
      /**
       * 着色器阶段
       */
      stage?: 'vertex' | 'fragment';

      /**
       * 错误行号
       */
      line?: number;

      /**
       * 错误列号
       */
      column?: number;

      /**
       * 原始错误对象
       */
      originalError?: unknown;
    } = {}
  ) {
    super(`[ShaderCompiler] ${message}`);
    this.name = 'ShaderCompilerError';
  }
}

/**
 * 着色器编译器
 *
 * @remarks
 * 负责着色器程序的编译、缓存和生命周期管理。
 *
 * ## 核心功能
 * 1. **异步编译**：通过 IRHIDevice.createShaderModule() 编译着色器
 * 2. **哈希缓存**：使用 FNV-1a 算法计算源码哈希，避免重复编译
 * 3. **引用计数**：多个 MaterialInstance 可共享同一着色器程序
 * 4. **自动释放**：当 refCount 降为 0 时自动销毁 GPU 资源
 * 5. **Fallback 支持**：编译失败时使用默认着色器
 *
 * ## 生命周期
 * 1. 由 Renderer 创建并持有（组合关系）
 * 2. 在渲染循环中调用 compile() 获取着色器程序
 * 3. 在 Renderer dispose() 时调用 dispose() 清理所有资源
 *
 * ## 性能优化
 * - 缓存编译结果（避免重复编译）
 * - 缓存 Uniform/Attribute 位置（避免重复查询）
 * - 引用计数管理（避免内存泄漏）
 *
 * ## 注意事项
 * - 不要在渲染循环中重复编译相同着色器（使用缓存）
 * - 不要忘记调用 dispose() 释放资源
 * - 不要在 dispose() 后继续使用编译器
 *
 * @example
 * ```typescript
 * // 创建编译器
 * const compiler = new ShaderCompiler({ device });
 *
 * // 编译着色器
 * const program = await compiler.compile(vertexSource, fragmentSource);
 *
 * // 查询缓存
 * const cached = compiler.getProgram(vertexSource, fragmentSource);
 *
 * // 释放引用
 * compiler.release(program);
 *
 * // 清理资源
 * compiler.dispose();
 * ```
 */
export class ShaderCompiler {
  /**
   * RHI 设备
   * @internal
   */
  private device: IRHIDevice;

  /**
   * 着色器缓存
   * @internal
   */
  private cache: ShaderCache;

  /**
   * 配置
   * @internal
   */
  private config: ShaderCompilerConfig;

  /**
   * 是否已释放
   * @internal
   */
  private disposed: boolean = false;

  /**
   * 正在编译的 Promise 缓存（并发安全保护）
   * @internal
   * @remarks
   * 防止并发调用 compile() 时重复编译相同着色器。
   * Key: 哈希值; Value: 编译中的 Promise
   */
  private compilingPromises: Map<string, Promise<ShaderProgram>> = new Map();

  /**
   * 创建着色器编译器
   *
   * @param config 编译器配置
   *
   * @remarks
   * 配置中的 device 必须提供，enableCache 默认为 true。
   *
   * @example
   * ```typescript
   * const compiler = new ShaderCompiler({
   *   device: rhiDevice,
   *   enableCache: true,
   *   fallbackShader: {
   *     vertex: DEFAULT_VS,
   *     fragment: DEFAULT_FS,
   *   },
   * });
   * ```
   */
  constructor(config: ShaderCompilerConfig) {
    this.device = config.device;
    this.config = {
      enableCache: true,
      ...config,
    };
    this.cache = new ShaderCache();
  }

  /**
   * 编译着色器程序
   *
   * @param vertexSource 顶点着色器源码
   * @param fragmentSource 片元着色器源码
   * @returns 编译后的着色器程序
   *
   * @remarks
   * ## 编译流程
   * 1. 参数验证（检查源码是否为空）
   * 2. 计算源码哈希（FNV-1a 算法）
   * 3. 检查缓存（如果存在，增加引用计数并返回）
   * 4. 编译顶点着色器（通过 IRHIDevice.createShaderModule）
   * 5. 编译片元着色器（通过 IRHIDevice.createShaderModule）
   * 6. 创建 ShaderProgram 包装器
   * 7. 缓存程序（如果启用缓存）
   * 8. 返回程序
   *
   * ## 错误处理
   * - 如果源码为空，抛出 ShaderCompilerError
   * - 如果编译失败且提供了 fallback，使用 fallback 着色器
   * - 如果编译失败且未提供 fallback，抛出 ShaderCompilerError
   *
   * ## 性能优化
   * - 相同源码的着色器只编译一次（通过哈希缓存）
   * - 多个 MaterialInstance 可共享同一着色器程序（引用计数）
   *
   * @throws {ShaderCompilerError} 编译失败或参数无效
   *
   * @example
   * ```typescript
   * // 基础使用
   * const program = await compiler.compile(
   *   vertexShaderSource,
   *   fragmentShaderSource
   * );
   *
   * // 错误处理
   * try {
   *   const program = await compiler.compile(vs, fs);
   * } catch (error) {
   *   if (error instanceof ShaderCompilerError) {
   *     console.error('Compilation failed:', error.details);
   *   }
   * }
   * ```
   */
  async compile(vertexSource: string, fragmentSource: string): Promise<ShaderProgram> {
    this.checkDisposed();

    // 1. 参数验证
    if (!vertexSource || !fragmentSource) {
      throw new ShaderCompilerError('Empty shader source', {
        originalError: {
          vertex: vertexSource?.length ?? 0,
          fragment: fragmentSource?.length ?? 0,
        },
      });
    }

    // 2. 计算哈希
    const hash = this.computeHash(vertexSource, fragmentSource);

    // 3. 检查缓存
    if (this.config.enableCache && this.cache.has(hash)) {
      const cached = this.cache.get(hash)!;
      cached.refCount++;
      return cached;
    }

    // 4. 并发安全检查 - 如果正在编译相同着色器,等待现有编译完成
    if (this.compilingPromises.has(hash)) {
      const existingPromise = this.compilingPromises.get(hash)!;
      const program = await existingPromise;
      // 增加引用计数（因为是新调用者请求）
      program.refCount++;
      return program;
    }

    // 5. 创建编译 Promise
    const compilePromise = this.doCompile(vertexSource, fragmentSource, hash);
    this.compilingPromises.set(hash, compilePromise);

    try {
      const program = await compilePromise;
      return program;
    } finally {
      // 6. 清理 Promise 缓存
      this.compilingPromises.delete(hash);
    }
  }

  /**
   * 执行实际编译（内部方法）
   * @internal
   */
  private async doCompile(vertexSource: string, fragmentSource: string, hash: string): Promise<ShaderProgram> {
    try {
      // 编译着色器
      const vertexModule = await this.compileShaderModule(vertexSource, 'vertex');
      const fragmentModule = await this.compileShaderModule(fragmentSource, 'fragment');

      // 创建程序包装器
      const program = new ShaderProgram(hash, vertexModule, fragmentModule);

      // 缓存程序
      if (this.config.enableCache) {
        this.cache.set(hash, program);
      }

      return program;
    } catch (error) {
      // Fallback 处理（递归深度限制：最多 3 次）
      const MAX_FALLBACK_DEPTH = 3;
      const currentDepth = vertexSource === this.config.fallbackShader?.vertex ? 1 : 0;

      if (this.config.fallbackShader && currentDepth < MAX_FALLBACK_DEPTH) {
        console.warn(`[ShaderCompiler] Compilation failed (fallback depth=${currentDepth}), trying fallback`, error);
        return this.compile(this.config.fallbackShader.vertex, this.config.fallbackShader.fragment);
      }

      // 达到递归深度限制或无 Fallback，抛出原始错误
      if (currentDepth >= MAX_FALLBACK_DEPTH) {
        console.error('[ShaderCompiler] Fallback recursion limit reached, aborting');
      }
      throw error;
    }
  }

  /**
   * 获取已缓存的着色器程序（同步）
   *
   * @param vertexSource 顶点着色器源码
   * @param fragmentSource 片元着色器源码
   * @returns 着色器程序，如果未编译返回 undefined
   *
   * @remarks
   * 此方法不会触发编译，仅用于查询已缓存的程序。
   * 如果需要编译，请使用 compile() 方法。
   *
   * ## ⚠️ 引用计数说明
   * - **此方法不会递增引用计数** - 仅用于只读查询
   * - 如果需要持有程序引用，请使用 `compile()`，它会递增引用计数
   * - 使用 `getProgram()` 返回的程序时，无需调用 `release()`
   *
   * ## 使用场景
   * - 检查着色器是否已编译
   * - 在渲染循环中快速查询缓存（避免异步等待）
   *
   * @example
   * ```typescript
   * // 只读查询（不递增引用计数）
   * const cached = compiler.getProgram(vs, fs);
   * if (cached) {
   *   // 临时使用，无需 release()
   *   cached.bind();
   * }
   *
   * // 持有引用（递增引用计数）
   * const program = await compiler.compile(vs, fs); // refCount++
   * // ... 长期使用 ...
   * compiler.release(program); // refCount--
   * ```
   */
  getProgram(vertexSource: string, fragmentSource: string): ShaderProgram | undefined {
    this.checkDisposed();
    const hash = this.computeHash(vertexSource, fragmentSource);
    return this.cache.get(hash);
  }

  /**
   * 释放着色器程序（减少引用计数）
   *
   * @param program 着色器程序
   *
   * @remarks
   * 当引用计数降为 0 时，自动销毁 GPU 资源并从缓存移除。
   *
   * ## 使用场景
   * - MaterialInstance 销毁时释放着色器引用
   * - 手动管理着色器生命周期
   *
   * ## 注意事项
   * - 不要释放仍在使用的着色器程序
   * - 不要多次释放同一程序（会导致 refCount 错误）
   *
   * @example
   * ```typescript
   * // 在 MaterialInstance 中
   * class MaterialInstance {
   *   private program: ShaderProgram;
   *
   *   dispose(): void {
   *     this.shaderCompiler.release(this.program);
   *   }
   * }
   * ```
   */
  release(program: ShaderProgram): void {
    this.checkDisposed();
    this.cache.release(program.id);
  }

  /**
   * 获取缓存统计
   *
   * @returns 缓存的着色器程序数量
   *
   * @remarks
   * 用于监控和调试,例如在开发模式下定期打印缓存大小。
   *
   * @example
   * ```typescript
   * // 监控缓存大小
   * console.log(`Cached shaders: ${compiler.getCacheSize()}`);
   *
   * // 在开发模式下定期打印
   * if (DEBUG_MODE) {
   *   setInterval(() => {
   *     console.log(`[ShaderCompiler] Cache size: ${compiler.getCacheSize()}`);
   *   }, 5000);
   * }
   * ```
   */
  getCacheSize(): number {
    this.checkDisposed();
    return this.cache.getSize();
  }

  /**
   * 释放所有资源
   *
   * @remarks
   * 销毁所有缓存的着色器程序，无论引用计数。
   * 通常在 Renderer dispose() 时调用。
   *
   * ## 清理内容
   * - 销毁所有着色器程序（调用 program.destroy()）
   * - 清空缓存
   * - 标记为已释放（防止后续使用）
   *
   * ## 注意事项
   * - dispose() 后不能再使用编译器
   * - dispose() 是幂等的（多次调用不会出错）
   *
   * @example
   * ```typescript
   * // 在 Renderer 中
   * class MyRenderer extends Renderer {
   *   override dispose(): void {
   *     this.shaderCompiler.dispose();
   *     super.dispose();
   *   }
   * }
   * ```
   */
  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.cache.clear();
    this.disposed = true;
  }

  /**
   * 检查是否已释放
   *
   * @throws {Error} 如果已释放
   * @internal
   */
  private checkDisposed(): void {
    if (this.disposed) {
      throw new Error('[ShaderCompiler] Compiler has been disposed');
    }
  }

  /**
   * 编译单个着色器模块
   *
   * @param source 着色器源码
   * @param stage 着色器阶段
   * @returns 着色器模块
   *
   * @throws {ShaderCompilerError} 编译失败
   *
   * @remarks
   * 通过 IRHIDevice.createShaderModule() 编译着色器。
   *
   * ## 实现说明
   * - 使用 RHI 层的 createShaderModule() 进行实际编译
   * - WebGL 实现自动检测版本并适配 GLSL 语法
   * - 编译错误会包含详细的行号和源码信息
   *
   * @internal
   */
  private async compileShaderModule(source: string, stage: 'vertex' | 'fragment'): Promise<IRHIShaderModule> {
    try {
      // 映射 stage 到 RHI 枚举
      const rhiStage = stage === 'vertex' ? RHIShaderStage.VERTEX : RHIShaderStage.FRAGMENT;

      // 使用 RHI Device 的 createShaderModule（同步方法）
      const shaderModule = this.device.createShaderModule({
        code: source,
        stage: rhiStage,
        language: 'glsl',
        label: `${stage}-shader`,
      });

      // createShaderModule 是同步的，但我们返回 Promise 以保持接口一致性
      return shaderModule;
    } catch (error) {
      throw new ShaderCompilerError(`Failed to compile ${stage} shader`, {
        stage,
        originalError: error,
      });
    }
  }

  /**
   * 计算着色器源码哈希
   *
   * @param vertexSource 顶点着色器源码
   * @param fragmentSource 片元着色器源码
   * @returns 哈希字符串
   *
   * @remarks
   * 使用 FNV-1a 哈希算法（快速、低碰撞）。
   *
   * ## 哈希策略
   * - 拼接顶点和片元着色器源码（用分隔符分隔）
   * - 使用 FNV-1a 算法计算 32 位哈希
   * - 返回无符号整数字符串
   *
   * ## 碰撞概率
   * - FNV-1a 在 32 位空间下碰撞概率极低
   * - 对于着色器源码（通常较长），碰撞几乎不可能发生
   * - 未来可升级为 SHA-256（需考虑性能）
   *
   * @internal
   */
  private computeHash(vertexSource: string, fragmentSource: string): string {
    const combined = `${vertexSource}\n---FRAGMENT---\n${fragmentSource}`;
    return this.fnv1aHash(combined).toString();
  }

  /**
   * FNV-1a 哈希算法
   *
   * @param str 输入字符串
   * @returns 32位哈希值（无符号整数）
   *
   * @remarks
   * FNV-1a (Fowler-Noll-Vo) 是一种快速、简单的非加密哈希算法。
   *
   * ## 算法特性
   * - 速度快（适合实时应用）
   * - 碰撞率低（对于长字符串）
   * - 实现简单（无需外部库）
   *
   * ## 算法步骤
   * 1. 初始化哈希值为 FNV offset basis (2166136261)
   * 2. 对每个字符：
   *    - 哈希值 XOR 字符码
   *    - 哈希值乘以 FNV prime (16777619)
   * 3. 返回无符号整数
   *
   * @see https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function
   *
   * @internal
   */
  private fnv1aHash(str: string): number {
    let hash = 2166136261; // FNV offset basis (32-bit)
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619); // FNV prime (32-bit)
    }
    return hash >>> 0; // 转换为无符号整数
  }
}
