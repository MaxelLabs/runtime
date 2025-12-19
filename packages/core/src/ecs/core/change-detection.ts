/**
 * Change Detection 系统
 * 追踪组件变化，避免不必要的计算和 GPU 同步
 *
 * @remarks
 * **设计目标**:
 * - 细粒度追踪：每个组件独立追踪
 * - 低开销：使用位图和版本号
 * - 查询友好：支持 Changed<T> 过滤器
 * - 自动清理：每帧结束自动重置
 *
 * **使用场景**:
 * - Transform 变化检测（避免重复计算世界矩阵）
 * - 渲染数据变化检测（避免重复上传 GPU）
 * - 物理数据变化检测
 *
 * @example
 * ```typescript
 * // 创建变化追踪器
 * const tracker = new ChangeTracker();
 *
 * // 注册组件类型
 * tracker.registerComponent(Position);
 * tracker.registerComponent(Rotation);
 *
 * // 标记变化
 * tracker.markChanged(entity, Position);
 *
 * // 检查变化
 * if (tracker.hasChanged(entity, Position)) {
 *   // 更新世界矩阵
 * }
 *
 * // 帧结束时清理
 * tracker.clearAll();
 * ```
 */

import type { EntityId } from './entity-id';
import type { ComponentClass } from './component-registry';

/**
 * 变化类型
 */
export enum ChangeType {
  /** 组件被添加 */
  Added = 1,
  /** 组件被修改 */
  Modified = 2,
  /** 组件被移除 */
  Removed = 4,
  /** 任何变化 */
  Any = Added | Modified | Removed,
}

/**
 * 组件变化记录
 */
interface ComponentChangeRecord {
  /** 变化的实体集合 */
  changedEntities: Set<EntityId>;
  /** 添加的实体 */
  addedEntities: Set<EntityId>;
  /** 移除的实体 */
  removedEntities: Set<EntityId>;
  /** 全局版本号 */
  version: number;
}

/**
 * 实体变化记录
 */
interface EntityChangeRecord {
  /** 变化的组件类型 */
  changedComponents: Set<ComponentClass>;
  /** 变化类型映射 */
  changeTypes: Map<ComponentClass, ChangeType>;
  /** 版本号 */
  version: number;
}

/**
 * Change Tracker
 * 追踪组件和实体的变化
 */
export class ChangeTracker {
  /** 组件变化记录 */
  private componentChanges: Map<ComponentClass, ComponentChangeRecord> = new Map();

  /** 实体变化记录 */
  private entityChanges: Map<EntityId, EntityChangeRecord> = new Map();

  /** 当前帧号 */
  private currentFrame: number = 0;

  /** 全局版本号 */
  private globalVersion: number = 0;

  /**
   * 注册组件类型
   * @param type 组件类
   */
  registerComponent(type: ComponentClass): void {
    if (!this.componentChanges.has(type)) {
      this.componentChanges.set(type, {
        changedEntities: new Set(),
        addedEntities: new Set(),
        removedEntities: new Set(),
        version: 0,
      });
    }
  }

  /**
   * 标记组件变化
   * @param entity 实体 ID
   * @param type 组件类
   * @param changeType 变化类型
   */
  markChanged(entity: EntityId, type: ComponentClass, changeType: ChangeType = ChangeType.Modified): void {
    // 更新组件变化记录
    let componentRecord = this.componentChanges.get(type);
    if (!componentRecord) {
      this.registerComponent(type);
      componentRecord = this.componentChanges.get(type)!;
    }

    componentRecord.changedEntities.add(entity);
    componentRecord.version = this.globalVersion;

    if (changeType & ChangeType.Added) {
      componentRecord.addedEntities.add(entity);
    }
    if (changeType & ChangeType.Removed) {
      componentRecord.removedEntities.add(entity);
    }

    // 更新实体变化记录
    let entityRecord = this.entityChanges.get(entity);
    if (!entityRecord) {
      entityRecord = {
        changedComponents: new Set(),
        changeTypes: new Map(),
        version: this.globalVersion,
      };
      this.entityChanges.set(entity, entityRecord);
    }

    entityRecord.changedComponents.add(type);
    entityRecord.changeTypes.set(type, changeType);
    entityRecord.version = this.globalVersion;

    this.globalVersion++;
  }

