import type { IRenderer, IBuffer, IShader } from '@maxellabs/core';
import { GLRenderer } from './GLRenderer';
import { GLShader } from './GLShader';
import { GLBuffer } from './GLBuffer';
import { GLTexture } from './GLTexture';
import { GLVertexArray } from './GLVertexArray';
import { GLFramebuffer } from './GLFramebuffer';
import { GLState } from './GLState';
import { GLShaderConstants } from './GLShaderConstants';

/**
 * WebGL渲染器工厂类
 * 
 * 该类负责创建和管理WebGL渲染资源，实现单例模式确保资源共享。
 * 作为渲染系统的中心协调者，提供统一的资源创建接口。
 */
export class GLRendererFactory {
  /** 单例实例 */
  private static _instance: GLRendererFactory;
  
  /** WebGL渲染器实例 */
  private _renderer: GLRenderer;
  
  /** 默认着色器 */
  private shader: GLShader | null = null;
  
  /** 后处理着色器 */
  private postProcessShader: GLShader | null = null;
  
  /** WebGL状态管理器 */
  private state: GLState | null = null;

  /**
   * 私有构造函数，防止外部直接实例化
   */
  private constructor() {
    this._renderer = new GLRenderer();
  }

  /**
   * 获取工厂单例实例
   * 
   * @returns GLRendererFactory单例实例
   */
  static getInstance(): GLRendererFactory {
    if (!GLRendererFactory._instance) {
      GLRendererFactory._instance = new GLRendererFactory();
    }
    return GLRendererFactory._instance;
  }

  /**
   * 创建WebGL渲染器并初始化
   * 
   * @param canvas - 用于创建WebGL上下文的HTML5画布元素
   * @returns 初始化的渲染器实例
   */
  createRenderer(canvas: HTMLCanvasElement): IRenderer {
    this._renderer.create(canvas);
    this.state = new GLState(this._renderer.getGL());
    this.state.reset();
    return this._renderer;
  }

  /**
   * 创建着色器程序
   * 
   * @param vertexSource - 顶点着色器GLSL源代码
   * @param fragmentSource - 片元着色器GLSL源代码
   * @returns 编译好的着色器程序
   */
  createShader(vertexSource: string, fragmentSource: string): IShader {
    const shader = new GLShader(this._renderer.getGL());
    shader.create(vertexSource, fragmentSource);
    return shader;
  }

  /**
   * 创建后处理着色器
   * 
   * 使用预定义的全屏四边形渲染着色器，用于实现屏幕空间效果。
   * 如果已经存在，则返回缓存的实例，避免重复创建。
   * 
   * @returns 后处理着色器实例
   */
  createPostProcessShader(): GLShader {
    if (!this.postProcessShader) {
      this.postProcessShader = new GLShader(this._renderer.getGL());
      this.postProcessShader.create(
        GLShaderConstants.POST_PROCESS_VERTEX_SHADER,
        GLShaderConstants.POST_PROCESS_FRAGMENT_SHADER
      );
    }
    return this.postProcessShader;
  }

  /**
   * 创建WebGL缓冲区
   * 
   * @param type - 缓冲区类型(ARRAY_BUFFER或ELEMENT_ARRAY_BUFFER)
   * @param usage - 缓冲区使用方式(STATIC_DRAW, DYNAMIC_DRAW等)
   * @param size - 缓冲区大小(字节)
   * @returns 缓冲区对象
   */
  createBuffer(type: number, usage: number, size: number): IBuffer {
    return new GLBuffer(this._renderer.getGL(), type, usage, size);
  }

  /**
   * 创建WebGL纹理
   * 
   * @param format - 纹理格式(RGB, RGBA等)
   * @param type - 纹理数据类型(UNSIGNED_BYTE等)
   * @returns 纹理对象
   */
  createTexture(format: number, type: number): GLTexture {
    return new GLTexture(this._renderer.getGL(), format, type);
  }

  /**
   * 创建顶点数组对象(VAO)
   * 仅在WebGL2环境中可用
   * 
   * @returns 顶点数组对象
   * @throws {Error} 如果不支持WebGL2
   */
  createVertexArray(): GLVertexArray {
    return new GLVertexArray(this._renderer.getGL() as WebGL2RenderingContext);
  }

  /**
   * 创建帧缓冲对象
   * 
   * @param width - 帧缓冲宽度
   * @param height - 帧缓冲高度
   * @returns 帧缓冲对象
   */
  createFramebuffer(width: number, height: number): GLFramebuffer {
    return new GLFramebuffer(this._renderer.getGL());
  }

  /**
   * 获取WebGL状态管理器
   * 
   * @returns WebGL状态管理器
   * @throws {Error} 如果状态管理器未创建
   */
  getState(): GLState {
    if (!this.state) {
      throw new Error('State not created');
    }
    return this.state;
  }

  /**
   * 获取当前渲染器实例
   * 
   * @returns 渲染器实例
   */
  getRenderer(): IRenderer {
    return this._renderer;
  }

  /**
   * 释放所有资源
   * 
   * 销毁所有创建的着色器和渲染器资源，通常在应用程序退出时调用。
   */
  destroy(): void {
    if (this.shader) {
      this.shader.dispose();
      this.shader = null;
    }
    if (this.postProcessShader) {
      this.postProcessShader.dispose();
      this.postProcessShader = null;
    }
    if (this._renderer) {
      this._renderer.dispose();
    }
    this.state = null;
  }
}