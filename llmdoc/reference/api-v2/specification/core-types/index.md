# Specification 核心类型系统 API 文档

## 概述

Specification 库的核心类型系统提供了跨平台、跨模块的统一数据类型定义，深度集成 OpenUSD 标准，为整个 Maxellabs 生态系统提供类型安全的基础设施。

## 核心特性

- **USD 标准集成**: 完全兼容 OpenUSD 规范
- **统一类型系统**: 跨模块的泛型类型支持
- **强类型安全**: TypeScript 完整类型推导
- **跨平台支持**: Web、Native、移动端统一接口

## 基础类型定义

### 原始类型

```typescript
// 基础数据类型
export type UUID = string;
export type Path = string;
export type URL = string;

// 版本信息
interface VersionInfo {
  major: number;        // 主版本号
  minor: number;        // 次版本号
  patch: number;        // 修订版本号
  prerelease?: string;  // 预发布标识
  build?: string;       // 构建元数据
}

// 时间戳
interface Timestamp {
  seconds: number;      // Unix 时间戳（秒）
  nanoseconds: number;  // 纳秒部分
}

// 平台和设备类型
enum PlatformType {
  Web = 'web',
  iOS = 'ios',
  Android = 'android',
  Windows = 'windows',
  macOS = 'macos',
  Linux = 'linux',
}

enum DeviceType {
  Mobile = 'mobile',
  Tablet = 'tablet',
  Desktop = 'desktop',
  TV = 'tv',
  VR = 'vr',
  AR = 'ar',
}
```

### 坐标系和渲染类型

```typescript
// 坐标系类型
enum CoordinateSystem {
  LeftHanded = 0,
  RightHanded = 1,
}

// 像素格式
enum PixelFormat {
  RGB8 = 'rgb8',
  RGBA8 = 'rgba8',
  RGB16F = 'rgb16f',
  RGBA16F = 'rgba16f',
  RGB32F = 'rgb32f',
  RGBA32F = 'rgba32f',
  Depth16 = 'depth16',
  Depth24 = 'depth24',
  Depth32F = 'depth32f',
  Stencil8 = 'stencil8',
}

// 压缩格式
enum CompressionFormat {
  None = 'none',
  DXT1 = 'dxt1',
  DXT3 = 'dxt3',
  DXT5 = 'dxt5',
  BC7 = 'bc7',
  ETC1 = 'etc1',
  ETC2 = 'etc2',
  PVRTC = 'pvrtc',
  ASTC = 'astc',
}
```

## USD 集成类型系统

### USD 基础数据类型

```typescript
// USD 值类型
interface UsdValue {
  type: UsdDataType;
  value: any;
  timeSamples?: Record<number, any>;  // 时间采样数据
}

// USD 数据类型枚举
enum UsdDataType {
  Bool = 'bool',
  Int = 'int',
  Float = 'float',
  Double = 'double',
  String = 'string',
  Token = 'token',
  Asset = 'asset',
  Vector2f = 'float2',
  Vector3f = 'float3',
  Vector4f = 'float4',
  Matrix4d = 'matrix4d',
  Color3f = 'color3f',
  Color4f = 'color4f',
  Point3f = 'point3f',
  Normal3f = 'normal3f',
  Quatf = 'quatf',
  Array = 'array',
}
```

### USD Prim 系统

```typescript
// USD Prim 基础接口
interface UsdPrim {
  path: string;                    // Prim 路径
  typeName: string;                // Prim 类型名称
  active: boolean;                 // 是否激活
  attributes: Record<string, UsdValue>;  // 属性集合
  relationships: Record<string, string[]>; // 关系集合
  metadata: Record<string, any>;   // 元数据
  children: UsdPrim[];             // 子 Prim
  variantSets?: Record<string, UsdVariantSet>; // 变体集合
  references?: UsdReference[];     // 引用
  payloads?: UsdPayload[];         // 载荷
}

// USD 变体系统
interface UsdVariantSet {
  name: string;                    // 变体集合名称
  selection: string;               // 当前选择的变体
  variants: Record<string, UsdVariant>; // 变体列表
}

interface UsdVariant {
  name: string;                    // 变体名称
  primSpecs: UsdPrim[];            // 变体内容
}
```

### USD 组合系统

