/**
 * Animation Components
 * 基于 specification 的动画相关数据组件
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计决策
 *
 * 所有动画组件都继承自 Component 基类，提供：
 * - 引用计数管理（继承自 ReferResource）
 * - 组件启用/禁用状态
 * - 组件脏标记（用于优化更新）
 * - 组件所属实体引用
 */

import type { IAnimationState, IAnimationClipRef, ITimeline, ITweenState, EasingType } from '@maxellabs/specification';
import { Component } from '../base';

/**
 * AnimationState Component - 动画状态组件
 * @description 继承 Component 基类，实现 IAnimationState 接口，存储实体的动画播放状态
 */
export class AnimationState extends Component implements IAnimationState {
  /** 当前播放的动画 ID */
  currentClipId: string = '';

  /** 播放时间 (秒) */
  time: number = 0;

  /** 播放速度缩放 */
  speed: number = 1;

  /** 是否循环播放 */
  loop: boolean = true;

  /** 是否正在播放 */
  playing: boolean = false;

  /**
   * 从 IAnimationState 规范数据创建组件
   * @param data IAnimationState 规范数据（ECS 组件接口）
   * @returns AnimationState 组件实例
   *
   * @example
   * ```typescript
   * const state = AnimationState.fromData({
   *   currentClipId: 'walk',
   *   time: 0,
   *   speed: 1,
   *   loop: true,
   *   playing: true
   * });
   * ```
   */
  static fromData(data: IAnimationState): AnimationState {
    const component = new AnimationState();
    component.currentClipId = data.currentClipId;
    component.time = data.time;
    component.speed = data.speed;
    component.loop = data.loop;
    component.playing = data.playing;
    return component;
  }

  /**
   * 克隆组件
   * @returns 克隆的 AnimationState 实例
   */
  override clone(): AnimationState {
    const cloned = new AnimationState();
    cloned.currentClipId = this.currentClipId;
    cloned.time = this.time;
    cloned.speed = this.speed;
    cloned.loop = this.loop;
    cloned.playing = this.playing;
    return cloned;
  }
}

/**
 * AnimationClipRef Component - 动画片段引用组件
 * @description 继承 Component 基类，实现 IAnimationClipRef 接口，引用外部动画资源
 */
export class AnimationClipRef extends Component implements IAnimationClipRef {
  /** 动画资源 ID */
  assetId: string = '';

  /** 动画持续时间 (秒) */
  duration: number = 0;

  /**
   * 从 IAnimationClipRef 规范数据创建组件
   * @param data IAnimationClipRef 规范数据
   * @returns AnimationClipRef 组件实例
   */
  static fromData(data: IAnimationClipRef): AnimationClipRef {
    const component = new AnimationClipRef();
    component.assetId = data.assetId;
    component.duration = data.duration;
    return component;
  }

  /**
   * 克隆组件
   * @returns 克隆的 AnimationClipRef 实例
   */
  override clone(): AnimationClipRef {
    const cloned = new AnimationClipRef();
    cloned.assetId = this.assetId;
    cloned.duration = this.duration;
    return cloned;
  }
}

/**
 * Timeline Component - 时间轴组件
 * @description 继承 Component 基类，实现 ITimeline 接口，存储多个动画轨道的时间轴数据
 */
export class Timeline extends Component implements ITimeline {
  /** 当前时间 (秒) */
  currentTime: number = 0;

  /** 总持续时间 (秒) */
  duration: number = 0;

  /** 是否正在播放 */
  playing: boolean = false;

  /** 播放速度 */
  speed: number = 1;

  /** 轨道 ID 列表 */
  trackIds: string[] = [];

  /**
   * 从 ITimeline 规范数据创建组件
   * @param data ITimeline 规范数据
   * @returns Timeline 组件实例
   */
  static fromData(data: ITimeline): Timeline {
    const component = new Timeline();
    component.currentTime = data.currentTime;
    component.duration = data.duration;
    component.playing = data.playing;
    component.speed = data.speed;
    component.trackIds = [...data.trackIds];
    return component;
  }

  /**
   * 克隆组件
   * @returns 克隆的 Timeline 实例
   */
  override clone(): Timeline {
    const cloned = new Timeline();
    cloned.currentTime = this.currentTime;
    cloned.duration = this.duration;
    cloned.playing = this.playing;
    cloned.speed = this.speed;
    cloned.trackIds = [...this.trackIds];
    return cloned;
  }
}

// 重新导出 EasingType
export type { EasingType };

/**
 * TweenState Component - 补间动画状态组件
 * @description 继承 Component 基类，实现 ITweenState 接口，简单的属性补间动画状态
 */
export class TweenState extends Component implements ITweenState {
  /** 起始值 */
  from: number = 0;

  /** 目标值 */
  to: number = 0;

  /** 当前进度 (0-1) */
  progress: number = 0;

  /** 持续时间 (秒) */
  duration: number = 1;

  /** 缓动函数类型 */
  easing: EasingType = 'linear';

  /** 是否正在播放 */
  playing: boolean = false;

  /**
   * 从 ITweenState 规范数据创建组件
   * @param data ITweenState 规范数据
   * @returns TweenState 组件实例
   */
  static fromData(data: ITweenState): TweenState {
    const component = new TweenState();
    component.from = data.from;
    component.to = data.to;
    component.progress = data.progress;
    component.duration = data.duration;
    component.easing = data.easing;
    component.playing = data.playing;
    return component;
  }

  /**
   * 克隆组件
   * @returns 克隆的 TweenState 实例
   */
  override clone(): TweenState {
    const cloned = new TweenState();
    cloned.from = this.from;
    cloned.to = this.to;
    cloned.progress = this.progress;
    cloned.duration = this.duration;
    cloned.easing = this.easing;
    cloned.playing = this.playing;
    return cloned;
  }
}
