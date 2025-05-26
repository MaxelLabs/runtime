/**
 * Maxellabs 图层规范
 * 图层系统和合成相关类型定义
 */

import type { UsdPrim, UsdValue } from '../core/usd';

/**
 * 图层基础接口
 */
export interface LayerPrim extends UsdPrim {
  typeName: 'Layer';
}

/**
 * 图层
 */
export interface Layer extends LayerPrim {
  attributes: {
    /**
     * 图层名称
     */
    name: UsdValue; // string
    /**
     * 图层类型
     */
    type: UsdValue; // LayerType
    /**
     * 是否可见
     */
    visible: UsdValue; // bool
    /**
     * 是否锁定
     */
    locked: UsdValue; // bool
    /**
     * 透明度 (0-1)
     */
    opacity: UsdValue; // float
    /**
     * 混合模式
     */
    blendMode: UsdValue; // BlendMode
    /**
     * 图层顺序
     */
    zIndex: UsdValue; // int
  };
  /**
   * 图层变换
   */
  transform: LayerTransform;
  /**
   * 图层样式
   */
  style?: LayerStyle;
  /**
   * 图层蒙版
   */
  mask?: LayerMask;
  /**
   * 图层效果
   */
  effects?: LayerEffect[];
  /**
   * 子图层
   */
  children?: Layer[];
  /**
   * 图层内容
   */
  content?: LayerContent;
}

/**
 * 图层类型
 */
export enum LayerType {
  /**
   * 普通图层
   */
  Normal = 'normal',
  /**
   * 组图层
   */
  Group = 'group',
  /**
   * 文本图层
   */
  Text = 'text',
  /**
   * 形状图层
   */
  Shape = 'shape',
  /**
   * 图像图层
   */
  Image = 'image',
  /**
   * 调整图层
   */
  Adjustment = 'adjustment',
  /**
   * 填充图层
   */
  Fill = 'fill',
  /**
   * 智能对象
   */
  SmartObject = 'smart-object',
  /**
   * 视频图层
   */
  Video = 'video',
  /**
   * 3D图层
   */
  ThreeD = '3d',
}

/**
 * 混合模式
 */
export enum BlendMode {
  /**
   * 正常
   */
  Normal = 'normal',
  /**
   * 溶解
   */
  Dissolve = 'dissolve',
  /**
   * 变暗
   */
  Darken = 'darken',
  /**
   * 正片叠底
   */
  Multiply = 'multiply',
  /**
   * 颜色加深
   */
  ColorBurn = 'color-burn',
  /**
   * 线性加深
   */
  LinearBurn = 'linear-burn',
  /**
   * 深色
   */
  DarkerColor = 'darker-color',
  /**
   * 变亮
   */
  Lighten = 'lighten',
  /**
   * 滤色
   */
  Screen = 'screen',
  /**
   * 颜色减淡
   */
  ColorDodge = 'color-dodge',
  /**
   * 线性减淡
   */
  LinearDodge = 'linear-dodge',
  /**
   * 浅色
   */
  LighterColor = 'lighter-color',
  /**
   * 叠加
   */
  Overlay = 'overlay',
  /**
   * 柔光
   */
  SoftLight = 'soft-light',
  /**
   * 强光
   */
  HardLight = 'hard-light',
  /**
   * 亮光
   */
  VividLight = 'vivid-light',
  /**
   * 线性光
   */
  LinearLight = 'linear-light',
  /**
   * 点光
   */
  PinLight = 'pin-light',
  /**
   * 实色混合
   */
  HardMix = 'hard-mix',
  /**
   * 差值
   */
  Difference = 'difference',
  /**
   * 排除
   */
  Exclusion = 'exclusion',
  /**
   * 减去
   */
  Subtract = 'subtract',
  /**
   * 划分
   */
  Divide = 'divide',
  /**
   * 色相
   */
  Hue = 'hue',
  /**
   * 饱和度
   */
  Saturation = 'saturation',
  /**
   * 颜色
   */
  Color = 'color',
  /**
   * 明度
   */
  Luminosity = 'luminosity',
}

/**
 * 图层变换
 */
