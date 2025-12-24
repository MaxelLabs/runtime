/**
 * Resource Manager
 * 资源管理器实现
 *
 * @packageDocumentation
 *
 * @remarks
 * ResourceManager 是 Core 包提供的资源管理器,负责:
 * 1. 资源加载(异步)
 * 2. 资源缓存
 * 3. 资源引用计数
 * 4. 资源释放
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

import { ResourceType, ResourceState } from '@maxellabs/specification';
import type {
  IRHIDevice,
  IResourceHandle,
  IMeshResource,
  ITextureResource,
  IMaterialResource,
  IResourceLoader,
  IDisposable,
} from '@maxellabs/specification';
import { createResourceHandle } from './resource-handle';
import { DefaultMeshLoader, DefaultTextureLoader, DefaultMaterialLoader } from './loaders';

// ============================================================================
// Internal Types
// ============================================================================

/**
 * ResourceEntry - 内部资源条目
 */
interface ResourceEntry<T> {
  /** 资源数据 */
  data: T | null;
  /** 资源状态 */
  state: ResourceState;
  /** 引用计数 */
  refCount: number;
  /** 加载 Promise */
  loadPromise: Promise<T> | null;
  /** 错误信息 */
  error: Error | null;
}

/**
 * 资源清理函数类型
 */
type ResourceCleanupFn<T> = (entry: ResourceEntry<T>) => void;

// ============================================================================
// ResourceManager
// ============================================================================

/**
 * ResourceManager - 资源管理器
 * 负责资源的加载、缓存和释放
 */
export class ResourceManager implements IDisposable {
  /** RHI 设备 */
  private device: IRHIDevice | null = null;

  /** 资源缓存 */
  private meshes: Map<string, ResourceEntry<IMeshResource>> = new Map();
  private textures: Map<string, ResourceEntry<ITextureResource>> = new Map();
  private materials: Map<string, ResourceEntry<IMaterialResource>> = new Map();

  /** 自定义加载器 */
  private loaders: Map<string, IResourceLoader<unknown>> = new Map();

  /** 默认加载器 */
  private defaultLoaders: Map<string, IResourceLoader<unknown>> = new Map();

  /** 资源 ID 计数器 */
  private resourceIdCounter: number = 0;

  /** 是否已销毁 */
  private _disposed: boolean = false;

  constructor(device?: IRHIDevice) {
    this.device = device ?? null;

    // 注册默认加载器
    this.defaultLoaders.set('mesh', new DefaultMeshLoader());
    this.defaultLoaders.set('texture', new DefaultTextureLoader());
    this.defaultLoaders.set('material', new DefaultMaterialLoader());
  }

  /**
   * 设置 RHI 设备
   */
  setDevice(device: IRHIDevice): void {
    this.device = device;
  }

  /**
   * 检查是否已销毁
   */
  isDisposed(): boolean {
    return this._disposed;
  }

  // ==================== 资源加载（Public API）====================

  /**
   * 加载网格资源
   */
  async loadMesh(uri: string): Promise<IResourceHandle> {
    return this.loadResource('mesh', uri, this.meshes, ResourceType.Mesh);
  }

  /**
   * 加载纹理资源
   */
  async loadTexture(uri: string): Promise<IResourceHandle> {
    return this.loadResource('texture', uri, this.textures, ResourceType.Texture);
  }

  /**
   * 加载材质资源
   */
  async loadMaterial(uri: string): Promise<IResourceHandle> {
    return this.loadResource('material', uri, this.materials, ResourceType.Material);
  }

  // ==================== 资源访问（Public API）====================

  /**
   * 获取网格资源
   */
  getMesh(handle: IResourceHandle): IMeshResource | undefined {
    return this.getResource(handle, ResourceType.Mesh, this.meshes);
  }

  /**
   * 获取纹理资源
   */
  getTexture(handle: IResourceHandle): ITextureResource | undefined {
    return this.getResource(handle, ResourceType.Texture, this.textures);
  }

  /**
   * 获取材质资源
   */
  getMaterial(handle: IResourceHandle): IMaterialResource | undefined {
    return this.getResource(handle, ResourceType.Material, this.materials);
  }

