/**
 * postprocess.ts
 * 后处理效果Demo
 * 展示各种后处理效果，如泛光、景深、色调映射和抗锯齿技术
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
const DEMO_NAME = '后处理效果Demo';

// 全局变量
let device: WebGLDevice;
let canvas: HTMLCanvasElement;
let animationId: number;
let startTime: number;
let frameCount = 0;
let lastTime = 0;

// 后处理效果类型
type PostProcessEffect = 'none' | 'blur' | 'bloom' | 'dof' | 'tonemap' | 'fxaa';
type BlurType = 'gaussian' | 'box' | 'motion';
type FXAAQuality = 'low' | 'medium' | 'high' | 'ultra';

// 后处理参数
interface PostProcessParams {
  mainEffect: PostProcessEffect;
  effectStrength: number;
  showOriginal: boolean;
  autoRotate: boolean;

  // 模糊效果
  blurStrength: number;
  blurType: BlurType;

  // 光晕效果
  bloomThreshold: number;
  bloomIntensity: number;
  bloomRadius: number;

  // 景深效果
  dofFocus: number;
  dofAperture: number;
  dofFocalLength: number;

  // 色调映射
  exposure: number;
  contrast: number;
  saturation: number;

  // FXAA抗锯齿
  fxaaQuality: FXAAQuality;
  fxaaSubpixel: number;
}

const postParams: PostProcessParams = {
  mainEffect: 'none',
  effectStrength: 1.0,
  showOriginal: false,
  autoRotate: true,

  blurStrength: 2.0,
  blurType: 'gaussian',

  bloomThreshold: 1.0,
  bloomIntensity: 1.0,
  bloomRadius: 1.0,

  dofFocus: 5.0,
  dofAperture: 0.5,
  dofFocalLength: 10.0,

  exposure: 1.0,
  contrast: 1.0,
  saturation: 1.0,

  fxaaQuality: 'medium',
  fxaaSubpixel: 0.5,
};

// 相机控制参数
const cameraParams = {
  distance: 8,
  azimuth: 0,
  elevation: 0.2,
  target: new Vector3(0, 0, 0),
};

// 鼠标交互状态
const mouseState = {
  isDown: false,
  lastX: 0,
  lastY: 0,
};

// 基础场景顶点着色器
const sceneVertexShaderSource = `#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 vWorldPosition;
out vec3 vNormal;
out vec2 vTexCoord;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = normalize(mat3(uModelMatrix) * aNormal);
  vTexCoord = aTexCoord;
  
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

// 基础场景片段着色器
const sceneFragmentShaderSource = `#version 300 es
precision mediump float;

in vec3 vWorldPosition;
in vec3 vNormal;
in vec2 vTexCoord;

uniform vec3 uLightPosition;
uniform vec3 uViewPosition;
uniform vec3 uLightColor;
uniform float uTime;

out vec4 fragColor;

void main() {
  // 程序化纹理
  vec2 uv = vTexCoord;
  vec3 baseColor = vec3(0.8, 0.6, 0.4);
  
  // 添加一些图案
  float pattern = sin(uv.x * 20.0 + uTime) * sin(uv.y * 20.0 + uTime) * 0.1 + 0.9;
  baseColor *= pattern;
  
  // 简单光照
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightPosition - vWorldPosition);
  vec3 viewDir = normalize(uViewPosition - vWorldPosition);
  
  // 环境光
  vec3 ambient = 0.3 * baseColor;
  
  // 漫反射
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor * baseColor;
  
  // 镜面反射
  vec3 reflectDir = reflect(-lightDir, normal);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
  vec3 specular = spec * uLightColor * 0.5;
  
  vec3 result = ambient + diffuse + specular;
  
  // 增加一些亮点用于光晕效果
  if(length(vWorldPosition - vec3(2.0, 2.0, 0.0)) < 0.5) {
    result += vec3(2.0, 1.5, 1.0); // 亮光源
  }
  
  fragColor = vec4(result, 1.0);
}
`;

// 全屏四边形顶点着色器
const fullscreenVertexShaderSource = `#version 300 es
precision highp float;

in vec3 aPosition;
in vec2 aTexCoord;

out vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  gl_Position = vec4(aPosition, 1.0);
}
`;

// 无效果片段着色器
const noEffectFragmentShaderSource = `#version 300 es
precision mediump float;

in vec2 vTexCoord;
uniform sampler2D uInputTexture;

out vec4 fragColor;

void main() {
  fragColor = texture(uInputTexture, vTexCoord);
}
`;

// 高斯模糊片段着色器
const gaussianBlurFragmentShaderSource = `#version 300 es
precision mediump float;

in vec2 vTexCoord;
uniform sampler2D uInputTexture;
uniform vec2 uDirection;
uniform float uBlurStrength;

out vec4 fragColor;

void main() {
  vec2 texelSize = 1.0 / vec2(textureSize(uInputTexture, 0));
  vec4 result = vec4(0.0);
  
  // 5-tap高斯模糊
  float weights[5];
  weights[0] = 0.227027;
  weights[1] = 0.1945946;
  weights[2] = 0.1216216;
  weights[3] = 0.054054;
  weights[4] = 0.016216;
  
  result += texture(uInputTexture, vTexCoord) * weights[0];
  
  for(int i = 1; i < 5; ++i) {
    vec2 offset = uDirection * float(i) * texelSize * uBlurStrength;
    result += texture(uInputTexture, vTexCoord + offset) * weights[i];
    result += texture(uInputTexture, vTexCoord - offset) * weights[i];
  }
  
  fragColor = result;
}
`;

// 光晕阈值提取片段着色器
const bloomThresholdFragmentShaderSource = `#version 300 es
precision mediump float;

in vec2 vTexCoord;
uniform sampler2D uInputTexture;
uniform float uThreshold;

out vec4 fragColor;

void main() {
  vec4 color = texture(uInputTexture, vTexCoord);
  float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
  
  if(brightness > uThreshold) {
    fragColor = color;
  } else {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
}
`;

// 光晕合成片段着色器
const bloomCompositeFragmentShaderSource = `#version 300 es
precision mediump float;

in vec2 vTexCoord;
uniform sampler2D uOriginalTexture;
uniform sampler2D uBloomTexture;
uniform float uBloomIntensity;

out vec4 fragColor;

void main() {
  vec4 original = texture(uOriginalTexture, vTexCoord);
  vec4 bloom = texture(uBloomTexture, vTexCoord);
  
  fragColor = original + bloom * uBloomIntensity;
}
`;

// 色调映射片段着色器
const tonemapFragmentShaderSource = `#version 300 es
precision mediump float;

in vec2 vTexCoord;
uniform sampler2D uInputTexture;
uniform float uExposure;
uniform float uContrast;
uniform float uSaturation;

out vec4 fragColor;

vec3 tonemap(vec3 color) {
  // Reinhard色调映射
  return color / (color + vec3(1.0));
}

vec3 adjustContrast(vec3 color, float contrast) {
  return clamp((color - 0.5) * contrast + 0.5, 0.0, 1.0);
}

vec3 adjustSaturation(vec3 color, float saturation) {
  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  return mix(vec3(luminance), color, saturation);
}

void main() {
  vec4 color = texture(uInputTexture, vTexCoord);
  
  // 曝光调整
  color.rgb *= uExposure;
  
  // 色调映射
  color.rgb = tonemap(color.rgb);
  
  // 对比度调整
  color.rgb = adjustContrast(color.rgb, uContrast);
  
  // 饱和度调整
  color.rgb = adjustSaturation(color.rgb, uSaturation);
  
  // Gamma校正
  color.rgb = pow(color.rgb, vec3(1.0/2.2));
  
  fragColor = color;
}
`;

// FXAA抗锯齿片段着色器
const fxaaFragmentShaderSource = `#version 300 es
precision mediump float;

in vec2 vTexCoord;
uniform sampler2D uInputTexture;
uniform vec2 uTexelSize;
uniform float uSubpixelQuality;

out vec4 fragColor;

float luminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec2 tc = vTexCoord;
  
  // 采样周围像素
  vec3 colorC = texture(uInputTexture, tc).rgb;
  vec3 colorN = texture(uInputTexture, tc + vec2(0.0, -uTexelSize.y)).rgb;
  vec3 colorS = texture(uInputTexture, tc + vec2(0.0, uTexelSize.y)).rgb;
  vec3 colorE = texture(uInputTexture, tc + vec2(uTexelSize.x, 0.0)).rgb;
  vec3 colorW = texture(uInputTexture, tc + vec2(-uTexelSize.x, 0.0)).rgb;
  
  // 计算亮度
  float lumaC = luminance(colorC);
  float lumaN = luminance(colorN);
  float lumaS = luminance(colorS);
  float lumaE = luminance(colorE);
  float lumaW = luminance(colorW);
  
  // 检测边缘
  float lumaMin = min(lumaC, min(min(lumaN, lumaS), min(lumaE, lumaW)));
  float lumaMax = max(lumaC, max(max(lumaN, lumaS), max(lumaE, lumaW)));
  float lumaRange = lumaMax - lumaMin;
  
  // 如果对比度太低，不需要抗锯齿
  if(lumaRange < max(0.0833, lumaMax * 0.125)) {
    fragColor = vec4(colorC, 1.0);
    return;
  }
  
  // 简化的FXAA实现
  vec3 colorNE = texture(uInputTexture, tc + vec2(uTexelSize.x, -uTexelSize.y)).rgb;
  vec3 colorNW = texture(uInputTexture, tc + vec2(-uTexelSize.x, -uTexelSize.y)).rgb;
  vec3 colorSE = texture(uInputTexture, tc + vec2(uTexelSize.x, uTexelSize.y)).rgb;
  vec3 colorSW = texture(uInputTexture, tc + vec2(-uTexelSize.x, uTexelSize.y)).rgb;
  
  vec3 colorAvg = (colorN + colorS + colorE + colorW + colorNE + colorNW + colorSE + colorSW) * 0.125;
  
  fragColor = vec4(mix(colorC, colorAvg, uSubpixelQuality), 1.0);
}
`;

/**
 * 生成立方体几何数据
 */
