import { EventDispatcher, Scene, SceneManager, Time, 
  ResourceManager, RenderContext, RendererOptions, 
  RendererType } from '@maxellabs/core';
import { Container, ServiceKeys } from '@maxellabs/core';
import { DeviceManager } from './deviceManager';
import { RendererFactory } from '@maxellabs/core';

/**
 * 引擎状态枚举
 */
export enum EngineState {
  /** 未初始化 */
  UNINITIALIZED = 'uninitialized',
  /** 正在初始化 */
  INITIALIZING = 'initializing',
  /** 运行中 */
  RUNNING = 'running',
  /** 暂停 */
  PAUSED = 'paused',
  /** 已销毁 */
  DESTROYED = 'destroyed'
}

/**
 * 引擎配置选项
 */
export interface EngineOptions extends RendererOptions {
  /** 目标帧率 */
  targetFrameRate?: number,
  /** 是否自动启动引擎 */
  autoStart?: boolean,
  /** 是否启用物理系统 */
  enablePhysics?: boolean,
  /** 是否启用音频系统 */
  enableAudio?: boolean,
  /** 是否启用调试模式 */
  debug?: boolean,
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
  /** 场景管理器 */
  private sceneManager: SceneManager;
  /** 资源管理器 */
  private resourceManager: ResourceManager;
  /** 时间管理器 */
  private time: Time;
  /** 渲染上下文 */
  public _renderContext: RenderContext;
  /** 目标帧率 */
  private targetFrameRate: number = 60;
  /** 帧间隔时间 (毫秒) */
  private frameInterval: number = 1000 / 60;
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
  /** 设备管理器 */
  private deviceManager: DeviceManager;
  /** 全局着色器宏 */
  public _globalShaderMacro: any = null;

  /**
   * 创建引擎实例
   * @param options 引擎配置选项
   */
  constructor(options: EngineOptions) {
    super();
    this.options = options;
    this.targetFrameRate = options.targetFrameRate || 60;
    this.frameInterval = 1000 / this.targetFrameRate;
    this.debugMode = options.debug || false;
    this.container = Container.getInstance();
    
    // 注册自身到IOC容器
    this.container.register(ServiceKeys.ENGINE, this);
    
    // 获取设备管理器
    this.deviceManager = DeviceManager.getInstance();
  }

  /**
   * 初始化引擎
   * @returns Promise<void>
   */
  async initialize(): Promise<void> {
    if (this.state !== EngineState.UNINITIALIZED) {
      console.warn('引擎已经初始化或正在初始化');
      return;
    }

    this.state = EngineState.INITIALIZING;

    try {
      // 创建时间管理器
      this.time = new Time();
      this.container.register(ServiceKeys.TIME, this.time);

      // 创建渲染上下文
      this._renderContext = new RenderContext();
      this.container.register(ServiceKeys.RENDER_CONTEXT, this._renderContext);

      // 创建资源管理器
      this.resourceManager = new ResourceManager();
      this.container.register(ServiceKeys.RESOURCE_MANAGER, this.resourceManager);

      // 创建场景管理器
      this.sceneManager = new SceneManager();
      this.container.register(ServiceKeys.SCENE_MANAGER, this.sceneManager);

      // 获取画布并创建设备
      const canvas = this.options.canvas;
      if (!canvas) {
        throw new Error('初始化引擎需要提供画布元素');
      }
      
      // 创建WebGL设备
      this.deviceManager.createDevice(canvas, {
        antialias: this.options.antialias !== undefined ? this.options.antialias : true,
        depth: this.options.depth !== undefined ? this.options.depth : true,
        stencil: this.options.stencil !== undefined ? this.options.stencil : true,
        alpha: this.options.alpha !== undefined ? this.options.alpha : true,
        premultipliedAlpha: this.options.premultipliedAlpha,
        preserveDrawingBuffer: this.options.preserveDrawingBuffer,
      });

      // 创建渲染器
      const renderer = await RendererFactory.createRenderer(this.options, this);
      this.container.register(ServiceKeys.RENDERER, renderer);

      // 初始化完成后，自动启动引擎(如果配置了autoStart)
      if (this.options.autoStart) {
        this.start();
      } else {
        this.state = EngineState.PAUSED;
      }

      // 触发初始化完成事件
      this.dispatchEvent('initialized');
    } catch (error) {
      console.error('引擎初始化失败:', error);
      this.state = EngineState.UNINITIALIZED;
      throw error;
    }
  }

