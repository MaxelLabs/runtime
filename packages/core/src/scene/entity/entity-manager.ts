/**
 * SceneEntityManager - 实体生命周期管理器
 *
 * Responsibilities:
 * - Create/Destroy entities
 * - Maintain entity index (name, tag)
 * - Track entity metadata
 */

import type { EntityId } from '../../ecs';
import type { World } from '../../ecs';
import { Name, Tag, Disabled } from '../../components';
import { SceneEntityMetadata } from './scene-entity-metadata';

/**
 * SceneEntityManager 接口
 */
export interface ISceneEntityManager {
  // === Lifecycle ===
  createEntity(name?: string): EntityId;
  addEntity(entity: EntityId): void;
  removeEntity(entity: EntityId): void;
  destroyEntity(entity: EntityId): void;
  hasEntity(entity: EntityId): boolean;

  // === Queries ===
  findEntityByName(name: string): EntityId | null;
  findEntitiesByTag(tag: string): EntityId[];
  getAllEntities(): EntityId[];
  getEntityCount(): number;

  // === Metadata ===
  getEntityName(entity: EntityId): string | null;
  setEntityName(entity: EntityId, name: string): void;
  getEntityTag(entity: EntityId): string | null;
  setEntityTag(entity: EntityId, tag: string): void;

  // === Activation ===
  isEntityActive(entity: EntityId): boolean;
  setEntityActive(entity: EntityId, active: boolean): void;

  // === Cleanup ===
  clear(): void;
}

/**
 * SceneEntityManager 实现
 */
export class SceneEntityManager implements ISceneEntityManager {
  private world: World;
  private sceneId: string;
  private entities: Set<EntityId> = new Set();
  private nameIndex: Map<string, EntityId> = new Map();
  private tagIndex: Map<string, Set<EntityId>> = new Map();

  constructor(world: World, sceneId: string) {
    this.world = world;
    this.sceneId = sceneId;
  }

  createEntity(name?: string): EntityId {
    // 1. Create entity in world
    const entity = this.world.createEntity();

    // 2. Add SceneEntityMetadata
    this.world.addComponent(
      entity,
      SceneEntityMetadata,
      SceneEntityMetadata.fromData({ sceneId: this.sceneId, active: true })
    );

    // 3. Add Name component if provided
    if (name) {
      this.world.addComponent(entity, Name, Name.fromData({ value: name }));
      this.nameIndex.set(name, entity);
    }

    // 4. Add to entity set
    this.entities.add(entity);

    return entity;
  }

  addEntity(entity: EntityId): void {
    if (this.entities.has(entity)) {
      return;
    }

    // Add metadata
    if (!this.world.hasComponent(entity, SceneEntityMetadata)) {
      this.world.addComponent(
        entity,
        SceneEntityMetadata,
        SceneEntityMetadata.fromData({ sceneId: this.sceneId, active: true })
      );
    }

    // Update indexes
    const nameComp = this.world.getComponent(entity, Name);
    if (nameComp) {
      this.nameIndex.set(nameComp.value, entity);
    }

    const tagComp = this.world.getComponent(entity, Tag);
    if (tagComp) {
      this.addToTagIndex(tagComp.value, entity);
    }

    this.entities.add(entity);
  }

  removeEntity(entity: EntityId): void {
    if (!this.entities.has(entity)) {
      return;
    }

    // Remove from indexes
    const nameComp = this.world.getComponent(entity, Name);
    if (nameComp) {
      this.nameIndex.delete(nameComp.value);
    }

    const tagComp = this.world.getComponent(entity, Tag);
    if (tagComp) {
      this.removeFromTagIndex(tagComp.value, entity);
    }

    // Remove metadata component (if exists)
    if (this.world.hasComponent(entity, SceneEntityMetadata)) {
      this.world.removeComponent(entity, SceneEntityMetadata);
    }

    // Remove Name component (if exists) to ensure consistency
    if (this.world.hasComponent(entity, Name)) {
      this.world.removeComponent(entity, Name);
    }

    // Remove Tag component (if exists) to ensure consistency
    if (this.world.hasComponent(entity, Tag)) {
      this.world.removeComponent(entity, Tag);
    }

    // Remove Disabled component (if exists)
    if (this.world.hasComponent(entity, Disabled)) {
      this.world.removeComponent(entity, Disabled);
    }

    this.entities.delete(entity);
  }

