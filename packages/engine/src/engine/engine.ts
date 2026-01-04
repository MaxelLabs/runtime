/**
 * Engine - 3D Engine Entry Point
 * 3D 引擎入口类
 *
 * @packageDocumentation
 *
 * @remarks
 * Engine 是 3D 渲染引擎的顶层封装，整合 Core 基础设施和 RHI 实现。
 * 提供开箱即用的 3D 应用开发能力。
 *
 * ## 设计原则
 * 1. **依赖注入**: 通过 Core 和 RHI 包提供的接口组合功能
 * 2. **便捷 API**: 提供高层封装，简化常见操作
 * 3. **可扩展性**: 支持自定义渲染器、系统、组件
 * 4. **资源管理**: 统一的资源加载和生命周期管理
 *
 * ## 使用示例
 * ```typescript
 * const engine = new Engine({
 *   canvas: '#canvas',
 *   antialias: true,
 *   shadows: { enabled: true }
 * });
 *
 * const camera = engine.createCamera({ position: [0, 2, 5] });
 * const light = engine.createDirectionalLight({ direction: [-1, -1, -1] });
 *
 * engine.start();
 * ```
 */

import type { IRHIDevice, RHIBufferUsage } from '@maxellabs/specification';
import {
  Scene,
  Camera,
  CameraTarget,
  LocalTransform,
  WorldTransform,
  Visible,
  type Renderer,
  type ResourceManager,
  type EntityId,
} from '@maxellabs/core';
import { WebGLDevice } from '@maxellabs/rhi';
import type { EngineConfig } from './engine-config';
import { SimpleWebGLRenderer } from '../renderers/simple-webgl-renderer';
import { PBRMaterial, type PBRMaterialConfig } from '../materials/PBR-material';
import { UnlitMaterial, type UnlitMaterialConfig } from '../materials/unlit-material';
import { BoxGeometry, SphereGeometry, PlaneGeometry, CylinderGeometry, type GeometryData } from '../primitives';
import { MeshInstance, MaterialInstance, STANDARD_VERTEX_LAYOUT } from '../components';
import type { MaterialType } from '../components';

/**
 * Engine 类
 * 3D 引擎的核心实现
 */
export class Engine {
  // === Core Properties ===
  /** RHI device */
  readonly device: IRHIDevice;

  /** Scene instance */
  readonly scene: Scene;

  /** Renderer instance */
  readonly renderer: Renderer;

  /** Resource manager */
  readonly resources: ResourceManager;

  /** Main camera entity */
  private _mainCamera: EntityId | null = null;

  // === Configuration ===
  private config: EngineConfig;

  // === Canvas ===
  private canvas: HTMLCanvasElement;

  // === Lifecycle State ===
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number = 0;

  // === User Callbacks ===
  onBeforeRender?: (deltaTime: number) => void;
  onAfterRender?: (deltaTime: number) => void;

  /**
   * Create Engine instance
   * @param config Engine configuration
   *
   * @remarks
   * Initialization flow:
   * 1. Create RHI device (WebGLDevice)
   * 2. Create Core scene
   * 3. Register Engine-specific components
   * 4. Register Engine-specific systems
   * 5. Create renderer (ForwardRenderer)
   * 6. Initialize resource manager
   */
  constructor(config: EngineConfig) {
    this.config = {
      renderMode: 'forward',
      antialias: false,
      debug: false,
      ...config,
    };

    // 1. Resolve canvas
    this.canvas = this.resolveCanvas(config.canvas);

    // 2. Create RHI device
    this.device = new WebGLDevice(this.canvas, {
      antialias: this.config.antialias,
      powerPreference: 'high-performance',
    });

    // 3. Create Core scene
    this.scene = new Scene({
      device: this.device,
      name: 'MainScene',
    });

    // 4. Register Engine-specific components
    this.registerEngineComponents();

    // 5. Create default camera
    this.createDefaultCamera();

    // 6. Register Engine-specific systems
    this.registerEngineSystems();

    // 7. Create renderer
    this.renderer = this.createRenderer();
    this.scene.setRenderer(this.renderer);

    // 8. Initialize resource manager
    this.resources = this.scene.resourceManager;
    this.registerResourceLoaders();
  }

