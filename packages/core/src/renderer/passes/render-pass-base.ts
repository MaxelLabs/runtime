/**
 * render-pass-base.ts
 * 渲染通道基类 - 基于RHI硬件抽象层
 * 严格遵循IRHIRenderPass接口规范
 */

import type {
  IRHIDevice,
  IRHICommandEncoder,
  IRHIRenderPass,
  IRHITextureView,
  IRHIRenderPipeline,
  IRHIBindGroup,
} from '../../interface/rhi';
import type { Camera } from '../../camera/camera';
import type { RenderElement } from '../render-element';
import { EventDispatcher } from '../../base/event-dispatcher';

/**
 * 渲染通道附件配置
 */
export interface RenderPassAttachment {
  /**
   * 纹理视图
   */
  view: IRHITextureView;

  /**
   * 加载操作
   */
  loadOp: 'load' | 'clear' | 'none';

  /**
   * 存储操作
   */
  storeOp: 'store' | 'discard';

  /**
   * 清除值
   */
  clearValue?: [number, number, number, number] | number;
}

/**
 * 渲染通道配置
 */
export interface RenderPassConfig {
  /**
   * 通道名称
   */
  name: string;

  /**
   * 颜色附件
   */
  colorAttachments: RenderPassAttachment[];

  /**
   * 深度模板附件
   */
  depthStencilAttachment?: RenderPassAttachment & {
    /**
     * 深度写入启用
     */
    depthWriteEnabled?: boolean;

    /**
     * 模板加载操作
     */
    stencilLoadOp?: 'load' | 'clear' | 'none';

    /**
     * 模板存储操作
     */
    stencilStoreOp?: 'store' | 'discard';

    /**
     * 模板清除值
     */
    stencilClearValue?: number;
  };

  /**
   * 视口设置
   */
  viewport?: {
    x: number;
    y: number;
    width: number;
    height: number;
    minDepth?: number;
    maxDepth?: number;
  };
}

/**
 * 渲染通道统计信息
 */
export interface RenderPassStatistics {
  /**
   * 绘制调用次数
   */
  drawCalls: number;

  /**
   * 渲染的元素数量
   */
  elementsRendered: number;

  /**
   * 通道执行时间(毫秒)
   */
  executionTime: number;

  /**
   * 管线状态切换次数
   */
  pipelineChanges: number;

  /**
   * 绑定组切换次数
   */
  bindGroupChanges: number;
}

/**
 * 渲染通道事件
 */
export const RENDER_PASS_EVENTS = {
  BEFORE_EXECUTE: 'beforeExecute',
  AFTER_EXECUTE: 'afterExecute',
  ELEMENT_RENDERED: 'elementRendered',
  ERROR: 'error',
} as const;

/**
 * 渲染通道基类
 * 封装RHI渲染通道，提供统一的渲染接口
 */
export abstract class RenderPassBase extends EventDispatcher {
  protected device: IRHIDevice;
  protected config: RenderPassConfig;
  protected statistics: RenderPassStatistics;
  protected enabled = true;

  // 当前渲染状态
  protected currentRenderPass: IRHIRenderPass | null = null;
  protected currentPipeline: IRHIRenderPipeline | null = null;

  /**
   * 构造函数
   */
  constructor(device: IRHIDevice, config: RenderPassConfig) {
    super();
    this.device = device;
    this.config = config;
    this.statistics = {
      drawCalls: 0,
      elementsRendered: 0,
      executionTime: 0,
      pipelineChanges: 0,
      bindGroupChanges: 0,
    };
  }

