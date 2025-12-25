---
id: "arch-engine-package"
type: "architecture"
title: "Engine 包架构设计"
description: "Engine 包作为 3D 渲染引擎的顶层封装，整合 Core 基础设施和 RHI 实现，提供开箱即用的 3D 应用开发能力"
tags: ["engine", "architecture", "3d", "rendering", "pbr", "scene", "glTF"]
context_dependency: ["arch-core-unified", "architecture-shader-compiler", "architecture-resources"]
related_ids: ["ref-rhi-interfaces", "arch-logic-systems", "architecture-scene-systems"]
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

### 2.1 目录结构

```
packages/engine/src/
├── index.ts                    # 统一导出
│
├── engine/                     # 引擎入口
│   ├── Engine.ts               # Engine 主类
│   ├── EngineConfig.ts         # 引擎配置接口
│   └── EngineLoop.ts           # 主循环管理
│
├── renderers/                  # 渲染器扩展
│   ├── ForwardRenderer.ts      # 前向渲染器
│   ├── DeferredRenderer.ts     # 延迟渲染器（可选）
│   ├── ShadowPass.ts           # 阴影渲染通道
│   ├── PostProcessPass.ts      # 后处理通道
│   └── passes/                 # 渲染通道集合
│       ├── BloomPass.ts
│       ├── ToneMappingPass.ts
│       └── SSAOPass.ts
│
├── loaders/                    # 资源加载器
│   ├── GLTFLoader.ts           # glTF 2.0 加载器
│   ├── OBJLoader.ts            # OBJ 加载器
│   ├── HDRLoader.ts            # HDR 环境贴图加载器
│   ├── KTX2Loader.ts           # KTX2 压缩纹理加载器
│   └── DracoDecoder.ts         # Draco 网格解压
│
├── materials/                  # 材质系统
│   ├── PBRMaterial.ts          # PBR 材质
│   ├── UnlitMaterial.ts        # 无光照材质
│   ├── StandardMaterial.ts     # 标准材质（简化 PBR）
│   └── shaders/                # 内置着色器
│       ├── pbr.vert.glsl
│       ├── pbr.frag.glsl
│       ├── shadow.vert.glsl
│       └── shadow.frag.glsl
│
├── systems/                    # 高级系统
│   ├── ShadowSystem.ts         # 阴影映射系统
│   ├── LODSystem.ts            # 层次细节系统
│   ├── CullingSystem.ts        # 视锥剔除系统
│   ├── InstancingSystem.ts     # GPU 实例化系统
│   └── EnvironmentSystem.ts    # 环境光照系统
│
├── components/                 # 扩展组件
│   ├── PBRMaterialRef.ts       # PBR 材质引用组件
│   ├── ShadowCaster.ts         # 阴影投射组件
│   ├── ShadowReceiver.ts       # 阴影接收组件
│   ├── LODGroup.ts             # LOD 组组件
│   └── Environment.ts          # 环境组件（IBL）
│
├── primitives/                 # 内置几何体
│   ├── BoxGeometry.ts
│   ├── SphereGeometry.ts
│   ├── PlaneGeometry.ts
│   ├── CylinderGeometry.ts
│   └── GeometryBuilder.ts      # 几何体构建器
│
└── utils/                      # 工具函数
    ├── EnvironmentProbe.ts     # 环境探针
    ├── BoundingBox.ts          # 包围盒计算
    └── FrustumCuller.ts        # 视锥剔除器
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

### 3.2 ForwardRenderer

```typescript
import { Renderer, RenderContext } from '@maxellabs/core';

interface ForwardRendererConfig {
  /** 清屏颜色 */
  clearColor?: [number, number, number, number];

  /** 启用 HDR */
  hdr?: boolean;

  /** 阴影通道 */
  shadowPass?: ShadowPass;

  /** 后处理通道 */
  postProcessPasses?: PostProcessPass[];
}

class ForwardRenderer extends Renderer {
  private shadowPass?: ShadowPass;
  private postProcessPasses: PostProcessPass[];

  constructor(device: IRHIDevice, config?: ForwardRendererConfig);

  /** 重写渲染流程 */
  override render(context: RenderContext): void {
    // 1. 阴影预渲染（如果启用）
    if (this.shadowPass) {
      this.shadowPass.render(context);
    }

    // 2. 主渲染通道
    this.renderMainPass(context);

    // 3. 后处理
    for (const pass of this.postProcessPasses) {
      pass.render(context);
    }
  }

  /** 扩展点 */
  protected onBeforeRender?(context: RenderContext): void;
  protected onAfterRender?(context: RenderContext): void;
}
```

### 3.3 GLTFLoader

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

### 3.4 PBRMaterial

```typescript
import { MaterialInstance } from '@maxellabs/core';
import type { MaterialProperties } from '@maxellabs/specification';

interface PBRMaterialConfig {
  /** 基础颜色 */
  baseColor?: [number, number, number, number];
  baseColorTexture?: TextureHandle;

  /** 金属度-粗糙度 */
  metallic?: number;          // 0-1
  roughness?: number;         // 0-1
  metallicRoughnessTexture?: TextureHandle;

  /** 法线 */
  normalTexture?: TextureHandle;
  normalScale?: number;

  /** 遮挡 */
  occlusionTexture?: TextureHandle;
  occlusionStrength?: number;

  /** 自发光 */
  emissiveColor?: [number, number, number];
  emissiveTexture?: TextureHandle;
  emissiveIntensity?: number;

  /** 透明度 */
  alphaMode?: 'opaque' | 'mask' | 'blend';
  alphaCutoff?: number;

  /** 双面渲染 */
  doubleSided?: boolean;
}

