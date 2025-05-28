/**
 * Maxellabs 图层规范 - 导出索引
 * 统一导出图层相关的所有类型定义
 */

// 基础类型
export * from './base';

// 重新导出常用类型组合
export type {
  // 基础接口
  LayerPrim,
  Layer,
  LayerTransform,
  LayerStyle,
  LayerMask,
  LayerEffect,
  LayerContent,

  // 样式
  DropShadowStyle,
  InnerShadowStyle,
  OuterGlowStyle,
  InnerGlowStyle,
  BevelEmbossStyle,
  SatinStyle,
  ColorOverlayStyle,
  GradientOverlayStyle,
  PatternOverlayStyle,

  // 辅助类型
  ContourCurve,
  ContourPoint,

  // 枚举
  LayerType,
} from './base';
