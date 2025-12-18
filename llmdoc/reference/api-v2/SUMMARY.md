# API v2 文档结构索引

## 📚 目录结构

```
api-v2/
├── overview.md                    # 总览和快速开始
├── README.md                      # 主导航文档
├── SUMMARY.md                     # 本文件 - 文档索引
│
├── core/                          # Core - 核心基础组件
│   ├── index.md                   # 核心模块概览
│   ├── ioc-container.md           # 依赖注入容器（线程安全）
│   ├── canvas-wrapper.md          # Canvas包装器（浏览器验证）
│   ├── event-dispatcher.md        # 事件分发器（优先级系统）
│   └── transform-component.md     # 变换组件（递归防护）
│
├── rhi/                           # RHI - 渲染硬件接口
│   ├── index.md                   # RHI主文档
│   ├── examples/                  # 示例代码
│   │   └── basic-triangle.md      # 基础三角形渲染
│   ├── resources/                 # 资源管理（待创建）
│   ├── commands/                  # 命令系统（待创建）
│   └── pipeline/                  # 渲染管线（待创建）
│
├── math/                          # Math - 数学运算库
│   ├── index.md                   # Math主文档
│   ├── examples/                  # 示例代码
│   │   └── transform-hierarchy.md # 变换层级示例
│   ├── core-types/                # 核心类型（待创建）
│   ├── geometry/                  # 几何体操作（待创建）
│   └── performance/               # 性能优化（待创建）
│
└── specification/                 # Specification - 数据规范
    ├── index.md                   # Specification主文档
    ├── examples/                  # 示例代码
    │   └── asset-pipeline.md      # 资产管道示例
    ├── core-types/                # 核心类型（待创建）
    ├── animation/                 # 动画系统（待创建）
    └── rendering/                 # 渲染规范（待创建）
```

## 🎯 快速查找

### 按主题查找

#### 核心组件
- [核心模块概览](./core/) - 基础组件系统
- [IOC容器](./core/ioc-container.md) - 依赖注入与线程安全
- [事件系统](./core/event-dispatcher.md) - 优先级事件分发
- [变换组件](./core/transform-component.md) - 层级变换管理

#### 渲染基础
- [RHI概述](./rhi/) - 渲染硬件接口介绍
- [基础三角形](./rhi/examples/basic-triangle.md) - 最简单的渲染示例
- [渲染管线](./rhi/pipeline/) - 图形管线配置

#### 数学运算
- [Math库概述](./math/) - 数学库介绍
- [向量矩阵](./math/core-types/) - Vec2/3/4, Mat3/4详解
- [变换层级](./math/examples/transform-hierarchy.md) - 3D场景变换

#### 系统架构
- [数据规范](./specification/) - 核心数据结构
- [资产管道](./specification/examples/asset-pipeline.md) - 资源管理系统
- [动画系统](./specification/animation/) - 动画和骨骼

### 按难度查找

#### 初级
1. [API总览](./overview.md) - 了解整体架构
2. [核心组件](./core/) - IOC、事件、变换基础
3. [向量运算](./math/core-types/vec3.md) - 3D数学基础
4. [基础三角形](./rhi/examples/basic-triangle.md) - 第一个渲染程序

#### 中级
1. [纹理渲染](./rhi/examples/textured-quad.md) - 添加纹理
2. [变换动画](./math/examples/transform-animation.md) - 物体动画
3. [材质系统](./specification/rendering/material.md) - PBR材质

#### 高级
1. [实例化渲染](./rhi/examples/instanced-rendering.md) - 批量优化
2. [骨骼动画](./specification/animation/skeletal-animation.md) - 角色动画
3. [资产管道](./specification/examples/asset-pipeline.md) - 资源管理

### 按功能查找

#### 核心系统
- 依赖注入 → [Core/IOC](./core/ioc-container.md) - 线程安全容器
- 事件通信 → [Core/事件](./core/event-dispatcher.md) - 优先级系统
- 场景层次 → [Core/变换](./core/transform-component.md) - 变换层级
- 浏览器验证 → [Core/画布](./core/canvas-wrapper.md) - 环境检查

#### 资源管理
- Buffer管理 → [RHI/资源](./rhi/resources/buffer.md)
- Texture管理 → [RHI/资源](./rhi/resources/texture.md)
- 资产加载 → [Specification/示例](./specification/examples/asset-pipeline.md)

