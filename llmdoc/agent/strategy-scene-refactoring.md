---
id: strategy-scene-refactoring
type: strategy
status: draft
created: 2025-12-24
related_ids:
  - arch-core-unified
  - architecture-scene-systems
  - architecture-resources
  - constitution-core-runtime
---

# Strategy: Scene Architecture Refactoring

## 1. Analysis

### 1.1 Context

**Current State**:
- `Scene.ts`: 1277 lines of code
- 15+ distinct responsibilities mixed in one class
- Scene class acts as God Object handling everything from entity management to serialization

**Problem Scope**:
Scene 类包含的职责清单 (15 类):

1. **实体生命周期管理**: createEntity, destroyEntity, addEntity, removeEntity
2. **实体索引维护**: nameIndex, tagIndex, entities Set
3. **层级关系管理**: setParent, getParent, getChildren, detachFromParent
4. **场景树遍历**: (隐式在层级管理中)
5. **元数据管理**: getEntityName, setEntityName, getEntityTag, setEntityTag
6. **激活状态管理**: isEntityActive, setEntityActive, activateEntitiesByTag
7. **实体查询**: findEntityByName, getEntitiesByTag, findEntitiesWithComponents
8. **事件分发**: on, off, emit, eventListeners Map
9. **资源管理门面**: loadMesh, loadTexture, getMesh, getTexture, releaseResource
10. **组件注册**: registerSceneComponents
11. **根实体管理**: createRootEntity, _root
12. **数据解析**: fromData, fromDataAsync, createEntityFromData
13. **数据序列化**: toData, serializeComponent
14. **环境设置**: applyEnvironment
15. **渲染设置**: applyRenderSettings

**Maintenance Issues**:
- 🔴 **测试困难**: 单一类过大，Mock 依赖复杂
- 🔴 **修改风险**: 任何改动可能影响多个不相关功能
- 🔴 **职责不清**: 难以理解某个功能归属
- 🔴 **扩展困难**: 添加新功能必须修改核心类
- 🔴 **代码重复**: 类似逻辑分散在多个方法中

### 1.2 Constitution

**Core Architecture Principles** (From `arch-core-unified`):
- ✅ **Single Responsibility Principle (SRP)**: 每个类只负责一个关注点
- ✅ **Interface Segregation Principle (ISP)**: 客户端不应依赖它不使用的方法
- ✅ **Dependency Inversion Principle (DIP)**: 依赖抽象而非具体实现
- ✅ **Open-Closed Principle (OCP)**: 对扩展开放，对修改封闭

**Resource Management Constraints** (From `architecture-resources`):
- ResourceManager 作为 Scene 成员（非全局单例）
- Scene.dispose() 必须清理 resourceManager
- 引用计数为 0 时自动释放 GPU 资源

**Scene Systems Constraints** (From `architecture-scene-systems`):
- Scene 应整合 World + Scheduler + RHI Device
- 事件系统应解耦实体管理与系统
- ComponentRegistry 桥接序列化数据与运行时组件

### 1.3 Negative Constraints

🚫 **Architectural Constraints**:
- 不要创建全局单例
- 不要引入循环依赖
- 不要破坏公共 API（保持向后兼容）
- 不要硬编码具体 RHI 实现

🚫 **Code Quality Constraints**:
- 不要使用 `any` 类型（除已有的 mock）
- 不要浅拷贝（fromData 必须深拷贝）
- 不要在循环中使用 `new`
- 不要缺失空值检查

🚫 **Testing Constraints**:
- 不要降低测试覆盖率（保持 ≥95%）
- 不要跳过集成测试
- 不要忽略边界条件测试

---

## 2. Assessment

<Assessment>
**Complexity Level**: Level 3 (Deep Architecture Refactoring)

**Rationale**:
- 涉及多模块拆分（5+ 个新模块）
- 需要完整的依赖关系设计
- 伪代码和接口定义是强制性的
- 测试套件需要全面重构

**Risk Assessment**:
- 🔴 **High Risk**: 破坏现有功能（100+ 测试用例依赖 Scene）
  - 缓解: TDD + 分阶段迁移 + 回滚点
- 🟡 **Medium Risk**: 性能回归（新增间接调用层）
  - 缓解: 基准测试对比 + 性能剖析
- 🟡 **Medium Risk**: 时间超期（预估 8-12 天）
  - 缓解: 并行开发 + 优先级分级