  // ==================== 资源释放（Public API）====================

  /**
   * 释放资源（减少引用计数）
   */
  release(handle: IResourceHandle): void {
    this.checkDisposed();

    switch (handle.type) {
      case ResourceType.Mesh:
        this.releaseResource(handle.uri, this.meshes, this.cleanupMeshEntry);
        break;
      case ResourceType.Texture:
        this.releaseResource(handle.uri, this.textures, this.cleanupTextureEntry);
        break;
      case ResourceType.Material:
        this.releaseResource(handle.uri, this.materials, this.cleanupMaterialEntry);
        break;
    }
  }

  /**
   * 强制释放指定资源（忽略引用计数）
   */
  forceRelease(handle: IResourceHandle): void {
    this.checkDisposed();

    switch (handle.type) {
      case ResourceType.Mesh:
        this.forceReleaseResource(handle.uri, this.meshes, this.cleanupMeshEntry);
        break;
      case ResourceType.Texture:
        this.forceReleaseResource(handle.uri, this.textures, this.cleanupTextureEntry);
        break;
      case ResourceType.Material:
        this.forceReleaseResource(handle.uri, this.materials, this.cleanupMaterialEntry);
        break;
    }
  }

  /**
   * 释放所有资源
   */
  releaseAll(): void {
    this.releaseAllResources(this.meshes, this.cleanupMeshEntry);
    this.releaseAllResources(this.textures, this.cleanupTextureEntry);
    this.releaseAllResources(this.materials, this.cleanupMaterialEntry);
  }

  // ==================== 资源状态（Public API）====================

  /**
   * 获取资源状态
   */
  getResourceState(handle: IResourceHandle): ResourceState | undefined {
    switch (handle.type) {
      case ResourceType.Mesh:
        return this.meshes.get(handle.uri)?.state;
      case ResourceType.Texture:
        return this.textures.get(handle.uri)?.state;
      case ResourceType.Material:
        return this.materials.get(handle.uri)?.state;
      default:
        return undefined;
    }
  }

  /**
   * 检查资源是否加载失败
   */
  hasLoadError(handle: IResourceHandle): boolean {
    const state = this.getResourceState(handle);
    return state === ResourceState.Failed;
  }

  // ==================== 加载器注册（Public API）====================

  /**
   * 注册自定义加载器
   */
  registerLoader<T>(type: string, loader: IResourceLoader<T>): void {
    this.loaders.set(type, loader as IResourceLoader<unknown>);
  }

  /**
   * 获取加载器
   */
  getLoader<T>(type: string): IResourceLoader<T> | undefined {
    return this.loaders.get(type) as IResourceLoader<T> | undefined;
  }

  // ==================== 统计信息（Public API）====================

  /**
   * 获取统计信息
   */
  getStats(): {
    meshCount: number;
    textureCount: number;
    materialCount: number;
    loaderCount: number;
  } {
    return {
      meshCount: this.meshes.size,
      textureCount: this.textures.size,
      materialCount: this.materials.size,
      loaderCount: this.loaders.size,
    };
  }

  // ==================== 生命周期（Public API）====================

  /**
   * 销毁资源管理器
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }

    this.releaseAll();
    this.loaders.clear();
    this._disposed = true;
  }

  // ==================== 通用加载逻辑（Private）====================

  /**
   * 通用资源加载方法（消除重复代码）
   */
  private async loadResource<T>(
    loaderType: string,
    uri: string,
    cache: Map<string, ResourceEntry<T>>,
    resourceType: ResourceType
  ): Promise<IResourceHandle> {
    this.checkDisposed();

    // 1. 检查缓存
    let entry = cache.get(uri);
    if (entry) {
      entry.refCount++;
      if (entry.loadPromise) {
        await entry.loadPromise;
      }
      return createResourceHandle(uri, resourceType, ++this.resourceIdCounter);
    }

    // 2. 创建新条目
    entry = {
      data: null,
      state: ResourceState.Loading,
      refCount: 1,
      loadPromise: null,
      error: null,
    };
    cache.set(uri, entry);

    // 3. 异步加载
    entry.loadPromise = this.doLoadResource(loaderType, uri, entry);
    await entry.loadPromise;

    return createResourceHandle(uri, resourceType, ++this.resourceIdCounter);
  }

