/**
 * Maxellabs 统一枚举定义
 * 所有模块共用的枚举类型
 */

/**
 * 混合操作
 */
export enum RHIBlendOperation {
  /** 加法 */
  ADD = 0,
  /** 减法(源-目标) */
  SUBTRACT = 1,
  /** 反向减法(目标-源) */
  REVERSE_SUBTRACT = 2,
  /** 最小值 */
  MIN = 3,
  /** 最大值 */
  MAX = 4,
}
/**
 * 正面方向
 */
export enum RHIFrontFace {
  /** 顺时针 */
  CW = 0,
  /** 逆时针 */
  CCW = 1,
}
/**
 * 比较函数
 */
export enum RHICompareFunction {
  /** 永不通过 */
  NEVER = 0,
  /** 通过当值小于参考值 */
  LESS = 1,
  /** 通过当值等于参考值 */
  EQUAL = 2,
  /** 通过当值小于等于参考值 */
  LESS_EQUAL = 3,
  /** 通过当值大于参考值 */
  GREATER = 4,
  /** 通过当值不等于参考值 */
  NOT_EQUAL = 5,
  /** 通过当值大于等于参考值 */
  GREATER_EQUAL = 6,
  /** 总是通过 */
  ALWAYS = 7,
}

/**
 * 图元拓扑
 */
export enum RHIPrimitiveTopology {
  /** 点列表 */
  POINT_LIST = 0,
  /** 线列表 */
  LINE_LIST = 1,
  /** 线条带 */
  LINE_STRIP = 2,
  /** 三角形列表 */
  TRIANGLE_LIST = 3,
  /** 三角形条带 */
  TRIANGLE_STRIP = 4,
}

/**
 * 剔除模式
 */
export enum RHICullMode {
  /** 不剔除 */
  NONE = 0,
  /** 剔除正面 */
  FRONT = 1,
  /** 剔除背面 */
  BACK = 2,
}

/**
 * 混合因子
 */
export enum RHIBlendFactor {
  /** 零 */
  ZERO = 0,
  /** 一 */
  ONE = 1,
  /** 源颜色 */
  SRC_COLOR = 2,
  /** 一减源颜色 */
  ONE_MINUS_SRC_COLOR = 3,
  /** 目标颜色 */
  DST_COLOR = 4,
  /** 一减目标颜色 */
  ONE_MINUS_DST_COLOR = 5,
  /** 源Alpha */
  SRC_ALPHA = 6,
  /** 一减源Alpha */
  ONE_MINUS_SRC_ALPHA = 7,
  /** 目标Alpha */
  DST_ALPHA = 8,
  /** 一减目标Alpha */
  ONE_MINUS_DST_ALPHA = 9,
  /** 常量颜色 */
  CONSTANT_COLOR = 10,
  /** 一减常量颜色 */
  ONE_MINUS_CONSTANT_COLOR = 11,
  /** 常量Alpha */
  CONSTANT_ALPHA = 12,
  /** 一减常量Alpha */
  ONE_MINUS_CONSTANT_ALPHA = 13,
  /** 源Alpha饱和 */
  SRC_ALPHA_SATURATE = 14,
}

/**
 * 几何体优化配置
 */
export interface GeometryOptimization {
  /**
   * 是否启用顶点合并
   */
  mergeVertices?: boolean;
  /**
   * 是否启用索引优化
   */
  optimizeIndices?: boolean;
  /**
   * 是否移除未使用的顶点
   */
  removeUnusedVertices?: boolean;
  /**
   * 是否启用几何体压缩
   */
  compression?: boolean;
  /**
   * 压缩级别 (0-9)
   */
  compressionLevel?: number;
}

/**
 * 顶点属性枚举
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
 * 材质类型
 */