#### 渲染功能
- 基础绘制 → [RHI/示例](./rhi/examples/basic-triangle.md)
- 深度测试 → [RHI/示例](./rhi/examples/depth-buffer.md)
- 阴影映射 → [RHI/示例](./rhi/examples/shadow-mapping.md)

#### 数学功能
- 向量运算 → [Math/核心类型](./math/core-types/)
- 矩阵变换 → [Math/示例](./math/examples/transform-hierarchy.md)
- 几何查询 → [Math/几何体](./math/geometry/)

#### 动画功能
- 关键帧动画 → [Specification/动画](./specification/animation/keyframe.md)
- 骨骼系统 → [Specification/动画](./specification/animation/skeletal-animation.md)
- 动画混合 → [Specification/动画](./specification/animation/animation-blending.md)

## 🚀 学习路径

### 路径1：渲染开发者（3个月）
```
Week 1-2:  overview.md + rhi/examples/basic-triangle.md
Week 3-4:  math/core-types/ + math/examples/transform-hierarchy.md
Week 5-6:  rhi/resources/ + rhi/commands/
Week 7-8:  specification/rendering/material.md
Week 9-10: rhi/pipeline/ + rhi/examples/shadow-mapping.md
Week 11-12: 完整项目实践
```

### 路径2：引擎开发者（6个月）
```
Month 1:  所有基础文档
Month 2:  specification/core-types/ + math/geometry/
Month 3:  specification/animation/ + rhi/pipeline/
Month 4:  specification/examples/asset-pipeline.md
Month 5:  性能优化和高级特性
Month 6:  系统集成和最佳实践
```

### 路径3：应用开发者（1个月）
```
Week 1:  overview.md + 快速示例
Week 2:  Math基础 + 简单变换
Week 3:  RHI基础渲染
Week 4:  完整应用开发
```

## 📖 待完善文档

### Core模块（已完成）
- ✅ [x] core/index.md - 核心模块概览与导航
- ✅ [x] core/architecture.md - **系统架构设计**（全新）
- ✅ [x] core/max-object.md - 引擎对象基类（唯一ID、生命周期）
- ✅ [x] core/refer-resource.md - 资源引用计数（自动管理）
- ✅ [x] core/entity.md - 实体类（组件容器、场景层级）
- ✅ [x] core/component.md - 组件基类（生命周期管理）
- ✅ [x] core/event.md - 事件对象（数据载体）
- ✅ [x] core/event-dispatcher.md - 事件分发器（优先级系统）
- ✅ [x] core/object-pool.md - 对象池（通用复用）
- ✅ [x] core/object-pool-manager.md - 池管理器（集中监控）
- ✅ [x] core/time.md - 时间管理（delta、缩放）
- ✅ [x] core/ioc-container.md - 依赖注入容器（线程安全）
- ✅ [x] core/canvas-wrapper.md - Canvas包装器（浏览器验证）
- ✅ [x] core/transform-component.md - 变换组件（层级管理）

### RHI模块
- [ ] rhi/device.md - 设备管理详解
- [ ] rhi/resources/buffer.md - Buffer使用指南
- [ ] rhi/resources/texture.md - Texture使用指南
- [ ] rhi/commands/command-buffer.md - 命令缓冲区
- [ ] rhi/commands/render-pass.md - 渲染通道
- [ ] rhi/pipeline/compute-pipeline.md - 计算管线
- [ ] rhi/examples/textured-quad.md - 纹理四边形
- [ ] rhi/examples/depth-buffer.md - 深度缓冲
- [ ] rhi/examples/instanced-rendering.md - 实例化渲染
- [ ] rhi/examples/shadow-mapping.md - 阴影映射

