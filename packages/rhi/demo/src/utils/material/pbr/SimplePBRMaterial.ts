/**
 * material/pbr/SimplePBRMaterial.ts
 * 简化版PBR材质类（基于pbr-material.ts的可工作实现）
 *
 * 特性：
 * - 简单的Uniform Buffer方案
 * - 无复杂的IBL预计算
 * - 支持最多2个点光源
 * - 环境贴图直接采样
 */

import type { MMath } from '@maxellabs/core';
import { MSpec } from '@maxellabs/core';
import { simplePBRVertexShader, simplePBRFragmentShader } from './SimplePBRShaders';
import type { SimplePBRMaterialParams, SimplePBRLightParams } from './SimplePBRTypes';
import { CubemapGenerator } from '../../texture';

/**
 * 简化版PBR材质类
 *
 * 封装了PBR材质的创建、更新和渲染逻辑
 */
export class SimplePBRMaterial {
  private device: MSpec.IRHIDevice;
  private materialParams: SimplePBRMaterialParams;
  private lightParams: SimplePBRLightParams[];
  private options: { cullMode?: MSpec.RHICullMode };

  // RHI资源
  private vertexShader: MSpec.IRHIShaderModule | null = null;
  private fragmentShader: MSpec.IRHIShaderModule | null = null;
  private pipeline: MSpec.IRHIRenderPipeline | null = null;
  private bindGroupLayout: MSpec.IRHIBindGroupLayout | null = null;
  private bindGroup: MSpec.IRHIBindGroup | null = null;

  // Uniform Buffers
  private transformBuffer: MSpec.IRHIBuffer | null = null;
  private materialBuffer: MSpec.IRHIBuffer | null = null;
  private lightsBuffer: MSpec.IRHIBuffer | null = null;
  private cameraBuffer: MSpec.IRHIBuffer | null = null;

  // 环境贴图
  private envTexture: MSpec.IRHITexture | null = null;
  private envSampler: MSpec.IRHISampler | null = null;

  // 预分配的数据数组（避免在渲染循环中创建）
  private materialData: Float32Array;
  private lightsData: Float32Array;
  private lightCountData: Int32Array;
  private transformData: Float32Array;
  private cameraData: Float32Array;

  private ownsEnvTexture: boolean = true;
  private currentInstanceIndex: number = 0;
  private readonly MAX_INSTANCES = 128;

  /**
   * 创建简化版PBR材质
   *
   * @param device RHI设备
   * @param materialParams 材质参数
   * @param lightParams 光源参数（最多2个）
   */
  constructor(
    device: MSpec.IRHIDevice,
    materialParams: SimplePBRMaterialParams,
    lightParams: SimplePBRLightParams[] = [],
    options: { cullMode?: MSpec.RHICullMode } = {}
  ) {
    this.device = device;
    this.materialParams = materialParams;
    this.lightParams = lightParams.slice(0, 2); // 最多2个光源
    this.options = options;

    // 预分配数据数组
    this.materialData = new Float32Array(8);
    this.lightsData = new Float32Array(28);
    this.lightCountData = new Int32Array(this.lightsData.buffer, 96, 1);
    this.transformData = new Float32Array(64);
    this.cameraData = new Float32Array(4);
  }

  /**
   * 初始化材质资源
   *
   * @param envMapOrUrls 环境贴图纹理 或 URL配置
   */
  async initialize(
    envMapOrUrls:
      | {
          posX: string;
          negX: string;
          posY: string;
          negY: string;
          posZ: string;
          negZ: string;
        }
      | MSpec.IRHITexture
  ): Promise<void> {
    // 创建着色器
    this.createShaders();

    // 创建Uniform Buffers
    this.createUniformBuffers();

    // 加载环境贴图
    if (this.isTexture(envMapOrUrls)) {
      this.envTexture = envMapOrUrls;
      this.ownsEnvTexture = false;
      this.createEnvSampler();
    } else {
      await this.loadEnvironmentMap(envMapOrUrls);
      this.ownsEnvTexture = true;
    }

    // 创建绑定组布局
    this.createBindGroupLayout();

    // 创建管线
    this.createPipeline();

    // 创建绑定组
    this.createBindGroup();

    // 初始化Uniform数据
    this.updateMaterialUniforms();
    this.updateLightsUniforms();
  }

