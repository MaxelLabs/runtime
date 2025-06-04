import type {
  IRHIComputePipeline,
  IRHIPipelineLayout,
  IRHIShaderModule,
  RHIComputePipelineDescriptor,
} from '@maxellabs/core';

export class WebGLComputePipeline implements IRHIComputePipeline {
  computeShader: IRHIShaderModule;
  entryPoint: string;
  layout: IRHIPipelineLayout;
  label?: string;
  constructor(
    private gl: WebGLRenderingContext,
    private descriptor: RHIComputePipelineDescriptor
  ) {}

  destroy(): void {
    // 销毁计算管线
    this.computeShader.destroy();
    this.layout.destroy();

    this.computeShader = null as unknown as IRHIShaderModule;
    this.layout = null as unknown as IRHIPipelineLayout;
    this.label = '';
    this.entryPoint = '';
  }
}
