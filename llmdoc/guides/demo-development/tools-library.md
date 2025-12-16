---
title: "工具库使用指南"
description: "RHI Demo工具库的详细使用说明、API文档和示例"
category: "guides"
tags: ["tools", "library", "api", "utilities"]
created: "2025-12-17"
updated: "2025-12-17"
version: "1.0.0"
---

# 工具库使用指南

## 概述

RHI Demo工具库提供了完整的3D渲染开发工具集，包括核心框架、几何体生成、纹理处理、渲染工具、着色器工具、阴影系统、粒子系统、天空盒系统和PBR材质等模块。

## 🛠️ 核心框架

### DemoRunner

统一的Demo生命周期管理器，提供标准化的渲染流程。

```typescript
import { DemoRunner } from './utils';

const runner = new DemoRunner({
  canvasId: 'J-canvas',        // Canvas元素ID
  name: 'My Demo',            // Demo名称
  clearColor: [0.1, 0.1, 0.1, 1.0], // 清除颜色
});

// 初始化
await runner.init();

// 开始渲染循环
runner.start((dt) => {
  const { encoder, passDescriptor } = runner.beginFrame();

  // 渲染代码...

  runner.endFrame(encoder);
});
```

#### 主要API

```typescript
// 初始化配置
interface DemoRunnerConfig {
  canvasId: string;           // Canvas元素ID
  name: string;               // Demo名称
  clearColor: number[];       // 清除颜色 [r, g, b, a]
  debug?: boolean;            // 调试模式
  logLevel?: 'none' | 'error' | 'warn' | 'info' | 'debug'; // 日志级别
}

// 资源管理
const buffer = runner.track(device.createBuffer({
  size: 1024,
  usage: MSpec.RHIBufferUsage.VERTEX
})); // 自动追踪资源，防止内存泄漏

// 事件处理
runner.onKey('Escape', () => runner.destroy());
runner.onKey('F11', () => toggleFullscreen());

// 帮助信息
DemoRunner.showHelp([
  'ESC: 退出Demo',
  'F11: 切换全屏',
  'R: 重置场景'
]);
```

### OrbitController

球面坐标相机控制器，支持旋转、缩放和平移。

```typescript
import { OrbitController } from './utils';

const orbit = new OrbitController(canvas, {
  distance: 5,               // 相机距离
  target: [0, 0, 0],         // 观察目标
  enableDamping: true,       // 启用阻尼
  dampingFactor: 0.05,       // 阻尼系数
  enableZoom: true,          // 启用缩放
  enableRotate: true,        // 启用旋转
  enablePan: true,           // 启用平移
  minDistance: 1,            // 最小距离
  maxDistance: 100,          // 最大距离
  autoRotate: false,         // 自动旋转
  autoRotateSpeed: 0.5       // 自动旋转速度
});

// 渲染循环中更新
runner.start((dt) => {
  orbit.update(dt);

  const viewMatrix = orbit.getViewMatrix();
  const projMatrix = orbit.getProjectionMatrix(aspect);

  // 使用矩阵...
});
```

### Stats

实时性能监控面板。

```typescript
import { Stats } from './utils';

const stats = new Stats({
  position: 'top-left',      // 面板位置
  show: ['fps', 'ms', 'memory'], // 显示指标
  theme: 'dark',             // 主题
  minimal: false             // 简化模式
});

// 渲染循环中使用
runner.start((dt) => {
  stats.begin();

  // 渲染代码...

  stats.end();
});
```

## 📐 几何体工具

### GeometryGenerator

提供9种标准几何体的生成器。

```typescript
import { GeometryGenerator } from './utils';

// 立方体
const cube = GeometryGenerator.cube({
  size: 1.0,                // 边长
  segments: 1               // 每边分段数
});

// 球体
const sphere = GeometryGenerator.sphere({
  radius: 1.0,              // 半径
  widthSegments: 32,        // 经度分段
  heightSegments: 16,       // 纬度分段
  phiStart: 0,              // 起始经度
  phiLength: Math.PI * 2,    // 经度范围
  thetaStart: 0,            // 起始纬度
  thetaLength: Math.PI,     // 纬度范围
});

// 圆环体
const torus = GeometryGenerator.torus({
  radius: 1.0,              // 主半径
  tube: 0.4,                // 管半径
  radialSegments: 16,       // 径向分段
  tubularSegments: 100,     // 管向分段
  arc: Math.PI * 2          // 圆弧角度
});

// 其他几何体
const plane = GeometryGenerator.plane({ width: 1, height: 1 });
const cone = GeometryGenerator.cone({ radius: 1, height: 2 });
const cylinder = GeometryGenerator.cylinder({ radiusTop: 1, radiusBottom: 1, height: 2 });
const capsule = GeometryGenerator.capsule({ radius: 1, height: 2 });
```

