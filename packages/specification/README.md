# Maxellabs 3D Engine - 数据规范包

基于 OpenUSD 格式的全流程数据描述包，支持从设计到上线的完整工作流程。

## 概述

本包提供了一套完整的数据描述规范，基于 OpenUSD (Universal Scene Description) 标准扩展，支持：

- **Web 引擎数据描述**：3D 场景、几何体、材质、光照等
- **动效引擎数据**：动画、时间轴、关键帧、缓动函数等
- **设计工具数据**：Figma 设计文档、组件库、设计系统等
- **图标数据系统**：SVG 图标库、分类管理、变体支持等
- **工作流程管理**：从设计到部署的完整流程定义
- **包格式规范**：基于 USDZ 的 .maxz 包格式

## 核心模块

### 1. 基础规范 (`core/`)

基于 OpenUSD 标准的核心类型系统：

```typescript
import { UsdStage, UsdPrim, Transform, Color } from '@maxellabs/specification/core';

// 基础类型支持
const transform: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  scale: [1, 1, 1]
};
```

**特性：**
- 统一的基础类型定义
- 跨模块共享的接口规范
- 标准化的枚举和常量
- OpenUSD 兼容的数据类型

### 2. 设计系统 (`design/`)

模块化的设计工具数据格式支持：

#### 2.1 基础定义 (`design/base.ts` + `design/enums.ts`)
```typescript
import { DesignBounds, DesignConstraints, ComponentInstance } from '@maxellabs/specification/design';
import { DesignElementType, ConstraintType } from '@maxellabs/specification/design';

// 基础接口使用
const bounds: DesignBounds = { x: 0, y: 0, width: 100, height: 40 };
const constraints: DesignConstraints = {
  horizontal: ConstraintType.Left,
  vertical: ConstraintType.Top
};
```

#### 2.2 设计元素 (`design/elements.ts`)
```typescript
import { DesignElement, SpriteElement, IconElement } from '@maxellabs/specification/design';

// 设计元素定义
const element: DesignElement = {
  id: 'element-1',
  name: 'Button',
  type: DesignElementType.Component,
  bounds: { x: 0, y: 0, width: 100, height: 40 },
  visible: true,
  locked: false,
  opacity: 1.0
};
```

#### 2.3 样式系统 (`design/styles.ts`)
```typescript
import { DesignStyle, DesignFill, DesignStroke } from '@maxellabs/specification/design';

// 样式定义
const style: DesignStyle = {
  fills: [
    {
      type: 'solid',
      color: { value: [0.2, 0.4, 0.8, 1.0] },
      opacity: 1.0,
      visible: true
    }
  ],
  cornerRadius: 8
};
```

#### 2.4 颜色系统 (`design/colors.ts`)
```typescript
import { DesignColorSystem, DesignColorPalette } from '@maxellabs/specification/design';

// 颜色系统
const colorSystem: DesignColorSystem = {
  primary: primaryPalette,
  neutral: neutralPalette,
  semantic: {
    success: successPalette,
    warning: warningPalette,
    error: errorPalette,
    info: infoPalette
  }
};
```

#### 2.5 组件库 (`design/components.ts`)
```typescript
import { DesignComponent, DesignComponentLibrary } from '@maxellabs/specification/design';

// 组件库管理
const library: DesignComponentLibrary = {
  name: 'UI Components',
  version: '1.0.0',
  components: {
    'button': buttonComponent,
    'input': inputComponent
  }
};
```

#### 2.6 图标库 (`design/icons.ts`)
```typescript
import { DesignIconLibrary, DesignIcon } from '@maxellabs/specification/design';

// 图标库系统
const iconLibrary: DesignIconLibrary = {
  name: 'App Icons',
  version: '1.0.0',
  icons: {
    'home': {
      id: 'home',
      name: 'Home',
      category: 'navigation',
      sizes: [16, 24, 32, 48],
      svg: '<svg>...</svg>'
    }
  }
};
```

#### 2.7 字体排版 (`design/typography.ts`)
```typescript
import { DesignTypographySystem, DesignFontFamily } from '@maxellabs/specification/design';

// 字体系统
const typography: DesignTypographySystem = {
  fontFamilies: fontFamilies,
  scale: typographyScale,
  textStyles: textStyles
};
```

#### 2.8 主题系统 (`design/themes.ts`)
```typescript
import { DesignTheme, DesignStyleLibrary } from '@maxellabs/specification/design';

// 主题配置
const lightTheme: DesignTheme = {
  name: 'Light Theme',
  type: 'light',
  colors: lightColors,
  typography: typographyOverrides
};
```

#### 2.9 页面管理 (`design/page.ts`)
```typescript
import { DesignPage, PageConfig } from '@maxellabs/specification/design';

// 页面定义
const page: DesignPage = {
  id: 'page-1',
  name: 'Home Page',
  type: 'page',
  canvasSize: { width: 375, height: 812, unit: 'px' },
  elements: pageElements
};
```

#### 2.10 设计系统 (`design/systems.ts`)
```typescript
import { DesignSystem } from '@maxellabs/specification/design';

// 完整设计系统
const designSystem: DesignSystem = {
  name: 'Brand Design System',
  version: '2.0.0',
  colors: colorSystem,
  typography: typographySystem,
  spacing: spacingSystem,
  components: componentLibrary,
  icons: iconLibrary,
  styles: styleLibrary
};
```