  /**
   * 标记组件添加
   * @param entity 实体 ID
   * @param type 组件类
   */
  markAdded(entity: EntityId, type: ComponentClass): void {
    this.markChanged(entity, type, ChangeType.Added);
  }

  /**
   * 标记组件移除
   * @param entity 实体 ID
   * @param type 组件类
   */
  markRemoved(entity: EntityId, type: ComponentClass): void {
    this.markChanged(entity, type, ChangeType.Removed);
  }

  /**
   * 检查组件是否变化
   * @param entity 实体 ID
   * @param type 组件类
   * @param changeType 要检查的变化类型
   */
  hasChanged(entity: EntityId, type: ComponentClass, changeType: ChangeType = ChangeType.Any): boolean {
    const componentRecord = this.componentChanges.get(type);
    if (!componentRecord) {
      return false;
    }

    if (!componentRecord.changedEntities.has(entity)) {
      return false;
    }

    if (changeType === ChangeType.Any) {
      return true;
    }

    const entityRecord = this.entityChanges.get(entity);
    if (!entityRecord) {
      return false;
    }

    const actualChangeType = entityRecord.changeTypes.get(type) ?? 0;
    return (actualChangeType & changeType) !== 0;
  }

  /**
   * 检查实体是否有任何变化
   * @param entity 实体 ID
   */
  hasAnyChange(entity: EntityId): boolean {
    return this.entityChanges.has(entity);
  }

  /**
   * 获取变化的实体列表
   * @param type 组件类
   * @param changeType 变化类型过滤
   */
  getChangedEntities(type: ComponentClass, changeType: ChangeType = ChangeType.Any): EntityId[] {
    const componentRecord = this.componentChanges.get(type);
    if (!componentRecord) {
      return [];
    }

    if (changeType === ChangeType.Any) {
      return Array.from(componentRecord.changedEntities);
    }

    if (changeType === ChangeType.Added) {
      return Array.from(componentRecord.addedEntities);
    }

    if (changeType === ChangeType.Removed) {
      return Array.from(componentRecord.removedEntities);
    }

    // 混合类型，需要过滤
    const result: EntityId[] = [];
    for (const entity of componentRecord.changedEntities) {
      const entityRecord = this.entityChanges.get(entity);
      if (entityRecord) {
        const actualType = entityRecord.changeTypes.get(type) ?? 0;
        if (actualType & changeType) {
          result.push(entity);
        }
      }
    }
    return result;
  }

  /**
   * 获取实体变化的组件列表
   * @param entity 实体 ID
   */
  getChangedComponents(entity: EntityId): ComponentClass[] {
    const entityRecord = this.entityChanges.get(entity);
    if (!entityRecord) {
      return [];
    }
    return Array.from(entityRecord.changedComponents);
  }

  /**
   * 获取变化数量
   * @param type 组件类（可选）
   */
  getChangeCount(type?: ComponentClass): number {
    if (type) {
      return this.componentChanges.get(type)?.changedEntities.size ?? 0;
    }
    return this.entityChanges.size;
  }

  /**
   * 清除所有变化记录
   * @remarks 应在每帧结束时调用
   */
  clearAll(): void {
    for (const record of this.componentChanges.values()) {
      record.changedEntities.clear();
      record.addedEntities.clear();
      record.removedEntities.clear();
    }
    this.entityChanges.clear();
    this.currentFrame++;
  }

