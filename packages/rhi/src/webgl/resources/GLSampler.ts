import type { IRHISampler, RHISamplerDescriptor } from '@maxellabs/core';
import { RHIAddressMode, RHICompareFunction, RHIFilterMode } from '@maxellabs/core';
import { WebGLUtils } from '../utils/GLUtils';

/**
 * WebGL采样器实现
 * 注意：WebGL1不支持采样器对象，这里使用参数封装模拟采样器行为
 */
export class GLSampler implements IRHISampler {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private isWebGL2: boolean;
  private sampler: WebGLSampler | null;
  addressModeU: RHIAddressMode;
  addressModeV: RHIAddressMode;
  addressModeW: RHIAddressMode;
  magFilter: RHIFilterMode;
  minFilter: RHIFilterMode;
  mipmapFilter: RHIFilterMode;
  private lodMinClamp: number;
  private lodMaxClamp: number;
  private compareFunction?: RHICompareFunction;
  private maxAnisotropy: number;
  label?: string;
  private isDestroyed: boolean = false;
  private utils: WebGLUtils;

  /**
   * 构造函数
   * @param gl WebGL上下文
   * @param descriptor 采样器描述符
   */
  constructor (gl: WebGLRenderingContext | WebGL2RenderingContext, descriptor: RHISamplerDescriptor = {}) {
    this.gl = gl;
    this.isWebGL2 = gl instanceof WebGL2RenderingContext;
    this.utils = new WebGLUtils(gl);

    // 初始化默认值
    this.addressModeU = this.getAddressMode(descriptor.addressModeU);
    this.addressModeV = this.getAddressMode(descriptor.addressModeV);
    this.addressModeW = this.getAddressMode(descriptor.addressModeW);
    this.magFilter = this.getFilterMode(descriptor.magFilter);
    this.minFilter = this.getFilterMode(descriptor.minFilter);
    this.mipmapFilter = this.getFilterMode(descriptor.mipmapFilter);
    this.lodMinClamp = descriptor.lodMinClamp !== undefined ? descriptor.lodMinClamp : 0;
    this.lodMaxClamp = descriptor.lodMaxClamp !== undefined ? descriptor.lodMaxClamp : 1000;

    if (descriptor.compareFunction) {
      this.compareFunction = this.getCompareFunction(descriptor.compareFunction);
    }

    this.maxAnisotropy = descriptor.maxAnisotropy || 1;
    this.label = descriptor.label;

    // WebGL2支持采样器对象
    if (this.isWebGL2) {
      this.sampler = this.createWebGL2Sampler();
    } else {
      this.sampler = null;
    }
  }

  /**
   * 将字符串寻址模式转换为枚举值
   */
  private getAddressMode (mode?: 'repeat' | 'mirror-repeat' | 'clamp-to-edge' | 'clamp-to-border'): RHIAddressMode {
    if (!mode) {return RHIAddressMode.CLAMP_TO_EDGE;}

    switch (mode) {
      case 'repeat': return RHIAddressMode.REPEAT;
      case 'mirror-repeat': return RHIAddressMode.MIRROR_REPEAT;
      case 'clamp-to-edge': return RHIAddressMode.CLAMP_TO_EDGE;
      case 'clamp-to-border': return RHIAddressMode.CLAMP_TO_BORDER;
      default: return RHIAddressMode.CLAMP_TO_EDGE;
    }
  }

  /**
   * 将字符串过滤模式转换为枚举值
   */
  private getFilterMode (mode?: 'nearest' | 'linear'): RHIFilterMode {
    if (!mode) {return RHIFilterMode.LINEAR;}

    switch (mode) {
      case 'nearest': return RHIFilterMode.NEAREST;
      case 'linear': return RHIFilterMode.LINEAR;
      default: return RHIFilterMode.LINEAR;
    }
  }

  /**
   * 将字符串比较函数转换为枚举值
   */
  private getCompareFunction (func: 'never' | 'less' | 'equal' | 'less-equal' | 'greater' | 'not-equal' | 'greater-equal' | 'always'): RHICompareFunction {
    switch (func) {
      case 'never': return RHICompareFunction.NEVER;
      case 'less': return RHICompareFunction.LESS;
      case 'equal': return RHICompareFunction.EQUAL;
      case 'less-equal': return RHICompareFunction.LESS_EQUAL;
      case 'greater': return RHICompareFunction.GREATER;
      case 'not-equal': return RHICompareFunction.NOT_EQUAL;
      case 'greater-equal': return RHICompareFunction.GREATER_EQUAL;
      case 'always': return RHICompareFunction.ALWAYS;
      default: return RHICompareFunction.ALWAYS;
    }
  }