  private isTexture(obj: any): obj is MSpec.IRHITexture {
    return obj && typeof obj.createView === 'function';
  }

  /**
   * 创建环境贴图采样器
   */
  private createEnvSampler(): void {
    this.envSampler = this.device.createSampler({
      magFilter: MSpec.RHIFilterMode.LINEAR,
      minFilter: MSpec.RHIFilterMode.LINEAR,
      mipmapFilter: MSpec.RHIFilterMode.LINEAR,
      addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
      addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
      addressModeW: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
      label: 'SimplePBR Environment Sampler',
    });
  }

  /**
   * 创建着色器模块
   */
  private createShaders(): void {
    this.vertexShader = this.device.createShaderModule({
      code: simplePBRVertexShader,
      language: 'glsl',
      stage: MSpec.RHIShaderStage.VERTEX,
    });

    this.fragmentShader = this.device.createShaderModule({
      code: simplePBRFragmentShader,
      language: 'glsl',
      stage: MSpec.RHIShaderStage.FRAGMENT,
    });
  }

  /**
   * 创建Uniform缓冲区
   */
  private createUniformBuffers(): void {
    // Transform Buffer: mat4(64)*4 = 256 bytes per instance
    // Allocate for MAX_INSTANCES
    this.transformBuffer = this.device.createBuffer({
      size: 256 * this.MAX_INSTANCES,
      usage: MSpec.RHIBufferUsage.UNIFORM,
      hint: 'dynamic',
      label: 'SimplePBR Transform Buffer',
    });

    // Material Buffer: 32 bytes (std140)
    this.materialBuffer = this.device.createBuffer({
      size: 32,
      usage: MSpec.RHIBufferUsage.UNIFORM,
      hint: 'dynamic',
      label: 'SimplePBR Material Buffer',
    });

    // Lights Buffer: 112 bytes (std140)
    // PointLight[2] = 48*2 = 96 bytes
    // int + padding = 16 bytes
    this.lightsBuffer = this.device.createBuffer({
      size: 112,
      usage: MSpec.RHIBufferUsage.UNIFORM,
      hint: 'dynamic',
      label: 'SimplePBR Lights Buffer',
    });

    // Camera Buffer: 16 bytes (vec3 with padding)
    this.cameraBuffer = this.device.createBuffer({
      size: 16,
      usage: MSpec.RHIBufferUsage.UNIFORM,
      hint: 'dynamic',
      label: 'SimplePBR Camera Buffer',
    });
  }

  /**
   * 加载环境贴图
   */
  private async loadEnvironmentMap(cubemapUrls: {
    posX: string;
    negX: string;
    posY: string;
    negY: string;
    posZ: string;
    negZ: string;
  }): Promise<void> {
    const cubemapData = await CubemapGenerator.loadFromUrls(cubemapUrls);

    this.envTexture = this.device.createTexture({
      width: cubemapData.size,
      height: cubemapData.size,
      depthOrArrayLayers: 6,
      dimension: 'cube' as const,
      format: MSpec.RHITextureFormat.RGBA8_UNORM,
      usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
      label: 'SimplePBR Environment Map',
    } as MSpec.RHITextureDescriptor);

    // 上传贴图数据
    const faceOrder: (keyof typeof cubemapData.faces)[] = ['posX', 'negX', 'posY', 'negY', 'posZ', 'negZ'];
    for (let i = 0; i < 6; i++) {
      const face = faceOrder[i];
      this.envTexture.update(
        cubemapData.faces[face] as BufferSource,
        0,
        0,
        0,
        cubemapData.size,
        cubemapData.size,
        1,
        0,
        i
      );
    }

    this.createEnvSampler();
  }

