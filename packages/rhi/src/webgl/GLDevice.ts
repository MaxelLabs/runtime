import type {
  IRHIDevice,
  IRHIDeviceInfo,
  IRHICommandEncoder,
  IRHICommandBuffer,
  IRHIBuffer,
  IRHITexture,
  IRHISampler,
  IRHIShaderModule,
  IRHIBindGroupLayout,
  IRHIPipelineLayout,
  IRHIBindGroup,
  IRHIRenderPipeline,
  IRHIComputePipeline,
  RHIBufferDescriptor,
  RHITextureDescriptor,
  RHISamplerDescriptor,
  RHIShaderModuleDescriptor,
  RHIRenderPipelineDescriptor,
  RHIComputePipelineDescriptor } from '@maxellabs/core';
import {
  RHIBackend,
  RHIFeatureFlags,
} from '@maxellabs/core';
import { GLBuffer } from './resources/GLBuffer';
import { GLTexture } from './resources/GLTexture';
import { WebGLSampler } from './resources/GLSampler';
import { GLShader } from './resources/GLShader';
import { WebGLBindGroupLayout } from './bindings/GLBindGroupLayout';
import { WebGLBindGroup } from './bindings/GLBindGroup';
import { WebGLPipelineLayout } from './pipeline/GLPipelineLayout';
import { WebGLRenderPipeline } from './pipeline/GLRenderPipeline';
import { WebGLComputePipeline } from './pipeline/GLComputePipeline';
import { WebGLCommandEncoder } from './commands/GLCommandEncoder';
import type { WebGLCommandBuffer } from './commands/GLCommandBuffer';
import { WebGLUtils } from './utils/GLUtils';

/**
 * WebGL设备实现
 */
export class WebGLDevice implements IRHIDevice {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private info: IRHIDeviceInfo;
  private extensions: Record<string, any> = {};
  private isWebGL2: boolean;
  private utils: WebGLUtils;
  private isDestroyed = false;
  private lostContextExtension: any = null;
  private contextLostListener: (event: Event) => void;
  private contextRestoredListener: (event: Event) => void;

  /**
   * 构造函数
   * @param canvas 渲染目标画布
   * @param options 初始化选项
   */
  constructor (canvas: HTMLCanvasElement, options: {
    antialias?: boolean,
    alpha?: boolean,
    depth?: boolean,
    stencil?: boolean,
    premultipliedAlpha?: boolean,
    preserveDrawingBuffer?: boolean,
    powerPreference?: 'default' | 'high-performance' | 'low-power',
    failIfMajorPerformanceCaveat?: boolean,
    desynchronized?: boolean,
  } = {}) {
    this.canvas = canvas;
    this.gl = this.initWebGL(canvas, options);
    this.isWebGL2 = this.gl instanceof WebGL2RenderingContext;
    this.utils = new WebGLUtils(this.gl);
    this.info = this.initDeviceInfo();
    this.initExtensions();
  }

  /**
   * 初始化WebGL上下文
   */
  private initWebGL (canvas: HTMLCanvasElement, options: any): WebGLRenderingContext | WebGL2RenderingContext {
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
      gl = canvas.getContext('webgl', contextOptions) || canvas.getContext('experimental-webgl', contextOptions);
    }

    if (!gl) {
      throw new Error('WebGL不可用，请检查浏览器支持');
    }

