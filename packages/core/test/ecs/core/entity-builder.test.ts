/**
 * EntityBuilder 测试
 * 测试实体构建器和内置组件功能
 */
import { describe, it, expect, beforeEach } from '@jest/globals';

import {
  EntityBuilder,
  Name,
  Tag,
  Position,
  Rotation,
  Scale,
  Parent,
  Children,
  Active,
  LocalMatrix,
  WorldMatrix,
  extendWorld,
  createWorldSync,
} from '../../../src/ecs/entity-builder';
import { World } from '../../../src/ecs/world';
import { INVALID_ENTITY } from '../../../src/ecs/entity-id';

describe('内置组件', () => {
  describe('Name', () => {
    it('应该创建带默认值的名称组件', () => {
      const name = new Name();
      expect(name.value).toBe('Entity');
    });

    it('应该创建带指定值的名称组件', () => {
      const name = new Name('Player');
      expect(name.value).toBe('Player');
    });
  });

  describe('Tag', () => {
    it('应该创建空标签组件', () => {
      const tag = new Tag();
      expect(tag.values.size).toBe(0);
    });

    it('应该创建带初始标签的组件', () => {
      const tag = new Tag(['enemy', 'boss']);
      expect(tag.has('enemy')).toBe(true);
      expect(tag.has('boss')).toBe(true);
    });

    it('应该支持添加标签', () => {
      const tag = new Tag();
      tag.add('player');
      expect(tag.has('player')).toBe(true);
    });

    it('应该支持移除标签', () => {
      const tag = new Tag(['player']);
      tag.remove('player');
      expect(tag.has('player')).toBe(false);
    });

    it('应该支持链式调用', () => {
      const tag = new Tag();
      tag.add('a').add('b').remove('a');
      expect(tag.has('a')).toBe(false);
      expect(tag.has('b')).toBe(true);
    });
  });

  describe('Position', () => {
    it('应该创建带默认值的位置组件', () => {
      const pos = new Position();
      expect(pos.x).toBe(0);
      expect(pos.y).toBe(0);
      expect(pos.z).toBe(0);
    });

    it('应该创建带指定值的位置组件', () => {
      const pos = new Position(10, 20, 30);
      expect(pos.x).toBe(10);
      expect(pos.y).toBe(20);
      expect(pos.z).toBe(30);
    });

    it('应该支持 set 方法', () => {
      const pos = new Position();
      pos.set(1, 2, 3);
      expect(pos.x).toBe(1);
      expect(pos.y).toBe(2);
      expect(pos.z).toBe(3);
    });

    it('应该支持 copy 方法', () => {
      const pos1 = new Position(10, 20, 30);
      const pos2 = new Position();
      pos2.copy(pos1);
      expect(pos2.x).toBe(10);
      expect(pos2.y).toBe(20);
      expect(pos2.z).toBe(30);
    });
  });

  describe('Rotation', () => {
    it('应该创建带默认值的旋转组件', () => {
      const rot = new Rotation();
      expect(rot.x).toBe(0);
      expect(rot.y).toBe(0);
      expect(rot.z).toBe(0);
      expect(rot.w).toBe(1);
    });

    it('应该创建带指定值的旋转组件', () => {
      const rot = new Rotation(0.1, 0.2, 0.3, 0.9);
      expect(rot.x).toBe(0.1);
      expect(rot.y).toBe(0.2);
      expect(rot.z).toBe(0.3);
      expect(rot.w).toBe(0.9);
    });

    it('应该支持 set 方法', () => {
      const rot = new Rotation();
      rot.set(0.1, 0.2, 0.3, 0.9);
      expect(rot.x).toBe(0.1);
      expect(rot.w).toBe(0.9);
    });

    it('应该支持 setFromEuler 方法', () => {
      const rot = new Rotation();
      rot.setFromEuler(0, Math.PI / 2, 0);
      // 绕 Y 轴旋转 90 度
      expect(rot.y).toBeCloseTo(Math.sin(Math.PI / 4), 5);
      expect(rot.w).toBeCloseTo(Math.cos(Math.PI / 4), 5);
    });
  });

  describe('Scale', () => {
    it('应该创建带默认值的缩放组件', () => {
      const scale = new Scale();
      expect(scale.x).toBe(1);
      expect(scale.y).toBe(1);
      expect(scale.z).toBe(1);
    });

    it('应该创建带指定值的缩放组件', () => {
      const scale = new Scale(2, 3, 4);
      expect(scale.x).toBe(2);
      expect(scale.y).toBe(3);
      expect(scale.z).toBe(4);
    });

    it('应该支持 set 方法', () => {
      const scale = new Scale();
      scale.set(2, 3, 4);
      expect(scale.x).toBe(2);
      expect(scale.y).toBe(3);
      expect(scale.z).toBe(4);
    });

    it('应该支持 uniform 方法', () => {
      const scale = new Scale();
      scale.uniform(5);
      expect(scale.x).toBe(5);
      expect(scale.y).toBe(5);
      expect(scale.z).toBe(5);
    });
  });

  describe('Parent', () => {
    it('应该创建带默认值的父级组件', () => {
      const parent = new Parent();
      expect(parent.entity).toBe(INVALID_ENTITY);
    });

    it('应该创建带指定值的父级组件', () => {
      const parent = new Parent(123);
      expect(parent.entity).toBe(123);
    });
  });

  describe('Children', () => {
    it('应该创建空的子级组件', () => {
      const children = new Children();
      expect(children.entities).toHaveLength(0);
    });

    it('应该支持添加子级', () => {
      const children = new Children();
      children.add(1);
      children.add(2);
      expect(children.entities).toContain(1);
      expect(children.entities).toContain(2);
    });

    it('应该避免重复添加', () => {
      const children = new Children();
      children.add(1);
      children.add(1);
      expect(children.entities).toHaveLength(1);
    });

    it('应该支持移除子级', () => {
      const children = new Children();
      children.add(1);
      children.add(2);
      children.remove(1);
      expect(children.has(1)).toBe(false);
      expect(children.has(2)).toBe(true);
    });

    it('应该支持检查子级', () => {
      const children = new Children();
      children.add(1);
      expect(children.has(1)).toBe(true);
      expect(children.has(2)).toBe(false);
    });
  });

  describe('Active', () => {
    it('应该创建带默认值的激活组件', () => {
      const active = new Active();
      expect(active.value).toBe(true);
    });

    it('应该创建带指定值的激活组件', () => {
      const active = new Active(false);
      expect(active.value).toBe(false);
    });
  });

  describe('LocalMatrix', () => {
    it('应该创建单位矩阵', () => {
      const matrix = new LocalMatrix();
      expect(matrix.data).toBeInstanceOf(Float32Array);
      expect(matrix.data.length).toBe(16);
      expect(matrix.data[0]).toBe(1);
      expect(matrix.data[5]).toBe(1);
      expect(matrix.data[10]).toBe(1);
      expect(matrix.data[15]).toBe(1);
      expect(matrix.dirty).toBe(true);
    });
  });

  describe('WorldMatrix', () => {
    it('应该创建单位矩阵', () => {
      const matrix = new WorldMatrix();
      expect(matrix.data).toBeInstanceOf(Float32Array);
      expect(matrix.data.length).toBe(16);
      expect(matrix.dirty).toBe(true);
    });
  });
});

