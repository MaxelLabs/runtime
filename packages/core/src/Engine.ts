import { Scene } from './scene/scene';
import { getResourceManager, ResourceManager } from './base/ReferResource';
import { WebGLRenderer } from './renderer/renderer';

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
  /** 是否默认清除画布 */
  clearBeforeRender?: boolean;
  /** 背景颜色 */
  backgroundColor?: [number, number, number, number];
  /** 是否自动开始渲染循环 */
  autoStart?: boolean;
  /** 是否启用性能统计 */
  enableStats?: boolean;
}

/**
 * 引擎主类，作为整个引擎的入口点
 */
export class Engine {
  /** 渲染器 */
  private _renderer: WebGLRenderer;
  /** 当前活动场景 */
  private _activeScene: Scene | null = null;
  /** 资源管理器 */
  private _resourceManager: ResourceManager;
  /** 是否正在运行 */
  private _isRunning: boolean = false;
  /** 上一帧时间戳 */
  private _lastTime: number = 0;
  /** 动画帧ID */
  private _animFrameId: number = 0;
  /** 是否自动清除画布 */
  private _clearBeforeRender: boolean = true;
  /** 是否启用性能统计 */
  private _enableStats: boolean = false;
  /** 性能统计数据 */
  private _stats = {
    fps: 0,
    frameTime: 0,
    draws: 0,
    triangles: 0,
    lastUpdateTime: 0,
    frames: 0
  };

  /**
   * 创建引擎实例
   * @param options 引擎配置选项
   */
  constructor(options: EngineOptions) {
    // 初始化资源管理器
    this._resourceManager = getResourceManager();
    
    // 创建渲染器
    this._renderer = new WebGLRenderer({
      canvas: options.canvas,
      antialias: options.antialias ?? true,
      alpha: options.alpha ?? true,
      clearColor: options.backgroundColor ?? [0, 0, 0, 1]
    });
    
    // 初始化渲染器
    this._renderer.initialize();
    
    // 设置清除画布选项
    this._clearBeforeRender = options.clearBeforeRender ?? true;
    
    // 设置性能统计选项
    this._enableStats = options.enableStats ?? false;
    
    // 如果配置了自动启动，则启动引擎
    if (options.autoStart ?? true) {
      this.start();
    }
  }

  /**
   * 获取渲染器
   */
  get renderer(): WebGLRenderer {
    return this._renderer;
  }

  /**
   * 获取当前活动场景
   */
  get activeScene(): Scene | null {
    return this._activeScene;
  }

  /**
   * 设置当前活动场景
   */
  set activeScene(scene: Scene | null) {
    this._activeScene = scene;
  }

  /**
   * 获取资源管理器
   */
  get resourceManager(): ResourceManager {
    return this._resourceManager;
  }

  /**
   * 获取是否正在运行
   */
  get isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * 获取性能统计
   */
  get stats() {
    return { ...this._stats };
  }

  /**
   * 创建新场景
   * @returns 新创建的场景
   */
  createScene(): Scene {
    const scene = new Scene(this);
    
    // 如果没有活动场景，则将新场景设为活动场景
    if (!this._activeScene) {
      this._activeScene = scene;
    }
    
    return scene;
  }

  /**
   * 启动引擎
   */
  start(): void {
    if (this._isRunning) {
      return;
    }
    
    this._isRunning = true;
    this._lastTime = performance.now();
    this._stats.lastUpdateTime = this._lastTime;
    this._animFrameId = requestAnimationFrame(this._onRenderFrame.bind(this));
  }

  /**
   * 停止引擎
   */
  stop(): void {
    if (!this._isRunning) {
      return;
    }
    
    this._isRunning = false;
    if (this._animFrameId) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = 0;
    }
  }

  /**
   * 渲染一帧
   * @param time 当前时间戳
   */
  private _onRenderFrame(time: number): void {
    // 计算帧时间
    const deltaTime = (time - this._lastTime) / 1000;
    this._lastTime = time;
    
    // 更新资源管理器
    this._resourceManager.update();
    
    // 更新并渲染当前场景
    if (this._activeScene) {
      // 更新场景
      this._activeScene.update(deltaTime);
      
      // 清除画布
      if (this._clearBeforeRender) {
        this._renderer.clear();
      }
      
      // 获取场景的主摄像机
      const camera = this._activeScene.mainCamera;
      
      // 如果有主摄像机，则渲染场景
      if (camera) {
        this._renderer.render(this._activeScene, camera);
      }
    }
    
    // 更新性能统计
    if (this._enableStats) {
      this._updateStats(time, deltaTime);
    }
    
    // 如果引擎仍在运行，则请求下一帧
    if (this._isRunning) {
      this._animFrameId = requestAnimationFrame(this._onRenderFrame.bind(this));
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
      stats.draws = 0;
      stats.triangles = 0;
    }
  }

  /**
   * 调整大小
   * @param width 宽度
   * @param height 高度
   */
  resize(width: number, height: number): void {
    this._renderer.setSize(width, height);
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    // 停止渲染循环
    this.stop();
    
    // 销毁活动场景
    if (this._activeScene) {
      this._activeScene.destroy();
      this._activeScene = null;
    }
    
    // 销毁渲染器
    this._renderer.dispose();
    
    // 清除资源
    this._resourceManager.clear(true);
  }
} 