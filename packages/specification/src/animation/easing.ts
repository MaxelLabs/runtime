/**
 * Maxellabs 动画缓动模块
 * 动画系统特有的扩展缓动函数定义
 */
/**
 * 扩展的缓动函数类型（动画特有的详细缓动类型）
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
 * 动画特有的变换函数（扩展核心变换函数）
 */
export interface AnimationTransformFunction {
  /**
   * 变换类型（使用核心TransformType）
   */
  type: string;
  /**
   * 函数参数
   */
  parameters: number[];
  /**
   * 动画特有的插值参数
   */
  interpolation?: ExtendedEasingType;
  /**
   * 关键帧时间点
   */
  keyframes?: number[];
}
