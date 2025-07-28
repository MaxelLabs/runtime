## 基础类型定义

### 接口总览

| 名称                   | 泛型参数 | 简要描述                           |
| ---------------------- | -------- | ---------------------------------- |
| `AssetType`            | -        | 资产类型枚举，统一定义11种资产分类 |
| `UUID`                 | -        | 通用唯一标识符类型别名             |
| `Path`                 | -        | 文件路径类型别名                   |
| `URL`                  | -        | 统一资源定位符类型别名             |
| `CompressionAlgorithm` | -        | 压缩算法枚举，5种压缩格式支持      |
| `CacheStrategy`        | -        | 缓存策略枚举，6种缓存策略          |
| `SharingSettings`      | -        | 分享设置配置，权限和访问控制       |
| `SharingScope`         | -        | 分享范围枚举，4种分享权限等级      |
| `VersionInfo`          | -        | 版本信息结构，语义化版本定义       |
| `Timestamp`            | -        | 时间戳结构，秒级和纳秒精度         |
| `PlatformType`         | -        | 平台类型枚举，7种运行平台支持      |
| `DeviceType`           | -        | 设备类型枚举，6种设备分类          |
| `CoordinateSystem`     | -        | 坐标系类型枚举，左右手坐标系       |
| `PixelFormat`          | -        | 像素格式枚举，12种像素存储格式     |
| `CompressionFormat`    | -        | 压缩格式枚举，10种纹理压缩格式     |
| `GeometryOptimization` | -        | 几何优化配置，模型优化参数         |

### 枚举总览

| 枚举名                 | 成员         | 语义         | 适用场景             |
| ---------------------- | ------------ | ------------ | -------------------- |
| `AssetType`            | 11种资产类型 | 资产分类管理 | 资源管理、资产导入   |
| `CompressionAlgorithm` | 5种压缩算法  | 数据压缩策略 | 网络传输、存储优化   |
| `CacheStrategy`        | 6种缓存策略  | 缓存管理方案 | 性能优化、内存管理   |
| `SharingScope`         | 4种分享范围  | 权限控制等级 | 协作分享、访问控制   |
| `PlatformType`         | 7种平台类型  | 跨平台支持   | 平台适配、条件编译   |
| `DeviceType`           | 6种设备分类  | 设备特性识别 | 响应式设计、性能分级 |
| `CoordinateSystem`     | 2种坐标系    | 数学约定标准 | 3D数学、渲染管线     |
| `PixelFormat`          | 12种像素格式 | 数据存储格式 | 纹理处理、内存优化   |
| `CompressionFormat`    | 10种压缩格式 | 纹理压缩标准 | GPU优化、显存管理    |

### 核心接口详解

#### VersionInfo

**类型签名**

```tsx
interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}
```

**字段说明**

| 字段名       | 类型     | 描述                          | 默认值 | 取值范围       |
| ------------ | -------- | ----------------------------- | ------ | -------------- |
| `major`      | `number` | 主版本号，不兼容API变更       | -      | ≥0整数         |
| `minor`      | `number` | 次版本号，向下兼容功能添加    | -      | ≥0整数         |
| `patch`      | `number` | 修订版本号，向下兼容问题修复  | -      | ≥0整数         |
| `prerelease` | `string` | 预发布标识，如alpha、beta、rc | -      | 语义化版本标识 |
| `build`      | `string` | 构建元数据，如git提交哈希     | -      | 构建信息字符串 |

**语义化版本规则**

- 主版本号：不兼容的API变更
- 次版本号：向下兼容的功能性新增
- 修订号：向下兼容的问题修正
- 预发布：在修订号之后，先连缀一个连接号再加上一连串以句点分隔的标识符

#### SharingSettings

**类型签名**

```tsx
interface SharingSettings {
  public: boolean;
  shareLink?: string;
  password?: string;
  expiresAt?: string;
  allowDownload?: boolean;
  allowCopy?: boolean;
  scope?: SharingScope;
}
```

