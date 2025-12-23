/**
 * Systems Module
 * Phase 4 逻辑系统的统一导出
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 模块结构
 *
 * ```text
 * src/systems/
 * ├── index.ts              # 本文件 - 统一导出
 * ├── types.ts              # 公共类型定义
 * ├── transform/            # 变换计算系统
 * │   └── index.ts
 * ├── layout/               # 布局计算系统
 * │   └── index.ts
 * ├── animation/            # 动画更新系统
 * │   └── index.ts
 * └── interaction/          # 交互检测系统
 *     └── index.ts
 * ```
 *
 * ## 使用示例
 *
 * ```typescript
 * import {
 *   TransformSystem,
 *   AnimationSystem,
 *   createTransformSystemDef,
 *   createAnimationSystemDef,
 * } from '@maxellabs/core/systems';
 *
 * // 方式 1: 使用 System 类
 * const transformSystem = new TransformSystem();
 * scheduler.addSystem({
 *   name: transformSystem.metadata.name,
 *   stage: transformSystem.metadata.stage,
 *   execute: (ctx, query) => transformSystem.execute(ctx, query),
 * });
 *
 * // 方式 2: 使用工厂函数（推荐）
 * scheduler.addSystem(createTransformSystemDef());
 * scheduler.addSystem(createAnimationSystemDef());
 * ```
 *
 * ## 执行顺序
 *
 * 系统按以下阶段和优先级执行：
 *
 * | Stage       | System            | Priority | Notes                    |
 * |-------------|-------------------|----------|--------------------------|
 * | FrameStart  | InteractionSystem | 0        | 处理输入                 |
 * | Update      | AnimationSystem   | 0        | 更新动画                 |
 * | PostUpdate  | TransformSystem   | 0        | 计算世界变换             |
 * | PostUpdate  | LayoutSystem      | 10       | 计算布局（依赖变换）     |
 */

// ============ 类型导出 ============

export type { ISystem, SystemMetadata, SystemExecutionStats, SystemConstructor, SystemFactory } from './types';

// ============ Transform System ============

export { TransformSystem, createTransformSystemDef } from './transform';

// ============ Layout System ============

export { LayoutSystem, createLayoutSystemDef } from './layout';

// ============ Animation System ============

export { AnimationSystem, createAnimationSystemDef, getTweenValue } from './animation';

// ============ Interaction System ============

export { InteractionSystem, createInteractionSystemDef } from './interaction';

// ============ Camera System ============

export { CameraSystem, CameraMatrices, createCameraSystem } from './camera';

// ============ Render System ============

export { RenderSystem, createRenderSystem } from './render';
export type { Renderable, RenderContext, RenderHook } from './render';
