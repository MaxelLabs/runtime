/**
 * Scene Data Specification
 * 场景数据规范定义
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计原则
 *
 * 场景数据规范定义了编辑器产出的场景数据格式，用于：
 * 1. 编辑器序列化场景到 JSON/二进制
 * 2. 引擎加载场景数据并解析为 ECS 实体
 * 3. 运行时驱动场景（曲线、状态机、用户接口）
 *
 * ## 数据流
 *
 * ```
 * Editor → SceneData (spec) → Loader → Scene.fromData() → ECS World
 *                                                             ↓
 *                                    Curves/StateMachines/UserAPI → Runtime
 * ```
 *
 * ## 版本兼容
 *
 * 场景数据包含版本号，用于处理格式升级和向后兼容。
 */

import type { ColorLike, Vector3Like, QuaternionLike } from './math';

// ============================================================================
// Scene Data Root
// ============================================================================

/**
 * 场景数据版本
 */
export interface ISceneVersion {
  /** 主版本号 */
  major: number;
  /** 次版本号 */
  minor: number;
  /** 修订版本号 */
  patch: number;
}

/**
 * 场景数据根结构
 * @description 编辑器产出的完整场景数据
 */
export interface ISceneData {
  /** 场景版本 */
  version: ISceneVersion;

  /** 场景元数据 */
  metadata: ISceneMetadata;

  /** 实体列表 */
  entities: IEntityData[];

  /** 资源列表（引用的外部资源） */
  assets?: IAssetRefData[];

  /** 环境设置 */
  environment?: IEnvironmentData;

  /** 渲染设置 */
  renderSettings?: IRenderSettingsData;
}

/**
 * 场景元数据
 */
export interface ISceneMetadata {
  /** 场景名称 */
  name: string;
  /** 场景 ID（唯一标识） */
  id?: string;
  /** 场景描述 */
  description?: string;
  /** 创建时间 (ISO 8601) */
  createdAt?: string;
  /** 修改时间 (ISO 8601) */
  modifiedAt?: string;
  /** 作者 */
  author?: string;
  /** 标签 */
  tags?: string[];
  /** 自定义扩展数据 */
  extensions?: Record<string, unknown>;
}

// ============================================================================
// Entity Data
// ============================================================================

/**
 * 实体数据
 * @description 单个实体的序列化数据
 */
export interface IEntityData {
  /** 实体 ID（场景内唯一） */
  id: number;
  /** 实体名称 */
  name?: string;
  /** 实体标签 */
  tag?: string;
  /** 是否激活 */
  active?: boolean;
  /** 父实体 ID（null 表示根级实体） */
  parent?: number | null;
  /** 组件列表 */
  components: IComponentData[];
}

/**
 * 组件数据
 * @description 单个组件的序列化数据
 *
 * @remarks
 * type 字段用于标识组件类型，运行时通过组件注册表查找对应的组件类
 */
export interface IComponentData {
  /** 组件类型标识 */
  type: string;
  /** 组件数据（POD） */
  data: Record<string, unknown>;
  /** 是否启用 */
  enabled?: boolean;
}

// ============================================================================
// Common Component Data Types
// ============================================================================

/**
 * 变换组件数据
 */
export interface ITransformData {
  /** 位置 */
  position?: Vector3Like;
  /** 旋转（四元数） */
  rotation?: QuaternionLike;
  /** 缩放 */
  scale?: Vector3Like;
}

/**
 * 相机组件数据（场景序列化格式）
 * @description 区别于 rendering/camera.ts 中的完整 ICameraData
 */
export interface ISceneCameraData {
  /** 投影类型 */
  projectionType: 'perspective' | 'orthographic';
  /** 视野角度（透视相机，弧度） */
  fov?: number;
  /** 近裁剪面 */
  near?: number;
  /** 远裁剪面 */
  far?: number;
  /** 正交相机尺寸 */
  orthographicSize?: number;
  /** 宽高比（0 表示自动） */
  aspect?: number;
  /** 是否为主相机 */
  isMain?: boolean;
  /** 优先级 */
  priority?: number;
  /** 清除标志 */
  clearFlags?: number;
  /** 背景颜色 */
  backgroundColor?: ColorLike;
}

/**
 * 场景光源类型
 * @description 场景序列化使用的简化光源类型
 */
export type SceneLightType = 'directional' | 'point' | 'spot' | 'area' | 'ambient';

/**
 * 光源组件数据（基础）
 */
