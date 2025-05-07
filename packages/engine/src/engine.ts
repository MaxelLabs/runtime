import type { Color } from '@maxellabs/math';
import type {
  IRHIDevice,
  Scene } from '@maxellabs/core';
import {
  Canvas,
  EventDispatcher,
  ObjectPoolManager,
  ObjectPoolManagerEventType,
  RenderContext,
  RendererType,
  ResourceManager,
  SceneManager,
  ShaderMacro,
  ShaderMacroCollection,
  Time,
  Event,
} from '@maxellabs/core';

/**
 * 引擎配置接口
 */
export interface EngineOptions {
  /** 目标画布 */
  canvas: HTMLCanvasElement,
  /** 是否使用抗锯齿 */
  antialias?: boolean,
  /** 是否启用Alpha通道 */
  alpha?: boolean,
  /** 背景颜色 */
  backgroundColor?: Color,
  /** 渲染器类型 */
  rendererType?: RendererType,
  /** 是否开启HDR */
  enableHDR?: boolean,
  /** 是否自动开始渲染循环 */
  autoStart?: boolean,
  /** 是否开启性能统计 */
  enableStats?: boolean,
  /** 是否自动管理对象池 */
  enableObjectPoolManager?: boolean,
  /** 对象池性能分析间隔（毫秒） */
  objectPoolAnalysisInterval?: number,
}

/**
 * 引擎事件类型
 */
export enum EngineEventType {
  /** 引擎初始化完成 */
  Ready = 'engine-ready',
  /** 引擎每帧开始 */
  BeforeUpdate = 'engine-before-update',
  /** 引擎每帧更新完成 */
  AfterUpdate = 'engine-after-update',
  /** 引擎每帧渲染开始 */
  BeforeRender = 'engine-before-render',
  /** 引擎每帧渲染完成 */
  AfterRender = 'engine-after-render',
  /** 引擎窗口大小改变 */
  Resize = 'engine-resize',
  /** 设备丢失 */
  DeviceLost = 'engine-device-lost',
  /** 设备恢复 */
  DeviceRestored = 'engine-device-restored',
  /** 对象池性能分析 */
  ObjectPoolAnalysis = 'engine-object-pool-analysis'
}

/**
 * 引擎主类，作为整个引擎的入口点
 */
export class Engine extends EventDispatcher {
  /** @internal 伽马空间着色器宏 */
  static _gammaMacro: ShaderMacro = ShaderMacro.getByName('ENGINE_IS_COLORSPACE_GAMMA');
  /** @internal 无深度纹理着色器宏 */
  static _noDepthTextureMacro: ShaderMacro = ShaderMacro.getByName('ENGINE_NO_DEPTH_TEXTURE');
  /** @internal 2D空间单位到像素单位的转换系数 */
  static _pixelsPerUnit: number = 100;

  /** @internal 硬件渲染器 */
  _hardwareRenderer: IRHIDevice;
  /** @internal 渲染上下文 */
  _renderContext: RenderContext;
  /** @internal 全局着色器宏集合 */
  _globalShaderMacro: ShaderMacroCollection = new ShaderMacroCollection();
  /** @internal 渲染次数统计 */
  _renderCount: number = 0;

  /** @internal */
  private _canvas: Canvas;
  /** 资源管理器 */
  private _resourceManager: ResourceManager;
  /** 场景管理器 */
  private _sceneManager: SceneManager;
  /** 时间管理器 */
  private _time: Time = new Time();
  /** 是否暂停 */
  private _isPaused: boolean = true;
  /** 动画帧ID */
  private _animFrameId: number = 0;
  /** 帧间隔定时器ID */
  private _timeoutId: number = 0;
  /** 垂直同步计数 */
  private _vSyncCount: number = 1;
  /** 垂直同步计数器 */
  private _vSyncCounter: number = 1;
  /** 目标帧率 */
  private _targetFrameRate: number = 60;
  /** 目标帧间隔（毫秒） */
  private _targetFrameInterval: number = 1000 / 60;
  /** 帧处理中标志 */
  private _frameInProcess: boolean = false;
  /** 等待销毁标志 */
  private _waitingDestroy: boolean = false;
  /** 设备丢失标志 */
  private _isDeviceLost: boolean = false;
  /** 性能统计数据 */
  private _stats = {
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    lastUpdateTime: 0,
    frames: 0,
  };
  /** 是否启用性能统计 */
  private _enableStats: boolean = false;

  /** 对象池管理器 */
  readonly objectPoolManager: ObjectPoolManager;

  /** 是否启用对象池管理 */
  private _enableObjectPoolManager: boolean = false;

  /** 对象池分析间隔 */
  private _objectPoolAnalysisInterval: number = 30000;

  /**
   * 动画循环函数
   */
  private _animate = () => {
    if (this._vSyncCount) {
      // 使用requestAnimationFrame进行同步
      this._animFrameId = requestAnimationFrame(this._animate);
      if (this._vSyncCounter++ % this._vSyncCount === 0) {
        this.update();
        this._vSyncCounter = 1;
      }
    } else {
      // 使用setTimeout实现自定义帧率
      this._timeoutId = window.setTimeout(this._animate, this._targetFrameInterval);
      this.update();
    }
  };

