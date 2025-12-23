/**
 * LayoutSystem
 * 布局计算系统 - 计算 UI 元素的位置和尺寸
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 职责
 *
 * 1. 处理 UI 元素的布局约束
 * 2. 计算 Flexbox 布局
 * 3. 处理锚点和边距
 * 4. 将结果写入 LayoutResult 组件
 *
 * ## 执行阶段
 *
 * **PostUpdate** - 在 TransformSystem 之后执行
 *
 * ## 依赖
 *
 * - 依赖 TransformSystem 的结果（after: ['TransformSystem']）
 *
 * ## 查询
 *
 * - 有锚点的元素：`{ all: [Anchor, LayoutResult] }`
 * - Flex 容器：`{ all: [FlexContainer, LayoutResult] }`
 * - Flex 子项：`{ all: [FlexItem, LayoutResult] }`
 *
 * ## 算法
 *
 * ```pseudocode
 * // Phase 1: 约束布局（锚点定位）
 * FOR each entity WITH (Anchor, LayoutResult):
 *   parentSize = getParentSize(entity)
 *   result.x = anchor.minX * parentSize.width
 *   result.y = anchor.minY * parentSize.height
 *   result.width = (anchor.maxX - anchor.minX) * parentSize.width
 *   result.height = (anchor.maxY - anchor.minY) * parentSize.height
 *
 * // Phase 2: Flex 布局
 * FOR each entity WITH (FlexContainer):
 *   children = getFlexChildren(entity)
 *   layoutFlexChildren(container, children)
 * ```
 */

import type { Query, SystemContext } from '../../ecs';
import { SystemStage } from '../../ecs';
import type { ISystem, SystemMetadata, SystemExecutionStats } from '../types';
import {
  Anchor,
  FlexContainer,
  FlexItem,
  LayoutResult,
  SizeConstraint,
  Margin,
  Padding,
} from '../../components/layout';
import { Children, Parent } from '../../components/transform';

/**
 * LayoutSystem 元数据
 */
const LAYOUT_SYSTEM_METADATA: SystemMetadata = {
  name: 'LayoutSystem',
  description: '计算 UI 元素布局',
  stage: SystemStage.PostUpdate,
  priority: 10, // 在 TransformSystem (0) 之后
  after: ['TransformSystem'],
};

/**
 * 默认根容器尺寸（当没有父级时使用）
 */
const DEFAULT_ROOT_SIZE = { width: 1920, height: 1080 };

/**
 * LayoutSystem
 * 负责 UI 布局计算
 *
 * @example
 * ```typescript
 * const layoutSystem = new LayoutSystem();
 * scheduler.addSystem({
 *   ...layoutSystem.metadata,
 *   execute: (ctx, query) => layoutSystem.execute(ctx, query)
 * });
 * ```
 */
export class LayoutSystem implements ISystem {
  readonly metadata: SystemMetadata = LAYOUT_SYSTEM_METADATA;

  /** 锚点布局查询 */
  private anchorQuery?: Query;

  /** Flex 容器查询 */
  private flexContainerQuery?: Query;

  /**
   * 初始化 LayoutSystem
   */
  initialize(ctx: SystemContext): Query | undefined {
    // 创建布局相关组件的查询
    this.anchorQuery = ctx.world.query({ all: [Anchor, LayoutResult] });
    this.flexContainerQuery = ctx.world.query({ all: [FlexContainer, LayoutResult, Children] });
    return this.anchorQuery;
  }

  /**
   * 执行布局计算
   *
   * @param ctx System 上下文
   * @param _query 未使用
   * @returns 执行统计
   */
  execute(ctx: SystemContext, _query?: Query): SystemExecutionStats {
    const startTime = performance.now();
    let entityCount = 0;

    // Phase 1: 锚点布局
    entityCount += this.processAnchorLayout(ctx);

    // Phase 2: Flex 布局
    entityCount += this.processFlexLayout(ctx);

    const endTime = performance.now();

    return {
      entityCount,
      executionTimeMs: endTime - startTime,
      skipped: false,
    };
  }