**Success Criteria**:
- Scene.ts < 300 lines
- 每个模块 < 200 lines
- 圈复杂度 < 10
- 测试覆盖率 ≥95%
</Assessment>

---

## 3. Math/Algo Specification

**Not Applicable**: 本任务为架构重构，不涉及数学推导或算法设计。主要为模块拆分、依赖倒置和接口设计。

---

## 4. Architecture Design

### 4.1 Module Decomposition

#### Module 1: EntityManager

**Responsibility**: 实体生命周期 + 索引维护

**File**: `packages/core/src/scene/entity/EntityManager.ts`

```typescript
/**
 * EntityManager - 实体生命周期管理器
 *
 * Responsibilities:
 * - Create/Destroy entities
 * - Maintain entity index (name, tag)
 * - Track entity metadata
 */
interface IEntityManager {
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
 * Implementation
 */
class EntityManager implements IEntityManager {
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
    if (this.entities.has(entity)) return;

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
    if (!this.entities.has(entity)) return;

    // Remove from indexes
    const nameComp = this.world.getComponent(entity, Name);
    if (nameComp) {
      this.nameIndex.delete(nameComp.value);
    }

    const tagComp = this.world.getComponent(entity, Tag);
    if (tagComp) {
      this.removeFromTagIndex(tagComp.value, entity);
    }

    // Remove metadata
    this.world.removeComponent(entity, SceneEntityMetadata);

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
    const oldName = this.getEntityName(entity);

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
```

---

#### Module 2: HierarchyManager

**Responsibility**: 父子关系 + 树遍历

**File**: `packages/core/src/scene/hierarchy/HierarchyManager.ts`

```typescript
/**
 * HierarchyManager - 场景层级管理器
 *
 * Responsibilities:
 * - Parent-child relationships
 * - Tree traversal
 * - Root entity management
 */
interface IHierarchyManager {
  // === Root ===
  getRoot(): EntityId;

  // === Hierarchy ===
  setParent(entity: EntityId, parent: EntityId | null): void;
  getParent(entity: EntityId): EntityId | null;
  getChildren(entity: EntityId): EntityId[];

  // === Operations ===
  reparent(entity: EntityId, newParent: EntityId): void;
  detachFromParent(entity: EntityId): void;

  // === Traversal ===
  traverse(root: EntityId, callback: (entity: EntityId) => void): void;
  traverseDepthFirst(root: EntityId, callback: (entity: EntityId, depth: number) => void): void;
}

/**
 * Implementation
 */
class HierarchyManager implements IHierarchyManager {
  private world: World;
  private root: EntityId;

  constructor(world: World, root: EntityId) {
    this.world = world;
    this.root = root;
  }

  getRoot(): EntityId {
    return this.root;
  }

  setParent(entity: EntityId, parent: EntityId | null): void {
    // 1. Detach from current parent
    this.detachFromParent(entity);

    // 2. Set new parent
    const actualParent = parent ?? this.root;
    if (actualParent === -1 as EntityId) {
      return;
    }

    // 3. Add Parent component to child
    if (this.world.hasComponent(entity, Parent)) {
      const comp = this.world.getComponent(entity, Parent)!;
      comp.entity = actualParent;
    } else {
      this.world.addComponent(entity, Parent, Parent.fromData({ entity: actualParent }));
    }

    // 4. Update parent's Children component
    let childrenComp = this.world.getComponent(actualParent, Children);
    if (!childrenComp) {
      this.world.addComponent(actualParent, Children, Children.fromData({ entities: [] }));
      childrenComp = this.world.getComponent(actualParent, Children)!;
    }

    if (!childrenComp.entities.includes(entity)) {
      childrenComp.entities.push(entity);
    }
  }

  getParent(entity: EntityId): EntityId | null {
    const comp = this.world.getComponent(entity, Parent);
    return comp?.entity ?? null;
  }

  getChildren(entity: EntityId): EntityId[] {
    const comp = this.world.getComponent(entity, Children);
    return comp?.entities ? [...comp.entities] : [];
  }

  reparent(entity: EntityId, newParent: EntityId): void {
    this.setParent(entity, newParent);
  }

  detachFromParent(entity: EntityId): void {
    const parentComp = this.world.getComponent(entity, Parent);
    if (!parentComp || parentComp.entity === null) {
      return;
    }

    const parentEntity = parentComp.entity;
    const childrenComp = this.world.getComponent(parentEntity, Children);

    if (childrenComp) {
      const index = childrenComp.entities.indexOf(entity);
      if (index !== -1) {
        childrenComp.entities.splice(index, 1);
      }
    }

    // Remove Parent component
    this.world.removeComponent(entity, Parent);
  }

  // === Traversal ===
  traverse(root: EntityId, callback: (entity: EntityId) => void): void {
    callback(root);

    const children = this.getChildren(root);
    for (const child of children) {
      this.traverse(child, callback);
    }
  }

  traverseDepthFirst(root: EntityId, callback: (entity: EntityId, depth: number) => void, depth = 0): void {
    callback(root, depth);

    const children = this.getChildren(root);
    for (const child of children) {
      this.traverseDepthFirst(child, callback, depth + 1);
    }
  }
}
```

