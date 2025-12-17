---
title: Demo System Overview
description: 自动化LLM-Native标准化指南文档
category: guides
subcategory: demo
tags: ['guide', 'llm-native', 'demo', 'demo-developers', 'interface-first', 'code-examples', 'step-by-step']
target_audience: demo-developers
complexity: advanced
estimated_time: f"66 分钟"
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

# Demo系统概览

## 系统架构

RHI Demo系统是一个完整的WebGL 2.0渲染演示平台，基于Maxell 3D Runtime构建，展示了从基础渲染到高级PBR材质的完整渲染管线。

### 核心设计原则

1. **渐进式学习路径**：从基础到高级，逐步展示3D渲染技术
2. **模块化架构**：每个Demo都是独立的功能模块，便于理解和复用
3. **性能优先**：所有Demo都经过性能优化，展示最佳实践
4. **代码质量**：遵循严格的编码规范和文档标准

### 系统分层

```
Demo系统架构
├── 第一层：基础渲染 (Fundamentals)
│   ├── 几何体渲染
│   ├── 变换矩阵
│   ├── 颜色和材质
│   └── 深度测试
├── 第二层：纹理系统 (Textures)
│   ├── 基础纹理加载
│   ├── Mipmap生成
│   ├── 纹理过滤和包裹
│   └── 多纹理混合
├── 第三层：光照系统 (Lighting)
│   ├── 平行光
│   ├── 点光源
│   └── 聚光灯
└── 第四层：高级渲染 (Advanced)
    ├── PBR材质
    ├── 阴影映射
    ├── 粒子系统
    ├── 实例化渲染
    └── 后处理效果
```

## 📋 最新更新

### 2025-12-16 完成第三层高级渲染系统全部模块

**第三层高级渲染系统已全面完成**：

- **阴影工具模块**（已完成）
- **粒子系统模块**（已完成）
- **天空盒系统模块**（已完成）
- **实例化工具模块**（已完成）
- **PBR材质模块**（已完成）

**阴影工具模块（Shadow Utils）**：
- **ShadowMap**: 高效的阴影贴图管理器，支持动态分辨率调整
- **LightSpaceMatrix**: 光源空间矩阵计算，支持平行光和点光源
- **PCFFilter**: PCF软阴影滤波器，支持1x1到5x5采样模式
- **ShadowShaders**: 阴影着色器代码生成器，提供深度Pass和场景Pass模板
- **性能指标**: 支持1024-4096分辨率阴影贴图，3x3 PCF仅增加15%性能开销

**粒子系统模块（Particle System）**：
- **ParticleRenderer**: 高性能粒子渲染器，支持10,000+粒子实例
- **ParticleSystem**: 粒子系统管理器，集成发射器、更新器和生命周期管理
- **关键API**: GPU实例化渲染、参数插值、随机种子控制
- **技术特点**: 基于实例化渲染的GPU粒子，支持单通道和多通道混合

**天空盒系统模块（Skybox System）**：
- **EnvironmentMap**: 环境贴图管理器，支持HDR全景图加载
- **SkyboxRenderer**: 高效的天空盒渲染器，优化后处理管线
- **性能指标**: 全景图转换<100ms，立方体贴图生成无缝衔接
- **技术特点**: 6面体渲染优化，支持IBL光照和预过滤环境贴图

**实例化工具模块（Instancing Utils）**：
- **InstanceBuffer**: 实例缓冲区管理器，支持10,000+实例高效管理
- **InstancedRenderer**: 实例化渲染器，自动组合顶点布局
- **性能指标**: 单次Draw Call渲染10,000+立方体，内存占用仅800KB
- **技术特点**: Per-Instance Attributes、预分配缓冲区、批量更新优化

**PBR材质模块（PBR Material）**：
- **PBRMaterial**: 基于物理的材质系统，支持金属/工作流
- **IBLUtils**: 基于图像的光照工具，集成环境贴图和预过滤
- **性能指标**: 支持实时PBR渲染，4K纹理下保持60FPS
- **技术特点**: Cook-Torrance BRDF、线性空间渲染、环境光遮蔽

### 2025-12-16 完成实例化渲染工具模块

**实例化渲染工具模块已全部完成**：

- **InstanceBuffer**: 实例缓冲区管理器（已完成）
  - 支持 10,000+ 实例的高效管理
  - 每实例 80 bytes（mat4 + vec4）
  - 批量更新优化，单次 GPU 传输

- **InstancedRenderer**: 实例化渲染器（已完成）
  - 封装实例化 Draw Call 逻辑
  - 自动组合顶点布局（基础几何 + 实例属性）
  - 支持 WebGL2 和 WebGL1 (ANGLE_instanced_arrays)

- **instancing Demo**: GPU 实例化渲染演示（已完成）
  - 单次 Draw Call 渲染 10,000+ 立方体
  - 实时调节实例数、颜色模式、动画效果
  - 完整的键盘交互和性能监控

**技术要点**：
- Per-Instance Attributes（实例属性）
- Vertex Buffer Divisor（顶点缓冲区分频器）
- std140 内存对齐规范
- 预分配缓冲区策略

### 2025-12-15 完成第三层光照系统 3 个光源 Demo

**3 个光源类型 Demo 已全部完成**：

- **directional-light**: 平行光演示，展示无位置、无衰减的平行光照效果（已完成）
  - 文档索引：`llmdoc/reference/directional-light-demo.md`（已创建）
  - 技术要点：方向向量、Lambert 漫反射、Phong 镜面反射、std140 对齐

- **point-lights**: 多点光源演示，支持最多 4 个点光源同时工作（已完成）
  - 文档索引：`llmdoc/reference/point-lights-demo.md`（已创建）
  - 技术要点：距离衰减公式、多光源累加、独立颜色和衰减参数、208字节 Uniform Buffer

