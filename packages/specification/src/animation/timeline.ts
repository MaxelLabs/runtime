/**
 * Maxellabs 时间轴模块
 * 时间轴和属性动画的定义
 */

import type { EasingFunction, TransformType } from '../core';
import type { AnimationTimeline } from '../common';
import type { PlaybackDirection } from './easing';

/**
 * 时间轴（使用通用类型作为基础）
 */
export interface Timeline extends Omit<AnimationTimeline, 'tracks' | 'events'> {
  /**
   * 播放速度
   */
  playbackRate: number;
  /**
   * 循环次数（-1 为无限循环）
   */
  iterations: number;
  /**
   * 播放方向
   */
  direction: PlaybackDirection;
  /**
   * 填充模式
   */
  fillMode: FillMode;
  /**
   * 延迟时间
   */
  delay: number;
  /**
   * 结束延迟
   */
  endDelay: number;
  /**
   * 动画序列
   */
  animations: TimelineAnimation[];
}

/**
 * 时间轴动画
 */
export interface TimelineAnimation {
  /**
   * 动画名称
   */
  name: string;
  /**
   * 目标选择器
   */
  target: string;
  /**
   * 开始时间（毫秒）
   */
  startTime: number;
  /**
   * 持续时间（毫秒）
   */
  duration: number;
  /**
   * 缓动函数（使用core类型）
   */
  easing: EasingFunction;
  /**
   * 属性动画
   */
  properties: PropertyAnimation[];
  /**
   * 延迟
   */
  delay?: number;
}

/**
 * 属性动画
 */
export interface PropertyAnimation {
  /**
   * 属性名称
   */
  property: string;
  /**
   * 起始值
   */
  from: any;
  /**
   * 结束值
   */
  to: any;
  /**
   * 单位
   */
  unit?: string;
  /**
   * 变换函数
   */
  transform?: TransformType;
}

// 重新导出通用类型以保持兼容性
export { AnimationTimeline, AnimationTimelineTrack } from '../common';
