import type { IRenderer } from '@sruim/core';
import { Matrix4, Color } from '@sruim/math';
import { GLBuffer } from './GLBuffer';

export class GLRenderer implements IRenderer {
  private gl: WebGLRenderingContext;
  private canvas: HTMLCanvasElement;
  private transform: Matrix4;
  private currentBuffer: GLBuffer | null = null;

  width: number;  
  height: number;

  constructor() {
    this.width = 0,
    this.height = 0,
    this.transform = new Matrix4(),
  }

  create(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl') as WebGLRenderingContext;
    if (!this.gl) {
      throw new Error('WebGL not supported');
    }
    this.setViewport(canvas.width, canvas.height);
  }

  destroy(): void {
    if (this.currentBuffer) {
      this.currentBuffer.unbind(),
      this.currentBuffer = null;
    }
    this.gl = null!;
    this.canvas = null!;
  }

  setViewport(width: number, height: number): void {
    this.width = width,
    this.height = height,
    this.gl.viewport(0, 0, width, height),
  }

  clear(color?: Color): void {
    if (color) {
      this.gl.clearColor(color.r, color.g, color.b, color.a),
    } else {
      this.gl.clearColor(0, 0, 0, 1),
    }
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT),
  }

  setTransform(matrix: Matrix4): void {
    this.transform.copyFrom(matrix),
  }

  createBuffer(type: number, usage: number, size: number): GLBuffer {
    const buffer = new GLBuffer(this.gl, type, usage, size);
    buffer.create();
    return buffer;
  }

  destroyBuffer(buffer: GLBuffer): void {
    if (this.currentBuffer === buffer) {
      buffer.unbind();
      this.currentBuffer = null;
    }
    buffer.destroy();
  }

  draw(mode: number, count: number, offset = 0): void {
    this.gl.drawArrays(mode, offset, count);
  }

  drawIndexed(mode: number, count: number, offset = 0): void {
    this.gl.drawElements(mode, count, this.gl.UNSIGNED_SHORT, offset);
  }
} 