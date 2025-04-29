/**
 * WebGL纹理资源管理类
 * 
 * 封装了WebGL纹理对象的创建、绑定、更新和销毁流程，支持2D纹理、压缩纹理和多级纹理(mipmap)。
 * 提供引用计数和资源池机制，优化纹理资源的重用和管理，减少内存消耗和提高性能。
 */
export class GLTexture {
  /** 静态纹理池，用于复用具有相同规格的纹理对象 */
  private static texturePool: Map<string, WebGLTexture[]> = new Map();
  
  /** WebGL渲染上下文 */
  private gl: WebGLRenderingContext;
  
  /** 纹理对象 */
  private texture: WebGLTexture | null;
  
  /** 纹理宽度 */
  private width: number = 0;
  
  /** 纹理高度 */
  private height: number = 0;
  
  /** 纹理像素格式(RGB, RGBA等) */
  private format: number = 0;
  
  /** 纹理数据类型(UNSIGNED_BYTE等) */
  private type: number = 0;
  
  /** 纹理mipmap级别数量 */
  private mipmapLevels: number = 1;
  
  /** 是否为压缩纹理 */
  private compressed: boolean = false;
  
  /** 引用计数，用于资源管理 */
  private refCount: number;

  /**
   * 创建WebGL纹理对象
   * 
   * @param gl - WebGL渲染上下文
   * @param format - 纹理像素格式，可选，例如gl.RGB, gl.RGBA
   * @param type - 纹理数据类型，可选，例如gl.UNSIGNED_BYTE
   */
  constructor(gl: WebGLRenderingContext, format?: number, type?: number) {
    this.gl = gl;
    if (format !== undefined) this.format = format;
    if (type !== undefined) this.type = type;
    this.texture = this.allocateFromPool();
    this.refCount = 1;
  }

  /**
   * 从纹理池中分配或创建新纹理
   * 
   * 尝试从池中获取符合当前规格的纹理对象，如果没有则创建新的。
   * 这种池化机制可以减少纹理创建和销毁的开销，提高效率。
   * 
   * @returns 分配的WebGL纹理对象
   * @throws {Error} 如果创建纹理失败
   * @private
   */
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

  /**
   * 创建纹理并设置基本参数
   * 
   * 初始化纹理对象，分配存储空间并设置纹理参数。
   * 
   * @param width - 纹理宽度(像素)
   * @param height - 纹理高度(像素)
   * @param format - 纹理像素格式，例如gl.RGB, gl.RGBA
   * @param type - 纹理数据类型，例如gl.UNSIGNED_BYTE
   * @param options - 纹理参数选项
   */
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

  /**
   * 设置纹理参数
   * 
   * 配置纹理过滤模式、环绕模式等参数，并可选择性生成mipmap。
   * 
   * @param options - 纹理参数选项
   * @private
   */
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

  /**
   * 上传纹理数据
   * 
   * 将图像或像素数据上传到纹理对象中。支持各种数据源格式，包括TypedArray和DOM元素。
   * 
   * @param data - 纹理数据源，可以是TypedArray或TexImageSource(如Image, Canvas等)
   * @param level - mipmap层级，默认为0(基础层级)
   */
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

  /**
   * 绑定纹理到指定的纹理单元
   * 
   * @param unit - 纹理单元索引，默认为0
   */
  bind(unit: number = 0) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  }

  /**
   * 解绑纹理
   */
  unbind() {
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  /**
   * 获取原生WebGL纹理对象
   * 
   * @returns WebGL纹理对象
   * @throws {Error} 如果纹理未创建
   */
  getTexture(): WebGLTexture {
    if (!this.texture) {
      throw new Error('Texture not created');
    }
    return this.texture;
  }

  /**
   * 增加引用计数
   * 
   * 当多个对象共享同一纹理资源时，应调用此方法增加引用计数。
   */
  retain() {
    this.refCount++;
  }

  /**
   * 减少引用计数
   * 
   * 当不再需要共享纹理资源时，应调用此方法减少引用计数。
   * 当引用计数降为0时，将自动销毁纹理。
   */
  release() {
    this.refCount--;
    if (this.refCount <= 0) {
      this.destroy();
    }
  }

  /**
   * 回收纹理到纹理池
   * 
   * @private
   */
  private recycle(): void {
    const key = `${this.format}_${this.type}_${this.width}_${this.height}`;
    const pool = GLTexture.texturePool.get(key);
    if (pool && this.texture) {
      pool.push(this.texture);
    }
  }

  /**
   * 销毁纹理对象
   * 
   * 释放纹理资源，但不会真正删除WebGL纹理对象，而是将其回收到纹理池中以便复用。
   */
  destroy() {
    if (this.texture) {
      this.recycle();
      this.texture = null;
    }
  }

  /**
   * 清空纹理池
   * 
   * 释放所有池化纹理资源，通常在应用程序退出或WebGL上下文丢失时调用。
   */
  static clearPool() {
    GLTexture.texturePool.clear();
  }
}

/**
 * 纹理选项接口
 * 
 * 定义了创建和配置纹理时可用的选项参数。
 */
interface TextureOptions {
  /** mipmap层级数量 */
  mipmapLevels?: number;
  
  /** 缩小过滤模式 */
  minFilter?: number;
  
  /** 放大过滤模式 */
  magFilter?: number;
  
  /** 水平环绕模式 */
  wrapS?: number;
  
  /** 垂直环绕模式 */
  wrapT?: number;
  
  /** 是否自动生成mipmap */
  generateMipmaps?: boolean;
  
  /** 是否为压缩纹理 */
  compressed?: boolean;
}