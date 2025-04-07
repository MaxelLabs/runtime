import type { IBuffer } from '@sruim/core';

export class GLBuffer implements IBuffer {
  private buffer: WebGLBuffer | null = null;
  private gl: WebGLRenderingContext;

  type: number;
  usage: number;
  size: number;

  constructor (gl: WebGLRenderingContext, type: number, usage: number, size: number) {
    this.gl = gl;
    this.type = type;
    this.usage = usage;
    this.size = size;
  }

  create (): void {
    this.buffer = this.gl.createBuffer();
    if (!this.buffer) {
      throw new Error('Failed to create WebGL buffer');
    }
  }

  destroy (): void {
    if (this.buffer) {
      this.gl.deleteBuffer(this.buffer);
      this.buffer = null;
    }
  }

  update (data: Float32Array | Uint16Array, offset = 0): void {
    if (!this.buffer) {
      throw new Error('Buffer not created');
    }
    this.bind();
    this.gl.bufferData(this.type, data, this.usage);
    this.unbind();
  }

  bind (): void {
    if (!this.buffer) {
      throw new Error('Buffer not created');
    }
    this.gl.bindBuffer(this.type, this.buffer);
  }

  unbind (): void {
    this.gl.bindBuffer(this.type, null);
  }
}