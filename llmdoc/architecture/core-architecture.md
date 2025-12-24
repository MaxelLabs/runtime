---
id: "arch-core-unified"
type: "architecture"
title: "Core 包统一架构设计"
description: "Core 包作为共享基础设施层，统合 Engine/Effects/Charts/Design 四大类应用的核心能力定义"
tags: ["core", "architecture", "ecs", "rendering", "scene", "unified"]
context_dependency: ["arch-system-overview"]
related_ids: ["ref-rhi-interfaces", "arch-logic-systems", "ref-data-models"]
---

# Core 包统一架构设计

> **Context**: Core 是所有应用包（Engine/Effects/Charts/Design）的共享基础设施层。
> **Goal**: 定义 Core 需要实现的全部能力，避免各应用包重复建设。

## 1. 产品架构全景

```
┌─────────────────────────────────────────────────────────────────────┐
│                        应用层 (Applications)                         │
├────────────────┬────────────────┬────────────────┬──────────────────┤
│    Engine      │    Effects     │    Charts      │     Design       │
│   (3D 渲染)    │   (动效引擎)   │   (数据图表)   │   (设计工具)     │
│                │                │                │                  │
│ • PBR 材质    │ • 精灵动画    │ • 坐标系      │ • 矢量图形      │
│ • 阴影系统    │ • 粒子系统    │ • 图例组件    │ • 约束布局      │
│ • glTF 加载   │ • 文本动效    │ • 数据绑定    │ • 组件库        │
│ • 延迟渲染    │ • 过渡效果    │ • 交互事件    │ • 协作编辑      │
└───────┬────────┴───────┬────────┴───────┬────────┴────────┬─────────┘
        │                │                │                 │
        └────────────────┴────────┬───────┴─────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Core (共享基础设施)                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │     ECS     │  │ Components  │  │   Systems   │  │   Scene    │ │
│  │ World/Query │  │ Transform   │  │ Transform   │  │ SceneGraph │ │
│  │ Entity      │  │ Camera/Light│  │ Animation   │  │ Renderer   │ │
│  │ Scheduler   │  │ Visual/Layout│ │ Layout      │  │ Resources  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                      依赖: @maxellabs/specification                  │
│                      依赖: @maxellabs/math                           │
└─────────────────────────────────────────────────────────────────────┘
                                  ▲
                                  │ (接口抽象)
┌─────────────────────────────────────────────────────────────────────┐
│                       RHI (渲染硬件接口实现)                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │     WebGL 2      │  │      WebGPU      │  │   Canvas 2D      │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. 四大应用诉求分析

### 2.1 共性需求矩阵

| 能力 | Engine | Effects | Charts | Design | 放置位置 |
|------|:------:|:-------:|:------:|:------:|----------|
| ECS (World/Entity/Query) | ✅ | ✅ | ✅ | ✅ | **Core** |
| Transform 组件 | ✅ | ✅ | ✅ | ✅ | **Core** |
| Camera 组件 | ✅ | ✅ | ✅ | ✅ | **Core** |
| Light 组件 | ✅ | ⚪ | ⚪ | ⚪ | **Core** |
| Visual 组件 (MeshRef/MaterialRef) | ✅ | ✅ | ✅ | ✅ | **Core** |
| Layout 组件 (Flex/Anchor) | ⚪ | ✅ | ✅ | ✅ | **Core** |
| Animation 组件 | ✅ | ✅ | ✅ | ✅ | **Core** |
| Scene 管理 | ✅ | ✅ | ✅ | ✅ | **Core** |
| 基础 RenderSystem | ✅ | ✅ | ✅ | ✅ | **Core** |
| ResourceManager | ✅ | ✅ | ✅ | ✅ | **Core** |
| TransformSystem | ✅ | ✅ | ✅ | ✅ | **Core** |
| AnimationSystem | ✅ | ✅ | ✅ | ✅ | **Core** |
| LayoutSystem | ⚪ | ✅ | ✅ | ✅ | **Core** |
| CameraSystem | ✅ | ✅ | ✅ | ✅ | **Core** |

> ✅ = 必需, ⚪ = 可选

### 2.2 差异化需求（各应用包自行实现）

| 应用 | 特化能力 |
|------|---------|
| **Engine** | PBR 材质、阴影渲染、延迟渲染、glTF 加载、LOD、遮挡剔除 |
| **Effects** | 精灵系统、粒子发射器、轨迹渲染、文本动效、Lottie 支持 |
| **Charts** | 坐标轴、图例、Tooltip、数据绑定、交互手势、自适应布局 |
| **Design** | 矢量图形、布尔运算、约束系统、组件实例、协作同步 |

## 3. Core 模块详细设计

### 3.1 目录结构

```
packages/core/src/
├── base/                      # 基础类
│   └── refer-resource.ts      # 引用计数资源基类
│
├── ecs/                       # ECS 核心
│   ├── world.ts               # 世界容器
│   ├── entity.ts              # 实体管理
│   ├── query.ts               # 组件查询
│   └── system-scheduler.ts    # 系统调度器
│
├── components/                # 数据组件
│   ├── base/                  # Component 基类
│   ├── transform/             # local-transform, world-transform, parent, children
│   ├── camera/                # camera, camera-target
│   ├── light/                 # directional-light, point-light, spot-light, ambient-light
│   ├── visual/                # mesh-ref, material-ref, texture-ref, color, visible
│   ├── layout/                # anchor, flex-container, flex-item, layout-result
│   ├── animation/             # animation-state, tween-state, timeline
│   ├── data/                  # name, tag, metadata
│   └── physics/               # velocity, acceleration (可选)
│
├── systems/                   # 逻辑系统
│   ├── types.ts               # ISystem, SystemMetadata
│   ├── transform/             # transform-system (层级矩阵)
│   ├── animation/             # animation-system (时间/缓动)
│   ├── layout/                # layout-system (Flex/Anchor)
│   ├── camera/                # 🆕 camera-system (View/Projection)
│   └── render/                # 🆕 render-system (基础渲染循环)
│
├── scene/                     # 🆕 场景管理
│   ├── scene.ts               # 场景类
│   ├── scene-graph.ts         # 场景图遍历
│   └── render-queue.ts        # 渲染队列
│
├── resources/                 # 🆕 资源管理
│   ├── resource-manager.ts    # 资源管理器
│   ├── resource-handle.ts     # 资源句柄
│   └── loaders/               # 加载器接口
│       ├── Iloader.ts
│       ├── mesh-loader.ts
│       └── texture-loader.ts
│
├── renderer/                  # 🆕 渲染器抽象
│   ├── renderer.ts            # 渲染器基类
│   ├── render-context.ts      # 渲染上下文
│   └── material-instance.ts   # 材质实例
│
└── index.ts                   # 统一导出
```

### 3.2 核心接口定义

#### Scene 接口

```typescript
import type { IRHIDevice } from '@maxellabs/specification';

