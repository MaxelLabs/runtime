/**
 * forward-renderer.ts
 * 前向渲染器 - 基于RHI硬件抽象层
 * 实现前向渲染管线，按照不透明->透明的顺序渲染
 */

import type { Scene } from '../scene/scene';
import type { Camera } from '../camera/camera';
import type { IRHIDevice, IRHITextureView } from '../interface/rhi';
import { Renderer, type RendererConfig } from './renderer';
import { RenderQueue, type RenderQueueConfig } from './render-queue';
import { OpaquePass, type OpaquePassConfig } from './passes/opaque-pass';
import { TransparentPass, type TransparentPassConfig } from './passes/transparent-pass';

/**
 * 前向渲染器配置
 */
export interface ForwardRendererConfig extends RendererConfig {
  /**
   * 渲染队列配置
   */
  renderQueue?: RenderQueueConfig;

  /**
   * 不透明通道配置
   */
  opaquePass?: Partial<OpaquePassConfig>;

  /**
   * 透明通道配置
   */
  transparentPass?: Partial<TransparentPassConfig>;

  /**
   * 是否启用深度预通道
   */
  enableDepthPrepass?: boolean;

  /**
   * 是否启用后处理
   */
  enablePostProcessing?: boolean;
}

/**
 * 前向渲染器
 * 实现经典的前向渲染管线
 */
export class ForwardRenderer extends Renderer {
  protected override config: Required<ForwardRendererConfig>;
  private renderQueue: RenderQueue;
  private opaquePass: OpaquePass;
  private transparentPass: TransparentPass;

  // 渲染目标
  private colorTarget: IRHITextureView | null = null;
  private depthTarget: IRHITextureView | null = null;

  /**
   * 构造函数
   */
  constructor(device: IRHIDevice, config: ForwardRendererConfig = {}) {
    super(device, config);

    this.config = {
      enableDepthPrepass: false,
      enablePostProcessing: false,
      renderQueue: {},
      opaquePass: {},
      transparentPass: {},
      ...config,
    } as Required<ForwardRendererConfig>;

    // 初始化渲染组件
    this.initializeComponents();
  }

  /**
   * 初始化渲染组件
   */
  private initializeComponents(): void {
    // 创建渲染队列
    this.renderQueue = new RenderQueue(this.config.renderQueue);

    // 创建不透明渲染通道
    this.opaquePass = new OpaquePass(this.device, {
      name: 'OpaquePass',
      colorAttachments: [], // 将在渲染时动态设置
      ...this.config.opaquePass,
    });

    // 创建透明渲染通道
    this.transparentPass = new TransparentPass(this.device, {
      name: 'TransparentPass',
      colorAttachments: [], // 将在渲染时动态设置
      ...this.config.transparentPass,
    });
  }

  /**
   * 设置渲染目标
   */
  setRenderTargets(colorTarget: IRHITextureView, depthTarget?: IRHITextureView): void {
    this.colorTarget = colorTarget;
    this.depthTarget = depthTarget || null;
  }

  /**
   * 渲染场景
   */
  render(scene: Scene, camera: Camera): void {
    if (!this.colorTarget) {
      console.warn('ForwardRenderer: 未设置渲染目标');
      return;
    }

    try {
      // 开始渲染帧
      this.beginFrame();

      if (!this.commandEncoder) {
        console.error('ForwardRenderer: 命令编码器未初始化');
        return;
      }

      // 构建渲染队列
      this.renderQueue.build(scene, camera);

      // 获取渲染元素
      const opaqueElements = this.renderQueue.getOpaqueElements();
      const transparentElements = this.renderQueue.getTransparentElements();

      // 更新通道配置
      this.updatePassConfigurations();

      // 执行深度预通道（可选）
      if (this.config.enableDepthPrepass && this.depthTarget) {
        this.executeDepthPrepass(camera, opaqueElements);
      }

      // 执行不透明物体渲染通道
      if (opaqueElements.length > 0) {
        this.opaquePass.execute(this.commandEncoder, camera, opaqueElements);
      }

      // 执行透明物体渲染通道
      if (transparentElements.length > 0) {
        this.transparentPass.execute(this.commandEncoder, camera, transparentElements);
      }

      // 执行后处理（可选）
      if (this.config.enablePostProcessing) {
        this.executePostProcessing(camera);
      }

      // 结束渲染帧
      this.endFrame();

      // 更新统计信息
      this.updateRenderStatistics();
    } catch (error) {
      console.error('ForwardRenderer: 渲染失败:', error);
      this.dispatchEvent('renderError', { error });
    }
  }

