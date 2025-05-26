import { EventDispatcher } from './base/event-dispatcher';
import { Container, ServiceKeys } from './base/IOC';
import type { Time } from './base/Time-obc';
import type { Scene } from './scene/Scene';
import type { SceneManager } from './scene/scene-manager';
import type { ResourceManager } from './resource/resource-manager';
import type { RenderContext } from './renderer/render-context';
import type { InputManager } from './input/InputManager';

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
}

/**
 * 引擎状态枚举
 */
export enum EngineState {
  /** 未初始化 */
  UNINITIALIZED,
  /** 初始化中 */
  INITIALIZING,
  /** 运行中 */
  RUNNING,
  /** 暂停 */
  PAUSED,
  /** 已销毁 */
  DESTROYED,
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
  /** 渲染器实例 */
  private renderer: IRenderer;
  /** 场景管理器 */
  private sceneManager: SceneManager;
  /** 资源管理器 */
  private resourceManager: ResourceManager;
  /** 输入管理器 */
  private inputManager: InputManager;
  /** 时间管理器 */
  private time: Time;
  /** 渲染上下文 */
  private renderContext: RenderContext;
  /** 目标帧率 */
  private targetFrameRate: number = 60;
  /** 上一帧时间戳 */
  private lastFrameTime: number = 0;
  /** 是否在运行中 */
  private isRunning: boolean = false;
  /** 动画帧请求ID */
  private animationFrameId: number = 0;
  /** 引擎配置选项 */
  private options: EngineOptions;
  /** 调试模式 */
  private debugMode: boolean = false;

  /**
   * 创建引擎实例
   * @param options 引擎配置选项
   */
  constructor(options: EngineOptions) {
    super();
    this.options = options;
    this.targetFrameRate = options.targetFrameRate || 60;
    this.debugMode = options.debug || false;
    this.container = Container.getInstance();

    // 注册自身到IOC容器
    this.container.register(ServiceKeys.ENGINE, this);
  }

  /**
   * 初始化引擎
   * @returns Promise<void>
   */
  async initialize(): Promise<void> {
    // if (this.state !== EngineState.UNINITIALIZED) {
    //   console.warn('Engine already initialized or initializing');
    //   return;
    // }
    // this.state = EngineState.INITIALIZING;
    // try {
    //   // 创建时间管理器
    //   this.time = new Time();
    //   this.container.register(ServiceKeys.TIME, this.time);
    //   // 创建渲染上下文
    //   this.renderContext = new RenderContext();
    //   this.container.register(ServiceKeys.RENDER_CONTEXT, this.renderContext);
    //   // 创建资源管理器
    //   this.resourceManager = new ResourceManager(this);
    //   this.container.register(ServiceKeys.RESOURCE_MANAGER, this.resourceManager);
    //   // 创建场景管理器
    //   this.sceneManager = new SceneManager();
    //   this.container.register(ServiceKeys.SCENE_MANAGER, this.sceneManager);
    //   // 创建输入管理器
    //   this.inputManager = new InputManager();
    //   this.container.register(ServiceKeys.INPUT_MANAGER, this.inputManager);
    //   // 创建渲染器
    //   this.renderer = await RendererFactory.createRenderer(this.options);
    //   // 初始化完成后，自动启动引擎(如果配置了autoStart)
    //   if (this.options.autoStart) {
    //     this.start();
    //   }
    //   this.state = EngineState.PAUSED;
    //   // 触发初始化完成事件
    //   this.dispatchEvent('initialized');
    // } catch (error) {
    //   console.error('Failed to initialize engine:', error);
    //   this.state = EngineState.UNINITIALIZED;
    //   throw error;
    // }
  }

  /**
   * 启动引擎
   */
  start(): void {
    if (this.state === EngineState.RUNNING) {
      return;
    }

    if (this.state === EngineState.UNINITIALIZED) {
      console.warn('Engine not initialized. Call initialize() first.');

      return;
    }

    this.state = EngineState.RUNNING;
    this.isRunning = true;
    this.lastFrameTime = performance.now();

    // 开始主循环
    this.animationFrameId = requestAnimationFrame(this.mainLoop.bind(this));

    // 触发启动事件
    this.dispatchEvent('started');
  }

