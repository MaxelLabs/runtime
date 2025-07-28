/**
 * Maxellabs 设计主题系统定义
 * 包含主题配置、样式库和主题覆盖相关类型
 */

import type { CommonMetadata, ColorLike } from '../core';
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
  colors?: Record<string, ColorLike>;
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

/**
 * 主题配置
 */
export interface ThemeConfig {
  /**
   * 默认主题
   */
  defaultTheme: string;
  /**
   * 主题切换模式
   */
  switchMode: ThemeSwitchMode;
  /**
   * 支持的主题列表
   */
  availableThemes: string[];
  /**
   * 主题缓存设置
   */
  cache: {
    /**
     * 是否启用缓存
     */
    enabled: boolean;
    /**
     * 缓存过期时间（毫秒）
     */
    ttl: number;
    /**
     * 缓存策略
     */
    strategy: 'memory' | 'localStorage' | 'sessionStorage';
  };
  /**
   * 主题预加载
   */
  preload: {
    /**
     * 是否预加载主题
     */
    enabled: boolean;
    /**
     * 预加载的主题列表
     */
    themes: string[];
  };
  /**
   * 主题切换动画
   */
  transition: {
    /**
     * 是否启用切换动画
     */
    enabled: boolean;
    /**
     * 动画持续时间（毫秒）
     */
    duration: number;
    /**
     * 动画缓动函数
     */
    easing: string;
  };
  /**
   * 系统主题检测
   */
  systemDetection: {
    /**
     * 是否启用系统主题检测
     */
    enabled: boolean;
    /**
     * 监听系统主题变化
     */
    watchSystemChanges: boolean;
  };
  /**
   * 主题验证
   */
  validation: {
    /**
     * 是否验证主题完整性
     */
    enabled: boolean;
    /**
     * 严格模式
     */
    strict: boolean;
    /**
     * 必需的主题属性
     */
    requiredProperties: string[];
  };
  /**
   * 主题生成
   */
  generation: {
    /**
     * 自动生成CSS变量
     */
    generateCSSVariables: boolean;
    /**
     * CSS变量前缀
     */
    cssVariablePrefix: string;
    /**
     * 生成类型定义
     */
    generateTypes: boolean;
  };
  /**
   * 开发模式设置
   */
  development: {
    /**
     * 热重载
     */
    hotReload: boolean;
    /**
     * 调试信息
     */
    debug: boolean;
    /**
     * 主题编辑器
     */
    enableEditor: boolean;
  };
}

/**
 * 主题切换模式
 */
export enum ThemeSwitchMode {
  Manual = 'manual',
  Auto = 'auto',
  System = 'system',
  Time = 'time',
}
