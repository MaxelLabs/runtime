import type { RHIVertexLayout } from '@maxellabs/core';
import {
  RHIBufferUsage,
  RHICompareFunction,
  RHIPrimitiveTopology,
  RHIShaderStage,
  RHITextureFormat,
  RHITextureUsage,
  RHIVertexFormat,
  RHIBlendFactor,
  RHIBlendOperation,
  RHIIndexFormat,
} from '@maxellabs/core';
import { WebGLDevice } from '../../src/webgl/GLDevice';
import { Matrix4, Vector3 } from '@maxellabs/math';

// 获取画布并调整大小
const canvas = document.getElementById('J-canvas') as HTMLCanvasElement;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 创建设备
const device = new WebGLDevice(canvas);

// ==================== G-Buffer Pass 着色器 ====================
// G-Buffer 顶点着色器
const gbufferVertexShaderSource = `#version 300 es
in vec3 aPosition;
in vec2 aTexCoord;
in vec3 aNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec2 vTexCoord;
out vec3 vNormal;
out vec3 vWorldPos;

void main() {
  vTexCoord = aTexCoord;
  
  // 将法线从模型空间转换到世界空间
  vNormal = mat3(uModelMatrix) * aNormal;
  
  // 计算世界空间位置
  vec4 worldPos = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPos = worldPos.xyz;
  
  gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}
`;

// G-Buffer 片段着色器
const gbufferFragmentShaderSource = `#version 300 es
precision highp float;

in vec2 vTexCoord;
in vec3 vNormal;
in vec3 vWorldPos;

uniform sampler2D uAlbedoTexture;

// 多渲染目标输出
layout(location = 0) out vec4 outPosition;  // RGB = worldPos, A = 未使用
layout(location = 1) out vec4 outNormal;    // RGB = 法线, A = 未使用
layout(location = 2) out vec4 outAlbedo;    // RGB = 反照率, A = 高光强度

void main() {
  // 位置 G-Buffer (xyz = 世界位置)
  outPosition = vec4(vWorldPos, 1.0);
  
  // 法线 G-Buffer (xyz = 法线)
  outNormal = vec4(normalize(vNormal), 1.0);
  
  // 反照率 G-Buffer (rgb = 漫反射颜色, a = 高光强度)
  vec4 albedo = texture(uAlbedoTexture, vTexCoord);
  outAlbedo = vec4(albedo.rgb, 0.7); // 固定高光强度为0.7
}
`;

// ==================== 光照处理阶段着色器 ====================
// 光照处理顶点着色器(全屏四边形)
const lightingVertexShaderSource = `#version 300 es
in vec3 aPosition;
in vec2 aTexCoord;

out vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  gl_Position = vec4(aPosition, 1.0);
}
`;

// 光照处理片段着色器
const lightingFragmentShaderSource = `#version 300 es
precision highp float;

in vec2 vTexCoord;

uniform sampler2D uPositionBuffer;
uniform sampler2D uNormalBuffer;
uniform sampler2D uAlbedoBuffer;

// 光照参数
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uCameraPosition;

out vec4 fragColor;

void main() {
  // 从G-Buffer读取数据
  vec3 worldPos = texture(uPositionBuffer, vTexCoord).rgb;
  vec3 normal = normalize(texture(uNormalBuffer, vTexCoord).rgb);
  vec4 albedoSpec = texture(uAlbedoBuffer, vTexCoord);
  vec3 albedo = albedoSpec.rgb;
  float specularStrength = albedoSpec.a;
  
  // 环境光
  float ambientStrength = 0.1;
  vec3 ambient = ambientStrength * albedo;
  
  // 漫反射
  vec3 lightDir = normalize(uLightPosition - worldPos);
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor * albedo;
  
  // 高光 (Blinn-Phong)
  vec3 viewDir = normalize(uCameraPosition - worldPos);
  vec3 halfwayDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0);
  vec3 specular = specularStrength * spec * uLightColor;
  
  // 衰减
  float distance = length(uLightPosition - worldPos);
  float attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);
  
  // 组合所有光照
  vec3 result = ambient + (diffuse + specular) * attenuation;
  
  fragColor = vec4(result, 1.0);
}
`;

// ==================== 创建着色器模块 ====================
const gbufferVertexShader = device.createShaderModule({
  code: gbufferVertexShaderSource,
  language: 'glsl',
  stage: 'vertex',
  label: 'GBuffer Vertex Shader',
});

