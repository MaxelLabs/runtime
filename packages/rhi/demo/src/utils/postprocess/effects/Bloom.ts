/**
 * postprocess/effects/Bloom.ts
 * Bloom 泛光效果 - 提取高亮区域并模糊叠加
 *
 * 实现原理:
 * 1. 亮度提取 Pass: 提取超过阈值的高亮区域
 * 2. 模糊 Pass: 对高亮区域进行高斯模糊
 * 3. 合成 Pass: 将模糊后的高亮与原图叠加
 *
 * 当前为简化的单 Pass 实现，在片段着色器中完成所有步骤
 */

import { MSpec } from '@maxellabs/core';
import { PostProcessEffect } from '../PostProcessEffect';
import type { BloomOptions } from '../types';

/**
 * Bloom 泛光效果
 *
 * @example
 * ```typescript
 * const bloom = new Bloom(device, {
 *   threshold: 0.8,
 *   intensity: 1.5,
 *   radius: 5,
 * });
 * ```
 */
export class Bloom extends PostProcessEffect {
  private uniformBuffer: MSpec.IRHIBuffer | null = null;
  private bindGroupLayout: MSpec.IRHIBindGroupLayout | null = null;

  private threshold: number;
  private intensity: number;
  private radius: number;

  constructor(device: MSpec.IRHIDevice, options: BloomOptions = {}) {
    super(device, { ...options, name: options.name || 'Bloom' });

    this.threshold = options.threshold ?? 0.8;
    this.intensity = options.intensity ?? 1.0;
    this.radius = options.radius ?? 5;

    this.createUniformBuffer();
    this.createBindGroupLayout();
  }

  private createUniformBuffer(): void {
    // 16 bytes: threshold, intensity, radius, padding
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
        name: 'BloomParams',
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
      this.threshold,
      this.intensity,
      this.radius,
      0.0, // padding
    ]);
    this.uniformBuffer!.update(data, 0);
  }

  public setParameters(params: Record<string, any>): void {
    if (params.threshold !== undefined) {
      this.threshold = Math.max(0.0, Math.min(2.0, params.threshold));
    }
    if (params.intensity !== undefined) {
      this.intensity = Math.max(0.0, Math.min(5.0, params.intensity));
    }
    if (params.radius !== undefined) {
      this.radius = Math.max(1, Math.min(20, params.radius));
    }
  }

  private getFragmentShader(): string {
    return `#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uTexture;

layout(std140) uniform BloomParams {
  float uThreshold;
  float uIntensity;
  float uRadius;
  float _padding;
};

// 计算亮度
float luminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

// 提取高亮区域（更激进的提取）
vec3 extractBright(vec3 color, float threshold) {
  float brightness = luminance(color);

  // 计算超过阈值的部分，使用 knee curve 软过渡
  float knee = threshold * 0.5;
  float soft = brightness - threshold + knee;
  soft = clamp(soft, 0.0, 2.0 * knee);
  soft = soft * soft / (4.0 * knee + 0.00001);

  // 选择较大的贡献
  float contribution = max(soft, brightness - threshold);
  contribution = max(contribution, 0.0);

  // 归一化并应用
  if (brightness > 0.0001) {
    return color * (contribution / brightness);
  }
  return vec3(0.0);
}

void main() {
  vec2 texelSize = 1.0 / vec2(textureSize(uTexture, 0));

  // 采样原始颜色
  vec3 originalColor = texture(uTexture, vUV).rgb;

  // 高斯模糊权重 (13-tap for wider blur)
  const int SAMPLES = 7;
  float weights[SAMPLES];
  weights[0] = 0.20;
  weights[1] = 0.18;
  weights[2] = 0.14;
  weights[3] = 0.10;
  weights[4] = 0.06;
  weights[5] = 0.03;
  weights[6] = 0.01;

  // 提取高亮并进行模糊
  vec3 bloomColor = vec3(0.0);
  float totalWeight = 0.0;

  // 中心采样
  vec3 centerBright = extractBright(originalColor, uThreshold);
  bloomColor += centerBright * weights[0];
  totalWeight += weights[0];

  // 多方向模糊采样（更大范围）
  for (int i = 1; i < SAMPLES; i++) {
    float weight = weights[i];
    vec2 offset = texelSize * float(i) * uRadius * 1.5;

    // 水平方向
    vec3 brightH1 = extractBright(texture(uTexture, vUV + vec2(offset.x, 0.0)).rgb, uThreshold);
    vec3 brightH2 = extractBright(texture(uTexture, vUV - vec2(offset.x, 0.0)).rgb, uThreshold);

    // 垂直方向
    vec3 brightV1 = extractBright(texture(uTexture, vUV + vec2(0.0, offset.y)).rgb, uThreshold);
    vec3 brightV2 = extractBright(texture(uTexture, vUV - vec2(0.0, offset.y)).rgb, uThreshold);

    // 对角线方向（增强发散效果）
    vec3 brightD1 = extractBright(texture(uTexture, vUV + offset).rgb, uThreshold);
    vec3 brightD2 = extractBright(texture(uTexture, vUV - offset).rgb, uThreshold);
    vec3 brightD3 = extractBright(texture(uTexture, vUV + vec2(offset.x, -offset.y)).rgb, uThreshold);
    vec3 brightD4 = extractBright(texture(uTexture, vUV + vec2(-offset.x, offset.y)).rgb, uThreshold);

    bloomColor += (brightH1 + brightH2 + brightV1 + brightV2) * weight;
    bloomColor += (brightD1 + brightD2 + brightD3 + brightD4) * weight * 0.7;

    totalWeight += weight * 4.0 + weight * 2.8;
  }

  bloomColor /= totalWeight;

  // 增强 bloom 颜色（使发光更明显）
  bloomColor = pow(bloomColor, vec3(0.9)) * 2.0;

  // 合成：原图 + Bloom（叠加模式）
  vec3 finalColor = originalColor + bloomColor * uIntensity;

  // 轻微的色调压缩，避免过曝
  finalColor = finalColor / (1.0 + luminance(finalColor) * 0.2);

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