**字段说明**

| 字段名          | 类型           | 描述              | 默认值  | 取值范围           |
| --------------- | -------------- | ----------------- | ------- | ------------------ |
| `public`        | `boolean`      | 是否公开访问      | -       | true/false         |
| `shareLink`     | `string`       | 分享链接URL       | -       | 有效URL格式        |
| `password`      | `string`       | 访问密码          | -       | 6-32位字符串       |
| `expiresAt`     | `string`       | 过期时间ISO字符串 | -       | ISO 8601格式       |
| `allowDownload` | `boolean`      | 允许下载          | true    | true/false         |
| `allowCopy`     | `boolean`      | 允许复制          | true    | true/false         |
| `scope`         | `SharingScope` | 分享范围          | Private | 见SharingScope定义 |

#### Timestamp

**类型签名**

```tsx
interface Timestamp {
  seconds: number;
  nanoseconds: number;
}
```

**字段说明**

| 字段名        | 类型     | 描述             | 默认值 | 取值范围    |
| ------------- | -------- | ---------------- | ------ | ----------- |
| `seconds`     | `number` | Unix时间戳秒部分 | -      | ≥0整数      |
| `nanoseconds` | `number` | 纳秒精度部分     | -      | 0-999999999 |

**时间精度**

- 总精度：纳秒级
- 范围：1970-01-01 00:00:00 UTC 到 2262-04-11 23:47:16.854775807 UTC
- 转换：总纳秒数 = seconds × 1e9 + nanoseconds

### 枚举值详解

#### AssetType

**枚举定义**

```tsx
enum AssetType {
  Design = 'design', // 设计文件
  Image = 'image', // 图片资源
  Video = 'video', // 视频资源
  Audio = 'audio', // 音频资源
  Font = 'font', // 字体资源
  Icon = 'icon', // 图标资源
  Component = 'component', // 组件库
  Code = 'code', // 代码文件
  Documentation = 'documentation', // 文档
  Configuration = 'configuration', // 配置文件
}
```

**枚举值详情**

| 枚举值          | 字面量 | 对应字符串        | 文件扩展名              | 使用场景          |
| --------------- | ------ | ----------------- | ----------------------- | ----------------- |
| `Design`        | `0`    | `'design'`        | `.max` `.usd`           | Maxellabs设计文件 |
| `Image`         | `1`    | `'image'`         | `.png` `.jpg` `.webp`   | 纹理、贴图        |
| `Video`         | `2`    | `'video'`         | `.mp4` `.webm`          | 背景视频、动画    |
| `Audio`         | `3`    | `'audio'`         | `.mp3` `.wav`           | 音效、背景音乐    |
| `Font`          | `4`    | `'font'`          | `.ttf` `.woff` `.woff2` | 字体资源          |
| `Icon`          | `5`    | `'icon'`          | `.svg` `.png`           | 图标库            |
| `Component`     | `6`    | `'component'`     | `.json` `.tsx`          | 可复用组件        |
| `Code`          | `7`    | `'code'`          | `.js` `.ts` `.glsl`     | 脚本、着色器      |
| `Documentation` | `8`    | `'documentation'` | `.md` `.pdf`            | 技术文档          |
| `Configuration` | `9`    | `'configuration'` | `.json` `.yaml`         | 配置文件          |

#### CompressionAlgorithm

**枚举定义**

```tsx
enum CompressionAlgorithm {
  Gzip = 'gzip', // Gzip压缩
  Brotli = 'brotli', // Brotli压缩
  LZ4 = 'lz4', // LZ4快速压缩
  Zstd = 'zstd', // Zstandard压缩
}
```

**性能对比**

