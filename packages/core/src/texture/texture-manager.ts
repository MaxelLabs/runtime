/**
 * texture-manager.ts
 * 纹理管理器
 * 负责纹理的创建、缓存、加载和生命周期管理
 */

import type { CommonTexture, CommonTextureConfig, TextureData } from '@maxellabs/specification';
import type { IRHIDevice } from '../../../specification/src/common/rhi';
import type { Texture2DOptions } from './texture2d';
import { Texture2D } from './texture2d';
import type { TextureCubeOptions } from './texture-cube';
import { TextureCube } from './texture-cube';
import { EventDispatcher } from '../base/event-dispatcher';

/**
 * 纹理管理器事件类型
 */
export enum TextureManagerEventType {
  /** 纹理创建 */
  TEXTURE_CREATED = 'texture-created',
  /** 纹理加载完成 */
  TEXTURE_LOADED = 'texture-loaded',
  /** 纹理销毁 */
  TEXTURE_DESTROYED = 'texture-destroyed',
  /** 缓存清理 */
  CACHE_CLEARED = 'cache-cleared',
  /** 内存警告 */
  MEMORY_WARNING = 'memory-warning',
}

/**
 * 纹理缓存项
 */
interface TextureCacheItem {
  /** 纹理实例 */
  texture: CommonTexture;
  /** 引用计数 */
  refCount: number;
  /** 最后访问时间 */
  lastAccessTime: number;
  /** 创建时间 */
  createTime: number;
  /** 内存使用量 */
  memoryUsage: number;
}

/**
 * 纹理管理器配置
 */
export interface TextureManagerConfig {
  /** 最大缓存大小（MB） */
  maxCacheSize?: number;
  /** 最大纹理数量 */
  maxTextureCount?: number;
  /** 是否启用自动清理 */
  enableAutoCleanup?: boolean;
  /** 清理间隔（毫秒） */
  cleanupInterval?: number;
  /** 内存警告阈值（MB） */
  memoryWarningThreshold?: number;
}

/**
 * 纹理管理器
 * 提供纹理的统一管理和缓存功能
 */
export class TextureManager {
  /** 纹理缓存 */
  private textureCache: Map<string, TextureCacheItem> = new Map();

  /** RHI设备 */
  private device?: IRHIDevice;

  /** 事件分发器 */
  private eventDispatcher: EventDispatcher;

  /** 管理器配置 */
  private config: Required<TextureManagerConfig>;

  /** 清理定时器 */
  private cleanupTimer?: number;

  /** 当前内存使用量（字节） */
  private currentMemoryUsage: number = 0;

  /**
   * 构造函数
   * @param config 管理器配置
   */
  constructor(config: TextureManagerConfig = {}) {
    this.config = {
      maxCacheSize: config.maxCacheSize || 512, // 512MB
      maxTextureCount: config.maxTextureCount || 1000,
      enableAutoCleanup: config.enableAutoCleanup !== false,
      cleanupInterval: config.cleanupInterval || 60000, // 1分钟
      memoryWarningThreshold: config.memoryWarningThreshold || 400, // 400MB
    };

    this.eventDispatcher = new EventDispatcher();

    // 启动自动清理
    if (this.config.enableAutoCleanup) {
      this.startAutoCleanup();
    }
  }

  /**
   * 设置RHI设备
   * @param device RHI设备
   */
  setDevice(device: IRHIDevice): void {
    this.device = device;

    // 为所有已缓存的纹理设置设备
    for (const cacheItem of this.textureCache.values()) {
      if ('setDevice' in cacheItem.texture) {
        (cacheItem.texture as any).setDevice(device);
      }
    }
  }

  /**
   * 创建2D纹理
   * @param id 纹理ID
   * @param config 纹理配置
   * @param data 初始数据
   * @param uploadImmediately 是否立即上传
   */
  createTexture2D(
    id: string,
    config: CommonTextureConfig,
    data?: TextureData[],
    uploadImmediately: boolean = true
  ): Texture2D {
    // 检查是否已存在
    if (this.textureCache.has(id)) {
      const cacheItem = this.textureCache.get(id)!;
      cacheItem.refCount++;
      cacheItem.lastAccessTime = Date.now();
      return cacheItem.texture as Texture2D;
    }

    // 创建新纹理
    const options: Texture2DOptions = {
      config: { ...config, name: id },
      data,
      device: this.device,
      uploadImmediately,
    };

    const texture = new Texture2D(options);

    // 添加到缓存
    this.addToCache(id, texture);

    // 分发创建事件
    this.eventDispatcher.emit(TextureManagerEventType.TEXTURE_CREATED, {
      textureId: id,
      texture,
    });

    return texture;
  }

