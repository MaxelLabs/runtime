import { MSpec } from '@maxellabs/core';
import { GLBuffer } from './resources/GLBuffer';
import { GLTexture } from './resources/GLTexture';
import { GLSampler } from './resources/GLSampler';
import { GLShader } from './resources/GLShader';
import { GLQuerySet } from './resources/GLQuerySet';
import { WebGLBindGroupLayout } from './bindings/GLBindGroupLayout';
import { WebGLBindGroup } from './bindings/GLBindGroup';
import { WebGLPipelineLayout } from './pipeline/GLPipelineLayout';
import { WebGLRenderPipeline } from './pipeline/GLRenderPipeline';
import { WebGLComputePipeline } from './pipeline/GLComputePipeline';
import { WebGLCommandEncoder } from './commands/GLCommandEncoder';
import type { WebGLCommandBuffer } from './commands/GLCommandBuffer';
import { WebGLUtils } from './utils/GLUtils';
import { ResourceTracker, ResourceType } from './utils/ResourceTracker';

/**
 * 设备状态枚举
 */
export enum DeviceState {
  /** 设备正常运行 */
  ACTIVE = 'active',
  /** 上下文已丢失，等待恢复 */
  LOST = 'lost',
  /** 设备已销毁 */
  DESTROYED = 'destroyed',
}

/**
 * 上下文事件回调
 */
export interface DeviceEventCallbacks {
  /** 上下文丢失时的回调 */
  onContextLost?: () => void;
  /** 上下文恢复时的回调 */
  onContextRestored?: () => void;
  /** 设备销毁时的回调 */
  onDestroyed?: () => void;
}

/**
 * WebGL设备实现
 */
export class WebGLDevice implements MSpec.IRHIDevice {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  info: MSpec.IRHIDeviceInfo;
  private extensions: Record<string, any> = {};
  private isWebGL2: boolean;
  private utils: WebGLUtils;
  private isDestroyed = false;
  private lostContextExtension: any = null;

  // 上下文丢失/恢复处理
  private contextLostListener: ((event: Event) => void) | null = null;
  private contextRestoredListener: ((event: Event) => void) | null = null;
  private deviceState: DeviceState = DeviceState.ACTIVE;
  private eventCallbacks: DeviceEventCallbacks = {};

  // 资源追踪
  private resourceTracker: ResourceTracker;

  // 保存初始化选项，用于上下文恢复
  private initOptions: {
    antialias?: boolean;
    alpha?: boolean;
    depth?: boolean;
    stencil?: boolean;
    premultipliedAlpha?: boolean;
    preserveDrawingBuffer?: boolean;
    powerPreference?: 'default' | 'high-performance' | 'low-power';
    failIfMajorPerformanceCaveat?: boolean;
    desynchronized?: boolean;
  };

  /**
   * 构造函数
   * @param canvas 渲染目标画布
   * @param options 初始化选项
   */
  constructor(
    canvas: HTMLCanvasElement,
    options: {
      antialias?: boolean;
      alpha?: boolean;
      depth?: boolean;
      stencil?: boolean;
      premultipliedAlpha?: boolean;
      preserveDrawingBuffer?: boolean;
      powerPreference?: 'default' | 'high-performance' | 'low-power';
      failIfMajorPerformanceCaveat?: boolean;
      desynchronized?: boolean;
    } = {}
  ) {
    this.canvas = canvas;
    this.initOptions = options;
    this.gl = this.initWebGL(canvas, options);
    this.isWebGL2 = this.gl instanceof WebGL2RenderingContext;
    this.utils = new WebGLUtils(this.gl);
    this.info = this.initDeviceInfo();
    this.initExtensions();

    // 初始化资源追踪器
    this.resourceTracker = new ResourceTracker('WebGLDevice');

    // 设置上下文丢失/恢复监听器
    this.setupContextListeners();
  }

  /**
   * 设置上下文丢失/恢复事件监听器
   */
  private setupContextListeners(): void {
    // 上下文丢失处理
    this.contextLostListener = (event: Event) => {
      event.preventDefault(); // 阻止默认行为，允许恢复
      this.handleContextLost();
    };

    // 上下文恢复处理
    this.contextRestoredListener = () => {
      this.handleContextRestored();
    };

    this.canvas.addEventListener('webglcontextlost', this.contextLostListener, false);
    this.canvas.addEventListener('webglcontextrestored', this.contextRestoredListener, false);
  }

