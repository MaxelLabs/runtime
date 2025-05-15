import { Camera, ProjectionType, CameraEvent } from './Camera';
import type { Entity } from '../base/entity';

/**
 * 正交相机
 * 不会产生透视效果，无论距离远近，物体大小保持不变
 * 常用于2D游戏或UI渲染
 */
export class OrthographicCamera extends Camera {
  /**
   * 创建正交相机
   * @param entity 所属实体
   * @param size 正交视口高度的一半（默认5）
   * @param aspect 宽高比（默认16:9）
   * @param near 近裁剪面（默认0.1）
   * @param far 远裁剪面（默认1000）
   */
  constructor (entity: Entity, size: number = 5, aspect: number = 16 / 9, near: number = 0.1, far: number = 1000) {
    super(entity);

    // 设置为正交投影类型
    this.setProjectionType(ProjectionType.Orthographic);

    // 设置正交相机参数
    this.setOrthographic(size, aspect, near, far);
  }

  /**
   * 设置正交相机参数
   * @param size 正交视口高度的一半
   * @param aspect 宽高比
   * @param near 近裁剪面
   * @param far 远裁剪面
   * @returns 当前实例，用于链式调用
   */
  setOrthographic (size: number, aspect: number, near: number, far: number): this {
    this.setOrthographicSize(size);
    this.setAspect(aspect);
    this.setNear(near);
    this.setFar(far);

    // 派发事件通知正交参数已更新
    this.eventDispatcher.dispatchEvent(CameraEvent.PROJECTION_MATRIX_UPDATED, {
      camera: this,
      size,
      aspect,
      near,
      far,
    });

    return this;
  }

  /**
   * 根据矩形设置正交相机
   * @param left 左边界
   * @param right 右边界
   * @param bottom 下边界
   * @param top 上边界
   * @param near 近裁剪面
   * @param far 远裁剪面
   * @returns 当前实例，用于链式调用
   */
  setOrthographicRect (left: number, right: number, bottom: number, top: number, near: number, far: number): this {
    // 计算宽高比和正交大小
    const width = right - left;
    const height = top - bottom;

    this.setAspect(width / height);
    this.setOrthographicSize(height / 2);
    this.setNear(near);
    this.setFar(far);

    // 派发事件通知正交参数已更新
    this.eventDispatcher.dispatchEvent(CameraEvent.PROJECTION_MATRIX_UPDATED, {
      camera: this,
      left, right, bottom, top, near, far,
    });

    return this;
  }
}