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
  private borderColor: [number, number, number, number];
  private useMipmap: boolean;
  label?: string;
  private isDestroyed: boolean = false;
  private utils: WebGLUtils;

  /**
   * 构造函数
   * @param gl WebGL上下文
   * @param descriptor 采样器描述符
   */
  constructor (gl: WebGLRenderingContext | WebGL2RenderingContext, descriptor: RHISamplerDescriptor & {
    borderColor?: [number, number, number, number],
    useMipmap?: boolean,
  } = {}) {
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
    this.lodMaxClamp = descriptor.lodMaxClamp !== undefined ? descriptor.lodMaxClamp : 32;
    this.borderColor = descriptor.borderColor || [0, 0, 0, 1];
    this.useMipmap = descriptor.useMipmap !== undefined ? descriptor.useMipmap : true;

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
   * 将字符串或枚举寻址模式转换为枚举值
   */
  private getAddressMode (mode?: 'repeat' | 'mirror-repeat' | 'clamp-to-edge' | 'clamp-to-border' | RHIAddressMode): RHIAddressMode {
    if (mode === undefined || mode === null) {
      return RHIAddressMode.CLAMP_TO_EDGE;
    }

    // 如果已经是枚举类型，直接返回
    if (typeof mode === 'number') {
      // 验证枚举值合法性
      if (Object.values(RHIAddressMode).includes(mode)) {
        return mode;
      }
      console.warn(`无效的寻址模式枚举值: ${mode}，使用默认值CLAMP_TO_EDGE`);

      return RHIAddressMode.CLAMP_TO_EDGE;
    }

    // 字符串转换到枚举
    switch (mode) {
      case 'repeat': return RHIAddressMode.REPEAT;
      case 'mirror-repeat': return RHIAddressMode.MIRROR_REPEAT;
      case 'clamp-to-edge': return RHIAddressMode.CLAMP_TO_EDGE;
      case 'clamp-to-border': return RHIAddressMode.CLAMP_TO_BORDER;
      default: return RHIAddressMode.CLAMP_TO_EDGE;
    }
  }

  /**
   * 将字符串或枚举过滤模式转换为枚举值
   */
  private getFilterMode (mode?: 'nearest' | 'linear' | RHIFilterMode): RHIFilterMode {
    if (mode === undefined || mode === null) {
      return RHIFilterMode.LINEAR;
    }

    // 如果已经是枚举类型，直接返回
    if (typeof mode === 'number') {
      // 验证枚举值合法性
      if (Object.values(RHIFilterMode).includes(mode)) {
        return mode;
      }
      console.warn(`无效的过滤模式枚举值: ${mode}，使用默认值LINEAR`);

      return RHIFilterMode.LINEAR;
    }

    // 字符串转换到枚举
    switch (mode) {
      case 'nearest': return RHIFilterMode.NEAREST;
      case 'linear': return RHIFilterMode.LINEAR;
      default: return RHIFilterMode.LINEAR;
    }
  }

  /**
   * 将字符串或枚举比较函数转换为枚举值
   */
  private getCompareFunction (func: 'never' | 'less' | 'equal' | 'less-equal' | 'greater' | 'not-equal' | 'greater-equal' | 'always' | RHICompareFunction): RHICompareFunction {
    if (typeof func === 'number') {
      // 验证枚举值合法性
      if (Object.values(RHICompareFunction).includes(func)) {
        return func;
      }
      console.warn(`无效的比较函数枚举值: ${func}，使用默认值ALWAYS`);

      return RHICompareFunction.ALWAYS;
    }

    // 字符串转换到枚举
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
          // 获取TEXTURE_BORDER_COLOR常量
          const TEXTURE_BORDER_COLOR = this.getBorderColorConstant(gl2);

          if (TEXTURE_BORDER_COLOR) {
            // 尝试设置边界颜色
            (gl2 as any).samplerParameterfv(sampler, TEXTURE_BORDER_COLOR, new Float32Array(this.borderColor));

            // 检查设置是否成功
            const error = gl2.getError();

            if (error !== gl2.NO_ERROR) {
              throw new Error(`设置边界颜色时出错: 0x${error.toString(16)}`);
            }
          } else {
            throw new Error('无法获取TEXTURE_BORDER_COLOR常量');
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
      const minFilter = this.getMinFilterValue(gl2);

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
      this.applyAnisotropicFiltering(gl2, sampler);

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
   * 获取边界颜色常量
   */
  private getBorderColorConstant (gl: WebGL2RenderingContext): number | null {
    // 标准中这个值是0x1004，但我们通过动态方式获取更安全
    if ('TEXTURE_BORDER_COLOR' in gl) {
      return (gl as any).TEXTURE_BORDER_COLOR;
    }

    // 尝试从扩展中获取
    const ext = gl.getExtension('EXT_texture_border_clamp');

    if (ext && 'TEXTURE_BORDER_COLOR_EXT' in ext) {
      return ext.TEXTURE_BORDER_COLOR_EXT;
    }

    // 根据WebGL规范中的已知值
    return 0x1004;
  }

  /**
   * 获取过滤模式组合值
   */
  private getMinFilterValue (gl: WebGLRenderingContext | WebGL2RenderingContext): number {
    // 处理是否使用mipmap
    if (!this.useMipmap) {
      // 不使用mipmap时的简单过滤
      return this.minFilter === RHIFilterMode.NEAREST ? gl.NEAREST : gl.LINEAR;
    } else {
      // 使用mipmap时的组合过滤
      if (this.minFilter === RHIFilterMode.NEAREST) {
        return this.mipmapFilter === RHIFilterMode.NEAREST ?
          gl.NEAREST_MIPMAP_NEAREST : gl.NEAREST_MIPMAP_LINEAR;
      } else {
        return this.mipmapFilter === RHIFilterMode.NEAREST ?
          gl.LINEAR_MIPMAP_NEAREST : gl.LINEAR_MIPMAP_LINEAR;
      }
    }
  }

  /**
   * 应用各向异性过滤
   */
  private applyAnisotropicFiltering (gl: WebGLRenderingContext | WebGL2RenderingContext, sampler?: WebGLSampler): void {
    // 尝试使用不同名称的扩展
    const ext =
      gl.getExtension('EXT_texture_filter_anisotropic') ||
      gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');

    if (ext && this.maxAnisotropy > 1) {
      const maxSupportedAnisotropy = gl.getParameter(
        ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT
      );

      const maxAniso = Math.min(this.maxAnisotropy, maxSupportedAnisotropy);

      if (sampler && this.isWebGL2) {
        // WebGL2采样器对象
        (gl as WebGL2RenderingContext).samplerParameterf(
          sampler,
          ext.TEXTURE_MAX_ANISOTROPY_EXT,
          maxAniso
        );
      } else if (!sampler) {
        // 直接应用到纹理
        gl.texParameterf(
          gl.TEXTURE_2D,
          ext.TEXTURE_MAX_ANISOTROPY_EXT,
          maxAniso
        );
      }

      if (this.maxAnisotropy > maxSupportedAnisotropy) {
        console.warn(`请求的各向异性过滤值(${this.maxAnisotropy})超过了设备支持的最大值(${maxSupportedAnisotropy})`);
      }
    } else if (this.maxAnisotropy > 1) {
      console.warn('设备不支持各向异性过滤，已忽略相关设置');
    }
  }

  /**
   * 验证对象是否已销毁
   * @throws 如果对象已销毁，则抛出异常
   */
  private validateNotDestroyed (): void {
    if (this.isDestroyed) {
      throw new Error(`尝试使用已销毁的采样器: ${this.label || '未命名'}`);
    }
  }

  /**
   * 获取寻址模式U
   */
  getAddressModeU (): RHIAddressMode {
    this.validateNotDestroyed();

    return this.addressModeU;
  }

  /**
   * 获取寻址模式V
   */
  getAddressModeV (): RHIAddressMode {
    this.validateNotDestroyed();

    return this.addressModeV;
  }

  /**
   * 获取寻址模式W
   */
  getAddressModeW (): RHIAddressMode {
    this.validateNotDestroyed();

    return this.addressModeW;
  }

  /**
   * 获取放大过滤模式
   */
  getMagFilter (): RHIFilterMode {
    this.validateNotDestroyed();

    return this.magFilter;
  }

  /**
   * 获取缩小过滤模式
   */
  getMinFilter (): RHIFilterMode {
    this.validateNotDestroyed();

    return this.minFilter;
  }

  /**
   * 获取Mipmap过滤模式
   */
  getMipmapFilter (): RHIFilterMode {
    this.validateNotDestroyed();

    return this.mipmapFilter;
  }

  /**
   * 获取LOD最小值
   */
  getLodMinClamp (): number {
    this.validateNotDestroyed();

    return this.lodMinClamp;
  }

  /**
   * 获取LOD最大值
   */
  getLodMaxClamp (): number {
    this.validateNotDestroyed();

    return this.lodMaxClamp;
  }

  /**
   * 获取最大各向异性值
   */
  getMaxAnisotropy (): number {
    this.validateNotDestroyed();

    return this.maxAnisotropy;
  }

  /**
   * 获取边界颜色
   */
  getBorderColor (): [number, number, number, number] {
    this.validateNotDestroyed();

    return [...this.borderColor]; // 返回副本避免修改
  }

  /**
   * 获取是否使用Mipmap
   */
  getUseMipmap (): boolean {
    this.validateNotDestroyed();

    return this.useMipmap;
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
    this.validateNotDestroyed();

    return this.sampler;
  }

  /**
   * 应用采样器设置到纹理
   * WebGL1必须使用此方法来应用采样器设置
   * @param textureTarget WebGL纹理目标
   */
  applyToTexture (textureTarget: number): void {
    this.validateNotDestroyed();
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

    // 处理边界颜色（如果使用CLAMP_TO_BORDER模式）
    if (this.addressModeU === RHIAddressMode.CLAMP_TO_BORDER ||
        this.addressModeV === RHIAddressMode.CLAMP_TO_BORDER ||
        this.addressModeW === RHIAddressMode.CLAMP_TO_BORDER) {

      if (this.isWebGL2) {
        // WebGL2
        const TEXTURE_BORDER_COLOR = this.getBorderColorConstant(gl as WebGL2RenderingContext);

        if (TEXTURE_BORDER_COLOR) {
          // 尝试设置边界颜色
          (gl as any).texParameterfv(textureTarget, TEXTURE_BORDER_COLOR, new Float32Array(this.borderColor));
        }
      } else {
        // WebGL1 - 尝试使用扩展
        const ext = gl.getExtension('EXT_texture_border_clamp');

        if (ext && 'TEXTURE_BORDER_COLOR_EXT' in ext) {
          // 尝试设置边界颜色
          (gl as any).texParameterfv(textureTarget, ext.TEXTURE_BORDER_COLOR_EXT, new Float32Array(this.borderColor));
        } else {
          // 无法设置边界颜色，降级处理
          console.warn('WebGL1不支持边界颜色设置，使用CLAMP_TO_EDGE代替');
          if (this.addressModeU === RHIAddressMode.CLAMP_TO_BORDER) {
            this.addressModeU = RHIAddressMode.CLAMP_TO_EDGE;
            gl.texParameteri(textureTarget, gl.TEXTURE_WRAP_S, this.utils.addressModeToGL(this.addressModeU));
          }
          if (this.addressModeV === RHIAddressMode.CLAMP_TO_BORDER) {
            this.addressModeV = RHIAddressMode.CLAMP_TO_EDGE;
            gl.texParameteri(textureTarget, gl.TEXTURE_WRAP_T, this.utils.addressModeToGL(this.addressModeV));
          }
        }
      }
    }

    // 设置过滤模式
    gl.texParameteri(textureTarget, gl.TEXTURE_MAG_FILTER, this.utils.filterModeToGL(this.magFilter));

    // 设置MIN过滤
    const minFilter = this.getMinFilterValue(gl);

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
    this.applyAnisotropicFiltering(gl);
  }

  /**
   * 绑定采样器到纹理单元
   * 仅WebGL2支持
   * @param unit 纹理单元索引
   */
  bind (unit: number): void {
    this.validateNotDestroyed();
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