import { Matrix4, Vector3, Vector4, Color } from '@maxellabs/math';
import { Scene } from './scene/Scene';
import { ResourceManager } from './resource/ResourceManager';
import { ShaderData } from './shader/ShaderData';
import { ShaderMacroCollection } from './shader/ShaderMacroCollection';
import { ShaderMacro } from './shader/ShaderMacro';
import { ShaderProperty } from './shader/ShaderProperty';
import { Event } from './base/Event';
import { EventDispatcher } from './base/EventDispatcher';
import { Time } from './base/Time';
import { RenderContext } from './renderer/RenderContext';
import { RenderPipeline } from './renderer/RenderPipeline';
import { Canvas } from './base/Canvas';
import { InputManager } from './input/InputManager';
import { RendererType } from './renderer/RendererType';
import { IHardwareRenderer } from './interface/IHardwareRenderer';
import { BatcherManager } from './renderer/BatcherManager';
import { SceneManager } from './scene/SceneManager';

/**
 * 引擎配置接口
 */
export interface EngineOptions {
  /** 目标画布 */
  canvas: HTMLCanvasElement;
  /** 是否使用抗锯齿 */
  antialias?: boolean;
  /** 是否启用Alpha通道 */
  alpha?: boolean;
  /** 背景颜色 */
  backgroundColor?: Color;
  /** 渲染器类型 */
  rendererType?: RendererType;
  /** 是否开启HDR */
  enableHDR?: boolean;
  /** 是否自动开始渲染循环 */
  autoStart?: boolean;
  /** 是否开启性能统计 */
  enableStats?: boolean;
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
  DeviceRestored = 'engine-device-restored'
}

/**
 * 引擎主类，作为整个引擎的入口点
 */
export class Engine extends EventDispatcher {
  /** @internal 伽马空间着色器宏 */
  static _gammaMacro: ShaderMacro = ShaderMacro.getByName("ENGINE_IS_COLORSPACE_GAMMA");
  /** @internal 无深度纹理着色器宏 */
  static _noDepthTextureMacro: ShaderMacro = ShaderMacro.getByName("ENGINE_NO_DEPTH_TEXTURE");
  /** @internal 2D空间单位到像素单位的转换系数 */
  static _pixelsPerUnit: number = 100;

  /** 输入管理器 */
  readonly inputManager: InputManager;

  /** @internal 批处理管理器 */
  _batcherManager: BatcherManager;
  /** @internal 硬件渲染器 */
  _hardwareRenderer: IHardwareRenderer;
  /** @internal 渲染上下文 */
  _renderContext: RenderContext = new RenderContext();
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
  /** 是否已销毁 */
  private _destroyed: boolean = false;
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
  get settings(): any {
    return {};
  }

  /**
   * 用于渲染的画布
   */
  get canvas(): Canvas {
    return this._canvas;
  }

  /**
   * 资源管理器
   */
  get resourceManager(): ResourceManager {
    return this._resourceManager;
  }

  /**
   * 场景管理器
   */
  get sceneManager(): SceneManager {
    return this._sceneManager;
  }

  /**
   * 引擎时间信息
   */
  get time(): Time {
    return this._time;
  }

  /**
   * 引擎是否已暂停
   */
  get isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * 垂直同步计数，表示每帧的垂直消隐次数
   * @remarks 0表示垂直同步已关闭
   */
  get vSyncCount(): number {
    return this._vSyncCount;
  }

  set vSyncCount(value: number) {
    this._vSyncCount = Math.max(0, Math.floor(value));
  }

  /**
   * 设置要达到的目标帧率
   * @remarks
   * 仅当vSyncCount = 0时生效
   * 值越大，目标帧率越高
   */
  get targetFrameRate(): number {
    return this._targetFrameRate;
  }

  set targetFrameRate(value: number) {
    value = Math.max(0.000001, value);
    this._targetFrameRate = value;
    this._targetFrameInterval = 1000 / value;
  }

  /**
   * 引擎是否已销毁
   */
  get destroyed(): boolean {
    return this._destroyed;
  }

  /**
   * 获取性能统计信息
   */
  get stats() {
    return { ...this._stats };
  }

  /**
   * 创建引擎实例
   * @param options 引擎配置选项
   */
  constructor(options: EngineOptions) {
    super();

    // 创建画布
    this._canvas = new Canvas(options.canvas);

    // 创建硬件渲染器
    this._hardwareRenderer = this._createHardwareRenderer(options);
    this._hardwareRenderer.init(
      this._canvas, 
      this._onDeviceLost.bind(this), 
      this._onDeviceRestored.bind(this)
    );

    // 初始化资源管理器
    this._resourceManager = new ResourceManager(this);

    // 创建批处理管理器
    this._batcherManager = new BatcherManager(this);

    // 创建场景管理器
    this._sceneManager = new SceneManager(this);

    // 创建输入管理器
    this.inputManager = new InputManager(this);

    // 设置性能统计选项
    this._enableStats = options.enableStats ?? false;

    // 如果配置了自动启动，则启动引擎
    if (options.autoStart ?? true) {
      this.run();
    }
  }

