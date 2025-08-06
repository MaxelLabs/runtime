## 核心枚举定义

### 接口总览

| 名称                  | 泛型参数 | 简要描述                               |
| --------------------- | -------- | -------------------------------------- |
| `ElementType`         | -        | 设计元素类型枚举，统一定义55种元素分类 |
| `BlendMode`           | -        | 混合模式枚举，20种颜色混合算法         |
| `EasingFunction`      | -        | 缓动函数枚举，31种动画时间曲线         |
| `EulerOrder`          | -        | 欧拉角旋转顺序，6种旋转组合方式        |
| `AlignmentType`       | -        | 对齐类型枚举，11种布局对齐策略         |
| `MaterialType`        | -        | 材质类型枚举，9种渲染管线材质          |
| `GradientType`        | -        | 渐变类型枚举，7种颜色渐变模式          |
| `VerticalAlign`       | -        | 垂直对齐枚举，8种文本垂直对齐方式      |
| `StrokePosition`      | -        | 描边位置枚举，3种描边渲染位置          |
| `QualityLevel`        | -        | 质量等级枚举，4级渲染质量设置          |
| `LicenseType`         | -        | 许可证类型枚举，9种开源协议支持        |
| `FilterType`          | -        | 滤镜类型枚举，7种图像调整滤镜          |
| `ColorSpace`          | -        | 色彩空间枚举，6种颜色标准支持          |
| `LoopMode`            | -        | 循环模式枚举，4种动画循环策略          |
| `InterpolationMode`   | -        | 插值模式枚举，4种数值插值算法          |
| `Permission`          | -        | 权限枚举，5种访问权限等级              |
| `AlphaMode`           | -        | Alpha模式枚举，3种透明度处理方式       |
| `FillMode`            | -        | 填充模式枚举，3种几何体渲染模式        |
| `ClickFeedbackType`   | -        | 点击反馈类型枚举，6种交互反馈          |
| `VisualEffectType`    | -        | 视觉效果类型枚举，5种特效类型          |
| `SideMode`            | -        | 面模式枚举，3种面渲染策略              |
| `RenderMode`          | -        | 渲染模式枚举，5种混合渲染模式          |
| `BorderStyle`         | -        | 边框样式枚举，9种边框线型              |
| `MaskMode`            | -        | 遮罩模式枚举，4种遮罩处理方式          |
| `RenderBillboardMode` | -        | 广告牌渲染模式枚举，4种朝向策略        |
| `SortMode`            | -        | 排序模式枚举，5种元素排序策略          |
| `ScaleMode`           | -        | 缩放模式枚举，5种图像缩放策略          |
| `TextWrapMode`        | -        | 文本换行模式枚举，4种换行策略          |
| `WritingMode`         | -        | 书写模式枚举，3种文字方向              |
| `FeedbackType`        | -        | 反馈类型枚举，5种交互反馈              |
| `ShapeType`           | -        | 形状类型枚举，11种几何形状             |
| `PlayState`           | -        | 播放状态枚举，4种媒体播放状态          |
| `PlaybackDirection`   | -        | 播放方向枚举，4种动画方向              |
| `FillModeType`        | -        | 填充模式类型枚举，4种填充行为          |
| `TransformType`       | -        | 变换类型枚举，17种CSS变换函数          |
| `ConstraintType`      | -        | 约束类型枚举，11种布局约束             |
| `ResourceLoadState`   | -        | 资源加载状态枚举，5种加载状态          |
| `DataType`            | -        | 数据类型枚举，12种基本数据类型         |
| `EventType`           | -        | 事件类型枚举，11种事件分类             |
| `StyleType`           | -        | 样式类型枚举，6种样式分类              |
| `LineCap`             | -        | 线条端点样式枚举，3种端点样式          |
| `LineJoin`            | -        | 线条连接样式枚举，3种连接样式          |
| `VertexAttribute`     | -        | 顶点属性枚举，8种顶点数据类型          |

### 枚举总览

