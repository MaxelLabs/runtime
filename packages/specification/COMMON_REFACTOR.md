# Common 模块重构总结

## 概述

本次重构将原本分散在各个系统（游戏、动效、设计、图片）中的共通元素统一抽取到 `common` 文件夹中，实现了跨系统的代码复用和一致性。

## 重构内容

### 1. 创建的 Common 模块结构

```
packages/specification/src/common/
├── index.ts              # 主入口文件
├── elements.ts           # 通用元素基础接口
├── text.ts              # 通用文本元素
├── image.ts             # 通用图像元素
├── sprite.ts            # 通用精灵元素
├── frame.ts             # 通用帧动画元素
├── transform.ts         # 通用变换
├── animation.ts         # 通用动画
├── rendering.ts         # 通用渲染
├── interaction.ts       # 通用交互
├── material.ts          # 通用材质
└── texture.ts           # 通用纹理
```

### 2. 抽取的跨系统共通元素

#### 2.1 文本相关

- **文本对齐**: `TextAlign` (左对齐、居中、右对齐、两端对齐等)
- **字体样式**: `FontStyle` (正常、斜体、倾斜)
- **字体粗细**: `FontWeight` (100-900数值范围)
- **文本装饰**: `TextDecoration` (下划线、删除线、上划线等)
- **文本变换**: `TextTransform` (大写、小写、首字母大写等)
- **文本溢出**: `TextOverflow` (可见、隐藏、省略、裁剪)
- **文本换行**: `WordWrap` (正常、强制换行、保持所有、不换行)
- **文本阴影**: `TextShadow` (偏移、模糊半径、颜色)

#### 2.2 图像相关

- **图像缩放模式**: `ImageScaleMode` (填充、适应、裁剪、平铺、拉伸、原始大小)
- **图像格式**: `ImageFormat` (JPEG、PNG、WebP、SVG、GIF等)
- **图像滤镜**: `ImageFilter` (模糊、亮度、对比度、饱和度等)
- **图像调整**: `ImageAdjustment` (亮度、对比度、曝光、伽马值等)
- **图像变换**: `ImageTransform` (翻转、旋转、裁剪)
- **九宫格图像**: `NineSliceImageElement` (支持九宫格缩放)

#### 2.3 精灵相关

- **精灵类型**: `SpriteType` (2D、广告牌、UI、平铺、九宫格)
- **精灵对齐**: `SpriteAlignment` (中心、顶左、顶中、顶右等9种对齐方式)
- **精灵图集**: `SpriteAtlas` (纹理、帧定义、元数据)
- **精灵帧**: `SpriteFrame` (名称、位置、尺寸、旋转、修剪信息)
- **精灵动画**: `SpriteAnimation` (帧序列、帧率、循环、状态机)

#### 2.4 帧动画相关

- **帧动画类型**: `FrameAnimationType` (序列、关键帧、骨骼、变形、粒子)
- **帧插值类型**: `FrameInterpolationType` (线性、步进、贝塞尔、样条)
- **帧数据类型**: `FrameDataType` (位置、旋转、缩放、透明度、颜色等)
- **动画剪辑**: `FrameAnimationClip` (帧序列、持续时间、循环模式)
- **动画控制器**: `AnimationController` (播放状态、时间、速度、权重)

#### 2.5 变换相关

- **数学类型**: `Vector2/3/4`、`Quaternion`、`Matrix2x2/3x3/4x4`
- **变换空间**: `TransformSpace` (世界、本地、父级、屏幕、视图)
- **旋转顺序**: `RotationOrder` (XYZ、XZY、YXZ、YZX、ZXY、ZYX)
- **变换约束**: `TransformConstraint` (位置、旋转、缩放、注视、路径、父级)
- **边界框**: `BoundingBox`、`BoundingBox2D`
- **变换层次**: `TransformHierarchy` (父子关系管理)

#### 2.6 动画相关

- **播放状态**: `AnimationPlayState` (播放、暂停、停止、完成)
- **循环模式**: `AnimationLoopMode` (无、循环、往返、反向)
- **混合模式**: `AnimationBlendMode` (覆盖、叠加、相乘、减法等)
- **缓动类型**: `EasingType` (线性、缓入、缓出、弹性、反弹等)
- **动画事件**: `AnimationEvent` (开始、暂停、完成、循环等)
- **动画状态机**: `AnimationStateMachine` (状态、转换、条件、遮罩)

#### 2.7 渲染相关

