/**
 * Maxellabs 设计模块枚举定义
 * 设计系统相关的枚举类型
 */
// 重新导出 common 中的类型
export { ImageScaleMode } from '../common/image';

/**
 * 设计元素类型
 */
export enum DesignElementType {
  Frame = 'frame',
  Group = 'group',
  Rectangle = 'rectangle',
  Ellipse = 'ellipse',
  Polygon = 'polygon',
  Star = 'star',
  Vector = 'vector',
  Text = 'text',
  Image = 'image',
  Component = 'component',
  Instance = 'instance',
  Line = 'line',
  Arrow = 'arrow',
  Sprite = 'sprite',
  Icon = 'icon',
}

/**
 * 设计约束类型 (设计特定的约束类型)
 */
export enum DesignConstraintType {
  Left = 'left',
  Right = 'right',
  Center = 'center',
  LeftRight = 'left-right',
  Scale = 'scale',
  Top = 'top',
  Bottom = 'bottom',
  TopBottom = 'top-bottom',
}

/**
 * 组件属性类型
 */
export enum ComponentPropertyType {
  Boolean = 'boolean',
  Text = 'text',
  InstanceSwap = 'instance-swap',
  Variant = 'variant',
}

/**
 * 图标样式
 */
export enum IconStyle {
  Outline = 'outline',
  Filled = 'filled',
  Duotone = 'duotone',
  Light = 'light',
  Bold = 'bold',
}

/**
 * 样式类型
 */
export enum StyleType {
  Fill = 'fill',
  Stroke = 'stroke',
  Text = 'text',
  Shadow = 'shadow',
  Blur = 'blur',
}

/**
 * 填充类型
 */
export enum FillType {
  Solid = 'solid',
  Gradient = 'gradient',
  Image = 'image',
  Video = 'video',
}

/**
 * 描边类型
 */
export enum StrokeType {
  Solid = 'solid',
  Gradient = 'gradient',
}

/**
 * 线帽样式
 */
export enum LineCap {
  Butt = 'butt',
  Round = 'round',
  Square = 'square',
}

/**
 * 线连接样式
 */
export enum LineJoin {
  Miter = 'miter',
  Round = 'round',
  Bevel = 'bevel',
}

/**
 * 阴影类型
 */
export enum DesignShadowType {
  Drop = 'drop',
  Inner = 'inner',
}

/**
 * 模糊类型
 */
export enum BlurType {
  Layer = 'layer',
  Background = 'background',
}
