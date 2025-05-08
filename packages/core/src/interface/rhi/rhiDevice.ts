import type { RHIBackend } from './rhiEnums';

/**
 * 图形设备接口
 * 提供对底层图形API的抽象访问
 */
export interface IRHIDevice {
  /**
   * 获取当前图形后端类型
   */
  readonly backend: RHIBackend,

  /**
   * 创建命令上下文
   * 在WebGL中为空操作，在WebGPU中创建真正的命令编码器
   */
  createCommandContext(): IRHICommandContext,

  /**
   * 提交渲染命令
   * 在WebGL中为空操作(已立即执行)，在WebGPU中真正提交命令缓冲区
   */
  submitCommands(commands: IRHICommandList): void,

  /**
   * 创建缓冲区资源
   * @param descriptor 缓冲区描述
   */
  createBuffer(descriptor: RHIBufferDescriptor): IRHIBuffer,

  /**
   * 创建纹理资源
   * @param descriptor 纹理描述
   */
  createTexture(descriptor: RHITextureDescriptor): IRHITexture,

  /**
   * 创建着色器模块
   * @param descriptor 着色器描述
   */
  createShaderModule(descriptor: RHIShaderModuleDescriptor): IRHIShaderModule,

  /**
   * 创建渲染管线
   * @param descriptor 管线描述
   */
  createRenderPipeline(descriptor: RHIRenderPipelineDescriptor): IRHIRenderPipeline,

  /**
   * 创建采样器
   * @param descriptor 采样器描述
   */
  createSampler(descriptor: RHISamplerDescriptor): IRHISampler,

  /**
   * 创建绑定组布局
   * @param descriptor 绑定组布局描述
   */
  createBindGroupLayout(descriptor: RHIBindGroupLayoutDescriptor): IRHIBindGroupLayout,

  /**
   * 创建绑定组
   * @param descriptor 绑定组描述
   */
  createBindGroup(descriptor: RHIBindGroupDescriptor): IRHIBindGroup,

  /**
   * 设备销毁
   */
  destroy(): void,
}