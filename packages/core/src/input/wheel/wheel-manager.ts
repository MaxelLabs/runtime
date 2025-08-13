import { EventDispatcher } from '../../base/event-dispatcher';
import { Vector2 } from '@maxellabs/math';
import { InputEventType } from '../enums/InputEventType';
import { MouseEvent } from '../interface/Input-event';

/**
 * 滚轮管理器
 * 负责处理鼠标滚轮事件
 */
export class WheelManager extends EventDispatcher {
  /** 当前帧滚轮增量 */
  private currentDelta: Vector2 = new Vector2();
  /** 累积滚轮增量 */
  private accumulatedDelta: Vector2 = new Vector2();
  /** 是否启用 */
  private enabled: boolean = true;
  /** 目标元素 */
  private targetElement: EventTarget;
  /** 事件监听器 */
  private eventListener: ((event: Event) => void) | null = null;
  /** 滚轮灵敏度 */
  private sensitivity: number = 1.0;
  /** 是否反转滚轮方向 */
  private invertDirection: boolean = false;

  /**
   * 创建滚轮管理器
   * @param targetElement 目标元素
   */
  constructor(targetElement: EventTarget) {
    super();
    this.targetElement = targetElement;
    this.initialize();
  }

  /**
   * 初始化滚轮管理器
   */
  private initialize(): void {
    this.bindEvents();
  }

  /**
   * 绑定滚轮事件
   */
  private bindEvents(): void {
    this.eventListener = (event: Event) => this.onWheel(event as WheelEvent);
    this.targetElement.addEventListener('wheel', this.eventListener, { passive: false });
  }

  /**
   * 解绑滚轮事件
   */
  private unbindEvents(): void {
    if (this.eventListener) {
      this.targetElement.removeEventListener('wheel', this.eventListener);
      this.eventListener = null;
    }
  }

  /**
   * 滚轮事件处理
   */
  private onWheel(nativeEvent: WheelEvent): void {
    if (!this.enabled) {
      return;
    }

    // 阻止默认滚动行为
    nativeEvent.preventDefault();

    // 计算滚轮增量
    let deltaX = nativeEvent.deltaX * this.sensitivity;
    let deltaY = nativeEvent.deltaY * this.sensitivity;

    // 处理不同的滚轮模式
    switch (nativeEvent.deltaMode) {
      case WheelEvent.DOM_DELTA_LINE:
        // 行模式，通常需要乘以行高
        deltaX *= 16;
        deltaY *= 16;
        break;
      case WheelEvent.DOM_DELTA_PAGE:
        // 页面模式，通常需要乘以页面高度
        deltaX *= 400;
        deltaY *= 400;
        break;
      case WheelEvent.DOM_DELTA_PIXEL:
      default:
        // 像素模式，直接使用
        break;
    }

    // 反转方向
    if (this.invertDirection) {
      deltaX = -deltaX;
      deltaY = -deltaY;
    }

    // 更新增量
    this.currentDelta.set(deltaX, deltaY);
    this.accumulatedDelta.add(this.currentDelta);

    // 创建鼠标事件
    const mouseEvent = new MouseEvent(InputEventType.MOUSE_WHEEL);
    mouseEvent.wheelDelta.set(deltaX, deltaY);
    mouseEvent.screenPosition.set(nativeEvent.screenX, nativeEvent.screenY);
    mouseEvent.clientPosition.set(nativeEvent.clientX, nativeEvent.clientY);
    mouseEvent.pagePosition.set(nativeEvent.pageX, nativeEvent.pageY);
    mouseEvent.altKey = nativeEvent.altKey;
    mouseEvent.ctrlKey = nativeEvent.ctrlKey;
    mouseEvent.metaKey = nativeEvent.metaKey;
    mouseEvent.shiftKey = nativeEvent.shiftKey;
    mouseEvent.buttons = nativeEvent.buttons;

    // 派发事件
    this.dispatchEvent(mouseEvent);
  }

  /**
   * 获取当前帧滚轮增量
   * @returns 滚轮增量
   */
  getCurrentDelta(): Vector2 {
    return this.currentDelta.clone();
  }

  /**
   * 获取累积滚轮增量
   * @returns 累积滚轮增量
   */
  getAccumulatedDelta(): Vector2 {
    return this.accumulatedDelta.clone();
  }

  /**
   * 检查是否有滚轮输入
   * @returns 是否有滚轮输入
   */
  hasWheelInput(): boolean {
    return this.currentDelta.x !== 0 || this.currentDelta.y !== 0;
  }

  /**
   * 获取水平滚轮增量
   * @returns 水平滚轮增量
   */
  getHorizontalDelta(): number {
    return this.currentDelta.x;
  }

  /**
   * 获取垂直滚轮增量
   * @returns 垂直滚轮增量
   */
  getVerticalDelta(): number {
    return this.currentDelta.y;
  }

  /**
   * 设置滚轮灵敏度
   * @param sensitivity 灵敏度值
   */
  setSensitivity(sensitivity: number): void {
    this.sensitivity = Math.max(0.1, sensitivity);
  }

  /**
   * 获取滚轮灵敏度
   * @returns 灵敏度值
   */
  getSensitivity(): number {
    return this.sensitivity;
  }

  /**
   * 设置是否反转滚轮方向
   * @param invert 是否反转
   */
  setInvertDirection(invert: boolean): void {
    this.invertDirection = invert;
  }

  /**
   * 获取是否反转滚轮方向
   * @returns 是否反转
   */
  getInvertDirection(): boolean {
    return this.invertDirection;
  }

  /**
   * 重置累积增量
   */
  resetAccumulatedDelta(): void {
    this.accumulatedDelta.set(0, 0);
  }

  /**
   * 启用滚轮输入
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * 禁用滚轮输入
   */
  disable(): void {
    this.enabled = false;
    this.reset();
  }

  /**
   * 重置滚轮状态
   */
  reset(): void {
    this.currentDelta.set(0, 0);
    this.accumulatedDelta.set(0, 0);
  }

  /**
   * 更新滚轮状态（每帧调用）
   */
  update(): void {
    // 清空当前帧的滚轮增量
    this.currentDelta.set(0, 0);
  }

  /**
   * 销毁滚轮管理器
   */
  override destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.unbindEvents();
    this.reset();
    super.destroy();
  }
}
