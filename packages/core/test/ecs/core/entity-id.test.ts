/**
 * EntityId 测试
 * 测试 Entity ID 的创建、解析和验证功能
 */
import { describe, it, expect } from '@jest/globals';

import { EntityId, INVALID_ENTITY, MAX_INDEX, MAX_GENERATION } from '../../../src/ecs/core/entity-id';

describe('EntityId', () => {
  describe('常量', () => {
    it('INVALID_ENTITY 应该是 0xFFFFFFFF', () => {
      expect(INVALID_ENTITY).toBe(0xffffffff);
    });

    it('MAX_INDEX 应该是 1048575 (2^20 - 1)', () => {
      expect(MAX_INDEX).toBe(1048575);
    });

    it('MAX_GENERATION 应该是 4095 (2^12 - 1)', () => {
      expect(MAX_GENERATION).toBe(4095);
    });
  });

  describe('create 方法', () => {
    it('应该创建有效的 Entity ID', () => {
      const id = EntityId.create(0, 0);
      expect(EntityId.isValid(id)).toBe(true);
    });

    it('应该正确编码 index 和 generation', () => {
      const id = EntityId.create(123, 45);
      expect(EntityId.index(id)).toBe(123);
      expect(EntityId.generation(id)).toBe(45);
    });

    it('应该支持最大 index 值', () => {
      const id = EntityId.create(MAX_INDEX, 0);
      expect(EntityId.index(id)).toBe(MAX_INDEX);
    });

    it('应该支持最大 generation 值', () => {
      const id = EntityId.create(0, MAX_GENERATION);
      expect(EntityId.generation(id)).toBe(MAX_GENERATION);
    });

    it('应该支持最大 index 和 generation 组合', () => {
      const id = EntityId.create(MAX_INDEX, MAX_GENERATION);
      expect(EntityId.index(id)).toBe(MAX_INDEX);
      expect(EntityId.generation(id)).toBe(MAX_GENERATION);
    });

    it('应该在 index 超出范围时抛出错误', () => {
      expect(() => EntityId.create(-1, 0)).toThrow('Entity index out of range');
      expect(() => EntityId.create(MAX_INDEX + 1, 0)).toThrow('Entity index out of range');
    });

    it('应该在 generation 超出范围时抛出错误', () => {
      expect(() => EntityId.create(0, -1)).toThrow('Entity generation out of range');
      expect(() => EntityId.create(0, MAX_GENERATION + 1)).toThrow('Entity generation out of range');
    });
  });

  describe('index 方法', () => {
    it('应该提取正确的 index', () => {
      expect(EntityId.index(EntityId.create(0, 0))).toBe(0);
      expect(EntityId.index(EntityId.create(1, 0))).toBe(1);
      expect(EntityId.index(EntityId.create(100, 0))).toBe(100);
      expect(EntityId.index(EntityId.create(1000, 0))).toBe(1000);
    });

    it('应该忽略 generation 部分', () => {
      expect(EntityId.index(EntityId.create(123, 0))).toBe(123);
      expect(EntityId.index(EntityId.create(123, 1))).toBe(123);
      expect(EntityId.index(EntityId.create(123, 100))).toBe(123);
      expect(EntityId.index(EntityId.create(123, MAX_GENERATION))).toBe(123);
    });
  });

  describe('generation 方法', () => {
    it('应该提取正确的 generation', () => {
      expect(EntityId.generation(EntityId.create(0, 0))).toBe(0);
      expect(EntityId.generation(EntityId.create(0, 1))).toBe(1);
      expect(EntityId.generation(EntityId.create(0, 100))).toBe(100);
      expect(EntityId.generation(EntityId.create(0, 1000))).toBe(1000);
    });

    it('应该忽略 index 部分', () => {
      expect(EntityId.generation(EntityId.create(0, 45))).toBe(45);
      expect(EntityId.generation(EntityId.create(1, 45))).toBe(45);
      expect(EntityId.generation(EntityId.create(100, 45))).toBe(45);
      expect(EntityId.generation(EntityId.create(MAX_INDEX, 45))).toBe(45);
    });
  });

  describe('isValid 方法', () => {
    it('应该返回 true 对于有效的 Entity ID', () => {
      expect(EntityId.isValid(EntityId.create(0, 0))).toBe(true);
      expect(EntityId.isValid(EntityId.create(100, 50))).toBe(true);
      expect(EntityId.isValid(EntityId.create(MAX_INDEX, MAX_GENERATION))).toBe(true);
    });

    it('应该返回 false 对于 INVALID_ENTITY', () => {
      expect(EntityId.isValid(INVALID_ENTITY)).toBe(false);
    });
  });

  describe('equals 方法', () => {
    it('应该返回 true 对于相同的 Entity ID', () => {
      const id1 = EntityId.create(123, 45);
      const id2 = EntityId.create(123, 45);
      expect(EntityId.equals(id1, id2)).toBe(true);
    });

    it('应该返回 false 对于不同的 index', () => {
      const id1 = EntityId.create(123, 45);
      const id2 = EntityId.create(124, 45);
      expect(EntityId.equals(id1, id2)).toBe(false);
    });

    it('应该返回 false 对于不同的 generation', () => {
      const id1 = EntityId.create(123, 45);
      const id2 = EntityId.create(123, 46);
      expect(EntityId.equals(id1, id2)).toBe(false);
    });

    it('应该返回 true 对于同一个变量', () => {
      const id = EntityId.create(123, 45);
      expect(EntityId.equals(id, id)).toBe(true);
    });
  });

  describe('toString 方法', () => {
    it('应该返回格式化的字符串', () => {
      const id = EntityId.create(123, 45);
      const str = EntityId.toString(id);
      expect(str).toBe('Entity(index=123, gen=45)');
    });

    it('应该返回 INVALID 对于无效的 Entity ID', () => {
      const str = EntityId.toString(INVALID_ENTITY);
      expect(str).toBe('Entity(INVALID)');
    });

    it('应该正确显示边界值', () => {
      const id = EntityId.create(MAX_INDEX, MAX_GENERATION);
      const str = EntityId.toString(id);
      expect(str).toBe(`Entity(index=${MAX_INDEX}, gen=${MAX_GENERATION})`);
    });
  });

  describe('位操作正确性', () => {
    it('应该正确处理位边界', () => {
      // 测试 index 的高位
      const highIndex = EntityId.create(0x80000, 0); // 第 20 位
      expect(EntityId.index(highIndex)).toBe(0x80000);

      // 测试 generation 的高位
      const highGen = EntityId.create(0, 0x800); // 第 12 位
      expect(EntityId.generation(highGen)).toBe(0x800);
    });

    it('应该正确处理全 1 的情况', () => {
      const allOnes = EntityId.create(MAX_INDEX, MAX_GENERATION);
      expect(EntityId.index(allOnes)).toBe(MAX_INDEX);
      expect(EntityId.generation(allOnes)).toBe(MAX_GENERATION);
    });

    it('应该正确处理交替位模式', () => {
      // 0x55555 = 0101 0101 0101 0101 0101 (20 bits)
      const alternatingIndex = 0x55555;
      // 0x555 = 0101 0101 0101 (12 bits)
      const alternatingGen = 0x555;

      const id = EntityId.create(alternatingIndex, alternatingGen);
      expect(EntityId.index(id)).toBe(alternatingIndex);
      expect(EntityId.generation(id)).toBe(alternatingGen);
    });
  });

  describe('实际使用场景', () => {
    it('应该支持实体复用场景', () => {
      // 模拟实体被销毁后复用
      const firstUse = EntityId.create(5, 0);
      const secondUse = EntityId.create(5, 1);
      const thirdUse = EntityId.create(5, 2);

      // 同一个 index，不同的 generation
      expect(EntityId.index(firstUse)).toBe(5);
      expect(EntityId.index(secondUse)).toBe(5);
      expect(EntityId.index(thirdUse)).toBe(5);

      // 但它们是不同的实体
      expect(EntityId.equals(firstUse, secondUse)).toBe(false);
      expect(EntityId.equals(secondUse, thirdUse)).toBe(false);
    });

    it('应该支持大量实体', () => {
      // 创建接近最大数量的实体
      const entities: number[] = [];
      for (let i = 0; i < 1000; i++) {
        entities.push(EntityId.create(i, 0));
      }

      // 验证每个实体都是唯一的
      const uniqueIds = new Set(entities);
      expect(uniqueIds.size).toBe(1000);

      // 验证每个实体的 index 正确
      for (let i = 0; i < 1000; i++) {
        expect(EntityId.index(entities[i])).toBe(i);
      }
    });

    it('应该支持作为 Map 的键', () => {
      const map = new Map<number, string>();
      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);
      const entity3 = EntityId.create(1, 1); // 同 index，不同 generation

      map.set(entity1, 'entity1');
      map.set(entity2, 'entity2');
      map.set(entity3, 'entity3');

      expect(map.get(entity1)).toBe('entity1');
      expect(map.get(entity2)).toBe('entity2');
      expect(map.get(entity3)).toBe('entity3');
      expect(map.size).toBe(3);
    });

    it('应该支持作为 Set 的元素', () => {
      const set = new Set<number>();
      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);
      const entity1Copy = EntityId.create(1, 0);

      set.add(entity1);
      set.add(entity2);
      set.add(entity1Copy); // 应该不会增加 size

      expect(set.size).toBe(2);
      expect(set.has(entity1)).toBe(true);
      expect(set.has(entity1Copy)).toBe(true);
    });
  });
});
