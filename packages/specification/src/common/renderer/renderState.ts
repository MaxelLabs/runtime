/**
 * renderState.ts
 * 渲染状态接口定义
 */

import type { BlendMode, RenderMode } from '../../core/';
import type { RHICompareFunction, RHICullMode } from '../rhi';

/**
 * 通用渲染状态接口（扩展版本）
 * 统一简化版本和详细版本的渲染状态
 */
export interface CommonRenderState {
  /**
   * 是否可见
   */
  visible?: boolean;

  /**
   * 透明度
   */
  opacity?: number;

  /**
   * 深度测试模式（使用枚举类型）
   */
  depthTest?: RHICompareFunction;

  /**
   * 是否写入深度
   */
  depthWrite?: boolean;

  /**
   * 面剔除模式
   */
  cullMode?: RHICullMode;

  /**
   * 混合模式
   */
  blendMode?: BlendMode;

  /**
   * 渲染模式
   */
  renderMode?: RenderMode;

  /**
   * 是否写入颜色
   */
  colorWrite?: boolean;

  /**
   * Z索引
   */
  zIndex?: number;
}
