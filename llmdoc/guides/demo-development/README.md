---
title: Readme
description: 自动化LLM-Native标准化指南文档
category: guides
subcategory: demo
tags: ['guide', 'llm-native', 'demo', 'demo-developers', 'interface-first', 'code-examples', 'step-by-step']
target_audience: demo-developers
complexity: intermediate
estimated_time: f"29 分钟"
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

# Demo开发指南

> **📁 从主文档拆分而来**: 原 `demo-development.md` (60KB, 1701行) 已拆分为5个专题文档

## 📚 文档结构

### 概览层
- **[概览](./overview.md)** - 系统架构和快速入门
- **[最佳实践指南](./best-practices.md)** - 优化技巧和故障排除

### 详细层
- **[Demo开发规范](./demo-standards.md)** - 编码规范和开发标准
- **[工具库使用指南](./tools-library.md)** - API文档和使用示例
- **[Demo目录和状态](./demo-catalog.md)** - 完整Demo目录和技术要点

## 🚀 快速开始

### 环境准备
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm --filter @maxellabs/rhi dev

# 访问Demo导航
http://localhost:3001/demo/index.html
```

### 创建新Demo
```typescript
import { DemoRunner, GeometryGenerator, OrbitController, Stats } from './utils';

export default class MyDemo {
  private runner: DemoRunner;

  constructor(canvas: HTMLCanvasElement) {
    this.runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'My Demo',
      clearColor: [0.1, 0.1, 0.1, 1.0],
    });
  }

  async init(): Promise<void> {
    await this.runner.init();
    this.setupScene();
    this.startRenderLoop();
  }
}
```

## 📊 开发状态

### 完成进度

| 层级 | Demo数量 | 完成状态 |
|------|----------|----------|
| **基础渲染** | 12 | ✅ 100% |
| **纹理系统** | 10 | ✅ 100% |
| **光照材质** | 10 | ✅ 100% |
| **高级渲染** | 6 | ✅ 100% |
| **总计** | **38** | **✅ 100%** |

### 最新更新 (2025-12-16)

#### 🎉 第四层高级渲染系统全部完成
- **✅ 阴影工具模块**: ShadowMap、PCFFilter、LightSpaceMatrix
- **✅ 粒子系统模块**: GPU实例化粒子系统
- **✅ 天空盒系统模块**: HDR环境贴图和IBL
- **✅ 实例化工具模块**: InstanceBuffer、InstancedRenderer
- **✅ PBR材质模块**: 基于物理的材质系统

## 🛠️ 核心工具库

### 已实现模块
- **核心框架**: DemoRunner、OrbitController、Stats
- **几何体生成**: 9种标准几何体
- **纹理工具**: TextureLoader、CubemapGenerator、ProceduralTexture
- **渲染工具**: RenderTarget、ShaderUtils
- **高级系统**: 阴影、粒子、天空盒、PBR、后处理

### 工具库使用示例

```typescript
// 几何体生成
const geometry = GeometryGenerator.cube({ size: 1.0 });

// 纹理加载
const texture = await TextureLoader.load('texture.jpg', {
  flipY: true,
  generateMipmaps: true
});

// 阴影系统
const shadowMap = new ShadowMap(device, {
  resolution: 2048
});

// 粒子系统
const particleSystem = new ParticleSystem(device, {
  maxParticles: 10000,
  emissionRate: 100
});
```

## 🎯 Demo导航

### 访问方式
1. **主页导航**: `http://localhost:3001/demo/index.html`
2. **直接访问**: `http://localhost:3001/demo/html/[demo-name].html`

### Demo分类
#### 🎯 基础功能 (12个Demo)
- triangle - 最小化渲染流程
- rotating-cube - 3D变换矩阵
- depth-test - 深度测试
- blend-modes - 混合模式

#### 🖼️ 纹理系统 (10个Demo)
- texture-2d - 基础纹理采样
- texture-filtering - 过滤模式
- texture-wrapping - 包裹模式
- cubemap-skybox - 立方体贴图

#### 🌟 高级渲染 (16个Demo)
- shadow-mapping - 阴影贴图
- particle-system - 粒子系统
- instancing - 实例化渲染
- pbr-material - PBR材质

## 🔗 原文档重定向

**原文件**: `/guides/demo-development.md`

**拆分完成时间**: 2025-12-17

**拆分理由**: 文档过大（60KB），内容涵盖多个技术领域，需要模块化管理以提升可读性和维护性。

## 📖 相关资源

