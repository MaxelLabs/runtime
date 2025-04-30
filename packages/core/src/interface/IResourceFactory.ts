import type { IBuffer } from './IBuffer';
import type { BufferDescriptor } from './IBuffer';
import type { IShader } from './IShader';
import type { IRenderTarget } from './IRenderTarget';
import type { ITexture } from './ITexture';
import type { TextureDescriptor } from './ITexture';
import type { RenderTargetDescriptor } from './IRenderTarget';
import type { ShaderCreateOptions } from './IShader';

/**
 * 资源缓存配置
 */
export interface ResourceCacheOptions {
  /**
   * 是否启用缓存
   */
  enabled: boolean,

  /**
   * 最大缓存大小(MB)
   */
  maxSize?: number,

  /**
   * 资源超时时间(ms)，超过后自动释放
   */
  timeout?: number,
}

/**
 * 资源创建错误
 */
export class ResourceCreationError extends Error {
  constructor (
    public resourceType: string,
    message: string,
    override cause?: Error
  ) {
    super(`Failed to create ${resourceType}: ${message}`);
    this.name = 'ResourceCreationError';
  }
}

/**
 * 资源加载回调
 */
export interface ResourceLoadCallback<T> {
  /**
   * 加载进度回调
   */
  onProgress?: (loaded: number, total: number) => void,

  /**
   * 加载完成回调
   */
  onComplete?: (resource: T) => void,

  /**
   * 加载失败回调
   */
  onError?: (error: Error) => void,
}

/**
 * 资源工厂接口 - 创建和管理渲染资源
 */
export interface IResourceFactory {
  /**
   * 创建缓冲区对象
   * @param descriptor - 缓冲区描述符
   * @returns 创建的缓冲区对象
   * @throws {ResourceCreationError} 当创建失败时抛出
   */
  createBuffer(descriptor: BufferDescriptor): IBuffer,

  /**
   * 创建着色器对象
   * @param options - 着色器创建选项
   * @returns 创建的着色器对象
   * @throws {ResourceCreationError} 当编译或链接失败时抛出
   */
  createShader(options: ShaderCreateOptions): IShader,

  /**
   * 从文件创建着色器
   * @param vertexPath - 顶点着色器文件路径
   * @param fragmentPath - 片段着色器文件路径
   * @param defines - 可选的宏定义列表
   * @param callbacks - 加载回调
   * @returns Promise，完成时返回创建的着色器对象
   */
  createShaderFromFile(
    vertexPath: string,
    fragmentPath: string,
    defines?: Record<string, string | number | boolean>,
    callbacks?: ResourceLoadCallback<IShader>
  ): Promise<IShader>,

  /**
   * 创建纹理对象
   * @param descriptor - 纹理描述符
   * @returns 创建的纹理对象
   * @throws {ResourceCreationError} 当创建失败时抛出
   */
  createTexture(descriptor: TextureDescriptor): ITexture,

  /**
   * 从图像创建纹理
   * @param image - 图像对象或URL
   * @param options - 纹理选项
   * @param callbacks - 加载回调
   * @returns Promise，完成时返回创建的纹理对象
   */
  createTextureFromImage(
    image: HTMLImageElement | ImageBitmap | ImageData | string,
    options?: Partial<TextureDescriptor>,
    callbacks?: ResourceLoadCallback<ITexture>
  ): Promise<ITexture>,

  /**
   * 从视频创建纹理
   * @param video - 视频元素或URL
   * @param options - 纹理选项
   * @param callbacks - 加载回调
   * @returns Promise，完成时返回创建的纹理对象
   */
  createTextureFromVideo(
    video: HTMLVideoElement | string,
    options?: Partial<TextureDescriptor>,
    callbacks?: ResourceLoadCallback<ITexture>
  ): Promise<ITexture>,

  /**
   * 从立方体图像创建纹理
   * @param images - 六个面的图像(+X, -X, +Y, -Y, +Z, -Z)
   * @param options - 纹理选项
   * @param callbacks - 加载回调
   * @returns Promise，完成时返回创建的立方体纹理
   */
  createCubeTexture(
    images: (HTMLImageElement | ImageBitmap | ImageData | string)[],
    options?: Partial<TextureDescriptor>,
    callbacks?: ResourceLoadCallback<ITexture>
  ): Promise<ITexture>,

  /**
   * 创建渲染目标
   * @param descriptor - 渲染目标描述符
   * @returns 创建的渲染目标
   * @throws {ResourceCreationError} 当创建失败时抛出
   */
  createRenderTarget(descriptor: RenderTargetDescriptor): IRenderTarget,

  /**
   * 配置资源缓存
   * @param options - 缓存配置
   */
  configureCache(options: ResourceCacheOptions): void,

  /**
   * 根据键获取缓存的资源
   * @param key - 缓存键
   * @returns 资源，不存在时返回null
   */
  getCachedResource(key: string): IBuffer | IShader | ITexture | IRenderTarget | null,

  /**
   * 将资源放入缓存
   * @param key - 缓存键
   * @param resource - 要缓存的资源
   * @param lifetime - 资源生命周期(ms)，不提供则使用默认值
   */
  cacheResource(key: string, resource: IBuffer | IShader | ITexture | IRenderTarget, lifetime?: number): void,

  /**
   * 释放资源
   * @param resource - 要释放的资源
   */
  releaseResource(resource: IBuffer | IShader | ITexture | IRenderTarget): void,

  /**
   * 释放所有由该工厂创建的资源
   */
  releaseAllResources(): void,

  /**
   * 清除资源缓存
   */
  clearCache(): void,

  /**
   * 获取已创建资源的统计信息
   * @returns 资源统计信息
   */
  getResourceStats(): {
    buffers: number,
    shaders: number,
    textures: number,
    renderTargets: number,
    cachedResources: number,
    totalMemoryUsage: number,
    availableCacheSize: number,
  },
}