---

#### Module 3: SceneEventBus

**Responsibility**: 事件分发（解耦实体管理与系统）

**File**: `packages/core/src/scene/events/SceneEventBus.ts`

```typescript
/**
 * SceneEventBus - 场景事件总线
 *
 * Responsibilities:
 * - Event listener registration
 * - Event emission
 * - Decoupled communication
 */
interface ISceneEventBus {
  on<T = unknown>(event: SceneEventType, listener: SceneEventListener<T>): void;
  off<T = unknown>(event: SceneEventType, listener: SceneEventListener<T>): void;
  emit<T = unknown>(event: SceneEventType, data?: T): void;
  clear(): void;
}

/**
 * Event types
 */
type SceneEventType =
  | 'entityAdded'
  | 'entityRemoved'
  | 'componentAdded'
  | 'componentRemoved'
  | 'update'
  | 'load'
  | 'unload'
  | 'dataLoaded'
  | 'assetsPreloaded'
  | 'environmentChanged'
  | 'renderSettingsChanged';

type SceneEventListener<T = unknown> = (data?: T) => void;

/**
 * Implementation
 */
class SceneEventBus implements ISceneEventBus {
  private listeners: Map<SceneEventType, Set<SceneEventListener>> = new Map();

  on<T = unknown>(event: SceneEventType, listener: SceneEventListener<T>): void {
    let listenerSet = this.listeners.get(event);
    if (!listenerSet) {
      listenerSet = new Set();
      this.listeners.set(event, listenerSet);
    }
    listenerSet.add(listener as SceneEventListener);
  }

  off<T = unknown>(event: SceneEventType, listener: SceneEventListener<T>): void {
    const listenerSet = this.listeners.get(event);
    if (listenerSet) {
      listenerSet.delete(listener as SceneEventListener);
    }
  }

  emit<T = unknown>(event: SceneEventType, data?: T): void {
    const listenerSet = this.listeners.get(event);
    if (listenerSet) {
      for (const listener of listenerSet) {
        try {
          listener(data);
        } catch (error) {
          console.error(`[SceneEventBus] Error in listener for ${event}:`, error);
        }
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
```

---

#### Module 4: SceneResourceFacade

**Responsibility**: 资源管理门面（委托给 ResourceManager）

**File**: `packages/core/src/scene/resources/SceneResourceFacade.ts`

```typescript
/**
 * SceneResourceFacade - 场景资源管理门面
 *
 * Responsibilities:
 * - Delegate resource loading to ResourceManager
 * - Provide scene-level resource API
 * - Handle resource lifecycle integration
 */
interface ISceneResourceFacade {
  // === Loading ===
  loadMesh(uri: string): Promise<IResourceHandle>;
  loadTexture(uri: string): Promise<IResourceHandle>;
  loadMaterial(uri: string): Promise<IResourceHandle>;

  // === Retrieval ===
  getMesh(handle: IResourceHandle): IMeshResource | undefined;
  getTexture(handle: IResourceHandle): ITextureResource | undefined;
  getMaterial(handle: IResourceHandle): IMaterialResource | undefined;

  // === Release ===
  releaseResource(handle: IResourceHandle): void;

  // === Lifecycle ===
  dispose(): void;
}

/**
 * Implementation
 */
class SceneResourceFacade implements ISceneResourceFacade {
  private resourceManager: ResourceManager;

  constructor(resourceManager: ResourceManager) {
    this.resourceManager = resourceManager;
  }

  async loadMesh(uri: string): Promise<IResourceHandle> {
    return this.resourceManager.loadMesh(uri);
  }

  async loadTexture(uri: string): Promise<IResourceHandle> {
    return this.resourceManager.loadTexture(uri);
  }

  async loadMaterial(uri: string): Promise<IResourceHandle> {
    return this.resourceManager.loadMaterial(uri);
  }

  getMesh(handle: IResourceHandle): IMeshResource | undefined {
    return this.resourceManager.getMesh(handle);
  }

  getTexture(handle: IResourceHandle): ITextureResource | undefined {
    return this.resourceManager.getTexture(handle);
  }

  getMaterial(handle: IResourceHandle): IMaterialResource | undefined {
    return this.resourceManager.getMaterial(handle);
  }

  releaseResource(handle: IResourceHandle): void {
    this.resourceManager.release(handle);
  }

  dispose(): void {
    this.resourceManager.dispose();
  }
}
```

