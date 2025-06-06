/**
 * Maxellabs 通用渲染类型
 * 定义跨模块共享的基础渲染类型
 */

import type { BlendMode, RenderMode } from '../core';
import type { CommonElement } from './elements';
import type { CommonMaterial } from './material';

/**
 * 深度测试模式
 */
export enum DepthTest {
  /**
   * 禁用
   */
  Disabled = 'disabled',
  /**
   * 小于
   */
  Less = 'less',
  /**
   * 小于等于
   */
  LessEqual = 'less-equal',
  /**
   * 等于
   */
  Equal = 'equal',
  /**
   * 大于等于
   */
  GreaterEqual = 'greater-equal',
  /**
   * 大于
   */
  Greater = 'greater',
  /**
   * 不等于
   */
  NotEqual = 'not-equal',
  /**
   * 总是通过
   */
  Always = 'always',
}

/**
 * 渲染队列
 */
export enum RenderQueue {
  /**
   * 背景
   */
  Background = 1000,
  /**
   * 几何体
   */
  Geometry = 2000,
  /**
   * 透明几何体
   */
  TransparentGeometry = 3000,
  /**
   * 覆盖层
   */
  Overlay = 4000,
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

/**
 * 通用渲染状态（简化版本）
 */
export interface CommonRenderState {
  /**
   * 是否可见
   */
  visible: boolean;
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 混合模式（使用 core 类型）
   */
  blendMode: BlendMode;
  /**
   * 渲染模式（使用 core 类型）
   */
  renderMode?: RenderMode;
  /**
   * Z索引
   */
  zIndex?: number;
}

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

/**
 * 基础渲染配置
 */
export interface CommonRenderConfig {
  /**
   * 启用深度测试
   */
  enableDepthTest?: boolean;
  /**
   * 启用深度写入
   */
  enableDepthWrite?: boolean;
  /**
   * 启用面剔除
   */
  enableCulling?: boolean;
  /**
   * 启用混合
   */
  enableBlending?: boolean;
}

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
