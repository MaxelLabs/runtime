import { EventDispatcher } from '../../base/event-dispatcher';
import { InputEventType, KeyCode } from '../enums/InputEventType';
import { KeyboardEvent } from '../interface/Input-event';

/**
 * 键盘管理器
 * 负责处理键盘输入事件
 */
export class KeyboardManager extends EventDispatcher {
  /** 当前按下的按键映射 */
  private keyStates: Map<KeyCode, boolean> = new Map();
  /** 当前帧按下的按键列表 */
  private currentFrameDownKeys: Set<KeyCode> = new Set();
  /** 当前帧抬起的按键列表 */
  private currentFrameUpKeys: Set<KeyCode> = new Set();
  /** 上一帧按下的按键列表 */
  private lastFrameDownKeys: Set<KeyCode> = new Set();
  /** 按键按下时间映射 */
  private keyDownTimes: Map<KeyCode, number> = new Map();
  /** 是否启用 */
  private enabled: boolean = true;
  /** 目标元素 */
  private targetElement: EventTarget;
  /** 事件监听器 */
  private eventListeners: Map<string, (event: Event) => void> = new Map();

  /**
   * 创建键盘管理器
   * @param targetElement 目标元素，默认为window
   */
  constructor(targetElement: EventTarget = window) {
    super();
    this.targetElement = targetElement;
    this.initialize();
  }

  /**
   * 初始化键盘管理器
   */
  private initialize(): void {
    this.bindEvents();
  }

  /**
   * 绑定键盘事件
   */
  private bindEvents(): void {
    const keyDownListener = (event: Event) => this.onKeyDown(event as globalThis.KeyboardEvent);
    const keyUpListener = (event: Event) => this.onKeyUp(event as globalThis.KeyboardEvent);

    this.targetElement.addEventListener('keydown', keyDownListener);
    this.targetElement.addEventListener('keyup', keyUpListener);

    this.eventListeners.set('keydown', keyDownListener);
    this.eventListeners.set('keyup', keyUpListener);
  }

  /**
   * 解绑键盘事件
   */
  private unbindEvents(): void {
    for (const [eventType, listener] of this.eventListeners) {
      this.targetElement.removeEventListener(eventType, listener);
    }
    this.eventListeners.clear();
  }

  /**
   * 键盘按下事件处理
   */
  private onKeyDown(nativeEvent: globalThis.KeyboardEvent): void {
    if (!this.enabled) {
      return;
    }

    const keyCode = nativeEvent.code as KeyCode;
    const isRepeat = this.keyStates.get(keyCode) || false;

    // 更新按键状态
    this.keyStates.set(keyCode, true);
    this.keyDownTimes.set(keyCode, Date.now());

    // 如果不是重复按键，添加到当前帧按下列表
    if (!isRepeat) {
      this.currentFrameDownKeys.add(keyCode);
    }

    // 创建键盘事件
    const keyboardEvent = new KeyboardEvent(
      isRepeat ? InputEventType.KEY_PRESSING : InputEventType.KEY_DOWN,
      keyCode,
      nativeEvent.key
    );

    // 设置修饰键状态
    keyboardEvent.altKey = nativeEvent.altKey;
    keyboardEvent.ctrlKey = nativeEvent.ctrlKey;
    keyboardEvent.metaKey = nativeEvent.metaKey;
    keyboardEvent.shiftKey = nativeEvent.shiftKey;
    keyboardEvent.repeat = isRepeat;

    // 派发事件
    this.dispatchEvent(keyboardEvent);
  }

  /**
   * 键盘抬起事件处理
   */
  private onKeyUp(nativeEvent: globalThis.KeyboardEvent): void {
    if (!this.enabled) {
      return;
    }

    const keyCode = nativeEvent.code as KeyCode;

    // 更新按键状态
    this.keyStates.set(keyCode, false);
    this.keyDownTimes.delete(keyCode);
    this.currentFrameUpKeys.add(keyCode);

    // 创建键盘事件
    const keyboardEvent = new KeyboardEvent(InputEventType.KEY_UP, keyCode, nativeEvent.key);

    // 设置修饰键状态
    keyboardEvent.altKey = nativeEvent.altKey;
    keyboardEvent.ctrlKey = nativeEvent.ctrlKey;
    keyboardEvent.metaKey = nativeEvent.metaKey;
    keyboardEvent.shiftKey = nativeEvent.shiftKey;

    // 派发事件
    this.dispatchEvent(keyboardEvent);
  }

  /**
   * 检查按键是否被按下
   * @param keyCode 按键代码
   * @returns 是否被按下
   */
  isKeyDown(keyCode: KeyCode): boolean {
    return this.keyStates.get(keyCode) || false;
  }

  /**
   * 检查按键是否在当前帧被按下
   * @param keyCode 按键代码
   * @returns 是否在当前帧被按下
   */
  isKeyPressed(keyCode: KeyCode): boolean {
    return this.currentFrameDownKeys.has(keyCode);
  }

  /**
   * 检查按键是否在当前帧被抬起
   * @param keyCode 按键代码
   * @returns 是否在当前帧被抬起
   */
  isKeyReleased(keyCode: KeyCode): boolean {
    return this.currentFrameUpKeys.has(keyCode);
  }

  /**
   * 获取按键按下的持续时间
   * @param keyCode 按键代码
   * @returns 持续时间（毫秒），如果按键未按下则返回0
   */
  getKeyDownDuration(keyCode: KeyCode): number {
    const downTime = this.keyDownTimes.get(keyCode);
    return downTime ? Date.now() - downTime : 0;
  }

  /**
   * 获取当前按下的所有按键
   * @returns 按键代码数组
   */
  getPressedKeys(): KeyCode[] {
    const pressedKeys: KeyCode[] = [];
    for (const [keyCode, isPressed] of this.keyStates) {
      if (isPressed) {
        pressedKeys.push(keyCode);
      }
    }
    return pressedKeys;
  }

  /**
   * 检查是否有任何按键被按下
   * @returns 是否有按键被按下
   */
  hasAnyKeyPressed(): boolean {
    for (const isPressed of this.keyStates.values()) {
      if (isPressed) {
        return true;
      }
    }
    return false;
  }

  /**
   * 检查修饰键状态
   */
  isShiftPressed(): boolean {
    return this.isKeyDown(KeyCode.SHIFT_LEFT) || this.isKeyDown(KeyCode.SHIFT_RIGHT);
  }

  isCtrlPressed(): boolean {
    return this.isKeyDown(KeyCode.CTRL_LEFT) || this.isKeyDown(KeyCode.CTRL_RIGHT);
  }

  isAltPressed(): boolean {
    return this.isKeyDown(KeyCode.ALT_LEFT) || this.isKeyDown(KeyCode.ALT_RIGHT);
  }

  /**
   * 启用键盘输入
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * 禁用键盘输入
   */
  disable(): void {
    this.enabled = false;
    this.reset();
  }

  /**
   * 重置键盘状态
   */
  reset(): void {
    this.keyStates.clear();
    this.currentFrameDownKeys.clear();
    this.currentFrameUpKeys.clear();
    this.lastFrameDownKeys.clear();
    this.keyDownTimes.clear();
  }

  /**
   * 更新键盘状态（每帧调用）
   */
  update(): void {
    // 清空当前帧的按键状态
    this.lastFrameDownKeys.clear();
    for (const key of this.currentFrameDownKeys) {
      this.lastFrameDownKeys.add(key);
    }
    this.currentFrameDownKeys.clear();
    this.currentFrameUpKeys.clear();
  }

  /**
   * 销毁键盘管理器
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
