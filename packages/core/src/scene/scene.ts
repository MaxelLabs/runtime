import { Entity } from '../base/entity';
import type { Component } from '../base/component';

/**
 * 场景类，管理场景中的所有实体
 */
export class Scene {
  /** 场景名称 */
  private _name: string;
  /** 场景中的根实体列表 */
  private _rootEntities: Entity[] = [];
  /** 场景中的所有实体映射表 */
  private _entitiesMap: Map<number, Entity> = new Map();
  /** 是否激活 */
  private _active: boolean = false;
  /** 主摄像机实体 */
  private _mainCamera: Entity | null = null;

  /**
   * 创建一个新的场景
   * @param name 场景名称
   */
  constructor (name: string = 'Scene') {
    this._name = name;
  }

  /** 获取场景名称 */
  get name (): string {
    return this._name;
  }

  /** 设置场景名称 */
  set name (value: string) {
    this._name = value;
  }

  /** 获取场景是否激活 */
  get active (): boolean {
    return this._active;
  }

  /** 获取场景中的所有根实体 */
  get rootEntities (): Entity[] {
    return this._rootEntities.slice();
  }

  /** 获取场景中的所有实体 */
  get entities (): Entity[] {
    return Array.from(this._entitiesMap.values());
  }

  /** 获取主摄像机实体 */
  get mainCamera (): Entity | null {
    return this._mainCamera;
  }

  /** 设置主摄像机实体 */
  set mainCamera (value: Entity | null) {
    this._mainCamera = value;
  }

  /**
   * 创建一个新的实体
   * @param name 实体名称
   * @param parent 父实体，如果不指定则添加为根实体
   * @returns 新创建的实体
   */
  createEntity (name: string = 'Entity', parent: Entity | null = null): Entity {
    const entity = new Entity(name, this);

    // 添加到实体映射表
    this._entitiesMap.set(entity.id, entity);

    // 设置父级
    if (parent) {
      entity.parent = parent;
    } else {
      // 没有父级，添加为根实体
      this._rootEntities.push(entity);
    }

    return entity;
  }

  /**
   * 添加实体到场景
   * @param entity 要添加的实体
   * @param parent 父实体，如果不指定则添加为根实体
   */
  addEntity (entity: Entity, parent: Entity | null = null): void {
    // 如果实体已经在此场景中，则不做任何操作
    if (entity.scene === this && this._entitiesMap.has(entity.id)) {
      return;
    }

    // 如果实体在其他场景中，先从其他场景移除
    if (entity.scene && entity.scene !== this) {
      entity.scene.removeEntity(entity);
    }

    // 设置实体所属的场景
    entity.scene = this;

    // 添加到实体映射表
    this._entitiesMap.set(entity.id, entity);

    // 设置父级
    if (parent) {
      entity.parent = parent;
    } else if (!entity.parent || !this._entitiesMap.has(entity.parent.id)) {
      // 没有父级或父级不在此场景中，添加为根实体
      this._rootEntities.push(entity);
    }
  }

  /**
   * 从场景中移除实体
   * @param entity 要移除的实体
   */
  removeEntity (entity: Entity): void {
    // 如果实体不在此场景中，则不做任何操作
    if (entity.scene !== this || !this._entitiesMap.has(entity.id)) {
      return;
    }

    // 从实体映射表中移除
    this._entitiesMap.delete(entity.id);

    // 如果是根实体，从根实体列表中移除
    const rootIndex = this._rootEntities.indexOf(entity);

    if (rootIndex !== -1) {
      this._rootEntities.splice(rootIndex, 1);
    }

    // 清除实体的场景引用
    entity.scene = null;

    // 如果是主摄像机，清除主摄像机引用
    if (this._mainCamera === entity) {
      this._mainCamera = null;
    }
  }

  /**
   * 根据ID获取实体
   * @param id 实体ID
   * @returns 找到的实体，如果不存在则返回null
   */
  getEntityById (id: number): Entity | null {
    return this._entitiesMap.get(id) || null;
  }

  /**
   * 根据名称获取实体
   * @param name 实体名称
   * @returns 找到的第一个实体，如果不存在则返回null
   */
  getEntityByName (name: string): Entity | null {
    for (const entity of this._entitiesMap.values()) {
      if (entity.name === name) {
        return entity;
      }
    }

    return null;
  }

  /**
   * 根据标签获取实体
   * @param tag 实体标签
   * @returns 具有指定标签的所有实体
   */
  getEntitiesByTag (tag: string): Entity[] {
    const result: Entity[] = [];

    for (const entity of this._entitiesMap.values()) {
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

    for (const entity of this._entitiesMap.values()) {
      if (entity.hasComponent(componentType)) {
        result.push(entity);
      }
    }

    return result;
  }

  /**
   * 激活场景
   */
  activate (): void {
    if (this._active) {return;}

    this._active = true;

    // 激活所有根实体
    for (const entity of this._rootEntities) {
      entity.active = true;
    }
  }

  /**
   * 停用场景
   */
  deactivate (): void {
    if (!this._active) {return;}

    this._active = false;

    // 停用所有根实体
    for (const entity of this._rootEntities) {
      entity.active = false;
    }
  }

  /**
   * 更新场景中的所有组件
   * @param deltaTime 时间增量（秒）
   */
  update (deltaTime: number): void {
    if (!this._active) {return;}

    // 更新所有实体的组件
    for (const entity of this._entitiesMap.values()) {
      if (entity.active) {
        for (const component of entity.getComponents()) {
          if (component.enabled) {
            component.update(deltaTime);
          }
        }
      }
    }
  }

  /**
   * 物理更新，在update之后调用
   * @param deltaTime 时间增量（秒）
   */
  lateUpdate (deltaTime: number): void {
    if (!this._active) {return;}

    // 更新所有实体的组件
    for (const entity of this._entitiesMap.values()) {
      if (entity.active) {
        for (const component of entity.getComponents()) {
          if (component.enabled) {
            component.lateUpdate(deltaTime);
          }
        }
      }
    }
  }

  /**
   * 渲染场景
   */
  render (): void {
    if (!this._active) {return;}

    // 渲染所有实体的组件
    for (const entity of this._entitiesMap.values()) {
      if (entity.active) {
        for (const component of entity.getComponents()) {
          if (component.enabled) {
            component.render();
          }
        }
      }
    }
  }

  /**
   * 销毁场景中的所有实体
   */
  destroy (): void {
    // 复制根实体列表，防止在遍历过程中修改
    const rootEntities = [...this._rootEntities];

    // 销毁所有根实体（这会递归销毁所有子实体）
    for (const entity of rootEntities) {
      entity.destroy();
    }

    // 清空实体映射表和根实体列表
    this._entitiesMap.clear();
    this._rootEntities.length = 0;
    this._mainCamera = null;
    this._active = false;
  }
}