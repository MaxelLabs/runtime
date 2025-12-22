/**
 * Maxellabs 通用精灵元素
 * 定义所有系统共通的精灵相关类型
 */

import type {
  ElementType,
  AnimationProperties,
  BaseAtlasRegion,
  BaseAtlasMetadata,
  Size2D,
  Nameable,
  Loopable,
} from '../core';
import type { CommonElement } from './elements';
import type { NineSliceConfig } from './image';
import type { AnimationStateMachine } from '../animation';

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
 *
 * @description 扩展 BaseAtlasRegion，添加精灵动画特有的 duration 和 sourceSize 字段
 */
export interface SpriteFrame extends BaseAtlasRegion {
  /**
   * 原始尺寸（使用 sourceSize 别名以保持向后兼容）
   */
  sourceSize?: Size2D;
  /**
   * 持续时间（用于动画，单位：秒）
   */
  duration?: number;
}

/**
 * 精灵图集
 */
export interface SpriteAtlas {
  /** 图集纹理路径 */
  texture: string;
  /** 图集尺寸 */
  size: Size2D;
  /** 帧列表 */
  frames: SpriteFrame[];
  /** 图集元数据 */
  metadata?: SpriteAtlasMetadata;
}

/**
 * 精灵图集元数据
 *
 * @description 扩展 BaseAtlasMetadata，添加精灵图集特有的字段
 */
export interface SpriteAtlasMetadata extends BaseAtlasMetadata {
  /** 每行帧数 */
  framesPerRow?: number;
  /** 总帧数 */
  totalFrames?: number;
  /** 创建时间 */
  createdAt?: string;
}

/**
 * 精灵动画
 *
 * @description 组合 Nameable, Loopable traits
 */
export interface SpriteAnimation extends Nameable, Loopable {
  /**
   * 帧序列（帧索引）
   */
  frames: number[];
  /**
   * 帧率
   */
  frameRate: number;
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
 * 通用精灵元素
 */
export interface CommonSpriteElement extends CommonElement {
  type: ElementType.Sprite;
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
  stateMachine?: AnimationStateMachine;
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
 * 精灵九宫格配置（扩展通用NineSliceConfig）
 */
export interface SpriteNineSliceConfig extends NineSliceConfig {
  /** 目标尺寸 */
  targetSize: Size2D;
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
