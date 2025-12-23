/**
 * Maxellabs 通用材质类型
 * 定义跨模块共享的基础材质类型
 *
 * @module common/material
 *
 * ## 架构说明
 *
 * 本模块基于 core/material.ts 中的统一材质类型，提供通用场景下的材质定义。
 *
 * ```
 * core/material.ts
 *   ├── BaseMaterialDefinition
 *   ├── MaterialTextureSlot
 *   └── MaterialTextureRef
 *        ↓
 * common/material.ts (本文件)
 *   ├── CommonTextureRef (扩展 MaterialTextureRef)
 *   └── CommonMaterial (扩展 BaseMaterialDefinition)
 * ```
 */

import type {
  ColorLike,
  BlendMode,
  LoopMode,
  Vector2Like,
  RequiredEnableable,
  BaseMaterialDefinition,
  MaterialTextureRef,
  UnifiedMaterialType,
  MaterialAlphaMode,
  MaterialMetadata,
} from '../core';

// ============================================================================
// 通用纹理引用
// ============================================================================

/**
 * 通用纹理引用
 *
 * @description 扩展 MaterialTextureRef，添加 UV 变换属性
 * 统一使用 assetId 作为纹理资源标识符
 */
export interface CommonTextureRef extends MaterialTextureRef {
  /**
   * UV缩放
   */
  scale?: Vector2Like;
  /**
   * UV偏移
   */
  offset?: Vector2Like;
  /**
   * 旋转角度（弧度）
   */
  rotation?: number;
}

// ============================================================================
// 通用材质基础接口
// ============================================================================

/**
 * 通用材质基础接口
 *
 * @description 扩展 BaseMaterialDefinition，添加 RequiredEnableable trait
 */
export interface CommonMaterialBase extends Omit<BaseMaterialDefinition, 'enabled'>, RequiredEnableable {
  /**
   * 材质类型
   */
  type: UnifiedMaterialType;
  /**
   * 透明模式
   */
  alphaMode?: MaterialAlphaMode;
  /**
   * 元数据
   */
  metadata?: MaterialMetadata;
}

// ============================================================================
// 通用材质属性
// ============================================================================

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
 *
 * @description 组合 RequiredEnableable trait
 */
export interface UVAnimation extends RequiredEnableable {
  /**
   * U方向速度
   */
  speedU: number;
  /**
   * V方向速度
   */
  speedV: number;
  /**
   * 播放模式
   */
  playMode: LoopMode;
}

// ============================================================================
// 通用材质实例
// ============================================================================

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