  /**
   * 创建绑定组布局
   */
  private createBindGroupLayout(): void {
    this.bindGroupLayout = this.device.createBindGroupLayout([
      {
        binding: 0,
        visibility: MSpec.RHIShaderStage.VERTEX,
        buffer: { type: 'uniform', hasDynamicOffset: true } as any,
        name: 'Transforms',
      },
      { binding: 1, visibility: MSpec.RHIShaderStage.FRAGMENT, buffer: { type: 'uniform' }, name: 'PBRMaterial' },
      { binding: 2, visibility: MSpec.RHIShaderStage.FRAGMENT, buffer: { type: 'uniform' }, name: 'PointLights' },
      { binding: 3, visibility: MSpec.RHIShaderStage.FRAGMENT, buffer: { type: 'uniform' }, name: 'CameraData' },
      {
        binding: 4,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        texture: { sampleType: 'float', viewDimension: 'cube' },
        name: 'uEnvironmentMap',
      },
      {
        binding: 5,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        sampler: { type: 'filtering' },
        name: 'uEnvironmentMapSampler',
      },
    ]);
  }

  /**
   * 创建渲染管线
   */
  private createPipeline(): void {
    if (!this.vertexShader || !this.fragmentShader || !this.bindGroupLayout) {
      throw new Error('Shaders or bind group layout not initialized');
    }

    const pipelineLayout = this.device.createPipelineLayout([this.bindGroupLayout]);

    const vertexLayout: MSpec.RHIVertexLayout = {
      buffers: [
        {
          index: 0,
          stride: 24, // position(12) + normal(12)
          stepMode: 'vertex',
          attributes: [
            { name: 'aPosition', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 0, shaderLocation: 0 },
            { name: 'aNormal', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 12, shaderLocation: 1 },
          ],
        },
      ],
    };

    this.pipeline = this.device.createRenderPipeline({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      vertexLayout,
      primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
      layout: pipelineLayout,
      rasterizationState: { cullMode: this.options.cullMode ?? MSpec.RHICullMode.BACK },
      depthStencilState: {
        depthWriteEnabled: true,
        depthCompare: MSpec.RHICompareFunction.LESS,
        format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
      },
    });
  }

  /**
   * 创建绑定组
   */
  private createBindGroup(): void {
    if (
      !this.bindGroupLayout ||
      !this.transformBuffer ||
      !this.materialBuffer ||
      !this.lightsBuffer ||
      !this.cameraBuffer ||
      !this.envTexture ||
      !this.envSampler
    ) {
      throw new Error('Resources not initialized');
    }

    this.bindGroup = this.device.createBindGroup(this.bindGroupLayout, [
      { binding: 0, resource: this.transformBuffer },
      { binding: 1, resource: this.materialBuffer },
      { binding: 2, resource: this.lightsBuffer },
      { binding: 3, resource: this.cameraBuffer },
      { binding: 4, resource: this.envTexture.createView() },
      { binding: 5, resource: this.envSampler },
    ]);
  }

  /**
   * 更新材质参数
   *
   * @param params 新的材质参数
   */
  setMaterialParams(params: Partial<SimplePBRMaterialParams>): void {
    Object.assign(this.materialParams, params);
  }

  /**
   * 更新光源参数
   *
   * @param lights 新的光源参数（最多2个）
   */
  setLights(lights: SimplePBRLightParams[]): void {
    this.lightParams = lights.slice(0, 2);
  }

  /**
   * 更新材质Uniform数据
   */
  private updateMaterialUniforms(): void {
    if (!this.materialBuffer) {
      return;
    }

    // PBRMaterial Buffer (32 bytes)
    this.materialData[0] = this.materialParams.albedo[0];
    this.materialData[1] = this.materialParams.albedo[1];
    this.materialData[2] = this.materialParams.albedo[2];
    // [3] padding
    this.materialData[4] = this.materialParams.metallic;
    this.materialData[5] = this.materialParams.roughness;
    this.materialData[6] = this.materialParams.ambientStrength;
    // [7-8] padding

    this.materialBuffer.update(this.materialData as BufferSource, 0);
  }