export enum MaterialType {
  /**
   * 标准材质
   */
  Standard = 'standard',
  /**
   * 无光照材质
   */
  Unlit = 'unlit',
  /**
   * 物理材质
   */
  Physical = 'physical',
  /**
   * 卡通材质
   */
  Toon = 'toon',
  /**
   * 精灵材质
   */
  Sprite = 'sprite',
  /**
   * UI材质
   */
  UI = 'ui',
  /**
   * 粒子材质
   */
  Particle = 'particle',
  /**
   * 天空盒材质
   */
  Skybox = 'skybox',
  /**
   * 自定义材质
   */
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
  /**
   * 圆锥渐变
   */
  Conic = 'conic',
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
 * 质量级别
 */
export enum QualityLevel {
  Low = 0,
  Medium = 1,
  High = 2,
  Ultra = 3,
}

/**
 * 许可类型
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
 * 颜色空间
 */
export enum ColorSpace {
  Linear = 'linear',
  sRGB = 'srgb',
  Rec2020 = 'rec2020',
  DisplayP3 = 'display-p3',
  ACES = 'aces',
}

/**
 * 统一混合模式枚举
 * 适用于动画、渲染、设计、图表等所有模块
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
 * 缓动函数枚举
 */
export enum EasingFunction {
  Linear = 'linear',
  EaseIn = 'ease-in',
  EaseOut = 'ease-out',
  EaseInOut = 'ease-in-out',
  EaseInBack = 'ease-in-back',
  EaseOutBack = 'ease-out-back',
  EaseInOutBack = 'ease-in-out-back',
  EaseInBounce = 'ease-in-bounce',
  EaseOutBounce = 'ease-out-bounce',
  EaseInOutBounce = 'ease-in-out-bounce',
  EaseInElastic = 'ease-in-elastic',
  EaseOutElastic = 'ease-out-elastic',
  EaseInOutElastic = 'ease-in-out-elastic',
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
 * 纹理包装模式
 */
export enum WrapMode {
  Repeat = 'repeat',
  ClampToEdge = 'clamp-to-edge',
  MirroredRepeat = 'mirrored-repeat',
}

/**
 * 纹理过滤模式
 */
export enum FilterMode {
  Nearest = 'nearest',
  Linear = 'linear',
  NearestMipmapNearest = 'nearest-mipmap-nearest',
  LinearMipmapNearest = 'linear-mipmap-nearest',
  NearestMipmapLinear = 'nearest-mipmap-linear',
  LinearMipmapLinear = 'linear-mipmap-linear',
}

/**
 * 透明度模式
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
  /**
   * 无反馈
   */
  None = 'none',
  /**
   * 缩放
   */
  Scale = 'scale',
  /**
   * 闪烁
   */
  Flash = 'flash',
  /**
   * 波纹
   */
  Ripple = 'ripple',
  /**
   * 弹跳
   */
  Bounce = 'bounce',
  /**
   * 旋转
   */
  Rotate = 'rotate',
}

/**
 * 视觉效果类型
 */
export enum VisualEffectType {
  /**
   * 粒子效果
   */
  Particle = 'particle',
  /**
   * 光晕效果
   */
  Glow = 'glow',
  /**
   * 闪光效果
   */
  Flash = 'flash',
  /**
   * 波纹效果
   */
  Ripple = 'ripple',
  /**
   * 爆炸效果
   */
  Explosion = 'explosion',
}

/**
 * 剔除模式
 */
export enum CullMode {
  None = 'none',
  Front = 'front',
  Back = 'back',
}

/**
 * 面向模式
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
  /**
   * 不透明
   */
  Opaque = 'opaque',
  /**
   * 透明
   */
  Transparent = 'transparent',
  /**
   * 遮罩
   */
  Cutout = 'cutout',
  /**
   * 叠加
   */
  Additive = 'additive',
  /**
   * 相乘
   */
  Multiply = 'multiply',
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
 * 蒙版模式
 */
export enum MaskMode {
  None = 'none',
  Mask = 'mask',
  Obscured = 'obscured',
  ReverseObscured = 'reverse-obscured',
}

/**
 * 渲染模式
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
 * 文字换行模式
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
 * 发射器形状
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
 * 统一动画播放状态
 * 适用于所有动画系统
 */
export enum PlayState {
  /**
   * 播放中
   */
  Playing = 'playing',
  /**
   * 暂停
   */
  Paused = 'paused',
  /**
   * 停止
   */
  Stopped = 'stopped',
  /**
   * 完成
   */
  Finished = 'finished',
}

/**
 * 统一播放方向
 * 适用于所有动画和媒体播放
 */
export enum PlaybackDirection {
  Normal = 'normal',
  Reverse = 'reverse',
  Alternate = 'alternate',
  AlternateReverse = 'alternate-reverse',
}

/**
 * 统一填充模式
 * 适用于动画、渲染等
 */
export enum FillModeType {
  None = 'none',
  Forwards = 'forwards',
  Backwards = 'backwards',
  Both = 'both',
}

/**
 * 统一变换类型
 * 适用于动画、设计、渲染等所有需要变换的模块
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
 * 统一对齐方式
 * 适用于UI、设计、布局等
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
}

/**
 * 统一约束类型
 * 适用于布局、设计系统等
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
 * 统一元素类型
 * 适用于设计、渲染、UI等所有需要描述元素的模块
 */
export enum ElementType {
  // 基础几何
  Rectangle = 'rectangle',
  Ellipse = 'ellipse',
  Polygon = 'polygon',
  Star = 'star',
  Vector = 'vector',
  Line = 'line',
  Arrow = 'arrow',

  // 容器
  Frame = 'frame',
  Group = 'group',

  // 内容
  Text = 'text',
  Image = 'image',
  Sprite = 'sprite',
  Icon = 'icon',

  // 组件
  Component = 'component',
  Instance = 'instance',
}

/**
 * 统一数据类型
 * 适用于动画、参数、属性等
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
 * 统一事件类型
 * 适用于动画、交互、系统事件等
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
 * 统一样式类型
 * 适用于设计、UI、渲染等
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
 * 统一线帽样式
 */
export enum LineCap {
  Butt = 'butt',
  Round = 'round',
  Square = 'square',
}

/**
 * 统一线连接样式
 */
export enum LineJoin {
  Miter = 'miter',
  Round = 'round',
  Bevel = 'bevel',
}
