/**
 * 渲染数据存储测试
 * 测试 TypedArray 存储和 GPU 同步功能
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  RenderDataStorage,
  INVALID_RENDER_SLOT,
  getGlobalRenderData,
  resetGlobalRenderData,
} from '../../../src/ecs/core/render-data-storage';
import { EntityId } from '../../../src/ecs/core/entity-id';
import type { IRHIDeviceMinimal } from '../../../src/ecs/core/gpu-buffer-sync';

// Mock RHI Device
function createMockDevice(): IRHIDeviceMinimal {
  return {
    createBuffer: jest.fn((descriptor: { size: number; usage: number; hint?: string; label?: string }) => ({
      update: jest.fn(),
      destroy: jest.fn(),
    })),
  };
}

describe('RenderDataStorage - 渲染数据存储', () => {
  let storage: RenderDataStorage;
  let entity1: EntityId;
  let entity2: EntityId;

  beforeEach(() => {
    storage = new RenderDataStorage({
      initialCapacity: 100,
      enableChangeDetection: true,
      enableGPUSync: true,
      label: 'TestRenderData',
    });
    entity1 = EntityId.create(0, 0);
    entity2 = EntityId.create(1, 0);
    resetGlobalRenderData();
  });

  describe('构造函数', () => {
    it('应该创建存储实例', () => {
      expect(storage).toBeInstanceOf(RenderDataStorage);
      expect(storage.label).toBe('TestRenderData');
    });

    it('应该使用默认选项', () => {
      const defaultStorage = new RenderDataStorage();
      expect(defaultStorage.label).toBe('RenderData');
    });
  });

  describe('allocate - 分配槽位', () => {
    it('应该分配槽位', () => {
      const slot = storage.allocate(entity1);

      expect(slot).not.toBe(INVALID_RENDER_SLOT);
      expect(slot).toBeGreaterThanOrEqual(0);
    });

    it('重复分配应该返回相同槽位', () => {
      const slot1 = storage.allocate(entity1);
      const slot2 = storage.allocate(entity1);

      expect(slot1).toBe(slot2);
    });

    it('不同实体应该分配不同槽位', () => {
      const slot1 = storage.allocate(entity1);
      const slot2 = storage.allocate(entity2);

      expect(slot1).not.toBe(slot2);
    });

    it('应该初始化默认值', () => {
      const slot = storage.allocate(entity1);

      const pos = storage.getPosition(slot);
      expect(pos).toEqual([0, 0, 0]);

      const rot = storage.getRotation(slot);
      expect(rot).toEqual([0, 0, 0, 1]); // 单位四元数

      const scale = storage.getScale(slot);
      expect(scale).toEqual([1, 1, 1]);

      const color = storage.getColor(slot);
      expect(color).toEqual([1, 1, 1, 1]); // 白色
    });
  });

  describe('free - 释放槽位', () => {
    it('应该释放槽位', () => {
      storage.allocate(entity1);
      storage.free(entity1);

      expect(storage.getSlot(entity1)).toBe(INVALID_RENDER_SLOT);
    });

    it('释放后槽位应该可以复用', () => {
      const slot1 = storage.allocate(entity1);
      storage.free(entity1);
      const slot2 = storage.allocate(entity2);

      expect(slot2).toBe(slot1);
    });

    it('释放不存在的实体应该不报错', () => {
      expect(() => {
        storage.free(entity1);
      }).not.toThrow();
    });
  });

  describe('getSlot/getEntity - 槽位映射', () => {
    it('应该获取实体的槽位', () => {
      const slot = storage.allocate(entity1);

      expect(storage.getSlot(entity1)).toBe(slot);
    });

    it('应该获取槽位的实体', () => {
      const slot = storage.allocate(entity1);

      expect(storage.getEntity(slot)).toBe(entity1);
    });

    it('不存在的实体应该返回无效槽位', () => {
      expect(storage.getSlot(entity1)).toBe(INVALID_RENDER_SLOT);
    });
  });

  describe('位置操作', () => {
    let slot: number;

    beforeEach(() => {
      slot = storage.allocate(entity1);
    });

    it('应该设置和获取位置', () => {
      storage.setPosition(slot, 10, 20, 30);

      const pos = storage.getPosition(slot);
      expect(pos).toEqual([10, 20, 30]);
    });

    it('应该获取位置视图', () => {
      storage.setPosition(slot, 10, 20, 30);

      const view = storage.getPositionView(slot);
      expect(view[0]).toBe(10);
      expect(view[1]).toBe(20);
      expect(view[2]).toBe(30);

      // 修改视图应该影响原数据
      view[0] = 100;
      expect(storage.getPosition(slot)[0]).toBe(100);
    });
  });

  describe('旋转操作', () => {
    let slot: number;

    beforeEach(() => {
      slot = storage.allocate(entity1);
    });

    it('应该设置和获取旋转（四元数）', () => {
      storage.setRotation(slot, 0, 0.707, 0, 0.707);

      const rot = storage.getRotation(slot);
      expect(rot[0]).toBeCloseTo(0, 5);
      expect(rot[1]).toBeCloseTo(0.707, 3);
      expect(rot[2]).toBeCloseTo(0, 5);
      expect(rot[3]).toBeCloseTo(0.707, 3);
    });

    it('应该从欧拉角设置旋转', () => {
      storage.setRotationEuler(slot, 0, Math.PI / 2, 0); // Y轴90度

      const rot = storage.getRotation(slot);
      // 验证不是单位四元数
      expect(rot[3]).not.toBe(1);
    });
  });

  describe('缩放操作', () => {
    let slot: number;

    beforeEach(() => {
      slot = storage.allocate(entity1);
    });

    it('应该设置和获取缩放', () => {
      storage.setScale(slot, 2, 3, 4);

      const scale = storage.getScale(slot);
      expect(scale).toEqual([2, 3, 4]);
    });

    it('应该设置统一缩放', () => {
      storage.setUniformScale(slot, 5);

      const scale = storage.getScale(slot);
      expect(scale).toEqual([5, 5, 5]);
    });
  });

  describe('颜色操作', () => {
    let slot: number;

    beforeEach(() => {
      slot = storage.allocate(entity1);
    });

    it('应该设置和获取颜色', () => {
      storage.setColor(slot, 1, 0, 0, 1);

      const color = storage.getColor(slot);
      expect(color).toEqual([1, 0, 0, 1]);
    });

    it('应该使用默认 alpha', () => {
      storage.setColor(slot, 0.5, 0.5, 0.5);

      const color = storage.getColor(slot);
      expect(color[3]).toBe(1);
    });
  });

  describe('层级操作', () => {
    let parentSlot: number;
    let childSlot: number;

    beforeEach(() => {
      parentSlot = storage.allocate(entity1);
      childSlot = storage.allocate(entity2);
    });

    it('应该设置父级', () => {
      storage.setParent(childSlot, parentSlot);

      expect(storage.getParent(childSlot)).toBe(parentSlot);
    });

    it('应该清除父级', () => {
      storage.setParent(childSlot, parentSlot);
      storage.clearParent(childSlot);

      expect(storage.getParent(childSlot)).toBe(-1);
    });

    it('默认应该无父级', () => {
      expect(storage.getParent(childSlot)).toBe(-1);
    });
  });

  describe('矩阵操作', () => {
    let slot: number;

    beforeEach(() => {
      slot = storage.allocate(entity1);
    });

    it('应该获取世界矩阵', () => {
      const matrix = storage.getWorldMatrix(slot);

      expect(matrix).toBeInstanceOf(Float32Array);
      expect(matrix.length).toBe(16);
    });

    it('应该获取本地矩阵', () => {
      const matrix = storage.getLocalMatrix(slot);

      expect(matrix).toBeInstanceOf(Float32Array);
      expect(matrix.length).toBe(16);
    });

    it('初始矩阵应该是单位矩阵', () => {
      const matrix = storage.getWorldMatrix(slot);

      // 检查对角线元素
      expect(matrix[0]).toBe(1);
      expect(matrix[5]).toBe(1);
      expect(matrix[10]).toBe(1);
      expect(matrix[15]).toBe(1);
    });

    it('应该获取世界矩阵 Buffer', () => {
      storage.allocate(entity1);
      storage.allocate(entity2);

      const buffer = storage.getWorldMatrixBuffer();

      expect(buffer).toBeInstanceOf(Float32Array);
      expect(buffer.length).toBeGreaterThanOrEqual(32); // 至少 2 个矩阵
    });
  });

  describe('updateWorldMatrices - 更新世界矩阵', () => {
    it('应该更新脏矩阵', () => {
      const slot = storage.allocate(entity1);
      storage.setPosition(slot, 10, 0, 0);

      const count = storage.updateWorldMatrices();

      expect(count).toBeGreaterThan(0);

      const matrix = storage.getWorldMatrix(slot);
      expect(matrix[12]).toBe(10); // 平移 X
    });

    it('应该处理父子层级', () => {
      const parentSlot = storage.allocate(entity1);
      const childSlot = storage.allocate(entity2);

      storage.setPosition(parentSlot, 10, 0, 0);
      storage.setParent(childSlot, parentSlot);
      storage.setPosition(childSlot, 5, 0, 0);

      storage.updateWorldMatrices();

      const childMatrix = storage.getWorldMatrix(childSlot);
      expect(childMatrix[12]).toBe(15); // 父级 10 + 子级 5
    });

    it('应该处理缩放', () => {
      const slot = storage.allocate(entity1);
      storage.setScale(slot, 2, 3, 4);

      storage.updateWorldMatrices();

      const matrix = storage.getWorldMatrix(slot);
      expect(matrix[0]).toBe(2); // X 缩放
      expect(matrix[5]).toBe(3); // Y 缩放
      expect(matrix[10]).toBe(4); // Z 缩放
    });

    it('应该处理旋转', () => {
      const slot = storage.allocate(entity1);
      storage.setRotationEuler(slot, 0, Math.PI / 2, 0); // Y轴90度

      storage.updateWorldMatrices();

      const matrix = storage.getWorldMatrix(slot);
      // 旋转后矩阵不再是单位矩阵
      expect(matrix[0]).not.toBe(1);
    });
  });

  describe('GPU 同步', () => {
    let mockDevice: IRHIDeviceMinimal;

    beforeEach(() => {
      mockDevice = createMockDevice();
    });

    it('应该初始化 GPU', () => {
      storage.initializeGPU(mockDevice);

      // 应该创建 worldMatrices 和 colors 两个 Buffer
      expect(mockDevice.createBuffer).toHaveBeenCalledTimes(2);
    });

    it('应该同步到 GPU', () => {
      storage.initializeGPU(mockDevice);
      storage.allocate(entity1);
      storage.updateWorldMatrices();

      const count = storage.syncToGPU();

      expect(count).toBeGreaterThan(0);
    });

    it('应该获取 GPU Buffer', () => {
      storage.initializeGPU(mockDevice);

      const buffer = storage.getGPUBuffer('worldMatrices');

      expect(buffer).not.toBeNull();
    });
  });

  describe('自定义数据字段', () => {
    let slot: number;

    beforeEach(() => {
      slot = storage.allocate(entity1);
    });

    it('应该添加自定义字段', () => {
      storage.addCustomField('velocity', 3, false);

      storage.setCustomField(slot, 'velocity', [1, 2, 3]);
      const data = storage.getCustomField(slot, 'velocity');

      expect(data).not.toBeNull();
      expect(data![0]).toBe(1);
      expect(data![1]).toBe(2);
      expect(data![2]).toBe(3);
    });

    it('重复添加应该警告', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      storage.addCustomField('test', 3, false);
      storage.addCustomField('test', 3, false);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('获取不存在的字段应该返回 null', () => {
      const data = storage.getCustomField(slot, 'nonexistent');

      expect(data).toBeNull();
    });

    it('设置不存在的字段应该警告', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      storage.setCustomField(slot, 'nonexistent', [1, 2, 3]);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('endFrame - 帧结束清理', () => {
    it('应该清理变化追踪', () => {
      storage.allocate(entity1);

      storage.endFrame();

      // 不应该抛出错误
    });
  });

  describe('getStats - 获取统计信息', () => {
    it('应该返回正确的统计信息', () => {
      storage.allocate(entity1);
      storage.allocate(entity2);
      storage.free(entity1);

      const stats = storage.getStats();

      expect(stats.capacity).toBe(100);
      expect(stats.count).toBe(1);
      expect(stats.freeSlots).toBe(1);
      expect(stats.memoryBytes).toBeGreaterThan(0);
    });
  });

  describe('destroy - 销毁', () => {
    it('应该销毁所有资源', () => {
      storage.allocate(entity1);
      storage.allocate(entity2);

      storage.destroy();

      expect(storage.getSlot(entity1)).toBe(INVALID_RENDER_SLOT);
      expect(storage.getSlot(entity2)).toBe(INVALID_RENDER_SLOT);
    });
  });

  describe('自动扩容', () => {
    it('应该在容量不足时自动扩容', () => {
      const smallStorage = new RenderDataStorage({
        initialCapacity: 2,
        enableGPUSync: false,
        enableChangeDetection: false,
      });

      // 分配超过初始容量的实体
      const slot1 = smallStorage.allocate(EntityId.create(0, 0));
      const slot2 = smallStorage.allocate(EntityId.create(1, 0));
      const slot3 = smallStorage.allocate(EntityId.create(2, 0));

      expect(slot1).not.toBe(INVALID_RENDER_SLOT);
      expect(slot2).not.toBe(INVALID_RENDER_SLOT);
      expect(slot3).not.toBe(INVALID_RENDER_SLOT);

      // 验证数据完整性
      smallStorage.setPosition(slot1, 1, 0, 0);
      smallStorage.setPosition(slot2, 2, 0, 0);
      smallStorage.setPosition(slot3, 3, 0, 0);

      expect(smallStorage.getPosition(slot1)[0]).toBe(1);
      expect(smallStorage.getPosition(slot2)[0]).toBe(2);
      expect(smallStorage.getPosition(slot3)[0]).toBe(3);
    });
  });

  describe('全局单例', () => {
    it('getGlobalRenderData 应该返回单例', () => {
      const data1 = getGlobalRenderData();
      const data2 = getGlobalRenderData();

      expect(data1).toBe(data2);
    });

    it('resetGlobalRenderData 应该重置单例', () => {
      const data1 = getGlobalRenderData();
      resetGlobalRenderData();
      const data2 = getGlobalRenderData();

      expect(data1).not.toBe(data2);
    });
  });

  describe('复杂场景', () => {
    it('应该处理深层级结构', () => {
      const slots: number[] = [];
      for (let i = 0; i < 5; i++) {
        slots.push(storage.allocate(EntityId.create(i, 0)));
      }

      // 创建链式层级: 0 -> 1 -> 2 -> 3 -> 4
      for (let i = 1; i < 5; i++) {
        storage.setParent(slots[i], slots[i - 1]);
        storage.setPosition(slots[i], 10, 0, 0);
      }

      storage.updateWorldMatrices();

      // 验证累积平移
      expect(storage.getWorldMatrix(slots[1])[12]).toBe(10);
      expect(storage.getWorldMatrix(slots[2])[12]).toBe(20);
      expect(storage.getWorldMatrix(slots[3])[12]).toBe(30);
      expect(storage.getWorldMatrix(slots[4])[12]).toBe(40);
    });

    it('应该处理大量实体', () => {
      const entities: EntityId[] = [];
      const slots: number[] = [];

      for (let i = 0; i < 500; i++) {
        const entity = EntityId.create(i, 0);
        entities.push(entity);
        slots.push(storage.allocate(entity));
      }

      // 设置随机位置
      for (let i = 0; i < slots.length; i++) {
        storage.setPosition(slots[i], i, i * 2, i * 3);
      }

      storage.updateWorldMatrices();

      // 验证数据完整性
      for (let i = 0; i < slots.length; i++) {
        const pos = storage.getPosition(slots[i]);
        expect(pos[0]).toBe(i);
        expect(pos[1]).toBe(i * 2);
        expect(pos[2]).toBe(i * 3);
      }
    });

    it('应该正确处理分配和释放循环', () => {
      const entities: EntityId[] = [];
      for (let i = 0; i < 10; i++) {
        entities.push(EntityId.create(i, 0));
      }

      // 分配所有
      for (const entity of entities) {
        storage.allocate(entity);
      }

      // 释放一半
      for (let i = 0; i < 5; i++) {
        storage.free(entities[i]);
      }

      // 重新分配
      for (let i = 0; i < 5; i++) {
        const newEntity = EntityId.create(100 + i, 0);
        const slot = storage.allocate(newEntity);
        storage.setPosition(slot, 100 + i, 0, 0);
      }

      // 验证数据
      const stats = storage.getStats();
      expect(stats.count).toBe(10);
    });
  });
});
