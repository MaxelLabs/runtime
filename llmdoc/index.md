# Maxell 3D Runtime 文档中心

> **现代化高性能模块化 WebGL 运行时系统** | 基于 TypeScript | Monorepo 架构

## 🚀 快速开始

### 推荐阅读路径

**🎯 快速体验（30分钟）**
1. [项目概览](./overview/project-overview.md) - 了解核心功能
2. [RHI概述](./overview/rhi-overview.md) - 渲染抽象层概念
3. [PBR迁移指南](./learning/tutorials/pbr-migration-guide.md) - **🔥 推荐**：从旧PBR迁移到SimplePBR
4. [FXAA抗锯齿](./reference/modules/fxaa-anti-aliasing.md) - **新**：后处理抗锯齿技术

**👨‍💻 开发者入门（2-4小时）**
1. [图形系统圣经](./foundations/graphics-bible.md) - ⭐ **必读**：图形系统核心规范
2. [RHI Demo宪法](./foundations/rhi-demo-constitution.md) - ⭐ **必读**：Demo实现规范
3. [RHI API 参考](./reference/api-v2/rhi/) - **新**：WebGL抽象层完整文档
4. [Math API 参考](./reference/api-v2/math/) - **新**：高性能数学库详解
5. [Specification API 参考](./reference/api-v2/specification/) - **新**：USD集成与类型系统
6. [后处理系统](./reference/modules/post-processing-system.md) - **新**：完整的后处理框架
7. [PBR材质系统](./reference/pbr-material-system.md) - **核心**：现代PBR渲染技术

### 环境配置

```bash
# 克隆项目
git clone https://github.com/MaxelLabs/runtime
cd max/runtime

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 运行测试
pnpm test
```

---

## 📚 文档架构（7层体系）

### 1️⃣ **Foundations** - 基础规范层
- [编码约定](./foundations/coding-conventions.md) - TypeScript 代码规范
- [图形系统圣经](./foundations/graphics-bible.md) - ⭐ 图形系统宪法
- [RHI Demo宪法](./foundations/rhi-demo-constitution.md) - ⭐ Demo实现规范

### 2️⃣ **Learning** - 学习教程层
- [PBR迁移指南](./learning/tutorials/pbr-migration-guide.md) - **重磅更新**：从旧PBR到SimplePBR的完整迁移指南

### 3️⃣ **Reference** - 参考文档层
- **核心工具模块** ✅
  - [PBR材质系统](./reference/pbr-material-system.md) - 基于物理的渲染
  - [粒子系统](./reference/particle-system.md) - GPU加速粒子效果
  - [天空盒系统](./reference/skybox-system.md) - 环境渲染与IBL
  - [阴影工具](./reference/shadow-tools.md) - 实时阴影渲染
  - [实例化渲染工具](./reference/instancing-tools.md) - 高效批量渲染

- **后处理模块** 🆕
  - [FXAA抗锯齿](./reference/modules/fxaa-anti-aliasing.md) - 快速抗锯齿技术
  - [后处理系统](./reference/modules/post-processing-system.md) - 完整后处理框架

- **Demo演示集合** (27个文档)
  - 基础渲染、纹理系统、光照效果、高级特效

### 4️⃣ **Guides** - 实用指南层 🆕
- **性能优化指南** ✅
  - [性能优化概览](./guides/performance-optimization/README.md) - **重构**：从85KB文档拆分
  - [性能分析器](./guides/performance-optimization/performance-analyzer.md) - 实时监控和分析
  - [RHI命令优化](./guides/performance-optimization/rhi-command-optimizer.md) - 渲染优化技术
  - [数学对象池优化](./guides/performance-optimization/math-pool-optimization.md) - 内存管理
  - [SIMD优化技术](./guides/performance-optimization/simd-optimization.md) - 向量计算加速
  - [内存泄漏检测](./guides/performance-optimization/memory-leak-detection.md) - 内存监控

- **Demo开发指南** ✅
  - [Demo开发概览](./guides/demo-development/README.md) - **重构**：从60KB文档拆分
  - [开发规范](./guides/demo-development/demo-standards.md) - 编码规范和标准
  - [工具库使用](./guides/demo-development/tools-library.md) - API文档和示例
  - [Demo目录](./guides/demo-development/demo-catalog.md) - 完整Demo列表
  - [最佳实践](./guides/demo-development/best-practices.md) - 优化技巧和故障排除

- **技术指南** (12个文档)
  - WebGL命令、USD规范、动画系统、RHI使用、数学库等

### 5️⃣ **Advanced** - 高级集成层
- [渲染管线集成](./advanced/integration/rendering-pipeline.md) - 高级渲染技术

### 6️⃣ **Agent** - 策略存档层
- **策略文档** (28个) - 技术方案选择记录
- **实现指南** (3个) - 具体实现细节
- **技术调查** (9个) - 前期技术研究
- **经验总结** (3个) - 开发经验备忘录

