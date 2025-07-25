/**
 * Maxellabs 通用文本元素
 * 定义所有系统共通的文本相关类型
 */

import type { CommonElement } from './elements';
import type { ElementType, ColorLike, VerticalAlign } from '../core';
import type { PerformanceConfiguration } from '../package';

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
  /**
   * 自动
   */
  Auto = 'auto',
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
 * 字体粗细
 * @deprecated 使用 PerformanceConfiguration 作为权威定义
 */
export type FontWeight = PerformanceConfiguration;

/**
 * 文本装饰
 */
export enum TextDecoration {
  /**
   * 无装饰
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
 * 文本变换
 */
export enum TextTransform {
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
}

/**
 * 文本溢出处理
 */
export enum TextOverflow {
  /**
   * 可见
   */
  Visible = 'visible',
  /**
   * 隐藏
   */
  Hidden = 'hidden',
  /**
   * 省略号
   */
  Ellipsis = 'ellipsis',
  /**
   * 裁剪
   */
  Clip = 'clip',
}

/**
 * 换行模式
 */
export enum WordWrap {
  /**
   * 正常换行
   */
  Normal = 'normal',
  /**
   * 强制换行
   */
  BreakWord = 'break-word',
  /**
   * 保持完整
   */
  KeepAll = 'keep-all',
  /**
   * 不换行
   */
  NoWrap = 'nowrap',
}
/**
 * 文本对齐方式
 */
export enum TextAlign {
  /**
   * 左对齐
   */
  Left = 'left',
  /**
   * 居中对齐
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
   * 起始对齐（根据文本方向）
   */
  Start = 'start',
  /**
   * 结束对齐（根据文本方向）
   */
  End = 'end',
}

/**
 * 通用文本样式
 */
export interface CommonTextStyle {
  /**
   * 字体族
   */
  fontFamily?: string;
  /**
   * 字体大小
   */
  fontSize?: number;
  /**
   * 字体样式
   */
  fontStyle?: FontStyle;
  /**
   * 字体粗细
   */
  fontWeight?: FontWeight;
  /**
   * 行高
   */
  lineHeight?: number;
  /**
   * 字符间距
   */
  letterSpacing?: number;
  /**
   * 单词间距
   */
  wordSpacing?: number;
  /**
   * 文本颜色
   */
  color?: ColorLike;
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
  /**
   * 文本溢出
   */
  textOverflow?: TextOverflow;
  /**
   * 换行模式
   */
  wordWrap?: WordWrap;
  /**
   * 最大行数
   */
  maxLines?: number;
  /**
   * 文本阴影
   */
  textShadow?: TextShadow;
  /**
   * 文本描边
   */
  textStroke?: TextStroke;
}

/**
 * 文本阴影
 */
export interface TextShadow {
  /**
   * 水平偏移
   */
  offsetX: number;
  /**
   * 垂直偏移
   */
  offsetY: number;
  /**
   * 模糊半径
   */
  blurRadius: number;
  /**
   * 阴影颜色
   */
  color: ColorLike;
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
   * 描边颜色
   */
  color: ColorLike;
}

/**
 * 通用文本元素
 */
export interface CommonTextElement extends CommonElement {
  type: ElementType.Text;
  /**
   * 文本内容
   */
  content: string;
  /**
   * 文本样式
   */
  textStyle?: CommonTextStyle;
  /**
   * 是否可编辑
   */
  editable?: boolean;
  /**
   * 是否可选择
   */
  selectable?: boolean;
  /**
   * 占位符文本
   */
  placeholder?: string;
  /**
   * 最大字符数
   */
  maxLength?: number;
  /**
   * 是否多行
   */
  multiline?: boolean;
  /**
   * 自动调整大小
   */
  autoResize?: boolean;
}

/**
 * 富文本片段
 */
export interface RichTextSegment {
  /**
   * 文本内容
   */
  text: string;
  /**
   * 样式
   */
  style?: CommonTextStyle;
  /**
   * 开始位置
   */
  start: number;
  /**
   * 结束位置
   */
  end: number;
  /**
   * 链接地址（可选）
   */
  href?: string;
}

/**
 * 富文本元素
 */
export interface RichTextElement extends CommonElement {
  type: ElementType.Text;
  /**
   * 富文本片段
   */
  segments: RichTextSegment[];
  /**
   * 默认样式
   */
  defaultStyle?: CommonTextStyle;
  /**
   * 是否可编辑
   */
  editable?: boolean;
  /**
   * 是否可选择
   */
  selectable?: boolean;
}
