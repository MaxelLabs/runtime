/**
 * Scene - 场景管理类（重构版）
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计决策
 *
 * Scene 是 Core 包的核心类，使用组合模式整合了：
 * - EntityManager：实体生命周期 + 索引维护
 * - HierarchyManager：父子关系 + 树遍历
 * - EventDispatcher：事件分发（复用 Core 包的事件系统）
 * - ResourceManager：资源管理（直接使用，无需门面）
 * - SceneSerializer：数据解析与序列化
 * - ECS World：实体组件管理
 * - SystemScheduler：系统调度
 * - RHI Device 接口：渲染硬件抽象（通过 Specification 接口注入）
 *
 * ## 依赖注入
 *
 * Scene 依赖 IRHIDevice 接口（定义在 @maxellabs/specification），
 * 不依赖具体的 RHI 实现。应用包负责创建具体的 RHI 设备并注入。
 *
 * ## 使用示例
 *
 * ```typescript
 * import { Scene } from '@maxellabs/core';
 * import { WebGLDevice } from '@maxellabs/rhi';
 *
 * // 创建 RHI 设备（在应用包中）
 * const device = new WebGLDevice(canvas);
 *
 * // 创建场景（注入设备）
 * const scene = new Scene({ device, name: 'MainScene' });
 *
 * // 创建实体
 * const entity = scene.createEntity('Player');
 * scene.world.addComponent(entity, LocalTransform, LocalTransform.fromData({...}));
 *
 * // 更新循环
 * function loop(deltaTime: number) {
 *   scene.update(deltaTime);
 *   scene.render();
 *   requestAnimationFrame(loop);
 * }
 * ```
 */

import type { EntityId, ComponentClass } from '../ecs';
import { World, SystemScheduler } from '../ecs';
import type {
  IRHIDevice,
  ISceneData,
  IResourceHandle,
  IMeshResource,
  ITextureResource,
  IMaterialResource,
} from '@maxellabs/specification';
import type { IScene, SceneOptions, SceneEventType, SceneEventListener } from '../rhi/IScene';
import { Parent, Children, Name, Tag, Disabled } from '../components';
import { getSceneComponentRegistry } from './component-registry';
import { ResourceManager } from '../resources';
import { EventDispatcher } from '../events/event-dispatcher';
import type { Event } from '../events/event';

// Import modules
import { SceneEntityManager } from './entity/entity-manager';
import { SceneEntityMetadata } from './entity/scene-entity-metadata';
import { HierarchyManager } from './hierarchy/hierarchy-manager';
import { SceneSerializer } from './serialization/scene-serializer';

// ============ Scene 实现 ============

/**
 * Scene 配置选项（扩展）
 */
export interface SceneConfig extends SceneOptions {
  /** RHI 设备（可选，用于渲染） */
  device?: IRHIDevice;
}

/**
 * Scene 类
 * 场景管理的核心实现（重构版 - 使用组合模式）
 */
export class Scene implements IScene {
  // === Core Properties ===
  readonly id: string;
  readonly name: string;
  readonly world: World;
  readonly scheduler: SystemScheduler;

  // === Modules (Composition) ===
  private entityManager: SceneEntityManager;
  private hierarchyManager: HierarchyManager;
  private eventDispatcher: EventDispatcher;
  private serializer: SceneSerializer;

  // === Device & Resources ===
  private _device: IRHIDevice | null;
  private _resourceManager: ResourceManager;

  // === Event Listener Mapping (for off() compatibility) ===
  private listenerMap: Map<SceneEventListener, (event: Event) => void> = new Map();

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
    this._resourceManager = new ResourceManager(this._device ?? undefined);

    // 4. Register components
    this.registerSceneComponents();

    // 5. Initialize entity manager first
    this.entityManager = new SceneEntityManager(this.world, this.id);

    // 6. Create root entity
    const root = options.createRoot !== false ? this.createRootEntity() : (-1 as EntityId);

    // 7. Initialize other modules
    this.hierarchyManager = new HierarchyManager(this.world, root);
    this.eventDispatcher = new EventDispatcher(`scene-${this.id}`);
    this.serializer = new SceneSerializer(getSceneComponentRegistry());

