/**
 * Maxellabs 图像基础规范
 * 图像基础类型定义
 */

import type { UsdPrim, UsdValue } from '../../core/usd';
import type { CommonMetadata, PerformanceConfig } from '../../core/interfaces';
import type { ColorSpace } from '../../core/enums';

/**
 * 图像基础接口
 */
export interface ImagePrim extends UsdPrim {
  typeName: 'Image';
}

/**
 * 图像资源
 */
export interface ImageResource extends ImagePrim {
  attributes: {
    /**
     * 图像名称
     */
    name: UsdValue; // string
    /**
     * 图像路径
     */
    path: UsdValue; // string
    /**
     * 图像宽度
     */
    width: UsdValue; // int
    /**
     * 图像高度
     */
    height: UsdValue; // int
    /**
     * 图像格式
     */
    format: UsdValue; // ImageFormat
    /**
     * 颜色空间
     */
    colorSpace: UsdValue; // ColorSpace
    /**
     * 像素格式
     */
    pixelFormat: UsdValue; // PixelFormat
    /**
     * 压缩格式
     */
    compressionFormat?: UsdValue; // CompressionFormat
    /**
     * 是否有透明通道
     */
    hasAlpha: UsdValue; // bool
    /**
     * 文件大小（字节）
     */
    fileSize?: UsdValue; // int
    /**
     * 创建时间
     */
    createdAt?: UsdValue; // string
    /**
     * 修改时间
     */
    modifiedAt?: UsdValue; // string
  };
  /**
   * 图像元数据（使用统一CommonMetadata）
   */
  metadata: CommonMetadata;
  /**
   * 性能配置（使用统一PerformanceConfig）
   */
  performance?: PerformanceConfig;
}

/**
 * 图像格式
 */
export enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WebP = 'webp',
  AVIF = 'avif',
  GIF = 'gif',
  BMP = 'bmp',
  TIFF = 'tiff',
  SVG = 'svg',
  ICO = 'ico',
  HEIC = 'heic',
  RAW = 'raw',
}

/**
 * 图像尺寸
 */
export interface ImageDimensions {
  /**
   * 宽度
   */
  width: number;
  /**
   * 高度
   */
  height: number;
  /**
   * 纵横比
   */
  aspectRatio?: number;
}

/**
 * 图像区域
 */
export interface ImageRegion {
  /**
   * X 坐标
   */
  x: number;
  /**
   * Y 坐标
   */
  y: number;
  /**
   * 宽度
   */
  width: number;
  /**
   * 高度
   */
  height: number;
}

/**
 * 图像点
 */
export interface ImagePoint {
  /**
   * X 坐标
   */
  x: number;
  /**
   * Y 坐标
   */
  y: number;
}

/**
 * 图像统计信息
 */
export interface ImageStats {
  /**
   * 平均颜色
   */
  averageColor: [number, number, number, number];
  /**
   * 主要颜色
   */
  dominantColors: Array<[number, number, number, number]>;
  /**
   * 亮度平均值
   */
  averageBrightness: number;
  /**
   * 对比度
   */
  contrast: number;
  /**
   * 饱和度
   */
  saturation: number;
}

/**
 * 图像色彩信息
 */
export interface ImageColorInfo {
  /**
   * 颜色空间
   */
  colorSpace: ColorSpace;
  /**
   * 颜色通道数
   */
  channels: number;
  /**
   * 位深度
   */
  bitDepth: number;
  /**
   * 是否有透明通道
   */
  hasAlpha: boolean;
  /**
   * 色彩配置文件
   */
  colorProfile?: string;
}

/**
 * 图像质量设置
 */
export interface ImageQuality {
  /**
   * 质量级别 (0-100)
   */
  level: number;
  /**
   * 压缩类型
   */
  compression: CompressionType;
  /**
   * 是否启用渐进式
   */
  progressive?: boolean;
  /**
   * 是否优化
   */
  optimized?: boolean;
}

/**
 * 压缩类型
 */
export enum CompressionType {
  /**
   * 无损压缩
   */
  Lossless = 'lossless',
  /**
   * 有损压缩
   */
  Lossy = 'lossy',
  /**
   * 自适应
   */
  Adaptive = 'adaptive',
}

/**
 * 图像缩放模式
 */
export enum ImageScaleMode {
  /**
   * 适应
   */
  Fit = 'fit',
  /**
   * 填充
   */
  Fill = 'fill',
  /**
   * 拉伸
   */
  Stretch = 'stretch',
  /**
   * 裁剪
   */
  Crop = 'crop',
  /**
   * 智能裁剪
   */
  SmartCrop = 'smart-crop',
}

/**
 * 图像排序方式
 */
export enum ImageSortBy {
  /**
   * 名称
   */
  Name = 'name',
  /**
   * 创建时间
   */
  CreatedAt = 'created-at',
  /**
   * 修改时间
   */
  ModifiedAt = 'modified-at',
  /**
   * 文件大小
   */
  FileSize = 'file-size',
  /**
   * 图像尺寸
   */
  Dimensions = 'dimensions',
  /**
   * 格式
   */
  Format = 'format',
}

/**
 * 排序顺序
 */
export enum SortOrder {
  /**
   * 升序
   */
  Ascending = 'ascending',
  /**
   * 降序
   */
  Descending = 'descending',
}