  /**
   * 更新光源Uniform数据
   */
  private updateLightsUniforms(): void {
    if (!this.lightsBuffer) {
      return;
    }

    // PointLights Buffer (112 bytes)
    for (let i = 0; i < 2; i++) {
      const offset = i * 12; // 每个光源12个float
      if (i < this.lightParams.length) {
        const light = this.lightParams[i];
        // Position
        this.lightsData[offset + 0] = light.position[0];
        this.lightsData[offset + 1] = light.position[1];
        this.lightsData[offset + 2] = light.position[2];
        // [3] padding
        // Color
        this.lightsData[offset + 4] = light.color[0];
        this.lightsData[offset + 5] = light.color[1];
        this.lightsData[offset + 6] = light.color[2];
        // [7] padding
        // Attenuation
        this.lightsData[offset + 8] = light.constant;
        this.lightsData[offset + 9] = light.linear;
        this.lightsData[offset + 10] = light.quadratic;
        // [11] padding
      }
    }

    // Light count
    this.lightCountData[0] = this.lightParams.length;

    this.lightsBuffer.update(this.lightsData as BufferSource, 0);
  }

  /**
   * 更新变换矩阵和相机数据
   *
   * @param modelMatrix 模型矩阵
   * @param viewMatrix 视图矩阵
   * @param projMatrix 投影矩阵
   * @param normalMatrix 法线矩阵
   * @param cameraPos 相机位置
   */
  updateTransforms(
    modelMatrix: MMath.Matrix4,
    viewMatrix: Float32Array,
    projMatrix: Float32Array,
    normalMatrix: MMath.Matrix4,
    cameraPos: { x: number; y: number; z: number }
  ): void {
    if (!this.transformBuffer || !this.cameraBuffer) {
      return;
    }

    // Transform Uniforms
    this.transformData.set(modelMatrix.getElements(), 0);
    this.transformData.set(viewMatrix, 16);
    this.transformData.set(projMatrix, 32);
    this.transformData.set(normalMatrix.getElements(), 48);

    // Write to the current instance offset
    if (this.currentInstanceIndex < this.MAX_INSTANCES) {
      const byteOffset = this.currentInstanceIndex * 256;
      this.transformBuffer.update(this.transformData as BufferSource, byteOffset);
    } else {
      console.warn('SimplePBRMaterial: MAX_INSTANCES exceeded');
    }

    // Camera Uniform
    this.cameraData[0] = cameraPos.x;
    this.cameraData[1] = cameraPos.y;
    this.cameraData[2] = cameraPos.z;
    this.cameraBuffer.update(this.cameraData as BufferSource, 0);
  }

  /**
   * 重置实例索引（每帧调用）
   */
  reset(): void {
    this.currentInstanceIndex = 0;
  }

  /**
   * 渲染前更新（每帧调用）
   */
  update(): void {
    this.updateMaterialUniforms();
    this.updateLightsUniforms();
  }

  /**
   * 绑定材质到渲染通道
   *
   * @param renderPass 渲染通道
   */
  bind(renderPass: MSpec.IRHIRenderPass): void {
    if (!this.pipeline || !this.bindGroup) {
      throw new Error('Material not initialized');
    }

    renderPass.setPipeline(this.pipeline);

    // Calculate dynamic offset
    const dynamicOffset = this.currentInstanceIndex * 256;
    renderPass.setBindGroup(0, this.bindGroup, [dynamicOffset]);

    // Increment instance index for next draw
    this.currentInstanceIndex++;
  }

  /**
   * 获取渲染管线
   */
  getPipeline(): MSpec.IRHIRenderPipeline | null {
    return this.pipeline;
  }

  /**
   * 销毁材质资源
   */
  destroy(): void {
    this.vertexShader?.destroy();
    this.fragmentShader?.destroy();
    this.pipeline?.destroy();
    this.bindGroupLayout?.destroy();
    this.bindGroup?.destroy();
    this.transformBuffer?.destroy();
    this.materialBuffer?.destroy();
    this.lightsBuffer?.destroy();
    this.cameraBuffer?.destroy();
    if (this.ownsEnvTexture) {
      this.envTexture?.destroy();
    }
    this.envSampler?.destroy();
  }
}
