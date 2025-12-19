/**
 * OptimizedArchetype 测试
 * 测试优化后的 Archetype 实现
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { OptimizedArchetype } from '../../../src/ecs/core/optimized-archetype';
import { EntityId } from '../../../src/ecs/core/entity-id';
import { ComponentRegistry } from '../../../src/ecs/core/component-registry';

// 测试用组件类
class Position {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0
  ) {}
}

class Velocity {
  constructor(
    public vx: number = 0,
    public vy: number = 0,
    public vz: number = 0
  ) {}
}

class Health {
  constructor(
    public current: number = 100,
    public max: number = 100
  ) {}
}

// class Name {
//   constructor(public value: string = '') {}
// }

describe('OptimizedArchetype', () => {
  let archetype: OptimizedArchetype;
  let registry: ComponentRegistry;
  let positionTypeId: number;
  let velocityTypeId: number;
  let healthTypeId: number;

  beforeEach(() => {
    registry = new ComponentRegistry();
    positionTypeId = registry.register(Position);
    velocityTypeId = registry.register(Velocity);
    healthTypeId = registry.register(Health);

    const mask = registry.createMask([Position, Velocity]);
    const componentTypes = [positionTypeId, velocityTypeId];
    archetype = new OptimizedArchetype(mask, componentTypes);
  });

  describe('构造函数', () => {
    it('应该创建 Archetype', () => {
      expect(archetype).toBeDefined();
    });

    it('应该存储组件类型', () => {
      expect(archetype.componentTypes).toContain(positionTypeId);
      expect(archetype.componentTypes).toContain(velocityTypeId);
      expect(archetype.componentTypes).not.toContain(healthTypeId);
    });

    it('应该有正确的掩码', () => {
      expect(archetype.mask.has(positionTypeId)).toBe(true);
      expect(archetype.mask.has(velocityTypeId)).toBe(true);
      expect(archetype.mask.has(healthTypeId)).toBe(false);
    });
  });

  describe('addEntity 方法', () => {
    it('应该添加实体', () => {
      const entity = EntityId.create(1, 0);
      const componentData = [new Position(10, 20, 30), new Velocity(1, 2, 3)];

      const index = archetype.addEntity(entity, componentData);

      expect(index).toBe(0);
      expect(archetype.getEntityCount()).toBe(1);
    });

    it('应该支持添加多个实体', () => {
      for (let i = 0; i < 10; i++) {
        const entity = EntityId.create(i, 0);
        const componentData = [new Position(i, i, i), new Velocity(i, i, i)];
        archetype.addEntity(entity, componentData);
      }

      expect(archetype.getEntityCount()).toBe(10);
    });

    it('应该在组件数量不匹配时抛出错误', () => {
      const entity = EntityId.create(1, 0);
      const componentData = [new Position(10, 20, 30)]; // 缺少 Velocity

      expect(() => archetype.addEntity(entity, componentData)).toThrow();
    });
  });

  describe('removeEntity 方法', () => {
    it('应该移除实体', () => {
      const entity = EntityId.create(1, 0);
      const componentData = [new Position(10, 20, 30), new Velocity(1, 2, 3)];

      archetype.addEntity(entity, componentData);
      expect(archetype.getEntityCount()).toBe(1);

      const result = archetype.removeEntity(entity);
      expect(result).toBe(true);
      expect(archetype.getEntityCount()).toBe(0);
    });

    it('应该返回 false 对于不存在的实体', () => {
      const entity = EntityId.create(999, 0);
      const result = archetype.removeEntity(entity);
      expect(result).toBe(false);
    });

    it('应该使用 swap-remove 策略', () => {
      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);
      const entity3 = EntityId.create(3, 0);

      archetype.addEntity(entity1, [new Position(1, 1, 1), new Velocity(1, 1, 1)]);
      archetype.addEntity(entity2, [new Position(2, 2, 2), new Velocity(2, 2, 2)]);
      archetype.addEntity(entity3, [new Position(3, 3, 3), new Velocity(3, 3, 3)]);

      // 移除中间的实体
      archetype.removeEntity(entity2);

      expect(archetype.getEntityCount()).toBe(2);
      expect(archetype.hasEntity(entity1)).toBe(true);
      expect(archetype.hasEntity(entity2)).toBe(false);
      expect(archetype.hasEntity(entity3)).toBe(true);
    });
  });

  describe('getComponent 方法', () => {
    it('应该获取组件', () => {
      const entity = EntityId.create(1, 0);
      const componentData = [new Position(10, 20, 30), new Velocity(1, 2, 3)];

      archetype.addEntity(entity, componentData);

      const position = archetype.getComponent(entity, positionTypeId) as Position;
      expect(position).toBeDefined();
      expect(position.x).toBe(10);
      expect(position.y).toBe(20);
      expect(position.z).toBe(30);
    });

    it('应该返回 undefined 对于不存在的组件类型', () => {
      const entity = EntityId.create(1, 0);
      const componentData = [new Position(10, 20, 30), new Velocity(1, 2, 3)];

      archetype.addEntity(entity, componentData);

      const health = archetype.getComponent(entity, healthTypeId);
      expect(health).toBeUndefined();
    });

    it('应该返回 undefined 对于不存在的实体', () => {
      const entity = EntityId.create(999, 0);
      const position = archetype.getComponent(entity, positionTypeId);
      expect(position).toBeUndefined();
    });
  });

  describe('hasEntity 方法', () => {
    it('应该检查实体是否存在', () => {
      const entity = EntityId.create(1, 0);
      const componentData = [new Position(10, 20, 30), new Velocity(1, 2, 3)];

      expect(archetype.hasEntity(entity)).toBe(false);

      archetype.addEntity(entity, componentData);

      expect(archetype.hasEntity(entity)).toBe(true);
    });
  });

  describe('getEntities 方法', () => {
    it('应该返回所有实体', () => {
      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      archetype.addEntity(entity1, [new Position(1, 1, 1), new Velocity(1, 1, 1)]);
      archetype.addEntity(entity2, [new Position(2, 2, 2), new Velocity(2, 2, 2)]);

      const entities = archetype.getEntities();
      expect(entities.length).toBe(2);
      expect(entities).toContain(entity1);
      expect(entities).toContain(entity2);
    });

    it('应该返回空数组如果没有实体', () => {
      const entities = archetype.getEntities();
      expect(entities.length).toBe(0);
    });
  });

  describe('getEntityCount 方法', () => {
    it('应该返回正确的实体数量', () => {
      expect(archetype.getEntityCount()).toBe(0);

      const entity1 = EntityId.create(1, 0);
      archetype.addEntity(entity1, [new Position(1, 1, 1), new Velocity(1, 1, 1)]);
      expect(archetype.getEntityCount()).toBe(1);

      const entity2 = EntityId.create(2, 0);
      archetype.addEntity(entity2, [new Position(2, 2, 2), new Velocity(2, 2, 2)]);
      expect(archetype.getEntityCount()).toBe(2);
    });
  });

  describe('isEmpty 方法', () => {
    it('应该返回 true 如果没有实体', () => {
      expect(archetype.isEmpty()).toBe(true);
    });

    it('应该返回 false 如果有实体', () => {
      const entity = EntityId.create(1, 0);
      archetype.addEntity(entity, [new Position(1, 1, 1), new Velocity(1, 1, 1)]);
      expect(archetype.isEmpty()).toBe(false);
    });
  });

  describe('forEach 方法', () => {
    it('应该遍历所有实体', () => {
      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      archetype.addEntity(entity1, [new Position(1, 1, 1), new Velocity(1, 1, 1)]);
      archetype.addEntity(entity2, [new Position(2, 2, 2), new Velocity(2, 2, 2)]);

      const visited: number[] = [];
      archetype.forEach((entity, row) => {
        visited.push(entity);
        expect(row).toBeGreaterThanOrEqual(0);
      });

      expect(visited.length).toBe(2);
      expect(visited).toContain(entity1);
      expect(visited).toContain(entity2);
    });
  });

  describe('clear 方法', () => {
    it('应该清空所有实体', () => {
      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      archetype.addEntity(entity1, [new Position(1, 1, 1), new Velocity(1, 1, 1)]);
      archetype.addEntity(entity2, [new Position(2, 2, 2), new Velocity(2, 2, 2)]);

      archetype.clear();

      expect(archetype.getEntityCount()).toBe(0);
      expect(archetype.isEmpty()).toBe(true);
    });
  });

  describe('getEntityRow 方法', () => {
    it('应该返回实体的行索引', () => {
      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      archetype.addEntity(entity1, [new Position(1, 1, 1), new Velocity(1, 1, 1)]);
      archetype.addEntity(entity2, [new Position(2, 2, 2), new Velocity(2, 2, 2)]);

      expect(archetype.getEntityRow(entity1)).toBe(0);
      expect(archetype.getEntityRow(entity2)).toBe(1);
    });

    it('应该返回 -1 对于不存在的实体', () => {
      const entity = EntityId.create(999, 0);
      expect(archetype.getEntityRow(entity)).toBe(-1);
    });
  });

  describe('getComponentArray 方法', () => {
    it('应该返回组件数组', () => {
      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      archetype.addEntity(entity1, [new Position(1, 1, 1), new Velocity(1, 1, 1)]);
      archetype.addEntity(entity2, [new Position(2, 2, 2), new Velocity(2, 2, 2)]);

      const positions = archetype.getComponentArray(positionTypeId);
      expect(positions).toBeDefined();
      expect(positions!.length).toBe(2);
    });

    it('应该返回 undefined 对于不存在的组件类型', () => {
      const result = archetype.getComponentArray(healthTypeId);
      expect(result).toBeUndefined();
    });
  });

  describe('getHash 方法', () => {
    it('应该返回哈希字符串', () => {
      const hash = archetype.getHash();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('getStats 方法', () => {
    it('应该返回统计信息', () => {
      const entity = EntityId.create(1, 0);
      archetype.addEntity(entity, [new Position(1, 1, 1), new Velocity(1, 1, 1)]);

      const stats = archetype.getStats();
      expect(stats.entityCount).toBe(1);
      expect(stats.componentTypeCount).toBe(2);
      expect(stats.memoryEstimate).toBeGreaterThan(0);
    });
  });
});

describe('OptimizedArchetype 数值组件', () => {
  let registry: ComponentRegistry;
  let positionTypeId: number;

  beforeEach(() => {
    registry = new ComponentRegistry();
    positionTypeId = registry.register(Position);

    // 注册数值组件
    OptimizedArchetype.registerNumericComponent({
      typeId: positionTypeId,
      stride: 3,
      arrayType: Float32Array,
      fields: ['x', 'y', 'z'],
    });
  });

  it('应该支持数值组件的 TypedArray 存储', () => {
    const mask = registry.createMask([Position]);
    const archetype = new OptimizedArchetype(mask, [positionTypeId]);

    const entity = EntityId.create(1, 0);
    archetype.addEntity(entity, [new Position(10, 20, 30)]);

    const buffer = archetype.getTypedBuffer(positionTypeId);
    expect(buffer).toBeDefined();
    expect(buffer instanceof Float32Array).toBe(true);
  });

  it('应该支持 forEachNumeric 方法', () => {
    const mask = registry.createMask([Position]);
    const archetype = new OptimizedArchetype(mask, [positionTypeId]);

    archetype.addEntity(EntityId.create(1, 0), [new Position(10, 20, 30)]);
    archetype.addEntity(EntityId.create(2, 0), [new Position(40, 50, 60)]);

    let callCount = 0;
    archetype.forEachNumeric(positionTypeId, (data, count, stride) => {
      callCount++;
      expect(stride).toBe(3);
      expect(count).toBe(2);
    });

    expect(callCount).toBe(1);
  });
});
