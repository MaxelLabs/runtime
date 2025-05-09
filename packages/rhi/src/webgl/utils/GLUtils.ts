import {
  RHITextureFormat,
  RHIAddressMode,
  RHIFilterMode,
  RHICompareFunction,
  RHIVertexFormat,
  RHIBlendFactor,
  RHIBlendOperation,
  RHIPrimitiveTopology,
  RHICullMode,
  RHIFrontFace,
  RHIStencilOperation,
} from '@maxellabs/core';

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

  constructor (gl: WebGLRenderingContext | WebGL2RenderingContext, extension?: Record<string, any>) {
    this.gl = gl;
    this.isWebGL2 = gl instanceof WebGL2RenderingContext;
    this.extension = extension || {};
  }

  /**
   * 转换RHI纹理格式到WebGL内部格式
   */
  textureFormatToGL (format: RHITextureFormat): {
    internalFormat: number,
    format: number,
    type: number,
  } {
    const gl = this.gl;

    // 默认值
    let result: {
      internalFormat: number,
      format: number,
      type: number,
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

    switch (format) {
      case RHITextureFormat.R8_UNORM:
        result = {
          internalFormat: this.isWebGL2 ? (gl as WebGL2RenderingContext).R8 : gl.LUMINANCE,
          format: this.isWebGL2 ? (gl as WebGL2RenderingContext).RED : gl.LUMINANCE,
          type: gl.UNSIGNED_BYTE,
        };

        break;
      case RHITextureFormat.RG8_UNORM:
        result = {
          internalFormat: this.isWebGL2 ? (gl as WebGL2RenderingContext).RG8 : gl.LUMINANCE_ALPHA,
          format: this.isWebGL2 ? (gl as WebGL2RenderingContext).RG : gl.LUMINANCE_ALPHA,
          type: gl.UNSIGNED_BYTE,
        };

        break;
      case RHITextureFormat.RGBA8_UNORM:
        result = {
          internalFormat: this.isWebGL2 ? (gl as WebGL2RenderingContext).RGBA8 : gl.RGBA,
          format: gl.RGBA,
          type: gl.UNSIGNED_BYTE,
        };

        break;
      case RHITextureFormat.RGBA16_FLOAT:
        if (this.isWebGL2) {
          result = {
            internalFormat: (gl as WebGL2RenderingContext).RGBA16F,
            format: gl.RGBA,
            type: (gl as WebGL2RenderingContext).HALF_FLOAT,
          };
        } else {
          // WebGL1需要扩展支持
          const halfFloatExt = this.extension['OES_texture_half_float'];

          if (halfFloatExt) {
            result = {
              internalFormat: gl.RGBA,
              format: gl.RGBA,
              type: halfFloatExt.HALF_FLOAT_OES,
            };
          } else {
            console.warn('OES_texture_half_float扩展不可用，降级为UNSIGNED_BYTE');
            // 降级为8位RGBA
            result = {
              internalFormat: gl.RGBA,
              format: gl.RGBA,
              type: gl.UNSIGNED_BYTE,
            };
          }
        }

        break;
      case RHITextureFormat.RGBA32_FLOAT:
        if (this.isWebGL2) {
          result = {
            internalFormat: (gl as WebGL2RenderingContext).RGBA32F,
            format: gl.RGBA,
            type: gl.FLOAT,
          };
        } else {
          // WebGL1需要扩展支持
          const floatTextureExt = this.extension['OES_texture_float'];

          if (floatTextureExt) {
            result = {
              internalFormat: gl.RGBA,
              format: gl.RGBA,
              type: gl.FLOAT,
            };
          } else {
            console.warn('OES_texture_float扩展不可用，降级为UNSIGNED_BYTE');
            // 降级为8位RGBA
            result = {
              internalFormat: gl.RGBA,
              format: gl.RGBA,
              type: gl.UNSIGNED_BYTE,
            };
          }
        }

        break;
      case RHITextureFormat.DEPTH16_UNORM:
        if (this.isWebGL2) {
          result = {
            internalFormat: (gl as WebGL2RenderingContext).DEPTH_COMPONENT16,
            format: gl.DEPTH_COMPONENT,
            type: gl.UNSIGNED_SHORT,
          };
        } else {
          // WebGL1需要深度纹理扩展
          const depthTextureExt = this.extension['WEBGL_depth_texture'];

          if (depthTextureExt) {
            result = {
              internalFormat: gl.DEPTH_COMPONENT,
              format: gl.DEPTH_COMPONENT,
              type: gl.UNSIGNED_SHORT,
            };
          } else {
            console.warn('WEBGL_depth_texture扩展不可用，无法使用深度纹理');
            // 无法降级深度纹理，返回错误的格式以便调用者可以检测
            result = {
              internalFormat: gl.RGBA,
              format: gl.RGBA,
              type: gl.UNSIGNED_BYTE,
            };
          }
        }

        break;
      case RHITextureFormat.DEPTH24_UNORM:
        if (this.isWebGL2) {
          result = {
            internalFormat: (gl as WebGL2RenderingContext).DEPTH_COMPONENT24,
            format: gl.DEPTH_COMPONENT,
            type: gl.UNSIGNED_INT,
          };
        } else {
          // WebGL1需要深度纹理扩展
          const depthTextureExt = this.extension['WEBGL_depth_texture'];

          if (depthTextureExt) {
            result = {
              internalFormat: gl.DEPTH_COMPONENT,
              format: gl.DEPTH_COMPONENT,
              type: gl.UNSIGNED_INT,
            };
          } else {
            console.warn('WEBGL_depth_texture扩展不可用，无法使用深度纹理');
            result = {
              internalFormat: gl.RGBA,
              format: gl.RGBA,
              type: gl.UNSIGNED_BYTE,
            };
          }
        }

        break;
      case RHITextureFormat.DEPTH32_FLOAT:
        if (this.isWebGL2) {
          result = {
            internalFormat: (gl as WebGL2RenderingContext).DEPTH_COMPONENT32F,
            format: gl.DEPTH_COMPONENT,
            type: gl.FLOAT,
          };
        } else {
          // WebGL1需要深度纹理和浮点纹理扩展
          const depthTextureExt = this.extension['WEBGL_depth_texture'];
          const floatTextureExt = this.extension['OES_texture_float'];

          if (depthTextureExt && floatTextureExt) {
            result = {
              internalFormat: gl.DEPTH_COMPONENT,
              format: gl.DEPTH_COMPONENT,
              type: gl.FLOAT,
            };
          } else {
            console.warn('WEBGL_depth_texture或OES_texture_float扩展不可用，无法使用浮点深度纹理');
            result = {
              internalFormat: gl.RGBA,
              format: gl.RGBA,
              type: gl.UNSIGNED_BYTE,
            };
          }
        }

        break;
      case RHITextureFormat.DEPTH24_UNORM_STENCIL8:
        if (this.isWebGL2) {
          result = {
            internalFormat: (gl as WebGL2RenderingContext).DEPTH24_STENCIL8,
            format: (gl as WebGL2RenderingContext).DEPTH_STENCIL,
            type: (gl as WebGL2RenderingContext).UNSIGNED_INT_24_8,
          };
        } else {
          // WebGL1需要深度纹理扩展
          const depthTextureExt = this.extension['WEBGL_depth_texture'];

          if (depthTextureExt) {
            result = {
              internalFormat: depthTextureExt.DEPTH_STENCIL,
              format: depthTextureExt.DEPTH_STENCIL,
              type: depthTextureExt.UNSIGNED_INT_24_8_WEBGL,
            };
          } else {
            console.warn('WEBGL_depth_texture扩展不可用，无法使用深度模板纹理');
            result = {
              internalFormat: gl.RGBA,
              format: gl.RGBA,
              type: gl.UNSIGNED_BYTE,
            };
          }
        }

        break;
      case RHITextureFormat.DEPTH32_FLOAT_STENCIL8:
        if (this.isWebGL2) {
          result = {
            internalFormat: (gl as WebGL2RenderingContext).DEPTH32F_STENCIL8,
            format: (gl as WebGL2RenderingContext).DEPTH_STENCIL,
            type: (gl as WebGL2RenderingContext).FLOAT_32_UNSIGNED_INT_24_8_REV,
          };
        } else {
          // WebGL1不支持这个格式，使用DEPTH24_STENCIL8作为降级选项
          console.warn('WebGL1不支持DEPTH32F_STENCIL8格式，尝试降级为DEPTH24_STENCIL8');
          const depthTextureExt = this.extension['WEBGL_depth_texture'];

          if (depthTextureExt) {
            result = {
              internalFormat: depthTextureExt.DEPTH_STENCIL,
              format: depthTextureExt.DEPTH_STENCIL,
              type: depthTextureExt.UNSIGNED_INT_24_8_WEBGL,
            };
          } else {
            console.warn('WEBGL_depth_texture扩展不可用，无法使用深度模板纹理');
            result = {
              internalFormat: gl.RGBA,
              format: gl.RGBA,
              type: gl.UNSIGNED_BYTE,
            };
          }
        }

        break;
      default:
        console.warn(`未知或不支持的纹理格式: ${format}，使用默认RGBA格式`);

        // 使用默认值
        break;
    }

    return result;
  }

  /**
   * 转换RHI寻址模式到WebGL寻址模式
   */
  addressModeToGL (mode: RHIAddressMode): GLenum {
    const gl = this.gl;

    switch (mode) {
      case RHIAddressMode.REPEAT: return gl.REPEAT;
      case RHIAddressMode.MIRROR_REPEAT: return gl.MIRRORED_REPEAT;
      case RHIAddressMode.CLAMP_TO_EDGE: return gl.CLAMP_TO_EDGE;
      case RHIAddressMode.CLAMP_TO_BORDER:
      {
        const ext = this.extension['EXT_texture_border_clamp'];

        return ext ? ext.CLAMP_TO_BORDER_EXT : gl.CLAMP_TO_EDGE;
      }
      default: return gl.CLAMP_TO_EDGE;
    }
  }

  /**
   * 转换RHI过滤模式到WebGL过滤模式
   */
  filterModeToGL (mode: RHIFilterMode, useMipmap: boolean = false): number {
    const gl = this.gl;

    if (mode === RHIFilterMode.NEAREST) {
      return useMipmap ? gl.NEAREST_MIPMAP_NEAREST : gl.NEAREST;
    } else {
      return useMipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR;
    }
  }

  /**
   * 转换RHI比较函数到WebGL比较函数
   */
  compareFunctionToGL (func: RHICompareFunction): number {
    const gl = this.gl;

    switch (func) {
      case RHICompareFunction.NEVER: return gl.NEVER;
      case RHICompareFunction.LESS: return gl.LESS;
      case RHICompareFunction.EQUAL: return gl.EQUAL;
      case RHICompareFunction.LESS_EQUAL: return gl.LEQUAL;
      case RHICompareFunction.GREATER: return gl.GREATER;
      case RHICompareFunction.NOT_EQUAL: return gl.NOTEQUAL;
      case RHICompareFunction.GREATER_EQUAL: return gl.GEQUAL;
      case RHICompareFunction.ALWAYS: return gl.ALWAYS;
      default: return gl.ALWAYS;
    }
  }

  /**
   * 转换RHI顶点格式到WebGL类型
   */
  vertexFormatToGL (format: RHIVertexFormat): { type: number, size: number, normalized: boolean } {
    const gl = this.gl;

    switch (format) {
      case RHIVertexFormat.FLOAT32:
        return { type: gl.FLOAT, size: 1, normalized: false };
      case RHIVertexFormat.FLOAT32X2:
        return { type: gl.FLOAT, size: 2, normalized: false };
      case RHIVertexFormat.FLOAT32X3:
        return { type: gl.FLOAT, size: 3, normalized: false };
      case RHIVertexFormat.FLOAT32X4:
        return { type: gl.FLOAT, size: 4, normalized: false };
      case RHIVertexFormat.UINT8X2:
        return { type: gl.UNSIGNED_BYTE, size: 2, normalized: false };
      case RHIVertexFormat.UINT8X4:
        return { type: gl.UNSIGNED_BYTE, size: 4, normalized: false };
      case RHIVertexFormat.UNORM8X2:
        return { type: gl.UNSIGNED_BYTE, size: 2, normalized: true };
      case RHIVertexFormat.UNORM8X4:
        return { type: gl.UNSIGNED_BYTE, size: 4, normalized: true };
      case RHIVertexFormat.SINT8X2:
        return { type: gl.BYTE, size: 2, normalized: false };
      case RHIVertexFormat.SINT8X4:
        return { type: gl.BYTE, size: 4, normalized: false };
      case RHIVertexFormat.SNORM8X2:
        return { type: gl.BYTE, size: 2, normalized: true };
      case RHIVertexFormat.SNORM8X4:
        return { type: gl.BYTE, size: 4, normalized: true };
      case RHIVertexFormat.UINT16X2:
        return { type: gl.UNSIGNED_SHORT, size: 2, normalized: false };
      case RHIVertexFormat.UINT16X4:
        return { type: gl.UNSIGNED_SHORT, size: 4, normalized: false };
      case RHIVertexFormat.SINT16X2:
        return { type: gl.SHORT, size: 2, normalized: false };
      case RHIVertexFormat.SINT16X4:
        return { type: gl.SHORT, size: 4, normalized: false };
      default:
        return { type: gl.FLOAT, size: 4, normalized: false };
    }
  }

  /**
   * 转换RHI混合因子到WebGL混合因子
   */
  blendFactorToGL (factor: RHIBlendFactor): number {
    const gl = this.gl;

    switch (factor) {
      case RHIBlendFactor.ZERO: return gl.ZERO;
      case RHIBlendFactor.ONE: return gl.ONE;
      case RHIBlendFactor.SRC_COLOR: return gl.SRC_COLOR;
      case RHIBlendFactor.ONE_MINUS_SRC_COLOR: return gl.ONE_MINUS_SRC_COLOR;
      case RHIBlendFactor.DST_COLOR: return gl.DST_COLOR;
      case RHIBlendFactor.ONE_MINUS_DST_COLOR: return gl.ONE_MINUS_DST_COLOR;
      case RHIBlendFactor.SRC_ALPHA: return gl.SRC_ALPHA;
      case RHIBlendFactor.ONE_MINUS_SRC_ALPHA: return gl.ONE_MINUS_SRC_ALPHA;
      case RHIBlendFactor.DST_ALPHA: return gl.DST_ALPHA;
      case RHIBlendFactor.ONE_MINUS_DST_ALPHA: return gl.ONE_MINUS_DST_ALPHA;
      case RHIBlendFactor.CONSTANT_COLOR: return gl.CONSTANT_COLOR;
      case RHIBlendFactor.ONE_MINUS_CONSTANT_COLOR: return gl.ONE_MINUS_CONSTANT_COLOR;
      case RHIBlendFactor.CONSTANT_ALPHA: return gl.CONSTANT_ALPHA;
      case RHIBlendFactor.ONE_MINUS_CONSTANT_ALPHA: return gl.ONE_MINUS_CONSTANT_ALPHA;
      case RHIBlendFactor.SRC_ALPHA_SATURATE: return gl.SRC_ALPHA_SATURATE;
      default: return gl.ONE;
    }
  }

  /**
   * 转换RHI混合操作到WebGL混合等式
   */
  blendOperationToGL (operation: RHIBlendOperation): number {
    const gl = this.gl;

    switch (operation) {
      case RHIBlendOperation.ADD: return gl.FUNC_ADD;
      case RHIBlendOperation.SUBTRACT: return gl.FUNC_SUBTRACT;
      case RHIBlendOperation.REVERSE_SUBTRACT: return gl.FUNC_REVERSE_SUBTRACT;
      case RHIBlendOperation.MIN:
      {
        const minExt = this.extension['EXT_blend_minmax'];

        return minExt ? minExt.MIN_EXT : gl.FUNC_ADD;

      }
      case RHIBlendOperation.MAX:
      {
        const maxExt = this.extension['EXT_blend_minmax'];

        return maxExt ? maxExt.MAX_EXT : gl.FUNC_ADD;
      }
      default: return gl.FUNC_ADD;
    }
  }

  /**
   * 转换RHI图元类型到WebGL图元类型
   */
  primitiveTopologyToGL (topology: RHIPrimitiveTopology): number {
    const gl = this.gl;

    switch (topology) {
      case RHIPrimitiveTopology.POINT_LIST: return gl.POINTS;
      case RHIPrimitiveTopology.LINE_LIST: return gl.LINES;
      case RHIPrimitiveTopology.LINE_STRIP: return gl.LINE_STRIP;
      case RHIPrimitiveTopology.TRIANGLE_LIST: return gl.TRIANGLES;
      case RHIPrimitiveTopology.TRIANGLE_STRIP: return gl.TRIANGLE_STRIP;
      default: return gl.TRIANGLES;
    }
  }

  /**
   * 转换RHI剔除模式到WebGL
   */
  cullModeToGL (mode: RHICullMode): { enable: boolean, mode: number } {
    const gl = this.gl;

    switch (mode) {
      case RHICullMode.NONE:
        return { enable: false, mode: gl.BACK };
      case RHICullMode.FRONT:
        return { enable: true, mode: gl.FRONT };
      case RHICullMode.BACK:
        return { enable: true, mode: gl.BACK };
      default:
        return { enable: false, mode: gl.BACK };
    }
  }

  /**
   * 转换RHI正面方向到WebGL
   */
  frontFaceToGL (face: RHIFrontFace): number {
    const gl = this.gl;

    return face === RHIFrontFace.CW ? gl.CW : gl.CCW;
  }

  /**
   * 转换RHI模板操作到WebGL
   */
  stencilOperationToGL (operation: RHIStencilOperation): number {
    const gl = this.gl;

    switch (operation) {
      case RHIStencilOperation.KEEP: return gl.KEEP;
      case RHIStencilOperation.ZERO: return gl.ZERO;
      case RHIStencilOperation.REPLACE: return gl.REPLACE;
      case RHIStencilOperation.INCR_CLAMP: return gl.INCR;
      case RHIStencilOperation.DECR_CLAMP: return gl.DECR;
      case RHIStencilOperation.INVERT: return gl.INVERT;
      case RHIStencilOperation.INCR_WRAP: return gl.INCR_WRAP;
      case RHIStencilOperation.DECR_WRAP: return gl.DECR_WRAP;
      default: return gl.KEEP;
    }
  }
}