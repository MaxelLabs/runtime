/**
 * Maxellabs 通用动画
 * 定义所有系统共通的动画相关类型
 */

/**
 * 动画播放状态
 */
export enum AnimationPlayState {
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
 * 动画循环模式
 */
export enum AnimationLoopMode {
  /**
   * 不循环
   */
  None = 'none',
  /**
   * 循环
   */
  Loop = 'loop',
  /**
   * 往返循环
   */
  PingPong = 'ping-pong',
  /**
   * 反向循环
   */
  Reverse = 'reverse',
}

/**
 * 动画混合模式
 */
export enum AnimationBlendMode {
  /**
   * 覆盖
   */
  Override = 'override',
  /**
   * 叠加
   */
  Additive = 'additive',
  /**
   * 相乘
   */
  Multiply = 'multiply',
  /**
   * 减法
   */
  Subtract = 'subtract',
  /**
   * 最小值
   */
  Min = 'min',
  /**
   * 最大值
   */
  Max = 'max',
}

/**
 * 缓动函数类型
 */
export enum EasingType {
  /**
   * 线性
   */
  Linear = 'linear',
  /**
   * 缓入
   */
  EaseIn = 'ease-in',
  /**
   * 缓出
   */
  EaseOut = 'ease-out',
  /**
   * 缓入缓出
   */
  EaseInOut = 'ease-in-out',
  /**
   * 三次贝塞尔
   */
  CubicBezier = 'cubic-bezier',
  /**
   * 弹性
   */
  Elastic = 'elastic',
  /**
   * 反弹
   */
  Bounce = 'bounce',
  /**
   * 回退
   */
  Back = 'back',
}

/**
 * 通用动画配置
 */
export interface CommonAnimationConfig {
  /**
   * 动画名称
   */
  name: string;
  /**
   * 持续时间（秒）
   */
  duration: number;
  /**
   * 延迟时间（秒）
   */
  delay?: number;
  /**
   * 播放速度
   */
  speed?: number;
  /**
   * 循环模式
   */
  loopMode?: AnimationLoopMode;
  /**
   * 循环次数（-1为无限循环）
   */
  loopCount?: number;
  /**
   * 缓动函数
   */
  easing?: EasingType;
  /**
   * 自定义缓动参数
   */
  easingParams?: number[];
  /**
   * 是否自动播放
   */
  autoPlay?: boolean;
  /**
   * 是否自动销毁
   */
  autoDestroy?: boolean;
  /**
   * 动画权重
   */
  weight?: number;
  /**
   * 混合模式
   */
  blendMode?: AnimationBlendMode;
}

/**
 * 动画事件类型
 */
export enum AnimationEventType {
  /**
   * 开始播放
   */
  Start = 'start',
  /**
   * 暂停
   */
  Pause = 'pause',
  /**
   * 恢复播放
   */
  Resume = 'resume',
  /**
   * 停止
   */
  Stop = 'stop',
  /**
   * 完成
   */
  Complete = 'complete',
  /**
   * 循环
   */
  Loop = 'loop',
  /**
   * 更新
   */
  Update = 'update',
  /**
   * 自定义事件
   */
  Custom = 'custom',
}

/**
 * 动画事件
 */
export interface AnimationEvent {
  /**
   * 事件类型
   */
  type: AnimationEventType;
  /**
   * 事件名称
   */
  name?: string;
  /**
   * 触发时间（秒）
   */
  time: number;
  /**
   * 事件参数
   */
  parameters?: Record<string, any>;
  /**
   * 事件回调
   */
  callback?: string;
}

/**
 * 动画控制器
 */
export interface AnimationController {
  /**
   * 当前播放状态
   */
  playState: AnimationPlayState;
  /**
   * 当前时间
   */
  currentTime: number;
  /**
   * 播放速度
   */
  playbackSpeed: number;
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 动画权重
   */
  weight: number;
  /**
   * 当前循环次数
   */
  currentLoop: number;
  /**
   * 播放方向（1为正向，-1为反向）
   */
  direction: number;
}

/**
 * 动画混合器
 */
export interface AnimationMixer {
  /**
   * 混合器名称
   */
  name: string;
  /**
   * 动画层列表
   */
  layers: AnimationMixerLayer[];
  /**
   * 全局权重
   */
  globalWeight: number;
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 更新模式
   */
  updateMode: 'normal' | 'unscaled-time' | 'manual';
}

/**
 * 动画混合器层
 */
export interface AnimationMixerLayer {
  /**
   * 层名称
   */
  name: string;
  /**
   * 层权重
   */
  weight: number;
  /**
   * 混合模式
   */
  blendMode: AnimationBlendMode;
  /**
   * 动画状态列表
   */
  states: AnimationState[];
  /**
   * 当前状态
   */
  currentState?: string;
  /**
   * 状态转换列表
   */
  transitions: AnimationTransition[];
  /**
   * 遮罩
   */
  mask?: AnimationMask;
}

/**
 * 动画状态
 */
export interface AnimationState {
  /**
   * 状态名称
   */
  name: string;
  /**
   * 动画剪辑
   */
  clip: string;
  /**
   * 播放速度
   */
  speed: number;
  /**
   * 是否循环
   */
  loop: boolean;
  /**
   * 权重
   */
  weight: number;
  /**
   * 状态行为
   */
  behaviors?: AnimationStateBehavior[];
}

/**
 * 动画状态行为
 */
export interface AnimationStateBehavior {
  /**
   * 行为类型
   */
  type: string;
  /**
   * 行为参数
   */
  parameters?: Record<string, any>;
  /**
   * 触发条件
   */
  conditions?: AnimationCondition[];
}

/**
 * 动画状态转换
 */
export interface AnimationTransition {
  /**
   * 源状态
   */
  from: string;
  /**
   * 目标状态
   */
  to: string;
  /**
   * 转换条件
   */
  conditions: AnimationCondition[];
  /**
   * 转换持续时间
   */
  duration: number;
  /**
   * 是否有退出时间
   */
  hasExitTime: boolean;
  /**
   * 退出时间
   */
  exitTime?: number;
  /**
   * 转换偏移
   */
  offset?: number;
  /**
   * 是否可中断
   */
  canTransitionToSelf?: boolean;
}

/**
 * 动画条件
 */
export interface AnimationCondition {
  /**
   * 参数名称
   */
  parameter: string;
  /**
   * 比较类型
   */
  comparison: 'equals' | 'not-equals' | 'greater' | 'less' | 'greater-equal' | 'less-equal';
  /**
   * 比较值
   */
  value: any;
  /**
   * 逻辑操作符
   */
  operator?: 'and' | 'or';
}

/**
 * 动画遮罩
 */
export interface AnimationMask {
  /**
   * 遮罩名称
   */
  name: string;
  /**
   * 包含的路径
   */
  includePaths: string[];
  /**
   * 排除的路径
   */
  excludePaths?: string[];
  /**
   * 权重
   */
  weight: number;
}

/**
 * 动画参数
 */
export interface AnimationParameter {
  /**
   * 参数名称
   */
  name: string;
  /**
   * 参数类型
   */
  type: 'bool' | 'int' | 'float' | 'trigger';
  /**
   * 默认值
   */
  defaultValue: any;
  /**
   * 当前值
   */
  value: any;
  /**
   * 最小值（数值类型）
   */
  min?: number;
  /**
   * 最大值（数值类型）
   */
  max?: number;
}

/**
 * 动画时间轴
 */
export interface AnimationTimeline {
  /**
   * 时间轴名称
   */
  name: string;
  /**
   * 总持续时间
   */
  duration: number;
  /**
   * 动画轨道列表
   */
  tracks: AnimationTimelineTrack[];
  /**
   * 时间轴事件
   */
  events: AnimationEvent[];
  /**
   * 是否循环
   */
  loop: boolean;
  /**
   * 播放速度
   */
  speed: number;
}

/**
 * 动画时间轴轨道
 */
export interface AnimationTimelineTrack {
  /**
   * 轨道名称
   */
  name: string;
  /**
   * 目标对象ID
   */
  targetId: string;
  /**
   * 目标属性
   */
  property: string;
  /**
   * 关键帧列表
   */
  keyframes: AnimationKeyframe[];
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 权重
   */
  weight: number;
  /**
   * 混合模式
   */
  blendMode: AnimationBlendMode;
}

/**
 * 动画关键帧
 */
export interface AnimationKeyframe {
  /**
   * 时间
   */
  time: number;
  /**
   * 值
   */
  value: any;
  /**
   * 插值类型
   */
  interpolation: 'linear' | 'step' | 'bezier' | 'spline';
  /**
   * 缓动函数
   */
  easing?: EasingType;
  /**
   * 贝塞尔控制点
   */
  bezierControlPoints?: {
    inTangent: [number, number];
    outTangent: [number, number];
  };
}
