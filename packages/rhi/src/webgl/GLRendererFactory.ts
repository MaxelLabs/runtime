import type { IRenderer, IBuffer, IShader } from '@maxellabs/core';
import { GLRenderer } from './GLRenderer';
import { GLShader } from './GLShader';
import { GLBuffer } from './GLBuffer';
import { GLTexture } from './GLTexture';
import { GLVertexArray } from './GLVertexArray';
import { GLFramebuffer } from './GLFramebuffer';
import { GLState } from './GLState';
import { GLShaderConstants } from './GLShaderConstants';

export class GLRendererFactory {
  private static _instance: GLRendererFactory;
  private _renderer: GLRenderer;
  private shader: GLShader | null = null;
  private postProcessShader: GLShader | null = null;
  private state: GLState | null = null;

  private constructor() {
    this._renderer = new GLRenderer();
  }

  static getInstance(): GLRendererFactory {
    if (!GLRendererFactory._instance) {
      GLRendererFactory._instance = new GLRendererFactory();
    }
    return GLRendererFactory._instance;
  }

  createRenderer(canvas: HTMLCanvasElement): IRenderer {
    this._renderer.create(canvas);
    this.state = new GLState(this._renderer.getGL());
    this.state.reset();
    return this._renderer;
  }

  createShader(vertexSource: string, fragmentSource: string): IShader {
    const shader = new GLShader(this._renderer.getGL());
    shader.create(vertexSource, fragmentSource);
    return shader;
  }

  createPostProcessShader(): GLShader {
    if (!this.postProcessShader) {
      this.postProcessShader = new GLShader(this._renderer.getGL());
      this.postProcessShader.create(
        GLShaderConstants.POST_PROCESS_VERTEX_SHADER,
        GLShaderConstants.POST_PROCESS_FRAGMENT_SHADER
      );
    }
    return this.postProcessShader;
  }

  createBuffer(type: number, usage: number, size: number): IBuffer {
    return new GLBuffer(this._renderer.getGL(), type, usage, size);
  }

  createTexture(format: number, type: number): GLTexture {
    return new GLTexture(this._renderer.getGL(), format, type);
  }

  createVertexArray(): GLVertexArray {
    return new GLVertexArray(this._renderer.getGL());
  }

  createFramebuffer(width: number, height: number): GLFramebuffer {
    return new GLFramebuffer(this._renderer.getGL());
  }

  getState(): GLState {
    if (!this.state) {
      throw new Error('State not created');
    }
    return this.state;
  }

  getRenderer(): IRenderer {
    return this._renderer;
  }

  destroy(): void {
    if (this.shader) {
      this.shader.dispose();
      this.shader = null;
    }
    if (this.postProcessShader) {
      this.postProcessShader.dispose();
      this.postProcessShader = null;
    }
    if (this._renderer) {
      this._renderer.dispose();
    }
    this.state = null;
  }
}