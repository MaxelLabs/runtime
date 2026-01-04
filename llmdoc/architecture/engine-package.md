---
id: "arch-engine-package"
type: "architecture"
title: "Engine 包架构设计"
description: "Engine 包作为 3D 渲染引擎的顶层封装，整合 Core 基础设施和 RHI 实现，提供开箱即用的 3D 应用开发能力"
tags: ["engine", "architecture", "3d", "rendering", "pbr", "scene", "glTF", "webgl", "rhi", "bind-group"]
context_dependency: ["arch-core-unified", "architecture-shader-compiler", "architecture-resources"]
related_ids: ["ref-rhi-interfaces", "arch-logic-systems", "architecture-scene-systems", "strategy-triangle-rendering-gap-analysis"]
last_updated: "2025-01-04"
---

# Engine 包架构设计

> **Context**: Engine 是四大应用包之一，专注于 3D 渲染场景。
> **Goal**: 提供开箱即用的 3D 引擎能力，封装复杂的渲染细节，让开发者专注业务逻辑。

## 1. 定位与职责

### 1.1 在产品架构中的位置

```
┌─────────────────────────────────────────────────────────────────────┐
│                      @maxellabs/engine (本包)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   Engine    │  │  Loaders    │  │  Renderers  │  │  Systems   │ │
│  │ (入口类)   │  │ (glTF/OBJ) │  │ (PBR/Shadow)│  │ (高级系统) │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                        @maxellabs/core (依赖)                        │
│  Scene | World | Components | Systems | ResourceManager | Renderer  │
├─────────────────────────────────────────────────────────────────────┤
│                         @maxellabs/rhi (依赖)                        │
│  WebGLDevice | GLBuffer | GLTexture | WebGLRenderPipeline | ...     │
├─────────────────────────────────────────────────────────────────────┤
│                    @maxellabs/specification (类型)                   │
│  IRHIDevice | ISceneData | ICameraData | Vector3Like | ...          │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心职责

| 职责 | 说明 | 实现模块 |
|------|------|---------|
| **引擎入口** | 一站式创建、配置、运行 3D 应用 | `Engine` |
| **高级渲染** | PBR 材质、阴影、后处理、HDR | `ForwardRenderer`, `DeferredRenderer` |
| **资源加载** | glTF 2.0、OBJ、HDR、KTX2 | `GLTFLoader`, `TextureLoader` |
| **高级系统** | LOD、遮挡剔除、实例化渲染 | `LODSystem`, `CullingSystem` |
| **便捷 API** | 快速创建相机、光源、网格 | `Engine.createCamera()`, `Engine.createMesh()` |

### 1.3 与 Core 的关系

```
Engine 的职责:
✅ 封装 Core 能力，提供高层 API
✅ 扩展 Core 组件（PBRMaterial, ShadowCaster）
✅ 扩展 Core 系统（ShadowSystem, LODSystem）
✅ 提供 RHI 设备的默认创建逻辑
✅ 实现 3D 特有的加载器（glTF, HDR）

Engine 禁止:
🚫 重复实现 Core 已有功能
🚫 直接操作 RHI（应通过 Renderer 抽象）
🚫 修改 Core 组件的语义
🚫 绕过 ResourceManager 直接加载资源
```

---

## 2. 模块设计

### 2.1 目录结构 (当前实现)

```
packages/engine/src/
├── index.ts                    # 统一导出
│
├── engine/                     # 引擎入口
│   ├── engine.ts               # Engine 主类 [已实现]
│   └── engine-config.ts        # 引擎配置接口 [已实现]
│
├── renderers/                  # 渲染器
│   ├── simple-webgl-renderer.ts # SimpleWebGLRenderer [已实现] - 基于 RHI BindGroup/UBO
│   ├── shaders.ts              # 内置着色器 [已实现] - std140 Uniform Blocks
│   └── forward-renderer.ts     # ForwardRenderer (框架)
│
├── materials/                  # 材质系统
│   ├── PBR-material.ts         # PBRMaterial [已实现]
│   └── unlit-material.ts       # UnlitMaterial [已实现]
│
├── components/                 # ECS 组件
│   ├── index.ts                # 导出
│   ├── mesh-instance.ts        # MeshInstance [已实现] - 持有 GPU 缓冲区
│   └── material-instance.ts    # MaterialInstance [已实现] - 持有材质引用
│
├── primitives/                 # 内置几何体
│   ├── index.ts
│   ├── geometry-builder.ts     # GeometryBuilder [已实现]
│   ├── box-geometry.ts         # BoxGeometry [已实现]
│   ├── sphere-geometry.ts      # SphereGeometry [已实现]
│   ├── plane-geometry.ts       # PlaneGeometry [已实现]
│   └── cylinder-geometry.ts    # CylinderGeometry [已实现]
│
├── utils/                      # 工具函数
│   ├── bounding-box.ts         # BoundingBox
│   ├── environment-probe.ts    # EnvironmentProbe
│   └── frustum-culler.ts       # FrustumCuller
│
└── demo/                       # 演示 [已实现]
    ├── index.html
    ├── html/quick-start.html
    └── src/quick-start.ts      # Engine 快速入门 Demo
