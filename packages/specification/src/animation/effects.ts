/**
 * Maxellabs 动效特效规范
 * 动效引擎的特效和缓动函数定义
 */

/**
 * 缓动函数类型
 */
export enum EasingType {
  // 线性
  Linear = 'linear',

  // Ease 系列
  EaseIn = 'ease-in',
  EaseOut = 'ease-out',
  EaseInOut = 'ease-in-out',

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

  // 自定义贝塞尔
  CubicBezier = 'cubic-bezier',
}

/**
 * 缓动函数定义
 */
export interface EasingFunction {
  /**
   * 缓动类型
   */
  type: EasingType;
  /**
   * 贝塞尔控制点（仅用于 CubicBezier）
   */
  controlPoints?: [number, number, number, number];
  /**
   * 自定义参数
   */
  parameters?: Record<string, number>;
}

/**
 * 时间轴
 */
export interface Timeline {
  /**
   * 时间轴名称
   */
  name: string;
  /**
   * 持续时间（毫秒）
   */
  duration: number;
  /**
   * 播放速度
   */
  playbackRate: number;
  /**
   * 循环次数（-1 为无限循环）
   */
  iterations: number;
  /**
   * 播放方向
   */
  direction: PlaybackDirection;
  /**
   * 填充模式
   */
  fillMode: FillMode;
  /**
   * 延迟时间
   */
  delay: number;
  /**
   * 结束延迟
   */
  endDelay: number;
  /**
   * 动画序列
   */
  animations: TimelineAnimation[];
}

/**
 * 播放方向
 */
export enum PlaybackDirection {
  /**
   * 正向
   */
  Normal = 'normal',
  /**
   * 反向
   */
  Reverse = 'reverse',
  /**
   * 交替
   */
  Alternate = 'alternate',
  /**
   * 反向交替
   */
  AlternateReverse = 'alternate-reverse',
}

/**
 * 填充模式
 */
export enum FillMode {
  /**
   * 无
   */
  None = 'none',
  /**
   * 向前填充
   */
  Forwards = 'forwards',
  /**
   * 向后填充
   */
  Backwards = 'backwards',
  /**
   * 双向填充
   */
  Both = 'both',
}

/**
 * 时间轴动画
 */
export interface TimelineAnimation {
  /**
   * 动画名称
   */
  name: string;
  /**
   * 目标选择器
   */
  target: string;
  /**
   * 开始时间（毫秒）
   */
  startTime: number;
  /**
   * 持续时间（毫秒）
   */
  duration: number;
  /**
   * 缓动函数
   */
  easing: EasingFunction;
  /**
   * 属性动画
   */
  properties: PropertyAnimation[];
  /**
   * 延迟
   */
  delay?: number;
}

/**
 * 属性动画
 */
