/**
 * postprocess/PostProcessManager.ts
 * 后处理管道管理器 - 管理后处理效果链和Ping-Pong缓冲区
 */

import { MSpec } from '@maxellabs/core';
import { RenderTarget } from '../rendering/RenderTarget';
import type { IPostProcessEffect, PostProcessManagerOptions, PostProcessStats } from './types';

/**
 * 后处理管道管理器
 *
 * 核心功能:
 * - 管理多个后处理效果的链式执行
 * - Ping-Pong 缓冲区管理(避免读写冲突)
 * - 自动资源追踪和清理
 *
 * @example
 * ```typescript
 * const postProcess = runner.track(new PostProcessManager(runner.device, {
 *   width: runner.width,
 *   height: runner.height,
 * }));
 *
 * postProcess.addEffect(new Bloom({ intensity: 1.5 }));
 * postProcess.addEffect(new FXAA());
 *
 * // 应用后处理链
 * const finalTexture = postProcess.process(encoder, sceneTexture);
 * ```
 */
export class PostProcessManager {
  private device: MSpec.IRHIDevice;
  private options: Required<PostProcessManagerOptions>;

  // Ping-Pong 缓冲区
  private renderTargets: RenderTarget[] = [];
  private currentTargetIndex = 0;

  // 效果链
  private effects: IPostProcessEffect[] = [];

  constructor(device: MSpec.IRHIDevice, options: PostProcessManagerOptions) {
    this.device = device;

    // 设置默认值
    this.options = {
      width: options.width,
      height: options.height,
      colorFormat: options.colorFormat ?? MSpec.RHITextureFormat.RGBA8_UNORM,
      useHDR: options.useHDR ?? false,
      label: options.label || 'PostProcessManager',
    };

    // 创建 Ping-Pong 缓冲区
    this.createRenderTargets();
  }

  /**
   * 创建 Ping-Pong 渲染目标
   */
  private createRenderTargets(): void {
    const format = this.options.useHDR ? MSpec.RHITextureFormat.RGBA16_FLOAT : this.options.colorFormat;

    // 创建2个渲染目标用于Ping-Pong
    for (let i = 0; i < 2; i++) {
      const renderTarget = new RenderTarget(this.device, {
        width: this.options.width,
        height: this.options.height,
        colorFormat: format,
        depthFormat: null, // 后处理不需要深度缓冲
        label: `${this.options.label} RT${i}`,
      });

      this.renderTargets.push(renderTarget);
    }
  }

  /**
   * 添加后处理效果到链末尾
   */
  public addEffect(effect: IPostProcessEffect): void {
    this.effects.push(effect);
  }

  /**
   * 移除指定效果
   */
  public removeEffect(effect: IPostProcessEffect): void {
    const index = this.effects.indexOf(effect);
    if (index !== -1) {
      this.effects.splice(index, 1);
    }
  }

  /**
   * 清空所有效果
   */
  public clearEffects(): void {
    this.effects.length = 0;
  }

  /**
   * 处理后处理链
   *
   * @param encoder 命令编码器
   * @param inputTexture 输入纹理(场景渲染结果)
   * @returns 最终输出纹理视图
   */
  public process(encoder: MSpec.IRHICommandEncoder, inputTexture: MSpec.IRHITextureView): MSpec.IRHITextureView {
    const enabledEffects = this.effects.filter((e) => e.enabled);

    // 没有启用的效果,直接返回输入纹理
    if (enabledEffects.length === 0) {
      return inputTexture;
    }

    let currentInput = inputTexture;
    this.currentTargetIndex = 0;

    // 链式应用每个效果
    for (let i = 0; i < enabledEffects.length; i++) {
      const effect = enabledEffects[i];
      const isLastEffect = i === enabledEffects.length - 1;

      // 获取输出目标
      const outputTarget = this.renderTargets[this.currentTargetIndex];
      const outputTexture = outputTarget.getColorView(0);

      // 应用效果
      effect.apply(encoder, currentInput, outputTexture);

      // 为下一个效果准备输入
      if (!isLastEffect) {
        currentInput = outputTexture;
        this.currentTargetIndex = 1 - this.currentTargetIndex; // Ping-Pong切换
      }
    }

    // 返回最后一个效果的输出
    return this.renderTargets[this.currentTargetIndex].getColorView(0);
  }

  /**
   * 调整渲染目标大小
   */
  public resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;

    // 销毁旧的渲染目标
    this.renderTargets.forEach((rt) => rt.destroy());
    this.renderTargets = [];

    // 重新创建
    this.createRenderTargets();
  }

  /**
   * 获取统计信息
   */
  public getStats(): PostProcessStats {
    const enabledCount = this.effects.filter((e) => e.enabled).length;

    // 计算内存使用(简化估算)
    const bytesPerPixel = this.options.useHDR ? 8 : 4; // RGBA16F vs RGBA8
    const pixelCount = this.options.width * this.options.height;
    const memoryPerTarget = pixelCount * bytesPerPixel;
    const totalMemory = memoryPerTarget * this.renderTargets.length;

    return {
      effectCount: this.effects.length,
      enabledEffectCount: enabledCount,
      bufferCount: this.renderTargets.length,
      totalMemoryUsage: totalMemory,
    };
  }

  /**
   * 获取所有效果
   */
  public getEffects(): ReadonlyArray<IPostProcessEffect> {
    return this.effects;
  }

  /**
   * 根据名称查找效果
   */
  public getEffectByName(name: string): IPostProcessEffect | undefined {
    return this.effects.find((e) => e.name === name);
  }

  /**
   * 销毁所有资源
   */
  public destroy(): void {
    // 销毁渲染目标
    this.renderTargets.forEach((rt) => rt.destroy());
    this.renderTargets = [];

    // 销毁效果(注意:效果可能在外部创建,根据需求决定是否销毁)
    // this.effects.forEach((e) => e.destroy());
    this.effects = [];
  }
}
