/**
 * hierarchy-utils 模块测试
 * 测试层级结构工具函数
 */

import { describe, it, expect } from '@jest/globals';
import {
  checkCircularReference,
  isAncestorOf,
  getAncestors,
  getHierarchyDepth,
  findCommonAncestor,
} from '../../src/utils/hierarchy-utils';

// 测试用节点类
class TestNode {
  public parent: TestNode | null = null;
  public children: TestNode[] = [];
  public name: string;

  constructor(name: string) {
    this.name = name;
  }

  setParent(parent: TestNode | null): void {
    if (this.parent) {
      const index = this.parent.children.indexOf(this);
      if (index !== -1) {
        this.parent.children.splice(index, 1);
      }
    }
    this.parent = parent;
    if (parent) {
      parent.children.push(this);
    }
  }

  getParent(): TestNode | null {
    return this.parent;
  }
}

describe('hierarchy-utils - 层级结构工具', () => {
  describe('checkCircularReference - 循环引用检测', () => {
    it('应该检测直接循环引用', () => {
      const nodeA = new TestNode('A');
      const nodeB = new TestNode('B');

      nodeB.setParent(nodeA);

      // 尝试让 A 成为 B 的子级（会形成循环）
      const hasCircular = checkCircularReference(nodeA, nodeB, (n) => n.getParent());

      expect(hasCircular).toBe(true);
    });

    it('应该检测间接循环引用', () => {
      const nodeA = new TestNode('A');
      const nodeB = new TestNode('B');
      const nodeC = new TestNode('C');

      nodeB.setParent(nodeA);
      nodeC.setParent(nodeB);

      // 尝试让 A 成为 C 的子级（会形成循环）
      const hasCircular = checkCircularReference(nodeA, nodeC, (n) => n.getParent());

      expect(hasCircular).toBe(true);
    });

    it('应该检测自引用', () => {
      const nodeA = new TestNode('A');

      // 尝试让 A 成为自己的子级
      const hasCircular = checkCircularReference(nodeA, nodeA, (n) => n.getParent());

      expect(hasCircular).toBe(true);
    });

    it('无循环引用时应该返回 false', () => {
      const nodeA = new TestNode('A');
      const nodeB = new TestNode('B');
      const nodeC = new TestNode('C');

      nodeB.setParent(nodeA);

      // C 不在 A-B 链中，可以安全地设置
      const hasCircular = checkCircularReference(nodeC, nodeA, (n) => n.getParent());

      expect(hasCircular).toBe(false);
    });

    it('节点没有父级时应该返回 false', () => {
      const nodeA = new TestNode('A');
      const nodeB = new TestNode('B');

      // nodeA 和 nodeB 都没有父级，不会形成循环
      const hasCircular = checkCircularReference(nodeA, nodeB, (n) => n.getParent());

      expect(hasCircular).toBe(false);
    });

    it('应该处理深层级结构', () => {
      const nodes: TestNode[] = [];
      for (let i = 0; i < 100; i++) {
        nodes.push(new TestNode(`Node${i}`));
      }

      // 创建深层级链
      for (let i = 1; i < nodes.length; i++) {
        nodes[i].setParent(nodes[i - 1]);
      }

      // 尝试让根节点成为最后一个节点的子级
      const hasCircular = checkCircularReference(nodes[0], nodes[99], (n) => n.getParent());

      expect(hasCircular).toBe(true);
    });

    it('应该处理分支结构', () => {
      const root = new TestNode('Root');
      const branch1 = new TestNode('Branch1');
      const branch2 = new TestNode('Branch2');
      const leaf1 = new TestNode('Leaf1');
      const leaf2 = new TestNode('Leaf2');

      branch1.setParent(root);
      branch2.setParent(root);
      leaf1.setParent(branch1);
      leaf2.setParent(branch2);

      // leaf1 和 leaf2 在不同分支，不应该有循环
      const hasCircular = checkCircularReference(leaf1, leaf2, (n) => n.getParent());

      expect(hasCircular).toBe(false);
    });
  });

  describe('isAncestorOf - 祖先检测', () => {
    it('应该检测直接父级是祖先', () => {
      const parent = new TestNode('Parent');
      const child = new TestNode('Child');

      child.setParent(parent);

      const result = isAncestorOf(parent, child, (n) => n.getParent());

      expect(result).toBe(true);
    });

    it('应该检测间接祖先', () => {
      const grandparent = new TestNode('Grandparent');
      const parent = new TestNode('Parent');
      const child = new TestNode('Child');

      parent.setParent(grandparent);
      child.setParent(parent);

      const result = isAncestorOf(grandparent, child, (n) => n.getParent());

      expect(result).toBe(true);
    });

    it('应该返回 false 对于非祖先节点', () => {
      const nodeA = new TestNode('A');
      const nodeB = new TestNode('B');

      const result = isAncestorOf(nodeA, nodeB, (n) => n.getParent());

      expect(result).toBe(false);
    });

    it('应该返回 false 对于子孙节点', () => {
      const parent = new TestNode('Parent');
      const child = new TestNode('Child');

      child.setParent(parent);

      // child 不是 parent 的祖先
      const result = isAncestorOf(child, parent, (n) => n.getParent());

      expect(result).toBe(false);
    });

    it('应该返回 false 对于同级节点', () => {
      const parent = new TestNode('Parent');
      const sibling1 = new TestNode('Sibling1');
      const sibling2 = new TestNode('Sibling2');

      sibling1.setParent(parent);
      sibling2.setParent(parent);

      const result = isAncestorOf(sibling1, sibling2, (n) => n.getParent());

      expect(result).toBe(false);
    });
  });

  describe('getAncestors - 获取所有祖先', () => {
    it('应该返回空数组对于根节点', () => {
      const root = new TestNode('Root');

      const ancestors = getAncestors(root, (n) => n.getParent());

      expect(ancestors).toEqual([]);
    });

    it('应该返回直接父级', () => {
      const parent = new TestNode('Parent');
      const child = new TestNode('Child');

      child.setParent(parent);

      const ancestors = getAncestors(child, (n) => n.getParent());

      expect(ancestors).toEqual([parent]);
    });

    it('应该返回所有祖先，从直接父级到根节点', () => {
      const grandparent = new TestNode('Grandparent');
      const parent = new TestNode('Parent');
      const child = new TestNode('Child');

      parent.setParent(grandparent);
      child.setParent(parent);

      const ancestors = getAncestors(child, (n) => n.getParent());

      expect(ancestors).toEqual([parent, grandparent]);
    });

    it('应该处理深层级结构', () => {
      const nodes: TestNode[] = [];
      for (let i = 0; i < 10; i++) {
        nodes.push(new TestNode(`Node${i}`));
      }

      // 创建链式层级
      for (let i = 1; i < nodes.length; i++) {
        nodes[i].setParent(nodes[i - 1]);
      }

      const ancestors = getAncestors(nodes[9], (n) => n.getParent());

      expect(ancestors.length).toBe(9);
      expect(ancestors[0]).toBe(nodes[8]);
      expect(ancestors[8]).toBe(nodes[0]);
    });
  });

  describe('getHierarchyDepth - 获取层级深度', () => {
    it('应该返回 0 对于根节点', () => {
      const root = new TestNode('Root');

      const depth = getHierarchyDepth(root, (n) => n.getParent());

      expect(depth).toBe(0);
    });

    it('应该返回 1 对于直接子节点', () => {
      const parent = new TestNode('Parent');
      const child = new TestNode('Child');

      child.setParent(parent);

      const depth = getHierarchyDepth(child, (n) => n.getParent());

      expect(depth).toBe(1);
    });

    it('应该返回正确的深度对于深层节点', () => {
      const nodes: TestNode[] = [];
      for (let i = 0; i < 5; i++) {
        nodes.push(new TestNode(`Node${i}`));
      }

      // 创建链式层级
      for (let i = 1; i < nodes.length; i++) {
        nodes[i].setParent(nodes[i - 1]);
      }

      expect(getHierarchyDepth(nodes[0], (n) => n.getParent())).toBe(0);
      expect(getHierarchyDepth(nodes[1], (n) => n.getParent())).toBe(1);
      expect(getHierarchyDepth(nodes[2], (n) => n.getParent())).toBe(2);
      expect(getHierarchyDepth(nodes[3], (n) => n.getParent())).toBe(3);
      expect(getHierarchyDepth(nodes[4], (n) => n.getParent())).toBe(4);
    });
  });

  describe('findCommonAncestor - 查找最近公共祖先', () => {
    it('应该返回 null 对于没有公共祖先的节点', () => {
      const nodeA = new TestNode('A');
      const nodeB = new TestNode('B');

      const result = findCommonAncestor(nodeA, nodeB, (n) => n.getParent());

      expect(result).toBeNull();
    });

    it('应该返回父节点作为公共祖先', () => {
      const parent = new TestNode('Parent');
      const child1 = new TestNode('Child1');
      const child2 = new TestNode('Child2');

      child1.setParent(parent);
      child2.setParent(parent);

      const result = findCommonAncestor(child1, child2, (n) => n.getParent());

      expect(result).toBe(parent);
    });

    it('应该返回祖先节点作为公共祖先', () => {
      const grandparent = new TestNode('Grandparent');
      const parent1 = new TestNode('Parent1');
      const parent2 = new TestNode('Parent2');
      const child1 = new TestNode('Child1');
      const child2 = new TestNode('Child2');

      parent1.setParent(grandparent);
      parent2.setParent(grandparent);
      child1.setParent(parent1);
      child2.setParent(parent2);

      const result = findCommonAncestor(child1, child2, (n) => n.getParent());

      expect(result).toBe(grandparent);
    });

    it('应该返回节点本身如果一个是另一个的祖先', () => {
      const parent = new TestNode('Parent');
      const child = new TestNode('Child');

      child.setParent(parent);

      const result = findCommonAncestor(parent, child, (n) => n.getParent());

      expect(result).toBe(parent);
    });

    it('应该返回节点本身如果两个节点相同', () => {
      const node = new TestNode('Node');

      const result = findCommonAncestor(node, node, (n) => n.getParent());

      expect(result).toBe(node);
    });

    it('应该找到深层结构中的公共祖先', () => {
      const root = new TestNode('Root');
      const branch1 = new TestNode('Branch1');
      const branch2 = new TestNode('Branch2');
      const leaf1a = new TestNode('Leaf1a');
      const leaf1b = new TestNode('Leaf1b');
      const leaf2a = new TestNode('Leaf2a');

      branch1.setParent(root);
      branch2.setParent(root);
      leaf1a.setParent(branch1);
      leaf1b.setParent(branch1);
      leaf2a.setParent(branch2);

      // 同一分支的叶子节点
      expect(findCommonAncestor(leaf1a, leaf1b, (n) => n.getParent())).toBe(branch1);

      // 不同分支的叶子节点
      expect(findCommonAncestor(leaf1a, leaf2a, (n) => n.getParent())).toBe(root);
    });
  });
});
