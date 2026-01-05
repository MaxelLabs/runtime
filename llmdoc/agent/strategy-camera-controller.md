---
id: "strategy-camera-controller"
type: "strategy"
title: "相机控制器技术规格"
description: "Engine 包相机控制器的详细技术规格，包括 OrbitController、FPSController 和输入事件处理"
tags: ["engine", "camera", "controller", "orbit", "fps", "input", "mouse", "touch"]
context_dependency: ["arch-engine-architecture-spec"]
related_ids: ["arch-engine-architecture-spec"]
last_updated: "2026-01-05"
---

# 相机控制器技术规格

> **Context**: Engine 包需要提供便捷的相机控制器以改善用户交互体验。
> **Goal**: 实现 OrbitController 和 FPSController，支持鼠标和触摸输入。

---

## 1. 设计目标

### 1.1 功能需求

| 需求 | 描述 | 优先级 |
|------|------|:------:|
| OrbitController | 轨道相机控制 | P1 |
| FPSController | 第一人称控制 | P2 |
| FlyController | 自由飞行控制 | P2 |
| 鼠标输入 | 鼠标拖拽、滚轮 | P1 |
| 触摸输入 | 单指拖拽、双指缩放 | P1 |
| 键盘输入 | WASD 移动 | P2 |
| 阻尼效果 | 平滑过渡动画 | P1 |
| 边界限制 | 距离、角度限制 | P1 |

### 1.2 性能目标

- 输入响应延迟 < 16ms
- 阻尼计算不影响帧率
- 支持同时处理多种输入

---

## 2. 接口定义

### 2.1 控制器基类接口

```typescript
/**
 * 相机控制器基类接口
 */
interface ICameraController {
  /** 控制的相机实体 */
  camera: EntityId;
  /** 是否启用 */
  enabled: boolean;
  /** 绑定的 DOM 元素 */
  domElement: HTMLElement;
  
  /**
   * 每帧更新
   * @param deltaTime 帧间隔时间
   */
  update(deltaTime: number): void;
  
  /**
   * 重置到初始状态
   */
  reset(): void;
  
  /**
   * 释放资源
   */
  dispose(): void;
}
```

### 2.2 OrbitController 接口

```typescript
/**
 * 轨道控制器配置
 */
interface OrbitControllerConfig {
  /** 目标点 默认 [0,0,0] */
  target?: Vector3Like;
  
  // 距离限制
  /** 最小距离 默认 0.1 */
  minDistance?: number;
  /** 最大距离 默认 Infinity */
  maxDistance?: number;
  
  // 极角限制 垂直旋转
  /** 最小极角 默认 0 */
  minPolarAngle?: number;
  /** 最大极角 默认 PI */
  maxPolarAngle?: number;
  
  // 方位角限制 水平旋转
  /** 最小方位角 默认 -Infinity */
  minAzimuthAngle?: number;
  /** 最大方位角 默认 Infinity */
  maxAzimuthAngle?: number;
  
  // 阻尼
  /** 启用阻尼 默认 true */
  enableDamping?: boolean;
  /** 阻尼系数 默认 0.05 */
  dampingFactor?: number;
  
  // 速度
  /** 旋转速度 默认 1 */
  rotateSpeed?: number;
  /** 缩放速度 默认 1 */
  zoomSpeed?: number;
  /** 平移速度 默认 1 */
  panSpeed?: number;
  
  // 功能开关
  /** 启用旋转 默认 true */
  enableRotate?: boolean;
  /** 启用缩放 默认 true */
  enableZoom?: boolean;
  /** 启用平移 默认 true */
  enablePan?: boolean;
  
  // 自动旋转
  /** 启用自动旋转 默认 false */
  autoRotate?: boolean;
  /** 自动旋转速度 默认 2 度/秒 */
  autoRotateSpeed?: number;
}

/**
 * 轨道控制器
 */
interface IOrbitController extends ICameraController {
  /** 目标点 */
  target: Vector3Like;
  
  /** 获取当前距离 */
  getDistance(): number;
  
  /** 设置距离 */
  setDistance(distance: number): void;
  
  /** 获取极角 */
  getPolarAngle(): number;
  
  /** 获取方位角 */
  getAzimuthAngle(): number;
  
  /** 保存当前状态 */
  saveState(): void;
  
  /** 恢复保存的状态 */
  restoreState(): void;
}
```

### 2.3 FPSController 接口

