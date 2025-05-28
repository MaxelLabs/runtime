/**
 * Maxellabs 通用精灵元素
 * 定义所有系统共通的精灵相关类型
 */

import type { CommonElement, CommonElementType } from './elements';
import type { AnimationProperties } from '../core/interfaces';

/**
 * 精灵类型
 */
export enum SpriteType {
  /**
   * 2D精灵
   */
  Sprite2D = '2d',
  /**
   * 广告牌精灵
   */
  Billboard = 'billboard',
  /**
   * UI精灵
   */
  UI = 'ui',
  /**
   * 平铺精灵
   */
  Tiled = 'tiled',
  /**
   * 九宫格精灵
   */
  NineSlice = 'nine-slice',
}

/**
 * 精灵对齐方式
 */
export enum SpriteAlignment {
  /**
   * 中心对齐
   */
  Center = 'center',
  /**
   * 左上角对齐
   */
  TopLeft = 'top-left',
  /**
   * 顶部中心对齐
   */
  TopCenter = 'top-center',
  /**
   * 右上角对齐
   */
  TopRight = 'top-right',
  /**
   * 左侧中心对齐
   */
  MiddleLeft = 'middle-left',
  /**
   * 右侧中心对齐
   */
  MiddleRight = 'middle-right',
  /**
   * 左下角对齐
   */
  BottomLeft = 'bottom-left',
  /**
   * 底部中心对齐
   */
  BottomCenter = 'bottom-center',
  /**
   * 右下角对齐
   */
  BottomRight = 'bottom-right',
}

/**
 * 精灵帧
 */
export interface SpriteFrame {
  /**
   * 帧名称
   */
  name: string;
  /**
   * 在图集中的X坐标
   */
  x: number;
  /**
   * 在图集中的Y坐标
   */
  y: number;
  /**
   * 帧宽度
   */
  width: number;
  /**
   * 帧高度
   */
  height: number;
  /**
   * 是否旋转
   */
  rotated?: boolean;
  /**
   * 是否修剪
   */
  trimmed?: boolean;
  /**
   * 原始尺寸
   */
  sourceSize?: {
    width: number;
    height: number;
  };
  /**
   * 修剪偏移
   */
  trimOffset?: {
    x: number;
    y: number;
  };
  /**
   * UV坐标
   */
  uv?: {
    u: number;
    v: number;
    u2: number;
    v2: number;
  };
  /**
   * 持续时间（用于动画）
   */
  duration?: number;
}

/**
 * 精灵图集
 */
export interface SpriteAtlas {
  /**
   * 图集纹理路径
   */
  texture: string;
  /**
   * 图集尺寸
   */
  size: {
    width: number;
    height: number;
  };
  /**
   * 帧列表
   */
  frames: SpriteFrame[];
  /**
   * 图集元数据
   */
  metadata?: SpriteAtlasMetadata;
}

/**
 * 精灵图集元数据
 */
export interface SpriteAtlasMetadata {
  /**
   * 应用程序名称
   */
  app: string;
  /**
   * 版本
   */
  version: string;
  /**
   * 图像格式
   */
  format: string;
  /**
   * 缩放比例
   */
  scale: number;
  /**
   * 每行帧数
   */
  framesPerRow?: number;
  /**
   * 总帧数
   */
  totalFrames?: number;
  /**
   * 创建时间
   */
  createdAt?: string;
}

/**
 * 精灵动画
 */
export interface SpriteAnimation {
  /**
   * 动画名称
   */
  name: string;
  /**
   * 帧序列（帧索引）
   */
  frames: number[];
  /**
   * 帧率
   */
  frameRate: number;
  /**
   * 是否循环
   */
  loop: boolean;
  /**
   * 动画持续时间
   */
  duration?: number;
  /**
   * 动画属性
   */
  properties?: AnimationProperties;
  /**
   * 动画事件
   */
  events?: SpriteAnimationEvent[];
}

/**
 * 精灵动画事件
 */
export interface SpriteAnimationEvent {
  /**
   * 事件名称
   */
  name: string;
  /**
   * 触发帧
   */
  frame: number;
  /**
   * 事件参数
   */
  parameters?: Record<string, any>;
}

/**
 * 精灵状态机
 */
