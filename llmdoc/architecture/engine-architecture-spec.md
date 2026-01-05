---
id: "arch-engine-architecture-spec"
type: "architecture"
title: "Engine 包完整架构规格"
description: "Engine 包作为 3D 渲染引擎的完整架构规格，包含所有核心组件、功能模块、接口定义和开发路线图"
tags: ["engine", "architecture", "rendering", "3d", "pbr", "webgl", "specification"]
context_dependency: ["arch-engine-package", "arch-core-unified", "constitution-core-runtime"]
related_ids: ["strategy-lighting-system", "strategy-shadow-system", "strategy-gltf-loader", "strategy-camera-controller", "strategy-post-processing", "strategy-render-optimization"]
last_updated: "2026-01-05"
---

# Engine 包完整架构规格

> **Context**: Engine 是四大应用包之一，专注于 3D 渲染场景。本文档定义完整渲染引擎所需的所有核心组件和功能模块。
> **Goal**: 提供开箱即用的 3D 引擎能力，作为后续开发的技术规格参考。

---

## 1. 架构总览

### 1.1 系统层次结构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Application Layer                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Engine    │  │   Scene     │  │  Controls   │  │   Resource Loaders  │ │
│  │  入口类     │  │  场景管理   │  │ 相机控制    │  │  glTF/HDR/KTX2      │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│                           Rendering Layer                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Renderers  │  │   Passes    │  │  Materials  │  │   Post Processing   │ │
│  │ 渲染器      │  │ 渲染通道    │  │  材质       │  │   后处理            │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│                           Component Layer                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Mesh     │  │   Light     │  │   Camera    │  │   Animation         │ │
│  │ 网格组件    │  │ 光源组件    │  │ 相机组件    │  │   动画组件          │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│                           System Layer                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Culling    │  │   Shadow    │  │    LOD      │  │   Batching          │ │
│  │ 剔除系统    │  │ 阴影系统    │  │ LOD系统     │  │   批处理系统        │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│                        @maxellabs/core 依赖                                  │
│  Scene | World | Components | Systems | ResourceManager | Renderer Base     │
├─────────────────────────────────────────────────────────────────────────────┤
│                         @maxellabs/rhi 依赖                                  │
│  WebGLDevice | GLBuffer | GLTexture | RenderPipeline | BindGroup | UBO      │
├─────────────────────────────────────────────────────────────────────────────┤
│                    @maxellabs/specification 类型                             │
│  IRHIDevice | ISceneData | ICameraData | Vector3Like | IMaterialResource    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 模块依赖图

```
                    ┌──────────────────┐
                    │      Engine      │
                    │   入口/协调      │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Renderers   │   │    Loaders    │   │   Controls    │
│ Forward/Defer │   │  glTF/HDR/KTX │   │ Orbit/FPS/Fly │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    Passes     │   │   Resources   │   │    Input      │
│ Shadow/Post   │   │ Mesh/Tex/Mat  │   │ Mouse/Touch   │
└───────┬───────┘   └───────┬───────┘   └───────────────┘
        │                   │
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐
        │    Components     │
        │ Mesh/Light/Camera │
        └─────────┬─────────┘
                  │
                  ▼
        ┌───────────────────┐
        │     Systems       │
        │ Cull/Shadow/LOD   │
        └─────────┬─────────┘
                  │
                  ▼
        ┌───────────────────┐
        │   @maxellabs/core │
        └─────────┬─────────┘
                  │
                  ▼
        ┌───────────────────┐
        │   @maxellabs/rhi  │
        └───────────────────┘
```

---

## 2. 核心组件清单

### 2.1 实现状态矩阵

