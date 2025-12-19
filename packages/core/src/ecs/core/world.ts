import type { EntityId } from './entity-id';
import { EntityManager } from './entity-manager';
import type { ComponentClass, ComponentTypeId } from './component-registry';
import { ComponentRegistry } from './component-registry';
import { Archetype } from './archetype';
import type { QueryFilter } from './query';
import { Query } from './query';
import { BitSet } from '../utils/bitset';

/**
 * 实体位置信息
 * 记录实体在哪个Archetype的哪一行
 */
interface EntityLocation {
  archetype: Archetype;
  row: number;
}

/**
 * World
 * ECS中央调度器，管理所有实体、组件和查询
 *
 * @remarks
 * **核心职责**:
 * - 实体生命周期管理（创建/销毁）
 * - 组件添加/移除/查询
 * - Archetype自动管理（实体组件变更时自动迁移）
 * - 查询系统管理
 * - 资源管理（全局共享资源）
 *
 * **Archetype迁移机制**:
 * 当实体的组件组合改变时，World会自动将实体从旧Archetype迁移到新Archetype：
 * 1. 从旧Archetype移除实体
 * 2. 查找或创建匹配的新Archetype
 * 3. 将实体添加到新Archetype
 * 4. 更新所有相关Query的缓存
 *
 * @example
 * ```typescript
 * const world = new World();
 *
 * // 注册组件类型
 * class Position { x = 0; y = 0; z = 0; }
 * class Velocity { x = 0; y = 0; z = 0; }
 *
 * world.registerComponent(Position);
 * world.registerComponent(Velocity);
 *
 * // 创建实体
 * const entity = world.createEntity();
 *
 * // 添加组件
 * world.addComponent(entity, Position, { x: 10, y: 0, z: 0 });
 * world.addComponent(entity, Velocity, { x: 1, y: 0, z: 0 });
 *
 * // 查询实体
 * const query = world.query({ all: [Position, Velocity] });
 * query.forEach((entity, [pos, vel]) => {
 *   pos.x += vel.x;
 *   pos.y += vel.y;
 * });
 *
 * // 销毁实体
 * world.destroyEntity(entity);
 * ```
 */
export class World {
  /** 实体管理器 */
  private entityManager: EntityManager;

  /** 组件注册表 */
  private componentRegistry: ComponentRegistry;

  /** 实体位置映射（entity -> location） */
  private entityLocations = new Map<EntityId, EntityLocation>();

  /** Archetype缓存（掩码哈希 -> Archetype） */
  private archetypes = new Map<string, Archetype>();

  /** 所有查询 */
  private queries: Query[] = [];

  /** 空Archetype（用于无组件的实体） */
  private emptyArchetype: Archetype;

  /** 全局资源存储 */
  private resources = new Map<any, any>();

  constructor() {
    this.entityManager = new EntityManager();
    this.componentRegistry = new ComponentRegistry();

    // 创建空Archetype
    this.emptyArchetype = new Archetype(new BitSet(), []);
    this.archetypes.set(this.emptyArchetype.getHash(), this.emptyArchetype);
  }

  /**
   * 注册组件类型
   * @param type 组件类
   * @returns 组件类型ID
   */
  registerComponent<T>(type: ComponentClass<T>): ComponentTypeId {
    return this.componentRegistry.register(type);
  }

  /**
   * 创建实体
   * @returns Entity ID
   */
  createEntity(): EntityId {
    const entity = this.entityManager.create();

    // 新实体默认放入空Archetype
    const row = this.emptyArchetype.addEntity(entity, []);
    this.entityLocations.set(entity, {
      archetype: this.emptyArchetype,
      row,
    });

    // 更新所有查询（虽然空Archetype通常不匹配任何查询）
    this.updateQueriesForArchetype(this.emptyArchetype);

    return entity;
  }

  /**
   * 销毁实体
   * @param entity Entity ID
   * @returns 是否成功销毁
   */
  destroyEntity(entity: EntityId): boolean {
    if (!this.entityManager.isAlive(entity)) {
      return false;
    }

    const location = this.entityLocations.get(entity);
    if (!location) {
      return false;
    }

    // 从Archetype中移除
    location.archetype.removeEntity(entity);

    // 清除位置记录
    this.entityLocations.delete(entity);

    // 销毁实体ID
    this.entityManager.destroy(entity);

    return true;
  }

  /**
   * 检查实体是否存活
   * @param entity Entity ID
   * @returns 是否存活
   */
  isAlive(entity: EntityId): boolean {
    return this.entityManager.isAlive(entity);
  }

