/**
 * Maxellabs 统一设计规范
 * 基于统一基础类型的设计系统定义
 */

import type { UsdPrim, UsdValue } from '../core/usd';
import type {
  BlendMode,
  Transform,
  Color,
  AnimationProperties,
  InteractionProperties,
  MaterialProperties,
  RenderingProperties,
  PerformanceConfig,
  CommonMetadata,
} from '../core/common';

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
   * 元数据
   */
  metadata?: CommonMetadata;
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
  Sprite = 'sprite',
  Icon = 'icon',
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
 * 填充类型
 */
export enum FillType {
  Solid = 'solid',
  Gradient = 'gradient',
  Image = 'image',
  Video = 'video',
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
 * 描边类型
 */
export enum StrokeType {
  Solid = 'solid',
  Gradient = 'gradient',
}

/**
 * 描边位置
 */
export enum StrokePosition {
  Inside = 'inside',
  Outside = 'outside',
  Center = 'center',
}

/**
 * 线帽类型
 */
export enum LineCap {
  Butt = 'butt',
  Round = 'round',
  Square = 'square',
}

/**
 * 线连接类型
 */
export enum LineJoin {
  Miter = 'miter',
  Round = 'round',
  Bevel = 'bevel',
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
  stops: DesignGradientStop[];
  /**
   * 变换矩阵
   */
  transform?: number[];
}

/**
 * 渐变类型
 */
export enum GradientType {
  Linear = 'linear',
  Radial = 'radial',
  Angular = 'angular',
  Diamond = 'diamond',
}

/**
 * 渐变停止点
 */
export interface DesignGradientStop {
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
  filters?: DesignImageFilter[];
}

/**
 * 图像缩放模式
 */
export enum ImageScaleMode {
  Fill = 'fill',
  Fit = 'fit',
  Crop = 'crop',
  Tile = 'tile',
}

/**
 * 图像滤镜
 */
export interface DesignImageFilter {
  /**
   * 滤镜类型
   */
  type: FilterType;
  /**
   * 滤镜值
   */
  value: number;
}

/**
 * 滤镜类型
 */
export enum FilterType {
  Exposure = 'exposure',
  Contrast = 'contrast',
  Saturation = 'saturation',
  Temperature = 'temperature',
  Tint = 'tint',
  Highlights = 'highlights',
  Shadows = 'shadows',
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
 * 阴影类型
 */
export enum ShadowType {
  Drop = 'drop',
  Inner = 'inner',
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
 * 模糊类型
 */
export enum BlurType {
  Layer = 'layer',
  Background = 'background',
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
 * 垂直对齐
 */
export enum VerticalAlign {
  Top = 'top',
  Center = 'center',
  Bottom = 'bottom',
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
 * Sprite 元素
 */
export interface SpriteElement extends DesignElement {
  type: DesignElementType.Sprite;
  /**
   * 纹理图集
   */
  atlas: SpriteAtlas;
  /**
   * 当前帧
   */
  currentFrame: number;
  /**
   * 动画配置
   */
  spriteAnimation?: SpriteAnimation;
}

/**
 * Sprite 图集
 */
export interface SpriteAtlas {
  /**
   * 图集纹理
   */
  texture: string;
  /**
   * 帧定义
   */
  frames: SpriteFrame[];
  /**
   * 图集元数据
   */
  metadata?: SpriteAtlasMetadata;
}

/**
 * Sprite 帧
 */
export interface SpriteFrame {
  /**
   * 帧名称
   */
  name: string;
  /**
   * 在图集中的位置
   */
  x: number;
  y: number;
  /**
   * 帧尺寸
   */
  width: number;
  height: number;
  /**
   * 是否旋转
   */
  rotated?: boolean;
  /**
   * 修剪信息
   */
  trimmed?: boolean;
  /**
   * 原始尺寸
   */
  sourceSize?: { w: number; h: number };
}

/**
 * Sprite 图集元数据
 */
export interface SpriteAtlasMetadata {
  /**
   * 应用程序
   */
  app: string;
  /**
   * 版本
   */
  version: string;
  /**
   * 图像格式
   */
  format: string;
  /**
   * 图集尺寸
   */
  size: { w: number; h: number };
  /**
   * 缩放
   */
  scale: number;
}

/**
 * Sprite 动画
 */
export interface SpriteAnimation {
  /**
   * 动画名称
   */
  name: string;
  /**
   * 帧序列
   */
  frames: number[];
  /**
   * 帧率
   */
  frameRate: number;
  /**
   * 是否循环
   */
  loop: boolean;
  /**
   * 动画属性（使用统一AnimationProperties）
   */
  properties?: AnimationProperties;
}

/**
 * 图标元素
 */
export interface IconElement extends DesignElement {
  type: DesignElementType.Icon;
  /**
   * 图标名称
   */
  iconName: string;
  /**
   * 图标库
   */
  iconLibrary?: string;
  /**
   * 图标样式
   */
  iconStyle?: IconStyle;
  /**
   * SVG 数据
   */
  svgData?: string;
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
  /**
   * 性能配置（使用统一PerformanceConfig）
   */
  performance?: PerformanceConfig;
  /**
   * 元数据（使用统一CommonMetadata）
   */
  metadata?: CommonMetadata;
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
 * 设计调色板
 */
export interface DesignColorPalette {
  /**
   * 调色板名称
   */
  name: string;
  /**
   * 颜色变体（使用统一Color）
   */
  variants: Record<string, Color>;
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
 * 设计字体比例
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
  /**
   * 元数据（使用统一CommonMetadata）
   */
  metadata?: CommonMetadata;
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
  /**
   * 动画属性（使用统一AnimationProperties）
   */
  animation?: AnimationProperties;
  /**
   * 交互属性（使用统一InteractionProperties）
   */
  interaction?: InteractionProperties;
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
  /**
   * 元数据（使用统一CommonMetadata）
   */
  metadata?: CommonMetadata;
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
  /**
   * 元数据（使用统一CommonMetadata）
   */
  metadata?: CommonMetadata;
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
  /**
   * 混合模式（使用统一BlendMode）
   */
  blendMode?: BlendMode;
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
