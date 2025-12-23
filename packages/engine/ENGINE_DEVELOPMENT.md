# Engine 包开发文档

## 概述

Engine 包是 **3D 渲染引擎** 的特化实现，基于 Core 包提供的共享基础设施，专注于 3D 渲染的高级功能。

## 架构定位

```
┌─────────────────────────────────────────────────────────────┐
│                        Engine (3D 渲染特化)                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ PBRMaterial │ │ ShadowPass  │ │ glTF/FBX 加载器         │ │
│  │ PhysicalSky │ │ DeferredPass│ │ LOD/遮挡剔除           │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Core (共享基础设施)                        │
│  ┌─────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │
│  │  Scene  │ │ RenderSystem│ │ResourceMgr  │ │CameraSystem│ │
│  │  World  │ │ Components  │ │  Loaders    │ │TransformSys│ │
│  └─────────┘ └─────────────┘ └─────────────┘ └───────────┘  │
├─────────────────────────────────────────────────────────────┤
│                   RHI (渲染硬件接口)                          │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │     WebGL 2      │  │      WebGPU      │                 │
│  └──────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## Core 包已提供能力

### ✅ 已就绪（可直接使用）

| 模块 | 位置 | 说明 |
|------|------|------|
| **Scene** | `@maxellabs/core` | 场景管理，整合 World + SystemScheduler |
| **World** | `core/ecs/` | ECS 实体组件系统 |
| **Components** | `core/components/` | Transform, Camera, Light, Visual, Layout, Animation |
| **CameraSystem** | `core/systems/camera` | 视图/投影矩阵计算 |
| **RenderSystem** | `core/systems/render` | 基础渲染循环（收集可见对象） |
| **ResourceManager** | `core/resources/` | 资源加载和缓存 |
| **TransformSystem** | `core/systems/transform` | 层级变换矩阵计算 |
| **AnimationSystem** | `core/systems/animation` | 动画时间推进 |
| **LayoutSystem** | `core/systems/layout` | UI 布局计算 |

### Engine 需要扩展的能力

| 功能 | 说明 | 实现方式 |
|------|------|----------|
| **PBR 材质** | 基于物理的渲染材质 | 扩展 MaterialResource |
| **阴影系统** | 级联阴影、软阴影 | 扩展 RenderSystem |
| **延迟渲染** | G-Buffer、光照计算 | 自定义 RenderPass |
| **glTF 加载** | 3D 模型加载 | 实现 ILoader |
| **LOD 系统** | 层次细节 | 扩展 MeshRef 组件 |
| **遮挡剔除** | 视锥体剔除、遮挡查询 | 扩展 RenderSystem |

## Engine 开发指南

### 1. 创建 Engine 场景

```typescript
import { Scene, ResourceManager } from '@maxellabs/core';
import { WebGLDevice } from '@maxellabs/rhi';

// 创建 RHI 设备
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const device = new WebGLDevice(canvas);

// 创建场景（自动整合 World + SystemScheduler）
const scene = new Scene({
  name: 'MainScene',
  device
});

// 创建资源管理器
const resourceManager = new ResourceManager(device);
```

### 2. 扩展 RenderSystem 实现 PBR 渲染

```typescript
import { RenderSystem, RenderContext, Renderable } from '@maxellabs/core';

class PBRRenderSystem extends RenderSystem {
  private shadowPass: ShadowRenderPass;
  private pbrPass: PBRRenderPass;

  override onBeforeRender(ctx: RenderContext): void {
    // 渲染阴影贴图
    this.shadowPass.render(ctx);
  }

  override onRender(ctx: RenderContext, renderables: Renderable[]): void {
    // PBR 渲染
    this.pbrPass.begin(ctx);

    for (const renderable of renderables) {
      const mesh = this.resourceManager.getMesh(renderable.meshRef);
      const material = this.getMaterial(renderable.materialRef);

      this.pbrPass.draw(mesh, material, renderable.worldMatrix);
    }

    this.pbrPass.end();
  }
}
```

### 3. 注册自定义加载器

```typescript
import { ResourceManager, ILoader, MeshResource } from '@maxellabs/core';
import type { IRHIDevice } from '@maxellabs/specification';

class GLTFLoader implements ILoader<MeshResource> {
  readonly extensions = ['.gltf', '.glb'];

  async load(uri: string, device: IRHIDevice): Promise<MeshResource> {
    // 加载 glTF 文件
    const response = await fetch(uri);
    const gltf = await this.parseGLTF(response);

    // 创建 GPU 缓冲区
    const vertexBuffer = device.createBuffer({
      size: gltf.vertexData.byteLength,
      usage: 'vertex',
      data: gltf.vertexData,
    });

    const indexBuffer = device.createBuffer({
      size: gltf.indexData.byteLength,
      usage: 'index',
      data: gltf.indexData,
    });

    return {
      vertexBuffer,
      indexBuffer,
      indexCount: gltf.indexCount,
      vertexCount: gltf.vertexCount,
      primitiveType: 'triangles',
    };
  }

