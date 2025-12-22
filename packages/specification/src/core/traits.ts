/**
 * Traits - 基础可组合接口
 *
 * 设计原则:
 * - 每个 trait 只定义一个语义明确的能力
 * - trait 可以通过 extends 组合成复杂接口
 * - 消除 specification 包中的重复字段定义
 *
 * @packageDocumentation
 */

import type { VersionInfo } from './base';

// ============================================================================
// 基础标识 Traits
// ============================================================================

/**
 * 可命名的
 * @description 具有名称属性的实体
 */
export interface Nameable {
  /** 名称 */
  name: string;
}

/**
 * 可命名的（可选）
 * @description 具有可选名称属性的实体
 */
export interface OptionalNameable {
  /** 名称 */
  name?: string;
}

/**
 * 可描述的
 * @description 具有描述属性的实体
 */
export interface Describable {
  /** 描述 */
  description?: string;
}

/**
 * 可标记的
 * @description 具有标签属性的实体
 */
export interface Taggable {
  /** 标签列表 */
  tags?: string[];
}

/**
 * 可扩展的
 * @description 具有自定义数据属性的实体
 */
export interface Extensible {
  /** 自定义数据 */
  customData?: Record<string, unknown>;
}

// ============================================================================
// 资源引用 Traits
// ============================================================================

/**
 * 资源引用
 * @description 引用外部资源的能力
 */
export interface AssetReferable {
  /** 资源 ID */
  assetId: string;
}

/**
 * 可启用的
 * @description 具有启用/禁用状态的实体
 */
export interface Enableable {
  /** 是否启用 */
  enabled?: boolean;
}

// ============================================================================
// 时间相关 Traits
// ============================================================================

/**
 * 有持续时间的
 * @description 具有持续时间属性的实体
 */
export interface Durable {
  /** 持续时间 (秒) */
  duration: number;
}

/**
 * 可播放的
 * @description 具有播放状态的实体
 */
export interface Playable {
  /** 是否正在播放 */
  playing: boolean;
}

/**
 * 有速度的
 * @description 具有播放速度属性的实体
 */
export interface Speedy {
  /** 播放速度 */
  speed: number;
}

/**
 * 可循环的
 * @description 具有循环属性的实体
 */
export interface Loopable {
  /** 是否循环 */
  loop: boolean;
}

// ============================================================================
// 布尔值 Traits
// ============================================================================

/**
 * 布尔值容器
 * @description 存储单个布尔值的实体
 */
export interface BooleanValue {
  /** 布尔值 */
  value: boolean;
}

/**
 * 数值容器
 * @description 存储单个数值的实体
 */
export interface NumberValue {
  /** 数值 */
  value: number;
}

/**
 * 字符串容器
 * @description 存储单个字符串的实体
 */
export interface StringValue {
  /** 字符串值 */
  value: string;
}

// ============================================================================
// 版本与审计 Traits
// ============================================================================

/**
 * 可版本化的
 * @description 具有版本信息的实体
 */
export interface Versionable {
  /** 版本信息 */
  version: VersionInfo;
}

/**
 * 可审计的
 * @description 具有创建/修改审计信息的实体
 */
export interface Auditable {
  /** 创建者 */
  creator?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 最后修改时间 */
  lastModified?: string;
}

// ============================================================================
// 组合 Traits
// ============================================================================

/**
 * 基础元数据
 * @description 组合了命名、描述、标签的基础元数据
 */
export interface BaseMetadata extends OptionalNameable, Describable, Taggable, Extensible {}

/**
 * 完整元数据
 * @description 组合了所有元数据相关的 traits
 */
export interface FullMetadata extends Nameable, Describable, Taggable, Extensible, Versionable, Auditable {}

/**
 * 播放状态
 * @description 组合了播放相关的 traits
 */
export interface PlaybackState extends Playable, Speedy, Loopable, Durable {}