  /**
 * 创建WebGL2采样器对象
 * @returns 创建的WebGL2采样器对象，如果创建失败或不支持WebGL2则返回null
 */
  private createWebGL2Sampler (): WebGLSampler | null {
    if (!this.isWebGL2) {
      return null;
    }

    const gl2 = this.gl as WebGL2RenderingContext;
    const sampler = gl2.createSampler();

    if (!sampler) {
      console.warn('创建WebGL2采样器对象失败');

      return null;
    }

    try {
    // 验证LOD值的合理性
      if (this.lodMinClamp > this.lodMaxClamp) {
        console.warn(`LOD范围无效: 最小值(${this.lodMinClamp})大于最大值(${this.lodMaxClamp})，已自动调整`);
        // 自动修正
        const temp = this.lodMinClamp;

        this.lodMinClamp = this.lodMaxClamp;
        this.lodMaxClamp = temp;
      }

      // 设置寻址模式
      gl2.samplerParameteri(sampler, gl2.TEXTURE_WRAP_S, this.utils.addressModeToGL(this.addressModeU));
      gl2.samplerParameteri(sampler, gl2.TEXTURE_WRAP_T, this.utils.addressModeToGL(this.addressModeV));
      gl2.samplerParameteri(sampler, gl2.TEXTURE_WRAP_R, this.utils.addressModeToGL(this.addressModeW));

      // 处理边界颜色（如果使用CLAMP_TO_BORDER模式）
      if (this.addressModeU === RHIAddressMode.CLAMP_TO_BORDER ||
          this.addressModeV === RHIAddressMode.CLAMP_TO_BORDER ||
          this.addressModeW === RHIAddressMode.CLAMP_TO_BORDER) {

        try {
          // 尝试设置边界颜色
          (gl2 as any).samplerParameterfv(sampler, (gl2 as any).TEXTURE_BORDER_COLOR, new Float32Array([0, 0, 0, 1]));
          // 检查设置是否成功
          const error = gl2.getError();

          if (error !== gl2.NO_ERROR) {
            throw new Error(`设置边界颜色时出错: 0x${error.toString(16)}`);
          }
        } catch (e) {
          // 边界颜色设置失败，降级到 CLAMP_TO_EDGE
          console.warn('边界颜色设置失败，降级到 CLAMP_TO_EDGE 模式:', e);

          if (this.addressModeU === RHIAddressMode.CLAMP_TO_BORDER) {
            this.addressModeU = RHIAddressMode.CLAMP_TO_EDGE;
            gl2.samplerParameteri(sampler, gl2.TEXTURE_WRAP_S, this.utils.addressModeToGL(this.addressModeU));
          }
          if (this.addressModeV === RHIAddressMode.CLAMP_TO_BORDER) {
            this.addressModeV = RHIAddressMode.CLAMP_TO_EDGE;
            gl2.samplerParameteri(sampler, gl2.TEXTURE_WRAP_T, this.utils.addressModeToGL(this.addressModeV));
          }
          if (this.addressModeW === RHIAddressMode.CLAMP_TO_BORDER) {
            this.addressModeW = RHIAddressMode.CLAMP_TO_EDGE;
            gl2.samplerParameteri(sampler, gl2.TEXTURE_WRAP_R, this.utils.addressModeToGL(this.addressModeW));
          }
        }
      }

      // 设置放大过滤模式
      gl2.samplerParameteri(sampler, gl2.TEXTURE_MAG_FILTER, this.utils.filterModeToGL(this.magFilter));

      // 设置缩小和Mipmap过滤的组合
      let minFilter: number;

      // 处理是否使用mipmap
      const useMipmap = true; // 这里可以根据需要添加控制标志

      if (!useMipmap) {
      // 不使用mipmap时的简单过滤
        minFilter = this.minFilter === RHIFilterMode.NEAREST ? gl2.NEAREST : gl2.LINEAR;
      } else {
      // 使用mipmap时的组合过滤
        if (this.minFilter === RHIFilterMode.NEAREST) {
          minFilter = this.mipmapFilter === RHIFilterMode.NEAREST ?
            gl2.NEAREST_MIPMAP_NEAREST : gl2.NEAREST_MIPMAP_LINEAR;
        } else {
          minFilter = this.mipmapFilter === RHIFilterMode.NEAREST ?
            gl2.LINEAR_MIPMAP_NEAREST : gl2.LINEAR_MIPMAP_LINEAR;
        }
      }

      gl2.samplerParameteri(sampler, gl2.TEXTURE_MIN_FILTER, minFilter);

      // 设置LOD范围
      gl2.samplerParameterf(sampler, gl2.TEXTURE_MIN_LOD, this.lodMinClamp);
      gl2.samplerParameterf(sampler, gl2.TEXTURE_MAX_LOD, this.lodMaxClamp);

      // 设置比较函数（仅深度纹理使用）
      if (this.compareFunction !== undefined) {
        gl2.samplerParameteri(sampler, gl2.TEXTURE_COMPARE_MODE, gl2.COMPARE_REF_TO_TEXTURE);
        gl2.samplerParameteri(sampler, gl2.TEXTURE_COMPARE_FUNC,
          this.utils.compareFunctionToGL(this.compareFunction));
      } else {
      // 明确禁用比较模式
        gl2.samplerParameteri(sampler, gl2.TEXTURE_COMPARE_MODE, gl2.NONE);
      }

      // 设置各向异性过滤
      // 尝试使用不同名称的扩展
      let anisotropicExt = gl2.getExtension('EXT_texture_filter_anisotropic');

      if (!anisotropicExt) {
        anisotropicExt = gl2.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
      }

      if (anisotropicExt) {
        if (this.maxAnisotropy > 1) {
          const maxSupportedAnisotropy = gl2.getParameter(
            anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT
          );

          const maxAniso = Math.min(this.maxAnisotropy, maxSupportedAnisotropy);

          gl2.samplerParameterf(sampler, anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, maxAniso);

          if (this.maxAnisotropy > maxSupportedAnisotropy) {
            console.warn(`请求的各向异性过滤值(${this.maxAnisotropy})超过了设备支持的最大值(${maxSupportedAnisotropy})`);
          }
        }
      } else if (this.maxAnisotropy > 1) {
        console.warn('设备不支持各向异性过滤，已忽略相关设置');
      }

      // 验证采样器状态
      const error = gl2.getError();

      if (error !== gl2.NO_ERROR) {
        console.warn(`创建采样器过程中发生错误: 0x${error.toString(16)}`);
      }

      return sampler;
    } catch (e) {
      console.error('创建WebGL2采样器对象时发生异常:', e);

      // 清理资源
      if (sampler) {
        gl2.deleteSampler(sampler);
      }

      return null;
    }
  }

