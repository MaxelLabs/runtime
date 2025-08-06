/**
 * Maxellabs 通用材质类型
 * 定义跨模块共享的基础材质类型
 */

import type { ComparisonOperator } from '../animation';
import type { ColorLike, BlendMode, CommonMetadata, MaterialType, LoopMode, Vector2Like } from '../core';

/**
 * 通用纹理槽
 */
export enum CommonTextureSlot {
  /**
   * 主纹理
   */
  Main = 'main',
  /**
   * 法线贴图
   */
  Normal = 'normal',
  /**
   * 高度贴图
   */
  Height = 'height',
  /**
   * 遮挡贴图
   */
  Occlusion = 'occlusion',
  /**
   * 自发光贴图
   */
  Emission = 'emission',
}

/**
 * 通用纹理引用
 */
export interface CommonTextureRef {
  /**
   * 纹理ID
   */
  textureId: string;
  /**
   * 纹理槽
   */
  slot: CommonTextureSlot;
  /**
   * UV缩放
   */
  scale?: Vector2Like;
  /**
   * UV偏移
   */
  offset?: Vector2Like;
  /**
   * 旋转角度
   */
  rotation?: number;
}

/**
 * 通用材质基础接口
 */
export interface CommonMaterialBase {
  /**
   * 材质ID
   */
  id: string;
  /**
   * 材质名称
   */
  name: string;
  /**
   * 材质类型
   */
  type: MaterialType;
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 材质标签
   */
  tags?: string[];
  /**
   * 元数据
   */
  metadata?: CommonMetadata;
}

/**
 * 通用材质属性
 */
export interface CommonMaterialProperties {
  /**
   * 主颜色
   */
  color: ColorLike;
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 混合模式
   */
  blendMode: BlendMode;
  /**
   * 纹理引用列表
   */
  textures?: CommonTextureRef[];
  /**
   * UV动画
   */
  uvAnimation?: UVAnimation;
  /**
   * 双面渲染
   */
  doubleSided?: boolean;
  /**
   * 深度写入
   */
  depthWrite?: boolean;
  /**
   * 深度测试
   */
  depthTest?: boolean;
}

/**
 * UV动画配置
 */
export interface UVAnimation {
  /**
   * U方向速度
   */
  speedU: number;
  /**
   * V方向速度
   */
  speedV: number;
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 播放模式
   */
  playMode: LoopMode;
}

/**
 * 通用材质实例
 */
export interface CommonMaterial extends CommonMaterialBase {
  /**
   * 材质属性
   */
  properties: CommonMaterialProperties;
  /**
   * 渲染优先级
   */
  renderPriority?: number;
  /**
   * 是否接受阴影
   */
  receiveShadows?: boolean;
  /**
   * 是否投射阴影
   */
  castShadows?: boolean;
}

/**
 * 材质变体
 */
export interface MaterialVariant {
  /**
   * 变体名称
   */
  name: string;
  /**
   * 基础材质ID
   */
  baseMaterialId: string;
  /**
   * 属性覆盖
   */
  propertyOverrides: Partial<CommonMaterialProperties>;
  /**
   * 条件
   */
  conditions?: MaterialCondition[];
}

/**
 * 材质条件
 */
export interface MaterialCondition {
  /**
   * 条件类型
   */
  type: MaterialConditionType;
  /**
   * 条件值
   */
  value: any;
  /**
   * 比较操作
   */
  operator: ComparisonOperator;
}

/**
 * 材质条件类型
 */
export enum MaterialConditionType {
  /**
   * 设备类型（移动端/桌面端）
   */
  DeviceType = 'device-type',
  /**
   * 图形质量级别（低/中/高/超高）
   */
  QualityLevel = 'quality-level',
  /**
   * 平台类型（iOS/Android/Web/Windows等）
   */
  Platform = 'platform',
  /**
   * 图形API（OpenGL/Vulkan/Metal/DirectX等）
   */
  GraphicsAPI = 'graphics-api',
  /**
   * GPU性能等级
   */
  GPUTier = 'gpu-tier',
  /**
   * 内存容量限制
   */
  MemoryLimit = 'memory-limit',
  /**
   * 屏幕分辨率
   */
  ScreenResolution = 'screen-resolution',
  /**
   * 渲染特性支持（HDR/PBR/实时光照等）
   */
  FeatureSupport = 'feature-support',
  /**
   * 带宽限制（影响纹理质量）
   */
  BandwidthLimit = 'bandwidth-limit',
  /**
   * 电池状态（移动设备节能模式）
   */
  PowerMode = 'power-mode',
  /**
   * 用户偏好设置
   */
  UserPreference = 'user-preference',
  /**
   * 自定义条件
   */
  Custom = 'custom',
}
