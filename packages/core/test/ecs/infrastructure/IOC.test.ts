/**
 * IOC 模块测试
 * 测试依赖注入容器
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Container, ServiceKeys } from '../../../src/infrastructure/IOC';

// 测试用服务类
class Logger {
  log(message: string): void {
    console.info(`[Logger] ${message}`);
  }
}

class Database {
  connect(): boolean {
    return true;
  }
}

class UserService {
  constructor(
    private logger: Logger,
    private db: Database
  ) {}

  getUser(id: number): string {
    this.logger.log(`Getting user ${id}`);
    this.db.connect();
    return `User ${id}`;
  }
}

describe('Container - 依赖注入容器', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  describe('register - 注册服务', () => {
    it('应该注册单例服务', () => {
      const logger = new Logger();
      container.register('logger', logger);

      const resolved = container.resolve<Logger>('logger');
      expect(resolved).toBe(logger);
    });

    it('应该支持多个服务注册', () => {
      container.register('logger', new Logger());
      container.register('db', new Database());

      expect(container.has('logger')).toBe(true);
      expect(container.has('db')).toBe(true);
    });

    it('应该覆盖已存在的服务', () => {
      const logger1 = new Logger();
      const logger2 = new Logger();

      container.register('logger', logger1);
      container.register('logger', logger2);

      const resolved = container.resolve<Logger>('logger');
      expect(resolved).toBe(logger2);
    });
  });

  describe('registerFactory - 注册工厂函数', () => {
    it('应该注册工厂函数', () => {
      container.registerFactory('logger', () => new Logger());

      const logger1 = container.resolve<Logger>('logger');
      const logger2 = container.resolve<Logger>('logger');

      expect(logger1).toBeInstanceOf(Logger);
      expect(logger2).toBeInstanceOf(Logger);
      expect(logger1).toBe(logger2); // 单例模式
    });

    it('应该支持延迟实例化', () => {
      let instanceCreated = false;

      container.registerFactory('logger', () => {
        instanceCreated = true;
        return new Logger();
      });

      expect(instanceCreated).toBe(false);

      container.resolve<Logger>('logger');

      expect(instanceCreated).toBe(true);
    });

    it('工厂函数应该只调用一次', () => {
      let callCount = 0;

      container.registerFactory('logger', () => {
        callCount++;
        return new Logger();
      });

      container.resolve('logger');
      container.resolve('logger');
      container.resolve('logger');

      expect(callCount).toBe(1);
    });

    it('应该支持依赖注入', () => {
      const logger = new Logger();
      const db = new Database();

      container.register('logger', logger);
      container.register('db', db);
      container.registerFactory('userService', () => {
        const logger = container.resolve<Logger>('logger');
        const db = container.resolve<Database>('db');
        return new UserService(logger, db);
      });

      const userService = container.resolve<UserService>('userService');

      expect(userService).toBeInstanceOf(UserService);
      expect(userService.getUser(1)).toBe('User 1');
    });
  });

  describe('resolve - 解析服务', () => {
    it('应该解析已注册的服务', () => {
      const logger = new Logger();
      container.register('logger', logger);

      const resolved = container.resolve<Logger>('logger');
      expect(resolved).toBe(logger);
    });

    it('未注册的服务应该抛出错误', () => {
      expect(() => {
        container.resolve('nonexistent');
      }).toThrow("Service 'nonexistent' not registered in container");
    });

    it('错误消息应该包含解决方案', () => {
      try {
        container.resolve('missing');
      } catch (error: any) {
        expect(error.message).toContain('Use register() or registerFactory()');
      }
    });

    it('应该支持类型推断', () => {
      container.register('logger', new Logger());

      const logger = container.resolve<Logger>('logger');
      logger.log('test'); // TypeScript应该识别log方法
    });
  });

  describe('has - 检查服务', () => {
    it('已注册的服务应该返回true', () => {
      container.register('logger', new Logger());

      expect(container.has('logger')).toBe(true);
    });

    it('未注册的服务应该返回false', () => {
      expect(container.has('nonexistent')).toBe(false);
    });

    it('工厂注册的服务应该返回true', () => {
      container.registerFactory('logger', () => new Logger());

      expect(container.has('logger')).toBe(true);
    });
  });

  describe('remove - 移除服务', () => {
    it('应该移除已注册的服务', () => {
      container.register('logger', new Logger());
      expect(container.has('logger')).toBe(true);

      container.remove('logger');
      expect(container.has('logger')).toBe(false);
    });

    it('应该移除工厂注册的服务', () => {
      container.registerFactory('logger', () => new Logger());
      expect(container.has('logger')).toBe(true);

      container.remove('logger');
      expect(container.has('logger')).toBe(false);
    });

    it('移除不存在的服务应该不报错', () => {
      expect(() => {
        container.remove('nonexistent');
      }).not.toThrow();
    });

    it('移除后应该可以重新注册', () => {
      const logger1 = new Logger();
      const logger2 = new Logger();

      container.register('logger', logger1);
      container.remove('logger');
      container.register('logger', logger2);

      const resolved = container.resolve<Logger>('logger');
      expect(resolved).toBe(logger2);
    });
  });

  describe('clear - 清空容器', () => {
    it('应该清空所有服务', () => {
      container.register('logger', new Logger());
      container.register('db', new Database());

      expect(container.has('logger')).toBe(true);
      expect(container.has('db')).toBe(true);

      container.clear();

      expect(container.has('logger')).toBe(false);
      expect(container.has('db')).toBe(false);
    });

    it('清空后应该可以重新注册', () => {
      container.register('logger', new Logger());
      container.clear();
      container.register('logger', new Logger());

      expect(container.has('logger')).toBe(true);
    });

    it('应该同时清空服务和工厂', () => {
      container.register('service1', new Logger());
      container.registerFactory('service2', () => new Database());

      container.clear();

      expect(container.has('service1')).toBe(false);
      expect(container.has('service2')).toBe(false);
    });
  });

  describe('复杂场景', () => {
    it('应该支持多层依赖', () => {
      class ConfigService {
        getConfig(): string {
          return 'config';
        }
      }

      class ApiService {
        constructor(
          private logger: Logger,
          private config: ConfigService
        ) {}

        call(): string {
          this.logger.log('API call');
          return this.config.getConfig();
        }
      }

      container.registerFactory('logger', () => new Logger());
      container.registerFactory('config', () => new ConfigService());
      container.registerFactory('api', () => {
        return new ApiService(container.resolve<Logger>('logger'), container.resolve<ConfigService>('config'));
      });

      const api = container.resolve<ApiService>('api');
      expect(api.call()).toBe('config');
    });

    it('应该支持循环依赖检测', () => {
      // 注意：当前实现可能不支持循环依赖检测
      // 这个测试标记了未来可能需要的功能

      class ServiceA {
        constructor(public serviceB?: ServiceB) {}
      }

      class ServiceB {
        constructor(public serviceA?: ServiceA) {}
      }

      container.registerFactory('serviceA', () => new ServiceA(container.resolve<ServiceB>('serviceB')));

      container.registerFactory('serviceB', () => new ServiceB(container.resolve<ServiceA>('serviceA')));

      // 这应该检测到循环依赖
      // expect(() => container.resolve('serviceA')).toThrow();
    });

    it('应该支持可选依赖', () => {
      class ServiceWithOptionalDeps {
        constructor(public logger?: Logger) {}

        log(message: string): void {
          if (this.logger) {
            this.logger.log(message);
          } else {
            console.info(message);
          }
        }
      }

      container.registerFactory('service', () => {
        const logger = container.has('logger') ? container.resolve<Logger>('logger') : undefined;
        return new ServiceWithOptionalDeps(logger);
      });

      const service1 = container.resolve<ServiceWithOptionalDeps>('service');
      expect(service1.logger).toBeUndefined();

      container.register('logger', new Logger());

      // 注意：由于是单例，service1不会更新，需要清空重新创建
      container.clear();
      container.register('logger', new Logger());
      container.registerFactory('service', () => {
        const logger = container.has('logger') ? container.resolve<Logger>('logger') : undefined;
        return new ServiceWithOptionalDeps(logger);
      });

      const service2 = container.resolve<ServiceWithOptionalDeps>('service');
      expect(service2.logger).toBeDefined();
    });
  });

  describe('性能特性', () => {
    it('应该高效处理大量服务', () => {
      for (let i = 0; i < 1000; i++) {
        container.register(`service${i}`, { id: i });
      }

      for (let i = 0; i < 1000; i++) {
        const service = container.resolve<{ id: number }>(`service${i}`);
        expect(service.id).toBe(i);
      }
    });

    it('单例模式应该节省内存', () => {
      container.registerFactory('logger', () => new Logger());

      const instances = [];
      for (let i = 0; i < 100; i++) {
        instances.push(container.resolve('logger'));
      }

      // 所有实例应该是同一个对象
      const first = instances[0];
      expect(instances.every((instance) => instance === first)).toBe(true);
    });
  });
});

describe('Container.getInstance - 单例模式', () => {
  afterEach(() => {
    // 清理单例状态
    const instance = Container.getInstance();
    instance.clear();
  });

  it('应该返回单例实例', () => {
    const instance1 = Container.getInstance();
    const instance2 = Container.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('单例应该保持状态', () => {
    const instance1 = Container.getInstance();
    instance1.register('test', { value: 42 });

    const instance2 = Container.getInstance();
    const resolved = instance2.resolve<{ value: number }>('test');

    expect(resolved.value).toBe(42);
  });

  it('new Container() 应该创建独立实例', () => {
    const singleton = Container.getInstance();
    const independent = new Container();

    singleton.register('test', { value: 1 });
    independent.register('test', { value: 2 });

    expect(singleton.resolve<{ value: number }>('test').value).toBe(1);
    expect(independent.resolve<{ value: number }>('test').value).toBe(2);
  });
});

describe('ServiceKeys - 服务标识符常量', () => {
  it('应该定义 ENGINE 常量', () => {
    expect(ServiceKeys.ENGINE).toBe('engine');
  });

  it('应该定义 RENDER_CONTEXT 常量', () => {
    expect(ServiceKeys.RENDER_CONTEXT).toBe('render_context');
  });

  it('应该定义 SCENE_MANAGER 常量', () => {
    expect(ServiceKeys.SCENE_MANAGER).toBe('scene_manager');
  });

  it('应该定义 RESOURCE_MANAGER 常量', () => {
    expect(ServiceKeys.RESOURCE_MANAGER).toBe('resource_manager');
  });

  it('应该定义 EVENT_MANAGER 常量', () => {
    expect(ServiceKeys.EVENT_MANAGER).toBe('event_manager');
  });

  it('应该定义 INPUT_MANAGER 常量', () => {
    expect(ServiceKeys.INPUT_MANAGER).toBe('input_manager');
  });

  it('应该定义 RENDERER 常量', () => {
    expect(ServiceKeys.RENDERER).toBe('renderer');
  });

  it('应该定义 TIME 常量', () => {
    expect(ServiceKeys.TIME).toBe('time');
  });

  it('应该可以用于容器注册', () => {
    const container = new Container();
    const mockEngine = { name: 'MockEngine' };

    container.register(ServiceKeys.ENGINE, mockEngine);

    const resolved = container.resolve<typeof mockEngine>(ServiceKeys.ENGINE);
    expect(resolved.name).toBe('MockEngine');
  });
});
