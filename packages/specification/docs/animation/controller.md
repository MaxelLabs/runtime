# 动画控制器模块文档

动画控制器模块定义状态机驱动的动画控制系统，支持层级混合与骨骼遮罩。

## 1. 概览与背景

ExtendedAnimationController 扩展通用动画控制器，集成状态机、骨骼遮罩与层级混合。核心解决复杂角色动画的状态切换、局部动画覆盖与性能优化问题。

## 2. API 签名与类型定义

### ExtendedAnimationController

```typescript
interface ExtendedAnimationController extends AnimationController {
  name: string;
  stateMachine?: AnimationStateMachine;
  currentState?: string;
}
```

### StateMachineAnimationLayer

```typescript
interface StateMachineAnimationLayer extends AnimationMixerLayer {
  stateMachine?: AnimationStateMachine;
}
```

### BoneAnimationMask

```typescript
interface BoneAnimationMask extends AnimationMask {
  includedBones: string[];
  excludedBones: string[];
}
```

## 3. 参数与返回值详细说明

| 参数名        | 类型                  | 约束                       | 描述           | 示例              |
| ------------- | --------------------- | -------------------------- | -------------- | ----------------- |
| name          | string                | /^[a-zA-Z][a-zA-Z0-9_]\*$/ | 控制器唯一标识 | "character_main"  |
| stateMachine  | AnimationStateMachine | 可选                       | 状态机实例     | 见状态机文档      |
| currentState  | string                | 必须匹配状态机状态         | 当前激活状态   | "idle"            |
| includedBones | string[]              | 与excludedBones互斥        | 包含骨骼列表   | ["spine", "head"] |
| excludedBones | string[]              | 与includedBones互斥        | 排除骨骼列表   | ["weapon_r"]      |

## 4. 使用场景与代码示例

### 角色主控制器

```typescript
const characterController: ExtendedAnimationController = {
  name: 'hero_controller',
  stateMachine: createHeroStateMachine(),
  currentState: 'idle',
  layers: [
    {
      name: 'base_layer',
      weight: 1.0,
      blendMode: 'override',
      mask: { includedBones: ['*'] },
    },
  ],
};
```

### 骨骼遮罩配置

```typescript
const upperBodyMask: BoneAnimationMask = {
  includedBones: ['spine', 'chest', 'head', 'shoulder_l', 'shoulder_r'],
  excludedBones: ['weapon_l', 'weapon_r'],
};
```

### 动态状态切换

```typescript
function switchToAttack(controller: ExtendedAnimationController) {
  if (controller.currentState === 'idle') {
    controller.currentState = 'attack_combo';
    controller.layers[0].weight = 0.8;
    controller.layers[1].weight = 0.2;
  }
}
```

## 5. 内部实现与算法剖析

### 状态机执行算法

```typescript
class StateMachineExecutor {
  private currentTime = 0;

  executeStateTransition(fromState: string, toState: string, transitionDuration: number): void {
    const startTime = this.currentTime;
    const endTime = startTime + transitionDuration;

    // 线性插值过渡
    const blendFactor = (this.currentTime - startTime) / transitionDuration;
    const easedFactor = this.easeInOutCubic(blendFactor);

    // 应用混合权重
    this.applyLayerWeights(easedFactor);
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
```

### 骨骼遮罩筛选算法

```typescript
function filterBonesByMask(allBones: string[], mask: BoneAnimationMask): string[] {
  const included = new Set(mask.includedBones);
  const excluded = new Set(mask.excludedBones);

  return allBones.filter((bone) => {
    const isIncluded = included.has(bone) || included.has('*');
    const isExcluded = excluded.has(bone);
    return isIncluded && !isExcluded;
  });
}
```

## 6. 边界条件、错误码与异常处理

| 错误码         | 触发条件                         | 处理策略       | 日志级别 |
| -------------- | -------------------------------- | -------------- | -------- |
| INVALID_STATE  | currentState不在状态机中         | 回退到默认状态 | ERROR    |
| MASK_CONFLICT  | includedBones与excludedBones冲突 | 优先排除规则   | WARN     |
| LAYER_OVERFLOW | 层级权重总和>1.0                 | 自动归一化     | WARN     |
| BONE_NOT_FOUND | 遮罩引用不存在的骨骼             | 静默忽略       | DEBUG    |

## 7. 变更记录与未来演进

### v2.2.0 (2024-07-20)

- 添加骨骼遮罩实时更新
- 优化状态切换性能35%

### v2.0.0 (2024-06-15)

- 集成状态机系统
- 支持层级混合

### v1.5.0 (2024-05-10)

- 初始控制器架构
- 基础遮罩支持

### 路线图

- 支持异步状态加载
- 添加动画压缩传输
- GPU蒙皮计算优化
