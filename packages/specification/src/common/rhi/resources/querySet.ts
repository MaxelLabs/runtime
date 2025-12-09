/**
 * querySet.ts
 * 定义查询集资源接口
 */

import type { RHIQueryType } from '../types';

/**
 * 查询集资源接口
 * 用于管理一组 GPU 查询（遮挡查询、时间戳查询等）
 */
export interface IRHIQuerySet {
  /**
   * 查询类型
   */
  readonly type: RHIQueryType;

  /**
   * 查询数量
   */
  readonly count: number;

  /**
   * 资源标签
   */
  readonly label?: string;

  /**
   * 获取查询结果是否可用
   * @param queryIndex 查询索引
   * @returns 结果是否可用
   */
  isResultAvailable(queryIndex: number): boolean;

  /**
   * 获取查询结果
   * 注意：应先检查 isResultAvailable 确认结果可用
   * @param queryIndex 查询索引
   * @returns 查询结果（遮挡查询返回通过的样本数，0 表示完全被遮挡）
   */
  getResult(queryIndex: number): number;

  /**
   * 异步获取查询结果
   * 自动等待结果可用后返回
   * @param queryIndex 查询索引
   * @returns Promise，resolve 时返回查询结果
   */
  getResultAsync(queryIndex: number): Promise<number>;

  /**
   * 重置查询（准备重新使用）
   * @param queryIndex 查询索引
   */
  reset(queryIndex: number): void;

  /**
   * 销毁资源
   */
  destroy(): void;
}
