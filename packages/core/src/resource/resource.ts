import { ReferResource } from '../base';

/**
 * 资源类型枚举
 */
export enum ResourceType {
  TEXTURE = 'texture',
  TEXTURE_2D = 'texture2d',
  TEXTURE_CUBE = 'textureCube',
  RENDER_TEXTURE = 'renderTexture',
  MODEL = 'model',
  GEOMETRY = 'geometry',
  MESH = 'mesh',
  AUDIO = 'audio',
  SHADER = 'shader',
  MATERIAL = 'material',
  FONT = 'font',
  JSON = 'json',
  TEXT = 'text',
  BINARY = 'binary',
  SCENE = 'scene',
  PREFAB = 'prefab',
  ANIMATION = 'animation',
  OTHER = 'other',
}

/**
 * 资源加载选项
 */
export interface ResourceLoadOptions {
  /** 是否异步加载 */
  async?: boolean;
  /** 超时时间(毫秒) */
  timeout?: number;
  /** 是否使用缓存 */
  useCache?: boolean;
  /** 重试次数 */
  retries?: number;
  /** 优先级 */
  priority?: number;
  /** 是否跨域 */
  crossOrigin?: boolean;
  /** 加载进度回调 */
  onProgress?: (loaded: number, total: number) => void;
  /** 自定义加载器 */
  loader?: IResourceLoader;
}

/**
 * 资源加载器接口
 */
export interface IResourceLoader {
  /** 支持的MIME类型 */
  readonly supportedMimeTypes: string[];
  /** 支持的文件扩展名 */
  readonly supportedExtensions: string[];

  /**
   * 检查是否支持该资源
   * @param url 资源URL
   * @param mimeType MIME类型
   */
  canLoad(url: string, mimeType?: string): boolean;

  /**
   * 加载资源
   * @param url 资源URL
   * @param options 加载选项
   */
  load(url: string, options?: ResourceLoadOptions): Promise<any>;
}

/**
 * 资源基类
 * 所有引擎资源的基础类，提供统一的资源管理接口
 */
export abstract class Resource extends ReferResource {
  /** 资源类型 */
  override readonly type: ResourceType;
  /** 资源URL */
  protected resourceUrl: string = '';
  /** 资源数据 */
  protected data: any = null;
  /** 加载状态 */
  protected loadState: ResourceLoadState = ResourceLoadState.UNLOADED;
  /** 引用计数 */
  protected resourceReferenceCount: number = 0;
  /** 资源大小(字节) */
  protected resourceSize: number = 0;
  /** 加载时间戳 */
  protected resourceLoadTime: number = 0;
  /** 创建时间戳 */
  protected resourceCreateTime: number = 0;
  /** 最后访问时间 */
  protected lastAccessTime: number = 0;
  /** 资源版本号 */
  protected version: number = 1;
  /** 资源元数据 */
  metadata: Record<string, any> = {};
  /** 资源依赖列表 */
  protected dependencies: Set<Resource> = new Set();
  /** 依赖此资源的资源列表 */
  protected dependents: Set<Resource> = new Set();

  /**
   * 创建资源
   * @param type 资源类型
   * @param name 资源名称
   */
  constructor(type: ResourceType, name?: string) {
    super();
    this.type = type;
    this.name = name || `${type}_${Date.now()}`;
    this.resourceCreateTime = Date.now();
    this.lastAccessTime = this.resourceCreateTime;
  }

  /**
   * 获取资源URL
   */
  override getUrl(): string {
    return this.resourceUrl;
  }

  /**
   * 设置资源URL
   * @param url 新的URL
   */
  override setUrl(url: string): void {
    this.resourceUrl = url;
  }

  /**
   * 获取资源数据
   */
  getData<T = any>(): T {
    this.lastAccessTime = Date.now();
    return this.data as T;
  }

  /**
   * 设置资源数据
   * @param data 资源数据
   */
  setData(data: any): void {
    this.data = data;
    this.lastAccessTime = Date.now();
    this.updateSize();
  }

  /**
   * 获取加载状态
   */
  getLoadState(): ResourceLoadState {
    return this.loadState;
  }

  /**
   * 设置加载状态
   * @param state 新的加载状态
   */
  protected setLoadState(state: ResourceLoadState): void {
    const oldState = this.loadState;
    this.loadState = state;

    if (state === ResourceLoadState.LOADED) {
      this.resourceLoadTime = Date.now();
    }

    this.onLoadStateChanged(oldState, state);
  }

  /**
   * 加载状态变化回调
   * @param oldState 旧状态
   * @param newState 新状态
   */
  protected onLoadStateChanged(oldState: ResourceLoadState, newState: ResourceLoadState): void {
    // 子类可以重写此方法来处理状态变化
  }

  // /**
  //  * 是否已加载
  //  */
  // override isLoaded(): boolean {
  //   return this.loadState === ResourceLoadState.LOADED;
  // }

  /**
   * 是否正在加载
   */
  isLoading(): boolean {
    return this.loadState === ResourceLoadState.LOADING;
  }

  /**
   * 是否加载失败
   */
  isFailed(): boolean {
    return this.loadState === ResourceLoadState.FAILED;
  }

  /**
   * 获取引用计数
   */
  getReferenceCount(): number {
    return this.resourceReferenceCount;
  }

  /**
   * 增加引用计数
   */
  addReference(): number {
    return ++this.resourceReferenceCount;
  }

  /**
   * 减少引用计数
   */
  removeReference(): number {
    this.resourceReferenceCount = Math.max(0, this.resourceReferenceCount - 1);
    return this.resourceReferenceCount;
  }

  /**
   * 获取资源大小
   */
  override getSize(): number {
    return this.resourceSize;
  }