  /**
   * 处理上下文丢失
   */
  private handleContextLost(): void {
    console.warn('[WebGLDevice] WebGL 上下文已丢失');
    this.deviceState = DeviceState.LOST;

    // 通知应用层
    this.eventCallbacks.onContextLost?.();
  }

  /**
   * 处理上下文恢复
   */
  private handleContextRestored(): void {
    console.info('[WebGLDevice] WebGL 上下文正在恢复...');

    try {
      // 重新获取 WebGL 上下文
      this.gl = this.initWebGL(this.canvas, this.initOptions);
      this.isWebGL2 = this.gl instanceof WebGL2RenderingContext;
      this.utils = new WebGLUtils(this.gl);

      // 重新初始化设备信息和扩展
      this.extensions = {};
      this.info = this.initDeviceInfo();
      this.initExtensions();

      // 更新状态
      this.deviceState = DeviceState.ACTIVE;

      console.info('[WebGLDevice] WebGL 上下文恢复成功');
      console.warn(
        '[WebGLDevice] 注意：所有 GPU 资源（缓冲区、纹理、着色器等）需要重新创建。' +
          '请在 onContextRestored 回调中重建应用资源。'
      );

      // 清空资源追踪器（旧资源已无效）
      this.resourceTracker.clear();

      // 通知应用层
      this.eventCallbacks.onContextRestored?.();
    } catch (e) {
      console.error('[WebGLDevice] 上下文恢复失败:', e);
      this.deviceState = DeviceState.DESTROYED;
    }
  }

  /**
   * 设置设备事件回调
   * @param callbacks 事件回调函数
   */
  setEventCallbacks(callbacks: DeviceEventCallbacks): void {
    this.eventCallbacks = { ...this.eventCallbacks, ...callbacks };
  }

  /**
   * 获取当前设备状态
   */
  getDeviceState(): DeviceState {
    return this.deviceState;
  }

  /**
   * 检查设备是否处于活动状态
   */
  isActive(): boolean {
    return this.deviceState === DeviceState.ACTIVE && !this.isDestroyed;
  }

  /**
   * 获取资源追踪器
   */
  getResourceTracker(): ResourceTracker {
    return this.resourceTracker;
  }

  /**
   * 初始化WebGL上下文
   */
  private initWebGL(canvas: HTMLCanvasElement, options: any): WebGLRenderingContext | WebGL2RenderingContext {
    const contextOptions: WebGLContextAttributes = {
      alpha: options.alpha !== undefined ? options.alpha : true,
      antialias: options.antialias !== undefined ? options.antialias : true,
      depth: options.depth !== undefined ? options.depth : true,
      stencil: options.stencil !== undefined ? options.stencil : true,
      premultipliedAlpha: options.premultipliedAlpha !== undefined ? options.premultipliedAlpha : true,
      preserveDrawingBuffer: options.preserveDrawingBuffer !== undefined ? options.preserveDrawingBuffer : false,
      powerPreference: options.powerPreference || 'default',
      failIfMajorPerformanceCaveat: options.failIfMajorPerformanceCaveat || false,
      desynchronized: options.desynchronized || false,
    };

    // 首先尝试WebGL2
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = canvas.getContext('webgl2', contextOptions);

    if (!gl) {
      // 回退到WebGL1
      gl =
        canvas.getContext('webgl', contextOptions) ||
        (canvas.getContext('experimental-webgl', contextOptions) as WebGLRenderingContext);
    }

    if (!gl) {
      throw new Error('WebGL不可用，请检查浏览器支持');
    }

    return gl;
  }

