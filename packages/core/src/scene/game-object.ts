import { Entity } from '../base/entity';
import type { Component } from '../base/component';
import type { Transform } from '../base/transform';
import type { Scene } from './scene';

/**
 * 游戏对象类型构造函数
 */
export type ComponentConstructor<T extends Component = Component> = new (entity: Entity) => T;

/**
 * 游戏对象类
 * GameObject是对Entity的封装和扩展，提供更高级的游戏对象功能
 *
 * 主要特性：
 * 1. 基于Entity的所有功能
 * 2. 提供更符合游戏开发习惯的API
 * 3. 支持组件的泛型类型安全
 * 4. 提供便捷的组件管理方法
 */
export class GameObject {
  /** 内部Entity实例 */
  private readonly entity: Entity;

  /**
   * 创建游戏对象
   * @param name 游戏对象名称
   * @param scene 所属场景
   */
  constructor(name?: string, scene?: Scene) {
    this.entity = new Entity(name || 'GameObject', scene || null);
  }

  /**
   * 从已存在的Entity创建GameObject
   * @param entity Entity实例
   */
  static fromEntity(entity: Entity): GameObject {
    const gameObject = Object.create(GameObject.prototype);
    gameObject.entity = entity;
    return gameObject;
  }

  /**
   * 获取内部Entity实例
   */
  getEntity(): Entity {
    return this.entity;
  }

  /**
   * 获取游戏对象名称
   */
  get name(): string {
    return this.entity.name;
  }

  /**
   * 设置游戏对象名称
   */
  set name(value: string) {
    this.entity.name = value;
  }

  /**
   * 获取游戏对象标签
   */
  get tag(): string {
    return this.entity.tag;
  }

  /**
   * 设置游戏对象标签
   */
  set tag(value: string) {
    this.entity.tag = value;
  }

  /**
   * 获取Transform组件
   */
  get transform(): Transform {
    return this.entity.transform;
  }

  /**
   * 获取游戏对象是否激活
   */
  get active(): boolean {
    return this.entity.getActive();
  }

  /**
   * 设置游戏对象激活状态
   */
  set active(value: boolean) {
    this.entity.setActive(value);
  }

  /**
   * 获取父游戏对象
   */
  get parent(): GameObject | null {
    const parentEntity = this.entity.getParent();
    return parentEntity ? GameObject.fromEntity(parentEntity) : null;
  }

  /**
   * 设置父游戏对象
   */
  set parent(value: GameObject | null) {
    this.entity.setParent(value ? value.entity : null);
  }

  /**
   * 获取子游戏对象列表
   */
  get children(): readonly GameObject[] {
    return this.entity.getChildren().map((child) => GameObject.fromEntity(child));
  }

  /**
   * 获取所属场景
   */
  get scene(): Scene | null {
    return this.entity.getScene();
  }

  /**
   * 添加组件
   * @param componentClass 组件类构造函数
   * @returns 添加的组件实例
   */
  addComponent<T extends Component>(componentClass: ComponentConstructor<T>): T {
    const component = this.entity.createComponent(componentClass);
    return component;
  }

  /**
   * 获取组件
   * @param componentClass 组件类构造函数
   * @returns 组件实例或null
   */
  getComponent<T extends Component>(componentClass: ComponentConstructor<T>): T | null {
    return this.entity.getComponent(componentClass);
  }

  /**
   * 获取所有指定类型的组件
   * @param componentClass 组件类构造函数
   * @returns 组件实例数组
   */
  getComponents<T extends Component>(componentClass: ComponentConstructor<T>): T[] {
    return this.entity.getComponents().filter((component) => component instanceof componentClass) as T[];
  }

  /**
   * 移除组件
   * @param componentClass 组件类构造函数
   * @returns 当前游戏对象，用于链式调用
   */
  removeComponent<T extends Component>(componentClass: ComponentConstructor<T>): this {
    this.entity.removeComponent(componentClass);
    return this;
  }

  /**
   * 检查是否拥有指定组件
   * @param componentClass 组件类构造函数
   * @returns 是否拥有该组件
   */
  hasComponent<T extends Component>(componentClass: ComponentConstructor<T>): boolean {
    return this.entity.hasComponent(componentClass);
  }

  /**
   * 查找子游戏对象
   * @param name 子对象名称
   * @param recursive 是否递归查找
   * @returns 找到的子游戏对象或null
   */
  findChild(name: string, recursive: boolean = false): GameObject | null {
    const childEntity = this.entity.findChild(name, recursive);
    return childEntity ? GameObject.fromEntity(childEntity) : null;
  }

  /**
   * 查找拥有指定组件的子游戏对象
   * @param componentClass 组件类构造函数
   * @param recursive 是否递归查找
   * @returns 子游戏对象数组
   */
  findChildrenWithComponent<T extends Component>(
    componentClass: ComponentConstructor<T>,
    recursive: boolean = false
  ): GameObject[] {
    const childEntities = this.entity.findChildrenWithComponent(componentClass, recursive);
    return childEntities.map((entity) => GameObject.fromEntity(entity));
  }

