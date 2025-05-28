/**
 * Maxellabs 设计页面定义
 * 包含页面、画板、网格和指南相关类型
 */

import type { CommonBounds } from '../common';
import type { GradientStop, GradientType } from '../core';
import type { DesignElement } from './elements';

/**
 * 设计页面
 */
export interface DesignPage {
  /**
   * 页面 ID
   */
  id: string;
  /**
   * 页面名称
   */
  name: string;
  /**
   * 页面类型
   */
  type: PageType;
  /**
   * 画布尺寸
   */
  canvasSize: CanvasSize;
  /**
   * 页面元素
   */
  elements: DesignElement[];
  /**
   * 页面配置
   */
  config?: PageConfig;
  /**
   * 页面背景
   */
  background?: PageBackground;
  /**
   * 页面网格
   */
  grid?: PageGrid;
  /**
   * 页面指南
   */
  guides?: PageGuide[];
  /**
   * 页面注释
   */
  annotations?: PageAnnotation[];
}

/**
 * 页面类型
 */
export enum PageType {
  Page = 'page',
  Artboard = 'artboard',
  Frame = 'frame',
  Symbol = 'symbol',
  Master = 'master',
  Template = 'template',
}

/**
 * 画布尺寸
 */
export interface CanvasSize {
  /**
   * 宽度
   */
  width: number;
  /**
   * 高度
   */
  height: number;
  /**
   * 单位
   */
  unit: SizeUnit;
  /**
   * 设备预设
   */
  devicePreset?: DevicePreset;
}

/**
 * 尺寸单位
 */
export enum SizeUnit {
  Pixel = 'px',
  Point = 'pt',
  Inch = 'in',
  Centimeter = 'cm',
  Millimeter = 'mm',
}

/**
 * 设备预设
 */
export enum DevicePreset {
  Desktop = 'desktop',
  Tablet = 'tablet',
  Mobile = 'mobile',
  iPhone = 'iphone',
  iPad = 'ipad',
  Android = 'android',
  Custom = 'custom',
}

/**
 * 页面配置
 */
export interface PageConfig {
  /**
   * 缩放级别
   */
  zoom?: number;
  /**
   * 视口位置
   */
  viewport?: ViewportPosition;
  /**
   * 是否显示网格
   */
  showGrid?: boolean;
  /**
   * 是否显示标尺
   */
  showRulers?: boolean;
  /**
   * 是否显示指南
   */
  showGuides?: boolean;
  /**
   * 捕捉设置
   */
  snap?: SnapSettings;
}

/**
 * 视口位置
 */
export interface ViewportPosition {
  /**
   * X 坐标
   */
  x: number;
  /**
   * Y 坐标
   */
  y: number;
  /**
   * 缩放级别
   */
  zoom: number;
}

/**
 * 捕捉设置
 */
export interface SnapSettings {
  /**
   * 是否启用网格捕捉
   */
  grid?: boolean;
  /**
   * 是否启用对象捕捉
   */
  objects?: boolean;
  /**
   * 是否启用像素捕捉
   */
  pixels?: boolean;
  /**
   * 捕捉距离
   */
  distance?: number;
}

/**
 * 页面背景
 */
export interface PageBackground {
  /**
   * 背景类型
   */
  type: BackgroundType;
  /**
   * 背景颜色
   */
  color?: string;
  /**
   * 背景图像
   */
  image?: BackgroundImage;
  /**
   * 背景渐变
   */
  gradient?: BackgroundGradient;
}

/**
 * 背景类型
 */
export enum BackgroundType {
  Color = 'color',
  Image = 'image',
  Gradient = 'gradient',
  None = 'none',
}

/**
 * 背景图像
 */
export interface BackgroundImage {
  /**
   * 图像URL
   */
  url: string;
  /**
   * 显示模式
   */
  mode: ImageDisplayMode;
  /**
   * 透明度
   */
  opacity?: number;
}

/**
 * 图像显示模式
 */
export enum ImageDisplayMode {
  Stretch = 'stretch',
  Repeat = 'repeat',
  Fit = 'fit',
  Fill = 'fill',
  Center = 'center',
}

/**
 * 背景渐变
 */
export interface BackgroundGradient {
  /**
   * 渐变类型
   */
  type: GradientType;
  /**
   * 渐变停止点
   */
  stops: GradientStop[];
}

/**
 * 页面网格
 */
export interface PageGrid {
  /**
   * 网格类型
   */
  type: GridType;
  /**
   * 网格尺寸
   */
  size: number;
  /**
   * 网格颜色
   */
  color?: string;
  /**
   * 网格透明度
   */
  opacity?: number;
  /**
   * 是否可见
   */
  visible?: boolean;
}

/**
 * 网格类型
 */
export enum GridType {
  Square = 'square',
  Lines = 'lines',
  Dots = 'dots',
  Columns = 'columns',
}

/**
 * 页面指南
 */
export interface PageGuide {
  /**
   * 指南 ID
   */
  id: string;
  /**
   * 指南类型
   */
  type: GuideType;
  /**
   * 位置
   */
  position: number;
  /**
   * 颜色
   */
  color?: string;
  /**
   * 是否锁定
   */
  locked?: boolean;
}

/**
 * 指南类型
 */
export enum GuideType {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

/**
 * 页面注释
 */
export interface PageAnnotation {
  /**
   * 注释 ID
   */
  id: string;
  /**
   * 注释内容
   */
  content: string;
  /**
   * 注释位置
   */
  position: CommonBounds;
  /**
   * 注释类型
   */
  type: AnnotationType;
  /**
   * 作者
   */
  author?: string;
  /**
   * 创建时间
   */
  createdAt?: string;
  /**
   * 是否已解决
   */
  resolved?: boolean;
}

/**
 * 注释类型
 */
export enum AnnotationType {
  Comment = 'comment',
  Feedback = 'feedback',
  Todo = 'todo',
  Bug = 'bug',
  Question = 'question',
}
