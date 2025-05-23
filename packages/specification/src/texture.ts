export interface Texture {}
/**
 * Wrapping mode of the texture.
 */
export enum TextureWrapMode {
  /** Clamping mode. use the color of edge pixels beyond the texture boundary. */
  Clamp = 0,
  /** Repeating mode. tiling will be repeated if it exceeds the texture boundary. */
  Repeat = 1,
  /** Mirror repeat mode. tiling will be mirrored and repeated if it exceeds the texture boundary. */
  Mirror = 2,
}

/**
 * Define the compare mode of depth texture.
 */
export enum TextureDepthCompareFunction {
  /** never pass. */
  Never,
  /** pass if the compare value is less than the sample value. */
  Less,
  /** pass if the compare value equals the sample value. */
  Equal,
  /** pass if the compare value is less than or equal to the sample value. */
  LessEqual,
  /** pass if the compare value is greater than the sample value. */
  Greater,
  /** pass if the compare value is not equal to the sample value. */
  NotEqual,
  /** pass if the compare value is greater than or equal to the sample value. */
  GreaterEqual,
  /** always pass. */
  Always,
}
