/**
 * shadow.ts
 * 阴影映射Demo
 * 展示实时阴影映射技术，支持硬阴影、软阴影和PCF滤波
 */

import type { IRHITexture, RHIVertexLayout, IRHIBuffer, IRHIRenderPipeline, IRHIBindGroup } from '@maxellabs/core';
import {
  RHIBufferUsage,
  RHIVertexFormat,
  RHIPrimitiveTopology,
  RHITextureFormat,
  RHITextureUsage,
  RHIIndexFormat,
  RHIShaderStage,
  RHICompareFunction,
} from '@maxellabs/core';
import { WebGLDevice } from '../../src/webgl/GLDevice';
import { Matrix4, Vector3 } from '@maxellabs/math';

// 常量定义
const CANVAS_ID = 'J-canvas';
const DEMO_NAME = '阴影映射Demo';
const SHADOW_MAP_SIZE = 1024;

// 全局变量
let device: WebGLDevice;
let canvas: HTMLCanvasElement;
let animationId: number;
let startTime: number;
let frameCount = 0;
let lastTime = 0;

// 阴影参数
interface ShadowParams {
  shadowType: 'hard' | 'soft' | 'pcf';
  shadowIntensity: number;
  shadowBias: number;
  pcfRadius: number;
  lightDistance: number;
  lightHeight: number;
  autoRotate: boolean;
  showShadowMap: boolean;
}

let shadowParams: ShadowParams = {
  shadowType: 'hard',
  shadowIntensity: 0.8,
  shadowBias: 0.005,
  pcfRadius: 2,
  lightDistance: 10,
  lightHeight: 8,
  autoRotate: true,
  showShadowMap: true,
};

// 相机控制参数
let cameraParams = {
  distance: 15,
  azimuth: 0.3,
  elevation: 0.4,
  target: new Vector3(0, 0, 0),
};

// 鼠标交互状态
const mouseState = {
  isDown: false,
  lastX: 0,
  lastY: 0,
};

// 光源位置
const lightPosition = new Vector3();
let lightAngle = 0;

// 深度渲染顶点着色器
const depthVertexShaderSource = `#version 300 es
precision highp float;

in vec3 aPosition;

uniform mat4 uLightViewMatrix;
uniform mat4 uLightProjectionMatrix;
uniform mat4 uModelMatrix;

void main() {
  gl_Position = uLightProjectionMatrix * uLightViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
}
`;

// 深度渲染片段着色器
const depthFragmentShaderSource = `#version 300 es
precision highp float;

void main() {
  // 深度值会自动写入深度缓冲区
}
`;

// 阴影渲染顶点着色器
const shadowVertexShaderSource = `#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uLightViewMatrix;
uniform mat4 uLightProjectionMatrix;

out vec3 vWorldPosition;
out vec3 vNormal;
out vec4 vLightSpacePosition;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = normalize(mat3(uModelMatrix) * aNormal);
  
  // 计算在光源空间中的位置
  vLightSpacePosition = uLightProjectionMatrix * uLightViewMatrix * worldPosition;
  
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

// 阴影渲染片段着色器
const shadowFragmentShaderSource = `#version 300 es
precision mediump float;

in vec3 vWorldPosition;
in vec3 vNormal;
in vec4 vLightSpacePosition;

uniform vec3 uLightPosition;
uniform vec3 uViewPosition;
uniform sampler2D uShadowMap;
uniform float uShadowBias;
uniform float uShadowIntensity;
uniform int uShadowType; // 0=hard, 1=soft, 2=pcf
uniform float uPCFRadius;

out vec4 fragColor;

// 硬阴影计算
float calculateHardShadow(vec3 projCoords) {
  float closestDepth = texture(uShadowMap, projCoords.xy).r;
  float currentDepth = projCoords.z;
  
  float shadow = currentDepth - uShadowBias > closestDepth ? 1.0 : 0.0;
  return shadow;
}

