/**
 * Layout Components
 * 布局相关的数据组件
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计决策
 *
 * 布局组件用于 UI 元素的定位和尺寸计算。
 * 支持以下布局模式：
 * - **约束布局**：通过 min/max 尺寸和锚点定位
 * - **Flex 布局**：Flexbox 风格的容器和子项
 *
 * 所有组件都继承自 Component 基类，提供：
 * - 引用计数管理（继承自 ReferResource）
 * - 组件启用/禁用状态
 * - 组件脏标记（用于优化更新）
 *
 * ## 类型来源
 *
 * 布局接口定义来自 @maxellabs/specification：
 * - ISizeConstraint: 尺寸约束接口
 * - IAnchor: 锚点配置接口
 * - IEdgeInsets: 边距接口
 * - IFlexContainer: Flex 容器接口
 * - IFlexItem: Flex 子项接口
 * - ILayoutResult: 布局结果接口
 */

import { Component } from '../base';
import type {
  ISizeConstraint,
  IAnchor,
  IEdgeInsets,
  IFlexContainer,
  IFlexItem,
  ILayoutResult,
  FlexDirection,
  FlexAlign,
  FlexJustify,
  FlexWrap,
} from '@maxellabs/specification';

// ============ 布局组件 ============

/**
 * SizeConstraint Component - 尺寸约束组件
 * @description 定义元素的尺寸限制
 */
export class SizeConstraint extends Component implements ISizeConstraint {
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

  /**
   * 从规范数据创建组件
   */
  static fromData(data: ISizeConstraint): SizeConstraint {
    const component = new SizeConstraint();
    if (data.minWidth !== undefined) {
      component.minWidth = data.minWidth;
    }
    if (data.maxWidth !== undefined) {
      component.maxWidth = data.maxWidth;
    }
    if (data.minHeight !== undefined) {
      component.minHeight = data.minHeight;
    }
    if (data.maxHeight !== undefined) {
      component.maxHeight = data.maxHeight;
    }
    if (data.preferredWidth !== undefined) {
      component.preferredWidth = data.preferredWidth;
    }
    if (data.preferredHeight !== undefined) {
      component.preferredHeight = data.preferredHeight;
    }
    return component;
  }

  /**
   * 克隆组件
   */
  override clone(): SizeConstraint {
    const cloned = new SizeConstraint();
    if (this.minWidth !== undefined) {
      cloned.minWidth = this.minWidth;
    }
    if (this.maxWidth !== undefined) {
      cloned.maxWidth = this.maxWidth;
    }
    if (this.minHeight !== undefined) {
      cloned.minHeight = this.minHeight;
    }
    if (this.maxHeight !== undefined) {
      cloned.maxHeight = this.maxHeight;
    }
    if (this.preferredWidth !== undefined) {
      cloned.preferredWidth = this.preferredWidth;
    }
    if (this.preferredHeight !== undefined) {
      cloned.preferredHeight = this.preferredHeight;
    }
    return cloned;
  }
}

/**
 * Anchor Component - 锚点组件
 * @description 定义元素相对于父级的锚定方式
 */
export class Anchor extends Component implements IAnchor {
  /** 锚点最小 X (左边界)，默认 0.5 (居中) */
  minX: number = 0.5;
  /** 锚点最大 X (右边界)，默认 0.5 (居中) */
  maxX: number = 0.5;
  /** 锚点最小 Y (下边界)，默认 0.5 (居中) */
  minY: number = 0.5;
  /** 锚点最大 Y (上边界)，默认 0.5 (居中) */
  maxY: number = 0.5;

  /**
   * 从规范数据创建组件
   */
  static fromData(data: IAnchor): Anchor {
    const component = new Anchor();
    component.minX = data.minX;
    component.maxX = data.maxX;
    component.minY = data.minY;
    component.maxY = data.maxY;
    return component;
  }

  /**
   * 克隆组件
   */
  override clone(): Anchor {
    const cloned = new Anchor();
    cloned.minX = this.minX;
    cloned.maxX = this.maxX;
    cloned.minY = this.minY;
    cloned.maxY = this.maxY;
    return cloned;
  }

  /**
   * 设置为拉伸（填满父级）
   */
  setStretch(): this {
    this.minX = 0;
    this.maxX = 1;
    this.minY = 0;
    this.maxY = 1;
    this.markDirty();
    return this;
  }

  /**
   * 设置为居中
   */
  setCenter(): this {
    this.minX = 0.5;
    this.maxX = 0.5;
    this.minY = 0.5;
    this.maxY = 0.5;
    this.markDirty();
    return this;
  }
}

/**
 * Margin Component - 外边距组件
 */
export class Margin extends Component implements IEdgeInsets {
  top: number = 0;
  right: number = 0;
  bottom: number = 0;
  left: number = 0;

  /**
   * 从规范数据创建组件
   */
  static fromData(data: IEdgeInsets): Margin {
    const component = new Margin();
    component.top = data.top;
    component.right = data.right;
    component.bottom = data.bottom;
    component.left = data.left;
    return component;
  }

  /**
   * 克隆组件
   */
  override clone(): Margin {
    const cloned = new Margin();
    cloned.top = this.top;
    cloned.right = this.right;
    cloned.bottom = this.bottom;
    cloned.left = this.left;
    return cloned;
  }

  /**
   * 设置统一边距
   */
  setAll(value: number): this {
    this.top = value;
    this.right = value;
    this.bottom = value;
    this.left = value;
    this.markDirty();
    return this;
  }
}

/**
 * Padding Component - 内边距组件
 */
export class Padding extends Component implements IEdgeInsets {
  top: number = 0;
  right: number = 0;
  bottom: number = 0;
  left: number = 0;

