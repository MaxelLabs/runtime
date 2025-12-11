# RHI (Rendering Hardware Interface) 概览

## 1. Identity

- **What it is:** 一个跨平台的渲染硬件接口框架，提供统一的 API 抽象层。
- **Purpose:** 屏蔽不同渲染后端的差异，让上层应用通过统一的接口与 GPU 交互，支持 WebGL、WebGPU 等后端。

## 2. High-Level Description

RHI 是 MaxelLabs 图形框架的核心抽象层。它定义了一套完整的接口规范：

- **资源管理**：缓冲区、纹理、采样器、查询集等资源的创建和生命周期管理
- **管线管理**：渲染管线、计算管线的配置和执行
- **命令记录**：渲染通道、计算通道等命令缓冲区的抽象
- **同步与查询**：GPU 查询（遮挡查询、时间戳查询）、围栏、事件等机制

### 核心组件
- **specification/** - 接口定义层（包含所有 RHI 接口规范）
- **rhi/src/webgl/** - WebGL 2.0 实现（当前主要实现）
  - `resources/` - GPU 资源实现
  - `pipeline/` - 管线实现
  - `commands/` - 命令缓冲区实现
  - `utils/` - 工具类（std140 布局计算、资源绑定等）

### 最近改进（2025-12-10）

1. **动态缓冲区管理** - 实现缓冲区动态更新演示，展示实时波浪动画效果
2. **缓冲区 hint 优化** - 支持 'dynamic', 'static', 'stream' 等使用模式
3. **部分数据更新** - buffer.update() 方法支持高效的部分数据刷新
4. **顶点格式优化** - 新增顶点格式对比演示，最高节省 71% 内存

### 之前改进（2024-12-10）

1. **WebGL 查询集完整实现** - GLQuerySet 类，支持遮挡查询和时间戳查询
2. **异步结果读取** - 通过 Promise 机制避免 GPU 阻塞
3. **资源追踪集成** - 自动管理查询集生命周期
4. **演示系统重构** - 新增 rotating-cube 演示和完整工具库

### 之前改进（2024-12-09）

1. **遮挡查询实现** - Query Set API，用于 GPU 遮挡剔除
2. **Push Constants** - 通过 UBO 实现 WebGPU 风格的常量推送机制

更多信息见 `/llmdoc/architecture/` 目录。
