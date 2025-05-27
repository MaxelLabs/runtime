/**
 * Maxellabs 设计文档规范
 * 设计工具的文档和页面管理
 */

import type { UsdPrim, UsdValue } from '../core/usd';
import type { BlendMode, Transform, InteractionProperties } from '../core/common';
import { Color, AnimationProperties } from '../core/common';

/**
 * 设计文档基础接口
 */
export interface DesignDocumentPrim extends UsdPrim {
  typeName: 'DesignDocument';
}

/**
 * 设计文档
 */
export interface DesignDocument extends DesignDocumentPrim {
  attributes: {
    /**
     * 文档名称
     */
    name: UsdValue; // string
    /**
     * 文档版本
     */
    version: UsdValue; // string
    /**
     * 创建时间
     */
    createdAt: UsdValue; // string (ISO 8601)
    /**
     * 修改时间
     */
    modifiedAt: UsdValue; // string (ISO 8601)
    /**
     * 作者
     */
    author: UsdValue; // string
    /**
     * 描述
     */
    description?: UsdValue; // string
    /**
     * 标签
     */
    tags?: UsdValue; // string[]
  };
  /**
   * 设计页面
   */
  pages: DesignPage[];
  /**
   * 设计系统
   */
  designSystem?: DesignSystem;
  /**
   * 资产库
   */
  assetLibrary?: DesignAssetLibrary;
}

/**
 * 设计页面
 */
export interface DesignPage {
  /**
   * 页面 ID
   */
  id: string;
  /**
   * 页面名称
   */
  name: string;
  /**
   * 页面类型
   */
  type: DesignPageType;
  /**
   * 画布尺寸
   */
  canvasSize: CanvasSize;
  /**
   * 背景色
   */
  backgroundColor?: string;
  /**
   * 设计元素
   */
  elements: DesignElement[];
  /**
   * 画板
   */
  artboards?: DesignArtboard[];
  /**
   * 网格系统
   */
  gridSystem?: DesignGrid;
  /**
   * 参考线
   */
  guides?: DesignGuide[];
}

/**
 * 设计页面类型
 */
export enum DesignPageType {
  /**
   * 普通页面
   */
  Page = 'page',
  /**
   * 组件页面
   */
  Component = 'component',
  /**
   * 模板页面
   */
  Template = 'template',
  /**
   * 原型页面
   */
  Prototype = 'prototype',
}

/**
 * 画布尺寸
 */
export interface CanvasSize {
  /**
   * 宽度
   */
  width: number;
  /**
   * 高度
   */
  height: number;
  /**
   * 单位
   */
  unit?: string;
}

/**
 * 设计元素基础接口
 */
export interface DesignElement {
  /**
   * 元素 ID
   */
  id: string;
  /**
   * 元素名称
   */
  name: string;
  /**
   * 元素类型
   */
  type: DesignElementType;
  /**
   * 位置和尺寸
   */
  bounds: DesignBounds;
  /**
   * 变换（使用统一Transform）
   */
  transform?: Transform;
  /**
   * 可见性
   */
  visible: boolean;
  /**
   * 锁定状态
   */
  locked: boolean;
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 混合模式（使用统一BlendMode）
   */
  blendMode?: BlendMode;
  /**
   * 样式
   */
  style?: DesignStyle;
  /**
   * 约束
   */
  constraints?: DesignConstraints;
  /**
   * 子元素
   */
  children?: DesignElement[];
  /**
   * 组件实例
   */
  componentInstance?: ComponentInstance;
  /**
   * 原型交互（使用统一InteractionProperties）
   */
  interactions?: InteractionProperties;
}

/**
 * 设计元素类型
 */
export enum DesignElementType {
  Frame = 'frame',
  Group = 'group',
  Rectangle = 'rectangle',
  Ellipse = 'ellipse',
  Polygon = 'polygon',
  Star = 'star',
  Vector = 'vector',
  Text = 'text',
  Image = 'image',
  Component = 'component',
  Instance = 'instance',
  Line = 'line',
  Arrow = 'arrow',
}

/**
 * 设计边界框
 */
export interface DesignBounds {
  /**
   * X 坐标
   */
  x: number;
  /**
   * Y 坐标
   */
  y: number;
  /**
   * 宽度
   */
  width: number;
  /**
   * 高度
   */
  height: number;
}

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
 * 设计约束
 */
export interface DesignConstraints {
  /**
   * 水平约束
   */
  horizontal: ConstraintType;
  /**
   * 垂直约束
   */
  vertical: ConstraintType;
}