```typescript
// USD 引用和载荷
interface UsdReference {
  assetPath: string;               // 资产路径
  primPath?: string;               // 目标路径
  layerOffset?: UsdLayerOffset;    // 层偏移
}

interface UsdPayload {
  assetPath: string;               // 资产路径
  primPath?: string;               // 目标路径
  layerOffset?: UsdLayerOffset;    // 层偏移
}

interface UsdLayerOffset {
  offset: number;                  // 偏移量
  scale: number;                   // 缩放
}

// USD 组合弧类型
enum UsdCompositionArcType {
  SubLayer = 'subLayer',
  Reference = 'reference',
  Payload = 'payload',
  Inherit = 'inherit',
  Specialize = 'specialize',
  VariantSet = 'variantSet',
}
```

### USD Stage 和 Layer

```typescript
// USD Stage
interface UsdStage {
  rootLayer: UsdLayer;             // 根层
  sessionLayer?: UsdLayer;         // 会话层
  pseudoRoot: UsdPrim;             // 根 Prim
  defaultPrim?: string;            // 默认 Prim
  timeCodesPerSecond: number;      // 时间码
  startTimeCode: number;           // 开始时间码
  endTimeCode: number;             // 结束时间码
  framesPerSecond: number;         // 帧率
}

// USD Layer
interface UsdLayer {
  identifier: string;              // 层标识符
  version: string;                 // 层版本
  documentation?: string;          // 文档字符串
  subLayers: string[];             // 子层
  primSpecs: Record<string, UsdPrim>; // Prim 规范
  defaultPrim?: string;            // 默认 Prim
  timeCodesPerSecond?: number;     // 时间码
  startTimeCode?: number;          // 开始时间码
  endTimeCode?: number;            // 结束时间码
  framesPerSecond?: number;        // 帧率
  customLayerData?: Record<string, any>; // 自定义层数据
}
```

## 统一泛型系统

### 核心泛型接口

```typescript
// 统一关键帧泛型
interface UnifiedKeyframe<T = any> {
  time: number;                    // 时间
  value: T;                        // 值
  interpolation?: InterpolationMode; // 插值模式
  inTangent?: Vector2Like;         // 输入切线
  outTangent?: Vector2Like;        // 输出切线
  bezierControlPoints?: Vector2Like[]; // 贝塞尔控制点
}

// 统一动画轨道泛型
interface UnifiedAnimationTrack<T = any> {
  name: string;                    // 轨道名称
  targetPath: string;              // 目标路径
  keyframes: UnifiedKeyframe<T>[]; // 关键帧列表
  interpolation?: InterpolationMode; // 默认插值模式
  enabled?: boolean;               // 是否启用
  loopMode?: LoopMode;             // 循环模式
  weight?: number;                 // 权重
}

// 基础纹理引用泛型
interface BaseTextureRef {
  id: string;                      // 纹理ID
  path: string;                    // 纹理路径
  type: TextureType;               // 纹理类型
  format?: PixelFormat;            // 像素格式
  compression?: CompressionFormat; // 压缩格式
  mipmap?: boolean;                // 是否生成mipmap
  wrapS?: TextureWrapMode;         // S方向包裹模式
  wrapT?: TextureWrapMode;         // T方向包裹模式
  wrapR?: TextureWrapMode;         // R方向包裹模式
}
```

## 核心接口定义

### 变换系统

```typescript
// 3D 变换接口
interface ITransform {
  position: Vector3Like;           // 位置
  rotation: QuaternionLike;        // 旋转（四元数）
  scale: Vector3Like;              // 缩放
  matrix?: Matrix4Like;            // 变换矩阵（可选）
  anchor?: Vector3Like;            // 锚点（可选）
  space?: TransformSpace;          // 变换空间
}

// 变换空间枚举
enum TransformSpace {
  World = 'world',                 // 世界空间
  Local = 'local',                 // 本地空间
  Parent = 'parent',               // 父级空间
  Screen = 'screen',               // 屏幕空间
  View = 'view',                   // 视图空间
}
```

### 材质属性

```typescript
// 核心材质属性
interface MaterialProperties {
  name: string;                    // 材质名称
  type: MaterialType;              // 材质类型
  baseColor: ColorLike;            // 基础颜色
  opacity: number;                 // 透明度

  // PBR 属性
  metallic?: number;               // 金属度
  roughness?: number;              // 粗糙度
  emissiveColor?: ColorLike;       // 自发光颜色
  emissiveIntensity?: number;      // 自发光强度

  // 高级属性
  normalScale?: number;            // 法线强度
  occlusionStrength?: number;      // 遮挡强度
  ior?: number;                    // 折射率
  transmission?: number;           // 透射
  thickness?: number;              // 厚度
  anisotropy?: number;             // 各向异性
  clearcoat?: number;              // 清漆
  subsurface?: number;             // 次表面散射
}
```