// PCF软阴影计算
float calculatePCFShadow(vec3 projCoords) {
  vec2 texelSize = 1.0 / vec2(textureSize(uShadowMap, 0));
  float shadow = 0.0;
  int samples = 0;
  
  for(int x = -2; x <= 2; ++x) {
    for(int y = -2; y <= 2; ++y) {
      float pcfDepth = texture(uShadowMap, projCoords.xy + vec2(x, y) * texelSize * uPCFRadius).r;
      shadow += projCoords.z - uShadowBias > pcfDepth ? 1.0 : 0.0;
      samples++;
    }
  }
  
  return shadow / float(samples);
}

// 软阴影计算（简化版PCSS）
float calculateSoftShadow(vec3 projCoords) {
  vec2 texelSize = 1.0 / vec2(textureSize(uShadowMap, 0));
  float shadow = 0.0;
  float radius = 3.0;
  int samples = 0;
  
  for(float x = -radius; x <= radius; x += 1.0) {
    for(float y = -radius; y <= radius; y += 1.0) {
      vec2 offset = vec2(x, y) * texelSize;
      float pcfDepth = texture(uShadowMap, projCoords.xy + offset).r;
      shadow += projCoords.z - uShadowBias > pcfDepth ? 1.0 : 0.0;
      samples++;
    }
  }
  
  return shadow / float(samples);
}

