import { EventDispatcher } from '../base/event-dispatcher';
import type { Resource, ResourceType } from './ResourceManager';
import { ResourceLoadState } from './ResourceManager';
import type { Engine } from '../Engine';

/**
 * 资源管理器事件类型
 */
export enum ResourceManagerEventType {
  /** 资源加载完成 */
  RESOURCE_LOADED = 'resource-loaded',
  /** 资源加载失败 */
  RESOURCE_LOAD_FAILED = 'resource-load-failed',
  /** 资源被释放 */
  RESOURCE_RELEASED = 'resource-released',
  /** 资源加载中 */
  RESOURCE_LOADING = 'resource-loading',
  /** 资源缺失 */
  RESOURCE_MISSING = 'resource-missing',
  /** 垃圾回收开始 */
  GC_START = 'gc-start',
  /** 垃圾回收完成 */
  GC_COMPLETE = 'gc-complete'
}

/**
 * 增强的资源管理器，提供更完善的资源生命周期管理和性能优化
 */
export class EnhancedResourceManager extends EventDispatcher {
  /** 引擎实例 */
  private engine: Engine;
  /** 资源缓存 */
  private cache: Map<string, Resource> = new Map();
  /** 资源加载状态 */
  private loadingPromises: Map<string, Promise<Resource>> = new Map();
  /** 资源加载计数 */
  private loadingCounter: number = 0;
  /** 内置资源 */
  private builtins: Map<string, Resource> = new Map();
  /** 默认资源 */
  private defaults: Map<ResourceType, Resource> = new Map();
  /** 资源别名映射 */
  private aliases: Map<string, string> = new Map();
  /** 资源依赖关系图 */
  private dependencies: Map<string, Set<string>> = new Map();
  /** 引用资源的对象 */
  private references: Map<string, Set<any>> = new Map();
  /** 是否进行垃圾回收 */
  private isGarbageCollecting: boolean = false;
  /** 自动垃圾回收间隔 (毫秒) */
  private gcInterval: number = 30000;
  /** 上次垃圾回收时间 */
  private lastGCTime: number = 0;
  /** 资源预加载队列 */
  private preloadQueue: Array<{ type: ResourceType, path: string, priority: number }> = [];
  /** 是否开启自动垃圾回收 */
  private autoGC: boolean = true;
  /** 资源加载策略 */
  private loadingStrategy: 'sequential' | 'concurrent' = 'concurrent';
  /** 最大并发加载数 */
  private maxConcurrentLoads: number = 8;

  /**
   * 创建增强的资源管理器
   * @param engine 引擎实例
   */
  constructor (engine: Engine) {
    super();
    this.engine = engine;
  }

  /**
   * 获取资源
   * @param path 资源路径
   * @returns 资源对象，如果不存在则返回null
   */
  getResource (path: string): Resource | null {
    // 检查路径别名
    const actualPath = this.aliases.get(path) || path;

    // 检查内置资源
    if (this.builtins.has(actualPath)) {
      return this.builtins.get(actualPath);
    }

    // 检查缓存
    if (this.cache.has(actualPath)) {
      return this.cache.get(actualPath);
    }

    return null;
  }

