# Maxellabs 通用模块

通用模块提供跨系统的共享组件和接口，基于核心模块构建高级的通用功能。

## 功能概述

通用模块在核心模块基础上，构建了各个子系统都会使用的通用组件、接口和工具类，确保代码复用和一致性。

## 主要组件

### 动画相关 (animation.ts)
使用核心模块类型构建的通用动画接口：

- **CommonAnimationConfig**: 通用动画配置（继承BaseAnimationConfig）
- **AnimationEvent**: 动画事件（继承BaseEvent）
- **AnimationController**: 动画控制器（继承BaseController）
- **AnimationMixer**: 动画混合器和状态机
- **AnimationParameter**: 动画参数（继承BaseParameter）

```typescript
import { AnimationEvent, CommonAnimationConfig } from '@maxellabs/specification/common';
import { PlayState, BlendMode } from '@maxellabs/specification/core';

// 使用通用动画配置
const fadeConfig: CommonAnimationConfig = {
  name: 'fadeIn',
  duration: 1.0,
  easing: 'ease-in-out',
  blendMode: 'normal'
};

// 动画事件
const startEvent: AnimationEvent = {
  type: 'start',
  name: 'fade-start',
  time: 0,
  parameters: { target: 'button' }
};
```

### 帧动画 (frame.ts)
关键帧动画的通用实现：

- **AnimationKeyframe**: 动画关键帧
- **AnimationTrack**: 动画轨道
- **FrameAnimationClip**: 帧动画剪辑
- **FrameAnimationController**: 帧动画控制器
- **SequenceFrameElement**: 序列帧元素

```typescript
import { AnimationKeyframe, AnimationTrack } from '@maxellabs/specification/common';
import { InterpolationMode } from '@maxellabs/specification/core';

// 创建关键帧
const keyframe: AnimationKeyframe = {
  time: 0.5,
  value: { x: 10, y: 20, z: 0 },
  interpolation: InterpolationMode.Bezier,
  bezierControlPoints: {
    inTangent: [0.3, 0],
    outTangent: [0.7, 1]
  }
};

// 创建动画轨道
const track: AnimationTrack = {
  name: 'position',
  targetPath: '/Character/Root',
  propertyName: 'position',
  dataType: 'position',
  keyframes: [keyframe],
  enabled: true,
  weight: 1.0,
  blendMode: 'override'
};
```

### 元素系统 (elements.ts)
通用元素定义和层次结构：

- **CommonElement**: 通用元素基类
- **ElementHierarchy**: 元素层次结构
- **ElementTransform**: 元素变换
- **ElementVisibility**: 元素可见性

### 交互系统 (interaction.ts)
跨平台的交互处理：

- **InteractionEvent**: 交互事件
- **GestureRecognizer**: 手势识别
- **InputDevice**: 输入设备
- **InteractionHandler**: 交互处理器

```typescript
import { InteractionEvent, GestureRecognizer } from '@maxellabs/specification/common';

// 交互事件
const clickEvent: InteractionEvent = {
  type: 'click',
  timestamp: Date.now(),
  position: { x: 100, y: 200 },
  device: 'mouse',
  modifiers: ['ctrl']
};

// 手势识别
const tapGesture: GestureRecognizer = {
  type: 'tap',
  minimumTaps: 1,
  maximumTaps: 2,
  threshold: 10,
  timeout: 300
};
```

### 变换系统 (transform.ts)
通用变换操作：

- **CommonTransform**: 通用变换（扩展核心Transform）
- **TransformConstraint**: 变换约束
- **TransformAnimation**: 变换动画
- **TransformMatrix**: 变换矩阵操作

### 文本系统 (text.ts)
文本处理和排版：

- **TextLayout**: 文本布局
- **TextStyle**: 文本样式
- **RichText**: 富文本
- **TextMeasurement**: 文本测量

### 图像系统 (image.ts)
图像处理和管理：

- **ImageResource**: 图像资源
- **ImageFilter**: 图像滤镜
- **ImageProcessor**: 图像处理器
- **ImageAtlas**: 图像图集

### 精灵系统 (sprite.ts)
2D精灵动画：

- **SpriteAnimation**: 精灵动画
- **SpriteSequence**: 精灵序列
- **SpriteAtlas**: 精灵图集
- **SpriteMaterial**: 精灵材质

### 纹理系统 (texture.ts)
纹理管理：

- **TextureResource**: 纹理资源
- **TextureConfiguration**: 纹理配置
- **TextureAtlas**: 纹理图集
- **TextureCompression**: 纹理压缩

### 材质系统 (material.ts)
通用材质定义：

- **CommonMaterial**: 通用材质（扩展核心MaterialProperties）
- **MaterialVariant**: 材质变体
- **MaterialTemplate**: 材质模板
- **MaterialInstance**: 材质实例

