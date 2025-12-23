import { describe, it, expect, beforeEach } from '@jest/globals';
import { World } from '../../src/ecs/world';
import { EntityId } from '../../src/ecs/entity-id';
import { CommandBuffer } from '../../src/ecs/command-buffer';

// 测试组件类
class Position {
  x: number = 0;
  y: number = 0;
  z: number = 0;
}

class Velocity {
  x: number = 0;
  y: number = 0;
  z: number = 0;
}

class Health {
  current: number = 100;
  max: number = 100;
}

class Dead {}

describe('World - ECS中央调度器', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  describe('组件注册', () => {
    it('应该注册组件类型', () => {
      const id1 = world.registerComponent(Position);
      const id2 = world.registerComponent(Velocity);

      expect(id1).toBe(0);
      expect(id2).toBe(1);
    });

    it('重复注册应该返回相同ID', () => {
      const id1 = world.registerComponent(Position);
      const id2 = world.registerComponent(Position);

      expect(id1).toBe(id2);
    });
  });

  describe('实体生命周期', () => {
    it('应该创建实体', () => {
      const entity = world.createEntity();
      expect(EntityId.isValid(entity)).toBe(true);
      expect(world.isAlive(entity)).toBe(true);
    });

    it('应该销毁实体', () => {
      const entity = world.createEntity();
      expect(world.destroyEntity(entity)).toBe(true);
      expect(world.isAlive(entity)).toBe(false);
    });

    it('销毁不存在的实体应该返回false', () => {
      const fakeEntity = EntityId.create(999, 0);
      expect(world.destroyEntity(fakeEntity)).toBe(false);
    });

    it('应该获取所有存活的实体', () => {
      const e1 = world.createEntity();
      const e2 = world.createEntity();
      const e3 = world.createEntity();

      world.destroyEntity(e2);

      const allEntities = world.getAllEntities();
      expect(allEntities).toHaveLength(2);
      expect(allEntities).toContain(e1);
      expect(allEntities).toContain(e3);
      expect(allEntities).not.toContain(e2);
    });

    it('应该统计实体数量', () => {
      expect(world.getEntityCount()).toBe(0);

      world.createEntity();
      world.createEntity();
      expect(world.getEntityCount()).toBe(2);

      const e3 = world.createEntity();
      world.destroyEntity(e3);
      expect(world.getEntityCount()).toBe(2);
    });
  });

  describe('组件管理', () => {
    let entity: EntityId;

    beforeEach(() => {
      world.registerComponent(Position);
      world.registerComponent(Velocity);
      world.registerComponent(Health);
      entity = world.createEntity();
    });

    it('应该添加组件', () => {
      world.addComponent(entity, Position, { x: 10, y: 20, z: 30 });

      const pos = world.getComponent(entity, Position);
      expect(pos).toBeDefined();
      expect(pos!.x).toBe(10);
      expect(pos!.y).toBe(20);
      expect(pos!.z).toBe(30);
    });

    it('应该添加多个组件', () => {
      world.addComponent(entity, Position, { x: 5 });
      world.addComponent(entity, Velocity, { x: 1 });
      world.addComponent(entity, Health, { current: 50 });

      expect(world.hasComponent(entity, Position)).toBe(true);
      expect(world.hasComponent(entity, Velocity)).toBe(true);
      expect(world.hasComponent(entity, Health)).toBe(true);
    });

    it('应该移除组件', () => {
      world.addComponent(entity, Position);
      expect(world.hasComponent(entity, Position)).toBe(true);

      world.removeComponent(entity, Position);
      expect(world.hasComponent(entity, Position)).toBe(false);
    });

    it('重复添加组件应该更新数据', () => {
      world.addComponent(entity, Position, { x: 10 });
      world.addComponent(entity, Position, { y: 20 });

      const pos = world.getComponent(entity, Position);
      expect(pos!.x).toBe(10); // 保留
      expect(pos!.y).toBe(20); // 更新
    });

    it('hasComponent应该正确判断', () => {
      expect(world.hasComponent(entity, Position)).toBe(false);

      world.addComponent(entity, Position);
      expect(world.hasComponent(entity, Position)).toBe(true);

      world.removeComponent(entity, Position);
      expect(world.hasComponent(entity, Position)).toBe(false);
    });

    it('对不存活的实体添加组件应该返回false', () => {
      const deadEntity = world.createEntity();
      world.destroyEntity(deadEntity);

      expect(world.addComponent(deadEntity, Position)).toBe(false);
    });

    it('对不存活的实体移除组件应该返回false', () => {
      const deadEntity = world.createEntity();
      world.addComponent(deadEntity, Position);
      world.destroyEntity(deadEntity);

      expect(world.removeComponent(deadEntity, Position)).toBe(false);
    });

    it('移除未注册的组件类型应该返回false', () => {
      class UnregisteredComponent {}
      expect(world.removeComponent(entity, UnregisteredComponent)).toBe(false);
    });

    it('移除实体没有的组件应该返回false', () => {
      // 确保 Velocity 已注册但实体没有该组件
      expect(world.hasComponent(entity, Velocity)).toBe(false);
      expect(world.removeComponent(entity, Velocity)).toBe(false);
    });

    it('对不存在的实体获取组件应该返回undefined', () => {
      const fakeEntity = EntityId.create(999, 0);
      expect(world.getComponent(fakeEntity, Position)).toBeUndefined();
    });

    it('获取未注册的组件类型应该返回undefined', () => {
      class UnregisteredComponent {}
      expect(world.getComponent(entity, UnregisteredComponent)).toBeUndefined();
    });

    it('添加组件实例而不是Partial数据', () => {
      const posInstance = new Position();
      posInstance.x = 100;
      posInstance.y = 200;
      posInstance.z = 300;

      // 传入完整的组件实例
      world.addComponent(entity, Position, posInstance);

      const retrieved = world.getComponent(entity, Position);
      expect(retrieved).toBe(posInstance); // 应该是同一个实例
      expect(retrieved!.x).toBe(100);
    });
  });

  describe('查询系统', () => {
    beforeEach(() => {
      world.registerComponent(Position);
      world.registerComponent(Velocity);
      world.registerComponent(Health);
      world.registerComponent(Dead);
    });

    it('应该查询包含指定组件的实体', () => {
      const e1 = world.createEntity();
      world.addComponent(e1, Position, { x: 10 });
      world.addComponent(e1, Velocity, { x: 1 });

      const e2 = world.createEntity();
      world.addComponent(e2, Position, { x: 20 });

      const query = world.query({ all: [Position, Velocity] });

      const results = query.collect();
      expect(results).toHaveLength(1);
      expect(results[0].entity).toBe(e1);
    });

    it('应该支持排除组件查询', () => {
      const e1 = world.createEntity();
      world.addComponent(e1, Position);
      world.addComponent(e1, Health);

      const e2 = world.createEntity();
      world.addComponent(e2, Position);
      world.addComponent(e2, Health);
      world.addComponent(e2, Dead);

      const query = world.query({ all: [Position, Health], none: [Dead] });

      const results = query.collect();
      expect(results).toHaveLength(1);
      expect(results[0].entity).toBe(e1);
    });

    it('forEach应该遍历所有匹配实体', () => {
      const e1 = world.createEntity();
      world.addComponent(e1, Position, { x: 10 });
      world.addComponent(e1, Velocity, { x: 1 });

      const e2 = world.createEntity();
      world.addComponent(e2, Position, { x: 20 });
      world.addComponent(e2, Velocity, { x: 2 });

      const query = world.query({ all: [Position, Velocity] });

      const visited: EntityId[] = [];
      query.forEach((entity, [pos, vel]) => {
        visited.push(entity);
        pos.x += vel.x;
      });

      expect(visited).toHaveLength(2);
      expect(world.getComponent(e1, Position)!.x).toBe(11);
      expect(world.getComponent(e2, Position)!.x).toBe(22);
    });

    it('查询应该动态更新', () => {
      const query = world.query({ all: [Position] });

      expect(query.getEntityCount()).toBe(0);

      const e1 = world.createEntity();
      world.addComponent(e1, Position);

      // 注意：由于查询在创建时已经缓存了Archetype，新实体会自动匹配
      expect(query.getEntityCount()).toBeGreaterThanOrEqual(1);
    });

    it('应该支持 getQueryCount 方法', () => {
      expect(world.getQueryCount()).toBe(0);

      world.query({ all: [Position] });
      expect(world.getQueryCount()).toBe(1);

      world.query({ all: [Velocity] });
      expect(world.getQueryCount()).toBe(2);

      world.query({ all: [Position, Velocity] });
      expect(world.getQueryCount()).toBe(3);
    });

    it('应该支持 removeQuery 方法', () => {
      const query1 = world.query({ all: [Position] });
      world.query({ all: [Velocity] });

      expect(world.getQueryCount()).toBe(2);

      const result = world.removeQuery(query1);
      expect(result).toBe(true);
      expect(world.getQueryCount()).toBe(1);

      // 移除不存在的查询应该返回 false
      const result2 = world.removeQuery(query1);
      expect(result2).toBe(false);
    });
  });

  describe('Archetype迁移', () => {
    beforeEach(() => {
      world.registerComponent(Position);
      world.registerComponent(Velocity);
    });

    it('添加组件应该迁移到新Archetype', () => {
      const entity = world.createEntity();
      world.addComponent(entity, Position);

      // 添加组件触发迁移
      world.addComponent(entity, Velocity);

      // 应该保留原有组件
      expect(world.hasComponent(entity, Position)).toBe(true);
      expect(world.hasComponent(entity, Velocity)).toBe(true);
    });

    it('移除组件应该迁移到新Archetype', () => {
      const entity = world.createEntity();
      world.addComponent(entity, Position);
      world.addComponent(entity, Velocity);

      // 移除组件触发迁移
      world.removeComponent(entity, Position);

      expect(world.hasComponent(entity, Position)).toBe(false);
      expect(world.hasComponent(entity, Velocity)).toBe(true);
    });
  });

  describe('资源管理', () => {
    class GameTime {
      deltaTime: number = 0;
      totalTime: number = 0;
    }

    it('应该插入资源', () => {
      const time = new GameTime();
      time.deltaTime = 0.016;

      world.insertResource(time);

      const retrieved = world.getResource(GameTime);
      expect(retrieved).toBe(time);
      expect(retrieved!.deltaTime).toBe(0.016);
    });

    it('应该移除资源', () => {
      world.insertResource(new GameTime());
      expect(world.getResource(GameTime)).toBeDefined();

      world.removeResource(GameTime);
      expect(world.getResource(GameTime)).toBeUndefined();
    });

    it('不存在的资源应该返回undefined', () => {
      expect(world.getResource(GameTime)).toBeUndefined();
    });
  });

  describe('统计信息', () => {
    it('getStats应该返回正确统计', () => {
      world.registerComponent(Position);
      world.registerComponent(Velocity);

      const e1 = world.createEntity();
      world.addComponent(e1, Position);

      const e2 = world.createEntity();
      world.addComponent(e2, Position);
      world.addComponent(e2, Velocity);

      const stats = world.getStats();
      expect(stats.entities).toBe(2);
      expect(stats.componentTypes).toBe(2);
      expect(stats.archetypes).toBeGreaterThanOrEqual(2); // 至少有空Archetype和两个组件组合
    });
  });

  describe('clear - 清空World', () => {
    it('应该清空所有实体和组件', () => {
      world.registerComponent(Position);

      world.createEntity();
      world.createEntity();

      world.clear();

      expect(world.getEntityCount()).toBe(0);
    });
  });

  describe('复杂场景', () => {
    beforeEach(() => {
      world.registerComponent(Position);
      world.registerComponent(Velocity);
      world.registerComponent(Health);
    });

    it('应该处理多个实体的复杂操作', () => {
      // 创建多个实体
      const player = world.createEntity();
      world.addComponent(player, Position, { x: 0, y: 0, z: 0 });
      world.addComponent(player, Velocity, { x: 1, y: 0, z: 0 });
      world.addComponent(player, Health, { current: 100, max: 100 });

      const enemy1 = world.createEntity();
      world.addComponent(enemy1, Position, { x: 10, y: 0, z: 0 });
      world.addComponent(enemy1, Velocity, { x: -1, y: 0, z: 0 });
      world.addComponent(enemy1, Health, { current: 50, max: 50 });

      const enemy2 = world.createEntity();
      world.addComponent(enemy2, Position, { x: 20, y: 0, z: 0 });
      world.addComponent(enemy2, Health, { current: 30, max: 50 });

      // 查询所有可移动实体
      const movableQuery = world.query({ all: [Position, Velocity] });
      expect(movableQuery.getEntityCount()).toBe(2);

      // 更新移动
      movableQuery.forEach((entity, [pos, vel]) => {
        pos.x += vel.x;
      });

      expect(world.getComponent(player, Position)!.x).toBe(1);
      expect(world.getComponent(enemy1, Position)!.x).toBe(9);
      expect(world.getComponent(enemy2, Position)!.x).toBe(20); // 没有移动
    });
  });
});

