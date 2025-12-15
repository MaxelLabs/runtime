/**
 * material/pbr/IBLLoader.ts
 * IBL（Image-Based Lighting）加载器
 *
 * 从环境贴图生成IBL所需的三张贴图：
 * 1. 辐照度图（Irradiance Map）- 漫反射IBL
 * 2. 预过滤环境图（Prefilter Map）- 镜面IBL
 * 3. BRDF查找表（BRDF LUT）- 镜面积分
 */

import { MSpec, MMath } from '@maxellabs/core';
import type { IBLTextures } from './types';

/**
 * IBL加载器
 *
 * 提供从环境贴图生成IBL贴图的功能
 */
export class IBLLoader {
  private device: MSpec.IRHIDevice;

  // Geometry cache
  private cubeVertexBuffer: MSpec.IRHIBuffer | null = null;
  private cubeIndexBuffer: MSpec.IRHIBuffer | null = null;
  private cubeIndexCount: number = 0;
  private quadVertexBuffer: MSpec.IRHIBuffer | null = null;
  private quadIndexBuffer: MSpec.IRHIBuffer | null = null;
  private quadIndexCount: number = 0;
  private linearSampler: MSpec.IRHISampler | null = null;

  constructor(device: MSpec.IRHIDevice) {
    this.device = device;
  }

  /**
   * 从环境立方体贴图生成完整的IBL贴图集
   *
   * @param environmentMap 环境立方体贴图
   * @returns IBL贴图集合
   */
  public async generateIBLTextures(environmentMap: MSpec.IRHITexture): Promise<IBLTextures> {
    const irradianceMap = await this.generateIrradianceMap(environmentMap);
    const prefilterMap = await this.generatePrefilterMap(environmentMap);
    const brdfLUT = await this.generateBRDFLUT();

    return {
      irradianceMap,
      prefilterMap,
      brdfLUT,
    };
  }