#### 2.11 设计文档 (`design/document.ts`)
```typescript
import { DesignDocument } from '@maxellabs/specification/design';

// 设计文档管理
const document: DesignDocument = {
  id: 'doc-1',
  name: 'Mobile App Design',
  type: 'design',
  version: '1.0.0',
  pages: designPages,
  designSystem: designSystem
};
```

### 3. 工作流程系统 (`workflow/`)

完整的工作流程管理：

```typescript
import { Workflow, WorkflowStage } from '@maxellabs/specification/workflow';

// 工作流程定义
const workflow: Workflow = {
  name: 'Design to Production',
  stages: workflowStages,
  triggers: automationTriggers,
  notifications: notificationConfig
};
```

**工作流程阶段：**
- Design（设计）
- Development（开发）
- Review（审查）
- Testing（测试）
- Staging（预发布）
- Production（生产）
- Maintenance（维护）

### 4. 包格式系统 (`package/`)

基于 USDZ 扩展的 .maxz 包格式：

```typescript
import { MaxellabsPackage } from '@maxellabs/specification/package';

// Maxellabs 包
const package: MaxellabsPackage = {
  version: '1.0.0',
  metadata: packageMetadata,
  stage: usdStage,
  designDocuments: designDocs,
  workflows: workflows,
  assetManifest: assetManifest,
  configuration: packageConfig
};
```

**包格式特性：**
- 基于 USDZ 的压缩包格式
- 完整的资产清单和依赖管理
- 多平台兼容性配置
- 安全和性能优化设置
- 版本控制和校验

## 使用示例

### 创建完整的设计到生产流程

```typescript
import {
  DesignDocument,
  UsdStage,
  Workflow,
  MaxellabsPackage
} from '@maxellabs/specification';

// 1. 创建设计文档
const designDoc: DesignDocument = {
  typeName: 'DesignDocument',
  attributes: {
    name: { type: 'string', value: 'Mobile App UI' },
    version: { type: 'string', value: '1.0.0' }
  },
  pages: [
    {
      id: 'home-page',
      name: 'Home Page',
      type: 'page',
      canvasSize: { width: 375, height: 812 },
      elements: designElements
    }
  ],
  designSystem: {
    name: 'App Design System',
    version: '1.0.0',
    colors: colorSystem,
    typography: typographySystem,
    spacing: spacingSystem,
    components: componentLibrary,
    icons: iconLibrary, // 图标库
    styles: styleLibrary
  }
};

// 2. 创建 3D 场景
const stage: UsdStage = {
  rootLayer: rootLayer,
  pseudoRoot: rootPrim,
  timeCodesPerSecond: 60,
  startTimeCode: 0,
  endTimeCode: 300
};

// 3. 定义工作流程
const workflow: Workflow = {
  name: 'Mobile App Development',
  description: 'From design to app store',
  stages: [
    {
      name: 'Design',
      type: 'design',
      tasks: designTasks,
      approvers: ['design-lead']
    },
    {
      name: 'Development',
      type: 'development',
      tasks: devTasks,
      dependencies: ['Design']
    }
  ]
};

// 4. 打包为 .maxz 格式
const package: MaxellabsPackage = {
  version: '1.0.0',
  metadata: {
    name: 'mobile-app-ui',
    version: '1.0.0',
    author: { name: 'Design Team' },
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  },
  stage: stage,
  designDocuments: [designDoc],
  workflows: [workflow],
  assetManifest: assetManifest,
  configuration: packageConfig
};
```

### 图标库使用示例

```typescript
import { DesignIconLibrary, DesignIcon } from '@maxellabs/specification';

// 创建图标库
const iconLibrary: DesignIconLibrary = {
  name: 'App Icons',
  version: '1.0.0',
  icons: {
    'home': {
      id: 'home',
      name: 'Home',
      category: 'navigation',
      tags: ['house', 'main', 'start'],
      sizes: [16, 24, 32, 48],
      svg: '<svg>...</svg>',
      variants: [
        {
          name: 'outline',
          style: 'outline',
          svg: '<svg>...</svg>'
        },
        {
          name: 'filled',
          style: 'filled',
          svg: '<svg>...</svg>'
        }
      ]
    }
  },
  categories: [
    {
      id: 'navigation',
      name: 'Navigation',
      description: 'Navigation related icons'
    }
  ]
};
```

## 技术特性

### 1. 基于 OpenUSD 标准
- 完全兼容 OpenUSD 规范
- 支持 USD 的所有组合功能
- 可与现有 USD 工具链集成

### 2. 全流程数据描述
- 设计工具数据（Figma、Sketch 等）
- 3D 引擎数据（几何体、材质、动画）
- 工作流程管理数据
- 部署和配置数据

### 3. 高性能和可扩展性
- 支持大规模场景和资产
- 延迟加载和流式传输
- 多线程和 GPU 加速支持

### 4. 跨平台兼容性
- Web、iOS、Android、Desktop
- 多种渲染 API（WebGL、WebGPU、Metal、Vulkan）
- 多种浏览器和设备支持

### 5. 安全和版本控制
- 内容安全策略（CSP）
- 资源完整性验证（SRI）
- 完整的版本控制和依赖管理

## 开发和贡献

### 构建项目

```bash
# 安装依赖
pnpm install

# 构建规范包
pnpm build

# 运行测试
pnpm test
```

### 代码规范

- 使用 TypeScript 进行类型安全
- 遵循 ESLint 和 Prettier 配置
- 私有变量不使用下划线前缀
- 使用 getXXX/setXXX 方法替代 getter/setter

## 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。
