import type { BufferType, BufferUsage } from './constants';

/**
 * 缓冲区访问标志
 */
export enum BufferAccessFlags {
  /**
   * 只读访问
   */
  READ = 0x1,
  
  /**
   * 只写访问
   */
  WRITE = 0x2,
  
  /**
   * 读写访问
   */
  READ_WRITE = 0x3
}

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
   * 是否使用共享内存(可在主线程和Worker之间共享)
   */
  shared?: boolean;
  
  /**
   * 是否可映射(CPU可直接访问)
   */
  mappable?: boolean;
  
  /**
   * 标签(用于调试)
   */
  label?: string;
}

/**
 * 映射访问范围
 */
export interface BufferRange {
  /**
   * 起始偏移(字节)
   */
  offset: number;
  
  /**
   * 长度(字节)
   */
  size: number;
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
   * 缓冲区是否可映射
   */
  isMappable: boolean;
  
  /**
   * 缓冲区是否共享
   */
  isShared: boolean;
  
  /**
   * 当前缓冲区是否已映射
   */
  isMapped: boolean;

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
  
  /**
   * 映射缓冲区到CPU内存
   * @param access - 访问标志
   * @param range - 可选的映射范围，不提供则映射整个缓冲区
   * @returns 映射后的ArrayBuffer视图
   */
  map(access: BufferAccessFlags, range?: BufferRange): ArrayBufferView | null;
  
  /**
   * 解除缓冲区映射
   * @param flush - 是否将更改刷新到GPU
   */
  unmap(flush?: boolean): void;
  
  /**
   * 刷新映射缓冲区的特定范围
   * @param range - 要刷新的范围，不提供则刷新整个映射区域
   */
  flushMappedRange(range?: BufferRange): void;
  
  /**
   * 使缓冲区失效
   * @param range - 要失效的范围，不提供则整个缓冲区失效
   */
  invalidateMappedRange(range?: BufferRange): void;
  
  /**
   * 创建共享缓冲区视图
   * @param offset - 视图起始偏移(字节)
   * @param size - 视图大小(字节)
   * @returns 缓冲区视图
   */
  createView(offset: number, size: number): IBuffer;
  
  /**
   * 将缓冲区转换为TypedArray视图
   * @param type - 类型化数组构造函数
   * @param byteOffset - 起始字节偏移
   * @param length - 元素数量
   * @returns 类型化数组视图
   */
  asTypedArray<T extends ArrayBufferView>(
    constructor: new (buffer: ArrayBuffer, byteOffset?: number, length?: number) => T,
    byteOffset?: number,
    length?: number
  ): T | null;
}