#### 几何体数据结构

```typescript
interface Geometry {
  vertices: Float32Array;    // 顶点数据 [x, y, z, x, y, z, ...]
  normals: Float32Array;     // 法线数据 [nx, ny, nz, nx, ny, nz, ...]
  uvs: Float32Array;         // UV坐标 [u, v, u, v, ...]
  indices: Uint16Array;      // 索引数据
  vertexCount: number;       // 顶点数量
  indexCount: number;        // 索引数量
  bounds: {                  // 包围盒
    min: [number, number, number];
    max: [number, number, number];
  };
}
```

## 🖼️ 纹理工具

### TextureLoader

高效的纹理加载和处理工具。

```typescript
import { TextureLoader } from './utils';

// 从URL加载纹理
const texture = await TextureLoader.load('path/to/image.jpg', {
  flipY: true,              // Y轴翻转
  generateMipmaps: true,    // 自动生成Mipmap
  premultiplyAlpha: false,  // 预乘Alpha
  format: 'rgba8-unorm'     // 纹理格式
});

// 批量加载
const textures = await TextureLoader.loadAll([
  'diffuse.jpg',
  'normal.jpg',
  'roughness.jpg'
]);

// 从ImageData创建
const imageData = new ImageData(width, height);
const texture = TextureLoader.fromImageData(imageData);

// 生成Mipmap链
const mipmapData = TextureLoader.generateMipmaps(imageData, width, height);
```

### CubemapGenerator

立方体贴图生成器，支持多种生成模式。

```typescript
import { CubemapGenerator } from './utils';

// 生成纯色立方体贴图
const solidColor = CubemapGenerator.solidColor({
  color: [0.5, 0.7, 1.0, 1.0], // 颜色
  size: 256                   // 分辨率
});

// 生成天空渐变
const skyGradient = CubemapGenerator.skyGradient({
  topColor: [135, 206, 250, 255],     // 顶部颜色
  horizonColor: [176, 196, 222, 255], // 地平线颜色
  bottomColor: [139, 69, 19, 255],    // 底部颜色
  size: 512
});

// 生成调试立方体贴图
const debug = CubemapGenerator.debug({
  size: 256,
  showLabels: true
});

// 从URL加载立方体贴图
const cubemap = await CubemapGenerator.loadFromUrls([
  'posx.jpg', 'negx.jpg',
  'posy.jpg', 'negy.jpg',
  'posz.jpg', 'negz.jpg'
]);

// 从全景图转换
const panoramaCubemap = await CubemapGenerator.fromEquirectangular(
  'panorama.jpg',
  512
);
```

### ProceduralTexture

程序化纹理生成器。

```typescript
import { ProceduralTexture } from './utils';

// 棋盘格纹理
const checkerboard = ProceduralTexture.checkerboard({
  size: 256,                // 分辨率
  color1: [1, 1, 1, 1],    // 颜色1
  color2: [0, 0, 0, 1],    // 颜色2
  checkerSize: 8           // 棋盘格大小
});

// 渐变纹理
const gradient = ProceduralTexture.gradient({
  size: 256,
  startColor: [1, 0, 0, 1],
  endColor: [0, 0, 1, 1],
  direction: 'horizontal'  // 'horizontal' | 'vertical' | 'diagonal'
});

// 噪声纹理
const noise = ProceduralTexture.noise({
  size: 256,
  octaves: 4,               // 噪声层数
  persistence: 0.5,         // 持续性
  lacunarity: 2.0,          // 间隙性
  seed: 12345              // 随机种子
});

// UV调试纹理
const uvDebug = ProceduralTexture.uvDebug({
  size: 256
});
```

## 🎨 渲染工具

