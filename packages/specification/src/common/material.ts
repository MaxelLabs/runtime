/**
 * Maxellabs 通用材质
 * 定义所有系统共通的材质相关类型
 */

import type { Color } from '../core/interfaces';
import type { BlendMode } from '../core/enums';

/**
 * 材质类型
 */
export enum MaterialType {
  /**
   * 标准材质
   */
  Standard = 'standard',
  /**
   * 无光照材质
   */
  Unlit = 'unlit',
  /**
   * 物理材质
   */
  Physical = 'physical',
  /**
   * 卡通材质
   */
  Toon = 'toon',
  /**
   * 精灵材质
   */
  Sprite = 'sprite',
  /**
   * UI材质
   */
  UI = 'ui',
  /**
   * 粒子材质
   */
  Particle = 'particle',
  /**
   * 天空盒材质
   */
  Skybox = 'skybox',
  /**
   * 自定义材质
   */
  Custom = 'custom',
}

/**
 * 纹理类型
 */
export enum TextureType {
  /**
   * 漫反射贴图
   */
  Diffuse = 'diffuse',
  /**
   * 法线贴图
   */
  Normal = 'normal',
  /**
   * 高度贴图
   */
  Height = 'height',
  /**
   * 金属度贴图
   */
  Metallic = 'metallic',
  /**
   * 粗糙度贴图
   */
  Roughness = 'roughness',
  /**
   * 遮挡贴图
   */
  Occlusion = 'occlusion',
  /**
   * 自发光贴图
   */
  Emission = 'emission',
  /**
   * 透明度贴图
   */
  Opacity = 'opacity',
  /**
   * 环境贴图
   */
  Environment = 'environment',
  /**
   * 立方体贴图
   */
  Cubemap = 'cubemap',
  /**
   * 自定义贴图
   */
  Custom = 'custom',
}

/**
 * 纹理过滤模式
 */
export enum TextureFilter {
  /**
   * 最近邻过滤
   */
  Nearest = 'nearest',
  /**
   * 线性过滤
   */
  Linear = 'linear',
  /**
   * 双线性过滤
   */
  Bilinear = 'bilinear',
  /**
   * 三线性过滤
   */
  Trilinear = 'trilinear',
  /**
   * 各向异性过滤
   */
  Anisotropic = 'anisotropic',
}

/**
 * 纹理包装模式
 */
export enum TextureWrap {
  /**
   * 重复
   */
  Repeat = 'repeat',
  /**
   * 夹紧
   */
  Clamp = 'clamp',
  /**
   * 镜像重复
   */
  Mirror = 'mirror',
  /**
   * 边界夹紧
   */
  ClampToBorder = 'clamp-to-border',
}

/**
 * 材质属性
 */
export interface MaterialProperties {
  /**
   * 材质名称
   */
  name: string;
  /**
   * 材质类型
   */
  type: MaterialType;
  /**
   * 基础颜色
   */
  baseColor: Color;
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 金属度
   */
  metallic?: number;
  /**
   * 粗糙度
   */
  roughness?: number;
  /**
   * 自发光颜色
   */
  emissiveColor?: Color;
  /**
   * 自发光强度
   */
  emissiveIntensity?: number;
  /**
   * 法线强度
   */
  normalScale?: number;
  /**
   * 遮挡强度
   */
  occlusionStrength?: number;
  /**
   * 折射率
   */
  ior?: number;
  /**
   * 透射
   */
  transmission?: number;
  /**
   * 厚度
   */
  thickness?: number;
  /**
   * 衰减颜色
   */
  attenuationColor?: Color;
  /**
   * 衰减距离
   */
  attenuationDistance?: number;
  /**
   * 各向异性
   */
  anisotropy?: number;
  /**
   * 各向异性旋转
   */
  anisotropyRotation?: number;
  /**
   * 清漆
   */
  clearcoat?: number;
  /**
   * 清漆粗糙度
   */
  clearcoatRoughness?: number;
  /**
   * 清漆法线
   */
  clearcoatNormal?: number;
  /**
   * 光泽
   */
  sheen?: number;
  /**
   * 光泽颜色
   */
  sheenColor?: Color;
  /**
   * 光泽粗糙度
   */
  sheenRoughness?: number;
  /**
   * 次表面散射
   */
  subsurface?: number;
  /**
   * 次表面颜色
   */
  subsurfaceColor?: Color;
  /**
   * 次表面半径
   */
  subsurfaceRadius?: [number, number, number];
}

/**
 * 纹理配置
 */