  /**
   * 创建立方体纹理
   * @param id 纹理ID
   * @param config 纹理配置
   * @param data 初始数据
   * @param uploadImmediately 是否立即上传
   */
  createTextureCube(
    id: string,
    config: CommonTextureConfig,
    data?: TextureData[],
    uploadImmediately: boolean = true
  ): TextureCube {
    // 检查是否已存在
    if (this.textureCache.has(id)) {
      const cacheItem = this.textureCache.get(id)!;
      cacheItem.refCount++;
      cacheItem.lastAccessTime = Date.now();
      return cacheItem.texture as TextureCube;
    }

    // 创建新纹理
    const options: TextureCubeOptions = {
      config: { ...config, name: id },
      data,
      device: this.device,
      uploadImmediately,
    };

    const texture = new TextureCube(options);

    // 添加到缓存
    this.addToCache(id, texture);

    // 分发创建事件
    this.eventDispatcher.emit(TextureManagerEventType.TEXTURE_CREATED, {
      textureId: id,
      texture,
    });

    return texture;
  }

  /**
   * 从URL加载2D纹理
   * @param id 纹理ID
   * @param url 图片URL
   * @param config 纹理配置
   */
  async loadTexture2DFromURL(id: string, url: string, config?: Partial<CommonTextureConfig>): Promise<Texture2D> {
    // 检查是否已存在
    if (this.textureCache.has(id)) {
      const cacheItem = this.textureCache.get(id)!;
      cacheItem.refCount++;
      cacheItem.lastAccessTime = Date.now();
      return cacheItem.texture as Texture2D;
    }

    // 创建默认配置
    const defaultConfig: CommonTextureConfig = {
      name: id,
      width: 512,
      height: 512,
      format: 'RGBA' as any,
      dataType: 'UnsignedByte' as any,
      target: 'Texture2D' as any,
      usage: 'Static' as any,
      generateMipmaps: true,
      minFilter: 'Linear' as any,
      magFilter: 'Linear' as any,
      wrapS: 'Repeat' as any,
      wrapT: 'Repeat' as any,
      anisotropy: 1,
      flipY: true,
      premultiplyAlpha: false,
      colorSpace: 'srgb',
    };

    const finalConfig = { ...defaultConfig, ...config };

    // 创建纹理
    const texture = this.createTexture2D(id, finalConfig, undefined, false);

    try {
      // 加载图片
      await texture.loadFromURL(url);

      // 分发加载完成事件
      this.eventDispatcher.emit(TextureManagerEventType.TEXTURE_LOADED, {
        textureId: id,
        texture,
        url,
      });

      return texture;
    } catch (error) {
      // 加载失败，从缓存中移除
      this.removeFromCache(id);
      throw error;
    }
  }

  /**
   * 从URL数组加载立方体纹理
   * @param id 纹理ID
   * @param urls 6个面的图片URL数组
   * @param config 纹理配置
   */
  async loadTextureCubeFromURLs(
    id: string,
    urls: string[],
    config?: Partial<CommonTextureConfig>
  ): Promise<TextureCube> {
    if (urls.length !== 6) {
      throw new Error('TextureManager: 立方体纹理需要6个面的URL');
    }

    // 检查是否已存在
    if (this.textureCache.has(id)) {
      const cacheItem = this.textureCache.get(id)!;
      cacheItem.refCount++;
      cacheItem.lastAccessTime = Date.now();
      return cacheItem.texture as TextureCube;
    }

    // 创建默认配置
    const defaultConfig: CommonTextureConfig = {
      name: id,
      width: 512,
      height: 512,
      format: 'RGBA' as any,
      dataType: 'UnsignedByte' as any,
      target: 'TextureCube' as any,
      usage: 'Static' as any,
      generateMipmaps: true,
      minFilter: 'Linear' as any,
      magFilter: 'Linear' as any,
      wrapS: 'ClampToEdge' as any,
      wrapT: 'ClampToEdge' as any,
      anisotropy: 1,
      flipY: false,
      premultiplyAlpha: false,
      colorSpace: 'srgb',
    };

    const finalConfig = { ...defaultConfig, ...config };

    // 创建纹理
    const texture = this.createTextureCube(id, finalConfig, undefined, false);

    try {
      // 加载图片
      await texture.loadFromURLs(urls);

      // 分发加载完成事件
      this.eventDispatcher.emit(TextureManagerEventType.TEXTURE_LOADED, {
        textureId: id,
        texture,
        urls,
      });

      return texture;
    } catch (error) {
      // 加载失败，从缓存中移除
      this.removeFromCache(id);
      throw error;
    }
  }

  /**
   * 获取纹理
   * @param id 纹理ID
   */
  getTexture(id: string): CommonTexture | undefined {
    const cacheItem = this.textureCache.get(id);
    if (cacheItem) {
      cacheItem.lastAccessTime = Date.now();
      return cacheItem.texture;
    }
    return undefined;
  }