  /**
   * 引擎设置
   */
  get settings (): any {
    return {};
  }

  /**
   * 用于渲染的画布
   */
  get canvas (): Canvas {
    return this._canvas;
  }

  /**
   * 资源管理器
   */
  get resourceManager (): ResourceManager {
    return this._resourceManager;
  }

  /**
   * 场景管理器
   */
  get sceneManager (): SceneManager {
    return this._sceneManager;
  }

  /**
   * 引擎时间信息
   */
  get time (): Time {
    return this._time;
  }

  /**
   * 引擎是否已暂停
   */
  get isPaused (): boolean {
    return this._isPaused;
  }

  /**
   * 垂直同步计数，表示每帧的垂直消隐次数
   * @remarks 0表示垂直同步已关闭
   */
  get vSyncCount (): number {
    return this._vSyncCount;
  }

  set vSyncCount (value: number) {
    this._vSyncCount = Math.max(0, Math.floor(value));
  }

  /**
   * 设置要达到的目标帧率
   * @remarks
   * 仅当vSyncCount = 0时生效
   * 值越大，目标帧率越高
   */
  get targetFrameRate (): number {
    return this._targetFrameRate;
  }

  set targetFrameRate (value: number) {
    value = Math.max(0.000001, value);
    this._targetFrameRate = value;
    this._targetFrameInterval = 1000 / value;
  }

  /**
   * 获取性能统计信息
   */
  get stats () {
    return { ...this._stats };
  }

  /**
   * 创建引擎实例
   * @param options 引擎配置选项
   */
  constructor (options: EngineOptions) {
    super();

    // 创建画布
    this._canvas = new Canvas(options.canvas);

    // 创建渲染上下文 - 由于循环依赖，需要特殊处理
    this._renderContext = new RenderContext(this as any);

    // 创建硬件渲染器（从RHI包中导入相应的渲染器）
    this._hardwareRenderer = this._createRenderer(options);

    // 初始化渲染器
    this._initializeRenderer(options);

    // 创建资源管理器
    this._resourceManager = new ResourceManager(this as any);

    // 创建场景管理器
    this._sceneManager = new SceneManager(this as any);

    // 创建对象池管理器
    this.objectPoolManager = ObjectPoolManager.getInstance();
    this._enableObjectPoolManager = options.enableObjectPoolManager !== false;

    if (options.objectPoolAnalysisInterval !== undefined) {
      this._objectPoolAnalysisInterval = Math.max(1000, options.objectPoolAnalysisInterval);
    }

    if (this._enableObjectPoolManager) {
      this.objectPoolManager.enableAutoAnalysis(true, this._objectPoolAnalysisInterval);

      // 监听对象池性能分析事件
      this.objectPoolManager.on(ObjectPoolManagerEventType.PERFORMANCE_ANALYSIS, (e: any) => {
        // 转发到引擎事件
        this.dispatchEvent(new Event(EngineEventType.ObjectPoolAnalysis, false, e));
      });
    }

    // 设置统计信息启用状态
    this._enableStats = options.enableStats || false;

    // 自动启动
    if (options.autoStart !== false) {
      this.run();
    }

    // 派发就绪事件
    this.dispatchEvent(new Event(EngineEventType.Ready));
  }

  /**
   * 创建渲染器
   * @param options 引擎配置选项
   * @returns 渲染器接口实例
   */
  private _createRenderer (options: EngineOptions): IRHIDevice {
    // TODO: 实际应用中，应该根据不同的渲染类型创建不同的渲染器
    // 这里仅为示例，实际实现需要根据项目中的渲染器实现

    // 根据配置选择渲染器类型
    const rendererType = options.rendererType ?? RendererType.WebGL2;

    // 在实际环境中，应该从RHI包导入相应的渲染器类
    let _renderer: IRHIDevice;

    switch (rendererType) {
      case RendererType.WebGL:
        // 导入WebGL渲染器
        // _renderer = new WebGLRenderer();
        break;
      case RendererType.WebGPU:
        // 导入WebGPU渲染器
        // _renderer = new WebGPURenderer();
        break;
      case RendererType.WebGL2:
      default:
        // 导入WebGL2渲染器
        // _renderer = new WebGL2Renderer();
        break;
    }

    // 临时返回任意对象作为渲染器接口
    // 在实际应用中，应该返回真实的渲染器实例
    return {} as IRHIDevice;
  }

  /**
   * 初始化渲染器
   * @param options 引擎配置选项
   */
  private _initializeRenderer (options: EngineOptions): void {
    // 初始化渲染器
    // 在实际应用中，应该调用渲染器的初始化方法
    // this._hardwareRenderer.initialize(this._canvas.element, {
    //   antialias: options.antialias,
    //   alpha: options.alpha,
    //   depth: true,
    //   stencil: true,
    //   premultipliedAlpha: true,
    //   preserveDrawingBuffer: false
    // });
  }

