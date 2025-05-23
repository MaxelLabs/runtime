/**
 * 依赖注入容器 (Inversion of Control Container)
 * 用于解决组件之间的循环依赖问题，实现松耦合的架构
 */
export class Container {
  private static instance: Container;
  private services: Map<string, any> = new Map();
  private factories: Map<string, () => any> = new Map();

  /**
   * 获取容器单例
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

    throw new Error(`Service '${key}' not registered in container`);
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
