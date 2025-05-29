/**
 * TransparentPass.ts
 * 透明物体渲染通道
 *
 * 负责渲染所有透明的几何体，需要特殊的混合和排序处理
 */

import { RenderPass } from './RenderPass';
import type { RenderContext } from '../RenderContext';
import type { RenderQueue } from '../RenderQueue';
import type { IRHIRenderPassEncoder } from '../../interface/rhi';

/**
 * 混合模式
 */
export type BlendMode = 'alpha' | 'additive' | 'multiply' | 'screen' | 'overlay' | 'custom';

/**
 * 透明物体通道配置
 */
export interface TransparentPassConfig {
  /**
   * 通道名称
   */
  name: string;

  /**
   * 是否启用光照
   */
  enableLighting?: boolean;

  /**
   * 是否启用阴影
   */
  enableShadows?: boolean;

  /**
   * 深度测试模式
   */
  depthTest?: 'never' | 'less' | 'equal' | 'less-equal' | 'greater' | 'not-equal' | 'greater-equal' | 'always';

  /**
   * 是否写入深度
   */
  depthWrite?: boolean;

  /**
   * 混合模式
   */
  blendMode?: BlendMode;

  /**
   * 面剔除模式
   */
  cullMode?: 'none' | 'front' | 'back';

  /**
   * 是否启用深度排序
   */
  enableDepthSort?: boolean;
}

/**
 * 透明物体渲染通道
 *
 * 特点：
 * - 启用深度测试但禁用深度写入
 * - 启用混合
 * - 从后到前排序
 * - 支持多种混合模式
 */
export class TransparentPass extends RenderPass {
  /**
   * 通道配置
   */
  private readonly config: Required<TransparentPassConfig>;

