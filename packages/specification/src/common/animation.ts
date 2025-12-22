/**
 * Maxellabs 通用动画
 * 定义所有系统共通的动画相关类型
 *
 * @module common/animation
 * @description 动画状态机和高级动画控制类型
 *
 * ## 模块依赖关系
 *
 * ```
 * common/frame.ts (AnimationKeyframe, AnimationTrack, AnimationEvent, AnimationMask)
 *        ↓
 * common/animation.ts (重新导出 + AnimationState, AnimationController 等)
 * ```
 *
 * ## 设计说明
 * - 基础动画类型 (AnimationKeyframe, AnimationEvent, AnimationMask) 定义在 frame.ts
 * - 本模块定义状态机相关类型 (AnimationState, AnimationTransition)
 * - 从 frame.ts 重新导出基础类型以保持向后兼容
 * - 这种设计避免了 common <-> animation 的循环依赖
 */

// 从 frame.ts 导入基础类型
import type { AnimationKeyframe, AnimationEvent, AnimationMask } from './frame';

// 重新导出基础类型（向后兼容）
export type { AnimationEvent, AnimationMask } from './frame';

import type {
  BlendMode,
  LoopMode,
  EasingFunction,
  PlayState,
  BaseAnimationConfig,
  BaseController,
  BaseParameter,
} from '../core';

// ============================================================================
// 动画条件相关类型 (从 animation/core.ts 移动)
// ============================================================================

/**
 * 动画条件类型
 */
export enum AnimationConditionType {
  /** 布尔值 */
  Boolean = 'boolean',
  /** 整数 */
  Integer = 'integer',
  /** 浮点数 */
  Float = 'float',
  /** 触发器 */
  Trigger = 'trigger',
}

/**
 * 比较运算符
 */
export enum ComparisonOperator {
  /** 等于 */
  Equal = 'equal',
  /** 不等于 */
  NotEqual = 'not-equal',
  /** 大于 */
  Greater = 'greater',
  /** 小于 */
  Less = 'less',
  /** 大于等于 */
  GreaterEqual = 'greater-equal',
  /** 小于等于 */
  LessEqual = 'less-equal',
}

/**
 * 动画条件统一定义
 */
export interface AnimationCondition {
  /**
   * 条件ID
   */
  id: string;
  /**
   * 参数名称
   */
  parameter: string;
  /**
   * 条件类型
   */
  type: AnimationConditionType;
  /**
   * 条件值
   */
  value?: any;
  /**
   * 比较运算符
   */
  operator?: ComparisonOperator;
}

// ============================================================================
// 动画状态机相关类型 (从 animation/stateMachine.ts 移动)
// ============================================================================

/**
 * 动画行为类型
 */
export enum AnimationBehaviorType {
  /** 进入状态时触发 */
  OnStateEnter = 'on-state-enter',
  /** 离开状态时触发 */
  OnStateExit = 'on-state-exit',
  /** 状态更新时触发 */
  OnStateUpdate = 'on-state-update',
  /** 状态机更新时触发 */
  OnStateMachineEnter = 'on-state-machine-enter',
  /** 状态机退出时触发 */
  OnStateMachineExit = 'on-state-machine-exit',
}

/**
 * 动画状态行为统一定义
 */
export interface AnimationStateBehavior {
  /**
   * 行为ID
   */
  id: string;
  /**
   * 行为类型
   */
  type: AnimationBehaviorType;
  /**
   * 行为参数
   */
  parameters?: Record<string, any>;
  /**
   * 触发条件
   */
  conditions?: AnimationCondition[];
  /**
   * 是否启用
   */
  enabled?: boolean;
}

/**
 * 中断源
 */
export enum InterruptionSource {
  /** 无中断 */
  None = 'none',
  /** 当前状态 */
  CurrentState = 'current-state',
  /** 下一个状态 */
  NextState = 'next-state',
  /** 当前状态然后下一个状态 */
  CurrentStateThenNextState = 'current-state-then-next-state',
  /** 下一个状态然后当前状态 */
  NextStateThenCurrentState = 'next-state-then-current-state',
}

/**
 * 动画转换统一定义
 */
export interface AnimationTransition {
  /**
   * 转换ID
   */
  id: string;
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
  /**
   * 中断源
   */
  interruptionSource?: InterruptionSource;
}

/**
 * 动画状态统一定义
 */
export interface AnimationState {
  /**
   * 状态ID
   */
  id: string;
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
   * 开始时间
   */
  startTime?: number;
  /**
   * 结束时间
   */
  endTime?: number;
  /**
   * 淡入时间
   */
  fadeInTime?: number;
  /**
   * 淡出时间
   */
  fadeOutTime?: number;
  /**
   * 状态行为
   */
  behaviors?: AnimationStateBehavior[];
  /**
   * 状态转换
   */
  transitions?: AnimationTransition[];
  /**
   * 是否激活
   */
  active?: boolean;
  /**
   * 状态参数
   */
  parameters?: Record<string, any>;
}

// ============================================================================
// 通用动画配置和控制器
// ============================================================================

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

// AnimationEvent 已移动到 frame.ts，从那里重新导出

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

// AnimationMask 已移动到 frame.ts，从那里重新导出

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