### 技术文档
- [RHI API功能模块清单](./tools-library.md#rhi-api功能模块清单)
- [Demo开发规范](./demo-standards.md)
- [最佳实践指南](./best-practices.md)

### 外部资源
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [Three.js Documentation](https://threejs.org/docs/)
- [Learn OpenGL](https://learnopengl.com/)
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

# Demo开发指南

> **📁 从主文档拆分而来**: 原 `demo-development.md` (60KB, 1701行) 已拆分为5个专题文档

## 📚 文档结构

### 概览层
- **[概览](./overview.md)** - 系统架构和快速入门
- **[最佳实践指南](./best-practices.md)** - 优化技巧和故障排除

### 详细层
- **[Demo开发规范](./demo-standards.md)** - 编码规范和开发标准
- **[工具库使用指南](./tools-library.md)** - API文档和使用示例
- **[Demo目录和状态](./demo-catalog.md)** - 完整Demo目录和技术要点

## 🚀 快速开始

### 环境准备
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm --filter @maxellabs/rhi dev

# 访问Demo导航
http://localhost:3001/demo/index.html
```

### 创建新Demo
```typescript
import { DemoRunner, GeometryGenerator, OrbitController, Stats } from './utils';

export default class MyDemo {
  private runner: DemoRunner;

  constructor(canvas: HTMLCanvasElement) {
    this.runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'My Demo',
      clearColor: [0.1, 0.1, 0.1, 1.0],
    });
  }

  async init(): Promise<void> {
    await this.runner.init();
    this.setupScene();
    this.startRenderLoop();
  }
}
```

## 📊 开发状态

### 完成进度

| 层级 | Demo数量 | 完成状态 |
|------|----------|----------|
| **基础渲染** | 12 | ✅ 100% |
| **纹理系统** | 10 | ✅ 100% |
| **光照材质** | 10 | ✅ 100% |
| **高级渲染** | 6 | ✅ 100% |
| **总计** | **38** | **✅ 100%** |

### 最新更新 (2025-12-16)

#### 🎉 第四层高级渲染系统全部完成
- **✅ 阴影工具模块**: ShadowMap、PCFFilter、LightSpaceMatrix
- **✅ 粒子系统模块**: GPU实例化粒子系统
- **✅ 天空盒系统模块**: HDR环境贴图和IBL
- **✅ 实例化工具模块**: InstanceBuffer、InstancedRenderer
- **✅ PBR材质模块**: 基于物理的材质系统

## 🛠️ 核心工具库

### 已实现模块
- **核心框架**: DemoRunner、OrbitController、Stats
- **几何体生成**: 9种标准几何体
- **纹理工具**: TextureLoader、CubemapGenerator、ProceduralTexture
- **渲染工具**: RenderTarget、ShaderUtils
- **高级系统**: 阴影、粒子、天空盒、PBR、后处理

### 工具库使用示例

```typescript
// 几何体生成
const geometry = GeometryGenerator.cube({ size: 1.0 });

// 纹理加载
const texture = await TextureLoader.load('texture.jpg', {
  flipY: true,
  generateMipmaps: true
});

// 阴影系统
const shadowMap = new ShadowMap(device, {
  resolution: 2048
});

// 粒子系统
const particleSystem = new ParticleSystem(device, {
  maxParticles: 10000,
  emissionRate: 100
});
```

## 🎯 Demo导航

### 访问方式
1. **主页导航**: `http://localhost:3001/demo/index.html`
2. **直接访问**: `http://localhost:3001/demo/html/[demo-name].html`

### Demo分类
#### 🎯 基础功能 (12个Demo)
- triangle - 最小化渲染流程
- rotating-cube - 3D变换矩阵
- depth-test - 深度测试
- blend-modes - 混合模式

#### 🖼️ 纹理系统 (10个Demo)
- texture-2d - 基础纹理采样
- texture-filtering - 过滤模式
- texture-wrapping - 包裹模式
- cubemap-skybox - 立方体贴图

#### 🌟 高级渲染 (16个Demo)
- shadow-mapping - 阴影贴图
- particle-system - 粒子系统
- instancing - 实例化渲染
- pbr-material - PBR材质

## 🔗 原文档重定向

**原文件**: `/guides/demo-development.md`

**拆分完成时间**: 2025-12-17

**拆分理由**: 文档过大（60KB），内容涵盖多个技术领域，需要模块化管理以提升可读性和维护性。

## 📖 相关资源

### 技术文档
- [RHI API功能模块清单](./tools-library.md#rhi-api功能模块清单)
- [Demo开发规范](./demo-standards.md)
- [最佳实践指南](./best-practices.md)

### 外部资源
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [Three.js Documentation](https://threejs.org/docs/)
- [Learn OpenGL](https://learnopengl.com/)
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

# Demo开发指南

> **📁 从主文档拆分而来**: 原 `demo-development.md` (60KB, 1701行) 已拆分为5个专题文档

## 📚 文档结构

### 概览层
- **[概览](./overview.md)** - 系统架构和快速入门
- **[最佳实践指南](./best-practices.md)** - 优化技巧和故障排除

### 详细层
- **[Demo开发规范](./demo-standards.md)** - 编码规范和开发标准
- **[工具库使用指南](./tools-library.md)** - API文档和使用示例
- **[Demo目录和状态](./demo-catalog.md)** - 完整Demo目录和技术要点

## 🚀 快速开始

### 环境准备
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm --filter @maxellabs/rhi dev

# 访问Demo导航
http://localhost:3001/demo/index.html
```

### 创建新Demo
```typescript
import { DemoRunner, GeometryGenerator, OrbitController, Stats } from './utils';

export default class MyDemo {
  private runner: DemoRunner;

  constructor(canvas: HTMLCanvasElement) {
    this.runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'My Demo',
      clearColor: [0.1, 0.1, 0.1, 1.0],
    });
  }

  async init(): Promise<void> {
    await this.runner.init();
    this.setupScene();
    this.startRenderLoop();
  }
}
```

## 📊 开发状态

### 完成进度

| 层级 | Demo数量 | 完成状态 |
|------|----------|----------|
| **基础渲染** | 12 | ✅ 100% |
| **纹理系统** | 10 | ✅ 100% |
| **光照材质** | 10 | ✅ 100% |
| **高级渲染** | 6 | ✅ 100% |
| **总计** | **38** | **✅ 100%** |

### 最新更新 (2025-12-16)

#### 🎉 第四层高级渲染系统全部完成
- **✅ 阴影工具模块**: ShadowMap、PCFFilter、LightSpaceMatrix
- **✅ 粒子系统模块**: GPU实例化粒子系统
- **✅ 天空盒系统模块**: HDR环境贴图和IBL
- **✅ 实例化工具模块**: InstanceBuffer、InstancedRenderer
- **✅ PBR材质模块**: 基于物理的材质系统

## 🛠️ 核心工具库

### 已实现模块
- **核心框架**: DemoRunner、OrbitController、Stats
- **几何体生成**: 9种标准几何体
- **纹理工具**: TextureLoader、CubemapGenerator、ProceduralTexture
- **渲染工具**: RenderTarget、ShaderUtils
- **高级系统**: 阴影、粒子、天空盒、PBR、后处理

### 工具库使用示例

```typescript
// 几何体生成
const geometry = GeometryGenerator.cube({ size: 1.0 });

// 纹理加载
const texture = await TextureLoader.load('texture.jpg', {
  flipY: true,
  generateMipmaps: true
});

// 阴影系统
const shadowMap = new ShadowMap(device, {
  resolution: 2048
});

// 粒子系统
const particleSystem = new ParticleSystem(device, {
  maxParticles: 10000,
  emissionRate: 100
});
```

## 🎯 Demo导航

### 访问方式
1. **主页导航**: `http://localhost:3001/demo/index.html`
2. **直接访问**: `http://localhost:3001/demo/html/[demo-name].html`

### Demo分类
#### 🎯 基础功能 (12个Demo)
- triangle - 最小化渲染流程
- rotating-cube - 3D变换矩阵
- depth-test - 深度测试
- blend-modes - 混合模式

#### 🖼️ 纹理系统 (10个Demo)
- texture-2d - 基础纹理采样
- texture-filtering - 过滤模式
- texture-wrapping - 包裹模式
- cubemap-skybox - 立方体贴图

#### 🌟 高级渲染 (16个Demo)
- shadow-mapping - 阴影贴图
- particle-system - 粒子系统
- instancing - 实例化渲染
- pbr-material - PBR材质

## 🔗 原文档重定向

**原文件**: `/guides/demo-development.md`

**拆分完成时间**: 2025-12-17

**拆分理由**: 文档过大（60KB），内容涵盖多个技术领域，需要模块化管理以提升可读性和维护性。

## 📖 相关资源

### 技术文档
- [RHI API功能模块清单](./tools-library.md#rhi-api功能模块清单)
- [Demo开发规范](./demo-standards.md)
- [最佳实践指南](./best-practices.md)

### 外部资源
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [Three.js Documentation](https://threejs.org/docs/)
- [Learn OpenGL](https://learnopengl.com/)
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

# Demo开发指南

> **📁 从主文档拆分而来**: 原 `demo-development.md` (60KB, 1701行) 已拆分为5个专题文档

## 📚 文档结构

### 概览层
- **[概览](./overview.md)** - 系统架构和快速入门
- **[最佳实践指南](./best-practices.md)** - 优化技巧和故障排除

### 详细层
- **[Demo开发规范](./demo-standards.md)** - 编码规范和开发标准
- **[工具库使用指南](./tools-library.md)** - API文档和使用示例
- **[Demo目录和状态](./demo-catalog.md)** - 完整Demo目录和技术要点

## 🚀 快速开始

### 环境准备
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm --filter @maxellabs/rhi dev

# 访问Demo导航
http://localhost:3001/demo/index.html
```

### 创建新Demo
```typescript
import { DemoRunner, GeometryGenerator, OrbitController, Stats } from './utils';

export default class MyDemo {
  private runner: DemoRunner;

  constructor(canvas: HTMLCanvasElement) {
    this.runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'My Demo',
      clearColor: [0.1, 0.1, 0.1, 1.0],
    });
  }

  async init(): Promise<void> {
    await this.runner.init();
    this.setupScene();
    this.startRenderLoop();
  }
}
```

## 📊 开发状态

### 完成进度

| 层级 | Demo数量 | 完成状态 |
|------|----------|----------|
| **基础渲染** | 12 | ✅ 100% |
| **纹理系统** | 10 | ✅ 100% |
| **光照材质** | 10 | ✅ 100% |
| **高级渲染** | 6 | ✅ 100% |
| **总计** | **38** | **✅ 100%** |

### 最新更新 (2025-12-16)

#### 🎉 第四层高级渲染系统全部完成
- **✅ 阴影工具模块**: ShadowMap、PCFFilter、LightSpaceMatrix
- **✅ 粒子系统模块**: GPU实例化粒子系统
- **✅ 天空盒系统模块**: HDR环境贴图和IBL
- **✅ 实例化工具模块**: InstanceBuffer、InstancedRenderer
- **✅ PBR材质模块**: 基于物理的材质系统

## 🛠️ 核心工具库

### 已实现模块
- **核心框架**: DemoRunner、OrbitController、Stats
- **几何体生成**: 9种标准几何体
- **纹理工具**: TextureLoader、CubemapGenerator、ProceduralTexture
- **渲染工具**: RenderTarget、ShaderUtils
- **高级系统**: 阴影、粒子、天空盒、PBR、后处理

### 工具库使用示例

```typescript
// 几何体生成
const geometry = GeometryGenerator.cube({ size: 1.0 });

// 纹理加载
const texture = await TextureLoader.load('texture.jpg', {
  flipY: true,
  generateMipmaps: true
});

// 阴影系统
const shadowMap = new ShadowMap(device, {
  resolution: 2048
});

// 粒子系统
const particleSystem = new ParticleSystem(device, {
  maxParticles: 10000,
  emissionRate: 100
});
```

## 🎯 Demo导航

### 访问方式
1. **主页导航**: `http://localhost:3001/demo/index.html`
2. **直接访问**: `http://localhost:3001/demo/html/[demo-name].html`

### Demo分类
#### 🎯 基础功能 (12个Demo)
- triangle - 最小化渲染流程
- rotating-cube - 3D变换矩阵
- depth-test - 深度测试
- blend-modes - 混合模式

#### 🖼️ 纹理系统 (10个Demo)
- texture-2d - 基础纹理采样
- texture-filtering - 过滤模式
- texture-wrapping - 包裹模式
- cubemap-skybox - 立方体贴图

#### 🌟 高级渲染 (16个Demo)
- shadow-mapping - 阴影贴图
- particle-system - 粒子系统
- instancing - 实例化渲染
- pbr-material - PBR材质

## 🔗 原文档重定向

**原文件**: `/guides/demo-development.md`

**拆分完成时间**: 2025-12-17

**拆分理由**: 文档过大（60KB），内容涵盖多个技术领域，需要模块化管理以提升可读性和维护性。

## 📖 相关资源

### 技术文档
- [RHI API功能模块清单](./tools-library.md#rhi-api功能模块清单)
- [Demo开发规范](./demo-standards.md)
- [最佳实践指南](./best-practices.md)

### 外部资源
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [Three.js Documentation](https://threejs.org/docs/)
- [Learn OpenGL](https://learnopengl.com/)