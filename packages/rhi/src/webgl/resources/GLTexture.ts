import type {
  IRHITexture,
  IRHITextureView,
  RHITextureDescriptor,
  RHITextureFormat,
  RHITextureUsage } from '@maxellabs/core';
import {
  RHIFilterMode,
  RHIAddressMode,
} from '@maxellabs/core';
import { WebGLUtils } from '../utils/GLUtils';
import { WebGLTextureView } from './GLTextureView';

/**
 * WebGL纹理实现
 */
export class GLTexture implements IRHITexture {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private glTexture: WebGLTexture | null;
  width: number;
  height: number;
  depthOrArrayLayers: number;
  mipLevelCount: number;
  format: RHITextureFormat;
  usage: RHITextureUsage;
  dimension: '1d' | '2d' | '3d' | 'cube';
  sampleCount: number;
  label?: string;
  target: number;
  private glInternalFormat: number;
  private glFormat: number;
  private glType: number;
  private isDestroyed = false;
  private utils: WebGLUtils;
  /**
   * 扩展配置，用于存储特定于纹理的额外配置选项
   * 包括：
   * - texParameters: 自定义纹理参数
   * - defaultFilter: 默认过滤模式
   * - defaultAddressMode: 默认寻址模式
   * - compareFunction: 用于深度纹理的比较函数
   * - compressedFormat: 压缩纹理格式信息
   */
  private extension: Record<string, any> | null = null;
  /** 用于标记3D纹理是否降级为2D纹理（在WebGL1环境中） */
  private is3DDowngradedTo2D = false;
  /** 是否为压缩纹理 */
  private isCompressedTexture = false;

  /**
   * 创建WebGL纹理
   *
   * @param gl WebGL上下文
   * @param descriptor 纹理描述符
   */
  constructor (gl: WebGLRenderingContext | WebGL2RenderingContext, descriptor: RHITextureDescriptor) {
    this.gl = gl;
    this.extension = descriptor.extension || {};

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

    // 检查3D纹理是否需要降级
    if (this.dimension === '3d' && !(gl instanceof WebGL2RenderingContext)) {
      console.warn('WebGL1不支持3D纹理，降级为2D纹理');
      this.is3DDowngradedTo2D = true;
    }

    // 检查是否为压缩纹理
    this.isCompressedTexture = this.extension?.compressedFormat !== undefined;

    // 确定纹理目标
    this.target = this.getGLTextureTarget(this.dimension);

    // 确定内部格式、格式和类型
    if (this.isCompressedTexture) {
      // 使用压缩纹理格式
      const compressedFormat = this.extension?.compressedFormat;

      this.glInternalFormat = compressedFormat.internalFormat;
      // 压缩纹理不需要设置format和type，但为了兼容性保留
      this.glFormat = gl.RGBA;
      this.glType = gl.UNSIGNED_BYTE;
    } else {
      // 使用标准纹理格式
      const formatInfo = this.utils.textureFormatToGL(this.format);

      this.glInternalFormat = formatInfo.internalFormat;
      this.glFormat = formatInfo.format;
      this.glType = formatInfo.type;
    }

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

    // 获取默认的过滤和寻址模式（从extension或使用默认值）
    const defaultFilter = this.extension?.defaultFilter || RHIFilterMode.LINEAR;
    const defaultAddressMode = this.extension?.defaultAddressMode || RHIAddressMode.CLAMP_TO_EDGE;

    // 设置纹理过滤参数
    gl.texParameteri(
      this.target,
      gl.TEXTURE_MIN_FILTER,
      this.utils.filterModeToGL(defaultFilter, this.mipLevelCount > 1)
    );
    gl.texParameteri(
      this.target,
      gl.TEXTURE_MAG_FILTER,
      this.utils.filterModeToGL(defaultFilter, false)
    );

    // 设置纹理寻址参数
    gl.texParameteri(
      this.target,
      gl.TEXTURE_WRAP_S,
      this.utils.addressModeToGL(defaultAddressMode)
    );
    gl.texParameteri(
      this.target,
      gl.TEXTURE_WRAP_T,
      this.utils.addressModeToGL(defaultAddressMode)
    );

    // 对于3D纹理和WebGL2，设置TEXTURE_WRAP_R
    if (this.dimension === '3d' && gl instanceof WebGL2RenderingContext) {
      gl.texParameteri(
        this.target,
        gl.TEXTURE_WRAP_R,
        this.utils.addressModeToGL(defaultAddressMode)
      );
    }

    // 设置深度纹理比较函数（如果提供）
    const compareFunction = this.extension?.compareFunction;

    if (compareFunction !== undefined) {
      const isWebGL2 = gl instanceof WebGL2RenderingContext;

      if (isWebGL2) {
        gl.texParameteri(
          this.target,
          gl.TEXTURE_COMPARE_MODE,
          gl.COMPARE_REF_TO_TEXTURE
        );
        gl.texParameteri(
          this.target,
          gl.TEXTURE_COMPARE_FUNC,
          this.utils.compareFunctionToGL(compareFunction)
        );
      } else {
        // 检查WebGL1扩展支持
        if (this.utils.extension['EXT_shadow_samplers']) {
          const ext = this.utils.extension['EXT_shadow_samplers'];

          gl.texParameteri(
            this.target,
            ext.TEXTURE_COMPARE_MODE_EXT,
            ext.COMPARE_REF_TO_TEXTURE_EXT
          );
          gl.texParameteri(
            this.target,
            ext.TEXTURE_COMPARE_FUNC_EXT,
            this.utils.compareFunctionToGL(compareFunction)
          );
        }
      }
    }

    // 应用extension中的自定义纹理参数
    if (this.extension && this.extension.texParameters) {
      for (const [param, value] of Object.entries(this.extension.texParameters)) {
        gl.texParameteri(this.target, Number(param), Number(value));
      }
    }

    // 根据是否为压缩纹理分别处理
    if (this.isCompressedTexture) {
      this.initializeCompressedTexture();
    } else {
      this.initializeStandardTexture();
    }

    // 如果需要mipmap，生成mipmap
    if (this.mipLevelCount > 1 && !this.isCompressedTexture) {
      gl.generateMipmap(this.target);
    }

    // 解绑纹理
    gl.bindTexture(this.target, null);
  }

