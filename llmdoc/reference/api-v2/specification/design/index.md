# Specification 设计系统 API 文档

## 概述

Specification 设计系统为 UI/UX 组件提供了基于 USD 标准的完整设计框架。该系统深度集成通用元素类型，为文本、图像、精灵、动画等组件提供统一的样式管理、主题系统和交互支持。

## 核心特性

- **USD 组件集成**: 基于通用元素类型的统一组件系统
- **统一样式系统**: 跨组件的样式管理和设计令牌
- **主题系统**: 多主题支持和动态切换
- **交互系统**: 统一的交互事件和响应处理
- **动画支持**: 集成动画系统的过渡和动效
- **响应式设计**: 自适应多设备的布局系统

## 组件系统

### 组件基础定义

```typescript
// 设计组件
interface DesignComponent {
  id: string;                         // 组件 ID
  name: string;                       // 组件名称
  description?: string;               // 组件描述
  category?: string;                  // 组件分类
  tags?: string[];                    // 组件标签

  // 组件结构
  properties: DesignComponentProperty[]; // 组件属性
  variants?: DesignComponentVariant[];    // 组件变体
  masterInstance: DesignElement;      // 组件主实例

  // 行为配置
  animation?: AnimationProperties;    // 动画属性
  interaction?: InteractionProperties; // 交互属性

  // 组件元数据
  metadata: CommonMetadata;           // 通用元数据

  // 版本控制
  version: ComponentVersion;          // 组件版本

  // 依赖关系
  dependencies?: ComponentDependency[]; // 依赖组件
}

// 组件属性
interface DesignComponentProperty {
  name: string;                       // 属性名称
  type: ComponentPropertyType;        // 属性类型
  category: PropertyCategory;         // 属性分类

  // 属性值
  defaultValue: any;                  // 默认值
  value?: any;                        // 当前值

  // 属性约束
  constraints?: PropertyConstraints;  // 属性约束

  // UI 配置
  displayName?: string;               // 显示名称
  description?: string;               // 属性描述
  group?: string;                     // 属性分组

  // 响应式配置
  responsive?: ResponsiveValue;       // 响应式值

  // 绑定配置
  binding?: PropertyBinding;          // 属性绑定
}

enum ComponentPropertyType {
  // 基础类型
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Color = 'color',
  Vector2 = 'vector2',
  Vector3 = 'vector3',
  Vector4 = 'vector4',

  // 复合类型
  Array = 'array',
  Object = 'object',
  Enum = 'enum',
  Reference = 'reference',

  // 特殊类型
  Style = 'style',
  Theme = 'theme',
  Animation = 'animation',
  Event = 'event',
  Action = 'action',
}

enum PropertyCategory {
  Appearance = 'appearance',          // 外观属性
  Layout = 'layout',                  // 布局属性
  Behavior = 'behavior',              // 行为属性
  Data = 'data',                      // 数据属性
  Accessibility = 'accessibility',    // 可访问性
  Advanced = 'advanced',              // 高级属性
}
```

### 组件变体系统

```typescript
// 组件变体
interface DesignComponentVariant {
  name: string;                       // 变体名称
  description?: string;               // 变体描述
  icon?: string;                      // 变体图标

  // 变体配置
  properties: Record<string, any>;    // 变体属性值
  style?: ComponentStyle;             // 变体样式

  // 条件配置
  conditions?: VariantCondition[];    // 变体条件

  // 状态配置
  states?: ComponentState[];          // 变体状态

  // 动画配置
  transitions?: VariantTransition[];  // 变体过渡
}

// 变体条件
interface VariantCondition {
  property: string;                   // 条件属性
  operator: ComparisonOperator;       // 比较操作符
  value: any;                         // 比较值

  // 逻辑配置
  logicalOperator?: 'and' | 'or';     // 逻辑操作符
  weight?: number;                    // 条件权重
}

// 组件状态
interface ComponentState {
  name: string;                       // 状态名称
  properties: Record<string, any>;    // 状态属性
  style?: ComponentStyle;             // 状态样式

  // 状态配置
  auto?: boolean;                     // 是否自动状态
  persistent?: boolean;               // 是否持久状态

  // 状态转换
  transitions?: StateTransition[];    // 状态转换
}

// 变体过渡
interface VariantTransition {
  from: string;                       // 起始变体
  to: string;                         // 目标变体
  duration: number;                   // 过渡时间
  easing: EasingFunction;             // 缓动函数

  // 过渡配置
  properties?: string[];              // 过渡属性列表
  delay?: number;                     // 延迟时间
  interruptible?: boolean;            // 是否可中断
}
```

### 组件实例化

```typescript
// 组件实例
interface ComponentInstance {
  id: string;                         // 实例 ID
  componentId: string;                // 组件 ID
  variant?: string;                   // 变体名称

  // 实例属性
  properties: Record<string, any>;    // 实例属性值

  // 实例状态
  state?: string;                     // 当前状态
  stateHistory?: StateHistoryEntry[]; // 状态历史

  // 实例样式
  style?: InstanceStyle;              // 实例样式

  // 实例绑定
  bindings?: InstanceBinding[];       // 数据绑定

  // 实例元数据
  metadata: InstanceMetadata;         // 实例元数据

  // 生命周期
  lifecycle: InstanceLifecycle;       // 生命周期管理
}

// 实例绑定
interface InstanceBinding {
  property: string;                   // 绑定属性
  source: BindingSource;              // 数据源
  transform?: BindingTransform;       // 数据转换
  updateMode: BindingUpdateMode;      // 更新模式
}

interface BindingSource {
  type: BindingSourceType;            // 绑定类型
  path: string;                       // 绑定路径
  context?: string;                   // 绑定上下文
  fallback?: any;                     // 备用值
}

enum BindingSourceType {
  Data = 'data',                      // 数据绑定
  State = 'state',                    // 状态绑定
  Expression = 'expression',          // 表达式绑定
  API = 'api',                        // API 绑定
  Event = 'event',                    // 事件绑定
  Storage = 'storage',                // 存储绑定
}

enum BindingUpdateMode {
  OneTime = 'one-time',               // 一次性绑定
  OneWay = 'one-way',                 // 单向绑定
  TwoWay = 'two-way',                 // 双向绑定
  Manual = 'manual',                  // 手动绑定
}
```

