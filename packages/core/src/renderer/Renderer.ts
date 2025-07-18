/**
 * renderer.ts
 * 基于RHI硬件抽象层的渲染器基类
 * 严格遵循RHI硬件抽象层接口规范
 */

import type { Scene } from '../scene/scene';
import type { Camera } from '../camera/camera';
import { EventDispatcher } from '../base/event-dispatcher';

// 暂时使用any类型，后续需要正确导入RHI类型
export interface IRHIDevice {
  createCommandEncoder(label?: string): IRHICommandEncoder;
  submit(commandBuffers: any[]): void;
  checkDeviceLost(): Promise<boolean>;
}

export interface IRHICommandEncoder {
  finish(descriptor?: { label?: string }): any;
}

/**
 * 渲染器配置（统一定义，扩展RendererConfiguration）
 */
export interface RendererConfig {
  /**
   * 渲染器类型
   */
  type?: 'webgl' | 'webgl2' | 'webgpu' | 'canvas2d' | 'svg';
  /**
   * 抗锯齿
   */
  antialias?: boolean;
  /**
   * 透明度
   */
  alpha?: boolean;
  /**
   * 深度缓冲
   */
  depth?: boolean;
  /**
   * 模板缓冲
   */
  stencil?: boolean;
  /**
   * 保留绘图缓冲
   */
  preserveDrawingBuffer?: boolean;
  /**
   * 功率偏好
   */
  powerPreference?: 'default' | 'high-performance' | 'low-power';

  // 渲染器特定配置
  /**
   * 是否启用深度测试
   */
  enableDepthTest?: boolean;
  /**
   * 是否启用面剔除
   */
  enableFaceCulling?: boolean;
  /**
   * 是否启用多重采样抗锯齿
   */
  enableMSAA?: boolean;
  /**
   * MSAA采样数量
   */
  msaaSamples?: number;
  /**
   * 清除颜色
   */
  clearColor?: [number, number, number, number];
  /**
   * 清除深度值
   */
  clearDepth?: number;
  /**
   * 清除模板值
   */
  clearStencil?: number;
}

/**
 * 渲染统计信息
 */
export interface RenderStatistics {
  /**
   * 绘制调用次数
   */
  drawCalls: number;

  /**
   * 渲染的三角形数量
   */
  triangles: number;

  /**
   * 渲染的顶点数量
   */
  vertices: number;

  /**
   * 渲染的物体数量
   */
  objects: number;

  /**
   * 帧渲染时间(毫秒)
   */
  frameTime: number;

  /**
   * 帧率
   */
  fps: number;
}

/**
 * 渲染器事件
 */
export const RENDERER_EVENTS = {
  BEFORE_RENDER: 'beforeRender',
  AFTER_RENDER: 'afterRender',
  RENDER_ERROR: 'renderError',
} as const;

/**
 * 渲染器基类
 * 基于RHI硬件抽象层，提供跨平台渲染能力
 */
export abstract class Renderer extends EventDispatcher {
  protected device: IRHIDevice;
  protected commandEncoder: IRHICommandEncoder | null = null;
  protected config: Required<RendererConfig>;
  protected statistics: RenderStatistics;
  protected isRendering = false;

  // 帧时间记录
  private frameStartTime = 0;

  /**
   * 构造函数
   * @param device RHI设备实例
   * @param config 渲染配置
   */
  constructor(device: IRHIDevice, config: RendererConfig = {}) {
    super();

    this.device = device;
    // 默认配置
    this.config = {
      type: 'webgl',
      antialias: false,
      alpha: false,
      depth: true,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'default',
      enableDepthTest: true,
      enableFaceCulling: true,
      enableMSAA: false,
      msaaSamples: 4,
      clearColor: [0.0, 0.0, 0.0, 1.0],
      clearDepth: 1.0,
      clearStencil: 0,
      ...config,
    } as Required<RendererConfig>;

    this.statistics = {
      drawCalls: 0,
      triangles: 0,
      vertices: 0,
      objects: 0,
      frameTime: 0,
      fps: 0,
    };
  }

  /**
   * 获取RHI设备
   */
  getRHIDevice(): IRHIDevice {
    return this.device;
  }

  /**
   * 获取渲染配置
   */
  getConfig(): Required<RendererConfig> {
    return { ...this.config };
  }

  /**
   * 更新渲染配置
   */
  updateConfig(newConfig: Partial<RendererConfig>): void {
    Object.assign(this.config, newConfig);
  }

  /**
   * 获取渲染统计信息
   */
  getStatistics(): RenderStatistics {
    return { ...this.statistics };
  }

  /**
   * 重置渲染统计信息
   */
  resetStatistics(): void {
    this.statistics.drawCalls = 0;
    this.statistics.triangles = 0;
    this.statistics.vertices = 0;
    this.statistics.objects = 0;
  }

  /**
   * 开始新的渲染帧
   */
  protected beginFrame(): void {
    if (this.isRendering) {
      console.warn('Renderer: 上一帧渲染尚未完成');
      return;
    }

    this.isRendering = true;
    this.frameStartTime = performance.now();
    this.resetStatistics();

    // 创建新的命令编码器
    this.commandEncoder = this.device.createCommandEncoder('MainRenderCommandEncoder');

    // 触发渲染前事件
    this.dispatchEvent(RENDERER_EVENTS.BEFORE_RENDER, {
      renderer: this,
      device: this.device,
    });
  }

  /**
   * 结束当前渲染帧
   */
  protected endFrame(): void {
    if (!this.isRendering || !this.commandEncoder) {
      return;
    }

    try {
      // 完成命令编码
      const commandBuffer = this.commandEncoder.finish({
        label: 'MainRenderCommandBuffer',
      });

      // 提交命令到GPU
      this.device.submit([commandBuffer]);

      // 更新统计信息
      this.updateFrameStatistics();

      // 触发渲染后事件
      this.dispatchEvent(RENDERER_EVENTS.AFTER_RENDER, {
        renderer: this,
        statistics: this.statistics,
      });
    } catch (error) {
      console.error('Renderer: 渲染帧结束时发生错误:', error);
      this.dispatchEvent(RENDERER_EVENTS.RENDER_ERROR, { error });
    } finally {
      this.commandEncoder = null;
      this.isRendering = false;
    }
  }

  /**
   * 更新帧统计信息
   */
  private updateFrameStatistics(): void {
    const frameEndTime = performance.now();
    const frameTime = frameEndTime - this.frameStartTime;

    this.statistics.frameTime = frameTime;
    this.statistics.fps = frameTime > 0 ? Math.round(1000 / frameTime) : 0;
  }

  /**
   * 渲染场景
   * 抽象方法，由子类实现具体的渲染逻辑
   */
  abstract render(scene: Scene, camera: Camera): void;

  /**
   * 检查设备状态
   */
  async checkDeviceState(): Promise<void> {
    try {
      await this.device.checkDeviceLost();
    } catch (error) {
      console.error('Renderer: 设备丢失检查失败:', error);
      this.dispatchEvent(RENDERER_EVENTS.RENDER_ERROR, { error });
    }
  }

  /**
   * 销毁渲染器
   */
  override destroy(): void {
    if (this.isRendering) {
      console.warn('Renderer: 正在渲染时销毁渲染器');
    }

    this.commandEncoder = null;
    this.isRendering = false;

    // 清理事件监听器
    super.destroy();
  }
}
