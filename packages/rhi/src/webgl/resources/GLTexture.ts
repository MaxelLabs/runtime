import type {
  IRHITexture,
  IRHITextureView,
  RHITextureDescriptor,
  RHITextureFormat,
  RHITextureUsage } from '@maxellabs/core';
import { WebGLUtils } from '../utils/GLUtils';
import { WebGLTextureView } from './GLTextureView';

/**
 * WebGL纹理实现
 */
export class GLTexture implements IRHITexture {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private glTexture: WebGLTexture | null;
  private width: number;
  private height: number;
  private depthOrArrayLayers: number;
  private mipLevelCount: number;
  private format: RHITextureFormat;
  private usage: RHITextureUsage;
  private dimension: '1d' | '2d' | '3d' | 'cube';
  private sampleCount: number;
  private label?: string;
  private target: number;
  private glInternalFormat: number;
  private glFormat: number;
  private glType: number;
  private isDestroyed = false;
  private utils: WebGLUtils;

  /**
   * 创建WebGL纹理
   *
   * @param gl WebGL上下文
   * @param descriptor 纹理描述符
   */
  constructor (gl: WebGLRenderingContext | WebGL2RenderingContext, descriptor: RHITextureDescriptor) {
    this.gl = gl;
    this.utils = new WebGLUtils(gl);
    this.width = descriptor.width;
    this.height = descriptor.height;
    this.depthOrArrayLayers = descriptor.depthOrArrayLayers || 1;
    this.mipLevelCount = descriptor.mipLevelCount || 1;
    this.format = descriptor.format;
    this.usage = descriptor.usage;
    this.dimension = descriptor.dimension || '2d';
    this.sampleCount = descriptor.sampleCount || 1;
    this.label = descriptor.label;

    // 确定纹理目标
    this.target = this.getGLTextureTarget(this.dimension);

    // 确定内部格式、格式和类型
    const formatInfo = this.utils.textureFormatToGL(this.format);

    this.glInternalFormat = formatInfo.internalFormat;
    this.glFormat = formatInfo.format;
    this.glType = formatInfo.type;

    // 创建纹理
    this.glTexture = gl.createTexture();
    if (!this.glTexture) {
      throw new Error('创建WebGL纹理失败');
    }

    // 初始化纹理
    this.initializeTexture();
  }

  /**
   * 初始化纹理
   */
  private initializeTexture (): void {
    const gl = this.gl;

    gl.bindTexture(this.target, this.glTexture);

    // 默认纹理参数
    gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, this.mipLevelCount > 1 ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // 根据纹理维度初始化
    if (this.dimension === 'cube') {
      // 立方体贴图
      for (let i = 0; i < 6; i++) {
        const target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;

        gl.texImage2D(target, 0, this.glInternalFormat, this.width, this.height, 0, this.glFormat, this.glType, null);
      }
    } else if (this.dimension === '3d') {
      // 3D纹理仅WebGL2支持
      if (gl instanceof WebGL2RenderingContext) {
        gl.texImage3D(
          this.target,
          0,
          this.glInternalFormat,
          this.width,
          this.height,
          this.depthOrArrayLayers,
          0,
          this.glFormat,
          this.glType,
          null
        );
      } else {
        console.warn('WebGL1不支持3D纹理，回退为2D纹理');
        gl.texImage2D(this.target, 0, this.glInternalFormat, this.width, this.height, 0, this.glFormat, this.glType, null);
      }
    } else {
      // 2D纹理
      gl.texImage2D(this.target, 0, this.glInternalFormat, this.width, this.height, 0, this.glFormat, this.glType, null);
    }

    // 如果需要mipmap，生成mipmap
    if (this.mipLevelCount > 1) {
      gl.generateMipmap(this.target);
    }

    // 解绑纹理
    gl.bindTexture(this.target, null);
  }

  /**
   * 获取WebGL纹理目标
   */
  private getGLTextureTarget (dimension: '1d' | '2d' | '3d' | 'cube'): number {
    const gl = this.gl;

    switch (dimension) {
      case '1d':
      case '2d':
        return gl.TEXTURE_2D;
      case '3d':
        return gl instanceof WebGL2RenderingContext ? gl.TEXTURE_3D : gl.TEXTURE_2D;
      case 'cube':
        return gl.TEXTURE_CUBE_MAP;
      default:
        return gl.TEXTURE_2D;
    }
  }

