import { MaxObject } from '../base/max-object';
import { Container, ServiceKeys } from '../base/IOC';
import { EventDispatcher } from '../base/event-dispatcher';
import { Texture2D } from '../texture/Texture2D';
import { Mesh } from '../geometry/Mesh';
import { Material } from '../material/Material';
import { Shader } from '../shader/Shader';
import { Engine } from '../Engine';

/**
 * 资源类型枚举
 */
export enum ResourceType {
  TEXTURE = 'texture',
  MODEL = 'model',
  AUDIO = 'audio',
  SHADER = 'shader',
  MATERIAL = 'material',
  FONT = 'font',
  JSON = 'json',
  TEXT = 'text',
  BINARY = 'binary',
  OTHER = 'other'
}

/**
 * 资源加载状态枚举
 */
export enum ResourceLoadState {
  /** 未加载 */
  Unloaded,
  /** 加载中 */
  Loading,
  /** 已加载 */
  Loaded,
  /** 加载失败 */
  Failed
}

/**
 * 资源接口
 */
export interface IResource {
  /** 资源ID */
  id: string;
  /** 资源名称 */
  name: string;
  /** 资源类型 */
  type: ResourceType;
  /** 资源URL */
  url: string;
  /** 资源数据 */
  data: any;
  /** 是否已加载 */
  loaded: boolean;
  /** 引用计数 */
  referenceCount: number;
  /** 资源大小(字节) */
  size: number;
  /** 加载时间戳 */
  loadTime: number;
  /** 销毁资源 */
  destroy(): void;
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
}

/**
 * 资源管理器
 * 负责资源的加载、缓存和管理
 */
export class ResourceManager extends EventDispatcher {
  /** 资源缓存 */
  private resources: Map<string, IResource> = new Map();
  /** 正在加载的资源 */
  private loadingResources: Map<string, Promise<IResource>> = new Map();
  /** 资源别名映射 */
  private aliases: Map<string, string> = new Map();
  /** 默认资源加载选项 */
  private defaultOptions: ResourceLoadOptions = {
    async: true,
    timeout: 10000,
    useCache: true,
    retries: 3,
    priority: 0,
    crossOrigin: true
  };
  /** IOC容器 */
  private container: Container;

  /**
   * 创建资源管理器
   */
  constructor() {
    super();
    this.container = Container.getInstance();
    
    // 注册到IOC容器
    this.container.register(ServiceKeys.RESOURCE_MANAGER, this);
  }

  /**
   * 加载资源
   * @param url 资源URL
   * @param type 资源类型
   * @param options 加载选项
   * @returns 加载的资源
   */
  async load(url: string, type: ResourceType, options?: ResourceLoadOptions): Promise<IResource> {
    const finalOptions = { ...this.defaultOptions, ...options };
    const resourceId = this.getResourceIdFromUrl(url);
    
    // 检查资源是否已缓存
    if (finalOptions.useCache && this.resources.has(resourceId)) {
      const resource = this.resources.get(resourceId)!;
      resource.referenceCount++;
      return resource;
    }
    
    // 检查是否正在加载
    if (this.loadingResources.has(resourceId)) {
      return this.loadingResources.get(resourceId)!;
    }
    
    // 创建加载Promise
    const loadPromise = this.loadResource(url, type, finalOptions);
    
    // 记录正在加载的资源
    this.loadingResources.set(resourceId, loadPromise);
    
    try {
      // 等待加载完成
      const resource = await loadPromise;
      
      // 从加载列表中移除
      this.loadingResources.delete(resourceId);
      
      // 缓存资源
      this.resources.set(resourceId, resource);
      
      // 派发加载完成事件
      this.dispatchEvent('resourceLoaded', { resource });
      
      return resource;
    } catch (error) {
      // 从加载列表中移除
      this.loadingResources.delete(resourceId);
      
      // 派发加载失败事件
      this.dispatchEvent('resourceLoadError', { url, type, error });
      
      throw error;
    }
  }

  /**
   * 加载资源的实际实现
   * @param url 资源URL
   * @param type 资源类型
   * @param options 加载选项
   * @returns 加载的资源
   */
  private async loadResource(url: string, type: ResourceType, options: ResourceLoadOptions): Promise<IResource> {
    const startTime = Date.now();
    let data: any = null;
    let size: number = 0;
    
    // 根据资源类型使用不同的加载方法
    switch (type) {
      case ResourceType.TEXTURE:
        data = await this.loadTexture(url, options);
        break;
      case ResourceType.MODEL:
        data = await this.loadModel(url, options);
        break;
      case ResourceType.AUDIO:
        data = await this.loadAudio(url, options);
        break;
      case ResourceType.SHADER:
        data = await this.loadShader(url, options);
        break;
      case ResourceType.JSON:
        data = await this.loadJSON(url, options);
        break;
      case ResourceType.TEXT:
        data = await this.loadText(url, options);
        break;
      case ResourceType.BINARY:
        data = await this.loadBinary(url, options);
        break;
      default:
        throw new Error(`Unsupported resource type: ${type}`);
    }
    
    // 创建资源对象
    const resource: IResource = {
      id: this.getResourceIdFromUrl(url),
      name: this.getResourceNameFromUrl(url),
      type,
      url,
      data,
      loaded: true,
      referenceCount: 1,
      size,
      loadTime: Date.now() - startTime,
      destroy: () => {
        // 特定资源类型的销毁逻辑
        switch (type) {
          case ResourceType.TEXTURE:
            // 销毁纹理
            break;
          case ResourceType.AUDIO:
            // 销毁音频
            break;
          // 其他资源类型的销毁逻辑...
        }
        
        // 从缓存中移除
        this.resources.delete(resource.id);
      }
    };
    
    return resource;
  }

