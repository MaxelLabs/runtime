import { MaxObject } from './maxObject';
import type { Component } from './component';
import { Transform } from './transform';
import type { Scene } from '../scene/';

/**
 * 实体类，表示场景中的一个对象
 */
export class Entity extends MaxObject {
  /** 实体的标签 */
  private _tag: string = '';
  /** 实体是否激活 */
  active: boolean = true;
  /** 实体的父级 */
  parent: Entity | null = null;
  /** 实体的子级 */
  children: Entity[] = [];
  /** 实体所属的场景 */
  private _scene: Scene | null = null;
  /** 实体上的组件列表 */
  components: Map<string, Component> = new Map();
  /** 实体的变换组件，每个实体都有一个变换组件 */
  transform: Transform;

  /**
   * 创建一个新的实体
   * @param name 实体的名称
   * @param scene 实体所属的场景
   */
  constructor (name: string = 'Entity', scene: Scene | null = null) {
    super();
    this._name = name;
    this._scene = scene;
    this.transform = new Transform(this);
    this.components.set('Transform', this.transform);
  }

  /** 生成唯一ID */
  private static _idCounter: number = 0;

  /** 获取实体标签 */
  get tag (): string {
    return this._tag;
  }

  /** 设置实体标签 */
  set tag (value: string) {
    this._tag = value;
  }

  /** 获取实体所属的场景 */
  get scene (): Scene | null {
    return this._scene;
  }

  /** 设置实体所属的场景 */
  set scene (value: Scene | null) {
    this._scene = value;
  }

  /** 获取实体的父级 */
  get parent (): Entity | null {
    return this.parent;
  }

  /** 设置实体的父级 */
  set parent (value: Entity | null) {
    if (this.parent === value) {return;}

    // 从原父级中移除
    if (this.parent) {
      const index = this.parent.children.indexOf(this);

      if (index !== -1) {
        this.parent.children.splice(index, 1);
      }
    }

    // 设置新父级
    this.parent = value;

    // 添加到新父级的子级列表
    if (value) {
      value.children.push(this);
    }

    // 更新世界变换
    this.transform.updateWorldMatrix();
  }

  /** 获取实体的子级列表 */
  get children (): Entity[] {
    return this.children.slice();
  }

  /** 添加子实体 */
  addChild (child: Entity): void {
    if (child.parent) {
      child.parent.removeChild(child);
    }
    child.parent = this;
    this.children.push(child);
    child.transform.parent = this.transform;
  }

  /** 移除子实体 */
  removeChild (child: Entity): void {
    const index = this.children.indexOf(child);

    if (index !== -1) {
      this.children.splice(index, 1);
      child.parent = null;
      child.transform.parent = null;
    }
  }

  /** 检查是否包含特定组件 */
  hasComponent<T extends Component>(componentType: { new(...args: any[]): T }): boolean {
    return this.components.has(componentType.name);
  }

  /** 添加组件 */
  addComponent<T extends Component>(component: T): T {
    const type = component.constructor.name;

    if (this.components.has(type)) {
      throw new Error(`Component ${type} already exists on entity ${this.name}`);
    }
    this.components.set(type, component);
    component.onAwake();
    if (this.active) {
      component.onEnable();
    }

    return component;
  }

  /** 获取组件 */
  getComponent<T extends Component>(type: new (entity: Entity) => T): T | null {
    return this.components.get(type.name) as T || null;
  }

  /** 获取所有组件 */
  getComponents (): Component[] {
    return Array.from(this.components.values());
  }

  /** 移除组件 */
  removeComponent<T extends Component>(type: new (entity: Entity) => T): void {
    const component = this.getComponent(type);

    if (component) {
      component.onDisable();
      component.destroy();
      this.components.delete(type.name);
    }
  }

  /** 设置激活状态 */
  setActive (active: boolean): void {
    if (this.active === active) {return;}
    this.active = active;

    // 更新组件状态
    for (const component of this.components.values()) {
      if (active) {
        component.onEnable();
      } else {
        component.onDisable();
      }
    }

    // 更新子实体状态
    for (const child of this.children) {
      child.setActive(active);
    }
  }

  /** 销毁实体 */
  destroy (): void {
    if (this.destroyed) {return;}

    // 销毁所有组件
    for (const component of this.components.values()) {
      component.destroy();
    }
    this.components.clear();

    // 销毁所有子实体
    for (const child of this.children) {
      child.destroy();
    }
    this.children = [];

    // 从父实体中移除
    if (this.parent) {
      this.parent.removeChild(this);
    }

    // 从场景中移除
    if (this._scene) {
      this._scene.removeEntity(this);
      this._scene = null;
    }

    super.destroy();
  }
}