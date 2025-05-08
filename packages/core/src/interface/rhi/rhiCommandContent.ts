/**
 * 渲染命令上下文
 * 抽象WebGL立即模式和WebGPU命令缓冲区模式的差异
 */
export interface IRHICommandContext {
  /**
     * 开始渲染通道
     * @param descriptor 渲染通道描述
     */
  beginRenderPass(descriptor: RHIRenderPassDescriptor): IRHIRenderPass,

  /**
     * 结束当前命令上下文，准备提交
     * 在WebGPU中生成命令缓冲区，在WebGL中为空操作
     */
  finish(): IRHICommandList,

  /**
     * 更新缓冲区内容
     * 在WebGL中直接更新，在WebGPU中记录写入命令
     */
  updateBuffer(buffer: IRHIBuffer, data: BufferSource, offset?: number): void,

  /**
     * 更新纹理内容
     * @param texture 目标纹理
     * @param data 纹理数据
     * @param layout 数据布局
     */
  updateTexture(
    texture: IRHITexture,
    data: BufferSource,
    layout: RHITextureDataLayout
  ): void,

  /**
     * 在设备丢失时清理上下文
     */
  release(): void,
}