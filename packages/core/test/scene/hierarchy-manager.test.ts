/**
 * HierarchyManager 模块测试
 * 测试场景层级管理器功能
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { HierarchyManager } from '../../src/scene/hierarchy/hierarchy-manager';
import { World } from '../../src/ecs';
import { Parent, Children } from '../../src/components/transform';
import type { EntityId } from '../../src/ecs';

describe('HierarchyManager', () => {
  let world: World;
  let root: EntityId;
  let manager: HierarchyManager;

  beforeEach(() => {
    world = new World();
    root = world.createEntity();
    manager = new HierarchyManager(world, root);
  });

  describe('getRoot', () => {
    it('应该返回根实体', () => {
      expect(manager.getRoot()).toBe(root);
    });
  });

  describe('setParent', () => {
    it('应该设置父实体', () => {
      const parent = world.createEntity();
      const child = world.createEntity();

      manager.setParent(child, parent);

      expect(manager.getParent(child)).toBe(parent);
    });

    it('应该为子实体添加 Parent 组件', () => {
      const parent = world.createEntity();
      const child = world.createEntity();

      manager.setParent(child, parent);

      expect(world.hasComponent(child, Parent)).toBe(true);
      const parentComp = world.getComponent(child, Parent);
      expect(parentComp?.entity).toBe(parent);
    });

    it('应该为父实体添加 Children 组件', () => {
      const parent = world.createEntity();
      const child = world.createEntity();

      manager.setParent(child, parent);

      expect(world.hasComponent(parent, Children)).toBe(true);
      const childrenComp = world.getComponent(parent, Children);
      expect(childrenComp?.entities).toContain(child);
    });

    it('应该从旧父实体移除子实体', () => {
      const oldParent = world.createEntity();
      const newParent = world.createEntity();
      const child = world.createEntity();

      manager.setParent(child, oldParent);
      manager.setParent(child, newParent);

      const oldChildrenComp = world.getComponent(oldParent, Children);
      expect(oldChildrenComp?.entities).not.toContain(child);
    });

    it('应该在设置为 null 时使用根实体', () => {
      const child = world.createEntity();

      manager.setParent(child, null);

      expect(manager.getParent(child)).toBe(root);
    });

    it('应该更新已有的 Parent 组件', () => {
      const parent1 = world.createEntity();
      const parent2 = world.createEntity();
      const child = world.createEntity();

      manager.setParent(child, parent1);
      manager.setParent(child, parent2);

      const parentComp = world.getComponent(child, Parent);
      expect(parentComp?.entity).toBe(parent2);
    });

    it('应该不重复添加子实体到 Children', () => {
      const parent = world.createEntity();
      const child = world.createEntity();

      manager.setParent(child, parent);
      // 再次设置相同的父实体
      manager.setParent(child, parent);

      const childrenComp = world.getComponent(parent, Children);
      const count = childrenComp?.entities.filter((e) => e === child).length;
      expect(count).toBe(1);
    });

    it('应该处理根实体为 -1 的情况', () => {
      const noRootManager = new HierarchyManager(world, -1 as EntityId);
      const child = world.createEntity();

      noRootManager.setParent(child, null);

      // 当 actualParent === -1 时应该直接返回
      expect(noRootManager.getParent(child)).toBeNull();
    });
  });

  describe('getParent', () => {
    it('应该返回父实体', () => {
      const parent = world.createEntity();
      const child = world.createEntity();

      manager.setParent(child, parent);

      expect(manager.getParent(child)).toBe(parent);
    });

    it('应该返回 null 如果没有父实体', () => {
      const entity = world.createEntity();

      expect(manager.getParent(entity)).toBeNull();
    });
  });

  describe('getChildren', () => {
    it('应该返回子实体列表', () => {
      const parent = world.createEntity();
      const child1 = world.createEntity();
      const child2 = world.createEntity();

      manager.setParent(child1, parent);
      manager.setParent(child2, parent);

      const children = manager.getChildren(parent);
      expect(children).toContain(child1);
      expect(children).toContain(child2);
      expect(children.length).toBe(2);
    });

    it('应该返回空数组如果没有子实体', () => {
      const entity = world.createEntity();

      expect(manager.getChildren(entity)).toEqual([]);
    });

    it('应该返回子实体列表的副本', () => {
      const parent = world.createEntity();
      const child = world.createEntity();

      manager.setParent(child, parent);

      const children1 = manager.getChildren(parent);
      const children2 = manager.getChildren(parent);

      expect(children1).not.toBe(children2);
      expect(children1).toEqual(children2);
    });
  });

  describe('reparent', () => {
    it('应该重新设置父实体', () => {
      const oldParent = world.createEntity();
      const newParent = world.createEntity();
      const child = world.createEntity();

      manager.setParent(child, oldParent);
      manager.reparent(child, newParent);

      expect(manager.getParent(child)).toBe(newParent);
    });

    it('应该更新旧父实体的子实体列表', () => {
      const oldParent = world.createEntity();
      const newParent = world.createEntity();
      const child = world.createEntity();

      manager.setParent(child, oldParent);
      manager.reparent(child, newParent);

      expect(manager.getChildren(oldParent)).not.toContain(child);
    });

    it('应该更新新父实体的子实体列表', () => {
      const oldParent = world.createEntity();
      const newParent = world.createEntity();
      const child = world.createEntity();

      manager.setParent(child, oldParent);
      manager.reparent(child, newParent);

      expect(manager.getChildren(newParent)).toContain(child);
    });
  });

  describe('detachFromParent', () => {
    it('应该从父实体分离', () => {
      const parent = world.createEntity();
      const child = world.createEntity();

      manager.setParent(child, parent);
      manager.detachFromParent(child);

      expect(manager.getParent(child)).toBeNull();
    });

    it('应该从父实体的子实体列表中移除', () => {
      const parent = world.createEntity();
      const child = world.createEntity();

      manager.setParent(child, parent);
      manager.detachFromParent(child);

      expect(manager.getChildren(parent)).not.toContain(child);
    });

    it('应该移除 Parent 组件', () => {
      const parent = world.createEntity();
      const child = world.createEntity();

      manager.setParent(child, parent);
      manager.detachFromParent(child);

      expect(world.hasComponent(child, Parent)).toBe(false);
    });

    it('应该处理没有父实体的情况', () => {
      const entity = world.createEntity();

      expect(() => manager.detachFromParent(entity)).not.toThrow();
    });

    it('应该处理 Parent 组件 entity 为 null 的情况', () => {
      const child = world.createEntity();
      world.addComponent(child, Parent, Parent.fromData({ entity: null as any }));

      expect(() => manager.detachFromParent(child)).not.toThrow();
    });
  });

  describe('traverse', () => {
    it('应该遍历所有子实体', () => {
      const parent = world.createEntity();
      const child1 = world.createEntity();
      const child2 = world.createEntity();
      const grandchild = world.createEntity();

      manager.setParent(child1, parent);
      manager.setParent(child2, parent);
      manager.setParent(grandchild, child1);

      const visited: EntityId[] = [];
      manager.traverse(parent, (entity) => {
        visited.push(entity);
      });

      expect(visited).toContain(parent);
      expect(visited).toContain(child1);
      expect(visited).toContain(child2);
      expect(visited).toContain(grandchild);
      expect(visited.length).toBe(4);
    });

    it('应该先访问父实体再访问子实体', () => {
      const parent = world.createEntity();
      const child = world.createEntity();

      manager.setParent(child, parent);

      const visited: EntityId[] = [];
      manager.traverse(parent, (entity) => {
        visited.push(entity);
      });

      expect(visited.indexOf(parent)).toBeLessThan(visited.indexOf(child));
    });

    it('应该处理没有子实体的情况', () => {
      const entity = world.createEntity();

      const visited: EntityId[] = [];
      manager.traverse(entity, (e) => {
        visited.push(e);
      });

      expect(visited).toEqual([entity]);
    });
  });

  describe('traverseDepthFirst', () => {
    it('应该深度优先遍历所有子实体', () => {
      const parent = world.createEntity();
      const child1 = world.createEntity();
      const child2 = world.createEntity();
      const grandchild = world.createEntity();

      manager.setParent(child1, parent);
      manager.setParent(child2, parent);
      manager.setParent(grandchild, child1);

      const visited: Array<{ entity: EntityId; depth: number }> = [];
      manager.traverseDepthFirst(parent, (entity, depth) => {
        visited.push({ entity, depth });
      });

      expect(visited.length).toBe(4);
    });

    it('应该提供正确的深度值', () => {
      const parent = world.createEntity();
      const child = world.createEntity();
      const grandchild = world.createEntity();

      manager.setParent(child, parent);
      manager.setParent(grandchild, child);

      const depths: Map<EntityId, number> = new Map();
      manager.traverseDepthFirst(parent, (entity, depth) => {
        depths.set(entity, depth);
      });

      expect(depths.get(parent)).toBe(0);
      expect(depths.get(child)).toBe(1);
      expect(depths.get(grandchild)).toBe(2);
    });

    it('应该处理没有子实体的情况', () => {
      const entity = world.createEntity();

      const visited: Array<{ entity: EntityId; depth: number }> = [];
      manager.traverseDepthFirst(entity, (e, depth) => {
        visited.push({ entity: e, depth });
      });

      expect(visited).toEqual([{ entity, depth: 0 }]);
    });
  });

  describe('边界情况', () => {
    it('应该处理深层嵌套', () => {
      const entities: EntityId[] = [];
      for (let i = 0; i < 10; i++) {
        entities.push(world.createEntity());
      }

      for (let i = 1; i < entities.length; i++) {
        manager.setParent(entities[i], entities[i - 1]);
      }

      const depths: Map<EntityId, number> = new Map();
      manager.traverseDepthFirst(entities[0], (entity, depth) => {
        depths.set(entity, depth);
      });

      expect(depths.get(entities[0])).toBe(0);
      expect(depths.get(entities[9])).toBe(9);
    });

    it('应该处理多个子实体', () => {
      const parent = world.createEntity();
      const children: EntityId[] = [];

      for (let i = 0; i < 100; i++) {
        const child = world.createEntity();
        children.push(child);
        manager.setParent(child, parent);
      }

      const result = manager.getChildren(parent);
      expect(result.length).toBe(100);
      for (const child of children) {
        expect(result).toContain(child);
      }
    });
  });
});
