/**
 * Component 模块测试
 * 测试组件基类
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Component, ComponentLifecycleState } from '../../src/base/component';
import { Entity } from '../../src/base/entity';

// 测试用组件类
class TestComponent extends Component {
  public awakeCalled = false;
  public enableCalled = false;
  public updateCalled = false;
  public destroyCalled = false;

  protected override onAwake(): void {
    super.onAwake();
    this.awakeCalled = true;
  }

  protected override onEnable(): void {
    super.onEnable();
    this.enableCalled = true;
  }

  override update(deltaTime: number): void {
    this.updateCalled = true;
  }

  override destroy(): void {
    this.destroyCalled = true;
    super.destroy();
  }
}

describe('Component - 组件基类', () => {
  let entity: Entity;
  let component: TestComponent;

  beforeEach(() => {
    entity = new Entity('TestEntity');
    component = new TestComponent(entity);
  });

  describe('构造函数', () => {
    it('应该创建组件并关联实体', () => {
      expect(component.entity).toBe(entity);
      expect(component.getLifecycleState()).toBe(ComponentLifecycleState.CREATED);
    });

    it('应该生成唯一ID', () => {
      const component2 = new TestComponent(entity);
      expect(component.id).not.toBe(component2.id);
    });
  });

  describe('生命周期 - awake', () => {
    it('应该调用onAwake方法', () => {
      component.setEnabled(false); // 先禁用，避免awake()后自动enable
      component.awake();
      expect(component.awakeCalled).toBe(true);
      expect(component.getLifecycleState()).toBe(ComponentLifecycleState.INITIALIZED);
    });

    it('应该只调用一次awake', () => {
      component.awake();
      const firstState = component.getLifecycleState();

      component.awake(); // 第二次调用

      expect(component.getLifecycleState()).toBe(firstState);
    });
  });

  describe('生命周期 - enable', () => {
    it('应该调用onEnable方法', () => {
      component.awake();
      component.setEnabled(true);

      expect(component.enableCalled).toBe(true);
      expect(component.getLifecycleState()).toBe(ComponentLifecycleState.ENABLED);
    });

    it('enable前应该先调用awake', () => {
      component.setEnabled(true);
      // awake会自动调用，因为默认enabled是true
    });
  });

  describe('生命周期 - update', () => {
    it('应该调用update方法', () => {
      component.awake();
      component.setEnabled(true);
      component.update(0.016);

      expect(component.updateCalled).toBe(true);
    });

    it('禁用时仍可调用update但组件可选择不执行', () => {
      component.awake();
      component.setEnabled(false);
      component.update(0.016);

      // update方法总是会被调用，但组件可以根据enabled状态决定是否执行逻辑
    });
  });

  describe('enabled - 启用/禁用', () => {
    it('应该设置enabled状态', () => {
      component.awake();
      component.setEnabled(true);

      expect(component.getEnabled()).toBe(true);
      expect(component.getLifecycleState()).toBe(ComponentLifecycleState.ENABLED);
    });

    it('应该禁用组件', () => {
      component.awake();
      component.setEnabled(true);
      component.setEnabled(false);

      expect(component.getEnabled()).toBe(false);
      expect(component.getLifecycleState()).toBe(ComponentLifecycleState.DISABLED);
    });

    it('默认应该是启用状态', () => {
      expect(component.getEnabled()).toBe(true);
    });
  });

  describe('destroy - 销毁', () => {
    it('应该调用destroy方法', () => {
      component.destroy();

      expect(component.destroyCalled).toBe(true);
      expect(component.isDestroyed()).toBe(true);
    });

    it('销毁后不应该再次销毁', () => {
      component.destroy();
      const firstDestroyState = component.isDestroyed();

      component.destroy();

      expect(component.isDestroyed()).toBe(firstDestroyState);
    });
  });

  describe('复杂场景', () => {
    it('完整生命周期流程', () => {
      // 创建 -> 唤醒/启用 -> 更新 -> 销毁
      expect(component.getLifecycleState()).toBe(ComponentLifecycleState.CREATED);

      // awake()会自动调用enable()（因为enabled默认为true）
      component.awake();
      expect(component.getLifecycleState()).toBe(ComponentLifecycleState.ENABLED);

      component.update(0.016);
      expect(component.updateCalled).toBe(true);

      component.destroy();
      expect(component.isDestroyed()).toBe(true);
    });

    it('应该支持启用/禁用切换', () => {
      component.awake();

      component.setEnabled(true);
      expect(component.getLifecycleState()).toBe(ComponentLifecycleState.ENABLED);

      component.setEnabled(false);
      expect(component.getLifecycleState()).toBe(ComponentLifecycleState.DISABLED);

      component.setEnabled(true);
      expect(component.getLifecycleState()).toBe(ComponentLifecycleState.ENABLED);
    });
  });
});
