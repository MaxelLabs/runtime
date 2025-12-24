---
id: "strategy-renderer-module"
type: "strategy"
title: "Renderer Module Implementation Strategy"
description: "Strategy for implementing packages/core/src/renderer module with Renderer base class, RenderContext, and MaterialInstance"
tags: ["renderer", "architecture", "strategy", "level-2"]
context_dependency: ["arch-core-unified", "architecture-resources", "architecture-scene-systems"]
related_ids: ["arch-core-unified", "architecture-resources", "architecture-scene-systems"]
author: "Analyst (Scout)"
date: "2025-12-24"
---

# Strategy: Renderer Module Implementation

## 1. Analysis

### 1.1 Context
- **Current State**: RenderSystem 已实现基础渲染循环（packages/core/src/systems/render/index.ts），提供渲染对象收集、排序和钩子机制
- **Missing Piece**: 缺少渲染器抽象层，应用包需要继承 RenderSystem 来实现自定义渲染，耦合度较高
- **Architecture Goal**: 分离关注点 - RenderSystem 负责 ECS 数据收集，Renderer 负责 RHI 命令提交
- **Reference**: llmdoc/architecture/core-architecture.md lines 172-188 定义了 IRenderer 接口

### 1.2 Constitution (Rules of Engagement)

**来自 Librarian 的宪法规则**：

#### 从 `arch-core-unified` (Core 架构):
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

#### 从 `architecture-resources` (资源管理):
- ✅ ResourceManager 管理资源生命周期
- ✅ 资源通过 ResourceHandle 引用
- ✅ 材质资源包含 shaderId、properties、textures

#### 从 `architecture-scene-systems` (场景系统):
- ✅ RenderSystem 在 Render 阶段执行
- ✅ RenderContext 提供渲染上下文信息
- ✅ Scene 拥有 ResourceManager 实例
- ✅ 渲染流程: Scene → RenderSystem → Renderer → RHI

### 1.3 Negative Constraints

**来自 CLAUDE.local.md**:
```
🚫 NO dependencies on WebGL/WebGPU implementations (only @maxellabs/specification interfaces)
🚫 Renderer MUST provide onBeforeRender/onAfterRender extension points
🚫 All types MUST come from @maxellabs/specification when shared across packages
🚫 Resource management MUST go through ResourceManager and handles
🚫 Components MUST implement fromData() with deep copy + null checks
```

**Additional Constraints**:
- 🚫 DO NOT create global renderer singleton
- 🚫 DO NOT bypass ResourceManager for resource access
- 🚫 DO NOT mix rendering logic with ECS logic
- 🚫 DO NOT expose RHI implementation details to application packages
- 🚫 DO NOT create new GPU resources without ResourceManager

---

## 2. Assessment

<Assessment>
**Complexity:** Level 2 (Architecture/Integration)

**Rationale**:
- 涉及 4 个模块集成 (RenderSystem, Scene, ResourceManager, RHI)
- 需要清晰的接口设计和职责划分
- 不涉及复杂数学计算（Level 3）
- 需要详细的类结构和数据流设计
</Assessment>

**Key Challenges**:
1. **职责分离**: RenderSystem (ECS 数据收集) vs Renderer (RHI 命令提交)
2. **扩展性设计**: 如何让应用包方便地扩展渲染流程
3. **资源映射**: 从 MaterialResource → MaterialInstance 的转换
4. **生命周期管理**: Renderer 与 Scene 的关系

---

## 3. Architecture Overview

### 3.1 Module Structure

```
packages/core/src/renderer/
├── renderer.ts              # Renderer 基类 (实现 IRenderer)
├── render-context.ts        # 增强的 RenderContext (补充 systems/render)
├── material-instance.ts     # MaterialInstance 类
└── index.ts                 # 统一导出
```

### 3.2 Conceptual Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                        Scene                                 │
│  - 拥有 ResourceManager                                      │
│  - 拥有 SystemScheduler                                      │
│  - 调用 update() → 触发 RenderSystem                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   RenderSystem (ECS)                         │
│  - 查询可渲染实体                                            │
│  - 收集 Renderable 数据                                      │
│  - 调用 Renderer.render()                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Renderer (RHI 抽象)                          │
│  - beginFrame() / endFrame()                                 │
│  - render(scene, camera)                                     │
│  - createMaterialInstance(material)                          │
│  - onBeforeRender / onAfterRender (扩展点)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               IRHIDevice (RHI 接口)                          │
│  - createBuffer / createTexture                              │
│  - beginRenderPass / endRenderPass                           │
│  - draw / drawIndexed                                        │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Data Flow