export interface SpriteStateMachine {
  /**
   * 当前状态
   */
  currentState: string;
  /**
   * 状态列表
   */
  states: SpriteState[];
  /**
   * 状态转换
   */
  transitions: SpriteTransition[];
  /**
   * 默认状态
   */
  defaultState?: string;
}

/**
 * 精灵状态
 */
export interface SpriteState {
  /**
   * 状态名称
   */
  name: string;
  /**
   * 动画名称
   */
  animation: string;
  /**
   * 播放速度
   */
  speed?: number;
  /**
   * 是否循环
   */
  loop?: boolean;
  /**
   * 状态行为
   */
  behaviors?: SpriteStateBehavior[];
}

/**
 * 精灵状态行为
 */
export interface SpriteStateBehavior {
  /**
   * 行为类型
   */
  type: string;
  /**
   * 行为参数
   */
  parameters?: Record<string, any>;
}

/**
 * 精灵状态转换
 */
export interface SpriteTransition {
  /**
   * 源状态
   */
  from: string;
  /**
   * 目标状态
   */
  to: string;
  /**
   * 转换条件
   */
  conditions?: SpriteTransitionCondition[];
  /**
   * 转换持续时间
   */
  duration?: number;
  /**
   * 是否有退出时间
   */
  hasExitTime?: boolean;
  /**
   * 退出时间
   */
  exitTime?: number;
}

/**
 * 精灵状态转换条件
 */
export interface SpriteTransitionCondition {
  /**
   * 参数名称
   */
  parameter: string;
  /**
   * 比较类型
   */
  comparison: 'equals' | 'not-equals' | 'greater' | 'less' | 'greater-equal' | 'less-equal';
  /**
   * 比较值
   */
  value: any;
}

/**
 * 通用精灵元素
 */
export interface CommonSpriteElement extends CommonElement {
  type: CommonElementType.Sprite;
  /**
   * 精灵类型
   */
  spriteType: SpriteType;
  /**
   * 精灵图集
   */
  atlas: SpriteAtlas;
  /**
   * 当前帧索引
   */
  currentFrame: number;
  /**
   * 当前动画
   */
  currentAnimation?: string;
  /**
   * 精灵动画列表
   */
  animations?: SpriteAnimation[];
  /**
   * 状态机
   */
  stateMachine?: SpriteStateMachine;
  /**
   * 精灵对齐方式
   */
  alignment?: SpriteAlignment;
  /**
   * 是否自动播放
   */
  autoPlay?: boolean;
  /**
   * 播放速度
   */
  playbackSpeed?: number;
  /**
   * 是否像素完美
   */
  pixelPerfect?: boolean;
  /**
   * 每单位像素数
   */
  pixelsPerUnit?: number;
  /**
   * 是否广告牌模式
   */
  billboard?: boolean;
  /**
   * 九宫格配置（仅九宫格精灵使用）
   */
  nineSlice?: SpriteNineSliceConfig;
  /**
   * 平铺配置（仅平铺精灵使用）
   */
  tiling?: SpriteTilingConfig;
}

/**
 * 精灵九宫格配置
 */
export interface SpriteNineSliceConfig {
  /**
   * 左边距
   */
  left: number;
  /**
   * 右边距
   */
  right: number;
  /**
   * 顶部边距
   */
  top: number;
  /**
   * 底部边距
   */
  bottom: number;
  /**
   * 目标尺寸
   */
  targetSize: {
    width: number;
    height: number;
  };
  /**
   * 是否填充中心
   */
  fillCenter?: boolean;
}

/**
 * 精灵平铺配置
 */
export interface SpriteTilingConfig {
  /**
   * 平铺重复次数
   */
  repeat: {
    x: number;
    y: number;
  };
  /**
   * 平铺偏移
   */
  offset: {
    x: number;
    y: number;
  };
  /**
   * 平铺缩放
   */
  scale: {
    x: number;
    y: number;
  };
  /**
   * 包装模式
   */
  wrapMode: 'repeat' | 'clamp' | 'mirror';
  /**
   * 是否启用滚动
   */
  enableScroll?: boolean;
  /**
   * 滚动速度
   */
  scrollSpeed?: {
    x: number;
    y: number;
  };
}