```typescript
/**
 * FPS 控制器配置
 */
interface FPSControllerConfig {
  /** 移动速度 默认 5 */
  moveSpeed?: number;
  /** 冲刺速度倍数 默认 2 */
  sprintMultiplier?: number;
  /** 视角灵敏度 默认 0.002 */
  lookSpeed?: number;
  
  // 垂直视角限制
  /** 最小俯仰角 默认 -PI/2 */
  minPitch?: number;
  /** 最大俯仰角 默认 PI/2 */
  maxPitch?: number;
  
  // 物理
  /** 启用重力 默认 false */
  enableGravity?: boolean;
  /** 重力加速度 默认 9.8 */
  gravity?: number;
  /** 跳跃高度 默认 1 */
  jumpHeight?: number;
  
  // 功能开关
  /** 启用指针锁定 默认 true */
  enablePointerLock?: boolean;
}

/**
 * FPS 控制器
 */
interface IFPSController extends ICameraController {
  /** 当前速度 */
  velocity: Vector3Like;
  /** 是否在地面上 */
  isGrounded: boolean;
  
  /** 跳跃 */
  jump(): void;
  
  /** 锁定指针 */
  lockPointer(): void;
  
  /** 解锁指针 */
  unlockPointer(): void;
}
```

---

## 3. OrbitController 实现

### 3.1 球坐标系统

```pseudocode
/**
 * 球坐标到笛卡尔坐标转换
 * @param radius 半径 距离
 * @param phi 极角 从 Y 轴向下
 * @param theta 方位角 从 Z 轴逆时针
 */
FUNCTION sphericalToCartesian(radius: number, phi: number, theta: number): Vector3
  sinPhi = sin(phi)
  cosPhi = cos(phi)
  sinTheta = sin(theta)
  cosTheta = cos(theta)
  
  RETURN {
    x: radius * sinPhi * sinTheta,
    y: radius * cosPhi,
    z: radius * sinPhi * cosTheta
  }

/**
 * 笛卡尔坐标到球坐标转换
 */
FUNCTION cartesianToSpherical(position: Vector3): { radius, phi, theta }
  radius = length(position)
  
  IF radius == 0:
    RETURN { radius: 0, phi: 0, theta: 0 }
  
  phi = acos(clamp(position.y / radius, -1, 1))
  theta = atan2(position.x, position.z)
  
  RETURN { radius, phi, theta }
```

### 3.2 OrbitController 类

