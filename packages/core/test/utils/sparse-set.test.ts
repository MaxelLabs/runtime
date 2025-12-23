/**
 * SparseSet 模块测试
 * 测试稀疏集合数据结构
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { SparseSet, SparseMap } from '../../src/utils/sparse-set';

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

    it('超出容量的值应该返回 false', () => {
      // 创建一个小容量的集合
      const smallSet = new SparseSet(10);
      // 检查超出容量的值，不应该抛出错误，应该返回 false
      expect(smallSet.has(100)).toBe(false);
      expect(smallSet.has(1000)).toBe(false);
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

  describe('at - 获取指定索引的值', () => {
    it('应该返回指定索引的值', () => {
      set.add(10);
      set.add(20);
      set.add(30);

      // 注意：dense 数组的顺序是添加顺序
      expect(set.at(0)).toBe(10);
      expect(set.at(1)).toBe(20);
      expect(set.at(2)).toBe(30);
    });

    it('索引越界应该抛出错误', () => {
      set.add(1);
      expect(() => set.at(-1)).toThrow(RangeError);
      expect(() => set.at(1)).toThrow(RangeError);
      expect(() => set.at(100)).toThrow(RangeError);
    });
  });

  describe('indexOf - 获取值的索引', () => {
    it('应该返回值在密集数组中的索引', () => {
      set.add(10);
      set.add(20);
      set.add(30);

      expect(set.indexOf(10)).toBe(0);
      expect(set.indexOf(20)).toBe(1);
      expect(set.indexOf(30)).toBe(2);
    });

    it('不存在的值应该返回 -1', () => {
      set.add(10);
      expect(set.indexOf(100)).toBe(-1);
    });
  });

  describe('getValues - 获取密集数组视图', () => {
    it('应该返回所有值的视图', () => {
      set.add(1);
      set.add(2);
      set.add(3);

      const values = set.getValues();
      expect(values.length).toBe(3);
      expect(Array.from(values).sort((a, b) => a - b)).toEqual([1, 2, 3]);
    });

    it('空集合应该返回空视图', () => {
      const values = set.getValues();
      expect(values.length).toBe(0);
    });
  });

  describe('fromArray - 从数组创建', () => {
    it('应该从数组创建集合', () => {
      const newSet = SparseSet.fromArray([1, 5, 10, 100]);

      expect(newSet.size).toBe(4);
      expect(newSet.has(1)).toBe(true);
      expect(newSet.has(5)).toBe(true);
      expect(newSet.has(10)).toBe(true);
      expect(newSet.has(100)).toBe(true);
    });

    it('空数组应该创建空集合', () => {
      const newSet = SparseSet.fromArray([]);
      expect(newSet.size).toBe(0);
    });

    it('应该去重', () => {
      const newSet = SparseSet.fromArray([1, 1, 2, 2, 3, 3]);
      expect(newSet.size).toBe(3);
    });
  });

  describe('containsAll - 检查是否包含所有元素', () => {
    it('应该返回 true 如果包含所有元素', () => {
      set.add(1);
      set.add(2);
      set.add(3);
      set.add(4);

      const other = new SparseSet();
      other.add(1);
      other.add(2);

      expect(set.containsAll(other)).toBe(true);
    });

    it('应该返回 false 如果不包含所有元素', () => {
      set.add(1);
      set.add(2);

      const other = new SparseSet();
      other.add(1);
      other.add(3);

      expect(set.containsAll(other)).toBe(false);
    });

    it('空集合应该包含空集合', () => {
      const other = new SparseSet();
      expect(set.containsAll(other)).toBe(true);
    });
  });

  describe('intersects - 检查是否有交集', () => {
    it('应该返回 true 如果有交集', () => {
      set.add(1);
      set.add(2);
      set.add(3);

      const other = new SparseSet();
      other.add(3);
      other.add(4);
      other.add(5);

      expect(set.intersects(other)).toBe(true);
    });

    it('应该返回 false 如果没有交集', () => {
      set.add(1);
      set.add(2);

      const other = new SparseSet();
      other.add(3);
      other.add(4);

      expect(set.intersects(other)).toBe(false);
    });

    it('空集合与任何集合都没有交集', () => {
      const other = new SparseSet();
      other.add(1);

      expect(set.intersects(other)).toBe(false);
    });

    it('应该优化遍历较小的集合', () => {
      // 创建一个大集合和一个小集合
      const largeSet = new SparseSet();
      for (let i = 0; i < 100; i++) {
        largeSet.add(i);
      }

      const smallSet = new SparseSet();
      smallSet.add(50);

      // 两种调用方式都应该正确工作
      expect(largeSet.intersects(smallSet)).toBe(true);
      expect(smallSet.intersects(largeSet)).toBe(true);
    });
  });

  describe('clone - 克隆集合', () => {
    it('应该创建独立的副本', () => {
      set.add(1);
      set.add(2);
      set.add(3);

      const cloned = set.clone();

      expect(cloned.size).toBe(3);
      expect(cloned.has(1)).toBe(true);
      expect(cloned.has(2)).toBe(true);
      expect(cloned.has(3)).toBe(true);

      // 修改原集合不应该影响克隆
      set.remove(1);
      expect(cloned.has(1)).toBe(true);
    });
  });

  describe('equals - 检查相等', () => {
    it('应该返回 true 如果集合相等', () => {
      set.add(1);
      set.add(2);
      set.add(3);

      const other = new SparseSet();
      other.add(1);
      other.add(2);
      other.add(3);

      expect(set.equals(other)).toBe(true);
    });

    it('应该返回 false 如果大小不同', () => {
      set.add(1);
      set.add(2);

      const other = new SparseSet();
      other.add(1);

      expect(set.equals(other)).toBe(false);
    });

    it('应该返回 false 如果元素不同', () => {
      set.add(1);
      set.add(2);

      const other = new SparseSet();
      other.add(1);
      other.add(3);

      expect(set.equals(other)).toBe(false);
    });

    it('两个空集合应该相等', () => {
      const other = new SparseSet();
      expect(set.equals(other)).toBe(true);
    });
  });

  describe('capacity - 容量管理', () => {
    it('应该返回初始容量', () => {
      const customSet = new SparseSet(500);
      expect(customSet.capacity).toBe(500);
    });

    it('添加超出容量的元素应该自动扩容', () => {
      const smallSet = new SparseSet(10);
      smallSet.add(100); // 超出初始容量

      expect(smallSet.has(100)).toBe(true);
      expect(smallSet.capacity).toBeGreaterThanOrEqual(101);
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

    it('超出容量的键应该返回 false', () => {
      // 创建一个小容量的映射
      const smallMap = new SparseMap<string>(10);
      // 检查超出容量的键，不应该抛出错误，应该返回 false
      expect(smallMap.has(100)).toBe(false);
      expect(smallMap.has(1000)).toBe(false);
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

  describe('capacity - 容量管理', () => {
    it('应该返回初始容量', () => {
      const customMap = new SparseMap<string>(500);
      expect(customMap.capacity).toBe(500);
    });

    it('set 超出容量的键应该自动扩容', () => {
      const smallMap = new SparseMap<string>(10);
      smallMap.set(100, 'hundred'); // 超出初始容量

      expect(smallMap.has(100)).toBe(true);
      expect(smallMap.get(100)).toBe('hundred');
      expect(smallMap.capacity).toBeGreaterThanOrEqual(101);
    });

    it('扩容后应该保留原有数据', () => {
      const smallMap = new SparseMap<string>(10);
      smallMap.set(1, 'one');
      smallMap.set(5, 'five');

      // 触发扩容
      smallMap.set(100, 'hundred');

      // 原有数据应该保留
      expect(smallMap.get(1)).toBe('one');
      expect(smallMap.get(5)).toBe('five');
      expect(smallMap.get(100)).toBe('hundred');
      expect(smallMap.size).toBe(3);
    });
  });
});
