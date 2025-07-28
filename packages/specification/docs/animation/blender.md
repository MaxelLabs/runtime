# 动画混合器模块文档

动画混合器模块定义了Maxellabs中的动画混合系统，支持多种动画的同时播放和混合。

## 1. 概览与背景

动画混合器是Maxellabs动画系统的核心组件，负责管理多个动画剪辑的混合和过渡。该模块提供了灵活的动画混合机制，支持权重混合、时间偏移和混合模式控制。

## 2. API 签名与类型定义

### AnimationBlender

```typescript
interface AnimationBlender extends Omit<AnimationMixer, 'layers'> {
  type: BlendMode;
  inputs: AnimationBlendInput[];
  weights: number[];
}
```

### AnimationBlendInput

```typescript
interface AnimationBlendInput {
  clip: string;
  weight: number;
  timeOffset: number;
}
```

## 3. 参数与返回值详细说明

### AnimationBlender 属性

| 属性名  | 类型                  | 必填 | 默认值 | 描述                                           |
| ------- | --------------------- | ---- | ------ | ---------------------------------------------- |
| type    | BlendMode             | 是   | -      | 混合类型（Normal, Additive, Multiply, Screen） |
| inputs  | AnimationBlendInput[] | 是   | []     | 输入动画列表                                   |
| weights | number[]              | 是   | []     | 每个输入的混合权重，总和应为1.0                |

### AnimationBlendInput 属性

| 属性名     | 类型   | 必填 | 默认值 | 描述                           |
| ---------- | ------ | ---- | ------ | ------------------------------ |
| clip       | string | 是   | -      | 动画剪辑的引用标识符           |
| weight     | number | 是   | 1.0    | 该剪辑的混合权重 [0, 1]        |
| timeOffset | number | 是   | 0.0    | 时间偏移量（秒），用于错开动画 |

## 4. 使用场景与代码示例

### 基础动画混合

```typescript
const walkRunBlend: AnimationBlender = {
  type: BlendMode.Normal,
  inputs: [
    {
      clip: 'walk_animation',
      weight: 0.7,
      timeOffset: 0.0,
    },
    {
      clip: 'run_animation',
      weight: 0.3,
      timeOffset: 0.0,
    },
  ],
  weights: [0.7, 0.3],
};
```

### 复杂混合场景

```typescript
const complexBlend: AnimationBlender = {
  type: BlendMode.Additive,
  inputs: [
    {
      clip: 'base_idle',
      weight: 0.6,
      timeOffset: 0.0,
    },
    {
      clip: 'wave_arm',
      weight: 0.4,
      timeOffset: 0.5, // 延迟0.5秒开始
    },
    {
      clip: 'head_turn',
      weight: 0.2,
      timeOffset: 0.2, // 延迟0.2秒开始
    },
  ],
  weights: [0.6, 0.4, 0.2],
};
```

### 动态权重调整

```typescript
function createDynamicBlend(speed: number): AnimationBlender {
  const walkWeight = Math.max(0, 1 - speed);
  const runWeight = Math.min(1, speed);

  return {
    type: BlendMode.Normal,
    inputs: [
      {
        clip: 'walk',
        weight: walkWeight,
        timeOffset: 0,
      },
      {
        clip: 'run',
        weight: runWeight,
        timeOffset: 0,
      },
    ],
    weights: [walkWeight, runWeight],
  };
}
```

## 5. 内部实现与算法剖析

### 权重归一化算法

```typescript
function normalizeWeights(weights: number[]): number[] {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total === 0) return weights.map(() => 1 / weights.length);
  return weights.map((w) => w / total);
}

// 使用示例
const normalized = normalizeWeights([0.5, 0.3, 0.2]);
// 结果: [0.5, 0.3, 0.2] (已归一化)
```

### 混合计算流程

1. **输入验证**：检查输入动画是否存在
2. **权重处理**：归一化权重值
3. **时间同步**：根据timeOffset调整时间线
4. **混合计算**：基于BlendMode执行混合
5. **结果输出**：生成最终的混合动画

### 混合模式实现

```typescript
function applyBlendMode(values: number[][], weights: number[], mode: BlendMode): number[] {
  switch (mode) {
    case BlendMode.Normal:
      return values.reduce((result, value, index) => value.map((v, i) => (result[i] || 0) + v * weights[index]), []);

    case BlendMode.Additive:
      return values.reduce((result, value, index) => value.map((v, i) => (result[i] || 0) + v * weights[index]), []);

    case BlendMode.Multiply:
      return values.reduce(
        (result, value, index) => value.map((v, i) => (result[i] || 1) * Math.pow(v, weights[index])),
        []
      );

    default:
      throw new Error(`Unsupported blend mode: ${mode}`);
  }
}
```

## 6. 边界条件、错误码与异常处理

### 错误码定义

| 错误码               | 描述           | 场景                       | 解决方案               |
| -------------------- | -------------- | -------------------------- | ---------------------- |
| INVALID_WEIGHTS      | 权重无效       | 权重总和为0或负数          | 使用默认权重1/n        |
| MISSING_CLIP         | 动画剪辑不存在 | 引用的clip未找到           | 检查clip名称拼写       |
| WEIGHT_MISMATCH      | 权重数量不匹配 | weights和inputs长度不一致  | 自动补全或截断         |
| TIME_OFFSET_OVERFLOW | 时间偏移溢出   | timeOffset导致动画超出范围 | 限制在0-duration范围内 |

### 异常处理示例

```typescript
class AnimationBlenderError extends Error {
  constructor(code: string, message: string) {
    super(message);
    this.name = 'AnimationBlenderError';
    this.message = `[${code}] ${message}`;
  }
}

function validateBlender(blender: AnimationBlender): void {
  if (!blender.inputs || blender.inputs.length === 0) {
    throw new AnimationBlenderError('NO_INPUTS', 'Animation blender must have at least one input');
  }

  if (blender.weights.length !== blender.inputs.length) {
    throw new AnimationBlenderError(
      'WEIGHT_MISMATCH',
      `Weights count (${blender.weights.length}) must match inputs count (${blender.inputs.length})`
    );
  }

  const totalWeight = blender.weights.reduce((sum, w) => sum + w, 0);
  if (Math.abs(totalWeight - 1.0) > 0.001) {
    console.warn(`Weights sum to ${totalWeight}, normalizing to 1.0`);
    blender.weights = normalizeWeights(blender.weights);
  }
}
```

## 7. 变更记录与未来演进

### v2.1.0 (2024-07-15)

- 新增Additive混合模式支持
- 优化权重归一化算法
- 添加时间偏移功能

### v2.0.0 (2024-06-10)

- 重构混合器架构
- 支持无限输入数量
- 添加权重验证机制

### v1.5.0 (2024-05-20)

- 新增Multiply和Screen混合模式
- 支持动态权重调整
- 优化性能20%

### v1.0.0 (2024-04-01)

- 初始版本发布
- 支持基础Normal混合
- 最多支持4个输入

### 未来规划

- 支持GPU加速混合计算
- 添加3D动画空间混合
- 支持音频同步混合
- 实时权重插值系统