const gbufferFragmentShader = device.createShaderModule({
  code: gbufferFragmentShaderSource,
  language: 'glsl',
  stage: 'fragment',
  label: 'GBuffer Fragment Shader',
});

const lightingVertexShader = device.createShaderModule({
  code: lightingVertexShaderSource,
  language: 'glsl',
  stage: 'vertex',
  label: 'Lighting Vertex Shader',
});

const lightingFragmentShader = device.createShaderModule({
  code: lightingFragmentShaderSource,
  language: 'glsl',
  stage: 'fragment',
  label: 'Lighting Fragment Shader',
});

// ==================== 创建几何体数据 ====================
// 创建正方体顶点数据
const cubeVertices = new Float32Array([
  // 位置(x, y, z), 纹理坐标(u, v), 法线(nx, ny, nz)
  // 前面
  -0.5, -0.5, 0.5, 0.0, 0.0, 0.0, 0.0, 1.0,
  0.5, -0.5, 0.5, 1.0, 0.0, 0.0, 0.0, 1.0,
  0.5, 0.5, 0.5, 1.0, 1.0, 0.0, 0.0, 1.0,
  -0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 0.0, 1.0,

  // 后面
  -0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 0.0, -1.0,
  -0.5, 0.5, -0.5, 1.0, 1.0, 0.0, 0.0, -1.0,
  0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 0.0, -1.0,
  0.5, -0.5, -0.5, 0.0, 0.0, 0.0, 0.0, -1.0,

  // 上面
  -0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 1.0, 0.0,
  -0.5, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0, 0.0,
  0.5, 0.5, 0.5, 1.0, 0.0, 0.0, 1.0, 0.0,
  0.5, 0.5, -0.5, 1.0, 1.0, 0.0, 1.0, 0.0,

  // 下面
  -0.5, -0.5, -0.5, 1.0, 1.0, 0.0, -1.0, 0.0,
  0.5, -0.5, -0.5, 0.0, 1.0, 0.0, -1.0, 0.0,
  0.5, -0.5, 0.5, 0.0, 0.0, 0.0, -1.0, 0.0,
  -0.5, -0.5, 0.5, 1.0, 0.0, 0.0, -1.0, 0.0,

  // 右面
  0.5, -0.5, -0.5, 1.0, 0.0, 1.0, 0.0, 0.0,
  0.5, 0.5, -0.5, 1.0, 1.0, 1.0, 0.0, 0.0,
  0.5, 0.5, 0.5, 0.0, 1.0, 1.0, 0.0, 0.0,
  0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0,

  // 左面
  -0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 0.0,
  -0.5, -0.5, 0.5, 1.0, 0.0, -1.0, 0.0, 0.0,
  -0.5, 0.5, 0.5, 1.0, 1.0, -1.0, 0.0, 0.0,
  -0.5, 0.5, -0.5, 0.0, 1.0, -1.0, 0.0, 0.0,
]);

// 立方体索引数据
const cubeIndices = new Uint16Array([
  0, 1, 2, 2, 3, 0,  // 前面
  4, 5, 6, 6, 7, 4,  // 后面
  8, 9, 10, 10, 11, 8,  // 上面
  12, 13, 14, 14, 15, 12, // 下面
  16, 17, 18, 18, 19, 16, // 右面
  20, 21, 22, 22, 23, 20,  // 左面
]);

// 创建顶点和索引缓冲区
const cubeVertexBuffer = device.createBuffer({
  size: cubeVertices.byteLength,
  usage: RHIBufferUsage.VERTEX,
  hint: 'static',
  initialData: cubeVertices,
  label: 'Cube Vertex Buffer',
});

const cubeIndexBuffer = device.createBuffer({
  size: cubeIndices.byteLength,
  usage: RHIBufferUsage.INDEX,
  hint: 'static',
  initialData: cubeIndices,
  label: 'Cube Index Buffer',
});

// 创建全屏四边形顶点数据
const quadVertices = new Float32Array([
  // 位置(x, y, z), 纹理坐标(u, v)
  -1.0, -1.0, 0.0, 0.0, 0.0,
  1.0, -1.0, 0.0, 1.0, 0.0,
  1.0, 1.0, 0.0, 1.0, 1.0,
  -1.0, 1.0, 0.0, 0.0, 1.0,
]);

const quadIndices = new Uint16Array([
  0, 1, 2, 2, 3, 0,
]);

