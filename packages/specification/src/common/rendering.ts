/**
 * Maxellabs 通用渲染
 * 定义所有系统共通的渲染相关类型
 */

import type { BlendMode } from '../core/enums';

/**
 * 渲染模式
 */
export enum RenderMode {
  /**
   * 不透明
   */
  Opaque = 'opaque',
  /**
   * 透明
   */
  Transparent = 'transparent',
  /**
   * 遮罩
   */
  Cutout = 'cutout',
  /**
   * 叠加
   */
  Additive = 'additive',
  /**
   * 相乘
   */
  Multiply = 'multiply',
}

/**
 * 剔除模式
 */
export enum CullMode {
  /**
   * 不剔除
   */
  None = 'none',
  /**
   * 剔除正面
   */
  Front = 'front',
  /**
   * 剔除背面
   */
  Back = 'back',
}

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
 * 通用渲染配置
 */
export interface CommonRenderConfig {
  /**
   * 渲染模式
   */
  renderMode: RenderMode;
  /**
   * 混合模式
   */
  blendMode: BlendMode;
  /**
   * 剔除模式
   */
  cullMode: CullMode;
  /**
   * 深度测试
   */
  depthTest: DepthTest;
  /**
   * 是否写入深度
   */
  depthWrite: boolean;
  /**
   * 渲染队列
   */
  renderQueue: number;
  /**
   * 是否双面渲染
   */
  doubleSided: boolean;
  /**
   * 是否投射阴影
   */
  castShadows: boolean;
  /**
   * 是否接收阴影
   */
  receiveShadows: boolean;
  /**
   * 光照模式
   */
  lightingMode: LightingMode;
  /**
   * 阴影类型
   */
  shadowType: ShadowType;
}

/**
 * 渲染状态
 */
export interface RenderState {
  /**
   * 是否可见
   */
  visible: boolean;
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 渲染层级
   */
  renderLayer: number;
  /**
   * 渲染顺序
   */
  renderOrder: number;
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * LOD级别
   */
  lodLevel?: number;
  /**
   * 距离相机的距离
   */
  distanceToCamera?: number;
}

/**
 * 渲染统计信息
 */
export interface RenderStats {
  /**
   * 绘制调用次数
   */
  drawCalls: number;
  /**
   * 三角形数量
   */
  triangles: number;
  /**
   * 顶点数量
   */
  vertices: number;
  /**
   * 纹理内存使用量（MB）
   */
  textureMemory: number;
  /**
   * 几何体内存使用量（MB）
   */
  geometryMemory: number;
  /**
   * 帧率
   */
  fps: number;
  /**
   * 帧时间（毫秒）
   */
  frameTime: number;
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
   * 材质ID
   */
  materialId: string;
  /**
   * 几何体ID列表
   */
  geometryIds: string[];
  /**
   * 实例数量
   */
  instanceCount: number;
  /**
   * 渲染优先级
   */
  priority: number;
  /**
   * 是否启用批处理
   */
  enableBatching: boolean;
}

/**
 * 渲染通道
 */
export interface RenderPass {
  /**
   * 通道名称
   */
  name: string;
  /**
   * 通道类型
   */
  type: RenderPassType;
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 渲染目标
   */
  renderTarget?: string;
  /**
   * 清除标志
   */
  clearFlags: ClearFlags;
  /**
   * 清除颜色
   */
  clearColor?: [number, number, number, number];
  /**
   * 清除深度
   */
  clearDepth?: number;
  /**
   * 清除模板
   */
  clearStencil?: number;
  /**
   * 视口
   */
  viewport?: Viewport;
  /**
   * 渲染层遮罩
   */
  layerMask?: number;
  /**
   * 渲染队列范围
   */
  queueRange?: {
    min: number;
    max: number;
  };
}

/**
 * 渲染通道类型
 */
export enum RenderPassType {
  /**
   * 前向渲染
   */
  Forward = 'forward',
  /**
   * 延迟渲染
   */
  Deferred = 'deferred',
  /**
   * 阴影映射
   */
  ShadowMap = 'shadow-map',
  /**
   * 后处理
   */
  PostProcess = 'post-process',
  /**
   * UI渲染
   */
  UI = 'ui',
  /**
   * 天空盒
   */
  Skybox = 'skybox',
}

/**
 * 清除标志
 */
export enum ClearFlags {
  /**
   * 不清除
   */
  None = 0,
  /**
   * 清除颜色
   */
  Color = 1,
  /**
   * 清除深度
   */
  Depth = 2,
  /**
   * 清除模板
   */
  Stencil = 4,
  /**
   * 清除所有
   */
  All = 7,
}

/**
 * 视口
 */
export interface Viewport {
  /**
   * X坐标
   */
  x: number;
  /**
   * Y坐标
   */
  y: number;
  /**
   * 宽度
   */
  width: number;
  /**
   * 高度
   */
  height: number;
  /**
   * 最小深度
   */
  minDepth?: number;
  /**
   * 最大深度
   */
  maxDepth?: number;
}

/**
 * LOD配置
 */
export interface LODConfig {
  /**
   * LOD级别
   */
  levels: LODLevel[];
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * LOD偏移
   */
  bias: number;
  /**
   * 淡入淡出模式
   */
  fadeMode: LODFadeMode;
}

/**
 * LOD级别
 */
export interface LODLevel {
  /**
   * 级别索引
   */
  level: number;
  /**
   * 距离阈值
   */
  distance: number;
  /**
   * 渲染器列表
   */
  renderers: string[];
  /**
   * 质量设置
   */
  quality?: QualitySettings;
}

/**
 * LOD淡入淡出模式
 */
export enum LODFadeMode {
  /**
   * 无淡入淡出
   */
  None = 'none',
  /**
   * 交叉淡入淡出
   */
  CrossFade = 'cross-fade',
  /**
   * 速度树淡入淡出
   */
  SpeedTree = 'speed-tree',
}

/**
 * 质量设置
 */
export interface QualitySettings {
  /**
   * 纹理质量
   */
  textureQuality: number;
  /**
   * 阴影质量
   */
  shadowQuality: number;
  /**
   * 抗锯齿级别
   */
  antiAliasing: number;
  /**
   * 各向异性过滤级别
   */
  anisotropicFiltering: number;
  /**
   * 软粒子
   */
  softParticles: boolean;
  /**
   * 实时反射
   */
  realtimeReflections: boolean;
}
