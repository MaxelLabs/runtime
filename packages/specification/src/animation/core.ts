/**
 * Maxellabs 动画核心模块
 * 基于 USD 的动画基础类型和接口定义
 */

import type { UsdPrim, UsdValue } from '../core/usd';
import type { InterpolationMode } from '../core/enums';
import type { CommonMetadata } from '../core/interfaces';
import type { AnimationEvent, AnimationKeyframe, AnimationTrack } from '../common';

/**
 * 动画基础接口（重写 metadata 类型）
 */
export interface AnimationPrim extends Omit<UsdPrim, 'metadata'> {
  typeName: 'Animation';
  /**
   * 元数据（使用 CommonMetadata 类型）
   */
  metadata?: CommonMetadata;
}

/**
 * USD动画剪辑（USD特有的动画剪辑定义）
 */
export interface UsdAnimationClip extends AnimationPrim {
  attributes: {
    /**
     * 动画名称
     */
    name: UsdValue; // string
    /**
     * 持续时间（秒）
     */
    duration: UsdValue; // float
    /**
     * 帧率
     */
    frameRate: UsdValue; // float
    /**
     * 循环模式（使用通用类型）
     */
    loopMode: UsdValue; // AnimationLoopMode
    /**
     * 开始时间
     */
    startTime?: UsdValue; // float
    /**
     * 结束时间
     */
    endTime?: UsdValue; // float
  };
  /**
   * 动画轨道
   */
  tracks: AnimationTrack[];
  /**
   * 动画事件（使用通用类型）
   */
  events?: AnimationEvent[];
}

/**
 * USD特有的切线定义
 */
export interface UsdTangent {
  /**
   * X 分量
   */
  x: number;
  /**
   * Y 分量
   */
  y: number;
}

/**
 * USD特定的关键帧（扩展通用关键帧）
 */
export interface UsdKeyframe extends Omit<AnimationKeyframe, 'interpolation' | 'bezierControlPoints'> {
  /**
   * 输入切线
   */
  inTangent?: UsdTangent;
  /**
   * 输出切线
   */
  outTangent?: UsdTangent;
  /**
   * 插值模式（使用core类型）
   */
  interpolation?: InterpolationMode;
}

/**
 * USD特有的动画轨道
 */
export interface UsdAnimationTrack extends Omit<AnimationTrack, 'keyframes'> {
  /**
   * USD关键帧列表
   */
  keyframes: UsdKeyframe[];
  /**
   * USD属性路径
   */
  usdPath: string;
  /**
   * USD属性类型
   */
  usdType: string;
}
