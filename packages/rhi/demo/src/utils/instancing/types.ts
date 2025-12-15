/**
 * instancing/types.ts
 * 实例化渲染模块类型定义
 */

import type { MSpec } from '@maxellabs/core';

/**
 * 实例属性定义
 * 描述实例化数据在着色器中的布局
 */
export interface InstanceAttribute {
  /** 属性名称（如 'instanceMatrix', 'instanceColor'） */
  name: string;
  /** 着色器 location（如 2 for first column of mat4） */
  location: number;
  /** 数据格式 */
  format: MSpec.RHIVertexFormat;
  /** 在实例数据块中的字节偏移 */
  offset: number;
}

/**
 * 实例化渲染配置选项
 */
export interface InstancedRenderOptions {
  /** 最大实例数，默认 10000 */
  maxInstances?: number;
  /** 每实例数据布局描述 */
  instanceLayout: InstanceAttribute[];
  /** 是否支持动态更新，默认 true */
  dynamic?: boolean;
  /** 资源标签，用于调试 */
  label?: string;
}

/**
 * 标准实例数据布局（推荐）
 * 总大小：80 bytes per instance
 *
 * 内存布局（std140 对齐）：
 * [0-63]   mat4 modelMatrix  (64 bytes)
 * [64-79]  vec4 color        (16 bytes)
 */
export interface StandardInstanceData {
  /** 模型矩阵 (mat4) - 64 bytes */
  modelMatrix: Float32Array; // 16 floats
  /** 颜色 (vec4) - 16 bytes */
  color: Float32Array; // 4 floats
}

/**
 * 实例化渲染统计信息
 */
export interface InstanceStats {
  /** 当前激活的实例数 */
  instanceCount: number;
  /** 缓冲区可容纳的最大实例数 */
  maxInstances: number;
  /** GPU 缓冲区总大小（字节） */
  bufferSize: number;
  /** 缓冲区使用率（0.0 - 1.0） */
  usage: number;
  /** 每实例数据大小（字节） */
  strideBytes: number;
}

/**
 * 基础几何体配置
 * 用于实例化渲染的基础几何体数据
 */
export interface BaseGeometryConfig {
  /** 顶点缓冲区 */
  vertexBuffer: MSpec.IRHIBuffer;
  /** 索引缓冲区（可选） */
  indexBuffer?: MSpec.IRHIBuffer;
  /** 顶点数量（非索引渲染时使用） */
  vertexCount: number;
  /** 索引数量（索引渲染时使用） */
  indexCount?: number;
  /** 索引格式（索引渲染时使用） */
  indexFormat?: MSpec.RHIIndexFormat;
}

/**
 * 标准实例属性布局
 * 用于生成标准的实例化数据布局（mat4 + vec4）
 *
 * @param baseLocation 起始 location，默认 2
 * @returns 实例属性布局数组
 *
 * @example
 * ```typescript
 * const layout = getStandardInstanceLayout(2);
 * // Returns:
 * // location 2-5: mat4 modelMatrix (4 vec4 rows)
 * // location 6:   vec4 color
 * ```
 */
export function getStandardInstanceLayout(baseLocation: number = 2): InstanceAttribute[] {
  return [
    // mat4 modelMatrix - 占用 4 个 location (每列一个 vec4)
    {
      name: 'instanceMatrixRow0',
      location: baseLocation,
      format: 'float32x4' as MSpec.RHIVertexFormat,
      offset: 0,
    },
    {
      name: 'instanceMatrixRow1',
      location: baseLocation + 1,
      format: 'float32x4' as MSpec.RHIVertexFormat,
      offset: 16,
    },
    {
      name: 'instanceMatrixRow2',
      location: baseLocation + 2,
      format: 'float32x4' as MSpec.RHIVertexFormat,
      offset: 32,
    },
    {
      name: 'instanceMatrixRow3',
      location: baseLocation + 3,
      format: 'float32x4' as MSpec.RHIVertexFormat,
      offset: 48,
    },
    // vec4 color
    {
      name: 'instanceColor',
      location: baseLocation + 4,
      format: 'float32x4' as MSpec.RHIVertexFormat,
      offset: 64,
    },
  ];
}

/**
 * 计算实例数据步长（字节数）
 *
 * @param layout 实例属性布局
 * @returns 每实例数据的字节数
 */
export function calculateInstanceStride(layout: InstanceAttribute[]): number {
  if (layout.length === 0) {
    return 0;
  }

  // 找到最大的 offset + 对应格式的大小
  let maxOffset = 0;
  let maxFormatSize = 0;

  for (const attr of layout) {
    if (attr.offset >= maxOffset) {
      maxOffset = attr.offset;
      maxFormatSize = getFormatSize(attr.format);
    }
  }

  return maxOffset + maxFormatSize;
}

/**
 * 获取顶点格式的字节大小
 *
 * @param format 顶点格式
 * @returns 字节数
 */
function getFormatSize(format: MSpec.RHIVertexFormat): number {
  switch (format) {
    case 'float32':
      return 4;
    case 'float32x2':
      return 8;
    case 'float32x3':
      return 12;
    case 'float32x4':
      return 16;
    case 'uint32':
    case 'sint32':
      return 4;
    case 'uint32x2':
    case 'sint32x2':
      return 8;
    case 'uint32x3':
    case 'sint32x3':
      return 12;
    case 'uint32x4':
    case 'sint32x4':
      return 16;
    default:
      console.warn(`[Instancing] Unknown vertex format: ${format}, assuming 4 bytes`);
      return 4;
  }
}
