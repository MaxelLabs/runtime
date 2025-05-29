/**
 * DepthPrepass.ts
 * 深度预通道
 *
 * 在主渲染通道之前执行，只写入深度信息，用于减少overdraw
 */

import { RenderPass } from './render-pass';
import type { RenderContext } from '../render-context';
import type { RenderQueue } from '../render-queue';
import type { IRHIRenderPassEncoder } from '../../interface/rhi';

/**
 * 深度预通道配置
 */
export interface DepthPrepassConfig {
  /**
   * 通道名称
   */
  name: string;

  /**
   * 是否启用Early-Z优化
   */
  enableEarlyZ?: boolean;

  /**
   * 深度测试模式
   */
  depthTest?: 'never' | 'less' | 'equal' | 'less-equal' | 'greater' | 'not-equal' | 'greater-equal' | 'always';

  /**
   * 面剔除模式
   */
  cullMode?: 'none' | 'front' | 'back';

  /**
   * 是否渲染透明物体的深度
   */
  includeTransparent?: boolean;

  /**
   * 深度偏移
   */
  depthBias?: number;

  /**
   * 深度偏移斜率
   */
  depthBiasSlope?: number;
}

/**
 * 深度预通道
 *
 * 特点：
 * - 只写入深度，不写入颜色
 * - 使用简化的着色器
 * - 前到后排序以最大化Early-Z效果
 * - 为后续通道提供深度信息
 */
export class DepthPrepass extends RenderPass {
  /**
   * 通道配置
   */
  private readonly config: Required<DepthPrepassConfig>;

  /**
   * 深度预通道材质
   */
  private depthMaterial: any = null;

  /**
   * 构造函数
   */
  constructor(config: DepthPrepassConfig) {
    super(config.name);

    // 设置默认配置
    this.config = {
      name: config.name,
      enableEarlyZ: config.enableEarlyZ ?? true,
      depthTest: config.depthTest ?? 'less',
      cullMode: config.cullMode ?? 'back',
      includeTransparent: config.includeTransparent ?? false,
      depthBias: config.depthBias ?? 0,
      depthBiasSlope: config.depthBiasSlope ?? 0,
    };
  }

