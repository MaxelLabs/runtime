/**
 * DAG 调度器测试
 * 测试 DAG 拓扑排序和依赖管理
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { DAGScheduler } from '../../src/ecs/dag-scheduler';

describe('DAGScheduler', () => {
  let scheduler: DAGScheduler<string>;

  beforeEach(() => {
    scheduler = new DAGScheduler<string>();
  });

  describe('addNode 方法', () => {
    it('应该添加节点', () => {
      scheduler.addNode('A', 'Node A');
      expect(scheduler.getNodeCount()).toBe(1);
    });

    it('应该替换同名节点', () => {
      scheduler.addNode('A', 'Node A v1');
      scheduler.addNode('A', 'Node A v2');
      expect(scheduler.getNodeCount()).toBe(1);
    });
  });

  describe('addDependency 方法', () => {
    it('应该添加依赖关系', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');

      const result = scheduler.addDependency('B', 'A');
      expect(result).toBe(true);

      const infoA = scheduler.getNodeInfo('A');
      const infoB = scheduler.getNodeInfo('B');

      expect(infoB?.dependencies).toContain('A');
      expect(infoA?.dependents).toContain('B');
    });

    it('应该返回 false 如果节点不存在', () => {
      scheduler.addNode('A', 'Node A');

      const result = scheduler.addDependency('B', 'A');
      expect(result).toBe(false);
    });
  });

  describe('removeNode 方法', () => {
    it('应该移除节点', () => {
      scheduler.addNode('A', 'Node A');
      const result = scheduler.removeNode('A');

      expect(result).toBe(true);
      expect(scheduler.getNodeCount()).toBe(0);
    });

    it('应该清理相关依赖关系', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');
      scheduler.addNode('C', 'Node C');

      scheduler.addDependency('B', 'A');
      scheduler.addDependency('C', 'B');

      scheduler.removeNode('B');

      const infoA = scheduler.getNodeInfo('A');
      const infoC = scheduler.getNodeInfo('C');

      expect(infoA?.dependents).not.toContain('B');
      expect(infoC?.dependencies).not.toContain('B');
    });

    it('应该返回 false 如果节点不存在', () => {
      const result = scheduler.removeNode('NonExistent');
      expect(result).toBe(false);
    });
  });

  describe('topologicalSort 方法', () => {
    it('应该排序无依赖的节点', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');
      scheduler.addNode('C', 'Node C');

      const result = scheduler.topologicalSort();

      expect(result.success).toBe(true);
      expect(result.sorted).toHaveLength(3);
      expect(result.sorted.map((n) => n.id)).toEqual(expect.arrayContaining(['A', 'B', 'C']));
    });

    it('应该排序简单依赖链', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');
      scheduler.addNode('C', 'Node C');

      // C -> B -> A (C 依赖 B，B 依赖 A)
      scheduler.addDependency('B', 'A');
      scheduler.addDependency('C', 'B');

      const result = scheduler.topologicalSort();

      expect(result.success).toBe(true);
      const ids = result.sorted.map((n) => n.id);
      expect(ids.indexOf('A')).toBeLessThan(ids.indexOf('B'));
      expect(ids.indexOf('B')).toBeLessThan(ids.indexOf('C'));
    });

    it('应该排序 DAG', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');
      scheduler.addNode('C', 'Node C');
      scheduler.addNode('D', 'Node D');

      // D -> B -> A
      // D -> C -> A
      scheduler.addDependency('B', 'A');
      scheduler.addDependency('C', 'A');
      scheduler.addDependency('D', 'B');
      scheduler.addDependency('D', 'C');

      const result = scheduler.topologicalSort();

      expect(result.success).toBe(true);
      const ids = result.sorted.map((n) => n.id);

      // A 必须在 B 和 C 之前
      expect(ids.indexOf('A')).toBeLessThan(ids.indexOf('B'));
      expect(ids.indexOf('A')).toBeLessThan(ids.indexOf('C'));

      // B 和 C 必须在 D 之前
      expect(ids.indexOf('B')).toBeLessThan(ids.indexOf('D'));
      expect(ids.indexOf('C')).toBeLessThan(ids.indexOf('D'));
    });

    it('应该检测循环依赖', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');
      scheduler.addNode('C', 'Node C');

      // A -> B -> C -> A (循环)
      scheduler.addDependency('B', 'A');
      scheduler.addDependency('C', 'B');
      scheduler.addDependency('A', 'C');

      const result = scheduler.topologicalSort();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.cycle).toBeDefined();
      expect(result.cycle!.length).toBeGreaterThan(0);
    });

    it('应该检测自循环', () => {
      scheduler.addNode('A', 'Node A');

      // A -> A
      scheduler.addDependency('A', 'A');

      const result = scheduler.topologicalSort();

      expect(result.success).toBe(false);
    });
  });

  describe('detectCycle 方法', () => {
    it('应该返回空数组如果无循环', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');
      scheduler.addDependency('B', 'A');

      const cycle = scheduler.detectCycle();
      expect(cycle).toHaveLength(0);
    });

    it('应该检测简单循环', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');

      // A -> B -> A
      scheduler.addDependency('B', 'A');
      scheduler.addDependency('A', 'B');

      const cycle = scheduler.detectCycle();
      expect(cycle.length).toBeGreaterThan(0);
    });

    it('应该检测复杂循环', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');
      scheduler.addNode('C', 'Node C');
      scheduler.addNode('D', 'Node D');

      // A -> B -> C -> D -> B (循环在 B-C-D 中)
      scheduler.addDependency('B', 'A');
      scheduler.addDependency('C', 'B');
      scheduler.addDependency('D', 'C');
      scheduler.addDependency('B', 'D');

      const cycle = scheduler.detectCycle();
      expect(cycle.length).toBeGreaterThan(0);
    });

    it('应该返回完整的循环路径', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');
      scheduler.addNode('C', 'Node C');

      // A -> B -> C -> A (完整循环)
      scheduler.addDependency('B', 'A');
      scheduler.addDependency('C', 'B');
      scheduler.addDependency('A', 'C');

      const cycle = scheduler.detectCycle();

      // 循环路径应该包含所有参与循环的节点
      expect(cycle.length).toBeGreaterThanOrEqual(3);
      // 循环应该形成闭环（首尾相连）
      expect(cycle[0]).toBe(cycle[cycle.length - 1]);
    });

    it('应该返回无重复节点的循环路径（除首尾闭环）', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');
      scheduler.addNode('C', 'Node C');

      // A -> B -> C -> A (完整循环)
      scheduler.addDependency('B', 'A');
      scheduler.addDependency('C', 'B');
      scheduler.addDependency('A', 'C');

      const cycle = scheduler.detectCycle();

      // 验证循环路径格式正确：['A', 'B', 'C', 'A'] 或类似
      // 首尾相同，中间无重复
      expect(cycle[0]).toBe(cycle[cycle.length - 1]);

      // 除了首尾，中间不应有重复节点
      const middlePart = cycle.slice(0, -1);
      const uniqueMiddle = new Set(middlePart);
      expect(uniqueMiddle.size).toBe(middlePart.length);
    });

    it('应该返回精确的循环路径格式', () => {
      scheduler.addNode('X', 'Node X');
      scheduler.addNode('Y', 'Node Y');

      // X -> Y -> X (简单循环)
      scheduler.addDependency('Y', 'X');
      scheduler.addDependency('X', 'Y');

      const cycle = scheduler.detectCycle();

      // 循环路径应该是 ['X', 'Y', 'X'] 或 ['Y', 'X', 'Y']
      expect(cycle.length).toBe(3);
      expect(cycle[0]).toBe(cycle[2]);
      expect(cycle[0]).not.toBe(cycle[1]);
    });

    it('应该检测自循环', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addDependency('A', 'A');

      const cycle = scheduler.detectCycle();
      expect(cycle.length).toBeGreaterThan(0);
      expect(cycle).toContain('A');
    });
  });

  describe('analyzeParallelBatches 方法', () => {
    it('应该分析独立节点为单批次', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');
      scheduler.addNode('C', 'Node C');

      const batches = scheduler.analyzeParallelBatches();

      expect(batches).toHaveLength(1);
      expect(batches[0].level).toBe(0);
      expect(batches[0].nodes).toHaveLength(3);
    });

    it('应该分析简单依赖链为多批次', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');
      scheduler.addNode('C', 'Node C');

      // C -> B -> A
      scheduler.addDependency('B', 'A');
      scheduler.addDependency('C', 'B');

      const batches = scheduler.analyzeParallelBatches();

      expect(batches).toHaveLength(3);
      expect(batches[0].nodes.map((n) => n.id)).toEqual(['A']);
      expect(batches[1].nodes.map((n) => n.id)).toEqual(['B']);
      expect(batches[2].nodes.map((n) => n.id)).toEqual(['C']);
    });

    it('应该分析并行 DAG', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');
      scheduler.addNode('C', 'Node C');
      scheduler.addNode('D', 'Node D');
      scheduler.addNode('E', 'Node E');

      // D -> A
      // D -> B
      // E -> C
      scheduler.addDependency('D', 'A');
      scheduler.addDependency('D', 'B');
      scheduler.addDependency('E', 'C');

      const batches = scheduler.analyzeParallelBatches();

      expect(batches).toHaveLength(2);

      // 第一批：A, B, C（无依赖）
      expect(batches[0].level).toBe(0);
      expect(batches[0].nodes).toHaveLength(3);
      const level0Ids = batches[0].nodes.map((n) => n.id);
      expect(level0Ids).toContain('A');
      expect(level0Ids).toContain('B');
      expect(level0Ids).toContain('C');

      // 第二批：D, E（依赖第一批）
      expect(batches[1].level).toBe(1);
      expect(batches[1].nodes).toHaveLength(2);
      const level1Ids = batches[1].nodes.map((n) => n.id);
      expect(level1Ids).toContain('D');
      expect(level1Ids).toContain('E');
    });

    it('应该处理复杂 DAG', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');
      scheduler.addNode('C', 'Node C');
      scheduler.addNode('D', 'Node D');
      scheduler.addNode('E', 'Node E');
      scheduler.addNode('F', 'Node F');

      // F -> D -> A
      // F -> E -> B
      // E -> C
      scheduler.addDependency('D', 'A');
      scheduler.addDependency('E', 'B');
      scheduler.addDependency('E', 'C');
      scheduler.addDependency('F', 'D');
      scheduler.addDependency('F', 'E');

      const batches = scheduler.analyzeParallelBatches();

      expect(batches).toHaveLength(3);

      // Level 0: A, B, C
      expect(batches[0].level).toBe(0);
      expect(batches[0].nodes).toHaveLength(3);

      // Level 1: D, E
      expect(batches[1].level).toBe(1);
      expect(batches[1].nodes).toHaveLength(2);

      // Level 2: F
      expect(batches[2].level).toBe(2);
      expect(batches[2].nodes).toHaveLength(1);
    });

    it('应该在检测到循环依赖时中断并返回部分结果', () => {
      // 创建一个包含循环依赖的图
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');
      scheduler.addNode('C', 'Node C');

      // A -> B -> C -> A (循环)
      scheduler.addDependency('B', 'A');
      scheduler.addDependency('C', 'B');
      scheduler.addDependency('A', 'C');

      // 捕获 console.error
      const originalError = console.error;
      const errorCalls: string[] = [];
      console.error = (...args: any[]) => {
        errorCalls.push(args.join(' '));
      };

      try {
        const batches = scheduler.analyzeParallelBatches();

        // 由于循环依赖，应该返回空数组（没有入度为0的节点）
        expect(batches).toHaveLength(0);

        // 应该输出错误信息
        expect(errorCalls.some((msg) => msg.includes('Circular dependency'))).toBe(true);
      } finally {
        console.error = originalError;
      }
    });

    it('应该在部分循环依赖时返回已处理的批次', () => {
      // 创建一个部分有循环依赖的图
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');
      scheduler.addNode('C', 'Node C');
      scheduler.addNode('D', 'Node D');

      // A 是独立的
      // B -> C -> D -> B (循环)
      scheduler.addDependency('C', 'B');
      scheduler.addDependency('D', 'C');
      scheduler.addDependency('B', 'D');

      // 捕获 console.error
      const originalError = console.error;
      const errorCalls: string[] = [];
      console.error = (...args: any[]) => {
        errorCalls.push(args.join(' '));
      };

      try {
        const batches = scheduler.analyzeParallelBatches();

        // 应该至少处理了 A 节点
        expect(batches.length).toBeGreaterThanOrEqual(1);
        expect(batches[0].nodes.some((n) => n.id === 'A')).toBe(true);

        // 应该输出错误信息（因为 B, C, D 形成循环）
        expect(errorCalls.some((msg) => msg.includes('Circular dependency'))).toBe(true);
      } finally {
        console.error = originalError;
      }
    });
  });

  describe('getNodeInfo 方法', () => {
    it('应该返回节点信息', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');
      scheduler.addDependency('B', 'A');

      const info = scheduler.getNodeInfo('B');

      expect(info).toBeDefined();
      expect(info!.id).toBe('B');
      expect(info!.dependencies).toEqual(['A']);
    });

    it('应该返回 undefined 如果节点不存在', () => {
      const info = scheduler.getNodeInfo('NonExistent');
      expect(info).toBeUndefined();
    });
  });

  describe('getAllNodesInfo 方法', () => {
    it('应该返回所有节点信息', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');
      scheduler.addDependency('B', 'A');

      const allInfo = scheduler.getAllNodesInfo();

      expect(allInfo).toHaveLength(2);
      expect(allInfo.map((n) => n.id)).toEqual(expect.arrayContaining(['A', 'B']));
    });
  });

  describe('clear 方法', () => {
    it('应该清空所有节点', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');

      scheduler.clear();

      expect(scheduler.getNodeCount()).toBe(0);
    });
  });

  describe('getNodeCount 方法', () => {
    it('应该返回 0 当没有节点时', () => {
      expect(scheduler.getNodeCount()).toBe(0);
    });

    it('应该返回正确的节点数量', () => {
      scheduler.addNode('A', 'Node A');
      expect(scheduler.getNodeCount()).toBe(1);

      scheduler.addNode('B', 'Node B');
      expect(scheduler.getNodeCount()).toBe(2);

      scheduler.addNode('C', 'Node C');
      expect(scheduler.getNodeCount()).toBe(3);
    });

    it('应该在移除节点后更新数量', () => {
      scheduler.addNode('A', 'Node A');
      scheduler.addNode('B', 'Node B');
      expect(scheduler.getNodeCount()).toBe(2);

      scheduler.removeNode('A');
      expect(scheduler.getNodeCount()).toBe(1);
    });
  });

  describe('边界情况测试', () => {
    describe('空图', () => {
      it('topologicalSort 应该返回空数组', () => {
        const result = scheduler.topologicalSort();
        expect(result.success).toBe(true);
        expect(result.sorted).toHaveLength(0);
      });

      it('analyzeParallelBatches 应该返回空数组', () => {
        const batches = scheduler.analyzeParallelBatches();
        expect(batches).toHaveLength(0);
      });

      it('detectCycle 应该返回空数组', () => {
        const cycle = scheduler.detectCycle();
        expect(cycle).toHaveLength(0);
      });

      it('getAllNodesInfo 应该返回空数组', () => {
        const info = scheduler.getAllNodesInfo();
        expect(info).toHaveLength(0);
      });
    });

    describe('单节点图', () => {
      beforeEach(() => {
        scheduler.addNode('A', 'Node A');
      });

      it('topologicalSort 应该返回单个节点', () => {
        const result = scheduler.topologicalSort();
        expect(result.success).toBe(true);
        expect(result.sorted).toHaveLength(1);
        expect(result.sorted[0].id).toBe('A');
      });

      it('analyzeParallelBatches 应该返回单个批次', () => {
        const batches = scheduler.analyzeParallelBatches();
        expect(batches).toHaveLength(1);
        expect(batches[0].nodes).toHaveLength(1);
        expect(batches[0].level).toBe(0);
      });

      it('detectCycle 应该返回空数组', () => {
        const cycle = scheduler.detectCycle();
        expect(cycle).toHaveLength(0);
      });

      it('getNodeInfo 应该返回正确信息', () => {
        const info = scheduler.getNodeInfo('A');
        expect(info).toBeDefined();
        expect(info!.id).toBe('A');
        expect(info!.dependencies).toHaveLength(0);
        expect(info!.dependents).toHaveLength(0);
      });
    });

    describe('单节点自循环', () => {
      it('应该检测自循环', () => {
        scheduler.addNode('A', 'Node A');
        scheduler.addDependency('A', 'A');

        const result = scheduler.topologicalSort();
        expect(result.success).toBe(false);
        expect(result.cycle).toBeDefined();
        expect(result.cycle).toContain('A');
      });
    });

    describe('两节点互相依赖', () => {
      it('应该检测循环', () => {
        scheduler.addNode('A', 'Node A');
        scheduler.addNode('B', 'Node B');
        scheduler.addDependency('A', 'B');
        scheduler.addDependency('B', 'A');

        const result = scheduler.topologicalSort();
        expect(result.success).toBe(false);
        expect(result.cycle).toBeDefined();
        expect(result.cycle!.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('大量节点', () => {
      it('应该正确处理 100 个节点的链式依赖', () => {
        // 创建 100 个节点的链式依赖
        for (let i = 0; i < 100; i++) {
          scheduler.addNode(`N${i}`, `Node ${i}`);
        }
        for (let i = 1; i < 100; i++) {
          scheduler.addDependency(`N${i}`, `N${i - 1}`);
        }

        const result = scheduler.topologicalSort();
        expect(result.success).toBe(true);
        expect(result.sorted).toHaveLength(100);

        // 验证顺序正确
        const ids = result.sorted.map((n) => n.id);
        for (let i = 1; i < 100; i++) {
          expect(ids.indexOf(`N${i - 1}`)).toBeLessThan(ids.indexOf(`N${i}`));
        }
      });

      it('应该正确分析 100 个独立节点为单批次', () => {
        for (let i = 0; i < 100; i++) {
          scheduler.addNode(`N${i}`, `Node ${i}`);
        }

        const batches = scheduler.analyzeParallelBatches();
        expect(batches).toHaveLength(1);
        expect(batches[0].nodes).toHaveLength(100);
      });
    });
  });
});
