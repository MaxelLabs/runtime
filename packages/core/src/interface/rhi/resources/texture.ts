/**
 * texture.ts
 * 定义纹理资源接口
 */

import type { RHITextureFormat, RHITextureUsage } from '../types/enums';

/**
 * 纹理资源接口
 */
export interface IRHITexture {
  /**
   * 纹理宽度
   */
  readonly width: number;

  /**
   * 纹理高度
   */
  readonly height: number;

  /**
   * 纹理深度或数组层数
   */
  readonly depthOrArrayLayers: number;

  /**
   * MIP等级数
   */
  readonly mipLevelCount: number;

  /**
   * 纹理格式
   */
  readonly format: RHITextureFormat;

  /**
   * 纹理用途
   */
  readonly usage: RHITextureUsage;

  /**
   * 纹理维度
   */
  readonly dimension: '1d' | '2d' | '3d' | 'cube';

  /**
   * 采样数量
   */
  readonly sampleCount: number;

  /**
   * 纹理标签
   */
  readonly label?: string;

  /**
   * 更新纹理数据
   * @param data 源数据
   * @param x 目标X坐标
   * @param y 目标Y坐标
   * @param z 目标Z坐标
   * @param width 更新宽度
   * @param height 更新高度
   * @param depth 更新深度
   * @param mipLevel MIP等级
   * @param arrayLayer 数组层索引
   */
  update(
    data: BufferSource | ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    x?: number,
    y?: number,
    z?: number,
    width?: number,
    height?: number,
    depth?: number,
    mipLevel?: number,
    arrayLayer?: number
  ): void;

  /**
   * 创建纹理视图
   * @param format 视图格式
   * @param dimension 视图维度
   * @param baseMipLevel 基础MIP等级
   * @param mipLevelCount MIP等级数
   * @param baseArrayLayer 基础数组层
   * @param arrayLayerCount 数组层数
   */
  createView(
    format?: RHITextureFormat,
    dimension?: '1d' | '2d' | '3d' | 'cube' | '2d-array' | 'cube-array',
    baseMipLevel?: number,
    mipLevelCount?: number,
    baseArrayLayer?: number,
    arrayLayerCount?: number
  ): IRHITextureView;

  /**
   * 销毁资源
   */
  destroy(): void;
}

/**
 * 纹理视图接口
 */
export interface IRHITextureView {
  /**
   * 源纹理
   */
  readonly texture: IRHITexture;

  /**
   * 视图格式
   */
  readonly format: RHITextureFormat;

  /**
   * 视图维度
   */
  readonly dimension: '1d' | '2d' | '3d' | 'cube' | '2d-array' | 'cube-array';

  /**
   * 基础MIP等级
   */
  readonly baseMipLevel: number;

  /**
   * MIP等级数
   */
  readonly mipLevelCount: number;

  /**
   * 基础数组层
   */
  readonly baseArrayLayer: number;

  /**
   * 数组层数
   */
  readonly arrayLayerCount: number;

  /**
   * 视图标签
   */
  readonly label?: string;

  /**
   * 销毁资源
   */
  destroy(): void;
}