---

#### Module 5: SceneSerializer

**Responsibility**: 数据解析 + 序列化

**File**: `packages/core/src/scene/serialization/SceneSerializer.ts`

```typescript
/**
 * SceneSerializer - 场景序列化器
 *
 * Responsibilities:
 * - Deserialize ISceneData to Scene
 * - Serialize Scene to ISceneData
 * - Handle asset preloading
 * - Component data conversion
 */
interface ISceneSerializer {
  fromData(data: ISceneData, scene: Scene): void;
  fromDataAsync(data: ISceneData, scene: Scene): Promise<void>;
  toData(scene: Scene): ISceneData;
}

/**
 * Implementation
 */
class SceneSerializer implements ISceneSerializer {
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
        if (!componentClass) continue;

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

  private addComponentFromData(
    entity: EntityId,
    componentData: IComponentData,
    scene: Scene
  ): void {
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
```

---

#### Module 6: Scene (Refactored Core)

**Responsibility**: 组合上述模块 + 提供统一 API

**File**: `packages/core/src/scene/Scene.ts`

```typescript
/**
 * Scene (Refactored) - 场景管理核心
 *
 * Responsibilities:
 * - Compose EntityManager, HierarchyManager, EventBus, ResourceFacade, Serializer
 * - Provide unified API
 * - Manage lifecycle
 */
export class Scene implements IScene, IDisposable {
  // === Core Properties ===
  readonly id: string;
  readonly name: string;
  readonly world: World;
  readonly scheduler: SystemScheduler;

  // === Modules (Composition) ===
  private entityManager: EntityManager;
  private hierarchyManager: HierarchyManager;
  private eventBus: SceneEventBus;
  private resourceFacade: SceneResourceFacade;
  private serializer: SceneSerializer;

  // === Device & Resources ===
  private _device: IRHIDevice | null;
  private resourceManager: ResourceManager;

  // === State ===
  private _active: boolean;
  private _disposed: boolean;

  // === Counter ===
  private static sceneCounter: number = 0;

  constructor(options: SceneConfig = {}) {
    // 1. Generate ID
    this.id = `scene_${++Scene.sceneCounter}`;
    this.name = options.name ?? 'Scene';
    this._active = options.active ?? true;
    this._device = options.device ?? null;

    // 2. Create ECS core
    this.world = new World();
    this.scheduler = new SystemScheduler(this.world);

    // 3. Create ResourceManager
    this.resourceManager = new ResourceManager(this._device ?? undefined);

    // 4. Register components
    this.registerSceneComponents();

    // 5. Create root entity
    const root = this.createRootEntity();

    // 6. Initialize modules
    this.entityManager = new EntityManager(this.world, this.id);
    this.hierarchyManager = new HierarchyManager(this.world, root);
    this.eventBus = new SceneEventBus();
    this.resourceFacade = new SceneResourceFacade(this.resourceManager);
    this.serializer = new SceneSerializer(getSceneComponentRegistry());

    this._disposed = false;
  }

  // === Device Management ===
  get device(): IRHIDevice | null {
    return this._device;
  }

  setDevice(device: IRHIDevice): void {
    this._device = device;
    this.resourceManager.setDevice(device);
  }

  // === Component Registration ===
  private registerSceneComponents(): void {
    this.world.registerComponent(Name);
    this.world.registerComponent(Tag);
    this.world.registerComponent(Disabled);
    this.world.registerComponent(Parent);
    this.world.registerComponent(Children);
    this.world.registerComponent(SceneEntityMetadata);
  }

  private createRootEntity(): EntityId {
    const root = this.world.createEntity();

    this.world.addComponent(root, Name, Name.fromData({ value: '__ROOT__' }));
    this.world.addComponent(
      root,
      SceneEntityMetadata,
      SceneEntityMetadata.fromData({ sceneId: this.id, active: true })
    );
    this.world.addComponent(root, Children, Children.fromData({ entities: [] }));

    return root;
  }

  // ==================== Entity Management (Delegate) ====================
  createEntity(name?: string): EntityId {
    this.checkDisposed();

    const entity = this.entityManager.createEntity(name);

    // Default: add to root
    this.hierarchyManager.setParent(entity, this.hierarchyManager.getRoot());

    // Emit event
    this.eventBus.emit('entityAdded', { entity, name });

    return entity;
  }

  addEntity(entity: EntityId): this {
    this.checkDisposed();

    this.entityManager.addEntity(entity);
    this.eventBus.emit('entityAdded', { entity });

    return this;
  }

  removeEntity(entity: EntityId): this {
    this.checkDisposed();

    this.hierarchyManager.detachFromParent(entity);
    this.entityManager.removeEntity(entity);
    this.eventBus.emit('entityRemoved', { entity });

    return this;
  }

  destroyEntity(entity: EntityId): void {
    this.checkDisposed();

    // Recursively destroy children
    const children = this.hierarchyManager.getChildren(entity);
    for (const child of children) {
      this.destroyEntity(child);
    }

    // Remove and destroy
    this.removeEntity(entity);
    this.world.destroyEntity(entity);
  }

  hasEntity(entity: EntityId): boolean {
    return this.entityManager.hasEntity(entity);
  }

  // === Queries (Delegate) ===
  findEntityByName(name: string): EntityId | null {
    return this.entityManager.findEntityByName(name);
  }

  getEntitiesByTag(tag: string): EntityId[] {
    return this.entityManager.findEntitiesByTag(tag);
  }

  getAllEntities(): EntityId[] {
    return this.entityManager.getAllEntities();
  }

  getEntityCount(): number {
    return this.entityManager.getEntityCount();
  }

  findEntitiesWithComponents(...componentTypes: ComponentClass[]): EntityId[] {
    const query = this.world.query({ all: componentTypes });
    const result: EntityId[] = [];

    query.forEach((entity) => {
      if (this.entityManager.hasEntity(entity)) {
        result.push(entity);
      }
    });

    this.world.removeQuery(query);
    return result;
  }

  // === Metadata (Delegate) ===
  getEntityName(entity: EntityId): string | null {
    return this.entityManager.getEntityName(entity);
  }

  setEntityName(entity: EntityId, name: string): void {
    this.entityManager.setEntityName(entity, name);
  }

  getEntityTag(entity: EntityId): string | null {
    return this.entityManager.getEntityTag(entity);
  }

  setEntityTag(entity: EntityId, tag: string): void {
    this.entityManager.setEntityTag(entity, tag);
  }

  isEntityActive(entity: EntityId): boolean {
    return this.entityManager.isEntityActive(entity);
  }

  setEntityActive(entity: EntityId, active: boolean): void {
    this.entityManager.setEntityActive(entity, active);
  }

  activateEntitiesByTag(tag: string): this {
    const entities = this.getEntitiesByTag(tag);
    for (const entity of entities) {
      this.setEntityActive(entity, true);
    }
    return this;
  }

  deactivateEntitiesByTag(tag: string): this {
    const entities = this.getEntitiesByTag(tag);
    for (const entity of entities) {
      this.setEntityActive(entity, false);
    }
    return this;
  }

  // ==================== Hierarchy (Delegate) ====================
  getRoot(): EntityId {
    return this.hierarchyManager.getRoot();
  }

  setParent(entity: EntityId, parent: EntityId | null): void {
    this.checkDisposed();
    this.hierarchyManager.setParent(entity, parent);
  }

  getParent(entity: EntityId): EntityId | null {
    return this.hierarchyManager.getParent(entity);
  }

  getChildren(entity: EntityId): EntityId[] {
    return this.hierarchyManager.getChildren(entity);
  }

  // ==================== Events (Delegate) ====================
  on<T = unknown>(event: SceneEventType, listener: SceneEventListener<T>): void {
    this.eventBus.on(event, listener);
  }

  off<T = unknown>(event: SceneEventType, listener: SceneEventListener<T>): void {
    this.eventBus.off(event, listener);
  }

  emit<T = unknown>(event: SceneEventType, data?: T): void {
    this.eventBus.emit(event, data);
  }

  // ==================== Resources (Delegate) ====================
  async loadMesh(uri: string): Promise<IResourceHandle> {
    this.checkDisposed();
    return this.resourceFacade.loadMesh(uri);
  }

  async loadTexture(uri: string): Promise<IResourceHandle> {
    this.checkDisposed();
    return this.resourceFacade.loadTexture(uri);
  }

  async loadMaterial(uri: string): Promise<IResourceHandle> {
    this.checkDisposed();
    return this.resourceFacade.loadMaterial(uri);
  }

  getMesh(handle: IResourceHandle): IMeshResource | undefined {
    return this.resourceFacade.getMesh(handle);
  }

  getTexture(handle: IResourceHandle): ITextureResource | undefined {
    return this.resourceFacade.getTexture(handle);
  }

  getMaterial(handle: IResourceHandle): IMaterialResource | undefined {
    return this.resourceFacade.getMaterial(handle);
  }

  releaseResource(handle: IResourceHandle): void {
    this.resourceFacade.releaseResource(handle);
  }

  // ==================== Serialization (Delegate) ====================
  static fromData(data: ISceneData, options: Partial<SceneConfig> = {}): Scene {
    const scene = new Scene({
      name: data.metadata.name,
      active: options.active ?? true,
      device: options.device,
      createRoot: true,
    });

    scene.serializer.fromData(data, scene);

    scene.eventBus.emit('dataLoaded', { data, entityCount: scene.getEntityCount() });
    return scene;
  }

  static async fromDataAsync(data: ISceneData, options: Partial<SceneConfig> = {}): Promise<Scene> {
    const scene = new Scene({
      name: data.metadata.name,
      active: options.active ?? true,
      device: options.device,
      createRoot: true,
    });

    await scene.serializer.fromDataAsync(data, scene);

    scene.eventBus.emit('dataLoaded', { data, entityCount: scene.getEntityCount() });
    return scene;
  }

  toData(): ISceneData {
    return this.serializer.toData(this);
  }

  // ==================== Lifecycle ====================
  onLoad(): this {
    this.eventBus.emit('load', { scene: this });
    return this;
  }

  onUnload(): this {
    this.eventBus.emit('unload', { scene: this });
    return this;
  }

  update(deltaTime: number): void {
    this.checkDisposed();

    if (!this._active) return;

    this.scheduler.update(deltaTime);
    this.eventBus.emit('update', { deltaTime });
  }

  render(): void {
    this.checkDisposed();

    if (!this._active || !this._device) return;

    // RenderSystem handles actual rendering in scheduler
  }

  clear(): this {
    this.checkDisposed();

    const entities = this.getAllEntities();
    const root = this.getRoot();

    for (const entity of entities) {
      if (entity !== root) {
        this.destroyEntity(entity);
      }
    }

    // Clear root's children
    const childrenComp = this.world.getComponent(root, Children);
    if (childrenComp) {
      childrenComp.entities = [];
    }

    return this;
  }

  isActive(): boolean {
    return this._active;
  }

  setActive(active: boolean): void {
    this._active = active;
  }

  isDisposed(): boolean {
    return this._disposed;
  }

  dispose(): void {
    if (this._disposed) return;

    // 1. Trigger unload event
    this.onUnload();

    // 2. Dispose resources FIRST (before clearing entities)
    this.resourceFacade.dispose();

    // 3. Clear entities
    this.clear();

    // 4. Destroy root entity
    const root = this.getRoot();
    if (root !== -1 as EntityId) {
      this.world.destroyEntity(root);
    }

    // 5. Clear modules
    this.entityManager.clear();
    this.eventBus.clear();
    this.world.clear();

    this._disposed = true;
  }

  // === Statistics ===
  getStats(): {
    name: string;
    id: string;
    entityCount: number;
    active: boolean;
    worldStats: ReturnType<World['getStats']>;
    schedulerStats: ReturnType<SystemScheduler['getStats']>;
  } {
    return {
      name: this.name,
      id: this.id,
      entityCount: this.getEntityCount(),
      active: this._active,
      worldStats: this.world.getStats(),
      schedulerStats: this.scheduler.getStats(),
    };
  }

  // === Private Helpers ===
  private checkDisposed(): void {
    if (this._disposed) {
      throw new Error(`Scene "${this.name}" has been disposed`);
    }
  }
}
```

