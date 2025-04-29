import type { IBuffer } from '@maxellabs/core';

/**
 * WebGL缓冲区管理类
 * 
 * 该类封装了WebGL的缓冲区对象（Buffer Objects）创建、绑定、更新和管理过程。
 * 包含缓冲区池化管理，可以复用相同类型和大小的缓冲区对象，减少资源创建和销毁开销。
 * 
 * @implements {IBuffer} - 缓冲区接口
 */
export class GLBuffer implements IBuffer {
  /** 静态缓冲池，用于复用相同特性的WebGL缓冲区 */
  private static bufferPool: Map<string, WebGLBuffer[]> = new Map();
  
  /** WebGL上下文 */
  private gl: WebGLRenderingContext;
  
  /** 当前缓冲区对象 */
  private buffer: WebGLBuffer | null;
  
  /** 引用计数，用于资源管理 */
  private refCount: number;
  
  /** 缓冲区大小（字节） */
  size: number;
  
  /** 缓冲区使用方式（例如：gl.STATIC_DRAW, gl.DYNAMIC_DRAW） */
  usage: number;
  
  /** 缓冲区类型（例如：gl.ARRAY_BUFFER, gl.ELEMENT_ARRAY_BUFFER） */
  public type: number;

  /**
   * 创建一个新的WebGL缓冲区对象
   * 
   * @param gl - WebGL渲染上下文
   * @param type - 缓冲区类型（gl.ARRAY_BUFFER或gl.ELEMENT_ARRAY_BUFFER）
   * @param usage - 缓冲区使用方式（gl.STATIC_DRAW, gl.DYNAMIC_DRAW, gl.STREAM_DRAW）
   * @param size - 缓冲区大小（字节）
   */
  constructor(gl: WebGLRenderingContext, type: number, usage: number, size: number) {
    this.gl = gl;
    this.type = type;
    this.usage = usage;
    this.size = size;
    this.refCount = 1;
    this.buffer = this.allocateFromPool();
  }

  /**
   * 从缓冲池中分配或创建一个新的WebGL缓冲区
   * 
   * @returns 分配的WebGL缓冲区对象
   * @throws {Error} 如果创建缓冲区失败
   * @private
   */
  private allocateFromPool(): WebGLBuffer {
    const key = `${this.type}_${this.usage}_${this.size}`;
    if (!GLBuffer.bufferPool.has(key)) {
      GLBuffer.bufferPool.set(key, []);
    }

    const pool = GLBuffer.bufferPool.get(key);
    if (pool && pool.length > 0) {
      return pool.pop()!;
    }

    const buffer = this.gl.createBuffer();
    if (!buffer) {
      throw new Error('Failed to create WebGL buffer');
    }
    return buffer;
  }

  /**
   * 创建缓冲区，如果已经从池中分配则不执行任何操作
   */
  create(): void {
    if (!this.buffer) {
      this.buffer = this.allocateFromPool();
    }
  }

  /**
   * 销毁当前缓冲区，将其回收到缓冲池
   */
  destroy(): void {
    if (this.buffer) {
      this.recycle();
      this.buffer = null;
    }
  }

  /**
   * 将缓冲区回收到缓冲池中以便复用
   * @private
   */
  private recycle(): void {
    const key = `${this.type}_${this.usage}_${this.size}`;
    const pool = GLBuffer.bufferPool.get(key);
    if (pool && this.buffer) {
      pool.push(this.buffer);
    }
  }

  /**
   * 更新缓冲区数据
   * 
   * @param data - 要上传到缓冲区的数据，可以是Float32Array（顶点数据）或Uint16Array（索引数据）
   * @param offset - 缓冲区中的偏移量（字节），默认为0
   * @throws {Error} 如果缓冲区尚未创建
   */
  update(data: Float32Array | Uint16Array, offset = 0): void {
    if (!this.buffer) {
      throw new Error('Buffer not created');
    }
    this.bind();
    this.gl.bufferData(this.type, data, this.usage);
    this.unbind();
  }

  /**
   * 绑定当前缓冲区到WebGL上下文
   * 
   * @throws {Error} 如果缓冲区尚未创建
   */
  bind(): void {
    if (!this.buffer) {
      throw new Error('Buffer not created');
    }
    this.gl.bindBuffer(this.type, this.buffer);
  }

  /**
   * 解除当前缓冲区的绑定
   */
  unbind(): void {
    this.gl.bindBuffer(this.type, null);
  }

  /**
   * 增加引用计数，用于资源共享
   */
  retain(): void {
    this.refCount++;
  }

  /**
   * 减少引用计数，当引用计数降为0时释放资源
   */
  release(): void {
    this.refCount--;
    if (this.refCount <= 0) {
      this.destroy();
    }
  }

  /**
   * 获取底层的WebGL缓冲区对象
   * 
   * @returns 原生WebGL缓冲区对象
   * @throws {Error} 如果缓冲区尚未创建
   */
  getBuffer(): WebGLBuffer {
    if (!this.buffer) {
      throw new Error('Buffer not created');
    }
    return this.buffer;
  }

  /**
   * 清空全局缓冲池
   * 
   * 通常在释放WebGL上下文时调用，以防止内存泄漏
   */
  static clearPool(): void {
    GLBuffer.bufferPool.clear();
  }
}