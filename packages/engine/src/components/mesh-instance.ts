/**
 * MeshInstance Component - 网格实例组件
 *
 * @packageDocumentation
 *
 * @remarks
 * MeshInstance 存储已上传到 GPU 的网格数据引用。
 * 与 Core 的 MeshRef（引用外部资源 ID）不同，MeshInstance 直接持有 GPU 资源。
 *
 * ## 设计决策
 * - **直接持有 GPU 资源**: 避免每帧通过 ResourceManager 查找
 * - **与 GeometryData 配合**: GeometryData 是 CPU 数据，MeshInstance 是 GPU 数据
 * - **支持动态更新**: 可以替换 GPU 缓冲区实现动态网格
 */

import type { IRHIBuffer, IRHIRenderPipeline } from '@maxellabs/specification';
import { Component } from '@maxellabs/core';

/**
 * MeshInstance 组件 - 存储 GPU 网格资源
 *
 * @remarks
 * 此组件由 Engine.createMesh() 创建并添加到实体上。
 * ForwardRenderer 在渲染时读取此组件获取 GPU 缓冲区。
 */
export class MeshInstance extends Component {
  /** 顶点缓冲区 */
  vertexBuffer: IRHIBuffer | null = null;

  /** 索引缓冲区（可选，用于索引绘制） */
  indexBuffer: IRHIBuffer | null = null;

  /** 顶点数量 */
  vertexCount: number = 0;

  /** 索引数量（如果使用索引绘制） */
  indexCount: number = 0;

  /** 图元类型 */
  primitiveType: 'triangles' | 'lines' | 'points' = 'triangles';

  /** 顶点属性布局（用于 Pipeline 创建） */
  vertexLayout: VertexAttributeLayout[] = [];

  /** 关联的渲染管线（缓存，避免重复创建） */
  pipeline: IRHIRenderPipeline | null = null;

  /**
   * 克隆组件
   * @returns 克隆的 MeshInstance 实例
   *
   * @remarks
   * 注意：克隆不会复制 GPU 资源，而是共享引用。
   * 如需独立的 GPU 资源，应重新调用 Engine.createMesh()。
   */
  override clone(): MeshInstance {
    const cloned = new MeshInstance();
    cloned.vertexBuffer = this.vertexBuffer;
    cloned.indexBuffer = this.indexBuffer;
    cloned.vertexCount = this.vertexCount;
    cloned.indexCount = this.indexCount;
    cloned.primitiveType = this.primitiveType;
    cloned.vertexLayout = [...this.vertexLayout];
    cloned.pipeline = this.pipeline;
    return cloned;
  }

  /**
   * 释放 GPU 资源
   *
   * @remarks
   * 调用此方法后，组件不应再被使用。
   * 通常在实体销毁时由 Engine 自动调用。
   */
  override dispose(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
      this.vertexBuffer = null;
    }
    if (this.indexBuffer) {
      this.indexBuffer.destroy();
      this.indexBuffer = null;
    }
    this.pipeline = null;
  }
}

/**
 * 顶点属性布局
 */
export interface VertexAttributeLayout {
  /** 属性名称（如 'position', 'normal', 'uv'） */
  name: string;

  /** 着色器位置（location） */
  location: number;

  /** 数据格式 */
  format: 'float32x2' | 'float32x3' | 'float32x4';

  /** 字节偏移 */
  offset: number;
}

/**
 * 标准顶点布局（Position + Normal + UV）
 */
export const STANDARD_VERTEX_LAYOUT: VertexAttributeLayout[] = [
  { name: 'position', location: 0, format: 'float32x3', offset: 0 },
  { name: 'normal', location: 1, format: 'float32x3', offset: 12 },
  { name: 'uv', location: 2, format: 'float32x2', offset: 24 },
];

/**
 * 计算顶点步长（stride）
 */
export function calculateVertexStride(layout: VertexAttributeLayout[]): number {
  let maxOffset = 0;
  let lastSize = 0;

  for (const attr of layout) {
    if (attr.offset >= maxOffset) {
      maxOffset = attr.offset;
      lastSize = getFormatSize(attr.format);
    }
  }

  return maxOffset + lastSize;
}

/**
 * 获取格式的字节大小
 */
function getFormatSize(format: VertexAttributeLayout['format']): number {
  switch (format) {
    case 'float32x2':
      return 8;
    case 'float32x3':
      return 12;
    case 'float32x4':
      return 16;
    default:
      return 0;
  }
}
