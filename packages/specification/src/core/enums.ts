/**
 * Maxellabs 核心枚举定义
 * 所有模块共用的核心枚举类型（非RHI相关）
 */

/**
 * 元素类型统一定义
 */
export enum ElementType {
  // 基础几何
  Rectangle = 'rectangle',
  Ellipse = 'ellipse',
  Circle = 'circle',
  Polygon = 'polygon',
  Star = 'star',
  Vector = 'vector',
  Line = 'line',
  Arrow = 'arrow',
  Path = 'path',

  // 容器
  Frame = 'frame',
  Group = 'group',
  Canvas = 'canvas',
  Layer = 'layer',
  Scene = 'scene',

  // 内容
  Text = 'text',
  Image = 'image',
  Sprite = 'sprite',
  Icon = 'icon',

  // 媒体元素
  Video = 'video',
  Audio = 'audio',

  // 3D元素
  Mesh = 'mesh',
  Model = 'model',

  // 特效元素
  Particle = 'particle',
  Trail = 'trail',

  // UI元素
  Button = 'button',
  Slider = 'slider',
  ProgressBar = 'progressBar',
  Input = 'input',

  // 组件
  Component = 'component',
  Instance = 'instance',
}

/**
 * 混合模式统一定义
 */
export enum BlendMode {
  // 基础混合模式
  Normal = 'normal',
  Add = 'add',
  Multiply = 'multiply',
  Screen = 'screen',
  Overlay = 'overlay',

  // 高级混合模式
  SoftLight = 'soft-light',
  HardLight = 'hard-light',
  ColorDodge = 'color-dodge',
  ColorBurn = 'color-burn',
  Darken = 'darken',
  Lighten = 'lighten',
  Difference = 'difference',
  Exclusion = 'exclusion',

  // 动画专用
  Additive = 'additive',
  Override = 'override',

  // 渲染专用
  Alpha = 'alpha',
  Premultiplied = 'premultiplied',
  Opaque = 'opaque',
  Transparent = 'transparent',

  // 设计专用
  Hue = 'hue',
  Saturation = 'saturation',
  Color = 'color',
  Luminosity = 'luminosity',
}

/**
 * 缓动函数统一定义
 */
export enum EasingFunction {
  // 基础缓动
  Linear = 'linear',
  EaseIn = 'ease-in',
  EaseOut = 'ease-out',
  EaseInOut = 'ease-in-out',

  // 回弹缓动
  EaseInBack = 'ease-in-back',
  EaseOutBack = 'ease-out-back',
  EaseInOutBack = 'ease-in-out-back',

  // 弹跳缓动
  EaseInBounce = 'ease-in-bounce',
  EaseOutBounce = 'ease-out-bounce',
  EaseInOutBounce = 'ease-in-out-bounce',

  // 弹性缓动
  EaseInElastic = 'ease-in-elastic',
  EaseOutElastic = 'ease-out-elastic',
  EaseInOutElastic = 'ease-in-out-elastic',

  // 二次缓动
  QuadIn = 'quad-in',
  QuadOut = 'quad-out',
  QuadInOut = 'quad-in-out',

  // 三次缓动
  CubicIn = 'cubic-in',
  CubicOut = 'cubic-out',
  CubicInOut = 'cubic-in-out',

  // 四次缓动
  QuartIn = 'quart-in',
  QuartOut = 'quart-out',
  QuartInOut = 'quart-in-out',

  // 五次缓动
  QuintIn = 'quint-in',
  QuintOut = 'quint-out',
  QuintInOut = 'quint-in-out',

  // 正弦缓动
  SineIn = 'sine-in',
  SineOut = 'sine-out',
  SineInOut = 'sine-in-out',

  // 指数缓动
  ExpoIn = 'expo-in',
  ExpoOut = 'expo-out',
  ExpoInOut = 'expo-in-out',

  // 圆形缓动
  CircIn = 'circ-in',
  CircOut = 'circ-out',
  CircInOut = 'circ-in-out',

  // 自定义贝塞尔
  CubicBezier = 'cubic-bezier',
}

/**
 * 欧拉角顺序
 */
export enum EulerOrder {
  XYZ = 'xyz',
  XZY = 'xzy',
  YXZ = 'yxz',
  YZX = 'yzx',
  ZXY = 'zxy',
  ZYX = 'zyx',
}

/**
 * 对齐类型统一定义
 */
export enum AlignmentType {
  // 水平对齐
  Left = 'left',
  Center = 'center',
  Right = 'right',
  Justify = 'justify',

  // 垂直对齐
  Top = 'top',
  Middle = 'middle',
  Bottom = 'bottom',

  // 基线对齐
  Baseline = 'baseline',

  // 拉伸
  Stretch = 'stretch',

  // 起始和结束（支持RTL）
  Start = 'start',
  End = 'end',
}

//---------------------------------------------------------------------------------------------------------------------
// 其他核心枚举定义
//---------------------------------------------------------------------------------------------------------------------

