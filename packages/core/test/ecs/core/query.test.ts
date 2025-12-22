/**
 * Query 测试
 * 测试 ECS 查询系统的功能
 */
import { describe, it, expect } from '@jest/globals';

import type { QueryFilter } from '../../../src/ecs/query';
import { Query } from '../../../src/ecs/query';
import { Archetype } from '../../../src/ecs/archetype';
import { BitSet } from '../../../src/utils/bitset';
import { EntityId } from '../../../src/ecs/entity-id';

// 模拟组件类
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

class Health {
  value = 100;
}

class Dead {}

describe('Query', () => {
  // 组件类型 ID
  const POSITION_TYPE_ID = 0;
  const VELOCITY_TYPE_ID = 1;
  const HEALTH_TYPE_ID = 2;
  const DEAD_TYPE_ID = 3;

  // 组件类到类型 ID 的映射
  const typeIdMap = new Map<any, number>([
    [Position, POSITION_TYPE_ID],
    [Velocity, VELOCITY_TYPE_ID],
    [Health, HEALTH_TYPE_ID],
    [Dead, DEAD_TYPE_ID],
  ]);

  // 创建掩码的函数
  function createMask(types: any[]): BitSet {
    const mask = new BitSet();
    for (const type of types) {
      const id = typeIdMap.get(type);
      if (id !== undefined) {
        mask.set(id);
      }
    }
    return mask;
  }

  // 获取类型 ID 的函数
  function getTypeId(type: any): number {
    return typeIdMap.get(type) ?? -1;
  }

  // 创建 Archetype 的辅助函数
  function createArchetype(...types: any[]): Archetype {
    const mask = createMask(types);
    const typeIds = types.map((t) => typeIdMap.get(t)!);
    return new Archetype(mask, typeIds);
  }

  describe('构造函数', () => {
    it('应该创建空查询', () => {
      const query = new Query({}, createMask, getTypeId);
      expect(query.getMatchedArchetypes()).toHaveLength(0);
    });

    it('应该创建带 all 过滤器的查询', () => {
      const filter: QueryFilter = { all: [Position, Velocity] };
      const query = new Query(filter, createMask, getTypeId);
      expect(query.getFilter().all).toEqual([Position, Velocity]);
    });

    it('应该创建带 any 过滤器的查询', () => {
      const filter: QueryFilter = { any: [Position, Velocity] };
      const query = new Query(filter, createMask, getTypeId);
      expect(query.getFilter().any).toEqual([Position, Velocity]);
    });

    it('应该创建带 none 过滤器的查询', () => {
      const filter: QueryFilter = { none: [Dead] };
      const query = new Query(filter, createMask, getTypeId);
      expect(query.getFilter().none).toEqual([Dead]);
    });

    it('应该创建组合过滤器的查询', () => {
      const filter: QueryFilter = {
        all: [Position],
        any: [Velocity, Health],
        none: [Dead],
      };
      const query = new Query(filter, createMask, getTypeId);
      expect(query.getFilter()).toEqual(filter);
    });
  });

  describe('matches 方法', () => {
    it('应该匹配包含所有 all 组件的 Archetype', () => {
      const query = new Query({ all: [Position, Velocity] }, createMask, getTypeId);
      const archetype = createArchetype(Position, Velocity);

      expect(query.matches(archetype)).toBe(true);
    });

    it('应该匹配包含额外组件的 Archetype', () => {
      const query = new Query({ all: [Position] }, createMask, getTypeId);
      const archetype = createArchetype(Position, Velocity, Health);

      expect(query.matches(archetype)).toBe(true);
    });

    it('应该不匹配缺少 all 组件的 Archetype', () => {
      const query = new Query({ all: [Position, Velocity] }, createMask, getTypeId);
      const archetype = createArchetype(Position);

      expect(query.matches(archetype)).toBe(false);
    });

    it('应该匹配包含任意 any 组件的 Archetype', () => {
      const query = new Query({ any: [Position, Velocity] }, createMask, getTypeId);

      const archetype1 = createArchetype(Position);
      const archetype2 = createArchetype(Velocity);
      const archetype3 = createArchetype(Position, Velocity);

      expect(query.matches(archetype1)).toBe(true);
      expect(query.matches(archetype2)).toBe(true);
      expect(query.matches(archetype3)).toBe(true);
    });

    it('应该不匹配不包含任何 any 组件的 Archetype', () => {
      const query = new Query({ any: [Position, Velocity] }, createMask, getTypeId);
      const archetype = createArchetype(Health);

      expect(query.matches(archetype)).toBe(false);
    });

    it('应该不匹配包含 none 组件的 Archetype', () => {
      const query = new Query({ none: [Dead] }, createMask, getTypeId);
      const archetype = createArchetype(Position, Dead);

      expect(query.matches(archetype)).toBe(false);
    });

    it('应该匹配不包含 none 组件的 Archetype', () => {
      const query = new Query({ none: [Dead] }, createMask, getTypeId);
      const archetype = createArchetype(Position, Velocity);

      expect(query.matches(archetype)).toBe(true);
    });

    it('应该正确处理组合过滤器', () => {
      const query = new Query(
        {
          all: [Position],
          any: [Velocity, Health],
          none: [Dead],
        },
        createMask,
        getTypeId
      );

      // 匹配：有 Position，有 Velocity，没有 Dead
      expect(query.matches(createArchetype(Position, Velocity))).toBe(true);

      // 匹配：有 Position，有 Health，没有 Dead
      expect(query.matches(createArchetype(Position, Health))).toBe(true);

      // 不匹配：没有 Position
      expect(query.matches(createArchetype(Velocity, Health))).toBe(false);

      // 不匹配：没有 Velocity 或 Health
      expect(query.matches(createArchetype(Position))).toBe(false);

      // 不匹配：有 Dead
      expect(query.matches(createArchetype(Position, Velocity, Dead))).toBe(false);
    });
  });

  describe('addArchetype 方法', () => {
    it('应该添加匹配的 Archetype', () => {
      const query = new Query({ all: [Position] }, createMask, getTypeId);
      const archetype = createArchetype(Position, Velocity);

      const result = query.addArchetype(archetype);

      expect(result).toBe(true);
      expect(query.getMatchedArchetypes()).toContain(archetype);
    });

    it('应该不添加不匹配的 Archetype', () => {
      const query = new Query({ all: [Position, Velocity] }, createMask, getTypeId);
      const archetype = createArchetype(Position);

      const result = query.addArchetype(archetype);

      expect(result).toBe(false);
      expect(query.getMatchedArchetypes()).not.toContain(archetype);
    });

    it('应该避免重复添加', () => {
      const query = new Query({ all: [Position] }, createMask, getTypeId);
      const archetype = createArchetype(Position);

      query.addArchetype(archetype);
      query.addArchetype(archetype);

      expect(query.getMatchedArchetypes()).toHaveLength(1);
    });
  });

  describe('removeArchetype 方法', () => {
    it('应该移除 Archetype', () => {
      const query = new Query({ all: [Position] }, createMask, getTypeId);
      const archetype = createArchetype(Position);

      query.addArchetype(archetype);
      const result = query.removeArchetype(archetype);

      expect(result).toBe(true);
      expect(query.getMatchedArchetypes()).not.toContain(archetype);
    });

    it('应该返回 false 如果 Archetype 不存在', () => {
      const query = new Query({ all: [Position] }, createMask, getTypeId);
      const archetype = createArchetype(Position);

      const result = query.removeArchetype(archetype);

      expect(result).toBe(false);
    });
  });

  describe('getEntityCount 方法', () => {
    it('应该返回所有匹配实体的数量', () => {
      const query = new Query({ all: [Position] }, createMask, getTypeId);

      const archetype1 = createArchetype(Position);
      const archetype2 = createArchetype(Position, Velocity);

      archetype1.addEntity(EntityId.create(1, 0), [{ x: 1 }]);
      archetype1.addEntity(EntityId.create(2, 0), [{ x: 2 }]);
      archetype2.addEntity(EntityId.create(3, 0), [{ x: 3 }, { x: 0 }]);

      query.addArchetype(archetype1);
      query.addArchetype(archetype2);

      expect(query.getEntityCount()).toBe(3);
    });

    it('应该返回 0 如果没有匹配的实体', () => {
      const query = new Query({ all: [Position] }, createMask, getTypeId);
      expect(query.getEntityCount()).toBe(0);
    });
  });

  describe('forEach 方法', () => {
    it('应该遍历所有匹配的实体', () => {
      const query = new Query({ all: [Position, Velocity] }, createMask, getTypeId);
      const archetype = createArchetype(Position, Velocity);

      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      archetype.addEntity(entity1, [{ x: 10 }, { vx: 1 }]);
      archetype.addEntity(entity2, [{ x: 20 }, { vx: 2 }]);

      query.addArchetype(archetype);

      const visited: Array<{ entity: number; components: any[] }> = [];
      query.forEach((entity, components) => {
        visited.push({ entity, components: [...components] });
      });

      expect(visited).toHaveLength(2);
      expect(visited[0].entity).toBe(entity1);
      expect(visited[0].components[0].x).toBe(10);
      expect(visited[1].entity).toBe(entity2);
      expect(visited[1].components[0].x).toBe(20);
    });

    it('应该跳过空的 Archetype', () => {
      const query = new Query({ all: [Position] }, createMask, getTypeId);
      const archetype = createArchetype(Position);

      query.addArchetype(archetype);

      const visited: number[] = [];
      query.forEach((entity) => {
        visited.push(entity);
      });

      expect(visited).toHaveLength(0);
    });

    it('应该遍历多个 Archetype', () => {
      const query = new Query({ all: [Position] }, createMask, getTypeId);

      const archetype1 = createArchetype(Position);
      const archetype2 = createArchetype(Position, Velocity);

      archetype1.addEntity(EntityId.create(1, 0), [{ x: 1 }]);
      archetype2.addEntity(EntityId.create(2, 0), [{ x: 2 }, { vx: 0 }]);

      query.addArchetype(archetype1);
      query.addArchetype(archetype2);

      const visited: number[] = [];
      query.forEach((entity) => {
        visited.push(entity);
      });

      expect(visited).toHaveLength(2);
    });
  });

  describe('collect 方法', () => {
    it('应该收集所有匹配的实体和组件', () => {
      const query = new Query({ all: [Position] }, createMask, getTypeId);
      const archetype = createArchetype(Position);

      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      archetype.addEntity(entity1, [{ x: 10 }]);
      archetype.addEntity(entity2, [{ x: 20 }]);

      query.addArchetype(archetype);

      const results = query.collect();

      expect(results).toHaveLength(2);
      expect(results[0].entity).toBe(entity1);
      expect(results[0].components[0].x).toBe(10);
      expect(results[1].entity).toBe(entity2);
      expect(results[1].components[0].x).toBe(20);
    });

    it('应该返回空数组如果没有匹配', () => {
      const query = new Query({ all: [Position] }, createMask, getTypeId);
      const results = query.collect();
      expect(results).toHaveLength(0);
    });
  });

  describe('first 方法', () => {
    it('应该返回第一个匹配的实体', () => {
      const query = new Query({ all: [Position] }, createMask, getTypeId);
      const archetype = createArchetype(Position);

      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      archetype.addEntity(entity1, [{ x: 10 }]);
      archetype.addEntity(entity2, [{ x: 20 }]);

      query.addArchetype(archetype);

      const result = query.first();

      expect(result).not.toBeNull();
      expect(result!.entity).toBe(entity1);
      expect(result!.components[0].x).toBe(10);
    });

    it('应该返回 null 如果没有匹配', () => {
      const query = new Query({ all: [Position] }, createMask, getTypeId);
      const result = query.first();
      expect(result).toBeNull();
    });

    it('应该跳过空的 Archetype', () => {
      const query = new Query({ all: [Position] }, createMask, getTypeId);

      const emptyArchetype = createArchetype(Position);
      const archetype = createArchetype(Position);

      archetype.addEntity(EntityId.create(1, 0), [{ x: 10 }]);

      query.addArchetype(emptyArchetype);
      query.addArchetype(archetype);

      const result = query.first();

      expect(result).not.toBeNull();
      expect(result!.components[0].x).toBe(10);
    });
  });

  describe('isEmpty 方法', () => {
    it('应该返回 true 如果没有匹配的实体', () => {
      const query = new Query({ all: [Position] }, createMask, getTypeId);
      expect(query.isEmpty()).toBe(true);
    });

    it('应该返回 false 如果有匹配的实体', () => {
      const query = new Query({ all: [Position] }, createMask, getTypeId);
      const archetype = createArchetype(Position);

      archetype.addEntity(EntityId.create(1, 0), [{ x: 10 }]);
      query.addArchetype(archetype);

      expect(query.isEmpty()).toBe(false);
    });
  });

  describe('clear 方法', () => {
    it('应该清空所有匹配的 Archetype', () => {
      const query = new Query({ all: [Position] }, createMask, getTypeId);
      const archetype = createArchetype(Position);

      query.addArchetype(archetype);
      query.clear();

      expect(query.getMatchedArchetypes()).toHaveLength(0);
    });
  });

  describe('getStats 方法', () => {
    it('应该返回统计信息', () => {
      const query = new Query({ all: [Position] }, createMask, getTypeId);

      const archetype1 = createArchetype(Position);
      const archetype2 = createArchetype(Position, Velocity);

      archetype1.addEntity(EntityId.create(1, 0), [{ x: 1 }]);
      archetype2.addEntity(EntityId.create(2, 0), [{ x: 2 }, { vx: 0 }]);
      archetype2.addEntity(EntityId.create(3, 0), [{ x: 3 }, { vx: 0 }]);

      query.addArchetype(archetype1);
      query.addArchetype(archetype2);

      const stats = query.getStats();

      expect(stats.matchedArchetypes).toBe(2);
      expect(stats.totalEntities).toBe(3);
    });
  });
});
