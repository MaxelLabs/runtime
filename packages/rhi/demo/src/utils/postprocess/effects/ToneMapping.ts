/**
 * postprocess/effects/ToneMapping.ts
 * 色调映射效果 - HDR到LDR转换
 */

import { MSpec } from '@maxellabs/core';
import { PostProcessEffect } from '../PostProcessEffect';
import type { ToneMappingOptions } from '../types';

/**
 * 色调映射效果
 *
 * 支持多种色调映射算法:
 * - Reinhard: 简单有效的色调映射
 * - ACES: 电影级色调映射(Academy Color Encoding System)
 * - Uncharted2: 游戏常用的色调映射
 * - Filmic: 模拟胶片效果
 *
 * @example
 * ```typescript
 * const toneMapping = new ToneMapping(device, {
 *   mode: 'aces',
 *   exposure: 1.0,
 *   gamma: 2.2,
 * });
 * ```
 */
export class ToneMapping extends PostProcessEffect {
  private uniformBuffer: MSpec.IRHIBuffer | null = null;
  private bindGroupLayout: MSpec.IRHIBindGroupLayout | null = null;

  private mode: 'reinhard' | 'aces' | 'uncharted2' | 'filmic';
  private exposure: number;
  private gamma: number;

  constructor(device: MSpec.IRHIDevice, options: ToneMappingOptions = {}) {
    super(device, { ...options, name: options.name || 'ToneMapping' });

    this.mode = options.mode ?? 'reinhard';
    this.exposure = options.exposure ?? 1.0;
    this.gamma = options.gamma ?? 2.2;

    this.createUniformBuffer();
    this.createBindGroupLayout();
  }

  private createUniformBuffer(): void {
    // 创建Uniform缓冲区 (16 bytes: mode(int) + exposure + gamma + padding)
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
    const modeValue = this.getModeValue();
    const data = new Float32Array([modeValue, this.exposure, this.gamma, 0.0]);
    this.uniformBuffer!.update(data, 0);
  }

  private getModeValue(): number {
    const modes = { reinhard: 0, aces: 1, uncharted2: 2, filmic: 3 };
    return modes[this.mode];
  }

  public setParameters(params: Record<string, any>): void {
    if (params.mode !== undefined) {
      this.mode = params.mode;
    }
    if (params.exposure !== undefined) {
      this.exposure = Math.max(0.0, params.exposure);
    }
    if (params.gamma !== undefined) {
      this.gamma = Math.max(0.1, Math.min(5.0, params.gamma));
    }
  }

  private getFragmentShader(): string {
    return `#version 300 es
precision mediump float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uTexture;

layout(std140) uniform Params {
  float uMode;      // 0: Reinhard, 1: ACES, 2: Uncharted2, 3: Filmic
  float uExposure;
  float uGamma;
  float _padding;
};

// Reinhard色调映射
vec3 reinhardToneMapping(vec3 color) {
  return color / (color + vec3(1.0));
}

// ACES色调映射 (简化版)
vec3 acesToneMapping(vec3 color) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;

  color = (color * (a * color + b)) / (color * (c * color + d) + e);
  return clamp(color, 0.0, 1.0);
}

// Uncharted2色调映射
vec3 uncharted2ToneMapping(vec3 x) {
  const float A = 0.15;
  const float B = 0.50;
  const float C = 0.10;
  const float D = 0.20;
  const float E = 0.02;
  const float F = 0.30;

  return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

// Filmic色调映射
vec3 filmicToneMapping(vec3 color) {
  color = max(vec3(0.0), color - vec3(0.004));
  color = (color * (6.2 * color + 0.5)) / (color * (6.2 * color + 1.7) + 0.06);
  return color;
}

// 伽马校正
vec3 gammaCorrection(vec3 color, float gamma) {
  return pow(color, vec3(1.0 / gamma));
}

void main() {
  vec3 color = texture(uTexture, vUV).rgb;

  // 应用曝光度
  color *= uExposure;

  // 应用色调映射
  int mode = int(uMode);
  if (mode == 0) {
    color = reinhardToneMapping(color);
  } else if (mode == 1) {
    color = acesToneMapping(color);
  } else if (mode == 2) {
    vec3 curr = uncharted2ToneMapping(color * 2.0);
    vec3 whiteScale = 1.0 / uncharted2ToneMapping(vec3(11.2));
    color = curr * whiteScale;
  } else if (mode == 3) {
    color = filmicToneMapping(color);
  }

  // 伽马校正
  color = gammaCorrection(color, uGamma);

  fragColor = vec4(color, 1.0);
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