  /**
   * 初始化设备信息
   */
  private initDeviceInfo(): MSpec.IRHIDeviceInfo {
    const gl = this.gl;
    const isWebGL2 = this.isWebGL2;
    const vendor = gl.getParameter(gl.VENDOR);
    const renderer = gl.getParameter(gl.RENDERER);
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

    // 计算功能标志
    let features = 0;

    if (isWebGL2) {
      // WebGL2 核心特性
      features |= MSpec.RHIFeatureFlags.DEPTH_TEXTURE;
      features |= MSpec.RHIFeatureFlags.VERTEX_ARRAY_OBJECT;
      features |= MSpec.RHIFeatureFlags.INSTANCED_DRAWING;
      features |= MSpec.RHIFeatureFlags.MULTIPLE_RENDER_TARGETS;
      features |= MSpec.RHIFeatureFlags.FLOAT_TEXTURE;
      features |= MSpec.RHIFeatureFlags.HALF_FLOAT_TEXTURE;
      features |= MSpec.RHIFeatureFlags.UNIFORM_BUFFER; // WebGL2 原生支持 UBO
      features |= MSpec.RHIFeatureFlags.OCCLUSION_QUERY; // WebGL2 原生支持遮挡查询
      features |= MSpec.RHIFeatureFlags.BLEND_OPERATION; // WebGL2 原生支持高级混合操作
    } else {
      // WebGL1 扩展特性检测
      if (gl.getExtension('WEBGL_depth_texture')) {
        features |= MSpec.RHIFeatureFlags.DEPTH_TEXTURE;
      }
      if (gl.getExtension('OES_vertex_array_object')) {
        features |= MSpec.RHIFeatureFlags.VERTEX_ARRAY_OBJECT;
      }
      if (gl.getExtension('ANGLE_instanced_arrays')) {
        features |= MSpec.RHIFeatureFlags.INSTANCED_DRAWING;
      }
      if (gl.getExtension('WEBGL_draw_buffers')) {
        features |= MSpec.RHIFeatureFlags.MULTIPLE_RENDER_TARGETS;
      }
      if (gl.getExtension('OES_texture_float')) {
        features |= MSpec.RHIFeatureFlags.FLOAT_TEXTURE;
      }
      if (gl.getExtension('OES_texture_half_float')) {
        features |= MSpec.RHIFeatureFlags.HALF_FLOAT_TEXTURE;
      }
      if (gl.getExtension('EXT_blend_minmax')) {
        features |= MSpec.RHIFeatureFlags.BLEND_OPERATION;
      }
    }

    // 通用扩展检测
    const extAnisotropic =
      gl.getExtension('EXT_texture_filter_anisotropic') ||
      gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
      gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');

    if (extAnisotropic) {
      features |= MSpec.RHIFeatureFlags.ANISOTROPIC_FILTERING;
    }

    // 浮点纹理线性过滤
    if (gl.getExtension('OES_texture_float_linear')) {
      features |= MSpec.RHIFeatureFlags.FLOAT_TEXTURE_LINEAR;
    }

    // 纹理压缩格式
    if (gl.getExtension('WEBGL_compressed_texture_s3tc')) {
      features |= MSpec.RHIFeatureFlags.BC_TEXTURE_COMPRESSION;
    }

    if (gl.getExtension('WEBGL_compressed_texture_etc')) {
      features |= MSpec.RHIFeatureFlags.ETC2_TEXTURE_COMPRESSION;
    }

    if (gl.getExtension('WEBGL_compressed_texture_astc')) {
      features |= MSpec.RHIFeatureFlags.ASTC_TEXTURE_COMPRESSION;
    }

    // 多重间接绘制扩展检测
    if (gl.getExtension('WEBGL_multi_draw')) {
      features |= MSpec.RHIFeatureFlags.MULTI_DRAW_INDIRECT;
      features |= MSpec.RHIFeatureFlags.INDIRECT_DRAWING;
    }

    // 输出调试信息
    console.info(`[WebGLDevice] Initialized device: ${renderer}`);
    console.info(`[WebGLDevice] Backend: ${isWebGL2 ? 'WebGL2' : 'WebGL1'}`);
    console.info(`[WebGLDevice] Features: 0x${features.toString(16)}`);

    return {
      deviceName: renderer,
      vendorName: vendor,
      backend: isWebGL2 ? MSpec.RHIBackend.WebGL2 : MSpec.RHIBackend.WebGL,
      features,
      maxTextureSize,
      supportsAnisotropy: !!(features & MSpec.RHIFeatureFlags.ANISOTROPIC_FILTERING),
      supportsMSAA: isWebGL2,
      maxSampleCount: isWebGL2 ? 4 : 0,
      maxBindings: maxTextureUnits,
      shaderLanguageVersion: isWebGL2 ? 'GLSL ES 3.00' : 'GLSL ES 1.00',
    };
  }