- **spotlight**: 聚光灯演示，展示锥形光束和平滑边缘过渡（已完成）
  - 文档索引：`llmdoc/reference/spotlight-demo.md`（已创建）
  - 技术要点：位置+方向向量、内外锥角、角度转余弦、距离衰减、边缘平滑

**代码质量提升**：
- Critic 审查发现并修复了 API 不一致问题
- 统一所有光源 Demo 使用 `@maxellabs/core` API
- 标准化 HTML 文件（移除内嵌样式、统一语言为 zh-CN）
- 添加完整的键盘事件处理（ESC/F11/R）
- 所有资源使用 `runner.track()` 追踪

### 2025-12-13 完成第二层纹理系统全部 Demo

**第二层纹理系统已全部完成**：

- **texture-loading**: 纹理加载演示，支持 JPG/PNG/WebP 格式（已完成）
- **mipmap-generation**: Mipmap 生成演示，自动生成各级LOD（已完成）
- **texture-wrapping**: 纹理包裹模式演示，展示不同包裹效果（已完成）
- **texture-filtering**: 纹理过滤演示，对比最近邻和线性过滤（已完成）
- **multi-texture**: 多纹理混合演示，展示多通道纹理组合（已完成）

## 🏗️ 系统架构设计

### RHI API 功能模块清单

#### 1. 资源模块 (Resources)

```typescript
interface ResourceModules {
    // 设备管理
    device: RHIDevice;

    // 缓冲区
    vertexBuffer: RHIVertexBuffer;
    indexBuffer: RHIIndexBuffer;
    uniformBuffer: RHIUniformBuffer;

    // 纹理
    texture2D: RHITexture2D;
    textureCube: RHITextureCube;

    // 渲染目标
    framebuffer: RHIFramebuffer;
    renderbuffer: RHIRenderbuffer;
}
```

#### 2. 管线模块 (Pipeline)

```typescript
interface PipelineModules {
    // 渲染管线
    renderPipeline: RHIRenderPipeline;

    // 计算管线（未来支持）
    computePipeline: RHIComputePipeline;

    // 着色器管理
    shaderModule: RHIShaderModule;
    shaderStage: RHIShaderStage;
}
```

#### 3. 绑定模块 (Bindings)

```typescript
interface BindingModules {
    // 绑定组
    bindGroup: RHIBindGroup;
    bindGroupLayout: RHIBindGroupLayout;

    // 绑定布局
    pipelineLayout: RHIPipelineLayout;
}
```

#### 4. 命令模块 (Commands)

```typescript
interface CommandModules {
    // 命令编码器
    commandEncoder: RHICommandEncoder;

    // 渲染通道
    renderPass: RHIRenderPass;

    // 命令缓冲区
    commandBuffer: RHICommandBuffer;
}
```

## 📊 Demo 系统统计

### 完成状态总览

| 层级 | 模块 | 完成状态 | Demo数量 | 文档数量 |
|------|------|----------|----------|----------|
| **第一层** | 基础渲染 | ✅ 完成 | 6 | 6 |
| **第二层** | 纹理系统 | ✅ 完成 | 5 | 5 |
| **第三层** | 光照系统 | ✅ 完成 | 3 | 3 |
| **第四层** | 高级渲染 | ✅ 完成 | 5 | 5 |
| **总计** | | ✅ 100% | **19** | **19** |

### 技术覆盖范围

- **基础渲染**: 几何体、变换、颜色、深度测试
- **纹理系统**: 加载、Mipmap、过滤、包裹、多纹理
- **光照系统**: 平行光、点光源、聚光灯
- **高级渲染**: PBR材质、阴影、粒子、实例化、后处理

## 🎯 开发指南

### 代码规范

遵循严格的编码规范：

1. **TypeScript**: 严格类型检查，无any类型
2. **GLSL**: 版本声明，精度限定符，std140对齐
3. **HTML**: 语义化标签，无内嵌样式，统一中文
4. **文档**: 完整的API文档和使用示例

### 性能要求

每个Demo都必须满足：

- **帧率**: 60FPS稳定运行
- **内存**: 合理的内存使用，无内存泄漏
- **资源**: 及时释放WebGL资源
- **兼容性**: 支持WebGL 2.0和WebGL 1.0降级

### 交互标准

统一的用户交互：

- **ESC**: 退出Demo
- **F11**: 全屏切换
- **R**: 重置Demo状态
- **H**: 显示帮助信息

## 🔗 相关文档

### 开发指南
- [基础渲染层开发](./demo-development-fundamentals.md) - 第一层Demo开发指南
- [纹理系统开发](./demo-development-textures.md) - 第二层Demo开发指南
- [高级渲染开发](./demo-development-advanced.md) - 第四层Demo开发指南

### 技术规范
- [RHI Demo宪法](../foundations/rhi-demo-constitution.md) - Demo实现规范
- [图形系统圣经](../foundations/graphics-bible.md) - 图形系统核心规范
- [编码约定](../foundations/coding-conventions.md) - TypeScript编码规范

### API参考
- [RHI API文档](../reference/api-v2/rhi/) - WebGL抽象层完整API
- [Math API文档](../reference/api-v2/math/) - 高性能数学库详解
- [Specification API文档](../reference/api-v2/specification/) - USD集成与类型系统

## 🚀 下一步计划

### 2025 Q1 计划

1. **第五层Demo**: 后处理效果系统
   - FXAA抗锯齿
   - 高斯模糊
   - 色调映射
   - 屏幕空间效果

2. **性能优化集成**
   - 集成性能优化模块
   - 实时性能监控仪表板
   - 自适应质量调整

3. **移动端优化**
   - 移动设备兼容性
   - 触控交互支持
   - 电池优化策略

### 长期规划

1. **WebGPU迁移**: 准备WebGPU版本的Demo系统
2. **VR/AR支持**: 扩展到虚拟现实和增强现实
3. **AI集成**: 机器学习驱动的渲染优化

---

