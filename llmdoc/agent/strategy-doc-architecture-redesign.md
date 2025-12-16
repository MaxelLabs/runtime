# Strategy: AI友好分层文档架构重设计

## 1. Analysis
* **Context**: 当前文档架构存在严重的信息密度问题，12个超过1000行的超大文档，最大文档85KB，信息层级混乱，缺乏清晰导航。
* **Constitution**: 遵循文档驱动开发原则，文档是代码的上游。需要建立AI友好的文档体系，支持高效的信息检索和知识传递。

## 2. Assessment
<Assessment>
**Complexity**: Level 3 (架构设计涉及信息科学、认知心理学、AI系统设计)
**Risk**: High (影响整个项目的知识管理和开发效率)
</Assessment>

## 3. Math/Algo Specification
<MathSpec>
1. **信息密度优化**:
   ```
   文档大小限制: min(30KB, 800行)
   信息熵: H(X) = -Σp(x)log(p(x))
   冗余率: R = 1 - (实际信息量 / 总字符数)
   ```

2. **导航效率算法**:
   ```
   点击深度: depth ≤ 3
   查找时间: T = O(log n) for n documents
   相关性评分: sim(doc1, doc2) = cos(θ) = (v1·v2) / (||v1||·||v2||)
   ```

3. **层级结构优化**:
   ```
   Layer1 (概览): 信息压缩比 ≈ 10:1
   Layer2 (详细): 信息压缩比 ≈ 3:1
   Layer3 (参考): 原始信息保留率 ≈ 100%
   ```
</MathSpec>

## 4. The Plan
<ExecutionPlan>
**Block 1: 架构设计**
1. 设计三层信息架构模型
2. 定义每层文档的标准模板
3. 建立文档间的引用关系规范

**Block 2: 目录结构重构**
1. 创建新的目录结构方案
2. 设计多维索引系统
3. 实现智能相关推荐机制

**Block 3: 迁移实施**
1. 文档拆分和重组策略
2. 内容迁移自动化工具
3. 验证和迭代优化

**Block 4: AI优化**
1. 元数据标准化
2. 语义结构优化
3. 查询和检索增强
</ExecutionPlan>

---

## AI友好分层文档架构设计方案

### 1. 三层信息架构模型

#### Layer 1: 概览层 (Overview Layer)
- **目标**: 5分钟内快速理解核心概念
- **限制**: 每文档 < 5KB, < 200行
- **特点**: 高密度信息、可视化、导航导向

```
llmdoc/
├── 01-overview/                    # 概览层
│   ├── README.md                   # 项目全景图 (1页)
│   ├── quick-start.md              # 5分钟快速开始
│   ├── architecture-diagram.md     # 系统架构图解
│   └── roadmap.md                  # 发展路线图
```

#### Layer 2: 详细层 (Detail Layer)
- **目标**: 30分钟内掌握完整功能
- **限制**: 每文档 < 30KB, < 800行
- **特点**: 完整说明、代码示例、最佳实践

```
llmdoc/
├── 02-guides/                      # 详细层
│   ├── getting-started/            # 入门指南
│   ├── tutorials/                  # 教程集合
│   ├── best-practices/             # 最佳实践
│   └── troubleshooting/            # 问题排查
```

#### Layer 3: 参考层 (Reference Layer)
- **目标**: 完整的技术参考，随时查阅
- **限制**: 每文档 < 30KB, < 800行 (必要时可拆分)
- **特点**: API文档、规范定义、完整示例

```
llmdoc/
├── 03-reference/                   # 参考层
│   ├── api/                        # API文档 (按模块拆分)
│   ├── specifications/             # 技术规范
│   ├── examples/                   # 完整示例
│   └── glossary/                   # 术语表
```

### 2. 每层文档标准模板

#### Layer 1 模板 (概览层)

