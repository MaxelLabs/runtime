/**
 * 优化的 Archetype
 * 针对 JavaScript 环境优化，数值组件使用 TypedArray 存储
 *
 * @remarks
 * **与原 Archetype 的区别**:
 * - 原版：所有组件都用 `any[]` 存储（指针数组）
 * - 优化版：数值组件用 TypedArray，其他组件用对象数组
 *
 * **性能收益**:
 * - 数值组件真正连续内存
 * - 可直接传给 WebGL
 * - 批量操作更高效
 *
 * @example
 * ```typescript
 * const archetype = new OptimizedArchetype(mask, componentTypes, registry);
 *
 * // 添加实体
 * archetype.addEntity(entity, [
 *   { x: 10, y: 0, z: 0 },  // Position (会存入 Float32Array)
 *   { name: 'Player' }       // Name (存入对象数组)
 * ]);
 *
 * // 获取数值组件的原始缓冲区
 * const positionBuffer = archetype.getTypedBuffer(PositionTypeId);
 * gl.bufferData(gl.ARRAY_BUFFER, positionBuffer, gl.DYNAMIC_DRAW);
 * ```
 */

import type { EntityId } from './entity-id';
import type { BitSet } from '../utils/bitset';
import type { ComponentTypeId } from './component-registry';
import type { TypedArrayConstructor } from './typed-component-storage';
import { TypedComponentStorage } from './typed-component-storage';

/**
 * 数值组件定义
 * 用于标识哪些组件应该使用 TypedArray 存储
 */
export interface NumericComponentDef {
  /** 组件类型 ID */
  typeId: ComponentTypeId;
  /** 每个组件的元素数量 */
  stride: number;
  /** TypedArray 类型 */
  arrayType: TypedArrayConstructor;
  /** 字段名称（用于从对象提取数据） */
  fields: string[];
}

/**
 * 组件存储类型
 */
type ComponentStorage = {
  /** 是否为数值类型 */
  isNumeric: boolean;
  /** 数值存储（TypedArray） */
  typedStorage?: TypedComponentStorage;
  /** 对象存储 */
  objectStorage?: any[];
  /** 数值组件定义 */
  numericDef?: NumericComponentDef;
};

/**
 * 优化的 Archetype
 */
export class OptimizedArchetype {
  /** 组件掩码 */
  readonly mask: BitSet;

  /** 组件类型 ID 数组 */
  readonly componentTypes: ComponentTypeId[];

  /** 实体数组 */
  private entities: EntityId[] = [];

  /** 组件存储映射 */
  private storages: Map<ComponentTypeId, ComponentStorage> = new Map();

  /** 实体到行索引的映射 */
  private entityToRow = new Map<EntityId, number>();

  /** 数值组件定义注册表 */
  private static numericDefs = new Map<ComponentTypeId, NumericComponentDef>();

  /**
   * 注册数值组件定义
   * @param def 数值组件定义
   */
  static registerNumericComponent(def: NumericComponentDef): void {
    OptimizedArchetype.numericDefs.set(def.typeId, def);
  }

  /**
   * 批量注册数值组件
   */
  static registerNumericComponents(defs: NumericComponentDef[]): void {
    for (const def of defs) {
      OptimizedArchetype.numericDefs.set(def.typeId, def);
    }
  }

  /**
   * 创建优化的 Archetype
   * @param mask 组件掩码
   * @param componentTypes 组件类型 ID 数组
   * @param initialCapacity 初始容量
   */
  constructor(mask: BitSet, componentTypes: ComponentTypeId[], initialCapacity: number = 1024) {
    this.mask = mask;
    this.componentTypes = [...componentTypes];

    // 初始化存储
    for (const typeId of componentTypes) {
      const numericDef = OptimizedArchetype.numericDefs.get(typeId);

      if (numericDef) {
        // 数值组件：使用 TypedArray
        this.storages.set(typeId, {
          isNumeric: true,
          typedStorage: new TypedComponentStorage(numericDef.arrayType, numericDef.stride, initialCapacity),
          numericDef,
        });
      } else {
        // 普通组件：使用对象数组
        this.storages.set(typeId, {
          isNumeric: false,
          objectStorage: [],
        });
      }
    }
  }