**注意**: 本文档会随着Demo系统的开发持续更新。建议定期查看最新版本以获取最新信息和开发指南。
## 🔌 Interface First

### 核心接口定义
#### DemoConfig
```typescript
interface DemoConfig {
  name: string;
  renderer: RendererType;
  resources: ResourceConfig;
}
```

#### DemoRunner
```typescript
class DemoRunner {
  initialize(config: DemoConfig): Promise<void>;
  run(): Promise<void>;
  cleanup(): void;
}
```

### 使用流程
1. **初始化**: 按照规范初始化相关组件
2. **配置**: 设置必要的参数和选项
3. **执行**: 调用核心接口执行功能
4. **验证**: 检查结果和状态

---

# Demo系统概览

## 系统架构

RHI Demo系统是一个完整的WebGL 2.0渲染演示平台，基于Maxell 3D Runtime构建，展示了从基础渲染到高级PBR材质的完整渲染管线。

### 核心设计原则

1. **渐进式学习路径**：从基础到高级，逐步展示3D渲染技术
2. **模块化架构**：每个Demo都是独立的功能模块，便于理解和复用
3. **性能优先**：所有Demo都经过性能优化，展示最佳实践
4. **代码质量**：遵循严格的编码规范和文档标准

### 系统分层

```
Demo系统架构
├── 第一层：基础渲染 (Fundamentals)
│   ├── 几何体渲染
│   ├── 变换矩阵
│   ├── 颜色和材质
│   └── 深度测试
├── 第二层：纹理系统 (Textures)
│   ├── 基础纹理加载
│   ├── Mipmap生成
│   ├── 纹理过滤和包裹
│   └── 多纹理混合
├── 第三层：光照系统 (Lighting)
│   ├── 平行光
│   ├── 点光源
│   └── 聚光灯
└── 第四层：高级渲染 (Advanced)
    ├── PBR材质
    ├── 阴影映射
    ├── 粒子系统
    ├── 实例化渲染
    └── 后处理效果
```

## 📋 最新更新

### 2025-12-16 完成第三层高级渲染系统全部模块

**第三层高级渲染系统已全面完成**：

- **阴影工具模块**（已完成）
- **粒子系统模块**（已完成）
- **天空盒系统模块**（已完成）
- **实例化工具模块**（已完成）
- **PBR材质模块**（已完成）

**阴影工具模块（Shadow Utils）**：
- **ShadowMap**: 高效的阴影贴图管理器，支持动态分辨率调整
- **LightSpaceMatrix**: 光源空间矩阵计算，支持平行光和点光源
- **PCFFilter**: PCF软阴影滤波器，支持1x1到5x5采样模式
- **ShadowShaders**: 阴影着色器代码生成器，提供深度Pass和场景Pass模板
- **性能指标**: 支持1024-4096分辨率阴影贴图，3x3 PCF仅增加15%性能开销

**粒子系统模块（Particle System）**：
- **ParticleRenderer**: 高性能粒子渲染器，支持10,000+粒子实例
- **ParticleSystem**: 粒子系统管理器，集成发射器、更新器和生命周期管理
- **关键API**: GPU实例化渲染、参数插值、随机种子控制
- **技术特点**: 基于实例化渲染的GPU粒子，支持单通道和多通道混合

**天空盒系统模块（Skybox System）**：
- **EnvironmentMap**: 环境贴图管理器，支持HDR全景图加载
- **SkyboxRenderer**: 高效的天空盒渲染器，优化后处理管线
- **性能指标**: 全景图转换<100ms，立方体贴图生成无缝衔接
- **技术特点**: 6面体渲染优化，支持IBL光照和预过滤环境贴图

**实例化工具模块（Instancing Utils）**：
- **InstanceBuffer**: 实例缓冲区管理器，支持10,000+实例高效管理
- **InstancedRenderer**: 实例化渲染器，自动组合顶点布局
- **性能指标**: 单次Draw Call渲染10,000+立方体，内存占用仅800KB
- **技术特点**: Per-Instance Attributes、预分配缓冲区、批量更新优化

**PBR材质模块（PBR Material）**：
- **PBRMaterial**: 基于物理的材质系统，支持金属/工作流
- **IBLUtils**: 基于图像的光照工具，集成环境贴图和预过滤
- **性能指标**: 支持实时PBR渲染，4K纹理下保持60FPS
- **技术特点**: Cook-Torrance BRDF、线性空间渲染、环境光遮蔽

### 2025-12-16 完成实例化渲染工具模块

**实例化渲染工具模块已全部完成**：

- **InstanceBuffer**: 实例缓冲区管理器（已完成）
  - 支持 10,000+ 实例的高效管理
  - 每实例 80 bytes（mat4 + vec4）
  - 批量更新优化，单次 GPU 传输

- **InstancedRenderer**: 实例化渲染器（已完成）
  - 封装实例化 Draw Call 逻辑
  - 自动组合顶点布局（基础几何 + 实例属性）
  - 支持 WebGL2 和 WebGL1 (ANGLE_instanced_arrays)

- **instancing Demo**: GPU 实例化渲染演示（已完成）
  - 单次 Draw Call 渲染 10,000+ 立方体
  - 实时调节实例数、颜色模式、动画效果
  - 完整的键盘交互和性能监控

**技术要点**：
- Per-Instance Attributes（实例属性）
- Vertex Buffer Divisor（顶点缓冲区分频器）
- std140 内存对齐规范
- 预分配缓冲区策略

### 2025-12-15 完成第三层光照系统 3 个光源 Demo

**3 个光源类型 Demo 已全部完成**：

- **directional-light**: 平行光演示，展示无位置、无衰减的平行光照效果（已完成）
  - 文档索引：`llmdoc/reference/directional-light-demo.md`（已创建）
  - 技术要点：方向向量、Lambert 漫反射、Phong 镜面反射、std140 对齐