  /**
   * 加载纹理
   * @param url 纹理URL
   * @param options 加载选项
   * @returns 加载的纹理数据
   */
  private async loadTexture(url: string, options: ResourceLoadOptions): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      
      if (options.crossOrigin) {
        image.crossOrigin = 'anonymous';
      }
      
      // 设置超时
      const timeoutId = options.timeout 
        ? setTimeout(() => reject(new Error(`Texture load timeout: ${url}`)), options.timeout) 
        : null;
      
      image.onload = () => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(image);
      };
      
      image.onerror = () => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(new Error(`Failed to load texture: ${url}`));
      };
      
      image.src = url;
    });
  }

  /**
   * 加载模型
   * @param url 模型URL
   * @param options 加载选项
   * @returns 加载的模型数据
   */
  private async loadModel(url: string, options: ResourceLoadOptions): Promise<ArrayBuffer> {
    return this.loadBinary(url, options);
  }

  /**
   * 加载音频
   * @param url 音频URL
   * @param options 加载选项
   * @returns 加载的音频数据
   */
  private async loadAudio(url: string, options: ResourceLoadOptions): Promise<AudioBuffer> {
    // 音频加载需要AudioContext，这里简化处理
    return Promise.resolve({} as AudioBuffer);
  }

  /**
   * 加载着色器
   * @param url 着色器URL
   * @param options 加载选项
   * @returns 加载的着色器代码
   */
  private async loadShader(url: string, options: ResourceLoadOptions): Promise<string> {
    return this.loadText(url, options);
  }

  /**
   * 加载JSON
   * @param url JSON文件URL
   * @param options 加载选项
   * @returns 解析后的JSON对象
   */
  private async loadJSON(url: string, options: ResourceLoadOptions): Promise<any> {
    const text = await this.loadText(url, options);
    return JSON.parse(text);
  }

  /**
   * 加载文本
   * @param url 文本文件URL
   * @param options 加载选项
   * @returns 加载的文本内容
   */
  private async loadText(url: string, options: ResourceLoadOptions): Promise<string> {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to load text: ${url}, status: ${response.status}`);
    }
    
    return response.text();
  }

  /**
   * 加载二进制数据
   * @param url 二进制文件URL
   * @param options 加载选项
   * @returns 加载的二进制数据
   */
  private async loadBinary(url: string, options: ResourceLoadOptions): Promise<ArrayBuffer> {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to load binary: ${url}, status: ${response.status}`);
    }
    
    return response.arrayBuffer();
  }

  /**
   * 获取资源
   * @param id 资源ID或URL
   * @returns 资源对象或null
   */
  get(id: string): IResource | null {
    // 检查别名
    if (this.aliases.has(id)) {
      id = this.aliases.get(id)!;
    }
    
    // 如果是URL，转换为资源ID
    if (id.includes('/')) {
      id = this.getResourceIdFromUrl(id);
    }
    
    return this.resources.get(id) || null;
  }

  /**
   * 卸载资源
   * @param id 资源ID或URL
   * @param force 是否强制卸载(忽略引用计数)
   * @returns 是否成功卸载
   */
  unload(id: string, force: boolean = false): boolean {
    const resource = this.get(id);
    
    if (!resource) {
      return false;
    }
    
    // 减少引用计数
    resource.referenceCount--;
    
    // 如果引用计数为0或强制卸载，则销毁资源
    if (resource.referenceCount <= 0 || force) {
      resource.destroy();
      return true;
    }
    
    return false;
  }

  /**
   * 获取资源ID
   * @param url 资源URL
   * @returns 资源ID
   */
  private getResourceIdFromUrl(url: string): string {
    // 简单地使用URL作为ID
    // 在实际应用中可能需要更复杂的ID生成逻辑
    return url;
  }

  /**
   * 获取资源名称
   * @param url 资源URL
   * @returns 资源名称
   */
  private getResourceNameFromUrl(url: string): string {
    // 提取URL中的文件名
    const parts = url.split('/');
    return parts[parts.length - 1].split('?')[0];
  }

  /**
   * 添加资源别名
   * @param alias 别名
   * @param id 资源ID
   */
  addAlias(alias: string, id: string): void {
    this.aliases.set(alias, id);
  }

  /**
   * 移除资源别名
   * @param alias 别名
   */
  removeAlias(alias: string): void {
    this.aliases.delete(alias);
  }

  /**
   * 获取所有资源
   * @returns 资源列表
   */
  getAllResources(): IResource[] {
    return Array.from(this.resources.values());
  }

  /**
   * 获取资源数量
   */
  get resourceCount(): number {
    return this.resources.size;
  }

  /**
   * 清除所有资源
   * @param force 是否强制清除
   */
  clear(force: boolean = false): void {
    if (force) {
      // 强制清除所有资源
      this.resources.forEach(resource => {
        resource.destroy();
      });
      this.resources.clear();
    } else {
      // 只清除引用计数为0的资源
      const resourcesToRemove: string[] = [];
      
      this.resources.forEach((resource, id) => {
        if (resource.referenceCount <= 0) {
          resource.destroy();
          resourcesToRemove.push(id);
        }
      });
      
      resourcesToRemove.forEach(id => {
        this.resources.delete(id);
      });
    }
    
    // 派发清除事件
    this.dispatchEvent('resourcesCleared', { force });
  }

  /**
   * 销毁资源管理器
   */
  override destroy(): void {
    // 清除所有资源
    this.clear(true);
    
    // 清除别名
    this.aliases.clear();
    
    // 从IOC容器中移除
    this.container.remove(ServiceKeys.RESOURCE_MANAGER);
    
    super.destroy();
  }
} 