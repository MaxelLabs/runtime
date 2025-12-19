import { BitSet } from '../utils/bitset';

/**
 * 组件类型（构造函数）
 */
export type ComponentClass<T = any> = new (...args: any[]) => T;

/**
 * 组件类型ID（唯一标识）
 */
export type ComponentTypeId = number;

/**
 * 组件元数据
 */
interface ComponentMetadata<T = any> {
  /** 组件类型ID */
  id: ComponentTypeId;
  /** 组件类（构造函数） */
  type: ComponentClass<T>;
  /** 组件名称 */
  name: string;
  /** BitSet掩码位（用于快速查询） */
  bitIndex: number;
}

/**
 * ComponentRegistry
 * 组件注册表，负责管理组件类型和BitSet掩码分配
 *
 * @remarks
 * - 每个组件类型分配唯一的ID和BitSet位索引
 * - 支持通过组件类快速获取元数据
 * - 提供组件掩码的合并和比较功能
 * - 最多支持1024种不同的组件类型（BitSet限制）
 *
 * @example
 * ```typescript
 * const registry = new ComponentRegistry();
 *
 * // 注册组件类型
 * class Position { x = 0; y = 0; z = 0; }
 * class Velocity { x = 0; y = 0; z = 0; }
 *
 * registry.register(Position);
 * registry.register(Velocity);
 *
 * // 获取组件ID
 * const posId = registry.getTypeId(Position); // 0
 * const velId = registry.getTypeId(Velocity); // 1
 *
 * // 创建组件掩码
 * const mask = registry.createMask([Position, Velocity]);
 * console.log(mask.has(0)); // true (Position)
 * console.log(mask.has(1)); // true (Velocity)
 * ```
 */
export class ComponentRegistry {
  /** 组件类型到元数据的映射 */
  private typeToMeta = new Map<ComponentClass, ComponentMetadata>();

  /** 组件ID到元数据的映射 */
  private idToMeta = new Map<ComponentTypeId, ComponentMetadata>();

  /** 下一个可用的组件ID */
  private nextId: ComponentTypeId = 0;

  /** 下一个可用的BitSet位索引 */
  private nextBitIndex: number = 0;

  /** 最大组件类型数量（BitSet容量限制） */
  private static readonly MAX_COMPONENT_TYPES = 1024;

  /**
   * 注册组件类型
   * @param type 组件类（构造函数）
   * @returns 组件类型ID
   * @throws 如果组件已注册或超过最大数量限制
   */
  register<T>(type: ComponentClass<T>): ComponentTypeId {
    // 检查是否已注册
    if (this.typeToMeta.has(type)) {
      return this.typeToMeta.get(type)!.id;
    }

    // 检查是否超过最大数量
    if (this.nextId >= ComponentRegistry.MAX_COMPONENT_TYPES) {
      throw new Error(
        `Component type limit exceeded: cannot register more than ${ComponentRegistry.MAX_COMPONENT_TYPES} types`
      );
    }

    // 分配ID和BitSet位索引
    const id = this.nextId++;
    const bitIndex = this.nextBitIndex++;

    // 创建元数据
    const metadata: ComponentMetadata<T> = {
      id,
      type,
      name: type.name || `Component${id}`,
      bitIndex,
    };

    // 保存映射
    this.typeToMeta.set(type, metadata);
    this.idToMeta.set(id, metadata);

    return id;
  }

  /**
   * 获取组件类型ID
   * @param type 组件类
   * @returns 组件类型ID，如果未注册返回-1
   */
  getTypeId<T>(type: ComponentClass<T>): ComponentTypeId {
    const meta = this.typeToMeta.get(type);
    return meta ? meta.id : -1;
  }

  /**
   * 获取组件BitSet位索引
   * @param type 组件类
   * @returns BitSet位索引，如果未注册返回-1
   */
  getBitIndex<T>(type: ComponentClass<T>): number {
    const meta = this.typeToMeta.get(type);
    return meta ? meta.bitIndex : -1;
  }

  /**
   * 获取组件名称
   * @param type 组件类
   * @returns 组件名称，如果未注册返回undefined
   */
  getName<T>(type: ComponentClass<T>): string | undefined {
    const meta = this.typeToMeta.get(type);
    return meta?.name;
  }

