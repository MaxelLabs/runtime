/**
 * ShadowPass.ts
 * 阴影渲染通道
 *
 * 负责生成阴影贴图，支持多种阴影技术
 */

import { RenderPass } from './render-pass';
import type { RenderContext } from '../render-context';
import type { RenderQueue } from '../render-queue';
import type { IRHIRenderPassEncoder } from '../../interface/rhi';

/**
 * 阴影质量级别
 */
export type ShadowQuality = 'low' | 'medium' | 'high' | 'ultra';

/**
 * 阴影类型
 */
export type ShadowType = 'hard' | 'pcf' | 'pcss' | 'vsm' | 'esm';

/**
 * 阴影通道配置
 */
export interface ShadowPassConfig {
  /**
   * 通道名称
   */
  name: string;

  /**
   * 阴影贴图尺寸
   */
  shadowMapSize?: number;

  /**
   * 阴影质量
   */
  shadowQuality?: ShadowQuality;

  /**
   * 阴影类型
   */
  shadowType?: ShadowType;

  /**
   * 最大阴影距离
   */
  maxShadowDistance?: number;

  /**
   * 阴影偏移
   */
  shadowBias?: number;

  /**
   * 阴影法线偏移
   */
  shadowNormalBias?: number;

  /**
   * 级联阴影级数（用于CSM）
   */
  cascadeCount?: number;

  /**
   * 级联分割比例
   */
  cascadeSplitRatio?: number[];

  /**
   * 是否启用软阴影
   */
  enableSoftShadows?: boolean;

  /**
   * PCF采样半径
   */
  pcfRadius?: number;
}

/**
 * 阴影渲染通道
 *
 * 特点：
 * - 从光源视角渲染深度信息
 * - 支持定向光、点光源、聚光灯阴影
 * - 支持级联阴影贴图（CSM）
 * - 支持多种阴影过滤技术
 */
export class ShadowPass extends RenderPass {
  /**
   * 通道配置
   */
  private readonly config: Required<ShadowPassConfig>;

  /**
   * 阴影贴图
   */
  private shadowMaps: Map<string, any> = new Map();

  /**
   * 阴影材质
   */
  private shadowMaterial: any = null;

  /**
   * 光源视图矩阵缓存
   */
  private lightViewMatrices: Map<string, any> = new Map();

  /**
   * 构造函数
   */
  constructor(config: ShadowPassConfig) {
    super(config.name);

    // 设置默认配置
    this.config = {
      name: config.name,
      shadowMapSize: config.shadowMapSize ?? this.getShadowMapSizeForQuality(config.shadowQuality ?? 'medium'),
      shadowQuality: config.shadowQuality ?? 'medium',
      shadowType: config.shadowType ?? 'pcf',
      maxShadowDistance: config.maxShadowDistance ?? 100,
      shadowBias: config.shadowBias ?? 0.005,
      shadowNormalBias: config.shadowNormalBias ?? 0.1,
      cascadeCount: config.cascadeCount ?? 4,
      cascadeSplitRatio: config.cascadeSplitRatio ?? [0.1, 0.25, 0.5, 1.0],
      enableSoftShadows: config.enableSoftShadows ?? true,
      pcfRadius: config.pcfRadius ?? 2.0,
    };
  }

  /**
   * 根据质量级别获取阴影贴图尺寸
   */
  private getShadowMapSizeForQuality(quality: ShadowQuality): number {
    switch (quality) {
      case 'low':
        return 512;
      case 'medium':
        return 1024;
      case 'high':
        return 2048;
      case 'ultra':
        return 4096;
      default:
        return 1024;
    }
  }

