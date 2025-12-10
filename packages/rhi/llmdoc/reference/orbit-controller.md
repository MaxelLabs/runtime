# OrbitController API 参考指南

## 1. Identity

**OrbitController** 是一个交互式 3D 相机控制系统，支持鼠标拖拽旋转、滚轮缩放和平移操作。

**Purpose**: 为演示和调试提供直观的相机控制，支持 3D 场景的全方位观察。

## 2. API 参考

### OrbitController 类

```typescript
class OrbitController {
    constructor(camera: Camera, canvas: HTMLCanvasElement, options?: OrbitControllerOptions)
    update(): void
    getMatrix(): mat4
    setPosition(x: number, y: number, z: number): void
    setTarget(x: number, y: number, z: number): void
    getDistance(): number
    setDistance(distance: number): void
}
```

### OrbitControllerOptions 接口

```typescript
interface OrbitControllerOptions {
    enableDamping?: boolean        // 启用阻尼效果
    dampingFactor?: number         // 阻尼系数
    enableZoom?: boolean           // 启用缩放
    zoomSpeed?: number             // 缩放速度
    enableRotate?: boolean        // 启用旋转
    rotateSpeed?: number           // 旋转速度
    enablePan?: boolean           // 启用平移
    panSpeed?: number             // 平移速度
    minDistance?: number           // 最小缩放距离
    maxDistance?: number           // 最大缩放距离
}
```

## 3. 使用示例

### 基本使用

```typescript
import { OrbitController } from './OrbitController';

// 创建控制器
const controller = new OrbitController(camera, canvas);

// 在渲染循环中更新
function render() {
    controller.update();
    // 使用 controller.getMatrix() 获取视图矩阵
    requestAnimationFrame(render);
}
```

### 自定义配置

```typescript
const options: OrbitControllerOptions = {
    enableDamping: true,
    dampingFactor: 0.05,
    zoomSpeed: 0.5,
    rotateSpeed: 0.5,
    minDistance: 5,
    maxDistance: 100
};

const controller = new OrbitController(camera, canvas, options);
```

## 4. 交互功能

| 交互操作 | 默认行为 |
|----------|----------|
| 鼠标左键拖拽 | 围绕目标点旋转 |
| 鼠标右键拖拽 | 平移相机 |
| 鼠标滚轮 | 缩放（调整距离） |
| 双击 | 重置到默认位置 |

## 5. 集成说明

### 与 MVP 矩阵集成

OrbitController 是 MVP 矩阵演示系统的核心组件：

- `camera.ts:45-80` - 相机控制器初始化
- `demo.ts:120-150` - 控制器与渲染循环集成
- `main.ts:30-50` - 在主应用中配置控制器

### 性能注意事项

- 启用阻尼（`enableDamping`）会使用 `lerp` 函数实现平滑过渡
- 控制器每帧都会计算新的视图矩阵
- 可以通过设置 `dampingFactor` 调整平滑程度

## 6. 源码位置

- **主要实现**: `packages/rhi/demo/src/controls/OrbitController.ts`
- **使用示例**: `packages/rhi/demo/src/examples/MVPMatrixDemo.ts`
- **主控制器**: `packages/rhi/demo/src/MainController.ts`