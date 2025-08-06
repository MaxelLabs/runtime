# 动画曲线模块文档

动画曲线模块定义了Maxellabs中的动画数值变化曲线系统，支持多种插值模式和预设类型。

## 1. 概览与背景

动画曲线系统是Maxellabs动画系统的核心组件之一，负责定义数值随时间变化的规律。该系统支持线性插值、贝塞尔曲线、步进函数等多种插值方式，为复杂的动画效果提供精确的数值控制。

## 2. API 签名与类型定义

### AnimationCurve

基础动画曲线接口。

```typescript
interface AnimationCurve {
  keys: AnimationKeyframe[];
  preset?: CurvePreset;
}
```

### ColorCurve

颜色动画曲线接口。

```typescript
interface ColorCurve {
  r: AnimationCurve;
  g: AnimationCurve;
  b: AnimationCurve;
  a: AnimationCurve;
}
```

### VelocityCurve

速度动画曲线接口。

```typescript
interface VelocityCurve {
  x: AnimationCurve;
  y: AnimationCurve;
  z: AnimationCurve;
}
```

### ValueRange

数值范围定义。

```typescript
interface ValueRange {
  min: number;
  max: number;
}
```

### ColorRange

颜色范围定义。

```typescript
interface ColorRange {
  start: [number, number, number, number];
  end: [number, number, number, number];
}
```

### CurvePreset

曲线预设类型枚举。

```typescript
enum CurvePreset {
  Constant = 'constant',
  Linear = 'linear',
  Random = 'random',
  Custom = 'custom',
}
```

## 3. 参数与返回值详细说明

### AnimationCurve 属性

| 属性名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| keys | AnimationKeyframe[] | 是 | [] | 关键点列表 |
| preset | CurvePreset | 否 | 'custom' | 预设类型 |

### ColorCurve 属性

| 属性名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| r | AnimationCurve | 是 | - | 红色通道曲线 |
| g | AnimationCurve | 是 | - | 绿色通道曲线 |
| b | AnimationCurve | 是 | - | 蓝色通道曲线 |
| a | AnimationCurve | 是 | - | 透明度通道曲线 |

### VelocityCurve 属性

| 属性名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| x | AnimationCurve | 是 | - | X轴速度曲线 |
| y | AnimationCurve | 是 | - | Y轴速度曲线 |
| z | AnimationCurve | 是 | - | Z轴速度曲线 |

## 4. 使用场景与代码示例

### 基础动画曲线

```typescript
const simpleCurve: AnimationCurve = {
  keys: [
    { time: 0, value: 0, interpolation: 'linear' },
    { time: 1, value: 1, interpolation: 'linear' },
    { time: 2, value: 0, interpolation: 'linear' },
  ],
  preset: CurvePreset.Custom,
};
```

### 颜色渐变动画

```typescript
const colorTransition: ColorCurve = {
  r: {
    keys: [
      { time: 0, value: 1.0, interpolation: 'bezier' },
      { time: 2, value: 0.0, interpolation: 'bezier' },
    ],
  },
  g: {
    keys: [
      { time: 0, value: 0.0, interpolation: 'bezier' },
      { time: 1, value: 1.0, interpolation: 'bezier' },
      { time: 2, value: 0.5, interpolation: 'bezier' },
    ],
  },
  b: {
    keys: [
      { time: 0, value: 0.0, interpolation: 'bezier' },
      { time: 2, value: 1.0, interpolation: 'bezier' },
    ],
  },
  a: {
    keys: [
      { time: 0, value: 1.0, interpolation: 'linear' },
      { time: 2, value: 1.0, interpolation: 'linear' },
    ],
  },
};
```

### 速度控制曲线

```typescript
const velocityCurve: VelocityCurve = {
  x: {
    keys: [
      { time: 0, value: 0, interpolation: 'bezier' },
      { time: 0.5, value: 10, interpolation: 'bezier' },
      { time: 1, value: 5, interpolation: 'bezier' },
    ],
  },
  y: {
    keys: [
      { time: 0, value: 0, interpolation: 'linear' },
      { time: 1, value: -9.8, interpolation: 'linear' },
    ],
  },
  z: {
    keys: [
      { time: 0, value: 0, interpolation: 'constant' },
    ],
  },
};
```

### 预设曲线使用

