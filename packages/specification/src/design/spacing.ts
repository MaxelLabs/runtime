/**
 * Maxellabs 设计间距系统定义
 * 包含间距比例、使用场景和断点系统相关类型
 */

import type { DeviceType, Nameable, Describable } from '../core';

/**
 * 设计间距系统
 */
export interface DesignSpacingSystem {
  /**
   * 基础单位
   */
  base: number;
  /**
   * 间距比例
   */
  scale: number[];
  /**
   * 命名间距
   */
  named: Record<string, number>;
  /**
   * 间距用途
   */
  usage?: SpacingUsage[];
}

/**
 * 间距用途
 *
 * @description 组合 Nameable, Describable traits
 */
export interface SpacingUsage extends Nameable, Describable {
  /**
   * 用途值
   */
  value: number;
  /**
   * 使用场景
   */
  context?: SpacingContext[];
}

/**
 * 间距场景
 */
export enum SpacingContext {
  Margin = 'margin',
  Padding = 'padding',
  Gap = 'gap',
  Border = 'border',
  Component = 'component',
  Layout = 'layout',
}

/**
 * 设计断点系统
 */
export interface DesignBreakpoints {
  /**
   * 断点定义
   */
  values: Record<string, number>;
  /**
   * 单位
   */
  unit: BreakpointUnit;
  /**
   * 默认断点
   */
  default: string;
  /**
   * 断点用途
   */
  usage?: BreakpointUsage[];
}

/**
 * 断点单位
 */
export enum BreakpointUnit {
  Pixel = 'px',
  Em = 'em',
  Rem = 'rem',
  Viewport = 'vw',
}

/**
 * 断点用途
 *
 * @description 组合 Nameable, Describable traits
 */
export interface BreakpointUsage extends Nameable, Describable {
  /**
   * 最小宽度
   */
  minWidth?: number;
  /**
   * 最大宽度
   */
  maxWidth?: number;
  /**
   * 设备类型
   */
  device?: DeviceType[];
}
