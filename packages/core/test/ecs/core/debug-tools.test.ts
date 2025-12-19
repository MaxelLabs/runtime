/**
 * Debug Tools 测试
 * 测试 ECS 调试工具功能
 */

import {
  inspect,
  inspectString,
  buildHierarchy,
  printHierarchy,
  getWorldStats,
  printWorldStats,
  PerformanceMonitor,
  Debug,
  globalPerformanceMonitor,
} from '../../../src/ecs/core/debug-tools';
import { World } from '../../../src/ecs/core/world';
import {
  Name,
  Tag,
  Position,
  Rotation,
  Scale,
  Parent,
  Children,
  Active,
  extendWorld,
} from '../../../src/ecs/core/entity-builder';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Debug Tools', () => {
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

  describe('inspect 函数', () => {
    it('应该返回实体检查结果', () => {
      const entity = world.createEntity();
      world.addComponent(entity, Name, new Name('TestEntity'));
      world.addComponent(entity, Position, new Position(10, 20, 30));
      world.addComponent(entity, Active, new Active(true));

      const result = inspect(world, entity);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('TestEntity');
      expect(result!.active).toBe(true);
      expect(result!.components['Position']).toEqual({ x: 10, y: 20, z: 30 });
    });

    it('应该返回 null 对于不存在的实体', () => {
      const result = inspect(world, 999999);

      expect(result).toBeNull();
    });

    it('应该包含父子关系信息', () => {
      const parent = world.createEntity();
      const child = world.createEntity();

      world.addComponent(parent, Name, new Name('Parent'));
      world.addComponent(child, Name, new Name('Child'));
      world.addComponent(child, Parent, new Parent(parent));

      const childrenComp = new Children();
      childrenComp.add(child);
      world.addComponent(parent, Children, childrenComp);

      const parentResult = inspect(world, parent);
      const childResult = inspect(world, child);

      expect(parentResult!.children).toContain(child);
      expect(childResult!.parent).toBe(parent);
    });

    it('应该包含标签信息', () => {
      const entity = world.createEntity();
      const tag = new Tag(['enemy', 'boss']);
      world.addComponent(entity, Tag, tag);

      const result = inspect(world, entity);

      expect(result!.tags).toContain('enemy');
      expect(result!.tags).toContain('boss');
    });
  });

  describe('inspectString 函数', () => {
    it('应该返回格式化的字符串', () => {
      const entity = world.createEntity();
      world.addComponent(entity, Name, new Name('TestEntity'));
      world.addComponent(entity, Position, new Position(10, 20, 30));

      const result = inspectString(world, entity);

      expect(result).toContain('TestEntity');
      expect(result).toContain('Position');
    });

    it('应该处理不存在的实体', () => {
      const result = inspectString(world, 999999);

      expect(result).toContain('NOT FOUND');
    });
  });

  describe('buildHierarchy 函数', () => {
    it('应该构建层级树', () => {
      const extended = extendWorld(world);
      const parent = extended.spawn('Parent').build();
      extended.spawn('Child1').parent(parent).build();
      extended.spawn('Child2').parent(parent).build();

      const hierarchy = buildHierarchy(world);

      expect(hierarchy.length).toBeGreaterThan(0);
    });

    it('应该返回空数组对于空 World', () => {
      const hierarchy = buildHierarchy(world);

      expect(hierarchy).toEqual([]);
    });
  });

  describe('printHierarchy 函数', () => {
    it('应该返回格式化的层级树字符串', () => {
      const extended = extendWorld(world);
      const parent = extended.spawn('Parent').build();
      extended.spawn('Child').parent(parent).build();

      const result = printHierarchy(world);

      expect(typeof result).toBe('string');
    });
  });

  describe('getWorldStats 函数', () => {
    it('应该返回 World 统计信息', () => {
      world.createEntity();
      world.createEntity();
      world.createEntity();

      const stats = getWorldStats(world);

      expect(stats.entities).toBe(3);
      expect(stats.memoryEstimate).toBeGreaterThan(0);
    });
  });

  describe('printWorldStats 函数', () => {
    it('应该返回格式化的统计信息字符串', () => {
      world.createEntity();

      const result = printWorldStats(world);

      expect(result).toContain('World Statistics');
      expect(result).toContain('Entities');
    });
  });
});

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe('构造函数', () => {
    it('应该创建性能监控器', () => {
      expect(monitor).toBeDefined();
    });

    it('应该接受最大采样数参数', () => {
      const customMonitor = new PerformanceMonitor(50);
      expect(customMonitor).toBeDefined();
    });
  });

  describe('begin 和 end 方法', () => {
    it('应该记录时间', () => {
      monitor.begin('test');
      const duration = monitor.end('test');

      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('应该在没有开始时返回 0', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const duration = monitor.end('nonexistent');

      expect(duration).toBe(0);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('应该支持多个计时器', () => {
      monitor.begin('timer1');
      monitor.begin('timer2');

      const duration1 = monitor.end('timer1');
      const duration2 = monitor.end('timer2');

      expect(duration1).toBeGreaterThanOrEqual(0);
      expect(duration2).toBeGreaterThanOrEqual(0);
    });
  });

  describe('measure 方法', () => {
    it('应该测量函数执行时间', () => {
      const result = monitor.measure('test', () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });

      expect(result).toBe(499500);
    });

    it('应该在函数抛出异常时仍然结束计时', () => {
      expect(() => {
        monitor.measure('test', () => {
          throw new Error('Test error');
        });
      }).toThrow('Test error');

      // 应该能获取统计信息
      const stats = monitor.getStats('test');
      expect(stats).not.toBeNull();
    });
  });

  describe('getStats 方法', () => {
    it('应该返回统计信息', () => {
      monitor.begin('test');
      monitor.end('test');
      monitor.begin('test');
      monitor.end('test');

      const stats = monitor.getStats('test');

      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(2);
      expect(stats!.avgTime).toBeGreaterThanOrEqual(0);
      expect(stats!.minTime).toBeGreaterThanOrEqual(0);
      expect(stats!.maxTime).toBeGreaterThanOrEqual(0);
    });

    it('应该返回 null 对于不存在的计时器', () => {
      const stats = monitor.getStats('nonexistent');

      expect(stats).toBeNull();
    });
  });

  describe('getAllStats 方法', () => {
    it('应该返回所有统计信息', () => {
      monitor.begin('timer1');
      monitor.end('timer1');
      monitor.begin('timer2');
      monitor.end('timer2');

      const allStats = monitor.getAllStats();

      expect(allStats.length).toBe(2);
    });
  });

  describe('getReport 方法', () => {
    it('应该返回格式化的报告', () => {
      monitor.begin('test');
      monitor.end('test');

      const report = monitor.getReport();

      expect(report).toContain('Performance Report');
      expect(report).toContain('test');
    });

    it('应该在没有数据时返回提示信息', () => {
      const report = monitor.getReport();

      expect(report).toContain('No performance data');
    });
  });

  describe('clear 方法', () => {
    it('应该清空所有数据', () => {
      monitor.begin('test');
      monitor.end('test');

      monitor.clear();

      expect(monitor.getStats('test')).toBeNull();
    });
  });

  describe('采样数量限制', () => {
    it('应该限制采样数量', () => {
      const smallMonitor = new PerformanceMonitor(5);

      for (let i = 0; i < 10; i++) {
        smallMonitor.begin('test');
        smallMonitor.end('test');
      }

      const stats = smallMonitor.getStats('test');
      expect(stats!.count).toBe(5);
    });
  });
});

describe('Debug 对象', () => {
  it('应该导出所有调试函数', () => {
    expect(Debug.inspect).toBe(inspect);
    expect(Debug.inspectString).toBe(inspectString);
    expect(Debug.buildHierarchy).toBe(buildHierarchy);
    expect(Debug.printHierarchy).toBe(printHierarchy);
    expect(Debug.getWorldStats).toBe(getWorldStats);
    expect(Debug.printWorldStats).toBe(printWorldStats);
    expect(Debug.PerformanceMonitor).toBe(PerformanceMonitor);
  });
});

describe('globalPerformanceMonitor', () => {
  beforeEach(() => {
    globalPerformanceMonitor.clear();
  });

  it('应该是 PerformanceMonitor 实例', () => {
    expect(globalPerformanceMonitor).toBeInstanceOf(PerformanceMonitor);
  });

  it('应该可以全局使用', () => {
    globalPerformanceMonitor.begin('global-test');
    globalPerformanceMonitor.end('global-test');

    const stats = globalPerformanceMonitor.getStats('global-test');
    expect(stats).not.toBeNull();
  });
});
