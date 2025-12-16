# Agent 层级文档索引

## 概述

Agent层级存储开发过程中的策略文档、技术调查、实施指南和经验总结。这些文档是项目开发过程中的重要知识资产，记录了技术决策、实施路径和经验教训。

## 文档结构

```
llmdoc/agent/
├── index.md                    # 主索引文件（本文件）
├── strategies/                 # 技术策略文档
│   ├── index.md               # 策略文档索引
│   ├── strategy-math-test-fix.md
│   ├── strategy-pbr-shadow-demo.md
│   └── ...
├── investigations/             # 技术调查报告
│   ├── index.md               # 调查报告索引
│   ├── matrix4-api-investigation.md
│   ├── lighting-material-investigation.md
│   └── ...
├── implementations/           # 实施指南和最佳实践
│   ├── index.md               # 实施指南索引
│   ├── pbr-shadow-implementation-guide.md
│   └── ...
└── memos/                    # 经验总结和备忘录
    ├── index.md              # 备忘录索引
    ├── memo-math-test-lessons-learned.md
    └── ...
```

## 文档分类说明

### 📋 Strategies（技术策略）
**描述**: 详细的技术实施策略，包含问题分析、解决方案和执行计划。

**文档特征**:
- 包含 `<Analysis>`、`<Assessment>`、`<Failure Case Catalog>` 等结构化章节
- 详细的实施步骤和代码示例
- 时间计划、风险评估和验收标准

**示例文档**:
- `strategy-math-test-fix.md` - 数学测试套件修复策略
- `strategy-pbr-shadow-demo.md` - PBR+Shadow演示开发策略

### 🔍 Investigations（技术调查）
**描述**: 深入的技术调研报告，分析现状、识别问题、提出建议。

**文档特征**:
- 现状分析和盘点
- 技术依赖关系梳理
- 实现路径建议
- 技术成熟度评估

**示例文档**:
- `matrix4-api-investigation.md` - Matrix4 API问题调查
- `lighting-material-investigation.md` - 环境映射技术调研

### 🛠️ Implementations（实施指南）
**描述**: 具体的实施指导和最佳实践文档，提供详细的代码结构和实现细节。

**文档特征**:
- 完整的代码架构设计
- 详细的实现步骤
- 配置和部署指南
- 调试和优化建议

**示例文档**:
- `pbr-shadow-implementation-guide.md` - PBR+Shadow实施指南

### 📝 Memos（经验总结）
**描述**: 开发过程中的经验教训、备忘录和最佳实践总结。

**文档特征**:
- 经验教训总结
- 避坑指南
- 最佳实践模板
- 知识点记录

**示例文档**:
- `memo-math-test-lessons-learned.md` - 数学测试经验总结

## 文档状态标识

每个文档都包含状态标记，便于了解文档的当前状态：

- ✅ **已完成**: 文档内容完整，已通过验证
- ⏳ **进行中**: 文档正在编写或实施中
- 🔄 **待更新**: 文档需要根据最新进展更新
- 📋 **提案阶段**: 仅为初步提案，需要进一步细化

## 快速导航

### 按技术领域分类

