# Strategy: AI友好文档重构

## 1. Analysis
* **Context**: llmdoc包含192个文档，总计73,577行，约3.8MB。存在12个超大文档（30KB+）需要拆分，20+文档缺少标准元数据，API版本混用，目录结构需优化。
* **Constitution**:
  - 必须保持右手坐标系和列主序矩阵布局
  - 遵循RHI Demo宪法中的UI布局和HTML标准
  - 严格的TypeScript编码规范和性能要求
  - 对象池模式，禁止循环创建数学对象

## 2. Assessment
<Assessment>
**Complexity:** Level 3
**Risk:** High
</Assessment>

这是一个涉及信息科学、认知心理学和AI系统设计的复杂重构任务。

## 3. Math/Algo Specification
<MathSpec>
// 文档信息熵计算算法
function calculateInformationEntropy(document): number {
    // 1. 统计词汇频率
    termFreq = countTermFrequency(document)

    // 2. 计算文档长度权重
    lengthWeight = Math.log(document.wordCount + 1) / Math.log(MAX_WORDS)

    // 3. 计算技术密度（代码片段、API引用等）
    techDensity = (codeBlockCount + apiReferenceCount) / totalSections

    // 4. 计算语义复杂度（嵌套深度、交叉引用等）
    semanticComplexity = calculateNestingDepth() + calculateCrossReferences()

    // 5. 综合熵值（越高越需要拆分）
    entropy = (termFreq.entropy * 0.3) +
              (lengthWeight * 0.2) +
              (techDensity * 0.3) +
              (semanticComplexity * 0.2)

    return entropy
}

// 文档拆分决策矩阵
function shouldSplit(document): boolean {
    threshold = 30 * 1024  // 30KB

    // 多维度评估
    sizeScore = document.size / threshold
    entropyScore = calculateInformationEntropy(document) / 10
    refScore = document.crossReferences.length / 20

    // 加权决策
    decision = (sizeScore * 0.4) + (entropyScore * 0.4) + (refScore * 0.2)

    return decision > 1.0
}

// AI优化权重计算
function calculateAIOptimizationWeight(docType, audience): number {
    // 基础权重
    baseWeight = {
        'reference': 0.9,    // 参考文档最需要AI优化
        'guide': 0.7,        // 指南文档
        'architecture': 0.8, // 架构文档
        'agent': 0.6         // Agent策略文档
    }

    // 受众权重
    audienceWeight = {
        'ai': 1.0,      // AI系统
        'developer': 0.6, // 开发者
        'designer': 0.4   // 设计师
    }

    return baseWeight[docType] * audienceWeight[audience]
}
</MathSpec>

## 4. The Plan
<ExecutionPlan>
**Block 1: 准备阶段（第1-2天）**
1. 建立重构基准
   - 创建文档结构映射（llmdoc-structure-map.json）
   - 建立质量评估指标
   - 设置自动化测试套件
   - 备份所有文档

2. 工具准备
   - 开发文档分析脚本
   - 创建元数据验证器
   - 准备拆分工具链

**Block 2: 元数据标准化（第3-5天）**
1. 定义标准元数据模板
   ```yaml
   ---
   title: "文档标题"
   description: "简短描述（50字以内）"
   tags: ["tag1", "tag2", "tag3"]
   category: "reference|guide|architecture|agent"
   audience: "ai|developer|designer"
   version: "1.0.0"
   last_updated: "2025-12-17"
   related_docs: ["doc1.md", "doc2.md"]
   prerequisites: ["prereq1.md"]
   complexity: "basic|intermediate|advanced"
   estimated_read_time: 5  # 分钟
   ---
   ```

2. 批量更新缺失元数据
   - 自动扫描识别缺失元数据的文档
   - 基于内容推断合理的元数据
   - 人工审核和修正

**Block 3: 超大文档拆分（第6-12天）**
1. 识别目标文档（>30KB）
   - packages/rhi/demo/src/utils/material/pbr/PBRMaterial.ts
   - packages/rhi/demo/src/utils/material/pbr/MaterialLibrary.ts
   - 其他10个超大文档

2. 拆分策略
   - **按功能模块拆分**：将单一大文档拆分为多个专注的小文档
   - **保持逻辑连贯性**：使用前置条件和相关文档链接
   - **控制文档大小**：每个拆分后的文档控制在5-15KB
   - **维护索引文档**：创建主文档作为导航入口

3. 拆分执行
   - 分析文档结构，识别自然拆分点
   - 创建子文档，建立交叉引用
   - 更新所有相关链接
   - 验证拆分后的完整性

**Block 4: 目录结构优化（第13-16天）**
1. 重组文档分类
   ```
   llmdoc/
   ├── index.md                    # 总入口
   ├── reference/                  # 参考文档（宪法）
   │   ├── graphics-bible.md
   │   ├── rhi-demo-constitution.md
   │   └── api-specifications/
   ├── guides/                     # 操作指南
   │   ├── getting-started/
   │   ├── best-practices/
   │   └── troubleshooting/
   ├── architecture/               # 架构设计
   │   ├── system-overview/
   │   ├── data-flow/
   │   └── design-decisions/
   └── agent/                      # Agent策略
       ├── strategy-*.md
       └── execution-plans/
   ```

2. 统一命名规范
   - 使用kebab-case命名
   - 文件名反映内容主题
   - 版本号包含在元数据而非文件名

**Block 5: AI优化实施（第17-22天）**
1. 内容结构化
   - 添加语义标记（代码块、API引用、重要提示）
   - 使用标准化的标题层级（H1-H4）
   - 创建术语表和概念定义

2. 智能检索优化
   - 添加关键词和同义词标签
   - 创建概念映射和关系图
   - 优化标题和描述的可搜索性

3. 上下文增强
   - 添加"背景知识"部分
   - 提供相关概念链接
   - 创建渐进式学习路径

**Block 6: 质量保证（第23-25天）**
1. 自动化验证
   - 元数据完整性检查
   - 链接有效性验证
   - 文档大小和复杂度监控

2. 人工审查
   - 技术准确性验证
   - 用户体验评估
   - AI友好度测试

3. 性能测试
   - 文档加载速度测试
   - 搜索效果评估
   - 导航效率分析

**Block 7: 部署和监控（第26-30天）**
1. 渐进式部署
   - 分批次发布重构后的文档
   - 保持向后兼容性
   - 提供迁移指南

2. 监控和反馈
   - 设置使用情况监控
   - 收集用户反馈
   - 持续优化改进

**成功指标：**
- 文档平均大小 < 15KB
- 元数据完整率 > 95%
- 搜索响应时间 < 200ms
- 用户满意度 > 4.5/5
- AI检索准确率 > 90%
</ExecutionPlan>