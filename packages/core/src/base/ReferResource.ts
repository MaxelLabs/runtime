import { ResourceManager } from '../resource/ResourceManager';
import { MaxObject } from './maxObject';

// 全局资源管理器，所有资源共享
let _globalResourceManager: ResourceManager | null = null;

/**
 * 获取全局资源管理器
 */
export function getResourceManager (): ResourceManager {
  if (!_globalResourceManager) {
    _globalResourceManager = new ResourceManager();
  }

  return _globalResourceManager;
}

/**
 * 资源引用接口
 */
export interface IReferable {
  /**
   * 引用计数
   */
  refCount: number,

  /**
   * 增加引用计数
   */
  addRef(): void,

  /**
   * 减少引用计数
   */
  release(): void,
}

/**
 * 引用计数资源基类
 * 用于管理需要手动释放的资源，如纹理、网格等
 */
export class ReferResource extends MaxObject {
  /** 引用计数 */
  protected refCount: number = 0;
  /** 是否已加载 */
  protected isLoaded: boolean = false;
  /** 资源URL，如果从外部加载 */
  protected url: string = '';
  /** 资源大小（字节） */
  protected size: number = 0;

  /**
   * 增加引用计数
   * @returns 增加后的引用计数
   */
  addRef(): number {
    return ++this.refCount;
  }

  /**
   * 减少引用计数，当计数为0时销毁资源
   * @returns 减少后的引用计数
   */
  subRef(): number {
    this.refCount = Math.max(0, this.refCount - 1);
    
    if (this.refCount === 0 && this.isLoaded) {
      this.destroy();
    }
    
    return this.refCount;
  }

  /**
   * 获取当前引用计数
   */
  getRefCount(): number {
    return this.refCount;
  }

  /**
   * 设置资源URL
   * @param url 资源URL
   */
  setUrl(url: string): void {
    this.url = url;
  }

  /**
   * 获取资源URL
   */
  getUrl(): string {
    return this.url;
  }

  /**
   * 设置资源大小
   * @param size 资源大小（字节）
   */
  setSize(size: number): void {
    this.size = size;
  }

  /**
   * 获取资源大小
   */
  getSize(): number {
    return this.size;
  }

  /**
   * 资源是否已加载
   */
  loaded(): boolean {
    return this.isLoaded;
  }

  /**
   * 销毁资源，释放内存
   * 子类需要重写此方法以实现特定资源的销毁逻辑
   */
  override destroy(): void {
    if (this.destroyed) {return;}
    
    this.onResourceDestroy();
    this.isLoaded = false;
    super.destroy();
  }

  /**
   * 资源销毁时调用，子类应重写此方法释放资源
   */
  protected onResourceDestroy(): void {
    // 子类实现特定资源的释放逻辑
  }
}