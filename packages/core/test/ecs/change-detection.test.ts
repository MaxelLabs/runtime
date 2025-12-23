/**
 * Change Detection 系统测试
 * 测试组件变化追踪功能
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ChangeTracker,
  ChangeType,
  Versioned,
  withDirtyFlag,
  getGlobalChangeTracker,
  resetGlobalChangeTracker,
} from '../../src/ecs/change-detection';
import { EntityId } from '../../src/ecs/entity-id';

// 测试用组件类
class Position {
  x: number = 0;
  y: number = 0;
  z: number = 0;
}

class Velocity {
  x: number = 0;
  y: number = 0;
  z: number = 0;
}

class Health {
  current: number = 100;
  max: number = 100;
}

describe('ChangeTracker - 变化追踪器', () => {
  let tracker: ChangeTracker;
  let entity1: EntityId;
  let entity2: EntityId;
  let entity3: EntityId;

  beforeEach(() => {
    tracker = new ChangeTracker();
    entity1 = EntityId.create(0, 0);
    entity2 = EntityId.create(1, 0);
    entity3 = EntityId.create(2, 0);
    resetGlobalChangeTracker();
  });

  describe('registerComponent - 注册组件', () => {
    it('应该注册组件类型', () => {
      tracker.registerComponent(Position);
      tracker.registerComponent(Velocity);

      const stats = tracker.getStats();
      expect(stats.trackedComponents).toBe(2);
    });

    it('重复注册应该不报错', () => {
      tracker.registerComponent(Position);
      tracker.registerComponent(Position);

      const stats = tracker.getStats();
      expect(stats.trackedComponents).toBe(1);
    });
  });

  describe('markChanged - 标记变化', () => {
    beforeEach(() => {
      tracker.registerComponent(Position);
      tracker.registerComponent(Velocity);
    });

    it('应该标记组件变化', () => {
      tracker.markChanged(entity1, Position);

      expect(tracker.hasChanged(entity1, Position)).toBe(true);
      expect(tracker.hasChanged(entity1, Velocity)).toBe(false);
    });

    it('应该标记多个实体变化', () => {
      tracker.markChanged(entity1, Position);
      tracker.markChanged(entity2, Position);

      expect(tracker.hasChanged(entity1, Position)).toBe(true);
      expect(tracker.hasChanged(entity2, Position)).toBe(true);
      expect(tracker.hasChanged(entity3, Position)).toBe(false);
    });

    it('应该标记多个组件变化', () => {
      tracker.markChanged(entity1, Position);
      tracker.markChanged(entity1, Velocity);

      expect(tracker.hasChanged(entity1, Position)).toBe(true);
      expect(tracker.hasChanged(entity1, Velocity)).toBe(true);
    });

    it('应该自动注册未注册的组件', () => {
      tracker.markChanged(entity1, Health);

      expect(tracker.hasChanged(entity1, Health)).toBe(true);
    });
  });

  describe('markAdded - 标记添加', () => {
    it('应该标记组件添加', () => {
      tracker.markAdded(entity1, Position);

      expect(tracker.hasChanged(entity1, Position, ChangeType.Added)).toBe(true);
      expect(tracker.hasChanged(entity1, Position, ChangeType.Modified)).toBe(false);
      expect(tracker.hasChanged(entity1, Position, ChangeType.Removed)).toBe(false);
    });
  });

  describe('markRemoved - 标记移除', () => {
    it('应该标记组件移除', () => {
      tracker.markRemoved(entity1, Position);

      expect(tracker.hasChanged(entity1, Position, ChangeType.Removed)).toBe(true);
      expect(tracker.hasChanged(entity1, Position, ChangeType.Added)).toBe(false);
      expect(tracker.hasChanged(entity1, Position, ChangeType.Modified)).toBe(false);
    });
  });

  describe('hasChanged - 检查变化', () => {
    beforeEach(() => {
      tracker.registerComponent(Position);
    });

    it('应该检测任何变化', () => {
      tracker.markChanged(entity1, Position, ChangeType.Modified);

      expect(tracker.hasChanged(entity1, Position, ChangeType.Any)).toBe(true);
    });

    it('应该检测特定类型变化', () => {
      tracker.markChanged(entity1, Position, ChangeType.Added);

      expect(tracker.hasChanged(entity1, Position, ChangeType.Added)).toBe(true);
      expect(tracker.hasChanged(entity1, Position, ChangeType.Modified)).toBe(false);
    });

    it('未注册的组件应该返回 false', () => {
      expect(tracker.hasChanged(entity1, Health)).toBe(false);
    });

    it('未变化的实体应该返回 false', () => {
      expect(tracker.hasChanged(entity1, Position)).toBe(false);
    });
  });

  describe('hasAnyChange - 检查实体是否有任何变化', () => {
    it('应该检测实体是否有变化', () => {
      tracker.markChanged(entity1, Position);

      expect(tracker.hasAnyChange(entity1)).toBe(true);
      expect(tracker.hasAnyChange(entity2)).toBe(false);
    });
  });

  describe('getChangedEntities - 获取变化的实体', () => {
    beforeEach(() => {
      tracker.registerComponent(Position);
    });

    it('应该返回所有变化的实体', () => {
      tracker.markChanged(entity1, Position);
      tracker.markChanged(entity2, Position);

      const changed = tracker.getChangedEntities(Position);

      expect(changed).toHaveLength(2);
      expect(changed).toContain(entity1);
      expect(changed).toContain(entity2);
    });

    it('应该按变化类型过滤', () => {
      tracker.markAdded(entity1, Position);
      tracker.markChanged(entity2, Position, ChangeType.Modified);
      tracker.markRemoved(entity3, Position);

      const added = tracker.getChangedEntities(Position, ChangeType.Added);
      const modified = tracker.getChangedEntities(Position, ChangeType.Modified);
      const removed = tracker.getChangedEntities(Position, ChangeType.Removed);

      expect(added).toHaveLength(1);
      expect(added).toContain(entity1);

      expect(modified).toHaveLength(1);
      expect(modified).toContain(entity2);

      expect(removed).toHaveLength(1);
      expect(removed).toContain(entity3);
    });

    it('未注册的组件应该返回空数组', () => {
      const changed = tracker.getChangedEntities(Health);

      expect(changed).toHaveLength(0);
    });
  });

  describe('getChangedComponents - 获取实体变化的组件', () => {
    it('应该返回实体变化的所有组件', () => {
      tracker.markChanged(entity1, Position);
      tracker.markChanged(entity1, Velocity);

      const changed = tracker.getChangedComponents(entity1);

      expect(changed).toHaveLength(2);
      expect(changed).toContain(Position);
      expect(changed).toContain(Velocity);
    });

    it('未变化的实体应该返回空数组', () => {
      const changed = tracker.getChangedComponents(entity1);

      expect(changed).toHaveLength(0);
    });
  });

  describe('getChangeCount - 获取变化数量', () => {
    it('应该返回总变化数量', () => {
      tracker.markChanged(entity1, Position);
      tracker.markChanged(entity2, Velocity);

      expect(tracker.getChangeCount()).toBe(2);
    });

    it('应该返回特定组件的变化数量', () => {
      tracker.markChanged(entity1, Position);
      tracker.markChanged(entity2, Position);
      tracker.markChanged(entity3, Velocity);

      expect(tracker.getChangeCount(Position)).toBe(2);
      expect(tracker.getChangeCount(Velocity)).toBe(1);
    });
  });

  describe('clearAll - 清除所有变化', () => {
    it('应该清除所有变化记录', () => {
      tracker.markChanged(entity1, Position);
      tracker.markChanged(entity2, Velocity);

      tracker.clearAll();

      expect(tracker.hasChanged(entity1, Position)).toBe(false);
      expect(tracker.hasChanged(entity2, Velocity)).toBe(false);
      expect(tracker.getChangeCount()).toBe(0);
    });

    it('应该增加帧号', () => {
      const frame1 = tracker.getCurrentFrame();
      tracker.clearAll();
      const frame2 = tracker.getCurrentFrame();

      expect(frame2).toBe(frame1 + 1);
    });
  });

  describe('clearComponent - 清除组件变化', () => {
    it('应该清除指定组件的变化', () => {
      tracker.markChanged(entity1, Position);
      tracker.markChanged(entity1, Velocity);

      tracker.clearComponent(Position);

      expect(tracker.hasChanged(entity1, Position)).toBe(false);
      expect(tracker.hasChanged(entity1, Velocity)).toBe(true);
    });
  });

  describe('clearEntity - 清除实体变化', () => {
    it('应该清除指定实体的变化', () => {
      tracker.markChanged(entity1, Position);
      tracker.markChanged(entity2, Position);

      tracker.clearEntity(entity1);

      expect(tracker.hasChanged(entity1, Position)).toBe(false);
      expect(tracker.hasChanged(entity2, Position)).toBe(true);
    });
  });

  describe('getStats - 获取统计信息', () => {
    it('应该返回正确的统计信息', () => {
      tracker.registerComponent(Position);
      tracker.registerComponent(Velocity);
      tracker.markChanged(entity1, Position);
      tracker.markChanged(entity2, Position);
      tracker.markChanged(entity1, Velocity);

      const stats = tracker.getStats();

      expect(stats.trackedComponents).toBe(2);
      expect(stats.changedEntities).toBe(2);
      expect(stats.totalChanges).toBe(3);
      expect(stats.currentFrame).toBe(0);
    });
  });

  describe('全局单例', () => {
    it('getGlobalChangeTracker 应该返回单例', () => {
      const tracker1 = getGlobalChangeTracker();
      const tracker2 = getGlobalChangeTracker();

      expect(tracker1).toBe(tracker2);
    });

    it('resetGlobalChangeTracker 应该重置单例', () => {
      const tracker1 = getGlobalChangeTracker();
      resetGlobalChangeTracker();
      const tracker2 = getGlobalChangeTracker();

      expect(tracker1).not.toBe(tracker2);
    });
  });
});

describe('Versioned - 版本化包装器', () => {
  describe('构造函数', () => {
    it('应该创建版本化值', () => {
      const versioned = new Versioned({ x: 10, y: 20 });

      expect(versioned.value).toEqual({ x: 10, y: 20 });
      expect(versioned.version).toBe(0);
      expect(versioned.dirty).toBe(false);
    });
  });

  describe('value setter', () => {
    it('应该更新值并标记脏', () => {
      const versioned = new Versioned(10);

      versioned.value = 20;

      expect(versioned.value).toBe(20);
      expect(versioned.version).toBe(1);
      expect(versioned.dirty).toBe(true);
    });
  });

  describe('modify', () => {
    it('应该通过回调修改值', () => {
      const versioned = new Versioned({ x: 10, y: 20 });

      versioned.modify((v) => {
        v.x = 100;
      });

      expect(versioned.value.x).toBe(100);
      expect(versioned.version).toBe(1);
      expect(versioned.dirty).toBe(true);
    });
  });

  describe('clearDirty', () => {
    it('应该清除脏标记', () => {
      const versioned = new Versioned(10);
      versioned.value = 20;

      versioned.clearDirty();

      expect(versioned.dirty).toBe(false);
      expect(versioned.version).toBe(1); // 版本号不变
    });
  });
});

describe('withDirtyFlag - 脏标记 Mixin', () => {
  it('应该为组件添加脏标记功能', () => {
    const DirtyPosition = withDirtyFlag(Position);
    const pos = new DirtyPosition();

    expect(pos.__dirty).toBe(true);
    expect(pos.__version).toBe(0);
  });

  it('markDirty 应该标记脏并增加版本', () => {
    const DirtyPosition = withDirtyFlag(Position);
    const pos = new DirtyPosition() as any;

    pos.clearDirty();
    expect(pos.__dirty).toBe(false);

    pos.markDirty();

    expect(pos.__dirty).toBe(true);
    expect(pos.__version).toBe(1);
  });

  it('clearDirty 应该清除脏标记', () => {
    const DirtyPosition = withDirtyFlag(Position);
    const pos = new DirtyPosition() as any;

    pos.clearDirty();

    expect(pos.__dirty).toBe(false);
  });

  it('应该保留原始类的属性', () => {
    const DirtyPosition = withDirtyFlag(Position);
    const pos = new DirtyPosition();

    pos.x = 10;
    pos.y = 20;
    pos.z = 30;

    expect(pos.x).toBe(10);
    expect(pos.y).toBe(20);
    expect(pos.z).toBe(30);
  });
});

describe('ChangeType 枚举', () => {
  it('应该有正确的值', () => {
    expect(ChangeType.Added).toBe(1);
    expect(ChangeType.Modified).toBe(2);
    expect(ChangeType.Removed).toBe(4);
    expect(ChangeType.Any).toBe(7); // 1 | 2 | 4
  });

  it('应该支持位运算', () => {
    const addedOrModified = ChangeType.Added | ChangeType.Modified;
    expect(addedOrModified).toBe(3);

    expect(addedOrModified & ChangeType.Added).toBe(ChangeType.Added);
    expect(addedOrModified & ChangeType.Removed).toBe(0);
  });
});

describe('复杂场景', () => {
  let tracker: ChangeTracker;
  let testEntity1: EntityId;
  let testEntity2: EntityId;
  let testEntity3: EntityId;

  beforeEach(() => {
    tracker = new ChangeTracker();
    testEntity1 = EntityId.create(100, 0);
    testEntity2 = EntityId.create(101, 0);
    testEntity3 = EntityId.create(102, 0);
  });

  it('应该处理大量实体变化', () => {
    const entities: EntityId[] = [];
    for (let i = 0; i < 1000; i++) {
      entities.push(EntityId.create(i, 0));
    }

    // 标记所有实体变化
    for (const entity of entities) {
      tracker.markChanged(entity, Position);
    }

    expect(tracker.getChangeCount(Position)).toBe(1000);

    // 清除
    tracker.clearAll();

    expect(tracker.getChangeCount(Position)).toBe(0);
  });

  it('应该正确处理帧间变化', () => {
    // 第一帧
    tracker.markChanged(testEntity1, Position);
    expect(tracker.hasChanged(testEntity1, Position)).toBe(true);

    tracker.clearAll();

    // 第二帧
    expect(tracker.hasChanged(testEntity1, Position)).toBe(false);
    tracker.markChanged(testEntity2, Position);
    expect(tracker.hasChanged(testEntity2, Position)).toBe(true);
  });

  it('应该支持混合变化类型查询', () => {
    tracker.markAdded(testEntity1, Position);
    tracker.markChanged(testEntity2, Position, ChangeType.Modified);
    tracker.markRemoved(testEntity3, Position);

    // 查询 Added | Modified
    const addedOrModified = tracker.getChangedEntities(Position, ChangeType.Added | ChangeType.Modified);

    expect(addedOrModified).toHaveLength(2);
    expect(addedOrModified).toContain(testEntity1);
    expect(addedOrModified).toContain(testEntity2);
    expect(addedOrModified).not.toContain(testEntity3);
  });
});
