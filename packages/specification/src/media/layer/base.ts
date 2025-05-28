/**
 * Maxellabs 图层基础规范
 * 图层基础类型定义
 */

import type { UsdPrim, UsdValue } from '../../core/usd';
import type { BlendMode } from '../../core/enums';
import type { StrokeStyle } from '../layer';

/**
 * 图层基础接口
 */
export interface LayerPrim extends UsdPrim {
  typeName: 'Layer';
}

/**
 * 图层类型
 */
export enum LayerType {
  /**
   * 普通图层
   */
  Normal = 'normal',
  /**
   * 组图层
   */
  Group = 'group',
  /**
   * 文本图层
   */
  Text = 'text',
  /**
   * 形状图层
   */
  Shape = 'shape',
  /**
   * 图像图层
   */
  Image = 'image',
  /**
   * 调整图层
   */
  Adjustment = 'adjustment',
  /**
   * 填充图层
   */
  Fill = 'fill',
  /**
   * 智能对象
   */
  SmartObject = 'smart-object',
  /**
   * 视频图层
   */
  Video = 'video',
  /**
   * 3D图层
   */
  ThreeD = '3d',
}

/**
 * 图层
 */
export interface Layer extends LayerPrim {
  attributes: {
    /**
     * 图层名称
     */
    name: UsdValue; // string
    /**
     * 图层类型
     */
    type: UsdValue; // LayerType
    /**
     * 是否可见
     */
    visible: UsdValue; // bool
    /**
     * 是否锁定
     */
    locked: UsdValue; // bool
    /**
     * 透明度 (0-1)
     */
    opacity: UsdValue; // float
    /**
     * 混合模式（使用统一BlendMode）
     */
    blendMode: UsdValue; // BlendMode
    /**
     * 图层顺序
     */
    zIndex: UsdValue; // int
  };
  /**
   * 图层变换
   */
  transform: LayerTransform;
  /**
   * 图层样式
   */
  style?: LayerStyle;
  /**
   * 图层蒙版
   */
  mask?: LayerMask;
  /**
   * 图层效果
   */
  effects?: LayerEffect[];
  /**
   * 子图层
   */
  children: Layer[];
  /**
   * 图层内容
   */
  content?: LayerContent;
}

/**
 * 图层变换
 */
export interface LayerTransform {
  /**
   * 位置
   */
  position: {
    x: number;
    y: number;
    z?: number;
  };
  /**
   * 旋转
   */
  rotation: {
    x?: number;
    y?: number;
    z: number;
  };
  /**
   * 缩放
   */
  scale: {
    x: number;
    y: number;
    z?: number;
  };
  /**
   * 锚点
   */
  anchor: {
    x: number;
    y: number;
    z?: number;
  };
  /**
   * 倾斜
   */
  skew?: {
    x: number;
    y: number;
  };
  /**
   * 透视
   */
  perspective?: number;
}

/**
 * 图层样式
 */
export interface LayerStyle {
  /**
   * 投影
   */
  dropShadow?: DropShadowStyle;
  /**
   * 内阴影
   */
  innerShadow?: InnerShadowStyle;
  /**
   * 外发光
   */
  outerGlow?: OuterGlowStyle;
  /**
   * 内发光
   */
  innerGlow?: InnerGlowStyle;
  /**
   * 斜面和浮雕
   */
  bevelEmboss?: BevelEmbossStyle;
  /**
   * 光泽
   */
  satin?: SatinStyle;
  /**
   * 颜色叠加
   */
  colorOverlay?: ColorOverlayStyle;
  /**
   * 渐变叠加
   */
  gradientOverlay?: GradientOverlayStyle;
  /**
   * 图案叠加
   */
  patternOverlay?: PatternOverlayStyle;
  /**
   * 描边
   */
  stroke?: StrokeStyle;
}

/**
 * 投影样式
 */
export interface DropShadowStyle {
  /**
   * 启用
   */
  enabled: boolean;
  /**
   * 混合模式（使用统一BlendMode）
   */
  blendMode: BlendMode;
  /**
   * 颜色
   */
  color: [number, number, number, number];
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 角度
   */
  angle: number;
  /**
   * 距离
   */
  distance: number;
  /**
   * 扩展
   */
  spread: number;
  /**
   * 大小
   */
  size: number;
  /**
   * 轮廓
   */
  contour?: ContourCurve;
  /**
   * 抗锯齿
   */
  antiAliased: boolean;
  /**
   * 噪点
   */
  noise: number;
  /**
   * 图层挖空投影
   */
  layerKnocksOutDropShadow: boolean;
}

/**
 * 内阴影样式
 */
export interface InnerShadowStyle {
  /**
   * 启用
   */
  enabled: boolean;
  /**
   * 混合模式（使用统一BlendMode）
   */
  blendMode: BlendMode;
  /**
   * 颜色
   */
  color: [number, number, number, number];
  /**
   * 透明度
   */
  opacity: number;
  /**
   * 角度
   */
  angle: number;
  /**
   * 距离
   */
  distance: number;
  /**
   * 阻塞
   */
  choke: number;
  /**
   * 大小
   */
  size: number;
  /**
   * 轮廓
   */
  contour?: ContourCurve;
  /**
   * 抗锯齿
   */
  antiAliased: boolean;
  /**
   * 噪点
   */
  noise: number;
}

/**
 * 轮廓曲线
 */
export interface ContourCurve {
  /**
   * 曲线点
   */
  points: ContourPoint[];
  /**
   * 抗锯齿
   */
  antiAliased: boolean;
}

/**
 * 轮廓点
 */
export interface ContourPoint {
  /**
   * 输入值 (0-1)
   */
  input: number;
  /**
   * 输出值 (0-1)
   */
  output: number;
  /**
   * 连续性
   */
  continuity: boolean;
}

// Forward declarations for types defined in other files
export interface OuterGlowStyle {
  enabled: boolean;
  blendMode: BlendMode;
}

export interface InnerGlowStyle {
  enabled: boolean;
  blendMode: BlendMode;
}

export interface BevelEmbossStyle {
  enabled: boolean;
}

export interface SatinStyle {
  enabled: boolean;
  blendMode: BlendMode;
}

export interface ColorOverlayStyle {
  enabled: boolean;
  blendMode: BlendMode;
}

export interface GradientOverlayStyle {
  enabled: boolean;
  blendMode: BlendMode;
}

export interface PatternOverlayStyle {
  enabled: boolean;
  blendMode: BlendMode;
}

export interface LayerMask {
  type: string;
  enabled: boolean;
}

export interface LayerEffect {
  type: string;
  enabled: boolean;
}

export interface LayerContent {
  type: string;
  data: any;
}