- **point-lights**: 多点光源演示，支持最多 4 个点光源同时工作（已完成）
  - 文档索引：`llmdoc/reference/point-lights-demo.md`（已创建）
  - 技术要点：距离衰减公式、多光源累加、独立颜色和衰减参数、208字节 Uniform Buffer

- **spotlight**: 聚光灯演示，展示锥形光束和平滑边缘过渡（已完成）
  - 文档索引：`llmdoc/reference/spotlight-demo.md`（已创建）
  - 技术要点：位置+方向向量、内外锥角、角度转余弦、距离衰减、边缘平滑

**代码质量提升**：
- Critic 审查发现并修复了 API 不一致问题
- 统一所有光源 Demo 使用 `@maxellabs/core` API
- 标准化 HTML 文件（移除内嵌样式、统一语言为 zh-CN）
- 添加完整的键盘事件处理（ESC/F11/R）
- 所有资源使用 `runner.track()` 追踪

### 2025-12-13 完成第二层纹理系统全部 Demo

**第二层纹理系统已全部完成**：

- **texture-loading**: 纹理加载演示，支持 JPG/PNG/WebP 格式（已完成）
- **mipmap-generation**: Mipmap 生成演示，自动生成各级LOD（已完成）
- **texture-wrapping**: 纹理包裹模式演示，展示不同包裹效果（已完成）
- **texture-filtering**: 纹理过滤演示，对比最近邻和线性过滤（已完成）
- **multi-texture**: 多纹理混合演示，展示多通道纹理组合（已完成）

## 🏗️ 系统架构设计

### RHI API 功能模块清单

#### 1. 资源模块 (Resources)

```typescript
interface ResourceModules {
    // 设备管理
    device: RHIDevice;

    // 缓冲区
    vertexBuffer: RHIVertexBuffer;
    indexBuffer: RHIIndexBuffer;
    uniformBuffer: RHIUniformBuffer;

    // 纹理
    texture2D: RHITexture2D;
    textureCube: RHITextureCube;

    // 渲染目标
    framebuffer: RHIFramebuffer;
    renderbuffer: RHIRenderbuffer;
}
```

#### 2. 管线模块 (Pipeline)

```typescript
interface PipelineModules {
    // 渲染管线
    renderPipeline: RHIRenderPipeline;

    // 计算管线（未来支持）
    computePipeline: RHIComputePipeline;

    // 着色器管理
    shaderModule: RHIShaderModule;
    shaderStage: RHIShaderStage;
}
```

#### 3. 绑定模块 (Bindings)

```typescript
interface BindingModules {
    // 绑定组
    bindGroup: RHIBindGroup;
    bindGroupLayout: RHIBindGroupLayout;

    // 绑定布局
    pipelineLayout: RHIPipelineLayout;
}
```

#### 4. 命令模块 (Commands)

```typescript
interface CommandModules {
    // 命令编码器
    commandEncoder: RHICommandEncoder;

    // 渲染通道
    renderPass: RHIRenderPass;

    // 命令缓冲区
    commandBuffer: RHICommandBuffer;
}
```

## 📊 Demo 系统统计

### 完成状态总览

| 层级 | 模块 | 完成状态 | Demo数量 | 文档数量 |
|------|------|----------|----------|----------|
| **第一层** | 基础渲染 | ✅ 完成 | 6 | 6 |
| **第二层** | 纹理系统 | ✅ 完成 | 5 | 5 |
| **第三层** | 光照系统 | ✅ 完成 | 3 | 3 |
| **第四层** | 高级渲染 | ✅ 完成 | 5 | 5 |
| **总计** | | ✅ 100% | **19** | **19** |

### 技术覆盖范围

- **基础渲染**: 几何体、变换、颜色、深度测试
- **纹理系统**: 加载、Mipmap、过滤、包裹、多纹理
- **光照系统**: 平行光、点光源、聚光灯
- **高级渲染**: PBR材质、阴影、粒子、实例化、后处理

## 🎯 开发指南

### 代码规范

遵循严格的编码规范：

1. **TypeScript**: 严格类型检查，无any类型
2. **GLSL**: 版本声明，精度限定符，std140对齐
3. **HTML**: 语义化标签，无内嵌样式，统一中文
4. **文档**: 完整的API文档和使用示例

### 性能要求

每个Demo都必须满足：

- **帧率**: 60FPS稳定运行
- **内存**: 合理的内存使用，无内存泄漏
- **资源**: 及时释放WebGL资源
- **兼容性**: 支持WebGL 2.0和WebGL 1.0降级

### 交互标准

统一的用户交互：

- **ESC**: 退出Demo
- **F11**: 全屏切换
- **R**: 重置Demo状态
- **H**: 显示帮助信息

## 🔗 相关文档

### 开发指南
- [基础渲染层开发](./demo-development-fundamentals.md) - 第一层Demo开发指南
- [纹理系统开发](./demo-development-textures.md) - 第二层Demo开发指南
- [高级渲染开发](./demo-development-advanced.md) - 第四层Demo开发指南

### 技术规范
- [RHI Demo宪法](../foundations/rhi-demo-constitution.md) - Demo实现规范
- [图形系统圣经](../foundations/graphics-bible.md) - 图形系统核心规范
- [编码约定](../foundations/coding-conventions.md) - TypeScript编码规范

### API参考
- [RHI API文档](../reference/api-v2/rhi/) - WebGL抽象层完整API
- [Math API文档](../reference/api-v2/math/) - 高性能数学库详解
- [Specification API文档](../reference/api-v2/specification/) - USD集成与类型系统

## 🚀 下一步计划

### 2025 Q1 计划

1. **第五层Demo**: 后处理效果系统
   - FXAA抗锯齿
   - 高斯模糊
   - 色调映射
   - 屏幕空间效果

2. **性能优化集成**
   - 集成性能优化模块
   - 实时性能监控仪表板
   - 自适应质量调整