| 类别 | 组件 | 状态 | 优先级 | 依赖 |
|------|------|:----:|:------:|------|
| **引擎入口** | Engine | ✅ 完成 | P0 | - |
| **渲染器** | SimpleWebGLRenderer | ✅ 完成 | P0 | RHI |
| **渲染器** | ForwardRenderer | 🟡 框架 | P1 | SimpleWebGLRenderer |
| **渲染器** | DeferredRenderer | ❌ TODO | P3 | ForwardRenderer |
| **材质** | PBRMaterial | ✅ 完成 | P0 | MaterialInstance |
| **材质** | UnlitMaterial | ✅ 完成 | P0 | MaterialInstance |
| **组件** | MeshInstance | ✅ 完成 | P0 | Component |
| **组件** | MaterialInstance | ✅ 完成 | P0 | Component |
| **几何体** | BoxGeometry | ✅ 完成 | P0 | GeometryBuilder |
| **几何体** | SphereGeometry | ✅ 完成 | P0 | GeometryBuilder |
| **几何体** | PlaneGeometry | ✅ 完成 | P0 | GeometryBuilder |
| **几何体** | CylinderGeometry | ✅ 完成 | P0 | GeometryBuilder |
| **光照** | DirectionalLight | ❌ TODO | **P1** | Light |
| **光照** | PointLight | ❌ TODO | **P1** | Light |
| **光照** | SpotLight | ❌ TODO | **P1** | Light |
| **光照** | AmbientLight | ❌ TODO | P2 | Light |
| **阴影** | ShadowPass | ❌ TODO | **P1** | RenderPass |
| **阴影** | ShadowMap | ❌ TODO | **P1** | Texture |
| **阴影** | CSM | ❌ TODO | P2 | ShadowPass |
| **加载器** | GLTFLoader | ❌ TODO | **P1** | ResourceLoader |
| **加载器** | HDRLoader | ❌ TODO | P2 | ResourceLoader |
| **加载器** | KTX2Loader | ❌ TODO | P2 | ResourceLoader |
| **控制器** | OrbitController | ❌ TODO | **P1** | CameraController |
| **控制器** | FPSController | ❌ TODO | P2 | CameraController |
| **控制器** | FlyController | ❌ TODO | P2 | CameraController |
| **后处理** | PostProcessPass | ❌ TODO | P2 | RenderPass |
| **后处理** | BloomPass | ❌ TODO | P2 | PostProcessPass |
| **后处理** | ToneMappingPass | ❌ TODO | P2 | PostProcessPass |
| **后处理** | SSAOPass | ❌ TODO | P3 | PostProcessPass |
| **后处理** | FXAAPass | ❌ TODO | P2 | PostProcessPass |
| **优化** | FrustumCuller | 🟡 框架 | **P1** | System |
| **优化** | LODSystem | ❌ TODO | P2 | System |
| **优化** | BatchingSystem | ❌ TODO | P2 | System |
| **优化** | InstancingSystem | ❌ TODO | P2 | System |
| **动画** | SkeletonAnimation | ❌ TODO | P2 | Animation |
| **动画** | MorphTargets | ❌ TODO | P2 | Animation |
| **粒子** | ParticleSystem | ❌ TODO | P3 | System |
| **粒子** | GPUParticles | ❌ TODO | P3 | ComputeShader |

### 2.2 优先级说明

- **P0**: 核心功能，已完成
- **P1**: 短期目标，下一阶段实现
- **P2**: 中期目标，功能完善
- **P3**: 长期目标，高级特性

---

## 3. 核心接口定义

### 3.1 光照系统接口

