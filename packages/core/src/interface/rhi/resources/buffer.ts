/**
 * buffer.ts
 * 定义缓冲区资源接口
 */

import type { RHIBufferUsage } from '../types/enums';

/**
 * 缓冲区资源接口
 */
export interface IRHIBuffer {
  /**
   * 缓冲区大小（字节）
   */
  readonly size: number,

  /**
   * 缓冲区用途
   */
  readonly usage: RHIBufferUsage,

  /**
   * 缓冲区标签
   */
  readonly label?: string,

  /**
   * 更新缓冲区数据
   * @param data 源数据
   * @param offset 目标偏移量（字节）
   */
  update(data: BufferSource, offset?: number): void,

  /**
   * 映射缓冲区以进行CPU访问
   * @param mode 访问模式
   * @param offset 映射偏移量（字节）
   * @param size 映射大小（字节）
   */
  map(mode: 'read' | 'write' | 'read-write', offset?: number, size?: number): Promise<ArrayBuffer>,

  /**
   * 取消映射缓冲区
   */
  unmap(): void,

  /**
   * 销毁资源
   */
  destroy(): void,
}