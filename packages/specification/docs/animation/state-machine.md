# 动画状态机模块文档

动画状态机模块定义了Maxellabs中的状态驱动动画系统，支持复杂的状态转换逻辑和行为控制。

## 1. 概览与背景

状态机系统是Maxellabs动画控制的核心，它提供了基于状态的动画管理，支持条件转换、层级状态、行为驱动等功能。该系统设计灵感来源于Unity的Animator Controller和Unreal的Animation Blueprint。

## 2. API 签名与类型定义

### AnimationState

定义动画状态的基本结构。

```typescript
interface AnimationState {
  id: string;
  name: string;
  clip: string;
  speed: number;
  loop: boolean;
  weight: number;
  startTime?: number;
  endTime?: number;
  fadeInTime?: number;
  fadeOutTime?: number;
  behaviors?: AnimationStateBehavior[];
  transitions?: AnimationTransition[];
  active?: boolean;
  parameters?: Record<string, any>;
}
```

### AnimationStateBehavior

定义状态行为，在特定时机触发。

```typescript
interface AnimationStateBehavior {
  id: string;
  type: AnimationBehaviorType;
  parameters?: Record<string, any>;
  conditions?: AnimationCondition[];
  enabled?: boolean;
}
```

### AnimationBehaviorType

行为类型的枚举定义。

```typescript
enum AnimationBehaviorType {
  OnStateEnter = 'on-state-enter',
  OnStateExit = 'on-state-exit',
  OnStateUpdate = 'on-state-update',
  OnStateMachineEnter = 'on-state-machine-enter',
  OnStateMachineExit = 'on-state-machine-exit',
}
```

### AnimationTransition

定义状态之间的转换规则。

```typescript
interface AnimationTransition {
  id: string;
  from: string;
  to: string;
  conditions: AnimationCondition[];
  duration: number;
  hasExitTime: boolean;
  exitTime?: number;
  offset?: number;
  canTransitionToSelf?: boolean;
  interruptionSource?: InterruptionSource;
}
```

### InterruptionSource

中断源的枚举定义。

```typescript
enum InterruptionSource {
  None = 'none',
  CurrentState = 'current-state',
  NextState = 'next-state',
  CurrentStateThenNextState = 'current-state-then-next-state',
  NextStateThenCurrentState = 'next-state-then-current-state',
}
```

### AnimationStateMachine

状态机的顶层定义。

```typescript
interface AnimationStateMachine {
  name: string;
  states: AnimationState[];
  transitions: AnimationTransition[];
  defaultState: string;
  parameters: AnimationParameter[];
}
```

## 3. 参数与返回值详细说明

### AnimationState 属性

| 属性名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| id | string | 是 | - | 状态的唯一标识符 |
| name | string | 是 | - | 状态的显示名称 |
| clip | string | 是 | - | 关联的动画剪辑ID |
| speed | number | 是 | 1.0 | 播放速度倍率 |
| loop | boolean | 是 | true | 是否循环播放 |
| weight | number | 是 | 1.0 | 状态权重 [0, 1] |
| startTime | number | 否 | 0 | 动画开始时间（秒） |
| endTime | number | 否 | clip长度 | 动画结束时间（秒） |
| fadeInTime | number | 否 | 0.25 | 淡入时间（秒） |
| fadeOutTime | number | 否 | 0.25 | 淡出时间（秒） |
| behaviors | AnimationStateBehavior[] | 否 | [] | 状态行为列表 |
| transitions | AnimationTransition[] | 否 | [] | 状态转换列表 |
| active | boolean | 否 | false | 是否激活状态 |
| parameters | Record<string, any> | 否 | {} | 状态参数 |

### AnimationTransition 属性

| 属性名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| id | string | 是 | - | 转换的唯一标识符 |
| from | string | 是 | - | 源状态ID |
| to | string | 是 | - | 目标状态ID |
| conditions | AnimationCondition[] | 是 | [] | 转换条件列表 |
| duration | number | 是 | 0.25 | 转换持续时间（秒） |
| hasExitTime | boolean | 是 | false | 是否使用退出时间 |
| exitTime | number | 否 | - | 退出时间（秒） |
| offset | number | 否 | 0 | 目标状态偏移时间（秒） |
| canTransitionToSelf | boolean | 否 | false | 是否允许转换到自身 |
| interruptionSource | InterruptionSource | 否 | 'none' | 中断源策略 |

## 4. 使用场景与代码示例

### 基础角色状态机

