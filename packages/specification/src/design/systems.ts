/**
 * Maxellabs 设计系统定义
 * 包含完整设计系统的核心接口
 */

import type { CommonMetadata, PerformanceConfig } from '../core/interfaces';
import type { DesignComponentLibrary } from './components';
import type { DesignIconLibrary } from './icons';
import type { DesignTypographySystem } from './typography';
import type { DesignColorSystem } from './colors';
import type { DesignSpacingSystem, DesignBreakpoints } from './spacing';
import type { DesignTheme, DesignStyleLibrary } from './themes';

/**
 * 设计系统
 */
export interface DesignSystem {
  /**
   * 系统名称
   */
  name: string;
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
  performance?: PerformanceConfig;
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
   * 默认主题
   */
  defaultTheme?: string;
  /**
   * 自动生成
   */
  autoGenerate?: boolean;
  /**
   * 验证规则
   */
  validation?: ValidationConfig;
  /**
   * 导出配置
   */
  export?: ExportConfig;
  /**
   * 同步配置
   */
  sync?: SyncConfig;
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
 */
export interface ValidationRule {
  /**
   * 规则名称
   */
  name: string;
  /**
   * 规则类型
   */
  type: ValidationType;
  /**
   * 规则配置
   */
  config?: Record<string, any>;
  /**
   * 是否启用
   */
  enabled: boolean;
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
   * 导出格式
   */
  formats: ExportFormatConfig[];
  /**
   * 输出目录
   */
  outputDir?: string;
  /**
   * 文件命名
   */
  naming?: NamingConfig;
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
   * 文件前缀
   */
  prefix?: string;
  /**
   * 文件后缀
   */
  suffix?: string;
  /**
   * 命名约定
   */
  convention?: string;
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
  autoSync?: boolean;
  /**
   * 同步间隔
   */
  interval?: number;
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
