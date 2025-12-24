/**
 * SceneEntityManager 模块测试
 * 测试场景实体管理器功能
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SceneEntityManager } from '../../src/scene/entity/entity-manager';
import { SceneEntityMetadata } from '../../src/scene/entity/scene-entity-metadata';
import { World } from '../../src/ecs';
import { Name, Tag, Disabled } from '../../src/components/data';

describe('SceneEntityManager', () => {
  let world: World;
  let manager: SceneEntityManager;
  const sceneId = 'test_scene';

  beforeEach(() => {
    world = new World();
    manager = new SceneEntityManager(world, sceneId);
  });

  afterEach(() => {
    manager.clear();
  });

  describe('createEntity', () => {
    it('应该创建新实体', () => {
      const entity = manager.createEntity('Player');

      expect(manager.hasEntity(entity)).toBe(true);
    });

    it('应该为实体添加 SceneEntityMetadata 组件', () => {
      const entity = manager.createEntity('Player');

      expect(world.hasComponent(entity, SceneEntityMetadata)).toBe(true);
      const metadata = world.getComponent(entity, SceneEntityMetadata);
      expect(metadata?.sceneId).toBe(sceneId);
      expect(metadata?.active).toBe(true);
    });

    it('应该为实体添加 Name 组件', () => {
      const entity = manager.createEntity('Player');

      expect(world.hasComponent(entity, Name)).toBe(true);
      const name = world.getComponent(entity, Name);
      expect(name?.value).toBe('Player');
    });

    it('应该更新名称索引', () => {
      const entity = manager.createEntity('Player');

      expect(manager.findEntityByName('Player')).toBe(entity);
    });

    it('应该创建没有名称的实体', () => {
      const entity = manager.createEntity();

      expect(manager.hasEntity(entity)).toBe(true);
      expect(world.hasComponent(entity, Name)).toBe(false);
    });

    it('应该增加实体计数', () => {
      expect(manager.getEntityCount()).toBe(0);

      manager.createEntity('Entity1');
      expect(manager.getEntityCount()).toBe(1);

      manager.createEntity('Entity2');
      expect(manager.getEntityCount()).toBe(2);
    });
  });

  describe('addEntity', () => {
    it('应该添加已存在的实体到场景', () => {
      const entity = world.createEntity();
      manager.addEntity(entity);

      expect(manager.hasEntity(entity)).toBe(true);
    });

    it('应该为实体添加 SceneEntityMetadata', () => {
      const entity = world.createEntity();
      manager.addEntity(entity);

      expect(world.hasComponent(entity, SceneEntityMetadata)).toBe(true);
    });

    it('应该忽略已在场景中的实体', () => {
      const entity = manager.createEntity('Player');
      const countBefore = manager.getEntityCount();

      manager.addEntity(entity);

      expect(manager.getEntityCount()).toBe(countBefore);
    });

    it('应该更新名称索引', () => {
      const entity = world.createEntity();
      world.addComponent(entity, Name, Name.fromData({ value: 'TestEntity' }));
      manager.addEntity(entity);

      expect(manager.findEntityByName('TestEntity')).toBe(entity);
    });

    it('应该更新标签索引', () => {
      const entity = world.createEntity();
      world.addComponent(entity, Tag, Tag.fromData({ value: 'enemy' }));
      manager.addEntity(entity);

      expect(manager.findEntitiesByTag('enemy')).toContain(entity);
    });

    it('应该不覆盖已有的 SceneEntityMetadata', () => {
      const entity = world.createEntity();
      world.addComponent(
        entity,
        SceneEntityMetadata,
        SceneEntityMetadata.fromData({ sceneId: 'other_scene', active: false })
      );
      manager.addEntity(entity);

      const metadata = world.getComponent(entity, SceneEntityMetadata);
      expect(metadata?.sceneId).toBe('other_scene');
    });
  });

  describe('removeEntity', () => {
    it('应该从场景移除实体', () => {
      const entity = manager.createEntity('Player');
      manager.removeEntity(entity);

      expect(manager.hasEntity(entity)).toBe(false);
    });

    it('应该更新名称索引', () => {
      const entity = manager.createEntity('Player');
      manager.removeEntity(entity);

      expect(manager.findEntityByName('Player')).toBeNull();
    });

    it('应该更新标签索引', () => {
      const entity = manager.createEntity('Player');
      manager.setEntityTag(entity, 'player');
      manager.removeEntity(entity);

      expect(manager.findEntitiesByTag('player')).not.toContain(entity);
    });

    it('应该移除 SceneEntityMetadata 组件', () => {
      const entity = manager.createEntity('Player');
      manager.removeEntity(entity);

      expect(world.hasComponent(entity, SceneEntityMetadata)).toBe(false);
    });

    it('应该忽略不在场景中的实体', () => {
      const entity = world.createEntity();
      const countBefore = manager.getEntityCount();

      manager.removeEntity(entity);

      expect(manager.getEntityCount()).toBe(countBefore);
    });
  });

  describe('destroyEntity', () => {
    it('应该销毁实体', () => {
      const entity = manager.createEntity('Player');
      manager.destroyEntity(entity);

      expect(manager.hasEntity(entity)).toBe(false);
    });

    it('应该从 World 中销毁实体', () => {
      const entity = manager.createEntity('Player');
      manager.destroyEntity(entity);

      // 实体应该从 World 中被销毁
      expect(world.hasComponent(entity, Name)).toBe(false);
    });
  });

  describe('hasEntity', () => {
    it('应该返回 true 如果实体在场景中', () => {
      const entity = manager.createEntity('Player');

      expect(manager.hasEntity(entity)).toBe(true);
    });

    it('应该返回 false 如果实体不在场景中', () => {
      const entity = world.createEntity();

      expect(manager.hasEntity(entity)).toBe(false);
    });
  });

  describe('findEntityByName', () => {
    it('应该通过名称查找实体', () => {
      const entity = manager.createEntity('Player');

      expect(manager.findEntityByName('Player')).toBe(entity);
    });

    it('应该返回 null 如果未找到', () => {
      expect(manager.findEntityByName('NonExistent')).toBeNull();
    });

    it('应该处理多个同名实体（返回最后一个）', () => {
      manager.createEntity('Player');
      const entity2 = manager.createEntity('Player');

      expect(manager.findEntityByName('Player')).toBe(entity2);
    });
  });

  describe('findEntitiesByTag', () => {
    it('应该返回具有指定标签的实体', () => {
      const entity1 = manager.createEntity('Enemy1');
      const entity2 = manager.createEntity('Enemy2');
      manager.setEntityTag(entity1, 'enemy');
      manager.setEntityTag(entity2, 'enemy');

      const enemies = manager.findEntitiesByTag('enemy');

      expect(enemies).toContain(entity1);
      expect(enemies).toContain(entity2);
    });

    it('应该返回空数组如果没有匹配的实体', () => {
      expect(manager.findEntitiesByTag('nonexistent')).toEqual([]);
    });
  });

  describe('getAllEntities', () => {
    it('应该返回所有实体', () => {
      const entity1 = manager.createEntity('Entity1');
      const entity2 = manager.createEntity('Entity2');

      const entities = manager.getAllEntities();

      expect(entities).toContain(entity1);
      expect(entities).toContain(entity2);
      expect(entities.length).toBe(2);
    });

    it('应该返回空数组如果没有实体', () => {
      expect(manager.getAllEntities()).toEqual([]);
    });
  });

  describe('getEntityCount', () => {
    it('应该返回实体数量', () => {
      expect(manager.getEntityCount()).toBe(0);

      manager.createEntity('Entity1');
      expect(manager.getEntityCount()).toBe(1);

      manager.createEntity('Entity2');
      expect(manager.getEntityCount()).toBe(2);
    });
  });

  describe('getEntityName / setEntityName', () => {
    it('应该获取实体名称', () => {
      const entity = manager.createEntity('Player');

      expect(manager.getEntityName(entity)).toBe('Player');
    });

    it('应该返回 null 如果实体没有名称', () => {
      const entity = manager.createEntity();

      expect(manager.getEntityName(entity)).toBeNull();
    });

    it('应该设置实体名称', () => {
      const entity = manager.createEntity('OldName');
      manager.setEntityName(entity, 'NewName');

      expect(manager.getEntityName(entity)).toBe('NewName');
    });

    it('应该更新名称索引', () => {
      const entity = manager.createEntity('OldName');
      manager.setEntityName(entity, 'NewName');

      expect(manager.findEntityByName('OldName')).toBeNull();
      expect(manager.findEntityByName('NewName')).toBe(entity);
    });

    it('应该为没有名称的实体添加名称', () => {
      const entity = manager.createEntity();
      manager.setEntityName(entity, 'NewName');

      expect(manager.getEntityName(entity)).toBe('NewName');
      expect(world.hasComponent(entity, Name)).toBe(true);
    });
  });

  describe('getEntityTag / setEntityTag', () => {
    it('应该获取实体标签', () => {
      const entity = manager.createEntity('Player');
      manager.setEntityTag(entity, 'player');

      expect(manager.getEntityTag(entity)).toBe('player');
    });

    it('应该返回 null 如果实体没有标签', () => {
      const entity = manager.createEntity('Player');

      expect(manager.getEntityTag(entity)).toBeNull();
    });

    it('应该设置实体标签', () => {
      const entity = manager.createEntity('Player');
      manager.setEntityTag(entity, 'player');

      expect(manager.getEntityTag(entity)).toBe('player');
    });

    it('应该更新标签索引', () => {
      const entity = manager.createEntity('Player');
      manager.setEntityTag(entity, 'oldTag');
      manager.setEntityTag(entity, 'newTag');

      expect(manager.findEntitiesByTag('oldTag')).not.toContain(entity);
      expect(manager.findEntitiesByTag('newTag')).toContain(entity);
    });

    it('应该为没有标签的实体添加标签', () => {
      const entity = manager.createEntity('Player');
      manager.setEntityTag(entity, 'player');

      expect(world.hasComponent(entity, Tag)).toBe(true);
    });
  });

  describe('isEntityActive / setEntityActive', () => {
    it('应该获取实体激活状态', () => {
      const entity = manager.createEntity('Player');

      expect(manager.isEntityActive(entity)).toBe(true);
    });

    it('应该返回 false 如果实体没有元数据', () => {
      const entity = world.createEntity();

      expect(manager.isEntityActive(entity)).toBe(false);
    });

    it('应该设置实体激活状态', () => {
      const entity = manager.createEntity('Player');
      manager.setEntityActive(entity, false);

      expect(manager.isEntityActive(entity)).toBe(false);
    });

    it('应该同步 Disabled 组件（停用时添加）', () => {
      const entity = manager.createEntity('Player');
      manager.setEntityActive(entity, false);

      expect(world.hasComponent(entity, Disabled)).toBe(true);
    });

    it('应该同步 Disabled 组件（激活时移除）', () => {
      const entity = manager.createEntity('Player');
      manager.setEntityActive(entity, false);
      manager.setEntityActive(entity, true);

      expect(world.hasComponent(entity, Disabled)).toBe(false);
    });

    it('应该不重复添加 Disabled 组件', () => {
      const entity = manager.createEntity('Player');
      manager.setEntityActive(entity, false);
      manager.setEntityActive(entity, false);

      expect(world.hasComponent(entity, Disabled)).toBe(true);
    });
  });

  describe('clear', () => {
    it('应该清空所有实体', () => {
      manager.createEntity('Entity1');
      manager.createEntity('Entity2');

      manager.clear();

      expect(manager.getEntityCount()).toBe(0);
    });

    it('应该清空名称索引', () => {
      manager.createEntity('Player');

      manager.clear();

      expect(manager.findEntityByName('Player')).toBeNull();
    });

    it('应该清空标签索引', () => {
      const entity = manager.createEntity('Player');
      manager.setEntityTag(entity, 'player');

      manager.clear();

      expect(manager.findEntitiesByTag('player')).toEqual([]);
    });
  });

  describe('边界情况', () => {
    it('应该处理空名称（空字符串被视为无名称）', () => {
      const entity = manager.createEntity('');

      // 空字符串被视为 falsy，不会添加 Name 组件
      expect(manager.getEntityName(entity)).toBeNull();
    });

    it('应该通过 setEntityName 设置空名称', () => {
      const entity = manager.createEntity('InitialName');
      manager.setEntityName(entity, '');

      expect(manager.getEntityName(entity)).toBe('');
      expect(manager.findEntityByName('')).toBe(entity);
    });

    it('应该处理特殊字符的名称', () => {
      const specialName = '实体_123!@#$%';
      const entity = manager.createEntity(specialName);

      expect(manager.getEntityName(entity)).toBe(specialName);
      expect(manager.findEntityByName(specialName)).toBe(entity);
    });

    it('应该处理特殊字符的标签', () => {
      const specialTag = '标签_123!@#$%';
      const entity = manager.createEntity('Player');
      manager.setEntityTag(entity, specialTag);

      expect(manager.getEntityTag(entity)).toBe(specialTag);
      expect(manager.findEntitiesByTag(specialTag)).toContain(entity);
    });

    it('应该在移除最后一个标签实体时清理标签索引', () => {
      const entity = manager.createEntity('Player');
      manager.setEntityTag(entity, 'uniqueTag');
      manager.removeEntity(entity);

      expect(manager.findEntitiesByTag('uniqueTag')).toEqual([]);
    });
  });
});
