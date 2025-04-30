import { Matrix4, Vector4 } from '@maxellabs/math';
import { IHardwareRenderer, RenderBufferUsage, RenderBufferType, ClearFlag } from '@maxellabs/core';
import { GLBuffer } from './GLBuffer';
import { GLShader } from './GLShader';
import { GLTexture } from './GLTexture';
import { GLRenderTarget } from './GLRenderTarget';

/**
 * WebGL渲染器类，提供基于WebGL的渲染功能
 */
export class WebGLRenderer implements IHardwareRenderer {
  /** WebGL上下文 */
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  /** 画布元素 */
  private canvas: HTMLCanvasElement;
  /** 是否为WebGL2 */
  private isWebGL2: boolean;
  /** 设备丢失回调 */
  private deviceLostHandler: () => void;
  /** 设备恢复回调 */
  private deviceRestoredHandler: () => void;
  /** 当前绑定的着色器程序 */
  private currentShader: GLShader | null = null;
  /** 当前绑定的顶点缓冲区 */
  private currentVertexBuffer: GLBuffer | null = null;
  /** 当前绑定的索引缓冲区 */
  private currentIndexBuffer: GLBuffer | null = null;
  /** 当前绑定的渲染目标 */
  private currentRenderTarget: GLRenderTarget | null = null;
  /** 画布宽度 */
  private width: number = 0;
  /** 画布高度 */
  private height: number = 0;
  /** 渲染器是否已初始化 */
  private initialized: boolean = false;
  /** 支持的扩展 */
  private extensions: Map<string, any> = new Map();
  /** 背景颜色 */
  private clearColor: Vector4 = new Vector4(0, 0, 0, 1);
  /** 是否已经丢失设备 */
  private isDeviceLost: boolean = false;

  /**
   * 创建WebGL渲染器
   */
  constructor() {
    // 空构造函数，需要调用init方法完成初始化
  }

  /**
   * 初始化渲染器
   * @param canvas 画布元素
   * @param deviceLostHandler 设备丢失回调
   * @param deviceRestoredHandler 设备恢复回调
   */
  init(
    canvas: HTMLCanvasElement,
    deviceLostHandler: () => void,
    deviceRestoredHandler: () => void
  ): boolean {
    if (this.initialized) {
      return true;
    }

    this.canvas = canvas;
    this.deviceLostHandler = deviceLostHandler;
    this.deviceRestoredHandler = deviceRestoredHandler;

    // 尝试获取WebGL2上下文
    this.gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
    this.isWebGL2 = !!this.gl;

    // 如果WebGL2不可用，回退到WebGL1
    if (!this.gl) {
      this.gl = canvas.getContext('webgl', { alpha: true, antialias: true }) as WebGLRenderingContext;
      this.isWebGL2 = false;
    }

    if (!this.gl) {
      console.error('WebGL not supported');
      return false;
    }

    // 监听设备丢失事件
    canvas.addEventListener('webglcontextlost', this.onContextLost.bind(this), false);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored.bind(this), false);

    // 初始化扩展
    this.initExtensions();

    // 设置初始GL状态
    this.setupInitialGLState();

    // 设置视口
    this.width = canvas.width;
    this.height = canvas.height;
    this.gl.viewport(0, 0, this.width, this.height);