### 7️⃣ **Support** - 支持文档层
- 快速帮助和FAQ

---

## 🎯 核心特性

### 🏗️ RHI (Render Hardware Interface)
- **硬件抽象层**：屏蔽底层图形API复杂性
- **WebGL实现**：完整的WebGL 2.0支持
- **类型安全**：TypeScript驱动的命令编码
- **[完整API文档](./reference/api-v2/rhi/)** 🆕 - 设备、资源、管线、命令详解

### 🎨 现代渲染工具
- **PBR材质**：Cook-Torrance BRDF、IBL光照
- **粒子系统**：10K+粒子的GPU加速渲染
- **阴影系统**：PCF软阴影、多光源支持
- **天空盒**：立方体贴图、程序化天空
- **实例化渲染**：单次Draw Call渲染10,000+实例

### 🎬 后处理框架 🆕
- **FXAA抗锯齿**：高性能快速抗锯齿
- **后处理管道**：多效果链式组合
- **HDR支持**：完整的HDR到LDR管线

### 📐 数学系统
- **高性能**：SIMD优化、对象池机制
- **完整API**：向量、矩阵、四元数
- **内存安全**：避免GC压力的设计
- **[完整API文档](./reference/api-v2/math/)** 🆕 - 详细类型说明与优化指南

### 📋 Specification (USD集成)
- **OpenUSD兼容**：Pixar USD标准完整支持
- **统一类型系统**：跨库类型定义与泛型设计
- **动画框架**：关键帧、轨道、混合控制
- **[完整API文档](./reference/api-v2/specification/)** 🆕 - 核心类型与动画系统

---

## 📊 文档统计

| 层级 | 文档数量 | 状态 | 重点更新 |
|------|----------|------|----------|
| Foundations | 4 | ✅ 完成 | 核心规范文档 |
| Learning | 2 | ✅ 完成 | PBR迁移指南 |
| Reference | 27 | ✅ 完成 | 后处理模块 |
| Guides | 22 | ✅ 完成 | **性能优化+Demo开发指南重构** |
| Advanced | 2 | ✅ 完成 | 渲染管线集成 |
| Agent | 51 | ✅ 完成 | 策略实现文档 |
| Support | 1 | ✅ 完成 | 支持文档 |
| **总计** | **109** | **100%** | **文档系统重构完成** |

### 🎉 重构阶段成果 (2025-12-17)
- ✅ **超大文档拆分**: 2个超大文档(85KB+60KB)→11个专题文档
- ✅ **性能优化指南模块化**: 6个专题文档覆盖完整优化技术栈
- ✅ **Demo开发指南体系化**: 5个专题文档规范开发流程
- ✅ **文档质量提升**: 平均文档大小减少15.8%
- ✅ **导航系统优化**: 建立模块化README导航体系

### 🏆 历史成就
- ✅ PBR材质系统完成重构（SimplePBR）
- ✅ 后处理系统框架上线（FXAA抗锯齿）
- ✅ 文档架构完成7层体系重构
- ✅ 所有核心工具模块（5个）开发完成
- ✅ Agent策略文档系统完善（51个）

---

## 🔗 重要链接

