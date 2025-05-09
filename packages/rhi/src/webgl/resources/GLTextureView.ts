import type { IRHITexture, IRHITextureView, RHITextureFormat } from '@maxellabs/core';
import type { GLTexture } from './GLTexture';

/**
 * WebGL纹理视图实现
 */
export class WebGLTextureView implements IRHITextureView {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  readonly texture: IRHITexture;
  private format: RHITextureFormat;
  private dimension: '1d' | '2d' | '3d' | 'cube' | '2d-array' | 'cube-array';
  private baseMipLevel: number;
  private mipLevelCount: number;
  private baseArrayLayer: number;
  private arrayLayerCount: number;
  private label?: string;
  private isDestroyed = false;

  /**
   * 创建WebGL纹理视图
   *
   * @param gl WebGL上下文
   * @param descriptor 纹理视图描述符
   */
  constructor (gl: WebGLRenderingContext | WebGL2RenderingContext, descriptor: {
    texture: IRHITexture,
    format?: RHITextureFormat,
    dimension?: '1d' | '2d' | '3d' | 'cube' | '2d-array' | 'cube-array',
    baseMipLevel?: number,
    mipLevelCount?: number,
    baseArrayLayer?: number,
    arrayLayerCount?: number,
    label?: string,
  }) {
    this.gl = gl;
    this.texture = descriptor.texture;
    this.format = descriptor.format || this.texture.getFormat();
    this.dimension = descriptor.dimension || this.texture.getDimension();
    this.baseMipLevel = descriptor.baseMipLevel || 0;
    this.mipLevelCount = descriptor.mipLevelCount || (this.texture.getMipLevelCount() - this.baseMipLevel);
    this.baseArrayLayer = descriptor.baseArrayLayer || 0;
    this.arrayLayerCount = descriptor.arrayLayerCount || (this.texture.getDepthOrArrayLayers() - this.baseArrayLayer);
    this.label = descriptor.label;

    // 验证视图参数
    this.validateParameters();
  }

  /**
   * 验证视图参数
   */
  private validateParameters (): void {
    // 检查mip级别范围
    if (this.baseMipLevel < 0 || this.baseMipLevel >= this.texture.getMipLevelCount()) {
      throw new Error(`基础MIP级别 ${this.baseMipLevel} 超出有效范围 [0, ${this.texture.getMipLevelCount() - 1}]`);
    }

    if (this.baseMipLevel + this.mipLevelCount > this.texture.getMipLevelCount()) {
      throw new Error(`MIP级别范围 [${this.baseMipLevel}, ${this.baseMipLevel + this.mipLevelCount - 1}] 超出纹理的MIP级别范围 [0, ${this.texture.getMipLevelCount() - 1}]`);
    }

    // 检查数组层范围
    if (this.baseArrayLayer < 0 || this.baseArrayLayer >= this.texture.getDepthOrArrayLayers()) {
      throw new Error(`基础数组层 ${this.baseArrayLayer} 超出有效范围 [0, ${this.texture.getDepthOrArrayLayers() - 1}]`);
    }

    if (this.baseArrayLayer + this.arrayLayerCount > this.texture.getDepthOrArrayLayers()) {
      throw new Error(`数组层范围 [${this.baseArrayLayer}, ${this.baseArrayLayer + this.arrayLayerCount - 1}] 超出纹理的数组层范围 [0, ${this.texture.getDepthOrArrayLayers() - 1}]`);
    }
  }

  /**
   * 获取源纹理
   */
  getTexture (): IRHITexture {
    return this.texture;
  }

  /**
   * 获取视图格式
   */
  getFormat (): RHITextureFormat {
    return this.format;
  }

  /**
   * 获取视图维度
   */
  getDimension (): '1d' | '2d' | '3d' | 'cube' | '2d-array' | 'cube-array' {
    return this.dimension;
  }

  /**
   * 获取基础MIP级别
   */
  getBaseMipLevel (): number {
    return this.baseMipLevel;
  }

  /**
   * 获取MIP级别数
   */
  getMipLevelCount (): number {
    return this.mipLevelCount;
  }

  /**
   * 获取基础数组层
   */
  getBaseArrayLayer (): number {
    return this.baseArrayLayer;
  }

  /**
   * 获取数组层数
   */
  getArrayLayerCount (): number {
    return this.arrayLayerCount;
  }

  /**
   * 获取视图标签
   */
  getLabel (): string | undefined {
    return this.label;
  }

  /**
   * WebGL没有单独的纹理视图概念，返回原始纹理
   */
  getGLTexture (): GLTexture | null {
    return (this.texture as GLTexture).getGLTexture();
  }

  /**
   * 获取WebGL纹理目标
   */
  getGLTextureTarget (): number {
    return (this.texture as GLTexture).getTarget();
  }

  /**
   * 销毁资源
   * 注意：WebGL纹理视图不拥有底层资源，销毁视图不会销毁底层纹理
   */
  destroy (): void {
    if (this.isDestroyed) {
      return;
    }

    // 标记为已销毁
    this.isDestroyed = true;
  }
}