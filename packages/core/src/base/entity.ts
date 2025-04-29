import { Component } from '../base/component';
import { Scene } from '../scene/scene';
import { Transform } from '../base/transform';
import { Vector3 } from '@maxellabs/math';

/**
 * 实体类，表示场景中的一个对象
 */
export class Entity {
  /** 实体的唯一标识符 */
  private _id: number;
  /** 实体的名称 */
  private _name: string;
  /** 实体的标签 */
  private _tag: string = '';
  /** 实体是否激活 */
  private _active: boolean = true;
  /** 实体的父级 */
  private _parent: Entity | null = null;
  /** 实体的子级 */
  private _children: Entity[] = [];
  /** 实体所属的场景 */
  private _scene: Scene | null = null;
  /** 实体上的组件列表 */
  private _components: Map<string, Component> = new Map();
  /** 实体的变换组件，每个实体都有一个变换组件 */
  private _transform: Transform;

  /**
   * 创建一个新的实体
   * @param name 实体的名称
   * @param scene 实体所属的场景
   */
  constructor(name: string = 'Entity', scene: Scene | null = null) {
    this._id = Entity._generateId();
    this._name = name;
    this._scene = scene;
    this._transform = new Transform(this);
    this._components.set('Transform', this._transform);
  }

  /** 生成唯一ID */
  private static _idCounter: number = 0;
  private static _generateId(): number {
    return Entity._idCounter++;
  }

  /** 获取实体ID */
  get id(): number {
    return this._id;
  }

  /** 获取实体名称 */
  get name(): string {
    return this._name;
  }

  /** 设置实体名称 */
  set name(value: string) {
    this._name = value;
  }

  /** 获取实体标签 */
  get tag(): string {
    return this._tag;
  }

  /** 设置实体标签 */
  set tag(value: string) {
    this._tag = value;
  }

  /** 获取实体是否激活 */
  get active(): boolean {
    return this._active;
  }

  /** 设置实体是否激活 */
  set active(value: boolean) {
    if (this._active !== value) {
      this._active = value;
      // 通知组件实体激活状态改变
      this._components.forEach(component => {
        if (component.enabled) {
          value ? component.onEnable() : component.onDisable();
        }
      });
    }
  }

  /** 获取实体的变换组件 */
  get transform(): Transform {
    return this._transform;
  }

  /** 获取实体所属的场景 */
  get scene(): Scene | null {
    return this._scene;
  }

  /** 设置实体所属的场景 */
  set scene(value: Scene | null) {
    this._scene = value;
  }

  /** 获取实体的父级 */
  get parent(): Entity | null {
    return this._parent;
  }

  /** 设置实体的父级 */
  set parent(value: Entity | null) {
    if (this._parent === value) return;

    // 从原父级中移除
    if (this._parent) {
      const index = this._parent._children.indexOf(this);
      if (index !== -1) {
        this._parent._children.splice(index, 1);
      }
    }

    // 设置新父级
    this._parent = value;

    // 添加到新父级的子级列表
    if (value) {
      value._children.push(this);
    }

    // 更新世界变换
    this._transform.updateWorldMatrix();
  }

  /** 获取实体的子级列表 */
  get children(): Entity[] {
    return this._children.slice();
  }

  /** 添加子实体 */
  addChild(entity: Entity): void {
    if (entity._parent !== this) {
      entity.parent = this;
    }
  }

  /** 移除子实体 */
  removeChild(entity: Entity): void {
    const index = this._children.indexOf(entity);
    if (index !== -1) {
      this._children.splice(index, 1);
      entity._parent = null;
    }
  }

  /** 检查是否包含特定组件 */
  hasComponent<T extends Component>(componentType: { new(...args: any[]): T }): boolean {
    return this._components.has(componentType.name);
  }

  /** 添加组件 */
  addComponent<T extends Component>(componentType: { new(entity: Entity, ...args: any[]): T }, ...args: any[]): T {
    if (this.hasComponent(componentType)) {
      console.warn(`Entity already has component: ${componentType.name}`);
      return this.getComponent(componentType) as T;
    }

    const component = new componentType(this, ...args);
    this._components.set(componentType.name, component);
    
    if (this._active && component.enabled) {
      component.onEnable();
    }
    
    return component;
  }

  /** 获取组件 */
  getComponent<T extends Component>(componentType: { new(...args: any[]): T }): T | null {
    const component = this._components.get(componentType.name) as T;
    return component || null;
  }

  /** 获取所有组件 */
  getComponents(): Component[] {
    return Array.from(this._components.values());
  }

  /** 移除组件 */
  removeComponent<T extends Component>(componentType: { new(...args: any[]): T }): boolean {
    if (componentType.name === 'Transform') {
      console.warn('Cannot remove Transform component');
      return false;
    }

    const component = this._components.get(componentType.name);
    if (component) {
      if (component.enabled && this._active) {
        component.onDisable();
      }
      component.onDestroy();
      this._components.delete(componentType.name);
      return true;
    }
    return false;
  }

  /** 销毁实体 */
  destroy(): void {
    // 销毁子实体
    [...this._children].forEach(child => child.destroy());

    // 从父级移除
    if (this._parent) {
      this._parent.removeChild(this);
    }

    // 销毁所有组件
    this._components.forEach(component => {
      if (component.enabled && this._active) {
        component.onDisable();
      }
      component.onDestroy();
    });
    this._components.clear();

    // 从场景中移除
    if (this._scene) {
      this._scene.removeEntity(this);
      this._scene = null;
    }
  }
} 