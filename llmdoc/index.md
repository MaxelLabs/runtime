# Maxell 3D Runtime 文档索引

## 1. Identity

**Maxell 3D Runtime** 是一个基于 TypeScript 的现代化高性能模块化 WebGL 运行时系统，专为现代 3D Web 应用设计，采用 monorepo 架构和硬件抽象层(RHI)设计理念。

**Purpose**: 为 Web 端提供完整的 3D 图形渲染解决方案，支持从基础 3D 建模到高级特效渲染的全流程能力。

## 2. 文档导航结构

### 📖 概述文档 (overview)
- **[project-overview](./overview/project-overview.md)** - 项目概览
  - 项目简介、核心功能、技术栈、应用场景、项目亮点
- **[rhi-overview](./overview/rhi-overview.md)** - RHI 抽象层概述
  - WebGL 硬件抽象层的设计理念和核心功能
- **[engine-overview](./overview/engine-overview.md)** - 3D 引擎核心系统概述
  - 引擎简介、高级描述和核心功能
- **[usd-overview](./overview/usd-overview.md)** - OpenUSD 规范系统概述
  - 基于 USD 格式的全流程数据描述系统介绍
- **[math-overview](./overview/math-overview.md)** - 数学库概述
  - 核心数学类型、性能优化、对象池机制

### 🛠️ 操作指南 (guides)
- [使用 RHI 抽象层](./guides/using-rhi.md) - RHI 基本使用方法
  - WebGL 引擎创建、图形设备使用、资源管理
- [WebGL 命令指南](./guides/webgl-commands.md) - WebGL 命令使用和性能优化
  - 渲染状态设置、图元绘制、渲染目标操作
- [数学库使用指南](./guides/using-math-library.md) - 如何使用数学库进行基础计算
  - 向量、矩阵、四元数操作、API 使用示例
- [引擎使用指南](./guides/engine-usage.md) - 3D 引擎基本使用流程
  - 引擎初始化、场景管理、组件系统、资源管理
- [使用 USD 规范](./guides/using-usd-specification.md) - USD 规范系统使用指南
  - 创建场景、配置属性、管理组合关系
- [USD 动画系统](./guides/usd-animation.md) - USD 动画系统使用指南
  - 创建动画剪辑、关键帧动画、粒子系统
- [性能调优指南](./guides/performance-tuning.md) - 数学库性能优化
  - 最佳实践、对象池使用、内存管理技巧

### 🏗️ 架构设计 (architecture)
- [RHI 抽象层架构](./architecture/rhi-architecture.md) - RHI 抽象层设计原理和核心组件
  - 硬件渲染器接口、平台资源、执行流程
- [WebGL 实现细节](./architecture/webgl-implementation.md) - WebGL 实现的关键技术细节
  - 图形设备、扩展管理、状态追踪
- [数学库核心架构](./architecture/math-core-architecture.md) - 向量、矩阵、四元数等核心数学类型的实现架构
  - 数据结构、对象池、内存对齐
- [数学库性能优化](./architecture/math-performance-optimization.md) - 对象池和内存管理优化策略
  - SIMD 优化、缓存友好设计、预分配策略
- [引擎整体架构](./architecture/engine-architecture.md) - 3D 引擎架构设计
  - 核心组件、执行流程、设计原理
- [引擎子系统设计](./architecture/engine-systems.md) - 各子系统详细设计
  - 渲染管线、组件管理、场景图、动画系统
- [USD 架构设计](./architecture/usd-architecture.md) - OpenUSD 架构设计
  - 核心组件、执行流程、设计原理
- [USD 数据模型](./architecture/usd-data-model.md) - USD 数据模型和类型系统
  - 场景图、属性系统、时间表达能力
- [Specification 类型系统架构](./architecture/specification-type-system.md) - 统一类型系统架构设计
  - 泛型基类、类型继承、循环依赖解决

### 📖 参考资料 (reference)
- [编码约定](./reference/coding-conventions.md) - TypeScript 代码风格和规范
  - 命名约定、导入导出、ESLint 配置、类型系统最佳实践
- [Git 工作流](./reference/git-conventions.md) - Git 提交规范和分支管理
  - 提交消息格式、分支策略、标签管理
- [数学类型参考](./reference/math-type-reference.md) - 完整的数学类型定义和接口说明
  - 向量、矩阵、四元数的详细 API 文档
