/**
 * Materials Module - 材质系统模块
 *
 * @packageDocumentation
 *
 * @remarks
 * 提供 Engine 包的材质实现。
 *
 * ## 模块内容
 * - PBRMaterial - 基于物理的渲染材质
 * - UnlitMaterial - 无光照材质
 */

export { PBRMaterial } from './PBR-material';
export type { PBRMaterialConfig, AlphaMode } from './PBR-material';

export { UnlitMaterial } from './unlit-material';
export type { UnlitMaterialConfig } from './unlit-material';
