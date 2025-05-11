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
  RHIFeatureFlags,
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
  
  // 调试输出
  // if(gl_VertexID == 0) {
  //   // 仅对第一个顶点打印输出，避免控制台过载
  //   // 在着色器中用整型来表示布尔值更安全
  //   int debug = 1; 
  // }
  
  gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}
`;

// G-Buffer 片段着色器 - 增加一些调试代码
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
  // 确保法线是归一化的
  vec3 normal = normalize(vNormal);
  
  // 位置 G-Buffer (xyz = 世界位置)
  // 对世界位置进行映射，确保数据在合理范围内
  vec3 normalizedPos = (vWorldPos + vec3(5.0)) * 0.1;
  outPosition = vec4(normalizedPos, 1.0);
  
  // 法线 G-Buffer (xyz = 法线) - 使用归一化的法线
  // 将法线从[-1,1]转换到[0,1]范围，以便正确存储
  outNormal = vec4(normal * 0.5 + 0.5, 1.0);
  
  // 反照率 G-Buffer (rgb = 漫反射颜色, a = 高光强度)
  vec4 albedo = texture(uAlbedoTexture, vTexCoord);
  
  // 为了调试，如果纹理采样失败，使用顶点颜色作为后备
  if(albedo.a < 0.1) {
    albedo = vec4(1.0, 0.5, 0.5, 1.0); // 使用明亮的粉色作为默认颜色
  }
  
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

// 光照处理片段着色器 - 增强调试输出
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
  vec4 positionData = texture(uPositionBuffer, vTexCoord);
  vec3 worldPos = positionData.rgb * 10.0 - vec3(5.0); // 反向映射回原始范围
  
  // 正确解码法线数据 - 将[0,1]范围转回[-1,1]
  vec3 normal = normalize(texture(uNormalBuffer, vTexCoord).rgb * 2.0 - 1.0);
  
  vec4 albedoSpec = texture(uAlbedoBuffer, vTexCoord);
  vec3 albedo = albedoSpec.rgb;
  float specularStrength = albedoSpec.a;
  
  // 检查G-Buffer数据是否有效
  if(length(normal) < 0.1 || positionData.a < 0.1) {
    // 如果数据无效，输出紫色以便调试
    fragColor = vec4(1.0, 0.0, 1.0, 1.0);
    return;
  }
  
  // 环境光
  float ambientStrength = 0.3; // 增加环境光强度，使场景更亮
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
// 创建正方体顶点数据 - 简化并确保每个面的法线正确
const cubeVertices = new Float32Array([
  // 格式: x, y, z, u, v, nx, ny, nz
  // 前面 (Z+)
  -0.5, -0.5, 0.5, 0.0, 0.0, 0.0, 0.0, 1.0,
  0.5, -0.5, 0.5, 1.0, 0.0, 0.0, 0.0, 1.0,
  0.5, 0.5, 0.5, 1.0, 1.0, 0.0, 0.0, 1.0,
  -0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 0.0, 1.0,

  // 后面 (Z-)
  -0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 0.0, -1.0,
  -0.5, 0.5, -0.5, 1.0, 1.0, 0.0, 0.0, -1.0,
  0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 0.0, -1.0,
  0.5, -0.5, -0.5, 0.0, 0.0, 0.0, 0.0, -1.0,

  // 上面 (Y+)
  -0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 1.0, 0.0,
  -0.5, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0, 0.0,
  0.5, 0.5, 0.5, 1.0, 0.0, 0.0, 1.0, 0.0,
  0.5, 0.5, -0.5, 1.0, 1.0, 0.0, 1.0, 0.0,

  // 下面 (Y-)
  -0.5, -0.5, -0.5, 0.0, 0.0, 0.0, -1.0, 0.0,
  0.5, -0.5, -0.5, 1.0, 0.0, 0.0, -1.0, 0.0,
  0.5, -0.5, 0.5, 1.0, 1.0, 0.0, -1.0, 0.0,
  -0.5, -0.5, 0.5, 0.0, 1.0, 0.0, -1.0, 0.0,

  // 右面 (X+)
  0.5, -0.5, -0.5, 1.0, 0.0, 1.0, 0.0, 0.0,
  0.5, 0.5, -0.5, 1.0, 1.0, 1.0, 0.0, 0.0,
  0.5, 0.5, 0.5, 0.0, 1.0, 1.0, 0.0, 0.0,
  0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0,

  // 左面 (X-)
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
// 创建棋盘格纹理数据 - 使用更明显的颜色对比
const textureSize = 256;
const textureData = new Uint8Array(textureSize * textureSize * 4);

for (let y = 0; y < textureSize; y++) {
  for (let x = 0; x < textureSize; x++) {
    const index = (y * textureSize + x) * 4;
    const isCheckerboard = (Math.floor(x / 32) % 2 === 0) !== (Math.floor(y / 32) % 2 === 0);

    // 两种不同的颜色，使用饱和度更高的颜色
    if (isCheckerboard) {
      textureData[index] = 220;     // R
      textureData[index + 1] = 80;  // G
      textureData[index + 2] = 80;  // B
    } else {
      textureData[index] = 80;      // R
      textureData[index + 1] = 80;  // G
      textureData[index + 2] = 220; // B
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
// 检查设备是否支持浮点纹理
// 获取设备特性
let deviceFeatures = 0;

try {
  // @ts-expect-error - 绕过info私有属性访问限制
  deviceFeatures = device.info?.features || 0;
} catch (e) {
  // 直接使用预设值，假设支持基本特性
  deviceFeatures = 0;
}

const supportsFloat = (deviceFeatures & RHIFeatureFlags.FLOAT_TEXTURE) !== 0;
const supportsHalfFloat = (deviceFeatures & RHIFeatureFlags.HALF_FLOAT_TEXTURE) !== 0;

console.log('G-Buffer纹理格式:', {
  supportsFloat,
  supportsHalfFloat,
});

// 使用之前确定的纹理格式，保持一致性
const positionFormat = supportsFloat ? RHITextureFormat.RGBA16_FLOAT :
  (supportsHalfFloat ? RHITextureFormat.RGBA16_FLOAT : RHITextureFormat.RGBA8_UNORM);
const normalFormat = supportsFloat ? RHITextureFormat.RGBA16_FLOAT :
  (supportsHalfFloat ? RHITextureFormat.RGBA16_FLOAT : RHITextureFormat.RGBA8_UNORM);

// 创建G-Buffer纹理
// 1. 位置缓冲区
let positionBuffer = device.createTexture({
  width: canvas.width,
  height: canvas.height,
  format: positionFormat, // 使用适合当前设备的格式
  usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
  dimension: '2d',
  label: 'Position G-Buffer',
});

// 2. 法线缓冲区
let normalBuffer = device.createTexture({
  width: canvas.width,
  height: canvas.height,
  format: normalFormat, // 使用适合当前设备的格式
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

// 相机矩阵设置
viewMatrix.identity();
// 将相机定位在(0,1,5)
const eyePos = new Vector3(0, 1, 5);
const target = new Vector3(0, 0, 0);
const up = new Vector3(0, 1, 0);

// 计算视图矩阵
const zAxis = new Vector3().subtractVectors(eyePos, target).normalize();
const xAxis = new Vector3().crossVectors(up, zAxis).normalize();
const yAxis = new Vector3().crossVectors(zAxis, xAxis);

// 构建视图矩阵
viewMatrix.elements[0] = xAxis.x;
viewMatrix.elements[1] = yAxis.x;
viewMatrix.elements[2] = zAxis.x;
viewMatrix.elements[3] = 0;

viewMatrix.elements[4] = xAxis.y;
viewMatrix.elements[5] = yAxis.y;
viewMatrix.elements[6] = zAxis.y;
viewMatrix.elements[7] = 0;

viewMatrix.elements[8] = xAxis.z;
viewMatrix.elements[9] = yAxis.z;
viewMatrix.elements[10] = zAxis.z;
viewMatrix.elements[11] = 0;

viewMatrix.elements[12] = -xAxis.dot(eyePos);
viewMatrix.elements[13] = -yAxis.dot(eyePos);
viewMatrix.elements[14] = -zAxis.dot(eyePos);
viewMatrix.elements[15] = 1;

// 使用更明确的投影矩阵参数
projectionMatrix.perspective(
  45,                        // 视场角
  canvas.width / canvas.height, // 宽高比
  0.1,                      // 近平面
  100.0                     // 远平面
);

// 创建uniform缓冲区
const modelMatrixBuffer = device.createBuffer({
  size: 64, // 4x4矩阵，每个元素4字节
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
  hint: 'static',
  label: 'Projection Matrix Buffer',
  extension: {
    typeInfo: {
      uniformName: 'uProjectionMatrix',
      uniformType: 'mat4',
    },
  },
});

// 光照参数缓冲区
const lightPositionBuffer = device.createBuffer({
  size: 16, // 3个浮点数 + 对齐
  usage: RHIBufferUsage.UNIFORM,
  hint: 'dynamic',
  label: 'Light Position Buffer',
  extension: {
    typeInfo: {
      uniformName: 'uLightPosition',
      uniformType: 'vec3',
    },
  },
});

const lightColorBuffer = device.createBuffer({
  size: 16, // 3个浮点数 + 对齐
  usage: RHIBufferUsage.UNIFORM,
  hint: 'static',
  label: 'Light Color Buffer',
  extension: {
    typeInfo: {
      uniformName: 'uLightColor',
      uniformType: 'vec3',
    },
  },
});

const cameraPositionBuffer = device.createBuffer({
  size: 16, // 3个浮点数 + 对齐
  usage: RHIBufferUsage.UNIFORM,
  hint: 'dynamic',
  label: 'Camera Position Buffer',
  extension: {
    typeInfo: {
      uniformName: 'uCameraPosition',
      uniformType: 'vec3',
    },
  },
});

// 初始化Uniforms
modelMatrix.identity();
// 初始时给立方体一点旋转，这样更容易看清3D效果
modelMatrix.elements[0] = Math.cos(0.5);
modelMatrix.elements[2] = -Math.sin(0.5);
modelMatrix.elements[8] = Math.sin(0.5);
modelMatrix.elements[10] = Math.cos(0.5);

modelMatrixBuffer.update(new Float32Array(modelMatrix.getElements()));
viewMatrixBuffer.update(new Float32Array(viewMatrix.getElements()));
projectionMatrixBuffer.update(new Float32Array(projectionMatrix.getElements()));

// 光照参数 - 使用更明亮的灯光设置
const lightPosition = new Float32Array([2.0, 2.0, 2.0, 0.0]);
const lightColor = new Float32Array([1.0, 0.9, 0.8, 0.0]); // 暖色调光源
const cameraPosition = new Float32Array([0.0, 1.0, 5.0, 0.0]);

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

// ==================== 调试UI ====================
// 添加一个调试面板和控制按钮
const debugPanel = document.createElement('div');

debugPanel.style.position = 'absolute';
debugPanel.style.top = '10px';
debugPanel.style.left = '10px';
debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
debugPanel.style.color = 'white';
debugPanel.style.padding = '10px';
debugPanel.style.borderRadius = '5px';
debugPanel.style.fontFamily = 'monospace';
debugPanel.style.zIndex = '100';
document.body.appendChild(debugPanel);

// 添加调试模式切换按钮
const debugModes = ['最终渲染', '位置缓冲', '法线缓冲', '反照率缓冲'];
let currentDebugMode = 0;

const debugModeButton = document.createElement('button');

debugModeButton.textContent = `调试模式: ${debugModes[currentDebugMode]}`;
debugModeButton.style.marginBottom = '10px';
debugModeButton.style.padding = '5px';
debugModeButton.addEventListener('click', () => {
  currentDebugMode = (currentDebugMode + 1) % debugModes.length;
  debugModeButton.textContent = `调试模式: ${debugModes[currentDebugMode]}`;
});
debugPanel.appendChild(debugModeButton);

// 添加渲染信息显示
const renderInfo = document.createElement('div');

debugPanel.appendChild(renderInfo);

// ==================== 渲染循环 ====================
let rotation = 0;
let lastFrameTime = performance.now();

// 添加检查Framebuffer完整性的函数
function checkFramebufferStatus (gl, framebuffer) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    let statusMessage = '未知错误';

    switch (status) {
      case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
        statusMessage = 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT';

        break;
      case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
        statusMessage = 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT';

        break;
      case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
        statusMessage = 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS';

        break;
      case gl.FRAMEBUFFER_UNSUPPORTED:
        statusMessage = 'FRAMEBUFFER_UNSUPPORTED';

        break;
    }

    console.error(`Framebuffer不完整: ${statusMessage}`);

    return false;
  }

  return true;
}

function render () {
  // 计算和显示FPS
  const now = performance.now();
  const frameTime = now - lastFrameTime;
  const fps = Math.round(1000 / frameTime);

  lastFrameTime = now;

  // 更新调试信息
  try {
    renderInfo.textContent = `
      FPS: ${fps}
      分辨率: ${canvas.width}x${canvas.height}
      旋转: ${rotation.toFixed(2)}
      相机: ${cameraPosition[0].toFixed(1)}, ${cameraPosition[1].toFixed(1)}, ${cameraPosition[2].toFixed(1)}
      光源: ${lightPosition[0].toFixed(1)}, ${lightPosition[1].toFixed(1)}, ${lightPosition[2].toFixed(1)}
      G-Buffer格式: ${positionFormat}, ${normalFormat}
    `;
  } catch (e) {
    // 忽略UI更新错误
  }

  // 更新旋转
  rotation += 0.01;

  // 更新模型矩阵 - 使用替代方法旋转立方体
  modelMatrix.identity();

  // 手动实现旋转矩阵
  const cosY = Math.cos(rotation);
  const sinY = Math.sin(rotation);
  const cosX = Math.cos(rotation * 0.5);
  const sinX = Math.sin(rotation * 0.5);

  // 先绕Y轴旋转
  const rotY = new Array(16).fill(0);

  rotY[0] = cosY;
  rotY[2] = -sinY;
  rotY[5] = 1;
  rotY[8] = sinY;
  rotY[10] = cosY;
  rotY[15] = 1;

  // 再绕X轴旋转
  const rotX = new Array(16).fill(0);

  rotX[0] = 1;
  rotX[5] = cosX;
  rotX[6] = sinX;
  rotX[9] = -sinX;
  rotX[10] = cosX;
  rotX[15] = 1;

  // 组合旋转 (简化版，实际应该使用矩阵乘法)
  // 这是个近似，真正的解决方案需要完整矩阵乘法
  modelMatrix.elements[0] = rotY[0];
  modelMatrix.elements[1] = rotY[1];
  modelMatrix.elements[2] = rotY[2];
  modelMatrix.elements[4] = rotY[4] * rotX[0] + rotY[5] * rotX[4] + rotY[6] * rotX[8];
  modelMatrix.elements[5] = rotY[4] * rotX[1] + rotY[5] * rotX[5] + rotY[6] * rotX[9];
  modelMatrix.elements[6] = rotY[4] * rotX[2] + rotY[5] * rotX[6] + rotY[6] * rotX[10];
  modelMatrix.elements[8] = rotY[8] * rotX[0] + rotY[9] * rotX[4] + rotY[10] * rotX[8];
  modelMatrix.elements[9] = rotY[8] * rotX[1] + rotY[9] * rotX[5] + rotY[10] * rotX[9];
  modelMatrix.elements[10] = rotY[8] * rotX[2] + rotY[9] * rotX[6] + rotY[10] * rotX[10];

  modelMatrixBuffer.update(new Float32Array(modelMatrix.getElements()));

  // 更新光源位置 - 让光源围绕场景移动
  lightPosition[0] = Math.sin(rotation) * 2.0;
  lightPosition[1] = 1.5;
  lightPosition[2] = Math.cos(rotation) * 2.0;
  lightPositionBuffer.update(lightPosition);

  // 更新相机位置
  cameraPosition[0] = Math.sin(rotation * 0.25) * 5.0;
  cameraPosition[1] = 2.0 + Math.sin(rotation * 0.1) * 0.5;
  cameraPosition[2] = Math.cos(rotation * 0.25) * 5.0;
  cameraPositionBuffer.update(cameraPosition);

  // 创建命令编码器
  const commandEncoder = device.createCommandEncoder();

  // 检查G-Buffer Framebuffer状态 (需要通过设备原生API访问)
  try {
    // @ts-expect-error - 这是调试目的的特殊访问
    const gl = device.gl;

    if (gl) {
      // 在此处添加WebGL调试代码，获取和检查Framebuffer状态
      const framebufferStatus = checkFramebufferStatus(gl, null);

      console.log(`Framebuffer状态检查: ${framebufferStatus ? '正常' : '异常'}`);
    }
  } catch (e) {
    console.log('无法直接访问WebGL上下文进行调试', e);
  }

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

  console.log('开始G-Buffer通道渲染', { width: canvas.width, height: canvas.height });

  gbufferPass.setPipeline(gbufferPipeline);
  gbufferPass.setBindGroup(0, gbufferBindGroup);
  gbufferPass.setVertexBuffer(0, cubeVertexBuffer);
  gbufferPass.setIndexBuffer(cubeIndexBuffer, RHIIndexFormat.UINT16);

  // 记录顶点和索引数量
  console.log('绘制立方体', {
    vertexCount: cubeVertices.length / 8, // 8 = 位置(3) + 纹理坐标(2) + 法线(3)
    indexCount: cubeIndices.length,
    modelMatrix: modelMatrix.getElements(),
  });

  gbufferPass.drawIndexed(36);
  gbufferPass.end();
  console.log('G-Buffer通道渲染完成');

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
    depthStencilAttachment: undefined, // 光照处理通道不需要深度缓冲区
    label: 'Lighting Render Pass',
  };

  const lightingPass = commandEncoder.beginRenderPass(lightingPassDescriptor);

  console.log('开始光照处理通道渲染');

  lightingPass.setPipeline(lightingPipeline);
  lightingPass.setBindGroup(0, lightingBindGroup);
  lightingPass.setVertexBuffer(0, quadVertexBuffer);
  lightingPass.setIndexBuffer(quadIndexBuffer, RHIIndexFormat.UINT16);

  console.log('绘制全屏四边形', {
    vertexCount: quadVertices.length / 5, // 5 = 位置(3) + 纹理坐标(2)
    indexCount: quadIndices.length,
    lightPosition: Array.from(lightPosition).slice(0, 3),
  });

  lightingPass.drawIndexed(6);
  lightingPass.end();
  console.log('光照处理通道渲染完成');

  // 将最终结果复制到画布
  switch (currentDebugMode) {
    case 0: // 最终渲染
      commandEncoder.copyTextureToCanvas({
        source: finalRenderTarget.createView(),
        destination: canvas,
      });

      // 更新调试信息
      const finalInfo = document.getElementById('gbuffer-debug-info');

      if (finalInfo) {
        finalInfo.textContent = `调试模式: ${debugModes[currentDebugMode]}`;
      }

      break;
    case 1: // 位置缓冲
      debugRenderPass(
        commandEncoder,
        positionBuffer.createView(),
        canvas,
        `${debugModes[currentDebugMode]} - 世界空间位置`
      );

      break;
    case 2: // 法线缓冲
      debugRenderPass(
        commandEncoder,
        normalBuffer.createView(),
        canvas,
        `${debugModes[currentDebugMode]} - 表面法线`
      );

      break;
    case 3: // 反照率缓冲
      debugRenderPass(
        commandEncoder,
        albedoBuffer.createView(),
        canvas,
        `${debugModes[currentDebugMode]} - 材质颜色`
      );

      break;
  }

  device.submit([commandEncoder.finish()]);

  requestAnimationFrame(render);
}

// ==================== 处理窗口大小变化 ====================
window.addEventListener('resize', () => {
  console.log('窗口大小变化，重新创建渲染目标');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // 重新创建 G-Buffer 和深度缓冲区
  positionBuffer.destroy();
  normalBuffer.destroy();
  albedoBuffer.destroy();
  depthBuffer.destroy();
  finalRenderTarget.destroy();

  // 使用之前确定的纹理格式，保持一致性
  positionBuffer = device.createTexture({
    width: canvas.width,
    height: canvas.height,
    format: positionFormat,
    usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
    dimension: '2d',
    label: 'Position G-Buffer',
  });

  normalBuffer = device.createTexture({
    width: canvas.width,
    height: canvas.height,
    format: normalFormat,
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

  console.log('渲染目标重建完成，新分辨率:', canvas.width, 'x', canvas.height);
});

// 创建一些函数来调试G-Buffer
function debugRenderPass (commandEncoder, gbufferView, targetView, label) {
  // 创建一个简单的渲染通道，直接将G-Buffer复制到目标
  const debugPassDescriptor = {
    colorAttachments: [
      {
        view: targetView,
        loadOp: 'clear',
        storeOp: 'store',
        clearColor: [0.0, 0.0, 0.0, 1.0],
      },
    ],
    label: label,
  };

  // 放到屏幕右上角的调试信息
  const debugInfo = document.createElement('div');

  debugInfo.style.position = 'absolute';
  debugInfo.style.top = '100px';
  debugInfo.style.right = '10px';
  debugInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  debugInfo.style.color = 'white';
  debugInfo.style.padding = '10px';
  debugInfo.style.borderRadius = '5px';
  debugInfo.style.fontFamily = 'monospace';
  debugInfo.style.fontSize = '14px';
  debugInfo.style.zIndex = '200';
  debugInfo.textContent = `当前查看: ${label}`;

  // 如果已存在则更新，否则添加
  const existingInfo = document.getElementById('gbuffer-debug-info');

  if (existingInfo) {
    existingInfo.textContent = debugInfo.textContent;
  } else {
    debugInfo.id = 'gbuffer-debug-info';
    document.body.appendChild(debugInfo);
  }

  // 使用copyTextureToCanvas而不是创建专门的渲染通道
  commandEncoder.copyTextureToCanvas({
    source: gbufferView,
    destination: canvas,
  });
}

// 添加键盘快捷键
document.addEventListener('keydown', event => {
  // 数字键1-4控制调试模式
  if (event.key >= '1' && event.key <= '4') {
    currentDebugMode = parseInt(event.key) - 1;
    debugModeButton.textContent = `调试模式: ${debugModes[currentDebugMode]}`;
  }

  // R键重载着色器和管线
  if (event.key === 'r' || event.key === 'R') {
    console.log('尝试重新创建着色器和管线...');
    // 这里可以添加重载逻辑
  }
});

// 立即开始渲染
render();