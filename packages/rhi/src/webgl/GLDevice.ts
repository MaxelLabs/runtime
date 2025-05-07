import type { IRHIDevice } from '@maxellabs/core';

/**
 * WebGL设备抽象类
 *
 * 封装WebGL渲染设备功能和能力检测，管理WebGL上下文、扩展和设备特性信息。
 * 提供统一的接口来访问WebGL1和WebGL2的功能，处理兼容性和扩展支持。
 *
 * @implements {IRHIDevice} 渲染硬件接口设备接口
 */
export class GLDevice implements IRHIDevice {
  /** WebGL渲染上下文 */
  private gl: WebGL2RenderingContext | WebGLRenderingContext;

  /** 已加载的WebGL扩展映射表 */
  private extensions: Map<string, any> = new Map();

  /** 设备能力参数 */
  private capabilities: {
    /** 最大纹理尺寸(像素) */
    maxTextureSize: number,

    /** 最大立方体贴图尺寸(像素) */
    maxCubeMapSize: number,

    /** 最大渲染纹理尺寸(像素) */
    maxRenderTextureSize: number,

    /** 最大顶点属性数量 */
    maxVertexAttribs: number,

    /** 是否支持实例化渲染 */
    supportInstancedArrays: boolean,

    /** 是否支持多渲染目标(MRT) */
    supportMultiRenderTargets: boolean,

    /** 是否为WebGL2上下文 */
    isWebGL2: boolean,

    /** 最大颜色附件数量 */
    maxColorAttachments: number,

    /** 是否支持深度纹理 */
    supportDepthTexture: boolean,

    /** 是否支持浮点纹理 */
    supportFloatTexture: boolean,

    /** 是否支持半浮点纹理 */
    supportHalfFloatTexture: boolean,
  };

  /**
   * 创建WebGL设备对象
   *
   * 初始化WebGL上下文并检测设备能力。尝试创建WebGL2上下文，如果不支持则回退到WebGL1。
   *
   * @param canvas - 要创建WebGL上下文的HTML Canvas元素
   * @param options - WebGL上下文配置选项
   * @throws {Error} 如果WebGL不受支持
   */
  constructor (canvas: HTMLCanvasElement, options?: WebGLContextAttributes) {
    // 尝试创建 WebGL2 上下文，如果不支持则回退到 WebGL1
    this.gl = (canvas.getContext('webgl2', options) ||
              canvas.getContext('webgl', options) ||
              canvas.getContext('experimental-webgl', options)) as WebGLRenderingContext;

    if (!this.gl) {
      throw new Error('WebGL not supported');
    }

    // 初始化能力参数
    this.capabilities = {
      maxTextureSize: 0,
      maxCubeMapSize: 0,
      maxRenderTextureSize: 0,
      maxVertexAttribs: 0,
      supportInstancedArrays: false,
      supportMultiRenderTargets: false,
      isWebGL2: false,
      maxColorAttachments: 1,
      supportDepthTexture: false,
      supportFloatTexture: false,
      supportHalfFloatTexture: false,
    };

    this.detectCapabilities();
    this.loadExtensions();
  }

  /**
   * 检测设备特性和能力限制
   *
   * 查询WebGL上下文的各种限制和支持的功能，填充capabilities对象。
   * WebGL2和WebGL1的能力检测逻辑有所不同。
   *
   * @private
   */
  private detectCapabilities (): void {
    const gl = this.gl;
    const isWebGL2 = this.isWebGL2();

    this.capabilities.isWebGL2 = isWebGL2;
    this.capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.capabilities.maxCubeMapSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
    this.capabilities.maxRenderTextureSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    this.capabilities.maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);