  /**
   * 初始化标准（非压缩）纹理
   */
  private initializeStandardTexture (): void {
    const gl = this.gl;

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
        // WebGL1降级处理：创建2D纹理
        // 这里已经设置了is3DDowngradedTo2D标志，创建2D纹理
        gl.texImage2D(this.target, 0, this.glInternalFormat, this.width, this.height, 0, this.glFormat, this.glType, null);
      }
    } else {
      // 2D纹理
      gl.texImage2D(this.target, 0, this.glInternalFormat, this.width, this.height, 0, this.glFormat, this.glType, null);
    }
  }

  /**
   * 初始化压缩纹理
   */
  private initializeCompressedTexture (): void {
    const gl = this.gl;
    const compressedFormat = this.extension?.compressedFormat;

    if (!compressedFormat) {
      throw new Error('缺少压缩纹理格式信息');
    }

    // 检查是否支持该压缩格式
    if (!this.checkCompressedTextureSupport(compressedFormat.internalFormat)) {
      console.warn(`不支持的压缩纹理格式：${compressedFormat.internalFormat}，回退到标准格式`);
      this.isCompressedTexture = false;
      this.initializeStandardTexture();

      return;
    }

    // 根据维度处理压缩纹理
    if (this.dimension === 'cube') {
      // 立方体压缩纹理
      for (let i = 0; i < 6; i++) {
        const target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;

        if (compressedFormat.data && compressedFormat.data[i]) {
          gl.compressedTexImage2D(
            target,
            0,
            this.glInternalFormat,
            this.width,
            this.height,
            0,
            compressedFormat.data[i]
          );
        } else {
          // 如果没有提供数据，创建空的压缩纹理
          const blockSize = this.getCompressedBlockSize(this.glInternalFormat);
          const dataSize = Math.ceil(this.width / 4) * Math.ceil(this.height / 4) * blockSize;
          const emptyData = new Uint8Array(dataSize);

          gl.compressedTexImage2D(
            target,
            0,
            this.glInternalFormat,
            this.width,
            this.height,
            0,
            emptyData
          );
        }
      }
    } else if (this.dimension === '3d' && gl instanceof WebGL2RenderingContext) {
      // WebGL2 3D压缩纹理（如果支持）
      if (compressedFormat.data) {
        (gl).compressedTexImage3D(
          this.target,
          0,
          this.glInternalFormat,
          this.width,
          this.height,
          this.depthOrArrayLayers,
          0,
          compressedFormat.data
        );
      }
    } else {
      // 2D压缩纹理
      if (compressedFormat.data) {
        gl.compressedTexImage2D(
          this.target,
          0,
          this.glInternalFormat,
          this.width,
          this.height,
          0,
          compressedFormat.data instanceof Uint8Array
            ? compressedFormat.data
            : compressedFormat.data[0]
        );
      }

      // 处理mipmap级别（如果提供）
      if (this.mipLevelCount > 1 && compressedFormat.mipmaps) {
        for (let i = 0; i < Math.min(this.mipLevelCount - 1, compressedFormat.mipmaps.length); i++) {
          const mipLevel = i + 1;
          const mipWidth = Math.max(1, this.width >> mipLevel);
          const mipHeight = Math.max(1, this.height >> mipLevel);

          gl.compressedTexImage2D(
            this.target,
            mipLevel,
            this.glInternalFormat,
            mipWidth,
            mipHeight,
            0,
            compressedFormat.mipmaps[i]
          );
        }
      }
    }
  }

  /**
   * 检查WebGL环境是否支持指定的压缩纹理格式
   */
  private checkCompressedTextureSupport (format: number): boolean {
    const gl = this.gl;
    const isWebGL2 = gl instanceof WebGL2RenderingContext;

    // 检查各种常见的压缩纹理格式扩展
    const extensions = [
      'WEBGL_compressed_texture_s3tc',
      'WEBGL_compressed_texture_astc',
      'WEBGL_compressed_texture_etc',
      'WEBGL_compressed_texture_etc1',
      'WEBGL_compressed_texture_pvrtc',
    ];

    // WebGL2原生支持一些格式
    if (isWebGL2) {
      // 检查原生支持的格式
      const supportedFormats = [
        // ETC1/ETC2 在WebGL2中是原生支持的
        0x8D64, // COMPRESSED_RGB8_ETC2
        0x8D65, // COMPRESSED_RGBA8_ETC2_EAC
        0x8D66, // COMPRESSED_R11_EAC
        0x8D67, // COMPRESSED_RG11_EAC
      ];

      if (supportedFormats.includes(format)) {
        return true;
      }
    }

    // 检查扩展支持
    for (const extName of extensions) {
      const ext = this.utils.extension[extName];

      if (ext) {
        // 获取扩展支持的所有格式
        const supportedFormats = Object.values(ext)
          .filter(value => typeof value === 'number')
          .map(value => value as number);

        if (supportedFormats.includes(format)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 获取压缩纹理格式的块大小（字节）
   */
  private getCompressedBlockSize (format: number): number {
    // DXT1/BC1 - 8 bytes per 4x4 block
    if ([
      0x83F0, // COMPRESSED_RGB_S3TC_DXT1_EXT
      0x83F1, // COMPRESSED_RGBA_S3TC_DXT1_EXT
    ].includes(format)) {
      return 8;
    }

    // DXT3/BC2, DXT5/BC3 - 16 bytes per 4x4 block
    if ([
      0x83F2, // COMPRESSED_RGBA_S3TC_DXT3_EXT
      0x83F3, // COMPRESSED_RGBA_S3TC_DXT5_EXT
    ].includes(format)) {
      return 16;
    }

    // ETC1/ETC2 - 8 bytes per 4x4 block
    if ([
      0x8D64, // COMPRESSED_RGB8_ETC2
      0x8D65, // COMPRESSED_RGBA8_ETC2_EAC
    ].includes(format)) {
      return 8;
    }

    // 默认块大小（保守估计）
    return 16;
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
      throw new Error('试图更新已销毁的纹理');
    }

    // 不支持更新压缩纹理
    if (this.isCompressedTexture) {
      throw new Error('不支持直接更新压缩纹理');
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

        gl.texSubImage2D(target, mipLevel, x, y, actualWidth, actualHeight, this.glFormat, this.glType, data as ArrayBufferView);
      }
    } else if (this.dimension === '3d') {
      if (gl instanceof WebGL2RenderingContext) {
        // WebGL2 3D纹理更新
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
      } else if (this.is3DDowngradedTo2D) {
        // WebGL1环境下3D纹理降级为2D处理
        console.warn('在WebGL1环境中更新3D纹理，使用2D纹理更新方式，z坐标和depth参数将被忽略');

        const actualWidth = width ?? (this.width - x);
        const actualHeight = height ?? (this.height - y);

        if (data instanceof HTMLImageElement ||
            data instanceof HTMLCanvasElement ||
            data instanceof HTMLVideoElement ||
            data instanceof ImageBitmap ||
            data instanceof ImageData) {
          gl.texSubImage2D(this.target, mipLevel, x, y, this.glFormat, this.glType, data);
        } else {
          gl.texSubImage2D(this.target, mipLevel, x, y, actualWidth, actualHeight, this.glFormat, this.glType, data as ArrayBufferView);
        }
      } else {
        // 这个分支理论上不应该被执行到，因为如果dimension是'3d'且不是WebGL2，
        // 则在构造函数中应该已经设置了is3DDowngradedTo2D标志
        console.error('遇到意外情况：在WebGL1环境中处理3D纹理但未标记为降级');
        throw new Error('WebGL1不支持3D纹理更新');
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
    if (mipLevel === 0 && this.mipLevelCount > 1 && !this.isCompressedTexture) {
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
   * 获取是否为降级的3D纹理
   */
  isDowngraded3DTexture (): boolean {
    return this.is3DDowngradedTo2D;
  }

  /**
   * 获取是否为压缩纹理
   */
  isCompressed (): boolean {
    return this.isCompressedTexture;
  }

  /**
   * 获取扩展配置
   */
  getExtension (): Record<string, any> | null {
    return this.extension;
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