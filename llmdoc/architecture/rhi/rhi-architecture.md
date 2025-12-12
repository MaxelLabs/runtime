# RHI 抽象层架构

## 1. Identity

**RHI 抽象层** 是 Maxell 3D Runtime 的核心图形接口层，为上层应用提供统一的硬件渲染抽象接口。

**Purpose**: 实现图形 API 的统一封装，支持多版本 WebGL，并为未来图形 API 扩展提供基础。

## 2. 核心组件

- `temp/engine/packages/design/src/renderingHardwareInterface/IHardwareRenderer.ts` (`IHardwareRenderer`): 硬件图形渲染器基础接口
- `temp/engine/packages/design/src/renderingHardwareInterface/IPlatformPrimitive.ts` (`IPlatformPrimitive`): 平台图元基础接口
- `temp/engine/packages/core/src/renderingHardwareInterface/index.ts` (`IPlatformBuffer`, `IPlatformRenderTarget`, `IPlatformTexture`, `IPlatformTexture2D`, `IPlatformTexture2DArray`, `IPlatformTextureCube`): 核心平台资源接口集合
- `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts` (`WebGLGraphicDevice`): WebGL 图形设备实现
- `temp/engine/packages/rhi-webgl/src/WebGLEngine.ts` (`WebGLEngine`): WebGL 引擎封装
- `temp/engine/packages/rhi-webgl/src/GLPrimitive.ts` (`GLPrimitive`): WebGL 图元实现
- `specification/src/common/rhi/resources/querySet.ts` (`IRHIQuerySet`, `RHIQuerySetDescriptor`): 查询集接口和描述符
- `rhi/src/webgl/resources/GLQuerySet.ts` (`GLQuerySet`): WebGL 查询集实现

## 3. 执行流程 (LLM 检索地图)

### 3.1 初始化流程
- **1. 引擎创建**: WebGLEngine.create() 调用 `temp/engine/packages/rhi-webgl/src/WebGLEngine.ts:14-25`
- **2. 设备初始化**: WebGLGraphicDevice.init() 调用 `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:168-211`
- **3. 上下文获取**: 自动检测 WebGL 2.0/1.0 支持并创建对应上下文
- **4. 状态初始化**: 调用 `_initGLState()` 初始化渲染状态、扩展和特性

### 3.2 渲染流程
- **1. 图元创建**: `createPlatformPrimitive()` 调用 `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:213-215`
- **2. 纹理创建**: `createPlatformTexture2D()` 调用 `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:217-219`
- **3. 缓冲区创建**: `createPlatformBuffer()` 调用 `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:233-240`
- **4. 渲染执行**: `drawPrimitive()` 调用 `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:328-335`

### 3.3 资源管理流程
- **1. 渲染目标**: `createPlatformRenderTarget()` 调用 `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:229-231`
- **2. 纹理数组**: `createPlatformTexture2DArray()` 调用 `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:221-223`
- **3. 立方体贴图**: `createPlatformTextureCube()` 调用 `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:225-227`

### 3.4 查询集流程
- **1. 创建查询集**: `device.createQuerySet(descriptor)` 创建查询对象
- **2. 开始查询**: `renderPass.beginOcclusionQuery(querySet, queryIndex)` 开始遮挡查询
- **3. 渲染阶段**: 执行需要被查询的渲染操作
- **4. 结束查询**: `renderPass.endOcclusionQuery()` 结束当前查询
- **5. 获取结果**: 通过 `getResult()` 同步获取或 `getResultAsync()` 异步获取查询结果
- **6. 资源清理**: 调用 `destroy()` 销毁查询集

## 4. 设计原理

### 4.1 接口隔离
采用严格的接口分离原则，通过 `@maxellabs/design` 包定义基础接口，`@maxellabs/core` 包定义核心接口，`@maxellabs/rhi-webgl` 包实现具体 WebGL 逻辑。这种分层设计确保了接口的稳定性和实现的灵活性。

### 4.2 向后兼容
支持 WebGL 1.0 和 WebGL 2.0 的自动检测和降级，通过 `WebGLMode` 枚举 (`temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:43-50`) 提供灵活的版本控制策略。

### 4.3 扩展管理
内置扩展管理系统 (`GLExtensions`)，自动检测和管理 WebGL 扩展，为高级特性提供透明的支持。