/**
 * Scene - 场景管理类
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计决策
 *
 * Scene 是 Core 包的核心类，整合了：
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
import type { IRHIDevice, ISceneData, IEntityData, IComponentData, IDisposable } from '@maxellabs/specification';
import type { IScene, SceneOptions, SceneEventType, SceneEventListener } from '../rhi/IScene';
import { Parent, Children, Name, Tag, Disabled } from '../components';
import type { SceneComponentRegistry } from './component-registry';
import { getSceneComponentRegistry } from './component-registry';

// ============ 场景元数据组件 ============

/**
 * SceneEntityMetadata - 场景实体元数据组件
 * 用于存储实体的场景相关信息
 */
class SceneEntityMetadata {
  /** 所属场景 ID */
  sceneId: string = '';
  /** 是否激活 */
  active: boolean = true;

  static fromData(data: Partial<SceneEntityMetadata>): SceneEntityMetadata {
    const component = new SceneEntityMetadata();
    if (data.sceneId !== undefined) {
      component.sceneId = data.sceneId;
    }
    if (data.active !== undefined) {
      component.active = data.active;
    }
    return component;
  }

  clone(): SceneEntityMetadata {
    const cloned = new SceneEntityMetadata();
    cloned.sceneId = this.sceneId;
    cloned.active = this.active;
    return cloned;
  }
}

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
 * 场景管理的核心实现
 */
export class Scene implements IScene, IDisposable {
  /** 场景名称 */
  readonly name: string;

  /** 场景唯一 ID */
  readonly id: string;

  /** ECS World 实例 */
  readonly world: World;

  /** System 调度器 */
  readonly scheduler: SystemScheduler;

  /** RHI 设备（可选） */
  private _device: IRHIDevice | null;

  /** 场景根实体 */
  private _root: EntityId;

  /** 场景中的实体集合 */
  private entities: Set<EntityId> = new Set();

  /** 名称索引 */
  private nameIndex: Map<string, EntityId> = new Map();

  /** 标签索引 */
  private tagIndex: Map<string, Set<EntityId>> = new Map();

  /** 事件监听器 */
  private eventListeners: Map<SceneEventType, Set<SceneEventListener>> = new Map();

  /** 场景激活状态 */
  private _active: boolean = true;

  /** 是否已销毁 */
  private _disposed: boolean = false;

  /** 场景计数器（用于生成唯一 ID） */
  private static sceneCounter: number = 0;

  /**
   * 检查场景是否已销毁
   * @implements IDisposable
   */
  isDisposed(): boolean {
    return this._disposed;
  }

  constructor(options: SceneConfig = {}) {
    // 生成场景 ID
    this.id = `scene_${++Scene.sceneCounter}`;
    this.name = options.name ?? 'Scene';
    this._active = options.active ?? true;
    this._device = options.device ?? null;

    // 创建 World 和 Scheduler
    this.world = new World();
    this.scheduler = new SystemScheduler(this.world);

    // 注册场景所需组件
    this.registerSceneComponents();

    // 创建根实体
    if (options.createRoot !== false) {
      this._root = this.createRootEntity();
    } else {
      this._root = -1 as EntityId;
    }
  }

  // ==================== 属性访问 ====================

  /**
   * 获取 RHI 设备
   */
  get device(): IRHIDevice | null {
    return this._device;
  }

  /**
   * 设置 RHI 设备
   */
  setDevice(device: IRHIDevice): void {
    this._device = device;
  }

  // ==================== 组件注册 ====================

  /**
   * 注册场景所需的组件类型
   */
  private registerSceneComponents(): void {
    // 数据组件
    this.world.registerComponent(Name);
    this.world.registerComponent(Tag);
    this.world.registerComponent(Disabled);

    // 层级组件
    this.world.registerComponent(Parent);
    this.world.registerComponent(Children);

    // 场景元数据组件
    this.world.registerComponent(SceneEntityMetadata);
  }