  /**
   * 处理锚点布局
   */
  private processAnchorLayout(ctx: SystemContext): number {
    if (!this.anchorQuery) {
      return 0;
    }

    let count = 0;

    this.anchorQuery.forEach((entity, components) => {
      count++;
      const anchor = components[0] as Anchor;
      const result = components[1] as LayoutResult;

      // 跳过非脏的锚点
      if (!anchor.dirty) {
        return;
      }

      // 获取父级尺寸
      const parentSize = this.getParentSize(ctx, entity);

      // 获取边距
      const margin = ctx.world.getComponent(entity, Margin);
      const marginLeft = margin?.left ?? 0;
      const marginRight = margin?.right ?? 0;
      const marginTop = margin?.top ?? 0;
      const marginBottom = margin?.bottom ?? 0;

      // 计算位置和尺寸
      const anchorLeft = anchor.minX * parentSize.width;
      const anchorRight = anchor.maxX * parentSize.width;
      const anchorTop = anchor.minY * parentSize.height;
      const anchorBottom = anchor.maxY * parentSize.height;

      // 应用边距
      result.x = anchorLeft + marginLeft;
      result.y = anchorTop + marginTop;
      result.width = anchorRight - anchorLeft - marginLeft - marginRight;
      result.height = anchorBottom - anchorTop - marginTop - marginBottom;

      // 应用尺寸约束
      const constraint = ctx.world.getComponent(entity, SizeConstraint);
      if (constraint) {
        if (constraint.minWidth !== undefined) {
          result.width = Math.max(result.width, constraint.minWidth);
        }
        if (constraint.maxWidth !== undefined) {
          result.width = Math.min(result.width, constraint.maxWidth);
        }
        if (constraint.minHeight !== undefined) {
          result.height = Math.max(result.height, constraint.minHeight);
        }
        if (constraint.maxHeight !== undefined) {
          result.height = Math.min(result.height, constraint.maxHeight);
        }
      }

      // 确保尺寸非负
      result.width = Math.max(0, result.width);
      result.height = Math.max(0, result.height);

      // 清除脏标记
      anchor.clearDirty();
    });

    return count;
  }

  /**
   * 处理 Flex 布局
   */
  private processFlexLayout(ctx: SystemContext): number {
    if (!this.flexContainerQuery) {
      return 0;
    }

    let count = 0;

    this.flexContainerQuery.forEach((entity, components) => {
      count++;
      const container = components[0] as FlexContainer;
      const containerResult = components[1] as LayoutResult;
      const children = components[2] as Children;

      // 跳过非脏的容器
      if (!container.dirty) {
        return;
      }

      // 收集 Flex 子项
      const flexChildren = this.collectFlexChildren(ctx, children);
      if (flexChildren.length === 0) {
        container.clearDirty();
        return;
      }

      // 获取容器内边距
      const padding = ctx.world.getComponent(entity, Padding);
      const paddingLeft = padding?.left ?? 0;
      const paddingRight = padding?.right ?? 0;
      const paddingTop = padding?.top ?? 0;
      const paddingBottom = padding?.bottom ?? 0;

      // 可用空间
      const availableWidth = containerResult.width - paddingLeft - paddingRight;
      const availableHeight = containerResult.height - paddingTop - paddingBottom;

      // 判断主轴方向
      const isRow = container.direction === 'row' || container.direction === 'row-reverse';
      const isReverse = container.direction === 'row-reverse' || container.direction === 'column-reverse';
      const mainSize = isRow ? availableWidth : availableHeight;
      const crossSize = isRow ? availableHeight : availableWidth;

      // 按 order 排序
      flexChildren.sort((a, b) => (a.item.order ?? 0) - (b.item.order ?? 0));

      // 计算子项尺寸
      const gap = container.gap ?? 0;
      const totalGap = gap * (flexChildren.length - 1);
      let totalBasis = 0;
      let totalGrow = 0;
      let totalShrink = 0;

      for (const child of flexChildren) {
        const basis = child.item.basis === 'auto' ? 0 : child.item.basis;
        totalBasis += basis;
        totalGrow += child.item.grow;
        totalShrink += child.item.shrink;
      }

      // 计算剩余空间
      const freeSpace = mainSize - totalBasis - totalGap;

      // 分配空间
      let currentPos = isReverse ? mainSize : 0;
      if (isReverse) {
        currentPos -= paddingRight;
      } else {
        currentPos += paddingLeft;
      }

      // 处理 justifyContent
      let spacing = 0;
      let startOffset = 0;
      if (freeSpace > 0 && totalGrow === 0) {
        switch (container.justifyContent) {
          case 'flex-end':
            startOffset = freeSpace;
            break;
          case 'center':
            startOffset = freeSpace / 2;
            break;
          case 'space-between':
            spacing = flexChildren.length > 1 ? freeSpace / (flexChildren.length - 1) : 0;
            break;
          case 'space-around':
            spacing = freeSpace / flexChildren.length;
            startOffset = spacing / 2;
            break;
          case 'space-evenly':
            spacing = freeSpace / (flexChildren.length + 1);
            startOffset = spacing;
            break;
        }
        if (isReverse) {
          currentPos -= startOffset;
        } else {
          currentPos += startOffset;
        }
      }

      for (const child of flexChildren) {
        const { item, result } = child;
        let itemMainSize: number;
        const basis = item.basis === 'auto' ? 0 : item.basis;

        if (freeSpace > 0 && totalGrow > 0) {
          // 扩展
          itemMainSize = basis + (freeSpace * item.grow) / totalGrow;
        } else if (freeSpace < 0 && totalShrink > 0) {
          // 收缩
          itemMainSize = basis + (freeSpace * item.shrink) / totalShrink;
        } else {
          itemMainSize = basis;
        }

        itemMainSize = Math.max(0, itemMainSize);

        // 设置尺寸
        if (isRow) {
          result.width = itemMainSize;
          result.height = crossSize; // 默认拉伸
        } else {
          result.width = crossSize; // 默认拉伸
          result.height = itemMainSize;
        }

        // 处理 alignItems / alignSelf
        const align = item.alignSelf !== 'auto' && item.alignSelf ? item.alignSelf : container.alignItems;
        const crossPos = this.calculateCrossPosition(align, crossSize, isRow ? result.height : result.width);

        // 设置位置
        if (isReverse) {
          currentPos -= itemMainSize;
        }

        if (isRow) {
          result.x = currentPos;
          result.y = paddingTop + crossPos;
        } else {
          result.x = paddingLeft + crossPos;
          result.y = currentPos;
        }

        if (!isReverse) {
          currentPos += itemMainSize + gap + spacing;
        } else {
          currentPos -= gap + spacing;
        }
      }

      // 清除脏标记
      container.clearDirty();
    });

    return count;
  }

