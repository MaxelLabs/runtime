/**
 * 输入事件类型枚举
 */
export enum InputEventType {
  /** 触摸开始事件 */
  TOUCH_START = 'touch-start',
  /** 触摸移动事件 */
  TOUCH_MOVE = 'touch-move',
  /** 触摸结束事件 */
  TOUCH_END = 'touch-end',
  /** 触摸取消事件 */
  TOUCH_CANCEL = 'touch-cancel',

  /** 鼠标按下事件 */
  MOUSE_DOWN = 'mouse-down',
  /** 鼠标移动事件 */
  MOUSE_MOVE = 'mouse-move',
  /** 鼠标抬起事件 */
  MOUSE_UP = 'mouse-up',
  /** 鼠标滚轮事件 */
  MOUSE_WHEEL = 'mouse-wheel',
  /** 鼠标进入事件 */
  MOUSE_ENTER = 'mouse-enter',
  /** 鼠标离开事件 */
  MOUSE_LEAVE = 'mouse-leave',

  /** 键盘按下事件 */
  KEY_DOWN = 'key-down',
  /** 键盘按住事件 */
  KEY_PRESSING = 'key-pressing',
  /** 键盘抬起事件 */
  KEY_UP = 'key-up',

  /** 设备运动事件（重力感应） */
  DEVICE_MOTION = 'device-motion',

  /** 手柄输入事件 */
  GAMEPAD_INPUT = 'gamepad-input',
  /** 手柄设备变化事件 */
  GAMEPAD_CHANGE = 'gamepad-change',

  /** 指针按下事件 */
  POINTER_DOWN = 'pointer-down',
  /** 指针移动事件 */
  POINTER_MOVE = 'pointer-move',
  /** 指针抬起事件 */
  POINTER_UP = 'pointer-up',
  /** 指针取消事件 */
  POINTER_CANCEL = 'pointer-cancel',
}

/**
 * 键盘按键代码枚举
 */
export enum KeyCode {
  // 字母键
  A = 'KeyA',
  B = 'KeyB',
  C = 'KeyC',
  D = 'KeyD',
  E = 'KeyE',
  F = 'KeyF',
  G = 'KeyG',
  H = 'KeyH',
  I = 'KeyI',
  J = 'KeyJ',
  K = 'KeyK',
  L = 'KeyL',
  M = 'KeyM',
  N = 'KeyN',
  O = 'KeyO',
  P = 'KeyP',
  Q = 'KeyQ',
  R = 'KeyR',
  S = 'KeyS',
  T = 'KeyT',
  U = 'KeyU',
  V = 'KeyV',
  W = 'KeyW',
  X = 'KeyX',
  Y = 'KeyY',
  Z = 'KeyZ',

  // 数字键
  DIGIT_0 = 'Digit0',
  DIGIT_1 = 'Digit1',
  DIGIT_2 = 'Digit2',
  DIGIT_3 = 'Digit3',
  DIGIT_4 = 'Digit4',
  DIGIT_5 = 'Digit5',
  DIGIT_6 = 'Digit6',
  DIGIT_7 = 'Digit7',
  DIGIT_8 = 'Digit8',
  DIGIT_9 = 'Digit9',

  // 功能键
  ESCAPE = 'Escape',
  TAB = 'Tab',
  CAPS_LOCK = 'CapsLock',
  SHIFT_LEFT = 'ShiftLeft',
  SHIFT_RIGHT = 'ShiftRight',
  CTRL_LEFT = 'ControlLeft',
  CTRL_RIGHT = 'ControlRight',
  ALT_LEFT = 'AltLeft',
  ALT_RIGHT = 'AltRight',
  SPACE = 'Space',
  ENTER = 'Enter',
  BACKSPACE = 'Backspace',

  // 方向键
  ARROW_UP = 'ArrowUp',
  ARROW_DOWN = 'ArrowDown',
  ARROW_LEFT = 'ArrowLeft',
  ARROW_RIGHT = 'ArrowRight',

  // F键
  F1 = 'F1',
  F2 = 'F2',
  F3 = 'F3',
  F4 = 'F4',
  F5 = 'F5',
  F6 = 'F6',
  F7 = 'F7',
  F8 = 'F8',
  F9 = 'F9',
  F10 = 'F10',
  F11 = 'F11',
  F12 = 'F12',
}

/**
 * 指针按键枚举
 */
export enum PointerButton {
  /** 左键/主要按键 */
  PRIMARY = 1,
  /** 右键/次要按键 */
  SECONDARY = 2,
  /** 中键/辅助按键 */
  AUXILIARY = 4,
}
