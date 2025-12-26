/**
 * Camera System
 * 相机系统 - 计算视图矩阵和投影矩阵
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 职责
 *
 * CameraSystem 负责：
 * 1. 根据相机实体的 WorldTransform 计算 View Matrix
 * 2. 根据 Camera 组件参数计算 Projection Matrix
 * 3. 计算 ViewProjection Matrix 用于渲染
 *
 * ## 执行阶段
 *
 * CameraSystem 在 PostUpdate 阶段执行，确保 TransformSystem 已完成世界矩阵计算。
 *
 * ## 依赖
 *
 * - TransformSystem (must run before)
 */

import type { SystemContext, Query } from '../../ecs';
import { SystemStage } from '../../ecs';
import type { ISystem, SystemMetadata, SystemExecutionStats } from '../types';
import { WorldTransform, Camera, CameraTarget } from '../../components';
import { Matrix4, Vector3, Quaternion } from '@maxellabs/math';
import type { Matrix4Like } from '@maxellabs/specification';

// ============ 相机缓存数据 ============

/**
 * CameraMatrices - 相机矩阵缓存组件
 * 存储计算后的相机矩阵，供渲染使用
 */
export class CameraMatrices {
  /** 视图矩阵 */
  viewMatrix: Matrix4Like;

  /** 投影矩阵 */
  projectionMatrix: Matrix4Like;

  /** 视图投影矩阵 */
  viewProjectionMatrix: Matrix4Like;

  /** 视图矩阵逆矩阵 */
  inverseViewMatrix?: Matrix4Like;

  /** 投影矩阵逆矩阵 */
  inverseProjectionMatrix?: Matrix4Like;

  /** 是否需要更新 */
  dirty: boolean = true;

  constructor() {
    this.viewMatrix = new Matrix4().toIMatrix4x4();
    this.projectionMatrix = new Matrix4().toIMatrix4x4();
    this.viewProjectionMatrix = new Matrix4().toIMatrix4x4();
  }

  static fromData(data: Partial<CameraMatrices>): CameraMatrices {
    const component = new CameraMatrices();
    if (data.viewMatrix) {
      component.viewMatrix = { ...data.viewMatrix };
    }
    if (data.projectionMatrix) {
      component.projectionMatrix = { ...data.projectionMatrix };
    }
    if (data.viewProjectionMatrix) {
      component.viewProjectionMatrix = { ...data.viewProjectionMatrix };
    }
    if (data.inverseViewMatrix) {
      component.inverseViewMatrix = { ...data.inverseViewMatrix };
    }
    if (data.inverseProjectionMatrix) {
      component.inverseProjectionMatrix = { ...data.inverseProjectionMatrix };
    }
    // 同步 dirty 标记，默认为 true 以确保首次更新
    component.dirty = data.dirty ?? true;
    return component;
  }

  clone(): CameraMatrices {
    const cloned = new CameraMatrices();
    cloned.viewMatrix = { ...this.viewMatrix };
    cloned.projectionMatrix = { ...this.projectionMatrix };
    cloned.viewProjectionMatrix = { ...this.viewProjectionMatrix };
    if (this.inverseViewMatrix) {
      cloned.inverseViewMatrix = { ...this.inverseViewMatrix };
    }
    if (this.inverseProjectionMatrix) {
      cloned.inverseProjectionMatrix = { ...this.inverseProjectionMatrix };
    }
    cloned.dirty = this.dirty;
    return cloned;
  }
}

// ============ CameraSystem 实现 ============

/**
 * CameraSystem
 * 计算相机的视图矩阵和投影矩阵
 *
 * @remarks
 * ## 线程安全说明
 * CameraSystem 使用实例级临时矩阵来避免 GC 压力。
 * 在 JavaScript 单线程环境下，这是安全的，因为：
 * - ECS 系统按顺序执行，不会并发调用同一 System
 * - 即使在异步环境下，execute() 方法内部是同步的
 *
 * ## 如果需要多线程支持
 * 如果未来需要在 Web Worker 中运行 CameraSystem，
 * 应该将临时矩阵改为局部变量或使用 ThreadLocal 模式。
 */
export class CameraSystem implements ISystem {
  readonly metadata: SystemMetadata = {
    name: 'CameraSystem',
    description: '计算相机视图和投影矩阵',
    stage: SystemStage.PostUpdate,
    priority: 10, // 在 TransformSystem 之后执行
    after: ['TransformSystem'],
  };

  /**
   * 临时矩阵（复用以避免 GC）
   *
   * @remarks
   * ## 线程安全约束
   * - 这些临时变量仅在 execute() 同步执行期间使用
   * - JavaScript 单线程保证不会有并发访问
   * - 如果需要多线程支持，应改用局部变量
   *
   * @internal
   */
  private tempMatrix: Matrix4 = new Matrix4();
  private tempViewMatrix: Matrix4 = new Matrix4();
  private tempProjMatrix: Matrix4 = new Matrix4();

  /**
   * 临时向量
   * @internal
   */
  private tempEye: Vector3 = new Vector3();
  private tempTarget: Vector3 = new Vector3();
  private tempUp: Vector3 = new Vector3(0, 1, 0);

  /** 缓存的查询 */
  private cameraQuery?: Query;

