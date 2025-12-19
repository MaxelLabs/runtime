/**
 * EntityBuilder - 流式 API 创建实体
 *
 * @remarks
 * 提供类似 GameObject 的开发体验，但底层使用 Archetype 模式
 *
 * @example
 * ```typescript
 * // 创建玩家实体
 * const player = world.spawn('Player')
 *   .position(10, 0, 0)
 *   .rotation(0, 0, 0, 1)
 *   .scale(1, 1, 1)
 *   .add(Velocity, { x: 1, y: 0, z: 0 })
 *   .add(Health, { current: 100, max: 100 })
 *   .tag('player')
 *   .build();
 *
 * // 创建子实体
 * const weapon = world.spawn('Weapon')
 *   .position(1, 0, 0)
 *   .parent(player)
 *   .add(Damage, { value: 50 })
 *   .build();
 *
 * // 批量创建
 * const enemies = world.spawnBatch(100, (builder, index) => {
 *   builder
 *     .name(`Enemy_${index}`)
 *     .position(Math.random() * 100, 0, Math.random() * 100)
 *     .add(Enemy, { type: 'grunt' });
 * });
 * ```
 */

import type { EntityId } from './entity-id';
import { INVALID_ENTITY } from './entity-id';
import type { World } from './world';
import type { ComponentClass } from './component-registry';

// ============ 内置组件定义 ============

/**
 * 名称组件
 */
export class Name {
  value: string = 'Entity';

  constructor(value?: string) {
    if (value) {
      this.value = value;
    }
  }
}

/**
 * 标签组件（用于快速查询）
 */
export class Tag {
  values: Set<string> = new Set();

  constructor(tags?: string[]) {
    if (tags) {
      for (const tag of tags) {
        this.values.add(tag);
      }
    }
  }

  has(tag: string): boolean {
    return this.values.has(tag);
  }

  add(tag: string): this {
    this.values.add(tag);
    return this;
  }

  remove(tag: string): this {
    this.values.delete(tag);
    return this;
  }
}

/**
 * 位置组件
 */
export class Position {
  x: number = 0;
  y: number = 0;
  z: number = 0;

  constructor(x?: number, y?: number, z?: number) {
    if (x !== undefined) {
      this.x = x;
    }
    if (y !== undefined) {
      this.y = y;
    }
    if (z !== undefined) {
      this.z = z;
    }
  }

  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  copy(other: Position): this {
    this.x = other.x;
    this.y = other.y;
    this.z = other.z;
    return this;
  }
}

/**
 * 旋转组件（四元数）
 */
export class Rotation {
  x: number = 0;
  y: number = 0;
  z: number = 0;
  w: number = 1;

  constructor(x?: number, y?: number, z?: number, w?: number) {
    if (x !== undefined) {
      this.x = x;
    }
    if (y !== undefined) {
      this.y = y;
    }
    if (z !== undefined) {
      this.z = z;
    }
    if (w !== undefined) {
      this.w = w;
    }
  }

  set(x: number, y: number, z: number, w: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  setFromEuler(x: number, y: number, z: number): this {
    // 欧拉角转四元数（XYZ 顺序）
    const c1 = Math.cos(x / 2);
    const c2 = Math.cos(y / 2);
    const c3 = Math.cos(z / 2);
    const s1 = Math.sin(x / 2);
    const s2 = Math.sin(y / 2);
    const s3 = Math.sin(z / 2);

    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 + s1 * s2 * c3;
    this.w = c1 * c2 * c3 - s1 * s2 * s3;

    return this;
  }
}

/**
 * 缩放组件
 */
export class Scale {
  x: number = 1;
  y: number = 1;
  z: number = 1;

  constructor(x?: number, y?: number, z?: number) {
    if (x !== undefined) {
      this.x = x;
    }
    if (y !== undefined) {
      this.y = y ?? x;
    }
    if (z !== undefined) {
      this.z = z ?? x;
    }
  }

  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  uniform(value: number): this {
    this.x = this.y = this.z = value;
    return this;
  }
}

/**
 * 父级组件
 */
export class Parent {
  entity: EntityId = INVALID_ENTITY;

  constructor(entity?: EntityId) {
    if (entity !== undefined) {
      this.entity = entity;
    }
  }
}

/**
 * 子级组件
 */
export class Children {
  entities: EntityId[] = [];

  add(entity: EntityId): this {
    if (!this.entities.includes(entity)) {
      this.entities.push(entity);
    }
    return this;
  }

  remove(entity: EntityId): this {
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      this.entities.splice(index, 1);
    }
    return this;
  }

  has(entity: EntityId): boolean {
    return this.entities.includes(entity);
  }
}

/**
 * 激活状态组件
 */
export class Active {
  value: boolean = true;

  constructor(value?: boolean) {
    if (value !== undefined) {
      this.value = value;
    }
  }
}

/**
 * 本地变换矩阵组件（用于缓存）
 */
