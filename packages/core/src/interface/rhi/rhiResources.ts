/**
 * rhiResources.ts
 * 包含所有RHI资源接口定义。
 */

import type {
  BufferUsage,
  TextureType,
  TextureFormat,
  TextureUsageFlags,
  AddressMode,
  FilterMode,
  CompareFunction,
  MapMode,
} from './rhiEnums';
import type { TextureViewDescriptor } from './rhiInfos'; // Will create rhiInfos.ts later

//---------------------------------------------------------------------------------------------------------------------
// 资源接口定义
//---------------------------------------------------------------------------------------------------------------------

export interface RHIResource {
  readonly label?: string,
  destroy(): void,
}

export interface IBuffer extends RHIResource {
  readonly usage: BufferUsage,
  readonly size: number,
  mapAsync(mode: MapMode, offset?: number, size?: number): Promise<ArrayBuffer>,
  unmap(): void,
  getMappedRange(offset?: number, size?: number): ArrayBuffer, // Call only when mapped
}

export interface ITextureView extends RHIResource {
  readonly texture: ITexture, // Cyclic dependency: ITexture will also refer to ITextureView
  readonly descriptor: TextureViewDescriptor,
}

export interface ITexture extends RHIResource {
  readonly type: TextureType,
  readonly format: TextureFormat,
  readonly usage: TextureUsageFlags,
  readonly width: number,
  readonly height: number,
  readonly depthOrArrayLayers: number,
  readonly mipLevelCount: number,
  readonly sampleCount: number,
  createView(descriptor?: TextureViewDescriptor): ITextureView,
}

export interface ISampler extends RHIResource {
  // Sampler state is typically immutable after creation
  readonly addressModeU: AddressMode,
  readonly addressModeV: AddressMode,
  readonly addressModeW: AddressMode,
  readonly magFilter: FilterMode,
  readonly minFilter: FilterMode,
  readonly mipmapFilter?: FilterMode,
  readonly lodMinClamp: number,
  readonly lodMaxClamp: number,
  readonly compareFunction?: CompareFunction,
  readonly maxAnisotropy: number,
}

/**
 * Represents a single shader module (e.g., a WGSL module, or a GLSL vertex/fragment shader text)
 */
export interface IShaderModule extends RHIResource {
  // readonly code: string; // Might not be needed if compiled
  // readonly entryPoint?: string;
}

/**
 * RHI 着色器程序对象 or a collection of shader stages for pipeline creation.
 * For WebGL, this would be a linked GLProgram.
 * For WebGPU, this might just be a collection of IShaderModule references to be used in PipelineStateInfo.
 */
export interface IShader extends RHIResource {
  // For WebGL: a linked program. For WebGPU: more of a descriptor/collection of modules.
  // Consider if this interface is strictly necessary or if PipelineStateInfo directly takes ShaderModuleInfo.
}

export interface IRenderTarget extends RHIResource {
  // This interface might be more WebGL FBO like.
  // WebGPU render targets are defined by the views in RenderPassDescriptor.
  // It could be useful as a helper to manage a set of ITextureViews for a pass.
  readonly colorViews: ReadonlyArray<ITextureView | null>,
  readonly depthStencilView: ITextureView | null,
}

export interface IPipelineState extends RHIResource {
  // This object represents a compiled, ready-to-use pipeline state.
  // It would encapsulate all the state from PipelineStateInfo.
}

export interface IBindGroupLayout extends RHIResource {
  // readonly entries: ReadonlyArray<BindGroupLayoutEntry>; // BindGroupLayoutEntry will be in rhiPipelineStates.ts
}

export interface IPipelineLayout extends RHIResource {
  // readonly bindGroupLayouts: ReadonlyArray<IBindGroupLayout>;
}