### 动画属性

```typescript
// 核心动画属性
interface AnimationProperties {
  enabled?: UsdValue;              // 是否启用
  duration?: UsdValue;             // 持续时间
  loop?: UsdValue;                 // 是否循环
  speed?: UsdValue;                // 播放速度
  delay?: UsdValue;                // 延迟时间
  easing?: EasingFunction;         // 缓动函数
}

// 完整事件配置
interface FullEventConfig {
  type: string;                    // 事件类型
  name?: string;                   // 事件名称
  time: number;                    // 触发时间（秒）
  parameters?: Record<string, any>; // 事件参数
  callback?: string;               // 事件回调
}
```

## 交互系统

```typescript
// 核心交互属性
interface InteractionProperties {
  interactive?: UsdValue;          // 是否可交互
  hover?: HoverEffect;             // 悬停效果
  click?: ClickEffect;             // 点击效果
  selection?: SelectionEffect;     // 选择效果
}

// 悬停效果
interface HoverEffect {
  enabled: boolean;                // 是否启用
  delay: number;                   // 悬停延迟（毫秒）
  highlightColor?: ColorLike;      // 高亮颜色
  scaleFactor?: number;            // 缩放因子
  opacityChange?: number;          // 透明度变化
  animation?: AnimationProperties; // 动画配置
  cursor?: string;                 // 光标样式
  tooltip?: string;                // 工具提示
}

// 点击效果
interface ClickEffect {
  enabled: boolean;                // 是否启用
  feedbackType: ClickFeedbackType; // 反馈类型
  animation?: AnimationProperties; // 动画配置
  sound?: string;                  // 音效
  vibration?: VibrationPattern;    // 震动
  visualEffect?: VisualEffect;     // 视觉效果
}
```

## 通用元数据

```typescript
// 通用元数据接口
interface CommonMetadata {
  name: string;                    // 名称
  description?: string;            // 描述
  version: VersionInfo;            // 版本信息
  creator?: string;                // 创建者
  createdAt?: string;              // 创建时间
  lastModified?: string;           // 最后修改时间
  tags?: string[];                 // 标签
  customData?: Record<string, any>; // 自定义数据
}
```

## 实际应用示例

### USD 文件读写示例

```typescript
import { UsdStage, UsdPrim, UsdDataType } from '@maxellabs/specification';

// 创建 USD Stage
const stage: UsdStage = {
  rootLayer: {
    identifier: 'root.usda',
    version: '1.0',
    primSpecs: {},
    timeCodesPerSecond: 24,
    framesPerSecond: 24,
  },
  pseudoRoot: {
    path: '/',
    typeName: '',
    active: true,
    attributes: {},
    relationships: {},
    metadata: {},
    children: [],
  },
  timeCodesPerSecond: 24,
  startTimeCode: 0,
  endTimeCode: 120,
  framesPerSecond: 24,
};

// 添加 Prim
const meshPrim: UsdPrim = {
  path: '/World/Mesh',
  typeName: 'Mesh',
  active: true,
  attributes: {
    'points': {
      type: UsdDataType.Vector3f,
      value: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
    },
    'normals': {
      type: UsdDataType.Normal3f,
      value: [[0, 0, 1], [0, 0, 1], [0, 0, 1]],
    },
    'primvars:st': {
      type: UsdDataType.Vector2f,
      value: [[0, 0], [1, 0], [0, 1]],
    },
  },
  relationships: {
    'material': ['/World/Materials/DefaultMaterial'],
  },
  metadata: {
    'displayName': 'Triangle Mesh',
    'visible': true,
  },
  children: [],
};

// 使用 USD 值类型
const animatedValue: UsdValue = {
  type: UsdDataType.Float,
  value: 1.0,
  timeSamples: {
    0: 1.0,
    24: 2.0,
    48: 1.5,
    72: 3.0,
  },
};
```

### 类型安全验证示例

