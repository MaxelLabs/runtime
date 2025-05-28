/**
 * Maxellabs 设计颜色系统定义
 * 包含调色板、颜色模式和可访问性相关类型
 */

import type { Color } from '../core/interfaces';

/**
 * 设计颜色系统
 */
export interface DesignColorSystem {
  /**
   * 主色调
   */
  primary: DesignColorPalette;
  /**
   * 次要色调
   */
  secondary?: DesignColorPalette;
  /**
   * 中性色
   */
  neutral: DesignColorPalette;
  /**
   * 语义色彩
   */
  semantic: {
    success: DesignColorPalette;
    warning: DesignColorPalette;
    error: DesignColorPalette;
    info: DesignColorPalette;
  };
  /**
   * 自定义色彩
   */
  custom?: Record<string, DesignColorPalette>;
  /**
   * 颜色模式
   */
  modes?: DesignColorMode[];
}

/**
 * 设计调色板
 */
export interface DesignColorPalette {
  /**
   * 调色板名称
   */
  name: string;
  /**
   * 颜色变体（使用统一Color）
   */
  variants: Record<string, Color>;
  /**
   * 颜色用途
   */
  usage?: ColorUsage[];
  /**
   * 可访问性信息
   */
  accessibility?: ColorAccessibility;
}

/**
 * 颜色用途
 */
export interface ColorUsage {
  /**
   * 用途名称
   */
  name: string;
  /**
   * 用途描述
   */
  description?: string;
  /**
   * 推荐场景
   */
  context?: ColorContext[];
}

/**
 * 颜色场景
 */
export enum ColorContext {
  Background = 'background',
  Foreground = 'foreground',
  Border = 'border',
  Surface = 'surface',
  Text = 'text',
  Icon = 'icon',
  Accent = 'accent',
}

/**
 * 颜色可访问性
 */
export interface ColorAccessibility {
  /**
   * 对比度信息
   */
  contrast: ContrastInfo[];
  /**
   * 色盲友好
   */
  colorBlindFriendly?: boolean;
  /**
   * WCAG 级别
   */
  wcagLevel?: WCAGLevel;
}

/**
 * 对比度信息
 */
export interface ContrastInfo {
  /**
   * 背景颜色
   */
  background: string;
  /**
   * 前景颜色
   */
  foreground: string;
  /**
   * 对比度比值
   */
  ratio: number;
  /**
   * 是否通过 AA
   */
  passAA: boolean;
  /**
   * 是否通过 AAA
   */
  passAAA: boolean;
}

/**
 * WCAG 级别
 */
export enum WCAGLevel {
  A = 'A',
  AA = 'AA',
  AAA = 'AAA',
}

/**
 * 颜色模式
 */
export interface DesignColorMode {
  /**
   * 模式名称
   */
  name: string;
  /**
   * 模式类型
   */
  type: ColorModeType;
  /**
   * 颜色映射
   */
  colors: Record<string, Color>;
  /**
   * 是否为默认模式
   */
  default?: boolean;
}

/**
 * 颜色模式类型
 */
export enum ColorModeType {
  Light = 'light',
  Dark = 'dark',
  HighContrast = 'high-contrast',
  Custom = 'custom',
}