## 样式系统

### 样式定义

```typescript
// 组件样式
interface ComponentStyle {
  // 布局样式
  layout?: LayoutStyle;               // 布局样式

  // 视觉样式
  appearance?: AppearanceStyle;       // 外观样式

  // 动画样式
  animation?: AnimationStyle;         // 动画样式

  // 响应式样式
  responsive?: ResponsiveStyle;       // 响应式样式

  // 主题样式
  theme?: ThemeStyle;                 // 主题样式

  // 条件样式
  conditional?: ConditionalStyle[];   // 条件样式
}

// 布局样式
interface LayoutStyle {
  // 尺寸
  width?: DimensionValue;             // 宽度
  height?: DimensionValue;            // 高度
  minWidth?: DimensionValue;          // 最小宽度
  minHeight?: DimensionValue;         // 最小高度
  maxWidth?: DimensionValue;          // 最大宽度
  maxHeight?: DimensionValue;         // 最大高度

  // 位置
  x?: PositionValue;                  // X 位置
  y?: PositionValue;                  // Y 位置
  z?: number;                         // Z 层级

  // 边距
  margin?: SpacingValue;              // 外边距
  padding?: SpacingValue;             // 内边距

  // 弹性布局
  flex?: FlexStyle;                   // 弹性布局样式

  // 网格布局
  grid?: GridStyle;                   // 网格布局样式

  // 定位
  position?: PositionType;            // 定位类型
  anchor?: AnchorPoint;               // 锚点
}

// 尺寸值
type DimensionValue =
  | number                           // 像素值
  | string                           // 百分比值 ('50%')
  | { value: number; unit: DimensionUnit; }; // 带单位的值

enum DimensionUnit {
  Px = 'px',                         // 像素
  Percent = '%',                     // 百分比
  Vw = 'vw',                         // 视窗宽度
  Vh = 'vh',                         // 视窗高度
  Vmin = 'vmin',                     // 最小视窗尺寸
  Vmax = 'vmax',                     // 最大视窗尺寸
  Rem = 'rem',                       // rem 单位
  Em = 'em',                         // em 单位
}

// 位置值
type PositionValue = DimensionValue | 'auto' | 'center';

enum PositionType {
  Relative = 'relative',             // 相对定位
  Absolute = 'absolute',             // 绝对定位
  Fixed = 'fixed',                   // 固定定位
  Sticky = 'sticky',                 // 粘性定位
  Static = 'static',                 // 静态定位
}
```

### 弹性布局

```typescript
// 弹性布局样式
interface FlexStyle {
  direction: FlexDirection;          // 方向
  wrap: FlexWrap;                    // 换行
  justifyContent: FlexJustify;        // 主轴对齐
  alignItems: FlexAlign;             // 交叉轴对齐
  alignContent?: FlexAlign;          // 多行对齐

  // 子元素属性
  flexGrow?: number;                 // 增长比例
  flexShrink?: number;               // 收缩比例
  flexBasis?: DimensionValue;        // 基础尺寸

  // 间距
  gap?: SpacingValue;                // 间距
  rowGap?: SpacingValue;             // 行间距
  columnGap?: SpacingValue;          // 列间距

  // 排序
  order?: number;                    // 排序
}

enum FlexDirection {
  Row = 'row',                       // 水平方向
  Column = 'column',                 // 垂直方向
  RowReverse = 'row-reverse',        // 水平反向
  ColumnReverse = 'column-reverse',  // 垂直反向
}

enum FlexWrap {
  NoWrap = 'nowrap',                 // 不换行
  Wrap = 'wrap',                     // 换行
  WrapReverse = 'wrap-reverse',      // 反向换行
}

enum FlexJustify {
  Start = 'flex-start',              // 起始对齐
  End = 'flex-end',                  // 结束对齐
  Center = 'center',                 // 居中对齐
  Between = 'space-between',         // 两端对齐
  Around = 'space-around',           // 环绕对齐
  Evenly = 'space-evenly',           // 平均对齐
}

enum FlexAlign {
  Start = 'flex-start',              // 起始对齐
  End = 'flex-end',                  // 结束对齐
  Center = 'center',                 // 居中对齐
  Stretch = 'stretch',               // 拉伸对齐
  Baseline = 'baseline',             // 基线对齐
}
```

### 外观样式

