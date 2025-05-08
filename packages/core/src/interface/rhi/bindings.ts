/**
 * bindings.ts
 * 定义绑定组和绑定布局接口
 */

import type { RHIShaderStage } from './types/enums';
import type { IRHIBuffer } from './resources/buffer';
import type { IRHITextureView } from './resources/texture';

/**
 * 采样器接口
 */
export interface IRHISampler {
  /**
   * 缩小过滤器
   */
  readonly minFilter: 'nearest' | 'linear',

  /**
   * 放大过滤器
   */
  readonly magFilter: 'nearest' | 'linear',

  /**
   * Mipmap过滤器
   */
  readonly mipmapFilter: 'nearest' | 'linear',

  /**
   * 寻址模式U
   */
  readonly addressModeU: 'repeat' | 'mirror-repeat' | 'clamp-to-edge' | 'clamp-to-border',

  /**
   * 寻址模式V
   */
  readonly addressModeV: 'repeat' | 'mirror-repeat' | 'clamp-to-edge' | 'clamp-to-border',

  /**
   * 寻址模式W
   */
  readonly addressModeW: 'repeat' | 'mirror-repeat' | 'clamp-to-edge' | 'clamp-to-border',

  /**
   * 采样器标签
   */
  readonly label?: string,

  /**
   * 销毁资源
   */
  destroy(): void,
}

/**
 * 绑定组布局入口项
 */
export interface IRHIBindGroupLayoutEntry {
  /**
   * 绑定索引
   */
  binding: number,

  /**
   * 可见着色器阶段
   */
  visibility: RHIShaderStage,

  /**
   * 缓冲区绑定布局（如果是缓冲区）
   */
  buffer?: {
    /**
     * 绑定类型
     */
    type: 'uniform' | 'storage' | 'read-only-storage',

    /**
     * 是否有动态偏移
     */
    hasDynamicOffset?: boolean,

    /**
     * 最小绑定尺寸
     */
    minBindingSize?: number,
  },

  /**
   * 采样器绑定布局（如果是采样器）
   */
  sampler?: {
    /**
     * 采样器类型
     */
    type: 'filtering' | 'non-filtering' | 'comparison',
  },

  /**
   * 纹理绑定布局（如果是纹理）
   */
  texture?: {
    /**
     * 采样类型
     */
    sampleType: 'float' | 'unfilterable-float' | 'int' | 'uint' | 'depth',

    /**
     * 视图维度
     */
    viewDimension: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d',

    /**
     * 是否多重采样
     */
    multisampled?: boolean,
  },

  /**
   * 存储纹理绑定布局（如果是存储纹理）
   */
  storageTexture?: {
    /**
     * 访问模式
     */
    access: 'write-only' | 'read-only' | 'read-write',

    /**
     * 视图维度
     */
    viewDimension: '1d' | '2d' | '2d-array' | '3d',

    /**
     * 格式
     */
    format: string,
  },
}

/**
 * 绑定组布局接口
 */
export interface IRHIBindGroupLayout {
  /**
   * 布局入口项
   */
  readonly entries: IRHIBindGroupLayoutEntry[],

  /**
   * 布局标签
   */
  readonly label?: string,

  /**
   * 销毁资源
   */
  destroy(): void,
}

/**
 * 绑定组入口项
 */
export interface IRHIBindGroupEntry {
  /**
   * 绑定索引
   */
  binding: number,

  /**
   * 资源
   */
  resource:
  | IRHIBuffer
  | { buffer: IRHIBuffer, offset?: number, size?: number }
  | IRHISampler
  | IRHITextureView,
}

/**
 * 绑定组接口
 */
export interface IRHIBindGroup {
  /**
   * 绑定组布局
   */
  readonly layout: IRHIBindGroupLayout,

  /**
   * 绑定组入口项
   */
  readonly entries: IRHIBindGroupEntry[],

  /**
   * 绑定组标签
   */
  readonly label?: string,

  /**
   * 销毁资源
   */
  destroy(): void,
}