```markdown
---
metadata:
  title: "简短标题"
  layer: "overview"
  reading_time: "5 min"
  prerequisites: []
  next_steps: ["doc1", "doc2"]
  tags: ["concept", "intro"]
---

# 标题 (< 50字符)

## 核心概念 (3-5个要点)
- **概念1**: 一句话定义
- **概念2**: 一句话定义

## 快速理解 (3个关键信息)
1. **是什么**: 1-2句话
2. **为什么**: 1-2句话
3. **怎么用**: 1-2句话

## 相关资源
- 📖 [详细文档](../02-guides/xxx.md)
- 🎯 [API参考](../03-reference/api/xxx.md)
- 💡 [示例代码](../03-reference/examples/xxx.md)
```

#### Layer 2 模板 (详细层)

```markdown
---
metadata:
  title: "功能/主题名称"
  layer: "guide"
  reading_time: "30 min"
  difficulty: "beginner|intermediate|advanced"
  prerequisites: ["doc1", "doc2"]
  outcomes: ["技能1", "技能2"]
  tags: ["tutorial", "guide"]
---

# 功能/主题名称

## 概述 (2-3段)
- 功能定义和目标
- 主要使用场景
- 核心优势

## 先决条件
列出必要的背景知识和准备

## 步骤指南 (5-10步)
每个步骤包含：
- 步骤目标
- 具体操作
- 代码示例
- 预期结果

## 常见问题
3-5个最常见问题和解答

## 下一步
- 相关教程
- 进阶主题
- 实践项目
```

#### Layer 3 模板 (参考层)

```markdown
---
metadata:
  title: "API/规范名称"
  layer: "reference"
  type: "api|spec|example"
  module: "模块名"
  version: "1.0.0"
  related_apis: ["api1", "api2"]
  tags: ["reference", "api"]
---

# API/规范名称

## 签名
```typescript
function signature(params: Type): ReturnType
```

## 参数说明
| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| param1 | Type | ✓ | - | 说明 |

## 返回值
Type - 返回值说明

## 异常
| 错误码 | 原因 | 解决方案 |
|--------|------|----------|
| ERROR | 说明 | 解决方法 |

## 示例
```typescript
// 基础用法
const result = api(params)

// 高级用法
const advanced = api(params, options)
```

## 注意事项
- 性能考虑
- 兼容性说明
- 最佳实践
```

### 3. 文档间关系和引用规范

#### 引用系统设计

