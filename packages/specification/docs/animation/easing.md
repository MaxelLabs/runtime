# 动画缓动模块文档

动画缓动模块定义了Maxellabs中的扩展缓动函数系统，提供丰富的时间-数值变换函数，用于实现自然的动画效果。

## 1. 概览与背景

缓动函数系统为动画提供非线性的时间变换，使动画看起来更加自然和真实。该模块扩展了标准缓动函数，提供了更精细的控制选项，包括多种缓动类型、贝塞尔曲线支持和自定义变换函数。

## 2. API 签名与类型定义

### ExtendedEasingType

扩展的缓动类型枚举，包含标准缓动和高级缓动函数。

```typescript
enum ExtendedEasingType {
  // 基础缓动
  Linear = 'linear',
  EaseIn = 'ease-in',
  EaseOut = 'ease-out',
  EaseInOut = 'ease-in-out',
  CubicBezier = 'cubic-bezier',
  
  // Quad 系列
  QuadIn = 'quad-in',
  QuadOut = 'quad-out',
  QuadInOut = 'quad-in-out',
  
  // Cubic 系列
  CubicIn = 'cubic-in',
  CubicOut = 'cubic-out',
  CubicInOut = 'cubic-in-out',
  
  // Quart 系列
  QuartIn = 'quart-in',
  QuartOut = 'quart-out',
  QuartInOut = 'quart-in-out',
  
  // Quint 系列
  QuintIn = 'quint-in',
  QuintOut = 'quint-out',
  QuintInOut = 'quint-in-out',
  
  // Sine 系列
  SineIn = 'sine-in',
  SineOut = 'sine-out',
  SineInOut = 'sine-in-out',
  
  // Expo 系列
  ExpoIn = 'expo-in',
  ExpoOut = 'expo-out',
  ExpoInOut = 'expo-in-out',
  
  // Circ 系列
  CircIn = 'circ-in',
  CircOut = 'circ-out',
  CircInOut = 'circ-in-out',
  
  // Back 系列
  BackIn = 'back-in',
  BackOut = 'back-out',
  BackInOut = 'back-in-out',
  
  // Elastic 系列
  ElasticIn = 'elastic-in',
  ElasticOut = 'elastic-out',
  ElasticInOut = 'elastic-in-out',
  
  // Bounce 系列
  BounceIn = 'bounce-in',
  BounceOut = 'bounce-out',
  BounceInOut = 'bounce-in-out',
}
```

### AnimationTransformFunction

动画变换函数接口，用于自定义缓动行为。

```typescript
interface AnimationTransformFunction {
  type: string;
  parameters: number[];
  interpolation?: ExtendedEasingType;
  keyframes?: number[];
}
```

## 3. 参数与返回值详细说明

### ExtendedEasingType 值说明

| 缓动类型 | 数学公式 | 效果描述 | 适用场景 |
|----------|----------|----------|----------|
| Linear | t | 线性变化 | 机械运动 |
| QuadIn | t² | 二次方加速 | 开始缓慢 |
| QuadOut | 1-(1-t)² | 二次方减速 | 结束缓慢 |
| CubicIn | t³ | 三次方加速 | 更自然的开始 |
| CubicOut | 1-(1-t)³ | 三次方减速 | 更自然的结束 |
| SineIn | 1-cos(tπ/2) | 正弦加速 | 平滑开始 |
| SineOut | sin(tπ/2) | 正弦减速 | 平滑结束 |
| ExpoIn | 2^(10(t-1)) | 指数加速 | 突然开始 |
| ExpoOut | 1-2^(-10t) | 指数减速 | 突然结束 |
| BackIn | t²(2.7t-1.7) | 回弹加速 | 有弹性 |
| BackOut | 1+(t-1)²(2.7(t-1)+1.7) | 回弹减速 | 有弹性 |
| ElasticIn | 2^(10(t-1))sin(13πt/2) | 弹性加速 | 振动效果 |
| ElasticOut | 1+2^(-10t)sin(13π(t+1)/2) | 弹性减速 | 振动效果 |
| BounceIn | 1-Bounce(1-t) | 弹跳加速 | 弹跳开始 |
| BounceOut | Bounce(t) | 弹跳减速 | 弹跳结束 |

