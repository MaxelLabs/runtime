/**
 * Maxellabs 文本效果规范
 * 文本效果和富文本相关类型定义
 */

import type { Color, AnimationProperties, InteractionProperties } from '../../core/interfaces';
import type { BlendMode } from '../../core/enums';

/**
 * 文本效果类型
 */
export enum TextEffectType {
  /**
   * 发光
   */
  Glow = 'glow',
  /**
   * 浮雕
   */
  Emboss = 'emboss',
  /**
   * 雕刻
   */
  Engrave = 'engrave',
  /**
   * 轮廓
   */
  Outline = 'outline',
  /**
   * 投影
   */
  DropShadow = 'drop-shadow',
  /**
   * 内阴影
   */
  InnerShadow = 'inner-shadow',
  /**
   * 扭曲
   */
  Warp = 'warp',
  /**
   * 路径文本
   */
  PathText = 'path-text',
  /**
   * 3D效果
   */
  ThreeD = '3d',
  /**
   * 反射
   */
  Reflection = 'reflection',
}

/**
 * 文本效果
 */
export interface TextEffect {
  /**
   * 效果类型
   */
  type: TextEffectType;
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 效果参数
   */
  parameters: Record<string, any>;
  /**
   * 混合模式（使用统一BlendMode）
   */
  blendMode?: BlendMode;
  /**
   * 动画属性（使用统一AnimationProperties）
   */
  animation?: AnimationProperties;
}

/**
 * 变换类型
 */
export enum EffectsTransformType {
  /**
   * 弧形
   */
  Arc = 'arc',
  /**
   * 波浪
   */
  Wave = 'wave',
  /**
   * 鱼眼
   */
  Fisheye = 'fisheye',
  /**
   * 膨胀
   */
  Bulge = 'bulge',
  /**
   * 旗帜
   */
  Flag = 'flag',
  /**
   * 扇形
   */
  Fan = 'fan',
  /**
   * 螺旋
   */
  Spiral = 'spiral',
  /**
   * 自定义路径
   */
  CustomPath = 'custom-path',
}

/**
 * 文本变换效果
 */
export interface TextTransformEffect {
  /**
   * 变换类型
   */
  type: EffectsTransformType;
  /**
   * 变换参数
   */
  parameters: Record<string, any>;
  /**
   * 动画属性（使用统一AnimationProperties）
   */
  animation?: AnimationProperties;
}

/**
 * 标记类型
 */
export enum MarkType {
  /**
   * 粗体
   */
  Bold = 'bold',
  /**
   * 斜体
   */
  Italic = 'italic',
  /**
   * 下划线
   */
  Underline = 'underline',
  /**
   * 删除线
   */
  Strikethrough = 'strikethrough',
  /**
   * 上标
   */
  Superscript = 'superscript',
  /**
   * 下标
   */
  Subscript = 'subscript',
  /**
   * 代码
   */
  Code = 'code',
  /**
   * 高亮
   */
  Highlight = 'highlight',
  /**
   * 键盘按键
   */
  Keyboard = 'keyboard',
  /**
   * 变量
   */
  Variable = 'variable',
}

/**
 * 文本标记
 */
export interface TextMark {
  /**
   * 标记类型
   */
  type: MarkType;
  /**
   * 标记属性
   */
  attributes?: Record<string, any>;
}

/**
 * 文本片段
 */
export interface TextSpan {
  /**
   * 文本内容
   */
  text: string;
  /**
   * 文本样式
   */
  style?: TextStyle;
  /**
   * 链接
   */
  link?: string;
  /**
   * 标记
   */
  marks?: TextMark[];
  /**
   * 交互属性（使用统一InteractionProperties）
   */
  interaction?: InteractionProperties;
}

/**
 * 段落样式
 */
export interface ParagraphStyle {
  /**
   * 段落对齐
   */
  alignment?: TextAlign;
  /**
   * 段落缩进
   */
  indent?: ParagraphIndent;
  /**
   * 段落间距
   */
  spacing?: ParagraphSpacing;
  /**
   * 列表样式
   */
  listStyle?: ListStyle;
  /**
   * 混合模式（使用统一BlendMode）
   */
  blendMode?: BlendMode;
}

/**
 * 文本段落
 */