export interface ISceneLightDataBase {
  /** 光源类型 */
  type: SceneLightType;
  /** 颜色 */
  color?: ColorLike;
  /** 强度 */
  intensity?: number;
  /** 是否投射阴影 */
  castShadow?: boolean;
}

/**
 * 方向光数据
 */
export interface ISceneDirectionalLightData extends ISceneLightDataBase {
  type: 'directional';
  /** 阴影级联数量 */
  shadowCascades?: number;
}

/**
 * 点光源数据
 */
export interface IScenePointLightData extends ISceneLightDataBase {
  type: 'point';
  /** 衰减范围 */
  range?: number;
}

/**
 * 聚光灯数据
 */
export interface ISceneSpotLightData extends ISceneLightDataBase {
  type: 'spot';
  /** 衰减范围 */
  range?: number;
  /** 内锥角（弧度） */
  innerConeAngle?: number;
  /** 外锥角（弧度） */
  outerConeAngle?: number;
}

/**
 * 光源组件数据（联合类型）
 */
export type ISceneLightData =
  | ISceneDirectionalLightData
  | IScenePointLightData
  | ISceneSpotLightData
  | ISceneLightDataBase;

/**
 * 网格引用组件数据
 */
export interface IMeshRefData {
  /** 资源 ID */
  assetId: string;
  /** 网格名称（多网格资源） */
  meshName?: string;
  /** 子网格索引 */
  submeshIndex?: number;
}

/**
 * 材质引用组件数据
 */
export interface IMaterialRefData {
  /** 资源 ID */
  assetId: string;
  /** 材质参数覆盖 */
  overrides?: Record<string, unknown>;
}

// ============================================================================
// Asset Reference
// ============================================================================

/**
 * 场景资源类型
 * @description 场景序列化中使用的资源类型字符串
 * 使用字符串类型而非枚举以保持与 JSON 序列化的兼容性
 */
export type SceneAssetType = 'mesh' | 'texture' | 'material' | 'shader' | 'animation' | 'audio' | 'script' | 'custom';

/**
 * 资源引用数据
 */
export interface IAssetRefData {
  /** 资源 ID */
  id: string;
  /** 资源类型 */
  type: SceneAssetType;
  /** 资源路径/URI */
  uri: string;
  /** 资源名称 */
  name?: string;
  /** 预加载 */
  preload?: boolean;
}

// ============================================================================
// Environment Data
// ============================================================================

/**
 * 天空盒类型
 */
export type SkyboxType = 'color' | 'cubemap' | 'procedural' | 'hdri';

/**
 * 环境设置
 */
export interface IEnvironmentData {
  /** 天空盒类型 */
  skyboxType?: SkyboxType;
  /** 天空盒纹理 ID */
  skyboxTexture?: string;
  /** 天空盒颜色（color 类型） */
  skyboxColor?: ColorLike;
  /** 环境光颜色 */
  ambientColor?: ColorLike;
  /** 环境光强度 */
  ambientIntensity?: number;
  /** 环境贴图（用于 IBL） */
  environmentMap?: string;
  /** 雾效设置 */
  fog?: IFogData;
}

/**
 * 雾效数据
 */
export interface IFogData {
  /** 是否启用 */
  enabled: boolean;
  /** 雾效类型 */
  type: 'linear' | 'exponential' | 'exponential2';
  /** 雾效颜色 */
  color: ColorLike;
  /** 雾效密度（指数雾） */
  density?: number;
  /** 起始距离（线性雾） */
  near?: number;
  /** 结束距离（线性雾） */
  far?: number;
}

// ============================================================================
// Render Settings
// ============================================================================

/**
 * 渲染设置
 */
export interface IRenderSettingsData {
  /** 抗锯齿模式 */
  antiAliasing?: 'none' | 'fxaa' | 'msaa' | 'taa';
  /** MSAA 采样数 */
  msaaSamples?: number;
  /** HDR 渲染 */
  hdr?: boolean;
  /** 色调映射 */
  toneMapping?: 'none' | 'aces' | 'reinhard' | 'filmic';
  /** 曝光值 */
  exposure?: number;
  /** Gamma 值 */
  gamma?: number;
  /** 阴影设置 */
  shadows?: IShadowSettingsData;
}

/**
 * 阴影设置
 */
