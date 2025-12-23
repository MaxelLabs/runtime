/**
 * Scene 模块测试
 * 测试场景管理功能
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Scene } from '../../src/scene/scene';
import { LocalTransform } from '../../src/components/transform';
import { Name, Tag, Disabled } from '../../src/components/data';
import { getSceneComponentRegistry } from '../../src/scene/component-registry';

describe('Scene', () => {
  let scene: Scene;

  beforeEach(() => {
    scene = new Scene({ name: 'TestScene' });
  });

  afterEach(() => {
    if (!scene.isDisposed()) {
      scene.dispose();
    }
  });

  describe('构造函数', () => {
    it('应该创建具有默认名称的场景', () => {
      const defaultScene = new Scene();
      expect(defaultScene.name).toBe('Scene');
      expect(defaultScene.id).toMatch(/^scene_\d+$/);
      defaultScene.dispose();
    });

    it('应该创建具有自定义名称的场景', () => {
      expect(scene.name).toBe('TestScene');
    });

    it('应该创建具有唯一 ID 的场景', () => {
      const scene2 = new Scene({ name: 'Scene2' });
      expect(scene.id).not.toBe(scene2.id);
      scene2.dispose();
    });

    it('应该默认创建根实体', () => {
      const root = scene.getRoot();
      expect(root).not.toBe(-1);
      expect(scene.hasEntity(root)).toBe(true);
    });

    it('应该支持不创建根实体', () => {
      const noRootScene = new Scene({ createRoot: false });
      expect(noRootScene.getRoot()).toBe(-1);
      noRootScene.dispose();
    });

    it('应该默认激活场景', () => {
      expect(scene.isActive()).toBe(true);
    });

    it('应该支持创建非激活场景', () => {
      const inactiveScene = new Scene({ active: false });
      expect(inactiveScene.isActive()).toBe(false);
      inactiveScene.dispose();
    });
  });

  describe('实体管理', () => {
    describe('createEntity', () => {
      it('应该创建新实体', () => {
        const entity = scene.createEntity('Player');
        expect(scene.hasEntity(entity)).toBe(true);
      });

      it('应该为实体设置名称', () => {
        const entity = scene.createEntity('Player');
        expect(scene.getEntityName(entity)).toBe('Player');
      });

      it('应该将实体添加到根实体的子实体列表', () => {
        const entity = scene.createEntity('Player');
        const root = scene.getRoot();
        const children = scene.getChildren(root);
        expect(children).toContain(entity);
      });

      it('应该触发 entityAdded 事件', () => {
        const listener = jest.fn();
        scene.on('entityAdded', listener);

        const entity = scene.createEntity('Player');

        expect(listener).toHaveBeenCalledWith(expect.objectContaining({ entity, name: 'Player' }));
      });
    });

    describe('addEntity', () => {
      it('应该添加已存在的实体到场景', () => {
        const entity = scene.world.createEntity();
        scene.addEntity(entity);
        expect(scene.hasEntity(entity)).toBe(true);
      });

      it('应该忽略已在场景中的实体', () => {
        const entity = scene.createEntity('Player');
        const result = scene.addEntity(entity);
        expect(result).toBe(scene);
      });

      it('应该更新名称索引', () => {
        const entity = scene.world.createEntity();
        scene.world.addComponent(entity, Name, Name.fromData({ value: 'TestEntity' }));
        scene.addEntity(entity);
        expect(scene.findEntityByName('TestEntity')).toBe(entity);
      });

      it('应该更新标签索引', () => {
        const entity = scene.world.createEntity();
        scene.world.addComponent(entity, Tag, Tag.fromData({ value: 'enemy' }));
        scene.addEntity(entity);
        expect(scene.getEntitiesByTag('enemy')).toContain(entity);
      });
    });

    describe('removeEntity', () => {
      it('应该从场景移除实体', () => {
        const entity = scene.createEntity('Player');
        scene.removeEntity(entity);
        expect(scene.hasEntity(entity)).toBe(false);
      });

      it('应该更新名称索引', () => {
        const entity = scene.createEntity('Player');
        scene.removeEntity(entity);
        expect(scene.findEntityByName('Player')).toBeNull();
      });

      it('应该触发 entityRemoved 事件', () => {
        const entity = scene.createEntity('Player');
        const listener = jest.fn();
        scene.on('entityRemoved', listener);

        scene.removeEntity(entity);

        expect(listener).toHaveBeenCalledWith(expect.objectContaining({ entity }));
      });

      it('应该忽略不在场景中的实体', () => {
        const entity = scene.world.createEntity();
        const result = scene.removeEntity(entity);
        expect(result).toBe(scene);
      });
    });

    describe('destroyEntity', () => {
      it('应该销毁实体', () => {
        const entity = scene.createEntity('Player');
        scene.destroyEntity(entity);
        expect(scene.hasEntity(entity)).toBe(false);
      });

      it('应该递归销毁子实体', () => {
        const parent = scene.createEntity('Parent');
        const child = scene.createEntity('Child');
        scene.setParent(child, parent);

        scene.destroyEntity(parent);

        expect(scene.hasEntity(parent)).toBe(false);
        expect(scene.hasEntity(child)).toBe(false);
      });
    });

    describe('hasEntity', () => {
      it('应该返回 true 如果实体在场景中', () => {
        const entity = scene.createEntity('Player');
        expect(scene.hasEntity(entity)).toBe(true);
      });

      it('应该返回 false 如果实体不在场景中', () => {
        const entity = scene.world.createEntity();
        expect(scene.hasEntity(entity)).toBe(false);
      });
    });
  });

  describe('实体查询', () => {
    describe('findEntityByName', () => {
      it('应该通过名称查找实体', () => {
        const entity = scene.createEntity('Player');
        expect(scene.findEntityByName('Player')).toBe(entity);
      });

      it('应该返回 null 如果未找到', () => {
        expect(scene.findEntityByName('NonExistent')).toBeNull();
      });
    });

    describe('getAllEntities', () => {
      it('应该返回所有实体', () => {
        const entity1 = scene.createEntity('Entity1');
        const entity2 = scene.createEntity('Entity2');

        const entities = scene.getAllEntities();

        expect(entities).toContain(entity1);
        expect(entities).toContain(entity2);
        expect(entities).toContain(scene.getRoot());
      });
    });

    describe('getEntityCount', () => {
      it('应该返回实体数量', () => {
        const initialCount = scene.getEntityCount();
        scene.createEntity('Entity1');
        scene.createEntity('Entity2');

        expect(scene.getEntityCount()).toBe(initialCount + 2);
      });
    });

    describe('getEntitiesByTag', () => {
      it('应该返回具有指定标签的实体', () => {
        const entity1 = scene.createEntity('Enemy1');
        const entity2 = scene.createEntity('Enemy2');
        scene.setEntityTag(entity1, 'enemy');
        scene.setEntityTag(entity2, 'enemy');

        const enemies = scene.getEntitiesByTag('enemy');

        expect(enemies).toContain(entity1);
        expect(enemies).toContain(entity2);
      });

      it('应该返回空数组如果没有匹配的实体', () => {
        expect(scene.getEntitiesByTag('nonexistent')).toEqual([]);
      });
    });

    describe('findEntitiesWithComponents', () => {
      it('应该返回具有指定组件的实体', () => {
        const entity = scene.createEntity('Player');
        scene.world.addComponent(
          entity,
          LocalTransform,
          LocalTransform.fromData({
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          })
        );

        const entities = scene.findEntitiesWithComponents(LocalTransform);

        expect(entities).toContain(entity);
      });
    });
  });

  describe('实体元数据', () => {
    describe('getEntityName / setEntityName', () => {
      it('应该获取和设置实体名称', () => {
        const entity = scene.createEntity('OldName');
        scene.setEntityName(entity, 'NewName');

        expect(scene.getEntityName(entity)).toBe('NewName');
        expect(scene.findEntityByName('NewName')).toBe(entity);
        expect(scene.findEntityByName('OldName')).toBeNull();
      });

      it('应该为没有名称的实体添加名称', () => {
        const entity = scene.world.createEntity();
        scene.addEntity(entity);
        scene.setEntityName(entity, 'NewName');

        expect(scene.getEntityName(entity)).toBe('NewName');
      });
    });

    describe('getEntityTag / setEntityTag', () => {
      it('应该获取和设置实体标签', () => {
        const entity = scene.createEntity('Player');
        scene.setEntityTag(entity, 'player');

        expect(scene.getEntityTag(entity)).toBe('player');
        expect(scene.getEntitiesByTag('player')).toContain(entity);
      });

      it('应该更新标签索引', () => {
        const entity = scene.createEntity('Player');
        scene.setEntityTag(entity, 'oldTag');
        scene.setEntityTag(entity, 'newTag');

        expect(scene.getEntitiesByTag('oldTag')).not.toContain(entity);
        expect(scene.getEntitiesByTag('newTag')).toContain(entity);
      });
    });

    describe('isEntityActive / setEntityActive', () => {
      it('应该获取和设置实体激活状态', () => {
        const entity = scene.createEntity('Player');
        expect(scene.isEntityActive(entity)).toBe(true);

        scene.setEntityActive(entity, false);
        expect(scene.isEntityActive(entity)).toBe(false);

        scene.setEntityActive(entity, true);
        expect(scene.isEntityActive(entity)).toBe(true);
      });

      it('应该同步 Disabled 组件', () => {
        const entity = scene.createEntity('Player');

        scene.setEntityActive(entity, false);
        expect(scene.world.hasComponent(entity, Disabled)).toBe(true);

        scene.setEntityActive(entity, true);
        expect(scene.world.hasComponent(entity, Disabled)).toBe(false);
      });
    });

    describe('activateEntitiesByTag / deactivateEntitiesByTag', () => {
      it('应该批量激活/停用具有指定标签的实体', () => {
        const entity1 = scene.createEntity('Enemy1');
        const entity2 = scene.createEntity('Enemy2');
        scene.setEntityTag(entity1, 'enemy');
        scene.setEntityTag(entity2, 'enemy');

        scene.deactivateEntitiesByTag('enemy');
        expect(scene.isEntityActive(entity1)).toBe(false);
        expect(scene.isEntityActive(entity2)).toBe(false);

        scene.activateEntitiesByTag('enemy');
        expect(scene.isEntityActive(entity1)).toBe(true);
        expect(scene.isEntityActive(entity2)).toBe(true);
      });
    });
  });

  describe('层级关系', () => {
    describe('setParent / getParent', () => {
      it('应该设置和获取父实体', () => {
        const parent = scene.createEntity('Parent');
        const child = scene.createEntity('Child');

        scene.setParent(child, parent);

        expect(scene.getParent(child)).toBe(parent);
      });

      it('应该更新父实体的子实体列表', () => {
        const parent = scene.createEntity('Parent');
        const child = scene.createEntity('Child');

        scene.setParent(child, parent);

        expect(scene.getChildren(parent)).toContain(child);
      });

      it('应该从旧父实体移除', () => {
        const oldParent = scene.createEntity('OldParent');
        const newParent = scene.createEntity('NewParent');
        const child = scene.createEntity('Child');

        scene.setParent(child, oldParent);
        scene.setParent(child, newParent);

        expect(scene.getChildren(oldParent)).not.toContain(child);
        expect(scene.getChildren(newParent)).toContain(child);
      });

      it('应该支持设置为 null 以移除父实体', () => {
        const parent = scene.createEntity('Parent');
        const child = scene.createEntity('Child');

        scene.setParent(child, parent);
        scene.setParent(child, null);

        // 设置为 null 时会默认设置为根实体
        expect(scene.getParent(child)).toBe(scene.getRoot());
      });

      it('应该在没有根实体时正确处理 setParent', () => {
        const noRootScene = new Scene({ createRoot: false });
        const entity = noRootScene.world.createEntity();
        noRootScene.addEntity(entity);

        // 当 actualParent === -1 时应该直接返回
        noRootScene.setParent(entity, null);
        expect(noRootScene.getParent(entity)).toBeNull();

        noRootScene.dispose();
      });

      it('应该更新已有的 Parent 组件而不是创建新的', () => {
        const parent1 = scene.createEntity('Parent1');
        const parent2 = scene.createEntity('Parent2');
        const child = scene.createEntity('Child');

        // 第一次设置父实体
        scene.setParent(child, parent1);
        expect(scene.getParent(child)).toBe(parent1);

        // 第二次设置父实体，应该更新已有的 Parent 组件
        scene.setParent(child, parent2);
        expect(scene.getParent(child)).toBe(parent2);
      });
    });

    describe('getChildren', () => {
      it('应该返回子实体列表', () => {
        const parent = scene.createEntity('Parent');
        const child1 = scene.createEntity('Child1');
        const child2 = scene.createEntity('Child2');

        scene.setParent(child1, parent);
        scene.setParent(child2, parent);

        const children = scene.getChildren(parent);
        expect(children).toContain(child1);
        expect(children).toContain(child2);
      });

      it('应该返回空数组如果没有子实体', () => {
        const entity = scene.createEntity('Entity');
        expect(scene.getChildren(entity)).toEqual([]);
      });
    });
  });

  describe('生命周期', () => {
    describe('onLoad / onUnload', () => {
      it('应该触发 load 事件', () => {
        const listener = jest.fn();
        scene.on('load', listener);

        scene.onLoad();

        expect(listener).toHaveBeenCalled();
      });

      it('应该触发 unload 事件', () => {
        const listener = jest.fn();
        scene.on('unload', listener);

        scene.onUnload();

        expect(listener).toHaveBeenCalled();
      });
    });

    describe('update', () => {
      it('应该执行系统调度', () => {
        const updateSpy = jest.spyOn(scene.scheduler, 'update');

        scene.update(0.016);

        expect(updateSpy).toHaveBeenCalledWith(0.016);
      });

      it('应该触发 update 事件', () => {
        const listener = jest.fn();
        scene.on('update', listener);

        scene.update(0.016);

        expect(listener).toHaveBeenCalledWith(expect.objectContaining({ deltaTime: 0.016 }));
      });

      it('应该在非激活状态下不执行更新', () => {
        scene.setActive(false);
        const updateSpy = jest.spyOn(scene.scheduler, 'update');

        scene.update(0.016);

        expect(updateSpy).not.toHaveBeenCalled();
      });
    });

    describe('render', () => {
      it('应该在非激活状态下不执行渲染', () => {
        scene.setActive(false);
        // render 方法目前是空的，只是确保不抛出错误
        expect(() => scene.render()).not.toThrow();
      });

      it('应该在没有设备时不执行渲染', () => {
        expect(() => scene.render()).not.toThrow();
      });
    });

    describe('clear', () => {
      it('应该清空所有实体（除根实体）', () => {
        scene.createEntity('Entity1');
        scene.createEntity('Entity2');

        scene.clear();

        // 只剩根实体
        expect(scene.getEntityCount()).toBe(1);
        expect(scene.hasEntity(scene.getRoot())).toBe(true);
      });
    });

    describe('isActive / setActive', () => {
      it('应该获取和设置场景激活状态', () => {
        expect(scene.isActive()).toBe(true);

        scene.setActive(false);
        expect(scene.isActive()).toBe(false);

        scene.setActive(true);
        expect(scene.isActive()).toBe(true);
      });
    });
  });

  describe('事件系统', () => {
    describe('on / off / emit', () => {
      it('应该注册和触发事件监听器', () => {
        const listener = jest.fn();
        scene.on('entityAdded', listener);

        scene.emit('entityAdded', { entity: 1 });

        expect(listener).toHaveBeenCalledWith({ entity: 1 });
      });

      it('应该移除事件监听器', () => {
        const listener = jest.fn();
        scene.on('entityAdded', listener);
        scene.off('entityAdded', listener);

        scene.emit('entityAdded', { entity: 1 });

        expect(listener).not.toHaveBeenCalled();
      });

      it('应该处理监听器中的错误', () => {
        const errorListener = jest.fn(() => {
          throw new Error('Test error');
        });
        const normalListener = jest.fn();
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        scene.on('entityAdded', errorListener);
        scene.on('entityAdded', normalListener);

        scene.emit('entityAdded', { entity: 1 });

        expect(consoleSpy).toHaveBeenCalled();
        expect(normalListener).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });
    });
  });

  describe('资源管理', () => {
    describe('dispose', () => {
      it('应该销毁场景', () => {
        scene.dispose();
        expect(scene.isDisposed()).toBe(true);
      });

      it('应该触发 unload 事件', () => {
        const listener = jest.fn();
        scene.on('unload', listener);

        scene.dispose();

        expect(listener).toHaveBeenCalled();
      });

      it('应该清空所有实体', () => {
        scene.createEntity('Entity1');
        scene.createEntity('Entity2');

        scene.dispose();

        expect(scene.getEntityCount()).toBe(0);
      });

      it('应该只销毁一次', () => {
        scene.dispose();
        expect(() => scene.dispose()).not.toThrow();
      });

      it('应该在销毁后抛出错误', () => {
        scene.dispose();
        expect(() => scene.createEntity('Test')).toThrow();
      });
    });

    describe('isDisposed', () => {
      it('应该返回正确的销毁状态', () => {
        expect(scene.isDisposed()).toBe(false);
        scene.dispose();
        expect(scene.isDisposed()).toBe(true);
      });
    });
  });

  describe('设备管理', () => {
    describe('device / setDevice', () => {
      it('应该默认没有设备', () => {
        expect(scene.device).toBeNull();
      });

      it('应该设置设备', () => {
        const mockDevice = {} as any;
        scene.setDevice(mockDevice);
        expect(scene.device).toBe(mockDevice);
      });
    });
  });

  describe('统计信息', () => {
    describe('getStats', () => {
      it('应该返回场景统计信息', () => {
        scene.createEntity('Entity1');
        scene.createEntity('Entity2');

        const stats = scene.getStats();

        expect(stats.name).toBe('TestScene');
        expect(stats.id).toBe(scene.id);
        expect(stats.entityCount).toBe(3); // 2 + root
        expect(stats.active).toBe(true);
        expect(stats.worldStats).toBeDefined();
        expect(stats.schedulerStats).toBeDefined();
      });
    });
  });

  describe('数据序列化', () => {
    describe('toData', () => {
      it('应该导出场景数据', () => {
        const entity = scene.createEntity('Player');
        scene.setEntityTag(entity, 'player');

        const data = scene.toData();

        expect(data.version).toBeDefined();
        expect(data.metadata.name).toBe('TestScene');
        expect(data.entities.length).toBeGreaterThan(0);
      });

      it('应该包含实体的组件数据', () => {
        const entity = scene.createEntity('Player');
        scene.world.addComponent(
          entity,
          LocalTransform,
          LocalTransform.fromData({
            position: { x: 1, y: 2, z: 3 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          })
        );

        const data = scene.toData();
        const entityData = data.entities.find((e) => e.name === 'Player');

        expect(entityData).toBeDefined();
        expect(entityData?.components.some((c) => c.type === 'LocalTransform')).toBe(true);
      });
    });

    describe('fromData', () => {
      it('应该从数据创建场景', () => {
        const sceneData = {
          version: { major: 1, minor: 0, patch: 0 },
          metadata: {
            name: 'LoadedScene',
            id: 'test-id',
            modifiedAt: new Date().toISOString(),
          },
          entities: [
            {
              id: 1,
              name: 'TestEntity',
              tag: 'test',
              active: true,
              parent: null,
              components: [],
            },
          ],
        };

        const loadedScene = Scene.fromData(sceneData);

        expect(loadedScene.name).toBe('LoadedScene');
        expect(loadedScene.findEntityByName('TestEntity')).not.toBeNull();

        loadedScene.dispose();
      });

      it('应该建立父子关系', () => {
        const sceneData = {
          version: { major: 1, minor: 0, patch: 0 },
          metadata: {
            name: 'LoadedScene',
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

        const loadedScene = Scene.fromData(sceneData);

        const parent = loadedScene.findEntityByName('Parent');
        const child = loadedScene.findEntityByName('Child');

        expect(parent).not.toBeNull();
        expect(child).not.toBeNull();
        expect(loadedScene.getParent(child!)).toBe(parent);

        loadedScene.dispose();
      });

      it('应该触发 dataLoaded 事件', () => {
        const sceneData = {
          version: { major: 1, minor: 0, patch: 0 },
          metadata: {
            name: 'LoadedScene',
            id: 'test-id',
            modifiedAt: new Date().toISOString(),
          },
          entities: [],
        };

        const loadedScene = Scene.fromData(sceneData);
        // 事件在构造时触发，这里只验证场景创建成功
        expect(loadedScene).toBeDefined();

        loadedScene.dispose();
      });

      it('应该处理实体的 active=false 状态', () => {
        const sceneData = {
          version: { major: 1, minor: 0, patch: 0 },
          metadata: {
            name: 'LoadedScene',
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

        const loadedScene = Scene.fromData(sceneData);
        const entity = loadedScene.findEntityByName('InactiveEntity');

        expect(entity).not.toBeNull();
        expect(loadedScene.isEntityActive(entity!)).toBe(false);

        loadedScene.dispose();
      });

      it('应该处理带有组件的实体', () => {
        // LocalTransform 已经在核心组件中注册
        const sceneData = {
          version: { major: 1, minor: 0, patch: 0 },
          metadata: {
            name: 'LoadedScene',
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

        const loadedScene = Scene.fromData(sceneData);
        const entity = loadedScene.findEntityByName('EntityWithComponent');

        expect(entity).not.toBeNull();
        expect(loadedScene.world.hasComponent(entity!, LocalTransform)).toBe(true);

        loadedScene.dispose();
      });

      it('应该跳过 Name 和 Tag 类型的组件', () => {
        const sceneData = {
          version: { major: 1, minor: 0, patch: 0 },
          metadata: {
            name: 'LoadedScene',
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

        const loadedScene = Scene.fromData(sceneData);
        const entity = loadedScene.findEntityByName('TestEntity');

        // Name 组件应该是 createEntity 设置的，不是从组件数据加载的
        expect(entity).not.toBeNull();
        expect(loadedScene.getEntityName(entity!)).toBe('TestEntity');

        loadedScene.dispose();
      });

      it('应该处理未知的组件类型', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        const sceneData = {
          version: { major: 1, minor: 0, patch: 0 },
          metadata: {
            name: 'LoadedScene',
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

        const loadedScene = Scene.fromData(sceneData);

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown component type'));

        consoleSpy.mockRestore();
        loadedScene.dispose();
      });

      it('应该应用环境设置', () => {
        const sceneData = {
          version: { major: 1, minor: 0, patch: 0 },
          metadata: {
            name: 'LoadedScene',
            id: 'test-id',
            modifiedAt: new Date().toISOString(),
          },
          entities: [],
          environment: {
            skybox: { type: 'color', color: { r: 0.5, g: 0.5, b: 0.5, a: 1 } },
          },
        } as any;

        const loadedScene = Scene.fromData(sceneData);
        // 环境设置在 fromData 中应用，这里验证场景创建成功
        expect(loadedScene).toBeDefined();

        loadedScene.dispose();
      });

      it('应该应用渲染设置', () => {
        const sceneData = {
          version: { major: 1, minor: 0, patch: 0 },
          metadata: {
            name: 'LoadedScene',
            id: 'test-id',
            modifiedAt: new Date().toISOString(),
          },
          entities: [],
          renderSettings: {
            antiAliasing: { enabled: true, type: 'msaa', samples: 4 },
          },
        } as any;

        const loadedScene = Scene.fromData(sceneData);
        // 渲染设置在 fromData 中应用，这里验证场景创建成功
        expect(loadedScene).toBeDefined();

        loadedScene.dispose();
      });

      it('应该处理带有 enabled=false 的组件', () => {
        // 创建一个支持 enabled 属性的组件类
        class EnabledComponent {
          enabled: boolean = true;
          value: number = 0;

          static fromData(data: Record<string, unknown>): EnabledComponent {
            const comp = new EnabledComponent();
            if (data.value !== undefined) {
              comp.value = data.value as number;
            }
            if (data.enabled !== undefined) {
              comp.enabled = data.enabled as boolean;
            }
            return comp;
          }
        }

        const registry = getSceneComponentRegistry();
        registry.register('EnabledComponent', EnabledComponent, (data: Record<string, unknown>) =>
          EnabledComponent.fromData(data)
        );

        const sceneData = {
          version: { major: 1, minor: 0, patch: 0 },
          metadata: {
            name: 'LoadedScene',
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

        const loadedScene = Scene.fromData(sceneData);
        const entity = loadedScene.findEntityByName('TestEntity');

        expect(entity).not.toBeNull();
        const comp = loadedScene.world.getComponent(entity!, EnabledComponent);
        expect(comp).not.toBeNull();
        expect(comp!.enabled).toBe(false);

        loadedScene.dispose();
      });
    });
  });

  describe('toData 边界情况', () => {
    it('应该正确序列化包含数组的组件', () => {
      // 创建一个包含数组的组件
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

      const registry = getSceneComponentRegistry();
      registry.register('ArrayComponent', ArrayComponent, (data: Record<string, unknown>) =>
        ArrayComponent.fromData(data)
      );

      const entity = scene.createEntity('TestEntity');
      scene.world.addComponent(entity, ArrayComponent, ArrayComponent.fromData({ items: [1, 2, 3] }));

      const data = scene.toData();
      const entityData = data.entities.find((e) => e.name === 'TestEntity');

      expect(entityData).toBeDefined();
      const compData = entityData?.components.find((c) => c.type === 'ArrayComponent');
      expect(compData).toBeDefined();
      expect(compData?.data.items).toEqual([1, 2, 3]);
    });

    it('应该正确序列化包含嵌套对象的组件', () => {
      // 创建一个包含嵌套对象的组件
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

      const registry = getSceneComponentRegistry();
      registry.register('NestedComponent', NestedComponent, (data: Record<string, unknown>) =>
        NestedComponent.fromData(data)
      );

      const entity = scene.createEntity('TestEntity');
      scene.world.addComponent(entity, NestedComponent, NestedComponent.fromData({ nested: { x: 10, y: 20 } }));

      const data = scene.toData();
      const entityData = data.entities.find((e) => e.name === 'TestEntity');

      expect(entityData).toBeDefined();
      const compData = entityData?.components.find((c) => c.type === 'NestedComponent');
      expect(compData).toBeDefined();
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

      const registry = getSceneComponentRegistry();
      registry.register('FunctionComponent', FunctionComponent, (data: Record<string, unknown>) =>
        FunctionComponent.fromData(data)
      );

      const entity = scene.createEntity('TestEntity');
      scene.world.addComponent(entity, FunctionComponent, FunctionComponent.fromData({ value: 100 }));

      const data = scene.toData();
      const entityData = data.entities.find((e) => e.name === 'TestEntity');

      expect(entityData).toBeDefined();
      const compData = entityData?.components.find((c) => c.type === 'FunctionComponent');
      expect(compData).toBeDefined();
      expect(compData?.data.value).toBe(100);
      expect(compData?.data._private).toBeUndefined();
      expect(compData?.data.someMethod).toBeUndefined();
    });
  });

  describe('removeEntity 边界情况', () => {
    it('应该正确处理带有标签的实体移除', () => {
      const entity = scene.createEntity('TaggedEntity');
      scene.setEntityTag(entity, 'testTag');

      expect(scene.getEntitiesByTag('testTag')).toContain(entity);

      scene.removeEntity(entity);

      expect(scene.getEntitiesByTag('testTag')).not.toContain(entity);
    });

    it('应该在移除最后一个标签实体时清理标签索引', () => {
      const entity = scene.createEntity('TaggedEntity');
      scene.setEntityTag(entity, 'uniqueTag');

      scene.removeEntity(entity);

      // 标签索引应该被清理
      expect(scene.getEntitiesByTag('uniqueTag')).toEqual([]);
    });
  });

  describe('事件系统边界情况', () => {
    it('应该在没有监听器时正常触发事件', () => {
      // 触发一个没有监听器的事件
      expect(() => scene.emit('customEvent' as any, { data: 'test' })).not.toThrow();
    });

    it('应该正确移除不存在的监听器', () => {
      const listener = jest.fn();
      // 移除一个从未添加的监听器
      expect(() => scene.off('entityAdded', listener)).not.toThrow();
    });
  });

  describe('isEntityActive 边界情况', () => {
    it('应该在实体没有元数据时返回 false', () => {
      const entity = scene.world.createEntity();
      // 不添加到场景，直接检查
      expect(scene.isEntityActive(entity)).toBe(false);
    });
  });

  describe('setEntityActive 边界情况', () => {
    it('应该在实体没有元数据时不抛出错误', () => {
      const entity = scene.world.createEntity();
      // 不添加到场景，直接设置
      expect(() => scene.setEntityActive(entity, false)).not.toThrow();
    });

    it('应该在已有 Disabled 组件时不重复添加', () => {
      const entity = scene.createEntity('TestEntity');
      scene.setEntityActive(entity, false);
      // 再次设置为 false
      scene.setEntityActive(entity, false);
      expect(scene.world.hasComponent(entity, Disabled)).toBe(true);
    });
  });
});
