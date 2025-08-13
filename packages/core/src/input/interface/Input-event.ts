import { Event } from '../../base/event';
import { Vector2 } from '@maxellabs/math';
import type { InputEventType, KeyCode } from '../enums/InputEventType';
import { PointerButton } from '../enums/InputEventType';
import { MouseButton } from '@maxellabs/specification';

/**
 * 基础输入事件接口
 */
export interface BaseInputEvent {
  /** 事件类型 */
  type: InputEventType;
  /** 事件时间戳 */
  timestamp: number;
  /** 是否阻止默认行为 */
  preventDefault(): void;
  /** 是否停止事件传播 */
  stopPropagation(): void;
}

/**
 * 触摸点信息
 */
export interface Touch {
  /** 触摸点ID */
  identifier: number;
  /** 屏幕坐标 */
  screenPosition: Vector2;
  /** 客户端坐标 */
  clientPosition: Vector2;
  /** 页面坐标 */
  pagePosition: Vector2;
  /** 压力值 */
  force: number;
  /** 半径X */
  radiusX: number;
  /** 半径Y */
  radiusY: number;
  /** 旋转角度 */
  rotationAngle: number;
}

/**
 * 触摸事件
 */
export class TouchEvent extends Event implements BaseInputEvent {
  /** 触摸点列表 */
  touches: Touch[];
  /** 目标元素上的触摸点列表 */
  targetTouches: Touch[];
  /** 改变的触摸点列表 */
  changedTouches: Touch[];
  /** 是否按下Alt键 */
  altKey: boolean;
  /** 是否按下Ctrl键 */
  ctrlKey: boolean;
  /** 是否按下Meta键 */
  metaKey: boolean;
  /** 是否按下Shift键 */
  shiftKey: boolean;
  /** 事件类型 */
  declare type: InputEventType;

  constructor(type: InputEventType, touches: Touch[] = [], targetTouches: Touch[] = [], changedTouches: Touch[] = []) {
    super(type as string);
    this.type = type;
    this.touches = touches;
    this.targetTouches = targetTouches;
    this.changedTouches = changedTouches;
    this.altKey = false;
    this.ctrlKey = false;
    this.metaKey = false;
    this.shiftKey = false;
  }

  preventDefault(): void {}

  /**
   * 获取主要触摸点
   */
  getPrimaryTouch(): Touch | null {
    return this.changedTouches.length > 0 ? this.changedTouches[0] : null;
  }

  /**
   * 根据ID获取触摸点
   */
  getTouchById(id: number): Touch | null {
    return this.touches.find((touch) => touch.identifier === id) || null;
  }
}

/**
 * 鼠标事件
 */
export class MouseEvent extends Event implements BaseInputEvent {
  /** 鼠标按键 */
  button: MouseButton;
  /** 按下的按键状态 */
  buttons: number;
  /** 屏幕坐标 */
  screenPosition: Vector2;
  /** 客户端坐标 */
  clientPosition: Vector2;
  /** 页面坐标 */
  pagePosition: Vector2;
  /** 相对移动距离 */
  movementDelta: Vector2;
  /** 滚轮增量 */
  wheelDelta: Vector2;
  /** 是否按下Alt键 */
  altKey: boolean;
  /** 是否按下Ctrl键 */
  ctrlKey: boolean;
  /** 是否按下Meta键 */
  metaKey: boolean;
  /** 是否按下Shift键 */
  shiftKey: boolean;
  /** 事件类型 */
  declare type: InputEventType;

  constructor(type: InputEventType, button: MouseButton = MouseButton.Left) {
    super(type);
    this.button = button;
    this.buttons = 0;
    this.screenPosition = new Vector2();
    this.clientPosition = new Vector2();
    this.pagePosition = new Vector2();
    this.movementDelta = new Vector2();
    this.wheelDelta = new Vector2();
    this.altKey = false;
    this.ctrlKey = false;
    this.metaKey = false;
    this.shiftKey = false;
  }
  preventDefault(): void {}

  /**
   * 检查是否按下指定按键
   */
  isButtonPressed(button: MouseButton): boolean {
    return (this.buttons & (1 << button)) !== 0;
  }
}