  /**
   * 执行实际加载（使用注册的加载器）
   */
  private async doLoadResource<T>(loaderType: string, uri: string, entry: ResourceEntry<T>): Promise<T> {
    // 优先使用自定义加载器
    const loader = this.loaders.get(loaderType) ?? this.defaultLoaders.get(loaderType);

    if (!loader) {
      const error = new Error(`No loader registered for type: ${loaderType}`);
      entry.state = ResourceState.Failed;
      entry.error = error;
      throw error;
    }

    try {
      const data = (await loader.load(uri, this.device!)) as T;
      entry.data = data;
      entry.state = ResourceState.Loaded;
      return data;
    } catch (error) {
      entry.state = ResourceState.Failed;
      entry.error = error instanceof Error ? error : new Error(String(error));
      throw entry.error;
    }
  }

  // ==================== 通用访问逻辑（Private）====================

  /**
   * 通用资源访问方法
   */
  private getResource<T>(
    handle: IResourceHandle,
    expectedType: ResourceType,
    cache: Map<string, ResourceEntry<T>>
  ): T | undefined {
    if (handle.type !== expectedType) {
      return undefined;
    }
    const entry = cache.get(handle.uri);
    return entry?.data ?? undefined;
  }

  // ==================== 通用释放逻辑（Private）====================

  /**
   * 通用资源释放方法
   */
  private releaseResource<T>(uri: string, cache: Map<string, ResourceEntry<T>>, cleanupFn: ResourceCleanupFn<T>): void {
    const entry = cache.get(uri);
    if (!entry) {
      return;
    }

    entry.refCount--;
    if (entry.refCount <= 0) {
      cleanupFn.call(this, entry);
      entry.state = ResourceState.Released;
      cache.delete(uri);
    }
  }

  /**
   * 强制释放单个资源
   */
  private forceReleaseResource<T>(
    uri: string,
    cache: Map<string, ResourceEntry<T>>,
    cleanupFn: ResourceCleanupFn<T>
  ): void {
    const entry = cache.get(uri);
    if (entry) {
      cleanupFn.call(this, entry);
      entry.state = ResourceState.Released;
      cache.delete(uri);
    }
  }

  /**
   * 释放所有指定类型的资源
   */
  private releaseAllResources<T>(cache: Map<string, ResourceEntry<T>>, cleanupFn: ResourceCleanupFn<T>): void {
    for (const entry of cache.values()) {
      cleanupFn.call(this, entry);
      entry.state = ResourceState.Released;
    }
    cache.clear();
  }

  // ==================== 资源清理函数（Private）====================

  /**
   * 清理网格资源条目
   */
  private cleanupMeshEntry(entry: ResourceEntry<IMeshResource>): void {
    if (entry.data) {
      try {
        entry.data.vertexBuffer?.destroy();
        entry.data.indexBuffer?.destroy();
      } catch (error) {
        console.warn('[ResourceManager] Failed to cleanup mesh GPU resources:', error);
      }
      entry.data = null;
    }
  }

  /**
   * 清理纹理资源条目
   */
  private cleanupTextureEntry(entry: ResourceEntry<ITextureResource>): void {
    if (entry.data) {
      try {
        entry.data.texture?.destroy();
      } catch (error) {
        console.warn('[ResourceManager] Failed to cleanup texture GPU resources:', error);
      }
      entry.data = null;
    }
  }

  /**
   * 清理材质资源条目
   */
  private cleanupMaterialEntry(entry: ResourceEntry<IMaterialResource>): void {
    if (entry.data) {
      // 材质可能引用纹理，但纹理由 TextureResource 管理
      // 这里只清理材质自身的数据
      entry.data = null;
    }
  }

  // ==================== 工具方法（Private）====================

  /**
   * 检查是否已销毁
   */
  private checkDisposed(): void {
    if (this._disposed) {
      throw new Error('ResourceManager has been disposed');
    }
  }
}
