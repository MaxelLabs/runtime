import { EventDispatcher } from '../base/event-dispatcher';
import { Container } from '../base/IOC';
import { Vector2 } from '@maxellabs/math';
import { KeyboardManager } from './keyboard/keyboard-manager';
import type { PointerInfo } from './pointer/pointer-manager';
import { PointerManager } from './pointer/pointer-manager';
import { WheelManager } from './wheel/wheel-manager';
import type { KeyCode } from './enums/InputEventType';
import { InputEventType } from './enums/InputEventType';
import type { TouchEvent, MouseEvent, KeyboardEvent, PointerEvent } from './interface/Input-event';
import { DeviceMotionEvent, GamepadEvent } from './interface/Input-event';

/**
 * 输入管理器配置选项
 */
export interface InputManagerOptions {
  /** 键盘目标元素 */
  keyboardTarget?: EventTarget;
  /** 指针目标元素 */
  pointerTarget?: EventTarget;
  /** 滚轮目标元素 */
  wheelTarget?: EventTarget;
  /** 是否启用多点触控 */
  enableMultiTouch?: boolean;
  /** 是否启用设备运动 */
  enableDeviceMotion?: boolean;
  /** 是否启用手柄 */
  enableGamepad?: boolean;
  /** 滚轮灵敏度 */
  wheelSensitivity?: number;
  /** 是否反转滚轮方向 */
  invertWheelDirection?: boolean;
}

/**
 * 输入管理器事件类型
 */
export enum InputManagerEventType {
  /** 输入管理器初始化完成 */
  INITIALIZED = 'initialized',
  /** 输入管理器启用 */
  ENABLED = 'enabled',
  /** 输入管理器禁用 */
  DISABLED = 'disabled',
  /** 输入管理器重置 */
  RESET = 'reset',
  /** 输入管理器销毁 */
  DESTROYED = 'destroyed',
}

/**
 * 输入管理器
 * 统一管理所有输入设备，包括键盘、鼠标、触摸、滚轮等
 */
export class InputManager extends EventDispatcher {
  /** 键盘管理器 */
  private keyboardManager: KeyboardManager;
  /** 指针管理器 */
  private pointerManager: PointerManager;
  /** 滚轮管理器 */
  private wheelManager: WheelManager;
  /** 是否已初始化 */
  private initialized: boolean = false;
  /** 是否启用 */
  private enabled: boolean = true;
  /** 配置选项 */
  private options: InputManagerOptions;
  /** IOC容器 */
  private container: Container;
  /** 设备运动管理器 */
  private deviceMotionEnabled: boolean = false;
  /** 手柄管理器 */
  private gamepadEnabled: boolean = false;
  /** 手柄状态 */
  private gamepads: Map<number, Gamepad> = new Map();

  /**
   * 创建输入管理器
   * @param options 配置选项
   */
  constructor(options: InputManagerOptions = {}) {
    super();
    this.options = {
      keyboardTarget: window,
      pointerTarget: document.body,
      wheelTarget: document.body,
      enableMultiTouch: true,
      enableDeviceMotion: false,
      enableGamepad: false,
      wheelSensitivity: 1.0,
      invertWheelDirection: false,
      ...options,
    };
    this.container = Container.getInstance();
    this.initialize();
  }

  /**
   * 初始化输入管理器
   */
  private initialize(): void {
    try {
      // 创建子管理器
      this.keyboardManager = new KeyboardManager(this.options.keyboardTarget!);
      this.pointerManager = new PointerManager(this.options.pointerTarget!);
      this.wheelManager = new WheelManager(this.options.wheelTarget!);

      // 配置子管理器
      if (this.options.enableMultiTouch) {
        this.pointerManager.enableMultiTouch();
      } else {
        this.pointerManager.disableMultiTouch();
      }

      this.wheelManager.setSensitivity(this.options.wheelSensitivity!);
      this.wheelManager.setInvertDirection(this.options.invertWheelDirection!);

      // 转发子管理器事件
      this.setupEventForwarding();

      // 初始化设备运动
      if (this.options.enableDeviceMotion) {
        this.initializeDeviceMotion();
      }

      // 初始化手柄
      if (this.options.enableGamepad) {
        this.initializeGamepad();
      }

      this.initialized = true;

      // 派发初始化完成事件
      this.dispatchEvent(InputManagerEventType.INITIALIZED);
    } catch (error) {
      console.error('Failed to initialize InputManager:', error);
      throw error;
    }
  }

