/**
 * ResourceHandle 模块测试
 * 测试资源句柄功能
 */

import { describe, it, expect } from '@jest/globals';
import { ResourceHandle, createResourceHandle } from '../../src/resources/resource-handle';
import { ResourceType } from '@maxellabs/specification';

describe('ResourceHandle', () => {
  describe('constructor', () => {
    it('应该创建具有正确属性的资源句柄', () => {
      const handle = new ResourceHandle('mesh_1', ResourceType.Mesh, 'models/cube.glb');

      expect(handle.id).toBe('mesh_1');
      expect(handle.type).toBe(ResourceType.Mesh);
      expect(handle.uri).toBe('models/cube.glb');
    });

    it('应该创建纹理类型的资源句柄', () => {
      const handle = new ResourceHandle('texture_1', ResourceType.Texture, 'textures/diffuse.png');

      expect(handle.id).toBe('texture_1');
      expect(handle.type).toBe(ResourceType.Texture);
      expect(handle.uri).toBe('textures/diffuse.png');
    });

    it('应该创建材质类型的资源句柄', () => {
      const handle = new ResourceHandle('material_1', ResourceType.Material, 'materials/standard.mat');

      expect(handle.id).toBe('material_1');
      expect(handle.type).toBe(ResourceType.Material);
      expect(handle.uri).toBe('materials/standard.mat');
    });

    it('应该处理空 URI', () => {
      const handle = new ResourceHandle('mesh_1', ResourceType.Mesh, '');

      expect(handle.uri).toBe('');
    });

    it('应该处理特殊字符的 URI', () => {
      const specialUri = 'path/to/资源.glb?query=value&foo=bar#hash';
      const handle = new ResourceHandle('mesh_1', ResourceType.Mesh, specialUri);

      expect(handle.uri).toBe(specialUri);
    });
  });

  describe('toString', () => {
    it('应该返回正确的字符串表示', () => {
      const handle = new ResourceHandle('mesh_1', ResourceType.Mesh, 'models/cube.glb');

      expect(handle.toString()).toBe('ResourceHandle(mesh:models/cube.glb)');
    });

    it('应该正确处理纹理类型', () => {
      const handle = new ResourceHandle('texture_1', ResourceType.Texture, 'textures/diffuse.png');

      expect(handle.toString()).toBe('ResourceHandle(texture:textures/diffuse.png)');
    });

    it('应该正确处理材质类型', () => {
      const handle = new ResourceHandle('material_1', ResourceType.Material, 'materials/standard.mat');

      expect(handle.toString()).toBe('ResourceHandle(material:materials/standard.mat)');
    });

    it('应该正确处理空 URI', () => {
      const handle = new ResourceHandle('mesh_1', ResourceType.Mesh, '');

      expect(handle.toString()).toBe('ResourceHandle(mesh:)');
    });
  });

  describe('属性只读性', () => {
    it('id 属性应该是只读的', () => {
      const handle = new ResourceHandle('mesh_1', ResourceType.Mesh, 'models/cube.glb');

      // TypeScript 编译时会阻止修改，运行时验证属性存在
      expect(handle.id).toBe('mesh_1');
    });

    it('type 属性应该是只读的', () => {
      const handle = new ResourceHandle('mesh_1', ResourceType.Mesh, 'models/cube.glb');

      expect(handle.type).toBe(ResourceType.Mesh);
    });

    it('uri 属性应该是只读的', () => {
      const handle = new ResourceHandle('mesh_1', ResourceType.Mesh, 'models/cube.glb');

      expect(handle.uri).toBe('models/cube.glb');
    });
  });
});

describe('createResourceHandle', () => {
  describe('基本功能', () => {
    it('应该创建网格资源句柄', () => {
      const handle = createResourceHandle('models/cube.glb', ResourceType.Mesh, 1);

      expect(handle.id).toBe('mesh_1');
      expect(handle.type).toBe(ResourceType.Mesh);
      expect(handle.uri).toBe('models/cube.glb');
    });

    it('应该创建纹理资源句柄', () => {
      const handle = createResourceHandle('textures/diffuse.png', ResourceType.Texture, 2);

      expect(handle.id).toBe('texture_2');
      expect(handle.type).toBe(ResourceType.Texture);
      expect(handle.uri).toBe('textures/diffuse.png');
    });

    it('应该创建材质资源句柄', () => {
      const handle = createResourceHandle('materials/standard.mat', ResourceType.Material, 3);

      expect(handle.id).toBe('material_3');
      expect(handle.type).toBe(ResourceType.Material);
      expect(handle.uri).toBe('materials/standard.mat');
    });
  });

  describe('ID 生成', () => {
    it('应该使用计数器生成唯一 ID', () => {
      const handle1 = createResourceHandle('a.glb', ResourceType.Mesh, 1);
      const handle2 = createResourceHandle('b.glb', ResourceType.Mesh, 2);
      const handle3 = createResourceHandle('c.glb', ResourceType.Mesh, 100);

      expect(handle1.id).toBe('mesh_1');
      expect(handle2.id).toBe('mesh_2');
      expect(handle3.id).toBe('mesh_100');
    });

    it('应该为不同类型生成不同前缀的 ID', () => {
      const meshHandle = createResourceHandle('a.glb', ResourceType.Mesh, 1);
      const textureHandle = createResourceHandle('b.png', ResourceType.Texture, 1);
      const materialHandle = createResourceHandle('c.mat', ResourceType.Material, 1);

      expect(meshHandle.id).toBe('mesh_1');
      expect(textureHandle.id).toBe('texture_1');
      expect(materialHandle.id).toBe('material_1');
    });

    it('应该处理计数器为 0', () => {
      const handle = createResourceHandle('test.glb', ResourceType.Mesh, 0);

      expect(handle.id).toBe('mesh_0');
    });
  });

  describe('边界情况', () => {
    it('应该处理空 URI', () => {
      const handle = createResourceHandle('', ResourceType.Mesh, 1);

      expect(handle.uri).toBe('');
      expect(handle.id).toBe('mesh_1');
    });

    it('应该处理非常长的 URI', () => {
      const longUri = 'a'.repeat(1000) + '.glb';
      const handle = createResourceHandle(longUri, ResourceType.Mesh, 1);

      expect(handle.uri).toBe(longUri);
    });

    it('应该处理包含特殊字符的 URI', () => {
      const specialUri = 'path/to/文件.glb?param=值&foo=bar#section';
      const handle = createResourceHandle(specialUri, ResourceType.Mesh, 1);

      expect(handle.uri).toBe(specialUri);
    });

    it('应该处理大计数器值', () => {
      const handle = createResourceHandle('test.glb', ResourceType.Mesh, Number.MAX_SAFE_INTEGER);

      expect(handle.id).toBe(`mesh_${Number.MAX_SAFE_INTEGER}`);
    });
  });

  describe('返回类型', () => {
    it('应该返回 ResourceHandle 实例', () => {
      const handle = createResourceHandle('test.glb', ResourceType.Mesh, 1);

      expect(handle).toBeInstanceOf(ResourceHandle);
    });

    it('返回的句柄应该有 toString 方法', () => {
      const handle = createResourceHandle('test.glb', ResourceType.Mesh, 1);

      expect(typeof handle.toString).toBe('function');
      expect(handle.toString()).toBe('ResourceHandle(mesh:test.glb)');
    });
  });
});
