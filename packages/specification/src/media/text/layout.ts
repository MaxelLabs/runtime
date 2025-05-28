/**
 * Maxellabs 文本布局规范
 * 文本布局和排版相关类型定义
 */

import type { Color } from '../../core/interfaces';
import type { BorderStyle } from './styles';

/**
 * 流动方向
 */
export enum FlowDirection {
  /**
   * 水平
   */
  Horizontal = 'horizontal',
  /**
   * 垂直
   */
  Vertical = 'vertical',
}

/**
 * 文本流
 */
export interface TextFlow {
  /**
   * 流动方向
   */
  direction: FlowDirection;
  /**
   * 列数
   */
  columns?: number;
  /**
   * 列间距
   */
  columnGap?: number;
  /**
   * 列分隔线
   */
  columnRule?: ColumnRule;
}

/**
 * 列分隔线
 */
export interface ColumnRule {
  /**
   * 分隔线宽度
   */
  width: number;
  /**
   * 分隔线样式
   */
  style: BorderStyle;
  /**
   * 分隔线颜色（使用统一Color）
   */
  color: Color;
}

/**
 * 换行模式
 */
export enum WrapMode {
  /**
   * 正常换行
   */
  Normal = 'normal',
  /**
   * 强制换行
   */
  BreakWord = 'break-word',
  /**
   * 不换行
   */
  NoWrap = 'nowrap',
}

/**
 * 断词规则
 */
export enum WordBreak {
  /**
   * 正常
   */
  Normal = 'normal',
  /**
   * 断开所有
   */
  BreakAll = 'break-all',
  /**
   * 保持所有
   */
  KeepAll = 'keep-all',
}

/**
 * 连字符
 */
export enum Hyphens {
  /**
   * 无
   */
  None = 'none',
  /**
   * 手动
   */
  Manual = 'manual',
  /**
   * 自动
   */
  Auto = 'auto',
}

/**
 * 空白处理
 */
export enum WhiteSpace {
  /**
   * 正常
   */
  Normal = 'normal',
  /**
   * 不换行
   */
  NoWrap = 'nowrap',
  /**
   * 预格式化
   */
  Pre = 'pre',
  /**
   * 预换行
   */
  PreWrap = 'pre-wrap',
  /**
   * 预行
   */
  PreLine = 'pre-line',
}

/**
 * 文本换行
 */
export interface TextWrap {
  /**
   * 换行模式
   */
  mode: WrapMode;
  /**
   * 断词规则
   */
  wordBreak?: WordBreak;
  /**
   * 连字符
   */
  hyphens?: Hyphens;
  /**
   * 空白处理
   */
  whiteSpace?: WhiteSpace;
}

/**
 * 溢出类型
 */
export enum OverflowType {
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
  /**
   * 省略
   */
  Ellipsis = 'ellipsis',
}

/**
 * 媒体文本溢出
 */
export interface MediaTextOverflow {
  /**
   * 溢出处理
   */
  overflow: OverflowType;
  /**
   * 省略号
   */
  ellipsis?: string;
  /**
   * 淡出
   */
  fade?: boolean;
}

// 为了保持向后兼容性，创建别名
export type TextOverflow = MediaTextOverflow;

/**
 * 段落对齐
 */
export interface ParagraphAlignment {
  /**
   * 水平对齐
   */
  horizontal: TextAlign;
  /**
   * 垂直对齐
   */
  vertical?: VerticalAlign;
  /**
   * 文本分布
   */
  distribute?: boolean;
}

/**
 * 段落缩进
 */
export interface ParagraphIndent {
  /**
   * 首行缩进
   */
  firstLine?: number;
  /**
   * 左缩进
   */
  left?: number;
  /**
   * 右缩进
   */
  right?: number;
  /**
   * 悬挂缩进
   */
  hanging?: number;
}

/**
 * 段落间距
 */
export interface ParagraphSpacing {
  /**
   * 段前间距
   */
  before?: number;
  /**
   * 段后间距
   */
  after?: number;
  /**
   * 行间距
   */
  lineSpacing?: number;
  /**
   * 行间距类型
   */
  lineSpacingType?: LineSpacingType;
}

/**
 * 行间距类型
 */
export enum LineSpacingType {
  /**
   * 固定值
   */
  Exact = 'exact',
  /**
   * 倍数
   */
  Multiple = 'multiple',
  /**
   * 最小值
   */
  AtLeast = 'at-least',
}

/**
 * 列表类型
 */
export enum ListType {
  /**
   * 无序列表
   */
  Unordered = 'unordered',
  /**
   * 有序列表
   */
  Ordered = 'ordered',
  /**
   * 定义列表
   */
  Definition = 'definition',
}

/**
 * 标记位置
 */
export enum MarkerPosition {
  /**
   * 内部
   */
  Inside = 'inside',
  /**
   * 外部
   */
  Outside = 'outside',
}

/**
 * 列表样式
 */
export interface ListStyle {
  /**
   * 列表类型
   */
  type: ListType;
  /**
   * 列表级别
   */
  level?: number;
  /**
   * 列表标记
   */
  marker?: string;
  /**
   * 标记位置
   */
  markerPosition?: MarkerPosition;
  /**
   * 起始数字（有序列表）
   */
  startNumber?: number;
  /**
   * 标记样式
   */
  markerStyle?: string;
}

/**
 * 分页设置
 */
export interface PageBreak {
  /**
   * 页前分页
   */
  before?: PageBreakType;
  /**
   * 页后分页
   */
  after?: PageBreakType;
  /**
   * 页内分页
   */
  inside?: PageBreakType;
  /**
   * 孤行控制
   */
  orphans?: number;
  /**
   * 寡行控制
   */
  widows?: number;
}

/**
 * 分页类型
 */
export enum PageBreakType {
  /**
   * 自动
   */
  Auto = 'auto',
  /**
   * 总是
   */
  Always = 'always',
  /**
   * 避免
   */
  Avoid = 'avoid',
  /**
   * 左页
   */
  Left = 'left',
  /**
   * 右页
   */
  Right = 'right',
}

/**
 * 制表符设置
 */
export interface TabStop {
  /**
   * 制表符位置
   */
  position: number;
  /**
   * 制表符类型
   */
  type: TabStopType;
  /**
   * 前导符
   */
  leader?: string;
}

/**
 * 制表符类型
 */
export enum TabStopType {
  /**
   * 左对齐
   */
  Left = 'left',
  /**
   * 右对齐
   */
  Right = 'right',
  /**
   * 居中
   */
  Center = 'center',
  /**
   * 小数点
   */
  Decimal = 'decimal',
}

// Re-export types from base for convenience
import type { TextAlign } from './base';
import type { VerticalAlign } from '../../core';