  /**
   * 初始化系统
   */
  initialize(ctx: SystemContext): Query | undefined {
    // 注册 CameraMatrices 组件
    ctx.world.registerComponent(CameraMatrices);

    // 创建相机查询
    this.cameraQuery = ctx.world.query({
      all: [Camera, WorldTransform],
    });

    return this.cameraQuery;
  }

  /**
   * 执行系统逻辑
   */
  execute(ctx: SystemContext, query?: Query): SystemExecutionStats | void {
    const startTime = performance.now();
    let entityCount = 0;

    const cameraQuery = query ?? this.cameraQuery;
    if (!cameraQuery) {
      return;
    }

    cameraQuery.forEach((entity, components) => {
      const camera = components[0] as Camera;
      const worldTransform = components[1] as WorldTransform;

      // 获取或创建 CameraMatrices 组件
      let matrices = ctx.world.getComponent(entity, CameraMatrices);
      if (!matrices) {
        ctx.world.addComponent(entity, CameraMatrices, new CameraMatrices());
        matrices = ctx.world.getComponent(entity, CameraMatrices)!;
      }

      // 检查是否有 CameraTarget 组件
      const cameraTarget = ctx.world.getComponent(entity, CameraTarget);

      // 计算视图矩阵
      this.computeViewMatrix(worldTransform, cameraTarget, matrices);

      // 计算投影矩阵
      this.computeProjectionMatrix(camera, matrices);

      // 计算视图投影矩阵
      this.computeViewProjectionMatrix(matrices);

      entityCount++;
    });

    return {
      entityCount,
      executionTimeMs: performance.now() - startTime,
      skipped: false,
    };
  }

  /**
   * 计算视图矩阵
   */
  private computeViewMatrix(
    transform: WorldTransform,
    target: CameraTarget | undefined,
    matrices: CameraMatrices
  ): void {
    if (target) {
      // 使用 LookAt 模式
      this.tempEye.set(transform.position.x, transform.position.y, transform.position.z);

      this.tempTarget.set(target.target.x, target.target.y, target.target.z);

      this.tempUp.set(target.up.x, target.up.y, target.up.z);

      this.tempViewMatrix.lookAt(this.tempEye, this.tempTarget, this.tempUp);
    } else {
      // 从世界变换计算（视图矩阵 = 世界矩阵的逆）
      if (transform.matrix) {
        this.tempViewMatrix.fromIMatrix4x4(transform.matrix);
        this.tempViewMatrix.invert();
      } else {
        // 从 position, rotation 构建矩阵
        const position = new Vector3(transform.position.x, transform.position.y, transform.position.z);
        const rotation = new Quaternion().set(
          transform.rotation.x,
          transform.rotation.y,
          transform.rotation.z,
          transform.rotation.w
        );
        const scale = new Vector3(1, 1, 1);
        this.tempViewMatrix.compose(position, rotation, scale);
        this.tempViewMatrix.invert();
      }
    }

    // 复制到缓存
    this.copyMatrixToLike(this.tempViewMatrix, matrices.viewMatrix);
  }

  /**
   * 计算投影矩阵
   */
  private computeProjectionMatrix(camera: Camera, matrices: CameraMatrices): void {
    if (camera.projectionType === 'perspective') {
      this.tempProjMatrix.perspective(camera.fov, camera.aspect, camera.near, camera.far);
    } else {
      // 正交投影
      const halfHeight = camera.orthographicSize;
      const halfWidth = halfHeight * camera.aspect;
      this.tempProjMatrix.orthographic(-halfWidth, halfWidth, -halfHeight, halfHeight, camera.near, camera.far);
    }

    // 复制到缓存
    this.copyMatrixToLike(this.tempProjMatrix, matrices.projectionMatrix);
  }

  /**
   * 计算视图投影矩阵
   */
  private computeViewProjectionMatrix(matrices: CameraMatrices): void {
    // ViewProjection = Projection * View
    this.tempMatrix.fromIMatrix4x4(matrices.projectionMatrix);
    this.tempViewMatrix.fromIMatrix4x4(matrices.viewMatrix);
    this.tempMatrix.multiply(this.tempViewMatrix);

    // 复制到缓存
    this.copyMatrixToLike(this.tempMatrix, matrices.viewProjectionMatrix);
    matrices.dirty = false;
  }

  /**
   * 复制 Matrix4 到 Matrix4Like
   */
  private copyMatrixToLike(src: Matrix4, dst: Matrix4Like): void {
    dst.m00 = src.m00;
    dst.m01 = src.m01;
    dst.m02 = src.m02;
    dst.m03 = src.m03;
    dst.m10 = src.m10;
    dst.m11 = src.m11;
    dst.m12 = src.m12;
    dst.m13 = src.m13;
    dst.m20 = src.m20;
    dst.m21 = src.m21;
    dst.m22 = src.m22;
    dst.m23 = src.m23;
    dst.m30 = src.m30;
    dst.m31 = src.m31;
    dst.m32 = src.m32;
    dst.m33 = src.m33;
  }

  /**
   * 销毁系统
   */
  dispose(ctx: SystemContext): void {
    if (this.cameraQuery) {
      ctx.world.removeQuery(this.cameraQuery);
      this.cameraQuery = undefined;
    }
  }
}

// ============ 便捷函数 ============

/**
 * 创建 CameraSystem 实例
 */
export function createCameraSystem(): CameraSystem {
  return new CameraSystem();
}
