/**
 * Maxellabs 设计组件定义
 * 包含组件库管理、组件定义和实例化
 */

import type { CommonMetadata, AnimationProperties, InteractionProperties, EventType, BaseCategory } from '../core';
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
  trigger: EventType;
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
 *
 * @description 继承自 BaseCategory，添加图标和排序字段
 */
export interface ComponentCategory extends BaseCategory {
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
   * 库的基础设置
   */
  baseSettings: {
    /**
     * 默认主题
     */
    defaultTheme?: string;
    /**
     * 命名约定
     */
    namingConvention: NamingConvention;
    /**
     * 组件前缀
     */
    componentPrefix?: string;
  };
  /**
   * 构建配置
   */
  build: {
    /**
     * 输出格式
     */
    outputFormats: OutputFormat[];
    /**
     * 是否压缩
     */
    minify: boolean;
    /**
     * 是否生成源码映射
     */
    sourceMap: boolean;
    /**
     * 目标环境
     */
    target: string[];
  };
  /**
   * 开发配置
   */
  development: {
    /**
     * 热重载
     */
    hotReload: boolean;
    /**
     * 调试模式
     */
    debug: boolean;
    /**
     * 预览端口
     */
    previewPort?: number;
  };
  /**
   * 文档配置
   */
  documentation: {
    /**
     * 自动生成文档
     */
    autoGenerate: boolean;
    /**
     * 文档模板
     */
    template?: string;
    /**
     * 包含示例代码
     */
    includeExamples: boolean;
  };
  /**
   * 质量控制
   */
  quality: {
    /**
     * 代码检查
     */
    linting: boolean;
    /**
     * 类型检查
     */
    typeChecking: boolean;
    /**
     * 测试覆盖率要求
     */
    testCoverage?: number;
  };
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
   * 输出目录
   */
  outputDir: string;
  /**
   * 输出格式
   */
  formats: OutputFormat[];
  /**
   * 是否压缩
   */
  minify: boolean;
  /**
   * 是否生成类型定义
   */
  generateTypes: boolean;
  /**
   * 外部依赖
   */
  externals?: string[];
  /**
   * 插件配置
   */
  plugins?: Record<string, any>;
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
