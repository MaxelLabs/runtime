export class GLTexture {
  private static texturePool: Map<string, WebGLTexture[]> = new Map();
  private gl: WebGLRenderingContext;
  private texture: WebGLTexture | null;
  private width: number = 0;
  private height: number = 0;
  private format: number = 0;
  private type: number = 0;
  private mipmapLevels: number = 1;
  private compressed: boolean = false;
  private refCount: number;

  constructor(gl: WebGLRenderingContext, format?: number, type?: number) {
    this.gl = gl;
    if (format !== undefined) this.format = format;
    if (type !== undefined) this.type = type;
    this.texture = this.allocateFromPool();
    this.refCount = 1;
  }

  private allocateFromPool(): WebGLTexture | null {
    // 只有当有足够的信息来创建键时才尝试从池中分配
    if (this.format && this.type && this.width && this.height) {
      const key = `${this.format}_${this.type}_${this.width}_${this.height}`;
      if (!GLTexture.texturePool.has(key)) {
        GLTexture.texturePool.set(key, []);
      }

      const pool = GLTexture.texturePool.get(key);
      if (pool && pool.length > 0) {
        return pool.pop()!;
      }
    }
    
    // 如果没有足够的信息或池是空的，则创建一个新的纹理
    const texture = this.gl.createTexture();
    if (!texture) {
      throw new Error('Failed to create WebGL texture');
    }
    return texture;
  }

  create(width: number, height: number, format: number, type: number, options: TextureOptions = {}) {
    this.width = width;
    this.height = height;
    this.format = format;
    this.type = type;
    this.mipmapLevels = options.mipmapLevels ?? Math.floor(Math.log2(Math.max(width, height))) + 1;
    this.compressed = options.compressed ?? false;

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    
    if (this.compressed) {
      this.gl.compressedTexImage2D(
        this.gl.TEXTURE_2D,
        0,
        format,
        width,
        height,
        0,
        new Uint8Array(width * height * 4)
      );
    } else {
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        format,
        width,
        height,
        0,
        format,
        type,
        null
      );
    }

    this.setTextureParameters(options);
  }

  private setTextureParameters(options: TextureOptions) {
    const {
      minFilter = this.gl.LINEAR,
      magFilter = this.gl.LINEAR,
      wrapS = this.gl.CLAMP_TO_EDGE,
      wrapT = this.gl.CLAMP_TO_EDGE,
      generateMipmaps = true
    } = options;

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, minFilter);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, magFilter);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, wrapS);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, wrapT);

    if (generateMipmaps && !this.compressed) {
      this.gl.generateMipmap(this.gl.TEXTURE_2D);
    }
  }

  upload(data: TexImageSource | ArrayBufferView, level: number = 0) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    
    if (this.compressed) {
      this.gl.compressedTexSubImage2D(
        this.gl.TEXTURE_2D,
        level,
        0, 0,
        this.width >> level,
        this.height >> level,
        this.format,
        data as ArrayBufferView
      );
    } else {
      if (data instanceof Uint8Array || data instanceof Uint16Array || data instanceof Uint32Array ||
          data instanceof Int8Array || data instanceof Int16Array || data instanceof Int32Array ||
          data instanceof Float32Array || data instanceof Float64Array) {
        this.gl.texSubImage2D(
          this.gl.TEXTURE_2D,
          level,
          0, 0,
          this.width >> level,
          this.height >> level,
          this.format,
          this.type,
          data
        );
      } else {
        this.gl.texSubImage2D(
          this.gl.TEXTURE_2D,
          level,
          0, 0,
          this.width >> level,
          this.height >> level,
          this.format,
          this.type,
          null
        );
        this.gl.texImage2D(
          this.gl.TEXTURE_2D,
          level,
          this.format,
          this.format,
          this.type,
          data as TexImageSource
        );
      }
    }
  }

  bind(unit: number = 0) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  }

  unbind() {
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  getTexture(): WebGLTexture {
    if (!this.texture) {
      throw new Error('Texture not created');
    }
    return this.texture;
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

  private recycle(): void {
    const key = `${this.format}_${this.type}_${this.width}_${this.height}`;
    const pool = GLTexture.texturePool.get(key);
    if (pool && this.texture) {
      pool.push(this.texture);
    }
  }

  destroy() {
    if (this.texture) {
      this.recycle();
      this.texture = null;
    }
  }

  static clearPool() {
    GLTexture.texturePool.clear();
  }
}

interface TextureOptions {
  mipmapLevels?: number;
  minFilter?: number;
  magFilter?: number;
  wrapS?: number;
  wrapT?: number;
  generateMipmaps?: boolean;
  compressed?: boolean;
}