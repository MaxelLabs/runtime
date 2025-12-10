/**
 * texture/TextureLoader.ts
 * 纹理加载器 - 加载和处理图片资源转为纹理数据
 */

import type { TextureLoadOptions, LoadedTexture } from './types';

/**
 * 纹理加载器
 *
 * 提供图片加载、处理和转换功能，支持：
 * - 从 URL 异步加载 PNG/JPG/WebP 等图片
 * - Mipmap 链自动生成
 * - Y 轴翻转处理（符合 WebGL 坐标系）
 * - 预乘 Alpha 处理
 * - 批量加载多张图片
 *
 * @example
 * ```typescript
 * // 从 URL 加载单张图片
 * const texture = await TextureLoader.load('path/to/image.jpg', {
 *   flipY: true,
 *   generateMipmaps: true,
 * });
 *
 * // 创建 RHI 纹理
 * const rhiTexture = device.createTexture({
 *   width: texture.width,
 *   height: texture.height,
 *   format: RHITextureFormat.RGBA8_UNORM,
 *   initialData: texture.data,
 * });
 * ```
 */
export class TextureLoader {
  /**
   * 从 URL 加载单张图片
   *
   * @param url 图片的 URL 或相对路径
   * @param options 加载选项
   * @returns 已加载的纹理数据
   */
  static async load(url: string, options: TextureLoadOptions = {}): Promise<LoadedTexture> {
    const image = await this.loadImage(url);
    return this.fromImage(image, options);
  }

  /**
   * 批量加载多张图片
   *
   * @param urls 图片 URL 数组
   * @param options 加载选项
   * @returns 已加载的纹理数据数组
   */
  static async loadAll(urls: string[], options: TextureLoadOptions = {}): Promise<LoadedTexture[]> {
    const promises = urls.map((url) => this.load(url, options));
    return Promise.all(promises);
  }

  /**
   * 从 HTMLImageElement 创建纹理数据
   *
   * @param image HTMLImageElement
   * @param options 加载选项
   * @returns 纹理数据
   */
  static fromImage(image: HTMLImageElement, options: TextureLoadOptions = {}): LoadedTexture {
    const flipY = options.flipY ?? true;
    const generateMipmaps = options.generateMipmaps ?? false;
    const premultiplyAlpha = options.premultiplyAlpha ?? false;
    const format = options.format ?? 'rgba8-unorm';

    // 创建 Canvas 用于图片处理
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取 Canvas 2D 上下文');
    }

    // 如果需要 Y 轴翻转
    if (flipY) {
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
    }

    // 绘制图片到 Canvas
    ctx.drawImage(image, 0, 0);

    // 获取图片数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let pixelData = new Uint8Array(imageData.data);

    // 处理预乘 Alpha
    if (premultiplyAlpha) {
      pixelData = this.premultiplyAlphaData(pixelData) as Uint8Array<ArrayBuffer>;
    }

    const result: LoadedTexture = {
      width: image.width,
      height: image.height,
      data: pixelData,
      format,
    };

    // 生成 Mipmap
    if (generateMipmaps) {
      result.mipmaps = this.generateMipmaps(pixelData, image.width, image.height);
    }

