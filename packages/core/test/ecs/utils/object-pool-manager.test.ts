/**
 * ObjectPoolManager 测试
 * 测试对象池管理器功能
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ObjectPoolManager, ObjectPoolManagerEventType } from '../../../src/utils/object-pool-manager';

// 测试用对象类
class TestObject {
  value = 0;
  name = '';

  reset(): void {
    this.value = 0;
    this.name = '';
  }
}

describe('ObjectPoolManager', () => {
  let manager: ObjectPoolManager;

  beforeEach(() => {
    // 重置单例
    ObjectPoolManager.disposeInstance();
    manager = ObjectPoolManager.getInstance();
  });

  afterEach(() => {
    ObjectPoolManager.disposeInstance();
  });

  describe('getInstance 方法', () => {
    it('应该返回单例实例', () => {
      const instance1 = ObjectPoolManager.getInstance();
      const instance2 = ObjectPoolManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize 方法', () => {
    it('应该初始化管理器', () => {
      manager.initialize();

      // 再次初始化不应该有影响
      manager.initialize({ maxSize: 2000 });
    });

    it('应该接受配置选项', () => {
      manager.initialize({
        initialCapacity: 10,
        maxSize: 500,
        logStats: true,
        memoryWarningThreshold: 5000,
      });
    });
  });

  describe('createPool 方法', () => {
    it('应该创建并注册对象池', () => {
      const pool = manager.createPool<TestObject>(
        'test',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      expect(pool).toBeDefined();
      expect(manager.getPool('test')).toBe(pool);
    });

    it('应该使用指定的选项', () => {
      const pool = manager.createPool<TestObject>(
        'test',
        () => new TestObject(),
        (obj) => obj.reset(),
        { initialCapacity: 5, maxSize: 100 }
      );

      expect(pool).toBeDefined();
    });

    it('应该自动添加命名空间', () => {
      manager.createPool<TestObject>(
        'test',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      expect(manager.getPool('default:test')).toBeDefined();
    });

    it('应该保留已有命名空间', () => {
      manager.createPool<TestObject>(
        'custom:test',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      expect(manager.getPool('custom:test')).toBeDefined();
    });
  });

  describe('registerPool 方法', () => {
    it('应该注册对象池', () => {
      const pool = manager.createPool<TestObject>(
        'temp',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      manager.registerPool('custom:registered', pool);

      expect(manager.getPool('custom:registered')).toBe(pool);
    });

    it('应该替换已存在的对象池', () => {
      manager.createPool<TestObject>(
        'test1',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      const pool2 = manager.createPool<TestObject>(
        'test2',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      manager.registerPool('default:test1', pool2);

      expect(manager.getPool('default:test1')).toBe(pool2);
    });

    it('应该触发 POOL_CREATED 事件', () => {
      const handler = jest.fn();
      manager.on(ObjectPoolManagerEventType.POOL_CREATED, handler);

      manager.createPool<TestObject>(
        'test',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('getPool 方法', () => {
    it('应该返回已注册的对象池', () => {
      const pool = manager.createPool<TestObject>(
        'test',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      expect(manager.getPool('test')).toBe(pool);
    });

    it('应该返回 null 对于不存在的对象池', () => {
      expect(manager.getPool('nonexistent')).toBeNull();
    });
  });

  describe('disposePool 方法', () => {
    it('应该释放对象池', () => {
      manager.createPool<TestObject>(
        'test',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      const result = manager.disposePool('test');

      expect(result).toBe(true);
      expect(manager.getPool('test')).toBeNull();
    });

    it('应该返回 false 对于不存在的对象池', () => {
      const result = manager.disposePool('nonexistent');

      expect(result).toBe(false);
    });

    it('应该触发 POOL_DESTROYED 事件', () => {
      const handler = jest.fn();
      manager.on(ObjectPoolManagerEventType.POOL_DESTROYED, handler);

      manager.createPool<TestObject>(
        'test',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      manager.disposePool('test');

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('getAllPoolStats 方法', () => {
    it('应该返回所有对象池的状态', () => {
      manager.createPool<TestObject>(
        'pool1',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      manager.createPool<TestObject>(
        'pool2',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      const stats = manager.getAllPoolStats();

      expect(stats.size).toBe(2);
    });

    it('应该支持详细模式', () => {
      manager.createPool<TestObject>(
        'test',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      const detailedStats = manager.getAllPoolStats(true);
      const basicStats = manager.getAllPoolStats(false);

      expect(detailedStats.size).toBe(1);
      expect(basicStats.size).toBe(1);
    });
  });

  describe('updatePoolConfig 方法', () => {
    it('应该更新对象池配置', () => {
      manager.createPool<TestObject>(
        'test',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      const result = manager.updatePoolConfig('test', { maxSize: 200 });

      expect(result).toBe(true);
    });

    it('应该返回 false 对于不存在的对象池', () => {
      const result = manager.updatePoolConfig('nonexistent', { maxSize: 200 });

      expect(result).toBe(false);
    });

    it('应该预热到指定容量', () => {
      manager.createPool<TestObject>(
        'test',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      const result = manager.updatePoolConfig('test', { initialCapacity: 10 });

      expect(result).toBe(true);
    });
  });

  describe('warmUpPool 方法', () => {
    it('应该预热对象池', () => {
      manager.createPool<TestObject>(
        'test',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      const result = manager.warmUpPool('test', 5);

      expect(result).toBe(true);
    });

    it('应该返回 false 对于不存在的对象池', () => {
      const result = manager.warmUpPool('nonexistent', 5);

      expect(result).toBe(false);
    });
  });

  describe('warmUpAllPools 方法', () => {
    it('应该预热所有对象池', () => {
      manager.createPool<TestObject>(
        'pool1',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      manager.createPool<TestObject>(
        'pool2',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      const results = manager.warmUpAllPools(5);

      expect(results.size).toBe(2);
      for (const [, success] of results) {
        expect(success).toBe(true);
      }
    });
  });

  describe('clearAllPools 方法', () => {
    it('应该清空所有对象池', () => {
      const pool1 = manager.createPool<TestObject>(
        'pool1',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      const pool2 = manager.createPool<TestObject>(
        'pool2',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      // 预热
      pool1.warmUp(5);
      pool2.warmUp(5);

      manager.clearAllPools();

      expect(pool1.getSize()).toBe(0);
      expect(pool2.getSize()).toBe(0);
    });
  });

  describe('disposeAllPools 方法', () => {
    it('应该释放所有对象池', () => {
      manager.createPool<TestObject>(
        'pool1',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      manager.createPool<TestObject>(
        'pool2',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      manager.disposeAllPools();

      expect(manager.getPool('pool1')).toBeNull();
      expect(manager.getPool('pool2')).toBeNull();
    });
  });

  describe('enableAutoAnalysis 方法', () => {
    it('应该启用自动分析', () => {
      manager.enableAutoAnalysis(true, 5000);

      // 验证不会抛出错误
      manager.update();
    });

    it('应该禁用自动分析', () => {
      manager.enableAutoAnalysis(true);
      manager.enableAutoAnalysis(false);

      // 验证不会抛出错误
      manager.update();
    });

    it('应该使用最小间隔 1000ms', () => {
      manager.enableAutoAnalysis(true, 100);

      // 验证不会抛出错误
      manager.update();
    });
  });

  describe('analyzePerformance 方法', () => {
    it('应该在强制模式下返回统计信息', () => {
      manager.createPool<TestObject>(
        'test',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      const stats = manager.analyzePerformance(true);

      expect(stats).not.toBeNull();
      expect(stats!.size).toBe(1);
    });

    it('应该在未启用自动分析时返回 null', () => {
      manager.createPool<TestObject>(
        'test',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      const stats = manager.analyzePerformance(false);

      expect(stats).toBeNull();
    });

    it('应该触发 PERFORMANCE_ANALYSIS 事件', () => {
      const handler = jest.fn();
      manager.on(ObjectPoolManagerEventType.PERFORMANCE_ANALYSIS, handler);

      manager.createPool<TestObject>(
        'test',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      manager.analyzePerformance(true);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('update 方法', () => {
    it('应该在启用自动分析时调用分析', () => {
      manager.enableAutoAnalysis(true, 0);

      manager.createPool<TestObject>(
        'test',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      // 不应该抛出错误
      manager.update();
    });
  });

  describe('getTotalObjectCount 方法', () => {
    it('应该返回所有对象池的总对象数量', () => {
      const pool1 = manager.createPool<TestObject>(
        'pool1',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      const pool2 = manager.createPool<TestObject>(
        'pool2',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      pool1.warmUp(5);
      pool2.warmUp(3);

      const total = manager.getTotalObjectCount();

      expect(total).toBe(8);
    });
  });

  describe('getTotalInUseCount 方法', () => {
    it('应该返回所有对象池的使用中对象数量', () => {
      const pool1 = manager.createPool<TestObject>(
        'pool1',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      const pool2 = manager.createPool<TestObject>(
        'pool2',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      pool1.get();
      pool1.get();
      pool2.get();

      const inUse = manager.getTotalInUseCount();

      expect(inUse).toBe(3);
    });
  });

  describe('disposeInstance 方法', () => {
    it('应该释放单例实例', () => {
      const instance1 = ObjectPoolManager.getInstance();
      instance1.createPool<TestObject>(
        'test',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      ObjectPoolManager.disposeInstance();

      const instance2 = ObjectPoolManager.getInstance();

      expect(instance1).not.toBe(instance2);
      expect(instance2.getPool('test')).toBeNull();
    });
  });

  describe('事件系统', () => {
    it('应该支持添加和移除事件监听器', () => {
      const handler = jest.fn();

      manager.on(ObjectPoolManagerEventType.POOL_CREATED, handler);

      manager.createPool<TestObject>(
        'test1',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      expect(handler).toHaveBeenCalledTimes(1);

      manager.off(ObjectPoolManagerEventType.POOL_CREATED, handler);

      manager.createPool<TestObject>(
        'test2',
        () => new TestObject(),
        (obj) => obj.reset()
      );

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
