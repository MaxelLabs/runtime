/**
 * Maxellabs 动画状态机模块
 * 动画状态机、状态和转换的定义
 *
 * 注意: AnimationState, AnimationTransition 等核心类型已移动到 common/animation.ts
 * 此处重新导出以保持向后兼容
 */

import type { AnimationParameter } from '../common';

// 重新导出从 common/animation.ts 移动的类型（向后兼容）
export type {
  AnimationCondition,
  AnimationConditionType,
  ComparisonOperator,
  AnimationBehaviorType,
  AnimationStateBehavior,
  InterruptionSource,
  AnimationTransition,
  AnimationState,
} from '../common';

// 重新导入用于本文件的类型
import type { AnimationTransition, AnimationState, InterruptionSource } from '../common';

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