```typescript
// 外观样式
interface AppearanceStyle {
  // 背景样式
  background?: BackgroundStyle;       // 背景样式

  // 边框样式
  border?: BorderStyle;               // 边框样式

  // 阴影样式
  shadow?: ShadowStyle;               // 阴影样式

  // 文字样式
  text?: TextStyle;                   // 文字样式

  // 图标样式
  icon?: IconStyle;                   // 图标样式

  // 裁剪样式
  clip?: ClipStyle;                   // 裁剪样式

  // 变换样式
  transform?: TransformStyle;         // 变换样式
}

// 背景样式
interface BackgroundStyle {
  color?: ColorValue;                 // 背景颜色
  image?: BackgroundImage;            // 背景图片
  gradient?: BackgroundGradient;      // 背景渐变

  // 背景配置
  size?: BackgroundSize;              // 背景尺寸
  position?: BackgroundPosition;      // 背景位置
  repeat?: BackgroundRepeat;          // 背景重复
  attachment?: BackgroundAttachment;  // 背景附件

  // 混合模式
  blendMode?: BlendMode;              // 混合模式
  opacity?: number;                   // 不透明度
}

type ColorValue =
  | string                            // 十六进制颜色
  | [number, number, number]          // RGB
  | [number, number, number, number]; // RGBA

// 背景图片
interface BackgroundImage {
  source: ImageSource;                // 图片源
  repeat: BackgroundRepeat;           // 重复模式
  position: BackgroundPosition;       // 位置
  size: BackgroundSize;               // 尺寸
}

enum BackgroundRepeat {
  NoRepeat = 'no-repeat',             // 不重复
  Repeat = 'repeat',                  // 重复
  RepeatX = 'repeat-x',               // X轴重复
  RepeatY = 'repeat-y',               // Y轴重复
  Space = 'space',                    // 间距重复
  Round = 'round',                    // 舍入重复
}

enum BackgroundSize {
  Cover = 'cover',                    // 覆盖
  Contain = 'contain',                // 包含
  Auto = 'auto',                      // 自动
  Stretch = 'stretch',                // 拉伸
}

// 边框样式
interface BorderStyle {
  width: BorderWidth;                 // 边框宽度
  color?: ColorValue;                 // 边框颜色
  style: BorderLineStyle;             // 边框样式

  // 边框圆角
  radius: BorderRadius;               // 圆角半径

  // 边框阴影
  boxShadow?: BoxShadow[];            // 盒子阴影
}

interface BorderWidth {
  top?: number;                       // 上边框
  right?: number;                     // 右边框
  bottom?: number;                    // 下边框
  left?: number;                      // 左边框
  all?: number;                       // 统一边框
}

interface BorderRadius {
  topLeft?: number;                   // 左上角
  topRight?: number;                  // 右上角
  bottomRight?: number;               // 右下角
  bottomLeft?: number;                // 左下角
  all?: number;                       // 统一圆角
}

enum BorderLineStyle {
  Solid = 'solid',                    // 实线
  Dashed = 'dashed',                  // 虚线
  Dotted = 'dotted',                  // 点线
  Double = 'double',                  // 双线
  Groove = 'groove',                  // 凹槽
  Ridge = 'ridge',                    // 凸起
  Inset = 'inset',                    // 内嵌
  Outset = 'outset',                  // 外凸
}
```

## 主题系统

### 主题定义

```typescript
// 主题系统
interface DesignTheme {
  name: string;                       // 主题名称
  version: string;                    // 主题版本
  description?: string;               // 主题描述

  // 主题配置
  palette: ThemePalette;              // 主题调色板
  typography: ThemeTypography;        // 主题字体
  spacing: ThemeSpacing;              // 主题间距
  shadows: ThemeShadows;              // 主题阴影
  borders: ThemeBorders;              // 主题边框

  // 设计令牌
  tokens: ThemeTokens;                // 设计令牌

  // 组件主题
  components: ComponentThemes;        // 组件主题

  // 主题元数据
  metadata: ThemeMetadata;            // 主题元数据
}

// 主题调色板
interface ThemePalette {
  // 主色调
  primary: ColorPalette;              // 主色
  secondary: ColorPalette;            // 辅助色

  // 语义色彩
  success: ColorPalette;              // 成功色
  warning: ColorPalette;              // 警告色
  error: ColorPalette;                // 错误色
  info: ColorPalette;                 // 信息色

  // 中性色彩
  neutral: ColorPalette;              // 中性色
  background: ColorPalette;           // 背景色
  surface: ColorPalette;              // 表面色
  text: ColorPalette;                 // 文本色

  // 边框和分割线
  border: ColorPalette;               // 边框色
  divider: ColorPalette;              // 分割线色

  // 自定义色彩
  custom?: Record<string, ColorPalette>; // 自定义色板
}

// 颜色调色板
interface ColorPalette {
  main: ColorValue;                   // 主色
  light?: ColorValue;                 // 浅色变体
  lighter?: ColorValue;               // 更浅色变体
  dark?: ColorValue;                  // 深色变体
  darker?: ColorValue;                // 更深色变体

  // 渐变色
  gradient?: GradientPalette;         // 渐变调色板

  // 透明度变体
  opacity?: Record<number, ColorValue>; // 透明度变体

  // 状态色
  hover?: ColorValue;                 // 悬停色
  active?: ColorValue;                // 激活色
  disabled?: ColorValue;              // 禁用色
  focus?: ColorValue;                 // 焦点色
}

// 渐变调色板
interface GradientPalette {
  linear?: LinearGradient;             // 线性渐变
  radial?: RadialGradient;             // 径向渐变
  conic?: ConicGradient;               // 锥形渐变
}
```

### 主题字体

