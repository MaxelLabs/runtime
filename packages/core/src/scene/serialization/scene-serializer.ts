/**
 * SceneSerializer - 场景序列化器
 *
 * Responsibilities:
 * - Deserialize ISceneData to Scene
 * - Serialize Scene to ISceneData
 * - Handle asset preloading
 * - Component data conversion
 */

import type { EntityId } from '../../ecs';
import type { ISceneData, IEntityData, IComponentData } from '@maxellabs/specification';
import type { SceneComponentRegistry } from '../component-registry';
import type { Scene } from '../scene';

/**
 * SceneSerializer 接口
 */
export interface ISceneSerializer {
  fromData(data: ISceneData, scene: Scene): void;
  fromDataAsync(data: ISceneData, scene: Scene): Promise<void>;
  toData(scene: Scene): ISceneData;
}

/**
 * SceneSerializer 实现
 */
export class SceneSerializer implements ISceneSerializer {
  private registry: SceneComponentRegistry;

  constructor(registry: SceneComponentRegistry) {
    this.registry = registry;
  }

  fromData(data: ISceneData, scene: Scene): void {
    // Synchronous version - no asset preloading

    // 1. Build entity ID mapping
    const entityIdMap: Map<number, EntityId> = new Map();

    // 2. First pass: Create all entities
    for (const entityData of data.entities) {
      const entity = this.createEntityFromData(entityData, scene);
      entityIdMap.set(entityData.id, entity);
    }

    // 3. Second pass: Establish hierarchy
    for (const entityData of data.entities) {
      if (entityData.parent !== undefined && entityData.parent !== null) {
        const entity = entityIdMap.get(entityData.id);
        const parentEntity = entityIdMap.get(entityData.parent);
        if (entity !== undefined && parentEntity !== undefined) {
          scene.setParent(entity, parentEntity);
        }
      }
    }

    // 4. Apply environment settings
    if (data.environment) {
      this.applyEnvironment(data.environment, scene);
    }

    // 5. Apply render settings
    if (data.renderSettings) {
      this.applyRenderSettings(data.renderSettings, scene);
    }
  }

  async fromDataAsync(data: ISceneData, scene: Scene): Promise<void> {
    // Async version - with asset preloading

    // 1. Preload assets in parallel
    if (data.assets) {
      const preloadPromises = data.assets
        .filter((asset) => asset.preload !== false)
        .map(async (asset) => {
          try {
            switch (asset.type) {
              case 'mesh':
                await scene.loadMesh(asset.uri);
                break;
              case 'texture':
                await scene.loadTexture(asset.uri);
                break;
              case 'material':
                await scene.loadMaterial(asset.uri);
                break;
            }
          } catch (error) {
            console.warn(`[SceneSerializer] Failed to preload ${asset.type}: ${asset.uri}`, error);
            // Non-blocking: continue even if asset fails
          }
        });

      await Promise.all(preloadPromises);
      scene.emit('assetsPreloaded', { count: preloadPromises.length });
    }

    // 2. Load entities (same as sync version)
    this.fromData(data, scene);
  }

  toData(scene: Scene): ISceneData {
    const entities: IEntityData[] = [];
    const registeredTypes = this.registry.getRegisteredTypes();

    // Traverse all entities (except root)
    for (const entityId of scene.getAllEntities()) {
      if (entityId === scene.getRoot()) {
        continue;
      }

      const entityData: IEntityData = {
        id: entityId as number,
        name: scene.getEntityName(entityId) ?? undefined,
        tag: scene.getEntityTag(entityId) ?? undefined,
        active: scene.isEntityActive(entityId),
        parent: scene.getParent(entityId) as number | null,
        components: [],
      };

      // Collect component data
      for (const typeId of registeredTypes) {
        const componentClass = this.registry.getComponentClass(typeId);
        if (!componentClass) {
          continue;
        }

        if (scene.world.hasComponent(entityId, componentClass)) {
          const component = scene.world.getComponent(entityId, componentClass);
          if (component) {
            // Skip internal components
            if (['Parent', 'Children', 'Name', 'Tag'].includes(typeId)) {
              continue;
            }

            entityData.components.push({
              type: typeId,
              data: this.serializeComponent(component),
            });
          }
        }
      }

      entities.push(entityData);
    }

    return {
      version: { major: 1, minor: 0, patch: 0 },
      metadata: {
        name: scene.name,
        id: scene.id,
        modifiedAt: new Date().toISOString(),
      },
      entities,
    };
  }

  // === Private Helpers ===
  private createEntityFromData(entityData: IEntityData, scene: Scene): EntityId {
    // Create entity with name
    const entity = scene.createEntity(entityData.name);

    // Set tag
    if (entityData.tag) {
      scene.setEntityTag(entity, entityData.tag);
    }

    // Set active state
    if (entityData.active === false) {
      scene.setEntityActive(entity, false);
    }

    // Add components
    for (const componentData of entityData.components) {
      this.addComponentFromData(entity, componentData, scene);
    }

    return entity;
  }

  private addComponentFromData(entity: EntityId, componentData: IComponentData, scene: Scene): void {
    const { type, data, enabled } = componentData;

    // Skip already handled components
    if (type === 'Name' || type === 'Tag') {
      return;
    }

    // Get component class
    const componentClass = this.registry.getComponentClass(type);
    if (!componentClass) {
      console.warn(`[SceneSerializer] Unknown component type: ${type}`);
      return;
    }

    // Create component instance
    const component = this.registry.createComponent(type, data);
    if (!component) {
      console.warn(`[SceneSerializer] Failed to create component: ${type}`);
      return;
    }

    // Handle enabled state
    if (enabled === false && 'enabled' in (component as Record<string, unknown>)) {
      (component as Record<string, unknown>).enabled = false;
    }

    // Add to entity
    try {
      scene.world.addComponent(entity, componentClass, component);
    } catch (error) {
      console.error(`[SceneSerializer] Failed to add component ${type} to entity:`, error);
    }
  }

  private serializeComponent(component: unknown): Record<string, unknown> {
    if (component === null || component === undefined) {
      return {};
    }

    const data: Record<string, unknown> = {};
    const obj = component as Record<string, unknown>;

    for (const key of Object.keys(obj)) {
      const value = obj[key];

      // Skip functions and private properties
      if (typeof value === 'function' || key.startsWith('_')) {
        continue;
      }

      // Deep copy objects
      if (value !== null && typeof value === 'object') {
        if (Array.isArray(value)) {
          data[key] = [...value];
        } else {
          data[key] = { ...value };
        }
      } else {
        data[key] = value;
      }
    }

    return data;
  }

  private applyEnvironment(environment: NonNullable<ISceneData['environment']>, scene: Scene): void {
    (scene as unknown as { _environment: typeof environment })._environment = environment;
    scene.emit('environmentChanged', environment);
  }

  private applyRenderSettings(renderSettings: NonNullable<ISceneData['renderSettings']>, scene: Scene): void {
    (scene as unknown as { _renderSettings: typeof renderSettings })._renderSettings = renderSettings;
    scene.emit('renderSettingsChanged', renderSettings);
  }
}
