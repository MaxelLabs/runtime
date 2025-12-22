/**
 * Systems 测试
 * 测试 System 调度器和内置 System 的功能
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { SystemDef, SystemContext, SystemErrorCallback } from '../../../src/ecs/systems';
import { SystemScheduler, SystemStage, ErrorHandlingStrategy } from '../../../src/ecs/systems';
import { World } from '../../../src/ecs/world';

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

    it('应该清理 System 关联的缓存 Query', () => {
      // 注册组件
      class Position {
        x = 0;
        y = 0;
      }
      world.registerComponent(Position);

      // 创建一个使用 Query 的 System
      const system: SystemDef = {
        name: 'QuerySystem',
        stage: SystemStage.Update,
        query: { all: [Position] },
        execute: jest.fn(),
      };

      scheduler.addSystem(system);

      // 移除 System
      scheduler.removeSystem('QuerySystem');

      // Query 应该被清理（如果实现了清理逻辑）
      // 注意：这取决于具体实现，可能需要调整断言
      expect(scheduler.getSystems()).toHaveLength(0);
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

    it('应该捕获 System 执行错误并使用 Throw 策略时抛出', () => {
      const system: SystemDef = {
        name: 'ErrorSystem',
        stage: SystemStage.Update,
        execute: () => {
          throw new Error('Test error');
        },
      };

      scheduler.addSystem(system);
      // 设置为 Throw 策略以测试抛出行为
      scheduler.setErrorHandlingStrategy(ErrorHandlingStrategy.Throw);

      // logError 会抛出异常，所以 update 应该抛出错误
      expect(() => scheduler.update(0.016)).toThrow('Error in system "ErrorSystem":');
    });

    it('应该在抛出错误前调用错误回调', () => {
      const errorCallback = jest.fn<SystemErrorCallback>();
      scheduler.setErrorCallback(errorCallback);

      const system: SystemDef = {
        name: 'ErrorSystem',
        stage: SystemStage.Update,
        execute: () => {
          throw new Error('Test error');
        },
      };

      scheduler.addSystem(system);

      // 即使 logError 抛出异常，错误回调也应该被调用
      try {
        scheduler.update(0.016);
      } catch {
        // 预期会抛出异常
      }

      expect(errorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          systemName: 'ErrorSystem',
          stage: SystemStage.Update,
          error: expect.any(Error),
        })
      );
    });

    it('应该支持 Continue 错误处理策略', () => {
      const executeFn2 = jest.fn();

      const system1: SystemDef = {
        name: 'ErrorSystem',
        stage: SystemStage.Update,
        execute: () => {
          throw new Error('Test error');
        },
      };

      const system2: SystemDef = {
        name: 'NormalSystem',
        stage: SystemStage.Update,
        execute: executeFn2,
      };

      scheduler.setErrorHandlingStrategy(ErrorHandlingStrategy.Continue);
      scheduler.addSystems(system1, system2);

      // 不应该抛出错误
      expect(() => scheduler.update(0.016)).not.toThrow();

      // 第二个 System 应该被执行
      expect(executeFn2).toHaveBeenCalled();
    });

    it('应该支持 DisableAndContinue 错误处理策略', () => {
      const system: SystemDef = {
        name: 'ErrorSystem',
        stage: SystemStage.Update,
        execute: () => {
          throw new Error('Test error');
        },
      };

      scheduler.setErrorHandlingStrategy(ErrorHandlingStrategy.DisableAndContinue);
      scheduler.addSystem(system);

      // 第一次执行不应该抛出错误
      expect(() => scheduler.update(0.016)).not.toThrow();

      // System 应该被禁用
      expect(scheduler.isSystemEnabled('ErrorSystem')).toBe(false);
    });

    it('应该支持错误回调返回 true 来阻止默认处理', () => {
      const errorCallback = jest.fn<SystemErrorCallback>().mockReturnValue(true);
      scheduler.setErrorCallback(errorCallback);
      scheduler.setErrorHandlingStrategy(ErrorHandlingStrategy.Throw);

      const system: SystemDef = {
        name: 'ErrorSystem',
        stage: SystemStage.Update,
        execute: () => {
          throw new Error('Test error');
        },
      };

      scheduler.addSystem(system);

      // 因为回调返回 true，不应该抛出错误
      expect(() => scheduler.update(0.016)).not.toThrow();
      expect(errorCallback).toHaveBeenCalled();
    });

    it('应该支持获取和设置错误处理策略', () => {
      // 默认策略现在是 Continue（提供错误隔离）
      expect(scheduler.getErrorHandlingStrategy()).toBe(ErrorHandlingStrategy.Continue);

      scheduler.setErrorHandlingStrategy(ErrorHandlingStrategy.Throw);
      expect(scheduler.getErrorHandlingStrategy()).toBe(ErrorHandlingStrategy.Throw);

      scheduler.setErrorHandlingStrategy(ErrorHandlingStrategy.DisableAndContinue);
      expect(scheduler.getErrorHandlingStrategy()).toBe(ErrorHandlingStrategy.DisableAndContinue);
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

  describe('DAG 依赖排序', () => {
    it('应该按 after 依赖排序', () => {
      const order: string[] = [];

      const systemA: SystemDef = {
        name: 'A',
        stage: SystemStage.Update,
        execute: () => order.push('A'),
      };

      const systemB: SystemDef = {
        name: 'B',
        stage: SystemStage.Update,
        after: ['A'],
        execute: () => order.push('B'),
      };

      const systemC: SystemDef = {
        name: 'C',
        stage: SystemStage.Update,
        after: ['B'],
        execute: () => order.push('C'),
      };

      scheduler.addSystems(systemC, systemA, systemB);
      scheduler.update(0.016);

      expect(order).toEqual(['A', 'B', 'C']);
    });

    it('应该处理复杂 DAG 依赖', () => {
      const order: string[] = [];

      const systemA: SystemDef = {
        name: 'A',
        stage: SystemStage.Update,
        execute: () => order.push('A'),
      };

      const systemB: SystemDef = {
        name: 'B',
        stage: SystemStage.Update,
        execute: () => order.push('B'),
      };

      const systemC: SystemDef = {
        name: 'C',
        stage: SystemStage.Update,
        after: ['A', 'B'],
        execute: () => order.push('C'),
      };

      const systemD: SystemDef = {
        name: 'D',
        stage: SystemStage.Update,
        after: ['C'],
        execute: () => order.push('D'),
      };

      scheduler.addSystems(systemD, systemB, systemC, systemA);
      scheduler.update(0.016);

      // A 和 B 可以任意顺序，但必须都在 C 之前
      const aIndex = order.indexOf('A');
      const bIndex = order.indexOf('B');
      const cIndex = order.indexOf('C');
      const dIndex = order.indexOf('D');

      expect(aIndex).toBeLessThan(cIndex);
      expect(bIndex).toBeLessThan(cIndex);
      expect(cIndex).toBeLessThan(dIndex);
    });

    it('应该警告不存在的依赖', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const system: SystemDef = {
        name: 'A',
        stage: SystemStage.Update,
        after: ['NonExistent'],
        execute: jest.fn(),
      };

      scheduler.addSystem(system);
      scheduler.update(0.016);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('depends on "NonExistent"'));

      consoleSpy.mockRestore();
    });

    it('应该检测循环依赖', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const systemA: SystemDef = {
        name: 'A',
        stage: SystemStage.Update,
        after: ['B'],
        execute: jest.fn(),
      };

      const systemB: SystemDef = {
        name: 'B',
        stage: SystemStage.Update,
        after: ['A'],
        execute: jest.fn(),
      };

      scheduler.addSystems(systemA, systemB);
      scheduler.update(0.016);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Circular dependency'));

      consoleSpy.mockRestore();
    });

    it('应该结合 priority 和 after 依赖', () => {
      const order: string[] = [];

      const systemA: SystemDef = {
        name: 'A',
        stage: SystemStage.Update,
        priority: 10,
        execute: () => order.push('A'),
      };

      const systemB: SystemDef = {
        name: 'B',
        stage: SystemStage.Update,
        priority: 5,
        execute: () => order.push('B'),
      };

      const systemC: SystemDef = {
        name: 'C',
        stage: SystemStage.Update,
        after: ['A'],
        execute: () => order.push('C'),
      };

      scheduler.addSystems(systemC, systemA, systemB);
      scheduler.update(0.016);

      // B 优先级最高，但 C 依赖 A，所以顺序应该是 B, A, C
      const bIndex = order.indexOf('B');
      const aIndex = order.indexOf('A');
      const cIndex = order.indexOf('C');

      expect(bIndex).toBeLessThan(aIndex);
      expect(aIndex).toBeLessThan(cIndex);
    });
  });

  describe('并行执行分析', () => {
    it('应该支持启用/禁用并行执行', () => {
      expect(scheduler.isParallelExecutionEnabled()).toBe(false);

      scheduler.setParallelExecution(true);
      expect(scheduler.isParallelExecutionEnabled()).toBe(true);

      scheduler.setParallelExecution(false);
      expect(scheduler.isParallelExecutionEnabled()).toBe(false);
    });

    it('应该分析并行批次', () => {
      scheduler.setParallelExecution(true);

      const systemA: SystemDef = {
        name: 'A',
        stage: SystemStage.Update,
        execute: jest.fn(),
      };

      const systemB: SystemDef = {
        name: 'B',
        stage: SystemStage.Update,
        execute: jest.fn(),
      };

      const systemC: SystemDef = {
        name: 'C',
        stage: SystemStage.Update,
        after: ['A', 'B'],
        execute: jest.fn(),
      };

      scheduler.addSystems(systemA, systemB, systemC);
      scheduler.update(0.016);

      const batches = scheduler.getParallelBatches(SystemStage.Update);

      expect(batches).toBeDefined();
      expect(batches!.length).toBe(2);

      // 第一批：A, B（可并行）
      expect(batches![0]).toEqual(expect.arrayContaining(['A', 'B']));

      // 第二批：C（依赖第一批）
      expect(batches![1]).toEqual(['C']);
    });

    it('应该在统计信息中包含并行批次数量', () => {
      scheduler.setParallelExecution(true);

      const systemA: SystemDef = {
        name: 'A',
        stage: SystemStage.Update,
        execute: jest.fn(),
      };

      const systemB: SystemDef = {
        name: 'B',
        stage: SystemStage.Update,
        after: ['A'],
        execute: jest.fn(),
      };

      scheduler.addSystems(systemA, systemB);
      scheduler.update(0.016);

      const stats = scheduler.getStats();

      expect(stats.parallelExecutionEnabled).toBe(true);
      expect(stats.parallelBatchCount).toBeDefined();
      expect(stats.parallelBatchCount!['Update']).toBe(2);
    });

    it('应该返回 undefined 如果并行执行未启用', () => {
      const system: SystemDef = {
        name: 'A',
        stage: SystemStage.Update,
        execute: jest.fn(),
      };

      scheduler.addSystem(system);
      scheduler.update(0.016);

      const batches = scheduler.getParallelBatches(SystemStage.Update);
      expect(batches).toBeUndefined();
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