describe('EntityBuilder', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
    world.registerComponent(Name);
    world.registerComponent(Tag);
    world.registerComponent(Position);
    world.registerComponent(Rotation);
    world.registerComponent(Scale);
    world.registerComponent(Parent);
    world.registerComponent(Children);
    world.registerComponent(Active);
    world.registerComponent(LocalMatrix);
    world.registerComponent(WorldMatrix);
  });

  describe('构造函数', () => {
    it('应该创建实体构建器', () => {
      const builder = new EntityBuilder(world);
      expect(builder.id()).toBeDefined();
    });

    it('应该创建带名称的实体构建器', () => {
      const builder = new EntityBuilder(world, 'Player');
      const entity = builder.build();
      const name = world.getComponent(entity, Name);
      expect(name?.value).toBe('Player');
    });

    it('应该默认添加 Active 组件', () => {
      const builder = new EntityBuilder(world);
      const entity = builder.build();
      const active = world.getComponent(entity, Active);
      expect(active?.value).toBe(true);
    });
  });

  describe('name 方法', () => {
    it('应该设置名称', () => {
      const entity = new EntityBuilder(world).name('TestEntity').build();
      const name = world.getComponent(entity, Name);
      expect(name?.value).toBe('TestEntity');
    });
  });

  describe('position 方法', () => {
    it('应该设置位置', () => {
      const entity = new EntityBuilder(world).position(10, 20, 30).build();
      const pos = world.getComponent(entity, Position);
      expect(pos?.x).toBe(10);
      expect(pos?.y).toBe(20);
      expect(pos?.z).toBe(30);
    });
  });

  describe('rotation 方法', () => {
    it('应该设置旋转', () => {
      const entity = new EntityBuilder(world).rotation(0.1, 0.2, 0.3, 0.9).build();
      const rot = world.getComponent(entity, Rotation);
      expect(rot?.x).toBe(0.1);
      expect(rot?.y).toBe(0.2);
      expect(rot?.z).toBe(0.3);
      expect(rot?.w).toBe(0.9);
    });
  });

  describe('rotationEuler 方法', () => {
    it('应该从欧拉角设置旋转', () => {
      const entity = new EntityBuilder(world).rotationEuler(0, Math.PI / 2, 0).build();
      const rot = world.getComponent(entity, Rotation);
      expect(rot?.y).toBeCloseTo(Math.sin(Math.PI / 4), 5);
    });
  });

  describe('rotationDegrees 方法', () => {
    it('应该从角度设置旋转', () => {
      const entity = new EntityBuilder(world).rotationDegrees(0, 90, 0).build();
      const rot = world.getComponent(entity, Rotation);
      expect(rot?.y).toBeCloseTo(Math.sin(Math.PI / 4), 5);
    });
  });

  describe('scale 方法', () => {
    it('应该设置缩放', () => {
      const entity = new EntityBuilder(world).scale(2, 3, 4).build();
      const scale = world.getComponent(entity, Scale);
      expect(scale?.x).toBe(2);
      expect(scale?.y).toBe(3);
      expect(scale?.z).toBe(4);
    });

    it('应该支持单值缩放', () => {
      const entity = new EntityBuilder(world).scale(2).build();
      const scale = world.getComponent(entity, Scale);
      expect(scale?.x).toBe(2);
      expect(scale?.y).toBe(2);
      expect(scale?.z).toBe(2);
    });
  });

  describe('uniformScale 方法', () => {
    it('应该设置统一缩放', () => {
      const entity = new EntityBuilder(world).uniformScale(5).build();
      const scale = world.getComponent(entity, Scale);
      expect(scale?.x).toBe(5);
      expect(scale?.y).toBe(5);
      expect(scale?.z).toBe(5);
    });
  });

  describe('parent 方法', () => {
    it('应该设置父级', () => {
      const parentEntity = world.createEntity();
      const entity = new EntityBuilder(world).parent(parentEntity).build();
      const parent = world.getComponent(entity, Parent);
      expect(parent?.entity).toBe(parentEntity);
    });
  });

  describe('tag 方法', () => {
    it('应该添加标签', () => {
      const entity = new EntityBuilder(world).tag('enemy', 'boss').build();
      const tag = world.getComponent(entity, Tag);
      expect(tag?.has('enemy')).toBe(true);
      expect(tag?.has('boss')).toBe(true);
    });

    it('应该支持多次调用', () => {
      const entity = new EntityBuilder(world).tag('a').tag('b', 'c').build();
      const tag = world.getComponent(entity, Tag);
      expect(tag?.has('a')).toBe(true);
      expect(tag?.has('b')).toBe(true);
      expect(tag?.has('c')).toBe(true);
    });
  });

  describe('active 方法', () => {
    it('应该设置激活状态', () => {
      const entity = new EntityBuilder(world).active(false).build();
      const active = world.getComponent(entity, Active);
      expect(active?.value).toBe(false);
    });
  });

  describe('add 方法', () => {
    it('应该添加自定义组件', () => {
      class Health {
        current = 100;
        max = 100;
      }
      world.registerComponent(Health);

      const entity = new EntityBuilder(world).add(Health, { current: 50 }).build();
      const health = world.getComponent(entity, Health);
      expect(health?.current).toBe(50);
      expect(health?.max).toBe(100);
    });

    it('应该支持不带数据的组件', () => {
      class Marker {}
      world.registerComponent(Marker);

      const entity = new EntityBuilder(world).add(Marker).build();
      expect(world.hasComponent(entity, Marker)).toBe(true);
    });
  });

  describe('addIf 方法', () => {
    it('应该在条件为真时添加组件', () => {
      class Health {
        current = 100;
      }
      world.registerComponent(Health);

      const entity = new EntityBuilder(world).addIf(true, Health).build();
      expect(world.hasComponent(entity, Health)).toBe(true);
    });

    it('应该在条件为假时不添加组件', () => {
      class Health {
        current = 100;
      }
      world.registerComponent(Health);

      const entity = new EntityBuilder(world).addIf(false, Health).build();
      expect(world.hasComponent(entity, Health)).toBe(false);
    });
  });

  describe('addMany 方法', () => {
    it('应该添加多个组件', () => {
      class Health {
        current = 100;
      }
      class Damage {
        value = 10;
      }
      world.registerComponent(Health);
      world.registerComponent(Damage);

      const entity = new EntityBuilder(world)
        .addMany([
          [Health, { current: 50 }],
          [Damage, { value: 20 }],
        ])
        .build();

      expect(world.getComponent(entity, Health)?.current).toBe(50);
      expect(world.getComponent(entity, Damage)?.value).toBe(20);
    });
  });

  describe('id 方法', () => {
    it('应该返回实体 ID', () => {
      const builder = new EntityBuilder(world);
      const id = builder.id();
      expect(id).toBeDefined();
      expect(world.isAlive(id)).toBe(true);
    });
  });

  describe('build 方法', () => {
    it('应该完成构建并返回实体 ID', () => {
      const entity = new EntityBuilder(world).name('Test').position(1, 2, 3).build();
      expect(world.isAlive(entity)).toBe(true);
    });

    it('应该在重复构建时抛出错误', () => {
      const builder = new EntityBuilder(world);
      builder.build();
      expect(() => builder.build()).toThrow('Entity already built');
    });

    it('应该处理父子关系', () => {
      const parentEntity = new EntityBuilder(world).name('Parent').build();
      const childEntity = new EntityBuilder(world).name('Child').parent(parentEntity).build();

      const children = world.getComponent(parentEntity, Children);
      expect(children?.has(childEntity)).toBe(true);
    });
  });
});

