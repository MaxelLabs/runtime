import { EventDispatcher } from '../base/event-dispatcher';
import { Container, ServiceKeys } from '../base/IOC';
import { ObjectPool } from '../base/object-pool';
import type { Resource, ResourceType, IResourceLoader, ResourceLoadOptions } from './resource';
import { ResourceLoadState } from './resource';

/**
 * 资源管理器事件类型
 */
export enum ResourceManagerEvent {
  /** 资源加载开始 */
  LOAD_START = 'loadStart',
  /** 资源加载进度 */
  LOAD_PROGRESS = 'loadProgress',
  /** 资源加载完成 */
  LOAD_COMPLETE = 'loadComplete',
  /** 资源加载失败 */
  LOAD_ERROR = 'loadError',
  /** 资源释放 */
  RESOURCE_RELEASED = 'resourceReleased',
  /** 资源销毁 */
  RESOURCE_DESTROYED = 'resourceDestroyed',
  /** 缓存清理 */
  CACHE_CLEARED = 'cacheCleared',
}

/**
 * 资源缓存配置
 */
export interface ResourceCacheConfig {
  /** 最大缓存大小（字节） */
  maxSize: number;
  /** 最大缓存项数 */
  maxItems: number;
  /** 缓存过期时间（毫秒） */
  maxAge: number;
  /** 是否启用LRU策略 */
  enableLRU: boolean;
}

/**
 * 资源加载统计
 */
export interface ResourceLoadStats {
  /** 总加载次数 */
  totalLoads: number;
  /** 成功加载次数 */
  successfulLoads: number;
  /** 失败加载次数 */
  failedLoads: number;
  /** 缓存命中次数 */
  cacheHits: number;
  /** 总加载时间（毫秒） */
  totalLoadTime: number;
  /** 平均加载时间（毫秒） */
  averageLoadTime: number;
}

/**
 * 资源管理器
 * 负责资源的加载、缓存、引用计数和生命周期管理
 */
export class ResourceManager extends EventDispatcher {
  /** 资源缓存 */
  private resources: Map<string, Resource> = new Map();
  /** 资源加载器映射 */
  private loaders: Map<string, IResourceLoader> = new Map();
  /** 加载中的资源 */
  private loadingResources: Map<string, Promise<Resource>> = new Map();
  /** 缓存配置 */
  private cacheConfig: ResourceCacheConfig;
  /** 加载统计 */
  private loadStats: ResourceLoadStats;
  /** IOC容器 */
  private container: Container;
  /** 资源引用映射 */
  private resourceRefs: Map<string, Set<object>> = new Map();
  /** 临时数组对象池 */
  private static readonly arrayPool = new ObjectPool<Resource[]>(
    'resourceManagerArrayPool',
    () => [],
    (array) => (array.length = 0),
    2,
    10
  );

  /**
   * 创建资源管理器
   * @param cacheConfig 缓存配置
   */
  constructor(cacheConfig?: Partial<ResourceCacheConfig>) {
    super();

    this.container = Container.getInstance();
    this.container.register(ServiceKeys.RESOURCE_MANAGER, this);

    // 默认缓存配置
    this.cacheConfig = {
      maxSize: 100 * 1024 * 1024, // 100MB
      maxItems: 1000,
      maxAge: 30 * 60 * 1000, // 30分钟
      enableLRU: true,
      ...cacheConfig,
    };

    // 初始化统计信息
    this.loadStats = {
      totalLoads: 0,
      successfulLoads: 0,
      failedLoads: 0,
      cacheHits: 0,
      totalLoadTime: 0,
      averageLoadTime: 0,
    };
  }

  /**
   * 注册资源加载器
   * @param mimeType MIME类型或文件扩展名
   * @param loader 加载器实例
   */
  registerLoader(mimeType: string, loader: IResourceLoader): void {
    this.loaders.set(mimeType.toLowerCase(), loader);
  }

  /**
   * 获取资源加载器
   * @param url 资源URL
   * @returns 加载器实例或null
   */
  private getLoader(url: string): IResourceLoader | null {
    // 尝试从文件扩展名获取加载器
    const extension = url.split('.').pop()?.toLowerCase();
    if (extension && this.loaders.has(extension)) {
      return this.loaders.get(extension)!;
    }

    // 遍历所有加载器，找到支持该URL的加载器
    for (const loader of this.loaders.values()) {
      if (loader.canLoad(url)) {
        return loader;
      }
    }

    return null;
  }

  /**
   * 异步加载资源
   * @param url 资源URL
   * @param type 资源类型
   * @param options 加载选项
   * @returns Promise<Resource>
   */
  async loadAsync<T extends Resource>(url: string, type: ResourceType, options?: ResourceLoadOptions): Promise<T> {
    const cacheKey = this.getCacheKey(url, type);

    // 检查缓存
    const cachedResource = this.resources.get(cacheKey);
    if (cachedResource && cachedResource.isLoaded) {
      this.loadStats.cacheHits++;
      return cachedResource as T;
    }

    // 检查是否正在加载
    const loadingPromise = this.loadingResources.get(cacheKey);
    if (loadingPromise) {
      return loadingPromise as Promise<T>;
    }

    // 开始加载
    const loadPromise = this.performLoad<T>(url, type, options);
    this.loadingResources.set(cacheKey, loadPromise);

    try {
      const resource = await loadPromise;
      this.loadingResources.delete(cacheKey);
      return resource;
    } catch (error) {
      this.loadingResources.delete(cacheKey);
      throw error;
    }
  }

