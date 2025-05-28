# Package 模块

## 概述

Package 模块定义了 Maxellabs 3D Engine 的包格式规范，基于 USDZ 扩展的 `.maxz` 包格式，支持完整的设计到上线流程。

## 主要功能

### 包格式定义
- **MaxellabsPackage**: 完整的包结构定义
- **包元数据管理**: 版本、作者、依赖关系等
- **资产清单**: 完整的资产管理和索引系统

### 配置系统
- **构建配置**: 支持多种构建目标和模式
- **运行时配置**: 渲染器、加载器、缓存等配置
- **优化配置**: 纹理、几何体、材质、动画优化
- **安全配置**: CSP、SRI、访问控制等

### 兼容性支持
- **多平台支持**: Web、iOS、Android、Desktop、VR、AR
- **浏览器兼容性**: 详细的浏览器版本支持
- **设备类型适配**: 移动端、桌面端、TV、VR/AR等

## 核心类型

### 包结构
```typescript
// 主包格式
MaxellabsPackage
├── PackageMetadata        // 包元数据
├── UsdStage              // USD主场景
├── DesignDocument[]      // 设计文档
├── Workflow[]            // 工作流程
├── AssetManifest         // 资产清单
└── PackageConfiguration  // 包配置
```

### 资产管理
```typescript
// 资产清单结构
AssetManifest
├── AssetEntry[]          // 资产条目
├── AssetStatistics       // 资产统计
└── AssetIndex           // 资产索引
```

## 使用示例

### 创建包元数据（使用命名空间）
```typescript
import { Package } from '@maxellabs/specification';

const metadata: Package.PackageMetadata = {
  name: 'my-3d-project',
  version: '1.0.0',
  description: 'A 3D scene project',
  author: {
    name: 'Developer',
    email: 'dev@example.com'
  },
  compatibility: {
    minEngineVersion: '1.0.0',
    platforms: [Package.Platform.Web, Package.Platform.iOS],
    deviceTypes: [Package.DeviceType.Mobile, Package.DeviceType.Desktop]
  }
};
```

### 配置优化选项（使用命名空间）
```typescript
import { Package } from '@maxellabs/specification';

const optimization: Package.OptimizationConfiguration = {
  texture: {
    compression: [Package.TextureCompression.DXT, Package.TextureCompression.ETC],
    maxSize: 2048,
    generateMipmaps: true
  },
  geometry: {
    mergeVertices: true,
    optimizeIndices: true,
    compression: true
  }
};
```

## 设计原则

1. **向后兼容**: 支持版本升级和兼容性检查
2. **模块化**: 配置项可独立使用和组合
3. **平台无关**: 统一的包格式支持多平台部署
4. **性能优化**: 内置多种优化策略和配置选项

## 与其他模块的关系

- **依赖 core**: 使用基础类型和接口
- **依赖 Design**: 包含设计文档定义（使用 Design 命名空间）
- **依赖 Workflow**: 集成工作流程管理（使用 Workflow 命名空间）
- **被 engine 使用**: 作为引擎的包加载格式

## 命名空间使用

从 v0.0.6 开始，Package 模块通过命名空间导出，避免与其他模块的命名冲突：

```typescript
// 推荐的导入方式
import { Package } from '@maxellabs/specification';

// 使用时加上命名空间前缀
const config: Package.BuildConfiguration = { ... };
const platform = Package.Platform.Web;
```

## 注意事项

- 包格式基于 USDZ，确保与 USD 生态系统兼容
- 配置项支持运行时动态调整
- 资产管理支持增量更新和热加载
- 安全配置遵循 Web 安全最佳实践
- 使用命名空间导出避免类型名称冲突 