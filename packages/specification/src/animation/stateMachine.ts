/**
 * Maxellabs 动画状态机模块
 * 动画状态机、状态和转换的定义
 */

import type { AnimationState, AnimationTransition, AnimationParameter } from '../common';

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
 * 中断源（保留，因为common中没有定义）
 */
export enum InterruptionSource {
  None = 'none',
  Source = 'source',
  Destination = 'destination',
  SourceThenDestination = 'source-then-destination',
  DestinationThenSource = 'destination-then-source',
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