  /**
   * 通过ID获取组件类
   * @param id 组件类型ID
   * @returns 组件类，如果不存在返回undefined
   */
  getTypeById(id: ComponentTypeId): ComponentClass | undefined {
    const meta = this.idToMeta.get(id);
    return meta?.type;
  }

  /**
   * 通过BitSet位索引获取组件类
   * @param bitIndex BitSet位索引
   * @returns 组件类，如果不存在返回undefined
   */
  getTypeByBitIndex(bitIndex: number): ComponentClass | undefined {
    for (const meta of this.typeToMeta.values()) {
      if (meta.bitIndex === bitIndex) {
        return meta.type;
      }
    }
    return undefined;
  }

  /**
   * 检查组件类型是否已注册
   * @param type 组件类
   * @returns 是否已注册
   */
  has<T>(type: ComponentClass<T>): boolean {
    return this.typeToMeta.has(type);
  }

  /**
   * 获取已注册的组件类型数量
   * @returns 组件类型数量
   */
  getCount(): number {
    return this.typeToMeta.size;
  }

  /**
   * 创建组件掩码（BitSet）
   * @param types 组件类数组
   * @returns BitSet掩码
   * @throws 如果有未注册的组件类型
   */
  createMask(types: ComponentClass[]): BitSet {
    const mask = new BitSet();
    for (const type of types) {
      const bitIndex = this.getBitIndex(type);
      if (bitIndex === -1) {
        throw new Error(`Component type not registered: ${type.name}`);
      }
      mask.set(bitIndex);
    }
    return mask;
  }

  /**
   * 检查掩码是否包含所有指定组件
   * @param mask 组件掩码
   * @param types 要检查的组件类数组
   * @returns 是否包含所有组件
   */
  maskContainsAll(mask: BitSet, types: ComponentClass[]): boolean {
    for (const type of types) {
      const bitIndex = this.getBitIndex(type);
      if (bitIndex === -1 || !mask.has(bitIndex)) {
        return false;
      }
    }
    return true;
  }

  /**
   * 检查掩码是否包含任意指定组件
   * @param mask 组件掩码
   * @param types 要检查的组件类数组
   * @returns 是否包含任意组件
   */
  maskContainsAny(mask: BitSet, types: ComponentClass[]): boolean {
    for (const type of types) {
      const bitIndex = this.getBitIndex(type);
      if (bitIndex !== -1 && mask.has(bitIndex)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 检查掩码是否不包含任何指定组件
   * @param mask 组件掩码
   * @param types 要检查的组件类数组
   * @returns 是否不包含任何组件
   */
  maskExcludesAll(mask: BitSet, types: ComponentClass[]): boolean {
    for (const type of types) {
      const bitIndex = this.getBitIndex(type);
      if (bitIndex !== -1 && mask.has(bitIndex)) {
        return false;
      }
    }
    return true;
  }

  /**
   * 获取掩码对应的组件类数组
   * @param mask 组件掩码
   * @returns 组件类数组
   */
  getTypesFromMask(mask: BitSet): ComponentClass[] {
    const types: ComponentClass[] = [];
    for (const bitIndex of mask) {
      const type = this.getTypeByBitIndex(bitIndex);
      if (type) {
        types.push(type);
      }
    }
    return types;
  }

  /**
   * 清空注册表
   * @remarks
   * 清除所有已注册的组件类型
   */
  clear(): void {
    this.typeToMeta.clear();
    this.idToMeta.clear();
    this.nextId = 0;
    this.nextBitIndex = 0;
  }

  /**
   * 获取所有已注册的组件类型
   * @returns 组件类数组
   */
  getAllTypes(): ComponentClass[] {
    return Array.from(this.typeToMeta.keys());
  }

  /**
   * 获取统计信息
   * @returns 统计信息对象
   */
  getStats(): {
    registeredTypes: number;
    maxTypes: number;
    utilizationRate: number;
  } {
    return {
      registeredTypes: this.getCount(),
      maxTypes: ComponentRegistry.MAX_COMPONENT_TYPES,
      utilizationRate: this.getCount() / ComponentRegistry.MAX_COMPONENT_TYPES,
    };
  }
}
