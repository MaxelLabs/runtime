/**
 * commands.ts
 * RHI 命令参数类型定义
 *
 * 定义命令缓冲区中各种命令的参数类型，用于替代 any 类型，
 * 提供类型安全的命令参数传递。
 */

import type { IRHIBuffer, IRHITexture, IRHITextureView } from '../resources';
import type { IRHIBindGroup } from '../bindings';
import type { IRHIRenderPipeline } from '../pipeline';
import type { RHIPrimitiveTopology, RHIIndexFormat } from './enums';

// =============================================================================
// 渲染通道命令参数
// =============================================================================

/**
 * 颜色附件描述
 */
export interface RHIColorAttachmentParams {
  /** 纹理视图 */
  view: IRHITextureView;
  /** 解析目标（MSAA） */
  resolveTarget?: IRHITextureView;
  /** 加载操作 */
  loadOp: 'load' | 'clear' | 'none';
  /** 存储操作 */
  storeOp: 'store' | 'discard';
  /** 清除颜色 [r, g, b, a] */
  clearColor?: [number, number, number, number];
}

/**
 * 深度模板附件描述
 */
export interface RHIDepthStencilAttachmentParams {
  /** 纹理视图 */
  view: IRHITextureView;
  /** 深度加载操作 */
  depthLoadOp: 'load' | 'clear' | 'none';
  /** 深度存储操作 */
  depthStoreOp: 'store' | 'discard';
  /** 清除深度值 */
  clearDepth?: number;
  /** 深度写入启用 */
  depthWriteEnabled?: boolean;
  /** 模板加载操作 */
  stencilLoadOp?: 'load' | 'clear' | 'none';
  /** 模板存储操作 */
  stencilStoreOp?: 'store' | 'discard';
  /** 清除模板值 */
  clearStencil?: number;
}

/**
 * 开始渲染通道命令参数
 */
export interface RHIBeginRenderPassParams {
  /** 颜色附件列表 */
  colorAttachments?: RHIColorAttachmentParams[];
  /** 深度模板附件 */
  depthStencilAttachment?: RHIDepthStencilAttachmentParams;
  /** 通道标签 */
  label?: string;
}

// =============================================================================
// 绘制命令参数
// =============================================================================

/**
 * 绘制命令参数
 */
export interface RHIDrawParams {
  /** 顶点数量 */
  vertexCount: number;
  /** 实例数量 */
  instanceCount?: number;
  /** 起始顶点索引 */
  firstVertex?: number;
  /** 起始实例索引 */
  firstInstance?: number;
  /** 图元拓扑类型 */
  primitiveTopology?: RHIPrimitiveTopology;
}

/**
 * 索引绘制命令参数
 */
export interface RHIDrawIndexedParams {
  /** 索引数量 */
  indexCount: number;
  /** 实例数量 */
  instanceCount?: number;
  /** 起始索引 */
  firstIndex?: number;
  /** 基础顶点偏移 */
  baseVertex?: number;
  /** 起始实例索引 */
  firstInstance?: number;
  /** 索引类型（WebGL 常量） */
  indexType?: number;
  /** 图元类型（WebGL 常量） */
  primitiveType?: number;
}

// =============================================================================
// 资源复制命令参数
// =============================================================================

/**
 * 缓冲区到缓冲区复制参数
 */
export interface RHICopyBufferToBufferParams {
  /** 源缓冲区 */
  source: IRHIBuffer;
  /** 源偏移量（字节） */
  sourceOffset: number;
  /** 目标缓冲区 */
  destination: IRHIBuffer;
  /** 目标偏移量（字节） */
  destinationOffset: number;
  /** 复制大小（字节） */
  size: number;
}

/**
 * 缓冲区源描述
 */
export interface RHIBufferCopySource {
  /** 缓冲区 */
  buffer: IRHIBuffer;
  /** 偏移量（字节） */
  offset?: number;
  /** 每行字节数 */
  bytesPerRow: number;
  /** 每图像行数 */
  rowsPerImage?: number;
}

/**
 * 纹理复制目标描述
 */
export interface RHITextureCopyDestination {
  /** 纹理 */
  texture: IRHITexture;
  /** MIP 等级 */
  mipLevel?: number;
  /** 起始坐标 [x, y, z] */
  origin?: [number, number, number];
}

/**
 * 纹理复制源描述
 */
export interface RHITextureCopySource {
  /** 纹理 */
  texture: IRHITexture;
  /** MIP 等级 */
  mipLevel?: number;
  /** 起始坐标 [x, y, z] */
  origin?: [number, number, number];
}

/**
 * 缓冲区复制目标描述
 */
export interface RHIBufferCopyDestination {
  /** 缓冲区 */
  buffer: IRHIBuffer;
  /** 偏移量（字节） */
  offset?: number;
  /** 每行字节数 */
  bytesPerRow: number;
  /** 每图像行数 */
  rowsPerImage?: number;
}

/**
 * 缓冲区到纹理复制参数
 */
export interface RHICopyBufferToTextureParams {
  /** 源缓冲区描述 */
  source: RHIBufferCopySource;
  /** 目标纹理描述 */
  destination: RHITextureCopyDestination;
  /** 复制尺寸 [width, height, depth] */
  copySize: [number, number, number];
}

/**
 * 纹理到缓冲区复制参数
 */
export interface RHICopyTextureToBufferParams {
  /** 源纹理描述 */
  source: RHITextureCopySource;
  /** 目标缓冲区描述 */
  destination: RHIBufferCopyDestination;
  /** 复制尺寸 [width, height, depth] */
  copySize: [number, number, number];
}

