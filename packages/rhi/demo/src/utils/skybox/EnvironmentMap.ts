/**
 * skybox/EnvironmentMap.ts
 * 环境映射管理器 - 为PBR材质提供IBL（基于图像的光照）
 */

import { MSpec, MMath } from '@maxellabs/core';
import type { DemoRunner } from '../core';
import type { EnvironmentMapData } from './types';

/**
 * 环境映射管理器
 *
 * 从天空盒立方体贴图生成IBL所需的贴图：
 * - 漫反射辐照度图（Diffuse Irradiance Map）
 * - 镜面反射预过滤图（Specular Prefiltered Map）
 * - BRDF积分查找表（BRDF LUT）
 *
 * @example
 * ```typescript
 * const envMap = new EnvironmentMap(runner);
 * const iblData = envMap.generateIBLMaps(skyboxCubemap);
 *
 * // 在PBR着色器中使用
 * // uniform samplerCube uDiffuseIrradiance;
 * // uniform samplerCube uSpecularReflection;
 * // uniform sampler2D uBRDFLUT;
 * ```
 */
export class EnvironmentMap {
  private runner: DemoRunner;

  // 常量
  private readonly IRRADIANCE_SIZE = 32; // 辐照度图尺寸（小，因为是低频信号）
  private readonly PREFILTER_SIZE = 128; // 预过滤图尺寸
  private readonly PREFILTER_MIP_LEVELS = 5; // Mipmap层级数
  private readonly BRDF_LUT_SIZE = 512; // BRDF LUT尺寸

  // 几何体缓存
  private cubeVertexBuffer: MSpec.IRHIBuffer | null = null;
  private cubeIndexBuffer: MSpec.IRHIBuffer | null = null;
  private cubeIndexCount: number = 0;
  private quadVertexBuffer: MSpec.IRHIBuffer | null = null;
  private quadIndexBuffer: MSpec.IRHIBuffer | null = null;
  private quadIndexCount: number = 0;

  // 采样器缓存
  private linearSampler: MSpec.IRHISampler | null = null;

  /**
   * 创建环境映射管理器
   * @param runner Demo运行器
   */
  constructor(runner: DemoRunner) {
    this.runner = runner;
  }

  /**
   * 从天空盒生成IBL贴图
   * @param skyboxCubemap 天空盒立方体贴图
   * @returns IBL数据
   */
  generateIBLMaps(skyboxCubemap: MSpec.IRHITexture): EnvironmentMapData {
    const diffuseIrradiance = this.convolveIrradiance(skyboxCubemap);
    const specularReflection = this.prefilterEnvironment(skyboxCubemap);
    const brdfLUT = this.generateBRDFLUT();

    return {
      diffuseIrradiance,
      specularReflection,
      brdfLUT,
    };
  }

  /**
   * 卷积辐照度图（Diffuse IBL）
   * @param cubemap 源立方体贴图
   * @returns 辐照度立方体贴图
   */
  private convolveIrradiance(cubemap: MSpec.IRHITexture): MSpec.IRHITexture {
    // 创建辐照度立方体贴图
    const irradianceMap = this.runner.track(
      this.runner.device.createTexture({
        width: this.IRRADIANCE_SIZE,
        height: this.IRRADIANCE_SIZE,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        dimension: MSpec.RHITextureType.TEXTURE_CUBE,
        label: 'Irradiance Cubemap',
      })
    );

    // 创建卷积着色器
    const shader = this.createIrradianceShader();

    // 为每个面渲染
    for (let face = 0; face < 6; face++) {
      this.renderCubemapFace(irradianceMap, cubemap, shader, face, 0);
    }

    return irradianceMap;
  }

