import type { Color } from '@maxellabs/math';
import type {
  BufferInfo,
  IBuffer,
  TextureInfo,
  ITexture,
  SamplerInfo,
  ISampler,
  ShaderInfo,
  IShader,
  RenderTargetInfo,
  IRenderTarget,
  PipelineStateInfo,
  IPipelineState,
  IndexFormat,
  PrimitiveType,
  RenderPassDescriptor,
  // GraphicsFeature, // Assuming GraphicsFeature is specific to IGraphicsDevice or engine capabilities rather than pure RHI
} from './rhi'; // Import from the new RHI entry point

/**
 * 图形设备能力标志 - 移至此处或引擎特定能力文件中，而非RHI层
 */
export enum GraphicsFeature {
  INSTANCING = 'instancing',
  MULTIPLE_RENDER_TARGETS = 'multipleRenderTargets',
  DEPTH_TEXTURE = 'depthTexture',
  FLOAT_TEXTURE = 'floatTexture',
  HALF_FLOAT_TEXTURE = 'halfFloatTexture',
  ANISOTROPIC_FILTERING = 'anisotropicFiltering',
  VERTEX_ARRAY_OBJECT = 'vertexArrayObject',
  S3TC_TEXTURE_COMPRESSION = 's3tcTextureCompression',
  ASTC_TEXTURE_COMPRESSION = 'astcTextureCompression',
  ETC2_TEXTURE_COMPRESSION = 'etc2TextureCompression',
  COMPUTE_SHADER = 'computeShader',
  TEXTURE_FORMAT_BC1 = 'texture-format-bc1',
  TEXTURE_FORMAT_BC2 = 'texture-format-bc2',
  TEXTURE_FORMAT_BC3 = 'texture-format-bc3',
  TEXTURE_FORMAT_BC4 = 'texture-format-bc4',
  TEXTURE_FORMAT_BC5 = 'texture-format-bc5',
  TEXTURE_FORMAT_BC6H = 'texture-format-bc6h',
  TEXTURE_FORMAT_BC7 = 'texture-format-bc7',
  TEXTURE_FORMAT_ETC2 = 'texture-format-etc2',
  TEXTURE_FORMAT_ASTC = 'texture-format-astc',
  TIMESTAMP_QUERY = 'timestamp-query',
  PIPELINE_STATISTICS_QUERY = 'pipeline-statistics-query',
  INDIRECT_FIRST_INSTANCE = 'indirect-first-instance',
  SHADER_FLOAT64 = 'shader-float64',
  SHADER_INT16 = 'shader-int16',
  SHADER_INT64 = 'shader-int64',
  // ... 更多特性
}

/**
 * 图形设备能力信息
 */
export interface IGraphicsDeviceCapabilities {
  readonly maxTextureDimension1D: number;
  readonly maxTextureDimension2D: number;
  readonly maxTextureDimension3D: number;
  readonly maxTextureArrayLayers: number;
  readonly maxBindGroups: number;
  readonly maxDynamicUniformBuffersPerPipelineLayout: number;
  readonly maxDynamicStorageBuffersPerPipelineLayout: number;
  readonly maxSampledTexturesPerShaderStage: number;
  readonly maxSamplersPerShaderStage: number;
  readonly maxStorageBuffersPerShaderStage: number;
  readonly maxStorageTexturesPerShaderStage: number;
  readonly maxUniformBuffersPerShaderStage: number;
  readonly maxUniformBufferBindingSize: number;
  readonly maxStorageBufferBindingSize: number;
  readonly minUniformBufferOffsetAlignment: number;
  readonly minStorageBufferOffsetAlignment: number;
  readonly maxVertexBuffers: number;
  readonly maxVertexAttributes: number;
  readonly maxVertexBufferArrayStride: number;
  readonly maxColorAttachments: number;
  readonly maxColorAttachmentBytesPerSample: number;

  isFeatureSupported(feature: GraphicsFeature): boolean;
  isTextureFormatSupported(format: import('./rhi').TextureFormat): boolean; 
}

/**
 * 图形设备初始化选项
 */
export interface GraphicsDeviceOptions {
  alpha?: boolean;
  antialias?: boolean;
  depth?: boolean;
  stencil?: boolean;
  preserveDrawingBuffer?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  pixelRatio?: number;
  requiredFeatures?: GraphicsFeature[];
  requiredLimits?: Partial<Record<keyof Omit<IGraphicsDeviceCapabilities, 'isFeatureSupported' | 'isTextureFormatSupported'>, number>>;
}

export interface IRenderPassEncoder {
  setPipeline(pipeline: IPipelineState): void;
  setVertexBuffer(slot: number, buffer: IBuffer, offset?: number, size?: number): void;
  setIndexBuffer(buffer: IBuffer, indexFormat: IndexFormat, offset?: number, size?: number): void;
  // Bind group related methods for WebGPU style, or individual resource binding for WebGL
  setBindGroup(index: number, bindGroup: any /*IBindGroup*/, dynamicOffsets?: number[]): void;
  // Or more WebGL-like direct bindings if abstracting over WebGL directly without full bind group emulation
  setUniformBuffer(slot: number, buffer: IBuffer, offset?: number, size?: number): void;
  setTextureView(slot: number, view: import('./rhi').ITextureView): void;
  setSampler(slot: number, sampler: ISampler): void;
  