  /**
   * 收集 Flex 子项
   */
  private collectFlexChildren(ctx: SystemContext, children: Children): Array<{ item: FlexItem; result: LayoutResult }> {
    const result: Array<{ item: FlexItem; result: LayoutResult }> = [];

    for (const childId of children.entities) {
      const flexItem = ctx.world.getComponent(childId, FlexItem);
      const layoutResult = ctx.world.getComponent(childId, LayoutResult);

      if (flexItem && layoutResult) {
        result.push({ item: flexItem, result: layoutResult });
      }
    }

    return result;
  }

  /**
   * 计算交叉轴位置
   */
  private calculateCrossPosition(align: string, containerSize: number, itemSize: number): number {
    switch (align) {
      case 'flex-end':
        return containerSize - itemSize;
      case 'center':
        return (containerSize - itemSize) / 2;
      case 'stretch':
      case 'flex-start':
      default:
        return 0;
    }
  }

  /**
   * 获取父级尺寸
   */
  private getParentSize(ctx: SystemContext, entity: number): { width: number; height: number } {
    const parent = ctx.world.getComponent(entity, Parent);
    if (!parent || parent.entity === -1) {
      return DEFAULT_ROOT_SIZE;
    }

    const parentResult = ctx.world.getComponent(parent.entity, LayoutResult);
    if (parentResult) {
      return { width: parentResult.width, height: parentResult.height };
    }

    return DEFAULT_ROOT_SIZE;
  }

  /**
   * 销毁 LayoutSystem
   */
  dispose(_ctx: SystemContext): void {
    this.anchorQuery = undefined;
    this.flexContainerQuery = undefined;
  }
}

/**
 * 创建 LayoutSystem 的 SystemDef
 */
export function createLayoutSystemDef(): {
  name: string;
  stage: SystemStage;
  priority?: number;
  after?: string[];
  execute: (ctx: SystemContext, query?: Query) => void;
} {
  const system = new LayoutSystem();

  return {
    name: system.metadata.name,
    stage: system.metadata.stage,
    priority: system.metadata.priority,
    after: system.metadata.after ? [...system.metadata.after] : undefined,
    execute: (ctx, query) => system.execute(ctx, query),
  };
}
