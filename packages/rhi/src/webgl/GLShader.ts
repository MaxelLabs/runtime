import type { IShader } from '@max/core';

export class GLShader implements IShader {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private uniformCache: Map<string, any>;
  private attributeLocations: Map<string, number>;
  private uniformLocations: Map<string, WebGLUniformLocation>;
  public vertexSource: string = '';
  public fragmentSource: string = '';

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.uniformCache = new Map();
    this.attributeLocations = new Map();
    this.uniformLocations = new Map();
  }

  create(vertexSource: string, fragmentSource: string): void {
    const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);

    this.program = this.gl.createProgram();
    if (!this.program) {
      throw new Error('Failed to create shader program');
    }

    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      const error = this.gl.getProgramInfoLog(this.program);
      this.gl.deleteProgram(this.program);
      throw new Error(`Failed to link shader program: ${error}`);
    }

    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    this.queryUniforms();
    this.queryAttributes();
  }

  private compileShader(source: string, type: number): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) {
      throw new Error('Failed to create shader');
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Failed to compile shader: ${error}`);
    }

    return shader;
  }

  private queryUniforms(): void {
    if (!this.program) return;

    const numUniforms = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < numUniforms; i++) {
      const info = this.gl.getActiveUniform(this.program, i);
      if (info) {
        const location = this.gl.getUniformLocation(this.program, info.name);
        if (location) {
          this.uniformLocations.set(info.name, location);
        }
      }
    }
  }

  private queryAttributes(): void {
    if (!this.program) return;

    const numAttributes = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < numAttributes; i++) {
      const info = this.gl.getActiveAttrib(this.program, i);
      if (info) {
        const location = this.gl.getAttribLocation(this.program, info.name);
        this.attributeLocations.set(info.name, location);
      }
    }
  }

  use(): void {
    if (!this.program) {
      throw new Error('Shader program not created');
    }
    this.gl.useProgram(this.program);
  }

  bind(): void {
    this.use();
  }

  unbind(): void {
    this.gl.useProgram(null);
  }

  setUniform(name: string, value: any): void {
    if (!this.program) return;

    const location = this.uniformLocations.get(name);
    if (!location) return;

    if (this.uniformCache.get(name) !== value) {
      this.updateUniform(location, value);
      this.uniformCache.set(name, value);
    }
  }

  setUniform1f(name: string, value: number): void {
    this.setUniform(name, value);
  }

  setUniform2f(name: string, x: number, y: number): void {
    this.setUniform(name, new Float32Array([x, y]));
  }

  setUniform3f(name: string, x: number, y: number, z: number): void {
    this.setUniform(name, new Float32Array([x, y, z]));
  }

  setUniform4f(name: string, x: number, y: number, z: number, w: number): void {
    this.setUniform(name, new Float32Array([x, y, z, w]));
  }

  setUniform1i(name: string, value: number): void {
    this.setUniform(name, value);
  }

  setUniformMatrix4fv(name: string, value: Float32Array): void {
    this.setUniform(name, value);
  }

  private updateUniform(location: WebGLUniformLocation, value: any): void {
    if (value instanceof Float32Array) {
      switch (value.length) {
        case 1:
          this.gl.uniform1fv(location, value);
          break;
        case 2:
          this.gl.uniform2fv(location, value);
          break;
        case 3:
          this.gl.uniform3fv(location, value);
          break;
        case 4:
          this.gl.uniform4fv(location, value);
          break;
        case 9:
          this.gl.uniformMatrix3fv(location, false, value);
          break;
        case 16:
          this.gl.uniformMatrix4fv(location, false, value);
          break;
      }
    } else if (typeof value === 'number') {
      this.gl.uniform1f(location, value);
    } else if (typeof value === 'boolean') {
      this.gl.uniform1i(location, value ? 1 : 0);
    }
  }

  getAttributeLocation(name: string): number {
    return this.attributeLocations.get(name) ?? -1;
  }

  dispose(): void {
    if (this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
    this.uniformCache.clear();
    this.attributeLocations.clear();
    this.uniformLocations.clear();
  }
}