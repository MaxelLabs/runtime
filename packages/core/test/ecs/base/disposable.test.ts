/**
 * Disposable 模块测试
 * 测试 IDisposable 接口和相关工具函数
 */

import { describe, it, expect } from '@jest/globals';
import type { IDisposable } from '../../../src/ecs/base/disposable';
import {
  Disposable,
  dispose,
  disposeAll,
  using,
  usingAsync,
  combineDisposables,
  DisposableCollector,
} from '../../../src/ecs/base/disposable';

// 测试用 Disposable 实现
class TestDisposable extends Disposable {
  public disposeCount = 0;

  protected onDispose(): void {
    this.disposeCount++;
  }
}

// 简单的 IDisposable 实现
class SimpleDisposable implements IDisposable {
  private _disposed = false;
  public disposeCount = 0;

  dispose(): void {
    if (!this._disposed) {
      this._disposed = true;
      this.disposeCount++;
    }
  }

  isDisposed(): boolean {
    return this._disposed;
  }
}

describe('Disposable - 可释放资源', () => {
  describe('Disposable 抽象类', () => {
    it('应该正确实现 dispose 方法', () => {
      const disposable = new TestDisposable();

      expect(disposable.isDisposed()).toBe(false);

      disposable.dispose();

      expect(disposable.isDisposed()).toBe(true);
      expect(disposable.disposeCount).toBe(1);
    });

    it('多次调用 dispose 应该只执行一次', () => {
      const disposable = new TestDisposable();

      disposable.dispose();
      disposable.dispose();
      disposable.dispose();

      expect(disposable.disposeCount).toBe(1);
    });
  });

  describe('dispose 辅助函数', () => {
    it('应该安全地释放对象', () => {
      const disposable = new SimpleDisposable();

      dispose(disposable);

      expect(disposable.isDisposed()).toBe(true);
    });

    it('应该安全地处理 null', () => {
      expect(() => dispose(null)).not.toThrow();
    });

    it('应该安全地处理 undefined', () => {
      expect(() => dispose(undefined)).not.toThrow();
    });
  });

  describe('disposeAll 辅助函数', () => {
    it('应该释放所有对象', () => {
      const disposables = [new SimpleDisposable(), new SimpleDisposable(), new SimpleDisposable()];

      disposeAll(disposables);

      disposables.forEach((d) => {
        expect(d.isDisposed()).toBe(true);
      });
    });

    it('应该安全地处理空数组', () => {
      expect(() => disposeAll([])).not.toThrow();
    });

    it('应该安全地处理包含 null 的数组', () => {
      const disposables = [new SimpleDisposable(), null, new SimpleDisposable()];

      expect(() => disposeAll(disposables as any)).not.toThrow();
    });
  });

  describe('using 辅助函数', () => {
    it('应该在回调后自动释放资源', () => {
      const disposable = new SimpleDisposable();
      let callbackExecuted = false;

      const result = using(disposable, (d) => {
        callbackExecuted = true;
        expect(d.isDisposed()).toBe(false);
        return 'result';
      });

      expect(callbackExecuted).toBe(true);
      expect(result).toBe('result');
      expect(disposable.isDisposed()).toBe(true);
    });

    it('回调抛出异常时也应该释放资源', () => {
      const disposable = new SimpleDisposable();

      expect(() => {
        using(disposable, () => {
          throw new Error('test error');
        });
      }).toThrow('test error');

      expect(disposable.isDisposed()).toBe(true);
    });
  });

  describe('usingAsync 辅助函数', () => {
    it('应该在异步回调后自动释放资源', async () => {
      const disposable = new SimpleDisposable();

      const result = await usingAsync(disposable, async (d) => {
        expect(d.isDisposed()).toBe(false);
        return 'async result';
      });

      expect(result).toBe('async result');
      expect(disposable.isDisposed()).toBe(true);
    });

    it('异步回调抛出异常时也应该释放资源', async () => {
      const disposable = new SimpleDisposable();

      await expect(
        usingAsync(disposable, async () => {
          throw new Error('async error');
        })
      ).rejects.toThrow('async error');

      expect(disposable.isDisposed()).toBe(true);
    });
  });

  describe('combineDisposables 辅助函数', () => {
    it('应该组合多个 disposable', () => {
      const d1 = new SimpleDisposable();
      const d2 = new SimpleDisposable();
      const d3 = new SimpleDisposable();

      const combined = combineDisposables(d1, d2, d3);

      expect(combined.isDisposed()).toBe(false);

      combined.dispose();

      expect(combined.isDisposed()).toBe(true);
      expect(d1.isDisposed()).toBe(true);
      expect(d2.isDisposed()).toBe(true);
      expect(d3.isDisposed()).toBe(true);
    });
  });

  describe('DisposableCollector', () => {
    it('应该收集和释放多个 disposable', () => {
      const collector = new DisposableCollector();
      const d1 = new SimpleDisposable();
      const d2 = new SimpleDisposable();

      collector.add(d1);
      collector.add(d2);

      expect(collector.count).toBe(2);

      collector.dispose();

      expect(d1.isDisposed()).toBe(true);
      expect(d2.isDisposed()).toBe(true);
      expect(collector.isDisposed()).toBe(true);
    });

    it('应该支持移除 disposable', () => {
      const collector = new DisposableCollector();
      const d1 = new SimpleDisposable();

      collector.add(d1);
      expect(collector.count).toBe(1);

      collector.remove(d1);
      expect(collector.count).toBe(0);

      collector.dispose();
      expect(d1.isDisposed()).toBe(false); // 已移除，不应被释放
    });

    it('已释放的收集器添加新资源应该立即释放', () => {
      const collector = new DisposableCollector();
      collector.dispose();

      const d1 = new SimpleDisposable();
      collector.add(d1);

      // 添加到已释放的收集器，资源应该被立即释放
      expect(d1.isDisposed()).toBe(true);
    });
  });
});