```typescript
// 主题字体
interface ThemeTypography {
  // 字体族
  fontFamily: FontFamilyConfig;       // 字体族配置

  // 字体大小
  fontSize: FontSizeScale;            // 字体大小等级

  // 字重
  fontWeight: FontWeightScale;        // 字重等级

  // 行高
  lineHeight: LineHeightScale;        // 行高等级

  // 字间距
  letterSpacing: LetterSpacingScale;  // 字间距等级

  // 预定义文本样式
  textStyles: Record<string, TextStyleConfig>; // 文本样式
}

// 字体族配置
interface FontFamilyConfig {
  primary: string[];                  // 主要字体
  secondary?: string[];               // 辅助字体
  monospace?: string[];               // 等宽字体
  display?: string[];                 // 展示字体

  // 字体回退
  fallback: string[];                 // 回退字体
}

// 字体大小等级
interface FontSizeScale {
  xs: number;                         // 极小
  sm: number;                         // 小
  base: number;                       // 基础
  lg: number;                         // 大
  xl: number;                         // 极大
  '2xl': number;                      // 2倍大
  '3xl': number;                      // 3倍大
  '4xl': number;                      // 4倍大
  '5xl': number;                      // 5倍大
  '6xl': number;                      // 6倍大

  // 自定义大小
  custom?: Record<string, number>;    // 自定义大小
}

// 字重等级
interface FontWeightScale {
  thin: number;                       // 极细
  extraLight: number;                 // 特细
  light: number;                      // 细
  normal: number;                     // 正常
  medium: number;                     // 中等
  semiBold: number;                   // 半粗
  bold: number;                       // 粗
  extraBold: number;                  // 特粗
  black: number;                      // 极粗

  // 自定义字重
  custom?: Record<string, number>;    // 自定义字重
}

// 文本样式配置
interface TextStyleConfig {
  fontFamily?: string;                // 字体族
  fontSize: number;                   // 字体大小
  fontWeight: number;                 // 字重
  lineHeight: number;                 // 行高
  letterSpacing?: number;             // 字间距
  color?: ColorValue;                 // 文字颜色
  textDecoration?: TextDecoration;    // 文字装饰
  textTransform?: TextTransform;      // 文字转换
  textAlign?: TextAlign;              // 文字对齐
}

enum TextDecoration {
  None = 'none',                      // 无装饰
  Underline = 'underline',            // 下划线
  Overline = 'overline',              // 上划线
  LineThrough = 'line-through',       // 删除线
}

enum TextTransform {
  None = 'none',                      // 无转换
  Uppercase = 'uppercase',            // 大写
  Lowercase = 'lowercase',            // 小写
  Capitalize = 'capitalize',          // 首字母大写
}

enum TextAlign {
  Left = 'left',                      // 左对齐
  Center = 'center',                  // 居中对齐
  Right = 'right',                    // 右对齐
  Justify = 'justify',                // 两端对齐
}
```

### 设计令牌

```typescript
// 设计令牌
interface ThemeTokens {
  // 尺寸令牌
  spacing: SpacingTokens;             // 间距令牌
  sizing: SizingTokens;               // 尺寸令牌
  borderRadius: BorderRadiusTokens;   // 圆角令牌

  // 阴影令牌
  shadows: ShadowTokens;              // 阴影令牌

  // 动画令牌
  animation: AnimationTokens;         // 动画令牌

  // 布局令牌
  layout: LayoutTokens;               // 布局令牌

  // 断点令牌
  breakpoints: BreakpointTokens;      // 断点令牌

  // Z-index 令牌
  zIndex: ZIndexTokens;               // 层级令牌

  // 自定义令牌
  custom?: Record<string, DesignTokenValue>; // 自定义令牌
}

// 间距令牌
interface SpacingTokens {
  xs: number;                         // 极小间距
  sm: number;                         // 小间距
  md: number;                         // 中间距
  lg: number;                         // 大间距
  xl: number;                         // 极大间距

  // 特殊间距
  none: number;                       // 无间距
  auto: string;                       // 自动间距

  // 自定义间距
  custom?: Record<string, number>;    // 自定义间距
}

// 阴影令牌
interface ShadowTokens {
  none: BoxShadow;                    // 无阴影
  sm: BoxShadow;                      // 小阴影
  md: BoxShadow;                      // 中阴影
  lg: BoxShadow;                      // 大阴影
  xl: BoxShadow;                      // 极大阴影

  // 特殊阴影
  inner: BoxShadow;                   // 内阴影
  outline: BoxShadow;                 // 轮廓阴影
  glow: BoxShadow;                    // 发光阴影

  // 自定义阴影
  custom?: Record<string, BoxShadow>; // 自定义阴影
}

// 盒子阴影
interface BoxShadow {
  x: number;                          // X 偏移
  y: number;                          // Y 偏移
  blur: number;                       // 模糊半径
  spread: number;                     // 扩展半径
  color: ColorValue;                  // 阴影颜色
  inset?: boolean;                    // 是否内阴影
}

// 动画令牌
interface AnimationTokens {
  duration: DurationTokens;           // 持续时间令牌
  easing: EasingTokens;               // 缓动令牌
  delay: DelayTokens;                 // 延迟令牌

  // 预定义动画
  transitions: TransitionTokens;      // 过渡令牌
  keyframes: KeyframeTokens;          // 关键帧令牌
}

// 持续时间令牌
interface DurationTokens {
  fast: number;                       // 快速
  normal: number;                     // 正常
  slow: number;                       // 慢速

  // 具体时间
  '75': number;                       // 75ms
  '100': number;                      // 100ms
  '150': number;                      // 150ms
  '200': number;                      // 200ms
  '300': number;                      // 300ms
  '500': number;                      // 500ms
  '700': number;                      // 700ms
  '1000': number;                     // 1000ms

  // 自定义时间
  custom?: Record<string, number>;    // 自定义时间
}
```

## 响应式系统

### 断点系统

```typescript
// 断点令牌
interface BreakpointTokens {
  xs: number;                         // 极小屏幕
  sm: number;                         // 小屏幕
  md: number;                         // 中等屏幕
  lg: number;                         // 大屏幕
  xl: number;                         // 极大屏幕
  '2xl': number;                      // 2倍大屏幕

  // 自定义断点
  custom?: Record<string, number>;    // 自定义断点
}

// 响应式值
interface ResponsiveValue<T = any> {
  base?: T;                           // 基础值
  sm?: T;                             // 小屏幕值
  md?: T;                             // 中等屏幕值
  lg?: T;                             // 大屏幕值
  xl?: T;                             // 极大屏幕值
  '2xl'?: T;                          // 2倍大屏幕值

  // 自定义断点
  [breakpoint: string]: T;
}

// 响应式样式
interface ResponsiveStyle {
  // 显示控制
  display?: ResponsiveValue<DisplayType>; // 显示类型

  // 布局响应式
  layout?: ResponsiveLayoutStyle;     // 响应式布局

  // 间距响应式
  spacing?: ResponsiveSpacingStyle;   // 响应式间距

  // 字体响应式
  typography?: ResponsiveTextStyle;   // 响应式字体

  // 可见性控制
  visible?: ResponsiveVisibleConfig; // 可见性配置
}

enum DisplayType {
  None = 'none',                      // 不显示
  Block = 'block',                    // 块级
  Inline = 'inline',                  // 内联
  InlineBlock = 'inline-block',       // 内联块
  Flex = 'flex',                      // 弹性
  InlineFlex = 'inline-flex',         // 内联弹性
  Grid = 'grid',                      // 网格
  InlineGrid = 'inline-grid',         // 内联网格
}

// 可见性配置
interface ResponsiveVisibleConfig {
  xs?: boolean;                       // 极小屏幕可见
  sm?: boolean;                       // 小屏幕可见
  md?: boolean;                       // 中等屏幕可见
  lg?: boolean;                       // 大屏幕可见
  xl?: boolean;                       // 极大屏幕可见
  '2xl'?: boolean;                    // 2倍大屏幕可见
}
```