  /**
   * 初始化WebGL扩展
   */
  private initExtensions(): void {
    const requiredExtensions: string[] = [];

    // WebGL1特有扩展
    if (!this.isWebGL2) {
      requiredExtensions.push(
        'OES_vertex_array_object',
        'OES_texture_float',
        'OES_texture_half_float',
        'WEBGL_depth_texture',
        'OES_element_index_uint',
        'EXT_blend_minmax',
        'OES_standard_derivatives',
        'EXT_shader_texture_lod',
        'EXT_frag_depth'
      );
    } else {
      // WebGL2特有扩展 (如果需要)
      requiredExtensions.push(
        'EXT_color_buffer_float',
        'OES_texture_float_linear' // 浮点纹理线性过滤通常需要显式启用
      );
    }

    // 通用扩展
    const commonExtensions = [
      'EXT_texture_filter_anisotropic',
      'WEBGL_compressed_texture_s3tc',
      'WEBGL_compressed_texture_etc',
      'WEBGL_compressed_texture_astc',
    ];

    // 加载所有扩展
    [...requiredExtensions, ...commonExtensions].forEach((extName) => {
      const ext = this.gl.getExtension(extName);

      if (ext) {
        this.extensions[extName] = ext;
      } else {
        // 对于必需扩展失败的情况，记录警告
        if (requiredExtensions.includes(extName)) {
          console.warn(`[WebGLDevice] Optional extension not found: ${extName}`);
        }
      }
    });
  }

  /**
   * 获取原始WebGL上下文
   */
  getGL(): WebGLRenderingContext | WebGL2RenderingContext {
    return this.gl;
  }

  /**
   * 获取设备信息
   */
  getInfo(): MSpec.IRHIDeviceInfo {
    return this.info;
  }

  // ==================== 能力查询方法 ====================

  /**
   * 检查设备是否支持指定特性
   *
   * @param feature 特性标志（可以是单个或多个特性的组合）
   * @returns 如果支持所有指定特性则返回 true
   *
   * @example
   * ```typescript
   * // 检查单个特性
   * if (device.hasFeature(RHIFeatureFlags.COMPUTE_SHADER)) { ... }
   *
   * // 检查多个特性（必须全部支持）
   * const features = RHIFeatureFlags.UNIFORM_BUFFER | RHIFeatureFlags.INSTANCED_DRAWING;
   * if (device.hasFeature(features)) { ... }
   * ```
   */
  hasFeature(feature: MSpec.RHIFeatureFlags): boolean {
    return (this.info.features & feature) === feature;
  }

  /**
   * 检查是否支持指定的 WebGL 扩展
   *
   * @param extensionName 扩展名称（如 'WEBGL_multi_draw', 'OES_texture_float'）
   * @returns 是否支持该扩展
   */
  hasExtension(extensionName: string): boolean {
    // 首先检查缓存
    if (extensionName in this.extensions) {
      return this.extensions[extensionName] !== null;
    }

    // 尝试获取扩展并缓存结果
    const ext = this.gl.getExtension(extensionName);
    this.extensions[extensionName] = ext;

    return ext !== null;
  }

  /**
   * 获取已启用的 WebGL 扩展对象
   *
   * @param extensionName 扩展名称
   * @returns 扩展对象，如果不支持则返回 null
   */
  getExtension<T = unknown>(extensionName: string): T | null {
    // 首先检查缓存
    if (extensionName in this.extensions) {
      return this.extensions[extensionName] as T | null;
    }

    // 尝试获取扩展并缓存结果
    const ext = this.gl.getExtension(extensionName);
    this.extensions[extensionName] = ext;

    return ext as T | null;
  }

  /**
   * 创建缓冲区
   */
  createBuffer(descriptor: MSpec.RHIBufferDescriptor): MSpec.IRHIBuffer {
    const buffer = new GLBuffer(this.gl, descriptor);
    this.resourceTracker.register(buffer, ResourceType.BUFFER);
    return buffer;
  }