```
1. Scene.render()
   ↓
2. SystemScheduler.update(0) → RenderSystem.execute()
   ↓
3. RenderSystem 收集 Renderables:
   - Query: [MeshRef, MaterialRef, WorldTransform, Visible]
   - 构建 Renderable[] 数组
   ↓
4. RenderSystem 调用 Renderer:
   renderer.beginFrame()
   renderer.onBeforeRender(scene)
   renderer.render(scene, camera)
   renderer.onAfterRender(scene)
   renderer.endFrame()
   ↓
5. Renderer.render():
   FOR each renderable:
     ├─ 获取 MeshResource (via ResourceManager)
     ├─ 获取 MaterialResource (via ResourceManager)
     ├─ 创建/获取 MaterialInstance
     ├─ 绑定 RHI 资源
     └─ device.draw()
```

---

## 4. Type Definitions and Interfaces

### 4.1 Renderer 基类

```typescript
// packages/core/src/renderer/renderer.ts

import type { IRHIDevice } from '@maxellabs/specification';
import type { IScene } from '../rhi/IScene';
import type { EntityId } from '../ecs';
import type { IMaterialResource } from '@maxellabs/specification';
import type { MaterialInstance } from './material-instance';
import type { RenderContext } from './render-context';

/**
 * Renderer 配置选项
 */
export interface RendererConfig {
  /** RHI 设备 */
  device: IRHIDevice;

  /** 是否启用调试模式 */
  debug?: boolean;

  /** 清屏颜色 */
  clearColor?: [number, number, number, number];

  /** 是否清除深度缓冲 */
  clearDepth?: boolean;

  /** 是否清除模板缓冲 */
  clearStencil?: boolean;
}

/**
 * Renderer 基类
 * @description 抽象渲染器，定义渲染流程框架
 *
 * @remarks
 * ## 设计原则
 * 1. **关注点分离**: Renderer 只负责 RHI 命令提交，不处理 ECS 查询
 * 2. **扩展性**: 提供 onBeforeRender/onAfterRender 钩子
 * 3. **资源抽象**: 通过 MaterialInstance 抽象材质实例化
 * 4. **类型安全**: 所有 RHI 类型来自 @maxellabs/specification
 *
 * ## 使用示例
 * ```typescript
 * class PBRRenderer extends Renderer {
 *   override onBeforeRender(ctx: RenderContext): void {
 *     // 渲染阴影贴图
 *     this.shadowPass.render(ctx);
 *   }
 *
 *   override render(ctx: RenderContext): void {
 *     // PBR 主渲染
 *     for (const renderable of ctx.renderables) {
 *       this.renderPBRObject(renderable);
 *     }
 *   }
 * }
 * ```
 */
export abstract class Renderer {
  /** RHI 设备 */
  protected device: IRHIDevice;

  /** 配置 */
  protected config: RendererConfig;

  /** MaterialInstance 缓存 */
  protected materialInstances: Map<string, MaterialInstance> = new Map();

  /** 是否在渲染中 */
  protected isRendering: boolean = false;

  constructor(config: RendererConfig) {
    this.device = config.device;
    this.config = {
      debug: false,
      clearColor: [0, 0, 0, 1],
      clearDepth: true,
      clearStencil: false,
      ...config
    };
  }

  /**
   * 开始渲染帧
   * @remarks 清空屏幕，准备渲染
   */
  beginFrame(): void {
    if (this.isRendering) {
      console.warn('[Renderer] beginFrame called while already rendering');
      return;
    }

    this.isRendering = true;

    // 清空屏幕
    const [r, g, b, a] = this.config.clearColor!;
    // device.clear({ color: [r, g, b, a], depth: true, stencil: false });
    // TODO: 实际 RHI 调用由子类实现
  }

  /**
   * 结束渲染帧
   * @remarks 提交命令，呈现画面
   */
  endFrame(): void {
    if (!this.isRendering) {
      console.warn('[Renderer] endFrame called without beginFrame');
      return;
    }

    // device.present();
    // TODO: 实际 RHI 调用由子类实现

    this.isRendering = false;
  }

  /**
   * 主渲染入口
   * @param scene 场景
   * @param camera 相机实体 ID
   *
   * @remarks
   * 此方法协调整个渲染流程：
   * 1. 调用 onBeforeRender (应用包可扩展)
   * 2. 调用子类的 render() 实现
   * 3. 调用 onAfterRender (应用包可扩展)
   */
  renderScene(scene: IScene, camera: EntityId): void {
    // 构建渲染上下文
    const ctx: RenderContext = this.createRenderContext(scene, camera);

    // 渲染前钩子
    this.onBeforeRender(ctx);

    // 主渲染
    this.render(ctx);

    // 渲染后钩子
    this.onAfterRender(ctx);
  }

  /**
   * 创建材质实例
   * @param material 材质资源
   * @returns 材质实例
   *
   * @remarks
   * 材质实例化流程：
   * 1. 检查缓存，避免重复创建
   * 2. 创建新的 MaterialInstance
   * 3. 设置材质属性和纹理绑定
   */
  createMaterialInstance(material: IMaterialResource): MaterialInstance {
    // 使用 shaderId 作为缓存键
    const cacheKey = material.shaderId;

    let instance = this.materialInstances.get(cacheKey);
    if (instance) {
      return instance;
    }

    // 创建新实例
    instance = new MaterialInstance(material, this.device);
    this.materialInstances.set(cacheKey, instance);

    return instance;
  }

  /**
   * 获取 RHI 设备
   */
  getDevice(): IRHIDevice {
    return this.device;
  }

  /**
   * 释放资源
   */
  dispose(): void {
    // 释放所有材质实例
    for (const instance of this.materialInstances.values()) {
      instance.dispose();
    }
    this.materialInstances.clear();
  }

  // ==================== 扩展点 (子类可重写) ====================

  /**
   * 创建渲染上下文
   * @param scene 场景
   * @param camera 相机实体
   * @returns 渲染上下文
   *
   * @remarks 子类可重写以添加自定义上下文数据
   */
  protected createRenderContext(scene: IScene, camera: EntityId): RenderContext {
    // 默认实现：创建基础上下文
    // 子类可扩展以添加更多数据（如阴影贴图、后处理纹理等）
    return {
      scene,
      camera,
      device: this.device,
      renderables: [], // 由 RenderSystem 填充
      viewMatrix: null,
      projectionMatrix: null,
      viewProjectionMatrix: null,
      time: performance.now() / 1000.0,
      frameCount: 0
    };
  }

  /**
   * 渲染前回调
   * @param ctx 渲染上下文
   *
   * @remarks
   * 应用包可在此处：
   * - 渲染阴影贴图
   * - 更新全局 Uniform Buffer
   * - 设置渲染状态
   */
  protected onBeforeRender(ctx: RenderContext): void {
    // 子类实现
  }

  /**
   * 主渲染回调（抽象方法）
   * @param ctx 渲染上下文
   *
   * @remarks
   * 子类必须实现此方法，执行实际渲染逻辑：
   * - 遍历 ctx.renderables
   * - 绑定材质实例
   * - 提交 draw call
   */
  protected abstract render(ctx: RenderContext): void;

  /**
   * 渲染后回调
   * @param ctx 渲染上下文
   *
   * @remarks
   * 应用包可在此处：
   * - 渲染后处理效果
   * - 渲染调试信息
   * - 提交性能数据
   */
  protected onAfterRender(ctx: RenderContext): void {
    // 子类实现
  }
}
```

