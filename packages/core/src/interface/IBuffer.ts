import { BufferType, BufferUsage } from './constants';

/**
 * 缓冲区描述符接口
 */
export interface BufferDescriptor {
  /**
   * 缓冲区类型
   */
  type: BufferType;

  /**
   * 缓冲区用途
   */
  usage: BufferUsage;

  /**
   * 缓冲区大小(字节)
   */
  size: number;
  
  /**
   * 初始数据
   */
  data?: ArrayBufferView;
  
  /**
   * 是否动态使用(频繁更新)
   */
  dynamic?: boolean;
  
  /**
   * 当类型为索引缓冲区时的索引类型
   */
  indexType?: 'uint16' | 'uint32';
  
  /**
   * 标签(用于调试)
   */
  label?: string;
}

/**
 * 缓冲区接口 - 定义GPU缓冲区操作
 */
export interface IBuffer {
  /**
   * 缓冲区ID
   */
  id: number;
  
  /**
   * 缓冲区类型
   */
  type: BufferType;

  /**
   * 缓冲区用途
   */
  usage: BufferUsage;

  /**
   * 缓冲区大小(字节)
   */
  size: number;
  
  /**
   * 缓冲区是否就绪
   */
  isReady: boolean;

  /**
   * 创建缓冲区
   */
  create(): void;

  /**
   * 销毁缓冲区
   */
  destroy(): void;

  /**
   * 更新缓冲区数据
   * @param data - 要更新的数据
   * @param offset - 偏移量(字节)
   */
  update(data: ArrayBufferView, offset?: number): void;
  
  /**
   * 更新缓冲区子区域数据
   * @param data - 要更新的数据
   * @param dstByteOffset - 目标缓冲区的字节偏移量
   * @param srcByteOffset - 源数据的字节偏移量
   * @param byteLength - 要复制的字节长度
   */
  updateSubData(data: ArrayBufferView, dstByteOffset: number, srcByteOffset?: number, byteLength?: number): void;

  /**
   * 绑定缓冲区
   * @param target - 可选绑定目标
   */
  bind(target?: number): void;

  /**
   * 解绑缓冲区
   * @param target - 可选绑定目标
   */
  unbind(target?: number): void;
  
  /**
   * 复制数据到另一个缓冲区
   * @param destination - 目标缓冲区
   * @param srcOffset - 源缓冲区偏移量(字节)
   * @param dstOffset - 目标缓冲区偏移量(字节)
   * @param size - 复制大小(字节)
   */
  copyTo(destination: IBuffer, srcOffset: number, dstOffset: number, size: number): void;
  
  /**
   * 获取缓冲区数据
   * @returns 缓冲区数据
   */
  getData(): ArrayBuffer | null;
}