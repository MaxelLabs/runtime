import { EventDispatcher } from './base/event-dispatcher';
import { Container, ServiceKeys } from './base/IOC';
import { Time } from './base/time';
import type { Scene } from './scene/scene';
import type { SceneManager } from './scene/scene-manager';
import type { ResourceManager } from './resource/resource-manager';
import type { RenderContext } from './renderer/render-context';
import type { InputManager } from './input/input-manager';

/**
 * 渲染器配置选项
 */
export interface RendererOptions {
  /** 画布元素或选择器 */
  canvas?: HTMLCanvasElement | string;
  /** 抗锯齿 */
  antialias?: boolean;
  /** 背景色 */
  backgroundColor?: [number, number, number, number];
  /** 是否透明 */
  alpha?: boolean;
  /** 深度缓冲 */
  depth?: boolean;
  /** 模板缓冲 */
  stencil?: boolean;
  /** 设备像素比 */
  devicePixelRatio?: number;
}

/**
 * 引擎配置选项
 */
export interface EngineOptions extends RendererOptions {
  /** 目标帧率 */
  targetFrameRate?: number;
  /** 是否自动启动引擎 */
  autoStart?: boolean;
  /** 是否启用物理系统 */
  enablePhysics?: boolean;
  /** 是否启用音频系统 */
  enableAudio?: boolean;
  /** 是否启用调试模式 */
  debug?: boolean;
  /** 是否启用垂直同步 */
  enableVSync?: boolean;
  /** 最大帧时间（毫秒） */
  maxFrameTime?: number;
}

/**
 * 引擎状态枚举
 */
export enum EngineState {
  /** 未初始化 */
  UNINITIALIZED = 'uninitialized',
  /** 初始化中 */
  INITIALIZING = 'initializing',
  /** 运行中 */
  RUNNING = 'running',
  /** 暂停 */
  PAUSED = 'paused',
  /** 已销毁 */
  DESTROYED = 'destroyed',
}

/**
 * 系统接口
 */
export interface ISystem {
  /** 系统名称 */
  readonly name: string;
  /** 初始化系统 */
  initialize(): Promise<void> | void;
  /** 更新系统 */
  update(deltaTime: number): void;
  /** 销毁系统 */
  destroy(): void;
  /** 系统是否启用 */
  enabled: boolean;
}

/**
 * 主循环控制器
 */
class MainLoop {
  private targetFrameRate: number = 60;
  private enableVSync: boolean = true;
  private maxFrameTime: number = 33.33; // 30fps最低
  private lastFrameTime: number = 0;
  private frameTimeAccumulator: number = 0;
  private frameCount: number = 0;
  private fpsCounter: number = 0;
  private fpsUpdateTime: number = 0;
  private isRunning: boolean = false;
  private animationFrameId: number = 0;
  private updateCallback: (deltaTime: number) => void;
  private renderCallback: () => void;

  constructor(
    updateCallback: (deltaTime: number) => void,
    renderCallback: () => void,
    targetFrameRate: number = 60,
    enableVSync: boolean = true,
    maxFrameTime: number = 33.33
  ) {
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
    this.targetFrameRate = targetFrameRate;
    this.enableVSync = enableVSync;
    this.maxFrameTime = maxFrameTime;
  }

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.fpsUpdateTime = this.lastFrameTime;
    this.loop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  private loop = (): void => {
    if (!this.isRunning) {
      return;
    }

    const currentTime = performance.now();
    let deltaTime = (currentTime - this.lastFrameTime) / 1000;

    // 限制最大帧时间，避免spiral of death
    deltaTime = Math.min(deltaTime, this.maxFrameTime / 1000);

    this.lastFrameTime = currentTime;

    // 更新FPS计数器
    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fpsCounter = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }

    // 固定时间步长 or 可变时间步长
    if (this.enableVSync) {
      // 可变时间步长，与显示器刷新率同步
      this.updateCallback(deltaTime);
      this.renderCallback();
    } else {
      // 固定时间步长
      const targetFrameTime = 1000 / this.targetFrameRate;
      this.frameTimeAccumulator += deltaTime * 1000;

      while (this.frameTimeAccumulator >= targetFrameTime) {
        this.updateCallback(targetFrameTime / 1000);
        this.frameTimeAccumulator -= targetFrameTime;
      }
      this.renderCallback();
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  setTargetFrameRate(fps: number): void {
    this.targetFrameRate = Math.max(1, Math.min(fps, 144));
  }

  getFrameRate(): number {
    return this.fpsCounter;
  }

  getDeltaTime(): number {
    return (performance.now() - this.lastFrameTime) / 1000;
  }
}

/**
 * 性能监控器
 */
class PerformanceMonitor {
  private frameTimeHistory: number[] = [];
  private maxHistorySize: number = 60;
  private gpuMemoryUsage: number = 0;
  private cpuMemoryUsage: number = 0;
  private drawCallCount: number = 0;
  private triangleCount: number = 0;