### 4.2 RenderContext 增强

```typescript
// packages/core/src/renderer/render-context.ts

import type { IScene } from '../rhi/IScene';
import type { EntityId } from '../ecs';
import type { IRHIDevice } from '@maxellabs/specification';
import type { Matrix4Like } from '@maxellabs/specification';

/**
 * Renderable 对象
 * @description 包含渲染单个对象所需的所有数据
 */
export interface Renderable {
  /** 实体 ID */
  entity: EntityId;

  /** 网格资源 ID */
  meshId: string;

  /** 材质资源 ID */
  materialId: string;

  /** 世界变换矩阵 */
  worldMatrix: Matrix4Like;

  /** 渲染层级 */
  layer: number;

  /** 排序键（用于批处理优化） */
  sortKey: number;

  /** 是否可见 */
  visible: boolean;
}

/**
 * RenderContext - 渲染上下文
 * @description 传递给渲染器的完整上下文信息
 *
 * @remarks
 * ## 与 systems/render 中的 RenderContext 的关系
 * - systems/render/RenderContext: 轻量级，用于 System 内部
 * - renderer/RenderContext: 完整版，包含相机矩阵和时间信息
 * - 两者可以合并，但为了职责清晰暂时分开
 */
export interface RenderContext {
  /** 场景引用 */
  scene: IScene;

  /** 主相机实体 ID */
  camera: EntityId;

  /** RHI 设备 */
  device: IRHIDevice;

  /** 可渲染对象列表 */
  renderables: Renderable[];

  /** View 矩阵 */
  viewMatrix: Matrix4Like | null;

  /** Projection 矩阵 */
  projectionMatrix: Matrix4Like | null;

  /** ViewProjection 矩阵 */
  viewProjectionMatrix: Matrix4Like | null;

  /** 当前时间（秒） */
  time: number;

  /** 帧计数 */
  frameCount: number;

  /** 自定义数据（应用包可扩展） */
  customData?: Record<string, unknown>;
}

/**
 * 创建空的渲染上下文
 * @param scene 场景
 * @param camera 相机
 * @param device RHI 设备
 * @returns 空渲染上下文
 */
export function createEmptyRenderContext(
  scene: IScene,
  camera: EntityId,
  device: IRHIDevice
): RenderContext {
  return {
    scene,
    camera,
    device,
    renderables: [],
    viewMatrix: null,
    projectionMatrix: null,
    viewProjectionMatrix: null,
    time: 0,
    frameCount: 0
  };
}
```

