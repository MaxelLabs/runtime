# Learning 学习层

本层提供从入门到精通的学习路径，帮助不同背景的用户快速掌握项目。

## 学习路径

### 🚀 Getting Started 入门指南
- [Quick Start Guide](getting-started/) - 30分钟快速体验
- [Environment Setup](getting-started/) - 开发环境配置
- [First Demo](getting-started/) - 创建第一个演示

### 📚 Tutorials 教程
- [**PBR材质迁移指南**](tutorials/pbr-migration-guide.md) - **🔥 推荐**：从旧PBR到SimplePBR的完整迁移指南
- [基础渲染教程](tutorials/) - 从零开始学习WebGL渲染
- [材质系统教程](tutorials/) - PBR材质实现详解
- [阴影映射教程](tutorials/) - 实时阴影技术
- [后处理教程](tutorials/) - 屏幕空间效果

### 💡 Best Practices 最佳实践
- [性能优化指南](best-practices/) - 渲染性能调优
- [内存管理](best-practices/) - GPU资源管理
- [错误处理](best-practices/) - 常见问题解决
- [代码组织](best-practices/) - 项目结构最佳实践

## 推荐学习路径

### 🚀 初学者 (Beginner) - 第一步
1. [图形系统圣经](../foundations/graphics-bible.md) - **必读**：理解图形学基础原理
2. [Getting Started](getting-started/) - 30分钟快速体验
3. [基础渲染教程](tutorials/) - 从零开始学习WebGL渲染
4. [错误处理](best-practices/) - 避免常见陷阱

**接下来可以学习**：[RHI Demo宪法](../foundations/rhi-demo-constitution.md) → [方向光源Demo](../reference/directional-light-demo.md)

### 👨‍💻 开发者 (Developer) - 实战导向
1. [PBR材质迁移指南](tutorials/pbr-migration-guide.md) - **重点**：现代PBR材质系统
2. [材质系统教程](tutorials/) - 深入材质实现
3. [后处理教程](tutorials/) - 屏幕空间效果技术
4. [性能优化指南](best-practices/) - 渲染性能调优

**接下来可以学习**：[PBR材质系统](../reference/pbr-material-system.md) → [后处理系统](../reference/modules/post-processing-system.md) → [FXAA抗锯齿](../reference/modules/fxaa-anti-aliasing.md)

### 🚀 高级用户 (Advanced) - 深度优化
1. [阴影映射教程](tutorials/) - 实时阴影技术
2. [内存管理](best-practices/) - GPU资源管理优化
3. [渲染管线整合](../advanced/integration/rendering-pipeline.md) - 完整渲染管线

**接下来可以学习**：[粒子系统](../reference/particle-system.md) → [GPU实例化](../reference/instancing-demo.md) → [阴影工具](../reference/shadow-tools.md)

---

## 🔗 主题关联网络

### PBR渲染主题链
**学习路径**：[图形系统圣经](../foundations/graphics-bible.md) → [PBR迁移指南](tutorials/pbr-migration-guide.md) → [PBR材质系统](../reference/pbr-material-system.md)
**应用扩展**：[天空盒系统](../reference/skybox-system.md) + [阴影工具](../reference/shadow-tools.md) + [后处理系统](../reference/modules/post-processing-system.md)

### 后处理技术链
**学习路径**：[颜色空间原理](../foundations/graphics-bible.md#颜色空间) → [后处理系统](../reference/modules/post-processing-system.md) → [FXAA抗锯齿](../reference/modules/fxaa-anti-aliasing.md)
**应用扩展**：[PBR材质](../reference/pbr-material-system.md) + [阴影映射](../reference/shadow-mapping-demo.md) + 后处理

### 性能优化主题链
**理论基础**：[RHI Demo宪法](../foundations/rhi-demo-constitution.md) → [性能优化指南](best-practices/)
**实践应用**：[GPU实例化](../reference/instancing-demo.md) + [SimplePBR](tutorials/pbr-migration-guide.md) + [内存管理](best-practices/)

## 导航

- [🏛️ Foundations](../foundations/) - 基础层（理论基础）
- [🔧 Reference](../reference/) - 参考层（技术实现）
- [⚡ Advanced](../advanced/) - 高级层（深度集成）