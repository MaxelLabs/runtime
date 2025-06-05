/**
 * lighting.ts
 * 光照模型Demo
 * 展示Phong和PBR光照模型，支持实时参数调整
 */

import type { IRHITexture, RHIVertexLayout } from '@maxellabs/core';
import {
  RHIBufferUsage,
  RHIVertexFormat,
  RHIPrimitiveTopology,
  RHITextureFormat,
  RHITextureUsage,
  RHIIndexFormat,
  RHIShaderStage,
} from '@maxellabs/core';
import { WebGLDevice } from '@maxellabs/rhi';
import { Matrix4, Vector3 } from '@maxellabs/math';

// 常量定义
const CANVAS_ID = 'J-canvas';
const DEMO_NAME = '光照模型Demo';

// 全局变量
let device: WebGLDevice;
let canvas: HTMLCanvasElement;
let animationId: number;
let startTime: number;
let renderTargetTexture: IRHITexture;
let frameCount = 0;
let lastTime = 0;

// 光照参数
interface LightingParams {
  lightingModel: 'phong' | 'pbr';
  ambientStrength: number;
  diffuseStrength: number;
  specularStrength: number;
  shininess: number;
  lightPosition: Vector3;
}

let lightingParams: LightingParams = {
  lightingModel: 'phong',
  ambientStrength: 0.3,
  diffuseStrength: 1.0,
  specularStrength: 0.8,
  shininess: 32,
  lightPosition: new Vector3(2, 3, 4),
};

// 相机控制参数
let cameraParams = {
  distance: 5,
  azimuth: 0,
  elevation: 0,
  target: new Vector3(0, 0, 0),
};

// 鼠标交互状态
const mouseState = {
  isDown: false,
  lastX: 0,
  lastY: 0,
};

// Phong光照顶点着色器
const phongVertexShaderSource = `#version 300 es
precision highp float;

// 顶点属性
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

// Uniform变量
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

// 输出到片段着色器
out vec3 vPosition;
out vec3 vNormal;
out vec2 vTexCoord;

void main() {
  // 世界空间位置
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vPosition = worldPosition.xyz;

  // 世界空间法线
  vNormal = normalize(uNormalMatrix * aNormal);

  // 纹理坐标
  vTexCoord = aTexCoord;

  // 最终位置
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

// Phong光照片段着色器
const phongFragmentShaderSource = `#version 300 es
precision mediump float;

// 来自顶点着色器的输入
in vec3 vPosition;
in vec3 vNormal;
in vec2 vTexCoord;

// Uniform变量
uniform vec3 uLightPosition;
uniform vec3 uViewPosition;
uniform vec3 uLightColor;
uniform vec3 uObjectColor;
uniform float uAmbientStrength;
uniform float uDiffuseStrength;
uniform float uSpecularStrength;
uniform float uShininess;

// 输出颜色
out vec4 fragColor;

void main() {
  // 环境光
  vec3 ambient = uAmbientStrength * uLightColor;

  // 漫反射光
  vec3 norm = normalize(vNormal);
  vec3 lightDir = normalize(uLightPosition - vPosition);
  float diff = max(dot(norm, lightDir), 0.0);
  vec3 diffuse = uDiffuseStrength * diff * uLightColor;

  // 镜面反射光
  vec3 viewDir = normalize(uViewPosition - vPosition);
  vec3 reflectDir = reflect(-lightDir, norm);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
  vec3 specular = uSpecularStrength * spec * uLightColor;

  // 最终颜色
  vec3 result = (ambient + diffuse + specular) * uObjectColor;
  fragColor = vec4(result, 1.0);
}
`;

// PBR光照顶点着色器（与Phong相同）
const pbrVertexShaderSource = phongVertexShaderSource;

// PBR光照片段着色器
const pbrFragmentShaderSource = `#version 300 es
precision mediump float;

// 来自顶点着色器的输入
in vec3 vPosition;
in vec3 vNormal;
in vec2 vTexCoord;

// Uniform变量
uniform vec3 uLightPosition;
uniform vec3 uViewPosition;
uniform vec3 uLightColor;
uniform vec3 uAlbedo;
uniform float uMetallic;
uniform float uRoughness;
uniform float uAmbientStrength;

// 输出颜色
out vec4 fragColor;

