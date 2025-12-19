/**
 * MaxObject 模块测试
 * 测试基础对象类
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { MaxObject } from '../../../src/ecs/base/max-object';

// 测试用子类
class TestMaxObject extends MaxObject {
  public disposeCount = 0;

  protected override onDispose(): void {
    this.disposeCount++;
  }
}

describe('MaxObject - 基础对象类', () => {
  let obj: TestMaxObject;

  beforeEach(() => {
    obj = new TestMaxObject();
  });

  describe('构造函数', () => {
    it('应该生成唯一 ID', () => {
      const obj1 = new TestMaxObject();
      const obj2 = new TestMaxObject();

      expect(obj1.id).not.toBe(obj2.id);
    });

    it('应该有默认名称', () => {
      expect(obj.name).toBeDefined();
    });

    it('应该有默认标签', () => {
      expect(obj.tag).toBeDefined();
    });
  });

  describe('ID 生成', () => {
    it('ID 应该是递增的', () => {
      const obj1 = new TestMaxObject();
      const obj2 = new TestMaxObject();
      const obj3 = new TestMaxObject();

      // ID 格式为 "Type_序号"，应该是递增的
      const id1 = parseInt(obj1.id.split('_')[1]);
      const id2 = parseInt(obj2.id.split('_')[1]);
      const id3 = parseInt(obj3.id.split('_')[1]);

      expect(id2).toBeGreaterThan(id1);
      expect(id3).toBeGreaterThan(id2);
    });

    it('ID 应该包含类型名称', () => {
      const obj = new TestMaxObject();

      expect(obj.id).toContain('TestMaxObject');
    });
  });

  describe('getId 方法', () => {
    it('应该返回与 id 属性相同的值', () => {
      const obj = new TestMaxObject();

      expect(obj.getId()).toBe(obj.id);
    });
  });

  describe('createTime 属性', () => {
    it('应该记录创建时间', () => {
      const before = Date.now();
      const obj = new TestMaxObject();
      const after = Date.now();

      expect(obj.createTime).toBeGreaterThanOrEqual(before);
      expect(obj.createTime).toBeLessThanOrEqual(after);
    });

    it('不同对象应该有不同的创建时间（如果创建间隔足够长）', async () => {
      const obj1 = new TestMaxObject();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const obj2 = new TestMaxObject();

      expect(obj2.createTime).toBeGreaterThanOrEqual(obj1.createTime);
    });
  });

  describe('name 属性', () => {
    it('应该可以设置名称', () => {
      obj.name = 'TestName';
      expect(obj.name).toBe('TestName');
    });
  });

  describe('tag 属性', () => {
    it('应该可以设置标签', () => {
      obj.tag = 'TestTag';
      expect(obj.tag).toBe('TestTag');
    });
  });

  describe('dispose - 释放', () => {
    it('应该正确释放对象', () => {
      expect(obj.isDisposed()).toBe(false);

      obj.dispose();

      expect(obj.isDisposed()).toBe(true);
      expect(obj.disposeCount).toBe(1);
    });

    it('多次调用 dispose 应该只执行一次', () => {
      obj.dispose();
      obj.dispose();
      obj.dispose();

      expect(obj.disposeCount).toBe(1);
    });

    it('应该调用 onDispose 钩子', () => {
      obj.dispose();

      expect(obj.disposeCount).toBe(1);
    });
  });

  describe('isDisposed - 检查释放状态', () => {
    it('未释放时应该返回 false', () => {
      expect(obj.isDisposed()).toBe(false);
    });

    it('释放后应该返回 true', () => {
      obj.dispose();
      expect(obj.isDisposed()).toBe(true);
    });
  });
});