/**
 * 纹理到纹理复制参数
 */
export interface RHICopyTextureToTextureParams {
  /** 源纹理描述 */
  source: RHITextureCopySource;
  /** 目标纹理描述 */
  destination: RHITextureCopyDestination;
  /** 复制尺寸 [width, height, depth] */
  copySize: [number, number, number];
}

/**
 * 纹理到画布复制参数
 */
export interface RHICopyTextureToCanvasParams {
  /** 源纹理视图 */
  source: IRHITextureView;
  /** 目标画布 */
  destination?: HTMLCanvasElement;
  /** 起始坐标 [x, y] */
  origin?: [number, number];
  /** 复制尺寸 [width, height] */
  extent?: [number, number];
}

// =============================================================================
// 状态设置命令参数
// =============================================================================

/**
 * 设置视口命令参数
 */
export interface RHISetViewportParams {
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 最小深度 */
  minDepth?: number;
  /** 最大深度 */
  maxDepth?: number;
}

/**
 * 设置裁剪区域命令参数
 */
export interface RHISetScissorParams {
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 设置管线命令参数
 */
export interface RHISetPipelineParams {
  /** 渲染管线 */
  pipeline: IRHIRenderPipeline;
}

/**
 * 设置绑定组命令参数
 */
export interface RHISetBindGroupParams {
  /** 绑定组 */
  bindGroup: IRHIBindGroup;
  /** 着色器程序（WebGL 特有） */
  program?: WebGLProgram;
  /** 动态偏移量 */
  dynamicOffsets?: number[];
}

/**
 * 命令用顶点缓冲区绑定描述
 */
export interface RHICommandVertexBufferBinding {
  /** 缓冲区 */
  buffer: IRHIBuffer;
  /** 偏移量（字节） */
  offset?: number;
}

/**
 * 设置顶点缓冲区命令参数
 */
export interface RHISetVertexBuffersParams {
  /** 起始槽位 */
  startSlot: number;
  /** 缓冲区列表 */
  buffers: RHICommandVertexBufferBinding[];
  /** 渲染管线（用于获取顶点布局） */
  pipeline: IRHIRenderPipeline;
}

/**
 * 设置索引缓冲区命令参数
 */
export interface RHISetIndexBufferParams {
  /** 索引缓冲区 */
  buffer: IRHIBuffer;
  /** 索引格式 */
  indexFormat?: RHIIndexFormat;
  /** 偏移量（字节） */
  offset?: number;
}

// =============================================================================
// 自定义命令参数
// =============================================================================

/**
 * 自定义命令参数
 */
export interface RHICustomCommandParams {
  /** 执行函数 */
  execute: () => void;
}

// =============================================================================
// 命令对象类型
// =============================================================================

/**
 * 命令类型字符串字面量
 */
export type RHICommandType =
  | 'beginRenderPass'
  | 'endRenderPass'
  | 'copyBufferToBuffer'
  | 'copyBufferToTexture'
  | 'copyTextureToBuffer'
  | 'copyTextureToTexture'
  | 'copyTextureToCanvas'
  | 'draw'
  | 'drawIndexed'
  | 'setViewport'
  | 'setScissor'
  | 'setPipeline'
  | 'setBindGroup'
  | 'setVertexBuffers'
  | 'setIndexBuffer'
  | 'custom';

/**
 * 命令参数联合类型
 */
export type RHICommandParams =
  | RHIBeginRenderPassParams
  | RHICopyBufferToBufferParams
  | RHICopyBufferToTextureParams
  | RHICopyTextureToBufferParams
  | RHICopyTextureToTextureParams
  | RHICopyTextureToCanvasParams
  | RHIDrawParams
  | RHIDrawIndexedParams
  | RHISetViewportParams
  | RHISetScissorParams
  | RHISetPipelineParams
  | RHISetBindGroupParams
  | RHISetVertexBuffersParams
  | RHISetIndexBufferParams
  | RHICustomCommandParams
  | Record<string, never>; // 用于 endRenderPass 等无参数命令

/**
 * 命令对象接口
 */
export interface RHICommand {
  /** 命令类型 */
  type: RHICommandType;
  /** 命令参数 */
  params: RHICommandParams;
}

/**
 * 带类型的命令对象（用于类型推断）
 */
export interface RHITypedCommand<T extends RHICommandType, P extends RHICommandParams> {
  type: T;
  params: P;
}

// =============================================================================
// 命令类型映射（用于高级类型推断）
// =============================================================================

/**
 * 命令类型到参数类型的映射
 */
export interface RHICommandParamsMap {
  beginRenderPass: RHIBeginRenderPassParams;
  endRenderPass: Record<string, never>;
  copyBufferToBuffer: RHICopyBufferToBufferParams;
  copyBufferToTexture: RHICopyBufferToTextureParams;
  copyTextureToBuffer: RHICopyTextureToBufferParams;
  copyTextureToTexture: RHICopyTextureToTextureParams;
  copyTextureToCanvas: RHICopyTextureToCanvasParams;
  draw: RHIDrawParams;
  drawIndexed: RHIDrawIndexedParams;
  setViewport: RHISetViewportParams;
  setScissor: RHISetScissorParams;
  setPipeline: RHISetPipelineParams;
  setBindGroup: RHISetBindGroupParams;
  setVertexBuffers: RHISetVertexBuffersParams;
  setIndexBuffer: RHISetIndexBufferParams;
  custom: RHICustomCommandParams;
}
