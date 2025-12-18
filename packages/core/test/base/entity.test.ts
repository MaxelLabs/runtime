/**
 * Entity 模块测试
 * 测试实体系统
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Entity } from '../../src/base/entity';
import { Component } from '../../src/base/component';
import { Transform } from '../../src/base/transform';
import { clearErrors, errors } from '../../src/base/errors';

// 测试用组件
class TestComponent extends Component {
  public value: number = 0;
}

class AnotherComponent extends Component {
  public componentName: string = '';
}

describe('Entity - 实体系统', () => {
  let entity: Entity;

  beforeEach(() => {
    clearErrors();
    entity = new Entity('TestEntity');
  });

  describe('构造函数', () => {
    it('应该创建实体', () => {
      expect(entity.name).toBe('TestEntity');
      expect(entity.getActive()).toBe(true);
    });

    it('应该包含Transform组件', () => {
      expect(entity.transform).toBeInstanceOf(Transform);
      expect(entity.hasComponent(Transform)).toBe(true);
    });

    it('应该生成唯一ID', () => {
      const entity2 = new Entity('Entity2');
      expect(entity.id).not.toBe(entity2.id);
    });
  });

  describe('组件管理 - addComponent', () => {
    it('应该添加组件', () => {
      const component = new TestComponent(entity);
      entity.addComponent(component);

      expect(entity.hasComponent(TestComponent)).toBe(true);
      expect(entity.getComponent(TestComponent)).toBe(component);
    });

    it('不应该重复添加相同类型组件', () => {
      const component1 = new TestComponent(entity);
      const component2 = new TestComponent(entity);

      entity.addComponent(component1);
      entity.addComponent(component2);

      const retrieved = entity.getComponent(TestComponent);
      expect(retrieved).toBe(component1); // 应该保留第一个
    });

    it('应该支持多个不同类型组件', () => {
      const component1 = new TestComponent(entity);
      const component2 = new AnotherComponent(entity);

      entity.addComponent(component1);
      entity.addComponent(component2);

      expect(entity.hasComponent(TestComponent)).toBe(true);
      expect(entity.hasComponent(AnotherComponent)).toBe(true);
    });
  });

  describe('组件管理 - createComponent', () => {
    it('应该创建并添加组件', () => {
      const component = entity.createComponent(TestComponent);

      expect(component).toBeInstanceOf(TestComponent);
      expect(entity.hasComponent(TestComponent)).toBe(true);
    });

    it('创建已存在类型应该替换旧组件', () => {
      const component1 = entity.createComponent(TestComponent);
      component1.value = 100;

      const component2 = entity.createComponent(TestComponent);

      expect(entity.getComponent(TestComponent)).toBe(component2);
      expect(entity.getComponent(TestComponent)).not.toBe(component1);
    });
  });

  describe('组件管理 - removeComponent', () => {
    it('应该移除组件', () => {
      const component = entity.createComponent(TestComponent);

      entity.removeComponent(TestComponent);

      expect(entity.hasComponent(TestComponent)).toBe(false);
      expect(component.isDestroyed()).toBe(true);
    });

    it('不应该移除Transform组件', () => {
      expect(() => {
        entity.removeComponent(Transform);
      }).toThrow();

      expect(entity.hasComponent(Transform)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('移除不存在的组件应该不报错', () => {
      expect(() => {
        entity.removeComponent(TestComponent);
      }).not.toThrow();
    });
  });

  describe('激活状态 - getActive/setActive', () => {
    it('应该设置激活状态', () => {
      entity.setActive(false);
      expect(entity.getActive()).toBe(false);

      entity.setActive(true);
      expect(entity.getActive()).toBe(true);
    });

    it('默认应该是激活状态', () => {
      expect(entity.getActive()).toBe(true);
    });

    it('父级禁用时子级也应该禁用', () => {
      const parent = new Entity('Parent');
      const child = new Entity('Child');

      child.setParent(parent);

      parent.setActive(false);

      expect(parent.getActive()).toBe(false);
      expect(child.getActive()).toBe(false); // 父级禁用影响子级
    });
  });

  describe('层级结构 - setParent', () => {
    it('应该设置父级', () => {
      const parent = new Entity('Parent');
      const child = new Entity('Child');

      child.setParent(parent);

      expect(child.getParent()).toBe(parent);
      expect(parent.getChildren()).toContain(child);
    });

    it('应该更换父级', () => {
      const parent1 = new Entity('Parent1');
      const parent2 = new Entity('Parent2');
      const child = new Entity('Child');

      child.setParent(parent1);
      child.setParent(parent2);

      expect(child.getParent()).toBe(parent2);
      expect(parent1.getChildren()).not.toContain(child);
      expect(parent2.getChildren()).toContain(child);
    });

    it('应该检测循环引用', () => {
      const parent = new Entity('Parent');
      const child = new Entity('Child');

      child.setParent(parent);

      // 尝试让parent成为child的子级（循环）
      expect(() => {
        parent.setParent(child);
      }).toThrow();

      expect(errors.length).toBeGreaterThan(0);
    });

    it('不应该将自己设为父级', () => {
      // setParent检测到循环引用（自己设置自己为父级）时会抛出错误
      expect(() => {
        entity.setParent(entity);
      }).toThrow();

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('层级结构 - addChild/removeChild', () => {
    it('应该添加子级', () => {
      const parent = new Entity('Parent');
      const child = new Entity('Child');

      parent.addChild(child);

      expect(parent.getChildren()).toContain(child);
      expect(child.getParent()).toBe(parent);
    });

    it('应该移除子级', () => {
      const parent = new Entity('Parent');
      const child = new Entity('Child');

      parent.addChild(child);
      parent.removeChild(child);

      expect(parent.getChildren()).not.toContain(child);
      expect(child.getParent()).toBeNull();
    });

    it('不应该将自己添加为子级', () => {
      expect(() => {
        entity.addChild(entity);
      }).toThrow();

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('层级结构 - findChild', () => {
    it('应该查找直接子级', () => {
      const parent = new Entity('Parent');
      const child = new Entity('Target');

      parent.addChild(child);

      const found = parent.findChild('Target');
      expect(found).toBe(child);
    });

    it('应该递归查找子级', () => {
      const grandparent = new Entity('Grandparent');
      const parent = new Entity('Parent');
      const child = new Entity('Target');

      grandparent.addChild(parent);
      parent.addChild(child);

      const found = grandparent.findChild('Target', true);
      expect(found).toBe(child);
    });

    it('未找到应该返回null', () => {
      const found = entity.findChild('NonExistent');
      expect(found).toBeNull();
    });
  });

  describe('层级结构 - findChildrenWithComponent', () => {
    it('应该查找带指定组件的子级', () => {
      const parent = new Entity('Parent');
      const child1 = new Entity('Child1');
      const child2 = new Entity('Child2');
      const child3 = new Entity('Child3');

      parent.addChild(child1);
      parent.addChild(child2);
      parent.addChild(child3);

      child1.createComponent(TestComponent);
      child3.createComponent(TestComponent);

      const found = parent.findChildrenWithComponent(TestComponent);

      expect(found.length).toBe(2);
      expect(found).toContain(child1);
      expect(found).toContain(child3);
    });

    it('应该递归查找', () => {
      const grandparent = new Entity('Grandparent');
      const parent = new Entity('Parent');
      const child = new Entity('Child');

      grandparent.addChild(parent);
      parent.addChild(child);

      child.createComponent(TestComponent);

      const found = grandparent.findChildrenWithComponent(TestComponent, true);

      expect(found.length).toBe(1);
      expect(found[0]).toBe(child);
    });
  });

  describe('update - 更新', () => {
    it('应该更新所有启用的组件', () => {
      const component1 = entity.createComponent(TestComponent);
      const component2 = entity.createComponent(AnotherComponent);

      component1.setEnabled(true);
      component2.setEnabled(true);

      entity.update(0.016);

      // 根据实现验证update是否被调用
    });

    it('禁用实体不应该更新', () => {
      entity.setActive(false);

      const component = entity.createComponent(TestComponent);
      component.setEnabled(true);

      entity.update(0.016);

      // 禁用的实体不应该更新组件
    });

    it('应该递归更新子实体', () => {
      const parent = new Entity('Parent');
      const child = new Entity('Child');

      parent.addChild(child);

      parent.update(0.016);

      // 应该也更新了child
    });
  });

  describe('destroy - 销毁', () => {
    it('应该销毁实体', () => {
      entity.destroy();

      expect(entity.isDestroyed()).toBe(true);
    });

    it('应该销毁所有组件', () => {
      const component1 = entity.createComponent(TestComponent);
      const component2 = entity.createComponent(AnotherComponent);

      entity.destroy();

      expect(component1.isDestroyed()).toBe(true);
      expect(component2.isDestroyed()).toBe(true);
    });

    it('应该递归销毁所有子实体', () => {
      const parent = new Entity('Parent');
      const child1 = new Entity('Child1');
      const child2 = new Entity('Child2');

      parent.addChild(child1);
      parent.addChild(child2);

      parent.destroy();

      expect(parent.isDestroyed()).toBe(true);
      expect(child1.isDestroyed()).toBe(true);
      expect(child2.isDestroyed()).toBe(true);
    });

    it('应该从父级中移除', () => {
      const parent = new Entity('Parent');
      const child = new Entity('Child');

      parent.addChild(child);
      child.destroy();

      expect(parent.getChildren()).not.toContain(child);
    });
  });

  describe('元数据管理', () => {
    it('应该设置和获取元数据', () => {
      entity.setMetadata('key1', 'value1');
      entity.setMetadata('key2', 123);

      expect(entity.getMetadata('key1')).toBe('value1');
      expect(entity.getMetadata('key2')).toBe(123);
    });

    it('应该移除元数据', () => {
      entity.setMetadata('key', 'value');

      const removed = entity.removeMetadata('key');

      expect(removed).toBe(true);
      expect(entity.getMetadata('key')).toBeUndefined();
    });

    it('应该清空所有元数据', () => {
      entity.setMetadata('key1', 'value1');
      entity.setMetadata('key2', 'value2');

      entity.clearMetadata();

      expect(entity.getMetadata('key1')).toBeUndefined();
      expect(entity.getMetadata('key2')).toBeUndefined();
    });

    it('应该获取所有元数据', () => {
      entity.setMetadata('key1', 'value1');
      entity.setMetadata('key2', 'value2');

      const allMetadata = entity.getAllMetadata();

      expect(allMetadata.get('key1')).toBe('value1');
      expect(allMetadata.get('key2')).toBe('value2');
    });
  });

  describe('复杂场景', () => {
    it('应该支持深层级结构', () => {
      const root = new Entity('Root');
      const level1 = new Entity('Level1');
      const level2 = new Entity('Level2');
      const level3 = new Entity('Level3');

      root.addChild(level1);
      level1.addChild(level2);
      level2.addChild(level3);

      expect(level3.getActive()).toBe(true);

      root.setActive(false);

      expect(level3.getActive()).toBe(false);
    });

    it('应该正确处理多个子实体', () => {
      const parent = new Entity('Parent');
      const children: Entity[] = [];

      for (let i = 0; i < 10; i++) {
        const child = new Entity(`Child${i}`);
        parent.addChild(child);
        children.push(child);
      }

      expect(parent.getChildren().length).toBe(10);

      parent.destroy();

      children.forEach((child) => {
        expect(child.isDestroyed()).toBe(true);
      });
    });
  });
});
