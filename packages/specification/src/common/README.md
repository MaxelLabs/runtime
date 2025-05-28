# Common 通用模块

Maxellabs 3D Engine 的通用类型库，提供所有系统共通的基础类型、接口和组件定义。这个模块是整个规范体系的核心，被设计、动画、媒体、渲染等各个模块广泛使用。

## 📁 模块结构

### 🎯 核心文件

| 文件 | 描述 | 主要功能 |
|------|------|----------|
| `index.ts` | 模块入口 | 统一导出所有通用类型 |
| `elements.ts` | 基础元素 | 通用元素类型、约束、布局系统 |
| `animation.ts` | 动画基础 | 动画状态、控制器、混合器、关键帧 |
| `image.ts` | 图像处理 | 图像元素、缩放模式、滤镜、变换 |
| `text.ts` | 文本基础 | 文本样式、对齐方式、装饰效果 |
| `sprite.ts` | 精灵系统 | 精灵类型、图集、动画、九宫格 |
| `frame.ts` | 帧动画 | 帧序列、动画控制、缓存管理 |
| `material.ts` | 材质基础 | 材质类型、纹理配置、渲染属性 |
| `texture.ts` | 纹理系统 | 纹理类型、滤镜、包装模式、流化 |
| `transform.ts` | 变换系统 | 坐标变换、约束、空间转换 |
| `interaction.ts` | 交互系统 | 事件处理、状态管理、反馈机制 |
| `rendering.ts` | 渲染基础 | 渲染配置、深度测试、光照模式 |

## 🚀 核心能力

### 1. 基础元素系统 (`elements.ts`)

**功能特性：**
- 统一的元素类型定义
- 灵活的约束系统
- 多种布局模式支持
- 溢出处理机制

**主要类型：**
```typescript
// 通用元素基础类型
enum CommonElementType {
  Text = 'text',
  Image = 'image',
  Sprite = 'sprite',
  Frame = 'frame',
  Group = 'group',
  Rectangle = 'rectangle',
  Circle = 'circle',
  // ... 更多类型
}

// 通用元素接口
interface CommonElement {
  id: string;
  name: string;
  type: CommonElementType;
  transform: Transform;
  visible: boolean;
  constraints?: Constraint[];
  children?: CommonElement[];
  metadata?: CommonMetadata;
}

// 约束系统
interface Constraint {
  type: ConstraintType;
  target?: string;
  value: number | string;
  axis?: 'x' | 'y' | 'both';
}
```

**使用示例：**
```typescript
import { CommonElement, CommonElementType, ConstraintType } from '@maxellabs/specification/common';

const button: CommonElement = {
  id: 'btn_submit',
  name: 'Submit Button',
  type: CommonElementType.Rectangle,
  transform: {
    position: { x: 100, y: 50, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 }
  },
  visible: true,
  constraints: [
    { type: ConstraintType.Fixed, value: 100, axis: 'x' },
    { type: ConstraintType.Percentage, value: 0.5, axis: 'y' }
  ]
};
```

### 2. 动画基础系统 (`animation.ts`)

**功能特性：**
- 完整的动画状态管理
- 多层动画混合
- 灵活的关键帧系统
- 动画事件处理

**主要组件：**
```typescript
// 动画播放状态
enum AnimationPlayState {
  Playing = 'playing',
  Paused = 'paused',
  Stopped = 'stopped',
  Finished = 'finished'
}

// 动画循环模式
enum AnimationLoopMode {
  None = 'none',
  Loop = 'loop',
  PingPong = 'ping-pong',
  Reverse = 'reverse'
}

// 动画控制器
interface AnimationController {
  playState: AnimationPlayState;
  currentTime: number;
  playbackSpeed: number;
  enabled: boolean;
  weight: number;
  currentLoop: number;
  direction: number;
}

// 动画关键帧
interface AnimationKeyframe {
  time: number;
  value: any;
  interpolation: 'linear' | 'step' | 'bezier' | 'spline';
  easing?: EasingType;
  bezierControlPoints?: {
    inTangent: [number, number];
    outTangent: [number, number];
  };
}
```

**使用示例：**
```typescript
import { 
  AnimationController, 
  AnimationKeyframe, 
  AnimationLoopMode,
  AnimationPlayState 
} from '@maxellabs/specification/common';

const fadeController: AnimationController = {
  playState: AnimationPlayState.Playing,
  currentTime: 0,
  playbackSpeed: 1.0,
  enabled: true,
  weight: 1.0,
  currentLoop: 0,
  direction: 1
};

const fadeKeyframes: AnimationKeyframe[] = [
  { time: 0, value: 0, interpolation: 'linear', easing: 'ease-in' },
  { time: 1, value: 1, interpolation: 'linear', easing: 'ease-out' }
];
```