    return gl;
  }

  /**
   * 初始化设备信息
   */
  private initDeviceInfo (): IRHIDeviceInfo {
    const gl = this.gl;
    const isWebGL2 = this.isWebGL2;
    const vendor = gl.getParameter(gl.VENDOR);
    const renderer = gl.getParameter(gl.RENDERER);
    const version = gl.getParameter(gl.VERSION);
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

    // 计算功能标志
    let features = RHIFeatureFlags.DEPTH_TEXTURE | RHIFeatureFlags.VERTEX_ARRAY_OBJECT;

    if (isWebGL2) {
      features |= RHIFeatureFlags.FLOAT_TEXTURE |
                 RHIFeatureFlags.HALF_FLOAT_TEXTURE |
                 RHIFeatureFlags.MULTIPLE_RENDER_TARGETS |
                 RHIFeatureFlags.INSTANCED_DRAWING;
    }

    // 检查扩展并更新功能
    if (gl.getExtension('EXT_texture_filter_anisotropic')) {
      features |= RHIFeatureFlags.ANISOTROPIC_FILTERING;
    }

    if (gl.getExtension('OES_texture_float')) {
      features |= RHIFeatureFlags.FLOAT_TEXTURE;
    }

    if (gl.getExtension('OES_texture_half_float')) {
      features |= RHIFeatureFlags.HALF_FLOAT_TEXTURE;
    }

    if (gl.getExtension('WEBGL_compressed_texture_s3tc')) {
      features |= RHIFeatureFlags.BC_TEXTURE_COMPRESSION;
    }

    if (gl.getExtension('WEBGL_compressed_texture_etc')) {
      features |= RHIFeatureFlags.ETC2_TEXTURE_COMPRESSION;
    }

    if (gl.getExtension('WEBGL_compressed_texture_astc')) {
      features |= RHIFeatureFlags.ASTC_TEXTURE_COMPRESSION;
    }

    return {
      deviceName: renderer,
      vendorName: vendor,
      backend: isWebGL2 ? RHIBackend.WebGL2 : RHIBackend.WebGL,
      features,
      maxTextureSize,
      supportsAnisotropy: !!(features & RHIFeatureFlags.ANISOTROPIC_FILTERING),
      supportsMSAA: isWebGL2,
      maxSampleCount: isWebGL2 ? 4 : 0,
      maxBindings: maxTextureUnits,
      shaderLanguageVersion: isWebGL2 ? 'GLSL ES 3.00' : 'GLSL ES 1.00',
    };
  }

  /**
   * 初始化WebGL扩展
   */
  private initExtensions (): void {
    // 基本WebGL1扩展
    const requiredExtensions = [
      'OES_vertex_array_object',
      'OES_texture_float',
      'OES_texture_half_float',
      'WEBGL_depth_texture',
      'OES_element_index_uint',
      'EXT_texture_filter_anisotropic',
      'EXT_blend_minmax',
    ];

    // WebGL1特有扩展
    if (!this.isWebGL2) {
      requiredExtensions.push(
        'OES_standard_derivatives',
        'EXT_shader_texture_lod',
        'EXT_frag_depth',
      );
    }

    // 压缩纹理扩展
    const compressionExtensions = [
      'WEBGL_compressed_texture_s3tc',
      'WEBGL_compressed_texture_etc',
      'WEBGL_compressed_texture_astc',
    ];

    // 加载所有扩展
    [...requiredExtensions, ...compressionExtensions].forEach(extName => {
      try {
        const ext = this.gl.getExtension(extName);

        if (ext) {
          this.extensions[extName] = ext;
        }
      } catch (e) {
        console.warn(`扩展${extName}不可用或加载失败`);
      }
    });
  }

  /**
   * 获取原始WebGL上下文
   */
  getGL (): WebGLRenderingContext | WebGL2RenderingContext {
    return this.gl;
  }

  /**
   * 获取设备信息
   */
  getInfo (): IRHIDeviceInfo {
    return this.info;
  }

  /**
   * 创建缓冲区
   */
  createBuffer (descriptor: RHIBufferDescriptor): IRHIBuffer {
    return new GLBuffer(this.gl, descriptor);
  }

  /**
   * 创建纹理
   */
  createTexture (descriptor: RHITextureDescriptor): IRHITexture {
    return new GLTexture(this.gl, descriptor);
  }

  /**
   * 创建采样器
   */
  createSampler (descriptor?: RHISamplerDescriptor): IRHISampler {
    return new WebGLSampler(this.gl, descriptor);
  }

  /**
   * 创建着色器模块
   */
  createShaderModule (descriptor: RHIShaderModuleDescriptor): IRHIShaderModule {
    return new GLShader(this.gl, descriptor);
  }

  /**
   * 创建绑定组布局
   */
  createBindGroupLayout (entries: any[], label?: string): IRHIBindGroupLayout {
    return new WebGLBindGroupLayout(this.gl, entries, label);
  }

  /**
   * 创建管线布局
   */
  createPipelineLayout (bindGroupLayouts: IRHIBindGroupLayout[], label?: string): IRHIPipelineLayout {
    return new WebGLPipelineLayout(this.gl, bindGroupLayouts, label);
  }

  /**
   * 创建绑定组
   */
  createBindGroup (layout: IRHIBindGroupLayout, entries: any[], label?: string): IRHIBindGroup {
    return new WebGLBindGroup(this.gl, layout, entries, label);
  }

  /**
   * 创建渲染管线
   */
  createRenderPipeline (descriptor: RHIRenderPipelineDescriptor): IRHIRenderPipeline {
    return new WebGLRenderPipeline(this.gl, descriptor);
  }

  /**
   * 创建计算管线
   * 注意：WebGL1/2不支持计算着色器，这里仅为接口兼容性
   */
  createComputePipeline (descriptor: RHIComputePipelineDescriptor): IRHIComputePipeline {
    console.warn('WebGL不支持计算着色器，创建的计算管线将不起作用');

    return new WebGLComputePipeline(this.gl, descriptor);
  }

  /**
   * 创建命令编码器
   */
  createCommandEncoder (label?: string): IRHICommandEncoder {
    return new WebGLCommandEncoder(this.gl, label);
  }

  /**
   * 提交命令
   */
  submit (commands: IRHICommandBuffer[]): void {
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
  private getGLErrorString (error: number): string {
    const gl = this.gl;

    switch (error) {
      case gl.INVALID_ENUM: return 'INVALID_ENUM';
      case gl.INVALID_VALUE: return 'INVALID_VALUE';
      case gl.INVALID_OPERATION: return 'INVALID_OPERATION';
      case gl.OUT_OF_MEMORY: return 'OUT_OF_MEMORY';
      case gl.CONTEXT_LOST_WEBGL: return 'CONTEXT_LOST_WEBGL';
      case gl.INVALID_FRAMEBUFFER_OPERATION: return 'INVALID_FRAMEBUFFER_OPERATION';
      default: return `未知错误(${error})`;
    }
  }

  /**
   * 检查设备丢失
   */
  async checkDeviceLost (): Promise<void> {
    const isLost = this.gl.isContextLost();

    if (isLost) {
      throw new Error('WebGL上下文已丢失');
    }
  }

  /**
   * 销毁设备
   */
  destroy (): void {
    // 在WebGL中，我们只能通过失去上下文来释放资源
    const loseContext = this.gl.getExtension('WEBGL_lose_context');

    if (loseContext) {
      loseContext.loseContext();
    }
  }
}