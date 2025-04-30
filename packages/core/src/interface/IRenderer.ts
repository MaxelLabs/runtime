import type { IRenderTarget } from './IRenderTarget';
import type { IRenderState } from './IRenderState';
import type { Matrix4, Color } from '@maxellabs/math';
import type { Scene } from '../scene/scene';
import type { Camera } from '../camera/camera';
import type { IRenderStats } from './IRenderStats';
import type { PrimitiveType } from './constants';

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
 * 渲染器接口 - 定义渲染器的基本渲染操作
 */
export interface IRenderer {
  /**
   * 画布宽度
   */
  width: number,

  /**
   * 画布高度
   */
  height: number,

  /**
   * 像素比率
   */
  pixelRatio: number,

  /**
   * 是否已初始化
   */
  isInitialized: boolean,

  /**
   * 默认清屏颜色
   */
  clearColor: Color,

  /**
   * 初始化渲染器
   * @param canvas - WebGL画布
   * @param options - 渲染器选项
   */
  create(canvas: HTMLCanvasElement, options?: RendererOptions): void,

  /**
   * 销毁渲染器
   */
  destroy(): void,

  /**
   * 设置视口大小
   * @param width - 宽度
   * @param height - 高度
   */
  setViewport(width: number, height: number): void,

  /**
   * 设置剪裁区域
   * @param x - 左上角x坐标
   * @param y - 左上角y坐标
   * @param width - 宽度
   * @param height - 高度
   */
  setScissor(x: number, y: number, width: number, height: number): void,

  /**
   * 清除画布
   * @param color - 清除颜色
   */
  clear(color?: Color): void,

  /**
   * 设置变换矩阵
   * @param matrix - 变换矩阵
   */
  setTransform(matrix: Matrix4): void,

  /**
   * 绘制
   * @param primitiveType - 图元类型
   * @param count - 顶点数量
   * @param offset - 偏移量
   */
  draw(primitiveType: PrimitiveType, count: number, offset?: number): void,

  /**
   * 使用索引绘制
   * @param primitiveType - 图元类型
   * @param count - 索引数量
   * @param offset - 偏移量
   */
  drawIndexed(primitiveType: PrimitiveType, count: number, offset?: number): void,

  /**
   * 实例化绘制
   * @param primitiveType - 图元类型
   * @param count - 顶点数量
   * @param instanceCount - 实例数量
   * @param offset - 偏移量
   */
  drawInstanced(primitiveType: PrimitiveType, count: number, instanceCount: number, offset?: number): void,

  /**
   * 实例化索引绘制
   * @param primitiveType - 图元类型
   * @param count - 索引数量
   * @param instanceCount - 实例数量
   * @param offset - 偏移量
   */
  drawIndexedInstanced(primitiveType: PrimitiveType, count: number, instanceCount: number, offset?: number): void,

  /**
   * 设置当前渲染目标
   * @param renderTarget - 渲染目标，null表示默认帧缓冲
   */
  setRenderTarget(renderTarget: IRenderTarget | null): void,

  /**
   * 获取渲染状态管理对象
   */
  getRenderState(): IRenderState,

  /**
   * 渲染场景
   * @param scene - 场景对象
   * @param camera - 相机对象
   */
  renderScene(scene: Scene, camera: Camera): void,

  /**
   * 获取渲染统计信息
   */
  getStats(): IRenderStats,

  /**
   * 检查是否支持某项渲染特性
   * @param feature - 特性标志
   */
  isFeatureSupported(feature: RendererFeature): boolean,

  /**
   * 截取当前渲染结果
   * @returns 包含渲染结果的ImageData对象
   */
  captureFrame(): ImageData,

  /**
   * 重置渲染器内部状态
   */
  resetState(): void,

  /**
   * 重设渲染器大小
   * @param width - 新宽度
   * @param height - 新高度
   * @param updateStyle - 是否同时更新画布样式
   */
  resize(width: number, height: number, updateStyle?: boolean): void,

  /**
   * 绘制单个直线
   * @param x1 - 起点x
   * @param y1 - 起点y
   * @param x2 - 终点x
   * @param y2 - 终点y
   * @param color - 线条颜色
   * @param lineWidth - 线条宽度
   */
  drawLine(x1: number, y1: number, x2: number, y2: number, color: Color, lineWidth?: number): void,

  /**
   * 绘制矩形
   * @param x - 左上角x
   * @param y - 左上角y
   * @param width - 宽度
   * @param height - 高度
   * @param color - 颜色
   * @param filled - 是否填充
   */
  drawRect(x: number, y: number, width: number, height: number, color: Color, filled?: boolean): void,

  /**
   * 绘制圆形
   * @param x - 中心x
   * @param y - 中心y
   * @param radius - 半径
   * @param color - 颜色
   * @param filled - 是否填充
   * @param segments - 分段数
   */
  drawCircle(x: number, y: number, radius: number, color: Color, filled?: boolean, segments?: number): void,

  /**
   * 绘制文本
   * @param text - 文本内容
   * @param x - 位置x
   * @param y - 位置y
   * @param options - 文本选项(字体、颜色等)
   */
  drawText(text: string, x: number, y: number, options?: any): void,
}