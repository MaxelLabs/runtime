/**
 * Uniform Layout Descriptor
 * Uniform 布局描述符
 *
 * @packageDocumentation
 *
 * @remarks
 * 此接口用于抽象 Uniform Buffer 的布局计算和数据打包。
 * 允许 Core 包的 MaterialInstance 在不依赖具体 RHI 实现的情况下管理 GPU 资源。
 *
 * ## 设计目标
 * 1. **平台无关**: 不依赖 WebGL/WebGPU 特定实现
 * 2. **依赖注入**: 由 Engine 或 Renderer 层提供具体实现
 * 3. **类型安全**: 通过接口约束确保正确性
 *
 * ## 使用场景
 * ```typescript
 * // Engine 层创建布局描述符（使用 Std140Calculator）
 * const descriptor: IUniformLayoutDescriptor = {
 *   totalSize: 80,
 *   packData: (properties) => {
 *     const buffer = new Float32Array(20);
 *     // 打包逻辑...
 *     return buffer;
 *   }
 * };
 *
 * // Core 层使用
 * materialInstance.setLayoutDescriptor(descriptor);
 * materialInstance.bind();  // 自动打包并更新 GPU buffer
 * ```
 */

/**
 * Uniform 布局描述符接口
 *
 * @remarks
 * 此接口定义了如何将材质属性打包为 GPU Uniform Buffer 格式。
 * 具体实现由 Engine 或 RHI 层提供（如使用 Std140Calculator）。
 */
export interface IUniformLayoutDescriptor {
  /**
   * 总大小（字节）
   *
   * @remarks
   * 必须是 16 的倍数（UBO 对齐要求）。
   * 用于创建 IRHIBuffer 时指定缓冲区大小。
   */
  totalSize: number;

  /**
   * 打包属性到 GPU 格式
   *
   * @param properties 材质属性 Map
   * @returns 打包后的 Float32Array 数据
   *
   * @remarks
   * 此方法负责：
   * 1. 从 properties Map 中提取值
   * 2. 按照 std140/std430 布局规则对齐数据
   * 3. 返回可直接上传到 GPU 的二进制数据
   *
   * @example
   * ```typescript
   * const data = descriptor.packData(properties);
   * buffer.update(data);
   * ```
   */
  packData(properties: Map<string, unknown>): Float32Array;

  /**
   * 字段映射（可选，用于调试）
   *
   * @remarks
   * 提供字段名到偏移和大小的映射，便于调试和验证。
   * 格式: `{ fieldName: { offset: 字节偏移, size: 字节大小 } }`
   */
  fieldMap?: Map<string, { offset: number; size: number }>;
}