  /**
   * 获取通道名称
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * 获取配置
   */
  getConfig(): RenderPassConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<RenderPassConfig>): void {
    Object.assign(this.config, newConfig);
  }

  /**
   * 获取统计信息
   */
  getStatistics(): RenderPassStatistics {
    return { ...this.statistics };
  }

  /**
   * 重置统计信息
   */
  resetStatistics(): void {
    this.statistics.drawCalls = 0;
    this.statistics.elementsRendered = 0;
    this.statistics.executionTime = 0;
    this.statistics.pipelineChanges = 0;
    this.statistics.bindGroupChanges = 0;
  }

  /**
   * 获取是否启用
   */
  getEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 设置是否启用
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 执行渲染通道
   */
  execute(commandEncoder: IRHICommandEncoder, camera: Camera, renderElements: readonly RenderElement[]): void {
    if (!this.enabled || renderElements.length === 0) {
      return;
    }

    const startTime = performance.now();
    this.resetStatistics();

    try {
      // 触发执行前事件
      this.dispatchEvent(RENDER_PASS_EVENTS.BEFORE_EXECUTE, {
        pass: this,
        camera,
        elementsCount: renderElements.length,
      });

      // 开始渲染通道
      this.currentRenderPass = commandEncoder.beginRenderPass({
        colorAttachments: this.config.colorAttachments.map((attachment) => ({
          view: attachment.view,
          loadOp: attachment.loadOp,
          storeOp: attachment.storeOp,
          clearColor: attachment.clearValue as [number, number, number, number] | undefined,
        })),
        depthStencilAttachment: this.config.depthStencilAttachment
          ? {
              view: this.config.depthStencilAttachment.view,
              depthLoadOp: this.config.depthStencilAttachment.loadOp,
              depthStoreOp: this.config.depthStencilAttachment.storeOp,
              clearDepth: this.config.depthStencilAttachment.clearValue as number | undefined,
              depthWriteEnabled: this.config.depthStencilAttachment.depthWriteEnabled,
              stencilLoadOp: this.config.depthStencilAttachment.stencilLoadOp,
              stencilStoreOp: this.config.depthStencilAttachment.stencilStoreOp,
              clearStencil: this.config.depthStencilAttachment.stencilClearValue,
            }
          : undefined,
        label: this.config.name,
      });

      // 设置视口
      if (this.config.viewport) {
        const vp = this.config.viewport;
        this.currentRenderPass.setViewport(vp.x, vp.y, vp.width, vp.height, vp.minDepth, vp.maxDepth);
      }

      // 执行通道特定的渲染逻辑
      this.render(this.currentRenderPass, camera, renderElements);

      // 结束渲染通道
      this.currentRenderPass.end();

      // 更新统计信息
      this.statistics.executionTime = performance.now() - startTime;

      // 触发执行后事件
      this.dispatchEvent(RENDER_PASS_EVENTS.AFTER_EXECUTE, {
        pass: this,
        statistics: this.statistics,
      });
    } catch (error) {
      console.error(`RenderPass ${this.config.name} 执行失败:`, error);
      this.dispatchEvent(RENDER_PASS_EVENTS.ERROR, { error });
    } finally {
      this.currentRenderPass = null;
      this.currentPipeline = null;
    }
  }

  /**
   * 渲染元素
   * @param renderPass RHI渲染通道
   * @param element 渲染元素
   */
  protected renderElement(renderPass: IRHIRenderPass, element: RenderElement): void {
    try {
      // 获取或创建渲染管线
      const pipeline = this.getRenderPipeline(element);
      if (!pipeline) {
        console.warn(`无法为元素 ${element.id} 获取渲染管线`);
        return;
      }

      // 设置渲染管线（如果变化）
      if (this.currentPipeline !== pipeline) {
        renderPass.setPipeline(pipeline);
        this.currentPipeline = pipeline;
        this.statistics.pipelineChanges++;
      }

      // 设置顶点缓冲区
      const mesh = element.mesh;
      const vertexBuffer = mesh.getVertexBuffer();
      if (vertexBuffer) {
        renderPass.setVertexBuffer(0, vertexBuffer);
      }

      // 设置索引缓冲区
      const indexBuffer = mesh.getIndexBuffer();
      if (indexBuffer) {
        renderPass.setIndexBuffer(indexBuffer, mesh.getIndexFormat());
      }

      // 设置绑定组
      const bindGroups = this.getBindGroups(element);
      if (bindGroups) {
        for (let i = 0; i < bindGroups.length; i++) {
          renderPass.setBindGroup(i, bindGroups[i]);
        }
        this.statistics.bindGroupChanges++;
      }

      // 执行绘制
      const indexCount = mesh.getIndexCount();
      if (indexCount > 0) {
        renderPass.drawIndexed(indexCount);
      } else {
        const vertexCount = mesh.getVertexCount();
        renderPass.draw(vertexCount);
      }

      this.statistics.drawCalls++;
      this.statistics.elementsRendered++;

      // 触发元素渲染事件
      this.dispatchEvent(RENDER_PASS_EVENTS.ELEMENT_RENDERED, {
        pass: this,
        element,
      });
    } catch (error) {
      console.error(`渲染元素 ${element.id} 失败:`, error);
    }
  }

  /**
   * 抽象方法：执行渲染
   */
  protected abstract render(renderPass: IRHIRenderPass, camera: Camera, renderElements: readonly RenderElement[]): void;

  /**
   * 抽象方法：获取渲染管线
   */
  protected abstract getRenderPipeline(element: RenderElement): IRHIRenderPipeline | null;

  /**
   * 抽象方法：获取绑定组
   */
  protected abstract getBindGroups(element: RenderElement): IRHIBindGroup[] | null;

  /**
   * 销毁渲染通道
   */
  destroy(): void {
    this.currentRenderPass = null;
    this.currentPipeline = null;
    this.removeAllListeners();
  }
  removeAllListeners() {
    throw new Error('Method not implemented.');
  }
}
