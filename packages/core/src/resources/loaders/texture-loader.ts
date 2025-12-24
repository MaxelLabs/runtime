/**
 * Default Texture Loader
 * 默认纹理加载器
 *
 * @packageDocumentation
 *
 * @remarks
 * Core 包提供的默认纹理加载器（占位符实现）。
 * 此加载器返回 1x1 白色占位符纹理，用于在没有注册自定义加载器时提供默认行为。
 *
 * ## 设计说明
 *
 * Core 包不包含具体的图片解析逻辑（如 PNG、JPG 等），
 * 应用包应注册自定义 TextureLoader 来支持特定格式。
 *
 * @example
 * ```typescript
 * // Core 包默认行为（返回 1x1 白色纹理）
 * const handle = await resourceManager.loadTexture('textures/diffuse.png');
 * const texture = resourceManager.getTexture(handle);
 * console.log(texture.width, texture.height); // 1, 1 (占位符)
 * ```
 *
 * @example
 * ```typescript
 * // 应用包注册自定义加载器
 * import { ImageLoader } from '@myapp/loaders';
 *
 * resourceManager.registerLoader('texture', new ImageLoader());
 * const handle = await resourceManager.loadTexture('textures/diffuse.png');
 * const texture = resourceManager.getTexture(handle);
 * console.log(texture.width, texture.height); // 实际尺寸
 * ```
 */

import type { IResourceLoader, ITextureResource, IRHIDevice } from '@maxellabs/specification';

// ============================================================================
// DefaultTextureLoader
// ============================================================================

/**
 * DefaultTextureLoader - 默认纹理加载器（占位符实现）
 *
 * @description
 * 返回 1x1 白色纹理作为默认实现，避免加载失败。
 * 应用包应注册自定义加载器来支持实际的图片格式（PNG、JPG、WebP 等）。
 */
export class DefaultTextureLoader implements IResourceLoader<ITextureResource> {
  /** 支持的扩展名（空数组，表示回退加载器） */
  readonly extensions: string[] = [];

  /**
   * 加载纹理资源（默认实现）
   *
   * @param uri 资源 URI
   * @param _device RHI 设备（未使用）
   * @returns 1x1 白色占位符纹理
   */
  async load(uri: string, _device: IRHIDevice): Promise<ITextureResource> {
    console.warn(
      `[DefaultTextureLoader] No custom loader registered for texture: "${uri}". ` +
        `Returning 1x1 white placeholder. Consider registering a custom TextureLoader (e.g., ImageLoader).`
    );

    // 返回 1x1 白色占位符纹理
    return {
      texture: null, // 应用包应创建实际的 RHI Texture
      width: 1,
      height: 1,
      hasMipmaps: false,
    };
  }

  /**
   * 释放纹理资源
   *
   * @param resource 纹理资源
   */
  dispose(resource: ITextureResource): void {
    // 清理 GPU 资源
    try {
      resource.texture?.destroy();
    } catch (error) {
      console.warn('[DefaultTextureLoader] Failed to dispose texture resource:', error);
    }
  }
}
