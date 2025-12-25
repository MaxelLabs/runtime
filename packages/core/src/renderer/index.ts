/**
 * Renderer Module
 * 渲染器模块
 *
 * @packageDocumentation
 *
 * @remarks
 * ## Overview
 * This module provides the Renderer abstraction layer for Core package.
 * It separates rendering concerns from ECS logic and allows application packages
 * to implement custom rendering pipelines.
 *
 * ## Architecture
 * ```
 * Scene → RenderSystem (ECS) → Renderer (RHI) → IRHIDevice (Platform)
 * ```
 *
 * ## Key Components
 * - **Renderer**: Abstract base class for custom renderers
 * - **MaterialInstance**: Material instantiation and parameter management
 * - **RenderContext**: Complete rendering context (scene, camera, resources)
 * - **Renderable**: Immutable rendering data structure
 *
 * ## Usage Example
 * ```typescript
 * import { Renderer, RenderContext } from '@maxellabs/core';
 * import { IRHIDevice } from '@maxellabs/specification';
 *
 * class MyRenderer extends Renderer {
 *   protected render(ctx: RenderContext): void {
 *     for (const renderable of ctx.renderables) {
 *       // Get resources
 *       const mesh = ctx.scene.getMesh(renderable.meshId);
 *       const material = ctx.scene.getMaterial(renderable.materialId);
 *
 *       // Create material instance
 *       const instance = this.createMaterialInstance(material);
 *
 *       // Render
 *       instance.bind();
 *       this.device.draw(mesh);
 *     }
 *   }
 * }
 *
 * // Use in scene
 * const renderer = new MyRenderer({ device });
 * scene.setRenderer(renderer);
 * ```
 *
 * ## Design Goals
 * 1. **No WebGL/WebGPU dependencies**: Only @maxellabs/specification interfaces
 * 2. **Extensibility**: onBeforeRender/onAfterRender hooks
 * 3. **Resource management**: Through ResourceManager and handles
 * 4. **Type safety**: Complete TypeScript support
 */

// Core classes
export { Renderer } from './renderer';
export { MaterialInstance } from './material-instance';
export { ShaderCompiler, ShaderCompilerError } from './shader-compiler';
export { ShaderProgram } from './shader-program';
export { ShaderCache } from './shader-cache';

// Types and interfaces
export type { RendererConfig, RendererDisposeCallback } from './renderer';
export type { RenderContext, Renderable } from './render-context';
export { createEmptyRenderContext } from './render-context';
export type { ShaderCompilerConfig } from './shader-compiler';