#### 🧮 数学库 (Math Library)
- [策略](strategies/index.md#数学库) | [调查](investigations/index.md#数学库) | [备忘](memos/index.md#数学库)

#### 🎮 渲染系统 (Rendering System)
- [策略](strategies/index.md#渲染系统) | [调查](investigations/index.md#渲染系统) | [实施](implementations/index.md#渲染系统)

#### 🌟 光照和阴影 (Lighting & Shadows)
- [策略](strategies/index.md#光照和阴影) | [调查](investigations/index.md#光照和阴影) | [实施](implementations/index.md#光照和阴影)

#### 🎨 材质系统 (Material System)
- [策略](strategies/index.md#材质系统) | [调查](investigations/index.md#材质系统) | [实施](implementations/index.md#材质系统)

#### 🖼️ 纹理和贴图 (Textures)
- [策略](strategies/index.md#纹理和贴图) | [调查](investigations/index.md#纹理和贴图)

#### 🔧 工具和基础设施 (Tools & Infrastructure)
- [策略](strategies/index.md#工具和基础设施) | [调查](investigations/index.md#工具和基础设施)

### 按文档类型分类

#### 📋 策略文档 (17个)
涵盖了数学库修复、PBR材质、阴影映射、粒子系统等核心功能的实施策略。

#### 🔍 调查报告 (10个)
包含了对Matrix4 API、环境映射、基础渲染Demo、工具库等深入的技术调研。

#### 🛠️ 实施指南 (1个)
提供了PBR+Shadow等复杂功能的详细实施指导。

#### 📝 经验总结 (1个)
记录了数学测试等重要功能的开发经验和教训。

## 使用指南

### 📖 如何使用这些文档

1. **开始新任务前**:
   - 首先查看相关的 **技术调查**，了解现状和依赖
   - 然后阅读 **技术策略**，理解实施路径
   - 最后参考 **实施指南** 进行具体开发

2. **遇到问题时**:
   - 查找相关的 **技术调查**，了解是否有已知的解决方案
   - 参考 **经验总结**，避免重复踩坑

3. **编写新文档时**:
   - 选择合适的分类（策略/调查/实施/备忘）
   - 遵循既定的文档格式和模板
   - 添加状态标识和相关任务信息

### 🔄 文档生命周期

1. **创建**: 根据需要创建相应类型的文档
2. **实施**: 基于策略文档进行具体实施
3. **更新**: 随着项目进展及时更新文档内容
4. **归档**: 完成的任务可标记为已归档，便于知识管理

### 📚 知识管理体系

这些Agent文档构成了项目的知识管理体系：

- **策略文档**: 指导项目方向和技术决策
- **调查报告**: 支持技术选型和问题分析
- **实施指南**: 确保代码质量和实施效率
- **经验总结**: 积累项目经验和最佳实践

## 文档统计

| 类型 | 数量 | 状态分布 |
|------|------|----------|
| Strategies | 17 | ✅ 8个 | ⏳ 5个 | 🔄 4个 |
| Investigations | 10 | ✅ 7个 | ⏳ 2个 | 🔄 1个 |
| Implementations | 1 | ✅ 1个 |
| Memos | 1 | ✅ 1个 |
| **总计** | **29** | **✅ 17个** | **⏳ 7个** | **🔄 5个** |

## 贡献指南

### 📝 文档编写规范

1. **标题格式**: 使用清晰、描述性的标题
2. **结构组织**: 遵循既定的文档结构和模板
3. **代码示例**: 提供完整、可运行的代码示例
4. **状态标记**: 明确标注文档当前状态
5. **关联信息**: 标注相关任务和依赖文档

### 🔍 质量标准

- **准确性**: 技术信息准确无误
- **完整性**: 覆盖必要的实施细节
- **时效性**: 及时更新以反映最新进展
- **可读性**: 结构清晰，语言简洁

### 📊 维护计划

- **定期审查**: 每月审查文档状态和内容准确性
- **及时更新**: 随着项目进展及时更新相关文档
- **知识沉淀**: 将重要经验及时总结为备忘录

## 智能体工作流程

### 标准流程
1. **策略制定** - 在strategies中定义实现策略
2. **技术调研** - 在investigations中记录调研过程
3. **实现记录** - 在implementations中记录具体实现
4. **经验总结** - 在memos中记录经验教训

### 文档规范
- 策略文档包含算法描述和伪代码
- 调研文档包含技术对比和选型理由
- 实现文档包含代码示例和测试结果
- 备忘录包含经验教训和最佳实践

## 导航

- [🏛️ Foundations](../foundations/) - 基础层
- [🔧 Reference](../reference/) - 参考层
- [⚡ Advanced](../advanced/) - 高级层
- [🆘 Support](../support/) - 支持层

---

**最后更新**: 2025-12-17
**文档版本**: v2.0
**维护者**: Agent Team

这些Agent文档是项目开发过程中的重要知识资产，请妥善维护并及时更新。