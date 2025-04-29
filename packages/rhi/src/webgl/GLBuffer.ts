import type { IBuffer } from '@maxellabs/core';

export class GLBuffer implements IBuffer {
  private static bufferPool: Map<string, WebGLBuffer[]> = new Map();
  private gl: WebGLRenderingContext;
  private buffer: WebGLBuffer | null;
  private refCount: number;
   size: number;
  usage: number;
  public type: number;

  constructor(gl: WebGLRenderingContext, type: number, usage: number, size: number) {
    this.gl = gl;
    this.type = type;
    this.usage = usage;
    this.size = size;
    this.refCount = 1;
    this.buffer = this.allocateFromPool();
  }

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

  create(): void {
    if (!this.buffer) {
      this.buffer = this.allocateFromPool();
    }
  }

  destroy(): void {
    if (this.buffer) {
      this.recycle();
      this.buffer = null;
    }
  }

  private recycle(): void {
    const key = `${this.type}_${this.usage}_${this.size}`;
    const pool = GLBuffer.bufferPool.get(key);
    if (pool && this.buffer) {
      pool.push(this.buffer);
    }
  }

  update(data: Float32Array | Uint16Array, offset = 0): void {
    if (!this.buffer) {
      throw new Error('Buffer not created');
    }
    this.bind();
    this.gl.bufferData(this.type, data, this.usage);
    this.unbind();
  }

  bind(): void {
    if (!this.buffer) {
      throw new Error('Buffer not created');
    }
    this.gl.bindBuffer(this.type, this.buffer);
  }

  unbind(): void {
    this.gl.bindBuffer(this.type, null);
  }

  retain(): void {
    this.refCount++;
  }

  release(): void {
    this.refCount--;
    if (this.refCount <= 0) {
      this.destroy();
    }
  }

  getBuffer(): WebGLBuffer {
    if (!this.buffer) {
      throw new Error('Buffer not created');
    }
    return this.buffer;
  }

  static clearPool(): void {
    GLBuffer.bufferPool.clear();
  }
}