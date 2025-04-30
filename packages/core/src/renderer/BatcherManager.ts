import type { Engine } from '../Engine';
import type { RenderElement } from './RenderElement';
import type { RenderBatcher } from './RenderBatcher';

/**
 * 批处理管理器，用于管理渲染批处理器
 */
export class BatcherManager {
  /** 引擎实例 */
  private _engine: Engine;
  /** 批处理器列表 */
  private _batchers: RenderBatcher[] = [];
  /** 是否启用批处理 */
  private _enabled: boolean = true;

  /**
   * 创建批处理管理器
   * @param engine 引擎实例
   */
  constructor(engine: Engine) {
    this._engine = engine;
  }

  /**
   * 获取是否启用批处理
   */
  get enabled(): boolean {
    return this._enabled;
  }

  /**
   * 设置是否启用批处理
   */
  set enabled(value: boolean) {
    this._enabled = value;
  }

  /**
   * 添加批处理器
   * @param batcher 批处理器
   */
  addBatcher(batcher: RenderBatcher): void {
    if (!this._batchers.includes(batcher)) {
      this._batchers.push(batcher);
    }
  }

  /**
   * 移除批处理器
   * @param batcher 批处理器
   */
  removeBatcher(batcher: RenderBatcher): void {
    const index = this._batchers.indexOf(batcher);
    if (index !== -1) {
      this._batchers.splice(index, 1);
    }
  }

  /**
   * 将渲染元素添加到批处理队列
   * @param element 渲染元素
   * @returns 是否被批处理（如果返回true，则不需要单独渲染）
   */
  addElement(element: RenderElement): boolean {
    if (!this._enabled) {
      return false;
    }

    // 尝试使用所有批处理器处理元素
    for (const batcher of this._batchers) {
      if (batcher.canBatch(element)) {
        batcher.addElement(element);
        return true;
      }
    }

    return false;
  }

  /**
   * 渲染所有批处理器队列
   */
  flush(): void {
    if (!this._enabled) {
      return;
    }

    // 渲染所有批处理器队列
    for (const batcher of this._batchers) {
      batcher.flush();
    }
  }

  /**
   * 清空所有批处理器队列
   */
  clear(): void {
    // 清空所有批处理器队列
    for (const batcher of this._batchers) {
      batcher.clear();
    }
  }

  /**
   * 销毁批处理管理器
   */
  destroy(): void {
    // 销毁所有批处理器
    for (const batcher of this._batchers) {
      batcher.destroy();
    }

    this._batchers = [];
  }
} 