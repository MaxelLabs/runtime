/**
 * Default Material Loader
 * 默认材质加载器
 *
 * @packageDocumentation
 *
 * @remarks
 * Core 包提供的默认材质加载器（占位符实现）。
 * 此加载器返回默认材质（shaderId='default'），用于在没有注册自定义加载器时提供默认行为。
 *
 * ## 设计说明
 *
 * Core 包不包含具体的材质解析逻辑（如 JSON、YAML 等材质配置格式），
 * 应用包应注册自定义 MaterialLoader 来支持特定格式。
 *
 * @example
 * ```typescript
 * // Core 包默认行为（返回默认材质）
 * const handle = await resourceManager.loadMaterial('materials/standard.mat');
 * const material = resourceManager.getMaterial(handle);
 * console.log(material.shaderId); // 'default' (占位符)
 * ```
 *
 * @example
 * ```typescript
 * // 应用包注册自定义加载器
 * import { MaterialLoader } from '@myapp/loaders';
 *
 * resourceManager.registerLoader('material', new MaterialLoader());
 * const handle = await resourceManager.loadMaterial('materials/standard.mat');
 * const material = resourceManager.getMaterial(handle);
 * console.log(material.shaderId); // 实际 shader ID
 * ```
 */

import type { IResourceLoader, IMaterialResource, IRHIDevice } from '@maxellabs/specification';

// ============================================================================
// DefaultMaterialLoader
// ============================================================================

/**
 * DefaultMaterialLoader - 默认材质加载器（占位符实现）
 *
 * @description
 * 返回默认材质作为默认实现，避免加载失败。
 * 应用包应注册自定义加载器来支持实际的材质格式。
 */
export class DefaultMaterialLoader implements IResourceLoader<IMaterialResource> {
  /** 支持的扩展名（空数组，表示回退加载器） */
  readonly extensions: string[] = [];

  /**
   * 加载材质资源（默认实现）
   *
   * @param uri 资源 URI
   * @param _device RHI 设备（未使用）
   * @returns 默认材质
   */
  async load(uri: string, _device: IRHIDevice): Promise<IMaterialResource> {
    console.warn(
      `[DefaultMaterialLoader] No custom loader registered for material: "${uri}". ` +
        `Returning default material. Consider registering a custom MaterialLoader.`
    );

    // 返回默认材质
    return {
      shaderId: 'default',
      properties: {},
      textures: {},
    };
  }

  /**
   * 释放材质资源
   *
   * @param _resource 材质资源
   */
  dispose(_resource: IMaterialResource): void {
    // 材质本身不持有 GPU 资源
    // 纹理由 TextureResource 管理
    // 无需额外清理
  }
}
