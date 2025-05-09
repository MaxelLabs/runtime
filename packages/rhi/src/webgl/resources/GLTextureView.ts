import type { IRHITexture, IRHITextureView, RHITextureFormat } from '@maxellabs/core';
import type { GLTexture } from './GLTexture';

/**
 * WebGL纹理视图实现
 */
export class WebGLTextureView implements IRHITextureView {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  readonly texture: IRHITexture;
  format: RHITextureFormat;
  dimension: '1d' | '2d' | '3d' | 'cube' | '2d-array' | 'cube-array';
  baseMipLevel: number;
  mipLevelCount: number;
  baseArrayLayer: number;
  arrayLayerCount: number;
  label?: string;
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
    const { format, dimension, baseMipLevel, mipLevelCount, baseArrayLayer, arrayLayerCount, label } = descriptor;
    const { format :tFormat, dimension: tDimension, mipLevelCount: tMipLevelCount, depthOrArrayLayers: tDepthOrArrayLayers } = this.texture;

    this.format = format || tFormat;
    this.dimension = dimension || tDimension;
    this.baseMipLevel = baseMipLevel || 0;
    this.mipLevelCount = mipLevelCount || (tMipLevelCount - this.baseMipLevel);
    this.baseArrayLayer = baseArrayLayer || 0;
    this.arrayLayerCount = arrayLayerCount || (tDepthOrArrayLayers - this.baseArrayLayer);
    this.label = label;

    // 验证视图参数
    this.validateParameters();
  }

  /**
   * 验证视图参数
   */
  private validateParameters (): void {
    const { mipLevelCount, baseMipLevel, arrayLayerCount } = this;

    // 检查mip级别范围
    if (baseMipLevel < 0 || baseMipLevel >= mipLevelCount) {
      throw new Error(`基础MIP级别 ${baseMipLevel} 超出有效范围 [0, ${mipLevelCount - 1}]`);
    }

    if (baseMipLevel + mipLevelCount > mipLevelCount) {
      throw new Error(`MIP级别范围 [${baseMipLevel}, ${baseMipLevel + mipLevelCount - 1}] 超出纹理的MIP级别范围 [0, ${mipLevelCount - 1}]`);
    }

    // 检查数组层范围
    if (this.baseArrayLayer < 0 || this.baseArrayLayer >= arrayLayerCount) {
      throw new Error(`基础数组层 ${this.baseArrayLayer} 超出有效范围 [0, ${arrayLayerCount - 1}]`);
    }

    if (this.baseArrayLayer + this.arrayLayerCount > arrayLayerCount) {
      throw new Error(`数组层范围 [${this.baseArrayLayer}, ${this.baseArrayLayer + this.arrayLayerCount - 1}] 超出纹理的数组层范围 [0, ${arrayLayerCount - 1}]`);
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
  getGLTexture (): WebGLTexture | null {
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