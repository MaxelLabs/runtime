/**
 * shadow/LightSpaceMatrix.ts
 * 光源空间矩阵计算器 - 计算阴影渲染所需的光源视图投影矩阵
 *
 * 功能特性：
 * - 支持平行光（正交投影）
 * - 支持点光源（透视投影，6个面）
 * - 预分配矩阵对象，避免循环中创建
 * - 提供静态方法和实例方法两种API
 *
 * @example
 * ```typescript
 * // 静态方法 - 一次性使用
 * const lightVP = LightSpaceMatrix.directional({
 *   direction: [0.5, -1, 0.3],
 *   orthoSize: 15,
 *   near: 1,
 *   far: 50,
 * });
 *
 * // 实例方法 - 渲染循环中复用
 * const lightMatrix = new LightSpaceMatrix();
 * runner.start((dt) => {
 *   lightMatrix.updateDirectional({
 *     direction: [lightX, lightY, lightZ],
 *     orthoSize: 15,
 *   });
 *   const vpMatrix = lightMatrix.getViewProjectionMatrix();
 *   // 更新Uniform...
 * });
 * ```
 */

import { MMath } from '@maxellabs/core';
import type { DirectionalLightConfig, PointLightConfig } from './types';

export class LightSpaceMatrix {
  // 预分配的矩阵对象（避免循环中创建）
  private viewMatrix: MMath.Matrix4;
  private projMatrix: MMath.Matrix4;
  private vpMatrix: MMath.Matrix4;
  private vpMatrixArray: Float32Array;

  // 预分配的向量对象
  private lightPosition: MMath.Vector3;
  private lightTarget: MMath.Vector3;
  private lightUp: MMath.Vector3;

  // ==================== 构造函数 ====================

  /**
   * 创建光源空间矩阵计算器
   * 预分配所有矩阵和向量对象
   */
  constructor() {
    this.viewMatrix = new MMath.Matrix4();
    this.projMatrix = new MMath.Matrix4();
    this.vpMatrix = new MMath.Matrix4();
    this.vpMatrixArray = new Float32Array(16);

    this.lightPosition = new MMath.Vector3();
    this.lightTarget = new MMath.Vector3();
    this.lightUp = new MMath.Vector3(0, 1, 0);
  }

  // ==================== 静态方法 ====================

  /**
   * 计算平行光的视图投影矩阵（静态方法）
   *
   * @param config 平行光配置
   * @returns 视图投影矩阵（Float32Array，16个元素）
   */
  static directional(config: DirectionalLightConfig): Float32Array {
    const instance = new LightSpaceMatrix();
    instance.updateDirectional(config);
    return instance.getViewProjectionMatrix();
  }

  /**
   * 计算点光源某个面的视图投影矩阵（静态方法）
   *
   * @param config 点光源配置
   * @param face 立方体贴图面索引（0-5）
   * @returns 视图投影矩阵（Float32Array，16个元素）
   */
  static point(config: PointLightConfig, face: number): Float32Array {
    const instance = new LightSpaceMatrix();
    instance.updatePoint(config, face);
    return instance.getViewProjectionMatrix();
  }

  // ==================== 实例方法 ====================

  /**
   * 更新平行光的视图投影矩阵
   *
   * @param config 平行光配置
   */
  updateDirectional(config: DirectionalLightConfig): void {
    const { direction, target = [0, 0, 0], orthoSize = 10, near = 1, far = 50 } = config;

    // 归一化方向向量
    const dirLen = Math.sqrt(direction[0] * direction[0] + direction[1] * direction[1] + direction[2] * direction[2]);
    const normDir = [direction[0] / dirLen, direction[1] / dirLen, direction[2] / dirLen];

    // 计算光源位置（从方向反推，距离目标点一定距离）
    const distance = (near + far) / 2;
    this.lightPosition.set(
      target[0] - normDir[0] * distance,
      target[1] - normDir[1] * distance,
      target[2] - normDir[2] * distance
    );

    // 设置目标点
    this.lightTarget.set(target[0], target[1], target[2]);

    // 计算up向量（避免与方向平行）
    if (Math.abs(normDir[1]) > 0.99) {
      this.lightUp.set(0, 0, 1);
    } else {
      this.lightUp.set(0, 1, 0);
    }

    // 计算视图矩阵
    this.viewMatrix.lookAt(this.lightPosition, this.lightTarget, this.lightUp);

    // 计算正交投影矩阵
    this.projMatrix.orthographic(-orthoSize, orthoSize, -orthoSize, orthoSize, near, far);

    // 合并视图投影矩阵
    this.vpMatrix.copyFrom(this.projMatrix).multiply(this.viewMatrix);
  }

