# Maxellabs 3D Engine - 输入系统

Maxellabs 3D Engine 的输入系统提供了统一的输入管理功能，支持键盘、鼠标、触摸、滚轮、设备运动和手柄等多种输入设备。

## 特性

- 🎮 **多设备支持**: 键盘、鼠标、触摸、滚轮、设备运动、手柄
- 🔄 **事件驱动**: 基于事件分发器的架构
- 📱 **跨平台**: 支持桌面和移动设备
- 🎯 **高性能**: 优化的事件处理和状态管理
- 🔧 **可配置**: 灵活的配置选项
- 🧩 **模块化**: 清晰的模块分离

## 快速开始

### 基本使用

```typescript
import { InputManager, InputEventType, KeyCode } from '@maxellabs/core';

// 创建输入管理器
const inputManager = new InputManager({
  enableMultiTouch: true,
  enableDeviceMotion: false,
  enableGamepad: true,
  wheelSensitivity: 1.0,
});

// 监听键盘事件
inputManager.on(InputEventType.KEY_DOWN, (event) => {
  console.log('按键按下:', event.code);
});

// 监听鼠标事件
inputManager.on(InputEventType.MOUSE_DOWN, (event) => {
  console.log('鼠标按下:', event.button, event.clientPosition);
});

// 监听触摸事件
inputManager.on(InputEventType.TOUCH_START, (event) => {
  console.log('触摸开始:', event.changedTouches.length);
});

// 在游戏循环中更新
function gameLoop() {
  inputManager.update();
  
  // 检查按键状态
  if (inputManager.isKeyDown(KeyCode.W)) {
    console.log('W键被按下');
  }
  
  // 检查鼠标状态
  const pointer = inputManager.getPrimaryPointer();
  if (pointer && pointer.isDown) {
    console.log('鼠标被按下:', pointer.position);
  }
  
  // 检查滚轮
  if (inputManager.hasWheelInput()) {
    const delta = inputManager.getWheelDelta();
    console.log('滚轮滚动:', delta);
  }
  
  requestAnimationFrame(gameLoop);
}

gameLoop();
```

### 与引擎集成

```typescript
import { Engine, InputManager } from '@maxellabs/core';

const engine = new Engine({
  canvas: document.getElementById('canvas'),
});

// 输入管理器会自动注册到IOC容器
const inputManager = engine.getInputManager();

// 监听输入事件
inputManager.on(InputEventType.KEY_DOWN, (event) => {
  if (event.code === KeyCode.ESCAPE) {
    engine.pause();
  }
});
```

## API 文档

### InputManager

主要的输入管理器类，统一管理所有输入设备。

#### 构造函数

```typescript
constructor(options?: InputManagerOptions)
```

#### 配置选项

```typescript
interface InputManagerOptions {
  keyboardTarget?: EventTarget;      // 键盘目标元素，默认为window
  pointerTarget?: EventTarget;       // 指针目标元素，默认为document.body
  wheelTarget?: EventTarget;         // 滚轮目标元素，默认为document.body
  enableMultiTouch?: boolean;        // 是否启用多点触控，默认为true
  enableDeviceMotion?: boolean;      // 是否启用设备运动，默认为false
  enableGamepad?: boolean;           // 是否启用手柄，默认为false
  wheelSensitivity?: number;         // 滚轮灵敏度，默认为1.0
  invertWheelDirection?: boolean;    // 是否反转滚轮方向，默认为false
}
```

#### 键盘方法

```typescript
// 检查按键是否被按下
isKeyDown(keyCode: KeyCode): boolean

// 检查按键是否在当前帧被按下
isKeyPressed(keyCode: KeyCode): boolean

// 检查按键是否在当前帧被抬起
isKeyReleased(keyCode: KeyCode): boolean

// 获取按键按下的持续时间（毫秒）
getKeyDownDuration(keyCode: KeyCode): number

// 获取当前按下的所有按键
getPressedKeys(): KeyCode[]

// 检查是否有任何按键被按下
hasAnyKeyPressed(): boolean
```

#### 指针方法

