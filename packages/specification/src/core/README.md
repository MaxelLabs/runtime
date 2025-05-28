# Core 核心模块

Maxellabs 3D Engine 的核心基础模块，提供整个引擎的基础类型、枚举定义、接口规范和 USD (Universal Scene Description) 标准支持。这个模块是所有其他模块的基石，定义了引擎的核心数据结构和类型系统。

## 📁 模块结构

### 🎯 核心文件

| 文件 | 描述 | 主要功能 |
|------|------|----------|
| `index.ts` | 模块入口 | 统一导出所有核心类型 |
| `base.ts` | 基础类型 | 基础数据类型、数学类型、颜色定义 |
| `enums.ts` | 枚举定义 | 渲染、混合、过滤、插值等枚举类型 |
| `interfaces.ts` | 接口规范 | 核心接口、配置、属性定义 |
| `usd.ts` | USD 标准 | USD 原语、值类型、时间码支持 |

## 🚀 核心能力

### 1. 基础数据类型 (`base.ts`)

**功能特性：**
- 完整的数学类型定义（向量、矩阵、四元数）
- 标准化的颜色表示
- 基础几何类型
- 范围和区间定义

**主要类型：**
```typescript
// 数学基础类型
interface Vector2 {
  x: number;
  y: number;
}

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Vector4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

interface Matrix4x4 {
  elements: number[]; // 16个元素的数组
}

// 颜色类型
interface Color {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
  a: number; // 0-1
}

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

interface ColorHSV {
  h: number; // 0-360
  s: number; // 0-1
  v: number; // 0-1
}

// 几何类型
interface Bounds2D {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Bounds3D {
  min: Vector3;
  max: Vector3;
}
```

**使用示例：**
```typescript
import { Vector3, Color, Quaternion, Matrix4x4 } from '@maxellabs/specification/core';

// 创建3D位置
const position: Vector3 = { x: 10, y: 5, z: 0 };

// 创建颜色
const red: Color = { r: 1, g: 0, b: 0, a: 1 };

// 创建旋转
const rotation: Quaternion = { x: 0, y: 0, z: 0, w: 1 };

// 创建变换矩阵
const transformMatrix: Matrix4x4 = {
  elements: [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]
};
```

### 2. 枚举系统 (`enums.ts`)

**功能特性：**
- 渲染管线相关枚举
- 混合模式和过滤器
- 插值和缓动类型
- 性能和质量等级

**主要枚举：**
```typescript
// 渲染模式
enum RenderMode {
  Opaque = 'opaque',
  Transparent = 'transparent',
  Cutout = 'cutout',
  Additive = 'additive',
  Multiply = 'multiply'
}

// 混合模式
enum BlendMode {
  Normal = 'normal',
  Add = 'add',
  Subtract = 'subtract',
  Multiply = 'multiply',
  Screen = 'screen',
  Overlay = 'overlay',
  SoftLight = 'soft-light',
  HardLight = 'hard-light',
  ColorDodge = 'color-dodge',
  ColorBurn = 'color-burn'
}

// 剔除模式
enum CullMode {
  None = 'none',
  Front = 'front',
  Back = 'back'
}

// 深度测试
enum DepthTest {
  Never = 'never',
  Less = 'less',
  Equal = 'equal',
  LessEqual = 'less-equal',
  Greater = 'greater',
  NotEqual = 'not-equal',
  GreaterEqual = 'greater-equal',
  Always = 'always'
}

// 插值模式
enum InterpolationMode {
  Linear = 'linear',
  Step = 'step',
  Bezier = 'bezier',
  Spline = 'spline',
  Hermite = 'hermite'
}

// 缓动类型
enum EasingType {
  Linear = 'linear',
  EaseIn = 'ease-in',
  EaseOut = 'ease-out',
  EaseInOut = 'ease-in-out',
  CubicBezier = 'cubic-bezier',
  Elastic = 'elastic',
  Bounce = 'bounce',
  Back = 'back'
}

// 质量等级
enum QualityLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Ultra = 'ultra',
  Custom = 'custom'
}
```

**使用示例：**
```typescript
import { 
  RenderMode, 
  BlendMode, 
  InterpolationMode, 
  QualityLevel 
} from '@maxellabs/specification/core';

// 配置渲染状态
const renderConfig = {
  mode: RenderMode.Transparent,
  blendMode: BlendMode.Normal,
  cullMode: CullMode.Back,
  depthTest: DepthTest.LessEqual
};

// 配置动画插值
const animationConfig = {
  interpolation: InterpolationMode.Bezier,
  easing: EasingType.EaseInOut
};

// 配置质量设置
const qualitySettings = {
  level: QualityLevel.High,
  shadows: true,
  reflections: true,
  antiAliasing: true
};
```

### 3. 核心接口 (`interfaces.ts`)