  /**
   * 添加实体
   * @param entity 实体 ID
   * @param componentData 组件数据数组
   * @returns 行索引
   */
  addEntity(entity: EntityId, componentData: any[]): number {
    if (componentData.length !== this.componentTypes.length) {
      throw new Error(`Component data mismatch: expected ${this.componentTypes.length}, got ${componentData.length}`);
    }

    const row = this.entities.length;
    this.entities.push(entity);
    this.entityToRow.set(entity, row);

    // 添加组件数据
    for (let i = 0; i < this.componentTypes.length; i++) {
      const typeId = this.componentTypes[i];
      const storage = this.storages.get(typeId)!;
      const data = componentData[i];

      if (storage.isNumeric && storage.typedStorage && storage.numericDef) {
        // 数值组件：提取字段值到 TypedArray
        const values = this.extractNumericValues(data, storage.numericDef);
        storage.typedStorage.add(entity, values);
      } else if (storage.objectStorage) {
        // 普通组件：直接存储对象
        storage.objectStorage.push(data);
      }
    }

    return row;
  }

  /**
   * 移除实体（swap-remove）
   * @param entity 实体 ID
   * @returns 是否成功
   */
  removeEntity(entity: EntityId): boolean {
    const row = this.entityToRow.get(entity);
    if (row === undefined) {
      return false;
    }

    const lastRow = this.entities.length - 1;

    // 移除组件数据
    for (const typeId of this.componentTypes) {
      const storage = this.storages.get(typeId)!;

      if (storage.isNumeric && storage.typedStorage) {
        storage.typedStorage.remove(entity);
      } else if (storage.objectStorage) {
        // swap-remove
        if (row !== lastRow) {
          storage.objectStorage[row] = storage.objectStorage[lastRow];
        }
        storage.objectStorage.pop();
      }
    }

    // 更新实体映射
    if (row !== lastRow) {
      const lastEntity = this.entities[lastRow];
      this.entities[row] = lastEntity;
      this.entityToRow.set(lastEntity, row);
    }

    this.entities.pop();
    this.entityToRow.delete(entity);

    return true;
  }

  /**
   * 检查是否包含实体
   */
  hasEntity(entity: EntityId): boolean {
    return this.entityToRow.has(entity);
  }

  /**
   * 获取实体的行索引
   */
  getEntityRow(entity: EntityId): number {
    return this.entityToRow.get(entity) ?? -1;
  }

  /**
   * 获取组件数据
   * @param entity 实体 ID
   * @param componentType 组件类型 ID
   */
  getComponent(entity: EntityId, componentType: ComponentTypeId): any | undefined {
    const storage = this.storages.get(componentType);
    if (!storage) {
      return undefined;
    }

    if (storage.isNumeric && storage.typedStorage) {
      // 返回 TypedArray 视图
      return storage.typedStorage.getView(entity);
    } else if (storage.objectStorage) {
      const row = this.entityToRow.get(entity);
      if (row === undefined) {
        return undefined;
      }
      return storage.objectStorage[row];
    }

    return undefined;
  }

  /**
   * 获取数值组件的 TypedArray 缓冲区
   * @param componentType 组件类型 ID
   * @returns TypedArray 缓冲区，如果不是数值组件返回 undefined
   */
  getTypedBuffer(componentType: ComponentTypeId): Float32Array | undefined {
    const storage = this.storages.get(componentType);
    if (!storage || !storage.isNumeric || !storage.typedStorage) {
      return undefined;
    }
    return storage.typedStorage.getRawBuffer() as Float32Array;
  }

