---
title: 'Coding Conventions'
category: 'api'
description: 'API文档: Coding Conventions'
version: '1.0.0'
last_updated: '2025-12-17'
type: 'api-reference'
priority: 'high'
interfaces:
  - name: 'CodingConventions'
    type: 'typescript'
    description: 'Coding Conventions接口定义'
tags: ['api,reference,typescript']
related_docs: []
---

# Coding Conventions

## 📖 概述 (Overview)

API文档: Coding Conventions

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
// CodingConventions 接口定义
interface CodeStyle {
  indentSize: number;
  useTabs: boolean;
  semicolons: boolean;
  quotes: 'single' | 'double';
}
```

### 参数说明

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| id | string | 是 | - | 唯一标识符
name | string | 是 | - | 名称
version | string | 否 | "1.0.0" | 版本号 |

## 💡 使用示例 (Usage Examples)

### 基础用法

```typescript
// const api = new API({
  id: 'example',
  name: 'Example API',
  version: '1.0.0'
});
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

### 问题: API调用失败
**解决方案:** 检查参数配置和网络连接


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

## 6. 类型系统最佳实践

### 6.1 继承体系设计

**泛型基类原则**:
- 优先使用泛型接口定义通用行为
- 通过约束（constraints）限制泛型范围
- 使用 `extends` 关键字实现特化

**示例**:
```typescript
// 定义泛型基类
interface BaseAnimationTrack<K extends MinimalKeyframe> {
  id: string;
  keyframes: K[];
  duration: number;
}

// 继承实现特化
interface TransformTrack extends BaseAnimationTrack<TransformKeyframe> {
  space: TransformSpace;
}
```

### 6.2 类型别名使用

**适用场景**:
- 简化复杂泛型类型
- 保持向后兼容性
- 提供语义化名称

**示例**:
```typescript
// 复杂泛型类型简化
type AnimationKeyframe = UnifiedKeyframe<any>;
type MaterialKeyframe = UnifiedKeyframe<any>;

// 语义化命名
type CommonTextureRef = BaseTextureRef & {
  // 扩展属性
};
```

### 6.3 枚举设计

**命名规范**:
- 枚举使用 PascalCase
- 枚举值使用 UPPER_SNAKE_CASE
- 枚举和类型联合区分使用

**示例**:
```typescript
// 基础功能枚举
enum EasingFunction {
  Linear = 'linear',
  EaseInOut = 'easeInOut'
}

// 扩展功能枚举
enum ExtendedEasingType {
  Elastic = 'elastic',
  Bounce = 'bounce'
}

// 完整类型联合
type FullEasingType = EasingFunction | ExtendedEasingType;
```

### 6.4 接口扩展

**扩展原则**:
- 明确继承关系，避免深层嵌套
- 使用 `&` 符号进行交叉类型扩展
- 保持接口单一职责

**示例**:
```typescript
// 错误：深层嵌套
interface A extends B {}
interface B extends C {}
interface C extends D {}

// 正确：扁平化扩展
interface BaseTransform {
  position: Vector3;
  rotation: Quaternion;
}

interface Transform3D extends BaseTransform {
  eulerRotation: Vector3; // 添加新属性
}
```

### 6.5 避免循环依赖

**依赖方向**:
- 核心 → 通用 → 包 → 设计
- 使用重新导出模式组织类型
- 避免相互引用的接口

**示例**:
```typescript
// 核心定义 (core/generics.ts)
export interface UnifiedKeyframe<T> { /* ... */ }

// 通用实现 (common/frame.ts)
import { UnifiedKeyframe } from '../core/generics';
export type AnimationKeyframe = UnifiedKeyframe<any>;

// 包实现 (animation/core.ts)
import { UnifiedKeyframe } from '../core/generics';
export interface UsdKeyframe extends Omit<UnifiedKeyframe<any>, 'tangents'> { /* ... */ }
```

### 6.6 类型安全

**强制类型检查**:
- 启用 strict 模式
- 使用 noImplicitAny
- 使用 noImplicitReturns
- 使用 noUnusedLocals/Parameters

**配置示例**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

## 7. 关键的 Lint 规则

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

## 8. 其他约定

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