```

### 2.2 模块依赖关系

```
┌───────────────────────────────────────────────────────────────┐
│                         Engine 主类                           │
│  - 创建 WebGLDevice                                          │
│  - 初始化 Scene (from Core)                                  │
│  - 注册 Engine 专属 Components/Systems                        │
│  - 管理渲染循环                                               │
└───────────────────────────────────────────────────────────────┘
         │
         ├─────────────────┬─────────────────┬─────────────────┐
         ▼                 ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Renderers    │ │     Loaders     │ │     Systems     │ │   Primitives    │
│ ForwardRenderer │ │   GLTFLoader    │ │  ShadowSystem   │ │  BoxGeometry    │
│   ShadowPass    │ │   HDRLoader     │ │   LODSystem     │ │ SphereGeometry  │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │                   │
         └───────────────────┴───────────────────┴───────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────┐
                        │     @maxellabs/core      │
                        │ Scene, Renderer, World   │
                        │ ResourceManager, Systems │
                        └─────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────┐
                        │      @maxellabs/rhi      │
                        │ WebGLDevice, GLBuffer    │
                        │ GLTexture, Pipeline      │
                        └─────────────────────────┘
```

---

## 3. 核心接口定义

### 3.1 Engine 主类

```typescript
import type { IRHIDevice } from '@maxellabs/specification';
import { Scene, ResourceManager, SystemScheduler } from '@maxellabs/core';
import { WebGLDevice } from '@maxellabs/rhi';

interface EngineConfig {
  /** Canvas 元素或选择器 */
  canvas: HTMLCanvasElement | string;

  /** 渲染模式 */
  renderMode?: 'forward' | 'deferred';

  /** 抗锯齿 */
  antialias?: boolean;

  /** 阴影配置 */
  shadows?: {
    enabled: boolean;
    mapSize?: number;      // 默认 1024
    cascades?: number;     // CSM 级联数，默认 4
  };

  /** 后处理 */
  postProcessing?: {
    bloom?: boolean;
    toneMapping?: 'linear' | 'reinhard' | 'aces';
    ssao?: boolean;
  };

  /** 调试选项 */
  debug?: boolean;
}

interface IEngine {
  /** 只读属性 */
  readonly device: IRHIDevice;
  readonly scene: Scene;
  readonly renderer: ForwardRenderer;
  readonly resources: ResourceManager;

  /** 生命周期 */
  start(): void;
  stop(): void;
  dispose(): void;

  /** 便捷创建方法 */
  createCamera(config?: CameraConfig): Entity;
  createDirectionalLight(config?: DirectionalLightConfig): Entity;
  createPointLight(config?: PointLightConfig): Entity;
  createMesh(geometry: Geometry, material: Material): Entity;

  /** 资源加载 */
  loadGLTF(url: string): Promise<GLTFResult>;
  loadTexture(url: string): Promise<TextureHandle>;
  loadHDR(url: string): Promise<TextureHandle>;