  /**
   * 更新通道配置
   */
  private updatePassConfigurations(): void {
    if (!this.colorTarget) {
      return;
    }

    // 配置不透明通道
    const opaqueConfig = this.opaquePass.getConfig();
    opaqueConfig.colorAttachments = [
      {
        view: this.colorTarget,
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: this.config.clearColor,
      },
    ];

    if (this.depthTarget) {
      opaqueConfig.depthStencilAttachment = {
        view: this.depthTarget,
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: this.config.clearDepth,
        depthWriteEnabled: true,
        stencilLoadOp: 'clear',
        stencilStoreOp: 'store',
        stencilClearValue: this.config.clearStencil,
      };
    }

    this.opaquePass.updateConfig(opaqueConfig);

    // 配置透明通道
    const transparentConfig = this.transparentPass.getConfig();
    transparentConfig.colorAttachments = [
      {
        view: this.colorTarget,
        loadOp: 'load', // 透明通道需要加载之前的颜色
        storeOp: 'store',
      },
    ];

    if (this.depthTarget) {
      transparentConfig.depthStencilAttachment = {
        view: this.depthTarget,
        loadOp: 'load', // 透明通道需要加载之前的深度
        storeOp: 'store',
        depthWriteEnabled: false, // 透明物体通常不写入深度
      };
    }

    this.transparentPass.updateConfig(transparentConfig);
  }

  /**
   * 执行深度预通道（可选）
   */
  private executeDepthPrepass(camera: Camera, opaqueElements: readonly any[]): void {
    // TODO: 实现深度预通道
    // 深度预通道可以提高复杂场景的渲染性能
  }

  /**
   * 执行后处理（可选）
   */
  private executePostProcessing(camera: Camera): void {
    // TODO: 实现后处理管线
    // 支持HDR、色调映射、抗锯齿等后处理效果
  }

  /**
   * 更新渲染统计信息
   */
  private updateRenderStatistics(): void {
    const queueStats = this.renderQueue.getStatistics();
    const opaqueStats = this.opaquePass.getStatistics();
    const transparentStats = this.transparentPass.getStatistics();

    // 合并统计信息
    this.statistics.objects = queueStats.culledElements;
    this.statistics.drawCalls = opaqueStats.drawCalls + transparentStats.drawCalls;

    // 估算三角形和顶点数量（需要从网格数据获取实际值）
    this.statistics.triangles = this.statistics.drawCalls * 100; // 临时估算
    this.statistics.vertices = this.statistics.triangles * 3;
  }

  /**
   * 获取渲染队列
   */
  getRenderQueue(): RenderQueue {
    return this.renderQueue;
  }

  /**
   * 获取不透明通道
   */
  getOpaquePass(): OpaquePass {
    return this.opaquePass;
  }

  /**
   * 获取透明通道
   */
  getTransparentPass(): TransparentPass {
    return this.transparentPass;
  }

  /**
   * 更新配置
   */
  override updateConfig(newConfig: Partial<ForwardRendererConfig>): void {
    Object.assign(this.config, newConfig);

    // 更新渲染通道配置
    this.opaquePass.updateConfig({
      clearColor: this.config.clearColor,
      clearDepth: this.config.clearDepth,
      renderTarget: this.config.renderTarget,
    });

    this.transparentPass.updateConfig({
      blendMode: this.config.transparentBlendMode,
      renderTarget: this.config.renderTarget,
    });

    super.updateConfig(newConfig);
  }

  /**
   * 销毁渲染器
   */
  override destroy(): void {
    // 销毁渲染通道
    this.opaquePass.destroy();
    this.transparentPass.destroy();

    // 销毁渲染队列
    this.renderQueue.destroy();

    // 清理引用
    this.colorTarget = null;
    this.depthTarget = null;

    super.destroy();
  }
}