// 常量
const float PI = 3.14159265359;

// 法线分布函数 (Trowbridge-Reitz GGX)
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

// 几何衰减函数
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

// Fresnel反射
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

void main() {
  vec3 albedo = uAlbedo;
  float metallic = uMetallic;
  float roughness = max(uRoughness, 0.04); // 限制最小粗糙度

  vec3 N = normalize(vNormal);
  vec3 V = normalize(uViewPosition - vPosition);

  // 计算F0（表面反射率）
  vec3 F0 = vec3(0.04);
  F0 = mix(F0, albedo, metallic);

  // 反射率方程
  vec3 Lo = vec3(0.0);

  // 光源方向
  vec3 L = normalize(uLightPosition - vPosition);
  vec3 H = normalize(V + L);
  float distance = length(uLightPosition - vPosition);
  float attenuation = 1.0 / (distance * distance);
  vec3 radiance = uLightColor * attenuation;

  // Cook-Torrance BRDF
  float NDF = DistributionGGX(N, H, roughness);
  float G = GeometrySmith(N, V, L, roughness);
  vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

  vec3 kS = F;
  vec3 kD = vec3(1.0) - kS;
  kD *= 1.0 - metallic;

  vec3 numerator = NDF * G * F;
  float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
  vec3 specular = numerator / denominator;

  float NdotL = max(dot(N, L), 0.0);
  Lo += (kD * albedo / PI + specular) * radiance * NdotL;

  // 环境光
  vec3 ambient = vec3(uAmbientStrength) * albedo;

  vec3 color = ambient + Lo;

  // HDR色调映射
  color = color / (color + vec3(1.0));
  // Gamma校正
  color = pow(color, vec3(1.0/2.2));

  fragColor = vec4(color, 1.0);
}
`;

/**
 * 生成球体几何数据
 */
function generateSphere(radius: number, widthSegments: number, heightSegments: number) {
  const vertices: number[] = [];
  const indices: number[] = [];

  // 生成顶点
  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments;
    const theta = v * Math.PI;

    for (let x = 0; x <= widthSegments; x++) {
      const u = x / widthSegments;
      const phi = u * Math.PI * 2;

      // 位置
      const px = -radius * Math.cos(phi) * Math.sin(theta);
      const py = radius * Math.cos(theta);
      const pz = radius * Math.sin(phi) * Math.sin(theta);

      // 法线（单位球）
      const nx = px / radius;
      const ny = py / radius;
      const nz = pz / radius;

      // 纹理坐标
      const tu = u;
      const tv = v;

      vertices.push(px, py, pz, nx, ny, nz, tu, tv);
    }
  }

  // 生成索引
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const a = y * (widthSegments + 1) + x;
      const b = a + widthSegments + 1;

      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
  };
}

/**
 * 更新FPS显示
 */
function updateFPS(currentTime: number): void {
  frameCount++;

  if (currentTime - lastTime >= 1000) {
    const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
    const fpsCounter = document.getElementById('fpsCounter');
    if (fpsCounter) {
      fpsCounter.textContent = `FPS: ${fps}`;
    }
    frameCount = 0;
    lastTime = currentTime;
  }
}

/**
 * 计算相机位置
 */
function getCameraPosition(): Vector3 {
  const x = cameraParams.distance * Math.cos(cameraParams.elevation) * Math.cos(cameraParams.azimuth);
  const y = cameraParams.distance * Math.sin(cameraParams.elevation);
  const z = cameraParams.distance * Math.cos(cameraParams.elevation) * Math.sin(cameraParams.azimuth);

  return new Vector3(x, y, z).add(cameraParams.target);
}

/**
 * 初始化demo
 */
async function init(): Promise<void> {
  console.info(`${DEMO_NAME} 开始初始化...`);

  // ===== 第1步：准备渲染目标 =====
  canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement;
  if (!canvas) {
    throw new Error(`找不到画布元素: ${CANVAS_ID}`);
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // ===== 第2步：创建RHI设备 =====
  device = new WebGLDevice(canvas);
  console.info('WebGL设备创建成功');

  // ===== 第3步：创建着色器程序 =====
  const phongVertexShader = device.createShaderModule({
    code: phongVertexShaderSource,
    language: 'glsl',
    stage: 'vertex',
    label: 'Phong Vertex Shader',
  });

  const phongFragmentShader = device.createShaderModule({
    code: phongFragmentShaderSource,
    language: 'glsl',
    stage: 'fragment',
    label: 'Phong Fragment Shader',
  });

  const pbrVertexShader = device.createShaderModule({
    code: pbrVertexShaderSource,
    language: 'glsl',
    stage: 'vertex',
    label: 'PBR Vertex Shader',
  });

  const pbrFragmentShader = device.createShaderModule({
    code: pbrFragmentShaderSource,
    language: 'glsl',
    stage: 'fragment',
    label: 'PBR Fragment Shader',
  });

  console.info('着色器模块创建成功');

  // ===== 第4步：生成球体几何数据 =====
  const sphereData = generateSphere(1, 32, 16);

  // ===== 第5步：创建顶点和索引缓冲区 =====
  const vertexBuffer = device.createBuffer({
    size: sphereData.vertices.byteLength,
    usage: RHIBufferUsage.VERTEX,
    hint: 'static',
    initialData: sphereData.vertices,
    label: 'Sphere Vertex Buffer',
  });

  const indexBuffer = device.createBuffer({
    size: sphereData.indices.byteLength,
    usage: RHIBufferUsage.INDEX,
    hint: 'static',
    initialData: sphereData.indices,
    label: 'Sphere Index Buffer',
  });

  console.info('缓冲区创建成功');

  // ===== 第6步：定义顶点布局 =====
  const vertexLayout: RHIVertexLayout = {
    buffers: [
      {
        index: 0,
        stride: 32, // 8个float每顶点 (3位置 + 3法线 + 2纹理坐标) * 4字节
        stepMode: 'vertex',
        attributes: [
          {
            name: 'aPosition',
            format: RHIVertexFormat.FLOAT32X3,
            offset: 0,
            shaderLocation: 0,
          },
          {
            name: 'aNormal',
            format: RHIVertexFormat.FLOAT32X3,
            offset: 12,
            shaderLocation: 1,
          },
          {
            name: 'aTexCoord',
            format: RHIVertexFormat.FLOAT32X2,
            offset: 24,
            shaderLocation: 2,
          },
        ],
      },
    ],
  };

  // ===== 第7步：创建Uniform缓冲区 =====
  const modelMatrixBuffer = device.createBuffer({
    size: 64,
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Model Matrix Buffer',
    extension: {
      typeInfo: {
        uniformName: 'uModelMatrix',
        uniformType: 'mat4',
      },
    },
  });

  const viewMatrixBuffer = device.createBuffer({
    size: 64,
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'View Matrix Buffer',
    extension: {
      typeInfo: {
        uniformName: 'uViewMatrix',
        uniformType: 'mat4',
      },
    },
  });

  const projectionMatrixBuffer = device.createBuffer({
    size: 64,
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Projection Matrix Buffer',
    extension: {
      typeInfo: {
        uniformName: 'uProjectionMatrix',
        uniformType: 'mat4',
      },
    },
  });

  const normalMatrixBuffer = device.createBuffer({
    size: 36, // 3x3矩阵
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Normal Matrix Buffer',
    extension: {
      typeInfo: {
        uniformName: 'uNormalMatrix',
        uniformType: 'mat3',
      },
    },
  });

  // 光照参数缓冲区
  //   const lightingBuffer = device.createBuffer({
  //     size: 80, // 多个float值
  //     usage: RHIBufferUsage.UNIFORM,
  //     hint: 'dynamic',
  //     label: 'Lighting Parameters Buffer',
  //   });

  // ===== 第8步：创建绑定组布局 =====
  const phongBindGroupLayout = device.createBindGroupLayout(
    [
      { binding: 0, visibility: RHIShaderStage.VERTEX, name: 'uModelMatrix', buffer: { type: 'uniform' } },
      { binding: 1, visibility: RHIShaderStage.VERTEX, name: 'uViewMatrix', buffer: { type: 'uniform' } },
      { binding: 2, visibility: RHIShaderStage.VERTEX, name: 'uProjectionMatrix', buffer: { type: 'uniform' } },
      { binding: 3, visibility: RHIShaderStage.VERTEX, name: 'uNormalMatrix', buffer: { type: 'uniform' } },
      { binding: 4, visibility: RHIShaderStage.FRAGMENT, name: 'uLightPosition', buffer: { type: 'uniform' } },
      { binding: 5, visibility: RHIShaderStage.FRAGMENT, name: 'uViewPosition', buffer: { type: 'uniform' } },
      { binding: 6, visibility: RHIShaderStage.FRAGMENT, name: 'uLightColor', buffer: { type: 'uniform' } },
      { binding: 7, visibility: RHIShaderStage.FRAGMENT, name: 'uObjectColor', buffer: { type: 'uniform' } },
      { binding: 8, visibility: RHIShaderStage.FRAGMENT, name: 'uAmbientStrength', buffer: { type: 'uniform' } },
      { binding: 9, visibility: RHIShaderStage.FRAGMENT, name: 'uDiffuseStrength', buffer: { type: 'uniform' } },
      { binding: 10, visibility: RHIShaderStage.FRAGMENT, name: 'uSpecularStrength', buffer: { type: 'uniform' } },
      { binding: 11, visibility: RHIShaderStage.FRAGMENT, name: 'uShininess', buffer: { type: 'uniform' } },
    ],
    'Phong Lighting BindGroup Layout'
  );

  // ===== 第9步：创建渲染管线 =====
  const phongPipelineLayout = device.createPipelineLayout([phongBindGroupLayout], 'Phong Pipeline Layout');

  const phongRenderPipeline = device.createRenderPipeline({
    vertexShader: phongVertexShader,
    fragmentShader: phongFragmentShader,
    vertexLayout,
    primitiveTopology: RHIPrimitiveTopology.TRIANGLE_LIST,
    layout: phongPipelineLayout,
    label: 'Phong Render Pipeline',
  });

  const pbrRenderPipeline = device.createRenderPipeline({
    vertexShader: pbrVertexShader,
    fragmentShader: pbrFragmentShader,
    vertexLayout,
    primitiveTopology: RHIPrimitiveTopology.TRIANGLE_LIST,
    layout: phongPipelineLayout, // 暂时使用相同的布局
    label: 'PBR Render Pipeline',
  });

  console.info('渲染管线创建成功');

  // ===== 第10步：创建渲染目标纹理 =====
  renderTargetTexture = device.createTexture({
    width: canvas.width,
    height: canvas.height,
    format: RHITextureFormat.RGBA8_UNORM,
    usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
    dimension: '2d',
    label: 'Render Target Texture',
  });

  // ===== 第11步：创建绑定组 =====
  // 这里需要创建所有uniform的具体缓冲区
  const lightPositionBuffer = device.createBuffer({
    size: 12, // vec3
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Light Position Buffer',
    extension: { typeInfo: { uniformName: 'uLightPosition', uniformType: 'vec3' } },
  });

  const viewPositionBuffer = device.createBuffer({
    size: 12, // vec3
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'View Position Buffer',
    extension: { typeInfo: { uniformName: 'uViewPosition', uniformType: 'vec3' } },
  });

  const lightColorBuffer = device.createBuffer({
    size: 12, // vec3
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Light Color Buffer',
    extension: { typeInfo: { uniformName: 'uLightColor', uniformType: 'vec3' } },
  });

  const objectColorBuffer = device.createBuffer({
    size: 12, // vec3
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Object Color Buffer',
    extension: { typeInfo: { uniformName: 'uObjectColor', uniformType: 'vec3' } },
  });

  const ambientStrengthBuffer = device.createBuffer({
    size: 4, // float
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Ambient Strength Buffer',
    extension: { typeInfo: { uniformName: 'uAmbientStrength', uniformType: 'float' } },
  });

  const diffuseStrengthBuffer = device.createBuffer({
    size: 4, // float
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Diffuse Strength Buffer',
    extension: { typeInfo: { uniformName: 'uDiffuseStrength', uniformType: 'float' } },
  });

  const specularStrengthBuffer = device.createBuffer({
    size: 4, // float
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Specular Strength Buffer',
    extension: { typeInfo: { uniformName: 'uSpecularStrength', uniformType: 'float' } },
  });

  const shininessBuffer = device.createBuffer({
    size: 4, // float
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Shininess Buffer',
    extension: { typeInfo: { uniformName: 'uShininess', uniformType: 'float' } },
  });

  const phongBindGroup = device.createBindGroup(
    phongBindGroupLayout,
    [
      { binding: 0, resource: modelMatrixBuffer },
      { binding: 1, resource: viewMatrixBuffer },
      { binding: 2, resource: projectionMatrixBuffer },
      { binding: 3, resource: normalMatrixBuffer },
      { binding: 4, resource: lightPositionBuffer },
      { binding: 5, resource: viewPositionBuffer },
      { binding: 6, resource: lightColorBuffer },
      { binding: 7, resource: objectColorBuffer },
      { binding: 8, resource: ambientStrengthBuffer },
      { binding: 9, resource: diffuseStrengthBuffer },
      { binding: 10, resource: specularStrengthBuffer },
      { binding: 11, resource: shininessBuffer },
    ],
    'Phong BindGroup'
  );

  // ===== 第12步：初始化变换矩阵 =====
  const modelMatrix = new Matrix4();
  const viewMatrix = new Matrix4();
  const projectionMatrix = new Matrix4();
  const normalMatrix = new Matrix4();

  // 设置透视投影矩阵
  projectionMatrix.perspective((45 * Math.PI) / 180, canvas.width / canvas.height, 0.1, 100.0);

  // 初始化缓冲区
  modelMatrixBuffer.update(new Float32Array(modelMatrix.getElements()));
  viewMatrixBuffer.update(new Float32Array(viewMatrix.getElements()));
  projectionMatrixBuffer.update(new Float32Array(projectionMatrix.getElements()));

  // ===== 第13步：保存资源供渲染使用 =====
  (window as any).lightingResources = {
    vertexBuffer,
    indexBuffer,
    phongRenderPipeline,
    pbrRenderPipeline,
    phongBindGroup,
    modelMatrixBuffer,
    viewMatrixBuffer,
    projectionMatrixBuffer,
    normalMatrixBuffer,
    lightPositionBuffer,
    viewPositionBuffer,
    lightColorBuffer,
    objectColorBuffer,
    ambientStrengthBuffer,
    diffuseStrengthBuffer,
    specularStrengthBuffer,
    shininessBuffer,
    modelMatrix,
    viewMatrix,
    projectionMatrix,
    normalMatrix,
    renderTargetTexture,
    indexCount: sphereData.indices.length,
  };

  startTime = performance.now();
  lastTime = startTime;
  console.info(`${DEMO_NAME} 初始化完成`);
}

/**
 * 渲染循环
 */
function render(): void {
  const resources = (window as any).lightingResources;
  if (!resources) {
    return;
  }

  try {
    const currentTime = performance.now();
    const deltaTime = (currentTime - startTime) / 1000;

    // 更新FPS
    updateFPS(currentTime);

    // ===== 第1步：更新变换矩阵 =====
    resources.modelMatrix.identity();
    resources.modelMatrix.rotateY(deltaTime * 0.5);

    // 更新相机
    const cameraPosition = getCameraPosition();
    resources.viewMatrix.lookAt(cameraPosition, cameraParams.target, new Vector3(0, 1, 0));

    // 更新法线矩阵
    const modelViewMatrix = resources.viewMatrix.clone().multiply(resources.modelMatrix);
    resources.normalMatrix.copyFrom(modelViewMatrix);
    resources.normalMatrix.invert();
    resources.normalMatrix.transpose();

    // ===== 第2步：更新Uniform缓冲区 =====
    resources.modelMatrixBuffer.update(new Float32Array(resources.modelMatrix.getElements()));
    resources.viewMatrixBuffer.update(new Float32Array(resources.viewMatrix.getElements()));
    resources.projectionMatrixBuffer.update(new Float32Array(resources.projectionMatrix.getElements()));
    resources.normalMatrixBuffer.update(new Float32Array(resources.normalMatrix.getElements().slice(0, 9)));

    // 更新光照参数
    resources.lightPositionBuffer.update(
      new Float32Array([lightingParams.lightPosition.x, lightingParams.lightPosition.y, lightingParams.lightPosition.z])
    );

    resources.viewPositionBuffer.update(new Float32Array([cameraPosition.x, cameraPosition.y, cameraPosition.z]));

    resources.lightColorBuffer.update(new Float32Array([1.0, 1.0, 1.0])); // 白光
    resources.objectColorBuffer.update(new Float32Array([0.8, 0.2, 0.2])); // 红色物体

    resources.ambientStrengthBuffer.update(new Float32Array([lightingParams.ambientStrength]));
    resources.diffuseStrengthBuffer.update(new Float32Array([lightingParams.diffuseStrength]));
    resources.specularStrengthBuffer.update(new Float32Array([lightingParams.specularStrength]));
    resources.shininessBuffer.update(new Float32Array([lightingParams.shininess]));

    // ===== 第3步：渲染 =====
    const commandEncoder = device.createCommandEncoder('Lighting Render');

    const renderPassDescriptor = {
      colorAttachments: [
        {
          view: resources.renderTargetTexture.createView(),
          loadOp: 'clear' as const,
          storeOp: 'store' as const,
          clearColor: [0.1, 0.1, 0.1, 1.0] as [number, number, number, number],
        },
      ],
    };

    const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);

    // 选择渲染管线
    const currentPipeline =
      lightingParams.lightingModel === 'phong' ? resources.phongRenderPipeline : resources.pbrRenderPipeline;

    renderPass.setPipeline(currentPipeline);
    renderPass.setVertexBuffer(0, resources.vertexBuffer);
    renderPass.setIndexBuffer(resources.indexBuffer, RHIIndexFormat.UINT16);
    renderPass.setBindGroup(0, resources.phongBindGroup);
    renderPass.drawIndexed(resources.indexCount);
    renderPass.end();

    commandEncoder.copyTextureToCanvas({
      source: resources.renderTargetTexture.createView(),
      destination: canvas,
    });

    device.submit([commandEncoder.finish()]);

    animationId = requestAnimationFrame(render);
  } catch (error) {
    console.error('渲染错误:', error);
  }
}

/**
 * 设置事件处理器
 */
function setupEventHandlers(): void {
  // 窗口大小改变
  window.addEventListener('resize', () => {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const resources = (window as any).lightingResources;
      if (resources) {
        if (resources.renderTargetTexture) {
          resources.renderTargetTexture.destroy();
        }

        resources.renderTargetTexture = device.createTexture({
          width: canvas.width,
          height: canvas.height,
          format: RHITextureFormat.RGBA8_UNORM,
          usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
          dimension: '2d',
          label: 'Render Target Texture',
        });

        resources.projectionMatrix.perspective((45 * Math.PI) / 180, canvas.width / canvas.height, 0.1, 100.0);
        resources.projectionMatrixBuffer.update(new Float32Array(resources.projectionMatrix.getElements()));
      }
    }
  });

  // 鼠标控制
  canvas.addEventListener('mousedown', (event) => {
    mouseState.isDown = true;
    mouseState.lastX = event.clientX;
    mouseState.lastY = event.clientY;
  });

  canvas.addEventListener('mousemove', (event) => {
    if (mouseState.isDown) {
      const deltaX = event.clientX - mouseState.lastX;
      const deltaY = event.clientY - mouseState.lastY;

      cameraParams.azimuth += deltaX * 0.01;
      cameraParams.elevation -= deltaY * 0.01;
      cameraParams.elevation = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, cameraParams.elevation));

      mouseState.lastX = event.clientX;
      mouseState.lastY = event.clientY;
    }
  });

  canvas.addEventListener('mouseup', () => {
    mouseState.isDown = false;
  });

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    cameraParams.distance += event.deltaY * 0.01;
    cameraParams.distance = Math.max(2, Math.min(10, cameraParams.distance));
  });

  // UI控件事件
  setupUIControls();

  // 键盘事件
  window.addEventListener('keydown', (event) => {
    switch (event.code) {
      case 'Escape':
        cleanup();
        break;
      case 'F11':
        event.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          canvas.requestFullscreen();
        }
        break;
      case 'Space':
        event.preventDefault();
        resetParameters();
        break;
    }
  });

  console.info('事件处理器设置完成');
}

/**
 * 设置UI控件事件
 */
function setupUIControls(): void {
  // 光照模型切换
  const lightingModelSelect = document.getElementById('lightingModel') as HTMLSelectElement;
  if (lightingModelSelect) {
    lightingModelSelect.addEventListener('change', (event) => {
      lightingParams.lightingModel = (event.target as HTMLSelectElement).value as 'phong' | 'pbr';
    });
  }

  // 参数滑块
  const setupSlider = (id: string, param: keyof LightingParams, displayId: string) => {
    const slider = document.getElementById(id) as HTMLInputElement;
    const display = document.getElementById(displayId) as HTMLSpanElement;

    if (slider && display) {
      slider.addEventListener('input', (event) => {
        const value = parseFloat((event.target as HTMLInputElement).value);
        (lightingParams as any)[param] = value;
        display.textContent = value.toFixed(1);
      });
    }
  };

  setupSlider('ambientStrength', 'ambientStrength', 'ambientValue');
  setupSlider('diffuseStrength', 'diffuseStrength', 'diffuseValue');
  setupSlider('specularStrength', 'specularStrength', 'specularValue');
  setupSlider('shininess', 'shininess', 'shininessValue');

  // 光源位置滑块
  const setupLightSlider = (id: string, axis: 'x' | 'y' | 'z', displayId: string) => {
    const slider = document.getElementById(id) as HTMLInputElement;
    const display = document.getElementById(displayId) as HTMLSpanElement;

    if (slider && display) {
      slider.addEventListener('input', (event) => {
        const value = parseFloat((event.target as HTMLInputElement).value);
        lightingParams.lightPosition[axis] = value;
        display.textContent = value.toFixed(1);
      });
    }
  };

  setupLightSlider('lightX', 'x', 'lightXValue');
  setupLightSlider('lightY', 'y', 'lightYValue');
  setupLightSlider('lightZ', 'z', 'lightZValue');
}

/**
 * 重置参数
 */
function resetParameters(): void {
  lightingParams = {
    lightingModel: 'phong',
    ambientStrength: 0.3,
    diffuseStrength: 1.0,
    specularStrength: 0.8,
    shininess: 32,
    lightPosition: new Vector3(2, 3, 4),
  };

  cameraParams = {
    distance: 5,
    azimuth: 0,
    elevation: 0,
    target: new Vector3(0, 0, 0),
  };

  // 更新UI
  const updateSlider = (id: string, value: number) => {
    const slider = document.getElementById(id) as HTMLInputElement;
    if (slider) {
      slider.value = value.toString();
    }
  };

  updateSlider('ambientStrength', lightingParams.ambientStrength);
  updateSlider('diffuseStrength', lightingParams.diffuseStrength);
  updateSlider('specularStrength', lightingParams.specularStrength);
  updateSlider('shininess', lightingParams.shininess);
  updateSlider('lightX', lightingParams.lightPosition.x);
  updateSlider('lightY', lightingParams.lightPosition.y);
  updateSlider('lightZ', lightingParams.lightPosition.z);
}

/**
 * 清理资源
 */
function cleanup(): void {
  console.info('开始清理资源...');

  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = 0;
  }

  const resources = (window as any).lightingResources;
  if (resources) {
    resources.vertexBuffer?.destroy();
    resources.indexBuffer?.destroy();
    resources.phongRenderPipeline?.destroy();
    resources.pbrRenderPipeline?.destroy();
    resources.phongBindGroup?.destroy();
    resources.renderTargetTexture?.destroy();
    (window as any).lightingResources = null;
  }

  if (device) {
    device.destroy();
  }

  console.info('资源清理完成');
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    await init();
    setupEventHandlers();
    render();

    console.info(`${DEMO_NAME} 启动成功！`);
    console.info('控制说明:');
    console.info('- 鼠标拖拽: 旋转相机');
    console.info('- 滚轮: 缩放视角');
    console.info('- ESC: 退出demo');
    console.info('- F11: 切换全屏');
    console.info('- Space: 重置参数');
  } catch (error: any) {
    console.error(`${DEMO_NAME} 初始化失败:`, error);

    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 10px;
      font-family: monospace;
      z-index: 1000;
    `;
    errorDiv.textContent = `${DEMO_NAME} 初始化失败: ${error.message}`;
    document.body.appendChild(errorDiv);
  }
}

// 页面加载完成后启动demo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

// 页面卸载时清理资源
window.addEventListener('beforeunload', cleanup);
