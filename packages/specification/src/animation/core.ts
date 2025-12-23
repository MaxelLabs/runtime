/**
 * Maxellabs 动画核心模块
 * 基于 USD 的动画基础类型和接口定义
 *
 * Phase 2 重构: UsdKeyframe 和 UsdAnimationTrack 现在基于 core/generics.ts 中的统一泛型
 *
 * @description 动画条件类型 (AnimationCondition, AnimationConditionType, ComparisonOperator)
 * 请直接从 '@maxellabs/specification/common' 导入
 */

import type { UsdPrim, UsdValue, CommonMetadata, UnifiedKeyframe, UnifiedAnimationTrack } from '../core';
import type { AnimationEvent, AnimationTrack } from '../common';

/**
 * 动画基础接口
 */
export interface AnimationPrim extends Omit<UsdPrim, 'metadata'> {
  typeName: 'Animation';
  /**
   * 元数据
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
 *
 * @description USD 使用 x/y 命名而不是通用的 Vector2Like
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
 * USD特定的关键帧
 *
 * @description 基于 UnifiedKeyframe 泛型，添加 USD 特有的切线定义
 * 保持向后兼容：继承 AnimationKeyframe (即 UnifiedKeyframe) 的大部分属性
 */
export interface UsdKeyframe extends Omit<UnifiedKeyframe<any>, 'inTangent' | 'outTangent' | 'bezierControlPoints'> {
  /**
   * 输入切线 (USD 格式)
   */
  inTangent?: UsdTangent;
  /**
   * 输出切线 (USD 格式)
   */
  outTangent?: UsdTangent;
}

/**
 * USD特有的动画轨道
 *
 * @description 基于 UnifiedAnimationTrack 泛型，添加 USD 特有的路径和类型字段
 */
export interface UsdAnimationTrack extends Omit<UnifiedAnimationTrack<UsdKeyframe>, 'targetPath'> {
  /**
   * USD属性路径 (替代 targetPath)
   */
  usdPath: string;
  /**
   * USD属性类型
   */
  usdType: string;
  /**
   * 目标路径 (可选，与 usdPath 二选一)
   */
  targetPath?: string;
}
