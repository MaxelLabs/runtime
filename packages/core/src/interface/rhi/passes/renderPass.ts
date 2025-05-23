/**
 * renderPass.ts
 * 定义渲染通道接口
 */

import type { IRHIBuffer } from '../resources/buffer';
import type { IRHIRenderPipeline } from '../pipeline';
import type { IRHIBindGroup } from '../bindings';
import type { RHIIndexFormat } from '../types/enums';

/**
 * 渲染通道接口
 * 表示一次渲染操作序列
 */
export interface IRHIRenderPass {
  /**
   * 设置渲染管线
   */
  setPipeline(pipeline: IRHIRenderPipeline): void;

  /**
   * 设置索引缓冲区
   */
  setIndexBuffer(buffer: IRHIBuffer, indexFormat: RHIIndexFormat, offset?: number): void;

  /**
   * 设置顶点缓冲区
   */
  setVertexBuffer(slot: number, buffer: IRHIBuffer, offset?: number, size?: number): void;

  /**
   * 设置绑定组
   */
  setBindGroup(slot: number, bindGroup: IRHIBindGroup, dynamicOffsets?: number[]): void;

  /**
   * 绘制几何体
   */
  draw(vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number): void;

  /**
   * 使用索引绘制几何体
   */
  drawIndexed(
    indexCount: number,
    instanceCount?: number,
    firstIndex?: number,
    baseVertex?: number,
    firstInstance?: number
  ): void;

  /**
   * 设置视口
   */
  setViewport(x: number, y: number, width: number, height: number, minDepth?: number, maxDepth?: number): void;

  /**
   * 设置裁剪矩形
   */
  setScissorRect(x: number, y: number, width: number, height: number): void;

  /**
   * 设置混合常量
   */
  setBlendConstant(color: [number, number, number, number]): void;

  /**
   * 设置模板参考值
   */
  setStencilReference(reference: number): void;

  /**
   * 执行间接绘制
   */
  drawIndirect(indirectBuffer: IRHIBuffer, indirectOffset: number): void;

  /**
   * 执行间接索引绘制
   */
  drawIndexedIndirect(indirectBuffer: IRHIBuffer, indirectOffset: number): void;

  /**
   * 执行推送常量更新
   * @param offset 偏移量（以字节为单位）
   * @param data 数据
   */
  pushConstants(offset: number, data: ArrayBufferView): void;

  /**
   * 结束渲染通道
   * 在WebGPU中关闭编码器，在WebGL中更新状态
   */
  end(): void;
}