### AnimationTransformFunction 属性

| 属性名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| type | string | 是 | - | 变换类型标识 |
| parameters | number[] | 是 | [] | 变换参数列表 |
| interpolation | ExtendedEasingType | 否 | 'linear' | 插值缓动类型 |
| keyframes | number[] | 否 | [] | 关键帧时间点 |

## 4. 使用场景与代码示例

### 基础缓动使用

```typescript
// 简单的缓入效果
const easeInAnimation = {
  duration: 1000,
  easing: ExtendedEasingType.QuadIn,
  from: 0,
  to: 100,
};

// 复杂的缓出弹性效果
const elasticOutAnimation = {
  duration: 2000,
  easing: ExtendedEasingType.ElasticOut,
  from: 0,
  to: 360,
};
```

### 自定义变换函数

```typescript
const customTransform: AnimationTransformFunction = {
  type: 'spring',
  parameters: [0.5, 0.8, 1.2], // [damping, stiffness, mass]
  interpolation: ExtendedEasingType.BounceOut,
  keyframes: [0, 0.3, 0.7, 1.0],
};
```

### 缓动函数应用

```typescript
// 位置动画
const positionAnimation = {
  x: {
    keys: [
      { time: 0, value: 0, interpolation: ExtendedEasingType.CubicOut },
      { time: 1, value: 100, interpolation: ExtendedEasingType.CubicOut },
    ],
  },
  y: {
    keys: [
      { time: 0, value: 0, interpolation: ExtendedEasingType.BounceOut },
      { time: 1, value: 50, interpolation: ExtendedEasingType.BounceOut },
    ],
  },
};

// 缩放动画
const scaleAnimation = {
  keys: [
    { time: 0, value: 1, interpolation: ExtendedEasingType.BackOut },
    { time: 0.5, value: 1.2, interpolation: ExtendedEasingType.BackOut },
    { time: 1, value: 1, interpolation: ExtendedEasingType.BackOut },
  ],
};
```

### 组合缓动效果

```typescript
function createComplexEasing(
  duration: number,
  delay: number = 0
): AnimationTransformFunction {
  return {
    type: 'sequence',
    parameters: [delay, duration],
    interpolation: ExtendedEasingType.ElasticInOut,
    keyframes: [0, delay / (duration + delay), 1],
  };
}

const complexEasing = createComplexEasing(1000, 200);
```

### 缓动函数映射

```typescript
const easingMap: Record<ExtendedEasingType, (t: number) => number> = {
  [ExtendedEasingType.Linear]: (t) => t,
  [ExtendedEasingType.QuadIn]: (t) => t * t,
  [ExtendedEasingType.QuadOut]: (t) => 1 - (1 - t) * (1 - t),
  [ExtendedEasingType.QuadInOut]: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  [ExtendedEasingType.CubicIn]: (t) => t * t * t,
  [ExtendedEasingType.CubicOut]: (t) => 1 - Math.pow(1 - t, 3),
  [ExtendedEasingType.CubicInOut]: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  [ExtendedEasingType.SineIn]: (t) => 1 - Math.cos((t * Math.PI) / 2),
  [ExtendedEasingType.SineOut]: (t) => Math.sin((t * Math.PI) / 2),
  [ExtendedEasingType.SineInOut]: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  [ExtendedEasingType.ExpoIn]: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  [ExtendedEasingType.ExpoOut]: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  [ExtendedEasingType.ExpoInOut]: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5 
      ? Math.pow(2, 20 * t - 10) / 2 
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  [ExtendedEasingType.BackIn]: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  [ExtendedEasingType.BackOut]: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  [ExtendedEasingType.BackInOut]: (t) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  [ExtendedEasingType.ElasticIn]: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  [ExtendedEasingType.ElasticOut]: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  [ExtendedEasingType.ElasticInOut]: (t) => {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },
  [ExtendedEasingType.BounceOut]: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  [ExtendedEasingType.BounceIn]: (t) => 1 - easingMap[ExtendedEasingType.BounceOut](1 - t),
  [ExtendedEasingType.BounceInOut]: (t) => t < 0.5
    ? (1 - easingMap[ExtendedEasingType.BounceOut](1 - 2 * t)) / 2
    : (1 + easingMap[ExtendedEasingType.BounceOut](2 * t - 1)) / 2,
};
```

