# 动画核心模块文档

动画核心模块定义了Maxellabs中的基础动画类型和接口，基于USD（Universal Scene Description）标准构建。

## 1. 概览与背景

核心模块提供了动画系统的基础构建块，包括动画剪辑、轨道、关键帧等核心概念的定义。这些定义遵循USD标准，确保与其他DCC工具（如Blender、Maya）的兼容性。

## 2. API 签名与类型定义

### AnimationCondition

定义动画状态转换的条件逻辑。

```typescript
interface AnimationCondition {
  id: string;
  parameter: string;
  type: AnimationConditionType;
  value?: any;
  operator?: ComparisonOperator;
}
```

### AnimationConditionType

条件的类型枚举。

```typescript
enum AnimationConditionType {
  Boolean = 'boolean',
  Integer = 'integer',
  Float = 'float',
  Trigger = 'trigger',
}
```

### ComparisonOperator

比较运算符枚举。

```typescript
enum ComparisonOperator {
  Equal = 'equal',
  NotEqual = 'not-equal',
  Greater = 'greater',
  Less = 'less',
  GreaterEqual = 'greater-equal',
  LessEqual = 'less-equal',
}
```

### UsdAnimationClip

USD标准的动画剪辑定义。

```typescript
interface UsdAnimationClip extends AnimationPrim {
  attributes: {
    name: UsdValue;        // string - 动画名称
    duration: UsdValue;    // float - 持续时间（秒）
    frameRate: UsdValue;   // float - 帧率
    loopMode: UsdValue;    // AnimationLoopMode - 循环模式
    startTime?: UsdValue;  // float - 开始时间
    endTime?: UsdValue;    // float - 结束时间
  };
  tracks: UsdAnimationTrack[];
  events?: AnimationEvent[];
}
```

### UsdKeyframe

USD标准的关键帧定义，支持贝塞尔曲线控制。

```typescript
interface UsdKeyframe {
  time: number;
  value: any;
  inTangent?: UsdTangent;
  outTangent?: UsdTangent;
  interpolation?: InterpolationMode;
}
```

### UsdTangent

切线定义，用于贝塞尔曲线插值。

```typescript
interface UsdTangent {
  x: number;
  y: number;
}
```

### UsdAnimationTrack

USD动画轨道，定义特定属性的动画。

```typescript
interface UsdAnimationTrack extends Omit<AnimationTrack, 'keyframes'> {
  keyframes: UsdKeyframe[];
  usdPath: string;
  usdType: string;
}
```

## 3. 参数与返回值详细说明

### UsdAnimationClip 属性

| 属性名 | 类型 | 描述 | 示例 |
|--------|------|------|------|
| name | string | 动画剪辑的显示名称 | "Walk_Cycle" |
| duration | number | 动画持续时间（秒） | 2.5 |
| frameRate | number | 动画帧率（fps） | 30 |
| loopMode | AnimationLoopMode | 循环播放模式 | "loop" |
| startTime | number | 动画开始时间（可选） | 0.0 |
| endTime | number | 动画结束时间（可选） | 2.5 |

### UsdKeyframe 属性

| 属性名 | 类型 | 描述 | 示例 |
|--------|------|------|------|
| time | number | 关键帧时间点 | 0.5 |
| value | any | 关键帧值（根据属性类型变化） | [0, 1, 0] |
| inTangent | UsdTangent | 输入切线（可选） | {x: 0.5, y: 0.8} |
| outTangent | UsdTangent | 输出切线（可选） | {x: 0.3, y: 0.9} |
| interpolation | InterpolationMode | 插值模式（可选） | "bezier" |

## 4. 使用场景与代码示例

### 基础动画剪辑配置

```typescript
const walkClip: UsdAnimationClip = {
  typeName: 'Animation',
  attributes: {
    name: { type: 'string', value: 'Walk_Cycle' },
    duration: { type: 'float', value: 2.5 },
    frameRate: { type: 'float', value: 30 },
    loopMode: { type: 'token', value: 'loop' },
    startTime: { type: 'float', value: 0 },
    endTime: { type: 'float', value: 2.5 },
  },
  tracks: [
    {
      targetPath: 'character/hip/translation',
      usdPath: '/character/hip.xformOp:translate',
      usdType: 'vector3f',
      keyframes: [
        { time: 0, value: [0, 0, 0] },
        { time: 1.25, value: [0, 0.1, 0] },
        { time: 2.5, value: [0, 0, 0] },
      ],
    },
  ],
  events: [
    { time: 1.25, name: 'footstep', data: { foot: 'left' } },
    { time: 2.0, name: 'footstep', data: { foot: 'right' } },
  ],
};
```

### 复杂关键帧配置

```typescript
const complexKeyframe: UsdKeyframe = {
  time: 1.0,
  value: [0.5, 0.8, 0.2],
  inTangent: { x: 0.3, y: 0.5 },
  outTangent: { x: 0.7, y: 0.9 },
  interpolation: 'bezier',
};
```

### 条件驱动动画

```typescript
const jumpCondition: AnimationCondition = {
  id: 'jump_trigger',
  parameter: 'isGrounded',
  type: AnimationConditionType.Boolean,
  value: false,
  operator: ComparisonOperator.Equal,
};
```