void main() {
  // 基础材质颜色
  vec3 albedo = vec3(0.8, 0.6, 0.4);
  
  // 计算光照方向
  vec3 lightDir = normalize(uLightPosition - vWorldPosition);
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(uViewPosition - vWorldPosition);
  
  // 环境光
  vec3 ambient = 0.3 * albedo;
  
  // 漫反射
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * albedo;
  
  // 镜面反射
  vec3 reflectDir = reflect(-lightDir, normal);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
  vec3 specular = spec * vec3(0.3);
  
  // 阴影计算
  vec3 projCoords = vLightSpacePosition.xyz / vLightSpacePosition.w;
  projCoords = projCoords * 0.5 + 0.5; // 转换到[0,1]范围
  
  float shadow = 0.0;
  if(projCoords.z <= 1.0 && projCoords.x >= 0.0 && projCoords.x <= 1.0 && 
     projCoords.y >= 0.0 && projCoords.y <= 1.0) {
    
    if(uShadowType == 0) {
      shadow = calculateHardShadow(projCoords);
    } else if(uShadowType == 1) {
      shadow = calculateSoftShadow(projCoords);
    } else if(uShadowType == 2) {
      shadow = calculatePCFShadow(projCoords);
    }
  }
  
  // 应用阴影
  vec3 lighting = ambient + (1.0 - shadow * uShadowIntensity) * (diffuse + specular);
  
  fragColor = vec4(lighting, 1.0);
}
`;

/**
 * 生成平面几何数据
 */
function generatePlane(size: number): { vertices: Float32Array; indices: Uint16Array } {
  const vertices = new Float32Array([
    // 位置           法线
    -size,
    0,
    -size,
    0,
    1,
    0,
    size,
    0,
    -size,
    0,
    1,
    0,
    size,
    0,
    size,
    0,
    1,
    0,
    -size,
    0,
    size,
    0,
    1,
    0,
  ]);

  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

  return { vertices, indices };
}

/**
 * 生成立方体几何数据
 */
function generateCube(size: number): { vertices: Float32Array; indices: Uint16Array } {
  const s = size / 2;

  const vertices = new Float32Array([
    // 前面
    -s,
    -s,
    s,
    0,
    0,
    1,
    s,
    -s,
    s,
    0,
    0,
    1,
    s,
    s,
    s,
    0,
    0,
    1,
    -s,
    s,
    s,
    0,
    0,
    1,

    // 后面
    -s,
    -s,
    -s,
    0,
    0,
    -1,
    -s,
    s,
    -s,
    0,
    0,
    -1,
    s,
    s,
    -s,
    0,
    0,
    -1,
    s,
    -s,
    -s,
    0,
    0,
    -1,

    // 左面
    -s,
    -s,
    -s,
    -1,
    0,
    0,
    -s,
    -s,
    s,
    -1,
    0,
    0,
    -s,
    s,
    s,
    -1,
    0,
    0,
    -s,
    s,
    -s,
    -1,
    0,
    0,

    // 右面
    s,
    -s,
    -s,
    1,
    0,
    0,
    s,
    s,
    -s,
    1,
    0,
    0,
    s,
    s,
    s,
    1,
    0,
    0,
    s,
    -s,
    s,
    1,
    0,
    0,

    // 上面
    -s,
    s,
    -s,
    0,
    1,
    0,
    -s,
    s,
    s,
    0,
    1,
    0,
    s,
    s,
    s,
    0,
    1,
    0,
    s,
    s,
    -s,
    0,
    1,
    0,

    // 下面
    -s,
    -s,
    -s,
    0,
    -1,
    0,
    s,
    -s,
    -s,
    0,
    -1,
    0,
    s,
    -s,
    s,
    0,
    -1,
    0,
    -s,
    -s,
    s,
    0,
    -1,
    0,
  ]);

  const indices = new Uint16Array([
    0,
    1,
    2,
    0,
    2,
    3, // 前面
    4,
    5,
    6,
    4,
    6,
    7, // 后面
    8,
    9,
    10,
    8,
    10,
    11, // 左面
    12,
    13,
    14,
    12,
    14,
    15, // 右面
    16,
    17,
    18,
    16,
    18,
    19, // 上面
    20,
    21,
    22,
    20,
    22,
    23, // 下面
  ]);

  return { vertices, indices };
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
 * 更新光源位置
 */
function updateLightPosition(deltaTime: number): void {
  if (shadowParams.autoRotate) {
    lightAngle += deltaTime * 0.5;
  }

  const radius = shadowParams.lightDistance;
  lightPosition.x = Math.cos(lightAngle) * radius;
  lightPosition.y = shadowParams.lightHeight;
  lightPosition.z = Math.sin(lightAngle) * radius;
}

/**
 * 初始化demo
 */
async function init(): Promise<void> {
  console.info(`${DEMO_NAME} 开始初始化...`);

  // 准备画布
  canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement;
  if (!canvas) {
    throw new Error(`找不到画布元素: ${CANVAS_ID}`);
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // 创建RHI设备
  device = new WebGLDevice(canvas);
  console.info('WebGL设备创建成功');

  // 创建着色器模块
  const depthVertexShader = device.createShaderModule({
    code: depthVertexShaderSource,
    language: 'glsl',
    stage: 'vertex',
    label: 'Depth Vertex Shader',
  });

  const depthFragmentShader = device.createShaderModule({
    code: depthFragmentShaderSource,
    language: 'glsl',
    stage: 'fragment',
    label: 'Depth Fragment Shader',
  });

  const shadowVertexShader = device.createShaderModule({
    code: shadowVertexShaderSource,
    language: 'glsl',
    stage: 'vertex',
    label: 'Shadow Vertex Shader',
  });

  const shadowFragmentShader = device.createShaderModule({
    code: shadowFragmentShaderSource,
    language: 'glsl',
    stage: 'fragment',
    label: 'Shadow Fragment Shader',
  });

  // 生成几何数据
  const planeData = generatePlane(10);
  const cubeData = generateCube(2);

  // 创建顶点缓冲区
  const planeVertexBuffer = device.createBuffer({
    size: planeData.vertices.byteLength,
    usage: RHIBufferUsage.VERTEX,
    hint: 'static',
    initialData: planeData.vertices,
    label: 'Plane Vertex Buffer',
  });

  const cubeVertexBuffer = device.createBuffer({
    size: cubeData.vertices.byteLength,
    usage: RHIBufferUsage.VERTEX,
    hint: 'static',
    initialData: cubeData.vertices,
    label: 'Cube Vertex Buffer',
  });

  // 创建索引缓冲区
  const planeIndexBuffer = device.createBuffer({
    size: planeData.indices.byteLength,
    usage: RHIBufferUsage.INDEX,
    hint: 'static',
    initialData: planeData.indices,
    label: 'Plane Index Buffer',
  });

  const cubeIndexBuffer = device.createBuffer({
    size: cubeData.indices.byteLength,
    usage: RHIBufferUsage.INDEX,
    hint: 'static',
    initialData: cubeData.indices,
    label: 'Cube Index Buffer',
  });

  // 定义顶点布局
  const vertexLayout: RHIVertexLayout = {
    buffers: [
      {
        index: 0,
        stride: 24, // 6个float：位置(3) + 法线(3)
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
        ],
      },
    ],
  };

  // 创建深度纹理（阴影贴图）
  const shadowMap = device.createTexture({
    width: SHADOW_MAP_SIZE,
    height: SHADOW_MAP_SIZE,
    format: RHITextureFormat.DEPTH16_UNORM,
    usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
    dimension: '2d',
    label: 'Shadow Map',
  });

  // 创建阴影贴图采样器
  const shadowMapSampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
    compareFunction: RHICompareFunction.LESS,
    label: 'Shadow Map Sampler',
  });

  // 创建渲染目标纹理
  const renderTargetTexture = device.createTexture({
    width: canvas.width,
    height: canvas.height,
    format: RHITextureFormat.RGBA8_UNORM,
    usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
    dimension: '2d',
    label: 'Render Target Texture',
  });

  // 创建深度缓冲区
  const depthTexture = device.createTexture({
    width: canvas.width,
    height: canvas.height,
    format: RHITextureFormat.DEPTH16_UNORM,
    usage: RHITextureUsage.RENDER_TARGET,
    dimension: '2d',
    label: 'Depth Texture',
  });

  // 创建Uniform缓冲区
  const createUniformBuffer = (name: string, size: number, type = 'mat4') =>
    device.createBuffer({
      size,
      usage: RHIBufferUsage.UNIFORM,
      hint: 'dynamic',
      label: `${name} Buffer`,
      extension: { typeInfo: { uniformName: name, uniformType: type } },
    });

  // 矩阵缓冲区
  const lightViewMatrixBuffer = createUniformBuffer('uLightViewMatrix', 64);
  const lightProjectionMatrixBuffer = createUniformBuffer('uLightProjectionMatrix', 64);
  const modelMatrixBuffer = createUniformBuffer('uModelMatrix', 64);
  const viewMatrixBuffer = createUniformBuffer('uViewMatrix', 64);
  const projectionMatrixBuffer = createUniformBuffer('uProjectionMatrix', 64);

  // 光照参数缓冲区
  const lightPositionBuffer = createUniformBuffer('uLightPosition', 12, 'vec3');
  const viewPositionBuffer = createUniformBuffer('uViewPosition', 12, 'vec3');

  // 阴影参数缓冲区
  const shadowBiasBuffer = createUniformBuffer('uShadowBias', 4, 'float');
  const shadowIntensityBuffer = createUniformBuffer('uShadowIntensity', 4, 'float');
  const shadowTypeBuffer = createUniformBuffer('uShadowType', 4, 'int');
  const pcfRadiusBuffer = createUniformBuffer('uPCFRadius', 4, 'float');

  // 创建绑定组布局
  const depthBindGroupLayout = device.createBindGroupLayout(
    [
      { binding: 0, visibility: RHIShaderStage.VERTEX, name: 'uLightViewMatrix', buffer: { type: 'uniform' } },
      { binding: 1, visibility: RHIShaderStage.VERTEX, name: 'uLightProjectionMatrix', buffer: { type: 'uniform' } },
      { binding: 2, visibility: RHIShaderStage.VERTEX, name: 'uModelMatrix', buffer: { type: 'uniform' } },
    ],
    'Depth BindGroup Layout'
  );

  const shadowBindGroupLayout = device.createBindGroupLayout(
    [
      { binding: 0, visibility: RHIShaderStage.VERTEX, name: 'uModelMatrix', buffer: { type: 'uniform' } },
      { binding: 1, visibility: RHIShaderStage.VERTEX, name: 'uViewMatrix', buffer: { type: 'uniform' } },
      { binding: 2, visibility: RHIShaderStage.VERTEX, name: 'uProjectionMatrix', buffer: { type: 'uniform' } },
      { binding: 3, visibility: RHIShaderStage.VERTEX, name: 'uLightViewMatrix', buffer: { type: 'uniform' } },
      { binding: 4, visibility: RHIShaderStage.VERTEX, name: 'uLightProjectionMatrix', buffer: { type: 'uniform' } },
      { binding: 5, visibility: RHIShaderStage.FRAGMENT, name: 'uLightPosition', buffer: { type: 'uniform' } },
      { binding: 6, visibility: RHIShaderStage.FRAGMENT, name: 'uViewPosition', buffer: { type: 'uniform' } },
      {
        binding: 7,
        visibility: RHIShaderStage.FRAGMENT,
        name: 'uShadowMap',
        texture: { sampleType: 'depth', viewDimension: '2d' },
      },
      { binding: 8, visibility: RHIShaderStage.FRAGMENT, name: 'uShadowMapSampler', sampler: { type: 'comparison' } },
      { binding: 9, visibility: RHIShaderStage.FRAGMENT, name: 'uShadowBias', buffer: { type: 'uniform' } },
      { binding: 10, visibility: RHIShaderStage.FRAGMENT, name: 'uShadowIntensity', buffer: { type: 'uniform' } },
      { binding: 11, visibility: RHIShaderStage.FRAGMENT, name: 'uShadowType', buffer: { type: 'uniform' } },
      { binding: 12, visibility: RHIShaderStage.FRAGMENT, name: 'uPCFRadius', buffer: { type: 'uniform' } },
    ],
    'Shadow BindGroup Layout'
  );

  // 创建渲染管线
  const depthPipelineLayout = device.createPipelineLayout([depthBindGroupLayout], 'Depth Pipeline Layout');
  const shadowPipelineLayout = device.createPipelineLayout([shadowBindGroupLayout], 'Shadow Pipeline Layout');

  const depthRenderPipeline = device.createRenderPipeline({
    vertexShader: depthVertexShader,
    fragmentShader: depthFragmentShader,
    vertexLayout,
    primitiveTopology: RHIPrimitiveTopology.TRIANGLE_LIST,
    layout: depthPipelineLayout,
    depthStencilState: {
      depthWriteEnabled: true,
      depthCompare: RHICompareFunction.LESS,
      format: RHITextureFormat.DEPTH16_UNORM,
    },
    label: 'Depth Render Pipeline',
  });

  const shadowRenderPipeline = device.createRenderPipeline({
    vertexShader: shadowVertexShader,
    fragmentShader: shadowFragmentShader,
    vertexLayout,
    primitiveTopology: RHIPrimitiveTopology.TRIANGLE_LIST,
    layout: shadowPipelineLayout,
    depthStencilState: {
      depthWriteEnabled: true,
      depthCompare: RHICompareFunction.LESS,
      format: RHITextureFormat.DEPTH16_UNORM,
    },
    label: 'Shadow Render Pipeline',
  });

  // 创建绑定组
  const depthBindGroup = device.createBindGroup(
    depthBindGroupLayout,
    [
      { binding: 0, resource: lightViewMatrixBuffer },
      { binding: 1, resource: lightProjectionMatrixBuffer },
      { binding: 2, resource: modelMatrixBuffer },
    ],
    'Depth BindGroup'
  );

  const shadowBindGroup = device.createBindGroup(
    shadowBindGroupLayout,
    [
      { binding: 0, resource: modelMatrixBuffer },
      { binding: 1, resource: viewMatrixBuffer },
      { binding: 2, resource: projectionMatrixBuffer },
      { binding: 3, resource: lightViewMatrixBuffer },
      { binding: 4, resource: lightProjectionMatrixBuffer },
      { binding: 5, resource: lightPositionBuffer },
      { binding: 6, resource: viewPositionBuffer },
      { binding: 7, resource: shadowMap.createView() },
      { binding: 8, resource: shadowMapSampler },
      { binding: 9, resource: shadowBiasBuffer },
      { binding: 10, resource: shadowIntensityBuffer },
      { binding: 11, resource: shadowTypeBuffer },
      { binding: 12, resource: pcfRadiusBuffer },
    ],
    'Shadow BindGroup'
  );

  // 保存资源供渲染使用
  (window as any).shadowResources = {
    // 几何数据
    planeVertexBuffer,
    cubeVertexBuffer,
    planeIndexBuffer,
    cubeIndexBuffer,
    planeIndexCount: planeData.indices.length,
    cubeIndexCount: cubeData.indices.length,

    // 渲染管线
    depthRenderPipeline,
    shadowRenderPipeline,

    // 绑定组
    depthBindGroup,
    shadowBindGroup,

    // 纹理
    shadowMap,
    renderTargetTexture,
    depthTexture,

    // 缓冲区
    lightViewMatrixBuffer,
    lightProjectionMatrixBuffer,
    modelMatrixBuffer,
    viewMatrixBuffer,
    projectionMatrixBuffer,
    lightPositionBuffer,
    viewPositionBuffer,
    shadowBiasBuffer,
    shadowIntensityBuffer,
    shadowTypeBuffer,
    pcfRadiusBuffer,

    // 变换矩阵
    lightViewMatrix: new Matrix4(),
    lightProjectionMatrix: new Matrix4(),
    modelMatrix: new Matrix4(),
    viewMatrix: new Matrix4(),
    projectionMatrix: new Matrix4(),

    // 顶点布局
    vertexLayout,
  };

  startTime = performance.now();
  lastTime = startTime;
  console.info(`${DEMO_NAME} 初始化完成`);
}

/**
 * 渲染循环
 */
function render(): void {
  const resources = (window as any).shadowResources;
  if (!resources) {
    return;
  }

  try {
    const currentTime = performance.now();
    const deltaTime = (currentTime - startTime) / 1000;

    // 更新FPS
    updateFPS(currentTime);

    // 更新光源位置
    updateLightPosition(deltaTime);

    // 更新相机
    const cameraPosition = getCameraPosition();
    resources.viewMatrix.lookAt(cameraPosition, cameraParams.target, new Vector3(0, 1, 0));

    // 更新投影矩阵
    resources.projectionMatrix.perspective((45 * Math.PI) / 180, canvas.width / canvas.height, 0.1, 100.0);

    // 更新光源矩阵
    resources.lightViewMatrix.lookAt(lightPosition, new Vector3(0, 0, 0), new Vector3(0, 1, 0));
    resources.lightProjectionMatrix.perspective((90 * Math.PI) / 180, 1.0, 1.0, 50.0);

    // 更新Uniform缓冲区
    resources.lightViewMatrixBuffer.update(new Float32Array(resources.lightViewMatrix.getElements()));
    resources.lightProjectionMatrixBuffer.update(new Float32Array(resources.lightProjectionMatrix.getElements()));
    resources.viewMatrixBuffer.update(new Float32Array(resources.viewMatrix.getElements()));
    resources.projectionMatrixBuffer.update(new Float32Array(resources.projectionMatrix.getElements()));

    resources.lightPositionBuffer.update(new Float32Array([lightPosition.x, lightPosition.y, lightPosition.z]));
    resources.viewPositionBuffer.update(new Float32Array([cameraPosition.x, cameraPosition.y, cameraPosition.z]));

    resources.shadowBiasBuffer.update(new Float32Array([shadowParams.shadowBias]));
    resources.shadowIntensityBuffer.update(new Float32Array([shadowParams.shadowIntensity]));

    const shadowTypeIndex = shadowParams.shadowType === 'hard' ? 0 : shadowParams.shadowType === 'soft' ? 1 : 2;
    resources.shadowTypeBuffer.update(new Int32Array([shadowTypeIndex]));
    resources.pcfRadiusBuffer.update(new Float32Array([shadowParams.pcfRadius]));

    const commandEncoder = device.createCommandEncoder('Shadow Render');

    // ===== 第一阶段：渲染阴影贴图 =====
    const shadowMapPassDescriptor = {
      depthStencilAttachment: {
        view: resources.shadowMap.createView(),
        depthLoadOp: 'clear' as const,
        depthStoreOp: 'store' as const,
        clearDepth: 1.0,
      },
    };

    const shadowMapPass = commandEncoder.beginRenderPass(shadowMapPassDescriptor);
    shadowMapPass.setPipeline(resources.depthRenderPipeline);
    shadowMapPass.setBindGroup(0, resources.depthBindGroup);

    // 渲染平面
    resources.modelMatrix.identity();
    resources.modelMatrixBuffer.update(new Float32Array(resources.modelMatrix.getElements()));
    shadowMapPass.setVertexBuffer(0, resources.planeVertexBuffer);
    shadowMapPass.setIndexBuffer(resources.planeIndexBuffer, RHIIndexFormat.UINT16);
    shadowMapPass.drawIndexed(resources.planeIndexCount);

    // 渲染立方体
    resources.modelMatrix.identity().translate(new Vector3(0, 1, 0));
    resources.modelMatrixBuffer.update(new Float32Array(resources.modelMatrix.getElements()));
    shadowMapPass.setVertexBuffer(0, resources.cubeVertexBuffer);
    shadowMapPass.setIndexBuffer(resources.cubeIndexBuffer, RHIIndexFormat.UINT16);
    shadowMapPass.drawIndexed(resources.cubeIndexCount);

    shadowMapPass.end();

    // ===== 第二阶段：主渲染通道 =====
    const mainPassDescriptor = {
      colorAttachments: [
        {
          view: resources.renderTargetTexture.createView(),
          loadOp: 'clear' as const,
          storeOp: 'store' as const,
          clearColor: [0.2, 0.3, 0.4, 1.0] as [number, number, number, number],
        },
      ],
      depthStencilAttachment: {
        view: resources.depthTexture.createView(),
        depthLoadOp: 'clear' as const,
        depthStoreOp: 'store' as const,
        clearDepth: 1.0,
      },
    };

    const mainPass = commandEncoder.beginRenderPass(mainPassDescriptor);
    mainPass.setPipeline(resources.shadowRenderPipeline);
    mainPass.setBindGroup(0, resources.shadowBindGroup);

    // 渲染平面
    resources.modelMatrix.identity();
    resources.modelMatrixBuffer.update(new Float32Array(resources.modelMatrix.getElements()));
    mainPass.setVertexBuffer(0, resources.planeVertexBuffer);
    mainPass.setIndexBuffer(resources.planeIndexBuffer, RHIIndexFormat.UINT16);
    mainPass.drawIndexed(resources.planeIndexCount);

    // 渲染立方体
    resources.modelMatrix.identity().translate(new Vector3(0, 1, 0));
    resources.modelMatrixBuffer.update(new Float32Array(resources.modelMatrix.getElements()));
    mainPass.setVertexBuffer(0, resources.cubeVertexBuffer);
    mainPass.setIndexBuffer(resources.cubeIndexBuffer, RHIIndexFormat.UINT16);
    mainPass.drawIndexed(resources.cubeIndexCount);

    mainPass.end();

    // 复制到画布
    commandEncoder.copyTextureToCanvas({
      source: resources.renderTargetTexture.createView(),
      destination: canvas,
    });

    device.submit([commandEncoder.finish()]);

    // 更新阴影贴图预览
    updateShadowMapPreview();

    animationId = requestAnimationFrame(render);
  } catch (error) {
    console.error('渲染错误:', error);
  }
}

/**
 * 更新阴影贴图预览
 */
function updateShadowMapPreview(): void {
  if (!shadowParams.showShadowMap) {
    return;
  }

  const previewDiv = document.getElementById('shadowMapPreview');
  if (previewDiv) {
    previewDiv.style.display = shadowParams.showShadowMap ? 'block' : 'none';
  }

  // TODO: 实现阴影贴图预览渲染
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

      const resources = (window as any).shadowResources;
      if (resources) {
        // 重新创建渲染目标
        resources.renderTargetTexture.destroy();
        resources.depthTexture.destroy();

        resources.renderTargetTexture = device.createTexture({
          width: canvas.width,
          height: canvas.height,
          format: RHITextureFormat.RGBA8_UNORM,
          usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
          dimension: '2d',
          label: 'Render Target Texture',
        });

        resources.depthTexture = device.createTexture({
          width: canvas.width,
          height: canvas.height,
          format: RHITextureFormat.DEPTH16_UNORM,
          usage: RHITextureUsage.RENDER_TARGET,
          dimension: '2d',
          label: 'Depth Texture',
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
    cameraParams.distance = Math.max(5, Math.min(30, cameraParams.distance));
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
      case 'KeyL':
        // 切换光源视角（TODO：实现）
        break;
    }
  });

  console.info('事件处理器设置完成');
}

/**
 * 设置UI控件事件
 */
function setupUIControls(): void {
  // 阴影类型切换
  const shadowTypeSelect = document.getElementById('shadowType') as HTMLSelectElement;
  if (shadowTypeSelect) {
    shadowTypeSelect.addEventListener('change', (event) => {
      shadowParams.shadowType = (event.target as HTMLSelectElement).value as 'hard' | 'soft' | 'pcf';
    });
  }

  // 参数滑块
  const setupSlider = (id: string, param: keyof ShadowParams, displayId: string, converter = (x: number) => x) => {
    const slider = document.getElementById(id) as HTMLInputElement;
    const display = document.getElementById(displayId) as HTMLSpanElement;

    if (slider && display) {
      slider.addEventListener('input', (event) => {
        const value = parseFloat((event.target as HTMLInputElement).value);
        (shadowParams as any)[param] = converter(value);
        display.textContent = value.toFixed(3);
      });
    }
  };

  setupSlider('shadowIntensity', 'shadowIntensity', 'shadowIntensityValue');
  setupSlider('shadowBias', 'shadowBias', 'shadowBiasValue');
  setupSlider('pcfRadius', 'pcfRadius', 'pcfRadiusValue');
  setupSlider('lightDistance', 'lightDistance', 'lightDistanceValue');
  setupSlider('lightHeight', 'lightHeight', 'lightHeightValue');

  // 复选框
  const autoRotateCheckbox = document.getElementById('autoRotate') as HTMLInputElement;
  if (autoRotateCheckbox) {
    autoRotateCheckbox.addEventListener('change', (event) => {
      shadowParams.autoRotate = (event.target as HTMLInputElement).checked;
    });
  }

  const showShadowMapCheckbox = document.getElementById('showShadowMap') as HTMLInputElement;
  if (showShadowMapCheckbox) {
    showShadowMapCheckbox.addEventListener('change', (event) => {
      shadowParams.showShadowMap = (event.target as HTMLInputElement).checked;
      const previewDiv = document.getElementById('shadowMapPreview');
      if (previewDiv) {
        previewDiv.style.display = shadowParams.showShadowMap ? 'block' : 'none';
      }
    });
  }
}

/**
 * 重置参数
 */
function resetParameters(): void {
  shadowParams = {
    shadowType: 'hard',
    shadowIntensity: 0.8,
    shadowBias: 0.005,
    pcfRadius: 2,
    lightDistance: 10,
    lightHeight: 8,
    autoRotate: true,
    showShadowMap: true,
  };

  cameraParams = {
    distance: 15,
    azimuth: 0.3,
    elevation: 0.4,
    target: new Vector3(0, 0, 0),
  };

  lightAngle = 0;

  // 更新UI
  const updateControl = (id: string, value: any) => {
    const element = document.getElementById(id) as HTMLInputElement;
    if (element) {
      if (element.type === 'checkbox') {
        element.checked = value;
      } else {
        element.value = value.toString();
      }
    }
  };

  updateControl('shadowType', shadowParams.shadowType);
  updateControl('shadowIntensity', shadowParams.shadowIntensity);
  updateControl('shadowBias', shadowParams.shadowBias);
  updateControl('pcfRadius', shadowParams.pcfRadius);
  updateControl('lightDistance', shadowParams.lightDistance);
  updateControl('lightHeight', shadowParams.lightHeight);
  updateControl('autoRotate', shadowParams.autoRotate);
  updateControl('showShadowMap', shadowParams.showShadowMap);
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

  const resources = (window as any).shadowResources;
  if (resources) {
    // 清理所有资源
    Object.values(resources).forEach((resource: any) => {
      if (resource && typeof resource.destroy === 'function') {
        resource.destroy();
      }
    });
    (window as any).shadowResources = null;
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
    console.info('- 鼠标拖拽: 旋转场景');
    console.info('- 滚轮: 缩放视角');
    console.info('- L键: 切换光源视角');
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