  /**
   * 添加组件到实体
   * @param entity Entity ID
   * @param type 组件类
   * @param data 组件数据（可选）
   * @returns 是否成功添加
   */
  addComponent<T>(entity: EntityId, type: ComponentClass<T>, data?: Partial<T>): boolean {
    if (!this.entityManager.isAlive(entity)) {
      return false;
    }

    // 确保组件类型已注册
    if (!this.componentRegistry.has(type)) {
      this.componentRegistry.register(type);
    }

    const location = this.entityLocations.get(entity);
    if (!location) {
      return false;
    }

    const typeId = this.componentRegistry.getTypeId(type)!;
    const oldArchetype = location.archetype;

    // 检查是否已有该组件
    if (oldArchetype.getComponent(entity, typeId) !== undefined) {
      // 组件已存在，更新数据
      if (data) {
        const existing = oldArchetype.getComponent(entity, typeId);
        Object.assign(existing, data);
      }
      return true;
    }

    // 计算新的组件掩码
    const newMask = oldArchetype.mask.clone();
    const bitIndex = this.componentRegistry.getBitIndex(type)!;
    newMask.set(bitIndex);

    // 查找或创建新Archetype
    const newArchetype = this.getOrCreateArchetype(newMask);

    // 准备新的组件数据（按新Archetype的componentTypes顺序排列）
    const newTypeId = typeId;

    // 如果 data 是组件实例而不是 Partial<T>，直接使用它
    // 否则创建新实例并合并数据
    let componentToAdd: any;
    if (data && data.constructor === type) {
      // data 是完整的组件实例
      componentToAdd = data;
    } else {
      // data 是 Partial<T> 或 undefined
      componentToAdd = new type();
      if (data) {
        Object.assign(componentToAdd, data);
      }
    }

    // 按新Archetype的componentTypes顺序构建组件数据数组
    const newComponentData: any[] = [];
    for (const compTypeId of newArchetype.componentTypes) {
      if (compTypeId === newTypeId) {
        // 这是新添加的组件
        newComponentData.push(componentToAdd);
      } else {
        // 从旧Archetype复制现有组件
        const existingData = oldArchetype.getComponent(entity, compTypeId);
        newComponentData.push(existingData);
      }
    }

    // 迁移实体
    this.migrateEntity(entity, oldArchetype, newArchetype, newComponentData);

    return true;
  }

  /**
   * 移除实体的组件
   * @param entity Entity ID
   * @param type 组件类
   * @returns 是否成功移除
   */
  removeComponent<T>(entity: EntityId, type: ComponentClass<T>): boolean {
    if (!this.entityManager.isAlive(entity)) {
      return false;
    }

    const location = this.entityLocations.get(entity);
    if (!location) {
      return false;
    }

    const typeId = this.componentRegistry.getTypeId(type);
    if (typeId === -1) {
      return false;
    }

    const oldArchetype = location.archetype;

    // 检查是否有该组件
    if (oldArchetype.getComponent(entity, typeId) === undefined) {
      return false;
    }

    // 计算新的组件掩码
    const newMask = oldArchetype.mask.clone();
    const bitIndex = this.componentRegistry.getBitIndex(type)!;
    newMask.clear(bitIndex);

    // 查找或创建新Archetype
    const newArchetype = this.getOrCreateArchetype(newMask);

    // 准备新的组件数据（排除被移除的组件）
    const oldComponentData = this.extractComponentData(entity, oldArchetype);
    const removeIndex = oldArchetype.componentTypes.indexOf(typeId);
    const newComponentData = oldComponentData.filter((_, index) => index !== removeIndex);

    // 迁移实体
    this.migrateEntity(entity, oldArchetype, newArchetype, newComponentData);

    return true;
  }

  /**
   * 获取实体的组件数据
   * @param entity Entity ID
   * @param type 组件类
   * @returns 组件数据，如果不存在返回undefined
   */
  getComponent<T>(entity: EntityId, type: ComponentClass<T>): T | undefined {
    const location = this.entityLocations.get(entity);
    if (!location) {
      return undefined;
    }

    const typeId = this.componentRegistry.getTypeId(type);
    if (typeId === -1) {
      return undefined;
    }

    return location.archetype.getComponent(entity, typeId);
  }