export interface LayerTransform {
  /**
   * 位置
   */
  position: {
    x: number;
    y: number;
    z?: number;
  };
  /**
   * 旋转
   */
  rotation: {
    x?: number;
    y?: number;
    z: number;
  };
  /**
   * 缩放
   */
  scale: {
    x: number;
    y: number;
    z?: number;
  };
  /**
   * 锚点
   */
  anchor: {
    x: number;
    y: number;
    z?: number;
  };
  /**
   * 倾斜
   */
  skew?: {
    x: number;
    y: number;
  };
  /**
   * 透视
   */
  perspective?: number;
}

/**
 * 图层样式
 */
export interface LayerStyle {
  /**
   * 投影
   */
  dropShadow?: DropShadowStyle;
  /**
   * 内阴影
   */
  innerShadow?: InnerShadowStyle;
  /**
   * 外发光
   */
  outerGlow?: OuterGlowStyle;
  /**
   * 内发光
   */
  innerGlow?: InnerGlowStyle;
  /**
   * 斜面和浮雕
   */
  bevelEmboss?: BevelEmbossStyle;
  /**
   * 光泽
   */
  satin?: SatinStyle;
  /**
   * 颜色叠加
   */
  colorOverlay?: ColorOverlayStyle;
  /**
   * 渐变叠加
   */
  gradientOverlay?: GradientOverlayStyle;
  /**
   * 图案叠加
   */
  patternOverlay?: PatternOverlayStyle;
  /**
   * 描边
   */
  stroke?: StrokeStyle;
}

/**
 * 投影样式
 */
export interface DropShadowStyle {
  /**
   * 启用
   */
  enabled: boolean;
  /**
   * 混合模式
   */
  blendMode: BlendMode;
  /**
   * 颜色
   */
  color: [number, number, number, number];
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 角度
   */
  angle: number;
  /**
   * 距离
   */
  distance: number;
  /**
   * 扩展
   */
  spread: number;
  /**
   * 大小
   */
  size: number;
  /**
   * 轮廓
   */
  contour?: ContourCurve;
  /**
   * 抗锯齿
   */
  antiAliased: boolean;
  /**
   * 噪点
   */
  noise: number;
  /**
   * 图层挖空投影
   */
  layerKnocksOutDropShadow: boolean;
}

/**
 * 内阴影样式
 */
export interface InnerShadowStyle {
  /**
   * 启用
   */
  enabled: boolean;
  /**
   * 混合模式
   */
  blendMode: BlendMode;
  /**
   * 颜色
   */
  color: [number, number, number, number];
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 角度
   */
  angle: number;
  /**
   * 距离
   */
  distance: number;
  /**
   * 阻塞
   */
  choke: number;
  /**
   * 大小
   */
  size: number;
  /**
   * 轮廓
   */
  contour?: ContourCurve;
  /**
   * 抗锯齿
   */
  antiAliased: boolean;
  /**
   * 噪点
   */
  noise: number;
}

/**
 * 外发光样式
 */
export interface OuterGlowStyle {
  /**
   * 启用
   */
  enabled: boolean;
  /**
   * 混合模式
   */
  blendMode: BlendMode;
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 噪点
   */
  noise: number;
  /**
   * 颜色类型
   */
  colorType: GlowColorType;
  /**
   * 颜色
   */
  color?: [number, number, number, number];
  /**
   * 渐变
   */
  gradient?: GradientDefinition;
  /**
   * 技术
   */
  technique: GlowTechnique;
  /**
   * 扩展
   */
  spread: number;
  /**
   * 大小
   */
  size: number;
  /**
   * 轮廓
   */
  contour?: ContourCurve;
  /**
   * 抗锯齿
   */
  antiAliased: boolean;
  /**
   * 范围
   */
  range: number;
  /**
   * 抖动
   */
  jitter: number;
}

/**
 * 内发光样式
 */
export interface InnerGlowStyle {
  /**
   * 启用
   */
  enabled: boolean;
  /**
   * 混合模式
   */
  blendMode: BlendMode;
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 噪点
   */
  noise: number;
  /**
   * 颜色类型
   */
  colorType: GlowColorType;
  /**
   * 颜色
   */
  color?: [number, number, number, number];
  /**
   * 渐变
   */
  gradient?: GradientDefinition;
  /**
   * 技术
   */
  technique: GlowTechnique;
  /**
   * 源
   */
  source: GlowSource;
  /**
   * 阻塞
   */
  choke: number;
  /**
   * 大小
   */
  size: number;
  /**
   * 轮廓
   */
  contour?: ContourCurve;
  /**
   * 抗锯齿
   */
  antiAliased: boolean;
  /**
   * 范围
   */
  range: number;
  /**
   * 抖动
   */
  jitter: number;
}