  /**
   * 启动引擎
   */
  start(): void {
    if (this.state === EngineState.RUNNING) {
      return;
    }

    if (this.state === EngineState.UNINITIALIZED) {
      console.warn('引擎未初始化，请先调用initialize()方法');
      return;
    }

    this.state = EngineState.RUNNING;
    this.isRunning = true;
    this.lastFrameTime = performance.now();

    // 开始主循环
    this.mainLoop();

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

    // 取消动画帧请求
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }

    // 触发暂停事件
    this.dispatchEvent('paused');
  }

  /**
   * 恢复引擎运行
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
  private mainLoop(): void {
    // 记录当前时间
    const currentTime = performance.now();
    // 计算帧间隔时间
    const deltaTime = currentTime - this.lastFrameTime;

    // 如果帧率限制开启且未达到指定帧间隔，则等待下一帧
    if (this.targetFrameRate > 0 && deltaTime < this.frameInterval) {
      this.animationFrameId = requestAnimationFrame(this.mainLoop.bind(this));
      return;
    }

    // 更新上一帧时间
    this.lastFrameTime = currentTime;

    // 更新时间管理器
    this.time.update(deltaTime);

    // 触发更新事件
    this.dispatchEvent('beforeUpdate', { deltaTime });

    // 更新场景
    this.updateScene(deltaTime / 1000); // 转换为秒

    // 触发渲染事件
    this.dispatchEvent('beforeRender');

    // 渲染场景
    this.renderScene();

    // 触发渲染完成事件
    this.dispatchEvent('afterRender');

    // 如果引擎仍在运行，请求下一帧
    if (this.isRunning) {
      this.animationFrameId = requestAnimationFrame(this.mainLoop.bind(this));
    }
  }

  /**
   * 更新场景
   * @param deltaTime 帧间隔时间(秒)
   */
  private updateScene(deltaTime: number): void {
    // 获取当前活动场景
    const activeScene = this.sceneManager.getActiveScene();
    if (!activeScene) {
      return;
    }

    // 更新场景
    activeScene.update(deltaTime);
  }

  /**
   * 渲染场景
   */
  private renderScene(): void {
    // 获取当前活动场景
    const activeScene = this.sceneManager.getActiveScene();
    if (!activeScene) {
      return;
    }

    // 获取主摄像机
    const mainCamera = activeScene.getMainCamera();
    if (!mainCamera) {
      return;
    }

    // 获取渲染器
    const renderer = this.container.resolve(ServiceKeys.RENDERER);
    if (!renderer) {
      return;
    }

    // 使用渲染器渲染场景
    renderer.render(activeScene, mainCamera);
  }

  /**
   * 设置引擎目标帧率
   * @param fps 每秒帧数
   */
  setTargetFrameRate(fps: number): void {
    this.targetFrameRate = Math.max(1, fps);
    this.frameInterval = 1000 / this.targetFrameRate;
  }

  /**
   * 加载场景
   * @param scene 要加载的场景
   */
  loadScene(scene: Scene): void {
    this.sceneManager.setActiveScene(scene);
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    if (this.state === EngineState.DESTROYED) {
      return;
    }

    // 暂停引擎
    this.pause();

    // 触发销毁事件
    this.dispatchEvent('beforeDestroy');

    // 销毁场景管理器
    this.sceneManager.destroy();

    // 销毁资源管理器
    this.resourceManager.destroy();

    // 获取渲染器并销毁
    const renderer = this.container.resolve(ServiceKeys.RENDERER);
    if (renderer) {
      renderer.dispose();
    }

    // 重置设备管理器
    this.deviceManager.resetDevice();

    // 清除IOC容器
    this.container.clear();

    // 更新状态
    this.state = EngineState.DESTROYED;

    // 触发销毁完成事件
    this.dispatchEvent('destroyed');
  }

  /**
   * 获取引擎状态
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
   * 获取时间管理器
   */
  getTime(): Time {
    return this.time;
  }

  /**
   * 获取设备管理器
   */
  getDeviceManager(): DeviceManager {
    return this.deviceManager;
  }

  /**
   * 获取当前活动场景
   */
  getActiveScene(): Scene | null {
    return this.sceneManager.getActiveScene();
  }
}