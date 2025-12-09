/**
 * core/types.ts
 * Demo 核心类型定义
 */

import type { MSpec } from '@maxellabs/core';
import type { WebGLDevice } from '@maxellabs/rhi';

/**
 * Demo 配置选项
 */
export interface DemoConfig {
  /** 画布元素 ID */
  canvasId: string;

  /** Demo 名称（用于日志和标题） */
  name?: string;

  /** WebGL 设备选项 */
  deviceOptions?: {
    antialias?: boolean;
    alpha?: boolean;
    depth?: boolean;
    stencil?: boolean;
    premultipliedAlpha?: boolean;
    preserveDrawingBuffer?: boolean;
    powerPreference?: 'default' | 'high-performance' | 'low-power';
  };

  /** 是否自动调整画布大小 */
  autoResize?: boolean;

  /** 是否显示性能统计（需要 StatsPanel） */
  showStats?: boolean;

  /** 背景清除颜色 [r, g, b, a] */
  clearColor?: [number, number, number, number];
}

/**
 * 渲染回调函数类型
 * @param deltaTime 距上一帧的时间（秒）
 * @param totalTime 总运行时间（秒）
 */
export type RenderCallback = (deltaTime: number, totalTime: number) => void;

/**
 * 资源清理回调
 */
export type CleanupCallback = () => void;

/**
 * 键盘事件回调
 */
export type KeyCallback = (key: string, event: KeyboardEvent) => void;

/**
 * 窗口大小变化回调
 */
export type ResizeCallback = (width: number, height: number) => void;

/**
 * Demo 运行器状态
 */
export enum DemoState {
  /** 未初始化 */
  UNINITIALIZED = 'uninitialized',
  /** 已初始化，未运行 */
  INITIALIZED = 'initialized',
  /** 正在运行 */
  RUNNING = 'running',
  /** 已暂停 */
  PAUSED = 'paused',
  /** 已销毁 */
  DESTROYED = 'destroyed',
}

/**
 * Demo 运行时上下文
 */
export interface DemoContext {
  /** WebGL 设备 */
  device: WebGLDevice;

  /** 画布元素 */
  canvas: HTMLCanvasElement;

  /** 当前帧时间戳 */
  currentTime: number;

  /** 上一帧时间戳 */
  lastTime: number;

  /** 总运行时间 */
  totalTime: number;

  /** 帧计数 */
  frameCount: number;
}

/**
 * 渲染目标纹理配置
 */
export interface RenderTargetConfig {
  /** 宽度（默认为画布宽度） */
  width?: number;

  /** 高度（默认为画布高度） */
  height?: number;

  /** 纹理格式 */
  format?: MSpec.RHITextureFormat;

  /** 是否需要深度缓冲 */
  depth?: boolean;

  /** 标签 */
  label?: string;
}
