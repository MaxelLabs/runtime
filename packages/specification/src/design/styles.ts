/**
 * Maxellabs 设计样式定义
 * 包含填充、描边、阴影、模糊等视觉样式
 */

import type { Transform, Color, ImageFilter, GradientStop } from '../core/interfaces';
import type { BlendMode, GradientType, StrokePosition, VerticalAlign } from '../core/enums';
import type { StyleType, FillType, StrokeType, LineCap, LineJoin, ImageScaleMode, ShadowType, BlurType } from './base';

/**
 * 设计样式
 */
export interface DesignStyle {
  /**
   * 填充
   */
  fills?: DesignFill[];
  /**
   * 描边
   */
  strokes?: DesignStroke[];
  /**
   * 阴影
   */
  shadows?: DesignShadow[];
  /**
   * 模糊
   */
  blur?: DesignBlur;
  /**
   * 圆角
   */
  cornerRadius?: number | number[];
  /**
   * 文本样式
   */
  textStyle?: DesignTextStyle;
}

/**
 * 设计填充
 */
export interface DesignFill {
  /**
   * 填充类型
   */
  type: FillType;
  /**
   * 颜色（使用统一Color）
   */
  color?: Color;
  /**
   * 渐变
   */
  gradient?: DesignGradient;
  /**
   * 图像
   */
  image?: DesignImage;
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 可见性
   */
  visible: boolean;
  /**
   * 混合模式（使用统一BlendMode）
   */
  blendMode?: BlendMode;
}

/**
 * 设计描边
 */
export interface DesignStroke {
  /**
   * 描边类型
   */
  type: StrokeType;
  /**
   * 颜色（使用统一Color）
   */
  color?: Color;
  /**
   * 渐变
   */
  gradient?: DesignGradient;
  /**
   * 宽度
   */
  weight: number;
  /**
   * 位置
   */
  position: StrokePosition;
  /**
   * 线帽
   */
  lineCap?: LineCap;
  /**
   * 线连接
   */
  lineJoin?: LineJoin;
  /**
   * 虚线模式
   */
  dashPattern?: number[];
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 可见性
   */
  visible: boolean;
}

/**
 * 设计渐变
 */
export interface DesignGradient {
  /**
   * 渐变类型
   */
  type: GradientType;
  /**
   * 渐变停止点
   */
  stops: GradientStop[];
  /**
   * 变换矩阵
   */
  transform?: number[];
}

/**
 * 设计图像
 */
export interface DesignImage {
  /**
   * 图像 URL 或引用
   */
  url: string;
  /**
   * 缩放模式
   */
  scaleMode: ImageScaleMode;
  /**
   * 图像变换（使用统一Transform）
   */
  transform?: Transform;
  /**
   * 图像滤镜
   */
  filters?: ImageFilter[];
}

/**
 * 设计阴影
 */
export interface DesignShadow {
  /**
   * 阴影类型
   */
  type: ShadowType;
  /**
   * 颜色（使用统一Color）
   */
  color: Color;
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
  blur: number;
  /**
   * 扩散
   */
  spread?: number;
  /**
   * 可见性
   */
  visible: boolean;
}

/**
 * 设计模糊
 */
export interface DesignBlur {
  /**
   * 模糊类型
   */
  type: BlurType;
  /**
   * 模糊半径
   */
  radius: number;
}

/**
 * 设计文本样式
 */
export interface DesignTextStyle {
  /**
   * 字体族
   */
  fontFamily: string;
  /**
   * 字体大小
   */
  fontSize: number;
  /**
   * 字体粗细
   */
  fontWeight: number | string;
  /**
   * 字体样式
   */
  fontStyle?: FontStyle;
  /**
   * 行高
   */
  lineHeight?: number | string;
  /**
   * 字符间距
   */
  letterSpacing?: number;
  /**
   * 段落间距
   */
  paragraphSpacing?: number;
  /**
   * 文本对齐
   */
  textAlign?: TextAlign;
  /**
   * 垂直对齐
   */
  verticalAlign?: VerticalAlign;
  /**
   * 文本装饰
   */
  textDecoration?: TextDecoration;
  /**
   * 文本变换
   */
  textTransform?: TextTransform;
}

/**
 * 字体样式
 */
export enum FontStyle {
  Normal = 'normal',
  Italic = 'italic',
}

/**
 * 文本对齐
 */
export enum TextAlign {
  Left = 'left',
  Center = 'center',
  Right = 'right',
  Justify = 'justify',
}

/**
 * 文本装饰
 */
export enum TextDecoration {
  None = 'none',
  Underline = 'underline',
  LineThrough = 'line-through',
}

/**
 * 文本变换
 */
export enum TextTransform {
  None = 'none',
  Uppercase = 'uppercase',
  Lowercase = 'lowercase',
  Capitalize = 'capitalize',
}

/**
 * 样式定义
 */
export interface DesignStyleDefinition {
  /**
   * 样式 ID
   */
  id: string;
  /**
   * 样式名称
   */
  name: string;
  /**
   * 样式类型
   */
  type: StyleType;
  /**
   * 样式属性
   */
  properties: DesignStyle;
  /**
   * 样式描述
   */
  description?: string;
  /**
   * 混合模式（使用统一BlendMode）
   */
  blendMode?: BlendMode;
}
