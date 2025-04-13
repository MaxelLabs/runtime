import type { IPipelineContext } from '@max/core';
import type { Vector2, Vector3, Color } from '@max/math';
import { GLShader } from './GLShader';

export class GLPipelineContext implements IPipelineContext {
  private gl: WebGLRenderingContext;
  private shader: GLShader;
  isReady: boolean;

  constructor(gl: WebGLRenderingContext, shader: GLShader) {
    this.gl = gl;
    this.shader = shader;
    this.isReady = true;
  }

  dispose(): void {
    if (this.shader) {
      this.shader.dispose();
    }
    this.isReady = false;
  }

  setFloat(uniformName: string, value: number): void {
    this.shader.setUniform1f(uniformName, value);
  }

  setInt(uniformName: string, value: number): void {
    this.shader.setUniform1i(uniformName, value);
  }

  setVec2(uniformName: string, value: Vector2): void {
    this.shader.setUniform2f(uniformName, value.x, value.y);
  }

  setVec3(uniformName: string, value: Vector3): void {
    this.shader.setUniform3f(uniformName, value.x, value.y, value.z);
  }

  setVec4(uniformName: string, value: Color): void {
    this.shader.setUniform4f(uniformName, value.r, value.g, value.b, value.a);
  }
}