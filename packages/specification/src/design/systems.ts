/**
 * Maxellabs 设计系统定义
 * 包含完整设计系统的核心接口
 */
import type { BuildTarget, PerformanceConfiguration } from '../package';
import type { CacheStrategy, Nameable, RequiredEnableable } from '../core';
import type { CommonMetadata } from '../core';
import type { DesignComponentLibrary, NamingConvention } from './components';
import type { DesignIconLibrary } from './icons';
import type { DesignTypographySystem } from './typography';
import type { DesignColorSystem } from './colors';
import type { DesignSpacingSystem, DesignBreakpoints } from './spacing';
import type { DesignTheme, DesignStyleLibrary } from './themes';

/**
 * 设计系统
 *
 * @description 组合 Nameable trait
 */
export interface DesignSystem extends Nameable {
  /**
   * 系统版本
   */
  version: string;
  /**
   * 颜色系统
   */
  colors: DesignColorSystem;
  /**
   * 字体系统
   */
  typography: DesignTypographySystem;
  /**
   * 间距系统
   */
  spacing: DesignSpacingSystem;
  /**
   * 组件库
   */
  components: DesignComponentLibrary;
  /**
   * 图标库
   */
  icons: DesignIconLibrary;
  /**
   * 样式库
   */
  styles: DesignStyleLibrary;
  /**
   * 主题配置
   */
  themes?: DesignTheme[];
  /**
   * 断点系统
   */
  breakpoints?: DesignBreakpoints;
  /**
   * 系统配置
   */
  config?: DesignSystemConfig;
  /**
   * 性能配置（使用统一PerformanceConfig）
   */
  performance?: PerformanceConfiguration;
  /**
   * 元数据（使用统一CommonMetadata）
   */
  metadata?: CommonMetadata;
}

/**
 * 设计系统配置
 */
export interface DesignSystemConfig {
  /**
   * 版本控制
   */
  versioning: {
    /**
     * 语义化版本
     */
    semanticVersioning: boolean;
    /**
     * 版本策略
     */
    versionStrategy: 'major' | 'minor' | 'patch' | 'auto';
    /**
     * 变更日志
     */
    changelog: boolean;
  };
  /**
   * 验证配置
   */
  validation: ValidationConfig;
  /**
   * 导出配置
   */
  export: {
    /**
     * 支持的导出格式
     */
    formats: ExportFormatConfig[];
    /**
     * 默认导出格式
     */
    defaultFormat: ExportFormatType;
    /**
     * 输出目录
     */
    outputDir: string;
  };
  /**
   * 命名规范
   */
  naming: {
    /**
     * 命名约定
     */
    convention: NamingConvention;
    /**
     * 前缀设置
     */
    prefix: {
      /**
       * 组件前缀
       */
      component?: string;
      /**
       * 图标前缀
       */
      icon?: string;
      /**
       * 颜色前缀
       */
      color?: string;
    };
    /**
     * 分隔符
     */
    separator: string;
  };
  /**
   * 同步配置
   */
  sync: {
    /**
     * 同步目标
     */
    targets: SyncTarget[];
    /**
     * 自动同步
     */
    autoSync: boolean;
    /**
     * 同步间隔（分钟）
     */
    syncInterval?: number;
  };
  /**
   * 文档配置
   */
  documentation: {
    /**
     * 自动生成文档
     */
    autoGenerate: boolean;
    /**
     * 文档模板
     */
    template?: string;
    /**
     * 包含使用示例
     */
    includeExamples: boolean;
    /**
     * API 文档
     */
    generateAPI: boolean;
  };
  /**
   * 构建配置
   */
  build: {
    /**
     * 构建目标
     */
    targets: BuildTarget[];
    /**
     * 是否压缩
     */
    minify: boolean;
    /**
     * 是否生成源码映射
     */
    sourceMap: boolean;
    /**
     * 缓存策略
     */
    cache: CacheStrategy;
  };
  /**
   * 开发配置
   */
  development: {
    /**
     * 热重载
     */
    hotReload: boolean;
    /**
     * 调试模式
     */
    debug: boolean;
    /**
     * 预览服务器端口
     */
    previewPort?: number;
  };
}

/**
 * 验证配置
 */
export interface ValidationConfig {
  /**
   * 验证规则
   */
  rules: ValidationRule[];
  /**
   * 严格模式
   */
  strict?: boolean;
  /**
   * 自动修复
   */
  autoFix?: boolean;
}

/**
 * 验证规则
 *
 * @description 组合 Nameable, RequiredEnableable traits
 */
export interface ValidationRule extends Nameable, RequiredEnableable {
  /**
   * 规则类型
   */
  type: ValidationType;
  /**
   * 规则配置
   */
  config?: Record<string, any>;
}

