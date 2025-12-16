# AI友好文档模板规范

> 为Maxell 3D Runtime项目设计的AI友好文档模板系统

## 📋 概述

本模板系统提供了一套完整的AI友好文档规范，包含三层文档架构、元数据Schema、代码示例标准化和验证工具配置。

## 🏗️ 三层文档架构

### Layer 1: 概览层 (Overview)
- **文件大小**: < 5KB
- **行数限制**: < 200行
- **用途**: 快速了解概念和核心功能
- **受众**: 初学者、快速评估者

### Layer 2: 详细层 (Detailed)
- **文件大小**: < 30KB
- **行数限制**: < 800行
- **用途**: 深入学习技术细节
- **受众**: 开发者、中级用户

### Layer 3: 参考层 (Reference)
- **文件大小**: 无严格限制
- **用途**: API文档、完整技术规范
- **受众**: 高级用户、API使用者

## 📁 文件结构

```
templates/
├── schema/
│   └── metadata-schema.json     # JSON Schema元数据定义
├── layer1-overview-template.md  # 概览层模板
├── layer2-detailed-template.md  # 详细层模板
├── layer3-reference-template.md # 参考层模板
├── config/
│   ├── markdownlint.json        # MarkdownLint配置
│   └── eslint-markdown.config.js # ESLint配置
├── scripts/
│   ├── validate-docs.js         # 文档验证脚本
│   └── check-links.js           # 链接检查脚本
└── README.md                    # 本文件
```

## 🎯 核心特性

### 1. 元数据驱动的文档

每个文档包含完整的JSON元数据：

```json
{
  "title": "文档标题",
  "layer": "overview|detailed|reference",
  "category": "文档分类",
  "version": "1.0.0",
  "lastModified": "2024-01-15",
  "tags": ["tag1", "tag2"],
  "estimatedReadTime": 15,
  "difficulty": "beginner|intermediate|advanced|expert"
}
```

### 2. 语义化标记

使用自定义HTML标签增强语义：

```html
<semantic-section type="introduction">
<concept-block id="核心概念" level="primary">
<api-documentation module="@maxel/rhi">
<footer-meta>
```

### 3. AI优化特性

- **搜索优化**: 内置关键词和同义词支持
- **上下文向量**: 支持AI嵌入向量
- **交叉引用**: 自动生成相关文档链接
- **代码验证**: 内置代码示例检查

## 🛠️ 使用方法

### 创建新文档

1. **选择模板**:
   ```bash
   cp templates/layer2-detailed-template.md my-new-doc.md
   ```

2. **编辑元数据**:
   ```json
   {
     "title": "我的新文档",
     "layer": "detailed",
     "category": "learning",
     "tags": ["tutorial", "beginner"]
   }
   ```

3. **填充内容**:
   - 使用语义化标记
   - 添加代码示例
   - 包含相关链接

### 验证文档

1. **Markdown格式检查**:
   ```bash
   markdownlint my-doc.md --config templates/config/markdownlint.json
   ```

2. **完整验证**:
   ```bash
   node templates/scripts/validate-docs.js my-doc.md
   ```

3. **链接检查**:
   ```bash
   node templates/scripts/check-links.js my-doc.md
   ```

### 批量验证

```bash
# 验证所有文档
node templates/scripts/validate-docs.js

# 验证特定模式
node templates/scripts/validate-docs.js "learning/**/*.md"

# 检查所有链接
find . -name "*.md" -exec node templates/scripts/check-links.js {} +
```

## 📊 验证规则

### 文档大小限制

| 层级 | 最大大小 | 推荐大小 | 最大行数 | 推荐行数 |
|------|----------|----------|----------|----------|
| Overview | 5KB | 3KB | 200 | 150 |
| Detailed | 30KB | 20KB | 800 | 500 |
| Reference | 100KB | 50KB | 2000 | 1000 |

### 必需元数据字段

- `title`: 文档标题
- `layer`: 文档层级
- `category`: 文档分类
- `version`: 版本号
- `lastModified`: 最后修改日期
- `tags`: 标签数组
- `estimatedReadTime`: 预估阅读时间

### 代码示例规范

- 必须指定语言类型
- 使用语法高亮
- 包含完整示例
- 添加必要的注释

```typescript
// ✅ 正确示例
function example(param: string): void {
  // 实现代码
}

// ❌ 错误示例 - 缺少语言标记
function example(param) {
  // 实现代码
}
```

## 🔧 配置说明

### MarkdownLint配置

自定义规则允许：
- 语义化HTML标签
- 长行（表格、代码块）
- 特定格式要求

### ESLint配置

支持在Markdown中的代码块：
- TypeScript代码检查
- 语法验证
- 最佳实践提示

## 📈 性能优化

### 文档加载优化

1. **分层加载**: 根据需求选择层级
2. **延迟加载**: 大型文档按需加载
3. **缓存策略**: 智能缓存机制

### 搜索优化

1. **关键词索引**: 自动提取关键词
2. **同义词支持**: 增强搜索范围
3. **上下文匹配**: 基于语义的搜索

## 🚀 最佳实践

### 写作规范

1. **保持简洁**: 使用清晰的语言
2. **结构化**: 使用一致的标题结构
3. **示例丰富**: 提供实际的代码示例
4. **交叉引用**: 建立文档间的关联

### 维护建议

1. **定期验证**: 使用脚本自动检查
2. **版本控制**: 记录文档变更历史
3. **用户反馈**: 收集并响应反馈
4. **持续改进**: 根据使用情况优化

## 🔗 相关资源

- [MarkdownLint规则](https://github.com/DavidAnson/markdownlint)
- [ESLint Markdown插件](https://github.com/eslint/eslint-plugin-markdown)
- [JSON Schema规范](https://json-schema.org/)
- [AI文档最佳实践](https://example.com)

## 📞 支持与反馈

如有问题或建议，请通过以下方式联系：

- 📧 Email: dev@maxel.dev
- 🐛 GitHub Issues: [提交问题](https://github.com/MaxelLabs/runtime/issues)
- 💬 Discord: [加入讨论](https://discord.gg/maxel)

---

**模板版本**: v1.0.0
**最后更新**: 2024-01-15
**兼容性**: Node.js 16+, Markdown 3.0+