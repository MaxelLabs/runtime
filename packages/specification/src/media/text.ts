/**
 * Maxellabs 文本规范
 * 文本处理和排版相关类型定义
 */

import type { UsdPrim, UsdValue } from '../core/usd';

/**
 * 文本基础接口
 */
export interface TextPrim extends UsdPrim {
  typeName: 'Text';
}

/**
 * 文本元素
 */
export interface TextElement extends TextPrim {
  attributes: {
    /**
     * 文本内容
     */
    content: UsdValue; // string
    /**
     * 字体族
     */
    fontFamily: UsdValue; // string
    /**
     * 字体大小
     */
    fontSize: UsdValue; // float
    /**
     * 字体粗细
     */
    fontWeight: UsdValue; // FontWeight
    /**
     * 字体样式
     */
    fontStyle: UsdValue; // FontStyle
    /**
     * 文本颜色
     */
    color: UsdValue; // Color4f
    /**
     * 文本对齐
     */
    textAlign: UsdValue; // TextAlign
    /**
     * 行高
     */
    lineHeight: UsdValue; // float
    /**
     * 字符间距
     */
    letterSpacing: UsdValue; // float
    /**
     * 单词间距
     */
    wordSpacing?: UsdValue; // float
    /**
     * 段落间距
     */
    paragraphSpacing?: UsdValue; // float
  };
  /**
   * 文本样式
   */
  style: TextStyle;
  /**
   * 文本布局
   */
  layout: TextLayout;
  /**
   * 文本效果
   */
  effects?: TextEffect[];
  /**
   * 文本变换
   */
  transform?: TextTransform;
}

/**
 * 字体粗细
 */
