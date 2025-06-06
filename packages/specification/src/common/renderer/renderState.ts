/**
 * renderState.ts
 * 渲染状态接口定义
 */

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
 * 面剔除模式
 */
export type CullMode = 'none' | 'front' | 'back';

/**
 * 混合模式
 */
export type BlendMode = 'none' | 'alpha' | 'additive' | 'multiply' | 'screen' | 'overlay' | 'custom';

/**
 * 渲染状态接口
 */
export interface RenderState {
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
  cullMode?: CullMode;

  /**
   * 混合模式
   */
  blendMode?: BlendMode;

  /**
   * 是否写入颜色
   */
  colorWrite?: boolean;
}
