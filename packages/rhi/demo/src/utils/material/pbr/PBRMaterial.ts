/**
 * material/pbr/PBRMaterial.ts
 * PBR材质类 - 基于物理的渲染材质
 */

import { MSpec } from '@maxellabs/core';
import { pbrVertexShader, pbrFragmentShader, pbrFragmentShaderWithIBL } from './PBRShaders';
import type { PBRConfig, PBRTextures, IBLTextures, LightConfig, PBRRenderConfig } from './types';

/**
 * PBR材质类
 *
 * 实现基于物理的渲染材质，支持：
 * - 金属度/粗糙度工作流
 * - Cook-Torrance BRDF模型
 * - 纹理贴图（Albedo, Metalness, Roughness, Normal, AO）
 * - IBL环境光照
 * - 多光源支持
 *
 * 宪法约束：
 * - 所有光照计算在线性空间进行
 * - sRGB纹理自动Gamma校正
 * - 资源通过runner.track()管理
 */
export class PBRMaterial {
  private device: MSpec.IRHIDevice;
  private config: PBRConfig;
  private textures: PBRTextures;
  private iblTextures: IBLTextures;
  private renderConfig: PBRRenderConfig;

  private pipeline: MSpec.IRHIRenderPipeline | null = null;
  private uniformBuffer: MSpec.IRHIBuffer | null = null;
  private bindGroup: MSpec.IRHIBindGroup | null = null;

  // 默认纹理（1x1白色）
  private defaultTexture: MSpec.IRHITexture | null = null;
  private defaultCubeTexture: MSpec.IRHITexture | null = null;

  // 光源数据
  private lights: LightConfig[] = [];

  /**
   * 创建PBR材质
   *
   * @param device RHI设备
   * @param config 材质配置
   * @param textures 纹理贴图（可选）
   * @param iblTextures IBL贴图（可选）
   */
  constructor(device: MSpec.IRHIDevice, config: PBRConfig, textures: PBRTextures = {}, iblTextures: IBLTextures = {}) {
    this.device = device;
    this.config = {
      ao: 1.0,
      normalScale: 1.0,
      ...config,
    };
    this.textures = textures;
    this.iblTextures = iblTextures;

    // 默认渲染配置
    this.renderConfig = {
      enableIBL: !!iblTextures.irradianceMap,
      enableNormalMap: !!textures.normalMap,
      enableAO: !!textures.aoMap,
      maxReflectionLOD: 4.0,
      enableGammaCorrection: true,
    };

    this.initialize();
  }

  /**
   * 初始化材质资源
   */
  private initialize(): void {
    this.createDefaultTextures();
    this.createPipeline();
    this.createUniformBuffer();
    this.createBindGroup();
  }

  /**
   * 创建默认纹理（1x1白色）
   */
  private createDefaultTextures(): void {
    // 2D默认纹理
    const whitePixel = new Uint8Array([255, 255, 255, 255]);
    this.defaultTexture = this.device.createTexture({
      label: 'PBR_DefaultTexture',
      width: 1,
      height: 1,
      format: MSpec.RHITextureFormat.RGBA8_UNORM,
      usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
      initialData: whitePixel,
    });

    // Cube默认纹理（6个面）
    const cubeData = new Uint8Array(6 * 4); // 6 faces * 4 bytes
    cubeData.fill(255);
    this.defaultCubeTexture = this.device.createTexture({
      label: 'PBR_DefaultCubeTexture',
      width: 1,
      height: 1,
      format: MSpec.RHITextureFormat.RGBA8_UNORM,
      usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
      dimension: MSpec.RHITextureType.TEXTURE_2D_ARRAY,
      depthOrArrayLayers: 6,
      initialData: cubeData,
    });
  }

