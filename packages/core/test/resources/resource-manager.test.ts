/**
 * ResourceManager 模块测试
 * 测试资源管理功能
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ResourceManager } from '../../src/resources';
import { ResourceType, ResourceState } from '@maxellabs/specification';
import type { IRHIDevice, IMeshResource } from '@maxellabs/specification';

describe('ResourceManager', () => {
  let manager: ResourceManager;
  let mockDevice: IRHIDevice;

  beforeEach(() => {
    mockDevice = {} as IRHIDevice;
    manager = new ResourceManager(mockDevice);
  });

  afterEach(() => {
    manager.dispose();
  });

  // === 构造函数测试 ===
  describe('constructor', () => {
    it('应该创建空的资源管理器', () => {
      expect(manager.getStats().meshCount).toBe(0);
      expect(manager.getStats().textureCount).toBe(0);
      expect(manager.getStats().materialCount).toBe(0);
    });

    it('应该支持无 device 参数', () => {
      const noDeviceManager = new ResourceManager();
      expect(noDeviceManager).toBeDefined();
      noDeviceManager.dispose();
    });

    it('应该初始化为未销毁状态', () => {
      expect(manager.isDisposed()).toBe(false);
    });
  });

  // === 网格加载测试 ===
  describe('loadMesh', () => {
    it('应该加载网格资源并返回 handle', async () => {
      const handle = await manager.loadMesh('cube.glb');
      expect(handle.type).toBe(ResourceType.Mesh);
      expect(handle.uri).toBe('cube.glb');
      expect(handle.id).toMatch(/^mesh_\d+$/);
    });

    it('应该对同一 URI 返回不同 handle ID 但引用相同资源', async () => {
      const h1 = await manager.loadMesh('cube.glb');
      const h2 = await manager.loadMesh('cube.glb');
      expect(h1.uri).toBe(h2.uri);
      expect(manager.getStats().meshCount).toBe(1);
    });

    it('应该增加引用计数', async () => {
      await manager.loadMesh('cube.glb');
      await manager.loadMesh('cube.glb');
      // 引用计数 = 2（内部验证，通过 release 测试验证）
      expect(manager.getStats().meshCount).toBe(1);
    });

    it('应该在加载失败时抛出错误', async () => {
      manager.registerLoader('mesh', {
        extensions: ['.glb', '.gltf'],
        load: async () => {
          throw new Error('Load failed');
        },
        dispose: () => {},
      });
      await expect(manager.loadMesh('missing.glb')).rejects.toThrow('Load failed');
    });

    it('应该正确处理并发加载同一资源', async () => {
      const [h1, h2, h3] = await Promise.all([
        manager.loadMesh('cube.glb'),
        manager.loadMesh('cube.glb'),
        manager.loadMesh('cube.glb'),
      ]);
      expect(h1.uri).toBe(h2.uri);
      expect(h2.uri).toBe(h3.uri);
      expect(manager.getStats().meshCount).toBe(1);
    });

    it('应该在销毁后拒绝加载', async () => {
      manager.dispose();
      await expect(manager.loadMesh('cube.glb')).rejects.toThrow('disposed');
    });
  });

  // === 纹理加载测试 ===
  describe('loadTexture', () => {
    it('应该加载纹理资源', async () => {
      const handle = await manager.loadTexture('diffuse.png');
      expect(handle.type).toBe(ResourceType.Texture);
      expect(handle.uri).toBe('diffuse.png');
    });

    it('应该对同一纹理 URI 复用资源', async () => {
      await manager.loadTexture('diffuse.png');
      await manager.loadTexture('diffuse.png');
      expect(manager.getStats().textureCount).toBe(1);
    });

    it('应该在加载失败时抛出错误', async () => {
      manager.registerLoader('texture', {
        extensions: ['.png', '.jpg'],
        load: async () => {
          throw new Error('Texture load failed');
        },
        dispose: () => {},
      });
      await expect(manager.loadTexture('missing.png')).rejects.toThrow('Texture load failed');
    });
  });

  // === 材质加载测试 ===
  describe('loadMaterial', () => {
    it('应该加载材质资源', async () => {
      const handle = await manager.loadMaterial('standard.mat');
      expect(handle.type).toBe(ResourceType.Material);
      expect(handle.uri).toBe('standard.mat');
    });

    it('应该对同一材质 URI 复用资源', async () => {
      await manager.loadMaterial('standard.mat');
      await manager.loadMaterial('standard.mat');
      expect(manager.getStats().materialCount).toBe(1);
    });
  });

  // === 资源访问测试 ===
  describe('getMesh/getTexture/getMaterial', () => {
    it('应该返回加载的网格资源', async () => {
      const handle = await manager.loadMesh('cube.glb');
      const mesh = manager.getMesh(handle);
      expect(mesh).toBeDefined();
      expect(mesh?.vertexBuffer).toBeDefined();
    });

    it('应该对无效 handle 返回 undefined', () => {
      const invalidHandle = { id: 'invalid', type: ResourceType.Mesh, uri: 'fake.glb' };
      expect(manager.getMesh(invalidHandle)).toBeUndefined();
    });

    it('应该对错误类型的 handle 返回 undefined', async () => {
      const meshHandle = await manager.loadMesh('cube.glb');
      expect(manager.getTexture(meshHandle)).toBeUndefined();
    });

    it('应该返回加载的纹理资源', async () => {
      const handle = await manager.loadTexture('diffuse.png');
      const texture = manager.getTexture(handle);
      expect(texture).toBeDefined();
      expect(texture?.width).toBe(1);
      expect(texture?.height).toBe(1);
    });

    it('应该返回加载的材质资源', async () => {
      const handle = await manager.loadMaterial('standard.mat');
      const material = manager.getMaterial(handle);
      expect(material).toBeDefined();
      expect(material?.shaderId).toBe('default');
    });
  });

  // === 资源释放测试 ===
  describe('release', () => {
    it('应该减少引用计数', async () => {
      const h1 = await manager.loadMesh('cube.glb');
      const h2 = await manager.loadMesh('cube.glb');

      manager.release(h1);
      expect(manager.getStats().meshCount).toBe(1); // 还有 h2

      manager.release(h2);
      expect(manager.getStats().meshCount).toBe(0); // 完全释放
    });

    it('应该在引用计数为 0 时释放 GPU 资源', async () => {
      const mockDestroy = jest.fn();
      manager.registerLoader('mesh', {
        extensions: ['.glb'],
        load: async () =>
          ({
            vertexBuffer: { destroy: mockDestroy } as any,
            indexBuffer: { destroy: mockDestroy } as any,
            vertexCount: 8,
            indexCount: 36,
            primitiveType: 'triangles',
          }) as IMeshResource,
        dispose: () => {},
      });

      const handle = await manager.loadMesh('cube.glb');
      manager.release(handle);

      expect(mockDestroy).toHaveBeenCalledTimes(2); // vertex + index
    });

    it('应该处理纹理释放', async () => {
      const h1 = await manager.loadTexture('diffuse.png');
      const h2 = await manager.loadTexture('diffuse.png');

      manager.release(h1);
      expect(manager.getStats().textureCount).toBe(1);

      manager.release(h2);
      expect(manager.getStats().textureCount).toBe(0);
    });

    it('应该处理材质释放', async () => {
      const h1 = await manager.loadMaterial('standard.mat');
      const h2 = await manager.loadMaterial('standard.mat');

      manager.release(h1);
      expect(manager.getStats().materialCount).toBe(1);

      manager.release(h2);
      expect(manager.getStats().materialCount).toBe(0);
    });

    it('应该在销毁后拒绝操作', () => {
      const handle = { id: 'test', type: ResourceType.Mesh, uri: 'test.glb' };
      manager.dispose();
      expect(() => manager.release(handle)).toThrow('disposed');
    });
  });

  // === 强制释放测试 ===
  describe('forceRelease', () => {
    it('应该忽略引用计数直接释放', async () => {
      await manager.loadMesh('cube.glb');
      await manager.loadMesh('cube.glb');

      const handle = { id: 'mesh_1', type: ResourceType.Mesh, uri: 'cube.glb' };
      manager.forceRelease(handle);

      expect(manager.getStats().meshCount).toBe(0);
    });

    it('应该处理纹理强制释放', async () => {
      await manager.loadTexture('diffuse.png');
      await manager.loadTexture('diffuse.png');

      const handle = { id: 'texture_1', type: ResourceType.Texture, uri: 'diffuse.png' };
      manager.forceRelease(handle);

      expect(manager.getStats().textureCount).toBe(0);
    });

    it('应该处理材质强制释放', async () => {
      await manager.loadMaterial('standard.mat');

      const handle = { id: 'material_1', type: ResourceType.Material, uri: 'standard.mat' };
      manager.forceRelease(handle);

      expect(manager.getStats().materialCount).toBe(0);
    });
  });

  // === 加载器注册测试 ===
  describe('registerLoader', () => {
    it('应该注册自定义加载器', () => {
      const customLoader = {
        extensions: ['.custom'],
        load: async () => ({}),
        dispose: () => {},
      };
      manager.registerLoader('custom', customLoader);
      expect(manager.getLoader('custom')).toBe(customLoader);
    });

    it('应该使用注册的加载器', async () => {
      const mockMesh: IMeshResource = {
        vertexBuffer: null,
        indexBuffer: null,
        vertexCount: 0,
        indexCount: 0,
        primitiveType: 'triangles',
      };
      const mockLoad = jest.fn(async (_uri: string, _device: IRHIDevice) => mockMesh);

      manager.registerLoader('mesh', {
        extensions: ['.glb'],
        load: mockLoad,
        dispose: () => {},
      });
      await manager.loadMesh('test.glb');

      expect(mockLoad).toHaveBeenCalledWith('test.glb', mockDevice);
    });

    it('应该允许覆盖已注册的加载器', () => {
      const loader1 = {
        extensions: ['.test'],
        load: async () => ({}),
        dispose: () => {},
      };
      const loader2 = {
        extensions: ['.test'],
        load: async () => ({}),
        dispose: () => {},
      };

      manager.registerLoader('test', loader1);
      manager.registerLoader('test', loader2);

      expect(manager.getLoader('test')).toBe(loader2);
    });
  });

  // === 资源状态测试 ===
  describe('getResourceState', () => {
    it('应该返回已加载状态', async () => {
      const handle = await manager.loadMesh('cube.glb');
      const state = manager.getResourceState(handle);
      expect(state).toBe(ResourceState.Loaded);
    });

    it('应该对不存在的资源返回 undefined', () => {
      const handle = { id: 'test', type: ResourceType.Mesh, uri: 'nonexistent.glb' };
      expect(manager.getResourceState(handle)).toBeUndefined();
    });

    it('应该正确识别失败状态', async () => {
      manager.registerLoader('mesh', {
        extensions: ['.glb'],
        load: async () => {
          throw new Error('Load error');
        },
        dispose: () => {},
      });

      const handle = { id: '', type: ResourceType.Mesh, uri: 'error.glb' };
      try {
        await manager.loadMesh('error.glb');
      } catch {
        // 预期的错误
      }

      expect(manager.hasLoadError(handle)).toBe(true);
    });
  });

  // === 统计信息测试 ===
  describe('getStats', () => {
    it('应该返回正确的统计信息', async () => {
      await manager.loadMesh('cube.glb');
      await manager.loadTexture('diffuse.png');
      await manager.loadMaterial('standard.mat');

      const stats = manager.getStats();
      expect(stats.meshCount).toBe(1);
      expect(stats.textureCount).toBe(1);
      expect(stats.materialCount).toBe(1);
      expect(stats.loaderCount).toBe(0); // 没有注册自定义加载器
    });

    it('应该计算自定义加载器数量', () => {
      manager.registerLoader('custom1', {
        extensions: ['.c1'],
        load: async () => ({}),
        dispose: () => {},
      });
      manager.registerLoader('custom2', {
        extensions: ['.c2'],
        load: async () => ({}),
        dispose: () => {},
      });

      const stats = manager.getStats();
      expect(stats.loaderCount).toBe(2);
    });
  });

  // === dispose 测试 ===
  describe('dispose', () => {
    it('应该释放所有资源', async () => {
      await manager.loadMesh('cube.glb');
      await manager.loadTexture('diffuse.png');
      await manager.loadMaterial('standard.mat');

      manager.dispose();

      const stats = manager.getStats();
      expect(stats.meshCount).toBe(0);
      expect(stats.textureCount).toBe(0);
      expect(stats.materialCount).toBe(0);
    });

    it('应该清空加载器注册表', () => {
      manager.registerLoader('custom', {
        extensions: ['.custom'],
        load: async () => ({}),
        dispose: () => {},
      });
      manager.dispose();

      const stats = manager.getStats();
      expect(stats.loaderCount).toBe(0);
    });

    it('应该设置 disposed 标志', () => {
      expect(manager.isDisposed()).toBe(false);
      manager.dispose();
      expect(manager.isDisposed()).toBe(true);
    });

    it('应该是幂等的', () => {
      manager.dispose();
      expect(() => manager.dispose()).not.toThrow();
    });
  });

  // === 边界情况测试 ===
  describe('边界情况', () => {
    it('应该处理空 URI', async () => {
      const handle = await manager.loadMesh('');
      expect(handle.uri).toBe('');
      expect(manager.getMesh(handle)).toBeDefined();
    });

    it('应该处理特殊字符的 URI', async () => {
      const specialUri = 'path/to/资源.glb?query=value&foo=bar#hash';
      const handle = await manager.loadMesh(specialUri);
      expect(handle.uri).toBe(specialUri);
    });

    it('应该处理多次释放同一 handle', async () => {
      const handle = await manager.loadMesh('cube.glb');
      manager.release(handle);

      // 再次释放不应抛出错误
      expect(() => manager.release(handle)).not.toThrow();
    });
  });
});