---

### 4.2 Directory Structure

```
packages/core/src/scene/
├── Scene.ts                          # Core class (< 300 lines, composition pattern)
├── entity/
│   ├── EntityManager.ts              # Entity lifecycle + indexes
│   └── SceneEntityMetadata.ts        # Metadata component
├── hierarchy/
│   └── HierarchyManager.ts           # Parent-child relationships + traversal
├── events/
│   └── SceneEventBus.ts              # Event system
├── resources/
│   └── SceneResourceFacade.ts        # Resource management facade
├── serialization/
│   ├── SceneSerializer.ts            # Data (de)serialization
│   └── ComponentDeserializer.ts      # Component data conversion (optional)
└── index.ts                          # Unified export
```

---

### 4.3 Dependency Graph

```
Scene (Core - Composition)
├─ EntityManager        (world, sceneId)
├─ HierarchyManager     (world, root)
├─ SceneEventBus        (独立)
├─ SceneResourceFacade  (resourceManager)
└─ SceneSerializer      (registry)

Dependency Flow:
Scene → EntityManager → World (ECS)
Scene → HierarchyManager → World
Scene → SceneEventBus → (Independent)
Scene → SceneResourceFacade → ResourceManager → IRHIDevice
Scene → SceneSerializer → ComponentRegistry
```