```typescript
// 获取指针信息
getPointer(pointerId: number): PointerInfo | null

// 获取所有活动指针
getActivePointers(): PointerInfo[]

// 检查指针是否按下
isPointerDown(pointerId: number): boolean

// 检查指针是否在当前帧按下
isPointerPressed(pointerId: number): boolean

// 检查指针是否在当前帧抬起
isPointerReleased(pointerId: number): boolean

// 获取主指针（第一个触摸点或鼠标）
getPrimaryPointer(): PointerInfo | null
```

#### 滚轮方法

```typescript
// 获取当前帧滚轮增量
getWheelDelta(): Vector2

// 获取累积滚轮增量
getAccumulatedWheelDelta(): Vector2

// 检查是否有滚轮输入
hasWheelInput(): boolean

// 重置累积滚轮增量
resetAccumulatedWheelDelta(): void
```

### 事件类型

```typescript
enum InputEventType {
  // 触摸事件
  TOUCH_START = 'touch-start',
  TOUCH_MOVE = 'touch-move',
  TOUCH_END = 'touch-end',
  TOUCH_CANCEL = 'touch-cancel',

  // 鼠标事件
  MOUSE_DOWN = 'mouse-down',
  MOUSE_MOVE = 'mouse-move',
  MOUSE_UP = 'mouse-up',
  MOUSE_WHEEL = 'mouse-wheel',
  MOUSE_ENTER = 'mouse-enter',
  MOUSE_LEAVE = 'mouse-leave',

  // 键盘事件
  KEY_DOWN = 'key-down',
  KEY_PRESSING = 'key-pressing',
  KEY_UP = 'key-up',

  // 指针事件
  POINTER_DOWN = 'pointer-down',
  POINTER_MOVE = 'pointer-move',
  POINTER_UP = 'pointer-up',
  POINTER_CANCEL = 'pointer-cancel',

  // 设备运动事件
  DEVICE_MOTION = 'device-motion',

  // 手柄事件
  GAMEPAD_INPUT = 'gamepad-input',
  GAMEPAD_CHANGE = 'gamepad-change',
}
```

### 按键代码

```typescript
enum KeyCode {
  // 字母键
  A = 'KeyA', B = 'KeyB', C = 'KeyC', // ...

  // 数字键
  DIGIT_0 = 'Digit0', DIGIT_1 = 'Digit1', // ...

  // 功能键
  ESCAPE = 'Escape',
  TAB = 'Tab',
  SPACE = 'Space',
  ENTER = 'Enter',
  BACKSPACE = 'Backspace',

  // 方向键
  ARROW_UP = 'ArrowUp',
  ARROW_DOWN = 'ArrowDown',
  ARROW_LEFT = 'ArrowLeft',
  ARROW_RIGHT = 'ArrowRight',

  // F键
  F1 = 'F1', F2 = 'F2', // ...
}
```

## 使用示例

### 第一人称控制器

```typescript
class FirstPersonController {
  private inputManager: InputManager;
  private camera: Camera;
  private moveSpeed = 5.0;
  private rotateSpeed = 2.0;

  constructor(inputManager: InputManager, camera: Camera) {
    this.inputManager = inputManager;
    this.camera = camera;
    this.setupInputHandlers();
  }

  private setupInputHandlers(): void {
    // 鼠标移动控制视角
    this.inputManager.on(InputEventType.MOUSE_MOVE, (event) => {
      if (this.inputManager.isPointerDown(0)) {
        const delta = event.movementDelta;
        this.camera.rotate(delta.x * this.rotateSpeed, delta.y * this.rotateSpeed);
      }
    });

    // 滚轮控制缩放
    this.inputManager.on(InputEventType.MOUSE_WHEEL, (event) => {
      const delta = event.wheelDelta.y;
      this.camera.zoom(delta * 0.1);
    });
  }

  update(deltaTime: number): void {
    const moveVector = new Vector3();

    // WASD移动
    if (this.inputManager.isKeyDown(KeyCode.W)) {
      moveVector.z -= 1;
    }
    if (this.inputManager.isKeyDown(KeyCode.S)) {
      moveVector.z += 1;
    }
    if (this.inputManager.isKeyDown(KeyCode.A)) {
      moveVector.x -= 1;
    }
    if (this.inputManager.isKeyDown(KeyCode.D)) {
      moveVector.x += 1;
    }

    // 空格和Shift控制上下移动
    if (this.inputManager.isKeyDown(KeyCode.SPACE)) {
      moveVector.y += 1;
    }
    if (this.inputManager.isKeyDown(KeyCode.SHIFT_LEFT)) {
      moveVector.y -= 1;
    }

    // 应用移动
    if (moveVector.length() > 0) {
      moveVector.normalize();
      moveVector.multiplyScalar(this.moveSpeed * deltaTime);
      this.camera.translate(moveVector);
    }
  }
}
```