### 4.3 MaterialInstance

```typescript
// packages/core/src/renderer/material-instance.ts

import type { IRHIDevice } from '@maxellabs/specification';
import type { IMaterialResource } from '@maxellabs/specification';

/**
 * MaterialInstance - 材质实例
 * @description 对 MaterialResource 的运行时实例化封装
 *
 * @remarks
 * ## 设计目标
 * 1. **实例化**: 一个材质资源可以有多个实例（不同参数）
 * 2. **参数覆盖**: 实例可以覆盖材质的默认参数
 * 3. **GPU 资源管理**: 管理 Uniform Buffer 等 GPU 资源
 * 4. **批处理优化**: 相同材质的实例可以合批渲染
 *
 * ## 使用场景
 * ```typescript
 * // 创建材质实例
 * const material = resourceManager.getMaterial(handle);
 * const instance = renderer.createMaterialInstance(material);
 *
 * // 设置实例参数（覆盖材质默认值）
 * instance.setProperty('baseColor', [1, 0, 0, 1]);
 * instance.setProperty('metallic', 0.8);
 *
 * // 绑定到渲染管线
 * instance.bind(device);
 * device.draw(...);
 * ```
 */
export class MaterialInstance {
  /** 材质资源引用 */
  private materialResource: IMaterialResource;

  /** RHI 设备 */
  private device: IRHIDevice;

  /** 实例参数（覆盖材质默认值） */
  private properties: Map<string, unknown> = new Map();

  /** 纹理绑定 */
  private textureBindings: Map<string, string> = new Map();

  /** Uniform Buffer (GPU 资源) */
  private uniformBuffer: any = null; // TODO: 使用 IRHIBuffer

  /** 是否 dirty (需要更新 GPU 数据) */
  private dirty: boolean = true;

  constructor(material: IMaterialResource, device: IRHIDevice) {
    this.materialResource = material;
    this.device = device;

    // 初始化默认属性
    for (const [key, value] of Object.entries(material.properties)) {
      this.properties.set(key, value);
    }

    // 初始化纹理绑定
    for (const [key, value] of Object.entries(material.textures)) {
      this.textureBindings.set(key, value);
    }
  }

  /**
   * 获取着色器 ID
   */
  getShaderId(): string {
    return this.materialResource.shaderId;
  }

  /**
   * 设置属性值
   * @param name 属性名
   * @param value 属性值
   */
  setProperty(name: string, value: unknown): void {
    this.properties.set(name, value);
    this.dirty = true;
  }

  /**
   * 获取属性值
   * @param name 属性名
   * @returns 属性值，未找到返回 undefined
   */
  getProperty(name: string): unknown {
    return this.properties.get(name);
  }

  /**
   * 设置纹理绑定
   * @param slot 纹理槽名称
   * @param textureUri 纹理 URI
   */
  setTexture(slot: string, textureUri: string): void {
    this.textureBindings.set(slot, textureUri);
    this.dirty = true;
  }

  /**
   * 获取纹理绑定
   * @param slot 纹理槽名称
   * @returns 纹理 URI，未找到返回 undefined
   */
  getTexture(slot: string): string | undefined {
    return this.textureBindings.get(slot);
  }

  /**
   * 绑定材质实例到渲染管线
   * @remarks
   * 此方法将材质参数上传到 GPU 并绑定纹理
   * 由 Renderer 子类在渲染循环中调用
   */
  bind(): void {
    if (this.dirty) {
      this.updateUniformBuffer();
      this.dirty = false;
    }

    // 绑定 Uniform Buffer
    // device.setUniformBuffer(this.uniformBuffer, ...);

    // 绑定纹理
    // for (const [slot, uri] of this.textureBindings) {
    //   const texture = resourceManager.getTexture(uri);
    //   device.setTexture(slot, texture);
    // }

    // TODO: 实际 RHI 调用由 Renderer 子类实现
  }

  /**
   * 更新 Uniform Buffer
   * @remarks 将 properties 打包到 GPU buffer
   */
  private updateUniformBuffer(): void {
    // TODO: 根据 shader layout 打包数据
    // const data = this.packProperties();
    // if (!this.uniformBuffer) {
    //   this.uniformBuffer = device.createBuffer({
    //     usage: 'uniform',
    //     data
    //   });
    // } else {
    //   device.updateBuffer(this.uniformBuffer, data);
    // }
  }

  /**
   * 释放 GPU 资源
   */
  dispose(): void {
    if (this.uniformBuffer) {
      // this.uniformBuffer.destroy();
      this.uniformBuffer = null;
    }

    this.properties.clear();
    this.textureBindings.clear();
  }
}
```

