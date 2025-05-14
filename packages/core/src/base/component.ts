import type { Entity } from './entity';
import { ReferResource } from './refer-resource';

/**
 * 组件生命周期状态
 */
export enum ComponentLifecycleState {
  /** 已创建但未初始化 */
  CREATED = 0,
  /** 已初始化 */
  INITIALIZED = 1,
  /** 已启用 */
  ENABLED = 2,
  /** 已禁用 */
  DISABLED = 3,
  /** 已销毁 */
  DESTROYED = 4
}

/**
 * 组件基类，所有组件均继承自此类
 *
 * 组件生命周期:
 * 1. 构造函数 - 基本初始化
 * 2. onAwake - 组件被添加到实体时调用，进行初始化
 * 3. onEnable - 组件被启用时调用
 * 4. update - 每帧调用
 * 5. lateUpdate - 在所有update后调用
 * 6. render - 渲染时调用
 * 7. onDisable - 组件被禁用时调用
 * 8. onDestroy - 组件被销毁时调用
 */
export abstract class Component extends ReferResource {
  /** 组件所属的实体 */
  readonly entity: Entity;

  /** 组件是否启用 */
  private enabled: boolean = true;

  /** 组件的生命周期状态 */
  private lifecycleState: ComponentLifecycleState = ComponentLifecycleState.CREATED;

  /**
   * 创建一个新的组件
   * @param entity 组件所属的实体
   */
  constructor (entity: Entity) {
    super();
    this.entity = entity;
    this.name = this.constructor.name;
  }

  /**
   * 获取组件是否启用
   */
  getEnabled (): boolean {
    return this.enabled && !this.isDestroyed();
  }

  /**
   * 设置组件启用状态
   */
  setEnabled (value: boolean): void {
    if (this.enabled === value || this.isDestroyed()) {
      return;
    }

    this.enabled = value;

    if (value) {
      if (this.lifecycleState === ComponentLifecycleState.DISABLED) {
        this.lifecycleState = ComponentLifecycleState.ENABLED;
        this.onEnable();
      }
    } else if (this.lifecycleState === ComponentLifecycleState.ENABLED) {
      this.lifecycleState = ComponentLifecycleState.DISABLED;
      this.onDisable();
    }
  }

  /**
   * 获取当前组件的生命周期状态
   */
  getLifecycleState (): ComponentLifecycleState {
    return this.lifecycleState;
  }

  /**
   * 当组件被创建时调用（内部使用）
   * @internal
   */
  _awake (): void {
    if (this.lifecycleState !== ComponentLifecycleState.CREATED) {
      return;
    }

    this.lifecycleState = ComponentLifecycleState.INITIALIZED;
    this.onAwake();

    if (this.enabled) {
      this.enable();
    }
  }

  /**
   * 内部启用方法
   * @internal
   */
  private enable (): void {
    if (this.lifecycleState !== ComponentLifecycleState.INITIALIZED &&
        this.lifecycleState !== ComponentLifecycleState.DISABLED) {
      return;
    }

    this.lifecycleState = ComponentLifecycleState.ENABLED;
    this.onEnable();
  }

  /**
   * 内部禁用方法
   * @internal
   */
  private disable (): void {
    if (this.lifecycleState !== ComponentLifecycleState.ENABLED) {
      return;
    }

    this.lifecycleState = ComponentLifecycleState.DISABLED;
    this.onDisable();
  }

  /**
   * 当组件被创建并添加到实体上时调用
   * 子类可以重写此方法以执行初始化逻辑
   */
  protected onAwake (): void {}

  /**
   * 当组件首次激活或重新启用时调用
   * 子类可以重写此方法以执行激活逻辑
   */
  protected onEnable (): void {}

  /**
   * 当组件被禁用时调用
   * 子类可以重写此方法以执行禁用逻辑
   */
  protected onDisable (): void {}

  /**
   * 每帧更新时调用
   * 子类可以重写此方法以执行更新逻辑
   * @param deltaTime 上一帧到当前帧的时间间隔，单位为秒
   */
  update (deltaTime: number): void {}

  /**
   * 物理更新时调用，通常在所有对象的update之后
   * 子类可以重写此方法以执行依赖于其他对象更新后的逻辑
   * @param deltaTime 上一帧到当前帧的时间间隔，单位为秒
   */
  lateUpdate (deltaTime: number): void {}

  /**
   * 渲染前调用
   * 子类可以重写此方法以执行渲染前的准备工作
   */
  render (): void {}

  /**
   * 销毁组件
   * 不要直接调用此方法，通常应通过实体的removeComponent方法移除组件
   */
  override destroy (): void {
    if (this.isDestroyed()) {
      return;
    }

    if (this.lifecycleState === ComponentLifecycleState.ENABLED) {
      this.disable();
    }

    this.lifecycleState = ComponentLifecycleState.DESTROYED;
    this.onDestroy();
    super.destroy();
  }

  /**
   * 当组件被销毁时调用
   * 子类可以重写此方法以执行清理逻辑
   * @protected
   */
  override onDestroy (): void {}
}