### 触摸手势识别

```typescript
class GestureRecognizer {
  private inputManager: InputManager;
  private lastTouchPositions: Map<number, Vector2> = new Map();

  constructor(inputManager: InputManager) {
    this.inputManager = inputManager;
    this.setupGestureHandlers();
  }

  private setupGestureHandlers(): void {
    this.inputManager.on(InputEventType.TOUCH_START, (event) => {
      for (const touch of event.changedTouches) {
        this.lastTouchPositions.set(touch.identifier, touch.clientPosition.clone());
      }
    });

    this.inputManager.on(InputEventType.TOUCH_MOVE, (event) => {
      if (event.touches.length === 2) {
        this.handlePinchGesture(event.touches);
      } else if (event.touches.length === 1) {
        this.handlePanGesture(event.touches[0]);
      }
    });

    this.inputManager.on(InputEventType.TOUCH_END, (event) => {
      for (const touch of event.changedTouches) {
        this.lastTouchPositions.delete(touch.identifier);
      }
    });
  }

  private handlePinchGesture(touches: Touch[]): void {
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    const currentDistance = touch1.clientPosition.distanceTo(touch2.clientPosition);
    const lastPos1 = this.lastTouchPositions.get(touch1.identifier);
    const lastPos2 = this.lastTouchPositions.get(touch2.identifier);
    
    if (lastPos1 && lastPos2) {
      const lastDistance = lastPos1.distanceTo(lastPos2);
      const scale = currentDistance / lastDistance;
      
      // 触发缩放事件
      this.onPinch(scale);
    }
    
    this.lastTouchPositions.set(touch1.identifier, touch1.clientPosition.clone());
    this.lastTouchPositions.set(touch2.identifier, touch2.clientPosition.clone());
  }

  private handlePanGesture(touch: Touch): void {
    const lastPosition = this.lastTouchPositions.get(touch.identifier);
    if (lastPosition) {
      const delta = touch.clientPosition.clone().subtract(lastPosition);
      
      // 触发平移事件
      this.onPan(delta);
    }
    
    this.lastTouchPositions.set(touch.identifier, touch.clientPosition.clone());
  }

  private onPinch(scale: number): void {
    console.log('缩放手势:', scale);
  }

  private onPan(delta: Vector2): void {
    console.log('平移手势:', delta);
  }
}
```

## 最佳实践

1. **性能优化**
   - 在游戏循环中调用 `inputManager.update()`
   - 避免在事件处理器中执行重计算
   - 使用状态查询而不是事件监听来处理连续输入

2. **事件处理**
   - 使用适当的事件类型
   - 及时移除不需要的事件监听器
   - 避免在事件处理器中抛出异常

3. **跨平台兼容性**
   - 同时处理鼠标和触摸事件
   - 考虑不同设备的输入特性
   - 提供备用输入方案

4. **用户体验**
   - 提供输入反馈
   - 支持自定义按键绑定
   - 考虑无障碍访问

## 故障排除

### 常见问题

1. **事件不触发**
   - 检查目标元素是否正确
   - 确保输入管理器已初始化
   - 验证事件监听器是否正确绑定

2. **性能问题**
   - 减少事件处理器的复杂度
   - 使用状态查询替代频繁的事件监听
   - 优化更新循环

3. **移动设备问题**
   - 启用多点触控支持
   - 处理触摸事件的默认行为
   - 考虑设备方向变化

### 调试技巧

```typescript
// 启用调试模式
inputManager.on('*', (event) => {
  console.log('输入事件:', event.type, event);
});

// 监控输入状态
setInterval(() => {
  console.log('活动指针:', inputManager.getActivePointers().length);
  console.log('按下的按键:', inputManager.getPressedKeys());
}, 1000);
``` 