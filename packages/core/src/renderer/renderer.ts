/**
 * Renderer - Abstract Base Class
 * 渲染器抽象基类
 *
 * @packageDocumentation
 *
 * @remarks
 * ## Design Principles
 * 1. **Separation of Concerns**: Renderer handles RHI command submission, not ECS queries
 * 2. **Extensibility**: Provides onBeforeRender/onAfterRender hooks
 * 3. **Resource Abstraction**: MaterialInstance abstracts material instantiation
 * 4. **Type Safety**: All RHI types from @maxellabs/specification
 *
 * ## Architecture
 * ```
 * Scene → RenderSystem (ECS data collection)
 *      → Renderer (RHI command submission)
 *           → IRHIDevice (Platform abstraction)
 * ```
 *
 * ## Usage Example
 * ```typescript
 * class PBRRenderer extends Renderer {
 *   override onBeforeRender(ctx: RenderContext): void {
 *     // Render shadow maps
 *     this.shadowPass.render(ctx);
 *   }
 *
 *   override render(ctx: RenderContext): void {
 *     // PBR main rendering
 *     for (const renderable of ctx.renderables) {
 *       this.renderPBRObject(renderable);
 *     }
 *   }
 * }
 * ```
 */

import type { IRHIDevice } from '@maxellabs/specification';
import type { IScene } from '../rhi/IScene';
import type { EntityId } from '../ecs';
import type { IMaterialResource, Matrix4Like } from '@maxellabs/specification';
import { MaterialInstance } from './material-instance';
import type { Renderable, RenderContext } from './render-context';
import { CameraMatrices } from '../systems/camera';

/**
 * Renderer dispose callback
 * Called when renderer is disposed, allowing cleanup of external references
 */
export type RendererDisposeCallback = (renderer: Renderer) => void;

/**
 * Renderer configuration options
 */
export interface RendererConfig {
  /** RHI device */
  device: IRHIDevice;

  /** Enable debug mode */
  debug?: boolean;

  /** Clear color [r, g, b, a] */
  clearColor?: [number, number, number, number];

  /** Clear depth buffer */
  clearDepth?: boolean;

  /** Clear stencil buffer */
  clearStencil?: boolean;

  /** Dispose callback (called when renderer is disposed) */
  onDispose?: RendererDisposeCallback;
}

/**
 * Renderer - Abstract Renderer Base Class
 * @description Defines rendering pipeline framework
 *
 * @remarks
 * ## Design Principles
 * 1. **Separation of Concerns**: Renderer only handles RHI command submission, no ECS queries
 * 2. **Extensibility**: Provides onBeforeRender/onAfterRender hooks
 * 3. **Resource Abstraction**: MaterialInstance abstracts material instantiation
 * 4. **Type Safety**: All RHI types from @maxellabs/specification
 *
 * ## Extension Points
 * - `createRenderContext()`: Customize context creation
 * - `onBeforeRender()`: Pre-rendering hooks (shadow maps, etc.)
 * - `render()`: Main rendering (MUST be implemented by subclass)
 * - `onAfterRender()`: Post-rendering hooks (post-processing, etc.)
 *
 * ## Lifecycle
 * ```
 * beginFrame()
 *   → onBeforeRender()
 *   → render()
 *   → onAfterRender()
 * endFrame()
 * ```
 */
export abstract class Renderer {
  /** RHI device */
  protected device: IRHIDevice;

  /** Configuration */
  protected config: RendererConfig;

  /** MaterialInstance cache (key: materialId or custom key) */
  protected materialInstances: Map<string, MaterialInstance> = new Map();

  /** Dispose callbacks */
  protected disposeCallbacks: RendererDisposeCallback[] = [];

  /** Is currently rendering */
  protected isRendering: boolean = false;

  /** Frame counter */
  protected frameCount: number = 0;

  /** Pending renderables from RenderSystem (NEW) */
  protected pendingRenderables: Renderable[] = [];

  /** Frame version for pendingRenderables (用于检测数据是否过期) */
  /** 初始化为 -1 以区分"从未设置"状态，frameCount 从 0 开始 */
  protected renderablesFrameVersion: number = -1;

  /**
   * Create Renderer
   * @param config Renderer configuration
   */
  constructor(config: RendererConfig) {
    this.device = config.device;
    this.config = {
      debug: false,
      clearColor: [0, 0, 0, 1],
      clearDepth: true,
      clearStencil: false,
      ...config,
    };

    // Register dispose callback if provided
    if (config.onDispose) {
      this.disposeCallbacks.push(config.onDispose);
    }
  }

