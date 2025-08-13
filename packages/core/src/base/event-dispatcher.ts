import { MaxObject } from './max-object';
import { Event } from './event';
/**
 * 事件监听器接口
 */
export interface EventListener {
  /** 回调函数 */
  callback: (event: Event) => void;
  /** 上下文对象 */
  target?: any;
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
   * @param listener 回调函数
   */
  on(type: string, listener: EventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  /**
   * 添加只执行一次的事件监听器
   * @param type 事件类型
   * @param listener 回调函数
   */
  once(type: string, listener: (event: Event) => void): void {
    const onceWrapper = (event: Event) => {
      this.off(type, onceWrapper as unknown as EventListener);
      listener(event);
    };

    this.on(type, onceWrapper as unknown as EventListener);
  }

  /**
   * 移除事件监听器
   * @param type 事件类型
   * @param listener 回调函数
   */
  off(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type);

    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(type);
      }
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
      console.warn('Event type is required');

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

    // 如果有待清理的一次性监听器，执行清理
    if (this.listeners.has(type) && !this.dispatchingEvents.has(type)) {
      const listeners = this.listeners.get(type);

      if (listeners) {
        const remainingListeners = new Set(listeners);

        remainingListeners.forEach((listener) => {
          if (listener instanceof Function) {
            try {
              listener(event);
            } catch (e) {
              console.error(`Error in event handler for ${type}:`, e);
            }
          }
        });

        if (remainingListeners.size === 0) {
          this.listeners.delete(type);
        }
      }
    }

    return success;
  }

  /**
   * 派发事件到本地监听器
   * @param event 事件对象
   * @returns 事件是否成功派发
   */
  private dispatchToLocalListeners(event: Event): boolean {
    const type = event.type;

    if (!type) {
      console.warn('Event type is required');

      return false;
    }

    if (!this.listeners.has(type)) {
      return false;
    }

    const listeners = this.listeners.get(type);
    let processed = false;

    if (listeners) {
      const remainingListeners = new Set(listeners);

      remainingListeners.forEach((listener) => {
        if (listener instanceof Function) {
          try {
            listener(event);
            processed = true;
          } catch (e) {
            console.error(`Error in event handler for ${type}:`, e);
          }
        }
      });

      if (remainingListeners.size === 0) {
        this.listeners.delete(type);
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

      if (this.listeners.has(captureType)) {
        event.currentTarget = this;
        const captureListeners = this.listeners.get(captureType);

        if (captureListeners) {
          const remainingListeners = new Set(captureListeners);

          remainingListeners.forEach((listener) => {
            if (listener instanceof Function) {
              try {
                listener(event);
                success = true;
              } catch (e) {
                console.error(`Error in capture event handler for ${captureType}:`, e);
              }
            }
          });

          if (remainingListeners.size === 0) {
            this.listeners.delete(captureType);
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
   * 销毁事件分发器
   */
  override destroy(): void {
    if (this.destroyed) {
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
    super.destroy();
  }
}
