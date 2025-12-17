---
title: Overview
description: 自动化LLM-Native标准化指南文档
category: guides
subcategory: demo
tags: ['guide', 'llm-native', 'demo', 'demo-developers', 'interface-first', 'code-examples', 'step-by-step']
target_audience: demo-developers
complexity: advanced
estimated_time: f"52 分钟"
last_updated: 2025-12-17
llm_native_compliance: true
version: 1.0.0
---


## 🎯 Context & Goal

### Context
本文档属于**demo**类型的开发指南，面向**demo-developers**。

### Goal
帮助开发者快速理解和掌握相关概念、工具和最佳实践，提高开发效率和代码质量。

### Prerequisites
- 基础的编程知识
- 了解项目架构和基本概念
- 相关领域的开发经验

---

# RHI Demo 开发概览

## 概述

RHI Demo 系统是完整的渲染硬件接口（RHI）演示平台，提供了从基础渲染到高级特效的全套示例。系统采用分层架构，循序渐进地展示现代3D渲染的各个技术层面。

## 🏗️ 系统架构

### 分层设计

```
RHI Demo 系统
├── 第一层：基础渲染 (12个Demo)
│   ├── 基础几何体渲染
│   ├── 缓冲区管理
│   ├── 状态测试
│   └── 混合模式
├── 第二层：纹理系统 (10个Demo)
│   ├── 纹理基础操作
│   ├── 过滤和包裹
│   ├── 高级纹理技术
│   └── 程序化纹理
├── 第三层：光照与材质 (10个Demo)
│   ├── 光照模型
│   ├── 光源类型
│   ├── 材质系统
│   └── PBR渲染
└── 第四层：高级渲染 (多个模块)
    ├── 阴影系统
    ├── 粒子系统
    ├── 天空盒系统
    ├── 实例化渲染
    └── 后处理效果
```

### 技术栈

- **核心**: TypeScript + WebGL/WebGPU
- **数学库**: @maxellabs/math
- **构建工具**: Rollup + Vite
- **测试框架**: Jest + Puppeteer

## 📊 开发状态

### 完成进度

| 层级 | Demo数量 | 完成状态 | 完成率 |
|------|----------|----------|--------|
| 第一层：基础渲染 | 12 | ✅ 100% | 100% |
| 第二层：纹理系统 | 10 | ✅ 100% | 100% |
| 第三层：光照材质 | 10 | ✅ 100% | 100% |
| 第四层：高级渲染 | 6 | ✅ 100% | 100% |
| **总计** | **38** | **✅ 100%** | **100%** |

### 最新更新 (2025-12-16)

#### 🎉 第四层高级渲染系统全部完成

- **✅ 阴影工具模块**: ShadowMap、LightSpaceMatrix、PCFFilter、ShadowShaders
- **✅ 粒子系统模块**: ParticleRenderer、ParticleSystem、ParticleEmitter、ParticleUpdater
- **✅ 天空盒系统模块**: SkyboxRenderer、EnvironmentMap、IBLUtils
- **✅ 实例化工具模块**: InstanceBuffer、InstancedRenderer
- **✅ PBR材质模块**: PBRMaterial、BRDFUtils、IBLUtils

## 🛠️ 核心工具库

### 已实现工具模块

#### 核心框架
- **DemoRunner**: 统一的Demo生命周期管理
- **统一类型系统**: 标准化的类型定义

#### 渲染工具
- **GeometryGenerator**: 9种几何体生成器
- **TextureLoader**: 纹理加载和处理
- **CubemapGenerator**: 立方体贴图工具
- **RenderTarget**: 离屏渲染管理

#### 高级系统
- **ShadowUtils**: 阴影贴图和软阴影
- **ParticleSystem**: GPU实例化粒子系统
- **SkyboxSystem**: 环境映射和天空盒
- **PBRMaterial**: 基于物理的材质系统

## 🚀 快速开始

### 环境准备

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm --filter @maxellabs/rhi dev

# 运行测试
pnpm test

# 构建项目
pnpm build
```

### 创建新Demo

```typescript
// 1. 创建Demo文件
import { DemoRunner, GeometryGenerator, OrbitController, Stats } from './utils';

export default class MyDemo {
  private runner: DemoRunner;
  private orbit: OrbitController;
  private stats: Stats;

