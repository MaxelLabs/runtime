/**
 * Maxellabs 设计样式定义
 * 包含填充、描边、阴影、模糊等视觉样式
 */

// 从 core 模块导入基础类型
import type {
  GradientStop,
  ITransform,
  CommonMetadata,
  BlendMode,
  GradientType,
  LineCap,
  LineJoin,
  StrokePosition,
  StyleType,
  ColorLike,
  Nameable,
  Describable,
} from '../core';

// 从 common 模块导入通用类型
import type {
  TextAlign,
  FontStyle,
  FontWeight,
  TextDecoration,
  TextTransform,
  ImageFilter,
  ImageScaleMode,
} from '../common';
import type { BlurType, DesignShadowType, FillType, StrokeType } from './enums';
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
   * 颜色（使用通用Color）
   */
  color?: ColorLike;
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
   * 混合模式（使用通用BlendMode）
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
   * 颜色（使用通用Color）
   */
  color?: ColorLike;
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
   * 图像变换（使用通用Transform）
   */
  transform?: ITransform;
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
  type: DesignShadowType;
  /**
   * 颜色（使用通用Color）
   */
  color: ColorLike;
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
 * 扩展通用文本样式，添加设计工具特定的属性
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
   * 字体粗细（使用通用类型）
   */
  fontWeight: FontWeight;
  /**
   * 字体样式（使用通用类型）
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
   * 文本对齐（使用通用类型）
   */
  textAlign?: TextAlign;
  /**
   * 文本装饰（使用通用类型）
   */
  textDecoration?: TextDecoration;
  /**
   * 文本变换（使用通用类型）
   */
  textTransform?: TextTransform;
}

/**
 * 设计样式定义
 *
 * @description 组合 Nameable, Describable traits
 */
export interface DesignStyleDefinition extends Nameable, Describable {
  /**
   * 样式 ID
   */
  id: string;
  /**
   * 样式类型
   */
  type: StyleType;
  /**
   * 样式属性
   */
  properties: DesignStyle;
  /**
   * 混合模式（使用通用BlendMode）
   */
  blendMode?: BlendMode;
  /**
   * 样式元数据
   */
  metadata?: CommonMetadata;
}
