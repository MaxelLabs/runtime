import type { IRHIDevice } from '@maxellabs/core';

export class GLDevice implements IRHIDevice {
  private gl: WebGL2RenderingContext | WebGLRenderingContext;
  private extensions: Map<string, any> = new Map();
  private capabilities: {
    maxTextureSize: number;
    maxCubeMapSize: number;
    maxRenderTextureSize: number;
    maxVertexAttribs: number;
    supportInstancedArrays: boolean;
    supportMultiRenderTargets: boolean;
    isWebGL2: boolean;
    maxColorAttachments: number;
    supportDepthTexture: boolean;
    supportFloatTexture: boolean;
    supportHalfFloatTexture: boolean;
  };

  constructor(canvas: HTMLCanvasElement, options?: WebGLContextAttributes) {
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
      supportHalfFloatTexture: false
    };
    
    this.detectCapabilities();
    this.loadExtensions();
  }
  
  private detectCapabilities(): void {
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
  
  private loadExtensions(): void {
    // 加载关键扩展
    const extensionsToLoad = [
      'EXT_texture_filter_anisotropic',
      'OES_texture_float',
      'OES_texture_half_float',
      'WEBGL_compressed_texture_s3tc',
      'WEBGL_depth_texture',
      'ANGLE_instanced_arrays',
      'WEBGL_draw_buffers'
    ];
    
    extensionsToLoad.forEach(extName => {
      try {
        const extension = this.gl.getExtension(extName);
        if (extension) {
          this.extensions.set(extName, extension);
        }
      } catch (e) {
        console.warn(`Extension ${extName} not supported`);
      }
    });
  }
  
  // 获取WebGL上下文
  getContext(): WebGL2RenderingContext | WebGLRenderingContext {
    return this.gl;
  }
  
  // 检查是否支持特定扩展
  isExtensionSupported(extensionName: string): boolean {
    return this.extensions.has(extensionName);
  }
  
  // 获取特定扩展
  getExtension(extensionName: string): any {
    if (!this.extensions.has(extensionName)) {
      const extension = this.gl.getExtension(extensionName);
      if (extension) {
        this.extensions.set(extensionName, extension);
      }
    }
    return this.extensions.get(extensionName) || null;
  }
  
  // 获取设备能力
  getCapabilities() {
    return { ...this.capabilities };
  }
  
  // 检查是否为WebGL2
  isWebGL2(): boolean {
    return this.gl instanceof WebGL2RenderingContext;
  }
  
  // 获取最大纹理大小
  getMaxTextureSize(): number {
    return this.capabilities.maxTextureSize;
  }
  
  // 获取最大立方体贴图大小
  getMaxCubeMapSize(): number {
    return this.capabilities.maxCubeMapSize;
  }
  
  // 检查是否支持实例化渲染
  supportsInstancedArrays(): boolean {
    return this.capabilities.supportInstancedArrays;
  }
  
  // 检查是否支持多渲染目标
  supportsMultiRenderTargets(): boolean {
    return this.capabilities.supportMultiRenderTargets;
  }
  
  // 获取最大颜色附件数量
  getMaxColorAttachments(): number {
    return this.capabilities.maxColorAttachments;
  }
  
  // 检查是否支持深度纹理
  supportsDepthTexture(): boolean {
    return this.capabilities.supportDepthTexture;
  }
  
  // 检查是否支持浮点纹理
  supportsFloatTexture(): boolean {
    return this.capabilities.supportFloatTexture;
  }
  
  // 检查是否支持半浮点纹理
  supportsHalfFloatTexture(): boolean {
    return this.capabilities.supportHalfFloatTexture;
  }
}