```typescript
import {
  UsdDataType,
  MaterialProperties,
  ITransform,
  validateUsdValue,
  validateMaterial
} from '@maxellabs/specification';

// USD 值类型验证
function processUsdValue(value: UsdValue): any {
  switch (value.type) {
    case UsdDataType.Float:
      return parseFloat(value.value);
    case UsdDataType.Vector3f:
      return new Float32Array(value.value);
    case UsdDataType.Color3f:
      return {
        r: value.value[0],
        g: value.value[1],
        b: value.value[2],
      };
    default:
      return value.value;
  }
}

// 材质属性验证
function createMaterial(config: Partial<MaterialProperties>): MaterialProperties {
  return {
    name: config.name || 'DefaultMaterial',
    type: config.type || MaterialType.Standard,
    baseColor: config.baseColor || [1, 1, 1, 1],
    opacity: config.opacity ?? 1.0,
    metallic: config.metallic ?? 0.0,
    roughness: config.roughness ?? 0.5,
    ...config,
  };
}

// 变换系统使用
function applyTransform(object: any, transform: ITransform): void {
  if (transform.matrix) {
    // 使用矩阵
    object.setMatrix(transform.matrix);
  } else {
    // 使用分解的变换
    object.setPosition(transform.position);
    object.setRotation(transform.rotation);
    object.setScale(transform.scale);
  }

  if (transform.anchor) {
    object.setAnchor(transform.anchor);
  }
}
```

### 统一泛型使用示例

```typescript
import {
  UnifiedKeyframe,
  UnifiedAnimationTrack,
  BaseTextureRef
} from '@maxellabs/specification';

// 创建动画轨道
const positionTrack: UnifiedAnimationTrack<[number, number, number]> = {
  name: 'position',
  targetPath: '/World/Cube.transform',
  keyframes: [
    { time: 0, value: [0, 0, 0] },
    { time: 1, value: [5, 0, 0], interpolation: InterpolationMode.Linear },
    { time: 2, value: [5, 5, 0], interpolation: InterpolationMode.Cubic },
  ],
  interpolation: InterpolationMode.Linear,
  enabled: true,
  loopMode: LoopMode.Loop,
};

// 创建纹理引用
const albedoTexture: BaseTextureRef = {
  id: 'albedo_texture_001',
  path: '/assets/textures/albedo.png',
  type: TextureType.Albedo,
  format: PixelFormat.RGBA8,
  compression: CompressionFormat.BC7,
  mipmap: true,
  wrapS: TextureWrapMode.Repeat,
  wrapT: TextureWrapMode.Repeat,
};

// 类型安全的动画处理
function processAnimationTrack<T>(track: UnifiedAnimationTrack<T>): void {
  track.keyframes.forEach(keyframe => {
    console.log(`Time: ${keyframe.time}, Value:`, keyframe.value);
  });
}
```

## 与其他库的集成

### 与 RHI 库集成

```typescript
import { RHIDevice, RHICommandEncoder } from '@maxellabs/rhi';
import { IMaterial, PixelFormat, CompressionFormat } from '@maxellabs/specification';

// 材质到 RHI 管线的转换
function createRenderPipeline(
  device: RHIDevice,
  material: IMaterial
): RHIRenderPipeline {
  return device.createRenderPipeline({
    label: material.attributes.name.value,
    layout: 'auto',
    vertex: {
      module: createShaderModule(material.shaderNetwork),
      entryPoint: 'vertex_main',
    },
    fragment: {
      module: createShaderModule(material.shaderNetwork),
      entryPoint: 'fragment_main',
      targets: [{
        format: material.properties.renderTargetFormat || PixelFormat.RGBA8,
        blend: material.properties.blendState,
      }],
    },
    depthStencil: material.properties.depthState,
    multisample: material.properties.multisampleState,
  });
}
```

### 与 Math 库集成

```typescript
import { Vector3, Matrix4, Quaternion } from '@maxellabs/math';
import { ITransform, UsdKeyframe } from '@maxellabs/specification';

// USD 关键帧到数学类型转换
function convertUsdKeyframe(keyframe: UsdKeyframe): any {
  return {
    time: keyframe.time,
    value: keyframe.value,
    inTangent: keyframe.inTangent ?
      new Vector2(keyframe.inTangent.x, keyframe.inTangent.y) : undefined,
    outTangent: keyframe.outTangent ?
      new Vector2(keyframe.outTangent.x, keyframe.outTangent.y) : undefined,
  };
}

// 变换矩阵计算
function computeTransformMatrix(transform: ITransform): Matrix4 {
  const mat = new Matrix4();
  if (transform.matrix) {
    mat.fromArray(transform.matrix);
  } else {
    mat.compose(
      new Vector3().fromArray(transform.position),
      new Quaternion().fromArray(transform.rotation),
      new Vector3().fromArray(transform.scale)
    );
  }
  return mat;
}
```