```typescript
/**
 * 光源类型枚举
 */
enum LightType {
  DIRECTIONAL = 0,
  POINT = 1,
  SPOT = 2,
  AMBIENT = 3
}

/**
 * 光源基础接口
 */
interface ILight {
  type: LightType;
  color: [number, number, number];
  intensity: number;
  castShadow: boolean;
}

/**
 * 方向光接口
 */
interface IDirectionalLight extends ILight {
  type: LightType.DIRECTIONAL;
  direction: Vector3Like;
}

/**
 * 点光源接口
 */
interface IPointLight extends ILight {
  type: LightType.POINT;
  position: Vector3Like;
  range: number;
  decay: number;
}

/**
 * 聚光灯接口
 */
interface ISpotLight extends ILight {
  type: LightType.SPOT;
  position: Vector3Like;
  direction: Vector3Like;
  range: number;
  innerAngle: number;  // 内锥角 弧度
  outerAngle: number;  // 外锥角 弧度
  decay: number;
}

/**
 * 多光源 UBO 布局 std140
 * 最大支持 MAX_LIGHTS 个光源
 */
interface LightsUBO {
  // 每个光源 64 bytes
  lightColors: Float32Array;      // vec4[MAX_LIGHTS] - RGB + intensity
  lightPositions: Float32Array;   // vec4[MAX_LIGHTS] - XYZ + type
  lightDirections: Float32Array;  // vec4[MAX_LIGHTS] - XYZ + range
  lightParams: Float32Array;      // vec4[MAX_LIGHTS] - innerAngle, outerAngle, decay, shadowIndex
  lightCount: number;             // uint
}

const MAX_LIGHTS = 8;
const LIGHTS_UBO_SIZE = MAX_LIGHTS * 64 + 16; // 528 bytes
```

### 3.2 阴影系统接口

```typescript
/**
 * 阴影配置
 */
interface ShadowConfig {
  enabled: boolean;
  mapSize: number;        // 阴影贴图尺寸 默认 1024
  bias: number;           // 深度偏移 默认 0.005
  normalBias: number;     // 法线偏移 默认 0.02
  radius: number;         // PCF 采样半径 默认 1
  cascades?: number;      // CSM 级联数 默认 4
}

/**
 * 阴影通道接口
 */
interface IShadowPass {
  shadowMap: IRHITexture;
  lightViewProjection: Float32Array;
  
  render(scene: Scene, light: ILight): void;
  getShadowMatrix(): Float32Array;
}

/**
 * 阴影 UBO 布局 std140
 */
interface ShadowUBO {
  shadowMatrices: Float32Array;   // mat4[MAX_SHADOW_CASCADES]
  shadowParams: Float32Array;     // vec4 - bias, normalBias, radius, mapSize
  cascadeSplits: Float32Array;    // vec4 - 级联分割距离
}

const MAX_SHADOW_CASCADES = 4;
const SHADOW_UBO_SIZE = MAX_SHADOW_CASCADES * 64 + 32; // 288 bytes
```

### 3.3 相机控制器接口

```typescript
/**
 * 相机控制器基类接口
 */
interface ICameraController {
  camera: EntityId;
  enabled: boolean;
  
  update(deltaTime: number): void;
  handleInput(event: InputEvent): void;
  dispose(): void;
}

/**
 * 轨道控制器配置
 */
interface OrbitControllerConfig {
  target?: Vector3Like;           // 目标点 默认 [0,0,0]
  minDistance?: number;           // 最小距离 默认 0.1
  maxDistance?: number;           // 最大距离 默认 Infinity
  minPolarAngle?: number;         // 最小极角 默认 0
  maxPolarAngle?: number;         // 最大极角 默认 PI
  enableDamping?: boolean;        // 启用阻尼 默认 true
  dampingFactor?: number;         // 阻尼系数 默认 0.05
  rotateSpeed?: number;           // 旋转速度 默认 1
  zoomSpeed?: number;             // 缩放速度 默认 1
  panSpeed?: number;              // 平移速度 默认 1
}

/**
 * FPS 控制器配置
 */
interface FPSControllerConfig {
  moveSpeed?: number;             // 移动速度 默认 5
  lookSpeed?: number;             // 视角速度 默认 0.002
  jumpHeight?: number;            // 跳跃高度 默认 1
  gravity?: number;               // 重力 默认 9.8
}
```

### 3.4 glTF 加载器接口