/**
 * 键盘事件
 */
export class KeyboardEvent extends Event implements BaseInputEvent {
  /** 按键代码 */
  code: KeyCode;
  /** 按键值 */
  key: string;
  /** 是否重复按键 */
  repeat: boolean;
  /** 是否按下Alt键 */
  altKey: boolean;
  /** 是否按下Ctrl键 */
  ctrlKey: boolean;
  /** 是否按下Meta键 */
  metaKey: boolean;
  /** 是否按下Shift键 */
  shiftKey: boolean;
  /** 事件类型 */
  declare type: InputEventType;

  constructor(type: InputEventType, code: KeyCode, key: string = '') {
    super(type);
    this.code = code;
    this.key = key;
    this.repeat = false;
    this.altKey = false;
    this.ctrlKey = false;
    this.metaKey = false;
    this.shiftKey = false;
  }
  preventDefault(): void {}
}

/**
 * 指针事件
 */
export class PointerEvent extends Event implements BaseInputEvent {
  /** 指针ID */
  pointerId: number;
  /** 指针类型 */
  pointerType: string;
  /** 按键状态 */
  button: PointerButton;
  /** 按下的按键状态 */
  buttons: number;
  /** 屏幕坐标 */
  screenPosition: Vector2;
  /** 客户端坐标 */
  clientPosition: Vector2;
  /** 页面坐标 */
  pagePosition: Vector2;
  /** 相对移动距离 */
  movementDelta: Vector2;
  /** 压力值 */
  pressure: number;
  /** 倾斜角度X */
  tiltX: number;
  /** 倾斜角度Y */
  tiltY: number;
  /** 是否按下Alt键 */
  altKey: boolean;
  /** 是否按下Ctrl键 */
  ctrlKey: boolean;
  /** 是否按下Meta键 */
  metaKey: boolean;
  /** 是否按下Shift键 */
  shiftKey: boolean;
  /** 事件类型 */
  declare type: InputEventType;

  constructor(type: InputEventType, pointerId: number = 0, pointerType: string = 'mouse') {
    super(type);
    this.pointerId = pointerId;
    this.pointerType = pointerType;
    this.button = PointerButton.PRIMARY;
    this.buttons = 0;
    this.screenPosition = new Vector2();
    this.clientPosition = new Vector2();
    this.pagePosition = new Vector2();
    this.movementDelta = new Vector2();
    this.pressure = 0;
    this.tiltX = 0;
    this.tiltY = 0;
    this.altKey = false;
    this.ctrlKey = false;
    this.metaKey = false;
    this.shiftKey = false;
  }
  preventDefault(): void {}
}

/**
 * 设备运动事件
 */
export class DeviceMotionEvent extends Event implements BaseInputEvent {
  /** 加速度信息 */
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  /** 包含重力的加速度信息 */
  accelerationIncludingGravity: {
    x: number;
    y: number;
    z: number;
  };
  /** 旋转速率 */
  rotationRate: {
    alpha: number;
    beta: number;
    gamma: number;
  };
  /** 时间间隔 */
  interval: number;
  /** 事件类型 */
  declare type: InputEventType;

  constructor(type: InputEventType) {
    super(type);
    this.acceleration = { x: 0, y: 0, z: 0 };
    this.accelerationIncludingGravity = { x: 0, y: 0, z: 0 };
    this.rotationRate = { alpha: 0, beta: 0, gamma: 0 };
    this.interval = 0;
  }
  preventDefault(): void {
    throw new Error('Method not implemented.');
  }
}

/**
 * 手柄事件
 */
export class GamepadEvent extends Event implements BaseInputEvent {
  /** 手柄索引 */
  gamepadIndex: number;
  /** 手柄ID */
  gamepadId: string;
  /** 按键状态 */
  buttons: boolean[];
  /** 摇杆状态 */
  axes: number[];
  /** 事件类型 */
  declare type: InputEventType;

  constructor(type: InputEventType, gamepadIndex: number = 0, gamepadId: string = '') {
    super(type);
    this.gamepadIndex = gamepadIndex;
    this.gamepadId = gamepadId;
    this.buttons = [];
    this.axes = [];
  }
  preventDefault(): void {}
}