  /**
   * 创建根实体
   */
  private createRootEntity(): EntityId {
    const root = this.world.createEntity();

    // 添加名称
    this.world.addComponent(root, Name, Name.fromData({ value: '__ROOT__' }));

    // 添加场景元数据
    this.world.addComponent(
      root,
      SceneEntityMetadata,
      SceneEntityMetadata.fromData({ sceneId: this.id, active: true })
    );

    // 添加子实体列表
    this.world.addComponent(root, Children, Children.fromData({ entities: [] }));

    // 添加到实体集合
    this.entities.add(root);
    this.nameIndex.set('__ROOT__', root);

    return root;
  }

  // ==================== 实体管理 ====================

  /**
   * 创建新实体
   */
  createEntity(name?: string): EntityId {
    this.checkDisposed();

    const entity = this.world.createEntity();

    // 添加场景元数据
    this.world.addComponent(
      entity,
      SceneEntityMetadata,
      SceneEntityMetadata.fromData({ sceneId: this.id, active: true })
    );

    // 添加名称（如果提供）
    if (name) {
      this.world.addComponent(entity, Name, Name.fromData({ value: name }));
      this.nameIndex.set(name, entity);
    }

    // 添加到实体集合
    this.entities.add(entity);

    // 默认作为根实体的子实体
    if (this._root !== -1) {
      this.setParent(entity, this._root);
    }

    // 触发事件
    this.emit('entityAdded', { entity, name });

    return entity;
  }

  /**
   * 添加已存在的实体到场景
   */
  addEntity(entity: EntityId): this {
    this.checkDisposed();

    if (this.entities.has(entity)) {
      return this;
    }

    // 添加场景元数据
    if (!this.world.hasComponent(entity, SceneEntityMetadata)) {
      this.world.addComponent(
        entity,
        SceneEntityMetadata,
        SceneEntityMetadata.fromData({ sceneId: this.id, active: true })
      );
    }

    // 更新索引
    const nameComp = this.world.getComponent(entity, Name);
    if (nameComp) {
      this.nameIndex.set(nameComp.value, entity);
    }

    const tagComp = this.world.getComponent(entity, Tag);
    if (tagComp) {
      this.addToTagIndex(tagComp.value, entity);
    }

    this.entities.add(entity);
    this.emit('entityAdded', { entity });

    return this;
  }

  /**
   * 从场景移除实体
   */
  removeEntity(entity: EntityId): this {
    this.checkDisposed();

    if (!this.entities.has(entity)) {
      return this;
    }

    // 更新索引
    const nameComp = this.world.getComponent(entity, Name);
    if (nameComp) {
      this.nameIndex.delete(nameComp.value);
    }

    const tagComp = this.world.getComponent(entity, Tag);
    if (tagComp) {
      this.removeFromTagIndex(tagComp.value, entity);
    }

    // 移除场景元数据
    this.world.removeComponent(entity, SceneEntityMetadata);

    // 处理层级关系
    this.detachFromParent(entity);

    this.entities.delete(entity);
    this.emit('entityRemoved', { entity });

    return this;
  }

  /**
   * 销毁实体
   */
  destroyEntity(entity: EntityId): void {
    this.checkDisposed();

    // 先递归销毁子实体
    const childrenComp = this.world.getComponent(entity, Children);
    if (childrenComp && childrenComp.entities.length > 0) {
      // 复制数组以避免迭代时修改
      const children = [...childrenComp.entities];
      for (const child of children) {
        this.destroyEntity(child);
      }
    }

    // 从场景移除
    this.removeEntity(entity);

    // 销毁实体
    this.world.destroyEntity(entity);
  }

  /**
   * 检查实体是否在场景中
   */
  hasEntity(entity: EntityId): boolean {
    return this.entities.has(entity);
  }

  // ==================== 实体查询 ====================

  /**
   * 通过名称查找实体
   */
  findEntityByName(name: string): EntityId | null {
    return this.nameIndex.get(name) ?? null;
  }

