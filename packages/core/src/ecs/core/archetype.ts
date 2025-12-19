import type { EntityId } from './entity-id';
import type { BitSet } from '../utils/bitset';
import type { ComponentTypeId } from './component-registry';

/**
 * 组件存储（按类型分组，SoA布局）
 * key: ComponentTypeId
 * value: 组件数据数组
 */
type ComponentStorage = Map<ComponentTypeId, any[]>;

/**
 * Archetype
 * 表示具有相同组件组合的实体集合，采用SoA（Structure of Arrays）内存布局
 *
 * @remarks
 * **核心概念**:
 * - Archetype是具有相同组件组合的实体分组
 * - 采用SoA内存布局：每种组件的所有实例在内存中连续存储
 * - 支持快速批量操作和缓存友好的遍历
 *
 * **内存布局示例**:
 * ```
 * Archetype [Position + Velocity]
 * entities: [1, 3, 5]
 * Position: [{x:10,y:0,z:0}, {x:20,y:5,z:0}, {x:30,y:10,z:0}]
 * Velocity: [{x:1,y:0,z:0}, {x:2,y:1,z:0}, {x:3,y:2,z:0}]
 * ```
 *
 * @example
 * ```typescript
 * const registry = new ComponentRegistry();
 * registry.register(Position);
 * registry.register(Velocity);
 *
 * const mask = registry.createMask([Position, Velocity]);
 * const types = [registry.getTypeId(Position)!, registry.getTypeId(Velocity)!];
 *
 * const archetype = new Archetype(mask, types);
 *
 * // 添加实体
 * const entity = EntityId.create(0, 0);
 * const row = archetype.addEntity(entity, [
 *   { x: 10, y: 0, z: 0 },  // Position
 *   { x: 1, y: 0, z: 0 }     // Velocity
 * ]);
 *
 * // 获取组件数据
 * const positions = archetype.getComponentArray(posTypeId); // [{x:10,y:0,z:0}]
 * ```
 */
export class Archetype {
  /** 组件掩码（BitSet），唯一标识该Archetype */
  readonly mask: BitSet;

  /** 组件类型ID数组（保持顺序） */
  readonly componentTypes: ComponentTypeId[];

  /** 实体数组（保存Entity ID） */
  private entities: EntityId[] = [];

  /** 组件存储（SoA布局） */
  private components: ComponentStorage = new Map();

  /** 实体到行索引的映射（快速查找） */
  private entityToRow = new Map<EntityId, number>();

  /**
   * 创建Archetype
   * @param mask 组件掩码
   * @param componentTypes 组件类型ID数组
   */
  constructor(mask: BitSet, componentTypes: ComponentTypeId[]) {
    this.mask = mask;
    this.componentTypes = [...componentTypes]; // 复制数组，避免外部修改

    // 初始化组件存储数组
    for (const typeId of componentTypes) {
      this.components.set(typeId, []);
    }
  }

  /**
   * 添加实体到Archetype
   * @param entity Entity ID
   * @param componentData 组件数据数组（顺序需与componentTypes一致）
   * @returns 实体在Archetype中的行索引
   * @throws 如果组件数据数量不匹配
   */
  addEntity(entity: EntityId, componentData: any[]): number {
    if (componentData.length !== this.componentTypes.length) {
      throw new Error(`Component data mismatch: expected ${this.componentTypes.length}, got ${componentData.length}`);
    }

    // 分配行索引
    const row = this.entities.length;

    // 添加实体ID
    this.entities.push(entity);
    this.entityToRow.set(entity, row);

    // 添加组件数据（SoA布局）
    for (let i = 0; i < this.componentTypes.length; i++) {
      const typeId = this.componentTypes[i];
      const data = componentData[i];
      const storage = this.components.get(typeId)!;
      storage.push(data);
    }

    return row;
  }