  /**
   * Begin rendering frame
   * @remarks Clears screen, prepares for rendering
   *
   * @throws Error if already rendering
   */
  beginFrame(): void {
    if (this.isRendering) {
      console.warn('[Renderer] beginFrame called while already rendering');
      return;
    }

    this.isRendering = true;

    // TODO: Clear screen (actual RHI calls by subclass)
    // const [r, g, b, a] = this.config.clearColor!;
    // device.clear({
    //   color: [r, g, b, a],
    //   depth: this.config.clearDepth,
    //   stencil: this.config.clearStencil
    // });
  }

  /**
   * End rendering frame
   * @remarks Submits commands, presents framebuffer
   */
  endFrame(): void {
    if (!this.isRendering) {
      console.warn('[Renderer] endFrame called without beginFrame');
      return;
    }

    // TODO: Present (actual RHI calls by subclass)
    // device.present();

    this.isRendering = false;
    this.frameCount++;
  }

  /**
   * Main rendering entry point
   * @param scene Scene to render
   * @param camera Camera entity ID
   *
   * @remarks
   * This method orchestrates the entire rendering flow:
   * 1. Call onBeforeRender (application packages can extend)
   * 2. Call subclass's render() implementation
   * 3. Call onAfterRender (application packages can extend)
   *
   * ## 使用约定（重要）
   * - **推荐使用方式**：通过 RenderSystem 调用，RenderSystem 会在调用前填充 renderables
   * - **直接调用限制**：如果绕过 RenderSystem 直接调用此方法，pendingRenderables 将为空
   * - **数据流**：RenderSystem.execute() → setRenderables() → renderScene()
   *
   * ## 状态检查
   * - 如果 setRenderables() 未在本帧调用，pendingRenderables 将为空数组
   * - 每次 renderScene() 结束后会清空 pendingRenderables，防止下一帧使用过时数据
   *
   * ## 职责边界
   * - **Renderer**：负责 RHI 命令提交和渲染逻辑，不执行 ECS 查询
   * - **RenderSystem**：负责 ECS 数据收集和场景管理，通过 setRenderables() 传递数据
   *
   * @example
   * ```typescript
   * // 推荐：通过 RenderSystem 使用
   * scene.scheduler.addSystemInstances(renderSystem);
   * scene.update(deltaTime); // RenderSystem 会调用 renderer.renderScene()
   *
   * // 不推荐：直接调用（renderables 将为空）
   * renderer.renderScene(scene, cameraEntity); // ⚠️ pendingRenderables 为空！
   * ```
   */
  renderScene(scene: IScene, camera: EntityId): void {
    // 检查 renderables 数据是否为当前帧
    // 注意：frameCount 在 endFrame() 中递增，所以 renderScene() 时 frameCount 还是当前帧
    if (this.renderablesFrameVersion !== this.frameCount && this.pendingRenderables.length > 0) {
      console.warn(
        `[Renderer] renderScene called with stale renderables data. ` +
          `Expected frameVersion=${this.frameCount}, got ${this.renderablesFrameVersion}. ` +
          `Ensure setRenderables() is called before renderScene() each frame.`
      );
    }

    // Build render context
    const ctx: RenderContext = this.createRenderContext(scene, camera);

    // Pre-render hook
    this.onBeforeRender(ctx);

    // Main render
    this.render(ctx);

    // Post-render hook
    this.onAfterRender(ctx);

    // 清空 pendingRenderables，防止下一帧使用过时数据
    // 如果 RenderSystem 在下一帧不调用 setRenderables()，将使用空数组
    this.pendingRenderables = [];
  }

  /**
   * Create material instance
   * @param material Material resource
   * @param cacheKey Optional custom cache key (defaults to materialId if available, otherwise shaderId)
   * @returns Material instance
   *
   * @remarks
   * Material instantiation flow:
   * 1. Check cache to avoid duplicate creation
   * 2. Create new MaterialInstance
   * 3. Set material properties and texture bindings
   *
   * ## Caching Strategy
   * - Default cache key: materialId (if available) or shaderId
   * - Custom cache key can be provided for special cases
   * - Use `createUncachedMaterialInstance` for per-object instances
   *
   * ## Important
   * If two materials use the same shader but different parameters,
   * they will have different cache keys (based on materialId).
   * This prevents parameter override issues.
   */
  createMaterialInstance(material: IMaterialResource, cacheKey?: string): MaterialInstance {
    // Use provided key, or materialId if available, or fall back to shaderId
    // 类型安全的属性检查：使用 'in' 操作符避免 any 类型
    const materialId = 'id' in material && typeof material.id === 'string' ? material.id : undefined;
    const key = cacheKey ?? materialId ?? material.shaderId;

    if (!key) {
      throw new Error(
        '[Renderer] Cannot create MaterialInstance: no valid cache key (cacheKey, material.id, or shaderId required)'
      );
    }

    let instance = this.materialInstances.get(key);
    if (instance) {
      return instance;
    }

    // Create new instance
    instance = new MaterialInstance(material, this.device);
    this.materialInstances.set(key, instance);

    return instance;
  }

