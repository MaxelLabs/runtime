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

/**
 * 立方体贴图面标识符
 * 遵循 WebGL/OpenGL 标准顺序
 */
export type CubemapFace = 'posX' | 'negX' | 'posY' | 'negY' | 'posZ' | 'negZ';

/**
 * 立方体贴图数据
 */
export interface CubemapData {
  /** 每个面的尺寸（正方形） */
  size: number;

  /** 6 个面的 RGBA 数据 */
  faces: Record<CubemapFace, Uint8Array>;
}

/**
 * 天空渐变立方体贴图配置
 */
export interface SkyboxGradientConfig {
  /** 每个面的尺寸（默认 256） */
  size?: number;

  /** 天顶颜色 [R,G,B,A]（默认蓝色） */
  topColor?: [number, number, number, number];

  /** 地平线颜色 [R,G,B,A]（默认浅蓝） */
  horizonColor?: [number, number, number, number];

  /** 底部颜色 [R,G,B,A]（默认棕色） */
  bottomColor?: [number, number, number, number];
}

/**
 * 纯色立方体贴图配置
 */
export interface SolidColorCubemapConfig {
  /** 每个面的尺寸（默认 256） */
  size?: number;

  /** 纹理颜色 [R,G,B,A]（默认白色） */
  color?: [number, number, number, number];
}

/**
 * 调试立方体贴图配置
 */
export interface DebugCubemapConfig {
  /** 每个面的尺寸（默认 256） */
  size?: number;

  /** 是否显示文本标签（默认 true） */
  showLabels?: boolean;
}

/**
 * 纹理加载选项
 */
export interface TextureLoadOptions {
  /** 是否翻转 Y 轴（默认 true，因为 WebGL Y 轴与图片坐标相反） */
  flipY?: boolean;

  /** 是否生成 Mipmap（默认 false） */
  generateMipmaps?: boolean;

  /** 是否预乘 Alpha（默认 false） */
  premultiplyAlpha?: boolean;

  /** 目标纹理格式（默认 RGBA8_UNORM） */
  format?: string;
}

/**
 * 已加载的纹理数据
 */
export interface LoadedTexture {
  /** 纹理宽度 */
  width: number;

  /** 纹理高度 */
  height: number;

  /** 像素数据 (RGBA) */
  data: Uint8Array;

  /** Mipmap 链（如果已生成） */
  mipmaps?: Uint8Array[];

  /** 纹理格式 */
  format: string;
}
