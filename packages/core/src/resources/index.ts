/**
 * Resource Management
 * 资源管理模块
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计决策
 *
 * ResourceManager 是 Core 包提供的资源管理器，负责：
 * 1. 资源加载（异步）
 * 2. 资源缓存
 * 3. 资源引用计数
 * 4. 资源释放
 *
 * ## 资源类型
 *
 * Core 定义了以下基础资源类型：
 * - Mesh: 网格数据
 * - Texture: 纹理数据
 * - Material: 材质数据
 * - Shader: 着色器数据
 *
 * ## 扩展方式
 *
 * 应用包可以通过 `registerLoader` 注册自定义加载器来支持新的资源类型。
 *
 * @example
 * ```typescript
 * const resourceManager = new ResourceManager(device);
 *
 * // 加载资源
 * const meshHandle = await resourceManager.loadMesh('models/cube.glb');
 * const textureHandle = await resourceManager.loadTexture('textures/diffuse.png');
 *
 * // 使用资源
 * const mesh = resourceManager.getMesh(meshHandle);
 *
 * // 释放资源
 * resourceManager.release(meshHandle);
 * ```
 */

import type { IResourceLoader } from '@maxellabs/specification';

// ============================================================================
// Type Aliases (Backward Compatibility)
// ============================================================================

/**
 * @deprecated 使用 IResourceLoader 代替
 */
export type ILoader<T> = IResourceLoader<T>;

// ============================================================================
// Re-exports
// ============================================================================

export { ResourceManager } from './resource-manager';
export { ResourceHandle, createResourceHandle } from './resource-handle';
export type { IResourceLoader, LoaderMetadata } from './loaders';
export { DefaultMeshLoader, DefaultTextureLoader, DefaultMaterialLoader } from './loaders';
