import type { Component } from './component';
import { ComponentLifecycleState } from './component';
import { Transform } from './transform';
import type { Scene } from '../scene/';
import { ReferResource } from './refer-resource';

/**
 * 实体类，表示场景中的一个对象
 *
 * 特性:
 * 1. 每个实体可以包含多个组件
 * 2. 每个实体默认包含一个Transform组件
 * 3. 实体可以组织成层级结构
 * 4. 实体可以被激活/禁用，影响其所有组件和子实体
 */
export class Entity extends ReferResource {
  /** 实体是否激活 */
  private active: boolean = true;

  /** 实体的父级 */
  private parent: Entity | null = null;

  /** 实体的子级列表 */
  private children: Entity[] = [];

  /** 实体所属的场景 */
  private scene: Scene | null = null;

  /** 实体上的组件映射 */
  private components: Map<string, Component> = new Map();

  /** 实体的变换组件，每个实体都有一个变换组件 */
  readonly transform: Transform;

  /** 实体的元数据 */
  private metadata: Map<string, any> = new Map();

  /**
   * 创建一个新的实体
   * @param name 实体的名称
   * @param scene 实体所属的场景
   */
  constructor(name: string = 'Entity', scene: Scene | null = null) {
    super();
    this.name = name;
    this.scene = scene;

    // 创建并初始化Transform组件
    this.transform = new Transform(this);
    this.components.set(Transform.name, this.transform);
    this.transform.awake();
  }

  /**
   * 获取实体激活状态
   * 实体只有在自身和所有父级都激活时才真正激活
   */
  getActive(): boolean {
    if (!this.active) {
      return false;
    }

    // 检查父级链上是否所有实体都激活
    let currentParent = this.parent;

    while (currentParent) {
      if (!currentParent.active) {
        return false;
      }
      currentParent = currentParent.parent;
    }

    return true;
  }

  /**
   * 设置实体的激活状态
   */
  setActive(value: boolean): void {
    if (this.active === value) {
      return;
    }

    this.active = value;
    this.updateActiveState();
  }

  /**
   * 获取实体的父级
   */
  getParent(): Entity | null {
    return this.parent;
  }

  /**
   * 获取实体的子级列表（只读）
   */
  getChildren(): ReadonlyArray<Entity> {
    return this.children;
  }

  /**
   * 获取实体所属的场景
   */
  getScene(): Scene | null {
    return this.scene;
  }

  /**
   * 设置实体所属的场景
   */
  setScene(scene: Scene | null): void {
    if (this.scene === scene) {
      return;
    }

    // 先从旧场景中移除
    if (this.scene && scene === null) {
      this.scene.removeEntity(this);
    }

    this.scene = scene;

    // 递归设置所有子实体的场景
    for (const child of this.children) {
      child.setScene(scene);
    }
  }

  /**
   * 更新实体的激活状态
   * @private
   */
  private updateActiveState(): void {
    const isReallyActive = this.getActive();

    // 更新所有组件状态
    for (const component of this.components.values()) {
      if (isReallyActive && component.getEnabled()) {
        if (component.getLifecycleState() === ComponentLifecycleState.DISABLED) {
          component.setEnabled(true);
        }
      } else if (component.getLifecycleState() === ComponentLifecycleState.ENABLED) {
        component.setEnabled(false);
      }
    }

    // 递归更新所有子实体状态
    for (const child of this.children) {
      child.updateActiveState();
    }
  }

