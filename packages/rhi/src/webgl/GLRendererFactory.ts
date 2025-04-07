import { GLRenderer } from './GLRenderer';
import { GLBuffer } from './GLBuffer';
import { GLShader } from './GLShader';
import { GLTexture } from './GLTexture';
import { GLVertexArray } from './GLVertexArray';
import { GLFramebuffer } from './GLFramebuffer';
import { GLState } from './GLState';
import { GLConstants } from './GLConstants';
import { GLShaderConstants } from './GLShaderConstants';

export class GLRendererFactory {
  private static instance: GLRendererFactory | null = null;
  private renderer: GLRenderer | null = null;
  private shader: GLShader | null = null;
  private postProcessShader: GLShader | null = null;
  private state: GLState | null = null;

  private constructor() {}

  static getInstance(): GLRendererFactory {
    if (!GLRendererFactory.instance) {
      GLRendererFactory.instance = new GLRendererFactory(),
    }
    return GLRendererFactory.instance;
  }

  createRenderer(canvas: HTMLCanvasElement): GLRenderer {
    if (!this.renderer) {
      this.renderer = new GLRenderer(),
      this.renderer.create(canvas),
      this.state = new GLState(this.renderer.getGL()),
      this.state.reset();
    }
    return this.renderer;
  }

  createShader(): GLShader {
    if (!this.shader) {
      if (!this.renderer) {
        throw new Error('Renderer not created'),
      }
      this.shader = new GLShader(this.renderer.getGL()),
      this.shader.create(
        GLShaderConstants.VERTEX_SHADER,
        GLShaderConstants.FRAGMENT_SHADER
      ),
    }
    return this.shader,
  }

  createPostProcessShader(): GLShader {
    if (!this.postProcessShader) {
      if (!this.renderer) {
        throw new Error('Renderer not created');
      }
      this.postProcessShader = new GLShader(this.renderer.gl);
      this.postProcessShader.create(
        GLShaderConstants.POST_PROCESS_VERTEX_SHADER,
        GLShaderConstants.POST_PROCESS_FRAGMENT_SHADER
      );
    }
    return this.postProcessShader,
  }

  createBuffer(type: number, usage: number, size: number): GLBuffer {
    if (!this.renderer) {
      throw new Error('Renderer not created'),
    }
    return this.renderer.createBuffer(type, usage, size),
  }

  createTexture(format: number, type: number): GLTexture {
    if (!this.renderer) {
      throw new Error('Renderer not created'),
    }
    return new GLTexture(this.renderer.getGL(), format, type),
  }

  createVertexArray(): GLVertexArray {
    if (!this.renderer) {
      throw new Error('Renderer not created'),
    }
    return new GLVertexArray(this.renderer.getGL()),
  }

  createFramebuffer(width: number, height: number): GLFramebuffer {
    if (!this.renderer) {
      throw new Error('Renderer not created'),
    }
    return new GLFramebuffer(this.renderer.getGL()),
  }

  getState(): GLState {
    if (!this.state) {
      throw new Error('State not created'),
    }
    return this.state,
  }

  destroy(): void {
    if (this.shader) {
      this.shader.destroy(),
      this.shader = null,
    }
    if (this.postProcessShader) {
      this.postProcessShader.destroy(),
      this.postProcessShader = null,
    }
    if (this.renderer) {
      this.renderer.destroy(),
      this.renderer = null,
    }
    this.state = null,
  }
} 