/**
 * 斜面和浮雕样式
 */
export interface BevelEmbossStyle {
  /**
   * 启用
   */
  enabled: boolean;
  /**
   * 样式
   */
  style: BevelStyle;
  /**
   * 技术
   */
  technique: BevelTechnique;
  /**
   * 深度
   */
  depth: number;
  /**
   * 方向
   */
  direction: BevelDirection;
  /**
   * 大小
   */
  size: number;
  /**
   * 软化
   */
  soften: number;
  /**
   * 角度
   */
  angle: number;
  /**
   * 高度
   */
  altitude: number;
  /**
   * 光泽轮廓
   */
  glossContour?: ContourCurve;
  /**
   * 高光模式
   */
  highlightMode: BlendMode;
  /**
   * 高光颜色
   */
  highlightColor: [number, number, number, number];
  /**
   * 高光透明度
   */
  highlightOpacity: number;
  /**
   * 阴影模式
   */
  shadowMode: BlendMode;
  /**
   * 阴影颜色
   */
  shadowColor: [number, number, number, number];
  /**
   * 阴影透明度
   */
  shadowOpacity: number;
}

/**
 * 光泽样式
 */
export interface SatinStyle {
  /**
   * 启用
   */
  enabled: boolean;
  /**
   * 混合模式
   */
  blendMode: BlendMode;
  /**
   * 颜色
   */
  color: [number, number, number, number];
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 角度
   */
  angle: number;
  /**
   * 距离
   */
  distance: number;
  /**
   * 大小
   */
  size: number;
  /**
   * 轮廓
   */
  contour?: ContourCurve;
  /**
   * 抗锯齿
   */
  antiAliased: boolean;
  /**
   * 反相
   */
  invert: boolean;
}

/**
 * 颜色叠加样式
 */
export interface ColorOverlayStyle {
  /**
   * 启用
   */
  enabled: boolean;
  /**
   * 混合模式
   */
  blendMode: BlendMode;
  /**
   * 颜色
   */
  color: [number, number, number, number];
  /**
   * 透明度
   */
  opacity: number;
}

/**
 * 渐变叠加样式
 */
export interface GradientOverlayStyle {
  /**
   * 启用
   */
  enabled: boolean;
  /**
   * 混合模式
   */
  blendMode: BlendMode;
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 渐变
   */
  gradient: GradientDefinition;
  /**
   * 反向
   */
  reverse: boolean;
  /**
   * 样式
   */
  style: GradientStyle;
  /**
   * 角度
   */
  angle: number;
  /**
   * 缩放
   */
  scale: number;
  /**
   * 与图层对齐
   */
  alignWithLayer: boolean;
}

/**
 * 图案叠加样式
 */
export interface PatternOverlayStyle {
  /**
   * 启用
   */
  enabled: boolean;
  /**
   * 混合模式
   */
  blendMode: BlendMode;
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 图案
   */
  pattern: string;
  /**
   * 缩放
   */
  scale: number;
  /**
   * 与图层链接
   */
  linkWithLayer: boolean;
}

/**
 * 描边样式
 */
export interface StrokeStyle {
  /**
   * 启用
   */
  enabled: boolean;
  /**
   * 大小
   */
  size: number;
  /**
   * 位置
   */
  position: StrokePosition;
  /**
   * 混合模式
   */
  blendMode: BlendMode;
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 覆盖
   */
  overprint: boolean;
  /**
   * 填充类型
   */
  fillType: StrokeFillType;
  /**
   * 颜色
   */
  color?: [number, number, number, number];
  /**
   * 渐变
   */
  gradient?: GradientDefinition;
  /**
   * 图案
   */
  pattern?: string;
}

/**
 * 发光颜色类型
 */
export enum GlowColorType {
  /**
   * 颜色
   */
  Color = 'color',
  /**
   * 渐变
   */
  Gradient = 'gradient',
}

/**
 * 发光技术
 */
