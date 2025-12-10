/**
 * rendering/RenderTarget.ts
 * 渲染目标管理器 - 封装 FBO 创建、颜色/深度附件管理
 *
 * 功能特性：
 * - 简化离屏渲染：自动管理 FBO 和纹理资源
 * - 自动资源追踪：集成 DemoRunner 的资源追踪机制
 * - 多渲染目标支持：MRT（Multiple Render Targets）
 * - 可选深度缓冲：灵活的深度/模板附件配置
 * - 易用的 API：简化渲染通道描述符创建
 *
 * @example
 * ```typescript
 * import { RenderTarget } from '@maxellabs/rhi-demo-utils';
 *
 * const renderTarget = runner.track(
 *   new RenderTarget(runner.device, {
 *     width: 800,
 *     height: 600,
 *     colorAttachmentCount: 2,  // MRT with 2 targets
 *     depthFormat: RHITextureFormat.DEPTH24_UNORM_STENCIL8,
 *   })
 * );
 *
 * // 获取渲染通道描述符
 * const passDescriptor = renderTarget.getRenderPassDescriptor([0.1, 0.1, 0.1, 1.0]);
 *
 * // 获取颜色纹理进行后续采样
 * const colorTexture = renderTarget.getColorView(0);
 * ```
 */

import { MSpec } from '@maxellabs/core';
import type { RenderTargetOptions, RenderTargetResources, RHIRenderPassDescriptor } from './types';

export class RenderTarget {
  private device: MSpec.IRHIDevice;
  private options: Required<RenderTargetOptions>;
  private _resources: RenderTargetResources;
  private label: string;

  // ==================== 公开属性 ====================

  /**
   * 获取渲染目标宽度
   */
  get width(): number {
    return this.options.width;
  }

  /**
   * 获取渲染目标高度
   */
  get height(): number {
    return this.options.height;
  }

  /**
   * 获取渲染目标资源集合
   */
  get resources(): RenderTargetResources {
    return this._resources;
  }

  /**
   * 获取颜色附件数量
   */
  get colorAttachmentCount(): number {
    return this.options.colorAttachmentCount;
  }

  /**
   * 获取是否有深度附件
   */
  get hasDepthAttachment(): boolean {
    return this._resources.depthTexture !== undefined;
  }

  // ==================== 构造函数 ====================

  /**
   * 创建渲染目标
   * @param device RHI 设备实例
   * @param options 渲染目标配置选项
   */
  constructor(device: MSpec.IRHIDevice, options: RenderTargetOptions) {
    this.device = device;
    this.label = options.label || 'RenderTarget';

    // 合并选项，设置默认值
    this.options = {
      width: options.width,
      height: options.height,
      colorFormat: options.colorFormat ?? MSpec.RHITextureFormat.RGBA8_UNORM,
      depthFormat: options.depthFormat ?? MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
      colorAttachmentCount: options.colorAttachmentCount ?? 1,
      useMipmaps: options.useMipmaps ?? false,
      samples: options.samples ?? 1,
      label: this.label,
    };

    // 初始化资源
    this._resources = {
      colorTextures: [],
      colorViews: [],
    };

    // 创建所有资源
    this.createResources();
  }

  // ==================== 资源创建 ====================

  /**
   * 创建所有渲染目标资源
   * @private
   */
  private createResources(): void {
    // 创建颜色附件
    this.createColorAttachments();

    // 创建深度附件
    if (this.options.depthFormat !== null) {
      this.createDepthAttachment();
    }
  }

  /**
   * 创建颜色附件纹理和视图
   * @private
   */
  private createColorAttachments(): void {
    // 清空旧的颜色附件
    this._resources.colorTextures = [];
    this._resources.colorViews = [];

    for (let i = 0; i < this.options.colorAttachmentCount; i++) {
      // 创建颜色纹理
      // 注意：WebGL 实现中 usage 主要用于语义标记，实际纹理可以多用途使用
      const colorTexture = this.device.createTexture({
        width: this.options.width,
        height: this.options.height,
        format: this.options.colorFormat,
        usage: MSpec.RHITextureUsage.RENDER_ATTACHMENT,
        dimension: MSpec.RHITextureType.TEXTURE_2D,
        mipLevelCount: this.options.useMipmaps ? this.calculateMipLevels() : 1,
        sampleCount: this.options.samples,
        label: `${this.label} ColorAttachment[${i}]`,
      });

      // 创建颜色纹理视图
      const colorView = colorTexture.createView();

      this._resources.colorTextures.push(colorTexture);
      this._resources.colorViews.push(colorView);
    }
  }

  /**
   * 创建深度附件纹理和视图
   * @private
   */
  private createDepthAttachment(): void {
    if (!this.options.depthFormat || this.options.depthFormat === null) {
      return;
    }

    // 创建深度纹理
    const depthTexture = this.device.createTexture({
      width: this.options.width,
      height: this.options.height,
      format: this.options.depthFormat,
      usage: MSpec.RHITextureUsage.RENDER_ATTACHMENT,
      dimension: MSpec.RHITextureType.TEXTURE_2D,
      sampleCount: this.options.samples,
      label: `${this.label} DepthAttachment`,
    });

    // 创建深度纹理视图
    const depthView = depthTexture.createView();

    this._resources.depthTexture = depthTexture;
    this._resources.depthView = depthView;
  }