  /**
   * 获取所有实体
   */
  getAllEntities(): EntityId[] {
    return Array.from(this.entities);
  }

  /**
   * 获取实体数量
   */
  getEntityCount(): number {
    return this.entities.size;
  }

  /**
   * 通过标签获取实体
   */
  getEntitiesByTag(tag: string): EntityId[] {
    return Array.from(this.tagIndex.get(tag) ?? []);
  }

  /**
   * 查找具有指定组件的实体
   */
  findEntitiesWithComponents(...componentTypes: ComponentClass[]): EntityId[] {
    const query = this.world.query({ all: componentTypes });
    const result: EntityId[] = [];

    query.forEach((entity) => {
      if (this.entities.has(entity)) {
        result.push(entity);
      }
    });

    // 清理查询
    this.world.removeQuery(query);

    return result;
  }

  // ==================== 实体元数据 ====================

  /**
   * 获取实体名称
   */
  getEntityName(entity: EntityId): string | null {
    const comp = this.world.getComponent(entity, Name);
    return comp?.value ?? null;
  }

  /**
   * 设置实体名称
   */
  setEntityName(entity: EntityId, name: string): void {
    const oldName = this.getEntityName(entity);

    // 更新索引
    if (oldName) {
      this.nameIndex.delete(oldName);
    }
    this.nameIndex.set(name, entity);

    // 更新组件
    if (this.world.hasComponent(entity, Name)) {
      const comp = this.world.getComponent(entity, Name)!;
      comp.value = name;
    } else {
      this.world.addComponent(entity, Name, Name.fromData({ value: name }));
    }
  }

  /**
   * 获取实体标签
   */
  getEntityTag(entity: EntityId): string | null {
    const comp = this.world.getComponent(entity, Tag);
    return comp?.value ?? null;
  }

  /**
   * 设置实体标签
   */
  setEntityTag(entity: EntityId, tag: string): void {
    const oldTag = this.getEntityTag(entity);

    // 更新索引
    if (oldTag) {
      this.removeFromTagIndex(oldTag, entity);
    }
    this.addToTagIndex(tag, entity);

    // 更新组件
    if (this.world.hasComponent(entity, Tag)) {
      const comp = this.world.getComponent(entity, Tag)!;
      comp.value = tag;
    } else {
      this.world.addComponent(entity, Tag, Tag.fromData({ value: tag }));
    }
  }

  /**
   * 检查实体是否激活
   */
  isEntityActive(entity: EntityId): boolean {
    const meta = this.world.getComponent(entity, SceneEntityMetadata);
    return meta?.active ?? false;
  }

  /**
   * 设置实体激活状态
   */
  setEntityActive(entity: EntityId, active: boolean): void {
    const meta = this.world.getComponent(entity, SceneEntityMetadata);
    if (meta) {
      meta.active = active;
    }

    // 同步 Disabled 组件
    if (active) {
      this.world.removeComponent(entity, Disabled);
    } else {
      if (!this.world.hasComponent(entity, Disabled)) {
        this.world.addComponent(entity, Disabled, new Disabled());
      }
    }
  }

  /**
   * 批量激活具有指定标签的实体
   */
  activateEntitiesByTag(tag: string): this {
    const entities = this.getEntitiesByTag(tag);
    for (const entity of entities) {
      this.setEntityActive(entity, true);
    }
    return this;
  }

  /**
   * 批量停用具有指定标签的实体
   */
  deactivateEntitiesByTag(tag: string): this {
    const entities = this.getEntitiesByTag(tag);
    for (const entity of entities) {
      this.setEntityActive(entity, false);
    }
    return this;
  }

  // ==================== 层级关系 ====================

  /**
   * 获取场景根实体
   */
  getRoot(): EntityId {
    return this._root;
  }

