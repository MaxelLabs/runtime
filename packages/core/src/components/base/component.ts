/**
 * Component 基类
 * 所有 ECS 组件的基类，继承自 ReferResource 以支持引用计数和资源管理
 *
 * @packageDocumentation
 */

import { ReferResource } from '../../ecs/base/refer-resource';

/**
 * 组件数据接口
 * 定义组件可以从规范数据创建的能力
 */
export interface IComponentData<T = any> {
  /**
   * 从规范数据创建组件实例
   * @param data 规范数据
   * @returns 组件实例
   */
  fromData(data: T): Component;
}

/**
 * Component 基类
 * 所有 ECS 组件的基类，提供以下功能：
 * - 引用计数管理（继承自 ReferResource）
 * - 组件启用/禁用状态
 * - 组件脏标记（用于优化更新）
 * - 组件所属实体引用
 *
 * @example
 * ```typescript
 * class MyComponent extends Component {
 *   value: number = 0;
 *
 *   static fromData(data: { value: number }): MyComponent {
 *     const component = new MyComponent();
 *     component.value = data.value;
 *     return component;
 *   }
 * }
 * ```
 */
export class Component extends ReferResource {
  /** 组件是否启用 */
  private _enabled: boolean = true;

  /** 组件是否脏（需要更新） */
  private _dirty: boolean = false;

  /** 组件所属实体 ID */
  private _entityId: number | null = null;

  /**
   * 获取组件是否启用
   */
  get enabled(): boolean {
    return this._enabled;
  }

  /**
   * 设置组件是否启用
   */
  set enabled(value: boolean) {
    if (this._enabled !== value) {
      this._enabled = value;
      this.markDirty();
    }
  }

  /**
   * 获取组件是否脏
   */
  get dirty(): boolean {
    return this._dirty;
  }

  /**
   * 获取组件所属实体 ID
   */
  get entityId(): number | null {
    return this._entityId;
  }

  /**
   * 设置组件所属实体 ID
   * @internal 仅供 ECS 系统内部使用
   */
  setEntityId(entityId: number | null): void {
    this._entityId = entityId;
  }

  /**
   * 标记组件为脏
   * 当组件数据发生变化时调用，通知系统需要更新
   */
  markDirty(): void {
    this._dirty = true;
  }

  /**
   * 清除脏标记
   * 当系统处理完组件更新后调用
   */
  clearDirty(): void {
    this._dirty = false;
  }

  /**
   * 组件被添加到实体时调用
   * 子类可以重写此方法执行初始化逻辑
   */
  onAttach(): void {
    // 子类实现
  }

  /**
   * 组件从实体移除时调用
   * 子类可以重写此方法执行清理逻辑
   */
  onDetach(): void {
    // 子类实现
  }

  /**
   * 克隆组件
   * 子类应重写此方法以实现深拷贝
   * @returns 克隆的组件实例
   */
  clone(): Component {
    const cloned = new (this.constructor as new () => Component)();
    cloned._enabled = this._enabled;
    return cloned;
  }

  /**
   * 释放组件资源
   */
  protected override onResourceDispose(): void {
    this._entityId = null;
    this._dirty = false;
    super.onResourceDispose();
  }
}
