/**
 * 雪碧图/帧动画属性
 */
export interface TextureSheetAnimation {
  /**
   * 雪碧图行数
   */
  row: number;
  /**
   * 雪碧图列数
   */
  col: number;
  /**
   * 帧动画总帧数
   * 默认 row * col
   */
  total?: number;
  /**
   * 帧动画开关
   */
  animate: boolean;
}

/**
 * 动画属性
 */
export interface Animation {
  /**
   * 动画名称
   */
  name: string;
  /**
   * 动画持续时间
   */
  duration: number;
  /**
   * 是否循环播放
   */
  loop: boolean;
  /**
   * 动画的帧率
   */
  fps: number;
  /**
   * 雪碧图/帧动画属性
   */
  textureSheetAnimation: TextureSheetAnimation;
}
