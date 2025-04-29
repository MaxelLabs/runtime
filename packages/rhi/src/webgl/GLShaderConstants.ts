/**
 * WebGL着色器常量
 * 
 * 该常量对象提供了预定义的常用着色器源代码，包括标准渲染着色器和后处理着色器。
 * 这些预定义着色器可用于快速实现常见的渲染场景，无需手动编写GLSL代码。
 */
export const GLShaderConstants = {
  /**
   * 标准顶点着色器
   * 
   * 接收顶点位置、纹理坐标和颜色，应用模型视图和投影变换。
   * 支持顶点颜色和全局颜色混合。
   * 
   * 属性:
   * - aPosition: vec3 - 顶点位置
   * - aTexCoord: vec2 - 纹理坐标
   * - aColor: vec4 - 顶点颜色
   * 
   * Uniform变量:
   * - uModelViewMatrix: mat4 - 模型视图矩阵
   * - uProjectionMatrix: mat4 - 投影矩阵
   * - uColor: vec4 - 全局颜色
   */
  VERTEX_SHADER: `
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    attribute vec4 aColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform vec4 uColor;

    varying vec2 vTexCoord;
    varying vec4 vColor;

    void main() {
      vTexCoord = aTexCoord;
      vColor = aColor * uColor;
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
    }
  `,

  /**
   * 标准片段着色器
   * 
   * 结合纹理采样、顶点颜色和全局颜色计算最终像素颜色。
   * 支持透明度混合。
   * 
   * Uniform变量:
   * - uTexture: sampler2D - 纹理采样器
   * - uColor: vec4 - 全局颜色
   * 
   * Varying变量:
   * - vTexCoord: vec2 - 从顶点着色器传递的纹理坐标
   * - vColor: vec4 - 从顶点着色器传递的颜色
   */
  FRAGMENT_SHADER: `
    precision mediump float;

    uniform sampler2D uTexture;
    uniform vec4 uColor;

    varying vec2 vTexCoord;
    varying vec4 vColor;

    void main() {
      vec4 texColor = texture2D(uTexture, vTexCoord);
      gl_FragColor = texColor * vColor * uColor;
    }
  `,

  /**
   * 后处理顶点着色器
   * 
   * 用于全屏四边形渲染，实现后处理效果。
   * 将顶点位置直接映射到NDC空间（标准化设备坐标）。
   * 
   * 属性:
   * - aPosition: vec2 - 顶点位置 (-1 to 1 范围)
   * - aTexCoord: vec2 - 纹理坐标 (0 to 1 范围)
   */
  POST_PROCESS_VERTEX_SHADER: `
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;

    varying vec2 vTexCoord;

    void main() {
      vTexCoord = aTexCoord;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `,

  /**
   * 后处理片段着色器
   * 
   * 基础的后处理着色器，可用于实现各种屏幕空间效果。
   * 默认实现仅传递原始颜色，可以扩展实现更复杂的效果。
   * 
   * Uniform变量:
   * - uTexture: sampler2D - 输入纹理（通常是场景渲染结果）
   * - uResolution: vec2 - 渲染目标分辨率
   * - uTime: float - 动画时间（秒）
   * - uIntensity: float - 效果强度参数
   */
  POST_PROCESS_FRAGMENT_SHADER: `
    precision mediump float;

    uniform sampler2D uTexture;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uIntensity;

    varying vec2 vTexCoord;

    void main() {
      vec4 color = texture2D(uTexture, vTexCoord);
      gl_FragColor = color;
    }
  `,
} as const;