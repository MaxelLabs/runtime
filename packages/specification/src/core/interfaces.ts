/**
 * Maxellabs 统一接口定义
 * 所有模块共用的接口类型
 */

import type { UsdValue } from './usd';
import type {
  EasingFunction,
  ColorSpace,
  QualityLevel,
  FilterType,
  ClickFeedbackType,
  VisualEffectType,
  MaterialType,
  BorderStyle,
} from './enums';
import type { VersionInfo } from './base';

/**
 * 视觉效果
 */
export interface VisualEffect {
  /**
   * 效果类型
   */
  type: VisualEffectType;
  /**
   * 持续时间（毫秒）
   */
  duration: number;
  /**
   * 效果参数
   */
  parameters?: Record<string, any>;
}
/**
 * 震动模式
 */
export interface VibrationPattern {
  /**
   * 震动持续时间（毫秒）
   */
  duration: number;
  /**
   * 震动强度 (0-1)
   */
  intensity: number;
  /**
   * 震动模式
   */
  pattern?: number[];
}

/**
 * 点击效果
 */
export interface ClickEffect {
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 反馈类型
   */
  feedbackType: ClickFeedbackType;
  /**
   * 动画配置
   */
  animation?: AnimationProperties;
  /**
   * 音效
   */
  sound?: string;
  /**
   * 震动
   */
  vibration?: VibrationPattern;
  /**
   * 视觉效果
   */
  visualEffect?: VisualEffect;
}

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
 * 渐变停止点
 */
export interface GradientStop {
  /**
   * 位置 (0-1)
   */
  position: number;
  /**
   * 颜色
   */
  color: [number, number, number, number];
  /**
   * 中点
   */
  midpoint?: number;
}

/**
 * 材质属性
 */
export interface MaterialProperties {
  /**
   * 材质名称
   */
  name: string;
  /**
   * 材质类型
   */
  type: MaterialType;
  /**
   * 基础颜色
   */
  baseColor: Color;
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 金属度
   */
  metallic?: number;
  /**
   * 粗糙度
   */
  roughness?: number;
  /**
   * 自发光颜色
   */
  emissiveColor?: Color;
  /**
   * 自发光强度
   */
  emissiveIntensity?: number;
  /**
   * 法线强度
   */
  normalScale?: number;
  /**
   * 遮挡强度
   */
  occlusionStrength?: number;
  /**
   * 折射率
   */
  ior?: number;
  /**
   * 透射
   */
  transmission?: number;
  /**
   * 厚度
   */
  thickness?: number;
  /**
   * 衰减颜色
   */
  attenuationColor?: Color;
  /**
   * 衰减距离
   */
  attenuationDistance?: number;
  /**
   * 各向异性
   */
  anisotropy?: number;
  /**
   * 各向异性旋转
   */
  anisotropyRotation?: number;
  /**
   * 清漆
   */
  clearcoat?: number;
  /**
   * 清漆粗糙度
   */
  clearcoatRoughness?: number;
  /**
   * 清漆法线
   */
  clearcoatNormal?: number;
  /**
   * 光泽
   */
  sheen?: number;
  /**
   * 光泽颜色
   */
  sheenColor?: Color;
  /**
   * 光泽粗糙度
   */
  sheenRoughness?: number;
  /**
   * 次表面散射
   */
  subsurface?: number;
  /**
   * 次表面颜色
   */
  subsurfaceColor?: Color;
  /**
   * 次表面半径
   */
  subsurfaceRadius?: [number, number, number];
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
 * 2D向量
 */
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * 3D向量
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * 4D向量
 */
export interface Vector4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * 四元数
 */
export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * 2D矩阵
 */
export interface Matrix2x2 {
  m00: number;
  m01: number;
  m10: number;
  m11: number;
}

/**
 * 3D矩阵
 */
export interface Matrix3x3 {
  m00: number;
  m01: number;
  m02: number;
  m10: number;
  m11: number;
  m12: number;
  m20: number;
  m21: number;
  m22: number;
}

/**
 * 4D矩阵
 */
export interface Matrix4x4 {
  m00: number;
  m01: number;
  m02: number;
  m03: number;
  m10: number;
  m11: number;
  m12: number;
  m13: number;
  m20: number;
  m21: number;
  m22: number;
  m23: number;
  m30: number;
  m31: number;
  m32: number;
  m33: number;
}

/**
 * 变换空间
 */
export enum TransformSpace {
  /**
   * 世界空间
   */
  World = 'world',
  /**
   * 本地空间
   */
  Local = 'local',
  /**
   * 父级空间
   */
  Parent = 'parent',
  /**
   * 屏幕空间
   */
  Screen = 'screen',
  /**
   * 视图空间
   */
  View = 'view',
}

/**
 * 旋转顺序
 */
export enum RotationOrder {
  /**
   * XYZ顺序
   */
  XYZ = 'xyz',
  /**
   * XZY顺序
   */
  XZY = 'xzy',
  /**
   * YXZ顺序
   */
  YXZ = 'yxz',
  /**
   * YZX顺序
   */
  YZX = 'yzx',
  /**
   * ZXY顺序
   */
  ZXY = 'zxy',
  /**
   * ZYX顺序
   */
  ZYX = 'zyx',
}

/**
 * 边界框
 */
export interface BoundingBox {
  /**
   * 最小点
   */
  min: Vector3;
  /**
   * 最大点
   */
  max: Vector3;
  /**
   * 中心点
   */
  center?: Vector3;
  /**
   * 尺寸
   */
  size?: Vector3;
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
 * 悬停效果
 */
export interface HoverEffect {
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 悬停延迟（毫秒）
   */
  delay: number;
  /**
   * 高亮颜色
   */
  highlightColor?: [number, number, number, number];
  /**
   * 缩放因子
   */
  scaleFactor?: number;
  /**
   * 透明度变化
   */
  opacityChange?: number;
  /**
   * 动画配置
   */
  animation?: AnimationProperties;
  /**
   * 光标样式
   */
  cursor?: string;
  /**
   * 工具提示
   */
  tooltip?: string;
}

/**
 * 选择边框
 */
export interface SelectionBorder {
  /**
   * 边框宽度
   */
  width: UsdValue; // float
  /**
   * 边框颜色
   */
  color: Color;
  /**
   * 边框样式
   */
  style: BorderStyle;
  /**
   * 边框圆角
   */
  radius?: UsdValue; // float
}
/**
 * 选择效果
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
  /**
   * 选择边框
   */
  selectionBorder?: SelectionBorder;
  /**
   * 选择动画
   */
  animation?: AnimationProperties;
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

/**
 * 图像滤镜
 */
export interface ImageFilter {
  /**
   * 滤镜类型
   */
  type: FilterType;
  /**
   * 滤镜强度 (0-1)
   */
  intensity: number;
  /**
   * 滤镜参数
   */
  parameters?: Record<string, any>;
  /**
   * 是否启用
   */
  enabled: boolean;
}
