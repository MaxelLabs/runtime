/**
 * device.ts
 * 定义RHI设备接口
 */

import type { IRHIBuffer } from './resources/buffer';
import type { IRHITexture, IRHITextureView } from './resources/texture';
import type { IRHIShaderModule } from './resources/shader';
import type { IRHISampler, IRHIBindGroup, IRHIBindGroupLayout } from './bindings';
import type { IRHIPipelineLayout, IRHIRenderPipeline, IRHIComputePipeline } from './pipeline';
import type { IRHIRenderPass } from './passes/renderPass';
import type { IRHIComputePass } from './passes/computePass';
import type {
  RHIBufferDescriptor,
  RHITextureDescriptor,
  RHIRenderPipelineDescriptor,
  RHIComputePipelineDescriptor,
  RHIShaderModuleDescriptor,
  RHISamplerDescriptor,
} from './types/descriptors';
import type { RHIBackend, RHIFeatureFlags } from './types/enums';

/**
 * 渲染设备信息
 */
export interface IRHIDeviceInfo {
  /**
   * 设备名称
   */
  deviceName: string;

  /**
   * 供应商名称
   */
  vendorName: string;

  /**
   * 渲染后端
   */
  backend: RHIBackend;

  /**
   * 支持的特性
   */
  features: RHIFeatureFlags;

  /**
   * 最大纹理尺寸
   */
  maxTextureSize: number;

  /**
   * 最大工作组大小
   */
  maxWorkgroupSize?: [number, number, number];

  /**
   * 是否支持各向异性过滤
   */
  supportsAnisotropy: boolean;

  /**
   * 是否支持多重采样抗锯齿
   */
  supportsMSAA: boolean;

  /**
   * 最大采样数量
   */
  maxSampleCount: number;

  /**
   * 最大绑定数量
   */
  maxBindings: number;

  /**
   * 着色器语言版本信息
   */
  shaderLanguageVersion: string;
}

/**
 * 命令编码器接口
 */
export interface IRHICommandEncoder {
  /**
   * 开始渲染通道
   */
  beginRenderPass(options: {
    /**
     * 颜色附件
     */
    colorAttachments: Array<{
      /**
       * 附件纹理视图
       */
      view: IRHITextureView;

      /**
       * 解析目标视图 (用于MSAA)
       */
      resolveTarget?: IRHITextureView;

      /**
       * 加载操作
       */
      loadOp: 'load' | 'clear' | 'none';

      /**
       * 存储操作
       */
      storeOp: 'store' | 'discard';

      /**
       * 清除颜色
       */
      clearColor?: [number, number, number, number];
    }>;

    /**
     * 深度模板附件
     */
    depthStencilAttachment?: {
      /**
       * 附件纹理视图
       */
      view: IRHITextureView;

      /**
       * 深度加载操作
       */
      depthLoadOp: 'load' | 'clear' | 'none';

      /**
       * 深度存储操作
       */
      depthStoreOp: 'store' | 'discard';

      /**
       * 深度清除值
       */
      clearDepth?: number;

      /**
       * 深度写入启用
       */
      depthWriteEnabled?: boolean;

      /**
       * 模板加载操作
       */
      stencilLoadOp?: 'load' | 'clear' | 'none';

      /**
       * 模板存储操作
       */
      stencilStoreOp?: 'store' | 'discard';

      /**
       * 模板清除值
       */
      clearStencil?: number;
    };

    /**
     * 通道标签
     */
    label?: string;
  }): IRHIRenderPass;

  /**
   * 开始计算通道
   */
  beginComputePass(options?: {
    /**
     * 通道标签
     */
    label?: string;
  }): IRHIComputePass;

  /**
   * 复制缓冲区到缓冲区
   */
  copyBufferToBuffer(
    source: IRHIBuffer,
    sourceOffset: number,
    destination: IRHIBuffer,
    destinationOffset: number,
    size: number
  ): void;

