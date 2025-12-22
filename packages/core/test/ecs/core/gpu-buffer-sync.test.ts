/**
 * GPU Buffer 同步系统测试
 * 测试 GPU 数据同步功能
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  GPUBufferSync,
  GPUBufferUsage,
  getGlobalGPUSync,
  resetGlobalGPUSync,
  type IRHIDeviceMinimal,
} from '../../../src/ecs/gpu-buffer-sync';

// Mock RHI Device
function createMockDevice(): IRHIDeviceMinimal {
  return {
    createBuffer: jest.fn((descriptor: { size: number; usage: number; hint?: string; label?: string }) => ({
      update: jest.fn(),
      destroy: jest.fn(),
    })),
  };
}

describe('GPUBufferSync - GPU Buffer 同步系统', () => {
  let gpuSync: GPUBufferSync;
  let mockDevice: IRHIDeviceMinimal;

  beforeEach(() => {
    gpuSync = new GPUBufferSync();
    mockDevice = createMockDevice();
    resetGlobalGPUSync();
  });

  describe('构造函数和初始化', () => {
    it('应该创建 GPUBufferSync 实例', () => {
      expect(gpuSync).toBeInstanceOf(GPUBufferSync);
    });

    it('应该初始化 Device', () => {
      gpuSync.initialize(mockDevice);
      expect(mockDevice.createBuffer).not.toHaveBeenCalled(); // 没有注册 Buffer 时不创建
    });

    it('初始化后应该为已注册的 Buffer 创建 GPU 资源', () => {
      const data = new Float32Array(100);
      gpuSync.registerStorage('test', data, {
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      gpuSync.initialize(mockDevice);

      expect(mockDevice.createBuffer).toHaveBeenCalledTimes(1);
    });
  });

  describe('registerStorage - 注册数据源', () => {
    beforeEach(() => {
      gpuSync.initialize(mockDevice);
    });

    it('应该注册数据源', () => {
      const data = new Float32Array(100);
      gpuSync.registerStorage('transforms', data, {
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        hint: 'dynamic',
        label: 'TransformBuffer',
      });

      expect(mockDevice.createBuffer).toHaveBeenCalledWith(
        expect.objectContaining({
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
          hint: 'dynamic',
          label: 'TransformBuffer',
        })
      );
    });

    it('重复注册应该替换旧的', () => {
      const data1 = new Float32Array(100);
      const data2 = new Float32Array(200);

      gpuSync.registerStorage('test', data1, { usage: GPUBufferUsage.UNIFORM });
      gpuSync.registerStorage('test', data2, { usage: GPUBufferUsage.UNIFORM });

      // 应该调用两次 createBuffer（第一次注册 + 替换后重新创建）
      expect(mockDevice.createBuffer).toHaveBeenCalledTimes(2);
    });

    it('应该支持双缓冲', () => {
      const data = new Float32Array(100);
      gpuSync.registerStorage('test', data, {
        usage: GPUBufferUsage.UNIFORM,
        doubleBuffer: true,
      });

      // 双缓冲应该创建两个 Buffer
      expect(mockDevice.createBuffer).toHaveBeenCalledTimes(2);
    });
  });

  describe('unregisterStorage - 取消注册', () => {
    beforeEach(() => {
      gpuSync.initialize(mockDevice);
    });

    it('应该取消注册并销毁 GPU 资源', () => {
      const data = new Float32Array(100);
      gpuSync.registerStorage('test', data, { usage: GPUBufferUsage.UNIFORM });

      const buffer = gpuSync.getBuffer('test');
      gpuSync.unregisterStorage('test');

      expect(buffer?.destroy).toHaveBeenCalled();
      expect(gpuSync.getBuffer('test')).toBeNull();
    });

    it('取消不存在的注册应该不报错', () => {
      expect(() => {
        gpuSync.unregisterStorage('nonexistent');
      }).not.toThrow();
    });
  });

  describe('updateSource - 更新数据源', () => {
    beforeEach(() => {
      gpuSync.initialize(mockDevice);
    });

    it('应该更新数据源引用', () => {
      const data1 = new Float32Array(100);
      gpuSync.registerStorage('test', data1, {
        usage: GPUBufferUsage.UNIFORM,
        autoResize: true,
      });

      const data2 = new Float32Array(200);
      gpuSync.updateSource('test', data2);

      const stats = gpuSync.getBufferStats('test');
      expect(stats?.cpuSize).toBe(data2.byteLength);
    });

    it('更新不存在的数据源应该警告', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      gpuSync.updateSource('nonexistent', new Float32Array(100));

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('markDirty - 标记脏区域', () => {
    beforeEach(() => {
      gpuSync.initialize(mockDevice);
    });

    it('应该标记脏区域', () => {
      const data = new Float32Array(100);
      gpuSync.registerStorage('test', data, { usage: GPUBufferUsage.UNIFORM });

      // 先同步一次清除初始脏状态
      gpuSync.sync('test');

      gpuSync.markDirty('test', 0, 64);

      const stats = gpuSync.getBufferStats('test');
      expect(stats?.dirtyRegions).toBe(1);
      expect(stats?.needsSync).toBe(true);
    });

    it('应该合并相邻脏区域', () => {
      const data = new Float32Array(100);
      gpuSync.registerStorage('test', data, { usage: GPUBufferUsage.UNIFORM });

      // 先同步一次清除初始脏状态
      gpuSync.sync('test');

      gpuSync.markDirty('test', 0, 32);
      gpuSync.markDirty('test', 32, 32);

      const stats = gpuSync.getBufferStats('test');
      expect(stats?.dirtyRegions).toBe(1); // 应该合并为一个区域
    });

    it('应该合并重叠脏区域', () => {
      const data = new Float32Array(100);
      gpuSync.registerStorage('test', data, { usage: GPUBufferUsage.UNIFORM });

      // 先同步一次清除初始脏状态
      gpuSync.sync('test');

      gpuSync.markDirty('test', 0, 64);
      gpuSync.markDirty('test', 32, 64);

      const stats = gpuSync.getBufferStats('test');
      expect(stats?.dirtyRegions).toBe(1); // 应该合并为一个区域
    });
  });

  describe('markFullDirty - 标记完全脏', () => {
    beforeEach(() => {
      gpuSync.initialize(mockDevice);
    });

    it('应该标记整个 Buffer 为脏', () => {
      const data = new Float32Array(100);
      gpuSync.registerStorage('test', data, { usage: GPUBufferUsage.UNIFORM });

      // 先同步一次清除初始脏状态
      gpuSync.sync('test');

      gpuSync.markFullDirty('test');

      const stats = gpuSync.getBufferStats('test');
      expect(stats?.needsSync).toBe(true);
    });
  });

  describe('sync - 同步到 GPU', () => {
    beforeEach(() => {
      gpuSync.initialize(mockDevice);
    });

    it('应该同步脏数据到 GPU', () => {
      const data = new Float32Array(100);
      gpuSync.registerStorage('test', data, { usage: GPUBufferUsage.UNIFORM });

      const result = gpuSync.sync('test');

      expect(result).toBe(true);
      const buffer = gpuSync.getBuffer('test');
      expect(buffer?.update).toHaveBeenCalled();
    });

    it('无变化时不应该同步', () => {
      const data = new Float32Array(100);
      gpuSync.registerStorage('test', data, { usage: GPUBufferUsage.UNIFORM });

      // 第一次同步
      gpuSync.sync('test');

      // 重置 mock
      const buffer = gpuSync.getBuffer('test');
      (buffer?.update as jest.Mock).mockClear();

      // 第二次同步（无变化）
      const result = gpuSync.sync('test');

      expect(result).toBe(false);
      expect(buffer?.update).not.toHaveBeenCalled();
    });

    it('应该执行增量更新', () => {
      const data = new Float32Array(100);
      gpuSync.registerStorage('test', data, { usage: GPUBufferUsage.UNIFORM });

      // 第一次同步（全量）
      gpuSync.sync('test');

      // 标记部分脏
      gpuSync.markDirty('test', 64, 32);

      // 第二次同步（增量）
      const result = gpuSync.sync('test');

      expect(result).toBe(true);
      const buffer = gpuSync.getBuffer('test');
      // 应该调用两次：一次全量，一次增量
      expect(buffer?.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('syncAll - 同步所有 Buffer', () => {
    beforeEach(() => {
      gpuSync.initialize(mockDevice);
    });

    it('应该同步所有脏 Buffer', () => {
      const data1 = new Float32Array(100);
      const data2 = new Float32Array(100);

      gpuSync.registerStorage('test1', data1, { usage: GPUBufferUsage.UNIFORM });
      gpuSync.registerStorage('test2', data2, { usage: GPUBufferUsage.UNIFORM });

      const count = gpuSync.syncAll();

      expect(count).toBe(2);
    });
  });

  describe('getBuffer - 获取 GPU Buffer', () => {
    beforeEach(() => {
      gpuSync.initialize(mockDevice);
    });

    it('应该返回 GPU Buffer', () => {
      const data = new Float32Array(100);
      gpuSync.registerStorage('test', data, { usage: GPUBufferUsage.UNIFORM });

      const buffer = gpuSync.getBuffer('test');

      expect(buffer).not.toBeNull();
    });

    it('不存在的 Buffer 应该返回 null', () => {
      const buffer = gpuSync.getBuffer('nonexistent');

      expect(buffer).toBeNull();
    });
  });

  describe('getBufferStats - 获取 Buffer 统计', () => {
    beforeEach(() => {
      gpuSync.initialize(mockDevice);
    });

    it('应该返回正确的统计信息', () => {
      const data = new Float32Array(100);
      gpuSync.registerStorage('test', data, { usage: GPUBufferUsage.UNIFORM });

      const stats = gpuSync.getBufferStats('test');

      expect(stats).not.toBeNull();
      expect(stats?.cpuSize).toBe(data.byteLength);
      expect(stats?.gpuSize).toBeGreaterThanOrEqual(data.byteLength);
    });

    it('不存在的 Buffer 应该返回 null', () => {
      const stats = gpuSync.getBufferStats('nonexistent');

      expect(stats).toBeNull();
    });
  });

  describe('getStats - 获取全局统计', () => {
    beforeEach(() => {
      gpuSync.initialize(mockDevice);
    });

    it('应该返回正确的全局统计', () => {
      const data1 = new Float32Array(100);
      const data2 = new Float32Array(200);

      gpuSync.registerStorage('test1', data1, { usage: GPUBufferUsage.UNIFORM });
      gpuSync.registerStorage('test2', data2, { usage: GPUBufferUsage.UNIFORM });

      const stats = gpuSync.getStats();

      expect(stats.totalBuffers).toBe(2);
      expect(stats.totalCPUMemory).toBe(data1.byteLength + data2.byteLength);
      expect(stats.buffersNeedingSync).toBe(2); // 初始都是脏的
    });
  });

  describe('destroy - 销毁', () => {
    beforeEach(() => {
      gpuSync.initialize(mockDevice);
    });

    it('应该销毁所有资源', () => {
      const data = new Float32Array(100);
      gpuSync.registerStorage('test', data, { usage: GPUBufferUsage.UNIFORM });

      const buffer = gpuSync.getBuffer('test');
      gpuSync.destroy();

      expect(buffer?.destroy).toHaveBeenCalled();
      expect(gpuSync.getBuffer('test')).toBeNull();
    });
  });

  describe('全局单例', () => {
    it('getGlobalGPUSync 应该返回单例', () => {
      const sync1 = getGlobalGPUSync();
      const sync2 = getGlobalGPUSync();

      expect(sync1).toBe(sync2);
    });

    it('resetGlobalGPUSync 应该重置单例', () => {
      const sync1 = getGlobalGPUSync();
      resetGlobalGPUSync();
      const sync2 = getGlobalGPUSync();

      expect(sync1).not.toBe(sync2);
    });
  });

  describe('GPUBufferUsage 枚举', () => {
    it('应该有正确的值', () => {
      expect(GPUBufferUsage.VERTEX).toBe(0x0020);
      expect(GPUBufferUsage.INDEX).toBe(0x0010);
      expect(GPUBufferUsage.UNIFORM).toBe(0x0040);
      expect(GPUBufferUsage.STORAGE).toBe(0x0080);
      expect(GPUBufferUsage.COPY_DST).toBe(0x0008);
      expect(GPUBufferUsage.COPY_SRC).toBe(0x0004);
    });

    it('应该支持位运算组合', () => {
      const combined = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
      expect(combined).toBe(0x0048);
    });
  });

  describe('边界情况', () => {
    beforeEach(() => {
      gpuSync.initialize(mockDevice);
    });

    it('应该处理空数据', () => {
      const data = new Float32Array(0);
      gpuSync.registerStorage('empty', data, { usage: GPUBufferUsage.UNIFORM });

      // 应该创建最小 256 字节的 Buffer
      expect(mockDevice.createBuffer).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 256,
        })
      );
    });

    it('应该处理大数据', () => {
      const data = new Float32Array(100000);
      gpuSync.registerStorage('large', data, { usage: GPUBufferUsage.UNIFORM });

      expect(mockDevice.createBuffer).toHaveBeenCalledWith(
        expect.objectContaining({
          size: data.byteLength,
        })
      );
    });
  });
});
