import { describe, it, expect, beforeEach } from '@jest/globals';
import { EntityId, INVALID_ENTITY, MAX_INDEX } from '../../../src/ecs/entity-id';
import { EntityManager } from '../../../src/ecs/entity-manager';

describe('EntityId - 实体ID工具', () => {
  describe('create - 创建ID', () => {
    it('应该创建有效的Entity ID', () => {
      const id = EntityId.create(100, 5);
      expect(EntityId.isValid(id)).toBe(true);
      expect(EntityId.index(id)).toBe(100);
      expect(EntityId.generation(id)).toBe(5);
    });

    it('应该支持最大索引值', () => {
      const id = EntityId.create(MAX_INDEX, 0);
      expect(EntityId.index(id)).toBe(MAX_INDEX);
    });

    it('索引超限应该抛出错误', () => {
      expect(() => EntityId.create(MAX_INDEX + 1, 0)).toThrow();
    });

    it('版本号超限应该抛出错误', () => {
      expect(() => EntityId.create(0, 4096)).toThrow();
    });
  });

  describe('isValid - 有效性检查', () => {
    it('有效ID应该返回true', () => {
      const id = EntityId.create(0, 0);
      expect(EntityId.isValid(id)).toBe(true);
    });

    it('INVALID_ENTITY应该返回false', () => {
      expect(EntityId.isValid(INVALID_ENTITY)).toBe(false);
    });
  });

  describe('equals - 相等比较', () => {
    it('相同ID应该相等', () => {
      const id1 = EntityId.create(10, 1);
      const id2 = EntityId.create(10, 1);
      expect(EntityId.equals(id1, id2)).toBe(true);
    });

    it('不同索引应该不相等', () => {
      const id1 = EntityId.create(10, 1);
      const id2 = EntityId.create(11, 1);
      expect(EntityId.equals(id1, id2)).toBe(false);
    });

    it('不同版本号应该不相等', () => {
      const id1 = EntityId.create(10, 1);
      const id2 = EntityId.create(10, 2);
      expect(EntityId.equals(id1, id2)).toBe(false);
    });
  });
});

describe('EntityManager - 实体管理器', () => {
  let manager: EntityManager;

  beforeEach(() => {
    manager = new EntityManager();
  });

  describe('create - 创建实体', () => {
    it('应该创建实体并返回有效ID', () => {
      const entity = manager.create();
      expect(EntityId.isValid(entity)).toBe(true);
      expect(manager.isAlive(entity)).toBe(true);
    });

    it('应该生成递增的索引', () => {
      const e1 = manager.create();
      const e2 = manager.create();
      const e3 = manager.create();

      expect(EntityId.index(e2)).toBe(EntityId.index(e1) + 1);
      expect(EntityId.index(e3)).toBe(EntityId.index(e2) + 1);
    });

    it('应该增加存活计数', () => {
      expect(manager.getAliveCount()).toBe(0);
      manager.create();
      expect(manager.getAliveCount()).toBe(1);
      manager.create();
      expect(manager.getAliveCount()).toBe(2);
    });
  });

  describe('destroy - 销毁实体', () => {
    it('应该销毁存活的实体', () => {
      const entity = manager.create();
      expect(manager.destroy(entity)).toBe(true);
      expect(manager.isAlive(entity)).toBe(false);
    });

    it('应该减少存活计数', () => {
      const entity = manager.create();
      expect(manager.getAliveCount()).toBe(1);
      manager.destroy(entity);
      expect(manager.getAliveCount()).toBe(0);
    });

    it('销毁不存在的实体应该返回false', () => {
      const fakeEntity = EntityId.create(999, 0);
      expect(manager.destroy(fakeEntity)).toBe(false);
    });

    it('重复销毁应该返回false', () => {
      const entity = manager.create();
      manager.destroy(entity);
      expect(manager.destroy(entity)).toBe(false);
    });
  });

  describe('版本号管理', () => {
    it('索引复用时应该递增版本号', () => {
      const e1 = manager.create();
      const index1 = EntityId.index(e1);
      const gen1 = EntityId.generation(e1);

      manager.destroy(e1);

      const e2 = manager.create();
      const index2 = EntityId.index(e2);
      const gen2 = EntityId.generation(e2);

      expect(index2).toBe(index1); // 索引复用
      expect(gen2).toBe(gen1 + 1); // 版本号递增
    });

    it('旧版本ID不应该被认为是存活的', () => {
      const e1 = manager.create();
      manager.destroy(e1);

      const e2 = manager.create(); // 复用索引

      expect(manager.isAlive(e1)).toBe(false); // 旧版本
      expect(manager.isAlive(e2)).toBe(true); // 新版本
    });
  });

  describe('统计信息', () => {
    it('getAliveCount 应该返回正确数量', () => {
      manager.create();
      manager.create();
      const e3 = manager.create();

      expect(manager.getAliveCount()).toBe(3);
      manager.destroy(e3);
      expect(manager.getAliveCount()).toBe(2);
    });

    it('getTotalCount 应该返回总分配数', () => {
      manager.create();
      manager.create();
      expect(manager.getTotalCount()).toBe(2);

      const e3 = manager.create();
      manager.destroy(e3);
      expect(manager.getTotalCount()).toBe(3); // 不减少
    });

    it('getFreeCount 应该返回可复用数量', () => {
      const e1 = manager.create();
      const e2 = manager.create();

      expect(manager.getFreeCount()).toBe(0);

      manager.destroy(e1);
      expect(manager.getFreeCount()).toBe(1);

      manager.destroy(e2);
      expect(manager.getFreeCount()).toBe(2);
    });

    it('getStats 应该返回完整统计', () => {
      manager.create();
      const e2 = manager.create();
      manager.destroy(e2);

      const stats = manager.getStats();
      expect(stats.alive).toBe(1);
      expect(stats.total).toBe(2);
      expect(stats.free).toBe(1);
    });
  });

  describe('getAliveEntities - 获取所有存活实体', () => {
    it('应该返回所有存活实体', () => {
      const e1 = manager.create();
      const e2 = manager.create();
      const e3 = manager.create();

      manager.destroy(e2);

      const alive = manager.getAliveEntities();
      expect(alive).toHaveLength(2);
      expect(alive).toContain(e1);
      expect(alive).toContain(e3);
      expect(alive).not.toContain(e2);
    });
  });

  describe('clear - 清空管理器', () => {
    it('应该清空所有实体', () => {
      manager.create();
      manager.create();
      manager.create();

      manager.clear();

      expect(manager.getAliveCount()).toBe(0);
      expect(manager.getTotalCount()).toBe(0);
      expect(manager.getFreeCount()).toBe(0);
    });
  });

  describe('性能测试', () => {
    it('应该支持创建大量实体', () => {
      const count = 10000;
      const entities = [];

      for (let i = 0; i < count; i++) {
        entities.push(manager.create());
      }

      expect(manager.getAliveCount()).toBe(count);
    });

    it('应该高效地复用索引', () => {
      const count = 1000;

      // 创建并销毁
      for (let i = 0; i < count; i++) {
        const entity = manager.create();
        manager.destroy(entity);
      }

      // 索引不应该无限增长
      expect(manager.getTotalCount()).toBeLessThanOrEqual(count);
    });
  });
});