  /**
   * 初始化通道
   */
  async initialize(context: RenderContext): Promise<void> {
    await super.initialize(context);

    // 设置渲染状态
    this.setRenderState({
      depthTest: this.config.depthTest,
      depthWrite: true, // 深度预通道必须写入深度
      cullMode: this.config.cullMode,
      blendMode: 'none',
      colorWrite: false, // 不写入颜色
    });

    // 创建深度预通道材质
    await this.createDepthMaterial(context);

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(
        `DepthPrepass initialized: earlyZ=${this.config.enableEarlyZ}, includeTransparent=${this.config.includeTransparent}`
      );
    }
  }

  /**
   * 执行渲染通道
   */
  async execute(context: RenderContext, queue: RenderQueue): Promise<void> {
    if (!this.enabled || !this.depthMaterial) {
      return;
    }

    const startTime = performance.now();

    try {
      // 获取需要渲染深度的物体
      const elements = this.getDepthElements(queue);
      if (elements.length === 0) {
        return;
      }

      // 开始渲染通道
      const encoder = context.getCommandEncoder();
      if (!encoder) {
        throw new Error('Command encoder not available');
      }

      const renderPassEncoder = this.beginRenderPass(context, encoder);

      // 设置全局uniform
      await this.setupGlobalUniforms(context, renderPassEncoder);

      // 渲染深度
      await this.renderDepthElements(context, renderPassEncoder, elements);

      // 结束渲染通道
      renderPassEncoder.end();

      // 更新统计信息
      this.updateStats({
        drawCalls: elements.length,
        triangles: elements.reduce((sum, element) => sum + (element.triangleCount || 0), 0),
        vertices: elements.reduce((sum, element) => sum + (element.vertexCount || 0), 0),
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('DepthPrepass execution failed:', error);
      throw error;
    } finally {
      const endTime = performance.now();
      this.updateStats({
        executionTime: endTime - startTime,
      });
    }
  }

  /**
   * 获取需要渲染深度的元素
   */
  private getDepthElements(queue: RenderQueue): any[] {
    const elements: any[] = [];

    // 添加不透明物体
    elements.push(...queue.getOpaqueElements());

    // 根据配置决定是否包含透明物体
    if (this.config.includeTransparent) {
      // 透明物体也可以写入深度，但需要特殊处理
      const transparentElements = queue.getTransparentElements();
      // 只包含那些需要写入深度的透明物体
      elements.push(...transparentElements.filter((element) => element.writeDepth));
    }

    // 前到后排序以最大化Early-Z效果
    return this.sortFrontToBack(elements);
  }

  /**
   * 前到后排序
   */
  private sortFrontToBack(elements: any[]): any[] {
    // TODO: 实现基于相机距离的前到后排序
    // 这里需要计算每个物体到相机的距离并排序
    return elements.sort((a, b) => {
      const distanceA = a.cameraDistance || 0;
      const distanceB = b.cameraDistance || 0;
      return distanceA - distanceB; // 前到后排序
    });
  }

  /**
   * 创建深度材质
   */
  private async createDepthMaterial(context: RenderContext): Promise<void> {
    // TODO: 创建专用的深度着色器
    // 深度着色器特点：
    // 1. 顶点着色器只计算位置变换
    // 2. 片段着色器为空或只处理alpha测试
    // 3. 不计算光照、纹理等复杂操作

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Creating depth prepass material...');
    }

    // 临时实现
    this.depthMaterial = {
      pipeline: null, // TODO: 创建深度预通道的渲染管线
      bindGroup: null, // TODO: 创建必要的绑定组
    };
  }

  /**
   * 设置全局uniform
   */
  private async setupGlobalUniforms(context: RenderContext, encoder: IRHIRenderPassEncoder): Promise<void> {
    // 设置相机矩阵
    const camera = context.getCamera();
    if (camera) {
      const cameraUniform = context.getCameraUniform();
      if (cameraUniform) {
        encoder.setBindGroup(0, cameraUniform);
      }
    }

    // 深度预通道不需要光照uniform
  }

  /**
   * 渲染深度元素
   */
  private async renderDepthElements(
    context: RenderContext,
    encoder: IRHIRenderPassEncoder,
    elements: any[]
  ): Promise<void> {
    let currentGeometry: any = null;

    // 设置深度材质的渲染管线
    if (this.depthMaterial?.pipeline) {
      encoder.setPipeline(this.depthMaterial.pipeline);
    }

    for (const element of elements) {
      try {
        // 几何体切换
        if (element.geometry !== currentGeometry) {
          currentGeometry = element.geometry;

          // 绑定顶点缓冲区
          if (currentGeometry?.vertexBuffer) {
            encoder.setVertexBuffer(0, currentGeometry.vertexBuffer);
          }

          // 绑定索引缓冲区
          if (currentGeometry?.indexBuffer) {
            encoder.setIndexBuffer(currentGeometry.indexBuffer, 'uint16');
          }
        }

        // 设置实例数据（变换矩阵）
        if (element.instanceData) {
          encoder.setBindGroup(1, element.instanceData.bindGroup);
        }

        // 执行绘制
        if (currentGeometry?.indexBuffer) {
          encoder.drawIndexed(currentGeometry.indexCount || 0, element.instanceCount || 1, 0, 0, 0);
        } else {
          encoder.draw(currentGeometry?.vertexCount || 0, element.instanceCount || 1, 0, 0);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to render depth element:', error);
        // 继续渲染其他元素
      }
    }
  }

  /**
   * 获取通道配置
   */
  getConfig(): Required<DepthPrepassConfig> {
    return { ...this.config };
  }

  /**
   * 设置Early-Z启用状态
   */
  setEarlyZEnabled(enabled: boolean): void {
    (this.config as any).enableEarlyZ = enabled;
  }

  /**
   * 设置是否包含透明物体
   */
  setIncludeTransparent(include: boolean): void {
    (this.config as any).includeTransparent = include;
  }

  /**
   * 获取Early-Z启用状态
   */
  isEarlyZEnabled(): boolean {
    return this.config.enableEarlyZ;
  }

  /**
   * 获取是否包含透明物体
   */
  isIncludeTransparent(): boolean {
    return this.config.includeTransparent;
  }

  /**
   * 设置深度偏移
   */
  setDepthBias(bias: number, slopeBias: number = 0): void {
    (this.config as any).depthBias = bias;
    (this.config as any).depthBiasSlope = slopeBias;
  }

  /**
   * 获取深度偏移
   */
  getDepthBias(): { bias: number; slopeBias: number } {
    return {
      bias: this.config.depthBias,
      slopeBias: this.config.depthBiasSlope,
    };
  }

  /**
   * 销毁资源
   */
  async destroy(): Promise<void> {
    // 清理深度材质
    this.depthMaterial = null;

    await super.destroy();
  }
}
