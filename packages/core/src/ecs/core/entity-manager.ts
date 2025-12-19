import { EntityId, MAX_INDEX, MAX_GENERATION } from './entity-id';

/**
 * Entity 元数据
 * 用于跟踪实体的存活状态和版本信息
 */
interface EntityMeta {
  /** 当前版本号 */
  generation: number;
  /** 是否存活 */
  alive: boolean;
}

/**
 * EntityManager
 * 负责 Entity ID 的分配、回收和版本管理
 *
 * @remarks
 * - 使用版本号防止悬空引用（已销毁实体的ID不会被误用）
 * - 回收的实体索引会被重用，但版本号递增
 * - 支持快速检查实体是否存活（O(1)）
 *
 * @example
 * ```typescript
 * const manager = new EntityManager();
 *
 * // 创建实体
 * const entity1 = manager.create();
 * const entity2 = manager.create();
 *
 * // 检查存活
 * console.log(manager.isAlive(entity1)); // true
 *
 * // 销毁实体
 * manager.destroy(entity1);
 * console.log(manager.isAlive(entity1)); // false
 *
 * // 创建新实体会复用索引但版本号+1
 * const entity3 = manager.create();
 * console.log(EntityId.index(entity3) === EntityId.index(entity1)); // true
 * console.log(EntityId.generation(entity3) > EntityId.generation(entity1)); // true
 * ```
 */
export class EntityManager {
  /** 实体元数据数组（索引对应Entity的index） */
  private entities: EntityMeta[] = [];

  /** 可复用的实体索引队列（已销毁的实体索引） */
  private freeList: number[] = [];

  /** 下一个可用的实体索引 */
  private nextIndex: number = 0;

  /** 当前存活的实体数量 */
  private aliveCount: number = 0;

  /**
   * 创建新实体
   * @returns Entity ID
   * @throws 如果实体数量达到上限
   */
  create(): EntityId {
    let index: number;
    let generation: number;

    // 优先从回收队列中获取索引
    if (this.freeList.length > 0) {
      index = this.freeList.pop()!;
      const meta = this.entities[index];

      // 版本号递增（防止悬空引用）
      generation = meta.generation + 1;

      // 版本号溢出检查
      if (generation > MAX_GENERATION) {
        // 版本号溢出，跳过该索引，继续尝试下一个
        return this.create();
      }

      // 更新元数据
      meta.generation = generation;
      meta.alive = true;
    } else {
      // 分配新索引
      index = this.nextIndex;

      // 索引溢出检查
      if (index > MAX_INDEX) {
        throw new Error(`Entity index overflow: cannot create more than ${MAX_INDEX + 1} entities`);
      }

      generation = 0;

      // 创建新元数据
      this.entities[index] = {
        generation,
        alive: true,
      };

      this.nextIndex++;
    }

    this.aliveCount++;
    return EntityId.create(index, generation);
  }

  /**
   * 销毁实体
   * @param entity Entity ID
   * @returns 是否成功销毁
   */
  destroy(entity: EntityId): boolean {
    const index = EntityId.index(entity);
    const generation = EntityId.generation(entity);

    // 索引越界检查
    if (index >= this.entities.length) {
      return false;
    }

    const meta = this.entities[index];

    // 版本号不匹配（可能是悬空引用）
    if (meta.generation !== generation) {
      return false;
    }

    // 已经销毁
    if (!meta.alive) {
      return false;
    }

    // 标记为已销毁
    meta.alive = false;
    this.aliveCount--;

    // 加入回收队列
    this.freeList.push(index);

    return true;
  }

  /**
   * 检查实体是否存活
   * @param entity Entity ID
   * @returns 是否存活
   */
  isAlive(entity: EntityId): boolean {
    const index = EntityId.index(entity);
    const generation = EntityId.generation(entity);

    // 索引越界
    if (index >= this.entities.length) {
      return false;
    }

    const meta = this.entities[index];

    // 版本号必须匹配且状态为存活
    return meta.generation === generation && meta.alive;
  }

  /**
   * 获取存活实体数量
   * @returns 存活实体数量
   */
  getAliveCount(): number {
    return this.aliveCount;
  }

  /**
   * 获取已分配的实体数量（包括已销毁）
   * @returns 已分配数量
   */
  getTotalCount(): number {
    return this.nextIndex;
  }

  /**
   * 获取可复用索引数量
   * @returns 可复用数量
   */
  getFreeCount(): number {
    return this.freeList.length;
  }

  /**
   * 清空所有实体
   * @remarks
   * 重置管理器到初始状态，所有实体ID将失效
   */
  clear(): void {
    this.entities = [];
    this.freeList = [];
    this.nextIndex = 0;
    this.aliveCount = 0;
  }

  /**
   * 获取所有存活的实体ID
   * @returns 存活实体ID数组
   */
  getAliveEntities(): EntityId[] {
    const result: EntityId[] = [];
    for (let index = 0; index < this.entities.length; index++) {
      const meta = this.entities[index];
      if (meta.alive) {
        result.push(EntityId.create(index, meta.generation));
      }
    }
    return result;
  }

  /**
   * 获取实体的版本号
   * @param entity Entity ID
   * @returns 当前版本号，如果实体不存在返回-1
   */
  getGeneration(entity: EntityId): number {
    const index = EntityId.index(entity);
    if (index >= this.entities.length) {
      return -1;
    }
    return this.entities[index].generation;
  }

  /**
   * 获取统计信息
   * @returns 统计信息对象
   */
  getStats(): {
    alive: number;
    total: number;
    free: number;
    capacity: number;
    utilizationRate: number;
  } {
    const capacity = MAX_INDEX + 1;
    return {
      alive: this.aliveCount,
      total: this.nextIndex,
      free: this.freeList.length,
      capacity,
      utilizationRate: this.aliveCount / capacity,
    };
  }
}
