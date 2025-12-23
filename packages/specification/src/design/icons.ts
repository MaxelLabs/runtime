/**
 * Maxellabs 图标库定义
 * 包含图标库管理、图标定义和分类系统
 */

import type { LicenseType, BaseLicense, SortDirection, Nameable, Describable } from '../core';
import type { CommonMetadata } from '../core/interfaces';
import type { DesignIconVariant, DesignIconCategory } from './base';
import type { IconStyle } from './enums';

/**
 * 设计图标
 *
 * @description 组合 Nameable, Describable traits
 */
export interface DesignIcon extends Nameable, Describable {
  /**
   * 图标 ID
   */
  id: string;
  /**
   * 图标分类
   */
  category?: string;
  /**
   * 图标标签
   */
  tags?: string[];
  /**
   * 图标尺寸
   */
  sizes: number[];
  /**
   * SVG 数据
   */
  svg: string;
  /**
   * 图标变体
   */
  variants?: DesignIconVariant[];
  /**
   * 图标作者
   */
  author?: string;
  /**
   * 图标许可
   */
  license?: IconLicense;
  /**
   * 创建时间
   */
  createdAt?: string;
  /**
   * 更新时间
   */
  updatedAt?: string;
  /**
   * 使用统计
   */
  usageStats?: IconUsageStats;
}

/**
 * 图标许可
 *
 * @description 继承自 BaseLicense，添加图标特有的商业使用和归属字段
 */
export interface IconLicense extends BaseLicense {
  /**
   * 许可类型（覆盖为具体类型）
   */
  type: LicenseType;
  /**
   * 商业使用
   */
  commercial?: boolean;
  /**
   * 归属要求
   */
  attribution?: boolean;
}

/**
 * 图标使用统计
 */
export interface IconUsageStats {
  /**
   * 使用次数
   */
  usageCount: number;
  /**
   * 下载次数
   */
  downloadCount?: number;
  /**
   * 最后使用时间
   */
  lastUsed?: string;
  /**
   * 热门程度
   */
  popularity?: number;
}

/**
 * 设计图标库
 *
 * @description 组合 Nameable trait
 */
export interface DesignIconLibrary extends Nameable {
  /**
   * 库版本
   */
  version: string;
  /**
   * 图标列表
   */
  icons: Record<string, DesignIcon>;
  /**
   * 图标分类
   */
  categories: DesignIconCategory[];
  /**
   * 库配置
   */
  config?: IconLibraryConfig;
  /**
   * 元数据（使用统一CommonMetadata）
   */
  metadata?: CommonMetadata;
}

/**
 * 图标库配置
 */
export interface IconLibraryConfig {
  /**
   * 库设置
   */
  library: {
    /**
     * 默认图标大小
     */
    defaultSize: number;
    /**
     * 支持的尺寸
     */
    supportedSizes: number[];
    /**
     * 默认颜色模式
     */
    defaultColorMode: IconColorMode;
    /**
     * 命名规范
     */
    namingConvention: 'kebab-case' | 'camelCase' | 'snake_case';
  };
  /**
   * 导出配置
   */
  export: {
    /**
     * 默认导出格式
     */
    defaultFormats: IconExportFormat[];
    /**
     * 优化设置
     */
    optimization: IconOptimization;
    /**
     * 输出目录结构
     */
    outputStructure: 'flat' | 'categorized' | 'grouped';
  };
  /**
   * 搜索配置
   */
  search: {
    /**
     * 是否启用模糊搜索
     */
    fuzzySearch: boolean;
    /**
     * 搜索权重配置
     */
    searchWeights: {
      name: number;
      tags: number;
      category: number;
      description: number;
    };
    /**
     * 最大搜索结果数
     */
    maxResults: number;
  };
  /**
   * 缓存配置
   */
  cache: {
    /**
     * 是否启用缓存
     */
    enabled: boolean;
    /**
     * 缓存过期时间（秒）
     */
    ttl: number;
    /**
     * 缓存策略
     */
    strategy: 'memory' | 'disk' | 'both';
  };
  /**
   * 许可配置
   */
  licensing: {
    /**
     * 默认许可类型
     */
    defaultLicense: LicenseType;
    /**
     * 是否强制归属
     */
    enforceAttribution: boolean;
    /**
     * 许可检查
     */
    licenseValidation: boolean;
  };
  /**
   * 质量控制
   */
  quality: {
    /**
     * SVG 验证
     */
    svgValidation: boolean;
    /**
     * 最小图标大小
     */
    minIconSize: number;
    /**
     * 最大文件大小 (bytes)
     */
    maxFileSize: number;
    /**
     * 颜色数量限制
     */
    maxColors?: number;
  };
}