  /**
   * 更新纹理数据
   */
  update (
    data: BufferSource | ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    x = 0,
    y = 0,
    z = 0,
    width?: number,
    height?: number,
    depth?: number,
    mipLevel = 0,
    arrayLayer = 0
  ): void {
    if (this.isDestroyed) {
      console.warn('试图更新已销毁的纹理');

      return;
    }

    const gl = this.gl;

    gl.bindTexture(this.target, this.glTexture);

    if (this.dimension === 'cube') {
      // 更新立方体贴图的一个面
      const target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + (arrayLayer % 6);

      if (data instanceof HTMLImageElement ||
          data instanceof HTMLCanvasElement ||
          data instanceof HTMLVideoElement ||
          data instanceof ImageBitmap ||
          data instanceof ImageData) {
        gl.texSubImage2D(target, mipLevel, x, y, this.glFormat, this.glType, data);
      } else {
        const actualWidth = width ?? (this.width - x);
        const actualHeight = height ?? (this.height - y);

        gl.texSubImage2D(target, mipLevel, x, y, actualWidth, actualHeight, this.glFormat, this.glType, data);
      }
    } else if (this.dimension === '3d') {
      // 更新3D纹理
      if (gl instanceof WebGL2RenderingContext) {
        const actualWidth = width ?? (this.width - x);
        const actualHeight = height ?? (this.height - y);
        const actualDepth = depth ?? (this.depthOrArrayLayers - z);

        if (data instanceof HTMLImageElement ||
            data instanceof HTMLCanvasElement ||
            data instanceof HTMLVideoElement ||
            data instanceof ImageBitmap ||
            data instanceof ImageData) {
          throw new Error('不支持将DOM元素直接更新到3D纹理');
        } else {
          gl.texSubImage3D(
            this.target,
            mipLevel,
            x, y, z,
            actualWidth,
            actualHeight,
            actualDepth,
            this.glFormat,
            this.glType,
            data as ArrayBufferView
          );
        }
      }
    } else {
      // 更新2D纹理
      if (data instanceof HTMLImageElement ||
          data instanceof HTMLCanvasElement ||
          data instanceof HTMLVideoElement ||
          data instanceof ImageBitmap ||
          data instanceof ImageData) {
        gl.texSubImage2D(this.target, mipLevel, x, y, this.glFormat, this.glType, data);
      } else {
        const actualWidth = width ?? (this.width - x);
        const actualHeight = height ?? (this.height - y);

        gl.texSubImage2D(this.target, mipLevel, x, y, actualWidth, actualHeight, this.glFormat, this.glType, data as ArrayBufferView);
      }
    }

    // 如果更新的是第0级mip且纹理配置为生成mipmap，则重新生成
    if (mipLevel === 0 && this.mipLevelCount > 1) {
      gl.generateMipmap(this.target);
    }

    // 解绑纹理
    gl.bindTexture(this.target, null);
  }

  /**
   * 创建纹理视图
   */
  createView (
    format?: RHITextureFormat,
    dimension?: '1d' | '2d' | '3d' | 'cube' | '2d-array' | 'cube-array',
    baseMipLevel = 0,
    mipLevelCount?: number,
    baseArrayLayer = 0,
    arrayLayerCount?: number
  ): IRHITextureView {
    if (this.isDestroyed) {
      throw new Error('试图从已销毁的纹理创建视图');
    }

    // 创建纹理视图描述符
    const viewDescriptor = {
      texture: this,
      format: format || this.format,
      dimension: dimension || this.dimension,
      baseMipLevel,
      mipLevelCount: mipLevelCount !== undefined ? mipLevelCount : (this.mipLevelCount - baseMipLevel),
      baseArrayLayer,
      arrayLayerCount: arrayLayerCount !== undefined ? arrayLayerCount : (this.depthOrArrayLayers - baseArrayLayer),
    };

    // 创建并返回纹理视图
    return new WebGLTextureView(this.gl, viewDescriptor);
  }

  /**
   * 获取WebGL原生纹理
   */
  getGLTexture (): WebGLTexture | null {
    return this.glTexture;
  }

  /**
   * 获取WebGL纹理目标
   */
  getTarget (): number {
    return this.target;
  }

  /**
   * 销毁资源
   */
  destroy (): void {
    if (this.isDestroyed) {
      return;
    }

    if (this.glTexture) {
      this.gl.deleteTexture(this.glTexture);
      this.glTexture = null;
    }

    this.isDestroyed = true;
  }

  /**
   * 获取纹理宽度
   */
  getWidth (): number {
    return this.width;
  }

  /**
   * 获取纹理高度
   */
  getHeight (): number {
    return this.height;
  }

  /**
   * 获取纹理深度或数组层数
   */
  getDepthOrArrayLayers (): number {
    return this.depthOrArrayLayers;
  }

  /**
   * 获取MIP等级数
   */
  getMipLevelCount (): number {
    return this.mipLevelCount;
  }

  /**
   * 获取纹理格式
   */
  getFormat (): RHITextureFormat {
    return this.format;
  }

  /**
   * 获取纹理用途
   */
  getUsage (): RHITextureUsage {
    return this.usage;
  }

  /**
   * 获取纹理维度
   */
  getDimension (): '1d' | '2d' | '3d' | 'cube' {
    return this.dimension;
  }

  /**
   * 获取采样数量
   */
  getSampleCount (): number {
    return this.sampleCount;
  }

  /**
   * 获取纹理标签
   */
  getLabel (): string | undefined {
    return this.label;
  }
}