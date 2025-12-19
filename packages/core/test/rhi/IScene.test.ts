/**
 * IScene 接口测试 - ECS 模式
 * 测试场景接口的模拟实现，使用 EntityId 而不是 Entity 对象
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import type {
  IScene,
  SceneMetadata,
  HierarchyComponent,
  SceneEventType,
  SceneEventListener,
  SceneOptions,
} from '../../src/rhi/IScene';
import type { EntityId } from '../../src/ecs/core/entity-id';
import { INVALID_ENTITY } from '../../src/ecs/core/entity-id';
import { World } from '../../src/ecs/core/world';
import type { ComponentClass } from '../../src/ecs/core/component-registry';

// 测试用组件
class PositionComponent {
  x: number = 0;
  y: number = 0;
  z: number = 0;
}

class VelocityComponent {
  vx: number = 0;
  vy: number = 0;
  vz: number = 0;
}

class HealthComponent {
  current: number = 100;
  max: number = 100;
}

/**
 * MockScene - IScene 接口的 ECS 模式实现
 */
class MockScene implements IScene {
  readonly name: string;
  readonly world: World;

  private _active: boolean = true;
  private _rootEntity: EntityId;
  private _entities: Set<EntityId> = new Set();
  private _metadata: Map<EntityId, SceneMetadata> = new Map();
  private _hierarchy: Map<EntityId, HierarchyComponent> = new Map();
  private _listeners: Map<SceneEventType, Set<SceneEventListener<unknown>>> = new Map();
  private _disposed: boolean = false;

  constructor(options: SceneOptions = {}) {
    this.name = options.name ?? 'Scene';
    this.world = new World();
    this._active = options.active ?? true;

    // 创建根实体
    if (options.createRoot !== false) {
      this._rootEntity = this.world.createEntity();
      this._entities.add(this._rootEntity);
      this._metadata.set(this._rootEntity, {
        name: 'Root',
        tag: '',
        active: true,
      });
      this._hierarchy.set(this._rootEntity, {
        parent: null,
        children: [],
      });
    } else {
      this._rootEntity = INVALID_ENTITY;
    }
  }

  // ==================== 实体管理 ====================

  createEntity(name?: string): EntityId {
    const entity = this.world.createEntity();
    this._entities.add(entity);
    this._metadata.set(entity, {
      name: name ?? `Entity_${entity}`,
      tag: '',
      active: true,
    });
    this._hierarchy.set(entity, {
      parent: this._rootEntity !== INVALID_ENTITY ? this._rootEntity : null,
      children: [],
    });

    // 如果有根实体，将新实体添加为根实体的子实体
    if (this._rootEntity !== INVALID_ENTITY) {
      const rootHierarchy = this._hierarchy.get(this._rootEntity);
      if (rootHierarchy) {
        rootHierarchy.children.push(entity);
      }
    }

    this.emit('entityAdded', { entity });
    return entity;
  }

  addEntity(entity: EntityId): this {
    if (!this._entities.has(entity)) {
      this._entities.add(entity);
      if (!this._metadata.has(entity)) {
        this._metadata.set(entity, {
          name: `Entity_${entity}`,
          tag: '',
          active: true,
        });
      }
      if (!this._hierarchy.has(entity)) {
        this._hierarchy.set(entity, {
          parent: null,
          children: [],
        });
      }
      this.emit('entityAdded', { entity });
    }
    return this;
  }

  removeEntity(entity: EntityId): this {
    if (this._entities.has(entity)) {
      // 从父实体的子列表中移除
      const hierarchy = this._hierarchy.get(entity);
      if (hierarchy?.parent !== null && hierarchy?.parent !== undefined) {
        const parentHierarchy = this._hierarchy.get(hierarchy.parent);
        if (parentHierarchy) {
          const index = parentHierarchy.children.indexOf(entity);
          if (index !== -1) {
            parentHierarchy.children.splice(index, 1);
          }
        }
      }

      this._entities.delete(entity);
      this._metadata.delete(entity);
      this._hierarchy.delete(entity);
      this.emit('entityRemoved', { entity });
    }
    return this;
  }

