import { ReferResource } from '../base/refer-resource';

/**
 * 纹理过滤模式
 */
export enum TextureFilter {
  /** 点过滤 */
  Point,
  /** 双线性过滤 */
  Bilinear,
  /** 三线性过滤 */
  Trilinear
}

/**
 * 纹理寻址模式
 */
export enum TextureWrapMode {
  /** 重复 */
  Repeat,
  /** 镜像重复 */
  MirroredRepeat,
  /** 边缘拉伸 */
  Clamp
}

/**
 * 纹理格式
 */
export enum TextureFormat {
  /** RGB (24位) */
  RGB,
  /** RGBA (32位) */
  RGBA,
  /** RGB浮点 (96位) */
  RGBFloat,
  /** RGBA浮点 (128位) */
  RGBAFloat,
  /** 红色通道 (8位) */
  R8,
  /** 红色通道 (16位浮点) */
  R16F,
  /** 红绿通道 (16位) */
  RG8,
  /** 深度 (16位) */
  Depth16,
  /** 深度 (24位) */
  Depth24,
  /** 深度 (32位浮点) */
  Depth32F,
  /** 深度模板 (24位深度，8位模板) */
  Depth24Stencil8,
  /** 压缩格式 - DXT1 */
  DXT1,
  /** 压缩格式 - DXT5 */
  DXT5,
  /** 未知格式 */
  Unknown
}

/**
 * 纹理类型
 */
export enum TextureType {
  /** 2D纹理 */
  Texture2D,
  /** 立方体纹理 */
  TextureCube,
  /** 渲染目标 */
  RenderTarget
}

/**
 * 纹理基类
 */
export abstract class Texture extends ReferResource {
  /** 纹理宽度 */
  protected _width: number;
  /** 纹理高度 */
  protected _height: number;
  /** 纹理格式 */
  protected _format: TextureFormat;
  /** 纹理类型 */
  protected _type: TextureType;
  /** 是否生成mipmap */
  protected _generateMipmap: boolean;
  /** 最小过滤模式 */
  protected _minFilter: TextureFilter;
  /** 最大过滤模式 */
  protected _magFilter: TextureFilter;
  /** 水平寻址模式 */
  protected _wrapS: TextureWrapMode;
  /** 垂直寻址模式 */
  protected _wrapT: TextureWrapMode;
  /** 是否为预乘alpha */
  protected _premultiplyAlpha: boolean;
  /** 是否翻转Y轴 */
  protected _flipY: boolean;
  /** 各向异性过滤级别 */
  protected _anisotropy: number;
  /** 原生纹理对象 */
  protected _nativeTexture: any = null;
  /** 是否需要更新 */
  protected _isDirty: boolean = true;

  /**
   * 创建纹理
   * @param width 纹理宽度
   * @param height 纹理高度
   * @param format 纹理格式
   * @param type 纹理类型
   */
  constructor (width: number, height: number, format: TextureFormat = TextureFormat.RGBA, type: TextureType = TextureType.Texture2D) {
    super();
    this._width = width;
    this._height = height;
    this._format = format;
    this._type = type;
    this._generateMipmap = true;
    this._minFilter = TextureFilter.Bilinear;
    this._magFilter = TextureFilter.Bilinear;
    this._wrapS = TextureWrapMode.Repeat;
    this._wrapT = TextureWrapMode.Repeat;
    this._premultiplyAlpha = false;
    this._flipY = true;
    this._anisotropy = 1;
  }

  /** 获取纹理宽度 */
  get width (): number {
    return this._width;
  }

  /** 获取纹理高度 */
  get height (): number {
    return this._height;
  }

  /** 获取纹理格式 */
  get format (): TextureFormat {
    return this._format;
  }

  /** 获取纹理类型 */
  get type (): TextureType {
    return this._type;
  }

  /** 获取是否生成mipmap */
  get generateMipmap (): boolean {
    return this._generateMipmap;
  }

  /** 设置是否生成mipmap */
  set generateMipmap (value: boolean) {
    if (this._generateMipmap !== value) {
      this._generateMipmap = value;
      this._isDirty = true;
    }
  }

  /** 获取最小过滤模式 */
  get minFilter (): TextureFilter {
    return this._minFilter;
  }

  /** 设置最小过滤模式 */
  set minFilter (value: TextureFilter) {
    if (this._minFilter !== value) {
      this._minFilter = value;
      this._isDirty = true;
    }
  }

