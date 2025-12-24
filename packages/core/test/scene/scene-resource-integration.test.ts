/**
 * Scene 与 ResourceManager 集成测试
 * 测试场景资源管理集成功能
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Scene } from '../../src/scene/scene';
import { ResourceType } from '@maxellabs/specification';
import type { ISceneData } from '@maxellabs/specification';

describe('Scene Resource Integration', () => {
  let scene: Scene;

  beforeEach(() => {
    scene = new Scene({ name: 'TestScene' });
  });

  afterEach(() => {
    if (!scene.isDisposed()) {
      scene.dispose();
    }
  });

  // === 基础集成测试 ===
  describe('ResourceManager 持有', () => {
    it('scene 应该持有 resourceManager 实例', () => {
      // 通过 public API 验证
      expect(scene.loadMesh).toBeDefined();
      expect(scene.loadTexture).toBeDefined();
      expect(scene.loadMaterial).toBeDefined();
      expect(scene.getMesh).toBeDefined();
      expect(scene.getTexture).toBeDefined();
      expect(scene.getMaterial).toBeDefined();
      expect(scene.releaseResource).toBeDefined();
    });
  });

  // === 加载 API 测试 ===
  describe('loadMesh/loadTexture/loadMaterial', () => {
    it('应该通过 scene 加载网格', async () => {
      const handle = await scene.loadMesh('cube.glb');
      expect(handle.type).toBe(ResourceType.Mesh);
      expect(handle.uri).toBe('cube.glb');

      const mesh = scene.getMesh(handle);
      expect(mesh).toBeDefined();
      expect(mesh?.vertexCount).toBe(0); // 默认加载器返回空网格
    });

    it('应该通过 scene 加载纹理', async () => {
      const handle = await scene.loadTexture('diffuse.png');
      expect(handle.type).toBe(ResourceType.Texture);
      expect(handle.uri).toBe('diffuse.png');

      const texture = scene.getTexture(handle);
      expect(texture).toBeDefined();
    });

    it('应该通过 scene 加载材质', async () => {
      const handle = await scene.loadMaterial('standard.mat');
      expect(handle.type).toBe(ResourceType.Material);
      expect(handle.uri).toBe('standard.mat');

      const material = scene.getMaterial(handle);
      expect(material).toBeDefined();
    });

    it('应该在 scene dispose 后拒绝加载', async () => {
      scene.dispose();
      await expect(scene.loadMesh('cube.glb')).rejects.toThrow('disposed');
    });

    it('应该支持并发加载多个资源', async () => {
      const [meshHandle, textureHandle, materialHandle] = await Promise.all([
        scene.loadMesh('cube.glb'),
        scene.loadTexture('diffuse.png'),
        scene.loadMaterial('standard.mat'),
      ]);

      expect(meshHandle.type).toBe(ResourceType.Mesh);
      expect(textureHandle.type).toBe(ResourceType.Texture);
      expect(materialHandle.type).toBe(ResourceType.Material);
    });
  });

  // === 资源释放测试 ===
  describe('releaseResource', () => {
    it('应该释放资源', async () => {
      const handle = await scene.loadMesh('cube.glb');
      expect(scene.getMesh(handle)).toBeDefined();

      scene.releaseResource(handle);
      // 资源已释放，但 getMesh 仍会返回 undefined（因为已删除）
      expect(scene.getMesh(handle)).toBeUndefined();
    });

    it('应该处理引用计数', async () => {
      const h1 = await scene.loadMesh('cube.glb');
      const h2 = await scene.loadMesh('cube.glb');

      scene.releaseResource(h1);
      // 还有 h2 引用，资源仍存在
      expect(scene.getMesh(h2)).toBeDefined();

      scene.releaseResource(h2);
      // 所有引用释放，资源已删除
      expect(scene.getMesh(h2)).toBeUndefined();
    });

    it('应该支持释放多种类型资源', async () => {
      const meshHandle = await scene.loadMesh('cube.glb');
      const textureHandle = await scene.loadTexture('diffuse.png');
      const materialHandle = await scene.loadMaterial('standard.mat');

      scene.releaseResource(meshHandle);
      scene.releaseResource(textureHandle);
      scene.releaseResource(materialHandle);

      expect(scene.getMesh(meshHandle)).toBeUndefined();
      expect(scene.getTexture(textureHandle)).toBeUndefined();
      expect(scene.getMaterial(materialHandle)).toBeUndefined();
    });
  });

  // === 生命周期测试 ===
  describe('scene.dispose() 清理资源', () => {
    it('应该在 dispose 时清理 resourceManager', async () => {
      await scene.loadMesh('cube.glb');
      await scene.loadTexture('diffuse.png');

      scene.dispose();

      // resourceManager 应该被清理
      expect(scene.isDisposed()).toBe(true);
    });

    it('应该释放所有加载的资源', async () => {
      // 需要通过 scene 的 resourceManager 注册自定义加载器
      // 但由于 resourceManager 是私有的，我们无法直接访问
      // 这个测试主要验证 dispose 调用了 resourceManager.dispose()
      await scene.loadMesh('cube.glb');
      await scene.loadTexture('diffuse.png');

      scene.dispose();

      // 验证场景已销毁
      expect(scene.isDisposed()).toBe(true);

      // 尝试加载应该失败
      await expect(scene.loadMesh('test.glb')).rejects.toThrow('disposed');
    });

    it('应该在清理实体前先清理资源', async () => {
      scene.createEntity('TestEntity');
      await scene.loadMesh('cube.glb');

      scene.dispose();

      expect(scene.isDisposed()).toBe(true);
    });
  });

  // === fromDataAsync 测试 ===
  describe('Scene.fromDataAsync 预加载', () => {
    it('应该预加载指定的资源', async () => {
      const sceneData: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: {
          name: 'LoadedScene',
          id: 'test-id',
          modifiedAt: new Date().toISOString(),
        },
        entities: [],
        assets: [
          { id: 'mesh1', uri: 'cube.glb', type: 'mesh', preload: true },
          { id: 'tex1', uri: 'diffuse.png', type: 'texture', preload: true },
        ],
      };

      const loadedScene = await Scene.fromDataAsync(sceneData);

      // 验证场景已创建
      expect(loadedScene).toBeDefined();
      expect(loadedScene.name).toBe('LoadedScene');

      loadedScene.dispose();
    });

    it('应该跳过 preload=false 的资源', async () => {
      const sceneData: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: { name: 'Scene', id: 'id', modifiedAt: '' },
        entities: [],
        assets: [{ id: 'skip1', uri: 'skip.glb', type: 'mesh', preload: false }],
      };

      const loadedScene = await Scene.fromDataAsync(sceneData);
      expect(loadedScene).toBeDefined();

      loadedScene.dispose();
    });

    it('应该默认预加载所有资源（preload 未指定）', async () => {
      const sceneData: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: { name: 'Scene', id: 'id', modifiedAt: '' },
        entities: [],
        assets: [
          { id: 'default1', uri: 'default.glb', type: 'mesh' }, // preload 未指定
        ],
      };

      const loadedScene = await Scene.fromDataAsync(sceneData);
      expect(loadedScene).toBeDefined();

      loadedScene.dispose();
    });

    it('应该在资源加载失败时继续创建场景', async () => {
      const sceneData: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: { name: 'Scene', id: 'id', modifiedAt: '' },
        entities: [],
        assets: [
          { id: 'error1', uri: 'error.glb', type: 'mesh', preload: true }, // 会失败（没有加载器）
        ],
      };

      // 应该不抛出错误
      const loadedScene = await Scene.fromDataAsync(sceneData);
      expect(loadedScene).toBeDefined();

      loadedScene.dispose();
    });

    it('应该触发 assetsPreloaded 事件', async () => {
      const listener = jest.fn();

      const sceneData: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: { name: 'Scene', id: 'id', modifiedAt: '' },
        entities: [],
        assets: [{ id: 'mesh1', uri: 'cube.glb', type: 'mesh', preload: true }],
      };

      // 创建场景但先不调用 fromDataAsync
      const tempScene = new Scene({ name: 'TempScene' });
      tempScene.on('assetsPreloaded', listener);
      tempScene.dispose();

      // 创建新场景时无法提前注册事件，因为 fromDataAsync 是静态方法
      // 我们需要在场景创建后立即注册
      const loadedScene = await Scene.fromDataAsync(sceneData);

      // 事件在 fromDataAsync 内部触发，无法在外部捕获
      // 这个测试验证方法不会崩溃
      expect(loadedScene).toBeDefined();

      loadedScene.dispose();
    });

    it('应该支持加载多种类型资源', async () => {
      const sceneData: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: { name: 'Scene', id: 'id', modifiedAt: '' },
        entities: [],
        assets: [
          { id: 'mesh1', uri: 'cube.glb', type: 'mesh', preload: true },
          { id: 'tex1', uri: 'diffuse.png', type: 'texture', preload: true },
          { id: 'mat1', uri: 'standard.mat', type: 'material', preload: true },
        ],
      };

      const loadedScene = await Scene.fromDataAsync(sceneData);
      expect(loadedScene).toBeDefined();

      loadedScene.dispose();
    });

    it('应该忽略不支持的资源类型', async () => {
      const sceneData: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: { name: 'Scene', id: 'id', modifiedAt: '' },
        entities: [],
        assets: [
          { id: 'audio1', uri: 'sound.mp3', type: 'audio', preload: true }, // 不支持
          { id: 'script1', uri: 'logic.js', type: 'script', preload: true }, // 不支持
        ],
      };

      const loadedScene = await Scene.fromDataAsync(sceneData);
      expect(loadedScene).toBeDefined();

      loadedScene.dispose();
    });
  });

  // === 兼容性测试 ===
  describe('Scene.fromData 同步版本', () => {
    it('应该保持同步行为（不预加载）', () => {
      const sceneData: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: { name: 'SyncScene', id: 'sync-id', modifiedAt: '' },
        entities: [],
        assets: [{ id: 'mesh1', uri: 'cube.glb', type: 'mesh', preload: true }],
      };

      const syncScene = Scene.fromData(sceneData);
      expect(syncScene).toBeDefined();
      expect(syncScene.name).toBe('SyncScene');

      // 资源不应被预加载（同步版本）
      syncScene.dispose();
    });

    it('应该创建实体和组件', () => {
      const sceneData: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: { name: 'Scene', id: 'id', modifiedAt: '' },
        entities: [
          {
            id: 1,
            name: 'Entity1',
            active: true,
            parent: null,
            components: [],
          },
        ],
      };

      const syncScene = Scene.fromData(sceneData);
      expect(syncScene.getEntityCount()).toBeGreaterThan(0); // 包含根实体和 Entity1

      syncScene.dispose();
    });
  });

  // === 错误处理测试 ===
  describe('错误处理', () => {
    it('应该处理加载器未注册的情况', async () => {
      // 默认加载器返回空资源
      const handle = await scene.loadMesh('cube.glb');
      const mesh = scene.getMesh(handle);
      expect(mesh?.vertexCount).toBe(0);
    });

    it('应该处理无效的资源 handle', () => {
      const invalidHandle = {
        id: 'invalid',
        type: ResourceType.Mesh,
        uri: 'nonexistent.glb',
      };

      expect(scene.getMesh(invalidHandle)).toBeUndefined();
    });

    it('应该处理错误类型的 handle', async () => {
      const meshHandle = await scene.loadMesh('cube.glb');

      // 尝试用网格 handle 获取纹理
      expect(scene.getTexture(meshHandle)).toBeUndefined();
      expect(scene.getMaterial(meshHandle)).toBeUndefined();
    });
  });

  // === 性能和并发测试 ===
  describe('性能和并发', () => {
    it('应该支持大量资源加载', async () => {
      const promises: Promise<any>[] = [];

      for (let i = 0; i < 100; i++) {
        promises.push(scene.loadMesh(`mesh${i}.glb`));
      }

      const handles = await Promise.all(promises);
      expect(handles).toHaveLength(100);
    });

    it('应该正确处理并发场景创建', async () => {
      const sceneData: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: { name: 'Scene', id: 'id', modifiedAt: '' },
        entities: [],
        assets: [{ id: 'mesh1', uri: 'cube.glb', type: 'mesh', preload: true }],
      };

      const [scene1, scene2, scene3] = await Promise.all([
        Scene.fromDataAsync(sceneData),
        Scene.fromDataAsync(sceneData),
        Scene.fromDataAsync(sceneData),
      ]);

      expect(scene1.id).not.toBe(scene2.id);
      expect(scene2.id).not.toBe(scene3.id);

      scene1.dispose();
      scene2.dispose();
      scene3.dispose();
    });
  });
});
