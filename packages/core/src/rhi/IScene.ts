/**
 * IScene 接口 - ECS 模式的场景管理
 *
 * 这个接口定义了场景的核心功能，使用 ECS（Entity-Component-System）架构：
 * - EntityId 是一个数字，不是对象
 * - 组件数据存储在 World 中，通过 EntityId 访问
 * - 使用 Query 系统来查找具有特定组件的实体
 *
 * @see packages/core/src/ecs/core/entity-id.ts - EntityId 类型定义
 * @see packages/core/src/ecs/core/world.ts - World 类实现
 * @see packages/core/src/ecs/core/query.ts - Query 系统
 */

import type { IDisposable } from '../base';
import type { EntityId, World, ComponentClass } from '../ecs';

/**
 * 场景元数据组件 - 存储实体的场景相关信息
 */
export interface SceneMetadata {
  /** 实体名称 */
  name: string;
  /** 实体标签 */
  tag: string;
  /** 实体是否激活 */
  active: boolean;
}

/**
 * 层级关系组件 - 存储实体的父子关系
 */
export interface HierarchyComponent {
  /** 父实体 ID，null 表示根实体 */
  parent: EntityId | null;
  /** 子实体 ID 列表 */
  children: EntityId[];
}

/**
 * 场景事件类型
 */
export type SceneEventType = 'load' | 'unload' | 'update' | 'entityAdded' | 'entityRemoved';

/**
 * 场景事件监听器
 */
export type SceneEventListener<T = unknown> = (data: T) => void;

/**
 * IScene 接口 - ECS 模式的场景管理接口
 *
 * 场景是实体的容器，负责：
 * - 管理实体的生命周期
 * - 提供实体查询功能
 * - 处理场景事件
 * - 协调系统更新
 */
export interface IScene extends IDisposable {
  /** 场景名称 */
  readonly name: string;

  /** 获取场景关联的 World 实例 */
  readonly world: World;

  // ==================== 实体管理 ====================

  /**
   * 创建新实体
   * @param name 实体名称（可选）
   * @returns 新创建的实体 ID
   */
  createEntity(name?: string): EntityId;

  /**
   * 添加已存在的实体到场景
   * @param entity 实体 ID
   * @returns this，支持链式调用
   */
  addEntity(entity: EntityId): this;

  /**
   * 从场景移除实体
   * @param entity 实体 ID
   * @returns this，支持链式调用
   */
  removeEntity(entity: EntityId): this;

  /**
   * 销毁实体（从场景移除并释放资源）
   * @param entity 实体 ID
   */
  destroyEntity(entity: EntityId): void;

  /**
   * 检查实体是否在场景中
   * @param entity 实体 ID
   * @returns 是否存在
   */
  hasEntity(entity: EntityId): boolean;

  // ==================== 实体查询 ====================

  /**
   * 通过名称查找实体
   * @param name 实体名称
   * @returns 实体 ID，未找到返回 null
   */
  findEntityByName(name: string): EntityId | null;

  /**
   * 获取所有实体
   * @returns 实体 ID 数组
   */
  getAllEntities(): EntityId[];

  /**
   * 获取实体数量
   * @returns 实体数量
   */
  getEntityCount(): number;

  /**
   * 通过标签获取实体
   * @param tag 标签
   * @returns 具有该标签的实体 ID 数组
   */
  getEntitiesByTag(tag: string): EntityId[];

  /**
   * 查找具有指定组件的实体
   * @param componentTypes 组件类型数组
   * @returns 具有所有指定组件的实体 ID 数组
   */
  findEntitiesWithComponents(...componentTypes: ComponentClass[]): EntityId[];

  // ==================== 实体元数据 ====================

  /**
   * 获取实体名称
   * @param entity 实体 ID
   * @returns 实体名称，未找到返回 null
   */
  getEntityName(entity: EntityId): string | null;

  /**
   * 设置实体名称
   * @param entity 实体 ID
   * @param name 新名称
   */
  setEntityName(entity: EntityId, name: string): void;

  /**
   * 获取实体标签
   * @param entity 实体 ID
   * @returns 实体标签，未找到返回 null
   */
  getEntityTag(entity: EntityId): string | null;

  /**
   * 设置实体标签
   * @param entity 实体 ID
   * @param tag 新标签
   */
  setEntityTag(entity: EntityId, tag: string): void;

  /**
   * 检查实体是否激活
   * @param entity 实体 ID
   * @returns 是否激活
   */
  isEntityActive(entity: EntityId): boolean;

  /**
   * 设置实体激活状态
   * @param entity 实体 ID
   * @param active 激活状态
   */
  setEntityActive(entity: EntityId, active: boolean): void;

  /**
   * 批量激活具有指定标签的实体
   * @param tag 标签
   * @returns this，支持链式调用
   */
  activateEntitiesByTag(tag: string): this;

  /**
   * 批量停用具有指定标签的实体
   * @param tag 标签
   * @returns this，支持链式调用
   */
  deactivateEntitiesByTag(tag: string): this;

  // ==================== 层级关系 ====================

  /**
   * 获取场景根实体
   * @returns 根实体 ID
   */
  getRoot(): EntityId;

  /**
   * 设置实体的父实体
   * @param entity 实体 ID
   * @param parent 父实体 ID，null 表示设为根实体的子实体
   */
  setParent(entity: EntityId, parent: EntityId | null): void;

  /**
   * 获取实体的父实体
   * @param entity 实体 ID
   * @returns 父实体 ID，null 表示是根实体或无父实体
   */
  getParent(entity: EntityId): EntityId | null;

  /**
   * 获取实体的子实体
   * @param entity 实体 ID
   * @returns 子实体 ID 数组
   */
  getChildren(entity: EntityId): EntityId[];

  // ==================== 生命周期 ====================

  /**
   * 场景加载时调用
   * @returns this，支持链式调用
   */
  onLoad(): this;

  /**
   * 场景卸载时调用
   * @returns this，支持链式调用
   */
  onUnload(): this;

  /**
   * 更新场景
   * @param deltaTime 帧间隔时间（秒）
   */
  update(deltaTime: number): void;

  /**
   * 清空场景中的所有实体
   * @returns this，支持链式调用
   */
  clear(): this;

  /**
   * 检查场景是否激活
   * @returns 是否激活
   */
  isActive(): boolean;

  /**
   * 设置场景激活状态
   * @param active 激活状态
   */
  setActive(active: boolean): void;

  // ==================== 事件系统 ====================

  /**
   * 注册事件监听器
   * @param event 事件类型
   * @param listener 监听器函数
   */
  on<T = unknown>(event: SceneEventType, listener: SceneEventListener<T>): void;

  /**
   * 移除事件监听器
   * @param event 事件类型
   * @param listener 监听器函数
   */
  off<T = unknown>(event: SceneEventType, listener: SceneEventListener<T>): void;

  /**
   * 触发事件
   * @param event 事件类型
   * @param data 事件数据
   */
  emit<T = unknown>(event: SceneEventType, data?: T): void;
}

/**
 * 场景配置选项
 */
export interface SceneOptions {
  /** 场景名称 */
  name?: string;
  /** 是否自动创建根实体 */
  createRoot?: boolean;
  /** 初始激活状态 */
  active?: boolean;
}
