/**
 * ComponentRegistry 测试
 * 测试组件注册表功能
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import type { ComponentClass } from '../../src/ecs/component-registry';
import { ComponentRegistry } from '../../src/ecs/component-registry';
import { BitSet } from '../../src/utils/bitset';

// 测试用组件
class Position {
  x = 0;
  y = 0;
  z = 0;
}

class Velocity {
  x = 0;
  y = 0;
  z = 0;
}

class Health {
  current = 100;
  max = 100;
}

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    registry = new ComponentRegistry();
  });

  describe('register 方法', () => {
    it('应该注册组件并返回类型 ID', () => {
      const id = registry.register(Position);

      expect(id).toBe(0);
      expect(registry.has(Position)).toBe(true);
    });

    it('应该为不同组件分配不同的 ID', () => {
      const posId = registry.register(Position);
      const velId = registry.register(Velocity);
      const healthId = registry.register(Health);

      expect(posId).toBe(0);
      expect(velId).toBe(1);
      expect(healthId).toBe(2);
    });

    it('应该返回已注册组件的现有 ID', () => {
      const id1 = registry.register(Position);
      const id2 = registry.register(Position);

      expect(id1).toBe(id2);
      expect(registry.getCount()).toBe(1);
    });

    it('应该在超过最大数量时抛出错误', () => {
      // 创建大量组件类
      const components: ComponentClass[] = [];
      for (let i = 0; i < 1024; i++) {
        components.push(class {});
      }

      // 注册所有组件
      for (const comp of components) {
        registry.register(comp);
      }

      // 尝试注册第 1025 个组件应该抛出错误
      expect(() => registry.register(class {})).toThrow('Component type limit exceeded');
    });
  });

  describe('getTypeId 方法', () => {
    it('应该返回已注册组件的类型 ID', () => {
      registry.register(Position);
      registry.register(Velocity);

      expect(registry.getTypeId(Position)).toBe(0);
      expect(registry.getTypeId(Velocity)).toBe(1);
    });

    it('应该返回 -1 对于未注册的组件', () => {
      expect(registry.getTypeId(Position)).toBe(-1);
    });
  });

  describe('getBitIndex 方法', () => {
    it('应该返回已注册组件的位索引', () => {
      registry.register(Position);
      registry.register(Velocity);

      expect(registry.getBitIndex(Position)).toBe(0);
      expect(registry.getBitIndex(Velocity)).toBe(1);
    });

    it('应该返回 -1 对于未注册的组件', () => {
      expect(registry.getBitIndex(Position)).toBe(-1);
    });
  });

  describe('getName 方法', () => {
    it('应该返回组件名称', () => {
      registry.register(Position);

      expect(registry.getName(Position)).toBe('Position');
    });

    it('应该返回 undefined 对于未注册的组件', () => {
      expect(registry.getName(Position)).toBeUndefined();
    });

    it('应该处理匿名类', () => {
      const AnonymousComponent = class {};
      registry.register(AnonymousComponent);

      // 匿名类可能有空名称或默认名称
      const name = registry.getName(AnonymousComponent);
      expect(name).toBeDefined();
    });
  });

  describe('getTypeById 方法', () => {
    it('应该通过 ID 返回组件类', () => {
      registry.register(Position);
      registry.register(Velocity);

      expect(registry.getTypeById(0)).toBe(Position);
      expect(registry.getTypeById(1)).toBe(Velocity);
    });

    it('应该返回 undefined 对于不存在的 ID', () => {
      expect(registry.getTypeById(0)).toBeUndefined();
      expect(registry.getTypeById(999)).toBeUndefined();
    });
  });

  describe('getTypeByBitIndex 方法', () => {
    it('应该通过位索引返回组件类', () => {
      registry.register(Position);
      registry.register(Velocity);

      expect(registry.getTypeByBitIndex(0)).toBe(Position);
      expect(registry.getTypeByBitIndex(1)).toBe(Velocity);
    });

    it('应该返回 undefined 对于不存在的位索引', () => {
      expect(registry.getTypeByBitIndex(0)).toBeUndefined();
      expect(registry.getTypeByBitIndex(999)).toBeUndefined();
    });
  });

  describe('has 方法', () => {
    it('应该返回 true 对于已注册的组件', () => {
      registry.register(Position);

      expect(registry.has(Position)).toBe(true);
    });

    it('应该返回 false 对于未注册的组件', () => {
      expect(registry.has(Position)).toBe(false);
    });
  });

  describe('getCount 方法', () => {
    it('应该返回已注册组件的数量', () => {
      expect(registry.getCount()).toBe(0);

      registry.register(Position);
      expect(registry.getCount()).toBe(1);

      registry.register(Velocity);
      expect(registry.getCount()).toBe(2);

      registry.register(Health);
      expect(registry.getCount()).toBe(3);
    });
  });

  describe('createMask 方法', () => {
    it('应该创建包含指定组件的掩码', () => {
      registry.register(Position);
      registry.register(Velocity);
      registry.register(Health);

      const mask = registry.createMask([Position, Velocity]);

      expect(mask.has(0)).toBe(true);
      expect(mask.has(1)).toBe(true);
      expect(mask.has(2)).toBe(false);
    });

    it('应该创建空掩码对于空数组', () => {
      const mask = registry.createMask([]);

      expect(mask.isEmpty()).toBe(true);
    });

    it('应该在组件未注册时抛出错误', () => {
      expect(() => registry.createMask([Position])).toThrow('Component type not registered');
    });
  });

  describe('maskContainsAll 方法', () => {
    it('应该返回 true 如果掩码包含所有组件', () => {
      registry.register(Position);
      registry.register(Velocity);
      registry.register(Health);

      const mask = registry.createMask([Position, Velocity, Health]);

      expect(registry.maskContainsAll(mask, [Position, Velocity])).toBe(true);
      expect(registry.maskContainsAll(mask, [Position, Velocity, Health])).toBe(true);
    });

    it('应该返回 false 如果掩码缺少任何组件', () => {
      registry.register(Position);
      registry.register(Velocity);
      registry.register(Health);

      const mask = registry.createMask([Position, Velocity]);

      expect(registry.maskContainsAll(mask, [Position, Velocity, Health])).toBe(false);
    });

    it('应该返回 false 对于未注册的组件', () => {
      registry.register(Position);
      const mask = registry.createMask([Position]);

      expect(registry.maskContainsAll(mask, [Position, Velocity])).toBe(false);
    });

    it('应该返回 true 对于空组件数组', () => {
      registry.register(Position);
      const mask = registry.createMask([Position]);

      expect(registry.maskContainsAll(mask, [])).toBe(true);
    });
  });

  describe('maskContainsAny 方法', () => {
    it('应该返回 true 如果掩码包含任意组件', () => {
      registry.register(Position);
      registry.register(Velocity);
      registry.register(Health);

      const mask = registry.createMask([Position]);

      expect(registry.maskContainsAny(mask, [Position, Velocity])).toBe(true);
    });

    it('应该返回 false 如果掩码不包含任何组件', () => {
      registry.register(Position);
      registry.register(Velocity);
      registry.register(Health);

      const mask = registry.createMask([Health]);

      expect(registry.maskContainsAny(mask, [Position, Velocity])).toBe(false);
    });

    it('应该返回 false 对于空组件数组', () => {
      registry.register(Position);
      const mask = registry.createMask([Position]);

      expect(registry.maskContainsAny(mask, [])).toBe(false);
    });
  });

  describe('maskExcludesAll 方法', () => {
    it('应该返回 true 如果掩码不包含任何组件', () => {
      registry.register(Position);
      registry.register(Velocity);
      registry.register(Health);

      const mask = registry.createMask([Position]);

      expect(registry.maskExcludesAll(mask, [Velocity, Health])).toBe(true);
    });

    it('应该返回 false 如果掩码包含任何组件', () => {
      registry.register(Position);
      registry.register(Velocity);
      registry.register(Health);

      const mask = registry.createMask([Position, Velocity]);

      expect(registry.maskExcludesAll(mask, [Velocity, Health])).toBe(false);
    });

    it('应该返回 true 对于空组件数组', () => {
      registry.register(Position);
      const mask = registry.createMask([Position]);

      expect(registry.maskExcludesAll(mask, [])).toBe(true);
    });
  });

  describe('getTypesFromMask 方法', () => {
    it('应该返回掩码对应的组件类数组', () => {
      registry.register(Position);
      registry.register(Velocity);
      registry.register(Health);

      const mask = registry.createMask([Position, Health]);
      const types = registry.getTypesFromMask(mask);

      expect(types).toHaveLength(2);
      expect(types).toContain(Position);
      expect(types).toContain(Health);
    });

    it('应该返回空数组对于空掩码', () => {
      const mask = new BitSet();
      const types = registry.getTypesFromMask(mask);

      expect(types).toHaveLength(0);
    });
  });

  describe('clear 方法', () => {
    it('应该清空注册表', () => {
      registry.register(Position);
      registry.register(Velocity);

      registry.clear();

      expect(registry.getCount()).toBe(0);
      expect(registry.has(Position)).toBe(false);
      expect(registry.has(Velocity)).toBe(false);
    });

    it('应该重置 ID 计数器', () => {
      registry.register(Position);
      registry.register(Velocity);

      registry.clear();

      const newId = registry.register(Health);
      expect(newId).toBe(0);
    });
  });

  describe('getAllTypes 方法', () => {
    it('应该返回所有已注册的组件类', () => {
      registry.register(Position);
      registry.register(Velocity);
      registry.register(Health);

      const types = registry.getAllTypes();

      expect(types).toHaveLength(3);
      expect(types).toContain(Position);
      expect(types).toContain(Velocity);
      expect(types).toContain(Health);
    });

    it('应该返回空数组如果没有注册组件', () => {
      const types = registry.getAllTypes();

      expect(types).toHaveLength(0);
    });
  });

  describe('getStats 方法', () => {
    it('应该返回统计信息', () => {
      registry.register(Position);
      registry.register(Velocity);

      const stats = registry.getStats();

      expect(stats.registeredTypes).toBe(2);
      expect(stats.maxTypes).toBe(1024);
      expect(stats.utilizationRate).toBeCloseTo(2 / 1024, 5);
    });
  });
});