## 图标系统

### 图标定义

```typescript
// 图标系统
interface IconSystem {
  // 图标库
  libraries: IconLibrary[];           // 图标库列表

  // 图标映射
  mappings: IconMapping[];            // 图标映射

  // 图标分类
  categories: IconCategory[];         // 图标分类

  // 图标搜索
  search: IconSearchConfig;           // 搜索配置

  // 图标缓存
  cache: IconCacheConfig;             // 缓存配置
}

// 图标库
interface IconLibrary {
  name: string;                       // 库名称
  version: string;                    // 库版本
  type: IconLibraryType;              // 库类型

  // 库配置
  source: IconLibrarySource;          // 库源
  format: IconFormat;                 // 图标格式
  size?: number;                      // 默认尺寸

  // 图标列表
  icons: IconDefinition[];            // 图标定义

  // 元数据
  metadata: LibraryMetadata;          // 库元数据
}

enum IconLibraryType {
  Font = 'font',                      // 字体图标
  SVG = 'svg',                        // SVG 图标
  Image = 'image',                    // 图片图标
  Symbol = 'symbol',                  // 符号图标
  Emoji = 'emoji',                    // 表情图标
}

enum IconFormat {
  SVG = 'svg',                        // SVG 格式
  TTF = 'ttf',                        // TTF 字体
  WOFF = 'woff',                      // WOFF 字体
  WOFF2 = 'woff2',                    // WOFF2 字体
  EOT = 'eot',                        // EOT 字体
  PNG = 'png',                        // PNG 图片
}

// 图标定义
interface IconDefinition {
  name: string;                       // 图标名称
  unicode?: string;                   // Unicode 编码
  path?: string;                      // 路径数据
  category?: string;                  // 图标分类
  tags?: string[];                    // 图标标签

  // 图标属性
  size?: IconSize;                    // 图标尺寸
  viewBox?: string;                   // 视图框
  strokeWidth?: number;               // 描边宽度

  // 图标变体
  variants?: IconVariant[];           // 图标变体

  // 使用统计
  usage?: IconUsage;                  // 使用统计
}

// 图标尺寸
interface IconSize {
  width: number;                      // 宽度
  height: number;                     // 高度
  ratio?: number;                     // 宽高比
}

// 图标变体
interface IconVariant {
  name: string;                       // 变体名称
  type: IconVariantType;              // 变体类型
  path?: string;                      // 变体路径
  unicode?: string;                   // 变体编码
}

enum IconVariantType {
  Filled = 'filled',                  // 填充
  Outlined = 'outlined',              // 轮廓
  Rounded = 'rounded',                // 圆角
  Sharp = 'sharp',                    // 尖角
  TwoTone = 'two-tone',               // 双色
  Duotone = 'duotone',                // 双色调
  Light = 'light',                    // 轻量
  Regular = 'regular',                // 常规
  Bold = 'bold',                      // 粗体
}
```

### 图标使用

```typescript
// 图标样式
interface IconStyle {
  // 尺寸
  size?: DimensionValue;              // 图标尺寸

  // 颜色
  color?: ColorValue;                 // 图标颜色
  backgroundColor?: ColorValue;       // 背景颜色

  // 对齐
  alignment?: IconAlignment;          // 图标对齐

  // 动画
  animation?: IconAnimation;          // 图标动画

  // 按钮样式
  buttonStyle?: IconButtonStyle;      // 按钮样式
}

enum IconAlignment {
  Left = 'left',                      // 左对齐
  Center = 'center',                  // 居中对齐
  Right = 'right',                    // 右对齐
  Top = 'top',                        // 顶部对齐
  Bottom = 'bottom',                  // 底部对齐
  Baseline = 'baseline',              // 基线对齐
}

// 图标动画
interface IconAnimation {
  type: IconAnimationType;            // 动画类型
  duration?: number;                  // 动画时长
  easing?: EasingFunction;            // 缓动函数
  delay?: number;                     // 延迟时间

  // 动画配置
  loop?: boolean;                     // 是否循环
  direction?: AnimationDirection;     // 动画方向
  timing?: string;                    // 时间函数
}

enum IconAnimationType {
  None = 'none',                      // 无动画
  Spin = 'spin',                      // 旋转
  Bounce = 'bounce',                  // 弹跳
  Pulse = 'pulse',                    // 脉冲
  Shake = 'shake',                    // 震动
  Flash = 'flash',                    // 闪烁
  Fade = 'fade',                      // 淡入淡出
  Slide = 'slide',                    // 滑动
  Zoom = 'zoom',                      // 缩放
}

enum AnimationDirection {
  Normal = 'normal',                  // 正常
  Reverse = 'reverse',                // 反向
  Alternate = 'alternate',            // 交替
  AlternateReverse = 'alternate-reverse', // 反向交替
}
```

## 实际应用示例

### 创建组件库

