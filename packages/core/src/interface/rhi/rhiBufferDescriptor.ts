
/**
   * 缓冲区描述符
   */
export interface RHIBufferDescriptor {
  /**
     * 缓冲区字节大小
     */
  size: number,

  /**
     * 缓冲区用途
     */
  usage: RHIBufferUsage,

  /**
     * 初始数据，如果提供则在创建时填充
     */
  initialData?: BufferSource,

  /**
     * WebGL兼容性选项：使用方式提示
     * 在WebGPU中被忽略
     */
  hint?: 'static' | 'dynamic' | 'stream',
}

/**
   * 纹理描述符
   */
export interface RHITextureDescriptor {
  /**
     * 纹理宽度
     */
  width: number,

  /**
     * 纹理高度
     */
  height: number,

  /**
     * 纹理深度或数组层数
     */
  depthOrArrayLayers?: number,

  /**
     * MIP等级数
     */
  mipLevelCount?: number,

  /**
     * 纹理格式
     */
  format: RHITextureFormat,

  /**
     * 纹理用途
     */
  usage: RHITextureUsage,

  /**
     * 采样数量(多重采样)
     */
  sampleCount?: number,

  /**
     * WebGL兼容性选项：纹理类型
     * 在WebGPU中根据其他属性推断
     */
  dimension?: '1d' | '2d' | '3d' | 'cube',
}

/**
   * 渲染管线描述符
   */
export interface RHIRenderPipelineDescriptor {
  /**
     * 顶点着色器
     */
  vertexShader: IRHIShaderModule,

  /**
     * 片段着色器
     */
  fragmentShader: IRHIShaderModule,

  /**
     * 顶点输入布局
     */
  vertexLayout: RHIVertexLayout,

  /**
     * 图元类型
     */
  primitiveTopology: RHIPrimitiveTopology,

  /**
     * 光栅化状态
     */
  rasterizationState?: RHIRasterizationState,

  /**
     * 深度模板状态
     */
  depthStencilState?: RHIDepthStencilState,

  /**
     * 颜色混合状态
     */
  colorBlendState?: RHIColorBlendState,

  /**
     * 绑定组布局
     */
  bindGroupLayouts: IRHIBindGroupLayout[],
}