  /**
   * 异步加载资源
   * @param type 资源类型
   * @param path 资源路径
   * @param options 加载选项
   * @returns 资源加载Promise
   */
  loadResource<T extends Resource>(
    type: ResourceType,
    path: string,
    options: {
      cache?: boolean,
      priority?: number,
      onProgress?: (progress: number) => void,
      timeout?: number,
    } = {}
  ): Promise<T> {
    const actualPath = this.aliases.get(path) || path;

    // 设置默认选项
    const defaultOptions = {
      cache: true,
      priority: 0,
      timeout: 30000,
    };

    const finalOptions = { ...defaultOptions, ...options };

    // 检查是否已加载
    const existingResource = this.getResource(actualPath);

    if (existingResource && existingResource.loadState === ResourceLoadState.Loaded) {
      return Promise.resolve(existingResource as T);
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(actualPath)) {
      return this.loadingPromises.get(actualPath) as Promise<T>;
    }

    // 创建加载Promise
    const loadPromise = new Promise<T>((resolve, reject) => {
      // 增加加载计数
      this.loadingCounter++;

      // 创建资源实例
      const resource = this.createResourceInstance(type, actualPath);

      // 更新资源状态
      resource.loadState = ResourceLoadState.Loading;

      // 触发加载事件
      this.dispatchEvent(ResourceManagerEventType.RESOURCE_LOADING, { resource });

      // 设置超时计时器
      const timeoutId = setTimeout(() => {
        if (resource.loadState === ResourceLoadState.Loading) {
          resource.loadState = ResourceLoadState.Failed;
          this.dispatchEvent(ResourceManagerEventType.RESOURCE_LOAD_FAILED, {
            resource,
            error: new Error(`Resource load timeout: ${actualPath}`),
          });
          reject(new Error(`Resource load timeout: ${actualPath}`));
        }
      }, finalOptions.timeout);

      // 加载资源
      resource.load().then(() => {
        // 清除超时计时器
        clearTimeout(timeoutId);

        // 更新状态
        resource.loadState = ResourceLoadState.Loaded;

        // 如果需要缓存，则添加到缓存中
        if (finalOptions.cache) {
          this.cache.set(actualPath, resource);
        }

        // 减少加载计数
        this.loadingCounter--;

        // 触发加载完成事件
        this.dispatchEvent(ResourceManagerEventType.RESOURCE_LOADED, { resource });

        // 完成Promise
        resolve(resource as T);

        // 从加载Promise映射中移除
        this.loadingPromises.delete(actualPath);

      }).catch(error => {
        // 清除超时计时器
        clearTimeout(timeoutId);

        // 更新状态
        resource.loadState = ResourceLoadState.Failed;

        // 减少加载计数
        this.loadingCounter--;

        // 触发加载失败事件
        this.dispatchEvent(ResourceManagerEventType.RESOURCE_LOAD_FAILED, { resource, error });

        // 拒绝Promise
        reject(error);

        // 从加载Promise映射中移除
        this.loadingPromises.delete(actualPath);
      });
    });

    // 存储加载Promise
    this.loadingPromises.set(actualPath, loadPromise);

    return loadPromise;
  }

  /**
   * 创建资源实例
   * @param type 资源类型
   * @param path 资源路径
   * @returns 资源实例
   */
  private createResourceInstance (type: ResourceType, path: string): Resource {
    // 此方法需要实现具体的资源创建逻辑
    // 简化示例，实际实现需根据不同类型创建不同资源
    return {
      type,
      path,
      name: path.split('/').pop(),
      loadState: ResourceLoadState.Unloaded,
      isInternal: false,
      referenceCount: 0,
      isGCIgnored: false,
      load: () => Promise.resolve(null),
      unload: () => {},
      destroy: () => {},
    } as Resource;
  }

  /**
   * 增加资源引用计数
   * @param resource 资源
   * @param owner 引用资源的对象
   */
  addReference (resource: Resource, owner: any): void {
    if (!resource) {return;}

    // 增加资源引用计数
    resource.referenceCount++;

    // 更新引用映射
    if (!this.references.has(resource.path)) {
      this.references.set(resource.path, new Set());
    }

    this.references.get(resource.path).add(owner);
  }

  /**
   * 减少资源引用计数
   * @param resource 资源
   * @param owner 引用资源的对象
   */
  removeReference (resource: Resource, owner: any): void {
    if (!resource) {return;}

    // 减少资源引用计数
    resource.referenceCount = Math.max(0, resource.referenceCount - 1);

    // 更新引用映射
    const refs = this.references.get(resource.path);

    if (refs) {
      refs.delete(owner);

      // 如果没有引用了，移除映射
      if (refs.size === 0) {
        this.references.delete(resource.path);
      }
    }
  }

  /**
   * 释放资源
   * @param resource 要释放的资源
   * @param force 是否强制释放，即使引用计数大于0
   */
  releaseResource (resource: Resource, force: boolean = false): void {
    if (!resource) {return;}

    // 内置资源不释放
    if (resource.isInternal) {return;}

    // 如果引用计数大于0且不强制释放，则不执行
    if (resource.referenceCount > 0 && !force) {return;}

    // 从缓存中移除
    this.cache.delete(resource.path);

    // 清理引用
    this.references.delete(resource.path);

    // 卸载资源
    resource.unload();

    // 触发资源释放事件
    this.dispatchEvent(ResourceManagerEventType.RESOURCE_RELEASED, { resource });

    // 检查依赖资源
    this.releaseDependencies(resource.path);
  }

  /**
   * 释放依赖资源
   * @param parentPath 父资源路径
   */
  private releaseDependencies (parentPath: string): void {
    const deps = this.dependencies.get(parentPath);

    if (!deps) {return;}

    // 遍历所有依赖
    for (const depPath of deps) {
      const depResource = this.getResource(depPath);

      if (depResource) {
        // 减少引用计数
        depResource.referenceCount = Math.max(0, depResource.referenceCount - 1);

        // 如果引用计数为0且不忽略GC，则尝试释放
        if (depResource.referenceCount === 0 && !depResource.isGCIgnored) {
          this.releaseResource(depResource);
        }
      }
    }

    // 清除依赖关系
    this.dependencies.delete(parentPath);
  }

