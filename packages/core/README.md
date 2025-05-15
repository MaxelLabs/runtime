# Maxellabs 3D Engine - Core Package (`@maxellabs/core`)

## 描述

`@maxellabs/core` 是 Maxellabs 3D Engine 的核心层。它提供了构建 3D 应用程序所需的基础架构和功能，同时保持与具体渲染 API (如 WebGL, WebGPU) 的解耦。这一层负责场景管理、对象模型、资源处理、输入、渲染流程控制等关键任务。

## 设计原则

- **API 无关性**: 核心层不直接依赖任何特定的图形 API。所有与硬件交互的操作都通过渲染硬件接口 (RHI) (`packages/rhi`) 进行抽象。
- **模块化与可扩展性**: 功能被划分为独立的模块，易于理解、维护和扩展。未来可以方便地添加新的功能模块或替换现有模块。
- **数据驱动**: 尽可能采用数据驱动的设计，例如通过配置文件或序列化数据来定义场景和资源。
- **高性能**: 在设计上兼顾性能，例如通过批处理、剔除、高效的数据结构等手段优化渲染和更新效率。

## 主要模块及功能

核心层主要由以下模块组成：

*   **Engine (`Engine.ts`)**: 引擎的入口和主控制器。
*   **Scene (`scene/`)**: 场景图管理，组织和管理游戏世界中的所有对象。
*   **GameObject & Component (`scene/`)**: 基于组件的对象模型，提供灵活的对象构建方式。
*   **Resource Management (`resource/`)**: 统一管理纹理、模型、材质、Shader 等资源。
*   **Renderer (`renderer/`)**: 抽象的渲染流程管理器，负责协调渲染命令的生成和提交。
*   **Material (`material/`)**: 定义物体的外观和光照响应。
*   **Shader (`shader/`)**: 抽象和管理着色器程序。
*   **Geometry (`geometry/`)**: 定义和管理三维几何形状。
*   **Texture (`texture/`)**: 管理纹理资源。
*   **Camera (`camera/`)**: 定义视点和投影方式。
*   **Light (`light/`)**: 定义场景中的光源。
*   **Input (`input/`)**: 处理用户输入。
*   **Serialization (`serialization/`)**: 对象和场景的序列化与反序列化。
*   **Base (`base/`)**: 包含基础工具、数据结构和事件系统。
*   **Constants & Utils (`constants.ts`, `utils.ts`)**: 全局常量和通用工具函数。

---

接下来，我们将详细介绍每个模块的功能、预期效果以及简单的使用示例。

---

### Module: Renderer (`packages/core/src/renderer/`)

**作用**:
该模块负责管理和执行场景的渲染过程。它衔接了场景数据（来自 `scene/` 模块）和底层的渲染硬件接口 (RHI)。Renderer 模块决定了物体如何以及何时被绘制，实现了诸如前向渲染、渲染队列管理、剔除、合批等核心渲染功能。

**主要组件**:

*   **`renderer.ts` (Renderer)**:
    *   **职责**: 引擎的渲染总管。初始化并管理渲染管线 (`RenderPipeline`)，在每帧驱动渲染流程。它从场景中收集需要渲染的对象，通过相机进行剔除，然后将渲染任务分发给渲染管线。
    *   **效果**: 控制整个画面的绘制逻辑。
*   **`RenderPipeline.ts`**:
    *   **职责**: 定义了渲染的抽象流程或接口。一个渲染管线由一系列有序的 `RenderPass` 组成。
    *   **效果**: 允许开发者自定义或切换不同的渲染策略（如前向渲染、延迟渲染）。
*   **`ForwardRenderPipeline.ts`**:
    *   **职责**: 前向渲染管线的具体实现。它通常会按顺序处理不透明物体、透明物体，并可能集成一些基本的光照计算。
    *   **效果**: 一种直接高效的渲染方式，适用于多数场景。
*   **`RenderPass.ts`**:
    *   **职责**: 代表渲染管线中的一个独立步骤或阶段，例如深度绘制通道 (`DepthPass`)、颜色绘制通道 (`ColorPass`)、天空盒绘制通道 (`SkyboxPass`) 或后处理通道 (`PostProcessPass`)。
    *   **效果**: 将复杂的渲染流程分解为可管理的单元。
*   **`RenderQueue.ts` / `EnhancedRenderQueue.ts`**:
    *   **职责**: 管理待渲染的元素 (`RenderElement`)。根据材质类型（不透明、透明）、渲染顺序、与相机的距离等因素对元素进行排序，以确保正确的渲染结果（例如，透明物体通常在不透明物体之后渲染）。`EnhancedRenderQueue` 可能提供更复杂的排序逻辑或过滤。
    *   **效果**: 保证物体按正确顺序绘制，处理透明和混合效果。
