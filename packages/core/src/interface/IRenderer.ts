import type { IBuffer } from './IBuffer';
import type { Matrix4, Color } from '@sruim/math';

export interface IRenderer {
  /**
   * 画布宽度
   */
  width: number,
  /**
   * 画布高度
   */
  height: number,
  /**
   * 创建渲染器
   * @param canvas - WebGL画布
   */
  create(canvas: HTMLCanvasElement): void,
  /**
   * 销毁渲染器
   */
  destroy(): void,
  /**
   * 设置视口大小
   * @param width - 宽度
   * @param height - 高度
   */
  setViewport(width: number, height: number): void,
  /**
   * 清除画布
   * @param color - 清除颜色
   */
  clear(color?: Color): void,
  /**
   * 设置变换矩阵
   * @param matrix - 变换矩阵
   */
  setTransform(matrix: Matrix4): void,
  /**
   * 创建缓冲区
   * @param type - 缓冲区类型
   * @param usage - 缓冲区用途
   * @param size - 缓冲区大小
   * @returns 缓冲区对象
   */
  createBuffer(type: number, usage: number, size: number): IBuffer,
  /**
   * 销毁缓冲区
   * @param buffer - 缓冲区对象
   */
  destroyBuffer(buffer: IBuffer): void,
  /**
   * 绘制
   * @param mode - 绘制模式
   * @param count - 顶点数量
   * @param offset - 偏移量
   */
  draw(mode: number, count: number, offset?: number): void,
  /**
   * 使用索引绘制
   * @param mode - 绘制模式
   * @param count - 索引数量
   * @param offset - 偏移量
   */
  drawIndexed(mode: number, count: number, offset?: number): void,
}