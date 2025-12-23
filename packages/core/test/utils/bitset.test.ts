/**
 * BitSet 模块测试
 * 测试位集合数据结构
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { BitSet } from '../../src/utils/bitset';

describe('BitSet - 位集合', () => {
  let bitset: BitSet;

  beforeEach(() => {
    bitset = new BitSet();
  });

  describe('构造函数', () => {
    it('应该创建空位集合', () => {
      expect(bitset.isEmpty()).toBe(true);
      expect(bitset.count()).toBe(0);
    });

    it('应该支持指定初始大小', () => {
      const largeBitset = new BitSet(1000);
      expect(largeBitset.isEmpty()).toBe(true);
    });
  });

  describe('set - 设置位', () => {
    it('应该设置单个位', () => {
      bitset.set(5);
      expect(bitset.has(5)).toBe(true);
      expect(bitset.count()).toBe(1);
    });

    it('应该设置多个位', () => {
      bitset.set(0);
      bitset.set(10);
      bitset.set(100);

      expect(bitset.has(0)).toBe(true);
      expect(bitset.has(10)).toBe(true);
      expect(bitset.has(100)).toBe(true);
      expect(bitset.count()).toBe(3);
    });

    it('重复设置同一位应该不改变计数', () => {
      bitset.set(5);
      bitset.set(5);
      bitset.set(5);

      expect(bitset.count()).toBe(1);
    });
  });

  describe('clear - 清除位', () => {
    it('应该清除单个位', () => {
      bitset.set(5);
      bitset.clear(5);

      expect(bitset.has(5)).toBe(false);
      expect(bitset.count()).toBe(0);
    });

    it('清除未设置的位应该不报错', () => {
      expect(() => bitset.clear(100)).not.toThrow();
    });
  });

  describe('has - 检查位', () => {
    it('应该返回正确的位状态', () => {
      bitset.set(5);

      expect(bitset.has(5)).toBe(true);
      expect(bitset.has(6)).toBe(false);
    });

    it('检查超出范围的位应该返回 false', () => {
      expect(bitset.has(1000)).toBe(false);
    });
  });

  describe('get - 获取位值', () => {
    it('应该返回 0 或 1', () => {
      bitset.set(5);

      expect(bitset.get(5)).toBe(1);
      expect(bitset.get(6)).toBe(0);
    });
  });

  describe('flip - 翻转位', () => {
    it('应该翻转位状态', () => {
      bitset.flip(5);
      expect(bitset.has(5)).toBe(true);

      bitset.flip(5);
      expect(bitset.has(5)).toBe(false);
    });
  });

  describe('位运算', () => {
    it('and - 应该执行与运算（返回新对象）', () => {
      const a = new BitSet();
      const b = new BitSet();

      a.set(1);
      a.set(2);
      a.set(3);

      b.set(2);
      b.set(3);
      b.set(4);

      const result = a.and(b);

      expect(result.has(1)).toBe(false);
      expect(result.has(2)).toBe(true);
      expect(result.has(3)).toBe(true);
      expect(result.has(4)).toBe(false);
    });

    it('andInPlace - 应该原地执行与运算', () => {
      const a = new BitSet();
      const b = new BitSet();

      a.set(1);
      a.set(2);
      a.set(3);

      b.set(2);
      b.set(3);
      b.set(4);

      a.andInPlace(b);

      expect(a.has(1)).toBe(false);
      expect(a.has(2)).toBe(true);
      expect(a.has(3)).toBe(true);
      expect(a.has(4)).toBe(false);
    });

    it('or - 应该执行或运算（返回新对象）', () => {
      const a = new BitSet();
      const b = new BitSet();

      a.set(1);
      a.set(2);

      b.set(3);
      b.set(4);

      const result = a.or(b);

      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(true);
      expect(result.has(3)).toBe(true);
      expect(result.has(4)).toBe(true);
    });

    it('or - 不同大小的 BitSet（this 更大）', () => {
      const a = new BitSet(128);
      const b = new BitSet(32);

      a.set(1);
      a.set(100); // 超出 b 的范围

      b.set(2);

      const result = a.or(b);

      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(true);
      expect(result.has(100)).toBe(true);
    });

    it('or - 不同大小的 BitSet（other 更大）', () => {
      const a = new BitSet(32);
      const b = new BitSet(128);

      a.set(1);

      b.set(2);
      b.set(100); // 超出 a 的范围

      const result = a.or(b);

      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(true);
      expect(result.has(100)).toBe(true);
    });

    it('orInPlace - 应该原地执行或运算', () => {
      const a = new BitSet();
      const b = new BitSet();

      a.set(1);
      a.set(2);

      b.set(3);
      b.set(4);

      a.orInPlace(b);

      expect(a.has(1)).toBe(true);
      expect(a.has(2)).toBe(true);
      expect(a.has(3)).toBe(true);
      expect(a.has(4)).toBe(true);
    });

    it('xor - 应该执行异或运算（返回新对象）', () => {
      const a = new BitSet();
      const b = new BitSet();

      a.set(1);
      a.set(2);

      b.set(2);
      b.set(3);

      const result = a.xor(b);

      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(false);
      expect(result.has(3)).toBe(true);
    });

    it('xor - 不同大小的 BitSet（this 更大）', () => {
      const a = new BitSet(128);
      const b = new BitSet(32);

      a.set(1);
      a.set(100); // 超出 b 的范围

      b.set(1);
      b.set(2);

      const result = a.xor(b);

      expect(result.has(1)).toBe(false); // 1 XOR 1 = 0
      expect(result.has(2)).toBe(true); // 0 XOR 1 = 1
      expect(result.has(100)).toBe(true); // 1 XOR 0 = 1
    });

    it('xor - 不同大小的 BitSet（other 更大）', () => {
      const a = new BitSet(32);
      const b = new BitSet(128);

      a.set(1);
      a.set(2);

      b.set(1);
      b.set(100); // 超出 a 的范围

      const result = a.xor(b);

      expect(result.has(1)).toBe(false); // 1 XOR 1 = 0
      expect(result.has(2)).toBe(true); // 1 XOR 0 = 1
      expect(result.has(100)).toBe(true); // 0 XOR 1 = 1
    });

    it('andNot - 应该执行差集运算（返回新对象）', () => {
      const a = new BitSet();
      const b = new BitSet();

      a.set(1);
      a.set(2);
      a.set(3);

      b.set(2);
      b.set(3);

      const result = a.andNot(b);

      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(false);
      expect(result.has(3)).toBe(false);
    });

    it('andNot - 不同大小的 BitSet（this 更大）', () => {
      const a = new BitSet(128);
      const b = new BitSet(32);

      a.set(1);
      a.set(2);
      a.set(100); // 超出 b 的范围

      b.set(2);

      const result = a.andNot(b);

      expect(result.has(1)).toBe(true); // 1 AND NOT 0 = 1
      expect(result.has(2)).toBe(false); // 1 AND NOT 1 = 0
      expect(result.has(100)).toBe(true); // 1 AND NOT 0 = 1 (b 超出部分视为 0)
    });

    it('andNot - 不同大小的 BitSet（other 更大）', () => {
      const a = new BitSet(32);
      const b = new BitSet(128);

      a.set(1);
      a.set(2);

      b.set(2);
      b.set(100); // 超出 a 的范围，但不影响结果

      const result = a.andNot(b);

      expect(result.has(1)).toBe(true); // 1 AND NOT 0 = 1
      expect(result.has(2)).toBe(false); // 1 AND NOT 1 = 0
    });
  });

  describe('intersects - 检查交集', () => {
    it('有交集应该返回 true', () => {
      const a = new BitSet();
      const b = new BitSet();

      a.set(1);
      a.set(2);

      b.set(2);
      b.set(3);

      expect(a.intersects(b)).toBe(true);
    });

    it('无交集应该返回 false', () => {
      const a = new BitSet();
      const b = new BitSet();

      a.set(1);
      a.set(2);

      b.set(3);
      b.set(4);

      expect(a.intersects(b)).toBe(false);
    });
  });

  describe('isEmpty - 检查是否为空', () => {
    it('空集合应该返回 true', () => {
      expect(bitset.isEmpty()).toBe(true);
    });

    it('非空集合应该返回 false', () => {
      bitset.set(0);
      expect(bitset.isEmpty()).toBe(false);
    });
  });

  describe('count - 计数', () => {
    it('应该返回正确的位数', () => {
      bitset.set(0);
      bitset.set(10);
      bitset.set(20);
      bitset.set(30);

      expect(bitset.count()).toBe(4);
    });
  });

  describe('clearAll - 清空所有位', () => {
    it('应该清空所有位', () => {
      bitset.set(0);
      bitset.set(10);
      bitset.set(100);

      bitset.clearAll();

      expect(bitset.isEmpty()).toBe(true);
      expect(bitset.count()).toBe(0);
    });
  });

  describe('clone - 克隆', () => {
    it('应该创建独立的副本', () => {
      bitset.set(1);
      bitset.set(2);
      bitset.set(3);

      const clone = bitset.clone();

      expect(clone.has(1)).toBe(true);
      expect(clone.has(2)).toBe(true);
      expect(clone.has(3)).toBe(true);

      // 修改原始不应影响克隆
      bitset.clear(1);
      expect(clone.has(1)).toBe(true);
    });
  });

  describe('equals - 相等比较', () => {
    it('相同内容应该返回 true', () => {
      const a = new BitSet();
      const b = new BitSet();

      a.set(1);
      a.set(2);

      b.set(1);
      b.set(2);

      expect(a.equals(b)).toBe(true);
    });

    it('不同内容应该返回 false', () => {
      const a = new BitSet();
      const b = new BitSet();

      a.set(1);
      b.set(2);

      expect(a.equals(b)).toBe(false);
    });

    it('不同大小的 BitSet 比较 - this 更大', () => {
      const a = new BitSet(128);
      const b = new BitSet(32);

      a.set(1);
      a.set(2);

      b.set(1);
      b.set(2);

      // a 和 b 在重叠部分相同，a 超出部分全为 0
      expect(a.equals(b)).toBe(true);
    });

    it('不同大小的 BitSet 比较 - other 更大', () => {
      const a = new BitSet(32);
      const b = new BitSet(128);

      a.set(1);
      a.set(2);

      b.set(1);
      b.set(2);

      // a 和 b 在重叠部分相同，b 超出部分全为 0
      expect(a.equals(b)).toBe(true);
    });

    it('不同大小的 BitSet 比较 - this 更大且超出部分有值', () => {
      const a = new BitSet(128);
      const b = new BitSet(32);

      a.set(1);
      a.set(100); // 超出 b 的范围

      b.set(1);

      expect(a.equals(b)).toBe(false);
    });

    it('不同大小的 BitSet 比较 - other 更大且超出部分有值', () => {
      const a = new BitSet(32);
      const b = new BitSet(128);

      a.set(1);

      b.set(1);
      b.set(100); // 超出 a 的范围

      expect(a.equals(b)).toBe(false);
    });
  });

  describe('迭代器 - 遍历', () => {
    it('应该遍历所有设置的位', () => {
      bitset.set(1);
      bitset.set(5);
      bitset.set(10);

      const indices: number[] = [];
      for (const index of bitset) {
        indices.push(index);
      }

      expect(indices).toEqual([1, 5, 10]);
    });
  });

  describe('toArray - 转换为数组', () => {
    it('应该返回所有设置位的索引', () => {
      bitset.set(0);
      bitset.set(5);
      bitset.set(10);

      const array = bitset.toArray();

      expect(array).toEqual([0, 5, 10]);
    });
  });

  describe('fromArray - 从数组创建', () => {
    it('应该从数组创建位集合', () => {
      const bs = BitSet.fromArray([1, 5, 10]);

      expect(bs.has(1)).toBe(true);
      expect(bs.has(5)).toBe(true);
      expect(bs.has(10)).toBe(true);
      expect(bs.count()).toBe(3);
    });

    it('应该处理空数组', () => {
      const bs = BitSet.fromArray([]);

      expect(bs.isEmpty()).toBe(true);
      expect(bs.count()).toBe(0);
    });
  });

  describe('capacity - 容量', () => {
    it('应该返回正确的容量', () => {
      const bs = new BitSet(100);

      // 容量会向上取整到 32 的倍数
      expect(bs.capacity).toBeGreaterThanOrEqual(100);
      expect(bs.capacity % 32).toBe(0);
    });

    it('应该返回正确的字数组长度', () => {
      const bs = new BitSet(100);

      expect(bs.wordCount).toBe(Math.ceil(100 / 32));
    });
  });

  describe('setAll - 设置所有位', () => {
    it('应该设置所有位为 1', () => {
      const bs = new BitSet(64);

      bs.setAll();

      // 所有位都应该为 1
      expect(bs.has(0)).toBe(true);
      expect(bs.has(31)).toBe(true);
      expect(bs.has(32)).toBe(true);
      expect(bs.has(63)).toBe(true);
      expect(bs.count()).toBe(64);
    });
  });

  describe('contains - 包含检查', () => {
    it('应该检测包含关系', () => {
      const a = new BitSet();
      const b = new BitSet();

      a.set(1);
      a.set(2);
      a.set(3);

      b.set(1);
      b.set(2);

      expect(a.contains(b)).toBe(true);
      expect(b.contains(a)).toBe(false);
    });

    it('应该处理空集合', () => {
      const a = new BitSet();
      const b = new BitSet();

      a.set(1);

      expect(a.contains(b)).toBe(true);
      expect(b.contains(a)).toBe(false);
    });

    it('应该处理不同大小的集合', () => {
      const a = new BitSet(32);
      const b = new BitSet(128);

      a.set(1);
      a.set(2);

      b.set(1);
      b.set(100); // 超出 a 的范围

      expect(a.contains(b)).toBe(false);
    });

    it('应该处理 other 超出部分全为 0 的情况', () => {
      const a = new BitSet(128);
      const b = new BitSet(128);

      a.set(1);
      a.set(2);
      a.set(3);

      b.set(1);
      b.set(2);

      expect(a.contains(b)).toBe(true);
    });
  });

  describe('not - 取反', () => {
    it('应该返回取反后的位集合', () => {
      const bs = new BitSet(64);

      bs.set(0);
      bs.set(1);

      const result = bs.not();

      // 原来为 1 的位现在为 0
      expect(result.has(0)).toBe(false);
      expect(result.has(1)).toBe(false);
      // 原来为 0 的位现在为 1
      expect(result.has(2)).toBe(true);
      expect(result.has(31)).toBe(true);
    });
  });

  describe('andInPlace - 原地与操作', () => {
    it('应该清零超出部分', () => {
      const a = new BitSet(128);
      const b = new BitSet(64);

      a.set(1);
      a.set(2);
      a.set(100); // 超出 b 的范围

      b.set(1);
      b.set(2);

      a.andInPlace(b);

      expect(a.has(1)).toBe(true);
      expect(a.has(2)).toBe(true);
      expect(a.has(100)).toBe(false); // 应该被清零
    });
  });

  describe('toString - 字符串表示', () => {
    it('应该返回二进制字符串', () => {
      const bs = new BitSet(8);

      bs.set(0);
      bs.set(2);

      const str = bs.toString();

      // 从高位到低位，所以 0 和 2 位为 1
      expect(str).toContain('1');
      expect(str.length).toBe(32); // 容量向上取整到 32
    });

    it('空集合应该返回全 0 字符串', () => {
      const bs = new BitSet(32);
      const str = bs.toString();

      expect(str).toBe('0'.repeat(32));
    });
  });

  describe('自动扩容', () => {
    it('set 应该自动扩容', () => {
      const bs = new BitSet(32);

      bs.set(100); // 超出初始容量

      expect(bs.has(100)).toBe(true);
      expect(bs.capacity).toBeGreaterThanOrEqual(101);
    });

    it('flip 应该自动扩容', () => {
      const bs = new BitSet(32);

      bs.flip(100); // 超出初始容量

      expect(bs.has(100)).toBe(true);
      expect(bs.capacity).toBeGreaterThanOrEqual(101);
    });

    it('orInPlace 应该自动扩容', () => {
      const a = new BitSet(32);
      const b = new BitSet(128);

      b.set(100);

      a.orInPlace(b);

      expect(a.has(100)).toBe(true);
      expect(a.capacity).toBeGreaterThanOrEqual(101);
    });
  });
});
