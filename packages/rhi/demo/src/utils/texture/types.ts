/**
 * texture/types.ts
 * 纹理工具类型定义
 */

/**
 * 纹理数据
 */
export interface TextureData {
  /** 纹理宽度 */
  width: number;

  /** 纹理高度 */
  height: number;

  /** 像素数据 (RGBA) */
  data: Uint8Array;
}

/**
 * 棋盘格纹理配置
 */
export interface CheckerboardConfig {
  /** 宽度（像素） */
  width?: number;

  /** 高度（像素） */
  height?: number;

  /** 格子大小（像素） */
  cellSize?: number;

  /** 颜色 A（RGBA 0-255） */
  colorA?: [number, number, number, number];

  /** 颜色 B（RGBA 0-255） */
  colorB?: [number, number, number, number];
}

/**
 * 渐变纹理配置
 */
export interface GradientConfig {
  /** 宽度（像素） */
  width?: number;

  /** 高度（像素） */
  height?: number;

  /** 渐变方向 */
  direction?: 'horizontal' | 'vertical' | 'diagonal';

  /** 起始颜色（RGBA 0-255） */
  startColor?: [number, number, number, number];

  /** 结束颜色（RGBA 0-255） */
  endColor?: [number, number, number, number];
}

/**
 * 噪声纹理配置
 */
export interface NoiseConfig {
  /** 宽度（像素） */
  width?: number;

  /** 高度（像素） */
  height?: number;

  /** 噪声类型 */
  type?: 'white' | 'perlin' | 'simplex';

  /** 噪声频率（对 perlin/simplex） */
  frequency?: number;

  /** 八度数（对 perlin/simplex） */
  octaves?: number;

  /** 基础颜色（RGBA 0-255） */
  baseColor?: [number, number, number, number];

  /** 噪声颜色（RGBA 0-255） */
  noiseColor?: [number, number, number, number];
}

/**
 * 纯色纹理配置
 */
export interface SolidColorConfig {
  /** 宽度（像素） */
  width?: number;

  /** 高度（像素） */
  height?: number;

  /** 颜色（RGBA 0-255） */
  color?: [number, number, number, number];
}

/**
 * UV 调试纹理配置
 */
export interface UVDebugConfig {
  /** 宽度（像素） */
  width?: number;

  /** 高度（像素） */
  height?: number;
}

/**
 * 法线贴图配置
 */
export interface NormalMapConfig {
  /** 宽度（像素） */
  width?: number;

  /** 高度（像素） */
  height?: number;

  /** 图案类型 */
  pattern?: 'flat' | 'bumpy' | 'wave';

  /** 强度 (0-1) */
  strength?: number;
}
