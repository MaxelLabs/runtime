export class GLShader {
  private gl!: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private vertexShader: WebGLShader | null = null;
  private fragmentShader: WebGLShader | null = null;

  constructor (gl: WebGLRenderingContext) {
    this.gl = gl;
  }

  create (vertexSource: string, fragmentSource: string): void {
    // 创建顶点着色器
    this.vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    if (!this.vertexShader) {
      throw new Error('Failed to create vertex shader');
    }
    this.gl.shaderSource(this.vertexShader, vertexSource);
    this.gl.compileShader(this.vertexShader);

    if (!this.gl.getShaderParameter(this.vertexShader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(this.vertexShader);

      throw new Error('Failed to compile vertex shader: ' + info);
    }

    // 创建片段着色器
    this.fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    if (!this.fragmentShader) {
      throw new Error('Failed to create fragment shader');
    }
    this.gl.shaderSource(this.fragmentShader, fragmentSource);
    this.gl.compileShader(this.fragmentShader);

    if (!this.gl.getShaderParameter(this.fragmentShader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(this.fragmentShader);

      throw new Error('Failed to compile fragment shader: ' + info);
    }

    // 创建着色器程序
    this.program = this.gl.createProgram();
    if (!this.program) {
      throw new Error('Failed to create shader program');
    }

    this.gl.attachShader(this.program, this.vertexShader);
    this.gl.attachShader(this.program, this.fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(this.program);

      throw new Error('Failed to link shader program: ' + info);
    }
  }

  destroy (): void {
    if (this.program) {
      if (this.vertexShader) {
        this.gl.detachShader(this.program, this.vertexShader);
        this.gl.deleteShader(this.vertexShader);
        this.vertexShader = null;
      }
      if (this.fragmentShader) {
        this.gl.detachShader(this.program, this.fragmentShader);
        this.gl.deleteShader(this.fragmentShader);
        this.fragmentShader = null;
      }
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
  }

  use (): void {
    if (!this.program) {
      throw new Error('Shader program not created');
    }
    this.gl.useProgram(this.program);
  }

  setUniform1f (name: string, value: number): void {
    if (!this.program) {
      throw new Error('Shader program not created');
    }
    const location = this.gl.getUniformLocation(this.program, name);

    if (location) {
      this.gl.uniform1f(location, value);
    }
  }

  setUniform2f (name: string, x: number, y: number): void {
    if (!this.program) {
      throw new Error('Shader program not created');
    }
    const location = this.gl.getUniformLocation(this.program, name);

    if (location) {
      this.gl.uniform2f(location, x, y);
    }
  }

  setUniform3f (name: string, x: number, y: number, z: number): void {
    if (!this.program) {
      throw new Error('Shader program not created');
    }
    const location = this.gl.getUniformLocation(this.program, name);

    if (location) {
      this.gl.uniform3f(location, x, y, z);
    }
  }

  setUniform4f (name: string, x: number, y: number, z: number, w: number): void {
    if (!this.program) {
      throw new Error('Shader program not created');
    }
    const location = this.gl.getUniformLocation(this.program, name);

    if (location) {
      this.gl.uniform4f(location, x, y, z, w);
    }
  }

  setUniformMatrix4fv (name: string, value: Float32Array): void {
    if (!this.program) {
      throw new Error('Shader program not created');
    }
    const location = this.gl.getUniformLocation(this.program, name);

    if (location) {
      this.gl.uniformMatrix4fv(location, false, value);
    }
  }

  setUniform1i (name: string, value: number): void {
    if (!this.program) {
      throw new Error('Shader program not created');
    }
    const location = this.gl.getUniformLocation(this.program, name);

    if (location) {
      this.gl.uniform1i(location, value);
    }
  }
}