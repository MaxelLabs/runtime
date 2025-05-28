/**
 * Maxellabs 字体排版定义
 * 包含字体系统、排版配置和文本处理
 */

import type { WritingMode } from '../core';
import type { CommonMetadata } from '../core/interfaces';
import type { DesignTextStyle, FontStyle } from './styles';

/**
 * 字体格式
 */
export enum FontFormat {
  WOFF = 'woff',
  WOFF2 = 'woff2',
  TTF = 'ttf',
  OTF = 'otf',
  EOT = 'eot',
  SVG = 'svg',
}

/**
 * 设计字体文件
 */
export interface DesignFontFile {
  /**
   * 字体粗细
   */
  weight: number;
  /**
   * 字体样式
   */
  style: FontStyle;
  /**
   * 文件 URL
   */
  url: string;
  /**
   * 文件格式
   */
  format: FontFormat;
  /**
   * 字体子集
   */
  subset?: string;
  /**
   * 字体显示
   */
  display?: FontDisplay;
}

/**
 * 字体显示模式
 */
export enum FontDisplay {
  Auto = 'auto',
  Block = 'block',
  Swap = 'swap',
  Fallback = 'fallback',
  Optional = 'optional',
}

/**
 * 设计字体族
 */
export interface DesignFontFamily {
  /**
   * 字体名称
   */
  name: string;
  /**
   * 字体文件
   */
  files: DesignFontFile[];
  /**
   * 回退字体
   */
  fallback?: string[];
  /**
   * 字体描述
   */
  description?: string;
  /**
   * 字体分类
   */
  category?: FontCategory;
  /**
   * 支持的语言
   */
  languages?: string[];
  /**
   * 字体许可
   */
  license?: FontLicense;
}

/**
 * 字体分类
 */
export enum FontCategory {
  Serif = 'serif',
  SansSerif = 'sans-serif',
  Monospace = 'monospace',
  Cursive = 'cursive',
  Fantasy = 'fantasy',
  Display = 'display',
  Handwriting = 'handwriting',
}

/**
 * 字体许可
 */
export interface FontLicense {
  /**
   * 许可类型
   */
  type: string;
  /**
   * 许可URL
   */
  url?: string;
  /**
   * 许可描述
   */
  description?: string;
}

/**
 * 设计排版比例
 */
export interface DesignTypographyScale {
  /**
   * 基础大小
   */
  base: number;
  /**
   * 比例因子
   */
  ratio: number;
  /**
   * 大小级别
   */
  sizes: Record<string, number>;
  /**
   * 行高级别
   */
  lineHeights?: Record<string, number>;
  /**
   * 字重级别
   */
  fontWeights?: Record<string, number>;
}

/**
 * 设计排版系统
 */
export interface DesignTypographySystem {
  /**
   * 字体族
   */
  fontFamilies: DesignFontFamily[];
  /**
   * 字体大小比例
   */
  scale: DesignTypographyScale;
  /**
   * 文本样式
   */
  textStyles: Record<string, DesignTextStyle>;
  /**
   * 基础配置
   */
  baseConfig?: TypographyBaseConfig;
  /**
   * 元数据
   */
  metadata?: CommonMetadata;
}

/**
 * 排版基础配置
 */
export interface TypographyBaseConfig {
  /**
   * 基础字体族
   */
  baseFontFamily: string;
  /**
   * 基础字体大小
   */
  baseFontSize: number;
  /**
   * 基础行高
   */
  baseLineHeight: number;
  /**
   * 基础字重
   */
  baseFontWeight: number;
  /**
   * 基础字符间距
   */
  baseLetterSpacing?: number;
  /**
   * 段落间距
   */
  paragraphSpacing?: number;
}

/**
 * 文本度量
 */
export interface TextMetrics {
  /**
   * 文本宽度
   */
  width: number;
  /**
   * 文本高度
   */
  height: number;
  /**
   * 基线到顶部
   */
  ascent: number;
  /**
   * 基线到底部
   */
  descent: number;
  /**
   * 行间距
   */
  leading: number;
  /**
   * 字符数量
   */
  characterCount: number;
  /**
   * 行数
   */
  lineCount: number;
}

/**
 * 文本溢出处理
 */
export enum TextOverflow {
  Clip = 'clip',
  Ellipsis = 'ellipsis',
  FadeOut = 'fade-out',
  Wrap = 'wrap',
}

/**
 * 文本对齐方式
 */
export enum TextJustification {
  None = 'none',
  InterWord = 'inter-word',
  InterCharacter = 'inter-character',
  Auto = 'auto',
}

/**
 * 文本方向
 */
export enum TextDirection {
  LeftToRight = 'ltr',
  RightToLeft = 'rtl',
  Auto = 'auto',
}

/**
 * 文本渲染配置
 */
export interface TextRenderConfig {
  /**
   * 文本方向
   */
  direction?: TextDirection;
  /**
   * 书写模式
   */
  writingMode?: WritingMode;
  /**
   * 文本对齐方式
   */
  textJustification?: TextJustification;
  /**
   * 溢出处理
   */
  overflow?: TextOverflow;
  /**
   * 最大行数
   */
  maxLines?: number;
  /**
   * 是否可选择
   */
  selectable?: boolean;
  /**
   * 是否可编辑
   */
  editable?: boolean;
}
