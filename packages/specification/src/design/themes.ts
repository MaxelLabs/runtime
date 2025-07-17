/**
 * Maxellabs 设计主题系统定义
 * 包含主题配置、样式库和主题覆盖相关类型
 */

import type { CommonMetadata, IColor } from '../core';
import type { DesignTypographySystem } from './typography';
import type { DesignSpacingSystem } from './spacing';
import type { DesignStyleDefinition } from './styles';

/**
 * 设计主题
 */
export interface DesignTheme {
  /**
   * 主题名称
   */
  name: string;
  /**
   * 主题类型
   */
  type: ThemeType;
  /**
   * 颜色覆盖
   */
  colors?: Record<string, IColor>;
  /**
   * 字体覆盖
   */
  typography?: Partial<DesignTypographySystem>;
  /**
   * 间距覆盖
   */
  spacing?: Partial<DesignSpacingSystem>;
  /**
   * 组件样式覆盖
   */
  componentStyles?: Record<string, any>;
  /**
   * 主题描述
   */
  description?: string;
  /**
   * 是否为默认主题
   */
  default?: boolean;
  /**
   * 主题变量
   */
  variables?: Record<string, any>;
  /**
   * 主题扩展
   */
  extends?: string;
}

/**
 * 主题类型
 */
export enum ThemeType {
  Light = 'light',
  Dark = 'dark',
  HighContrast = 'high-contrast',
  Brand = 'brand',
  Seasonal = 'seasonal',
  Custom = 'custom',
}

/**
 * 设计样式库
 */
export interface DesignStyleLibrary {
  /**
   * 库名称
   */
  name: string;
  /**
   * 库版本
   */
  version: string;
  /**
   * 样式列表
   */
  styles: Record<string, DesignStyleDefinition>;
  /**
   * 元数据（使用统一CommonMetadata）
   */
  metadata?: CommonMetadata;
}

/**
 * 主题变量
 */
export interface ThemeVariable {
  /**
   * 变量名称
   */
  name: string;
  /**
   * 变量值
   */
  value: any;
  /**
   * 变量类型
   */
  type: ThemeVariableType;
  /**
   * 变量描述
   */
  description?: string;
  /**
   * 默认值
   */
  defaultValue?: any;
}

/**
 * 主题变量类型
 */
export enum ThemeVariableType {
  Color = 'color',
  Number = 'number',
  String = 'string',
  Boolean = 'boolean',
  Object = 'object',
  Array = 'array',
}

// ThemeConfig 已废弃 - 使用 PerformanceConfiguration（来自 package/format.ts）替代
// 为保持兼容性，创建类型别名
import type { PerformanceConfiguration } from '../package/format';

/**
 * @deprecated 使用 PerformanceConfiguration 替代
 */
export type ThemeConfig = PerformanceConfiguration;

/**
 * 主题切换模式
 */
export enum ThemeSwitchMode {
  Manual = 'manual',
  Auto = 'auto',
  System = 'system',
  Time = 'time',
}