```typescript
/**
 * glTF 加载结果
 */
interface GLTFResult {
  scene: EntityId;                              // 根场景实体
  scenes: EntityId[];                           // 所有场景
  meshes: Map<string, MeshData>;                // 网格数据
  materials: Map<string, PBRMaterial>;          // 材质
  textures: Map<string, IRHITexture>;           // 纹理
  animations: AnimationClip[];                  // 动画片段
  cameras: EntityId[];                          // 相机实体
  lights: EntityId[];                           // 光源实体
}

/**
 * glTF 加载器接口
 */
interface IGLTFLoader extends IResourceLoader<GLTFResult> {
  load(url: string): Promise<GLTFResult>;
  
  // 扩展支持
  setDracoDecoder(decoder: DracoDecoder): void;
  setKTX2Transcoder(transcoder: KTX2Transcoder): void;
  
  // 支持的扩展列表
  readonly supportedExtensions: string[];
}

/**
 * glTF 扩展支持
 */
const SUPPORTED_GLTF_EXTENSIONS = [
  'KHR_draco_mesh_compression',
  'KHR_texture_basisu',
  'KHR_materials_unlit',
  'KHR_materials_pbrSpecularGlossiness',
  'KHR_lights_punctual',
  'KHR_mesh_quantization'
];
```

### 3.5 后处理接口

```typescript
/**
 * 后处理通道基类接口
 */
interface IPostProcessPass {
  name: string;
  enabled: boolean;
  
  render(input: IRHITextureView, output: IRHITextureView): void;
  resize(width: number, height: number): void;
  dispose(): void;
}

/**
 * 后处理管线接口
 */
interface IPostProcessPipeline {
  passes: IPostProcessPass[];
  
  addPass(pass: IPostProcessPass): void;
  removePass(name: string): void;
  render(input: IRHITextureView): IRHITextureView;
}

/**
 * Bloom 配置
 */
interface BloomConfig {
  threshold: number;      // 亮度阈值 默认 1.0
  intensity: number;      // 强度 默认 1.0
  radius: number;         // 模糊半径 默认 0.5
  levels: number;         // 模糊级数 默认 5
}

/**
 * Tone Mapping 类型
 */
enum ToneMappingType {
  LINEAR = 0,
  REINHARD = 1,
  ACES = 2,
  FILMIC = 3
}

/**
 * Tone Mapping 配置
 */
interface ToneMappingConfig {
  type: ToneMappingType;
  exposure: number;       // 曝光度 默认 1.0
  gamma: number;          // Gamma 校正 默认 2.2
}
```

### 3.6 渲染优化接口

```typescript
/**
 * 包围盒接口
 */
interface IBoundingBox {
  min: Vector3Like;
  max: Vector3Like;
  
  containsPoint(point: Vector3Like): boolean;
  intersectsBox(box: IBoundingBox): boolean;
  intersectsFrustum(frustum: IFrustum): boolean;
}

/**
 * 视锥体接口
 */
interface IFrustum {
  planes: Plane[];  // 6 个平面
  
  containsPoint(point: Vector3Like): boolean;
  intersectsBox(box: IBoundingBox): boolean;
  intersectsSphere(center: Vector3Like, radius: number): boolean;
}

/**
 * 剔除系统接口
 */
interface ICullingSystem {
  frustum: IFrustum;
  
  cull(entities: EntityId[]): EntityId[];
  updateFrustum(camera: Camera): void;
}

/**
 * LOD 配置
 */
interface LODConfig {
  levels: LODLevel[];
  fadeTransition: boolean;  // 淡入淡出过渡
  fadeRange: number;        // 过渡范围
}

interface LODLevel {
  distance: number;         // 切换距离
  mesh: MeshData;           // 该级别的网格
}

/**
 * LOD 系统接口
 */
interface ILODSystem {
  update(camera: Camera, entities: EntityId[]): void;
  getLODLevel(entity: EntityId): number;
}
```

---

## 4. 着色器系统

### 4.1 着色器变体系统

