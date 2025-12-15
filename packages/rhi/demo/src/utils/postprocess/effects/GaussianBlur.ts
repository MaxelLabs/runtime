/**
 * postprocess/effects/GaussianBlur.ts
 * 高斯模糊效果 - 简化的单Pass实现
 */

import { MSpec } from '@maxellabs/core';
import { PostProcessEffect } from '../PostProcessEffect';
import type { GaussianBlurOptions } from '../types';

/**
 * 高斯模糊效果 (简化单Pass版本)
 *
 * 注意: 完整的高斯模糊需要两个Pass(水平+垂直)和临时纹理
 * 当前实现为简化的单Pass模糊,适合快速使用
 */
export class GaussianBlur extends PostProcessEffect {
  private uniformBuffer: MSpec.IRHIBuffer | null = null;
  private bindGroupLayout: MSpec.IRHIBindGroupLayout | null = null;

  private radius: number;
  private intensity: number;

  constructor(device: MSpec.IRHIDevice, options: GaussianBlurOptions = {}) {
    super(device, { ...options, name: options.name || 'GaussianBlur' });

    this.radius = options.radius ?? 5;
    this.intensity = options.intensity ?? 1.0;

    this.createUniformBuffer();
    this.createBindGroupLayout();
  }

  private createUniformBuffer(): void {
    this.uniformBuffer = this.device.createBuffer({
      size: 16, // vec2 texelSize + float radius + float intensity
      usage: MSpec.RHIBufferUsage.UNIFORM,
      hint: 'dynamic',
      label: `${this.name} Uniforms`,
    });
  }

  private createBindGroupLayout(): void {
    this.bindGroupLayout = this.device.createBindGroupLayout([
      // Binding 0: Input texture
      {
        binding: 0,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        texture: { sampleType: 'float' },
        name: 'uTexture',
      },
      // Binding 1: Sampler
      {
        binding: 1,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        sampler: { type: 'filtering' },
        name: 'uSampler',
      },
      // Binding 2: Uniforms
      {
        binding: 2,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
        name: 'Params',
      },
    ]);
  }

  protected createPipeline(): void {
    const vertexShader = this.device.createShaderModule({
      code: this.getFullscreenVertexShader(),
      language: 'glsl',
      stage: MSpec.RHIShaderStage.VERTEX,
    });

    const fragmentShader = this.device.createShaderModule({
      code: this.getFragmentShader(),
      language: 'glsl',
      stage: MSpec.RHIShaderStage.FRAGMENT,
    });

    const pipelineLayout = this.device.createPipelineLayout([this.bindGroupLayout!]);

    const vertexLayout: MSpec.RHIVertexLayout = {
      buffers: [],
    };

    this.pipeline = this.device.createRenderPipeline({
      vertexShader,
      fragmentShader,
      vertexLayout,
      primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
      layout: pipelineLayout,
      label: `${this.name} Pipeline`,
    });
  }

  protected createBindGroup(inputTexture: MSpec.IRHITextureView): void {
    this.bindGroup = this.device.createBindGroup(this.bindGroupLayout!, [
      { binding: 0, resource: inputTexture },
      { binding: 1, resource: this.sampler! },
      { binding: 2, resource: { buffer: this.uniformBuffer! } },
    ]);
  }

  protected updateUniforms(): void {
    // 注意: texelSize需要在实际应用中根据纹理大小动态计算
    // 这里使用固定值,实际应该从纹理获取尺寸
    const texelSizeX = 1.0 / 1920; // 假设1080p
    const texelSizeY = 1.0 / 1080;

    const data = new Float32Array([texelSizeX, texelSizeY, this.radius, this.intensity]);
    this.uniformBuffer!.update(data, 0);
  }

  public setParameters(params: Record<string, any>): void {
    if (params.radius !== undefined) {
      this.radius = Math.max(1, Math.min(20, params.radius));
    }
    if (params.intensity !== undefined) {
      this.intensity = Math.max(0.0, Math.min(2.0, params.intensity));
    }
  }

  private getFragmentShader(): string {
    return `#version 300 es
precision mediump float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uTexture;

layout(std140, binding = 2) uniform Params {
  vec2 uTexelSize;
  float uRadius;
  float uIntensity;
};

void main() {
  vec4 color = vec4(0.0);
  float totalWeight = 0.0;

  // 5-tap 高斯模糊权重
  float weights[5];
  weights[0] = 0.227027;
  weights[1] = 0.1945946;
  weights[2] = 0.1216216;
  weights[3] = 0.054054;
  weights[4] = 0.016216;

  // 中心采样
  color += texture(uTexture, vUV) * weights[0];
  totalWeight += weights[0];

  // 对角线采样 (简化的单Pass模糊)
  for (int i = 1; i < 5; i++) {
    float weight = weights[i];
    vec2 offset = uTexelSize * float(i);

    // 4个方向采样
    color += texture(uTexture, vUV + vec2(offset.x, 0.0)) * weight;
    color += texture(uTexture, vUV - vec2(offset.x, 0.0)) * weight;
    color += texture(uTexture, vUV + vec2(0.0, offset.y)) * weight;
    color += texture(uTexture, vUV - vec2(0.0, offset.y)) * weight;

    totalWeight += weight * 4.0;
  }

  fragColor = (color / totalWeight) * uIntensity;
}`;
  }

  public override destroy(): void {
    super.destroy();
    this.uniformBuffer?.destroy();
    this.bindGroupLayout?.destroy();
    this.uniformBuffer = null;
    this.bindGroupLayout = null;
  }
}
