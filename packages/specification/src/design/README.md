# Maxellabs 设计模块

设计模块提供设计系统特有的接口和类型定义，专注于设计工具、组件库和设计流程的特定需求。

## 功能概述

设计模块在核心模块基础上，提供设计系统特有的类型定义和工具，支持现代设计工作流程和组件化开发。

## 主要组件

### 设计基础 (base.ts)
设计系统特有的基础接口：

- **DesignConstraints**: 设计约束配置，扩展核心约束类型
- **ComponentInstance**: 组件实例管理
- **DesignComponentProperty**: 设计组件属性定义
- **DesignComponentVariant**: 组件变体系统
- **DesignIconVariant**: 图标变体管理
- **DesignIconCategory**: 图标分类系统

```typescript
import { DesignConstraints, ComponentInstance } from '@maxellabs/specification/design';

// 设计约束配置
const constraints: DesignConstraints = {
  horizontal: 'left-right',  // 使用设计特有的约束类型
  vertical: 'top-bottom'
};

// 组件实例
const buttonInstance: ComponentInstance = {
  componentId: 'button-primary',
  instanceId: 'header-cta-button',
  overrides: {
    text: '立即购买',
    variant: 'large'
  },
  variantProperties: {
    size: 'large',
    color: 'primary'
  }
};
```

### 设计枚举 (enums.ts)
设计系统特有的枚举类型：

- **ComponentPropertyType**: 组件属性类型（Boolean, Text, InstanceSwap, Variant）
- **IconStyle**: 图标样式（Outline, Filled, Duotone, Light, Bold）
- **FillType**: 填充类型（Solid, Gradient, Image, Video）
- **StrokeType**: 描边类型（Solid, Gradient）
- **DesignShadowType**: 阴影类型（Drop, Inner）
- **BlurType**: 模糊类型（Layer, Background）

```typescript
import { IconStyle, FillType, ComponentPropertyType } from '@maxellabs/specification/design';

// 图标配置
const iconConfig = {
  style: IconStyle.Duotone,
  fill: FillType.Gradient
};

// 组件属性
const textProperty = {
  name: 'label',
  type: ComponentPropertyType.Text,
  defaultValue: '按钮'
};
```

### 页面管理 (page.ts)
设计文档和页面管理：

- **DesignPage**: 设计页面定义
- **PageLayout**: 页面布局配置
- **Viewport**: 视口设置
- **Grid**: 网格系统

### 设计元素 (elements.ts)
设计元素系统：

- **DesignElement**: 基础设计元素
- **ElementHierarchy**: 元素层次结构
- **GroupElement**: 元素分组

### 字体排版 (typography.ts)
排版系统：

- **TypographyStyle**: 排版样式
- **FontFamily**: 字体族
- **TextStyle**: 文本样式

### 图标系统 (icons.ts)
图标管理：

- **IconLibrary**: 图标库
- **IconSet**: 图标集合
- **VectorIcon**: 矢量图标

### 样式系统 (styles.ts)
样式定义：

- **StyleSheet**: 样式表
- **DesignToken**: 设计令牌
- **ThemeStyle**: 主题样式

### 间距系统 (spacing.ts)
间距和布局：

- **SpacingScale**: 间距尺度
- **LayoutGrid**: 布局网格
- **ResponsiveBreakpoint**: 响应式断点

### 资产管理 (assets.ts)
设计资产：

- **DesignAsset**: 设计资产
- **AssetLibrary**: 资产库
- **AssetVersion**: 资产版本

### 主题系统 (themes.ts)
主题管理：

- **DesignTheme**: 设计主题
- **ThemeMode**: 主题模式
- **ThemeVariant**: 主题变体

### 设计文档 (document.ts)
文档管理：

- **DesignDocument**: 设计文档
- **DocumentMetadata**: 文档元数据
- **DocumentVersion**: 文档版本

### 颜色系统 (colors.ts)
颜色管理：

- **ColorPalette**: 调色板
- **ColorToken**: 颜色令牌
- **ColorScheme**: 配色方案

### 设计系统 (systems.ts)
设计系统核心：

- **DesignSystem**: 设计系统定义
- **SystemComponent**: 系统组件
- **DesignPattern**: 设计模式

### 协作系统 (collaboration.ts)
设计协作：

- **DesignComment**: 设计评论
- **VersionControl**: 版本控制
- **CollaborationSession**: 协作会话

### 组件库 (components.ts)
组件库管理：

- **ComponentLibrary**: 组件库
- **ComponentCategory**: 组件分类
- **ComponentDocumentation**: 组件文档