// 创建四边形顶点和索引缓冲区
const quadVertexBuffer = device.createBuffer({
  size: quadVertices.byteLength,
  usage: RHIBufferUsage.VERTEX,
  hint: 'static',
  initialData: quadVertices,
  label: 'Quad Vertex Buffer',
});

const quadIndexBuffer = device.createBuffer({
  size: quadIndices.byteLength,
  usage: RHIBufferUsage.INDEX,
  hint: 'static',
  initialData: quadIndices,
  label: 'Quad Index Buffer',
});

// ==================== 创建纹理 ====================
// 创建棋盘格纹理数据
const textureSize = 256;
const textureData = new Uint8Array(textureSize * textureSize * 4);

for (let y = 0; y < textureSize; y++) {
  for (let x = 0; x < textureSize; x++) {
    const index = (y * textureSize + x) * 4;
    const isCheckerboard = (Math.floor(x / 32) % 2 === 0) !== (Math.floor(y / 32) % 2 === 0);

    // 两种不同的颜色
    if (isCheckerboard) {
      textureData[index] = 200;     // R
      textureData[index + 1] = 100; // G
      textureData[index + 2] = 100; // B
    } else {
      textureData[index] = 100;     // R
      textureData[index + 1] = 100; // G
      textureData[index + 2] = 200; // B
    }
    textureData[index + 3] = 255;   // A
  }
}

// 创建反照率纹理
const albedoTexture = device.createTexture({
  width: textureSize,
  height: textureSize,
  format: RHITextureFormat.RGBA8_UNORM,
  usage: RHITextureUsage.SAMPLED | RHITextureUsage.COPY_DST,
  dimension: '2d',
  label: 'Albedo Texture',
});

// 更新纹理数据
albedoTexture.update(textureData);
const albedoTextureView = albedoTexture.createView();

// ==================== 创建G-Buffer纹理 ====================
// 创建G-Buffer纹理
// 1. 位置缓冲区
let positionBuffer = device.createTexture({
  width: canvas.width,
  height: canvas.height,
  format: RHITextureFormat.RGBA16_FLOAT, // 使用高精度格式
  usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
  dimension: '2d',
  label: 'Position G-Buffer',
});

// 2. 法线缓冲区
let normalBuffer = device.createTexture({
  width: canvas.width,
  height: canvas.height,
  format: RHITextureFormat.RGBA16_FLOAT,
  usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
  dimension: '2d',
  label: 'Normal G-Buffer',
});

// 3. 反照率/高光缓冲区
let albedoBuffer = device.createTexture({
  width: canvas.width,
  height: canvas.height,
  format: RHITextureFormat.RGBA8_UNORM,
  usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
  dimension: '2d',
  label: 'Albedo G-Buffer',
});

// 4. 深度缓冲区
let depthBuffer = device.createTexture({
  width: canvas.width,
  height: canvas.height,
  format: RHITextureFormat.DEPTH16_UNORM,
  usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
  dimension: '2d',
  label: 'Depth Buffer',
});

// 创建采样器
const sampler = device.createSampler({
  magFilter: 'linear',
  minFilter: 'linear',
  mipmapFilter: 'linear',
  addressModeU: 'clamp-to-edge',
  addressModeV: 'clamp-to-edge',
  label: 'G-Buffer Sampler',
});

// 最终结果输出的渲染目标
let finalRenderTarget = device.createTexture({
  width: canvas.width,
  height: canvas.height,
  format: RHITextureFormat.RGBA8_UNORM,
  usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
  dimension: '2d',
  label: 'Final Render Target',
});

// ==================== 创建Uniform缓冲区 ====================
// 变换矩阵
const modelMatrix = new Matrix4();
const viewMatrix = new Matrix4();
const projectionMatrix = new Matrix4();

viewMatrix.setLookRotation(
  new Vector3(0, 0, 3),   // 相机位置
  new Vector3(0, 1, 0),   // 目标点
);

projectionMatrix.perspective(45, canvas.width / canvas.height, 0.1, 100.0);

// 创建uniform缓冲区
const modelMatrixBuffer = device.createBuffer({
  size: 64, // 4x4矩阵，每个元素4字节
  usage: RHIBufferUsage.UNIFORM,
  hint: 'dynamic',
  label: 'Model Matrix Buffer',
});

const viewMatrixBuffer = device.createBuffer({
  size: 64,
  usage: RHIBufferUsage.UNIFORM,
  hint: 'dynamic',
  label: 'View Matrix Buffer',
});

