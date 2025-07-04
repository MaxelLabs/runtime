/**
 * Maxellabs 材质渲染规范
 * 材质和着色器渲染相关类型定义
 */

import type { TextureFilterMode } from '../common';
import type { CullMode } from '../common/renderer/renderState';
import type {
  FillMode,
  InterpolationMode,
  MaterialProperties,
  IVector2,
  WrapMode,
  RHIBlendFactor,
  RHIBlendOperation,
  IColor,
  RHICompareFunction,
  RHIFrontFace,
} from '../core';
import type { UsdPrim, UsdValue } from '../core/usd';

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
     */
    materialType: UsdValue; // MaterialType
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
     */
    alphaMode: UsdValue; // AlphaMode
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
 */
export interface ShaderInput {
  /**
   * 输入名称
   */
  name: string;
  /**
   * 输入类型
   */
  type: ShaderDataType;
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
 */
export interface ShaderOutput {
  /**
   * 输出名称
   */
  name: string;
  /**
   * 输出类型
   */
  type: ShaderDataType;
}

/**
 * 着色器数据类型
 */
export enum ShaderDataType {
  /**
   * 浮点数
   */
  Float = 'float',
  /**
   * 二维向量
   */
  Vector2 = 'vector2',
  /**
   * 三维向量
   */
  Vector3 = 'vector3',
  /**
   * 四维向量
   */
  Vector4 = 'vector4',
  /**
   * 颜色
   */
  Color = 'color',
  /**
   * 纹理
   */
  Texture = 'texture',
  /**
   * 矩阵
   */
  Matrix = 'matrix',
  /**
   * 布尔值
   */
  Boolean = 'boolean',
  /**
   * 整数
   */
  Integer = 'integer',
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
  transform?: TextureTransform;
  /**
   * 强度
   */
  intensity?: number;
}

/**
 * 纹理引用
 */
export interface TextureReference {
  /**
   * 纹理路径
   */
  path: string;
  /**
   * 纹理类型
   */
  type: TextureType;
  /**
   * 采样器
   */
  sampler?: MaterialTextureSampler;
}

/**
 * 纹理类型
 */
export enum TextureType {
  /**
   * 2D纹理
   */
  Texture2D = 'texture2d',
  /**
   * 立方体纹理
   */
  TextureCube = 'texture-cube',
  /**
   * 3D纹理
   */
  Texture3D = 'texture3d',
  /**
   * 纹理数组
   */
  TextureArray = 'texture-array',
}

/**
 * 材质纹理采样器
 * 用于材质系统中的纹理采样配置
 */
export interface MaterialTextureSampler {
  /**
   * 过滤模式
   */
  filter: TextureFilterMode;
  /**
   * 包装模式
   */
  wrap: WrapMode;
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
 * 纹理变换
 */
export interface TextureTransform {
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
 */
export interface BlendState {
  /**
   * 启用混合
   */
  enabled: boolean;
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
  blendColor?: IColor;
}

/**
 * 混合操作
 */
export enum BlendOperation {
  /**
   * 加法
   */
  Add = 'add',
  /**
   * 减法
   */
  Subtract = 'subtract',
  /**
   * 反向减法
   */
  ReverseSubtract = 'reverse-subtract',
  /**
   * 最小值
   */
  Min = 'min',
  /**
   * 最大值
   */
  Max = 'max',
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
 */
export interface StencilState {
  /**
   * 启用模板测试
   */
  enabled: boolean;
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
  cullMode: CullMode;
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
 * 材质变体
 */
// export interface MaterialVariant {
//   /**
//    * 变体名称
//    */
//   name: string;
//   /**
//    * 变体描述
//    */
//   description?: string;
//   /**
//    * 变体属性覆盖
//    */
//   propertyOverrides: Record<string, any>;
//   /**
//    * 变体条件
//    */
//   conditions?: VariantCondition[];
// }

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
 */
export interface MaterialLibrary {
  /**
   * 库名称
   */
  name: string;
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
 */
export interface MaterialCategory {
  /**
   * 分类ID
   */
  id: string;
  /**
   * 分类名称
   */
  name: string;
  /**
   * 分类描述
   */
  description?: string;
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
 */
export interface ProceduralParameter {
  /**
   * 参数名称
   */
  name: string;
  /**
   * 参数类型
   */
  type: ParameterType;
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
  /**
   * 描述
   */
  description?: string;
}

/**
 * 参数类型
 */
export enum ParameterType {
  /**
   * 浮点数
   */
  Float = 'float',
  /**
   * 整数
   */
  Integer = 'integer',
  /**
   * 布尔值
   */
  Boolean = 'boolean',
  /**
   * 颜色
   */
  Color = 'color',
  /**
   * 向量
   */
  Vector = 'vector',
  /**
   * 枚举
   */
  Enum = 'enum',
  /**
   * 字符串
   */
  String = 'string',
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
 */
export interface MaterialAnimation {
  /**
   * 动画名称
   */
  name: string;
  /**
   * 动画时长
   */
  duration: number;
  /**
   * 动画轨道
   */
  tracks: MaterialAnimationTrack[];
  /**
   * 循环模式
   */
  loopMode: AnimationLoopMode;
}

/**
 * 材质动画轨道
 */
export interface MaterialAnimationTrack {
  /**
   * 目标属性
   */
  targetProperty: string;
  /**
   * 关键帧
   */
  keyframes: MaterialKeyframe[];
  /**
   * 插值模式
   */
  interpolation: InterpolationMode;
}

/**
 * 材质关键帧
 */
export interface MaterialKeyframe {
  /**
   * 时间
   */
  time: number;
  /**
   * 值
   */
  value: any;
  /**
   * 切线输入
   */
  inTangent?: IVector2;
  /**
   * 切线输出
   */
  outTangent?: IVector2;
}

/**
 * 动画循环模式
 */
export enum AnimationLoopMode {
  /**
   * 不循环
   */
  None = 'none',
  /**
   * 循环
   */
  Loop = 'loop',
  /**
   * 乒乓
   */
  PingPong = 'ping-pong',
  /**
   * 夹紧
   */
  Clamp = 'clamp',
}
