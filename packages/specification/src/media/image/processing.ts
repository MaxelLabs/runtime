/**
 * Maxellabs 图像处理规范
 * 图像处理和变换相关类型定义
 */

import type { ImageFilter } from '../../core/interfaces';
import type { ImageDimensions, ImageRegion, ImageScaleMode } from './base';

/**
 * 图像处理配置
 */
export interface ImageProcessing {
  /**
   * 调整配置
   */
  adjustments?: ImageAdjustments;
  /**
   * 滤镜配置（使用统一ImageFilter）
   */
  filters?: ImageFilter[];
  /**
   * 变换配置
   */
  transforms?: ImageTransform[];
  /**
   * 优化配置
   */
  optimization?: ImageOptimization;
  /**
   * 批处理设置
   */
  batch?: BatchProcessingSettings;
}

/**
 * 图像调整
 */
export interface ImageAdjustments {
  /**
   * 亮度 (-100 到 100)
   */
  brightness?: number;
  /**
   * 对比度 (-100 到 100)
   */
  contrast?: number;
  /**
   * 饱和度 (-100 到 100)
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
   * 高光 (-100 到 100)
   */
  highlights?: number;
  /**
   * 阴影 (-100 到 100)
   */
  shadows?: number;
  /**
   * 白色 (-100 到 100)
   */
  whites?: number;
  /**
   * 黑色 (-100 到 100)
   */
  blacks?: number;
  /**
   * 清晰度 (-100 到 100)
   */
  clarity?: number;
  /**
   * 自然饱和度 (-100 到 100)
   */
  vibrance?: number;
  /**
   * 温度 (-100 到 100)
   */
  temperature?: number;
  /**
   * 色调 (-100 到 100)
   */
  tint?: number;
  /**
   * 噪点降低 (0 到 100)
   */
  noiseReduction?: number;
  /**
   * 色彩降噪 (0 到 100)
   */
  colorNoiseReduction?: number;
}

/**
 * 图像变换
 */
export interface ImageTransform {
  /**
   * 变换类型
   */
  type: ImageTransformType;
  /**
   * 变换参数
   */
  parameters: Record<string, any>;
  /**
   * 变换顺序
   */
  order: number;
  /**
   * 是否启用
   */
  enabled: boolean;
}

/**
 * 图像变换类型
 */
export enum ImageTransformType {
  /**
   * 缩放
   */
  Scale = 'scale',
  /**
   * 旋转
   */
  Rotate = 'rotate',
  /**
   * 翻转水平
   */
  FlipHorizontal = 'flip-horizontal',
  /**
   * 翻转垂直
   */
  FlipVertical = 'flip-vertical',
  /**
   * 裁剪
   */
  Crop = 'crop',
  /**
   * 透视
   */
  Perspective = 'perspective',
  /**
   * 扭曲
   */
  Distort = 'distort',
  /**
   * 平移
   */
  Translate = 'translate',
  /**
   * 倾斜
   */
  Skew = 'skew',
  /**
   * 自由变换
   */
  FreeTransform = 'free-transform',
}

/**
 * 缩放变换参数
 */
export interface ScaleTransformParams {
  /**
   * 目标尺寸
   */
  targetSize: ImageDimensions;
  /**
   * 缩放模式
   */
  scaleMode: ImageScaleMode;
  /**
   * 重采样算法
   */
  resamplingAlgorithm: ResamplingAlgorithm;
  /**
   * 保持纵横比
   */
  maintainAspectRatio: boolean;
}

/**
 * 旋转变换参数
 */
export interface RotateTransformParams {
  /**
   * 旋转角度（度）
   */
  angle: number;
  /**
   * 旋转中心点
   */
  center?: [number, number];
  /**
   * 背景填充色
   */
  backgroundColor?: [number, number, number, number];
  /**
   * 自动裁剪
   */
  autoCrop?: boolean;
}

/**
 * 裁剪变换参数
 */
export interface CropTransformParams {
  /**
   * 裁剪区域
   */
  region: ImageRegion;
  /**
   * 裁剪模式
   */
  mode: CropMode;
  /**
   * 智能裁剪选项
   */
  smartCropOptions?: SmartCropOptions;
}

/**
 * 裁剪模式
 */
