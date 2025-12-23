import { logError } from '../utils';

/**
 * Canvas 配置选项
 */
export interface CanvasOptions {
  /**
   * 是否自动处理设备像素比
   * @default true
   */
  handleDevicePixelRatio?: boolean;

  /**
   * 最大设备像素比限制（防止在超高 DPI 设备上性能问题）
   * @default 2
   */
  maxDevicePixelRatio?: number;

  /**
   * 是否监听窗口 resize 事件
   * @default false
   */
  autoResize?: boolean;
}

/**
 * 画布类，封装HTML画布元素
 *
 * @remarks
 * 支持高 DPI 屏幕（Retina 等），自动处理 devicePixelRatio。
 *
 * @example
 * ```typescript
 * // 基本用法
 * const canvas = new Canvas('myCanvas');
 *
 * // 启用高 DPI 支持
 * const canvas = new Canvas('myCanvas', { handleDevicePixelRatio: true });
 *
 * // 自动调整大小
 * const canvas = new Canvas('myCanvas', { autoResize: true });
 * ```
 */
export class Canvas {
  /** HTML画布元素 */
  private element: HTMLCanvasElement;

  /** 是否处理设备像素比 */
  private handleDPR: boolean;

  /** 最大设备像素比 */
  private maxDPR: number;

  /** 当前使用的设备像素比 */
  private currentDPR: number = 1;

  /** resize 事件处理器 */
  private resizeHandler: (() => void) | null = null;

  /** 是否已释放 */
  private _disposed: boolean = false;

  /**
   * 创建画布
   * @param canvas HTML画布元素或Canvas ID
   * @param options 配置选项
   */
  constructor(canvas: HTMLCanvasElement | string, options: CanvasOptions = {}) {
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('Canvas类只能在浏览器环境中使用。' + '如果您在Node.js或SSR环境中运行，请使用其他方式创建画布。');
    }

    const { handleDevicePixelRatio = true, maxDevicePixelRatio = 2, autoResize = false } = options;

    this.handleDPR = handleDevicePixelRatio;
    this.maxDPR = maxDevicePixelRatio;

    if (typeof canvas === 'string') {
      const element = document.getElementById(canvas) as HTMLCanvasElement;

      if (!element) {
        const errorMsg = `Canvas with id '${canvas}' not found.`;

        logError(errorMsg, 'Canvas', undefined);
      }

      if (!(element instanceof HTMLCanvasElement)) {
        const errorMsg = `Element with id '${canvas}' is not a canvas element.`;

        logError(errorMsg, 'Canvas', undefined);
      }

      this.element = element;
    } else {
      this.element = canvas;
    }

    // 初始化设备像素比
    this.updateDevicePixelRatio();

