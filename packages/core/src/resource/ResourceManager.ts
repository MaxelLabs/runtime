import { ReferResource } from '../base/ReferResource';

/**
 * 资源管理器，负责管理引擎中的所有资源
 */
export class ResourceManager {
  /** 资源映射表，按路径索引 */
  private _assetMap: Map<string, ReferResource> = new Map();
  /** 所有引用计数资源列表 */
  private _resources: Set<ReferResource> = new Set();
  /** 空闲资源清理的时间间隔（毫秒） */
  private _gcInterval: number = 30000; // 30秒
  /** 上次执行清理的时间 */
  private _lastGCTime: number = 0;
  /** 是否启用自动清理 */
  private _autoGC: boolean = true;

  /**
   * 构造函数
   */
  constructor() {
    // 初始化时记录时间戳
    this._lastGCTime = Date.now();
  }

  /**
   * 获取是否启用自动垃圾回收
   */
  get autoGC(): boolean {
    return this._autoGC;
  }

  /**
   * 设置是否启用自动垃圾回收
   */
  set autoGC(value: boolean) {
    this._autoGC = value;
  }

  /**
   * 获取垃圾回收间隔（毫秒）
   */
  get gcInterval(): number {
    return this._gcInterval;
  }

  /**
   * 设置垃圾回收间隔（毫秒）
   */
  set gcInterval(value: number) {
    this._gcInterval = Math.max(1000, value); // 最小1秒
  }

  /**
   * 注册资源
   * @internal
   * @param resource 要注册的资源
   */
  _addReferResource(resource: ReferResource): void {
    this._resources.add(resource);
  }

  /**
   * 取消注册资源
   * @internal
   * @param resource 要取消注册的资源
   */
  _deleteReferResource(resource: ReferResource): void {
    this._resources.delete(resource);
    
    // 从资源映射表中移除该资源的所有路径引用
    for (const [path, res] of this._assetMap.entries()) {
      if (res === resource) {
        this._assetMap.delete(path);
      }
    }
  }

  /**
   * 添加资源到资源映射表
   * @internal
   * @param path 资源路径
   * @param resource 资源对象
   */
  _addAsset(path: string, resource: ReferResource): void {
    this._assetMap.set(path, resource);
  }

  /**
   * 通过路径获取资源
   * @param path 资源路径
   * @returns 资源对象，如果不存在则返回null
   */
  getAsset<T extends ReferResource>(path: string): T | null {
    return this._assetMap.get(path) as T || null;
  }

  /**
   * 加载资源并返回
   * @param path 资源路径
   * @param type 资源类型
   * @returns Promise
   */
  async loadAsset<T extends ReferResource>(path: string, type: new (...args: any[]) => T): Promise<T> {
    // 先检查是否已加载
    const existingAsset = this.getAsset<T>(path);
    if (existingAsset) {
      return existingAsset;
    }
    
    // 根据文件类型判断加载方式
    try {
      // 在实际实现中，这里需要根据不同的资源类型使用不同的加载方法
      // 例如，对于纹理可以使用Texture2D.loadFromURL，对于模型可以使用ModelLoader等
      
      // 这里只是一个示例，实际实现会更复杂
      const asset = new type();
      // 调用资产的加载方法，例如texture.loadFromURL(path)
      if (typeof (asset as any).loadFromURL === 'function') {
        await (asset as any).loadFromURL(path);
      }
      
      // 注册资源
      this._addAsset(path, asset);
      
      return asset;
    } catch (error) {
      console.error(`Failed to load asset: ${path}`, error);
      throw error;
    }
  }

  /**
   * 释放指定路径的资源
   * @param path 资源路径
   * @param force 是否强制释放
   * @returns 是否成功释放
   */
  releaseAsset(path: string, force: boolean = false): boolean {
    const asset = this._assetMap.get(path);
    if (!asset) {
      return false;
    }
    
    // 从映射表中移除
    this._assetMap.delete(path);
    
    // 尝试销毁资源
    return asset.destroy(force);
  }

  /**
   * 执行资源垃圾回收
   * 释放没有引用的资源
   * @returns 清理的资源数量
   */
  gc(): number {
    this._lastGCTime = Date.now();
    let count = 0;
    
    // 收集可以释放的资源
    const toRelease: ReferResource[] = [];
    
    for (const resource of this._resources) {
      // 跳过被标记为忽略GC的资源
      if (resource.isGCIgnored) {
        continue;
      }
      
      // 引用计数为0的资源可以释放
      if (resource.refCount === 0) {
        toRelease.push(resource);
      }
    }
    
    // 释放资源
    for (const resource of toRelease) {
      // 尝试销毁资源
      if (resource.destroy(false)) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * 更新资源管理器
   * 如果启用了自动GC，会在指定间隔执行垃圾回收
   */
  update(): void {
    if (this._autoGC) {
      const now = Date.now();
      if (now - this._lastGCTime > this._gcInterval) {
        this.gc();
      }
    }
  }

  /**
   * 获取当前加载的资源数量
   */
  getAssetCount(): number {
    return this._assetMap.size;
  }

  /**
   * 获取当前内存中的所有资源数量
   */
  getResourceCount(): number {
    return this._resources.size;
  }

  /**
   * 清空所有资源
   * @param force 是否强制清除所有资源，包括有引用的资源
   */
  clear(force: boolean = false): void {
    // 先清空资源映射表
    this._assetMap.clear();
    
    // 复制一份资源列表，因为在销毁过程中会修改原始集合
    const resources = [...this._resources];
    
    // 销毁所有资源
    for (const resource of resources) {
      resource.destroy(force);
    }
    
    // 确保所有资源都已被移除
    this._resources.clear();
  }
} 