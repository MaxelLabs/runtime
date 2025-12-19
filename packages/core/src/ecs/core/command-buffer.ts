import type { EntityId } from './entity-id';
import type { World } from './world';
import type { ComponentClass } from './component-registry';

/**
 * 命令类型枚举
 */
enum CommandType {
  /** 创建实体 */
  CREATE_ENTITY,
  /** 销毁实体 */
  DESTROY_ENTITY,
  /** 添加组件 */
  ADD_COMPONENT,
  /** 移除组件 */
  REMOVE_COMPONENT,
  /** 插入资源 */
  INSERT_RESOURCE,
  /** 移除资源 */
  REMOVE_RESOURCE,
}

/**
 * 命令接口
 */
interface Command {
  type: CommandType;
  execute(world: World): void;
}

/**
 * 创建实体命令
 */
class CreateEntityCommand implements Command {
  readonly type = CommandType.CREATE_ENTITY;
  private result: EntityId | null = null;
  private callback?: (entity: EntityId) => void;

  constructor(callback?: (entity: EntityId) => void) {
    this.callback = callback;
  }

  execute(world: World): void {
    const entity = world.createEntity();
    this.result = entity;
    if (this.callback) {
      this.callback(entity);
    }
  }

  getResult(): EntityId | null {
    return this.result;
  }
}

/**
 * 销毁实体命令
 */
class DestroyEntityCommand implements Command {
  readonly type = CommandType.DESTROY_ENTITY;

  constructor(private entity: EntityId) {}

  execute(world: World): void {
    world.destroyEntity(this.entity);
  }
}

/**
 * 添加组件命令
 */
class AddComponentCommand<T> implements Command {
  readonly type = CommandType.ADD_COMPONENT;

  constructor(
    private entity: EntityId,
    private componentType: ComponentClass<T>,
    private data?: Partial<T>
  ) {}

  execute(world: World): void {
    world.addComponent(this.entity, this.componentType, this.data);
  }
}

/**
 * 移除组件命令
 */
class RemoveComponentCommand<T> implements Command {
  readonly type = CommandType.REMOVE_COMPONENT;

  constructor(
    private entity: EntityId,
    private componentType: ComponentClass<T>
  ) {}

  execute(world: World): void {
    world.removeComponent(this.entity, this.componentType);
  }
}

/**
 * 插入资源命令
 */
class InsertResourceCommand<T> implements Command {
  readonly type = CommandType.INSERT_RESOURCE;

  constructor(private resource: T) {}

  execute(world: World): void {
    world.insertResource(this.resource);
  }
}

/**
 * 移除资源命令
 */
class RemoveResourceCommand<T> implements Command {
  readonly type = CommandType.REMOVE_RESOURCE;

  constructor(private resourceType: new () => T) {}

  execute(world: World): void {
    world.removeResource(this.resourceType);
  }
}

/**
 * CommandBuffer
 * 延迟命令队列，用于在迭代过程中安全地修改ECS状态
 *
 * @remarks
 * **问题背景**:
 * 在ECS中遍历实体时直接修改World状态（如添加/删除组件、创建/销毁实体）会导致：
 * - 迭代器失效
 * - Archetype结构变化
 * - 潜在的崩溃或数据不一致
 *
 * **解决方案**:
 * CommandBuffer提供延迟执行机制：
 * 1. 在System中记录要执行的命令
 * 2. 等待当前帧的所有System执行完成
 * 3. 在安全的时间点批量执行所有命令
 *
 * **使用场景**:
 * - System中创建新实体（如生成子弹）
 * - System中销毁实体（如移除死亡敌人）
 * - System中添加/移除组件（如给实体添加Buff）
 * - 避免在Query遍历时修改World
 *
 * @example
 * ```typescript
 * function spawnBulletSystem(world: World, cmdBuffer: CommandBuffer) {
 *   const query = world.query({ all: [Player, Weapon] });
 *
 *   query.forEach((entity, [player, weapon]) => {
 *     if (weapon.shouldFire) {
 *       // 不直接调用 world.createEntity()，而是记录命令
 *       cmdBuffer.spawn((bullet) => {
 *         world.addComponent(bullet, Position, { ...player.position });
 *         world.addComponent(bullet, Velocity, { x: 10, y: 0, z: 0 });
 *       });
 *     }
 *   });
 * }
 *
 * // 在所有System执行后
 * cmdBuffer.apply(world); // 批量创建所有子弹
 * ```
 */
