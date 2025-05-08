import { RendererType, Container, ServiceKeys } from '@maxellabs/core';

/**
 * 渲染器配置接口
 */
export interface RendererOptions {
  /** Canvas元素或ID */
  canvas: HTMLCanvasElement | string,
  /** 是否启用抗锯齿 */
  antialias?: boolean,
  /** 是否启用alpha通道 */
  alpha?: boolean,
  /** 是否保留缓冲区内容 */
  preserveDrawingBuffer?: boolean,
  /** 首选低功耗GPU */
  powerPreference?: 'default' | 'high-performance' | 'low-power',
  /** 渲染器类型 */
  type?: RendererType,
}

/**
 * 渲染器接口
 */
export interface IRenderer {
  /** 初始化渲染器 */
  initialize(options: RendererOptions): Promise<void>,
  /** 调整大小 */
  resize(width: number, height: number): void,
  /** 渲染一帧 */
  render(): void,
  /** 销毁渲染器 */
  destroy(): void,
  /** 渲染器类型 */
  readonly type: RendererType,
  /** 画布元素 */
  readonly canvas: HTMLCanvasElement,
  /** 上下文 */
  readonly context: any,
}

/**
 * 渲染器工厂类
 * 负责创建和管理不同类型的渲染器
 */
export class RendererFactory {
  private static registeredRenderers: Map<RendererType, new () => IRenderer> = new Map();

  /**
   * 注册渲染器类型
   * @param type 渲染器类型
   * @param rendererClass 渲染器类
   */
  static registerRenderer (type: RendererType, rendererClass: new () => IRenderer): void {
    this.registeredRenderers.set(type, rendererClass);
  }

  /**
   * 创建渲染器实例
   * @param options 渲染器配置
   * @returns 渲染器实例
   */
  static async createRenderer (options: RendererOptions): Promise<IRenderer> {
    const container = Container.getInstance();
    const type = options.type || RendererType.WebGL2;

    if (!this.registeredRenderers.has(type)) {
      throw new Error(`Renderer type ${type} is not registered`);
    }

    const RendererClass = this.registeredRenderers.get(type)!;
    const renderer = new RendererClass();

    await renderer.initialize(options);

    // 注册到IOC容器
    container.register(ServiceKeys.RENDERER, renderer);

    return renderer;
  }

  /**
   * 判断当前环境是否支持指定的渲染器类型
   * @param type 渲染器类型
   * @returns 是否支持
   */
  static isSupported (type: RendererType): boolean {
    switch (type) {
      case RendererType.WebGL:
        return this.isWebGLSupported();
      case RendererType.WebGL2:
        return this.isWebGL2Supported();
      case RendererType.WebGPU:
        return this.isWebGPUSupported();
      default:
        return false;
    }
  }

  /**
   * 检测当前环境支持的最佳渲染器类型
   * @returns 最佳渲染器类型
   */
  static detectBestRenderer (): RendererType {
    if (this.isWebGL2Supported()) {
      return RendererType.WebGL2;
    } else if (this.isWebGLSupported()) {
      return RendererType.WebGL;
    } else if (this.isWebGPUSupported()) {
      return RendererType.WebGPU;
    }

    throw new Error('Current environment does not support any available renderer');
  }

  /**
   * 检测是否支持WebGL
   */
  private static isWebGLSupported (): boolean {
    try {
      const canvas = document.createElement('canvas');

      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      console.error('WebGL support check failed:', e);

      return false;
    }
  }

  /**
   * 检测是否支持WebGL2
   */
  private static isWebGL2Supported (): boolean {
    try {
      const canvas = document.createElement('canvas');

      return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
    } catch (e) {

      console.error('WebGL2 support check failed:', e);

      return false;
    }
  }

  /**
   * 检测是否支持WebGPU
   */
  private static isWebGPUSupported (): boolean {
    // WebGPU的支持检查
    // @ts-expect-error
    return !!(navigator.gpu && navigator.gpu.requestAdapter);
  }
}