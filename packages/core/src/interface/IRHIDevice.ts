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
    maxTextureSize: number;
    maxCubeMapSize: number;
    maxRenderTextureSize: number;
    maxVertexAttribs: number;
    supportInstancedArrays: boolean;
    supportMultiRenderTargets: boolean;
    isWebGL2?: boolean;
    maxColorAttachments: number;
    supportDepthTexture: boolean;
    supportFloatTexture: boolean;
    supportHalfFloatTexture: boolean;
}

/**
 * 渲染硬件接口设备抽象
 * 提供对底层图形API的访问和特性检测
 */
export interface IRHIDevice {
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
    supportsInstancedArrays(): boolean;
    
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
}