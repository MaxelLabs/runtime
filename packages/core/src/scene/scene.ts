import { MaxObject } from '../base/maxObject';
import { EventDispatcher } from '../base/eventDispatcher';
import { Entity } from '../base/entity';
import { ShaderData } from '../shader/ShaderData';
import { Container, ServiceKeys } from '../base/IOC';
import type { Component } from '../base/component';

/**
 * 场景类
 * 包含游戏对象、灯光、相机等元素
 */
export class Scene extends EventDispatcher {
  /** 场景名称 */
  name: string;
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

  /**
   * 创建场景
   * @param name 场景名称
   */
  constructor(name: string) {
    super();
    this.name = name;
    this.id = `scene_${this.name}_${Math.floor(Math.random() * 10000)}`;
    this.container = Container.getInstance();
    
    // 创建根实体
    this.rootEntity = new Entity('root');
    this.addEntity(this.rootEntity);
  }

  /**
   * 添加实体到场景
   * @param entity 实体
   */
  addEntity(entity: Entity): void {
    if (this.entities.has(entity.id)) {
      console.warn(`Entity with id ${entity.id} already exists in this scene`);
      return;
    }
    
    this.entities.set(entity.id, entity);
    entity.scene = this;
    
    // 派发实体添加事件
    this.dispatchEvent('entityAdded', { entity });
  }

  /**
   * 从场景中移除实体
   * @param entity 实体或实体ID
   */
  removeEntity(entity: Entity | string): void {
    const entityId = typeof entity === 'string' ? entity : entity.id;
    const targetEntity = this.entities.get(entityId);
    
    if (!targetEntity) {
      console.warn(`Entity with id ${entityId} does not exist in this scene`);
      return;
    }
    
    // 阻止移除根实体
    if (targetEntity === this.rootEntity) {
      console.error('Cannot remove root entity from scene');
      return;
    }
    
    this.entities.delete(entityId);
    targetEntity.scene = null;
    
    // 派发实体移除事件
    this.dispatchEvent('entityRemoved', { entity: targetEntity });
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
    return entity;
  }

  /**
   * 获取场景中的所有实体
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * 场景加载时调用
   */
  onLoad(): void {
    if (this.isLoaded) {
      return;
    }
    
    this.isLoaded = true;
    
    // 通知所有实体场景加载
    for (const entity of this.entities.values()) {
      entity.onSceneLoad();
    }
    
    // 派发加载事件
    this.dispatchEvent('load');
  }

  /**
   * 场景卸载时调用
   */
  onUnload(): void {
    if (!this.isLoaded) {
      return;
    }
    
    this.isLoaded = false;
    
    // 通知所有实体场景卸载
    for (const entity of this.entities.values()) {
      entity.onSceneUnload();
    }
    
    // 派发卸载事件
    this.dispatchEvent('unload');
  }

  /**
   * 更新场景
   * @param deltaTime 时间增量(秒)
   */
  update(deltaTime: number): void {
    if (!this.isLoaded) {
      return;
    }
    
    // 更新所有实体
    for (const entity of this.entities.values()) {
      if (entity.enabled) {
        entity.update(deltaTime);
      }
    }
    
    // 派发更新事件
    this.dispatchEvent('update', { deltaTime });
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
  get entityCount(): number {
    return this.entities.size;
  }

  /**
   * 销毁场景
   */
  override destroy(): void {
    if (this.destroyed) {
      return;
    }
    
    // 派发销毁前事件
    this.dispatchEvent('beforeDestroy');
    
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
    this.dispatchEvent('destroyed');
    
    super.destroy();
  }

  /**
   * 根据标签获取实体
   * @param tag 实体标签
   * @returns 具有指定标签的所有实体
   */
  getEntitiesByTag (tag: string): Entity[] {
    const result: Entity[] = [];

    for (const entity of this.entities.values()) {
      if (entity.tag === tag) {
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
  findEntitiesWithComponent<T extends Component>(componentType: { new(...args: any[]): T }): Entity[] {
    const result: Entity[] = [];

    for (const entity of this.entities.values()) {
      if (entity.hasComponent(componentType)) {
        result.push(entity);
      }
    }

    return result;
  }
}