- [RHI 接口参考](./reference/rhi-interfaces.md) - RHI 抽象层的接口定义和规范
  - 平台缓冲区、纹理、渲染目标等接口
- [USD 核心类型参考](./reference/usd-core-types.md) - USD 核心数据类型和接口规范
  - 节点、属性、层、阶段等核心类型
- [Specification 类型参考](./reference/specification-type-reference.md) - 统一类型系统完整定义
  - 关键帧、动画轨道、纹理引用、变换等核心类型
- [Query Set API](./reference/webgl-query-set.md) - WebGL 查询集功能完整参考
  - 遮挡查询、时间戳查询的 API 和实现细节
- [RHI 命令类型参考](./reference/rhi-command-types.md) - 命令参数类型定义和集成指南
  - 16 个命令参数接口、类型安全设计、WebGL 实现集成
- [Push Constants 实现](./packages/rhi/llmdoc/reference/push-constants.md) - Push Constants 参数传递机制
  - std140 布局规范和 WebGL 实现
- [Resource Tracker API](./packages/rhi/llmdoc/reference/resource-tracker-api.md) - 资源生命周期管理
  - 资源追踪、泄漏检测和自动销毁
- [RHI Demo 系统更新记录](./reference/rhi-demo-system-update-20251210.md) - Demo 系统重大更新文档
  - 性能监控、相机控制集成和 UI 布局规范
- [MVP 矩阵实现架构](./architecture/mvp-matrix-implementation.md) - MVP 矩阵变换实现架构
  - Uniform 缓冲区、着色器集成和相机控制
- [MVP 矩阵更新指南](./reference/mvp-matrix-update-guide.md) - 从固定管线到 MVP 矩阵的迁移
  - 技术细节、实现步骤和最佳实践
- [多顶点缓冲区 Demo 参考](./packages/rhi/llmdoc/reference/multiple-buffers-demo.md) - 多顶点缓冲区架构实现
  - 位置/颜色/法线分离、缓冲区槽位绑定、顶点布局配置
- [多顶点缓冲区黑屏修复指南](./reference/multiple-buffers-black-screen-fix.md) - 多缓冲区渲染问题修复
  - 问题诊断、解决方案、调试技巧和最佳实践
- [动态缓冲区 Demo 参考](./packages/rhi/llmdoc/reference/dynamic-buffer-demo.md) - 动态缓冲区架构实现
  - 实时波浪动画、缓冲区动态更新、hint: 'dynamic' 使用
- [顶点格式 Demo 参考](./packages/rhi/llmdoc/reference/vertex-formats-demo.md) - 顶点格式优化实现
  - 四种格式对比、71%内存节省、UNORM8x4和SNORM16x2归一化
- [Blend Modes UBO 修复报告](./packages/rhi/llmdoc/reference/blend-modes-ubo-fix-report.md) - UBO 绑定问题修复过程
  - 问题描述、根本原因、修复方案和UBO使用规范
- [混合模式 Demo 参考](./packages/rhi/llmdoc/reference/blend-modes-demo.md) - 混合模式 Demo 完整实现
  - 7种混合模式实现、纹理加载、交互控制和MVP变换
- [ShaderUtils 着色器工具参考](./packages/rhi/llmdoc/reference/shader-utils-reference.md) - 着色器代码生成和管理工具
  - Uniform 块生成、std140 布局计算、着色器模板、代码片段库
- [TextureLoader 纹理加载器参考](./packages/rhi/demo/src/utils/texture/TEXTURELOADER.md) - 纹理加载和处理工具
  - 异步加载、Mipmap 生成、Y 轴翻转、预乘 Alpha
- [CubemapGenerator 立方体贴图生成器](./packages/rhi/demo/src/utils/texture/CubemapGenerator.ts) - 立方体贴图生成工具
  - 程序化生成、天空渐变、调试着色、全景图转换
- [RenderTarget 渲染目标管理器](./packages/rhi/demo/src/utils/rendering/RenderTarget.ts) - 离屏渲染工具
  - 多渲染目标 MRT、MSAA 支持、自动资源管理
- [混合模式 Demo 参考](./packages/rhi/llmdoc/reference/blend-modes-demo.md) - 混合模式 Demo 完整实现
  - 7种混合模式实现、纹理加载、交互控制和MVP变换

## 3. 核心概念和对应文档

### 🎯 3D 渲染核心