  /**
   * 移除实体
   * @param entity Entity ID
   * @returns 是否成功移除
   * @remarks
   * 使用 swap-remove 策略：将最后一个实体换到被删除位置，O(1)操作
   */
  removeEntity(entity: EntityId): boolean {
    const row = this.entityToRow.get(entity);
    if (row === undefined) {
      return false;
    }

    const lastRow = this.entities.length - 1;

    // 如果不是最后一个元素，进行swap-remove
    if (row !== lastRow) {
      const lastEntity = this.entities[lastRow];

      // 交换实体
      this.entities[row] = lastEntity;
      this.entityToRow.set(lastEntity, row);

      // 交换所有组件数据
      for (const typeId of this.componentTypes) {
        const storage = this.components.get(typeId)!;
        storage[row] = storage[lastRow];
      }
    }

    // 移除最后一个元素
    this.entities.pop();
    this.entityToRow.delete(entity);

    // 移除组件数据
    for (const typeId of this.componentTypes) {
      const storage = this.components.get(typeId)!;
      storage.pop();
    }

    return true;
  }

  /**
   * 检查是否包含实体
   * @param entity Entity ID
   * @returns 是否包含
   */
  hasEntity(entity: EntityId): boolean {
    return this.entityToRow.has(entity);
  }

  /**
   * 获取实体的行索引
   * @param entity Entity ID
   * @returns 行索引，如果不存在返回-1
   */
  getEntityRow(entity: EntityId): number {
    const row = this.entityToRow.get(entity);
    return row !== undefined ? row : -1;
  }

  /**
   * 获取指定组件类型的数据数组
   * @param componentType 组件类型ID
   * @returns 组件数据数组，如果类型不存在返回undefined
   */
  getComponentArray(componentType: ComponentTypeId): any[] | undefined {
    return this.components.get(componentType);
  }

  /**
   * 获取实体的指定组件数据
   * @param entity Entity ID
   * @param componentType 组件类型ID
   * @returns 组件数据，如果不存在返回undefined
   */
  getComponent(entity: EntityId, componentType: ComponentTypeId): any | undefined {
    const row = this.entityToRow.get(entity);
    if (row === undefined) {
      return undefined;
    }

    const storage = this.components.get(componentType);
    if (!storage) {
      return undefined;
    }

    return storage[row];
  }

  /**
   * 设置实体的指定组件数据
   * @param entity Entity ID
   * @param componentType 组件类型ID
   * @param data 组件数据
   * @returns 是否成功设置
   */
  setComponent(entity: EntityId, componentType: ComponentTypeId, data: any): boolean {
    const row = this.entityToRow.get(entity);
    if (row === undefined) {
      return false;
    }

    const storage = this.components.get(componentType);
    if (!storage) {
      return false;
    }

    storage[row] = data;
    return true;
  }

  /**
   * 获取所有实体ID
   * @returns 实体ID数组（只读）
   */
  getEntities(): ReadonlyArray<EntityId> {
    return this.entities;
  }

  /**
   * 获取实体数量
   * @returns 实体数量
   */
  getEntityCount(): number {
    return this.entities.length;
  }

  /**
   * 检查是否为空
   * @returns 是否为空
   */
  isEmpty(): boolean {
    return this.entities.length === 0;
  }

  /**
   * 清空Archetype
   * @remarks
   * 清除所有实体和组件数据
   */
  clear(): void {
    this.entities = [];
    this.entityToRow.clear();

    // 重新创建组件存储数组
    for (const typeId of this.componentTypes) {
      this.components.set(typeId, []);
    }
  }

  /**
   * 遍历所有实体
   * @param callback 回调函数，参数为(entity, row)
   */
  forEach(callback: (entity: EntityId, row: number) => void): void {
    for (let row = 0; row < this.entities.length; row++) {
      callback(this.entities[row], row);
    }
  }

  /**
   * 获取统计信息
   * @returns 统计信息对象
   */
  getStats(): {
    entityCount: number;
    componentTypeCount: number;
    memoryEstimate: number;
  } {
    // 估算内存占用（粗略计算）
    const entityMemory = this.entities.length * 4; // EntityId是number，约4字节
    let componentMemory = 0;

    for (const storage of this.components.values()) {
      // 假设每个组件约占32字节（实际取决于组件结构）
      componentMemory += storage.length * 32;
    }

    return {
      entityCount: this.entities.length,
      componentTypeCount: this.componentTypes.length,
      memoryEstimate: entityMemory + componentMemory,
    };
  }

  /**
   * 获取Archetype的哈希值（用于快速查找）
   * @returns 掩码的字符串表示
   */
  getHash(): string {
    return this.mask.toArray().join(',');
  }
}
