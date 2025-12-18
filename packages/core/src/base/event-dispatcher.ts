import { MaxObject } from './max-object';
import { Event } from './event';
import { logWarning } from './errors';
/**
 * 事件监听器接口
 */
export interface EventListener {
  /** 回调函数 */
  callback: (event: Event) => void;
  /** 上下文对象 */
  target?: EventDispatcher;
  /** 优先级，数值越大越先执行 */
  priority: number;
  /** 是否只执行一次 */
  once: boolean;
}

/**
 * 事件分发器
 * 支持事件优先级、一次性事件、事件冒泡和捕获
 */
export class EventDispatcher extends MaxObject {
  /** 事件监听器映射表 */
  private listeners: Map<string, Set<EventListener>> = new Map();
  /** 正在派发中的事件类型 */
  private dispatchingEvents: Set<string> = new Set();
  /** 父事件分发器 */
  private parent: EventDispatcher | null = null;
  /** 子事件分发器 */
  private children: Set<EventDispatcher> = new Set();
  /** 是否启用事件捕获 */
  private captureEnabled: boolean = true;
  /** 是否启用事件冒泡 */
  private bubbleEnabled: boolean = true;
  /** 是否暂停事件分发 */
  protected paused: boolean = false;
  protected eventDispatcherId: string;

  /**
   * 创建事件分发器
   * @param id 派发器ID
   * @param tag 派发器标签
   */
  constructor(id?: string, tag?: string) {
    super();
    this.eventDispatcherId = id || `dispatcher-${Math.floor(Math.random() * 10000)}`;
    this.tag = tag || '';
  }

  /**
   * 添加事件监听器
   * @param type 事件类型
   * @param listener EventListener 对象或回调函数
   * @param target 上下文对象（仅当 listener 为回调函数时使用）
   * @param priority 优先级（仅当 listener 为回调函数时使用，默认为 0）
   */
  on(type: string, listener: EventListener | ((event: Event) => void), target?: any, priority: number = 0): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    // 支持两种调用方式：
    // 1. on(type, EventListener) - 传入完整的 EventListener 对象
    // 2. on(type, callback, target?, priority?) - 传入回调函数和可选参数
    let eventListener: EventListener;

    if (typeof listener === 'function') {
      eventListener = {
        callback: listener,
        target,
        priority,
        once: false,
      };
    } else {
      eventListener = listener;
    }

