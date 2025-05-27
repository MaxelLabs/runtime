/**
 * Maxellabs 图像规范
 * 图像处理和管理相关类型定义
 */

import type { UsdPrim, UsdValue } from '../core/usd';

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
   * 图像元数据
   */
  metadata: ImageMetadata;
  /**
   * 图像处理配置
   */
  processing?: ImageProcessing;
  /**
   * 图像变体
   */
  variants?: ImageVariant[];
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
 * 图像元数据
 */
export interface ImageMetadata {
  /**
   * EXIF 数据
   */
  exif?: ExifData;
  /**
   * IPTC 数据
   */
  iptc?: IptcData;
  /**
   * XMP 数据
   */
  xmp?: XmpData;
  /**
   * 自定义元数据
   */
  custom?: Record<string, any>;
}

/**
 * EXIF 数据
 */
export interface ExifData {
  /**
   * 相机制造商
   */
  make?: string;
  /**
   * 相机型号
   */
  model?: string;
  /**
   * 拍摄时间
   */
  dateTime?: string;
  /**
   * 曝光时间
   */
  exposureTime?: number;
  /**
   * 光圈值
   */
  fNumber?: number;
  /**
   * ISO 感光度
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
  /**
   * 白平衡
   */
  whiteBalance?: string;
  /**
   * GPS 坐标
   */
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
}

/**
 * IPTC 数据
 */
export interface IptcData {
  /**
   * 标题
   */
  title?: string;
  /**
   * 描述
   */
  description?: string;
  /**
   * 关键词
   */
  keywords?: string[];
  /**
   * 作者
   */
  author?: string;
  /**
   * 版权
   */
  copyright?: string;
  /**
   * 创建日期
   */
  dateCreated?: string;
  /**
   * 城市
   */
  city?: string;
  /**
   * 国家
   */
  country?: string;
}

/**
 * XMP 数据
 */
export interface XmpData {
  /**
   * 创建者工具
   */
  creatorTool?: string;
  /**
   * 评级
   */
  rating?: number;
  /**
   * 标签
   */
  label?: string;
  /**
   * 颜色标签
   */
  colorLabel?: string;
  /**
   * 自定义字段
   */
  custom?: Record<string, any>;
}

/**
 * 图像处理配置
 */
export interface ImageProcessing {
  /**
   * 调整配置
   */
  adjustments?: ImageAdjustments;
  /**
   * 滤镜配置
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
}

/**
 * 图像滤镜
 */
export interface ImageFilter {
  /**
   * 滤镜类型
   */
  type: FilterType;
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
 * 滤镜类型
 */
export enum FilterType {
  /**
   * 模糊
   */
  Blur = 'blur',
  /**
   * 高斯模糊
   */
  GaussianBlur = 'gaussian-blur',
  /**
   * 运动模糊
   */
  MotionBlur = 'motion-blur',
  /**
   * 锐化
   */
  Sharpen = 'sharpen',
  /**
   * 浮雕
   */
  Emboss = 'emboss',
  /**
   * 边缘检测
   */
  EdgeDetection = 'edge-detection',
  /**
   * 噪点
   */
  Noise = 'noise',
  /**
   * 去噪
   */
  Denoise = 'denoise',
  /**
   * 色彩分离
   */
  ColorSeparation = 'color-separation',
  /**
   * 黑白
   */
  Grayscale = 'grayscale',
  /**
   * 棕褐色
   */
  Sepia = 'sepia',
  /**
   * 反色
   */
  Invert = 'invert',
  /**
   * 色调分离
   */
  Posterize = 'posterize',
  /**
   * 阈值
   */
  Threshold = 'threshold',
  /**
   * 晕影
   */
  Vignette = 'vignette',
  /**
   * 色彩平衡
   */
  ColorBalance = 'color-balance',
  /**
   * 曲线
   */
  Curves = 'curves',
  /**
   * 色阶
   */
  Levels = 'levels',
}

/**
 * 图像变换
 */
export interface ImageTransform {
  /**
   * 变换类型
   */
  type: TransformType;
  /**
   * 变换参数
   */
  parameters: Record<string, any>;
  /**
   * 变换顺序
   */
  order: number;
}

/**
 * 变换类型
 */
export enum TransformType {
  /**
   * 缩放
   */
  Scale = 'scale',
  /**
   * 旋转
   */
  Rotate = 'rotate',
  /**
   * 翻转
   */
  Flip = 'flip',
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
}

/**
 * 图像优化
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
  sizeLimit?: {
    maxWidth?: number;
    maxHeight?: number;
    maxFileSize?: number;
  };
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
 * 图像变体
 */
export interface ImageVariant {
  /**
   * 变体名称
   */
  name: string;
  /**
   * 变体描述
   */
  description?: string;
  /**
   * 目标尺寸
   */
  size: {
    width: number;
    height: number;
  };
  /**
   * 缩放模式
   */
  scaleMode: ScaleMode;
  /**
   * 输出格式
   */
  format: ImageFormat;
  /**
   * 优化配置
   */
  optimization: ImageOptimization;
  /**
   * 用途标签
   */
  usage?: string[];
}

/**
 * 缩放模式
 */
export enum ScaleMode {
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
 * 图像集合
 */
export interface ImageCollection {
  /**
   * 集合名称
   */
  name: string;
  /**
   * 集合描述
   */
  description?: string;
  /**
   * 图像列表
   */
  images: string[];
  /**
   * 集合标签
   */
  tags?: string[];
  /**
   * 排序方式
   */
  sortBy?: ImageSortBy;
  /**
   * 排序顺序
   */
  sortOrder?: SortOrder;
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

/**
 * 图像缓存配置
 */
export interface ImageCache {
  /**
   * 缓存策略
   */
  strategy: CacheStrategy;
  /**
   * 缓存大小限制（MB）
   */
  maxSize: number;
  /**
   * 缓存过期时间（秒）
   */
  ttl: number;
  /**
   * 预加载配置
   */
  preload?: PreloadConfig;
}

/**
 * 缓存策略
 */
export enum CacheStrategy {
  /**
   * 无缓存
   */
  None = 'none',
  /**
   * 内存缓存
   */
  Memory = 'memory',
  /**
   * 磁盘缓存
   */
  Disk = 'disk',
  /**
   * 混合缓存
   */
  Hybrid = 'hybrid',
}

/**
 * 预加载配置
 */
export interface PreloadConfig {
  /**
   * 启用预加载
   */
  enabled: boolean;
  /**
   * 预加载数量
   */
  count: number;
  /**
   * 预加载优先级
   */
  priority: PreloadPriority;
}

/**
 * 预加载优先级
 */
export enum PreloadPriority {
  /**
   * 低
   */
  Low = 'low',
  /**
   * 中
   */
  Medium = 'medium',
  /**
   * 高
   */
  High = 'high',
  /**
   * 关键
   */
  Critical = 'critical',
}