  /**
   * 添加子游戏对象
   * @param child 子游戏对象
   * @returns 当前游戏对象，用于链式调用
   */
  addChild(child: GameObject): this {
    this.entity.addChild(child.entity);
    return this;
  }

  /**
   * 移除子游戏对象
   * @param child 子游戏对象
   * @returns 当前游戏对象，用于链式调用
   */
  removeChild(child: GameObject): this {
    this.entity.removeChild(child.entity);
    return this;
  }

  /**
   * 设置游戏对象激活状态
   * @param active 是否激活
   * @returns 当前游戏对象，用于链式调用
   */
  setActive(active: boolean): this {
    this.entity.setActive(active);
    return this;
  }

  /**
   * 激活游戏对象
   * @returns 当前游戏对象，用于链式调用
   */
  activate(): this {
    return this.setActive(true);
  }

  /**
   * 禁用游戏对象
   * @returns 当前游戏对象，用于链式调用
   */
  deactivate(): this {
    return this.setActive(false);
  }

  /**
   * 是否已启用
   */
  isEnabled(): boolean {
    return this.entity.getActive();
  }

  /**
   * 销毁游戏对象
   */
  destroy(): void {
    this.entity.destroy();
  }

  /**
   * 游戏对象是否已被销毁
   */
  isDestroyed(): boolean {
    return this.entity.isDestroyed();
  }

  /**
   * 克隆游戏对象
   * @param parent 新对象的父级
   * @returns 克隆的游戏对象
   */
  clone(parent?: GameObject): GameObject {
    // TODO: 实现深度克隆逻辑
    const cloned = new GameObject(this.name + '_Clone', this.scene || undefined);
    if (parent) {
      cloned.parent = parent;
    }
    return cloned;
  }

  /**
   * 获取游戏对象的层级路径
   * @returns 层级路径字符串
   */
  getHierarchyPath(): string {
    const path: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let current: GameObject | null = this;

    while (current) {
      path.unshift(current.name);
      current = current.parent;
    }

    return path.join('/');
  }

  /**
   * 在组件层次结构中查找第一个指定类型的组件
   * @param componentClass 组件类构造函数
   * @param includeInactive 是否包括非激活的游戏对象
   * @returns 找到的组件或null
   */
  getComponentInChildren<T extends Component>(
    componentClass: ComponentConstructor<T>,
    includeInactive: boolean = false
  ): T | null {
    // 先检查自己
    const component = this.getComponent(componentClass);
    if (component) {
      return component;
    }

    // 递归检查子对象
    for (const child of this.children) {
      if (!includeInactive && !child.active) {
        continue;
      }

      const childComponent = child.getComponentInChildren(componentClass, includeInactive);
      if (childComponent) {
        return childComponent;
      }
    }

    return null;
  }

  /**
   * 在父级层次结构中查找第一个指定类型的组件
   * @param componentClass 组件类构造函数
   * @returns 找到的组件或null
   */
  getComponentInParent<T extends Component>(componentClass: ComponentConstructor<T>): T | null {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let current: GameObject | null = this;

    while (current) {
      const component = current.getComponent(componentClass);
      if (component) {
        return component;
      }
      current = current.parent;
    }

    return null;
  }

  /**
   * 获取所有子对象中指定类型的组件
   * @param componentClass 组件类构造函数
   * @param includeInactive 是否包括非激活的游戏对象
   * @returns 组件数组
   */
  getComponentsInChildren<T extends Component>(
    componentClass: ComponentConstructor<T>,
    includeInactive: boolean = false
  ): T[] {
    const components: T[] = [];

    // 添加自己的组件
    const selfComponents = this.getComponents(componentClass);
    components.push(...selfComponents);

    // 递归添加子对象的组件
    for (const child of this.children) {
      if (!includeInactive && !child.active) {
        continue;
      }

      const childComponents = child.getComponentsInChildren(componentClass, includeInactive);
      components.push(...childComponents);
    }

    return components;
  }

  /**
   * 向上广播消息到所有父级
   * @param message 消息名称
   * @param data 消息数据
   */
  sendMessageUpwards(message: string, data?: any): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let current: GameObject | null = this;

    while (current) {
      // TODO: 实现消息系统
      // current.sendMessage(message, data);
      current = current.parent;
    }
  }

  /**
   * 向下广播消息到所有子级
   * @param message 消息名称
   * @param data 消息数据
   */
  broadcastMessage(message: string, data?: any): void {
    // TODO: 实现消息系统
    // this.sendMessage(message, data);

    for (const child of this.children) {
      child.broadcastMessage(message, data);
    }
  }
}