### RenderTarget

离屏渲染目标管理器。

```typescript
import { RenderTarget } from './utils';

// 创建渲染目标
const renderTarget = runner.track(new RenderTarget(device, {
  width: 800,
  height: 600,
  colorAttachmentCount: 1,          // 颜色附件数量
  depthFormat: 'depth24-unorm',      // 深度格式
  stencilFormat: 'stencil8',         // 模板格式
  samples: 1                         // 多重采样数
}));

// 获取渲染通道描述符
const passDescriptor = renderTarget.getRenderPassDescriptor(
  [0.1, 0.1, 0.1, 1.0],  // 清除颜色
  1.0,                    // 深度清除值
  0                       // 模板清除值
);

// 渲染到纹理
const renderPass = encoder.beginRenderPass(passDescriptor);
// 渲染操作...
renderPass.end();

// 获取结果纹理
const colorTexture = renderTarget.getColorView(0);
const depthTexture = renderTarget.getDepthView();

// 动态调整大小
renderTarget.resize(1024, 768);
```

## 🎭 着色器工具

### ShaderUtils

着色器代码生成和管理工具。

```typescript
import { ShaderUtils } from './utils';

// 生成Uniform块
const transformsBlock = ShaderUtils.generateUniformBlock({
  name: 'Transforms',
  binding: 0,
  fields: [
    { name: 'uModelMatrix', type: 'mat4' },
    { name: 'uViewMatrix', type: 'mat4' },
    { name: 'uProjectionMatrix', type: 'mat4' }
  ]
});

// 生成标准着色器
const vs = ShaderUtils.basicVertexShader({
  hasNormals: true,         // 包含法线
  hasUVs: true,            // 包含UV
  hasColors: false,         // 包含顶点颜色
  hasTangents: false        // 包含切线
});

const fs = ShaderUtils.basicFragmentShader({
  mode: 'phong',            // 'solid' | 'color' | 'texture' | 'phong'
  hasNormals: true,
  hasUVs: true,
  hasColors: false
});

// 生成完整的Phong着色器
const phongShaders = ShaderUtils.phongShaders({
  vertexInput: {
    position: true,
    normal: true,
    uv: true
  },
  lighting: {
    ambient: true,
    diffuse: true,
    specular: true
  }
});

// 着色器代码片段
const lightingSnippet = ShaderUtils.getLightingSnippet();
const normalTransformSnippet = ShaderUtils.getNormalTransformSnippet();
const textureSamplingSnippet = ShaderUtils.getTextureSamplingSnippet();
```

## 🌑 阴影系统

### ShadowMap

阴影贴图管理器。

```typescript
import { ShadowMap, LightSpaceMatrix, PCFFilter } from './utils';

// 创建阴影贴图
const shadowMap = runner.track(new ShadowMap(device, {
  resolution: 2048,         // 分辨率
  label: 'Main Shadow Map',
  depthFormat: 'depth32float' // 深度格式
}));

// 计算光源空间矩阵
const lightMatrix = new LightSpaceMatrix();
lightMatrix.updateDirectional({
  direction: [0.5, -1, 0.3], // 光源方向
  orthoSize: 15,              // 正交大小
  near: 1,                    // 近平面
  far: 50                     // 远平面
});

// 渲染阴影Pass
const shadowPassDesc = shadowMap.getRenderPassDescriptor();
const shadowPass = encoder.beginRenderPass(shadowPassDesc);

// 渲染阴影投射物
shadowPass.setPipeline(shadowPipeline);
shadowPass.setBindGroup(0, lightMatrix.getBindGroup());
shadowPass.setVertexBuffer(0, vertexBuffer);
shadowPass.drawIndexed(indexCount);

shadowPass.end();

// 在场景Pass中使用阴影
bindGroup.setTexture(0, shadowMap.depthView);
bindGroup.setSampler(0, shadowMap.sampler);
```

### PCFFilter

PCF软阴影滤波器。

```typescript
import { PCFFilter } from './utils';

// 生成PCF着色器代码
const pcfCode = PCFFilter.getShaderSnippet({
  sampleMode: '3x3',         // '1x1' | '2x2' | '3x3' | '5x5'
  bias: 0.005,               // 阴影偏移
  filterSize: 1.0            // 滤波大小
});

// 获取Uniform块声明
const shadowBlock = PCFFilter.getUniformBlock(binding);

// 获取采样次数
const sampleCount = PCFFilter.getSampleCount('3x3'); // 9
```

