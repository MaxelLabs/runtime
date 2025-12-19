/**
 * ObjectPool 模块测试
 * 测试对象池功能
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ObjectPool } from '../../../src/ecs/utils/object-pool';
import { clearErrors, errors } from '../../../src/ecs/utils/errors';

// 测试用对象类
class TestObject {
  public value: number = 0;
  public name: string = '';

  reset(): void {
    this.value = 0;
    this.name = '';
  }
}

describe('ObjectPool - 对象池', () => {
  let pool: ObjectPool<TestObject>;

  beforeEach(() => {
    clearErrors();
    pool = new ObjectPool<TestObject>(
      'TestPool',
      () => new TestObject(),
      (obj) => obj.reset()
    );
  });

  describe('构造函数', () => {
    it('应该创建空对象池', () => {
      const stats = pool.getStatus();
      expect(stats.available).toBe(0);
      expect(stats.inUse).toBe(0);
      expect(stats.total).toBe(0);
    });

    it('应该支持初始大小参数', () => {
      const poolWithInitialSize = new ObjectPool<TestObject>(
        'TestPool',
        () => new TestObject(),
        (obj) => obj.reset(),
        5
      );

      const stats = poolWithInitialSize.getStatus();
      expect(stats.available).toBe(5);
      expect(stats.inUse).toBe(0);
      expect(stats.total).toBe(5);
    });

    it('应该支持最大容量参数', () => {
      const poolWithMaxSize = new ObjectPool<TestObject>(
        'TestPool',
        () => new TestObject(),
        (obj) => obj.reset(),
        0,
        10
      );

      expect(poolWithMaxSize).toBeDefined();
    });
  });

  describe('preAllocate - 预分配', () => {
    it('应该预分配指定数量的对象', () => {
      pool.preAllocate(10);

      const stats = pool.getStatus();
      expect(stats.available).toBe(10);
      expect(stats.total).toBe(10);
    });

    it('应该累积预分配', () => {
      pool.preAllocate(5);
      pool.preAllocate(3);

      const stats = pool.getStatus();
      expect(stats.available).toBe(8);
    });

    it('释放后预分配应该抛出错误', () => {
      pool.dispose();

      expect(() => pool.preAllocate(5)).toThrow();
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('get - 获取对象', () => {
    it('应该从池中获取对象', () => {
      pool.preAllocate(5);

      const obj = pool.get();

      expect(obj).toBeInstanceOf(TestObject);

      const stats = pool.getStatus();
      expect(stats.available).toBe(4);
      expect(stats.inUse).toBe(1);
    });

    it('池为空时应该创建新对象', () => {
      const obj = pool.get();

      expect(obj).toBeInstanceOf(TestObject);

      const stats = pool.getStatus();
      expect(stats.available).toBe(0);
      expect(stats.inUse).toBe(1);
    });

    it('应该追踪获取次数', () => {
      pool.get();
      pool.get();
      pool.get();

      const stats = pool.getStatus();
      expect(stats.totalGets).toBe(3);
    });

    it('释放后获取应该抛出错误', () => {
      pool.dispose();

      expect(() => pool.get()).toThrow();
    });
  });

  describe('release - 释放对象', () => {
    it('应该将对象放回池中', () => {
      const obj = pool.get();
      obj.value = 100;
      obj.name = 'test';

      const released = pool.release(obj);

      expect(released).toBe(true);

      const stats = pool.getStatus();
      expect(stats.available).toBe(1);
      expect(stats.inUse).toBe(0);

      // 验证对象已重置
      const obj2 = pool.get();
      expect(obj2).toBe(obj); // 应该是同一个对象
      expect(obj2.value).toBe(0);
      expect(obj2.name).toBe('');
    });

    it('应该拒绝null对象', () => {
      expect(() => pool.release(null as any)).toThrow();
      expect(errors.length).toBeGreaterThan(0);
    });

    it('应该拒绝原始值类型', () => {
      expect(() => pool.release(123 as any)).toThrow();
      expect(errors.length).toBeGreaterThan(0);
    });

    it('应该拒绝非池对象', () => {
      const foreignObject = new TestObject();

      expect(() => pool.release(foreignObject)).toThrow();
      expect(errors.length).toBeGreaterThan(0);
    });

    it('超过最大容量时不应放回池中', () => {
      const smallPool = new ObjectPool<TestObject>(
        'SmallPool',
        () => new TestObject(),
        (obj) => obj.reset(),
        0,
        2
      );

      const obj1 = smallPool.get();
      const obj2 = smallPool.get();
      const obj3 = smallPool.get();

      smallPool.release(obj1);
      smallPool.release(obj2);
      smallPool.release(obj3);

      const stats = smallPool.getStatus();
      expect(stats.available).toBeLessThanOrEqual(2);
    });

    it('池释放后释放对象应该抛出错误', () => {
      const obj = pool.get();
      pool.dispose();

      expect(() => pool.release(obj)).toThrow();
    });
  });

  describe('warmUp - 预热', () => {
    it('应该预热对象池', () => {
      const result = pool.warmUp(10);

      expect(result.success).toBe(true);
      expect(result.count).toBe(10);

      const stats = pool.getStatus();
      // warmUp 预分配指定数量的对象到池中
      expect(stats.available).toBe(10);
      expect(stats.totalCreated).toBe(10);
    });

    it('释放后预热应该失败', () => {
      pool.dispose();

      expect(() => pool.warmUp(5)).toThrow();
    });
  });

  describe('getStatus - 状态统计', () => {
    it('应该返回正确的统计信息', () => {
      pool.preAllocate(5);

      // 获取2个对象
      pool.get();
      pool.get();

      const stats = pool.getStatus();

      expect(stats.poolId).toBe('TestPool');
      expect(stats.available).toBe(3);
      expect(stats.inUse).toBe(2);
      expect(stats.total).toBe(5);
      expect(stats.totalGets).toBe(2);
      expect(stats.totalCreated).toBe(5);
    });

    it('应该计算对象重用率', () => {
      // 预分配5个对象
      pool.preAllocate(5);

      // 第1轮：获取5个对象
      const objs = [];
      for (let i = 0; i < 5; i++) {
        objs.push(pool.get());
      }
      // totalGets = 5, totalCreated = 5, efficiency = 0

      // 释放5个对象回池中
      for (const obj of objs) {
        pool.release(obj);
      }

      // 第2-4轮：重复获取和释放（重用池中的对象）
      for (let round = 0; round < 3; round++) {
        const tempObjs = [];
        for (let i = 0; i < 5; i++) {
          tempObjs.push(pool.get());
        }
        for (const obj of tempObjs) {
          pool.release(obj);
        }
      }

      // totalGets = 5 + 15 = 20, totalCreated = 5, efficiency = 15/20 = 0.75
      const stats = pool.getStatus();
      expect(stats.efficiency).toBeGreaterThan(0.6);
      expect(stats.totalGets).toBe(20);
      expect(stats.totalCreated).toBe(5);
    });
  });

  describe('clear - 清空池', () => {
    it('应该清空所有对象', () => {
      pool.preAllocate(10);
      pool.get();
      pool.get();

      pool.clear();

      const stats = pool.getStatus();
      expect(stats.available).toBe(0);
      expect(stats.inUse).toBe(0);
      expect(stats.total).toBe(0);
    });
  });

  describe('dispose - 释放池', () => {
    it('应该释放对象池', () => {
      pool.preAllocate(5);
      pool.dispose();

      expect(pool.isDisposed()).toBe(true);

      const stats = pool.getStatus();
      expect(stats.total).toBe(0);
    });

    it('释放后所有操作应该失败', () => {
      pool.dispose();

      expect(() => pool.get()).toThrow();
      expect(() => pool.preAllocate(5)).toThrow();
      expect(() => pool.warmUp(5)).toThrow();
    });
  });

  describe('setMaxSize - 调整容量', () => {
    it('应该调整最大容量', () => {
      pool.preAllocate(10);

      pool.setMaxSize(5);

      const stats = pool.getStatus();
      expect(stats.available).toBe(5); // 超出部分被裁剪
    });

    it('释放后调整容量应该失败', () => {
      pool.dispose();

      pool.setMaxSize(10); // 应该不报错，只是警告
      expect(pool.isDisposed()).toBe(true);
    });
  });

  describe('性能特性', () => {
    it('应该复用对象减少GC压力', () => {
      pool.preAllocate(100);

      const objs: TestObject[] = [];

      // 获取100个对象
      for (let i = 0; i < 100; i++) {
        objs.push(pool.get());
      }

      // 释放100个对象
      for (const obj of objs) {
        pool.release(obj);
      }

      const stats = pool.getStatus();
      // 所有对象应该被复用
      expect(stats.totalCreated).toBe(100);
      expect(stats.totalGets).toBe(100);
    });

    it('应该支持高频获取/释放', () => {
      pool.preAllocate(10);

      for (let i = 0; i < 1000; i++) {
        const obj = pool.get();
        obj.value = i;
        pool.release(obj);
      }

      const stats = pool.getStatus();
      expect(stats.totalGets).toBe(1000);
      expect(stats.available).toBe(10);
    });
  });
});
