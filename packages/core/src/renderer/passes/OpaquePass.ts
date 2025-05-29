/**
 * OpaquePass.ts
 * 不透明物体渲染通道
 *
 * 负责渲染所有不透明的几何体，是前向渲染的核心通道
 */

import { RenderPass } from './RenderPass';
import type { RenderContext } from '../RenderContext';
import type { RenderQueue } from '../RenderQueue';
import type { IRHIRenderPass } from '../../interface/rhi';

/**
 * 不透明物体通道配置
 */
export interface OpaquePassConfig {
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
   * 最大光源数量
   */
  maxLights?: number;

  /**
   * 深度测试模式
   */
  depthTest?: 'never' | 'less' | 'equal' | 'less-equal' | 'greater' | 'not-equal' | 'greater-equal' | 'always';

  /**
   * 是否写入深度
   */
  depthWrite?: boolean;

  /**
   * 面剔除模式
   */
  cullMode?: 'none' | 'front' | 'back';
}

/**
 * 不透明物体渲染通道
 *
 * 特点：
 * - 启用深度测试和深度写入
 * - 不启用混合
 * - 前到后排序以减少overdraw
 * - 支持多光源照明
 */
export class OpaquePass extends RenderPass {
  /**
   * 通道配置
   */
  private readonly passConfig: Required<OpaquePassConfig>;

  /**
   * 构造函数
   */
  constructor(config: OpaquePassConfig) {
    // 创建基础渲染通道配置
    const baseConfig = {
      name: config.name,
      enabled: true,
      priority: 0,
      depthTest: config.depthTest ?? 'less',
      depthWrite: config.depthWrite ?? true,
      cullMode: config.cullMode ?? 'back',
      blendMode: 'none' as const,
    };

    super(baseConfig);

    // 设置通道特定配置
    this.passConfig = {
      name: config.name,
      enableLighting: config.enableLighting ?? true,
      enableShadows: config.enableShadows ?? false,
      maxLights: config.maxLights ?? 32,
      depthTest: config.depthTest ?? 'less',
      depthWrite: config.depthWrite ?? true,
      cullMode: config.cullMode ?? 'back',
    };
  }

  /**
   * 初始化通道
   */
  override async initialize(): Promise<void> {
    await super.initialize();

    // 设置渲染状态
    this.setRenderState({
      depthTest: this.passConfig.depthTest,
      depthWrite: this.passConfig.depthWrite,
      cullMode: this.passConfig.cullMode,
      blendMode: 'none', // 不透明物体不需要混合
    });

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(
        `OpaquePass initialized: lighting=${this.passConfig.enableLighting}, shadows=${this.passConfig.enableShadows}`
      );
    }
  }

  /**
   * 渲染不透明物体
   */
  protected override async render(context: RenderContext, queue: RenderQueue): Promise<void> {
    const startTime = performance.now();

    try {
      // 获取不透明物体
      const opaqueElements = queue.getOpaqueElements();
      if (opaqueElements.length === 0) {
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

      // 渲染不透明物体
      await this.renderOpaqueElements(context, renderPassEncoder, opaqueElements);

      // 结束渲染通道
      renderPassEncoder.end();

      // 更新统计信息
      this.updateStats({
        drawCalls: opaqueElements.length,
        triangles: opaqueElements.reduce((sum, element) => sum + (element.triangleCount || 0), 0),
        vertices: opaqueElements.reduce((sum, element) => sum + (element.vertexCount || 0), 0),
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('OpaquePass execution failed:', error);
      throw error;
    } finally {
      const endTime = performance.now();
      this.updateStats({
        executionTime: endTime - startTime,
      });
    }
  }

  /**
   * 设置全局uniform
   */
  private async setupGlobalUniforms(context: RenderContext, encoder: IRHIRenderPass): Promise<void> {
    // 设置相机矩阵
    const camera = context.getCamera();
    if (camera) {
      const viewMatrix = camera.getViewMatrix();
      const projectionMatrix = camera.getProjectionMatrix();
      const viewProjectionMatrix = projectionMatrix.multiply(viewMatrix);

      // 绑定相机uniform
      const cameraUniform = context.getCameraUniform();
      if (cameraUniform) {
        encoder.setBindGroup(0, cameraUniform);
      }
    }

    // 设置光照uniform
    if (this.passConfig.enableLighting) {
      const lightingUniform = context.getLightingUniform();
      if (lightingUniform) {
        encoder.setBindGroup(1, lightingUniform);
      }
    }

    // 设置阴影uniform
    if (this.passConfig.enableShadows) {
      const shadowUniform = context.getShadowUniform();
      if (shadowUniform) {
        encoder.setBindGroup(2, shadowUniform);
      }
    }
  }

  /**
   * 渲染不透明物体
   */
  private async renderOpaqueElements(
    context: RenderContext,
    encoder: IRHIRenderPass,
    elements: readonly any[]
  ): Promise<void> {
    let currentMaterial: any = null;
    let currentGeometry: any = null;

    for (const element of elements) {
      try {
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
          // 绑定实例uniform
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
        console.error('Failed to render opaque element:', error);
        // 继续渲染其他元素
      }
    }
  }

  /**
   * 获取通道配置
   */
  getPassConfig(): Required<OpaquePassConfig> {
    return { ...this.passConfig };
  }

  /**
   * 设置光照启用状态
   */
  setLightingEnabled(enabled: boolean): void {
    (this.passConfig as any).enableLighting = enabled;
  }

  /**
   * 设置阴影启用状态
   */
  setShadowsEnabled(enabled: boolean): void {
    (this.passConfig as any).enableShadows = enabled;
  }

  /**
   * 获取光照启用状态
   */
  isLightingEnabled(): boolean {
    return this.passConfig.enableLighting;
  }

  /**
   * 获取阴影启用状态
   */
  isShadowsEnabled(): boolean {
    return this.passConfig.enableShadows;
  }
}