  /** 帧事件 */
  onBeforeRender?: (deltaTime: number) => void;
  onAfterRender?: (deltaTime: number) => void;
}
```

### 3.2 SimpleWebGLRenderer (RHI BindGroup/UBO 实现)

> **重要变更 (2025-01-04)**: SimpleWebGLRenderer 已从原生 WebGL 调用重构为使用 RHI 抽象层。

```typescript
// 核心类型依赖
import type {
  IRHIDevice, IRHIRenderPipeline, IRHIShaderModule,
  IRHIPipelineLayout, IRHIBindGroupLayout, IRHIBindGroup,
  IRHIBuffer, IRHIRenderPass, IRHITexture
} from '@maxellabs/specification';
import { Renderer, RenderContext } from '@maxellabs/core';

interface SimpleWebGLRendererConfig extends RendererConfig {
  backgroundColor?: [number, number, number, number];
}

class SimpleWebGLRenderer extends Renderer {
  // RHI 资源 (非原生 WebGL)
  private rhiDevice: IRHIDevice;
  private renderPipeline: IRHIRenderPipeline | null;
  private vertexShader: IRHIShaderModule | null;
  private fragmentShader: IRHIShaderModule | null;

  // BindGroup 架构 (代替 pushConstants)
  private pipelineLayout: IRHIPipelineLayout | null;
  private matricesBindGroupLayout: IRHIBindGroupLayout | null;  // group 0
  private materialBindGroupLayout: IRHIBindGroupLayout | null;  // group 1
  private matricesBindGroup: IRHIBindGroup | null;
  private materialBindGroup: IRHIBindGroup | null;

  // UBO 缓冲区 (std140 布局)
  private matricesBuffer: IRHIBuffer | null;  // 256 bytes
  private materialBuffer: IRHIBuffer | null;  // 80 bytes

  // 渲染目标
  private colorTexture: IRHITexture | null;
  private depthTexture: IRHITexture | null;

  protected override render(ctx: RenderContext): void;
}
```

#### RHI 资源初始化流程

```pseudocode
FUNCTION initRHIResources():
  // 1. 创建着色器模块
  vertexShader = device.createShaderModule({
    code: BASIC_VERTEX_SHADER_300,
    language: 'glsl',
    stage: VERTEX
  })

  // 2. 创建 Uniform 缓冲区 (std140 布局)
  matricesBuffer = device.createBuffer({
    size: 256,  // 4 x mat4 = 4 x 64 bytes
    usage: UNIFORM,
    hint: 'dynamic'
  })
  materialBuffer = device.createBuffer({
    size: 80,   // vec4 + 2 floats + vec3x3 + padding
    usage: UNIFORM,
    hint: 'dynamic'
  })

  // 3. 创建 BindGroupLayout
  // CRITICAL: binding 值必须与着色器中的 UBO 绑定点匹配
  matricesBindGroupLayout = device.createBindGroupLayout([
    { binding: 0, visibility: VERTEX, buffer: { type: 'uniform' }, name: 'Matrices' }
  ])
  materialBindGroupLayout = device.createBindGroupLayout([
    { binding: 1, visibility: FRAGMENT, buffer: { type: 'uniform' }, name: 'Material' }
  ])

  // 4. 创建 PipelineLayout
  pipelineLayout = device.createPipelineLayout([
    matricesBindGroupLayout,
    materialBindGroupLayout
  ])

  // 5. 创建 BindGroup (绑定 UBO 到布局)
  matricesBindGroup = device.createBindGroup(matricesBindGroupLayout, [
    { binding: 0, resource: { buffer: matricesBuffer, offset: 0, size: 256 } }
  ])
  materialBindGroup = device.createBindGroup(materialBindGroupLayout, [
    { binding: 1, resource: { buffer: materialBuffer, offset: 0, size: 80 } }
  ])

  // 6. 创建 RenderPipeline
  renderPipeline = device.createRenderPipeline({
    vertexShader,
    fragmentShader,
    vertexLayout: STANDARD_VERTEX_LAYOUT,  // pos(3) + normal(3) + uv(2) = stride 32
    primitiveTopology: TRIANGLE_LIST,
    depthStencilState: { depthWriteEnabled: true, depthCompare: LESS },
    layout: pipelineLayout
  })
