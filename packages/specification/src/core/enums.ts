/**
 * Maxellabs 统一枚举定义
 * 所有模块共用的枚举类型
 */

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
export enum RenderMode {
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
