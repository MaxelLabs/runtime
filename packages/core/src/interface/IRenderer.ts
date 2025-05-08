import type { Color } from '@maxellabs/math';
import type { Scene } from '../scene/Scene';
import type { Camera } from '../camera/Camera';
import type { IRHIDevice } from './rhi';
import type { IRenderStats } from './IRenderStats';

/**
 * 渲染器能力标志
 */
export enum RendererFeature {
  /**
   * 支持实例化渲染
   */
  INSTANCING = 'instancing',

  /**
   * 支持多渲染目标
   */
  MULTIPLE_RENDER_TARGETS = 'multipleRenderTargets',

  /**
   * 支持深度纹理
   */
  DEPTH_TEXTURE = 'depthTexture',

  /**
   * 支持浮点纹理
   */
  FLOAT_TEXTURE = 'floatTexture',

  /**
   * 支持半浮点纹理
   */
  HALF_FLOAT_TEXTURE = 'halfFloatTexture',

  /**
   * 支持各向异性过滤
   */
  ANISOTROPIC_FILTERING = 'anisotropicFiltering',

  /**
   * 支持顶点数组对象
   */
  VERTEX_ARRAY_OBJECT = 'vertexArrayObject',

  /**
   * 支持S3TC纹理压缩
   */
  S3TC_TEXTURE_COMPRESSION = 's3tcTextureCompression',

  /**
   * 支持ASTC纹理压缩
   */
  ASTC_TEXTURE_COMPRESSION = 'astcTextureCompression',

  /**
   * 支持ETC2纹理压缩
   */
  ETC2_TEXTURE_COMPRESSION = 'etc2TextureCompression',

  /**
   * 支持多视图渲染
   */
  MULTIVIEW = 'multiview',

  /**
   * 支持计算着色器
   */
  COMPUTE_SHADER = 'computeShader'
}

/**
 * 渲染器配置选项
 */
export interface RendererOptions {
  /**
   * 目标画布
   */
  canvas: HTMLCanvasElement,

  /**
   * 渲染宽度
   */
  width?: number,

  /**
   * 渲染高度
   */
  height?: number,

  /**
   * 清屏颜色
   */
  clearColor?: Color,

  /**
   * 是否启用抗锯齿
   */
  antialias?: boolean,

  /**
   * 是否开启Alpha透明
   */
  alpha?: boolean,

  /**
   * 是否保留绘图缓冲区
   */
  preserveDrawingBuffer?: boolean,

  /**
   * 是否启用深度测试
   */
  depth?: boolean,

  /**
   * 是否启用模板测试
   */
  stencil?: boolean,

  /**
   * 是否使用高性能模式
   */
  powerPreference?: 'default' | 'high-performance' | 'low-power',

  /**
   * 像素比率
   */
  pixelRatio?: number,
}

/**
 * 渲染器（管线）配置选项
 */
export interface RendererPipelineOptions {
  /**
   * 目标画布
   */
  canvas: HTMLCanvasElement,

  /**
   * 可选的，外部传入已初始化的Device实例
   */
  graphicsDevice?: IRHIDevice,

  /**
   * 渲染宽度
   */
  width?: number,

  /**
   * 渲染高度
   */
  height?: number,

  /**
   * 像素比率
   */
  pixelRatio?: number,

  /**
   * 是否启用抗锯齿 (传递给 GraphicsDevice 初始化)
   */
  antialias?: boolean,

  /**
   * 是否开启Alpha透明 (传递给 GraphicsDevice 初始化)
   */
  alpha?: boolean,

  /**
   * 是否启用深度测试 (传递给 GraphicsDevice 初始化)
   */
  depth?: boolean,

  /**
   * 是否启用模板测试 (传递给 GraphicsDevice 初始化)
   */
  stencil?: boolean,

  /**
   * 是否使用高性能模式 (传递给 GraphicsDevice 初始化)
   */
  powerPreference?: 'default' | 'high-performance' | 'low-power',
}

/**
 * 高层渲染管线接口
 * 负责协调整个场景的渲染流程。
 */
export interface IRenderer {
  /**
   * 底层图形设备实例
   */
  readonly graphicsDevice: IRHIDevice,

  /**
   * 当前渲染宽度
   */
  readonly width: number,

  /**
   * 当前渲染高度
   */
  readonly height: number,

  /**
   * 当前像素比率
   */
  readonly pixelRatio: number,

  /**
   * 是否已初始化
   */
  readonly isInitialized: boolean,

  /**
   * 初始化渲染管线和底层图形设备（如果未提供）。
   * @param options - 初始化选项
   * @returns 返回一个 Promise，表示初始化是否成功。
   */
  initialize(options: RendererPipelineOptions): Promise<boolean>,

  /**
   * 销毁渲染管线及管理的资源，包括底层图形设备（如果是由本管线创建的）。
   */
  destroy(): void,

  /**
   * 渲染指定的场景和相机。
   * 这是渲染管线的主要入口点。
   * @param scene - 需要渲染的场景。
   * @param camera - 用于渲染的相机。
   */
  render(scene: Scene, camera: Camera): void,

  /**
   * 当渲染目标（如画布）的尺寸发生变化时调用。
   * @param width - 新的宽度。
   * @param height - 新的高度。
   */
  resize(width: number, height: number): void,

  /**
   * 设置默认的清屏颜色。
   * 这个颜色会在调用 graphicsDevice.clear() 且未指定特定颜色时使用。
   * @param color - 清屏颜色。
   * @param alpha - 透明度。
   */
  setClearColor(color: Color, alpha?: number): void,

  /**
   * 获取当前的渲染统计信息。
   */
  getStats(): IRenderStats,

  /**
   * 截取当前渲染结果。
   * 具体实现会依赖 IRHIDevice。
   * @returns 包含渲染结果的ImageData对象 Promise。
   */
  captureFrame(): Promise<ImageData>,
}