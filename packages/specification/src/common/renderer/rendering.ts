/**
 * Maxellabs 通用渲染类型
 * 定义跨模块共享的基础渲染类型
 */

import type { CommonElement } from '../elements';
import type { CommonMaterial } from '../material';
import type { PerformanceConfiguration } from '../../package/format';

/**
 * 深度测试模式
 * @deprecated 使用 PerformanceConfiguration 作为权威定义
 */
export type DepthTest = PerformanceConfiguration;

/**
 * 渲染队列
 */
export enum RenderQueue {
  /**
   * 背景
   */
  Background = 'background',
  /**
   * 几何体
   */
  Geometry = 'geometry',
  /**
   * 透明几何体
   */
  TransparentGeometry = 'transparent-geometry',
  /**
   * 覆盖层
   */
  Overlay = 'overlay',
}

/**
 * 光照模式
 */
export enum LightingMode {
  /**
   * 无光照
   */
  Unlit = 'unlit',
  /**
   * 顶点光照
   */
  VertexLit = 'vertex-lit',
  /**
   * 像素光照
   */
  PixelLit = 'pixel-lit',
  /**
   * 物理光照
   */
  PhysicallyBased = 'physically-based',
}

/**
 * 阴影类型
 */
export enum ShadowType {
  /**
   * 无阴影
   */
  None = 'none',
  /**
   * 硬阴影
   */
  Hard = 'hard',
  /**
   * 软阴影
   */
  Soft = 'soft',
  /**
   * 级联阴影
   */
  Cascaded = 'cascaded',
}

// CommonRenderState 已移至 ./renderState.ts 避免重复定义
import type { CommonRenderState } from './renderState';

/**
 * 通用可渲染元素
 */
export interface CommonRenderableElement extends CommonElement {
  /**
   * 材质引用
   */
  materialId?: string;
  /**
   * 渲染状态
   */
  renderState?: CommonRenderState;
  /**
   * 渲染层级
   */
  renderLayer?: number;
}

/**
 * 渲染批次
 */
export interface RenderBatch {
  /**
   * 批次ID
   */
  id: string;
  /**
   * 元素列表
   */
  elements: CommonRenderableElement[];
  /**
   * 共享材质
   */
  material?: CommonMaterial;
  /**
   * 渲染优先级
   */
  priority: number;
}

// CommonRenderConfig 已废弃 - 使用 RendererConfiguration（来自 package/format.ts）替代
// 为保持兼容性，创建类型别名
import type { RendererConfiguration } from '../../package/format';

/**
 * @deprecated 使用 RendererConfiguration 替代
 */
export type CommonRenderConfig = RendererConfiguration;

/**
 * 通用渲染统计
 */
export interface CommonRenderStats {
  /**
   * 绘制调用次数
   */
  drawCalls: number;
  /**
   * 渲染的三角形数量
   */
  triangles: number;
  /**
   * 渲染的顶点数量
   */
  vertices: number;
  /**
   * 纹理切换次数
   */
  textureBinds: number;
  /**
   * 渲染时间（毫秒）
   */
  renderTime: number;
}