| 枚举名           | 成员数量 | 语义范围         | 适用场景                       |
| ---------------- | -------- | ---------------- | ------------------------------ |
| `ElementType`    | 55       | 设计元素完整分类 | UI设计、组件系统、场景构建     |
| `BlendMode`      | 20       | 颜色合成算法     | 渲染管线、特效合成、图层混合   |
| `EasingFunction` | 31       | 动画时间曲线     | 过渡动画、关键帧插值、UI动效   |
| `AlignmentType`  | 11       | 布局对齐策略     | 响应式布局、设计系统、组件对齐 |
| `MaterialType`   | 9        | 材质渲染管线     | 3D渲染、材质系统、着色器选择   |
| `ColorSpace`     | 6        | 颜色标准支持     | 色彩管理、显示适配、HDR支持    |

### 核心接口详解

#### ElementType

**枚举定义**

```tsx
enum ElementType {
  // 基础几何 (10种)
  Rectangle = 'rectangle',
  Ellipse = 'ellipse',
  Circle = 'circle',
  Polygon = 'polygon',
  Star = 'star',
  Vector = 'vector',
  Line = 'line',
  Arrow = 'arrow',
  Path = 'path',

  // 容器 (5种)
  Frame = 'frame',
  Group = 'group',
  Canvas = 'canvas',
  Layer = 'layer',
  Scene = 'scene',

  // 内容 (5种)
  Text = 'text',
  Image = 'image',
  Sprite = 'sprite',
  Icon = 'icon',

  // 媒体元素 (2种)
  Video = 'video',
  Audio = 'audio',

  // 3D元素 (2种)
  Mesh = 'mesh',
  Model = 'model',

  // 特效元素 (2种)
  Particle = 'particle',
  Trail = 'trail',

  // UI元素 (4种)
  Button = 'button',
  Slider = 'slider',
  ProgressBar = 'progressBar',
  Input = 'input',

  // 组件 (2种)
  Component = 'component',
  Instance = 'instance',
}
```

**使用场景**

| 枚举值      | 适用场景                 | 典型用法                      |
| ----------- | ------------------------ | ----------------------------- |
| `Rectangle` | 基础矩形、卡片、容器背景 | `type: ElementType.Rectangle` |
| `Text`      | 文本内容、标签、标题     | `type: ElementType.Text`      |
| `Image`     | 图片展示、背景图、图标   | `type: ElementType.Image`     |
| `Button`    | 交互按钮、操作触发器     | `type: ElementType.Button`    |
| `Mesh`      | 3D模型、复杂几何体       | `type: ElementType.Mesh`      |

#### BlendMode

**枚举定义**

```tsx
enum BlendMode {
  // 基础混合模式 (7种)
  Normal = 'normal',
  Add = 'add',
  Multiply = 'multiply',
  Screen = 'screen',
  Overlay = 'overlay',
  SoftLight = 'soft-light',
  HardLight = 'hard-light',

  // 高级混合模式 (7种)
  ColorDodge = 'color-dodge',
  ColorBurn = 'color-burn',
  Darken = 'darken',
  Lighten = 'lighten',
  Difference = 'difference',
  Exclusion = 'exclusion',

  // 动画专用 (2种)
  Additive = 'additive',
  Override = 'override',

  // 渲染专用 (4种)
  Alpha = 'alpha',
  Premultiplied = 'premultiplied',
  Opaque = 'opaque',
  Transparent = 'transparent',
}
```

**算法说明**

| 枚举值     | 数学公式                | 适用场景       |
| ---------- | ----------------------- | -------------- |
| `Normal`   | `C = A`                 | 标准alpha混合  |
| `Add`      | `C = A + B`             | 发光、叠加效果 |
| `Multiply` | `C = A × B`             | 阴影、暗化效果 |
| `Screen`   | `C = 1 - (1-A) × (1-B)` | 亮化效果       |

#### EasingFunction

**枚举分类**

```tsx
enum EasingFunction {
  // 基础缓动 (4种)
  Linear = 'linear',
  EaseIn = 'ease-in',
  EaseOut = 'ease-out',
  EaseInOut = 'ease-in-out',

  // 回弹缓动 (3种)
  EaseInBack = 'ease-in-back',
  EaseOutBack = 'ease-out-back',
  EaseInOutBack = 'ease-in-out-back',

  // 弹跳缓动 (3种)
  EaseInBounce = 'ease-in-bounce',
  EaseOutBounce = 'ease-out-bounce',
  EaseInOutBounce = 'ease-in-out-bounce',

  // 弹性缓动 (3种)
  EaseInElastic = 'ease-in-elastic',
  EaseOutElastic = 'ease-out-elastic',
  EaseInOutElastic = 'ease-in-out-elastic',
}
```

