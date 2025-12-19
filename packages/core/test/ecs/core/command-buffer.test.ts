/**
 * CommandBuffer 测试
 * 测试延迟命令队列功能
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { CommandBuffer } from '../../../src/ecs/core/command-buffer';
import { World } from '../../../src/ecs/core/world';
import type { EntityId } from '../../../src/ecs/core/entity-id';

// 测试用组件
class Position {
  x = 0;
  y = 0;
  z = 0;
}

class Velocity {
  x = 0;
  y = 0;
  z = 0;
}

class TestResource {
  value = 42;
}

describe('CommandBuffer', () => {
  let world: World;
  let cmdBuffer: CommandBuffer;

  beforeEach(() => {
    world = new World();
    world.registerComponent(Position);
    world.registerComponent(Velocity);
    cmdBuffer = new CommandBuffer();
  });

  describe('构造函数', () => {
    it('应该创建空的命令缓冲区', () => {
      expect(cmdBuffer.isEmpty()).toBe(true);
      expect(cmdBuffer.getCommandCount()).toBe(0);
      expect(cmdBuffer.isApplied()).toBe(false);
    });
  });

  describe('spawn 方法', () => {
    it('应该添加创建实体命令', () => {
      cmdBuffer.spawn();

      expect(cmdBuffer.getCommandCount()).toBe(1);
      expect(cmdBuffer.isEmpty()).toBe(false);
    });

    it('应该支持回调函数', () => {
      let createdEntity: EntityId | null = null;

      cmdBuffer.spawn((entity) => {
        createdEntity = entity;
      });

      cmdBuffer.apply(world);

      expect(createdEntity).not.toBeNull();
      expect(world.isAlive(createdEntity!)).toBe(true);
    });

    it('应该支持多个创建命令', () => {
      cmdBuffer.spawn();
      cmdBuffer.spawn();
      cmdBuffer.spawn();

      expect(cmdBuffer.getCommandCount()).toBe(3);

      cmdBuffer.apply(world);

      expect(world.getEntityCount()).toBe(3);
    });
  });

  describe('despawn 方法', () => {
    it('应该添加销毁实体命令', () => {
      const entity = world.createEntity();

      cmdBuffer.despawn(entity);

      expect(cmdBuffer.getCommandCount()).toBe(1);
    });

    it('应该在应用后销毁实体', () => {
      const entity = world.createEntity();

      cmdBuffer.despawn(entity);
      cmdBuffer.apply(world);

      expect(world.isAlive(entity)).toBe(false);
    });

    it('应该支持销毁多个实体', () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      cmdBuffer.despawn(entity1);
      cmdBuffer.despawn(entity3);
      cmdBuffer.apply(world);

      expect(world.isAlive(entity1)).toBe(false);
      expect(world.isAlive(entity2)).toBe(true);
      expect(world.isAlive(entity3)).toBe(false);
    });
  });

  describe('addComponent 方法', () => {
    it('应该添加组件命令', () => {
      const entity = world.createEntity();

      cmdBuffer.addComponent(entity, Position, { x: 10, y: 20, z: 30 });

      expect(cmdBuffer.getCommandCount()).toBe(1);
    });

    it('应该在应用后添加组件', () => {
      const entity = world.createEntity();

      cmdBuffer.addComponent(entity, Position, { x: 10, y: 20, z: 30 });
      cmdBuffer.apply(world);

      const pos = world.getComponent(entity, Position);
      expect(pos).toBeDefined();
      expect(pos!.x).toBe(10);
      expect(pos!.y).toBe(20);
      expect(pos!.z).toBe(30);
    });

    it('应该支持不带数据的组件', () => {
      const entity = world.createEntity();

      cmdBuffer.addComponent(entity, Position);
      cmdBuffer.apply(world);

      const pos = world.getComponent(entity, Position);
      expect(pos).toBeDefined();
      expect(pos!.x).toBe(0);
    });
  });

  describe('removeComponent 方法', () => {
    it('应该添加移除组件命令', () => {
      const entity = world.createEntity();
      world.addComponent(entity, Position, { x: 10 });

      cmdBuffer.removeComponent(entity, Position);

      expect(cmdBuffer.getCommandCount()).toBe(1);
    });

    it('应该在应用后移除组件', () => {
      const entity = world.createEntity();
      world.addComponent(entity, Position, { x: 10 });

      cmdBuffer.removeComponent(entity, Position);
      cmdBuffer.apply(world);

      expect(world.hasComponent(entity, Position)).toBe(false);
    });
  });

  describe('insertResource 方法', () => {
    it('应该添加插入资源命令', () => {
      const resource = new TestResource();

      cmdBuffer.insertResource(resource);

      expect(cmdBuffer.getCommandCount()).toBe(1);
    });

    it('应该在应用后插入资源', () => {
      const resource = new TestResource();
      resource.value = 100;

      cmdBuffer.insertResource(resource);
      cmdBuffer.apply(world);

      const retrieved = world.getResource(TestResource);
      expect(retrieved).toBeDefined();
      expect(retrieved!.value).toBe(100);
    });
  });

  describe('removeResource 方法', () => {
    it('应该添加移除资源命令', () => {
      world.insertResource(new TestResource());

      cmdBuffer.removeResource(TestResource);

      expect(cmdBuffer.getCommandCount()).toBe(1);
    });

    it('应该在应用后移除资源', () => {
      world.insertResource(new TestResource());

      cmdBuffer.removeResource(TestResource);
      cmdBuffer.apply(world);

      expect(world.getResource(TestResource)).toBeUndefined();
    });
  });

  describe('apply 方法', () => {
    it('应该按顺序执行所有命令', () => {
      const order: string[] = [];

      cmdBuffer.spawn((entity) => {
        order.push('spawn');
        cmdBuffer.addComponent(entity, Position, { x: 10 });
      });

      // 注意：回调中的 addComponent 不会被执行，因为它在 apply 之后添加
      cmdBuffer.apply(world);

      expect(order).toContain('spawn');
    });

    it('应该标记为已应用', () => {
      cmdBuffer.spawn();
      cmdBuffer.apply(world);

      expect(cmdBuffer.isApplied()).toBe(true);
    });

    it('应该在已应用后抛出错误', () => {
      cmdBuffer.spawn();
      cmdBuffer.apply(world);

      expect(() => cmdBuffer.apply(world)).toThrow('CommandBuffer has already been applied');
    });

    it('应该在已应用后阻止添加新命令', () => {
      cmdBuffer.apply(world);

      expect(() => cmdBuffer.spawn()).toThrow('CommandBuffer has already been applied');
      expect(() => cmdBuffer.despawn(0)).toThrow('CommandBuffer has already been applied');
    });
  });

  describe('clear 方法', () => {
    it('应该清空命令队列', () => {
      cmdBuffer.spawn();
      cmdBuffer.spawn();
      cmdBuffer.spawn();

      cmdBuffer.clear();

      expect(cmdBuffer.isEmpty()).toBe(true);
      expect(cmdBuffer.getCommandCount()).toBe(0);
    });

    it('应该重置应用状态', () => {
      cmdBuffer.spawn();
      cmdBuffer.apply(world);

      cmdBuffer.clear();

      expect(cmdBuffer.isApplied()).toBe(false);
    });

    it('应该允许清空后重新使用', () => {
      cmdBuffer.spawn();
      cmdBuffer.apply(world);

      cmdBuffer.clear();
      cmdBuffer.spawn();
      cmdBuffer.apply(world);

      expect(world.getEntityCount()).toBe(2);
    });
  });

  describe('getCommandCount 方法', () => {
    it('应该返回正确的命令数量', () => {
      expect(cmdBuffer.getCommandCount()).toBe(0);

      cmdBuffer.spawn();
      expect(cmdBuffer.getCommandCount()).toBe(1);

      cmdBuffer.spawn();
      expect(cmdBuffer.getCommandCount()).toBe(2);

      const entity = world.createEntity();
      cmdBuffer.addComponent(entity, Position);
      expect(cmdBuffer.getCommandCount()).toBe(3);
    });
  });

  describe('isEmpty 方法', () => {
    it('应该在空时返回 true', () => {
      expect(cmdBuffer.isEmpty()).toBe(true);
    });

    it('应该在有命令时返回 false', () => {
      cmdBuffer.spawn();
      expect(cmdBuffer.isEmpty()).toBe(false);
    });
  });

  describe('getStats 方法', () => {
    it('应该返回正确的统计信息', () => {
      const entity = world.createEntity();

      cmdBuffer.spawn();
      cmdBuffer.spawn();
      cmdBuffer.despawn(entity);
      cmdBuffer.addComponent(entity, Position);
      cmdBuffer.addComponent(entity, Velocity);
      cmdBuffer.removeComponent(entity, Position);
      cmdBuffer.insertResource(new TestResource());
      cmdBuffer.removeResource(TestResource);

      const stats = cmdBuffer.getStats();

      expect(stats.createEntity).toBe(2);
      expect(stats.destroyEntity).toBe(1);
      expect(stats.addComponent).toBe(2);
      expect(stats.removeComponent).toBe(1);
      expect(stats.insertResource).toBe(1);
      expect(stats.removeResource).toBe(1);
      expect(stats.total).toBe(8);
    });

    it('应该在空缓冲区时返回全零', () => {
      const stats = cmdBuffer.getStats();

      expect(stats.createEntity).toBe(0);
      expect(stats.destroyEntity).toBe(0);
      expect(stats.addComponent).toBe(0);
      expect(stats.removeComponent).toBe(0);
      expect(stats.insertResource).toBe(0);
      expect(stats.removeResource).toBe(0);
      expect(stats.total).toBe(0);
    });
  });

  describe('实际使用场景', () => {
    it('应该支持在遍历时安全地创建实体', () => {
      // 创建初始实体
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      world.addComponent(entity1, Position, { x: 1 });
      world.addComponent(entity2, Position, { x: 2 });

      // 模拟在遍历时创建新实体
      const query = world.query({ all: [Position] });
      query.forEach(() => {
        cmdBuffer.spawn((newEntity) => {
          // 这里的回调会在 apply 时执行
        });
      });

      // 应用命令
      cmdBuffer.apply(world);

      // 应该有 4 个实体（2 个原始 + 2 个新创建）
      expect(world.getEntityCount()).toBe(4);
    });

    it('应该支持在遍历时安全地销毁实体', () => {
      // 创建实体
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();
      world.addComponent(entity1, Position, { x: 1 });
      world.addComponent(entity2, Position, { x: 2 });
      world.addComponent(entity3, Position, { x: 3 });

      // 模拟在遍历时标记要销毁的实体
      const toDestroy: EntityId[] = [];
      const query = world.query({ all: [Position] });
      query.forEach((entity, [pos]) => {
        if ((pos as Position).x > 1) {
          toDestroy.push(entity);
        }
      });

      // 添加销毁命令
      for (const entity of toDestroy) {
        cmdBuffer.despawn(entity);
      }

      // 应用命令
      cmdBuffer.apply(world);

      // 应该只剩 1 个实体
      expect(world.getEntityCount()).toBe(1);
      expect(world.isAlive(entity1)).toBe(true);
    });

    it('应该支持复杂的命令序列', () => {
      // 创建实体并添加组件
      cmdBuffer.spawn((entity) => {
        // 在回调中可以获取新创建的实体 ID
      });

      // 对现有实体操作
      const existingEntity = world.createEntity();
      cmdBuffer.addComponent(existingEntity, Position, { x: 100 });
      cmdBuffer.addComponent(existingEntity, Velocity, { x: 10 });

      // 添加资源
      cmdBuffer.insertResource(new TestResource());

      // 应用所有命令
      cmdBuffer.apply(world);

      // 验证结果
      expect(world.getEntityCount()).toBe(2);
      expect(world.hasComponent(existingEntity, Position)).toBe(true);
      expect(world.hasComponent(existingEntity, Velocity)).toBe(true);
      expect(world.getResource(TestResource)).toBeDefined();
    });
  });
});
