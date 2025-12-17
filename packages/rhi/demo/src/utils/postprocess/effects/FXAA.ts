/**
 * postprocess/effects/FXAA.ts
 * FXAA(Fast Approximate Anti-Aliasing) 快速抗锯齿效果
 */

import { MSpec } from '@maxellabs/core';
import { PostProcessEffect } from '../PostProcessEffect';
import type { FXAAOptions } from '../types';

/**
 * FXAA 抗锯齿效果
 *
 * 实现: 基于FXAA 3.11算法的简化版本
 * 特点: 后处理抗锯齿,性能开销小,效果较好
 *
 * @example
 * ```typescript
 * const fxaa = new FXAA(device, {
 *   subpixelQuality: 0.75,
 *   edgeThreshold: 0.166,
 * });
 * ```
 */
export class FXAA extends PostProcessEffect {
  private uniformBuffer: MSpec.IRHIBuffer | null = null;
  private bindGroupLayout: MSpec.IRHIBindGroupLayout | null = null;

  private subpixelQuality: number;
  private edgeThreshold: number;
  private edgeThresholdMin: number;

  constructor(device: MSpec.IRHIDevice, options: FXAAOptions = {}) {
    super(device, { ...options, name: options.name || 'FXAA' });

    this.subpixelQuality = options.subpixelQuality ?? 0.75;
    this.edgeThreshold = options.edgeThreshold ?? 0.166;
    this.edgeThresholdMin = options.edgeThresholdMin ?? 0.0833;

    this.createUniformBuffer();
    this.createBindGroupLayout();
  }

  private createUniformBuffer(): void {
    // 创建Uniform缓冲区 (16 bytes: vec2 resolution + 2个threshold参数)
    this.uniformBuffer = this.device.createBuffer({
      size: 16,
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
        texture: { sampleType: 'float', viewDimension: '2d' },
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
    const data = new Float32Array([
      this.subpixelQuality,
      this.edgeThreshold,
      this.edgeThresholdMin,
      0.0, // padding
    ]);
    this.uniformBuffer!.update(data, 0);
  }

  public setParameters(params: Record<string, any>): void {
    if (params.subpixelQuality !== undefined) {
      this.subpixelQuality = Math.max(0.0, Math.min(1.0, params.subpixelQuality));
    }
    if (params.edgeThreshold !== undefined) {
      this.edgeThreshold = Math.max(0.0, Math.min(1.0, params.edgeThreshold));
    }
    if (params.edgeThresholdMin !== undefined) {
      this.edgeThresholdMin = Math.max(0.0, Math.min(1.0, params.edgeThresholdMin));
    }
  }

  private getFragmentShader(): string {
    return `#version 300 es
precision mediump float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uTexture;

layout(std140) uniform Params {
  float uSubpixelQuality;
  float uEdgeThreshold;
  float uEdgeThresholdMin;
  float _padding;
};

// 计算亮度
float rgb2luma(vec3 rgb) {
  return dot(rgb, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec2 texelSize = 1.0 / vec2(textureSize(uTexture, 0));

  // 采样中心和周围4个点
  vec3 rgbM = texture(uTexture, vUV).rgb;
  vec3 rgbN = texture(uTexture, vUV + vec2(0.0, -texelSize.y)).rgb;
  vec3 rgbS = texture(uTexture, vUV + vec2(0.0, texelSize.y)).rgb;
  vec3 rgbE = texture(uTexture, vUV + vec2(texelSize.x, 0.0)).rgb;
  vec3 rgbW = texture(uTexture, vUV + vec2(-texelSize.x, 0.0)).rgb;

  // 计算亮度
  float lumaM = rgb2luma(rgbM);
  float lumaN = rgb2luma(rgbN);
  float lumaS = rgb2luma(rgbS);
  float lumaE = rgb2luma(rgbE);
  float lumaW = rgb2luma(rgbW);

  // 找到最大最小亮度
  float lumaMin = min(lumaM, min(min(lumaN, lumaS), min(lumaE, lumaW)));
  float lumaMax = max(lumaM, max(max(lumaN, lumaS), max(lumaE, lumaW)));
  float lumaRange = lumaMax - lumaMin;

  // 如果对比度太低,跳过FXAA
  if (lumaRange < max(uEdgeThresholdMin, lumaMax * uEdgeThreshold)) {
    fragColor = vec4(rgbM, 1.0);
    return;
  }

  // 采样对角线4个点
  vec3 rgbNW = texture(uTexture, vUV + vec2(-texelSize.x, -texelSize.y)).rgb;
  vec3 rgbNE = texture(uTexture, vUV + vec2(texelSize.x, -texelSize.y)).rgb;
  vec3 rgbSW = texture(uTexture, vUV + vec2(-texelSize.x, texelSize.y)).rgb;
  vec3 rgbSE = texture(uTexture, vUV + vec2(texelSize.x, texelSize.y)).rgb;

  float lumaNW = rgb2luma(rgbNW);
  float lumaNE = rgb2luma(rgbNE);
  float lumaSW = rgb2luma(rgbSW);
  float lumaSE = rgb2luma(rgbSE);

  // 计算边缘方向
  float edgeHorizontal = abs(-2.0 * lumaN + lumaNW + lumaNE) +
                         abs(-2.0 * lumaM + lumaW + lumaE) * 2.0 +
                         abs(-2.0 * lumaS + lumaSW + lumaSE);

  float edgeVertical = abs(-2.0 * lumaW + lumaNW + lumaSW) +
                       abs(-2.0 * lumaM + lumaN + lumaS) * 2.0 +
                       abs(-2.0 * lumaE + lumaNE + lumaSE);

  bool isHorizontal = edgeHorizontal >= edgeVertical;

  // 简化的FXAA混合
  vec2 offset = isHorizontal ? vec2(texelSize.x, 0.0) : vec2(0.0, texelSize.y);

  vec3 rgbA = 0.5 * (texture(uTexture, vUV - offset).rgb +
                     texture(uTexture, vUV + offset).rgb);
  vec3 rgbB = rgbA * 0.5 + 0.25 * (texture(uTexture, vUV - 2.0 * offset).rgb +
                                    texture(uTexture, vUV + 2.0 * offset).rgb);

  float lumaB = rgb2luma(rgbB);

  vec3 finalColor = ((lumaB < lumaMin) || (lumaB > lumaMax)) ? rgbA : rgbB;

  fragColor = vec4(finalColor, 1.0);
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
