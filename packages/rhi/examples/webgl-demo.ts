import { GLRendererFactory, GLConstants } from '../src/webgl';

export class WebGLDemo {
  private factory: typeof GLRendererFactory;
  private renderer: any;
  private shader: any;
  private vertexBuffer: any;
  private indexBuffer: any;
  private texture: any;
  private vao: any;

  constructor(canvas: HTMLCanvasElement) {
    this.factory = GLRendererFactory;
    this.init(canvas);
  }

  private init(canvas: HTMLCanvasElement): void {
    // 创建渲染器
    this.renderer = this.factory.getInstance().createRenderer(canvas);
    
    // 创建着色器
    this.shader = this.factory.getInstance().createShader();
    
    // 创建顶点数据
    const vertices = new Float32Array([
      // 位置          // 纹理坐标  // 颜色
      -0.5, -0.5, 0,  0, 0,       1, 0, 0, 1,
       0.5, -0.5, 0,  1, 0,       0, 1, 0, 1,
       0.5,  0.5, 0,  1, 1,       0, 0, 1, 1,
      -0.5,  0.5, 0,  0, 1,       1, 1, 0, 1,
    ]);

    // 创建索引数据
    const indices = new Uint16Array([
      0, 1, 2,
      0, 2, 3,
    ]);

    // 创建顶点缓冲区
    this.vertexBuffer = this.factory.getInstance().createBuffer(
      GLConstants.BUFFER_TYPE.ARRAY_BUFFER,
      GLConstants.BUFFER_USAGE.STATIC_DRAW,
      vertices.length * 4
    );
    this.vertexBuffer.update(vertices);

    // 创建索引缓冲区
    this.indexBuffer = this.factory.getInstance().createBuffer(
      GLConstants.BUFFER_TYPE.ELEMENT_ARRAY_BUFFER,
      GLConstants.BUFFER_USAGE.STATIC_DRAW,
      indices.length * 2
    );
    this.indexBuffer.update(indices);

    // 创建纹理
    this.texture = this.factory.getInstance().createTexture(
      GLConstants.TEXTURE_FORMAT.RGBA,
      GLConstants.DATA_TYPE.UNSIGNED_BYTE
    );
    this.texture.create();
    
    // 创建测试纹理数据
    const textureData = new Uint8Array(4 * 4 * 4);
    for (let i = 0; i < textureData.length; i += 4) {
      textureData[i] = 255;     // R
      textureData[i + 1] = 0;   // G
      textureData[i + 2] = 0;   // B
      textureData[i + 3] = 255; // A
    }
    this.texture.setData(textureData, 4, 4);
    this.texture.setParameters(
      GLConstants.TEXTURE_FILTER.LINEAR,
      GLConstants.TEXTURE_FILTER.LINEAR,
      GLConstants.TEXTURE_WRAP.REPEAT,
      GLConstants.TEXTURE_WRAP.REPEAT
    );

    // 创建顶点数组对象
    this.vao = this.factory.getInstance().createVertexArray();
    this.vao.create();
    this.vao.setAttributeLocation('aPosition', 0);
    this.vao.setAttributeLocation('aTexCoord', 1);
    this.vao.setAttributeLocation('aColor', 2);

    // 设置顶点属性
    this.vao.setAttribute(
      'aPosition',
      this.vertexBuffer.getBuffer(),
      3,
      GLConstants.DATA_TYPE.FLOAT,
      false,
      9 * 4,
      0
    );
    this.vao.setAttribute(
      'aTexCoord',
      this.vertexBuffer.getBuffer(),
      2,
      GLConstants.DATA_TYPE.FLOAT,
      false,
      9 * 4,
      3 * 4
    );
    this.vao.setAttribute(
      'aColor',
      this.vertexBuffer.getBuffer(),
      4,
      GLConstants.DATA_TYPE.FLOAT,
      false,
      9 * 4,
      5 * 4
    );
  }

  public render(): void {
    // 清除画布
    this.renderer.clear();

    // 使用着色器
    this.shader.use();

    // 设置变换矩阵
    const modelViewMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
    const projectionMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
    this.shader.setUniformMatrix4fv('uModelViewMatrix', modelViewMatrix);
    this.shader.setUniformMatrix4fv('uProjectionMatrix', projectionMatrix);

    // 绑定纹理
    this.texture.bind();

    // 绑定顶点数组对象
    this.vao.bind();

    // 绑定索引缓冲区
    this.indexBuffer.bind();

    // 绘制
    this.renderer.drawIndexed(GLConstants.DRAW_MODE.TRIANGLES, 6);

    // 解绑
    this.vao.unbind();
    this.texture.unbind();
    this.indexBuffer.unbind();
  }

  public destroy(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
    }
    if (this.indexBuffer) {
      this.indexBuffer.destroy();
    }
    if (this.texture) {
      this.texture.destroy();
    }
    if (this.vao) {
      this.vao.destroy();
    }
    if (this.shader) {
      this.shader.destroy();
    }
    this.factory.getInstance().destroy();
  }
} 