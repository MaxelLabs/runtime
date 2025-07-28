## 核心接口定义

### 接口总览

| 名称                    | 泛型参数 | 简要描述                               |
| ----------------------- | -------- | -------------------------------------- |
| `VisualEffect`          | -        | 视觉效果配置，定义粒子、光晕等视觉反馈 |
| `VibrationPattern`      | -        | 震动模式配置，支持自定义强度和时序     |
| `ClickEffect`           | -        | 点击效果配置，整合视觉、音效、震动反馈 |
| `ITransform`            | -        | 基础变换接口，核心3D变换属性集合       |
| `GradientStop`          | -        | 渐变停止点，定义颜色渐变的关键节点     |
| `MaterialProperties`    | -        | 材质属性配置，PBR材质完整参数集合      |
| `AnimationProperties`   | -        | 动画属性配置，基础动画参数定义         |
| `RenderingProperties`   | -        | 渲染属性配置，可见性和渲染层级控制     |
| `BoundingSphere`        | -        | 边界球体，用于碰撞检测和视锥剔除       |
| `CoreBoundingBox`       | -        | 3D边界框，精确的轴向边界定义           |
| `InteractionProperties` | -        | 交互属性配置，悬停、点击、选择效果     |
| `HoverEffect`           | -        | 悬停效果配置，鼠标悬停时的视觉反馈     |
| `SelectionBorder`       | -        | 选择边框样式，选中状态的视觉指示       |
| `SelectionEffect`       | -        | 选择效果配置，多选和单选状态处理       |
| `CommonMetadata`        | -        | 通用元数据，跨模块的标准化信息结构     |
| `TransformFunction`     | -        | 变换函数，通用变换计算接口             |
| `ConstraintConfig`      | -        | 约束配置，布局和设计系统约束定义       |
| `BaseAnimationConfig`   | -        | 基础动画配置，动画系统核心参数         |
| `BaseEvent`             | -        | 基础事件，通用事件系统数据结构         |
| `BaseController`        | -        | 基础控制器，动画和媒体播放控制接口     |
| `BaseComponentProperty` | -        | 基础组件属性，设计系统组件参数定义     |
| `BaseStyle`             | -        | 基础样式配置，跨模块样式系统           |
| `BaseParameter`         | -        | 基础参数定义，动态参数管理系统         |

### 枚举总览

| 枚举名           | 成员                                 | 语义           | 适用场景           |
| ---------------- | ------------------------------------ | -------------- | ------------------ |
| `TransformSpace` | `World, Local, Parent, Screen, View` | 变换空间定义   | 3D变换、坐标系转换 |
| `ElementType`    | 55种元素类型                         | 设计元素分类   | UI设计、组件系统   |
| `BlendMode`      | 20种混合模式                         | 颜色混合算法   | 渲染、合成、特效   |
| `EasingFunction` | 31种缓动函数                         | 动画时间曲线   | 动画系统、过渡效果 |
| `EulerOrder`     | 6种旋转顺序                          | 欧拉角旋转顺序 | 3D旋转、动画系统   |
| `AlignmentType`  | 11种对齐方式                         | 布局对齐策略   | UI布局、设计系统   |
| `MaterialType`   | 9种材质类型                          | 材质渲染管线   | 3D渲染、材质系统   |
| `GradientType`   | 7种渐变类型                          | 颜色渐变模式   | 设计系统、视觉效果 |
| `QualityLevel`   | 4个质量等级                          | 渲染质量设置   | 性能优化、设备适配 |

### 核心接口详解

#### VisualEffect

**类型签名**

```tsx
interface VisualEffect {
  type: VisualEffectType;
  duration: number;
  parameters?: Record<string, any>;
}
```

**字段说明**

| 字段名       | 类型                  | 描述                           | 默认值 | 异常描述               |
| ------------ | --------------------- | ------------------------------ | ------ | ---------------------- |
| `type`       | `VisualEffectType`    | 效果类型枚举，定义粒子、光晕等 | -      | 必须指定有效类型       |
| `duration`   | `number`              | 效果持续时间（毫秒）           | -      | 必须大于0              |
| `parameters` | `Record<string, any>` | 效果参数对象，类型特定配置     | `{}`   | 参数类型需匹配效果要求 |

**关联类型**

