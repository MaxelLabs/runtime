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
    debugger
    this.transform = new Matrix4();
  }

  create(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const gl = this.canvas.getContext('webgl2');
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

    this.gl = null;
    this.canvas = null;
    this.state = null;
  }

  setViewport(width: number, height: number): void {
    if (!this.gl) return;

    this.width = width;
    this.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  setClearColor(color: Color): void {
    if (!this.gl) return;

    this.gl.clearColor(color.r, color.g, color.b, color.a);
  }

  clear(color?: Color): void {
    if (!this.gl) return;

    if (color) {
      this.setClearColor(color);
    }
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  setTransform(matrix: Matrix4): void {
    this.transform.copyFrom(matrix);
  }

  createBuffer(type: number, usage: number, size: number): IBuffer {
    if (!this.gl) throw new Error('WebGL context not created');

    const buffer = new GLBuffer(this.gl, type, usage, size);
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
    if (!this.gl) return;

    this.gl.drawArrays(mode, offset, count);
  }

  drawIndexed(mode: number, count: number, offset = 0): void {
    if (!this.gl) return;

    this.gl.drawElements(mode, count, this.gl.UNSIGNED_SHORT, offset);
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

  drawFullscreenQuad(): void {
    if (!this.gl) return;

    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]);

    const tempBuffer = this.createBuffer(this.gl.ARRAY_BUFFER, this.gl.STATIC_DRAW, vertices.byteLength);
    tempBuffer.update(vertices);
    tempBuffer.bind();

    const currentProgram = this.gl.getParameter(this.gl.CURRENT_PROGRAM);
    if (currentProgram) {
      const positionLocation = this.gl.getAttribLocation(currentProgram, "aPosition");
      if (positionLocation >= 0) {
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.disableVertexAttribArray(positionLocation);
      }
    }

    tempBuffer.unbind();
    this.destroyBuffer(tempBuffer);
  }
}