describe('CommandBuffer - 命令缓冲', () => {
  let world: World;
  let cmdBuffer: CommandBuffer;

  beforeEach(() => {
    world = new World();
    cmdBuffer = new CommandBuffer();
    world.registerComponent(Position);
    world.registerComponent(Velocity);
  });

  describe('spawn - 创建实体', () => {
    it('应该延迟创建实体', () => {
      const initialCount = world.getEntityCount();

      cmdBuffer.spawn();
      expect(world.getEntityCount()).toBe(initialCount); // 未立即创建

      cmdBuffer.apply(world);
      expect(world.getEntityCount()).toBe(initialCount + 1); // 应用后创建
    });

    it('应该支持回调获取Entity ID', () => {
      let createdEntity: EntityId | null = null;

      cmdBuffer.spawn((entity) => {
        createdEntity = entity;
      });

      cmdBuffer.apply(world);

      expect(createdEntity).not.toBeNull();
      expect(world.isAlive(createdEntity!)).toBe(true);
    });
  });

  describe('despawn - 销毁实体', () => {
    it('应该延迟销毁实体', () => {
      const entity = world.createEntity();

      cmdBuffer.despawn(entity);
      expect(world.isAlive(entity)).toBe(true); // 未立即销毁

      cmdBuffer.apply(world);
      expect(world.isAlive(entity)).toBe(false); // 应用后销毁
    });
  });

  describe('addComponent - 添加组件', () => {
    it('应该延迟添加组件', () => {
      const entity = world.createEntity();

      cmdBuffer.addComponent(entity, Position, { x: 10 });
      expect(world.hasComponent(entity, Position)).toBe(false); // 未立即添加

      cmdBuffer.apply(world);
      expect(world.hasComponent(entity, Position)).toBe(true); // 应用后添加
      expect(world.getComponent(entity, Position)!.x).toBe(10);
    });
  });

  describe('removeComponent - 移除组件', () => {
    it('应该延迟移除组件', () => {
      const entity = world.createEntity();
      world.addComponent(entity, Position);

      cmdBuffer.removeComponent(entity, Position);
      expect(world.hasComponent(entity, Position)).toBe(true); // 未立即移除

      cmdBuffer.apply(world);
      expect(world.hasComponent(entity, Position)).toBe(false); // 应用后移除
    });
  });

  describe('批量操作', () => {
    it('应该按顺序执行命令', () => {
      let entity1: EntityId | null = null;
      let entity2: EntityId | null = null;

      cmdBuffer.spawn((e) => {
        entity1 = e;
      });
      cmdBuffer.spawn((e) => {
        entity2 = e;
      });

      cmdBuffer.apply(world);

      expect(entity1).not.toBeNull();
      expect(entity2).not.toBeNull();
      expect(world.isAlive(entity1!)).toBe(true);
      expect(world.isAlive(entity2!)).toBe(true);
    });

    it('应该安全地在Query中使用', () => {
      // 创建初始实体
      const e1 = world.createEntity();
      world.addComponent(e1, Position, { x: 0 });
      world.addComponent(e1, Velocity, { x: 10 });

      const query = world.query({ all: [Position, Velocity] });

      // 在遍历中记录命令
      query.forEach((entity, [pos, vel]) => {
        if (pos.x + vel.x > 5) {
          // 触发条件时生成新实体
          cmdBuffer.spawn((bullet) => {
            world.addComponent(bullet, Position, { x: pos.x });
            world.addComponent(bullet, Velocity, { x: 20 });
          });
        }
      });

      const beforeCount = world.getEntityCount();
      cmdBuffer.apply(world);
      const afterCount = world.getEntityCount();

      expect(afterCount).toBe(beforeCount + 1); // 新增了一个实体
    });
  });

  describe('状态管理', () => {
    it('应该跟踪命令数量', () => {
      expect(cmdBuffer.getCommandCount()).toBe(0);

      cmdBuffer.spawn();
      expect(cmdBuffer.getCommandCount()).toBe(1);

      cmdBuffer.spawn();
      cmdBuffer.despawn(EntityId.create(0, 0));
      expect(cmdBuffer.getCommandCount()).toBe(3);
    });

    it('isEmpty应该正确判断', () => {
      expect(cmdBuffer.isEmpty()).toBe(true);

      cmdBuffer.spawn();
      expect(cmdBuffer.isEmpty()).toBe(false);
    });

    it('apply后应该标记为已应用', () => {
      cmdBuffer.spawn();
      expect(cmdBuffer.isApplied()).toBe(false);

      cmdBuffer.apply(world);
      expect(cmdBuffer.isApplied()).toBe(true);
    });

    it('已应用的CommandBuffer不应该接受新命令', () => {
      cmdBuffer.apply(world);

      expect(() => cmdBuffer.spawn()).toThrow();
    });

    it('clear应该重置状态', () => {
      cmdBuffer.spawn();
      cmdBuffer.apply(world);

      cmdBuffer.clear();

      expect(cmdBuffer.isEmpty()).toBe(true);
      expect(cmdBuffer.isApplied()).toBe(false);
    });
  });

  describe('统计信息', () => {
    it('getStats应该返回命令类型统计', () => {
      cmdBuffer.spawn();
      cmdBuffer.spawn();
      cmdBuffer.despawn(EntityId.create(0, 0));

      const stats = cmdBuffer.getStats();
      expect(stats.createEntity).toBe(2);
      expect(stats.destroyEntity).toBe(1);
      expect(stats.total).toBe(3);
    });
  });
});
