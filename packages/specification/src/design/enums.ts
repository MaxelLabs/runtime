/**
 * Maxellabs 设计模块枚举定义
 * 设计系统特有的枚举类型
 */

// 从core导入通用类型

// 重新导出 common 中的类型

/**
 * 组件属性类型（设计特有）
 */
export enum ComponentPropertyType {
  Boolean = 'boolean',
  Text = 'text',
  InstanceSwap = 'instance-swap',
  Variant = 'variant',
}

/**
 * 图标样式（设计特有）
 */
export enum IconStyle {
  Outline = 'outline',
  Filled = 'filled',
  Duotone = 'duotone',
  Light = 'light',
  Bold = 'bold',
}

/**
 * 填充类型（设计特有）
 */
export enum FillType {
  Solid = 'solid',
  Gradient = 'gradient',
  Image = 'image',
  Video = 'video',
}

/**
 * 描边类型（设计特有）
 */
export enum StrokeType {
  Solid = 'solid',
  Gradient = 'gradient',
}

/**
 * 阴影类型（设计特有）
 */
export enum DesignShadowType {
  Drop = 'drop',
  Inner = 'inner',
}

/**
 * 模糊类型（设计特有）
 */
export enum BlurType {
  Layer = 'layer',
  Background = 'background',
}
