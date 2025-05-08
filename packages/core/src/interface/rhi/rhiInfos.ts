/**
 * rhiInfos.ts
 * 包含用于创建或描述RHI资源及操作的 "Info" 对象/描述符。
 */

import type { Color } from '@maxellabs/math';
import type {
  BufferUsage,
  TextureViewDimension,
  TextureType,
  TextureFormat,
  TextureUsageFlags,
  AddressMode,
  FilterMode,
  CompareFunction,
} from './rhiEnums';
import type { ITextureView } from './rhiResources';

//---------------------------------------------------------------------------------------------------------------------
// 资源描述符 (Info Objects)
//---------------------------------------------------------------------------------------------------------------------

export interface BufferInfo {
  usage: BufferUsage, // Bitwise OR of BufferUsage flags
  size: number, // in bytes
  mappedAtCreation?: boolean, // If true, the buffer is mapped at creation (WebGPU)
  label?: string,
}

export interface TextureViewDescriptor {
  label?: string,
  format?: TextureFormat,
  dimension?: TextureViewDimension,
  aspect?: 'all' | 'stencil-only' | 'depth-only', // Default 'all'
  baseMipLevel?: number, // Default 0
  mipLevelCount?: number, // Default to remaining levels
  baseArrayLayer?: number, // Default 0
  arrayLayerCount?: number, // Default to remaining layers
}

export interface TextureInfo {
  type: TextureType, // Effectively dimension: '1d', '2d', '3d'
  format: TextureFormat,
  usage: TextureUsageFlags, // Bitwise OR of TextureUsageFlags
  width: number,
  height: number,
  depthOrArrayLayers?: number, // Default 1
  mipLevelCount?: number, // Default 1
  sampleCount?: number, // Default 1 (for MSAA)
  label?: string,
  viewFormats?: TextureFormat[], // For creating views with different compatible formats (WebGPU)
}

export interface SamplerInfo {
  addressModeU?: AddressMode,
  addressModeV?: AddressMode,
  addressModeW?: AddressMode,
  magFilter?: FilterMode,
  minFilter?: FilterMode,
  mipmapFilter?: FilterMode, // 'nearest', 'linear', or not set
  lodMinClamp?: number,
  lodMaxClamp?: number,
  compareFunction?: CompareFunction,
  maxAnisotropy?: number, // 通常 1, 2, 4, 8, 16
  label?: string,
}

export interface ShaderModuleInfo {
  code: string, // WGSL or GLSL source. For GLSL, specific preprocessor defines might indicate stage.
  entryPoint?: string, // Required for WGSL, ignored for GLSL (uses main())
  hints?: Record<string, any>, // WebGPU layout hints
  label?: string,
}

export interface ShaderInfo {
  // For WebGL-like single program object
  vertexSource?: string,
  fragmentSource?: string,
  // For WebGPU-like pipeline stages
  vertexStage?: ShaderModuleInfo,
  fragmentStage?: ShaderModuleInfo,
  computeStage?: ShaderModuleInfo,
  label?: string,
}

export interface ColorAttachmentInfo { // WebGPU GPURenderPassColorAttachment
  view: ITextureView,
  resolveTarget?: ITextureView,
  clearValue?: Color | [number, number, number, number], // Allow Color type or raw array
  loadOp: 'load' | 'clear',
  storeOp: 'store' | 'discard',
}

export interface DepthStencilAttachmentInfo { // WebGPU GPURenderPassDepthStencilAttachment
  view: ITextureView,
  depthClearValue?: number,
  depthLoadOp?: 'load' | 'clear',
  depthStoreOp?: 'store' | 'discard',
  depthReadOnly?: boolean,
  stencilClearValue?: number,
  stencilLoadOp?: 'load' | 'clear',
  stencilStoreOp?: 'store' | 'discard',
  stencilReadOnly?: boolean,
}

/**
 * Describes a render pass (set of attachments).
 * Similar to a WebGPU RenderPassDescriptor, but TextureViews are ITextureView.
 */
export interface RenderPassDescriptor {
  colorAttachments: ColorAttachmentInfo[],
  depthStencilAttachment?: DepthStencilAttachmentInfo,
  occlusionQuerySet?: any, // Placeholder for IOcclusionQuerySet
  timestampWrites?: any[], // Placeholder for GPURenderPassTimestampWrite[]
  label?: string,
}

// IRenderTarget now more aligned with a WebGL FBO concept or a collection of views for a pass
export interface RenderTargetInfo {
  colorViews: ITextureView[],
  depthStencilView?: ITextureView,
  label?: string,
}