import { Matrix4, Color } from '@max/math';
import type { IRenderer, IBuffer } from '@max/core';
import { GLBuffer } from './GLBuffer';
import { GLState } from './GLState';

export class GLRenderer implements IRenderer {
  private gl: WebGL2RenderingContext | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private transform: Matrix4;
  private currentBuffer: GLBuffer | null = null;
  private state: GLState | null = null;
  width: number = 0;
  height: number = 0;

  constructor() {
    this.transform = new Matrix4();
  }

  create(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      throw new Error('WebGL2 not supported');
    }
    this.gl = gl;
    this.state = new GLState(gl);
    this.state.reset();
  }

  destroy(): void {
    if (this.currentBuffer) {
      this.currentBuffer.destroy();
      this.currentBuffer = null;
    }
  }

  setViewport(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.gl!.viewport(0, 0, width, height);
  }

  setClearColor(color: Color): void {
    this.gl!.clearColor(color.r, color.g, color.b, color.a);
  }

  clear(color?: Color): void {
    if (color) {
      this.setClearColor(color);
    }
    this.gl!.clear(this.gl!.COLOR_BUFFER_BIT | this.gl!.DEPTH_BUFFER_BIT);
  }

  setTransform(matrix: Matrix4): void {
    this.transform = matrix;
  }

  createBuffer(type: number, usage: number, size: number): IBuffer {
    const buffer = new GLBuffer(this.gl!, type, usage, size);
    buffer.create();
    return buffer;
  }

  destroyBuffer(buffer: IBuffer): void {
    if (this.currentBuffer === buffer) {
      this.currentBuffer = null;
    }
    buffer.destroy();
  }

  draw(mode: number, count: number, offset = 0): void {
    this.gl!.drawArrays(mode, offset, count);
  }

  drawIndexed(mode: number, count: number, offset = 0): void {
    this.gl!.drawElements(mode, count, this.gl!.UNSIGNED_SHORT, offset);
  }

  dispose(): void {
    this.destroy();
  }

  getGL(): WebGL2RenderingContext {
    if (!this.gl) {
      throw new Error('WebGL2 context not created');
    }
    return this.gl;
  }
}