export interface TextParagraph {
  /**
   * 段落内容
   */
  content: TextSpan[];
  /**
   * 段落样式
   */
  style?: ParagraphStyle;
}

/**
 * 富文本设置
 */
export interface RichTextSettings {
  /**
   * 默认字体
   */
  defaultFont?: string;
  /**
   * 默认大小
   */
  defaultSize?: number;
  /**
   * 默认颜色（使用统一Color）
   */
  defaultColor?: Color;
  /**
   * 链接样式
   */
  linkStyle?: TextStyle;
  /**
   * 选择样式
   */
  selectionStyle?: TextSelection;
  /**
   * 性能配置（使用统一PerformanceConfig）
   */
  performance?: PerformanceConfig;
}

/**
 * 富文本
 */
export interface RichText {
  /**
   * 文本段落
   */
  paragraphs: TextParagraph[];
  /**
   * 全局样式
   */
  globalStyle?: TextStyle;
  /**
   * 文档设置
   */
  settings?: RichTextSettings;
  /**
   * 元数据（使用统一CommonMetadata）
   */
  metadata?: CommonMetadata;
}

/**
 * 文本动画类型
 */
export enum TextAnimationType {
  /**
   * 打字机效果
   */
  Typewriter = 'typewriter',
  /**
   * 淡入
   */
  FadeIn = 'fade-in',
  /**
   * 滑入
   */
  SlideIn = 'slide-in',
  /**
   * 弹跳
   */
  Bounce = 'bounce',
  /**
   * 抖动
   */
  Shake = 'shake',
  /**
   * 旋转
   */
  Rotate = 'rotate',
  /**
   * 缩放
   */
  Scale = 'scale',
  /**
   * 彩虹效果
   */
  Rainbow = 'rainbow',
  /**
   * 闪烁
   */
  Blink = 'blink',
}

/**
 * 文本动画配置
 */
export interface TextAnimationConfig {
  /**
   * 动画类型
   */
  type: TextAnimationType;
  /**
   * 动画时长
   */
  duration: number;
  /**
   * 延迟时间
   */
  delay?: number;
  /**
   * 是否循环
   */
  loop?: boolean;
  /**
   * 缓动函数
   */
  easing?: string;
  /**
   * 动画参数
   */
  parameters?: Record<string, any>;
}

/**
 * 文本选择器
 */
export interface TextSelector {
  /**
   * 选择器类型
   */
  type: TextSelectorType;
  /**
   * 选择范围
   */
  range: TextRange;
  /**
   * 选择条件
   */
  conditions?: TextSelectorCondition[];
}

/**
 * 文本选择器类型
 */
export enum TextSelectorType {
  /**
   * 字符
   */
  Character = 'character',
  /**
   * 单词
   */
  Word = 'word',
  /**
   * 行
   */
  Line = 'line',
  /**
   * 段落
   */
  Paragraph = 'paragraph',
  /**
   * 句子
   */
  Sentence = 'sentence',
}

/**
 * 文本范围
 */
export interface TextRange {
  /**
   * 起始位置
   */
  start: number;
  /**
   * 结束位置
   */
  end: number;
}

/**
 * 文本选择器条件
 */
export interface TextSelectorCondition {
  /**
   * 属性名
   */
  property: string;
  /**
   * 操作符
   */
  operator: TextSelectorOperator;
  /**
   * 值
   */
  value: any;
}

/**
 * 文本选择器操作符
 */
export enum TextSelectorOperator {
  /**
   * 等于
   */
  Equals = 'equals',
  /**
   * 不等于
   */
  NotEquals = 'not-equals',
  /**
   * 包含
   */
  Contains = 'contains',
  /**
   * 不包含
   */
  NotContains = 'not-contains',
  /**
   * 开始于
   */
  StartsWith = 'starts-with',
  /**
   * 结束于
   */
  EndsWith = 'ends-with',
  /**
   * 匹配正则
   */
  Matches = 'matches',
}

// Re-export required types from other modules
import type { TextStyle, TextAlign } from './base';
import type { PerformanceConfig, CommonMetadata } from '../../core/interfaces';
import type { TextSelection } from './styles';
import type { ListStyle, ParagraphIndent, ParagraphSpacing } from './layout';
