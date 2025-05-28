/**
 * Maxellabs 基础类型定义
 * 所有模块共用的基础数据类型、枚举和常量
 */

import type { ColorSpace } from './enums';
import type { UsdValue } from './usd';

/**
 * 资产类型
 */
export enum AssetType {
  Design = 'design',
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
  Font = 'font',
  Icon = 'icon',
  Component = 'component',
  Code = 'code',
  Documentation = 'documentation',
  Configuration = 'configuration',
}
/**
 * 基础数据类型
 */
export type UUID = string;
export type Path = string;
export type URL = string;

/**
 * 压缩算法
 */
export enum CompressionAlgorithm {
  /**
   * Gzip
   */
  Gzip = 'gzip',
  /**
   * Brotli
   */
  Brotli = 'brotli',
  /**
   * LZ4
   */
  LZ4 = 'lz4',
  /**
   * Zstandard
   */
  Zstd = 'zstd',
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
  /**
   * 智能缓存
   */
  Smart = 'smart',
}

/**
 * 共享设置
 */
export interface SharingSettings {
  /**
   * 是否公开
   */
  public: boolean;
  /**
   * 分享链接
   */
  shareLink?: string;
  /**
   * 密码保护
   */
  password?: string;
  /**
   * 过期时间
   */
  expiresAt?: string;
  /**
   * 允许下载
   */
  allowDownload?: boolean;
  /**
   * 允许复制
   */
  allowCopy?: boolean;
  /**
   * 分享范围
   */
  scope?: SharingScope;
}

/**
 * 分享范围
 */
export enum SharingScope {
  Private = 'private',
  Team = 'team',
  Organization = 'organization',
  Public = 'public',
}

/**
 * 版本信息
 */
export interface VersionInfo {
  /**
   * 主版本号
   */
  major: number;
  /**
   * 次版本号
   */
  minor: number;
  /**
   * 修订版本号
   */
  patch: number;
  /**
   * 预发布标识
   */
  prerelease?: string;
  /**
   * 构建元数据
   */
  build?: string;
}

/**
 * 时间戳
 */
export interface Timestamp {
  /**
   * Unix 时间戳（秒）
   */
  seconds: number;
  /**
   * 纳秒部分
   */
  nanoseconds: number;
}

/**
 * 核心颜色接口
 */
export interface IColor {
  /**
   * 颜色值
   */
  value: UsdValue; // Color4f
  /**
   * 颜色空间
   */
  colorSpace?: ColorSpace;
  /**
   * 是否线性
   */
  linear?: boolean;
}

// ========== 数学基础类型 ==========

/**
 * 2D向量
 */
export interface IVector2 {
  x: number;
  y: number;
}

/**
 * 3D向量
 */
export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * 4D向量
 */
export interface IVector4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * 四元数
 */
export interface IQuaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * 2x2矩阵
 */
export interface IMatrix2x2 {
  m00: number;
  m01: number;
  m10: number;
  m11: number;
}

/**
 * 3x3矩阵
 */
export interface IMatrix3x3 {
  m00: number;
  m01: number;
  m02: number;
  m10: number;
  m11: number;
  m12: number;
  m20: number;
  m21: number;
  m22: number;
}

/**
 * 4x4矩阵
 */
export interface IMatrix4x4 {
  m00: number;
  m01: number;
  m02: number;
  m03: number;
  m10: number;
  m11: number;
  m12: number;
  m13: number;
  m20: number;
  m21: number;
  m22: number;
  m23: number;
  m30: number;
  m31: number;
  m32: number;
  m33: number;
}

/**
 * 边界球
 */
export interface BoundingSphere {
  /**
   * 中心点
   */
  center: IVector3;
  /**
   * 半径
   */
  radius: UsdValue; // float
}

/**
 * 平台类型
 */
export enum PlatformType {
  Web = 'web',
  iOS = 'ios',
  Android = 'android',
  Windows = 'windows',
  macOS = 'macos',
  Linux = 'linux',
}

/**
 * 设备类型
 */
export enum DeviceType {
  Mobile = 'mobile',
  Tablet = 'tablet',
  Desktop = 'desktop',
  TV = 'tv',
  VR = 'vr',
  AR = 'ar',
}

/**
 * 资源状态
 */
export enum ResourceState {
  Unloaded = 0,
  Loading = 1,
  Loaded = 2,
  Failed = 3,
}

/**
 * 坐标系类型
 */
export enum CoordinateSystem {
  LeftHanded = 0,
  RightHanded = 1,
}

/**
 * 像素格式
 */
export enum PixelFormat {
  RGB8 = 'rgb8',
  RGBA8 = 'rgba8',
  RGB16F = 'rgb16f',
  RGBA16F = 'rgba16f',
  RGB32F = 'rgb32f',
  RGBA32F = 'rgba32f',
  Depth16 = 'depth16',
  Depth24 = 'depth24',
  Depth32F = 'depth32f',
  Stencil8 = 'stencil8',
}

/**
 * 压缩格式
 */
export enum CompressionFormat {
  None = 'none',
  DXT1 = 'dxt1',
  DXT3 = 'dxt3',
  DXT5 = 'dxt5',
  BC7 = 'bc7',
  ETC1 = 'etc1',
  ETC2 = 'etc2',
  PVRTC = 'pvrtc',
  ASTC = 'astc',
}

/**
 * 元素类型
 */
export enum ItemType {
  Scene = 'scene',
  Prefab = 'prefab',
  Material = 'material',
  Texture = 'texture',
  Mesh = 'mesh',
  Animation = 'animation',
  Audio = 'audio',
  Script = 'script',
  Font = 'font',
  Shader = 'shader',
  Sprite = 'sprite',
  Particle = 'particle',
  Tree = 'tree',
  Camera = 'camera',
  Text = 'text',
  Skybox = 'skybox',
  Light = 'light',
  Spine = 'spine',
}
