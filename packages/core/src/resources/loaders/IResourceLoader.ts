/**
 * Resource Loader Interface
 * 资源加载器接口
 *
 * @packageDocumentation
 *
 * @remarks
 * 此文件重新导出 @maxellabs/specification 中定义的 IResourceLoader 接口，
 * 并提供额外的类型定义和文档说明。
 *
 * ## 扩展用法
 *
 * 应用包可以实现自定义加载器来支持新的资源类型：
 *
 * @example
 * ```typescript
 * // 示例：实现 GLTF 加载器
 * import { IResourceLoader, IMeshResource, IRHIDevice } from '@maxellabs/specification';
 *
 * export class GLTFLoader implements IResourceLoader<IMeshResource> {
 *   readonly extensions = ['.glb', '.gltf'];
 *
 *   async load(uri: string, device: IRHIDevice): Promise<IMeshResource> {
 *     // 1. 获取文件数据
 *     const response = await fetch(uri);
 *     const arrayBuffer = await response.arrayBuffer();
 *
 *     // 2. 解析 GLTF
 *     const gltf = parseGLTF(arrayBuffer);
 *
 *     // 3. 创建 GPU 资源
 *     const vertexBuffer = device.createBuffer({
 *       data: gltf.vertices,
 *       usage: 'vertex',
 *     });
 *     const indexBuffer = device.createBuffer({
 *       data: gltf.indices,
 *       usage: 'index',
 *     });
 *
 *     return {
 *       vertexBuffer,
 *       indexBuffer,
 *       vertexCount: gltf.vertexCount,
 *       indexCount: gltf.indexCount,
 *       primitiveType: 'triangles',
 *     };
 *   }
 *
 *   dispose(resource: IMeshResource): void {
 *     resource.vertexBuffer?.destroy();
 *     resource.indexBuffer?.destroy();
 *   }
 * }
 *
 * // 注册加载器
 * resourceManager.registerLoader('mesh', new GLTFLoader());
 * ```
 *
 * @example
 * ```typescript
 * // 示例：实现图片加载器
 * import { IResourceLoader, ITextureResource, IRHIDevice } from '@maxellabs/specification';
 *
 * export class ImageLoader implements IResourceLoader<ITextureResource> {
 *   readonly extensions = ['.png', '.jpg', '.jpeg'];
 *
 *   async load(uri: string, device: IRHIDevice): Promise<ITextureResource> {
 *     const img = new Image();
 *     img.src = uri;
 *     await img.decode();
 *
 *     const texture = device.createTexture({
 *       width: img.width,
 *       height: img.height,
 *       data: img,
 *     });
 *
 *     return {
 *       texture,
 *       width: img.width,
 *       height: img.height,
 *       hasMipmaps: false,
 *     };
 *   }
 *
 *   dispose(resource: ITextureResource): void {
 *     resource.texture?.destroy();
 *   }
 * }
 * ```
 */

// ============================================================================
// Re-export from Specification
// ============================================================================

export type { IResourceLoader } from '@maxellabs/specification';

// ============================================================================
// Loader Metadata (Optional)
// ============================================================================

/**
 * 加载器元数据接口
 * @description 用于调试和日志记录的可选元数据
 */
export interface LoaderMetadata {
  /** 加载器名称 */
  name: string;
  /** 支持的文件格式 */
  supportedFormats: string[];
  /** 版本号 */
  version?: string;
  /** 描述 */
  description?: string;
}
