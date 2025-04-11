import { GLTexture } from './GLTexture';

export class GLFramebuffer {
  private gl!: WebGLRenderingContext;
  private fbo: WebGLFramebuffer | null = null;
  private colorTexture: GLTexture | null = null;
  private depthTexture: GLTexture | null = null;
  private width: number = 0;
  private height: number = 0;

  constructor (gl: WebGLRenderingContext) {
    this.gl = gl;
  }

  create (width: number, height: number): void {
    this.width = width;
    this.height = height;

    // 创建帧缓冲对象
    this.fbo = this.gl.createFramebuffer();
    if (!this.fbo) {
      throw new Error('Failed to create WebGL framebuffer');
    }

    // 创建颜色附件
    this.colorTexture = new GLTexture(
      this.gl,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE
    );
    this.colorTexture.create();
    this.colorTexture.setData(new Uint8Array(width * height * 4), width, height);
    this.colorTexture.setParameters(
      this.gl.LINEAR,
      this.gl.LINEAR,
      this.gl.CLAMP_TO_EDGE,
      this.gl.CLAMP_TO_EDGE
    );

    // 创建深度附件
    this.depthTexture = new GLTexture(
      this.gl,
      this.gl.DEPTH_COMPONENT,
      this.gl.UNSIGNED_INT
    );
    this.depthTexture.create();
    this.depthTexture.setData(
      null,
      width,
      height
    );
    this.depthTexture.setParameters(
      this.gl.NEAREST,
      this.gl.NEAREST,
      this.gl.CLAMP_TO_EDGE,
      this.gl.CLAMP_TO_EDGE
    );

    // 绑定帧缓冲对象
    this.bind();

    // 附加颜色附件
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      this.colorTexture.getTexture(),
      0
    );

    // 附加深度附件
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.DEPTH_ATTACHMENT,
      this.gl.TEXTURE_2D,
      this.depthTexture.getTexture(),
      0
    );

    // 检查帧缓冲完整性
    if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('Framebuffer is not complete');
    }

    this.unbind();
  }

  destroy (): void {
    if (this.fbo) {
      this.gl.deleteFramebuffer(this.fbo);
      this.fbo = null;
    }
    if (this.colorTexture) {
      this.colorTexture.destroy();
      this.colorTexture = null;
    }
    if (this.depthTexture) {
      this.depthTexture.destroy();
      this.depthTexture = null;
    }
  }

  bind (): void {
    if (!this.fbo) {
      throw new Error('Framebuffer not created');
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
  }

  unbind (): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  getColorTexture (): GLTexture {
    if (!this.colorTexture) {
      throw new Error('Color texture not created');
    }
    return this.colorTexture;
  }

  getDepthTexture (): GLTexture {
    if (!this.depthTexture) {
      throw new Error('Depth texture not created');
    }
    return this.depthTexture;
  }

  getWidth (): number {
    return this.width;
  }

  getHeight (): number {
    return this.height;
  }
}