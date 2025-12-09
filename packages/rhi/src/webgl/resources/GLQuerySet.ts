import { MSpec } from '@maxellabs/core';

/**
 * WebGL查询集实现
 * 用于管理一组GPU查询（遮挡查询、时间戳查询等）
 *
 * @remarks
 * - WebGL 2.0 原生支持遮挡查询
 * - WebGL 1.0 需要 EXT_occlusion_query_boolean 扩展（不完全支持）
 * - 时间戳查询需要 EXT_disjoint_timer_query 扩展
 */
export class GLQuerySet implements MSpec.IRHIQuerySet {
  private gl: WebGL2RenderingContext;
  private queries: (WebGLQuery | null)[];
  private isWebGL2: boolean;
  private isDestroyed = false;

  /**
   * 查询类型
   */
  readonly type: MSpec.RHIQueryType;

  /**
   * 查询数量
   */
  readonly count: number;

  /**
   * 资源标签
   */
  readonly label?: string;

  /**
   * 创建WebGL查询集
   *
   * @param gl WebGL2上下文
   * @param descriptor 查询集描述符
   */
  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext, descriptor: MSpec.RHIQuerySetDescriptor) {
    this.isWebGL2 = gl instanceof WebGL2RenderingContext;

    if (!this.isWebGL2) {
      throw new Error('WebGL查询集需要WebGL 2.0支持');
    }

    this.gl = gl as WebGL2RenderingContext;
    this.type = descriptor.type;
    this.count = descriptor.count;
    this.label = descriptor.label;

    // 验证查询类型支持
    this.validateQueryTypeSupport(descriptor.type);

    // 创建查询对象数组
    this.queries = new Array(descriptor.count).fill(null);

    // 预创建所有查询对象
    for (let i = 0; i < descriptor.count; i++) {
      const query = this.gl.createQuery();

      if (!query) {
        // 清理已创建的查询
        this.destroyPartialQueries(i);
        throw new Error(`创建WebGL查询对象失败，索引: ${i}`);
      }
      this.queries[i] = query;
    }
  }

  /**
   * 验证查询类型是否支持
   */
  private validateQueryTypeSupport(type: MSpec.RHIQueryType): void {
    switch (type) {
      case MSpec.RHIQueryType.OCCLUSION:
        // WebGL 2.0 原生支持
        break;
      case MSpec.RHIQueryType.TIMESTAMP: {
        // 需要检查 EXT_disjoint_timer_query 扩展
        const timerExt = this.gl.getExtension('EXT_disjoint_timer_query_webgl2');

        if (!timerExt) {
          throw new Error('时间戳查询需要 EXT_disjoint_timer_query_webgl2 扩展，当前浏览器不支持');
        }
        break;
      }
      case MSpec.RHIQueryType.PIPELINE_STATISTICS:
        throw new Error('WebGL不支持管线统计查询');
      default:
        throw new Error(`不支持的查询类型: ${type}`);
    }
  }

  /**
   * 部分销毁（创建失败时使用）
   */
  private destroyPartialQueries(upToIndex: number): void {
    for (let i = 0; i < upToIndex; i++) {
      if (this.queries[i]) {
        this.gl.deleteQuery(this.queries[i]!);
        this.queries[i] = null;
      }
    }
  }

  /**
   * 获取WebGL查询目标
   */
  getGLQueryTarget(): number {
    switch (this.type) {
      case MSpec.RHIQueryType.OCCLUSION:
        // 使用保守模式，性能更好
        return this.gl.ANY_SAMPLES_PASSED_CONSERVATIVE;
      case MSpec.RHIQueryType.TIMESTAMP:
        // 时间戳查询目标
        return 0x8e28; // GL_TIME_ELAPSED (需要扩展)
      default:
        return this.gl.ANY_SAMPLES_PASSED_CONSERVATIVE;
    }
  }

  /**
   * 获取原生WebGL查询对象
   *
   * @param queryIndex 查询索引
   * @returns WebGL查询对象
   */
  getGLQuery(queryIndex: number): WebGLQuery | null {
    this.validateQueryIndex(queryIndex);

    return this.queries[queryIndex];
  }

  /**
   * 验证查询索引
   */
  private validateQueryIndex(queryIndex: number): void {
    if (this.isDestroyed) {
      throw new Error('查询集已被销毁');
    }
    if (queryIndex < 0 || queryIndex >= this.count) {
      throw new Error(`查询索引越界: ${queryIndex}, 有效范围: 0-${this.count - 1}`);
    }
  }

  /**
   * 获取查询结果是否可用
   *
   * @param queryIndex 查询索引
   * @returns 结果是否可用
   */
  isResultAvailable(queryIndex: number): boolean {
    this.validateQueryIndex(queryIndex);

    const query = this.queries[queryIndex];

    if (!query) {
      return false;
    }

    return this.gl.getQueryParameter(query, this.gl.QUERY_RESULT_AVAILABLE) as boolean;
  }

  /**
   * 获取查询结果
   * 注意：应先检查 isResultAvailable 确认结果可用
   *
   * @param queryIndex 查询索引
   * @returns 查询结果（遮挡查询返回通过的样本数，0 表示完全被遮挡）
   */
  getResult(queryIndex: number): number {
    this.validateQueryIndex(queryIndex);

    const query = this.queries[queryIndex];

    if (!query) {
      console.warn(`查询对象不存在，索引: ${queryIndex}`);

      return 0;
    }

    // 检查结果是否可用
    if (!this.isResultAvailable(queryIndex)) {
      console.warn(`查询结果尚未可用，索引: ${queryIndex}`);

      return 0;
    }

    return this.gl.getQueryParameter(query, this.gl.QUERY_RESULT) as number;
  }

  /**
   * 异步获取查询结果
   * 自动等待结果可用后返回
   *
   * @param queryIndex 查询索引
   * @returns Promise，resolve 时返回查询结果
   */
  async getResultAsync(queryIndex: number): Promise<number> {
    this.validateQueryIndex(queryIndex);

    const query = this.queries[queryIndex];

    if (!query) {
      throw new Error(`查询对象不存在，索引: ${queryIndex}`);
    }

    // 轮询等待结果
    return new Promise((resolve, reject) => {
      const maxWaitTime = 1000; // 最大等待时间 1 秒
      const startTime = performance.now();
      const pollInterval = 1; // 轮询间隔 1ms

      const poll = () => {
        if (this.isDestroyed) {
          reject(new Error('查询集已被销毁'));

          return;
        }

        if (this.isResultAvailable(queryIndex)) {
          resolve(this.gl.getQueryParameter(query, this.gl.QUERY_RESULT) as number);

          return;
        }

        // 超时检查
        if (performance.now() - startTime > maxWaitTime) {
          reject(new Error(`查询结果等待超时，索引: ${queryIndex}`));

          return;
        }

        // 继续轮询
        setTimeout(poll, pollInterval);
      };

      poll();
    });
  }

  /**
   * 重置查询（准备重新使用）
   *
   * @param queryIndex 查询索引
   */
  reset(queryIndex: number): void {
    this.validateQueryIndex(queryIndex);

    // WebGL 2.0 中，查询对象在下一次 beginQuery 时自动重置
    // 这里不需要做任何操作，但保留方法以保持接口一致性

    // 如果需要显式重置，可以删除并重新创建查询对象
    const oldQuery = this.queries[queryIndex];

    if (oldQuery) {
      this.gl.deleteQuery(oldQuery);
    }

    const newQuery = this.gl.createQuery();

    if (!newQuery) {
      throw new Error(`重置查询失败，无法创建新查询对象，索引: ${queryIndex}`);
    }

    this.queries[queryIndex] = newQuery;
  }

  /**
   * 销毁资源
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    for (let i = 0; i < this.queries.length; i++) {
      if (this.queries[i]) {
        this.gl.deleteQuery(this.queries[i]!);
        this.queries[i] = null;
      }
    }

    this.isDestroyed = true;
  }
}
