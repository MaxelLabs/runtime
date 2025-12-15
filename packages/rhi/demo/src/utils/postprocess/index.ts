/**
 * postprocess/index.ts
 * 后处理工具包统一导出
 */

// 核心类
export { PostProcessManager } from './PostProcessManager';
export { PostProcessEffect } from './PostProcessEffect';

// 内置效果
export { BrightnessContrast } from './effects/BrightnessContrast';
export { GaussianBlur } from './effects/GaussianBlur';
export { ToneMapping } from './effects/ToneMapping';
export { FXAA } from './effects/FXAA';

// 类型定义
export type {
  PostProcessEffectOptions,
  PostProcessManagerOptions,
  IPostProcessEffect,
  PostProcessStats,
  GaussianBlurOptions,
  BloomOptions,
  ToneMappingOptions,
  FXAAOptions,
  BrightnessContrastOptions,
  VignetteOptions,
} from './types';