  /**
   * 构造函数
   */
  constructor(config: TransparentPassConfig) {
    super(config.name);

    // 设置默认配置
    this.config = {
      name: config.name,
      enableLighting: config.enableLighting ?? true,
      enableShadows: config.enableShadows ?? false,
      depthTest: config.depthTest ?? 'less',
      depthWrite: config.depthWrite ?? false, // 透明物体通常不写入深度
      blendMode: config.blendMode ?? 'alpha',
      cullMode: config.cullMode ?? 'back',
      enableDepthSort: config.enableDepthSort ?? true,
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
      depthWrite: this.config.depthWrite,
      cullMode: this.config.cullMode,
      blendMode: this.config.blendMode,
    });

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(
        `TransparentPass initialized: blend=${this.config.blendMode}, depthSort=${this.config.enableDepthSort}`
      );
    }
  }

  /**
   * 执行渲染通道
   */
  async execute(context: RenderContext, queue: RenderQueue): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const startTime = performance.now();

    try {
      // 获取透明物体
      let transparentElements = queue.getTransparentElements();
      if (transparentElements.length === 0) {
        return;
      }

      // 深度排序（从后到前）
      if (this.config.enableDepthSort) {
        transparentElements = this.sortTransparentElements(context, transparentElements);
      }

      // 开始渲染通道
      const encoder = context.getCommandEncoder();
      if (!encoder) {
        throw new Error('Command encoder not available');
      }

      const renderPassEncoder = this.beginRenderPass(context, encoder);

      // 设置全局uniform
      await this.setupGlobalUniforms(context, renderPassEncoder);

      // 渲染透明物体
      await this.renderTransparentElements(context, renderPassEncoder, transparentElements);

      // 结束渲染通道
      renderPassEncoder.end();

      // 更新统计信息
      this.updateStats({
        drawCalls: transparentElements.length,
        triangles: transparentElements.reduce((sum, element) => sum + (element.triangleCount || 0), 0),
        vertices: transparentElements.reduce((sum, element) => sum + (element.vertexCount || 0), 0),
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('TransparentPass execution failed:', error);
      throw error;
    } finally {
      const endTime = performance.now();
      this.updateStats({
        executionTime: endTime - startTime,
      });
    }
  }

  /**
   * 排序透明物体（从后到前）
   */
  private sortTransparentElements(context: RenderContext, elements: any[]): any[] {
    const camera = context.getCamera();
    if (!camera) {
      return elements;
    }

    const cameraPosition = camera.getPosition();

    return elements.sort((a, b) => {
      // 计算到相机的距离
      const distanceA = a.worldPosition ? cameraPosition.distanceTo(a.worldPosition) : 0;
      const distanceB = b.worldPosition ? cameraPosition.distanceTo(b.worldPosition) : 0;

      // 从后到前排序（距离大的先渲染）
      return distanceB - distanceA;
    });
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

    // 设置光照uniform
    if (this.config.enableLighting) {
      const lightingUniform = context.getLightingUniform();
      if (lightingUniform) {
        encoder.setBindGroup(1, lightingUniform);
      }
    }

    // 设置阴影uniform
    if (this.config.enableShadows) {
      const shadowUniform = context.getShadowUniform();
      if (shadowUniform) {
        encoder.setBindGroup(2, shadowUniform);
      }
    }
  }

  /**
   * 渲染透明物体
   */
  private async renderTransparentElements(
    context: RenderContext,
    encoder: IRHIRenderPassEncoder,
    elements: any[]
  ): Promise<void> {
    let currentMaterial: any = null;
    let currentGeometry: any = null;
    let currentBlendMode: BlendMode | null = null;

    for (const element of elements) {
      try {
        // 检查是否需要切换混合模式
        const elementBlendMode = element.material?.blendMode || this.config.blendMode;
        if (elementBlendMode !== currentBlendMode) {
          currentBlendMode = elementBlendMode;
          // 这里可以动态切换渲染管线以支持不同的混合模式
          // 实际实现中需要预先创建不同混合模式的管线
        }

        // 材质切换
        if (element.material !== currentMaterial) {
          currentMaterial = element.material;

          // 绑定材质
          if (currentMaterial?.bindGroup) {
            encoder.setBindGroup(3, currentMaterial.bindGroup);
          }

          // 设置渲染管线
          if (currentMaterial?.pipeline) {
            encoder.setPipeline(currentMaterial.pipeline);
          }
        }

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

        // 设置实例数据
        if (element.instanceData) {
          encoder.setBindGroup(4, element.instanceData.bindGroup);
        }

        // 执行绘制
        if (currentGeometry?.indexBuffer) {
          encoder.drawIndexed(currentGeometry.indexCount || 0, element.instanceCount || 1, 0, 0, 0);
        } else {
          encoder.draw(currentGeometry?.vertexCount || 0, element.instanceCount || 1, 0, 0);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to render transparent element:', error);
        // 继续渲染其他元素
      }
    }
  }

  /**
   * 获取通道配置
   */
  getConfig(): Required<TransparentPassConfig> {
    return { ...this.config };
  }

  /**
   * 设置混合模式
   */
  setBlendMode(blendMode: BlendMode): void {
    (this.config as any).blendMode = blendMode;

    // 更新渲染状态
    this.setRenderState({
      blendMode,
    });
  }

  /**
   * 设置深度排序启用状态
   */
  setDepthSortEnabled(enabled: boolean): void {
    (this.config as any).enableDepthSort = enabled;
  }

  /**
   * 获取混合模式
   */
  getBlendMode(): BlendMode {
    return this.config.blendMode;
  }

  /**
   * 获取深度排序启用状态
   */
  isDepthSortEnabled(): boolean {
    return this.config.enableDepthSort;
  }

  /**
   * 设置光照启用状态
   */
  setLightingEnabled(enabled: boolean): void {
    (this.config as any).enableLighting = enabled;
  }

  /**
   * 设置阴影启用状态
   */
  setShadowsEnabled(enabled: boolean): void {
    (this.config as any).enableShadows = enabled;
  }

  /**
   * 获取光照启用状态
   */
  isLightingEnabled(): boolean {
    return this.config.enableLighting;
  }

  /**
   * 获取阴影启用状态
   */
  isShadowsEnabled(): boolean {
    return this.config.enableShadows;
  }
}