  /**
   * 创建一个新的场景
   * @param name 场景名称
   * @returns 新创建的场景
   */
  createScene (name?: string): Scene {
    return this._sceneManager.createScene(name);
  }

  /**
   * 暂停引擎
   */
  pause (): void {
    if (!this._isPaused) {
      this._isPaused = true;
      if (this._animFrameId) {
        cancelAnimationFrame(this._animFrameId);
        this._animFrameId = 0;
      }
      if (this._timeoutId) {
        clearTimeout(this._timeoutId);
        this._timeoutId = 0;
      }
    }
  }

  /**
   * 恢复引擎
   */
  resume (): void {
    if (this._isPaused) {
      this._isPaused = false;
      this._time.reset();
      this._animate();
    }
  }

  /**
   * 更新一帧
   */
  update (): void {
    // 如果帧正在处理中或已销毁，则跳过
    if (this._frameInProcess || this.destroyed) {
      return;
    }

    // 标记帧处理中
    this._frameInProcess = true;

    // 更新时间信息
    this._time.update();
    const time = this._time.time;
    const deltaTime = this._time.deltaTime;

    // 派发帧开始事件
    this.dispatchEvent(new Event(EngineEventType.BeforeUpdate));

    // 更新对象池管理器
    if (this._enableObjectPoolManager) {
      this.objectPoolManager.update();
    }

    // 更新场景
    this._sceneManager.update(deltaTime);

    // 派发帧更新完成事件
    this.dispatchEvent(new Event(EngineEventType.AfterUpdate));

    // 执行渲染
    this._render();

    // 更新统计信息
    if (this._enableStats) {
      this._updateStats(time, deltaTime);
    }

    // 处理可能的销毁请求
    if (this._waitingDestroy) {
      this._destroy();
    }

    // 标记帧处理完成
    this._frameInProcess = false;
  }

  /**
   * 开始运行引擎
   */
  run (): void {
    this.resume();
  }

  /**
   * 强制设备丢失
   */
  forceLoseDevice (): void {
    if (!this._isDeviceLost) {
      this._onDeviceLost();
    }
  }

  /**
   * 强制设备恢复
   */
  forceRestoreDevice (): void {
    if (this._isDeviceLost) {
      this._onDeviceRestored();
    }
  }

  /**
   * 销毁引擎
   */
  override destroy (): void {
    if (this.destroyed) {
      return;
    }

    if (this._frameInProcess) {
      this._waitingDestroy = true;
      return;
    }

    this._destroy();
  }

  /**
   * 调整大小
   * @param width 宽度
   * @param height 高度
   */
  resize (width: number, height: number): void {
    this._canvas.resizeByClientSize(width, height);
    this.dispatchEvent(new Event(EngineEventType.Resize));
  }

  /**
   * 内部渲染方法
   */
  private _render (): void {
    this._renderCount++;

    // 派发渲染开始事件
    this.dispatchEvent(new Event(EngineEventType.BeforeRender));

    const scenes = this._sceneManager.activeScenes;

    for (let i = 0, len = scenes.length; i < len; i++) {
      const scene = scenes[i];
      // 渲染场景
      scene.render();
    }

    // 派发渲染完成事件
    this.dispatchEvent(new Event(EngineEventType.AfterRender));
  }

  /**
   * 更新性能统计
   * @param time 当前时间戳
   * @param deltaTime 帧时间
   */
  private _updateStats (time: number, deltaTime: number): void {
    const stats = this._stats;

    // 更新帧时间
    stats.frameTime = deltaTime * 1000; // 转换为毫秒

    // 更新帧数
    stats.frames++;

    // 每秒更新一次FPS计数
    if (time - stats.lastUpdateTime >= 1000) {
      stats.fps = stats.frames * 1000 / (time - stats.lastUpdateTime);
      stats.lastUpdateTime = time;
      stats.frames = 0;

      // 重置绘制统计
      stats.drawCalls = 0;
      stats.triangles = 0;
    }
  }

  /**
   * 内部销毁方法
   */
  private _destroy (): void {
    this.pause();

    // 销毁所有事件监听
    super.destroy();

    // 销毁场景管理器
    this._sceneManager.destroy();

    // 销毁资源管理器
    this._resourceManager.destroy();

    // 销毁硬件渲染器
    if (this._hardwareRenderer && typeof this._hardwareRenderer.destroy === 'function') {
      this._hardwareRenderer.destroy();
    }

    // 停用对象池管理器
    if (this._enableObjectPoolManager) {
      this.objectPoolManager.enableAutoAnalysis(false);
      this.objectPoolManager.clearAllPools();
    }
  }

  /**
   * 设备丢失回调
   */
  private _onDeviceLost (): void {
    this._isDeviceLost = true;
    // 发送设备丢失事件
    this.dispatchEvent(new Event(EngineEventType.DeviceLost));
  }

  /**
   * 设备恢复回调
   */
  private _onDeviceRestored (): void {
    this._isDeviceLost = false;
    // 发送设备恢复事件
    this.dispatchEvent(new Event(EngineEventType.DeviceRestored));
  }
}