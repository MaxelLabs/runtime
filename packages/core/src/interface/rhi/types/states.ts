/**
 * states.ts
 * 包含所有RHI渲染状态的类型定义
 */

import type {
  RHIBlendOperation,
  RHIBlendFactor,
  RHICompareFunction,
  RHIStencilOperation,
  RHIFrontFace,
  RHICullMode,
  RHIVertexFormat,
  RHITextureFormat,
} from './enums';

/**
 * 顶点布局描述符
 */
export interface RHIVertexAttribute {
  /**
   * 属性名称
   */
  name?: string,

  /**
   * 属性格式
   */
  format: RHIVertexFormat,

  /**
   * 属性在顶点中的偏移量(字节)
   */
  offset: number,

  /**
   * 属性的语义索引(在着色器中的位置)
   * WebGL中会尝试通过name找到，如果找不到则使用此值
   * WebGPU中直接使用此值
   */
  shaderLocation: number,
}

/**
 * 顶点缓冲区布局
 */
export interface RHIVertexBufferLayout {
  /**
   * 顶点缓冲区的索引
   */
  index: number,

  /**
   * 顶点缓冲区的属性列表
   */
  attributes: RHIVertexAttribute[],

  /**
   * 顶点步长(字节)
   */
  stride: number,

  /**
   * 步进模式
   */
  stepMode?: 'vertex' | 'instance',
}

/**
 * 顶点输入布局
 */
export interface RHIVertexLayout {
  /**
   * 顶点缓冲区列表
   */
  buffers: RHIVertexBufferLayout[],
}

/**
 * 颜色混合操作
 */
export interface RHIBlendComponent {
  /**
   * 是否启用混合
   */
  enable?: boolean,

  /**
   * 源混合因子
   */
  srcFactor?: RHIBlendFactor,

  /**
   * 目标混合因子
   */
  dstFactor?: RHIBlendFactor,

  /**
   * 混合操作
   */
  operation?: RHIBlendOperation,
}

/**
 * 颜色混合描述符
 */
export interface RHIColorBlendAttachment {
  /**
   * 颜色混合参数
   */
  color: RHIBlendComponent,

  /**
   * Alpha混合参数
   */
  alpha: RHIBlendComponent,
}

/**
 * 颜色混合状态
 */
export interface RHIColorBlendState {
  /**
   * 渲染目标的混合状态
   */
  attachments: RHIColorBlendAttachment[],

  /**
   * 颜色混合常量
   */
  blendConstants?: [number, number, number, number],
}

/**
 * 深度模板状态
 */
export interface RHIDepthStencilState {
  /**
   * 深度格式
   */
  format: RHITextureFormat,

  /**
   * 是否启用深度写入
   */
  depthWriteEnabled?: boolean,

  /**
   * 深度比较函数
   */
  depthCompare?: RHICompareFunction,

  /**
   * 前向面模板状态
   */
  stencilFront?: RHIStencilFaceState,

  /**
   * 后向面模板状态
   */
  stencilBack?: RHIStencilFaceState,

  /**
   * 模板读取掩码
   */
  stencilReadMask?: number,

  /**
   * 模板写入掩码
   */
  stencilWriteMask?: number,

  /**
   * 深度偏移
   */
  depthBias?: number,

  /**
   * 深度偏移斜率缩放
   */
  depthBiasSlopeScale?: number,

  /**
   * 深度偏移钳制值
   */
  depthBiasClamp?: number,
}

/**
 * 模板面状态
 */
export interface RHIStencilFaceState {
  /**
   * 比较函数
   */
  compare?: RHICompareFunction,

  /**
   * 失败操作
   */
  failOp?: RHIStencilOperation,

  /**
   * 深度失败操作
   */
  depthFailOp?: RHIStencilOperation,

  /**
   * 通过操作
   */
  passOp?: RHIStencilOperation,
}

/**
 * 光栅化状态
 */
export interface RHIRasterizationState {
  /**
   * 正面方向
   */
  frontFace?: RHIFrontFace,

  /**
   * 剔除模式
   */
  cullMode?: RHICullMode,

  /**
   * 是否启用多重采样
   */
  multisampleEnabled?: boolean,

  /**
   * 线宽
   */
  lineWidth?: number,

  /**
   * 是否启用深度偏置
   */
  depthBiasEnabled?: boolean,
}