export interface IShadowSettingsData {
  /** 是否启用阴影 */
  enabled: boolean;
  /** 阴影贴图分辨率 */
  resolution: number;
  /** 阴影距离 */
  distance: number;
  /** 阴影偏移 */
  bias: number;
  /** 软阴影 */
  softShadows?: boolean;
}

// ============================================================================
// Animation Data (for curves and state machines)
// ============================================================================

/**
 * 动画曲线关键帧
 */
export interface IAnimationKeyframe {
  /** 时间（秒） */
  time: number;
  /** 值 */
  value: number | number[];
  /** 入切线 */
  inTangent?: number | number[];
  /** 出切线 */
  outTangent?: number | number[];
  /** 插值模式 */
  interpolation?: 'linear' | 'step' | 'bezier' | 'hermite';
}

/**
 * 动画曲线
 */
export interface IAnimationCurve {
  /** 曲线名称 */
  name?: string;
  /** 目标实体 ID */
  targetEntity: number;
  /** 目标组件类型 */
  targetComponent: string;
  /** 目标属性路径 */
  targetProperty: string;
  /** 关键帧列表 */
  keyframes: IAnimationKeyframe[];
}

/**
 * 动画片段数据
 */
export interface IAnimationClipData {
  /** 片段名称 */
  name: string;
  /** 持续时间（秒） */
  duration: number;
  /** 曲线列表 */
  curves: IAnimationCurve[];
  /** 是否循环 */
  loop?: boolean;
  /** 播放速度 */
  speed?: number;
}

/**
 * 状态机状态
 */
export interface IStateMachineState {
  /** 状态名称 */
  name: string;
  /** 关联的动画片段 */
  clipName?: string;
  /** 是否为默认状态 */
  isDefault?: boolean;
  /** 进入行为 */
  onEnter?: string;
  /** 退出行为 */
  onExit?: string;
}

/**
 * 状态机转换条件
 */
export interface ITransitionCondition {
  /** 参数名称 */
  parameter: string;
  /** 比较操作 */
  operator: 'equals' | 'notEquals' | 'greater' | 'less' | 'greaterOrEqual' | 'lessOrEqual';
  /** 比较值 */
  value: number | boolean | string;
}

/**
 * 状态机转换
 */
export interface IStateMachineTransition {
  /** 源状态 */
  from: string;
  /** 目标状态 */
  to: string;
  /** 转换条件 */
  conditions?: ITransitionCondition[];
  /** 过渡时间（秒） */
  duration?: number;
  /** 是否有退出时间 */
  hasExitTime?: boolean;
  /** 退出时间（0-1） */
  exitTime?: number;
}

/**
 * 状态机参数
 */
export interface IStateMachineParameter {
  /** 参数名称 */
  name: string;
  /** 参数类型 */
  type: 'float' | 'int' | 'bool' | 'trigger';
  /** 默认值 */
  defaultValue: number | boolean;
}

/**
 * 动画状态机数据
 */
export interface IStateMachineData {
  /** 状态机名称 */
  name: string;
  /** 状态列表 */
  states: IStateMachineState[];
  /** 转换列表 */
  transitions: IStateMachineTransition[];
  /** 参数列表 */
  parameters: IStateMachineParameter[];
}

// ============================================================================
// Component Type Registry (for deserialization)
// ============================================================================

/**
 * 组件类型标识符常量
 * @description 用于序列化/反序列化时识别组件类型
 */
export const ComponentTypeIds = {
  // Transform
  LocalTransform: 'LocalTransform',
  WorldTransform: 'WorldTransform',

  // Hierarchy
  Parent: 'Parent',
  Children: 'Children',

  // Data
  Name: 'Name',
  Tag: 'Tag',
  Tags: 'Tags',
  Disabled: 'Disabled',
  Static: 'Static',
  Metadata: 'Metadata',

  // Visual
  Visible: 'Visible',
  Layer: 'Layer',
  MeshRef: 'MeshRef',
  MaterialRef: 'MaterialRef',
  TextureRef: 'TextureRef',
  CastShadow: 'CastShadow',
  ReceiveShadow: 'ReceiveShadow',

  // Camera
  Camera: 'Camera',

  // Light
  DirectionalLight: 'DirectionalLight',
  PointLight: 'PointLight',
  SpotLight: 'SpotLight',

  // Animation
  AnimationState: 'AnimationState',

  // Layout
  Layout: 'Layout',
} as const;

export type ComponentTypeId = (typeof ComponentTypeIds)[keyof typeof ComponentTypeIds];
