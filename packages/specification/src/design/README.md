# Maxellabs 设计模块

基于OpenUSD格式的设计工具数据规范，支持完整的设计到生产工作流程。

## 模块结构

本模块经过重构，将原来的大文件拆分为功能明确的小模块，每个文件控制在300行以内。

### 核心模块

#### 1. 基础定义 (`base.ts` + `enums.ts`)

- **base.ts**: 基础接口定义 (128行)

  - `DesignConstraints`: 设计约束
  - `ComponentInstance`: 组件实例
  - `DesignComponentProperty`: 组件属性定义
  - `DesignComponentVariant`: 组件变体
  - `DesignIconVariant`: 图标变体
  - `DesignIconCategory`: 图标分类
  - `DesignBounds`: 设计边界框

- **enums.ts**: 所有枚举类型定义 (166行)
  - `DesignElementType`: 设计元素类型
  - `ConstraintType`: 约束类型
  - `ComponentPropertyType`: 组件属性类型
  - `IconStyle`: 图标样式
  - 样式相关枚举（填充、描边、渐变等）

#### 2. 设计元素 (`elements.ts`)

设计元素基础接口和特殊元素类型 (391行)

- `DesignElement`: 设计元素基础接口
- `TextElement`: 文本元素
- `ImageElement`: 图像元素
- `SpriteElement`: 精灵元素
- `IconElement`: 图标元素
- `VectorElement`: 矢量元素
- `GroupElement`: 组元素
- `FrameElement`: 帧元素

#### 3. 样式系统 (`styles.ts`)

视觉样式定义 (372行)

- `DesignStyle`: 设计样式
- `DesignFill`: 设计填充
- `DesignStroke`: 设计描边
- `DesignGradient`: 设计渐变
- `DesignImage`: 设计图像
- `DesignShadow`: 设计阴影
- `DesignBlur`: 设计模糊
- `DesignTextStyle`: 设计文本样式

#### 4. 字体排版 (`typography.ts`)

字体系统和排版配置 (314行)

- `DesignFontFamily`: 设计字体族
- `DesignFontFile`: 设计字体文件
- `DesignTypographyScale`: 设计排版比例
- `DesignTypographySystem`: 设计排版系统
- `TextMetrics`: 文本度量
- `TextRenderConfig`: 文本渲染配置

#### 5. 组件库 (`components.ts`)

组件库管理和组件定义 (334行)

- `DesignComponent`: 设计组件
- `ComponentState`: 组件状态
- `ComponentTransition`: 组件状态转换
- `DesignComponentLibrary`: 设计组件库
- `ComponentCategory`: 组件分类
- `ComponentUsageStats`: 组件使用统计

#### 6. 图标库 (`icons.ts`)

图标库系统 (414行)

- `DesignIcon`: 设计图标
- `IconLicense`: 图标许可
- `IconUsageStats`: 图标使用统计
- `DesignIconLibrary`: 设计图标库
- `IconLibraryConfig`: 图标库配置
- `IconSearchResult`: 图标搜索结果
- `IconFilter`: 图标过滤器
- `IconCollection`: 图标集合

### 子系统模块

#### 7. 颜色系统 (`colors.ts`)

颜色调色板和可访问性 (156行)

- `DesignColorSystem`: 设计颜色系统
- `DesignColorPalette`: 设计调色板
- `ColorUsage`: 颜色用途
- `ColorAccessibility`: 颜色可访问性
- `DesignColorMode`: 颜色模式

#### 8. 间距系统 (`spacing.ts`)

间距和断点系统 (111行)

- `DesignSpacingSystem`: 设计间距系统
- `SpacingUsage`: 间距用途
- `DesignBreakpoints`: 设计断点系统
- `BreakpointUsage`: 断点用途

#### 9. 主题系统 (`themes.ts`)

主题配置和样式库 (174行)

- `DesignTheme`: 设计主题
- `DesignStyleLibrary`: 设计样式库
- `ThemeVariable`: 主题变量
- `ThemeConfig`: 主题配置

#### 10. 页面管理 (`page.ts`)

页面、画板和网格系统 (394行)

- `DesignPage`: 设计页面
- `CanvasSize`: 画布尺寸
- `PageConfig`: 页面配置
- `PageBackground`: 页面背景
- `PageGrid`: 页面网格
- `PageGuide`: 页面指南
- `PageAnnotation`: 页面注释

#### 11. 资产管理 (`assets.ts`)

资产库和分类管理 (155行)

- `AssetLibrary`: 资产库
- `DesignAsset`: 设计资产
- `AssetCategory`: 资产分类
- `AssetLicense`: 资产许可
- `AssetResolution`: 资产分辨率

#### 12. 协作系统 (`collaboration.ts`)

协作者和权限管理 (220行)

- `CollaborationInfo`: 协作信息
- `Collaborator`: 协作者
- `PermissionSettings`: 权限设置
- `SharingSettings`: 共享设置
- `CollaborationHistory`: 协作历史

### 核心系统

#### 13. 设计系统 (`systems.ts`)

完整设计系统核心接口 (243行)

- `DesignSystem`: 设计系统
- `DesignSystemConfig`: 设计系统配置
- `ValidationConfig`: 验证配置
- `ExportConfig`: 导出配置
- `SyncConfig`: 同步配置

#### 14. 设计文档 (`document.ts`)

设计文档管理和配置 (130行)

- `DesignDocument`: 设计文档
- `DocumentConfig`: 文档配置
- `DocumentExportSettings`: 文档导出设置
- `DocumentPluginConfig`: 文档插件配置

## 技术特性

### 1. 模块化架构

- 每个文件功能明确，便于维护
- 大部分文件控制在300行以内
- 清晰的依赖关系和导入结构

### 2. 类型安全

- 完整的TypeScript类型定义
- 与核心模块的接口一致性
- 统一的基础类型使用

### 3. 扩展性

- 支持插件系统
- 灵活的主题和样式覆盖
- 可配置的验证和导出

### 4. 跨平台兼容

- 基于OpenUSD标准
- 支持多种设计工具导入导出
- 统一的数据格式

## 使用示例

### 基础使用

```typescript
import { DesignDocument, DesignSystem, DesignPage, DesignComponent } from '@maxellabs/specification/design';

// 创建设计文档
const document: DesignDocument = {
  id: 'doc-1',
  name: 'Mobile App Design',
  type: 'design',
  version: '1.0.0',
  pages: [],
  designSystem: designSystem,
};
```

### 高级功能

```typescript
import { DesignColorSystem, DesignIconLibrary, CollaborationInfo, ThemeConfig } from '@maxellabs/specification/design';

// 创建完整的设计系统
const designSystem: DesignSystem = {
  name: 'Brand Design System',
  version: '2.0.0',
  colors: colorSystem,
  typography: typographySystem,
  spacing: spacingSystem,
  components: componentLibrary,
  icons: iconLibrary,
  styles: styleLibrary,
  themes: themes,
  breakpoints: breakpoints,
};
```

## 代码规范

- 私有变量不使用下划线前缀
- 使用统一的基础类型（Transform、Color等）
- 保持与core模块的接口一致性
- 遵循ESLint和Prettier配置