*   **`RenderElement.ts` / `SubRenderElement.ts`**:
    *   **职责**: 代表一个独立的绘制单元。它通常包含几何体 (`Geometry`)、材质 (`Material`)、变换矩阵 (`Transform`) 等渲染所需的信息。一个复杂模型可能会被拆分成多个 `RenderElement`（例如，按子网格或材质）。
    *   **效果**: 将场景对象转换为渲染器可以直接处理的单元。
*   **`RenderContext.ts`**:
    *   **职责**: 封装了单次渲染传递所需的上下文信息，例如当前使用的相机、场景光源、视图和投影矩阵等。它在渲染管线的各个阶段中传递。
    *   **效果**: 为渲染的各个阶段提供统一的数据访问。
*   **`CullingResults.ts`**:
    *   **职责**: 存储视锥剔除 (`Frustum Culling`) 或其他剔除算法的结果。只包含通过剔除测试，即在相机可见范围内的 `RenderElement`。
    *   **效果**: 提高渲染效率，避免渲染视口外的物体。
*   **`BatcherManager.ts`**:
    *   **职责**: 实现静态或动态合批。将具有相同材质或 Shader 的多个小型 `RenderElement` 合并成一个较大的批次进行渲染，以减少底层的 Draw Call 数量。
    *   **效果**: 显著提升渲染性能，尤其是在有大量相似小对象的场景中。
*   **`mesh.ts` (e.g., `MeshRenderer` or rendering-specific mesh logic)**:
    *   **职责**: 可能是 `MeshRenderer` 组件的实现，负责将 `GameObject` 上的网格和材质信息转换为 `RenderElement` 并提交到渲染队列。也可能包含向 RHI 提交顶点数据、索引数据等网格相关操作的逻辑。
    *   **效果**: 连接场景中的模型数据与渲染系统。
*   **`RendererType.ts`**:
    *   **职责**: 定义不同渲染器类型或渲染路径的枚举或标识。
    *   **效果**: 用于配置或识别当前使用的渲染模式。
*   **`passes/` (Directory)**:
    *   **职责**: 包含各种具体 `RenderPass` 的实现，如阴影生成通道、环境光遮蔽通道等。

**概念 Demo (伪代码)**:
```typescript
// Engine.ts (部分)
class Engine {
  scene: Scene;
  renderer: Renderer; // 来自 renderer.ts
  rhi: RHI; // 渲染硬件接口

  initialize() {
    // ...
    this.renderer = new Renderer(this.rhi);
    const forwardPipeline = new ForwardRenderPipeline(this.rhi);
    this.renderer.setRenderPipeline(forwardPipeline);
    // ...
  }

  gameLoop() {
    // ... update logic ...
    this.renderer.render(this.scene, this.scene.getMainCamera());
    // ...
  }
}

// renderer.ts (部分)
class Renderer {
  private rhi: RHI;
  private activePipeline: RenderPipeline;
  private cullingResults: CullingResults;

  constructor(rhi: RHI) {
    this.rhi = rhi;
    this.cullingResults = new CullingResults();
  }

  setRenderPipeline(pipeline: RenderPipeline) {
    this.activePipeline = pipeline;
  }

  render(scene: Scene, camera: Camera) {
    if (!this.activePipeline) return;

    const renderContext = new RenderContext();
    renderContext.setCamera(camera);
    // Populate other context data like lights from scene

    // 1. Culling
    this.cullingResults.clear();
    scene.performCulling(camera, this.cullingResults); // 假设 Scene 有此方法

    // 2. Populate RenderQueue from CullingResults
    const renderQueue = this.activePipeline.getRenderQueue(); // 或者从pipeline获取/清空队列
    renderQueue.clear();
    for (const visibleObject of this.cullingResults.getVisibleRenderers()) { // visibleRenderers 可能是 MeshRenderer[]
        const elements = visibleObject.getRenderElements(); // MeshRenderer 返回 RenderElement[]
        for (const element of elements) {
            renderQueue.addRenderElement(element);
        }
    }
    renderQueue.sort(); // Important for transparency, etc.

    // 3. Execute Render Pipeline
    this.activePipeline.render(renderContext, renderQueue);
  }
}

// ForwardRenderPipeline.ts (部分)
class ForwardRenderPipeline extends RenderPipeline {
  private opaquePass: RenderPass;
  private transparentPass: RenderPass;
  // ... other passes like skybox, post-processing

  constructor(rhi: RHI) {
    super(rhi);
    // this.opaquePass = new OpaqueRenderPass(rhi);
    // this.transparentPass = new TransparentRenderPass(rhi);
  }

  render(context: RenderContext, renderQueue: RenderQueue) {
    // Example: Simplified pass execution
    // this.opaquePass.render(context, renderQueue.getOpaqueItems());
    // this.transparentPass.render(context, renderQueue.getTransparentItems());

    // More realistically, passes would iterate over filtered elements from the queue
    // and issue draw calls via RHI.
    // For each element:
    //   material.shader.bind(context, rhi); // Setup shader and uniforms
    //   rhi.drawPrimitive(element.geometry, element.material);
  }
}
```