  /**
   * 设置事件转发
   */
  private setupEventForwarding(): void {
    // 转发键盘事件
    this.keyboardManager.on(InputEventType.KEY_DOWN, (event: KeyboardEvent) => {
      this.dispatchEvent(event);
    });
    this.keyboardManager.on(InputEventType.KEY_UP, (event: KeyboardEvent) => {
      this.dispatchEvent(event);
    });
    this.keyboardManager.on(InputEventType.KEY_PRESSING, (event: KeyboardEvent) => {
      this.dispatchEvent(event);
    });

    // 转发指针事件
    this.pointerManager.on(InputEventType.POINTER_DOWN, (event: PointerEvent) => {
      this.dispatchEvent(event);
    });
    this.pointerManager.on(InputEventType.POINTER_MOVE, (event: PointerEvent) => {
      this.dispatchEvent(event);
    });
    this.pointerManager.on(InputEventType.POINTER_UP, (event: PointerEvent) => {
      this.dispatchEvent(event);
    });
    this.pointerManager.on(InputEventType.POINTER_CANCEL, (event: PointerEvent) => {
      this.dispatchEvent(event);
    });

    // 转发鼠标事件
    this.pointerManager.on(InputEventType.MOUSE_DOWN, (event: MouseEvent) => {
      this.dispatchEvent(event);
    });
    this.pointerManager.on(InputEventType.MOUSE_MOVE, (event: MouseEvent) => {
      this.dispatchEvent(event);
    });
    this.pointerManager.on(InputEventType.MOUSE_UP, (event: MouseEvent) => {
      this.dispatchEvent(event);
    });

    // 转发触摸事件
    this.pointerManager.on(InputEventType.TOUCH_START, (event: TouchEvent) => {
      this.dispatchEvent(event);
    });
    this.pointerManager.on(InputEventType.TOUCH_MOVE, (event: TouchEvent) => {
      this.dispatchEvent(event);
    });
    this.pointerManager.on(InputEventType.TOUCH_END, (event: TouchEvent) => {
      this.dispatchEvent(event);
    });
    this.pointerManager.on(InputEventType.TOUCH_CANCEL, (event: TouchEvent) => {
      this.dispatchEvent(event);
    });

    // 转发滚轮事件
    this.wheelManager.on(InputEventType.MOUSE_WHEEL, (event: MouseEvent) => {
      this.dispatchEvent(event);
    });
  }

  /**
   * 初始化设备运动
   */
  private initializeDeviceMotion(): void {
    if (typeof DeviceMotionEvent !== 'undefined') {
      window.addEventListener('devicemotion', this.onDeviceMotion.bind(this));
      this.deviceMotionEnabled = true;
    }
  }

  /**
   * 设备运动事件处理
   */
  private onDeviceMotion(nativeEvent: globalThis.DeviceMotionEvent): void {
    if (!this.enabled) {
      return;
    }

    const deviceMotionEvent = new DeviceMotionEvent(InputEventType.DEVICE_MOTION);

    if (nativeEvent.acceleration) {
      deviceMotionEvent.acceleration = {
        x: nativeEvent.acceleration.x || 0,
        y: nativeEvent.acceleration.y || 0,
        z: nativeEvent.acceleration.z || 0,
      };
    }

    if (nativeEvent.accelerationIncludingGravity) {
      deviceMotionEvent.accelerationIncludingGravity = {
        x: nativeEvent.accelerationIncludingGravity.x || 0,
        y: nativeEvent.accelerationIncludingGravity.y || 0,
        z: nativeEvent.accelerationIncludingGravity.z || 0,
      };
    }

    if (nativeEvent.rotationRate) {
      deviceMotionEvent.rotationRate = {
        alpha: nativeEvent.rotationRate.alpha || 0,
        beta: nativeEvent.rotationRate.beta || 0,
        gamma: nativeEvent.rotationRate.gamma || 0,
      };
    }

    deviceMotionEvent.interval = nativeEvent.interval || 0;

    this.dispatchEvent(deviceMotionEvent);
  }

