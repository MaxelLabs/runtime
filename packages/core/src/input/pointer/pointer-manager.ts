import { EventDispatcher } from '../../base/event-dispatcher';
import { Vector2 } from '@maxellabs/math';
import { InputEventType } from '../enums/InputEventType';
import type { Touch } from '../interface/Input-event';
import { PointerEvent, TouchEvent, MouseEvent } from '../interface/Input-event';

/**
 * 指针信息
 */
export interface PointerInfo {
  /** 指针ID */
  id: number;
  /** 指针类型 */
  type: string;
  /** 当前位置 */
  position: Vector2;
  /** 上一帧位置 */
  lastPosition: Vector2;
  /** 移动增量 */
  delta: Vector2;
  /** 按下的按键 */
  buttons: number;
  /** 是否按下 */
  isDown: boolean;
  /** 按下时间 */
  downTime: number;
  /** 压力值 */
  pressure: number;
}

/**
 * 指针管理器
 * 统一处理鼠标、触摸和指针事件
 */
export class PointerManager extends EventDispatcher {
  /** 指针信息映射 */
  private pointers: Map<number, PointerInfo> = new Map();
  /** 当前帧按下的指针 */
  private currentFrameDownPointers: Set<number> = new Set();
  /** 当前帧抬起的指针 */
  private currentFrameUpPointers: Set<number> = new Set();
  /** 是否启用多点触控 */
  private multiTouchEnabled: boolean = true;
  /** 是否启用 */
  private enabled: boolean = true;
  /** 目标元素 */
  private targetElement: EventTarget;
  /** 事件监听器 */
  private eventListeners: Map<string, (event: Event) => void> = new Map();
  /** 是否支持指针事件 */
  private supportsPointerEvents: boolean;
  /** 是否支持触摸事件 */
  private supportsTouchEvents: boolean;

  /**
   * 创建指针管理器
   * @param targetElement 目标元素
   */
  constructor(targetElement: EventTarget) {
    super();
    this.targetElement = targetElement;
    this.supportsPointerEvents = 'PointerEvent' in window;
    this.supportsTouchEvents = 'TouchEvent' in window;
    this.initialize();
  }

  /**
   * 初始化指针管理器
   */
  private initialize(): void {
    this.bindEvents();
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    if (this.supportsPointerEvents) {
      this.bindPointerEvents();
    } else {
      this.bindMouseEvents();
      if (this.supportsTouchEvents) {
        this.bindTouchEvents();
      }
    }
  }

  /**
   * 绑定指针事件
   */
  private bindPointerEvents(): void {
    const pointerDownListener = (event: Event) => this.onPointerDown(event as globalThis.PointerEvent);
    const pointerMoveListener = (event: Event) => this.onPointerMove(event as globalThis.PointerEvent);
    const pointerUpListener = (event: Event) => this.onPointerUp(event as globalThis.PointerEvent);
    const pointerCancelListener = (event: Event) => this.onPointerCancel(event as globalThis.PointerEvent);

    this.targetElement.addEventListener('pointerdown', pointerDownListener);
    this.targetElement.addEventListener('pointermove', pointerMoveListener);
    this.targetElement.addEventListener('pointerup', pointerUpListener);
    this.targetElement.addEventListener('pointercancel', pointerCancelListener);

    this.eventListeners.set('pointerdown', pointerDownListener);
    this.eventListeners.set('pointermove', pointerMoveListener);
    this.eventListeners.set('pointerup', pointerUpListener);
    this.eventListeners.set('pointercancel', pointerCancelListener);
  }

  /**
   * 绑定鼠标事件
   */
  private bindMouseEvents(): void {
    const mouseDownListener = (event: Event) => this.onMouseDown(event as globalThis.MouseEvent);
    const mouseMoveListener = (event: Event) => this.onMouseMove(event as globalThis.MouseEvent);
    const mouseUpListener = (event: Event) => this.onMouseUp(event as globalThis.MouseEvent);
    const wheelListener = (event: Event) => this.onWheel(event as WheelEvent);

    this.targetElement.addEventListener('mousedown', mouseDownListener);
    this.targetElement.addEventListener('mousemove', mouseMoveListener);
    this.targetElement.addEventListener('mouseup', mouseUpListener);
    this.targetElement.addEventListener('wheel', wheelListener);

    this.eventListeners.set('mousedown', mouseDownListener);
    this.eventListeners.set('mousemove', mouseMoveListener);
    this.eventListeners.set('mouseup', mouseUpListener);
    this.eventListeners.set('wheel', wheelListener);
  }

