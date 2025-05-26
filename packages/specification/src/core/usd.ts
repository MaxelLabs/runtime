/**
 * Maxellabs USD 核心规范
 * 基于 OpenUSD 格式的核心数据类型和 Prim 系统
 */

/**
 * USD 基础数据类型
 */
export interface UsdValue {
  type: UsdDataType;
  value: any;
  timeSamples?: Record<number, any>;
}

/**
 * USD 数据类型枚举
 */
export enum UsdDataType {
  Bool = 'bool',
  Int = 'int',
  Float = 'float',
  Double = 'double',
  String = 'string',
  Token = 'token',
  Asset = 'asset',
  Vector2f = 'float2',
  Vector3f = 'float3',
  Vector4f = 'float4',
  Matrix4d = 'matrix4d',
  Color3f = 'color3f',
  Color4f = 'color4f',
  Point3f = 'point3f',
  Normal3f = 'normal3f',
  Quatf = 'quatf',
  Array = 'array',
}

/**
 * USD Prim 基础接口
 */
export interface UsdPrim {
  /**
   * Prim 路径
   */
  path: string;
  /**
   * Prim 类型名称
   */
  typeName: string;
  /**
   * 是否激活
   */
  active: boolean;
  /**
   * 属性集合
   */
  attributes: Record<string, UsdValue>;
  /**
   * 关系集合
   */
  relationships: Record<string, string[]>;
  /**
   * 元数据
   */
  metadata: Record<string, any>;
  /**
   * 子 Prim
   */
  children: UsdPrim[];
  /**
   * 变体集合
   */
  variantSets?: Record<string, UsdVariantSet>;
  /**
   * 引用
   */
  references?: UsdReference[];
  /**
   * 载荷
   */
  payloads?: UsdPayload[];
}

/**
 * USD 变体集合
 */
export interface UsdVariantSet {
  /**
   * 变体集合名称
   */
  name: string;
  /**
   * 当前选择的变体
   */
  selection: string;
  /**
   * 变体列表
   */
  variants: Record<string, UsdVariant>;
}

/**
 * USD 变体
 */
export interface UsdVariant {
  /**
   * 变体名称
   */
  name: string;
  /**
   * 变体内容
   */
  primSpecs: UsdPrim[];
}

/**
 * USD 引用
 */
export interface UsdReference {
  /**
   * 资产路径
   */
  assetPath: string;
  /**
   * 目标路径
   */
  primPath?: string;
  /**
   * 层偏移
   */
  layerOffset?: UsdLayerOffset;
}

/**
 * USD 载荷
 */
export interface UsdPayload {
  /**
   * 资产路径
   */
  assetPath: string;
  /**
   * 目标路径
   */
  primPath?: string;
  /**
   * 层偏移
   */
  layerOffset?: UsdLayerOffset;
}

/**
 * USD 层偏移
 */
export interface UsdLayerOffset {
  /**
   * 偏移量
   */
  offset: number;
  /**
   * 缩放
   */
  scale: number;
}

/**
 * USD Stage 接口
 */
export interface UsdStage {
  /**
   * 根层
   */
  rootLayer: UsdLayer;
  /**
   * 会话层
   */
  sessionLayer?: UsdLayer;
  /**
   * 根 Prim
   */
  pseudoRoot: UsdPrim;
  /**
   * 默认 Prim
   */
  defaultPrim?: string;
  /**
   * 时间码
   */
  timeCodesPerSecond: number;
  /**
   * 开始时间码
   */
  startTimeCode: number;
  /**
   * 结束时间码
   */
  endTimeCode: number;
  /**
   * 帧率
   */
  framesPerSecond: number;
}

/**
 * USD Layer 接口
 */
export interface UsdLayer {
  /**
   * 层标识符
   */
  identifier: string;
  /**
   * 层版本
   */
  version: string;
  /**
   * 文档字符串
   */
  documentation?: string;
  /**
   * 子层
   */
  subLayers: string[];
  /**
   * Prim 规范
   */
  primSpecs: Record<string, UsdPrim>;
  /**
   * 默认 Prim
   */
  defaultPrim?: string;
  /**
   * 时间码
   */
  timeCodesPerSecond?: number;
  /**
   * 开始时间码
   */
  startTimeCode?: number;
  /**
   * 结束时间码
   */
  endTimeCode?: number;
  /**
   * 帧率
   */
  framesPerSecond?: number;
  /**
   * 自定义层数据
   */
  customLayerData?: Record<string, any>;
}

/**
 * USD 组合弧类型
 */
export enum UsdCompositionArcType {
  SubLayer = 'subLayer',
  Reference = 'reference',
  Payload = 'payload',
  Inherit = 'inherit',
  Specialize = 'specialize',
  VariantSet = 'variantSet',
}

/**
 * USD 组合弧
 */
export interface UsdCompositionArc {
  /**
   * 弧类型
   */
  type: UsdCompositionArcType;
  /**
   * 目标层或资产
   */
  target: string;
  /**
   * 目标路径
   */
  targetPath?: string;
  /**
   * 层偏移
   */
  layerOffset?: UsdLayerOffset;
}

/**
 * USD 属性规范
 */
export interface UsdPropertySpec {
  /**
   * 属性名称
   */
  name: string;
  /**
   * 属性类型
   */
  typeName: UsdDataType;
  /**
   * 是否自定义
   */
  custom: boolean;
  /**
   * 变化性
   */
  variability: UsdVariability;
  /**
   * 默认值
   */
  default?: any;
  /**
   * 时间采样
   */
  timeSamples?: Record<number, any>;
  /**
   * 连接
   */
  connections?: string[];
  /**
   * 元数据
   */
  metadata?: Record<string, any>;
}

/**
 * USD 变化性枚举
 */
export enum UsdVariability {
  Varying = 'varying',
  Uniform = 'uniform',
}

/**
 * USD 关系规范
 */
export interface UsdRelationshipSpec {
  /**
   * 关系名称
   */
  name: string;
  /**
   * 是否自定义
   */
  custom: boolean;
  /**
   * 目标
   */
  targets: string[];
  /**
   * 元数据
   */
  metadata?: Record<string, any>;
}
