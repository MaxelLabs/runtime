/**
 * Systems 测试
 * 测试 System 调度器和内置 System 的功能
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { SystemDef, SystemContext } from '../../../src/ecs/core/systems';
import {
  SystemScheduler,
  SystemStage,
  TransformSystem,
  HierarchySystem,
  CleanupSystem,
} from '../../../src/ecs/core/systems';
import { World } from '../../../src/ecs/core/world';

describe('SystemStage', () => {
  it('应该定义所有阶段', () => {
    expect(SystemStage.FrameStart).toBe(0);
    expect(SystemStage.PreUpdate).toBe(1);
    expect(SystemStage.Update).toBe(2);
    expect(SystemStage.PostUpdate).toBe(3);
    expect(SystemStage.PreRender).toBe(4);
    expect(SystemStage.Render).toBe(5);
    expect(SystemStage.FrameEnd).toBe(6);
  });
});

describe('SystemScheduler', () => {
  let world: World;
  let scheduler: SystemScheduler;

  beforeEach(() => {
    world = new World();
    scheduler = new SystemScheduler(world);
  });

  describe('addSystem 方法', () => {
    it('应该添加 System', () => {
      const system: SystemDef = {
        name: 'TestSystem',
        stage: SystemStage.Update,
        execute: jest.fn(),
      };

      scheduler.addSystem(system);

      const systems = scheduler.getSystems();
      expect(systems).toContainEqual(system);
    });

    it('应该替换同名 System', () => {
      const system1: SystemDef = {
        name: 'TestSystem',
        stage: SystemStage.Update,
        execute: jest.fn(),
      };

      const system2: SystemDef = {
        name: 'TestSystem',
        stage: SystemStage.PreUpdate,
        execute: jest.fn(),
      };

      scheduler.addSystem(system1);
      scheduler.addSystem(system2);

      const systems = scheduler.getSystems();
      expect(systems).toHaveLength(1);
      expect(systems[0].stage).toBe(SystemStage.PreUpdate);
    });

    it('应该支持链式调用', () => {
      const system: SystemDef = {
        name: 'TestSystem',
        stage: SystemStage.Update,
        execute: jest.fn(),
      };

      const result = scheduler.addSystem(system);
      expect(result).toBe(scheduler);
    });
  });

  describe('addSystems 方法', () => {
    it('应该批量添加 System', () => {
      const system1: SystemDef = {
        name: 'System1',
        stage: SystemStage.Update,
        execute: jest.fn(),
      };

      const system2: SystemDef = {
        name: 'System2',
        stage: SystemStage.Update,
        execute: jest.fn(),
      };

      scheduler.addSystems(system1, system2);

      const systems = scheduler.getSystems();
      expect(systems).toHaveLength(2);
    });
  });

  describe('removeSystem 方法', () => {
    it('应该移除 System', () => {
      const system: SystemDef = {
        name: 'TestSystem',
        stage: SystemStage.Update,
        execute: jest.fn(),
      };

      scheduler.addSystem(system);
      const result = scheduler.removeSystem('TestSystem');

      expect(result).toBe(true);
      expect(scheduler.getSystems()).toHaveLength(0);
    });

    it('应该返回 false 如果 System 不存在', () => {
      const result = scheduler.removeSystem('NonExistent');
      expect(result).toBe(false);
    });
  });

  describe('setSystemEnabled 方法', () => {
    it('应该启用/禁用 System', () => {
      const system: SystemDef = {
        name: 'TestSystem',
        stage: SystemStage.Update,
        execute: jest.fn(),
      };

      scheduler.addSystem(system);

      scheduler.setSystemEnabled('TestSystem', false);
      expect(scheduler.isSystemEnabled('TestSystem')).toBe(false);

      scheduler.setSystemEnabled('TestSystem', true);
      expect(scheduler.isSystemEnabled('TestSystem')).toBe(true);
    });

    it('应该返回 false 如果 System 不存在', () => {
      const result = scheduler.setSystemEnabled('NonExistent', true);
      expect(result).toBe(false);
    });
  });

  describe('isSystemEnabled 方法', () => {
    it('应该返回 System 的启用状态', () => {
      const system: SystemDef = {
        name: 'TestSystem',
        stage: SystemStage.Update,
        enabled: false,
        execute: jest.fn(),
      };

      scheduler.addSystem(system);

      expect(scheduler.isSystemEnabled('TestSystem')).toBe(false);
    });

    it('应该返回 false 如果 System 不存在', () => {
      expect(scheduler.isSystemEnabled('NonExistent')).toBe(false);
    });
  });

  describe('update 方法', () => {
    it('应该执行所有启用的 System', () => {
      const executeFn = jest.fn();
      const system: SystemDef = {
        name: 'TestSystem',
        stage: SystemStage.Update,
        execute: executeFn,
      };

      scheduler.addSystem(system);
      scheduler.update(0.016);

      expect(executeFn).toHaveBeenCalled();
    });

    it('应该不执行禁用的 System', () => {
      const executeFn = jest.fn();
      const system: SystemDef = {
        name: 'TestSystem',
        stage: SystemStage.Update,
        enabled: false,
        execute: executeFn,
      };

      scheduler.addSystem(system);
      scheduler.update(0.016);

      expect(executeFn).not.toHaveBeenCalled();
    });

    it('应该按阶段顺序执行', () => {
      const order: string[] = [];

      const preUpdate: SystemDef = {
        name: 'PreUpdate',
        stage: SystemStage.PreUpdate,
        execute: () => order.push('PreUpdate'),
      };

      const update: SystemDef = {
        name: 'Update',
        stage: SystemStage.Update,
        execute: () => order.push('Update'),
      };

      const postUpdate: SystemDef = {
        name: 'PostUpdate',
        stage: SystemStage.PostUpdate,
        execute: () => order.push('PostUpdate'),
      };

      scheduler.addSystems(postUpdate, preUpdate, update);
      scheduler.update(0.016);

      expect(order).toEqual(['PreUpdate', 'Update', 'PostUpdate']);
    });

    it('应该按优先级排序同阶段的 System', () => {
      const order: string[] = [];

      const system1: SystemDef = {
        name: 'System1',
        stage: SystemStage.Update,
        priority: 10,
        execute: () => order.push('System1'),
      };

      const system2: SystemDef = {
        name: 'System2',
        stage: SystemStage.Update,
        priority: 5,
        execute: () => order.push('System2'),
      };

      const system3: SystemDef = {
        name: 'System3',
        stage: SystemStage.Update,
        priority: 15,
        execute: () => order.push('System3'),
      };

      scheduler.addSystems(system1, system2, system3);
      scheduler.update(0.016);

      expect(order).toEqual(['System2', 'System1', 'System3']);
    });

    it('应该传递正确的上下文', () => {
      let capturedCtx: SystemContext | null = null;

      const system: SystemDef = {
        name: 'TestSystem',
        stage: SystemStage.Update,
        execute: (ctx) => {
          capturedCtx = ctx;
        },
      };

      scheduler.addSystem(system);
      scheduler.update(0.016);

      expect(capturedCtx).not.toBeNull();
      expect(capturedCtx!.world).toBe(world);
      expect(capturedCtx!.deltaTime).toBe(0.016);
      expect(capturedCtx!.frameCount).toBe(1);
    });

    it('应该累积总时间', () => {
      let totalTime = 0;

      const system: SystemDef = {
        name: 'TestSystem',
        stage: SystemStage.Update,
        execute: (ctx) => {
          totalTime = ctx.totalTime;
        },
      };

      scheduler.addSystem(system);
      scheduler.update(0.016);
      scheduler.update(0.016);
      scheduler.update(0.016);

      expect(totalTime).toBeCloseTo(0.048, 5);
    });

    it('应该递增帧计数', () => {
      let frameCount = 0;

      const system: SystemDef = {
        name: 'TestSystem',
        stage: SystemStage.Update,
        execute: (ctx) => {
          frameCount = ctx.frameCount;
        },
      };

      scheduler.addSystem(system);
      scheduler.update(0.016);
      expect(frameCount).toBe(1);

      scheduler.update(0.016);
      expect(frameCount).toBe(2);

      scheduler.update(0.016);
      expect(frameCount).toBe(3);
    });

    it('应该支持条件执行', () => {
      const executeFn = jest.fn();
      let shouldRun = false;

      const system: SystemDef = {
        name: 'TestSystem',
        stage: SystemStage.Update,
        runIf: () => shouldRun,
        execute: executeFn,
      };

      scheduler.addSystem(system);

      scheduler.update(0.016);
      expect(executeFn).not.toHaveBeenCalled();

      shouldRun = true;
      scheduler.update(0.016);
      expect(executeFn).toHaveBeenCalled();
    });

    it('应该捕获 System 执行错误', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const system: SystemDef = {
        name: 'ErrorSystem',
        stage: SystemStage.Update,
        execute: () => {
          throw new Error('Test error');
        },
      };

      scheduler.addSystem(system);
      scheduler.update(0.016);

      expect(consoleSpy).toHaveBeenCalledWith('Error in system "ErrorSystem":', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getStats 方法', () => {
    it('应该返回统计信息', () => {
      const system1: SystemDef = {
        name: 'System1',
        stage: SystemStage.Update,
        execute: jest.fn(),
      };

      const system2: SystemDef = {
        name: 'System2',
        stage: SystemStage.Update,
        enabled: false,
        execute: jest.fn(),
      };

      const system3: SystemDef = {
        name: 'System3',
        stage: SystemStage.Render,
        execute: jest.fn(),
      };

      scheduler.addSystems(system1, system2, system3);
      scheduler.update(0.016);
      scheduler.update(0.016);

      const stats = scheduler.getStats();

      expect(stats.totalSystems).toBe(3);
      expect(stats.enabledSystems).toBe(2);
      expect(stats.frameCount).toBe(2);
      expect(stats.totalTime).toBeCloseTo(0.032, 5);
      expect(stats.stageBreakdown['Update']).toBe(1);
      expect(stats.stageBreakdown['Render']).toBe(1);
    });
  });
});

describe('内置 System', () => {
  describe('TransformSystem', () => {
    it('应该定义正确的属性', () => {
      expect(TransformSystem.name).toBe('Transform');
      expect(TransformSystem.stage).toBe(SystemStage.PostUpdate);
      expect(TransformSystem.priority).toBe(0);
      expect(TransformSystem.query).toBeDefined();
    });
  });

  describe('HierarchySystem', () => {
    it('应该定义正确的属性', () => {
      expect(HierarchySystem.name).toBe('Hierarchy');
      expect(HierarchySystem.stage).toBe(SystemStage.PostUpdate);
      expect(HierarchySystem.priority).toBe(-10);
    });
  });

  describe('CleanupSystem', () => {
    it('应该定义正确的属性', () => {
      expect(CleanupSystem.name).toBe('Cleanup');
      expect(CleanupSystem.stage).toBe(SystemStage.FrameEnd);
      expect(CleanupSystem.priority).toBe(100);
    });
  });
});

describe('SystemContext', () => {
  it('应该提供 getResource 方法', () => {
    const world = new World();
    const scheduler = new SystemScheduler(world);

    class TestResource {
      value = 42;
    }

    world.insertResource(new TestResource());

    let resource: TestResource | undefined;

    const system: SystemDef = {
      name: 'TestSystem',
      stage: SystemStage.Update,
      execute: (ctx) => {
        resource = ctx.getResource(TestResource);
      },
    };

    scheduler.addSystem(system);
    scheduler.update(0.016);

    expect(resource).toBeDefined();
    expect(resource!.value).toBe(42);
  });
});