  /**
   * 设置实体的父实体
   */
  setParent(entity: EntityId, parent: EntityId | null): void {
    this.checkDisposed();

    // 先从当前父实体移除
    this.detachFromParent(entity);

    const actualParent = parent ?? this._root;
    if (actualParent === -1) {
      return;
    }

    // 设置 Parent 组件
    if (this.world.hasComponent(entity, Parent)) {
      const comp = this.world.getComponent(entity, Parent)!;
      comp.entity = actualParent;
    } else {
      this.world.addComponent(entity, Parent, Parent.fromData({ entity: actualParent }));
    }

    // 更新父实体的 Children 组件
    let childrenComp = this.world.getComponent(actualParent, Children);
    if (!childrenComp) {
      this.world.addComponent(actualParent, Children, Children.fromData({ entities: [] }));
      childrenComp = this.world.getComponent(actualParent, Children)!;
    }

    if (!childrenComp.entities.includes(entity)) {
      childrenComp.entities.push(entity);
    }
  }

  /**
   * 获取实体的父实体
   */
  getParent(entity: EntityId): EntityId | null {
    const comp = this.world.getComponent(entity, Parent);
    return comp?.entity ?? null;
  }

  /**
   * 获取实体的子实体
   */
  getChildren(entity: EntityId): EntityId[] {
    const comp = this.world.getComponent(entity, Children);
    return comp?.entities ? [...comp.entities] : [];
  }

  /**
   * 从父实体分离
   */
  private detachFromParent(entity: EntityId): void {
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

    // 移除 Parent 组件
    this.world.removeComponent(entity, Parent);
  }

  // ==================== 生命周期 ====================

  /**
   * 场景加载时调用
   */
  onLoad(): this {
    this.emit('load', { scene: this });
    return this;
  }

  /**
   * 场景卸载时调用
   */
  onUnload(): this {
    this.emit('unload', { scene: this });
    return this;
  }

  /**
   * 更新场景
   */
  update(deltaTime: number): void {
    this.checkDisposed();

    if (!this._active) {
      return;
    }

    // 执行系统调度
    this.scheduler.update(deltaTime);

    // 触发更新事件
    this.emit('update', { deltaTime });
  }

  /**
   * 渲染场景
   * @remarks
   * 基础渲染入口，具体渲染逻辑由 RenderSystem 实现
   */
  render(): void {
    this.checkDisposed();

    if (!this._active || !this._device) {
      return;
    }

    // 渲染由 RenderSystem 在 scheduler.update() 中执行
    // 这里可以添加额外的渲染前/后处理
  }

  /**
   * 清空场景中的所有实体
   */
  clear(): this {
    this.checkDisposed();

    // 复制数组以避免迭代时修改
    const entities = Array.from(this.entities);

    for (const entity of entities) {
      if (entity !== this._root) {
        this.destroyEntity(entity);
      }
    }

    // 清空根实体的子实体列表
    const childrenComp = this.world.getComponent(this._root, Children);
    if (childrenComp) {
      childrenComp.entities = [];
    }

    return this;
  }

  /**
   * 检查场景是否激活
   */
  isActive(): boolean {
    return this._active;
  }

  /**
   * 设置场景激活状态
   */
  setActive(active: boolean): void {
    this._active = active;
  }

  // ==================== 事件系统 ====================

  /**
   * 注册事件监听器
   */
  on<T = unknown>(event: SceneEventType, listener: SceneEventListener<T>): void {
    let listeners = this.eventListeners.get(event);
    if (!listeners) {
      listeners = new Set();
      this.eventListeners.set(event, listeners);
    }
    listeners.add(listener as SceneEventListener);
  }

