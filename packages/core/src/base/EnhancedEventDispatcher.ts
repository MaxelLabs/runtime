/**
 * 事件监听器接口
 */
export interface EventListener {
  /** 回调函数 */
  callback: Function;
  /** 上下文对象 */
  target?: any;
  /** 优先级，数值越大越先执行 */
  priority: number;
  /** 是否只执行一次 */
  once: boolean;
}

/**
 * 基本事件对象
 */
export class Event {
  /** 事件类型 */
  type: string;
  /** 事件目标 */
  target: any;
  /** 事件当前目标 */
  currentTarget: any;
  /** 是否已停止传播 */
  private propagationStopped: boolean = false;
  /** 是否立即停止传播(包括当前监听器) */
  private immediatelyStopped: boolean = false;
  /** 是否允许事件冒泡 */
  bubbles: boolean = false;
  /** 自定义数据 */
  data: any;
  /** 事件时间戳 */
  timestamp: number;

  /**
   * 创建事件
   * @param type 事件类型
   * @param bubbles 是否冒泡
   * @param data 自定义数据
   */
  constructor(type: string, bubbles: boolean = false, data?: any) {
    this.type = type;
    this.bubbles = bubbles;
    this.data = data;
    this.timestamp = Date.now();
  }

  /**
   * 停止事件传播
   */
  stopPropagation(): void {
    this.propagationStopped = true;
  }

  /**
   * 立即停止事件传播(包括当前监听器)
   */
  stopImmediatePropagation(): void {
    this.propagationStopped = true;
    this.immediatelyStopped = true;
  }

  /**
   * 检查事件是否已停止传播
   */
  isPropagationStopped(): boolean {
    return this.propagationStopped;
  }

  /**
   * 检查事件是否立即停止传播
   */
  isImmediatelyStopped(): boolean {
    return this.immediatelyStopped;
  }

  /**
   * 重置事件状态，用于事件池回收再利用
   */
  reset(): void {
    this.type = null;
    this.target = null;
    this.currentTarget = null;
    this.propagationStopped = false;
    this.immediatelyStopped = false;
    this.bubbles = false;
    this.data = null;
    this.timestamp = 0;
  }
}

/**
 * 增强的事件分发器
 * 支持事件优先级、一次性事件、事件冒泡和捕获
 */
export class EnhancedEventDispatcher {
  /** 事件映射表 */
  private listeners: Map<string, EventListener[]> = new Map();
  /** 正在派发中的事件类型 */
  private dispatchingEvents: Set<string> = new Set();
  /** 父事件分发器 */
  private parent: EnhancedEventDispatcher = null;
  /** 子事件分发器 */
  private children: Set<EnhancedEventDispatcher> = new Set();
  /** 是否启用事件捕获 */
  private captureEnabled: boolean = true;
  /** 是否启用事件冒泡 */
  private bubbleEnabled: boolean = true;
  /** 派发器ID */
  protected id: string;
  /** 派发器标签 */
  protected tag: string;
  /** 是否暂停事件分发 */
  protected paused: boolean = false;

  /**
   * 创建事件分发器
   * @param id 派发器ID
   * @param tag 派发器标签
   */
  constructor(id?: string, tag?: string) {
    this.id = id || `dispatcher-${Math.floor(Math.random() * 10000)}`;
    this.tag = tag || '';
  }

  /**
   * 添加事件监听器
   * @param type 事件类型
   * @param callback 回调函数
   * @param target 上下文对象
   * @param priority 优先级，数值越大越先执行
   * @param once 是否只执行一次
   * @returns 当前实例，支持链式调用
   */
  on(type: string, callback: Function, target?: any, priority: number = 0, once: boolean = false): this {
    if (!type || !callback) {
      return this;
    }

    // 确保有该类型的监听器数组
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }

    const listeners = this.listeners.get(type);
    
    // 检查是否已存在相同的监听器
    for (const listener of listeners) {
      if (listener.callback === callback && listener.target === target) {
        // 更新现有监听器
        listener.priority = priority;
        listener.once = once;
        return this;
      }
    }

    // 添加新监听器
    listeners.push({
      callback,
      target,
      priority,
      once
    });

    // 如果不在派发中，则立即排序
    if (!this.dispatchingEvents.has(type)) {
      this.sortListeners(type);
    }