**功能特性：**
- 变换系统接口
- 动画属性定义
- 交互和材质属性
- 渲染和性能配置

**主要接口：**
```typescript
// 变换接口
interface Transform {
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
  matrix?: Matrix4x4;
}

// 动画属性
interface AnimationProperties {
  duration: number;
  delay?: number;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  playState?: 'running' | 'paused' | 'finished';
}

// 交互属性
interface InteractionProperties {
  enabled: boolean;
  clickable?: boolean;
  hoverable?: boolean;
  draggable?: boolean;
  touchEnabled?: boolean;
  mouseEnabled?: boolean;
  keyboardEnabled?: boolean;
}

// 材质属性
interface MaterialProperties {
  diffuse?: Color;
  specular?: Color;
  emissive?: Color;
  normal?: Vector3;
  roughness?: number;
  metallic?: number;
  transparency?: number;
  ior?: number; // 折射率
}

// 渲染属性
interface RenderingProperties {
  renderMode: RenderMode;
  blendMode: BlendMode;
  cullMode: CullMode;
  depthTest: DepthTest;
  depthWrite: boolean;
  stencilTest?: boolean;
  wireframe?: boolean;
  visible: boolean;
  castShadows?: boolean;
  receiveShadows?: boolean;
}

// 性能配置
interface PerformanceConfig {
  quality: QualityLevel;
  maxFrameRate?: number;
  adaptiveQuality?: boolean;
  lodBias?: number;
  particleLimit?: number;
  shadowDistance?: number;
  cullDistance?: number;
}

// 元数据
interface CommonMetadata {
  name: string;
  description?: string;
  version: { major: number; minor: number; patch: number };
  author?: string;
  created?: string;
  modified?: string;
  tags?: string[];
  custom?: Record<string, any>;
}
```

**使用示例：**
```typescript
import { 
  Transform,
  AnimationProperties,
  MaterialProperties,
  RenderingProperties,
  PerformanceConfig 
} from '@maxellabs/specification/core';

// 创建对象变换
const objectTransform: Transform = {
  position: { x: 0, y: 1, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 }
};

// 配置动画属性
const fadeAnimation: AnimationProperties = {
  duration: 2000,
  delay: 500,
  iterations: 1,
  direction: 'normal',
  fillMode: 'forwards'
};

// 配置材质属性
const metalMaterial: MaterialProperties = {
  diffuse: { r: 0.8, g: 0.8, b: 0.8, a: 1 },
  metallic: 1.0,
  roughness: 0.2,
  emissive: { r: 0, g: 0, b: 0, a: 1 }
};

// 配置渲染属性
const renderProps: RenderingProperties = {
  renderMode: 'opaque',
  blendMode: 'normal',
  cullMode: 'back',
  depthTest: 'less-equal',
  depthWrite: true,
  visible: true,
  castShadows: true,
  receiveShadows: true
};
```

### 4. USD 标准支持 (`usd.ts`)

**功能特性：**
- USD 原语定义
- USD 值类型系统
- 时间码和层支持
- USD 属性和关系

**主要类型：**
```typescript
// USD 原语基础接口
interface UsdPrim {
  path: string;
  typeName: string;
  specifier?: UsdSpecifier;
  active?: boolean;
  instanceable?: boolean;
  hidden?: boolean;
  kind?: string;
  attributes?: Record<string, UsdAttribute>;
  relationships?: Record<string, UsdRelationship>;
  children?: UsdPrim[];
  metadata?: UsdMetadata;
}

// USD 值类型
interface UsdValue {
  value: any;
  type: UsdValueType;
  timeCode?: UsdTimeCode;
  interpolation?: UsdInterpolation;
}

// USD 值类型枚举
enum UsdValueType {
  Bool = 'bool',
  Int = 'int',
  Float = 'float',
  Double = 'double',
  String = 'string',
  Token = 'token',
  Asset = 'asset',
  Vector2f = 'vector2f',
  Vector3f = 'vector3f',
  Vector4f = 'vector4f',
  Matrix4d = 'matrix4d',
  Quatf = 'quatf',
  Color3f = 'color3f',
  Color4f = 'color4f'
}

// USD 时间码
interface UsdTimeCode {
  value: number;
  isDefault?: boolean;
}

// USD 属性
interface UsdAttribute {
  name: string;
  typeName: UsdValueType;
  value?: UsdValue;
  defaultValue?: any;
  timeSamples?: Map<number, any>;
  interpolation?: UsdInterpolation;
  metadata?: UsdMetadata;
}

// USD 关系
interface UsdRelationship {
  name: string;
  targets: string[];
  metadata?: UsdMetadata;
}
```

