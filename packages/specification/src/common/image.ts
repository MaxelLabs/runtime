/**
 * Maxellabs 通用图像元素
 * 定义所有系统共通的图像相关类型
 */

import type { CommonElement, CommonElementType } from './elements';
import type { Color, CommonMetadata, ImageFilter } from '../core';

/**
 * 图像缩放模式
 */
export enum ImageScaleMode {
  /**
   * 填充
   */
  Fill = 'fill',
  /**
   * 适应
   */
  Fit = 'fit',
  /**
   * 裁剪
   */
  Crop = 'crop',
  /**
   * 平铺
   */
  Tile = 'tile',
  /**
   * 拉伸
   */
  Stretch = 'stretch',
  /**
   * 原始大小
   */
  None = 'none',
}

/**
 * 图像格式
 */
export enum ImageFormat {
  /**
   * JPEG格式
   */
  JPEG = 'jpeg',
  /**
   * PNG格式
   */
  PNG = 'png',
  /**
   * WebP格式
   */
  WebP = 'webp',
  /**
   * SVG格式
   */
  SVG = 'svg',
  /**
   * GIF格式
   */
  GIF = 'gif',
  /**
   * BMP格式
   */
  BMP = 'bmp',
  /**
   * TIFF格式
   */
  TIFF = 'tiff',
  /**
   * AVIF格式
   */
  AVIF = 'avif',
}

/**
 * 图像调整
 */
export interface ImageAdjustment {
  /**
   * 亮度 (-1 到 1)
   */
  brightness?: number;
  /**
   * 对比度 (-1 到 1)
   */
  contrast?: number;
  /**
   * 饱和度 (-1 到 1)
   */
  saturation?: number;
  /**
   * 色相 (-180 到 180)
   */
  hue?: number;
  /**
   * 曝光 (-2 到 2)
   */
  exposure?: number;
  /**
   * 伽马值 (0.1 到 3)
   */
  gamma?: number;
  /**
   * 高光 (-1 到 1)
   */
  highlights?: number;
  /**
   * 阴影 (-1 到 1)
   */
  shadows?: number;
  /**
   * 白平衡
   */
  whiteBalance?: number;
  /**
   * 色温 (-100 到 100)
   */
  temperature?: number;
  /**
   * 色调 (-100 到 100)
   */
  tint?: number;
}

/**
 * 图像裁剪区域
 */
export interface ImageCropRegion {
  /**
   * X坐标 (0-1)
   */
  x: number;
  /**
   * Y坐标 (0-1)
   */
  y: number;
  /**
   * 宽度 (0-1)
   */
  width: number;
  /**
   * 高度 (0-1)
   */
  height: number;
}

/**
 * 图像变换
 */
export interface ImageTransform {
  /**
   * 水平翻转
   */
  flipX?: boolean;
  /**
   * 垂直翻转
   */
  flipY?: boolean;
  /**
   * 旋转角度
   */
  rotation?: number;
  /**
   * 裁剪区域
   */
  cropRegion?: ImageCropRegion;
}

/**
 * 通用图像元素
 */
export interface CommonImageElement extends Omit<CommonElement, 'metadata'> {
  type: CommonElementType.Image;
  /**
   * 图像源
   */
  source: string;
  /**
   * 缩放模式
   */
  scaleMode: ImageScaleMode;
  /**
   * 图像格式
   */
  format?: ImageFormat;
  /**
   * 图像滤镜
   */
  filters?: ImageFilter[];
  /**
   * 图像调整
   */
  adjustment?: ImageAdjustment;
  /**
   * 图像变换
   */
  imageTransform?: ImageTransform;
  /**
   * 色调颜色
   */
  tintColor?: Color;
  /**
   * 是否保持宽高比
   */
  preserveAspectRatio?: boolean;
  /**
   * 图像质量 (0-1)
   */
  quality?: number;
  /**
   * 是否启用压缩
   */
  enableCompression?: boolean;
  /**
   * 懒加载
   */
  lazyLoad?: boolean;
  /**
   * 占位符图像
   */
  placeholder?: string;
  /**
   * 错误时显示的图像
   */
  fallback?: string;
  /**
   * 图像元数据
   */
  imageMetadata?: ImageElementMetadata;
  /**
   * 通用元数据
   */
  metadata?: CommonMetadata;
}

/**
 * 图像元数据
 */
export interface ImageElementMetadata {
  /**
   * 原始宽度
   */
  originalWidth: number;
  /**
   * 原始高度
   */
  originalHeight: number;
  /**
   * 文件大小（字节）
   */
  fileSize: number;
  /**
   * MIME类型
   */
  mimeType: string;
  /**
   * 创建时间
   */
  createdAt?: string;
  /**
   * 修改时间
   */
  modifiedAt?: string;
  /**
   * 拍摄时间
   */
  takenAt?: string;
  /**
   * 相机信息
   */
  camera?: CameraInfo;
  /**
   * GPS信息
   */
  gps?: GpsInfo;
  /**
   * 颜色配置文件
   */
  colorProfile?: string;
  /**
   * DPI
   */
  dpi?: number;
}

/**
 * 相机信息
 */
export interface CameraInfo {
  /**
   * 相机制造商
   */
  make?: string;
  /**
   * 相机型号
   */
  model?: string;
  /**
   * 镜头型号
   */
  lens?: string;
  /**
   * 光圈值
   */
  aperture?: number;
  /**
   * 快门速度
   */
  shutterSpeed?: string;
  /**
   * ISO感光度
   */
  iso?: number;
  /**
   * 焦距
   */
  focalLength?: number;
  /**
   * 闪光灯
   */
  flash?: boolean;
}

/**
 * GPS信息
 */
export interface GpsInfo {
  /**
   * 纬度
   */
  latitude?: number;
  /**
   * 经度
   */
  longitude?: number;
  /**
   * 海拔
   */
  altitude?: number;
  /**
   * 方向
   */
  direction?: number;
}

/**
 * 九宫格图像元素
 */
export interface NineSliceImageElement extends CommonImageElement {
  /**
   * 九宫格配置
   */
  nineSlice: NineSliceConfig;
}

/**
 * 九宫格配置
 */
export interface NineSliceConfig {
  /**
   * 左边距
   */
  left: number;
  /**
   * 右边距
   */
  right: number;
  /**
   * 顶部边距
   */
  top: number;
  /**
   * 底部边距
   */
  bottom: number;
  /**
   * 目标尺寸
   */
  targetSize?: {
    width: number;
    height: number;
  };
  /**
   * 是否填充中心
   */
  fillCenter?: boolean;
}

// 重新导出core中的类型以保持兼容性
export type { ImageFilter } from '../core';
