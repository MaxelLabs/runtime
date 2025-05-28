/**
 * Maxellabs 设计元素接口定义
 * 设计工具中的元素类型和属性
 */

import type { BlendMode } from '../core/enums';
import type {
  Transform,
  AnimationProperties,
  InteractionProperties,
  MaterialProperties,
  RenderingProperties,
  CommonMetadata,
} from '../core/interfaces';
import type { CommonElement, CommonElementType, ImageScaleMode, ImageFilter, OverflowMode } from '../common';
import type { TextStyle } from '../media';
import type { DesignElementType, DesignBounds, DesignConstraints, ComponentInstance, IconStyle } from './base';
import type { DesignStyle } from './styles';

/**
 * 设计精灵图集
 */
export interface DesignSpriteAtlas {
  /**
   * 图集纹理
   */
  texture: string;
  /**
   * 帧定义
   */
  frames: DesignSpriteFrame[];
  /**
   * 图集元数据
   */
  metadata?: DesignSpriteAtlasMetadata;
}

/**
 * 设计精灵帧
 */
export interface DesignSpriteFrame {
  /**
   * 帧名称
   */
  name: string;
  /**
   * 在图集中的位置
   */
  x: number;
  y: number;
  /**
   * 帧尺寸
   */
  width: number;
  height: number;
  /**
   * 是否旋转
   */
  rotated?: boolean;
  /**
   * 修剪信息
   */
  trimmed?: boolean;
  /**
   * 原始尺寸
   */
  sourceSize?: { w: number; h: number };
}

/**
 * 设计精灵图集元数据
 */
export interface DesignSpriteAtlasMetadata {
  /**
   * 应用程序
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
   * 图集尺寸
   */
  size: { w: number; h: number };
  /**
   * 缩放
   */
  scale: number;
}

/**
 * 设计精灵动画
 */
export interface DesignSpriteAnimation {
  /**
   * 动画名称
   */
  name: string;
  /**
   * 帧序列
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
   * 动画属性
   */
  properties?: AnimationProperties;
}

/**
 * 设计元素基础接口
 * 扩展通用元素接口，添加设计特定的属性
 */
export interface DesignElement extends Omit<CommonElement, 'type' | 'children' | 'constraints'> {
  /**
   * 元素类型（设计特定）
   */
  type: DesignElementType;
  /**
   * 位置和尺寸（设计特定）
   */
  bounds: DesignBounds;
  /**
   * 样式
   */
  style?: DesignStyle;
  /**
   * 约束（设计特定）
   */
  constraints?: DesignConstraints;
  /**
   * 子元素
   */
  children?: DesignElement[];
  /**
   * 组件实例
   */
  componentInstance?: ComponentInstance;
}

/**
 * 文本元素接口
 */
export interface TextElement extends DesignElement {
  type: DesignElementType.Text;
  /**
   * 文本内容
   */
  content: string;
  /**
   * 文本样式
   */
  textStyle?: TextStyle;
}

/**
 * 图像元素接口
 */
export interface ImageElement extends DesignElement {
  type: DesignElementType.Image;
  /**
   * 图像源
   */
  source: string;
  /**
   * 缩放模式（使用通用类型）
   */
  scaleMode: ImageScaleMode;
  /**
   * 图像滤镜（使用通用类型）
   */
  filters?: ImageFilter[];
  /**
   * 图像配置
   */
  imageConfig?: any; // 将在styles.ts中定义具体类型
}

/**
 * 图像滤镜
 */
export interface DesignImageFilter {
  /**
   * 滤镜类型
   */
  type: ImageFilterType;
  /**
   * 滤镜值
   */
  value: number;
}

/**
 * 图像滤镜类型
 */
export enum ImageFilterType {
  Exposure = 'exposure',
  Contrast = 'contrast',
  Saturation = 'saturation',
  Temperature = 'temperature',
  Tint = 'tint',
  Highlights = 'highlights',
  Shadows = 'shadows',
}

/**
 * 精灵元素接口
 */
export interface SpriteElement extends DesignElement {
  type: DesignElementType.Sprite;
  /**
   * 纹理图集（设计特定）
   */
  atlas: DesignSpriteAtlas;
  /**
   * 当前帧
   */
  currentFrame: number;
  /**
   * 动画配置（设计特定）
   */
  spriteAnimation?: DesignSpriteAnimation;
}

/**
 * 图标元素接口
 */
export interface IconElement extends DesignElement {
  type: DesignElementType.Icon;
  /**
   * 图标名称
   */
  iconName: string;
  /**
   * 图标库
   */
  iconLibrary?: string;
  /**
   * 图标样式
   */
  iconStyle?: IconStyle;
  /**
   * SVG 数据
   */
  svgData?: string;
}

/**
 * 矢量元素接口
 */
export interface VectorElement extends DesignElement {
  type: DesignElementType.Vector;
  /**
   * 路径数据
   */
  pathData: string;
  /**
   * 矢量配置
   */
  vectorConfig?: VectorConfig;
}

/**
 * 矢量配置
 */
export interface VectorConfig {
  /**
   * 闭合路径
   */
  closed: boolean;
  /**
   * 路径方向
   */
  clockwise?: boolean;
  /**
   * 路径精度
   */
  precision?: number;
}

/**
 * 组元素接口
 */
export interface GroupElement extends DesignElement {
  type: DesignElementType.Group;
  /**
   * 剪切路径
   */
  clipPath?: string;
  /**
   * 蒙版模式
   */
  maskMode?: string;
}

/**
 * 帧元素接口
 */
export interface FrameElement extends DesignElement {
  type: DesignElementType.Frame;
  /**
   * 背景
   */
  background?: any; // 将在styles.ts中定义具体类型
  /**
   * 溢出处理（使用通用类型）
   */
  overflow?: OverflowMode;
  /**
   * 裁剪内容
   */
  clipContent?: boolean;
}
