/**
 * SkyboxPass.ts
 * 天空盒渲染通道
 *
 * 负责渲染天空盒，通常在所有其他物体之后渲染
 */

import { RenderPass } from './render-pass';
import type { RenderContext } from '../render-context';
import type { RenderQueue } from '../render-queue';
import type { IRHIRenderPassEncoder } from '../../interface/rhi';

/**
 * 天空盒类型
 */
export type SkyboxType = 'cubemap' | 'equirectangular' | 'procedural' | 'gradient';

/**
 * 天空盒通道配置
 */
export interface SkyboxPassConfig {
  /**
   * 通道名称
   */
  name: string;

  /**
   * 天空盒类型
   */
  skyboxType?: SkyboxType;

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

  /**
   * 天空盒强度
   */
  intensity?: number;

  /**
   * 是否启用雾效
   */
  enableFog?: boolean;

  /**
   * 是否启用HDR
   */
  enableHDR?: boolean;
}

/**
 * 天空盒渲染通道
 *
 * 特点：
 * - 深度测试为less-equal，确保只渲染背景
 * - 禁用深度写入
 * - 使用特殊的顶点着色器移除平移变换
 * - 支持多种天空盒类型
 */
export class SkyboxPass extends RenderPass {
  /**
   * 通道配置
   */
  private readonly config: Required<SkyboxPassConfig>;

  /**
   * 天空盒几何体（立方体）
   */
  private skyboxGeometry: any = null;

  /**
   * 天空盒材质
   */
  private skyboxMaterial: any = null;

  /**
   * 构造函数
   */
  constructor(config: SkyboxPassConfig) {
    super(config.name);

    // 设置默认配置
    this.config = {
      name: config.name,
      skyboxType: config.skyboxType ?? 'cubemap',
      depthTest: config.depthTest ?? 'less-equal', // 确保天空盒在最远处
      depthWrite: config.depthWrite ?? false, // 不写入深度
      cullMode: config.cullMode ?? 'front', // 剔除前面，从内部看立方体
      intensity: config.intensity ?? 1.0,
      enableFog: config.enableFog ?? false,
      enableHDR: config.enableHDR ?? false,
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
      blendMode: 'none',
    });

