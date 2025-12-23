---
id: "refactor-specification-types"
type: "agent-report"
title: "Specification Package Type Deduplication Refactor"
description: "Refactor report for eliminating duplicate type definitions in @maxellabs/specification package"
tags: ["refactor", "types", "deduplication", "specification", "material", "constraint"]
created: "2024-12-23"
updated: "2024-12-23"
status: "完成 ✅"
related_ids: ["audit-core-types", "data-models-core"]
---

# Specification 包类型去重重构报告

## 📊 重构概要

| 分类 | 变更 | 状态 |
|------|------|------|
| ✅ 材质类型枚举统一 | 删除 `MaterialType`, `AlphaMode` | 已完成 |
| ✅ 约束类型重命名 | `ConstraintType` → `LayoutConstraintType` | 已完成 |
| ✅ DesignElement 继承优化 | 减少 Omit 排除属性 | 已完成 |
| ✅ 向后兼容别名 | 添加废弃类型别名 | 已完成 |

---

## ✅ 已完成 - 材质类型枚举统一

### 问题描述
`core/enums.ts` 和 `core/material.ts` 中存在重复的枚举定义：

| 删除的枚举 | 统一使用 | 位置 |
|-----------|---------|------|
| `MaterialType` | `UnifiedMaterialType` | `core/material.ts` |
| `AlphaMode` | `MaterialAlphaMode` | `core/material.ts` |

### 变更文件

#### `core/enums.ts`
```typescript
// ❌ 已删除
export enum MaterialType {
  Standard = 'standard',
  Unlit = 'unlit',
  Physical = 'physical',
  // ...
}

export enum AlphaMode {
  Opaque = 'opaque',
  Mask = 'mask',
  Blend = 'blend',
}
```

#### `core/interfaces.ts`
```typescript
// ✅ 更新后
import type { UnifiedMaterialType } from './material';

export interface MaterialProperties extends Nameable {
  type: UnifiedMaterialType;  // 原为 MaterialType
  // ...
}
```

---

## ✅ 已完成 - 约束类型重命名

### 问题分析
存在三种语义不同的约束类型，不应合并：

| 类型 | 语义 | 用途 |
|------|------|------|
| `LayoutConstraintType` | 布局位置约束 | Left/Right/Center/Top/Bottom |
| `CommonConstraintType` | 值类型约束 | Fixed/Percentage/Parent/Relative/Auto |
| `TransformConstraintType` | 变换约束 | Position/Rotation/Scale/LookAt/Path/Parent |

### 变更内容

#### `core/enums.ts`
```typescript
// ✅ 重命名为更明确的名称
export enum LayoutConstraintType {
  Left = 'left',
  Right = 'right',
  Center = 'center',
  Top = 'top',
  Bottom = 'bottom',
  LeftRight = 'leftRight',
  TopBottom = 'topBottom',
  Scale = 'scale',
}

// ✅ 向后兼容别名
/** @deprecated 使用 LayoutConstraintType 代替 */
export type ConstraintType = LayoutConstraintType;
/** @deprecated 使用 LayoutConstraintType 代替 */
export const ConstraintType = LayoutConstraintType;
```

#### `design/base.ts`
```typescript
// ✅ 更新引用
import type { LayoutConstraintType } from '../core';

export interface DesignConstraints extends ConstraintConfig {
  horizontal: LayoutConstraintType;
  vertical: LayoutConstraintType;
}
```

---

## ✅ 已完成 - DesignElement 继承优化

### 问题描述
`DesignElement` 使用 `Omit<CommonElement, ...>` 排除了过多属性，导致类型不一致。

### 变更内容

#### `design/elements.ts`
```typescript
// ❌ 原代码 - 排除4个属性
export interface DesignElement extends Omit<CommonElement, 'type' | 'children' | 'constraints' | 'transform'> {
  type: DesignElementType;
  transform: ITransform;  // 重新定义
  // ...
}

// ✅ 优化后 - 只排除2个属性
export interface DesignElement extends Omit<CommonElement, 'children' | 'constraints'> {
  style?: DesignStyle;
  constraints?: DesignConstraints;
  children?: DesignElement[];
  componentInstance?: ComponentInstance;
}
```

### 优化理由
- `type` 和 `transform` 属性在 `CommonElement` 中的定义已经兼容
- 减少 Omit 排除的属性数量，提高类型一致性
- 移除不必要的导入（`ITransform`, `CommonBounds` 等）

---

## 📋 修改文件清单

### Specification 包修改

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `core/enums.ts` | 删除 + 重命名 | 删除 `MaterialType`, `AlphaMode`; 重命名 `ConstraintType` |
| `core/interfaces.ts` | 更新引用 | `MaterialProperties.type` 使用 `UnifiedMaterialType` |
| `design/base.ts` | 更新引用 | `DesignConstraints` 使用 `LayoutConstraintType` |
| `design/elements.ts` | 优化继承 | 减少 `Omit` 排除属性，清理导入 |

---

## 🏗️ 类型层次结构（更新后）

```
core/
├── enums.ts
│   ├── LayoutConstraintType     ← 布局位置约束（重命名自 ConstraintType）
│   ├── CommonConstraintType     ← 值类型约束
│   └── TransformConstraintType  ← 变换约束
│
├── material.ts
│   ├── UnifiedMaterialType      ← 材质类型（唯一来源）
│   └── MaterialAlphaMode        ← 透明模式（唯一来源）
│
└── interfaces.ts
    └── MaterialProperties       ← 使用 UnifiedMaterialType
         ↓
common/
├── material.ts                  ← 重新导出 core 类型
└── elements.ts
    └── CommonElement
         ↓
design/
├── base.ts
│   └── DesignConstraints        ← 使用 LayoutConstraintType
└── elements.ts
    └── DesignElement            ← 继承 CommonElement（优化后）
```

---

## ⚠️ 迁移指南

### 材质类型迁移
```typescript
// ❌ 旧代码
import { MaterialType, AlphaMode } from '@maxellabs/specification';
const mat = { type: MaterialType.Standard, alphaMode: AlphaMode.Opaque };

// ✅ 新代码
import { UnifiedMaterialType, MaterialAlphaMode } from '@maxellabs/specification';
const mat = { type: UnifiedMaterialType.Standard, alphaMode: MaterialAlphaMode.Opaque };
```

### 约束类型迁移
```typescript
// ❌ 旧代码（仍可用，但已废弃）
import { ConstraintType } from '@maxellabs/specification';
const constraint = ConstraintType.Left;

// ✅ 新代码
import { LayoutConstraintType } from '@maxellabs/specification';
const constraint = LayoutConstraintType.Left;
```

---

## ✅ 验证清单

- [x] TypeScript 编译通过
- [x] 所有重复枚举已删除
- [x] 向后兼容别名已添加
- [x] 类型引用已更新
- [x] DesignElement 继承已优化