  /** 获取最大过滤模式 */
  get magFilter (): TextureFilter {
    return this._magFilter;
  }

  /** 设置最大过滤模式 */
  set magFilter (value: TextureFilter) {
    if (this._magFilter !== value) {
      this._magFilter = value;
      this._isDirty = true;
    }
  }

  /** 获取水平寻址模式 */
  get wrapS (): TextureWrapMode {
    return this._wrapS;
  }

  /** 设置水平寻址模式 */
  set wrapS (value: TextureWrapMode) {
    if (this._wrapS !== value) {
      this._wrapS = value;
      this._isDirty = true;
    }
  }

  /** 获取垂直寻址模式 */
  get wrapT (): TextureWrapMode {
    return this._wrapT;
  }

  /** 设置垂直寻址模式 */
  set wrapT (value: TextureWrapMode) {
    if (this._wrapT !== value) {
      this._wrapT = value;
      this._isDirty = true;
    }
  }

  /** 获取是否为预乘alpha */
  get premultiplyAlpha (): boolean {
    return this._premultiplyAlpha;
  }

  /** 设置是否为预乘alpha */
  set premultiplyAlpha (value: boolean) {
    if (this._premultiplyAlpha !== value) {
      this._premultiplyAlpha = value;
      this._isDirty = true;
    }
  }

  /** 获取是否翻转Y轴 */
  get flipY (): boolean {
    return this._flipY;
  }

  /** 设置是否翻转Y轴 */
  set flipY (value: boolean) {
    if (this._flipY !== value) {
      this._flipY = value;
      this._isDirty = true;
    }
  }

  /** 获取各向异性过滤级别 */
  get anisotropy (): number {
    return this._anisotropy;
  }

  /** 设置各向异性过滤级别 */
  set anisotropy (value: number) {
    value = Math.max(1, Math.min(16, value));
    if (this._anisotropy !== value) {
      this._anisotropy = value;
      this._isDirty = true;
    }
  }

  /** 获取原生纹理对象 */
  get nativeTexture (): any {
    return this._nativeTexture;
  }

  /** 获取是否需要更新 */
  get isDirty (): boolean {
    return this._isDirty;
  }

  /** 设置是否需要更新 */
  set isDirty (value: boolean) {
    this._isDirty = value;
  }

  /**
   * 调整纹理大小
   * @param width 新宽度
   * @param height 新高度
   */
  resize (width: number, height: number): void {
    if (this._width !== width || this._height !== height) {
      this._width = width;
      this._height = height;
      this._isDirty = true;
    }
  }

  /**
   * 释放纹理资源
   * 子类需要重写此方法以实现特定纹理类型的资源释放
   */
  protected override onDispose (): void {
    this._nativeTexture = null;
  }
}

/**
 * 2D纹理类
 */
export class Texture2D extends Texture {
  /** 纹理数据 */
  private _data: Uint8Array | Uint16Array | Float32Array | HTMLImageElement | HTMLCanvasElement | null = null;

  /**
   * 创建2D纹理
   * @param width 纹理宽度
   * @param height 纹理高度
   * @param format 纹理格式
   */
  constructor (width: number, height: number, format: TextureFormat = TextureFormat.RGBA) {
    super(width, height, format, TextureType.Texture2D);
  }

  /**
   * 设置纹理数据
   * @param data 纹理数据
   * @param generateMipmap 是否生成mipmap
   */
  setData (data: Uint8Array | Uint16Array | Float32Array | HTMLImageElement | HTMLCanvasElement, generateMipmap: boolean = true): void {
    this._data = data;
    this._generateMipmap = generateMipmap;
    this._isDirty = true;
  }

  /**
   * 从HTML元素加载纹理
   * @param source HTML元素
   * @param generateMipmap 是否生成mipmap
   */
  loadFromHTML (source: HTMLImageElement | HTMLCanvasElement, generateMipmap: boolean = true): void {
    this._width = source.width;
    this._height = source.height;
    this._data = source;
    this._generateMipmap = generateMipmap;
    this._isDirty = true;
  }

  /**
   * 从URL加载纹理
   * @param url 图像URL
   * @param generateMipmap 是否生成mipmap
   * @returns Promise
   */
  loadFromURL (url: string, generateMipmap: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        this._width = image.width;
        this._height = image.height;
        this._data = image;
        this._generateMipmap = generateMipmap;
        this._isDirty = true;
        resolve();
      };