  /**
   * 设置实体的父级
   * @param parent 新的父级实体
   * @returns 此实体，用于链式调用
   */
  setParent(parent: Entity | null): this {
    if (this.parent === parent) {
      return this;
    }

    // 防止循环引用
    if (parent) {
      let p = parent;

      while (p) {
        if (p === this) {
          console.error(`[Entity] 检测到循环引用: 无法将实体 ${parent.name} 设置为 ${this.name} 的父级`);

          return this;
        }
        p = p.parent as Entity;
      }
    }

    // 从原父级中移除
    if (this.parent) {
      const index = this.parent.children.indexOf(this);

      if (index !== -1) {
        this.parent.children.splice(index, 1);
      }
    }

    // 设置新父级
    this.parent = parent;

    // 设置变换父级
    this.transform.setParent(parent ? parent.transform : null);

    // 添加到新父级的子级列表
    if (parent) {
      parent.children.push(this);

      // 继承场景
      if (parent.scene !== this.scene) {
        this.setScene(parent.scene);
      }
    }

    // 更新激活状态
    this.updateActiveState();

    return this;
  }

  /**
   * 添加子实体
   * @param child 要添加的子实体
   * @returns 此实体，用于链式调用
   */
  addChild(child: Entity): this {
    if (child === this) {
      console.error('[Entity] 无法将实体添加为自身的子级');

      return this;
    }

    child.setParent(this);

    return this;
  }

  /**
   * 移除子实体
   * @param child 要移除的子实体
   * @returns 此实体，用于链式调用
   */
  removeChild(child: Entity): this {
    if (!child || child.parent !== this) {
      return this;
    }

    child.setParent(null);

    return this;
  }

