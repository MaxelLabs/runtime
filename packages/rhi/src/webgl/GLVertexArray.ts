export class GLVertexArray {
  private gl: WebGLRenderingContext,
  private vao: WebGLVertexArrayObject | null = null,
  private attributes: Map<string, number> = new Map(),

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl,
  }

  create(): void {
    this.vao = this.gl.createVertexArray(),
    if (!this.vao) {
      throw new Error('Failed to create WebGL vertex array object'),
    }
  }

  destroy(): void {
    if (this.vao) {
      this.gl.deleteVertexArray(this.vao),
      this.vao = null,
    }
    this.attributes.clear(),
  }

  bind(): void {
    if (!this.vao) {
      throw new Error('Vertex array object not created'),
    }
    this.gl.bindVertexArray(this.vao),
  }

  unbind(): void {
    this.gl.bindVertexArray(null),
  }

  setAttribute(
    name: string,
    buffer: WebGLBuffer,
    size: number,
    type: number,
    normalized: boolean,
    stride: number,
    offset: number
  ): void {
    if (!this.vao) {
      throw new Error('Vertex array object not created'),
    }
    this.bind(),
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer),
    const location = this.attributes.get(name),
    if (location === undefined) {
      throw new Error(`Attribute ${name} not found`),
    }
    this.gl.enableVertexAttribArray(location),
    this.gl.vertexAttribPointer(location, size, type, normalized, stride, offset),
    this.unbind(),
  }

  setAttributeLocation(name: string, location: number): void {
    this.attributes.set(name, location),
  }

  getAttributeLocation(name: string): number {
    const location = this.attributes.get(name),
    if (location === undefined) {
      throw new Error(`Attribute ${name} not found`),
    }
    return location,
  }
} 