/**
 * Camera Components
 * 相机相关的数据组件
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计决策
 *
 * 相机组件用于定义场景中的观察视角。
 * 支持以下投影模式：
 * - **透视投影**：模拟真实相机，适合 3D 场景
 * - **正交投影**：无透视效果，适合 2D 或 UI
 *
 * 所有组件都继承自 Component 基类，提供：
 * - 引用计数管理（继承自 ReferResource）
 * - 组件启用/禁用状态
 * - 组件脏标记（用于优化更新）
 *
 * ## 类型来源
 *
 * 相机接口定义来自 @maxellabs/specification：
 * - ICameraData: 相机组件数据接口
 * - ICameraTarget: 相机目标接口
 * - ProjectionType: 投影类型枚举
 * - CameraClearFlags: 清除标志枚举
 */

import { Component } from '../base';
import type { ICameraData, ICameraTarget, ProjectionType, CameraClearFlags } from '@maxellabs/specification';
import type { ColorLike, Vector3Like } from '@maxellabs/specification';

// ============ 默认值 ============

/**
 * 默认透视相机 FOV（60 度）
 */
const DEFAULT_FOV = Math.PI / 3;

/**
 * 默认宽高比（16:9）
 */
const DEFAULT_ASPECT = 16 / 9;

/**
 * 默认正交尺寸
 */
const DEFAULT_ORTHO_SIZE = 5;

/**
 * 默认近裁剪面
 */
const DEFAULT_NEAR = 0.1;

/**
 * 默认远裁剪面
 */
const DEFAULT_FAR = 1000;

/**
 * 默认背景颜色（深灰色）
 */
const DEFAULT_BACKGROUND_COLOR: ColorLike = { r: 0.2, g: 0.2, b: 0.2, a: 1 };

/**
 * 默认视口（全屏）
 */
const DEFAULT_VIEWPORT: [number, number, number, number] = [0, 0, 1, 1];

/**
 * 默认裁剪掩码（全部层）
 */
const DEFAULT_CULLING_MASK = 0xffffffff;

// ============ 相机组件 ============

/**
 * Camera Component - 相机组件
 * @description 定义场景的观察视角和投影方式
 * @implements ICameraData from @maxellabs/specification
 */
export class Camera extends Component implements ICameraData {
  /** 投影类型 */
  projectionType: ProjectionType = 'perspective' as ProjectionType;

  /** 垂直视野角度（弧度）- 透视投影 */
  fov: number = DEFAULT_FOV;

  /** 宽高比 */
  aspect: number = DEFAULT_ASPECT;

  /** 正交尺寸（半高）- 正交投影 */
  orthographicSize: number = DEFAULT_ORTHO_SIZE;

  /** 近裁剪面 */
  near: number = DEFAULT_NEAR;

  /** 远裁剪面 */
  far: number = DEFAULT_FAR;

  /** 是否为主相机 */
  isMain: boolean = true;

  /** 渲染优先级 */
  priority: number = 0;

  /** 清除标志 */
  clearFlags: CameraClearFlags = 'color' as CameraClearFlags;

  /** 背景颜色 */
  backgroundColor: ColorLike = { ...DEFAULT_BACKGROUND_COLOR };

  /** 视口 [x, y, width, height] */
  viewport: [number, number, number, number] = [...DEFAULT_VIEWPORT];

  /** 裁剪掩码 */
  cullingMask: number = DEFAULT_CULLING_MASK;

  /**
   * 从规范数据创建组件
   */
  static fromData(data: Partial<ICameraData>): Camera {
    const component = new Camera();

    if (data.projectionType !== undefined) {
      component.projectionType = data.projectionType;
    }
    if (data.fov !== undefined) {
      component.fov = data.fov;
    }
    if (data.aspect !== undefined) {
      component.aspect = data.aspect;
    }
    if (data.orthographicSize !== undefined) {
      component.orthographicSize = data.orthographicSize;
    }
    if (data.near !== undefined) {
      component.near = data.near;
    }
    if (data.far !== undefined) {
      component.far = data.far;
    }
    if (data.isMain !== undefined) {
      component.isMain = data.isMain;
    }
    if (data.priority !== undefined) {
      component.priority = data.priority;
    }
    if (data.clearFlags !== undefined) {
      component.clearFlags = data.clearFlags;
    }
    if (data.backgroundColor !== undefined) {
      component.backgroundColor = { ...data.backgroundColor };
    }
    if (data.viewport !== undefined) {
      component.viewport = [...data.viewport];
    }
    if (data.cullingMask !== undefined) {
      component.cullingMask = data.cullingMask;
    }

    return component;
  }

  /**
   * 克隆组件
   */
  override clone(): Camera {
    const cloned = new Camera();
    cloned.projectionType = this.projectionType;
    cloned.fov = this.fov;
    cloned.aspect = this.aspect;
    cloned.orthographicSize = this.orthographicSize;
    cloned.near = this.near;
    cloned.far = this.far;
    cloned.isMain = this.isMain;
    cloned.priority = this.priority;
    cloned.clearFlags = this.clearFlags;
    cloned.backgroundColor = { ...this.backgroundColor };
    cloned.viewport = [...this.viewport] as [number, number, number, number];
    cloned.cullingMask = this.cullingMask;
    return cloned;
  }

  /**
   * 设置为透视投影
   *
   * @param fov 垂直视场角，单位：**度数**（不是弧度！）。常用值：45-90
   * @param aspect 宽高比 (width / height)
   * @param near 近裁剪面距离
   * @param far 远裁剪面距离
   *
   * @example
   * ```typescript
   * // 45 度 FOV，16:9 宽高比
   * camera.setPerspective(45, 16/9, 0.1, 1000);
   * ```
   */
  setPerspective(fov: number, aspect: number, near: number, far: number): this {
    this.projectionType = 'perspective' as ProjectionType;
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.markDirty();
    return this;
  }

  /**
   * 设置为正交投影
   */
  setOrthographic(size: number, aspect: number, near: number, far: number): this {
    this.projectionType = 'orthographic' as ProjectionType;
    this.orthographicSize = size;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.markDirty();
    return this;
  }
}

/**
 * CameraTarget Component - 相机目标组件
 * @description 定义相机的观察目标点（用于 LookAt）
 * @implements ICameraTarget from @maxellabs/specification
 */
export class CameraTarget extends Component implements ICameraTarget {
  /** 目标位置 */
  target: Vector3Like = { x: 0, y: 0, z: 0 };

  /** 上方向 */
  up: Vector3Like = { x: 0, y: 1, z: 0 };

  /**
   * 从规范数据创建组件
   */
  static fromData(data: Partial<ICameraTarget>): CameraTarget {
    const component = new CameraTarget();

    if (data.target !== undefined) {
      component.target = { ...data.target };
    }
    if (data.up !== undefined) {
      component.up = { ...data.up };
    }

    return component;
  }

  /**
   * 克隆组件
   */
  override clone(): CameraTarget {
    const cloned = new CameraTarget();
    cloned.target = { ...this.target };
    cloned.up = { ...this.up };
    return cloned;
  }

  /**
   * 设置目标点
   */
  setTarget(x: number, y: number, z: number): this {
    this.target.x = x;
    this.target.y = y;
    this.target.z = z;
    this.markDirty();
    return this;
  }
}