  /**
   * 创建硬件渲染器
   * @param options 引擎配置选项
   * @returns 硬件渲染器实例
   */
  private _createHardwareRenderer(options: EngineOptions): IHardwareRenderer {
    // 根据配置选择渲染器类型
    const rendererType = options.rendererType ?? RendererType.WebGL2;
    
    // 实际创建渲染器的代码（需要实现不同类型的渲染器）
    // 这里仅为示例
    let renderer: IHardwareRenderer;
    
    // 根据不同的渲染器类型创建对应的渲染器
    // 实际代码需要实现各种渲染器类
    switch (rendererType) {
      case RendererType.WebGL:
        // renderer = new WebGLRenderer();
        break;
      case RendererType.WebGPU:
        // renderer = new WebGPURenderer();
        break;
      case RendererType.WebGL2:
      default:
        // renderer = new WebGL2Renderer();
        break;
    }
    
    // 临时返回任意对象以避免类型错误
    return {} as IHardwareRenderer;
  }

  /**
   * 创建一个新的场景
   * @param name 场景名称
   * @returns 新创建的场景
   */
  createScene(name?: string): Scene {
    const scene = new Scene(this, name);
    return scene;
  }

  /**
   * 暂停引擎
   */
  pause(): void {
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
  resume(): void {
    if (this._isPaused) {
      this._isPaused = false;
      this._time.reset();
      this._animate();
    }
  }

  /**
   * 更新一帧
   */
  update(): void {
    // 避免嵌套调用
    if (this._frameInProcess) {
      return;
    }

    if (this._waitingDestroy) {
      this._destroy();
      return;
    }

    this._frameInProcess = true;

    // 更新时间
    this._time.update();
    const deltaTime = this._time.deltaTime;

    // 发送帧开始事件
    this.dispatch(new Event(EngineEventType.BeforeUpdate));

    // 更新场景
    this._sceneManager.update(deltaTime);

    // 发送更新完成事件
    this.dispatch(new Event(EngineEventType.AfterUpdate));

    // 发送渲染开始事件
    this.dispatch(new Event(EngineEventType.BeforeRender));

    // 渲染场景
    this._render();

    // 发送渲染完成事件
    this.dispatch(new Event(EngineEventType.AfterRender));

    // 更新性能统计
    if (this._enableStats) {
      this._updateStats(performance.now(), deltaTime);
    }

    this._frameInProcess = false;
  }

  /**
   * 开始运行引擎
   */
  run(): void {
    this.resume();
    // 发送引擎准备就绪事件
    this.dispatch(new Event(EngineEventType.Ready));
  }

  /**
   * 强制设备丢失
   */
  forceLoseDevice(): void {
    if (!this._isDeviceLost) {
      this._onDeviceLost();
    }
  }

  /**
   * 强制设备恢复
   */
  forceRestoreDevice(): void {
    if (this._isDeviceLost) {
      this._onDeviceRestored();
    }
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    if (this._destroyed) {
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
  resize(width: number, height: number): void {
    this._canvas.resizeByClientSize(width, height);
    this.dispatch(new Event(EngineEventType.Resize));
  }

  /**
   * 内部渲染方法
   */
  private _render(): void {
    this._renderCount++;
    const scenes = this._sceneManager.activeScenes;
    
    for (let i = 0, len = scenes.length; i < len; i++) {
      const scene = scenes[i];
      
      // 获取场景的主摄像机
      const cameras = scene.activeCameras;
      for (let j = 0, len = cameras.length; j < len; j++) {
        const camera = cameras[j];
        // 使用摄像机渲染场景
        camera.render();
      }
    }
  }

  /**
   * 更新性能统计
   * @param time 当前时间戳
   * @param deltaTime 帧时间
   */
  private _updateStats(time: number, deltaTime: number): void {
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
  private _destroy(): void {
    this.pause();

    // 取消事件监听
    this.removeAllEventListeners();

    // 销毁场景管理器
    this._sceneManager.destroy();

    // 销毁资源管理器
    this._resourceManager.destroy();

    // 销毁硬件渲染器
    this._hardwareRenderer.destroy();

    this._destroyed = true;
  }
  
  /**
   * 设备丢失回调
   */
  private _onDeviceLost(): void {
    this._isDeviceLost = true;
    // 发送设备丢失事件
    this.dispatch(new Event(EngineEventType.DeviceLost));
  }

  /**
   * 设备恢复回调
   */
  private _onDeviceRestored(): void {
    this._isDeviceLost = false;
    // 发送设备恢复事件
    this.dispatch(new Event(EngineEventType.DeviceRestored));
  }
}