/**
 * Maxellabs 核心材质类型定义
 * 统一材质系统的基础类型，消除 common/material.ts 和 rendering/material.ts 的重复
 *
 * @module core/material
 *
 * ## 架构设计
 *
 * ```
 * core/material.ts (本文件)
 *   ├── BaseMaterialDefinition     - 材质定义基础接口
 *   ├── BaseMaterialProperty       - 材质属性基础接口
 *   ├── MaterialTextureSlot        - 统一纹理槽枚举
 *   └── MaterialAlphaMode          - 统一透明模式枚举
 *        ↓
 * common/material.ts
 *   └── CommonMaterial (扩展 BaseMaterialDefinition，用于通用场景)
 *        ↓
 * rendering/material.ts
 *   └── RHIMaterial (扩展 BaseMaterialDefinition，用于渲染管线)
 * ```
 *
 * ## 设计原则
 * 1. 核心类型定义在此，不依赖任何其他模块
 * 2. common 和 rendering 模块扩展核心类型
 */

import type { ColorLike } from './math';
import type { Nameable, Enableable, Describable } from './traits';
import type { BaseTextureRef } from './generics';

// ============================================================================
// 材质透明模式（统一定义）
// ============================================================================

/**
 * 材质透明模式
 *
 * @description 统一 AlphaMode 的定义，用于材质系统
 */
export enum MaterialAlphaMode {
  /** 完全不透明 */
  Opaque = 'opaque',
  /** 使用 alphaCutoff 进行遮罩 */
  Mask = 'mask',
  /** 使用 alpha 混合 */
  Blend = 'blend',
}

// ============================================================================
// 材质纹理槽（统一定义）
// ============================================================================

/**
 * 材质纹理槽
 *
 * @description 统一 CommonTextureSlot 和 rendering 中的纹理槽定义
 */
export enum MaterialTextureSlot {
  // 基础纹理
  /** 基础颜色/漫反射纹理 */
  BaseColor = 'base-color',
  /** 法线贴图 */
  Normal = 'normal',
  /** 金属度-粗糙度贴图 */
  MetallicRoughness = 'metallic-roughness',
  /** 遮挡贴图 */
  Occlusion = 'occlusion',
  /** 自发光贴图 */
  Emissive = 'emissive',

  // 高级纹理
  /** 高度/位移贴图 */
  Height = 'height',
  /** 透明度贴图 */
  Alpha = 'alpha',
  /** 环境光遮蔽贴图 */
  AmbientOcclusion = 'ambient-occlusion',
  /** 清漆贴图 */
  Clearcoat = 'clearcoat',
  /** 清漆法线贴图 */
  ClearcoatNormal = 'clearcoat-normal',
  /** 光泽贴图 */
  Sheen = 'sheen',
  /** 透射贴图 */
  Transmission = 'transmission',
  /** 厚度贴图 */
  Thickness = 'thickness',
}

// ============================================================================
// 材质类型（统一定义）
// ============================================================================

/**
 * 材质类型
 *
 * @description 统一材质类型定义
 */
export enum UnifiedMaterialType {
  /** 标准 PBR 材质 */
  Standard = 'standard',
  /** 无光照材质 */
  Unlit = 'unlit',
  /** 物理材质（高级 PBR） */
  Physical = 'physical',
  /** 卡通材质 */
  Toon = 'toon',
  /** 精灵材质 */
  Sprite = 'sprite',
  /** UI 材质 */
  UI = 'ui',
  /** 粒子材质 */
  Particle = 'particle',
  /** 天空盒材质 */
  Skybox = 'skybox',
  /** 自定义材质 */
  Custom = 'custom',
}

// ============================================================================
// 材质纹理引用（统一定义）
// ============================================================================

/**
 * 材质纹理引用
 *
 * @description 统一 CommonTextureRef 和 TextureReference
 * 继承 BaseTextureRef，添加材质特有的属性
 */
export interface MaterialTextureRef extends BaseTextureRef {
  /**
   * 纹理槽
   */
  slot: MaterialTextureSlot;
  /**
   * 纹理强度/影响度 (0-1)
   */
  intensity?: number;
  /**
   * UV 通道索引
   */
  uvChannel?: number;
  /**
   * 是否启用
   */
  enabled?: boolean;
}

// ============================================================================
// 材质定义基础接口
// ============================================================================

/**
 * 材质元数据接口
 *
 * @description 材质特有的元数据，可扩展
 */
export interface MaterialMetadata {
  /**
   * 名称
   */
  name?: string;
  /**
   * 描述
   */
  description?: string;
  /**
   * 版本
   */
  version?: string;
  /**
   * 作者
   */
  author?: string;
  /**
   * 创建时间
   */
  createdAt?: string;
  /**
   * 修改时间
   */
  lastModified?: string;
  /**
   * 标签
   */
  tags?: string[];
  /**
   * 自定义数据
   */
  customData?: Record<string, unknown>;
  /**
   * 允许任意扩展字段
   */
  [key: string]: unknown;
}

/**
 * 材质定义基础接口
 *
 * @description 统一 CommonMaterialBase 和 IMaterial 的公共部分
 * 组合 Nameable, Enableable traits
 */
