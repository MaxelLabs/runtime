# 编码约定

## 1. 核心摘要

本项目采用 TypeScript + ESNext 语法，使用 ESLint 和 Prettier 进行代码格式化和质量控制。项目遵循模块化设计，采用命名空间导出模式，使用 pnpm 作为包管理器。代码风格强调类型安全、性能优化和清晰的模块边界。

## 2. TypeScript 代码风格要求

### 编译配置
- **目标版本**: ESNext
- **模块系统**: ESNext modules
- **模块解析**: node
- **装饰器支持**: 启用实验性装饰器
- **路径映射**: `@/*` 指向 `src/*`

### 类型要求
- 强制使用 TypeScript 类型定义
- 推使用 interface 定义对象类型
- 使用 `type` 定义联合类型和类型别名
- 禁用默认库检查以提高性能

## 3. 项目特定的编码约定

### 对象池模式
- 数学对象使用对象池模式进行复用
- 静态工厂方法创建常量对象（已冻结）
- 实现了 `Poolable` 接口的类支持对象池

### 内存对齐
- 向量类使用 `Float32Array(4)` 确保内存对齐
- 预留填充字节以优化 SIMD 访问

### 命名空间导出
- 使用 `export as namespace` 模式组织导出
- 如：`export * as MMath from '@maxellabs/math'`
- 每个包有明确的导出接口

## 4. 导入/导出规范

### 导入格式
```typescript
// 类型导入
import type { Component } from './component';

// 具体导入
import { ComponentLifecycleState } from './component';

// 路径别名
import type { Scene } from '../scene/';
```

### 导出约定
- 使用 `export * as` 导出第三方库
- 每个模块有明确的 index.ts 导出文件
- 避免使用默认导出，统一使用命名空间导出

## 5. 命名约定

### 类命名
- 使用 PascalCase，如 `Entity`、`Vector3`
- 后缀约定：
  - Manager：管理器类（如 `SceneManager`）
  - Component：组件类（如 `MeshRenderer`）
  - Renderer：渲染器类（如 `ForwardRenderer`）
  - Resource：资源类（如 `Texture2D`）

### 方法命名
- 使用 camelCase，如 `addComponent`、`removeComponent`
- 布尔方法使用 is/has 前缀，如 `isActive`、`hasChildren`

### 常量命名
- 使用 UPPER_SNAKE_CASE，如 `X`、`Y`、`ZERO`
- 静态 readonly 常量使用 `Object.freeze()` 冻结

### 私有成员
- 使用 `private` 修饰符
- 命名使用 camelCase，如 `transform`、`parent`

## 6. 关键的 Lint 规则

### ESLint 配置
- 解析器：`@typescript-eslint/parser`
- 扩展：`plugin:prettier/recommended`
- 环境支持：browser 和 node
- 启用 JSX 支持

### Prettier 配置
- 使用单引号
- 使用分号
- 尾随逗号：ES5 标准
- 最大行宽：默认（未指定）

### 代码质量规则
- 强制格式一致性（prettier 集成）
- 支持 TypeScript 语法
- 跨环境兼容性（浏览器和 Node.js）
- 优先使用格式化工具而非手动格式化

## 7. 其他约定

### 文件结构
- 所有代码源文件位于 `src/` 目录
- 类型声明文件输出到 `types/` 目录
- 测试文件排除在构建外
- 支持源码映射

### 元注释
- 使用 JSDoc 格式的类型注释
- 为公共接口提供详细文档
- 标记重要特性和使用注意事项

### 依赖管理
- 使用 pnpm 工作空间管理
- 遵循 monorepo 结构
- 支持模块化和增量构建