### 渲染系统 (rendering.ts)
渲染配置和状态：

- **RenderState**: 渲染状态
- **RenderQueue**: 渲染队列
- **RenderTarget**: 渲染目标
- **RenderPass**: 渲染通道

## 与核心模块的关系

通用模块基于核心模块构建：

### 继承核心类型
```typescript
// 重新导出核心类型
export { PlayState as AnimationPlayState } from '@maxellabs/specification/core';
export { BlendMode as AnimationBlendMode } from '@maxellabs/specification/core';

// 扩展核心接口
interface CommonAnimationConfig extends BaseAnimationConfig {
  // 可以添加通用扩展字段
}

interface AnimationController extends BaseController {
  // 可以添加控制器特有字段
}
```

### 使用核心枚举
```typescript
import { 
  PlayState, 
  BlendMode, 
  TransformType,
  EventType 
} from '@maxellabs/specification/core';

// 在通用接口中使用核心枚举
interface AnimationState {
  playState: PlayState;
  blendMode: BlendMode;
}
```

## 设计原则

### 1. 跨模块复用
提供各个子系统都需要的通用功能，避免重复实现。

### 2. 一致性保证
确保不同模块使用相同的基础组件和接口。

### 3. 扩展友好
为特定模块提供可扩展的基础实现。

### 4. 性能优化
通用组件考虑性能需求，提供高效的实现。

## 使用示例

### 创建通用动画
```typescript
import { 
  CommonAnimationConfig,
  AnimationController,
  AnimationEvent 
} from '@maxellabs/specification/common';
import { PlayState } from '@maxellabs/specification/core';

// 动画配置
const slideConfig: CommonAnimationConfig = {
  name: 'slideIn',
  duration: 0.8,
  delay: 0.2,
  easing: 'ease-out',
  autoPlay: true
};

// 动画控制器
const controller: AnimationController = {
  playState: PlayState.Playing,
  currentTime: 0,
  playbackSpeed: 1.0,
  enabled: true,
  weight: 1.0,
  currentLoop: 0,
  direction: 1
};

// 动画事件
const completeEvent: AnimationEvent = {
  type: 'complete',
  time: 0.8,
  callback: 'onSlideComplete'
};
```

### 处理交互事件
```typescript
import { 
  InteractionEvent,
  GestureRecognizer,
  InteractionHandler 
} from '@maxellabs/specification/common';

// 创建手势识别器
const pinchGesture: GestureRecognizer = {
  type: 'pinch',
  minimumTouches: 2,
  maximumTouches: 2,
  threshold: 0.1
};

// 交互处理器
const zoomHandler: InteractionHandler = {
  gestures: [pinchGesture],
  onGestureStart: (event) => {
    console.log('Pinch started', event);
  },
  onGestureUpdate: (event) => {
    // 处理缩放逻辑
  },
  onGestureEnd: (event) => {
    console.log('Pinch ended', event);
  }
};
```

### 文本布局和样式
```typescript
import { 
  TextLayout,
  TextStyle,
  RichText 
} from '@maxellabs/specification/common';
import { AlignmentType } from '@maxellabs/specification/core';

// 文本样式
const titleStyle: TextStyle = {
  fontFamily: 'Arial',
  fontSize: 24,
  fontWeight: 700,
  color: [0, 0, 0, 1],
  textAlign: AlignmentType.Center
};

// 富文本内容
const richContent: RichText = {
  content: 'Welcome to **Maxellabs**!',
  styles: {
    default: titleStyle,
    bold: { fontWeight: 700 }
  },
  markup: 'markdown'
};

// 文本布局
const layout: TextLayout = {
  bounds: { x: 0, y: 0, width: 300, height: 100 },
  textStyle: titleStyle,
  wordWrap: true,
  lineHeight: 1.2,
  alignment: AlignmentType.Center
};
```

## 模块特色

### 1. 统一抽象
为不同平台和设备提供统一的抽象层。

### 2. 高度复用
组件设计考虑最大化复用，减少代码重复。

### 3. 类型安全
完整的TypeScript类型定义，确保类型安全。

### 4. 性能优化
关键路径优化，支持高性能应用场景。

## 版本历史

- **v1.2.0**: 重构模块，基于核心模块重新设计
- **v1.1.0**: 添加交互系统和手势识别
- **v1.0.0**: 初始版本，基础通用组件

## 注意事项

1. **依赖关系**: 必须先导入core模块
2. **性能考虑**: 通用组件需要考虑各种使用场景的性能
3. **兼容性**: 保持向后兼容性，谨慎修改公共接口
4. **文档维护**: 通用组件需要详细的使用文档和示例 