  destroyEntity(entity: EntityId): void {
    // Note: Hierarchy handling should be done by HierarchyManager
    // This only handles entity removal
    this.removeEntity(entity);
    this.world.destroyEntity(entity);
  }

  hasEntity(entity: EntityId): boolean {
    return this.entities.has(entity);
  }

  // === Queries ===
  findEntityByName(name: string): EntityId | null {
    return this.nameIndex.get(name) ?? null;
  }

  findEntitiesByTag(tag: string): EntityId[] {
    return Array.from(this.tagIndex.get(tag) ?? []);
  }

  getAllEntities(): EntityId[] {
    return Array.from(this.entities);
  }

  getEntityCount(): number {
    return this.entities.size;
  }

  // === Metadata ===
  getEntityName(entity: EntityId): string | null {
    const comp = this.world.getComponent(entity, Name);
    return comp?.value ?? null;
  }

  setEntityName(entity: EntityId, name: string): void {
    // 验证实体是否属于此场景
    if (!this.entities.has(entity)) {
      console.warn(`[SceneEntityManager] Entity ${entity} is not managed by this scene`);
      return;
    }

    const oldName = this.getEntityName(entity);

    // 如果名称相同，无需更新
    if (oldName === name) {
      return;
    }

    // Update index
    if (oldName) {
      this.nameIndex.delete(oldName);
    }
    this.nameIndex.set(name, entity);

    // Update component
    if (this.world.hasComponent(entity, Name)) {
      const comp = this.world.getComponent(entity, Name)!;
      comp.value = name;
    } else {
      this.world.addComponent(entity, Name, Name.fromData({ value: name }));
    }
  }

  getEntityTag(entity: EntityId): string | null {
    const comp = this.world.getComponent(entity, Tag);
    return comp?.value ?? null;
  }

  setEntityTag(entity: EntityId, tag: string): void {
    const oldTag = this.getEntityTag(entity);

    // Update index
    if (oldTag) {
      this.removeFromTagIndex(oldTag, entity);
    }
    this.addToTagIndex(tag, entity);

    // Update component
    if (this.world.hasComponent(entity, Tag)) {
      const comp = this.world.getComponent(entity, Tag)!;
      comp.value = tag;
    } else {
      this.world.addComponent(entity, Tag, Tag.fromData({ value: tag }));
    }
  }

  // === Activation ===
  isEntityActive(entity: EntityId): boolean {
    const meta = this.world.getComponent(entity, SceneEntityMetadata);
    return meta?.active ?? false;
  }

  setEntityActive(entity: EntityId, active: boolean): void {
    const meta = this.world.getComponent(entity, SceneEntityMetadata);
    if (meta) {
      meta.active = active;
    }

    // Sync Disabled component
    if (active) {
      this.world.removeComponent(entity, Disabled);
    } else {
      if (!this.world.hasComponent(entity, Disabled)) {
        this.world.addComponent(entity, Disabled, new Disabled());
      }
    }
  }

  // === Cleanup ===
  clear(): void {
    this.entities.clear();
    this.nameIndex.clear();
    this.tagIndex.clear();
  }

  // === Private Helpers ===
  private addToTagIndex(tag: string, entity: EntityId): void {
    let set = this.tagIndex.get(tag);
    if (!set) {
      set = new Set();
      this.tagIndex.set(tag, set);
    }
    set.add(entity);
  }

  private removeFromTagIndex(tag: string, entity: EntityId): void {
    const set = this.tagIndex.get(tag);
    if (set) {
      set.delete(entity);
      if (set.size === 0) {
        this.tagIndex.delete(tag);
      }
    }
  }
}