---

### Module: Scene (`packages/core/src/scene/`)

**作用**:
该模块提供了构建和管理 3D 世界的基础结构。核心是场景图 (Scene Graph)，一个用于组织层级关系的树状结构，其中包含了场景中的所有实体，如模型、灯光、相机等。它还支持实体-组件 (Entity-Component) 的设计模式，允许灵活地为游戏对象添加行为和数据。

**主要组件**:

*   **`scene.ts` (Scene)**:
    *   **职责**: 代表一个独立的虚拟世界或关卡。它是场景图的根容器，管理着场景中所有的游戏对象 (`GameObject`)。`Scene` 对象还负责管理场景级别的属性，如环境光、天空盒、激活的相机、物理设置等。
    *   **效果**: 封装了一个完整的可渲染和可交互的环境。
    *   **关键特性**:
        *   管理 `GameObject` 的层级结构。
        *   提供查找、添加、移除 `GameObject` 的方法。
        *   存储场景范围的设置（例如，全局光照、雾效参数）。
        *   可能包含场景级别的生命周期方法（如 `onLoad`, `onUpdate`, `onDestroy`）。
*   **`GameObject.ts` (假设存在，通常是场景的核心)**:
    *   **职责**: 场景图中的基本构建块。一个 `GameObject` 本身只是一个容器，代表场景中的一个"事物"。它的具体行为和外观由附加给它的组件 (`Component`) 决定。
    *   **效果**: 允许创建具有复杂行为和层级关系的实体。
    *   **关键特性**:
        *   拥有一个 `Transform` 组件来定义其在场景中的位置、旋转和缩放。
        *   可以作为其他 `GameObject` 的父节点或子节点，形成层级关系。
        *   可以添加、移除和获取附加的 `Component`。
*   **`Component.ts` (假设存在，组件基类)**:
    *   **职责**: 定义可附加到 `GameObject` 上的独立功能单元。例如，`MeshRenderer` (网格渲染组件)、`Light` (灯光组件)、`Camera` (相机组件)、`Collider` (碰撞体组件)、`Script` (自定义行为脚本组件) 等。
    *   **效果**: 通过组合不同的组件，可以灵活地创建出各种类型的游戏对象，促进代码复用和模块化设计。
    *   **关键特性**:
        *   每个组件依附于一个 `GameObject`。
        *   拥有生命周期方法 (如 `onAwake`, `onStart`, `onUpdate`, `onDestroy`)，由引擎在适当的时候调用。
        *   可以访问其所属的 `GameObject` 及其它组件。
*   **`Transform.ts` (通常是 `GameObject` 的内置核心组件)**:
    *   **职责**: 存储和管理 `GameObject` 的局部和世界空间位置、旋转和缩放。处理层级变换的计算。
    *   **效果**: 定义物体在 3D 空间中的姿态。
*   **`SceneManager.ts`**:
    *   **职责**: 管理游戏中的一个或多个 `Scene` 实例。负责加载、卸载、激活场景，以及在不同场景之间平滑过渡。
    *   **效果**: 控制游戏的流程和关卡切换。

