/**
 * 基本事件对象
 */
export class Event {
  /** 事件类型 */
  type: string | null;
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