class PBRMaterial extends MaterialInstance {
  constructor(device: IRHIDevice, config?: PBRMaterialConfig);

  /** 属性访问器 */
  get baseColor(): [number, number, number, number];
  set baseColor(value: [number, number, number, number]);

  get metallic(): number;
  set metallic(value: number);

  get roughness(): number;
  set roughness(value: number);

  /** 序列化 */
  toJSON(): MaterialProperties;
  static fromJSON(device: IRHIDevice, data: MaterialProperties): PBRMaterial;
}
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

## 5. 使用示例

### 5.1 基础场景

```typescript
import { Engine } from '@maxellabs/engine';

// 创建引擎
const engine = new Engine({
  canvas: '#canvas',
  antialias: true,
  shadows: { enabled: true },
  postProcessing: { toneMapping: 'aces' }
});

// 创建相机
const camera = engine.createCamera({
  position: [0, 2, 5],
  target: [0, 0, 0],
  fov: 60
});

// 创建光源
const sun = engine.createDirectionalLight({
  direction: [-1, -1, -1],
  color: [1, 1, 1],
  intensity: 1.0,
  castShadow: true
});

// 创建地面
const ground = engine.createMesh(
  new PlaneGeometry(10, 10),
  new PBRMaterial(engine.device, {
    baseColor: [0.2, 0.2, 0.2, 1],
    roughness: 0.8
  })
);

// 启动渲染循环
engine.start();
```

### 5.2 加载 glTF 模型

```typescript
import { Engine } from '@maxellabs/engine';

const engine = new Engine({ canvas: '#canvas' });

// 加载模型
const result = await engine.loadGLTF('/models/robot.glb');

// 访问场景根节点
const robot = result.scene;

// 播放动画
if (result.animations.length > 0) {
  const animator = engine.scene.world.getComponent(robot, AnimationState);
  animator.play(result.animations[0]);
}

// 设置用户交互
engine.onBeforeRender = (deltaTime) => {
  // 旋转模型
  const transform = engine.scene.world.getComponent(robot, LocalTransform);
  transform.rotation.y += deltaTime * 0.5;
};

engine.start();
```

### 5.3 PBR 材质配置

```typescript
import { Engine, PBRMaterial } from '@maxellabs/engine';

const engine = new Engine({ canvas: '#canvas' });

// 加载纹理
const baseColorTex = await engine.loadTexture('/textures/metal_basecolor.png');
const normalTex = await engine.loadTexture('/textures/metal_normal.png');
const mrTex = await engine.loadTexture('/textures/metal_metallic_roughness.png');

// 创建材质
const metalMaterial = new PBRMaterial(engine.device, {
  baseColorTexture: baseColorTex,
  normalTexture: normalTex,
  metallicRoughnessTexture: mrTex,
  metallic: 1.0,
  roughness: 0.3
});

// 应用到网格
const sphere = engine.createMesh(
  new SphereGeometry(1, 32, 32),
  metalMaterial
);
```

### 5.4 自定义系统

```typescript
import { Engine } from '@maxellabs/engine';
import { System, SystemStage, Query } from '@maxellabs/core';

// 定义自定义组件
class RotateComponent extends Component {
  speed: number = 1.0;
  axis: [number, number, number] = [0, 1, 0];
}

// 定义自定义系统
const createRotateSystem = () => ({
  name: 'RotateSystem',
  stage: SystemStage.Update,
  priority: 10,

  execute(context) {
    const query = context.world.query({
      all: [LocalTransform, RotateComponent]
    });

    query.forEach((entity) => {
      const transform = context.world.getComponent(entity, LocalTransform);
      const rotate = context.world.getComponent(entity, RotateComponent);

      // 应用旋转
      const angle = rotate.speed * context.deltaTime;
      transform.rotateOnAxis(rotate.axis, angle);
    });
  }
});

// 注册并使用
const engine = new Engine({ canvas: '#canvas' });
engine.scene.world.registerComponent(RotateComponent);
engine.scene.scheduler.addSystem(createRotateSystem());

// 创建旋转的立方体
const cube = engine.createMesh(new BoxGeometry(1, 1, 1), material);
engine.scene.world.addComponent(cube, RotateComponent, { speed: 2.0 });
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

## 8. 实现优先级

| 优先级 | 模块 | 说明 | 依赖 |
|:------:|------|------|------|
| **P0** | `Engine` | 引擎入口类 | Core.Scene, RHI.WebGLDevice |
| **P0** | `ForwardRenderer` | 前向渲染器 | Core.Renderer |
| **P0** | `PBRMaterial` | PBR 材质 | Core.MaterialInstance |
| **P1** | `GLTFLoader` | glTF 加载器 | Core.ResourceManager |
| **P1** | `ShadowPass` | 阴影渲染 | ForwardRenderer |
| **P1** | `Primitives` | 内置几何体 | - |
| **P2** | `LODSystem` | LOD 系统 | Core.System |
| **P2** | `CullingSystem` | 视锥剔除 | Core.System |
| **P2** | `PostProcessPasses` | 后处理 | ForwardRenderer |
| **P3** | `DeferredRenderer` | 延迟渲染 | Core.Renderer |
| **P3** | `HDRLoader` | HDR 加载 | Core.ResourceManager |

---

## 9. 相关文档

- [Core 包统一架构](./core-architecture.md) - Core 基础设施定义
- [着色器编译器](./shader-compiler.md) - ShaderCompiler 使用指南
- [资源管理](./resources.md) - ResourceManager 生命周期
- [场景系统](./scene-systems.md) - Scene 和 System 架构
- [RHI 接口规范](../reference/rhi-bible.md) - IRHIDevice 接口定义