**Critical Rules**:
- 🔒 No circular dependencies
- 🔒 All dependencies flow downward
- 🔒 Scene owns all module instances
- 🔒 Modules do NOT depend on Scene

---

## 5. Migration Strategy

### 5.1 Phased Implementation

**Phase 1: Preparation (1-2 days)**
1. Create directory structure
2. Define all interfaces
3. Write test skeletons

**Phase 2: Module Extraction (3-5 days)**
1. Extract EntityManager (TDD)
2. Extract HierarchyManager
3. Extract SceneEventBus
4. Extract SceneResourceFacade
5. Extract SceneSerializer

**Phase 3: Scene Refactoring (2-3 days)**
1. Rewrite Scene constructor
2. Delegate methods to modules
3. Remove duplicate code

**Phase 4: Verification (1-2 days)**
1. Run full test suite
2. Integration tests (demo apps)
3. Performance benchmarks

**Total Estimated Time**: 7-12 days

---

### 5.2 Backward Compatibility

**Strategy**:
- Scene public API remains unchanged
- Internal refactoring is transparent
- Deprecated APIs marked with `@deprecated`

**Compatibility Matrix**:
| API | Status | Migration |
|-----|--------|-----------|
| createEntity() | ✅ Unchanged | No action |
| fromData() | ✅ Unchanged | No action |
| fromDataAsync() | ✅ New (added) | Optional upgrade |
| dispose() | ✅ Unchanged | No action |

