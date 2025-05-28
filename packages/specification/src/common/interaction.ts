/**
 * Maxellabs 通用交互
 * 定义所有系统共通的交互相关类型
 */

import type { CommonElement } from './elements';
import type { AnimationProperties } from '../core/interfaces';

/**
 * 交互事件类型
 */
export enum InteractionEventType {
  /**
   * 鼠标进入
   */
  MouseEnter = 'mouse-enter',
  /**
   * 鼠标离开
   */
  MouseLeave = 'mouse-leave',
  /**
   * 鼠标按下
   */
  MouseDown = 'mouse-down',
  /**
   * 鼠标抬起
   */
  MouseUp = 'mouse-up',
  /**
   * 鼠标点击
   */
  Click = 'click',
  /**
   * 鼠标双击
   */
  DoubleClick = 'double-click',
  /**
   * 鼠标右键
   */
  RightClick = 'right-click',
  /**
   * 鼠标移动
   */
  MouseMove = 'mouse-move',
  /**
   * 鼠标滚轮
   */
  MouseWheel = 'mouse-wheel',
  /**
   * 触摸开始
   */
  TouchStart = 'touch-start',
  /**
   * 触摸结束
   */
  TouchEnd = 'touch-end',
  /**
   * 触摸移动
   */
  TouchMove = 'touch-move',
  /**
   * 触摸取消
   */
  TouchCancel = 'touch-cancel',
  /**
   * 拖拽开始
   */
  DragStart = 'drag-start',
  /**
   * 拖拽中
   */
  Drag = 'drag',
  /**
   * 拖拽结束
   */
  DragEnd = 'drag-end',
  /**
   * 拖拽进入
   */
  DragEnter = 'drag-enter',
  /**
   * 拖拽离开
   */
  DragLeave = 'drag-leave',
  /**
   * 拖拽悬停
   */
  DragOver = 'drag-over',
  /**
   * 放置
   */
  Drop = 'drop',
  /**
   * 键盘按下
   */
  KeyDown = 'key-down',
  /**
   * 键盘抬起
   */
  KeyUp = 'key-up',
  /**
   * 键盘按键
   */
  KeyPress = 'key-press',
  /**
   * 获得焦点
   */
  Focus = 'focus',
  /**
   * 失去焦点
   */
  Blur = 'blur',
}

/**
 * 交互状态
 */
export enum InteractionState {
  /**
   * 正常状态
   */
  Normal = 'normal',
  /**
   * 悬停状态
   */
  Hover = 'hover',
  /**
   * 按下状态
   */
  Pressed = 'pressed',
  /**
   * 选中状态
   */
  Selected = 'selected',
  /**
   * 禁用状态
   */
  Disabled = 'disabled',
  /**
   * 焦点状态
   */
  Focused = 'focused',
  /**
   * 拖拽状态
   */
  Dragging = 'dragging',
}

/**
 * 鼠标按钮
 */
export enum MouseButton {
  /**
   * 左键
   */
  Left = 0,
  /**
   * 中键
   */
  Middle = 1,
  /**
   * 右键
   */
  Right = 2,
}

/**
 * 触摸类型
 */
export enum TouchType {
  /**
   * 直接触摸
   */
  Direct = 'direct',
  /**
   * 间接触摸
   */
  Indirect = 'indirect',
  /**
   * 手写笔
   */
  Stylus = 'stylus',
}

/**
 * 交互事件
 */
export interface InteractionEvent {
  /**
   * 事件类型
   */
  type: InteractionEventType;
  /**
   * 目标元素
   */
  target: CommonElement;
  /**
   * 当前目标元素
   */
  currentTarget?: CommonElement;
  /**
   * 事件时间戳
   */
  timestamp: number;
  /**
   * 是否冒泡
   */
  bubbles: boolean;
  /**
   * 是否可取消
   */
  cancelable: boolean;
  /**
   * 是否已阻止默认行为
   */
  defaultPrevented: boolean;
  /**
   * 鼠标/触摸位置
   */
  position?: {
    x: number;
    y: number;
  };
  /**
   * 鼠标按钮
   */
  button?: MouseButton;
  /**
   * 修饰键状态
   */
  modifiers?: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
  };
  /**
   * 触摸信息
   */
  touches?: TouchInfo[];
  /**
   * 键盘信息
   */
  key?: KeyInfo;
  /**
   * 滚轮信息
   */
  wheel?: WheelInfo;
  /**
   * 拖拽信息
   */
  drag?: DragInfo;
}

/**
 * 触摸信息
 */
export interface TouchInfo {
  /**
   * 触摸ID
   */
  id: number;
  /**
   * 触摸位置
   */
  position: {
    x: number;
    y: number;
  };
  /**
   * 触摸压力
   */
  pressure: number;
  /**
   * 触摸半径
   */
  radius: {
    x: number;
    y: number;
  };
  /**
   * 触摸类型
   */
  touchType: TouchType;
}

/**
 * 键盘信息
 */
export interface KeyInfo {
  /**
   * 键码
   */
  code: string;
  /**
   * 键值
   */
  key: string;
  /**
   * 字符码
   */
  charCode?: number;
  /**
   * 键码
   */
  keyCode?: number;
  /**
   * 是否重复
   */
  repeat: boolean;
}

/**
 * 滚轮信息
 */
