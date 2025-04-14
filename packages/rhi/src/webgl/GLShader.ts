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
    if (!this.program) {
      console.warn(`Shader program not created when setting uniform ${name}`);
      return;
    }

    // 确保当前使用的是正确的着色器程序
    const currentProgram = this.gl.getParameter(this.gl.CURRENT_PROGRAM);
    if (currentProgram !== this.program) {
      console.warn(`Wrong shader program active when setting uniform ${name}`);
      this.use();
    }

    const location = this.uniformLocations.get(name);
    if (location === undefined) {
      console.warn(`Uniform ${name} not found in shader program`);
      return;
    }

    // 检查缓存，避免重复设置相同的值
    const cachedValue = this.uniformCache.get(name);
    if (value instanceof Float32Array) {
      // 对于Float32Array，我们需要逐个比较元素
      const cached = cachedValue instanceof Float32Array &&
        cachedValue.length === value.length &&
        cachedValue.every((v, i) => v === value[i]);
      if (cached) return;
    } else if (cachedValue === value) {
      return;
    }

    this.updateUniform(location, value);
    
    // 更新缓存
    if (value instanceof Float32Array) {
      this.uniformCache.set(name, new Float32Array(value));
    } else {
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
    try {

      if (value instanceof Float32Array) {
        // 检查数据是否包含NaN或Infinity
        if (value.some(v => !Number.isFinite(v))) {
          console.error('Matrix contains invalid values (NaN or Infinity)');
          return;
        }

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
          default:
            console.warn(`Unsupported Float32Array length: ${value.length}`);
            return;
        }
      } else if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
          console.error('Uniform value is not a finite number');
          return;
        }

        // 检查是否为整数
        if (Number.isInteger(value)) {
          this.gl.uniform1i(location, value);
        } else {
          this.gl.uniform1f(location, value);
        }
      } else if (typeof value === 'boolean') {
        this.gl.uniform1i(location, value ? 1 : 0);
      } else if (value instanceof Int32Array) {
        switch (value.length) {
          case 1:
            this.gl.uniform1iv(location, value);
            break;
          case 2:
            this.gl.uniform2iv(location, value);
            break;
          case 3:
            this.gl.uniform3iv(location, value);
            break;
          case 4:
            this.gl.uniform4iv(location, value);
            break;
          default:
            console.warn(`Unsupported Int32Array length: ${value.length}`);
            return;
        }
      } else {
        console.warn(`Unsupported uniform value type: ${typeof value}`);
        return;
      }

      const error = this.gl.getError();
      if (error !== this.gl.NO_ERROR) {
        console.error(`WebGL error after setting uniform: 0x${error.toString(16)}`);
        console.error('Value:', value);
        if (value instanceof Float32Array || value instanceof Int32Array) {
          console.error('Array contents:', Array.from(value));
        }
      }
    } catch (e) {
      console.error(`Error setting uniform: ${e}`);
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