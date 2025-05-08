/**
 * rhiPipelineStates.ts
 * 包含与RHI渲染管线状态相关的描述符。
 */

import type {
  TextureFormat,
  BlendOperation,
  BlendFactor,
  CompareFunction,
  StencilOperation,
  FrontFace,
  CullMode,
  VertexFormat,
  IndexFormat,
  PrimitiveType,
  ShaderStage,
  BindGroupLayoutEntryType,
} from './rhiEnums';
import type { IShader, IPipelineLayout } from './rhiResources';

//---------------------------------------------------------------------------------------------------------------------
// 管线状态描述符 (Pipeline State Descriptors)
//---------------------------------------------------------------------------------------------------------------------

export interface BlendComponentState {
  operation?: BlendOperation, // Default 'add'
  srcFactor?: BlendFactor,  // Default 'one'
  dstFactor?: BlendFactor,  // Default 'zero'
}

export interface BlendStateInfo { // WebGPU GPUBlendState
  color: BlendComponentState,
  alpha: BlendComponentState,
}

export interface StencilFaceState { // WebGPU GPUStencilFaceState
  compare?: CompareFunction,      // Default 'always'
  failOp?: StencilOperation,      // Default 'keep'
  depthFailOp?: StencilOperation, // Default 'keep'
  passOp?: StencilOperation,      // Default 'keep'
}

export interface DepthStencilStateInfo { // WebGPU GPUDepthStencilState
  format: TextureFormat, // Must match the depth/stencil attachment's format
  depthWriteEnabled?: boolean,
  depthCompare?: CompareFunction,
  stencilFront?: StencilFaceState,
  stencilBack?: StencilFaceState,
  stencilReadMask?: number, // Default 0xFFFFFFFF
  stencilWriteMask?: number, // Default 0xFFFFFFFF
  depthBias?: number, // Default 0
  depthBiasSlopeScale?: number, // Default 0
  depthBiasClamp?: number, // Default 0
}

export interface RasterizerStateInfo { // Corresponds to parts of WebGPU GPUPrimitiveState
  frontFace?: FrontFace,   // Default 'ccw'
  cullMode?: CullMode,     // Default 'none'
  // depthBias, depthBiasSlopeScale, depthBiasClamp are in DepthStencilState in WebGPU
  // unclippedDepth?: boolean; // WebGPU
}

export interface VertexAttribute {
  format: VertexFormat,
  offset: number, // Relative to containing VertexBufferLayout's arrayStride
  shaderLocation: number, // Matches `layout(location = X)` in shader
}

export interface VertexBufferLayout { // WebGPU GPUVertexBufferLayout
  arrayStride: number, // Bytes
  stepMode?: 'vertex' | 'instance', // Default 'vertex'
  attributes: VertexAttribute[],
}

export interface BindGroupLayoutEntry {
  binding: number,
  visibility: ShaderStage, // Bitwise OR of ShaderStage flags
  type: BindGroupLayoutEntryType,
  // Specific members per type, e.g.:
  // resource?: ITextureView | ISampler | IBufferBinding;
  // hasDynamicOffset?: boolean; (for uniform/storage buffers)
  // viewDimension?: TextureViewDimension; (for texture)
  // sampleType?: TextureSampleType; (for texture)
  // storageTextureAccess?: 'write-only' | 'read-only' | 'read-write'; (for storage texture)
  label?: string,
}

export interface PipelineStateInfo { // WebGPU GPURenderPipelineDescriptor
  layout: IPipelineLayout | 'auto', // 'auto' to infer from shader
  vertexStage: { module: IShader, entryPoint: string, constants?: Record<string, number> },
  fragmentStage?: { module: IShader, entryPoint: string, constants?: Record<string, number>, targets: BlendStateInfo[] }, // targets: one BlendState per color attachment
  computeStage?: { module: IShader, entryPoint: string, constants?: Record<string, number> },
  primitiveState?: { // WebGPU GPUPrimitiveState
    topology?: PrimitiveType, // Default 'triangle-list'
    stripIndexFormat?: IndexFormat, // For triangle/line strips
    frontFace?: FrontFace, // Default 'ccw'
    cullMode?: CullMode, // Default 'none'
    // unclippedDepth?: boolean; // requires 'depth-clip-control' feature
  },
  vertexBuffers?: VertexBufferLayout[], // Describes vertex input (GPUVertexState in WebGPU spec)
  depthStencilState?: DepthStencilStateInfo,
  multisampleState?: { // WebGPU GPUMultisampleState
    count?: number, // Default 1
    mask?: number,  // Default 0xFFFFFFFF
    alphaToCoverageEnabled?: boolean, // Default false
  },
  label?: string,
}