```

#### 渲染循环 (使用 BindGroup)

```pseudocode
FUNCTION render(ctx: RenderContext):
  // 1. 创建命令编码器
  encoder = device.createCommandEncoder()

  // 2. 开始渲染通道
  renderPass = encoder.beginRenderPass({
    colorAttachments: [{ view: colorView, loadOp: 'clear', clearColor: backgroundColor }],
    depthStencilAttachment: { view: depthView, depthLoadOp: 'clear', clearDepth: 1.0 }
  })

  // 3. 设置管线
  renderPass.setPipeline(renderPipeline)

  // 4. 遍历 MeshInstance + MaterialInstance 实体
  FOR EACH entity WITH (MeshInstance, MaterialInstance):
    // 4a. 更新 UBO 数据
    matricesBuffer.update(modelViewProjData)
    materialBuffer.update(pbrData)

    // 4b. 绑定 BindGroup (代替 pushConstants)
    renderPass.setBindGroup(0, matricesBindGroup)
    renderPass.setBindGroup(1, materialBindGroup)

    // 4c. 设置顶点/索引缓冲区
    renderPass.setVertexBuffer(0, meshInstance.vertexBuffer)
    IF meshInstance.indexBuffer:
      renderPass.setIndexBuffer(meshInstance.indexBuffer, UINT16)
      renderPass.drawIndexed(meshInstance.indexCount)
    ELSE:
      renderPass.draw(meshInstance.vertexCount)

  // 5. 结束并提交
  renderPass.end()
  encoder.copyTextureToCanvas({ source: colorView, destination: canvas })
  device.submit([encoder.finish()])
```

#### std140 Uniform Block 布局

```glsl
// 顶点着色器 (GLSL ES 3.00)
layout(std140) uniform Matrices {
  mat4 u_modelMatrix;      // offset 0,   size 64
  mat4 u_viewMatrix;       // offset 64,  size 64
  mat4 u_projectionMatrix; // offset 128, size 64
  mat4 u_normalMatrix;     // offset 192, size 64
};  // Total: 256 bytes

// 片段着色器 (GLSL ES 3.00)
layout(std140) uniform Material {
  vec4 u_baseColor;        // offset 0,   size 16
  float u_metallic;        // offset 16,  size 4
  float u_roughness;       // offset 20,  size 4
  vec2 _pad0;              // offset 24,  size 8  (padding)
  vec3 u_lightDirection;   // offset 32,  size 12
  float _pad1;             // offset 44,  size 4  (padding)
  vec3 u_lightColor;       // offset 48,  size 12
  float _pad2;             // offset 60,  size 4  (padding)
  vec3 u_cameraPosition;   // offset 64,  size 12
  float _pad3;             // offset 76,  size 4  (padding)
};  // Total: 80 bytes
```

**std140 布局规则要点:**
- `vec3` 必须按 16 字节对齐 (需要 padding)
- `mat4` 占用 64 字节 (4 x vec4)
- 总大小必须是 16 的倍数

### 3.3 MeshInstance 与 MaterialInstance 组件

> **设计决策**: Engine 包使用专用组件直接持有 GPU 资源，而非 Core 包的资源 ID 引用模式。

```typescript
// MeshInstance - 直接持有 GPU 缓冲区
class MeshInstance extends Component {
  vertexBuffer: IRHIBuffer | null;    // GPU 顶点缓冲区
  indexBuffer: IRHIBuffer | null;     // GPU 索引缓冲区 (可选)
  vertexCount: number;
  indexCount: number;
  primitiveType: 'triangles' | 'lines' | 'points';
  vertexLayout: VertexAttributeLayout[];
  pipeline: IRHIRenderPipeline | null;  // 缓存的渲染管线

  clone(): MeshInstance;   // 共享 GPU 资源引用
  dispose(): void;         // 销毁 GPU 资源
}

// MaterialInstance - 持有材质对象引用
class MaterialInstance extends Component {
  material: PBRMaterial | UnlitMaterial | null;
  clone(): MaterialInstance;  // 共享材质引用
}