---

## 5. Integration with Existing Systems

### 5.1 与 RenderSystem 的集成

**现状**: `packages/core/src/systems/render/index.ts` 已实现 RenderSystem，负责：
- 查询可渲染实体
- 收集 Renderable 数据
- 调用渲染钩子

**修改策略**:
```typescript
// packages/core/src/systems/render/index.ts (修改)

import { Renderer } from '../../renderer'; // NEW

export class RenderSystem implements ISystem {
  // ...existing code...

  /** 渲染器实例 (NEW) */
  protected renderer?: Renderer;

  /**
   * 设置渲染器 (NEW)
   */
  setRenderer(renderer: Renderer): void {
    this.renderer = renderer;
  }

  execute(ctx: SystemContext, query?: Query): SystemExecutionStats | void {
    // ...existing collection logic...

    // 5. 创建渲染上下文
    const renderCtx: RenderContext = {
      systemContext: ctx,
      device: this.device,
      encoder: null,
      mainCamera: mainCamera?.entity ?? null,
      cameraMatrices: mainCamera?.matrices ?? null,
      renderables: this.renderables,
    };

    // NEW: 如果有渲染器，使用渲染器渲染
    if (this.renderer && this.device && mainCamera) {
      this.renderer.beginFrame();
      this.renderer.renderScene(ctx.world as unknown as IScene, mainCamera.entity);
      this.renderer.endFrame();
      return { entityCount: this.renderables.length, executionTimeMs: performance.now() - startTime, skipped: false };
    }

    // 6-8. 执行渲染前/主渲染/渲染后钩子 (现有逻辑保留作为 fallback)
    this.onBeforeRender(renderCtx);
    // ...
  }
}
```

### 5.2 与 Scene 的集成

**新增 API**: Scene 可以设置 Renderer

```typescript
// packages/core/src/scene/scene.ts (新增方法)

import { Renderer } from '../renderer';

export class Scene implements IScene {
  private renderer?: Renderer;

  /**
   * 设置渲染器
   * @param renderer 渲染器实例
   */
  setRenderer(renderer: Renderer): void {
    this.renderer = renderer;

    // 将 renderer 传递给 RenderSystem
    const renderSystem = this.scheduler.getSystem('RenderSystem') as RenderSystem;
    if (renderSystem) {
      renderSystem.setRenderer(renderer);
    }
  }

  /**
   * 获取渲染器
   */
  getRenderer(): Renderer | undefined {
    return this.renderer;
  }
}
```

### 5.3 与 ResourceManager 的集成

**资源访问模式**:
```typescript
// Renderer 子类中访问资源
class MyRenderer extends Renderer {
  protected render(ctx: RenderContext): void {
    for (const renderable of ctx.renderables) {
      // 1. 通过 Scene 的 ResourceManager 获取资源
      const meshResource = ctx.scene.getMesh(renderable.meshId);
      const materialResource = ctx.scene.getMaterial(renderable.materialId);

      if (!meshResource || !materialResource) continue;

      // 2. 创建材质实例
      const materialInstance = this.createMaterialInstance(materialResource);

      // 3. 绑定并渲染
      materialInstance.bind();
      this.device.draw(meshResource);
    }
  }
}
```

---

## 6. Example Usage for Application Packages

### 6.1 Engine Package - PBR Renderer

```typescript
// packages/engine/src/renderer/pbr-renderer.ts

import { Renderer, RenderContext } from '@maxellabs/core';
import { IRHIDevice } from '@maxellabs/specification';

export class PBRRenderer extends Renderer {
  private shadowPass: ShadowPass;
  private lightingPass: LightingPass;

  constructor(device: IRHIDevice) {
    super({ device, clearColor: [0.1, 0.1, 0.1, 1.0] });

    this.shadowPass = new ShadowPass(device);
    this.lightingPass = new LightingPass(device);
  }

  protected onBeforeRender(ctx: RenderContext): void {
    // 渲染阴影贴图
    this.shadowPass.render(ctx);
  }

  protected render(ctx: RenderContext): void {
    // PBR 主渲染
    this.lightingPass.begin();

    for (const renderable of ctx.renderables) {
      const mesh = ctx.scene.getMesh(renderable.meshId);
      const material = ctx.scene.getMaterial(renderable.materialId);

      if (!mesh || !material) continue;

      const instance = this.createMaterialInstance(material);
      instance.bind();

      // 设置 MVP 矩阵
      const mvp = this.computeMVP(renderable.worldMatrix, ctx);
      this.lightingPass.setMVP(mvp);

      // 绘制
      this.device.drawIndexed(mesh.indexCount);
    }

    this.lightingPass.end();
  }

  protected onAfterRender(ctx: RenderContext): void {
    // 后处理效果
    this.postProcess(ctx);
  }
}

// 使用
const renderer = new PBRRenderer(webglDevice);
scene.setRenderer(renderer);
```