    return this;
  }

  /**
   * 添加一次性事件监听器
   * @param type 事件类型
   * @param callback 回调函数
   * @param target 上下文对象
   * @param priority 优先级
   * @returns 当前实例，支持链式调用
   */
  once(type: string, callback: Function, target?: any, priority: number = 0): this {
    return this.on(type, callback, target, priority, true);
  }

  /**
   * 移除事件监听器
   * @param type 事件类型，如果为空则移除所有类型
   * @param callback 回调函数，如果为空则移除该类型的所有监听器
   * @param target 上下文对象
   * @returns 当前实例，支持链式调用
   */
  off(type?: string, callback?: Function, target?: any): this {
    if (!type) {
      // 移除所有监听器
      this.listeners.clear();
      return this;
    }

    if (!this.listeners.has(type)) {
      return this;
    }

    const listeners = this.listeners.get(type);

    // 如果没有指定回调，则移除该类型的所有监听器
    if (!callback) {
      if (this.dispatchingEvents.has(type)) {
        // 如果正在派发该类型事件，则将所有监听器标记为一次性
        for (const listener of listeners) {
          listener.once = true;
        }
      } else {
        // 否则直接移除所有监听器
        this.listeners.delete(type);
      }
      return this;
    }

    // 如果正在派发该类型事件，不能直接修改数组
    if (this.dispatchingEvents.has(type)) {
      for (const listener of listeners) {
        if (listener.callback === callback && (!target || listener.target === target)) {
          listener.once = true;
        }
      }
    } else {
      // 过滤出不匹配的监听器
      const filteredListeners = listeners.filter(listener => 
        listener.callback !== callback || (target && listener.target !== target)
      );

      if (filteredListeners.length === 0) {
        // 如果没有剩余监听器，则删除类型
        this.listeners.delete(type);
      } else {
        // 否则更新监听器数组
        this.listeners.set(type, filteredListeners);
      }
    }

    return this;
  }

  /**
   * 移除所有事件监听器
   * @returns 当前实例，支持链式调用
   */
  removeAllEventListeners(): this {
    // 如果有正在派发的事件，将这些事件的所有监听器设为一次性
    for (const type of this.dispatchingEvents) {
      const listeners = this.listeners.get(type);
      if (listeners) {
        for (const listener of listeners) {
          listener.once = true;
        }
      }
    }

    // 清空其他未派发的事件监听器
    for (const [type, listeners] of this.listeners.entries()) {
      if (!this.dispatchingEvents.has(type)) {
        this.listeners.delete(type);
      }
    }

    return this;
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
      const remainingListeners = listeners.filter(listener => !listener.once);
      
      if (remainingListeners.length === 0) {
        this.listeners.delete(type);
      } else {
        this.listeners.set(type, remainingListeners);
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
    
    if (!this.listeners.has(type)) {
      return false;
    }

    const listeners = this.listeners.get(type);
    let processed = false;

    for (const listener of listeners) {
      if (event.isImmediatelyStopped()) {
        break;
      }

      try {
        listener.callback.call(listener.target || this, event);
        processed = true;
      } catch (e) {
        console.error(`Error in event handler for ${type}:`, e);
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
        const listeners = this.listeners.get(captureType);
        
        for (const listener of listeners) {
          if (event.isImmediatelyStopped()) {
            break;
          }

          try {
            listener.callback.call(listener.target || this, event);
            success = true;
          } catch (e) {
            console.error(`Error in capture event handler for ${captureType}:`, e);
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
    return this.listeners.has(type) && this.listeners.get(type).length > 0;
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
        count += listeners.length;
      }
      return count;
    }

    if (!this.listeners.has(type)) {
      return 0;
    }

    return this.listeners.get(type).length;
  }

  /**
   * 设置父事件分发器
   * @param parent 父分发器
   */
  setParent(parent: EnhancedEventDispatcher): void {
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
  addChild(child: EnhancedEventDispatcher): void {
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
  removeChild(child: EnhancedEventDispatcher): void {
    if (this.children.has(child)) {
      this.children.delete(child);
      
      // 清除子级的父引用
      if (child.parent === this) {
        child.parent = null;
      }
    }
  }

  /**
   * 排序事件监听器，按优先级降序排序
   * @param type 事件类型
   */
  private sortListeners(type: string): void {
    if (!this.listeners.has(type)) {
      return;
    }

    const listeners = this.listeners.get(type);
    listeners.sort((a, b) => b.priority - a.priority);
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
  destroy(): void {
    // 移除所有监听器
    this.removeAllEventListeners();
    
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
    this.listeners.clear();
  }
} 