## 类型推导和验证

### TypeScript 类型推导

```typescript
// 自动类型推导
function createTypedValue<T>(value: T): UsdValue {
  const type = inferUsdType(value);
  return {
    type,
    value,
  };
}

// 类型推断函数
function inferUsdType(value: any): UsdDataType {
  if (typeof value === 'boolean') return UsdDataType.Bool;
  if (typeof value === 'number') return UsdDataType.Float;
  if (typeof value === 'string') return UsdDataType.String;
  if (Array.isArray(value)) {
    switch (value.length) {
      case 2: return UsdDataType.Vector2f;
      case 3: return UsdDataType.Vector3f;
      case 4: return UsdDataType.Vector4f;
      default: return UsdDataType.Array;
    }
  }
  return UsdDataType.String;
}

// 运行时类型验证
function validateUsdPrim(prim: any): prim is UsdPrim {
  return typeof prim.path === 'string' &&
         typeof prim.typeName === 'string' &&
         typeof prim.active === 'boolean' &&
         typeof prim.attributes === 'object' &&
         typeof prim.relationships === 'object' &&
         Array.isArray(prim.children);
}
```

### USD 兼容性检查

```typescript
// USD 版本兼容性
interface USDVersion {
  major: number;
  minor: number;
  patch: number;
}

const CURRENT_USD_VERSION: USDVersion = { major: 0, minor: 24, patch: 5 };

function checkUSDCompatibility(version: USDVersion): boolean {
  if (version.major !== CURRENT_USD_VERSION.major) {
    return false;
  }
  return version.minor <= CURRENT_USD_VERSION.minor;
}

// 属性类型兼容性
const USD_TYPE_COMPATIBILITY: Record<UsdDataType, string[]> = {
  [UsdDataType.Float]: ['number', 'Number'],
  [UsdDataType.Vector3f]: ['Array', 'Float32Array', 'Vector3'],
  [UsdDataType.Color3f]: ['Array', 'Color', 'Vector3'],
  // ... 更多类型映射
};

function isTypeCompatible(usdType: UsdDataType, jsType: string): boolean {
  const compatibleTypes = USD_TYPE_COMPATIBILITY[usdType] || [];
  return compatibleTypes.includes(jsType);
}
```

## 最佳实践

### 1. 类型安全使用

```typescript
// ✅ 推荐：使用类型推断
const value: UsdValue = createTypedValue([1, 2, 3]); // 自动推导为 Vector3f

// ❌ 避免：手动指定可能错误的类型
const badValue: UsdValue = {
  type: UsdDataType.Vector3f,
  value: [1, 2], // 长度不匹配
};
```

### 2. USD 路径规范

```typescript
// ✅ 推荐：使用标准路径格式
const primPath = '/World/Geometry/Mesh_001';

// ✅ 推荐：使用属性命名空间
const attributePath = 'xformOp:translate';

// ❌ 避免：不规范的路径格式
const badPath = 'world.geometry.mesh';
```

### 3. 元数据管理

```typescript
// ✅ 推荐：完整的元数据
const metadata: CommonMetadata = {
  name: 'Material_001',
  description: 'PBR material with metallic workflow',
  version: { major: 1, minor: 0, patch: 0 },
  creator: 'Maxellabs Material System',
  createdAt: new Date().toISOString(),
  tags: ['pbr', 'metallic', 'procedural'],
  customData: {
    template: 'metallic_roughness',
    version: '1.2.0',
  },
};
```

## 总结

Specification 核心类型系统提供了：

1. **完整的 USD 集成**：原生支持 OpenUSD 规范
2. **强类型安全**：TypeScript 完整类型推导和验证
3. **统一泛型系统**：跨模块的类型一致性
4. **跨平台兼容**：统一的抽象层
5. **丰富的工具函数**：类型转换、验证、推导等

该类型系统是整个 Maxellabs 生态系统的基础，确保了各个模块之间的类型安全和数据一致性。