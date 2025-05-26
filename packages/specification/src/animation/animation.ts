/**
 * Maxellabs 动画核心规范
 * 动画系统的基础类型和接口定义
 */

import type { UsdPrim, UsdValue } from '../core/usd';

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
}

/**
 * 循环模式
 */
export enum LoopMode {
  /**
   * 不循环
   */
  None = 'none',
  /**
   * 循环
   */
  Loop = 'loop',
  /**
   * 乒乓循环
   */
  PingPong = 'pingpong',
  /**
   * 钳制
   */
  Clamp = 'clamp',
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
  /**
   * 位置
   */
  Position = 'position',
  /**
   * 旋转
   */
  Rotation = 'rotation',
  /**
   * 缩放
   */
  Scale = 'scale',
  /**
   * 颜色
   */
  Color = 'color',
  /**
   * 透明度
   */
  Opacity = 'opacity',
  /**
   * 自定义
   */
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
 * 插值模式
 */
export enum InterpolationMode {
  /**
   * 线性插值
   */
  Linear = 'linear',
  /**
   * 阶梯插值
   */
  Step = 'step',
  /**
   * 贝塞尔插值
   */
  Bezier = 'bezier',
  /**
   * 样条插值
   */
  Spline = 'spline',
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

/**
 * 动画状态机
 */
export interface AnimationStateMachine {
  /**
   * 状态机名称
   */
  name: string;
  /**
   * 状态列表
   */
  states: AnimationState[];
  /**
   * 转换列表
   */
  transitions: AnimationTransition[];
  /**
   * 默认状态
   */
  defaultState: string;
  /**
   * 参数列表
   */
  parameters: AnimationParameter[];
}

/**
 * 动画状态
 */
export interface AnimationState {
  /**
   * 状态名称
   */
  name: string;
  /**
   * 动画剪辑
   */
  clip?: string;
  /**
   * 播放速度
   */
  speed: number;
  /**
   * 循环
   */
  loop: boolean;
  /**
   * 状态行为
   */
  behaviors?: AnimationStateBehavior[];
}

/**
 * 动画转换
 */
export interface AnimationTransition {
  /**
   * 源状态
   */
  fromState: string;
  /**
   * 目标状态
   */
  toState: string;
  /**
   * 转换条件
   */
  conditions: AnimationCondition[];
  /**
   * 转换时间
   */
  duration: number;
  /**
   * 偏移时间
   */
  offset: number;
  /**
   * 中断源
   */
  interruptionSource: InterruptionSource;
}

/**
 * 动画条件
 */
export interface AnimationCondition {
  /**
   * 参数名称
   */
  parameter: string;
  /**
   * 条件类型
   */
  type: ConditionType;
  /**
   * 阈值
   */
  threshold?: number;
}

/**
 * 条件类型
 */
export enum ConditionType {
  /**
   * 大于
   */
  Greater = 'greater',
  /**
   * 小于
   */
  Less = 'less',
  /**
   * 等于
   */
  Equals = 'equals',
  /**
   * 不等于
   */
  NotEquals = 'not-equals',
  /**
   * 触发器
   */
  Trigger = 'trigger',
}

/**
 * 中断源
 */
export enum InterruptionSource {
  /**
   * 无
   */
  None = 'none',
  /**
   * 源
   */
  Source = 'source',
  /**
   * 目标
   */
  Destination = 'destination',
  /**
   * 源和目标
   */
  SourceThenDestination = 'source-then-destination',
  /**
   * 目标然后源
   */
  DestinationThenSource = 'destination-then-source',
}

/**
 * 动画参数
 */
export interface AnimationParameter {
  /**
   * 参数名称
   */
  name: string;
  /**
   * 参数类型
   */
  type: ParameterType;
  /**
   * 默认值
   */
  defaultValue: any;
}

/**
 * 参数类型
 */
export enum ParameterType {
  /**
   * 浮点数
   */
  Float = 'float',
  /**
   * 整数
   */
  Int = 'int',
  /**
   * 布尔值
   */
  Bool = 'bool',
  /**
   * 触发器
   */
  Trigger = 'trigger',
}

/**
 * 动画状态行为
 */
export interface AnimationStateBehavior {
  /**
   * 行为类型
   */
  type: string;
  /**
   * 行为参数
   */
  parameters: Record<string, any>;
}

/**
 * 动画混合器
 */
export interface AnimationBlender {
  /**
   * 混合器名称
   */
  name: string;
  /**
   * 混合类型
   */
  type: BlendType;
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
 * 混合类型
 */
export enum BlendType {
  /**
   * 线性混合
   */
  Linear = 'linear',
  /**
   * 加法混合
   */
  Additive = 'additive',
  /**
   * 覆盖混合
   */
  Override = 'override',
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
   * 混合器
   */
  blenders: AnimationBlender[];
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
  blendMode: BlendType;
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
