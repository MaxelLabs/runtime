import { BlendFactor, BlendEquation, CullMode, CompareFunc, DepthMask, ShadingModel } from './constants';

/**
 * 渲染状态描述符
 */
export interface IRenderStateDescriptor {
  /**
   * 深度测试状态
   */
  depthTest?: boolean;
  
  /**
   * 深度写入状态
   */
  depthWrite?: DepthMask;
  
  /**
   * 深度比较函数
   */
  depthFunc?: CompareFunc;
  
  /**
   * 是否启用混合
   */
  blend?: boolean;
  
  /**
   * RGB混合方程
   */
  blendEquationRGB?: BlendEquation;
  
  /**
   * Alpha混合方程
   */
  blendEquationAlpha?: BlendEquation;
  
  /**
   * RGB源混合因子
   */
  blendSrcRGB?: BlendFactor;
  
  /**
   * RGB目标混合因子
   */
  blendDstRGB?: BlendFactor;
  
  /**
   * Alpha源混合因子
   */
  blendSrcAlpha?: BlendFactor;
  
  /**
   * Alpha目标混合因子
   */
  blendDstAlpha?: BlendFactor;
  
  /**
   * 剔除模式
   */
  cullMode?: CullMode;
  
  /**
   * 剔除面方向
   */
  frontFace?: 'cw' | 'ccw';
  
  /**
   * 线宽
   */
  lineWidth?: number;
  
  /**
   * 是否启用多重采样抗锯齿
   */
  multisample?: boolean;
  
  /**
   * 是否启用剪裁测试
   */
  scissorTest?: boolean;
  
  /**
   * 剪裁区域
   */
  scissorRect?: {x: number, y: number, width: number, height: number};
  
  /**
   * 是否启用模板测试
   */
  stencilTest?: boolean;
  
  /**
   * 模板测试函数
   */
  stencilFunc?: CompareFunc;
  
  /**
   * 模板测试参考值
   */
  stencilRef?: number;
  
  /**
   * 模板测试掩码
   */
  stencilMask?: number;
  
  /**
   * 模板操作(失败时)
   */
  stencilFail?: number;
  
  /**
   * 模板操作(深度测试失败时)
   */
  stencilZFail?: number;
  
  /**
   * 模板操作(深度测试通过时)
   */
  stencilZPass?: number;
  
  /**
   * 着色模型
   */
  shadingModel?: ShadingModel;
  
  /**
   * 是否启用多边形偏移
   */
  polygonOffset?: boolean;
  
  /**
   * 多边形偏移因子
   */
  polygonOffsetFactor?: number;
  
  /**
   * 多边形偏移单位
   */
  polygonOffsetUnits?: number;
  
  /**
   * 颜色掩码
   */
  colorMask?: [boolean, boolean, boolean, boolean];
}

/**
 * 渲染状态管理接口 - 控制渲染管线状态
 */
export interface IRenderState {
  /**
   * 获取当前渲染状态描述符
   */
  getState(): IRenderStateDescriptor;
  
  /**
   * 设置完整的渲染状态
   * @param state - 渲染状态描述符
   */
  setState(state: IRenderStateDescriptor): void;
  
  /**
   * 设置深度测试状态
   * @param enabled - 是否启用
   */
  setDepthTest(enabled: boolean): void;
  
  /**
   * 设置深度写入状态
   * @param enabled - 是否启用
   */
  setDepthWrite(enabled: DepthMask): void;
  
  /**
   * 设置深度比较函数
   * @param func - 比较函数
   */
  setDepthFunc(func: CompareFunc): void;
  
  /**
   * 设置混合模式
   * @param enabled - 是否启用
   * @param srcFactor - 源因子
   * @param dstFactor - 目标因子
   */
  setBlending(enabled: boolean, srcFactor?: BlendFactor, dstFactor?: BlendFactor): void;
  
  /**
   * 设置高级混合模式
   * @param enabled - 是否启用
   * @param srcRGB - RGB源因子
   * @param dstRGB - RGB目标因子
   * @param srcAlpha - Alpha源因子
   * @param dstAlpha - Alpha目标因子
   * @param equationRGB - RGB混合方程
   * @param equationAlpha - Alpha混合方程
   */
  setBlendingAdvanced(
    enabled: boolean,
    srcRGB: BlendFactor,
    dstRGB: BlendFactor,
    srcAlpha: BlendFactor,
    dstAlpha: BlendFactor,
    equationRGB: BlendEquation,
    equationAlpha: BlendEquation
  ): void;
  
  /**
   * 设置混合颜色
   * @param r - 红色分量
   * @param g - 绿色分量
   * @param b - 蓝色分量
   * @param a - 透明度分量
   */
  setBlendColor(r: number, g: number, b: number, a: number): void;
  
  /**
   * 设置剔除模式
   * @param mode - 剔除模式
   */
  setCullMode(mode: CullMode): void;
  
  /**
   * 设置剔除面方向
   * @param frontFace - 前面方向('cw'顺时针，'ccw'逆时针)
   */
  setFrontFace(frontFace: 'cw' | 'ccw'): void;
  
  /**
   * 设置线宽
   * @param width - 线宽
   */
  setLineWidth(width: number): void;
  
  /**
   * 设置多重采样抗锯齿
   * @param enabled - 是否启用
   */
  setMultisample(enabled: boolean): void;
  
  /**
   * 设置剪裁测试
   * @param enabled - 是否启用
   * @param x - 剪裁区域x坐标
   * @param y - 剪裁区域y坐标
   * @param width - 剪裁区域宽度
   * @param height - 剪裁区域高度
   */
  setScissorTest(enabled: boolean, x?: number, y?: number, width?: number, height?: number): void;
  
  /**
   * 设置模板测试
   * @param enabled - 是否启用
   * @param func - 比较函数
   * @param ref - 参考值
   * @param mask - 掩码
   */
  setStencilTest(enabled: boolean, func?: CompareFunc, ref?: number, mask?: number): void;
  
  /**
   * 设置模板操作
   * @param fail - 失败时操作
   * @param zfail - 深度测试失败时操作
   * @param zpass - 深度测试通过时操作
   */
  setStencilOp(fail: number, zfail: number, zpass: number): void;
  
  /**
   * 设置模板写入掩码
   * @param mask - 掩码
   */
  setStencilWriteMask(mask: number): void;
  
  /**
   * 设置着色模型
   * @param mode - 着色模型
   */
  setShadingModel(mode: ShadingModel): void;
  
  /**
   * 设置多边形偏移
   * @param enabled - 是否启用
   * @param factor - 偏移因子
   * @param units - 偏移单位
   */
  setPolygonOffset(enabled: boolean, factor?: number, units?: number): void;
  
  /**
   * 设置颜色掩码
   * @param r - 红色通道掩码
   * @param g - 绿色通道掩码
   * @param b - 蓝色通道掩码
   * @param a - 透明通道掩码
   */
  setColorMask(r: boolean, g: boolean, b: boolean, a: boolean): void;
  
  /**
   * 保存当前渲染状态
   * @returns 状态ID
   */
  pushState(): number;
  
  /**
   * 恢复之前保存的渲染状态
   * @param stateId - 状态ID，不提供则恢复最近保存的状态
   */
  popState(stateId?: number): void;
  
  /**
   * 重置所有渲染状态到默认值
   */
  resetState(): void;
} 