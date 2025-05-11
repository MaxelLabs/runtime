import type { IRHITexture, IRHITextureView, RHITextureFormat } from '@maxellabs/core';
import type { GLTexture } from './GLTexture';

/**
 * WebGL纹理视图实现
 *
 * 注意：由于WebGL本身不支持纹理视图概念，这个实现是对纹理的逻辑封装，
 * 提供了对纹理特定部分（如特定MIP级别或数组层）的概念访问，
 * 但底层仍然使用同一个纹理对象。
 *
 * 使用示例：
 * 1. 创建深度纹理的颜色视图（用于可视化深度）：
 *    ```
 *    const depthTexture = new GLTexture(gl, depthDescriptor);
 *    const colorView = depthTexture.createView(RHITextureFormat.RGBA8_UNORM);
 *    ```
 *
 * 2. 创建立方体贴图的单面视图：
 *    ```
 *    const cubeTexture = new GLTexture(gl, cubeDescriptor);
 *    const singleFaceView = cubeTexture.createView(undefined, '2d', 0, undefined, faceIndex);
 *    ```
 *
 * 3. 创建特定mipmap级别的视图：
 *    ```
 *    const texture = new GLTexture(gl, descriptor);
 *    const mipView = texture.createView(undefined, undefined, 2, 1); // 只使用第2级mip
 *    ```
 */
export class WebGLTextureView implements IRHITextureView {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  readonly texture: IRHITexture;
  format: RHITextureFormat;
  dimension: '1d' | '2d' | '3d' | 'cube' | '2d-array' | 'cube-array';
  baseMipLevel: number;
  mipLevelCount: number;
  baseArrayLayer: number;
  arrayLayerCount: number;
  label?: string;
  private isDestroyed = false;

  /**
   * 创建WebGL纹理视图
   *
   * @param gl WebGL上下文
   * @param descriptor 纹理视图描述符
   */
  constructor (gl: WebGLRenderingContext | WebGL2RenderingContext, descriptor: {
    texture: IRHITexture,
    format?: RHITextureFormat,
    dimension?: '1d' | '2d' | '3d' | 'cube' | '2d-array' | 'cube-array',
    baseMipLevel?: number,
    mipLevelCount?: number,
    baseArrayLayer?: number,
    arrayLayerCount?: number,
    label?: string,
  }) {
    this.gl = gl;
    this.texture = descriptor.texture;

    const {
      format,
      dimension,
      baseMipLevel = 0,
      mipLevelCount,
      baseArrayLayer = 0,
      arrayLayerCount,
      label,
    } = descriptor;

    // 获取源纹理的属性
    const sourceTexture = this.texture as GLTexture;
    const sourceFormat = sourceTexture.getFormat();
    const sourceDimension = sourceTexture.getDimension();
    const sourceMipLevelCount = sourceTexture.getMipLevelCount();
    const sourceDepthOrArrayLayers = sourceTexture.getDepthOrArrayLayers();

    // 初始化视图属性
    this.format = format !== undefined ? format : sourceFormat;
    this.dimension = dimension !== undefined ? dimension : sourceDimension;
    this.baseMipLevel = baseMipLevel;

    // 正确处理mipLevelCount，确保不会因为传入0而跳转到默认逻辑
    this.mipLevelCount = mipLevelCount !== undefined
      ? mipLevelCount
      : (sourceMipLevelCount - this.baseMipLevel);

    this.baseArrayLayer = baseArrayLayer;

    // 正确处理arrayLayerCount，确保不会因为传入0而跳转到默认逻辑
    this.arrayLayerCount = arrayLayerCount !== undefined
      ? arrayLayerCount
      : (sourceDepthOrArrayLayers - this.baseArrayLayer);

    this.label = label;

    // 验证视图参数
    this.validateParameters(sourceMipLevelCount, sourceDepthOrArrayLayers, sourceDimension);
  }

