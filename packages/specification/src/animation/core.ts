/**
 * Maxellabs 动画核心模块
 * 基于 USD 的动画基础类型和接口定义
 */

import type { UsdPrim, UsdValue } from '../core/usd';
import type { InterpolationMode } from '../core/enums';
import type { CommonMetadata } from '../core/interfaces';

/**
 * 动画基础接口
 */
export interface AnimationPrim extends UsdPrim {
  typeName: 'Animation';
}

/**
 * 动画剪辑
 */
export interface AnimationClip extends AnimationPrim {
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
     * 循环模式
     */
    loopMode: UsdValue; // LoopMode
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
   * 动画事件
   */
  events?: AnimationEvent[];
  /**
   * 元数据
   */
  metadata?: CommonMetadata;
}

/**
 * 动画轨道
 */
export interface AnimationTrack {
  /**
   * 轨道名称
   */
  name: string;
  /**
   * 目标路径
   */
  targetPath: string;
  /**
   * 属性名称
   */
  propertyName: string;
  /**
   * 轨道类型
   */
  type: AnimationTrackType;
  /**
   * 关键帧
   */
  keyframes: Keyframe[];
  /**
   * 插值模式
   */
  interpolation: InterpolationMode;
  /**
   * 是否启用
   */
  enabled: boolean;
}

/**
 * 动画轨道类型
 */
export enum AnimationTrackType {
  Position = 'position',
  Rotation = 'rotation',
  Scale = 'scale',
  Color = 'color',
  Opacity = 'opacity',
  Custom = 'custom',
}

/**
 * 关键帧
 */
export interface Keyframe {
  /**
   * 时间（秒）
   */
  time: number;
  /**
   * 值
   */
  value: any;
  /**
   * 输入切线
   */
  inTangent?: Tangent;
  /**
   * 输出切线
   */
  outTangent?: Tangent;
  /**
   * 插值模式
   */
  interpolation?: InterpolationMode;
}

/**
 * 切线
 */
export interface Tangent {
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
 * 动画事件
 */
export interface AnimationEvent {
  /**
   * 事件名称
   */
  name: string;
  /**
   * 触发时间
   */
  time: number;
  /**
   * 事件参数
   */
  parameters?: Record<string, any>;
  /**
   * 事件回调
   */
  callback?: string;
}
