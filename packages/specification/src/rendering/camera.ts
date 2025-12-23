/**
 * Maxellabs 相机渲染规范
 * 相机和投影相关类型定义
 */

import type { Vector3Like, ColorLike } from '../core';
import type { UsdPrim, UsdValue } from '../core';

/**
 * 相机基础接口
 */
export interface CameraPrim extends UsdPrim {
  typeName: 'Camera';
}

/**
 * 投影类型
 */
export enum ProjectionType {
  /**
   * 透视投影
   */
  Perspective = 'perspective',
  /**
   * 正交投影
   */
  Orthographic = 'orthographic',
}

/**
 * 透视投影参数
 */
export interface IPerspectiveProjection {
  /**
   * 垂直视野角度（弧度）
   */
  fov: number;
  /**
   * 宽高比（如果未设置则使用视口比例）
   */
  aspect?: number;
  /**
   * 近裁剪面距离
   */
  near: number;
  /**
   * 远裁剪面距离
   */
  far: number;
}

/**
 * 正交投影参数
 */
export interface IOrthographicProjection {
  /**
   * 左边界
   */
  left: number;
  /**
   * 右边界
   */
  right: number;
  /**
   * 下边界
   */
  bottom: number;
  /**
   * 上边界
   */
  top: number;
  /**
   * 近裁剪面距离
   */
  near: number;
  /**
   * 远裁剪面距离
   */
  far: number;
}

/**
 * 相机清除标志
 */
export enum CameraClearFlags {
  /**
   * 不清除
   */
  None = 'none',
  /**
   * 仅清除深度
   */
  Depth = 'depth',
  /**
   * 清除颜色和深度
   */
  Color = 'color',
  /**
   * 使用天空盒
   */
  Skybox = 'skybox',
}

/**
 * 相机接口
 */
export interface ICamera extends CameraPrim {
  attributes: {
    /**
     * 相机名称
     */
    name: UsdValue; // string
    /**
     * 是否为主相机
     */
    isMain: UsdValue; // bool
    /**
     * 渲染优先级（值越小越先渲染）
     */
    priority: UsdValue; // int
    /**
     * 是否启用
     */
    enabled: UsdValue; // bool
  };
  /**
   * 投影类型
   */
  projectionType: ProjectionType;
  /**
   * 透视投影参数（当 projectionType 为 Perspective 时）
   */
  perspective?: IPerspectiveProjection;
  /**
   * 正交投影参数（当 projectionType 为 Orthographic 时）
   */
  orthographic?: IOrthographicProjection;
  /**
   * 清除标志
   */
  clearFlags: CameraClearFlags;
  /**
   * 背景颜色
   */
  backgroundColor?: ColorLike;
  /**
   * 视口设置 [x, y, width, height]，值范围 0-1
   */
  viewport?: [number, number, number, number];
  /**
   * 裁剪掩码（用于 Layer 过滤）
   */
  cullingMask?: number;
  /**
   * 深度纹理模式
   */
  depthTextureMode?: DepthTextureMode;
}

/**
 * 深度纹理模式
 */
export enum DepthTextureMode {
  /**
   * 无深度纹理
   */
  None = 'none',
  /**
   * 生成深度纹理
   */
  Depth = 'depth',
  /**
   * 生成深度法线纹理
   */
  DepthNormals = 'depth-normals',
}

/**
 * 相机组件数据接口（简化版，用于 Component）
 */
export interface ICameraData {
  /**
   * 投影类型
   */
  projectionType: ProjectionType;
  /**
   * 垂直视野角度（弧度）- 透视投影
   */
  fov?: number;
  /**
   * 宽高比
   */
  aspect?: number;
  /**
   * 正交尺寸（半高）- 正交投影
   */
  orthographicSize?: number;
  /**
   * 近裁剪面
   */
  near: number;
  /**
   * 远裁剪面
   */
  far: number;
  /**
   * 是否为主相机
   */
  isMain?: boolean;
  /**
   * 渲染优先级
   */
  priority?: number;
  /**
   * 清除标志
   */
  clearFlags?: CameraClearFlags;
  /**
   * 背景颜色
   */
  backgroundColor?: ColorLike;
  /**
   * 视口 [x, y, width, height]
   */
  viewport?: [number, number, number, number];
  /**
   * 裁剪掩码
   */
  cullingMask?: number;
}

/**
 * 相机目标点接口（用于 LookAt）
 */
export interface ICameraTarget {
  /**
   * 目标位置
   */
  target: Vector3Like;
  /**
   * 上方向
   */
  up?: Vector3Like;
}