## 5. 内部实现与算法剖析

### 缓动函数执行器

```typescript
class EasingFunctionExecutor {
  private currentTime: number;
  private duration: number;
  private easingType: ExtendedEasingType;

  constructor(duration: number, easingType: ExtendedEasingType) {
    this.duration = duration;
    this.easingType = easingType;
    this.currentTime = 0;
  }

  update(deltaTime: number): number {
    this.currentTime = Math.min(this.currentTime + deltaTime, this.duration);
    const progress = this.currentTime / this.duration;
    return this.applyEasing(progress);
  }

  private applyEasing(t: number): number {
    const easingFunction = easingMap[this.easingType];
    return easingFunction ? easingFunction(t) : t;
  }

  reset(): void {
    this.currentTime = 0;
  }

  isComplete(): boolean {
    return this.currentTime >= this.duration;
  }
}
```

### 自定义缓动生成器

```typescript
class CustomEasingGenerator {
  static createSpring(
    damping: number = 0.1,
    stiffness: number = 100,
    mass: number = 1
  ): (t: number) => number {
    const angularFrequency = Math.sqrt(stiffness / mass);
    const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));
    
    return (t: number) => {
      if (dampingRatio < 1) {
        // Underdamped
        const decay = Math.exp(-dampingRatio * angularFrequency * t);
        const frequency = angularFrequency * Math.sqrt(1 - dampingRatio * dampingRatio);
        return 1 - decay * Math.cos(frequency * t);
      } else if (dampingRatio === 1) {
        // Critically damped
        return 1 - (1 + angularFrequency * t) * Math.exp(-angularFrequency * t);
      } else {
        // Overdamped
        const decay = Math.exp(-dampingRatio * angularFrequency * t);
        const frequency = angularFrequency * Math.sqrt(dampingRatio * dampingRatio - 1);
        return 1 - decay * Math.cosh(frequency * t);
      }
    };
  }

  static createBounce(
    bounces: number = 3,
    decay: number = 0.5
  ): (t: number) => number {
    return (t: number) => {
      let result = 0;
      let amplitude = 1;
      
      for (let i = 0; i < bounces; i++) {
        const bounceTime = t * Math.pow(2, i);
        const bounceAmplitude = amplitude * Math.pow(decay, i);
        
        if (bounceTime < 1) {
          result += bounceAmplitude * Math.sin(bounceTime * Math.PI);
        }
      }
      
      return Math.min(result, 1);
    };
  }

  static createElastic(
    amplitude: number = 1,
    period: number = 0.3
  ): (t: number) => number {
    return (t: number) => {
      if (t === 0 || t === 1) return t;
      
      const scaledTime = t - 1;
      const scaledPeriod = period / (2 * Math.PI) * Math.asin(1 / amplitude);
      
      return -(amplitude * Math.pow(2, 10 * scaledTime) * 
               Math.sin((scaledTime - scaledPeriod) * (2 * Math.PI) / period));
    };
  }
}
```

### 缓动组合器