  /**
   * 创建纹理
   */
  createTexture(descriptor: MSpec.RHITextureDescriptor): MSpec.IRHITexture {
    const texture = new GLTexture(this.gl, descriptor);
    this.resourceTracker.register(texture, ResourceType.TEXTURE);
    return texture;
  }

  /**
   * 创建采样器
   */
  createSampler(
    descriptor?: MSpec.RHISamplerDescriptor & {
      borderColor?: [number, number, number, number];
      useMipmap?: boolean;
    }
  ): MSpec.IRHISampler {
    const sampler = new GLSampler(this.gl, descriptor);
    this.resourceTracker.register(sampler, ResourceType.SAMPLER);
    return sampler;
  }

  /**
   * 创建着色器模块
   */
  createShaderModule(descriptor: MSpec.RHIShaderModuleDescriptor): MSpec.IRHIShaderModule {
    const shader = new GLShader(this.gl, descriptor);
    this.resourceTracker.register(shader, ResourceType.SHADER);
    return shader;
  }

  /**
   * 创建绑定组布局
   */
  createBindGroupLayout(entries: any[], label?: string): MSpec.IRHIBindGroupLayout {
    const layout = new WebGLBindGroupLayout(this.gl, entries, label);
    this.resourceTracker.register(layout, ResourceType.BIND_GROUP_LAYOUT);
    return layout;
  }

  /**
   * 创建管线布局
   */
  createPipelineLayout(bindGroupLayouts: MSpec.IRHIBindGroupLayout[], label?: string): MSpec.IRHIPipelineLayout {
    const layout = new WebGLPipelineLayout(this.gl, bindGroupLayouts, label);
    this.resourceTracker.register(layout, ResourceType.PIPELINE_LAYOUT);
    return layout;
  }

  /**
   * 创建绑定组
   */
  createBindGroup(layout: MSpec.IRHIBindGroupLayout, entries: any[], label?: string): MSpec.IRHIBindGroup {
    const bindGroup = new WebGLBindGroup(this.gl, layout, entries, label);
    this.resourceTracker.register(bindGroup, ResourceType.BIND_GROUP);
    return bindGroup;
  }

  /**
   * 创建渲染管线
   */
  createRenderPipeline(descriptor: MSpec.RHIRenderPipelineDescriptor): MSpec.IRHIRenderPipeline {
    const pipeline = new WebGLRenderPipeline(this.gl, descriptor);
    this.resourceTracker.register(pipeline, ResourceType.PIPELINE);
    return pipeline;
  }

  /**
   * 创建计算管线
   * 注意：WebGL1/2不支持计算着色器，这里仅为接口兼容性
   */
  createComputePipeline(descriptor: MSpec.RHIComputePipelineDescriptor): MSpec.IRHIComputePipeline {
    console.warn('WebGL不支持计算着色器，创建的计算管线将不起作用');
    const pipeline = new WebGLComputePipeline(this.gl, descriptor);
    this.resourceTracker.register(pipeline, ResourceType.PIPELINE);
    return pipeline;
  }

  /**
   * 创建查询集
   * 用于遮挡查询、时间戳查询等
   * 注意：需要 WebGL 2.0 支持
   */
  createQuerySet(descriptor: MSpec.RHIQuerySetDescriptor): MSpec.IRHIQuerySet {
    if (!this.isWebGL2) {
      throw new Error('查询集需要 WebGL 2.0 支持');
    }
    const querySet = new GLQuerySet(this.gl, descriptor);
    this.resourceTracker.register(querySet, ResourceType.QUERY_SET);
    return querySet;
  }

  /**
   * 创建命令编码器
   */
  createCommandEncoder(label?: string): MSpec.IRHICommandEncoder {
    const encoder = new WebGLCommandEncoder(this.gl, label, this.utils);
    this.resourceTracker.register(encoder, ResourceType.COMMAND_ENCODER);
    return encoder;
  }

  /**
   * 提交命令
   */
  submit(commands: MSpec.IRHICommandBuffer[]): void {
    if (!commands || commands.length === 0) {
      return;
    }

    // 保存当前WebGL状态
    const previousFramebuffer = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING);