    // 创建天空盒几何体和材质
    await this.createSkyboxResources(context);

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`SkyboxPass initialized: type=${this.config.skyboxType}, intensity=${this.config.intensity}`);
    }
  }

  /**
   * 执行渲染通道
   */
  async execute(context: RenderContext, queue: RenderQueue): Promise<void> {
    if (!this.enabled || !this.skyboxGeometry || !this.skyboxMaterial) {
      return;
    }

    const startTime = performance.now();

    try {
      // 开始渲染通道
      const encoder = context.getCommandEncoder();
      if (!encoder) {
        throw new Error('Command encoder not available');
      }

      const renderPassEncoder = this.beginRenderPass(context, encoder);

      // 渲染天空盒
      await this.renderSkybox(context, renderPassEncoder);

      // 结束渲染通道
      renderPassEncoder.end();

      // 更新统计信息
      this.updateStats({
        drawCalls: 1,
        triangles: 12, // 立方体有12个三角形
        vertices: 8, // 立方体有8个顶点
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('SkyboxPass execution failed:', error);
      throw error;
    } finally {
      const endTime = performance.now();
      this.updateStats({
        executionTime: endTime - startTime,
      });
    }
  }

  /**
   * 创建天空盒资源
   */
  private async createSkyboxResources(context: RenderContext): Promise<void> {
    // TODO: 创建天空盒立方体几何体
    // 这里需要创建一个单位立方体，顶点坐标为[-1, 1]范围
    // 在顶点着色器中会移除平移变换，只保留旋转

    // TODO: 根据天空盒类型创建对应的材质
    switch (this.config.skyboxType) {
      case 'cubemap':
        await this.createCubemapMaterial(context);
        break;
      case 'equirectangular':
        await this.createEquirectangularMaterial(context);
        break;
      case 'procedural':
        await this.createProceduralMaterial(context);
        break;
      case 'gradient':
        await this.createGradientMaterial(context);
        break;
    }

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`Skybox resources created for type: ${this.config.skyboxType}`);
    }
  }

  /**
   * 创建立方体贴图材质
   */
  private async createCubemapMaterial(context: RenderContext): Promise<void> {
    // TODO: 实现立方体贴图材质
    // 需要：
    // 1. 立方体贴图纹理
    // 2. 天空盒着色器（移除平移变换）
    // 3. 采样器状态

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Creating cubemap skybox material...');
    }
  }

  /**
   * 创建等距柱状投影材质
   */
  private async createEquirectangularMaterial(context: RenderContext): Promise<void> {
    // TODO: 实现等距柱状投影材质
    // 需要：
    // 1. 等距柱状投影纹理
    // 2. 球面坐标转换着色器
    // 3. 采样器状态

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Creating equirectangular skybox material...');
    }
  }

  /**
   * 创建程序化天空材质
   */
  private async createProceduralMaterial(context: RenderContext): Promise<void> {
    // TODO: 实现程序化天空材质
    // 需要：
    // 1. 大气散射计算
    // 2. 太阳位置参数
    // 3. 云层生成

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Creating procedural skybox material...');
    }
  }

  /**
   * 创建渐变天空材质
   */
  private async createGradientMaterial(context: RenderContext): Promise<void> {
    // TODO: 实现渐变天空材质
    // 需要：
    // 1. 顶部和底部颜色
    // 2. 渐变插值计算
    // 3. 可选的地平线颜色

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Creating gradient skybox material...');
    }
  }

  /**
   * 渲染天空盒
   */
  private async renderSkybox(context: RenderContext, encoder: IRHIRenderPassEncoder): Promise<void> {
    // 设置相机矩阵（移除平移）
    const camera = context.getCamera();
    if (camera) {
      // 获取视图矩阵并移除平移部分
      const viewMatrix = camera.getViewMatrix();
      const rotationOnlyView = viewMatrix.clone();
      rotationOnlyView.setPosition(0, 0, 0); // 移除平移

      const projectionMatrix = camera.getProjectionMatrix();
      const skyboxViewProjection = projectionMatrix.multiply(rotationOnlyView);

      // 绑定天空盒专用的相机uniform
      const cameraUniform = context.getCameraUniform();
      if (cameraUniform) {
        encoder.setBindGroup(0, cameraUniform);
      }
    }

    // 绑定天空盒材质
    if (this.skyboxMaterial?.bindGroup) {
      encoder.setBindGroup(1, this.skyboxMaterial.bindGroup);
    }

    // 设置渲染管线
    if (this.skyboxMaterial?.pipeline) {
      encoder.setPipeline(this.skyboxMaterial.pipeline);
    }

    // 绑定天空盒几何体
    if (this.skyboxGeometry?.vertexBuffer) {
      encoder.setVertexBuffer(0, this.skyboxGeometry.vertexBuffer);
    }

    if (this.skyboxGeometry?.indexBuffer) {
      encoder.setIndexBuffer(this.skyboxGeometry.indexBuffer, 'uint16');
    }

    // 绘制天空盒
    if (this.skyboxGeometry?.indexBuffer) {
      encoder.drawIndexed(this.skyboxGeometry.indexCount || 36, 1, 0, 0, 0); // 立方体36个索引
    } else {
      encoder.draw(this.skyboxGeometry?.vertexCount || 36, 1, 0, 0); // 立方体36个顶点
    }
  }

  /**
   * 设置天空盒纹理
   */
  setSkyboxTexture(texture: any): void {
    if (this.skyboxMaterial) {
      this.skyboxMaterial.texture = texture;
      // TODO: 更新材质的绑定组
    }
  }

  /**
   * 设置天空盒强度
   */
  setIntensity(intensity: number): void {
    (this.config as any).intensity = intensity;

    if (this.skyboxMaterial) {
      // TODO: 更新材质的强度参数
    }
  }

  /**
   * 获取天空盒强度
   */
  getIntensity(): number {
    return this.config.intensity;
  }

  /**
   * 设置天空盒类型
   */
  setSkyboxType(type: SkyboxType): void {
    if (type !== this.config.skyboxType) {
      (this.config as any).skyboxType = type;
      // TODO: 重新创建材质
    }
  }

  /**
   * 获取天空盒类型
   */
  getSkyboxType(): SkyboxType {
    return this.config.skyboxType;
  }

  /**
   * 获取通道配置
   */
  getConfig(): Required<SkyboxPassConfig> {
    return { ...this.config };
  }

  /**
   * 销毁资源
   */
  async destroy(): Promise<void> {
    // 清理天空盒资源
    this.skyboxGeometry = null;
    this.skyboxMaterial = null;

    await super.destroy();
  }
}