export class CommandBuffer {
  /** 命令队列 */
  private commands: Command[] = [];

  /** 是否已应用 */
  private applied: boolean = false;

  /**
   * 创建实体（延迟执行）
   * @param callback 可选回调函数，接收创建的Entity ID
   */
  spawn(callback?: (entity: EntityId) => void): void {
    this.ensureNotApplied();
    this.commands.push(new CreateEntityCommand(callback));
  }

  /**
   * 销毁实体（延迟执行）
   * @param entity Entity ID
   */
  despawn(entity: EntityId): void {
    this.ensureNotApplied();
    this.commands.push(new DestroyEntityCommand(entity));
  }

  /**
   * 添加组件（延迟执行）
   * @param entity Entity ID
   * @param type 组件类
   * @param data 组件数据
   */
  addComponent<T>(entity: EntityId, type: ComponentClass<T>, data?: Partial<T>): void {
    this.ensureNotApplied();
    this.commands.push(new AddComponentCommand(entity, type, data));
  }

  /**
   * 移除组件（延迟执行）
   * @param entity Entity ID
   * @param type 组件类
   */
  removeComponent<T>(entity: EntityId, type: ComponentClass<T>): void {
    this.ensureNotApplied();
    this.commands.push(new RemoveComponentCommand(entity, type));
  }

  /**
   * 插入全局资源（延迟执行）
   * @param resource 资源实例
   */
  insertResource<T>(resource: T): void {
    this.ensureNotApplied();
    this.commands.push(new InsertResourceCommand(resource));
  }

  /**
   * 移除全局资源（延迟执行）
   * @param type 资源类
   */
  removeResource<T>(type: new () => T): void {
    this.ensureNotApplied();
    this.commands.push(new RemoveResourceCommand(type));
  }

  /**
   * 应用所有命令到World
   * @param world World实例
   * @remarks
   * 按照命令添加的顺序依次执行
   */
  apply(world: World): void {
    this.ensureNotApplied();

    for (const command of this.commands) {
      command.execute(world);
    }

    this.applied = true;
  }

  /**
   * 清空命令队列
   * @remarks
   * 清除所有未执行的命令，重置应用状态
   */
  clear(): void {
    this.commands = [];
    this.applied = false;
  }

  /**
   * 获取命令数量
   * @returns 队列中的命令数量
   */
  getCommandCount(): number {
    return this.commands.length;
  }

  /**
   * 检查是否为空
   * @returns 是否没有命令
   */
  isEmpty(): boolean {
    return this.commands.length === 0;
  }

  /**
   * 检查是否已应用
   * @returns 是否已执行apply()
   */
  isApplied(): boolean {
    return this.applied;
  }

  /**
   * 确保未应用（用于防止重复操作）
   * @throws 如果已应用
   */
  private ensureNotApplied(): void {
    if (this.applied) {
      throw new Error('CommandBuffer has already been applied. Create a new instance.');
    }
  }

  /**
   * 获取命令类型统计
   * @returns 各类型命令的数量
   */
  getStats(): {
    createEntity: number;
    destroyEntity: number;
    addComponent: number;
    removeComponent: number;
    insertResource: number;
    removeResource: number;
    total: number;
  } {
    const stats = {
      createEntity: 0,
      destroyEntity: 0,
      addComponent: 0,
      removeComponent: 0,
      insertResource: 0,
      removeResource: 0,
      total: this.commands.length,
    };

    for (const command of this.commands) {
      switch (command.type) {
        case CommandType.CREATE_ENTITY:
          stats.createEntity++;
          break;
        case CommandType.DESTROY_ENTITY:
          stats.destroyEntity++;
          break;
        case CommandType.ADD_COMPONENT:
          stats.addComponent++;
          break;
        case CommandType.REMOVE_COMPONENT:
          stats.removeComponent++;
          break;
        case CommandType.INSERT_RESOURCE:
          stats.insertResource++;
          break;
        case CommandType.REMOVE_RESOURCE:
          stats.removeResource++;
          break;
      }
    }

    return stats;
  }
}
