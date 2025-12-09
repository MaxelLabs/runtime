import type { MSpec } from '@maxellabs/core';

/**
 * WebGL计算管线实现
 * 注意：WebGL不直接支持计算管线，这里仅作为接口实现
 */
export class WebGLComputePipeline implements MSpec.IRHIComputePipeline {
  computeShader: MSpec.IRHIShaderModule;
  entryPoint: string;
  layout: MSpec.IRHIPipelineLayout;
  label?: string;
  constructor(
    private gl: WebGLRenderingContext,
    private descriptor: MSpec.RHIComputePipelineDescriptor
  ) {}

  destroy(): void {
    // 销毁计算管线
    this.computeShader.destroy();
    this.layout.destroy();

    this.computeShader = null as unknown as MSpec.IRHIShaderModule;
    this.layout = null as unknown as MSpec.IRHIPipelineLayout;
    this.label = '';
    this.entryPoint = '';
  }
}
