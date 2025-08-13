/**
 * Maxellabs 动画状态机模块
 * 动画状态机、状态和转换的定义
 */

import type { AnimationParameter } from '../common';
import type { AnimationCondition } from './core';

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
 * Maxellabs 动画模块统一导出
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
 * 动画状态机（使用通用类型）
 */
export interface AnimationStateMachine {
  /**
   * 状态机名称
   */
  name: string;
  /**
   * 状态列表（使用通用类型）
   */
  states: AnimationState[];
  /**
   * 转换列表（使用通用类型）
   */
  transitions: AnimationTransition[];
  /**
   * 默认状态
   */
  defaultState: string;
  /**
   * 参数列表（使用通用类型）
   */
  parameters: AnimationParameter[];
}

/**
 * 扩展的动画转换（添加中断源）
 */
export interface ExtendedAnimationTransition extends AnimationTransition {
  /**
   * 中断源
   */
  interruptionSource?: InterruptionSource;
  /**
   * 偏移时间
   */
  offset?: number;
}
