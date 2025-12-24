/**
 * Render Context and Renderable Definitions
 * 渲染上下文和可渲染对象定义
 *
 * @packageDocumentation
 *
 * @remarks
 * ## Design Decisions
 * - **Renderable**: Immutable data structure containing all rendering data
 * - **RenderContext**: Complete context passed to Renderer, including camera matrices
 * - **Separation from RenderSystem**: This context is richer than RenderSystem's internal context
 *
 * ## Relation to RenderSystem
 * - RenderSystem collects Renderables and builds basic context
 * - Renderer receives enhanced RenderContext with camera matrices
 * - This separation allows for flexible rendering pipelines
 */

import type { IScene } from '../rhi/IScene';
import type { EntityId } from '../ecs';
import type { IRHIDevice } from '@maxellabs/specification';
import type { Matrix4Like } from '@maxellabs/specification';

/**
 * Renderable Object
 * @description Contains all data needed to render a single object
 *
 * @remarks
 * Collected by RenderSystem from ECS queries, then passed to Renderer.
 * Immutable data structure for thread-safety and optimization.
 */
export interface Renderable {
  /** Entity ID */
  entity: EntityId;

  /** Mesh resource ID */
  meshId: string;

  /** Material resource ID */
  materialId: string;

  /** World transform matrix (Model Matrix) */
  worldMatrix: Matrix4Like;

  /** Render layer (for sorting and filtering) */
  layer: number;

  /** Sort key (for draw call batching and transparency sorting) */
  sortKey: number;

  /** Visibility flag */
  visible: boolean;
}

/**
 * RenderContext - Rendering Context
 * @description Complete context information passed to Renderer
 *
 * @remarks
 * ## Design Goals
 * 1. **Complete Information**: Contains all data needed for rendering
 * 2. **Camera Matrices**: Pre-computed View/Projection matrices
 * 3. **Time Information**: For shader animations
 * 4. **Extensibility**: Custom data can be added via customData field
 *
 * ## Difference from RenderSystem Context
 * - RenderSystem Context: Lightweight, for System internals
 * - Renderer Context: Complete, includes camera matrices and time
 *
 * ## Usage Example
 * ```typescript
 * class MyRenderer extends Renderer {
 *   protected render(ctx: RenderContext): void {
 *     // Access scene resources
 *     for (const renderable of ctx.renderables) {
 *       const mesh = ctx.scene.getMesh(renderable.meshId);
 *       const material = ctx.scene.getMaterial(renderable.materialId);
 *
 *       // Compute MVP matrix
 *       const mvp = Matrix4.multiply(
 *         ctx.viewProjectionMatrix,
 *         renderable.worldMatrix
 *       );
 *
 *       // Render
 *       this.drawObject(mesh, material, mvp);
 *     }
 *   }
 * }
 * ```
 */
export interface RenderContext {
  /** Scene reference (for resource access) */
  scene: IScene;

  /** Main camera entity ID */
  camera: EntityId;

  /** RHI device */
  device: IRHIDevice;

  /** Renderable objects list */
  renderables: Renderable[];

  /** View matrix (computed from camera transform) */
  viewMatrix: Matrix4Like | null;

  /** Projection matrix (computed from camera settings) */
  projectionMatrix: Matrix4Like | null;

  /** ViewProjection matrix (precomputed for optimization) */
  viewProjectionMatrix: Matrix4Like | null;

  /** Current time in seconds (for shader animations) */
  time: number;

  /** Frame count (for temporal effects) */
  frameCount: number;

  /** Custom data (application-specific extensions) */
  customData?: Record<string, unknown>;
}

/**
 * Create empty render context
 * @param scene Scene reference
 * @param camera Camera entity ID
 * @param device RHI device
 * @returns Empty RenderContext with default values
 *
 * @remarks
 * Factory function to simplify context creation.
 * Matrices are set to null and must be filled by caller.
 *
 * @example
 * ```typescript
 * const ctx = createEmptyRenderContext(scene, cameraEntity, device);
 * ctx.viewMatrix = computeViewMatrix(camera);
 * ctx.projectionMatrix = computeProjectionMatrix(camera);
 * ```
 */
export function createEmptyRenderContext(scene: IScene, camera: EntityId, device: IRHIDevice): RenderContext {
  return {
    scene,
    camera,
    device,
    renderables: [],
    viewMatrix: null,
    projectionMatrix: null,
    viewProjectionMatrix: null,
    time: 0,
    frameCount: 0,
  };
}