```pseudocode
CLASS OrbitController IMPLEMENTS IOrbitController:
  // 配置
  PRIVATE config: OrbitControllerConfig
  
  // 状态
  PRIVATE spherical: { radius, phi, theta }
  PRIVATE sphericalDelta: { radius, phi, theta }
  PRIVATE panOffset: Vector3
  PRIVATE scale: number = 1
  
  // 输入状态
  PRIVATE rotateStart: Vector2
  PRIVATE rotateEnd: Vector2
  PRIVATE panStart: Vector2
  PRIVATE panEnd: Vector2
  PRIVATE dollyStart: Vector2
  PRIVATE dollyEnd: Vector2
  
  // 保存的状态
  PRIVATE savedTarget: Vector3
  PRIVATE savedPosition: Vector3
  
  CONSTRUCTOR(camera: EntityId, domElement: HTMLElement, config?: OrbitControllerConfig):
    this.camera = camera
    this.domElement = domElement
    this.config = { ...DEFAULT_ORBIT_CONFIG, ...config }
    
    // 初始化球坐标
    cameraPosition = getCameraPosition(camera)
    offset = subtract(cameraPosition, config.target)
    this.spherical = cartesianToSpherical(offset)
    
    // 绑定事件
    this.bindEvents()
  
  FUNCTION update(deltaTime: number):
    IF NOT enabled:
      RETURN
    
    // 自动旋转
    IF config.autoRotate:
      rotateLeft(getAutoRotationAngle(deltaTime))
    
    // 应用阻尼
    IF config.enableDamping:
      spherical.theta += sphericalDelta.theta * config.dampingFactor
      spherical.phi += sphericalDelta.phi * config.dampingFactor
      
      sphericalDelta.theta *= (1 - config.dampingFactor)
      sphericalDelta.phi *= (1 - config.dampingFactor)
    ELSE:
      spherical.theta += sphericalDelta.theta
      spherical.phi += sphericalDelta.phi
      
      sphericalDelta.theta = 0
      sphericalDelta.phi = 0
    
    // 应用缩放
    spherical.radius *= scale
    scale = 1
    
    // 限制角度
    spherical.phi = clamp(spherical.phi, config.minPolarAngle, config.maxPolarAngle)
    spherical.theta = clamp(spherical.theta, config.minAzimuthAngle, config.maxAzimuthAngle)
    
    // 限制距离
    spherical.radius = clamp(spherical.radius, config.minDistance, config.maxDistance)
    
    // 应用平移
    target = add(target, panOffset)
    panOffset = { x: 0, y: 0, z: 0 }
    
    // 计算新的相机位置
    offset = sphericalToCartesian(spherical.radius, spherical.phi, spherical.theta)
    newPosition = add(target, offset)
    
    // 更新相机 Transform
    updateCameraTransform(camera, newPosition, target)
  
  // ==================== 输入处理 ====================
  
  PRIVATE FUNCTION onMouseDown(event: MouseEvent):
    IF NOT enabled:
      RETURN
    
    event.preventDefault()
    
    SWITCH event.button:
      CASE 0:  // 左键 - 旋转
        IF config.enableRotate:
          rotateStart = { x: event.clientX, y: event.clientY }
          state = STATE.ROTATE
      CASE 1:  // 中键 - 缩放
        IF config.enableZoom:
          dollyStart = { x: event.clientX, y: event.clientY }
          state = STATE.DOLLY
      CASE 2:  // 右键 - 平移
        IF config.enablePan:
          panStart = { x: event.clientX, y: event.clientY }
          state = STATE.PAN
    
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  
  PRIVATE FUNCTION onMouseMove(event: MouseEvent):
    IF NOT enabled:
      RETURN
    
    SWITCH state:
      CASE STATE.ROTATE:
        rotateEnd = { x: event.clientX, y: event.clientY }
        rotateDelta = subtract(rotateEnd, rotateStart)
        
        // 水平旋转
        rotateLeft(2 * PI * rotateDelta.x / domElement.clientWidth * config.rotateSpeed)
        // 垂直旋转
        rotateUp(2 * PI * rotateDelta.y / domElement.clientHeight * config.rotateSpeed)
        
        rotateStart = rotateEnd
      
      CASE STATE.DOLLY:
        dollyEnd = { x: event.clientX, y: event.clientY }
        dollyDelta = subtract(dollyEnd, dollyStart)
        
        IF dollyDelta.y > 0:
          dollyIn(getZoomScale())
        ELSE IF dollyDelta.y < 0:
          dollyOut(getZoomScale())
        
        dollyStart = dollyEnd
      
      CASE STATE.PAN:
        panEnd = { x: event.clientX, y: event.clientY }
        panDelta = subtract(panEnd, panStart)
        
        pan(panDelta.x, panDelta.y)
        
        panStart = panEnd
  
  PRIVATE FUNCTION onMouseWheel(event: WheelEvent):
    IF NOT enabled OR NOT config.enableZoom:
      RETURN
    
    event.preventDefault()
    
    IF event.deltaY < 0:
      dollyIn(getZoomScale())
    ELSE IF event.deltaY > 0:
      dollyOut(getZoomScale())
  
  // ==================== 触摸处理 ====================
  
  PRIVATE FUNCTION onTouchStart(event: TouchEvent):
    IF NOT enabled:
      RETURN
    
    SWITCH event.touches.length:
      CASE 1:  // 单指 - 旋转
        IF config.enableRotate:
          rotateStart = { x: event.touches[0].clientX, y: event.touches[0].clientY }
          state = STATE.TOUCH_ROTATE
      CASE 2:  // 双指 - 缩放/平移
        IF config.enableZoom OR config.enablePan:
          dx = event.touches[0].clientX - event.touches[1].clientX
          dy = event.touches[0].clientY - event.touches[1].clientY
          dollyStart = { x: 0, y: sqrt(dx * dx + dy * dy) }
          
          cx = (event.touches[0].clientX + event.touches[1].clientX) / 2
          cy = (event.touches[0].clientY + event.touches[1].clientY) / 2
          panStart = { x: cx, y: cy }
          
          state = STATE.TOUCH_DOLLY_PAN
  
  // ==================== 辅助方法 ====================
  
  PRIVATE FUNCTION rotateLeft(angle: number):
    sphericalDelta.theta -= angle
  
  PRIVATE FUNCTION rotateUp(angle: number):
    sphericalDelta.phi -= angle
  
  PRIVATE FUNCTION dollyIn(dollyScale: number):
    scale /= dollyScale
  
  PRIVATE FUNCTION dollyOut(dollyScale: number):
    scale *= dollyScale
  
  PRIVATE FUNCTION pan(deltaX: number, deltaY: number):
    // 计算平移向量
    offset = subtract(getCameraPosition(camera), target)
    targetDistance = length(offset)
    
    // 根据 FOV 计算平移量
    fov = getCameraFOV(camera)
    panLeft = 2 * deltaX * targetDistance * tan(fov / 2) / domElement.clientHeight
    panUp = 2 * deltaY * targetDistance * tan(fov / 2) / domElement.clientHeight
    
    // 获取相机坐标系
    cameraRight = getCameraRight(camera)
    cameraUp = getCameraUp(camera)
    
    // 应用平移
    panOffset = add(panOffset, scale(cameraRight, -panLeft * config.panSpeed))
    panOffset = add(panOffset, scale(cameraUp, panUp * config.panSpeed))
  
  PRIVATE FUNCTION getZoomScale(): number
    RETURN pow(0.95, config.zoomSpeed)
  
  PRIVATE FUNCTION getAutoRotationAngle(deltaTime: number): number
    RETURN 2 * PI / 60 * config.autoRotateSpeed * deltaTime
```

