/**
 * Maxellabs 通用变换
 * 定义所有系统共通的变换相关类型
 */

import type { IMatrix3x3, IMatrix4x4, IQuaternion, RotationOrder, TransformSpace, IVector2, IVector3 } from '../core';
import type { UsdValue } from '../core/usd';

/**
 * 通用2D变换
 */
export interface CommonTransform2D {
  /**
   * 位置
   */
  position: IVector2;
  /**
   * 旋转角度（弧度）
   */
  rotation: number;
  /**
   * 缩放
   */
  scale: IVector2;
  /**
   * 锚点
   */
  anchor?: IVector2;
  /**
   * 倾斜
   */
  skew?: IVector2;
  /**
   * 变换矩阵（可选，优先级高于其他属性）
   */
  matrix?: IMatrix3x3;
  /**
   * 变换空间
   */
  space?: TransformSpace;
}

/**
 * 通用3D变换
 */
export interface CommonTransform3D {
  /**
   * 位置
   */
  position: IVector3;
  /**
   * 旋转（四元数）
   */
  rotation: IQuaternion;
  /**
   * 欧拉角旋转（可选，与四元数互斥）
   */
  eulerRotation?: IVector3;
  /**
   * 旋转顺序
   */
  rotationOrder?: RotationOrder;
  /**
   * 缩放
   */
  scale: IVector3;
  /**
   * 锚点
   */
  anchor?: IVector3;
  /**
   * 变换矩阵（可选，优先级高于其他属性）
   */
  matrix?: IMatrix4x4;
  /**
   * 变换空间
   */
  space?: TransformSpace;
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
export enum TransfromConstraintType {
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
 */
export interface TransformConstraint {
  /**
   * 约束类型
   */
  type: TransfromConstraintType;
  /**
   * 目标对象ID
   */
  target: string;
  /**
   * 约束权重 (0-1)
   */
  weight: number;
  /**
   * 是否启用
   */
  enabled: boolean;
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
  min: IVector2;
  /**
   * 最大点
   */
  max: IVector2;
  /**
   * 中心点
   */
  center?: IVector2;
  /**
   * 尺寸
   */
  size?: IVector2;
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
  worldMatrix?: IMatrix4x4;
  /**
   * 本地变换矩阵
   */
  localMatrix?: IMatrix4x4;
}

/**
 * 变换关键帧
 */
export interface TransformKeyframe {
  /**
   * 时间
   */
  time: number;
  /**
   * 变换值
   */
  transform: CommonTransform;
  /**
   * 插值类型
   */
  interpolation: 'linear' | 'step' | 'bezier' | 'spline';
  /**
   * 缓动函数
   */
  easing?: string;
}

/**
 * 变换动画轨道
 */
export interface TransformAnimationTrack {
  /**
   * 轨道名称
   */
  name: string;
  /**
   * 目标属性
   */
  property: 'position' | 'rotation' | 'scale' | 'transform';
  /**
   * 关键帧列表
   */
  keyframes: TransformKeyframe[];
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 权重
   */
  weight: number;
}