- **渲染模式**: `RenderMode` (不透明、透明、镂空、叠加、相乘)
- **剔除模式**: `CullMode` (无、正面、背面)
- **深度测试**: `DepthTest` (禁用、小于、小于等于、等于等)
- **渲染队列**: `RenderQueue` (背景、几何体、透明几何体、覆盖层)
- **光照模式**: `LightingMode` (无光照、顶点光照、像素光照、物理光照)
- **阴影类型**: `ShadowType` (无、硬阴影、软阴影、级联阴影)

#### 2.8 交互相关

- **交互事件**: `InteractionEventType` (鼠标、触摸、键盘、拖拽、焦点等)
- **交互状态**: `InteractionState` (正常、悬停、按下、选中、禁用等)
- **鼠标按钮**: `MouseButton` (左键、中键、右键)
- **触摸类型**: `TouchType` (直接、间接、触控笔)
- **命中区域**: `HitAreaType` (矩形、圆形、椭圆、多边形、路径等)
- **点击反馈**: `ClickFeedbackType` (无、缩放、闪烁、涟漪、反弹、旋转)

#### 2.9 材质相关

- **材质类型**: `MaterialType` (标准、无光照、物理、卡通、精灵等)
- **纹理类型**: `TextureType` (漫反射、法线、高度、金属度、粗糙度等)
- **纹理过滤**: `TextureFilter` (最近邻、线性、双线性、三线性、各向异性)
- **纹理包装**: `TextureWrap` (重复、钳制、镜像、钳制到边框)
- **材质变体**: `MaterialVariant` (支持多种材质变体)

#### 2.10 纹理相关

- **纹理格式**: `TextureFormat` (RGB、RGBA、灰度、深度、压缩格式等)
- **纹理目标**: `TextureTarget` (2D、立方体、3D、2D数组、立方体数组)
- **纹理用途**: `TextureUsage` (静态、动态、流、渲染目标)
- **加载状态**: `TextureLoadingState` (未加载、加载中、已加载、失败、已卸载)
- **流式策略**: `TextureStreamStrategy` (基于距离、屏幕大小、重要性、混合)

### 3. 解决的命名冲突

通过以下策略解决了模块间的命名冲突：

1. **命名空间导出**: 主入口文件使用命名空间导出避免冲突

   ```typescript
   export * as Common from './common';
   export * as Design from './design';
   export * as Media from './media';
   ```

2. **选择性导出**: 在子模块中使用选择性导出避免重复

   ```typescript
   export {
     SpecificType1,
     SpecificType2,
     // ... 其他类型
   } from './module';
   ```

3. **类型重命名**: 对冲突的类型进行重命名
   ```typescript
   export { ConstraintType as TransformConstraintType } from './transform';
   export { AnimationMask as CommonAnimationMask } from './animation';
   ```

### 4. 兼容性处理

为了保持向后兼容性，在各个模块中创建了类型别名：

```typescript
// 为了保持向后兼容性，创建别名
export type TextStyle = MediaTextStyle;
export type TextElement = MediaTextElement;
export type TextOverflow = MediaTextOverflow;
```

### 5. 接口继承优化

优化了接口继承关系，避免类型冲突：

```typescript
// 设计元素继承通用元素，但排除冲突的属性
export interface DesignElement extends Omit<CommonElement, 'type' | 'children' | 'constraints'> {
  type: DesignElementType;
  children?: DesignElement[];
  constraints?: DesignConstraints;
}
```

## 使用方式

### 1. 导入通用类型

```typescript
import { Common } from '@maxellabs/specification';

// 使用通用文本类型
const textElement: Common.CommonTextElement = {
  // ...
};

// 使用通用图像类型
const imageElement: Common.CommonImageElement = {
  // ...
};
```

### 2. 导入特定系统类型

```typescript
import { Design, Media } from '@maxellabs/specification';

// 使用设计系统类型
const designElement: Design.DesignElement = {
  // ...
};

// 使用媒体系统类型
const mediaText: Media.MediaTextElement = {
  // ...
};
```

## 优势

1. **代码复用**: 避免了重复定义相同的类型和接口
2. **一致性**: 确保跨系统使用相同的数据结构和枚举值
3. **维护性**: 统一管理共通类型，减少维护成本
4. **扩展性**: 新系统可以直接使用已有的通用类型
5. **类型安全**: TypeScript 提供完整的类型检查和智能提示

## 构建结果

- ✅ 编译成功，无 TypeScript 错误
- ✅ 生成了完整的类型声明文件
- ✅ 支持 ES 模块和 CommonJS 两种格式
- ⚠️ 有一些警告但不影响功能（主要是重复导出警告）

## 后续优化建议

1. 进一步细化命名空间，减少重复导出警告
2. 考虑将更多特定系统的类型迁移到 common 模块
3. 添加更多的工具类型和辅助函数
4. 完善文档和使用示例