  /**
   * Create uncached material instance
   * @param material Material resource
   * @returns New MaterialInstance (not cached)
   *
   * @remarks
   * Use this for per-object material instances that need unique parameters.
   * The caller is responsible for disposing the instance.
   */
  createUncachedMaterialInstance(material: IMaterialResource): MaterialInstance {
    return new MaterialInstance(material, this.device);
  }

  /**
   * Get RHI device
   * @returns The RHI device used by this renderer
   */
  getDevice(): IRHIDevice {
    return this.device;
  }

  /**
   * Get frame count
   * @returns Current frame number
   */
  getFrameCount(): number {
    return this.frameCount;
  }

  /**
   * Set renderables from RenderSystem (NEW)
   * @param renderables Array of renderable objects collected by RenderSystem
   *
   * @remarks
   * RenderSystem calls this method before renderScene() to provide
   * the list of renderable objects. This data will be used in createRenderContext().
   *
   * ## 数据所有权说明
   * - 此方法会进行**浅拷贝**，确保 Renderer 拥有独立的 renderables 数组
   * - 原始数组在下一帧可能被 RenderSystem 清空或修改
   * - Renderable 对象本身不拷贝（避免性能开销），但数组是独立的
   *
   * ## 调用时序（重要）
   * - 必须在 `renderScene()` 前调用
   * - 每帧调用一次，数据有效期仅当前帧
   * - 调用此方法会更新 renderablesFrameVersion
   *
   * ## 并发安全
   * - 使用 frameVersion 检测数据是否与当前帧匹配
   * - 如果 renderScene() 时 frameVersion 不匹配，会发出警告
   *
   * ## 典型调用顺序
   * ```
   * RenderSystem.execute():
   *   1. collectRenderables()
   *   2. renderer.setRenderables(renderables)  // frameVersion = frameCount
   *   3. renderer.beginFrame()
   *   4. renderer.renderScene(scene, camera)   // 检查 frameVersion
   *   5. renderer.endFrame()
   * ```
   */
  setRenderables(renderables: Renderable[]): void {
    // 浅拷贝数组，避免 RenderSystem 后续修改影响渲染
    this.pendingRenderables = [...renderables];
    // 更新版本号，标记数据为当前帧有效
    this.renderablesFrameVersion = this.frameCount;
  }

  /**
   * Add dispose callback
   * @param callback Callback to be called when renderer is disposed
   *
   * @remarks
   * Use this to clean up external references to the renderer.
   * Callbacks are called in the order they were added.
   */
  onDispose(callback: RendererDisposeCallback): void {
    this.disposeCallbacks.push(callback);
  }