### 6.2 Effects Package - Sprite Renderer

```typescript
// packages/effects/src/renderer/sprite-renderer.ts

import { Renderer, RenderContext } from '@maxellabs/core';
import { IRHIDevice } from '@maxellabs/specification';

export class SpriteRenderer extends Renderer {
  private spriteBatch: SpriteBatch;

  constructor(device: IRHIDevice) {
    super({ device, clearDepth: false, clearStencil: false });

    this.spriteBatch = new SpriteBatch(device);
  }

  protected render(ctx: RenderContext): void {
    // 精灵批渲染
    this.spriteBatch.begin(ctx.viewProjectionMatrix);

    for (const renderable of ctx.renderables) {
      const texture = ctx.scene.getTexture(renderable.materialId);
      if (!texture) continue;

      this.spriteBatch.draw(
        texture,
        renderable.worldMatrix,
        [1, 1, 1, 1] // tint color
      );
    }

    this.spriteBatch.end();
  }
}
```

---

## 7. Implementation Steps

<ExecutionPlan>
### Block 1: 基础接口和类型定义
**Priority**: P0
**Estimated Time**: 2 hours

1. 创建 `packages/core/src/renderer/render-context.ts`
   - 定义 `Renderable` 接口
   - 定义 `RenderContext` 接口
   - 实现 `createEmptyRenderContext()` 工厂函数
   - 添加 JSDoc 文档

2. 创建 `packages/core/src/renderer/material-instance.ts`
   - 实现 `MaterialInstance` 类
   - 添加属性管理方法 (setProperty/getProperty)
   - 添加纹理管理方法 (setTexture/getTexture)
   - 添加 bind() 方法框架 (TODO 标记实际 RHI 调用)
   - 实现 dispose() 方法

3. 验证点
   - ✅ 类型可以被 TypeScript 正确解析
   - ✅ 无循环依赖
   - ✅ 所有共享类型来自 @maxellabs/specification

### Block 2: Renderer 基类实现
**Priority**: P0
**Estimated Time**: 3 hours

1. 创建 `packages/core/src/renderer/renderer.ts`
   - 定义 `RendererConfig` 接口
   - 实现 `Renderer` 抽象类
   - 实现 beginFrame() / endFrame() 框架
   - 实现 renderScene() 协调逻辑
   - 实现 createMaterialInstance() 缓存逻辑
   - 定义抽象方法 render()
   - 定义扩展点 onBeforeRender/onAfterRender
   - 实现 dispose() 方法

2. 验证点
   - ✅ 抽象类可以被继承
   - ✅ 扩展点方法签名正确
   - ✅ MaterialInstance 缓存逻辑正确
   - ✅ 无内存泄漏风险

### Block 3: 与 RenderSystem 集成
**Priority**: P1
**Estimated Time**: 2 hours

1. 修改 `packages/core/src/systems/render/index.ts`
   - 添加 `renderer?: Renderer` 字段
   - 添加 `setRenderer(renderer: Renderer)` 方法
   - 在 execute() 中调用 renderer.renderScene()
   - 保留现有钩子逻辑作为 fallback

2. 验证点
   - ✅ RenderSystem 可以与 Renderer 协同工作
   - ✅ 现有渲染逻辑不受影响（向后兼容）
   - ✅ Renderer 未设置时使用 fallback

### Block 4: 与 Scene 集成
**Priority**: P1
**Estimated Time**: 1 hour

1. 修改 `packages/core/src/scene/scene.ts`
   - 添加 `renderer?: Renderer` 字段
   - 添加 `setRenderer(renderer: Renderer)` 方法
   - 添加 `getRenderer()` 方法
   - 在 setRenderer 中自动配置 RenderSystem

2. 验证点
   - ✅ Scene 可以正确设置 Renderer
   - ✅ Renderer 自动传递到 RenderSystem
   - ✅ dispose() 时正确清理 Renderer

### Block 5: 导出和文档
**Priority**: P1
**Estimated Time**: 1 hour

