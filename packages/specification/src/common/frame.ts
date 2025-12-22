/**
 * Maxellabs 通用帧动画元素
 * 定义所有系统共通的帧动画相关类型
 *
 * @module common/frame
 * @description 动画系统的基础模块
 *
 * ## 模块依赖关系
 *
 * ```
 * core/generics.ts (UnifiedKeyframe, UnifiedAnimationTrack)
 *        ↓
 * common/frame.ts (AnimationKeyframe, AnimationTrack, AnimationEvent, AnimationMask)
 *        ↓
 * common/animation.ts (重新导出 + AnimationState, AnimationController 等)
 * ```
 *
 * ## 设计说明
 * - AnimationKeyframe、AnimationEvent、AnimationMask 等基础类型定义在此处
 * - animation.ts 从这里导入并重新导出，避免循环依赖
 * - 使用 core/generics.ts 中的 UnifiedKeyframe 和 UnifiedAnimationTrack 作为基础
 */

import type { CommonElement } from './elements';
import type {
  ElementType,
  AnimationProperties,
  BaseEvent,
  EventType,
  UnifiedKeyframe,
  UnifiedAnimationTrack,
} from '../core';

/**
 * 帧动画类型
 */
export enum FrameAnimationType {
  /**
   * 序列帧动画
   */
  Sequence = 'sequence',
  /**
   * 关键帧动画
   */
  Keyframe = 'keyframe',
  /**
   * 骨骼动画
   */
  Skeletal = 'skeletal',
  /**
   * 变形动画
   */
  Morph = 'morph',
  /**
   * 程序化动画
   */
  Procedural = 'procedural',
  /**
   * 物理模拟动画
   */
  Physics = 'physics',
}
/**
 * 动画帧数据类型
 */
export enum AnimationFrameDataType {
  /**
   * 位置
   */
  Position = 'position',
  /**
   * 旋转
   */
  Rotation = 'rotation',
  /**
   * 缩放
   */
  Scale = 'scale',
  /**
   * 透明度
   */
  Opacity = 'opacity',
  /**
   * 颜色
   */
  Color = 'color',
  /**
   * 纹理坐标
   */
  UV = 'uv',
  /**
   * 变形权重
   */
  MorphWeight = 'morph-weight',
  /**
   * 自定义属性
   */
  Custom = 'custom',
}

/**
 * 关键帧
 *
 * @description 使用统一的 UnifiedKeyframe 泛型作为基础
 * 保持向后兼容：AnimationKeyframe 是 UnifiedKeyframe<any> 的别名
 */
export type AnimationKeyframe = UnifiedKeyframe<any>;

/**
 * 动画事件（基础类型，扩展核心事件）
 */
export interface AnimationEvent extends BaseEvent {
  /**
   * 事件类型
   */
  type: EventType;
  /**
   * 事件名称
   */
  name?: string;
  /**
   * 触发时间（秒）
   */
  time: number;
  /**
   * 事件参数
   */
  parameters?: Record<string, any>;
  /**
   * 事件回调
   */
  callback?: string;
}

/**
 * 动画遮罩
 */
export interface AnimationMask {
  /**
   * 遮罩名称
   */
  name: string;
  /**
   * 包含的路径
   */
  includePaths: string[];
  /**
   * 排除的路径
   */
  excludePaths?: string[];
  /**
   * 权重
   */
  weight: number;
}

/**
 * 动画轨道
 *
 * @description 基于 UnifiedAnimationTrack 泛型，添加帧动画特有的 dataType 字段
 * 保持向后兼容：保留所有原有属性
 */
export interface AnimationTrack extends Omit<UnifiedAnimationTrack<AnimationKeyframe>, 'property' | 'blendMode'> {
  /**
   * 目标属性（重命名为 propertyName 以保持兼容）
   */
  propertyName: string;
  /**
   * 数据类型
   */
  dataType: AnimationFrameDataType;
  /**
   * 混合模式（特化为帧动画的混合模式）
   */
  blendMode?: 'override' | 'additive' | 'multiply';
}

