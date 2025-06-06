/**
 * Maxellabs 通用纹理
 * 定义所有系统共通的纹理相关类型
 */

/**
 * 纹理格式
 */
export enum TextureFormat {
  /**
   * RGB格式
   */
  RGB = 'rgb',
  /**
   * RGBA格式
   */
  RGBA = 'rgba',
  /**
   * 灰度格式
   */
  Grayscale = 'grayscale',
  /**
   * 灰度+Alpha格式
   */
  GrayscaleAlpha = 'grayscale-alpha',
  /**
   * 深度格式
   */
  Depth = 'depth',
  /**
   * 深度+模板格式
   */
  DepthStencil = 'depth-stencil',
  /**
   * 压缩DXT1格式
   */
  DXT1 = 'dxt1',
  /**
   * 压缩DXT3格式
   */
  DXT3 = 'dxt3',
  /**
   * 压缩DXT5格式
   */
  DXT5 = 'dxt5',
  /**
   * 压缩ETC1格式
   */
  ETC1 = 'etc1',
  /**
   * 压缩ETC2格式
   */
  ETC2 = 'etc2',
  /**
   * 压缩ASTC格式
   */
  ASTC = 'astc',
  /**
   * 压缩PVRTC格式
   */
  PVRTC = 'pvrtc',
}

/**
 * 纹理数据类型
 */
export enum TextureDataType {
  /**
   * 无符号字节
   */
  UnsignedByte = 'unsigned-byte',
  /**
   * 字节
   */
  Byte = 'byte',
  /**
   * 无符号短整型
   */
  UnsignedShort = 'unsigned-short',
  /**
   * 短整型
   */
  Short = 'short',
  /**
   * 无符号整型
   */
  UnsignedInt = 'unsigned-int',
  /**
   * 整型
   */
  Int = 'int',
  /**
   * 半精度浮点
   */
  HalfFloat = 'half-float',
  /**
   * 单精度浮点
   */
  Float = 'float',
}

/**
 * 纹理目标
 */
export enum TextureTarget {
  /**
   * 2D纹理
   */
  Texture2D = 'texture-2d',
  /**
   * 立方体纹理
   */
  TextureCube = 'texture-cube',
  /**
   * 3D纹理
   */
  Texture3D = 'texture-3d',
  /**
   * 2D数组纹理
   */
  Texture2DArray = 'texture-2d-array',
  /**
   * 立方体数组纹理
   */
  TextureCubeArray = 'texture-cube-array',
}

/**
 * 纹理使用类型
 */
export enum TextureUsage {
  /**
   * 静态纹理
   */
  Static = 'static',
  /**
   * 动态纹理
   */
  Dynamic = 'dynamic',
  /**
   * 流式纹理
   */
  Stream = 'stream',
  /**
   * 渲染目标
   */
  RenderTarget = 'render-target',
}

/**
 * 通用纹理配置
 */
export interface CommonTextureConfig {
  /**
   * 纹理名称
   */
  name: string;
  /**
   * 纹理宽度
   */
  width: number;
  /**
   * 纹理高度
   */
  height: number;
  /**
   * 纹理深度（3D纹理）
   */
  depth?: number;
  /**
   * 纹理格式
   */
  format: TextureFormat;
  /**
   * 数据类型
   */
  dataType: TextureDataType;
  /**
   * 纹理目标
   */
  target: TextureTarget;
  /**
   * 使用类型
   */
  usage: TextureUsage;
  /**
   * 是否生成Mipmap
   */
  generateMipmaps: boolean;
  /**
   * Mipmap级别数
   */
  mipmapLevels?: number;
  /**
   * 最小过滤模式
   */
  minFilter: TextureFilterMode;
  /**
   * 最大过滤模式
   */
  magFilter: TextureFilterMode;
  /**
   * 水平包装模式
   */
  wrapS: TextureWrapMode;
  /**
   * 垂直包装模式
   */
  wrapT: TextureWrapMode;
  /**
   * 深度包装模式（3D纹理）
   */
  wrapR?: TextureWrapMode;
  /**
   * 各向异性过滤级别
   */
  anisotropy: number;
  /**
   * 是否翻转Y轴
   */
  flipY: boolean;
  /**
   * 是否预乘Alpha
   */
  premultiplyAlpha: boolean;
  /**
   * 颜色空间
   */
  colorSpace: string;
}

/**
 * 纹理过滤模式
 */
export enum TextureFilterMode {
  /**
   * 最近邻
   */
  Nearest = 'nearest',
  /**
   * 线性
   */
  Linear = 'linear',
  /**
   * 最近邻Mipmap最近邻
   */
  NearestMipmapNearest = 'nearest-mipmap-nearest',
  /**
   * 线性Mipmap最近邻
   */
  LinearMipmapNearest = 'linear-mipmap-nearest',
  /**
   * 最近邻Mipmap线性
   */
  NearestMipmapLinear = 'nearest-mipmap-linear',
  /**
   * 线性Mipmap线性
   */
  LinearMipmapLinear = 'linear-mipmap-linear',
}

/**
 * 纹理包装模式
 */
export enum TextureWrapMode {
  /**
   * 重复
   */
  Repeat = 'repeat',
  /**
   * 夹紧到边缘
   */
  ClampToEdge = 'clamp-to-edge',
  /**
   * 夹紧到边界
   */
  ClampToBorder = 'clamp-to-border',
  /**
   * 镜像重复
   */
  MirroredRepeat = 'mirrored-repeat',
}

/**
 * 纹理数据
 */