---

## 4. FPSController 实现

### 4.1 FPSController 类

```pseudocode
CLASS FPSController IMPLEMENTS IFPSController:
  // 配置
  PRIVATE config: FPSControllerConfig
  
  // 状态
  PRIVATE yaw: number = 0      // 偏航角
  PRIVATE pitch: number = 0    // 俯仰角
  velocity: Vector3 = { x: 0, y: 0, z: 0 }
  isGrounded: boolean = true
  
  // 输入状态
  PRIVATE moveForward: boolean = false
  PRIVATE moveBackward: boolean = false
  PRIVATE moveLeft: boolean = false
  PRIVATE moveRight: boolean = false
  PRIVATE isSprinting: boolean = false
  PRIVATE isPointerLocked: boolean = false
  
  CONSTRUCTOR(camera: EntityId, domElement: HTMLElement, config?: FPSControllerConfig):
    this.camera = camera
    this.domElement = domElement
    this.config = { ...DEFAULT_FPS_CONFIG, ...config }
    
    // 从相机初始化角度
    rotation = getCameraRotation(camera)
    { yaw, pitch } = quaternionToEuler(rotation)
    
    this.bindEvents()
  
  FUNCTION update(deltaTime: number):
    IF NOT enabled:
      RETURN
    
    // 计算移动方向
    direction = { x: 0, y: 0, z: 0 }
    
    IF moveForward:
      direction.z -= 1
    IF moveBackward:
      direction.z += 1
    IF moveLeft:
      direction.x -= 1
    IF moveRight:
      direction.x += 1
    
    // 归一化方向
    IF length(direction) > 0:
      direction = normalize(direction)
    
    // 计算速度
    speed = config.moveSpeed
    IF isSprinting:
      speed *= config.sprintMultiplier
    
    // 应用重力
    IF config.enableGravity:
      IF NOT isGrounded:
        velocity.y -= config.gravity * deltaTime
      ELSE:
        velocity.y = 0
    
    // 计算水平速度
    forward = getForwardVector()
    right = getRightVector()
    
    velocity.x = (forward.x * direction.z + right.x * direction.x) * speed
    velocity.z = (forward.z * direction.z + right.z * direction.x) * speed
    
    // 更新位置
    position = getCameraPosition(camera)
    position.x += velocity.x * deltaTime
    position.y += velocity.y * deltaTime
    position.z += velocity.z * deltaTime
    
    // 地面检测
    IF config.enableGravity:
      IF position.y < 0:  // 简化的地面检测
        position.y = 0
        isGrounded = true
        velocity.y = 0
    
    // 更新相机
    rotation = eulerToQuaternion(yaw, pitch, 0)
    updateCameraTransform(camera, position, rotation)
  
  FUNCTION jump():
    IF isGrounded AND config.enableGravity:
      velocity.y = sqrt(2 * config.gravity * config.jumpHeight)
      isGrounded = false
  
  // ==================== 输入处理 ====================
  
  PRIVATE FUNCTION onMouseMove(event: MouseEvent):
    IF NOT enabled OR NOT isPointerLocked:
      RETURN
    
    movementX = event.movementX || 0
    movementY = event.movementY || 0
    
    yaw -= movementX * config.lookSpeed
    pitch -= movementY * config.lookSpeed
    
    // 限制俯仰角
    pitch = clamp(pitch, config.minPitch, config.maxPitch)
  
  PRIVATE FUNCTION onKeyDown(event: KeyboardEvent):
    SWITCH event.code:
      CASE 'KeyW': moveForward = true
      CASE 'KeyS': moveBackward = true
      CASE 'KeyA': moveLeft = true
      CASE 'KeyD': moveRight = true
      CASE 'ShiftLeft': isSprinting = true
      CASE 'Space':
        IF isGrounded:
          jump()
  
  PRIVATE FUNCTION onKeyUp(event: KeyboardEvent):
    SWITCH event.code:
      CASE 'KeyW': moveForward = false
      CASE 'KeyS': moveBackward = false
      CASE 'KeyA': moveLeft = false
      CASE 'KeyD': moveRight = false
      CASE 'ShiftLeft': isSprinting = false
  
  FUNCTION lockPointer():
    IF config.enablePointerLock:
      domElement.requestPointerLock()
  
  FUNCTION unlockPointer():
    document.exitPointerLock()
  
  // ==================== 辅助方法 ====================
  
  PRIVATE FUNCTION getForwardVector(): Vector3
    // 只考虑水平方向
    RETURN {
      x: sin(yaw),
      y: 0,
      z: cos(yaw)
    }
  
  PRIVATE FUNCTION getRightVector(): Vector3
    RETURN {
      x: cos(yaw),
      y: 0,
      z: -sin(yaw)
    }
```