  /**
   * 生成辐照度图（漫反射IBL）
   *
   * 对环境贴图进行卷积，生成低频漫反射环境光
   * 输出分辨率：32x32（每个面）
   *
   * @param environmentMap 环境立方体贴图
   * @returns 辐照度立方体贴图
   */
  private async generateIrradianceMap(environmentMap: MSpec.IRHITexture): Promise<MSpec.IRHITexture> {
    this.ensureGeometry();
    this.ensureSampler();
    const size = 32;

    const irradianceMap = this.device.createTexture({
      label: 'IBL_IrradianceMap',
      width: size,
      height: size,
      format: MSpec.RHITextureFormat.RGBA16_FLOAT,
      usage: ((MSpec.RHITextureUsage.TEXTURE_BINDING as any) | (MSpec.RHITextureUsage.RENDER_ATTACHMENT as any)) as any,
      dimension: MSpec.RHITextureType.TEXTURE_CUBE,
    });

    const vertexShader = this.device.createShaderModule({
      code: this.getCubeVertexShader(),
      stage: MSpec.RHIShaderStage.VERTEX,
      language: 'glsl',
    });
    const fragmentShader = this.device.createShaderModule({
      code: this.createIrradianceConvolutionShader(),
      stage: MSpec.RHIShaderStage.FRAGMENT,
      language: 'glsl',
    });

    const bindGroupLayout = this.device.createBindGroupLayout([
      { binding: 0, visibility: MSpec.RHIShaderStage.VERTEX as any, buffer: { type: 'uniform' } },
      {
        binding: 1,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        texture: { sampleType: 'float', viewDimension: 'cube' },
      },
      { binding: 2, visibility: MSpec.RHIShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
    ]);

    const pipelineLayout = this.device.createPipelineLayout([bindGroupLayout]);
    const pipeline = this.device.createRenderPipeline({
      vertexShader,
      fragmentShader,
      vertexLayout: {
        buffers: [
          {
            index: 0,
            stride: 12,
            stepMode: 'vertex' as MSpec.RHIVertexStepMode,
            attributes: [{ shaderLocation: 0, format: 'float32x3' as MSpec.RHIVertexFormat, offset: 0 }],
          },
        ],
      },
      primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
      layout: pipelineLayout,
    });

    const projection = new MMath.Matrix4().perspective(Math.PI / 2, 1.0, 0.1, 10.0);
    const views = [
      new MMath.Matrix4().lookAt(new MMath.Vector3(0, 0, 0), new MMath.Vector3(1, 0, 0), new MMath.Vector3(0, -1, 0)),
      new MMath.Matrix4().lookAt(new MMath.Vector3(0, 0, 0), new MMath.Vector3(-1, 0, 0), new MMath.Vector3(0, -1, 0)),
      new MMath.Matrix4().lookAt(new MMath.Vector3(0, 0, 0), new MMath.Vector3(0, 1, 0), new MMath.Vector3(0, 0, 1)),
      new MMath.Matrix4().lookAt(new MMath.Vector3(0, 0, 0), new MMath.Vector3(0, -1, 0), new MMath.Vector3(0, 0, -1)),
      new MMath.Matrix4().lookAt(new MMath.Vector3(0, 0, 0), new MMath.Vector3(0, 0, 1), new MMath.Vector3(0, -1, 0)),
      new MMath.Matrix4().lookAt(new MMath.Vector3(0, 0, 0), new MMath.Vector3(0, 0, -1), new MMath.Vector3(0, -1, 0)),
    ];

    const uniformData = new Float32Array(32);
    const uniformBuffer = this.device.createBuffer({
      size: 32 * 4,
      usage: MSpec.RHIBufferUsage.UNIFORM,
    });

    for (let i = 0; i < 6; i++) {
      uniformData.set(projection.getElements(), 0);
      uniformData.set(views[i].getElements(), 16);
      uniformBuffer.update(uniformData, 0);

      const bindGroup = this.device.createBindGroup(bindGroupLayout, [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: environmentMap.createView({ dimension: MSpec.RHITextureType.TEXTURE_CUBE } as any) },
        { binding: 2, resource: this.linearSampler! },
      ]);

      const commandEncoder = this.device.createCommandEncoder();
      const pass = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: irradianceMap.createView({
              dimension: MSpec.RHITextureType.TEXTURE_2D,
              baseArrayLayer: i,
              arrayLayerCount: 1,
            } as any),
            loadOp: 'clear',
            storeOp: 'store',
            clearColor: [0, 0, 0, 1],
          },
        ],
      });

      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.setVertexBuffer(0, this.cubeVertexBuffer!);
      pass.setIndexBuffer(this.cubeIndexBuffer!, MSpec.RHIIndexFormat.UINT16);
      pass.drawIndexed(this.cubeIndexCount);
      pass.end();

      this.device.submit([commandEncoder.finish()]);
    }

    uniformBuffer.destroy();
    return irradianceMap;
  }

  /**
   * 生成预过滤环境图（镜面IBL）
   *
   * 根据不同粗糙度级别预过滤环境贴图
   * 输出分辨率：128x128（mip0）到 1x1（mip7）
   *
   * @param environmentMap 环境立方体贴图
   * @returns 预过滤立方体贴图（带mipmap）
   */
  private async generatePrefilterMap(environmentMap: MSpec.IRHITexture): Promise<MSpec.IRHITexture> {
    const size = 128; // 基础分辨率
    const mipLevels = 5; // mipmap级别数

    // 创建目标纹理（带mipmap）
    const prefilterMap = this.device.createTexture({
      label: 'IBL_PrefilterMap',
      width: size,
      height: size,
      format: MSpec.RHITextureFormat.RGBA16_FLOAT,
      usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
      dimension: MSpec.RHITextureType.TEXTURE_CUBE,
      mipLevelCount: mipLevels,
    });

    const prefilterShaderModule = this.device.createShaderModule({
      code: this.createPrefilterShader(),
      stage: MSpec.RHIShaderStage.FRAGMENT,
      language: 'glsl',
    });
    const vertexShaderModule = this.device.createShaderModule({
      code: this.getCubeVertexShader(),
      stage: MSpec.RHIShaderStage.VERTEX,
      language: 'glsl',
    });

    const bindGroupLayout = this.device.createBindGroupLayout([
      {
        binding: 0,
        visibility: (MSpec.RHIShaderStage.FRAGMENT as any) | (MSpec.RHIShaderStage.VERTEX as any),
        buffer: { type: 'uniform' },
      },
      {
        binding: 1,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        texture: { sampleType: 'float', viewDimension: 'cube' },
      },
      { binding: 2, visibility: MSpec.RHIShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
    ]);

    const pipelineLayout = this.device.createPipelineLayout([bindGroupLayout]);
    const pipeline = this.device.createRenderPipeline({
      vertexShader: vertexShaderModule,
      fragmentShader: prefilterShaderModule,
      vertexLayout: {
        buffers: [
          {
            index: 0,
            stride: 12,
            stepMode: 'vertex' as MSpec.RHIVertexStepMode,
            attributes: [{ shaderLocation: 0, format: 'float32x3' as MSpec.RHIVertexFormat, offset: 0 }],
          },
        ],
      },
      primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
      layout: pipelineLayout,
    });

    const projection = new MMath.Matrix4().perspective(Math.PI / 2, 1.0, 0.1, 10.0);
    const views = [
      new MMath.Matrix4().lookAt(new MMath.Vector3(0, 0, 0), new MMath.Vector3(1, 0, 0), new MMath.Vector3(0, -1, 0)),
      new MMath.Matrix4().lookAt(new MMath.Vector3(0, 0, 0), new MMath.Vector3(-1, 0, 0), new MMath.Vector3(0, -1, 0)),
      new MMath.Matrix4().lookAt(new MMath.Vector3(0, 0, 0), new MMath.Vector3(0, 1, 0), new MMath.Vector3(0, 0, 1)),
      new MMath.Matrix4().lookAt(new MMath.Vector3(0, 0, 0), new MMath.Vector3(0, -1, 0), new MMath.Vector3(0, 0, -1)),
      new MMath.Matrix4().lookAt(new MMath.Vector3(0, 0, 0), new MMath.Vector3(0, 0, 1), new MMath.Vector3(0, -1, 0)),
      new MMath.Matrix4().lookAt(new MMath.Vector3(0, 0, 0), new MMath.Vector3(0, 0, -1), new MMath.Vector3(0, -1, 0)),
    ];

    const uniformData = new Float32Array(32 + 4); // 2 mats + 1 float + padding
    const uniformBuffer = this.device.createBuffer({
      size: uniformData.byteLength,
      usage: MSpec.RHIBufferUsage.UNIFORM,
    });

    for (let mip = 0; mip < mipLevels; mip++) {
      const roughness = mip / (mipLevels - 1);
      // const mipSize = Math.floor(size * Math.pow(0.5, mip)); // Unused

      for (let i = 0; i < 6; i++) {
        uniformData.set(projection.getElements(), 0);
        uniformData.set(views[i].getElements(), 16);
        uniformData[32] = roughness;
        uniformBuffer.update(uniformData, 0);

        const bindGroup = this.device.createBindGroup(bindGroupLayout, [
          { binding: 0, resource: { buffer: uniformBuffer } },
          { binding: 1, resource: environmentMap.createView({ dimension: MSpec.RHITextureType.TEXTURE_CUBE } as any) },
          { binding: 2, resource: this.linearSampler! },
        ]);

        const commandEncoder = this.device.createCommandEncoder();
        const pass = commandEncoder.beginRenderPass({
          colorAttachments: [
            {
              view: prefilterMap.createView({
                dimension: MSpec.RHITextureType.TEXTURE_2D,
                baseMipLevel: mip,
                mipLevelCount: 1,
                baseArrayLayer: i,
                arrayLayerCount: 1,
              } as any),
              loadOp: 'clear',
              storeOp: 'store',
              clearColor: [0, 0, 0, 1],
            },
          ],
        });

        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.setVertexBuffer(0, this.cubeVertexBuffer!);
        pass.setIndexBuffer(this.cubeIndexBuffer!, MSpec.RHIIndexFormat.UINT16);
        pass.drawIndexed(this.cubeIndexCount);
        pass.end();

        this.device.submit([commandEncoder.finish()]);
      }
    }

    uniformBuffer.destroy();
    return prefilterMap;
  }

  /**
   * 生成BRDF查找表
   *
   * 预计算镜面BRDF积分，存储为2D纹理
   * X轴：NdotV（法线与视线夹角余弦）
   * Y轴：roughness（粗糙度）
   * 输出：RG通道存储积分结果
   *
   * @returns BRDF LUT纹理
   */
  private async generateBRDFLUT(): Promise<MSpec.IRHITexture> {
    this.ensureGeometry();
    const size = 512; // LUT分辨率

    // 创建目标纹理
    const brdfLUT = this.device.createTexture({
      label: 'IBL_BRDF_LUT',
      width: size,
      height: size,
      format: MSpec.RHITextureFormat.RG16_FLOAT,
      usage: ((MSpec.RHITextureUsage.TEXTURE_BINDING as any) | (MSpec.RHITextureUsage.RENDER_ATTACHMENT as any)) as any,
    });

    const vertexShader = this.device.createShaderModule({
      code: this.getQuadVertexShader(),
      stage: MSpec.RHIShaderStage.VERTEX,
      language: 'glsl',
    });
    const fragmentShader = this.device.createShaderModule({
      code: this.createBRDFIntegrationShader(),
      stage: MSpec.RHIShaderStage.FRAGMENT,
      language: 'glsl',
    });

    const bindGroupLayout = this.device.createBindGroupLayout([]);
    const pipelineLayout = this.device.createPipelineLayout([bindGroupLayout]);

    const pipeline = this.device.createRenderPipeline({
      vertexShader,
      fragmentShader,
      vertexLayout: {
        buffers: [
          {
            index: 0,
            stride: 20,
            stepMode: 'vertex' as MSpec.RHIVertexStepMode,
            attributes: [
              { shaderLocation: 0, format: 'float32x3' as MSpec.RHIVertexFormat, offset: 0 },
              { shaderLocation: 1, format: 'float32x2' as MSpec.RHIVertexFormat, offset: 12 },
            ],
          },
        ],
      },
      primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
      layout: pipelineLayout,
    });

    const bindGroup = this.device.createBindGroup(bindGroupLayout, []);

    const commandEncoder = this.device.createCommandEncoder();
    const pass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: brdfLUT.createView({ dimension: MSpec.RHITextureType.TEXTURE_2D } as any),
          loadOp: 'clear',
          storeOp: 'store',
          clearColor: [0, 0, 0, 1],
        },
      ],
    });

    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, this.quadVertexBuffer!);
    pass.setIndexBuffer(this.quadIndexBuffer!, MSpec.RHIIndexFormat.UINT16);
    pass.drawIndexed(this.quadIndexCount);
    pass.end();

    this.device.submit([commandEncoder.finish()]);

    return brdfLUT;
  }

  // ==================== 辅助方法 ====================

  private ensureGeometry(): void {
    if (this.cubeVertexBuffer) {
      return;
    }

    // Cube
    const cubeVertices = new Float32Array([
      -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
    ]);
    const cubeIndices = new Uint16Array([
      0, 1, 2, 2, 3, 0, 5, 4, 7, 7, 6, 5, 3, 2, 6, 6, 7, 3, 4, 5, 1, 1, 0, 4, 1, 5, 6, 6, 2, 1, 4, 0, 3, 3, 7, 4,
    ]);

    this.cubeVertexBuffer = this.device.createBuffer({
      size: cubeVertices.byteLength,
      usage: MSpec.RHIBufferUsage.VERTEX,
      label: 'IBL Cube Vertex',
    });
    this.cubeVertexBuffer.update(cubeVertices, 0);

    this.cubeIndexBuffer = this.device.createBuffer({
      size: cubeIndices.byteLength,
      usage: MSpec.RHIBufferUsage.INDEX,
      label: 'IBL Cube Index',
    });
    this.cubeIndexBuffer.update(cubeIndices, 0);
    this.cubeIndexCount = cubeIndices.length;

    // Quad
    const quadVertices = new Float32Array([-1, -1, 0, 0, 0, 1, -1, 0, 1, 0, 1, 1, 0, 1, 1, -1, 1, 0, 0, 1]);
    const quadIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    this.quadVertexBuffer = this.device.createBuffer({
      size: quadVertices.byteLength,
      usage: MSpec.RHIBufferUsage.VERTEX,
      label: 'IBL Quad Vertex',
    });
    this.quadVertexBuffer.update(quadVertices, 0);

    this.quadIndexBuffer = this.device.createBuffer({
      size: quadIndices.byteLength,
      usage: MSpec.RHIBufferUsage.INDEX,
      label: 'IBL Quad Index',
    });
    this.quadIndexBuffer.update(quadIndices, 0);
    this.quadIndexCount = quadIndices.length;
  }

  private ensureSampler(): void {
    if (this.linearSampler) {
      return;
    }
    this.linearSampler = this.device.createSampler({
      magFilter: MSpec.RHIFilterMode.LINEAR,
      minFilter: MSpec.RHIFilterMode.LINEAR,
      mipmapFilter: MSpec.RHIFilterMode.LINEAR,
      addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
      addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
      addressModeW: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
    });
  }

  // ==================== 着色器生成 ====================

  private getCubeVertexShader(): string {
    return `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPosition;
uniform mat4 uProjection;
uniform mat4 uView;
out vec3 vWorldPos;
void main() {
    vWorldPos = aPosition;
    gl_Position = uProjection * uView * vec4(aPosition, 1.0);
}`;
  }

  private getQuadVertexShader(): string {
    return `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;
out vec2 vTexCoord;
void main() {
    vTexCoord = aTexCoord;
    gl_Position = vec4(aPosition, 1.0);
}`;
  }

  /**
   * 创建辐照度卷积着色器
   */
  private createIrradianceConvolutionShader(): string {
    return `#version 300 es
precision mediump float;

const float PI = 3.14159265359;

in vec3 vWorldPos;
uniform samplerCube uEnvironmentMap;

out vec4 fragColor;

void main() {
    // 将世界坐标归一化为方向向量
    vec3 N = normalize(vWorldPos);

    vec3 irradiance = vec3(0.0);

    // 切线空间基向量
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(up, N));
    up = normalize(cross(N, right));

    // 半球采样
    float sampleDelta = 0.025;
    float nrSamples = 0.0;

    for(float phi = 0.0; phi < 2.0 * PI; phi += sampleDelta) {
        for(float theta = 0.0; theta < 0.5 * PI; theta += sampleDelta) {
            // 球面坐标转笛卡尔坐标
            vec3 tangentSample = vec3(
                sin(theta) * cos(phi),
                sin(theta) * sin(phi),
                cos(theta)
            );

            // 切线空间 -> 世界空间
            vec3 sampleVec = tangentSample.x * right + tangentSample.y * up + tangentSample.z * N;

            irradiance += texture(uEnvironmentMap, sampleVec).rgb * cos(theta) * sin(theta);
            nrSamples++;
        }
    }

    irradiance = PI * irradiance * (1.0 / float(nrSamples));

    fragColor = vec4(irradiance, 1.0);
}
`;
  }

  /**
   * 创建预过滤着色器
   */
  private createPrefilterShader(): string {
    return `#version 300 es
precision mediump float;

const float PI = 3.14159265359;

in vec3 vWorldPos;
uniform samplerCube uEnvironmentMap;
uniform float uRoughness;

out vec4 fragColor;

// 低差异序列（Hammersley）
float radicalInverse_VdC(uint bits) {
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return float(bits) * 2.3283064365386963e-10; // / 0x100000000
}

vec2 hammersley(uint i, uint N) {
    return vec2(float(i) / float(N), radicalInverse_VdC(i));
}

// 重要性采样（GGX）
vec3 importanceSampleGGX(vec2 Xi, vec3 N, float roughness) {
    float a = roughness * roughness;

    float phi = 2.0 * PI * Xi.x;
    float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));
    float sinTheta = sqrt(1.0 - cosTheta * cosTheta);

    // 球面坐标 -> 笛卡尔坐标
    vec3 H;
    H.x = cos(phi) * sinTheta;
    H.y = sin(phi) * sinTheta;
    H.z = cosTheta;

    // 切线空间 -> 世界空间
    vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(up, N));
    vec3 bitangent = cross(N, tangent);

    vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;
    return normalize(sampleVec);
}

void main() {
    vec3 N = normalize(vWorldPos);
    vec3 R = N;
    vec3 V = R;

    const uint SAMPLE_COUNT = 1024u;
    float totalWeight = 0.0;
    vec3 prefilteredColor = vec3(0.0);

    for(uint i = 0u; i < SAMPLE_COUNT; ++i) {
        vec2 Xi = hammersley(i, SAMPLE_COUNT);
        vec3 H = importanceSampleGGX(Xi, N, uRoughness);
        vec3 L = normalize(2.0 * dot(V, H) * H - V);

        float NdotL = max(dot(N, L), 0.0);
        if(NdotL > 0.0) {
            prefilteredColor += texture(uEnvironmentMap, L).rgb * NdotL;
            totalWeight += NdotL;
        }
    }

    prefilteredColor = prefilteredColor / totalWeight;

    fragColor = vec4(prefilteredColor, 1.0);
}
`;
  }

  /**
   * 创建BRDF积分着色器
   */
  private createBRDFIntegrationShader(): string {
    return `#version 300 es
precision mediump float;

const float PI = 3.14159265359;

in vec2 vTexCoord;
out vec4 fragColor;

// Hammersley序列
float radicalInverse_VdC(uint bits) {
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return float(bits) * 2.3283064365386963e-10;
}

vec2 hammersley(uint i, uint N) {
    return vec2(float(i) / float(N), radicalInverse_VdC(i));
}

vec3 importanceSampleGGX(vec2 Xi, vec3 N, float roughness) {
    float a = roughness * roughness;

    float phi = 2.0 * PI * Xi.x;
    float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));
    float sinTheta = sqrt(1.0 - cosTheta * cosTheta);

    vec3 H;
    H.x = cos(phi) * sinTheta;
    H.y = sin(phi) * sinTheta;
    H.z = cosTheta;

    vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(up, N));
    vec3 bitangent = cross(N, tangent);

    vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;
    return normalize(sampleVec);
}

float geometrySchlickGGX(float NdotV, float roughness) {
    float a = roughness;
    float k = (a * a) / 2.0;

    float nom = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}

float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = geometrySchlickGGX(NdotV, roughness);
    float ggx1 = geometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

vec2 integrateBRDF(float NdotV, float roughness) {
    vec3 V;
    V.x = sqrt(1.0 - NdotV * NdotV);
    V.y = 0.0;
    V.z = NdotV;

    float A = 0.0;
    float B = 0.0;

    vec3 N = vec3(0.0, 0.0, 1.0);

    const uint SAMPLE_COUNT = 1024u;
    for(uint i = 0u; i < SAMPLE_COUNT; ++i) {
        vec2 Xi = hammersley(i, SAMPLE_COUNT);
        vec3 H = importanceSampleGGX(Xi, N, roughness);
        vec3 L = normalize(2.0 * dot(V, H) * H - V);

        float NdotL = max(L.z, 0.0);
        float NdotH = max(H.z, 0.0);
        float VdotH = max(dot(V, H), 0.0);

        if(NdotL > 0.0) {
            float G = geometrySmith(N, V, L, roughness);
            float G_Vis = (G * VdotH) / (NdotH * NdotV);
            float Fc = pow(1.0 - VdotH, 5.0);

            A += (1.0 - Fc) * G_Vis;
            B += Fc * G_Vis;
        }
    }

    A /= float(SAMPLE_COUNT);
    B /= float(SAMPLE_COUNT);

    return vec2(A, B);
}

void main() {
    vec2 integratedBRDF = integrateBRDF(vTexCoord.x, vTexCoord.y);
    fragColor = vec4(integratedBRDF, 0.0, 1.0);
}
`;
  }
}
