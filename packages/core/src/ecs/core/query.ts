import type { EntityId } from './entity-id';
import type { Archetype } from './archetype';
import type { ComponentClass } from './component-registry';
import { BitSet } from '../utils/bitset';

/**
 * 查询过滤器
 * 定义查询的组件要求
 */
export interface QueryFilter {
  /** 必须包含的所有组件 */
  all?: ComponentClass[];
  /** 必须包含的任意组件（至少一个） */
  any?: ComponentClass[];
  /** 必须不包含的组件 */
  none?: ComponentClass[];
}

/**
 * 查询结果项
 * 包含实体ID和组件数据
 */
export interface QueryResult {
  /** 实体ID */
  entity: EntityId;
  /** 组件数据数组（顺序与查询的all组件一致） */
  components: any[];
}

/**
 * Query
 * ECS查询系统，根据组件掩码筛选匹配的Archetype并提供迭代接口
 *
 * @remarks
 * **查询策略**:
 * - `all`: 必须同时包含所有指定组件（AND逻辑）
 * - `any`: 必须至少包含一个指定组件（OR逻辑）
 * - `none`: 必须不包含任何指定组件（NOT逻辑）
 *
 * **性能优化**:
 * - 使用BitSet掩码进行快速匹配（O(1)复杂度）
 * - 缓存匹配的Archetype，避免重复查询
 * - 支持批量遍历，适合System使用
 *
 * @example
 * ```typescript
 * // 查询所有包含Position和Velocity但不包含Dead的实体
 * const query = new Query(
 *   { all: [Position, Velocity], none: [Dead] },
 *   registry
 * );
 *
 * // 添加Archetype进行匹配
 * query.addArchetype(archetypeA);
 * query.addArchetype(archetypeB);
 *
 * // 遍历所有匹配的实体
 * query.forEach((entity, [position, velocity]) => {
 *   position.x += velocity.x;
 *   position.y += velocity.y;
 * });
 * ```
 */
export class Query {
  /** 查询过滤器 */
  private readonly filter: QueryFilter;

  /** 必须包含的组件掩码 */
  private readonly allMask: BitSet;

  /** 至少包含一个的组件掩码 */
  private readonly anyMask: BitSet | null;

  /** 必须不包含的组件掩码 */
  private readonly noneMask: BitSet | null;

  /** 匹配的Archetype列表 */
  private matchedArchetypes: Archetype[] = [];

  /** 匹配的Archetype集合（用于快速查重） */
  private matchedArchetypeSet: Set<Archetype> = new Set();

  /** all组件的类型ID数组（用于提取组件数据） */
  private readonly allComponentTypeIds: number[];

  /**
   * 创建查询
   * @param filter 查询过滤器
   * @param createMaskFn 创建掩码的函数（由ComponentRegistry提供）
   * @param getTypeIdFn 获取组件类型ID的函数（由ComponentRegistry提供）
   */
  constructor(
    filter: QueryFilter,
    createMaskFn: (types: ComponentClass[]) => BitSet,
    getTypeIdFn: (type: ComponentClass) => number
  ) {
    this.filter = filter;

    // 创建all掩码（必须）
    this.allMask = filter.all ? createMaskFn(filter.all) : new BitSet();

    // 创建any掩码（可选）
    this.anyMask = filter.any ? createMaskFn(filter.any) : null;

    // 创建none掩码（可选）
    this.noneMask = filter.none ? createMaskFn(filter.none) : null;

    // 保存all组件的类型ID
    this.allComponentTypeIds = filter.all ? filter.all.map(getTypeIdFn) : [];
  }

