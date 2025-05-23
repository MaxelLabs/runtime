/**
 * 播放器版本
 */
export interface PlayerVersion {
  /**
   * Web端版本号
   */
  web: string;
  /**
   * Native端版本号
   */
  native: string;
}

/**
 * 渲染等级
 */
export enum RenderLevel {
  S = 'S',
  APlus = 'A+',
  A = 'A',
  BPlus = 'B+',
  B = 'B',
}

/**
 * 混合模式
 */
export enum BlendingMode {
  /**
   * 普通混合模式
   */
  ALPHA = 0,
  /**
   * 叠加混合模式
   */
  ADD,
  /**
   * 相乘混合模式
   */
  MULTIPLY,
  /**
   * 亮度混合模式
   */
  BRIGHTNESS,
  /**
   * 减色混合模式
   */
  SUBTRACTION,
  /**
   * 强光混合模式
   */
  STRONG_LIGHT,
  /**
   * 弱光混合模式
   */
  WEAK_LIGHT,
  /**
   * 亮度叠加混合模式
   */
  SUPERPOSITION,
}

/**
 * 单双面模式
 */
export enum SideMode {
  /**
   * 双面模式
   */
  DOUBLE = 1032,
  /**
   * 正面模式
   */
  FRONT = 1028,
  /**
   * 背面模式
   */
  BACK = 1029,
}

/**
 * 蒙版模式
 */
export enum MaskMode {
  /**
   * 无蒙版
   */
  NONE = 0,
  /**
   * 蒙版
   */
  MASK = 1,
  /**
   * 被遮挡
   */
  OBSCURED = 2,
  /**
   * 被反向遮挡
   */
  REVERSE_OBSCURED = 3,
}

/**
 * 元素类型
 */
export enum ItemType {
  /**
   * 错误元素
   */
  base = 0,
  /**
   * 图层元素
   */
  sprite = 1,
  /**
   * 粒子元素
   */
  particle = 2,
  /**
   * 空节点元素
   */
  tree = 3,
  /**
   * 相机元素
   */
  camera = 4,
  /**
   * 预合成元素
   */
  prefab = 5,
  /**
   * mesh 元素
   */
  mesh = 6,
  /**
   * 文本元素
   */
  text = 7,
  /**
   * 天空盒元素
   */
  skybox = 8,
  /**
   * 灯光元素
   */
  light = 9,
  /**
   * Spine 元素
   */
  spine = 'spine',
}

/**
 * 发射器形状
 */
export enum ShapeType {
  /**
   * 没有类型
   */
  NONE = 0,
  /**
   * 圆球
   */
  SPHERE = 1,
  /**
   * 圆锥
   */
  CONE = 2,
  /**
   * 半球
   */
  HEMISPHERE = 3,
  /**
   * 圆
   */
  CIRCLE = 4,
  /**
   * 圆环
   */
  DONUT = 5,
  /**
   * 矩形
   */
  RECTANGLE = 6,
  /**
   * 矩形框
   */
  RECTANGLE_EDGE = 7,
  /**
   * 直线
   */
  EDGE = 8,
  /**
   * 贴图
   */
  TEXTURE = 9,
}