  /**
   * 验证视图参数
   *
   * @param sourceMipLevelCount 源纹理的MIP级别数
   * @param sourceDepthOrArrayLayers 源纹理的深度或数组层数
   */
  private validateParameters (sourceMipLevelCount: number, sourceDepthOrArrayLayers: number, sourceDimension: '1d' | '2d' | '3d' | 'cube' | '2d-array' | 'cube-array'): void {
    // 检查mip级别范围
    if (this.baseMipLevel < 0 || this.baseMipLevel >= sourceMipLevelCount) {
      throw new Error(`基础MIP级别 ${this.baseMipLevel} 超出源纹理的有效范围 [0, ${sourceMipLevelCount - 1}]`);
    }

    if (this.baseMipLevel + this.mipLevelCount > sourceMipLevelCount) {
      throw new Error(`MIP级别范围 [${this.baseMipLevel}, ${this.baseMipLevel + this.mipLevelCount - 1}] 超出源纹理的MIP级别范围 [0, ${sourceMipLevelCount - 1}]`);
    }

    // 检查数组层范围
    if (this.baseArrayLayer < 0 || this.baseArrayLayer >= sourceDepthOrArrayLayers) {
      throw new Error(`基础数组层 ${this.baseArrayLayer} 超出源纹理的有效范围 [0, ${sourceDepthOrArrayLayers - 1}]`);
    }

    if (this.baseArrayLayer + this.arrayLayerCount > sourceDepthOrArrayLayers) {
      throw new Error(`数组层范围 [${this.baseArrayLayer}, ${this.baseArrayLayer + this.arrayLayerCount - 1}] 超出源纹理的数组层范围 [0, ${sourceDepthOrArrayLayers - 1}]`);
    }

    // 检查维度与源纹理兼容性
    if (this.dimension === 'cube' && sourceDimension !== 'cube') {
      throw new Error('不能从非立方体纹理创建立方体纹理视图');
    }

    if (this.dimension === '3d' && sourceDimension !== '3d') {
      throw new Error('不能从非3D纹理创建3D纹理视图');
    }

    // 检查2D数组和立方体数组视图（WebGL2特性）
    if ((this.dimension === '2d-array' || this.dimension === 'cube-array') &&
        !(this.gl instanceof WebGL2RenderingContext)) {
      throw new Error(`WebGL1不支持${this.dimension}纹理视图`);
    }
  }

  /**
   * 获取源纹理
   */
  getTexture (): IRHITexture {
    return this.texture;
  }

  /**
   * 获取视图格式
   */
  getFormat (): RHITextureFormat {
    return this.format;
  }

  /**
   * 获取视图维度
   */
  getDimension (): '1d' | '2d' | '3d' | 'cube' | '2d-array' | 'cube-array' {
    return this.dimension;
  }

  /**
   * 获取基础MIP级别
   */
  getBaseMipLevel (): number {
    return this.baseMipLevel;
  }

  /**
   * 获取MIP级别数
   */
  getMipLevelCount (): number {
    return this.mipLevelCount;
  }

  /**
   * 获取基础数组层
   */
  getBaseArrayLayer (): number {
    return this.baseArrayLayer;
  }

  /**
   * 获取数组层数
   */
  getArrayLayerCount (): number {
    return this.arrayLayerCount;
  }

  /**
   * 获取视图标签
   */
  getLabel (): string | undefined {
    return this.label;
  }

  /**
   * 获取原始WebGL纹理对象
   *
   * 注意：WebGL没有单独的纹理视图概念，WebGLTextureView仅提供逻辑上的视图。
   * 在实际使用时，仍然使用原始纹理，需要调用方确保使用正确的参数（如mipLevel、faceIndex等）
   * 来访问视图指定的部分。
   *
   * 示例：渲染到特定立方体面或特定mip级别时，需要手动设置正确的目标和级别：
   * ```
   * const faceIndex = textureView.getBaseArrayLayer();
   * const mipLevel = textureView.getBaseMipLevel();
   * gl.framebufferTexture2D(
   *   gl.FRAMEBUFFER,
   *   gl.COLOR_ATTACHMENT0,
   *   gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex,
   *   textureView.getGLTexture(),
   *   mipLevel
   * );
   * ```
   */
  getGLTexture (): WebGLTexture | null {
    return (this.texture as GLTexture).getGLTexture();
  }

  /**
   * 获取WebGL纹理目标
   *
   * 注意：对于立方体贴图的2D视图，应该使用 TEXTURE_CUBE_MAP_POSITIVE_X + baseArrayLayer
   * 作为实际的目标，而不是这个方法返回的目标。
   */
  getGLTextureTarget (): number {
    // 特殊处理：立方体贴图的2D视图
    if (this.dimension === '2d' && (this.texture as GLTexture).getDimension() === 'cube') {
      const gl = this.gl;

      return gl.TEXTURE_CUBE_MAP_POSITIVE_X + this.baseArrayLayer;
    }

    return (this.texture as GLTexture).getTarget();
  }

  /**
   * 帮助方法：获取用于帧缓冲附件的适当目标
   *
   * 这个方法简化了将纹理视图附加到帧缓冲时的逻辑，自动处理立方体贴图面的选择等。
   */
  getFramebufferTarget (): number {
    const sourceTexture = this.texture as GLTexture;
    const sourceDimension = sourceTexture.getDimension();
    const gl = this.gl;

    if (sourceDimension === 'cube') {
      // 立方体贴图特殊处理
      if (this.dimension === '2d') {
        // 单个立方体面视图
        return gl.TEXTURE_CUBE_MAP_POSITIVE_X + this.baseArrayLayer;
      }

      return gl.TEXTURE_CUBE_MAP;
    }

    // 其他情况使用原始目标
    return sourceTexture.getTarget();
  }

  /**
   * 销毁资源
   * 注意：WebGL纹理视图不拥有底层资源，销毁视图不会销毁底层纹理
   */
  destroy (): void {
    if (this.isDestroyed) {
      return;
    }

    // 标记为已销毁
    this.isDestroyed = true;
  }
}