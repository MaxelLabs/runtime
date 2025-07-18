# Maxellabs 核心模块

核心模块提供 Maxellabs 3D Engine 的基础类型定义和统一接口规范。

## 功能概述

核心模块包含了所有子系统共用的基础类型、枚举和接口，确保整个引擎的类型一致性和可扩展性。

## 主要组件

### 基础类型 (base.ts)

- **通用数学类型**: 从 @maxellabs/math 库重导出的 IVector2, IVector3, IVector4, IColor, IQuaternion, IMatrix3x3, IMatrix4x4 等
- **版本信息**: VersionInfo, 支持语义化版本管理
- **基础几何**: BoundingBox3D, BoundingSphere 等（从 math 库重导出）
- **USD兼容**: 完全兼容USD格式的数据类型
- **重构说明**: 移除重复数学类型定义，统一使用 math 库

### 统一枚举 (enums.ts)

包含了从各个模块抽离出来的通用枚举类型：

#### 动画相关

- **PlayState**: 统一的播放状态 (Playing, Paused, Stopped, Finished)
- **PlaybackDirection**: 播放方向 (Normal, Reverse, Alternate, AlternateReverse)
- **LoopMode**: 循环模式 (None, Loop, PingPong, Clamp)
- **BlendMode**: 混合模式 (Normal, Add, Multiply, Screen, Overlay等)
- **EasingFunction**: 缓动函数类型 (Linear, EaseIn, EaseOut等)

#### 变换相关

- **TransformType**: 变换类型 (Translate, Scale, Rotate, Skew等)
- **InterpolationMode**: 插值模式 (Linear, Step, Cubic, Bezier)

#### 布局相关

- **AlignmentType**: 对齐方式 (Left, Center, Right, Top, Middle, Bottom等)
- **ConstraintType**: 约束类型 (Left, Right, Center, Top, Bottom等)

#### 元素相关

- **ElementType**: 元素类型 (Rectangle, Ellipse, Text, Image, Component等)
- **StyleType**: 样式类型 (Fill, Stroke, Text, Shadow, Blur, Effect)
- **DataType**: 数据类型 (Boolean, Integer, Float, String, Vector等)
- **EventType**: 事件类型 (Start, Pause, Stop, Click, Hover等)

#### 渲染相关

- **MaterialType**: 材质类型 (Standard, Unlit, Physical等)
- **FilterType**: 滤镜类型
- **ColorSpace**: 颜色空间
- **QualityLevel**: 质量级别

### 核心接口 (interfaces.ts)

包含了从各个模块抽离出来的通用接口：

#### 基础配置接口

- **BaseAnimationConfig**: 通用动画配置基础接口
- **BaseEvent**: 通用事件配置接口
- **BaseController**: 通用控制器接口
- **BaseComponentProperty**: 通用组件属性定义
- **BaseStyle**: 通用样式配置
- **BaseParameter**: 通用参数定义

#### 变换和约束

- **TransformFunction**: 通用变换函数接口
- **ConstraintConfig**: 通用约束配置接口

#### 3D渲染

- **Transform**: 基础3D变换接口
- **MaterialProperties**: 核心材质属性
- **RenderingProperties**: 渲染属性
- **CoreBoundingBox**: 3D边界框（核心版本）

#### 交互和效果

- **InteractionProperties**: 交互属性
- **ClickEffect**: 点击效果
- **HoverEffect**: 悬停效果
- **SelectionEffect**: 选择效果
- **VisualEffect**: 视觉效果

### USD支持 (usd.ts)

- **UsdPrim**: USD基础图元接口
- **UsdValue**: USD值类型定义
- **UsdAttribute**: USD属性接口
- **UsdRelationship**: USD关系接口

## 设计原则

### 1. 类型统一

所有模块使用相同的基础类型，避免重复定义和类型不一致。

### 2. 扩展性

核心类型设计为可扩展的，子模块可以通过继承和组合来实现特定功能。

### 3. USD兼容

完全兼容USD格式，支持与标准3D制作流程的无缝集成。

### 4. 性能优化

类型设计考虑了运行时性能，避免不必要的类型转换和内存开销。

## 使用示例

```typescript
import {
  PlayState,
  BlendMode,
  TransformType,
  BaseAnimationConfig,
  MaterialProperties,
} from '@maxellabs/specification/core';

// 使用统一的动画配置
const animConfig: BaseAnimationConfig = {
  name: 'fadeIn',
  duration: 1.0,
  easing: 'ease-in-out',
  loopMode: 'none',
};

// 使用统一的材质属性
const material: MaterialProperties = {
  name: 'StandardMaterial',
  type: 'standard',
  baseColor: [1, 1, 1, 1],
  opacity: 1.0,
  metallic: 0.0,
  roughness: 0.5,
};
```

## 模块关系

核心模块作为所有其他模块的基础：

- **Animation模块**: 继承核心动画类型，添加USD特有和扩展缓动功能
- **Design模块**: 继承核心约束、样式类型，添加设计系统特有功能
- **Common模块**: 使用核心类型构建通用组件接口
- **其他模块**: 都基于核心类型构建特定功能

## 版本兼容性

核心模块遵循语义化版本管理：

- **主版本号**: 不兼容的API更改
- **次版本号**: 向后兼容的功能新增
- **修订号**: 向后兼容的问题修正

## 注意事项

1. **导入顺序**: 其他模块应先导入核心模块类型
2. **类型扩展**: 使用继承而非修改核心类型
3. **命名规范**: 遵循统一的命名约定
4. **文档更新**: 修改核心类型时需要更新相关文档