  /**
   * 获取寻址模式U
   */
  getAddressModeU (): RHIAddressMode {
    return this.addressModeU;
  }

  /**
   * 获取寻址模式V
   */
  getAddressModeV (): RHIAddressMode {
    return this.addressModeV;
  }

  /**
   * 获取寻址模式W
   */
  getAddressModeW (): RHIAddressMode {
    return this.addressModeW;
  }

  /**
   * 获取放大过滤模式
   */
  getMagFilter (): RHIFilterMode {
    return this.magFilter;
  }

  /**
   * 获取缩小过滤模式
   */
  getMinFilter (): RHIFilterMode {
    return this.minFilter;
  }

  /**
   * 获取Mipmap过滤模式
   */
  getMipmapFilter (): RHIFilterMode {
    return this.mipmapFilter;
  }

  /**
   * 获取LOD最小值
   */
  getLodMinClamp (): number {
    return this.lodMinClamp;
  }

  /**
   * 获取LOD最大值
   */
  getLodMaxClamp (): number {
    return this.lodMaxClamp;
  }

  // /**
  //  * 获取比较函数
  //  */
  // getCompareFunction (): RHICompareFunction | undefined {
  //   return this.compareFunction;
  // }

  /**
   * 获取最大各向异性值
   */
  getMaxAnisotropy (): number {
    return this.maxAnisotropy;
  }

  /**
   * 获取标签
   */
  getLabel (): string | undefined {
    return this.label;
  }