  /**
   * 绑定触摸事件
   */
  private bindTouchEvents(): void {
    const touchStartListener = (event: Event) => this.onTouchStart(event as globalThis.TouchEvent);
    const touchMoveListener = (event: Event) => this.onTouchMove(event as globalThis.TouchEvent);
    const touchEndListener = (event: Event) => this.onTouchEnd(event as globalThis.TouchEvent);
    const touchCancelListener = (event: Event) => this.onTouchCancel(event as globalThis.TouchEvent);

    this.targetElement.addEventListener('touchstart', touchStartListener);
    this.targetElement.addEventListener('touchmove', touchMoveListener);
    this.targetElement.addEventListener('touchend', touchEndListener);
    this.targetElement.addEventListener('touchcancel', touchCancelListener);

    this.eventListeners.set('touchstart', touchStartListener);
    this.eventListeners.set('touchmove', touchMoveListener);
    this.eventListeners.set('touchend', touchEndListener);
    this.eventListeners.set('touchcancel', touchCancelListener);
  }

  /**
   * 解绑事件
   */
  private unbindEvents(): void {
    for (const [eventType, listener] of this.eventListeners) {
      this.targetElement.removeEventListener(eventType, listener);
    }
    this.eventListeners.clear();
  }

  /**
   * 指针按下事件处理
   */
  private onPointerDown(nativeEvent: globalThis.PointerEvent): void {
    if (!this.enabled) {
      return;
    }

    const pointerId = nativeEvent.pointerId;
    const position = new Vector2(nativeEvent.clientX, nativeEvent.clientY);

    // 创建或更新指针信息
    const pointerInfo: PointerInfo = {
      id: pointerId,
      type: nativeEvent.pointerType,
      position: position.clone(),
      lastPosition: position.clone(),
      delta: new Vector2(),
      buttons: nativeEvent.buttons,
      isDown: true,
      downTime: Date.now(),
      pressure: nativeEvent.pressure,
    };

    this.pointers.set(pointerId, pointerInfo);
    this.currentFrameDownPointers.add(pointerId);

    // 创建指针事件
    const pointerEvent = new PointerEvent(InputEventType.POINTER_DOWN, pointerId, nativeEvent.pointerType);
    this.fillPointerEventData(pointerEvent, nativeEvent);

    // 派发事件
    this.dispatchEvent(pointerEvent);
  }

  /**
   * 指针移动事件处理
   */
  private onPointerMove(nativeEvent: globalThis.PointerEvent): void {
    if (!this.enabled) {
      return;
    }

    const pointerId = nativeEvent.pointerId;
    const position = new Vector2(nativeEvent.clientX, nativeEvent.clientY);
    const pointerInfo = this.pointers.get(pointerId);

    if (pointerInfo) {
      // 更新指针信息
      pointerInfo.lastPosition.copyFrom(pointerInfo.position);
      pointerInfo.position.copyFrom(position);
      pointerInfo.delta.set(position.x - pointerInfo.lastPosition.x, position.y - pointerInfo.lastPosition.y);
      pointerInfo.buttons = nativeEvent.buttons;
      pointerInfo.pressure = nativeEvent.pressure;
    }

    // 创建指针事件
    const pointerEvent = new PointerEvent(InputEventType.POINTER_MOVE, pointerId, nativeEvent.pointerType);
    this.fillPointerEventData(pointerEvent, nativeEvent);

    // 派发事件
    this.dispatchEvent(pointerEvent);
  }

  /**
   * 指针抬起事件处理
   */
  private onPointerUp(nativeEvent: globalThis.PointerEvent): void {
    if (!this.enabled) {
      return;
    }

    const pointerId = nativeEvent.pointerId;
    const pointerInfo = this.pointers.get(pointerId);

    if (pointerInfo) {
      pointerInfo.isDown = false;
      this.currentFrameUpPointers.add(pointerId);
    }

    // 创建指针事件
    const pointerEvent = new PointerEvent(InputEventType.POINTER_UP, pointerId, nativeEvent.pointerType);
    this.fillPointerEventData(pointerEvent, nativeEvent);

    // 派发事件
    this.dispatchEvent(pointerEvent);

    // 移除指针信息
    this.pointers.delete(pointerId);
  }

