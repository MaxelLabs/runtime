---
# Identity
id: "reference-layout-components"
type: "reference"
title: "Layout Components Reference"

# Semantics
description: "UI 布局组件接口定义和实现，包括 Anchor、FlexContainer、FlexItem、LayoutResult"
tags: ["reference", "components", "layout", "ui", "flexbox", "anchor"]
context_dependency: ["data-models-core"]
related_ids: ["architecture-logic-systems"]
---

## 1. Core Summary

布局组件用于 UI 元素的定位和尺寸计算，支持两种布局模式：
- **约束布局 (Anchor)**: 通过锚点和边距相对父级定位
- **Flex 布局 (Flexbox)**: 标准的 Flexbox 容器和子项系统

## 2. Source of Truth

**Primary Code:**
- `packages/core/src/components/layout/index.ts` - 所有布局组件的完整实现
- `packages/core/src/systems/layout/index.ts` - LayoutSystem 算法实现

**Related Architecture:**
- `llmdoc/architecture/logic-systems.md` - System 执行流程和依赖关系

**Component Categories:**
| Category | Components | Purpose |
|----------|------------|---------|
| **约束** | Anchor, SizeConstraint, Margin, Padding | 定义元素的尺寸和位置约束 |
| **Flex** | FlexContainer, FlexItem | 定义 Flex 容器和子项行为 |
| **结果** | LayoutResult | 存储计算后的位置和尺寸 |

## 3. Layout Interfaces

### Anchor Layout
```typescript
interface IAnchor {
  minX: number;  // 左边界锚点 (0-1)
  maxX: number;  // 右边界锚点 (0-1)
  minY: number;  // 下边界锚点 (0-1)
  maxY: number;  // 上边界锚点 (0-1)
}

interface ISizeConstraint {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

interface IEdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
```

### Flexbox Layout
```typescript
type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
type FlexAlign = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
type FlexJustify = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

interface IFlexContainer {
  direction: FlexDirection;
  wrap: FlexWrap;
  justifyContent: FlexJustify;
  alignItems: FlexAlign;
  alignContent?: FlexAlign;
  gap?: number;
}

interface IFlexItem {
  grow: number;          // 伸展比例
  shrink: number;        // 收缩比例
  basis: number | 'auto';
  alignSelf?: FlexAlign | 'auto';
  order?: number;
}
```

### Layout Result
```typescript
interface ILayoutResult {
  x: number;      // 相对于父级的 X 坐标
  y: number;      // 相对于父级的 Y 坐标
  width: number;
  height: number;
}
```

## 4. Layout Algorithm

```pseudocode
// Anchor 布局计算
FOR each entity WITH (Anchor, LayoutResult):
  parentSize = getParentSize(entity)
  margin = getMargin(entity)

  anchorLeft = anchor.minX * parentSize.width
  anchorRight = anchor.maxX * parentSize.width
  anchorTop = anchor.minY * parentSize.height
  anchorBottom = anchor.maxY * parentSize.height

  result.x = anchorLeft + margin.left
  result.y = anchorTop + margin.top
  result.width = anchorRight - anchorLeft - margin.left - margin.right
  result.height = anchorBottom - anchorTop - margin.top - margin.bottom

  applySizeConstraint(result)

// Flex 布局计算
FOR each entity WITH (FlexContainer, Children):
  children = collectFlexChildren()
  isRow = container.direction IN ['row', 'row-reverse']
  mainSize = isRow ? container.width : container.height

  totalBasis = SUM(children.basis)
  freeSpace = mainSize - totalBasis - gap * (length - 1)

  IF freeSpace > 0:
    distributeGrowSpace(children, freeSpace)
  ELSE IF freeSpace < 0:
    distributeShrinkSpace(children, freeSpace)

  applyJustifyContent(children, container.justifyContent)
  applyAlignItems(children, container.alignItems)
```

## 5. Negative Constraints

- 🚫 **Anchor 值超出 0-1 范围**: 会导致布局超出父级边界
- 🚫 **Flex basis 为负数**: 未定义行为
- 🚫 **同时设置 Anchor 和 FlexItem**: 导致布局冲突
- 🚫 **直接修改 LayoutResult**: 结果会被 LayoutSystem 覆盖
- 🚫 **grow/shrink 为负数**: 未定义行为