```typescript
/**
 * 着色器变体定义
 */
interface ShaderVariant {
  defines: Map<string, string | number | boolean>;
  hash: string;
}

/**
 * 着色器变体管理器
 */
interface IShaderVariantManager {
  getVariant(baseShader: string, defines: ShaderDefines): ShaderVariant;
  compileVariant(variant: ShaderVariant): IRHIShaderModule;
  getCachedProgram(variant: ShaderVariant): IRHIRenderPipeline | null;
}

/**
 * 常用着色器宏定义
 */
const SHADER_DEFINES = {
  // 光照
  USE_DIRECTIONAL_LIGHT: 'USE_DIRECTIONAL_LIGHT',
  USE_POINT_LIGHT: 'USE_POINT_LIGHT',
  USE_SPOT_LIGHT: 'USE_SPOT_LIGHT',
  MAX_LIGHTS: 'MAX_LIGHTS',
  
  // 阴影
  USE_SHADOW: 'USE_SHADOW',
  USE_PCF: 'USE_PCF',
  USE_CSM: 'USE_CSM',
  
  // 材质
  USE_NORMAL_MAP: 'USE_NORMAL_MAP',
  USE_METALLIC_ROUGHNESS_MAP: 'USE_METALLIC_ROUGHNESS_MAP',
  USE_OCCLUSION_MAP: 'USE_OCCLUSION_MAP',
  USE_EMISSIVE_MAP: 'USE_EMISSIVE_MAP',
  
  // 渲染
  USE_IBL: 'USE_IBL',
  USE_SKINNING: 'USE_SKINNING',
  USE_MORPH_TARGETS: 'USE_MORPH_TARGETS',
  USE_INSTANCING: 'USE_INSTANCING'
};
```

### 4.2 UBO 布局规范

```glsl
// ==================== 全局 UBO binding 0 ====================
layout(std140) uniform GlobalUBO {
  mat4 u_viewMatrix;           // offset 0,   size 64
  mat4 u_projectionMatrix;     // offset 64,  size 64
  mat4 u_viewProjectionMatrix; // offset 128, size 64
  vec4 u_cameraPosition;       // offset 192, size 16 xyz + padding
  vec4 u_time;                 // offset 208, size 16 time, deltaTime, frame, padding
  vec4 u_resolution;           // offset 224, size 16 width, height, 1/width, 1/height
};  // Total: 240 bytes

// ==================== 模型 UBO binding 1 ====================
layout(std140) uniform ModelUBO {
  mat4 u_modelMatrix;          // offset 0,   size 64
  mat4 u_normalMatrix;         // offset 64,  size 64
};  // Total: 128 bytes

// ==================== 材质 UBO binding 2 ====================
layout(std140) uniform MaterialUBO {
  vec4 u_baseColor;            // offset 0,   size 16
  float u_metallic;            // offset 16,  size 4
  float u_roughness;           // offset 20,  size 4
  float u_normalScale;         // offset 24,  size 4
  float u_occlusionStrength;   // offset 28,  size 4
  vec3 u_emissiveColor;        // offset 32,  size 12
  float u_emissiveIntensity;   // offset 44,  size 4
  float u_alphaCutoff;         // offset 48,  size 4
  vec3 _pad;                   // offset 52,  size 12
};  // Total: 64 bytes

// ==================== 光照 UBO binding 3 ====================
layout(std140) uniform LightsUBO {
  vec4 u_lightColors[8];       // offset 0,   size 128 RGB + intensity
  vec4 u_lightPositions[8];    // offset 128, size 128 XYZ + type
  vec4 u_lightDirections[8];   // offset 256, size 128 XYZ + range
  vec4 u_lightParams[8];       // offset 384, size 128 innerAngle, outerAngle, decay, shadowIndex
  uint u_lightCount;           // offset 512, size 4
  vec3 _pad;                   // offset 516, size 12
};  // Total: 528 bytes

// ==================== 阴影 UBO binding 4 ====================
layout(std140) uniform ShadowUBO {
  mat4 u_shadowMatrices[4];    // offset 0,   size 256 CSM 级联
  vec4 u_shadowParams;         // offset 256, size 16 bias, normalBias, radius, mapSize
  vec4 u_cascadeSplits;        // offset 272, size 16 级联分割距离
};  // Total: 288 bytes
```