### 3. 图像处理系统 (`image.ts`)

**功能特性：**
- 多种图像格式支持
- 灵活的缩放模式
- 图像滤镜和调整
- 九宫格图像支持

**主要类型：**
```typescript
// 图像缩放模式
enum ImageScaleMode {
  Fill = 'fill',      // 填充
  Fit = 'fit',        // 适应
  Crop = 'crop',      // 裁剪
  Tile = 'tile',      // 平铺
  Stretch = 'stretch', // 拉伸
  None = 'none'       // 原始大小
}

// 图像格式
enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WebP = 'webp',
  SVG = 'svg',
  GIF = 'gif',
  AVIF = 'avif'
}

// 通用图像元素
interface CommonImageElement extends CommonElement {
  type: CommonElementType.Image;
  source: string;
  scaleMode: ImageScaleMode;
  format?: ImageFormat;
  filters?: ImageFilter[];
  adjustment?: ImageAdjustment;
  imageTransform?: ImageTransform;
}
```

**使用示例：**
```typescript
import { CommonImageElement, ImageScaleMode, ImageFormat } from '@maxellabs/specification/common';

const heroImage: CommonImageElement = {
  id: 'hero_img',
  name: 'Hero Image',
  type: 'image',
  source: '/assets/hero.webp',
  scaleMode: ImageScaleMode.Crop,
  format: ImageFormat.WebP,
  transform: { /* ... */ },
  visible: true,
  adjustment: {
    brightness: 0.1,
    contrast: 0.2,
    saturation: 0.1
  }
};
```

### 4. 文本系统 (`text.ts`)

**功能特性：**
- 丰富的文本样式选项
- 多种对齐方式
- 文本装饰效果
- 溢出处理

**主要类型：**
```typescript
// 文本对齐
enum TextAlign {
  Left = 'left',
  Center = 'center',
  Right = 'right',
  Justify = 'justify'
}

// 字体样式
enum FontStyle {
  Normal = 'normal',
  Italic = 'italic',
  Oblique = 'oblique'
}

// 字体粗细
enum FontWeight {
  Thin = 100,
  ExtraLight = 200,
  Light = 300,
  Normal = 400,
  Medium = 500,
  SemiBold = 600,
  Bold = 700,
  ExtraBold = 800,
  Black = 900
}

// 通用文本样式
interface CommonTextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  fontStyle: FontStyle;
  color: Color;
  textAlign: TextAlign;
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: TextDecoration;
  textTransform?: TextTransform;
  textShadow?: TextShadow;
}
```

### 5. 精灵系统 (`sprite.ts`)

**功能特性：**
- 多种精灵类型支持
- 精灵图集管理
- 精灵动画控制
- 九宫格精灵支持

**主要类型：**
```typescript
// 精灵类型
enum SpriteType {
  Sprite2D = '2d',
  Billboard = 'billboard',
  UI = 'ui',
  Tiled = 'tiled',
  NineSlice = 'nine-slice'
}

// 精灵对齐
enum SpriteAlignment {
  Center = 'center',
  TopLeft = 'top-left',
  TopCenter = 'top-center',
  TopRight = 'top-right',
  MiddleLeft = 'middle-left',
  MiddleRight = 'middle-right',
  BottomLeft = 'bottom-left',
  BottomCenter = 'bottom-center',
  BottomRight = 'bottom-right'
}

// 通用精灵元素
interface CommonSpriteElement extends CommonElement {
  type: CommonElementType.Sprite;
  atlas: SpriteAtlas;
  currentFrame: string;
  spriteType: SpriteType;
  alignment: SpriteAlignment;
  animation?: SpriteAnimation;
}
```

### 6. 材质系统 (`material.ts`)

**功能特性：**
- 多种材质类型
- 纹理配置管理
- 渲染属性控制
- 自定义着色器支持

**主要类型：**
```typescript
// 材质类型
enum MaterialType {
  Standard = 'standard',
  Unlit = 'unlit',
  Physical = 'physical',
  Toon = 'toon',
  Custom = 'custom'
}

// 通用材质配置
interface CommonMaterialConfig {
  type: MaterialType;
  shader?: string;
  textures: Record<string, TextureConfig>;
  uniforms: Record<string, any>;
  renderState: RenderState;
  features: MaterialFeature[];
}
```

### 7. 纹理系统 (`texture.ts`)

**功能特性：**
- 多种纹理类型和格式
- 纹理滤镜和包装
- 纹理流化和加载
- 压缩纹理支持

