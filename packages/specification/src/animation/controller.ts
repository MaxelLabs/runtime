/**
 * Maxellabs 动画控制器模块
 * 动画控制器、图层和遮罩的定义
 */

import type { BlendMode } from '../core/enums';
import type { AnimationStateMachine } from './stateMachine';

/**
 * 动画控制器
 */
export interface AnimationController {
  /**
   * 控制器名称
   */
  name: string;
  /**
   * 状态机
   */
  stateMachine: AnimationStateMachine;
  /**
   * 当前状态
   */
  currentState: string;
  /**
   * 播放时间
   */
  time: number;
}

/**
 * 动画图层
 */
export interface AnimationLayer {
  /**
   * 图层名称
   */
  name: string;
  /**
   * 图层权重
   */
  weight: number;
  /**
   * 混合模式
   */
  blendMode: BlendMode;
  /**
   * 状态机
   */
  stateMachine: AnimationStateMachine;
  /**
   * 遮罩
   */
  mask?: AnimationMask;
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
   * 包含的骨骼
   */
  includedBones: string[];
  /**
   * 排除的骨骼
   */
  excludedBones: string[];
}