/**
 * 约束类型
 */
export enum ConstraintType {
  Left = 'left',
  Right = 'right',
  Center = 'center',
  LeftRight = 'left-right',
  Scale = 'scale',
  Top = 'top',
  Bottom = 'bottom',
  TopBottom = 'top-bottom',
}

/**
 * 组件实例
 */
export interface ComponentInstance {
  /**
   * 组件 ID
   */
  componentId: string;
  /**
   * 实例 ID
   */
  instanceId: string;
  /**
   * 属性覆盖
   */
  overrides?: Record<string, any>;
  /**
   * 变体属性
   */
  variantProperties?: Record<string, string>;
}

/**
 * 设计系统
 */
export interface DesignSystem {
  /**
   * 系统名称
   */
  name: string;
  /**
   * 系统版本
   */
  version: string;
  /**
   * 颜色系统
   */
  colors: DesignColorSystem;
  /**
   * 字体系统
   */
  typography: DesignTypographySystem;
  /**
   * 间距系统
   */
  spacing: DesignSpacingSystem;
  /**
   * 组件库
   */
  components: DesignComponentLibrary;
  /**
   * 图标库
   */
  icons: DesignIconLibrary;
  /**
   * 样式库
   */
  styles: DesignStyleLibrary;
}

/**
 * 设计颜色系统
 */
export interface DesignColorSystem {
  /**
   * 主色调
   */
  primary: DesignColorPalette;
  /**
   * 次要色调
   */
  secondary?: DesignColorPalette;
  /**
   * 中性色
   */
  neutral: DesignColorPalette;
  /**
   * 语义色彩
   */
  semantic: {
    success: DesignColorPalette;
    warning: DesignColorPalette;
    error: DesignColorPalette;
    info: DesignColorPalette;
  };
  /**
   * 自定义色彩
   */
  custom?: Record<string, DesignColorPalette>;
}

/**
 * 设计色彩调色板
 */
export interface DesignColorPalette {
  /**
   * 调色板名称
   */
  name: string;
  /**
   * 颜色变体
   */
  variants: Record<string, DesignColor>;
}

/**
 * 设计字体系统
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
}

/**
 * 字体格式
 */
export enum FontFormat {
  WOFF = 'woff',
  WOFF2 = 'woff2',
  TTF = 'ttf',
  OTF = 'otf',
}

/**
 * 设计字体大小比例
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
}

/**
 * 设计间距系统
 */
export interface DesignSpacingSystem {
  /**
   * 基础单位
   */
  base: number;
  /**
   * 间距比例
   */
  scale: number[];
  /**
   * 命名间距
   */
  named: Record<string, number>;
}

/**
 * 设计组件库
 */
export interface DesignComponentLibrary {
  /**
   * 库名称
   */
  name: string;
  /**
   * 库版本
   */
  version: string;
  /**
   * 组件列表
   */
  components: Record<string, DesignComponent>;
}

/**
 * 设计组件
 */
export interface DesignComponent {
  /**
   * 组件 ID
   */
  id: string;
  /**
   * 组件名称
   */
  name: string;
  /**
   * 组件描述
   */
  description?: string;
  /**
   * 组件分类
   */
  category?: string;
  /**
   * 组件标签
   */
  tags?: string[];
  /**
   * 组件属性
   */
  properties: DesignComponentProperty[];
  /**
   * 组件变体
   */
  variants?: DesignComponentVariant[];
  /**
   * 组件实例
   */
  masterInstance: DesignElement;
}

/**
 * 设计组件属性
 */
export interface DesignComponentProperty {
  /**
   * 属性名称
   */
  name: string;
  /**
   * 属性类型
   */
  type: ComponentPropertyType;
  /**
   * 默认值
   */
  defaultValue?: any;
  /**
   * 可选值
   */
  options?: any[];
}

/**
 * 组件属性类型
 */
export enum ComponentPropertyType {
  Boolean = 'boolean',
  Text = 'text',
  InstanceSwap = 'instance-swap',
  Variant = 'variant',
}

/**
 * 设计组件变体
 */
export interface DesignComponentVariant {
  /**
   * 变体名称
   */
  name: string;
  /**
   * 变体属性
   */
  properties: Record<string, any>;
  /**
   * 变体实例
   */
  instance: DesignElement;
}

/**
 * 设计图标库
 */