export enum GlowTechnique {
  /**
   * 柔和
   */
  Softer = 'softer',
  /**
   * 精确
   */
  Precise = 'precise',
}

/**
 * 发光源
 */
export enum GlowSource {
  /**
   * 中心
   */
  Center = 'center',
  /**
   * 边缘
   */
  Edge = 'edge',
}

/**
 * 斜面样式
 */
export enum BevelStyle {
  /**
   * 外斜面
   */
  OuterBevel = 'outer-bevel',
  /**
   * 内斜面
   */
  InnerBevel = 'inner-bevel',
  /**
   * 浮雕
   */
  Emboss = 'emboss',
  /**
   * 枕状浮雕
   */
  PillowEmboss = 'pillow-emboss',
  /**
   * 描边浮雕
   */
  StrokeEmboss = 'stroke-emboss',
}

/**
 * 斜面技术
 */
export enum BevelTechnique {
  /**
   * 平滑
   */
  Smooth = 'smooth',
  /**
   * 雕刻清晰
   */
  ChiselHard = 'chisel-hard',
  /**
   * 雕刻柔和
   */
  ChiselSoft = 'chisel-soft',
}

/**
 * 斜面方向
 */
export enum BevelDirection {
  /**
   * 上
   */
  Up = 'up',
  /**
   * 下
   */
  Down = 'down',
}

/**
 * 描边位置
 */
export enum StrokePosition {
  /**
   * 内部
   */
  Inside = 'inside',
  /**
   * 中心
   */
  Center = 'center',
  /**
   * 外部
   */
  Outside = 'outside',
}

/**
 * 描边填充类型
 */
export enum StrokeFillType {
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
}

/**
 * 渐变样式
 */
export enum GradientStyle {
  /**
   * 线性
   */
  Linear = 'linear',
  /**
   * 径向
   */
  Radial = 'radial',
  /**
   * 角度
   */
  Angle = 'angle',
  /**
   * 反射
   */
  Reflected = 'reflected',
  /**
   * 菱形
   */
  Diamond = 'diamond',
}

/**
 * 轮廓曲线
 */
export interface ContourCurve {
  /**
   * 曲线点
   */
  points: ContourPoint[];
  /**
   * 抗锯齿
   */
  antiAliased: boolean;
}

/**
 * 轮廓点
 */
export interface ContourPoint {
  /**
   * 输入值 (0-1)
   */
  input: number;
  /**
   * 输出值 (0-1)
   */
  output: number;
  /**
   * 连续性
   */
  continuity: boolean;
}

/**
 * 渐变定义
 */
export interface GradientDefinition {
  /**
   * 渐变类型
   */
  type: GradientType;
  /**
   * 渐变停止点
   */
  stops: GradientStop[];
  /**
   * 平滑度
   */
  smoothness: number;
  /**
   * 噪点
   */
  noise: number;
  /**
   * 随机种子
   */
  randomSeed?: number;
}

/**
 * 渐变类型
 */
export enum GradientType {
  /**
   * 实色
   */
  Solid = 'solid',
  /**
   * 噪点
   */
  Noise = 'noise',
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
  /**
   * 中点
   */
  midpoint?: number;
}

/**
 * 图层蒙版
 */
export interface LayerMask {
  /**
   * 蒙版类型
   */
  type: MaskType;
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 是否反转
   */
  inverted: boolean;
  /**
   * 蒙版数据
   */
  data: MaskData;
  /**
   * 羽化
   */
  feather: number;
  /**
   * 密度
   */
  density: number;
}

/**
 * 蒙版类型
 */
export enum MaskType {
  /**
   * 像素蒙版
   */
  Pixel = 'pixel',
  /**
   * 矢量蒙版
   */
  Vector = 'vector',
  /**
   * 剪贴蒙版
   */
  Clipping = 'clipping',
}

/**
 * 蒙版数据
 */
export interface MaskData {
  /**
   * 蒙版路径（矢量蒙版）
   */
  path?: string;
  /**
   * 蒙版图像（像素蒙版）
   */
  image?: string;
  /**
   * 蒙版通道
   */
  channel?: string;
}

/**
 * 图层效果
 */