export class LocalMatrix {
  data: Float32Array = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  dirty: boolean = true;
}

/**
 * 世界变换矩阵组件（用于缓存）
 */
export class WorldMatrix {
  data: Float32Array = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  dirty: boolean = true;
}

// ============ EntityBuilder ============

/**
 * 实体构建器
 */
export class EntityBuilder {
  private world: World;
  private entity: EntityId;
  private pendingComponents: Map<ComponentClass, any> = new Map();
  private built: boolean = false;

  constructor(world: World, name?: string) {
    this.world = world;
    this.entity = world.createEntity();

    // 默认添加名称组件
    if (name) {
      this.pendingComponents.set(Name, new Name(name));
    }

    // 默认添加激活状态
    this.pendingComponents.set(Active, new Active(true));
  }

  /**
   * 设置名称
   */
  name(value: string): this {
    this.pendingComponents.set(Name, new Name(value));
    return this;
  }

  /**
   * 设置位置
   */
  position(x: number, y: number, z: number): this {
    this.pendingComponents.set(Position, new Position(x, y, z));
    return this;
  }

  /**
   * 设置旋转（四元数）
   */
  rotation(x: number, y: number, z: number, w: number): this {
    this.pendingComponents.set(Rotation, new Rotation(x, y, z, w));
    return this;
  }

  /**
   * 设置旋转（欧拉角，弧度）
   */
  rotationEuler(x: number, y: number, z: number): this {
    const rot = new Rotation();
    rot.setFromEuler(x, y, z);
    this.pendingComponents.set(Rotation, rot);
    return this;
  }

  /**
   * 设置旋转（欧拉角，角度）
   */
  rotationDegrees(x: number, y: number, z: number): this {
    const toRad = Math.PI / 180;
    return this.rotationEuler(x * toRad, y * toRad, z * toRad);
  }

  /**
   * 设置缩放
   */
  scale(x: number, y?: number, z?: number): this {
    this.pendingComponents.set(Scale, new Scale(x, y ?? x, z ?? x));
    return this;
  }

  /**
   * 设置统一缩放
   */
  uniformScale(value: number): this {
    return this.scale(value, value, value);
  }

  /**
   * 设置父级
   */
  parent(parentEntity: EntityId): this {
    this.pendingComponents.set(Parent, new Parent(parentEntity));
    return this;
  }

  /**
   * 添加标签
   */
  tag(...tags: string[]): this {
    let tagComponent = this.pendingComponents.get(Tag) as Tag | undefined;
    if (!tagComponent) {
      tagComponent = new Tag();
      this.pendingComponents.set(Tag, tagComponent);
    }
    for (const t of tags) {
      tagComponent.add(t);
    }
    return this;
  }

  /**
   * 设置激活状态
   */
  active(value: boolean): this {
    this.pendingComponents.set(Active, new Active(value));
    return this;
  }

  /**
   * 添加自定义组件
   */
  add<T extends object>(type: ComponentClass<T>, data?: Partial<T>): this {
    const instance = new type();
    if (data) {
      Object.assign(instance as object, data);
    }
    this.pendingComponents.set(type, instance);
    return this;
  }

  /**
   * 条件添加组件
   */
  addIf<T extends object>(condition: boolean, type: ComponentClass<T>, data?: Partial<T>): this {
    if (condition) {
      this.add(type, data);
    }
    return this;
  }

  /**
   * 添加多个组件
   */
  addMany(components: Array<[ComponentClass, any?]>): this {
    for (const [type, data] of components) {
      this.add(type, data);
    }
    return this;
  }

  /**
   * 获取实体 ID（不完成构建）
   */
  id(): EntityId {
    return this.entity;
  }

  /**
   * 完成构建
   */
  build(): EntityId {
    if (this.built) {
      throw new Error('EntityBuilder: Entity already built');
    }

    // 添加所有待定组件
    for (const [type, data] of this.pendingComponents) {
      this.world.addComponent(this.entity, type, data);
    }

    // 处理父子关系
    const parentComponent = this.pendingComponents.get(Parent) as Parent | undefined;
    if (parentComponent && parentComponent.entity !== INVALID_ENTITY) {
      // 确保父级有 Children 组件
      let children = this.world.getComponent(parentComponent.entity, Children);
      if (!children) {
        this.world.addComponent(parentComponent.entity, Children, new Children());
        children = this.world.getComponent(parentComponent.entity, Children);
      }
      children?.add(this.entity);
    }

    this.built = true;
    this.pendingComponents.clear();

    return this.entity;
  }
}

// ============ World 扩展方法 ============

/**
 * 扩展 World 类的方法
 * 需要在 World 类中添加这些方法
 */
export interface WorldSpawnMethods {
  /**
   * 创建实体构建器
   */
  spawn(name?: string): EntityBuilder;

  /**
   * 批量创建实体
   */
  spawnBatch(count: number, builder: (b: EntityBuilder, index: number) => void): EntityId[];

