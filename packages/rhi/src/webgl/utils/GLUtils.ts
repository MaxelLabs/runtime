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

  constructor (gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.gl = gl;
    this.isWebGL2 = gl instanceof WebGL2RenderingContext;
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
    let result = {
      internalFormat: gl.RGBA,
      format: gl.RGBA,
      type: gl.UNSIGNED_BYTE,
    };

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
        result = {
          internalFormat: this.isWebGL2 ? (gl as WebGL2RenderingContext).RGBA16F : gl.RGBA,
          format: gl.RGBA,
          type: this.isWebGL2 ? (gl as WebGL2RenderingContext).HALF_FLOAT :
            gl.getExtension('OES_texture_half_float')?.HALF_FLOAT_OES || gl.UNSIGNED_BYTE,
        };

        break;
      case RHITextureFormat.RGBA32_FLOAT:
        result = {
          internalFormat: this.isWebGL2 ? (gl as WebGL2RenderingContext).RGBA32F : gl.RGBA,
          format: gl.RGBA,
          type: gl.FLOAT,
        };

        break;
      case RHITextureFormat.DEPTH16_UNORM:
        result = {
          internalFormat: this.isWebGL2 ? (gl as WebGL2RenderingContext).DEPTH_COMPONENT16 : gl.DEPTH_COMPONENT,
          format: gl.DEPTH_COMPONENT,
          type: gl.UNSIGNED_SHORT,
        };

        break;
      case RHITextureFormat.DEPTH24_UNORM:
        result = {
          internalFormat: this.isWebGL2 ? (gl as WebGL2RenderingContext).DEPTH_COMPONENT24 : gl.DEPTH_COMPONENT,
          format: gl.DEPTH_COMPONENT,
          type: gl.UNSIGNED_INT,
        };

        break;
      case RHITextureFormat.DEPTH32_FLOAT:
        result = {
          internalFormat: this.isWebGL2 ? (gl as WebGL2RenderingContext).DEPTH_COMPONENT32F : gl.DEPTH_COMPONENT,
          format: gl.DEPTH_COMPONENT,
          type: gl.FLOAT,
        };

        break;
    }

    return result;
  }

  /**
   * 转换RHI寻址模式到WebGL寻址模式
   */
  addressModeToGL (mode: RHIAddressMode): number {
    const gl = this.gl;

    switch (mode) {
      case RHIAddressMode.REPEAT: return gl.REPEAT;
      case RHIAddressMode.MIRROR_REPEAT: return gl.MIRRORED_REPEAT;
      case RHIAddressMode.CLAMP_TO_EDGE: return gl.CLAMP_TO_EDGE;
      case RHIAddressMode.CLAMP_TO_BORDER:
      {
        const ext = gl.getExtension('EXT_texture_border_clamp');

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
        const minExt = gl.getExtension('EXT_blend_minmax');

        return minExt ? minExt.MIN_EXT : gl.FUNC_ADD;

      }
      case RHIBlendOperation.MAX:
      {
        const maxExt = gl.getExtension('EXT_blend_minmax');

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