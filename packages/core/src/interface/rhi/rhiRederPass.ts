/**
 * 渲染通道接口
 * 表示一次渲染操作序列
 */
export interface IRHIRenderPass {
  /**
     * 设置渲染管线
     */
  setPipeline(pipeline: IRHIRenderPipeline): void,

  /**
     * 设置索引缓冲区
     */
  setIndexBuffer(buffer: IRHIBuffer, indexFormat: RHIIndexFormat): void,

  /**
     * 设置顶点缓冲区
     */
  setVertexBuffer(slot: number, buffer: IRHIBuffer, offset?: number): void,

  /**
     * 设置绑定组
     */
  setBindGroup(slot: number, bindGroup: IRHIBindGroup): void,

  /**
     * 绘制几何体
     */
  draw(vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number): void,

  /**
     * 使用索引绘制几何体
     */
  drawIndexed(
    indexCount: number,
    instanceCount?: number,
    firstIndex?: number,
    baseVertex?: number,
    firstInstance?: number
  ): void,

  /**
     * 结束渲染通道
     * 在WebGPU中关闭编码器，在WebGL中更新状态
     */
  end(): void,
}