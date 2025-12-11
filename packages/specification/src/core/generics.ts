/**
 * Maxellabs 核心泛型基类定义
 * 为所有模块提供统一的泛型接口，减少类型重复
 */

import type { InterpolationMode, BlendMode } from './enums';
import type { Vector2Like } from './math';

// ============================================================================
// Keyframe 泛型基类
// ============================================================================

/**
 * 基础关键帧接口
 * 所有关键帧类型的泛型基类
 *
 * @template T 关键帧值的类型
 */
export interface BaseKeyframe<T = any> {
  /**
   * 关键帧时间点
   */
  time: number;
  /**
   * 关键帧值
   */
  value: T;
  /**
   * 缓动函数
   */
  easing?: string;
}

/**
 * 带切线的关键帧接口
 * 支持手动控制插值曲线的切线
 *
 * @template T 关键帧值的类型
 */
export interface TangentKeyframe<T = any> extends BaseKeyframe<T> {
  /**
   * 入切线
   */
  inTangent?: Vector2Like;
  /**
   * 出切线
   */
  outTangent?: Vector2Like;
}

/**
 * 带插值模式的关键帧接口
 * 支持指定插值方式
 *
 * @template T 关键帧值的类型
 */
export interface InterpolatedKeyframe<T = any> extends BaseKeyframe<T> {
  /**
   * 插值模式
   */
  interpolation?: InterpolationMode;
}

/**
 * 完整关键帧接口
 * 同时支持切线和插值模式
 *
 * @template T 关键帧值的类型
 */
export interface FullKeyframe<T = any> extends TangentKeyframe<T>, InterpolatedKeyframe<T> {}

// ============================================================================
// AnimationTrack 泛型基类
// ============================================================================

/**
 * 最小关键帧约束
 * 只要求有 time 属性，允许子类型使用不同的值属性名（如 value、transform 等）
 */
export interface MinimalKeyframe {
  time: number;
}

/**
 * 基础动画轨道接口
 * 所有动画轨道类型的泛型基类
 *
 * @template K 关键帧类型，只需满足最小关键帧约束
 */
export interface BaseAnimationTrack<K extends MinimalKeyframe = BaseKeyframe> {
  /**
   * 轨道名称
   */
  name: string;
  /**
   * 关键帧列表
   */
  keyframes: K[];
  /**
   * 是否启用
   */
  enabled?: boolean;
  /**
   * 权重
   */
  weight?: number;
}

/**
 * 带目标路径的动画轨道接口
 * 用于指定动画作用的目标属性
 *
 * @template K 关键帧类型
 */
export interface TargetedAnimationTrack<K extends MinimalKeyframe = BaseKeyframe> extends BaseAnimationTrack<K> {
  /**
   * 目标对象路径
   */
  targetPath?: string;
  /**
   * 属性名称
   */
  property: string;
}

/**
 * 带混合模式的动画轨道接口
 * 支持动画混合
 *
 * @template K 关键帧类型
 */
export interface BlendableAnimationTrack<K extends MinimalKeyframe = BaseKeyframe> extends TargetedAnimationTrack<K> {
  /**
   * 混合模式
   */
  blendMode?: BlendMode;
}

// ============================================================================
// State 泛型基类
// ============================================================================

/**
 * 基础状态接口
 * 所有状态类型的泛型基类
 */
export interface BaseState {
  /**
   * 状态ID
   */
  id: string;
  /**
   * 状态名称
   */
  name: string;
}

/**
 * 状态转换接口
 * 定义状态之间的转换规则
 */
export interface StateTransition {
  /**
   * 目标状态ID
   */
  targetStateId: string;
  /**
   * 转换条件
   */
  condition?: string;
  /**
   * 转换持续时间
   */
  duration?: number;
  /**
   * 转换缓动
   */
  easing?: string;
}

/**
 * 可转换状态接口
 * 支持状态转换的状态基类
 */
export interface TransitionableState extends BaseState {
  /**
   * 状态转换列表
   */
  transitions?: StateTransition[];
}

// ============================================================================
// Property 泛型基类
// ============================================================================

/**
 * 基础属性接口
 * 所有属性类型的泛型基类
 *
 * @template T 属性值的类型
 */
export interface BaseProperty<T = any> {
  /**
   * 属性名称
   */
  name: string;
  /**
   * 属性类型
   */
  type: string;
  /**
   * 属性值
   */
  value?: T;
  /**
   * 元数据
   */
  metadata?: Record<string, any>;
}

/**
 * 可动画属性接口
 * 支持属性动画
 *
 * @template T 属性值的类型
 */
export interface AnimatableProperty<T = any> extends BaseProperty<T> {
  /**
   * 是否可动画
   */
  animatable?: boolean;
  /**
   * 默认值
   */
  defaultValue?: T;
  /**
   * 最小值
   */
  min?: T;
  /**
   * 最大值
   */
  max?: T;
}

// ============================================================================
// Constraint 泛型基类
// ============================================================================

/**
 * 基础约束接口
 * 所有约束类型的泛型基类
 */
export interface BaseConstraint {
  /**
   * 约束类型
   */
  type: string;
  /**
   * 是否启用
   */
  enabled?: boolean;
  /**
   * 权重
   */
  weight?: number;
}

/**
 * 带目标的约束接口
 * 支持指定约束目标
 */