**概念 Demo (伪代码)**:
```typescript
// main.ts (或者引擎初始化的地方)
const engine = new Engine();
const sceneManager = engine.getSceneManager(); // 假设 Engine 提供 SceneManager

// 创建一个新场景
const mainScene = sceneManager.createScene("MainScene");

// 创建一个 GameObject (例如一个立方体)
const cubeObject = mainScene.createGameObject("MyCube");

// 给 GameObject 添加组件
const meshRenderer = cubeObject.addComponent(MeshRenderer);
const boxGeometry = new BoxGeometry(engine.rhi); // 假设从 geometry 模块获取
const basicMaterial = new Material(engine.rhi, someShader); // 假设从 material 模块获取
meshRenderer.setGeometry(boxGeometry);
meshRenderer.setMaterial(basicMaterial);

cubeObject.getTransform().setPosition(0, 1, 0); // 设置位置

// 创建一个相机 GameObject
const cameraObject = mainScene.createGameObject("MainCamera");
const cameraComponent = cameraObject.addComponent(Camera);
cameraComponent.setFieldOfView(60);
mainScene.setActiveCamera(cameraComponent); // 设置场景的主相机
cameraObject.getTransform().lookAt(0, 0, 0); // 相机看向原点
cameraObject.getTransform().setPosition(0, 5, 10);

// 创建一个灯光 GameObject
const lightObject = mainScene.createGameObject("DirectionalLight");
const lightComponent = lightObject.addComponent(DirectionalLight);
lightComponent.setColor(1, 1, 1);
lightComponent.setIntensity(0.8);
lightObject.getTransform().setRotation(-45, 30, 0);

// 加载并激活场景 (如果场景是通过 SceneManager 创建的，可能自动激活)
// sceneManager.loadScene("MainScene");

// 游戏循环中，场景和组件的 update 会被调用
// engine.gameLoop() -> scene.update() -> gameObject.updateComponents()
```

---

### Module: Serialization (`packages/core/src/serialization/`)

**作用**:
该模块负责将引擎中的运行时对象（如场景 `Scene`、游戏对象 `GameObject`、组件 `Component`、材质 `Material` 等）转换为可存储或可传输的数据格式（通常是 JSON），以及从这些数据格式中恢复成完整的对象实例。这是实现场景保存/加载、预制件 (Prefab) 系统、编辑器数据交换等功能的关键。

**主要组件与优化方向 (`Serialization.ts`)**:

*   **核心序列化/反序列化逻辑**: 提供将 JavaScript 对象图（特别是 `GameObject` 层级和 `Component` 数据）与 JSON (或其他格式) 相互转换的能力。
*   **类型注册与处理 (Type Registry)**:
    *   **职责**: 允许引擎或用户代码注册自定义的 `Component` 类型或其他可序列化对象的构造函数/工厂方法。
    *   **优化**: 序列化时存储类型标识符，反序列化时根据标识符动态创建正确类型的实例。
    *   **效果**: 极大地增强了序列化系统的可扩展性，使其能处理任意复杂的自定义类型。
*   **资源引用管理 (Resource Referencing)**:
    *   **职责**: 处理对象间的引用，特别是对外部资源（如纹理 `Texture`、模型 `Mesh`、音频剪辑 `AudioClip`）的引用。
    *   **优化**: 通常通过资源的唯一路径 (path) 或 UUID 进行引用，而不是直接内嵌资源数据。反序列化时，与 `ResourceManager` 协作异步加载这些被引用的资源。
    *   **效果**: 避免数据冗余，实现高效的资源共享和懒加载。
*   **预制件 (Prefab) 支持**: 
    *   **职责**: 提供将配置好的 `GameObject` 层级结构（包括其所有组件和属性）序列化为"预制件数据"的能力，并能从这些数据高效地实例化出新的 `GameObject` 副本。
    *   **优化**: 实现深拷贝逻辑，确保实例化出的预制件是独立的，同时正确恢复所有组件和资源引用。
    *   **效果**: 实现可复用的游戏对象模板，加速开发流程。
*   **场景序列化/反序列化**: 
    *   **职责**: 支持将整个 `Scene` 对象（包括其层级结构、所有 `GameObject`、组件数据、场景设置如环境光等）完整地保存到文件或数据流，并能从中恢复。
    *   **优化**: `Scene` 类应提供 `serialize()` 和 `deserialize(data, context)` 方法。`deserialize` 过程应是异步的，以处理潜在的资源加载延迟。
    *   **效果**: 实现游戏关卡的保存与加载功能。
*   **异步操作**: 
    *   **职责**: 对于可能涉及大量I/O（如资源加载）或计算的反序列化过程，提供异步接口。
    *   **优化**: 使用 `Promise` 和 `async/await`，避免阻塞引擎主循环。
    *   **效果**: 提升用户体验，防止应用卡顿。
*   **版本控制与数据迁移 (Advanced)**:
    *   **职责**: 当可序列化对象的结构发生变化时（如组件属性增删改），能够兼容旧版本的序列化数据。
    *   **优化**: 序列化数据中包含版本信息，反序列化时根据版本执行相应的数据转换逻辑。

**`engine` 层如何串联 (概念 Demo)**:

