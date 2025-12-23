/**
 * AnimationSystem
 * 动画更新系统 - 处理动画时间推进和状态更新
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 职责
 *
 * 1. 更新动画时间（AnimationState.time）
 * 2. 处理 Tween 插值（TweenState.progress）
 * 3. 处理 Timeline 播放
 * 4. 触发动画事件（开始、结束、循环等）
 *
 * ## 执行阶段
 *
 * **Update** - 在主更新阶段执行
 *
 * ## 查询
 *
 * - 动画状态：`{ all: [AnimationState] }`
 * - Tween 状态：`{ all: [TweenState] }`
 * - 时间轴：`{ all: [Timeline] }`
 *
 * ## 算法
 *
 * ```pseudocode
 * FOR each entity WITH (AnimationState):
 *   IF state.playing:
 *     state.time += deltaTime * state.speed
 *     IF state.time > clipDuration:
 *       IF state.loop:
 *         state.time = state.time % clipDuration
 *       ELSE:
 *         state.time = clipDuration
 *         state.playing = false
 *
 * FOR each entity WITH (TweenState):
 *   IF state.playing:
 *     state.progress += deltaTime / state.duration
 *     IF state.progress >= 1:
 *       state.progress = 1
 *       state.playing = false
 * ```
 */

import type { Query, SystemContext } from '../../ecs';
import { SystemStage } from '../../ecs';
import type { ISystem, SystemMetadata, SystemExecutionStats } from '../types';
import { AnimationState, TweenState, Timeline, AnimationClipRef } from '../../components/animation';
import type { EasingType } from '../../components/animation';

/**
 * AnimationSystem 元数据
 */
const ANIMATION_SYSTEM_METADATA: SystemMetadata = {
  name: 'AnimationSystem',
  description: '更新动画时间和状态',
  stage: SystemStage.Update,
  priority: 0,
};

// ============ 缓动函数 ============

/**
 * 缓动函数映射表
 */
const EASING_FUNCTIONS: Record<EasingType, (t: number) => number> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

/**
 * 应用缓动函数
 * @param t 线性进度 (0-1)
 * @param easing 缓动类型
 * @returns 缓动后的进度
 */
function applyEasing(t: number, easing: EasingType): number {
  const fn = EASING_FUNCTIONS[easing] || EASING_FUNCTIONS.linear;
  return fn(Math.max(0, Math.min(1, t)));
}

/**
 * AnimationSystem
 * 负责动画时间推进和状态更新
 *
 * @example
 * ```typescript
 * const animationSystem = new AnimationSystem();
 * scheduler.addSystem({
 *   ...animationSystem.metadata,
 *   execute: (ctx, query) => animationSystem.execute(ctx, query)
 * });
 * ```
 */
export class AnimationSystem implements ISystem {
  readonly metadata: SystemMetadata = ANIMATION_SYSTEM_METADATA;

  /** AnimationState 查询 */
  private animationQuery?: Query;

  /** TweenState 查询 */
  private tweenQuery?: Query;

  /** Timeline 查询 */
  private timelineQuery?: Query;

  /**
   * 初始化 AnimationSystem
   */
  initialize(ctx: SystemContext): Query | undefined {
    // 创建动画相关组件的查询
    this.animationQuery = ctx.world.query({ all: [AnimationState] });
    this.tweenQuery = ctx.world.query({ all: [TweenState] });
    this.timelineQuery = ctx.world.query({ all: [Timeline] });
    return this.animationQuery;
  }

  /**
   * 执行动画更新
   *
   * @param ctx System 上下文
   * @param _query 未使用
   * @returns 执行统计
   */
  execute(ctx: SystemContext, _query?: Query): SystemExecutionStats {
    const startTime = performance.now();
    let entityCount = 0;

    const deltaTime = ctx.deltaTime;

    // 1. 更新 AnimationState
    entityCount += this.updateAnimationStates(ctx, deltaTime);

    // 2. 更新 TweenState
    entityCount += this.updateTweenStates(deltaTime);

    // 3. 更新 Timeline
    entityCount += this.updateTimelines(deltaTime);

    const endTime = performance.now();

    return {
      entityCount,
      executionTimeMs: endTime - startTime,
      skipped: false,
    };
  }

  /**
   * 更新 AnimationState 组件
   */
  private updateAnimationStates(ctx: SystemContext, deltaTime: number): number {
    if (!this.animationQuery) {
      return 0;
    }

    let count = 0;

    this.animationQuery.forEach((entity, components) => {
      count++;
      const state = components[0] as AnimationState;

      if (!state.playing) {
        return;
      }

      // 获取动画片段时长
      const clipRef = ctx.world.getComponent(entity, AnimationClipRef);
      const duration = clipRef?.duration ?? 1;

      // 更新时间
      state.time += deltaTime * state.speed;

      // 处理循环和结束
      if (state.time >= duration) {
        if (state.loop) {
          // 循环播放
          state.time = state.time % duration;
        } else {
          // 停止播放
          state.time = duration;
          state.playing = false;
        }
      } else if (state.time < 0) {
        // 反向播放处理
        if (state.loop) {
          state.time = duration + (state.time % duration);
        } else {
          state.time = 0;
          state.playing = false;
        }
      }
    });

    return count;
  }

  /**
   * 更新 TweenState 组件
   */
  private updateTweenStates(deltaTime: number): number {
    if (!this.tweenQuery) {
      return 0;
    }

    let count = 0;

    this.tweenQuery.forEach((_entity, components) => {
      count++;
      const state = components[0] as TweenState;

      if (!state.playing) {
        return;
      }

      // 更新进度
      const progressDelta = deltaTime / state.duration;
      state.progress += progressDelta;

      // 处理结束
      if (state.progress >= 1) {
        state.progress = 1;
        state.playing = false;
      } else if (state.progress < 0) {
        state.progress = 0;
        state.playing = false;
      }
    });

    return count;
  }

  /**
   * 更新 Timeline 组件
   */
  private updateTimelines(deltaTime: number): number {
    if (!this.timelineQuery) {
      return 0;
    }

    let count = 0;

    this.timelineQuery.forEach((_entity, components) => {
      count++;
      const timeline = components[0] as Timeline;

      if (!timeline.playing) {
        return;
      }

      // 更新当前时间
      timeline.currentTime += deltaTime * timeline.speed;

      // 处理循环和结束
      if (timeline.currentTime >= timeline.duration) {
        // Timeline 默认不循环，到达结尾停止
        timeline.currentTime = timeline.duration;
        timeline.playing = false;
      } else if (timeline.currentTime < 0) {
        timeline.currentTime = 0;
        timeline.playing = false;
      }
    });

    return count;
  }

  /**
   * 销毁 AnimationSystem
   */
  dispose(_ctx: SystemContext): void {
    this.animationQuery = undefined;
    this.tweenQuery = undefined;
    this.timelineQuery = undefined;
  }
}

/**
 * 获取 Tween 的当前插值值
 * @param state TweenState 组件
 * @returns 当前插值值
 */
export function getTweenValue(state: TweenState): number {
  const easedProgress = applyEasing(state.progress, state.easing);
  return state.from + (state.to - state.from) * easedProgress;
}

/**
 * 创建 AnimationSystem 的 SystemDef
 */
export function createAnimationSystemDef(): {
  name: string;
  stage: SystemStage;
  priority?: number;
  execute: (ctx: SystemContext, query?: Query) => void;
} {
  const system = new AnimationSystem();

  return {
    name: system.metadata.name,
    stage: system.metadata.stage,
    priority: system.metadata.priority,
    execute: (ctx, query) => system.execute(ctx, query),
  };
}