  /**
   * 复制缓冲区到纹理
   */
  copyBufferToTexture(
    source: {
      buffer: IRHIBuffer;
      offset?: number;
      bytesPerRow: number;
      rowsPerImage?: number;
    },
    destination: {
      texture: IRHITexture;
      mipLevel?: number;
      origin?: [number, number, number];
    },
    copySize: [number, number, number]
  ): void;

  /**
   * 复制纹理到缓冲区
   */
  copyTextureToBuffer(
    source: {
      texture: IRHITexture;
      mipLevel?: number;
      origin?: [number, number, number];
    },
    destination: {
      buffer: IRHIBuffer;
      offset?: number;
      bytesPerRow: number;
      rowsPerImage?: number;
    },
    copySize: [number, number, number]
  ): void;

  /**
   * 复制纹理到纹理
   */
  copyTextureToTexture(
    source: {
      texture: IRHITexture;
      mipLevel?: number;
      origin?: [number, number, number];
    },
    destination: {
      texture: IRHITexture;
      mipLevel?: number;
      origin?: [number, number, number];
    },
    copySize: [number, number, number]
  ): void;

  /**
   * 复制纹理到画布
   * 这是为了兼容不同后端（如WebGPU）的渲染架构
   */
  copyTextureToCanvas(options: {
    /**
     * 源纹理视图
     */
    source: IRHITextureView;

    /**
     * 目标画布
     */
    destination: HTMLCanvasElement;

    /**
     * 源纹理起始位置
     */
    origin?: [number, number];

    /**
     * 复制区域大小
     */
    extent?: [number, number];
  }): void;

  /**
   * 结束命令编码
   */
  finish(options?: {
    /**
     * 命令标签
     */
    label?: string;
  }): IRHICommandBuffer;

  /**
   * 添加自定义命令
   * 仅供内部使用，由RenderPass等组件调用
   * @param command 要执行的命令函数
   */
  addCommand(command: () => void): void;
}

/**
 * 命令缓冲区接口
 */
export interface IRHICommandBuffer {
  /**
   * 命令标签
   */
  readonly label?: string;
}

/**
 * RHI设备接口
 */
export interface IRHIDevice {
  /**
   * 设备信息
   */
  readonly info: IRHIDeviceInfo;

  /**
   * 创建缓冲区
   */
  createBuffer(descriptor: RHIBufferDescriptor): IRHIBuffer;

  /**
   * 创建纹理
   */
  createTexture(descriptor: RHITextureDescriptor): IRHITexture;

  /**
   * 创建采样器
   */
  createSampler(descriptor?: RHISamplerDescriptor): IRHISampler;

  /**
   * 创建着色器模块
   */
  createShaderModule(descriptor: RHIShaderModuleDescriptor): IRHIShaderModule;

  /**
   * 创建绑定组布局
   */
  createBindGroupLayout(entries: any[], label?: string): IRHIBindGroupLayout;

  /**
   * 创建管线布局
   */
  createPipelineLayout(bindGroupLayouts: IRHIBindGroupLayout[], label?: string): IRHIPipelineLayout;

  /**
   * 创建绑定组
   */
  createBindGroup(layout: IRHIBindGroupLayout, entries: any[], label?: string): IRHIBindGroup;

  /**
   * 创建渲染管线
   */
  createRenderPipeline(descriptor: RHIRenderPipelineDescriptor): IRHIRenderPipeline;

  /**
   * 创建计算管线
   */
  createComputePipeline(descriptor: RHIComputePipelineDescriptor): IRHIComputePipeline;

  /**
   * 创建命令编码器
   */
  createCommandEncoder(label?: string): IRHICommandEncoder;

  /**
   * 提交命令
   */
  submit(commandBuffers: IRHICommandBuffer[]): void;

  /**
   * 检查设备丢失
   */
  checkDeviceLost(): Promise<void>;

  /**
   * 销毁设备
   */
  destroy(): void;
}
