/**
 * Maxellabs 材质渲染规范
 * 材质和着色器渲染相关类型定义
 *
 * @module rendering/material
 *
 * ## 架构说明
 *
 * 本模块基于 core/material.ts 中的统一材质类型，提供渲染管线专用的材质定义。
 *
 * ```
 * core/material.ts
 *   ├── BaseMaterialDefinition
 *   ├── MaterialTextureSlot
 *   └── MaterialTextureRef
 *        ↓
 * rendering/material.ts (本文件)
 *   ├── IMaterial (USD 风格的材质定义)
 *   ├── TextureReference (RHI 特化的纹理引用)
 *   └── MaterialRenderState (渲染状态)
 * ```
 */

import type {
  RHIFilterMode,
  RHIBlendOperation,
  RHICompareFunction,
  RHIFrontFace,
  RHICullMode,
  RHITextureType,
  RHIAddressMode,
  RHIBlendFactor,
} from '../common';
import type { GPUDataType } from '../core';
import type {
  FillMode,
  InterpolationMode,
  MaterialProperties,
  DataType,
  LoopMode,
  ColorLike,
  UsdPrim,
  UsdValue,
  UnifiedKeyframe,
  UnifiedAnimationTrack,
  BaseTextureRef,
  Nameable,
  RequiredEnableable,
  Durable,
  Describable,
} from '../core';

/**
 * 材质基础接口
 */
export interface MaterialPrim extends UsdPrim {
  typeName: 'Material';
}

/**
 * 材质定义
 */
export interface IMaterial extends MaterialPrim {
  attributes: {
    /**
     * 材质名称
     */
    name: UsdValue; // string
    /**
     * 材质类型
     * @see UnifiedMaterialType
     */
    materialType: UsdValue; // UnifiedMaterialType
    /**
     * 是否双面
     */
    doubleSided: UsdValue; // bool
    /**
     * 透明度
     */
    opacity: UsdValue; // float
    /**
     * 透明模式
     * @see MaterialAlphaMode
     */
    alphaMode: UsdValue; // MaterialAlphaMode
    /**
     * 透明度阈值
     */
    alphaCutoff?: UsdValue; // float
  };
  /**
   * 着色器网络
   */
  shaderNetwork: ShaderNetwork;
  /**
   * 材质属性
   */
  properties: MaterialProperties;
  /**
   * 渲染状态
   */
  renderState?: MaterialRenderState;
}

/**
 * 着色器网络
 */
export interface ShaderNetwork {
  /**
   * 着色器节点
   */
  nodes: Record<string, ShaderNode>;
  /**
   * 节点连接
   */
  connections: ShaderConnection[];
  /**
   * 输出节点
   */
  outputNode: string;
}

/**
 * 着色器节点
 */
export interface ShaderNode {
  /**
   * 节点ID
   */
  id: string;
  /**
   * 节点类型
   */
  type: ShaderNodeType;
  /**
   * 节点名称
   */
  name?: string;
  /**
   * 输入参数
   */
  inputs: Record<string, ShaderInput>;
  /**
   * 输出参数
   */
  outputs: Record<string, ShaderOutput>;
  /**
   * 节点位置
   */
  position?: [number, number];
}

/**
 * 着色器节点类型
 */
export enum ShaderNodeType {
  /**
   * PBR表面
   */
  PBRSurface = 'pbr-surface',
  /**
   * 纹理采样
   */
  TextureSample = 'texture-sample',
  /**
   * 常量
   */
  Constant = 'constant',
  /**
   * 数学运算
   */
  Math = 'math',
  /**
   * 向量运算
   */
  Vector = 'vector',
  /**
   * 颜色运算
   */
  Color = 'color',
  /**
   * UV坐标
   */
  UV = 'uv',
  /**
   * 法线
   */
  Normal = 'normal',
  /**
   * 混合
   */
  Mix = 'mix',
  /**
   * 噪声
   */
  Noise = 'noise',
  /**
   * 渐变
   */
  Gradient = 'gradient',
  /**
   * 菲涅尔
   */
  Fresnel = 'fresnel',
}

/**
 * 着色器输入
 *
 * @description 组合 Nameable trait
 */
export interface ShaderInput extends Nameable {
  /**
   * 输入类型
   */
  type: GPUDataType;
  /**
   * 默认值
   */
  defaultValue?: any;
  /**
   * 是否连接
   */
  connected: boolean;
  /**
   * 连接源
   */
  connection?: ShaderConnection;
}

/**
 * 着色器输出
 *
 * @description 组合 Nameable trait
 */
export interface ShaderOutput extends Nameable {
  /**
   * 输出类型
   */
  type: GPUDataType;
}

/**
 * 着色器连接
 */