  /**
   * Resolve canvas element
   * @param canvas Canvas element or selector
   * @returns Canvas element
   */
  private resolveCanvas(canvas: HTMLCanvasElement | string): HTMLCanvasElement {
    if (typeof canvas === 'string') {
      const element = document.querySelector(canvas);
      if (!element || !(element instanceof HTMLCanvasElement)) {
        throw new Error(`[Engine] Canvas not found: ${canvas}`);
      }
      return element;
    }
    return canvas;
  }

  /**
   * Register Engine-specific components
   * @remarks
   * Engine extends Core with additional components:
   * - Camera, CameraTarget (required for rendering)
   * - LocalTransform, WorldTransform (required for camera positioning)
   * - MeshInstance, MaterialInstance (required for mesh rendering)
   * - Visible (required for visibility control)
   */
  private registerEngineComponents(): void {
    // Register Camera components (required for Scene.render())
    this.scene.world.registerComponent(Camera);
    this.scene.world.registerComponent(CameraTarget);
    this.scene.world.registerComponent(LocalTransform);
    this.scene.world.registerComponent(WorldTransform);

    // Register Mesh rendering components
    this.scene.world.registerComponent(MeshInstance);
    this.scene.world.registerComponent(MaterialInstance);
    this.scene.world.registerComponent(Visible);
  }