3. **移动端优化**
   - 移动设备兼容性
   - 触控交互支持
   - 电池优化策略

### 长期规划

1. **WebGPU迁移**: 准备WebGPU版本的Demo系统
2. **VR/AR支持**: 扩展到虚拟现实和增强现实
3. **AI集成**: 机器学习驱动的渲染优化

---

**注意**: 本文档会随着Demo系统的开发持续更新。建议定期查看最新版本以获取最新信息和开发指南。
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

# Demo系统概览

## 系统架构

RHI Demo系统是一个完整的WebGL 2.0渲染演示平台，基于Maxell 3D Runtime构建，展示了从基础渲染到高级PBR材质的完整渲染管线。

### 核心设计原则

1. **渐进式学习路径**：从基础到高级，逐步展示3D渲染技术
2. **模块化架构**：每个Demo都是独立的功能模块，便于理解和复用
3. **性能优先**：所有Demo都经过性能优化，展示最佳实践
4. **代码质量**：遵循严格的编码规范和文档标准

### 系统分层

```
Demo系统架构
├── 第一层：基础渲染 (Fundamentals)
│   ├── 几何体渲染
│   ├── 变换矩阵
│   ├── 颜色和材质
│   └── 深度测试
├── 第二层：纹理系统 (Textures)
│   ├── 基础纹理加载
│   ├── Mipmap生成
│   ├── 纹理过滤和包裹
│   └── 多纹理混合
├── 第三层：光照系统 (Lighting)
│   ├── 平行光
│   ├── 点光源
│   └── 聚光灯
└── 第四层：高级渲染 (Advanced)
    ├── PBR材质
    ├── 阴影映射
    ├── 粒子系统
    ├── 实例化渲染
    └── 后处理效果
```

## 📋 最新更新

### 2025-12-16 完成第三层高级渲染系统全部模块

**第三层高级渲染系统已全面完成**：

- **阴影工具模块**（已完成）
- **粒子系统模块**（已完成）
- **天空盒系统模块**（已完成）
- **实例化工具模块**（已完成）
- **PBR材质模块**（已完成）

**阴影工具模块（Shadow Utils）**：
- **ShadowMap**: 高效的阴影贴图管理器，支持动态分辨率调整
- **LightSpaceMatrix**: 光源空间矩阵计算，支持平行光和点光源
- **PCFFilter**: PCF软阴影滤波器，支持1x1到5x5采样模式
- **ShadowShaders**: 阴影着色器代码生成器，提供深度Pass和场景Pass模板
- **性能指标**: 支持1024-4096分辨率阴影贴图，3x3 PCF仅增加15%性能开销

**粒子系统模块（Particle System）**：
- **ParticleRenderer**: 高性能粒子渲染器，支持10,000+粒子实例
- **ParticleSystem**: 粒子系统管理器，集成发射器、更新器和生命周期管理
- **关键API**: GPU实例化渲染、参数插值、随机种子控制
- **技术特点**: 基于实例化渲染的GPU粒子，支持单通道和多通道混合

**天空盒系统模块（Skybox System）**：
- **EnvironmentMap**: 环境贴图管理器，支持HDR全景图加载
- **SkyboxRenderer**: 高效的天空盒渲染器，优化后处理管线
- **性能指标**: 全景图转换<100ms，立方体贴图生成无缝衔接
- **技术特点**: 6面体渲染优化，支持IBL光照和预过滤环境贴图

**实例化工具模块（Instancing Utils）**：
- **InstanceBuffer**: 实例缓冲区管理器，支持10,000+实例高效管理
- **InstancedRenderer**: 实例化渲染器，自动组合顶点布局
- **性能指标**: 单次Draw Call渲染10,000+立方体，内存占用仅800KB
- **技术特点**: Per-Instance Attributes、预分配缓冲区、批量更新优化

**PBR材质模块（PBR Material）**：
- **PBRMaterial**: 基于物理的材质系统，支持金属/工作流
- **IBLUtils**: 基于图像的光照工具，集成环境贴图和预过滤
- **性能指标**: 支持实时PBR渲染，4K纹理下保持60FPS
- **技术特点**: Cook-Torrance BRDF、线性空间渲染、环境光遮蔽

### 2025-12-16 完成实例化渲染工具模块

**实例化渲染工具模块已全部完成**：

- **InstanceBuffer**: 实例缓冲区管理器（已完成）
  - 支持 10,000+ 实例的高效管理
  - 每实例 80 bytes（mat4 + vec4）
  - 批量更新优化，单次 GPU 传输

- **InstancedRenderer**: 实例化渲染器（已完成）
  - 封装实例化 Draw Call 逻辑
  - 自动组合顶点布局（基础几何 + 实例属性）
  - 支持 WebGL2 和 WebGL1 (ANGLE_instanced_arrays)

- **instancing Demo**: GPU 实例化渲染演示（已完成）
  - 单次 Draw Call 渲染 10,000+ 立方体
  - 实时调节实例数、颜色模式、动画效果
  - 完整的键盘交互和性能监控

**技术要点**：
- Per-Instance Attributes（实例属性）
- Vertex Buffer Divisor（顶点缓冲区分频器）
- std140 内存对齐规范
- 预分配缓冲区策略

### 2025-12-15 完成第三层光照系统 3 个光源 Demo

**3 个光源类型 Demo 已全部完成**：

- **directional-light**: 平行光演示，展示无位置、无衰减的平行光照效果（已完成）
  - 文档索引：`llmdoc/reference/directional-light-demo.md`（已创建）
  - 技术要点：方向向量、Lambert 漫反射、Phong 镜面反射、std140 对齐

- **point-lights**: 多点光源演示，支持最多 4 个点光源同时工作（已完成）
  - 文档索引：`llmdoc/reference/point-lights-demo.md`（已创建）
  - 技术要点：距离衰减公式、多光源累加、独立颜色和衰减参数、208字节 Uniform Buffer