  /**
   * 指针取消事件处理
   */
  private onPointerCancel(nativeEvent: globalThis.PointerEvent): void {
    if (!this.enabled) {
      return;
    }

    const pointerId = nativeEvent.pointerId;

    // 创建指针事件
    const pointerEvent = new PointerEvent(InputEventType.POINTER_CANCEL, pointerId, nativeEvent.pointerType);
    this.fillPointerEventData(pointerEvent, nativeEvent);

    // 派发事件
    this.dispatchEvent(pointerEvent);

    // 移除指针信息
    this.pointers.delete(pointerId);
  }

  /**
   * 鼠标按下事件处理
   */
  private onMouseDown(nativeEvent: globalThis.MouseEvent): void {
    if (!this.enabled) {
      return;
    }

    const pointerId = 0; // 鼠标使用固定ID
    const position = new Vector2(nativeEvent.clientX, nativeEvent.clientY);

    // 创建指针信息
    const pointerInfo: PointerInfo = {
      id: pointerId,
      type: 'mouse',
      position: position.clone(),
      lastPosition: position.clone(),
      delta: new Vector2(),
      buttons: nativeEvent.buttons,
      isDown: true,
      downTime: Date.now(),
      pressure: 1.0,
    };

    this.pointers.set(pointerId, pointerInfo);
    this.currentFrameDownPointers.add(pointerId);

    // 创建鼠标事件
    const mouseEvent = new MouseEvent(InputEventType.MOUSE_DOWN, nativeEvent.button);
    this.fillMouseEventData(mouseEvent, nativeEvent);

    // 派发事件
    this.dispatchEvent(mouseEvent);
  }

  /**
   * 鼠标移动事件处理
   */
  private onMouseMove(nativeEvent: globalThis.MouseEvent): void {
    if (!this.enabled) {
      return;
    }

    const pointerId = 0;
    const position = new Vector2(nativeEvent.clientX, nativeEvent.clientY);
    let pointerInfo = this.pointers.get(pointerId);

    if (!pointerInfo) {
      // 创建指针信息（鼠标移动但未按下）
      pointerInfo = {
        id: pointerId,
        type: 'mouse',
        position: position.clone(),
        lastPosition: position.clone(),
        delta: new Vector2(),
        buttons: nativeEvent.buttons,
        isDown: false,
        downTime: 0,
        pressure: 1.0,
      };
      this.pointers.set(pointerId, pointerInfo);
    } else {
      // 更新指针信息
      pointerInfo.lastPosition.copyFrom(pointerInfo.position);
      pointerInfo.position.copyFrom(position);
      pointerInfo.delta.set(position.x - pointerInfo.lastPosition.x, position.y - pointerInfo.lastPosition.y);
      pointerInfo.buttons = nativeEvent.buttons;
    }

    // 创建鼠标事件
    const mouseEvent = new MouseEvent(InputEventType.MOUSE_MOVE, nativeEvent.button);
    this.fillMouseEventData(mouseEvent, nativeEvent);

    // 派发事件
    this.dispatchEvent(mouseEvent);
  }

  /**
   * 鼠标抬起事件处理
   */
  private onMouseUp(nativeEvent: globalThis.MouseEvent): void {
    if (!this.enabled) {
      return;
    }

    const pointerId = 0;
    const pointerInfo = this.pointers.get(pointerId);

    if (pointerInfo) {
      pointerInfo.isDown = false;
      pointerInfo.buttons = nativeEvent.buttons;
      this.currentFrameUpPointers.add(pointerId);
    }

    // 创建鼠标事件
    const mouseEvent = new MouseEvent(InputEventType.MOUSE_UP, nativeEvent.button);
    this.fillMouseEventData(mouseEvent, nativeEvent);

    // 派发事件
    this.dispatchEvent(mouseEvent);
  }

  /**
   * 鼠标滚轮事件处理
   */
  private onWheel(nativeEvent: WheelEvent): void {
    if (!this.enabled) {
      return;
    }

    // 创建鼠标事件
    const mouseEvent = new MouseEvent(InputEventType.MOUSE_WHEEL);
    this.fillMouseEventData(mouseEvent, nativeEvent);
    mouseEvent.wheelDelta.set(nativeEvent.deltaX, nativeEvent.deltaY);

    // 派发事件
    this.dispatchEvent(mouseEvent);
  }