- [`VisualEffectType`](./enums.md#visualeffecttype) - 视觉效果类型枚举
- [`ParticleSystem`](../../animation/particle.md) - 粒子系统配置

#### ITransform

**类型签名**

```tsx
interface ITransform {
  position: Vector3Like;
  rotation: QuaternionLike;
  scale: Vector3Like;
  matrix?: Matrix4Like;
  anchor?: Vector3Like;
  space?: TransformSpace;
}
```

**字段说明**

| 字段名     | 类型             | 描述                    | 默认值         | 异常描述           |
| ---------- | ---------------- | ----------------------- | -------------- | ------------------ |
| `position` | `Vector3Like`    | 位置坐标 [x, y, z]      | `[0, 0, 0]`    | 支持数值数组或对象 |
| `rotation` | `QuaternionLike` | 旋转四元数 [x, y, z, w] | `[0, 0, 0, 1]` | 必须是单位四元数   |
| `scale`    | `Vector3Like`    | 缩放因子 [x, y, z]      | `[1, 1, 1]`    | 不能包含0值        |
| `matrix`   | `Matrix4Like`    | 4x4变换矩阵（可选）     | -              | 优先级高于基础变换 |
| `anchor`   | `Vector3Like`    | 变换锚点坐标            | `[0, 0, 0]`    | 影响旋转和缩放中心 |
| `space`    | `TransformSpace` | 变换空间枚举            | `Local`        | 定义坐标系参考     |

**关联类型**

- [`TransformSpace`](./enums.md#transformspace) - 变换空间枚举
- [`Vector3Like`](./math.md#vector3like) - 三维向量类型
- [`QuaternionLike`](./math.md#quaternionlike) - 四元数类型

#### MaterialProperties

**类型签名**

```tsx
interface MaterialProperties {
  name: string;
  type: MaterialType;
  baseColor: ColorLike;
  opacity: number;
  metallic?: number;
  roughness?: number;
  emissiveColor?: ColorLike;
  emissiveIntensity?: number;
  normalScale?: number;
  occlusionStrength?: number;
  ior?: number;
  transmission?: number;
  thickness?: number;
  attenuationColor?: ColorLike;
  attenuationDistance?: number;
  anisotropy?: number;
  anisotropyRotation?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  clearcoatNormal?: number;
  sheen?: number;
  sheenColor?: ColorLike;
  sheenRoughness?: number;
  subsurface?: number;
  subsurfaceColor?: ColorLike;
  subsurfaceRadius?: [number, number, number];
}
```

**字段说明**

| 字段名      | 类型           | 描述         | 默认值         | 取值范围       |
| ----------- | -------------- | ------------ | -------------- | -------------- |
| `name`      | `string`       | 材质名称标识 | -              | 必须唯一       |
| `type`      | `MaterialType` | 材质类型枚举 | `Standard`     | 见材质类型定义 |
| `baseColor` | `ColorLike`    | 基础颜色值   | `[1, 1, 1, 1]` | RGBA 0-1范围   |
| `opacity`   | `number`       | 透明度       | `1.0`          | 0-1            |
| `metallic`  | `number`       | 金属度       | `0.0`          | 0-1            |
| `roughness` | `number`       | 粗糙度       | `0.5`          | 0-1            |

### 枚举值详解

#### VisualEffectType

**枚举定义**

```tsx
enum VisualEffectType {
  Particle = 'particle',
  Glow = 'glow',
  Flash = 'flash',
  Ripple = 'ripple',
  Explosion = 'explosion',
}
```

**枚举值详情**

| 枚举值      | 字面量 | 对应字符串    | 使用场景     | 代码示例                           |
| ----------- | ------ | ------------- | ------------ | ---------------------------------- |
| `Particle`  | `0`    | `'particle'`  | 粒子系统效果 | `type: VisualEffectType.Particle`  |
| `Glow`      | `1`    | `'glow'`      | 发光效果     | `type: VisualEffectType.Glow`      |
| `Flash`     | `2`    | `'flash'`     | 闪烁效果     | `type: VisualEffectType.Flash`     |
| `Ripple`    | `3`    | `'ripple'`    | 涟漪效果     | `type: VisualEffectType.Ripple`    |
| `Explosion` | `4`    | `'explosion'` | 爆炸效果     | `type: VisualEffectType.Explosion` |

#### TransformSpace

**枚举定义**

```tsx
enum TransformSpace {
  World = 'world',
  Local = 'local',
  Parent = 'parent',
  Screen = 'screen',
  View = 'view',
}
```

**枚举值详情**

| 枚举值   | 字面量 | 对应字符串 | 使用场景       | 代码示例                       |
| -------- | ------ | ---------- | -------------- | ------------------------------ |
| `World`  | `0`    | `'world'`  | 世界坐标系变换 | `space: TransformSpace.World`  |
| `Local`  | `1`    | `'local'`  | 本地坐标系变换 | `space: TransformSpace.Local`  |
| `Parent` | `2`    | `'parent'` | 父级坐标系变换 | `space: TransformSpace.Parent` |
| `Screen` | `3`    | `'screen'` | 屏幕坐标系变换 | `space: TransformSpace.Screen` |
| `View`   | `4`    | `'view'`   | 视图坐标系变换 | `space: TransformSpace.View`   |

### 使用示例

#### 最小可运行片段

```tsx
import type { VisualEffect, ITransform, MaterialProperties } from '@maxellabs/specification/core';

// 基础视觉效果配置
const basicEffect: VisualEffect = {
  type: 'particle',
  duration: 1000,
  parameters: {
    particleCount: 50,
    size: [0.1, 0.5],
    velocity: [1, 3],
  },
};

// 基础变换配置
const basicTransform: ITransform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  scale: [1, 1, 1],
};
```

#### 常见业务封装

```tsx
// 创建标准化材质配置
function createStandardMaterial(name: string, color: [number, number, number, number]): MaterialProperties {
  return {
    name,
    type: 'standard',
    baseColor: color,
    opacity: 1.0,
    metallic: 0.0,
    roughness: 0.5,
    emissiveColor: [0, 0, 0, 1],
    emissiveIntensity: 0,
  };
}

// 创建交互式变换
function createInteractiveTransform(
  position: [number, number, number],
  rotation: [number, number, number, number],
  anchor?: [number, number, number]
): ITransform {
  return {
    position,
    rotation,
    scale: [1, 1, 1],
    anchor: anchor || [0, 0, 0],
    space: 'local',
  };
}
```

#### 边界 case 处理

```tsx
// 处理非法变换值
function validateTransform(transform: ITransform): ITransform {
  // 确保缩放不为0
  const safeScale = transform.scale.map((s) => Math.max(s, 0.001)) as [number, number, number];

  // 标准化四元数
  const rotation = transform.rotation;
  const length = Math.sqrt(rotation.reduce((sum, val) => sum + val * val, 0));
  const normalizedRotation =
    length > 0
      ? (rotation.map((r) => r / length) as [number, number, number, number])
      : ([0, 0, 0, 1] as [number, number, number, number]);

  return {
    ...transform,
    scale: safeScale,
    rotation: normalizedRotation,
  };
}

// 处理材质参数验证
function validateMaterial(material: MaterialProperties): MaterialProperties {
  return {
    ...material,
    opacity: Math.max(0, Math.min(1, material.opacity)),
    metallic: Math.max(0, Math.min(1, material.metallic || 0)),
    roughness: Math.max(0, Math.min(1, material.roughness || 0.5)),
  };
}
```

### 最佳实践

#### 类型收窄

```tsx
// 使用类型保护确保运行时安全
function isValidVisualEffect(effect: any): effect is VisualEffect {
  return effect && typeof effect.type === 'string' && typeof effect.duration === 'number' && effect.duration > 0;
}

// 使用断言收窄类型
function assertTransform(transform: any): asserts transform is ITransform {
  if (!transform.position || !Array.isArray(transform.position) || transform.position.length !== 3) {
    throw new Error('Invalid transform: position must be a 3-element array');
  }
}
```

#### 运行时校验

```tsx
// 运行时参数验证
class TransformValidator {
  static validatePosition(pos: any): Vector3Like {
    if (!Array.isArray(pos) || pos.length !== 3) {
      throw new Error('Position must be a 3-element array');
    }
    return pos.map((p) => {
      if (typeof p !== 'number' || !isFinite(p)) {
        throw new Error('Position values must be finite numbers');
      }
      return p;
    }) as Vector3Like;
  }

  static validateRotation(rot: any): QuaternionLike {
    if (!Array.isArray(rot) || rot.length !== 4) {
      throw new Error('Rotation must be a 4-element array (quaternion)');
    }
    return rot.map((r) => {
      if (typeof r !== 'number' || !isFinite(r)) {
        throw new Error('Rotation values must be finite numbers');
      }
      return r;
    }) as QuaternionLike;
  }
}
```

#### 与后端协议对齐

```tsx
// 后端数据转换
function transformToBackend(transform: ITransform) {
  return {
    position: { x: transform.position[0], y: transform.position[1], z: transform.position[2] },
    rotation: {
      x: transform.rotation[0],
      y: transform.rotation[1],
      z: transform.rotation[2],
      w: transform.rotation[3],
    },
    scale: { x: transform.scale[0], y: transform.scale[1], z: transform.scale[2] },
    space: transform.space || 'local',
  };
}

function transformFromBackend(data: any): ITransform {
  return {
    position: [data.position.x, data.position.y, data.position.z],
    rotation: [data.rotation.x, data.rotation.y, data.rotation.z, data.rotation.w],
    scale: [data.scale.x, data.scale.y, data.scale.z],
    space: data.space,
  };
}
```

#### 错误提示国际化

```tsx
// 国际化错误消息
const errorMessages = {
  zh: {
    invalidPosition: '位置必须是包含3个数字的数组',
    invalidRotation: '旋转必须是包含4个数字的四元数',
    invalidScale: '缩放不能为零或负数',
  },
  en: {
    invalidPosition: 'Position must be an array of 3 numbers',
    invalidRotation: 'Rotation must be a quaternion array of 4 numbers',
    invalidScale: 'Scale cannot be zero or negative',
  },
};

function getLocalizedError(key: string, locale: 'zh' | 'en' = 'zh'): string {
  return errorMessages[locale][key] || key;
}
```

### 变更日志
