/**
 * Maxellabs 通用变换
 * 定义所有系统共通的变换相关类型
 *
 * Phase 2 重构: TransformKeyframe 和 TransformAnimationTrack 现在基于 core/generics.ts 中的统一泛型
 */

import type {
  UsdValue,
  Vector2Like,
  Matrix3Like,
  Matrix4Like,
  TransformSpace,
  EulerLike,
  UnifiedKeyframe,
  UnifiedAnimationTrack,
  ITransform,
  RequiredEnableable,
} from '../core';

/**
 * 通用2D变换
 */
export interface CommonTransform2D {
  /**
   * 位置
   */
  position: Vector2Like;
  /**
   * 旋转角度（弧度）
   */
  rotation: number;
  /**
   * 缩放
   */
  scale: Vector2Like;
  /**
   * 锚点
   */
  anchor?: Vector2Like;
  /**
   * 倾斜
   */
  skew?: Vector2Like;
  /**
   * 变换矩阵（可选，优先级高于其他属性）
   */
  matrix?: Matrix3Like;
  /**
   * 变换空间
   */
  space?: TransformSpace;
}

/**
 * 通用3D变换
 *
 * @description 继承 ITransform，添加欧拉角旋转支持
 */
export interface CommonTransform3D extends ITransform {
  /**
   * 欧拉角旋转（可选，与四元数互斥）
   */
  eulerRotation?: EulerLike;
}

/**
 * 通用变换（兼容2D和3D）
 */
export interface CommonTransform {
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
   * 锚点
   */
  anchor?: UsdValue; // Vector3f
  /**
   * 变换矩阵（可选，优先级高于位置/旋转/缩放）
   */
  matrix?: UsdValue; // Matrix4d
  /**
   * 变换空间
   */
  space?: TransformSpace;
  /**
   * 是否继承父级变换
   */
  inheritTransform?: boolean;
}

/**
 * 变换约束类型
 */
export enum TransformConstraintType {
  /**
   * 位置约束
   */
  Position = 'position',
  /**
   * 旋转约束
   */
  Rotation = 'rotation',
  /**
   * 缩放约束
   */
  Scale = 'scale',
  /**
   * 注视约束
   */
  LookAt = 'look-at',
  /**
   * 路径约束
   */
  Path = 'path',
  /**
   * 父级约束
   */
  Parent = 'parent',
}
/**
 * 变换约束
 *
 * @description 组合 RequiredEnableable trait
 */
export interface TransformConstraint extends RequiredEnableable {
  /**
   * 约束类型
   */
  type: TransformConstraintType;
  /**
   * 目标对象ID
   */
  target: string;
  /**
   * 约束权重 (0-1)
   */
  weight: number;
  /**
   * 约束偏移
   */
  offset?: CommonTransform;
  /**
   * 约束参数
   */
  parameters?: Record<string, any>;
}

/**
 * 2D边界框
 */
export interface BoundingBox2D {
  /**
   * 最小点
   */
  min: Vector2Like;
  /**
   * 最大点
   */
  max: Vector2Like;
  /**
   * 中心点
   */
  center?: Vector2Like;
  /**
   * 尺寸
   */
  size?: Vector2Like;
}

/**
 * 变换层次结构
 */
export interface TransformHierarchy {
  /**
   * 变换ID
   */
  id: string;
  /**
   * 父级变换ID
   */
  parentId?: string;
  /**
   * 子级变换ID列表
   */
  childrenIds: string[];
  /**
   * 层级深度
   */
  depth: number;
  /**
   * 世界变换矩阵
   */
  worldMatrix?: Matrix4Like;
  /**
   * 本地变换矩阵
   */
  localMatrix?: Matrix4Like;
}

/**
 * 变换关键帧
 *
 * @description 基于 UnifiedKeyframe 泛型，但使用 transform 而不是 value 以保持向后兼容
 * 继承了 UnifiedKeyframe 的 interpolation、inTangent、outTangent、bezierControlPoints 等属性
 */
export interface TransformKeyframe extends Omit<UnifiedKeyframe<CommonTransform>, 'value' | 'interpolation'> {
  /**
   * 变换值 (等价于 UnifiedKeyframe.value)
   */
  transform: CommonTransform;
  /**
   * 插值类型（特化为变换支持的插值方式）
   */
  interpolation: 'linear' | 'step' | 'bezier' | 'spline';
}

/**
 * 变换动画轨道
 *
 * @description 基于 UnifiedAnimationTrack 泛型，特化为变换属性
 */
export interface TransformAnimationTrack
  extends Omit<UnifiedAnimationTrack<TransformKeyframe>, 'property' | 'targetPath'> {
  /**
   * 目标属性（特化为变换属性）
   */
  property: 'position' | 'rotation' | 'scale' | 'transform';
  /**
   * 目标路径（可选）
   */
  targetPath?: string;
  /**
   * 数据类型标识
   */
  dataType?: 'transform';
}