// 标准顶点布局 (32 bytes stride)
const STANDARD_VERTEX_LAYOUT: VertexAttributeLayout[] = [
  { name: 'position', location: 0, format: 'float32x3', offset: 0 },
  { name: 'normal',   location: 1, format: 'float32x3', offset: 12 },
  { name: 'uv',       location: 2, format: 'float32x2', offset: 24 }
];
```

**与 Core MeshRef 的区别:**

| 特性 | Core MeshRef | Engine MeshInstance |
|------|-------------|---------------------|
| 资源引用 | assetId (字符串) | IRHIBuffer (GPU 资源) |
| 查找开销 | 每帧通过 ResourceManager | 直接访问 |
| 生命周期 | ResourceManager 管理 | Component dispose() |
| 适用场景 | 资源共享/延迟加载 | 即时渲染 |

### 3.4 GLTFLoader

```typescript
import { IResourceLoader, ResourceHandle } from '@maxellabs/core';
import type { ISceneData, IMeshResource, ITextureResource } from '@maxellabs/specification';

interface GLTFResult {
  /** 场景根节点 */
  scene: Entity;

  /** 所有网格资源 */
  meshes: Map<string, ResourceHandle<IMeshResource>>;

  /** 所有纹理资源 */
  textures: Map<string, ResourceHandle<ITextureResource>>;

  /** 所有材质 */
  materials: Map<string, PBRMaterial>;

  /** 动画片段 */
  animations: AnimationClip[];

  /** 场景数据（用于序列化） */
  sceneData: ISceneData;
}

class GLTFLoader implements IResourceLoader<GLTFResult> {
  constructor(resourceManager: ResourceManager);

  /** 加载 glTF/GLB 文件 */
  load(url: string): Promise<GLTFResult>;

  /** 支持的扩展 */
  readonly supportedExtensions: string[];

  /** Draco 解压器 */
  setDracoDecoder(decoder: DracoDecoder): void;

  /** KTX2 解压器 */
  setKTX2Transcoder(transcoder: KTX2Transcoder): void;
}
```

### 3.5 PBRMaterial (已实现)

```typescript
interface PBRMaterialConfig {
  baseColor?: [number, number, number, number];  // 默认 [1,1,1,1]
  metallic?: number;                              // 0-1, 默认 0
  roughness?: number;                             // 0-1, 默认 1
  normalTexture?: string;
  normalScale?: number;
  occlusionTexture?: string;
  occlusionStrength?: number;
  emissiveColor?: [number, number, number];
  emissiveIntensity?: number;
  alphaMode?: 'opaque' | 'mask' | 'blend';
  alphaCutoff?: number;
  doubleSided?: boolean;
}

class PBRMaterial extends MaterialInstance {
  constructor(device: IRHIDevice, config?: PBRMaterialConfig);

  // 属性访问器 (自动同步到 UBO)
  get/set baseColor: [number, number, number, number];
  get/set metallic: number;
  get/set roughness: number;
  // ... 其他属性

  toJSON(): PBRMaterialConfig;
  static fromJSON(device: IRHIDevice, data: PBRMaterialConfig): PBRMaterial;
  clone(): PBRMaterial;
}
```

### 3.6 Engine 便捷 API (已实现)

```typescript
class Engine {
  // === 材质创建 ===
  createPBRMaterial(config?: PBRMaterialConfig): PBRMaterial;
  createUnlitMaterial(config?: UnlitMaterialConfig): UnlitMaterial;

  // === 几何体创建 ===
  createBoxGeometry(width?: number, height?: number, depth?: number): GeometryData;
  createSphereGeometry(radius?: number): GeometryData;
  createPlaneGeometry(width?: number, height?: number, wSeg?: number, hSeg?: number): GeometryData;
  createCylinderGeometry(radiusTop?: number, radiusBottom?: number, height?: number, radialSegments?: number): GeometryData;

  // === 实体创建 (核心!) ===
  createMesh(
    geometry: GeometryData,
    material: PBRMaterial | UnlitMaterial,
    options?: {
      position?: [number, number, number];
      rotation?: [number, number, number, number];  // Quaternion
      scale?: [number, number, number];
      name?: string;
    }
  ): EntityId;

  // 内部流程:
  // 1. 构建交错顶点数据 (pos + normal + uv)
  // 2. 创建 GPU 缓冲区 (device.createBuffer)
  // 3. 添加 MeshInstance 组件
  // 4. 添加 MaterialInstance 组件
  // 5. 添加 LocalTransform + WorldTransform
  // 6. 添加 Visible 组件

