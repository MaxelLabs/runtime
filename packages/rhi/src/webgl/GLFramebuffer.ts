import { GLTexture } from './GLTexture';

export class GLFramebuffer {
  private gl: WebGLRenderingContext;
  private fbo: WebGLFramebuffer | null;
  private colorAttachments: WebGLTexture[];
  private depthStencilAttachment: WebGLTexture | null;
  private width: number;
  private height: number;
  private samples: number;
  private refCount: number;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.fbo = this.gl.createFramebuffer();
    this.colorAttachments = [];
    this.depthStencilAttachment = null;
    this.width = 0;
    this.height = 0;
    this.samples = 0;
    this.refCount = 1;
  }

  create(width: number, height: number, options: FramebufferOptions) {
    this.width = width;
    this.height = height;
    this.samples = options.samples ?? 0;

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);

    if (this.samples > 0) {
      this.createMultisampleColorAttachments(width, height, options.colorAttachments);
    } else {
      this.createColorAttachments(width, height, options.colorAttachments);
    }

    if (options.depthStencil) {
      this.createDepthStencilAttachment(width, height);
    }

    this.checkStatus();
  }

  private createMultisampleColorAttachments(width: number, height: number, colorAttachments: number) {
    for (let i = 0; i < colorAttachments; i++) {
      const texture = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D_MULTISAMPLE, texture);
      this.gl.texStorage2DMultisample(
        this.gl.TEXTURE_2D_MULTISAMPLE,
        this.samples,
        this.gl.RGBA8,
        width,
        height,
        true
      );
      this.colorAttachments.push(texture!);
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0 + i,
        this.gl.TEXTURE_2D_MULTISAMPLE,
        texture,
        0
      );
    }
  }

  private createColorAttachments(width: number, height: number, colorAttachments: number) {
    for (let i = 0; i < colorAttachments; i++) {
      const texture = new GLTexture(this.gl);
      texture.create(width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE);
      this.colorAttachments.push(texture.getTexture());
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0 + i,
        this.gl.TEXTURE_2D,
        texture.getTexture(),
        0
      );
    }
  }

  private createDepthStencilAttachment(width: number, height: number) {
    const texture = new GLTexture(this.gl);
    texture.create(width, height, this.gl.DEPTH24_STENCIL8, this.gl.UNSIGNED_INT_24_8);
    this.depthStencilAttachment = texture.getTexture();
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.DEPTH_STENCIL_ATTACHMENT,
      this.gl.TEXTURE_2D,
      texture.getTexture(),
      0
    );
  }

  private checkStatus() {
    const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
    if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Framebuffer is not complete: ${status}`);
    }
  }

  bind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
  }

  unbind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  blitToScreen() {
    this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.fbo);
    this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, null);
    this.gl.blitFramebuffer(
      0, 0, this.width, this.height,
      0, 0, this.width, this.height,
      this.gl.COLOR_BUFFER_BIT,
      this.gl.NEAREST
    );
  }

  getColorAttachment(index: number): WebGLTexture | null {
    return this.colorAttachments[index] ?? null;
  }

  getDepthStencilAttachment(): WebGLTexture | null {
    return this.depthStencilAttachment;
  }

  retain() {
    this.refCount++;
  }

  release() {
    this.refCount--;
    if (this.refCount <= 0) {
      this.destroy();
    }
  }

  destroy() {
    if (this.fbo) {
      this.gl.deleteFramebuffer(this.fbo);
      this.fbo = null;
    }
    for (const texture of this.colorAttachments) {
      this.gl.deleteTexture(texture);
    }
    if (this.depthStencilAttachment) {
      this.gl.deleteTexture(this.depthStencilAttachment);
    }
    this.colorAttachments = [];
    this.depthStencilAttachment = null;
  }
}

interface FramebufferOptions {
  samples?: number;
  colorAttachments?: number;
  depthStencil?: boolean;
}