  destroyEntity(entity: EntityId): void {
    this.removeEntity(entity);
    this.world.destroyEntity(entity);
  }

  hasEntity(entity: EntityId): boolean {
    return this._entities.has(entity);
  }

  // ==================== 实体查询 ====================

  findEntityByName(name: string): EntityId | null {
    for (const [entity, metadata] of this._metadata) {
      if (metadata.name === name) {
        return entity;
      }
    }
    return null;
  }

  getAllEntities(): EntityId[] {
    return Array.from(this._entities);
  }

  getEntityCount(): number {
    return this._entities.size;
  }

  getEntitiesByTag(tag: string): EntityId[] {
    const result: EntityId[] = [];
    for (const [entity, metadata] of this._metadata) {
      if (metadata.tag === tag) {
        result.push(entity);
      }
    }
    return result;
  }

  findEntitiesWithComponents(...componentTypes: ComponentClass[]): EntityId[] {
    const result: EntityId[] = [];
    for (const entity of this._entities) {
      let hasAll = true;
      for (const componentType of componentTypes) {
        if (!this.world.hasComponent(entity, componentType)) {
          hasAll = false;
          break;
        }
      }
      if (hasAll) {
        result.push(entity);
      }
    }
    return result;
  }

  // ==================== 实体元数据 ====================

  getEntityName(entity: EntityId): string | null {
    return this._metadata.get(entity)?.name ?? null;
  }

  setEntityName(entity: EntityId, name: string): void {
    const metadata = this._metadata.get(entity);
    if (metadata) {
      metadata.name = name;
    }
  }

  getEntityTag(entity: EntityId): string | null {
    return this._metadata.get(entity)?.tag ?? null;
  }

  setEntityTag(entity: EntityId, tag: string): void {
    const metadata = this._metadata.get(entity);
    if (metadata) {
      metadata.tag = tag;
    }
  }

  isEntityActive(entity: EntityId): boolean {
    return this._metadata.get(entity)?.active ?? false;
  }

  setEntityActive(entity: EntityId, active: boolean): void {
    const metadata = this._metadata.get(entity);
    if (metadata) {
      metadata.active = active;
    }
  }

  activateEntitiesByTag(tag: string): this {
    for (const [_, metadata] of this._metadata) {
      if (metadata.tag === tag) {
        metadata.active = true;
      }
    }
    return this;
  }

  deactivateEntitiesByTag(tag: string): this {
    for (const [_, metadata] of this._metadata) {
      if (metadata.tag === tag) {
        metadata.active = false;
      }
    }
    return this;
  }

  // ==================== 层级关系 ====================

  getRoot(): EntityId {
    return this._rootEntity;
  }

  setParent(entity: EntityId, parent: EntityId | null): void {
    const hierarchy = this._hierarchy.get(entity);
    if (!hierarchy) {
      return;
    }

    // 从旧父实体的子列表中移除
    if (hierarchy.parent !== null) {
      const oldParentHierarchy = this._hierarchy.get(hierarchy.parent);
      if (oldParentHierarchy) {
        const index = oldParentHierarchy.children.indexOf(entity);
        if (index !== -1) {
          oldParentHierarchy.children.splice(index, 1);
        }
      }
    }

    // 设置新父实体
    hierarchy.parent = parent;

    // 添加到新父实体的子列表
    if (parent !== null) {
      const newParentHierarchy = this._hierarchy.get(parent);
      if (newParentHierarchy && !newParentHierarchy.children.includes(entity)) {
        newParentHierarchy.children.push(entity);
      }
    }
  }

  getParent(entity: EntityId): EntityId | null {
    return this._hierarchy.get(entity)?.parent ?? null;
  }

  getChildren(entity: EntityId): EntityId[] {
    return this._hierarchy.get(entity)?.children ?? [];
  }

  // ==================== 生命周期 ====================

  onLoad(): this {
    this.emit('load', undefined);
    return this;
  }

