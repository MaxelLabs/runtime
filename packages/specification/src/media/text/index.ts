/**
 * Maxellabs 文本规范 - 导出索引
 * 统一导出文本相关的所有类型定义
 */

// 基础类型
export * from './base';

// 样式相关
export * from './styles';

// 布局相关 - 选择性导出避免冲突
export {
  FlowDirection,
  TextFlow,
  ColumnRule,
  WrapMode,
  WordBreak,
  Hyphens,
  WhiteSpace,
  TextWrap,
  OverflowType,
  MediaTextOverflow,
  ParagraphAlignment,
  ParagraphIndent,
  ParagraphSpacing,
  LineSpacingType,
  ListType,
  MarkerPosition,
  ListStyle,
  PageBreak,
  PageBreakType,
  TabStop,
  TabStopType,
} from './layout';

// 效果相关
export * from './effects';
