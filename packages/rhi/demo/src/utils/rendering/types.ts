/**
 * rendering/types.ts
 * RenderTarget 渲染目标类型定义
 */

import type { MSpec } from '@maxellabs/core';

/**
 * 渲染目标配置选项
 */
export interface RenderTargetOptions {
  /**
   * 渲染目标宽度（像素）
   */
  width: number;

  /**
   * 渲染目标高度（像素）
   */
  height: number;

  /**
   * 颜色附件格式
   * @default RHITextureFormat.RGBA8_UNORM
   */
  colorFormat?: MSpec.RHITextureFormat;

  /**
   * 深度/模板附件格式
   * @default RHITextureFormat.DEPTH24_UNORM_STENCIL8
   * 设为 null 禁用深度缓冲
   */
  depthFormat?: MSpec.RHITextureFormat | null;

  /**
   * 颜色附件数量（支持 MRT - Multiple Render Targets）
   * @default 1
   */
  colorAttachmentCount?: number;

  /**
   * 颜色纹理是否使用 Mipmap
   * @default false
   */
  useMipmaps?: boolean;

  /**
   * MSAA 采样数（WebGL2 支持）
   * 常见值：1, 2, 4, 8, 16
   * @default 1
   */
  samples?: number;

  /**
   * 调试标签
   */
  label?: string;
}

/**
 * 渲染目标资源集合
 */
export interface RenderTargetResources {
  /**
   * 颜色附件纹理数组
   */
  colorTextures: MSpec.IRHITexture[];

  /**
   * 颜色附件纹理视图数组
   */
  colorViews: MSpec.IRHITextureView[];

  /**
   * 深度附件纹理（可选）
   */
  depthTexture?: MSpec.IRHITexture;

  /**
   * 深度附件纹理视图（可选）
   */
  depthView?: MSpec.IRHITextureView;
}

/**
 * 渲染通道描述符参数
 */
export type RHIRenderPassDescriptor = MSpec.RHIBeginRenderPassParams;