/**
 * 材质类型
 */
export enum MaterialType {
  Standard = 'standard',
  Unlit = 'unlit',
  Physical = 'physical',
  Toon = 'toon',
  Sprite = 'sprite',
  UI = 'ui',
  Particle = 'particle',
  Skybox = 'skybox',
  Custom = 'custom',
}

/**
 * 渐变类型
 */
export enum GradientType {
  Linear = 'linear',
  Radial = 'radial',
  Angular = 'angular',
  Diamond = 'diamond',
  Conic = 'conic',
  Solid = 'solid',
  Noise = 'noise',
}

/**
 * 垂直对齐
 */
export enum VerticalAlign {
  Baseline = 'baseline',
  Super = 'super',
  Sub = 'sub',
  Top = 'top',
  TextTop = 'text-top',
  Middle = 'middle',
  Bottom = 'bottom',
  TextBottom = 'text-bottom',
}

/**
 * 描边位置
 */
export enum StrokePosition {
  Inside = 'inside',
  Center = 'center',
  Outside = 'outside',
}

/**
 * 质量等级
 */
export enum QualityLevel {
  Low = 0,
  Medium = 1,
  High = 2,
  Ultra = 3,
}

/**
 * 许可证类型
 */
export enum LicenseType {
  MIT = 'MIT',
  Apache = 'Apache-2.0',
  GPL = 'GPL-3.0',
  BSD = 'BSD-3-Clause',
  CC0 = 'CC0-1.0',
  CCBY = 'CC-BY-4.0',
  Custom = 'Custom',
  Proprietary = 'Proprietary',
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
 * 色彩空间
 */
export enum ColorSpace {
  Linear = 'linear',
  sRGB = 'srgb',
  Rec2020 = 'rec2020',
  DisplayP3 = 'display-p3',
  ACES = 'aces',
}

/**
 * 循环模式
 */
export enum LoopMode {
  None = 'none',
  Loop = 'loop',
  PingPong = 'ping-pong',
  Clamp = 'clamp',
}

/**
 * 插值模式
 */
export enum InterpolationMode {
  Linear = 'linear',
  Step = 'step',
  Cubic = 'cubic',
  Bezier = 'bezier',
}

/**
 * 权限
 */
export enum Permission {
  Read = 'read',
  Write = 'write',
  Execute = 'execute',
  Delete = 'delete',
  Admin = 'admin',
}

/**
 * Alpha模式
 */
export enum AlphaMode {
  Opaque = 'opaque',
  Mask = 'mask',
  Blend = 'blend',
}

/**
 * 填充模式
 */
export enum FillMode {
  Solid = 'solid',
  Wireframe = 'wireframe',
  Point = 'point',
}

/**
 * 点击反馈类型
 */
export enum ClickFeedbackType {
  None = 'none',
  Scale = 'scale',
  Flash = 'flash',
  Ripple = 'ripple',
  Bounce = 'bounce',
  Rotate = 'rotate',
}

/**
 * 视觉效果类型
 */
export enum VisualEffectType {
  Particle = 'particle',
  Glow = 'glow',
  Flash = 'flash',
  Ripple = 'ripple',
  Explosion = 'explosion',
}

/**
 * 面模式
 */
export enum SideMode {
  Front = 'front',
  Back = 'back',
  Double = 'double',
}

/**
 * 渲染模式
 */
export enum RenderMode {
  Opaque = 'opaque',
  Transparent = 'transparent',
  Cutout = 'cutout',
  Additive = 'additive',
  Multiply = 'multiply',
}

/**
 * 边框样式
 */
export enum BorderStyle {
  None = 'none',
  Solid = 'solid',
  Dashed = 'dashed',
  Dotted = 'dotted',
  Double = 'double',
  Groove = 'groove',
  Ridge = 'ridge',
  Inset = 'inset',
  Outset = 'outset',
}

/**
 * 遮罩模式
 */
export enum MaskMode {
  None = 'none',
  Mask = 'mask',
  Obscured = 'obscured',
  ReverseObscured = 'reverse-obscured',
}

/**
 * 广告牌渲染模式
 */
export enum RenderBillboardMode {
  Billboard = 'billboard',
  HorizontalBillboard = 'horizontal-billboard',
  VerticalBillboard = 'vertical-billboard',
  Mesh = 'mesh',
}

/**
 * 排序模式
 */
export enum SortMode {
  None = 'none',
  OldestInFront = 'oldest-in-front',
  YoungestInFront = 'youngest-in-front',
  ByDistance = 'by-distance',
}

/**
 * 缩放模式
 */
export enum ScaleMode {
  Stretch = 'stretch',
  Crop = 'crop',
  Fit = 'fit',
  Fill = 'fill',
  None = 'none',
}

/**
 * 文本换行模式
 */
export enum TextWrapMode {
  None = 'none',
  Normal = 'normal',
  BreakWord = 'break-word',
  BreakAll = 'break-all',
}

/**
 * 书写模式
 */
export enum WritingMode {
  HorizontalTb = 'horizontal-tb',
  VerticalRl = 'vertical-rl',
  VerticalLr = 'vertical-lr',
}

/**
 * 反馈类型
 */
export enum FeedbackType {
  None = 'none',
  Ripple = 'ripple',
  Scale = 'scale',
  Glow = 'glow',
  Vibration = 'vibration',
}

/**
 * 形状类型
 */
export enum ShapeType {
  None = 'none',
  Sphere = 'sphere',
  Cone = 'cone',
  Hemisphere = 'hemisphere',
  Circle = 'circle',
  Donut = 'donut',
  Rectangle = 'rectangle',
  RectangleEdge = 'rectangle-edge',
  Edge = 'edge',
  Texture = 'texture',
}

/**
 * 播放状态
 */
export enum PlayState {
  Playing = 'playing',
  Paused = 'paused',
  Stopped = 'stopped',
  Finished = 'finished',
}

/**
 * 播放方向
 */
export enum PlaybackDirection {
  Normal = 'normal',
  Reverse = 'reverse',
  Alternate = 'alternate',
  AlternateReverse = 'alternate-reverse',
}

/**
 * 填充模式类型
 */
export enum FillModeType {
  None = 'none',
  Forwards = 'forwards',
  Backwards = 'backwards',
  Both = 'both',
}

/**
 * 变换类型
 */
export enum TransformType {
  // 平移
  Translate = 'translate',
  Translate3d = 'translate3d',
  TranslateX = 'translateX',
  TranslateY = 'translateY',
  TranslateZ = 'translateZ',