/**
 * 验证类型
 */
export enum ValidationType {
  ColorContrast = 'color-contrast',
  FontSize = 'font-size',
  Spacing = 'spacing',
  ComponentConsistency = 'component-consistency',
  IconConsistency = 'icon-consistency',
  NamingConvention = 'naming-convention',
}

/**
 * 导出配置
 */
export interface ExportConfig {
  /**
   * 支持的导出格式
   */
  formats: ExportFormatConfig[];
  /**
   * 默认导出格式
   */
  defaultFormat: ExportFormatType;
  /**
   * 输出目录
   */
  outputDir: string;
  /**
   * 输出文件命名规则
   */
  fileNaming: {
    /**
     * 文件名模板
     */
    template: string;
    /**
     * 是否包含版本号
     */
    includeVersion: boolean;
    /**
     * 是否包含时间戳
     */
    includeTimestamp: boolean;
  };
  /**
   * 压缩设置
   */
  compression: {
    /**
     * 是否启用压缩
     */
    enabled: boolean;
    /**
     * 压缩级别 (1-9)
     */
    level: number;
    /**
     * 压缩格式
     */
    format: 'gzip' | 'zip' | 'tar';
  };
  /**
   * 元数据包含
   */
  metadata: {
    /**
     * 包含作者信息
     */
    includeAuthor: boolean;
    /**
     * 包含生成时间
     */
    includeTimestamp: boolean;
    /**
     * 包含版本信息
     */
    includeVersion: boolean;
    /**
     * 自定义元数据
     */
    custom?: Record<string, any>;
  };
  /**
   * 后处理
   */
  postProcess: {
    /**
     * 代码格式化
     */
    format: boolean;
    /**
     * 代码压缩
     */
    minify: boolean;
    /**
     * 类型检查
     */
    typeCheck: boolean;
  };
}

/**
 * 导出格式配置
 */
export interface ExportFormatConfig {
  /**
   * 格式类型
   */
  type: ExportFormatType;
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 格式选项
   */
  options?: Record<string, any>;
}

/**
 * 导出格式类型
 *
 * @description 设计系统导出格式，专注于代码和配置格式
 * 与其他导出格式枚举的区别：
 * - ExportFormat (document.ts): 图像/文档导出格式 (PNG, JPG, PDF)
 * - IconExportFormat (icons.ts): 图标导出格式 (Font, ICO, WebP)
 */
export enum ExportFormatType {
  JSON = 'json',
  CSS = 'css',
  SCSS = 'scss',
  JS = 'js',
  TS = 'ts',
  Figma = 'figma',
  Sketch = 'sketch',
}

/**
 * 命名配置
 */
export interface NamingConfig {
  /**
   * 命名约定
   */
  convention: NamingConvention;
  /**
   * 前缀设置
   */
  prefix: {
    component?: string;
    icon?: string;
    color?: string;
    spacing?: string;
  };
  /**
   * 分隔符
   */
  separator: string;
  /**
   * 大小写转换规则
   */
  caseTransform: {
    /**
     * 自动转换
     */
    auto: boolean;
    /**
     * 保留原始大小写
     */
    preserveOriginal: boolean;
  };
}

/**
 * 同步配置
 */
export interface SyncConfig {
  /**
   * 同步目标
   */
  targets: SyncTarget[];
  /**
   * 自动同步
   */
  autoSync: boolean;
  /**
   * 同步间隔（分钟）
   */
  syncInterval?: number;
  /**
   * 冲突解决策略
   */
  conflictResolution: 'overwrite' | 'merge' | 'skip' | 'prompt';
  /**
   * 重试设置
   */
  retry: {
    /**
     * 最大重试次数
     */
    maxAttempts: number;
    /**
     * 重试间隔（秒）
     */
    interval: number;
  };
}

/**
 * 同步目标
 */
export interface SyncTarget {
  /**
   * 目标类型
   */
  type: SyncTargetType;
  /**
   * 目标URL
   */
  url: string;
  /**
   * 认证信息
   */
  auth?: SyncAuth;
  /**
   * 同步选项
   */
  options?: Record<string, any>;
}

/**
 * 同步目标类型
 */
export enum SyncTargetType {
  Figma = 'figma',
  Sketch = 'sketch',
  Git = 'git',
  API = 'api',
  Database = 'database',
}

/**
 * 同步认证
 */
export interface SyncAuth {
  /**
   * 认证类型
   */
  type: AuthType;
  /**
   * 认证数据
   */
  credentials: Record<string, string>;
}

/**
 * 认证类型
 */
export enum AuthType {
  Token = 'token',
  OAuth = 'oauth',
  Basic = 'basic',
  API_Key = 'api-key',
}