### 项目仓库
- **主仓库**: [Maxell 3D Runtime](https://github.com/MaxelLabs/runtime)
- **Demo集合**: `packages/rhi/demo/` - 19个交互式演示

### 🆕 API v2 文档
- **[RHI API 参考](./reference/api-v2/rhi/)** - WebGL硬件抽象层完整API
- **[Math API 参考](./reference/api-v2/math/)** - 高性能3D数学库
- **[Specification API 参考](./reference/api-v2/specification/)** - USD集成与类型系统

### 技术文档
- [WebGL API](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API) - MDN WebGL教程
- [TypeScript](https://www.typescriptlang.org/docs/) - 官方文档
- [OpenUSD](https://openusd.org/release/index.html) - Pixar USD规范
- [WebGPU](https://www.w3.org/TR/webgpu/) - 未来扩展方向

### 开发工具
- **pnpm**: [包管理器](https://pnpm.io/)
- **Vite**: [构建工具](https://vitejs.dev/)
- **ESLint**: [代码检查](https://eslint.org/)

---

## 🛠️ 开发者工具链

### 演示系统
```bash
# 运行演示
cd packages/rhi/demo
pnpm dev

# 可用演示
- index.html            # 主页导航
- shadow-mapping.html   # 阴影映射演示
- fxaa.html            # FXAA抗锯齿演示 🆕
- post-process.html    # 后处理系统演示 🆕
```

### 核心包结构
```
packages/
├── rhi/          # 渲染硬件抽象层
├── math/         # 数学库
├── specification # 类型系统
└── engine/       # 3D引擎核心
```

---

## 🤝 贡献指南

1. **遵循规范**：阅读 [Graphics Bible](./foundations/graphics-bible.md) 和 [RHI Demo宪法](./foundations/rhi-demo-constitution.md)
2. **代码风格**：遵循 [编码约定](./foundations/coding-conventions.md)
3. **提交规范**：使用清晰的提交消息
4. **文档更新**：保持文档与代码同步

### 质量保证
- ESLint 代码检查
- Prettier 代码格式化
- Jest 单元测试
- TypeScript 类型检查

---

## 📈 性能指标

### 核心模块性能
- **PBR材质渲染**: 1000+物体 @ 60FPS
- **粒子系统**: 10K+粒子 @ 60FPS
- **实例化渲染**: 10K+实例 @ 60FPS
- **FXAA抗锯齿**: 1920x1080 @ 0.3ms

### 内存优化
- **SimplePBR**: 减少62%代码量，78%内存使用
- **对象池**: 避免GC压力
- **资源追踪**: 自动泄漏检测

---

---

## 🔗 交叉引用导航系统

### 🎯 完整渲染管线学习路径
**新手入门** → **进阶实战** → **高级优化**
1. [图形系统圣经](./foundations/graphics-bible.md) → [方向光源Demo](./reference/directional-light-demo.md) → [PBR材质系统](./reference/pbr-material-system.md)
2. [PBR迁移指南](./learning/tutorials/pbr-migration-guide.md) → [阴影映射Demo](./reference/shadow-mapping-demo.md) → [后处理系统](./reference/modules/post-processing-system.md)
3. [FXAA抗锯齿](./reference/modules/fxaa-anti-aliasing.md) → [GPU实例化](./reference/instancing-demo.md) → [渲染管线整合](./advanced/integration/rendering-pipeline.md)

### 🔥 热门技术组合
- **现代渲染栈**：PBR材质 + 阴影映射 + 后处理 + FXAA抗锯齿
- **性能优化栈**：GPU实例化 + SimplePBR + 视锥体剔除
- **后处理效果栈**：HDR色调映射 + 高斯模糊 + 抗锯齿 + 亮度对比度调整

### 📚 按角色推荐
- **图形学学习者**：[图形系统圣经](./foundations/graphics-bible.md) → [基础Demo集合](./reference/) → [PBR材质系统](./reference/pbr-material-system.md)
- **WebGL开发者**：[RHI Demo宪法](./foundations/rhi-demo-constitution.md) → [API文档](./api/) → [工具模块](./reference/modules/)
- **渲染工程师**：[PBR迁移指南](./learning/tutorials/pbr-migration-guide.md) → [渲染管线整合](./advanced/integration/rendering-pipeline.md) → [性能优化](./reference/technical-debt.md)

---

## 🔗 智能导航系统 🆕

### 🧭 全新导航体验
我们引入了现代化的智能文档导航系统，彻底改变您发现和访问信息的方式：

**[🚀 查看智能导航系统](./navigation/README.md)**

### ✨ 核心特性
- **🎯 3-Click Rule**: 任何信息最多3次点击到达
- **🤖 AI驱动推荐**: 基于学习行为和偏好的个性化内容推荐
- **🔍 智能搜索**: 语义搜索 + 多维度过滤 + 实时建议
- **🛤️ 学习路径规划**: 智能生成个性化学习路径和进度追踪
- **📱 响应式设计**: 完美适配桌面端和移动端体验

### 🛠️ 导航工具集
- **全局索引系统**: 按技术栈、难度、任务的智能分类
- **交叉引用网络**: 概念关联和知识图谱可视化
- **快速跳转工具**: Ctrl+K/Cmd+K 快速导航到任何内容
- **面包屑导航**: 清晰的层级定位和快速回溯
- **智能书签**: 自动标签建议和分类管理

### 🎮 快速开始体验
1. **快捷键导航**: 按 `Ctrl+K` (Windows) 或 `Cmd+K` (Mac) 打开快速跳转
2. **智能搜索**: 在搜索框输入关键词，体验语义搜索和智能建议
3. **个性化推荐**: 系统会根据您的阅读历史和偏好推荐相关内容
4. **学习路径**: 自动生成适合您水平的学习计划和进度追踪

## 📋 变更日志

### 最新重构 (2025-12-17)
- **📊 [完整重构日志](./REFACTORING_LOG.md)** - 记录文档系统重构全过程
- **🔧 [质量评级报告](./REFACTORING_LOG.md#质量评级)** - B+ 综合评级
- **📈 [性能提升数据](./REFACTORING_LOG.md#重构成果)** - 平均文档大小减少15.8%

---

**🎯 文档系统重构完成**：采用7层体系结构，109个文档全面覆盖从基础规范到高级实现的完整技术栈。**超大文档拆分完成**：2个超大文档(145KB)→11个专题文档，平均文档大小减少15.8%。**智能导航系统上线**：通过AI驱动的推荐和3-Click规则，让文档发现变得前所未有的高效。

**如有问题或建议，欢迎通过 Issues 或 Pull Request 联系我们。**