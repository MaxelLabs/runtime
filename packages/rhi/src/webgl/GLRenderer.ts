import { Matrix4, Color } from '@maxellabs/math';
import type { IRenderer, IBuffer } from '@maxellabs/core';
import { GLBuffer } from './GLBuffer';
import { GLState } from './GLState';

/**
 * WebGL渲染器类
 * 
 * 这个类是WebGL渲染接口层的核心实现，负责管理WebGL上下文、渲染状态和基本绘制操作。
 * 封装了WebGL API，提供了简化的渲染接口，用于实现各种绘制功能。
 * 
 * @implements {IRenderer} 渲染器接口
 */
export class GLRenderer implements IRenderer {
  /** WebGL渲染上下文 */
  private gl: WebGL2RenderingContext | null = null;
  
  /** HTML画布元素 */
  private canvas: HTMLCanvasElement | null = null;
  
  /** 当前变换矩阵 */
  private _transform: Matrix4;
  
  /** 当前绑定的缓冲区 */
  private currentBuffer: GLBuffer | null = null;
  
  /** WebGL状态管理器 */
  private state: GLState | null = null;
  
  /** 渲染目标宽度，单位为像素 */
  width: number = 0;
  
  /** 渲染目标高度，单位为像素 */
  height: number = 0;

  /**
   * 创建WebGL渲染器实例
   * 
   * 初始化变换矩阵和内部状态，但不创建WebGL上下文。
   * 需要调用create方法来初始化WebGL上下文。
   */
  constructor() {
    this._transform = new Matrix4();
  }

  /**
   * 创建WebGL渲染上下文
   * 
   * 使用提供的Canvas元素初始化WebGL2上下文并设置初始状态。
   * 
   * @param canvas - 用于创建WebGL上下文的HTML Canvas元素
   * @throws {Error} 如果WebGL2不受支持
   */
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

  /**
   * 销毁渲染器及其资源
   * 
   * 释放所有WebGL资源并重置内部状态。
   */
  destroy(): void {
    if (this.currentBuffer) {
      this.currentBuffer.destroy();
      this.currentBuffer = null;
    }

    this.gl = null;
    this.canvas = null;
    this.state = null;
  }

  /**
   * 设置视口尺寸
   * 
   * 配置渲染视口大小，确定绘制区域的尺寸。
   * 
   * @param width - 视口宽度（像素）
   * @param height - 视口高度（像素）
   */
  setViewport(width: number, height: number): void {
    if (!this.gl) return;

    this.width = width;
    this.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  /**
   * 设置清除颜色
   * 
   * 配置用于清除颜色缓冲区的RGBA颜色值。
   * 
   * @param color - 用于清除的颜色值
   */
  setClearColor(color: Color): void {
    if (!this.gl) return;

    this.gl.clearColor(color.r, color.g, color.b, color.a);
  }

  /**
   * 清除渲染缓冲区
   * 
   * 使用当前清除颜色和深度值清空颜色和深度缓冲区。
   * 
   * @param color - 可选，用于清除的颜色值，如果提供则会先设置清除颜色
   */
  clear(color?: Color): void {
    if (!this.gl) return;

    if (color) {
      this.setClearColor(color);
    }
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  /**
   * 设置变换矩阵
   * 
   * 更新渲染器的当前变换矩阵，可用于后续绘制操作。
   * 
   * @param matrix - 新的变换矩阵
   */
  setTransform(matrix: Matrix4): void {
    this._transform.copyFrom(matrix);
  }

  /**
   * 创建WebGL缓冲区
   * 
   * 创建指定类型、用途和大小的缓冲区对象。
   * 
   * @param type - 缓冲区类型（如gl.ARRAY_BUFFER或gl.ELEMENT_ARRAY_BUFFER）
   * @param usage - 缓冲区使用方式（如gl.STATIC_DRAW或gl.DYNAMIC_DRAW）
   * @param size - 缓冲区大小（字节）
   * @returns 创建的缓冲区对象
   * @throws {Error} 如果WebGL上下文未创建
   */
  createBuffer(type: number, usage: number, size: number): IBuffer {
    if (!this.gl) throw new Error('WebGL context not created');

    const buffer = new GLBuffer(this.gl, type, usage, size);
    buffer.create();
    return buffer;
  }

  /**
   * 销毁缓冲区对象
   * 
   * 释放指定缓冲区的WebGL资源。
   * 
   * @param buffer - 要销毁的缓冲区对象
   */
  destroyBuffer(buffer: IBuffer): void {
    if (this.currentBuffer === buffer) {
      this.currentBuffer = null;
    }
    buffer.destroy();
  }

  /**
   * 使用顶点数组绘制图元
   * 
   * 使用当前绑定的顶点缓冲区进行非索引绘制。
   * 
   * @param mode - 绘制模式（如gl.TRIANGLES, gl.LINES等）
   * @param count - 要绘制的顶点数量
   * @param offset - 顶点缓冲区中的起始偏移量（以顶点为单位，默认为0）
   */
  draw(mode: number, count: number, offset = 0): void {
    if (!this.gl) return;

    this.gl.drawArrays(mode, offset, count);
  }

  /**
   * 使用索引缓冲区绘制图元
   * 
   * 使用当前绑定的顶点缓冲区和索引缓冲区进行索引绘制。
   * 
   * @param mode - 绘制模式（如gl.TRIANGLES, gl.LINES等）
   * @param count - 要绘制的索引数量
   * @param offset - 索引缓冲区中的起始偏移量（以字节为单位，默认为0）
   */
  drawIndexed(mode: number, count: number, offset = 0): void {
    if (!this.gl) return;

    this.gl.drawElements(mode, count, this.gl.UNSIGNED_SHORT, offset);
  }

  /**
   * 释放渲染器资源（别名方法）
   * 
   * 调用destroy方法释放所有WebGL资源。
   */
  dispose(): void {
    this.destroy();
  }

  /**
   * 获取WebGL渲染上下文
   * 
   * @returns WebGL2渲染上下文对象
   * @throws {Error} 如果WebGL上下文未创建
   */
  getGL(): WebGL2RenderingContext {
    if (!this.gl) {
      throw new Error('WebGL2 context not created');
    }
    return this.gl;
  }

  /**
   * 绘制全屏四边形
   * 
   * 创建并绘制覆盖整个屏幕的四边形，通常用于后处理效果。
   * 方法会自动创建临时缓冲区，完成绘制后释放资源。
   */
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