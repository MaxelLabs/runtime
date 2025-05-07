import { MaxObject } from './maxObject';
import type { Entity } from './entity';

/**
 * 组件基类，所有组件均继承自此类
 */
export abstract class Component extends MaxObject {
  /** 组件所属的实体 */
  entity: Entity;

  /** 组件是否启用 */
  enabled: boolean = true;

  /**
   * 创建一个新的组件
   * @param entity 组件所属的实体
   */
  constructor (entity: Entity) {
    super();
    this.entity = entity;
  }

  /**
   * 当组件被创建时调用
   * 子类可以重写此方法以执行初始化逻辑
   */
  onAwake (): void {}

  /**
   * 当组件首次激活时调用
   * 子类可以重写此方法以执行激活逻辑
   */
  onEnable (): void {}

  /**
   * 当组件被禁用时调用
   * 子类可以重写此方法以执行禁用逻辑
   */
  onDisable (): void {}

  /**
   * 每帧更新时调用
   * 子类可以重写此方法以执行更新逻辑
   * @param deltaTime 上一帧到当前帧的时间间隔，单位为秒
   */
  update (deltaTime: number): void {}

  /**
   * 物理更新时调用，通常在update之后
   * 子类可以重写此方法以执行物理相关的更新逻辑
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
   */
  override destroy (): void {
    if (this.destroyed) {return;}
    this.enabled = false;
    this.onDisable();
    super.destroy();
  }
}