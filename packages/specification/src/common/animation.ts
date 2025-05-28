/**
 * Maxellabs 通用动画
 * 定义所有系统共通的动画相关类型
 */

import type { AnimationKeyframe } from './frame';
import type {
  BlendMode,
  LoopMode,
  EasingFunction,
  PlayState,
  BaseAnimationConfig,
  BaseEvent,
  BaseController,
  BaseParameter,
  EventType,
} from '../core';

/**
 * 通用动画配置（扩展核心配置）
 */
export interface CommonAnimationConfig extends BaseAnimationConfig {
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
  loopMode?: LoopMode;
  /**
   * 循环次数（-1为无限循环）
   */
  loopCount?: number;
  /**
   * 缓动函数
   */
  easing?: EasingFunction;
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
  blendMode?: BlendMode;
}

/**
 * 动画事件（扩展核心事件）
 */
export interface AnimationEvent extends BaseEvent {
  /**
   * 事件类型
   */
  type: EventType;
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
 * 动画控制器（扩展核心控制器）
 */
export interface AnimationController extends BaseController {
  /**
   * 当前播放状态
   */
  playState: PlayState;
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
  blendMode: BlendMode;
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
 * 动画转换
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
 * 动画参数（扩展核心参数）
 */
export interface AnimationParameter extends BaseParameter {
  /**
   * 参数类型
   */
  type: 'bool' | 'int' | 'float' | 'trigger';
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
  blendMode: BlendMode;
}
