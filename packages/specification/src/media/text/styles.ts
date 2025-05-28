/**
 * Maxellabs 文本样式规范
 * 文本样式相关类型定义
 */

import type { Color } from '../../core/interfaces';
import type { BlendMode, GradientType } from '../../core/enums';

/**
 * 描边样式
 */
export enum TextStrokeStyle {
  /**
   * 实线
   */
  Solid = 'solid',
  /**
   * 虚线
   */
  Dashed = 'dashed',
  /**
   * 点线
   */
  Dotted = 'dotted',
}

/**
 * 描边位置
 */
export enum StrokePosition {
  /**
   * 外部
   */
  Outside = 'outside',
  /**
   * 内部
   */
  Inside = 'inside',
  /**
   * 中心
   */
  Center = 'center',
}

/**
 * 文本描边
 */
export interface TextStroke {
  /**
   * 描边宽度
   */
  width: number;
  /**
   * 描边颜色（使用统一Color）
   */
  color: Color;
  /**
   * 描边样式
   */
  style?: TextStrokeStyle;
  /**
   * 描边位置
   */
  position?: StrokePosition;
}

/**
 * 文本填充类型
 */
export enum TextFillType {
  /**
   * 颜色
   */
  Color = 'color',
  /**
   * 渐变
   */
  Gradient = 'gradient',
  /**
   * 图案
   */
  Pattern = 'pattern',
  /**
   * 图像
   */
  Image = 'image',
}

/**
 * 文本填充
 */
export interface TextFill {
  /**
   * 填充类型
   */
  type: TextFillType;
  /**
   * 颜色填充（使用统一Color）
   */
  color?: Color;
  /**
   * 渐变填充
   */
  gradient?: TextGradient;
  /**
   * 图案填充
   */
  pattern?: TextPattern;
  /**
   * 图像填充
   */
  image?: TextImage;
  /**
   * 混合模式（使用统一BlendMode）
   */
  blendMode?: BlendMode;
}

/**
 * 文本渐变
 */
export interface TextGradient {
  /**
   * 渐变类型
   */
  type: GradientType;
  /**
   * 渐变停止点
   */
  stops: GradientStop[];
  /**
   * 渐变角度
   */
  angle?: number;
  /**
   * 渐变中心
   */
  center?: [number, number];
  /**
   * 渐变半径
   */
  radius?: number;
}

/**
 * 渐变停止点
 */
export interface GradientStop {
  /**
   * 位置 (0-1)
   */
  position: number;
  /**
   * 颜色（使用统一Color）
   */
  color: Color;
}

/**
 * 图案重复模式
 */
export enum PatternRepeat {
  /**
   * 重复
   */
  Repeat = 'repeat',
  /**
   * X 轴重复
   */
  RepeatX = 'repeat-x',
  /**
   * Y 轴重复
   */
  RepeatY = 'repeat-y',
  /**
   * 不重复
   */
  NoRepeat = 'no-repeat',
}

/**
 * 文本图案
 */
export interface TextPattern {
  /**
   * 图案 URL
   */
  url: string;
  /**
   * 重复模式
   */
  repeat: PatternRepeat;
  /**
   * 图案大小
   */
  size?: [number, number];
  /**
   * 图案偏移
   */
  offset?: [number, number];
}

/**
 * 文本图像
 */
export interface TextImage {
  /**
   * 图像 URL
   */
  url: string;
  /**
   * 图像大小
   */
  size?: [number, number];
  /**
   * 图像位置
   */
  position?: [number, number];
  /**
   * 图像重复
   */
  repeat?: PatternRepeat;
}

/**
 * 背景大小
 */
export enum BackgroundSize {
  /**
   * 自动
   */
  Auto = 'auto',
  /**
   * 覆盖
   */
  Cover = 'cover',
  /**
   * 包含
   */
  Contain = 'contain',
}

/**
 * 背景位置
 */
export enum BackgroundPosition {
  /**
   * 左上
   */
  LeftTop = 'left top',
  /**
   * 左中
   */
  LeftCenter = 'left center',
  /**
   * 左下
   */
  LeftBottom = 'left bottom',
  /**
   * 右上
   */
  RightTop = 'right top',
  /**
   * 右中
   */
  RightCenter = 'right center',
  /**
   * 右下
   */
  RightBottom = 'right bottom',
  /**
   * 中上
   */
  CenterTop = 'center top',
  /**
   * 中心
   */
  Center = 'center',
  /**
   * 中下
   */
  CenterBottom = 'center bottom',
}

/**
 * 背景附着
 */
export enum BackgroundAttachment {
  /**
   * 滚动
   */
  Scroll = 'scroll',
  /**
   * 固定
   */
  Fixed = 'fixed',
  /**
   * 本地
   */
  Local = 'local',
}

/**
 * 文本背景
 */
export interface TextBackground {
  /**
   * 背景颜色（使用统一Color）
   */
  color?: Color;
  /**
   * 背景图像
   */
  image?: string;
  /**
   * 背景大小
   */
  size?: BackgroundSize;
  /**
   * 背景位置
   */
  position?: BackgroundPosition;
  /**
   * 背景重复
   */
  repeat?: PatternRepeat;
  /**
   * 背景附着
   */
  attachment?: BackgroundAttachment;
  /**
   * 混合模式（使用统一BlendMode）
   */
  blendMode?: BlendMode;
}

/**
 * 文本选择样式
 */
export interface TextSelection {
  /**
   * 选择背景色（使用统一Color）
   */
  backgroundColor?: Color;
  /**
   * 选择文本色（使用统一Color）
   */
  color?: Color;
}

/**
 * 边框样式
 */
export enum BorderStyle {
  /**
   * 无边框
   */
  None = 'none',
  /**
   * 实线
   */
  Solid = 'solid',
  /**
   * 虚线
   */
  Dashed = 'dashed',
  /**
   * 点线
   */
  Dotted = 'dotted',
  /**
   * 双线
   */
  Double = 'double',
  /**
   * 凹槽
   */
  Groove = 'groove',
  /**
   * 脊线
   */
  Ridge = 'ridge',
  /**
   * 内嵌
   */
  Inset = 'inset',
  /**
   * 外凸
   */
  Outset = 'outset',
}

/**
 * 文本边框
 */
export interface TextBorder {
  /**
   * 边框宽度
   */
  width: number;
  /**
   * 边框样式
   */
  style: BorderStyle;
  /**
   * 边框颜色（使用统一Color）
   */
  color: Color;
  /**
   * 边框圆角
   */
  radius?: number;
}