**使用示例：**
```typescript
import { 
  UsdPrim, 
  UsdValue, 
  UsdValueType, 
  UsdTimeCode 
} from '@maxellabs/specification/core';

// 创建USD原语
const meshPrim: UsdPrim = {
  path: '/World/Geometry/Cube',
  typeName: 'Mesh',
  specifier: 'def',
  active: true,
  attributes: {
    points: {
      name: 'points',
      typeName: UsdValueType.Vector3f,
      value: {
        value: [
          { x: -1, y: -1, z: -1 },
          { x: 1, y: -1, z: -1 },
          { x: 1, y: 1, z: -1 },
          { x: -1, y: 1, z: -1 }
        ],
        type: UsdValueType.Vector3f
      }
    },
    faceVertexIndices: {
      name: 'faceVertexIndices',
      typeName: UsdValueType.Int,
      value: {
        value: [0, 1, 2, 3],
        type: UsdValueType.Int
      }
    }
  }
};

// 创建时间采样值
const animatedValue: UsdValue = {
  value: 1.0,
  type: UsdValueType.Float,
  timeCode: { value: 0.0, isDefault: false }
};
```

## 🎮 使用指南

### 基础类型组合

```typescript
import { 
  Vector3, 
  Color, 
  Transform, 
  RenderingProperties,
  MaterialProperties 
} from '@maxellabs/specification/core';

// 创建一个完整的3D对象配置
interface Object3DConfig {
  transform: Transform;
  material: MaterialProperties;
  rendering: RenderingProperties;
}

const cubeConfig: Object3DConfig = {
  transform: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 }
  },
  material: {
    diffuse: { r: 0.8, g: 0.2, b: 0.2, a: 1 },
    roughness: 0.5,
    metallic: 0.0
  },
  rendering: {
    renderMode: 'opaque',
    blendMode: 'normal',
    cullMode: 'back',
    depthTest: 'less-equal',
    depthWrite: true,
    visible: true
  }
};
```

### USD 场景构建

```typescript
import { UsdPrim, UsdValue, UsdValueType } from '@maxellabs/specification/core';

// 构建USD场景层次结构
const buildScene = (): UsdPrim => {
  const rootPrim: UsdPrim = {
    path: '/World',
    typeName: 'Xform',
    children: [
      {
        path: '/World/Lights',
        typeName: 'Xform',
        children: [
          {
            path: '/World/Lights/Key',
            typeName: 'SphereLight',
            attributes: {
              intensity: {
                name: 'intensity',
                typeName: UsdValueType.Float,
                value: { value: 1000, type: UsdValueType.Float }
              },
              color: {
                name: 'color',
                typeName: UsdValueType.Color3f,
                value: { 
                  value: { r: 1, g: 1, b: 1 }, 
                  type: UsdValueType.Color3f 
                }
              }
            }
          }
        ]
      },
      {
        path: '/World/Geometry',
        typeName: 'Xform',
        children: [
          {
            path: '/World/Geometry/Cube',
            typeName: 'Mesh',
            attributes: {
              // 网格属性定义...
            }
          }
        ]
      }
    ]
  };
  
  return rootPrim;
};
```

### 动画系统集成

```typescript
import { 
  AnimationProperties, 
  InterpolationMode, 
  EasingType 
} from '@maxellabs/specification/core';

// 创建复杂动画配置
interface AnimationConfig {
  properties: AnimationProperties;
  interpolation: InterpolationMode;
  easing: EasingType;
  keyframes: Array<{
    time: number;
    value: any;
  }>;
}

const createRotationAnimation = (): AnimationConfig => {
  return {
    properties: {
      duration: 4000,
      iterations: -1, // 无限循环
      direction: 'normal'
    },
    interpolation: 'linear',
    easing: 'linear',
    keyframes: [
      { time: 0, value: { x: 0, y: 0, z: 0, w: 1 } },
      { time: 1, value: { x: 0, y: 0.707, z: 0, w: 0.707 } },
      { time: 2, value: { x: 0, y: 1, z: 0, w: 0 } },
      { time: 3, value: { x: 0, y: 0.707, z: 0, w: -0.707 } },
      { time: 4, value: { x: 0, y: 0, z: 0, w: 1 } }
    ]
  };
};
```

### 性能优化配置

```typescript
import { 
  PerformanceConfig, 
  QualityLevel 
} from '@maxellabs/specification/core';

// 创建自适应性能配置
const createPerformanceConfig = (targetDevice: 'mobile' | 'desktop' | 'vr'): PerformanceConfig => {
  const baseConfig: PerformanceConfig = {
    quality: QualityLevel.Medium,
    adaptiveQuality: true
  };

  switch (targetDevice) {
    case 'mobile':
      return {
        ...baseConfig,
        quality: QualityLevel.Low,
        maxFrameRate: 30,
        particleLimit: 100,
        shadowDistance: 10,
        cullDistance: 50
      };
    
    case 'desktop':
      return {
        ...baseConfig,
        quality: QualityLevel.High,
        maxFrameRate: 60,
        particleLimit: 1000,
        shadowDistance: 50,
        cullDistance: 200
      };
    
    case 'vr':
      return {
        ...baseConfig,
        quality: QualityLevel.Ultra,
        maxFrameRate: 90,
        particleLimit: 500,
        shadowDistance: 30,
        cullDistance: 100
      };
    
    default:
      return baseConfig;
  }
};
```