### USD路径映射

```typescript
const boneMapping = {
  'Hips': '/character/hips',
  'Spine': '/character/spine',
  'Head': '/character/head',
  'LeftArm': '/character/leftArm',
  'RightArm': '/character/rightArm',
};

const track: UsdAnimationTrack = {
  targetPath: 'character/leftArm/rotation',
  usdPath: boneMapping['LeftArm'] + '.xformOp:rotateYXZ',
  usdType: 'vector3f',
  keyframes: [
    { time: 0, value: [0, 0, 0] },
    { time: 0.5, value: [0, 0, 45] },
    { time: 1, value: [0, 0, 0] },
  ],
};
```

## 5. 内部实现与算法剖析

### 关键帧插值算法

```typescript
function interpolateUsdKeyframes(
  keyframes: UsdKeyframe[],
  time: number,
  interpolation: InterpolationMode = 'linear'
): any {
  if (keyframes.length === 0) return null;
  if (keyframes.length === 1) return keyframes[0].value;

  const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time);
  
  // 边界检查
  if (time <= sortedKeyframes[0].time) return sortedKeyframes[0].value;
  if (time >= sortedKeyframes[sortedKeyframes.length - 1].time) {
    return sortedKeyframes[sortedKeyframes.length - 1].value;
  }

  // 找到相邻关键帧
  let left = 0;
  let right = sortedKeyframes.length - 1;
  
  for (let i = 0; i < sortedKeyframes.length - 1; i++) {
    if (time >= sortedKeyframes[i].time && time <= sortedKeyframes[i + 1].time) {
      left = i;
      right = i + 1;
      break;
    }
  }

  const leftKf = sortedKeyframes[left];
  const rightKf = sortedKeyframes[right];
  const t = (time - leftKf.time) / (rightKf.time - leftKf.time);

  switch (interpolation) {
    case 'linear':
      return lerp(leftKf.value, rightKf.value, t);
    case 'bezier':
      return cubicBezier(
        leftKf.value,
        leftKf.outTangent || { x: 0, y: 0 },
        rightKf.inTangent || { x: 1, y: 1 },
        rightKf.value,
        t
      );
    default:
      return leftKf.value;
  }
}

function lerp(a: any, b: any, t: number): any {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.map((val, i) => val + (b[i] - val) * t);
  }
  return a + (b - a) * t;
}
```

### USD路径解析

```typescript
function parseUsdPath(path: string): {
  primPath: string;
  property: string;
  type: string;
} {
  const parts = path.split('.');
  const primPath = parts[0];
  const property = parts[1];
  
  // 映射到类型
  const typeMap = {
    'xformOp:translate': 'vector3f',
    'xformOp:rotateYXZ': 'vector3f',
    'xformOp:scale': 'vector3f',
  };
  
  return {
    primPath,
    property,
    type: typeMap[property] || 'float',
  };
}
```

## 6. 边界条件、错误码与异常处理

### 错误码定义

| 错误码 | 描述 | 触发条件 | 处理策略 |
|--------|------|----------|----------|
| INVALID_KEYFRAME_TIME | 无效关键帧时间 | 时间值为负或NaN | 使用默认值0 |
| DUPLICATE_KEYFRAME | 重复关键帧时间 | 同一时间存在多个关键帧 | 保留第一个 |
| INVALID_USD_PATH | 无效USD路径 | 路径格式错误 | 抛出异常 |
| MISSING_ATTRIBUTES | 缺少必需属性 | 缺少name/duration等 | 使用默认值 |
| TYPE_MISMATCH | 类型不匹配 | 值类型与声明不符 | 尝试类型转换 |

### 验证函数

```typescript
function validateUsdAnimationClip(clip: UsdAnimationClip): ValidationResult {
  const errors: string[] = [];

  if (!clip.attributes.name?.value) {
    errors.push('Animation clip must have a name');
  }

  if (!clip.attributes.duration?.value || clip.attributes.duration.value <= 0) {
    errors.push('Animation duration must be positive');
  }

  if (!clip.attributes.frameRate?.value || clip.attributes.frameRate.value <= 0) {
    errors.push('Frame rate must be positive');
  }

  if (clip.tracks.length === 0) {
    errors.push('Animation clip must have at least one track');
  }

  for (const track of clip.tracks) {
    if (!track.usdPath) {
      errors.push(`Track ${track.targetPath} missing USD path`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

## 7. 变更记录与未来演进

### v2.3.0 (2024-08-01)

- 添加USD标准关键帧支持
- 支持贝塞尔曲线插值
- 优化路径解析性能40%

### v2.0.0 (2024-07-15)

- 重构为USD兼容格式
- 添加事件系统支持
- 支持动态属性绑定

### v1.5.0 (2024-06-20)

- 初始动画类型定义
- 基础关键帧支持
- 简单插值算法

### 路线图

- **v3.0.0**: 支持USD Layering系统
- **v3.1.0**: 添加动画压缩
- **v3.2.0**: 支持实时IK解算
- **v3.3.0**: 添加动画重定向