describe('extendWorld', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
    world.registerComponent(Name);
    world.registerComponent(Tag);
    world.registerComponent(Position);
    world.registerComponent(Rotation);
    world.registerComponent(Scale);
    world.registerComponent(Parent);
    world.registerComponent(Children);
    world.registerComponent(Active);
  });

  it('应该扩展 World 添加 spawn 方法', () => {
    const extended = extendWorld(world);
    expect(typeof extended.spawn).toBe('function');
  });

  it('应该支持 spawn 方法', () => {
    const extended = extendWorld(world);
    const entity = extended.spawn('Player').position(10, 0, 0).build();
    expect(world.isAlive(entity)).toBe(true);
  });

  it('应该支持 spawnBatch 方法', () => {
    const extended = extendWorld(world);
    const entities = extended.spawnBatch(5, (builder, index) => {
      builder.name(`Entity_${index}`).position(index * 10, 0, 0);
    });
    expect(entities).toHaveLength(5);
  });

  it('应该支持 findByName 方法', () => {
    const extended = extendWorld(world);
    const entity = extended.spawn('UniquePlayer').build();
    const found = extended.findByName('UniquePlayer');
    expect(found).toBe(entity);
  });

  it('应该支持 findByTag 方法', () => {
    const extended = extendWorld(world);
    extended.spawn('Enemy1').tag('enemy').build();
    extended.spawn('Enemy2').tag('enemy').build();
    extended.spawn('Player').tag('player').build();

    const enemies = extended.findByTag('enemy');
    expect(enemies).toHaveLength(2);
  });

  it('应该支持 getChildren 方法', () => {
    const extended = extendWorld(world);
    const parent = extended.spawn('Parent').build();
    extended.spawn('Child1').parent(parent).build();
    extended.spawn('Child2').parent(parent).build();

    const children = extended.getChildren(parent);
    expect(children).toHaveLength(2);
  });

  it('应该支持 getParent 方法', () => {
    const extended = extendWorld(world);
    const parent = extended.spawn('Parent').build();
    const child = extended.spawn('Child').parent(parent).build();

    expect(extended.getParent(child)).toBe(parent);
  });

  it('应该支持 setParent 方法', () => {
    const extended = extendWorld(world);
    const parent1 = extended.spawn('Parent1').build();
    const parent2 = extended.spawn('Parent2').build();
    const child = extended.spawn('Child').parent(parent1).build();

    extended.setParent(child, parent2);

    expect(extended.getParent(child)).toBe(parent2);
    expect(extended.getChildren(parent1)).toHaveLength(0);
    expect(extended.getChildren(parent2)).toHaveLength(1);
  });

  it('应该支持 isActive 方法', () => {
    const extended = extendWorld(world);
    const entity = extended.spawn('Test').active(true).build();
    expect(extended.isActive(entity)).toBe(true);
  });

  it('应该支持 setActive 方法', () => {
    const extended = extendWorld(world);
    const entity = extended.spawn('Test').build();

    extended.setActive(entity, false);
    expect(extended.isActive(entity)).toBe(false);

    extended.setActive(entity, true);
    expect(extended.isActive(entity)).toBe(true);
  });
});

describe('createWorldSync', () => {
  it('应该创建扩展的 World', () => {
    const world = createWorldSync(World);
    expect(typeof world.spawn).toBe('function');
  });

  it('应该预注册内置组件', () => {
    const world = createWorldSync(World);
    const entity = world.spawn('Test').position(1, 2, 3).rotation(0, 0, 0, 1).scale(1).build();

    expect(world.hasComponent(entity, Position)).toBe(true);
    expect(world.hasComponent(entity, Rotation)).toBe(true);
    expect(world.hasComponent(entity, Scale)).toBe(true);
  });
});