  /**
   * 查找子实体
   * @param name 子实体名称
   * @param recursive 是否递归查找
   * @returns 找到的实体，未找到则返回null
   */
  findChild(name: string, recursive: boolean = false): Entity | null {
    // 直接子级中查找
    for (const child of this.children) {
      if (child.name === name) {
        return child;
      }
    }

    // 如果启用递归，继续在子级的子级中查找
    if (recursive) {
      for (const child of this.children) {
        const found = child.findChild(name, true);

        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * 查找具有特定组件的子实体
   * @param componentType 组件类型
   * @param recursive 是否递归查找
   * @returns 具有该组件的子实体列表
   */
  findChildrenWithComponent<T extends Component>(
    componentType: new (...args: any[]) => T,
    recursive: boolean = false
  ): Entity[] {
    const result: Entity[] = [];

    for (const child of this.children) {
      if (child.hasComponent(componentType)) {
        result.push(child);
      }

      if (recursive) {
        const childResults = child.findChildrenWithComponent(componentType, true);

        result.push(...childResults);
      }
    }

    return result;
  }

  /**
   * 检查实体是否具有指定组件
   * @param componentType 组件类型
   * @returns 是否具有该组件
   */
  hasComponent<T extends Component>(componentType: new (...args: any[]) => T): boolean {
    return this.components.has(componentType.name);
  }

  /**
   * 添加组件到实体
   * @param component 要添加的组件
   * @returns 添加的组件
   */
  addComponent<T extends Component>(component: T): T {
    if (this.components.has(component.constructor.name)) {
      console.warn(`[Entity] 实体 ${this.name} 已经包含组件 ${component.constructor.name}，忽略添加请求`);

      return component;
    }

    this.components.set(component.constructor.name, component);
    component.awake();

    return component;
  }

  /**
   * 创建并添加组件
   * @param componentType 组件类型
   * @returns 创建的组件
   */
  createComponent<T extends Component>(componentType: new (entity: Entity) => T): T {
    if (this.components.has(componentType.name)) {
      console.warn(`[Entity] 实体 ${this.name} 已经包含组件 ${componentType.name}，移除旧组件并创建新组件`);
      this.removeComponent(componentType);
    }

    const component = new componentType(this);

    return this.addComponent(component);
  }

  /**
   * 获取组件
   * @param type 组件类型
   * @returns 找到的组件，未找到则返回null
   */
  getComponent<T extends Component>(type: new (entity: Entity) => T): T | null {
    return (this.components.get(type.name) as T) || null;
  }

  /**
   * 获取实体上的所有组件
   * @returns 组件数组
   */
  getComponents(): Component[] {
    return Array.from(this.components.values());
  }

  /**
   * 移除组件
   * @param type 要移除的组件类型
   * @returns 此实体，用于链式调用
   */
  removeComponent<T extends Component>(type: new (entity: Entity) => T): this {
    if (type instanceof Transform) {
      console.error('[Entity] 无法移除Transform组件');

      return this;
    }

    const component = this.components.get(type.name);

    if (component) {
      this.components.delete(type.name);
      component.destroy();
    }

    return this;
  }

  /**
   * 设置实体的激活状态
   * @param active 是否激活
   * @returns 此实体，用于链式调用
   */
  activate(active: boolean): this {
    this.setActive(active);

    return this;
  }

  /**
   * 销毁实体及其所有组件
   */
  override destroy(): void {
    if (this.isDestroyed()) {
      return;
    }

    // 移除所有子实体
    const childrenToRemove = [...this.children];

    for (const child of childrenToRemove) {
      child.setParent(null);
      child.destroy();
    }

    // 断开与父级的连接
    if (this.parent) {
      this.setParent(null);
    }

    // 从场景中移除
    if (this.scene) {
      this.scene.removeEntity(this);
      this.scene = null;
    }

    // 销毁所有组件（先销毁非Transform组件）
    const componentsToDestroy = Array.from(this.components.values()).filter((comp) => !(comp instanceof Transform));

    for (const component of componentsToDestroy) {
      component.destroy();
    }

    // 最后销毁Transform组件
    if (this.transform) {
      this.transform.destroy();
    }

    this.components.clear();
    super.destroy();
  }

  /**
   * 获取实体标签
   */
  getTag(): string {
    return this.tag;
  }

  /**
   * 设置实体启用状态
   * @param enabled 是否启用
   */
  setEnabled(enabled: boolean): void {
    this.setActive(enabled);
  }

  /**
   * 检查实体是否启用
   */
  isEnabled(): boolean {
    return this.getActive();
  }

  /**
   * 更新实体及其组件
   * @param deltaTime 时间增量（秒）
   */
  update(deltaTime: number): void {
    if (!this.getActive()) {
      return;
    }

    // 更新所有启用的组件
    for (const component of this.components.values()) {
      if (component.getEnabled() && component.getLifecycleState() === ComponentLifecycleState.ENABLED) {
        component.update(deltaTime);
      }
    }

    // 递归更新所有子实体
    for (const child of this.children) {
      if (child.getActive()) {
        child.update(deltaTime);
      }
    }
  }

  /**
   * 场景加载时调用
   */
  onSceneLoad(): void {
    // 通知所有组件场景已加载
    for (const component of this.components.values()) {
      if (component.getEnabled()) {
        // TODO: 添加组件的场景加载回调
        // component.onSceneLoad?.();
      }
    }

    // 递归通知所有子实体
    for (const child of this.children) {
      child.onSceneLoad();
    }
  }

  /**
   * 场景卸载时调用
   */
  onSceneUnload(): void {
    // 通知所有组件场景将卸载
    for (const component of this.components.values()) {
      if (component.getEnabled()) {
        // TODO: 添加组件的场景卸载回调
        // component.onSceneUnload?.();
      }
    }

    // 递归通知所有子实体
    for (const child of this.children) {
      child.onSceneUnload();
    }
  }

  /**
   * 获取元数据
   */
  getMetadata(key: string): any {
    return this.metadata.get(key);
  }

  /**
   * 设置元数据
   */
  setMetadata(key: string, value: any): void {
    this.metadata.set(key, value);
  }

  /**
   * 移除元数据
   */
  removeMetadata(key: string): boolean {
    return this.metadata.delete(key);
  }

  /**
   * 清空所有元数据
   */
  clearMetadata(): void {
    this.metadata.clear();
  }

  /**
   * 获取所有元数据
   */
  getAllMetadata(): Map<string, any> {
    return new Map(this.metadata);
  }
}
