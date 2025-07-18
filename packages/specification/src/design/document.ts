/**
 * Maxellabs 设计文档定义
 * 包含设计文档管理和配置
 */

import type { CommonMetadata } from '../core/interfaces';
import type { DesignPage } from './page';
import type { DesignSystem } from './systems';
import type { AssetLibrary } from './assets';
import type { CollaborationInfo } from './collaboration';

/**
 * 设计文档
 */
export interface DesignDocument {
  /**
   * 文档 ID
   */
  id: string;
  /**
   * 文档名称
   */
  name: string;
  /**
   * 文档类型
   */
  type: DocumentType;
  /**
   * 文档版本
   */
  version: string;
  /**
   * 设计页面
   */
  pages: DesignPage[];
  /**
   * 设计系统
   */
  designSystem?: DesignSystem;
  /**
   * 资产库
   */
  assetLibrary?: AssetLibrary;
  /**
   * 文档配置
   */
  config?: DocumentConfig;
  /**
   * 协作信息
   */
  collaboration?: CollaborationInfo;
  /**
   * 元数据（使用统一CommonMetadata）
   */
  metadata?: CommonMetadata;
}

/**
 * 文档类型
 */
export enum DocumentType {
  Design = 'design',
  Prototype = 'prototype',
  Wireframe = 'wireframe',
  Specification = 'specification',
  Template = 'template',
  Component = 'component',
}

// DocumentConfig 已废弃 - 使用 PerformanceConfiguration（来自 package/format.ts）替代
// 为保持兼容性，创建类型别名
import type { PerformanceConfiguration } from '../package/format';

/**
 * @deprecated 使用 PerformanceConfiguration 替代
 */
export type DocumentConfig = PerformanceConfiguration;

/**
 * 文档导出设置
 */
export interface DocumentExportSettings {
  /**
   * 默认格式
   */
  defaultFormat?: ExportFormat;
  /**
   * 支持的格式
   */
  supportedFormats?: ExportFormat[];
  /**
   * 导出质量
   */
  quality?: number;
  /**
   * 是否包含元数据
   */
  includeMetadata?: boolean;
  /**
   * 是否压缩
   */
  compress?: boolean;
}

/**
 * 导出格式
 */
export enum ExportFormat {
  PNG = 'png',
  JPG = 'jpg',
  SVG = 'svg',
  PDF = 'pdf',
  Figma = 'figma',
  Sketch = 'sketch',
  JSON = 'json',
}

/**
 * 文档插件配置
 */
export interface DocumentPluginConfig {
  /**
   * 插件 ID
   */
  id: string;
  /**
   * 插件名称
   */
  name: string;
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 插件配置
   */
  config?: Record<string, any>;
  /**
   * 插件版本
   */
  version?: string;
}
