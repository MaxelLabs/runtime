/**
 * geometry/types.ts
 * 几何体类型定义
 */

import type { MSpec } from '@maxellabs/core';

/**
 * 顶点属性类型
 */
export type VertexAttributeType = 'position' | 'normal' | 'uv' | 'color' | 'tangent';

/**
 * 顶点属性配置
 */
export interface VertexAttributeConfig {
  /** 属性名称 */
  name: string;

  /** 属性类型 */
  type: VertexAttributeType;

  /** 顶点格式 */
  format: MSpec.RHIVertexFormat;

  /** 着色器位置 */
  shaderLocation: number;
}

/**
 * 几何体数据
 */
export interface GeometryData {
  /** 顶点数据（交错格式） */
  vertices: Float32Array;

  /** 索引数据（可选） */
  indices?: Uint16Array | Uint32Array;

  /** 顶点数量 */
  vertexCount: number;

  /** 索引数量（如果有索引） */
  indexCount?: number;

  /** 每个顶点的字节数 */
  vertexStride: number;

  /** 顶点布局 */
  layout: MSpec.RHIVertexLayout;

  /** 顶点属性信息 */
  attributes: VertexAttributeConfig[];
}

/**
 * 几何体生成选项基类
 */
export interface GeometryOptions {
  /** 是否包含法线 */
  normals?: boolean;

  /** 是否包含 UV 坐标 */
  uvs?: boolean;

  /** 是否包含顶点颜色 */
  colors?: boolean;
}

/**
 * 平面几何体选项
 */
export interface PlaneOptions extends GeometryOptions {
  /** 宽度 */
  width?: number;

  /** 高度 */
  height?: number;

  /** 宽度分段数 */
  widthSegments?: number;

  /** 高度分段数 */
  heightSegments?: number;
}

/**
 * 立方体几何体选项
 */
export interface CubeOptions extends GeometryOptions {
  /** 尺寸（统一） */
  size?: number;

  /** 宽度 */
  width?: number;

  /** 高度 */
  height?: number;

  /** 深度 */
  depth?: number;
}

/**
 * 球体几何体选项
 */
export interface SphereOptions extends GeometryOptions {
  /** 半径 */
  radius?: number;

  /** 水平分段数 */
  widthSegments?: number;

  /** 垂直分段数 */
  heightSegments?: number;
}

/**
 * 圆环几何体选项
 */
export interface TorusOptions extends GeometryOptions {
  /** 圆环半径 */
  radius?: number;

  /** 管道半径 */
  tubeRadius?: number;

  /** 径向分段数 */
  radialSegments?: number;

  /** 管道分段数 */
  tubularSegments?: number;
}
