import type { IRenderPass } from '@max/core';
import { GLRenderer } from './GLRenderer';
import { GLFramebuffer } from './GLFramebuffer';
import { GLShader } from './GLShader';

export class GLRenderPass implements IRenderPass {
  private gl: WebGLRenderingContext;
  private renderer: GLRenderer;
  private shader: GLShader | null = null;
  private framebuffer: GLFramebuffer | null = null;
  private clearColor: [number, number, number, number] = [0, 0, 0, 1];
  private clearDepth: number = 1.0;
  private clearStencil: number = 0;
  private viewport: [number, number, number, number] = [0, 0, 0, 0];
  
  enabled: boolean = true;

  constructor(renderer: GLRenderer) {
    this.renderer = renderer;
    this.gl = renderer.getGL();
    // 默认视口设置为渲染器尺寸
    this.viewport = [0, 0, renderer.width, renderer.height];
  }
    begin(): void {
        throw new Error('Method not implemented.');
    }
    end(): void {
        throw new Error('Method not implemented.');
    }
    dispose(): void {
        throw new Error('Method not implemented.');
    }

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

  setFramebuffer(framebuffer: GLFramebuffer | null): void {
    this.framebuffer = framebuffer;
  }

  setShader(shader: GLShader | null): void {
    this.shader = shader;
  }

  setClearColor(r: number, g: number, b: number, a: number): void {
    this.clearColor = [r, g, b, a];
  }

  setClearDepth(depth: number): void {
    this.clearDepth = depth;
  }

  setClearStencil(stencil: number): void {
    this.clearStencil = stencil;
  }

  setViewport(x: number, y: number, width: number, height: number): void {
    this.viewport = [x, y, width, height];
  }

  getFramebuffer(): GLFramebuffer | null {
    return this.framebuffer;
  }

  getShader(): GLShader | null {
    return this.shader;
  }
}