export interface PropertyAnimation {
  /**
   * 属性名称
   */
  property: string;
  /**
   * 起始值
   */
  from: any;
  /**
   * 结束值
   */
  to: any;
  /**
   * 单位
   */
  unit?: string;
  /**
   * 变换函数
   */
  transform?: TransformFunction;
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

/**
 * 变换类型
 */
export enum TransformType {
  /**
   * 平移
   */
  Translate = 'translate',
  /**
   * 3D平移
   */
  Translate3d = 'translate3d',
  /**
   * X轴平移
   */
  TranslateX = 'translateX',
  /**
   * Y轴平移
   */
  TranslateY = 'translateY',
  /**
   * Z轴平移
   */
  TranslateZ = 'translateZ',
  /**
   * 缩放
   */
  Scale = 'scale',
  /**
   * 3D缩放
   */
  Scale3d = 'scale3d',
  /**
   * X轴缩放
   */
  ScaleX = 'scaleX',
  /**
   * Y轴缩放
   */
  ScaleY = 'scaleY',
  /**
   * Z轴缩放
   */
  ScaleZ = 'scaleZ',
  /**
   * 旋转
   */
  Rotate = 'rotate',
  /**
   * 3D旋转
   */
  Rotate3d = 'rotate3d',
  /**
   * X轴旋转
   */
  RotateX = 'rotateX',
  /**
   * Y轴旋转
   */
  RotateY = 'rotateY',
  /**
   * Z轴旋转
   */
  RotateZ = 'rotateZ',
  /**
   * 倾斜
   */
  Skew = 'skew',
  /**
   * X轴倾斜
   */
  SkewX = 'skewX',
  /**
   * Y轴倾斜
   */
  SkewY = 'skewY',
  /**
   * 透视
   */
  Perspective = 'perspective',
  /**
   * 矩阵
   */
  Matrix = 'matrix',
  /**
   * 3D矩阵
   */
  Matrix3d = 'matrix3d',
}

/**
 * 粒子系统
 */
export interface ParticleSystem {
  /**
   * 系统名称
   */
  name: string;
  /**
   * 发射器
   */
  emitter: ParticleEmitter;
  /**
   * 粒子配置
   */
  particle: ParticleConfig;
  /**
   * 渲染配置
   */
  renderer: ParticleRenderer;
  /**
   * 物理配置
   */
  physics?: ParticlePhysics;
}

/**
 * 粒子发射器
 */
export interface ParticleEmitter {
  /**
   * 发射形状
   */
  shape: EmitterShape;
  /**
   * 发射速率
   */
  rate: number;
  /**
   * 爆发发射
   */
  bursts?: ParticleBurst[];
  /**
   * 生命周期
   */
  lifetime: number;
  /**
   * 循环
   */
  loop: boolean;
}

/**
 * 发射器形状
 */
export enum EmitterShape {
  /**
   * 点
   */
  Point = 'point',
  /**
   * 线
   */
  Line = 'line',
  /**
   * 矩形
   */
  Rectangle = 'rectangle',
  /**
   * 圆形
   */
  Circle = 'circle',
  /**
   * 球体
   */
  Sphere = 'sphere',
  /**
   * 立方体
   */
  Box = 'box',
  /**
   * 圆锥
   */
  Cone = 'cone',
}

/**
 * 粒子爆发
 */
export interface ParticleBurst {
  /**
   * 触发时间
   */
  time: number;
  /**
   * 粒子数量
   */
  count: number;
  /**
   * 重复次数
   */
  cycles: number;
  /**
   * 重复间隔
   */
  interval: number;
}

/**
 * 粒子配置
 */
export interface ParticleConfig {
  /**
   * 生命周期
   */
  lifetime: ValueRange;
  /**
   * 初始速度
   */
  startVelocity: ValueRange;
  /**
   * 初始大小
   */
  startSize: ValueRange;
  /**
   * 初始颜色
   */
  startColor: ColorRange;
  /**
   * 初始旋转
   */
  startRotation: ValueRange;
  /**
   * 大小变化
   */
  sizeOverLifetime?: AnimationCurve;
  /**
   * 颜色变化
   */
  colorOverLifetime?: ColorCurve;
  /**
   * 速度变化
   */
  velocityOverLifetime?: VelocityCurve;
  /**
   * 旋转变化
   */
  rotationOverLifetime?: AnimationCurve;
}

/**
 * 数值范围
 */
export interface ValueRange {
  /**
   * 最小值
   */
  min: number;
  /**
   * 最大值
   */
  max: number;
}

/**
 * 颜色范围
 */
export interface ColorRange {
  /**
   * 起始颜色
   */
  start: [number, number, number, number];
  /**
   * 结束颜色
   */
  end: [number, number, number, number];
}

/**
 * 动画曲线
 */
export interface AnimationCurve {
  /**
   * 关键点
   */
  keys: CurveKey[];
  /**
   * 预设类型
   */
  preset?: CurvePreset;
}

/**
 * 曲线关键点
 */
export interface CurveKey {
  /**
   * 时间（0-1）
   */
  time: number;
  /**
   * 值
   */
  value: number;
  /**
   * 输入切线
   */
  inTangent: number;
  /**
   * 输出切线
   */
  outTangent: number;
}

/**
 * 曲线预设
 */
export enum CurvePreset {
  /**
   * 常量
   */
  Constant = 'constant',
  /**
   * 线性
   */
  Linear = 'linear',
  /**
   * 随机
   */
  Random = 'random',
  /**
   * 自定义
   */
  Custom = 'custom',
}

/**
 * 颜色曲线
 */
export interface ColorCurve {
  /**
   * 红色通道
   */
  r: AnimationCurve;
  /**
   * 绿色通道
   */
  g: AnimationCurve;
  /**
   * 蓝色通道
   */
  b: AnimationCurve;
  /**
   * 透明度通道
   */
  a: AnimationCurve;
}

/**
 * 速度曲线
 */
export interface VelocityCurve {
  /**
   * X轴速度
   */
  x: AnimationCurve;
  /**
   * Y轴速度
   */
  y: AnimationCurve;
  /**
   * Z轴速度
   */
  z: AnimationCurve;
}

/**
 * 粒子渲染器
 */
export interface ParticleRenderer {
  /**
   * 渲染模式
   */
  mode: RenderMode;
  /**
   * 材质
   */
  material: string;
  /**
   * 纹理
   */
  texture?: string;
  /**
   * 混合模式
   */
  blendMode: BlendMode;
  /**
   * 排序模式
   */
  sortMode: SortMode;
}

/**
 * 渲染模式
 */
export enum RenderMode {
  /**
   * 广告牌
   */
  Billboard = 'billboard',
  /**
   * 拉伸广告牌
   */
  StretchedBillboard = 'stretched-billboard',
  /**
   * 水平广告牌
   */
  HorizontalBillboard = 'horizontal-billboard',
  /**
   * 垂直广告牌
   */
  VerticalBillboard = 'vertical-billboard',
  /**
   * 网格
   */
  Mesh = 'mesh',
}

/**
 * 混合模式
 */
export enum BlendMode {
  /**
   * 透明
   */
  Alpha = 'alpha',
  /**
   * 加法
   */
  Additive = 'additive',
  /**
   * 乘法
   */
  Multiply = 'multiply',
  /**
   * 预乘透明
   */
  Premultiplied = 'premultiplied',
}

/**
 * 排序模式
 */
export enum SortMode {
  /**
   * 无排序
   */
  None = 'none',
  /**
   * 按距离排序
   */
  Distance = 'distance',
  /**
   * 按年龄排序
   */
  OldestInFront = 'oldest-in-front',
  /**
   * 按年龄排序（新的在前）
   */
  YoungestInFront = 'youngest-in-front',
}

/**
 * 粒子物理
 */
export interface ParticlePhysics {
  /**
   * 重力
   */
  gravity: [number, number, number];
  /**
   * 阻尼
   */
  damping: number;
  /**
   * 碰撞
   */
  collision?: ParticleCollision;
  /**
   * 力场
   */
  forceFields?: ForceField[];
}

/**
 * 粒子碰撞
 */
export interface ParticleCollision {
  /**
   * 启用碰撞
   */
  enabled: boolean;
  /**
   * 碰撞层
   */
  layers: string[];
  /**
   * 弹性系数
   */
  bounce: number;
  /**
   * 生命周期损失
   */
  lifetimeLoss: number;
}

/**
 * 力场
 */
export interface ForceField {
  /**
   * 力场类型
   */
  type: ForceFieldType;
  /**
   * 强度
   */
  strength: number;
  /**
   * 位置
   */
  position: [number, number, number];
  /**
   * 影响范围
   */
  range: number;
  /**
   * 衰减
   */
  falloff: number;
}

/**
 * 力场类型
 */
export enum ForceFieldType {
  /**
   * 点力场
   */
  Point = 'point',
  /**
   * 方向力场
   */
  Directional = 'directional',
  /**
   * 涡流
   */
  Vortex = 'vortex',
  /**
   * 湍流
   */
  Turbulence = 'turbulence',
}