## 与核心模块的关系

设计模块继承并扩展了核心模块的类型：

### 重新导出核心类型
```typescript
// 从core模块导入通用类型
import { ElementType, ConstraintType, StyleType } from '@maxellabs/specification/core';

// 重新导出供设计使用
export { ElementType as DesignElementType } from '@maxellabs/specification/core';
export { ConstraintType as DesignConstraintType } from '@maxellabs/specification/core';
```

### 扩展核心接口
```typescript
// 扩展核心约束配置
interface DesignConstraints extends ConstraintConfig {
  horizontal: DesignConstraintType;
  vertical: DesignConstraintType;
}

// 扩展核心组件属性
interface DesignComponentProperty extends BaseComponentProperty {
  type: ComponentPropertyType;
}
```

## 设计原则

### 1. 组件化设计
支持现代组件化设计工作流程，包括变体、实例、覆盖等概念。

### 2. 设计系统支持
提供完整的设计系统支持，包括设计令牌、主题、样式库等。

### 3. 工具集成
与Figma、Sketch等主流设计工具的数据格式兼容。

### 4. 协作友好
支持多人协作、版本控制、评论反馈等协作功能。

## 使用示例

### 创建设计组件
```typescript
import { 
  DesignComponentProperty, 
  ComponentPropertyType,
  DesignComponentVariant 
} from '@maxellabs/specification/design';

// 定义组件属性
const buttonProperties: DesignComponentProperty[] = [
  {
    name: 'text',
    type: ComponentPropertyType.Text,
    defaultValue: '按钮',
    description: '按钮文本'
  },
  {
    name: 'variant',
    type: ComponentPropertyType.Variant,
    defaultValue: 'primary',
    options: ['primary', 'secondary', 'outline']
  },
  {
    name: 'disabled',
    type: ComponentPropertyType.Boolean,
    defaultValue: false
  }
];

// 定义组件变体
const buttonVariants: DesignComponentVariant[] = [
  {
    name: 'Primary',
    properties: {
      backgroundColor: '#007bff',
      color: '#ffffff',
      border: 'none'
    }
  },
  {
    name: 'Secondary', 
    properties: {
      backgroundColor: '#6c757d',
      color: '#ffffff',
      border: 'none'
    }
  }
];
```

### 设计系统配置
```typescript
import { 
  DesignSystem, 
  ColorPalette, 
  TypographyStyle 
} from '@maxellabs/specification/design';

// 创建设计系统
const designSystem: DesignSystem = {
  name: 'Maxellabs Design System',
  version: { major: 1, minor: 0, patch: 0 },
  colors: {
    primary: {
      50: '#e3f2fd',
      500: '#2196f3',
      900: '#0d47a1'
    },
    secondary: {
      50: '#fce4ec',
      500: '#e91e63', 
      900: '#880e4f'
    }
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 700,
      lineHeight: 1.2
    },
    body: {
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 1.5
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  }
};
```

### 图标库管理
```typescript
import { 
  IconLibrary, 
  DesignIconVariant, 
  IconStyle 
} from '@maxellabs/specification/design';

// 创建图标库
const iconLibrary: IconLibrary = {
  name: 'Maxellabs Icons',
  version: '1.0.0',
  categories: [
    {
      id: 'actions',
      name: '操作',
      description: '用户操作相关图标'
    }
  ],
  icons: [
    {
      id: 'edit',
      name: '编辑',
      category: 'actions',
      variants: [
        {
          name: 'outline',
          style: IconStyle.Outline,
          svg: '<svg>...</svg>'
        },
        {
          name: 'filled',
          style: IconStyle.Filled,
          svg: '<svg>...</svg>'
        }
      ]
    }
  ]
};
```

## 模块特色

### 1. 现代设计工作流程
支持基于组件的现代设计工作流程，包括设计系统、变体管理等。

### 2. 工具链集成
与主流设计工具和开发工具的无缝集成。

### 3. 协作支持
内置协作功能，支持团队设计工作流程。

### 4. 可扩展性
模块化设计，支持自定义扩展和插件开发。

## 版本历史

- **v1.2.0**: 重构模块，将通用类型移至core模块
- **v1.1.0**: 添加协作系统支持
- **v1.0.0**: 初始版本，基础设计系统支持

## 注意事项

1. **导入顺序**: 需要先导入core模块的基础类型
2. **设计规范**: 遵循现代设计系统的最佳实践
3. **兼容性**: 确保与主流设计工具的兼容性
4. **性能考虑**: 大型设计文档可能影响性能，需要合理分割和懒加载
