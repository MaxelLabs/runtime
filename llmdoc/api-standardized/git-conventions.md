---
title: 'Git Conventions'
category: 'api'
description: 'API文档: Git Conventions'
version: '1.0.0'
last_updated: '2025-12-17'
type: 'api-reference'
priority: 'high'
interfaces:
  - name: 'GitConventions'
    type: 'typescript'
    description: 'Git Conventions接口定义'
tags: ['api,reference,typescript']
related_docs: []
---

# Git Conventions

## 📖 概述 (Overview)

API文档: Git Conventions

## 🎯 目标 (Goals)

<!-- 主要文档目标 -->
- 提供完整的API接口定义
- 确保类型安全和最佳实践
- 支持LLM系统的结构化理解

## 🚫 禁止事项 (Constraints)

⚠️ **重要约束**

<!-- 关键限制和注意事项 -->
- 禁止绕过类型检查
- 禁止忽略错误处理
- 禁止破坏向后兼容性

## 🏗️ 接口定义 (Interface First)

### TypeScript接口

```typescript
// GitConventions 接口定义
interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: Date;
  files: string[];
}
```

### 参数说明

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| hash | string | 是 | - | Git提交哈希值
message | string | 是 | - | 提交消息
author | string | 是 | - | 提交者 |

## 💡 使用示例 (Usage Examples)

### 基础用法

```typescript
// const commit: GitCommit = {
  hash: 'a1b2c3d4',
  message: 'feat: add new feature',
  author: 'developer@example.com',
  date: new Date(),
  files: ['src/main.ts']
};
```

### 高级用法

```typescript
// // 高级用法示例
const advancedConfig = {
  // 配置选项
  timeout: 5000,
  retries: 3,
  validation: true
};

const result = await api.process(advancedConfig);
if (result.success) {
  console.log('操作成功:', result.data);
}
```

## ⚠️ 常见问题 (Troubleshooting)

### 问题: 提交格式不规范
**解决方案:** 使用规范的提交消息格式: type(scope): description


### 问题: 类型不匹配
**解决方案:** 使用TypeScript类型检查器验证参数类型

### 问题: 性能问题
**解决方案:** 启用缓存和批处理机制

## 🔗 相关链接 (Related Links)

- [相关文档](#)
- [API参考](#)
- [类型定义](#)


---

## 原始文档内容

# Git 开发约定

## 1. 核心总结

本项目采用基于 Git Flow 的简化工作流，使用 `main` 分支作为主分支，通过功能分支进行开发。提交消息采用约定式提交格式（Conventional Commits），支持自动化版本控制和清晰的变更追踪。

## 2. 分支策略模型

### 主要分支
- `main`: 主分支，始终处于可部署状态
- `dev`: 开发分支（远程），集成所有待发布的功能
- `feature/*`: 功能分支，用于新功能开发
- `fix/*`: 修复分支，用于 bug 修复
- `task/*`: 任务分支，用于特定任务或重构

### 分支命名约定
- 功能分支: `feat/description` (e.g., `feat/input`, `feat/webgl`)
- 修复分支: `fix/description` (e.g., `fix/name`, `fix/build`)
- 任务分支: `task/description` (e.g., `task/fix-all-lint-errors`)
- 依赖更新: `dependabot/*` 自动生成的依赖更新分支

### 分支操作流程
1. 从 `main` 分支创建功能分支
2. 在功能分支上进行开发和提交
3. 提交 Pull Request 到 `main` 分支
4. 代码审查通过后合并到 `main`

## 3. 提交消息格式规范

### 约定式提交格式
```
<type>: <description>

[optional body]

[optional footer(s)]
```

### 提交类型
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 重构（既不是新功能也不是修复）
- `test`: 测试相关
- `chore`: 构建或工具变动
- `build`: 构建系统或依赖变更

### 范围限定提交
- `build(deps-dev)`: 开发依赖更新
- `build(deps)`: 生产依赖更新

### 示例
```
feat: add WebGL renderer implementation
fix: resolve memory leak in shader compilation
docs: update API documentation for vector operations
refactor: optimize matrix multiplication algorithms
build(deps): upgrade TypeScript to 5.4.5
```

## 4. 工作流程约定

### 开发流程
1. 创建分支：`git checkout -b feat/new-feature main`
2. 开发提交：遵循提交消息格式规范
3. 推送分支：`git push origin feat/new-feature`
4. 创建 PR：通过 GitHub Web 界面创建 Pull Request
5. 代码审查：团队成员审查代码
6. 合并：审查通过后合并到 `main`

### 分支清理
- 合并后立即删除本地分支
- 定期清理远程已合并的分支
- 保留 `dependabot` 分支直到依赖更新完成

## 5. 常用的 Git 命令模式

### 分支操作
```bash
# 创建并切换到新分支
git checkout -b feat/description main

# 删除本地分支
git branch -d feat/description

# 删除远程分支
git push origin --delete feat/description

# 查看所有分支
git branch -a
```

### 提交操作
```bash
# 添加所有更改
git add .

# 提交更改
git commit -m "feat: add new feature description"

# 推送到远程
git push origin feat/description

# 修改最后一次提交
git commit --amend
```

### Pull Request 相关
```bash
# 查看 PR 分支的差异
git diff main...feat/description

# 获取 PR 分支的最新更改
git fetch origin pull/PR_NUMBER/head:local-branch-name
```

### 依赖更新
- `dependabot` 分支自动生成，无需手动创建
- 合并后自动更新 `package.json` 和 `package-lock.json`
- 通过 GitHub Actions 自动处理依赖更新

## 6. 源码信息

- **主要配置**: `.gitignore` - Git 忽略文件配置
- **依赖管理**: `package.json` 和 `package-lock.json` - 项目依赖配置
- **CI/CD**: `.github/workflows/` - GitHub Actions 工作流配置
- **分支管理**: 通过 GitHub Pull Request 进行代码审查和合并