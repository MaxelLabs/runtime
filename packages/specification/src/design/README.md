# Design 模块

Maxellabs 3D Engine 的设计系统模块，提供完整的设计工具类型定义和规范。

## 模块概述

Design 模块是基于重构优化的设计系统实现，统一了设计工具、UI 组件、样式系统等相关的类型定义。该模块充分复用了 `common` 和 `core` 模块中的共通类型，减少了重复定义，提高了类型一致性。

## 主要特性

- **类型统一**: 使用 common 和 core 模块的共通类型，避免重复定义
- **设计元素**: 完整的设计元素类型系统（文本、图像、矢量、组件等）
- **样式系统**: 填充、描边、阴影、模糊等视觉样式的完整定义
- **字体排版**: 字体系统、排版配置和文本处理的完整支持
- **组件库**: 设计组件的定义和管理系统
- **图标系统**: 图标库的完整管理方案
- **颜色系统**: 颜色管理和主题系统
- **协作系统**: 设计协作和版本管理功能

## 核心概念

### 设计元素 (Design Elements)

设计元素是设计系统的核心构成单位，包括：

```typescript
// 设计元素类型
enum DesignElementType {
  Frame = 'frame',
  Group = 'group',
  Rectangle = 'rectangle',
  Ellipse = 'ellipse',
  Text = 'text',
  Image = 'image',
  Sprite = 'sprite',
  Icon = 'icon',
  Vector = 'vector',
  Component = 'component',
  Instance = 'instance',
}

// 设计元素基础接口
interface DesignElement {
  type: DesignElementType;
  bounds: DesignBounds;
  style?: DesignStyle;
  constraints?: DesignConstraints;
  children?: DesignElement[];
}
```

### 样式系统 (Style System)

样式系统提供了完整的视觉属性定义：

```typescript
interface DesignStyle {
  fills?: DesignFill[];
  strokes?: DesignStroke[];
  shadows?: DesignShadow[];
  blur?: DesignBlur;
  cornerRadius?: number | number[];
  textStyle?: DesignTextStyle;
}
```

### 字体排版 (Typography)

字体排版系统包含字体管理和文本样式：

```typescript
interface DesignTypographySystem {
  fontFamilies: DesignFontFamily[];
  scale: DesignTypographyScale;
  textStyles: Record<string, DesignTextStyle>;
  baseConfig?: TypographyBaseConfig;
}
```

## 模块结构

```
src/design/
├── index.ts              # 模块入口文件
├── README.md             # 模块文档
├── enums.ts              # 枚举定义
├── base.ts               # 基础类型和接口
├── elements.ts           # 设计元素定义
├── styles.ts             # 样式系统
├── typography.ts         # 字体排版
├── components.ts         # 组件库
├── icons.ts              # 图标系统
├── colors.ts             # 颜色系统
├── spacing.ts            # 间距系统
├── themes.ts             # 主题系统
├── page.ts               # 页面管理
├── assets.ts             # 资产管理
├── collaboration.ts      # 协作系统
├── systems.ts            # 设计系统核心
└── document.ts           # 设计文档
```

## 类型复用

Design 模块充分复用了其他模块的类型定义：

### 从 Common 模块复用

- **图像类型**: `ImageScaleMode`, `ImageFilter`, `ImageFormat`
- **文本类型**: `TextAlign`, `FontStyle`, `FontWeight`, `TextDecoration`, `TextTransform`
- **精灵类型**: `SpriteAtlas`, `SpriteAnimation`, `SpriteType`
- **变换类型**: `CommonTransform`, `TransformConstraint`

### 从 Core 模块复用

- **基础类型**: `Color`, `Transform`, `BlendMode`
- **渲染类型**: `GradientType`, `StrokePosition`, `GradientStop`
- **元数据**: `CommonMetadata`

## 使用示例

### 创建设计元素

```typescript
import { DesignElement, DesignElementType } from '@maxellabs/specification/design';

const textElement: DesignTextElement = {
  type: DesignElementType.Text,
  id: 'text-1',
  name: '标题',
  bounds: { x: 0, y: 0, width: 200, height: 40 },
  content: 'Hello World',
  textStyle: {
    fontFamily: 'Helvetica',
    fontSize: 24,
    fontWeight: FontWeight.Bold,
    textAlign: TextAlign.Center,
  },
};
```

### 定义样式

```typescript
import { DesignStyle, FillType } from '@maxellabs/specification/design';

const buttonStyle: DesignStyle = {
  fills: [{
    type: FillType.Solid,
    color: { r: 0.2, g: 0.6, b: 1.0, a: 1.0 },
    opacity: 1,
    visible: true,
  }],
  cornerRadius: 8,
  shadows: [{
    type: ShadowType.Drop,
    color: { r: 0, g: 0, b: 0, a: 0.1 },
    offsetX: 0,
    offsetY: 2,
    blur: 4,
    visible: true,
  }],
};
```

### 设置排版系统

```typescript
import { DesignTypographySystem } from '@maxellabs/specification/design';

const typographySystem: DesignTypographySystem = {
  fontFamilies: [
    {
      name: 'Helvetica',
      files: [
        {
          weight: 400,
          style: FontStyle.Normal,
          url: '/fonts/helvetica-regular.woff2',
          format: FontFormat.WOFF2,
        },
      ],
      category: FontCategory.SansSerif,
    },
  ],
  scale: {
    base: 16,
    ratio: 1.25,
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 24,
    },
  },
  textStyles: {
    body: {
      fontFamily: 'Helvetica',
      fontSize: 16,
      fontWeight: FontWeight.Normal,
      lineHeight: 1.5,
    },
  },
};
```

## 设计约束

设计约束系统用于定义元素的布局行为：

```typescript
import { DesignConstraints, DesignConstraintType } from '@maxellabs/specification/design';

const constraints: DesignConstraints = {
  horizontal: DesignConstraintType.LeftRight,
  vertical: DesignConstraintType.Top,
};
```

## 组件系统

设计组件支持属性覆盖和变体：

```typescript
import { ComponentInstance } from '@maxellabs/specification/design';

const buttonInstance: ComponentInstance = {
  componentId: 'button-component',
  instanceId: 'button-1',
  overrides: {
    'text-layer': { content: '点击我' },
  },
  variantProperties: {
    state: 'default',
    size: 'medium',
  },
};
```

## 兼容性

为保持向后兼容性，模块提供了类型别名：

```typescript
// 向后兼容的别名
export type ConstraintType = DesignConstraintType;
export type TextElement = DesignTextElement;
export type ImageElement = DesignImageElement;
export type SpriteElement = DesignSpriteElement;
```

## 最佳实践

1. **使用共通类型**: 优先使用 common 和 core 模块中的类型
2. **保持一致性**: 设计元素的命名和结构保持一致
3. **类型安全**: 充分利用 TypeScript 的类型检查
4. **模块化设计**: 按功能模块组织代码结构
5. **文档完整**: 为每个接口和类型提供完整的注释

## 注意事项

- Design 模块是专门为设计工具和 UI 组件设计的，不应用于 3D 渲染场景
- 使用时需要同时安装 common 和 core 模块的依赖
- 设计约束类型 `DesignConstraintType` 与变换约束类型 `TransformConstraintType` 是不同的概念

## 更新日志

### v0.0.6
- 完成 design 模块重构
- 使用 common 和 core 模块的共通类型
- 修复类型冲突和重复定义
- 添加完整的类型文档和使用示例