  /**
   * 计算 Mipmap 级别数
   * @private
   */
  private calculateMipLevels(): number {
    return Math.floor(Math.log2(Math.max(this.options.width, this.options.height))) + 1;
  }

  // ==================== 渲染通道 API ====================

  /**
   * 获取渲染通道描述符
   * 用于 encoder.beginRenderPass(descriptor)
   *
   * @param clearColor 清除颜色 [r, g, b, a]，范围 0-1
   * @param depthClearValue 深度清除值，范围 0-1（默认 1.0）
   * @returns 渲染通道描述符
   */
  getRenderPassDescriptor(
    clearColor?: [number, number, number, number],
    depthClearValue: number = 1.0
  ): RHIRenderPassDescriptor {
    // 清除颜色默认值
    const defaultClearColor: [number, number, number, number] = [0, 0, 0, 1];
    const finalClearColor = clearColor || defaultClearColor;

    // 构建颜色附件
    const colorAttachments = this._resources.colorViews.map((view) => ({
      view,
      loadOp: 'clear' as const,
      storeOp: 'store' as const,
      clearColor: finalClearColor,
    }));

    // 构建渲染通道描述符
    const descriptor: RHIRenderPassDescriptor = {
      colorAttachments,
    };

    // 添加深度模板附件（如果存在）
    if (this._resources.depthView) {
      descriptor.depthStencilAttachment = {
        view: this._resources.depthView,
        depthLoadOp: 'clear' as const,
        depthStoreOp: 'store' as const,
        clearDepth: depthClearValue,
        depthWriteEnabled: true,
        stencilLoadOp: 'clear' as const,
        stencilStoreOp: 'store' as const,
        clearStencil: 0,
      };
    }

    return descriptor;
  }

  /**
   * 获取颜色附件纹理视图
   *
   * @param index 附件索引（默认 0）
   * @returns 颜色纹理视图
   * @throws 如果索引超出范围
   */
  getColorView(index: number = 0): MSpec.IRHITextureView {
    if (index < 0 || index >= this._resources.colorViews.length) {
      throw new Error(
        `[${this.label}] 颜色附件索引越界：${index}（有效范围：0-${this._resources.colorViews.length - 1}）`
      );
    }
    return this._resources.colorViews[index];
  }

  /**
   * 获取颜色附件纹理
   *
   * @param index 附件索引（默认 0）
   * @returns 颜色纹理
   * @throws 如果索引超出范围
   */
  getColorTexture(index: number = 0): MSpec.IRHITexture {
    if (index < 0 || index >= this._resources.colorTextures.length) {
      throw new Error(
        `[${this.label}] 颜色附件索引越界：${index}（有效范围：0-${this._resources.colorTextures.length - 1}）`
      );
    }
    return this._resources.colorTextures[index];
  }

  /**
   * 获取深度附件纹理视图
   *
   * @returns 深度纹理视图，如果未启用深度则返回 undefined
   */
  getDepthView(): MSpec.IRHITextureView | undefined {
    return this._resources.depthView;
  }

  /**
   * 获取深度附件纹理
   *
   * @returns 深度纹理，如果未启用深度则返回 undefined
   */
  getDepthTexture(): MSpec.IRHITexture | undefined {
    return this._resources.depthTexture;
  }

  // ==================== 生命周期管理 ====================

  /**
   * 调整渲染目标大小
   * 销毁旧资源，创建新资源
   *
   * @param width 新宽度
   * @param height 新高度
   */
  resize(width: number, height: number): void {
    if (width === this.options.width && height === this.options.height) {
      return;
    }

    console.info(`[${this.label}] 调整大小：${this.options.width}x${this.options.height} -> ${width}x${height}`);

    // 销毁旧资源
    this.destroyResources();

    // 更新尺寸
    this.options.width = width;
    this.options.height = height;

    // 重新创建资源
    this.createResources();
  }

  /**
   * 销毁所有资源
   * 应在 demo 清理时调用（通常由 DemoRunner.track() 自动管理）
   */
  destroy(): void {
    this.destroyResources();
    console.info(`[${this.label}] 已销毁`);
  }

  /**
   * 销毁所有内部资源
   * @private
   */
  private destroyResources(): void {
    // 销毁颜色纹理和视图
    for (const view of this._resources.colorViews) {
      try {
        view.destroy();
      } catch (e) {
        console.warn(`[${this.label}] 销毁颜色视图失败:`, e);
      }
    }

    for (const texture of this._resources.colorTextures) {
      try {
        texture.destroy();
      } catch (e) {
        console.warn(`[${this.label}] 销毁颜色纹理失败:`, e);
      }
    }

    // 销毁深度纹理和视图
    if (this._resources.depthView) {
      try {
        this._resources.depthView.destroy();
      } catch (e) {
        console.warn(`[${this.label}] 销毁深度视图失败:`, e);
      }
    }

    if (this._resources.depthTexture) {
      try {
        this._resources.depthTexture.destroy();
      } catch (e) {
        console.warn(`[${this.label}] 销毁深度纹理失败:`, e);
      }
    }

    // 清空资源数组
    this._resources.colorTextures = [];
    this._resources.colorViews = [];
    this._resources.depthTexture = undefined;
    this._resources.depthView = undefined;
  }
}
