import { GLBuffer } from "./GLBuffer";

/**
 * WebGL 顶点数组对象(VAO)封装类
 * 
 * 封装了WebGL2中的顶点数组对象(VAO)功能，用于高效管理顶点属性状态。
 * VAO可以预先配置和存储顶点属性指针设置，减少绘制时的状态切换开销。
 * 注意：此类仅在WebGL2上下文中可用。
 */
export class GLVertexArray {
  /** WebGL2渲染上下文 */
  private gl!: WebGL2RenderingContext;
  
  /** 顶点数组对象 */
  private vao: WebGLVertexArrayObject | null = null;
  
  /** 属性位置映射表 */
  private attributes: Map<string, number> = new Map();

  /**
   * 创建顶点数组对象封装器
   * 
   * @param gl - WebGL2渲染上下文
   * @throws {Error} 如果传入的不是WebGL2上下文
   */
  constructor (gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  /**
   * 创建顶点数组对象
   * 
   * @throws {Error} 如果创建VAO失败
   */
  create (): void {
    this.vao = this.gl.createVertexArray();
    if (!this.vao) {
      throw new Error('Failed to create WebGL vertex array object');
    }
  }

  /**
   * 销毁顶点数组对象并清理资源
   */
  destroy (): void {
    if (this.vao) {
      this.gl.deleteVertexArray(this.vao);
      this.vao = null;
    }
    this.attributes.clear();
  }

  /**
   * 绑定顶点数组对象，激活其存储的状态
   * 
   * @throws {Error} 如果顶点数组对象尚未创建
   */
  bind (): void {
    if (!this.vao) {
      throw new Error('Vertex array object not created');
    }
    this.gl.bindVertexArray(this.vao);
  }

  /**
   * 解绑顶点数组对象，取消当前VAO的激活状态
   */
  unbind (): void {
    this.gl.bindVertexArray(null);
  }

  /**
   * 设置顶点属性
   * 
   * 配置顶点属性指针，并将其与指定的缓冲区关联。
   * 这些设置将被VAO记住，在后续的bind()调用中自动恢复。
   * 
   * @param name - 属性名称(对应着色器中的attribute变量名)
   * @param buffer - 包含属性数据的缓冲区
   * @param size - 每个顶点属性的组件数量(1-4)
   * @param type - 数据类型(如gl.FLOAT，gl.BYTE等)
   * @param normalized - 是否应该将非浮点数据归一化到[0,1]或[-1,1]
   * @param stride - 连续顶点属性之间的字节偏移量
   * @param offset - 缓冲区中第一个组件的字节偏移量
   * @throws {Error} 如果VAO未创建或找不到属性位置
   */
  setAttribute (
    name: string,
    buffer: GLBuffer,
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
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer.getBuffer());
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

  /**
   * 手动设置属性位置映射
   * 
   * 在VAO中为命名属性设置位置索引。这对于预先知道着色器属性位置的情况很有用，
   * 可以避免在setAttribute时查询属性位置。
   * 
   * @param name - 属性名称
   * @param location - 属性位置索引
   */
  setAttributeLocation (name: string, location: number): void {
    this.attributes.set(name, location);
  }

  /**
   * 获取属性位置
   * 
   * @param name - 属性名称
   * @returns 属性位置索引
   * @throws {Error} 如果找不到指定名称的属性
   */
  getAttributeLocation (name: string): number {
    const location = this.attributes.get(name);

    if (location === undefined) {
      throw new Error(`Attribute ${name} not found`);
    }

    return location;
  }
}