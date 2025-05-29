/**
 * Maxellabs 动画控制器模块
 * 动画控制器、图层和遮罩的定义
 */

import type { AnimationController, AnimationMixerLayer, AnimationMask } from '../common';
import type { AnimationStateMachine } from './stateMachine';

/**
 * 扩展的动画控制器（添加状态机支持）
 */
export interface ExtendedAnimationController extends AnimationController {
  /**
   * 控制器名称
   */
  name: string;
  /**
   * 状态机
   */
  stateMachine?: AnimationStateMachine;
  /**
   * 当前状态
   */
  currentState?: string;
}

/**
 * 动画图层（扩展通用混合器层）
 */
export interface StateMachineAnimationLayer extends AnimationMixerLayer {
  /**
   * 状态机
   */
  stateMachine?: AnimationStateMachine;
}

/**
 * 骨骼动画遮罩（扩展通用遮罩）
 */
export interface BoneAnimationMask extends AnimationMask {
  /**
   * 包含的骨骼
   */
  includedBones: string[];
  /**
   * 排除的骨骼
   */
  excludedBones: string[];
}