```typescript
class EasingCombiner {
  static sequence(
    easings: ExtendedEasingType[],
    weights: number[]
  ): (t: number) => number {
    return (t: number) => {
      let result = 0;
      let totalWeight = 0;
      
      for (let i = 0; i < easings.length; i++) {
        const easingFunction = easingMap[easings[i]];
        const weight = weights[i] || 1;
        result += easingFunction(t) * weight;
        totalWeight += weight;
      }
      
      return result / totalWeight;
    };
  }

  static blend(
    easing1: ExtendedEasingType,
    easing2: ExtendedEasingType,
    blendFactor: number
  ): (t: number) => number {
    const func1 = easingMap[easing1];
    const func2 = easingMap[easing2];
    
    return (t: number) => {
      const value1 = func1(t);
      const value2 = func2(t);
      return value1 * (1 - blendFactor) + value2 * blendFactor;
    };
  }

  static reverse(easing: ExtendedEasingType): (t: number) => number {
    const func = easingMap[easing];
    return (t: number) => 1 - func(1 - t);
  }
}
```

## 6. 边界条件、错误码与异常处理

### 错误码定义

| 错误码 | 描述 | 触发条件 | 处理策略 |
|--------|------|----------|----------|
| INVALID_EASING_TYPE | 无效缓动类型 | 使用了未定义的缓动类型 | 回退到线性缓动 |
| PARAMETER_OUT_OF_RANGE | 参数超出范围 | 缓动参数超出有效范围 | 裁剪到有效范围 |
| DIVISION_BY_ZERO | 除零错误 | 缓动函数计算中出现除零 | 使用安全默认值 |
| FLOATING_POINT_ERROR | 浮点错误 | 数值计算溢出或下溢 | 检查数值范围 |
| INVALID_TIME_INPUT | 无效时间输入 | 时间参数不在[0,1]范围 | 裁剪到[0,1]范围 |

### 验证函数

```typescript
class EasingValidationError extends Error {
  constructor(code: string, message: string) {
    super(message);
    this.name = 'EasingValidationError';
    this.message = `[${code}] ${message}`;
  }
}

function validateEasingType(type: ExtendedEasingType): ValidationResult {
  const errors: string[] = [];
  
  if (!Object.values(ExtendedEasingType).includes(type)) {
    errors.push(`Invalid easing type: ${type}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateTransformFunction(
  func: AnimationTransformFunction
): ValidationResult {
  const errors: string[] = [];
  
  if (!func.type) {
    errors.push('Transform function must have a type');
  }
  
  if (!Array.isArray(func.parameters)) {
    errors.push('Parameters must be an array');
  }
  
  if (func.interpolation) {
    const validation = validateEasingType(func.interpolation);
    if (!validation.valid) {
      errors.push(...validation.errors);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

function sanitizeEasingInput(t: number): number {
  if (t == null || isNaN(t)) return 0;
  return Math.max(0, Math.min(1, t));
}
```

### 性能监控

```typescript
class EasingPerformanceMonitor {
  private callCount = 0;
  private totalTime = 0;
  private maxTime = 0;

  measurePerformance(
    easingFunction: (t: number) => number,
    iterations: number = 1000
  ): PerformanceMetrics {
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const t = i / iterations;
      const callStart = performance.now();
      easingFunction(t);
      const callEnd = performance.now();
      
      const callTime = callEnd - callStart;
      this.totalTime += callTime;
      this.maxTime = Math.max(this.maxTime, callTime);
      this.callCount++;
    }
    
    const end = performance.now();
    
    return {
      totalTime: end - start,
      averageTime: this.totalTime / this.callCount,
      maxTime: this.maxTime,
      callCount: this.callCount,
    };
  }
}

interface PerformanceMetrics {
  totalTime: number;
  averageTime: number;
  maxTime: number;
  callCount: number;
}
```

## 7. 变更记录与未来演进

### v2.6.0 (2024-08-10)

- 添加所有标准缓动函数
- 支持自定义缓动生成
- 优化计算性能40%

### v2.0.0 (2024-07-25)

- 重构缓动系统架构
- 添加变换函数支持
- 支持缓动组合

### v1.7.0 (2024-06-30)

- 初始缓动函数实现
- 基础缓动类型支持
- 简单性能优化

### 路线图

- **v3.0.0**: 支持CSS缓动语法解析
- **v3.1.0**: 添加物理模拟缓动
- **v3.2.0**: 支持GPU加速计算
- **v3.3.0**: 添加缓动可视化工具