export enum FontWeight {
  Thin = 100,
  ExtraLight = 200,
  Light = 300,
  Normal = 400,
  Medium = 500,
  SemiBold = 600,
  Bold = 700,
  ExtraBold = 800,
  Black = 900,
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
 * 文本对齐
 */
export enum TextAlign {
  /**
   * 左对齐
   */
  Left = 'left',
  /**
   * 居中
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
   * 起始对齐
   */
  Start = 'start',
  /**
   * 结束对齐
   */
  End = 'end',
}

/**
 * 文本样式
 */
export interface TextStyle {
  /**
   * 文本装饰
   */
  textDecoration?: TextDecoration;
  /**
   * 文本变换
   */
  textTransform?: TextTransformType;
  /**
   * 垂直对齐
   */
  verticalAlign?: VerticalAlign;
  /**
   * 文本阴影
   */
  textShadow?: TextShadow[];
  /**
   * 文本描边
   */
  textStroke?: TextStroke;
  /**
   * 文本填充
   */
  textFill?: TextFill;
  /**
   * 文本背景
   */
  textBackground?: TextBackground;
  /**
   * 文本选择样式
   */
  selection?: TextSelection;
}

/**
 * 文本装饰
 */
export interface TextDecoration {
  /**
   * 装饰线类型
   */
  line: TextDecorationLine;
  /**
   * 装饰线样式
   */
  style?: TextDecorationStyle;
  /**
   * 装饰线颜色
   */
  color?: [number, number, number, number];
  /**
   * 装饰线厚度
   */
  thickness?: number;
}

/**
 * 文本装饰线类型
 */
export enum TextDecorationLine {
  /**
   * 无
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
 * 文本装饰线样式
 */
export enum TextDecorationStyle {
  /**
   * 实线
   */
  Solid = 'solid',
  /**
   * 双线
   */
  Double = 'double',
  /**
   * 点线
   */
  Dotted = 'dotted',
  /**
   * 虚线
   */
  Dashed = 'dashed',
  /**
   * 波浪线
   */
  Wavy = 'wavy',
}

/**
 * 文本变换类型
 */
export enum TextTransformType {
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
  /**
   * 全角
   */
  FullWidth = 'full-width',
  /**
   * 半角
   */
  FullSizeKana = 'full-size-kana',
}

/**
 * 垂直对齐
 */
export enum VerticalAlign {
  /**
   * 基线
   */
  Baseline = 'baseline',
  /**
   * 上标
   */
  Super = 'super',
  /**
   * 下标
   */
  Sub = 'sub',
  /**
   * 顶部
   */
  Top = 'top',
  /**
   * 文本顶部
   */
  TextTop = 'text-top',
  /**
   * 中间
   */
  Middle = 'middle',
  /**
   * 底部
   */
  Bottom = 'bottom',
  /**
   * 文本底部
   */
  TextBottom = 'text-bottom',
}

/**
 * 文本阴影
 */
export interface TextShadow {
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
  blurRadius: number;
  /**
   * 阴影颜色
   */
  color: [number, number, number, number];
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
  color: [number, number, number, number];
  /**
   * 描边样式
   */
  style?: StrokeStyle;
  /**
   * 描边位置
   */
  position?: StrokePosition;
}

/**
 * 描边样式
 */
export enum StrokeStyle {
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
 * 文本填充
 */
export interface TextFill {
  /**
   * 填充类型
   */
  type: TextFillType;
  /**
   * 颜色填充
   */
  color?: [number, number, number, number];
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
 * 渐变类型
 */
export enum GradientType {
  /**
   * 线性渐变
   */
  Linear = 'linear',
  /**
   * 径向渐变
   */
  Radial = 'radial',
  /**
   * 圆锥渐变
   */
  Conic = 'conic',
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
   * 颜色
   */
  color: [number, number, number, number];
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
 * 文本背景
 */
export interface TextBackground {
  /**
   * 背景颜色
   */
  color?: [number, number, number, number];
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
 * 文本选择样式
 */
export interface TextSelection {
  /**
   * 选择背景色
   */
  backgroundColor?: [number, number, number, number];
  /**
   * 选择文本色
   */
  color?: [number, number, number, number];
}

/**
 * 文本布局
 */
export interface TextLayout {
  /**
   * 文本框
   */
  textBox?: TextBox;
  /**
   * 文本流
   */
  textFlow?: TextFlow;
  /**
   * 文本换行
   */
  textWrap?: TextWrap;
  /**
   * 文本溢出
   */
  textOverflow?: TextOverflow;
  /**
   * 文本方向
   */
  direction?: TextDirection;
  /**
   * 书写模式
   */
  writingMode?: WritingMode;
  /**
   * 文本定向
   */
  textOrientation?: TextOrientation;
}

/**
 * 文本框
 */
export interface TextBox {
  /**
   * 宽度
   */
  width?: number;
  /**
   * 高度
   */
  height?: number;
  /**
   * 内边距
   */
  padding?: TextPadding;
  /**
   * 边框
   */
  border?: TextBorder;
  /**
   * 背景
   */
  background?: TextBackground;
}

/**
 * 文本内边距
 */
export interface TextPadding {
  /**
   * 上边距
   */
  top: number;
  /**
   * 右边距
   */
  right: number;
  /**
   * 下边距
   */
  bottom: number;
  /**
   * 左边距
   */
  left: number;
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
   * 边框颜色
   */
  color: [number, number, number, number];
  /**
   * 边框圆角
   */
  radius?: number;
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
   * 分隔线颜色
   */
  color: [number, number, number, number];
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
 * 文本溢出
 */
export interface TextOverflow {
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
}

/**
 * 书写模式
 */
export enum WritingMode {
  /**
   * 水平从上到下
   */
  HorizontalTopBottom = 'horizontal-tb',
  /**
   * 垂直从右到左
   */
  VerticalRightLeft = 'vertical-rl',
  /**
   * 垂直从左到右
   */
  VerticalLeftRight = 'vertical-lr',
}

/**
 * 文本定向
 */
export enum TextOrientation {
  /**
   * 混合
   */
  Mixed = 'mixed',
  /**
   * 直立
   */
  Upright = 'upright',
  /**
   * 侧向
   */
  Sideways = 'sideways',
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
}

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
}

/**
 * 文本变换
 */
export interface TextTransform {
  /**
   * 变换类型
   */
  type: TransformType;
  /**
   * 变换参数
   */
  parameters: Record<string, any>;
}

/**
 * 变换类型
 */
export enum TransformType {
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
   * 自定义路径
   */
  CustomPath = 'custom-path',
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
   * 默认颜色
   */
  defaultColor?: [number, number, number, number];
  /**
   * 链接样式
   */
  linkStyle?: TextStyle;
  /**
   * 选择样式
   */
  selectionStyle?: TextSelection;
}
