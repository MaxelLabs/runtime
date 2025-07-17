/**
 * Maxellabs 动画模块统一导出
 * Animation层作为动画相关定义的权威来源
 */

//---------------------------------------------------------------------------------------------------------------------
// 核心动画定义 - 权威来源
//---------------------------------------------------------------------------------------------------------------------

/**
 * 动画状态统一定义（权威来源）
 * 解决4处重复：common/animation.ts, animation/stateMachine.ts, common/sprite.ts, animation/controller.ts
 */
export interface AnimationState {
  /**
   * 状态ID
   */
  id: string;
  /**
   * 状态名称
   */
  name: string;
  /**
   * 动画剪辑
   */
  clip: string;
  /**
   * 播放速度
   */
  speed: number;
  /**
   * 是否循环
   */
  loop: boolean;
  /**
   * 权重
   */
  weight: number;
  /**
   * 开始时间
   */
  startTime?: number;
  /**
   * 结束时间
   */
  endTime?: number;
  /**
   * 淡入时间
   */
  fadeInTime?: number;
  /**
   * 淡出时间
   */
  fadeOutTime?: number;
  /**
   * 状态行为
   */
  behaviors?: AnimationStateBehavior[];
  /**
   * 状态转换
   */
  transitions?: AnimationTransition[];
  /**
   * 是否激活
   */
  active?: boolean;
  /**
   * 状态参数
   */
  parameters?: Record<string, any>;
}

/**
 * 动画状态行为统一定义
 */
export interface AnimationStateBehavior {
  /**
   * 行为ID
   */
  id: string;
  /**
   * 行为类型
   */
  type: AnimationBehaviorType;
  /**
   * 行为参数
   */
  parameters?: Record<string, any>;
  /**
   * 触发条件
   */
  conditions?: AnimationCondition[];
  /**
   * 是否启用
   */
  enabled?: boolean;
}

/**
 * 动画行为类型
 */
export enum AnimationBehaviorType {
  /** 进入状态时触发 */
  OnStateEnter = 'on-state-enter',
  /** 离开状态时触发 */
  OnStateExit = 'on-state-exit',
  /** 状态更新时触发 */
  OnStateUpdate = 'on-state-update',
  /** 状态机更新时触发 */
  OnStateMachineEnter = 'on-state-machine-enter',
  /** 状态机退出时触发 */
  OnStateMachineExit = 'on-state-machine-exit',
}

/**
 * 动画转换统一定义
 */
export interface AnimationTransition {
  /**
   * 转换ID
   */
  id: string;
  /**
   * 源状态
   */
  from: string;
  /**
   * 目标状态
   */
  to: string;
  /**
   * 转换条件
   */
  conditions: AnimationCondition[];
  /**
   * 转换持续时间
   */
  duration: number;
  /**
   * 是否有退出时间
   */
  hasExitTime: boolean;
  /**
   * 退出时间
   */
  exitTime?: number;
  /**
   * 转换偏移
   */
  offset?: number;
  /**
   * 是否可中断
   */
  canTransitionToSelf?: boolean;
  /**
   * 中断源
   */
  interruptionSource?: InterruptionSource;
}

/**
 * 动画条件统一定义
 */
export interface AnimationCondition {
  /**
   * 条件ID
   */
  id: string;
  /**
   * 参数名称
   */
  parameter: string;
  /**
   * 条件类型
   */
  type: AnimationConditionType;
  /**
   * 条件值
   */
  value?: any;
  /**
   * 比较运算符
   */
  operator?: ComparisonOperator;
}

/**
 * 动画条件类型
 */
export enum AnimationConditionType {
  /** 布尔值 */
  Boolean = 'boolean',
  /** 整数 */
  Integer = 'integer',
  /** 浮点数 */
  Float = 'float',
  /** 触发器 */
  Trigger = 'trigger',
}

/**
 * 比较运算符
 */
export enum ComparisonOperator {
  /** 等于 */
  Equal = 'equal',
  /** 不等于 */
  NotEqual = 'not-equal',
  /** 大于 */
  Greater = 'greater',
  /** 小于 */
  Less = 'less',
  /** 大于等于 */
  GreaterEqual = 'greater-equal',
  /** 小于等于 */
  LessEqual = 'less-equal',
}

/**
 * 中断源
 */
export enum InterruptionSource {
  /** 无中断 */
  None = 'none',
  /** 当前状态 */
  CurrentState = 'current-state',
  /** 下一个状态 */
  NextState = 'next-state',
  /** 当前状态然后下一个状态 */
  CurrentStateThenNextState = 'current-state-then-next-state',
  /** 下一个状态然后当前状态 */
  NextStateThenCurrentState = 'next-state-then-current-state',
}

//---------------------------------------------------------------------------------------------------------------------
// 重新导出其他动画模块
//---------------------------------------------------------------------------------------------------------------------

export * from './core';
export * from './stateMachine';
export * from './controller';
export * from './blender';
export * from './curve';
export * from './easing';
export * from './particle';
export * from './particlePhysics';
export * from './timeline';
