/**
 * postprocess/PostProcessEffect.ts
 * 后处理效果基类 - 所有具体效果的抽象基类
 */

import { MSpec } from '@maxellabs/core';
import type { IPostProcessEffect, PostProcessEffectOptions } from './types';

/**
 * 后处理效果抽象基类
 *
 * 提供通用的渲染管线、着色器管理和资源追踪功能
 */
export abstract class PostProcessEffect implements IPostProcessEffect {
  protected device: MSpec.IRHIDevice;
  protected pipeline: MSpec.IRHIRenderPipeline | null = null;
  protected bindGroup: MSpec.IRHIBindGroup | null = null;
  protected sampler: MSpec.IRHISampler | null = null;

  public readonly name: string;
  public enabled: boolean;

  constructor(device: MSpec.IRHIDevice, options: PostProcessEffectOptions = {}) {
    this.device = device;
    this.name = options.name || this.constructor.name;
    this.enabled = options.enabled ?? true;

    // 创建通用采样器
    this.createSampler();
  }

  /**
   * 创建纹理采样器（线性过滤）
   */
  private createSampler(): void {
    this.sampler = this.device.createSampler({
      minFilter: MSpec.RHIFilterMode.LINEAR,
      magFilter: MSpec.RHIFilterMode.LINEAR,
      addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
      addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
      label: `${this.name} Sampler`,
    });
  }

  /**
   * 应用后处理效果
   */
  public apply(
    encoder: MSpec.IRHICommandEncoder,
    inputTexture: MSpec.IRHITextureView,
    outputTexture: MSpec.IRHITextureView
  ): void {
    if (!this.enabled) {
      return;
    }

    // 确保管线已创建
    if (!this.pipeline) {
      this.createPipeline();
    }

    // 更新绑定组
    this.updateBindGroup(inputTexture);

    // 更新Uniform参数
    this.updateUniforms();

    // 开始渲染Pass
    const passDesc = {
      colorAttachments: [
        {
          view: outputTexture,
          loadOp: 'clear' as const,
          storeOp: 'store' as const,
          clearColor: [0, 0, 0, 1] as [number, number, number, number],
        },
      ],
      label: `${this.name} Pass`,
    };

    const renderPass = encoder.beginRenderPass(passDesc);
    renderPass.setPipeline(this.pipeline!);
    renderPass.setBindGroup(0, this.bindGroup!);

    // 绘制全屏四边形
    renderPass.draw(3, 1, 0, 0); // 使用3个顶点绘制全屏三角形

    renderPass.end();
  }

  /**
   * 设置效果参数（子类实现）
   */
  public abstract setParameters(params: Record<string, any>): void;

  /**
   * 创建渲染管线（子类实现）
   */
  protected abstract createPipeline(): void;

  /**
   * 更新 Uniform 缓冲区（子类实现）
   */
  protected abstract updateUniforms(): void;

  /**
   * 更新绑定组
   */
  protected updateBindGroup(inputTexture: MSpec.IRHITextureView): void {
    // 默认实现：重新创建绑定组
    // 子类可以优化为仅在纹理变化时更新
    this.createBindGroup(inputTexture);
  }

  /**
   * 创建绑定组（子类可重写）
   */
  protected abstract createBindGroup(inputTexture: MSpec.IRHITextureView): void;

  /**
   * 获取全屏四边形顶点着色器（通用）
   */
  protected getFullscreenVertexShader(): string {
    return `#version 300 es
precision highp float;

// 使用全屏三角形技巧（只需3个顶点）
// Vertex ID: 0, 1, 2
// Position:  (-1,-1), (3,-1), (-1,3)
// UV:        (0,0), (2,0), (0,2)

out vec2 vUV;

void main() {
  // 根据顶点ID生成位置
  float x = float((gl_VertexID & 1) << 2) - 1.0;
  float y = float((gl_VertexID & 2) << 1) - 1.0;

  vUV = vec2((x + 1.0) * 0.5, (y + 1.0) * 0.5);
  gl_Position = vec4(x, y, 0.0, 1.0);
}`;
  }

  /**
   * 销毁资源
   */
  public destroy(): void {
    this.pipeline?.destroy();
    this.bindGroup?.destroy();
    this.sampler?.destroy();

    this.pipeline = null;
    this.bindGroup = null;
    this.sampler = null;
  }
}