  /**
   * 预过滤环境贴图（Specular IBL）
   * @param cubemap 源立方体贴图
   * @returns 预过滤立方体贴图（带Mipmap）
   */
  private prefilterEnvironment(cubemap: MSpec.IRHITexture): MSpec.IRHITexture {
    // 创建预过滤立方体贴图（带Mipmap）
    const prefilterMap = this.runner.track(
      this.runner.device.createTexture({
        width: this.PREFILTER_SIZE,
        height: this.PREFILTER_SIZE,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        dimension: MSpec.RHITextureType.TEXTURE_CUBE,
        mipLevelCount: this.PREFILTER_MIP_LEVELS,
        label: 'Prefiltered Environment Cubemap',
      })
    );

    // 创建预过滤着色器
    const shader = this.createPrefilterShader();

    // 为每个Mipmap层级和每个面渲染
    for (let mip = 0; mip < this.PREFILTER_MIP_LEVELS; mip++) {
      const roughness = mip / (this.PREFILTER_MIP_LEVELS - 1);

      for (let face = 0; face < 6; face++) {
        this.renderCubemapFace(prefilterMap, cubemap, shader, face, mip, roughness);
      }
    }

    return prefilterMap;
  }

  /**
   * 生成BRDF积分查找表
   * @returns BRDF LUT纹理
   */
  private generateBRDFLUT(): MSpec.IRHITexture {
    // 创建BRDF LUT纹理（2D）
    const brdfLUT = this.runner.track(
      this.runner.device.createTexture({
        width: this.BRDF_LUT_SIZE,
        height: this.BRDF_LUT_SIZE,
        format: MSpec.RHITextureFormat.RG16_FLOAT,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        dimension: MSpec.RHITextureType.TEXTURE_2D,
        label: 'BRDF LUT',
      })
    );

    // 创建BRDF着色器
    const shader = this.createBRDFShader();

    // 渲染到纹理
    this.renderBRDFLUT(brdfLUT, shader);

    return brdfLUT;
  }

  /**
   * 确保几何体已创建
   */
  private ensureGeometry(): void {
    if (this.cubeVertexBuffer) {
      return;
    }

    const device = this.runner.device;

    // Cube
    const cubeVertices = new Float32Array([
      -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
    ]);
    const cubeIndices = new Uint16Array([
      0,
      1,
      2,
      2,
      3,
      0, // Front
      5,
      4,
      7,
      7,
      6,
      5, // Back
      3,
      2,
      6,
      6,
      7,
      3, // Top
      4,
      5,
      1,
      1,
      0,
      4, // Bottom
      1,
      5,
      6,
      6,
      2,
      1, // Right
      4,
      0,
      3,
      3,
      7,
      4, // Left
    ]);

    this.cubeVertexBuffer = device.createBuffer({
      size: cubeVertices.byteLength,
      usage: MSpec.RHIBufferUsage.VERTEX,
      label: 'EnvMap Cube Vertex',
    });
    this.cubeVertexBuffer.update(cubeVertices, 0);

    this.cubeIndexBuffer = device.createBuffer({
      size: cubeIndices.byteLength,
      usage: MSpec.RHIBufferUsage.INDEX,
      label: 'EnvMap Cube Index',
    });
    this.cubeIndexBuffer.update(cubeIndices, 0);
    this.cubeIndexCount = cubeIndices.length;

    // Quad
    const quadVertices = new Float32Array([-1, -1, 0, 0, 0, 1, -1, 0, 1, 0, 1, 1, 0, 1, 1, -1, 1, 0, 0, 1]);
    const quadIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    this.quadVertexBuffer = device.createBuffer({
      size: quadVertices.byteLength,
      usage: MSpec.RHIBufferUsage.VERTEX,
      label: 'EnvMap Quad Vertex',
    });
    this.quadVertexBuffer.update(quadVertices, 0);

    this.quadIndexBuffer = device.createBuffer({
      size: quadIndices.byteLength,
      usage: MSpec.RHIBufferUsage.INDEX,
      label: 'EnvMap Quad Index',
    });
    this.quadIndexBuffer.update(quadIndices, 0);
    this.quadIndexCount = quadIndices.length;
  }

  /**
   * 确保采样器已创建
   */
  private ensureSampler(): void {
    if (this.linearSampler) {
      return;
    }

    this.linearSampler = this.runner.device.createSampler({
      magFilter: MSpec.RHIFilterMode.LINEAR,
      minFilter: MSpec.RHIFilterMode.LINEAR,
      mipmapFilter: MSpec.RHIFilterMode.LINEAR,
      addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
      addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
      addressModeW: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
    });
  }

