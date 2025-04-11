import type { IShader } from '@max/core';

export class GLShader implements IShader {
  private _gl: WebGLRenderingContext;
  private _program: WebGLProgram | null = null;
  private _vertexShader: WebGLShader | null = null;
  private _fragmentShader: WebGLShader | null = null;
  private _vertexSource: string = '';
  private _fragmentSource: string = '';

  constructor(gl: WebGLRenderingContext) {
    this._gl = gl;
  }

  create(vertexSource: string, fragmentSource: string): void {
    this._vertexSource = vertexSource;
    this._fragmentSource = fragmentSource;
    this._vertexShader = this._compileShader(vertexSource, this._gl.VERTEX_SHADER);
    this._fragmentShader = this._compileShader(fragmentSource, this._gl.FRAGMENT_SHADER);
    this._program = this._linkProgram();
  }

  private _compileShader(source: string, type: number): WebGLShader {
    const shader = this._gl.createShader(type)!;
    this._gl.shaderSource(shader, source);
    this._gl.compileShader(shader);

    if (!this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS)) {
      const error = this._gl.getShaderInfoLog(shader);
      this._gl.deleteShader(shader);
      throw new Error(`Failed to compile shader: ${error}`);
    }

    return shader;
  }

  private _linkProgram(): WebGLProgram {
    const program = this._gl.createProgram()!;
    this._gl.attachShader(program, this._vertexShader!);
    this._gl.attachShader(program, this._fragmentShader!);
    this._gl.linkProgram(program);

    if (!this._gl.getProgramParameter(program, this._gl.LINK_STATUS)) {
      const error = this._gl.getProgramInfoLog(program);
      this._gl.deleteProgram(program);
      throw new Error(`Failed to link program: ${error}`);
    }

    return program;
  }

  get vertexSource(): string {
    return this._vertexSource;
  }

  get fragmentSource(): string {
    return this._fragmentSource;
  }

  use(): void {
    this._gl.useProgram(this._program);
  }

  setUniform1f(name: string, value: number): void {
    const location = this._gl.getUniformLocation(this._program!, name);
    if (location) {
      this._gl.uniform1f(location, value);
    }
  }

  setUniform2f(name: string, x: number, y: number): void {
    const location = this._gl.getUniformLocation(this._program!, name);
    if (location) {
      this._gl.uniform2f(location, x, y);
    }
  }

  setUniform3f(name: string, x: number, y: number, z: number): void {
    const location = this._gl.getUniformLocation(this._program!, name);
    if (location) {
      this._gl.uniform3f(location, x, y, z);
    }
  }

  setUniform4f(name: string, x: number, y: number, z: number, w: number): void {
    const location = this._gl.getUniformLocation(this._program!, name);
    if (location) {
      this._gl.uniform4f(location, x, y, z, w);
    }
  }

  setUniform1i(name: string, value: number): void {
    const location = this._gl.getUniformLocation(this._program!, name);
    if (location) {
      this._gl.uniform1i(location, value);
    }
  }

  setUniformMatrix4fv(name: string, value: Float32Array): void {
    const location = this._gl.getUniformLocation(this._program!, name);
    if (location) {
      this._gl.uniformMatrix4fv(location, false, value);
    }
  }

  dispose(): void {
    if (this._vertexShader) {
      this._gl.deleteShader(this._vertexShader);
      this._vertexShader = null;
    }
    if (this._fragmentShader) {
      this._gl.deleteShader(this._fragmentShader);
      this._fragmentShader = null;
    }
    if (this._program) {
      this._gl.deleteProgram(this._program);
      this._program = null;
    }
  }

  destroy(): void {
    this.dispose();
  }
}