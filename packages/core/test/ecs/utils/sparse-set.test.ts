/**
 * SparseSet 模块测试
 * 测试稀疏集合数据结构
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { SparseSet, SparseMap } from '../../../src/utils/sparse-set';

describe('SparseSet - 稀疏集合', () => {
  let set: SparseSet;

  beforeEach(() => {
    set = new SparseSet();
  });

  describe('构造函数', () => {
    it('应该创建空集合', () => {
      expect(set.size).toBe(0);
      expect(set.isEmpty).toBe(true);
    });
  });

  describe('add - 添加元素', () => {
    it('应该添加元素', () => {
      set.add(5);
      expect(set.has(5)).toBe(true);
      expect(set.size).toBe(1);
    });

    it('应该添加多个元素', () => {
      set.add(1);
      set.add(10);
      set.add(100);

      expect(set.has(1)).toBe(true);
      expect(set.has(10)).toBe(true);
      expect(set.has(100)).toBe(true);
      expect(set.size).toBe(3);
    });

    it('重复添加应该不增加大小', () => {
      set.add(5);
      set.add(5);
      set.add(5);

      expect(set.size).toBe(1);
    });
  });

  describe('remove - 移除元素', () => {
    it('应该移除元素', () => {
      set.add(5);
      set.remove(5);

      expect(set.has(5)).toBe(false);
      expect(set.size).toBe(0);
    });

    it('移除不存在的元素应该不报错', () => {
      expect(() => set.remove(100)).not.toThrow();
    });

    it('移除后应该保持其他元素', () => {
      set.add(1);
      set.add(2);
      set.add(3);

      set.remove(2);

      expect(set.has(1)).toBe(true);
      expect(set.has(2)).toBe(false);
      expect(set.has(3)).toBe(true);
      expect(set.size).toBe(2);
    });
  });

  describe('has - 检查元素', () => {
    it('存在的元素应该返回 true', () => {
      set.add(5);
      expect(set.has(5)).toBe(true);
    });

    it('不存在的元素应该返回 false', () => {
      expect(set.has(5)).toBe(false);
    });
  });

  describe('clear - 清空集合', () => {
    it('应该清空所有元素', () => {
      set.add(1);
      set.add(2);
      set.add(3);

      set.clear();

      expect(set.size).toBe(0);
      expect(set.isEmpty).toBe(true);
    });
  });

  describe('forEach - 遍历', () => {
    it('应该遍历所有元素', () => {
      set.add(1);
      set.add(5);
      set.add(10);

      const values: number[] = [];
      set.forEach((value) => values.push(value));

      expect(values.sort((a, b) => a - b)).toEqual([1, 5, 10]);
    });
  });

  describe('toArray - 转换为数组', () => {
    it('应该返回所有元素', () => {
      set.add(1);
      set.add(5);
      set.add(10);

      const array = set.toArray();

      expect(array.sort((a, b) => a - b)).toEqual([1, 5, 10]);
    });
  });

  describe('迭代器', () => {
    it('应该支持迭代', () => {
      set.add(1);
      set.add(2);
      set.add(3);

      const values: number[] = [];
      for (const value of set) {
        values.push(value);
      }

      expect(values.sort((a, b) => a - b)).toEqual([1, 2, 3]);
    });
  });

  describe('性能特性', () => {
    it('应该支持大量元素', () => {
      for (let i = 0; i < 1000; i++) {
        set.add(i);
      }

      expect(set.size).toBe(1000);

      for (let i = 0; i < 1000; i++) {
        expect(set.has(i)).toBe(true);
      }
    });

    it('应该支持稀疏索引', () => {
      set.add(0);
      set.add(1000);
      set.add(10000);

      expect(set.size).toBe(3);
      expect(set.has(0)).toBe(true);
      expect(set.has(1000)).toBe(true);
      expect(set.has(10000)).toBe(true);
    });
  });

  describe('集合操作', () => {
    it('intersection - 应该计算交集', () => {
      const set1 = new SparseSet();
      const set2 = new SparseSet();

      set1.add(1);
      set1.add(2);
      set1.add(3);

      set2.add(2);
      set2.add(3);
      set2.add(4);

      const result = set1.intersection(set2);

      expect(result.has(1)).toBe(false);
      expect(result.has(2)).toBe(true);
      expect(result.has(3)).toBe(true);
      expect(result.has(4)).toBe(false);
    });

    it('union - 应该计算并集', () => {
      const set1 = new SparseSet();
      const set2 = new SparseSet();

      set1.add(1);
      set1.add(2);

      set2.add(3);
      set2.add(4);

      const result = set1.union(set2);

      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(true);
      expect(result.has(3)).toBe(true);
      expect(result.has(4)).toBe(true);
    });

    it('difference - 应该计算差集', () => {
      const set1 = new SparseSet();
      const set2 = new SparseSet();

      set1.add(1);
      set1.add(2);
      set1.add(3);

      set2.add(2);
      set2.add(3);

      const result = set1.difference(set2);

      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(false);
      expect(result.has(3)).toBe(false);
    });
  });
});

describe('SparseMap - 稀疏映射', () => {
  let map: SparseMap<string>;

  beforeEach(() => {
    map = new SparseMap<string>();
  });

  describe('构造函数', () => {
    it('应该创建空映射', () => {
      expect(map.size).toBe(0);
    });
  });

  describe('set - 设置值', () => {
    it('应该设置键值对', () => {
      map.set(5, 'five');
      expect(map.get(5)).toBe('five');
      expect(map.size).toBe(1);
    });

    it('应该更新已存在的键', () => {
      map.set(5, 'five');
      map.set(5, 'FIVE');

      expect(map.get(5)).toBe('FIVE');
      expect(map.size).toBe(1);
    });
  });

  describe('get - 获取值', () => {
    it('应该返回正确的值', () => {
      map.set(1, 'one');
      map.set(2, 'two');

      expect(map.get(1)).toBe('one');
      expect(map.get(2)).toBe('two');
    });

    it('不存在的键应该返回 undefined', () => {
      expect(map.get(100)).toBeUndefined();
    });
  });

  describe('has - 检查键', () => {
    it('存在的键应该返回 true', () => {
      map.set(5, 'five');
      expect(map.has(5)).toBe(true);
    });

    it('不存在的键应该返回 false', () => {
      expect(map.has(5)).toBe(false);
    });
  });

  describe('delete - 删除键值对', () => {
    it('应该删除键值对', () => {
      map.set(5, 'five');
      map.delete(5);

      expect(map.has(5)).toBe(false);
      expect(map.size).toBe(0);
    });

    it('删除不存在的键应该不报错', () => {
      expect(() => map.delete(100)).not.toThrow();
    });
  });

  describe('clear - 清空映射', () => {
    it('应该清空所有键值对', () => {
      map.set(1, 'one');
      map.set(2, 'two');
      map.set(3, 'three');

      map.clear();

      expect(map.size).toBe(0);
    });
  });

  describe('forEach - 遍历', () => {
    it('应该遍历所有键值对', () => {
      map.set(1, 'one');
      map.set(2, 'two');
      map.set(3, 'three');

      const entries: Array<[number, string]> = [];
      map.forEach((value, key) => entries.push([key, value]));

      expect(entries.length).toBe(3);
    });
  });

  describe('keys - 获取所有键', () => {
    it('应该返回所有键', () => {
      map.set(1, 'one');
      map.set(5, 'five');
      map.set(10, 'ten');

      const keys = map.keys();

      expect(keys.sort((a, b) => a - b)).toEqual([1, 5, 10]);
    });
  });

  describe('values - 获取所有值', () => {
    it('应该返回所有值', () => {
      map.set(1, 'one');
      map.set(2, 'two');
      map.set(3, 'three');

      const values = map.values();

      expect(values.sort()).toEqual(['one', 'three', 'two']);
    });
  });

  describe('迭代器', () => {
    it('应该支持迭代键值对', () => {
      map.set(1, 'one');
      map.set(2, 'two');

      const entries: Array<[number, string]> = [];
      for (const [key, value] of map) {
        entries.push([key, value]);
      }

      expect(entries.length).toBe(2);
    });
  });
});
