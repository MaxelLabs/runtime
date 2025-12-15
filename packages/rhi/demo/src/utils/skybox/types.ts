/**
 * skybox/types.ts
 * 天空盒系统类型定义
 */

import type { MSpec } from '@maxellabs/core';

/**
 * 天空类型
 */
export enum SkyType {
  /** 立方体贴图天空盒 */
  CUBEMAP = 'cubemap',
  /** 程序化生成天空 */
  PROCEDURAL = 'procedural',
}

/**
 * 天空盒配置
 */
export interface SkyboxConfig {
  /** 天空类型 */
  type: SkyType;
  /** 立方体贴图纹理（当type为CUBEMAP时必需） */
  cubemap?: MSpec.IRHITexture;
  /** 程序化天空选项（当type为PROCEDURAL时使用） */
  proceduralOptions?: ProceduralSkyOptions;
}

/**
 * 程序化天空选项
 */
export interface ProceduralSkyOptions {
  /** 天顶颜色（顶部） */
  zenithColor?: [number, number, number];
  /** 地平线颜色 */
  horizonColor?: [number, number, number];
  /** 地面颜色（底部） */
  groundColor?: [number, number, number];
  /** 太阳颜色 */
  sunColor?: [number, number, number];
  /** 太阳方向（归一化向量） */
  sunDirection?: [number, number, number];
  /** 太阳大小（角度余弦阈值，越接近1越小） */
  sunSize?: number;
  /** 是否启用日夜循环 */
  enableDayNightCycle?: boolean;
  /** 日夜循环速度（秒/周期） */
  cycleSpeed?: number;
}

/**
 * 环境映射数据（用于PBR IBL）
 */
export interface EnvironmentMapData {
  /** 漫反射辐照度图 */
  diffuseIrradiance: MSpec.IRHITexture;
  /** 镜面反射预过滤图（带Mipmap） */
  specularReflection: MSpec.IRHITexture;
  /** BRDF积分查找表 */
  brdfLUT: MSpec.IRHITexture;
}

/**
 * 天空盒渲染选项
 */
export interface SkyboxOptions {
  /** 是否启用天空盒渲染 */
  enabled?: boolean;
  /** 曝光强度 */
  exposure?: number;
  /** 旋转角度（弧度） */
  rotation?: number;
}
