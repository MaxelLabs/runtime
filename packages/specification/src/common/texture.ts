/**
 * Maxellabs 通用纹理
 * 定义所有系统共通的纹理相关类型
 */

import type {
  ResourceLoadState,
  BaseAtlasRegion,
  BaseAtlasMetadata,
  Size2D,
  UVCoordinates,
  Nameable,
  RequiredEnableable,
} from '../core';
import type { CacheConfiguration } from '../package';
import type { RHITextureFormat, RHIFilterMode, RHIAddressMode, RHITextureDataType } from './rhi';

/**
 * 纹理目标
 *
 * @deprecated 请使用 RHITextureType 代替
 */
export enum TextureTarget {
  /** 2D纹理 */
  Texture2D = 'texture-2d',
  /** 立方体纹理 */
  TextureCube = 'texture-cube',
  /** 3D纹理 */
  Texture3D = 'texture-3d',
  /** 2D数组纹理 */
  Texture2DArray = 'texture-2d-array',
  /** 立方体数组纹理 */
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
 *
 * @description 组合 Nameable trait
 */
export interface CommonTextureConfig extends Nameable {
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
  dataType: RHITextureDataType;
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
  wrapS: RHIAddressMode;
  /**
   * 垂直包装模式
   */
  wrapT: RHIAddressMode;
  /**
   * 深度包装模式（3D纹理）
   */
  wrapR?: RHIAddressMode;
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
 *
 * @description 组合 RequiredEnableable trait
 */
export interface CommonTexture extends RequiredEnableable {
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
 *
 * @description 扩展 BaseAtlasRegion，添加必须的 rotated 和 trimmed 字段
 */
export interface TextureAtlasRegion extends BaseAtlasRegion {
  /** 是否旋转（覆盖为必填） */
  rotated: boolean;
  /** 是否修剪（覆盖为必填） */
  trimmed: boolean;
  /** UV坐标（覆盖为必填） */
  uv: UVCoordinates;
}

/**
 * 纹理图集元数据
 *
 * @description 扩展 BaseAtlasMetadata，添加纹理图集特有的字段
 */
export interface TextureAtlasMetadata extends BaseAtlasMetadata {
  /** 图集尺寸（覆盖为必填） */
  size: Size2D;
  /** 智能更新 */
  smartUpdate: boolean;
  /** 发布哈希 */
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
  loadingState: ResourceLoadState;
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
 * 纹理压缩配置
 *
 * @description 组合 RequiredEnableable trait
 */
export interface TextureCompressionConfig extends RequiredEnableable {
  /**
   * 压缩格式
   */
  format: RHITextureFormat;
  /**
   * 压缩质量 (0-1)
   */
  quality: number;
  /**
   * 平台特定设置
   */
  platformSettings?: Record<string, any>;
}

/**
 * 纹理缓存（扩展统一缓存配置）
 */
export interface TextureCache extends CacheConfiguration {
  /**
   * 当前使用量（MB）
   */
  currentUsage: number;
  /**
   * 缓存项
   */
  items: TextureCacheItem[];
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