  /**
   * 更新资源大小
   */
  protected updateSize(): void {
    // 子类应该重写此方法来计算实际大小
    if (this.data) {
      if (typeof this.data === 'string') {
        this.resourceSize = this.data.length * 2; // Unicode字符占用2字节
      } else if (this.data instanceof ArrayBuffer) {
        this.resourceSize = this.data.byteLength;
      } else if (this.data instanceof ImageData) {
        this.resourceSize = this.data.width * this.data.height * 4; // RGBA
      } else {
        this.resourceSize = JSON.stringify(this.data).length * 2;
      }
    } else {
      this.resourceSize = 0;
    }
  }

  /**
   * 获取加载时间
   */
  getLoadTime(): number {
    return this.resourceLoadTime;
  }

  /**
   * 获取创建时间
   */
  getCreateTime(): number {
    return this.resourceCreateTime;
  }

  /**
   * 获取最后访问时间
   */
  getLastAccessTime(): number {
    return this.lastAccessTime;
  }

  /**
   * 获取资源版本
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * 增加版本号
   */
  incrementVersion(): void {
    this.version++;
  }

  /**
   * 获取元数据
   * @param key 键名
   */
  getMetadata<T = any>(key: string): T | undefined {
    return this.metadata[key] as T;
  }

  /**
   * 设置元数据
   * @param key 键名
   * @param value 值
   */
  setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }

  /**
   * 移除元数据
   * @param key 键名
   */
  removeMetadata(key: string): void {
    delete this.metadata[key];
  }

  /**
   * 获取所有元数据
   */
  getAllMetadata(): Record<string, any> {
    return { ...this.metadata };
  }

  /**
   * 添加依赖资源
   * @param dependency 依赖的资源
   */
  addDependency(dependency: Resource): void {
    this.dependencies.add(dependency);
    dependency.dependents.add(this);
  }

  /**
   * 移除依赖资源
   * @param dependency 依赖的资源
   */
  removeDependency(dependency: Resource): void {
    this.dependencies.delete(dependency);
    dependency.dependents.delete(this);
  }

  /**
   * 获取所有依赖资源
   */
  getDependencies(): Set<Resource> {
    return new Set(this.dependencies);
  }

  /**
   * 获取所有依赖此资源的资源
   */
  getDependents(): Set<Resource> {
    return new Set(this.dependents);
  }

  /**
   * 检查是否依赖某个资源
   * @param resource 要检查的资源
   */
  hasDependency(resource: Resource): boolean {
    return this.dependencies.has(resource);
  }

  /**
   * 获取内存占用信息
   */
  getMemoryInfo() {
    return {
      size: this.resourceSize,
      referenceCount: this.resourceReferenceCount,
      dependencyCount: this.dependencies.size,
      dependentCount: this.dependents.size,
      loadTime: this.resourceLoadTime,
      createTime: this.resourceCreateTime,
      lastAccessTime: this.lastAccessTime,
      version: this.version,
    };
  }

  /**
   * 异步加载资源
   * @param url 资源URL
   * @param options 加载选项
   */
  async load(url: string, options?: ResourceLoadOptions): Promise<void> {
    if (this.loadState === ResourceLoadState.LOADED) {
      return;
    }

    if (this.loadState === ResourceLoadState.LOADING) {
      throw new Error(`Resource ${this.name} is already loading`);
    }

    this.setUrl(url);
    this.setLoadState(ResourceLoadState.LOADING);

    try {
      await this.loadImpl(url, options);
      this.setLoadState(ResourceLoadState.LOADED);
    } catch (error) {
      this.setLoadState(ResourceLoadState.FAILED);
      throw error;
    }
  }

  /**
   * 子类需要实现的加载方法
   * @param url 资源URL
   * @param options 加载选项
   */
  protected abstract loadImpl(url: string, options?: ResourceLoadOptions): Promise<void>;

  /**
   * 释放资源数据
   */
  override release(): number {
    if (this.loadState === ResourceLoadState.RELEASED) {
      return this.resourceReferenceCount;
    }

    // 清理数据
    this.onRelease();
    this.data = null;
    this.resourceSize = 0;
    this.setLoadState(ResourceLoadState.RELEASED);

    // 清理依赖关系
    for (const dependency of this.dependencies) {
      dependency.dependents.delete(this);
    }
    this.dependencies.clear();

    for (const dependent of this.dependents) {
      dependent.dependencies.delete(this);
    }
    this.dependents.clear();

    return this.resourceReferenceCount;
  }

  /**
   * 子类可以重写的释放回调
   */
  protected onRelease(): void {
    // 子类可以重写此方法来清理特定资源
  }

  /**
   * 销毁资源
   */
  override destroy(): void {
    this.release();
    super.destroy();
  }

  /**
   * 克隆资源
   */
  abstract clone(): Resource;

  /**
   * 序列化资源
   */
  serialize(): any {
    return {
      type: this.type,
      name: this.name,
      url: this.resourceUrl,
      version: this.version,
      metadata: this.metadata,
      createTime: this.resourceCreateTime,
    };
  }

  /**
   * 反序列化资源
   * @param data 序列化数据
   */
  deserialize(data: any): void {
    this.name = data.name || this.name;
    this.resourceUrl = data.url || this.resourceUrl;
    this.version = data.version || this.version;
    this.metadata = data.metadata || {};
    this.resourceCreateTime = data.createTime || this.resourceCreateTime;
  }

  /**
   * 获取资源名称
   */
  getName(): string {
    return this.name;
  }

  /**
   * 获取资源路径
   */
  getPath(): string {
    return this.resourceUrl || this.name;
  }

  /**
   * 标记资源为脏状态
   */
  markDirty(): void {
    this.incrementVersion();
  }
}
