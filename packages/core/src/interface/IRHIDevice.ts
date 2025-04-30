import { RenderAPIType } from './constants';

/**
 * 支持的图形API类型
 */
export enum RHIApiType {
    D3D12,
    Vulkan,
    Metal,
    OpenGL,
    WebGPU
}

/**
 * 设备能力参数接口
 */
export interface IRHICapabilities {
    /** API类型 */
    apiType: RenderAPIType;
    
    /** 是否为WebGL2 */
    isWebGL2: boolean;
    
    /** 最大纹理尺寸 */
    maxTextureSize: number;
    
    /** 最大立方体贴图尺寸 */
    maxCubeMapSize: number;
    
    /** 最大渲染纹理尺寸 */
    maxRenderTextureSize: number;
    
    /** 最大顶点属性数量 */
    maxVertexAttribs: number;
    
    /** 最大顶点Uniform向量数量 */
    maxVertexUniformVectors: number;
    
    /** 最大片段Uniform向量数量 */
    maxFragmentUniformVectors: number;
    
    /** 最大Varying向量数量 */
    maxVaryingVectors: number;
    
    /** 最大纹理单元数量 */
    maxTextureUnits: number;
    
    /** 是否支持实例化绘制 */
    supportInstancing: boolean;
    
    /** 是否支持VAO (Vertex Array Object) */
    supportVAO: boolean;
    
    /** 是否支持实例化数组 */
    supportInstancedArrays: boolean;
    
    /** 是否支持多渲染目标 */
    supportMultiRenderTargets: boolean;
    
    /** 最大颜色附件数量 */
    maxColorAttachments: number;
    
    /** 最大绘制缓冲数量 */
    maxDrawBuffers: number;
    
    /** 是否支持ASTC纹理压缩 */
    supportASTCTextures: boolean;
    
    /** 是否支持S3TC纹理压缩 */
    supportS3TCTextures: boolean;
    
    /** 是否支持PVRTC纹理压缩 */
    supportPVRTCTextures: boolean;
    
    /** 是否支持ETC1纹理压缩 */
    supportETC1Textures: boolean;
    
    /** 是否支持ETC2纹理压缩 */
    supportETC2Textures: boolean;
    
    /** 是否支持深度纹理 */
    supportDepthTexture: boolean;
    
    /** 是否支持浮点纹理 */
    supportFloatTexture: boolean;
    
    /** 是否支持半浮点纹理 */
    supportHalfFloatTexture: boolean;
    
    /** 是否支持各向异性过滤 */
    supportAnisotropy: boolean;
    
    /** 最大各向异性级别 */
    maxAnisotropy: number;
    
    /** 是否支持视口数组 */
    supportViewportArray: boolean;
    
    /** 是否支持计算着色器 */
    supportComputeShader: boolean;
    
    /** 是否支持WEBGL_depth_texture扩展 */
    supportExtensionDepthTexture: boolean;
    
    /** 是否支持OES_element_index_uint扩展 */
    supportExtensionElementIndexUint: boolean;
    
    /** 是否支持OES_texture_float扩展 */
    supportExtensionTextureFloat: boolean;
    
    /** 是否支持OES_texture_float_linear扩展 */
    supportExtensionTextureFloatLinear: boolean;
    
    /** 是否支持OES_texture_half_float扩展 */
    supportExtensionTextureHalfFloat: boolean;
    
    /** 是否支持OES_texture_half_float_linear扩展 */
    supportExtensionTextureHalfFloatLinear: boolean;
    
    /** 是否支持WEBGL_color_buffer_float扩展 */
    supportExtensionColorBufferFloat: boolean;
    
    /** 是否支持多视图绘制 */
    supportMultiview: boolean;
}

/**
 * 渲染硬件接口设备抽象
 * 提供对底层图形API的访问和特性检测
 */
export interface IRHIDevice {
    /**
     * 初始化设备
     * @param canvas 渲染目标画布
     * @param options 初始化选项
     */
    initialize(canvas: HTMLCanvasElement, options?: RHIDeviceOptions): Promise<boolean>;
    
    /**
     * 获取设备API类型
     */
    getAPIType(): RenderAPIType;
    
    /**
     * 获取底层图形上下文
     */
    getContext(): any;
    
    /**
     * 检查是否支持特定扩展
     * @param extensionName 扩展名称
     */
    isExtensionSupported(extensionName: string): boolean;
    
    /**
     * 获取特定扩展
     * @param extensionName 扩展名称
     */
    getExtension(extensionName: string): any;
    
    /**
     * 获取设备能力参数
     */
    getCapabilities(): IRHICapabilities;
    
    /**
     * 获取最大纹理大小
     */
    getMaxTextureSize(): number;
    
    /**
     * 获取最大立方体贴图大小
     */
    getMaxCubeMapSize(): number;
    
    /**
     * 检查是否支持实例化渲染
     */
    supportsInstancing(): boolean;
    
    /**
     * 检查是否支持多渲染目标
     */
    supportsMultiRenderTargets(): boolean;
    
    /**
     * 获取最大颜色附件数量
     */
    getMaxColorAttachments(): number;
    
    /**
     * 检查是否支持深度纹理
     */
    supportsDepthTexture(): boolean;
    
    /**
     * 检查是否支持浮点纹理
     */
    supportsFloatTexture(): boolean;
    
    /**
     * 检查是否支持半浮点纹理
     */
    supportsHalfFloatTexture(): boolean;
    
    /**
     * 检查是否支持特定纹理格式
     * @param format 纹理格式
     */
    supportsTextureFormat(format: number): boolean;
    
    /**
     * 检查是否支持渲染到特定纹理格式
     * @param format 纹理格式
     */
    supportsRenderTextureFormat(format: number): boolean;
    
    /**
     * 获取着色器精度格式
     * @param shaderType 着色器类型
     * @param precisionType 精度类型
     */
    getShaderPrecisionFormat(shaderType: number, precisionType: number): any;
    
    /**
     * 等待所有绘制命令完成
     */
    finish(): void;
    
    /**
     * 刷新所有绘制命令
     */
    flush(): void;
    
    /**
     * 重置设备状态
     */
    resetState(): void;
    
    /**
     * 销毁设备资源
     */
    destroy(): void;
}

/**
 * 设备初始化选项
 */
export interface RHIDeviceOptions {
    /** 
     * 首选API类型 
     */
    preferredAPI?: RenderAPIType;
    
    /**
     * 是否启用抗锯齿
     */
    antialias?: boolean;
    
    /**
     * 是否启用alpha通道
     */
    alpha?: boolean;
    
    /**
     * 是否支持透明缓冲区
     */
    preserveDrawingBuffer?: boolean;
    
    /**
     * 是否启用深度缓冲
     */
    depth?: boolean;
    
    /**
     * 是否启用模板缓冲
     */
    stencil?: boolean;
    
    /**
     * 是否启用失去上下文扩展
     */
    powerPreference?: 'default' | 'high-performance' | 'low-power';
    
    /**
     * 像素比率
     */
    pixelRatio?: number;
    
    /**
     * 是否预乘alpha
     */
    premultipliedAlpha?: boolean;
    
    /**
     * 是否启用检查重复绘制调用
     */
    checkRedundantCalls?: boolean;
}