---

## 5. 渲染管线流程

### 5.1 前向渲染流程

```pseudocode
FUNCTION ForwardRenderer.render(scene, camera):
  // 1. 更新全局 UBO
  globalUBO.update(camera.viewMatrix, camera.projectionMatrix, time)
  
  // 2. 收集可见光源
  lights = scene.query([Light, WorldTransform])
  lightsUBO.update(lights)
  
  // 3. 阴影通道 如果启用
  IF shadowConfig.enabled:
    FOR EACH shadowCastingLight IN lights:
      shadowPass.render(scene, shadowCastingLight)
  
  // 4. 视锥剔除
  visibleEntities = cullingSystem.cull(scene.entities, camera.frustum)
  
  // 5. 排序 不透明 -> 透明
  opaqueEntities = visibleEntities.filter(e => !e.material.transparent)
  transparentEntities = visibleEntities.filter(e => e.material.transparent)
  
  opaqueEntities.sortByMaterial()      // 减少状态切换
  transparentEntities.sortBackToFront() // 正确混合
  
  // 6. 主渲染通道
  renderPass = beginRenderPass(colorTarget, depthTarget)
  
  // 6a. 渲染不透明物体
  FOR EACH entity IN opaqueEntities:
    modelUBO.update(entity.worldTransform)
    materialUBO.update(entity.material)
    renderPass.draw(entity.mesh)
  
  // 6b. 渲染透明物体
  renderPass.setBlendState(ALPHA_BLEND)
  FOR EACH entity IN transparentEntities:
    modelUBO.update(entity.worldTransform)
    materialUBO.update(entity.material)
    renderPass.draw(entity.mesh)
  
  renderPass.end()
  
  // 7. 后处理
  IF postProcessing.enabled:
    postProcessPipeline.render(colorTarget)
  
  // 8. 输出到画布
  copyToCanvas(colorTarget)
```

### 5.2 延迟渲染流程 P3

```pseudocode
FUNCTION DeferredRenderer.render(scene, camera):
  // 1. G-Buffer 通道
  gBufferPass = beginRenderPass(gBuffer)
  FOR EACH entity IN visibleEntities:
    // 输出: position, normal, albedo, metallic-roughness
    gBufferPass.draw(entity.mesh, gBufferShader)
  gBufferPass.end()
  
  // 2. 光照通道
  lightingPass = beginRenderPass(lightingTarget)
  lightingPass.setFullscreenQuad()
  lightingPass.bindGBuffer(gBuffer)
  lightingPass.bindLightsUBO(lightsUBO)
  lightingPass.draw(lightingShader)
  lightingPass.end()
  
  // 3. 前向通道 透明物体
  forwardPass = beginRenderPass(lightingTarget)
  FOR EACH entity IN transparentEntities:
    forwardPass.draw(entity.mesh, forwardShader)
  forwardPass.end()
  
  // 4. 后处理
  postProcessPipeline.render(lightingTarget)
```

---

## 6. 开发路线图

### 6.1 Phase 1: 核心渲染能力 P1

**目标**: 完善基础渲染功能

| 任务 | 描述 | 依赖 |
|------|------|------|
| 多光源系统 | 支持 8 个光源同时渲染 | Light 组件 |
| 基础阴影 | 方向光阴影贴图 + PCF | ShadowPass |
| 纹理采样 | Albedo/Normal/MR 贴图 | TextureLoader |
| glTF 加载器 | 支持 glTF 2.0 模型加载 | GLTFLoader |
| 相机控制器 | OrbitController 实现 | CameraController |
| 视锥剔除 | 基础视锥剔除系统 | FrustumCuller |