```typescript
const characterStateMachine: AnimationStateMachine = {
  name: 'character_main',
  defaultState: 'idle',
  states: [
    {
      id: 'idle',
      name: 'Idle',
      clip: 'idle_animation',
      speed: 1.0,
      loop: true,
      weight: 1.0,
      behaviors: [
        {
          id: 'idle_sound',
          type: AnimationBehaviorType.OnStateEnter,
          parameters: { sound: 'footsteps_idle' },
        },
      ],
    },
    {
      id: 'walk',
      name: 'Walking',
      clip: 'walk_animation',
      speed: 1.0,
      loop: true,
      weight: 1.0,
      fadeInTime: 0.3,
      fadeOutTime: 0.2,
    },
    {
      id: 'run',
      name: 'Running',
      clip: 'run_animation',
      speed: 1.2,
      loop: true,
      weight: 1.0,
      fadeInTime: 0.2,
      fadeOutTime: 0.1,
    },
  ],
  transitions: [
    {
      id: 'idle_to_walk',
      from: 'idle',
      to: 'walk',
      conditions: [
        {
          id: 'speed_condition',
          parameter: 'moveSpeed',
          type: AnimationConditionType.Float,
          operator: ComparisonOperator.Greater,
          value: 0.1,
        },
      ],
      duration: 0.3,
      hasExitTime: false,
    },
    {
      id: 'walk_to_run',
      from: 'walk',
      to: 'run',
      conditions: [
        {
          id: 'speed_condition',
          parameter: 'moveSpeed',
          type: AnimationConditionType.Float,
          operator: ComparisonOperator.Greater,
          value: 3.0,
        },
      ],
      duration: 0.2,
      hasExitTime: false,
    },
  ],
  parameters: [
    { name: 'moveSpeed', type: 'float', defaultValue: 0 },
    { name: 'isGrounded', type: 'bool', defaultValue: true },
  ],
};
```

### 复杂战斗状态机

```typescript
const combatStateMachine: AnimationStateMachine = {
  name: 'combat_system',
  defaultState: 'combat_idle',
  states: [
    {
      id: 'combat_idle',
      name: 'Combat Idle',
      clip: 'combat_idle',
      speed: 1.0,
      loop: true,
      weight: 1.0,
      behaviors: [
        {
          id: 'weapon_sway',
          type: AnimationBehaviorType.OnStateUpdate,
          parameters: { intensity: 0.3 },
        },
      ],
    },
    {
      id: 'attack_light',
      name: 'Light Attack',
      clip: 'attack_light_combo',
      speed: 1.5,
      loop: false,
      weight: 1.0,
      fadeInTime: 0.1,
      fadeOutTime: 0.3,
      behaviors: [
        {
          id: 'attack_sound',
          type: AnimationBehaviorType.OnStateEnter,
          parameters: { sound: 'sword_swing' },
        },
        {
          id: 'damage_trigger',
          type: AnimationBehaviorType.OnStateUpdate,
          conditions: [
            {
              id: 'damage_frame',
              parameter: 'animationTime',
              type: AnimationConditionType.Float,
              operator: ComparisonOperator.Greater,
              value: 0.4,
            },
          ],
          parameters: { damage: 25, range: 2.0 },
        },
      ],
    },
    {
      id: 'dodge',
      name: 'Dodge Roll',
      clip: 'dodge_roll',
      speed: 1.2,
      loop: false,
      weight: 1.0,
      fadeInTime: 0.05,
      fadeOutTime: 0.1,
      behaviors: [
        {
          id: 'invulnerability',
          type: AnimationBehaviorType.OnStateEnter,
          parameters: { duration: 0.5 },
        },
      ],
    },
  ],
  transitions: [
    {
      id: 'idle_to_attack',
      from: 'combat_idle',
      to: 'attack_light',
      conditions: [
        {
          id: 'attack_input',
          parameter: 'attackPressed',
          type: AnimationConditionType.Trigger,
        },
      ],
      duration: 0.1,
      hasExitTime: false,
      interruptionSource: InterruptionSource.CurrentState,
    },
    {
      id: 'idle_to_dodge',
      from: 'combat_idle',
      to: 'dodge',
      conditions: [
        {
          id: 'dodge_input',
          parameter: 'dodgePressed',
          type: AnimationConditionType.Trigger,
        },
        {
          id: 'can_dodge',
          parameter: 'canDodge',
          type: AnimationConditionType.Boolean,
          operator: ComparisonOperator.Equal,
          value: true,
        },
      ],
      duration: 0.05,
      hasExitTime: false,
    },
    {
      id: 'attack_to_idle',
      from: 'attack_light',
      to: 'combat_idle',
      conditions: [],
      duration: 0.3,
      hasExitTime: true,
      exitTime: 0.9,
    },
  ],
  parameters: [
    { name: 'moveSpeed', type: 'float', defaultValue: 0 },
    { name: 'attackPressed', type: 'trigger' },
    { name: 'dodgePressed', type: 'trigger' },
    { name: 'canDodge', type: 'bool', defaultValue: true },
    { name: 'animationTime', type: 'float', defaultValue: 0 },
  ],
};
```

