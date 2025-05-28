/**
 * Maxellabs 通用变换
 * 定义所有系统共通的变换相关类型
 */

import type { UsdValue } from '../core/usd';

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
 * 通用2D变换
 */
export interface CommonTransform2D {
  /**
   * 位置
   */
  position: Vector2;
  /**
   * 旋转角度（弧度）
   */
  rotation: number;
  /**
   * 缩放
   */
  scale: Vector2;
  /**
   * 锚点
   */
  anchor?: Vector2;
  /**
   * 倾斜
   */
  skew?: Vector2;
  /**
   * 变换矩阵（可选，优先级高于其他属性）
   */
  matrix?: Matrix3x3;
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
  position: Vector3;
  /**
   * 旋转（四元数）
   */
  rotation: Quaternion;
  /**
   * 欧拉角旋转（可选，与四元数互斥）
   */
  eulerRotation?: Vector3;
  /**
   * 旋转顺序
   */
  rotationOrder?: RotationOrder;
  /**
   * 缩放
   */
  scale: Vector3;
  /**
   * 锚点
   */
  anchor?: Vector3;
  /**
   * 变换矩阵（可选，优先级高于其他属性）
   */
  matrix?: Matrix4x4;
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
 * 2D边界框
 */
export interface BoundingBox2D {
  /**
   * 最小点
   */
  min: Vector2;
  /**
   * 最大点
   */
  max: Vector2;
  /**
   * 中心点
   */
  center?: Vector2;
  /**
   * 尺寸
   */
  size?: Vector2;
}

/**
 * 变换层次结构
 */
export interface TransformHierarchy {
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
  worldMatrix?: Matrix4x4;
  /**
   * 本地变换矩阵
   */
  localMatrix?: Matrix4x4;
}

/**
 * 变换动画关键帧
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
