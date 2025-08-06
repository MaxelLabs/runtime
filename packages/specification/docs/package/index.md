# 包格式模块文档

包格式模块定义了Maxellabs的完整包格式规范(.maxz)，基于USDZ扩展，支持从设计到上线的完整工作流程。

## 接口总览

| 接口名称                                                     | 描述     | 主要属性                                             |
| ------------------------------------------------------------ | -------- | ---------------------------------------------------- |
| [MaxellabsPackage](./interfaces.md#maxellabspackage)         | 主包定义 | version, metadata, stage, designDocuments, workflows |
| [PackageMetadata](./interfaces.md#packagemetadata)           | 包元数据 | name, version, author, compatibility, checksum       |
| [AssetManifest](./interfaces.md#assetmanifest)               | 资产清单 | assets, statistics, index                            |
| [PackageConfiguration](./interfaces.md#packageconfiguration) | 包配置   | build, runtime, optimization, security, debug        |

## 枚举总览

| 枚举名称                                            | 描述         | 可选值                                                                                                     |
| --------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| [FrameAnimationType](./enums.md#frameanimationtype) | 帧动画类型   | Sequence, Keyframe, Skeletal, Morph, Procedural, Physics                                                   |
| [AssetEntryType](./enums.md#assetentrytype)         | 资产条目类型 | Design, Image, Video, Audio, Font, Icon, Component, Code, USD, Model, Material, Texture, Shader, Animation |
| [BuildTarget](./enums.md#buildtarget)               | 构建目标     | Web, Node, Electron, ReactNative, Unity, Unreal                                                            |
| [BuildMode](./enums.md#buildmode)                   | 构建模式     | Development, Production, Test                                                                              |
| [RendererType](./enums.md#renderertype)             | 渲染器类型   | WebGL, WebGL2, WebGPU, Canvas2D, SVG                                                                       |
| [Platform](./enums.md#platform)                     | 平台类型     | Web, Desktop, Mobile, Tablet, TV, VR, AR                                                                   |
| [DependencyType](./enums.md#dependencytype)         | 依赖类型     | Runtime, Development, Peer, Optional                                                                       |
| [TextureCompression](./enums.md#texturecompression) | 纹理压缩格式 | DXT, ETC, PVRTC, ASTC, BC7                                                                                 |
| [LogLevel](./enums.md#loglevel)                     | 日志级别     | Error, Warn, Info, Debug, Trace                                                                            |

## 核心接口详解

### MaxellabsPackage

Maxellabs包的主定义，包含从设计到上线的完整数据。

```typescript
interface MaxellabsPackage {
  version: string; // 包格式版本
  metadata: PackageMetadata; // 包元数据
  stage: UsdStage; // USD主场景
  designDocuments: DesignDocument[]; // 设计文档
  workflows: Workflow[]; // 工作流程
  assetManifest: AssetManifest; // 资产清单
  configuration: PackageConfiguration; // 包配置
}
```

### PackageMetadata

包的元数据信息，包含作者、兼容性、依赖等关键信息。

```typescript
interface PackageMetadata {
  name: string; // 包名称
  version: string; // 包版本
  description?: string; // 描述
  author: AuthorInfo; // 作者信息
  license?: string; // 许可证
  keywords?: string[]; // 关键词
  homepage?: string; // 主页
  repository?: RepositoryInfo; // 仓库信息
  createdAt: string; // 创建时间
  modifiedAt: string; // 修改时间
  size: number; // 包大小
  fileCount: number; // 文件数量
  checksum: string; // 校验和
  dependencies?: PackageDependency[]; // 依赖
  compatibility: CompatibilityInfo; // 兼容性信息
}
```

### AssetManifest

资产清单，管理包内所有资产的索引和统计信息。

```typescript
interface AssetManifest {
  assets: AssetEntry[]; // 资产列表
  statistics: AssetStatistics; // 资产统计
  index: AssetIndex; // 资产索引
}
```

### PackageConfiguration

完整的包配置，涵盖构建、运行、优化、安全、调试各个方面。

```typescript
interface PackageConfiguration {
  build: BuildConfiguration; // 构建配置
  runtime: RuntimeConfiguration; // 运行时配置
  optimization: OptimizationConfiguration; // 优化配置
  security: SecurityConfiguration; // 安全配置
  debug: DebugConfiguration; // 调试配置
}
```

## 枚举值详解

### BuildTarget

支持的构建目标平台：

- **Web** - Web浏览器
- **Node** - Node.js环境
- **Electron** - 桌面应用
- **ReactNative** - 移动应用
- **Unity** - Unity游戏引擎
- **Unreal** - Unreal引擎

### Platform

支持的平台类型：

- **Web** - Web平台
- **Desktop** - 桌面平台
- **Mobile** - 移动平台
- **Tablet** - 平板平台
- **TV** - 电视平台
- **VR** - 虚拟现实
- **AR** - 增强现实

### AssetEntryType

支持的资产类型：

- **基础类型** - Design, Image, Video, Audio, Font, Icon, Component, Code, Documentation, Configuration
- **USD格式** - USD, USDA, USDC
- **3D相关** - Model, Material, Texture, Shader, Animation

### TextureCompression

纹理压缩格式：

- **DXT** - DXT/BC格式（桌面）
- **ETC** - ETC格式（移动）
- **PVRTC** - PowerVR格式（iOS）
- **ASTC** - ASTC格式（现代移动）
- **BC7** - BC7格式（高质量）

## 使用示例

### 基础包配置

```typescript
const packageConfig: MaxellabsPackage = {
  version: '1.0.0',
  metadata: {
    name: 'maxellabs-ui-kit',
    version: '2.1.0',
    description: 'Maxellabs UI组件库',
    author: {
      name: 'Maxellabs Team',
      email: 'team@maxellabs.com',
      organization: 'Maxellabs',
    },
    license: 'MIT',
    keywords: ['ui', 'components', 'maxellabs'],
    createdAt: '2024-07-15T10:00:00Z',
    modifiedAt: '2024-07-15T10:00:00Z',
    size: 1024000,
    fileCount: 150,
    checksum: 'sha256:abcdef123456...',
    compatibility: {
      minEngineVersion: '1.0.0',
      platforms: [Platform.Web, Platform.Desktop, Platform.Mobile],
      browsers: [
        { name: 'Chrome', minVersion: '90' },
        { name: 'Firefox', minVersion: '88' },
      ],
    },
  },
  stage: {
    /* USD场景数据 */
  },
  designDocuments: [
    /* 设计文档 */
  ],
  workflows: [
    /* 工作流程 */
  ],
  assetManifest: {
    assets: [
      /* 资产列表 */
    ],
    statistics: {
      /* 统计信息 */
    },
    index: {
      /* 索引信息 */
    },
  },
  configuration: {
    build: {
      target: BuildTarget.Web,
      mode: BuildMode.Production,
      outputDir: './dist',
      sourceMap: false,
      minify: true,
      codeSplitting: true,
      treeShaking: true,
      env: { NODE_ENV: 'production' },
    },
    runtime: {
      renderer: {
        type: RendererType.WebGL2,
        antialias: true,
        alpha: false,
        depth: true,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: PowerPreference.Default,
      },
      loader: {
        concurrency: 4,
        timeout: 30000,
        retries: 3,
        preload: true,
        lazyLoad: true,
        cacheStrategy: CacheStrategy.LRU,
      },
      cache: {
        enabled: true,
        maxSize: 100,
        ttl: 3600,
        strategy: CacheStrategy.LRU,
        keyPrefix: 'maxellabs',
      },
      performance: {
        targetFPS: 60,
        maxMemory: 512,
        gpuMemoryLimit: 256,
        adaptiveQuality: true,
        monitoring: true,
      },
    },
    optimization: {
      texture: {
        compression: [TextureCompression.DXT, TextureCompression.ASTC],
        maxSize: 2048,
        generateMipmaps: true,
        formatConversion: true,
      },
      geometry: {
        level: GeometryOptimization.High,
        mergeMeshes: true,
        simplify: true,
        lod: true,
      },
      material: {
        mergeMaterials: true,
        removeUnused: true,
        shaderOptimization: true,
      },
      animation: {
        keyframeOptimization: true,
        compression: true,
        sampleRateOptimization: true,
      },
    },
    security: {
      csp: {
        enabled: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'"],
          'style-src': ["'self'", "'unsafe-inline'"],
        },
      },
      sri: {
        enabled: true,
        algorithm: HashAlgorithm.SHA256,
        crossorigin: CrossOriginPolicy.Anonymous,
      },
      accessControl: {
        allowedOrigins: ['*'],
        allowedMethods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: false,
      },
    },
    debug: {
      enabled: false,
      logLevel: LogLevel.Error,
      profiling: false,
      stats: false,
      debugPanel: false,
    },
  },
};
```

### 资产清单配置

```typescript
const assetManifest: AssetManifest = {
  assets: [
    {
      id: 'button_component',
      name: 'Button Component',
      type: AssetEntryType.Component,
      path: 'components/button.maxz',
      size: 15360,
      mimeType: 'application/maxellabs+component',
      checksum: 'sha256:abc123...',
      metadata: {
        category: 'ui',
        tags: ['button', 'interactive'],
      },
    },
    {
      id: 'background_texture',
      name: 'Background Texture',
      type: AssetEntryType.Texture,
      path: 'textures/background.jpg',
      size: 102400,
      mimeType: 'image/jpeg',
      checksum: 'sha256:def456...',
      compression: {
        algorithm: CompressionAlgorithm.Brotli,
        originalSize: 204800,
        compressedSize: 102400,
        ratio: 0.5,
      },
    },
  ],
  statistics: {
    totalFiles: 150,
    totalSize: 1024000,
    byType: {
      [AssetEntryType.Component]: { count: 50, size: 512000, averageSize: 10240 },
      [AssetEntryType.Texture]: { count: 30, size: 307200, averageSize: 10240 },
    },
    byExtension: {
      '.maxz': { count: 50, size: 512000, mimeType: 'application/maxellabs+component' },
      '.jpg': { count: 20, size: 204800, mimeType: 'image/jpeg' },
    },
  },
  index: {
    byId: { button_component: 'components/button.maxz' },
    byName: { button: ['components/button.maxz'] },
    byType: {
      [AssetEntryType.Component]: ['components/button.maxz'],
      [AssetEntryType.Texture]: ['textures/background.jpg'],
    },
    byTag: {
      ui: ['components/button.maxz'],
      button: ['components/button.maxz'],
    },
    dependencyGraph: {
      nodes: [
        /* 依赖节点 */
      ],
      edges: [
        /* 依赖边 */
      ],
    },
  },
};
```

### 依赖配置

```typescript
const dependencies: PackageDependency[] = [
  {
    name: '@maxellabs/core',
    version: '^2.0.0',
    type: DependencyType.Runtime,
  },
  {
    name: '@maxellabs/utils',
    version: '^1.5.0',
    type: DependencyType.Runtime,
  },
  {
    name: '@types/three',
    version: '^0.150.0',
    type: DependencyType.Development,
    optional: true,
  },
];
```

## 最佳实践

### 版本管理

```typescript
// 语义化版本控制
const versionConfig = {
  version: '2.1.0',
  compatibility: {
    minEngineVersion: '2.0.0',
    maxEngineVersion: '3.0.0',
    platforms: [Platform.Web, Platform.Desktop],
    browsers: [
      { name: 'Chrome', minVersion: '90' },
      { name: 'Firefox', minVersion: '88' },
      { name: 'Safari', minVersion: '14' },
    ],
  },
};
```

### 资产优化

```typescript
const optimizedAssets = {
  texture: {
    compression: isMobile() ? [TextureCompression.ASTC] : [TextureCompression.DXT],
    maxSize: isMobile() ? 1024 : 2048,
    generateMipmaps: true,
    formatConversion: true,
  },
  geometry: {
    level: isMobile() ? GeometryOptimization.High : GeometryOptimization.Medium,
    mergeMeshes: true,
    simplify: isMobile(),
    lod: !isLowEndDevice(),
  },
};
```

### 跨平台配置

```typescript
const platformConfig = {
  build: {
    target: getBuildTarget(),
    mode: getBuildMode(),
    minify: !isDevelopment(),
    sourceMap: isDevelopment(),
    env: {
      NODE_ENV: getEnvironment(),
      PLATFORM: getPlatform(),
    },
  },
  runtime: {
    renderer: {
      type: getRendererType(),
      antialias: !isLowEndDevice(),
      powerPreference: isMobile() ? PowerPreference.LowPower : PowerPreference.HighPerformance,
    },
  },
};
```

### 安全配置

```typescript
const securityConfig: SecurityConfiguration = {
  csp: {
    enabled: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
    },
    reportUri: '/csp-report',
  },
  sri: {
    enabled: true,
    algorithm: HashAlgorithm.SHA384,
    crossorigin: CrossOriginPolicy.Anonymous,
  },
  accessControl: {
    allowedOrigins: getAllowedOrigins(),
    allowedMethods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: false,
  },
};
```

## 变更日志

### v2.2.0 (2024-07-25)

- 新增WebGPU渲染器支持 (RendererType.WebGPU)
- 优化包压缩算法，减少20%包大小
- 增强安全性配置，支持CSP 3.0

### v2.1.0 (2024-07-15)

- 添加React Native构建目标 (BuildTarget.ReactNative)
- 支持Unity/Unreal引擎导出
- 增强资产依赖图分析

### v2.0.0 (2024-06-20)

- 重构包格式，基于USDZ扩展
- 新增完整的构建配置系统
- 支持12种纹理压缩格式

### v1.5.0 (2024-05-15)

- 添加运行时性能监控
- 支持自适应质量系统
- 增强调试配置选项

### v1.0.0 (2024-04-01)

- 初始版本发布
- 支持基础包格式定义
- 包含资产清单和元数据
