/**
 * pipeline.ts
 * 定义渲染和计算管线接口
 */

import type { IRHIShaderModule } from './resources';
import type { IRHIBindGroupLayout } from './bindings';
import type {
  RHIPrimitiveTopology,
  RHIColorBlendState,
  RHIDepthStencilState,
  RHIRasterizationState,
  RHIVertexLayout,
} from './types';

/**
 * 管线布局接口
 */
export interface IRHIPipelineLayout {
  /**
   * 绑定组布局
   */
  readonly bindGroupLayouts: IRHIBindGroupLayout[];

  /**
   * 管线布局标签
   */
  readonly label?: string;

  /**
   * 销毁资源
   */
  destroy(): void;
}

/**
 * 渲染管线接口
 */
export interface IRHIRenderPipeline {
  /**
   * 顶点着色器
   */
  readonly vertexShader: IRHIShaderModule;

  /**
   * 片段着色器
   */
  readonly fragmentShader: IRHIShaderModule;

  /**
   * 顶点布局
   */
  readonly vertexLayout: RHIVertexLayout;

  /**
   * 图元类型
   */
  readonly primitiveTopology: RHIPrimitiveTopology;

  /**
   * 光栅化状态
   */
  readonly rasterizationState: RHIRasterizationState;

  /**
   * 深度模板状态
   */
  readonly depthStencilState?: RHIDepthStencilState;

  /**
   * 颜色混合状态
   */
  readonly colorBlendState?: RHIColorBlendState;

  /**
   * 管线布局
   */
  readonly layout: IRHIPipelineLayout;

  /**
   * 管线标签
   */
  readonly label?: string;

  /**
   * 销毁资源
   */
  destroy(): void;
}

/**
 * 计算管线接口
 */
export interface IRHIComputePipeline {
  /**
   * 计算着色器
   */
  readonly computeShader: IRHIShaderModule;

  /**
   * 入口点
   */
  readonly entryPoint: string;

  /**
   * 管线布局
   */
  readonly layout: IRHIPipelineLayout;

  /**
   * 管线标签
   */
  readonly label?: string;

  /**
   * 销毁资源
   */
  destroy(): void;
}
