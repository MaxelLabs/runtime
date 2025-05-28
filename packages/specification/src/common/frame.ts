/**
 * Maxellabs 通用帧动画元素
 * 定义所有系统共通的帧动画相关类型
 */

import type { CommonElement, CommonElementType } from './elements';
import type { AnimationProperties } from '../core/interfaces';
import type { AnimationMask } from './animation';

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
   * 粒子动画
   */
  Particle = 'particle',
}

/**
 * 帧插值类型
 */
export enum FrameInterpolationType {
  /**
   * 线性插值
   */
  Linear = 'linear',
  /**
   * 阶梯插值
   */
  Step = 'step',
  /**
   * 三次贝塞尔插值
   */
  Bezier = 'bezier',
  /**
   * 样条插值
   */
  Spline = 'spline',
}

/**
 * 帧数据类型
 */
export enum FrameDataType {
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
 */
export interface Keyframe {
  /**
   * 时间（秒）
   */
  time: number;
  /**
   * 值
   */
  value: any;
  /**
   * 插值类型
   */
  interpolation: FrameInterpolationType;
  /**
   * 贝塞尔控制点（仅贝塞尔插值使用）
   */
  bezierControlPoints?: {
    inTangent: [number, number];
    outTangent: [number, number];
  };
  /**
   * 缓动函数
   */
  easing?: string;
}

/**
 * 动画轨道
 */
export interface AnimationTrack {
  /**
   * 轨道名称
   */
  name: string;
  /**
   * 目标属性
   */
  property: string;
  /**
   * 数据类型
   */
  dataType: FrameDataType;
  /**
   * 关键帧列表
   */
  keyframes: Keyframe[];
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 权重
   */
  weight: number;
  /**
   * 混合模式
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
  events?: FrameAnimationEvent[];
  /**
   * 动画属性
   */
  properties?: AnimationProperties;
}

/**
 * 帧动画事件
 */
export interface FrameAnimationEvent {
  /**
   * 事件名称
   */
  name: string;
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
  type: CommonElementType.Frame;
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

/**
 * 帧缓存
 */
export interface FrameCache {
  /**
   * 是否启用缓存
   */
  enabled: boolean;
  /**
   * 缓存大小（MB）
   */
  maxSize: number;
  /**
   * 缓存策略
   */
  strategy: 'lru' | 'fifo' | 'lfu';
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
  animationType: FrameAnimationType.Sequence;
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
  events?: FrameAnimationEvent[];
}