  /**
   * 从规范数据创建组件
   */
  static fromData(data: IEdgeInsets): Padding {
    const component = new Padding();
    component.top = data.top;
    component.right = data.right;
    component.bottom = data.bottom;
    component.left = data.left;
    return component;
  }

  /**
   * 克隆组件
   */
  override clone(): Padding {
    const cloned = new Padding();
    cloned.top = this.top;
    cloned.right = this.right;
    cloned.bottom = this.bottom;
    cloned.left = this.left;
    return cloned;
  }

  /**
   * 设置统一内边距
   */
  setAll(value: number): this {
    this.top = value;
    this.right = value;
    this.bottom = value;
    this.left = value;
    this.markDirty();
    return this;
  }
}

/**
 * FlexContainer Component - Flex 容器组件
 * @description 标记元素为 Flex 容器，定义子元素的布局方式
 */
export class FlexContainer extends Component implements IFlexContainer {
  /** 主轴方向 */
  direction: FlexDirection = 'row';
  /** 换行模式 */
  wrap: FlexWrap = 'nowrap';
  /** 主轴对齐 */
  justifyContent: FlexJustify = 'flex-start';
  /** 交叉轴对齐 */
  alignItems: FlexAlign = 'stretch';
  /** 多行对齐 */
  alignContent?: FlexAlign;
  /** 子项间距（统一间距，同时应用于行和列） */
  gap?: number;
  /** 行间距（交叉轴方向的间距） */
  rowGap?: number;
  /** 列间距（主轴方向的间距） */
  columnGap?: number;

  /**
   * 从规范数据创建组件
   */
  static fromData(data: IFlexContainer): FlexContainer {
    const component = new FlexContainer();
    component.direction = data.direction;
    component.wrap = data.wrap;
    component.justifyContent = data.justifyContent;
    component.alignItems = data.alignItems;
    if (data.alignContent !== undefined) {
      component.alignContent = data.alignContent;
    }
    if (data.gap !== undefined) {
      component.gap = data.gap;
    }
    if (data.rowGap !== undefined) {
      component.rowGap = data.rowGap;
    }
    if (data.columnGap !== undefined) {
      component.columnGap = data.columnGap;
    }
    return component;
  }

  /**
   * 克隆组件
   */
  override clone(): FlexContainer {
    const cloned = new FlexContainer();
    cloned.direction = this.direction;
    cloned.wrap = this.wrap;
    cloned.justifyContent = this.justifyContent;
    cloned.alignItems = this.alignItems;
    if (this.alignContent !== undefined) {
      cloned.alignContent = this.alignContent;
    }
    if (this.gap !== undefined) {
      cloned.gap = this.gap;
    }
    if (this.rowGap !== undefined) {
      cloned.rowGap = this.rowGap;
    }
    if (this.columnGap !== undefined) {
      cloned.columnGap = this.columnGap;
    }
    return cloned;
  }

  /**
   * 获取实际的行间距
   * @returns 行间距值，如果未设置则回退到 gap
   */
  getRowGap(): number {
    return this.rowGap ?? this.gap ?? 0;
  }

  /**
   * 获取实际的列间距
   * @returns 列间距值，如果未设置则回退到 gap
   */
  getColumnGap(): number {
    return this.columnGap ?? this.gap ?? 0;
  }
}

/**
 * FlexItem Component - Flex 子项组件
 * @description 定义元素作为 Flex 子项的行为
 */
export class FlexItem extends Component implements IFlexItem {
  /** 伸展比例 */
  grow: number = 0;
  /** 收缩比例 */
  shrink: number = 1;
  /** 基础尺寸 */
  basis: number | 'auto' = 'auto';
  /** 自身对齐方式 */
  alignSelf?: FlexAlign | 'auto';
  /** 排序权重 */
  order?: number;

  /**
   * 从规范数据创建组件
   */
  static fromData(data: IFlexItem): FlexItem {
    const component = new FlexItem();
    component.grow = data.grow;
    component.shrink = data.shrink;
    component.basis = data.basis;
    if (data.alignSelf !== undefined) {
      component.alignSelf = data.alignSelf;
    }
    if (data.order !== undefined) {
      component.order = data.order;
    }
    return component;
  }

  /**
   * 克隆组件
   */
  override clone(): FlexItem {
    const cloned = new FlexItem();
    cloned.grow = this.grow;
    cloned.shrink = this.shrink;
    cloned.basis = this.basis;
    if (this.alignSelf !== undefined) {
      cloned.alignSelf = this.alignSelf;
    }
    if (this.order !== undefined) {
      cloned.order = this.order;
    }
    return cloned;
  }
}

/**
 * LayoutResult Component - 布局计算结果组件
 * @description 存储 LayoutSystem 计算后的位置和尺寸
 */
export class LayoutResult extends Component implements ILayoutResult {
  /** 计算后的 X 坐标 */
  x: number = 0;
  /** 计算后的 Y 坐标 */
  y: number = 0;
  /** 计算后的宽度 */
  width: number = 0;
  /** 计算后的高度 */
  height: number = 0;

  /**
   * 从规范数据创建组件
   */
  static fromData(data: ILayoutResult): LayoutResult {
    const component = new LayoutResult();
    component.x = data.x;
    component.y = data.y;
    component.width = data.width;
    component.height = data.height;
    return component;
  }

  /**
   * 克隆组件
   */
  override clone(): LayoutResult {
    const cloned = new LayoutResult();
    cloned.x = this.x;
    cloned.y = this.y;
    cloned.width = this.width;
    cloned.height = this.height;
    return cloned;
  }
}
