import { Camera, ProjectionType, CameraEvent } from './Camera';
import type { Entity } from '../base/entity';

/**
 * 透视相机
 * 模拟人眼或真实相机的透视效果，远处的物体看起来比近处的小
 */
export class PerspectiveCamera extends Camera {
  /**
   * 创建透视相机
   * @param entity 所属实体
   * @param fov 视野角度（角度制，默认60度）
   * @param aspect 宽高比（默认16:9）
   * @param near 近裁剪面（默认0.1）
   * @param far 远裁剪面（默认1000）
   */
  constructor (entity: Entity, fov: number = 60, aspect: number = 16 / 9, near: number = 0.1, far: number = 1000) {
    super(entity);

    // 设置为透视投影类型
    this.setProjectionType(ProjectionType.Perspective);

    // 设置透视相机参数
    this.setPerspective(fov, aspect, near, far);
  }

  /**
   * 设置透视相机参数
   * @param fov 视野角度（角度制）
   * @param aspect 宽高比
   * @param near 近裁剪面
   * @param far 远裁剪面
   * @returns 当前实例，用于链式调用
   */
  setPerspective (fov: number, aspect: number, near: number, far: number): this {
    this.setFov(fov);
    this.setAspect(aspect);
    this.setNear(near);
    this.setFar(far);

    // 派发事件通知参数已更新
    this.eventDispatcher.dispatchEvent(CameraEvent.PROJECTION_MATRIX_UPDATED, {
      camera: this,
      fov,
      aspect,
      near,
      far,
    });

    return this;
  }
}