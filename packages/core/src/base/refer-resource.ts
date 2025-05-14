import { ResourceManager } from '../resource/ResourceManager';
import { MaxObject } from './max-object';

// 全局资源管理器单例
let globalResourceManager: ResourceManager | null = null;

/**
 * 获取全局资源管理器
 * @returns 全局ResourceManager实例
 */
export function getResourceManager (): ResourceManager {
  if (!globalResourceManager) {
    globalResourceManager = new ResourceManager();
  }

  return globalResourceManager;
}

/**
 * 资源引用接口
 * 定义可引用计数对象的基本行为
 */
export interface IReferable {
  /**
   * 引用计数
   */
  readonly refCount: number,

  /**
   * 增加引用计数
   * @returns 增加后的引用计数
   */
  addRef(): number,

  /**
   * 减少引用计数
   * @returns 减少后的引用计数
   */
  release(): number,
}

/**
 * 引用计数资源基类
 * 管理需要手动释放的资源（如纹理、网格、材质等），使用引用计数控制资源生命周期
 *
 * 使用方法:
 * 1. 每次使用资源时调用addRef()增加引用计数
 * 2. 不再使用时调用release()减少引用计数
 * 3. 引用计数为0时资源会自动销毁
 * 4. 子类需实现onResourceDestroy()方法释放具体资源
 */
export class ReferResource extends MaxObject implements IReferable {
  /** 引用计数 */
  private referenceCount: number = 0;

  /** 是否已加载完成 */
  protected isLoaded: boolean = false;

  /** 资源URL */
  protected url: string = '';

  /** 资源大小(字节) */
  protected size: number = 0;

  /**
   * 获取当前引用计数
   * @readonly
   */
  get refCount (): number {
    return this.referenceCount;
  }

  /**
   * 增加引用计数
   * @returns 增加后的引用计数
   */
  addRef (): number {
    if (this.isDestroyed()) {
      console.warn(`[ReferResource] 尝试增加已销毁资源的引用计数: ${this.id}(${this.name})`);

      return this.referenceCount;
    }

    return ++this.referenceCount;
  }

  /**
   * 减少引用计数，当计数为0时销毁资源
   * @returns 减少后的引用计数
   */
  release (): number {
    if (this.isDestroyed()) {
      return 0;
    }

    this.referenceCount = Math.max(0, this.referenceCount - 1);

    if (this.referenceCount === 0 && this.isLoaded) {
      this.destroy();
    }

    return this.referenceCount;
  }

  /**
   * 设置资源URL
   * @param url 资源URL
   */
  setUrl (url: string): void {
    this.url = url;
  }

  /**
   * 获取资源URL
   * @returns 资源URL
   */
  getUrl (): string {
    return this.url;
  }

  /**
   * 设置资源大小
   * @param size 资源大小(字节)
   */
  setSize (size: number): void {
    this.size = Math.max(0, size);
  }

  /**
   * 获取资源大小
   * @returns 资源大小(字节)
   */
  getSize (): number {
    return this.size;
  }

  /**
   * 检查资源是否已加载
   * @returns 是否已加载
   */
  loaded (): boolean {
    return this.isLoaded;
  }

  /**
   * 标记资源为已加载状态
   * @param loaded 加载状态
   */
  setLoaded (loaded: boolean): void {
    this.isLoaded = loaded;
  }

  /**
   * 销毁资源，释放内存
   * 如果资源有引用，会输出警告但仍会强制销毁
   */
  override destroy (): void {
    if (this.isDestroyed()) {
      return;
    }

    if (this.referenceCount > 0) {
      console.warn(`[ReferResource] 销毁仍被引用的资源: ${this.id}(${this.name}), 剩余引用: ${this.referenceCount}`);
    }

    this.onResourceDestroy();
    this.isLoaded = false;
    this.referenceCount = 0;

    super.destroy();
  }

  /**
   * 资源销毁时调用，子类应重写此方法释放特定资源
   * @protected
   */
  protected onResourceDestroy (): void {
    // 子类实现特定资源的释放逻辑
  }
}