  /**
   * Create default camera entity
   * @remarks
   * Creates a perspective camera at position (0, 2, 5) looking at origin.
   */
  private createDefaultCamera(): void {
    const cameraEntity = this.scene.createEntity('MainCamera');

    // Add LocalTransform component
    const localTransform = LocalTransform.fromData({
      position: { x: 0, y: 2, z: 5 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    });
    this.scene.world.addComponent(cameraEntity, LocalTransform, localTransform);

    // Add WorldTransform component (required by CameraSystem)
    this.scene.world.addComponent(cameraEntity, WorldTransform, new WorldTransform());

    // Add Camera component
    const camera = new Camera();
    const aspectRatio = this.canvas.width / this.canvas.height;
    camera.setPerspective(45, aspectRatio, 0.1, 1000);
    camera.isMain = true;
    this.scene.world.addComponent(cameraEntity, Camera, camera);

    // Add CameraTarget component (look at origin)
    const cameraTarget = CameraTarget.fromData({
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
    });
    this.scene.world.addComponent(cameraEntity, CameraTarget, cameraTarget);

    this._mainCamera = cameraEntity;
  }

  /**
   * Register Engine-specific systems
   * @remarks
   * Engine adds high-level systems:
   * - ShadowSystem (PreRender, priority 100)
   * - LODSystem (PostUpdate, priority 50)
   * - CullingSystem (PreRender, priority 90)
   */
  private registerEngineSystems(): void {
    // TODO: Register Engine systems when implemented
    // this.scene.scheduler.addSystem(createShadowSystem(), {
    //   stage: SystemStage.PreRender,
    //   priority: 100
    // });
    // this.scene.scheduler.addSystem(createLODSystem(), {
    //   stage: SystemStage.PostUpdate,
    //   priority: 50
    // });
    // this.scene.scheduler.addSystem(createCullingSystem(), {
    //   stage: SystemStage.PreRender,
    //   priority: 90
    // });
  }

  /**
   * Create renderer based on configuration
   * @returns Renderer instance
   */
  private createRenderer(): Renderer {
    const renderMode = this.config.renderMode ?? 'forward';

    switch (renderMode) {
      case 'forward':
        // 使用 SimpleWebGLRenderer 进行直接 WebGL 渲染
        // ForwardRenderer 需要完整的 RHI 渲染目标设置
        return new SimpleWebGLRenderer({
          device: this.device,
          clearColor: [0.1, 0.1, 0.15, 1.0],
          backgroundColor: [0.1, 0.1, 0.15, 1.0],
          debug: this.config.debug,
        });

      case 'deferred':
        // TODO: Implement DeferredRenderer
        throw new Error('[Engine] DeferredRenderer not implemented yet');

      default:
        throw new Error(`[Engine] Unknown render mode: ${renderMode}`);
    }
  }

  /**
   * Register resource loaders
   * @remarks
   * Engine provides loaders for:
   * - glTF/GLB (GLTFLoader)
   * - HDR (HDRLoader)
   * - KTX2 (KTX2Loader)
   */
  private registerResourceLoaders(): void {
    // TODO: Register loaders when implemented
    // this.resources.registerLoader('gltf', new GLTFLoader(this.resources));
    // this.resources.registerLoader('glb', new GLTFLoader(this.resources));
    // this.resources.registerLoader('hdr', new HDRLoader(this.resources));
    // this.resources.registerLoader('ktx2', new KTX2Loader(this.resources));
  }

  /**
   * Start rendering loop
   * @remarks
   * Starts the main loop using requestAnimationFrame.
   * Calls onBeforeRender, scene.update, renderer.render, onAfterRender each frame.
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[Engine] Already running');
      return;
    }

    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  /**
   * Stop rendering loop
   * @remarks
   * Cancels the animation frame request.
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('[Engine] Not running');
      return;
    }

    this.isRunning = false;
    if (this.animationFrameId !== 0) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  /**
   * Main loop
   * @param currentTime Current timestamp
   */
  private loop = (currentTime: number): void => {
    if (!this.isRunning) {
      return;
    }

    // Calculate delta time
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // 1. User callback: before render
    if (this.onBeforeRender) {
      this.onBeforeRender(deltaTime);
    }

    // 2. Update scene (execute all systems)
    this.scene.update(deltaTime);

    // 3. Begin frame (creates command encoder)
    this.renderer.beginFrame();

    // 4. Render scene
    this.scene.render();

    // 5. End frame (submits commands)
    this.renderer.endFrame();

    // 6. User callback: after render
    if (this.onAfterRender) {
      this.onAfterRender(deltaTime);
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Dispose engine resources
   * @remarks
   * Releases:
   * - Scene resources
   * - Renderer resources
   * - RHI device
   *
   * After dispose(), engine should not be used.
   */
  dispose(): void {
    // Stop loop
    this.stop();

    // Dispose scene (includes renderer)
    this.scene.dispose();

    // Dispose device
    this.device.destroy();
  }

  // ==================== Convenience Methods ====================

  // -------------------- Material Creation --------------------

  /**
   * Create PBR material
   * @param config PBR material configuration
   * @returns PBRMaterial instance
   *
   * @example
   * ```typescript
   * const material = engine.createPBRMaterial({
   *   baseColor: [1, 0, 0, 1],
   *   metallic: 0.5,
   *   roughness: 0.5
   * });
   * ```
   */
  createPBRMaterial(config?: PBRMaterialConfig): PBRMaterial {
    return new PBRMaterial(this.device, config);
  }

  /**
   * Create Unlit material
   * @param config Unlit material configuration
   * @returns UnlitMaterial instance
   *
   * @example
   * ```typescript
   * const material = engine.createUnlitMaterial({
   *   color: [1, 1, 1, 1]
   * });
   * ```
   */
  createUnlitMaterial(config?: UnlitMaterialConfig): UnlitMaterial {
    return new UnlitMaterial(this.device, config);
  }

  // -------------------- Geometry Creation --------------------

  /**
   * Create box geometry
   * @param width Width (X axis, default: 1)
   * @param height Height (Y axis, default: 1)
   * @param depth Depth (Z axis, default: 1)
   * @returns GeometryData
   */
  createBoxGeometry(width: number = 1, height: number = 1, depth: number = 1): GeometryData {
    return new BoxGeometry({ width, height, depth }).build();
  }

  /**
   * Create sphere geometry
   * @param radius Radius (default: 1)
   * @param widthSegments Horizontal segments (default: 32)
   * @param heightSegments Vertical segments (default: 16)
   * @returns GeometryData
   */
  createSphereGeometry(radius: number = 1): GeometryData {
    return new SphereGeometry({ radius, segments: 32 }).build();
  }

  /**
   * Create plane geometry
   * @param width Width (X axis, default: 1)
   * @param height Height (Z axis, default: 1)
   * @param widthSegments Width segments (default: 1)
   * @param heightSegments Height segments (default: 1)
   * @returns GeometryData
   */
  createPlaneGeometry(
    width: number = 1,
    height: number = 1,
    widthSegments: number = 1,
    heightSegments: number = 1
  ): GeometryData {
    return new PlaneGeometry(width, height, widthSegments, heightSegments).getData();
  }

  /**
   * Create cylinder geometry
   * @param radiusTop Top radius (default: 1)
   * @param radiusBottom Bottom radius (default: 1)
   * @param height Height (default: 1)
   * @param radialSegments Radial segments (default: 32)
   * @returns GeometryData
   */
  createCylinderGeometry(
    radiusTop: number = 1,
    radiusBottom: number = 1,
    height: number = 1,
    radialSegments: number = 32
  ): GeometryData {
    return new CylinderGeometry({ radiusTop, radiusBottom, height, radialSegments }).build();
  }

  // -------------------- Entity Creation --------------------

  /**
   * Get main camera entity
   * @returns Main camera entity ID
   */
  get mainCamera(): EntityId | null {
    return this._mainCamera;
  }

  /**
   * Create camera entity
   * @param config Camera configuration
   * @returns Camera entity ID
   */
  createCamera(config?: {
    position?: [number, number, number];
    target?: [number, number, number];
    fov?: number;
    near?: number;
    far?: number;
    isMain?: boolean;
  }): EntityId {
    const cameraEntity = this.scene.createEntity('Camera');

    // Add LocalTransform component
    const pos = config?.position ?? [0, 2, 5];
    const localTransform = LocalTransform.fromData({
      position: { x: pos[0], y: pos[1], z: pos[2] },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    });
    this.scene.world.addComponent(cameraEntity, LocalTransform, localTransform);

    // Add WorldTransform component
    this.scene.world.addComponent(cameraEntity, WorldTransform, new WorldTransform());

    // Add Camera component
    const camera = new Camera();
    const aspectRatio = this.canvas.width / this.canvas.height;
    camera.setPerspective(config?.fov ?? 45, aspectRatio, config?.near ?? 0.1, config?.far ?? 1000);
    camera.isMain = config?.isMain ?? false;
    this.scene.world.addComponent(cameraEntity, Camera, camera);

    // Add CameraTarget component
    const tgt = config?.target ?? [0, 0, 0];
    const cameraTarget = CameraTarget.fromData({
      target: { x: tgt[0], y: tgt[1], z: tgt[2] },
      up: { x: 0, y: 1, z: 0 },
    });
    this.scene.world.addComponent(cameraEntity, CameraTarget, cameraTarget);

    // Update main camera if this is main
    if (config?.isMain) {
      this._mainCamera = cameraEntity;
    }

    return cameraEntity;
  }

  /**
   * Create directional light entity
   * @param config Light configuration
   * @returns Light entity ID
   *
   * @remarks
   * TODO: Implement when Light component is available
   */
  createDirectionalLight(_config?: unknown): unknown {
    throw new Error('[Engine] createDirectionalLight not implemented yet');
  }

  /**
   * Create point light entity
   * @param config Light configuration
   * @returns Light entity ID
   *
   * @remarks
   * TODO: Implement when Light component is available
   */
  createPointLight(_config?: unknown): unknown {
    throw new Error('[Engine] createPointLight not implemented yet');
  }

  /**
   * Create mesh entity
   * @param geometry Geometry data
   * @param material Material instance
   * @param options Optional configuration
   * @returns Mesh entity ID
   *
   * @example
   * ```typescript
   * const geometry = engine.createBoxGeometry(1, 1, 1);
   * const material = engine.createPBRMaterial({ baseColor: [1, 0, 0, 1] });
   * const meshEntity = engine.createMesh(geometry, material, {
   *   position: [0, 0, 0],
   *   name: 'RedBox'
   * });
   * ```
   */
  createMesh(
    geometry: GeometryData,
    material: MaterialType,
    options?: {
      position?: [number, number, number];
      rotation?: [number, number, number, number];
      scale?: [number, number, number];
      name?: string;
    }
  ): EntityId {
    const name = options?.name ?? 'Mesh';
    const entity = this.scene.createEntity(name);

    // 1. Create MeshInstance component with GPU buffers
    const meshInstance = new MeshInstance();

    // Build interleaved vertex data (position + normal + uv)
    const vertexData = this.buildInterleavedVertexData(geometry);
    const vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: 'vertex' as RHIBufferUsage,
      initialData: vertexData as BufferSource,
      label: `${name}_VertexBuffer`,
    });

    meshInstance.vertexBuffer = vertexBuffer;
    meshInstance.vertexCount = geometry.positions.length / 3;
    meshInstance.vertexLayout = STANDARD_VERTEX_LAYOUT;

    // Create index buffer if indices exist
    if (geometry.indices && geometry.indices.length > 0) {
      const indexData = new Uint16Array(geometry.indices);
      const indexBuffer = this.device.createBuffer({
        size: indexData.byteLength,
        usage: 'index' as RHIBufferUsage,
        initialData: indexData,
        label: `${name}_IndexBuffer`,
      });
      meshInstance.indexBuffer = indexBuffer;
      meshInstance.indexCount = geometry.indices.length;
    }

    this.scene.world.addComponent(entity, MeshInstance, meshInstance);

    // 2. Create MaterialInstance component
    const materialInstance = new MaterialInstance();
    materialInstance.material = material;
    this.scene.world.addComponent(entity, MaterialInstance, materialInstance);

    // 3. Add LocalTransform component
    const pos = options?.position ?? [0, 0, 0];
    const rot = options?.rotation ?? [0, 0, 0, 1];
    const scl = options?.scale ?? [1, 1, 1];
    const localTransform = LocalTransform.fromData({
      position: { x: pos[0], y: pos[1], z: pos[2] },
      rotation: { x: rot[0], y: rot[1], z: rot[2], w: rot[3] },
      scale: { x: scl[0], y: scl[1], z: scl[2] },
    });
    this.scene.world.addComponent(entity, LocalTransform, localTransform);

    // 4. Add WorldTransform component
    this.scene.world.addComponent(entity, WorldTransform, new WorldTransform());

    // 5. Add Visible component
    const visible = new Visible();
    visible.value = true;
    this.scene.world.addComponent(entity, Visible, visible);

    return entity;
  }

  /**
   * Build interleaved vertex data from GeometryData
   * Layout: [pos.x, pos.y, pos.z, norm.x, norm.y, norm.z, uv.u, uv.v] per vertex
   * @param geometry Source geometry data
   * @returns Interleaved Float32Array
   */
  private buildInterleavedVertexData(geometry: GeometryData): Float32Array {
    const vertexCount = geometry.positions.length / 3;
    const floatsPerVertex = 8; // 3 (pos) + 3 (normal) + 2 (uv)
    const data = new Float32Array(vertexCount * floatsPerVertex);

    for (let i = 0; i < vertexCount; i++) {
      const offset = i * floatsPerVertex;

      // Position (3 floats)
      data[offset + 0] = geometry.positions[i * 3 + 0];
      data[offset + 1] = geometry.positions[i * 3 + 1];
      data[offset + 2] = geometry.positions[i * 3 + 2];

      // Normal (3 floats)
      if (geometry.normals) {
        data[offset + 3] = geometry.normals[i * 3 + 0];
        data[offset + 4] = geometry.normals[i * 3 + 1];
        data[offset + 5] = geometry.normals[i * 3 + 2];
      } else {
        data[offset + 3] = 0;
        data[offset + 4] = 1;
        data[offset + 5] = 0;
      }

      // UV (2 floats)
      if (geometry.uvs) {
        data[offset + 6] = geometry.uvs[i * 2 + 0];
        data[offset + 7] = geometry.uvs[i * 2 + 1];
      } else {
        data[offset + 6] = 0;
        data[offset + 7] = 0;
      }
    }

    return data;
  }

  // -------------------- Resource Loading (TODO) --------------------

  /**
   * Load glTF model
   * @param url Model URL
   * @returns glTF result
   *
   * @remarks
   * TODO: Implement when GLTFLoader is available
   */
  async loadGLTF(_url: string): Promise<unknown> {
    throw new Error('[Engine] loadGLTF not implemented yet');
  }

  /**
   * Load texture
   * @param url Texture URL
   * @returns Texture handle
   *
   * @remarks
   * TODO: Implement when TextureLoader is available
   */
  async loadTexture(_url: string): Promise<unknown> {
    throw new Error('[Engine] loadTexture not implemented yet');
  }

  /**
   * Load HDR environment map
   * @param url HDR file URL
   * @returns Texture handle
   *
   * @remarks
   * TODO: Implement when HDRLoader is available
   */
  async loadHDR(_url: string): Promise<unknown> {
    throw new Error('[Engine] loadHDR not implemented yet');
  }
}
