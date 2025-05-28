/**
 * Maxellabs 文本基础规范
 * 文本基础类型定义
 */

import type { UsdPrim, UsdValue } from '../../core/usd';
import type {
  Transform,
  Color,
  AnimationProperties,
  InteractionProperties,
  MaterialProperties,
  RenderingProperties,
  PerformanceConfig,
  CommonMetadata,
} from '../../core/interfaces';
import type { TextBackground, TextBorder, TextFill, TextSelection, TextStroke } from './styles';
import type { BlendMode, VerticalAlign } from '../../core';
import type { TextFlow, TextOverflow, TextWrap } from './layout';
/**
 * 文本基础接口
 */
export interface TextPrim extends UsdPrim {
  typeName: 'Text';
}

/**
 * 文本元素
 */
export interface TextElement extends TextPrim {
  attributes: {
    /**
     * 文本内容
     */
    content: UsdValue; // string
    /**
     * 字体族
     */
    fontFamily: UsdValue; // string
    /**
     * 字体大小
     */
    fontSize: UsdValue; // float
    /**
     * 字体粗细
     */
    fontWeight: UsdValue; // FontWeight
    /**
     * 字体样式
     */
    fontStyle: UsdValue; // FontStyle
    /**
     * 文本颜色（使用统一Color）
     */
    color: UsdValue; // Color
    /**
     * 文本对齐
     */
    textAlign: UsdValue; // TextAlign
    /**
     * 行高
     */
    lineHeight: UsdValue; // float
    /**
     * 字符间距
     */
    letterSpacing: UsdValue; // float
    /**
     * 单词间距
     */
    wordSpacing?: UsdValue; // float
    /**
     * 段落间距
     */
    paragraphSpacing?: UsdValue; // float
  };
  /**
   * 文本样式
   */
  style: TextStyle;
  /**
   * 文本布局
   */
  layout: TextLayout;
  /**
   * 文本变换（使用统一Transform）
   */
  transform?: Transform;
  /**
   * 材质属性（使用统一MaterialProperties）
   */
  material?: MaterialProperties;
  /**
   * 渲染属性（使用统一RenderingProperties）
   */
  rendering?: RenderingProperties;
  /**
   * 动画属性（使用统一AnimationProperties）
   */
  animation?: AnimationProperties;
  /**
   * 交互属性（使用统一InteractionProperties）
   */
  interaction?: InteractionProperties;
  /**
   * 性能配置（使用统一PerformanceConfig）
   */
  performance?: PerformanceConfig;
  /**
   * 元数据（使用统一CommonMetadata）
   */
  metadata: CommonMetadata;
}

/**
 * 字体粗细
 */
export enum FontWeight {
  Thin = 100,
  ExtraLight = 200,
  Light = 300,
  Normal = 400,
  Medium = 500,
  SemiBold = 600,
  Bold = 700,
  ExtraBold = 800,
  Black = 900,
}

/**
 * 字体样式
 */
export enum FontStyle {
  /**
   * 正常
   */
  Normal = 'normal',
  /**
   * 斜体
   */
  Italic = 'italic',
  /**
   * 倾斜
   */
  Oblique = 'oblique',
}

/**
 * 文本对齐
 */
export enum TextAlign {
  /**
   * 左对齐
   */
  Left = 'left',
  /**
   * 居中
   */
  Center = 'center',
  /**
   * 右对齐
   */
  Right = 'right',
  /**
   * 两端对齐
   */
  Justify = 'justify',
  /**
   * 起始对齐
   */
  Start = 'start',
  /**
   * 结束对齐
   */
  End = 'end',
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
 * 文本变换类型
 */
export enum TextTransformType {
  /**
   * 无变换
   */
  None = 'none',
  /**
   * 大写
   */
  Uppercase = 'uppercase',
  /**
   * 小写
   */
  Lowercase = 'lowercase',
  /**
   * 首字母大写
   */
  Capitalize = 'capitalize',
  /**
   * 全角
   */
  FullWidth = 'full-width',
  /**
   * 半角
   */
  FullSizeKana = 'full-size-kana',
}

/**
 * 文本样式
 */
export interface TextStyle {
  /**
   * 文本装饰
   */
  textDecoration?: TextDecoration;
  /**
   * 文本变换
   */
  textTransform?: TextTransformType;
  /**
   * 垂直对齐
   */
  verticalAlign?: VerticalAlign;
  /**
   * 文本阴影
   */
  textShadow?: TextShadow[];
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
  /**
   * 混合模式（使用统一BlendMode）
   */
  blendMode?: BlendMode;
}

/**
 * 文本装饰
 */
export interface TextDecoration {
  /**
   * 装饰线类型
   */
  line: TextDecorationLine;
  /**
   * 装饰线样式
   */
  style?: TextDecorationStyle;
  /**
   * 装饰线颜色（使用统一Color）
   */
  color?: Color;
  /**
   * 装饰线厚度
   */
  thickness?: number;
}

/**
 * 文本阴影
 */
export interface TextShadow {
  /**
   * X 偏移
   */
  offsetX: number;
  /**
   * Y 偏移
   */
  offsetY: number;
  /**
   * 模糊半径
   */
  blurRadius: number;
  /**
   * 阴影颜色（使用统一Color）
   */
  color: Color;
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
   * 文本换行
   */
  textWrap?: TextWrap;
  /**
   * 文本溢出
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
