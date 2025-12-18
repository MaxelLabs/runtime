/**
 * 依赖注入容器 (Inversion of Control Container)
 * 用于解决组件之间的循环依赖问题，实现松耦合的架构
 *
 * @remarks
 * **使用限制**：
 * - 此容器使用单例模式，适用于主线程中的依赖注入
 * - **不支持 Web Workers**：每个 Worker 有独立的全局作用域，单例不会共享
 * - 如需在 Worker 中使用依赖注入，应在每个 Worker 中创建独立的容器实例
 * - 异步初始化场景下，确保在使用服务前完成注册
 *
 * @example
 * ```typescript
 * // 主线程中使用
 * const container = Container.getInstance();
 * container.register('myService', new MyService());
 *
 * // 在 Worker 中，需要创建独立实例
 * // worker.ts
 * const workerContainer = new Container(); // 不使用 getInstance
 * ```
 */
export class Container {
  private static instance: Container | null = null;
  private services: Map<string, any> = new Map();
  private factories: Map<string, () => any> = new Map();

  /**
   * 私有构造函数，推荐使用 getInstance() 获取单例
   * @remarks 如需在 Web Worker 中使用，可直接 new Container() 创建独立实例
   */
  constructor() {}

  /**
   * 获取容器单例
   *
   * @remarks
   * JavaScript 是单线程的，在同步代码中不需要复杂的并发控制。
   * 但请注意：
   * - 此单例仅在当前执行上下文（主线程或特定 Worker）中有效
   * - Web Workers 有独立的全局作用域，不会共享此单例
   */
  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }

    return Container.instance;
  }

  /**
   * 注册服务实例
   * @param key 服务标识符
   * @param instance 服务实例
   */
  register<T>(key: string, instance: T): void {
    this.services.set(key, instance);
  }

  /**
   * 注册服务工厂函数
   * @param key 服务标识符
   * @param factory 创建服务实例的工厂函数
   */
  registerFactory<T>(key: string, factory: () => T): void {
    this.factories.set(key, factory);
  }

  /**
   * 获取服务实例
   * @param key 服务标识符
   * @returns 服务实例
   */
  resolve<T>(key: string): T {
    // 如果服务已经注册，直接返回
    if (this.services.has(key)) {
      return this.services.get(key) as T;
    }

    // 如果有工厂函数，则创建实例并注册
    if (this.factories.has(key)) {
      const factory = this.factories.get(key)!;
      const instance = factory();

      this.services.set(key, instance);

      return instance as T;
    }

    throw new Error(
      `Service '${key}' not registered in container. Use register() or registerFactory() to register the service first.`
    );
  }

  /**
   * 检查服务是否已注册
   * @param key 服务标识符
   * @returns 是否已注册
   */
  has(key: string): boolean {
    return this.services.has(key) || this.factories.has(key);
  }

  /**
   * 移除已注册的服务
   * @param key 服务标识符
   */
  remove(key: string): void {
    this.services.delete(key);
    this.factories.delete(key);
  }

  /**
   * 清空容器
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
  }
}

/**
 * 服务标识符常量
 */
export const ServiceKeys = {
  ENGINE: 'engine',
  RENDER_CONTEXT: 'render_context',
  SCENE_MANAGER: 'scene_manager',
  RESOURCE_MANAGER: 'resource_manager',
  EVENT_MANAGER: 'event_manager',
  INPUT_MANAGER: 'input_manager',
  RENDERER: 'renderer',
  TIME: 'time',
};
