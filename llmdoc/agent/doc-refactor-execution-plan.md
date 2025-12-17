# 文档重构执行计划

## Phase 1: 分析与准备 (Day 1-2)

### 1.1 文档扫描脚本
```typescript
// scripts/scan-docs.ts
import * as fs from 'fs';
import * as path from 'path';

interface DocStats {
  path: string;
  size: number;
  lines: number;
  hasFrontMatter: boolean;
  links: string[];
  codeBlocks: number;
  complexity: number;
}

function analyzeDocument(filePath: string): DocStats {
  const content = fs.readFileSync(filePath, 'utf-8');
  const stats: DocStats = {
    path: filePath,
    size: content.length,
    lines: content.split('\n').length,
    hasFrontMatter: content.startsWith('---'),
    links: extractLinks(content),
    codeBlocks: (content.match(/```/g) || []).length / 2,
    complexity: calculateComplexity(content)
  };
  return stats;
}

function generateReport(): void {
  const docs: DocStats[] = [];

  // 扫描所有markdown文件
  function scanDirectory(dir: string) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.endsWith('.md')) {
        docs.push(analyzeDocument(fullPath));
      }
    }
  }

  scanDirectory('llmdoc');

  // 生成报告
  const report = {
    totalDocs: docs.length,
    totalSize: docs.reduce((sum, doc) => sum + doc.size, 0),
    largeDocs: docs.filter(d => d.size > 30 * 1024),
    missingFrontMatter: docs.filter(d => !d.hasFrontMatter),
    avgComplexity: docs.reduce((sum, doc) => sum + doc.complexity, 0) / docs.length
  };

  fs.writeFileSync('llmdoc-analysis.json', JSON.stringify(report, null, 2));
}
```

### 1.2 元数据生成器
```typescript
// scripts/generate-metadata.ts
function generateFrontMatter(docPath: string, content: string): string {
  const analysis = analyzeContent(content);

  const frontMatter = `---
title: "${analysis.title}"
description: "${analysis.description}"
tags: [${analysis.tags.map(t => `"${t}"`).join(', ')}]
category: "${analysis.category}"
audience: "${analysis.audience}"
version: "1.0.0"
last_updated: "${new Date().toISOString().split('T')[0]}"
related_docs: [${analysis.relatedDocs.map(d => `"${d}"`).join(', ')}]
prerequisites: [${analysis.prereqs.map(p => `"${p}"`).join(', ')}]
complexity: "${analysis.complexity}"
estimated_read_time: ${Math.ceil(content.split(/\s+/).length / 200)}
---

`;

  return frontMatter + content;
}
```

## Phase 2: 文档拆分策略

### 2.1 智能拆分算法
```typescript
// scripts/split-large-docs.ts
interface SplitPoint {
  position: number;
  confidence: number;
  reason: string;
}

function findSplitPoints(content: string): SplitPoint[] {
  const splitPoints: SplitPoint[] = [];
  const lines = content.split('\n');

  for (let i = 1; i < lines.length - 1; i++) {
    const line = lines[i];
    const prevLine = lines[i - 1];
    const nextLine = lines[i + 1];

    // H2标题作为强拆分点
    if (line.startsWith('## ')) {
      splitPoints.push({
        position: i,
        confidence: 0.9,
        reason: 'H2 section boundary'
      });
    }

    // 空行+代码块结束作为中等拆分点
    if (prevLine.trim() === '' &&
        line.startsWith('```') &&
        i > 100 && i < lines.length - 100) {
      splitPoints.push({
        position: i + 1,
        confidence: 0.6,
        reason: 'After code block'
      });
    }
  }

  return splitPoints;
}

function splitDocument(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const splitPoints = findSplitPoints(content);

  // 选择最佳拆分点，确保每个部分10-15KB
  const targetSize = 12 * 1024;
  const splits = optimizeSplits(content, splitPoints, targetSize);

  // 执行拆分
  const baseName = path.basename(filePath, '.md');
  const dir = path.dirname(filePath);

  splits.forEach((split, index) => {
    const subDocPath = path.join(dir, `${baseName}-part-${index + 1}.md`);
    fs.writeFileSync(subDocPath, split.content);
  });
}
```

### 2.2 交叉引用维护
```typescript
// scripts/update-references.ts
function updateCrossReferences(oldPath: string, newPaths: string[]): void {
  // 更新所有引用旧文档的链接
  const allDocs = getAllMarkdownFiles('llmdoc');

  allDocs.forEach(doc => {
    const content = fs.readFileSync(doc, 'utf-8');
    let updated = content;

    // 更新markdown链接
    updated = updated.replace(
      new RegExp(`\\[.*?\\]\\(${escapeRegExp(oldPath)}\\)`, 'g'),
      (match) => {
        // 创建指向索引文档的链接
        return match.replace(oldPath, `${oldPath}-index`);
      }
    );

    if (updated !== content) {
      fs.writeFileSync(doc, updated);
    }
  });
}
```

## Phase 3: AI优化工具

### 3.1 语义标记器
```typescript
// scripts/semantic-markup.ts
function addSemanticMarkup(content: string): string {
  // 标记代码块
  content = content.replace(
    /```(\w+)?\n([\s\S]*?)```/g,
    (match, lang, code) => {
      return `<semantic-code language="${lang || 'text'}">\n${code}\n</semantic-code>`;
    }
  );

  // 标记API引用
  content = content.replace(
    /`([A-Z][a-zA-Z0-9]*\.[a-zA-Z0-9]+)`/g,
    '<api-reference>$1</api-reference>'
  );

  // 标记重要概念
  const concepts = loadConceptList();
  concepts.forEach(concept => {
    const regex = new RegExp(`\\b${concept}\\b`, 'g');
    content = content.replace(
      regex,
      `<concept term="${concept}">${concept}</concept>`
    );
  });

  return content;
}
```

### 3.2 知识图谱生成
```typescript
// scripts/knowledge-graph.ts
interface Concept {
  name: string;
  definition: string;
  related: string[];
  category: string;
}

