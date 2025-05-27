/**
 * Maxellabs 动画状态机模块
 * 动画状态机、状态和转换的定义
 */

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
  Greater = 'greater',
  Less = 'less',
  Equals = 'equals',
  NotEquals = 'not-equals',
  Trigger = 'trigger',
}

/**
 * 中断源
 */
export enum InterruptionSource {
  None = 'none',
  Source = 'source',
  Destination = 'destination',
  SourceThenDestination = 'source-then-destination',
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
  Float = 'float',
  Int = 'int',
  Bool = 'bool',
  Trigger = 'trigger',
}

/**
 * 状态行为
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