  /**
   * 获取WebGL采样器对象
   * WebGL1不支持采样器对象，将返回null
   */
  getGLSampler (): WebGLSampler | null {
    return this.sampler;
  }

  /**
   * 应用采样器设置到纹理
   * WebGL1必须使用此方法来应用采样器设置
   * @param textureTarget WebGL纹理目标
   */
  applyToTexture (textureTarget: number): void {
    const gl = this.gl;

    // 设置寻址模式
    gl.texParameteri(textureTarget, gl.TEXTURE_WRAP_S, this.utils.addressModeToGL(this.addressModeU));
    gl.texParameteri(textureTarget, gl.TEXTURE_WRAP_T, this.utils.addressModeToGL(this.addressModeV));

    if (this.isWebGL2) {
      (gl as WebGL2RenderingContext).texParameteri(
        textureTarget,
        (gl as WebGL2RenderingContext).TEXTURE_WRAP_R,
        this.utils.addressModeToGL(this.addressModeW)
      );
    }

    // 设置过滤模式
    gl.texParameteri(textureTarget, gl.TEXTURE_MAG_FILTER, this.utils.filterModeToGL(this.magFilter));

    // 设置MIN过滤和Mipmap过滤的组合
    let minFilter: number;

    if (this.minFilter === RHIFilterMode.NEAREST) {
      minFilter = this.mipmapFilter === RHIFilterMode.NEAREST ? gl.NEAREST_MIPMAP_NEAREST : gl.NEAREST_MIPMAP_LINEAR;
    } else {
      minFilter = this.mipmapFilter === RHIFilterMode.NEAREST ? gl.LINEAR_MIPMAP_NEAREST : gl.LINEAR_MIPMAP_LINEAR;
    }
    gl.texParameteri(textureTarget, gl.TEXTURE_MIN_FILTER, minFilter);

    // 设置LOD范围 (仅WebGL2)
    if (this.isWebGL2) {
      (gl as WebGL2RenderingContext).texParameterf(
        textureTarget,
        (gl as WebGL2RenderingContext).TEXTURE_MIN_LOD,
        this.lodMinClamp
      );
      (gl as WebGL2RenderingContext).texParameterf(
        textureTarget,
        (gl as WebGL2RenderingContext).TEXTURE_MAX_LOD,
        this.lodMaxClamp
      );
    }

    // 设置比较函数 (仅深度纹理)
    if (this.compareFunction !== undefined) {
      if (this.isWebGL2) {
        const gl2 = gl as WebGL2RenderingContext;

        gl2.texParameteri(textureTarget, gl2.TEXTURE_COMPARE_MODE, gl2.COMPARE_REF_TO_TEXTURE);
        gl2.texParameteri(textureTarget, gl2.TEXTURE_COMPARE_FUNC, this.utils.compareFunctionToGL(this.compareFunction));
      } else {
        const ext = gl.getExtension('WEBGL_depth_texture');

        if (ext) {
          // 使用常量值（WebGL规范中的值）
          gl.texParameteri(textureTarget, 0x884C /*TEXTURE_COMPARE_MODE*/, 0x884E /*COMPARE_REF_TO_TEXTURE*/);
          gl.texParameteri(textureTarget, 0x884D /*TEXTURE_COMPARE_FUNC*/, this.utils.compareFunctionToGL(this.compareFunction));
        }
      }
    }

    // 设置各向异性过滤
    const ext = gl.getExtension('EXT_texture_filter_anisotropic');

    if (ext && this.maxAnisotropy > 1) {
      const maxAniso = Math.min(
        this.maxAnisotropy,
        gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
      );

      gl.texParameterf(textureTarget, ext.TEXTURE_MAX_ANISOTROPY_EXT, maxAniso);
    }
  }

  /**
   * 绑定采样器到纹理单元
   * 仅WebGL2支持
   * @param unit 纹理单元索引
   */
  bind (unit: number): void {
    if (this.isWebGL2 && this.sampler) {
      (this.gl as WebGL2RenderingContext).bindSampler(unit, this.sampler);
    }
  }

  /**
   * 销毁资源
   */
  destroy (): void {
    if (this.isDestroyed) {
      return;
    }

    if (this.isWebGL2 && this.sampler) {
      (this.gl as WebGL2RenderingContext).deleteSampler(this.sampler);
      this.sampler = null;
    }

    this.isDestroyed = true;
  }
}