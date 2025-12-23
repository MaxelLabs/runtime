---
id: "tech-stack-monorepo"
type: "reference"
title: "技术栈架构"
description: "Monorepo技术栈完整指南，包含构建系统、测试框架、依赖管理和开发工作流"
tags: ["monorepo", "pnpm", "rollup", "swc", "jest", "typescript", "vite"]
context_dependency: []
related_ids: ["doc-standard"]
---

# Monorepo 技术栈架构

## 🔌 核心接口定义

### 包依赖接口
```typescript
interface PackageDependency {
  name: string;
  version: string;
  dependencies: string[];
  devDependencies: string[];
  buildConfig: BuildConfig;
  testConfig: TestConfig;
}

interface BuildConfig {
  tool: "rollup" | "vite";
  transpiler: "swc" | "babel" | "tsc";
  formats: ("es" | "cjs" | "umd")[];
  sourcemap: boolean;
  minify: boolean;
}

interface TestConfig {
  framework: "jest";
  coverage: number;
  environment: "node" | "jsdom";
  timeout: number;
}
```

### 依赖关系图
```
┌─────────────────────────────────────────┐
│  @maxellabs/specification (基准层)      │
│  - TypeScript 5.0.4                     │
│  - 接口定义与类型规范                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  @maxellabs/math (基础数学库)           │
│  - 依赖: specification                  │
│  - 向量、矩阵、四元数运算                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  @maxellabs/core (核心组件系统)         │
│  - 依赖: specification, math            │
│  - ECS架构、组件管理、实体系统          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  @maxellabs/rhi (渲染硬件接口)          │
│  - 依赖: core                           │
│  - WebGL/WebGPU抽象层                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  @maxellabs/engine (游戏引擎)           │
│  - 依赖: rhi, core, math                │
│  - 完整引擎功能集成                      │
└─────────────────────────────────────────┘
```

## 🏗️ 构建系统

### Rollup + SWC 配置
```typescript
interface RollupConfig {
  input: string;           // "src/index.ts"
  output: OutputOptions[]; // ES + CJS 双格式
  plugins: Plugin[];       // SWC + Babel + GLSL
}

interface SWCConfig {
  jsc: {
    parser: {
      syntax: "typescript";
      tsx: false;
      decorators: true;
    };
    target: "es2020";
    loose: true;
  };
  sourceMaps: true;
}
```

### 构建流程
```
1. 类型检查 (TypeScript)
   ↓
2. 源码转换 (SWC)
   ↓
3. 语法降级 (Babel)
   ↓
4. 资源处理 (GLSL)
   ↓
5. 代码压缩 (Terser) [可选]
   ↓
6. 生成产物 (ES/CJS + SourceMaps)
```

### 构建脚本
```bash
# 单个包构建
pnpm --filter @maxellabs/core build

# 核心依赖构建
pnpm build:core  # specification → math

# 完整构建
pnpm build  # 所有包按依赖顺序构建

# 开发模式
pnpm dev:core  # 核心包并行开发
pnpm dev:all   # 所有包并行开发
```

## 🧪 测试框架

### Jest 配置
```typescript
interface JestConfig {
  testEnvironment: "node" | "jsdom";
  testMatch: string[];           // ["**/*.test.ts"]
  preset: "ts-jest";
  coverage: {
    threshold: 95;              // 分支/函数/行/语句覆盖率
    reporters: ["text", "lcov", "html", "json"];
    exclude: ["index.ts", "types/**"];
  };
  timeout: 10000;                // 10秒超时
  maxWorkers: "50%";             // 并行工作进程
}
```

### 测试工作流
```
1. 单元测试 (Jest + ts-jest)
   ↓
2. 覆盖率收集 (95% 阈值)
   ↓
3. 类型检查 (TypeScript)
   ↓
4. 代码质量 (ESLint + Prettier)
```

### 测试命令
```bash
# 运行测试
pnpm test

# 测试监听
pnpm test:watch

# 覆盖率报告
pnpm test:coverage

# 类型检查
pnpm check:ts

# 代码检查
pnpm lint
pnpm lint:fix
```

## 🔧 代码质量工具

### ESLint + Prettier
```typescript
interface LintConfig {
  parser: "@typescript-eslint/parser";
  plugins: ["@typescript-eslint", "prettier"];
  extends: [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "prettier"
  ];
  rules: {
    "prettier/prettier": "error";
    "@typescript-eslint/no-unused-vars": "warn";
  };
}
```