  /**
   * 检查Archetype是否匹配查询
   * @param archetype Archetype实例
   * @returns 是否匹配
   */
  matches(archetype: Archetype): boolean {
    const archetypeMask = archetype.mask;

    // 检查all：必须包含所有指定组件
    if (!this.allMask.isEmpty()) {
      // archetype必须包含all中的所有位
      const intersection = archetypeMask.and(this.allMask);
      if (!intersection.equals(this.allMask)) {
        return false;
      }
    }

    // 检查any：必须至少包含一个指定组件
    if (this.anyMask) {
      if (!archetypeMask.intersects(this.anyMask)) {
        return false;
      }
    }

    // 检查none：必须不包含任何指定组件
    if (this.noneMask) {
      if (archetypeMask.intersects(this.noneMask)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 添加Archetype到查询
   * @param archetype Archetype实例
   * @returns 是否成功添加（不匹配时返回false）
   */
  addArchetype(archetype: Archetype): boolean {
    if (!this.matches(archetype)) {
      return false;
    }

    // 避免重复添加（使用 Set 进行 O(1) 查重）
    if (!this.matchedArchetypeSet.has(archetype)) {
      this.matchedArchetypes.push(archetype);
      this.matchedArchetypeSet.add(archetype);
    }

    return true;
  }

  /**
   * 移除Archetype
   * @param archetype Archetype实例
   * @returns 是否成功移除
   */
  removeArchetype(archetype: Archetype): boolean {
    if (!this.matchedArchetypeSet.has(archetype)) {
      return false;
    }

    const index = this.matchedArchetypes.indexOf(archetype);
    if (index !== -1) {
      this.matchedArchetypes.splice(index, 1);
    }
    this.matchedArchetypeSet.delete(archetype);
    return true;
  }

  /**
   * 获取所有匹配的Archetype
   * @returns Archetype数组（只读）
   */
  getMatchedArchetypes(): ReadonlyArray<Archetype> {
    return this.matchedArchetypes;
  }

  /**
   * 获取匹配的实体数量
   * @returns 实体总数
   */
  getEntityCount(): number {
    let count = 0;
    for (const archetype of this.matchedArchetypes) {
      count += archetype.getEntityCount();
    }
    return count;
  }

  /**
   * 遍历所有匹配的实体
   * @param callback 回调函数，参数为(entity, components)
   * @remarks
   * components数组中的组件顺序与filter.all中的组件顺序一致
   */
  forEach(callback: (entity: EntityId, components: any[]) => void): void {
    for (const archetype of this.matchedArchetypes) {
      const entities = archetype.getEntities();

      // 跳过空Archetype
      if (entities.length === 0) {
        continue;
      }

      // 获取all组件的数据数组
      const componentArrays = this.allComponentTypeIds.map((typeId) => archetype.getComponentArray(typeId));

      // 检查是否所有组件数组都存在
      if (componentArrays.some((arr) => !arr)) {
        // 如果有组件不存在，跳过这个Archetype（不应该匹配）
        continue;
      }

      // 遍历该Archetype中的所有实体
      for (let row = 0; row < entities.length; row++) {
        const entity = entities[row];

        // 提取该实体的组件数据
        const components = componentArrays.map((arr) => arr![row]);

        callback(entity, components);
      }
    }
  }

  /**
   * 收集所有匹配的实体和组件数据
   * @returns 查询结果数组
   */
  collect(): QueryResult[] {
    const results: QueryResult[] = [];

    this.forEach((entity, components) => {
      results.push({ entity, components });
    });

    return results;
  }

  /**
   * 获取第一个匹配的实体
   * @returns 查询结果，如果没有匹配返回null
   */
  first(): QueryResult | null {
    for (const archetype of this.matchedArchetypes) {
      const entities = archetype.getEntities();
      if (entities.length === 0) {
        continue;
      }

      const entity = entities[0];
      const components = this.allComponentTypeIds.map((typeId) => archetype.getComponent(entity, typeId));

      return { entity, components };
    }

    return null;
  }

  /**
   * 检查是否有任何匹配的实体
   * @returns 是否有匹配实体
   */
  isEmpty(): boolean {
    return this.getEntityCount() === 0;
  }

  /**
   * 清空查询（移除所有匹配的Archetype）
   */
  clear(): void {
    this.matchedArchetypes = [];
    this.matchedArchetypeSet.clear();
  }

  /**
   * 获取查询过滤器
   * @returns 查询过滤器（只读）
   */
  getFilter(): Readonly<QueryFilter> {
    return this.filter;
  }

  /**
   * 获取统计信息
   * @returns 统计信息对象
   */
  getStats(): {
    matchedArchetypes: number;
    totalEntities: number;
  } {
    return {
      matchedArchetypes: this.matchedArchetypes.length,
      totalEntities: this.getEntityCount(),
    };
  }
}
