export class GLVertexArray {
  private gl!: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject | null = null;
  private attributes: Map<string, number> = new Map();

  constructor (gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  create (): void {
    this.vao = this.gl.createVertexArray();
    if (!this.vao) {
      throw new Error('Failed to create WebGL vertex array object');
    }
  }

  destroy (): void {
    if (this.vao) {
      this.gl.deleteVertexArray(this.vao);
      this.vao = null;
    }
    this.attributes.clear();
  }

  bind (): void {
    if (!this.vao) {
      throw new Error('Vertex array object not created');
    }
    this.gl.bindVertexArray(this.vao);
  }

  unbind (): void {
    this.gl.bindVertexArray(null);
  }

  setAttribute (
    name: string,
    buffer: WebGLBuffer,
    size: number,
    type: number,
    normalized: boolean,
    stride: number,
    offset: number
  ): void {
    if (!this.vao) {
      throw new Error('Vertex array object not created');
    }
    this.bind();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    const location = this.attributes.get(name);

    if (location === undefined) {
      // 如果没有找到属性位置，尝试从当前着色器程序中查找
      const currentProgram = this.gl.getParameter(this.gl.CURRENT_PROGRAM);
      if (currentProgram) {
        const attribLocation = this.gl.getAttribLocation(currentProgram, name);
        if (attribLocation >= 0) {
          this.setAttributeLocation(name, attribLocation);
          this.gl.enableVertexAttribArray(attribLocation);
          this.gl.vertexAttribPointer(attribLocation, size, type, normalized, stride, offset);
          this.unbind();
          return;
        }
      }
      throw new Error(`Attribute ${name} not found in the current shader program`);
    }
    
    this.gl.enableVertexAttribArray(location);
    this.gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
    this.unbind();
  }

  setAttributeLocation (name: string, location: number): void {
    this.attributes.set(name, location);
  }

  getAttributeLocation (name: string): number {
    const location = this.attributes.get(name);

    if (location === undefined) {
      throw new Error(`Attribute ${name} not found`);
    }

    return location;
  }
}