**缓动曲线特征**

| 类型        | 特征描述 | 适用场景           |
| ----------- | -------- | ------------------ |
| `Linear`    | 匀速运动 | 机械运动、精确控制 |
| `EaseIn`    | 加速开始 | 物体启动、进入效果 |
| `EaseOut`   | 减速结束 | 物体停止、退出效果 |
| `EaseInOut` | 平滑过渡 | 自然运动、UI过渡   |

### 枚举值详解

#### MaterialType

**枚举值详情**

| 枚举值     | 字面量 | 对应字符串   | 使用场景     | 代码示例                      |
| ---------- | ------ | ------------ | ------------ | ----------------------------- |
| `Standard` | `0`    | `'standard'` | 标准PBR材质  | `type: MaterialType.Standard` |
| `Unlit`    | `1`    | `'unlit'`    | 无光照材质   | `type: MaterialType.Unlit`    |
| `Physical` | `2`    | `'physical'` | 物理准确材质 | `type: MaterialType.Physical` |
| `Toon`     | `3`    | `'toon'`     | 卡通渲染材质 | `type: MaterialType.Toon`     |
| `Sprite`   | `4`    | `'sprite'`   | 2D精灵材质   | `type: MaterialType.Sprite`   |
| `UI`       | `5`    | `'ui'`       | 界面渲染材质 | `type: MaterialType.UI`       |
| `Particle` | `6`    | `'particle'` | 粒子系统材质 | `type: MaterialType.Particle` |
| `Skybox`   | `7`    | `'skybox'`   | 天空盒材质   | `type: MaterialType.Skybox`   |
| `Custom`   | `8`    | `'custom'`   | 自定义着色器 | `type: MaterialType.Custom`   |

#### QualityLevel

**枚举值详情**

| 枚举值   | 字面量 | 数值 | 适用场景           | 性能影响     |
| -------- | ------ | ---- | ------------------ | ------------ |
| `Low`    | `0`    | `0`  | 移动设备、低端硬件 | 最低性能消耗 |
| `Medium` | `1`    | `1`  | 中等配置设备       | 平衡性能质量 |
| `High`   | `2`    | `2`  | 桌面设备、高端硬件 | 较高性能消耗 |
| `Ultra`  | `3`    | `3`  | 工作站、高端显卡   | 最高性能消耗 |

### 使用示例

#### 最小可运行片段

```tsx
import { ElementType, BlendMode, EasingFunction } from '@maxellabs/specification/core';

// 基础元素类型定义
const elementType: ElementType = ElementType.Rectangle;

// 基础混合模式使用
const blendMode: BlendMode = BlendMode.Normal;

// 基础缓动函数应用
const easing: EasingFunction = EasingFunction.Linear;
```

#### 常见业务封装

```tsx
// 创建元素类型选择器
function createElementSelector(type: ElementType) {
  const config = {
    [ElementType.Rectangle]: { width: 100, height: 50, fill: '#ff0000' },
    [ElementType.Text]: { fontSize: 16, content: 'Hello World' },
    [ElementType.Image]: { src: '/assets/image.jpg', width: 200, height: 150 },
    [ElementType.Button]: { text: 'Click Me', onClick: () => console.log('clicked') },
  };
  return config[type] || config[ElementType.Rectangle];
}

// 混合模式工具函数
function getBlendModeConfig(mode: BlendMode) {
  const configs = {
    [BlendMode.Normal]: { glBlend: [1, 0], description: '标准alpha混合' },
    [BlendMode.Add]: { glBlend: [1, 1], description: '加法混合' },
    [BlendMode.Multiply]: { glBlend: [0, 0], description: '乘法混合' },
  };
  return configs[mode] || configs[BlendMode.Normal];
}

// 缓动函数映射
function getEasingFunction(name: EasingFunction) {
  const functions = {
    [EasingFunction.Linear]: (t: number) => t,
    [EasingFunction.EaseIn]: (t: number) => t * t,
    [EasingFunction.EaseOut]: (t: number) => 1 - (1 - t) * (1 - t),
    [EasingFunction.EaseInOut]: (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)),
  };
  return functions[name] || functions[EasingFunction.Linear];
}
```

#### 边界 case 处理

