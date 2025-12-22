/**
 * Maxellabs 设计模块基础定义
 * 设计系统特有的接口和类型
 */

import type { ComponentPropertyType, IconStyle } from './enums';
import type { ConstraintConfig, BaseComponentProperty, ConstraintType, BaseCategory, Nameable } from '../core';

/**
 * 设计约束（扩展核心约束配置）
 */
export interface DesignConstraints extends ConstraintConfig {
  /**
   * 水平约束
   */
  horizontal: ConstraintType;
  /**
   * 垂直约束
   */
  vertical: ConstraintType;
}

/**
 * 组件实例（设计特有）
 */
export interface ComponentInstance {
  /**
   * 组件 ID
   */
  componentId: string;
  /**
   * 实例 ID
   */
  instanceId: string;
  /**
   * 属性覆盖
   */
  overrides?: Record<string, any>;
  /**
   * 变体属性
   */
  variantProperties?: Record<string, string>;
}

/**
 * 设计组件属性定义（扩展核心组件属性）
 */
export interface DesignComponentProperty extends BaseComponentProperty {
  /**
   * 属性类型
   */
  type: ComponentPropertyType;
}

/**
 * 组件变体（设计特有）
 *
 * @description 组合 Nameable trait
 */
export interface DesignComponentVariant extends Nameable {
  /**
   * 变体属性
   */
  properties: Record<string, any>;
}

/**
 * 图标变体（设计特有）
 *
 * @description 组合 Nameable trait
 */
export interface DesignIconVariant extends Nameable {
  /**
   * 变体样式
   */
  style: IconStyle;
  /**
   * SVG 数据
   */
  svg: string;
}

/**
 * 图标分类（设计特有）
 *
 * @description 继承自 BaseCategory，无额外字段
 */
export type DesignIconCategory = BaseCategory;
