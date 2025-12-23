/**
 * InteractionSystem
 * 交互检测系统 - 处理用户输入和交互状态
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 职责
 *
 * 1. 处理指针输入（鼠标、触摸）
 * 2. 执行射线检测（Raycast）
 * 3. 更新交互状态（Hover、Press、Focus）
 * 4. 触发交互事件
 *
 * ## 执行阶段
 *
 * **FrameStart** - 在帧开始时处理输入
 *
 * ## 查询
 *
 * - 可交互实体：`{ all: [Interactable, WorldTransform] }`
 * - 可选：Collider 组件用于精确检测
 *
 * ## 算法
 *
 * ```pseudocode
 * // 获取输入状态
 * pointerPosition = getPointerPosition()
 * pointerDown = isPointerDown()
 *
 * // 射线检测
 * hits = raycast(pointerPosition)
 *
 * // 更新状态
 * FOR each entity WITH (Interactable):
 *   wasHovered = entity.Interactable.hovered
 *   isHovered = hits.contains(entity)
 *
 *   IF isHovered AND NOT wasHovered:
 *     emit('pointerenter', entity)
 *   ELSE IF NOT isHovered AND wasHovered:
 *     emit('pointerleave', entity)
 *
 *   entity.Interactable.hovered = isHovered
 *   entity.Interactable.pressed = isHovered AND pointerDown
 * ```
 *
 * @remarks
 * **注意**: 当前为骨架实现，Interaction 相关组件尚未定义。
 * 后续需要在 components/interaction/ 中添加：
 * - Interactable: 可交互标记
 * - InteractionState: 交互状态（hovered, pressed, focused）
 * - Draggable: 可拖拽配置
 * - Clickable: 可点击配置
 */

import type { Query, SystemContext } from '../../ecs';
import { SystemStage } from '../../ecs';
import type { ISystem, SystemMetadata, SystemExecutionStats } from '../types';

/**
 * InteractionSystem 元数据
 */
const INTERACTION_SYSTEM_METADATA: SystemMetadata = {
  name: 'InteractionSystem',
  description: '处理用户输入和交互状态',
  stage: SystemStage.FrameStart,
  priority: 0,
};

/**
 * InteractionSystem
 * 负责交互检测和状态管理
 *
 * @example
 * ```typescript
 * const interactionSystem = new InteractionSystem();
 * scheduler.addSystem({
 *   ...interactionSystem.metadata,
 *   execute: (ctx, query) => interactionSystem.execute(ctx, query)
 * });
 * ```
 */
export class InteractionSystem implements ISystem {
  readonly metadata: SystemMetadata = INTERACTION_SYSTEM_METADATA;

  /** 可交互实体查询 */
  private query?: Query;

  /**
   * 初始化 InteractionSystem
   */
  initialize(ctx: SystemContext): Query | undefined {
    // TODO: 创建交互相关组件的查询
    // 等待 interaction 组件定义后实现
    return this.query;
  }

  /**
   * 执行交互检测
   *
   * @param ctx System 上下文
   * @param query 关联的 Query
   * @returns 执行统计
   */
  execute(ctx: SystemContext, query?: Query): SystemExecutionStats {
    const startTime = performance.now();
    const entityCount = 0;

    // TODO: 实际实现
    // 1. 获取输入状态（从 InputResource）
    // 2. 执行射线检测
    // 3. 更新交互状态
    // 4. 触发事件

    const endTime = performance.now();

    return {
      entityCount,
      executionTimeMs: endTime - startTime,
      skipped: false,
    };
  }

  /**
   * 销毁 InteractionSystem
   */
  dispose(ctx: SystemContext): void {
    this.query = undefined;
  }
}

/**
 * 创建 InteractionSystem 的 SystemDef
 */
export function createInteractionSystemDef(): {
  name: string;
  stage: SystemStage;
  priority?: number;
  execute: (ctx: SystemContext, query?: Query) => void;
} {
  const system = new InteractionSystem();

  return {
    name: system.metadata.name,
    stage: system.metadata.stage,
    priority: system.metadata.priority,
    execute: (ctx, query) => system.execute(ctx, query),
  };
}