    try {
      // 执行每个命令缓冲区
      for (const buffer of commands) {
        try {
          // 使用dynamic cast转换为WebGLCommandBuffer
          const webglBuffer = buffer as WebGLCommandBuffer;

          if (webglBuffer && typeof webglBuffer.execute === 'function') {
            webglBuffer.execute();
          } else {
            console.error('提交的命令缓冲区不支持execute方法');
          }
        } catch (error) {
          console.error('执行命令缓冲区时出错:', error);
        }
      }

      // 检查帧缓冲区状态
      const currentFramebuffer = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING);

      if (currentFramebuffer) {
        const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);

        if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
          console.error('提交命令后帧缓冲区不完整:', this.getGLErrorString(status));
        }
      }

      // 确保命令完成
      this.gl.flush();

      // 检查WebGL错误
      const error = this.gl.getError();

      if (error !== this.gl.NO_ERROR) {
        console.error('WebGL错误:', this.getGLErrorString(error));
      }
    } finally {
      // 恢复之前的WebGL状态
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, previousFramebuffer);
    }
  }

  /**
   * 获取WebGL错误字符串
   */
  private getGLErrorString(error: number): string {
    const gl = this.gl;

    switch (error) {
      case gl.INVALID_ENUM:
        return 'INVALID_ENUM';
      case gl.INVALID_VALUE:
        return 'INVALID_VALUE';
      case gl.INVALID_OPERATION:
        return 'INVALID_OPERATION';
      case gl.OUT_OF_MEMORY:
        return 'OUT_OF_MEMORY';
      case gl.CONTEXT_LOST_WEBGL:
        return 'CONTEXT_LOST_WEBGL';
      case gl.INVALID_FRAMEBUFFER_OPERATION:
        return 'INVALID_FRAMEBUFFER_OPERATION';
      default:
        return `未知错误(${error})`;
    }
  }

  /**
   * 检查设备丢失
   */
  async checkDeviceLost(): Promise<void> {
    if (this.deviceState === DeviceState.DESTROYED) {
      throw new Error('WebGL 设备已销毁');
    }

    if (this.deviceState === DeviceState.LOST) {
      throw new Error('WebGL 上下文已丢失，等待恢复中');
    }

    const isLost = this.gl.isContextLost();
    if (isLost) {
      this.deviceState = DeviceState.LOST;
      throw new Error('WebGL 上下文已丢失');
    }
  }

  /**
   * 销毁设备
   *
   * 销毁设备会：
   * 1. 销毁所有已追踪的资源
   * 2. 移除上下文事件监听器
   * 3. 调用 WEBGL_lose_context 释放 GPU 资源
   * 4. 触发 onDestroyed 回调
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    console.info('[WebGLDevice] 正在销毁设备...');

    // 输出泄漏报告（如果有）
    const stats = this.resourceTracker.getStats();
    if (stats.total > 0) {
      console.warn(`[WebGLDevice] 销毁前检测到 ${stats.total} 个未释放资源，将自动销毁`);
      this.resourceTracker.reportLeaks();
    }

    // 销毁所有追踪的资源
    this.resourceTracker.destroyAll(true);

    // 移除上下文事件监听器
    if (this.contextLostListener) {
      this.canvas.removeEventListener('webglcontextlost', this.contextLostListener);
      this.contextLostListener = null;
    }
    if (this.contextRestoredListener) {
      this.canvas.removeEventListener('webglcontextrestored', this.contextRestoredListener);
      this.contextRestoredListener = null;
    }

    // 更新状态
    this.deviceState = DeviceState.DESTROYED;
    this.isDestroyed = true;

    // 通知应用层
    this.eventCallbacks.onDestroyed?.();

    // 释放 WebGL 上下文
    const loseContext = this.gl.getExtension('WEBGL_lose_context');
    if (loseContext) {
      loseContext.loseContext();
    }

    console.info('[WebGLDevice] 设备已销毁');
  }

  /**
   * 从资源追踪器中取消注册资源
   * 当资源被手动销毁时调用
   * @param resource 要取消注册的资源
   */
  unregisterResource(resource: { destroy(): void; label?: string }): void {
    this.resourceTracker.unregister(resource);
  }
}