#### RHI (Render Hardware Interface)
- **概念**: 硬件渲染抽象层，屏蔽底层图形 API 的复杂性
- **相关文档**:
  - [RHI 概述](./overview/rhi-overview.md) - 了解 RHI 的设计理念
  - [RHI 架构](./architecture/rhi-architecture.md) - 深入理解实现原理
  - [使用 RHI](./guides/using-rhi.md) - 实践指南

#### WebGL 查询集功能
- **概念**: 支持 GPU 遮挡查询，用于优化渲染性能
- **相关文档**:
  - [Query Set API](./reference/webgl-query-set.md) - API 参考
  - [Query Set API (RHI)](./packages/rhi/llmdoc/reference/query-set-api.md) - RHI 接口规范
  - [WebGL 实现](./architecture/webgl-implementation.md) - 实现细节

#### Push Constants 机制
- **概念**: 高效参数传递机制，通过 UBO 实现 WebGPU 风格的 push constants
- **相关文档**:
  - [Push Constants 实现](./packages/rhi/llmdoc/reference/push-constants.md) - 完整实现细节
  - [std140 布局规范](./packages/rhi/llmdoc/reference/push-constants.md) - 内存布局规则

#### 资源管理系统
- **概念**: 全局资源追踪和生命周期管理，自动检测泄漏
- **相关文档**:
  - [Resource Tracker API](./packages/rhi/llmdoc/reference/resource-tracker-api.md) - API 使用指南
  - [设备生命周期](./packages/rhi/llmdoc/reference/device-lifecycle.md) - 设备资源管理

#### WebGL 渲染管线和命令系统
- **概念**: 基于 WebGL 的渲染流水线，支持现代图形特性和类型安全的命令编码
- **相关文档**:
  - [WebGL 实现](./architecture/webgl-implementation.md) - 技术细节
  - [WebGL 命令](./guides/webgl-commands.md) - 使用方法
  - [RHI 命令类型](./reference/rhi-command-types.md) - 类型安全的命令系统
  - [RHI 演示开发](./packages/rhi/llmdoc/guides/demo-development.md) - 演示系统开发指南
  - [混合模式 Demo 参考](./packages/rhi/llmdoc/reference/blend-modes-demo.md) - 混合模式完整实现

#### MVP 矩阵变换
- **概念**: Model-View-Projection 矩阵变换管线，实现 3D 空间的完整变换流程
- **相关文档**:
  - [MVP 矩阵实现架构](./architecture/mvp-matrix-implementation.md) - 实现架构和组件设计
  - [MVP 矩阵更新指南](./reference/mvp-matrix-update-guide.md) - 迁移指南和技术细节
  - [OrbitController 相机控制](./packages/rhi/llmdoc/reference/orbit-controller.md) - 交互式相机系统

#### 多顶点缓冲区架构
- **概念**: 将顶点数据分离到不同缓冲区，实现灵活的顶点属性管理
- **相关文档**:
  - [多顶点缓冲区 Demo 参考](./packages/rhi/llmdoc/reference/multiple-buffers-demo.md) - 完整实现参考
  - [多缓冲区绑定技术](./packages/rhi/demo/src/multiple-buffers.ts) - 代码示例
  - [顶点布局配置](./architecture/webgl-implementation.md) - WebGL 实现细节

#### 顶点格式优化
- **概念**: 使用不同的顶点数据格式（FLOAT32、UNORM8x4、FLOAT16、SNORM16）实现内存优化
- **相关文档**:
  - [顶点格式 Demo 参考](./packages/rhi/llmdoc/reference/vertex-formats-demo.md) - 完整实现参考
  - [顶点格式实现详解](./packages/rhi/demo/src/VERTEX_FORMATS_IMPLEMENTATION.md) - 技术细节

#### 动态缓冲区管理
- **概念**: 实时更新顶点缓冲区数据，适用于动画和变形效果
- **相关文档**:
  - [动态缓冲区 Demo 参考](./packages/rhi/llmdoc/reference/dynamic-buffer-demo.md) - 完整实现参考
  - [波浪动画实现](./packages/rhi/demo/src/dynamic-buffer.ts) - 代码示例
  - [缓冲区 hint 优化](./packages/rhi/llmdoc/overview/rhi-overview.md) - 性能优化策略

