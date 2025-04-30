/**
 * 渲染统计信息接口 - 提供性能监控数据
 */
export interface IRenderStats {
  /**
   * 绘制调用次数
   */
  drawCalls: number;
  
  /**
   * 渲染的三角形数量
   */
  triangles: number;
  
  /**
   * 渲染的顶点数量
   */
  vertices: number;
  
  /**
   * 着色器切换次数
   */
  shaderSwitches: number;
  
  /**
   * 纹理绑定次数
   */
  textureBindings: number;
  
  /**
   * 缓冲区绑定次数
   */
  bufferBindings: number;
  
  /**
   * 帧率
   */
  fps: number;
  
  /**
   * 帧时间(毫秒)
   */
  frameTime: number;
  
  /**
   * 重置统计计数器
   */
  reset(): void;
  
  /**
   * 开始帧计时
   */
  beginFrame(): void;
  
  /**
   * 结束帧计时
   */
  endFrame(): void;
} 