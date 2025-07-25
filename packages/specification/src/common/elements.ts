/**
 * Maxellabs 通用元素基础接口
 * 定义所有系统共通的元素基础类型
 */

import type {
  BlendMode,
  ElementType,
  UsdPrim,
  CommonMetadata,
  ITransform,
  AnimationProperties,
  InteractionProperties,
  MaterialProperties,
  RenderingProperties,
} from '../core/';

/**
 * 通用边界框
 */
export interface CommonBounds {
  /**
   * X坐标
   */
  x: number;
  /**
   * Y坐标
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
  /**
   * Z坐标（可选）
   */
  z?: number;
  /**
   * 深度（可选）
   */
  depth?: number;
}

/**
 * 通用约束
 */
export interface CommonConstraints {
  /**
   * 左边距约束
   */
  left?: ConstraintValue;
  /**
   * 右边距约束
   */
  right?: ConstraintValue;
  /**
   * 顶部约束
   */
  top?: ConstraintValue;
  /**
   * 底部约束
   */
  bottom?: ConstraintValue;
  /**
   * 水平中心约束
   */
  centerX?: ConstraintValue;
  /**
   * 垂直中心约束
   */
  centerY?: ConstraintValue;
  /**
   * 宽度约束
   */
  width?: ConstraintValue;
  /**
   * 高度约束
   */
  height?: ConstraintValue;
  /**
   * 宽高比约束
   */
  aspectRatio?: number;
}

/**
 * 约束值
 */
export interface ConstraintValue {
  /**
   * 约束类型
   */
  type: CommonConstraintType;
  /**
   * 约束值
   */
  value: number;
  /**
   * 目标元素ID（相对约束时使用）
   */
  target?: string;
}

/**
 * 约束类型
 */
export enum CommonConstraintType {
  /**
   * 固定值
   */
  Fixed = 'fixed',
  /**
   * 百分比
   */
  Percentage = 'percentage',
  /**
   * 相对于父元素
   */
  Parent = 'parent',
  /**
   * 相对于其他元素
   */
  Relative = 'relative',
  /**
   * 自动
   */
  Auto = 'auto',
}

/**
 * 通用元素基础接口
 */
export interface CommonElement extends Omit<UsdPrim, 'metadata' | 'children'> {
  /**
   * 元素ID
   */
  id: string;
  /**
   * 元素名称
   */
  name: string;
  /**
   * 元素类型
   */
  type: ElementType;
  /**
   * 边界框
   */
  bounds: CommonBounds;
  /**
   * 变换
   */
  transform?: ITransform;
  /**
   * 可见性
   */
  visible: boolean;
  /**
   * 锁定状态
   */
  locked: boolean;
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 混合模式
   */
  blendMode?: BlendMode;
  /**
   * 材质属性
   */
  material?: MaterialProperties;
  /**
   * 渲染属性
   */
  rendering?: RenderingProperties;
  /**
   * 动画属性
   */
  animation?: AnimationProperties;
  /**
   * 交互属性
   */
  interaction?: InteractionProperties;
  /**
   * 约束
   */
  constraints?: CommonConstraints;
  /**
   * 子元素
   */
  children?: CommonElement[];
  /**
   * 父元素ID
   */
  parentId?: string;
  /**
   * 层级顺序
   */
  zIndex?: number;
  /**
   * 元数据
   */
  metadata?: CommonMetadata;
}

/**
 * 通用容器元素
 */
export interface CommonContainer extends CommonElement {
  /**
   * 子元素列表
   */
  children: CommonElement[];
  /**
   * 布局模式
   */
  layoutMode?: LayoutMode;
  /**
   * 内边距
   */
  padding?: Padding;
  /**
   * 溢出处理
   */
  overflow?: OverflowMode;
  /**
   * 裁剪内容
   */
  clipContent?: boolean;
}

/**
 * 布局模式
 */
export enum LayoutMode {
  /**
   * 自由布局
   */
  Free = 'free',
  /**
   * 水平布局
   */
  Horizontal = 'horizontal',
  /**
   * 垂直布局
   */
  Vertical = 'vertical',
  /**
   * 网格布局
   */
  Grid = 'grid',
  /**
   * 弹性布局
   */
  Flex = 'flex',
}

/**
 * 内边距
 */
export interface Padding {
  /**
   * 顶部内边距
   */
  top: number;
  /**
   * 右侧内边距
   */
  right: number;
  /**
   * 底部内边距
   */
  bottom: number;
  /**
   * 左侧内边距
   */
  left: number;
}

/**
 * 溢出处理模式
 */
export enum OverflowMode {
  /**
   * 可见
   */
  Visible = 'visible',
  /**
   * 隐藏
   */
  Hidden = 'hidden',
  /**
   * 滚动
   */
  Scroll = 'scroll',
  /**
   * 自动
   */
  Auto = 'auto',
}
