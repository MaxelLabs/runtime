/**
 * ECS Core 模块导出
 *
 * @remarks
 * 此模块导出 ECS 核心功能，包括：
 * - 实体管理（Entity）
 * - 组件系统（Component）
 * - 系统调度（System）
 * - 查询系统（Query）
 * - 世界管理（World）
 *
 * **关于 DAGScheduler 的导出说明**:
 * DAGScheduler 是一个通用的有向无环图调度器，虽然主要用于 SystemScheduler 内部，
 * 但也作为公共 API 导出，供用户在以下场景使用：
 * - 自定义任务调度系统
 * - 构建系统依赖分析
 * - 模块加载顺序计算
 * - 任何需要拓扑排序的场景
 *
 * 如果只需要 System 调度功能，建议直接使用 SystemScheduler。
 */

export * from './change-detection';
export * from './entity-manager';
export * from './gpu-buffer-sync';
export * from './render-data-storage';
export * from './archetype';
export * from './world';
export * from './command-buffer';
export * from './component-registry';
export * from './debug-tools';
export * from './entity-builder';
export * from './entity-id';
export * from './query';
export * from './typed-component-storage';
export * from './systems';

// DAGScheduler 作为通用工具类导出，可独立于 SystemScheduler 使用
export * from './dag-scheduler';