export interface WheelInfo {
  /**
   * 水平滚动量
   */
  deltaX: number;
  /**
   * 垂直滚动量
   */
  deltaY: number;
  /**
   * Z轴滚动量
   */
  deltaZ: number;
  /**
   * 滚动模式
   */
  deltaMode: number;
}

/**
 * 拖拽信息
 */
export interface DragInfo {
  /**
   * 拖拽数据
   */
  data: any;
  /**
   * 拖拽类型
   */
  types: string[];
  /**
   * 拖拽效果
   */
  effectAllowed: string;
  /**
   * 放置效果
   */
  dropEffect: string;
  /**
   * 拖拽图像
   */
  dragImage?: {
    element: any;
    x: number;
    y: number;
  };
}

/**
 * 交互配置
 */
export interface InteractionConfig {
  /**
   * 是否启用交互
   */
  enabled: boolean;
  /**
   * 交互类型
   */
  types: InteractionEventType[];
  /**
   * 是否阻止冒泡
   */
  stopPropagation: boolean;
  /**
   * 是否阻止默认行为
   */
  preventDefault: boolean;
  /**
   * 交互区域
   */
  hitArea?: HitArea;
  /**
   * 交互优先级
   */
  priority: number;
  /**
   * 是否穿透
   */
  passThrough: boolean;
}

/**
 * 碰撞区域
 */
export interface HitArea {
  /**
   * 区域类型
   */
  type: HitAreaType;
  /**
   * 区域参数
   */
  parameters: any;
  /**
   * 偏移
   */
  offset?: {
    x: number;
    y: number;
  };
}

/**
 * 碰撞区域类型
 */
export enum HitAreaType {
  /**
   * 矩形
   */
  Rectangle = 'rectangle',
  /**
   * 圆形
   */
  Circle = 'circle',
  /**
   * 椭圆
   */
  Ellipse = 'ellipse',
  /**
   * 多边形
   */
  Polygon = 'polygon',
  /**
   * 路径
   */
  Path = 'path',
  /**
   * 像素完美
   */
  PixelPerfect = 'pixel-perfect',
}

/**
 * 悬停效果
 */
export interface HoverEffect {
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 悬停延迟（毫秒）
   */
  delay: number;
  /**
   * 高亮颜色
   */
  highlightColor?: [number, number, number, number];
  /**
   * 缩放因子
   */
  scaleFactor?: number;
  /**
   * 透明度变化
   */
  opacityChange?: number;
  /**
   * 动画配置
   */
  animation?: AnimationProperties;
  /**
   * 光标样式
   */
  cursor?: string;
  /**
   * 工具提示
   */
  tooltip?: string;
}

/**
 * 点击效果
 */
export interface ClickEffect {
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 反馈类型
   */
  feedbackType: ClickFeedbackType;
  /**
   * 动画配置
   */
  animation?: AnimationProperties;
  /**
   * 音效
   */
  sound?: string;
  /**
   * 震动
   */
  vibration?: VibrationPattern;
  /**
   * 视觉效果
   */
  visualEffect?: VisualEffect;
}

/**
 * 点击反馈类型
 */
export enum ClickFeedbackType {
  /**
   * 无反馈
   */
  None = 'none',
  /**
   * 缩放
   */
  Scale = 'scale',
  /**
   * 闪烁
   */
  Flash = 'flash',
  /**
   * 波纹
   */
  Ripple = 'ripple',
  /**
   * 弹跳
   */
  Bounce = 'bounce',
  /**
   * 旋转
   */
  Rotate = 'rotate',
}

/**
 * 震动模式
 */
export interface VibrationPattern {
  /**
   * 震动持续时间（毫秒）
   */
  duration: number;
  /**
   * 震动强度 (0-1)
   */
  intensity: number;
  /**
   * 震动模式
   */
  pattern?: number[];
}

/**
 * 视觉效果
 */
export interface VisualEffect {
  /**
   * 效果类型
   */
  type: VisualEffectType;
  /**
   * 持续时间（毫秒）
   */
  duration: number;
  /**
   * 效果参数
   */
  parameters?: Record<string, any>;
}

/**
 * 视觉效果类型
 */
export enum VisualEffectType {
  /**
   * 粒子效果
   */
  Particle = 'particle',
  /**
   * 光晕效果
   */
  Glow = 'glow',
  /**
   * 闪光效果
   */
  Flash = 'flash',
  /**
   * 波纹效果
   */
  Ripple = 'ripple',
  /**
   * 爆炸效果
   */
  Explosion = 'explosion',
}

/**
 * 选择效果
 */
export interface SelectionEffect {
  /**
   * 是否启用
   */
  enabled: boolean;
  /**
   * 是否多选
   */
  multiSelect: boolean;
  /**
   * 选择颜色
   */
  selectionColor?: [number, number, number, number];
  /**
   * 选择边框
   */
  selectionBorder?: SelectionBorder;
  /**
   * 选择动画
   */
  animation?: AnimationProperties;
}

/**
 * 选择边框
 */
export interface SelectionBorder {
  /**
   * 边框宽度
   */
  width: number;
  /**
   * 边框颜色
   */
  color: [number, number, number, number];
  /**
   * 边框样式
   */
  style: 'solid' | 'dashed' | 'dotted';
  /**
   * 边框圆角
   */
  radius?: number;
}
