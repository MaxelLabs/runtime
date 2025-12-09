import { MSpec } from '@maxellabs/core';

/**
 * WebGL工具类，提供格式转换和辅助功能
 */
export class WebGLUtils {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private isWebGL2: boolean;
  /**
   * webgl扩展
   * @see https://registry.khronos.org/webgl/extensions/
   */
  extension: Record<string, any>;

  /**
   * 创建WebGL工具类
   *
   * @param gl WebGL上下文
   * @param extension 已请求的WebGL扩展对象
   */
  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext, extension?: Record<string, any>) {
    this.gl = gl;
    this.isWebGL2 = gl instanceof WebGL2RenderingContext;
    this.extension = extension || {};

    // 如果没有提供扩展，尝试加载常用扩展
    if (!extension) {
      this.loadCommonExtensions();
    }
  }

  /**
   * 加载常用的WebGL扩展
   * 注意：这不会覆盖已有的扩展
   */
  private loadCommonExtensions(): void {
    const gl = this.gl;
    const commonExtensions = [
      // 纹理相关扩展
      'OES_texture_float',
      'OES_texture_half_float',
      'OES_texture_float_linear',
      'OES_texture_half_float_linear',
      'EXT_color_buffer_float',
      'EXT_color_buffer_half_float',
      'WEBGL_depth_texture',
      'EXT_texture_filter_anisotropic',
      'EXT_texture_border_clamp',
      // 压缩纹理扩展
      'WEBGL_compressed_texture_s3tc',
      'WEBGL_compressed_texture_astc',
      'WEBGL_compressed_texture_etc',
      'WEBGL_compressed_texture_etc1',
      'WEBGL_compressed_texture_pvrtc',
      // 渲染相关扩展
      'EXT_blend_minmax',
      'EXT_frag_depth',
      'EXT_shader_texture_lod',
      'EXT_shadow_samplers',
      'OES_standard_derivatives',
      'OES_element_index_uint',
      'OES_vertex_array_object',
      'ANGLE_instanced_arrays',
      'EXT_disjoint_timer_query',
    ];

    for (const extName of commonExtensions) {
      if (!this.extension[extName]) {
        const ext = gl.getExtension(extName);

        if (ext) {
          this.extension[extName] = ext;
        }
      }
    }
  }

  /**
   * 获取指定名称的WebGL扩展
   * 如果扩展已经加载，则直接返回；否则尝试加载
   *
   * @param name 扩展名称
   * @returns 扩展对象或null（如果不可用）
   */
  getExtension(name: string): any {
    if (this.extension[name]) {
      return this.extension[name];
    }

    const ext = this.gl.getExtension(name);

    if (ext) {
      this.extension[name] = ext;
    }

    return ext;
  }

  /**
   * 转换RHI纹理格式到WebGL内部格式
   *
   * 增强的降级策略：
   * 1. 对于浮点纹理，如果不支持将降级为最近的可用格式，而不总是降级为RGBA8
   * 2. 对于深度纹理，提供更好的降级选项
   * 3. 增加详细的调试信息，帮助理解降级原因
   */
  textureFormatToGL(format: MSpec.RHITextureFormat): {
    internalFormat: number;
    format: number;
    type: number;
  } {
    const gl = this.gl;

    // 默认值
    let result: {
      internalFormat: number;
      format: number;
      type: number;
    } = {
      internalFormat: gl.RGBA,
      format: gl.RGBA,
      type: gl.UNSIGNED_BYTE,
    };

    // 检查无效输入
    if (format === undefined || format === null) {
      console.warn('textureFormatToGL: 无效的纹理格式，使用默认RGBA格式');

      return result;
    }

    // 根据RHI格式查找对应的WebGL格式
    switch (format) {
      case MSpec.RHITextureFormat.R8_UNORM:
        if (this.isWebGL2) {
          result = {
            internalFormat: (gl as WebGL2RenderingContext).R8,
            format: (gl as WebGL2RenderingContext).RED,
            type: gl.UNSIGNED_BYTE,
          };
        } else {
          // WebGL1降级：使用LUMINANCE作为单通道纹理
          result = {
            internalFormat: gl.LUMINANCE,
            format: gl.LUMINANCE,
            type: gl.UNSIGNED_BYTE,
          };
        }

        break;
      case MSpec.RHITextureFormat.RG8_UNORM:
        if (this.isWebGL2) {
          result = {
            internalFormat: (gl as WebGL2RenderingContext).RG8,
            format: (gl as WebGL2RenderingContext).RG,
            type: gl.UNSIGNED_BYTE,
          };
        } else {
          // WebGL1降级：使用LUMINANCE_ALPHA作为双通道纹理
          result = {
            internalFormat: gl.LUMINANCE_ALPHA,
            format: gl.LUMINANCE_ALPHA,
            type: gl.UNSIGNED_BYTE,
          };
        }

        break;
      case MSpec.RHITextureFormat.RGBA8_UNORM:
        if (this.isWebGL2) {
          result = {
            internalFormat: (gl as WebGL2RenderingContext).RGBA8,
            format: gl.RGBA,
            type: gl.UNSIGNED_BYTE,
          };
        } else {
          result = {
            internalFormat: gl.RGBA,
            format: gl.RGBA,
            type: gl.UNSIGNED_BYTE,
          };
        }

        break;
      case MSpec.RHITextureFormat.RGBA16_FLOAT:
        if (this.isWebGL2) {
          result = {
            internalFormat: (gl as WebGL2RenderingContext).RGBA16F,
            format: gl.RGBA,
            type: (gl as WebGL2RenderingContext).HALF_FLOAT,
          };
        } else {
          // WebGL1需要扩展支持
          const halfFloatExt = this.getExtension('OES_texture_half_float');
          const linearFilteringExt = this.getExtension('OES_texture_half_float_linear');

          if (halfFloatExt) {
            result = {
              internalFormat: gl.RGBA,
              format: gl.RGBA,
              type: halfFloatExt.HALF_FLOAT_OES,
            };
            if (!linearFilteringExt) {
              console.warn('OES_texture_half_float_linear扩展不可用，半浮点纹理将不支持线性过滤');
            }
          } else {
            // 尝试使用浮点纹理作为第一降级选项
            return this.tryFloatTextureFormat() || this.defaultRGBA8Format();
          }
        }

        break;
      case MSpec.RHITextureFormat.RGBA32_FLOAT:
        if (this.isWebGL2) {
          result = {
            internalFormat: (gl as WebGL2RenderingContext).RGBA32F,
            format: gl.RGBA,
            type: gl.FLOAT,
          };
        } else {
          // WebGL1需要扩展支持
          const floatTextureExt = this.getExtension('OES_texture_float');
          const linearFilteringExt = this.getExtension('OES_texture_float_linear');

          if (floatTextureExt) {
            result = {
              internalFormat: gl.RGBA,
              format: gl.RGBA,
              type: gl.FLOAT,
            };
            if (!linearFilteringExt) {
              console.warn('OES_texture_float_linear扩展不可用，浮点纹理将不支持线性过滤');
            }
          } else {
            // 尝试使用半浮点纹理作为第一降级选项
            return this.tryHalfFloatTextureFormat() || this.defaultRGBA8Format();
          }
        }

        break;
      case MSpec.RHITextureFormat.DEPTH16_UNORM:
        return this.tryDepthTextureFormat(16) || this.fallbackForDepthTexture();
      case MSpec.RHITextureFormat.DEPTH24_UNORM:
        return this.tryDepthTextureFormat(24) || this.fallbackForDepthTexture();
      case MSpec.RHITextureFormat.DEPTH32_FLOAT:
        return this.tryDepthFloatTextureFormat() || this.tryDepthTextureFormat(24) || this.fallbackForDepthTexture();
      case MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8:
        return this.tryDepthStencilTextureFormat(24) || this.fallbackForDepthTexture();
      case MSpec.RHITextureFormat.DEPTH32_FLOAT_STENCIL8:
        return (
          this.tryDepthFloatStencilTextureFormat() ||
          this.tryDepthStencilTextureFormat(24) ||
          this.fallbackForDepthTexture()
        );
      default:
        console.warn(`未知或不支持的纹理格式: ${format}，使用默认RGBA格式`);

        // 使用默认值
        break;
    }

    return result;
  }

  /**
   * 尝试使用浮点纹理格式
   */
  private tryFloatTextureFormat(): {
    internalFormat: number;
    format: number;
    type: number;
  } | null {
    const gl = this.gl;
    const floatTextureExt = this.getExtension('OES_texture_float');

    if (floatTextureExt) {
      console.warn('半浮点纹理不可用，降级为全浮点纹理');

      return {
        internalFormat: gl.RGBA,
        format: gl.RGBA,
        type: gl.FLOAT,
      };
    }

    return null;
  }

  /**
   * 尝试使用半浮点纹理格式
   */
  private tryHalfFloatTextureFormat(): {
    internalFormat: number;
    format: number;
    type: number;
  } | null {
    const gl = this.gl;
    const halfFloatExt = this.getExtension('OES_texture_half_float');

    if (halfFloatExt) {
      console.warn('浮点纹理不可用，降级为半浮点纹理');

      return {
        internalFormat: gl.RGBA,
        format: gl.RGBA,
        type: halfFloatExt.HALF_FLOAT_OES,
      };
    }

    return null;
  }

  /**
   * 默认的RGBA8格式
   */
  private defaultRGBA8Format(): {
    internalFormat: number;
    format: number;
    type: number;
  } {
    const gl = this.gl;

    console.warn('浮点和半浮点纹理都不可用，降级为8位RGBA');

    return {
      internalFormat: gl.RGBA,
      format: gl.RGBA,
      type: gl.UNSIGNED_BYTE,
    };
  }

  /**
   * 尝试创建深度纹理格式
   */
  private tryDepthTextureFormat(bits: number): {
    internalFormat: number;
    format: number;
    type: number;
  } | null {
    const gl = this.gl;

    if (this.isWebGL2) {
      const format =
        bits === 16
          ? (gl as WebGL2RenderingContext).DEPTH_COMPONENT16
          : (gl as WebGL2RenderingContext).DEPTH_COMPONENT24;

      return {
        internalFormat: format,
        format: gl.DEPTH_COMPONENT,
        type: bits === 16 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT,
      };
    } else {
      // WebGL1需要深度纹理扩展
      const depthTextureExt = this.getExtension('WEBGL_depth_texture');

      if (depthTextureExt) {
        return {
          internalFormat: gl.DEPTH_COMPONENT,
          format: gl.DEPTH_COMPONENT,
          type: bits === 16 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT,
        };
      }
    }

    return null;
  }

  /**
   * 尝试创建浮点深度纹理格式
   */
  private tryDepthFloatTextureFormat(): {
    internalFormat: number;
    format: number;
    type: number;
  } | null {
    const gl = this.gl;

    if (this.isWebGL2) {
      return {
        internalFormat: (gl as WebGL2RenderingContext).DEPTH_COMPONENT32F,
        format: gl.DEPTH_COMPONENT,
        type: gl.FLOAT,
      };
    } else {
      // WebGL1需要深度纹理和浮点纹理扩展
      const depthTextureExt = this.getExtension('WEBGL_depth_texture');
      const floatTextureExt = this.getExtension('OES_texture_float');

      if (depthTextureExt && floatTextureExt) {
        return {
          internalFormat: gl.DEPTH_COMPONENT,
          format: gl.DEPTH_COMPONENT,
          type: gl.FLOAT,
        };
      }
    }

    return null;
  }

  /**
   * 尝试创建深度模板纹理格式
   */
  private tryDepthStencilTextureFormat(depthBits: number): {
    internalFormat: number;
    format: number;
    type: number;
  } | null {
    const gl = this.gl;

    if (this.isWebGL2) {
      return {
        internalFormat: (gl as WebGL2RenderingContext).DEPTH24_STENCIL8,
        format: (gl as WebGL2RenderingContext).DEPTH_STENCIL,
        type: (gl as WebGL2RenderingContext).UNSIGNED_INT_24_8,
      };
    } else {
      // WebGL1需要深度纹理扩展
      const depthTextureExt = this.getExtension('WEBGL_depth_texture');

      if (depthTextureExt) {
        return {
          internalFormat: depthTextureExt.DEPTH_STENCIL,
          format: depthTextureExt.DEPTH_STENCIL,
          type: depthTextureExt.UNSIGNED_INT_24_8_WEBGL,
        };
      }
    }

    return null;
  }

  /**
   * 尝试创建浮点深度模板纹理格式
   */
  private tryDepthFloatStencilTextureFormat(): {
    internalFormat: number;
    format: number;
    type: number;
  } | null {
    const gl = this.gl;

    if (this.isWebGL2) {
      return {
        internalFormat: (gl as WebGL2RenderingContext).DEPTH32F_STENCIL8,
        format: (gl as WebGL2RenderingContext).DEPTH_STENCIL,
        type: (gl as WebGL2RenderingContext).FLOAT_32_UNSIGNED_INT_24_8_REV,
      };
    }

    // WebGL1不支持此格式
    return null;
  }

  /**
   * 当深度纹理不可用时的降级处理
   * 返回一个RGBA格式，开发者可以在着色器中手动实现深度计算
   */
  private fallbackForDepthTexture(): {
    internalFormat: number;
    format: number;
    type: number;
  } {
    console.warn('深度纹理不可用，降级为RGBA格式。可以在着色器中手动模拟深度。');

    // 尝试使用浮点纹理，以获得更好的精度
    const floatResult = this.tryFloatTextureFormat();

    if (floatResult) {
      return floatResult;
    }

    // 最后降级为标准8位RGBA
    return this.defaultRGBA8Format();
  }

  /**
   * 转换RHI寻址模式到WebGL寻址模式
   */
  addressModeToGL(mode: MSpec.RHIAddressMode): GLenum {
    const gl = this.gl;

    switch (mode) {
      case MSpec.RHIAddressMode.REPEAT:
        return gl.REPEAT;
      case MSpec.RHIAddressMode.MIRROR_REPEAT:
        return gl.MIRRORED_REPEAT;
      case MSpec.RHIAddressMode.CLAMP_TO_EDGE:
        return gl.CLAMP_TO_EDGE;
      case MSpec.RHIAddressMode.CLAMP_TO_BORDER: {
        const ext = this.getExtension('EXT_texture_border_clamp');

        return ext ? ext.CLAMP_TO_BORDER_EXT : gl.CLAMP_TO_EDGE;
      }
      default:
        return gl.CLAMP_TO_EDGE;
    }
  }

  /**
   * 转换RHI过滤模式到WebGL过滤模式
   */
  filterModeToGL(mode: MSpec.RHIFilterMode, useMipmap: boolean = false): number {
    const gl = this.gl;

    if (mode === MSpec.RHIFilterMode.NEAREST) {
      return useMipmap ? gl.NEAREST_MIPMAP_NEAREST : gl.NEAREST;
    } else {
      return useMipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR;
    }
  }

  /**
   * 转换RHI比较函数到WebGL比较函数
   */
  compareFunctionToGL(func: MSpec.RHICompareFunction): number {
    const gl = this.gl;

    switch (func) {
      case MSpec.RHICompareFunction.NEVER:
        return gl.NEVER;
      case MSpec.RHICompareFunction.LESS:
        return gl.LESS;
      case MSpec.RHICompareFunction.EQUAL:
        return gl.EQUAL;
      case MSpec.RHICompareFunction.LESS_EQUAL:
        return gl.LEQUAL;
      case MSpec.RHICompareFunction.GREATER:
        return gl.GREATER;
      case MSpec.RHICompareFunction.NOT_EQUAL:
        return gl.NOTEQUAL;
      case MSpec.RHICompareFunction.GREATER_EQUAL:
        return gl.GEQUAL;
      case MSpec.RHICompareFunction.ALWAYS:
        return gl.ALWAYS;
      default:
        return gl.ALWAYS;
    }
  }

  /**
   * 转换RHI顶点格式到WebGL类型
   */
  vertexFormatToGL(format: MSpec.RHIVertexFormat): { type: number; size: number; normalized: boolean } {
    const gl = this.gl;

    switch (format) {
      case MSpec.RHIVertexFormat.FLOAT32:
        return { type: gl.FLOAT, size: 1, normalized: false };
      case MSpec.RHIVertexFormat.FLOAT32x2:
        return { type: gl.FLOAT, size: 2, normalized: false };
      case MSpec.RHIVertexFormat.FLOAT32x3:
        return { type: gl.FLOAT, size: 3, normalized: false };
      case MSpec.RHIVertexFormat.FLOAT32x4:
        return { type: gl.FLOAT, size: 4, normalized: false };
      case MSpec.RHIVertexFormat.UINT8x2:
        return { type: gl.UNSIGNED_BYTE, size: 2, normalized: false };
      case MSpec.RHIVertexFormat.UINT8x4:
        return { type: gl.UNSIGNED_BYTE, size: 4, normalized: false };
      case MSpec.RHIVertexFormat.UNORM8x2:
        return { type: gl.UNSIGNED_BYTE, size: 2, normalized: true };
      case MSpec.RHIVertexFormat.UNORM8x4:
        return { type: gl.UNSIGNED_BYTE, size: 4, normalized: true };
      case MSpec.RHIVertexFormat.SINT8x2:
        return { type: gl.BYTE, size: 2, normalized: false };
      case MSpec.RHIVertexFormat.SINT8x4:
        return { type: gl.BYTE, size: 4, normalized: false };
      case MSpec.RHIVertexFormat.SNORM8x2:
        return { type: gl.BYTE, size: 2, normalized: true };
      case MSpec.RHIVertexFormat.SNORM8x4:
        return { type: gl.BYTE, size: 4, normalized: true };
      case MSpec.RHIVertexFormat.UINT16x2:
        return { type: gl.UNSIGNED_SHORT, size: 2, normalized: false };
      case MSpec.RHIVertexFormat.UINT16x4:
        return { type: gl.UNSIGNED_SHORT, size: 4, normalized: false };
      case MSpec.RHIVertexFormat.SINT16x2:
        return { type: gl.SHORT, size: 2, normalized: false };
      case MSpec.RHIVertexFormat.SINT16x4:
        return { type: gl.SHORT, size: 4, normalized: false };
      default:
        return { type: gl.FLOAT, size: 4, normalized: false };
    }
  }

  /**
   * 转换RHI混合因子到WebGL混合因子
   */
  blendFactorToGL(factor: MSpec.RHIBlendFactor): number {
    const gl = this.gl;

    switch (factor) {
      case MSpec.RHIBlendFactor.Zero:
        return gl.ZERO;
      case MSpec.RHIBlendFactor.One:
        return gl.ONE;
      case MSpec.RHIBlendFactor.SrcColor:
        return gl.SRC_COLOR;
      case MSpec.RHIBlendFactor.OneMinusSrcColor:
        return gl.ONE_MINUS_SRC_COLOR;
      case MSpec.RHIBlendFactor.DstColor:
        return gl.DST_COLOR;
      case MSpec.RHIBlendFactor.OneMinusDstColor:
        return gl.ONE_MINUS_DST_COLOR;
      case MSpec.RHIBlendFactor.SrcAlpha:
        return gl.SRC_ALPHA;
      case MSpec.RHIBlendFactor.OneMinusSrcAlpha:
        return gl.ONE_MINUS_SRC_ALPHA;
      case MSpec.RHIBlendFactor.DstAlpha:
        return gl.DST_ALPHA;
      case MSpec.RHIBlendFactor.OneMinusDstAlpha:
        return gl.ONE_MINUS_DST_ALPHA;
      case MSpec.RHIBlendFactor.ConstantColor:
        return gl.CONSTANT_COLOR;
      case MSpec.RHIBlendFactor.OneMinusConstantColor:
        return gl.ONE_MINUS_CONSTANT_COLOR;
      case MSpec.RHIBlendFactor.ConstantAlpha:
        return gl.CONSTANT_ALPHA;
      case MSpec.RHIBlendFactor.OneMinusConstantAlpha:
        return gl.ONE_MINUS_CONSTANT_ALPHA;
      case MSpec.RHIBlendFactor.SrcAlphaSaturate:
        return gl.SRC_ALPHA_SATURATE;
      default:
        return gl.ONE;
    }
  }

  /**
   * 转换RHI混合操作到WebGL混合等式
   */
  blendOperationToGL(operation: MSpec.RHIBlendOperation): number {
    const gl = this.gl;

    switch (operation) {
      case MSpec.RHIBlendOperation.ADD:
        return gl.FUNC_ADD;
      case MSpec.RHIBlendOperation.SUBTRACT:
        return gl.FUNC_SUBTRACT;
      case MSpec.RHIBlendOperation.REVERSE_SUBTRACT:
        return gl.FUNC_REVERSE_SUBTRACT;
      case MSpec.RHIBlendOperation.MIN: {
        const minExt = this.extension['EXT_blend_minmax'];

        return minExt ? minExt.MIN_EXT : gl.FUNC_ADD;
      }
      case MSpec.RHIBlendOperation.MAX: {
        const maxExt = this.extension['EXT_blend_minmax'];

        return maxExt ? maxExt.MAX_EXT : gl.FUNC_ADD;
      }
      default:
        return gl.FUNC_ADD;
    }
  }

  /**
   * 转换RHI图元类型到WebGL图元类型
   */
  primitiveTopologyToGL(topology: MSpec.RHIPrimitiveTopology): number {
    const gl = this.gl;

    switch (topology) {
      case MSpec.RHIPrimitiveTopology.POINT_LIST:
        return gl.POINTS;
      case MSpec.RHIPrimitiveTopology.LINE_LIST:
        return gl.LINES;
      case MSpec.RHIPrimitiveTopology.LINE_STRIP:
        return gl.LINE_STRIP;
      case MSpec.RHIPrimitiveTopology.TRIANGLE_LIST:
        return gl.TRIANGLES;
      case MSpec.RHIPrimitiveTopology.TRIANGLE_STRIP:
        return gl.TRIANGLE_STRIP;
      default:
        return gl.TRIANGLES;
    }
  }

  /**
   * 转换RHI剔除模式到WebGL剔除模式
   */
  cullModeToGL(mode: MSpec.RHICullMode): { enable: boolean; mode: number } {
    const gl = this.gl;

    switch (mode) {
      case MSpec.RHICullMode.NONE:
        return { enable: false, mode: gl.BACK };
      case MSpec.RHICullMode.FRONT:
        return { enable: true, mode: gl.FRONT };
      case MSpec.RHICullMode.BACK:
        return { enable: true, mode: gl.BACK };
      default:
        return { enable: false, mode: gl.BACK };
    }
  }

  /**
   * 转换RHI正面方向到WebGL正面方向
   */
  frontFaceToGL(face: MSpec.RHIFrontFace): number {
    const gl = this.gl;

    return face === MSpec.RHIFrontFace.CW ? gl.CW : gl.CCW;
  }

  /**
   * 转换RHI模板操作到WebGL
   */
  stencilOperationToGL(operation: MSpec.RHIStencilOperation): number {
    const gl = this.gl;

    switch (operation) {
      case MSpec.RHIStencilOperation.KEEP:
        return gl.KEEP;
      case MSpec.RHIStencilOperation.ZERO:
        return gl.ZERO;
      case MSpec.RHIStencilOperation.REPLACE:
        return gl.REPLACE;
      case MSpec.RHIStencilOperation.INCR_CLAMP:
        return gl.INCR;
      case MSpec.RHIStencilOperation.DECR_CLAMP:
        return gl.DECR;
      case MSpec.RHIStencilOperation.INVERT:
        return gl.INVERT;
      case MSpec.RHIStencilOperation.INCR_WRAP:
        return gl.INCR_WRAP;
      case MSpec.RHIStencilOperation.DECR_WRAP:
        return gl.DECR_WRAP;
      default:
        return gl.KEEP;
    }
  }
}