const projectionMatrixBuffer = device.createBuffer({
  size: 64,
  usage: RHIBufferUsage.UNIFORM,
  hint: 'static',
  label: 'Projection Matrix Buffer',
});

// 光照参数缓冲区
const lightPositionBuffer = device.createBuffer({
  size: 16, // 3个浮点数 + 对齐
  usage: RHIBufferUsage.UNIFORM,
  hint: 'dynamic',
  label: 'Light Position Buffer',
});

const lightColorBuffer = device.createBuffer({
  size: 16, // 3个浮点数 + 对齐
  usage: RHIBufferUsage.UNIFORM,
  hint: 'static',
  label: 'Light Color Buffer',
});

const cameraPositionBuffer = device.createBuffer({
  size: 16, // 3个浮点数 + 对齐
  usage: RHIBufferUsage.UNIFORM,
  hint: 'dynamic',
  label: 'Camera Position Buffer',
});

// 初始化Uniforms
modelMatrix.identity();
modelMatrixBuffer.update(new Float32Array(modelMatrix.getElements()));
viewMatrixBuffer.update(new Float32Array(viewMatrix.getElements()));
projectionMatrixBuffer.update(new Float32Array(projectionMatrix.getElements()));

// 光照参数
const lightPosition = new Float32Array([1.0, 1.0, 1.0, 0.0]);
const lightColor = new Float32Array([1.0, 1.0, 1.0, 0.0]);
const cameraPosition = new Float32Array([0.0, 0.0, 3.0, 0.0]);

lightPositionBuffer.update(lightPosition);
lightColorBuffer.update(lightColor);
cameraPositionBuffer.update(cameraPosition);

// ==================== 创建绑定组布局和管线布局 ====================
// G-Buffer 阶段绑定组布局
const gbufferBindGroupLayout = device.createBindGroupLayout([
  {
    binding: 0,
    visibility: RHIShaderStage.VERTEX,
    buffer: { type: 'uniform' },
    name: 'uModelMatrix',
  },
  {
    binding: 1,
    visibility: RHIShaderStage.VERTEX,
    buffer: { type: 'uniform' },
    name: 'uViewMatrix',
  },
  {
    binding: 2,
    visibility: RHIShaderStage.VERTEX,
    buffer: { type: 'uniform' },
    name: 'uProjectionMatrix',
  },
  {
    binding: 3,
    visibility: RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uAlbedoTexture',
  },
  {
    binding: 4,
    visibility: RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uTextureSampler',
  },
], 'GBuffer Bind Group Layout');

// 光照处理阶段绑定组布局
const lightingBindGroupLayout = device.createBindGroupLayout([
  {
    binding: 0,
    visibility: RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uPositionBuffer',
  },
  {
    binding: 1,
    visibility: RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uNormalBuffer',
  },
  {
    binding: 2,
    visibility: RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uAlbedoBuffer',
  },
  {
    binding: 3,
    visibility: RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uGBufferSampler',
  },
  {
    binding: 4,
    visibility: RHIShaderStage.FRAGMENT,
    buffer: { type: 'uniform' },
    name: 'uLightPosition',
  },
  {
    binding: 5,
    visibility: RHIShaderStage.FRAGMENT,
    buffer: { type: 'uniform' },
    name: 'uLightColor',
  },
  {
    binding: 6,
    visibility: RHIShaderStage.FRAGMENT,
    buffer: { type: 'uniform' },
    name: 'uCameraPosition',
  },
], 'Lighting Bind Group Layout');

// 创建管线布局
const gbufferPipelineLayout = device.createPipelineLayout([gbufferBindGroupLayout], 'GBuffer Pipeline Layout');
const lightingPipelineLayout = device.createPipelineLayout([lightingBindGroupLayout], 'Lighting Pipeline Layout');

// ==================== 定义顶点布局 ====================
// 立方体顶点布局
const cubeVertexLayout = {
  buffers: [
    {
      stride: 32, // (3 + 2 + 3) * 4 = 32 bytes per vertex
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
        {
          name: 'aNormal',
          format: RHIVertexFormat.FLOAT32X3,
          offset: 20,
          shaderLocation: 2,
        },
      ],
      index: 0,
    },
  ],
};

// 四边形顶点布局(用于全屏渲染)
const quadVertexLayout = {
  buffers: [
    {
      stride: 20, // (3 + 2) * 4 = 20 bytes per vertex
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
      index: 0,
    },
  ],
};