#### Demo 开发工具库
- **概念**: 增强 Demo 开发能力的工具集合
- **相关文档**:
  - [RHI 演示开发](./packages/rhi/llmdoc/guides/demo-development.md) - 完整开发指南
  - [TextureLoader 纹理加载器](./packages/rhi/demo/src/utils/texture/TEXTURELOADER.md) - 纹理加载和处理
  - [CubemapGenerator 立方体贴图生成器](./packages/rhi/demo/src/utils/texture/CubemapGenerator.ts) - 立方体贴图生成
  - [RenderTarget 渲染目标管理器](./packages/rhi/demo/src/utils/rendering/RenderTarget.ts) - 离屏渲染
  - [ShaderUtils 着色器工具](./packages/rhi/llmdoc/reference/shader-utils-reference.md) - 着色器代码生成

### 🧮 数学系统

#### 3D 数学库
- **概念**: 向量、矩阵、四元数等基础数学运算，性能优化
- **相关文档**:
  - [数学库概述](./overview/math-overview.md) - 整体介绍
  - [数学库架构](./architecture/math-core-architecture.md) - 实现原理
  - [数学使用指南](./guides/using-math-library.md) - 使用方法
  - [数学类型参考](./reference/math-type-reference.md) - API 文档

### 🏗️ 引擎系统

#### 实体组件系统 (ECS)
- **概念**: 基于组件的实体管理架构，提供高性能的场景管理
- **相关文档**:
  - [引擎概述](./overview/engine-overview.md) - 系统介绍
  - [引擎架构](./architecture/engine-architecture.md) - 架构设计
  - [引擎使用指南](./guides/engine-usage.md) - 实践指南

#### 渲染管线
- **概念**: 完整的渲染流程，包括前向渲染、深度预通道、透明处理
- **相关文档**:
  - [引擎子系统](./architecture/engine-systems.md) - 详细设计

### 🎬 USD 规范系统

#### OpenUSD 支持
- **概念**: 基于 Universal Scene Description 格式的场景描述系统
- **相关文档**:
  - [USD 概述](./overview/usd-overview.md) - 系统介绍
  - [USD 架构](./architecture/usd-architecture.md) - 架构设计
  - [USD 数据模型](./architecture/usd-data-model.md) - 数据结构
  - [USD 使用指南](./guides/using-usd-specification.md) - 使用方法
  - [USD 动画](./guides/usd-animation.md) - 动画系统
  - [USD 类型参考](./reference/usd-core-types.md) - API 文档

#### 统一类型系统
- **概念**: Specification 包的泛型基类体系和类型继承系统，解决类型重复问题
- **相关文档**:
  - [类型系统架构](./architecture/specification-type-system.md) - 整体架构设计
  - [Specification 类型参考](./reference/specification-type-reference.md) - 完整类型定义
- **重构报告**: [重复类型分析](./packages/specification/docs/duplicate-analysis-report.md) - 类型重复问题分析
- [重构完成](./packages/specification/docs/refactoring-completion-report.md) - 重构过程和结果

## 4. 快速开始指南

### 🚀 入门路径

#### 路径一：快速体验 (30分钟)
1. 阅读 [项目概览](./overview/project-overview.md) - 了解项目定位和核心功能
2. 查看 [RHI 概述](./overview/rhi-overview.md) - 了解渲染抽象层概念
3. 查看 [顶点格式 Demo 参考](./packages/rhi/llmdoc/reference/vertex-formats-demo.md) - 了解内存优化技术
4. 查看 [RHI 演示开发](./packages/rhi/llmdoc/guides/demo-development.md) - 了解演示系统架构
5. 尝试 [使用 RHI](./guides/using-rhi.md) - 运行第一个渲染示例

#### 路径二：开发者入门 (2-4小时)
1. **环境准备**:
   - 安装 pnpm、Node.js、TypeScript
   - 克隆代码库并运行 `pnpm install`

2. **核心概念学习**:
   - [项目概览](./overview/project-overview.md) - 整体认识
   - [数学库概述](./overview/math-overview.md) - 3D 数学基础
   - [编码约定](./reference/coding-conventions.md) - 代码规范

3. **实践操作**:
   - [数学库使用指南](./guides/using-math-library.md) - 基础运算
   - [使用 RHI](./guides/using-rhi.md) - 渲染入门
   - [引擎使用指南](./guides/engine-usage.md) - 场景管理
   - [RHI 演示开发](./packages/rhi/llmdoc/guides/demo-development.md) - 演示系统开发

#### 路径三：深度开发 (1-2周)
1. **架构理解**:
   - [RHI 架构](./architecture/rhi-architecture.md) - 渲染抽象层
   - [数学库架构](./architecture/math-core-architecture.md) - 数学实现
   - [引擎架构](./architecture/engine-architecture.md) - 引擎设计