  dispose(resource: MeshResource): void {
    resource.vertexBuffer?.destroy();
    resource.indexBuffer?.destroy();
  }
}

// 注册加载器
resourceManager.registerLoader('mesh', new GLTFLoader());
```

### 4. 创建渲染实体

```typescript
import {
  LocalTransform, WorldTransform,
  MeshRef, MaterialRef, Visible,
  Camera, DirectionalLight
} from '@maxellabs/core';

// 创建相机
const cameraEntity = scene.createEntity('MainCamera');
scene.world.addComponent(cameraEntity, LocalTransform, LocalTransform.fromData({
  position: { x: 0, y: 5, z: 10 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
}));
scene.world.addComponent(cameraEntity, WorldTransform, new WorldTransform());
scene.world.addComponent(cameraEntity, Camera, Camera.fromData({
  projectionType: 'perspective',
  fov: Math.PI / 3,
  near: 0.1,
  far: 1000,
  isMain: true,
}));

// 创建方向光
const lightEntity = scene.createEntity('Sun');
scene.world.addComponent(lightEntity, LocalTransform, LocalTransform.fromData({
  position: { x: 0, y: 10, z: 0 },
  rotation: { x: -0.383, y: 0, z: 0, w: 0.924 },
  scale: { x: 1, y: 1, z: 1 },
}));
scene.world.addComponent(lightEntity, WorldTransform, new WorldTransform());
scene.world.addComponent(lightEntity, DirectionalLight, DirectionalLight.fromData({
  color: { r: 1, g: 1, b: 1, a: 1 },
  intensity: 1,
  castShadow: true,
}));

// 创建网格
const meshEntity = scene.createEntity('Cube');
scene.world.addComponent(meshEntity, LocalTransform, LocalTransform.fromData({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
}));
scene.world.addComponent(meshEntity, WorldTransform, new WorldTransform());
scene.world.addComponent(meshEntity, MeshRef, MeshRef.fromData({ assetId: 'cube' }));
scene.world.addComponent(meshEntity, MaterialRef, MaterialRef.fromData({ assetId: 'default' }));
scene.world.addComponent(meshEntity, Visible, new Visible());
```

### 5. 渲染循环

```typescript
// 注册 PBR 渲染系统
const pbrRenderSystem = new PBRRenderSystem();
pbrRenderSystem.setDevice(device);
scene.scheduler.addSystem({
  name: pbrRenderSystem.metadata.name,
  stage: pbrRenderSystem.metadata.stage,
  priority: pbrRenderSystem.metadata.priority,
  after: pbrRenderSystem.metadata.after,
  execute: (ctx, query) => pbrRenderSystem.execute(ctx, query),
});

// 渲染循环
let lastTime = performance.now();

function render() {
  const now = performance.now();
  const deltaTime = (now - lastTime) / 1000;
  lastTime = now;

  // 更新场景（执行所有系统）
  scene.update(deltaTime);

  requestAnimationFrame(render);
}

render();
```

## 目录结构建议

```
packages/engine/src/
├── index.ts                 # 入口导出
├── systems/
│   ├── PBRRenderSystem.ts   # PBR 渲染系统
│   ├── ShadowSystem.ts      # 阴影系统
│   └── CullingSystem.ts     # 剔除系统
├── materials/
│   ├── PBRMaterial.ts       # PBR 材质
│   ├── UnlitMaterial.ts     # 无光照材质
│   └── index.ts
├── loaders/
│   ├── GLTFLoader.ts        # glTF 加载器
│   ├── FBXLoader.ts         # FBX 加载器
│   └── index.ts
├── passes/
│   ├── ShadowPass.ts        # 阴影通道
│   ├── GBufferPass.ts       # G-Buffer 通道
│   ├── LightingPass.ts      # 光照通道
│   └── index.ts
└── utils/
    ├── Frustum.ts           # 视锥体
    └── BVH.ts               # 包围盒层次
```

## 开发优先级

| 优先级 | 功能 | 说明 |
|:------:|------|------|
| P0 | glTF 加载器 | 基础 3D 模型加载 |
| P0 | 基础 PBR 材质 | 金属度/粗糙度工作流 |
| P1 | 阴影系统 | 方向光阴影 |
| P1 | 视锥体剔除 | 基础性能优化 |
| P2 | 延迟渲染 | 多光源场景优化 |
| P2 | LOD 系统 | 远距离优化 |

## 相关文档

- [Core 架构设计](../llmdoc/architecture/core-architecture.md)
- [ECS 架构](../llmdoc/architecture/system-overview.md)
- [RHI 接口规范](../llmdoc/reference/rhi-bible.md)
