/**
 * Maxellabs 动画缓动模块
 * 动画系统特有的扩展缓动函数定义
 *
 * Phase 5 重构: 移除与 core/enums.ts EasingFunction 重复的值
 * 基础缓动函数请使用 EasingFunction (from core)
 */

import type { EasingFunction } from '../core';

/**
 * 扩展的缓动函数类型（动画特有的类型，补充 EasingFunction）
 *
 * @description 只包含 EasingFunction 未覆盖的类型
 * 基础缓动函数请使用 core/enums.ts 中的 EasingFunction
 */
export enum ExtendedEasingType {
  // 动画特有的缓动类型
  CubicBezier = 'cubic-bezier',
  Spring = 'spring',
  Steps = 'steps',

  // 补充 EasingFunction 中缺失的 Expo 和 Circ 系列
  ExpoIn = 'expo-in',
  ExpoOut = 'expo-out',
  ExpoInOut = 'expo-in-out',
  CircIn = 'circ-in',
  CircOut = 'circ-out',
  CircInOut = 'circ-in-out',
}

/**
 * 完整缓动类型（EasingFunction + ExtendedEasingType）
 */
export type FullEasingType = EasingFunction | ExtendedEasingType;

/**
 * 动画特有的变换函数（扩展核心变换函数）
 */
export interface AnimationTransformFunction {
  /**
   * 变换类型（使用核心TransformType）
   */
  type: string;
  /**
   * 函数参数
   */
  parameters: number[];
  /**
   * 动画特有的插值参数
   */
  interpolation?: ExtendedEasingType;
  /**
   * 关键帧时间点
   */
  keyframes?: number[];
}