    if (isWebGL2) {
      const gl2 = gl as WebGL2RenderingContext;

      this.capabilities.supportInstancedArrays = true;
      this.capabilities.supportMultiRenderTargets = true;
      this.capabilities.maxColorAttachments = gl2.getParameter(gl2.MAX_COLOR_ATTACHMENTS);
      this.capabilities.supportDepthTexture = true;
      this.capabilities.supportFloatTexture = true;
      this.capabilities.supportHalfFloatTexture = true;
    } else {
      this.capabilities.supportInstancedArrays = !!this.getExtension('ANGLE_instanced_arrays');
      this.capabilities.supportMultiRenderTargets = !!this.getExtension('WEBGL_draw_buffers');
      this.capabilities.maxColorAttachments = this.capabilities.supportMultiRenderTargets ?
        this.gl.getParameter(this.getExtension('WEBGL_draw_buffers').MAX_COLOR_ATTACHMENTS_WEBGL) : 1;
      this.capabilities.supportDepthTexture = !!this.getExtension('WEBGL_depth_texture');
      this.capabilities.supportFloatTexture = !!this.getExtension('OES_texture_float');
      this.capabilities.supportHalfFloatTexture = !!this.getExtension('OES_texture_half_float');
    }
  }

  /**
   * 加载常用WebGL扩展
   *
   * 尝试加载一系列有用的WebGL扩展，并将成功加载的扩展存储在extensions映射表中。
   *
   * @private
   */
  private loadExtensions (): void {
    // 加载关键扩展
    const extensionsToLoad = [
      'EXT_texture_filter_anisotropic',
      'OES_texture_float',
      'OES_texture_half_float',
      'WEBGL_compressed_texture_s3tc',
      'WEBGL_depth_texture',
      'ANGLE_instanced_arrays',
      'WEBGL_draw_buffers',
    ];

    extensionsToLoad.forEach(extName => {
      try {
        const extension = this.gl.getExtension(extName);

        if (extension) {
          this.extensions.set(extName, extension);
        }
      } catch (_ignored) {
        console.warn(`Extension ${extName} not supported`);
      }
    });
  }

  /**
   * 获取WebGL渲染上下文
   *
   * @returns WebGL渲染上下文
   */
  getContext (): WebGL2RenderingContext | WebGLRenderingContext {
    return this.gl;
  }

  /**
   * 检查是否支持特定WebGL扩展
   *
   * @param extensionName - 要检查的WebGL扩展名称
   * @returns 如果扩展受支持则返回true
   */
  isExtensionSupported (extensionName: string): boolean {
    return this.extensions.has(extensionName);
  }

  /**
   * 获取特定WebGL扩展对象
   *
   * 如果扩展之前未加载，会尝试加载扩展。
   *
   * @param extensionName - 扩展名称
   * @returns 扩展对象，如果不支持则返回null
   */
  getExtension (extensionName: string): any {
    if (!this.extensions.has(extensionName)) {
      const extension = this.gl.getExtension(extensionName);

      if (extension) {
        this.extensions.set(extensionName, extension);
      }
    }

    return this.extensions.get(extensionName) || null;
  }

  /**
   * 获取设备能力信息
   *
   * 返回当前WebGL上下文所有检测到的能力参数。
   *
   * @returns 设备能力对象的副本
   */
  getCapabilities () {
    return { ...this.capabilities };
  }

  /**
   * 检查是否为WebGL2上下文
   *
   * @returns 如果是WebGL2上下文则返回true
   */
  isWebGL2 (): boolean {
    return this.gl instanceof WebGL2RenderingContext;
  }

  /**
   * 获取最大纹理尺寸
   *
   * @returns 支持的最大纹理尺寸(像素)
   */
  getMaxTextureSize (): number {
    return this.capabilities.maxTextureSize;
  }

  /**
   * 获取最大立方体贴图尺寸
   *
   * @returns 支持的最大立方体贴图尺寸(像素)
   */
  getMaxCubeMapSize (): number {
    return this.capabilities.maxCubeMapSize;
  }

  /**
   * 检查是否支持实例化渲染
   *
   * @returns 如果支持实例化渲染则返回true
   */
  supportsInstancedArrays (): boolean {
    return this.capabilities.supportInstancedArrays;
  }

  /**
   * 检查是否支持多渲染目标
   *
   * @returns 如果支持多渲染目标则返回true
   */
  supportsMultiRenderTargets (): boolean {
    return this.capabilities.supportMultiRenderTargets;
  }

  /**
   * 获取最大颜色附件数量
   *
   * @returns 支持的最大颜色附件数量
   */
  getMaxColorAttachments (): number {
    return this.capabilities.maxColorAttachments;
  }

  /**
   * 检查是否支持深度纹理
   *
   * @returns 如果支持深度纹理则返回true
   */
  supportsDepthTexture (): boolean {
    return this.capabilities.supportDepthTexture;
  }

  /**
   * 检查是否支持浮点纹理
   *
   * @returns 如果支持浮点纹理则返回true
   */
  supportsFloatTexture (): boolean {
    return this.capabilities.supportFloatTexture;
  }

  /**
   * 检查是否支持半浮点纹理
   *
   * @returns 如果支持半浮点纹理则返回true
   */
  supportsHalfFloatTexture (): boolean {
    return this.capabilities.supportHalfFloatTexture;
  }
}