export interface TargetedConstraint extends BaseConstraint {
  /**
   * 目标对象路径
   */
  targetPath?: string;
  /**
   * 目标属性
   */
  targetProperty?: string;
}

// ============================================================================
// Texture 泛型基类
// ============================================================================

/**
 * 纹理变换接口
 * 定义纹理的 UV 变换
 */
export interface TextureTransform {
  /**
   * UV 缩放
   */
  scale?: Vector2Like;
  /**
   * UV 偏移
   */
  offset?: Vector2Like;
  /**
   * 旋转角度（弧度）
   */
  rotation?: number;
}

/**
 * 纹理采样器接口
 * 定义纹理采样参数
 */
export interface TextureSampler {
  /**
   * S 方向包装模式
   */
  wrapS?: string;
  /**
   * T 方向包装模式
   */
  wrapT?: string;
  /**
   * 缩小过滤器
   */
  minFilter?: string;
  /**
   * 放大过滤器
   */
  magFilter?: string;
}

/**
 * 基础纹理引用接口
 * 统一 CommonTextureRef 和 TextureReference
 */
export interface BaseTextureRef {
  /**
   * 纹理资源ID（统一 textureId 和 path）
   */
  assetId: string;
  /**
   * 纹理槽/用途
   */
  slot?: string;
  /**
   * UV 通道
   */
  uvChannel?: number;
  /**
   * UV 变换
   */
  transform?: TextureTransform;
  /**
   * 采样器配置
   */
  sampler?: TextureSampler;
  /**
   * 强度/影响度
   */
  intensity?: number;
}

// ============================================================================
// Controller 泛型基类
// ============================================================================

/**
 * 基础控制器接口
 * 所有控制器类型的泛型基类
 */
export interface BaseController {
  /**
   * 控制器ID
   */
  id?: string;
  /**
   * 控制器名称
   */
  name?: string;
  /**
   * 是否启用
   */
  enabled?: boolean;
}

/**
 * 播放控制器接口
 * 支持播放控制的控制器基类
 */
export interface PlayableController extends BaseController {
  /**
   * 播放状态
   */
  playState?: string;
  /**
   * 当前时间
   */
  currentTime?: number;
  /**
   * 播放速度
   */
  playbackSpeed?: number;
  /**
   * 权重
   */
  weight?: number;
}

// ============================================================================
// Mask 泛型基类
// ============================================================================

/**
 * 基础遮罩接口
 * 所有遮罩类型的泛型基类
 *
 * @template P 路径/标识符的类型
 */
export interface BaseMask<P = string> {
  /**
   * 遮罩名称
   */
  name?: string;
  /**
   * 包含的路径
   */
  includePaths?: P[];
  /**
   * 排除的路径
   */
  excludePaths?: P[];
  /**
   * 遮罩权重
   */
  weight?: number;
}

// ============================================================================
// Event 泛型基类
// ============================================================================

/**
 * 基础事件接口
 * 所有事件类型的泛型基类
 */
export interface BaseEvent {
  /**
   * 事件类型
   */
  type: string;
  /**
   * 事件名称
   */
  name?: string;
  /**
   * 事件参数
   */
  parameters?: Record<string, any>;
}

/**
 * 定时事件接口
 * 支持在特定时间触发的事件
 */
export interface TimedEvent extends BaseEvent {
  /**
   * 触发时间
   */
  time: number;
}

// ============================================================================
// 统一类型定义（用于消除模块间的重复定义）
// ============================================================================

/**
 * 统一关键帧接口
 * 合并了 AnimationKeyframe、UsdKeyframe、TransformKeyframe、MaterialKeyframe 的所有特性
 * 各模块应使用此类型或其别名
 *
 * @template T 关键帧值的类型
 */
export interface UnifiedKeyframe<T = any> extends BaseKeyframe<T> {
  /**
   * 插值模式
   */
  interpolation?: InterpolationMode;
  /**
   * 入切线 (用于曲线插值)
   */
  inTangent?: Vector2Like;
  /**
   * 出切线 (用于曲线插值)
   */
  outTangent?: Vector2Like;
  /**
   * 贝塞尔控制点（备选表达方式）
   */
  bezierControlPoints?: {
    inTangent: [number, number];
    outTangent: [number, number];
  };
}

/**
 * 统一动画轨道接口
 * 合并了 AnimationTrack、TransformAnimationTrack、MaterialAnimationTrack 的所有特性
 * 各模块应使用此类型或其特化版本
 *
 * @template K 关键帧类型，只需满足最小关键帧约束
 */
export interface UnifiedAnimationTrack<K extends MinimalKeyframe = UnifiedKeyframe> extends BlendableAnimationTrack<K> {
  /**
   * 目标路径 (覆盖父接口，设为必需)
   */
  targetPath: string;
  /**
   * 属性名称 (覆盖父接口)
   */
  property: string;
  /**
   * 数据类型标识
   */
  dataType?: string;
}

// ============================================================================
// 类型别名（用于简化常见用法）
// ============================================================================

/**
 * 数值关键帧
 */
export type NumberKeyframe = UnifiedKeyframe<number>;

/**
 * 向量关键帧
 */
export type VectorKeyframe = UnifiedKeyframe<Vector2Like>;

/**
 * 任意值关键帧
 */
export type AnyKeyframe = UnifiedKeyframe<any>;
