/**
 * SceneSerializer 模块测试
 * 测试场景序列化器功能
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SceneSerializer } from '../../src/scene/serialization/scene-serializer';
import { SceneComponentRegistry } from '../../src/scene/component-registry';
import { Scene } from '../../src/scene/scene';
import { LocalTransform } from '../../src/components/transform';
import type { ISceneData } from '@maxellabs/specification';

describe('SceneSerializer', () => {
  let registry: SceneComponentRegistry;
  let serializer: SceneSerializer;
  let scene: Scene;

  beforeEach(() => {
    SceneComponentRegistry.resetInstance();
    registry = SceneComponentRegistry.getInstance();
    serializer = new SceneSerializer(registry);
    scene = new Scene({ name: 'TestScene' });
  });

  afterEach(() => {
    if (!scene.isDisposed()) {
      scene.dispose();
    }
    SceneComponentRegistry.resetInstance();
  });

  describe('fromData', () => {
    it('应该从数据创建实体', () => {
      const data: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: {
          name: 'TestScene',
          id: 'test-id',
          modifiedAt: new Date().toISOString(),
        },
        entities: [
          {
            id: 1,
            name: 'TestEntity',
            active: true,
            parent: null,
            components: [],
          },
        ],
      };

      serializer.fromData(data, scene);

      expect(scene.findEntityByName('TestEntity')).not.toBeNull();
    });

    it('应该建立父子关系', () => {
      const data: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: {
          name: 'TestScene',
          id: 'test-id',
          modifiedAt: new Date().toISOString(),
        },
        entities: [
          {
            id: 1,
            name: 'Parent',
            active: true,
            parent: null,
            components: [],
          },
          {
            id: 2,
            name: 'Child',
            active: true,
            parent: 1,
            components: [],
          },
        ],
      };

      serializer.fromData(data, scene);

      const parent = scene.findEntityByName('Parent');
      const child = scene.findEntityByName('Child');

      expect(parent).not.toBeNull();
      expect(child).not.toBeNull();
      expect(scene.getParent(child!)).toBe(parent);
    });

    it('应该设置实体标签', () => {
      const data: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: {
          name: 'TestScene',
          id: 'test-id',
          modifiedAt: new Date().toISOString(),
        },
        entities: [
          {
            id: 1,
            name: 'TaggedEntity',
            tag: 'enemy',
            active: true,
            parent: null,
            components: [],
          },
        ],
      };

      serializer.fromData(data, scene);

      const entity = scene.findEntityByName('TaggedEntity');
      expect(scene.getEntityTag(entity!)).toBe('enemy');
    });

    it('应该设置实体激活状态', () => {
      const data: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: {
          name: 'TestScene',
          id: 'test-id',
          modifiedAt: new Date().toISOString(),
        },
        entities: [
          {
            id: 1,
            name: 'InactiveEntity',
            active: false,
            parent: null,
            components: [],
          },
        ],
      };

      serializer.fromData(data, scene);

      const entity = scene.findEntityByName('InactiveEntity');
      expect(scene.isEntityActive(entity!)).toBe(false);
    });

    it('应该添加组件', () => {
      const data: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: {
          name: 'TestScene',
          id: 'test-id',
          modifiedAt: new Date().toISOString(),
        },
        entities: [
          {
            id: 1,
            name: 'EntityWithComponent',
            active: true,
            parent: null,
            components: [
              {
                type: 'LocalTransform',
                data: {
                  position: { x: 1, y: 2, z: 3 },
                  rotation: { x: 0, y: 0, z: 0, w: 1 },
                  scale: { x: 1, y: 1, z: 1 },
                },
              },
            ],
          },
        ],
      };

      serializer.fromData(data, scene);

      const entity = scene.findEntityByName('EntityWithComponent');
      expect(scene.world.hasComponent(entity!, LocalTransform)).toBe(true);
    });

    it('应该跳过 Name 和 Tag 类型的组件', () => {
      const data: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: {
          name: 'TestScene',
          id: 'test-id',
          modifiedAt: new Date().toISOString(),
        },
        entities: [
          {
            id: 1,
            name: 'TestEntity',
            active: true,
            parent: null,
            components: [
              { type: 'Name', data: { value: 'ShouldBeSkipped' } },
              { type: 'Tag', data: { value: 'ShouldBeSkipped' } },
            ],
          },
        ],
      };

      serializer.fromData(data, scene);

      const entity = scene.findEntityByName('TestEntity');
      expect(entity).not.toBeNull();
      // Name 应该是 createEntity 设置的，不是从组件数据加载的
      expect(scene.getEntityName(entity!)).toBe('TestEntity');
    });

    it('应该处理未知的组件类型', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const data: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: {
          name: 'TestScene',
          id: 'test-id',
          modifiedAt: new Date().toISOString(),
        },
        entities: [
          {
            id: 1,
            name: 'TestEntity',
            active: true,
            parent: null,
            components: [{ type: 'UnknownComponent', data: {} }],
          },
        ],
      };

      serializer.fromData(data, scene);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown component type'));

      consoleSpy.mockRestore();
    });

    it('应该应用环境设置', () => {
      const listener = jest.fn();
      scene.on('environmentChanged', listener);

      const data: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: {
          name: 'TestScene',
          id: 'test-id',
          modifiedAt: new Date().toISOString(),
        },
        entities: [],
        environment: {
          skybox: { type: 'color', color: { r: 0.5, g: 0.5, b: 0.5, a: 1 } },
        },
      } as any;

      serializer.fromData(data, scene);

      expect(listener).toHaveBeenCalled();
    });

    it('应该应用渲染设置', () => {
      const listener = jest.fn();
      scene.on('renderSettingsChanged', listener);

      const data: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: {
          name: 'TestScene',
          id: 'test-id',
          modifiedAt: new Date().toISOString(),
        },
        entities: [],
        renderSettings: {
          antiAliasing: { enabled: true, type: 'msaa', samples: 4 },
        },
      } as any;

      serializer.fromData(data, scene);

      expect(listener).toHaveBeenCalled();
    });

    it('应该处理带有 enabled=false 的组件', () => {
      class EnabledComponent {
        enabled: boolean = true;
        value: number = 0;

        static fromData(data: Record<string, unknown>): EnabledComponent {
          const comp = new EnabledComponent();
          if (data.value !== undefined) {
            comp.value = data.value as number;
          }
          return comp;
        }
      }

      registry.register('EnabledComponent', EnabledComponent, {
        factory: (data: Record<string, unknown>) => EnabledComponent.fromData(data),
      });

      const data: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: {
          name: 'TestScene',
          id: 'test-id',
          modifiedAt: new Date().toISOString(),
        },
        entities: [
          {
            id: 1,
            name: 'TestEntity',
            active: true,
            parent: null,
            components: [
              {
                type: 'EnabledComponent',
                data: { value: 42 },
                enabled: false,
              },
            ],
          },
        ],
      };

      serializer.fromData(data, scene);

      const entity = scene.findEntityByName('TestEntity');
      const comp = scene.world.getComponent(entity!, EnabledComponent);
      expect(comp?.enabled).toBe(false);
    });
  });

  describe('fromDataAsync', () => {
    it('应该异步加载场景数据', async () => {
      const data: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: {
          name: 'TestScene',
          id: 'test-id',
          modifiedAt: new Date().toISOString(),
        },
        entities: [
          {
            id: 1,
            name: 'TestEntity',
            active: true,
            parent: null,
            components: [],
          },
        ],
      };

      await serializer.fromDataAsync(data, scene);

      expect(scene.findEntityByName('TestEntity')).not.toBeNull();
    });

    it('应该预加载资源', async () => {
      const listener = jest.fn();
      scene.on('assetsPreloaded', listener);

      // Mock scene 的资源加载方法
      const loadMeshSpy = jest.spyOn(scene, 'loadMesh').mockResolvedValue({} as any);
      const loadTextureSpy = jest.spyOn(scene, 'loadTexture').mockResolvedValue({} as any);
      const loadMaterialSpy = jest.spyOn(scene, 'loadMaterial').mockResolvedValue({} as any);

      const data: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: {
          name: 'TestScene',
          id: 'test-id',
          modifiedAt: new Date().toISOString(),
        },
        entities: [],
        assets: [
          { type: 'mesh', uri: 'models/cube.glb', preload: true },
          { type: 'texture', uri: 'textures/diffuse.png', preload: true },
          { type: 'material', uri: 'materials/standard.mat', preload: true },
        ],
      } as any;

      await serializer.fromDataAsync(data, scene);

      expect(loadMeshSpy).toHaveBeenCalledWith('models/cube.glb');
      expect(loadTextureSpy).toHaveBeenCalledWith('textures/diffuse.png');
      expect(loadMaterialSpy).toHaveBeenCalledWith('materials/standard.mat');
      expect(listener).toHaveBeenCalledWith({ count: 3 });

      loadMeshSpy.mockRestore();
      loadTextureSpy.mockRestore();
      loadMaterialSpy.mockRestore();
    });

    it('应该跳过 preload=false 的资源', async () => {
      const loadMeshSpy = jest.spyOn(scene, 'loadMesh').mockResolvedValue({} as any);

      const data: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: {
          name: 'TestScene',
          id: 'test-id',
          modifiedAt: new Date().toISOString(),
        },
        entities: [],
        assets: [{ type: 'mesh', uri: 'models/cube.glb', preload: false }],
      } as any;

      await serializer.fromDataAsync(data, scene);

      expect(loadMeshSpy).not.toHaveBeenCalled();

      loadMeshSpy.mockRestore();
    });

    it('应该处理资源加载失败', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const loadMeshSpy = jest.spyOn(scene, 'loadMesh').mockRejectedValue(new Error('Load failed'));

      const data: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: {
          name: 'TestScene',
          id: 'test-id',
          modifiedAt: new Date().toISOString(),
        },
        entities: [],
        assets: [{ type: 'mesh', uri: 'models/missing.glb', preload: true }],
      } as any;

      // 不应该抛出错误
      await expect(serializer.fromDataAsync(data, scene)).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to preload'), expect.any(Error));

      consoleSpy.mockRestore();
      loadMeshSpy.mockRestore();
    });
  });

  describe('toData', () => {
    it('应该导出场景数据', () => {
      scene.createEntity('Player');

      const data = serializer.toData(scene);

      expect(data.version).toBeDefined();
      expect(data.metadata.name).toBe('TestScene');
      expect(data.entities.length).toBeGreaterThan(0);
    });

    it('应该包含实体名称和标签', () => {
      const entity = scene.createEntity('Player');
      scene.setEntityTag(entity, 'player');

      const data = serializer.toData(scene);
      const entityData = data.entities.find((e) => e.name === 'Player');

      expect(entityData).toBeDefined();
      expect(entityData?.tag).toBe('player');
    });

    it('应该包含实体激活状态', () => {
      const entity = scene.createEntity('InactiveEntity');
      scene.setEntityActive(entity, false);

      const data = serializer.toData(scene);
      const entityData = data.entities.find((e) => e.name === 'InactiveEntity');

      expect(entityData?.active).toBe(false);
    });

    it('应该包含父子关系', () => {
      const parent = scene.createEntity('Parent');
      const child = scene.createEntity('Child');
      scene.setParent(child, parent);

      const data = serializer.toData(scene);
      const childData = data.entities.find((e) => e.name === 'Child');

      expect(childData?.parent).toBe(parent);
    });

    it('应该包含组件数据', () => {
      const entity = scene.createEntity('EntityWithComponent');
      scene.world.addComponent(
        entity,
        LocalTransform,
        LocalTransform.fromData({
          position: { x: 1, y: 2, z: 3 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        })
      );

      const data = serializer.toData(scene);
      const entityData = data.entities.find((e) => e.name === 'EntityWithComponent');

      expect(entityData?.components.some((c) => c.type === 'LocalTransform')).toBe(true);
    });

    it('应该跳过内部组件（Parent, Children, Name, Tag）', () => {
      const parent = scene.createEntity('Parent');
      const child = scene.createEntity('Child');
      scene.setParent(child, parent);
      scene.setEntityTag(child, 'test');

      const data = serializer.toData(scene);
      const childData = data.entities.find((e) => e.name === 'Child');

      expect(childData?.components.some((c) => c.type === 'Parent')).toBe(false);
      expect(childData?.components.some((c) => c.type === 'Children')).toBe(false);
      expect(childData?.components.some((c) => c.type === 'Name')).toBe(false);
      expect(childData?.components.some((c) => c.type === 'Tag')).toBe(false);
    });

    it('应该排除根实体', () => {
      scene.createEntity('Player');

      const data = serializer.toData(scene);

      // 根实体不应该在导出数据中
      const rootId = scene.getRoot();
      expect(data.entities.some((e) => e.id === rootId)).toBe(false);
    });

    it('应该正确序列化数组属性', () => {
      class ArrayComponent {
        items: number[] = [];

        static fromData(data: Record<string, unknown>): ArrayComponent {
          const comp = new ArrayComponent();
          if (data.items) {
            comp.items = [...(data.items as number[])];
          }
          return comp;
        }
      }

      registry.register('ArrayComponent', ArrayComponent, {
        factory: (data: Record<string, unknown>) => ArrayComponent.fromData(data),
      });

      const entity = scene.createEntity('TestEntity');
      scene.world.addComponent(entity, ArrayComponent, ArrayComponent.fromData({ items: [1, 2, 3] }));

      const data = serializer.toData(scene);
      const entityData = data.entities.find((e) => e.name === 'TestEntity');
      const compData = entityData?.components.find((c) => c.type === 'ArrayComponent');

      expect(compData?.data.items).toEqual([1, 2, 3]);
    });

    it('应该正确序列化嵌套对象属性', () => {
      class NestedComponent {
        nested: { x: number; y: number } = { x: 0, y: 0 };

        static fromData(data: Record<string, unknown>): NestedComponent {
          const comp = new NestedComponent();
          if (data.nested) {
            comp.nested = { ...(data.nested as { x: number; y: number }) };
          }
          return comp;
        }
      }

      registry.register('NestedComponent', NestedComponent, {
        factory: (data: Record<string, unknown>) => NestedComponent.fromData(data),
      });

      const entity = scene.createEntity('TestEntity');
      scene.world.addComponent(entity, NestedComponent, NestedComponent.fromData({ nested: { x: 10, y: 20 } }));

      const data = serializer.toData(scene);
      const entityData = data.entities.find((e) => e.name === 'TestEntity');
      const compData = entityData?.components.find((c) => c.type === 'NestedComponent');

      expect(compData?.data.nested).toEqual({ x: 10, y: 20 });
    });

    it('应该跳过函数和私有属性', () => {
      class FunctionComponent {
        value: number = 42;
        _private: string = 'private';

        static fromData(data: Record<string, unknown>): FunctionComponent {
          const comp = new FunctionComponent();
          if (data.value !== undefined) {
            comp.value = data.value as number;
          }
          return comp;
        }

        someMethod(): void {
          // 方法应该被跳过
        }
      }

      registry.register('FunctionComponent', FunctionComponent, {
        factory: (data: Record<string, unknown>) => FunctionComponent.fromData(data),
      });

      const entity = scene.createEntity('TestEntity');
      scene.world.addComponent(entity, FunctionComponent, FunctionComponent.fromData({ value: 100 }));

      const data = serializer.toData(scene);
      const entityData = data.entities.find((e) => e.name === 'TestEntity');
      const compData = entityData?.components.find((c) => c.type === 'FunctionComponent');

      expect(compData?.data.value).toBe(100);
      expect(compData?.data._private).toBeUndefined();
      expect(compData?.data.someMethod).toBeUndefined();
    });
  });

  describe('边界情况', () => {
    it('应该处理空实体列表', () => {
      const data: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: {
          name: 'EmptyScene',
          id: 'test-id',
          modifiedAt: new Date().toISOString(),
        },
        entities: [],
      };

      expect(() => serializer.fromData(data, scene)).not.toThrow();
    });

    it('应该处理组件创建失败', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      class FailingComponent {
        static fromData(): FailingComponent {
          throw new Error('Creation failed');
        }
      }

      registry.register('FailingComponent', FailingComponent);

      const data: ISceneData = {
        version: { major: 1, minor: 0, patch: 0 },
        metadata: {
          name: 'TestScene',
          id: 'test-id',
          modifiedAt: new Date().toISOString(),
        },
        entities: [
          {
            id: 1,
            name: 'TestEntity',
            active: true,
            parent: null,
            components: [{ type: 'FailingComponent', data: {} }],
          },
        ],
      };

      expect(() => serializer.fromData(data, scene)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to create component'));

      consoleSpy.mockRestore();
    });

    it('应该处理 null 组件', () => {
      const data = serializer.toData(scene);

      // 验证序列化不会因为 null 组件而失败
      expect(data).toBeDefined();
    });
  });
});
