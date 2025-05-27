/**
 * Maxellabs 动画曲线模块
 * 动画曲线、关键点和数值范围的定义
 */

/**
 * 数值范围
 */
export interface ValueRange {
  /**
   * 最小值
   */
  min: number;
  /**
   * 最大值
   */
  max: number;
}

/**
 * 颜色范围
 */
export interface ColorRange {
  /**
   * 起始颜色 [r, g, b, a]
   */
  start: [number, number, number, number];
  /**
   * 结束颜色 [r, g, b, a]
   */
  end: [number, number, number, number];
}

/**
 * 动画曲线
 */
export interface AnimationCurve {
  /**
   * 关键点
   */
  keys: CurveKey[];
  /**
   * 预设类型
   */
  preset?: CurvePreset;
}

/**
 * 曲线关键点
 */
export interface CurveKey {
  /**
   * 时间（0-1）
   */
  time: number;
  /**
   * 值
   */
  value: number;
  /**
   * 输入切线
   */
  inTangent: number;
  /**
   * 输出切线
   */
  outTangent: number;
}

/**
 * 曲线预设
 */
export enum CurvePreset {
  Constant = 'constant',
  Linear = 'linear',
  Random = 'random',
  Custom = 'custom',
}

/**
 * 颜色曲线
 */
export interface ColorCurve {
  /**
   * 红色通道
   */
  r: AnimationCurve;
  /**
   * 绿色通道
   */
  g: AnimationCurve;
  /**
   * 蓝色通道
   */
  b: AnimationCurve;
  /**
   * 透明度通道
   */
  a: AnimationCurve;
}

/**
 * 速度曲线
 */
export interface VelocityCurve {
  /**
   * X轴速度
   */
  x: AnimationCurve;
  /**
   * Y轴速度
   */
  y: AnimationCurve;
  /**
   * Z轴速度
   */
  z: AnimationCurve;
}