  /**
   * 移除事件监听器
   */
  off<T = unknown>(event: SceneEventType, listener: SceneEventListener<T>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener as SceneEventListener);
    }
  }

  /**
   * 触发事件
   */
  emit<T = unknown>(event: SceneEventType, data?: T): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in scene event listener (${event}):`, error);
        }
      }
    }
  }

  // ==================== 资源管理 ====================

  /**
   * 销毁场景
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }

    // 触发卸载事件
    this.onUnload();

    // 清空实体
    this.clear();

    // 销毁根实体
    if (this._root !== -1) {
      this.world.destroyEntity(this._root);
    }

    // 清空 World
    this.world.clear();

    // 清空事件监听器
    this.eventListeners.clear();

    // 清空索引
    this.nameIndex.clear();
    this.tagIndex.clear();
    this.entities.clear();

    this._disposed = true;
  }

  // ==================== 私有方法 ====================

  /**
   * 检查场景是否已销毁
   */
  private checkDisposed(): void {
    if (this._disposed) {
      throw new Error(`Scene "${this.name}" has been disposed`);
    }
  }

  /**
   * 添加到标签索引
   */
  private addToTagIndex(tag: string, entity: EntityId): void {
    let set = this.tagIndex.get(tag);
    if (!set) {
      set = new Set();
      this.tagIndex.set(tag, set);
    }
    set.add(entity);
  }

  /**
   * 从标签索引移除
   */
  private removeFromTagIndex(tag: string, entity: EntityId): void {
    const set = this.tagIndex.get(tag);
    if (set) {
      set.delete(entity);
      if (set.size === 0) {
        this.tagIndex.delete(tag);
      }
    }
  }

  // ==================== 统计信息 ====================

  /**
   * 获取场景统计信息
   */
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
      entityCount: this.entities.size,
      active: this._active,
      worldStats: this.world.getStats(),
      schedulerStats: this.scheduler.getStats(),
    };
  }

  // ==================== 数据解析 ====================

  /**
   * 从场景数据创建场景实例
   * @param data 场景数据（符合 ISceneData 规范）
   * @param options 额外配置选项
   * @returns Scene 实例
   *
   * @remarks
   * 数据流: Editor → SceneData (spec) → Scene.fromData() → ECS World
   *
   * @example
   * ```typescript
   * const sceneData = await fetch('scene.json').then(r => r.json());
   * const scene = Scene.fromData(sceneData, { device });
   * ```
   */
  static fromData(data: ISceneData, options: Partial<SceneConfig> = {}): Scene {
    // 1. 创建场景实例
    const scene = new Scene({
      name: data.metadata.name,
      active: options.active ?? true,
      device: options.device,
      createRoot: true,
    });

    // 2. 获取组件注册表
    const registry = getSceneComponentRegistry();

    // 3. 建立旧 ID 到新 Entity 的映射
    const entityIdMap: Map<number, EntityId> = new Map();

    // 4. 第一遍：创建所有实体
    for (const entityData of data.entities) {
      const entity = scene.createEntityFromData(entityData, registry);
      entityIdMap.set(entityData.id, entity);
    }

    // 5. 第二遍：建立父子关系
    for (const entityData of data.entities) {
      if (entityData.parent !== undefined && entityData.parent !== null) {
        const entity = entityIdMap.get(entityData.id);
        const parentEntity = entityIdMap.get(entityData.parent);

        if (entity !== undefined && parentEntity !== undefined) {
          scene.setParent(entity, parentEntity);
        }
      }
    }

    // 6. 应用环境设置（如果有）
    if (data.environment) {
      scene.applyEnvironment(data.environment);
    }

    // 7. 应用渲染设置（如果有）
    if (data.renderSettings) {
      scene.applyRenderSettings(data.renderSettings);
    }

    // 8. 触发加载完成事件
    scene.emit('dataLoaded', { data, entityCount: entityIdMap.size });

    return scene;
  }

  /**
   * 从实体数据创建实体
   * @internal
   */
  private createEntityFromData(entityData: IEntityData, registry: SceneComponentRegistry): EntityId {
    // 创建实体（名称会自动添加）
    const entity = this.createEntity(entityData.name);

    // 设置标签
    if (entityData.tag) {
      this.setEntityTag(entity, entityData.tag);
    }

    // 设置激活状态
    if (entityData.active === false) {
      this.setEntityActive(entity, false);
    }

    // 添加组件
    for (const componentData of entityData.components) {
      this.addComponentFromData(entity, componentData, registry);
    }

    return entity;
  }

  /**
   * 从组件数据添加组件
   * @internal
   */
  private addComponentFromData(
    entity: EntityId,
    componentData: IComponentData,
    registry: SceneComponentRegistry
  ): void {
    const { type, data, enabled } = componentData;

    // 跳过已由 createEntity 处理的组件
    if (type === 'Name' || type === 'Tag') {
      return;
    }

    // 获取组件类
    const componentClass = registry.getComponentClass(type);
    if (!componentClass) {
      console.warn(`[Scene] Unknown component type: ${type}`);
      return;
    }

    // 创建组件实例
    const component = registry.createComponent(type, data);
    if (!component) {
      console.warn(`[Scene] Failed to create component: ${type}`);
      return;
    }

    // 处理 enabled 状态
    if (enabled === false && 'enabled' in (component as Record<string, unknown>)) {
      (component as Record<string, unknown>).enabled = false;
    }

    // 添加到实体
    try {
      this.world.addComponent(entity, componentClass, component);
    } catch (error) {
      console.error(`[Scene] Failed to add component ${type} to entity:`, error);
    }
  }

  /**
   * 应用环境设置
   * @internal
   */
  private applyEnvironment(environment: NonNullable<ISceneData['environment']>): void {
    // 环境设置可以存储在场景级别的元数据中
    // 或者创建专门的环境实体
    // 这里先存储到场景属性中，后续可以扩展
    (this as unknown as { _environment: typeof environment })._environment = environment;
    this.emit('environmentChanged', environment);
  }

  /**
   * 应用渲染设置
   * @internal
   */
  private applyRenderSettings(renderSettings: NonNullable<ISceneData['renderSettings']>): void {
    // 渲染设置可以存储在场景级别
    // 后续由 RenderSystem 读取并应用
    (this as unknown as { _renderSettings: typeof renderSettings })._renderSettings = renderSettings;
    this.emit('renderSettingsChanged', renderSettings);
  }

  /**
   * 导出场景数据
   * @returns 场景数据（符合 ISceneData 规范）
   *
   * @remarks
   * 用于将运行时场景序列化回编辑器格式
   */
  toData(): ISceneData {
    const entities: IEntityData[] = [];
    const registry = getSceneComponentRegistry();
    const registeredTypes = registry.getRegisteredTypes();

    // 遍历所有实体（除根实体）
    for (const entityId of this.entities) {
      if (entityId === this._root) {
        continue;
      }

      const entityData: IEntityData = {
        id: entityId as number,
        name: this.getEntityName(entityId) ?? undefined,
        tag: this.getEntityTag(entityId) ?? undefined,
        active: this.isEntityActive(entityId),
        parent: this.getParent(entityId) as number | null,
        components: [],
      };

      // 收集组件数据
      for (const typeId of registeredTypes) {
        const componentClass = registry.getComponentClass(typeId);
        if (!componentClass) {
          continue;
        }

        if (this.world.hasComponent(entityId, componentClass)) {
          const component = this.world.getComponent(entityId, componentClass);
          if (component) {
            // 跳过内部组件
            if (typeId === 'Parent' || typeId === 'Children' || typeId === 'Name' || typeId === 'Tag') {
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
        name: this.name,
        id: this.id,
        modifiedAt: new Date().toISOString(),
      },
      entities,
    };
  }

  /**
   * 序列化组件为 POD 数据
   * @internal
   */
  private serializeComponent(component: unknown): Record<string, unknown> {
    if (component === null || component === undefined) {
      return {};
    }

    const data: Record<string, unknown> = {};
    const obj = component as Record<string, unknown>;

    for (const key of Object.keys(obj)) {
      const value = obj[key];

      // 跳过函数和私有属性
      if (typeof value === 'function' || key.startsWith('_')) {
        continue;
      }

      // 深拷贝对象
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
}
