// 主要输入管理器
export { InputManager, InputManagerOptions, InputManagerEventType } from './input-manager';

// 子管理器
export { KeyboardManager } from './keyboard/keyboard-manager';
export { PointerManager, PointerInfo } from './pointer/pointer-manager';
export { WheelManager } from './wheel/wheel-manager';

// 枚举类型
export { InputEventType, KeyCode, MouseButton, PointerButton } from './enums/InputEventType';

// 事件接口
export {
  BaseInputEvent,
  Touch,
  TouchEvent,
  MouseEvent,
  KeyboardEvent,
  PointerEvent,
  DeviceMotionEvent,
  GamepadEvent,
} from './interface/Input-event';
