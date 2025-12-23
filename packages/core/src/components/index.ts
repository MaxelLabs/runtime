/**
 * ECS Data Components
 * 面向数据的 ECS 组件集合
 *
 * @packageDocumentation
 *
 * @remarks
 * 所有组件都是纯数据结构(POD - Plain Old Data),不包含业务逻辑。
 * 每个组件类都实现了 `static fromData()` 方法用于数据解析。
 *
 * @example
 * ```typescript
 * import { LocalTransform, Velocity, MeshRef } from '@maxellabs/core/components';
 * import { World } from '@maxellabs/core';
 *
 * const world = new World();
 *
 * // 创建实体并添加组件
 * const entity = world.createEntity();
 * world.addComponent(entity, LocalTransform, LocalTransform.fromData({
 *   position: { x: 10, y: 0, z: 0 },
 *   rotation: { x: 0, y: 0, z: 0, w: 1 },
 *   scale: { x: 1, y: 1, z: 1 }
 * }));
 * world.addComponent(entity, Velocity, Velocity.fromData({ x: 1, y: 0, z: 0 }));
 * world.addComponent(entity, MeshRef, MeshRef.fromData({ assetId: 'cube' }));
 * ```
 */

// Base Component - 组件基类
export * from './base';

// Transform Components - 变换相关组件
export * from './transform';

// Visual Components - 视觉渲染相关组件
export * from './visual';

// Data Components - 元数据和标签组件
export * from './data';

// Physics Components - 物理模拟相关组件
export * from './physics';

// Animation Components - 动画相关组件
export * from './animation';

/**
 * 组件类型辅助类型
 * @internal
 */
export type ComponentFromData<T> = {
  fromData(data: Partial<T>): T;
};

/**
 * 提取组件数据类型
 * @internal
 */
export type ComponentData<T> = Partial<T>;