    this.initialized = true;
    return true;
  }

  /**
   * 初始化WebGL扩展
   */
  private initExtensions(): void {
    const gl = this.gl;
    
    // 基本扩展
    this.tryEnableExtension('OES_element_index_uint');
    this.tryEnableExtension('OES_standard_derivatives');
    this.tryEnableExtension('EXT_shader_texture_lod');
    
    // 纹理相关扩展
    this.tryEnableExtension('EXT_texture_filter_anisotropic');
    this.tryEnableExtension('WEBGL_compressed_texture_s3tc');
    this.tryEnableExtension('WEBGL_compressed_texture_etc');
    this.tryEnableExtension('WEBGL_compressed_texture_astc');
    
    // WebGL1特定扩展
    if (!this.isWebGL2) {
      this.tryEnableExtension('OES_texture_float');
      this.tryEnableExtension('OES_texture_half_float');
      this.tryEnableExtension('OES_vertex_array_object');
      this.tryEnableExtension('WEBGL_depth_texture');
      this.tryEnableExtension('ANGLE_instanced_arrays');
      this.tryEnableExtension('EXT_blend_minmax');
    }
    
    // WebGL2特定扩展
    if (this.isWebGL2) {
      this.tryEnableExtension('EXT_color_buffer_float');
    }
  }

  /**
   * 尝试启用WebGL扩展
   * @param name 扩展名称
   * @returns 是否启用成功
   */
  private tryEnableExtension(name: string): boolean {
    const ext = this.gl.getExtension(name);
    if (ext) {
      this.extensions.set(name, ext);
      return true;
    }
    return false;
  }

  /**
   * 设置初始GL状态
   */
  private setupInitialGLState(): void {
    const gl = this.gl;
    
    // 启用深度测试
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    
    // 启用背面剔除
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    
    // 启用混合
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // 设置默认清除颜色
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1.0);
  }

  /**
   * WebGL上下文丢失处理函数
   * @param event 上下文丢失事件
   */
  private onContextLost(event: Event): void {
    event.preventDefault();
    this.isDeviceLost = true;
    
    if (this.deviceLostHandler) {
      this.deviceLostHandler();
    }
  }

  /**
   * WebGL上下文恢复处理函数
   */
  private onContextRestored(): void {
    this.isDeviceLost = false;
    
    // 重新初始化渲染器
    this.setupInitialGLState();
    
    if (this.deviceRestoredHandler) {
      this.deviceRestoredHandler();
    }
  }

  /**
   * 检查渲染器是否初始化
   */
  get isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 检查是否为WebGL2
   */
  get isWebGL2Context(): boolean {
    return this.isWebGL2;
  }

  /**
   * 获取WebGL上下文
   */
  getContext(): WebGLRenderingContext | WebGL2RenderingContext {
    return this.gl;
  }

  /**
   * 创建顶点缓冲区
   * @param type 缓冲区类型
   * @param usage 缓冲区用途
   * @param size 缓冲区大小
   * @returns 缓冲区对象
   */
  createVertexBuffer(type: RenderBufferType, usage: RenderBufferUsage, size: number): GLBuffer {
    return new GLBuffer(this.gl, type, usage, size);
  }

  /**
   * 创建索引缓冲区
   * @param usage 缓冲区用途
   * @param size 缓冲区大小
   * @returns 缓冲区对象
   */
  createIndexBuffer(usage: RenderBufferUsage, size: number): GLBuffer {
    return new GLBuffer(this.gl, RenderBufferType.IndexBuffer, usage, size);
  }

  /**
   * 创建着色器程序
   * @param vertexSource 顶点着色器源码
   * @param fragmentSource 片段着色器源码
   * @returns 着色器程序对象
   */
  createShader(vertexSource: string, fragmentSource: string): GLShader {
    const shader = new GLShader(this.gl);
    shader.compile(vertexSource, fragmentSource);
    return shader;
  }

  /**
   * 创建纹理
   * @param width 纹理宽度
   * @param height 纹理高度
   * @returns 纹理对象
   */
  createTexture(width: number, height: number): GLTexture {
    return new GLTexture(this.gl, width, height);
  }

  /**
   * 创建渲染目标
   * @param width 渲染目标宽度
   * @param height 渲染目标高度
   * @param hasDepthTexture 是否包含深度纹理
   * @returns 渲染目标对象
   */
  createRenderTarget(width: number, height: number, hasDepthTexture: boolean = true): GLRenderTarget {
    return new GLRenderTarget(this.gl, width, height, hasDepthTexture);
  }

  /**
   * 绑定着色器程序
   * @param shader 着色器程序
   */
  bindShader(shader: GLShader): void {
    if (this.currentShader !== shader) {
      shader.bind();
      this.currentShader = shader;
    }
  }

  /**
   * 绑定顶点缓冲区
   * @param buffer 顶点缓冲区
   */
  bindVertexBuffer(buffer: GLBuffer): void {
    if (this.currentVertexBuffer !== buffer) {
      buffer.bind();
      this.currentVertexBuffer = buffer;
    }
  }

  /**
   * 绑定索引缓冲区
   * @param buffer 索引缓冲区
   */
  bindIndexBuffer(buffer: GLBuffer): void {
    if (this.currentIndexBuffer !== buffer) {
      buffer.bind();
      this.currentIndexBuffer = buffer;
    }
  }

  /**
   * 绑定渲染目标
   * @param renderTarget 渲染目标
   */
  bindRenderTarget(renderTarget: GLRenderTarget | null): void {
    if (this.currentRenderTarget !== renderTarget) {
      if (renderTarget) {
        renderTarget.bind();
      } else {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      }
      this.currentRenderTarget = renderTarget;
    }
  }

  /**
   * 设置视口
   * @param x X坐标
   * @param y Y坐标
   * @param width 宽度
   * @param height 高度
   */
  setViewport(x: number, y: number, width: number, height: number): void {
    this.gl.viewport(x, y, width, height);
  }

  /**
   * 设置剪裁矩形
   * @param x X坐标
   * @param y Y坐标
   * @param width 宽度
   * @param height 高度
   */
  setScissor(x: number, y: number, width: number, height: number): void {
    this.gl.scissor(x, y, width, height);
    this.gl.enable(this.gl.SCISSOR_TEST);
  }

  /**
   * 禁用剪裁测试
   */
  disableScissor(): void {
    this.gl.disable(this.gl.SCISSOR_TEST);
  }

  /**
   * 设置清除颜色
   * @param r 红色分量
   * @param g 绿色分量
   * @param b 蓝色分量
   * @param a 透明度分量
   */
  setClearColor(r: number, g: number, b: number, a: number): void {
    this.clearColor.set(r, g, b, a);
    this.gl.clearColor(r, g, b, a);
  }

  /**
   * 清除缓冲区
   * @param flags 清除标志
   */
  clear(flags: ClearFlag): void {
    let glFlags = 0;
    
    if (flags & ClearFlag.Color) {
      glFlags |= this.gl.COLOR_BUFFER_BIT;
    }
    
    if (flags & ClearFlag.Depth) {
      glFlags |= this.gl.DEPTH_BUFFER_BIT;
    }
    
    if (flags & ClearFlag.Stencil) {
      glFlags |= this.gl.STENCIL_BUFFER_BIT;
    }
    
    this.gl.clear(glFlags);
  }

  /**
   * 绘制三角形
   * @param startVertex 起始顶点索引
   * @param vertexCount 顶点数量
   */
  drawTriangles(startVertex: number, vertexCount: number): void {
    this.gl.drawArrays(this.gl.TRIANGLES, startVertex, vertexCount);
  }

  /**
   * 使用索引绘制三角形
   * @param indexCount 索引数量
   * @param indexType 索引类型
   * @param indexOffset 索引偏移
   */
  drawIndexedTriangles(indexCount: number, indexType: number = 0, indexOffset: number = 0): void {
    // 转换索引类型
    let glIndexType: number;
    if (indexType === 0) {
      glIndexType = this.gl.UNSIGNED_SHORT; // 16位索引
    } else {
      glIndexType = this.gl.UNSIGNED_INT; // 32位索引
    }
    
    this.gl.drawElements(this.gl.TRIANGLES, indexCount, glIndexType, indexOffset);
  }

  /**
   * 绘制实例化三角形
   * @param vertexCount 顶点数量
   * @param instanceCount 实例数量
   */
  drawInstancedTriangles(vertexCount: number, instanceCount: number): void {
    if (this.isWebGL2) {
      (this.gl as WebGL2RenderingContext).drawArraysInstanced(this.gl.TRIANGLES, 0, vertexCount, instanceCount);
    } else {
      const ext = this.extensions.get('ANGLE_instanced_arrays');
      if (ext) {
        ext.drawArraysInstancedANGLE(this.gl.TRIANGLES, 0, vertexCount, instanceCount);
      } else {
        console.error('Instanced rendering not supported');
      }
    }
  }

  /**
   * 绘制索引化实例化三角形
   * @param indexCount 索引数量
   * @param instanceCount 实例数量
   * @param indexType 索引类型
   */
  drawIndexedInstancedTriangles(indexCount: number, instanceCount: number, indexType: number = 0): void {
    // 转换索引类型
    let glIndexType: number;
    if (indexType === 0) {
      glIndexType = this.gl.UNSIGNED_SHORT; // 16位索引
    } else {
      glIndexType = this.gl.UNSIGNED_INT; // 32位索引
    }
    
    if (this.isWebGL2) {
      (this.gl as WebGL2RenderingContext).drawElementsInstanced(this.gl.TRIANGLES, indexCount, glIndexType, 0, instanceCount);
    } else {
      const ext = this.extensions.get('ANGLE_instanced_arrays');
      if (ext) {
        ext.drawElementsInstancedANGLE(this.gl.TRIANGLES, indexCount, glIndexType, 0, instanceCount);
      } else {
        console.error('Instanced rendering not supported');
      }
    }
  }

  /**
   * 启用深度测试
   * @param enable 是否启用
   */
  enableDepthTest(enable: boolean): void {
    if (enable) {
      this.gl.enable(this.gl.DEPTH_TEST);
    } else {
      this.gl.disable(this.gl.DEPTH_TEST);
    }
  }

  /**
   * 启用深度写入
   * @param enable 是否启用
   */
  enableDepthWrite(enable: boolean): void {
    this.gl.depthMask(enable);
  }

  /**
   * 启用背面剔除
   * @param enable 是否启用
   */
  enableCullFace(enable: boolean): void {
    if (enable) {
      this.gl.enable(this.gl.CULL_FACE);
    } else {
      this.gl.disable(this.gl.CULL_FACE);
    }
  }

  /**
   * 设置剔除面
   * @param front 是否剔除正面
   */
  setCullFace(front: boolean): void {
    this.gl.cullFace(front ? this.gl.FRONT : this.gl.BACK);
  }

  /**
   * 启用混合
   * @param enable 是否启用
   */
  enableBlend(enable: boolean): void {
    if (enable) {
      this.gl.enable(this.gl.BLEND);
    } else {
      this.gl.disable(this.gl.BLEND);
    }
  }

  /**
   * 设置混合函数
   * @param sourceFactor 源因子
   * @param destFactor 目标因子
   */
  setBlendFunc(sourceFactor: number, destFactor: number): void {
    this.gl.blendFunc(sourceFactor, destFactor);
  }

  /**
   * 设置混合方程
   * @param mode 混合模式
   */
  setBlendEquation(mode: number): void {
    this.gl.blendEquation(mode);
  }

  /**
   * 启用模板测试
   * @param enable 是否启用
   */
  enableStencilTest(enable: boolean): void {
    if (enable) {
      this.gl.enable(this.gl.STENCIL_TEST);
    } else {
      this.gl.disable(this.gl.STENCIL_TEST);
    }
  }

  /**
   * 设置线宽
   * @param width 线宽
   */
  setLineWidth(width: number): void {
    this.gl.lineWidth(width);
  }

  /**
   * 读取像素
   * @param x X坐标
   * @param y Y坐标
   * @param width 宽度
   * @param height 高度
   * @param format 像素格式
   * @param type 像素类型
   * @param pixels 像素数据
   */
  readPixels(x: number, y: number, width: number, height: number, format: number, type: number, pixels: ArrayBufferView): void {
    this.gl.readPixels(x, y, width, height, format, type, pixels);
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    // 移除监听器
    if (this.canvas) {
      this.canvas.removeEventListener('webglcontextlost', this.onContextLost.bind(this));
      this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored.bind(this));
    }
    
    // 重置状态
    this.currentShader = null;
    this.currentVertexBuffer = null;
    this.currentIndexBuffer = null;
    this.currentRenderTarget = null;
    this.initialized = false;
    this.extensions.clear();
  }
} 