export interface LayerEffect {
  /**
   * 效果类型
   */
  type: EffectType;
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
 * 效果类型
 */
export enum EffectType {
  /**
   * 模糊
   */
  Blur = 'blur',
  /**
   * 锐化
   */
  Sharpen = 'sharpen',
  /**
   * 噪点
   */
  Noise = 'noise',
  /**
   * 扭曲
   */
  Distort = 'distort',
  /**
   * 像素化
   */
  Pixelate = 'pixelate',
  /**
   * 渲染
   */
  Render = 'render',
  /**
   * 艺术效果
   */
  Artistic = 'artistic',
  /**
   * 画笔描边
   */
  BrushStrokes = 'brush-strokes',
  /**
   * 素描
   */
  Sketch = 'sketch',
  /**
   * 纹理
   */
  Texture = 'texture',
  /**
   * 视频
   */
  Video = 'video',
}

/**
 * 图层内容
 */
export interface LayerContent {
  /**
   * 内容类型
   */
  type: ContentType;
  /**
   * 内容数据
   */
  data: any;
}

/**
 * 内容类型
 */
export enum ContentType {
  /**
   * 图像
   */
  Image = 'image',
  /**
   * 文本
   */
  Text = 'text',
  /**
   * 形状
   */
  Shape = 'shape',
  /**
   * 视频
   */
  Video = 'video',
  /**
   * 音频
   */
  Audio = 'audio',
  /**
   * 3D模型
   */
  Model3D = '3d-model',
}

/**
 * 图层组
 */
export interface LayerGroup extends Layer {
  /**
   * 组模式
   */
  groupMode: GroupMode;
  /**
   * 通过模式
   */
  passThrough: boolean;
  /**
   * 子图层
   */
  children: Layer[];
}

/**
 * 组模式
 */
export enum GroupMode {
  /**
   * 通过
   */
  PassThrough = 'pass-through',
  /**
   * 正常
   */
  Normal = 'normal',
}

/**
 * 智能对象
 */
export interface SmartObject extends Layer {
  /**
   * 源文件路径
   */
  sourcePath: string;
  /**
   * 源文件类型
   */
  sourceType: SmartObjectType;
  /**
   * 是否链接
   */
  linked: boolean;
  /**
   * 变换矩阵
   */
  transformMatrix: number[];
}

/**
 * 智能对象类型
 */
export enum SmartObjectType {
  /**
   * 嵌入
   */
  Embedded = 'embedded',
  /**
   * 链接
   */
  Linked = 'linked',
  /**
   * 云文档
   */
  CloudDocument = 'cloud-document',
}

/**
 * 图层合成
 */
export interface LayerComposition {
  /**
   * 合成名称
   */
  name: string;
  /**
   * 画布尺寸
   */
  canvasSize: {
    width: number;
    height: number;
  };
  /**
   * 背景色
   */
  backgroundColor: [number, number, number, number];
  /**
   * 图层列表
   */
  layers: Layer[];
  /**
   * 合成设置
   */
  settings: CompositionSettings;
}

/**
 * 合成设置
 */
export interface CompositionSettings {
  /**
   * 颜色模式
   */
  colorMode: ColorMode;
  /**
   * 位深度
   */
  bitDepth: BitDepth;
  /**
   * 颜色配置文件
   */
  colorProfile?: string;
  /**
   * 分辨率
   */
  resolution: number;
  /**
   * 单位
   */
  unit: ResolutionUnit;
}

/**
 * 颜色模式
 */
export enum ColorMode {
  /**
   * RGB
   */
  RGB = 'rgb',
  /**
   * CMYK
   */
  CMYK = 'cmyk',
  /**
   * 灰度
   */
  Grayscale = 'grayscale',
  /**
   * 位图
   */
  Bitmap = 'bitmap',
  /**
   * LAB
   */
  LAB = 'lab',
}

/**
 * 位深度
 */
export enum BitDepth {
  /**
   * 8位
   */
  Eight = 8,
  /**
   * 16位
   */
  Sixteen = 16,
  /**
   * 32位
   */
  ThirtyTwo = 32,
}

/**
 * 分辨率单位
 */
export enum ResolutionUnit {
  /**
   * 像素/英寸
   */
  PixelsPerInch = 'ppi',
  /**
   * 像素/厘米
   */
  PixelsPerCentimeter = 'ppcm',
}