  /**
   * 触摸开始事件处理
   */
  private onTouchStart(nativeEvent: globalThis.TouchEvent): void {
    if (!this.enabled) {
      return;
    }

    const touches = this.convertTouches(nativeEvent.touches);
    const targetTouches = this.convertTouches(nativeEvent.targetTouches);
    const changedTouches = this.convertTouches(nativeEvent.changedTouches);

    // 更新指针信息
    for (const touch of changedTouches) {
      const pointerInfo: PointerInfo = {
        id: touch.identifier,
        type: 'touch',
        position: touch.clientPosition.clone(),
        lastPosition: touch.clientPosition.clone(),
        delta: new Vector2(),
        buttons: 1,
        isDown: true,
        downTime: Date.now(),
        pressure: touch.force,
      };
      this.pointers.set(touch.identifier, pointerInfo);
      this.currentFrameDownPointers.add(touch.identifier);
    }

    // 创建触摸事件
    const touchEvent = new TouchEvent(InputEventType.TOUCH_START, touches, targetTouches, changedTouches);
    this.fillTouchEventData(touchEvent, nativeEvent);

    // 派发事件
    this.dispatchEvent(touchEvent);
  }

  /**
   * 触摸移动事件处理
   */
  private onTouchMove(nativeEvent: globalThis.TouchEvent): void {
    if (!this.enabled) {
      return;
    }

    const touches = this.convertTouches(nativeEvent.touches);
    const targetTouches = this.convertTouches(nativeEvent.targetTouches);
    const changedTouches = this.convertTouches(nativeEvent.changedTouches);

    // 更新指针信息
    for (const touch of changedTouches) {
      const pointerInfo = this.pointers.get(touch.identifier);
      if (pointerInfo) {
        pointerInfo.lastPosition.copyFrom(pointerInfo.position);
        pointerInfo.position.copyFrom(touch.clientPosition);
        pointerInfo.delta.set(
          touch.clientPosition.x - pointerInfo.lastPosition.x,
          touch.clientPosition.y - pointerInfo.lastPosition.y
        );
        pointerInfo.pressure = touch.force;
      }
    }

    // 创建触摸事件
    const touchEvent = new TouchEvent(InputEventType.TOUCH_MOVE, touches, targetTouches, changedTouches);
    this.fillTouchEventData(touchEvent, nativeEvent);

    // 派发事件
    this.dispatchEvent(touchEvent);
  }

  /**
   * 触摸结束事件处理
   */
  private onTouchEnd(nativeEvent: globalThis.TouchEvent): void {
    if (!this.enabled) {
      return;
    }

    const touches = this.convertTouches(nativeEvent.touches);
    const targetTouches = this.convertTouches(nativeEvent.targetTouches);
    const changedTouches = this.convertTouches(nativeEvent.changedTouches);

    // 更新指针信息
    for (const touch of changedTouches) {
      const pointerInfo = this.pointers.get(touch.identifier);
      if (pointerInfo) {
        pointerInfo.isDown = false;
        this.currentFrameUpPointers.add(touch.identifier);
      }
    }

    // 创建触摸事件
    const touchEvent = new TouchEvent(InputEventType.TOUCH_END, touches, targetTouches, changedTouches);
    this.fillTouchEventData(touchEvent, nativeEvent);

    // 派发事件
    this.dispatchEvent(touchEvent);

    // 移除指针信息
    for (const touch of changedTouches) {
      this.pointers.delete(touch.identifier);
    }
  }

  /**
   * 触摸取消事件处理
   */
  private onTouchCancel(nativeEvent: globalThis.TouchEvent): void {
    if (!this.enabled) {
      return;
    }

    const touches = this.convertTouches(nativeEvent.touches);
    const targetTouches = this.convertTouches(nativeEvent.targetTouches);
    const changedTouches = this.convertTouches(nativeEvent.changedTouches);

    // 创建触摸事件
    const touchEvent = new TouchEvent(InputEventType.TOUCH_CANCEL, touches, targetTouches, changedTouches);
    this.fillTouchEventData(touchEvent, nativeEvent);

    // 派发事件
    this.dispatchEvent(touchEvent);

    // 移除指针信息
    for (const touch of changedTouches) {
      this.pointers.delete(touch.identifier);
    }
  }

  /**
   * 填充指针事件数据
   */
  private fillPointerEventData(event: PointerEvent, nativeEvent: globalThis.PointerEvent): void {
    event.screenPosition.set(nativeEvent.screenX, nativeEvent.screenY);
    event.clientPosition.set(nativeEvent.clientX, nativeEvent.clientY);
    event.pagePosition.set(nativeEvent.pageX, nativeEvent.pageY);
    event.movementDelta.set(nativeEvent.movementX, nativeEvent.movementY);
    event.pressure = nativeEvent.pressure;
    event.tiltX = nativeEvent.tiltX;
    event.tiltY = nativeEvent.tiltY;
    event.altKey = nativeEvent.altKey;
    event.ctrlKey = nativeEvent.ctrlKey;
    event.metaKey = nativeEvent.metaKey;
    event.shiftKey = nativeEvent.shiftKey;
    event.buttons = nativeEvent.buttons;
  }