  /**
   * 获取组件数组（用于遍历）
   * @param componentType 组件类型 ID
   */
  getComponentArray(componentType: ComponentTypeId): any[] | undefined {
    const storage = this.storages.get(componentType);
    if (!storage) {
      return undefined;
    }

    if (storage.isNumeric && storage.typedStorage) {
      // 对于数值组件，返回视图数组（兼容旧 API）
      const result: Float32Array[] = [];
      storage.typedStorage.forEach((entity, data) => {
        result.push(data as Float32Array);
      });
      return result;
    } else if (storage.objectStorage) {
      return storage.objectStorage;
    }

    return undefined;
  }

  /**
   * 获取所有实体
   */
  getEntities(): ReadonlyArray<EntityId> {
    return this.entities;
  }

  /**
   * 获取实体数量
   */
  getEntityCount(): number {
    return this.entities.length;
  }

  /**
   * 检查是否为空
   */
  isEmpty(): boolean {
    return this.entities.length === 0;
  }

  /**
   * 清空
   */
  clear(): void {
    this.entities = [];
    this.entityToRow.clear();

    for (const storage of this.storages.values()) {
      if (storage.typedStorage) {
        storage.typedStorage.clear();
      }
      if (storage.objectStorage) {
        storage.objectStorage.length = 0;
      }
    }
  }

  /**
   * 遍历所有实体
   */
  forEach(callback: (entity: EntityId, row: number) => void): void {
    for (let row = 0; row < this.entities.length; row++) {
      callback(this.entities[row], row);
    }
  }

  /**
   * 高性能批量遍历数值组件
   * @param componentType 组件类型 ID
   * @param callback 回调函数，直接操作原始数组
   */
  forEachNumeric(
    componentType: ComponentTypeId,
    callback: (data: Float32Array, count: number, stride: number) => void
  ): void {
    const storage = this.storages.get(componentType);
    if (!storage || !storage.isNumeric || !storage.typedStorage) {
      return;
    }

    storage.typedStorage.forEachRaw((data, count, stride) => {
      callback(data as Float32Array, count, stride);
    });
  }

  /**
   * 获取哈希值
   */
  getHash(): string {
    return this.mask.toArray().join(',');
  }

  /**
   * 从对象提取数值字段
   */
  private extractNumericValues(data: any, def: NumericComponentDef): number[] {
    if (Array.isArray(data)) {
      return data;
    }

    if (data instanceof Float32Array || data instanceof Float64Array) {
      return Array.from(data);
    }

    // 从对象字段提取
    const values: number[] = [];
    for (const field of def.fields) {
      const value = data[field];
      if (typeof value === 'number') {
        values.push(value);
      } else {
        values.push(0);
      }
    }

    return values;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    entityCount: number;
    componentTypeCount: number;
    numericComponents: number;
    objectComponents: number;
    memoryEstimate: number;
  } {
    let numericCount = 0;
    let objectCount = 0;
    let memoryEstimate = this.entities.length * 4; // EntityId

    for (const storage of this.storages.values()) {
      if (storage.isNumeric) {
        numericCount++;
        if (storage.typedStorage) {
          memoryEstimate += storage.typedStorage.getStats().memoryBytes;
        }
      } else {
        objectCount++;
        if (storage.objectStorage) {
          memoryEstimate += storage.objectStorage.length * 32; // 估算
        }
      }
    }

    return {
      entityCount: this.entities.length,
      componentTypeCount: this.componentTypes.length,
      numericComponents: numericCount,
      objectComponents: objectCount,
      memoryEstimate,
    };
  }
}

/**
 * 预定义的数值组件注册
 * 在使用 OptimizedArchetype 前调用
 */
export function registerCommonNumericComponents(registry: { getTypeId: (type: any) => ComponentTypeId }): void {
  // 这些需要根据实际的组件类来注册
  // 示例：
  // OptimizedArchetype.registerNumericComponent({
  //   typeId: registry.getTypeId(Position),
  //   stride: 3,
  //   arrayType: Float32Array,
  //   fields: ['x', 'y', 'z']
  // });
}
