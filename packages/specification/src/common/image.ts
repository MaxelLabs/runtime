/**
 * Maxellabs 通用图像元素
 * 定义所有系统共通的图像相关类型
 */

import type { CommonElement } from './elements';
import type { ElementType } from '../core/enums';

/**
 * 图像格式
 */
export enum ImageFormat {
  /**
   * JPEG 格式
   */
  JPEG = 'jpeg',
  /**
   * PNG 格式
   */
  PNG = 'png',
  /**
   * WebP 格式
   */
  WebP = 'webp',
  /**
   * AVIF 格式
   */
  AVIF = 'avif',
  /**
   * GIF 格式
   */
  GIF = 'gif',
  /**
   * BMP 格式
   */
  BMP = 'bmp',
  /**
   * TIFF 格式
   */
  TIFF = 'tiff',
  /**
   * SVG 格式
   */
  SVG = 'svg',
}

/**
 * 图像缩放模式
 */
export enum ImageScaleMode {
  /**
   * 拉伸填充
   */
  Stretch = 'stretch',
  /**
   * 等比缩放适应
   */
  Fit = 'fit',
  /**
   * 等比缩放填充
   */
  Fill = 'fill',
  /**
   * 居中
   */
  Center = 'center',
  /**
   * 平铺
   */
  Tile = 'tile',
  /**
   * 九宫格
   */
  NineSlice = 'nine-slice',
}

/**
 * 图像变换类型
 */
export enum ImageTransform {
  /**
   * 无变换
   */
  None = 'none',
  /**
   * 水平翻转
   */
  FlipH = 'flip-h',
  /**
   * 垂直翻转
   */
  FlipV = 'flip-v',
  /**
   * 旋转90度
   */
  Rotate90 = 'rotate-90',
  /**
   * 旋转180度
   */
  Rotate180 = 'rotate-180',
  /**
   * 旋转270度
   */
  Rotate270 = 'rotate-270',
}

/**
 * 图像滤镜类型
 */
export enum ImageFilterType {
  /**
   * 模糊
   */
  Blur = 'blur',
  /**
   * 锐化
   */
  Sharpen = 'sharpen',
  /**
   * 亮度
   */
  Brightness = 'brightness',
  /**
   * 对比度
   */
  Contrast = 'contrast',
  /**
   * 饱和度
   */
  Saturation = 'saturation',
  /**
   * 色相
   */
  Hue = 'hue',
  /**
   * 灰度
   */
  Grayscale = 'grayscale',
  /**
   * 反色
   */
  Invert = 'invert',
  /**
   * 棕褐色
   */
  Sepia = 'sepia',
  /**
   * 噪点
   */
  Noise = 'noise',
}

/**
 * 图像滤镜
 */
export interface ImageFilter {
  /**
   * 滤镜类型
   */
  type: ImageFilterType;
  /**
   * 滤镜强度 (0-1)
   */
  intensity: number;
  /**
   * 滤镜参数
   */
  parameters?: Record<string, any>;
  /**
   * 是否启用
   */
  enabled: boolean;
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
   * 伽马值
   */
  gamma?: number;
  /**
   * 曝光
   */
  exposure?: number;
  /**
   * 阴影
   */
  shadows?: number;
  /**
   * 高光
   */
  highlights?: number;
}

/**
 * 图像裁剪信息
 */
export interface ImageCrop {
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
   * 上边距
   */
  top: number;
  /**
   * 下边距
   */
  bottom: number;
  /**
   * 是否填充中心
   */
  fillCenter: boolean;
}

/**
 * 图像元数据
 */
export interface ImageMetadata {
  /**
   * 图像宽度
   */
  width: number;
  /**
   * 图像高度
   */
  height: number;
  /**
   * 文件大小（字节）
   */
  fileSize: number;
  /**
   * MIME类型
   */
  mimeType: string;
  /**
   * 色彩深度
   */
  colorDepth?: number;
  /**
   * 是否有透明通道
   */
  hasAlpha?: boolean;
  /**
   * DPI
   */
  dpi?: number;
  /**
   * EXIF 数据
   */
  exif?: Record<string, any>;
}

/**
 * 通用图像元素
 */
export interface CommonImageElement extends CommonElement {
  type: ElementType.Image;
  /**
   * 图像源路径
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
   * 图像变换（重命名避免与 CommonElement.transform 冲突）
   */
  imageTransform?: ImageTransform;
  /**
   * 图像滤镜
   */
  filters?: ImageFilter[];
  /**
   * 图像调整
   */
  adjustment?: ImageAdjustment;
  /**
   * 裁剪信息
   */
  crop?: ImageCrop;
  /**
   * 九宫格配置
   */
  nineSlice?: NineSliceConfig;
  /**
   * 预加载
   */
  preload?: boolean;
  /**
   * 缓存策略
   */
  cacheStrategy?: 'auto' | 'force-cache' | 'no-cache';
  /**
   * 图像元数据（重命名避免与 CommonElement.metadata 冲突）
   */
  imageMetadata?: ImageMetadata;
  /**
   * 错误回退图像
   */
  fallbackImage?: string;
  /**
   * 加载占位符
   */
  placeholder?: string;
  /**
   * 懒加载
   */
  lazyLoad?: boolean;
  /**
   * 响应式图像源
   */
  responsiveSources?: ResponsiveImageSource[];
}

/**
 * 响应式图像源
 */
export interface ResponsiveImageSource {
  /**
   * 图像源
   */
  source: string;
  /**
   * 最小宽度
   */
  minWidth?: number;
  /**
   * 最大宽度
   */
  maxWidth?: number;
  /**
   * 设备像素比
   */
  devicePixelRatio?: number;
  /**
   * 媒体查询
   */
  mediaQuery?: string;
}

/**
 * 图像加载状态
 */
export enum ImageLoadState {
  /**
   * 未开始
   */
  Idle = 'idle',
  /**
   * 加载中
   */
  Loading = 'loading',
  /**
   * 加载成功
   */
  Loaded = 'loaded',
  /**
   * 加载失败
   */
  Error = 'error',
}

/**
 * 图像加载事件
 */
export interface ImageLoadEvent {
  /**
   * 事件类型
   */
  type: 'load' | 'error' | 'progress';
  /**
   * 图像元素
   */
  target: CommonImageElement;
  /**
   * 加载进度 (0-1)
   */
  progress?: number;
  /**
   * 错误信息
   */
  error?: string;
  /**
   * 时间戳
   */
  timestamp: number;
}
