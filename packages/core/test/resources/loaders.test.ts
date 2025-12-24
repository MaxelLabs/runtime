/**
 * Default Loaders 模块测试
 * 测试默认资源加载器功能
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { DefaultMeshLoader } from '../../src/resources/loaders/mesh-loader';
import { DefaultTextureLoader } from '../../src/resources/loaders/texture-loader';
import { DefaultMaterialLoader } from '../../src/resources/loaders/material-loader';
import type { IRHIDevice, IMeshResource, ITextureResource, IMaterialResource } from '@maxellabs/specification';

describe('DefaultMeshLoader', () => {
  let loader: DefaultMeshLoader;
  let mockDevice: IRHIDevice;

  beforeEach(() => {
    loader = new DefaultMeshLoader();
    mockDevice = {} as IRHIDevice;
  });

  describe('extensions', () => {
    it('应该返回空数组（回退加载器）', () => {
      expect(loader.extensions).toEqual([]);
    });
  });

  describe('load', () => {
    it('应该返回空网格资源', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const mesh = await loader.load('models/cube.glb', mockDevice);

      expect(mesh.vertexBuffer).toBeNull();
      expect(mesh.indexBuffer).toBeNull();
      expect(mesh.vertexCount).toBe(0);
      expect(mesh.indexCount).toBe(0);
      expect(mesh.primitiveType).toBe('triangles');

      consoleSpy.mockRestore();
    });

    it('应该输出警告信息', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await loader.load('models/cube.glb', mockDevice);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No custom loader registered'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('models/cube.glb'));

      consoleSpy.mockRestore();
    });

    it('应该处理不同的 URI', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const mesh1 = await loader.load('a.glb', mockDevice);
      const mesh2 = await loader.load('path/to/model.gltf', mockDevice);

      expect(mesh1.vertexCount).toBe(0);
      expect(mesh2.vertexCount).toBe(0);

      consoleSpy.mockRestore();
    });

    it('应该处理空 URI', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const mesh = await loader.load('', mockDevice);

      expect(mesh.vertexCount).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe('dispose', () => {
    it('应该调用 vertexBuffer.destroy()', () => {
      const mockDestroy = jest.fn();
      const resource: IMeshResource = {
        vertexBuffer: { destroy: mockDestroy } as any,
        indexBuffer: null,
        vertexCount: 0,
        indexCount: 0,
        primitiveType: 'triangles',
      };

      loader.dispose(resource);

      expect(mockDestroy).toHaveBeenCalled();
    });

    it('应该调用 indexBuffer.destroy()', () => {
      const mockDestroy = jest.fn();
      const resource: IMeshResource = {
        vertexBuffer: null,
        indexBuffer: { destroy: mockDestroy } as any,
        vertexCount: 0,
        indexCount: 0,
        primitiveType: 'triangles',
      };

      loader.dispose(resource);

      expect(mockDestroy).toHaveBeenCalled();
    });

    it('应该同时调用两个 buffer 的 destroy()', () => {
      const mockVertexDestroy = jest.fn();
      const mockIndexDestroy = jest.fn();
      const resource: IMeshResource = {
        vertexBuffer: { destroy: mockVertexDestroy } as any,
        indexBuffer: { destroy: mockIndexDestroy } as any,
        vertexCount: 8,
        indexCount: 36,
        primitiveType: 'triangles',
      };

      loader.dispose(resource);

      expect(mockVertexDestroy).toHaveBeenCalled();
      expect(mockIndexDestroy).toHaveBeenCalled();
    });

    it('应该处理 null buffer', () => {
      const resource: IMeshResource = {
        vertexBuffer: null,
        indexBuffer: null,
        vertexCount: 0,
        indexCount: 0,
        primitiveType: 'triangles',
      };

      expect(() => loader.dispose(resource)).not.toThrow();
    });

    it('应该处理 destroy 抛出的错误', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const resource: IMeshResource = {
        vertexBuffer: {
          destroy: () => {
            throw new Error('Destroy failed');
          },
        } as any,
        indexBuffer: null,
        vertexCount: 0,
        indexCount: 0,
        primitiveType: 'triangles',
      };

      expect(() => loader.dispose(resource)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to dispose'), expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});

describe('DefaultTextureLoader', () => {
  let loader: DefaultTextureLoader;
  let mockDevice: IRHIDevice;

  beforeEach(() => {
    loader = new DefaultTextureLoader();
    mockDevice = {} as IRHIDevice;
  });

  describe('extensions', () => {
    it('应该返回空数组（回退加载器）', () => {
      expect(loader.extensions).toEqual([]);
    });
  });

  describe('load', () => {
    it('应该返回 1x1 占位符纹理', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const texture = await loader.load('textures/diffuse.png', mockDevice);

      expect(texture.texture).toBeNull();
      expect(texture.width).toBe(1);
      expect(texture.height).toBe(1);
      expect(texture.hasMipmaps).toBe(false);

      consoleSpy.mockRestore();
    });

    it('应该输出警告信息', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await loader.load('textures/diffuse.png', mockDevice);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No custom loader registered'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('textures/diffuse.png'));

      consoleSpy.mockRestore();
    });

    it('应该处理不同的 URI', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const tex1 = await loader.load('a.png', mockDevice);
      const tex2 = await loader.load('path/to/image.jpg', mockDevice);

      expect(tex1.width).toBe(1);
      expect(tex2.width).toBe(1);

      consoleSpy.mockRestore();
    });

    it('应该处理空 URI', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const texture = await loader.load('', mockDevice);

      expect(texture.width).toBe(1);
      expect(texture.height).toBe(1);

      consoleSpy.mockRestore();
    });
  });

  describe('dispose', () => {
    it('应该调用 texture.destroy()', () => {
      const mockDestroy = jest.fn();
      const resource: ITextureResource = {
        texture: { destroy: mockDestroy } as any,
        width: 512,
        height: 512,
        hasMipmaps: true,
      };

      loader.dispose(resource);

      expect(mockDestroy).toHaveBeenCalled();
    });

    it('应该处理 null texture', () => {
      const resource: ITextureResource = {
        texture: null,
        width: 1,
        height: 1,
        hasMipmaps: false,
      };

      expect(() => loader.dispose(resource)).not.toThrow();
    });

    it('应该处理 destroy 抛出的错误', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const resource: ITextureResource = {
        texture: {
          destroy: () => {
            throw new Error('Destroy failed');
          },
        } as any,
        width: 512,
        height: 512,
        hasMipmaps: true,
      };

      expect(() => loader.dispose(resource)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to dispose'), expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});

describe('DefaultMaterialLoader', () => {
  let loader: DefaultMaterialLoader;
  let mockDevice: IRHIDevice;

  beforeEach(() => {
    loader = new DefaultMaterialLoader();
    mockDevice = {} as IRHIDevice;
  });

  describe('extensions', () => {
    it('应该返回空数组（回退加载器）', () => {
      expect(loader.extensions).toEqual([]);
    });
  });

  describe('load', () => {
    it('应该返回默认材质', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const material = await loader.load('materials/standard.mat', mockDevice);

      expect(material.shaderId).toBe('default');
      expect(material.properties).toEqual({});
      expect(material.textures).toEqual({});

      consoleSpy.mockRestore();
    });

    it('应该输出警告信息', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await loader.load('materials/standard.mat', mockDevice);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No custom loader registered'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('materials/standard.mat'));

      consoleSpy.mockRestore();
    });

    it('应该处理不同的 URI', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const mat1 = await loader.load('a.mat', mockDevice);
      const mat2 = await loader.load('path/to/material.json', mockDevice);

      expect(mat1.shaderId).toBe('default');
      expect(mat2.shaderId).toBe('default');

      consoleSpy.mockRestore();
    });

    it('应该处理空 URI', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const material = await loader.load('', mockDevice);

      expect(material.shaderId).toBe('default');

      consoleSpy.mockRestore();
    });
  });

  describe('dispose', () => {
    it('应该不抛出错误（材质不持有 GPU 资源）', () => {
      const resource: IMaterialResource = {
        shaderId: 'default',
        properties: { color: [1, 0, 0, 1] },
        textures: {},
      };

      expect(() => loader.dispose(resource)).not.toThrow();
    });

    it('应该处理带有纹理引用的材质', () => {
      const resource: IMaterialResource = {
        shaderId: 'pbr',
        properties: {},
        textures: {
          diffuse: 'texture_1',
          normal: 'texture_2',
        },
      };

      expect(() => loader.dispose(resource)).not.toThrow();
    });

    it('应该处理空材质', () => {
      const resource: IMaterialResource = {
        shaderId: '',
        properties: {},
        textures: {},
      };

      expect(() => loader.dispose(resource)).not.toThrow();
    });
  });
});
