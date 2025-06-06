/**
 * texture2d.ts
 * 2D纹理类
 * 提供2D纹理的基础功能和生命周期管理
 */

import type { CommonTexture, CommonTextureConfig, TextureData } from '@maxellabs/specification';
import type { IRHIDevice, IRHITexture } from '../interface/rhi';
import { EventDispatcher } from '../base/event-dispatcher';

/**
 * 纹理事件类型
 */
export enum Texture2DEventType {
  /** 纹理数据更新 */
  DATA_UPDATED = 'data-updated',
  /** 纹理上传到GPU */
  UPLOADED = 'uploaded',
  /** 纹理编译完成 */
  COMPILED = 'compiled',
  /** 纹理销毁 */
  DESTROYED = 'destroyed',
  /** 纹理加载开始 */
  LOAD_START = 'load-start',
  /** 纹理加载完成 */
  LOAD_COMPLETE = 'load-complete',
  /** 纹理加载失败 */
  LOAD_ERROR = 'load-error',
}

/**
 * 2D纹理配置选项
 */
export interface Texture2DOptions {
  /** 纹理配置 */
  config: CommonTextureConfig;
  /** 初始纹理数据 */
  data?: TextureData[];
  /** RHI设备 */
  device?: IRHIDevice;
  /** 是否立即上传到GPU */
  uploadImmediately?: boolean;
}

/**
 * 2D纹理类
 * 实现CommonTexture接口，提供2D纹理的基础功能
 */
export class Texture2D implements CommonTexture {
  /** 纹理ID */
  public readonly id: string;

  /** 纹理配置 */
  public readonly config: CommonTextureConfig;

  /** 纹理数据 */
  public data?: TextureData[];

  /** 是否已上传到GPU */
  public uploaded: boolean = false;

  /** 是否需要更新 */
  public needsUpdate: boolean = false;

  /** 纹理版本 */
  public version: number = 0;

  /** 内存使用量（字节） */
  public memoryUsage: number = 0;

  /** 是否启用 */
  public enabled: boolean = true;

  /** 纹理标签 */
  public tags?: string[];

  /** RHI纹理对象 */
  protected rhiTexture?: IRHITexture;

  /** RHI设备 */
  protected device?: IRHIDevice;

  /** 事件分发器 */
  protected eventDispatcher: EventDispatcher;

  /** 是否正在加载 */
  protected isLoading: boolean = false;