export interface ShaderConnection {
  /**
   * 源节点ID
   */
  sourceNode: string;
  /**
   * 源输出名称
   */
  sourceOutput: string;
  /**
   * 目标节点ID
   */
  targetNode: string;
  /**
   * 目标输入名称
   */
  targetInput: string;
}

/**
 * 材质属性
 */
export interface MaterialProperty {
  /**
   * 属性值
   */
  value?: any;
  /**
   * 纹理
   */
  texture?: TextureReference;
  /**
   * UV通道
   */
  uvChannel?: number;
  /**
   * 变换
   */
  transform?: MaterialTextureTransform;
  /**
   * 强度
   */
  intensity?: number;
}

/**
 * 纹理引用（RHI 特化）
 *
 * @description 继承 BaseTextureRef，添加 RHI 特有的类型和采样器
 * 统一使用 assetId 作为纹理资源标识符
 */
export interface TextureReference extends Omit<BaseTextureRef, 'sampler'> {
  /**
   * 纹理资源ID（继承自 BaseTextureRef.assetId）
   * @see BaseTextureRef.assetId
   */
  assetId: string;
  /**
   * 纹理类型（RHI 特有）
   */
  type: RHITextureType;
  /**
   * 采样器（使用 RHI 特化采样器）
   */
  sampler?: MaterialTextureSampler;
}

/**
 * 材质纹理采样器
 * 用于材质系统中的纹理采样配置
 */
export interface MaterialTextureSampler {
  /**
   * 过滤模式
   */
  filter: RHIFilterMode;
  /**
   * 包装模式
   */
  wrap: RHIAddressMode;
  /**
   * 各向异性过滤
   */
  anisotropy?: number;
  /**
   * Mipmap偏移
   */
  mipmapBias?: number;
}

/**
 * 材质纹理变换
 *
 * @description 使用元组类型的纹理变换，特化于材质系统
 * 注意: 通用的 TextureTransform 使用 Vector2Like，定义在 generics.ts 中
 */
export interface MaterialTextureTransform {
  /**
   * 偏移
   */
  offset: [number, number];
  /**
   * 旋转
   */
  rotation: number;
  /**
   * 缩放
   */
  scale: [number, number];
}

/**
 * 材质渲染状态
 */
export interface MaterialRenderState {
  /**
   * 混合状态
   */
  blendState?: BlendState;
  /**
   * 深度状态
   */
  depthState?: DepthState;
  /**
   * 模板状态
   */
  stencilState?: StencilState;
  /**
   * 光栅化状态
   */
  rasterState?: RasterState;
}

/**
 * 混合状态
 *
 * @description 组合 RequiredEnableable trait
 */
export interface BlendState extends RequiredEnableable {
  /**
   * 源混合因子
   */
  srcFactor: RHIBlendFactor;
  /**
   * 目标混合因子
   */
  dstFactor: RHIBlendFactor;
  /**
   * 混合操作
   */
  operation: RHIBlendOperation;
  /**
   * Alpha源混合因子
   */
  srcAlphaFactor?: RHIBlendFactor;
  /**
   * Alpha目标混合因子
   */
  dstAlphaFactor?: RHIBlendFactor;
  /**
   * Alpha混合操作
   */
  alphaOperation?: RHIBlendOperation;
  /**
   * 混合颜色
   */
  blendColor?: ColorLike;
}

/**
 * 深度状态
 */
export interface DepthState {
  /**
   * 启用深度测试
   */
  testEnabled: boolean;
  /**
   * 启用深度写入
   */
  writeEnabled: boolean;
  /**
   * 深度比较函数
   */
  compareFunction: RHICompareFunction;
  /**
   * 深度偏移
   */
  bias?: DepthBias;
}

/**
 * 深度偏移
 */
export interface DepthBias {
  /**
   * 常量偏移
   */
  constantBias: number;
  /**
   * 斜率偏移
   */
  slopeBias: number;
  /**
   * 偏移夹紧
   */
  biasClamp: number;
}

/**
 * 模板状态
 *
 * @description 组合 RequiredEnableable trait
 */
export interface StencilState extends RequiredEnableable {
  /**
   * 读取掩码
   */
  readMask: number;
  /**
   * 写入掩码
   */
  writeMask: number;
  /**
   * 正面操作
   */
  frontFace: StencilOperation;
  /**
   * 背面操作
   */
  backFace: StencilOperation;
}

/**
 * 模板操作
 */
export interface StencilOperation {
  /**
   * 模板测试失败操作
   */
  stencilFail: StencilAction;
  /**
   * 深度测试失败操作
   */
  depthFail: StencilAction;
  /**
   * 测试通过操作
   */
  pass: StencilAction;
  /**
   * 比较函数
   */
  compareFunction: RHICompareFunction;
  /**
   * 参考值
   */
  referenceValue: number;
}

/**
 * 模板动作
 */
