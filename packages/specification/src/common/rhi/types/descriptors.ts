/**
 * descriptors.ts
 * 包含所有RHI资源描述符的类型定义
 */
import type { RHIVertexLayout, RHIColorBlendState, RHIDepthStencilState, RHIRasterizationState } from './states';
import type {
  RHITextureType,
  RHIFilterMode,
  RHIAddressMode,
  RHICompareFunction,
  RHIPrimitiveTopology,
  RHIBufferUsage,
  RHITextureFormat,
  RHITextureUsage,
  RHIShaderStage,
  RHIQueryType,
} from './enums';
import type { ColorLike } from '../../../core';
import type { IRHIShaderModule } from '../resources';
import type { IRHIPipelineLayout } from '../pipeline';
import type { IRHIBindGroupLayout } from '../bindings';

/**
 * 缓冲区描述符
 */
export interface RHIBufferDescriptor {
  /**
   * 缓冲区字节大小
   */
  size: number;

  /**
   * 缓冲区用途
   */
  usage: RHIBufferUsage;

  /**
   * 初始数据，如果提供则在创建时填充
   */
  initialData?: BufferSource;

  /**
   * WebGL兼容性选项：使用方式提示
   * 在WebGPU中被忽略
   */
  hint?: 'static' | 'dynamic' | 'stream';

  /**
   * 可选标签，用于调试
   */
  label?: string;

  /**
   * 扩展信息，用于存储平台或实现特定的额外信息
   */
  extension?: Record<string, any>;
}

// RHITextureType 已移至 ./enums.ts 避免重复定义

/**
 * 纹理描述符
 */
export interface RHITextureDescriptor {
  /**
   * 纹理宽度
   */
  width: number;

  /**
   * 纹理高度
   */
  height: number;

  /**
   * 纹理深度或数组层数
   */
  depthOrArrayLayers?: number;

  /**
   * MIP等级数
   */
  mipLevelCount?: number;

  /**
   * 纹理格式
   */
  format: RHITextureFormat;

  /**
   * 纹理用途
   */
  usage: RHITextureUsage;

  /**
   * 采样数量(多重采样)
   */
  sampleCount?: number;

  /**
   * WebGL兼容性选项：纹理类型
   * 在WebGPU中根据其他属性推断
   */
  dimension?: RHITextureType;

  /**
   * 硬件API兼容性选项
   * 在WebGPU中被忽略
   * @deprecated
   * @remarks
   * 该属性在未来的版本中可能会被移除，请使用其他选项替代。
   */
  extension?: Record<string, any>;

  /**
   * 可选标签，用于调试
   */
  label?: string;
}

/**
 * 采样器描述符
 */
export interface RHISamplerDescriptor {
  /**
   * 缩小过滤器
   */
  minFilter?: RHIFilterMode;

  /**
   * 放大过滤器
   */
  magFilter?: RHIFilterMode;

  /**
   * Mipmap过滤器
   */
  mipmapFilter?: RHIFilterMode;

  /**
   * 寻址模式U
   */
  addressModeU?: RHIAddressMode;

  /**
   * 寻址模式V
   */
  addressModeV?: RHIAddressMode;

  /**
   * 寻址模式W
   */
  addressModeW?: RHIAddressMode;

  /**
   * 边框颜色
   */
  borderColor?: ColorLike;

  /**
   * 各向异性过滤级别
   */
  maxAnisotropy?: number;

  /**
   * 比较函数
   */
  compareFunction?: RHICompareFunction;

  /**
   * LOD最小值
   */
  lodMinClamp?: number;

  /**
   * LOD最大值
   */
  lodMaxClamp?: number;

  /**
   * 可选标签，用于调试
   */
  label?: string;
}

/**
 * 渲染管线描述符
 */
export interface RHIRenderPipelineDescriptor {
  /**
   * 顶点着色器
   */
  vertexShader: IRHIShaderModule;

  /**
   * 片段着色器
   */
  fragmentShader: IRHIShaderModule;

  /**
   * 顶点输入布局
   */
  vertexLayout: RHIVertexLayout;

  /**
   * 图元类型
   */
  primitiveTopology: RHIPrimitiveTopology;

  /**
   * 光栅化状态
   */
  rasterizationState?: RHIRasterizationState;

  /**
   * 深度模板状态
   */
  depthStencilState?: RHIDepthStencilState;

  /**
   * 颜色混合状态
   */
  colorBlendState?: RHIColorBlendState;

  /**
   * 管线布局
   */
  layout: IRHIPipelineLayout;

  /**
   * 可选标签，用于调试
   */
  label?: string;
}

/**
 * 计算管线描述符
 */
export interface RHIComputePipelineDescriptor {
  /**
   * 计算着色器
   */
  computeShader: IRHIShaderModule;

  /**
   * 入口点名称
   */
  entryPoint: string;

  /**
   * 绑定组布局
   */
  bindGroupLayouts: IRHIBindGroupLayout[];

  /**
   * 可选标签，用于调试
   */
  label?: string;
}

/**
 * 着色器模块描述符
 */
export interface RHIShaderModuleDescriptor {
  /**
   * 着色器代码
   */
  code: string;

  /**
   * 着色器语言
   */
  language: 'glsl' | 'wgsl' | 'spirv';

  /**
   * 着色器阶段
   */
  stage: RHIShaderStage;

  /**
   * 可选标签，用于调试
   */
  label?: string;
}

/**
 * 查询集描述符
 */
export interface RHIQuerySetDescriptor {
  /**
   * 查询类型
   */
  type: RHIQueryType;

  /**
   * 查询数量
   */
  count: number;

  /**
   * 可选标签，用于调试
   */
  label?: string;
}