1. 创建 `packages/core/src/renderer/index.ts`
   - 导出 Renderer, RenderContext, MaterialInstance
   - 导出相关接口和类型

2. 更新 `packages/core/src/index.ts`
   - 添加 renderer 模块导出

3. 添加示例代码到文档

4. 验证点
   - ✅ 所有导出可以从 @maxellabs/core 访问
   - ✅ TypeScript 类型提示正确
   - ✅ JSDoc 文档完整

### Block 6: 测试覆盖
**Priority**: P2
**Estimated Time**: 3 hours

1. 创建 `packages/core/test/renderer/renderer.test.ts`
   - 测试 Renderer 生命周期 (beginFrame/endFrame)
   - 测试 MaterialInstance 缓存逻辑
   - 测试扩展点调用顺序
   - 测试 dispose() 清理

2. 创建 `packages/core/test/renderer/material-instance.test.ts`
   - 测试属性设置/获取
   - 测试纹理绑定
   - 测试 dirty 标记
   - 测试 dispose() 清理

3. 创建 `packages/core/test/renderer/integration.test.ts`
   - 测试 Renderer + RenderSystem 集成
   - 测试 Renderer + Scene 集成
   - 测试资源访问流程

4. 验证点
   - ✅ 测试覆盖率 > 80%
   - ✅ 所有边界条件覆盖
   - ✅ 集成测试通过
</ExecutionPlan>

---

## 8. Test Strategy

### 8.1 Unit Tests

**目标覆盖率**: 85%+

#### MaterialInstance Tests
```typescript
describe('MaterialInstance', () => {
  it('should create instance with default properties', () => {
    const material: IMaterialResource = {
      shaderId: 'pbr',
      properties: { baseColor: [1, 0, 0, 1] },
      textures: { diffuse: 'texture.png' }
    };

    const instance = new MaterialInstance(material, mockDevice);
    expect(instance.getProperty('baseColor')).toEqual([1, 0, 0, 1]);
  });

  it('should override properties', () => {
    const instance = new MaterialInstance(mockMaterial, mockDevice);
    instance.setProperty('baseColor', [0, 1, 0, 1]);
    expect(instance.getProperty('baseColor')).toEqual([0, 1, 0, 1]);
  });

  it('should mark dirty on property change', () => {
    const instance = new MaterialInstance(mockMaterial, mockDevice);
    instance.setProperty('metallic', 0.8);
    expect(instance['dirty']).toBe(true);
  });

  it('should dispose GPU resources', () => {
    const instance = new MaterialInstance(mockMaterial, mockDevice);
    instance.dispose();
    expect(instance['properties'].size).toBe(0);
  });
});
```

#### Renderer Tests
```typescript
describe('Renderer', () => {
  class TestRenderer extends Renderer {
    protected render(ctx: RenderContext): void {
      // Test implementation
    }
  }

  it('should call hooks in correct order', () => {
    const renderer = new TestRenderer({ device: mockDevice });
    const onBeforeRenderSpy = vi.spyOn(renderer as any, 'onBeforeRender');
    const onAfterRenderSpy = vi.spyOn(renderer as any, 'onAfterRender');

    renderer.renderScene(mockScene, mockCamera);

    expect(onBeforeRenderSpy).toHaveBeenCalledBefore(onAfterRenderSpy);
  });

  it('should cache material instances', () => {
    const renderer = new TestRenderer({ device: mockDevice });
    const instance1 = renderer.createMaterialInstance(mockMaterial);
    const instance2 = renderer.createMaterialInstance(mockMaterial);
    expect(instance1).toBe(instance2);
  });

  it('should prevent nested beginFrame calls', () => {
    const renderer = new TestRenderer({ device: mockDevice });
    const consoleSpy = vi.spyOn(console, 'warn');

    renderer.beginFrame();
    renderer.beginFrame(); // Should warn

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already rendering'));
  });
});
```

### 8.2 Integration Tests

```typescript
describe('Renderer Integration', () => {
  it('should integrate with RenderSystem', () => {
    const scene = new Scene({ device: mockDevice });
    const renderer = new TestRenderer({ device: mockDevice });
    scene.setRenderer(renderer);

    // Create renderable entity
    const entity = scene.createEntity();
    scene.world.addComponent(entity, MeshRef, { assetId: 'cube' });
    scene.world.addComponent(entity, MaterialRef, { assetId: 'pbr' });
    scene.world.addComponent(entity, WorldTransform, { /* ... */ });

    // Trigger render
    scene.render();

    // Verify renderer was called
    // (需要 spy 或 mock)
  });

  it('should access resources through Scene', () => {
    const scene = new Scene({ device: mockDevice });
    const renderer = new TestRenderer({ device: mockDevice });
    scene.setRenderer(renderer);

    // Load resources
    const meshHandle = await scene.loadMesh('cube.glb');
    const materialHandle = await scene.loadMaterial('pbr.json');

    // Renderer should be able to get resources
    const mesh = scene.getMesh(meshHandle);
    const material = scene.getMaterial(materialHandle);

    expect(mesh).toBeDefined();
    expect(material).toBeDefined();
  });
});
```

