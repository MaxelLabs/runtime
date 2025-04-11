export class GLTexture {
  private gl!: WebGLRenderingContext;
  private texture: WebGLTexture | null = null;
  private width: number = 0;
  private height: number = 0;
  private format!: number;
  private type!: number;

  constructor (gl: WebGLRenderingContext, format: number, type: number) {
    this.gl = gl;
    this.format = format;
    this.type = type;
  }

  create (): void {
    this.texture = this.gl.createTexture();
    if (!this.texture) {
      throw new Error('Failed to create WebGL texture');
    }
  }

  destroy (): void {
    if (this.texture) {
      this.gl.deleteTexture(this.texture);
      this.texture = null;
    }
  }

  bind (unit: number = 0): void {
    if (!this.texture) {
      throw new Error('Texture not created');
    }
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  }

  unbind (): void {
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  setImage (image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): void {
    if (!this.texture) {
      throw new Error('Texture not created');
    }
    this.bind();
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.format,
      this.format,
      this.type,
      image
    );
    this.width = image.width;
    this.height = image.height;
    this.unbind();
  }

  setData (data: Uint8Array | Float32Array | null, width: number, height: number): void {
    if (!this.texture) {
      throw new Error('Texture not created');
    }
    this.bind();
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.format,
      width,
      height,
      0,
      this.format,
      this.type,
      data
    );
    this.width = width;
    this.height = height;
    this.unbind();
  }

  setParameters (minFilter: number, magFilter: number, wrapS: number, wrapT: number): void {
    if (!this.texture) {
      throw new Error('Texture not created');
    }
    this.bind();
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, minFilter);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, magFilter);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, wrapS);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, wrapT);
    this.unbind();
  }

  getTexture (): WebGLTexture {
    if (!this.texture) {
      throw new Error('Texture not created');
    }
    return this.texture;
  }

  getWidth (): number {
    return this.width;
  }

  getHeight (): number {
    return this.height;
  }
}