### ShadowShaders

阴影着色器代码生成器。

```typescript
import { ShadowShaders } from './utils';

// 深度Pass着色器
const depthVS = ShadowShaders.getDepthVertexShader();
const depthFS = ShadowShaders.getDepthFragmentShader();

// 场景Pass着色器（带阴影）
const sceneVS = ShadowShaders.getSceneVertexShader({
  hasNormals: true,
  hasUVs: true
});

const sceneFS = ShadowShaders.getSceneFragmentShader({
  hasNormals: true,
  hasUVs: true,
  pcfMode: '3x3',
  shadowBias: 0.005,
  lightCount: 1
});
```

## ✨ 粒子系统

### ParticleSystem

GPU实例化粒子系统。

```typescript
import { ParticleSystem, ParticleRenderer } from './utils';

// 创建粒子系统
const particleSystem = runner.track(new ParticleSystem(device, {
  maxParticles: 10000,       // 最大粒子数
  emissionRate: 100,         // 发射速率（粒子/秒）
  lifetime: 3.0,            // 生命周期（秒）
  startColor: [1.0, 0.5, 0.0, 1.0], // 起始颜色
  endColor: [1.0, 1.0, 0.0, 0.0],   // 结束颜色
  startSize: 0.1,            // 起始大小
  endSize: 0.05,             // 结束大小
  startVelocity: [0, 5, 0],  // 起始速度
  acceleration: [0, -9.8, 0], // 加速度
  randomSeed: 12345          // 随机种子
}));

// 创建粒子渲染器
const renderer = runner.track(new ParticleRenderer(device, particleSystem));

// 配置发射器
particleSystem.setEmitter({
  type: 'point',            // 'point' | 'sphere' | 'box'
  position: [0, 0, 0],
  radius: 1.0,              // 球体半径
  boxSize: [2, 2, 2],       // 盒子大小
  spread: 0.5               // 发射扩散角度
});

// 渲染循环中更新和渲染
runner.start((dt) => {
  particleSystem.update(dt);

  renderPass.setPipeline(particlePipeline);
  renderer.draw(renderPass, particleSystem.getActiveParticleCount());
});
```

## 🌅 天空盒系统

### SkyboxRenderer

天空盒渲染器。

```typescript
import { SkyboxRenderer, EnvironmentMap } from './utils';

// 加载HDR环境贴图
const envMap = await EnvironmentMap.fromHDR(device, 'environment.hdr', {
  resolution: 2048,          // 立方体贴图分辨率
  generateMipmaps: true,     // 生成Mipmap
  format: 'rgba16float'     // 格式
});

// 创建天空盒渲染器
const skyboxRenderer = runner.track(new SkyboxRenderer(device, envMap));

// 渲染天空盒（通常在渲染管线的最后）
renderPass.setPipeline(skyboxPipeline);
skyboxRenderer.draw(renderPass);

// 获取预过滤的环境贴图
const prefilteredEnv = envMap.getPrefilteredEnvironment();
const brdfLUT = envMap.getBRDFLookupTable();
```

## 🎨 PBR材质系统

### PBRMaterial

基于物理的材质系统。

```typescript
import { PBRMaterial } from './utils';

// 创建PBR材质
const material = new PBRMaterial({
  albedo: [0.8, 0.2, 0.2],  // 反照率
  metallic: 0.8,             // 金属度
  roughness: 0.2,           // 粗糙度
  normalMap: normalTexture,  // 法线贴图
  aoMap: aoTexture,          // AO贴图
  metallicMap: metallicTexture, // 金属度贴图
  roughnessMap: roughnessTexture, // 粗糙度贴图
  emissive: [0, 0, 0],      // 自发光
  emissiveStrength: 0.0     // 自发光强度
});

// 设置环境光照
material.setEnvironmentMap(envMap);

// 在着色器中使用
const finalColor = material.computeLighting(
  viewDir,      // 视线方向
  normal,       // 法线
  lightDir,     // 光照方向
  lightColor    // 光照颜色
);
```

## 🔧 实例化渲染