  onUnload(): this {
    this.emit('unload', undefined);
    return this;
  }

  update(deltaTime: number): void {
    this.emit('update', { deltaTime });
  }

  clear(): this {
    // 保留根实体，清除其他所有实体
    const entitiesToRemove = Array.from(this._entities).filter((e) => e !== this._rootEntity);
    for (const entity of entitiesToRemove) {
      this.destroyEntity(entity);
    }

    // 清空根实体的子列表
    if (this._rootEntity !== INVALID_ENTITY) {
      const rootHierarchy = this._hierarchy.get(this._rootEntity);
      if (rootHierarchy) {
        rootHierarchy.children = [];
      }
    }

    return this;
  }

  isActive(): boolean {
    return this._active;
  }

  setActive(active: boolean): void {
    this._active = active;
  }

  // ==================== 事件系统 ====================

  on<T = unknown>(event: SceneEventType, listener: SceneEventListener<T>): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(listener as SceneEventListener<unknown>);
  }

  off<T = unknown>(event: SceneEventType, listener: SceneEventListener<T>): void {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.delete(listener as SceneEventListener<unknown>);
    }
  }

  emit<T = unknown>(event: SceneEventType, data?: T): void {
    const listeners = this._listeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        listener(data);
      }
    }
  }

  // ==================== IDisposable ====================

  dispose(): void {
    if (this._disposed) {
      return;
    }

    this.clear();
    this._listeners.clear();
    this._disposed = true;
  }

  isDisposed(): boolean {
    return this._disposed;
  }
}

// ==================== 测试用例 ====================