  constructor(canvas: HTMLCanvasElement) {
    this.runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'My Demo',
      clearColor: [0.1, 0.1, 0.1, 1.0],
    });

    this.setupDemo();
  }

  private async setupDemo(): Promise<void> {
    await this.runner.init();

    // 创建几何体
    const geometry = GeometryGenerator.cube({ size: 1.0 });
    const vertexBuffer = this.runner.createVertexBuffer(
      geometry.vertices,
      'CubeVertices'
    );

    // 设置相机控制
    this.orbit = new OrbitController(this.runner.canvas, {
      distance: 5,
      target: [0, 0, 0],
      enableDamping: true,
    });

    // 设置性能监控
    this.stats = new Stats({ position: 'top-left' });

    // 开始渲染循环
    this.runner.start((dt) => {
      this.stats.begin();
      this.render(dt);
      this.stats.end();
    });
  }

  private render(dt: number): void {
    const { encoder, passDescriptor } = this.runner.beginFrame();
    // 渲染代码...
    this.runner.endFrame(encoder);
  }
}
```

### Demo开发规范

#### 必需组件
- ✅ MVP矩阵变换
- ✅ Stats性能监控
- ✅ OrbitController相机控制
- ✅ 统一UI布局

#### 标准流程
1. **初始化**: DemoRunner + 工具库
2. **设置**: 几何体 + 材质 + 相机
3. **渲染**: 统一渲染循环
4. **交互**: 键盘/鼠标事件处理
5. **清理**: 资源释放

## 📁 项目结构

```
packages/rhi/demo/
├── html/                    # Demo入口页面
│   ├── triangle.html
│   ├── rotating-cube.html
│   └── ...
├── src/                     # Demo源代码
│   ├── triangle.ts
│   ├── rotating-cube.ts
│   └── ...
├── utils/                   # 工具库
│   ├── core/               # 核心框架
│   ├── geometry/           # 几何体生成
│   ├── texture/            # 纹理工具
│   ├── shadow/             # 阴影系统
│   ├── particle/           # 粒子系统
│   └── ...
└── index.html              # Demo导航主页
```

## 🎯 Demo导航

### 访问Demo

1. **主页导航**: `http://localhost:3001/demo/index.html`
2. **直接访问**: `http://localhost:3001/demo/html/[demo-name].html`
3. **开发调试**: 浏览器开发者工具

### Demo分类

#### 🎯 基础功能Demo
- triangle: 最小化渲染流程
- rotating-cube: 3D变换矩阵
- depth-test: 深度测试
- blend-modes: 混合模式

#### 🖼️ 纹理系统Demo
- texture-2d: 基础纹理采样
- texture-filtering: 过滤模式
- texture-wrapping: 包裹模式
- cubemap-skybox: 立方体贴图

#### 🌟 高级渲染Demo
- shadow-mapping: 阴影贴图
- particle-system: 粒子系统
- instancing: 实例化渲染
- pbr-material: PBR材质

## 🔧 开发工具

### 调试功能

```typescript
// 启用调试模式
const runner = new DemoRunner({
  debug: true,  // 启用调试信息
  logLevel: 'verbose',  // 详细日志
});

// 性能分析
runner.enableProfiling();

// 内存监控
runner.enableMemoryTracking();
```

### 测试工具

```bash
# 运行所有Demo测试
pnpm test:demo

# 运行特定Demo测试
pnpm test:demo -- --demo=triangle

# 生成测试报告
pnpm test:demo -- --coverage
```

## 📖 相关文档

- [Demo开发规范](./demo-standards.md)
- [工具库使用指南](./tools-library.md)
- [Demo目录和状态](./demo-catalog.md)
- [最佳实践指南](./best-practices.md)

## 🤝 贡献指南

### 提交新Demo

1. 创建分支: `git checkout -b demo/[demo-name]`
2. 实现Demo代码
3. 创建HTML入口页面
4. 更新index.html导航
5. 添加测试用例
6. 提交Pull Request

### 代码规范

- TypeScript严格模式
- ESLint + Prettier
- 单元测试覆盖率 > 80%
- 文档注释完整

## 📞 获取帮助

