/**
 * camera/types.ts
 * 相机系统类型定义
 */

/**
 * 相机配置
 */
export interface CameraConfig {
  /** 视野角度（弧度） */
  fov?: number;

  /** 宽高比 */
  aspect?: number;

  /** 近裁剪面 */
  near?: number;

  /** 远裁剪面 */
  far?: number;
}

/**
 * 轨道控制器配置
 */
export interface OrbitControllerConfig {
  /** 目标点 */
  target?: [number, number, number];

  /** 初始距离 */
  distance?: number;

  /** 最小距离 */
  minDistance?: number;

  /** 最大距离 */
  maxDistance?: number;

  /** 初始方位角（水平旋转，弧度） */
  azimuth?: number;

  /** 初始仰角（垂直旋转，弧度） */
  elevation?: number;

  /** 最小仰角 */
  minElevation?: number;

  /** 最大仰角 */
  maxElevation?: number;

  /** 旋转灵敏度 */
  rotateSpeed?: number;

  /** 缩放灵敏度 */
  zoomSpeed?: number;

  /** 平移灵敏度 */
  panSpeed?: number;

  /** 是否启用阻尼（平滑过渡） */
  enableDamping?: boolean;

  /** 阻尼系数 */
  dampingFactor?: number;

  /** 是否自动旋转 */
  autoRotate?: boolean;

  /** 自动旋转速度（弧度/秒） */
  autoRotateSpeed?: number;
}