export enum StencilAction {
  /**
   * 保持
   */
  Keep = 'keep',
  /**
   * 置零
   */
  Zero = 'zero',
  /**
   * 替换
   */
  Replace = 'replace',
  /**
   * 递增并夹紧
   */
  IncrementClamp = 'increment-clamp',
  /**
   * 递减并夹紧
   */
  DecrementClamp = 'decrement-clamp',
  /**
   * 反转
   */
  Invert = 'invert',
  /**
   * 递增并环绕
   */
  IncrementWrap = 'increment-wrap',
  /**
   * 递减并环绕
   */
  DecrementWrap = 'decrement-wrap',
}

/**
 * 光栅化状态
 */
export interface RasterState {
  /**
   * 填充模式
   */
  fillMode: FillMode;
  /**
   * 剔除模式
   */
  cullMode: RHICullMode;
  /**
   * 正面方向
   */
  frontFace: RHIFrontFace;
  /**
   * 启用深度夹紧
   */
  depthClampEnabled: boolean;
  /**
   * 启用剪裁
   */
  scissorTestEnabled: boolean;
  /**
   * 启用多重采样
   */
  multisampleEnabled: boolean;
  /**
   * 启用抗锯齿线
   */
  antialiasedLineEnabled: boolean;
}

/**
 * 变体条件
 */
export interface VariantCondition {
  /**
   * 条件类型
   */
  type: ConditionType;
  /**
   * 条件参数
   */
  parameters: Record<string, any>;
}

/**
 * 条件类型
 */
export enum ConditionType {
  /**
   * 距离
   */
  Distance = 'distance',
  /**
   * 角度
   */
  Angle = 'angle',
  /**
   * 时间
   */
  Time = 'time',
  /**
   * 随机
   */
  Random = 'random',
  /**
   * 用户定义
   */
  UserDefined = 'user-defined',
}

/**
 * 材质库
 *
 * @description 组合 Nameable trait
 */
export interface MaterialLibrary extends Nameable {
  /**
   * 库版本
   */
  version: string;
  /**
   * 材质列表
   */
  materials: Record<string, IMaterial>;
  /**
   * 材质分类
   */
  categories: MaterialCategory[];
  /**
   * 材质标签
   */
  tags: string[];
}

/**
 * 材质分类
 *
 * @description 组合 Nameable, Describable traits
 */
export interface MaterialCategory extends Nameable, Describable {
  /**
   * 分类ID
   */
  id: string;
  /**
   * 父分类
   */
  parent?: string;
  /**
   * 材质列表
   */
  materials: string[];
}

/**
 * 程序化材质
 */
export interface ProceduralMaterial extends IMaterial {
  /**
   * 程序化参数
   */
  proceduralParameters: ProceduralParameter[];
  /**
   * 生成器类型
   */
  generatorType: GeneratorType;
  /**
   * 生成器配置
   */
  generatorConfig: Record<string, any>;
}

/**
 * 程序化参数
 *
 * @description 组合 Nameable, Describable traits
 */
export interface ProceduralParameter extends Nameable, Describable {
  /**
   * 参数类型
   */
  type: DataType;
  /**
   * 默认值
   */
  defaultValue: any;
  /**
   * 最小值
   */
  minValue?: any;
  /**
   * 最大值
   */
  maxValue?: any;
  /**
   * 步长
   */
  step?: any;
}

/**
 * 生成器类型
 */
export enum GeneratorType {
  /**
   * 噪声
   */
  Noise = 'noise',
  /**
   * 分形
   */
  Fractal = 'fractal',
  /**
   * 细胞自动机
   */
  CellularAutomata = 'cellular-automata',
  /**
   * 波形
   */
  Wave = 'wave',
  /**
   * 图案
   */
  Pattern = 'pattern',
  /**
   * 自定义
   */
  Custom = 'custom',
}

/**
 * 材质动画
 *
 * @description 组合 Nameable, Durable traits
 */
export interface MaterialAnimation extends Nameable, Durable {
  /**
   * 动画轨道
   */
  tracks: MaterialAnimationTrack[];
  /**
   * 循环模式
   */
  loopMode: LoopMode;
}

/**
 * 材质关键帧
 *
 * @description 基于 UnifiedKeyframe 泛型，材质动画使用 any 类型值
 */
export type MaterialKeyframe = UnifiedKeyframe<any>;

/**
 * 材质动画轨道
 *
 * @description 基于 UnifiedAnimationTrack 泛型，特化为材质属性动画
 */
export interface MaterialAnimationTrack
  extends Omit<UnifiedAnimationTrack<MaterialKeyframe>, 'property' | 'targetPath'> {
  /**
   * 目标属性
   */
  targetProperty: string;
  /**
   * 插值模式 (覆盖默认，使轨道级插值更明确)
   */
  interpolation: InterpolationMode;
  /**
   * 数据类型标识
   */
  dataType?: 'material';
}
