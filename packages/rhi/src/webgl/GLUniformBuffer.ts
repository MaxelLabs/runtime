import type { IUniformBuffer } from '@maxellabs/core';

/**
 * WebGL 2.0 Uniform 缓冲区对象封装类
 * 
 * 该类封装了WebGL 2.0中的Uniform缓冲区对象(UBO)，提供了创建、更新和绑定UBO的方法。
 * 适用于存储大量的uniform变量，特别是矩阵、向量等数据。相比单独设置uniform变量，
 * 使用UBO可以大幅提高渲染性能，特别是当有多个着色器程序共享相同uniform变量时。
 * 
 * @implements {IUniformBuffer} - Uniform缓冲区接口
 */
export class GLUniformBuffer implements IUniformBuffer {
  /** WebGL上下文，必须是WebGL 2.0版本 */
  private gl: WebGL2RenderingContext;
  
  /** UBO对象 */
  private buffer: WebGLBuffer | null = null;
  
  /** 绑定点索引，用于关联UBO和着色器程序 */
  private bindingPoint: number;
  
  /** UBO大小（字节） */
  private size: number;
  
  /** 缓冲区使用方式 */
  private usage: number;
  
  /** UBO数据存储 */
  private data: Float32Array;

  /**
   * 创建一个新的Uniform缓冲区对象
   * 
   * @param gl - WebGL 2.0 渲染上下文
   * @param size - 缓冲区大小（字节）
   * @param bindingPoint - 绑定点索引（0-WebGL允许的最大值）
   * @param usage - 缓冲区使用方式，默认为gl.DYNAMIC_DRAW
   * @throws {Error} 如果context不是WebGL 2.0上下文
   */
  constructor(gl: WebGLRenderingContext, size: number, bindingPoint: number, usage?: number) {
    if (!(gl instanceof WebGL2RenderingContext)) {
      throw new Error('GLUniformBuffer requires WebGL 2.0 context');
    }
    
    this.gl = gl as WebGL2RenderingContext;
    this.size = size;
    this.bindingPoint = bindingPoint;
    this.usage = usage || this.gl.DYNAMIC_DRAW;
    this.data = new Float32Array(size / 4); // 4字节对齐
    
    this.create();
  }

  /**
   * 创建Uniform缓冲区
   * 
   * @throws {Error} 如果创建失败
   */
  create(): void {
    this.buffer = this.gl.createBuffer();
    if (!this.buffer) {
      throw new Error('Failed to create uniform buffer');
    }
    
    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.buffer);
    this.gl.bufferData(this.gl.UNIFORM_BUFFER, this.size, this.usage);
    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
    
    // 将缓冲区绑定到指定的绑定点
    this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, this.bindingPoint, this.buffer);
  }

  /**
   * 销毁Uniform缓冲区
   */
  destroy(): void {
    if (this.buffer) {
      this.gl.deleteBuffer(this.buffer);
      this.buffer = null;
    }
  }

  /**
   * 绑定Uniform缓冲区到指定绑定点
   */
  bind(): void {
    if (!this.buffer) return;
    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.buffer);
  }

  /**
   * 解绑Uniform缓冲区
   */
  unbind(): void {
    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
  }

  /**
   * 更新整个Uniform缓冲区数据
   * 
   * @param data - 包含所有uniform数据的Float32Array
   */
  update(data: Float32Array): void {
    if (!this.buffer) return;
    
    this.data = data;
    this.bind();
    this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, data);
    this.unbind();
  }

  /**
   * 更新Uniform缓冲区的特定部分
   * 
   * @param data - 要更新的数据
   * @param offset - 更新的起始位置（字节偏移量）
   */
  updateSubData(data: Float32Array, offset: number): void {
    if (!this.buffer) return;
    
    this.bind();
    this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, offset, data);
    this.unbind();
  }

  /**
   * 设置4x4矩阵到缓冲区
   * 
   * @param matrix - 16个元素的Float32Array表示的矩阵
   * @param offset - 矩阵在缓冲区中的字节偏移量
   */
  setMatrix4(matrix: Float32Array, offset: number): void {
    // 检查参数
    if (matrix.length !== 16) {
      throw new Error('Matrix4 must have 16 elements');
    }
    
    // 计算偏移量（以浮点数为单位）
    const floatOffset = offset / 4;
    
    // 复制矩阵到数据缓冲
    for (let i = 0; i < 16; i++) {
      this.data[floatOffset + i] = matrix[i];
    }
    
    // 更新缓冲区
    this.updateSubData(matrix, offset);
  }

  /**
   * 设置向量到缓冲区
   * 
   * @param vector - 表示向量的Float32Array
   * @param offset - 向量在缓冲区中的字节偏移量
   */
  setVector(vector: Float32Array, offset: number): void {
    const floatOffset = offset / 4;
    
    for (let i = 0; i < vector.length; i++) {
      this.data[floatOffset + i] = vector[i];
    }
    
    this.updateSubData(vector, offset);
  }

  /**
   * 设置浮点数到缓冲区
   * 
   * @param value - 浮点数值
   * @param offset - 在缓冲区中的字节偏移量
   */
  setFloat(value: number, offset: number): void {
    const floatOffset = offset / 4;
    this.data[floatOffset] = value;
    
    const temp = new Float32Array(1);
    temp[0] = value;
    this.updateSubData(temp, offset);
  }

  /**
   * 将当前的Uniform缓冲区与着色器程序中的统一缓冲区块绑定
   * 
   * @param program - WebGL着色器程序
   * @param uniformBlockName - 着色器中统一缓冲区块的名称
   */
  bindToShader(program: WebGLProgram, uniformBlockName: string): void {
    const blockIndex = this.gl.getUniformBlockIndex(program, uniformBlockName);
    if (blockIndex !== this.gl.INVALID_INDEX) {
      this.gl.uniformBlockBinding(program, blockIndex, this.bindingPoint);
    }
  }

  /**
   * 获取底层WebGL缓冲区对象
   * 
   * @returns WebGL缓冲区对象或null
   */
  getBuffer(): WebGLBuffer | null {
    return this.buffer;
  }

  /**
   * 获取UBO的绑定点索引
   * 
   * @returns 绑定点索引
   */
  getBindingPoint(): number {
    return this.bindingPoint;
  }
}