  /**
   * 暂停引擎
   */
  pause(): void {
    if (this.state !== EngineState.RUNNING) {
      return;
    }

    this.state = EngineState.PAUSED;
    this.isRunning = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }

    // 触发暂停事件
    this.dispatchEvent('paused');
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
   * 引擎主循环
   */
  private mainLoop(timestamp: number): void {
    if (!this.isRunning) {
      return;
    }

    // 计算帧时间
    const deltaTime = timestamp - this.lastFrameTime;
    const targetFrameTime = 1000 / this.targetFrameRate;

    // 如果时间间隔小于目标帧率时间，则跳过这一帧
    if (deltaTime < targetFrameTime) {
      this.animationFrameId = requestAnimationFrame(this.mainLoop.bind(this));

      return;
    }

    // 更新时间管理器
    this.time.update(deltaTime);

    // 更新输入管理器
    this.inputManager.update();

    // 更新场景和游戏对象
    this.update(this.time.deltaTime);

    // 渲染场景
    this.render();

    // 记录当前帧时间
    this.lastFrameTime = timestamp;

    // 请求下一帧
    this.animationFrameId = requestAnimationFrame(this.mainLoop.bind(this));
  }

  /**
   * 更新场景和所有游戏对象
   * @param deltaTime 时间差(秒)
   */
  private update(deltaTime: number): void {
    const activeScene = this.sceneManager.activeScene;

    if (!activeScene) {
      return;
    }

    // 更新场景
    activeScene.update(deltaTime);

    // 触发更新事件
    this.dispatchEvent('update', { deltaTime });
  }

  /**
   * 渲染当前场景
   */
  private render(): void {
    const activeScene = this.sceneManager.activeScene;

    if (!activeScene) {
      return;
    }

    // 设置渲染上下文
    this.renderContext.setScene(activeScene);

    // 执行渲染
    this.renderer.render();

    // 触发渲染事件
    this.dispatchEvent('render');
  }

  /**
   * 设置引擎目标帧率
   * @param fps 每秒帧数
   */
  setTargetFrameRate(fps: number): void {
    this.targetFrameRate = Math.max(1, fps);
  }

  /**
   * 创建新场景
   * @param name 场景名称
   * @returns 新创建的场景
   */
  createScene(name?: string): Scene {
    return this.sceneManager.createScene(name);
  }

  /**
   * 加载场景
   * @param scene 要加载的场景
   */
  loadScene(scene: Scene): void {
    this.sceneManager.setActiveScene(scene);
  }

  /**
   * 销毁引擎实例
   */
  destroy(): void {
    if (this.state === EngineState.DESTROYED) {
      return;
    }

    // 停止主循环
    this.pause();

    // 销毁渲染器
    if (this.renderer) {
      this.renderer.destroy();
    }

    // 销毁场景管理器
    if (this.sceneManager) {
      this.sceneManager.destroy();
    }

    // 销毁资源管理器
    if (this.resourceManager) {
      this.resourceManager.destroy();
    }

    // 清空IOC容器
    this.container.clear();

    this.state = EngineState.DESTROYED;

    // 触发销毁事件
    this.dispatchEvent('destroyed');

    // 调用父类销毁方法
    super.destroy();
  }

  /**
   * 获取当前引擎状态
   */
  getState(): EngineState {
    return this.state;
  }

  /**
   * 获取场景管理器
   */
  getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  /**
   * 获取资源管理器
   */
  getResourceManager(): ResourceManager {
    return this.resourceManager;
  }

  /**
   * 获取输入管理器
   */
  getInputManager(): InputManager {
    return this.inputManager;
  }

  /**
   * 获取时间管理器
   */
  getTime(): Time {
    return this.time;
  }

  /**
   * 获取渲染器
   */
  getRenderer(): IRenderer {
    return this.renderer;
  }

  /**
   * 获取渲染上下文
   */
  getRenderContext(): RenderContext {
    return this.renderContext;
  }

  /**
   * 是否处于调试模式
   */
  isDebugMode(): boolean {
    return this.debugMode;
  }

  /**
   * 设置调试模式
   * @param enabled 是否启用
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
}
