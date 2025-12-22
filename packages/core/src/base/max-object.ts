import type { IDisposable } from './disposable';

/**
 * ID 生成器
 * 使用递增计数器确保 ID 唯一性
 */
class IdGenerator {
  /** 全局计数器，按类型分组 */
  private static counters: Map<string, number> = new Map();

  /**
   * 生成唯一 ID
   * @param type 对象类型名称
   * @returns 格式为 "Type_序号" 的唯一 ID
   */
  static generate(type: string): string {
    const count = (IdGenerator.counters.get(type) ?? 0) + 1;

    IdGenerator.counters.set(type, count);

    return `${type}_${count}`;
  }

  /**
   * 重置指定类型的计数器（主要用于测试）
   * @param type 对象类型名称，如果不指定则重置所有
   */
  static reset(type?: string): void {
    if (type) {
      IdGenerator.counters.delete(type);
    } else {
      IdGenerator.counters.clear();
    }
  }

  /**
   * 获取指定类型的当前计数（主要用于调试）
   * @param type 对象类型名称
   * @returns 当前计数值
   */
  static getCount(type: string): number {
    return IdGenerator.counters.get(type) ?? 0;
  }
}

/**
 * 引擎对象基类
 * 作为引擎中大多数对象的基类，提供唯一标识符、名称管理等基础功能
 *
 * @remarks
 * 实现 IDisposable 接口，使用 `dispose()` 方法释放资源
 */
export abstract class MaxObject implements IDisposable {
  /** 对象的唯一标识 */
  readonly id: string;
  /** 对象的标签 */
  tag: string = '';

  /** 对象的名称 */
  name: string = '';

  /** 对象的类型 */
  protected type: string;

  /** 对象的创建时间(毫秒时间戳) */
  readonly createTime: number;

  /** 对象是否已释放 */
  protected _disposed: boolean = false;

  constructor() {
    this.createTime = Date.now();
    this.type = this.constructor.name;
    this.id = IdGenerator.generate(this.type);
  }

  /**
   * 检查对象是否已被释放
   * @returns 是否已被释放
   */
  isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * 获取对象的唯一标识
   * @returns 唯一标识
   */
  getId(): string {
    return this.id;
  }

  /**
   * 释放对象，释放资源
   * 子类应该重写 onDispose 方法进行资源清理
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }
    this._disposed = true;
    this.onDispose();
  }

  /**
   * 释放时的回调，子类应该重写此方法清理自身资源
   * @protected
   */
  protected onDispose(): void {}
}
