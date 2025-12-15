/**
 * shadow/index.ts
 * 阴影工具模块统一导出
 *
 * 提供阴影映射渲染所需的工具集：
 * - ShadowMap: 阴影贴图管理器
 * - LightSpaceMatrix: 光源空间矩阵计算
 * - PCFFilter: PCF软阴影滤波器
 * - ShadowShaders: 阴影着色器代码生成
 *
 * @example
 * ```typescript
 * import {
 *   ShadowMap,
 *   LightSpaceMatrix,
 *   PCFFilter,
 *   ShadowShaders,
 * } from './utils/shadow';
 *
 * // 创建阴影贴图
 * const shadowMap = runner.track(new ShadowMap(runner.device, {
 *   resolution: 1024,
 * }));
 *
 * // 计算光源矩阵
 * const lightMatrix = new LightSpaceMatrix();
 * lightMatrix.updateDirectional({
 *   direction: [0.5, -1, 0.3],
 *   orthoSize: 15,
 * });
 *
 * // 获取着色器代码
 * const depthVS = ShadowShaders.getDepthVertexShader();
 * const depthFS = ShadowShaders.getDepthFragmentShader();
 * ```
 */

// 类导出
export { ShadowMap } from './ShadowMap';
export { LightSpaceMatrix } from './LightSpaceMatrix';
export { PCFFilter } from './PCFFilter';
export { ShadowShaders } from './ShadowShaders';

// 类型导出
export type {
  ShadowMapOptions,
  PCFSampleMode,
  PCFFilterOptions,
  DirectionalLightConfig,
  PointLightConfig,
  ShadowPassDescriptor,
  ShadowUniformData,
} from './types';
