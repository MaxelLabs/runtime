/**
 * resources/index.ts
 * 导出所有资源接口类型
 */

export * from './buffer';
export * from './texture';
export * from './shader';
export * from './vertexArray';

/**
 * RHI资源基础接口
 */
export interface IRHIResource {
  /**
   * 销毁资源
   */
  destroy(): void;
}
