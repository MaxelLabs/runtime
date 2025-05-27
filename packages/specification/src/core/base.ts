/**
 * Maxellabs 基础类型定义
 * 所有模块共用的基础数据类型、枚举和常量
 */

/**
 * 基础数据类型
 */
export type UUID = string;
export type Path = string;
export type URL = string;

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
 * 边界框
 */
export interface BoundingBox {
  /**
   * 最小点
   */
  min: [number, number, number];
  /**
   * 最大点
   */
  max: [number, number, number];
}

/**
 * 边界球
 */
export interface BoundingSphere {
  /**
   * 中心点
   */
  center: [number, number, number];
  /**
   * 半径
   */
  radius: number;
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
