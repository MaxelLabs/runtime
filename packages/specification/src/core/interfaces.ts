/**
 * Maxellabs 核心模块接口定义
 * 提供系统核心的基础接口和类型
 */

import type { UsdValue } from './usd';
import type { EasingFunction, MaterialType, BorderStyle, ClickFeedbackType, VisualEffectType } from './enums';
import type { VersionInfo } from './base';
import type { ColorLike, Vector3Like } from './math';

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

// /**
//  * 基础变换接口（核心3D变换）
//  */
// export interface ITransform {
//   /**
//    * 位置
//    */
//   position: IVector3; // Vector3f
//   /**
//    * 旋转（四元数）
//    */
//   rotation: IQuaternion; // Quatf
//   /**
//    * 缩放
//    */
//   scale: IVector3; // Vector3f
//   /**
//    * 变换矩阵（可选，优先级高于位置/旋转/缩放）
//    */
//   matrix?: IMatrix4x4; // Matrix4d
// }
/**
 * 基础变换接口（核心3D变换）
 */
export type ITransform = object;

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
 * 核心材质属性（基础版本）
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
  baseColor: ColorLike;
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
  emissiveColor?: ColorLike;
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
  attenuationColor?: ColorLike;
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
  sheenColor?: ColorLike;
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
  subsurfaceColor?: ColorLike;
  /**
   * 次表面半径
   */
  subsurfaceRadius?: [number, number, number];
}

/**
 * 核心动画属性
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
 * 核心渲染属性
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
   * 3D边界框
   */
  boundingBox?: CoreBoundingBox;
}

/**
 * 边界球
 */
export interface BoundingSphere {
  /**
   * 球心坐标
   */
  center: Vector3Like;
  /**
   * 半径
   */
  radius: number;
}

/**
 * 3D边界框（核心版本）
 */
export interface CoreBoundingBox {
  /**
   * 最小点
   */
  min: Vector3Like;
  /**
   * 最大点
   */
  max: Vector3Like;
  /**
   * 中心点
   */
  center: Vector3Like;
  /**
   * 尺寸
   */
  size: Vector3Like;
}

/**
 * 核心交互属性
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
  highlightColor?: ColorLike;
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
  color: ColorLike;
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
  selectionColor?: ColorLike;
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
// ========== 枚举类型 ==========

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
 * 通用变换函数
 * 适用于动画、设计等所有需要变换的模块
 */
export interface TransformFunction {
  /**
   * 函数类型
   */
  type: string;
  /**
   * 参数
   */
  parameters: number[];
}

/**
 * 通用约束配置
 * 适用于布局、设计系统等
 */
export interface ConstraintConfig {
  /**
   * 水平约束
   */
  horizontal: string;
  /**
   * 垂直约束
   */
  vertical: string;
}

/**
 * 通用动画配置基础接口
 * 适用于所有动画系统的基础配置
 */
export interface BaseAnimationConfig {
  /**
   * 动画名称
   */
  name: string;
  /**
   * 持续时间（秒）
   */
  duration: number;
  /**
   * 延迟时间（秒）
   */
  delay?: number;
  /**
   * 播放速度
   */
  speed?: number;
  /**
   * 循环模式
   */
  loopMode?: string;
  /**
   * 循环次数（-1为无限循环）
   */
  loopCount?: number;
  /**
   * 缓动函数
   */
  easing?: string;
  /**
   * 自定义缓动参数
   */
  easingParams?: number[];
  /**
   * 是否自动播放
   */
  autoPlay?: boolean;
  /**
   * 是否自动销毁
   */
  autoDestroy?: boolean;
  /**
   * 动画权重
   */
  weight?: number;
  /**
   * 混合模式
   */
  blendMode?: string;
}

/**
 * 通用事件配置
 * 适用于动画、交互等所有需要事件的模块
 */
export interface BaseEvent {
  /**
   * 事件类型
   */
  type: string;
  /**
   * 事件名称
   */
  name?: string;
  /**
   * 触发时间（秒）
   */
  time: number;
  /**
   * 事件参数
   */
  parameters?: Record<string, any>;
  /**
   * 事件回调
   */
  callback?: string;
}

/**
 * 通用控制器接口
 * 适用于动画、媒体播放等所有需要控制的模块
 */
export interface BaseController {
  /**
   * 当前播放状态
   */
  playState: string;
  /**
   * 当前时间
   */
  currentTime: number;
  /**
   * 播放速度
   */
  playbackSpeed: number;
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 权重
   */
  weight: number;
  /**
   * 当前循环次数
   */
  currentLoop: number;
  /**
   * 播放方向（1为正向，-1为反向）
   */
  direction: number;
}

/**
 * 通用组件属性定义
 * 适用于设计系统、UI组件等
 */
export interface BaseComponentProperty {
  /**
   * 属性名称
   */
  name: string;
  /**
   * 属性类型
   */
  type: string;
  /**
   * 默认值
   */
  defaultValue?: any;
  /**
   * 可选值
   */
  options?: any[];
}

/**
 * 通用样式配置
 * 适用于设计、UI、渲染等所有需要样式的模块
 */
export interface BaseStyle {
  /**
   * 样式名称
   */
  name: string;
  /**
   * 样式类型
   */
  type: string;
  /**
   * 样式值
   */
  value: any;
  /**
   * 是否启用
   */
  enabled?: boolean;
}

/**
 * 通用参数定义
 * 适用于动画、组件、系统等所有需要参数的模块
 */
export interface BaseParameter {
  /**
   * 参数名称
   */
  name: string;
  /**
   * 参数类型
   */
  type: string;
  /**
   * 默认值
   */
  defaultValue: any;
  /**
   * 当前值
   */
  value: any;
  /**
   * 最小值（数值类型）
   */
  min?: number;
  /**
   * 最大值（数值类型）
   */
  max?: number;
  /**
   * 描述
   */
  description?: string;
}
