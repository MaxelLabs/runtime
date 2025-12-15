/**
 * core/DemoRunner.ts
 * Demo 运行器 - 统一封装初始化、渲染循环、事件处理和资源清理
 */

import { MSpec } from '@maxellabs/core';
import { WebGLDevice } from '@maxellabs/rhi';
import type {
  DemoConfig,
  DemoState,
  RenderCallback,
  CleanupCallback,
  KeyCallback,
  ResizeCallback,
  RenderTargetConfig,
} from './types';
import { DemoState as State } from './types';

/**
 * Demo 运行器
 *
 * 提供统一的 Demo 生命周期管理：
 * - 自动初始化画布和 WebGL 设备
 * - 管理渲染循环
 * - 处理窗口大小变化
 * - 统一资源追踪和清理
 *
 * @example
 * ```typescript
 * const runner = new DemoRunner({
 *   canvasId: 'J-canvas',
 *   name: 'Triangle Demo',
 *   clearColor: [0.1, 0.1, 0.1, 1.0],
 * });
 *
 * await runner.init();
 *
 * // 创建资源
 * const buffer = runner.track(runner.device.createBuffer({...}));
 *
 * // 启动渲染循环
 * runner.start((dt, time) => {
 *   // 渲染逻辑
 * });
 *
 * // 清理（自动销毁所有追踪的资源）
 * runner.destroy();
 * ```
 */
export class DemoRunner {
  /** Demo 配置 */
  private config: Required<DemoConfig>;

  /** 运行状态 */
  private state: DemoState = State.UNINITIALIZED;

  /** WebGL 设备 */
  private _device: WebGLDevice | null = null;

  /** 画布元素 */
  private _canvas: HTMLCanvasElement | null = null;

  /** 渲染目标纹理 */
  private renderTargetTexture: MSpec.IRHITexture | null = null;

  /** 深度缓冲区纹理 */
  private depthTexture: MSpec.IRHITexture | null = null;

  /** 动画帧 ID */
  private animationId: number = 0;

  /** 渲染回调 */
  private renderCallback: RenderCallback | null = null;

  /** 清理回调列表 */
  private cleanupCallbacks: CleanupCallback[] = [];

  /** 追踪的资源 */
  private trackedResources: Array<{ destroy(): void }> = [];

  /** 键盘事件回调 */
  private keyCallbacks: Map<string, KeyCallback[]> = new Map();

  /** 窗口大小变化回调 */
  private resizeCallbacks: ResizeCallback[] = [];

  /** 时间追踪 */
  private lastTime: number = 0;
  private totalTime: number = 0;
  private frameCount: number = 0;

  /** 事件监听器引用（用于清理） */
  private boundHandleResize: () => void;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private boundHandleBeforeUnload: () => void;
  private boundHandleCanvasFocus: () => void;

  /** 渲染目标视图缓存（避免每帧创建） */
  private renderTargetView: MSpec.IRHITextureView | null = null;
  private depthTextureView: MSpec.IRHITextureView | null = null;

  /**
   * 创建 Demo 运行器
   * @param config Demo 配置
   */
  constructor(config: DemoConfig) {
    this.config = {
      canvasId: config.canvasId,
      name: config.name || 'RHI Demo',
      deviceOptions: config.deviceOptions || {},
      autoResize: config.autoResize ?? true,
      showStats: config.showStats ?? false,
      clearColor: config.clearColor || [0.1, 0.1, 0.1, 1.0],
    };

    // 绑定事件处理器
    this.boundHandleResize = this.handleResize.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleBeforeUnload = () => this.destroy();
    this.boundHandleCanvasFocus = () => this._canvas?.focus();
  }

  // ==================== 公开属性 ====================

  /** 获取 WebGL 设备 */
  get device(): WebGLDevice {
    if (!this._device) {
      throw new Error(`[${this.config.name}] 设备未初始化，请先调用 init()`);
    }
    return this._device;
  }

  /** 获取画布元素 */
  get canvas(): HTMLCanvasElement {
    if (!this._canvas) {
      throw new Error(`[${this.config.name}] 画布未初始化，请先调用 init()`);
    }
    return this._canvas;
  }