---

## 9. Compliance Verification

### 9.1 Constitution Checklist

- [ ] ✅ NO dependencies on WebGL/WebGPU implementations (只使用 @maxellabs/specification 接口)
- [ ] ✅ Renderer 提供 onBeforeRender/onAfterRender 扩展点
- [ ] ✅ 所有共享类型来自 @maxellabs/specification
- [ ] ✅ 资源管理通过 ResourceManager 和 handles
- [ ] ✅ 完整 JSDoc 文档
- [ ] ✅ 测试覆盖率 > 80%

### 9.2 Architecture Checklist

- [ ] ✅ Renderer 是抽象类，由应用包继承
- [ ] ✅ MaterialInstance 封装材质实例化逻辑
- [ ] ✅ RenderContext 提供完整上下文信息
- [ ] ✅ 与 RenderSystem 松耦合集成
- [ ] ✅ 与 Scene 的 ResourceManager 集成
- [ ] ✅ 支持 dispose() 清理资源

### 9.3 Code Quality Checklist

- [ ] ✅ 所有类有 JSDoc 文档
- [ ] ✅ 所有方法有 @param 和 @returns 注释
- [ ] ✅ 使用 @remarks 说明设计决策
- [ ] ✅ 使用 @example 提供用法示例
- [ ] ✅ 错误处理完整（console.warn）
- [ ] ✅ 无内存泄漏风险

---

## 10. Risks and Mitigations

### Risk 1: RHI 接口不完整
**风险**: @maxellabs/specification 中的 IRHIDevice 接口可能缺少某些方法

**缓解措施**:
- 在 Renderer 基类中使用 TODO 标记缺失的 RHI 调用
- 提供清晰的文档说明子类需要实现的部分
- 先实现接口设计，RHI 调用由应用包实现

### Risk 2: MaterialInstance 性能开销
**风险**: 每个 renderable 创建 MaterialInstance 可能导致性能问题

**缓解措施**:
- 使用 Map 缓存 MaterialInstance（已实现）
- 后续可优化为对象池（Object Pool）
- 提供批处理接口（未来优化）

### Risk 3: 向后兼容性
**风险**: 修改 RenderSystem 可能破坏现有代码

**缓解措施**:
- 保留现有钩子逻辑作为 fallback
- setRenderer() 是可选的，未设置时使用原逻辑
- 提供迁移指南和示例代码

### Risk 4: 类型复杂度
**风险**: RenderContext 和相关接口可能过于复杂

**缓解措施**:
- 提供 createEmptyRenderContext() 工厂函数
- 使用接口组合而非继承
- 提供完整的 TypeScript 类型提示

---

## 11. Success Criteria

### 阶段 1: 基础实现完成
- ✅ Renderer 基类可以被继承
- ✅ MaterialInstance 可以管理材质参数
- ✅ RenderContext 包含完整上下文信息
- ✅ 所有类型检查通过

### 阶段 2: 集成完成
- ✅ RenderSystem 可以使用 Renderer
- ✅ Scene 可以设置 Renderer
- ✅ 资源访问通过 ResourceManager
- ✅ 示例代码可运行

### 阶段 3: 质量保证
- ✅ 测试覆盖率 > 80%
- ✅ 所有 JSDoc 文档完整
- ✅ 无 TypeScript 错误
- ✅ 无内存泄漏

### 阶段 4: 应用包验证
- ✅ Engine 包可以实现 PBRRenderer
- ✅ Effects 包可以实现 SpriteRenderer
- ✅ 性能满足要求（60fps+）
- ✅ 应用包反馈积极

---

## 12. Related Documents

- **Ref**: `Ref: arch-core-unified` (Core 架构全景)
- **Ref**: `Ref: architecture-resources` (资源管理系统)
- **Ref**: `Ref: architecture-scene-systems` (场景系统)
- **Implementation**: `packages/core/src/systems/render/index.ts` (RenderSystem 实现)
- **Implementation**: `packages/core/src/scene/scene.ts` (Scene 实现)

---

**策略编写者**: Analyst (Scout)
**复杂度评估**: Level 2 (Architecture/Integration)
**预计实现时间**: 12 小时
**依赖前置任务**: ResourceManager ✅, RenderSystem ✅, Scene ✅
