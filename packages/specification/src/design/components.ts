/**
 * Maxellabs 设计组件定义
 * 包含组件库管理、组件定义和实例化
 */

import type { CommonMetadata, AnimationProperties, InteractionProperties } from '../core/interfaces';
import type { DesignComponentProperty, DesignComponentVariant } from './base';
import type { DesignElement } from './elements';

/**
 * 设计组件
 */
export interface DesignComponent {
  /**
   * 组件 ID
   */
  id: string;
  /**
   * 组件名称
   */
  name: string;
  /**
   * 组件描述
   */
  description?: string;
  /**
   * 组件分类
   */
  category?: string;
  /**
   * 组件标签
   */
  tags?: string[];
  /**
   * 组件属性
   */
  properties: DesignComponentProperty[];
  /**
   * 组件变体
   */
  variants?: DesignComponentVariant[];
  /**
   * 组件主实例
   */
  masterInstance: DesignElement;
  /**
   * 动画属性（使用统一AnimationProperties）
   */
  animation?: AnimationProperties;
  /**
   * 交互属性（使用统一InteractionProperties）
   */
  interaction?: InteractionProperties;
  /**
   * 组件状态
   */
  states?: ComponentState[];
  /**
   * 依赖组件
   */
  dependencies?: string[];
  /**
   * 组件版本
   */
  version?: string;
  /**
   * 创建时间
   */
  createdAt?: string;
  /**
   * 更新时间
   */
  updatedAt?: string;
}

/**
 * 组件状态
 */
export interface ComponentState {
  /**
   * 状态名称
   */
  name: string;
  /**
   * 状态类型
   */
  type: ComponentStateType;
  /**
   * 状态属性
   */
  properties: Record<string, any>;
  /**
   * 状态转换
   */
  transitions?: ComponentTransition[];
}

/**
 * 组件状态类型
 */
export enum ComponentStateType {
  Default = 'default',
  Hover = 'hover',
  Pressed = 'pressed',
  Focused = 'focused',
  Disabled = 'disabled',
  Selected = 'selected',
  Active = 'active',
  Loading = 'loading',
  Error = 'error',
}

/**
 * 组件状态转换
 */
export interface ComponentTransition {
  /**
   * 目标状态
   */
  toState: string;
  /**
   * 触发条件
   */
  trigger: ComponentTrigger;
  /**
   * 转换动画
   */
  animation?: AnimationProperties;
  /**
   * 转换条件
   */
  condition?: string;
}

/**
 * 组件触发器
 */
export enum ComponentTrigger {
  Click = 'click',
  Hover = 'hover',
  Focus = 'focus',
  Blur = 'blur',
  KeyPress = 'keypress',
  Load = 'load',
  Change = 'change',
  Custom = 'custom',
}

/**
 * 设计组件库
 */
export interface DesignComponentLibrary {
  /**
   * 库名称
   */
  name: string;
  /**
   * 库版本
   */
  version: string;
  /**
   * 组件列表
   */
  components: Record<string, DesignComponent>;
  /**
   * 组件分类
   */
  categories?: ComponentCategory[];
  /**
   * 库配置
   */
  config?: ComponentLibraryConfig;
  /**
   * 元数据（使用统一CommonMetadata）
   */
  metadata?: CommonMetadata;
}

/**
 * 组件分类
 */
export interface ComponentCategory {
  /**
   * 分类 ID
   */
  id: string;
  /**
   * 分类名称
   */
  name: string;
  /**
   * 分类描述
   */
  description?: string;
  /**
   * 父分类
   */
  parent?: string;
  /**
   * 分类图标
   */
  icon?: string;
  /**
   * 排序权重
   */
  order?: number;
}

/**
 * 组件库配置
 */
export interface ComponentLibraryConfig {
  /**
   * 默认主题
   */
  defaultTheme?: string;
  /**
   * 支持的主题
   */
  themes?: string[];
  /**
   * 组件前缀
   */
  prefix?: string;
  /**
   * 命名约定
   */
  namingConvention?: NamingConvention;
  /**
   * 构建配置
   */
  buildConfig?: BuildConfig;
}

/**
 * 命名约定
 */
export enum NamingConvention {
  CamelCase = 'camelCase',
  PascalCase = 'PascalCase',
  KebabCase = 'kebab-case',
  SnakeCase = 'snake_case',
}

/**
 * 构建配置
 */
export interface BuildConfig {
  /**
   * 输出格式
   */
  outputFormat?: OutputFormat[];
  /**
   * 是否压缩
   */
  minify?: boolean;
  /**
   * 是否生成类型
   */
  generateTypes?: boolean;
  /**
   * 自定义构建脚本
   */
  customScript?: string;
}

/**
 * 输出格式
 */
export enum OutputFormat {
  React = 'react',
  Vue = 'vue',
  Angular = 'angular',
  WebComponent = 'web-component',
  HTML = 'html',
  CSS = 'css',
  JSON = 'json',
}

/**
 * 组件使用统计
 */
export interface ComponentUsageStats {
  /**
   * 组件 ID
   */
  componentId: string;
  /**
   * 使用次数
   */
  usageCount: number;
  /**
   * 最后使用时间
   */
  lastUsed?: string;
  /**
   * 使用项目
   */
  projects?: string[];
  /**
   * 使用场景
   */
  contexts?: ComponentUsageContext[];
}

/**
 * 组件使用场景
 */
export interface ComponentUsageContext {
  /**
   * 场景类型
   */
  type: ContextType;
  /**
   * 场景名称
   */
  name: string;
  /**
   * 使用次数
   */
  count: number;
}

/**
 * 场景类型
 */
export enum ContextType {
  Page = 'page',
  Modal = 'modal',
  Component = 'component',
  Template = 'template',
  Layout = 'layout',
}
