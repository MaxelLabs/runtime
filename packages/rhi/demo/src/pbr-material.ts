/**
 * pbr-material.ts
 * 基于物理的渲染（PBR）材质系统 Demo
 *
 * 核心特性：
 * - Cook-Torrance BRDF（双向反射分布函数）
 * - 金属度/粗糙度工作流（Metallic/Roughness Workflow）
 * - GGX法线分布函数（NDF）
 * - Schlick几何衰减（Geometry Attenuation）
 * - Fresnel反射（Fresnel Reflection）
 * - HDR色调映射 + Gamma校正
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, OrbitController, Stats, GeometryGenerator, SimpleGUI } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
  mat4 uNormalMatrix;
};

out vec3 vWorldPosition;
out vec3 vNormal;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = normalize((uNormalMatrix * vec4(aNormal, 0.0)).xyz);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

// 点光源结构体
struct PointLight {
  vec3 position;     // 16 bytes (with padding)
  vec3 color;        // 16 bytes (with padding)
  float constant;    // 4 bytes
  float linear;      // 4 bytes
  float quadratic;   // 4 bytes
  float _padding;    // 4 bytes (alignment)
};

// PBR材质参数
layout(std140) uniform PBRMaterial {
  vec3 uAlbedo;           // 16 bytes (12 + 4 padding)
  float uMetallic;        // 4 bytes
  float uRoughness;       // 4 bytes
  float uAmbientStrength; // 4 bytes
  float _padMat1;         // 4 bytes
  float _padMat2;         // 4 bytes
};

// 点光源数据
layout(std140) uniform PointLights {
  PointLight uLights[2];  // 96 bytes
  int uLightCount;        // 4 bytes
  float _pad1;
  float _pad2;
  float _pad3;
};

// 相机数据
uniform CameraData {
  vec3 uCameraPosition;   // 16 bytes (with padding)
};

in vec3 vWorldPosition;
in vec3 vNormal;

out vec4 fragColor;

// 常量
const float PI = 3.14159265359;

// ==================== PBR函数 ====================

// Trowbridge-Reitz GGX 法线分布函数
float DistributionGGX(vec3 N, vec3 H, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float NdotH = max(dot(N, H), 0.0);
  float NdotH2 = NdotH * NdotH;

  float num = a2;
  float denom = (NdotH2 * (a2 - 1.0) + 1.0);
  denom = PI * denom * denom;

  return num / denom;
}

// Schlick-GGX 几何衰减函数
float GeometrySchlickGGX(float NdotV, float roughness) {
  float r = (roughness + 1.0);
  float k = (r * r) / 8.0;

  float num = NdotV;
  float denom = NdotV * (1.0 - k) + k;

  return num / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
  float NdotV = max(dot(N, V), 0.0);
  float NdotL = max(dot(N, L), 0.0);
  float ggx2 = GeometrySchlickGGX(NdotV, roughness);
  float ggx1 = GeometrySchlickGGX(NdotL, roughness);

  return ggx1 * ggx2;
}

// Fresnel反射（Schlick近似）
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// ==================== 主函数 ====================

void main() {
  vec3 albedo = uAlbedo;
  float metallic = uMetallic;
  float roughness = max(uRoughness, 0.04); // 限制最小粗糙度

  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCameraPosition - vWorldPosition);

  // 计算F0（表面反射率）
  vec3 F0 = vec3(0.04); // 非金属的基础反射率
  F0 = mix(F0, albedo, metallic);

  // 反射率方程（累加所有光源贡献）
  vec3 Lo = vec3(0.0);

  for (int i = 0; i < 2; i++) {
    if (i >= uLightCount) break;

    PointLight light = uLights[i];

    // 光源方向
    vec3 L = normalize(light.position - vWorldPosition);
    vec3 H = normalize(V + L);
    float distance = length(light.position - vWorldPosition);

    // 距离衰减
    float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * distance * distance);
    vec3 radiance = light.color * attenuation;

    // Cook-Torrance BRDF
    float NDF = DistributionGGX(N, H, roughness);
    float G = GeometrySmith(N, V, L, roughness);
    vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

    vec3 kS = F; // 镜面反射比率
    vec3 kD = vec3(1.0) - kS; // 漫反射比率
    kD *= 1.0 - metallic; // 金属材质没有漫反射

    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
    vec3 specular = numerator / denominator;

    float NdotL = max(dot(N, L), 0.0);
    Lo += (kD * albedo / PI + specular) * radiance * NdotL;
  }

  // 环境光
  vec3 ambient = vec3(uAmbientStrength) * albedo;

  vec3 color = ambient + Lo;

  // HDR色调映射（Reinhard）
  color = color / (color + vec3(1.0));
  // Gamma校正
  color = pow(color, vec3(1.0 / 2.2));

  fragColor = vec4(color, 1.0);
}
`;

// ==================== 主程序 ====================

const runner = new DemoRunner({
  canvasId: 'J-canvas',
  name: 'PBR Material Demo',
  clearColor: [0.1, 0.1, 0.1, 1.0],
});

let depthTexture: MSpec.IRHITexture;

const updateDepthTexture = () => {
  if (depthTexture) {
    depthTexture.destroy();
  }
  depthTexture = runner.track(
    runner.device.createTexture({
      width: runner.width,
      height: runner.height,
      format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
      usage: MSpec.RHITextureUsage.RENDER_ATTACHMENT,
      label: 'Depth Texture',
    })
  );
};

// 材质参数
const materialParams = {
  metallic: 0.5,
  roughness: 0.5,
  albedo: [1.0, 0.0, 0.0], // 红色
  ambientStrength: 0.03,
};

// 光源参数
const lightParams = [
  {
    position: [3.0, 3.0, 3.0],
    color: [1.0, 1.0, 1.0],
    constant: 1.0,
    linear: 0.09,
    quadratic: 0.032,
  },
  {
    position: [-3.0, 2.0, 2.0],
    color: [0.8, 0.9, 1.0],
    constant: 1.0,
    linear: 0.09,
    quadratic: 0.032,
  },
];

(async function main() {
  try {
    await runner.init();

    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });
    const orbit = new OrbitController(runner.canvas, {
      distance: 5,
      enableDamping: true,
    });

    updateDepthTexture();
    runner.onResize(updateDepthTexture);

    // 创建球体几何体
    const sphereGeometry = GeometryGenerator.sphere({
      radius: 1,
      normals: true,
      uvs: false,
    });

    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: sphereGeometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: sphereGeometry.vertices as BufferSource,
        label: 'Sphere Vertex Buffer',
      })
    );

    const indexBuffer = runner.track(
      runner.device.createBuffer({
        size: sphereGeometry.indices!.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        hint: 'static',
        initialData: sphereGeometry.indices as BufferSource,
        label: 'Sphere Index Buffer',
      })
    );

    // 创建 Uniform 缓冲区
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256, // mat4(64)*4
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // PBRMaterial Uniform: 32 bytes (std140)
    const materialBuffer = runner.track(
      runner.device.createBuffer({
        size: 32,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'PBR Material Uniform Buffer',
      })
    );

    // PointLights Uniform: 112 bytes (std140)
    // PointLight[2] = 48*2 = 96 bytes
    // int + padding = 16 bytes
    const lightsBuffer = runner.track(
      runner.device.createBuffer({
        size: 112,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Point Lights Uniform Buffer',
      })
    );

    // Camera Uniform: 16 bytes (vec3 with padding)
    const cameraBuffer = runner.track(
      runner.device.createBuffer({
        size: 16,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Camera Uniform Buffer',
      })
    );

    // 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
      })
    );

    // 创建绑定组布局
    const bindGroupLayout = runner.track(
      runner.device.createBindGroupLayout([
        { binding: 0, visibility: MSpec.RHIShaderStage.VERTEX, buffer: { type: 'uniform' }, name: 'Transforms' },
        { binding: 1, visibility: MSpec.RHIShaderStage.FRAGMENT, buffer: { type: 'uniform' }, name: 'PBRMaterial' },
        { binding: 2, visibility: MSpec.RHIShaderStage.FRAGMENT, buffer: { type: 'uniform' }, name: 'PointLights' },
        { binding: 3, visibility: MSpec.RHIShaderStage.FRAGMENT, buffer: { type: 'uniform' }, name: 'CameraData' },
      ])
    );

    // 创建管线
    const pipelineLayout = runner.track(runner.device.createPipelineLayout([bindGroupLayout]));
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

    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        rasterizationState: { cullMode: MSpec.RHICullMode.BACK },
        depthStencilState: {
          depthWriteEnabled: true,
          depthCompare: MSpec.RHICompareFunction.LESS,
          format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
        },
      })
    );

    // 创建绑定组
    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [
        { binding: 0, resource: transformBuffer },
        { binding: 1, resource: materialBuffer },
        { binding: 2, resource: lightsBuffer },
        { binding: 3, resource: cameraBuffer },
      ])
    );

    // GUI 控制
    const gui = new SimpleGUI();

    gui.addSeparator('🎨 PBR Material');
    gui.add('metallic', {
      value: materialParams.metallic,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        materialParams.metallic = v as number;
      },
    });

    gui.add('roughness', {
      value: materialParams.roughness,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        materialParams.roughness = v as number;
      },
    });

    gui.add('ambientStrength', {
      value: materialParams.ambientStrength,
      min: 0,
      max: 0.2,
      step: 0.01,
      onChange: (v) => {
        materialParams.ambientStrength = v as number;
      },
    });

    gui.addSeparator('🌈 Albedo Color');
    gui.add('albedoR', {
      value: materialParams.albedo[0],
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        materialParams.albedo[0] = v as number;
      },
    });
    gui.add('albedoG', {
      value: materialParams.albedo[1],
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        materialParams.albedo[1] = v as number;
      },
    });
    gui.add('albedoB', {
      value: materialParams.albedo[2],
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        materialParams.albedo[2] = v as number;
      },
    });

    // 更新Uniform函数
    const updateMaterialUniforms = () => {
      // PBRMaterial Buffer (32 bytes)
      const materialData = new Float32Array(8);
      materialData[0] = materialParams.albedo[0];
      materialData[1] = materialParams.albedo[1];
      materialData[2] = materialParams.albedo[2];
      // [3] padding
      materialData[4] = materialParams.metallic;
      materialData[5] = materialParams.roughness;
      materialData[6] = materialParams.ambientStrength;
      // [7-8] padding
      materialBuffer.update(materialData, 0);
    };

    const updateLightsUniforms = () => {
      // PointLights Buffer (112 bytes)
      const lightsData = new Float32Array(28); // 112/4 = 28

      // Light 0
      lightsData[0] = lightParams[0].position[0];
      lightsData[1] = lightParams[0].position[1];
      lightsData[2] = lightParams[0].position[2];
      // [3] padding
      lightsData[4] = lightParams[0].color[0];
      lightsData[5] = lightParams[0].color[1];
      lightsData[6] = lightParams[0].color[2];
      // [7] padding
      lightsData[8] = lightParams[0].constant;
      lightsData[9] = lightParams[0].linear;
      lightsData[10] = lightParams[0].quadratic;
      // [11] padding

      // Light 1
      lightsData[12] = lightParams[1].position[0];
      lightsData[13] = lightParams[1].position[1];
      lightsData[14] = lightParams[1].position[2];
      // [15] padding
      lightsData[16] = lightParams[1].color[0];
      lightsData[17] = lightParams[1].color[1];
      lightsData[18] = lightParams[1].color[2];
      // [19] padding
      lightsData[20] = lightParams[1].constant;
      lightsData[21] = lightParams[1].linear;
      lightsData[22] = lightParams[1].quadratic;
      // [23] padding

      // Light count
      const lightCountData = new Int32Array(lightsData.buffer, 96, 1);
      lightCountData[0] = 2;

      lightsBuffer.update(lightsData, 0);
    };

    // 初始化Uniform
    updateMaterialUniforms();
    updateLightsUniforms();

    // 矩阵
    const modelMatrix = new MMath.Matrix4();
    const normalMatrix = new MMath.Matrix4();

    // 渲染循环
    runner.start((dt) => {
      stats.begin();

      orbit.update(dt);

      // 更新材质Uniform
      updateMaterialUniforms();

      // 缓慢旋转
      modelMatrix.identity();
      modelMatrix.rotateY(performance.now() * 0.0005);

      // 计算法线矩阵
      normalMatrix.copyFrom(modelMatrix);
      normalMatrix.invert();
      normalMatrix.transpose();

      // Transform Uniforms
      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);
      const cameraPos = orbit.getPosition();

      const transformData = new Float32Array(64);
      transformData.set(modelMatrix.toArray(), 0);
      transformData.set(viewMatrix, 16);
      transformData.set(projMatrix, 32);
      transformData.set(normalMatrix.toArray(), 48);
      transformBuffer.update(transformData, 0);

      // Camera Uniform
      const cameraData = new Float32Array(4);
      cameraData[0] = cameraPos.x;
      cameraData[1] = cameraPos.y;
      cameraData[2] = cameraPos.z;
      cameraBuffer.update(cameraData, 0);

      // 渲染
      const { encoder, passDescriptor } = runner.beginFrame();

      // 设置深度附件
      passDescriptor.depthStencilAttachment = {
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      };

      const renderPass = encoder.beginRenderPass(passDescriptor);
      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setIndexBuffer(indexBuffer, MSpec.RHIIndexFormat.UINT16);
      renderPass.setBindGroup(0, bindGroup);
      renderPass.drawIndexed(sphereGeometry.indices!.length);
      renderPass.end();

      runner.endFrame(encoder);

      stats.end();
    });
  } catch (error) {
    console.error('Demo initialization failed:', error);
    throw error;
  }
})();