- **spotlight**: 聚光灯演示，展示锥形光束和平滑边缘过渡（已完成）
  - 文档索引：`llmdoc/reference/spotlight-demo.md`（已创建）
  - 技术要点：位置+方向向量、内外锥角、角度转余弦、距离衰减、边缘平滑

**代码质量提升**：
- Critic 审查发现并修复了 API 不一致问题
- 统一所有光源 Demo 使用 `@maxellabs/core` API
- 标准化 HTML 文件（移除内嵌样式、统一语言为 zh-CN）
- 添加完整的键盘事件处理（ESC/F11/R）
- 所有资源使用 `runner.track()` 追踪

### 2025-12-13 完成第二层纹理系统全部 Demo

**第二层纹理系统已全部完成**：

- **texture-loading**: 纹理加载演示，支持 JPG/PNG/WebP 格式（已完成）
- **mipmap-generation**: Mipmap 生成演示，自动生成各级LOD（已完成）
- **texture-wrapping**: 纹理包裹模式演示，展示不同包裹效果（已完成）
- **texture-filtering**: 纹理过滤演示，对比最近邻和线性过滤（已完成）
- **multi-texture**: 多纹理混合演示，展示多通道纹理组合（已完成）

## 🏗️ 系统架构设计

### RHI API 功能模块清单

#### 1. 资源模块 (Resources)

```typescript
interface ResourceModules {
    // 设备管理
    device: RHIDevice;

    // 缓冲区
    vertexBuffer: RHIVertexBuffer;
    indexBuffer: RHIIndexBuffer;
    uniformBuffer: RHIUniformBuffer;

    // 纹理
    texture2D: RHITexture2D;
    textureCube: RHITextureCube;

    // 渲染目标
    framebuffer: RHIFramebuffer;
    renderbuffer: RHIRenderbuffer;
}
```

#### 2. 管线模块 (Pipeline)

```typescript
interface PipelineModules {
    // 渲染管线
    renderPipeline: RHIRenderPipeline;

    // 计算管线（未来支持）
    computePipeline: RHIComputePipeline;

    // 着色器管理
    shaderModule: RHIShaderModule;
    shaderStage: RHIShaderStage;
}
```

#### 3. 绑定模块 (Bindings)

```typescript
interface BindingModules {
    // 绑定组
    bindGroup: RHIBindGroup;
    bindGroupLayout: RHIBindGroupLayout;

    // 绑定布局
    pipelineLayout: RHIPipelineLayout;
}
```

#### 4. 命令模块 (Commands)

```typescript
interface CommandModules {
    // 命令编码器
    commandEncoder: RHICommandEncoder;

    // 渲染通道
    renderPass: RHIRenderPass;

    // 命令缓冲区
    commandBuffer: RHICommandBuffer;
}
```

## 📊 Demo 系统统计

### 完成状态总览

| 层级 | 模块 | 完成状态 | Demo数量 | 文档数量 |
|------|------|----------|----------|----------|
| **第一层** | 基础渲染 | ✅ 完成 | 6 | 6 |
| **第二层** | 纹理系统 | ✅ 完成 | 5 | 5 |
| **第三层** | 光照系统 | ✅ 完成 | 3 | 3 |
| **第四层** | 高级渲染 | ✅ 完成 | 5 | 5 |
| **总计** | | ✅ 100% | **19** | **19** |

### 技术覆盖范围

- **基础渲染**: 几何体、变换、颜色、深度测试
- **纹理系统**: 加载、Mipmap、过滤、包裹、多纹理
- **光照系统**: 平行光、点光源、聚光灯
- **高级渲染**: PBR材质、阴影、粒子、实例化、后处理

## 🎯 开发指南

### 代码规范

遵循严格的编码规范：

1. **TypeScript**: 严格类型检查，无any类型
2. **GLSL**: 版本声明，精度限定符，std140对齐
3. **HTML**: 语义化标签，无内嵌样式，统一中文
4. **文档**: 完整的API文档和使用示例

### 性能要求

每个Demo都必须满足：

- **帧率**: 60FPS稳定运行
- **内存**: 合理的内存使用，无内存泄漏
- **资源**: 及时释放WebGL资源
- **兼容性**: 支持WebGL 2.0和WebGL 1.0降级

### 交互标准

统一的用户交互：

- **ESC**: 退出Demo
- **F11**: 全屏切换
- **R**: 重置Demo状态
- **H**: 显示帮助信息

## 🔗 相关文档

### 开发指南
- [基础渲染层开发](./demo-development-fundamentals.md) - 第一层Demo开发指南
- [纹理系统开发](./demo-development-textures.md) - 第二层Demo开发指南
- [高级渲染开发](./demo-development-advanced.md) - 第四层Demo开发指南

### 技术规范
- [RHI Demo宪法](../foundations/rhi-demo-constitution.md) - Demo实现规范
- [图形系统圣经](../foundations/graphics-bible.md) - 图形系统核心规范
- [编码约定](../foundations/coding-conventions.md) - TypeScript编码规范

### API参考
- [RHI API文档](../reference/api-v2/rhi/) - WebGL抽象层完整API
- [Math API文档](../reference/api-v2/math/) - 高性能数学库详解
- [Specification API文档](../reference/api-v2/specification/) - USD集成与类型系统

## 🚀 下一步计划

### 2025 Q1 计划

1. **第五层Demo**: 后处理效果系统
   - FXAA抗锯齿
   - 高斯模糊
   - 色调映射
   - 屏幕空间效果

2. **性能优化集成**
   - 集成性能优化模块
   - 实时性能监控仪表板
   - 自适应质量调整

3. **移动端优化**
   - 移动设备兼容性
   - 触控交互支持
   - 电池优化策略

### 长期规划

