import { EventDispatcher } from '../base/event-dispatcher';
import { Entity } from '../base/entity';
import { GameObject } from './game-object';
import { ShaderData } from '../shader/shader-data';
import { Container } from '../base/IOC';
import type { Component } from '../base/component';
import { ObjectPool } from '../base/object-pool';

/**
 * 场景事件类型
 */
export enum SceneEvent {
  /** 实体添加到场景 */
  ENTITY_ADDED = 'entityAdded',
  /** 实体从场景移除 */
  ENTITY_REMOVED = 'entityRemoved',
  /** 实体创建 */
  ENTITY_CREATED = 'entityCreated',
  /** 场景加载 */
  LOAD = 'load',
  /** 场景卸载 */
  UNLOAD = 'unload',
  /** 场景更新 */
  UPDATE = 'update',
  /** 场景清理前 */
  BEFORE_CLEAR = 'beforeClear',
  /** 场景清理完成 */
  CLEARED = 'cleared',
  /** 场景销毁前 */
  BEFORE_DESTROY = 'beforeDestroy',
  /** 场景已销毁 */
  DESTROYED = 'destroyed',
}

/**
 * 场景类
 * 包含游戏对象、灯光、相机等元素
 */
export class Scene extends EventDispatcher {
  /** 场景名称 */
  override name: string;
  /** 场景中的实体列表 */
  private entities: Map<string, Entity> = new Map();

  /** 场景着色器数据 */
  shaderData: ShaderData = new ShaderData();
  /** 根实体 */
  private rootEntity: Entity;
  /** 是否已经加载 */
  private isLoaded: boolean = false;
  /** IOC容器 */
  private container: Container;
  /** 数组对象池 - 用于返回实体列表 */
  private static readonly entityArrayPool = new ObjectPool<Entity[]>(
    'sceneEntityArrayPool',
    () => [],
    (array) => {
      array.length = 0;
    },
    5,
    20
  );

  /**
   * 创建场景
   * @param name 场景名称
   */
  constructor(name: string) {
    super();
    this.name = name;
    this.tag = `scene_${this.name}_${Math.floor(Math.random() * 10000)}`;
    this.container = Container.getInstance();

    // 创建根实体
    this.rootEntity = new Entity('root');
    this.addEntity(this.rootEntity);
  }

  /**
   * 添加实体到场景
   * @param entity 实体
   * @returns 当前场景实例，用于链式调用
   */
  addEntity(entity: Entity): this {
    if (this.entities.has(entity.id)) {
      console.warn(`实体 ${entity.id} 已存在于场景中`);

      return this;
    }

    this.entities.set(entity.id, entity);
    entity.setScene(this);

    // 派发实体添加事件
    this.dispatchEvent(SceneEvent.ENTITY_ADDED, { entity });

    return this;
  }

  /**
   * 从场景中移除实体
   * @param entity 实体或实体ID
   * @returns 当前场景实例，用于链式调用
   */
  removeEntity(entity: Entity | string): this {
    const entityId = typeof entity === 'string' ? entity : entity.id;
    const targetEntity = this.entities.get(entityId);

    if (!targetEntity) {
      console.warn(`实体 ${entityId} 不存在于场景中`);

      return this;
    }

    // 阻止移除根实体
    if (targetEntity === this.rootEntity) {
      console.error('无法从场景中移除根实体');

      return this;
    }

    this.entities.delete(entityId);
    targetEntity.setScene(null);

    // 派发实体移除事件
    this.dispatchEvent(SceneEvent.ENTITY_REMOVED, { entity: targetEntity });

    return this;
  }

  /**
   * 查找实体
   * @param id 实体ID
   * @returns 找到的实体或null
   */
  findEntity(id: string): Entity | null {
    return this.entities.get(id) || null;
  }

  /**
   * 查找实体通过名称
   * @param name 实体名称
   * @returns 找到的第一个匹配实体或null
   */
  findEntityByName(name: string): Entity | null {
    for (const entity of this.entities.values()) {
      if (entity.name === name) {
        return entity;
      }
    }

    return null;
  }

  /**
   * 创建新实体并添加到场景
   * @param name 实体名称
   * @returns 创建的实体
   */
  createEntity(name?: string): Entity {
    const entity = new Entity(name);

    this.addEntity(entity);

    // 派发实体创建事件
    this.dispatchEvent(SceneEvent.ENTITY_CREATED, { entity });

    return entity;
  }