  /**
   * 通过名称查找实体
   */
  findByName(name: string): EntityId | undefined;

  /**
   * 通过标签查找实体
   */
  findByTag(tag: string): EntityId[];

  /**
   * 获取实体的所有子级
   */
  getChildren(entity: EntityId): EntityId[];

  /**
   * 获取实体的父级
   */
  getParent(entity: EntityId): EntityId | undefined;

  /**
   * 设置实体的父级
   */
  setParent(entity: EntityId, parent: EntityId | null): void;

  /**
   * 检查实体是否激活
   */
  isActive(entity: EntityId): boolean;

  /**
   * 设置实体激活状态
   */
  setActive(entity: EntityId, active: boolean): void;
}

/**
 * 为 World 添加扩展方法
 */
export function extendWorld(world: World): World & WorldSpawnMethods {
  const extended = world as World & WorldSpawnMethods;

  extended.spawn = function (name?: string): EntityBuilder {
    return new EntityBuilder(this, name);
  };

  extended.spawnBatch = function (count: number, builder: (b: EntityBuilder, index: number) => void): EntityId[] {
    const entities: EntityId[] = [];
    for (let i = 0; i < count; i++) {
      const b = new EntityBuilder(this);
      builder(b, i);
      entities.push(b.build());
    }
    return entities;
  };

  extended.findByName = function (name: string): EntityId | undefined {
    const query = this.query({ all: [Name] });
    for (const result of query.collect()) {
      const nameComp = result.components[0] as Name;
      if (nameComp.value === name) {
        return result.entity;
      }
    }
    return undefined;
  };

  extended.findByTag = function (tag: string): EntityId[] {
    const results: EntityId[] = [];
    const query = this.query({ all: [Tag] });
    for (const result of query.collect()) {
      const tagComp = result.components[0] as Tag;
      if (tagComp.has(tag)) {
        results.push(result.entity);
      }
    }
    return results;
  };

  extended.getChildren = function (entity: EntityId): EntityId[] {
    const children = this.getComponent(entity, Children);
    return children?.entities ?? [];
  };

  extended.getParent = function (entity: EntityId): EntityId | undefined {
    const parent = this.getComponent(entity, Parent);
    return parent?.entity !== INVALID_ENTITY ? parent?.entity : undefined;
  };

  extended.setParent = function (entity: EntityId, parent: EntityId | null): void {
    // 移除旧的父子关系
    const oldParent = this.getComponent(entity, Parent);
    if (oldParent && oldParent.entity !== INVALID_ENTITY) {
      const oldChildren = this.getComponent(oldParent.entity, Children);
      oldChildren?.remove(entity);
    }

    if (parent === null) {
      this.removeComponent(entity, Parent);
    } else {
      // 设置新的父级
      this.addComponent(entity, Parent, new Parent(parent));

      // 添加到新父级的 Children
      let children = this.getComponent(parent, Children);
      if (!children) {
        this.addComponent(parent, Children, new Children());
        children = this.getComponent(parent, Children);
      }
      children?.add(entity);
    }
  };

  extended.isActive = function (entity: EntityId): boolean {
    const active = this.getComponent(entity, Active);
    if (!active || !active.value) {
      return false;
    }

    // 检查父级链
    const parent = this.getComponent(entity, Parent);
    if (parent && parent.entity !== INVALID_ENTITY) {
      return this.isActive(parent.entity);
    }

    return true;
  };

  extended.setActive = function (entity: EntityId, active: boolean): void {
    const activeComp = this.getComponent(entity, Active);
    if (!activeComp) {
      this.addComponent(entity, Active, new Active(active));
    } else {
      activeComp.value = active;
    }
  };

  return extended;
}

/**
 * 创建扩展的 World
 */
export async function createWorld(): Promise<World & WorldSpawnMethods> {
  // 动态导入避免循环依赖
  const { World } = await import('./world');
  const world = new World();

  // 注册内置组件
  world.registerComponent(Name);
  world.registerComponent(Tag);
  world.registerComponent(Position);
  world.registerComponent(Rotation);
  world.registerComponent(Scale);
  world.registerComponent(Parent);
  world.registerComponent(Children);
  world.registerComponent(Active);
  world.registerComponent(LocalMatrix);
  world.registerComponent(WorldMatrix);

  return extendWorld(world);
}

/**
 * 同步创建扩展的 World（需要传入 World 类）
 */
export function createWorldSync(WorldClass: typeof World): World & WorldSpawnMethods {
  const world = new WorldClass();

  // 注册内置组件
  world.registerComponent(Name);
  world.registerComponent(Tag);
  world.registerComponent(Position);
  world.registerComponent(Rotation);
  world.registerComponent(Scale);
  world.registerComponent(Parent);
  world.registerComponent(Children);
  world.registerComponent(Active);
  world.registerComponent(LocalMatrix);
  world.registerComponent(WorldMatrix);

  return extendWorld(world);
}
