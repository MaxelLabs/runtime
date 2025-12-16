# 参考文档索引

## 概述

本目录包含RHI渲染系统的所有参考文档，为开发者提供详细的技术规范和使用指南。

## 文档分类

### 核心系统
- [graphics-bible.md](./graphics-bible.md) - 图形渲染核心规范和最佳实践
- [rhi-demo-constitution.md](./rhi-demo-constitution.md) - RHI演示系统架构和约定
- [technical-debt.md](./technical-debt.md) - 技术债务记录和解决方案

### 材质与光照系统
- [pbr-material-system.md](./pbr-material-system.md) - 基于物理的渲染（PBR）材质系统
- [phong-lighting-demo.md](./phong-lighting-demo.md) - Phong光照模型演示
- [flat-shading-demo.md](./flat-shading-demo.md) - 平面着色演示
- [gouraud-shading-demo.md](./gouraud-shading-demo.md) - 高洛德着色演示

### 光源系统
- [directional-light-demo.md](./directional-light-demo.md) - 平行光（方向光）演示
- [point-lights-demo.md](./point-lights-demo.md) - 点光源演示
- [spotlight-demo.md](./spotlight-demo.md) - 聚光灯演示

### 阴影系统
- [shadow-tools.md](./shadow-tools.md) - 阴影工具系统参考
- [shadow-mapping-demo.md](./shadow-mapping-demo.md) - 阴影贴图演示

### 环境渲染
- [skybox-system.md](./skybox-system.md) - 天空盒系统参考
- [cubemap-skybox-demo.md](./cubemap-skybox-demo.md) - 立方体贴图天空盒演示
- [environment-map-demo.md](./environment-map-demo.md) - 环境映射演示

### 粒子系统
- [particle-system.md](./particle-system.md) - 粒子系统参考

### 几何渲染
- [instancing-tools.md](./instancing-tools.md) - 实例化渲染工具
- [instancing-demo.md](./instancing-demo.md) - 实例化渲染演示
- [frustum-culling-demo.md](./frustum-culling-demo.md) - 视锥体剔除演示

### 纹理系统
- [compressed-texture-demo.md](./compressed-texture-demo.md) - 压缩纹理演示
- [procedural-texture-demo.md](./procedural-texture-demo.md) - 程序化纹理演示
- [texture-array-demo.md](./texture-array-demo.md) - 纹理数组演示
- [render-to-texture-demo.md](./render-to-texture-demo.md) - 渲染到纹理演示

## 快速导航

### 新手入门
1. 首先阅读 [graphics-bible.md](./graphics-bible.md) 了解核心概念
2. 查看 [rhi-demo-constitution.md](./rhi-demo-constitution.md) 熟悉系统架构
3. 从基础演示开始：[flat-shading-demo.md](./flat-shading-demo.md)

### 高级特性
- PBR渲染：[pbr-material-system.md](./pbr-material-system.md)
- 实时阴影：[shadow-tools.md](./shadow-tools.md)
- 粒子特效：[particle-system.md](./particle-system.md)
- 环境渲染：[skybox-system.md](./skybox-system.md)

### 性能优化
- 实例化渲染：[instancing-tools.md](./instancing-tools.md)
- 视锥体剔除：[frustum-culling-demo.md](./frustum-culling-demo.md)
- 技术债务：[technical-debt.md](./technical-debt.md)

## 文档模板

所有参考文档应遵循 ContentFormat_Reference 模板：

```markdown
# [模块名称]
## Identity
模块路径: packages/rhi/demo/src/utils/[模块]/
核心类: [主要类列表]
## Core Summary
[功能概述]
## Source of Truth
策略文档: llmdoc/agent/strategy-[模块].md
## Key Features
- [功能列表]
## Usage Example
[使用示例]
## Performance Notes
[性能说明]
```

## 维护指南

1. **添加新文档**：
   - 使用标准模板格式
   - 更新本索引文件
   - 确保技术准确性

2. **更新现有文档**：
   - 保持与代码实现同步
   - 添加新的使用示例
   - 更新性能指标

3. **版本控制**：
   - 记录重大变更
   - 标注兼容性信息
   - 维护变更日志