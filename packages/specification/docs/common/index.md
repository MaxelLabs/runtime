# 通用模块文档

通用模块定义了Maxellabs中跨模块共享的基础类型，包括帧动画、材质、渲染接口等核心组件。

## 接口总览

| 接口名称                                                             | 描述           | 主要属性                                |
| -------------------------------------------------------------------- | -------------- | --------------------------------------- |
| [AnimationKeyframe](./interfaces.md#animationkeyframe)               | 动画关键帧定义 | time, value, interpolation, easing      |
| [AnimationTrack](./interfaces.md#animationtrack)                     | 动画轨道定义   | name, targetPath, keyframes, enabled    |
| [FrameAnimationClip](./interfaces.md#frameanimationclip)             | 帧动画剪辑     | name, duration, tracks, loop            |
| [FrameAnimationController](./interfaces.md#frameanimationcontroller) | 动画控制器     | clips, playState, time, speed           |
| [CommonMaterial](./interfaces.md#commonmaterial)                     | 通用材质定义   | id, name, properties, renderPriority    |
| [MaterialVariant](./interfaces.md#materialvariant)                   | 材质变体定义   | name, baseMaterialId, propertyOverrides |

## 枚举总览

| 枚举名称                                                    | 描述           | 可选值                                                                                                                                                     |
| ----------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [FrameAnimationType](./enums.md#frameanimationtype)         | 帧动画类型     | Sequence, Keyframe, Skeletal, Morph, Procedural, Physics                                                                                                   |
| [AnimationFrameDataType](./enums.md#animationframedatatype) | 动画帧数据类型 | Position, Rotation, Scale, Opacity, Color, UV, MorphWeight, Custom                                                                                         |
| [CommonTextureSlot](./enums.md#commontextureslot)           | 通用纹理槽     | Main, Normal, Height, Occlusion, Emission                                                                                                                  |
| [MaterialConditionType](./enums.md#materialconditiontype)   | 材质条件类型   | DeviceType, QualityLevel, Platform, GraphicsAPI, GPUTier, MemoryLimit, ScreenResolution, FeatureSupport, BandwidthLimit, PowerMode, UserPreference, Custom |

## 核心接口详解

### FrameAnimationClip

帧动画剪辑是动画系统的核心数据结构，定义了一个完整的动画序列。

```typescript
interface FrameAnimationClip {
  name: string; // 动画名称
  duration: number; // 持续时间（秒）
  frameRate: number; // 帧率
  tracks: AnimationTrack[]; // 动画轨道列表
  loop: boolean; // 是否循环
  loopCount?: number; // 循环次数（-1为无限）
  events?: AnimationEvent[]; // 动画事件
  properties?: AnimationProperties; // 动画属性
}
```

### CommonMaterial

通用材质定义，支持跨平台的材质系统。

```typescript
interface CommonMaterial {
  id: string; // 材质ID
  name: string; // 材质名称
  type: MaterialType; // 材质类型
  enabled: boolean; // 是否启用
  properties: CommonMaterialProperties; // 材质属性
  renderPriority?: number; // 渲染优先级
  receiveShadows?: boolean; // 接受阴影
  castShadows?: boolean; // 投射阴影
  tags?: string[]; // 标签
  metadata?: CommonMetadata; // 元数据
}
```

### AnimationTrack

动画轨道定义了特定属性的动画曲线。

```typescript
interface AnimationTrack {
  name: string; // 轨道名称
  targetPath: string; // 目标路径
  propertyName: string; // 属性名称
  dataType: AnimationFrameDataType; // 数据类型
  keyframes: AnimationKeyframe[]; // 关键帧列表
  enabled: boolean; // 是否启用
  weight: number; // 权重
  blendMode?: 'override' | 'additive' | 'multiply'; // 混合模式
}
```

## 枚举值详解

### FrameAnimationType

定义支持的帧动画类型：

- **Sequence** - 序列帧动画：基于图像序列的逐帧动画
- **Keyframe** - 关键帧动画：基于关键插值的动画
- **Skeletal** - 骨骼动画：基于骨骼系统的角色动画
- **Morph** - 变形动画：顶点变形动画
- **Procedural** - 程序化动画：算法生成的动画
- **Physics** - 物理模拟动画：基于物理引擎的动画

### AnimationFrameDataType

定义动画帧支持的数据类型：

- **Position** - 位置动画：控制对象的空间位置
- **Rotation** - 旋转动画：控制对象的旋转角度
- **Scale** - 缩放动画：控制对象的大小变化
- **Opacity** - 透明度动画：控制对象的透明度
- **Color** - 颜色动画：控制对象的颜色变化
- **UV** - 纹理坐标动画：控制纹理的UV坐标
- **MorphWeight** - 变形权重动画：控制变形目标的权重
- **Custom** - 自定义属性动画：用户自定义属性的动画

### CommonTextureSlot

定义材质支持的纹理槽位：

- **Main** - 主纹理：基础颜色纹理
- **Normal** - 法线贴图：表面法线信息
- **Height** - 高度贴图：表面高度信息
- **Occlusion** - 遮挡贴图：环境光遮挡信息
- **Emission** - 自发光贴图：自发光颜色信息

### MaterialConditionType

定义材质变体的条件类型：

- **DeviceType** - 设备类型：移动端/桌面端适配
- **QualityLevel** - 质量等级：低/中/高/超高画质
- **Platform** - 平台类型：iOS/Android/Web/Windows等
- **GraphicsAPI** - 图形API：OpenGL/Vulkan/Metal/DirectX
- **GPUTier** - GPU性能等级：GPU性能分级
- **MemoryLimit** - 内存限制：设备内存容量限制
- **ScreenResolution** - 屏幕分辨率：适配不同分辨率
- **FeatureSupport** - 特性支持：HDR/PBR/实时光照等
- **BandwidthLimit** - 带宽限制：影响纹理质量
- **PowerMode** - 电源模式：移动设备节能模式
- **UserPreference** - 用户偏好：用户自定义设置
- **Custom** - 自定义条件：开发者自定义条件

## 使用示例

### 帧动画配置

```typescript
const frameAnimation: FrameAnimationClip = {
  name: 'character_walk',
  duration: 2.5,
  frameRate: 30,
  tracks: [
    {
      name: 'position_x',
      targetPath: 'character.position',
      propertyName: 'x',
      dataType: AnimationFrameDataType.Position,
      keyframes: [
        { time: 0, value: 0, interpolation: InterpolationMode.Linear },
        { time: 1, value: 10, interpolation: InterpolationMode.Bezier },
        { time: 2.5, value: 25, interpolation: InterpolationMode.Linear },
      ],
      enabled: true,
      weight: 1.0,
      blendMode: 'override',
    },
  ],
  loop: true,
  loopCount: -1,
};
```

### 材质配置

```typescript
const material: CommonMaterial = {
  id: 'metal_material_001',
  name: 'PBR Metal',
  type: MaterialType.PBR,
  enabled: true,
  properties: {
    color: [0.8, 0.8, 0.8, 1.0],
    opacity: 1.0,
    blendMode: BlendMode.Opaque,
    textures: [
      {
        textureId: 'metal_albedo',
        slot: CommonTextureSlot.Main,
        scale: [1, 1],
        offset: [0, 0],
      },
      {
        textureId: 'metal_normal',
        slot: CommonTextureSlot.Normal,
        scale: [1, 1],
        offset: [0, 0],
      },
    ],
    uvAnimation: {
      speedU: 0.1,
      speedV: 0,
      enabled: false,
      playMode: LoopMode.Loop,
    },
    doubleSided: false,
    depthWrite: true,
    depthTest: true,
  },
  renderPriority: 0,
  receiveShadows: true,
  castShadows: true,
  tags: ['metal', 'pbr', 'realistic'],
};
```

### 动画层配置

```typescript
const animationLayers: AnimationLayer[] = [
  {
    name: 'base_layer',
    weight: 1.0,
    blendMode: 'override',
    clip: 'idle_animation',
    mask: { bones: ['spine', 'legs'] },
  },
  {
    name: 'upper_body_layer',
    weight: 0.8,
    blendMode: 'additive',
    clip: 'wave_animation',
    mask: { bones: ['arms', 'head'] },
  },
];
```

### 材质变体配置

```typescript
const materialVariants: MaterialVariant[] = [
  {
    name: 'mobile_low',
    baseMaterialId: 'metal_material_001',
    propertyOverrides: {
      textures: [
        {
          textureId: 'metal_albedo_mobile',
          slot: CommonTextureSlot.Main,
          scale: [1, 1],
          offset: [0, 0],
        },
      ],
    },
    conditions: [
      {
        type: MaterialConditionType.DeviceType,
        value: 'mobile',
        operator: ComparisonOperator.Equals,
      },
      {
        type: MaterialConditionType.QualityLevel,
        value: 'low',
        operator: ComparisonOperator.LessThanOrEqual,
      },
    ],
  },
];
```

## 最佳实践

### 类型收窄

使用类型守卫确保动画数据类型安全：

```typescript
function isPositionAnimation(dataType: AnimationFrameDataType): dataType is AnimationFrameDataType.Position {
  return dataType === AnimationFrameDataType.Position;
}

function processAnimationTrack(track: AnimationTrack) {
  if (isPositionAnimation(track.dataType)) {
    // 位置动画专用处理
    track.keyframes.forEach((kf) => {
      // 安全地处理位置数据
      const position = kf.value as [number, number, number];
    });
  }
}
```

### 性能优化

```typescript
const optimizedMaterial: CommonMaterial = {
  id: 'optimized_material',
  name: 'Optimized Material',
  type: MaterialType.PBR,
  enabled: true,
  properties: {
    color: [1, 1, 1, 1],
    opacity: 1,
    blendMode: BlendMode.Opaque,
    textures: [], // 减少纹理使用
    doubleSided: false,
    depthWrite: true,
    depthTest: true,
  },
  renderPriority: 0,
  receiveShadows: false, // 禁用阴影接收
  castShadows: false, // 禁用阴影投射
};
```

### 跨平台兼容性

```typescript
const adaptiveAnimation: FrameAnimationClip = {
  name: 'adaptive_animation',
  duration: isMobile() ? 1.0 : 2.0, // 移动端缩短动画
  frameRate: isLowEndDevice() ? 15 : 30, // 低端设备降低帧率
  tracks: tracks.filter((t) => !isHighQualityProperty(t.propertyName)),
  loop: true,
};
```

### 国际化配置

```typescript
const localizedMaterial: CommonMaterial = {
  id: 'localized_material',
  name: t('material.metal.name'), // 国际化名称
  type: MaterialType.PBR,
  enabled: true,
  properties: {
    color: getLocalizedColor('metal_base'), // 地区化颜色
    opacity: 1,
    blendMode: BlendMode.Opaque,
    textures: [
      {
        textureId: getLocalizedTexture('metal_albedo'),
        slot: CommonTextureSlot.Main,
        scale: [1, 1],
        offset: [0, 0],
      },
    ],
  },
  tags: [t('tag.metal'), t('tag.realistic')],
};
```

## 变更日志

### v2.1.0 (2024-07-20)

- 新增程序化动画支持 (FrameAnimationType.Procedural)
- 优化材质变体系统，支持12种条件类型
- 提升动画压缩效率 25%

### v2.0.0 (2024-06-15)

- 重构动画系统，支持骨骼动画
- 新增材质条件系统
- 支持动画层混合

### v1.5.0 (2024-05-10)

- 添加UV动画支持
- 支持纹理坐标动画
- 新增法线贴图支持

### v1.0.0 (2024-04-01)

- 初始版本发布
- 支持基础帧动画系统
- 支持通用材质定义