  /**
   * 初始化通道
   */
  async initialize(context: RenderContext): Promise<void> {
    await super.initialize(context);

    // 设置渲染状态
    this.setRenderState({
      depthTest: 'less',
      depthWrite: true,
      cullMode: 'front', // 使用前面剔除减少阴影失真
      blendMode: 'none',
      colorWrite: false, // 阴影通道只写入深度
    });

    // 创建阴影材质
    await this.createShadowMaterial(context);

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(
        `ShadowPass initialized: size=${this.config.shadowMapSize}, quality=${this.config.shadowQuality}, type=${this.config.shadowType}`
      );
    }
  }

  /**
   * 执行渲染通道
   */
  async execute(context: RenderContext, queue: RenderQueue): Promise<void> {
    if (!this.enabled || !this.shadowMaterial) {
      return;
    }

    const startTime = performance.now();

    try {
      // 获取投射阴影的光源
      const shadowCasters = this.getShadowCastingLights(context);
      if (shadowCasters.length === 0) {
        return;
      }

      let totalDrawCalls = 0;
      let totalTriangles = 0;
      let totalVertices = 0;

      // 为每个光源渲染阴影贴图
      for (const light of shadowCasters) {
        const stats = await this.renderShadowMapForLight(context, queue, light);
        totalDrawCalls += stats.drawCalls;
        totalTriangles += stats.triangles;
        totalVertices += stats.vertices;
      }

      // 更新统计信息
      this.updateStats({
        drawCalls: totalDrawCalls,
        triangles: totalTriangles,
        vertices: totalVertices,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('ShadowPass execution failed:', error);
      throw error;
    } finally {
      const endTime = performance.now();
      this.updateStats({
        executionTime: endTime - startTime,
      });
    }
  }

  /**
   * 获取投射阴影的光源
   */
  private getShadowCastingLights(context: RenderContext): any[] {
    // TODO: 从渲染上下文获取启用阴影的光源
    const lights = context.getLights();
    return lights.filter((light: any) => light.castShadows);
  }

  /**
   * 为单个光源渲染阴影贴图
   */
  private async renderShadowMapForLight(
    context: RenderContext,
    queue: RenderQueue,
    light: any
  ): Promise<{
    drawCalls: number;
    triangles: number;
    vertices: number;
  }> {
    const lightType = light.type;

    switch (lightType) {
      case 'directional':
        return await this.renderDirectionalLightShadow(context, queue, light);
      case 'point':
        return await this.renderPointLightShadow(context, queue, light);
      case 'spot':
        return await this.renderSpotLightShadow(context, queue, light);
      default:
        return { drawCalls: 0, triangles: 0, vertices: 0 };
    }
  }

  /**
   * 渲染定向光阴影（级联阴影贴图）
   */
  private async renderDirectionalLightShadow(
    context: RenderContext,
    queue: RenderQueue,
    light: any
  ): Promise<{
    drawCalls: number;
    triangles: number;
    vertices: number;
  }> {
    const totalStats = { drawCalls: 0, triangles: 0, vertices: 0 };

    // 计算级联阴影的视锥体分割
    const cascadeFrustums = this.calculateCascadeFrustums(context, light);

    for (let i = 0; i < this.config.cascadeCount; i++) {
      const frustum = cascadeFrustums[i];
      const shadowMap = this.getOrCreateShadowMap(`directional_${light.id}_cascade_${i}`);

      // 计算光源视图投影矩阵
      const lightViewProjection = this.calculateDirectionalLightMatrix(light, frustum);

      // 渲染这个级联的阴影贴图
      const stats = await this.renderShadowMapPass(context, queue, shadowMap, lightViewProjection);
      totalStats.drawCalls += stats.drawCalls;
      totalStats.triangles += stats.triangles;
      totalStats.vertices += stats.vertices;
    }

    return totalStats;
  }

  /**
   * 渲染点光源阴影（立方体阴影贴图）
   */
  private async renderPointLightShadow(
    context: RenderContext,
    queue: RenderQueue,
    light: any
  ): Promise<{
    drawCalls: number;
    triangles: number;
    vertices: number;
  }> {
    const totalStats = { drawCalls: 0, triangles: 0, vertices: 0 };

    // 点光源需要渲染6个面
    const faces = ['positive-x', 'negative-x', 'positive-y', 'negative-y', 'positive-z', 'negative-z'];

    for (const face of faces) {
      const shadowMap = this.getOrCreateShadowMap(`point_${light.id}_${face}`);

      // 计算这个面的视图投影矩阵
      const lightViewProjection = this.calculatePointLightMatrix(light, face);

      // 渲染这个面的阴影贴图
      const stats = await this.renderShadowMapPass(context, queue, shadowMap, lightViewProjection);
      totalStats.drawCalls += stats.drawCalls;
      totalStats.triangles += stats.triangles;
      totalStats.vertices += stats.vertices;
    }

    return totalStats;
  }

  /**
   * 渲染聚光灯阴影
   */
  private async renderSpotLightShadow(
    context: RenderContext,
    queue: RenderQueue,
    light: any
  ): Promise<{
    drawCalls: number;
    triangles: number;
    vertices: number;
  }> {
    const shadowMap = this.getOrCreateShadowMap(`spot_${light.id}`);

    // 计算聚光灯视图投影矩阵
    const lightViewProjection = this.calculateSpotLightMatrix(light);

    // 渲染阴影贴图
    return await this.renderShadowMapPass(context, queue, shadowMap, lightViewProjection);
  }

  /**
   * 渲染单个阴影贴图通道
   */
  private async renderShadowMapPass(
    context: RenderContext,
    queue: RenderQueue,
    shadowMap: any,
    lightViewProjection: any
  ): Promise<{ drawCalls: number; triangles: number; vertices: number }> {
    // 获取投射阴影的物体
    const shadowCasters = queue.getShadowCasters();
    if (shadowCasters.length === 0) {
      return { drawCalls: 0, triangles: 0, vertices: 0 };
    }

    // 开始阴影贴图渲染通道
    const encoder = context.getCommandEncoder();
    if (!encoder) {
      throw new Error('Command encoder not available');
    }

    const renderPassEncoder = this.beginRenderPass(context, encoder, shadowMap);

    // 设置光源视图投影矩阵
    await this.setupShadowUniforms(context, renderPassEncoder, lightViewProjection);

    // 渲染阴影投射者
    await this.renderShadowCasters(context, renderPassEncoder, shadowCasters);

    // 结束渲染通道
    renderPassEncoder.end();

    return {
      drawCalls: shadowCasters.length,
      triangles: shadowCasters.reduce((sum, element) => sum + (element.triangleCount || 0), 0),
      vertices: shadowCasters.reduce((sum, element) => sum + (element.vertexCount || 0), 0),
    };
  }

  /**
   * 计算级联阴影的视锥体分割
   */
  private calculateCascadeFrustums(context: RenderContext, light: any): any[] {
    // TODO: 实现级联阴影的视锥体分割算法
    const camera = context.getCamera();
    const frustums: any[] = [];

    for (let i = 0; i < this.config.cascadeCount; i++) {
      // 计算每个级联的近远平面
      const nearRatio = i === 0 ? 0 : this.config.cascadeSplitRatio[i - 1];
      const farRatio = this.config.cascadeSplitRatio[i];

      // TODO: 根据相机视锥体和分割比例计算级联视锥体
      frustums.push({
        near: nearRatio * this.config.maxShadowDistance,
        far: farRatio * this.config.maxShadowDistance,
        // ... 其他视锥体参数
      });
    }

    return frustums;
  }

  /**
   * 计算定向光的视图投影矩阵
   */
  private calculateDirectionalLightMatrix(light: any, frustum: any): any {
    // TODO: 实现定向光的正交投影矩阵计算
    // 需要根据视锥体和光源方向计算合适的正交投影
    return null;
  }

  /**
   * 计算点光源的视图投影矩阵
   */
  private calculatePointLightMatrix(light: any, face: string): any {
    // TODO: 实现点光源立方体贴图的视图投影矩阵
    // 每个面都是90度的透视投影
    return null;
  }

  /**
   * 计算聚光灯的视图投影矩阵
   */
  private calculateSpotLightMatrix(light: any): any {
    // TODO: 实现聚光灯的透视投影矩阵
    return null;
  }

  /**
   * 获取或创建阴影贴图
   */
  private getOrCreateShadowMap(key: string): any {
    if (!this.shadowMaps.has(key)) {
      // TODO: 创建阴影贴图纹理
      const shadowMap = this.createShadowMapTexture();
      this.shadowMaps.set(key, shadowMap);
    }
    return this.shadowMaps.get(key);
  }

  /**
   * 创建阴影贴图纹理
   */
  private createShadowMapTexture(): any {
    // TODO: 创建深度纹理作为阴影贴图
    return {
      texture: null, // 深度纹理
      view: null, // 纹理视图
      size: this.config.shadowMapSize,
    };
  }

  /**
   * 创建阴影材质
   */
  private async createShadowMaterial(context: RenderContext): Promise<void> {
    // TODO: 创建阴影渲染的着色器和管线
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Creating shadow material...');
    }

    this.shadowMaterial = {
      pipeline: null, // TODO: 创建阴影渲染管线
      bindGroup: null, // TODO: 创建绑定组
    };
  }

  /**
   * 设置阴影uniform
   */
  private async setupShadowUniforms(
    context: RenderContext,
    encoder: IRHIRenderPassEncoder,
    lightViewProjection: any
  ): Promise<void> {
    // TODO: 设置光源视图投影矩阵uniform
    if (this.shadowMaterial?.bindGroup) {
      encoder.setBindGroup(0, this.shadowMaterial.bindGroup);
    }
  }

  /**
   * 渲染阴影投射者
   */
  private async renderShadowCasters(
    context: RenderContext,
    encoder: IRHIRenderPassEncoder,
    casters: any[]
  ): Promise<void> {
    let currentGeometry: any = null;

    // 设置阴影材质的渲染管线
    if (this.shadowMaterial?.pipeline) {
      encoder.setPipeline(this.shadowMaterial.pipeline);
    }

    for (const caster of casters) {
      try {
        // 几何体切换
        if (caster.geometry !== currentGeometry) {
          currentGeometry = caster.geometry;

          if (currentGeometry?.vertexBuffer) {
            encoder.setVertexBuffer(0, currentGeometry.vertexBuffer);
          }

          if (currentGeometry?.indexBuffer) {
            encoder.setIndexBuffer(currentGeometry.indexBuffer, 'uint16');
          }
        }

        // 设置实例数据
        if (caster.instanceData) {
          encoder.setBindGroup(1, caster.instanceData.bindGroup);
        }

        // 执行绘制
        if (currentGeometry?.indexBuffer) {
          encoder.drawIndexed(currentGeometry.indexCount || 0, caster.instanceCount || 1, 0, 0, 0);
        } else {
          encoder.draw(currentGeometry?.vertexCount || 0, caster.instanceCount || 1, 0, 0);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to render shadow caster:', error);
      }
    }
  }

  /**
   * 获取阴影贴图
   */
  getShadowMap(lightId: string, cascade?: number): any {
    const key = cascade !== undefined ? `directional_${lightId}_cascade_${cascade}` : `${lightId}`;
    return this.shadowMaps.get(key);
  }

  /**
   * 获取通道配置
   */
  getConfig(): Required<ShadowPassConfig> {
    return { ...this.config };
  }

  /**
   * 设置阴影质量
   */
  setShadowQuality(quality: ShadowQuality): void {
    (this.config as any).shadowQuality = quality;
    (this.config as any).shadowMapSize = this.getShadowMapSizeForQuality(quality);

    // 重新创建阴影贴图
    this.shadowMaps.clear();
  }

  /**
   * 销毁资源
   */
  async destroy(): Promise<void> {
    // 清理阴影贴图
    this.shadowMaps.clear();
    this.lightViewMatrices.clear();
    this.shadowMaterial = null;

    await super.destroy();
  }
}
