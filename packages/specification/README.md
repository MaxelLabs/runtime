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

### 1. USD 核心扩展 (`usd.ts`)

基于 OpenUSD 标准的核心数据类型和 Prim 系统：

```typescript
import { UsdStage, UsdPrim, UsdLayer } from '@maxellabs/specification';

// USD Stage 管理
const stage: UsdStage = {
  rootLayer: rootLayer,
  pseudoRoot: rootPrim,
  timeCodesPerSecond: 24,
  startTimeCode: 0,
  endTimeCode: 100
};
```

**特性：**
- 完整的 USD 数据类型支持
- Prim 层次结构管理
- 组合弧（Composition Arcs）支持
- 变体集合（Variant Sets）
- 引用和载荷系统

### 2. 几何体系统 (`geometry.ts`)

支持多种几何体类型和高级功能：

```typescript
import { MeshPrim, GeometryCollection } from '@maxellabs/specification';

// 网格几何体
const mesh: MeshPrim = {
  typeName: 'Mesh',
  vertices: vertices,
  faces: faces,
  normals: normals,
  uvs: uvs,
  materialBinding: materialPath
};
```

**支持的几何体类型：**
- Mesh（网格）
- Curve（曲线）
- Points（点云）
- Sphere、Cube、Cylinder 等基础几何体
- 实例化和 LOD 支持
- 物理属性和碰撞检测

### 3. 材质着色器系统 (`material.ts`)

完整的材质和着色器网络支持：

```typescript
import { Material, ShaderNetwork } from '@maxellabs/specification';

// 材质定义
const material: Material = {
  typeName: 'Material',
  shaderNetwork: {
    nodes: shaderNodes,
    connections: connections
  },
  variants: materialVariants
};
```

**特性：**
- 着色器网络编辑
- 预定义着色器（PBR、Unlit 等）
- 材质变体和参数化
- 程序化材质支持
- 材质动画

### 4. 设计系统 (`design.ts`)

支持 Figma 等设计工具的数据格式：

```typescript
import { DesignDocument, DesignSystem } from '@maxellabs/specification';

// 设计文档
const designDoc: DesignDocument = {
  typeName: 'DesignDocument',
  pages: designPages,
  designSystem: designSystem,
  assetLibrary: assetLibrary
};
```

**包含功能：**
- 设计页面和画板管理
- 设计元素（Frame、Group、Shape 等）
- 样式系统（颜色、字体、间距）
- 组件库和变体
- **图标库系统**：
  - SVG 图标存储
  - 图标分类和标签
  - 多种样式变体（outline、filled、duotone 等）
  - 多尺寸支持
- 交互和动画定义

### 5. 工作流程系统 (`workflow.ts`)

完整的工作流程管理：

```typescript
import { Workflow, WorkflowStage } from '@maxellabs/specification';

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

### 6. 包格式系统 (`package.ts`)

基于 USDZ 扩展的 .maxz 包格式：

```typescript
import { MaxellabsPackage } from '@maxellabs/specification';

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