      image.onerror = () => {
        reject(new Error(`Failed to load texture from URL: ${url}`));
      };

      image.src = url;
    });
  }

  /**
   * 释放纹理资源
   */
  protected override onDispose (): void {
    super.onDispose();
    this._data = null;
  }
}

/**
 * 立方体纹理类
 */
export class TextureCube extends Texture {
  /** 立方体六个面的纹理数据 */
  private _faceData: (Uint8Array | HTMLImageElement | HTMLCanvasElement | null)[] = [null, null, null, null, null, null];

  /**
   * 创建立方体纹理
   * @param size 纹理尺寸
   * @param format 纹理格式
   */
  constructor (size: number, format: TextureFormat = TextureFormat.RGBA) {
    super(size, size, format, TextureType.TextureCube);
  }

  /**
   * 设置立方体某一面的纹理数据
   * @param face 面索引 (0-5)
   * @param data 纹理数据
   */
  setFaceData (face: number, data: Uint8Array | HTMLImageElement | HTMLCanvasElement): void {
    if (face >= 0 && face < 6) {
      this._faceData[face] = data;
      this._isDirty = true;
    }
  }

  /**
   * 从URL加载立方体某一面的纹理
   * @param face 面索引 (0-5)
   * @param url 图像URL
   * @returns Promise
   */
  loadFaceFromURL (face: number, url: string): Promise<void> {
    if (face < 0 || face >= 6) {
      return Promise.reject(new Error(`Invalid face index: ${face}`));
    }

    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        if (image.width !== image.height) {
          reject(new Error('Cubemap face must be square'));

          return;
        }

        if (this._width !== image.width) {
          this._width = image.width;
          this._height = image.width;
        }

        this._faceData[face] = image;
        this._isDirty = true;
        resolve();
      };

      image.onerror = () => {
        reject(new Error(`Failed to load cubemap face from URL: ${url}`));
      };

      image.src = url;
    });
  }

  /**
   * 从六个URL加载完整立方体纹理
   * @param urls 包含六个面URL的数组
   * @returns Promise
   */
  loadFromURLs (urls: string[]): Promise<void> {
    if (urls.length !== 6) {
      return Promise.reject(new Error('Must provide exactly 6 URLs for cubemap'));
    }

    const promises = [];

    for (let i = 0; i < 6; i++) {
      promises.push(this.loadFaceFromURL(i, urls[i]));
    }

    return Promise.all(promises).then(() => {});
  }

  /**
   * 释放纹理资源
   */
  protected override onDispose (): void {
    super.onDispose();
    this._faceData = [null, null, null, null, null, null];
  }
}

/**
 * 渲染目标纹理类
 */
export class RenderTexture extends Texture {
  /** 是否包含深度缓冲 */
  private _hasDepth: boolean;
  /** 是否包含模板缓冲 */
  private _hasStencil: boolean;
  /** 多重采样数量 */
  private _samples: number;

  /**
   * 创建渲染目标纹理
   * @param width 纹理宽度
   * @param height 纹理高度
   * @param format 纹理格式
   * @param hasDepth 是否包含深度缓冲
   * @param hasStencil 是否包含模板缓冲
   * @param samples 多重采样数量
   */
  constructor (width: number, height: number, format: TextureFormat = TextureFormat.RGBA, hasDepth: boolean = true, hasStencil: boolean = false, samples: number = 1) {
    super(width, height, format, TextureType.RenderTarget);
    this._hasDepth = hasDepth;
    this._hasStencil = hasStencil;
    this._samples = Math.max(1, Math.min(8, samples));
    this._flipY = false; // 渲染目标通常不需要翻转Y轴
  }

  /** 获取是否包含深度缓冲 */
  get hasDepth (): boolean {
    return this._hasDepth;
  }

  /** 获取是否包含模板缓冲 */
  get hasStencil (): boolean {
    return this._hasStencil;
  }

  /** 获取多重采样数量 */
  get samples (): number {
    return this._samples;
  }

  /** 设置多重采样数量 */
  set samples (value: number) {
    value = Math.max(1, Math.min(8, value));
    if (this._samples !== value) {
      this._samples = value;
      this._isDirty = true;
    }
  }

  /**
   * 释放纹理资源
   */
  protected override onDispose (): void {
    super.onDispose();
  }
}