  /**
   * 获取场景中的所有实体
   * @returns 实体数组（从对象池获取，使用完请释放）
   */
  getAllEntities(): Entity[] {
    const result = Scene.entityArrayPool.get();

    for (const entity of this.entities.values()) {
      result.push(entity);
    }

    return result;
  }

  /**
   * 释放实体数组回对象池
   * @param array 从getAllEntities获取的数组
   */
  releaseEntityArray(array: Entity[]): void {
    Scene.entityArrayPool.release(array);
  }

  /**
   * 场景加载时调用
   * @returns 当前场景实例，用于链式调用
   */
  onLoad(): this {
    if (this.isLoaded) {
      return this;
    }

    this.isLoaded = true;

    // 通知所有实体场景加载
    for (const entity of this.entities.values()) {
      entity.onSceneLoad();
    }

    // 派发加载事件
    this.dispatchEvent(SceneEvent.LOAD, { scene: this });

    return this;
  }

  /**
   * 场景卸载时调用
   * @returns 当前场景实例，用于链式调用
   */
  onUnload(): this {
    if (!this.isLoaded) {
      return this;
    }

    this.isLoaded = false;

    // 通知所有实体场景卸载
    for (const entity of this.entities.values()) {
      entity.onSceneUnload();
    }

    // 派发卸载事件
    this.dispatchEvent(SceneEvent.UNLOAD, { scene: this });

    return this;
  }

  /**
   * 更新场景
   * @param deltaTime 时间增量(秒)
   */
  update(deltaTime: number): void {
    if (!this.isLoaded) {
      return;
    }

    // 先更新根实体，确保场景层级关系正确
    if (this.rootEntity.isEnabled()) {
      this.rootEntity.update(deltaTime);
    }

    // 更新除了根实体之外的所有顶级实体
    for (const entity of this.entities.values()) {
      if (entity !== this.rootEntity && entity.isEnabled() && !entity.transform.getParent()) {
        entity.update(deltaTime);
      }
    }

    // 派发更新事件
    this.dispatchEvent(SceneEvent.UPDATE, { deltaTime, scene: this });
  }

  /**
   * 获取根实体
   */
  getRoot(): Entity {
    return this.rootEntity;
  }

  /**
   * 获取实体数量
   */
  getEntityCount(): number {
    return this.entities.size;
  }

  /**
   * 清除场景中除根实体外的所有实体
   * @returns 当前场景实例，用于链式调用
   */
  clear(): this {
    const entitiesToRemove: Entity[] = [];

    // 收集需要移除的实体
    for (const entity of this.entities.values()) {
      if (entity !== this.rootEntity) {
        entitiesToRemove.push(entity);
      }
    }

    // 派发场景清理前事件
    this.dispatchEvent(SceneEvent.BEFORE_CLEAR, {
      scene: this,
      entityCount: entitiesToRemove.length,
    });

    // 移除并销毁实体
    for (const entity of entitiesToRemove) {
      this.removeEntity(entity);
      entity.destroy();
    }

    // 派发场景清理完成事件
    this.dispatchEvent(SceneEvent.CLEARED, { scene: this });

    return this;
  }

  /**
   * 销毁场景
   */
  override destroy(): void {
    if (this.isDestroyed()) {
      return;
    }

    // 派发销毁前事件
    this.dispatchEvent(SceneEvent.BEFORE_DESTROY, { scene: this });

    // 卸载场景
    this.onUnload();

    // 销毁所有实体
    for (const entity of this.entities.values()) {
      if (entity !== this.rootEntity) {
        entity.destroy();
      }
    }

    // 最后销毁根实体
    this.rootEntity.destroy();

    this.entities.clear();

    // 派发销毁事件
    this.dispatchEvent(SceneEvent.DESTROYED, { scene: this });

    super.destroy();
  }

  /**
   * 根据标签获取实体
   * @param tag 实体标签
   * @returns 具有指定标签的所有实体
   */
  getEntitiesByTag(tag: string): Entity[] {
    const result = Scene.entityArrayPool.get();

    for (const entity of this.entities.values()) {
      if (entity.getTag() === tag) {
        result.push(entity);
      }
    }

    return result;
  }

