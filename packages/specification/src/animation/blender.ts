/**
 * Maxellabs 动画混合器模块
 * 动画混合器和混合输入的定义
 */

import type { BlendMode } from '../core';
import type { AnimationMixer } from '../common';

/**
 * 动画混合器（使用通用类型作为基础）
 */
export interface AnimationBlender extends Omit<AnimationMixer, 'layers'> {
  /**
   * 混合类型（使用core BlendMode）
   */
  type: BlendMode;
  /**
   * 输入动画
   */
  inputs: AnimationBlendInput[];
  /**
   * 混合权重
   */
  weights: number[];
}

/**
 * 动画混合输入
 */
export interface AnimationBlendInput {
  /**
   * 动画剪辑
   */
  clip: string;
  /**
   * 权重
   */
  weight: number;
  /**
   * 时间偏移
   */
  timeOffset: number;
}
