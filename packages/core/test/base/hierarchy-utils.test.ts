/**
 * hierarchy-utils 模块测试
 * 测试层级结构工具函数
 */

import { describe, it, expect } from '@jest/globals';
import { checkCircularReference } from '../../src/base/hierarchy-utils';

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
});
