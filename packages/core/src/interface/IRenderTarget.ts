import type { ITexture } from './ITexture';
import type { TextureFormat, CompareFunc } from './constants';

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
 * 附件配置项
 */
export interface AttachmentOptions {
  /**
   * 附件格式
   */
  format: TextureFormat,

  /**
   * 是否可以采样(着色器访问)
   */
  loadable?: boolean,

  /**
   * 是否可以被存储
   */
  storable?: boolean,

  /**
   * 初始清除值(颜色附件)
   */
  clearValue?: [number, number, number, number],

  /**
   * 初始深度值(深度附件)
   */
  clearDepth?: number,

  /**
   * 初始模板值(模板附件)
   */
  clearStencil?: number,
}

/**
 * 渲染目标描述符
 */
export interface RenderTargetDescriptor {
  /**
   * 渲染目标宽度
   */
  width: number,

  /**
   * 渲染目标高度
   */
  height: number,

  /**
   * 颜色附件格式
   */
  colorFormats: TextureFormat[],

  /**
   * 颜色附件配置
   */
  colorAttachments?: AttachmentOptions[],

  /**
   * 深度附件格式
   */
  depthFormat?: TextureFormat,

  /**
   * 深度附件配置
   */
  depthAttachment?: AttachmentOptions,

  /**
   * 深度比较函数(用于深度比较采样模式)
   */
  depthCompareFunc?: CompareFunc,

  /**
   * 是否支持多重采样
   */
  multisampled?: boolean,

  /**
   * 多重采样数量
   */
  sampleCount?: number,

  /**
   * 是否生成mipmap
   */
  generateMipmap?: boolean,

  /**
   * 是否支持立方体贴图渲染
   */
  cubemap?: boolean,

  /**
   * 标签(用于调试)
   */
  label?: string,
}

/**
 * 清除选项
 */
export interface ClearOptions {
  /**
   * 清除颜色
   */
  color?: [number, number, number, number],

  /**
   * 清除深度值
   */
  depth?: number,

  /**
   * 清除模板值
   */
  stencil?: number,

  /**
   * 要清除的颜色附件掩码，为空表示清除所有颜色附件
   */
  colorAttachmentMask?: number[],

  /**
   * 是否清除深度
   */
  clearDepth?: boolean,

  /**
   * 是否清除模板
   */
  clearStencil?: boolean,
}

/**
 * 渲染目标接口 - 定义离屏渲染目标
 */
export interface IRenderTarget {
  /**
   * 渲染目标ID
   */
  id: number,

  /**
   * 渲染目标宽度
   */
  width: number,

  /**
   * 渲染目标高度
   */
  height: number,

  /**
   * 是否包含深度缓冲
   */
  hasDepth: boolean,

  /**
   * 是否包含模板缓冲
   */
  hasStencil: boolean,

  /**
   * 是否为多重采样渲染目标
   */
  isMultisampled: boolean,

  /**
   * 多重采样数量
   */
  sampleCount: number,

  /**
   * 颜色附件数量
   */
  colorAttachmentCount: number,

  /**
   * 是否为立方体贴图渲染目标
   */
  isCubemap: boolean,

  /**
   * 获取颜色附件纹理
   * @param index - 颜色附件索引，默认为0
   * @returns 颜色附件纹理
   * @throws 当索引超出范围时抛出错误
   */
  getColorTexture(index?: number): ITexture,

  /**
   * 获取所有颜色附件纹理
   * @returns 颜色附件纹理数组
   */
  getColorTextures(): ITexture[],

  /**
   * 获取深度附件纹理（如果可用）
   * @returns 深度附件纹理，不可用时返回null
   */
  getDepthTexture(): ITexture | null,

  /**
   * 获取模板附件纹理（如果可用）
   * @returns 模板附件纹理，不可用时返回null
   */
  getStencilTexture(): ITexture | null,

  /**
   * 绑定渲染目标
   */
  bind(): void,

  /**
   * 解绑渲染目标（恢复到默认帧缓冲）
   */
  unbind(): void,

  /**
   * 绑定指定附件为渲染目标
   * @param attachments - 要绘制的附件索引数组，例如[0, 2]表示只渲染到第一和第三个颜色附件
   * @throws 当指定的附件不存在时抛出错误
   */
  bindWithAttachments(attachments: number[]): void,

  /**
   * 调整渲染目标大小
   * @param width - 新宽度
   * @param height - 新高度
   * @throws 当宽度或高度为负数或超出设备限制时抛出错误
   */
  resize(width: number, height: number): void,

  /**
   * 清除渲染目标
   * @param options - 清除选项
   */
  clear(options: ClearOptions): void,

  /**
   * 根据RGBA值清除所有颜色缓冲区
   * @param r - 红色通道值
   * @param g - 绿色通道值
   * @param b - 蓝色通道值
   * @param a - 透明通道值
   * @param attachmentMask - 要清除的颜色附件掩码，默认全部
   */
  clearColor(r: number, g: number, b: number, a: number, attachmentMask?: number[]): void,

  /**
   * 根据深度值清除深度缓冲
   * @param depth - 深度值(0-1)
   * @throws 当深度值超出范围或渲染目标不包含深度缓冲时抛出错误
   */
  clearDepth(depth: number): void,

  /**
   * 根据模板值清除模板缓冲
   * @param stencil - 模板值
   * @throws 当渲染目标不包含模板缓冲时抛出错误
   */
  clearStencil(stencil: number): void,

  /**
   * 将内容复制到另一个渲染目标
   * @param target - 目标渲染目标，null表示默认帧缓冲
   * @param filter - 过滤模式
   * @param sourceAttachmentIndex - 源附件索引
   * @param targetAttachmentIndex - 目标附件索引
   * @throws 当源或目标附件不存在时抛出错误
   */
  blit(target: IRenderTarget | null, filter?: number, sourceAttachmentIndex?: number, targetAttachmentIndex?: number): void,

  /**
   * 解析多重采样渲染目标
   * @throws 当渲染目标不是多重采样时抛出错误
   */
  resolveMultisample(): void,

  /**
   * 读取像素数据
   * @param x - 起始x坐标
   * @param y - 起始y坐标
   * @param width - 区域宽度
   * @param height - 区域高度
   * @param attachmentIndex - 颜色附件索引
   * @param buffer - 可选的目标缓冲区
   * @returns 像素数据
   * @throws 当参数无效或索引越界时抛出错误
   */
  readPixels(x: number, y: number, width: number, height: number, attachmentIndex?: number, buffer?: ArrayBufferView): ArrayBufferView,

  /**
   * 销毁渲染目标
   */
  destroy(): void,

  /**
   * 检查渲染目标是否有效
   * @returns 如果渲染目标有效则返回true
   */
  isValid(): boolean,
}