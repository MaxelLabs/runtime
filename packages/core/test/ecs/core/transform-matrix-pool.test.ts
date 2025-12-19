/**
 * TransformMatrixPool 测试
 * 测试 Transform 矩阵池的功能
 */
import { describe, it, expect, beforeEach } from '@jest/globals';

import {
  TransformMatrixPool,
  INVALID_SLOT,
  getGlobalMatrixPool,
  resetGlobalMatrixPool,
} from '../../../src/ecs/core/transform-matrix-pool';

describe('TransformMatrixPool', () => {
  describe('构造函数', () => {
    it('应该使用默认容量创建池', () => {
      const pool = new TransformMatrixPool();
      expect(pool.getCapacity()).toBe(1024);
      expect(pool.getAllocatedCount()).toBe(0);
    });

    it('应该使用指定容量创建池', () => {
      const pool = new TransformMatrixPool(100);
      expect(pool.getCapacity()).toBe(100);
    });

    it('应该初始化所有矩阵为单位矩阵', () => {
      const pool = new TransformMatrixPool(10);
      const slot = pool.allocate();
      const matrix = pool.getWorldMatrix(slot);

      // 检查单位矩阵
      expect(matrix[0]).toBe(1);
      expect(matrix[5]).toBe(1);
      expect(matrix[10]).toBe(1);
      expect(matrix[15]).toBe(1);
      expect(matrix[1]).toBe(0);
      expect(matrix[4]).toBe(0);
    });
  });

  describe('allocate 方法', () => {
    it('应该分配槽位并返回 ID', () => {
      const pool = new TransformMatrixPool(10);
      const slot = pool.allocate();

      expect(slot).toBeGreaterThanOrEqual(0);
      expect(pool.getAllocatedCount()).toBe(1);
    });

    it('应该分配连续的槽位', () => {
      const pool = new TransformMatrixPool(10);
      const slot1 = pool.allocate();
      const slot2 = pool.allocate();
      const slot3 = pool.allocate();

      expect(slot1).toBe(0);
      expect(slot2).toBe(1);
      expect(slot3).toBe(2);
    });

    it('应该重用已释放的槽位', () => {
      const pool = new TransformMatrixPool(10);
      const slot1 = pool.allocate();
      pool.allocate();

      pool.free(slot1);

      const slot3 = pool.allocate();
      expect(slot3).toBe(slot1);
    });

    it('应该在容量不足时自动扩容', () => {
      const pool = new TransformMatrixPool(2);
      pool.allocate();
      pool.allocate();

      expect(pool.getCapacity()).toBe(2);

      pool.allocate();

      expect(pool.getCapacity()).toBe(4);
    });
  });

  describe('free 方法', () => {
    it('应该释放槽位', () => {
      const pool = new TransformMatrixPool(10);
      const slot = pool.allocate();

      expect(pool.getAllocatedCount()).toBe(1);

      pool.free(slot);

      expect(pool.getAllocatedCount()).toBe(0);
    });

    it('应该忽略无效槽位', () => {
      const pool = new TransformMatrixPool(10);
      pool.allocate();

      pool.free(-1);
      pool.free(100);

      expect(pool.getAllocatedCount()).toBe(1);
    });

    it('应该重置父级索引', () => {
      const pool = new TransformMatrixPool(10);
      const parent = pool.allocate();
      const child = pool.allocate();

      pool.setParent(child, parent);
      pool.free(child);

      // 重新分配应该没有父级
      const newSlot = pool.allocate();
      expect(newSlot).toBe(child);
    });
  });

  describe('setLocalMatrix 方法', () => {
    it('应该从数组设置本地矩阵', () => {
      const pool = new TransformMatrixPool(10);
      const slot = pool.allocate();

      const matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 20, 30, 1];

      pool.setLocalMatrix(slot, matrix);

      const local = pool.getLocalMatrix(slot);
      expect(local[12]).toBe(10);
      expect(local[13]).toBe(20);
      expect(local[14]).toBe(30);
    });

    it('应该从 Float32Array 设置本地矩阵', () => {
      const pool = new TransformMatrixPool(10);
      const slot = pool.allocate();

      const matrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 10, 15, 1]);

      pool.setLocalMatrix(slot, matrix);

      const local = pool.getLocalMatrix(slot);
      expect(local[12]).toBe(5);
      expect(local[13]).toBe(10);
      expect(local[14]).toBe(15);
    });

    it('应该从 Matrix4Like 设置本地矩阵', () => {
      const pool = new TransformMatrixPool(10);
      const slot = pool.allocate();

      const matrix = {
        m00: 1,
        m01: 0,
        m02: 0,
        m03: 0,
        m10: 0,
        m11: 1,
        m12: 0,
        m13: 0,
        m20: 0,
        m21: 0,
        m22: 1,
        m23: 0,
        m30: 100,
        m31: 200,
        m32: 300,
        m33: 1,
      };

      pool.setLocalMatrix(slot, matrix);

      const local = pool.getLocalMatrix(slot);
      expect(local[12]).toBe(100);
      expect(local[13]).toBe(200);
      expect(local[14]).toBe(300);
    });

    it('应该标记槽位为脏', () => {
      const pool = new TransformMatrixPool(10);
      const slot = pool.allocate();

      // 先更新清除脏标记
      pool.updateWorldMatrices();

      pool.setLocalMatrix(slot, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

      // 再次更新应该处理脏标记
      pool.updateWorldMatrices();
    });
  });

  describe('setLocalFromTRS 方法', () => {
    it('应该从 TRS 设置本地矩阵', () => {
      const pool = new TransformMatrixPool(10);
      const slot = pool.allocate();

      // 设置位置 (10, 20, 30)，无旋转，缩放 (1, 1, 1)
      pool.setLocalFromTRS(slot, 10, 20, 30, 0, 0, 0, 1, 1, 1, 1);

      const local = pool.getLocalMatrix(slot);
      expect(local[12]).toBe(10);
      expect(local[13]).toBe(20);
      expect(local[14]).toBe(30);
    });

    it('应该正确应用缩放', () => {
      const pool = new TransformMatrixPool(10);
      const slot = pool.allocate();

      // 设置缩放 (2, 3, 4)
      pool.setLocalFromTRS(slot, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4);

      const local = pool.getLocalMatrix(slot);
      expect(local[0]).toBe(2);
      expect(local[5]).toBe(3);
      expect(local[10]).toBe(4);
    });

    it('应该正确应用旋转', () => {
      const pool = new TransformMatrixPool(10);
      const slot = pool.allocate();

      // 绕 Y 轴旋转 90 度的四元数
      const angle = Math.PI / 2;
      const qy = Math.sin(angle / 2);
      const qw = Math.cos(angle / 2);

      pool.setLocalFromTRS(slot, 0, 0, 0, 0, qy, 0, qw, 1, 1, 1);

      const local = pool.getLocalMatrix(slot);
      // 旋转后 X 轴应该指向 -Z
      expect(local[0]).toBeCloseTo(0, 5);
      expect(local[8]).toBeCloseTo(1, 5);
    });
  });

  describe('setParent 方法', () => {
    it('应该设置父级', () => {
      const pool = new TransformMatrixPool(10);
      const parent = pool.allocate();
      const child = pool.allocate();

      pool.setParent(child, parent);

      // 设置父级后应该标记为脏
      pool.setLocalFromTRS(parent, 10, 0, 0, 0, 0, 0, 1, 1, 1, 1);
      pool.updateWorldMatrices();

      const childWorld = pool.getWorldMatrix(child);
      expect(childWorld[12]).toBe(10); // 继承父级位置
    });

    it('应该支持设置无父级', () => {
      const pool = new TransformMatrixPool(10);
      const parent = pool.allocate();
      const child = pool.allocate();

      pool.setParent(child, parent);
      pool.setParent(child, -1);

      pool.setLocalFromTRS(parent, 10, 0, 0, 0, 0, 0, 1, 1, 1, 1);
      pool.updateWorldMatrices();

      const childWorld = pool.getWorldMatrix(child);
      expect(childWorld[12]).toBe(0); // 不再继承父级位置
    });
  });

  describe('markDirty 方法', () => {
    it('应该标记槽位为脏', () => {
      const pool = new TransformMatrixPool(10);
      const slot = pool.allocate();

      pool.updateWorldMatrices();
      pool.markDirty(slot);

      // 应该能再次更新
      pool.updateWorldMatrices();
    });
  });

  describe('updateWorldMatrices 方法', () => {
    it('应该更新无父级实体的世界矩阵', () => {
      const pool = new TransformMatrixPool(10);
      const slot = pool.allocate();

      pool.setLocalFromTRS(slot, 10, 20, 30, 0, 0, 0, 1, 1, 1, 1);
      pool.updateWorldMatrices();

      const world = pool.getWorldMatrix(slot);
      expect(world[12]).toBe(10);
      expect(world[13]).toBe(20);
      expect(world[14]).toBe(30);
    });

    it('应该正确计算父子层级的世界矩阵', () => {
      const pool = new TransformMatrixPool(10);
      const parent = pool.allocate();
      const child = pool.allocate();

      pool.setParent(child, parent);

      pool.setLocalFromTRS(parent, 10, 0, 0, 0, 0, 0, 1, 1, 1, 1);
      pool.setLocalFromTRS(child, 5, 0, 0, 0, 0, 0, 1, 1, 1, 1);

      pool.updateWorldMatrices();

      const parentWorld = pool.getWorldMatrix(parent);
      const childWorld = pool.getWorldMatrix(child);

      expect(parentWorld[12]).toBe(10);
      expect(childWorld[12]).toBe(15); // 10 + 5
    });

    it('应该处理多层级层次结构', () => {
      const pool = new TransformMatrixPool(10);
      const grandparent = pool.allocate();
      const parent = pool.allocate();
      const child = pool.allocate();

      pool.setParent(parent, grandparent);
      pool.setParent(child, parent);

      pool.setLocalFromTRS(grandparent, 10, 0, 0, 0, 0, 0, 1, 1, 1, 1);
      pool.setLocalFromTRS(parent, 5, 0, 0, 0, 0, 0, 1, 1, 1, 1);
      pool.setLocalFromTRS(child, 3, 0, 0, 0, 0, 0, 1, 1, 1, 1);

      pool.updateWorldMatrices();

      const childWorld = pool.getWorldMatrix(child);
      expect(childWorld[12]).toBe(18); // 10 + 5 + 3
    });

    it('应该处理缩放继承', () => {
      const pool = new TransformMatrixPool(10);
      const parent = pool.allocate();
      const child = pool.allocate();

      pool.setParent(child, parent);

      pool.setLocalFromTRS(parent, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2);
      pool.setLocalFromTRS(child, 10, 0, 0, 0, 0, 0, 1, 1, 1, 1);

      pool.updateWorldMatrices();

      const childWorld = pool.getWorldMatrix(child);
      expect(childWorld[12]).toBe(20); // 10 * 2
    });

    it('应该处理部分脏节点的层级更新', () => {
      const pool = new TransformMatrixPool(10);
      const parent = pool.allocate();
      const child = pool.allocate();

      pool.setParent(child, parent);

      // 初始化
      pool.setLocalFromTRS(parent, 10, 0, 0, 0, 0, 0, 1, 1, 1, 1);
      pool.setLocalFromTRS(child, 5, 0, 0, 0, 0, 0, 1, 1, 1, 1);
      pool.updateWorldMatrices();

      // 只修改子节点
      pool.setLocalFromTRS(child, 8, 0, 0, 0, 0, 0, 1, 1, 1, 1);
      pool.updateWorldMatrices();

      const childWorld = pool.getWorldMatrix(child);
      expect(childWorld[12]).toBe(18); // 10 + 8
    });

    it('应该处理只有父节点脏的情况', () => {
      const pool = new TransformMatrixPool(10);
      const parent = pool.allocate();
      const child = pool.allocate();

      pool.setParent(child, parent);

      // 初始化
      pool.setLocalFromTRS(parent, 10, 0, 0, 0, 0, 0, 1, 1, 1, 1);
      pool.setLocalFromTRS(child, 5, 0, 0, 0, 0, 0, 1, 1, 1, 1);
      pool.updateWorldMatrices();

      // 只修改父节点
      pool.setLocalFromTRS(parent, 20, 0, 0, 0, 0, 0, 1, 1, 1, 1);
      pool.markDirty(child); // 子节点也需要更新
      pool.updateWorldMatrices();

      const childWorld = pool.getWorldMatrix(child);
      expect(childWorld[12]).toBe(25); // 20 + 5
    });

    it('应该处理多个独立的层级树', () => {
      const pool = new TransformMatrixPool(10);

      // 第一棵树
      const tree1Parent = pool.allocate();
      const tree1Child = pool.allocate();
      pool.setParent(tree1Child, tree1Parent);

      // 第二棵树
      const tree2Parent = pool.allocate();
      const tree2Child = pool.allocate();
      pool.setParent(tree2Child, tree2Parent);

      pool.setLocalFromTRS(tree1Parent, 10, 0, 0, 0, 0, 0, 1, 1, 1, 1);
      pool.setLocalFromTRS(tree1Child, 5, 0, 0, 0, 0, 0, 1, 1, 1, 1);
      pool.setLocalFromTRS(tree2Parent, 100, 0, 0, 0, 0, 0, 1, 1, 1, 1);
      pool.setLocalFromTRS(tree2Child, 50, 0, 0, 0, 0, 0, 1, 1, 1, 1);

      pool.updateWorldMatrices();

      expect(pool.getWorldMatrix(tree1Child)[12]).toBe(15); // 10 + 5
      expect(pool.getWorldMatrix(tree2Child)[12]).toBe(150); // 100 + 50
    });

    it('应该处理深层嵌套的层级结构', () => {
      const pool = new TransformMatrixPool(20);
      const slots: number[] = [];

      // 创建 10 层深的层级结构
      for (let i = 0; i < 10; i++) {
        const slot = pool.allocate();
        slots.push(slot);
        if (i > 0) {
          pool.setParent(slot, slots[i - 1]);
        }
        pool.setLocalFromTRS(slot, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1);
      }

      pool.updateWorldMatrices();

      // 最深层的节点应该累积所有父级的位移
      const deepestWorld = pool.getWorldMatrix(slots[9]);
      expect(deepestWorld[12]).toBe(10); // 1 * 10
    });

    it('应该处理分支结构', () => {
      const pool = new TransformMatrixPool(10);

      // 创建分支结构：parent -> child1, child2
      const parent = pool.allocate();
      const child1 = pool.allocate();
      const child2 = pool.allocate();

      pool.setParent(child1, parent);
      pool.setParent(child2, parent);

      pool.setLocalFromTRS(parent, 10, 0, 0, 0, 0, 0, 1, 1, 1, 1);
      pool.setLocalFromTRS(child1, 5, 0, 0, 0, 0, 0, 1, 1, 1, 1);
      pool.setLocalFromTRS(child2, 8, 0, 0, 0, 0, 0, 1, 1, 1, 1);

      pool.updateWorldMatrices();

      expect(pool.getWorldMatrix(child1)[12]).toBe(15); // 10 + 5
      expect(pool.getWorldMatrix(child2)[12]).toBe(18); // 10 + 8
    });

    it('应该处理非连续槽位的层级更新', () => {
      const pool = new TransformMatrixPool(10);

      // 分配并释放一些槽位，创建非连续的情况
      const temp1 = pool.allocate();
      const parent = pool.allocate();
      const temp2 = pool.allocate();
      const child = pool.allocate();

      pool.free(temp1);
      pool.free(temp2);

      pool.setParent(child, parent);

      pool.setLocalFromTRS(parent, 10, 0, 0, 0, 0, 0, 1, 1, 1, 1);
      pool.setLocalFromTRS(child, 5, 0, 0, 0, 0, 0, 1, 1, 1, 1);

      pool.updateWorldMatrices();

      expect(pool.getWorldMatrix(child)[12]).toBe(15); // 10 + 5
    });
  });

  describe('getWorldMatrix 方法', () => {
    it('应该返回世界矩阵视图', () => {
      const pool = new TransformMatrixPool(10);
      const slot = pool.allocate();

      const matrix = pool.getWorldMatrix(slot);

      expect(matrix).toBeInstanceOf(Float32Array);
      expect(matrix.length).toBe(16);
    });
  });

  describe('getLocalMatrix 方法', () => {
    it('应该返回本地矩阵视图', () => {
      const pool = new TransformMatrixPool(10);
      const slot = pool.allocate();

      const matrix = pool.getLocalMatrix(slot);

      expect(matrix).toBeInstanceOf(Float32Array);
      expect(matrix.length).toBe(16);
    });
  });

  describe('getWorldMatrixBuffer 方法', () => {
    it('应该返回所有已分配矩阵的缓冲区', () => {
      const pool = new TransformMatrixPool(10);
      pool.allocate();
      pool.allocate();
      pool.allocate();

      const buffer = pool.getWorldMatrixBuffer();

      expect(buffer.length).toBe(48); // 3 * 16
    });
  });

  describe('getFullWorldMatrixBuffer 方法', () => {
    it('应该返回完整的世界矩阵数组', () => {
      const pool = new TransformMatrixPool(10);
      pool.allocate();

      const buffer = pool.getFullWorldMatrixBuffer();

      expect(buffer.length).toBe(160); // 10 * 16
    });
  });

  describe('clear 方法', () => {
    it('应该清空池', () => {
      const pool = new TransformMatrixPool(10);
      pool.allocate();
      pool.allocate();
      pool.allocate();

      pool.clear();

      expect(pool.getAllocatedCount()).toBe(0);
    });
  });

  describe('getStats 方法', () => {
    it('应该返回统计信息', () => {
      const pool = new TransformMatrixPool(10);
      pool.allocate();
      pool.allocate();
      pool.free(pool.allocate());

      const stats = pool.getStats();

      expect(stats.allocated).toBe(2);
      expect(stats.capacity).toBe(10);
      expect(stats.freeSlots).toBe(1);
      expect(stats.memoryBytes).toBeGreaterThan(0);
      expect(stats.utilizationRate).toBe(0.2);
    });
  });

  describe('INVALID_SLOT', () => {
    it('应该是 -1', () => {
      expect(INVALID_SLOT).toBe(-1);
    });
  });
});