### 代码规范
- **ESLint**: v8.56.0
- **Prettier**: v3.2.5
- **TypeScript**: v5.4.3 (root) / v5.0.4 (packages)
- **目标**: ESNext
- **模块**: ESNext

## 📦 TypeScript 配置

### 基础配置
```typescript
interface TSConfig {
  compilerOptions: {
    target: "ESNext";
    module: "ESNext";
    lib: ["DOM", "DOM.Iterable", "ES2015", "ESNext"];
    baseUrl: ".";
    paths: {
      "@maxellabs/specification": ["./packages/specification/src"];
      "@maxellabs/core": ["./packages/core/src"];
      "@maxellabs/math": ["./packages/math/src"];
      "@maxellabs/rhi": ["./packages/rhi/src"];
      "@maxellabs/engine": ["./packages/engine/src"];
    };
    strict: true;
    strictNullChecks: true;
    noImplicitAny: true;
    declaration: true;
    composite: true;  // 项目引用
  };
}
```

### 项目引用 (Project References)
```
core → math, specification
engine → rhi, core, math
rhi → core
```

## 🚀 开发工作流

### PNPM Workspace
```yaml
# package.json workspaces
workspaces:
  - "packages/*"
  - "web-packages/*"
  - "plugin-packages/*"
```

### 开发命令矩阵
| 命令 | 用途 | 适用范围 |
|------|------|----------|
| `pnpm dev` | 启动演示应用 | web-packages/demo |
| `pnpm dev:core` | 核心包开发 | specification + math |
| `pnpm dev:all` | 全量开发 | 所有包 |
| `pnpm build:core` | 构建核心依赖 | specification → math |
| `pnpm build:others` | 构建其他包 | core → rhi → engine |
| `pnpm test` | 运行测试 | 所有包 |
| `pnpm lint:fix` | 代码修复 | 所有包 |

### 版本管理
```bash
# 更新版本
pnpm version

# 生成变更日志
pnpm changelog

# 发布包
pnpm publish
pnpm publish:dry  # dry-run
```

### 清理命令
```bash
pnpm clean:nm      # 清理 node_modules
pnpm clean:dist    # 清理构建产物
pnpm clean:artifacts # 清理生成的源码文件
pnpm clean:all     # 全量清理
```

## ⚠️ 禁止事项

### 构建相关
- 🚫 **不要跳过类型检查**: 始终先运行 `tsc --build`
- 🚫 **不要手动修改 dist/**: 所有产物必须通过构建生成
- 🚫 **不要忽略循环依赖**: Rollup 配置已跳过警告，但需代码审查
- 🚫 **不要混用构建工具**: 每个包固定使用 Rollup

### 依赖管理
- 🚫 **不要使用 npm/yarn**: 项目强制使用 PNPM
- 🚫 **不要手动修改 workspace**: 依赖必须通过 package.json 管理
- 🚫 **不要忽略 peerDependencies**: 可能导致版本冲突

### 测试相关
- 🚫 **不要降低覆盖率阈值**: 95% 是底线
- 🚫 **不要跳过测试**: 所有包必须通过测试才能发布
- 🚫 **不要忽略超时设置**: 10秒是默认值，复杂测试可调整

### 代码质量
- 🚫 **不要绕过 ESLint**: 所有代码必须通过检查
- 🚫 **不要忽略 Prettier**: 格式化是强制要求
- 🚫 **不要提交未编译代码**: dist/ 必须在 .gitignore 中

### TypeScript
- 🚫 **不要使用 any**: 优先使用 unknown 或具体类型
- 🚫 **不要忽略 strictNullChecks**: 这是类型安全的基础
- 🚫 **不要跳过声明文件**: 所有包必须生成 .d.ts

## ✅ 最佳实践

### 性能优化
- 使用 SWC 替代 Babel 进行主要转换
- 并行构建独立包
- 使用 composite 项目引用加速类型检查
- 覆盖率采样使用 50% workers

### 开发体验
- 使用路径别名简化导入
- 开发模式使用 Vite 热重载
- 测试监听模式快速反馈
- 清晰的错误信息和堆栈跟踪

### 维护性
- 严格的版本管理 (workspace:*)
- 统一的构建配置 (scripts/rollup-config-helper.js)
- 标准化的测试结构 (test/**/*.test.ts)
- 完整的变更日志生成

### 安全性
- 使用 only-allow pnpm 防止包管理器混用
- Husky pre-commit 钩子检查
- 代码审查要求 (PR 模板)
- 发布前构建验证