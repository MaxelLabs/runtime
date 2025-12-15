/**
 * shadow/ShadowMap.ts
 * 阴影贴图管理器 - 封装深度纹理创建和管理
 *
 * 功能特性：
 * - 专门用于阴影贴图的深度纹理管理
 * - 自动创建比较采样器（用于PCF）
 * - 支持动态调整分辨率
 * - 提供渲染通道描述符
 *
 * @example
 * ```typescript
 * const shadowMap = runner.track(
 *   new ShadowMap(runner.device, {
 *     resolution: 1024,
 *     label: 'Main Shadow Map',
 *   })
 * );
 *
 * // 阴影Pass
 * const shadowPassDesc = shadowMap.getRenderPassDescriptor();
 * const shadowPass = encoder.beginRenderPass(shadowPassDesc);
 * // ... 渲染阴影投射物
 * shadowPass.end();
 *
 * // 场景Pass中使用阴影贴图
 * bindGroup.setTexture(shadowMap.depthView);
 * bindGroup.setSampler(shadowMap.sampler);
 * ```
 */

import { MSpec } from '@maxellabs/core';
import type { ShadowMapOptions } from './types';

export class ShadowMap {
  private device: MSpec.IRHIDevice;
  private _depthTexture: MSpec.IRHITexture | null = null;
  private _depthView: MSpec.IRHITextureView | null = null;
  private _sampler: MSpec.IRHISampler | null = null;
  private _resolution: number;
  private depthFormat: MSpec.RHITextureFormat;
  private label: string;

  // ==================== 公开属性 ====================

  /**
   * 获取阴影贴图分辨率
   */
  get resolution(): number {
    return this._resolution;
  }

  /**
   * 获取深度纹理
   */
  get depthTexture(): MSpec.IRHITexture {
    if (!this._depthTexture) {
      throw new Error(`[${this.label}] 深度纹理未初始化`);
    }
    return this._depthTexture;
  }

  /**
   * 获取深度纹理视图
   */
  get depthView(): MSpec.IRHITextureView {
    if (!this._depthView) {
      throw new Error(`[${this.label}] 深度视图未初始化`);
    }
    return this._depthView;
  }

  /**
   * 获取比较采样器（用于PCF阴影采样）
   */
  get sampler(): MSpec.IRHISampler {
    if (!this._sampler) {
      throw new Error(`[${this.label}] 采样器未初始化`);
    }
    return this._sampler;
  }

  // ==================== 构造函数 ====================

  /**
   * 创建阴影贴图
   * @param device RHI设备实例
   * @param options 阴影贴图配置
   */
  constructor(device: MSpec.IRHIDevice, options: ShadowMapOptions = {}) {
    this.device = device;
    this._resolution = options.resolution ?? 1024;
    this.depthFormat = options.depthFormat ?? MSpec.RHITextureFormat.DEPTH24_UNORM;
    this.label = options.label ?? 'ShadowMap';

    // 验证分辨率
    if (this._resolution < 256 || this._resolution > 4096) {
      console.warn(`[${this.label}] 分辨率 ${this._resolution} 超出推荐范围(256-4096)，可能影响性能或质量`);
    }

    // 创建资源
    this.createResources();
  }

  // ==================== 资源创建 ====================

  /**
   * 创建所有阴影贴图资源
   * @private
   */
  private createResources(): void {
    // 创建深度纹理
    this._depthTexture = this.device.createTexture({
      width: this._resolution,
      height: this._resolution,
      format: this.depthFormat,
      usage: MSpec.RHITextureUsage.RENDER_ATTACHMENT,
      dimension: MSpec.RHITextureType.TEXTURE_2D,
      mipLevelCount: 1,
      sampleCount: 1,
      label: `${this.label} Depth Texture`,
    });

    // 创建深度纹理视图
    this._depthView = this._depthTexture.createView();

    // 创建比较采样器（用于PCF阴影采样）
    this._sampler = this.device.createSampler({
      minFilter: MSpec.RHIFilterMode.LINEAR,
      magFilter: MSpec.RHIFilterMode.LINEAR,
      addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
      addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
      addressModeW: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
      label: `${this.label} Compare Sampler`,
    });
  }

  // ==================== 渲染通道 API ====================

  /**
   * 获取阴影Pass的渲染通道描述符
   * 用于 encoder.beginRenderPass(descriptor)
   *
   * @param clearDepth 深度清除值，默认1.0
   * @returns 渲染通道描述符（只有深度附件，无颜色附件）
   */
  getRenderPassDescriptor(clearDepth: number = 1.0) {
    if (!this._depthView) {
      throw new Error(`[${this.label}] 深度视图未初始化，无法创建渲染通道描述符`);
    }

    return {
      colorAttachments: [],
      depthStencilAttachment: {
        view: this._depthView,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        clearDepth: clearDepth,
        depthWriteEnabled: true,
      },
    };
  }

  // ==================== 生命周期管理 ====================

  /**
   * 调整阴影贴图分辨率
   * 销毁旧资源，创建新资源
   *
   * @param resolution 新分辨率
   */
  resize(resolution: number): void {
    if (resolution === this._resolution) {
      return;
    }

    // 销毁旧资源
    this.destroyResources();

    // 更新分辨率
    this._resolution = resolution;

    // 重新创建资源
    this.createResources();
  }

  /**
   * 销毁所有资源
   * 应在demo清理时调用（通常由DemoRunner.track()自动管理）
   */
  destroy(): void {
    this.destroyResources();
  }

  /**
   * 销毁所有内部资源
   * @private
   */
  private destroyResources(): void {
    if (this._depthView) {
      try {
        this._depthView.destroy();
      } catch (e) {
        console.warn(`[${this.label}] 销毁深度视图失败:`, e);
      }
      this._depthView = null;
    }

    if (this._depthTexture) {
      try {
        this._depthTexture.destroy();
      } catch (e) {
        console.warn(`[${this.label}] 销毁深度纹理失败:`, e);
      }
      this._depthTexture = null;
    }

    if (this._sampler) {
      try {
        this._sampler.destroy();
      } catch (e) {
        console.warn(`[${this.label}] 销毁采样器失败:`, e);
      }
      this._sampler = null;
    }
  }
}