---

## 6. Execution Plan

<ExecutionPlan>

### Block 1: Extract EntityManager
**File**: `packages/core/src/scene/entity/EntityManager.ts`

**Steps**:
1. Create interface `IEntityManager`
2. Implement class `EntityManager`
3. Write tests: `entity-manager.test.ts`
4. Verify: 20+ test cases, 95% coverage

**Validation**:
- ✅ All entity lifecycle methods work
- ✅ Indexes maintained correctly
- ✅ Metadata operations succeed

---

### Block 2: Extract HierarchyManager
**File**: `packages/core/src/scene/hierarchy/HierarchyManager.ts`

**Steps**:
1. Create interface `IHierarchyManager`
2. Implement class `HierarchyManager`
3. Write tests: `hierarchy-manager.test.ts`
4. Verify: 15+ test cases, 95% coverage

**Validation**:
- ✅ Parent-child relationships correct
- ✅ Traversal methods work
- ✅ Detach operations succeed

---

### Block 3: Extract SceneEventBus
**File**: `packages/core/src/scene/events/SceneEventBus.ts`

**Steps**:
1. Create interface `ISceneEventBus`
2. Implement class `SceneEventBus`
3. Write tests: `scene-event-bus.test.ts`
4. Verify: 10+ test cases, 95% coverage

**Validation**:
- ✅ Event registration works
- ✅ Event emission triggers listeners
- ✅ Error in listener doesn't crash

---

### Block 4: Extract SceneResourceFacade
**File**: `packages/core/src/scene/resources/SceneResourceFacade.ts`

**Steps**:
1. Create interface `ISceneResourceFacade`
2. Implement class `SceneResourceFacade`
3. Write tests: `scene-resource-facade.test.ts`
4. Verify: 12+ test cases, 95% coverage

**Validation**:
- ✅ Delegates to ResourceManager
- ✅ All load methods work
- ✅ Dispose releases all resources

---

