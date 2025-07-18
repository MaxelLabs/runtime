/**
 * Maxellabs 动画状态机模块
 * 动画状态机、状态和转换的定义
 */

import type { AnimationParameter } from '../common';
import type { AnimationState, AnimationTransition, InterruptionSource } from '.';

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

// InterruptionSource 已在 animation/index.ts 中定义作为权威来源

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