**详细规格文档**:
- `strategy-lighting-system.md` - 多光源系统技术规格
- `strategy-shadow-system.md` - 阴影系统技术规格
- `strategy-gltf-loader.md` - glTF 加载器技术规格
- `strategy-camera-controller.md` - 相机控制器技术规格

### 6.2 Phase 2: 功能完善 P2

**目标**: 增强渲染质量和用户体验

| 任务 | 描述 | 依赖 |
|------|------|------|
| 后处理框架 | PostProcessPass 抽象 | RenderPass |
| Bloom 效果 | 泛光后处理 | PostProcessPass |
| Tone Mapping | HDR 到 LDR 转换 | PostProcessPass |
| FXAA | 快速抗锯齿 | PostProcessPass |
| LOD 系统 | 细节层次管理 | LODSystem |
| 批处理 | Draw Call 合并 | BatchingSystem |
| HDR 加载 | 环境贴图加载 | HDRLoader |
| IBL | 基于图像的光照 | EnvironmentMap |

**详细规格文档**:
- `strategy-post-processing.md` - 后处理框架技术规格
- `strategy-render-optimization.md` - 渲染优化系统技术规格

### 6.3 Phase 3: 高级特性 P3

**目标**: 实现高级渲染技术

| 任务 | 描述 | 依赖 |
|------|------|------|
| 延迟渲染 | G-Buffer 渲染管线 | DeferredRenderer |
| CSM | 级联阴影贴图 | ShadowPass |
| SSAO | 屏幕空间环境光遮蔽 | PostProcessPass |
| SSR | 屏幕空间反射 | PostProcessPass |
| 骨骼动画 | Skinning 支持 | SkeletonAnimation |
| 变形动画 | Morph Targets | MorphTargets |
| GPU 粒子 | Compute Shader 粒子 | GPUParticles |
| TAA | 时间抗锯齿 | PostProcessPass |

---

## 7. 目录结构规划

### 7.1 当前结构

```
packages/engine/src/
├── index.ts                    # 统一导出
├── engine/                     # 引擎入口
│   ├── engine.ts               # ✅ Engine 主类
│   └── engine-config.ts        # ✅ 引擎配置
├── renderers/                  # 渲染器
│   ├── simple-webgl-renderer.ts # ✅ 简化渲染器
│   ├── forward-renderer.ts     # 🟡 前向渲染器框架
│   └── shaders.ts              # ✅ 内置着色器
├── materials/                  # 材质系统
│   ├── PBR-material.ts         # ✅ PBR 材质
│   └── unlit-material.ts       # ✅ Unlit 材质
├── components/                 # ECS 组件
│   ├── mesh-instance.ts        # ✅ 网格实例
│   └── material-instance.ts    # ✅ 材质实例
├── primitives/                 # 内置几何体
│   ├── box-geometry.ts         # ✅ 立方体
│   ├── sphere-geometry.ts      # ✅ 球体
│   ├── plane-geometry.ts       # ✅ 平面
│   └── cylinder-geometry.ts    # ✅ 圆柱体
└── utils/                      # 工具函数
    ├── bounding-box.ts         # 🟡 包围盒
    ├── frustum-culler.ts       # 🟡 视锥剔除
    └── environment-probe.ts    # 🟡 环境探针
```

### 7.2 规划结构

