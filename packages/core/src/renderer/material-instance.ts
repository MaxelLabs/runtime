/**
 * MaterialInstance - Material Instance Management
 * 材质实例管理
 *
 * @packageDocumentation
 *
 * @remarks
 * ## Design Goals
 * 1. **Instantiation**: One MaterialResource can have multiple instances
 * 2. **Parameter Override**: Instance can override material's default parameters
 * 3. **GPU Resource Management**: Manages Uniform Buffers and other GPU resources
 * 4. **Batching Optimization**: Same material instances can be batched
 *
 * ## Usage Scenarios
 * ```typescript
 * // Create material instance
 * const material = resourceManager.getMaterial(handle);
 * const instance = renderer.createMaterialInstance(material);
 *
 * // Set instance parameters (override material defaults)
 * instance.setProperty('baseColor', [1, 0, 0, 1]);
 * instance.setProperty('metallic', 0.8);
 *
 * // Bind to render pipeline
 * instance.bind();
 * device.draw(...);
 * ```
 *
 * ## Memory Management
 * - Instance holds reference to MaterialResource
 * - Instance owns its GPU resources (Uniform Buffers)
 * - Dispose properly to avoid memory leaks
 */

import type { IRHIDevice } from '@maxellabs/specification';
import type { IMaterialResource } from '@maxellabs/specification';

/**
 * MaterialInstance - Material Instance
 * @description Runtime instantiation wrapper for MaterialResource
 */
export class MaterialInstance {
  /** Material resource reference */
  private materialResource: IMaterialResource;

  /** RHI device */
  private device: IRHIDevice;

  /** Instance parameters (override material defaults) */
  private properties: Map<string, unknown> = new Map();

  /** Texture bindings */
  private textureBindings: Map<string, string> = new Map();

  /** Uniform Buffer (GPU resource) */
  private uniformBuffer: unknown = null; // TODO: Use IRHIBuffer when available

  /** Dirty flag (needs GPU data update) */
  private dirty: boolean = true;

  /**
   * Create MaterialInstance
   * @param material Material resource
   * @param device RHI device
   *
   * @remarks
   * Initializes properties and textures from material defaults.
   * Deep copies to ensure independence from resource.
   */
  constructor(material: IMaterialResource, device: IRHIDevice) {
    this.materialResource = material;
    this.device = device;

    // Initialize default properties (deep copy)
    for (const [key, value] of Object.entries(material.properties)) {
      // Deep copy arrays, shallow copy primitives
      if (Array.isArray(value)) {
        this.properties.set(key, [...value]);
      } else if (typeof value === 'object' && value !== null) {
        this.properties.set(key, { ...value });
      } else {
        this.properties.set(key, value);
      }
    }

    // Initialize texture bindings (shallow copy - strings are immutable)
    for (const [key, value] of Object.entries(material.textures)) {
      this.textureBindings.set(key, value);
    }
  }

  /**
   * Get shader ID
   * @returns Shader identifier used by this material
   */
  getShaderId(): string {
    return this.materialResource.shaderId;
  }

  /**
   * Set property value
   * @param name Property name
   * @param value Property value
   *
   * @remarks
   * Marks instance as dirty, requiring GPU update on next bind().
   * Values are stored by reference - caller should not mutate passed objects.
   */
  setProperty(name: string, value: unknown): void {
    this.properties.set(name, value);
    this.dirty = true;
  }

  /**
   * Get property value
   * @param name Property name
   * @returns Property value, or undefined if not found
   */
  getProperty(name: string): unknown {
    return this.properties.get(name);
  }

  /**
   * Set texture binding
   * @param slot Texture slot name (e.g., 'diffuse', 'normal')
   * @param textureUri Texture resource URI
   */
  setTexture(slot: string, textureUri: string): void {
    this.textureBindings.set(slot, textureUri);
    this.dirty = true;
  }

  /**
   * Get texture binding
   * @param slot Texture slot name
   * @returns Texture URI, or undefined if not bound
   */
  getTexture(slot: string): string | undefined {
    return this.textureBindings.get(slot);
  }

  /**
   * Bind material instance to render pipeline
   *
   * @remarks
   * This method:
   * 1. Updates GPU Uniform Buffer if dirty
   * 2. Binds Uniform Buffer to shader
   * 3. Binds textures to texture slots
   *
   * Implementation is deferred to Renderer subclasses due to RHI abstraction.
   *
   * ## Current Status
   * This is a framework method. Actual RHI calls are TODO and depend on:
   * - IRHIBuffer interface
   * - IRHITexture interface
   * - Device binding methods
   *
   * @example
   * ```typescript
   * // In Renderer subclass
   * protected render(ctx: RenderContext): void {
   *   for (const renderable of ctx.renderables) {
   *     const instance = this.createMaterialInstance(material);
   *     instance.bind(); // Uploads parameters to GPU
   *     this.device.draw(...);
   *   }
   * }
   * ```
   */
  bind(): void {
    if (this.dirty) {
      this.updateUniformBuffer();
      this.dirty = false;
    }

    // TODO: Bind Uniform Buffer
    // device.setUniformBuffer(this.uniformBuffer, ...);

    // TODO: Bind textures
    // for (const [slot, uri] of this.textureBindings) {
    //   const texture = resourceManager.getTexture(uri);
    //   device.setTexture(slot, texture);
    // }

    // NOTE: Actual RHI calls deferred to Renderer subclasses
  }

  /**
   * Update Uniform Buffer
   * @remarks Packs properties into GPU buffer
   *
   * @privateRemarks
   * This is a placeholder. Actual implementation requires:
   * - Shader reflection to determine layout
   * - Buffer packing according to std140/std430
   * - IRHIBuffer creation and update
   */
  private updateUniformBuffer(): void {
    // TODO: Pack properties according to shader layout
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
   * Dispose GPU resources
   *
   * @remarks
   * Releases:
   * - Uniform Buffer
   * - Property storage
   * - Texture binding references
   *
   * After dispose(), instance should not be used.
   */
  dispose(): void {
    if (this.uniformBuffer) {
      // TODO: Destroy buffer when IRHIBuffer available
      // this.uniformBuffer.destroy();
      this.uniformBuffer = null;
    }

    this.properties.clear();
    this.textureBindings.clear();
  }
}