```typescript
// EngineInitialization.ts (由 engine 包调用)
import { Serialization } from "@maxellabs/core/serialization";
import { Scene } from "@maxellabs/core/scene";
import { MyCustomComponent, PlayerController } from "../game/components"; // 游戏项目中定义的组件
import { MyCustomResourceLoader } from "../game/resourceLoaders"; // 游戏项目中定义的资源加载器

export function initializeSerialization(engine: Engine) {
  // 1. 注册自定义类型
  Serialization.registerType("MyCustomComponent", MyCustomComponent);
  Serialization.registerType("PlayerController", PlayerController);
  // Serialization.registerResourceLoader("myCustomFormat", MyCustomResourceLoader); // 若支持自定义资源格式

  // 2. （可选）配置序列化参数，如是否格式化JSON等
  // Serialization.config({ prettyPrint: true });
}

// GameLogic.ts (由 engine 包中的游戏逻辑调用)
import { SceneManager } from "@maxellabs/core/scene";
import { ResourceManager } from "@maxellabs/core/resource";
import { Serialization } from "@maxellabs/core/serialization";

class GameManager {
  private sceneManager: SceneManager;
  private resourceManager: ResourceManager;
  private engine: Engine;

  constructor(engine: Engine) {
    this.engine = engine;
    this.sceneManager = engine.getSceneManager();
    this.resourceManager = engine.getResourceManager();
  }

  async saveCurrentScene(path: string) {
    const activeScene = this.sceneManager.getActiveScene();
    if (activeScene) {
      try {
        const sceneData = activeScene.serialize(); // Scene 内部调用 Serialization
        // 此处可以将 sceneData (通常是JSON字符串) 保存到文件系统或网络
        await this.engine.getFileIO().writeFile(path, JSON.stringify(sceneData));
        console.log("Scene saved to: ", path);
      } catch (error) {
        console.error("Failed to save scene: ", error);
      }
    }
  }

  async loadGameScene(path: string): Promise<Scene | null> {
    try {
      const sceneFileContent = await this.engine.getFileIO().readFile(path);
      const sceneData = JSON.parse(sceneFileContent);
      // SceneManager.loadScene 内部会创建 Scene 实例并调用 scene.deserialize()
      // scene.deserialize() 会利用 Serialization.ts 和 ResourceManager 来恢复场景
      const newScene = await this.sceneManager.loadSceneFromData(sceneData);
      console.log("Scene loaded: ", newScene.name);
      return newScene;
    } catch (error) {
      console.error("Failed to load scene: ", error);
      return null;
    }
  }

  async instantiatePlayer(prefabPath: string, position: Vector3): Promise<GameObject | null> {
    try {
      // ResourceManager 负责加载预制件资源文件（内容是序列化后的GameObject数据）
      const prefabAsset = await this.resourceManager.load<PrefabAsset>(prefabPath);
      if (prefabAsset && prefabAsset.data) {
        // Serialization 模块提供实例化预制件的静态方法或通过引擎实例获取
        //  "this.engine.getSerializationContext()" 可以传递给反序列化过程，包含 RHI, ResourceManager 等依赖
        const playerObject = await Serialization.instantiatePrefab(prefabAsset.data, this.sceneManager.getActiveScene(), this.engine.getSerializationContext());
        playerObject.getTransform().setPosition(position.x, position.y, position.z);
        console.log("Player instantiated from prefab: ", prefabPath);
        return playerObject;
      }
    } catch (error) {
      console.error("Failed to instantiate prefab: ", error);
    }
    return null;
  }
}
```

---

### Module: Shader (`packages/core/src/shader/`)

**作用**:
该模块负责抽象和管理着色器程序 (Shader Programs) 及其相关数据。Shader 是在 GPU 上运行的小段代码，用于控制三维对象的渲染外观。此模块使得引擎核心层可以处理 Shader 逻辑，而无需关心底层图形 API (如 GLSL, WGSL) 的具体语法细节（具体编译和链接由 RHI 完成）。

**主要组件与优化方向**:

*   **`Shader.ts` (核心资源类 - 假设存在或需要创建)**:
    *   **职责**: 代表一个完整的着色器资源。它封装了顶点着色器 (Vertex Shader) 和片元着色器 (Fragment Shader) 的源代码（或指向源代码的路径）、定义的 Shader 属性 (Uniforms, Attributes) 的元信息、以及可用的宏定义 (Macros)。
    *   **优化**: 应由 `ResourceManager` 加载（例如从 `.shader` 文件，该文件可为 JSON 格式，描述 Shader 的各个部分和属性）。提供获取 Shader 属性列表、默认值等接口，方便材质系统和编辑器使用。
    *   **效果**: 统一管理 Shader 资源，为材质提供 Shader 定义。