```typescript
import {
  DesignComponent,
  ComponentPropertyType,
  PropertyCategory,
  DesignComponentVariant
} from '@maxellabs/specification';

// 创建按钮组件
const buttonComponent: DesignComponent = {
  id: 'button-001',
  name: 'Button',
  description: '标准按钮组件',
  category: 'Controls',
  tags: ['button', 'click', 'action'],

  properties: [
    {
      name: 'label',
      type: ComponentPropertyType.String,
      category: PropertyCategory.Appearance,
      defaultValue: 'Button',
      displayName: '按钮文本',
      description: '按钮显示的文本内容',
      constraints: {
        minLength: 0,
        maxLength: 100
      },
      responsive: {
        base: 'Button',
        sm: 'Btn',
        xs: 'B'
      }
    },
    {
      name: 'variant',
      type: ComponentPropertyType.Enum,
      category: PropertyCategory.Appearance,
      defaultValue: 'primary',
      displayName: '按钮类型',
      description: '按钮的视觉类型',
      constraints: {
        options: ['primary', 'secondary', 'outline', 'ghost', 'link']
      }
    },
    {
      name: 'size',
      type: ComponentPropertyType.Enum,
      category: PropertyCategory.Appearance,
      defaultValue: 'medium',
      displayName: '按钮尺寸',
      description: '按钮的尺寸大小',
      constraints: {
        options: ['small', 'medium', 'large', 'xlarge']
      }
    },
    {
      name: 'disabled',
      type: ComponentPropertyType.Boolean,
      category: PropertyCategory.Behavior,
      defaultValue: false,
      displayName: '禁用状态',
      description: '是否禁用按钮'
    },
    {
      name: 'loading',
      type: ComponentPropertyType.Boolean,
      category: PropertyCategory.Behavior,
      defaultValue: false,
      displayName: '加载状态',
      description: '是否显示加载状态'
    },
    {
      name: 'onClick',
      type: ComponentPropertyType.Event,
      category: PropertyCategory.Behavior,
      displayName: '点击事件',
      description: '按钮点击时触发的事件'
    }
  ],

  variants: [
    {
      name: 'primary',
      description: '主要按钮',
      properties: {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        borderColor: '#3b82f6',
        hover: {
          backgroundColor: '#2563eb',
          borderColor: '#2563eb'
        }
      }
    },
    {
      name: 'secondary',
      description: '次要按钮',
      properties: {
        backgroundColor: '#6b7280',
        color: '#ffffff',
        borderColor: '#6b7280',
        hover: {
          backgroundColor: '#4b5563',
          borderColor: '#4b5563'
        }
      }
    },
    {
      name: 'outline',
      description: '轮廓按钮',
      properties: {
        backgroundColor: 'transparent',
        color: '#3b82f6',
        borderColor: '#3b82f6',
        hover: {
          backgroundColor: '#eff6ff'
        }
      }
    },
    {
      name: 'ghost',
      description: '幽灵按钮',
      properties: {
        backgroundColor: 'transparent',
        color: '#6b7280',
        borderColor: 'transparent',
        hover: {
          backgroundColor: '#f9fafb'
        }
      }
    }
  ],

  masterInstance: {
    type: 'component',
    id: 'button-master',
    componentId: 'button-001',
    properties: {
      label: 'Button',
      variant: 'primary',
      size: 'medium',
      disabled: false,
      loading: false
    },
    style: {
      layout: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: {
          horizontal: '16px',
          vertical: '8px'
        },
        borderRadius: '6px',
        border: {
          width: '1px',
          style: 'solid'
        },
        cursor: 'pointer'
      },
      appearance: {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '500',
        lineHeight: '1.5',
        transition: {
          duration: '200ms',
          easing: 'ease-in-out'
        }
      },
      interaction: {
        hover: {
          backgroundColor: '#2563eb'
        },
        active: {
          transform: {
            scale: '0.98'
          }
        },
        disabled: {
          backgroundColor: '#e5e7eb',
          color: '#9ca3af',
          cursor: 'not-allowed'
        }
      }
    }
  },

  animation: {
    duration: 0.2,
    easing: EasingFunction.CubicInOut,
    delay: 0
  },

  interaction: {
    interactive: true,
    hover: {
      enabled: true,
      delay: 100,
      animation: {
        duration: 0.15,
        easing: EasingFunction.CubicInOut
      }
    },
    click: {
      enabled: true,
      feedbackType: ClickFeedbackType.Visual,
      visualEffect: {
        type: VisualEffectType.Scale,
        duration: 150,
        parameters: {
          scale: 0.95
        }
      }
    }
  },

  metadata: {
    name: 'Button',
    description: '标准按钮组件',
    version: { major: 1, minor: 0, patch: 0 },
    creator: 'DesignSystem',
    createdAt: '2024-01-01T00:00:00Z',
    tags: ['ui', 'button', 'control'],
    customData: {
      category: 'Form',
      a11y: {
        role: 'button',
        keyboardAccessible: true,
        screenReaderSupport: true
      }
    }
  },

  version: {
    major: 1,
    minor: 0,
    patch: 0
  },

  dependencies: [
    {
      componentId: 'icon-001',
      version: '^1.0.0',
      optional: true,
      reason: 'Loading indicator'
    },
    {
      componentId: 'ripple-001',
      version: '^1.0.0',
      optional: true,
      reason: 'Click ripple effect'
    }
  ]
};
```

### 创建主题