  /**
   * 创建渲染管线
   */
  private createPipeline(): void {
    // 选择着色器（是否支持IBL）
    const fragmentShader = this.renderConfig.enableIBL ? pbrFragmentShaderWithIBL : pbrFragmentShader;

    const vertexShaderModule = this.device.createShaderModule({
      label: 'PBR_VertexShader',
      code: pbrVertexShader,
      language: 'glsl',
      stage: MSpec.RHIShaderStage.VERTEX,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      label: 'PBR_FragmentShader',
      code: fragmentShader,
      language: 'glsl',
      stage: MSpec.RHIShaderStage.FRAGMENT,
    });

    // 创建绑定组布局
    const bindGroupLayout = this.device.createBindGroupLayout([
      { binding: 0, visibility: MSpec.RHIShaderStage.VERTEX, buffer: { type: 'uniform' }, name: 'PBRUniforms' },
      { binding: 1, visibility: MSpec.RHIShaderStage.FRAGMENT, texture: { sampleType: 'float' }, name: 'AlbedoMap' },
      { binding: 2, visibility: MSpec.RHIShaderStage.FRAGMENT, texture: { sampleType: 'float' }, name: 'NormalMap' },
      {
        binding: 3,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        texture: { sampleType: 'float' },
        name: 'MetallicRoughnessMap',
      },
      { binding: 4, visibility: MSpec.RHIShaderStage.FRAGMENT, texture: { sampleType: 'float' }, name: 'AOMap' },
      { binding: 5, visibility: MSpec.RHIShaderStage.FRAGMENT, texture: { sampleType: 'float' }, name: 'EmissiveMap' },
      {
        binding: 6,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        texture: { sampleType: 'float' },
        name: 'IrradianceMap',
      },
      { binding: 7, visibility: MSpec.RHIShaderStage.FRAGMENT, texture: { sampleType: 'float' }, name: 'PrefilterMap' },
      { binding: 8, visibility: MSpec.RHIShaderStage.FRAGMENT, texture: { sampleType: 'float' }, name: 'BRDFLUT' },
    ]);

    // 创建管线布局
    const pipelineLayout = this.device.createPipelineLayout([bindGroupLayout]);

    // 定义顶点布局
    const vertexLayout: MSpec.RHIVertexLayout = {
      buffers: [
        {
          index: 0,
          stride: 11 * 4, // 3(pos) + 3(normal) + 2(uv) + 3(tangent) = 11 floats
          stepMode: 'vertex',
          attributes: [
            { name: 'aPosition', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 0, shaderLocation: 0 },
            { name: 'aNormal', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 12, shaderLocation: 1 },
            { name: 'aTexCoord', format: MSpec.RHIVertexFormat.FLOAT32x2, offset: 24, shaderLocation: 2 },
            { name: 'aTangent', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 32, shaderLocation: 3 },
          ],
        },
      ],
    };

    this.pipeline = this.device.createRenderPipeline({
      vertexShader: vertexShaderModule,
      fragmentShader: fragmentShaderModule,
      vertexLayout,
      primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
      layout: pipelineLayout,
      rasterizationState: { cullMode: MSpec.RHICullMode.BACK },
      depthStencilState: {
        depthWriteEnabled: true,
        depthCompare: MSpec.RHICompareFunction.LESS,
        format: MSpec.RHITextureFormat.DEPTH24_UNORM,
      },
    });
  }

  /**
   * 创建Uniform缓冲区
   *
   * 布局（std140对齐）：
   * - mat4 uModel (64 bytes)
   * - mat4 uView (64 bytes)
   * - mat4 uProjection (64 bytes)
   * - vec3 uAlbedo + padding (16 bytes)
   * - float uMetalness, uRoughness, uAO, padding (16 bytes)
   * - vec3 uCameraPos + padding (16 bytes)
   * - vec3 uLightPositions[4] (64 bytes)
   * - vec3 uLightColors[4] (64 bytes)
   * - int uLightCount + flags (16 bytes)
   */
  private createUniformBuffer(): void {
    const bufferSize = 64 + 64 + 64 + 16 + 16 + 16 + 64 + 64 + 16; // 384 bytes

    this.uniformBuffer = this.device.createBuffer({
      label: 'PBR_UniformBuffer',
      size: bufferSize,
      usage: MSpec.RHIBufferUsage.UNIFORM,
    });
  }