  /**
   * 检查实体是否有指定组件
   * @param entity Entity ID
   * @param type 组件类
   * @returns 是否有该组件
   */
  hasComponent<T>(entity: EntityId, type: ComponentClass<T>): boolean {
    return this.getComponent(entity, type) !== undefined;
  }

  /**
   * 创建查询
   * @param filter 查询过滤器
   * @returns Query实例
   */
  query(filter: QueryFilter): Query {
    const query = new Query(
      filter,
      (types) => this.componentRegistry.createMask(types),
      (type) => this.componentRegistry.getTypeId(type)
    );

    // 将所有匹配的Archetype添加到查询
    for (const archetype of this.archetypes.values()) {
      query.addArchetype(archetype);
    }

    // 保存查询以便后续更新
    this.queries.push(query);

    return query;
  }

  /**
   * 获取或创建Archetype
   * @param mask 组件掩码
   * @returns Archetype实例
   */
  private getOrCreateArchetype(mask: BitSet): Archetype {
    const hash = mask.toArray().join(',');

    // 查找缓存
    let archetype = this.archetypes.get(hash);
    if (archetype) {
      return archetype;
    }

    // 创建新Archetype
    const componentTypes = this.componentRegistry
      .getTypesFromMask(mask)
      .map((type) => this.componentRegistry.getTypeId(type)!);

    archetype = new Archetype(mask, componentTypes);
    this.archetypes.set(hash, archetype);

    // 更新所有查询
    this.updateQueriesForArchetype(archetype);

    return archetype;
  }

  /**
   * 提取实体的所有组件数据
   * @param entity Entity ID
   * @param archetype Archetype实例
   * @returns 组件数据数组
   */
  private extractComponentData(entity: EntityId, archetype: Archetype): any[] {
    return archetype.componentTypes.map((typeId) => archetype.getComponent(entity, typeId));
  }

  /**
   * 迁移实体到新Archetype
   * @param entity Entity ID
   * @param oldArchetype 旧Archetype
   * @param newArchetype 新Archetype
   * @param componentData 新的组件数据
   */
  private migrateEntity(
    entity: EntityId,
    oldArchetype: Archetype,
    newArchetype: Archetype,
    componentData: any[]
  ): void {
    // 从旧Archetype移除
    oldArchetype.removeEntity(entity);

    // 添加到新Archetype
    const row = newArchetype.addEntity(entity, componentData);

    // 更新位置
    this.entityLocations.set(entity, {
      archetype: newArchetype,
      row,
    });
  }

  /**
   * 更新所有查询以包含新Archetype
   * @param archetype Archetype实例
   */
  private updateQueriesForArchetype(archetype: Archetype): void {
    for (const query of this.queries) {
      query.addArchetype(archetype);
    }
  }

  /**
   * 获取存活实体数量
   * @returns 实体数量
   */
  getEntityCount(): number {
    return this.entityManager.getAliveCount();
  }

  /**
   * 获取所有存活的实体
   * @returns 实体ID数组
   */
  getAllEntities(): EntityId[] {
    return this.entityManager.getAliveEntities();
  }

  /**
   * 插入全局资源
   * @param resource 资源实例
   */
  insertResource<T>(resource: T): void {
    const type = resource!.constructor;
    this.resources.set(type, resource);
  }

  /**
   * 获取全局资源
   * @param type 资源类
   * @returns 资源实例，如果不存在返回undefined
   */
  getResource<T>(type: new () => T): T | undefined {
    return this.resources.get(type);
  }

  /**
   * 移除全局资源
   * @param type 资源类
   * @returns 是否成功移除
   */
  removeResource<T>(type: new () => T): boolean {
    return this.resources.delete(type);
  }

  /**
   * 清空World
   * @remarks
   * 销毁所有实体、清除所有Archetype和查询
   */
  clear(): void {
    this.entityManager.clear();
    this.entityLocations.clear();
    this.archetypes.clear();
    this.queries = [];
    this.resources.clear();

    // 重新创建空Archetype
    this.emptyArchetype = new Archetype(new BitSet(), []);
    this.archetypes.set(this.emptyArchetype.getHash(), this.emptyArchetype);
  }

  /**
   * 获取统计信息
   * @returns 统计信息对象
   */
  getStats(): {
    entities: number;
    archetypes: number;
    queries: number;
    componentTypes: number;
    resources: number;
  } {
    return {
      entities: this.getEntityCount(),
      archetypes: this.archetypes.size,
      queries: this.queries.length,
      componentTypes: this.componentRegistry.getCount(),
      resources: this.resources.size,
    };
  }
}
