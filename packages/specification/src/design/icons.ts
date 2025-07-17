/**
 * Maxellabs 图标库定义
 * 包含图标库管理、图标定义和分类系统
 */

import type { LicenseType } from '../core';
import type { CommonMetadata } from '../core/interfaces';
import type { DesignIconVariant, DesignIconCategory } from './base';
import type { IconStyle } from './enums';

/**
 * 设计图标
 */
export interface DesignIcon {
  /**
   * 图标 ID
   */
  id: string;
  /**
   * 图标名称
   */
  name: string;
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
   * 图标描述
   */
  description?: string;
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
 */
export interface IconLicense {
  /**
   * 许可类型
   */
  type: LicenseType;
  /**
   * 许可URL
   */
  url?: string;
  /**
   * 许可描述
   */
  description?: string;
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
 */
export interface DesignIconLibrary {
  /**
   * 库名称
   */
  name: string;
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

// IconLibraryConfig 已废弃 - 使用 PerformanceConfiguration（来自 package/format.ts）替代
// 为保持兼容性，创建类型别名
import type { PerformanceConfiguration } from '../package/format';

/**
 * @deprecated 使用 PerformanceConfiguration 替代
 */
export type IconLibraryConfig = PerformanceConfiguration;

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

/**
 * 排序方向
 */
export enum SortDirection {
  Ascending = 'asc',
  Descending = 'desc',
}

/**
 * 图标集合
 */
export interface IconCollection {
  /**
   * 集合 ID
   */
  id: string;
  /**
   * 集合名称
   */
  name: string;
  /**
   * 集合描述
   */
  description?: string;
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