| 算法     | 压缩比 | 压缩速度 | 解压速度 | 适用场景   |
| -------- | ------ | -------- | -------- | ---------- |
| `Gzip`   | 中等   | 中等     | 中等     | 通用压缩   |
| `Brotli` | 高     | 慢       | 中等     | Web传输    |
| `LZ4`    | 低     | 极快     | 极快     | 实时压缩   |
| `Zstd`   | 高     | 快       | 快       | 大文件压缩 |

#### PlatformType

**枚举定义**

```tsx
enum PlatformType {
  Web = 'web', // Web平台
  iOS = 'ios', // iOS平台
  Android = 'android', // Android平台
  Windows = 'windows', // Windows平台
  macOS = 'macos', // macOS平台
  Linux = 'linux', // Linux平台
}
```

**平台特性**

| 平台      | 渲染API          | 文件系统 | 网络能力   | 性能等级 |
| --------- | ---------------- | -------- | ---------- | -------- |
| `Web`     | WebGL2/WebGPU    | 受限     | HTTP/HTTPS | 中等     |
| `iOS`     | Metal            | 沙盒     | 网络框架   | 高       |
| `Android` | Vulkan/OpenGL ES | 沙盒     | 网络库     | 高       |
| `Windows` | DirectX/Vulkan   | 完整     | WinAPI     | 极高     |
| `macOS`   | Metal            | 完整     | 网络框架   | 极高     |
| `Linux`   | Vulkan/OpenGL    | 完整     | POSIX      | 高       |

#### CompressionFormat

**枚举定义**

```tsx
enum CompressionFormat {
  None = 'none', // 无压缩
  DXT1 = 'dxt1', // DXT1压缩
  DXT3 = 'dxt3', // DXT3压缩
  DXT5 = 'dxt5', // DXT5压缩
  BC7 = 'bc7', // BC7高质量压缩
  ETC1 = 'etc1', // ETC1移动压缩
  ETC2 = 'etc2', // ETC2增强压缩
  PVRTC = 'pvrtc', // PowerVR压缩
  ASTC = 'astc', // ASTC自适应压缩
}
```

**压缩格式特性**

| 格式   | 压缩比 | 质量   | 支持平台  | 显存占用 |
| ------ | ------ | ------ | --------- | -------- |
| `DXT1` | 8:1    | 中等   | 桌面/主机 | 低       |
| `DXT5` | 4:1    | 高     | 桌面/主机 | 中       |
| `BC7`  | 3:1    | 极高   | 桌面/主机 | 高       |
| `ETC2` | 4:1    | 高     | 移动设备  | 中       |
| `ASTC` | 可变   | 可配置 | 全平台    | 可变     |

### 使用示例

#### 最小可运行片段

```tsx
import { AssetType, PlatformType, VersionInfo } from '@maxellabs/specification/core';

// 基础版本信息
const version: VersionInfo = {
  major: 1,
  minor: 0,
  patch: 0,
};

// 基础资产类型
const assetType: AssetType = AssetType.Image;

// 基础平台识别
const platform: PlatformType = PlatformType.Web;
```

#### 常见业务封装