```
packages/engine/src/
├── index.ts
├── engine/
│   ├── engine.ts
│   └── engine-config.ts
├── renderers/
│   ├── simple-webgl-renderer.ts
│   ├── forward-renderer.ts
│   ├── deferred-renderer.ts    # P3
│   └── shaders/
│       ├── index.ts
│       ├── pbr.glsl
│       ├── shadow.glsl
│       └── post-process.glsl
├── passes/                     # 渲染通道
│   ├── shadow-pass.ts          # P1
│   ├── post-process-pass.ts    # P2
│   ├── bloom-pass.ts           # P2
│   ├── tone-mapping-pass.ts    # P2
│   └── fxaa-pass.ts            # P2
├── materials/
│   ├── PBR-material.ts
│   ├── unlit-material.ts
│   └── standard-material.ts    # P2
├── components/
│   ├── mesh-instance.ts
│   ├── material-instance.ts
│   ├── light.ts                # P1
│   ├── shadow-caster.ts        # P1
│   └── lod-group.ts            # P2
├── primitives/
│   └── ...
├── loaders/                    # 资源加载器
│   ├── gltf-loader.ts          # P1
│   ├── hdr-loader.ts           # P2
│   └── ktx2-loader.ts          # P2
├── controls/                   # 相机控制器
│   ├── orbit-controller.ts     # P1
│   ├── fps-controller.ts       # P2
│   └── fly-controller.ts       # P2
├── systems/                    # ECS 系统
│   ├── culling-system.ts       # P1
│   ├── shadow-system.ts        # P1
│   ├── lod-system.ts           # P2
│   └── batching-system.ts      # P2
├── animation/                  # 动画系统
│   ├── skeleton-animation.ts   # P2
│   └── morph-targets.ts        # P2
└── utils/
    ├── bounding-box.ts
    ├── frustum.ts
    ├── environment-probe.ts
    └── shader-variant.ts       # P2
```

---

## 8. 禁止事项

### 8.1 架构约束

- 🚫 **绕过 Core 直接操作 RHI** - 所有渲染必须通过 Renderer 抽象
- 🚫 **重复实现 Core 组件** - 使用 Core 的 Transform、Camera、Light
- 🚫 **硬编码渲染顺序** - 使用 SystemScheduler 的 stage/priority
- 🚫 **同步加载资源** - 所有加载必须异步，通过 ResourceManager

### 8.2 性能约束

- 🚫 **每帧创建 GPU 资源** - 预创建并缓存
- 🚫 **每帧重新编译着色器** - 使用 ShaderCache
- 🚫 **跳过剔除直接渲染** - 必须经过 CullingSystem
- 🚫 **未排序的透明物体渲染** - 必须从后向前排序

### 8.3 接口约束

- 🚫 **导出 RHI 内部类型** - 只导出 Engine 层接口
- 🚫 **暴露 WebGL 上下文** - 封装在 Engine 内部
- 🚫 **修改 Core 组件字段** - 只能扩展，不能修改
- 🚫 **使用 any 类型** - 严格类型检查

### 8.4 文档约束

- 🚫 **无 JSDoc 的公共方法** - 所有公共 API 必须有文档
- 🚫 **无单元测试的核心功能** - 关键路径必须有测试覆盖
- 🚫 **无示例的新功能** - 每个新功能必须有 Demo

---

## 9. 相关文档

### 9.1 架构文档

- [Core 包统一架构](./core-architecture.md) - Core 基础设施定义
- [Engine 包架构设计](./engine-package.md) - Engine 包概述
- [着色器编译器](./shader-compiler.md) - ShaderCompiler 使用指南
- [资源管理](./resources.md) - ResourceManager 生命周期
- [场景系统](./scene-systems.md) - Scene 和 System 架构

### 9.2 策略文档

- [多光源系统策略](../agent/strategy-lighting-system.md) - 光照系统实现方案
- [阴影系统策略](../agent/strategy-shadow-system.md) - 阴影系统实现方案
- [glTF 加载器策略](../agent/strategy-gltf-loader.md) - glTF 加载器实现方案
- [相机控制器策略](../agent/strategy-camera-controller.md) - 相机控制器实现方案
- [后处理框架策略](../agent/strategy-post-processing.md) - 后处理系统实现方案
- [渲染优化策略](../agent/strategy-render-optimization.md) - 渲染优化实现方案

### 9.3 参考文档

- [Constitution](../reference/constitution.md) - 核心规范
- [Tech Stack](../reference/tech-stack.md) - 技术栈说明
- [Data Models](../reference/data-models.md) - 数据模型定义

---

## 10. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-01-05 | 初始版本，定义完整架构规格 |