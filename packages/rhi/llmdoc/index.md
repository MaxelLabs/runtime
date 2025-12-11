# RHI (Rendering Hardware Interface) 文档索引

RHI 是一个跨平台的图形渲染硬件接口框架，提供统一的 API 抽象层以支持多种渲染后端（WebGL、WebGPU 等）。

## 文档结构

### Overview（项目概览）

- `rhi-overview.md` - RHI 包的整体架构和目的

### Architecture（系统架构）

- `rhi-interfaces.md` - 核心接口定义和规范
- `webgl-implementation.md` - WebGL 实现的架构和细节

### Reference（参考文档）

- `query-set-api.md` - 查询集 (Query Set) API 参考
- `push-constants.md` - Push Constants 实现参考
- `resource-tracker-api.md` - 资源追踪器 API 参考（新增）
- `device-lifecycle.md` - WebGL 上下文生命周期管理（新增）
- `multiple-buffers-demo.md` - 多顶点缓冲区 Demo 实现参考（新增）
- `dynamic-buffer-demo.md` - 动态缓冲区 Demo 实现参考（新增）
- `texture-2d-demo.md` - 基础 2D 纹理 Demo 实现参考（新增）

### Guides（操作指南）

- `handle-context-loss.md` - 如何处理 WebGL 上下文丢失和资源恢复
- `demo-development.md` - RHI Demo 开发指南和工具库文档

---

## 最近更新

### 2025-12-11 开始第二层纹理系统 Demo

**纹理系统 Demo 开发**
- texture-2d: 基础 2D 纹理加载和采样演示（新增）
- 展示 TextureLoader 加载外部图片、ProceduralTexture 程序化纹理
- 技术要点：UV 映射、采样器配置、多纹理对比显示

### 2025-12-10 新增动态缓冲区 Demo

**动态缓冲区管理实现**
- dynamic-buffer: 缓冲区动态更新演示，展示波浪动画效果和 hint: 'dynamic' 使用
- 使用 buffer.update() 方法进行部分数据更新，每帧更新顶点位置
- 实现了正弦波动画效果，展示动态几何体的实时更新能力

### 2025-12-10 新增工具库功能（第四批）

**Demo 工具库扩展**
- TextureLoader: 纹理加载器（URL 加载、Mipmap 生成、批量加载、压缩格式检测）
- CubemapGenerator: 立方体贴图生成器（纯色、天空渐变、调试着色、从 URL 加载、全景图转换）
- RenderTarget: 渲染目标管理器（离屏渲染、MRT、自动资源管理、动态调整大小）
- ShaderUtils: 着色器工具类（Uniform 块生成、std140 布局计算、着色器模板、代码片段库）
- GeometryGenerator 扩展：新增 Torus、Cone、Cylinder、Capsule

### 2024-12-10 新增功能（第三批）

**WebGL 查询集功能实现**
- 新增 `GLQuerySet` 类，完整的 WebGL 2.0 Query Set 实现
- 支持遮挡查询（OCCLUSION_QUERY）和时间戳查询（TIMESTAMP_QUERY）
- 异步结果读取机制，避免 GPU 阻塞
- 集成资源追踪系统，自动管理生命周期
- `RHIQueryType` 枚举新增 `OCCLUSION`, `TIMESTAMP`, `PIPELINE_STATISTICS`
- `GLDevice` 新增 `createQuerySet()` 方法

**RHI 演示系统重构**
- 删除旧演示文件：basic.html, deferred.html, lighting.html, postprocess.html, shadow.html, texture.html
- 新增 rotating-cube.html 演示，展示3D变换、纹理、光照、GUI和相机控制
- 添加完整的工具库：core/, geometry/, texture/, camera/, ui/
- triangle.ts 重构以支持新工具库

### 2024-12-09 新增功能（第二批）

1. **上下文丢失/恢复处理**
   - 新增 `DeviceState` 枚举（ACTIVE, LOST, DESTROYED）
   - 新增 `DeviceEventCallbacks` 接口（onContextLost, onContextRestored, onDestroyed）
   - 自动监听 `webglcontextlost`/`webglcontextrestored` 事件
   - `GLDevice` 新增公共方法：`setEventCallbacks()`, `getDeviceState()`, `isActive()`

2. **资源追踪系统 (ResourceTracker)**
   - 新增 `ResourceTracker` 类，自动追踪所有已创建资源
   - 新增 `ResourceType` 枚举分类资源（缓冲区、纹理、着色器、管线等）
   - 新增 `ResourceStats` 接口用于统计资源
   - 所有 `Device.create*()` 方法自动注册资源
   - 支持按依赖顺序批量销毁（`destroyAll()`）
   - 内置泄漏检测（`reportLeaks()`, `getStats()`）
   - `GLDevice` 新增方法：`getResourceTracker()`, `unregisterResource()`

3. **QuerySet 和 Push Constants 实现**（之前已完成）
   - `IRHIQuerySet` 接口和 WebGL 实现 `GLQuerySet`
   - `Std140Calculator` 工具类和 Push Constants UBO 映射

参见 `/llmdoc/architecture/webgl-implementation.md` 获取详细的执行流和设计原理。