### 动态状态创建

```typescript
function createDynamicStateMachine(states: string[]): AnimationStateMachine {
  return {
    name: 'dynamic_machine',
    defaultState: states[0] || 'default',
    states: states.map((state, index) => ({
      id: state,
      name: state.charAt(0).toUpperCase() + state.slice(1),
      clip: `${state}_animation`,
      speed: 1.0,
      loop: true,
      weight: 1.0,
    })),
    transitions: states.slice(1).map((state, index) => ({
      id: `${states[index]}_to_${state}`,
      from: states[index],
      to: state,
      conditions: [
        {
          id: `transition_${index}`,
          parameter: `switchTo_${state}`,
          type: AnimationConditionType.Trigger,
        },
      ],
      duration: 0.2,
      hasExitTime: false,
    })),
    parameters: states.map(state => ({
      name: `switchTo_${state}`,
      type: 'trigger',
    })),
  };
}
```

## 5. 内部实现与算法剖析

### 状态机执行算法

```typescript
class StateMachineExecutor {
  private currentState: string;
  private currentTime: number;
  private isTransitioning: boolean;
  private transitionStartTime: number;
  private transitionFrom: string;
  private transitionTo: string;
  private transitionDuration: number;

  constructor(private stateMachine: AnimationStateMachine) {
    this.currentState = stateMachine.defaultState;
    this.currentTime = 0;
    this.isTransitioning = false;
  }

  update(deltaTime: number, parameters: Record<string, any>): void {
    this.currentTime += deltaTime;

    if (this.isTransitioning) {
      this.handleTransition(deltaTime);
    } else {
      this.evaluateTransitions(parameters);
    }

    this.updateCurrentState(deltaTime, parameters);
  }

  private evaluateTransitions(parameters: Record<string, any>): void {
    const currentState = this.stateMachine.states.find(s => s.id === this.currentState);
    if (!currentState) return;

    for (const transition of currentState.transitions || []) {
      if (this.shouldTriggerTransition(transition, parameters)) {
        this.startTransition(transition);
        break;
      }
    }
  }

  private shouldTriggerTransition(
    transition: AnimationTransition,
    parameters: Record<string, any>
  ): boolean {
    // 检查所有条件
    for (const condition of transition.conditions) {
      if (!this.evaluateCondition(condition, parameters)) {
        return false;
      }
    }
    return true;
  }

  private evaluateCondition(
    condition: AnimationCondition,
    parameters: Record<string, any>
  ): boolean {
    const value = parameters[condition.parameter];
    const expected = condition.value;

    switch (condition.operator) {
      case ComparisonOperator.Equal:
        return value === expected;
      case ComparisonOperator.NotEqual:
        return value !== expected;
      case ComparisonOperator.Greater:
        return value > expected;
      case ComparisonOperator.Less:
        return value < expected;
      case ComparisonOperator.GreaterEqual:
        return value >= expected;
      case ComparisonOperator.LessEqual:
        return value <= expected;
      default:
        return false;
    }
  }

  private startTransition(transition: AnimationTransition): void {
    this.isTransitioning = true;
    this.transitionStartTime = this.currentTime;
    this.transitionFrom = transition.from;
    this.transitionTo = transition.to;
    this.transitionDuration = transition.duration;
  }

  private handleTransition(deltaTime: number): void {
    const elapsed = this.currentTime - this.transitionStartTime;
    const progress = Math.min(elapsed / this.transitionDuration, 1.0);

    if (progress >= 1.0) {
      this.currentState = this.transitionTo;
      this.isTransitioning = false;
    }
  }

  private updateCurrentState(deltaTime: number, parameters: Record<string, any>): void {
    const state = this.stateMachine.states.find(s => s.id === this.currentState);
    if (!state) return;

    // 执行状态行为
    for (const behavior of state.behaviors || []) {
      if (this.shouldExecuteBehavior(behavior, parameters)) {
        this.executeBehavior(behavior, parameters);
      }
    }
  }

  private shouldExecuteBehavior(
    behavior: AnimationStateBehavior,
    parameters: Record<string, any>
  ): boolean {
    if (!behavior.enabled) return false;

    for (const condition of behavior.conditions || []) {
      if (!this.evaluateCondition(condition, parameters)) {
        return false;
      }
    }
    return true;
  }

  private executeBehavior(
    behavior: AnimationStateBehavior,
    parameters: Record<string, any>
  ): void {
    // 根据行为类型执行相应逻辑
    switch (behavior.type) {
      case AnimationBehaviorType.OnStateEnter:
        console.log(`Entering state: ${this.currentState}`);
        break;
      case AnimationBehaviorType.OnStateExit:
        console.log(`Exiting state: ${this.currentState}`);
        break;
      case AnimationBehaviorType.OnStateUpdate:
        // 每帧更新逻辑
        break;
    }
  }
}
```