  /**
   * 构造函数
   * @param options 纹理配置选项
   */
  constructor(options: Texture2DOptions) {
    this.id = options.config.name || `texture2d_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.config = { ...options.config };
    this.data = options.data ? [...options.data] : undefined;
    this.device = options.device;
    this.tags = options.config.name ? [options.config.name] : undefined;

    // 初始化事件系统
    this.eventDispatcher = new EventDispatcher();

    // 计算初始内存使用量
    this.calculateMemoryUsage();

    // 如果有初始数据且需要立即上传，则上传到GPU
    if (this.data && options.uploadImmediately && this.device) {
      this.uploadToGPU();
    }
  }

  /**
   * 设置纹理数据
   * @param data 纹理数据数组
   * @param uploadImmediately 是否立即上传到GPU
   */
  setData(data: TextureData[], uploadImmediately: boolean = true): void {
    this.data = [...data];
    this.needsUpdate = true;
    this.version++;

    // 重新计算内存使用量
    this.calculateMemoryUsage();

    // 分发数据更新事件
    this.eventDispatcher.emit(Texture2DEventType.DATA_UPDATED, { texture: this });

    // 如果需要立即上传且有设备，则上传到GPU
    if (uploadImmediately && this.device) {
      this.uploadToGPU();
    }
  }

  /**
   * 更新纹理数据的一部分
   * @param data 新的像素数据
   * @param level MIP等级
   * @param xOffset X偏移
   * @param yOffset Y偏移
   * @param zOffset Z偏移
   * @param width 宽度
   * @param height 高度
   * @param depth 深度
   */
  updateData(
    data: ArrayBufferView | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    level: number = 0,
    xOffset: number = 0,
    yOffset: number = 0,
    zOffset: number = 0,
    width?: number,
    height?: number,
    depth?: number
  ): void {
    if (!this.rhiTexture) {
      console.warn('Texture2D: 无法更新数据，RHI纹理未创建');
      return;
    }

    // 更新RHI纹理
    this.rhiTexture.update(data, xOffset, yOffset, zOffset, width, height, depth, level);

    this.needsUpdate = false;
    this.version++;

    // 分发数据更新事件
    this.eventDispatcher.emit(Texture2DEventType.DATA_UPDATED, { texture: this });
  }

  /**
   * 上传纹理到GPU
   */
  async uploadToGPU(): Promise<void> {
    if (!this.device) {
      console.warn('Texture2D: 无法上传到GPU，RHI设备未设置');
      return;
    }

    if (!this.data || this.data.length === 0) {
      console.warn('Texture2D: 无法上传到GPU，纹理数据为空');
      return;
    }

    try {
      // 创建RHI纹理
      this.createRHITexture();

      // 上传数据到RHI纹理
      for (const textureData of this.data) {
        this.rhiTexture!.update(
          textureData.pixels,
          textureData.xOffset,
          textureData.yOffset,
          textureData.zOffset,
          textureData.width,
          textureData.height,
          textureData.depth,
          textureData.level
        );
      }

      this.uploaded = true;
      this.needsUpdate = false;

      // 分发上传完成事件
      this.eventDispatcher.emit(Texture2DEventType.UPLOADED, { texture: this });
    } catch (error) {
      console.error('Texture2D: 上传到GPU失败', error);

      // 分发错误事件
      this.eventDispatcher.emit(Texture2DEventType.LOAD_ERROR, {
        texture: this,
        error: error as Error,
      });
    }
  }

  /**
   * 从URL加载纹理
   * @param url 图片URL
   * @param level MIP等级
   */
  async loadFromURL(url: string, level: number = 0): Promise<void> {
    if (this.isLoading) {
      console.warn('Texture2D: 纹理正在加载中，忽略重复加载请求');
      return;
    }

    this.isLoading = true;

    // 分发加载开始事件
    this.eventDispatcher.emit(Texture2DEventType.LOAD_START, { texture: this });

    try {
      // 创建图片元素
      const image = new Image();

      // 设置跨域属性
      image.crossOrigin = 'anonymous';

      // 等待图片加载完成
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error(`Failed to load image from ${url}`));
        image.src = url;
      });

      // 创建纹理数据
      const textureData: TextureData = {
        pixels: image,
        level,
        width: image.width,
        height: image.height,
      };

      // 设置纹理数据
      this.setData([textureData], true);

      this.isLoading = false;

      // 分发加载完成事件
      this.eventDispatcher.emit(Texture2DEventType.LOAD_COMPLETE, { texture: this });
    } catch (error) {
      this.isLoading = false;
      console.error('Texture2D: 从URL加载纹理失败', error);

      // 分发错误事件
      this.eventDispatcher.emit(Texture2DEventType.LOAD_ERROR, {
        texture: this,
        error: error as Error,
      });
    }
  }

  /**
   * 设置RHI设备
   * @param device RHI设备
   */
  setDevice(device: IRHIDevice): void {
    this.device = device;

    // 如果有数据且需要更新，则上传到GPU
    if (this.data && this.needsUpdate) {
      this.uploadToGPU();
    }
  }

  /**
   * 获取RHI纹理
   */
  getRHITexture(): IRHITexture | undefined {
    return this.rhiTexture;
  }

  /**
   * 创建纹理视图
   */
  createView(
    format?: any,
    dimension?: any,
    baseMipLevel?: number,
    mipLevelCount?: number,
    baseArrayLayer?: number,
    arrayLayerCount?: number
  ) {
    if (!this.rhiTexture) {
      console.warn('Texture2D: 无法创建视图，RHI纹理未创建');
      return undefined;
    }

    return this.rhiTexture.createView(format, dimension, baseMipLevel, mipLevelCount, baseArrayLayer, arrayLayerCount);
  }

  /**
   * 添加事件监听器
   * @param type 事件类型
   * @param callback 回调函数
   */
  addEventListener(type: string, callback: (event: any) => void): void {
    this.eventDispatcher.on(type, {
      callback,
      priority: 0,
      once: false,
    });
  }

  /**
   * 移除事件监听器
   * @param type 事件类型
   * @param callback 回调函数
   */
  removeEventListener(type: string, callback: (event: any) => void): void {
    this.eventDispatcher.off(type, {
      callback,
      priority: 0,
      once: false,
    });
  }

  /**
   * 销毁纹理
   */
  destroy(): void {
    // 销毁RHI纹理
    if (this.rhiTexture) {
      this.rhiTexture.destroy();
      this.rhiTexture = undefined;
    }

    // 清理数据
    this.data = undefined;
    this.uploaded = false;
    this.needsUpdate = false;
    this.enabled = false;
    this.isLoading = false;

    // 分发销毁事件
    this.eventDispatcher.emit(Texture2DEventType.DESTROYED, { texture: this });

    // 清理事件监听器
    this.eventDispatcher.destroy();
  }

  /**
   * 创建RHI纹理
   */
  protected createRHITexture(): void {
    if (!this.device) {
      throw new Error('Texture2D: 无法创建RHI纹理，设备未设置');
    }

    if (this.rhiTexture) {
      // 如果已存在，先销毁
      this.rhiTexture.destroy();
    }

    // 根据配置创建RHI纹理
    this.rhiTexture = this.device.createTexture({
      width: this.config.width,
      height: this.config.height,
      format: this.mapTextureFormat(this.config.format),
      usage: this.mapTextureUsage(this.config.usage),
      dimension: '2d',
      mipLevelCount: this.config.mipmapLevels || 1,
      label: this.config.name,
    });
  }

  /**
   * 映射纹理格式
   */
  protected mapTextureFormat(format: any): any {
    // 这里需要根据规范包的格式映射到RHI格式
    // 暂时返回RGBA8格式
    return 'rgba8unorm';
  }

  /**
   * 映射纹理用途
   */
  protected mapTextureUsage(usage: any): any {
    // 这里需要根据规范包的用途映射到RHI用途
    // 暂时返回基础用途
    return ['texture-binding', 'copy-dst'];
  }

  /**
   * 计算内存使用量
   */
  protected calculateMemoryUsage(): void {
    if (!this.data) {
      this.memoryUsage = 0;
      return;
    }

    let totalSize = 0;
    for (const textureData of this.data) {
      if (textureData.pixels instanceof ArrayBuffer) {
        totalSize += textureData.pixels.byteLength;
      } else if (ArrayBuffer.isView(textureData.pixels)) {
        totalSize += textureData.pixels.byteLength;
      } else {
        // 对于图片元素，估算内存使用量
        const width = textureData.width || this.config.width;
        const height = textureData.height || this.config.height;
        const channels = 4; // 假设RGBA格式
        totalSize += width * height * channels;
      }
    }

    this.memoryUsage = totalSize;
  }
}