```typescript
import {
  DesignTheme,
  ThemePalette,
  ColorPalette,
  ThemeTypography,
  FontFamilyConfig,
  FontSizeScale,
  ThemeTokens,
  SpacingTokens
} from '@maxellabs/specification';

// 创建现代主题
const modernTheme: DesignTheme = {
  name: 'Modern',
  version: '2.0.0',
  description: '现代简约设计主题',

  palette: {
    primary: {
      main: '#3b82f6',               // 蓝色主色
      light: '#60a5fa',              // 浅蓝色
      lighter: '#dbeafe',            // 更浅蓝色
      dark: '#1d4ed8',               // 深蓝色
      darker: '#1e3a8a',             // 更深蓝色
      hover: '#2563eb',              // 悬停色
      active: '#1d4ed8',             // 激活色
      disabled: '#9ca3af',           // 禁用色
      focus: '#60a5fa'               // 焦点色
    },
    secondary: {
      main: '#6b7280',               // 灰色辅助色
      light: '#9ca3af',              // 浅灰色
      dark: '#4b5563',               // 深灰色
      darker: '#1f2937'              // 更深灰色
    },
    success: {
      main: '#10b981',               // 绿色成功色
      light: '#34d399',
      dark: '#059669',
      hover: '#059669',
      focus: '#34d399'
    },
    warning: {
      main: '#f59e0b',               // 橙色警告色
      light: '#fbbf24',
      dark: '#d97706',
      hover: '#d97706',
      focus: '#fbbf24'
    },
    error: {
      main: '#ef4444',               // 红色错误色
      light: '#f87171',
      dark: '#dc2626',
      hover: '#dc2626',
      focus: '#f87171'
    },
    neutral: {
      main: '#6b7280',               // 中性灰色
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    },
    background: {
      main: '#ffffff',               // 主背景色
      secondary: '#f9fafb',          // 次背景色
      tertiary: '#f3f4f6'           // 三级背景色
    },
    surface: {
      main: '#ffffff',               // 主表面色
      elevated: '#ffffff',           // 抬高表面色
      overlay: 'rgba(0, 0, 0, 0.5)'  // 遮罩表面色
    },
    text: {
      primary: '#111827',            // 主文本色
      secondary: '#6b7280',          // 次文本色
      tertiary: '#9ca3af',           // 三级文本色
      inverse: '#ffffff',            // 反色文本
      disabled: '#d1d5db'            // 禁用文本
    },
    border: {
      main: '#e5e7eb',               // 主边框色
      focus: '#3b82f6',              // 焦点边框色
      error: '#ef4444',              // 错误边框色
      success: '#10b981'             // 成功边框色
    }
  },

  typography: {
    fontFamily: {
      primary: ['Inter', 'system-ui', 'sans-serif'],
      secondary: ['Roboto', 'Inter', 'system-ui', 'sans-serif'],
      monospace: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      display: ['Inter Display', 'Inter', 'system-ui', 'sans-serif'],
      fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
      '7xl': 72,
      '8xl': 96,
      '9xl': 128,
      custom: {
        '10xl': 144,
        '11xl': 160
      }
    },
    fontWeight: {
      thin: 100,
      extraLight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semiBold: 600,
      bold: 700,
      extraBold: 800,
      black: 900
    },
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
      custom: {
        '3': 1.75,
        '4': 2.25
      }
    },
    letterSpacing: {
      tighter: -0.05,
      tight: -0.025,
      normal: 0,
      wide: 0.025,
      wider: 0.05,
      widest: 0.1,
      custom: {
        'ultra-wide': 0.2
      }
    },
    textStyles: {
      h1: {
        fontSize: 48,
        fontWeight: 800,
        lineHeight: 1.2,
        letterSpacing: -0.025,
        color: '#111827'
      },
      h2: {
        fontSize: 36,
        fontWeight: 700,
        lineHeight: 1.3,
        color: '#111827'
      },
      h3: {
        fontSize: 30,
        fontWeight: 600,
        lineHeight: 1.4,
        color: '#111827'
      },
      h4: {
        fontSize: 24,
        fontWeight: 600,
        lineHeight: 1.4,
        color: '#111827'
      },
      h5: {
        fontSize: 20,
        fontWeight: 600,
        lineHeight: 1.5,
        color: '#111827'
      },
      h6: {
        fontSize: 18,
        fontWeight: 600,
        lineHeight: 1.5,
        color: '#111827'
      },
      body1: {
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.6,
        color: '#374151'
      },
      body2: {
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.5,
        color: '#6b7280'
      },
      caption: {
        fontSize: 12,
        fontWeight: 400,
        lineHeight: 1.4,
        color: '#9ca3af'
      },
      overline: {
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 1.4,
        textTransform: TextTransform.Uppercase,
        letterSpacing: 0.1,
        color: '#6b7280'
      }
    }
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
    '4xl': 80,
    '5xl': 96,
    none: 0,
    custom: {
      '6': 24,
      '12': 48,
      '20': 80,
      '28': 112
    }
  },

  tokens: {
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      '2xl': 48,
      '3xl': 64,
      none: 0,
      auto: 'auto'
    },
    sizing: {
      xs: 20,
      sm: 24,
      md: 32,
      lg: 40,
      xl: 48,
      '2xl': 56,
      full: '100%',
      min: 'min-content',
      max: 'max-content',
      fit: 'fit-content'
    },
    borderRadius: {
      none: 0,
      sm: 2,
      md: 6,
      lg: 8,
      xl: 12,
      '2xl': 16,
      '3xl': 24,
      full: 9999
    },
    shadows: {
      none: { x: 0, y: 0, blur: 0, spread: 0, color: 'transparent' },
      sm: { x: 1, y: 1, blur: 2, spread: 0, color: 'rgba(0, 0, 0, 0.05)' },
      md: { x: 4, y: 4, blur: 6, spread: -1, color: 'rgba(0, 0, 0, 0.1)' },
      lg: { x: 10, y: 10, blur: 15, spread: -3, color: 'rgba(0, 0, 0, 0.1)' },
      xl: { x: 20, y: 20, blur: 25, spread: -5, color: 'rgba(0, 0, 0, 0.1)' },
      inner: { x: 2, y: 2, blur: 4, spread: 0, color: 'rgba(0, 0, 0, 0.05)', inset: true },
      outline: { x: 0, y: 0, blur: 0, spread: 2, color: '#3b82f6' },
      glow: { x: 0, y: 0, blur: 16, spread: 0, color: 'rgba(59, 130, 246, 0.5)' }
    },
    animation: {
      duration: {
        fast: 150,
        normal: 300,
        slow: 500,
        '75': 75,
        '100': 100,
        '150': 150,
        '200': 200,
        '300': 300,
        '500': 500,
        '700': 700,
        '1000': 1000
      },
      easing: {
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
        linear: 'linear'
      },
      delay: {
        '75': 75,
        '100': 100,
        '150': 150,
        '200': 200,
        '300': 300,
        '500': 500,
        '700': 700,
        '1000': 1000
      }
    },
    layout: {
      container: {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        '2xl': 1536
      },
      sidebar: {
        width: 280,
        collapsed: 80
      },
      header: {
        height: 64
      }
    },
    breakpoints: {
      xs: 475,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536
    },
    zIndex: {
      hide: -1,
      auto: 'auto',
      base: 0,
      docked: 10,
      dropdown: 1000,
      sticky: 1100,
      banner: 1200,
      overlay: 1300,
      modal: 1400,
      popover: 1500,
      skipLink: 1600,
      toast: 1700,
      tooltip: 1800
    }
  },

  components: {
    button: {
      variants: {
        primary: {
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          borderColor: '#3b82f6',
          hover: {
            backgroundColor: '#2563eb'
          }
        },
        secondary: {
          backgroundColor: '#6b7280',
          color: '#ffffff',
          borderColor: '#6b7280',
          hover: {
            backgroundColor: '#4b5563'
          }
        },
        outline: {
          backgroundColor: 'transparent',
          color: '#3b82f6',
          borderColor: '#3b82f6',
          hover: {
            backgroundColor: '#eff6ff'
          }
        }
      },
      sizes: {
        small: {
          padding: {
            horizontal: 12,
            vertical: 6
          },
          fontSize: 14,
          borderRadius: 4
        },
        medium: {
          padding: {
            horizontal: 16,
            vertical: 8
          },
          fontSize: 16,
          borderRadius: 6
        },
        large: {
          padding: {
            horizontal: 20,
            vertical: 10
          },
          fontSize: 18,
          borderRadius: 8
        }
      }
    }
  },

  metadata: {
    name: 'Modern Theme',
    description: '现代简约设计主题',
    version: { major: 2, minor: 0, patch: 0 },
    creator: 'Design Team',
    tags: ['modern', 'minimal', 'professional'],
    customData: {
      targetAudience: 'Enterprise',
      designSystem: 'Material Design 3 inspired',
      accessibility: 'WCAG 2.1 AA compliant',
      browserSupport: 'Modern browsers (ES2020+)'
    }
  }
};
```