export enum CropMode {
  /**
   * 精确裁剪
   */
  Exact = 'exact',
  /**
   * 比例裁剪
   */
  AspectRatio = 'aspect-ratio',
  /**
   * 智能裁剪
   */
  Smart = 'smart',
  /**
   * 人脸检测裁剪
   */
  FaceDetection = 'face-detection',
}

/**
 * 智能裁剪选项
 */
export interface SmartCropOptions {
  /**
   * 检测主体
   */
  detectSubject: boolean;
  /**
   * 保留重要区域
   */
  preserveImportantAreas: boolean;
  /**
   * 人脸优先
   */
  facePriority: boolean;
  /**
   * 边缘检测
   */
  edgeDetection: boolean;
}

/**
 * 重采样算法
 */
export enum ResamplingAlgorithm {
  /**
   * 最近邻
   */
  NearestNeighbor = 'nearest-neighbor',
  /**
   * 双线性
   */
  Bilinear = 'bilinear',
  /**
   * 双三次
   */
  Bicubic = 'bicubic',
  /**
   * Lanczos
   */
  Lanczos = 'lanczos',
  /**
   * 高质量双三次
   */
  BicubicSharper = 'bicubic-sharper',
  /**
   * 自动选择
   */
  Auto = 'auto',
}

/**
 * 图像优化配置
 */
export interface ImageOptimization {
  /**
   * 质量 (0-100)
   */
  quality?: number;
  /**
   * 压缩类型
   */
  compression?: CompressionType;
  /**
   * 渐进式加载
   */
  progressive?: boolean;
  /**
   * 去除元数据
   */
  stripMetadata?: boolean;
  /**
   * 颜色量化
   */
  quantization?: ColorQuantization;
  /**
   * 尺寸限制
   */
  sizeLimit?: SizeLimit;
  /**
   * 文件大小限制
   */
  fileSizeLimit?: number;
  /**
   * 自动优化
   */
  autoOptimize?: boolean;
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
 * 颜色量化
 */
export interface ColorQuantization {
  /**
   * 颜色数量
   */
  colors: number;
  /**
   * 抖动
   */
  dithering: boolean;
  /**
   * 量化算法
   */
  algorithm: QuantizationAlgorithm;
  /**
   * 透明度处理
   */
  alphaHandling: AlphaHandling;
}

/**
 * 量化算法
 */
export enum QuantizationAlgorithm {
  /**
   * 中位切分
   */
  MedianCut = 'median-cut',
  /**
   * 八叉树
   */
  Octree = 'octree',
  /**
   * K-means
   */
  KMeans = 'k-means',
  /**
   * 神经网络
   */
  NeuralNetwork = 'neural-network',
}

/**
 * 透明度处理
 */
export enum AlphaHandling {
  /**
   * 保持
   */
  Preserve = 'preserve',
  /**
   * 移除
   */
  Remove = 'remove',
  /**
   * 背景混合
   */
  BlendBackground = 'blend-background',
}

/**
 * 尺寸限制
 */
export interface SizeLimit {
  /**
   * 最大宽度
   */
  maxWidth?: number;
  /**
   * 最大高度
   */
  maxHeight?: number;
  /**
   * 最小宽度
   */
  minWidth?: number;
  /**
   * 最小高度
   */
  minHeight?: number;
}

/**
 * 批处理设置
 */
export interface BatchProcessingSettings {
  /**
   * 并发数量
   */
  concurrency: number;
  /**
   * 进度回调
   */
  progressCallback?: (progress: number) => void;
  /**
   * 错误处理
   */
  errorHandling: ErrorHandling;
  /**
   * 输出设置
   */
  output: BatchOutputSettings;
}

/**
 * 错误处理模式
 */
export enum ErrorHandling {
  /**
   * 停止处理
   */
  Stop = 'stop',
  /**
   * 跳过错误
   */
  Skip = 'skip',
  /**
   * 继续处理
   */
  Continue = 'continue',
}

/**
 * 批处理输出设置
 */
export interface BatchOutputSettings {
  /**
   * 输出目录
   */
  directory: string;
  /**
   * 文件名模式
   */
  filenamePattern: string;
  /**
   * 是否覆盖现有文件
   */
  overwrite: boolean;
  /**
   * 创建子目录
   */
  createSubdirectories: boolean;
}