*   **`ShaderData.ts`**:
    *   **职责**: 存储和管理一个 Shader 实例（通常是材质级别，但也可能用于场景或对象级别）的 Uniform 数据。它提供了在 CPU 端设置各种类型参数（如浮点数、向量、颜色、矩阵、纹理、布尔值）的 API，这些参数将在渲染时传递给 GPU 上的 Shader 程序。
    *   **优化**: 
        *   支持层级和分组 (`ShaderDataGroup.ts`)，例如：场景级 `ShaderData` (相机矩阵、时间)、光源 `ShaderData`、材质 `ShaderData` (反照率颜色、粗糙度值)、渲染器 `ShaderData` (模型矩阵)。渲染时可以组合这些 `ShaderData`。
        *   提供高效的参数设置和更新机制。
        *   直接支持设置 `Texture` 对象 (`texture.ts`)，由 RHI 处理后续的绑定。
    *   **效果**: 灵活管理 Shader 的运行时参数，解耦参数来源和 Shader 本体。
*   **`ShaderProperty.ts`**:
    *   **职责**: 代表 Shader 中一个具名的可配置属性 (通常是 Uniform)。它包含属性的名称 (如 `_Color`, `_MainTex`)、预期的数据类型 (如 `Float`, `Vector4`, `Texture2D`)，有时还包括默认值或编辑器提示信息。
    *   **优化**: `Shader.ts` 解析 `.shader` 文件时，会生成 `ShaderProperty` 列表。`ShaderData` 内部通过 `ShaderProperty` (或其名称) 来索引和存储具体的属性值。
    *   **效果**: 提供 Shader 参数的元信息，支持类型安全和编辑器集成。
*   **`ShaderMacro.ts`**:
    *   **职责**: 代表 Shader 中的一个预处理宏定义 (e.g., `#define HAS_NORMAL_MAP`, `#define SHADOW_QUALITY_HIGH`)。宏用于在 Shader 编译前条件性地修改 Shader 源代码，从而生成不同的 Shader "变体" (Variants)。
    *   **效果**: 允许用一套 Shader源码根据不同特性（如是否使用法线贴图、是否接收阴影）生成最优化的多个特定版本，减少不必要的计算和分支。
*   **`ShaderMacroCollection.ts`**:
    *   **职责**: 一个管理和组合多个 `ShaderMacro` 的集合。每个材质实例会持有一个 `ShaderMacroCollection`，根据其启用的宏来决定使用哪个 Shader 变体进行渲染。
    *   **优化**: 提供方便的 API 来启用/禁用宏，并能生成一个唯一的键或状态码，用于 RHI 层查找或编译缓存的 Shader 变体。
    *   **效果**: 高效管理材质的 Shader 编译选项。
*   **Shader 变体管理 (Variant Management)**:
    *   **职责**: 引擎需要一种机制来处理由不同宏组合产生的众多 Shader 变体。
    *   **优化**: `Shader` 对象应能结合当前的 `ShaderMacroCollection` 与 RHI 协作，请求编译或获取一个特定的 Shader GPU 程序。RHI 负责实际的编译、链接和缓存这些变体。
    *   **效果**: 避免重复编译，按需加载和使用 Shader 变体，平衡灵活性和性能。

**`engine` 层如何串联 (概念 Demo)**:

```typescript
// In some initialization code (engine or game specific)
// ResourceManager loads shader definition files (e.g., myShader.shader)
// myShader.shader (example JSON-like structure):
// {
//   "name": "MyCustomPBR",
//   "properties": [
//     { "name": "_AlbedoColor", "type": "Color", "default": [1,1,1,1] },
//     { "name": "_MainTex", "type": "Texture2D", "default": "white" },
//     { "name": "_Roughness", "type": "Float", "default": 0.5 }
//   ],
//   "macros": ["ALPHA_TEST", "NORMAL_MAP_ON"],
//   "vertexShaderPath": "./glsl/my_pbr.vert",
//   "fragmentShaderPath": "./glsl/my_pbr.frag"
// }

async function setupMaterial(engine: Engine) {
  const resourceManager = engine.getResourceManager();
  const shaderLoader = engine.getShaderLoader(); // Hypothetical loader or part of ResourceManager

  // 1. Load Shader resource
  const pbrShader = await resourceManager.load<Shader>("path/to/myPBR.shader");

  // 2. Create Material instance using the loaded Shader
  const myMaterial = new Material(pbrShader); // Material constructor uses pbrShader.properties to init its ShaderData

  // 3. Set Material properties (uses ShaderData internally)
  myMaterial.setColor("_AlbedoColor", new Color(0.8, 0.2, 0.2, 1.0));
  const diffuseTexture = await resourceManager.load<Texture>("path/to/myTexture.png");
  myMaterial.setTexture("_MainTex", diffuseTexture);
  myMaterial.setFloat("_Roughness", 0.25);

  // 4. Enable Shader macros for this material instance
  myMaterial.getMacros().enable("NORMAL_MAP_ON");
  if (useAlphaTest) {
    myMaterial.getMacros().enable("ALPHA_TEST");
  }

  // 5. Assign material to a MeshRenderer component
  // const meshRenderer = gameObject.getComponent(MeshRenderer);
  // meshRenderer.setMaterial(myMaterial);
  return myMaterial;
}

// Renderer.ts (during rendering a RenderElement)
function renderElement(element: RenderElement, context: RenderContext, rhi: RHI) {
  const material = element.getMaterial();
  const shader = material.getShader();
  const macros = material.getMacros();

  // 1. Engine/Renderer tells RHI to use a specific shader variant based on shader and macros
  const shaderProgram = rhi.getShaderProgram(shader, macros); // RHI handles compilation & caching
  rhi.bindProgram(shaderProgram);

  // 2. Engine/Renderer collects all relevant ShaderData instances
  const sceneShaderData = context.getSceneShaderData(); // e.g., Camera VP matrix
  const objectShaderData = element.getObjectShaderData(); // e.g., Model matrix
  const materialShaderData = material.getShaderData(); // Material specific uniforms

  // 3. RHI applies the uniforms from these ShaderData objects
  rhi.applyUniforms(shaderProgram, [sceneShaderData, objectShaderData, materialShaderData]);

  // 4. RHI issues the draw call
  // rhi.draw(element.getGeometry());
}
```

---

### Module: Texture (`packages/core/src/texture/`)

**作用**:
该模块负责抽象和管理各种类型的纹理资源。纹理是应用于模型表面以增加细节和真实感的图像。此模块允许引擎核心层以统一的方式处理纹理，而实际的 GPU 纹理对象创建和管理由 RHI 完成。

**主要组件与优化方向 (`texture.ts`)**:

*   **`Texture.ts` (基类)**:
    *   **职责**: 所有纹理类型的抽象基类。定义通用属性如宽度、高度、格式 (Format)、采样参数 (FilterMode, WrapMode)、Mipmap 设置等。
    *   **优化**: 提供统一的 API 来设置这些参数。当参数改变时，`Texture` 对象应通知 RHI 更新底层的 GPU 纹理状态。
    *   **效果**: 为所有纹理提供一致的接口。
*   **`Texture2D.ts` (或 `Texture` 类直接支持2D)**:
    *   **职责**: 代表标准的二维纹理，用于贴图如漫反射、法线、高光、自发光等。
    *   **优化**: 由 `ResourceManager` 加载图像文件 (PNG, JPG) 或压缩纹理文件 (KTX, ASTC, DXT) 后创建。构造时接收图像数据 (如 `HTMLImageElement`, `ImageData`, `ArrayBuffer`)，然后请求 RHI 创建并上传数据到 GPU。
    *   **效果**: 引擎中最常用的纹理类型。
*   **`TextureCubeMap.ts` (或 `Texture` 类支持立方体类型)**:
    *   **职责**: 代表立方体贴图，通常由六张独立的 2D 纹理图像组成，用于实现天空盒 (Skybox) 和基于图像的环境反射 (Image-Based Lighting)。
    *   **优化**: `ResourceManager` 可以加载特定格式的立方体贴图文件，或通过指定六张图像来创建。RHI 负责创建 GPU 立方体纹理对象。
    *   **效果**: 创建沉浸式环境和真实感反射。
*   **`RenderTexture.ts` (或 `RenderTarget.ts`)**:
    *   **职责**: 一种特殊的纹理，可以作为 GPU 的渲染目标。场景或特定对象可以被渲染到 `RenderTexture` 中，而不是直接渲染到屏幕。它通常包含一个颜色附件，也可能包含深度和/或模板附件。
    *   **优化**: 
        *   创建时需要指定尺寸和附件格式。
        *   `Camera` 组件可以将其设置为渲染目标。
        *   `Renderer` 负责协调 RHI 将渲染输出到 `RenderTexture` 的帧缓冲对象 (FBO)。
        *   一旦渲染完成，`RenderTexture` 可以像普通 `Texture2D` 一样被其他 Shader 采样。
    *   **效果**: 实现各种高级渲染技术，如阴影贴图、后处理效果 (Bloom, SSAO, DoF)、动态反射/折射、实时监控画面等。
