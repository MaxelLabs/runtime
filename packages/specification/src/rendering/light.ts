/**
 * Maxellabs 光源渲染规范
 * 光源类型和参数定义
 */

import type { Vector3Like, ColorLike } from '../core';
import type { UsdPrim, UsdValue } from '../core';

/**
 * 光源基础接口
 */
export interface LightPrim extends UsdPrim {
  typeName: 'Light';
}

/**
 * 光源类型
 */
export enum LightType {
  /**
   * 方向光（太阳光）
   */
  Directional = 'directional',
  /**
   * 点光源
   */
  Point = 'point',
  /**
   * 聚光灯
   */
  Spot = 'spot',
  /**
   * 区域光
   */
  Area = 'area',
  /**
   * 环境光（用于 IBL）
   */
  Environment = 'environment',
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
   * 软阴影（PCF）
   */
  Soft = 'soft',
  /**
   * PCSS 软阴影
   */
  PCSS = 'pcss',
  /**
   * VSM 阴影
   */
  VSM = 'vsm',
}

/**
 * 阴影配置
 */
export interface IShadowConfig {
  /**
   * 是否启用阴影
   */
  enabled: boolean;
  /**
   * 阴影类型
   */
  type: ShadowType;
  /**
   * 阴影贴图分辨率
   */
  resolution?: number;
  /**
   * 阴影偏移
   */
  bias?: number;
  /**
   * 法线偏移
   */
  normalBias?: number;
  /**
   * 阴影强度 (0-1)
   */
  strength?: number;
  /**
   * 阴影距离
   */
  distance?: number;
  /**
   * 级联数量（方向光专用）
   */
  cascadeCount?: number;
  /**
   * 级联分割比例
   */
  cascadeSplits?: number[];
}

/**
 * 基础光源接口
 */
export interface ILight extends LightPrim {
  attributes: {
    /**
     * 光源名称
     */
    name: UsdValue; // string
    /**
     * 是否启用
     */
    enabled: UsdValue; // bool
    /**
     * 渲染层级掩码
     */
    cullingMask?: UsdValue; // int
  };
  /**
   * 光源类型
   */
  lightType: LightType;
  /**
   * 光源颜色
   */
  color: ColorLike;
  /**
   * 光源强度
   */
  intensity: number;
  /**
   * 阴影配置
   */
  shadow?: IShadowConfig;
}

/**
 * 方向光接口
 */
export interface IDirectionalLight extends ILight {
  lightType: LightType.Directional;
  /**
   * 光照方向（世界空间）
   */
  direction?: Vector3Like;
}

/**
 * 点光源接口
 */
export interface IPointLight extends ILight {
  lightType: LightType.Point;
  /**
   * 光照范围
   */
  range: number;
  /**
   * 衰减模式
   */
  attenuation?: ILightAttenuation;
}

/**
 * 聚光灯接口
 */
export interface ISpotLight extends ILight {
  lightType: LightType.Spot;
  /**
   * 光照范围
   */
  range: number;
  /**
   * 内锥角度（弧度）
   */
  innerConeAngle: number;
  /**
   * 外锥角度（弧度）
   */
  outerConeAngle: number;
  /**
   * 衰减模式
   */
  attenuation?: ILightAttenuation;
}

/**
 * 区域光接口
 */
export interface IAreaLight extends ILight {
  lightType: LightType.Area;
  /**
   * 区域形状
   */
  shape: AreaLightShape;
  /**
   * 区域宽度
   */
  width: number;
  /**
   * 区域高度
   */
  height: number;
  /**
   * 是否双面发光
   */
  doubleSided?: boolean;
}

/**
 * 区域光形状
 */
export enum AreaLightShape {
  /**
   * 矩形
   */
  Rectangle = 'rectangle',
  /**
   * 圆盘
   */
  Disc = 'disc',
  /**
   * 球体
   */
  Sphere = 'sphere',
}

/**
 * 环境光接口（IBL）
 */
export interface IEnvironmentLight extends ILight {
  lightType: LightType.Environment;
  /**
   * 环境贴图路径
   */
  environmentMap?: string;
  /**
   * 漫反射贴图路径
   */
  diffuseMap?: string;
  /**
   * 预过滤高光贴图路径
   */
  specularMap?: string;
  /**
   * BRDF LUT 贴图路径
   */
  brdfLUT?: string;
  /**
   * 旋转角度（弧度）
   */
  rotation?: number;
}

/**
 * 光照衰减配置
 */
export interface ILightAttenuation {
  /**
   * 衰减模式
   */
  mode: AttenuationMode;
  /**
   * 常数衰减系数
   */
  constant?: number;
  /**
   * 线性衰减系数
   */
  linear?: number;
  /**
   * 二次衰减系数
   */
  quadratic?: number;
}

/**
 * 衰减模式
 */
export enum AttenuationMode {
  /**
   * 物理衰减（平方反比）
   */
  Physical = 'physical',
  /**
   * 线性衰减
   */
  Linear = 'linear',
  /**
   * 自定义衰减
   */
  Custom = 'custom',
}

/**
 * 光源组件数据接口（简化版，用于 Component）
 */
export interface ILightData {
  /**
   * 光源类型
   */
  lightType: LightType;
  /**
   * 光源颜色
   */
  color: ColorLike;
  /**
   * 光源强度
   */
  intensity: number;
  /**
   * 光照范围（点光、聚光灯）
   */
  range?: number;
  /**
   * 内锥角度（聚光灯，弧度）
   */
  innerConeAngle?: number;
  /**
   * 外锥角度（聚光灯，弧度）
   */
  outerConeAngle?: number;
  /**
   * 是否投射阴影
   */
  castShadow?: boolean;
  /**
   * 阴影配置
   */
  shadow?: IShadowConfig;
  /**
   * 渲染层级掩码
   */
  cullingMask?: number;
}

/**
 * 方向光组件数据
 */
export interface IDirectionalLightData extends ILightData {
  lightType: LightType.Directional;
}

/**
 * 点光源组件数据
 */
export interface IPointLightData extends ILightData {
  lightType: LightType.Point;
  range: number;
}

/**
 * 聚光灯组件数据
 */
export interface ISpotLightData extends ILightData {
  lightType: LightType.Spot;
  range: number;
  innerConeAngle: number;
  outerConeAngle: number;
}
