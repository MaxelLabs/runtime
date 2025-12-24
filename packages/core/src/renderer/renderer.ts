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
import type { IMaterialResource } from '@maxellabs/specification';
import { MaterialInstance } from './material-instance';
import type { RenderContext } from './render-context';

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
   */
  renderScene(scene: IScene, camera: EntityId): void {
    // Build render context
    const ctx: RenderContext = this.createRenderContext(scene, camera);

    // Pre-render hook
    this.onBeforeRender(ctx);

    // Main render
    this.render(ctx);

    // Post-render hook
    this.onAfterRender(ctx);
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
    const key = cacheKey ?? (material as any).id ?? material.shaderId;

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
    // Default implementation: create basic context
    // Subclass can extend to add more data (shadow maps, post-processing textures, etc.)
    return {
      scene,
      camera,
      device: this.device,
      renderables: [], // Filled by RenderSystem
      viewMatrix: null,
      projectionMatrix: null,
      viewProjectionMatrix: null,
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
