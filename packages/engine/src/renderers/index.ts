/**
 * Renderers Module - 渲染器模块
 *
 * @packageDocumentation
 *
 * @remarks
 * 提供 Engine 包的渲染器实现。
 *
 * ## 模块内容
 * - ForwardRenderer - 前向渲染器 (基于 RHI 命令编码器)
 * - SimpleWebGLRenderer - 简化的 WebGL 渲染器 (直接 WebGL 调用)
 * - PostProcessPass - 后处理通道接口
 * - ShadowPass - 阴影通道接口
 */

export { ForwardRenderer } from './forward-renderer';
export type { ForwardRendererConfig, PostProcessPass, ShadowPass } from './forward-renderer';

export { SimpleWebGLRenderer } from './simple-webgl-renderer';
export type { SimpleWebGLRendererConfig } from './simple-webgl-renderer';

export * from './shaders';
