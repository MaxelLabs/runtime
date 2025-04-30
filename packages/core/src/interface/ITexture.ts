import type { TextureFormat, TextureType, TextureUsage, TextureFilter, TextureAddressMode } from './constants';

/**
 * 纹理描述符接口
 */
export interface TextureDescriptor {
  /**
   * 纹理类型
   */
  type: TextureType,

  /**
   * 纹理用途
   */
  usage: TextureUsage,

  /**
   * 纹理格式
   */
  format: TextureFormat,

  /**
   * 纹理宽度
   */
  width: number,

  /**
   * 纹理高度
   */
  height: number,

  /**
   * 纹理深度(3D纹理)
   */
  depth?: number,

  /**
   * 多采样数
   */
  sampleCount?: 1 | 2 | 4 | 8 | 16,

  /**
   * 多级渐进纹理(Mipmap)级别数
   */
  mipLevels?: number,

  /**
   * 数组层数
   */
  arrayLayers?: number,

  /**
   * 初始数据(可选)
   */
  data?: ArrayBufferView | ArrayBufferView[],

  /**
   * 是否预乘alpha
   */
  premultipliedAlpha?: boolean,

  /**
   * 是否可通过CPU读取
   */
  canRead?: boolean,

  /**
   * 过滤方式配置
   */
  filter?: {
    min?: TextureFilter,
    mag?: TextureFilter,
  },

  /**
   * 寻址模式配置
   */
  addressMode?: {
    u?: TextureAddressMode,
    v?: TextureAddressMode,
    w?: TextureAddressMode,
  },

  /**
   * 各维度尺寸是否为2的幂
   */
  isPowerOfTwo?: boolean,

  /**
   * 标签(用于调试)
   */
  label?: string,
}

/**
 * 纹理采样器状态
 */
export interface ITextureSamplerState {
  /**
   * 缩小过滤模式
   */
  minFilter: TextureFilter,

  /**
   * 放大过滤模式
   */
  magFilter: TextureFilter,

  /**
   * 水平环绕模式
   */
  wrapS: TextureAddressMode,

  /**
   * 垂直环绕模式
   */
  wrapT: TextureAddressMode,

  /**
   * 各向异性过滤级别
   */
  anisotropy: number,
}

/**
 * 纹理接口 - 定义纹理资源和操作
 */
export interface ITexture {
  /**
   * 纹理ID
   */
  id: number,

  /**
   * 纹理宽度
   */
  width: number,

  /**
   * 纹理高度
   */
  height: number,

  /**
   * 纹理格式
   */
  format: TextureFormat,

  /**
   * 纹理采样器状态
   */
  samplerState: ITextureSamplerState,

  /**
   * 纹理是否已准备就绪
   */
  isReady: boolean,

  /**
   * 是否为立方体贴图
   */
  isCube: boolean,

  /**
   * 是否为3D纹理
   */
  is3D: boolean,

  /**
   * 是否包含mipmap
   */
  hasMipmap: boolean,

  /**
   * 最大mipmap级别
   */
  mipmapCount: number,

  /**
   * 绑定纹理到指定纹理单元
   * @param slot - 纹理单元索引
   */
  bind(slot: number): void,

  /**
   * 解绑纹理
   */
  unbind(): void,

  /**
   * 更新纹理数据
   * @param data - 纹理数据
   * @param x - x偏移量
   * @param y - y偏移量
   * @param width - 更新区域宽度
   * @param height - 更新区域高度
   * @param level - mipmap级别
   */
  update(data: ArrayBufferView | HTMLImageElement | HTMLCanvasElement | ImageBitmap,
    x?: number, y?: number, width?: number, height?: number, level?: number): void,

  /**
   * 更新立方体贴图面数据
   * @param face - 立方体贴图面索引(0-5)
   * @param data - 纹理数据
   * @param level - mipmap级别
   */
  updateCubeFace(face: number, data: ArrayBufferView | HTMLImageElement | HTMLCanvasElement | ImageBitmap, level?: number): void,

  /**
   * 生成mipmap
   */
  generateMipmap(): void,

  /**
   * 设置纹理过滤模式
   * @param minFilter - 缩小过滤
   * @param magFilter - 放大过滤
   */
  setFiltering(minFilter: TextureFilter, magFilter: TextureFilter): void,

  /**
   * 设置纹理环绕模式
   * @param wrapS - 水平环绕模式
   * @param wrapT - 垂直环绕模式
   */
  setWrapping(wrapS: TextureAddressMode, wrapT: TextureAddressMode): void,

  /**
   * 设置各向异性过滤级别
   * @param value - 各向异性级别
   */
  setAnisotropy(value: number): void,

  /**
   * 获取纹理数据
   * @param buffer - 目标缓冲区，如果不提供则创建新的
   * @returns 纹理数据
   */
  getData(buffer?: ArrayBufferView): ArrayBufferView,

  /**
   * 销毁纹理
   */
  destroy(): void,
}