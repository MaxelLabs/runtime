/**
 * Maxellabs 规范入口文件
 * 导出所有规范模块
 *
 * 注意：如果出现命名冲突，需要在各个模块内部使用命名空间或重命名来解决
 */

// 核心规范 - 基础类型和接口
export * from './core';

// 通用规范 - 通用元素和组件
export * from './common';

// 动画规范 - 动画系统和控制
export * from './animation';

// 设计规范 - 设计系统和界面元素
export * from './design';

// 包规范 - 包管理和依赖
export * from './package';

// 渲染规范 - 渲染管线和着色器
export * from './rendering';

// 工作流规范 - 工作流定义和执行
export * from './workflow';
