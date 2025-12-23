/**
 * Maxellabs 动画状态机模块
 * 动画状态机、状态和转换的定义
 *
 * @description 动画状态机核心类型 (AnimationState, AnimationTransition 等)
 * 请直接从 '@maxellabs/specification/common' 导入
 */

import type { AnimationParameter, AnimationTransition, AnimationState, InterruptionSource } from '../common';
import type { Nameable } from '../core';

/**
 * 动画状态机（使用通用类型）
 *
 * @description 组合 Nameable trait
 */
export interface AnimationStateMachine extends Nameable {
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