    // 设置自动 resize
    if (autoResize) {
      this.enableAutoResize();
    }
  }

  /**
   * 获取原生 HTML Canvas 元素
   */
  getElement(): HTMLCanvasElement {
    return this.element;
  }

  /**
   * 获取画布宽度（物理像素）
   */
  getWidth(): number {
    return this.element.width;
  }

  /**
   * 设置画布宽度（物理像素）
   */
  setWidth(value: number): void {
    this.element.width = value;
  }

  /**
   * 获取画布高度（物理像素）
   */
  getHeight(): number {
    return this.element.height;
  }

  /**
   * 设置画布高度（物理像素）
   */
  setHeight(value: number): void {
    this.element.height = value;
  }

  /**
   * 获取画布在网页中的宽度（CSS 像素）
   */
  getClientWidth(): number {
    return this.element.clientWidth;
  }

  /**
   * 获取画布在网页中的高度（CSS 像素）
   */
  getClientHeight(): number {
    return this.element.clientHeight;
  }

  /**
   * 获取当前设备像素比
   */
  getDevicePixelRatio(): number {
    return this.currentDPR;
  }

  /**
   * 获取系统设备像素比
   */
  getSystemDevicePixelRatio(): number {
    return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  }

  /**
   * 更新设备像素比
   * @returns 新的设备像素比
   */
  updateDevicePixelRatio(): number {
    if (this.handleDPR) {
      const systemDPR = this.getSystemDevicePixelRatio();

      this.currentDPR = Math.min(systemDPR, this.maxDPR);
    } else {
      this.currentDPR = 1;
    }

    return this.currentDPR;
  }

  /**
   * 根据客户端大小调整画布（考虑设备像素比）
   * @param width 可选的设定宽度（CSS 像素），如果不指定则使用 clientWidth
   * @param height 可选的设定高度（CSS 像素），如果不指定则使用 clientHeight
   * @returns 是否进行了大小调整
   *
   * @remarks
   * 此方法会自动处理设备像素比，确保在高 DPI 屏幕上渲染清晰。
   * 物理像素 = CSS 像素 × devicePixelRatio
   */
  resizeByClientSize(width?: number, height?: number): boolean {
    // 更新设备像素比
    this.updateDevicePixelRatio();

    const clientWidth = width ?? this.getClientWidth();
    const clientHeight = height ?? this.getClientHeight();

    // 计算物理像素尺寸
    const physicalWidth = Math.floor(clientWidth * this.currentDPR);
    const physicalHeight = Math.floor(clientHeight * this.currentDPR);

    if (this.getWidth() !== physicalWidth || this.getHeight() !== physicalHeight) {
      // 设置物理像素尺寸
      this.setWidth(physicalWidth);
      this.setHeight(physicalHeight);

      // 设置 CSS 尺寸（保持显示大小不变）
      this.element.style.width = `${clientWidth}px`;
      this.element.style.height = `${clientHeight}px`;

      return true;
    }

    return false;
  }

  /**
   * 启用自动 resize
   * @remarks 监听窗口 resize 事件，自动调整画布大小
   */
  enableAutoResize(): void {
    if (this.resizeHandler || this._disposed) {
      return;
    }

    this.resizeHandler = () => {
      this.resizeByClientSize();
    };

    window.addEventListener('resize', this.resizeHandler);
  }

  /**
   * 禁用自动 resize
   */
  disableAutoResize(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }

  /**
   * 获取 2D 渲染上下文
   * @param contextAttributes 上下文属性
   * @returns 2D 渲染上下文
   */
  getContext2D(contextAttributes?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D | null {
    const ctx = this.element.getContext('2d', contextAttributes);

    // 如果启用了 DPR 处理，需要缩放上下文
    if (ctx && this.handleDPR && this.currentDPR !== 1) {
      ctx.scale(this.currentDPR, this.currentDPR);
    }

    return ctx;
  }

  /**
   * 获取 WebGL 渲染上下文
   * @param contextAttributes 上下文属性
   * @returns WebGL 渲染上下文
   */
  getContextWebGL(contextAttributes?: WebGLContextAttributes): WebGLRenderingContext | null {
    return (
      this.element.getContext('webgl', contextAttributes) ||
      (this.element.getContext('experimental-webgl', contextAttributes) as WebGLRenderingContext | null)
    );
  }

  /**
   * 获取 WebGL2 渲染上下文
   * @param contextAttributes 上下文属性
   * @returns WebGL2 渲染上下文
   */
  getContextWebGL2(contextAttributes?: WebGLContextAttributes): WebGL2RenderingContext | null {
    return this.element.getContext('webgl2', contextAttributes);
  }

  /**
   * 检查是否支持 WebGL
   */
  static isWebGLSupported(): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    try {
      const canvas = document.createElement('canvas');

      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  /**
   * 检查是否支持 WebGL2
   */
  static isWebGL2Supported(): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    try {
      const canvas = document.createElement('canvas');

      return !!canvas.getContext('webgl2');
    } catch {
      return false;
    }
  }

  /**
   * 释放画布，释放资源
   * @remarks 实现 IDisposable 接口
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }

    this.disableAutoResize();
    this._disposed = true;
  }

  /**
   * 检查画布是否已释放
   */
  isDisposed(): boolean {
    return this._disposed;
  }
}
