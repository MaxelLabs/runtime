# 3D 引擎整体架构

## 1. Identity

**3D 引擎架构** 是 Maxell 3D Runtime 的核心架构设计，采用分层和模块化的设计原则，实现高性能的3D渲染系统。

**Purpose**: 提供清晰的系统架构指南，帮助开发者理解引擎的各个组成部分及其相互关系。

## 2. 核心组件

- `packages/core/src/code.zip` (`Engine`): 引擎核心类，负责整个引擎的生命周期管理和渲染循环
- `packages/core/src/code.zip` (`Scene`): 场景类，管理场景中的所有实体和组件
- `packages/core/src/code.zip` (`Entity`): 实体类，场景中的基本对象容器
- `packages/core/src/code.zip` (`Component`): 组件基类，实现实体组件系统的功能
- `packages/core/src/code.zip` (`Transform`): 变换组件，管理实体的位置、旋转和缩放
- `packages/core/src/code.zip` (`Camera`): 相机组件，负责视角控制和投影
- `packages/core/src/code.zip` (`Renderer`): 渲染器基类，实现基本的渲染功能
- `packages/core/src/code.zip` (`SceneManager`): 场景管理器，负责场景的创建、切换和管理
- `packages/core/src/code.zip` (`ResourceManager`): 资源管理器，处理资源的加载、缓存和释放
- `packages/core/src/code.zip` (`RenderPipeline`): 渲染管线，负责渲染流程的控制

## 3. 执行流程 (LLM 检索地图)

### 3.1 引擎初始化流程
- **1. 引擎创建**: Engine 构造函数调用 `packages/core/src/code.zip:Engine`
- **2. 设置Canvas**: 初始化画布和图形设备，配置渲染上下文
- **3. 初始化子系统**: 创建输入管理器、XR管理器、场景管理器等
- **4. 加载基础资源**: 初始化着色器池、材质、纹理等基础资源

### 3.2 渲染循环流程
- **1. 渲染请求**: `_animate()` 函数触发 `packages/core/src/code.zip:Engine`
- **2. 更新阶段**: `update()` 方法调用场景管理器的更新
- **3. 渲染阶段**: 渲染管线执行，包括相机排序、视锥裁剪、渲染队列管理
- **4. 执行渲染**: `RenderContext` 管理渲染状态，调用RHI层进行实际渲染

### 3.3 场景管理流程
- **1. 场景创建**: SceneManager.createScene() 调用 `packages/core/src/code.zip:Scene`
- **2. 实体创建**: Entity 构造函数创建场景对象 `packages/core/src/code.zip:Entity`
- **3. 组件添加**: Entity.addComponent() 管理组件生命周期
- **4. 场景激活**: SceneManager.switchActiveScene() 切换当前场景

### 3.4 资源管理流程
- **1. 资源加载**: ResourceManager.load() 处理异步加载
- **2. 资源缓存**: 内置缓存机制，避免重复加载
- **3. 引用计数**: 自动管理资源引用计数
- **4. 资源释放**: ResourceManager.destroy() 释放无用资源

## 4. 设计原理

### 4.1 实体组件系统(ECS)
引擎采用ECS架构，通过Entity、Component、System三层分离实现高度解耦。Entity作为容器，Component实现具体功能，System负责处理逻辑。这种架构提供了更好的性能和可扩展性。

### 4.2 分层渲染管线
渲染管线采用分层设计，包括场景图构建、视锥裁剪、渲染队列排序、批量渲染等阶段。每个阶段都可以被扩展和定制，支持不同的渲染需求。

### 4.3 事件驱动架构
引擎采用事件驱动的架构设计，通过EventDispatcher实现松耦合的组件交互。这种设计使得组件之间可以灵活通信，提高系统的可维护性。