  /**
   * 创建辐照度卷积着色器
   */
  private createIrradianceShader(): { vertex: string; fragment: string } {
    const vertex = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;

uniform mat4 uProjection;
uniform mat4 uView;

out vec3 vWorldPos;

void main() {
    vWorldPos = aPosition;
    gl_Position = uProjection * uView * vec4(aPosition, 1.0);
}`;

    const fragment = `#version 300 es
precision mediump float;

in vec3 vWorldPos;
uniform samplerCube uEnvironmentMap;

out vec4 fragColor;

const float PI = 3.14159265359;

void main() {
    // 归一化方向
    vec3 N = normalize(vWorldPos);

    // 计算切线空间
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(up, N));
    up = normalize(cross(N, right));

    // 卷积积分
    vec3 irradiance = vec3(0.0);
    float sampleDelta = 0.025;
    float nrSamples = 0.0;

    for (float phi = 0.0; phi < 2.0 * PI; phi += sampleDelta) {
        for (float theta = 0.0; theta < 0.5 * PI; theta += sampleDelta) {
            // 球面坐标转笛卡尔坐标
            vec3 tangentSample = vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta));
            // 切线空间转世界空间
            vec3 sampleVec = tangentSample.x * right + tangentSample.y * up + tangentSample.z * N;

            irradiance += texture(uEnvironmentMap, sampleVec).rgb * cos(theta) * sin(theta);
            nrSamples += 1.0;
        }
    }

    irradiance = PI * irradiance / nrSamples;

    fragColor = vec4(irradiance, 1.0);
}`;

    return { vertex, fragment };
  }

  /**
   * 创建预过滤着色器
   */
  private createPrefilterShader(): { vertex: string; fragment: string } {
    const vertex = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;

uniform mat4 uProjection;
uniform mat4 uView;

out vec3 vWorldPos;

void main() {
    vWorldPos = aPosition;
    gl_Position = uProjection * uView * vec4(aPosition, 1.0);
}`;

    const fragment = `#version 300 es
precision mediump float;

in vec3 vWorldPos;
uniform samplerCube uEnvironmentMap;
uniform float uRoughness;

out vec4 fragColor;

const float PI = 3.14159265359;
const uint SAMPLE_COUNT = 1024u;

// 低差异序列（Hammersley）
float RadicalInverse_VdC(uint bits) {
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return float(bits) * 2.3283064365386963e-10; // / 0x100000000
}

vec2 Hammersley(uint i, uint N) {
    return vec2(float(i) / float(N), RadicalInverse_VdC(i));
}

// 重要性采样（GGX）
vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness) {
    float a = roughness * roughness;

    float phi = 2.0 * PI * Xi.x;
    float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a * a - 1.0) * Xi.y));
    float sinTheta = sqrt(1.0 - cosTheta * cosTheta);

    // 球面坐标转笛卡尔坐标
    vec3 H;
    H.x = cos(phi) * sinTheta;
    H.y = sin(phi) * sinTheta;
    H.z = cosTheta;

    // 切线空间转世界空间
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

    float totalWeight = 0.0;
    vec3 prefilteredColor = vec3(0.0);

    for (uint i = 0u; i < SAMPLE_COUNT; ++i) {
        vec2 Xi = Hammersley(i, SAMPLE_COUNT);
        vec3 H = ImportanceSampleGGX(Xi, N, uRoughness);
        vec3 L = normalize(2.0 * dot(V, H) * H - V);

        float NdotL = max(dot(N, L), 0.0);
        if (NdotL > 0.0) {
            prefilteredColor += texture(uEnvironmentMap, L).rgb * NdotL;
            totalWeight += NdotL;
        }
    }

    prefilteredColor = prefilteredColor / totalWeight;

    fragColor = vec4(prefilteredColor, 1.0);
}`;

    return { vertex, fragment };
  }

  /**
   * 创建BRDF着色器
   */
  private createBRDFShader(): { vertex: string; fragment: string } {
    const vertex = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec2 aTexCoord;

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

    const fragment = `#version 300 es
precision mediump float;

in vec2 vTexCoord;
out vec4 fragColor;

const float PI = 3.14159265359;
const uint SAMPLE_COUNT = 1024u;

// 低差异序列（Hammersley）
float RadicalInverse_VdC(uint bits) {
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return float(bits) * 2.3283064365386963e-10;
}

vec2 Hammersley(uint i, uint N) {
    return vec2(float(i) / float(N), RadicalInverse_VdC(i));
}

vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness) {
    float a = roughness * roughness;

    float phi = 2.0 * PI * Xi.x;
    float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a * a - 1.0) * Xi.y));
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

float GeometrySchlickGGX(float NdotV, float roughness) {
    float a = roughness;
    float k = (a * a) / 2.0;

    float nom = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

vec2 IntegrateBRDF(float NdotV, float roughness) {
    vec3 V;
    V.x = sqrt(1.0 - NdotV * NdotV);
    V.y = 0.0;
    V.z = NdotV;

    float A = 0.0;
    float B = 0.0;

    vec3 N = vec3(0.0, 0.0, 1.0);

    for (uint i = 0u; i < SAMPLE_COUNT; ++i) {
        vec2 Xi = Hammersley(i, SAMPLE_COUNT);
        vec3 H = ImportanceSampleGGX(Xi, N, roughness);
        vec3 L = normalize(2.0 * dot(V, H) * H - V);

        float NdotL = max(L.z, 0.0);
        float NdotH = max(H.z, 0.0);
        float VdotH = max(dot(V, H), 0.0);

        if (NdotL > 0.0) {
            float G = GeometrySmith(N, V, L, roughness);
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
    vec2 integratedBRDF = IntegrateBRDF(vTexCoord.x, vTexCoord.y);
    fragColor = vec4(integratedBRDF, 0.0, 1.0);
}`;

    return { vertex, fragment };
  }

  /**
   * 渲染立方体贴图的一个面
   */
  private renderCubemapFace(
    target: MSpec.IRHITexture,
    source: MSpec.IRHITexture,
    shader: { vertex: string; fragment: string },
    face: number,
    mipLevel: number,
    roughness: number = 0
  ): void {
    this.ensureGeometry();
    this.ensureSampler();

    const device = this.runner.device;

    // 1. 准备 Uniform 数据
    const projection = new MMath.Matrix4().perspective(Math.PI / 2, 1.0, 0.1, 10.0);
    const views = [
      new MMath.Matrix4().lookAt(new MMath.Vector3(0, 0, 0), new MMath.Vector3(1, 0, 0), new MMath.Vector3(0, -1, 0)), // +X
      new MMath.Matrix4().lookAt(new MMath.Vector3(0, 0, 0), new MMath.Vector3(-1, 0, 0), new MMath.Vector3(0, -1, 0)), // -X
      new MMath.Matrix4().lookAt(new MMath.Vector3(0, 0, 0), new MMath.Vector3(0, 1, 0), new MMath.Vector3(0, 0, 1)), // +Y
      new MMath.Matrix4().lookAt(new MMath.Vector3(0, 0, 0), new MMath.Vector3(0, -1, 0), new MMath.Vector3(0, 0, -1)), // -Y
      new MMath.Matrix4().lookAt(new MMath.Vector3(0, 0, 0), new MMath.Vector3(0, 0, 1), new MMath.Vector3(0, -1, 0)), // +Z
      new MMath.Matrix4().lookAt(new MMath.Vector3(0, 0, 0), new MMath.Vector3(0, 0, -1), new MMath.Vector3(0, -1, 0)), // -Z
    ];

    const uniformData = new Float32Array(32 + 4); // 2 * mat4 + float + padding
    uniformData.set(projection.getElements(), 0);
    uniformData.set(views[face].getElements(), 16);
    uniformData[32] = roughness;

    const uniformBuffer = device.createBuffer({
      size: uniformData.byteLength,
      usage: MSpec.RHIBufferUsage.UNIFORM,
      label: 'EnvMap Uniforms',
    });
    uniformBuffer.update(uniformData, 0);

    // 2. 创建管线
    const vertexShader = device.createShaderModule({
      code: shader.vertex,
      language: 'glsl',
      stage: MSpec.RHIShaderStage.VERTEX,
    });
    const fragmentShader = device.createShaderModule({
      code: shader.fragment,
      language: 'glsl',
      stage: MSpec.RHIShaderStage.FRAGMENT,
    });

    const bindGroupLayout = device.createBindGroupLayout([
      {
        binding: 0,
        visibility: MSpec.RHIShaderStage.VERTEX,
        buffer: { type: 'uniform' },
      },
      {
        binding: 1,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        texture: { sampleType: 'float', viewDimension: 'cube' },
      },
      { binding: 2, visibility: MSpec.RHIShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
    ]);

    const pipelineLayout = device.createPipelineLayout([bindGroupLayout]);

    const pipeline = device.createRenderPipeline({
      vertexShader,
      fragmentShader,
      vertexLayout: {
        buffers: [
          {
            index: 0,
            stride: 12, // vec3
            stepMode: 'vertex' as MSpec.RHIVertexStepMode,
            attributes: [
              {
                shaderLocation: 0,
                format: 'float32x3' as MSpec.RHIVertexFormat,
                offset: 0,
              },
            ],
          },
        ],
      },
      primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
      layout: pipelineLayout,
      label: 'EnvMap Pipeline',
    });

    // 3. 创建绑定组
    const bindGroup = device.createBindGroup(bindGroupLayout, [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
      {
        binding: 1,
        resource: source.createView({
          dimension: MSpec.RHITextureType.TEXTURE_CUBE,
        } as any),
      },
      {
        binding: 2,
        resource: this.linearSampler!,
      },
    ]);

    // 4. 渲染
    const commandEncoder = device.createCommandEncoder();
    const pass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: target.createView({
            dimension: MSpec.RHITextureType.TEXTURE_2D,
            baseMipLevel: mipLevel,
            mipLevelCount: 1,
            baseArrayLayer: face,
            arrayLayerCount: 1,
          } as any),
          loadOp: 'clear',
          storeOp: 'store',
          clearColor: [0, 0, 0, 0],
        },
      ],
      label: `EnvMap Face ${face} Mip ${mipLevel}`,
    });

    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, this.cubeVertexBuffer!);
    pass.setIndexBuffer(this.cubeIndexBuffer!, MSpec.RHIIndexFormat.UINT16);
    pass.drawIndexed(this.cubeIndexCount);
    pass.end();

    device.submit([commandEncoder.finish()]);

    // 清理临时资源
    uniformBuffer.destroy();
  }

  /**
   * 渲染BRDF LUT
   */
  private renderBRDFLUT(target: MSpec.IRHITexture, shader: { vertex: string; fragment: string }): void {
    this.ensureGeometry();
    const device = this.runner.device;

    const vertexShader = device.createShaderModule({
      code: shader.vertex,
      language: 'glsl',
      stage: MSpec.RHIShaderStage.VERTEX,
    });
    const fragmentShader = device.createShaderModule({
      code: shader.fragment,
      language: 'glsl',
      stage: MSpec.RHIShaderStage.FRAGMENT,
    });

    const bindGroupLayout = device.createBindGroupLayout([]);
    const pipelineLayout = device.createPipelineLayout([bindGroupLayout]);

    const pipeline = device.createRenderPipeline({
      vertexShader,
      fragmentShader,
      vertexLayout: {
        buffers: [
          {
            index: 0,
            stride: 20, // vec3 pos + vec2 tex
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
      label: 'BRDF LUT Pipeline',
    });

    const bindGroup = device.createBindGroup(bindGroupLayout, []);

    const commandEncoder = device.createCommandEncoder();
    const pass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: target.createView({
            dimension: MSpec.RHITextureType.TEXTURE_2D,
          } as any),
          loadOp: 'clear',
          storeOp: 'store',
          clearColor: [0, 0, 0, 1],
        },
      ],
      label: 'BRDF LUT',
    });

    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, this.quadVertexBuffer!);
    pass.setIndexBuffer(this.quadIndexBuffer!, MSpec.RHIIndexFormat.UINT16);
    pass.drawIndexed(this.quadIndexCount);
    pass.end();

    device.submit([commandEncoder.finish()]);
  }
}
