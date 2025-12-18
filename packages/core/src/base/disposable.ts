/**
 * 可释放资源接口
 *
 * @remarks
 * 实现此接口的对象表示持有需要手动释放的资源（如 GPU 缓冲区、事件监听器、定时器等）。
 * 当对象不再需要时，应调用 `dispose()` 方法释放资源。
 *
 * @example
 * ```typescript
 * class MyResource implements IDisposable {
 *   private buffer: ArrayBuffer;
 *   private disposed = false;
 *
 *   constructor() {
 *     this.buffer = new ArrayBuffer(1024);
 *   }
 *
 *   dispose(): void {
 *     if (this.disposed) return;
 *     this.disposed = true;
 *     // 释放资源
 *     this.buffer = null!;
 *   }
 *
 *   isDisposed(): boolean {
 *     return this.disposed;
 *   }
 * }
 * ```
 */
export interface IDisposable {
  /**
   * 释放资源
   *
   * @remarks
   * 此方法应该是幂等的，即多次调用不应产生副作用。
   * 实现时应检查是否已释放，避免重复释放。
   */
  dispose(): void;

  /**
   * 检查资源是否已释放
   * @returns 如果资源已释放返回 true
   */
  isDisposed(): boolean;
}

/**
 * 可释放资源基类
 *
 * @remarks
 * 提供 IDisposable 接口的基本实现，子类只需重写 `onDispose()` 方法。
 *
 * @example
 * ```typescript
 * class MyResource extends Disposable {
 *   private buffer: ArrayBuffer;
 *
 *   constructor() {
 *     super();
 *     this.buffer = new ArrayBuffer(1024);
 *   }
 *
 *   protected onDispose(): void {
 *     this.buffer = null!;
 *   }
 * }
 * ```
 */
export abstract class Disposable implements IDisposable {
  /** 是否已释放 */
  private _disposed: boolean = false;

  /**
   * 释放资源
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }

    this._disposed = true;
    this.onDispose();
  }

  /**
   * 检查资源是否已释放
   */
  isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * 子类重写此方法以释放特定资源
   * @protected
   */
  protected abstract onDispose(): void;
}

/**
 * 资源释放辅助函数
 *
 * @param disposable 可释放的资源
 * @remarks 安全地释放资源，如果资源为 null/undefined 则忽略
 */
export function dispose(disposable: IDisposable | null | undefined): void {
  if (disposable && !disposable.isDisposed()) {
    disposable.dispose();
  }
}

/**
 * 批量释放资源
 *
 * @param disposables 可释放资源数组
 * @remarks 按顺序释放所有资源，即使某个资源释放失败也会继续释放其他资源
 */
export function disposeAll(disposables: (IDisposable | null | undefined)[]): void {
  for (const disposable of disposables) {
    try {
      dispose(disposable);
    } catch (error) {
      console.error('Error disposing resource:', error);
    }
  }
}

/**
 * 使用 using 模式管理资源
 *
 * @param resource 可释放的资源
 * @param fn 使用资源的函数
 * @returns 函数的返回值
 *
 * @remarks
 * 确保资源在使用后被正确释放，即使发生异常也会释放。
 *
 * @example
 * ```typescript
 * const result = using(new MyResource(), (resource) => {
 *   return resource.doSomething();
 * });
 * // resource 已自动释放
 * ```
 */
export function using<T extends IDisposable, R>(resource: T, fn: (resource: T) => R): R {
  try {
    return fn(resource);
  } finally {
    dispose(resource);
  }
}

/**
 * 异步使用 using 模式管理资源
 *
 * @param resource 可释放的资源
 * @param fn 使用资源的异步函数
 * @returns Promise 包装的函数返回值
 *
 * @example
 * ```typescript
 * const result = await usingAsync(new MyResource(), async (resource) => {
 *   return await resource.doSomethingAsync();
 * });
 * // resource 已自动释放
 * ```
 */
export async function usingAsync<T extends IDisposable, R>(resource: T, fn: (resource: T) => Promise<R>): Promise<R> {
  try {
    return await fn(resource);
  } finally {
    dispose(resource);
  }
}

/**
 * 组合多个可释放资源
 *
 * @remarks
 * 创建一个新的 IDisposable，当释放时会释放所有子资源。
 *
 * @example
 * ```typescript
 * const combined = combineDisposables(resource1, resource2, resource3);
 * // 稍后...
 * combined.dispose(); // 释放所有资源
 * ```
 */
export function combineDisposables(...disposables: IDisposable[]): IDisposable {
  let disposed = false;

  return {
    dispose(): void {
      if (disposed) {
        return;
      }
      disposed = true;
      disposeAll(disposables);
    },
    isDisposed(): boolean {
      return disposed;
    },
  };
}

/**
 * 可释放资源收集器
 *
 * @remarks
 * 用于收集多个需要一起释放的资源。
 *
 * @example
 * ```typescript
 * const collector = new DisposableCollector();
 *
 * collector.add(new Resource1());
 * collector.add(new Resource2());
 *
 * // 稍后...
 * collector.dispose(); // 释放所有收集的资源
 * ```
 */
export class DisposableCollector implements IDisposable {
  private disposables: IDisposable[] = [];
  private _disposed: boolean = false;

  /**
   * 添加资源到收集器
   * @param disposable 要添加的资源
   * @returns 添加的资源（方便链式调用）
   */
  add<T extends IDisposable>(disposable: T): T {
    if (this._disposed) {
      // 如果收集器已释放，立即释放新添加的资源
      dispose(disposable);
    } else {
      this.disposables.push(disposable);
    }

    return disposable;
  }

  /**
   * 从收集器中移除资源（不释放）
   * @param disposable 要移除的资源
   * @returns 是否成功移除
   */
  remove(disposable: IDisposable): boolean {
    const index = this.disposables.indexOf(disposable);

    if (index !== -1) {
      this.disposables.splice(index, 1);

      return true;
    }

    return false;
  }

  /**
   * 释放所有收集的资源
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }

    this._disposed = true;
    disposeAll(this.disposables);
    this.disposables = [];
  }

  /**
   * 检查是否已释放
   */
  isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * 获取收集的资源数量
   */
  get count(): number {
    return this.disposables.length;
  }
}
