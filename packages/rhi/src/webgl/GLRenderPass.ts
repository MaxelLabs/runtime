import type { IRenderPass } from '@maxellabs/core';
import { GLRenderer } from './GLRenderer';
import { GLFramebuffer } from './GLFramebuffer';
import { GLShader } from './GLShader';

/**
 * WebGL渲染通道类
 * 
 * 封装了一个完整的WebGL渲染过程，包括帧缓冲设置、清除操作、视口设置和着色器绑定。
 * 每个渲染通道代表渲染管线中的一个独立阶段。
 * 
 * @implements {IRenderPass} 渲染通道接口
 */
export class GLRenderPass implements IRenderPass {
  /** WebGL渲染上下文 */
  private gl: WebGLRenderingContext;
  
  /** 所属的WebGL渲染器 */
  private renderer: GLRenderer;
  
  /** 当前使用的着色器 */
  private shader: GLShader | null = null;
  
  /** 目标帧缓冲对象 */
  private framebuffer: GLFramebuffer | null = null;
  
  /** 清除颜色值 [r, g, b, a] */
  private clearColor: [number, number, number, number] = [0, 0, 0, 1];
  
  /** 清除深度值 */
  private clearDepth: number = 1.0;
  
  /** 清除模板值 */
  private clearStencil: number = 0;
  
  /** 视口设置 [x, y, width, height] */
  private viewport: [number, number, number, number] = [0, 0, 0, 0];
  
  /** 渲染通道启用状态 */
  enabled: boolean = true;

  /**
   * 创建一个渲染通道
   * 
   * @param renderer - WebGL渲染器实例
   */
  constructor(renderer: GLRenderer) {
    this.renderer = renderer;
    this.gl = renderer.getGL();
    // 默认视口设置为渲染器尺寸
    this.viewport = [0, 0, renderer.width, renderer.height];
  }

  /**
   * 开始渲染通道
   * 
   * 准备渲染环境，绑定帧缓冲和设置视口
   */
  begin(): void {
    if (!this.enabled) return;
    
    // 绑定帧缓冲
    if (this.framebuffer) {
      this.framebuffer.bind();
    } else {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }
    
    // 设置视口
    this.gl.viewport(
      this.viewport[0], 
      this.viewport[1], 
      this.viewport[2], 
      this.viewport[3]
    );
    
    // 清除缓冲区
    this.clear();
    
    // 使用着色器
    if (this.shader) {
      this.shader.use();
    }
  }

  /**
   * 清除缓冲区
   * 
   * 根据设置的清除颜色、深度和模板值清除对应的缓冲区
   * @private
   */
  private clear(): void {
    let clearBits = 0;
    
    if (this.clearColor) {
      clearBits |= this.gl.COLOR_BUFFER_BIT;
      this.gl.clearColor(
        this.clearColor[0],
        this.clearColor[1],
        this.clearColor[2],
        this.clearColor[3]
      );
    }
    
    if (this.clearDepth !== null) {
      clearBits |= this.gl.DEPTH_BUFFER_BIT;
      this.gl.clearDepth(this.clearDepth);
    }
    
    if (this.clearStencil !== null) {
      clearBits |= this.gl.STENCIL_BUFFER_BIT;
      this.gl.clearStencil(this.clearStencil);
    }
    
    if (clearBits) {
      this.gl.clear(clearBits);
    }
  }

  /**
   * 执行渲染通道
   * 
   * 此方法实现IRenderPass接口的execute方法，执行与begin相同的操作
   */
  execute(): void {
    if (!this.enabled) return;
    
    // 绑定帧缓冲（如果有）
    if (this.framebuffer) {
      this.framebuffer.bind();
    } else {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }
    
    // 设置视口
    this.gl.viewport(
      this.viewport[0], 
      this.viewport[1], 
      this.viewport[2], 
      this.viewport[3]
    );
    
    // 清除缓冲区
    let clearBits = 0;
    if (this.clearColor) {
      clearBits |= this.gl.COLOR_BUFFER_BIT;
      this.gl.clearColor(
        this.clearColor[0],
        this.clearColor[1],
        this.clearColor[2],
        this.clearColor[3]
      );
    }
    if (this.clearDepth !== null) {
      clearBits |= this.gl.DEPTH_BUFFER_BIT;
      this.gl.clearDepth(this.clearDepth);
    }
    if (this.clearStencil !== null) {
      clearBits |= this.gl.STENCIL_BUFFER_BIT;
      this.gl.clearStencil(this.clearStencil);
    }
    
    if (clearBits) {
      this.gl.clear(clearBits);
    }
    
    // 使用着色器（如果有）
    if (this.shader) {
      this.shader.use();
    }
  }

  /**
   * 结束渲染通道
   * 
   * 清理渲染状态，解绑帧缓冲和着色器
   */
  end(): void {
    if (!this.enabled) return;
    
    // 解绑着色器
    if (this.shader) {
      this.shader.unbind();
    }
    
    // 解绑帧缓冲
    if (this.framebuffer) {
      this.framebuffer.unbind();
    }
  }

  /**
   * 设置目标帧缓冲
   * 
   * @param framebuffer - 帧缓冲对象，null表示默认屏幕帧缓冲
   */
  setFramebuffer(framebuffer: GLFramebuffer | null): void {
    this.framebuffer = framebuffer;
  }

  /**
   * 设置使用的着色器程序
   * 
   * @param shader - 着色器程序对象，null表示不使用着色器
   */
  setShader(shader: GLShader | null): void {
    this.shader = shader;
  }

  /**
   * 设置清除颜色
   * 
   * @param r - 红色通道值 (0-1)
   * @param g - 绿色通道值 (0-1)
   * @param b - 蓝色通道值 (0-1)
   * @param a - 透明度值 (0-1)
   */
  setClearColor(r: number, g: number, b: number, a: number): void {
    this.clearColor = [r, g, b, a];
  }

  /**
   * 设置清除深度值
   * 
   * @param depth - 深度值 (0-1)，默认为1.0
   */
  setClearDepth(depth: number): void {
    this.clearDepth = depth;
  }

  /**
   * 设置清除模板值
   * 
   * @param stencil - 模板值，默认为0
   */
  setClearStencil(stencil: number): void {
    this.clearStencil = stencil;
  }

  /**
   * 设置渲染视口
   * 
   * @param x - 视口左下角X坐标
   * @param y - 视口左下角Y坐标
   * @param width - 视口宽度
   * @param height - 视口高度
   */
  setViewport(x: number, y: number, width: number, height: number): void {
    this.viewport = [x, y, width, height];
  }

  /**
   * 获取当前帧缓冲
   * 
   * @returns 当前帧缓冲对象或null
   */
  getFramebuffer(): GLFramebuffer | null {
    return this.framebuffer;
  }

  /**
   * 获取当前着色器
   * 
   * @returns 当前着色器对象或null
   */
  getShader(): GLShader | null {
    return this.shader;
  }

  /**
   * 释放资源
   * 
   * 清理渲染通道资源，但不会销毁外部传入的着色器和帧缓冲
   */
  dispose(): void {
    this.shader = null;
    this.framebuffer = null;
  }
}