export interface TextureData {
  /**
   * 像素数据
   */
  pixels: ArrayBufferView | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
  /**
   * 数据级别（Mipmap级别）
   */
  level: number;
  /**
   * X偏移
   */
  xOffset?: number;
  /**
   * Y偏移
   */
  yOffset?: number;
  /**
   * Z偏移（3D纹理）
   */
  zOffset?: number;
  /**
   * 宽度
   */
  width?: number;
  /**
   * 高度
   */
  height?: number;
  /**
   * 深度（3D纹理）
   */
  depth?: number;
}

/**
 * 通用纹理
 */
export interface CommonTexture {
  /**
   * 纹理ID
   */
  id: string;
  /**
   * 纹理配置
   */
  config: CommonTextureConfig;
  /**
   * 纹理数据
   */
  data?: TextureData[];
  /**
   * 是否已上传到GPU
   */
  uploaded: boolean;
  /**
   * 是否需要更新
   */
  needsUpdate: boolean;
  /**
   * 纹理版本
   */
  version: number;
  /**
   * 内存使用量（字节）
   */
  memoryUsage: number;
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 纹理标签
   */
  tags?: string[];
}

/**
 * 纹理图集
 */
export interface TextureAtlas {
  /**
   * 图集ID
   */
  id: string;
  /**
   * 图集纹理
   */
  texture: CommonTexture;
  /**
   * 图集区域
   */
  regions: TextureAtlasRegion[];
  /**
   * 图集元数据
   */
  metadata: TextureAtlasMetadata;
}

/**
 * 纹理图集区域
 */
export interface TextureAtlasRegion {
  /**
   * 区域名称
   */
  name: string;
  /**
   * X坐标
   */
  x: number;
  /**
   * Y坐标
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
  /**
   * 是否旋转
   */
  rotated: boolean;
  /**
   * 是否修剪
   */
  trimmed: boolean;
  /**
   * 原始尺寸
   */
  originalSize?: {
    width: number;
    height: number;
  };
  /**
   * 修剪偏移
   */
  trimOffset?: {
    x: number;
    y: number;
  };
  /**
   * UV坐标
   */
  uv: {
    u: number;
    v: number;
    u2: number;
    v2: number;
  };
}

/**
 * 纹理图集元数据
 */
export interface TextureAtlasMetadata {
  /**
   * 应用程序
   */
  app: string;
  /**
   * 版本
   */
  version: string;
  /**
   * 图像格式
   */
  format: string;
  /**
   * 图集尺寸
   */
  size: {
    width: number;
    height: number;
  };
  /**
   * 缩放比例
   */
  scale: number;
  /**
   * 智能更新
   */
  smartUpdate: boolean;
  /**
   * 发布哈希
   */
  publishHash?: string;
}

/**
 * 纹理流
 */
export interface TextureStream {
  /**
   * 流ID
   */
  id: string;
  /**
   * 源纹理
   */
  sourceTexture: CommonTexture;
  /**
   * 流配置
   */
  config: TextureStreamConfig;
  /**
   * 当前级别
   */
  currentLevel: number;
  /**
   * 加载状态
   */
  loadingState: TextureLoadingState;
  /**
   * 优先级
   */
  priority: number;
}

/**
 * 纹理流配置
 */
export interface TextureStreamConfig {
  /**
   * 最大级别
   */
  maxLevel: number;
  /**
   * 最小级别
   */
  minLevel: number;
  /**
   * 流策略
   */
  strategy: TextureStreamStrategy;
  /**
   * 距离阈值
   */
  distanceThresholds: number[];
  /**
   * 内存预算（MB）
   */
  memoryBudget: number;
  /**
   * 是否启用压缩
   */
  enableCompression: boolean;
}

/**
 * 纹理流策略
 */
export enum TextureStreamStrategy {
  /**
   * 距离基础
   */
  DistanceBased = 'distance-based',
  /**
   * 屏幕尺寸基础
   */
  ScreenSizeBased = 'screen-size-based',
  /**
   * 重要性基础
   */
  ImportanceBased = 'importance-based',
  /**
   * 混合策略
   */
  Hybrid = 'hybrid',
}

/**
 * 纹理加载状态
 */
export enum TextureLoadingState {
  /**
   * 未加载
   */
  NotLoaded = 'not-loaded',
  /**
   * 加载中
   */
  Loading = 'loading',
  /**
   * 已加载
   */
  Loaded = 'loaded',
  /**
   * 加载失败
   */
  Failed = 'failed',
  /**
   * 已卸载
   */
  Unloaded = 'unloaded',
}

/**
 * 纹理压缩配置
 */
export interface TextureCompressionConfig {
  /**
   * 压缩格式
   */
  format: TextureFormat;
  /**
   * 压缩质量 (0-1)
   */
  quality: number;
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 平台特定设置
   */
  platformSettings?: Record<string, any>;
}

/**
 * 纹理缓存
 */
export interface TextureCache {
  /**
   * 缓存大小（MB）
   */
  maxSize: number;
  /**
   * 当前使用量（MB）
   */
  currentUsage: number;
  /**
   * 缓存策略
   */
  strategy: 'lru' | 'lfu' | 'fifo';
  /**
   * 缓存项
   */
  items: TextureCacheItem[];
  /**
   * 是否启用
   */
  enabled: boolean;
}

/**
 * 纹理缓存项
 */
export interface TextureCacheItem {
  /**
   * 纹理ID
   */
  textureId: string;
  /**
   * 内存使用量（字节）
   */
  memoryUsage: number;
  /**
   * 最后访问时间
   */
  lastAccessTime: number;
  /**
   * 访问次数
   */
  accessCount: number;
  /**
   * 优先级
   */
  priority: number;
}