  /**
   * 更新点光源某个面的视图投影矩阵
   *
   * @param config 点光源配置
   * @param face 立方体贴图面索引（0-5）
   *   - 0: +X (右)
   *   - 1: -X (左)
   *   - 2: +Y (上)
   *   - 3: -Y (下)
   *   - 4: +Z (前)
   *   - 5: -Z (后)
   */
  updatePoint(config: PointLightConfig, face: number): void {
    const { position, near = 0.1, far = 25 } = config;

    // 设置光源位置
    this.lightPosition.set(position[0], position[1], position[2]);

    // 根据面索引设置目标和up向量
    const targets: [number, number, number][] = [
      [1, 0, 0], // +X
      [-1, 0, 0], // -X
      [0, 1, 0], // +Y
      [0, -1, 0], // -Y
      [0, 0, 1], // +Z
      [0, 0, -1], // -Z
    ];

    const ups: [number, number, number][] = [
      [0, -1, 0], // +X
      [0, -1, 0], // -X
      [0, 0, 1], // +Y
      [0, 0, -1], // -Y
      [0, -1, 0], // +Z
      [0, -1, 0], // -Z
    ];

    const targetDir = targets[face];
    const upDir = ups[face];

    this.lightTarget.set(position[0] + targetDir[0], position[1] + targetDir[1], position[2] + targetDir[2]);
    this.lightUp.set(upDir[0], upDir[1], upDir[2]);

    // 计算视图矩阵
    this.viewMatrix.lookAt(this.lightPosition, this.lightTarget, this.lightUp);

    // 计算透视投影矩阵（90度FOV，1:1宽高比）
    this.projMatrix.perspective(Math.PI / 2, 1, near, far);

    // 合并视图投影矩阵
    this.vpMatrix.copyFrom(this.projMatrix).multiply(this.viewMatrix);
  }

  /**
   * 获取视图投影矩阵
   *
   * @returns 视图投影矩阵（Float32Array，16个元素）
   */
  getViewProjectionMatrix(): Float32Array {
    const arr = this.vpMatrix.toArray();
    for (let i = 0; i < 16; i++) {
      this.vpMatrixArray[i] = arr[i];
    }
    return this.vpMatrixArray;
  }

  // 预分配的视图和投影矩阵数组（避免循环中创建）
  private viewMatrixArray: Float32Array = new Float32Array(16);
  private projMatrixArray: Float32Array = new Float32Array(16);

  /**
   * 获取视图矩阵
   *
   * @returns 视图矩阵（Float32Array，16个元素）
   */
  getViewMatrix(): Float32Array {
    const arr = this.viewMatrix.toArray();
    for (let i = 0; i < 16; i++) {
      this.viewMatrixArray[i] = arr[i];
    }
    return this.viewMatrixArray;
  }

  /**
   * 获取投影矩阵
   *
   * @returns 投影矩阵（Float32Array，16个元素）
   */
  getProjectionMatrix(): Float32Array {
    const arr = this.projMatrix.toArray();
    for (let i = 0; i < 16; i++) {
      this.projMatrixArray[i] = arr[i];
    }
    return this.projMatrixArray;
  }

  /**
   * 获取光源位置
   *
   * @returns 光源位置 [x, y, z]
   */
  getLightPosition(): [number, number, number] {
    return [this.lightPosition.x, this.lightPosition.y, this.lightPosition.z];
  }
}
