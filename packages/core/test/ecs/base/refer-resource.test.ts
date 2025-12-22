/**
 * ReferResource 测试
 * 测试引用计数资源管理功能
 */
import { describe, it, expect, jest } from '@jest/globals';
import type { IReferable } from '../../../src/base/refer-resource';
import { ReferResource } from '../../../src/base/refer-resource';

// 创建测试用的子类
class TestResource extends ReferResource {
  public disposeCallCount = 0;

  protected override onResourceDispose(): void {
    this.disposeCallCount++;
  }
}

describe('ReferResource', () => {
  describe('构造函数', () => {
    it('应该创建引用计数为 0 的资源', () => {
      const resource = new TestResource();
      expect(resource.refCount).toBe(0);
    });

    it('应该创建未加载状态的资源', () => {
      const resource = new TestResource();
      expect(resource.isLoaded).toBe(false);
      expect(resource.loaded()).toBe(false);
    });
  });

  describe('addRef 方法', () => {
    it('应该增加引用计数', () => {
      const resource = new TestResource();

      const count1 = resource.addRef();
      expect(count1).toBe(1);
      expect(resource.refCount).toBe(1);

      const count2 = resource.addRef();
      expect(count2).toBe(2);
      expect(resource.refCount).toBe(2);
    });

    it('应该在资源已释放时输出警告并返回当前计数', () => {
      const resource = new TestResource();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      resource.dispose();
      const count = resource.addRef();

      expect(consoleSpy).toHaveBeenCalled();
      expect(count).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe('release 方法', () => {
    it('应该减少引用计数', () => {
      const resource = new TestResource();
      resource.addRef();
      resource.addRef();

      const count = resource.release();

      expect(count).toBe(1);
      expect(resource.refCount).toBe(1);
    });

    it('应该不让引用计数变为负数', () => {
      const resource = new TestResource();

      const count = resource.release();

      expect(count).toBe(0);
      expect(resource.refCount).toBe(0);
    });

    it('应该在引用计数为 0 且已加载时自动释放', () => {
      const resource = new TestResource();
      resource.addRef();
      resource.setLoaded(true);

      resource.release();

      expect(resource.isDisposed()).toBe(true);
      expect(resource.disposeCallCount).toBe(1);
    });

    it('应该在引用计数为 0 但未加载时不自动释放', () => {
      const resource = new TestResource();
      resource.addRef();

      resource.release();

      expect(resource.isDisposed()).toBe(false);
    });

    it('应该在资源已释放时返回 0', () => {
      const resource = new TestResource();
      resource.dispose();

      const count = resource.release();

      expect(count).toBe(0);
    });
  });

  describe('setUrl 和 getUrl 方法', () => {
    it('应该设置和获取 URL', () => {
      const resource = new TestResource();

      resource.setUrl('https://example.com/texture.png');

      expect(resource.getUrl()).toBe('https://example.com/texture.png');
    });

    it('应该默认为空字符串', () => {
      const resource = new TestResource();
      expect(resource.getUrl()).toBe('');
    });
  });

  describe('setSize 和 getSize 方法', () => {
    it('应该设置和获取大小', () => {
      const resource = new TestResource();

      resource.setSize(1024);

      expect(resource.getSize()).toBe(1024);
    });

    it('应该不允许负数大小', () => {
      const resource = new TestResource();

      resource.setSize(-100);

      expect(resource.getSize()).toBe(0);
    });

    it('应该默认为 0', () => {
      const resource = new TestResource();
      expect(resource.getSize()).toBe(0);
    });
  });

  describe('setLoaded 和 loaded 方法', () => {
    it('应该设置和获取加载状态', () => {
      const resource = new TestResource();

      resource.setLoaded(true);
      expect(resource.loaded()).toBe(true);
      expect(resource.isLoaded).toBe(true);

      resource.setLoaded(false);
      expect(resource.loaded()).toBe(false);
      expect(resource.isLoaded).toBe(false);
    });
  });

  describe('dispose 方法', () => {
    it('应该释放资源', () => {
      const resource = new TestResource();

      resource.dispose();

      expect(resource.isDisposed()).toBe(true);
    });

    it('应该调用 onResourceDispose', () => {
      const resource = new TestResource();

      resource.dispose();

      expect(resource.disposeCallCount).toBe(1);
    });

    it('应该重置加载状态和引用计数', () => {
      const resource = new TestResource();
      resource.addRef();
      resource.addRef();
      resource.setLoaded(true);

      resource.dispose();

      expect(resource.isLoaded).toBe(false);
      expect(resource.refCount).toBe(0);
    });

    it('应该在有引用时输出警告', () => {
      const resource = new TestResource();
      resource.addRef();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      resource.dispose();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('应该只释放一次', () => {
      const resource = new TestResource();

      resource.dispose();
      resource.dispose();

      expect(resource.disposeCallCount).toBe(1);
    });
  });

  describe('IReferable 接口', () => {
    it('应该实现 IReferable 接口', () => {
      const resource: IReferable = new TestResource();

      expect(typeof resource.refCount).toBe('number');
      expect(typeof resource.addRef).toBe('function');
      expect(typeof resource.release).toBe('function');
    });
  });

  describe('实际使用场景', () => {
    it('应该支持多个引用者', () => {
      const resource = new TestResource();
      resource.setLoaded(true);

      // 模拟多个对象引用同一资源
      resource.addRef(); // 对象 A
      resource.addRef(); // 对象 B
      resource.addRef(); // 对象 C

      expect(resource.refCount).toBe(3);

      // 对象 A 释放
      resource.release();
      expect(resource.isDisposed()).toBe(false);

      // 对象 B 释放
      resource.release();
      expect(resource.isDisposed()).toBe(false);

      // 对象 C 释放
      resource.release();
      expect(resource.isDisposed()).toBe(true);
    });

    it('应该支持资源池模式', () => {
      const resources: TestResource[] = [];

      // 创建资源池
      for (let i = 0; i < 5; i++) {
        const resource = new TestResource();
        resource.setUrl(`texture_${i}.png`);
        resource.setSize(1024 * (i + 1));
        resources.push(resource);
      }

      // 使用资源
      for (const resource of resources) {
        resource.addRef();
        resource.setLoaded(true);
      }

      // 释放所有资源
      for (const resource of resources) {
        resource.release();
      }

      // 所有资源应该被释放
      for (const resource of resources) {
        expect(resource.isDisposed()).toBe(true);
      }
    });
  });
});
