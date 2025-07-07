/**
 * Maxellabs 通用纹理
 * 定义所有系统共通的纹理相关类型
 */

/**
 * 纹理格式
 */
export enum RHITextureFormat {
  // 8位格式
  R8_UNORM = 0,
  R8_SNORM = 1,
  R8_UINT = 2,
  R8_SINT = 3,

  // 16位格式
  R16_UINT = 4,
  R16_SINT = 5,
  R16_FLOAT = 6,
  RG8_UNORM = 7,
  RG8_SNORM = 8,
  RG8_UINT = 9,
  RG8_SINT = 10,

  // 32位格式
  R32_UINT = 11,
  R32_SINT = 12,
  R32_FLOAT = 13,
  RG16_UINT = 14,
  RG16_SINT = 15,
  RG16_FLOAT = 16,
  RGBA8_UNORM = 17,
  RGBA8_UNORM_SRGB = 18,
  RGBA8_SNORM = 19,
  RGBA8_UINT = 20,
  RGBA8_SINT = 21,
  BGRA8_UNORM = 22,
  BGRA8_UNORM_SRGB = 23,

  // 64位格式
  RG32_UINT = 24,
  RG32_SINT = 25,
  RG32_FLOAT = 26,
  RGBA16_UINT = 27,
  RGBA16_SINT = 28,
  RGBA16_FLOAT = 29,

  // 128位格式
  RGBA32_UINT = 30,
  RGBA32_SINT = 31,
  RGBA32_FLOAT = 32,

  // 深度/模板格式
  DEPTH16_UNORM = 33,
  DEPTH24_UNORM = 34,
  DEPTH32_FLOAT = 35,
  DEPTH24_UNORM_STENCIL8 = 36,
  DEPTH32_FLOAT_STENCIL8 = 37,

  // 压缩纹理格式
  BC1_RGBA_UNORM = 38,
  BC1_RGBA_UNORM_SRGB = 39,
  BC2_RGBA_UNORM = 40,
  BC2_RGBA_UNORM_SRGB = 41,
  BC3_RGBA_UNORM = 42,
  BC3_RGBA_UNORM_SRGB = 43,
  BC4_R_UNORM = 44,
  BC4_R_SNORM = 45,
  BC5_RG_UNORM = 46,
  BC5_RG_SNORM = 47,
  BC6H_RGB_UFLOAT = 48,
  BC6H_RGB_SFLOAT = 49,
  BC7_RGBA_UNORM = 50,
  BC7_RGBA_UNORM_SRGB = 51,

  // ASTC压缩格式
  ASTC_4x4_UNORM = 52,
  ASTC_4x4_UNORM_SRGB = 53,
  ASTC_5x5_UNORM = 54,
  ASTC_5x5_UNORM_SRGB = 55,
  ASTC_6x6_UNORM = 56,
  ASTC_6x6_UNORM_SRGB = 57,
  ASTC_8x8_UNORM = 58,
  ASTC_8x8_UNORM_SRGB = 59,
  ASTC_10x10_UNORM = 60,
  ASTC_10x10_UNORM_SRGB = 61,
  ASTC_12x12_UNORM = 62,
  ASTC_12x12_UNORM_SRGB = 63,

  // ETC2/EAC压缩格式
  ETC2_RGB8_UNORM = 64,
  ETC2_RGB8_UNORM_SRGB = 65,
  ETC2_RGB8A1_UNORM = 66,
  ETC2_RGB8A1_UNORM_SRGB = 67,
  ETC2_RGBA8_UNORM = 68,
  ETC2_RGBA8_UNORM_SRGB = 69,
  EAC_R11_UNORM = 70,
  EAC_R11_SNORM = 71,
  EAC_RG11_UNORM = 72,
  EAC_RG11_SNORM = 73,
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
 * RHI后端类型
 */
export enum RHIBackend {
  /** 未知或不支持的后端 */
  UNKNOWN = 0,
  /** WebGL 1.0 */
  WebGL = 1,
  /** WebGL 2.0 */
  WebGL2 = 2,
  /** WebGPU */
  WebGPU = 3,
}

/**
 * 缓冲区用途标志
 * 这些标志值可以按位组合
 */
export enum RHIBufferUsage {
  /** 用作顶点缓冲区 */
  VERTEX = 0x1,
  /** 用作索引缓冲区 */
  INDEX = 0x2,
  /** 用作统一缓冲区 */
  UNIFORM = 0x4,
  /** 用作存储缓冲区 */
  STORAGE = 0x8,
  /** 用作间接命令缓冲区 */
  INDIRECT = 0x10,
  /** 缓冲区可以被映射以供CPU读取 */
  MAP_READ = 0x20,
  /** 缓冲区可以被映射以供CPU写入 */
  MAP_WRITE = 0x40,
  /** 缓冲区可以作为复制操作的源 */
  COPY_SRC = 0x80,
  /** 缓冲区可以作为复制操作的目标 */
  COPY_DST = 0x100,
}

/**
 * 纹理用途标志
 * 这些标志值可以按位组合
 */
export enum RHITextureUsage {
  /** 纹理可以被采样 */
  SAMPLED = 0x1,
  /** 纹理可以作为存储纹理使用 */
  STORAGE = 0x2,
  /** 纹理可以作为渲染目标使用 */
  RENDER_TARGET = 0x4,
  /** 纹理可以作为复制操作的源 */
  COPY_SRC = 0x8,
  /** 纹理可以作为复制操作的目标 */
  COPY_DST = 0x10,
}

/**
 * 纹理维度
 */
export enum RHITextureDimension {
  /** 1D纹理 */
  TEX_1D = 0,
  /** 2D纹理 */
  TEX_2D = 1,
  /** 3D纹理 */
  TEX_3D = 2,
  /** 立方体贴图 */
  TEX_CUBE = 3,
  /** 2D纹理数组 */
  TEX_2D_ARRAY = 4,
  /** 立方体贴图数组 */
  TEX_CUBE_ARRAY = 5,
}

/**
 * 寻址模式
 */
export enum RHIAddressMode {
  /** 重复纹理 */
  REPEAT = 0,
  /** 镜像重复纹理 */
  MIRROR_REPEAT = 1,
  /** 纹理坐标范围外使用边缘像素 */
  CLAMP_TO_EDGE = 2,
  /** 纹理坐标范围外设置为0 */
  CLAMP_TO_ZERO = 3,
  /** 纹理坐标范围外设置为边框颜色 */
  CLAMP_TO_BORDER = 4,
}

/**
 * 过滤模式
 */
export enum RHIFilterMode {
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
 * 着色器阶段标志
 * 这些标志值可以按位组合
 */
export enum RHIShaderStage {
  /** 顶点着色器 */
  VERTEX = 0x1,
  /** 片段着色器 */
  FRAGMENT = 0x2,
  /** 计算着色器 */
  COMPUTE = 0x4,
  /** 几何着色器(仅限WebGL) */
  GEOMETRY = 0x8,
  /** 曲面细分控制着色器 */
  TESS_CONTROL = 0x10,
  /** 曲面细分评估着色器 */
  TESS_EVALUATION = 0x20,
  /** 网格着色器 */
  MESH = 0x40,
  /** 任务着色器 */
  TASK = 0x80,
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
  format: RHITextureFormat;
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
  minFilter: RHIFilterMode;
  /**
   * 最大过滤模式
   */
  magFilter: RHIFilterMode;
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
  format: RHITextureFormat;
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