interface IScene {
  readonly world: World;
  readonly device: IRHIDevice;  // 注入的 RHI 实现

  // 实体创建
  createEntity(name?: string): Entity;
  destroyEntity(entity: Entity): void;

  // 查询
  query(descriptor: QueryDescriptor): Query;

  // 渲染
  render(): void;

  // 生命周期
  update(deltaTime: number): void;
  dispose(): void;
}
```

#### Renderer 接口

```typescript
interface IRenderer {
  readonly device: IRHIDevice;

  // 渲染流程
  beginFrame(): void;
  render(scene: IScene, camera: Entity): void;
  endFrame(): void;

  // 资源
  createMaterialInstance(material: IMaterial): MaterialInstance;

  // 扩展点（供应用包重写）
  onBeforeRender?(scene: IScene): void;
  onAfterRender?(scene: IScene): void;
}
```

#### ResourceManager 接口

```typescript
interface IResourceManager {
  // 加载
  loadMesh(uri: string): Promise<MeshHandle>;
  loadTexture(uri: string): Promise<TextureHandle>;
  loadMaterial(uri: string): Promise<MaterialHandle>;

  // 获取
  getMesh(id: string): MeshHandle | undefined;
  getTexture(id: string): TextureHandle | undefined;

  // 释放
  release(handle: ResourceHandle): void;
  releaseAll(): void;

  // 注册自定义加载器
  registerLoader<T>(type: string, loader: ILoader<T>): void;
}
```

### 3.3 System 执行流程

```pseudocode
FUNCTION Scene.update(deltaTime):
  // Stage 1: FrameStart
  InteractionSystem.execute()  // 处理输入事件

  // Stage 2: Update
  AnimationSystem.execute()    // 更新动画时间
  CustomSystems.execute()      // 用户自定义系统

  // Stage 3: PostUpdate
  TransformSystem.execute()    // 计算世界矩阵
  LayoutSystem.execute()       // 计算布局
  CameraSystem.execute()       // 计算视图投影矩阵

  // Stage 4: Render
  RenderSystem.execute()       // 收集可见对象、提交渲染

FUNCTION RenderSystem.execute(scene, camera):
  // 1. 收集相机数据
  viewMatrix = camera.viewMatrix
  projMatrix = camera.projectionMatrix

  // 2. 可见性剔除
  visibleEntities = cull(scene.renderables, camera.frustum)

  // 3. 排序
  sortedEntities = sort(visibleEntities, sortKey)

  // 4. 提交渲染
  FOR each entity IN sortedEntities:
    mesh = getMesh(entity)
    material = getMaterial(entity)
    transform = getWorldTransform(entity)

    renderPass.draw(mesh, material, transform)
