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
 * **生命周期**:
 * - 创建 CommandBuffer
 * - 添加命令（spawn, despawn, addComponent 等）
 * - 调用 apply(world) 执行所有命令
 * - 调用 clear() 重置状态以便复用
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
 * cmdBuffer.clear(); // 重置以便下一帧复用
 * ```
 */
export class CommandBuffer {
  /** 命令队列 */
  private commands: Command[] = [];

  /** 是否已应用 */
  private applied: boolean = false;

  /** 绑定的 World 实例（可选，用于验证） */
  private boundWorld: World | null = null;

  /**
   * 创建 CommandBuffer
   * @param world 可选的绑定 World 实例，如果提供则 apply() 时会验证
   */
  constructor(world?: World) {
    this.boundWorld = world ?? null;
  }

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
   * @param world World实例（如果构造时绑定了World，则此参数可选）
   * @throws 如果已应用或World实例不匹配
   * @remarks
   * 按照命令添加的顺序依次执行
   */
  apply(world?: World): void {
    this.ensureNotApplied();

    // 确定要使用的 World 实例
    const targetWorld = world ?? this.boundWorld;
    if (!targetWorld) {
      throw new Error(
        'CommandBuffer.apply: No World instance provided. Either pass a World to apply() or bind one in the constructor.'
      );
    }

    // 如果绑定了 World，验证是否匹配
    if (this.boundWorld && world && this.boundWorld !== world) {
      throw new Error(
        'CommandBuffer.apply: World instance mismatch. The provided World does not match the bound World.'
      );
    }

    for (const command of this.commands) {
      command.execute(targetWorld);
    }

    this.applied = true;
  }

  /**
   * 清空命令队列并重置状态以便复用
   * @remarks
   * 清除所有命令并重置应用状态，使 CommandBuffer 可以被复用。
   * 这是推荐的复用方式，而不是创建新的 CommandBuffer 实例。
   */
  clear(): void {
    this.commands.length = 0; // 保留数组引用，避免 GC
    this.applied = false;
  }

  /**
   * 重置 CommandBuffer（包括解绑 World）
   * @remarks
   * 完全重置 CommandBuffer 状态，包括解除 World 绑定。
   * 如果只需要清空命令队列，使用 clear() 更高效。
   */
  reset(): void {
    this.commands.length = 0;
    this.applied = false;
    this.boundWorld = null;
  }

  /**
   * 绑定 World 实例
   * @param world World实例
   * @remarks
   * 绑定后，apply() 可以不传参数，且会验证传入的 World 是否匹配
   */
  bindWorld(world: World): void {
    this.boundWorld = world;
  }

  /**
   * 获取绑定的 World 实例
   * @returns 绑定的 World 实例，如果未绑定返回 null
   */
  getBoundWorld(): World | null {
    return this.boundWorld;
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