- **Issues**: [GitHub Issues](https://github.com/maxelllabs/rhi/issues)
- **Discussions**: [GitHub Discussions](https://github.com/maxellabs/rhi/discussions)
- **文档**: [完整文档](https://maxelllabs.github.io/rhi/docs/)
## 🔌 Interface First

### 核心接口定义
#### 配置接口
```typescript
interface Config {
  version: string;
  options: Record<string, any>;
}
```

#### 执行接口
```typescript
function execute(config: Config): Promise<Result> {
  // 实现逻辑
}
```

### 使用流程
1. **初始化**: 按照规范初始化相关组件
2. **配置**: 设置必要的参数和选项
3. **执行**: 调用核心接口执行功能
4. **验证**: 检查结果和状态

---

# RHI Demo 开发概览

## 概述

RHI Demo 系统是完整的渲染硬件接口（RHI）演示平台，提供了从基础渲染到高级特效的全套示例。系统采用分层架构，循序渐进地展示现代3D渲染的各个技术层面。

## 🏗️ 系统架构

### 分层设计

```
RHI Demo 系统
├── 第一层：基础渲染 (12个Demo)
│   ├── 基础几何体渲染
│   ├── 缓冲区管理
│   ├── 状态测试
│   └── 混合模式
├── 第二层：纹理系统 (10个Demo)
│   ├── 纹理基础操作
│   ├── 过滤和包裹
│   ├── 高级纹理技术
│   └── 程序化纹理
├── 第三层：光照与材质 (10个Demo)
│   ├── 光照模型
│   ├── 光源类型
│   ├── 材质系统
│   └── PBR渲染
└── 第四层：高级渲染 (多个模块)
    ├── 阴影系统
    ├── 粒子系统
    ├── 天空盒系统
    ├── 实例化渲染
    └── 后处理效果
```

### 技术栈

- **核心**: TypeScript + WebGL/WebGPU
- **数学库**: @maxellabs/math
- **构建工具**: Rollup + Vite
- **测试框架**: Jest + Puppeteer

## 📊 开发状态

### 完成进度

| 层级 | Demo数量 | 完成状态 | 完成率 |
|------|----------|----------|--------|
| 第一层：基础渲染 | 12 | ✅ 100% | 100% |
| 第二层：纹理系统 | 10 | ✅ 100% | 100% |
| 第三层：光照材质 | 10 | ✅ 100% | 100% |
| 第四层：高级渲染 | 6 | ✅ 100% | 100% |
| **总计** | **38** | **✅ 100%** | **100%** |

### 最新更新 (2025-12-16)

#### 🎉 第四层高级渲染系统全部完成

- **✅ 阴影工具模块**: ShadowMap、LightSpaceMatrix、PCFFilter、ShadowShaders
- **✅ 粒子系统模块**: ParticleRenderer、ParticleSystem、ParticleEmitter、ParticleUpdater
- **✅ 天空盒系统模块**: SkyboxRenderer、EnvironmentMap、IBLUtils
- **✅ 实例化工具模块**: InstanceBuffer、InstancedRenderer
- **✅ PBR材质模块**: PBRMaterial、BRDFUtils、IBLUtils

## 🛠️ 核心工具库

### 已实现工具模块

#### 核心框架
- **DemoRunner**: 统一的Demo生命周期管理
- **统一类型系统**: 标准化的类型定义

#### 渲染工具
- **GeometryGenerator**: 9种几何体生成器
- **TextureLoader**: 纹理加载和处理
- **CubemapGenerator**: 立方体贴图工具
- **RenderTarget**: 离屏渲染管理

#### 高级系统
- **ShadowUtils**: 阴影贴图和软阴影
- **ParticleSystem**: GPU实例化粒子系统
- **SkyboxSystem**: 环境映射和天空盒
- **PBRMaterial**: 基于物理的材质系统

## 🚀 快速开始

### 环境准备

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm --filter @maxellabs/rhi dev

# 运行测试
pnpm test

# 构建项目
pnpm build
```

### 创建新Demo

```typescript
// 1. 创建Demo文件
import { DemoRunner, GeometryGenerator, OrbitController, Stats } from './utils';

export default class MyDemo {
  private runner: DemoRunner;
  private orbit: OrbitController;
  private stats: Stats;

  constructor(canvas: HTMLCanvasElement) {
    this.runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'My Demo',
      clearColor: [0.1, 0.1, 0.1, 1.0],
    });

    this.setupDemo();
  }

  private async setupDemo(): Promise<void> {
    await this.runner.init();

    // 创建几何体
    const geometry = GeometryGenerator.cube({ size: 1.0 });
    const vertexBuffer = this.runner.createVertexBuffer(
      geometry.vertices,
      'CubeVertices'
    );

    // 设置相机控制
    this.orbit = new OrbitController(this.runner.canvas, {
      distance: 5,
      target: [0, 0, 0],
      enableDamping: true,
    });

    // 设置性能监控
    this.stats = new Stats({ position: 'top-left' });

    // 开始渲染循环
    this.runner.start((dt) => {
      this.stats.begin();
      this.render(dt);
      this.stats.end();
    });
  }

  private render(dt: number): void {
    const { encoder, passDescriptor } = this.runner.beginFrame();
    // 渲染代码...
    this.runner.endFrame(encoder);
  }
}
```

### Demo开发规范

#### 必需组件
- ✅ MVP矩阵变换
- ✅ Stats性能监控
- ✅ OrbitController相机控制
- ✅ 统一UI布局

#### 标准流程
1. **初始化**: DemoRunner + 工具库
2. **设置**: 几何体 + 材质 + 相机
3. **渲染**: 统一渲染循环
4. **交互**: 键盘/鼠标事件处理
5. **清理**: 资源释放

## 📁 项目结构

```
packages/rhi/demo/
├── html/                    # Demo入口页面
│   ├── triangle.html
│   ├── rotating-cube.html
│   └── ...
├── src/                     # Demo源代码
│   ├── triangle.ts
│   ├── rotating-cube.ts
│   └── ...
├── utils/                   # 工具库
│   ├── core/               # 核心框架
│   ├── geometry/           # 几何体生成
│   ├── texture/            # 纹理工具
│   ├── shadow/             # 阴影系统
│   ├── particle/           # 粒子系统
│   └── ...
└── index.html              # Demo导航主页
```

## 🎯 Demo导航

### 访问Demo

1. **主页导航**: `http://localhost:3001/demo/index.html`
2. **直接访问**: `http://localhost:3001/demo/html/[demo-name].html`
3. **开发调试**: 浏览器开发者工具

### Demo分类

#### 🎯 基础功能Demo
- triangle: 最小化渲染流程
- rotating-cube: 3D变换矩阵
- depth-test: 深度测试
- blend-modes: 混合模式

#### 🖼️ 纹理系统Demo
- texture-2d: 基础纹理采样
- texture-filtering: 过滤模式
- texture-wrapping: 包裹模式
- cubemap-skybox: 立方体贴图

#### 🌟 高级渲染Demo
- shadow-mapping: 阴影贴图
- particle-system: 粒子系统
- instancing: 实例化渲染
- pbr-material: PBR材质

## 🔧 开发工具

### 调试功能

```typescript
// 启用调试模式
const runner = new DemoRunner({
  debug: true,  // 启用调试信息
  logLevel: 'verbose',  // 详细日志
});

// 性能分析
runner.enableProfiling();

// 内存监控
runner.enableMemoryTracking();
```

### 测试工具

```bash
# 运行所有Demo测试
pnpm test:demo

# 运行特定Demo测试
pnpm test:demo -- --demo=triangle

# 生成测试报告
pnpm test:demo -- --coverage
```

## 📖 相关文档

- [Demo开发规范](./demo-standards.md)
- [工具库使用指南](./tools-library.md)
- [Demo目录和状态](./demo-catalog.md)
- [最佳实践指南](./best-practices.md)

## 🤝 贡献指南

### 提交新Demo

1. 创建分支: `git checkout -b demo/[demo-name]`
2. 实现Demo代码
3. 创建HTML入口页面
4. 更新index.html导航
5. 添加测试用例
6. 提交Pull Request

### 代码规范

- TypeScript严格模式
- ESLint + Prettier
- 单元测试覆盖率 > 80%
- 文档注释完整

## 📞 获取帮助

- **Issues**: [GitHub Issues](https://github.com/maxelllabs/rhi/issues)
- **Discussions**: [GitHub Discussions](https://github.com/maxellabs/rhi/discussions)
- **文档**: [完整文档](https://maxelllabs.github.io/rhi/docs/)
## ⚠️ 禁止事项

### 关键约束
- 🚫 **避免硬编码路径**: 使用相对路径或配置文件
- 🚫 **忽略资源清理**: 确保所有资源得到正确释放
- 🚫 **缺少错误处理**: 提供清晰的错误信息和恢复机制

### 常见错误
- ❌ 忽略错误处理和异常情况
- ❌ 缺少必要的性能优化
- ❌ 不遵循项目的编码规范
- ❌ 忽略文档更新和维护

### 最佳实践提醒
- ✅ 始终考虑性能影响
- ✅ 提供清晰的错误信息
- ✅ 保持代码的可维护性
- ✅ 定期更新文档

---

# RHI Demo 开发概览

## 概述

RHI Demo 系统是完整的渲染硬件接口（RHI）演示平台，提供了从基础渲染到高级特效的全套示例。系统采用分层架构，循序渐进地展示现代3D渲染的各个技术层面。

## 🏗️ 系统架构

### 分层设计

```
RHI Demo 系统
├── 第一层：基础渲染 (12个Demo)
│   ├── 基础几何体渲染
│   ├── 缓冲区管理
│   ├── 状态测试
│   └── 混合模式
├── 第二层：纹理系统 (10个Demo)
│   ├── 纹理基础操作
│   ├── 过滤和包裹
│   ├── 高级纹理技术
│   └── 程序化纹理
├── 第三层：光照与材质 (10个Demo)
│   ├── 光照模型
│   ├── 光源类型
│   ├── 材质系统
│   └── PBR渲染
└── 第四层：高级渲染 (多个模块)
    ├── 阴影系统
    ├── 粒子系统
    ├── 天空盒系统
    ├── 实例化渲染
    └── 后处理效果
```

### 技术栈

- **核心**: TypeScript + WebGL/WebGPU
- **数学库**: @maxellabs/math
- **构建工具**: Rollup + Vite
- **测试框架**: Jest + Puppeteer

## 📊 开发状态

### 完成进度

| 层级 | Demo数量 | 完成状态 | 完成率 |
|------|----------|----------|--------|
| 第一层：基础渲染 | 12 | ✅ 100% | 100% |
| 第二层：纹理系统 | 10 | ✅ 100% | 100% |
| 第三层：光照材质 | 10 | ✅ 100% | 100% |
| 第四层：高级渲染 | 6 | ✅ 100% | 100% |
| **总计** | **38** | **✅ 100%** | **100%** |

### 最新更新 (2025-12-16)

#### 🎉 第四层高级渲染系统全部完成

- **✅ 阴影工具模块**: ShadowMap、LightSpaceMatrix、PCFFilter、ShadowShaders
- **✅ 粒子系统模块**: ParticleRenderer、ParticleSystem、ParticleEmitter、ParticleUpdater
- **✅ 天空盒系统模块**: SkyboxRenderer、EnvironmentMap、IBLUtils
- **✅ 实例化工具模块**: InstanceBuffer、InstancedRenderer
- **✅ PBR材质模块**: PBRMaterial、BRDFUtils、IBLUtils

## 🛠️ 核心工具库

### 已实现工具模块

#### 核心框架
- **DemoRunner**: 统一的Demo生命周期管理
- **统一类型系统**: 标准化的类型定义

#### 渲染工具
- **GeometryGenerator**: 9种几何体生成器
- **TextureLoader**: 纹理加载和处理
- **CubemapGenerator**: 立方体贴图工具
- **RenderTarget**: 离屏渲染管理

#### 高级系统
- **ShadowUtils**: 阴影贴图和软阴影
- **ParticleSystem**: GPU实例化粒子系统
- **SkyboxSystem**: 环境映射和天空盒
- **PBRMaterial**: 基于物理的材质系统

## 🚀 快速开始

### 环境准备

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm --filter @maxellabs/rhi dev

# 运行测试
pnpm test

# 构建项目
pnpm build
```

### 创建新Demo

```typescript
// 1. 创建Demo文件
import { DemoRunner, GeometryGenerator, OrbitController, Stats } from './utils';

export default class MyDemo {
  private runner: DemoRunner;
  private orbit: OrbitController;
  private stats: Stats;

  constructor(canvas: HTMLCanvasElement) {
    this.runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'My Demo',
      clearColor: [0.1, 0.1, 0.1, 1.0],
    });

    this.setupDemo();
  }

  private async setupDemo(): Promise<void> {
    await this.runner.init();

    // 创建几何体
    const geometry = GeometryGenerator.cube({ size: 1.0 });
    const vertexBuffer = this.runner.createVertexBuffer(
      geometry.vertices,
      'CubeVertices'
    );

    // 设置相机控制
    this.orbit = new OrbitController(this.runner.canvas, {
      distance: 5,
      target: [0, 0, 0],
      enableDamping: true,
    });

    // 设置性能监控
    this.stats = new Stats({ position: 'top-left' });

    // 开始渲染循环
    this.runner.start((dt) => {
      this.stats.begin();
      this.render(dt);
      this.stats.end();
    });
  }

  private render(dt: number): void {
    const { encoder, passDescriptor } = this.runner.beginFrame();
    // 渲染代码...
    this.runner.endFrame(encoder);
  }
}
```

### Demo开发规范

#### 必需组件
- ✅ MVP矩阵变换
- ✅ Stats性能监控
- ✅ OrbitController相机控制
- ✅ 统一UI布局

#### 标准流程
1. **初始化**: DemoRunner + 工具库
2. **设置**: 几何体 + 材质 + 相机
3. **渲染**: 统一渲染循环
4. **交互**: 键盘/鼠标事件处理
5. **清理**: 资源释放

## 📁 项目结构

```
packages/rhi/demo/
├── html/                    # Demo入口页面
│   ├── triangle.html
│   ├── rotating-cube.html
│   └── ...
├── src/                     # Demo源代码
│   ├── triangle.ts
│   ├── rotating-cube.ts
│   └── ...
├── utils/                   # 工具库
│   ├── core/               # 核心框架
│   ├── geometry/           # 几何体生成
│   ├── texture/            # 纹理工具
│   ├── shadow/             # 阴影系统
│   ├── particle/           # 粒子系统
│   └── ...
└── index.html              # Demo导航主页
```

## 🎯 Demo导航

### 访问Demo

1. **主页导航**: `http://localhost:3001/demo/index.html`
2. **直接访问**: `http://localhost:3001/demo/html/[demo-name].html`
3. **开发调试**: 浏览器开发者工具

### Demo分类

#### 🎯 基础功能Demo
- triangle: 最小化渲染流程
- rotating-cube: 3D变换矩阵
- depth-test: 深度测试
- blend-modes: 混合模式

#### 🖼️ 纹理系统Demo
- texture-2d: 基础纹理采样
- texture-filtering: 过滤模式
- texture-wrapping: 包裹模式
- cubemap-skybox: 立方体贴图

#### 🌟 高级渲染Demo
- shadow-mapping: 阴影贴图
- particle-system: 粒子系统
- instancing: 实例化渲染
- pbr-material: PBR材质

## 🔧 开发工具

### 调试功能

```typescript
// 启用调试模式
const runner = new DemoRunner({
  debug: true,  // 启用调试信息
  logLevel: 'verbose',  // 详细日志
});

// 性能分析
runner.enableProfiling();

// 内存监控
runner.enableMemoryTracking();
```

### 测试工具

```bash
# 运行所有Demo测试
pnpm test:demo

# 运行特定Demo测试
pnpm test:demo -- --demo=triangle

# 生成测试报告
pnpm test:demo -- --coverage
```

## 📖 相关文档

- [Demo开发规范](./demo-standards.md)
- [工具库使用指南](./tools-library.md)
- [Demo目录和状态](./demo-catalog.md)
- [最佳实践指南](./best-practices.md)

## 🤝 贡献指南

### 提交新Demo

1. 创建分支: `git checkout -b demo/[demo-name]`
2. 实现Demo代码
3. 创建HTML入口页面
4. 更新index.html导航
5. 添加测试用例
6. 提交Pull Request

### 代码规范

- TypeScript严格模式
- ESLint + Prettier
- 单元测试覆盖率 > 80%
- 文档注释完整

## 📞 获取帮助

- **Issues**: [GitHub Issues](https://github.com/maxelllabs/rhi/issues)
- **Discussions**: [GitHub Discussions](https://github.com/maxellabs/rhi/discussions)
- **文档**: [完整文档](https://maxelllabs.github.io/rhi/docs/)
## 📚 Few-Shot示例

### 问题-解决方案对
**问题**: Demo无法在特定设备上运行
**解决方案**: 添加设备兼容性检查和降级方案
```typescript
if (!device.supportsFeature('requiredFeature')) {
  // 使用降级渲染
  renderer.useFallbackMode();
}
```

**问题**: 资源加载失败导致Demo崩溃
**解决方案**: 实现资源加载重试机制
```typescript
try {
  await resourceLoader.loadWithRetry(texturePath, 3);
} catch (error) {
  console.warn('使用默认纹理:', error);
  texture = defaultTexture;
}
```

### 学习要点
- 理解常见问题和解决方案
- 掌握最佳实践和避免陷阱
- 培养问题解决思维

---

# RHI Demo 开发概览

## 概述

RHI Demo 系统是完整的渲染硬件接口（RHI）演示平台，提供了从基础渲染到高级特效的全套示例。系统采用分层架构，循序渐进地展示现代3D渲染的各个技术层面。

## 🏗️ 系统架构

### 分层设计

```
RHI Demo 系统
├── 第一层：基础渲染 (12个Demo)
│   ├── 基础几何体渲染
│   ├── 缓冲区管理
│   ├── 状态测试
│   └── 混合模式
├── 第二层：纹理系统 (10个Demo)
│   ├── 纹理基础操作
│   ├── 过滤和包裹
│   ├── 高级纹理技术
│   └── 程序化纹理
├── 第三层：光照与材质 (10个Demo)
│   ├── 光照模型
│   ├── 光源类型
│   ├── 材质系统
│   └── PBR渲染
└── 第四层：高级渲染 (多个模块)
    ├── 阴影系统
    ├── 粒子系统
    ├── 天空盒系统
    ├── 实例化渲染
    └── 后处理效果
```

### 技术栈

- **核心**: TypeScript + WebGL/WebGPU
- **数学库**: @maxellabs/math
- **构建工具**: Rollup + Vite
- **测试框架**: Jest + Puppeteer

## 📊 开发状态

### 完成进度

| 层级 | Demo数量 | 完成状态 | 完成率 |
|------|----------|----------|--------|
| 第一层：基础渲染 | 12 | ✅ 100% | 100% |
| 第二层：纹理系统 | 10 | ✅ 100% | 100% |
| 第三层：光照材质 | 10 | ✅ 100% | 100% |
| 第四层：高级渲染 | 6 | ✅ 100% | 100% |
| **总计** | **38** | **✅ 100%** | **100%** |

### 最新更新 (2025-12-16)

#### 🎉 第四层高级渲染系统全部完成

- **✅ 阴影工具模块**: ShadowMap、LightSpaceMatrix、PCFFilter、ShadowShaders
- **✅ 粒子系统模块**: ParticleRenderer、ParticleSystem、ParticleEmitter、ParticleUpdater
- **✅ 天空盒系统模块**: SkyboxRenderer、EnvironmentMap、IBLUtils
- **✅ 实例化工具模块**: InstanceBuffer、InstancedRenderer
- **✅ PBR材质模块**: PBRMaterial、BRDFUtils、IBLUtils

## 🛠️ 核心工具库

### 已实现工具模块

#### 核心框架
- **DemoRunner**: 统一的Demo生命周期管理
- **统一类型系统**: 标准化的类型定义

#### 渲染工具
- **GeometryGenerator**: 9种几何体生成器
- **TextureLoader**: 纹理加载和处理
- **CubemapGenerator**: 立方体贴图工具
- **RenderTarget**: 离屏渲染管理

#### 高级系统
- **ShadowUtils**: 阴影贴图和软阴影
- **ParticleSystem**: GPU实例化粒子系统
- **SkyboxSystem**: 环境映射和天空盒
- **PBRMaterial**: 基于物理的材质系统

## 🚀 快速开始

### 环境准备

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm --filter @maxellabs/rhi dev

# 运行测试
pnpm test

# 构建项目
pnpm build
```

### 创建新Demo

```typescript
// 1. 创建Demo文件
import { DemoRunner, GeometryGenerator, OrbitController, Stats } from './utils';

export default class MyDemo {
  private runner: DemoRunner;
  private orbit: OrbitController;
  private stats: Stats;

  constructor(canvas: HTMLCanvasElement) {
    this.runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'My Demo',
      clearColor: [0.1, 0.1, 0.1, 1.0],
    });

    this.setupDemo();
  }

  private async setupDemo(): Promise<void> {
    await this.runner.init();

    // 创建几何体
    const geometry = GeometryGenerator.cube({ size: 1.0 });
    const vertexBuffer = this.runner.createVertexBuffer(
      geometry.vertices,
      'CubeVertices'
    );

    // 设置相机控制
    this.orbit = new OrbitController(this.runner.canvas, {
      distance: 5,
      target: [0, 0, 0],
      enableDamping: true,
    });

    // 设置性能监控
    this.stats = new Stats({ position: 'top-left' });

    // 开始渲染循环
    this.runner.start((dt) => {
      this.stats.begin();
      this.render(dt);
      this.stats.end();
    });
  }

  private render(dt: number): void {
    const { encoder, passDescriptor } = this.runner.beginFrame();
    // 渲染代码...
    this.runner.endFrame(encoder);
  }
}
```

### Demo开发规范

#### 必需组件
- ✅ MVP矩阵变换
- ✅ Stats性能监控
- ✅ OrbitController相机控制
- ✅ 统一UI布局

#### 标准流程
1. **初始化**: DemoRunner + 工具库
2. **设置**: 几何体 + 材质 + 相机
3. **渲染**: 统一渲染循环
4. **交互**: 键盘/鼠标事件处理
5. **清理**: 资源释放

## 📁 项目结构

```
packages/rhi/demo/
├── html/                    # Demo入口页面
│   ├── triangle.html
│   ├── rotating-cube.html
│   └── ...
├── src/                     # Demo源代码
│   ├── triangle.ts
│   ├── rotating-cube.ts
│   └── ...
├── utils/                   # 工具库
│   ├── core/               # 核心框架
│   ├── geometry/           # 几何体生成
│   ├── texture/            # 纹理工具
│   ├── shadow/             # 阴影系统
│   ├── particle/           # 粒子系统
│   └── ...
└── index.html              # Demo导航主页
```

## 🎯 Demo导航

### 访问Demo

1. **主页导航**: `http://localhost:3001/demo/index.html`
2. **直接访问**: `http://localhost:3001/demo/html/[demo-name].html`
3. **开发调试**: 浏览器开发者工具

### Demo分类

#### 🎯 基础功能Demo
- triangle: 最小化渲染流程
- rotating-cube: 3D变换矩阵
- depth-test: 深度测试
- blend-modes: 混合模式

#### 🖼️ 纹理系统Demo
- texture-2d: 基础纹理采样
- texture-filtering: 过滤模式
- texture-wrapping: 包裹模式
- cubemap-skybox: 立方体贴图

#### 🌟 高级渲染Demo
- shadow-mapping: 阴影贴图
- particle-system: 粒子系统
- instancing: 实例化渲染
- pbr-material: PBR材质

## 🔧 开发工具

### 调试功能

```typescript
// 启用调试模式
const runner = new DemoRunner({
  debug: true,  // 启用调试信息
  logLevel: 'verbose',  // 详细日志
});

// 性能分析
runner.enableProfiling();

// 内存监控
runner.enableMemoryTracking();
```

### 测试工具

```bash
# 运行所有Demo测试
pnpm test:demo

# 运行特定Demo测试
pnpm test:demo -- --demo=triangle

# 生成测试报告
pnpm test:demo -- --coverage
```

## 📖 相关文档

- [Demo开发规范](./demo-standards.md)
- [工具库使用指南](./tools-library.md)
- [Demo目录和状态](./demo-catalog.md)
- [最佳实践指南](./best-practices.md)

## 🤝 贡献指南

### 提交新Demo

1. 创建分支: `git checkout -b demo/[demo-name]`
2. 实现Demo代码
3. 创建HTML入口页面
4. 更新index.html导航
5. 添加测试用例
6. 提交Pull Request

### 代码规范

- TypeScript严格模式
- ESLint + Prettier
- 单元测试覆盖率 > 80%
- 文档注释完整

## 📞 获取帮助

- **Issues**: [GitHub Issues](https://github.com/maxelllabs/rhi/issues)
- **Discussions**: [GitHub Discussions](https://github.com/maxellabs/rhi/discussions)
- **文档**: [完整文档](https://maxelllabs.github.io/rhi/docs/)