1. **WebGPU迁移**: 准备WebGPU版本的Demo系统
2. **VR/AR支持**: 扩展到虚拟现实和增强现实
3. **AI集成**: 机器学习驱动的渲染优化

---

**注意**: 本文档会随着Demo系统的开发持续更新。建议定期查看最新版本以获取最新信息和开发指南。
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

# Demo系统概览

## 系统架构

RHI Demo系统是一个完整的WebGL 2.0渲染演示平台，基于Maxell 3D Runtime构建，展示了从基础渲染到高级PBR材质的完整渲染管线。

### 核心设计原则

1. **渐进式学习路径**：从基础到高级，逐步展示3D渲染技术
2. **模块化架构**：每个Demo都是独立的功能模块，便于理解和复用
3. **性能优先**：所有Demo都经过性能优化，展示最佳实践
4. **代码质量**：遵循严格的编码规范和文档标准

### 系统分层

```
Demo系统架构
├── 第一层：基础渲染 (Fundamentals)
│   ├── 几何体渲染
│   ├── 变换矩阵
│   ├── 颜色和材质
│   └── 深度测试
├── 第二层：纹理系统 (Textures)
│   ├── 基础纹理加载
│   ├── Mipmap生成
│   ├── 纹理过滤和包裹
│   └── 多纹理混合
├── 第三层：光照系统 (Lighting)
│   ├── 平行光
│   ├── 点光源
│   └── 聚光灯
└── 第四层：高级渲染 (Advanced)
    ├── PBR材质
    ├── 阴影映射
    ├── 粒子系统
    ├── 实例化渲染
    └── 后处理效果
```

## 📋 最新更新

### 2025-12-16 完成第三层高级渲染系统全部模块

**第三层高级渲染系统已全面完成**：

- **阴影工具模块**（已完成）
- **粒子系统模块**（已完成）
- **天空盒系统模块**（已完成）
- **实例化工具模块**（已完成）
- **PBR材质模块**（已完成）

**阴影工具模块（Shadow Utils）**：
- **ShadowMap**: 高效的阴影贴图管理器，支持动态分辨率调整
- **LightSpaceMatrix**: 光源空间矩阵计算，支持平行光和点光源
- **PCFFilter**: PCF软阴影滤波器，支持1x1到5x5采样模式
- **ShadowShaders**: 阴影着色器代码生成器，提供深度Pass和场景Pass模板
- **性能指标**: 支持1024-4096分辨率阴影贴图，3x3 PCF仅增加15%性能开销

**粒子系统模块（Particle System）**：
- **ParticleRenderer**: 高性能粒子渲染器，支持10,000+粒子实例
- **ParticleSystem**: 粒子系统管理器，集成发射器、更新器和生命周期管理
- **关键API**: GPU实例化渲染、参数插值、随机种子控制
- **技术特点**: 基于实例化渲染的GPU粒子，支持单通道和多通道混合

**天空盒系统模块（Skybox System）**：
- **EnvironmentMap**: 环境贴图管理器，支持HDR全景图加载
- **SkyboxRenderer**: 高效的天空盒渲染器，优化后处理管线
- **性能指标**: 全景图转换<100ms，立方体贴图生成无缝衔接
- **技术特点**: 6面体渲染优化，支持IBL光照和预过滤环境贴图

**实例化工具模块（Instancing Utils）**：
- **InstanceBuffer**: 实例缓冲区管理器，支持10,000+实例高效管理
- **InstancedRenderer**: 实例化渲染器，自动组合顶点布局
- **性能指标**: 单次Draw Call渲染10,000+立方体，内存占用仅800KB
- **技术特点**: Per-Instance Attributes、预分配缓冲区、批量更新优化

**PBR材质模块（PBR Material）**：
- **PBRMaterial**: 基于物理的材质系统，支持金属/工作流
- **IBLUtils**: 基于图像的光照工具，集成环境贴图和预过滤
- **性能指标**: 支持实时PBR渲染，4K纹理下保持60FPS
- **技术特点**: Cook-Torrance BRDF、线性空间渲染、环境光遮蔽

### 2025-12-16 完成实例化渲染工具模块

**实例化渲染工具模块已全部完成**：

- **InstanceBuffer**: 实例缓冲区管理器（已完成）
  - 支持 10,000+ 实例的高效管理
  - 每实例 80 bytes（mat4 + vec4）
  - 批量更新优化，单次 GPU 传输

- **InstancedRenderer**: 实例化渲染器（已完成）
  - 封装实例化 Draw Call 逻辑
  - 自动组合顶点布局（基础几何 + 实例属性）
  - 支持 WebGL2 和 WebGL1 (ANGLE_instanced_arrays)

- **instancing Demo**: GPU 实例化渲染演示（已完成）
  - 单次 Draw Call 渲染 10,000+ 立方体
  - 实时调节实例数、颜色模式、动画效果
  - 完整的键盘交互和性能监控

**技术要点**：
- Per-Instance Attributes（实例属性）
- Vertex Buffer Divisor（顶点缓冲区分频器）
- std140 内存对齐规范
- 预分配缓冲区策略

### 2025-12-15 完成第三层光照系统 3 个光源 Demo

**3 个光源类型 Demo 已全部完成**：

- **directional-light**: 平行光演示，展示无位置、无衰减的平行光照效果（已完成）
  - 文档索引：`llmdoc/reference/directional-light-demo.md`（已创建）
  - 技术要点：方向向量、Lambert 漫反射、Phong 镜面反射、std140 对齐

- **point-lights**: 多点光源演示，支持最多 4 个点光源同时工作（已完成）
  - 文档索引：`llmdoc/reference/point-lights-demo.md`（已创建）
  - 技术要点：距离衰减公式、多光源累加、独立颜色和衰减参数、208字节 Uniform Buffer

- **spotlight**: 聚光灯演示，展示锥形光束和平滑边缘过渡（已完成）
  - 文档索引：`llmdoc/reference/spotlight-demo.md`（已创建）
  - 技术要点：位置+方向向量、内外锥角、角度转余弦、距离衰减、边缘平滑