  createCamera(config?: { position?, target?, fov?, near?, far?, isMain? }): EntityId;
}
```

#### createMesh 内部实现

```pseudocode
FUNCTION createMesh(geometry, material, options):
  entity = scene.createEntity(options.name ?? 'Mesh')

  // 1. 构建交错顶点数据 (Interleaved)
  vertexData = new Float32Array(vertexCount * 8)  // 8 floats per vertex
  FOR i IN 0..vertexCount:
    offset = i * 8
    vertexData[offset+0..2] = positions[i*3..i*3+2]  // position
    vertexData[offset+3..5] = normals[i*3..i*3+2]    // normal
    vertexData[offset+6..7] = uvs[i*2..i*2+1]        // uv

  // 2. 创建 GPU 缓冲区
  vertexBuffer = device.createBuffer({
    size: vertexData.byteLength,
    usage: 'vertex',
    initialData: vertexData
  })

  // 3. 创建索引缓冲区 (如果有)
  IF geometry.indices:
    indexBuffer = device.createBuffer({
      size: indices.byteLength,
      usage: 'index',
      initialData: indices
    })

  // 4. 添加 ECS 组件
  meshInstance = new MeshInstance()
  meshInstance.vertexBuffer = vertexBuffer
  meshInstance.indexBuffer = indexBuffer
  meshInstance.vertexCount = vertexCount
  meshInstance.indexCount = indexCount
  meshInstance.vertexLayout = STANDARD_VERTEX_LAYOUT
  world.addComponent(entity, MeshInstance, meshInstance)

  materialInstance = new MaterialInstance()
  materialInstance.material = material
  world.addComponent(entity, MaterialInstance, materialInstance)

  world.addComponent(entity, LocalTransform, fromPosition(options.position))
  world.addComponent(entity, WorldTransform, new WorldTransform())
  world.addComponent(entity, Visible, { value: true })

  RETURN entity
```

---

## 4. 系统执行流程

### 4.1 引擎初始化

```pseudocode
FUNCTION Engine.constructor(config: EngineConfig):
  // 1. 创建 RHI 设备
  canvas = resolveCanvas(config.canvas)
  device = new WebGLDevice(canvas, {
    antialias: config.antialias,
    powerPreference: 'high-performance'
  })

  // 2. 创建 Core 场景
  scene = new Scene(device)

  // 3. 注册 Engine 专属组件
  scene.world.registerComponent(PBRMaterialRef)
  scene.world.registerComponent(ShadowCaster)
  scene.world.registerComponent(ShadowReceiver)
  scene.world.registerComponent(LODGroup)
  scene.world.registerComponent(Environment)

  // 4. 注册 Engine 专属系统
  scene.scheduler.addSystem(createShadowSystem(), {
    stage: SystemStage.PreRender,
    priority: 100
  })
  scene.scheduler.addSystem(createLODSystem(), {
    stage: SystemStage.PostUpdate,
    priority: 50
  })
  scene.scheduler.addSystem(createCullingSystem(), {
    stage: SystemStage.PreRender,
    priority: 90
  })

  // 5. 创建渲染器
  renderer = new ForwardRenderer(device, {
    shadowPass: config.shadows?.enabled ? new ShadowPass(device) : undefined,
    postProcessPasses: buildPostProcessPasses(device, config.postProcessing)
  })

  // 6. 初始化资源管理器
  resources = scene.resourceManager
  resources.registerLoader('gltf', new GLTFLoader(resources))
  resources.registerLoader('glb', new GLTFLoader(resources))
  resources.registerLoader('hdr', new HDRLoader(resources))
  resources.registerLoader('ktx2', new KTX2Loader(resources))
```

### 4.2 渲染循环

```pseudocode
FUNCTION Engine.start():
  isRunning = true
  lastTime = performance.now()
  requestAnimationFrame(loop)

FUNCTION loop(currentTime):
  IF NOT isRunning:
    RETURN

  deltaTime = (currentTime - lastTime) / 1000
  lastTime = currentTime

  // 1. 用户回调
  IF onBeforeRender:
    onBeforeRender(deltaTime)

  // 2. 更新场景（执行所有系统）
  scene.update(deltaTime)

  // 3. 渲染
  renderContext = createRenderContext(scene, mainCamera)
  renderer.render(renderContext)

  // 4. 用户回调
  IF onAfterRender:
    onAfterRender(deltaTime)

  requestAnimationFrame(loop)