// ==================== 创建渲染管线 ====================
// G-Buffer 渲染管线
const gbufferPipeline = device.createRenderPipeline({
  vertexShader: gbufferVertexShader,
  fragmentShader: gbufferFragmentShader,
  vertexLayout: cubeVertexLayout as RHIVertexLayout,
  primitiveTopology: RHIPrimitiveTopology.TRIANGLE_LIST,
  layout: gbufferPipelineLayout,
  depthStencilState: {
    depthWriteEnabled: true,
    depthCompare: RHICompareFunction.LESS,
    format: RHITextureFormat.DEPTH16_UNORM,
  },
  // 多个颜色附件对应G-Buffer中的各个缓冲区
  colorBlendState: {
    attachments: [
      // Position buffer blend state
      {
        color: {
          enable: false,
        },
        alpha: {
          enable: false,
        },
      },
      // Normal buffer blend state
      {
        color: {
          enable: false,
        },
        alpha: {
          enable: false,
        },
      },
      // Albedo buffer blend state
      {
        color: {
          enable: false,
        },
        alpha: {
          enable: false,
        },
      },
    ],
  },
  label: 'GBuffer Render Pipeline',
});

// 光照处理渲染管线
const lightingPipeline = device.createRenderPipeline({
  vertexShader: lightingVertexShader,
  fragmentShader: lightingFragmentShader,
  vertexLayout: quadVertexLayout as RHIVertexLayout,
  primitiveTopology: RHIPrimitiveTopology.TRIANGLE_LIST,
  layout: lightingPipelineLayout,
  depthStencilState: {
    depthWriteEnabled: false, // 不写入深度
    depthCompare: RHICompareFunction.ALWAYS,
    format: RHITextureFormat.DEPTH16_UNORM,
  },
  colorBlendState: {
    attachments: [{
      color: {
        enable: false,
      },
      alpha: {
        enable: false,
      },
    }],
  },
  label: 'Lighting Render Pipeline',
});

// ==================== 创建绑定组 ====================
// G-Buffer 绑定组
const gbufferBindGroup = device.createBindGroup(gbufferBindGroupLayout, [
  {
    binding: 0,
    resource: modelMatrixBuffer,
  },
  {
    binding: 1,
    resource: viewMatrixBuffer,
  },
  {
    binding: 2,
    resource: projectionMatrixBuffer,
  },
  {
    binding: 3,
    resource: albedoTextureView,
  },
  {
    binding: 4,
    resource: sampler,
  },
], 'GBuffer Bind Group');

// 光照处理绑定组
let lightingBindGroup = device.createBindGroup(lightingBindGroupLayout, [
  {
    binding: 0,
    resource: positionBuffer.createView(),
  },
  {
    binding: 1,
    resource: normalBuffer.createView(),
  },
  {
    binding: 2,
    resource: albedoBuffer.createView(),
  },
  {
    binding: 3,
    resource: sampler,
  },
  {
    binding: 4,
    resource: lightPositionBuffer,
  },
  {
    binding: 5,
    resource: lightColorBuffer,
  },
  {
    binding: 6,
    resource: cameraPositionBuffer,
  },
], 'Lighting Bind Group');

// ==================== 渲染循环 ====================
let rotation = 0;

