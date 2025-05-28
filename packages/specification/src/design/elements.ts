/**
 * Maxellabs 设计元素接口定义
 * 设计工具中的元素类型和属性
 */

// 从 core 模块导入基础类型
import type { Transform } from '../core/interfaces';

// 从 common 模块导入通用类型
import type { CommonBounds, CommonElement, OverflowMode } from '../common';
import type { ImageScaleMode, ImageFilter } from '../common/image';
import type { TextAlign, FontStyle, FontWeight, CommonTextStyle } from '../common/text';
import type { SpriteAtlas, SpriteAnimation } from '../common/sprite';

// 导入设计特定类型
import type { DesignConstraints, ComponentInstance } from './base';
import type { DesignStyle } from './styles';
import type { IconStyle } from './enums';
import type { ElementType } from '../core';

/**
 * 设计元素基础接口
 * 扩展通用元素接口，添加设计特定的属性
 */
export interface DesignElement extends Omit<CommonElement, 'type' | 'children' | 'constraints' | 'transform'> {
  /**
   * 元素类型（设计特定）
   */
  type: ElementType;
  /**
   * 位置和尺寸（设计特定的 bounds 而不是 transform）
   */
  bounds: CommonBounds;
  /**
   * 变换信息（可选，用于3D变换）
   */
  transform?: Transform;
  /**
   * 样式
   */
  style?: DesignStyle;
  /**
   * 约束（设计特定）
   */
  constraints?: DesignConstraints;
  /**
   * 子元素（设计特定）
   */
  children?: DesignElement[];
  /**
   * 组件实例
   */
  componentInstance?: ComponentInstance;
}

/**
 * 设计文本元素接口（扩展通用文本元素）
 */
export interface DesignTextElement extends DesignElement {
  type: ElementType.Text;
  /**
   * 文本内容
   */
  content: string;
  /**
   * 文本样式（使用通用文本样式）
   */
  textStyle?: CommonTextStyle;
  /**
   * 文本对齐（使用通用类型）
   */
  textAlign?: TextAlign;
  /**
   * 字体样式（使用通用类型）
   */
  fontStyle?: FontStyle;
  /**
   * 字体粗细（使用通用类型）
   */
  fontWeight?: FontWeight;
}

/**
 * 设计图像元素接口（扩展通用图像元素）
 */
export interface DesignImageElement extends DesignElement {
  type: ElementType.Image;
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
   * 设计特定的图像配置
   */
  designImageConfig?: DesignImageConfig;
}

/**
 * 设计特定的图像配置
 */
export interface DesignImageConfig {
  /**
   * 图像替换
   */
  imageReplacement?: string;
  /**
   * 图像库链接
   */
  libraryLink?: string;
  /**
   * 裁剪信息
   */
  cropInfo?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * 设计精灵元素接口（扩展通用精灵元素）
 */
export interface DesignSpriteElement extends DesignElement {
  type: ElementType.Sprite;
  /**
   * 纹理图集（使用通用类型）
   */
  atlas: SpriteAtlas;
  /**
   * 当前帧（使用数字索引）
   */
  currentFrame: number;
  /**
   * 动画配置（使用通用类型）
   */
  spriteAnimation?: SpriteAnimation;
}

/**
 * 设计图标元素接口
 */
export interface DesignIconElement extends DesignElement {
  type: ElementType.Icon;
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
 * 设计矢量元素接口
 */
export interface DesignVectorElement extends DesignElement {
  type: ElementType.Vector;
  /**
   * 路径数据
   */
  pathData: string;
  /**
   * 矢量配置
   */
  vectorConfig?: DesignVectorConfig;
}

/**
 * 设计矢量配置
 */
export interface DesignVectorConfig {
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
 * 设计组合元素接口
 */
export interface DesignGroupElement extends DesignElement {
  type: ElementType.Group;
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
 * 设计帧元素接口
 */
export interface DesignFrameElement extends DesignElement {
  type: ElementType.Frame;
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
