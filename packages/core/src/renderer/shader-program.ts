/**
 * shader-program.ts
 * ShaderProgram 包装器
 *
 * @packageDocumentation
 *
 * @remarks
 * 包装已编译的着色器模块，提供统一的接口访问着色器程序资源：
 * - 持有顶点/片元着色器模块引用
 * - 缓存 Uniform/Attribute 位置查询结果
 * - 支持引用计数（多个 MaterialInstance 可共享同一着色器程序）
 * - 实现 Dispose 模式释放 GPU 资源
 */

import type { IRHIShaderModule } from '@maxellabs/specification';

/**
 * 着色器程序包装器
 *
 * @remarks
 * 持有编译后的 IRHIShaderModule 和元数据。
 *
 * ## 生命周期
 * 1. 由 ShaderCompiler.compile() 创建
 * 2. 通过引用计数管理共享（多个 MaterialInstance 可引用同一程序）
 * 3. 当 refCount 降为 0 时，由 ShaderCompiler 调用 destroy() 释放资源
 *
 * ## 缓存策略
 * - Uniform/Attribute 位置查询结果被缓存到 Map 中
 * - 避免在渲染循环中重复查询 GPU（性能优化）
 *
 * ## 注意事项
 * - 不要直接调用 destroy()，应通过 ShaderCompiler.release() 管理
 * - 位置查询方法当前返回 -1（需 RHI 扩展支持）
 *
 * @example
 * ```typescript
 * // 由 ShaderCompiler 创建（用户不直接构造）
 * const program = await compiler.compile(vertexSource, fragmentSource);
 *
 * // 查询 Uniform 位置
 * const mvpLocation = program.getUniformLocation('u_MVP');
 * if (mvpLocation !== -1) {
 *   device.setUniform(mvpLocation, mvpMatrix);
 * }
 *
 * // 释放引用
 * compiler.release(program);
 * ```
 */
export class ShaderProgram {
  /**
   * 程序唯一标识（基于源码哈希）
   * @readonly
   */
  readonly id: string;

  /**
   * 顶点着色器模块
   * @readonly
   */
  readonly vertexModule: IRHIShaderModule;

  /**
   * 片元着色器模块
   * @readonly
   */
  readonly fragmentModule: IRHIShaderModule;

  /**
   * Uniform 位置缓存
   * @remarks 键为 Uniform 名称，值为位置索引
   * @internal
   */
  private uniformLocations: Map<string, number> = new Map();

  /**
   * Attribute 位置缓存
   * @remarks 键为 Attribute 名称，值为位置索引
   * @internal
   */
  private attributeLocations: Map<string, number> = new Map();

  /**
   * 引用计数
   * @remarks
   * 当多个 MaterialInstance 共享同一着色器时递增。
   * 降为 0 时由 ShaderCompiler 自动销毁。
   */
  refCount: number = 1;

  /**
   * 创建着色器程序包装器
   *
   * @param id 程序唯一标识（源码哈希）
   * @param vertexModule 顶点着色器模块
   * @param fragmentModule 片元着色器模块
   *
   * @internal 仅由 ShaderCompiler 调用
   */
  constructor(id: string, vertexModule: IRHIShaderModule, fragmentModule: IRHIShaderModule) {
    this.id = id;
    this.vertexModule = vertexModule;
    this.fragmentModule = fragmentModule;
  }

  /**
   * 获取 Uniform 位置
   *
   * @param name Uniform 名称
   * @returns 位置索引，如果未找到返回 -1
   *
   * @remarks
   * 查询结果会被缓存，后续调用直接返回缓存值。
   *
   * ## 当前限制
   * - 需要 RHI 扩展支持（IRHIDevice.getUniformLocation）
   * - 当前实现返回 -1（占位符）
   *
   * @example
   * ```typescript
   * const location = program.getUniformLocation('u_ModelMatrix');
   * if (location !== -1) {
   *   // 设置 Uniform 值
   *   device.setUniform(location, modelMatrix);
   * }
   * ```
   */
  getUniformLocation(name: string): number {
    if (!this.uniformLocations.has(name)) {
      // TODO: Query from device (requires RHI extension)
      // 实际实现应类似于：
      // const location = device.getUniformLocation(this.id, name);
      // this.uniformLocations.set(name, location);
      return -1;
    }
    return this.uniformLocations.get(name)!;
  }

  /**
   * 获取 Attribute 位置
   *
   * @param name Attribute 名称
   * @returns 位置索引，如果未找到返回 -1
   *
   * @remarks
   * 查询结果会被缓存，后续调用直接返回缓存值。
   *
   * ## 当前限制
   * - 需要 RHI 扩展支持（IRHIDevice.getAttributeLocation）
   * - 当前实现返回 -1（占位符）
   *
   * @example
   * ```typescript
   * const location = program.getAttributeLocation('a_Position');
   * if (location !== -1) {
   *   // 绑定顶点属性
   *   device.bindAttribute(location, buffer);
   * }
   * ```
   */
  getAttributeLocation(name: string): number {
    if (!this.attributeLocations.has(name)) {
      // TODO: Query from device (requires RHI extension)
      // 实际实现应类似于：
      // const location = device.getAttributeLocation(this.id, name);
      // this.attributeLocations.set(name, location);
      return -1;
    }
    return this.attributeLocations.get(name)!;
  }

  /**
   * 释放 GPU 资源
   *
   * @remarks
   * 仅在 refCount = 0 时由 ShaderCompiler 调用。
   * 用户不应直接调用此方法，应使用 ShaderCompiler.release()。
   *
   * ## 清理内容
   * - 销毁着色器模块（调用 IRHIShaderModule.destroy()）
   * - 清空位置缓存
   *
   * @internal 仅由 ShaderCompiler 调用
   */
  destroy(): void {
    // TODO: Destroy shader modules when RHI supports it
    // 实际实现应类似于：
    // this.vertexModule.destroy();
    // this.fragmentModule.destroy();

    this.uniformLocations.clear();
    this.attributeLocations.clear();
  }
}
