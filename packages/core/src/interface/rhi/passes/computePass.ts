/**
 * computePass.ts
 * 定义计算通道接口
 */

import type { IRHIBuffer } from '../resources/buffer';
import type { IRHIComputePipeline } from '../pipeline';
import type { IRHIBindGroup } from '../bindings';

/**
 * 计算通道接口
 * 表示一次计算操作序列
 */
export interface IRHIComputePass {
  /**
   * 设置计算管线
   */
  setPipeline(pipeline: IRHIComputePipeline): void,

  /**
   * 设置绑定组
   */
  setBindGroup(slot: number, bindGroup: IRHIBindGroup, dynamicOffsets?: number[]): void,

  /**
   * 执行计算调度
   */
  dispatch(workgroupCountX: number, workgroupCountY?: number, workgroupCountZ?: number): void,

  /**
   * 执行间接计算调度
   */
  dispatchIndirect(indirectBuffer: IRHIBuffer, indirectOffset: number): void,

  /**
   * 执行推送常量更新
   * @param offset 偏移量（以字节为单位）
   * @param data 数据
   */
  pushConstants(offset: number, data: ArrayBufferView): void,

  /**
   * 结束计算通道
   */
  end(): void,
}