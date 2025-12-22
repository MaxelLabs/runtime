/**
 * ECS Component Interfaces
 * 独立的 ECS 组件数据接口定义
 *
 * 设计原则:
 * - 每个 ECS 组件对应一个独立接口
 * - 接口只包含纯数据（POD），不包含方法
 * - 通过继承 Traits 接口实现复用，消除重复定义
 *
 * @packageDocumentation
 */

import type {
  StringValue,
  BooleanValue,
  NumberValue,
  AssetReferable,
  Enableable,
  Durable,
  Playable,
  Speedy,
  Loopable,
  BaseMetadata,
} from './traits';

// ============================================================================
// Transform Components (从 ITransform/TransformHierarchy 拆分)
// ============================================================================

/**
 * 父实体引用接口
 * @description 用于建立实体间的父子层级关系
 */
export interface IParent {
  /** 父实体 ID */
  entity: number;
}

/**
 * 子实体列表接口
 * @description 存储当前实体的所有子实体
 */
export interface IChildren {
  /** 子实体 ID 列表 */
  entities: number[];
}

// ============================================================================
// Data Components (从 CommonMetadata 拆分)
// ============================================================================

/**
 * 名称接口
 * @description 实体的可读名称，继承自 StringValue trait
 */
export type IName = StringValue;

/**
 * 单标签接口
 * @description 单个字符串标签，继承自 StringValue trait
 */
export type ITag = StringValue;

/**
 * 多标签接口
 * @description 多个字符串标签集合
 */
export interface ITags {
  /** 标签集合 */
  values: string[];
}

/**
 * 禁用状态接口
 * @description 标记实体被禁用
 */
export interface IDisabled {
  /** 禁用原因 */
  reason?: string;
}

/**
 * 元数据接口
 * @description 存储实体的元数据信息，继承自 BaseMetadata trait
 */
export type IMetadata = BaseMetadata;

/**
 * 静态标记接口
 * @description 标记实体为静态（变换不会改变，可用于优化）
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IStatic {
  // 标记接口，无字段
}

// ============================================================================
// Visual Components (从 RenderingProperties/CommonMaterial 拆分)
// ============================================================================

/**
 * 可见性接口
 * @description 控制实体渲染可见性，继承自 BooleanValue trait
 */
export type IVisible = BooleanValue;

/**
 * 渲染层级接口
 * @description 控制实体所属渲染层
 */
export interface ILayer {
  /** 层级掩码 (32位) */
  mask: number;
}

/**
 * 投射阴影接口
 * @description 控制实体是否投射阴影，继承自 BooleanValue trait
 */
export type ICastShadow = BooleanValue;

/**
 * 接收阴影接口
 * @description 控制实体是否接收阴影，继承自 BooleanValue trait
 */
export type IReceiveShadow = BooleanValue;

/**
 * 网格引用接口
 * @description 引用外部网格资源，继承自 AssetReferable trait
 */
export interface IMeshRef extends AssetReferable {
  /** 网格名称 (用于多网格资源) */
  meshName?: string;
  /** 子网格索引 */
  submeshIndex?: number;
}

/**
 * 材质引用接口
 * @description 引用外部材质资源，继承自 AssetReferable 和 Enableable traits
 */
export interface IMaterialRef extends AssetReferable, Enableable {
  /** 材质参数覆盖 */
  overrides?: Record<string, unknown>;
}

// ============================================================================
// Physics Components (从 ParticlePhysics 拆分 + 新增)
// ============================================================================

/**
 * 质量接口
 * @description 物理质量属性，继承自 NumberValue trait
 */
export interface IMass extends NumberValue {
  /** 是否为无限质量 (不可移动) */
  infinite?: boolean;
}

/**
 * 重力接口
 * @description 重力影响属性
 */
export interface IGravity {
  /** 重力缩放因子 */
  scale: number;
}

/**
 * 阻尼接口
 * @description 速度阻尼属性
 */
export interface IDamping {
  /** 线性阻尼 (0-1) */
  linear: number;
  /** 角阻尼 (0-1) */
  angular: number;
}

// ============================================================================
// Animation Components (简化的动画状态)
// ============================================================================

/**
 * 动画状态接口
 * @description 简化的动画播放状态，组合多个 traits
 */
export interface IAnimationState extends Playable, Speedy, Loopable {
  /** 当前播放的动画 ID */
  currentClipId: string;
  /** 播放时间 (秒) */
  time: number;
}

/**
 * 动画片段引用接口
 * @description 引用外部动画资源，继承自 AssetReferable 和 Durable traits
 */
export interface IAnimationClipRef extends AssetReferable, Durable {}

/**
 * 时间轴接口
 * @description 简化的时间轴数据，组合多个 traits
 */
export interface ITimeline extends Playable, Speedy, Durable {
  /** 当前时间 (秒) */
  currentTime: number;
  /** 轨道 ID 列表 */
  trackIds: string[];
}

/**
 * 缓动类型
 */
export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

/**
 * 补间动画状态接口
 * @description 简单属性补间动画，组合多个 traits
 */
export interface ITweenState extends Playable, Durable {
  /** 起始值 */
  from: number;
  /** 目标值 */
  to: number;
  /** 当前进度 (0-1) */
  progress: number;
  /** 缓动函数类型 */
  easing: EasingType;
}
