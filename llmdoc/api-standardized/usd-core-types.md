---
title: 'Usd Core Types'
category: 'api'
description: 'API文档: Usd Core Types'
version: '1.0.0'
last_updated: '2025-12-17'
type: 'api-reference'
priority: 'high'
interfaces:
  - name: 'UsdCoreTypes'
    type: 'typescript'
    description: 'Usd Core Types接口定义'
tags: ['api,reference,typescript']
related_docs: []
---

# Usd Core Types

## 📖 概述 (Overview)

API文档: Usd Core Types

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
// UsdCoreTypes 接口定义
interface API {
  id: string;
  name: string;
  version: string;
  config: Record<string, unknown>;
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

# USD 核心类型参考

## 1. 核心摘要

本文档提供了 USD 规范系统中核心数据类型的完整定义和接口规范，包括基础类型、Prim 系统、属性系统和组合机制等关键组件。

## 2. 源代码定义

### 基础数据类型

**文件**: `packages/specification/src/core/usd.ts:18-36`
```typescript
export enum UsdDataType {
  Bool = 'bool',
  Int = 'int',
  Float = 'float',
  Double = 'double',
  String = 'string',
  Token = 'token',
  Asset = 'asset',
  Vector2f = 'float2',
  Vector3f = 'float3',
  Vector4f = 'float4',
  Matrix4d = 'matrix4d',
  Color3f = 'color3f',
  Color4f = 'color4f',
  Point3f = 'point3f',
  Normal3f = 'normal3f',
  Quatf = 'quatf',
  Array = 'array',
}
```

### Prim 系统

**文件**: `packages/specification/src/core/usd.ts:41-82`
```typescript
export interface UsdPrim {
  path: string;
  typeName: string;
  active: boolean;
  attributes: Record<string, UsdValue>;
  relationships: Record<string, string[]>;
  metadata: Record<string, any>;
  children: UsdPrim[];
  variantSets?: Record<string, UsdVariantSet>;
  references?: UsdReference[];
  payloads?: UsdPayload[];
}
```

### 属性值系统

**文件**: `packages/specification/src/core/usd.ts:9-13`
```typescript
export interface UsdValue {
  type: UsdDataType;
  value: any;
  timeSamples?: Record<number, any>;
}
```

### 变化性枚举

**文件**: `packages/specification/src/core/usd.ts:329-332`
```typescript
export enum UsdVariability {
  Varying = 'varying',  // 随时间变化
  Uniform = 'uniform',  // 恒定不变
}
```

### 组合弧类型

**文件**: `packages/specification/src/core/usd.ts:257-264`
```typescript
export enum UsdCompositionArcType {
  SubLayer = 'subLayer',
  Reference = 'reference',
  Payload = 'payload',
  Inherit = 'inherit',
  Specialize = 'specialize',
  VariantSet = 'variantSet',
}
```

## 3. 常用示例

### 创建基础 Prim
```typescript
const prim: UsdPrim = {
  path: "/MyObject",
  typeName: "Mesh",
  active: true,
  attributes: {
    "points": {
      type: UsdDataType.Vector3f,
      value: [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
    }
  },
  children: []
};
```

### 定义动画属性
```typescript
const animatedPrim: UsdPrim = {
  path: "/AnimatedObject",
  typeName: "Xform",
  active: true,
  attributes: {
    "xformOp:translate": {
      type: UsdDataType.Double3,
      value: (0, 0, 0),
      timeSamples: {
        0: (0, 0, 0),
        60: (10, 0, 0),
        120: (20, 0, 0)
      }
    }
  }
};
```

## 4. 相关文档

- **架构设计**: `/llmdoc/architecture/usd-architecture.md` - USD 系统整体架构
- **数据模型**: `/llmdoc/architecture/usd-data-model.md` - 数据模型和类型系统
- **使用指南**: `/llmdoc/guides/using-usd-specification.md` - USD 规范系统使用方法
- **动画指南**: `/llmdoc/guides/usd-animation.md` - 动画系统使用指南