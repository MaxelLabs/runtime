/**
 * TransformSystem
 * 变换计算系统 - 计算 WorldTransform 从 LocalTransform
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 职责
 *
 * 1. 遍历所有具有 LocalTransform 的实体
 * 2. 根据层级关系（Parent/Children）计算 WorldTransform
 * 3. 使用 dirty 标记优化：只更新脏节点及其子孙
 *
 * ## 执行阶段
 *
 * **PostUpdate** - 在游戏逻辑更新后、渲染准备前执行
 *
 * ## 查询
 *
 * - 主查询：`{ all: [LocalTransform, WorldTransform] }`
 * - 可选：Parent、Children 组件用于层级计算
 *
 * ## 算法
 *
 * ```pseudocode
 * FOR each entity WITH (LocalTransform, WorldTransform):
 *   IF entity.LocalTransform.dirty:
 *     parentWorld = getParentWorldMatrix(entity)
 *     entity.WorldTransform = parentWorld * entity.LocalTransform
 *     entity.LocalTransform.clearDirty()
 *     markChildrenDirty(entity)
 * ```
 */

import type { Query, SystemContext } from '../../ecs';
import { SystemStage } from '../../ecs';
import type { ISystem, SystemMetadata, SystemExecutionStats } from '../types';
import { LocalTransform, WorldTransform, Parent, Children, NO_PARENT_ENTITY } from '../../components/transform';
import { Matrix4, Vector3, Quaternion } from '@maxellabs/math';

/**
 * TransformSystem 元数据
 */
const TRANSFORM_SYSTEM_METADATA: SystemMetadata = {
  name: 'TransformSystem',
  description: '计算 WorldTransform 从 LocalTransform 和层级关系',
  stage: SystemStage.PostUpdate,
  priority: 0, // 最高优先级，其他系统可能依赖 WorldTransform
};

/**
 * TransformSystem
 * 负责计算世界变换矩阵
 *
 * @example
 * ```typescript
 * const transformSystem = new TransformSystem();
 * scheduler.addSystem({
 *   ...transformSystem.metadata,
 *   execute: (ctx, query) => transformSystem.execute(ctx, query)
 * });
 * ```
 */
export class TransformSystem implements ISystem {
  readonly metadata: SystemMetadata = TRANSFORM_SYSTEM_METADATA;

  /** 缓存的查询 - 带有 LocalTransform 的实体 */
  private transformQuery?: Query;

  /** 临时矩阵，用于计算避免每帧分配 */
  private readonly tempLocalMatrix: Matrix4 = new Matrix4();
  private readonly tempParentMatrix: Matrix4 = new Matrix4();
  private readonly tempWorldMatrix: Matrix4 = new Matrix4();

  /** 临时向量，用于计算 */
  private readonly tempPosition: Vector3 = new Vector3();
  private readonly tempScale: Vector3 = new Vector3();
  private readonly tempRotation: Quaternion = new Quaternion();

  /**
   * 初始化 TransformSystem
   * 创建查询 LocalTransform + WorldTransform 的实体
   */
  initialize(ctx: SystemContext): Query | undefined {
    // 创建查询：所有具有 LocalTransform 和 WorldTransform 的实体
    this.transformQuery = ctx.world.query({
      all: [LocalTransform, WorldTransform],
    });
    return this.transformQuery;
  }

  /**
   * 执行变换计算
   *
   * @param ctx System 上下文
   * @param query 关联的 Query
   * @returns 执行统计
   */
  execute(ctx: SystemContext, query?: Query): SystemExecutionStats {
    const startTime = performance.now();
    let entityCount = 0;
    // dirtyCount 用于调试，可在 execute 返回值中扩展

    const activeQuery = query ?? this.transformQuery;
    if (!activeQuery) {
      return {
        entityCount: 0,
        executionTimeMs: performance.now() - startTime,
        skipped: true,
        skipReason: 'No query available',
      };
    }

    // 遍历所有具有 Transform 组件的实体
    activeQuery.forEach((entity, components) => {
      entityCount++;

      const localTransform = components[0] as LocalTransform;
      const worldTransform = components[1] as WorldTransform;

      // 只处理脏的 LocalTransform
      if (!localTransform.dirty) {
        return;
      }

      // 计算本地变换矩阵
      this.computeLocalMatrix(localTransform, this.tempLocalMatrix);

      // 获取父级世界矩阵
      const parentMatrix = this.getParentWorldMatrix(ctx, entity);

      // 计算世界矩阵: WorldMatrix = ParentWorld * Local
      if (parentMatrix) {
        Matrix4.multiply(parentMatrix, this.tempLocalMatrix, this.tempWorldMatrix);
      } else {
        // 没有父级，世界矩阵 = 本地矩阵
        this.tempWorldMatrix.copyFrom(this.tempLocalMatrix);
      }

      // 将世界矩阵分解为位置、旋转、缩放
      this.decomposeMatrixToTransform(this.tempWorldMatrix, worldTransform);

      // 存储世界矩阵
      worldTransform.matrix = this.tempWorldMatrix.toIMatrix4x4();

      // 清除脏标记
      localTransform.clearDirty();

      // 标记所有子实体为脏（级联更新）
      this.markChildrenDirty(ctx, entity);
    });

    const endTime = performance.now();

    return {
      entityCount,
      executionTimeMs: endTime - startTime,
      skipped: false,
    };
  }