```

## 4. 各应用包集成方式

### 4.1 Engine (3D 渲染引擎)

```typescript
import { Scene, Renderer, ResourceManager } from '@maxellabs/core';
import { WebGLDevice } from '@maxellabs/rhi';

// 1. 创建 RHI 设备
const device = new WebGLDevice(canvas);

// 2. 创建场景（注入设备）
const scene = new Scene(device);

// 3. 扩展渲染器（添加 PBR、阴影）
class Engine3DRenderer extends Renderer {
  private shadowPass: ShadowPass;

  override onBeforeRender(scene: IScene) {
    this.shadowPass.render(scene);  // 阴影预渲染
  }
}

// 4. 使用
const renderer = new Engine3DRenderer(device);
renderer.render(scene, mainCamera);
```

### 4.2 Effects (动效引擎)

```typescript
import { Scene, Renderer } from '@maxellabs/core';

// 扩展组件
class SpriteComponent extends Component { ... }
class ParticleEmitter extends Component { ... }

// 扩展系统
class SpriteSystem implements ISystem { ... }
class ParticleSystem implements ISystem { ... }

// 使用
scene.world.registerComponent(SpriteComponent);
scene.scheduler.addSystem(new SpriteSystem());
```

### 4.3 Charts (图表引擎)

```typescript
import { Scene, LayoutSystem } from '@maxellabs/core';

// 扩展组件
class AxisComponent extends Component { ... }
class DataBindingComponent extends Component { ... }

// 扩展系统
class AxisSystem implements ISystem { ... }
class DataBindingSystem implements ISystem { ... }

// 使用 Core 的 Layout 能力
const chartContainer = scene.createEntity();
scene.world.addComponent(chartContainer, FlexContainer, {
  direction: 'column',
  justifyContent: 'space-between',
});
```

### 4.4 Design (设计工具)

```typescript
import { Scene, LayoutSystem, InteractionSystem } from '@maxellabs/core';

// 扩展组件
class VectorPathComponent extends Component { ... }
class ConstraintComponent extends Component { ... }

// 扩展系统
class VectorRenderSystem implements ISystem { ... }
class ConstraintSolverSystem implements ISystem { ... }

// 使用 Core 的约束布局
scene.world.addComponent(element, Anchor, {
  minX: 0, maxX: 1,  // 水平拉伸
  minY: 0.5, maxY: 0.5,  // 垂直居中
});
```

## 5. 依赖关系

```
@maxellabs/specification (纯接口定义)
        ↑
        │ IRHIDevice, IRHIBuffer, IRHITexture...
        │
@maxellabs/core (共享基础设施)
        ↑
        │ Scene, Renderer, ResourceManager, Components, Systems
        │
        ├────────────────┬────────────────┬────────────────┐
        │                │                │                │
@maxellabs/engine  @maxellabs/effects  @maxellabs/charts  @maxellabs/design
        │                │                │                │
        └────────────────┴────────┬───────┴────────────────┘
                                  │
                                  ▼ (运行时注入)
                         @maxellabs/rhi (实现)
```

## 6. 禁止事项

### 6.1 Core 包禁止

- 🚫 **依赖具体 RHI 实现** - 只能依赖 `@maxellabs/specification` 中的接口
- 🚫 **包含业务逻辑** - Core 只提供基础设施，业务逻辑在应用包
- 🚫 **硬编码渲染流程** - 必须提供扩展点供应用包自定义

### 6.2 应用包禁止

- 🚫 **重复实现 Core 功能** - 必须复用 Core 的 Scene/Renderer/ResourceManager
- 🚫 **直接操作 RHI** - 应通过 Core 的 Renderer 抽象
- 🚫 **修改 Core 组件语义** - 只能扩展，不能修改

## 7. 实现优先级

| 优先级 | 模块 | 说明 |
|:------:|------|------|
| P0 | Scene | 场景容器，整合 World 和 RHI Device |
| P0 | CameraSystem | 视图投影矩阵计算 |
| P0 | RenderSystem | 基础渲染循环 |
| P1 | ResourceManager | 资源加载和管理 |
| P1 | MaterialInstance | 材质实例化 |
| P2 | RenderQueue | 渲染排序 |
| P2 | Culling | 可见性剔除 |

## 8. 相关文档

- [ECS 架构](./system-overview.md)
- [Logic Systems](./logic-systems.md)
- [RHI 接口规范](../reference/rhi-bible.md)
- [数据模型](../reference/data-models.md)
