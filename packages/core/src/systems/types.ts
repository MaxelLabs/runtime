/**
 * System Types
 * Phase 4 逻辑系统的类型定义
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计决策
 *
 * 本模块定义 Phase 4 逻辑系统使用的公共类型和接口。
 * 所有类型设计遵循 Constitution 规范：
 * - 类型优先：接口定义在实现之前
 * - 无 `any` 类型
 * - 深拷贝规范
 *
 * ## System 分类
 *
 * Phase 4 系统按职责分为四类：
 * - **TransformSystem**: 变换计算（LocalTransform → WorldTransform）
 * - **LayoutSystem**: 布局计算（UI 元素定位）
 * - **AnimationSystem**: 动画更新（时间插值、状态更新）
 * - **InteractionSystem**: 交互检测（点击、悬停等）
 */

import type { SystemStage, SystemContext, Query } from '../ecs';

// ============ System 元数据 ============

/**
 * System 元数据
 * 描述 System 的静态信息，用于注册和调试
 */
export interface SystemMetadata {
  /** System 唯一名称 */
  readonly name: string;
  /** System 描述 */
  readonly description?: string;
  /** 执行阶段 */
  readonly stage: SystemStage;
  /** 执行优先级（同阶段内，数字越小越先执行） */
  readonly priority?: number;
  /** 依赖的 System 名称列表 */
  readonly after?: readonly string[];
}

// ============ System 执行结果 ============

/**
 * System 执行统计
 */
export interface SystemExecutionStats {
  /** 处理的实体数量 */
  entityCount: number;
  /** 执行时间（毫秒） */
  executionTimeMs: number;
  /** 是否跳过执行 */
  skipped: boolean;
  /** 跳过原因（如果 skipped 为 true） */
  skipReason?: string;
}

// ============ System 接口 ============

/**
 * 基础 System 接口
 * 所有 Phase 4 逻辑系统都应实现此接口
 *
 * @remarks
 * System 是纯逻辑单元，负责处理具有特定组件组合的实体。
 * 每个 System 应该：
 * - 只读取/写入与其职责相关的组件
 * - 不持有跨帧状态（除非必要）
 * - 使用 Query 高效获取目标实体
 */
export interface ISystem {
  /** System 元数据 */
  readonly metadata: SystemMetadata;

  /**
   * 初始化 System
   * 在 System 首次执行前调用一次
   *
   * @param ctx System 上下文
   * @returns 初始化的 Query 实例（如果需要）
   */
  initialize?(ctx: SystemContext): Query | undefined;

  /**
   * 执行 System 逻辑
   *
   * @param ctx System 上下文（包含 world、deltaTime 等）
   * @param query 关联的 Query（如果在 initialize 中创建）
   * @returns 执行统计（可选）
   */
  execute(ctx: SystemContext, query?: Query): SystemExecutionStats | void;

  /**
   * 销毁 System
   * 在 System 被移除时调用
   *
   * @param ctx System 上下文
   */
  dispose?(ctx: SystemContext): void;
}

// ============ 辅助类型 ============

/**
 * System 构造函数类型
 */
export type SystemConstructor = new () => ISystem;

/**
 * System 工厂函数类型
 */
export type SystemFactory = () => ISystem;
