/**
 * postprocess/types.ts
 * 后处理系统类型定义
 */

import type { MSpec } from '@maxellabs/core';

/**
 * 后处理效果配置选项基类
 */
export interface PostProcessEffectOptions {
  /**
   * 效果名称（用于调试）
   */
  name?: string;

  /**
   * 是否启用该效果
   * @default true
   */
  enabled?: boolean;
}

/**
 * 后处理管理器配置选项
 */
export interface PostProcessManagerOptions {
  /**
   * 渲染目标宽度
   */
  width: number;

  /**
   * 渲染目标高度
   */
  height: number;

  /**
   * 颜色纹理格式
   * @default RHITextureFormat.RGBA8_UNORM
   */
  colorFormat?: MSpec.RHITextureFormat;

  /**
   * 是否使用 HDR 格式
   * @default false
   */
  useHDR?: boolean;

  /**
   * 调试标签
   */
  label?: string;
}

/**
 * 后处理效果基类接口
 */
export interface IPostProcessEffect {
  /**
   * 效果名称
   */
  readonly name: string;

  /**
   * 是否启用
   */
  enabled: boolean;

  /**
   * 应用后处理效果
   * @param encoder 命令编码器
   * @param inputTexture 输入纹理视图
   * @param outputTexture 输出纹理视图
   */
  apply(
    encoder: MSpec.IRHICommandEncoder,
    inputTexture: MSpec.IRHITextureView,
    outputTexture: MSpec.IRHITextureView
  ): void;

  /**
   * 调整效果参数
   * @param params 参数对象
   */
  setParameters(params: Record<string, any>): void;

  /**
   * 销毁资源
   */
  destroy(): void;
}

/**
 * 高斯模糊效果配置
 */
export interface GaussianBlurOptions extends PostProcessEffectOptions {
  /**
   * 模糊半径（像素）
   * @default 5
   */
  radius?: number;

  /**
   * 模糊强度
   * @default 1.0
   */
  intensity?: number;
}

/**
 * Bloom 辉光效果配置
 */
export interface BloomOptions extends PostProcessEffectOptions {
  /**
   * 阈值（亮度阈值，超过该值才产生辉光）
   * @default 0.8
   */
  threshold?: number;

  /**
   * 辉光强度
   * @default 1.0
   */
  intensity?: number;

  /**
   * 模糊半径
   * @default 5
   */
  radius?: number;
}

/**
 * 色调映射效果配置
 */
export interface ToneMappingOptions extends PostProcessEffectOptions {
  /**
   * 色调映射算法
   * @default 'reinhard'
   */
  mode?: 'reinhard' | 'aces' | 'uncharted2' | 'filmic';

  /**
   * 曝光度
   * @default 1.0
   */
  exposure?: number;

  /**
   * 伽马校正值
   * @default 2.2
   */
  gamma?: number;
}

/**
 * FXAA 抗锯齿效果配置
 */
export interface FXAAOptions extends PostProcessEffectOptions {
  /**
   * 子像素抗锯齿质量
   * @default 0.75
   */
  subpixelQuality?: number;

  /**
   * 边缘检测阈值
   * @default 0.166
   */
  edgeThreshold?: number;

  /**
   * 最小边缘阈值
   * @default 0.0833
   */
  edgeThresholdMin?: number;
}

/**
 * 亮度/对比度效果配置
 */
export interface BrightnessContrastOptions extends PostProcessEffectOptions {
  /**
   * 亮度调整 [-1.0, 1.0]
   * @default 0.0
   */
  brightness?: number;

  /**
   * 对比度调整 [0.0, 2.0]
   * @default 1.0
   */
  contrast?: number;
}

/**
 * 暗角效果配置
 */
export interface VignetteOptions extends PostProcessEffectOptions {
  /**
   * 暗角强度 [0.0, 1.0]
   * @default 0.5
   */
  intensity?: number;

  /**
   * 暗角范围 [0.0, 1.0]
   * @default 0.5
   */
  extent?: number;
}

/**
 * 后处理统计信息
 */
export interface PostProcessStats {
  /**
   * 效果数量
   */
  effectCount: number;

  /**
   * 启用的效果数量
   */
  enabledEffectCount: number;

  /**
   * 缓冲区数量
   */
  bufferCount: number;

  /**
   * 总内存使用（字节）
   */
  totalMemoryUsage: number;
}
