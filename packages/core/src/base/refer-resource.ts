import { MaxObject } from './max-object';
import type { IReferable } from '@maxellabs/specification';

/**
 * 引用计数资源基类
 * 管理需要手动释放的资源（如纹理、网格、材质等），使用引用计数控制资源生命周期
 *
 * 使用方法:
 * 1. 每次使用资源时调用addRef()增加引用计数
 * 2. 不再使用时调用release()减少引用计数
 * 3. 引用计数为0时资源会自动释放
 * 4. 子类需实现 onResourceDispose() 方法释放具体资源
 */
export class ReferResource extends MaxObject implements IReferable {
  /** 引用计数 */
  private referenceCount: number = 0;

  /** 是否已加载完成 */
  isLoaded: boolean = false;

  /** 资源URL */
  protected url: string = '';

  /** 资源大小(字节) */
  protected size: number = 0;

  /**
   * 获取当前引用计数
   * @readonly
   */
  get refCount(): number {
    return this.referenceCount;
  }

  /**
   * 增加引用计数
   * @returns 增加后的引用计数
   */
  addRef(): number {
    if (this.isDisposed()) {
      console.warn(`[ReferResource] 尝试增加已释放资源的引用计数: ${this.tag}(${this.name})`);

      return this.referenceCount;
    }

    return ++this.referenceCount;
  }

  /**
   * 减少引用计数，当计数为0时释放资源
   * @returns 减少后的引用计数
   */
  release(): number {
    if (this.isDisposed()) {
      return 0;
    }

    this.referenceCount = Math.max(0, this.referenceCount - 1);

    if (this.referenceCount === 0 && this.isLoaded) {
      this.dispose();
    }

    return this.referenceCount;
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
   * @returns 资源URL
   */
  getUrl(): string {
    return this.url;
  }

  /**
   * 设置资源大小
   * @param size 资源大小(字节)
   */
  setSize(size: number): void {
    this.size = Math.max(0, size);
  }

  /**
   * 获取资源大小
   * @returns 资源大小(字节)
   */
  getSize(): number {
    return this.size;
  }

  /**
   * 检查资源是否已加载
   * @returns 是否已加载
   */
  loaded(): boolean {
    return this.isLoaded;
  }

  /**
   * 标记资源为已加载状态
   * @param loaded 加载状态
   */
  setLoaded(loaded: boolean): void {
    this.isLoaded = loaded;
  }

  /**
   * 释放资源
   * 如果资源有引用，会输出警告但仍会强制释放
   */
  override dispose(): void {
    if (this.isDisposed()) {
      return;
    }

    if (this.referenceCount > 0) {
      console.warn(`[ReferResource] 释放仍被引用的资源: ${this.tag}(${this.name}), 剩余引用: ${this.referenceCount}`);
    }

    this.onResourceDispose();
    this.isLoaded = false;
    this.referenceCount = 0;

    super.dispose();
  }

  /**
   * 资源释放时调用，子类应重写此方法释放特定资源
   * @protected
   */
  protected onResourceDispose(): void {
    // 子类实现特定资源的释放逻辑
  }
}
