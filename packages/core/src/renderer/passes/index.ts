/**
 * passes/index.ts
 * 渲染通道模块导出
 */

// 基础渲染通道
export { RenderPass } from './render-pass';

// 具体渲染通道实现
export { OpaquePass, type OpaquePassConfig } from './opaque-pass';
export { TransparentPass, type TransparentPassConfig, type BlendMode } from './TransparentPass';
export { SkyboxPass, type SkyboxPassConfig, type SkyboxType } from './SkyboxPass';
export { DepthPrepass, type DepthPrepassConfig } from './depth-prepass';
export { ShadowPass, type ShadowPassConfig, type ShadowQuality, type ShadowType } from './ShadowPass';
export {
  PostProcessPass,
  type PostProcessPassConfig,
  type PostProcessEffect,
  type TonemappingType,
  type AntiAliasingType,
} from './postProcess-pass';
