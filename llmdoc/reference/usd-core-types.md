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