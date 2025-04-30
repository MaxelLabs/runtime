import { Event } from './Event';

/**
 * 事件监听器类型
 */
export type EventListener = (event: Event) => void;

/**
 * 事件分发器类，提供基础的事件处理功能
 */
export class EventDispatcher {
  /** 事件监听器映射表 */
  private _eventListeners: Map<string, EventListener[]> = new Map();

  /**
   * 添加事件监听器
   * @param type 事件类型
   * @param listener 事件监听器
   */
  addEventListener(type: string, listener: EventListener): void {
    if (!this._eventListeners.has(type)) {
      this._eventListeners.set(type, []);
    }
    
    const listeners = this._eventListeners.get(type);
    
    // 避免重复添加同一个监听器
    if (listeners.indexOf(listener) === -1) {
      listeners.push(listener);
    }
  }

  /**
   * 移除事件监听器
   * @param type 事件类型
   * @param listener 事件监听器
   */
  removeEventListener(type: string, listener: EventListener): void {
    if (!this._eventListeners.has(type)) {
      return;
    }
    
    const listeners = this._eventListeners.get(type);
    const index = listeners.indexOf(listener);
    
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    
    // 如果没有监听器了，移除整个事件类型
    if (listeners.length === 0) {
      this._eventListeners.delete(type);
    }
  }

  /**
   * 移除特定类型的所有事件监听器
   * @param type 事件类型
   */
  removeEventListeners(type: string): void {
    this._eventListeners.delete(type);
  }

  /**
   * 移除所有事件监听器
   */
  removeAllEventListeners(): void {
    this._eventListeners.clear();
  }

  /**
   * 分发事件
   * @param event 事件对象
   * @returns 如果至少有一个监听器处理了事件，则返回true
   */
  dispatch(event: Event): boolean {
    const type = event.type;
    
    if (!this._eventListeners.has(type)) {
      return false;
    }
    
    // 设置事件的目标为this
    if (!event.target) {
      event.target = this;
    }
    
    // 复制监听器数组，以防在回调中修改数组
    const listeners = [...this._eventListeners.get(type)];
    let handled = false;
    
    for (const listener of listeners) {
      listener(event);
      handled = true;
      
      // 如果事件被设置为不再传播，则停止
      if (event.propagationStopped) {
        break;
      }
    }
    
    return handled;
  }

  /**
   * 判断是否有特定类型的事件监听器
   * @param type 事件类型
   * @returns 是否有监听器
   */
  hasEventListener(type: string): boolean {
    return this._eventListeners.has(type) && this._eventListeners.get(type).length > 0;
  }

  /**
   * 获取特定类型的事件监听器数量
   * @param type 事件类型
   * @returns 监听器数量
   */
  getEventListenerCount(type: string): number {
    if (!this._eventListeners.has(type)) {
      return 0;
    }
    return this._eventListeners.get(type).length;
  }
} 