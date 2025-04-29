import { GLTexture } from './GLTexture';

/**
 * WebGL帧缓冲对象封装类
 * 
 * 封装了WebGL帧缓冲(Framebuffer)功能，用于实现离屏渲染、多重渲染目标(MRT)和后处理效果。
 * 支持多颜色附件、深度模板附件以及多重采样(MSAA)，提供引用计数机制进行资源管理。
 */
export class GLFramebuffer {
  /** WebGL渲染上下文 */
  private gl: WebGLRenderingContext;
  
  /** 帧缓冲对象 */
  private fbo: WebGLFramebuffer | null;
  
  /** 颜色附件纹理列表 */
  private colorAttachments: WebGLTexture[];
  
  /** 深度模板附件纹理 */
  private depthStencilAttachment: WebGLTexture | null;
  
  /** 帧缓冲宽度(像素) */
  private width: number;
  
  /** 帧缓冲高度(像素) */
  private height: number;
  
  /** 多重采样数量 */
  private samples: number;
  
  /** 引用计数，用于资源管理 */
  private refCount: number;

  /**
   * 创建帧缓冲对象封装器
   * 
   * @param gl - WebGL渲染上下文
   * @throws {Error} 如果创建帧缓冲失败
   */
  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.fbo = this.gl.createFramebuffer();
    this.colorAttachments = [];
    this.depthStencilAttachment = null;
    this.width = 0;
    this.height = 0;
    this.samples = 0;
    this.refCount = 1;
  }

  /**
   * 配置帧缓冲尺寸和附件
   * 
   * 初始化帧缓冲并创建所需的纹理附件。
   * 
   * @param width - 帧缓冲宽度(像素)
   * @param height - 帧缓冲高度(像素)
   * @param options - 帧缓冲选项，包括多重采样、颜色附件数量、是否创建深度模板附件等
   * @throws {Error} 如果帧缓冲状态检查失败
   */
  create(width: number, height: number, options: FramebufferOptions = {}) {
    this.width = width;
    this.height = height;
    this.samples = options.samples ?? 0;

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);

    if (this.samples > 0) {
      this.createMultisampleColorAttachments(width, height, options.colorAttachments ?? 1);
    } else {
      this.createColorAttachments(width, height, options.colorAttachments ?? 1);
    }

    if (options.depthStencil) {
      this.createDepthStencilAttachment(width, height);
    }

    this.checkStatus();
  }

  /**
   * 创建多重采样颜色附件
   * 
   * 为帧缓冲创建指定数量的多重采样颜色附件纹理。
   * 
   * @param width - 纹理宽度(像素)
   * @param height - 纹理高度(像素)
   * @param colorAttachments - 颜色附件数量
   * @private
   */
  private createMultisampleColorAttachments(width: number, height: number, colorAttachments: number) {
    for (let i = 0; i < colorAttachments; i++) {
      const texture = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        width,
        height,
        0,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        null
      );
      this.colorAttachments.push(texture!);
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0 + i,
        this.gl.TEXTURE_2D,
        texture,
        0
      );
    }
  }

  /**
   * 创建标准颜色附件
   * 
   * 为帧缓冲创建指定数量的颜色附件纹理。
   * 
   * @param width - 纹理宽度(像素)
   * @param height - 纹理高度(像素)
   * @param colorAttachments - 颜色附件数量
   * @private
   */
  private createColorAttachments(width: number, height: number, colorAttachments: number) {
    for (let i = 0; i < colorAttachments; i++) {
      const texture = new GLTexture(this.gl);
      texture.create(width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE);
      const glTexture = texture.getTexture();
      this.colorAttachments.push(glTexture);
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0 + i,
        this.gl.TEXTURE_2D,
        glTexture,
        0
      );
    }
  }

  /**
   * 创建深度模板附件
   * 
   * 为帧缓冲创建深度和模板附件纹理。
   * 
   * @param width - 纹理宽度(像素)
   * @param height - 纹理高度(像素)
   * @private
   */
  private createDepthStencilAttachment(width: number, height: number) {
    const texture = new GLTexture(this.gl);
    texture.create(width, height, this.gl.DEPTH_STENCIL, this.gl.UNSIGNED_INT);
    this.depthStencilAttachment = texture.getTexture();
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.DEPTH_STENCIL_ATTACHMENT,
      this.gl.TEXTURE_2D,
      texture.getTexture(),
      0
    );
  }

  /**
   * 检查帧缓冲状态
   * 
   * 验证帧缓冲配置是否有效并可用于渲染。
   * 
   * @throws {Error} 如果帧缓冲未正确配置
   * @private
   */
  private checkStatus() {
    const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
    if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Framebuffer is not complete: ${status}`);
    }
  }

  /**
   * 绑定帧缓冲
   * 
   * 将此帧缓冲设置为当前渲染目标。
   */
  bind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
  }

  /**
   * 解绑帧缓冲
   * 
   * 重置渲染目标为默认帧缓冲(屏幕)。
   */
  unbind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  /**
   * 将帧缓冲内容绘制到屏幕
   * 
   * 快捷方法，解绑帧缓冲并设置视口以准备绘制到屏幕。
   */
  blitToScreen() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.width, this.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
  }

  /**
   * 获取指定索引的颜色附件纹理
   * 
   * @param index - 颜色附件索引
   * @returns 颜色附件纹理对象或null(如果索引无效)
   */
  getColorAttachment(index: number): WebGLTexture | null {
    return this.colorAttachments[index] ?? null;
  }

  /**
   * 获取深度模板附件纹理
   * 
   * @returns 深度模板附件纹理对象或null(如果未创建)
   */
  getDepthStencilAttachment(): WebGLTexture | null {
    return this.depthStencilAttachment;
  }

  /**
   * 增加引用计数
   * 
   * 当多个对象共享同一帧缓冲时，应调用此方法增加引用计数。
   */
  retain() {
    this.refCount++;
  }

  /**
   * 减少引用计数
   * 
   * 当不再需要共享帧缓冲时，应调用此方法减少引用计数。
   * 当引用计数降为0时，将自动销毁帧缓冲。
   */
  release() {
    this.refCount--;
    if (this.refCount <= 0) {
      this.destroy();
    }
  }

  /**
   * 销毁帧缓冲及其所有附件
   * 
   * 释放所有WebGL资源，包括帧缓冲对象和所有附件纹理。
   */
  destroy() {
    if (this.fbo) {
      this.gl.deleteFramebuffer(this.fbo);
      this.fbo = null;
    }
    for (const texture of this.colorAttachments) {
      this.gl.deleteTexture(texture);
    }
    if (this.depthStencilAttachment) {
      this.gl.deleteTexture(this.depthStencilAttachment);
    }
    this.colorAttachments = [];
    this.depthStencilAttachment = null;
  }
}

/**
 * 帧缓冲选项接口
 * 
 * 定义了创建和配置帧缓冲时可用的选项参数。
 */
interface FramebufferOptions {
  /** 多重采样数量，默认为0(不使用多重采样) */
  samples?: number;
  
  /** 颜色附件数量，默认为1 */
  colorAttachments?: number;
  
  /** 是否创建深度模板附件，默认为false */
  depthStencil?: boolean;
}