```tsx
// 处理无效的元素类型
function validateElementType(type: string): ElementType {
  const validTypes = Object.values(ElementType);
  if (validTypes.includes(type as ElementType)) {
    return type as ElementType;
  }
  console.warn(`Invalid element type: ${type}, falling back to Rectangle`);
  return ElementType.Rectangle;
}

// 处理混合模式兼容性
function getCompatibleBlendMode(mode: BlendMode, platform: string): BlendMode {
  const compatibility = {
    web: [BlendMode.Normal, BlendMode.Add, BlendMode.Multiply],
    mobile: [BlendMode.Normal, BlendMode.Add],
    desktop: Object.values(BlendMode),
  };

  const supported = compatibility[platform] || compatibility.web;
  return supported.includes(mode) ? mode : BlendMode.Normal;
}

// 处理缓动函数精度问题
function preciseEasing(t: number, easing: EasingFunction): number {
  // 确保输入在有效范围内
  t = Math.max(0, Math.min(1, t));

  switch (easing) {
    case EasingFunction.Linear:
      return t;
    case EasingFunction.EaseIn:
      return t * t;
    case EasingFunction.EaseOut:
      return 1 - Math.pow(1 - t, 2);
    case EasingFunction.EaseInOut:
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    default:
      return t;
  }
}
```

### 最佳实践

#### 类型收窄

```tsx
// 使用类型保护确保枚举值有效
function isValidElementType(type: string): type is ElementType {
  return Object.values(ElementType).includes(type as ElementType);
}

// 使用const断言确保类型安全
const VALID_BLEND_MODES = [BlendMode.Normal, BlendMode.Add, BlendMode.Multiply] as const;

type ValidBlendMode = (typeof VALID_BLEND_MODES)[number];

function isValidBlendMode(mode: BlendMode): mode is ValidBlendMode {
  return VALID_BLEND_MODES.includes(mode as ValidBlendMode);
}
```

#### 运行时校验

```tsx
// 运行时枚举值验证
class EnumValidator {
  static validateElementType(type: any): ElementType {
    if (!Object.values(ElementType).includes(type)) {
      throw new Error(`Invalid ElementType: ${type}`);
    }
    return type as ElementType;
  }

  static validateBlendMode(mode: any): BlendMode {
    if (!Object.values(BlendMode).includes(mode)) {
      throw new Error(`Invalid BlendMode: ${mode}`);
    }
    return mode as BlendMode;
  }

  static validateQualityLevel(level: any): QualityLevel {
    if (!Object.values(QualityLevel).includes(level)) {
      console.warn(`Invalid QualityLevel: ${level}, using Medium`);
      return QualityLevel.Medium;
    }
    return level as QualityLevel;
  }
}
```

#### 与后端协议对齐

```tsx
// 后端枚举值映射
const backendMappings = {
  elementType: {
    [ElementType.Rectangle]: 'rect',
    [ElementType.Text]: 'text',
    [ElementType.Image]: 'img',
    [ElementType.Button]: 'btn',
  },
  blendMode: {
    [BlendMode.Normal]: 'normal',
    [BlendMode.Add]: 'add',
    [BlendMode.Multiply]: 'multiply',
  },
};

// 前后端转换
function toBackendEnum<T extends string>(value: T, mapping: Record<T, string>): string {
  return mapping[value] || value;
}

function fromBackendEnum<T extends string>(value: string, mapping: Record<T, string>): T {
  const entry = Object.entries(mapping).find(([_, v]) => v === value);
  return (entry?.[0] as T) || (value as T);
}
```

#### 错误提示国际化

```tsx
// 国际化枚举描述
const enumDescriptions = {
  zh: {
    [ElementType.Rectangle]: '矩形元素',
    [ElementType.Text]: '文本元素',
    [ElementType.Image]: '图片元素',
    [BlendMode.Normal]: '标准混合',
    [BlendMode.Add]: '加法混合',
  },
  en: {
    [ElementType.Rectangle]: 'Rectangle element',
    [ElementType.Text]: 'Text element',
    [ElementType.Image]: 'Image element',
    [BlendMode.Normal]: 'Normal blending',
    [BlendMode.Add]: 'Additive blending',
  },
};

function getEnumDescription<T extends string>(value: T, locale: 'zh' | 'en' = 'zh'): string {
  return enumDescriptions[locale][value] || value;
}
```