**使用示例：**
```typescript
import { 
  CommonTextureConfig, 
  TextureType, 
  TextureFilter, 
  TextureWrap 
} from '@maxellabs/specification/common';

const diffuseTexture: CommonTextureConfig = {
  source: '/textures/wood_diffuse.jpg',
  type: TextureType.Diffuse,
  filter: TextureFilter.Trilinear,
  wrap: TextureWrap.Repeat,
  format: 'rgba',
  dataType: 'unsigned-byte',
  generateMipmaps: true,
  flipY: true
};
```

### 8. 变换系统 (`transform.ts`)

**功能特性：**
- 3D变换矩阵支持
- 多种变换空间
- 变换约束系统
- 旋转顺序控制

**主要类型：**
```typescript
// 变换空间
enum TransformSpace {
  World = 'world',
  Local = 'local',
  Parent = 'parent',
  Screen = 'screen',
  View = 'view'
}

// 通用变换
interface Transform {
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
  space?: TransformSpace;
  matrix?: Matrix4x4;
}

// 变换约束
interface TransformConstraint {
  type: TransfromConstraintType;
  target?: string;
  space: TransformSpace;
  weight: number;
  enabled: boolean;
}
```

### 9. 交互系统 (`interaction.ts`)

**功能特性：**
- 完整的事件系统
- 交互状态管理
- 多种反馈机制
- 触摸和鼠标支持

**主要类型：**
```typescript
// 交互事件类型
enum InteractionEventType {
  MouseEnter = 'mouse-enter',
  MouseLeave = 'mouse-leave',
  Click = 'click',
  TouchStart = 'touch-start',
  DragStart = 'drag-start',
  // ... 更多事件类型
}

// 交互状态
enum InteractionState {
  Normal = 'normal',
  Hover = 'hover',
  Pressed = 'pressed',
  Selected = 'selected',
  Disabled = 'disabled'
}

// 通用交互配置
interface CommonInteractionConfig {
  enabled: boolean;
  events: InteractionEventConfig[];
  states: InteractionStateConfig[];
  hitArea?: HitArea;
  feedback?: InteractionFeedback;
}
```

## 🎮 使用指南

### 创建复合元素

```typescript
import { 
  CommonElement, 
  CommonTextElement, 
  CommonImageElement,
  CommonElementType 
} from '@maxellabs/specification/common';

// 创建一个包含图像和文本的按钮
const createButton = (text: string, icon: string): CommonElement => {
  const buttonGroup: CommonElement = {
    id: 'btn_group',
    name: 'Button Group',
    type: CommonElementType.Group,
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 }
    },
    visible: true,
    children: [
      {
        id: 'btn_bg',
        name: 'Button Background',
        type: CommonElementType.Rectangle,
        transform: { /* ... */ },
        visible: true
      } as CommonElement,
      {
        id: 'btn_icon',
        name: 'Button Icon',
        type: CommonElementType.Image,
        source: icon,
        scaleMode: 'fit',
        transform: { /* ... */ },
        visible: true
      } as CommonImageElement,
      {
        id: 'btn_text',
        name: 'Button Text',
        type: CommonElementType.Text,
        content: text,
        style: {
          fontFamily: 'Arial',
          fontSize: 16,
          fontWeight: 600,
          color: { r: 1, g: 1, b: 1, a: 1 }
        },
        transform: { /* ... */ },
        visible: true
      } as CommonTextElement
    ]
  };
  
  return buttonGroup;
};
```

### 动画序列创建

```typescript
import { 
  AnimationTimeline, 
  AnimationTimelineTrack, 
  AnimationKeyframe 
} from '@maxellabs/specification/common';

const createFadeInAnimation = (): AnimationTimeline => {
  const fadeTrack: AnimationTimelineTrack = {
    name: 'opacity_fade',
    targetId: 'target_element',
    property: 'opacity',
    keyframes: [
      { time: 0, value: 0, interpolation: 'linear', easing: 'ease-in' },
      { time: 1, value: 1, interpolation: 'linear', easing: 'ease-out' }
    ],
    enabled: true,
    weight: 1.0,
    blendMode: 'override'
  };

  return {
    name: 'FadeIn',
    duration: 1000,
    tracks: [fadeTrack],
    events: [
      { 
        type: 'start', 
        name: 'fade_start', 
        time: 0,
        callback: 'onFadeStart'
      },
      { 
        type: 'complete', 
        name: 'fade_complete', 
        time: 1000,
        callback: 'onFadeComplete'
      }
    ],
    loop: false,
    speed: 1.0
  };
};
```

### 材质配置