export interface BaseMaterialDefinition extends Nameable, Enableable {
  /**
   * 材质 ID
   */
  id: string;
  /**
   * 材质类型
   */
  type: UnifiedMaterialType | string;
  /**
   * 是否双面渲染
   */
  doubleSided?: boolean;
  /**
   * 透明度 (0-1)
   */
  opacity?: number;
  /**
   * 透明模式
   */
  alphaMode?: MaterialAlphaMode;
  /**
   * 透明度阈值 (用于 Mask 模式)
   */
  alphaCutoff?: number;
  /**
   * 材质标签
   */
  tags?: string[];
  /**
   * 元数据
   */
  metadata?: MaterialMetadata;
}

// ============================================================================
// 材质属性基础接口
// ============================================================================

/**
 * 材质属性值类型
 */
export type MaterialPropertyValue =
  | number
  | boolean
  | string
  | ColorLike
  | [number, number]
  | [number, number, number]
  | [number, number, number, number]
  | MaterialTextureRef
  | null;

/**
 * 材质属性基础接口
 *
 * @description 统一 CommonMaterialProperties 和 MaterialProperty
 */
export interface BaseMaterialPropertyDefinition extends Nameable, Describable {
  /**
   * 属性类型
   */
  type: string;
  /**
   * 属性值
   */
  value?: MaterialPropertyValue;
  /**
   * 纹理引用
   */
  texture?: MaterialTextureRef;
  /**
   * 默认值
   */
  defaultValue?: MaterialPropertyValue;
  /**
   * 最小值（数值类型）
   */
  min?: number;
  /**
   * 最大值（数值类型）
   */
  max?: number;
  /**
   * 是否可动画
   */
  animatable?: boolean;
}

// ============================================================================
// PBR 材质属性
// ============================================================================

/**
 * PBR 材质属性
 *
 * @description 标准 PBR 材质的属性定义
 */
export interface PBRMaterialProperties {
  /**
   * 基础颜色
   */
  baseColor: ColorLike;
  /**
   * 基础颜色纹理
   */
  baseColorTexture?: MaterialTextureRef;
  /**
   * 金属度 (0-1)
   */
  metallic: number;
  /**
   * 粗糙度 (0-1)
   */
  roughness: number;
  /**
   * 金属度-粗糙度纹理
   */
  metallicRoughnessTexture?: MaterialTextureRef;
  /**
   * 法线纹理
   */
  normalTexture?: MaterialTextureRef;
  /**
   * 法线强度
   */
  normalScale?: number;
  /**
   * 遮挡纹理
   */
  occlusionTexture?: MaterialTextureRef;
  /**
   * 遮挡强度
   */
  occlusionStrength?: number;
  /**
   * 自发光颜色
   */
  emissiveColor?: ColorLike;
  /**
   * 自发光纹理
   */
  emissiveTexture?: MaterialTextureRef;
  /**
   * 自发光强度
   */
  emissiveIntensity?: number;
}

// ============================================================================
// 高级 PBR 材质属性（Physical）
// ============================================================================

/**
 * 高级 PBR 材质属性
 *
 * @description 扩展 PBR 材质，添加高级特性
 */
export interface PhysicalMaterialProperties extends PBRMaterialProperties {
  /**
   * 折射率 (IOR)
   */
  ior?: number;
  /**
   * 透射
   */
  transmission?: number;
  /**
   * 透射纹理
   */
  transmissionTexture?: MaterialTextureRef;
  /**
   * 厚度
   */
  thickness?: number;
  /**
   * 厚度纹理
   */
  thicknessTexture?: MaterialTextureRef;
  /**
   * 衰减颜色
   */
  attenuationColor?: ColorLike;
  /**
   * 衰减距离
   */
  attenuationDistance?: number;
  /**
   * 清漆
   */
  clearcoat?: number;
  /**
   * 清漆纹理
   */
  clearcoatTexture?: MaterialTextureRef;
  /**
   * 清漆粗糙度
   */
  clearcoatRoughness?: number;
  /**
   * 清漆法线纹理
   */
  clearcoatNormalTexture?: MaterialTextureRef;
  /**
   * 光泽
   */
  sheen?: number;
  /**
   * 光泽颜色
   */
  sheenColor?: ColorLike;
  /**
   * 光泽粗糙度
   */
  sheenRoughness?: number;
  /**
   * 各向异性
   */
  anisotropy?: number;
  /**
   * 各向异性旋转
   */
  anisotropyRotation?: number;
}

// ============================================================================
// 材质变体
// ============================================================================

/**
 * 材质变体条件类型
 */
export enum MaterialVariantConditionType {
  /** 设备类型 */
  DeviceType = 'device-type',
  /** 图形质量级别 */
  QualityLevel = 'quality-level',
  /** 平台类型 */
  Platform = 'platform',
  /** GPU 性能等级 */
  GPUTier = 'gpu-tier',
  /** 自定义条件 */
  Custom = 'custom',
}

/**
 * 材质变体条件
 */
export interface MaterialVariantCondition {
  /**
   * 条件类型
   */
  type: MaterialVariantConditionType;
  /**
   * 条件值
   */
  value: unknown;
  /**
   * 比较运算符
   */
  operator?: 'equal' | 'not-equal' | 'greater' | 'less' | 'greater-equal' | 'less-equal';
}

/**
 * 材质变体
 *
 * @description 组合 Nameable trait
 */
export interface MaterialVariantDefinition extends Nameable {
  /**
   * 变体 ID
   */
  id: string;
  /**
   * 基础材质 ID
   */
  baseMaterialId: string;
  /**
   * 属性覆盖
   */
  propertyOverrides: Record<string, MaterialPropertyValue>;
  /**
   * 变体条件
   */
  conditions?: MaterialVariantCondition[];
  /**
   * 优先级
   */
  priority?: number;
}
