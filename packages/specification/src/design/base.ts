/**
 * Maxellabs 设计模块基础定义
 * 设计系统特有的接口和类型
 */

import type { ComponentPropertyType, IconStyle } from './enums';
import type { ConstraintConfig, BaseComponentProperty, ConstraintType } from '../core';

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
 */
export interface DesignComponentVariant {
  /**
   * 变体名称
   */
  name: string;
  /**
   * 变体属性
   */
  properties: Record<string, any>;
}

/**
 * 图标变体（设计特有）
 */
export interface DesignIconVariant {
  /**
   * 变体名称
   */
  name: string;
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
 */
export interface DesignIconCategory {
  /**
   * 分类 ID
   */
  id: string;
  /**
   * 分类名称
   */
  name: string;
  /**
   * 分类描述
   */
  description?: string;
  /**
   * 父分类
   */
  parent?: string;
}