## ⚠️ 注意事项

### 类型安全性

```typescript
// ✅ 推荐：使用类型守卫
const isValidColor = (color: any): color is Color => {
  return (
    typeof color === 'object' &&
    typeof color.r === 'number' &&
    typeof color.g === 'number' &&
    typeof color.b === 'number' &&
    typeof color.a === 'number' &&
    color.r >= 0 && color.r <= 1 &&
    color.g >= 0 && color.g <= 1 &&
    color.b >= 0 && color.b <= 1 &&
    color.a >= 0 && color.a <= 1
  );
};

// ✅ 推荐：使用类型断言
const safeColorConversion = (input: unknown): Color => {
  if (isValidColor(input)) {
    return input;
  }
  return { r: 1, g: 1, b: 1, a: 1 }; // 默认白色
};
```

### 性能考虑

```typescript
// ✅ 推荐：避免频繁创建对象
const reuseableTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 }
};

// 更新而不是重新创建
const updateTransform = (transform: Transform, newPosition: Vector3) => {
  transform.position.x = newPosition.x;
  transform.position.y = newPosition.y;
  transform.position.z = newPosition.z;
};

// ❌ 避免：频繁创建新对象
const inefficientUpdate = (newPosition: Vector3): Transform => {
  return {
    position: { ...newPosition },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 }
  };
};
```

### USD 最佳实践

```typescript
// ✅ 推荐：使用有意义的路径名
const goodPrimPath = '/World/Characters/Hero/Body/Mesh';

// ❌ 避免：无意义的路径名
const badPrimPath = '/Prim1/Prim2/Prim3/Mesh';

// ✅ 推荐：合理的层次结构
const wellStructuredScene = {
  '/World': 'root',
  '/World/Lights': 'lighting group',
  '/World/Geometry': 'geometry group',
  '/World/Cameras': 'camera group',
  '/World/Materials': 'material group'
};
```

### 枚举使用建议

```typescript
// ✅ 推荐：使用枚举而不是字符串字面量
import { BlendMode, RenderMode } from '@maxellabs/specification/core';

const renderConfig = {
  mode: RenderMode.Transparent,  // 类型安全
  blend: BlendMode.Normal        // 自动补全
};

// ❌ 避免：使用魔法字符串
const badConfig = {
  mode: 'transparent',  // 容易拼写错误
  blend: 'normal'       // 没有类型检查
};
```

## 🔧 工具函数

Core模块提供了一些实用的工具函数：

```typescript
// 向量操作
export const VectorUtils = {
  add: (a: Vector3, b: Vector3): Vector3 => ({
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z
  }),
  
  dot: (a: Vector3, b: Vector3): number => 
    a.x * b.x + a.y * b.y + a.z * b.z,
  
  normalize: (v: Vector3): Vector3 => {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return length > 0 ? {
      x: v.x / length,
      y: v.y / length,
      z: v.z / length
    } : { x: 0, y: 0, z: 0 };
  }
};

// 颜色操作
export const ColorUtils = {
  fromHex: (hex: string): Color => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b, a: 1 };
  },
  
  toHex: (color: Color): string => {
    const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
    const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
    const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
};

// 变换操作
export const TransformUtils = {
  identity: (): Transform => ({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 }
  }),
  
  combine: (a: Transform, b: Transform): Transform => ({
    position: VectorUtils.add(a.position, b.position),
    // 旋转和缩放的合并需要更复杂的计算...
    rotation: a.rotation, // 简化示例
    scale: a.scale
  })
};
```

## 🔗 相关模块

- **[Common](../common/README.md)** - 基于Core的通用类型扩展
- **[Animation](../animation/README.md)** - 使用Core的动画类型
- **[Design](../design/README.md)** - 集成Core的设计工具
- **[Media](../media/README.md)** - 扩展Core的媒体类型
- **[RHI](../../rhi/README.md)** - 基于Core的渲染抽象

## 📚 设计理念

Core模块的设计遵循以下原则：

1. **最小化依赖**：Core模块不依赖任何其他规范模块
2. **平台无关**：所有类型都是抽象的，不依赖具体平台
3. **扩展友好**：提供稳定的基础，支持其他模块扩展
4. **类型安全**：完整的TypeScript类型定义
5. **性能优先**：优化的数据结构和最小的运行时开销
6. **标准兼容**：遵循USD等行业标准

通过合理使用Core模块，可以确保整个引擎系统的一致性、可维护性和高性能。 