```typescript
interface DocumentReference {
  // 基础引用
  link: string           // 相对路径
  text: string          // 显示文本

  // 语义引用
  type: 'concept' | 'api' | 'example' | 'tutorial'
  context: string       // 引用上下文

  // 关系权重
  relevance: number      // 0-1, 相关性评分
  priority: 'high' | 'medium' | 'low'
}

// 引用格式规范
/*
内部引用:
- 概念: `[概念名](../01-overview/concept.md)`
- API: `[API名](../03-reference/api/module.md#api-name)`
- 示例: `[示例](../03-reference/examples/example.md)`

外部引用:
- MDN: `[WebGL API](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)`
- GitHub: `[Issue #123](https://github.com/repo/issues/123)`
*/
```

#### 导航效率优化

```typescript
interface NavigationPath {
  // 路径定义
  from: string           // 起始文档
  to: string             // 目标文档
  depth: number          // 点击深度 ≤ 3
  path_type: 'linear' | 'branched' | 'cross'

  // 路径优化
  shortcuts: string[]    // 快捷路径
  alternatives: string[] // 备选路径
}

// 导航规则
/*
1. 任何信息最多3次点击到达
2. 相关文档智能推荐 (top 5)
3. 多维度索引 (标签、模块、难度)
4. 搜索结果相关性排序
*/
```

### 4. 新目录结构方案

```
llmdoc/
├── README.md                         # 项目入口 (Layer 1)
├── .doc-config/                      # 文档配置
│   ├── metadata-schema.json         # 元数据规范
│   ├── build-config.json            # 构建配置
│   └── validation-rules.json        # 验证规则
│
├── 01-overview/                      # Layer 1: 概览层 (5分钟阅读)
│   ├── README.md                    # 项目全景 (1页)
│   ├── concepts/                    # 核心概念 (每个概念1页)
│   │   ├── rhi.md                   # RHI概念
│   │   ├── pbr.md                   # PBR概念
│   │   └── pipeline.md              # 渲染管线概念
│   ├── quick-start/                 # 快速开始
│   │   ├── installation.md          # 安装指南
│   │   ├── first-demo.md            # 第一个演示
│   │   └── basic-usage.md           # 基础用法
│   └── architecture/                # 架构概览
│       ├── system-diagram.md        # 系统架构图
│       ├── module-overview.md       # 模块概览
│       └── data-flow.md             # 数据流图
│
├── 02-guides/                        # Layer 2: 详细层 (30分钟阅读)
│   ├── getting-started/             # 入门指南
│   │   ├── setup-development.md     # 开发环境搭建
│   │   ├── understand-rhi.md        # 理解RHI
│   │   └── create-material.md       # 创建材质
│   ├── tutorials/                   # 教程集合 (每个教程专注一个主题)
│   │   ├── basic-rendering/         # 基础渲染系列
│   │   ├── advanced-effects/        # 高级效果系列
│   │   └── performance-optimization/ # 性能优化系列
│   ├── best-practices/              # 最佳实践
│   │   ├── code-organization.md     # 代码组织
│   │   ├── memory-management.md     # 内存管理
│   │   └── performance-tips.md      # 性能技巧
│   └── troubleshooting/             # 问题排查
│       ├── common-errors.md         # 常见错误
│       ├── debugging-guide.md       # 调试指南
│       └── performance-issues.md    # 性能问题
│
├── 03-reference/                     # Layer 3: 参考层 (随时查阅)
│   ├── api/                         # API文档 (按模块拆分)
│   │   ├── rhi/                     # RHI API
│   │   │   ├── device.md            # 设备API
│   │   │   ├── buffer.md            # 缓冲区API
│   │   │   ├── texture.md           # 纹理API
│   │   │   └── shader.md            # 着色器API
│   │   ├── math/                    # 数学库API
│   │   │   ├── vector.md            # 向量API
│   │   │   ├── matrix.md            # 矩阵API
│   │   │   └── quaternion.md        # 四元数API
│   │   └── specification/           # 规范API
│   │       ├── animation.md         # 动画API
│   │       ├── scene.md             # 场景API
│   │       └── material.md          # 材质API
│   ├── specifications/              # 技术规范
│   │   ├── graphics-bible.md        # 图形系统圣经 (拆分)
│   │   ├── coordinate-systems.md    # 坐标系统规范
│   │   ├── shader-specifications.md # 着色器规范
│   │   └── performance-requirements.md # 性能要求
│   ├── examples/                    # 完整示例
│   │   ├── basic/                   # 基础示例
│   │   ├── intermediate/            # 中级示例
│   │   └── advanced/                # 高级示例
│   └── glossary/                    # 术语表
│       ├── graphics-terms.md        # 图形学术语
│       ├── api-terms.md             # API术语
│       └── abbreviations.md         # 缩写说明
│
├── 04-advanced/                      # 高级主题
│   ├── integration/                 # 集成指南
│   ├── optimization/                # 优化策略
│   └── architecture-deep-dive/      # 架构深度解析
│
├── 05-agent/                        # Agent策略存档
│   ├── strategies/                  # 策略文档
│   ├── implementations/             # 实现细节
│   └── research/                    # 技术研究
│
└── 06-support/                      # 支持文档
    ├── faq.md                       # 常见问题
    ├── changelog.md                 # 更新日志
    └── contributing.md              # 贡献指南
```

### 5. 实施迁移计划

#### Phase 1: 准备阶段 (1周)

1. **工具准备**
```bash
# 文档分析工具
npm install -g doc-scraper
npm install -g markdownlint
npm install -g textstat

# 自动化脚本
scripts/
├── analyze-docs.js          # 分析现有文档
├── split-large-docs.js      # 拆分大文档
├── generate-metadata.js     # 生成元数据
└── validate-structure.js    # 验证新结构
```

2. **元数据标准化**
```json
{
  "$schema": "./metadata-schema.json",
  "required": ["title", "layer", "last_updated", "tags"],
  "properties": {
    "title": {"type": "string", "maxLength": 50},
    "layer": {"enum": ["overview", "guide", "reference"]},
    "reading_time": {"type": "string", "pattern": "^\\d+ min$"},
    "difficulty": {"enum": ["beginner", "intermediate", "advanced"]},
    "prerequisites": {"type": "array", "items": {"type": "string"}},
    "outcomes": {"type": "array", "items": {"type": "string"}},
    "tags": {"type": "array", "maxItems": 5},
    "related_docs": {"type": "array", "items": {"type": "string"}}
  }
}
```

#### Phase 2: 拆分重组 (2周)

1. **大文档拆分策略**
```javascript
// 示例：拆分 performance-optimization.md (85KB)
const splitPlan = {
  source: "reference/technical-debt.md",
  target: [
    "03-reference/specifications/performance-requirements.md",
    "02-guides/best-practices/performance-tips.md",
    "02-guides/tutorials/performance-optimization/",
    "03-reference/examples/performance-benchmarks.md"
  ],
  criteria: {
    maxSize: 30 * 1024,      // 30KB
    maxLines: 800,
    semanticUnits: true     // 按语义单元拆分
  }
}
```

2. **内容映射表**
```typescript
interface ContentMapping {
  old_path: string
  new_paths: string[]
  split_strategy: 'by_topic' | 'by_size' | 'by_audience'
  migration_status: 'pending' | 'in_progress' | 'completed'
  quality_check: boolean
}
```

#### Phase 3: 质量保证 (1周)

1. **自动化验证**
```yaml
# .github/workflows/doc-validation.yml
name: Document Validation
on: [push, pull_request]
jobs:
  validate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check document sizes
        run: npm run check-doc-sizes
      - name: Validate metadata
        run: npm run validate-metadata
      - name: Check links
        run: npm run check-links
      - name: Measure reading time
        run: npm run measure-reading-time
```

2. **质量指标**
```typescript
interface QualityMetrics {
  document_size: {
    max: 30 * 1024,      // 30KB
    warning: 20 * 1024   // 20KB
  },
  line_count: {
    max: 800,
    warning: 600
  },
  reading_time: {
    overview_max: 5,     // 5分钟
    guide_max: 30,       // 30分钟
    reference_max: 60    // 60分钟
  },
  link_depth: {
    max: 3,              // 3次点击
    warning: 2
  }
}
```

#### Phase 4: AI优化 (1周)

1. **语义结构优化**
```markdown
<!-- 标准化的语义标记 -->
## Concept
<span class="concept" data-term="RHI">Render Hardware Interface</span>

## Code Example
<div class="code-example" data-language="typescript" data-complexity="basic">
```typescript
// 代码
```
<div class="explanation">
代码说明
</div>
</div>

## API Reference
<div class="api-reference" data-module="rhi" data-api="createDevice">
<!-- API文档内容 -->
</div>
```

2. **搜索优化**
```typescript
// 搜索索引结构
interface SearchIndex {
  documents: {
    [docId: string]: {
      title: string
      content: string
      tags: string[]
      layer: string
      difficulty: string
      embeddings: number[]  // AI生成的向量嵌入
    }
  },
  metadata: {
    last_updated: string
    total_docs: number
    vector_dimension: number
  }
}
```

### 6. 预期效果

#### 信息检索效率提升
- **查找时间**: 从平均5分钟降低到30秒
- **点击深度**: 从平均5次降低到2-3次
- **文档加载**: 减少60%的加载时间

#### 开发效率提升
- **新手入门**: 从2小时缩短到30分钟
- **API查询**: 从10分钟缩短到2分钟
- **问题排查**: 从30分钟缩短到5分钟

#### 维护成本降低
- **文档更新**: 模块化更新，影响范围可控
- **一致性**: 自动化检查保证格式一致性
- **质量保证**: 持续的监控和优化

### 7. 成功指标

1. **文档质量指标**
   - 0个文档超过30KB或800行
   - 100%文档包含标准元数据
   - 95%以上链接有效

2. **用户体验指标**
   - 平均查找时间 < 1分钟
   - 用户满意度 > 4.5/5
   - 文档使用率提升50%

3. **维护效率指标**
   - 文档更新时间减少40%
   - 一致性检查自动化率100%
   - 新文档创建时间减少60%

这个AI友好的分层文档架构将显著改善知识管理效率，提升开发体验，降低维护成本。