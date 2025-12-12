# MVP 矩阵实现架构

## 1. Identity

- **What it is**: RHI Demo 系统中的 Model-View-Projection (MVP) 矩阵变换实现架构。
- **Purpose**: 为所有 Demo 提供统一的 3D 变换管线，支持 OrbitController 的完整交互功能。

## 2. 核心组件

### MVP 矩阵变换管线

- `packages/rhi/demo/src/triangle.ts` (modelMatrix, viewMatrix, projMatrix): 实现 MVP 矩阵变换的基础三角形渲染。
- `packages/rhi/demo/src/utils/camera/OrbitController.ts` (update, getViewMatrix, getProjectionMatrix): 提供视图和投影矩阵的动态更新。
- `packages/rhi/demo/src/utils/core/DemoRunner.ts` (beginFrame, endFrame): 管理渲染循环和帧缓冲区。

### 着色器 Uniform 块

- `packages/rhi/demo/src/**/*.ts` (vertexShaderSource): 所有 Demo 的顶点着色器都包含 Transforms uniform 块定义。

### Uniform 缓冲区管理

- `packages/rhi/demo/src/**/*.ts` (transformBuffer): 动态 Uniform 缓冲区，存储 MVP 矩阵数据。
- `packages/rhi/demo/src/**/*.ts` (bindGroup): 将 Uniform 缓冲区绑定到渲染管线。

## 3. 执行流程 (LLM Retrieval Map)

### 初始化阶段

1. **着色器创建**: 所有 Demo 在 `packages/rhi/demo/src/*.ts:15-35` 定义顶点着色器，包含 Transforms uniform 块。
2. **Uniform 缓冲区**: 在 `packages/rhi/demo/src/*.ts:105-113` 创建 256 字节的动态 Uniform 缓冲区。
3. **绑定组布局**: 在 `packages/rhi/demo/src/*.ts:116-128` 创建绑定组布局，指定 uniform 缓冲区绑定点。
4. **绑定组创建**: 在 `packages/rhi/demo/src/*.ts:131-135` 创建绑定组，关联缓冲区和着色器 uniform。

### 渲染循环阶段

1. **矩阵更新**: 在 `packages/rhi/demo/src/*.ts:182-187` 渲染循环中更新 MVP 矩阵：
   - ModelMatrix: 固定单位矩阵（可扩展为模型变换）
   - ViewMatrix: 从 OrbitController 获取 (`orbit.getViewMatrix()`)
   - ProjectionMatrix: 从 OrbitController 获取 (`orbit.getProjectionMatrix(aspect)`)
2. **数据上传**: 将矩阵数据写入 Float32Array 并更新到 Uniform 缓冲区。
3. **渲染执行**: 设置绑定组和管线，执行绘制命令。

## 4. 设计决策

### Uniform 块布局

使用 std140 布局规范，每个 mat4 占用 64 字节对齐：
```glsl
uniform Transforms {
  mat4 uModelMatrix;   // 偏移: 0
  mat4 uViewMatrix;    // 偏移: 64
  mat4 uProjectionMatrix; // 偏移: 128
}; // 总计: 192 字节
```

### 矩阵更新策略

- **动态更新**: Uniform 缓冲区标记为 'dynamic'，每帧更新整个变换矩阵
- **视图矩阵**: 由 OrbitController 根据相机控制实时计算
- **投影矩阵**: 基于 canvas 尺寸和 fov 计算，支持宽高比自适应
- **模型矩阵**: 当前为单位矩阵，为后续模型动画预留扩展点

### 相机集成

所有 Demo 必须集成 OrbitController 并遵循固定模式：
1. 初始化时配置相机参数（距离、目标、阻尼等）
2. 渲染循环开始时调用 `update(dt)` 更新状态
3. 使用 `getViewMatrix()` 和 `getProjectionMatrix()` 获取变换矩阵
4. 退出时调用 `destroy()` 清理资源

## 5. 扩展点

### 模型变换

当前实现预留了模型矩阵扩展点，可以轻松添加：
- 模型缩放、旋转、平移变换
- 模型动画系统
- 骨骼蒙皮变换

### 多相机支持

架构支持扩展为多相机系统：
- 每个相机有自己的 View 和 Projection 矩阵
- 支持视锥体裁剪和视口分割
- 实现分屏或画中画效果