```typescript
const constantCurve: AnimationCurve = {
  keys: [{ time: 0, value: 1.0 }],
  preset: CurvePreset.Constant,
};

const linearCurve: AnimationCurve = {
  keys: [
    { time: 0, value: 0 },
    { time: 1, value: 1 },
  ],
  preset: CurvePreset.Linear,
};

const randomCurve: AnimationCurve = {
  keys: [
    { time: 0, value: Math.random() },
    { time: 1, value: Math.random() },
    { time: 2, value: Math.random() },
  ],
  preset: CurvePreset.Random,
};
```

### 动态曲线生成

```typescript
function createSineWave(
  amplitude: number,
  frequency: number,
  duration: number,
  samples: number
): AnimationCurve {
  const keys: AnimationKeyframe[] = [];
  const step = duration / (samples - 1);

  for (let i = 0; i < samples; i++) {
    const time = i * step;
    const value = amplitude * Math.sin(2 * Math.PI * frequency * time);
    keys.push({
      time,
      value,
      interpolation: 'bezier',
    });
  }

  return { keys, preset: CurvePreset.Custom };
}
```

### 缓动函数曲线

```typescript
function createEaseInOutCurve(
  startValue: number,
  endValue: number,
  duration: number
): AnimationCurve {
  return {
    keys: [
      { time: 0, value: startValue, interpolation: 'bezier' },
      { time: duration, value: endValue, interpolation: 'bezier' },
    ],
    preset: CurvePreset.Custom,
  };
}

const easeInOut = createEaseInOutCurve(0, 1, 1);
```

## 5. 内部实现与算法剖析

### 曲线插值算法

```typescript
function evaluateCurve(curve: AnimationCurve, time: number): number {
  const keys = curve.keys;
  if (keys.length === 0) return 0;
  if (keys.length === 1) return keys[0].value;

  const sortedKeys = [...keys].sort((a, b) => a.time - b.time);

  // 边界检查
  if (time <= sortedKeys[0].time) return sortedKeys[0].value;
  if (time >= sortedKeys[sortedKeys.length - 1].time) {
    return sortedKeys[sortedKeys.length - 1].value;
  }

  // 找到相邻关键帧
  let left = 0;
  let right = sortedKeys.length - 1;
  
  for (let i = 0; i < sortedKeys.length - 1; i++) {
    if (time >= sortedKeys[i].time && time <= sortedKeys[i + 1].time) {
      left = i;
      right = i + 1;
      break;
    }
  }

  const leftKey = sortedKeys[left];
  const rightKey = sortedKeys[right];
  const t = (time - leftKey.time) / (rightKey.time - leftKey.time);

  return this.interpolateValue(
    leftKey.value,
    rightKey.value,
    t,
    leftKey.interpolation,
    leftKey,
    rightKey
  );
}

function interpolateValue(
  start: number,
  end: number,
  t: number,
  interpolation: string = 'linear',
  startKey?: AnimationKeyframe,
  endKey?: AnimationKeyframe
): number {
  switch (interpolation) {
    case 'linear':
      return start + (end - start) * t;
    
    case 'bezier':
      return this.cubicBezier(
        start,
        startKey?.outTangent?.y || start,
        endKey?.inTangent?.y || end,
        end,
        t
      );
    
    case 'step':
      return t < 1 ? start : end;
    
    case 'ease-in':
      return start + (end - start) * (t * t);
    
    case 'ease-out':
      return start + (end - start) * (1 - Math.pow(1 - t, 2));
    
    case 'ease-in-out':
      return start + (end - start) * this.easeInOutQuad(t);
    
    default:
      return start + (end - start) * t;
  }
}

function cubicBezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
```

### 颜色曲线计算

```typescript
function evaluateColorCurve(curve: ColorCurve, time: number): [number, number, number, number] {
  return [
    evaluateCurve(curve.r, time),
    evaluateCurve(curve.g, time),
    evaluateCurve(curve.b, time),
    evaluateCurve(curve.a, time),
  ];
}

function interpolateColor(
  start: [number, number, number, number],
  end: [number, number, number, number],
  t: number,
  interpolation: string = 'linear'
): [number, number, number, number] {
  return start.map((startValue, index) => 
    interpolateValue(startValue, end[index], t, interpolation)
  ) as [number, number, number, number];
}
```

### 速度曲线积分