  // 缩放
  Scale = 'scale',
  Scale3d = 'scale3d',
  ScaleX = 'scaleX',
  ScaleY = 'scaleY',
  ScaleZ = 'scaleZ',

  // 旋转
  Rotate = 'rotate',
  Rotate3d = 'rotate3d',
  RotateX = 'rotateX',
  RotateY = 'rotateY',
  RotateZ = 'rotateZ',

  // 倾斜
  Skew = 'skew',
  SkewX = 'skewX',
  SkewY = 'skewY',

  // 其他
  Perspective = 'perspective',
  Matrix = 'matrix',
  Matrix3d = 'matrix3d',
}

/**
 * 约束类型
 */
export enum ConstraintType {
  // 水平约束
  Left = 'left',
  Right = 'right',
  Center = 'center',
  LeftRight = 'left-right',
  Scale = 'scale',

  // 垂直约束
  Top = 'top',
  Bottom = 'bottom',
  TopBottom = 'top-bottom',
}

/**
 * 资源加载状态枚举
 */
export enum ResourceLoadState {
  /** 未加载 */
  UNLOADED = 'unloaded',
  /** 加载中 */
  LOADING = 'loading',
  /** 已加载 */
  LOADED = 'loaded',
  /** 加载失败 */
  FAILED = 'failed',
  /** 已释放 */
  RELEASED = 'released',
}

/**
 * 数据类型
 */
export enum DataType {
  Boolean = 'boolean',
  Integer = 'integer',
  Float = 'float',
  String = 'string',
  Vector2 = 'vector2',
  Vector3 = 'vector3',
  Vector4 = 'vector4',
  Color = 'color',
  Texture = 'texture',
  Object = 'object',
  Array = 'array',
  Enum = 'enum',
}

/**
 * 事件类型
 */
export enum EventType {
  // 生命周期事件
  Start = 'start',
  Pause = 'pause',
  Resume = 'resume',
  Stop = 'stop',
  Complete = 'complete',
  Update = 'update',

  // 循环事件
  Loop = 'loop',

  // 交互事件
  Click = 'click',
  Hover = 'hover',
  Focus = 'focus',
  Blur = 'blur',

  // 系统事件
  Load = 'load',
  Error = 'error',

  // 自定义事件
  Custom = 'custom',
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
  Effect = 'effect',
}

/**
 * 线条端点样式
 */
export enum LineCap {
  Butt = 'butt',
  Round = 'round',
  Square = 'square',
}

/**
 * 线条连接样式
 */
export enum LineJoin {
  Miter = 'miter',
  Round = 'round',
  Bevel = 'bevel',
}

/**
 * 顶点属性
 */
export enum VertexAttribute {
  Position = 'POSITION',
  Normal = 'NORMAL',
  Tangent = 'TANGENT',
  Color = 'COLOR',
  TexCoord0 = 'TEXCOORD_0',
  TexCoord1 = 'TEXCOORD_1',
  BoneIndex = 'JOINTS_0',
  BoneWeight = 'WEIGHTS_0',
}

/**
 * 几何体优化配置
 */
export interface GeometryOptimization {
  mergeVertices?: boolean;
  optimizeIndices?: boolean;
  removeUnusedVertices?: boolean;
  compression?: boolean;
  compressionLevel?: number;
}
