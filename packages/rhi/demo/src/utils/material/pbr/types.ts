/**
 * material/pbr/types.ts
 * PBR材质系统类型定义
 */

import type { MSpec } from '@maxellabs/core';

/**
 * PBR材质配置
 */
export interface PBRConfig {
  /** 基础颜色（线性空间） */
  albedo: [number, number, number];
  /** 金属度 (0.0 = 非金属, 1.0 = 金属) */
  metalness: number;
  /** 粗糙度 (0.0 = 光滑, 1.0 = 粗糙) */
  roughness: number;
  /** 环境光遮蔽强度 */
  ao?: number;
  /** 法线贴图强度 */
  normalScale?: number;
  /** 自发光颜色 */
  emissive?: [number, number, number];
}

/**
 * PBR纹理集合
 */
export interface PBRTextures {
  /** 基础颜色贴图（sRGB空间） */
  albedoMap?: MSpec.IRHITexture;
  /** 金属度贴图（线性空间） */
  metalnessMap?: MSpec.IRHITexture;
  /** 粗糙度贴图（线性空间） */
  roughnessMap?: MSpec.IRHITexture;
  /** 法线贴图（切线空间） */
  normalMap?: MSpec.IRHITexture;
  /** 环境光遮蔽贴图（线性空间） */
  aoMap?: MSpec.IRHITexture;
  /** 自发光贴图（sRGB空间） */
  emissiveMap?: MSpec.IRHITexture;
}

/**
 * IBL环境贴图集合
 */
export interface IBLTextures {
  /** 辐照度图（漫反射IBL） */
  irradianceMap?: MSpec.IRHITexture;
  /** 预过滤环境图（镜面IBL） */
  prefilterMap?: MSpec.IRHITexture;
  /** BRDF查找表 */
  brdfLUT?: MSpec.IRHITexture;
}

/**
 * 材质预设类型
 */
export type MaterialPreset = 'gold' | 'silver' | 'copper' | 'plastic' | 'wood' | 'rubber';

/**
 * PBR材质统计信息
 */
export interface PBRStats {
  /** 材质数量 */
  materialCount: number;
  /** 纹理内存占用（字节） */
  textureMemory: number;
  /** 活跃材质数 */
  activeMaterials: number;
}

/**
 * 光源配置
 */
export interface LightConfig {
  /** 光源位置（世界空间） */
  position: [number, number, number];
  /** 光源颜色（线性空间） */
  color: [number, number, number];
  /** 光源强度 */
  intensity: number;
}

/**
 * PBR渲染配置
 */
export interface PBRRenderConfig {
  /** 是否启用IBL */
  enableIBL: boolean;
  /** 是否启用法线贴图 */
  enableNormalMap: boolean;
  /** 是否启用AO贴图 */
  enableAO: boolean;
  /** 最大反射LOD级别 */
  maxReflectionLOD: number;
  /** 是否启用Gamma校正 */
  enableGammaCorrection: boolean;
}