  /**
   * 垃圾回收，释放未被引用的资源
   */
  garbageCollect (): void {
    // 如果已经在进行GC，则不执行
    if (this.isGarbageCollecting) {return;}

    this.isGarbageCollecting = true;
    this.dispatchEvent(ResourceManagerEventType.GC_START);

    // 收集要释放的资源
    const toRelease: Resource[] = [];

    // 检查所有缓存的资源
    for (const [path, resource] of this.cache.entries()) {
      // 跳过内置资源和GC忽略的资源
      if (resource.isInternal || resource.isGCIgnored) {continue;}

      // 如果引用计数为0，则添加到释放列表
      if (resource.referenceCount === 0) {
        toRelease.push(resource);
      }
    }

    // 释放资源
    for (const resource of toRelease) {
      this.releaseResource(resource);
    }

    // 更新上次GC时间
    this.lastGCTime = Date.now();

    this.isGarbageCollecting = false;
    this.dispatchEvent(ResourceManagerEventType.GC_COMPLETE, { releasedCount: toRelease.length });
  }

  /**
   * 更新资源管理器，进行自动垃圾回收
   * @param time 当前时间戳
   */
  update (time: number): void {
    // 如果启用了自动GC，并且超过了GC间隔，则执行GC
    if (this.autoGC && time - this.lastGCTime > this.gcInterval) {
      this.garbageCollect();
    }

    // 处理预加载队列
    this.processPreloadQueue();
  }

  /**
   * 处理预加载队列
   */
  private processPreloadQueue (): void {
    // 如果队列为空或达到最大并发数，则不处理
    if (this.preloadQueue.length === 0 || this.loadingCounter >= this.maxConcurrentLoads) {
      return;
    }

    // 按优先级排序
    this.preloadQueue.sort((a, b) => b.priority - a.priority);

    // 根据加载策略处理
    if (this.loadingStrategy === 'sequential') {
      // 顺序加载一个资源
      if (this.loadingCounter === 0) {
        const item = this.preloadQueue.shift();

        this.loadResource(item.type, item.path, { priority: item.priority });
      }
    } else {
      // 并发加载多个资源
      const availableSlots = this.maxConcurrentLoads - this.loadingCounter;

      for (let i = 0; i < Math.min(availableSlots, this.preloadQueue.length); i++) {
        const item = this.preloadQueue.shift();

        this.loadResource(item.type, item.path, { priority: item.priority });
      }
    }
  }

  /**
   * 添加资源到预加载队列
   * @param type 资源类型
   * @param path 资源路径
   * @param priority 加载优先级
   */
  preloadResource (type: ResourceType, path: string, priority: number = 0): void {
    this.preloadQueue.push({ type, path, priority });
  }

  /**
   * 设置资源别名
   * @param alias 别名
   * @param path 实际路径
   */
  setAlias (alias: string, path: string): void {
    this.aliases.set(alias, path);
  }

  /**
   * 获取资源别名的实际路径
   * @param alias 别名
   * @returns 实际路径
   */
  getAliasPath (alias: string): string {
    return this.aliases.get(alias) || alias;
  }

  /**
   * 设置资源依赖关系
   * @param parentPath 父资源路径
   * @param dependencies 依赖资源路径数组
   */
  setDependencies (parentPath: string, dependencies: string[]): void {
    // 创建依赖集合
    if (!this.dependencies.has(parentPath)) {
      this.dependencies.set(parentPath, new Set());
    }

    const deps = this.dependencies.get(parentPath);

    // 添加每个依赖
    for (const depPath of dependencies) {
      deps.add(depPath);

      // 获取依赖资源并增加引用计数
      const depResource = this.getResource(depPath);

      if (depResource) {
        depResource.referenceCount++;
      }
    }
  }

  /**
   * 销毁资源管理器
   */
  destroy (): void {
    // 释放所有资源
    for (const [path, resource] of this.cache.entries()) {
      if (!resource.isInternal) {
        resource.unload();
        resource.destroy();
      }
    }

    // 清空映射
    this.cache.clear();
    this.loadingPromises.clear();
    this.builtins.clear();
    this.defaults.clear();
    this.aliases.clear();
    this.dependencies.clear();
    this.references.clear();
    this.preloadQueue = [];

    // 移除所有事件监听器
    this.removeAllEventListeners();
  }
}