  /**
   * 创建绑定组
   */
  private createBindGroup(): void {
    if (!this.pipeline || !this.uniformBuffer) {
      throw new Error('Pipeline or uniform buffer not initialized');
    }

    const entries: any[] = [
      {
        binding: 0,
        resource: { buffer: this.uniformBuffer },
      },
    ];

    // 材质贴图
    let binding = 1;
    entries.push({
      binding: binding++,
      resource: (this.textures.albedoMap || this.defaultTexture)!.createView(),
    });
    entries.push({
      binding: binding++,
      resource: (this.textures.metalnessMap || this.defaultTexture)!.createView(),
    });
    entries.push({
      binding: binding++,
      resource: (this.textures.roughnessMap || this.defaultTexture)!.createView(),
    });
    entries.push({
      binding: binding++,
      resource: (this.textures.normalMap || this.defaultTexture)!.createView(),
    });
    entries.push({
      binding: binding++,
      resource: (this.textures.aoMap || this.defaultTexture)!.createView(),
    });

    // IBL贴图（如果启用）
    if (this.renderConfig.enableIBL) {
      entries.push({
        binding: binding++,
        resource: (this.iblTextures.irradianceMap || this.defaultCubeTexture)!.createView(),
      });
      entries.push({
        binding: binding++,
        resource: (this.iblTextures.prefilterMap || this.defaultCubeTexture)!.createView(),
      });
      entries.push({
        binding: binding++,
        resource: (this.iblTextures.brdfLUT || this.defaultTexture)!.createView(),
      });
    }

    // 需要先创建bind group layout
    const bindGroupLayout = this.device.createBindGroupLayout([
      { binding: 0, visibility: MSpec.RHIShaderStage.VERTEX, buffer: { type: 'uniform' } },
      { binding: 1, visibility: MSpec.RHIShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 2, visibility: MSpec.RHIShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 3, visibility: MSpec.RHIShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 4, visibility: MSpec.RHIShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
    ]);

    this.bindGroup = this.device.createBindGroup(bindGroupLayout, entries);
  }

  /**
   * 更新材质属性
   */
  public setProperty(key: keyof PBRConfig, value: any): void {
    (this.config as any)[key] = value;
  }

  /**
   * 设置光源
   */
  public setLights(lights: LightConfig[]): void {
    this.lights = lights.slice(0, 4); // 最多4个光源
  }

  /**
   * 更新Uniform数据
   */
  public updateUniforms(
    modelMatrix: Float32Array,
    viewMatrix: Float32Array,
    projectionMatrix: Float32Array,
    cameraPos: [number, number, number]
  ): void {
    if (!this.uniformBuffer) {
      return;
    }

    const data = new Float32Array(96); // 384 bytes / 4 = 96 floats
    let offset = 0;

    // Model matrix (16 floats)
    data.set(modelMatrix, offset);
    offset += 16;

    // View matrix (16 floats)
    data.set(viewMatrix, offset);
    offset += 16;

    // Projection matrix (16 floats)
    data.set(projectionMatrix, offset);
    offset += 16;

    // Albedo (vec3 + padding)
    data[offset++] = this.config.albedo[0];
    data[offset++] = this.config.albedo[1];
    data[offset++] = this.config.albedo[2];
    data[offset++] = 0; // padding

    // Material properties
    data[offset++] = this.config.metalness;
    data[offset++] = this.config.roughness;
    data[offset++] = this.config.ao || 1.0;
    data[offset++] = 0; // padding

    // Camera position (vec3 + padding)
    data[offset++] = cameraPos[0];
    data[offset++] = cameraPos[1];
    data[offset++] = cameraPos[2];
    data[offset++] = 0; // padding

    // Light positions (4 * vec3, 每个vec3占4个float)
    for (let i = 0; i < 4; i++) {
      if (i < this.lights.length) {
        data[offset++] = this.lights[i].position[0];
        data[offset++] = this.lights[i].position[1];
        data[offset++] = this.lights[i].position[2];
        data[offset++] = 0; // padding
      } else {
        offset += 4;
      }
    }

    // Light colors (4 * vec3, 每个vec3占4个float)
    for (let i = 0; i < 4; i++) {
      if (i < this.lights.length) {
        const intensity = this.lights[i].intensity;
        data[offset++] = this.lights[i].color[0] * intensity;
        data[offset++] = this.lights[i].color[1] * intensity;
        data[offset++] = this.lights[i].color[2] * intensity;
        data[offset++] = 0; // padding
      } else {
        offset += 4;
      }
    }

    // Light count + flags
    data[offset++] = this.lights.length;
    data[offset++] = this.textures.albedoMap ? 1 : 0;
    data[offset++] = this.textures.metalnessMap ? 1 : 0;
    data[offset++] = this.textures.roughnessMap ? 1 : 0;

    this.uniformBuffer?.update(data, 0);
  }

  /**
   * 绑定材质到渲染通道
   */
  public bind(passEncoder: any): void {
    if (!this.pipeline || !this.bindGroup) {
      throw new Error('Material not initialized');
    }

    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.bindGroup);
  }

  /**
   * 获取渲染管线
   */
  public getPipeline(): MSpec.IRHIRenderPipeline | null {
    return this.pipeline;
  }

  /**
   * 销毁材质资源
   */
  public destroy(): void {
    this.defaultTexture?.destroy();
    this.defaultCubeTexture?.destroy();
    this.uniformBuffer?.destroy();
    this.pipeline?.destroy();
  }
}