    this.listeners.get(type)!.add(eventListener);
  }

  /**
   * 添加只执行一次的事件监听器
   * @param type 事件类型
   * @param callback 回调函数
   * @param target 上下文对象
   * @param priority 优先级
   */
  once(type: string, callback: (event: Event) => void, target?: any, priority: number = 0): void {
    const onceListener: EventListener = {
      callback,
      target,
      priority,
      once: true,
    };

    this.on(type, onceListener);
  }

  /**
   * 移除事件监听器
   * @param type 事件类型
   * @param listener EventListener 对象或回调函数
   * @param target 上下文对象（仅当 listener 为回调函数时使用，用于精确匹配）
   */
  off(type: string, listener: EventListener | ((event: Event) => void), target?: any): void {
    const listeners = this.listeners.get(type);

    if (!listeners) {
      return;
    }

    if (typeof listener === 'function') {
      // 当传入回调函数时，需要遍历查找匹配的监听器
      for (const existingListener of listeners) {
        if (existingListener.callback === listener && (target === undefined || existingListener.target === target)) {
          listeners.delete(existingListener);
          break;
        }
      }
    } else {
      // 当传入 EventListener 对象时，直接删除
      listeners.delete(listener);
    }

    if (listeners.size === 0) {
      this.listeners.delete(type);
    }
  }

  /**
   * 触发事件 (简化方法)
   * @param type 事件类型
   * @param data 事件数据
   * @param bubbles 是否允许冒泡
   */
  emit(type: string, data?: any, bubbles: boolean = false): boolean {
    const event = new Event(type, bubbles, data);

    return this.dispatchEvent(event);
  }

  /**
   * 派发事件
   * @param typeOrEvent 事件类型字符串或事件对象
   * @param data 事件数据
   * @returns 事件是否成功派发
   */
  dispatchEvent(typeOrEvent: string | Event, data?: any): boolean {
    if (this.paused) {
      return false;
    }

    let event: Event;

    if (typeof typeOrEvent === 'string') {
      event = new Event(typeOrEvent, false, data);
    } else {
      event = typeOrEvent;
    }

    event.currentTarget = this;
    if (!event.target) {
      event.target = this;
    }

    const type = event.type;

    if (!type) {
      logWarning('Event type is required', 'EventDispatcher');

      return false;
    }
    this.dispatchingEvents.add(type);

    // 如果启用了捕获，并且有父级，则先执行捕获阶段
    if (this.captureEnabled && this.parent && event.bubbles) {
      this.parent.dispatchCaptureEvent(event);
    }

    // 执行本地监听器
    let success = this.dispatchToLocalListeners(event);

    // 如果启用了冒泡，并且事件允许冒泡，则执行冒泡阶段
    if (this.bubbleEnabled && event.bubbles && !event.isPropagationStopped() && this.parent) {
      success = this.parent.dispatchBubbleEvent(event) || success;
    }

    this.dispatchingEvents.delete(type);

    // 清理一次性监听器（在事件分发完成后）
    this.cleanupOnceListeners(type);

    return success;
  }

  /**
   * 清理一次性监听器
   * @param type 事件类型
   */
  private cleanupOnceListeners(type: string): void {
    const listeners = this.listeners.get(type);

    if (!listeners) {
      return;
    }

    const listenersToRemove: EventListener[] = [];

    listeners.forEach((listener) => {
      if (listener.once) {
        listenersToRemove.push(listener);
      }
    });

    listenersToRemove.forEach((listener) => {
      listeners.delete(listener);
    });

    if (listeners.size === 0) {
      this.listeners.delete(type);
    }
  }

  /**
   * 派发事件到本地监听器
   * @param event 事件对象
   * @returns 事件是否成功派发
   */
  private dispatchToLocalListeners(event: Event): boolean {
    const type = event.type;

    if (!type) {
      logWarning('Event type is required', 'EventDispatcher');

      return false;
    }

    if (!this.listeners.has(type)) {
      return false;
    }

    const listeners = this.listeners.get(type);
    let processed = false;

    if (listeners) {
      // 创建监听器副本，避免在迭代过程中修改集合
      const listenersCopy = Array.from(listeners);

      // 按优先级排序（数值越大越先执行）
      listenersCopy.sort((a, b) => b.priority - a.priority);

      for (const listener of listenersCopy) {
        if (event.isImmediatelyStopped()) {
          break;
        }

        try {
          if (listener.target) {
            listener.callback.call(listener.target, event);
          } else {
            listener.callback(event);
          }
          processed = true;
        } catch (e) {
          // 记录警告但继续执行其他监听器，避免一个监听器的错误影响整个事件系统
          logWarning(`Error in event handler for ${type}: ${e}`, 'EventDispatcher');
        }
      }
    }

    return processed;
  }

  /**
   * 派发捕获阶段事件
   * @param event 事件对象
   * @returns 事件是否成功派发
   */
  private dispatchCaptureEvent(event: Event): boolean {
    if (this.paused || event.isPropagationStopped()) {
      return false;
    }

    // 先向上传递，实现捕获阶段的自顶向下
    let success = false;

    if (this.parent) {
      success = this.parent.dispatchCaptureEvent(event) || success;
    }

    // 如果事件未被停止，则处理当前级别的捕获监听器
    if (!event.isPropagationStopped()) {
      const captureType = `${event.type}_capture`;
      // 优化：使用一次 get 操作代替 has + get
      const captureListeners = this.listeners.get(captureType);

      if (captureListeners && captureListeners.size > 0) {
        event.currentTarget = this;
        // 创建监听器副本并按优先级排序
        const listenersCopy = Array.from(captureListeners);

        listenersCopy.sort((a, b) => b.priority - a.priority);

        for (const listener of listenersCopy) {
          if (event.isImmediatelyStopped()) {
            break;
          }

          try {
            if (listener.target) {
              listener.callback.call(listener.target, event);
            } else {
              listener.callback(event);
            }
            success = true;
          } catch (e) {
            // 记录警告但继续执行其他监听器，避免一个监听器的错误影响整个事件系统
            logWarning(`Error in capture event handler for ${captureType}: ${e}`, 'EventDispatcher');
          }
        }
      }
    }

    return success;
  }

  /**
   * 派发冒泡阶段事件
   * @param event 事件对象
   * @returns 事件是否成功派发
   */
  private dispatchBubbleEvent(event: Event): boolean {
    if (this.paused || event.isPropagationStopped()) {
      return false;
    }

    event.currentTarget = this;

    // 处理当前级别的监听器
    let success = this.dispatchToLocalListeners(event);

    // 如果事件未被停止，则向上冒泡
    if (!event.isPropagationStopped() && this.parent) {
      success = this.parent.dispatchBubbleEvent(event) || success;
    }

    return success;
  }

  /**
   * 检查是否有特定类型的监听器
   * @param type 事件类型
   * @returns 是否有该类型的监听器
   */
  hasEventListener(type: string): boolean {
    return this.listeners.has(type) && (this.listeners.get(type) ?? new Set()).size > 0;
  }

  /**
   * 获取特定类型的监听器数量
   * @param type 事件类型，如果为空则返回所有监听器总数
   * @returns 监听器数量
   */
  getEventListenerCount(type?: string): number {
    if (!type) {
      let count = 0;

      for (const listeners of this.listeners.values()) {
        count += listeners.size;
      }

      return count;
    }

    if (!this.listeners.has(type)) {
      return 0;
    }

    return (this.listeners.get(type) ?? new Set()).size;
  }

  /**
   * 设置父事件分发器
   * @param parent 父分发器
   */
  setParent(parent: EventDispatcher): void {
    // 如果已经有父级，先移除自己
    if (this.parent) {
      this.parent.removeChild(this);
    }

    this.parent = parent;

    // 添加到父级的子列表
    if (parent) {
      parent.addChild(this);
    }
  }

  /**
   * 添加子事件分发器
   * @param child 子分发器
   */
  addChild(child: EventDispatcher): void {
    if (child === this) {
      return; // 防止循环引用
    }

    this.children.add(child);

    // 更新子级的父引用
    if (child.parent !== this) {
      child.setParent(this);
    }
  }

  /**
   * 移除子事件分发器
   * @param child 子分发器
   */
  removeChild(child: EventDispatcher): void {
    if (this.children.has(child)) {
      this.children.delete(child);

      // 清除子级的父引用
      if (child.parent === this) {
        child.parent = null;
      }
    }
  }

  /**
   * 暂停事件分发
   */
  pauseEvents(): void {
    this.paused = true;
  }

  /**
   * 恢复事件分发
   */
  resumeEvents(): void {
    this.paused = false;
  }

  /**
   * 启用或禁用事件捕获
   * @param enabled 是否启用
   */
  enableCapture(enabled: boolean): void {
    this.captureEnabled = enabled;
  }

  /**
   * 启用或禁用事件冒泡
   * @param enabled 是否启用
   */
  enableBubbling(enabled: boolean): void {
    this.bubbleEnabled = enabled;
  }

  /**
   * 释放事件分发器资源
   */
  override dispose(): void {
    if (this.isDisposed()) {
      return;
    }
    // 移除所有监听器
    this.listeners.clear();

    // 移除自己与父级的关联
    if (this.parent) {
      this.parent.removeChild(this);
      this.parent = null;
    }

    // 移除所有子级
    for (const child of this.children) {
      child.parent = null;
    }
    this.children.clear();

    // 清空其他属性
    this.dispatchingEvents.clear();
    super.dispose();
  }
}