```tsx
// 版本号工具类
class VersionManager {
  static parse(version: string): VersionInfo {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/);
    if (!match) {
      throw new Error('Invalid version format');
    }

    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3]),
      prerelease: match[4],
      build: match[5],
    };
  }

  static compare(a: VersionInfo, b: VersionInfo): number {
    if (a.major !== b.major) return a.major - b.major;
    if (a.minor !== b.minor) return a.minor - b.minor;
    return a.patch - b.patch;
  }

  static toString(version: VersionInfo): string {
    let str = `${version.major}.${version.minor}.${version.patch}`;
    if (version.prerelease) str += `-${version.prerelease}`;
    if (version.build) str += `+${version.build}`;
    return str;
  }
}

// 平台检测工具
class PlatformDetector {
  static detect(): PlatformType {
    if (typeof window !== 'undefined') return PlatformType.Web;
    if (typeof process !== 'undefined' && process.platform) {
      switch (process.platform) {
        case 'win32':
          return PlatformType.Windows;
        case 'darwin':
          return PlatformType.macOS;
        case 'linux':
          return PlatformType.Linux;
        default:
          return PlatformType.Linux;
      }
    }
    return PlatformType.Web;
  }

  static isMobile(platform: PlatformType): boolean {
    return [PlatformType.iOS, PlatformType.Android].includes(platform);
  }

  static isDesktop(platform: PlatformType): boolean {
    return [PlatformType.Windows, PlatformType.macOS, PlatformType.Linux].includes(platform);
  }
}

// 分享设置构建器
class SharingSettingsBuilder {
  private settings: SharingSettings = {
    public: false,
    allowDownload: true,
    allowCopy: true,
    scope: SharingScope.Private,
  };

  public(): this {
    this.settings.public = true;
    return this;
  }

  withPassword(password: string): this {
    this.settings.password = password;
    return this;
  }

  withExpiry(date: Date): this {
    this.settings.expiresAt = date.toISOString();
    return this;
  }

  disableDownload(): this {
    this.settings.allowDownload = false;
    return this;
  }

  build(): SharingSettings {
    return { ...this.settings };
  }
}
```

#### 边界 case 处理

```tsx
// 版本号验证和处理
function validateVersionInfo(version: any): VersionInfo {
  if (typeof version !== 'object' || version === null) {
    throw new Error('Version must be an object');
  }

  const { major, minor, patch } = version;

  if (!Number.isInteger(major) || major < 0) {
    throw new Error('Major version must be a non-negative integer');
  }

  if (!Number.isInteger(minor) || minor < 0) {
    throw new Error('Minor version must be a non-negative integer');
  }

  if (!Number.isInteger(patch) || patch < 0) {
    throw new Error('Patch version must be a non-negative integer');
  }

  return {
    major,
    minor,
    patch,
    prerelease: version.prerelease,
    build: version.build,
  };
}

// 时间戳转换和验证
function validateTimestamp(timestamp: any): Timestamp {
  if (typeof timestamp !== 'object' || timestamp === null) {
    throw new Error('Timestamp must be an object');
  }

  const { seconds, nanoseconds } = timestamp;

  if (!Number.isInteger(seconds) || seconds < 0) {
    throw new Error('Seconds must be a non-negative integer');
  }

  if (!Number.isInteger(nanoseconds) || nanoseconds < 0 || nanoseconds >= 1e9) {
    throw new Error('Nanoseconds must be an integer between 0 and 999999999');
  }

  return { seconds, nanoseconds };
}

// 平台兼容性检测
function getCompatibleCompressionFormat(platform: PlatformType, quality: QualityLevel): CompressionFormat {
  const compatibility = {
    [PlatformType.Web]: {
      [QualityLevel.Low]: CompressionFormat.DXT1,
      [QualityLevel.Medium]: CompressionFormat.DXT5,
      [QualityLevel.High]: CompressionFormat.BC7,
    },
    [PlatformType.iOS]: {
      [QualityLevel.Low]: CompressionFormat.ETC2,
      [QualityLevel.Medium]: CompressionFormat.ASTC,
      [QualityLevel.High]: CompressionFormat.ASTC,
    },
    [PlatformType.Android]: {
      [QualityLevel.Low]: CompressionFormat.ETC2,
      [QualityLevel.Medium]: CompressionFormat.ETC2,
      [QualityLevel.High]: CompressionFormat.ASTC,
    },
  };

  return compatibility[platform]?.[quality] || CompressionFormat.DXT5;
}
```

### 最佳实践

#### 类型收窄

```tsx
// 使用类型保护确保平台类型有效
function isValidPlatformType(platform: string): platform is PlatformType {
  return Object.values(PlatformType).includes(platform as PlatformType);
}

// 使用字面量类型确保编译时安全
type ValidAssetTypes = AssetType.Image | AssetType.Video | AssetType.Audio;

function processMediaAsset(type: ValidAssetTypes) {
  switch (type) {
    case AssetType.Image:
      return 'Processing image...';
    case AssetType.Video:
      return 'Processing video...';
    case AssetType.Audio:
      return 'Processing audio...';
  }
}
```

