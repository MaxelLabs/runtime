import type { IShader } from '@maxellabs/core';

/**
 * WebGL着色器程序包装类
 * 
 * 该类封装了WebGL着色器程序的创建、编译、链接和使用过程，并提供了设置统一变量(uniforms)和获取属性位置(attribute locations)的方法。
 * 包含了统一变量缓存优化，避免重复设置相同的uniform值。
 * 
 * @implements {IShader} 着色器接口
 */
export class GLShader implements IShader {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private uniformCache: Map<string, any>;
  private attributeLocations: Map<string, number>;
  private uniformLocations: Map<string, WebGLUniformLocation>;
  public vertexSource: string = '';
  public fragmentSource: string = '';

  /**
   * 创建着色器程序包装器实例
   * @param gl - WebGL渲染上下文
   */
  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.uniformCache = new Map();
    this.attributeLocations = new Map();
    this.uniformLocations = new Map();
  }

  /**
   * 从顶点着色器源代码和片元着色器源代码创建WebGL着色器程序
   * @param vertexSource - 顶点着色器GLSL源代码
   * @param fragmentSource - 片元着色器GLSL源代码
   * @throws {Error} 如果着色器编译或程序链接失败
   */
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

  /**
   * 编译单个着色器
   * @param source - 着色器GLSL源代码
   * @param type - 着色器类型 (gl.VERTEX_SHADER 或 gl.FRAGMENT_SHADER)
   * @returns 编译好的WebGL着色器对象
   * @throws {Error} 如果着色器创建或编译失败
   * @private
   */
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

  /**
   * 查询并缓存着色器程序中的所有uniform变量位置
   * @private
   */
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

  /**
   * 查询并缓存着色器程序中的所有attribute变量位置
   * @private
   */
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

  /**
   * 使用当前着色器程序
   * @throws {Error} 如果着色器程序未创建
   */
  use(): void {
    if (!this.program) {
      throw new Error('Shader program not created');
    }
    this.gl.useProgram(this.program);
  }

  /**
   * 绑定着色器程序（等同于use方法）
   */
  bind(): void {
    this.use();
  }

  /**
   * 解绑着色器程序
   */
  unbind(): void {
    this.gl.useProgram(null);
  }

  /**
   * 设置通用uniform变量值
   * 如果值与之前设置的值相同，则跳过WebGL调用，减少状态切换
   * @param name - uniform变量名
   * @param value - 要设置的值
   */
  setUniform(name: string, value: any): void {
    if (!this.program) return;

    const location = this.uniformLocations.get(name);
    if (!location) return;

    if (this.uniformCache.get(name) !== value) {
      this.updateUniform(location, value);
      this.uniformCache.set(name, value);
    }
  }

  /**
   * 设置浮点型uniform变量
   * @param name - uniform变量名
   * @param value - 浮点数值
   */
  setUniform1f(name: string, value: number): void {
    this.setUniform(name, value);
  }

  /**
   * 设置二维向量uniform变量
   * @param name - uniform变量名
   * @param x - x分量
   * @param y - y分量
   */
  setUniform2f(name: string, x: number, y: number): void {
    this.setUniform(name, new Float32Array([x, y]));
  }

  /**
   * 设置三维向量uniform变量
   * @param name - uniform变量名
   * @param x - x分量
   * @param y - y分量
   * @param z - z分量
   */
  setUniform3f(name: string, x: number, y: number, z: number): void {
    this.setUniform(name, new Float32Array([x, y, z]));
  }

  /**
   * 设置四维向量uniform变量
   * @param name - uniform变量名
   * @param x - x分量
   * @param y - y分量
   * @param z - z分量
   * @param w - w分量
   */
  setUniform4f(name: string, x: number, y: number, z: number, w: number): void {
    this.setUniform(name, new Float32Array([x, y, z, w]));
  }

  /**
   * 设置整型uniform变量
   * @param name - uniform变量名
   * @param value - 整数值
   */
  setUniform1i(name: string, value: number): void {
    this.setUniform(name, value);
  }

  /**
   * 设置4x4矩阵uniform变量
   * @param name - uniform变量名
   * @param value - 包含16个元素的Float32Array表示的矩阵
   */
  setUniformMatrix4fv(name: string, value: Float32Array): void {
    this.setUniform(name, value);
  }

  /**
   * 根据值的类型更新uniform变量
   * @param location - uniform变量位置
   * @param value - 要设置的值
   * @private
   */
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

  /**
   * 获取属性变量的位置
   * @param name - 属性变量名
   * @returns 属性变量的位置，如果未找到则返回-1
   */
  getAttributeLocation(name: string): number {
    return this.attributeLocations.get(name) ?? -1;
  }

  /**
   * 释放着色器程序及相关资源
   * 在不再需要该着色器时调用此方法以避免内存泄漏
   */
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