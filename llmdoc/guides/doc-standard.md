---
title: Doc Standard
description: 自动化LLM-Native标准化指南文档
category: guides
subcategory: standards
tags: ['guide', 'llm-native', 'standards', 'all-developers', 'code-examples', 'step-by-step']
target_audience: all-developers
complexity: basic
estimated_time: f"13 分钟"
last_updated: 2025-12-17
llm_native_compliance: true
version: 1.0.0
---


## 🎯 Context & Goal

### Context
本文档属于**standards**类型的开发指南，面向**all-developers**。

### Goal
帮助开发者快速理解和掌握相关概念、工具和最佳实践，提高开发效率和代码质量。

### Prerequisites
- 基础的编程知识
- 了解项目架构和基本概念
- 相关领域的开发经验

---

# LLM-Friendly Documentation Standard

> **Context**: This document defines the **Constitutional Standard** for how Agents (specifically Cartographer and Recorder) MUST write documentation.
> **Goal**: Maximize machine readability (RAG accuracy), minimize token usage, and eliminate hallucinations.

## 1. The Anatomy (Mandatory Structure)

Every document created or updated in `/llmdoc` MUST follow this structure.

### A. Frontmatter (YAML)
**Constraint**: DO NOT use 'audience' or 'read_time'. Use 'id' for vector linking.

```yaml
---
# Identity
id: "unique-kebab-id"  # CRITICAL: Used for vector indexing (e.g., 'concept-rhi-texture')
type: "concept" | "architecture" | "guide" | "reference"
title: "Concise Title"

# Semantics
description: "One-sentence summary optimized for RAG retrieval."
tags: ["keyword1", "keyword2"]

# Graph (Use IDs, not filenames)
context_dependency: ["id-of-prerequisite"] # Must read these first to understand this doc
related_ids: ["id-of-related-doc"]       # Optional context
---

## 🔌 Interface First

### 核心接口定义
#### 配置接口
```typescript
interface Config {
  version: string;
  options: Record<string, any>;
}
```

#### 执行接口
```typescript
function execute(config: Config): Promise<Result> {
  // 实现逻辑
}
```

### 使用流程
1. **初始化**: 按照规范初始化相关组件
2. **配置**: 设置必要的参数和选项
3. **执行**: 调用核心接口执行功能
4. **验证**: 检查结果和状态

---

# LLM-Friendly Documentation Standard

> **Context**: This document defines the **Constitutional Standard** for how Agents (specifically Cartographer and Recorder) MUST write documentation.
> **Goal**: Maximize machine readability (RAG accuracy), minimize token usage, and eliminate hallucinations.

## 1. The Anatomy (Mandatory Structure)

Every document created or updated in `/llmdoc` MUST follow this structure.

### A. Frontmatter (YAML)
**Constraint**: DO NOT use 'audience' or 'read_time'. Use 'id' for vector linking.

```yaml
---
# Identity
id: "unique-kebab-id"  # CRITICAL: Used for vector indexing (e.g., 'concept-rhi-texture')
type: "concept" | "architecture" | "guide" | "reference"
title: "Concise Title"

# Semantics
description: "One-sentence summary optimized for RAG retrieval."
tags: ["keyword1", "keyword2"]

# Graph (Use IDs, not filenames)
context_dependency: ["id-of-prerequisite"] # Must read these first to understand this doc
related_ids: ["id-of-related-doc"]       # Optional context
---

## ⚠️ 禁止事项

### 关键约束
- 🚫 **忽略错误处理**: 确保所有异常情况都有对应的处理逻辑
- 🚫 **缺少验证**: 验证输入参数和返回值的有效性
- 🚫 **不遵循约定**: 保持与项目整体架构和约定的一致性

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

# LLM-Friendly Documentation Standard

> **Context**: This document defines the **Constitutional Standard** for how Agents (specifically Cartographer and Recorder) MUST write documentation.
> **Goal**: Maximize machine readability (RAG accuracy), minimize token usage, and eliminate hallucinations.

## 1. The Anatomy (Mandatory Structure)

Every document created or updated in `/llmdoc` MUST follow this structure.

### A. Frontmatter (YAML)
**Constraint**: DO NOT use 'audience' or 'read_time'. Use 'id' for vector linking.

```yaml
---
# Identity
id: "unique-kebab-id"  # CRITICAL: Used for vector indexing (e.g., 'concept-rhi-texture')
type: "concept" | "architecture" | "guide" | "reference"
title: "Concise Title"

# Semantics
description: "One-sentence summary optimized for RAG retrieval."
tags: ["keyword1", "keyword2"]

# Graph (Use IDs, not filenames)
context_dependency: ["id-of-prerequisite"] # Must read these first to understand this doc
related_ids: ["id-of-related-doc"]       # Optional context
---

## 📚 Few-Shot示例

### 问题-解决方案对
**问题**: API调用返回错误
**解决方案**: 实现错误处理和重试机制
```typescript
try {
  const result = await apiCall(params);
  return result;
} catch (error) {
  if (retryCount < 3) {
    await delay(1000);
    return apiCall(params, retryCount + 1);
  }
  throw error;
}
```

**问题**: 配置文件格式错误
**解决方案**: 添加配置验证和默认值
```typescript
const config = validateAndNormalize(userConfig, defaultConfig);
if (!config.isValid()) {
  throw new ConfigError('配置验证失败');
}
```

### 学习要点
- 理解常见问题和解决方案
- 掌握最佳实践和避免陷阱
- 培养问题解决思维

---

# LLM-Friendly Documentation Standard

> **Context**: This document defines the **Constitutional Standard** for how Agents (specifically Cartographer and Recorder) MUST write documentation.
> **Goal**: Maximize machine readability (RAG accuracy), minimize token usage, and eliminate hallucinations.

## 1. The Anatomy (Mandatory Structure)

Every document created or updated in `/llmdoc` MUST follow this structure.

### A. Frontmatter (YAML)
**Constraint**: DO NOT use 'audience' or 'read_time'. Use 'id' for vector linking.

```yaml
---
# Identity
id: "unique-kebab-id"  # CRITICAL: Used for vector indexing (e.g., 'concept-rhi-texture')
type: "concept" | "architecture" | "guide" | "reference"
title: "Concise Title"

# Semantics
description: "One-sentence summary optimized for RAG retrieval."
tags: ["keyword1", "keyword2"]

# Graph (Use IDs, not filenames)
context_dependency: ["id-of-prerequisite"] # Must read these first to understand this doc
related_ids: ["id-of-related-doc"]       # Optional context
---
