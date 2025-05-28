/**
 * Maxellabs 设计模块基础定义
 * 设计系统的基础接口和类型
 */

import type {
  DesignElementType,
  DesignConstraintType,
  ComponentPropertyType,
  IconStyle,
  StyleType,
  FillType,
  StrokeType,
  LineCap,
  LineJoin,
  ShadowType,
  BlurType,
} from './enums';

// 从 common 模块导入共通类型
import type { ImageScaleMode } from '../common/image';

export type {
  DesignElementType,
  DesignConstraintType,
  ComponentPropertyType,
  IconStyle,
  StyleType,
  FillType,
  StrokeType,
  LineCap,
  LineJoin,
  ImageScaleMode,
  ShadowType,
  BlurType,
};

// 为向后兼容性导出别名
export type ConstraintType = DesignConstraintType;

/**
 * 设计约束
 */
export interface DesignConstraints {
  /**
   * 水平约束
   */
  horizontal: DesignConstraintType;
  /**
   * 垂直约束
   */
  vertical: DesignConstraintType;
}

/**
 * 组件实例
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
 * 组件属性定义
 */
export interface DesignComponentProperty {
  /**
   * 属性名称
   */
  name: string;
  /**
   * 属性类型
   */
  type: ComponentPropertyType;
  /**
   * 默认值
   */
  defaultValue?: any;
  /**
   * 可选值
   */
  options?: any[];
}

/**
 * 组件变体
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
 * 图标变体
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
 * 图标分类
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

/**
 * 设计边界框
 */
export interface DesignBounds {
  /**
   * X 坐标
   */
  x: number;
  /**
   * Y 坐标
   */
  y: number;
  /**
   * 宽度
   */
  width: number;
  /**
   * 高度
   */
  height: number;
}
