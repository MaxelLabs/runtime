/**
 * ui/types.ts
 * UI 工具类型定义
 */

/**
 * GUI 参数类型
 */
export type GUIParamValue = number | boolean | string | [number, number, number];

/**
 * GUI 参数配置
 */
export interface GUIParamConfig {
  /** 参数值 */
  value: GUIParamValue;

  /** 最小值（数字类型） */
  min?: number;

  /** 最大值（数字类型） */
  max?: number;

  /** 步进值（数字类型） */
  step?: number;

  /** 选项列表（字符串类型） */
  options?: string[];

  /** 值变化回调 */
  onChange?: (value: GUIParamValue) => void;
}

/**
 * GUI 文件夹配置
 */
export interface GUIFolderConfig {
  /** 文件夹名称 */
  name: string;

  /** 是否默认展开 */
  open?: boolean;

  /** 参数列表 */
  params: Record<string, GUIParamConfig>;
}

/**
 * Stats 显示配置
 */
export interface StatsConfig {
  /** 显示位置 */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  /** 显示内容 */
  show?: ('fps' | 'ms' | 'memory')[];
}