export interface DesignIconLibrary {
  /**
   * 库名称
   */
  name: string;
  /**
   * 库版本
   */
  version: string;
  /**
   * 图标列表
   */
  icons: Record<string, DesignIcon>;
  /**
   * 图标分类
   */
  categories: DesignIconCategory[];
}

/**
 * 设计图标
 */
export interface DesignIcon {
  /**
   * 图标 ID
   */
  id: string;
  /**
   * 图标名称
   */
  name: string;
  /**
   * 图标分类
   */
  category?: string;
  /**
   * 图标标签
   */
  tags?: string[];
  /**
   * 图标尺寸
   */
  sizes: number[];
  /**
   * SVG 数据
   */
  svg: string;
  /**
   * 图标变体
   */
  variants?: DesignIconVariant[];
}

/**
 * 设计图标分类
 */
export interface DesignIconCategory {
  /**
   * 分类 ID
   */
  id: string;
  /**
   * 分类名称
   */
  name: string;
  /**
   * 分类描述
   */
  description?: string;
  /**
   * 父分类
   */
  parent?: string;
}

/**
 * 设计图标变体
 */
export interface DesignIconVariant {
  /**
   * 变体名称
   */
  name: string;
  /**
   * 变体样式
   */
  style: IconStyle;
  /**
   * SVG 数据
   */
  svg: string;
}

/**
 * 图标样式
 */
export enum IconStyle {
  Outline = 'outline',
  Filled = 'filled',
  Duotone = 'duotone',
  Light = 'light',
  Bold = 'bold',
}

/**
 * 设计样式库
 */
export interface DesignStyleLibrary {
  /**
   * 库名称
   */
  name: string;
  /**
   * 库版本
   */
  version: string;
  /**
   * 样式列表
   */
  styles: Record<string, DesignStyleDefinition>;
}

/**
 * 设计样式定义
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
}

/**
 * 样式类型
 */
export enum StyleType {
  Fill = 'fill',
  Stroke = 'stroke',
  Text = 'text',
  Shadow = 'shadow',
  Blur = 'blur',
}

/**
 * 设计资产库
 */
export interface DesignAssetLibrary {
  /**
   * 库名称
   */
  name: string;
  /**
   * 库版本
   */
  version: string;
  /**
   * 图像资产
   */
  images: Record<string, DesignImageAsset>;
  /**
   * 视频资产
   */
  videos: Record<string, DesignVideoAsset>;
  /**
   * 音频资产
   */
  audios: Record<string, DesignAudioAsset>;
  /**
   * 字体资产
   */
  fonts: Record<string, DesignFontAsset>;
}

/**
 * 设计图像资产
 */
export interface DesignImageAsset {
  /**
   * 资产 ID
   */
  id: string;
  /**
   * 资产名称
   */
  name: string;
  /**
   * 文件 URL
   */
  url: string;
  /**
   * 文件大小
   */
  size: number;
  /**
   * 图像尺寸
   */
  dimensions: {
    width: number;
    height: number;
  };
  /**
   * 文件格式
   */
  format: string;
  /**
   * 标签
   */
  tags?: string[];
}

/**
 * 设计视频资产
 */
export interface DesignVideoAsset {
  /**
   * 资产 ID
   */
  id: string;
  /**
   * 资产名称
   */
  name: string;
  /**
   * 文件 URL
   */
  url: string;
  /**
   * 文件大小
   */
  size: number;
  /**
   * 视频尺寸
   */
  dimensions: {
    width: number;
    height: number;
  };
  /**
   * 持续时间
   */
  duration: number;
  /**
   * 文件格式
   */
  format: string;
  /**
   * 标签
   */
  tags?: string[];
}

/**
 * 设计音频资产
 */
export interface DesignAudioAsset {
  /**
   * 资产 ID
   */
  id: string;
  /**
   * 资产名称
   */
  name: string;
  /**
   * 文件 URL
   */
  url: string;
  /**
   * 文件大小
   */
  size: number;
  /**
   * 持续时间
   */
  duration: number;
  /**
   * 文件格式
   */
  format: string;
  /**
   * 标签
   */
  tags?: string[];
}

/**
 * 设计字体资产
 */
export interface DesignFontAsset {
  /**
   * 资产 ID
   */
  id: string;
  /**
   * 字体名称
   */
  name: string;
  /**
   * 字体族
   */
  family: string;
  /**
   * 字体文件
   */
  files: DesignFontFile[];
  /**
   * 许可证
   */
  license?: string;
  /**
   * 标签
   */
  tags?: string[];
}
