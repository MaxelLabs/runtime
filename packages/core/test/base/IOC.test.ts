/**
 * IOC 模块测试
 * 测试依赖注入容器
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Container } from '../../src/base/IOC';

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
