/**
 * states.ts
 * 包含所有RHI渲染状态的类型定义
 */

import type { RHIBlendFactor, RHIBlendOperation, RHICompareFunction, RHICullMode, RHIFrontFace } from '@maxellabs/math';
import type { RHIStencilOperation, RHIVertexFormat, RHITextureFormat } from './enums';

/**
 * 顶点布局描述符
 */
export interface RHIVertexAttribute {
  /**
   * 属性名称
   */
  name?: string;

  /**
   * 属性格式
   */
  format: RHIVertexFormat;

  /**
   * 属性在顶点中的偏移量(字节)
   */
  offset: number;

  /**
   * 属性的语义索引(在着色器中的位置)
   * WebGL中会尝试通过name找到，如果找不到则使用此值
   * WebGPU中直接使用此值
   */
  shaderLocation: number;
}

/**
 * 顶点缓冲区布局
 */
export interface RHIVertexBufferLayout {
  /**
   * 顶点缓冲区的索引
   */
  index: number;

  /**
   * 顶点缓冲区的属性列表
   */
  attributes: RHIVertexAttribute[];

  /**
   * 顶点步长(字节)
   */
  stride: number;

  /**
   * 步进模式
   */
  stepMode?: 'vertex' | 'instance';
}

/**
 * 顶点输入布局
 */
export interface RHIVertexLayout {
  /**
   * 顶点缓冲区列表
   */
  buffers: RHIVertexBufferLayout[];
}

/**
 * 颜色混合操作
 */
export interface RHIBlendComponent {
  /**
   * 是否启用混合
   */
  enable?: boolean;

  /**
   * 源混合因子
   */
  srcFactor?: RHIBlendFactor;

  /**
   * 目标混合因子
   */
  dstFactor?: RHIBlendFactor;

  /**
   * 混合操作
   */
  operation?: RHIBlendOperation;
}

/**
 * 颜色混合描述符
 */
export interface RHIColorBlendAttachment {
  /**
   * 颜色混合参数
   */
  color: RHIBlendComponent;

  /**
   * Alpha混合参数
   */
  alpha: RHIBlendComponent;
}

/**
 * 颜色混合状态
 */
export interface RHIColorBlendState {
  /**
   * 渲染目标的混合状态
   */
  attachments: RHIColorBlendAttachment[];

  /**
   * 颜色混合常量
   */
  blendConstants?: [number, number, number, number];

  /**
   * 是否启用混合，WebGL中使用
   */
  blendEnabled?: boolean;

  /**
   * 颜色混合操作，WebGL中使用
   * 在GL中用于blendEquationSeparate的第一个参数
   */
  colorBlendOperation?: RHIBlendOperation;

  /**
   * Alpha混合操作，WebGL中使用
   * 在GL中用于blendEquationSeparate的第二个参数
   */
  alphaBlendOperation?: RHIBlendOperation;

  /**
   * 源颜色因子，WebGL中使用
   * 在GL中用于blendFuncSeparate的第一个参数
   */
  srcColorFactor?: RHIBlendFactor;

  /**
   * 目标颜色因子，WebGL中使用
   * 在GL中用于blendFuncSeparate的第二个参数
   */
  dstColorFactor?: RHIBlendFactor;

  /**
   * 源Alpha因子，WebGL中使用
   * 在GL中用于blendFuncSeparate的第三个参数
   */
  srcAlphaFactor?: RHIBlendFactor;

  /**
   * 目标Alpha因子，WebGL中使用
   * 在GL中用于blendFuncSeparate的第四个参数
   */
  dstAlphaFactor?: RHIBlendFactor;

  /**
   * 混合颜色，WebGL中使用
   * 在GL中用于blendColor函数
   */
  blendColor?: [number, number, number, number];

  /**
   * 颜色写入掩码，WebGL中使用
   * 在GL中用于colorMask函数
   * 0x1: 红, 0x2: 绿, 0x4: 蓝, 0x8: Alpha
   */
  writeMask?: number;
}

/**
 * 深度模板状态
 */
export interface RHIDepthStencilState {
  /**
   * 深度格式
   */
  format: RHITextureFormat;

  /**
   * 是否启用深度测试
   * 在WebGL中决定是否调用gl.enable(gl.DEPTH_TEST)
   */
  depthTestEnabled?: boolean;

  /**
   * 是否启用深度写入
   */
  depthWriteEnabled?: boolean;

  /**
   * 深度比较函数
   */
  depthCompare?: RHICompareFunction;

  /**
   * 前向面模板状态
   */
  stencilFront?: RHIStencilFaceState;

  /**
   * 后向面模板状态
   */
  stencilBack?: RHIStencilFaceState;

  /**
   * 模板读取掩码
   */
  stencilReadMask?: number;

  /**
   * 模板写入掩码
   */
  stencilWriteMask?: number;

  /**
   * 深度偏移
   */
  depthBias?: number;

  /**
   * 深度偏移斜率缩放
   */
  depthBiasSlopeScale?: number;

  /**
   * 深度偏移钳制值
   */
  depthBiasClamp?: number;
}

/**
 * 模板面状态
 */
export interface RHIStencilFaceState {
  /**
   * 比较函数
   */
  compare?: RHICompareFunction;

  /**
   * 失败操作
   */
  failOp?: RHIStencilOperation;

  /**
   * 深度失败操作
   */
  depthFailOp?: RHIStencilOperation;

  /**
   * 通过操作
   */
  passOp?: RHIStencilOperation;

  /**
   * 模板参考值，WebGL中使用
   * 在GL中的glStencilFuncSeparate的第二个参数
   */
  reference?: number;

  /**
   * 模板读取掩码，WebGL中使用
   * 在GL中的glStencilFuncSeparate的第三个参数
   */
  readMask?: number;

  /**
   * 模板写入掩码，WebGL中使用
   * 在GL中用于glStencilMaskSeparate的第二个参数
   */
  writeMask?: number;
}

/**
 * 光栅化状态
 */
export interface RHIRasterizationState {
  /**
   * 正面方向
   */
  frontFace?: RHIFrontFace;

  /**
   * 剔除模式
   */
  cullMode?: RHICullMode;

  /**
   * 是否启用多重采样
   */
  multisampleEnabled?: boolean;

  /**
   * 线宽
   */
  lineWidth?: number;

  /**
   * 是否启用深度偏置
   */
  depthBiasEnabled?: boolean;

  /**
   * 深度偏移值，WebGL中使用
   * 在GL中polygonOffset的第二个参数
   */
  depthBias?: number;

  /**
   * 深度偏移斜率缩放，WebGL中使用
   * 在GL中polygonOffset的第一个参数
   */
  depthBiasSlopeScale?: number;
}