    this._disposed = false;
  }

  // === Device Management ===
  get device(): IRHIDevice | null {
    return this._device;
  }

  setDevice(device: IRHIDevice): void {
    this._device = device;
    this._resourceManager.setDevice(device);
  }

  /**
   * Get the resource manager instance
   * @returns The resource manager used by this scene
   * @remarks
   * This allows external packages to register custom loaders:
   * ```typescript
   * scene.resourceManager.registerLoader('gltf', new GLTFLoader());
   * ```
   */
  get resourceManager(): ResourceManager {
    return this._resourceManager;
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

    // Add root to entityManager (so it's tracked)
    // Note: We bypass the normal createEntity flow to avoid adding it as a child of itself
    this.entityManager.addEntity(root);

    return root;
  }

  // ==================== Entity Management (Delegate) ====================
  createEntity(name?: string): EntityId {
    this.checkDisposed();

    const entity = this.entityManager.createEntity(name);

    // Default: add to root
    this.hierarchyManager.setParent(entity, this.hierarchyManager.getRoot());

    // Emit event
    this.emit('entityAdded', { entity, name });

    return entity;
  }

  addEntity(entity: EntityId): this {
    this.checkDisposed();

    this.entityManager.addEntity(entity);
    this.emit('entityAdded', { entity });

    return this;
  }

  removeEntity(entity: EntityId): this {
    this.checkDisposed();

    this.hierarchyManager.detachFromParent(entity);
    this.entityManager.removeEntity(entity);
    this.emit('entityRemoved', { entity });

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

  // ==================== Events (Delegate to EventDispatcher) ====================
  on<T = unknown>(event: SceneEventType, listener: SceneEventListener<T>): void {
    // Create wrapper that adapts EventDispatcher's Event to our simple callback
    const wrapper = (e: Event) => {
      try {
        listener(e.data as T);
      } catch (error) {
        console.error(`[Scene] Error in event listener for ${event}:`, error);
      }
    };
    // Store mapping for off() to work correctly
    this.listenerMap.set(listener as SceneEventListener, wrapper);
    this.eventDispatcher.on(event, wrapper);
  }

  off<T = unknown>(event: SceneEventType, listener: SceneEventListener<T>): void {
    const wrapper = this.listenerMap.get(listener as SceneEventListener);
    if (wrapper) {
      this.eventDispatcher.off(event, wrapper);
      this.listenerMap.delete(listener as SceneEventListener);
    }
  }

  emit<T = unknown>(event: SceneEventType, data?: T): void {
    this.eventDispatcher.emit(event, data);
  }

  // ==================== Resources (Direct to ResourceManager) ====================
  async loadMesh(uri: string): Promise<IResourceHandle> {
    this.checkDisposed();
    return this._resourceManager.loadMesh(uri);
  }

  async loadTexture(uri: string): Promise<IResourceHandle> {
    this.checkDisposed();
    return this._resourceManager.loadTexture(uri);
  }

  async loadMaterial(uri: string): Promise<IResourceHandle> {
    this.checkDisposed();
    return this._resourceManager.loadMaterial(uri);
  }

  getMesh(handle: IResourceHandle): IMeshResource | undefined {
    return this._resourceManager.getMesh(handle);
  }

  getTexture(handle: IResourceHandle): ITextureResource | undefined {
    return this._resourceManager.getTexture(handle);
  }

  getMaterial(handle: IResourceHandle): IMaterialResource | undefined {
    return this._resourceManager.getMaterial(handle);
  }

  releaseResource(handle: IResourceHandle): void {
    this._resourceManager.release(handle);
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

    scene.emit('dataLoaded', { data, entityCount: scene.getEntityCount() });
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

    scene.emit('dataLoaded', { data, entityCount: scene.getEntityCount() });
    return scene;
  }

  toData(): ISceneData {
    return this.serializer.toData(this);
  }

  // ==================== Lifecycle ====================
  onLoad(): this {
    this.emit('load', { scene: this });
    return this;
  }

  onUnload(): this {
    this.emit('unload', { scene: this });
    return this;
  }

  update(deltaTime: number): void {
    this.checkDisposed();

    if (!this._active) {
      return;
    }

    this.scheduler.update(deltaTime);
    this.emit('update', { deltaTime });
  }

  render(): void {
    this.checkDisposed();

    if (!this._active || !this._device) {
      return;
    }

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
    if (this._disposed) {
      return;
    }

    // 1. Trigger unload event
    this.onUnload();

    // 2. Dispose resources FIRST (before clearing entities)
    this._resourceManager.dispose();

    // 3. Clear entities
    this.clear();

    // 4. Destroy root entity
    const root = this.getRoot();
    if (root !== (-1 as EntityId)) {
      this.world.destroyEntity(root);
    }

    // 5. Clear modules
    this.entityManager.clear();
    this.listenerMap.clear();
    this.eventDispatcher.dispose();
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