  /**
   * 填充鼠标事件数据
   */
  private fillMouseEventData(event: MouseEvent, nativeEvent: globalThis.MouseEvent | WheelEvent): void {
    event.screenPosition.set(nativeEvent.screenX, nativeEvent.screenY);
    event.clientPosition.set(nativeEvent.clientX, nativeEvent.clientY);
    event.pagePosition.set(nativeEvent.pageX, nativeEvent.pageY);
    event.movementDelta.set(nativeEvent.movementX, nativeEvent.movementY);
    event.altKey = nativeEvent.altKey;
    event.ctrlKey = nativeEvent.ctrlKey;
    event.metaKey = nativeEvent.metaKey;
    event.shiftKey = nativeEvent.shiftKey;
    event.buttons = nativeEvent.buttons;
  }

  /**
   * 填充触摸事件数据
   */
  private fillTouchEventData(event: TouchEvent, nativeEvent: globalThis.TouchEvent): void {
    event.altKey = nativeEvent.altKey;
    event.ctrlKey = nativeEvent.ctrlKey;
    event.metaKey = nativeEvent.metaKey;
    event.shiftKey = nativeEvent.shiftKey;
  }

  /**
   * 转换原生触摸点为自定义触摸点
   */
  private convertTouches(nativeTouches: TouchList): Touch[] {
    const touches: Touch[] = [];
    for (let i = 0; i < nativeTouches.length; i++) {
      const nativeTouch = nativeTouches[i];
      const touch: Touch = {
        identifier: nativeTouch.identifier,
        screenPosition: new Vector2(nativeTouch.screenX, nativeTouch.screenY),
        clientPosition: new Vector2(nativeTouch.clientX, nativeTouch.clientY),
        pagePosition: new Vector2(nativeTouch.pageX, nativeTouch.pageY),
        force: nativeTouch.force,
        radiusX: nativeTouch.radiusX,
        radiusY: nativeTouch.radiusY,
        rotationAngle: nativeTouch.rotationAngle,
      };
      touches.push(touch);
    }
    return touches;
  }

  /**
   * 获取指针信息
   */
  getPointer(pointerId: number): PointerInfo | null {
    return this.pointers.get(pointerId) || null;
  }

  /**
   * 获取所有活动指针
   */
  getActivePointers(): PointerInfo[] {
    return Array.from(this.pointers.values());
  }

  /**
   * 检查指针是否按下
   */
  isPointerDown(pointerId: number): boolean {
    const pointer = this.pointers.get(pointerId);
    return pointer ? pointer.isDown : false;
  }

  /**
   * 检查指针是否在当前帧按下
   */
  isPointerPressed(pointerId: number): boolean {
    return this.currentFrameDownPointers.has(pointerId);
  }

  /**
   * 检查指针是否在当前帧抬起
   */
  isPointerReleased(pointerId: number): boolean {
    return this.currentFrameUpPointers.has(pointerId);
  }

  /**
   * 获取主指针（第一个触摸点或鼠标）
   */
  getPrimaryPointer(): PointerInfo | null {
    if (this.pointers.has(0)) {
      return this.pointers.get(0)!;
    }
    const pointers = Array.from(this.pointers.values());
    return pointers.length > 0 ? pointers[0] : null;
  }

  /**
   * 启用多点触控
   */
  enableMultiTouch(): void {
    this.multiTouchEnabled = true;
  }

  /**
   * 禁用多点触控
   */
  disableMultiTouch(): void {
    this.multiTouchEnabled = false;
  }

  /**
   * 启用指针输入
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * 禁用指针输入
   */
  disable(): void {
    this.enabled = false;
    this.reset();
  }

  /**
   * 重置指针状态
   */
  reset(): void {
    this.pointers.clear();
    this.currentFrameDownPointers.clear();
    this.currentFrameUpPointers.clear();
  }

  /**
   * 更新指针状态（每帧调用）
   */
  update(): void {
    this.currentFrameDownPointers.clear();
    this.currentFrameUpPointers.clear();
  }

  /**
   * 销毁指针管理器
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
