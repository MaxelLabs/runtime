/**
 * Maxellabs 设计模块统一导出
 * 提供设计系统的所有类型定义和接口
 */

// 只导出接口类型，避免重复
export type {
  DesignConstraints,
  ComponentInstance,
  DesignComponentProperty,
  DesignComponentVariant,
  DesignIconVariant,
  DesignIconCategory,
  DesignBounds,
} from './base';

// 只导出枚举值，一次性导出
export {
  DesignElementType,
  DesignConstraintType,
  ComponentPropertyType,
  IconStyle,
  StyleType,
  FillType,
  StrokeType,
  LineCap,
  LineJoin,
  ShadowType,
  BlurType,
  ImageScaleMode,
} from './enums';

// 向后兼容的别名导出
export type { DesignConstraintType as ConstraintType } from './enums';

// 设计元素
export * from './elements';

// 样式定义
export * from './styles';

// 字体排版
export * from './typography';

// 组件库
export * from './components';

// 图标库
export * from './icons';

// 颜色系统
export * from './colors';

// 间距和断点系统
export * from './spacing';

// 主题系统
export * from './themes';

// 页面管理
export * from './page';

// 资产管理
export * from './assets';

// 协作系统
export * from './collaboration';

// 设计系统核心
export * from './systems';

// 设计文档
export * from './document';
