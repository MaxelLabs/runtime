/**
 * Maxellabs 统一接口定义
 * 所有模块共用的接口类型
 */

import type { UsdValue } from './usd';
import type { BlendMode, EasingFunction, ColorSpace, QualityLevel, FeedbackType } from './enums';
import type { BoundingBox, VersionInfo } from './base';

/**
 * 统一变换接口
 */
export interface Transform {
  /**
   * 位置
   */
  position: UsdValue; // Vector3f
  /**
   * 旋转（四元数）
   */
  rotation: UsdValue; // Quatf
  /**
   * 缩放
   */
  scale: UsdValue; // Vector3f
  /**
   * 变换矩阵（可选，优先级高于位置/旋转/缩放）
   */
  matrix?: UsdValue; // Matrix4d
}

/**
 * 统一颜色接口
 */
export interface Color {
  /**
   * 颜色值
   */
  value: UsdValue; // Color4f
  /**
   * 颜色空间
   */
  colorSpace?: ColorSpace;
  /**
   * 是否线性
   */
  linear?: boolean;
}

/**
 * 统一材质属性接口
 */
export interface MaterialProperties {
  /**
   * 基础颜色
   */
  baseColor?: Color;
  /**
   * 透明度
   */
  opacity?: UsdValue; // float
  /**
   * 混合模式
   */
  blendMode?: BlendMode;
  /**
   * 是否双面
   */
  doubleSided?: UsdValue; // bool
  /**
   * 是否投射阴影
   */
  castShadows?: UsdValue; // bool
  /**
   * 是否接收阴影
   */
  receiveShadows?: UsdValue; // bool
}

/**
 * 统一动画属性接口
 */
export interface AnimationProperties {
  /**
   * 是否启用
   */
  enabled?: UsdValue; // bool
  /**
   * 持续时间
   */
  duration?: UsdValue; // float
  /**
   * 是否循环
   */
  loop?: UsdValue; // bool
  /**
   * 播放速度
   */
  speed?: UsdValue; // float
  /**
   * 延迟时间
   */
  delay?: UsdValue; // float
  /**
   * 缓动函数
   */
  easing?: EasingFunction;
}

/**
 * 统一渲染属性接口
 */
export interface RenderingProperties {
  /**
   * 是否可见
   */
  visible?: UsdValue; // bool
  /**
   * 渲染顺序
   */
  renderOrder?: UsdValue; // int
  /**
   * 渲染层级
   */
  renderLayer?: UsdValue; // int
  /**
   * 材质属性
   */
  material?: MaterialProperties;
  /**
   * 边界框
   */
  boundingBox?: BoundingBox;
}

/**
 * 统一交互属性接口
 */
export interface InteractionProperties {
  /**
   * 是否可交互
   */
  interactive?: UsdValue; // bool
  /**
   * 悬停效果
   */
  hover?: HoverEffect;
  /**
   * 点击效果
   */
  click?: ClickEffect;
  /**
   * 选择效果
   */
  selection?: SelectionEffect;
}

/**
 * 悬停效果接口
 */
export interface HoverEffect {
  /**
   * 是否启用
   */
  enabled: UsdValue; // bool
  /**
   * 高亮颜色
   */
  highlightColor?: Color;
  /**
   * 缩放因子
   */
  scaleFactor?: UsdValue; // float
  /**
   * 动画属性
   */
  animation?: AnimationProperties;
}

/**
 * 点击效果接口
 */
export interface ClickEffect {
  /**
   * 是否启用
   */
  enabled: UsdValue; // bool
  /**
   * 反馈类型
   */
  feedbackType?: FeedbackType;
  /**
   * 动画属性
   */
  animation?: AnimationProperties;
}

/**
 * 选择效果接口
 */
export interface SelectionEffect {
  /**
   * 是否启用
   */
  enabled: UsdValue; // bool
  /**
   * 是否多选
   */
  multiSelect?: UsdValue; // bool
  /**
   * 选择颜色
   */
  selectionColor?: Color;
}

/**
 * 性能配置接口
 */
export interface PerformanceConfig {
  /**
   * 质量级别
   */
  qualityLevel?: QualityLevel;
  /**
   * LOD偏移
   */
  lodBias?: UsdValue; // float
  /**
   * 最大纹理尺寸
   */
  maxTextureSize?: UsdValue; // int
  /**
   * 是否启用压缩
   */
  enableCompression?: UsdValue; // bool
  /**
   * 是否启用缓存
   */
  enableCaching?: UsdValue; // bool
}

/**
 * 通用元数据接口
 */
export interface CommonMetadata {
  /**
   * 名称
   */
  name: string;
  /**
   * 描述
   */
  description?: string;
  /**
   * 版本信息
   */
  version: VersionInfo;
  /**
   * 创建者
   */
  creator?: string;
  /**
   * 创建时间
   */
  createdAt?: string;
  /**
   * 最后修改时间
   */
  lastModified?: string;
  /**
   * 标签
   */
  tags?: string[];
  /**
   * 自定义数据
   */
  customData?: Record<string, any>;
}