*   **纹理参数配置**: 
    *   **职责**: 允许精细控制纹理采样行为，如过滤模式 (最近邻、线性、三线性)、环绕模式 (钳制到边缘、重复、镜像重复)、各向异性过滤级别。
    *   **优化**: `Texture` 基类提供 `setFilterMode()`, `setWrapMode()`, `setAnisotropy()` 等方法。
*   **Mipmap 生成与管理**: 
    *   **职责**: Mipmap 是一系列预先计算和优化的图像，是原始图像的较低分辨率版本，用于提高渲染性能和减少远距离对象的摩尔纹。
    *   **优化**: `Texture` 对象可以配置是否自动生成 Mipmap (`generateMipmaps: boolean`)。若启用，在纹理数据上传后，请求 RHI 生成 Mipmap 链。
*   **压缩纹理支持**: 
    *   **职责**: 支持 GPU 原生压缩纹理格式 (如 ASTC, DXT/BCn, ETC, KTX 容器)。
    *   **优化**: `ResourceManager` 加载这些格式，`Texture` 对象接收压缩数据并传递给 RHI。引擎需要检测 RHI 对特定格式的支持情况。
    *   **效果**: 大幅减少 GPU 显存占用和纹理加载时间，提升性能。

**`engine` 层如何串联 (概念 Demo)**:

```typescript
// ResourceManager.ts (由 engine 提供或核心层实现)
// async load<T extends Resource>(path: string): Promise<T>;

// MaterialSetup.ts (engine 或游戏逻辑)
async function createPBRMaterial(engine: Engine): Promise<Material> {
  const resourceManager = engine.getResourceManager();
  const pbrShader = await resourceManager.load<Shader>("shaders/pbr.shader");
  const material = new Material(pbrShader);

  // 加载 2D 纹理
  const albedoMap = await resourceManager.load<Texture2D>("textures/metal_albedo.png");
  albedoMap.setWrapMode(TextureWrapMode.Repeat);
  albedoMap.setFilterMode(TextureFilterMode.Trilinear);
  // albedoMap.setAnisotropy(engine.rhi.getMaxAnisotropy()); // RHI 应提供最大各向异性值
  material.setTexture("_AlbedoMap", albedoMap);

  const normalMap = await resourceManager.load<Texture2D>("textures/metal_normal.ktx"); // KTX 压缩纹理
  material.setTexture("_NormalMap", normalMap);

  return material;
}

// SkyboxSetup.ts (engine 或游戏逻辑)
async function setupSkybox(scene: Scene, engine: Engine) {
  const resourceManager = engine.getResourceManager();
  // TextureCubeMap 可以通过指定6张图或一个 .cubemap 文件加载
  const skyTexture = await resourceManager.load<TextureCubeMap>("textures/skyboxes/sunny_day.cubemap");
  // scene.setSkybox(skyTexture); // Scene 对象应有设置天空盒的方法
}

// ReflectionProbe.ts (高级功能, 可能在 engine 或 core 的扩展中)
class ReflectionProbe {
  private reflectionTexture: RenderTexture;
  private camera: Camera; // 用于渲染环境的内部相机
  private rhi: RHI;

  constructor(size: number, rhi: RHI) {
    this.rhi = rhi;
    this.reflectionTexture = new RenderTexture(size, size, TextureFormat.RGBA8, TextureFormat.Depth16, true /*isCube*/);
    this.reflectionTexture.name = "ReflectionCubeRT";
    // ... 创建用于渲染立方体六个面的相机 this.camera ...
  }

  async captureEnvironment(scene: Scene, position: Vector3, renderer: Renderer) {
    await this.reflectionTexture.create(this.rhi); // 确保 RenderTarget 资源已创建
    // For each face of the cubemap:
    //   this.camera.setPosition(position);
    //   this.camera.lookAt(targetForFaceN);
    //   this.camera.setRenderTarget(this.reflectionTexture, CubemapFace.PositiveX + faceIndex);
    //   renderer.render(scene, this.camera); // 渲染场景到立方体贴图的一个面
    // After all 6 faces are rendered, reflectionTexture can be used in materials.
  }

  getReflectionTexture(): RenderTexture {
    return this.reflectionTexture;
  }
}

// Main.ts (engine 驱动)
// const probe = new ReflectionProbe(256, engine.getRHI());
// await probe.captureEnvironment(myScene, probePosition, engine.getRenderer());
// pbrMaterial.setTexture("_ReflectionMap", probe.getReflectionTexture());
```