  /**
   * 查找具有特定组件类型的所有实体
   * @param componentType 组件类型
   * @returns 具有指定组件类型的所有实体
   */
  findEntitiesByComponent<T extends Component>(componentType: new (...args: any[]) => T): Entity[] {
    const result = Scene.entityArrayPool.get();

    for (const entity of this.entities.values()) {
      if (entity.getComponent(componentType)) {
        result.push(entity);
      }
    }

    return result;
  }

  /**
   * 检查场景是否已加载
   */
  isActive(): boolean {
    return this.isLoaded;
  }

  /**
   * 激活特定标签的所有实体
   * @param tag 实体标签
   * @returns 当前场景实例，用于链式调用
   */
  activateEntitiesByTag(tag: string): this {
    const entities = this.getEntitiesByTag(tag);

    for (const entity of entities) {
      entity.setEnabled(true);
    }

    this.releaseEntityArray(entities);

    return this;
  }

  /**
   * 禁用特定标签的所有实体
   * @param tag 实体标签
   * @returns 当前场景实例，用于链式调用
   */
  deactivateEntitiesByTag(tag: string): this {
    const entities = this.getEntitiesByTag(tag);

    for (const entity of entities) {
      entity.setEnabled(false);
    }

    this.releaseEntityArray(entities);

    return this;
  }

  /**
   * 创建新游戏对象并添加到场景
   * @param name 游戏对象名称
   * @returns 创建的游戏对象
   */
  createGameObject(name?: string): GameObject {
    const gameObject = new GameObject(name, this);
    this.addEntity(gameObject.getEntity());

    // 派发游戏对象创建事件
    this.dispatchEvent(SceneEvent.ENTITY_CREATED, { entity: gameObject.getEntity() });

    return gameObject;
  }

  /**
   * 添加游戏对象到场景
   * @param gameObject 游戏对象
   * @returns 当前场景实例，用于链式调用
   */
  addGameObject(gameObject: GameObject): this {
    this.addEntity(gameObject.getEntity());
    return this;
  }

  /**
   * 从场景中移除游戏对象
   * @param gameObject 游戏对象
   * @returns 当前场景实例，用于链式调用
   */
  removeGameObject(gameObject: GameObject): this {
    this.removeEntity(gameObject.getEntity());
    return this;
  }

  /**
   * 查找游戏对象
   * @param id 游戏对象ID
   * @returns 找到的游戏对象或null
   */
  findGameObject(id: string): GameObject | null {
    const entity = this.findEntity(id);
    return entity ? GameObject.fromEntity(entity) : null;
  }

  /**
   * 查找游戏对象通过名称
   * @param name 游戏对象名称
   * @returns 找到的第一个匹配游戏对象或null
   */
  findGameObjectByName(name: string): GameObject | null {
    const entity = this.findEntityByName(name);
    return entity ? GameObject.fromEntity(entity) : null;
  }

  /**
   * 销毁游戏对象
   * @param gameObject 要销毁的游戏对象
   */
  destroyGameObject(gameObject: GameObject): void {
    this.removeGameObject(gameObject);
    gameObject.destroy();
  }

  /**
   * 获取场景中的所有游戏对象
   * @returns 游戏对象数组
   */
  getAllGameObjects(): GameObject[] {
    return this.getAllEntities().map((entity) => GameObject.fromEntity(entity));
  }

  /**
   * 根据标签查找游戏对象
   * @param tag 标签名称
   * @returns 游戏对象数组
   */
  findGameObjectsByTag(tag: string): GameObject[] {
    return this.getEntitiesByTag(tag).map((entity) => GameObject.fromEntity(entity));
  }

  /**
   * 递归遍历场景中的所有游戏对象（包括子对象）
   * @param callback 回调函数，接收GameObject作为参数
   */
  traverseHierarchy(callback: (gameObject: GameObject) => void): void {
    const traverseRecursive = (gameObject: GameObject) => {
      callback(gameObject);
      for (const child of gameObject.children) {
        traverseRecursive(child);
      }
    };

    const gameObjects = this.getAllGameObjects();
    for (const gameObject of gameObjects) {
      // 只遍历根级游戏对象，递归会处理子对象
      if (gameObject.parent === null) {
        traverseRecursive(gameObject);
      }
    }
  }
}
