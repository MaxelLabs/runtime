/**
 * shadow/types.ts
 * 阴影工具模块类型定义
 */

import type { MSpec } from '@maxellabs/core';

/**
 * 阴影贴图配置选项
 */
export interface ShadowMapOptions {
  /** 阴影贴图分辨率（512-4096），默认1024 */
  resolution?: number;
  /** 深度纹理格式，默认DEPTH24_UNORM */
  depthFormat?: MSpec.RHITextureFormat;
  /** 资源标签 */
  label?: string;
}

/**
 * PCF采样模式
 */
export type PCFSampleMode = '1x1' | '2x2' | '3x3' | '5x5';

/**
 * PCF滤波器配置
 */
export interface PCFFilterOptions {
  /** 采样模式 */
  sampleMode: PCFSampleMode;
  /** 阴影偏移，默认0.005 */
  bias?: number;
  /** 法线偏移，默认0.0 */
  normalBias?: number;
}

/**
 * 平行光配置
 */
export interface DirectionalLightConfig {
  /** 光源方向（归一化向量） */
  direction: [number, number, number];
  /** 目标点，默认[0,0,0] */
  target?: [number, number, number];
  /** 正交投影范围，默认10 */
  orthoSize?: number;
  /** 近裁剪面，默认1 */
  near?: number;
  /** 远裁剪面，默认50 */
  far?: number;
}

/**
 * 点光源配置
 */
export interface PointLightConfig {
  /** 光源位置 */
  position: [number, number, number];
  /** 近裁剪面，默认0.1 */
  near?: number;
  /** 远裁剪面，默认25 */
  far?: number;
}

/**
 * 阴影渲染通道描述符
 */
export interface ShadowPassDescriptor {
  /** 深度附件视图 */
  depthView: MSpec.IRHITextureView;
  /** 清除深度值 */
  clearDepth: number;
}

/**
 * 阴影Uniform数据布局（std140对齐）
 * 总大小：96字节
 */
export interface ShadowUniformData {
  /** 光源视图投影矩阵 (64 bytes) */
  lightViewProjMatrix: Float32Array;
  /** 光源位置 (12 bytes + 4 padding) */
  lightPosition: [number, number, number];
  /** 阴影偏移 (4 bytes) */
  shadowBias: number;
  /** 阴影强度 (4 bytes) */
  shadowIntensity: number;
  /** PCF采样数 (4 bytes) */
  pcfSamples: number;
}
