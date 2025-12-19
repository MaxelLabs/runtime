/**
 * ECS Entity ID 类型定义
 * Entity 是纯数字 ID，32位结构：
 * - 高20位: Index（实体索引，最多支持 1048576 个实体）
 * - 低12位: Generation（版本号，最多支持 4096 次复用）
 *
 * @example
 * ```typescript
 * const id = EntityId.create(123, 1); // Index=123, Generation=1
 * console.log(EntityId.index(id));      // 123
 * console.log(EntityId.generation(id)); // 1
 * ```
 */

/**
 * Entity ID 类型（纯数字）
 * 32位整数，高20位为索引，低12位为版本号
 */
export type EntityId = number;

/**
 * 无效的 Entity ID
 */
export const INVALID_ENTITY: EntityId = 0xffffffff;

/**
 * Index 位宽（20位，支持约100万实体）
 */
const INDEX_BITS = 20;

/**
 * Generation 位宽（12位，支持4096次复用）
 */
const GENERATION_BITS = 12;

/**
 * Index 掩码（0xFFFFF000，取高20位）
 */
const INDEX_MASK = 0xfffff000;

/**
 * Generation 掩码（0x00000FFF，取低12位）
 */
const GENERATION_MASK = 0x00000fff;

/**
 * 最大 Index 值（1048575）
 */
export const MAX_INDEX = (1 << INDEX_BITS) - 1;

/**
 * 最大 Generation 值（4095）
 */
export const MAX_GENERATION = (1 << GENERATION_BITS) - 1;

/**
 * EntityId 工具函数集
 */
export const EntityId = {
  /**
   * 创建 Entity ID
   * @param index 实体索引（0 - 1048575）
   * @param generation 版本号（0 - 4095）
   * @returns Entity ID
   */
  create(index: number, generation: number): EntityId {
    if (index < 0 || index > MAX_INDEX) {
      throw new Error(`Entity index out of range: ${index} (max: ${MAX_INDEX})`);
    }
    if (generation < 0 || generation > MAX_GENERATION) {
      throw new Error(`Entity generation out of range: ${generation} (max: ${MAX_GENERATION})`);
    }
    return (index << GENERATION_BITS) | generation;
  },

  /**
   * 获取实体索引（高20位）
   * @param id Entity ID
   * @returns 索引值
   */
  index(id: EntityId): number {
    return (id & INDEX_MASK) >>> GENERATION_BITS;
  },

  /**
   * 获取版本号（低12位）
   * @param id Entity ID
   * @returns 版本号
   */
  generation(id: EntityId): number {
    return id & GENERATION_MASK;
  },

  /**
   * 判断是否为有效 Entity ID
   * @param id Entity ID
   * @returns 是否有效
   */
  isValid(id: EntityId): boolean {
    return id !== INVALID_ENTITY && EntityId.index(id) <= MAX_INDEX;
  },

  /**
   * 比较两个 Entity ID 是否相等
   * @param a Entity ID A
   * @param b Entity ID B
   * @returns 是否相等
   */
  equals(a: EntityId, b: EntityId): boolean {
    return a === b;
  },

  /**
   * 格式化为字符串（用于调试）
   * @param id Entity ID
   * @returns 格式化字符串
   */
  toString(id: EntityId): string {
    if (!EntityId.isValid(id)) {
      return 'Entity(INVALID)';
    }
    return `Entity(index=${EntityId.index(id)}, gen=${EntityId.generation(id)})`;
  },
};