  /**
   * 释放纹理引用
   * @param id 纹理ID
   */
  releaseTexture(id: string): void {
    const cacheItem = this.textureCache.get(id);
    if (cacheItem) {
      cacheItem.refCount--;
      if (cacheItem.refCount <= 0) {
        this.removeFromCache(id);
      }
    }
  }

  /**
   * 销毁纹理
   * @param id 纹理ID
   */
  destroyTexture(id: string): void {
    this.removeFromCache(id);
  }

  /**
   * 清理缓存
   * @param force 是否强制清理所有纹理
   */
  clearCache(force: boolean = false): void {
    const toRemove: string[] = [];

    for (const [id, cacheItem] of this.textureCache) {
      if (force || cacheItem.refCount <= 0) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.removeFromCache(id);
    }

    // 分发缓存清理事件
    this.eventDispatcher.emit(TextureManagerEventType.CACHE_CLEARED, {
      removedCount: toRemove.length,
      force,
    });
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    const stats = {
      textureCount: this.textureCache.size,
      memoryUsage: this.currentMemoryUsage,
      memoryUsageMB: this.currentMemoryUsage / (1024 * 1024),
      maxCacheSize: this.config.maxCacheSize,
      maxTextureCount: this.config.maxTextureCount,
      cacheUtilization: this.textureCache.size / this.config.maxTextureCount,
      memoryUtilization: this.currentMemoryUsage / (1024 * 1024) / this.config.maxCacheSize,
    };

    return stats;
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
   * 销毁管理器
   */
  destroy(): void {
    // 停止自动清理
    this.stopAutoCleanup();

    // 清理所有纹理
    this.clearCache(true);

    // 清理事件监听器
    this.eventDispatcher.destroy();
  }

  /**
   * 添加纹理到缓存
   * @param id 纹理ID
   * @param texture 纹理实例
   */
  private addToCache(id: string, texture: CommonTexture): void {
    const cacheItem: TextureCacheItem = {
      texture,
      refCount: 1,
      lastAccessTime: Date.now(),
      createTime: Date.now(),
      memoryUsage: texture.memoryUsage,
    };

    this.textureCache.set(id, cacheItem);
    this.currentMemoryUsage += texture.memoryUsage;

    // 检查内存使用量
    this.checkMemoryUsage();

    // 检查是否需要清理
    this.checkCacheSize();
  }

  /**
   * 从缓存中移除纹理
   * @param id 纹理ID
   */
  private removeFromCache(id: string): void {
    const cacheItem = this.textureCache.get(id);
    if (cacheItem) {
      // 销毁纹理
      if ('destroy' in cacheItem.texture) {
        (cacheItem.texture as any).destroy();
      }

      // 更新内存使用量
      this.currentMemoryUsage -= cacheItem.memoryUsage;

      // 从缓存中移除
      this.textureCache.delete(id);

      // 分发销毁事件
      this.eventDispatcher.emit(TextureManagerEventType.TEXTURE_DESTROYED, {
        textureId: id,
        texture: cacheItem.texture,
      });
    }
  }

  /**
   * 检查内存使用量
   */
  private checkMemoryUsage(): void {
    const memoryUsageMB = this.currentMemoryUsage / (1024 * 1024);

    if (memoryUsageMB > this.config.memoryWarningThreshold) {
      this.eventDispatcher.emit(TextureManagerEventType.MEMORY_WARNING, {
        currentUsage: memoryUsageMB,
        threshold: this.config.memoryWarningThreshold,
        maxSize: this.config.maxCacheSize,
      });
    }
  }

  /**
   * 检查缓存大小
   */
  private checkCacheSize(): void {
    const memoryUsageMB = this.currentMemoryUsage / (1024 * 1024);

    // 如果超过最大缓存大小或纹理数量，进行清理
    if (memoryUsageMB > this.config.maxCacheSize || this.textureCache.size > this.config.maxTextureCount) {
      this.performCleanup();
    }
  }

  /**
   * 执行清理
   */
  private performCleanup(): void {
    // 按最后访问时间排序，优先清理最久未使用的纹理
    const sortedItems = Array.from(this.textureCache.entries())
      .filter(([, item]) => item.refCount <= 0)
      .sort(([, a], [, b]) => a.lastAccessTime - b.lastAccessTime);

    // 清理一半的未引用纹理
    const toRemoveCount = Math.ceil(sortedItems.length / 2);

    for (let i = 0; i < toRemoveCount && i < sortedItems.length; i++) {
      const [id] = sortedItems[i];
      this.removeFromCache(id);
    }
  }

  /**
   * 启动自动清理
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = window.setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * 停止自动清理
   */
  private stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}