describe('IScene 接口测试 - ECS 模式', () => {
  let scene: MockScene;

  beforeEach(() => {
    scene = new MockScene({ name: 'TestScene' });
  });

  describe('基本属性', () => {
    it('应该有名称属性', () => {
      expect(scene.name).toBe('TestScene');
    });

    it('应该有 World 实例', () => {
      expect(scene.world).toBeInstanceOf(World);
    });

    it('应该默认激活', () => {
      expect(scene.isActive()).toBe(true);
    });

    it('应该可以设置激活状态', () => {
      scene.setActive(false);
      expect(scene.isActive()).toBe(false);
    });
  });

  describe('实体管理', () => {
    describe('createEntity', () => {
      it('应该创建新实体并返回 EntityId', () => {
        const entity = scene.createEntity('Player');
        expect(typeof entity).toBe('number');
        expect(scene.hasEntity(entity)).toBe(true);
      });

      it('应该自动设置实体名称', () => {
        const entity = scene.createEntity('Player');
        expect(scene.getEntityName(entity)).toBe('Player');
      });

      it('应该自动添加到场景', () => {
        const initialCount = scene.getEntityCount();
        scene.createEntity('Player');
        expect(scene.getEntityCount()).toBe(initialCount + 1);
      });

      it('应该触发 entityAdded 事件', () => {
        let addedEntity: EntityId | null = null;
        scene.on('entityAdded', (data: { entity: EntityId }) => {
          addedEntity = data.entity;
        });

        const entity = scene.createEntity('Player');
        expect(addedEntity).toBe(entity);
      });
    });

    describe('addEntity', () => {
      it('应该添加实体到场景', () => {
        const entity = scene.world.createEntity();
        const initialCount = scene.getEntityCount();
        scene.addEntity(entity);
        expect(scene.getEntityCount()).toBe(initialCount + 1);
        expect(scene.hasEntity(entity)).toBe(true);
      });

      it('应该支持链式调用', () => {
        const entity1 = scene.world.createEntity();
        const entity2 = scene.world.createEntity();
        const result = scene.addEntity(entity1).addEntity(entity2);
        expect(result).toBe(scene);
      });

      it('不应该重复添加同一实体', () => {
        const entity = scene.world.createEntity();
        scene.addEntity(entity);
        const count = scene.getEntityCount();
        scene.addEntity(entity);
        expect(scene.getEntityCount()).toBe(count);
      });
    });

    describe('removeEntity', () => {
      it('应该从场景移除实体', () => {
        const entity = scene.createEntity('ToRemove');
        scene.removeEntity(entity);
        expect(scene.hasEntity(entity)).toBe(false);
      });

      it('应该支持链式调用', () => {
        const entity = scene.createEntity('ToRemove');
        const result = scene.removeEntity(entity);
        expect(result).toBe(scene);
      });

      it('应该触发 entityRemoved 事件', () => {
        let removedEntity: EntityId | null = null;
        scene.on('entityRemoved', (data: { entity: EntityId }) => {
          removedEntity = data.entity;
        });

        const entity = scene.createEntity('ToRemove');
        scene.removeEntity(entity);
        expect(removedEntity).toBe(entity);
      });
    });

    describe('destroyEntity', () => {
      it('应该销毁实体', () => {
        const entity = scene.createEntity('ToDestroy');
        scene.destroyEntity(entity);
        expect(scene.hasEntity(entity)).toBe(false);
      });
    });

    describe('hasEntity', () => {
      it('应该返回 true 如果实体存在', () => {
        const entity = scene.createEntity('Test');
        expect(scene.hasEntity(entity)).toBe(true);
      });

      it('应该返回 false 如果实体不存在', () => {
        expect(scene.hasEntity(999999)).toBe(false);
      });
    });
  });

  describe('实体查询', () => {
    describe('findEntityByName', () => {
      it('应该通过名称查找实体', () => {
        const entity = scene.createEntity('UniqueEntity');
        const found = scene.findEntityByName('UniqueEntity');
        expect(found).toBe(entity);
      });

      it('应该返回 null 如果未找到', () => {
        const found = scene.findEntityByName('NonExistent');
        expect(found).toBeNull();
      });
    });

    describe('getAllEntities', () => {
      it('应该返回所有实体', () => {
        scene.createEntity('Entity1');
        scene.createEntity('Entity2');
        scene.createEntity('Entity3');

        const entities = scene.getAllEntities();
        // +1 因为有根实体
        expect(entities.length).toBeGreaterThanOrEqual(3);
      });
    });

    describe('getEntityCount', () => {
      it('应该返回正确的实体数量', () => {
        const initialCount = scene.getEntityCount();

        scene.createEntity('Entity1');
        expect(scene.getEntityCount()).toBe(initialCount + 1);

        scene.createEntity('Entity2');
        expect(scene.getEntityCount()).toBe(initialCount + 2);
      });
    });

    describe('getEntitiesByTag', () => {
      it('应该返回具有指定标签的实体', () => {
        const enemy1 = scene.createEntity('Enemy1');
        scene.setEntityTag(enemy1, 'enemy');

        const enemy2 = scene.createEntity('Enemy2');
        scene.setEntityTag(enemy2, 'enemy');

        const player = scene.createEntity('Player');
        scene.setEntityTag(player, 'player');

        const enemies = scene.getEntitiesByTag('enemy');
        expect(enemies).toHaveLength(2);
        expect(enemies).toContain(enemy1);
        expect(enemies).toContain(enemy2);
      });

      it('应该返回空数组如果没有匹配', () => {
        scene.createEntity('Entity1');
        const result = scene.getEntitiesByTag('nonexistent');
        expect(result).toHaveLength(0);
      });
    });

    describe('findEntitiesWithComponents', () => {
      it('应该返回具有指定组件的实体', () => {
        const entity1 = scene.createEntity('Entity1');
        scene.world.addComponent(entity1, PositionComponent);

        const entity2 = scene.createEntity('Entity2');
        scene.world.addComponent(entity2, PositionComponent);
        scene.world.addComponent(entity2, VelocityComponent);

        const entity3 = scene.createEntity('Entity3');
        scene.world.addComponent(entity3, HealthComponent);

        const withPosition = scene.findEntitiesWithComponents(PositionComponent);
        expect(withPosition).toHaveLength(2);
        expect(withPosition).toContain(entity1);
        expect(withPosition).toContain(entity2);
      });

      it('应该返回具有所有指定组件的实体', () => {
        const entity1 = scene.createEntity('Entity1');
        scene.world.addComponent(entity1, PositionComponent);

        const entity2 = scene.createEntity('Entity2');
        scene.world.addComponent(entity2, PositionComponent);
        scene.world.addComponent(entity2, VelocityComponent);

        const withBoth = scene.findEntitiesWithComponents(PositionComponent, VelocityComponent);
        expect(withBoth).toHaveLength(1);
        expect(withBoth).toContain(entity2);
      });

      it('应该返回空数组如果没有匹配', () => {
        scene.createEntity('Entity1');
        const result = scene.findEntitiesWithComponents(PositionComponent);
        expect(result).toHaveLength(0);
      });
    });
  });

  describe('实体元数据', () => {
    describe('getEntityName / setEntityName', () => {
      it('应该获取和设置实体名称', () => {
        const entity = scene.createEntity('Original');
        expect(scene.getEntityName(entity)).toBe('Original');

        scene.setEntityName(entity, 'NewName');
        expect(scene.getEntityName(entity)).toBe('NewName');
      });

      it('应该返回 null 如果实体不存在', () => {
        expect(scene.getEntityName(999999)).toBeNull();
      });
    });

    describe('getEntityTag / setEntityTag', () => {
      it('应该获取和设置实体标签', () => {
        const entity = scene.createEntity('Entity');
        expect(scene.getEntityTag(entity)).toBe('');

        scene.setEntityTag(entity, 'enemy');
        expect(scene.getEntityTag(entity)).toBe('enemy');
      });
    });

    describe('isEntityActive / setEntityActive', () => {
      it('应该获取和设置实体激活状态', () => {
        const entity = scene.createEntity('Entity');
        expect(scene.isEntityActive(entity)).toBe(true);

        scene.setEntityActive(entity, false);
        expect(scene.isEntityActive(entity)).toBe(false);
      });
    });

    describe('activateEntitiesByTag', () => {
      it('应该激活具有指定标签的实体', () => {
        const entity1 = scene.createEntity('Entity1');
        scene.setEntityTag(entity1, 'group');
        scene.setEntityActive(entity1, false);

        const entity2 = scene.createEntity('Entity2');
        scene.setEntityTag(entity2, 'group');
        scene.setEntityActive(entity2, false);

        scene.activateEntitiesByTag('group');

        expect(scene.isEntityActive(entity1)).toBe(true);
        expect(scene.isEntityActive(entity2)).toBe(true);
      });

      it('应该支持链式调用', () => {
        const result = scene.activateEntitiesByTag('tag');
        expect(result).toBe(scene);
      });
    });

    describe('deactivateEntitiesByTag', () => {
      it('应该停用具有指定标签的实体', () => {
        const entity1 = scene.createEntity('Entity1');
        scene.setEntityTag(entity1, 'group');

        const entity2 = scene.createEntity('Entity2');
        scene.setEntityTag(entity2, 'group');

        scene.deactivateEntitiesByTag('group');

        expect(scene.isEntityActive(entity1)).toBe(false);
        expect(scene.isEntityActive(entity2)).toBe(false);
      });

      it('应该支持链式调用', () => {
        const result = scene.deactivateEntitiesByTag('tag');
        expect(result).toBe(scene);
      });
    });
  });

  describe('层级关系', () => {
    describe('getRoot', () => {
      it('应该返回根实体', () => {
        const root = scene.getRoot();
        expect(typeof root).toBe('number');
        expect(scene.hasEntity(root)).toBe(true);
      });
    });

    describe('setParent / getParent', () => {
      it('应该设置和获取父实体', () => {
        const parent = scene.createEntity('Parent');
        const child = scene.createEntity('Child');

        scene.setParent(child, parent);

        expect(scene.getParent(child)).toBe(parent);
      });

      it('应该更新父实体的子列表', () => {
        const parent = scene.createEntity('Parent');
        const child = scene.createEntity('Child');

        scene.setParent(child, parent);

        const children = scene.getChildren(parent);
        expect(children).toContain(child);
      });
    });

    describe('getChildren', () => {
      it('应该返回子实体列表', () => {
        const parent = scene.createEntity('Parent');
        const child1 = scene.createEntity('Child1');
        const child2 = scene.createEntity('Child2');

        scene.setParent(child1, parent);
        scene.setParent(child2, parent);

        const children = scene.getChildren(parent);
        expect(children).toHaveLength(2);
        expect(children).toContain(child1);
        expect(children).toContain(child2);
      });

      it('应该返回空数组如果没有子实体', () => {
        const entity = scene.createEntity('Entity');
        // 先从根实体移除
        scene.setParent(entity, null);
        const children = scene.getChildren(entity);
        expect(children).toHaveLength(0);
      });
    });
  });

  describe('生命周期', () => {
    describe('onLoad', () => {
      it('应该触发 load 事件', () => {
        let loaded = false;
        scene.on('load', () => {
          loaded = true;
        });

        scene.onLoad();
        expect(loaded).toBe(true);
      });

      it('应该支持链式调用', () => {
        const result = scene.onLoad();
        expect(result).toBe(scene);
      });
    });

    describe('onUnload', () => {
      it('应该触发 unload 事件', () => {
        let unloaded = false;
        scene.on('unload', () => {
          unloaded = true;
        });

        scene.onUnload();
        expect(unloaded).toBe(true);
      });

      it('应该支持链式调用', () => {
        const result = scene.onUnload();
        expect(result).toBe(scene);
      });
    });

    describe('update', () => {
      it('应该触发 update 事件', () => {
        let deltaTime = 0;
        scene.on('update', (data: { deltaTime: number }) => {
          deltaTime = data.deltaTime;
        });

        scene.update(0.016);
        expect(deltaTime).toBe(0.016);
      });
    });

    describe('clear', () => {
      it('应该清空所有实体（保留根实体）', () => {
        scene.createEntity('Entity1');
        scene.createEntity('Entity2');
        scene.createEntity('Entity3');

        scene.clear();

        // 只剩根实体
        expect(scene.getEntityCount()).toBe(1);
        expect(scene.hasEntity(scene.getRoot())).toBe(true);
      });

      it('应该支持链式调用', () => {
        const result = scene.clear();
        expect(result).toBe(scene);
      });
    });

    describe('dispose', () => {
      it('应该释放场景资源', () => {
        scene.createEntity('Entity1');
        scene.createEntity('Entity2');

        scene.dispose();

        expect(scene.isDisposed()).toBe(true);
      });
    });
  });

  describe('事件系统', () => {
    it('应该支持注册和触发事件', () => {
      let eventReceived = false;
      scene.on('load', () => {
        eventReceived = true;
      });

      scene.emit('load');
      expect(eventReceived).toBe(true);
    });

    it('应该支持移除事件监听器', () => {
      let count = 0;
      const listener = () => {
        count++;
      };

      scene.on('load', listener);
      scene.emit('load');
      expect(count).toBe(1);

      scene.off('load', listener);
      scene.emit('load');
      expect(count).toBe(1);
    });

    it('应该支持多个监听器', () => {
      const order: number[] = [];

      scene.on('load', () => order.push(1));
      scene.on('load', () => order.push(2));
      scene.on('load', () => order.push(3));

      scene.emit('load');

      expect(order).toHaveLength(3);
    });
  });
});

describe('SceneOptions 测试', () => {
  it('应该支持自定义名称', () => {
    const scene = new MockScene({ name: 'CustomScene' });
    expect(scene.name).toBe('CustomScene');
  });

  it('应该支持禁用根实体创建', () => {
    const scene = new MockScene({ createRoot: false });
    expect(scene.getRoot()).toBe(INVALID_ENTITY);
  });

  it('应该支持初始激活状态', () => {
    const scene = new MockScene({ active: false });
    expect(scene.isActive()).toBe(false);
  });
});