/**
 * 帧动画剪辑
 */
export interface FrameAnimationClip {
  /**
   * 动画名称
   */
  name: string;
  /**
   * 持续时间（秒）
   */
  duration: number;
  /**
   * 帧率
   */
  frameRate: number;
  /**
   * 动画轨道
   */
  tracks: AnimationTrack[];
  /**
   * 是否循环
   */
  loop: boolean;
  /**
   * 循环次数（-1为无限循环）
   */
  loopCount?: number;
  /**
   * 动画事件
   */
  events?: AnimationEvent[];
  /**
   * 动画属性
   */
  properties?: AnimationProperties;
}
/**
 * 帧动画控制器
 */
export interface FrameAnimationController {
  /**
   * 当前播放的动画
   */
  currentClip?: string;
  /**
   * 动画剪辑列表
   */
  clips: FrameAnimationClip[];
  /**
   * 播放状态
   */
  playState: 'playing' | 'paused' | 'stopped';
  /**
   * 播放时间
   */
  time: number;
  /**
   * 播放速度
   */
  speed: number;
  /**
   * 是否自动播放
   */
  autoPlay: boolean;
  /**
   * 混合权重
   */
  blendWeights?: Record<string, number>;
  /**
   * 动画层
   */
  layers?: AnimationLayer[];
}

/**
 * 动画层
 */
export interface AnimationLayer {
  /**
   * 层名称
   */
  name: string;
  /**
   * 层权重
   */
  weight: number;
  /**
   * 混合模式
   */
  blendMode: 'override' | 'additive' | 'multiply';
  /**
   * 动画剪辑
   */
  clip?: string;
  /**
   * 遮罩
   */
  mask?: AnimationMask;
}

/**
 * 通用帧元素
 */
export interface CommonFrameElement extends CommonElement {
  type: ElementType.Frame;
  /**
   * 帧动画类型
   */
  animationType: FrameAnimationType;
  /**
   * 动画控制器
   */
  controller: FrameAnimationController;
  /**
   * 当前帧
   */
  currentFrame: number;
  /**
   * 总帧数
   */
  totalFrames: number;
  /**
   * 是否自动播放
   */
  autoPlay: boolean;
  /**
   * 播放速度
   */
  playbackSpeed: number;
  /**
   * 是否循环
   */
  loop: boolean;
  /**
   * 帧缓存
   */
  frameCache?: FrameCache;
  /**
   * 预加载设置
   */
  preload?: FramePreloadSettings;
}

// FrameCache 扩展统一的缓存配置
import type { CacheConfiguration } from '../package/format';

/**
 * 帧缓存（扩展统一缓存配置）
 */
export interface FrameCache extends CacheConfiguration {
  /**
   * 预缓存帧数
   */
  preloadFrames: number;
}

/**
 * 帧预加载设置
 */
export interface FramePreloadSettings {
  /**
   * 是否启用预加载
   */
  enabled: boolean;
  /**
   * 预加载策略
   */
  strategy: 'all' | 'visible' | 'nearby';
  /**
   * 预加载范围
   */
  range: number;
  /**
   * 预加载优先级
   */
  priority: 'high' | 'normal' | 'low';
}

/**
 * 序列帧元素
 */
export interface SequenceFrameElement extends CommonFrameElement {
  animationType: FrameAnimationType;
  /**
   * 帧序列
   */
  frameSequence: FrameSequence;
}

/**
 * 帧序列
 */
export interface FrameSequence {
  /**
   * 帧列表
   */
  frames: SequenceFrame[];
  /**
   * 帧率
   */
  frameRate: number;
  /**
   * 是否循环
   */
  loop: boolean;
  /**
   * 序列名称
   */
  name?: string;
}

/**
 * 序列帧
 */
export interface SequenceFrame {
  /**
   * 帧索引
   */
  index: number;
  /**
   * 图像源
   */
  source: string;
  /**
   * 持续时间（秒）
   */
  duration: number;
  /**
   * 帧名称
   */
  name?: string;
  /**
   * 帧事件
   */
  events?: AnimationEvent[];
}
