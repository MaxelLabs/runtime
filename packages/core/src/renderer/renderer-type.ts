/**
 * 渲染器类型枚举
 */
export enum RendererType {
  /** WebGL渲染器 */
  WebGL = 0,
  /** WebGL2渲染器 */
  WebGL2 = 1,
  /** WebGPU渲染器 */
  WebGPU = 2,
}

/**
 * 渲染队列类型枚举
 */
export enum RenderQueueType {
  /** 不透明 */
  Opaque = 0,
  /** Alpha测试 */
  AlphaTest = 1,
  /** 透明 */
  Transparent = 2,
  /** 叠加 */
  Overlay = 3,
}