function render () {
  // 更新旋转
  rotation += 0.01;

  // 更新模型矩阵
  modelMatrix.identity();
  //   modelMatrix.rotateY(rotation);
  //   modelMatrix.rotateX(rotation * 0.5);
  modelMatrixBuffer.update(new Float32Array(modelMatrix.getElements()));

  // 更新光源位置 - 让光源围绕场景移动
  lightPosition[0] = Math.sin(rotation) * 2.0;
  lightPosition[1] = 1.0;
  lightPosition[2] = Math.cos(rotation) * 2.0;
  lightPositionBuffer.update(lightPosition);

  const commandEncoder = device.createCommandEncoder();

  // ======== 第一阶段: G-Buffer 绘制 ========
  const gbufferPassDescriptor = {
    colorAttachments: [
      {
        view: positionBuffer.createView(),
        loadOp: 'clear' as const,
        storeOp: 'store' as const,
        clearColor: [0.0, 0.0, 0.0, 1.0] as [number, number, number, number],
      },
      {
        view: normalBuffer.createView(),
        loadOp: 'clear' as const,
        storeOp: 'store' as const,
        clearColor: [0.0, 0.0, 0.0, 1.0] as [number, number, number, number],
      },
      {
        view: albedoBuffer.createView(),
        loadOp: 'clear' as const,
        storeOp: 'store' as const,
        clearColor: [0.0, 0.0, 0.0, 1.0] as [number, number, number, number],
      },
    ],
    depthStencilAttachment: {
      view: depthBuffer.createView(),
      depthLoadOp: 'clear' as const,
      depthStoreOp: 'store' as const,
      clearDepth: 1.0,
      depthWriteEnabled: true,
    },
    label: 'GBuffer Render Pass',
  };

  const gbufferPass = commandEncoder.beginRenderPass(gbufferPassDescriptor);

  gbufferPass.setPipeline(gbufferPipeline);
  gbufferPass.setBindGroup(0, gbufferBindGroup);
  gbufferPass.setVertexBuffer(0, cubeVertexBuffer);
  gbufferPass.setIndexBuffer(cubeIndexBuffer, RHIIndexFormat.UINT16);
  gbufferPass.drawIndexed(36);
  gbufferPass.end();

  // ======== 第二阶段: 光照处理 ========
  const lightingPassDescriptor = {
    colorAttachments: [
      {
        view: finalRenderTarget.createView(),
        loadOp: 'clear' as const,
        storeOp: 'store' as const,
        clearColor: [0.05, 0.05, 0.05, 1.0] as [number, number, number, number],
      },
    ],
    depthStencilAttachment: null, // 光照处理通道不需要深度缓冲区
    label: 'Lighting Render Pass',
  };

  const lightingPass = commandEncoder.beginRenderPass(lightingPassDescriptor);

  lightingPass.setPipeline(lightingPipeline);
  lightingPass.setBindGroup(0, lightingBindGroup);
  lightingPass.setVertexBuffer(0, quadVertexBuffer);
  lightingPass.setIndexBuffer(quadIndexBuffer, RHIIndexFormat.UINT16);
  lightingPass.drawIndexed(6);
  lightingPass.end();

  // 将最终结果复制到画布
  commandEncoder.copyTextureToCanvas({
    source: finalRenderTarget.createView(),
    destination: canvas,
  });

  device.submit([commandEncoder.finish()]);

  requestAnimationFrame(render);
}

// ==================== 处理窗口大小变化 ====================
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // 重新创建 G-Buffer 和深度缓冲区
  positionBuffer.destroy();
  normalBuffer.destroy();
  albedoBuffer.destroy();
  depthBuffer.destroy();
  finalRenderTarget.destroy();

  positionBuffer = device.createTexture({
    width: canvas.width,
    height: canvas.height,
    format: RHITextureFormat.RGBA16_FLOAT,
    usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
    dimension: '2d',
    label: 'Position G-Buffer',
  });

  normalBuffer = device.createTexture({
    width: canvas.width,
    height: canvas.height,
    format: RHITextureFormat.RGBA16_FLOAT,
    usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
    dimension: '2d',
    label: 'Normal G-Buffer',
  });

  albedoBuffer = device.createTexture({
    width: canvas.width,
    height: canvas.height,
    format: RHITextureFormat.RGBA8_UNORM,
    usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
    dimension: '2d',
    label: 'Albedo G-Buffer',
  });

  depthBuffer = device.createTexture({
    width: canvas.width,
    height: canvas.height,
    format: RHITextureFormat.DEPTH16_UNORM,
    usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
    dimension: '2d',
    label: 'Depth Buffer',
  });

  finalRenderTarget = device.createTexture({
    width: canvas.width,
    height: canvas.height,
    format: RHITextureFormat.RGBA8_UNORM,
    usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
    dimension: '2d',
    label: 'Final Render Target',
  });

  // 更新光照绑定组
  lightingBindGroup = device.createBindGroup(lightingBindGroupLayout, [
    {
      binding: 0,
      resource: positionBuffer.createView(),
    },
    {
      binding: 1,
      resource: normalBuffer.createView(),
    },
    {
      binding: 2,
      resource: albedoBuffer.createView(),
    },
    {
      binding: 3,
      resource: sampler,
    },
    {
      binding: 4,
      resource: lightPositionBuffer,
    },
    {
      binding: 5,
      resource: lightColorBuffer,
    },
    {
      binding: 6,
      resource: cameraPositionBuffer,
    },
  ], 'Lighting Bind Group');

  // 更新投影矩阵
  projectionMatrix.perspective(45, canvas.width / canvas.height, 0.1, 100.0);
  projectionMatrixBuffer.update(new Float32Array(projectionMatrix.getElements()));
});

// 开始渲染
render();