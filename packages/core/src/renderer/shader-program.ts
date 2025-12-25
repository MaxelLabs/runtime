/**
 * shader-program.ts
 * ShaderProgram 包装器
 *
 * @packageDocumentation
 *
 * @remarks
 * 包装已编译的着色器模块，提供统一的接口访问着色器程序资源：
 * - 持有顶点/片元着色器模块引用
 * - 提供着色器反射信息访问（Uniform/Attribute/Bindings）
 * - 支持引用计数（多个 MaterialInstance 可共享同一着色器程序）
 * - 实现 Dispose 模式释放 GPU 资源
 *
 * ## 声明式设计原则
 * ShaderProgram 遵循 RHI 的声明式架构：
 * - **不提供运行时位置查询**（getUniformLocation/getAttributeLocation 已移除）
 * - Uniform 绑定通过 BindGroup + PipelineLayout 声明
 * - Attribute 位置通过 VertexLayout 声明
 * - 反射信息通过 IRHIShaderModule.reflection 获取
 */

import type { IRHIShaderModule } from '@maxellabs/specification';

/**
 * 着色器反射信息聚合
 *
 * @remarks
 * 聚合顶点和片元着色器的反射信息，提供统一访问接口。
 */
export interface ShaderProgramReflection {
  /** 顶点着色器反射信息 */
  vertex: IRHIShaderModule['reflection'];
  /** 片元着色器反射信息 */
  fragment: IRHIShaderModule['reflection'];
}

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
 * ## 声明式使用模式
 * ```typescript
 * // 1. 编译着色器
 * const program = await compiler.compile(vertexSource, fragmentSource);
 *
 * // 2. 获取反射信息（替代位置查询）
 * const reflection = program.getReflection();
 * const uniformBindings = reflection.vertex.bindings;
 * const attributes = reflection.vertex.attributes;
 *
 * // 3. 声明式绑定（通过 BindGroup）
 * const bindGroup = device.createBindGroup(bindGroupLayout, [
 *   { binding: 0, resource: uniformBuffer }
 * ]);
 *
 * // 4. 释放引用
 * compiler.release(program);
 * ```
 *
 * ## 迁移指南
 * 从旧的命令式 API 迁移：
 *
 * ### 旧代码（已移除）
 * ```typescript
 * const mvpLocation = program.getUniformLocation('u_MVP');
 * if (mvpLocation !== -1) {
 *   device.setUniform(mvpLocation, mvpMatrix);
 * }
 * ```
 *
 * ### 新代码（声明式）
 * ```typescript
 * // 方式1：通过反射信息
 * const reflection = program.getReflection();
 * const mvpBinding = reflection.vertex.bindings.find(b => b.name === 'u_MVP');
 * if (mvpBinding) {
 *   // 使用 BindGroup 绑定
 *   const bindGroup = device.createBindGroup(layout, [
 *     { binding: mvpBinding.binding, resource: uniformBuffer }
 *   ]);
 * }
 *
 * // 方式2：直接使用预定义的绑定索引
 * const bindGroup = device.createBindGroup(layout, [
 *   { binding: 0, resource: uniformBuffer }  // u_MVP at binding 0
 * ]);
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
   * 获取着色器反射信息
   *
   * @returns 顶点和片元着色器的反射信息
   *
   * @remarks
   * 反射信息包含：
   * - **bindings**：Uniform/Storage 缓冲区绑定信息（名称、binding 索引、类型）
   * - **attributes**：顶点属性信息（名称、location、格式） - 仅顶点着色器
   * - **varyings**：varying/in/out 变量信息 - WebGL 特定
   * - **entryPoints**：入口点信息（GLSL 中为 'main'）
   *
   * ## 使用场景
   * 1. **动态 Uniform 绑定**：根据着色器中的 uniform 声明动态创建 BindGroup
   * 2. **顶点属性匹配**：验证网格的顶点属性与着色器要求是否匹配
   * 3. **调试和工具**：在开发工具中显示着色器的接口信息
   *
   * @example
   * ```typescript
   * const reflection = program.getReflection();
   *
   * // 遍历所有 Uniform bindings
   * for (const binding of reflection.vertex.bindings) {
   *   console.log(`Uniform: ${binding.name} at binding ${binding.binding}`);
   * }
   *
   * // 检查顶点属性
   * const posAttr = reflection.vertex.attributes?.find(a => a.name === 'aPosition');
   * if (posAttr) {
   *   console.log(`Position attribute at location ${posAttr.location}`);
   * }
   * ```
   */
  getReflection(): ShaderProgramReflection {
    return {
      vertex: this.vertexModule.reflection,
      fragment: this.fragmentModule.reflection,
    };
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
   *
   * @internal 仅由 ShaderCompiler 调用
   */
  destroy(): void {
    // TODO: Destroy shader modules when RHI supports it
    // 实际实现应类似于：
    // this.vertexModule.destroy();
    // this.fragmentModule.destroy();
  }
}