```

### 4.3 系统执行顺序

```
┌─────────────────────────────────────────────────────────────────┐
│                      帧开始 (FrameStart)                         │
├─────────────────────────────────────────────────────────────────┤
│  InteractionSystem     (Core)  - 处理输入事件                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        更新 (Update)                             │
├─────────────────────────────────────────────────────────────────┤
│  AnimationSystem       (Core)  - 更新动画时间                    │
│  CustomSystems         (User)  - 用户自定义系统                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      后更新 (PostUpdate)                         │
├─────────────────────────────────────────────────────────────────┤
│  TransformSystem       (Core)  - 计算世界矩阵                    │
│  LODSystem            (Engine) - 计算 LOD 级别                   │
│  LayoutSystem          (Core)  - 计算 UI 布局                    │
│  CameraSystem          (Core)  - 计算视图投影矩阵                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      预渲染 (PreRender)                          │
├─────────────────────────────────────────────────────────────────┤
│  CullingSystem        (Engine) - 视锥剔除                        │
│  ShadowSystem         (Engine) - 阴影贴图生成                    │
│  EnvironmentSystem    (Engine) - 环境贴图更新                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        渲染 (Render)                             │
├─────────────────────────────────────────────────────────────────┤
│  RenderSystem          (Core)  - 收集可见对象                    │
│  ForwardRenderer      (Engine) - 执行渲染管线                    │
│  PostProcessPasses    (Engine) - 后处理效果                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      帧结束 (FrameEnd)                           │
├─────────────────────────────────────────────────────────────────┤
│  资源清理、统计信息收集                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. 使用示例 (已验证)

### 5.1 Quick Start Demo (packages/engine/demo/src/quick-start.ts)

```typescript
import { Engine } from '@maxellabs/engine';

// 1. 创建引擎实例
const engine = new Engine({
  canvas: '#canvas',
  antialias: true,
  debug: true
});

// 2. 创建 PBR 材质
const redMaterial = engine.createPBRMaterial({
  baseColor: [0.8, 0.2, 0.2, 1.0],
  metallic: 0.5,
  roughness: 0.3
});

// 3. 创建几何体
const boxGeometry = engine.createBoxGeometry(1, 1, 1);

// 4. 创建 Mesh 实体 (这是关键步骤!)
// 内部会创建 MeshInstance + MaterialInstance + Transform + Visible 组件
const boxMesh = engine.createMesh(boxGeometry, redMaterial, {
  position: [0, 0, 0],
  name: 'RedBox'
});

// 5. 设置渲染回调
engine.onBeforeRender = (deltaTime) => {
  // 更新逻辑
};

// 6. 启动渲染循环
engine.start();

// 7. 清理
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    engine.stop();
    engine.dispose();
  }
});
```

### 5.2 多物体场景

```typescript
// 创建多个网格实体
const sphereMesh = engine.createMesh(
  engine.createSphereGeometry(0.5),
  engine.createUnlitMaterial({ color: [1, 1, 1, 1] }),
  { position: [2, 0, 0], name: 'WhiteSphere' }
);

const planeMesh = engine.createMesh(
  engine.createPlaneGeometry(2, 2),
  redMaterial,
  {
    position: [0, -1, 0],
    rotation: [-0.7071068, 0, 0, 0.7071068],  // -90 degrees X
    name: 'RedPlane'
  }
);

const cylinderMesh = engine.createMesh(
  engine.createCylinderGeometry(0.5, 0.5, 1, 32),
  engine.createUnlitMaterial({ color: [1, 1, 1, 1] }),
  { position: [-2, 0, 0], name: 'WhiteCylinder' }
);
```

---

## 6. 扩展指南

### 6.1 添加新的渲染通道

```typescript
import { RenderPass, RenderContext } from '@maxellabs/core';

class SSRPass implements RenderPass {
  private pipeline: WebGLRenderPipeline;
  private uniformBuffer: GLBuffer;

  constructor(device: IRHIDevice) {
    // 初始化管线和资源
  }

  render(context: RenderContext): void {
    // 1. 读取深度和法线
    // 2. 执行屏幕空间反射计算
    // 3. 混合到最终图像
  }

  dispose(): void {
    this.pipeline.destroy();
    this.uniformBuffer.destroy();
  }
}

// 添加到渲染器
renderer.addPostProcessPass(new SSRPass(device));
```