  /**
   * Remove dispose callback
   * @param callback Callback to remove
   * @returns true if callback was found and removed
   */
  removeDisposeCallback(callback: RendererDisposeCallback): boolean {
    const index = this.disposeCallbacks.indexOf(callback);
    if (index !== -1) {
      this.disposeCallbacks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Dispose resources
   * @remarks
   * Releases:
   * - All material instances
   * - GPU resources
   * - Calls dispose callbacks
   *
   * After dispose(), renderer should not be used.
   */
  dispose(): void {
    // Call dispose callbacks first (so they can access renderer state if needed)
    for (const callback of this.disposeCallbacks) {
      try {
        callback(this);
      } catch (error) {
        console.error('[Renderer] Error in dispose callback:', error);
      }
    }
    this.disposeCallbacks.length = 0;

    // Dispose all material instances
    for (const instance of this.materialInstances.values()) {
      instance.dispose();
    }
    this.materialInstances.clear();

    this.isRendering = false;
    this.frameCount = 0;
  }

  // ==================== Extension Points (Subclass Overrides) ====================

  /**
   * Create render context
   * @param scene Scene reference
   * @param camera Camera entity
   * @returns Render context
   *
   * @remarks Subclass can override to add custom context data
   *
   * @example
   * ```typescript
   * protected override createRenderContext(
   *   scene: IScene,
   *   camera: EntityId
   * ): RenderContext {
   *   const ctx = super.createRenderContext(scene, camera);
   *
   *   // Add custom data
   *   ctx.customData = {
   *     shadowMap: this.shadowMapTexture,
   *     lightingData: this.lightingBuffer
   *   };
   *
   *   return ctx;
   * }
   * ```
   */
  protected createRenderContext(scene: IScene, camera: EntityId): RenderContext {
    // 默认 implementation: create basic context
    // 优先使用 RenderSystem 填充的数据（如果可用）
    // 否则使用默认空值，由 Renderer 自己实现数据收集

    // 尝试获取 CameraMatrices（从 CameraSystem）
    let viewMatrix: Matrix4Like | null = null;
    let projectionMatrix: Matrix4Like | null = null;
    let viewProjectionMatrix: Matrix4Like | null = null;

    const cameraMatrices = scene.world.getComponent(camera, CameraMatrices);
    if (cameraMatrices) {
      viewMatrix = cameraMatrices.viewMatrix;
      projectionMatrix = cameraMatrices.projectionMatrix;
      viewProjectionMatrix = cameraMatrices.viewProjectionMatrix;
    }

    return {
      scene,
      camera,
      device: this.device,
      renderables: this.pendingRenderables, // Use renderables from RenderSystem
      viewMatrix,
      projectionMatrix,
      viewProjectionMatrix,
      time: performance.now() / 1000.0,
      frameCount: this.frameCount,
    };
  }

  /**
   * Pre-render callback
   * @param ctx Render context
   *
   * @remarks
   * Application packages can use this for:
   * - Rendering shadow maps
   * - Updating global Uniform Buffers
   * - Setting render state
   *
   * ## 钩子调用顺序
   * 在 Renderer 模式下，钩子调用顺序为：
   * 1. `onBeforeRender(ctx)` - Renderer 内部钩子
   * 2. `render(ctx)` - 主渲染
   * 3. `onAfterRender(ctx)` - Renderer 内部钩子
   *
   * 在 RenderSystem 模式下，钩子调用顺序为：
   * 1. `RenderSystem.onBeforeRender(ctx)` - System 内部钩子
   * 2. `RenderSystem.beforeRenderHooks` - 外部注册的钩子
   * 3. `Renderer.onBeforeRender(ctx)` - Renderer 内部钩子（通过 renderScene）
   * 4. `Renderer.render(ctx)` - 主渲染
   * 5. `Renderer.onAfterRender(ctx)` - Renderer 内部钩子
   * 6. `RenderSystem.afterRenderHooks` - 外部注册的钩子
   * 7. `RenderSystem.onAfterRender(ctx)` - System 内部钩子
   *
   * @example
   * ```typescript
   * protected override onBeforeRender(ctx: RenderContext): void {
   *   // Render shadow map
   *   this.shadowPass.render(ctx);
   *
   *   // Update global uniforms
   *   this.updateGlobalUniforms(ctx);
   * }
   * ```
   */
  protected onBeforeRender(_ctx: RenderContext): void {
    // Subclass implementation
  }

  /**
   * Main render callback (abstract method)
   * @param ctx Render context
   *
   * @remarks
   * Subclass MUST implement this method to perform actual rendering:
   * - Iterate ctx.renderables
   * - Bind material instances
   * - Submit draw calls
   *
   * @example
   * ```typescript
   * protected override render(ctx: RenderContext): void {
   *   for (const renderable of ctx.renderables) {
   *     // Get resources
   *     const mesh = ctx.scene.getMesh(renderable.meshId);
   *     const material = ctx.scene.getMaterial(renderable.materialId);
   *     if (!mesh || !material) continue;
   *
   *     // Create material instance
   *     const instance = this.createMaterialInstance(material);
   *
   *     // Bind and draw
   *     instance.bind();
   *     this.device.draw(mesh);
   *   }
   * }
   * ```
   */
  protected abstract render(ctx: RenderContext): void;

  /**
   * Post-render callback
   * @param ctx Render context
   *
   * @remarks
   * Application packages can use this for:
   * - Rendering post-processing effects
   * - Rendering debug overlays
   * - Submitting performance data
   *
   * @example
   * ```typescript
   * protected override onAfterRender(ctx: RenderContext): void {
   *   // Apply post-processing
   *   this.postProcessPass.render(ctx);
   *
   *   // Render debug info
   *   if (this.config.debug) {
   *     this.debugRenderer.render(ctx);
   *   }
   * }
   * ```
   */
  protected onAfterRender(_ctx: RenderContext): void {
    // Subclass implementation
  }
}