function buildKnowledgeGraph(): Map<string, Concept> {
  const graph = new Map<string, Concept>();

  // 从所有文档中提取概念
  const allDocs = getAllMarkdownFiles('llmdoc');
  allDocs.forEach(doc => {
    const concepts = extractConcepts(doc);
    concepts.forEach(concept => {
      if (!graph.has(concept.name)) {
        graph.set(concept.name, concept);
      } else {
        // 合并关系
        const existing = graph.get(concept.name)!;
        existing.related.push(...concept.related);
        existing.related = [...new Set(existing.related)];
      }
    });
  });

  // 生成图谱文件
  const graphData = {
    nodes: Array.from(graph.entries()).map(([name, concept]) => ({
      id: name,
      label: name,
      category: concept.category,
      definition: concept.definition
    })),
    edges: Array.from(graph.entries())
      .flatMap(([name, concept]) =>
        concept.related.map(related => ({
          source: name,
          target: related,
          type: 'related'
        }))
      )
  };

  fs.writeFileSync('llmdoc/knowledge-graph.json', JSON.stringify(graphData, null, 2));
  return graph;
}
```

## Phase 4: 质量保证工具

### 4.1 验证器
```typescript
// scripts/validate-docs.ts
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateDocument(filePath: string): ValidationResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  // 检查front matter
  if (!content.startsWith('---')) {
    result.errors.push('Missing front matter');
    result.valid = false;
  }

  // 检查文档大小
  if (content.length > 15 * 1024) {
    result.warnings.push(`Document too large: ${content.length} bytes`);
  }

  // 检查链接有效性
  const links = extractLinks(content);
  links.forEach(link => {
    if (!isValidLink(link, filePath)) {
      result.errors.push(`Invalid link: ${link}`);
      result.valid = false;
    }
  });

  // 检查标题层级
  const headings = extractHeadings(content);
  let lastLevel = 0;
  headings.forEach(h => {
    if (h.level > lastLevel + 1) {
      result.warnings.push(`Heading level jump from ${lastLevel} to ${h.level}`);
    }
    lastLevel = h.level;
  });

  return result;
}
```

### 4.2 自动化测试
```typescript
// scripts/test-doc-structure.test.ts
describe('Document Structure', () => {
  test('All documents have front matter', async () => {
    const allDocs = await getAllMarkdownFiles('llmdoc');

    for (const doc of allDocs) {
      const content = fs.readFileSync(doc, 'utf-8');
      expect(content.startsWith('---')).toBe(true);
    }
  });

  test('No document exceeds 15KB', async () => {
    const allDocs = await getAllMarkdownFiles('llmdoc');

    for (const doc of allDocs) {
      const stats = fs.statSync(doc);
      expect(stats.size).toBeLessThan(15 * 1024);
    }
  });

  test('All links are valid', async () => {
    const allDocs = await getAllMarkdownFiles('llmdoc');

    for (const doc of allDocs) {
      const content = fs.readFileSync(doc, 'utf-8');
      const links = extractLinks(content);

      for (const link of links) {
        expect(isValidLink(link, doc)).toBe(true);
      }
    }
  });
});
```

## Phase 5: 监控和维护

### 5.1 使用情况跟踪
```typescript
// scripts/analytics.ts
interface DocMetrics {
  path: string;
  views: number;
  avgReadTime: number;
  bounceRate: number;
  searchQueries: string[];
}

function trackDocumentUsage(): void {
  // 集成分析SDK，跟踪文档使用情况
  // 用于后续优化决策
}
```

### 5.2 自动化更新流程
```yaml
# .github/workflows/doc-maintenance.yml
name: Documentation Maintenance

on:
  push:
    paths:
      - 'llmdoc/**'
  pull_request:
    paths:
      - 'llmdoc/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Validate documents
        run: npm run validate-docs
      - name: Check document sizes
        run: npm run check-doc-sizes
      - name: Verify links
        run: npm run verify-links
```