  updateFrameTime(deltaTime: number): void {
    this.frameTimeHistory.push(deltaTime * 1000);
    if (this.frameTimeHistory.length > this.maxHistorySize) {
      this.frameTimeHistory.shift();
    }
  }

  getAverageFrameTime(): number {
    if (this.frameTimeHistory.length === 0) {
      return 0;
    }
    const sum = this.frameTimeHistory.reduce((a, b) => a + b, 0);
    return sum / this.frameTimeHistory.length;
  }

  getMinFrameTime(): number {
    return this.frameTimeHistory.length > 0 ? Math.min(...this.frameTimeHistory) : 0;
  }

  getMaxFrameTime(): number {
    return this.frameTimeHistory.length > 0 ? Math.max(...this.frameTimeHistory) : 0;
  }

  updateRenderStats(drawCalls: number, triangles: number): void {
    this.drawCallCount = drawCalls;
    this.triangleCount = triangles;
  }

  updateMemoryUsage(): void {
    // @ts-expect-error
    if (performance.memory) {
      // @ts-expect-error
      this.cpuMemoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
    }
  }

  getStats() {
    return {
      averageFrameTime: this.getAverageFrameTime(),
      minFrameTime: this.getMinFrameTime(),
      maxFrameTime: this.getMaxFrameTime(),
      cpuMemoryMB: this.cpuMemoryUsage,
      gpuMemoryMB: this.gpuMemoryUsage,
      drawCalls: this.drawCallCount,
      triangles: this.triangleCount,
    };
  }
}

/**
 * 3D引擎核心类
 * 负责管理引擎生命周期、更新循环、场景管理和渲染
 */
export class Engine extends EventDispatcher {
  /** IOC容器 */
  private container: Container;
  /** 引擎状态 */
  private state: EngineState = EngineState.UNINITIALIZED;
  /** 系统管理器 */
  private systems: Map<string, ISystem> = new Map();
  /** 主循环控制器 */
  private mainLoop: MainLoop;
  /** 时间管理器 */
  private time: Time;
  /** 场景管理器 */
  private sceneManager: SceneManager;
  /** 资源管理器 */
  private resourceManager: ResourceManager;
  /** 输入管理器 */
  private inputManager: InputManager;
  /** 渲染上下文 */
  private renderContext: RenderContext;
  /** 引擎配置选项 */
  private options: EngineOptions;
  /** 调试模式 */
  private debugMode: boolean = false;
  /** 性能监控器 */
  private performanceMonitor: PerformanceMonitor;

  /**
   * 创建引擎实例
   * @param options 引擎配置选项
   */
  constructor(options: EngineOptions = {}) {
    super();
    this.options = {
      targetFrameRate: 60,
      autoStart: false,
      enablePhysics: false,
      enableAudio: false,
      debug: false,
      enableVSync: true,
      maxFrameTime: 33.33,
      antialias: true,
      depth: true,
      stencil: false,
      alpha: false,
      backgroundColor: [0.2, 0.2, 0.2, 1.0],
      devicePixelRatio: window.devicePixelRatio || 1,
      ...options,
    };

    this.debugMode = this.options.debug || false;
    this.container = Container.getInstance();
    this.performanceMonitor = new PerformanceMonitor();

    // 注册自身到IOC容器
    this.container.register(ServiceKeys.ENGINE, this);

    // 创建主循环
    this.mainLoop = new MainLoop(
      this.update.bind(this),
      this.render.bind(this),
      this.options.targetFrameRate,
      this.options.enableVSync,
      this.options.maxFrameTime
    );
  }

