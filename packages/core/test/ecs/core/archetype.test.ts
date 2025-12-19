/**
 * Archetype 测试
 * 测试 Archetype 的 SoA 存储和实体管理功能
 */
import { describe, it, expect } from '@jest/globals';
import { Archetype } from '../../../src/ecs/core/archetype';
import { BitSet } from '../../../src/ecs/utils/bitset';
import { EntityId } from '../../../src/ecs/core/entity-id';

describe('Archetype', () => {
  // 创建测试用的组件类型 ID
  const POSITION_TYPE_ID = 0;
  const VELOCITY_TYPE_ID = 1;
  const HEALTH_TYPE_ID = 2;

  // 创建测试用的掩码
  function createMask(...typeIds: number[]): BitSet {
    const mask = new BitSet();
    for (const id of typeIds) {
      mask.set(id);
    }
    return mask;
  }

  describe('构造函数', () => {
    it('应该创建空的 Archetype', () => {
      const mask = createMask(POSITION_TYPE_ID, VELOCITY_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID, VELOCITY_TYPE_ID]);

      expect(archetype.getEntityCount()).toBe(0);
      expect(archetype.isEmpty()).toBe(true);
      expect(archetype.componentTypes).toEqual([POSITION_TYPE_ID, VELOCITY_TYPE_ID]);
    });

    it('应该复制组件类型数组', () => {
      const types = [POSITION_TYPE_ID, VELOCITY_TYPE_ID];
      const mask = createMask(...types);
      const archetype = new Archetype(mask, types);

      types.push(HEALTH_TYPE_ID);

      expect(archetype.componentTypes).toEqual([POSITION_TYPE_ID, VELOCITY_TYPE_ID]);
    });

    it('应该初始化组件存储', () => {
      const mask = createMask(POSITION_TYPE_ID, VELOCITY_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID, VELOCITY_TYPE_ID]);

      expect(archetype.getComponentArray(POSITION_TYPE_ID)).toEqual([]);
      expect(archetype.getComponentArray(VELOCITY_TYPE_ID)).toEqual([]);
    });
  });

  describe('addEntity 方法', () => {
    it('应该添加实体并返回行索引', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);
      const entity = EntityId.create(1, 0);

      const row = archetype.addEntity(entity, [{ x: 10, y: 20, z: 30 }]);

      expect(row).toBe(0);
      expect(archetype.getEntityCount()).toBe(1);
    });

    it('应该正确存储组件数据', () => {
      const mask = createMask(POSITION_TYPE_ID, VELOCITY_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID, VELOCITY_TYPE_ID]);
      const entity = EntityId.create(1, 0);

      const position = { x: 10, y: 20, z: 30 };
      const velocity = { x: 1, y: 2, z: 3 };

      archetype.addEntity(entity, [position, velocity]);

      expect(archetype.getComponent(entity, POSITION_TYPE_ID)).toBe(position);
      expect(archetype.getComponent(entity, VELOCITY_TYPE_ID)).toBe(velocity);
    });

    it('应该支持多个实体', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);

      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);
      const entity3 = EntityId.create(3, 0);

      archetype.addEntity(entity1, [{ x: 1 }]);
      archetype.addEntity(entity2, [{ x: 2 }]);
      archetype.addEntity(entity3, [{ x: 3 }]);

      expect(archetype.getEntityCount()).toBe(3);
      expect(archetype.getComponent(entity1, POSITION_TYPE_ID).x).toBe(1);
      expect(archetype.getComponent(entity2, POSITION_TYPE_ID).x).toBe(2);
      expect(archetype.getComponent(entity3, POSITION_TYPE_ID).x).toBe(3);
    });

    it('应该在组件数据数量不匹配时抛出错误', () => {
      const mask = createMask(POSITION_TYPE_ID, VELOCITY_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID, VELOCITY_TYPE_ID]);
      const entity = EntityId.create(1, 0);

      expect(() => {
        archetype.addEntity(entity, [{ x: 10 }]); // 只提供一个组件
      }).toThrow('Component data mismatch');
    });
  });

  describe('removeEntity 方法', () => {
    it('应该移除实体', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);
      const entity = EntityId.create(1, 0);

      archetype.addEntity(entity, [{ x: 10 }]);
      const result = archetype.removeEntity(entity);

      expect(result).toBe(true);
      expect(archetype.getEntityCount()).toBe(0);
      expect(archetype.hasEntity(entity)).toBe(false);
    });

    it('应该返回 false 如果实体不存在', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);
      const entity = EntityId.create(1, 0);

      const result = archetype.removeEntity(entity);

      expect(result).toBe(false);
    });

    it('应该使用 swap-remove 策略', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);

      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);
      const entity3 = EntityId.create(3, 0);

      archetype.addEntity(entity1, [{ x: 1 }]);
      archetype.addEntity(entity2, [{ x: 2 }]);
      archetype.addEntity(entity3, [{ x: 3 }]);

      // 移除中间的实体
      archetype.removeEntity(entity2);

      expect(archetype.getEntityCount()).toBe(2);
      expect(archetype.hasEntity(entity1)).toBe(true);
      expect(archetype.hasEntity(entity2)).toBe(false);
      expect(archetype.hasEntity(entity3)).toBe(true);

      // entity3 应该被移动到 entity2 的位置
      expect(archetype.getEntityRow(entity3)).toBe(1);
      expect(archetype.getComponent(entity3, POSITION_TYPE_ID).x).toBe(3);
    });

    it('应该正确移除最后一个实体', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);

      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      archetype.addEntity(entity1, [{ x: 1 }]);
      archetype.addEntity(entity2, [{ x: 2 }]);

      archetype.removeEntity(entity2);

      expect(archetype.getEntityCount()).toBe(1);
      expect(archetype.hasEntity(entity1)).toBe(true);
      expect(archetype.getEntityRow(entity1)).toBe(0);
    });
  });

  describe('hasEntity 方法', () => {
    it('应该返回 true 如果实体存在', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);
      const entity = EntityId.create(1, 0);

      archetype.addEntity(entity, [{ x: 10 }]);

      expect(archetype.hasEntity(entity)).toBe(true);
    });

    it('应该返回 false 如果实体不存在', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);
      const entity = EntityId.create(1, 0);

      expect(archetype.hasEntity(entity)).toBe(false);
    });
  });

  describe('getEntityRow 方法', () => {
    it('应该返回实体的行索引', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);

      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      archetype.addEntity(entity1, [{ x: 1 }]);
      archetype.addEntity(entity2, [{ x: 2 }]);

      expect(archetype.getEntityRow(entity1)).toBe(0);
      expect(archetype.getEntityRow(entity2)).toBe(1);
    });

    it('应该返回 -1 如果实体不存在', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);
      const entity = EntityId.create(1, 0);

      expect(archetype.getEntityRow(entity)).toBe(-1);
    });
  });

  describe('getComponentArray 方法', () => {
    it('应该返回组件数据数组', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);

      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      archetype.addEntity(entity1, [{ x: 1 }]);
      archetype.addEntity(entity2, [{ x: 2 }]);

      const positions = archetype.getComponentArray(POSITION_TYPE_ID);

      expect(positions).toHaveLength(2);
      expect(positions![0].x).toBe(1);
      expect(positions![1].x).toBe(2);
    });

    it('应该返回 undefined 如果组件类型不存在', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);

      expect(archetype.getComponentArray(VELOCITY_TYPE_ID)).toBeUndefined();
    });
  });

  describe('getComponent 方法', () => {
    it('应该返回实体的组件数据', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);
      const entity = EntityId.create(1, 0);

      const position = { x: 10, y: 20, z: 30 };
      archetype.addEntity(entity, [position]);

      expect(archetype.getComponent(entity, POSITION_TYPE_ID)).toBe(position);
    });

    it('应该返回 undefined 如果实体不存在', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);
      const entity = EntityId.create(1, 0);

      expect(archetype.getComponent(entity, POSITION_TYPE_ID)).toBeUndefined();
    });

    it('应该返回 undefined 如果组件类型不存在', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);
      const entity = EntityId.create(1, 0);

      archetype.addEntity(entity, [{ x: 10 }]);

      expect(archetype.getComponent(entity, VELOCITY_TYPE_ID)).toBeUndefined();
    });
  });

  describe('setComponent 方法', () => {
    it('应该设置实体的组件数据', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);
      const entity = EntityId.create(1, 0);

      archetype.addEntity(entity, [{ x: 10 }]);

      const newPosition = { x: 100, y: 200, z: 300 };
      const result = archetype.setComponent(entity, POSITION_TYPE_ID, newPosition);

      expect(result).toBe(true);
      expect(archetype.getComponent(entity, POSITION_TYPE_ID)).toBe(newPosition);
    });

    it('应该返回 false 如果实体不存在', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);
      const entity = EntityId.create(1, 0);

      const result = archetype.setComponent(entity, POSITION_TYPE_ID, { x: 100 });

      expect(result).toBe(false);
    });

    it('应该返回 false 如果组件类型不存在', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);
      const entity = EntityId.create(1, 0);

      archetype.addEntity(entity, [{ x: 10 }]);

      const result = archetype.setComponent(entity, VELOCITY_TYPE_ID, { x: 1 });

      expect(result).toBe(false);
    });
  });

  describe('getEntities 方法', () => {
    it('应该返回所有实体 ID', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);

      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      archetype.addEntity(entity1, [{ x: 1 }]);
      archetype.addEntity(entity2, [{ x: 2 }]);

      const entities = archetype.getEntities();

      expect(entities).toHaveLength(2);
      expect(entities).toContain(entity1);
      expect(entities).toContain(entity2);
    });

    it('应该返回只读数组', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);

      const entities = archetype.getEntities();

      // TypeScript 会阻止修改，但运行时不会
      expect(Array.isArray(entities)).toBe(true);
    });
  });

  describe('getEntityCount 方法', () => {
    it('应该返回实体数量', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);

      expect(archetype.getEntityCount()).toBe(0);

      archetype.addEntity(EntityId.create(1, 0), [{ x: 1 }]);
      expect(archetype.getEntityCount()).toBe(1);

      archetype.addEntity(EntityId.create(2, 0), [{ x: 2 }]);
      expect(archetype.getEntityCount()).toBe(2);
    });
  });

  describe('isEmpty 方法', () => {
    it('应该返回 true 如果为空', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);

      expect(archetype.isEmpty()).toBe(true);
    });

    it('应该返回 false 如果不为空', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);

      archetype.addEntity(EntityId.create(1, 0), [{ x: 1 }]);

      expect(archetype.isEmpty()).toBe(false);
    });
  });

  describe('clear 方法', () => {
    it('应该清空所有实体和组件', () => {
      const mask = createMask(POSITION_TYPE_ID, VELOCITY_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID, VELOCITY_TYPE_ID]);

      archetype.addEntity(EntityId.create(1, 0), [{ x: 1 }, { x: 1 }]);
      archetype.addEntity(EntityId.create(2, 0), [{ x: 2 }, { x: 2 }]);

      archetype.clear();

      expect(archetype.getEntityCount()).toBe(0);
      expect(archetype.isEmpty()).toBe(true);
      expect(archetype.getComponentArray(POSITION_TYPE_ID)).toEqual([]);
      expect(archetype.getComponentArray(VELOCITY_TYPE_ID)).toEqual([]);
    });
  });

  describe('forEach 方法', () => {
    it('应该遍历所有实体', () => {
      const mask = createMask(POSITION_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID]);

      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      archetype.addEntity(entity1, [{ x: 1 }]);
      archetype.addEntity(entity2, [{ x: 2 }]);

      const visited: Array<{ entity: number; row: number }> = [];
      archetype.forEach((entity, row) => {
        visited.push({ entity, row });
      });

      expect(visited).toHaveLength(2);
      expect(visited[0]).toEqual({ entity: entity1, row: 0 });
      expect(visited[1]).toEqual({ entity: entity2, row: 1 });
    });
  });

  describe('getStats 方法', () => {
    it('应该返回统计信息', () => {
      const mask = createMask(POSITION_TYPE_ID, VELOCITY_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID, VELOCITY_TYPE_ID]);

      archetype.addEntity(EntityId.create(1, 0), [{ x: 1 }, { x: 1 }]);
      archetype.addEntity(EntityId.create(2, 0), [{ x: 2 }, { x: 2 }]);

      const stats = archetype.getStats();

      expect(stats.entityCount).toBe(2);
      expect(stats.componentTypeCount).toBe(2);
      expect(stats.memoryEstimate).toBeGreaterThan(0);
    });
  });

  describe('getHash 方法', () => {
    it('应该返回掩码的字符串表示', () => {
      const mask = createMask(POSITION_TYPE_ID, VELOCITY_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID, VELOCITY_TYPE_ID]);

      const hash = archetype.getHash();

      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('相同掩码应该产生相同哈希', () => {
      const mask1 = createMask(POSITION_TYPE_ID, VELOCITY_TYPE_ID);
      const mask2 = createMask(POSITION_TYPE_ID, VELOCITY_TYPE_ID);

      const archetype1 = new Archetype(mask1, [POSITION_TYPE_ID, VELOCITY_TYPE_ID]);
      const archetype2 = new Archetype(mask2, [POSITION_TYPE_ID, VELOCITY_TYPE_ID]);

      expect(archetype1.getHash()).toBe(archetype2.getHash());
    });
  });

  describe('SoA 内存布局', () => {
    it('应该按组件类型分组存储', () => {
      const mask = createMask(POSITION_TYPE_ID, VELOCITY_TYPE_ID);
      const archetype = new Archetype(mask, [POSITION_TYPE_ID, VELOCITY_TYPE_ID]);

      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      archetype.addEntity(entity1, [
        { x: 1, y: 1, z: 1 },
        { vx: 10, vy: 10, vz: 10 },
      ]);
      archetype.addEntity(entity2, [
        { x: 2, y: 2, z: 2 },
        { vx: 20, vy: 20, vz: 20 },
      ]);

      const positions = archetype.getComponentArray(POSITION_TYPE_ID)!;
      const velocities = archetype.getComponentArray(VELOCITY_TYPE_ID)!;

      // 所有 Position 组件在一个数组中
      expect(positions[0].x).toBe(1);
      expect(positions[1].x).toBe(2);

      // 所有 Velocity 组件在另一个数组中
      expect(velocities[0].vx).toBe(10);
      expect(velocities[1].vx).toBe(20);
    });
  });
});