2. **高级特性**:
   - [WebGL 实现](./architecture/webgl-implementation.md) - 底层细节
   - [性能优化](./guides/performance-tuning.md) - 性能调优
   - [USD 系统](./overview/usd-overview.md) - 场景描述
   - [查询集 API](./reference/webgl-query-set.md) - GPU 查询功能
   - [Push Constants](./packages/rhi/llmdoc/reference/push-constants.md) - 高效参数传递
   - [Resource Tracker](./packages/rhi/llmdoc/reference/resource-tracker-api.md) - 资源管理

3. **扩展开发**:
   - [数学类型参考](./reference/math-type-reference.md) - API 参考
   - [RHI 接口参考](./reference/rhi-interfaces.md) - 接口文档
   - [USD 类型参考](./reference/usd-core-types.md) - USD API
   - [MVP 矩阵实现架构](./architecture/mvp-matrix-implementation.md) - 3D 变换管线
   - [混合模式 Demo 参考](./packages/rhi/llmdoc/reference/blend-modes-demo.md) - 混合模式完整实现
  - 7种混合模式实现、纹理加载、交互控制和MVP变换
- [Demo 工具库](./packages/rhi/llmdoc/guides/demo-development.md) - 增强开发能力

### 📋 开发环境配置

```bash
# 克隆项目
git clone [repository-url]
cd max/runtime

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 运行测试
pnpm test
```

## 5. 参考资料链接

### 🔗 项目仓库
- **主仓库**: [Maxell 3D Runtime](https://github.com/MaxelLabs/runtime)
- **子模块**: 各个包独立发布和版本管理

### 📚 相关技术文档
- **WebGL API**: [MDN WebGL 教程](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)
- **TypeScript**: [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- **OpenUSD**: [Pixar USD 官方文档](https://openusd.org/release/index.html)
- **WebGPU**: [WebGPU 规范](https://www.w3.org/TR/webgpu/) (未来扩展方向)

### 🛠️ 开发工具
- **pnpm**: [pnpm 包管理器](https://pnpm.io/)
- **Vite**: [现代构建工具](https://vitejs.dev/)
- **ESLint**: [代码质量检查](https://eslint.org/)
- **Prettier**: [代码格式化](https://prettier.io/)

### 📖 扩展阅读
- **游戏引擎架构**: [Game Engine Architecture](https://gameenginebook.com/) (Jason Gregory)
- **实时渲染**: [Real-Time Rendering](https://www.realtimerendering.com/) (Tomas Akenine-Möller)
- **计算机图形学**: [Computer Graphics: Principles and Practice](http://www.scholastic.com/)

---

## 📊 文档维护状态

| 类别 | 文档数量 | 完成度 | 更新时间 |
|------|----------|--------|----------|
| 概述文档 | 5 | 100% | 2024-12 |
| 操作指南 | 7 | 100% | 2025-12 (新增引擎特定性能优化) |
| 架构设计 | 10 | 100% | 2025-12 (引擎架构路径更新) |
| 参考资料 | 21 | 100% | 2025-12-11 (新增多缓冲区黑屏修复指南) |
| **核心总计** | **38** | **100%** | **2025-12-11 (多缓冲区黑屏问题修复记录)** |
| **包内文档** | **21** | **100%** | **2025-12-11 (多缓冲区 Demo 问题修复)** |
| **总计** | **59** | **100%** | **2025-12-11 (新增多缓冲区黑屏问题调查报告)** |

## 🤝 贡献指南

欢迎为文档系统贡献内容！请参考以下步骤：

1. **文档格式**: 遵循 [编码约定](./reference/coding-conventions.md) 中的文档规范
2. **内容分类**: 确保文档放置在正确的目录结构中
3. **版本控制**: 使用清晰的提交消息，遵循 [Git 工作流](./reference/git-conventions.md)
4. **质量保证**: 提交前检查文档的准确性和完整性

### 📁 Agent 目录说明

`/agent/` 目录包含临时性的技术调查报告和分析文档，这些文档通常：
- 记录开发过程中的问题排查过程
- 分析特定的技术实现方案
- 提供临时的解决方案记录

这些文档会在问题解决后，其重要内容被整合到主文档系统的相应目录中。

如有问题或建议，请通过 Issues 或 Pull Request 联系我们。