### Math模块
- [ ] math/core-types/vec2.md - Vec2详细说明
- [ ] math/core-types/vec3.md - Vec3详细说明
- [ ] math/core-types/vec4.md - Vec4详细说明
- [ ] math/core-types/mat3.md - Mat3详细说明
- [ ] math/core-types/mat4.md - Mat4详细说明
- [ ] math/core-types/quat.md - Quat详细说明
- [ ] math/geometry/bounding-box.md - 包围盒
- [ ] math/geometry/ray.md - 射线
- [ ] math/geometry/plane.md - 平面
- [ ] math/geometry/sphere.md - 球体
- [ ] math/performance/object-pool.md - 对象池优化
- [ ] math/performance/simd.md - SIMD优化
- [ ] math/performance/batch-operations.md - 批量运算
- [ ] math/examples/transform-animation.md - 变换动画
- [ ] math/examples/collision-detection.md - 碰撞检测
- [ ] math/examples/spatial-partitioning.md - 空间分割

### Specification模块
- [ ] specification/core-types/frame.md - 帧结构
- [ ] specification/core-types/material.md - 材质基础
- [ ] specification/core-types/transform.md - 变换定义
- [ ] specification/animation/keyframe.md - 关键帧动画
- [ ] specification/animation/skeletal-animation.md - 骨骼动画
- [ ] specification/animation/animation-blending.md - 动画混合
- [ ] specification/animation/state-machine.md - 动画状态机
- [ ] specification/rendering/pipeline.md - 渲染管线
- [ ] specification/rendering/material-system.md - 材质系统
- [ ] specification/rendering/lighting.md - 光照系统
- [ ] specification/rendering/shadows.md - 阴影系统
- [ ] specification/examples/usd-integration.md - USD集成
- [ ] specification/examples/scene-graph.md - 场景图
- [ ] specification/examples/serialization.md - 序列化

## 🔗 相关资源

### 内部链接
- [上一级文档](../README.md)
- [架构指南](../architecture/)
- [教程集合](../guides/)
- [示例演示](../../demos/)

### 外部资源
- [WebGL2 规范](https://www.khronos.org/registry/webgl/specs/latest/2.0/)
- [WebGPU 规范](https://gpuweb.github.io/gpuweb/)
- [glTF 规范](https://github.com/KhronosGroup/glTF)
- [USD 规范](https://graphics.pixar.com/usd/release/index.html)

## 📝 贡献指南

想要贡献文档？

1. 查看待完善列表
2. 选择一个主题
3. 遵循现有格式
4. 包含代码示例
5. 提交Pull Request

文档模板：
```markdown
# 标题

## 概述
简要说明

## 代码示例
```typescript
// 可运行的代码
```

## 关键概念
- 概念1
- 概念2

## 相关链接
- [相关文档](path/to/doc.md)
```

## 📊 文档统计

- 总文档数：35+
- 已完成：
  - Core模块：13个文档（包含所有基础架构：对象、实体、组件、事件、池、时间、IOC、Canvas、变换）
  - RHI示例：1个文档
  - Math示例：1个文档
  - Specification示例：1个文档
  - 概览文档：2个（API总览、SUMMARY）
- 进行中：RHI完整模块
- 待开始：Math、Specification完整模块

### Core文档完整性验证
**总源文件：14个** | **生成文档：14个（含架构文档）**

| 源文件 | 文档 | 类型 | 状态 |
|--------|------|------|------|
| max-object.ts | max-object.md | reference | ✅ |
| component.ts | component.md | reference | ✅ |
| entity.ts | entity.md | reference | ✅ |
| event.ts | event.md | reference | ✅ |
| event-dispatcher.ts | event-dispatcher.md | reference | ✅ |
| object-pool.ts | object-pool.md | reference | ✅ |
| object-pool-manager.ts | object-pool-manager.md | reference | ✅ |
| refer-resource.ts | refer-resource.md | reference | ✅ |
| time.ts | time.md | reference | ✅ |
| index.ts | index.md | reference | ✅ |
| IOC.ts | ioc-container.md | reference | ✅ |
| canvas.ts | canvas-wrapper.md | reference | ✅ |
| transform.ts | transform-component.md | reference | ✅ |
| N/A (conceptual) | architecture.md | architecture | ✅ |

### 更新亮点（2025-12-18）
1. **完整性**：所有13个核心模块已全部标准化文档化
2. **新增架构文档**：system-architecture.md 提供完整集成视图
3. **双向链接**：每个文档有清晰的依赖图和相关文档
4. **LLM-Native**：所有文档遵循标准（YAML frontmatter、pseudocode、类型优先）
5. **质量保证**：包含负约束、性能分析、调试指南

版本：2.0.0（文档集）
最后更新：2025-12-18