/**
 * Default Mesh Loader
 * 默认网格加载器
 *
 * @packageDocumentation
 *
 * @remarks
 * Core 包提供的默认网格加载器（占位符实现）。
 * 此加载器返回空网格，用于在没有注册自定义加载器时提供默认行为。
 *
 * ## 设计说明
 *
 * Core 包不包含具体的网格解析逻辑（如 GLTF、OBJ 等），
 * 应用包应注册自定义 MeshLoader 来支持特定格式。
 *
 * @example
 * ```typescript
 * // Core 包默认行为（返回空网格）
 * const handle = await resourceManager.loadMesh('models/cube.glb');
 * const mesh = resourceManager.getMesh(handle);
 * console.log(mesh.vertexCount); // 0 (空网格)
 * ```
 *
 * @example
 * ```typescript
 * // 应用包注册自定义加载器
 * import { GLTFLoader } from '@myapp/loaders';
 *
 * resourceManager.registerLoader('mesh', new GLTFLoader());
 * const handle = await resourceManager.loadMesh('models/cube.glb');
 * const mesh = resourceManager.getMesh(handle);
 * console.log(mesh.vertexCount); // 实际顶点数
 * ```
 */

import type { IResourceLoader, IMeshResource, IRHIDevice } from '@maxellabs/specification';

// ============================================================================
// DefaultMeshLoader
// ============================================================================

/**
 * DefaultMeshLoader - 默认网格加载器（占位符实现）
 *
 * @description
 * 返回空网格作为默认实现，避免加载失败。
 * 应用包应注册自定义加载器来支持实际的网格格式（GLTF、OBJ 等）。
 */
export class DefaultMeshLoader implements IResourceLoader<IMeshResource> {
  /** 支持的扩展名（空数组，表示回退加载器） */
  readonly extensions: string[] = [];

  /**
   * 加载网格资源（默认实现）
   *
   * @param uri 资源 URI
   * @param _device RHI 设备（未使用）
   * @returns 空网格
   */
  async load(uri: string, _device: IRHIDevice): Promise<IMeshResource> {
    console.warn(
      `[DefaultMeshLoader] No custom loader registered for mesh: "${uri}". ` +
        `Returning empty mesh. Consider registering a custom MeshLoader (e.g., GLTFLoader).`
    );

    // 返回空网格（避免加载失败）
    return {
      vertexBuffer: null,
      indexBuffer: null,
      indexCount: 0,
      vertexCount: 0,
      primitiveType: 'triangles',
    };
  }

  /**
   * 释放网格资源
   *
   * @param resource 网格资源
   */
  dispose(resource: IMeshResource): void {
    // 清理 GPU 资源
    try {
      resource.vertexBuffer?.destroy();
      resource.indexBuffer?.destroy();
    } catch (error) {
      console.warn('[DefaultMeshLoader] Failed to dispose mesh resource:', error);
    }
  }
}
