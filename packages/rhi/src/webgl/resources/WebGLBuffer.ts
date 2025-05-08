import type { IRHIBuffer, RHIBufferDescriptor } from '@maxellabs/core';
import { RHIBufferUsage } from '@maxellabs/core';

/**
 * WebGL缓冲区实现
 */
export class GLBuffer implements IRHIBuffer {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private glBuffer: WebGLBuffer | null;
  protected bufferTarget: number;
  private bufferUsage: number;
  private size: number;
  private usage: RHIBufferUsage;
  private label?: string;
  private isDestroyed = false;

  /**
   * 创建WebGL缓冲区
   *
   * @param gl WebGL上下文
   * @param descriptor 缓冲区描述符
   */
  constructor (gl: WebGLRenderingContext | WebGL2RenderingContext, descriptor: RHIBufferDescriptor) {
    this.gl = gl;
    this.size = descriptor.size;
    this.usage = descriptor.usage;
    this.label = descriptor.label;

    this.bufferTarget = this.getGLBufferTarget(descriptor.usage);
    this.bufferUsage = this.getGLBufferUsage(descriptor.hint || 'static');

    // 创建WebGL缓冲区
    this.glBuffer = gl.createBuffer();

    if (!this.glBuffer) {
      throw new Error('创建WebGL缓冲区失败');
    }

    // 绑定并初始化
    gl.bindBuffer(this.bufferTarget, this.glBuffer);

    if (descriptor.initialData) {
      gl.bufferData(this.bufferTarget, descriptor.initialData, this.bufferUsage);
    } else {
      gl.bufferData(this.bufferTarget, descriptor.size, this.bufferUsage);
    }

    gl.bindBuffer(this.bufferTarget, null);
  }

  /**
   * 根据RHI缓冲区用途获取WebGL缓冲区目标
   */
  private getGLBufferTarget (usage: RHIBufferUsage): number {
    if (usage & RHIBufferUsage.VERTEX) {
      return this.gl.ARRAY_BUFFER;
    }
    if (usage & RHIBufferUsage.INDEX) {
      return this.gl.ELEMENT_ARRAY_BUFFER;
    }
    if (usage & RHIBufferUsage.UNIFORM) {
      return this.gl instanceof WebGL2RenderingContext
        ? this.gl.UNIFORM_BUFFER
        : this.gl.ARRAY_BUFFER; // WebGL1 回退
    }

    // 其他类型默认为ARRAY_BUFFER
    return this.gl.ARRAY_BUFFER;
  }

  /**
   * 根据提示获取WebGL缓冲区用途
   */
  private getGLBufferUsage (hint: 'static' | 'dynamic' | 'stream'): number {
    switch (hint) {
      case 'static': return this.gl.STATIC_DRAW;
      case 'dynamic': return this.gl.DYNAMIC_DRAW;
      case 'stream': return this.gl.STREAM_DRAW;
      default: return this.gl.STATIC_DRAW;
    }
  }

  /**
   * 更新缓冲区数据
   */
  update (data: BufferSource, offset = 0): void {
    if (this.isDestroyed) {
      console.warn('试图更新已销毁的缓冲区');

      return;
    }

    this.gl.bindBuffer(this.bufferTarget, this.glBuffer);

    if (offset === 0 && data.byteLength === this.size) {
      // 更新整个缓冲区
      this.gl.bufferData(this.bufferTarget, data, this.bufferUsage);
    } else {
      // 更新部分缓冲区
      this.gl.bufferSubData(this.bufferTarget, offset, data);
    }

    this.gl.bindBuffer(this.bufferTarget, null);
  }

  /**
   * 映射缓冲区以供CPU访问
   * 注意：WebGL1不支持真正的映射，这里模拟实现
   */
  async map (mode: 'read' | 'write' | 'read-write', offset = 0, size?: number): Promise<ArrayBuffer> {
    if (this.isDestroyed) {
      throw new Error('试图映射已销毁的缓冲区');
    }

    const actualSize = size || (this.size - offset);

    // WebGL2支持部分映射能力
    if (this.gl instanceof WebGL2RenderingContext) {
      const gl2 = this.gl;

      gl2.bindBuffer(this.bufferTarget, this.glBuffer);

      if (mode === 'read' || mode === 'read-write') {
        // 读取数据
        const buffer = new ArrayBuffer(actualSize);

        gl2.getBufferSubData(this.bufferTarget, offset, new Uint8Array(buffer));

        return buffer;
      } else {
        // 对于写入，创建一个新的缓冲区让用户填充，稍后在unmap时应用
        return new ArrayBuffer(actualSize);
      }
    } else {
      // WebGL1回退 - 创建一个临时缓冲区
      return new ArrayBuffer(actualSize);
    }
  }

  /**
   * 取消映射缓冲区
   */
  unmap (): void {
    // WebGL中无需特殊操作来取消映射
    this.gl.bindBuffer(this.bufferTarget, null);
  }

  /**
   * 获取原生WebGL缓冲区对象
   */
  getGLBuffer (): WebGLBuffer | null {
    return this.glBuffer;
  }

  /**
   * 销毁资源
   */
  destroy (): void {
    if (this.isDestroyed) {
      return;
    }

    if (this.glBuffer) {
      this.gl.deleteBuffer(this.glBuffer);
      this.glBuffer = null;
    }

    this.isDestroyed = true;
  }
}