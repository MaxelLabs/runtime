/**
 * Component 基类测试
 * 测试组件基类的功能
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Component } from '../../src/components/base/component';

// 创建测试用的具体组件类
class TestComponent extends Component {
  value: number = 0;

  static fromData(data: { value: number }): TestComponent {
    const component = new TestComponent();
    component.value = data.value;
    return component;
  }

  override clone(): TestComponent {
    const cloned = super.clone() as TestComponent;
    cloned.value = this.value;
    return cloned;
  }
}

// 创建带有 onAttach/onDetach 回调的组件
class LifecycleComponent extends Component {
  attachCalled = false;
  detachCalled = false;

  override onAttach(): void {
    this.attachCalled = true;
  }

  override onDetach(): void {
    this.detachCalled = true;
  }
}

describe('Component', () => {
  let component: TestComponent;

  beforeEach(() => {
    component = new TestComponent();
  });

  describe('构造函数', () => {
    it('应该创建默认启用的组件', () => {
      expect(component.enabled).toBe(true);
    });

    it('应该创建非脏的组件', () => {
      expect(component.dirty).toBe(false);
    });

    it('应该创建没有实体 ID 的组件', () => {
      expect(component.entityId).toBeNull();
    });
  });

  describe('enabled 属性', () => {
    it('应该获取启用状态', () => {
      expect(component.enabled).toBe(true);
    });

    it('应该设置启用状态', () => {
      component.enabled = false;
      expect(component.enabled).toBe(false);
    });

    it('应该在启用状态改变时标记为脏', () => {
      expect(component.dirty).toBe(false);
      component.enabled = false;
      expect(component.dirty).toBe(true);
    });

    it('应该在启用状态不变时不标记为脏', () => {
      component.enabled = true; // 已经是 true
      expect(component.dirty).toBe(false);
    });
  });

  describe('dirty 属性', () => {
    it('应该获取脏状态', () => {
      expect(component.dirty).toBe(false);
    });

    it('应该在 markDirty 后返回 true', () => {
      component.markDirty();
      expect(component.dirty).toBe(true);
    });
  });

  describe('entityId 属性', () => {
    it('应该获取实体 ID', () => {
      expect(component.entityId).toBeNull();
    });

    it('应该通过 setEntityId 设置实体 ID', () => {
      component.setEntityId(42);
      expect(component.entityId).toBe(42);
    });

    it('应该支持设置为 null', () => {
      component.setEntityId(42);
      component.setEntityId(null);
      expect(component.entityId).toBeNull();
    });
  });

  describe('markDirty', () => {
    it('应该标记组件为脏', () => {
      expect(component.dirty).toBe(false);
      component.markDirty();
      expect(component.dirty).toBe(true);
    });

    it('应该可以多次调用', () => {
      component.markDirty();
      component.markDirty();
      expect(component.dirty).toBe(true);
    });
  });

  describe('clearDirty', () => {
    it('应该清除脏标记', () => {
      component.markDirty();
      expect(component.dirty).toBe(true);
      component.clearDirty();
      expect(component.dirty).toBe(false);
    });

    it('应该在非脏状态下也能调用', () => {
      expect(component.dirty).toBe(false);
      component.clearDirty();
      expect(component.dirty).toBe(false);
    });
  });

  describe('onAttach', () => {
    it('应该在组件附加时被调用', () => {
      const lifecycleComponent = new LifecycleComponent();
      expect(lifecycleComponent.attachCalled).toBe(false);
      lifecycleComponent.onAttach();
      expect(lifecycleComponent.attachCalled).toBe(true);
    });

    it('基类的 onAttach 应该是空操作', () => {
      // 基类的 onAttach 不应该抛出错误
      expect(() => component.onAttach()).not.toThrow();
    });
  });

  describe('onDetach', () => {
    it('应该在组件分离时被调用', () => {
      const lifecycleComponent = new LifecycleComponent();
      expect(lifecycleComponent.detachCalled).toBe(false);
      lifecycleComponent.onDetach();
      expect(lifecycleComponent.detachCalled).toBe(true);
    });

    it('基类的 onDetach 应该是空操作', () => {
      // 基类的 onDetach 不应该抛出错误
      expect(() => component.onDetach()).not.toThrow();
    });
  });

  describe('clone', () => {
    it('应该克隆组件', () => {
      component.value = 42;
      component.enabled = false;
      component.markDirty();

      const cloned = component.clone();

      expect(cloned).toBeInstanceOf(TestComponent);
      expect(cloned).not.toBe(component);
      expect(cloned.value).toBe(42);
      expect(cloned.enabled).toBe(false);
      expect(cloned.dirty).toBe(true);
    });

    it('应该创建独立的副本', () => {
      component.value = 10;
      const cloned = component.clone();

      cloned.value = 20;

      expect(component.value).toBe(10);
      expect(cloned.value).toBe(20);
    });

    it('应该不复制实体 ID', () => {
      component.setEntityId(42);
      const cloned = component.clone();

      // 克隆的组件不应该有实体 ID（因为它还没有被添加到实体）
      expect(cloned.entityId).toBeNull();
    });
  });

  describe('dispose', () => {
    it('应该释放组件资源', () => {
      component.setEntityId(42);
      component.markDirty();

      component.dispose();

      expect(component.entityId).toBeNull();
      expect(component.dirty).toBe(false);
      expect(component.isDisposed()).toBe(true);
    });

    it('应该只释放一次', () => {
      component.dispose();
      expect(() => component.dispose()).not.toThrow();
    });
  });

  describe('引用计数（继承自 ReferResource）', () => {
    it('应该支持引用计数', () => {
      expect(component.refCount).toBe(0);

      component.addRef();
      expect(component.refCount).toBe(1);

      component.addRef();
      expect(component.refCount).toBe(2);
    });

    it('应该在引用计数为 0 且已加载时释放', () => {
      // 需要设置 isLoaded 为 true，否则 release() 不会触发 dispose()
      component.setLoaded(true);
      component.addRef();
      component.addRef();

      component.release();
      expect(component.isDisposed()).toBe(false);

      component.release();
      expect(component.isDisposed()).toBe(true);
    });

    it('应该在引用计数为 0 但未加载时不释放', () => {
      // isLoaded 默认为 false
      component.addRef();
      component.release();
      expect(component.isDisposed()).toBe(false);
    });
  });

  describe('fromData 静态方法', () => {
    it('应该从数据创建组件', () => {
      const data = { value: 100 };
      const created = TestComponent.fromData(data);

      expect(created).toBeInstanceOf(TestComponent);
      expect(created.value).toBe(100);
    });
  });
});

describe('Component 子类', () => {
  describe('自定义组件', () => {
    class CustomComponent extends Component {
      customName: string = '';
      count: number = 0;

      static fromData(data: { customName: string; count: number }): CustomComponent {
        const component = new CustomComponent();
        component.customName = data.customName;
        component.count = data.count;
        return component;
      }

      override clone(): CustomComponent {
        const cloned = super.clone() as CustomComponent;
        cloned.customName = this.customName;
        cloned.count = this.count;
        return cloned;
      }

      increment(): void {
        this.count++;
        this.markDirty();
      }
    }

    it('应该支持自定义属性', () => {
      const component = new CustomComponent();
      component.customName = 'Test';
      component.count = 5;

      expect(component.customName).toBe('Test');
      expect(component.count).toBe(5);
    });

    it('应该支持自定义方法', () => {
      const component = new CustomComponent();
      component.count = 0;

      component.increment();

      expect(component.count).toBe(1);
      expect(component.dirty).toBe(true);
    });

    it('应该正确克隆自定义属性', () => {
      const component = CustomComponent.fromData({ customName: 'Original', count: 10 });
      const cloned = component.clone();

      expect(cloned.customName).toBe('Original');
      expect(cloned.count).toBe(10);
    });
  });
});
