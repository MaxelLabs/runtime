/**
 * vertexArray.ts
 * 顶点数组对象接口定义
 */

import type { IRHIResource } from './index';
import type { IRHIBuffer } from './buffer';

/**
 * 顶点属性描述符
 */
export interface RHIVertexAttributeDescriptor {
  /** 属性位置 */
  location: number;
  /** 数据格式 */
  format: string;
  /** 偏移量 */
  offset: number;
  /** 缓冲区索引 */
  bufferIndex: number;
}

/**
 * 顶点缓冲区绑定
 */
export interface RHIVertexBufferBinding {
  /** 缓冲区 */
  buffer: IRHIBuffer;
  /** 偏移量 */
  offset: number;
  /** 步长 */
  stride: number;
}

/**
 * 顶点数组对象接口
 */
export interface IRHIVertexArray extends IRHIResource {
  /**
   * 绑定顶点缓冲区
   */
  setVertexBuffer(index: number, buffer: IRHIBuffer, offset?: number, stride?: number): void;

  /**
   * 设置索引缓冲区
   */
  setIndexBuffer(buffer: IRHIBuffer): void;

  /**
   * 设置顶点属性
   */
  setVertexAttribute(location: number, format: string, offset: number, bufferIndex: number): void;

  /**
   * 绑定顶点数组对象
   */
  bind(): void;

  /**
   * 解绑顶点数组对象
   */
  unbind(): void;
}