describe('全局矩阵池', () => {
  beforeEach(() => {
    resetGlobalMatrixPool();
  });

  afterEach(() => {
    resetGlobalMatrixPool();
  });

  describe('getGlobalMatrixPool', () => {
    it('应该返回全局矩阵池', () => {
      const pool = getGlobalMatrixPool();
      expect(pool).toBeInstanceOf(TransformMatrixPool);
    });

    it('应该返回同一个实例', () => {
      const pool1 = getGlobalMatrixPool();
      const pool2 = getGlobalMatrixPool();
      expect(pool1).toBe(pool2);
    });

    it('应该使用指定的初始容量', () => {
      const pool = getGlobalMatrixPool(2048);
      expect(pool.getCapacity()).toBe(2048);
    });

    it('应该忽略后续调用的容量参数', () => {
      const pool1 = getGlobalMatrixPool(1000);
      const pool2 = getGlobalMatrixPool(2000);

      expect(pool1.getCapacity()).toBe(1000);
      expect(pool2.getCapacity()).toBe(1000);
    });
  });

  describe('resetGlobalMatrixPool', () => {
    it('应该重置全局矩阵池', () => {
      const pool1 = getGlobalMatrixPool(1000);
      resetGlobalMatrixPool();
      const pool2 = getGlobalMatrixPool(2000);

      expect(pool1).not.toBe(pool2);
      expect(pool2.getCapacity()).toBe(2000);
    });
  });
});
