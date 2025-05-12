import { Camera, ProjectionType } from './Camera';
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
  constructor(entity: Entity, size: number = 5, aspect: number = 16/9, near: number = 0.1, far: number = 1000) {
    super(entity);
    
    // 设置为正交投影类型
    this.projectionType = ProjectionType.Orthographic;
    
    // 设置正交相机参数
    this.orthographicSize = size;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
  }

  /**
   * 设置正交相机参数
   * @param size 正交视口高度的一半
   * @param aspect 宽高比
   * @param near 近裁剪面
   * @param far 远裁剪面
   */
  setOrthographic(size: number, aspect: number, near: number, far: number): void {
    this.orthographicSize = size;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
  }

  /**
   * 根据矩形设置正交相机
   * @param left 左边界
   * @param right 右边界
   * @param bottom 下边界
   * @param top 上边界
   * @param near 近裁剪面
   * @param far 远裁剪面
   */
  setOrthographicRect(left: number, right: number, bottom: number, top: number, near: number, far: number): void {
    // 计算宽高比和正交大小
    const width = right - left;
    const height = top - bottom;
    this.aspect = width / height;
    this.orthographicSize = height / 2;
    this.near = near;
    this.far = far;
  }
} 