### 状态权重计算

```typescript
function calculateStateWeights(
  stateMachine: AnimationStateMachine,
  currentState: string,
  transitionProgress: number
): Record<string, number> {
  const weights: Record<string, number> = {};

  for (const state of stateMachine.states) {
    weights[state.id] = 0;
  }

  const activeTransition = stateMachine.transitions.find(t => 
    t.from === currentState || t.to === currentState
  );

  if (activeTransition) {
    if (activeTransition.from === currentState) {
      weights[activeTransition.from] = 1 - transitionProgress;
      weights[activeTransition.to] = transitionProgress;
    } else {
      weights[activeTransition.to] = 1 - transitionProgress;
      weights[activeTransition.from] = transitionProgress;
    }
  } else {
    weights[currentState] = 1;
  }

  return weights;
}
```

## 6. 边界条件、错误码与异常处理

### 错误码定义

| 错误码 | 描述 | 触发条件 | 处理策略 |
|--------|------|----------|----------|
| INVALID_STATE | 无效状态 | 引用的状态不存在 | 回退到默认状态 |
| TRANSITION_LOOP | 转换循环 | 无限循环状态转换 | 限制转换深度 |
| PARAMETER_MISSING | 参数缺失 | 条件引用不存在的参数 | 使用默认值 |
| STATE_NOT_FOUND | 状态未找到 | 状态ID不存在 | 日志警告 |
| TRANSITION_FAILURE | 转换失败 | 所有转换条件不满足 | 保持当前状态 |
| INVALID_DURATION | 无效持续时间 | 负的转换时间 | 使用最小值0.1 |

### 异常处理示例

```typescript
class StateMachineError extends Error {
  constructor(code: string, message: string) {
    super(message);
    this.name = 'StateMachineError';
    this.message = `[${code}] ${message}`;
  }
}

function validateStateMachine(machine: AnimationStateMachine): ValidationResult {
  const errors: string[] = [];

  if (!machine.states || machine.states.length === 0) {
    errors.push('State machine must have at least one state');
  }

  if (!machine.defaultState) {
    errors.push('State machine must have a default state');
  }

  if (!machine.states.some(s => s.id === machine.defaultState)) {
    errors.push(`Default state "${machine.defaultState}" not found`);
  }

  for (const state of machine.states) {
    if (!state.clip) {
      errors.push(`State "${state.id}" must have a clip`);
    }
  }

  for (const transition of machine.transitions) {
    if (!machine.states.some(s => s.id === transition.from)) {
      errors.push(`Transition from "${transition.from}" references non-existent state`);
    }
    if (!machine.states.some(s => s.id === transition.to)) {
      errors.push(`Transition to "${transition.to}" references non-existent state`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

## 7. 变更记录与未来演进

### v2.5.0 (2024-08-01)

- 添加状态行为系统
- 支持动态参数绑定
- 优化状态切换性能25%

### v2.0.0 (2024-07-15)

- 重构状态机架构
- 添加中断源机制
- 支持层级状态机

### v1.8.0 (2024-06-20)

- 初始状态机实现
- 基础状态转换
- 简单条件系统

### 路线图

- **v3.0.0**: 支持子状态机嵌套
- **v3.1.0**: 添加动画混合树
- **v3.2.0**: 支持异步状态加载
- **v3.3.0**: 可视化状态机编辑器