/**
 * Resource Types Specification
 * 资源类型规范定义
 *
 * @packageDocumentation
 *
 * @remarks
 * 定义资源管理系统使用的基础类型和接口。
 * 这些类型可被多个包使用，包括 Core、Effects、Engine 等。
 */

import type { IRHIDevice, IRHIBuffer, IRHITexture } from '../common/rhi';

// ============================================================================
// 资源枚举
// ============================================================================

/**
 * 资源类型枚举
 * @description 定义引擎支持的资源类型
 */
export enum ResourceType {
  /** 网格资源 */
  Mesh = 'mesh',
  /** 纹理资源 */
  Texture = 'texture',
  /** 材质资源 */
  Material = 'material',
  /** 着色器资源 */
  Shader = 'shader',
  /** 动画资源 */
  Animation = 'animation',
  /** 音频资源 */
  Audio = 'audio',
  /** 自定义资源 */
  Custom = 'custom',
}

/**
 * 资源状态枚举
 * @description 定义资源的生命周期状态
 */
export enum ResourceState {
  /** 等待加载 */
  Pending = 'pending',
  /** 加载中 */
  Loading = 'loading',
  /** 已加载 */
  Loaded = 'loaded',
  /** 加载失败 */
  Failed = 'failed',
  /** 已释放 */
  Released = 'released',
}

// ============================================================================
// 资源句柄
// ============================================================================

/**
 * 资源句柄接口
 * @description 用于引用已加载的资源
 */
export interface IResourceHandle {
  /** 资源唯一 ID */
  readonly id: string;
  /** 资源类型 */
  readonly type: ResourceType;
  /** 资源 URI */
  readonly uri: string;
}

// ============================================================================
// 资源数据接口
// ============================================================================

/**
 * 网格资源数据
 * @description 网格资源的运行时数据结构
 */
export interface IMeshResource {
  /** 顶点缓冲区 */
  vertexBuffer: IRHIBuffer | null;
  /** 索引缓冲区 */
  indexBuffer: IRHIBuffer | null;
  /** 索引数量 */
  indexCount: number;
  /** 顶点数量 */
  vertexCount: number;
  /** 绘制模式 */
  primitiveType: 'triangles' | 'lines' | 'points';
}

/**
 * 纹理资源数据
 * @description 纹理资源的运行时数据结构
 */
export interface ITextureResource {
  /** RHI 纹理 */
  texture: IRHITexture | null;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 是否有 mipmaps */
  hasMipmaps: boolean;
}

/**
 * 材质资源数据
 * @description 材质资源的运行时数据结构
 */
export interface IMaterialResource {
  /** 着色器 ID */
  shaderId: string;
  /** 材质属性 */
  properties: Record<string, unknown>;
  /** 纹理绑定 */
  textures: Record<string, string>;
}

// ============================================================================
// 资源加载器接口
// ============================================================================

/**
 * 资源加载器接口
 * @description 定义资源加载器的标准行为
 * @typeParam T 资源数据类型
 */
export interface IResourceLoader<T> {
  /** 支持的文件扩展名 */
  readonly extensions: string[];

  /**
   * 加载资源
   * @param uri 资源 URI
   * @param device RHI 设备
   * @returns 加载后的资源数据
   */
  load(uri: string, device: IRHIDevice): Promise<T>;

  /**
   * 释放资源
   * @param resource 资源数据
   */
  dispose(resource: T): void;
}