---

## 5. 输入管理器

### 5.1 统一输入接口

```typescript
/**
 * 输入事件类型
 */
enum InputEventType {
  POINTER_DOWN = 'pointerdown',
  POINTER_MOVE = 'pointermove',
  POINTER_UP = 'pointerup',
  WHEEL = 'wheel',
  KEY_DOWN = 'keydown',
  KEY_UP = 'keyup'
}

/**
 * 统一输入事件
 */
interface InputEvent {
  type: InputEventType;
  // 指针信息
  pointerId?: number;
  pointerType?: 'mouse' | 'touch' | 'pen';
  clientX?: number;
  clientY?: number;
  movementX?: number;
  movementY?: number;
  button?: number;
  // 滚轮信息
  deltaX?: number;
  deltaY?: number;
  // 键盘信息
  key?: string;
  code?: string;
  // 修饰键
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

/**
 * 输入管理器
 */
class InputManager {
  private domElement: HTMLElement;
  private listeners: Map<InputEventType, Set<Function>>;
  
  constructor(domElement: HTMLElement) {
    this.domElement = domElement;
    this.listeners = new Map();
    this.bindEvents();
  }
  
  on(type: InputEventType, callback: (event: InputEvent) => void): void;
  off(type: InputEventType, callback: Function): void;
  dispose(): void;
}
```

---

## 6. 实现步骤

### 6.1 Step 1: 创建输入管理器

**文件**: `packages/engine/src/controls/input-manager.ts`

### 6.2 Step 2: 创建控制器基类

**文件**: `packages/engine/src/controls/camera-controller.ts`

### 6.3 Step 3: 实现 OrbitController

**文件**: `packages/engine/src/controls/orbit-controller.ts`

### 6.4 Step 4: 实现 FPSController

**文件**: `packages/engine/src/controls/fps-controller.ts`

### 6.5 Step 5: 集成到 Engine

**文件**: `packages/engine/src/engine/engine.ts`

---

## 7. 验证标准

- [ ] OrbitController 旋转正确
- [ ] OrbitController 缩放正确
- [ ] OrbitController 平移正确
- [ ] 阻尼效果平滑
- [ ] 触摸输入正常工作
- [ ] FPSController 移动正确
- [ ] FPSController 视角控制正确
- [ ] 指针锁定正常工作

---

## 8. 禁止事项

- 🚫 **直接修改 Transform** - 必须通过 ECS 系统
- 🚫 **忽略边界限制** - 必须应用角度和距离限制
- 🚫 **阻塞主线程** - 输入处理必须高效
- 🚫 **内存泄漏** - dispose 时必须移除所有事件监听

---

## 9. 相关文档

- [Engine 架构规格](../architecture/engine-architecture-spec.md)