## 最佳实践

### 1. 组件设计原则

```typescript
// ✅ 推荐：原子化设计
const atomicComponents = {
  // 原子组件
  atoms: ['Icon', 'Button', 'Input', 'Text'],

  // 分子组件
  molecules: ['SearchBox', 'MenuItem', 'UserCard'],

  // 有机体组件
  organisms: ['Header', 'Sidebar', 'DataTable'],

  // 模板组件
  templates: ['Dashboard', 'SettingsPage', 'UserProfile'],

  // 页面组件
  pages: ['HomePage', 'LoginPage', 'SettingsPage']
};

// ✅ 推荐：组件一致性
const consistencyGuidelines = {
  // 统一的属性命名
  naming: {
    backgroundColor: 'backgroundColor', // 而不是 'bgColor'
    borderColor: 'borderColor',         // 而不是 'border'
    fontSize: 'fontSize'                // 而不是 'size'
  },

  // 统一的状态管理
  states: ['default', 'hover', 'active', 'disabled', 'loading', 'error'],

  // 统一的尺寸等级
  sizes: ['xs', 'sm', 'md', 'lg', 'xl']
};
```

### 2. 性能优化

```typescript
// ✅ 推荐：组件懒加载
const lazyLoadStrategy = {
  // 按需加载组件
  components: {
    heavy: {
      loader: () => import('./HeavyComponent'),
      fallback: <LoadingSpinner />
    }
  },

  // 代码分割
  codeSplitting: {
    chunks: ['common', 'admin', 'user', 'dashboard'],
    optimization: 'all'
  }
};

// ✅ 推荐：样式优化
const styleOptimization = {
  // CSS-in-JS 优化
  cssInJs: {
    extractStatic: true,              // 提取静态样式
    critical: true,                   // 关键 CSS
    minify: true                      // 压缩
  },

  // 主题缓存
  themeCache: {
    enabled: true,
    maxSize: 100,
    ttl: 3600000                      // 1小时缓存
  }
};
```

### 3. 可访问性

```typescript
// ✅ 推荐：WCAG 合规
const accessibilityGuidelines = {
  // 颜色对比度
  contrast: {
    'AA': 4.5,                       // 标准对比度
    'AAA': 7                         // 增强对比度
  },

  // 键盘导航
  keyboard: {
    focusVisible: true,               // 焦点可见性
    skipLinks: true,                  // 跳转链接
    tabOrder: 'logical'               // 合理的 Tab 顺序
  },

  // 屏幕阅读器
  screenReader: {
    ariaLabels: true,                 // ARIA 标签
    semanticHTML: true,               // 语义化 HTML
    announcements: true               // 状态变化通知
  }
};
```

## 总结

Specification 设计系统提供了：

1. **完整的组件系统**：可复用的 UI 组件库和变体管理
2. **强大的样式系统**：统一的样式管理和设计令牌
3. **灵活的主题系统**：多主题支持和动态切换
4. **响应式布局**：自适应多设备的布局系统
5. **丰富的图标系统**：完整的图标库和字体管理
6. **无障碍支持**：WCAG 合规的可访问性设计

该系统为现代 UI/UX 设计提供了完整、一致、可扩展的解决方案，深度集成 USD 标准，支持跨平台的统一设计体验。