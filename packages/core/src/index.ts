/**
 * @maxellabs/core 核心模块导出
 *
 * @packageDocumentation
 *
 * @remarks
 * 此模块导出引擎核心功能，包括：
 * - ECS 系统（实体、组件、系统）
 * - 基础框架（MaxObject、ReferResource）
 * - 事件系统
 * - 基础设施（IOC 容器、Canvas 包装器）
 * - 工具函数
 * - 组件库
 * - RHI 渲染硬件接口
 *
 * @example
 * ```typescript
 * import { World, Component, SystemScheduler } from '@maxellabs/core';
 * import { MMath, MSpec } from '@maxellabs/core';
 * ```
 */

// ECS 系统
export * from './ecs';

// 基础框架
export * from './base';

// 事件系统
export * from './events';

// 基础设施
export * from './infrastructure';

// 工具函数
export * from './utils';

// 组件库
export * from './components';

// 逻辑系统 (Phase 4)
export * from './systems';

// 场景管理
export * from './scene';

// 资源管理
export * from './resources';

// 渲染器模块
export * from './renderer';

// RHI 接口
export * from './rhi';

// 数学库（命名空间导出）
export * as MMath from '@maxellabs/math';

// 规范定义（命名空间导出）
export * as MSpec from '@maxellabs/specification';
