import type { IBuffer } from './IBuffer';
import type { BufferDescriptor } from './IBuffer';
import type { IShader } from './IShader';
import type { IRenderTarget } from './IRenderTarget';
import type { ITexture } from './ITexture';
import type { TextureDescriptor } from './ITexture';
import type { RenderTargetDescriptor } from './IRenderTarget';
import type { ShaderCreateOptions } from './IShader';

/**
 * 资源工厂接口 - 创建和管理渲染资源
 */
export interface IResourceFactory {
  /**
   * 创建缓冲区对象
   * @param descriptor - 缓冲区描述符
   * @returns 创建的缓冲区对象
   */
  createBuffer(descriptor: BufferDescriptor): IBuffer;
  
  /**
   * 创建着色器对象
   * @param options - 着色器创建选项
   * @returns 创建的着色器对象
   */
  createShader(options: ShaderCreateOptions): IShader;
  
  /**
   * 从文件创建着色器
   * @param vertexPath - 顶点着色器文件路径
   * @param fragmentPath - 片段着色器文件路径
   * @param defines - 可选的宏定义列表
   * @returns 创建的着色器对象
   */
  createShaderFromFile(vertexPath: string, fragmentPath: string, defines?: Record<string, string | number | boolean>): Promise<IShader>;
  
  /**
   * 创建纹理对象
   * @param descriptor - 纹理描述符
   * @returns 创建的纹理对象
   */
  createTexture(descriptor: TextureDescriptor): ITexture;
  
  /**
   * 从图像创建纹理
   * @param image - 图像对象或URL
   * @param options - 纹理选项
   * @returns 创建的纹理对象
   */
  createTextureFromImage(image: HTMLImageElement | ImageBitmap | ImageData | string, options?: Partial<TextureDescriptor>): Promise<ITexture>;
  
  /**
   * 从视频创建纹理
   * @param video - 视频元素或URL
   * @param options - 纹理选项
   * @returns 创建的纹理对象
   */
  createTextureFromVideo(video: HTMLVideoElement | string, options?: Partial<TextureDescriptor>): Promise<ITexture>;
  
  /**
   * 从立方体图像创建纹理
   * @param images - 六个面的图像(+X, -X, +Y, -Y, +Z, -Z)
   * @param options - 纹理选项
   * @returns 创建的立方体纹理
   */
  createCubeTexture(images: (HTMLImageElement | ImageBitmap | ImageData | string)[], options?: Partial<TextureDescriptor>): Promise<ITexture>;
  
  /**
   * 创建渲染目标
   * @param descriptor - 渲染目标描述符
   * @returns 创建的渲染目标
   */
  createRenderTarget(descriptor: RenderTargetDescriptor): IRenderTarget;
  
  /**
   * 释放资源
   * @param resource - 要释放的资源
   */
  releaseResource(resource: IBuffer | IShader | ITexture | IRenderTarget): void;
  
  /**
   * 释放所有由该工厂创建的资源
   */
  releaseAllResources(): void;
  
  /**
   * 获取已创建资源的统计信息
   * @returns 资源统计信息
   */
  getResourceStats(): {
    buffers: number;
    shaders: number;
    textures: number;
    renderTargets: number;
    totalMemoryUsage: number;
  };
} 