  /**
   * 执行实际的资源加载
   * @param url 资源URL
   * @param type 资源类型
   * @param options 加载选项
   * @private
   */
  private async performLoad<T extends Resource>(
    url: string,
    type: ResourceType,
    options?: ResourceLoadOptions
  ): Promise<T> {
    const startTime = performance.now();
    const cacheKey = this.getCacheKey(url, type);

    this.loadStats.totalLoads++;
    this.dispatchEvent(ResourceManagerEvent.LOAD_START, { url, type });

    try {
      // 获取加载器
      const loader = options?.loader || this.getLoader(url);
      if (!loader) {
        throw new Error(`No loader found for resource: ${url}`);
      }

      // 加载资源数据
      const data = await loader.load(url, options);

      // 创建资源实例（需要具体的资源类型工厂）
      const resource = await this.createResource<T>(type, url, data);

      // 缓存资源
      this.cacheResource(cacheKey, resource);

      // 更新统计信息
      const loadTime = performance.now() - startTime;
      this.loadStats.successfulLoads++;
      this.loadStats.totalLoadTime += loadTime;
      this.loadStats.averageLoadTime = this.loadStats.totalLoadTime / this.loadStats.totalLoads;

      this.dispatchEvent(ResourceManagerEvent.LOAD_COMPLETE, { url, type, resource, loadTime });
      return resource;
    } catch (error) {
      this.loadStats.failedLoads++;
      this.dispatchEvent(ResourceManagerEvent.LOAD_ERROR, { url, type, error });
      throw error;
    }
  }

  /**
   * 创建资源实例
   * @param type 资源类型
   * @param url 资源URL
   * @param data 资源数据
   * @private
   */
  private async createResource<T extends Resource>(type: ResourceType, url: string, data: any): Promise<T> {
    // TODO: 实现资源工厂模式
    // 这里应该根据type创建相应的资源实例
    throw new Error('Resource factory not implemented yet');
  }

  /**
   * 缓存资源
   * @param key 缓存键
   * @param resource 资源实例
   * @private
   */
  private cacheResource(key: string, resource: Resource): void {
    // 检查缓存大小限制
    if (this.shouldEvictCache()) {
      this.evictLRU();
    }

    this.resources.set(key, resource);
  }

  /**
   * 获取缓存键
   * @param url 资源URL
   * @param type 资源类型
   * @private
   */
  private getCacheKey(url: string, type: ResourceType): string {
    return `${type}:${url}`;
  }

  /**
   * 检查是否需要清理缓存
   * @private
   */
  private shouldEvictCache(): boolean {
    if (this.resources.size >= this.cacheConfig.maxItems) {
      return true;
    }

    let totalSize = 0;
    for (const resource of this.resources.values()) {
      totalSize += resource.getSize();
    }

    return totalSize >= this.cacheConfig.maxSize;
  }

  /**
   * LRU缓存清理
   * @private
   */
  private evictLRU(): void {
    if (!this.cacheConfig.enableLRU) {
      return;
    }

    // 找到最久未使用的资源
    let oldestResource: Resource | null = null;
    let oldestTime = Date.now();

    for (const resource of this.resources.values()) {
      const lastAccess = resource.getLastAccessTime();
      if (lastAccess < oldestTime) {
        oldestTime = lastAccess;
        oldestResource = resource;
      }
    }

    if (oldestResource) {
      this.releaseResource(oldestResource);
    }
  }

  /**
   * 获取资源
   * @param url 资源URL
   * @param type 资源类型
   */
  getResource<T extends Resource>(url: string, type: ResourceType): T | null {
    const cacheKey = this.getCacheKey(url, type);
    return (this.resources.get(cacheKey) as T) || null;
  }

  /**
   * 释放资源
   * @param resource 资源实例
   */
  releaseResource(resource: Resource): void {
    // 减少引用计数
    const refCount = resource.removeReference();

    if (refCount <= 0) {
      // 从缓存中移除
      for (const [key, cachedResource] of this.resources.entries()) {
        if (cachedResource === resource) {
          this.resources.delete(key);
          break;
        }
      }

      // 释放资源
      resource.release();

      this.dispatchEvent(ResourceManagerEvent.RESOURCE_RELEASED, { resource });
    }
  }

  /**
   * 清理缓存
   * @param force 是否强制清理所有资源
   */
  clearCache(force: boolean = false): void {
    const resourcesToRemove: Resource[] = [];

    for (const [key, resource] of this.resources.entries()) {
      if (force || resource.getReferenceCount() <= 0) {
        resourcesToRemove.push(resource);
        this.resources.delete(key);
      }
    }

    // 释放资源
    for (const resource of resourcesToRemove) {
      resource.release();
    }

    this.dispatchEvent(ResourceManagerEvent.CACHE_CLEARED, {
      clearedCount: resourcesToRemove.length,
      force,
    });
  }

  /**
   * 获取加载统计信息
   */
  getLoadStats(): ResourceLoadStats {
    return { ...this.loadStats };
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    let totalSize = 0;
    let totalRefs = 0;

    for (const resource of this.resources.values()) {
      totalSize += resource.getSize();
      totalRefs += resource.getReferenceCount();
    }

    return {
      itemCount: this.resources.size,
      totalSize,
      totalReferences: totalRefs,
      maxSize: this.cacheConfig.maxSize,
      maxItems: this.cacheConfig.maxItems,
    };
  }

  /**
   * 销毁资源管理器
   */
  override destroy(): void {
    // 清理所有资源
    this.clearCache(true);

    // 清理加载器
    this.loaders.clear();
    this.loadingResources.clear();
    this.resourceRefs.clear();

    // 从IOC容器移除
    this.container.remove(ServiceKeys.RESOURCE_MANAGER);

    super.destroy();
  }
}