**代码质量提升**：
- Critic 审查发现并修复了 API 不一致问题
- 统一所有光源 Demo 使用 `@maxellabs/core` API
- 标准化 HTML 文件（移除内嵌样式、统一语言为 zh-CN）
- 添加完整的键盘事件处理（ESC/F11/R）
- 所有资源使用 `runner.track()` 追踪

### 2025-12-13 完成第二层纹理系统全部 Demo

**第二层纹理系统已全部完成**：

- **texture-loading**: 纹理加载演示，支持 JPG/PNG/WebP 格式（已完成）
- **mipmap-generation**: Mipmap 生成演示，自动生成各级LOD（已完成）
- **texture-wrapping**: 纹理包裹模式演示，展示不同包裹效果（已完成）
- **texture-filtering**: 纹理过滤演示，对比最近邻和线性过滤（已完成）
- **multi-texture**: 多纹理混合演示，展示多通道纹理组合（已完成）

## 🏗️ 系统架构设计

### RHI API 功能模块清单

#### 1. 资源模块 (Resources)

```typescript
interface ResourceModules {
    // 设备管理
    device: RHIDevice;

    // 缓冲区
    vertexBuffer: RHIVertexBuffer;
    indexBuffer: RHIIndexBuffer;
    uniformBuffer: RHIUniformBuffer;

    // 纹理
    texture2D: RHITexture2D;
    textureCube: RHITextureCube;

    // 渲染目标
    framebuffer: RHIFramebuffer;
    renderbuffer: RHIRenderbuffer;
}
```

#### 2. 管线模块 (Pipeline)

```typescript
interface PipelineModules {
    // 渲染管线
    renderPipeline: RHIRenderPipeline;

    // 计算管线（未来支持）
    computePipeline: RHIComputePipeline;

    // 着色器管理
    shaderModule: RHIShaderModule;
    shaderStage: RHIShaderStage;
}
```

#### 3. 绑定模块 (Bindings)

```typescript
interface BindingModules {
    // 绑定组
    bindGroup: RHIBindGroup;
    bindGroupLayout: RHIBindGroupLayout;

    // 绑定布局
    pipelineLayout: RHIPipelineLayout;
}
```

#### 4. 命令模块 (Commands)

```typescript
interface CommandModules {
    // 命令编码器
    commandEncoder: RHICommandEncoder;

    // 渲染通道
    renderPass: RHIRenderPass;

    // 命令缓冲区
    commandBuffer: RHICommandBuffer;
}
```

## 📊 Demo 系统统计

### 完成状态总览

| 层级 | 模块 | 完成状态 | Demo数量 | 文档数量 |
|------|------|----------|----------|----------|
| **第一层** | 基础渲染 | ✅ 完成 | 6 | 6 |
| **第二层** | 纹理系统 | ✅ 完成 | 5 | 5 |
| **第三层** | 光照系统 | ✅ 完成 | 3 | 3 |
| **第四层** | 高级渲染 | ✅ 完成 | 5 | 5 |
| **总计** | | ✅ 100% | **19** | **19** |

### 技术覆盖范围

- **基础渲染**: 几何体、变换、颜色、深度测试
- **纹理系统**: 加载、Mipmap、过滤、包裹、多纹理
- **光照系统**: 平行光、点光源、聚光灯
- **高级渲染**: PBR材质、阴影、粒子、实例化、后处理

## 🎯 开发指南

### 代码规范

遵循严格的编码规范：

1. **TypeScript**: 严格类型检查，无any类型
2. **GLSL**: 版本声明，精度限定符，std140对齐
3. **HTML**: 语义化标签，无内嵌样式，统一中文
4. **文档**: 完整的API文档和使用示例

### 性能要求

每个Demo都必须满足：

- **帧率**: 60FPS稳定运行
- **内存**: 合理的内存使用，无内存泄漏
- **资源**: 及时释放WebGL资源
- **兼容性**: 支持WebGL 2.0和WebGL 1.0降级

### 交互标准

统一的用户交互：

- **ESC**: 退出Demo
- **F11**: 全屏切换
- **R**: 重置Demo状态
- **H**: 显示帮助信息

## 🔗 相关文档

### 开发指南
- [基础渲染层开发](./demo-development-fundamentals.md) - 第一层Demo开发指南
- [纹理系统开发](./demo-development-textures.md) - 第二层Demo开发指南
- [高级渲染开发](./demo-development-advanced.md) - 第四层Demo开发指南

### 技术规范
- [RHI Demo宪法](../foundations/rhi-demo-constitution.md) - Demo实现规范
- [图形系统圣经](../foundations/graphics-bible.md) - 图形系统核心规范
- [编码约定](../foundations/coding-conventions.md) - TypeScript编码规范

### API参考
- [RHI API文档](../reference/api-v2/rhi/) - WebGL抽象层完整API
- [Math API文档](../reference/api-v2/math/) - 高性能数学库详解
- [Specification API文档](../reference/api-v2/specification/) - USD集成与类型系统

## 🚀 下一步计划

### 2025 Q1 计划

1. **第五层Demo**: 后处理效果系统
   - FXAA抗锯齿
   - 高斯模糊
   - 色调映射
   - 屏幕空间效果

2. **性能优化集成**
   - 集成性能优化模块
   - 实时性能监控仪表板
   - 自适应质量调整

3. **移动端优化**
   - 移动设备兼容性
   - 触控交互支持
   - 电池优化策略

### 长期规划

1. **WebGPU迁移**: 准备WebGPU版本的Demo系统
2. **VR/AR支持**: 扩展到虚拟现实和增强现实
3. **AI集成**: 机器学习驱动的渲染优化

---

**注意**: 本文档会随着Demo系统的开发持续更新。建议定期查看最新版本以获取最新信息和开发指南。