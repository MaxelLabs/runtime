/**
 * Maxellabs 缓动函数模块
 * 动效引擎的缓动函数定义
 */

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
 * 动画填充模式
 */
export enum AnimationFillMode {
  None = 'none',
  Forwards = 'forwards',
  Backwards = 'backwards',
  Both = 'both',
}

/**
 * 扩展的缓动函数类型（添加更多详细的缓动类型）
 */
export enum ExtendedEasingType {
  // 继承通用缓动类型
  Linear = 'linear',
  EaseIn = 'ease-in',
  EaseOut = 'ease-out',
  EaseInOut = 'ease-in-out',
  CubicBezier = 'cubic-bezier',
  Elastic = 'elastic',
  Bounce = 'bounce',
  Back = 'back',

  // 扩展的详细缓动类型
  // Quad 系列
  QuadIn = 'quad-in',
  QuadOut = 'quad-out',
  QuadInOut = 'quad-in-out',

  // Cubic 系列
  CubicIn = 'cubic-in',
  CubicOut = 'cubic-out',
  CubicInOut = 'cubic-in-out',

  // Quart 系列
  QuartIn = 'quart-in',
  QuartOut = 'quart-out',
  QuartInOut = 'quart-in-out',

  // Quint 系列
  QuintIn = 'quint-in',
  QuintOut = 'quint-out',
  QuintInOut = 'quint-in-out',

  // Sine 系列
  SineIn = 'sine-in',
  SineOut = 'sine-out',
  SineInOut = 'sine-in-out',

  // Expo 系列
  ExpoIn = 'expo-in',
  ExpoOut = 'expo-out',
  ExpoInOut = 'expo-in-out',

  // Circ 系列
  CircIn = 'circ-in',
  CircOut = 'circ-out',
  CircInOut = 'circ-in-out',

  // Back 系列
  BackIn = 'back-in',
  BackOut = 'back-out',
  BackInOut = 'back-in-out',

  // Elastic 系列
  ElasticIn = 'elastic-in',
  ElasticOut = 'elastic-out',
  ElasticInOut = 'elastic-in-out',

  // Bounce 系列
  BounceIn = 'bounce-in',
  BounceOut = 'bounce-out',
  BounceInOut = 'bounce-in-out',
}

/**
 * 变换函数类型
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
 * 变换函数
 */
export interface TransformFunction {
  /**
   * 函数类型
   */
  type: TransformType;
  /**
   * 参数
   */
  parameters: number[];
}