    return result;
  }

  /**
   * 从 ImageData 创建纹理数据
   *
   * @param imageData ImageData 对象
   * @param options 加载选项
   * @returns 纹理数据
   */
  static fromImageData(imageData: ImageData, options: TextureLoadOptions = {}): LoadedTexture {
    const flipY = options.flipY ?? true;
    const generateMipmaps = options.generateMipmaps ?? false;
    const premultiplyAlpha = options.premultiplyAlpha ?? false;
    const format = options.format ?? 'rgba8-unorm';

    let pixelData = new Uint8Array(imageData.data);

    // Y 轴翻转
    if (flipY) {
      pixelData = this.flipYData(pixelData, imageData.width, imageData.height) as Uint8Array<ArrayBuffer>;
    }

    // 预乘 Alpha
    if (premultiplyAlpha) {
      pixelData = this.premultiplyAlphaData(pixelData) as Uint8Array<ArrayBuffer>;
    }

    const result: LoadedTexture = {
      width: imageData.width,
      height: imageData.height,
      data: pixelData,
      format,
    };

    // 生成 Mipmap
    if (generateMipmaps) {
      result.mipmaps = this.generateMipmaps(pixelData, imageData.width, imageData.height) as Uint8Array<ArrayBuffer>[];
    }

    return result;
  }

  /**
   * 生成 Mipmap 链
   *
   * 使用双线性插值生成一系列逐级缩小的纹理。
   *
   * @param data 原始像素数据 (RGBA)
   * @param width 原始宽度
   * @param height 原始高度
   * @returns Mipmap 数据数组（不包含原始纹理）
   */
  static generateMipmaps(data: Uint8Array, width: number, height: number): Uint8Array[] {
    const mipmaps: Uint8Array[] = [];

    let currentWidth = width;
    let currentHeight = height;
    let currentData = new Uint8Array(data);

    // 持续生成缩小版本，直到 1x1
    while (currentWidth > 1 || currentHeight > 1) {
      const nextWidth = Math.max(1, currentWidth >> 1);
      const nextHeight = Math.max(1, currentHeight >> 1);

      const nextData = this.downsampleTexture(currentData, currentWidth, currentHeight, nextWidth, nextHeight);

      mipmaps.push(nextData);

      currentData = nextData as Uint8Array<ArrayBuffer>;
      currentWidth = nextWidth;
      currentHeight = nextHeight;
    }

    return mipmaps;
  }

  /**
   * 检测是否为压缩纹理格式
   *
   * 支持检测 KTX 和 DDS 格式。
   *
   * @param url 文件 URL
   * @returns 是否为压缩格式
   */
  static isCompressedFormat(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.ktx') || lowerUrl.endsWith('.ktx2') || lowerUrl.endsWith('.dds');
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 加载 HTML 图片元素
   *
   * @param url 图片 URL
   * @returns 加载完毕的 HTMLImageElement
   */
  private static loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      // 允许跨域加载
      image.crossOrigin = 'anonymous';

      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`无法加载图片: ${url}`));

      image.src = url;
    });
  }

  /**
   * Y 轴翻转像素数据
   *
   * @param data RGBA 像素数据
   * @param width 宽度
   * @param height 高度
   * @returns 翻转后的数据
   */
  private static flipYData(data: Uint8Array, width: number, height: number): Uint8Array {
    const flipped = new Uint8Array(data.length);
    const rowSize = width * 4;

    for (let y = 0; y < height; y++) {
      const srcRow = y * rowSize;
      const dstRow = (height - 1 - y) * rowSize;
      flipped.set(data.slice(srcRow, srcRow + rowSize), dstRow);
    }

    return flipped;
  }

  /**
   * 预乘 Alpha 处理
   *
   * 将 RGB 值乘以 Alpha 值，用于正确的透明度混合。
   *
   * @param data RGBA 像素数据
   * @returns 处理后的数据
   */
  private static premultiplyAlphaData(data: Uint8Array): Uint8Array {
    const result = new Uint8Array(data);

    for (let i = 0; i < result.length; i += 4) {
      const alpha = result[i + 3] / 255;

      result[i] = Math.round(result[i] * alpha);
      result[i + 1] = Math.round(result[i + 1] * alpha);
      result[i + 2] = Math.round(result[i + 2] * alpha);
    }

    return result;
  }

  /**
   * 纹理采样缩小
   *
   * 使用双线性插值将纹理缩小到指定大小。
   *
   * @param src 源像素数据
   * @param srcW 源宽度
   * @param srcH 源高度
   * @param dstW 目标宽度
   * @param dstH 目标高度
   * @returns 缩小后的像素数据
   */
  private static downsampleTexture(
    src: Uint8Array,
    srcW: number,
    srcH: number,
    dstW: number,
    dstH: number
  ): Uint8Array {
    const dst = new Uint8Array(dstW * dstH * 4);

    const scaleX = srcW / dstW;
    const scaleY = srcH / dstH;

    for (let y = 0; y < dstH; y++) {
      for (let x = 0; x < dstW; x++) {
        // 源纹理中的浮点坐标
        const srcX = (x + 0.5) * scaleX - 0.5;
        const srcY = (y + 0.5) * scaleY - 0.5;

        // 双线性插值采样
        const rgba = this.sampleBilinear(src, srcW, srcH, srcX, srcY);

        const dstIdx = (y * dstW + x) * 4;
        dst[dstIdx] = rgba[0];
        dst[dstIdx + 1] = rgba[1];
        dst[dstIdx + 2] = rgba[2];
        dst[dstIdx + 3] = rgba[3];
      }
    }

    return dst;
  }

  /**
   * 双线性插值采样
   *
   * 从纹理中使用双线性插值采样指定坐标的像素。
   *
   * @param data 像素数据
   * @param width 纹理宽度
   * @param height 纹理高度
   * @param x 浮点 X 坐标
   * @param y 浮点 Y 坐标
   * @returns [R, G, B, A] 采样结果
   */
  private static sampleBilinear(
    data: Uint8Array,
    width: number,
    height: number,
    x: number,
    y: number
  ): [number, number, number, number] {
    // 边界处理
    x = Math.max(0, Math.min(x, width - 1));
    y = Math.max(0, Math.min(y, height - 1));

    const x0 = Math.floor(x);
    const x1 = Math.min(x0 + 1, width - 1);
    const y0 = Math.floor(y);
    const y1 = Math.min(y0 + 1, height - 1);

    const fx = x - x0;
    const fy = y - y0;

    // 获取 4 个相邻像素
    const p00 = this.getPixel(data, width, x0, y0);
    const p10 = this.getPixel(data, width, x1, y0);
    const p01 = this.getPixel(data, width, x0, y1);
    const p11 = this.getPixel(data, width, x1, y1);

    // 双线性插值
    const result: [number, number, number, number] = [0, 0, 0, 0];

    for (let i = 0; i < 4; i++) {
      const top = p00[i] * (1 - fx) + p10[i] * fx;
      const bottom = p01[i] * (1 - fx) + p11[i] * fx;
      result[i] = Math.round(top * (1 - fy) + bottom * fy);
    }

    return result;
  }

  /**
   * 获取指定坐标的像素颜色
   *
   * @param data 像素数据
   * @param width 纹理宽度
   * @param x X 坐标
   * @param y Y 坐标
   * @returns [R, G, B, A] 颜色值
   */
  private static getPixel(data: Uint8Array, width: number, x: number, y: number): [number, number, number, number] {
    const idx = (y * width + x) * 4;
    return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  }
}
