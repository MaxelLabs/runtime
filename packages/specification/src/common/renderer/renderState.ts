/**
 * renderState.ts
 * 渲染状态接口定义
 */

import type { BlendMode, RHICullMode } from '../../core/enums';

/**
 * 深度测试模式
 */
export type DepthTestMode =
  | 'never'
  | 'less'
  | 'equal'
  | 'less-equal'
  | 'greater'
  | 'not-equal'
  | 'greater-equal'
  | 'always';

/**
 * 通用渲染状态接口
 */
export interface CommonRenderState {
  /**
   * 深度测试模式
   */
  depthTest?: DepthTestMode;

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
   * 是否写入颜色
   */
  colorWrite?: boolean;
}