  /**
   * 初始化手柄
   */
  private initializeGamepad(): void {
    if (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'getGamepads' in navigator &&
      'GamepadEvent' in window
    ) {
      window.addEventListener('gamepadconnected', this.onGamepadConnected.bind(this));
      window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected.bind(this));
      this.gamepadEnabled = true;
    }
  }

  /**
   * 手柄连接事件处理
   */
  private onGamepadConnected(nativeEvent: globalThis.GamepadEvent): void {
    const gamepad = nativeEvent.gamepad;
    this.gamepads.set(gamepad.index, gamepad);

    const gamepadEvent = new GamepadEvent(InputEventType.GAMEPAD_CHANGE, gamepad.index, gamepad.id);
    this.dispatchEvent(gamepadEvent);
  }

  /**
   * 手柄断开事件处理
   */
  private onGamepadDisconnected(nativeEvent: globalThis.GamepadEvent): void {
    const gamepad = nativeEvent.gamepad;
    this.gamepads.delete(gamepad.index);

    const gamepadEvent = new GamepadEvent(InputEventType.GAMEPAD_CHANGE, gamepad.index, gamepad.id);
    this.dispatchEvent(gamepadEvent);
  }

  /**
   * 更新手柄状态
   */
  private updateGamepads(): void {
    if (!this.gamepadEnabled || typeof navigator === 'undefined') {
      return;
    }

    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (gamepad) {
        const lastGamepad = this.gamepads.get(gamepad.index);

        // 检查按键状态变化
        if (lastGamepad) {
          for (let j = 0; j < gamepad.buttons.length; j++) {
            const currentButton = gamepad.buttons[j];
            const lastButton = lastGamepad.buttons[j];

            if (currentButton && lastButton && currentButton.pressed !== lastButton.pressed) {
              const gamepadEvent = new GamepadEvent(InputEventType.GAMEPAD_INPUT, gamepad.index, gamepad.id);
              gamepadEvent.buttons = gamepad.buttons.map((btn) => btn.pressed);
              gamepadEvent.axes = Array.from(gamepad.axes);
              this.dispatchEvent(gamepadEvent);
            }
          }
        }

        this.gamepads.set(gamepad.index, gamepad);
      }
    }
  }

  // ===== 键盘相关方法 =====

  /**
   * 检查按键是否被按下
   * @param keyCode 按键代码
   * @returns 是否被按下
   */
  isKeyDown(keyCode: KeyCode): boolean {
    return this.initialized ? this.keyboardManager.isKeyDown(keyCode) : false;
  }

  /**
   * 检查按键是否在当前帧被按下
   * @param keyCode 按键代码
   * @returns 是否在当前帧被按下
   */
  isKeyPressed(keyCode: KeyCode): boolean {
    return this.initialized ? this.keyboardManager.isKeyPressed(keyCode) : false;
  }

  /**
   * 检查按键是否在当前帧被抬起
   * @param keyCode 按键代码
   * @returns 是否在当前帧被抬起
   */
  isKeyReleased(keyCode: KeyCode): boolean {
    return this.initialized ? this.keyboardManager.isKeyReleased(keyCode) : false;
  }

  /**
   * 获取按键按下的持续时间
   * @param keyCode 按键代码
   * @returns 持续时间（毫秒）
   */
  getKeyDownDuration(keyCode: KeyCode): number {
    return this.initialized ? this.keyboardManager.getKeyDownDuration(keyCode) : 0;
  }

  /**
   * 获取当前按下的所有按键
   * @returns 按键代码数组
   */
  getPressedKeys(): KeyCode[] {
    return this.initialized ? this.keyboardManager.getPressedKeys() : [];
  }

  /**
   * 检查是否有任何按键被按下
   * @returns 是否有按键被按下
   */
  hasAnyKeyPressed(): boolean {
    return this.initialized ? this.keyboardManager.hasAnyKeyPressed() : false;
  }

  // ===== 指针相关方法 =====

  /**
   * 获取指针信息
   * @param pointerId 指针ID
   * @returns 指针信息
   */
  getPointer(pointerId: number): PointerInfo | null {
    return this.initialized ? this.pointerManager.getPointer(pointerId) : null;
  }

  /**
   * 获取所有活动指针
   * @returns 指针信息数组
   */
  getActivePointers(): PointerInfo[] {
    return this.initialized ? this.pointerManager.getActivePointers() : [];
  }

  /**
   * 检查指针是否按下
   * @param pointerId 指针ID
   * @returns 是否按下
   */
  isPointerDown(pointerId: number): boolean {
    return this.initialized ? this.pointerManager.isPointerDown(pointerId) : false;
  }

  /**
   * 检查指针是否在当前帧按下
   * @param pointerId 指针ID
   * @returns 是否在当前帧按下
   */
  isPointerPressed(pointerId: number): boolean {
    return this.initialized ? this.pointerManager.isPointerPressed(pointerId) : false;
  }

  /**
   * 检查指针是否在当前帧抬起
   * @param pointerId 指针ID
   * @returns 是否在当前帧抬起
   */
  isPointerReleased(pointerId: number): boolean {
    return this.initialized ? this.pointerManager.isPointerReleased(pointerId) : false;
  }

  /**
   * 获取主指针
   * @returns 主指针信息
   */
  getPrimaryPointer(): PointerInfo | null {
    return this.initialized ? this.pointerManager.getPrimaryPointer() : null;
  }

  // ===== 滚轮相关方法 =====

  /**
   * 获取当前帧滚轮增量
   * @returns 滚轮增量
   */
  getWheelDelta(): Vector2 {
    return this.initialized ? this.wheelManager.getCurrentDelta() : new Vector2();
  }

  /**
   * 获取累积滚轮增量
   * @returns 累积滚轮增量
   */
  getAccumulatedWheelDelta(): Vector2 {
    return this.initialized ? this.wheelManager.getAccumulatedDelta() : new Vector2();
  }

  /**
   * 检查是否有滚轮输入
   * @returns 是否有滚轮输入
   */
  hasWheelInput(): boolean {
    return this.initialized ? this.wheelManager.hasWheelInput() : false;
  }

  /**
   * 重置累积滚轮增量
   */
  resetAccumulatedWheelDelta(): void {
    if (this.initialized) {
      this.wheelManager.resetAccumulatedDelta();
    }
  }

  // ===== 配置方法 =====

  /**
   * 启用多点触控
   */
  enableMultiTouch(): void {
    if (this.initialized) {
      this.pointerManager.enableMultiTouch();
    }
  }

  /**
   * 禁用多点触控
   */
  disableMultiTouch(): void {
    if (this.initialized) {
      this.pointerManager.disableMultiTouch();
    }
  }

  /**
   * 设置滚轮灵敏度
   * @param sensitivity 灵敏度值
   */
  setWheelSensitivity(sensitivity: number): void {
    if (this.initialized) {
      this.wheelManager.setSensitivity(sensitivity);
    }
  }

  /**
   * 设置是否反转滚轮方向
   * @param invert 是否反转
   */
  setInvertWheelDirection(invert: boolean): void {
    if (this.initialized) {
      this.wheelManager.setInvertDirection(invert);
    }
  }

  // ===== 生命周期方法 =====

  /**
   * 启用输入管理器
   */
  enable(): void {
    this.enabled = true;
    if (this.initialized) {
      this.keyboardManager.enable();
      this.pointerManager.enable();
      this.wheelManager.enable();
    }
    this.dispatchEvent(InputManagerEventType.ENABLED);
  }

  /**
   * 禁用输入管理器
   */
  disable(): void {
    this.enabled = false;
    if (this.initialized) {
      this.keyboardManager.disable();
      this.pointerManager.disable();
      this.wheelManager.disable();
    }
    this.dispatchEvent(InputManagerEventType.DISABLED);
  }

  /**
   * 重置输入状态
   */
  reset(): void {
    if (this.initialized) {
      this.keyboardManager.reset();
      this.pointerManager.reset();
      this.wheelManager.reset();
    }
    this.dispatchEvent(InputManagerEventType.RESET);
  }

  /**
   * 更新输入状态（每帧调用）
   */
  update(): void {
    if (!this.initialized || !this.enabled) {
      return;
    }

    // 更新子管理器
    this.keyboardManager.update();
    this.pointerManager.update();
    this.wheelManager.update();

    // 更新手柄
    if (this.gamepadEnabled) {
      this.updateGamepads();
    }
  }

  /**
   * 检查是否已初始化
   * @returns 是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 检查是否已启用
   * @returns 是否已启用
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 销毁输入管理器
   */
  override destroy(): void {
    if (this.destroyed) {
      return;
    }

    // 销毁子管理器
    if (this.initialized) {
      this.keyboardManager.destroy();
      this.pointerManager.destroy();
      this.wheelManager.destroy();
    }

    // 清理手柄
    this.gamepads.clear();

    this.initialized = false;
    this.enabled = false;

    this.dispatchEvent(InputManagerEventType.DESTROYED);
    super.destroy();
  }
}
