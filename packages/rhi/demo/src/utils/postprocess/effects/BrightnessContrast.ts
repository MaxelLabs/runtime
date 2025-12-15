/**
 * postprocess/effects/BrightnessContrast.ts
 * 亮度/对比度调整效果
 */

import { MSpec } from '@maxellabs/core';
import { PostProcessEffect } from '../PostProcessEffect';
import type { BrightnessContrastOptions } from '../types';

/**
 * 亮度/对比度调整效果
 */
export class BrightnessContrast extends PostProcessEffect {
  private uniformBuffer: MSpec.IRHIBuffer | null = null;
  private bindGroupLayout: MSpec.IRHIBindGroupLayout | null = null;

  private brightness: number;
  private contrast: number;

  constructor(device: MSpec.IRHIDevice, options: BrightnessContrastOptions = {}) {
    super(device, { ...options, name: options.name || 'BrightnessContrast' });

    this.brightness = options.brightness ?? 0.0;
    this.contrast = options.contrast ?? 1.0;

    this.createUniformBuffer();
    this.createBindGroupLayout();
  }

  private createUniformBuffer(): void {
    this.uniformBuffer = this.device.createBuffer({
      size: 16, // 2 floats + padding
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
      buffers: [], // 全屏三角形不需要顶点缓冲
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
    const data = new Float32Array([this.brightness, this.contrast, 0, 0]);
    this.uniformBuffer!.update(data, 0);
  }

  public setParameters(params: Record<string, any>): void {
    if (params.brightness !== undefined) {
      this.brightness = Math.max(-1.0, Math.min(1.0, params.brightness));
    }
    if (params.contrast !== undefined) {
      this.contrast = Math.max(0.0, Math.min(2.0, params.contrast));
    }
  }

  private getFragmentShader(): string {
    return `#version 300 es
precision mediump float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uTexture;

layout(std140, binding = 2) uniform Params {
  float uBrightness;  // [-1.0, 1.0]
  float uContrast;    // [0.0, 2.0]
};

void main() {
  vec4 color = texture(uTexture, vUV);

  // 应用亮度调整
  color.rgb += uBrightness;

  // 应用对比度调整
  color.rgb = (color.rgb - 0.5) * uContrast + 0.5;

  // 钳制到[0, 1]
  color.rgb = clamp(color.rgb, 0.0, 1.0);

  fragColor = color;
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