  /** 获取画布宽度 */
  get width(): number {
    return this._canvas?.width || 0;
  }

  /** 获取画布高度 */
  get height(): number {
    return this._canvas?.height || 0;
  }

  /** 获取渲染目标纹理 */
  get renderTarget(): MSpec.IRHITexture {
    if (!this.renderTargetTexture) {
      throw new Error(`[${this.config.name}] 渲染目标未初始化`);
    }
    return this.renderTargetTexture;
  }

  /** 获取当前状态 */
  get currentState(): DemoState {
    return this.state;
  }

  /** 是否正在运行 */
  get isRunning(): boolean {
    return this.state === State.RUNNING;
  }

  // ==================== 生命周期方法 ====================

  /**
   * 初始化 Demo
   */
  async init(): Promise<void> {
    if (this.state !== State.UNINITIALIZED) {
      console.warn(`[${this.config.name}] 已初始化，跳过重复初始化`);
      return;
    }

    console.info(`[${this.config.name}] 开始初始化...`);

    // 1. 获取画布
    this._canvas = document.getElementById(this.config.canvasId) as HTMLCanvasElement;
    if (!this._canvas) {
      throw new Error(`[${this.config.name}] 找不到画布元素: ${this.config.canvasId}`);
    }

    // 确保 Canvas 可聚焦并自动获得焦点
    this._canvas.tabIndex = 1;
    this._canvas.style.outline = 'none';
    this._canvas.focus();
    this._canvas.addEventListener('click', this.boundHandleCanvasFocus);

    // 2. 设置画布大小
    this.updateCanvasSize();

    // 3. 创建 WebGL 设备
    this._device = new WebGLDevice(this._canvas, this.config.deviceOptions);
    console.info(`[${this.config.name}] WebGL 设备创建成功`);

    // 4. 创建默认渲染目标
    this.createRenderTarget();

    // 5. 设置事件监听
    this.setupEventListeners();

    // 6. 设置上下文丢失处理
    this._device.setEventCallbacks({
      onContextLost: () => {
        console.warn(`[${this.config.name}] WebGL 上下文丢失`);
        this.pause();
      },
      onContextRestored: () => {
        console.info(`[${this.config.name}] WebGL 上下文恢复`);
        this.createRenderTarget();
        if (this.renderCallback) {
          this.resume();
        }
      },
    });

    this.state = State.INITIALIZED;
    console.info(`[${this.config.name}] 初始化完成`);
  }

  /**
   * 启动渲染循环
   * @param callback 渲染回调函数
   */
  start(callback: RenderCallback): void {
    if (this.state === State.UNINITIALIZED) {
      throw new Error(`[${this.config.name}] 请先调用 init() 初始化`);
    }

    if (this.state === State.DESTROYED) {
      throw new Error(`[${this.config.name}] Demo 已销毁，无法启动`);
    }

    this.renderCallback = callback;
    this.lastTime = performance.now() / 1000;
    this.totalTime = 0;
    this.frameCount = 0;
    this.state = State.RUNNING;

    this.renderLoop();

    console.info(`[${this.config.name}] 渲染循环已启动`);
  }

  /**
   * 暂停渲染
   */
  pause(): void {
    if (this.state !== State.RUNNING) {
      return;
    }

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }

    this.state = State.PAUSED;
    console.info(`[${this.config.name}] 渲染已暂停`);
  }

  /**
   * 恢复渲染
   */
  resume(): void {
    if (this.state !== State.PAUSED) {
      return;
    }

    this.lastTime = performance.now() / 1000;
    this.state = State.RUNNING;
    this.renderLoop();

    console.info(`[${this.config.name}] 渲染已恢复`);
  }

  /**
   * 停止渲染循环（不销毁资源）
   */
  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }

    this.renderCallback = null;
    this.state = State.INITIALIZED;

    console.info(`[${this.config.name}] 渲染循环已停止`);
  }

  /**
   * 销毁 Demo，释放所有资源
   */
  destroy(): void {
    if (this.state === State.DESTROYED) {
      return;
    }

    console.info(`[${this.config.name}] 开始销毁...`);

    // 1. 停止渲染
    this.stop();

    // 2. 执行清理回调
    for (const callback of this.cleanupCallbacks) {
      try {
        callback();
      } catch (e) {
        console.error(`[${this.config.name}] 清理回调执行失败:`, e);
      }
    }
    this.cleanupCallbacks = [];

    // 3. 销毁追踪的资源
    for (const resource of this.trackedResources) {
      try {
        resource.destroy();
      } catch (e) {
        console.error(`[${this.config.name}] 资源销毁失败:`, e);
      }
    }
    this.trackedResources = [];

    // 4. 销毁渲染目标和视图
    this.renderTargetView = null;
    this.depthTextureView = null;
    if (this.renderTargetTexture) {
      this.renderTargetTexture.destroy();
      this.renderTargetTexture = null;
    }
    if (this.depthTexture) {
      this.depthTexture.destroy();
      this.depthTexture = null;
    }

    // 5. 移除事件监听
    this.removeEventListeners();

    // 6. 销毁设备
    if (this._device) {
      this._device.destroy();
      this._device = null;
    }

    this._canvas = null;
    this.state = State.DESTROYED;

    console.info(`[${this.config.name}] 销毁完成`);
  }

  // ==================== 资源管理 ====================

  /**
   * 追踪资源，在 destroy 时自动销毁
   * @param resource 要追踪的资源
   * @returns 返回原资源（便于链式调用）
   */
  track<T extends { destroy(): void }>(resource: T): T {
    this.trackedResources.push(resource);
    return resource;
  }

  /**
   * 取消追踪资源
   * @param resource 要取消追踪的资源
   */
  untrack(resource: { destroy(): void }): void {
    const index = this.trackedResources.indexOf(resource);
    if (index !== -1) {
      this.trackedResources.splice(index, 1);
    }
  }

  /**
   * 注册清理回调
   * @param callback 清理回调函数
   */
  onCleanup(callback: CleanupCallback): void {
    this.cleanupCallbacks.push(callback);
  }

  // ==================== 渲染辅助 ====================

  /**
   * 创建命令编码器并自动配置渲染通道
   * @param label 命令标签
   * @returns 渲染通道描述符和编码器
   */
  beginFrame(label?: string): {
    encoder: MSpec.IRHICommandEncoder;
    passDescriptor: {
      colorAttachments: Array<{
        view: MSpec.IRHITextureView;
        loadOp: 'clear' | 'load';
        storeOp: 'store' | 'discard';
        clearColor: [number, number, number, number];
      }>;
      depthStencilAttachment?: {
        view: MSpec.IRHITextureView;
        depthLoadOp: 'clear' | 'load';
        depthStoreOp: 'store' | 'discard';
        depthClearValue: number;
        stencilLoadOp?: 'clear' | 'load';
        stencilStoreOp?: 'store' | 'discard';
        stencilClearValue?: number;
      };
    };
  } {
    if (!this.renderTargetView) {
      throw new Error(`[${this.config.name}] 渲染目标视图未初始化`);
    }

    const encoder = this.device.createCommandEncoder(label || `${this.config.name} Frame`);

    const passDescriptor: {
      colorAttachments: Array<{
        view: MSpec.IRHITextureView;
        loadOp: 'clear' | 'load';
        storeOp: 'store' | 'discard';
        clearColor: [number, number, number, number];
      }>;
      depthStencilAttachment?: {
        view: MSpec.IRHITextureView;
        depthLoadOp: 'clear' | 'load';
        depthStoreOp: 'store' | 'discard';
        depthClearValue: number;
        stencilLoadOp?: 'clear' | 'load';
        stencilStoreOp?: 'store' | 'discard';
        stencilClearValue?: number;
      };
    } = {
      colorAttachments: [
        {
          view: this.renderTargetView,
          loadOp: 'clear' as const,
          storeOp: 'store' as const,
          clearColor: this.config.clearColor,
        },
      ],
    };

    // 添加深度缓冲区附件
    if (this.depthTextureView) {
      passDescriptor.depthStencilAttachment = {
        view: this.depthTextureView,
        depthLoadOp: 'clear' as const,
        depthStoreOp: 'store' as const,
        depthClearValue: 1.0,
        stencilLoadOp: 'clear' as const,
        stencilStoreOp: 'store' as const,
        stencilClearValue: 0,
      };
    }

    return { encoder, passDescriptor };
  }

  /**
   * 结束帧并提交到画布
   * @param encoder 命令编码器
   */
  endFrame(encoder: MSpec.IRHICommandEncoder): void {
    if (!this.renderTargetView) {
      throw new Error(`[${this.config.name}] 渲染目标视图未初始化`);
    }

    // 复制到画布
    encoder.copyTextureToCanvas({
      source: this.renderTargetView,
      destination: this.canvas,
    });

    // 提交
    this.device.submit([encoder.finish()]);
  }

  /**
   * 创建或重建渲染目标纹理
   * @param config 渲染目标配置
   */
  createRenderTarget(config?: RenderTargetConfig): MSpec.IRHITexture {
    // 销毁旧的渲染目标和视图
    if (this.renderTargetView) {
      this.renderTargetView = null;
    }
    if (this.depthTextureView) {
      this.depthTextureView = null;
    }
    if (this.renderTargetTexture) {
      this.renderTargetTexture.destroy();
    }
    if (this.depthTexture) {
      this.depthTexture.destroy();
    }

    const width = config?.width || this.width;
    const height = config?.height || this.height;

    // 创建颜色渲染目标
    // 注意：WebGL 实现中 usage 主要用于语义标记，实际纹理可以多用途使用
    this.renderTargetTexture = this.device.createTexture({
      width,
      height,
      format: config?.format || MSpec.RHITextureFormat.RGBA8_UNORM,
      usage: MSpec.RHITextureUsage.RENDER_ATTACHMENT,
      dimension: MSpec.RHITextureType.TEXTURE_2D,
      label: config?.label || `${this.config.name} RenderTarget`,
    });

    // 创建深度缓冲区
    this.depthTexture = this.device.createTexture({
      width,
      height,
      format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
      usage: MSpec.RHITextureUsage.RENDER_ATTACHMENT,
      dimension: MSpec.RHITextureType.TEXTURE_2D,
      label: `${this.config.name} DepthBuffer`,
    });

    // 创建并缓存视图（避免每帧创建）
    this.renderTargetView = this.renderTargetTexture.createView();
    this.depthTextureView = this.depthTexture.createView();

    return this.renderTargetTexture;
  }

  // ==================== 事件处理 ====================

  /**
   * 注册键盘事件回调
   * @param key 键名（如 'Escape', 'Space'）或 '*' 表示所有键
   * @param callback 回调函数
   */
  onKey(key: string, callback: KeyCallback): void {
    if (!this.keyCallbacks.has(key)) {
      this.keyCallbacks.set(key, []);
    }
    this.keyCallbacks.get(key)!.push(callback);
  }

  /**
   * 注册窗口大小变化回调
   * @param callback 回调函数
   */
  onResize(callback: ResizeCallback): void {
    this.resizeCallbacks.push(callback);
  }

  // ==================== 私有方法 ====================

  /** 渲染循环 */
  private renderLoop = (): void => {
    if (this.state !== State.RUNNING) {
      return;
    }

    const currentTime = performance.now() / 1000;
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.totalTime += deltaTime;
    this.frameCount++;

    try {
      if (this.renderCallback) {
        this.renderCallback(deltaTime, this.totalTime);
      }
    } catch (e) {
      console.error(`[${this.config.name}] 渲染错误:`, e);
    }

    this.animationId = requestAnimationFrame(this.renderLoop);
  };

  /** 更新画布大小 */
  private updateCanvasSize(): void {
    if (this._canvas) {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;

      // 设置canvas实际像素尺寸 (考虑设备像素比)
      this._canvas.width = Math.floor(displayWidth * dpr);
      this._canvas.height = Math.floor(displayHeight * dpr);

      // 设置CSS显示尺寸
      this._canvas.style.width = displayWidth + 'px';
      this._canvas.style.height = displayHeight + 'px';
    }
  }

  /** 设置事件监听器 */
  private setupEventListeners(): void {
    if (this.config.autoResize) {
      window.addEventListener('resize', this.boundHandleResize);
    }
    window.addEventListener('keydown', this.boundHandleKeyDown);

    // 页面卸载时清理
    window.addEventListener('beforeunload', this.boundHandleBeforeUnload);
  }

  /** 移除事件监听器 */
  private removeEventListeners(): void {
    window.removeEventListener('resize', this.boundHandleResize);
    window.removeEventListener('keydown', this.boundHandleKeyDown);
    window.removeEventListener('beforeunload', this.boundHandleBeforeUnload);
    if (this._canvas) {
      this._canvas.removeEventListener('click', this.boundHandleCanvasFocus);
    }
  }

  /** 处理窗口大小变化 */
  private handleResize(): void {
    this.updateCanvasSize();

    // 重建渲染目标
    if (this._device && this.state !== State.DESTROYED) {
      this.createRenderTarget();
    }

    // 通知回调
    for (const callback of this.resizeCallbacks) {
      try {
        callback(this.width, this.height);
      } catch (e) {
        console.error(`[${this.config.name}] resize 回调执行失败:`, e);
      }
    }
  }

  /** 处理键盘事件 */
  private handleKeyDown(event: KeyboardEvent): void {
    // eslint-disable-next-line no-console
    console.log(
      `[DemoRunner] KeyDown: code=${event.code}, key=${event.key}, registered=${Array.from(this.keyCallbacks.keys()).join(',')}`
    );
    const executedCallbacks = new Set<KeyCallback>();

    const runCallbacks = (key: string, callbacks: KeyCallback[]) => {
      // eslint-disable-next-line no-console
      console.log(`[DemoRunner] Running callbacks for key: ${key}`);
      for (const callback of callbacks) {
        if (!executedCallbacks.has(callback)) {
          try {
            callback(key, event);
          } catch (e) {
            console.error(`[${this.config.name}] Key callback error:`, e);
          }
          executedCallbacks.add(callback);
        }
      }
    };

    // 1. 尝试匹配 code (物理键码，如 "KeyA", "Digit1", "Escape")
    // 这是游戏和跨布局应用的推荐方式
    const codeCallbacks = this.keyCallbacks.get(event.code);
    if (codeCallbacks) {
      runCallbacks(event.code, codeCallbacks);
    }

    // 2. 尝试匹配 key (字符值，如 "a", "1", "Escape")
    // 这是处理字符输入的推荐方式，也兼容用户习惯使用 "1" 而不是 "Digit1" 的情况
    if (event.key !== event.code) {
      const keyCallbacks = this.keyCallbacks.get(event.key);
      if (keyCallbacks) {
        runCallbacks(event.key, keyCallbacks);
      }
    }

    // 3. 增强匹配：Digit 系列 (Digit1 -> 1)
    if (event.code.startsWith('Digit')) {
      const digit = event.code.replace('Digit', '');
      const digitCallbacks = this.keyCallbacks.get(digit);
      if (digitCallbacks) {
        runCallbacks(digit, digitCallbacks);
      }
    }

    // 4. 增强匹配：Key 系列 (KeyA -> a, KeyA -> A)
    if (event.code.startsWith('Key')) {
      const char = event.code.replace('Key', '');
      // 尝试大写
      const upperCallbacks = this.keyCallbacks.get(char.toUpperCase());
      if (upperCallbacks) {
        runCallbacks(char.toUpperCase(), upperCallbacks);
      }
      // 尝试小写
      const lowerCallbacks = this.keyCallbacks.get(char.toLowerCase());
      if (lowerCallbacks) {
        runCallbacks(char.toLowerCase(), lowerCallbacks);
      }
    }

    // 5. 全局回调
    const allCallbacks = this.keyCallbacks.get('*');
    if (allCallbacks) {
      runCallbacks('*', allCallbacks);
    }
  }

  // ==================== 静态工具方法 ====================

  /**
   * 显示错误信息到页面
   * @param message 错误消息
   */
  static showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 0, 0, 0.9);
      color: white;
      padding: 20px 30px;
      border-radius: 10px;
      font-family: monospace;
      font-size: 14px;
      z-index: 10000;
      max-width: 80%;
      text-align: center;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
  }

  /**
   * 显示帮助信息
   * @param lines 帮助文本行
   */
  static showHelp(lines: string[]): void {
    console.info('控制说明:');
    for (const line of lines) {
      console.info(`  ${line}`);
    }
  }
}