### InstanceBuffer

实例缓冲区管理器。

```typescript
import { InstanceBuffer, getStandardInstanceLayout } from './utils';

// 创建实例缓冲区
const instanceBuffer = runner.track(new InstanceBuffer(device, {
  maxInstances: 10000,       // 最大实例数
  instanceLayout: getStandardInstanceLayout(2), // 从location 2开始
  dynamic: true,             // 动态更新
  label: 'MyInstanceBuffer'
}));

// 更新实例数据
const instanceData = new Float32Array(20); // 80 bytes per instance
instanceData.set(modelMatrix.elements, 0);  // mat4 (16 floats)
instanceData.set([r, g, b, a], 16);         // vec4 (4 floats)

instanceBuffer.updateInstance(0, instanceData);

// 批量更新
const batchData = new Float32Array(1000 * 20);
instanceBuffer.updateInstances(0, batchData, 1000);

// 获取统计信息
const stats = instanceBuffer.getStats();
console.log(`使用${stats.usage * 100}%的缓冲区容量`);
```

### InstancedRenderer

实例化渲染器。

```typescript
import { InstancedRenderer } from './utils';

// 创建实例化渲染器
const renderer = runner.track(new InstancedRenderer(device, instanceBuffer, {
  vertexBuffer: geometryBuffer,
  indexBuffer: indexBuffer,
  vertexCount: geometry.vertexCount,
  indexCount: geometry.indexCount,
  indexFormat: 'uint16'
}));

// 获取顶点布局（用于创建管线）
const vertexBufferLayouts = renderer.getVertexBufferLayouts(24); // 24 = stride

// 创建渲染管线
const pipeline = device.createRenderPipeline({
  vertex: {
    module: vertexShader,
    entryPoint: 'main',
    buffers: vertexBufferLayouts
  },
  fragment: {
    module: fragmentShader,
    entryPoint: 'main',
    targets: [{ format: 'rgba8unorm' }]
  },
  primitive: { topology: 'triangle-list' },
  depthStencil: {
    format: 'depth24unorm',
    depthWriteEnabled: true,
    depthCompare: 'less'
  }
});

// 渲染实例
renderPass.setPipeline(pipeline);
renderer.draw(renderPass, instanceCount);
```

## 📊 后处理系统

### PostProcessManager

后处理管道管理器。

```typescript
import {
  PostProcessManager,
  ToneMapping,
  FXAA,
  BrightnessContrast,
  GaussianBlur
} from './utils';

// 创建后处理管理器
const postProcess = runner.track(new PostProcessManager(device, {
  width: runner.width,
  height: runner.height,
  useHDR: false,             // 使用HDR
  format: 'rgba8unorm'       // 纹理格式
}));

// 添加效果链
postProcess.addEffect(new ToneMapping(device, {
  mode: 'aces',              // 'reinhard' | 'aces' | 'uncharted2' | 'filmic'
  exposure: 1.0,
  gamma: 2.2
}));

postProcess.addEffect(new BrightnessContrast(device, {
  brightness: 0.1,
  contrast: 1.1
}));

postProcess.addEffect(new FXAA(device, {
  subpixelQuality: 0.75,
  edgeThreshold: 0.166,
  edgeThresholdMin: 0.0833
}));

// 渲染循环中应用后处理
runner.start((dt) => {
  // 1. 渲染场景到离屏纹理
  const sceneTarget = runner.track(new RenderTarget(device, {
    width: runner.width,
    height: runner.height,
    depthFormat: 'depth24unorm'
  }));

  const scenePass = encoder.beginRenderPass(
    sceneTarget.getRenderPassDescriptor([0.1, 0.1, 0.1, 1.0])
  );
  // 渲染场景...
  scenePass.end();

  // 2. 应用后处理链
  const finalTexture = postProcess.process(encoder, sceneTarget.getColorView(0));

  // 3. 输出到屏幕
  const screenPass = encoder.beginRenderPass(passDescriptor);
  // 将finalTexture绘制到屏幕...
  screenPass.end();
});
```

## 📖 相关文档

- [Demo开发概览](./overview.md)
- [Demo开发规范](./demo-standards.md)
- [Demo目录和状态](./demo-catalog.md)
- [最佳实践指南](./best-practices.md)