### 6.2 添加新的加载器

```typescript
import { IResourceLoader, ResourceManager } from '@maxellabs/core';

class FBXLoader implements IResourceLoader<FBXResult> {
  constructor(private resourceManager: ResourceManager) {}

  async load(url: string): Promise<FBXResult> {
    // 1. 加载 FBX 文件
    // 2. 解析几何体、骨骼、动画
    // 3. 创建 Entity 层级
    // 4. 返回结果
  }

  readonly extensions = ['.fbx'];
}

// 注册加载器
engine.resources.registerLoader('fbx', new FBXLoader(engine.resources));
```

---

## 7. 禁止事项

### 7.1 架构约束

- 🚫 **绕过 Core 直接操作 RHI** - 所有渲染必须通过 Renderer 抽象
- 🚫 **重复实现 Core 组件** - 使用 Core 的 Transform、Camera、Light
- 🚫 **硬编码渲染顺序** - 使用 SystemScheduler 的 stage/priority
- 🚫 **同步加载资源** - 所有加载必须异步，通过 ResourceManager

### 7.2 性能约束

- 🚫 **每帧创建 GPU 资源** - 预创建并缓存
- 🚫 **每帧重新编译着色器** - 使用 ShaderCache
- 🚫 **跳过剔除直接渲染** - 必须经过 CullingSystem

### 7.3 接口约束

- 🚫 **导出 RHI 内部类型** - 只导出 Engine 层接口
- 🚫 **暴露 WebGL 上下文** - 封装在 Engine 内部
- 🚫 **修改 Core 组件字段** - 只能扩展，不能修改

---

## 8. 实现状态 (2025-01-04 更新)

| 优先级 | 模块 | 状态 | 说明 |
|:------:|------|:----:|------|
| **P0** | `Engine` | **完成** | 引擎入口类，包含便捷 API |
| **P0** | `SimpleWebGLRenderer` | **完成** | 基于 RHI BindGroup/UBO 的渲染器 |
| **P0** | `PBRMaterial` | **完成** | PBR 材质 (金属度-粗糙度工作流) |
| **P0** | `UnlitMaterial` | **完成** | 无光照材质 |
| **P0** | `MeshInstance` | **完成** | GPU 网格资源组件 |
| **P0** | `MaterialInstance` | **完成** | 材质引用组件 |
| **P0** | `Primitives` | **完成** | Box/Sphere/Plane/Cylinder 几何体 |
| **P0** | `Engine Demo` | **完成** | quick-start.ts 演示 |
| **P1** | `ForwardRenderer` | 框架 | 完整的前向渲染管线 |
| **P1** | `GLTFLoader` | TODO | glTF 2.0 加载器 |
| **P1** | `ShadowPass` | TODO | 阴影渲染 |
| **P2** | `LODSystem` | TODO | LOD 系统 |
| **P2** | `CullingSystem` | TODO | 视锥剔除 |
| **P2** | `PostProcessPasses` | TODO | 后处理 |
| **P3** | `DeferredRenderer` | TODO | 延迟渲染 |
| **P3** | `HDRLoader` | TODO | HDR 加载 |

### 已完成的关键里程碑

1. **RHI 抽象层集成** - SimpleWebGLRenderer 使用 `device.createBindGroup()`, `device.createBuffer()` 等 RHI API，不再直接调用 WebGL
2. **std140 UBO 支持** - 着色器使用 `layout(std140) uniform Block { ... }` 语法
3. **ECS 组件模式** - MeshInstance + MaterialInstance 组件配合 ECS 查询
4. **便捷 API** - Engine.createMesh() 一站式创建可渲染实体

---

## 9. 相关文档

- [Core 包统一架构](./core-architecture.md) - Core 基础设施定义
- [着色器编译器](./shader-compiler.md) - ShaderCompiler 使用指南
- [资源管理](./resources.md) - ResourceManager 生命周期
- [场景系统](./scene-systems.md) - Scene 和 System 架构
- [RHI 接口规范](../reference/rhi-bible.md) - IRHIDevice 接口定义