  /**
   * 初始化引擎
   * @returns Promise<void>
   */
  async initialize(): Promise<void> {
    if (this.state !== EngineState.UNINITIALIZED) {
      console.warn('Engine already initialized or initializing');
      return;
    }

    this.state = EngineState.INITIALIZING;

    try {
      // 创建核心系统
      await this.initializeCoreServices();

      // 初始化所有注册的系统
      await this.initializeSystems();

      this.state = EngineState.PAUSED;

      // 触发初始化完成事件
      this.dispatchEvent('initialized');

      // 自动启动引擎(如果配置了autoStart)
      if (this.options.autoStart) {
        this.start();
      }

      if (this.debugMode) {
        // eslint-disable-next-line no-console
        console.log('Engine initialized successfully');
        // eslint-disable-next-line no-console
        console.log('Registered systems:', Array.from(this.systems.keys()));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize engine:', error);
      this.state = EngineState.UNINITIALIZED;
      throw error;
    }
  }

  /**
   * 初始化核心服务
   */
  private async initializeCoreServices(): Promise<void> {
    // 创建时间管理器
    this.time = new Time();
    this.container.register(ServiceKeys.TIME, this.time);

    // TODO: 其他核心服务的初始化将在后续实现
    // this.renderContext = new RenderContext();
    // this.container.register(ServiceKeys.RENDER_CONTEXT, this.renderContext);

    // this.resourceManager = new ResourceManager(this);
    // this.container.register(ServiceKeys.RESOURCE_MANAGER, this.resourceManager);

    // this.sceneManager = new SceneManager();
    // this.container.register(ServiceKeys.SCENE_MANAGER, this.sceneManager);

    // this.inputManager = new InputManager();
    // this.container.register(ServiceKeys.INPUT_MANAGER, this.inputManager);
  }

  /**
   * 初始化所有系统
   */
  private async initializeSystems(): Promise<void> {
    for (const [name, system] of this.systems) {
      try {
        if (this.debugMode) {
          // eslint-disable-next-line no-console
          console.log(`Initializing system: ${name}`);
        }
        await system.initialize();
      } catch (error) {
        console.error(`Failed to initialize system ${name}:`, error);
        throw error;
      }
    }
  }

  /**
   * 注册系统
   * @param system 系统实例
   */
  registerSystem(system: ISystem): void {
    if (this.systems.has(system.name)) {
      console.warn(`System ${system.name} already registered`);
      return;
    }

    this.systems.set(system.name, system);

    if (this.debugMode) {
      // eslint-disable-next-line no-console
      console.log(`System registered: ${system.name}`);
    }
  }

  /**
   * 注销系统
   * @param name 系统名称
   */
  unregisterSystem(name: string): void {
    const system = this.systems.get(name);
    if (system) {
      system.destroy();
      this.systems.delete(name);

      if (this.debugMode) {
        // eslint-disable-next-line no-console
        console.log(`System unregistered: ${name}`);
      }
    }
  }

  /**
   * 获取系统
   * @param name 系统名称
   */
  getSystem<T extends ISystem>(name: string): T | undefined {
    return this.systems.get(name) as T;
  }

  /**
   * 启动引擎
   */
  start(): void {
    if (this.state === EngineState.RUNNING) {
      return;
    }

    if (this.state === EngineState.UNINITIALIZED || this.state === EngineState.INITIALIZING) {
      console.warn('Engine not initialized. Call initialize() first.');
      return;
    }

    this.state = EngineState.RUNNING;
    this.mainLoop.start();

    // 触发启动事件
    this.dispatchEvent('started');

    if (this.debugMode) {
      // eslint-disable-next-line no-console
      console.log('Engine started');
    }
  }

  /**
   * 暂停引擎
   */
  pause(): void {
    if (this.state !== EngineState.RUNNING) {
      return;
    }

    this.state = EngineState.PAUSED;
    this.mainLoop.stop();

    // 触发暂停事件
    this.dispatchEvent('paused');

    if (this.debugMode) {
      // eslint-disable-next-line no-console
      console.log('Engine paused');
    }
  }

  /**
   * 恢复引擎
   */
  resume(): void {
    if (this.state !== EngineState.PAUSED) {
      return;
    }

    this.start();
  }

  /**
   * 引擎更新循环
   * @param deltaTime 帧时间间隔
   */
  private update(deltaTime: number): void {
    // 更新性能监控
    this.performanceMonitor.updateFrameTime(deltaTime);
    this.performanceMonitor.updateMemoryUsage();

    // 更新时间管理器
    this.time.update(deltaTime * 1000);

    // 更新输入管理器
    if (this.inputManager) {
      this.inputManager.update();
    }

    // 更新所有启用的系统
    for (const system of this.systems.values()) {
      if (system.enabled) {
        system.update(deltaTime);
      }
    }

    // 更新场景管理器
    if (this.sceneManager) {
      this.sceneManager.update(deltaTime);
    }

    // 触发更新事件
    this.dispatchEvent('update', { deltaTime });
  }

  /**
   * 引擎渲染循环
   */
  private render(): void {
    // TODO: 实现渲染流程
    // if (this.renderer && this.sceneManager) {
    //   const activeScene = this.sceneManager.getActiveScene();
    //   if (activeScene) {
    //     this.renderer.render(activeScene);
    //   }
    // }

    // 触发渲染事件
    this.dispatchEvent('render');
  }

  /**
   * 设置引擎目标帧率
   * @param fps 每秒帧数
   */
  setTargetFrameRate(fps: number): void {
    this.mainLoop.setTargetFrameRate(fps);
    this.options.targetFrameRate = fps;
  }

  /**
   * 获取当前帧率
   */
  getFrameRate(): number {
    return this.mainLoop.getFrameRate();
  }

  /**
   * 创建场景
   * @param name 场景名称
   * @returns 创建的场景
   */
  createScene(name?: string): Scene {
    if (!this.sceneManager) {
      throw new Error('Scene manager not initialized');
    }
    return this.sceneManager.createScene(name);
  }

  /**
   * 加载场景
   * @param scene 要加载的场景
   */
  loadScene(scene: Scene): void {
    if (!this.sceneManager) {
      throw new Error('Scene manager not initialized');
    }
    this.sceneManager.loadScene(scene);
  }

  /**
   * 销毁引擎
   */
  override destroy(): void {
    if (this.state === EngineState.DESTROYED) {
      return;
    }

    // 触发销毁前事件
    this.dispatchEvent('beforeDestroy');

    // 停止主循环
    this.mainLoop.stop();

    // 销毁所有系统
    for (const [name, system] of this.systems) {
      try {
        system.destroy();
        if (this.debugMode) {
          // eslint-disable-next-line no-console
          console.log(`System destroyed: ${name}`);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Failed to destroy system ${name}:`, error);
      }
    }
    this.systems.clear();

    // 销毁各个管理器
    if (this.sceneManager) {
      this.sceneManager.destroy();
    }
    if (this.resourceManager) {
      this.resourceManager.destroy();
    }
    if (this.inputManager) {
      this.inputManager.destroy();
    }

    // 清理IOC容器
    this.container.clear();

    this.state = EngineState.DESTROYED;

    // 触发销毁完成事件
    this.dispatchEvent('destroyed');

    if (this.debugMode) {
      // eslint-disable-next-line no-console
      console.log('Engine destroyed');
    }
  }

  /**
   * 获取引擎状态
   * @returns 当前引擎状态
   */
  getState(): EngineState {
    return this.state;
  }

  /**
   * 获取场景管理器
   * @returns 场景管理器实例
   */
  getSceneManager(): SceneManager {
    if (!this.sceneManager) {
      throw new Error('Scene manager not initialized');
    }
    return this.sceneManager;
  }

  /**
   * 获取资源管理器
   * @returns 资源管理器实例
   */
  getResourceManager(): ResourceManager {
    if (!this.resourceManager) {
      throw new Error('Resource manager not initialized');
    }
    return this.resourceManager;
  }

  /**
   * 获取输入管理器
   * @returns 输入管理器实例
   */
  getInputManager(): InputManager {
    if (!this.inputManager) {
      throw new Error('Input manager not initialized');
    }
    return this.inputManager;
  }

  /**
   * 获取时间管理器
   * @returns 时间管理器实例
   */
  getTime(): Time {
    if (!this.time) {
      throw new Error('Time manager not initialized');
    }
    return this.time;
  }

  /**
   * 获取渲染上下文
   * @returns 渲染上下文实例
   */
  getRenderContext(): RenderContext {
    if (!this.renderContext) {
      throw new Error('Render context not initialized');
    }
    return this.renderContext;
  }

  /**
   * 获取性能统计信息
   */
  getPerformanceStats() {
    return this.performanceMonitor.getStats();
  }

  /**
   * 获取引擎配置选项
   */
  getOptions(): EngineOptions {
    return { ...this.options };
  }

  /**
   * 获取调试模式状态
   * @returns 是否启用调试模式
   */
  isDebugMode(): boolean {
    return this.debugMode;
  }

  /**
   * 设置调试模式
   * @param enabled 是否启用调试模式
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * 获取IOC容器
   * @returns IOC容器实例
   */
  getContainer(): Container {
    return this.container;
  }
}
