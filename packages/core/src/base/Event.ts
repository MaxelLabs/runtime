/**
 * 基础事件类
 */
export class Event {
  /** 事件类型 */
  readonly type: string;
  /** 事件目标 */
  target: any = null;
  /** 事件当前目标（用于事件冒泡） */
  currentTarget: any = null;
  /** 是否已阻止传播 */
  propagationStopped: boolean = false;
  /** 是否已阻止默认行为 */
  defaultPrevented: boolean = false;
  /** 时间戳 */
  readonly timeStamp: number;
  /** 额外数据 */
  readonly data: any;

  /**
   * 创建事件
   * @param type 事件类型
   * @param data 额外数据
   */
  constructor(type: string, data: any = null) {
    this.type = type;
    this.timeStamp = performance.now();
    this.data = data;
  }

  /**
   * 阻止事件传播
   */
  stopPropagation(): void {
    this.propagationStopped = true;
  }

  /**
   * 阻止默认行为
   */
  preventDefault(): void {
    this.defaultPrevented = true;
  }

  /**
   * 获取事件是否可取消
   */
  get cancelable(): boolean {
    return true;
  }

  /**
   * 获取事件是否会冒泡
   */
  get bubbles(): boolean {
    return false;
  }
} 