export interface TextureConfig {
  /**
   * 纹理路径
   */
  path: string;
  /**
   * 纹理类型
   */
  type: TextureType;
  /**
   * 过滤模式
   */
  filter: TextureFilter;
  /**
   * 包装模式U
   */
  wrapU: TextureWrap;
  /**
   * 包装模式V
   */
  wrapV: TextureWrap;
  /**
   * UV偏移
   */
  offset?: [number, number];
  /**
   * UV缩放
   */
  scale?: [number, number];
  /**
   * UV旋转
   */
  rotation?: number;
  /**
   * 各向异性级别
   */
  anisotropy?: number;
  /**
   * 是否生成Mipmap
   */
  generateMipmaps?: boolean;
  /**
   * 是否翻转Y轴
   */
  flipY?: boolean;
  /**
   * 是否预乘Alpha
   */
  premultiplyAlpha?: boolean;
  /**
   * 颜色空间
   */
  colorSpace?: string;
}

/**
 * 通用材质
 */
export interface CommonMaterial {
  /**
   * 材质ID
   */
  id: string;
  /**
   * 材质属性
   */
  properties: MaterialProperties;
  /**
   * 纹理映射
   */
  textures: Record<string, TextureConfig>;
  /**
   * 渲染状态
   */
  renderState: MaterialRenderState;
  /**
   * 着色器配置
   */
  shader?: ShaderConfig;
  /**
   * 自定义参数
   */
  customParameters?: Record<string, any>;
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 材质标签
   */
  tags?: string[];
}

/**
 * 材质渲染状态
 */
export interface MaterialRenderState {
  /**
   * 混合模式
   */
  blendMode: BlendMode;
  /**
   * 是否双面渲染
   */
  doubleSided: boolean;
  /**
   * 是否透明
   */
  transparent: boolean;
  /**
   * Alpha测试阈值
   */
  alphaTest?: number;
  /**
   * 是否写入深度
   */
  depthWrite: boolean;
  /**
   * 深度测试
   */
  depthTest: boolean;
  /**
   * 剔除模式
   */
  cullMode: 'none' | 'front' | 'back';
  /**
   * 渲染队列
   */
  renderQueue: number;
  /**
   * 是否投射阴影
   */
  castShadows: boolean;
  /**
   * 是否接收阴影
   */
  receiveShadows: boolean;
}

/**
 * 着色器配置
 */
export interface ShaderConfig {
  /**
   * 顶点着色器
   */
  vertexShader?: string;
  /**
   * 片段着色器
   */
  fragmentShader?: string;
  /**
   * 着色器定义
   */
  defines?: Record<string, any>;
  /**
   * 着色器参数
   */
  uniforms?: Record<string, ShaderUniform>;
  /**
   * 着色器属性
   */
  attributes?: Record<string, ShaderAttribute>;
}

/**
 * 着色器统一变量
 */
export interface ShaderUniform {
  /**
   * 变量类型
   */
  type: ShaderUniformType;
  /**
   * 变量值
   */
  value: any;
  /**
   * 是否需要更新
   */
  needsUpdate?: boolean;
}

/**
 * 着色器统一变量类型
 */
export enum ShaderUniformType {
  /**
   * 浮点数
   */
  Float = 'float',
  /**
   * 整数
   */
  Int = 'int',
  /**
   * 布尔值
   */
  Bool = 'bool',
  /**
   * 二维向量
   */
  Vec2 = 'vec2',
  /**
   * 三维向量
   */
  Vec3 = 'vec3',
  /**
   * 四维向量
   */
  Vec4 = 'vec4',
  /**
   * 2x2矩阵
   */
  Mat2 = 'mat2',
  /**
   * 3x3矩阵
   */
  Mat3 = 'mat3',
  /**
   * 4x4矩阵
   */
  Mat4 = 'mat4',
  /**
   * 纹理
   */
  Texture = 'texture',
  /**
   * 立方体纹理
   */
  TextureCube = 'texture-cube',
}

/**
 * 着色器属性
 */
export interface ShaderAttribute {
  /**
   * 属性类型
   */
  type: ShaderAttributeType;
  /**
   * 属性大小
   */
  size: number;
  /**
   * 是否标准化
   */
  normalized?: boolean;
  /**
   * 步长
   */
  stride?: number;
  /**
   * 偏移
   */
  offset?: number;
}

/**
 * 着色器属性类型
 */
export enum ShaderAttributeType {
  /**
   * 浮点数
   */
  Float = 'float',
  /**
   * 二维向量
   */
  Vec2 = 'vec2',
  /**
   * 三维向量
   */
  Vec3 = 'vec3',
  /**
   * 四维向量
   */
  Vec4 = 'vec4',
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
   * 覆盖属性
   */
  overrides: Partial<MaterialProperties>;
  /**
   * 覆盖纹理
   */
  textureOverrides?: Record<string, TextureConfig>;
  /**
   * 覆盖渲染状态
   */
  renderStateOverrides?: Partial<MaterialRenderState>;
  /**
   * 条件
   */
  conditions?: MaterialVariantCondition[];
}

/**
 * 材质变体条件
 */
export interface MaterialVariantCondition {
  /**
   * 条件类型
   */
  type: 'platform' | 'quality' | 'feature' | 'custom';
  /**
   * 条件值
   */
  value: any;
  /**
   * 比较操作
   */
  operator: 'equals' | 'not-equals' | 'greater' | 'less' | 'contains';
}