  /**
   * 清除指定组件的变化记录
   * @param type 组件类
   */
  clearComponent(type: ComponentClass): void {
    const record = this.componentChanges.get(type);
    if (record) {
      // 从实体记录中移除
      for (const entity of record.changedEntities) {
        const entityRecord = this.entityChanges.get(entity);
        if (entityRecord) {
          entityRecord.changedComponents.delete(type);
          entityRecord.changeTypes.delete(type);
          if (entityRecord.changedComponents.size === 0) {
            this.entityChanges.delete(entity);
          }
        }
      }

      record.changedEntities.clear();
      record.addedEntities.clear();
      record.removedEntities.clear();
    }
  }

  /**
   * 清除指定实体的变化记录
   * @param entity 实体 ID
   */
  clearEntity(entity: EntityId): void {
    const entityRecord = this.entityChanges.get(entity);
    if (entityRecord) {
      // 从组件记录中移除
      for (const type of entityRecord.changedComponents) {
        const componentRecord = this.componentChanges.get(type);
        if (componentRecord) {
          componentRecord.changedEntities.delete(entity);
          componentRecord.addedEntities.delete(entity);
          componentRecord.removedEntities.delete(entity);
        }
      }

      this.entityChanges.delete(entity);
    }
  }

  /**
   * 获取当前帧号
   */
  getCurrentFrame(): number {
    return this.currentFrame;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    trackedComponents: number;
    changedEntities: number;
    totalChanges: number;
    currentFrame: number;
  } {
    let totalChanges = 0;
    for (const record of this.componentChanges.values()) {
      totalChanges += record.changedEntities.size;
    }

    return {
      trackedComponents: this.componentChanges.size,
      changedEntities: this.entityChanges.size,
      totalChanges,
      currentFrame: this.currentFrame,
    };
  }
}

/**
 * 带版本号的组件包装器
 * 用于自动追踪变化
 */
export class Versioned<T> {
  private _value: T;
  private _version: number = 0;
  private _dirty: boolean = false;

  constructor(value: T) {
    this._value = value;
  }

  /**
   * 获取值（只读）
   */
  get value(): T {
    return this._value;
  }

  /**
   * 设置值（自动标记脏）
   */
  set value(newValue: T) {
    this._value = newValue;
    this._version++;
    this._dirty = true;
  }

  /**
   * 获取版本号
   */
  get version(): number {
    return this._version;
  }

  /**
   * 检查是否脏
   */
  get dirty(): boolean {
    return this._dirty;
  }

  /**
   * 清除脏标记
   */
  clearDirty(): void {
    this._dirty = false;
  }

  /**
   * 修改值（通过回调）
   */
  modify(fn: (value: T) => void): void {
    fn(this._value);
    this._version++;
    this._dirty = true;
  }
}

/**
 * 脏标记组件 Mixin
 * 为组件添加脏标记功能
 */
export interface DirtyFlag {
  /** 是否脏 */
  __dirty: boolean;
  /** 版本号 */
  __version: number;
}

/**
 * 创建带脏标记的组件
 * @param ComponentClass 原始组件类
 */
export function withDirtyFlag<T extends new (...args: any[]) => any>(
  ComponentClass: T
): T & (new (...args: any[]) => DirtyFlag) {
  return class extends ComponentClass implements DirtyFlag {
    __dirty: boolean = true;
    __version: number = 0;

    markDirty(): void {
      this.__dirty = true;
      this.__version++;
    }

    clearDirty(): void {
      this.__dirty = false;
    }
  } as any;
}

/**
 * 全局变化追踪器单例
 */
let globalChangeTracker: ChangeTracker | null = null;

/**
 * 获取全局变化追踪器
 */
export function getGlobalChangeTracker(): ChangeTracker {
  if (!globalChangeTracker) {
    globalChangeTracker = new ChangeTracker();
  }
  return globalChangeTracker;
}

/**
 * 重置全局变化追踪器
 */
export function resetGlobalChangeTracker(): void {
  globalChangeTracker = null;
}
