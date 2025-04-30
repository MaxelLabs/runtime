import type { Scene } from '../scene/scene';
import type { Camera } from '../camera/camera';

/**
 * 渲染器设置接口
 */
export interface RendererOptions {
  canvas: HTMLCanvasElement,
  width?: number,
  height?: number,
  clearColor?: [number, number, number, number],
  antialias?: boolean,
}

/**
 * 渲染器基类 - 处理场景渲染
 */
export abstract class Renderer {
  protected canvas: HTMLCanvasElement;
  protected width: number;
  protected height: number;
  protected clearColor: [number, number, number, number] = [0, 0, 0, 1];
  protected antialias: boolean = true;
  protected isInitialized: boolean = false;

  constructor (options: RendererOptions) {
    this.canvas = options.canvas;
    this.width = options.width || this.canvas.width;
    this.height = options.height || this.canvas.height;

    if (options.clearColor) {
      this.clearColor = options.clearColor;
    }

    if (options.antialias !== undefined) {
      this.antialias = options.antialias;
    }
  }

  /**
   * 初始化渲染器
   */
  public abstract initialize (): void;

  /**
   * 调整渲染器大小
   */
  public setSize (width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;

    // 子类应实现此方法以更新视口
    this.updateViewport();
  }

  /**
   * 更新视口
   */
  protected abstract updateViewport (): void;

  /**
   * 渲染场景
   */
  public abstract render (scene: Scene, camera: Camera): void;

  /**
   * 清除场景
   */
  protected abstract clear (): void;

  /**
   * 销毁渲染器并释放资源
   */
  public abstract dispose (): void;
}