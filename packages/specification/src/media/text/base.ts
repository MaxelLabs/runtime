/**
 * Maxellabs 文本基础规范
 * 文本基础类型定义
 */

import type { UsdPrim } from '../../core/usd';
import type { PerformanceConfig } from '../../core/interfaces';
import type { CommonTextElement, CommonTextStyle, TextOverflow, WordWrap } from '../../common';
import type { TextBackground, TextBorder, TextFill, TextSelection, TextStroke } from './styles';
import type { TextFlow } from './layout';

/**
 * 文本基础接口
 */
export interface TextPrim extends UsdPrim {
  typeName: 'Text';
}

/**
 * 媒体文本元素
 * 扩展通用文本元素，添加媒体特定的属性
 */
export interface MediaTextElement extends CommonTextElement {
  /**
   * 文本样式（媒体特定）
   */
  style: MediaTextStyle;
  /**
   * 文本布局
   */
  layout: TextLayout;
  /**
   * 性能配置
   */
  performance?: PerformanceConfig;
}

/**
 * 媒体文本样式
 * 扩展通用文本样式，添加媒体特定的样式属性
 */
export interface MediaTextStyle extends CommonTextStyle {
  /**
   * 文本描边
   */
  textStroke?: TextStroke;
  /**
   * 文本填充
   */
  textFill?: TextFill;
  /**
   * 文本背景
   */
  textBackground?: TextBackground;
  /**
   * 文本选择样式
   */
  selection?: TextSelection;
}

/**
 * 垂直对齐
 */
export enum VerticalAlign {
  /**
   * 顶部对齐
   */
  Top = 'top',
  /**
   * 中间对齐
   */
  Middle = 'middle',
  /**
   * 底部对齐
   */
  Bottom = 'bottom',
  /**
   * 基线对齐
   */
  Baseline = 'baseline',
}

/**
 * 文本方向
 */
export enum TextDirection {
  /**
   * 从左到右
   */
  LeftToRight = 'ltr',
  /**
   * 从右到左
   */
  RightToLeft = 'rtl',
}

/**
 * 书写模式
 */
export enum WritingMode {
  /**
   * 水平从上到下
   */
  HorizontalTopBottom = 'horizontal-tb',
  /**
   * 垂直从右到左
   */
  VerticalRightLeft = 'vertical-rl',
  /**
   * 垂直从左到右
   */
  VerticalLeftRight = 'vertical-lr',
}

/**
 * 文本定向
 */
export enum TextOrientation {
  /**
   * 混合
   */
  Mixed = 'mixed',
  /**
   * 直立
   */
  Upright = 'upright',
  /**
   * 侧向
   */
  Sideways = 'sideways',
}

/**
 * 文本装饰线类型
 */
export enum TextDecorationLine {
  /**
   * 无
   */
  None = 'none',
  /**
   * 下划线
   */
  Underline = 'underline',
  /**
   * 上划线
   */
  Overline = 'overline',
  /**
   * 删除线
   */
  LineThrough = 'line-through',
}

/**
 * 文本装饰线样式
 */
export enum TextDecorationStyle {
  /**
   * 实线
   */
  Solid = 'solid',
  /**
   * 双线
   */
  Double = 'double',
  /**
   * 点线
   */
  Dotted = 'dotted',
  /**
   * 虚线
   */
  Dashed = 'dashed',
  /**
   * 波浪线
   */
  Wavy = 'wavy',
}

/**
 * 文本布局
 */
export interface TextLayout {
  /**
   * 文本框
   */
  textBox?: TextBox;
  /**
   * 文本流
   */
  textFlow?: TextFlow;
  /**
   * 文本换行（使用通用类型）
   */
  textWrap?: WordWrap;
  /**
   * 文本溢出（使用通用类型）
   */
  textOverflow?: TextOverflow;
  /**
   * 文本方向
   */
  direction?: TextDirection;
  /**
   * 书写模式
   */
  writingMode?: WritingMode;
  /**
   * 文本定向
   */
  textOrientation?: TextOrientation;
}

/**
 * 文本框
 */
export interface TextBox {
  /**
   * 宽度
   */
  width?: number;
  /**
   * 高度
   */
  height?: number;
  /**
   * 内边距
   */
  padding?: TextPadding;
  /**
   * 边框
   */
  border?: TextBorder;
  /**
   * 背景
   */
  background?: TextBackground;
}

/**
 * 文本内边距
 */
export interface TextPadding {
  /**
   * 上边距
   */
  top: number;
  /**
   * 右边距
   */
  right: number;
  /**
   * 下边距
   */
  bottom: number;
  /**
   * 左边距
   */
  left: number;
}

// 重新导出通用类型以保持兼容性
export {
  TextAlign,
  FontStyle,
  FontWeight,
  TextDecoration,
  TextTransform,
  TextOverflow,
  WordWrap,
  TextShadow,
} from '../../common';

// 为了保持向后兼容性，创建别名
export type TextStyle = MediaTextStyle;
export type TextElement = MediaTextElement;
