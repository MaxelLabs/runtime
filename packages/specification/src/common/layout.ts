/**
 * Layout System Specification
 * 布局系统规范定义
 *
 * @packageDocumentation
 *
 * @remarks
 * 定义通用的布局接口，支持：
 * - 尺寸约束（min/max/preferred）
 * - 锚点定位（相对于父级）
 * - 边距/内边距
 * - Flexbox 布局
 *
 * 这些接口可被 Core（运行时布局）和 Design（设计工具）模块共同使用。
 */

// ============================================================================
// 尺寸约束
// ============================================================================

/**
 * 尺寸约束接口
 * @description 定义元素的尺寸限制
 */
export interface ISizeConstraint {
  /** 最小宽度 */
  minWidth?: number;
  /** 最大宽度 */
  maxWidth?: number;
  /** 最小高度 */
  minHeight?: number;
  /** 最大高度 */
  maxHeight?: number;
  /** 首选宽度 */
  preferredWidth?: number;
  /** 首选高度 */
  preferredHeight?: number;
}

// ============================================================================
// 锚点定位
// ============================================================================

/**
 * 锚点配置接口
 * @description 值范围 0-1，表示相对于父级的位置
 */
export interface IAnchor {
  /** 锚点最小 X (左边界) */
  minX: number;
  /** 锚点最大 X (右边界) */
  maxX: number;
  /** 锚点最小 Y (下边界) */
  minY: number;
  /** 锚点最大 Y (上边界) */
  maxY: number;
}

// ============================================================================
// 边距
// ============================================================================

/**
 * 边距/内边距接口
 * @description 定义四个方向的边距值
 */
export interface IEdgeInsets {
  /** 上边距 */
  top: number;
  /** 右边距 */
  right: number;
  /** 下边距 */
  bottom: number;
  /** 左边距 */
  left: number;
}

// ============================================================================
// Flexbox 布局类型
// ============================================================================

/**
 * Flex 主轴方向
 */
export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';

/**
 * Flex 交叉轴对齐方式
 */
export type FlexAlign = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';

/**
 * Flex 主轴对齐方式
 */
export type FlexJustify = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';

/**
 * Flex 换行模式
 */
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

// ============================================================================
// Flexbox 容器和子项
// ============================================================================

/**
 * Flex 容器接口
 * @description 定义 Flexbox 容器的布局属性
 */
export interface IFlexContainer {
  /** 主轴方向 */
  direction: FlexDirection;
  /** 换行模式 */
  wrap: FlexWrap;
  /** 主轴对齐 */
  justifyContent: FlexJustify;
  /** 交叉轴对齐 */
  alignItems: FlexAlign;
  /** 多行对齐（仅在 wrap 时生效） */
  alignContent?: FlexAlign;
  /** 子项间距 */
  gap?: number;
  /** 行间距（仅在 wrap 时生效） */
  rowGap?: number;
  /** 列间距 */
  columnGap?: number;
}

/**
 * Flex 子项接口
 * @description 定义 Flexbox 子项的布局属性
 */
export interface IFlexItem {
  /** 伸展比例（占据剩余空间的比例） */
  grow: number;
  /** 收缩比例（空间不足时的收缩比例） */
  shrink: number;
  /** 基础尺寸 */
  basis: number | 'auto';
  /** 自身对齐方式（覆盖容器的 alignItems） */
  alignSelf?: FlexAlign | 'auto';
  /** 排序权重 */
  order?: number;
}

// ============================================================================
// 布局结果
// ============================================================================

/**
 * 计算后的布局结果接口
 * @description 存储布局系统计算后的位置和尺寸
 */
export interface ILayoutResult {
  /** 计算后的 X 坐标（相对于父级） */
  x: number;
  /** 计算后的 Y 坐标（相对于父级） */
  y: number;
  /** 计算后的宽度 */
  width: number;
  /** 计算后的高度 */
  height: number;
}

// ============================================================================
// 布局数据（用于序列化）
// ============================================================================

/**
 * 布局组件数据接口
 * @description 用于场景序列化的布局数据
 */
export interface ILayoutData {
  /** 尺寸约束 */
  sizeConstraint?: ISizeConstraint;
  /** 锚点配置 */
  anchor?: IAnchor;
  /** 外边距 */
  margin?: IEdgeInsets;
  /** 内边距 */
  padding?: IEdgeInsets;
  /** Flex 容器配置 */
  flexContainer?: IFlexContainer;
  /** Flex 子项配置 */
  flexItem?: IFlexItem;
}