  draw(vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number): void;
  drawIndexed(indexCount: number, instanceCount?: number, firstIndex?: number, baseVertex?: number, firstInstance?: number): void;
  drawIndirect(indirectBuffer: IBuffer, indirectOffset: number): void;
  drawIndexedIndirect(indirectBuffer: IBuffer, indirectOffset: number): void;
  
  // Render pass specific commands
  setViewport(x: number, y: number, width: number, height: number, minDepth?: number, maxDepth?: number): void;
  setScissorRect(x: number, y: number, width: number, height: number): void;
  setBlendConstant(color: Color | [number,number,number,number]): void;
  setStencilReference(reference: number): void;
  
  beginOcclusionQuery?(queryIndex: number): void;
  endOcclusionQuery?(): void;
  executeBundles?(bundles: any[] /*IRenderBundle[]*/): void;
  pushDebugGroup?(groupLabel: string): void;
  popDebugGroup?(): void;
  insertDebugMarker?(markerLabel: string): void;
  
  end(): void;
}

/**
 * 底层图形设备接口 (Rendering Hardware Interface - RHI)
 */
export interface IGraphicsDevice {
  readonly canvas?: HTMLCanvasElement;
  readonly drawingBufferWidth: number;
  readonly drawingBufferHeight: number;
  readonly pixelRatio: number;
  readonly capabilities: IGraphicsDeviceCapabilities;
  readonly isInitialized: boolean;
  readonly lost?: Promise<any /* GPUDeviceLostInfo */>; // For WebGPU device loss
  readonly name: string; // e.g. 'WebGL 2.0', 'WebGPU - Intel Iris Plus Graphics'

  initialize(canvas: HTMLCanvasElement, options?: GraphicsDeviceOptions): Promise<boolean>;
  destroy(): void;

  beginFrame(): void; // May not be needed for all backends
  endFrame(): void;   // Presents the frame

  // Resource Creation
  createBuffer(descriptor: BufferInfo): IBuffer;
  createTexture(descriptor: TextureInfo): ITexture;
  createSampler(descriptor?: SamplerInfo): ISampler; // SamplerInfo is optional for default sampler
  createShader(descriptor: ShaderInfo): IShader; // IShader might be more of a module container
  createRenderTarget(descriptor: RenderTargetInfo): IRenderTarget; // Might be a helper for views
  createPipelineState(descriptor: PipelineStateInfo): IPipelineState;
  // createBindGroupLayout(descriptor: BindGroupLayoutInfo): IBindGroupLayout;
  // createPipelineLayout(descriptor: PipelineLayoutInfo): IPipelineLayout;
  // createBindGroup(descriptor: BindGroupInfo): IBindGroup;
  // createComputePipeline(descriptor: ComputePipelineInfo): IComputePipelineState;
  // createRenderBundleEncoder(descriptor: RenderBundleEncoderDescriptor): IRenderBundleEncoder;
  // createQuerySet(descriptor: QuerySetDescriptor): IQuerySet;

  // Resource Updates (simplified, specific updates might be on resources themselves or via command encoder)
  updateBufferData(buffer: IBuffer, data: ArrayBufferView, bufferOffset?: number, dataOffset?: number, size?: number): void;
  updateTextureData(
    texture: ITexture,
    source: TexImageSource | ArrayBufferView | ArrayBufferView[], // TexImageSource for WebGL, Buffer for WebGPU
    destination?: {
        origin?: [number, number, number], // x, y, z/layer
        mipLevel?: number,
    },
    layout?: {
        offset?: number, // Required if data is ArrayBufferView
        bytesPerRow?: number, // Required if data is ArrayBufferView and rows > 1 or texture is 2D/3D
        rowsPerImage?: number, // Required if data is ArrayBufferView and texture is 3D
    },
    size?: [number, number, number] // width, height, depth/layers
  ): void;
  
  // Direct state setting (mostly for simpler APIs or initial setup, pass commands prefer encoder)
  setViewport(x: number, y: number, width: number, height: number): void;
  setScissor(x: number, y: number, width: number, height: number, enabled?: boolean): void;
  clear(options: { color?: Color | [number,number,number,number] | false, depth?: number | false, stencil?: number | false }): void;

  // Render Pass Management
  beginRenderPass(descriptor: RenderPassDescriptor): IRenderPassEncoder;
  // beginComputePass(descriptor?: ComputePassDescriptor): IComputePassEncoder;

  // Command Submission (for backends that explicitly use queues/submission)
  submit?(commandBuffers: any[] /*ICommandBuffer[]*/): void;

  readPixels(
    x: number,
    y: number,
    width: number,
    height: number,
    sourceRenderTarget?: IRenderTarget | null, // null for default framebuffer
    destinationBuffer?: Uint8Array // Optional pre-allocated buffer
  ): Promise<Uint8Array>;
}