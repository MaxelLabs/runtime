export interface IBuffer {
  /**
   * 缓冲区类型
   */
  type: number,

  /**
   * 缓冲区用途
   */
  usage: number,

  /**
   * 缓冲区大小
   */
  size: number,

  /**
   * 创建缓冲区
   */
  create(): void,

  /**
   * 销毁缓冲区
   */
  destroy(): void,

  /**
   * 更新缓冲区数据
   * @param data - 要更新的数据
   * @param offset - 偏移量
   */
  update(data: Float32Array | Uint16Array, offset?: number): void,

  /**
   * 绑定缓冲区
   */
  bind(): void,

  /**
   * 解绑缓冲区
   */
  unbind(): void,

  /**
   * 
   */
  destroy(): void
}