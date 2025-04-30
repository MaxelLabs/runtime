/**
 * 渲染面类型
 */
export enum CullFace {
  /** 不裁剪面 */
  None,
  /** 裁剪正面 */
  Front,
  /** 裁剪背面 */
  Back,
  /** 裁剪所有面 */
  FrontAndBack
}

/**
 * 混合模式
 */
export enum BlendMode {
  /** 不透明 */
  Opaque,
  /** 透明 */
  Transparent,
  /** 叠加 */
  Additive,
  /** 自定义 */
  Custom
}

/**
 * 深度测试函数
 */
export enum DepthFunc {
  /** 永不通过 */
  Never,
  /** 小于时通过 */
  Less,
  /** 等于时通过 */
  Equal,
  /** 小于等于时通过 */
  LessEqual,
  /** 大于时通过 */
  Greater,
  /** 不等于时通过 */
  NotEqual,
  /** 大于等于时通过 */
  GreaterEqual,
  /** 永远通过 */
  Always
}