import type { ITexture } from './ITexture';
import { TextureFormat } from './constants';

/**
 * 渲染目标附件类型
 */
export enum RenderTargetAttachmentType {
  COLOR = 'color',
  DEPTH = 'depth',
  STENCIL = 'stencil',
  DEPTH_STENCIL = 'depthStencil'
}

/**
 * 渲染目标描述符
 */
export interface RenderTargetDescriptor {
  /**
   * 渲染目标宽度
   */
  width: number;
  
  /**
   * 渲染目标高度
   */
  height: number;
  
  /**
   * 颜色附件格式
   */
  colorFormats: TextureFormat[];
  
  /**
   * 深度附件格式
   */
  depthFormat?: TextureFormat;
  
  /**
   * 是否支持多重采样
   */
  multisampled?: boolean;
  
  /**
   * 多重采样数量
   */
  sampleCount?: number;
  
  /**
   * 是否生成mipmap
   */
  generateMipmap?: boolean;
}

/**
 * 渲染目标接口 - 定义离屏渲染目标
 */
export interface IRenderTarget {
  /**
   * 渲染目标ID
   */
  id: number;
  
  /**
   * 渲染目标宽度
   */
  width: number;
  
  /**
   * 渲染目标高度
   */
  height: number;
  
  /**
   * 是否包含深度缓冲
   */
  hasDepth: boolean;
  
  /**
   * 是否包含模板缓冲
   */
  hasStencil: boolean;
  
  /**
   * 是否为多重采样渲染目标
   */
  isMultisampled: boolean;
  
  /**
   * 多重采样数量
   */
  sampleCount: number;
  
  /**
   * 颜色附件数量
   */
  colorAttachmentCount: number;
  
  /**
   * 获取颜色附件纹理
   * @param index - 颜色附件索引，默认为0
   */
  getColorTexture(index?: number): ITexture;
  
  /**
   * 获取所有颜色附件纹理
   */
  getColorTextures(): ITexture[];
  
  /**
   * 获取深度附件纹理（如果可用）
   */
  getDepthTexture(): ITexture | null;
  
  /**
   * 获取模板附件纹理（如果可用）
   */
  getStencilTexture(): ITexture | null;
  
  /**
   * 绑定渲染目标
   */
  bind(): void;
  
  /**
   * 解绑渲染目标（恢复到默认帧缓冲）
   */
  unbind(): void;
  
  /**
   * 绑定指定附件为渲染目标
   * @param attachments - 要绘制的附件索引数组，例如[0, 2]表示只渲染到第一和第三个颜色附件
   */
  bindWithAttachments(attachments: number[]): void;
  
  /**
   * 调整渲染目标大小
   * @param width - 新宽度
   * @param height - 新高度
   */
  resize(width: number, height: number): void;
  
  /**
   * 清除渲染目标
   * @param r - 红色通道值
   * @param g - 绿色通道值
   * @param b - 蓝色通道值
   * @param a - 透明通道值
   * @param clearDepth - 是否清除深度，默认true
   * @param clearStencil - 是否清除模板，默认true
   * @param attachmentMask - 要清除的颜色附件掩码，默认全部
   */
  clear(r: number, g: number, b: number, a: number, clearDepth?: boolean, clearStencil?: boolean, attachmentMask?: number): void;
  
  /**
   * 根据深度值清除深度缓冲
   * @param depth - 深度值(0-1)
   */
  clearDepth(depth: number): void;
  
  /**
   * 根据模板值清除模板缓冲
   * @param stencil - 模板值
   */
  clearStencil(stencil: number): void;
  
  /**
   * 将内容复制到另一个渲染目标
   * @param target - 目标渲染目标，null表示默认帧缓冲
   * @param filter - 过滤模式
   * @param sourceAttachmentIndex - 源附件索引
   * @param targetAttachmentIndex - 目标附件索引
   */
  blit(target: IRenderTarget | null, filter?: number, sourceAttachmentIndex?: number, targetAttachmentIndex?: number): void;
  
  /**
   * 解析多重采样渲染目标
   */
  resolveMultisample(): void;
  
  /**
   * 读取像素数据
   * @param x - 起始x坐标
   * @param y - 起始y坐标
   * @param width - 区域宽度
   * @param height - 区域高度
   * @param attachmentIndex - 颜色附件索引
   * @param buffer - 可选的目标缓冲区
   * @returns 像素数据
   */
  readPixels(x: number, y: number, width: number, height: number, attachmentIndex?: number, buffer?: ArrayBufferView): ArrayBufferView;
  
  /**
   * 销毁渲染目标
   */
  destroy(): void;
} 