function generateCube(size: number): { vertices: Float32Array; indices: Uint16Array } {
  const s = size / 2;

  const vertices = new Float32Array([
    // 前面 - 位置(3) + 法线(3) + 纹理坐标(2)
    -s,
    -s,
    s,
    0,
    0,
    1,
    0,
    0,
    s,
    -s,
    s,
    0,
    0,
    1,
    1,
    0,
    s,
    s,
    s,
    0,
    0,
    1,
    1,
    1,
    -s,
    s,
    s,
    0,
    0,
    1,
    0,
    1,

    // 后面
    -s,
    -s,
    -s,
    0,
    0,
    -1,
    1,
    0,
    -s,
    s,
    -s,
    0,
    0,
    -1,
    1,
    1,
    s,
    s,
    -s,
    0,
    0,
    -1,
    0,
    1,
    s,
    -s,
    -s,
    0,
    0,
    -1,
    0,
    0,

    // 左面
    -s,
    -s,
    -s,
    -1,
    0,
    0,
    0,
    0,
    -s,
    -s,
    s,
    -1,
    0,
    0,
    1,
    0,
    -s,
    s,
    s,
    -1,
    0,
    0,
    1,
    1,
    -s,
    s,
    -s,
    -1,
    0,
    0,
    0,
    1,

    // 右面
    s,
    -s,
    -s,
    1,
    0,
    0,
    1,
    0,
    s,
    s,
    -s,
    1,
    0,
    0,
    1,
    1,
    s,
    s,
    s,
    1,
    0,
    0,
    0,
    1,
    s,
    -s,
    s,
    1,
    0,
    0,
    0,
    0,

    // 上面
    -s,
    s,
    -s,
    0,
    1,
    0,
    0,
    1,
    -s,
    s,
    s,
    0,
    1,
    0,
    0,
    0,
    s,
    s,
    s,
    0,
    1,
    0,
    1,
    0,
    s,
    s,
    -s,
    0,
    1,
    0,
    1,
    1,

    // 下面
    -s,
    -s,
    -s,
    0,
    -1,
    0,
    0,
    0,
    s,
    -s,
    -s,
    0,
    -1,
    0,
    1,
    0,
    s,
    -s,
    s,
    0,
    -1,
    0,
    1,
    1,
    -s,
    -s,
    s,
    0,
    -1,
    0,
    0,
    1,
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
 * 生成全屏四边形几何数据
 */
function generateFullscreenQuad(): { vertices: Float32Array; indices: Uint16Array } {
  const vertices = new Float32Array([
    // 位置(3) + 纹理坐标(2)
    -1, -1, 0, 0, 0, 1, -1, 0, 1, 0, 1, 1, 0, 1, 1, -1, 1, 0, 0, 1,
  ]);

  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

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
  const sceneVertexShader = device.createShaderModule({
    code: sceneVertexShaderSource,
    language: 'glsl',
    stage: 'vertex',
    label: 'Scene Vertex Shader',
  });

  const sceneFragmentShader = device.createShaderModule({
    code: sceneFragmentShaderSource,
    language: 'glsl',
    stage: 'fragment',
    label: 'Scene Fragment Shader',
  });

  const fullscreenVertexShader = device.createShaderModule({
    code: fullscreenVertexShaderSource,
    language: 'glsl',
    stage: 'vertex',
    label: 'Fullscreen Vertex Shader',
  });

  // 后处理着色器
  const noEffectFragmentShader = device.createShaderModule({
    code: noEffectFragmentShaderSource,
    language: 'glsl',
    stage: 'fragment',
    label: 'No Effect Fragment Shader',
  });

  const gaussianBlurFragmentShader = device.createShaderModule({
    code: gaussianBlurFragmentShaderSource,
    language: 'glsl',
    stage: 'fragment',
    label: 'Gaussian Blur Fragment Shader',
  });

  const bloomThresholdFragmentShader = device.createShaderModule({
    code: bloomThresholdFragmentShaderSource,
    language: 'glsl',
    stage: 'fragment',
    label: 'Bloom Threshold Fragment Shader',
  });

  const bloomCompositeFragmentShader = device.createShaderModule({
    code: bloomCompositeFragmentShaderSource,
    language: 'glsl',
    stage: 'fragment',
    label: 'Bloom Composite Fragment Shader',
  });

  const tonemapFragmentShader = device.createShaderModule({
    code: tonemapFragmentShaderSource,
    language: 'glsl',
    stage: 'fragment',
    label: 'Tonemap Fragment Shader',
  });

  const fxaaFragmentShader = device.createShaderModule({
    code: fxaaFragmentShaderSource,
    language: 'glsl',
    stage: 'fragment',
    label: 'FXAA Fragment Shader',
  });

  // 生成几何数据
  const cubeData = generateCube(2);
  const quadData = generateFullscreenQuad();

  console.info(`${DEMO_NAME} 基础初始化完成，准备创建资源...`);

  // 保存基础资源
  (window as any).postprocessResources = {
    // 着色器模块
    sceneVertexShader,
    sceneFragmentShader,
    fullscreenVertexShader,
    noEffectFragmentShader,
    gaussianBlurFragmentShader,
    bloomThresholdFragmentShader,
    bloomCompositeFragmentShader,
    tonemapFragmentShader,
    fxaaFragmentShader,

    // 几何数据
    cubeData,
    quadData,
  };

  startTime = performance.now();
  lastTime = startTime;
  console.info(`${DEMO_NAME} 初始化完成`);
}

// 临时渲染函数
function render(): void {
  const currentTime = performance.now();
  updateFPS(currentTime);

  // TODO: 实现完整的渲染逻辑
  console.info('后处理Demo渲染中...');

  animationId = requestAnimationFrame(render);
}

/**
 * 完成初始化后续步骤
 */
async function completeInit(): Promise<void> {
  const resources = (window as any).postprocessResources;
  if (!resources) {
    return;
  }

  // 创建顶点布局
  const sceneVertexLayout: RHIVertexLayout = {
    buffers: [
      {
        index: 0,
        stride: 32, // 8个float：位置(3) + 法线(3) + 纹理坐标(2)
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

  const fullscreenVertexLayout: RHIVertexLayout = {
    buffers: [
      {
        index: 0,
        stride: 20, // 5个float：位置(3) + 纹理坐标(2)
        stepMode: 'vertex',
        attributes: [
          {
            name: 'aPosition',
            format: RHIVertexFormat.FLOAT32X3,
            offset: 0,
            shaderLocation: 0,
          },
          {
            name: 'aTexCoord',
            format: RHIVertexFormat.FLOAT32X2,
            offset: 12,
            shaderLocation: 1,
          },
        ],
      },
    ],
  };

  // 创建顶点缓冲区
  const cubeVertexBuffer = device.createBuffer({
    size: resources.cubeData.vertices.byteLength,
    usage: RHIBufferUsage.VERTEX,
    hint: 'static',
    initialData: resources.cubeData.vertices,
    label: 'Cube Vertex Buffer',
  });

  const cubeIndexBuffer = device.createBuffer({
    size: resources.cubeData.indices.byteLength,
    usage: RHIBufferUsage.INDEX,
    hint: 'static',
    initialData: resources.cubeData.indices,
    label: 'Cube Index Buffer',
  });

  const quadVertexBuffer = device.createBuffer({
    size: resources.quadData.vertices.byteLength,
    usage: RHIBufferUsage.VERTEX,
    hint: 'static',
    initialData: resources.quadData.vertices,
    label: 'Quad Vertex Buffer',
  });

  const quadIndexBuffer = device.createBuffer({
    size: resources.quadData.indices.byteLength,
    usage: RHIBufferUsage.INDEX,
    hint: 'static',
    initialData: resources.quadData.indices,
    label: 'Quad Index Buffer',
  });

  // 创建渲染目标纹理
  const sceneTexture = device.createTexture({
    width: canvas.width,
    height: canvas.height,
    format: RHITextureFormat.RGBA8_UNORM,
    usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
    dimension: '2d',
    label: 'Scene Texture',
  });

  const tempTexture1 = device.createTexture({
    width: canvas.width,
    height: canvas.height,
    format: RHITextureFormat.RGBA8_UNORM,
    usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
    dimension: '2d',
    label: 'Temp Texture 1',
  });

  const tempTexture2 = device.createTexture({
    width: canvas.width,
    height: canvas.height,
    format: RHITextureFormat.RGBA8_UNORM,
    usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
    dimension: '2d',
    label: 'Temp Texture 2',
  });

  const depthTexture = device.createTexture({
    width: canvas.width,
    height: canvas.height,
    format: RHITextureFormat.DEPTH16_UNORM,
    usage: RHITextureUsage.RENDER_TARGET,
    dimension: '2d',
    label: 'Depth Texture',
  });

  // 创建采样器
  const linearSampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
    label: 'Linear Sampler',
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

  // 场景渲染Uniform缓冲区
  const modelMatrixBuffer = createUniformBuffer('uModelMatrix', 64);
  const viewMatrixBuffer = createUniformBuffer('uViewMatrix', 64);
  const projectionMatrixBuffer = createUniformBuffer('uProjectionMatrix', 64);
  const lightPositionBuffer = createUniformBuffer('uLightPosition', 12, 'vec3');
  const viewPositionBuffer = createUniformBuffer('uViewPosition', 12, 'vec3');
  const lightColorBuffer = createUniformBuffer('uLightColor', 12, 'vec3');
  const timeBuffer = createUniformBuffer('uTime', 4, 'float');

  // 后处理Uniform缓冲区
  const blurDirectionBuffer = createUniformBuffer('uDirection', 8, 'vec2');
  const blurStrengthBuffer = createUniformBuffer('uBlurStrength', 4, 'float');
  const bloomThresholdBuffer = createUniformBuffer('uThreshold', 4, 'float');
  const bloomIntensityBuffer = createUniformBuffer('uBloomIntensity', 4, 'float');
  const exposureBuffer = createUniformBuffer('uExposure', 4, 'float');
  const contrastBuffer = createUniformBuffer('uContrast', 4, 'float');
  const saturationBuffer = createUniformBuffer('uSaturation', 4, 'float');
  const texelSizeBuffer = createUniformBuffer('uTexelSize', 8, 'vec2');
  const fxaaSubpixelBuffer = createUniformBuffer('uSubpixelQuality', 4, 'float');

  // 更新资源
  Object.assign(resources, {
    sceneVertexLayout,
    fullscreenVertexLayout,
    cubeVertexBuffer,
    cubeIndexBuffer,
    quadVertexBuffer,
    quadIndexBuffer,
    sceneTexture,
    tempTexture1,
    tempTexture2,
    depthTexture,
    linearSampler,

    // Uniform缓冲区
    modelMatrixBuffer,
    viewMatrixBuffer,
    projectionMatrixBuffer,
    lightPositionBuffer,
    viewPositionBuffer,
    lightColorBuffer,
    timeBuffer,
    blurDirectionBuffer,
    blurStrengthBuffer,
    bloomThresholdBuffer,
    bloomIntensityBuffer,
    exposureBuffer,
    contrastBuffer,
    saturationBuffer,
    texelSizeBuffer,
    fxaaSubpixelBuffer,

    // 变换矩阵
    modelMatrix: new Matrix4(),
    viewMatrix: new Matrix4(),
    projectionMatrix: new Matrix4(),

    // 几何索引计数
    cubeIndexCount: resources.cubeData.indices.length,
    quadIndexCount: resources.quadData.indices.length,
  });

  console.info('后处理Demo完整初始化完成');
}

/**
 * 完整渲染循环
 */
function fullRender(): void {
  const resources = (window as any).postprocessResources;
  if (!resources || !resources.modelMatrix) {
    return;
  }

  try {
    const currentTime = performance.now();
    const deltaTime = (currentTime - startTime) / 1000;

    // 更新FPS
    updateFPS(currentTime);

    // 更新相机
    if (postParams.autoRotate) {
      cameraParams.azimuth += deltaTime * 0.3;
    }
    const cameraPosition = getCameraPosition();
    resources.viewMatrix.lookAt(cameraPosition, cameraParams.target, new Vector3(0, 1, 0));

    // 更新投影矩阵
    resources.projectionMatrix.perspective((45 * Math.PI) / 180, canvas.width / canvas.height, 0.1, 100.0);

    // 更新模型矩阵
    resources.modelMatrix
      .identity()
      .rotateY(deltaTime * 0.2)
      .rotateX(deltaTime * 0.1);

    // 更新光源位置
    const lightPosition = new Vector3(Math.cos(deltaTime) * 5, 3, Math.sin(deltaTime) * 5);

    // 更新Uniform缓冲区
    resources.modelMatrixBuffer.update(new Float32Array(resources.modelMatrix.getElements()));
    resources.viewMatrixBuffer.update(new Float32Array(resources.viewMatrix.getElements()));
    resources.projectionMatrixBuffer.update(new Float32Array(resources.projectionMatrix.getElements()));
    resources.lightPositionBuffer.update(new Float32Array([lightPosition.x, lightPosition.y, lightPosition.z]));
    resources.viewPositionBuffer.update(new Float32Array([cameraPosition.x, cameraPosition.y, cameraPosition.z]));
    resources.lightColorBuffer.update(new Float32Array([1.0, 1.0, 1.0]));
    resources.timeBuffer.update(new Float32Array([deltaTime]));

    const commandEncoder = device.createCommandEncoder('Postprocess Render');

    // ===== 第一阶段：渲染场景到纹理 =====
    const scenePassDescriptor = {
      colorAttachments: [
        {
          view: resources.sceneTexture.createView(),
          loadOp: 'clear' as const,
          storeOp: 'store' as const,
          clearColor: [0.1, 0.1, 0.2, 1.0] as [number, number, number, number],
        },
      ],
      depthStencilAttachment: {
        view: resources.depthTexture.createView(),
        depthLoadOp: 'clear' as const,
        depthStoreOp: 'store' as const,
        clearDepth: 1.0,
      },
    };

    // TODO: 创建场景渲染管线和绑定组

    // ===== 第二阶段：应用后处理效果 =====
    const currentTexture = resources.sceneTexture;

    if (postParams.mainEffect !== 'none') {
      // TODO: 实现各种后处理效果
      // 根据mainEffect选择对应的处理
    }

    // ===== 第三阶段：渲染到画布 =====
    const finalTexture = postParams.showOriginal ? resources.sceneTexture : currentTexture;

    commandEncoder.copyTextureToCanvas({
      source: finalTexture.createView(),
      destination: canvas,
    });

    device.submit([commandEncoder.finish()]);

    animationId = requestAnimationFrame(fullRender);
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

      const resources = (window as any).postprocessResources;
      if (resources && resources.projectionMatrix) {
        // 重新创建渲染目标
        resources.sceneTexture?.destroy();
        resources.tempTexture1?.destroy();
        resources.tempTexture2?.destroy();
        resources.depthTexture?.destroy();

        resources.sceneTexture = device.createTexture({
          width: canvas.width,
          height: canvas.height,
          format: RHITextureFormat.RGBA8_UNORM,
          usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
          dimension: '2d',
          label: 'Scene Texture',
        });

        resources.tempTexture1 = device.createTexture({
          width: canvas.width,
          height: canvas.height,
          format: RHITextureFormat.RGBA8_UNORM,
          usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
          dimension: '2d',
          label: 'Temp Texture 1',
        });

        resources.tempTexture2 = device.createTexture({
          width: canvas.width,
          height: canvas.height,
          format: RHITextureFormat.RGBA8_UNORM,
          usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
          dimension: '2d',
          label: 'Temp Texture 2',
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
  const mouseState = { isDown: false, lastX: 0, lastY: 0 };

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
    cameraParams.distance = Math.max(2, Math.min(20, cameraParams.distance));
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
      case 'Tab':
        event.preventDefault();
        toggleEffectPreview();
        break;
    }
  });

  console.info('事件处理器设置完成');
}

/**
 * 设置UI控件事件
 */
function setupUIControls(): void {
  // 主效果选择
  const mainEffectSelect = document.getElementById('mainEffect') as HTMLSelectElement;
  if (mainEffectSelect) {
    mainEffectSelect.addEventListener('change', (event) => {
      const newEffect = (event.target as HTMLSelectElement).value as PostProcessEffect;
      postParams.mainEffect = newEffect;
      updateEffectControls(newEffect);
    });
  }

  // 参数滑块设置
  const setupSlider = (id: string, param: keyof PostProcessParams, displayId: string) => {
    const slider = document.getElementById(id) as HTMLInputElement;
    const display = document.getElementById(displayId) as HTMLSpanElement;

    if (slider && display) {
      slider.addEventListener('input', (event) => {
        const value = parseFloat((event.target as HTMLInputElement).value);
        (postParams as any)[param] = value;
        display.textContent = value.toFixed(2);
      });
    }
  };

  // 通用参数
  setupSlider('effectStrength', 'effectStrength', 'effectStrengthValue');

  // 模糊效果参数
  setupSlider('blurStrength', 'blurStrength', 'blurStrengthValue');

  // 光晕效果参数
  setupSlider('bloomThreshold', 'bloomThreshold', 'bloomThresholdValue');
  setupSlider('bloomIntensity', 'bloomIntensity', 'bloomIntensityValue');
  setupSlider('bloomRadius', 'bloomRadius', 'bloomRadiusValue');

  // 景深效果参数
  setupSlider('dofFocus', 'dofFocus', 'dofFocusValue');
  setupSlider('dofAperture', 'dofAperture', 'dofApertureValue');
  setupSlider('dofFocalLength', 'dofFocalLength', 'dofFocalLengthValue');

  // 色调映射参数
  setupSlider('exposure', 'exposure', 'exposureValue');
  setupSlider('contrast', 'contrast', 'contrastValue');
  setupSlider('saturation', 'saturation', 'saturationValue');

  // FXAA参数
  setupSlider('fxaaSubpixel', 'fxaaSubpixel', 'fxaaSubpixelValue');

  // 复选框
  const showOriginalCheckbox = document.getElementById('showOriginal') as HTMLInputElement;
  if (showOriginalCheckbox) {
    showOriginalCheckbox.addEventListener('change', (event) => {
      postParams.showOriginal = (event.target as HTMLInputElement).checked;
    });
  }

  const autoRotateCheckbox = document.getElementById('autoRotate') as HTMLInputElement;
  if (autoRotateCheckbox) {
    autoRotateCheckbox.addEventListener('change', (event) => {
      postParams.autoRotate = (event.target as HTMLInputElement).checked;
    });
  }

  // 初始化控件显示
  updateEffectControls(postParams.mainEffect);
}

/**
 * 更新效果控制面板显示
 */
function updateEffectControls(effect: PostProcessEffect): void {
  const controlGroups = ['blurControls', 'bloomControls', 'dofControls', 'tonemapControls', 'fxaaControls'];

  controlGroups.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = 'none';
    }
  });

  const activeGroup = {
    blur: 'blurControls',
    bloom: 'bloomControls',
    dof: 'dofControls',
    tonemap: 'tonemapControls',
    fxaa: 'fxaaControls',
  }[effect];

  if (activeGroup) {
    const element = document.getElementById(activeGroup);
    if (element) {
      element.style.display = 'block';
    }
  }
}

/**
 * 切换效果预览
 */
function toggleEffectPreview(): void {
  const previewDiv = document.getElementById('effectPreview');
  if (previewDiv) {
    const isVisible = previewDiv.style.display !== 'none';
    previewDiv.style.display = isVisible ? 'none' : 'block';
  }
}

/**
 * 重置参数
 */
function resetParameters(): void {
  postParams = {
    mainEffect: 'none',
    effectStrength: 1.0,
    showOriginal: false,
    autoRotate: true,

    blurStrength: 2.0,
    blurType: 'gaussian',

    bloomThreshold: 1.0,
    bloomIntensity: 1.0,
    bloomRadius: 1.0,

    dofFocus: 5.0,
    dofAperture: 0.5,
    dofFocalLength: 10.0,

    exposure: 1.0,
    contrast: 1.0,
    saturation: 1.0,

    fxaaQuality: 'medium',
    fxaaSubpixel: 0.5,
  };

  cameraParams = {
    distance: 8,
    azimuth: 0,
    elevation: 0.2,
    target: new Vector3(0, 0, 0),
  };

  // 更新UI控件
  // TODO: 实现UI更新逻辑
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

  const resources = (window as any).postprocessResources;
  if (resources) {
    Object.values(resources).forEach((resource: any) => {
      if (resource && typeof resource.destroy === 'function') {
        resource.destroy();
      }
    });
    (window as any).postprocessResources = null;
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
    await completeInit();
    setupEventHandlers();

    // 切换到完整渲染函数
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    fullRender();

    console.info(`${DEMO_NAME} 启动成功！`);
    console.info('控制说明:');
    console.info('- 鼠标拖拽: 旋转场景');
    console.info('- 滚轮: 缩放视角');
    console.info('- Tab: 切换效果预览');
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

console.info('后处理Demo完整框架已创建');
