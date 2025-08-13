/**
 * Maxellabs 字体排版定义
 * 包含字体系统、排版配置和文本处理
 */

// 从 core 模块导入基础类型
import type { CommonMetadata, WritingMode } from '../core';

// 从 common 模块导入通用类型
import type { TextOverflow, TextDirection, FontStyle } from '../common/text';

// 从设计模块导入设计特定类型
import type { DesignTextStyle } from './styles';

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
 * 文本对齐方式
 */
export enum TextJustification {
  None = 'none',
  InterWord = 'inter-word',
  InterCharacter = 'inter-character',
  Auto = 'auto',
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
   * 字体样式（使用通用类型）
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
   * 默认字体设置
   */
  defaultFont: {
    /**
     * 默认字体族
     */
    family: string;
    /**
     * 默认字体大小
     */
    size: number;
    /**
     * 默认行高
     */
    lineHeight: number;
    /**
     * 默认字重
     */
    weight: number;
    /**
     * 默认字体样式
     */
    style: FontStyle;
  };
  /**
   * 字体加载配置
   */
  fontLoading: {
    /**
     * 字体显示策略
     */
    display: FontDisplay;
    /**
     * 预加载关键字体
     */
    preload: string[];
    /**
     * 字体加载超时（毫秒）
     */
    timeout: number;
    /**
     * 回退字体延迟（毫秒）
     */
    fallbackDelay: number;
  };
  /**
   * 文本渲染配置
   */
  rendering: {
    /**
     * 文本抗锯齿
     */
    antialiasing: 'auto' | 'none' | 'grayscale' | 'subpixel';
    /**
     * 字体平滑
     */
    fontSmoothing: 'auto' | 'never' | 'always';
    /**
     * 文本优化
     */
    textOptimization: 'speed' | 'legibility' | 'geometricPrecision';
  };
  /**
   * 响应式设置
   */
  responsive: {
    /**
     * 基础视口宽度
     */
    baseViewport: number;
    /**
     * 字体缩放因子
     */
    scaleFactor: number;
    /**
     * 最小字体大小
     */
    minFontSize: number;
    /**
     * 最大字体大小
     */
    maxFontSize: number;
  };
  /**
   * 国际化设置
   */
  i18n: {
    /**
     * 默认语言
     */
    defaultLanguage: string;
    /**
     * 支持的语言列表
     */
    supportedLanguages: string[];
    /**
     * 语言特定字体映射
     */
    languageFontMap?: Record<string, string>;
  };
  /**
   * 可访问性设置
   */
  accessibility: {
    /**
     * 高对比度支持
     */
    highContrast: boolean;
    /**
     * 大字体支持
     */
    largeFontSupport: boolean;
    /**
     * 屏幕阅读器优化
     */
    screenReaderOptimized: boolean;
  };
  /**
   * 性能优化
   */
  performance: {
    /**
     * 字体子集化
     */
    fontSubsetting: boolean;
    /**
     * 字体压缩
     */
    fontCompression: boolean;
    /**
     * 缓存策略
     */
    cacheStrategy: 'none' | 'memory' | 'disk' | 'hybrid';
    /**
     * 懒加载字体
     */
    lazyLoadFonts: boolean;
  };
  /**
   * 调试设置
   */
  debug: {
    /**
     * 显示字体加载状态
     */
    showFontLoadingStatus: boolean;
    /**
     * 显示文本边界
     */
    showTextBounds: boolean;
    /**
     * 字体替换警告
     */
    fontFallbackWarnings: boolean;
  };
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
 * 文本渲染配置
 */
export interface TextRenderConfig {
  /**
   * 文本方向（使用通用类型）
   */
  direction?: TextDirection;
  /**
   * 书写模式（使用通用类型）
   */
  writingMode?: WritingMode;
  /**
   * 文本对齐方式
   */
  textJustification?: TextJustification;
  /**
   * 溢出处理（使用通用类型）
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