```typescript
function integrateVelocityCurve(curve: VelocityCurve, startTime: number, endTime: number): {
  position: [number, number, number];
  velocity: [number, number, number];
} {
  const dt = 0.01; // 积分步长
  let position: [number, number, number] = [0, 0, 0];
  let velocity: [number, number, number] = [0, 0, 0];

  for (let t = startTime; t < endTime; t += dt) {
    const vx = evaluateCurve(curve.x, t);
    const vy = evaluateCurve(curve.y, t);
    const vz = evaluateCurve(curve.z, t);

    velocity = [vx, vy, vz];
    position = [
      position[0] + vx * dt,
      position[1] + vy * dt,
      position[2] + vz * dt,
    ];
  }

  return { position, velocity };
}
```

## 6. 边界条件、错误码与异常处理

### 错误码定义

| 错误码 | 描述 | 触发条件 | 处理策略 |
|--------|------|----------|----------|
| EMPTY_CURVE | 空曲线 | 关键点列表为空 | 返回默认值0 |
| INVALID_TIME | 无效时间 | 时间值为负或NaN | 限制到有效范围 |
| INVALID_INTERPOLATION | 无效插值类型 | 不支持的插值类型 | 使用线性插值 |
| VALUE_OUT_OF_RANGE | 值超出范围 | 插值结果超出预期范围 | 裁剪到范围边界 |
| DUPLICATE_KEY_TIME | 重复关键时间 | 多个关键点时间相同 | 合并关键点 |
| CURVE_OVERFLOW | 曲线溢出 | 评估时间超出曲线范围 | 使用边界值 |

### 验证函数

```typescript
class AnimationCurveError extends Error {
  constructor(code: string, message: string) {
    super(message);
    this.name = 'AnimationCurveError';
    this.message = `[${code}] ${message}`;
  }
}

function validateAnimationCurve(curve: AnimationCurve): ValidationResult {
  const errors: string[] = [];

  if (!curve.keys || curve.keys.length === 0) {
    errors.push('Animation curve must have at least one key');
  }

  const keyTimes = new Set();
  for (let i = 0; i < curve.keys.length; i++) {
    const key = curve.keys[i];
    
    if (key.time == null || isNaN(key.time)) {
      errors.push(`Key ${i} has invalid time`);
    }
    
    if (key.value == null || isNaN(key.value)) {
      errors.push(`Key ${i} has invalid value`);
    }

    if (keyTimes.has(key.time)) {
      errors.push(`Duplicate key time: ${key.time}`);
    }
    keyTimes.add(key.time);
  }

  // 检查时间顺序
  const sortedKeys = [...curve.keys].sort((a, b) => a.time - b.time);
  for (let i = 1; i < sortedKeys.length; i++) {
    if (sortedKeys[i].time < sortedKeys[i-1].time) {
      errors.push('Keys are not in chronological order');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function sanitizeAnimationCurve(curve: AnimationCurve): AnimationCurve {
  const sanitized = { ...curve };
  
  // 确保关键点按时间排序
  sanitized.keys = [...curve.keys]
    .filter(key => key != null && !isNaN(key.time) && !isNaN(key.value))
    .sort((a, b) => a.time - b.time);

  // 移除重复时间点
  const uniqueKeys = new Map();
  for (const key of sanitized.keys) {
    uniqueKeys.set(key.time, key);
  }
  sanitized.keys = Array.from(uniqueKeys.values());

  return sanitized;
}
```

### 范围检查

```typescript
function clampValue(value: number, range?: ValueRange): number {
  if (!range) return value;
  
  return Math.max(range.min, Math.min(range.max, value));
}

function normalizeValue(value: number, range: ValueRange): number {
  if (range.max === range.min) return 0;
  return (value - range.min) / (range.max - range.min);
}

function denormalizeValue(normalized: number, range: ValueRange): number {
  return range.min + normalized * (range.max - range.min);
}
```

## 7. 变更记录与未来演进

### v2.4.0 (2024-08-05)

- 添加贝塞尔曲线支持
- 优化插值算法性能30%
- 支持自定义缓动函数

### v2.0.0 (2024-07-20)

- 重构曲线系统架构
- 添加颜色曲线支持
- 支持3D速度曲线

### v1.6.0 (2024-06-25)

- 初始曲线系统实现
- 基础插值算法
- 预设类型支持

### 路线图

- **v3.0.0**: 支持Catmull-Rom样条
- **v3.1.0**: 添加噪声函数
- **v3.2.0**: 支持实时曲线编辑
- **v3.3.0**: 添加曲线压缩算法