```typescript
import { 
  CommonMaterialConfig, 
  MaterialType, 
  TextureType 
} from '@maxellabs/specification/common';

const createPBRMaterial = (): CommonMaterialConfig => {
  return {
    type: MaterialType.Physical,
    shader: 'pbr_standard',
    textures: {
      diffuse: {
        source: '/textures/wood_diffuse.jpg',
        type: TextureType.Diffuse,
        filter: 'trilinear',
        wrap: 'repeat'
      },
      normal: {
        source: '/textures/wood_normal.jpg',
        type: TextureType.Normal,
        filter: 'linear',
        wrap: 'repeat'
      },
      roughness: {
        source: '/textures/wood_roughness.jpg',
        type: TextureType.Roughness,
        filter: 'linear',
        wrap: 'repeat'
      }
    },
    uniforms: {
      baseColor: [1.0, 1.0, 1.0, 1.0],
      metallic: 0.0,
      roughness: 0.8,
      emissive: [0.0, 0.0, 0.0]
    },
    renderState: {
      blendMode: 'opaque',
      cullMode: 'back',
      depthTest: true,
      depthWrite: true
    },
    features: ['normal_mapping', 'pbr_lighting']
  };
};
```

## ⚠️ 注意事项

### 类型导入建议

```typescript
// ✅ 推荐：从主模块导入
import { CommonElement, AnimationController, TextAlign } from '@maxellabs/specification/common';

// ✅ 推荐：按需导入特定模块
import { CommonImageElement, ImageScaleMode } from '@maxellabs/specification/common/image';

// ❌ 避免：导入整个模块
import * as Common from '@maxellabs/specification/common';
```

### 性能优化建议

1. **元素层级优化**
   ```typescript
   // ✅ 好的做法：合理的层级结构
   const optimizedStructure = {
     maxDepth: 5,
     childrenCount: 10,
     useGroups: true
   };

   // ❌ 避免：过深的嵌套
   const badStructure = {
     maxDepth: 20,
     childrenCount: 100,
     flatStructure: true
   };
   ```

2. **纹理优化**
   ```typescript
   // ✅ 推荐的纹理配置
   const optimizedTexture = {
     maxSize: 2048,
     format: 'compressed',
     mipmaps: true,
     streaming: true
   };
   ```

3. **动画优化**
   ```typescript
   // ✅ 高效的关键帧配置
   const optimizedKeyframes = [
     { time: 0, value: start, interpolation: 'linear' },
     { time: 1, value: end, interpolation: 'linear' }
   ];
   ```

### 兼容性说明

- **类型安全**：所有接口都提供完整的 TypeScript 类型定义
- **向后兼容**：通过可选属性和默认值保证向后兼容性
- **跨平台**：所有类型都是平台无关的抽象定义
- **扩展性**：支持通过继承和组合进行扩展

### 调试和测试

```typescript
// 元素验证辅助函数
const validateElement = (element: CommonElement): boolean => {
  return !!(
    element.id &&
    element.name &&
    element.type &&
    element.transform
  );
};

// 动画状态调试
const debugAnimation = (controller: AnimationController) => {
  console.log(`Animation State: ${controller.playState}`);
  console.log(`Current Time: ${controller.currentTime}`);
  console.log(`Speed: ${controller.playbackSpeed}`);
};
```

## 🔗 相关模块

- **[Core](../core/README.md)** - 核心类型和枚举定义
- **[Animation](../animation/README.md)** - 动画系统扩展
- **[Design](../design/README.md)** - 设计工具特定类型
- **[Media](../media/README.md)** - 媒体处理扩展
- **[Rendering](../rendering/README.md)** - 渲染系统扩展

## 📚 最佳实践

### 1. 类型组合使用

```typescript
// 组合多个通用类型创建复杂组件
interface GameCharacter extends CommonElement {
  type: CommonElementType.Group;
  avatar: CommonImageElement;
  healthBar: CommonElement;
  nameLabel: CommonTextElement;
  animations: AnimationController[];
  materials: CommonMaterialConfig[];
}
```

### 2. 状态管理

```typescript
// 使用通用接口管理组件状态
interface ComponentState {
  interaction: InteractionState;
  animation: AnimationPlayState;
  visibility: boolean;
  transform: Transform;
}
```

### 3. 事件处理

```typescript
// 标准化事件处理模式
interface EventHandler {
  type: InteractionEventType;
  callback: (event: InteractionEvent) => void;
  conditions?: InteractionCondition[];
}
```

通过合理使用 Common 模块的类型系统，可以构建出类型安全、性能优化且易于维护的 3D 应用程序。 