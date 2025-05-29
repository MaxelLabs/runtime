/**
 * Maxellabs 通用材质类型
 * 定义跨模块共享的基础材质类型
 */

import type { IColor, BlendMode, CommonMetadata } from '../core';

/**
 * 通用材质类型枚举
 */
export enum CommonMaterialType {
  /**
   * 标准材质
   */
  Standard = 'standard',
  /**
   * 无光材质
   */
  Unlit = 'unlit',
  /**
   * 透明材质
   */
  Transparent = 'transparent',
  /**
   * 自发光材质
   */
  Emissive = 'emissive',
  /**
   * 粒子材质
   */
  Particle = 'particle',
  /**
   * UI材质
   */
  UI = 'ui',
}

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
  scale?: [number, number];
  /**
   * UV偏移
   */
  offset?: [number, number];
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
  type: CommonMaterialType;
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
  color: IColor;
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
  playMode: UVAnimationMode;
}

/**
 * UV动画模式
 */
export enum UVAnimationMode {
  /**
   * 循环
   */
  Loop = 'loop',
  /**
   * 来回
   */
  PingPong = 'ping-pong',
  /**
   * 一次
   */
  Once = 'once',
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
   * 距离
   */
  Distance = 'distance',
  /**
   * 时间
   */
  Time = 'time',
  /**
   * 用户数据
   */
  UserData = 'user-data',
  /**
   * 渲染质量
   */
  Quality = 'quality',
}

/**
 * 比较操作符
 */
export enum ComparisonOperator {
  /**
   * 等于
   */
  Equal = 'equal',
  /**
   * 不等于
   */
  NotEqual = 'not-equal',
  /**
   * 大于
   */
  Greater = 'greater',
  /**
   * 小于
   */
  Less = 'less',
  /**
   * 大于等于
   */
  GreaterEqual = 'greater-equal',
  /**
   * 小于等于
   */
  LessEqual = 'less-equal',
}