#### 运行时校验

```tsx
// 运行时版本号验证
class VersionValidator {
  static validate(version: any): asserts version is VersionInfo {
    if (typeof version !== 'object' || version === null) {
      throw new Error('Version must be an object');
    }

    ['major', 'minor', 'patch'].forEach((key) => {
      const value = version[key];
      if (!Number.isInteger(value) || value < 0) {
        throw new Error(`${key} must be a non-negative integer`);
      }
    });

    if (version.prerelease && typeof version.prerelease !== 'string') {
      throw new Error('Prerelease must be a string');
    }

    if (version.build && typeof version.build !== 'string') {
      throw new Error('Build must be a string');
    }
  }
}

// 时间戳验证器
class TimestampValidator {
  static validate(timestamp: any): asserts timestamp is Timestamp {
    if (typeof timestamp !== 'object' || timestamp === null) {
      throw new Error('Timestamp must be an object');
    }

    const { seconds, nanoseconds } = timestamp;

    if (!Number.isInteger(seconds) || seconds < 0) {
      throw new Error('Seconds must be a non-negative integer');
    }

    if (!Number.isInteger(nanoseconds) || nanoseconds < 0 || nanoseconds >= 1e9) {
      throw new Error('Nanoseconds must be between 0 and 999999999');
    }
  }
}
```

#### 与后端协议对齐

```tsx
// 后端数据转换
function versionToBackend(version: VersionInfo) {
  return {
    version: `${version.major}.${version.minor}.${version.patch}`,
    prerelease: version.prerelease,
    build: version.build,
    timestamp: Date.now(),
  };
}

function versionFromBackend(data: any): VersionInfo {
  const [major, minor, patch] = data.version.split('.').map(Number);
  return {
    major,
    minor,
    patch,
    prerelease: data.prerelease,
    build: data.build,
  };
}

// 分享设置转换
function sharingSettingsToBackend(settings: SharingSettings) {
  return {
    is_public: settings.public,
    share_link: settings.shareLink,
    password: settings.password,
    expires_at: settings.expiresAt,
    allow_download: settings.allowDownload,
    allow_copy: settings.allowCopy,
    scope: settings.scope,
  };
}
```

#### 错误提示国际化

```tsx
// 国际化错误消息
const errorMessages = {
  zh: {
    invalidVersion: '版本号格式无效，应为major.minor.patch',
    invalidTimestamp: '时间戳格式无效',
    invalidPlatform: '不支持的平台类型',
    invalidAssetType: '不支持的资产类型',
  },
  en: {
    invalidVersion: 'Invalid version format, expected major.minor.patch',
    invalidTimestamp: 'Invalid timestamp format',
    invalidPlatform: 'Unsupported platform type',
    invalidAssetType: 'Unsupported asset type',
  },
};

function getLocalizedError(key: string, locale: 'zh' | 'en' = 'zh'): string {
  return errorMessages[locale][key] || key;
}

// 平台描述国际化
const platformDescriptions = {
  zh: {
    [PlatformType.Web]: 'Web平台',
    [PlatformType.iOS]: 'iOS平台',
    [PlatformType.Android]: 'Android平台',
    [PlatformType.Windows]: 'Windows平台',
    [PlatformType.macOS]: 'macOS平台',
    [PlatformType.Linux]: 'Linux平台',
  },
  en: {
    [PlatformType.Web]: 'Web Platform',
    [PlatformType.iOS]: 'iOS Platform',
    [PlatformType.Android]: 'Android Platform',
    [PlatformType.Windows]: 'Windows Platform',
    [PlatformType.macOS]: 'macOS Platform',
    [PlatformType.Linux]: 'Linux Platform',
  },
};
```