/**
 * 图标颜色模式
 */
export enum IconColorMode {
  Monochrome = 'monochrome',
  Multicolor = 'multicolor',
  Both = 'both',
}

/**
 * 图标导出格式
 *
 * @description 图标专用导出格式，包含字体和图标特有格式
 * 与其他导出格式枚举的区别：
 * - ExportFormat (document.ts): 图像/文档导出格式
 * - ExportFormatType (systems.ts): 代码/配置导出格式
 */
export enum IconExportFormat {
  SVG = 'svg',
  PNG = 'png',
  JPG = 'jpg',
  WebP = 'webp',
  ICO = 'ico',
  PDF = 'pdf',
  Font = 'font',
}

/**
 * 图标优化配置
 */
export interface IconOptimization {
  /**
   * 是否移除未使用的属性
   */
  removeUnusedDefs?: boolean;
  /**
   * 是否简化路径
   */
  simplifyPaths?: boolean;
  /**
   * 是否合并路径
   */
  mergePaths?: boolean;
  /**
   * 是否移除空组
   */
  removeEmptyGroups?: boolean;
  /**
   * 精度
   */
  precision?: number;
  /**
   * 是否压缩
   */
  compress?: boolean;
}

/**
 * 图标搜索结果
 */
export interface IconSearchResult {
  /**
   * 图标信息
   */
  icon: DesignIcon;
  /**
   * 匹配分数
   */
  score: number;
  /**
   * 匹配字段
   */
  matchedFields: string[];
  /**
   * 高亮信息
   */
  highlights?: SearchHighlight[];
}

/**
 * 搜索高亮
 */
export interface SearchHighlight {
  /**
   * 字段名
   */
  field: string;
  /**
   * 高亮文本
   */
  text: string;
  /**
   * 高亮位置
   */
  positions: HighlightPosition[];
}

/**
 * 高亮位置
 */
export interface HighlightPosition {
  /**
   * 开始位置
   */
  start: number;
  /**
   * 结束位置
   */
  end: number;
}

/**
 * 图标过滤器
 */
export interface IconFilter {
  /**
   * 分类过滤
   */
  categories?: string[];
  /**
   * 标签过滤
   */
  tags?: string[];
  /**
   * 样式过滤
   */
  styles?: IconStyle[];
  /**
   * 尺寸过滤
   */
  sizes?: number[];
  /**
   * 许可过滤
   */
  licenses?: LicenseType[];
  /**
   * 作者过滤
   */
  authors?: string[];
}

/**
 * 图标排序
 */
export interface IconSort {
  /**
   * 排序字段
   */
  field: IconSortField;
  /**
   * 排序方向
   */
  direction: SortDirection;
}

/**
 * 图标排序字段
 */
export enum IconSortField {
  Name = 'name',
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  UsageCount = 'usageCount',
  Popularity = 'popularity',
  Size = 'size',
}

// SortDirection 已从 core/enums.ts 导入，不再重复定义
export type { SortDirection } from '../core';

/**
 * 图标集合
 *
 * @description 组合 Nameable, Describable traits
 */
export interface IconCollection extends Nameable, Describable {
  /**
   * 集合 ID
   */
  id: string;
  /**
   * 图标列表
   */
  iconIds: string[];
  /**
   * 集合类型
   */
  type: CollectionType;
  /**
   * 创建者
   */
  creator?: string;
  /**
   * 是否公开
   */
  public?: boolean;
  /**
   * 创建时间
   */
  createdAt?: string;
  /**
   * 更新时间
   */
  updatedAt?: string;
}

/**
 * 集合类型
 */
export enum CollectionType {
  Favorites = 'favorites',
  Project = 'project',
  Custom = 'custom',
  Shared = 'shared',
}