### Block 5: Extract SceneSerializer
**File**: `packages/core/src/scene/serialization/SceneSerializer.ts`

**Steps**:
1. Create interface `ISceneSerializer`
2. Implement class `SceneSerializer`
3. Write tests: `scene-serializer.test.ts`
4. Verify: 15+ test cases, 95% coverage

**Validation**:
- ✅ fromData creates entities correctly
- ✅ fromDataAsync preloads assets
- ✅ toData serializes scene

---

### Block 6: Refactor Scene Class
**File**: `packages/core/src/scene/Scene.ts`

**Steps**:
1. Replace inline logic with module calls
2. Maintain public API signatures
3. Run existing tests (should all pass)
4. Verify: Scene.ts < 300 lines

**Validation**:
- ✅ All existing tests pass
- ✅ Public API unchanged
- ✅ Performance no regression (±5%)

</ExecutionPlan>

---

## 7. Risk Assessment & Mitigation

### 7.1 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| 引入新 Bug | 🟡 Medium | 🔴 High | TDD + 95% coverage + Integration tests |
| 性能回归 | 🟢 Low | 🟡 Medium | Benchmark tests before/after |
| 集成问题 | 🟡 Medium | 🔴 High | Phased migration + Rollback points |
| 时间超期 | 🟡 Medium | 🟡 Medium | Parallel development + Priority queue |
| 破坏现有 API | 🟢 Low | 🔴 High | Backward compatibility tests |

### 7.2 Critical Constraints

**Must Follow**:
- ✅ 所有模块遵循宪法规则
- ✅ Single Responsibility Principle
- ✅ Interface Segregation
- ✅ Dependency Inversion
- ✅ Test coverage ≥95%
- ✅ No circular dependencies
- ✅ Backward compatible

**Forbidden**:
- 🚫 Global singletons
- 🚫 Hard-coded RHI implementation
- 🚫 Breaking public API
- 🚫 Shallow copy
- 🚫 Missing null checks

---

## 8. Success Criteria

### 8.1 Code Quality

**Metrics**:
- Scene.ts < 300 lines ✅
- Each module < 200 lines ✅
- Cyclomatic complexity < 10 ✅
- No code duplication > 3 lines ✅

### 8.2 Testing

**Requirements**:
- Unit test coverage ≥95% ✅
- Integration tests pass ✅
- Performance no regression (±5%) ✅
- All edge cases covered ✅

### 8.3 Maintainability

**Goals**:
- Clear responsibility boundaries ✅
- Unidirectional dependencies ✅
- Stable public interfaces ✅
- Easy to extend ✅

---

## 9. Implementation Checklist

### Phase 1: Preparation
- [ ] Create directory structure
- [ ] Define all interfaces
- [ ] Write test skeletons

### Phase 2: Module Extraction
- [ ] Extract EntityManager (+ tests)
- [ ] Extract HierarchyManager (+ tests)
- [ ] Extract SceneEventBus (+ tests)
- [ ] Extract SceneResourceFacade (+ tests)
- [ ] Extract SceneSerializer (+ tests)

### Phase 3: Scene Refactoring
- [ ] Rewrite Scene constructor
- [ ] Delegate all methods
- [ ] Remove inline logic
- [ ] Verify Scene.ts < 300 lines

### Phase 4: Verification
- [ ] Run existing Scene tests (all pass)
- [ ] Run new module tests (all pass)
- [ ] Integration tests (demo apps)
- [ ] Performance benchmarks (no regression)

### Phase 5: Documentation
- [ ] Update Scene JSDoc
- [ ] Update architecture docs
- [ ] Update CHANGELOG.md

---

## 10. References

### Architecture Documents
- `Ref: arch-core-unified` - Core package architecture
- `Ref: architecture-scene-systems` - Scene & Systems architecture
- `Ref: architecture-resources` - Resource management architecture
- `Ref: constitution-core-runtime` - Constitutional rules

### Implementation Files
- `packages/core/src/scene/scene.ts` - Current Scene implementation
- `packages/core/src/resources/index.ts` - ResourceManager implementation
- `packages/specification/src/core/interfaces.ts` - Core interfaces

### Test Files
- `packages/core/test/scene/scene.test.ts` - Existing Scene tests (reference)
- `packages/core/test/resources/resource-manager.test.ts` - Existing resource tests

---

**Strategy Version**: 1.0
**Review Status**: Draft
**Estimated Effort**: 7-12 days (coding + testing)
**Priority**: High (P1) - Architectural debt reduction