  /**
   * 从 LocalTransform 计算本地变换矩阵
   */
  private computeLocalMatrix(transform: LocalTransform, out: Matrix4): void {
    // 设置临时向量
    this.tempPosition.x = transform.position.x;
    this.tempPosition.y = transform.position.y;
    this.tempPosition.z = transform.position.z;

    this.tempRotation.x = transform.rotation.x;
    this.tempRotation.y = transform.rotation.y;
    this.tempRotation.z = transform.rotation.z;
    this.tempRotation.w = transform.rotation.w;

    this.tempScale.x = transform.scale.x;
    this.tempScale.y = transform.scale.y;
    this.tempScale.z = transform.scale.z;

    // 使用 Matrix4.compose 组合 TRS
    out.compose(this.tempPosition, this.tempRotation, this.tempScale);
  }

  /**
   * 获取父级实体的世界矩阵
   */
  private getParentWorldMatrix(ctx: SystemContext, entity: number): Matrix4 | null {
    // 获取 Parent 组件
    const parent = ctx.world.getComponent(entity, Parent);
    if (!parent || parent.entity === NO_PARENT_ENTITY) {
      return null;
    }

    // 获取父级的 WorldTransform
    const parentWorldTransform = ctx.world.getComponent(parent.entity, WorldTransform);
    if (!parentWorldTransform || !parentWorldTransform.matrix) {
      return null;
    }

    // 从 Matrix4Like 创建 Matrix4
    this.tempParentMatrix.fromIMatrix4x4(parentWorldTransform.matrix);
    return this.tempParentMatrix;
  }

  /**
   * 将矩阵分解为 Transform 组件的位置、旋转、缩放
   */
  private decomposeMatrixToTransform(matrix: Matrix4, transform: WorldTransform): void {
    // 分解矩阵
    matrix.decompose(this.tempPosition, this.tempRotation, this.tempScale);

    // 写入 WorldTransform
    transform.position = {
      x: this.tempPosition.x,
      y: this.tempPosition.y,
      z: this.tempPosition.z,
    };

    transform.rotation = {
      x: this.tempRotation.x,
      y: this.tempRotation.y,
      z: this.tempRotation.z,
      w: this.tempRotation.w,
    };

    transform.scale = {
      x: this.tempScale.x,
      y: this.tempScale.y,
      z: this.tempScale.z,
    };
  }

  /**
   * 标记所有子实体的 LocalTransform 为脏
   * 这确保层级变换的级联更新
   */
  private markChildrenDirty(ctx: SystemContext, entity: number): void {
    const children = ctx.world.getComponent(entity, Children);
    if (!children || children.entities.length === 0) {
      return;
    }

    for (const childId of children.entities) {
      const childTransform = ctx.world.getComponent(childId, LocalTransform);
      if (childTransform) {
        childTransform.markDirty();
      }
    }
  }

  /**
   * 销毁 TransformSystem
   */
  dispose(_ctx: SystemContext): void {
    this.transformQuery = undefined;
  }
}

/**
 * 创建 TransformSystem 的 SystemDef
 * 便于直接注册到 SystemScheduler
 */
export function createTransformSystemDef(): {
  name: string;
  stage: SystemStage;
  priority?: number;
  execute: (ctx: SystemContext, query?: Query) => void;
} {
  const system = new TransformSystem();

  return {
    name: system.metadata.name,
    stage: system.metadata.stage,
    priority: system.metadata.priority,
    execute: (ctx, query) => system.execute(ctx, query),
  };
}
