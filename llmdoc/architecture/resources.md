---
id: "architecture-resources"
type: "architecture"
title: "Resource Management Architecture"
description: "Complete documentation of ResourceManager, resource lifecycle, reference counting, and loader system for mesh, texture, and material resources"
tags: ["resources", "lifecycle", "reference-counting", "loaders", "asset-management"]
context_dependency: ["constitution-core-runtime"]
related_ids: ["architecture-scene-systems", "architecture-components", "ref-data-models-core"]
---

## 📋 Context & Goal

**Context**: This document describes the ResourceManager system for loading, caching, and releasing GPU resources (meshes, textures, materials) with proper reference counting.

**Goal**: Provide comprehensive reference for resource lifecycle, loading patterns, and the extensible loader system.

**Key Features**:
- ✅ Reference counting for resource lifecycle
- ✅ Async loading with caching
- ✅ Extensible loader system
- ✅ GPU resource cleanup
- ✅ Error handling and state management

---

## 🔌 ResourceManager Interface

### Public API

```typescript
interface IResourceManager {
  // Loading
  loadMesh(uri: string): Promise<ResourceHandle>;
  loadTexture(uri: string): Promise<ResourceHandle>;
  loadMaterial(uri: string): Promise<ResourceHandle>;

  // Retrieval
  getMesh(handle: ResourceHandle): MeshResource | undefined;
  getTexture(handle: ResourceHandle): TextureResource | undefined;
  getMaterial(handle: ResourceHandle): MaterialResource | undefined;

  // Release
  release(handle: ResourceHandle): void;
  releaseAll(): void;

  // Extension
  registerLoader<T>(type: string, loader: ILoader<T>): void;

  // Lifecycle
  dispose(): void;
}
```

### ResourceHandle

```typescript
interface IResourceHandle {
  id: string;           // Unique identifier
  type: ResourceType;   // 'mesh' | 'texture' | 'material' | 'shader'
  uri: string;          // Original resource URI
}

enum ResourceType {
  Mesh = 'mesh',
  Texture = 'texture',
  Material = 'material',
  Shader = 'shader'
}

enum ResourceState {
  Loading = 'loading',
  Loaded = 'loaded',
  Failed = 'failed',
  Released = 'released'
}
```

---

## 🏗️ ResourceManager Implementation

### Core Structure

```typescript
export class ResourceManager implements IDisposable {
  private device: IRHIDevice | null = null;

  // Resource caches
  private meshes: Map<string, ResourceEntry<MeshResource>> = new Map();
  private textures: Map<string, ResourceEntry<TextureResource>> = new Map();
  private materials: Map<string, ResourceEntry<MaterialResource>> = new Map();

  // Custom loaders
  private loaders: Map<string, ILoader<unknown>> = new Map();

  // ID counter
  private resourceIdCounter: number = 0;

  // Lifecycle
  private _disposed: boolean = false;

  constructor(device?: IRHIDevice) {
    this.device = device ?? null;
  }

  setDevice(device: IRHIDevice): void {
    this.device = device;
  }

  isDisposed(): boolean {
    return this._disposed;
  }
}
```

### Internal Resource Entry

```typescript
interface ResourceEntry<T> {
  /** Resource data (null if loading failed) */
  data: T | null;

  /** Current state */
  state: ResourceState;

  /** Reference count */
  refCount: number;

  /** Loading promise (for concurrent requests) */
  loadPromise: Promise<T> | null;

  /** Error if loading failed */
  error: Error | null;
}
```

---

## 🔄 Resource Lifecycle

### Complete Lifecycle Flow

```pseudocode
FUNCTION ResourceManager.loadMesh(uri):
  1. Check if disposed
  2. Check cache
     ├─ If exists:
     │  ├─ Increment refCount
     │  ├─ Await existing loadPromise if loading
     │  └─ Return handle
     │
     └─ If not exists:
        ├─ Create new entry (state=Loading, refCount=1)
        ├─ Store in cache
        ├─ Start async load
        ├─ Await load completion
        └─ Return handle

FUNCTION ResourceManager.getMesh(handle):
  1. Validate handle type
  2. Look up entry by URI
  3. Return data or undefined

FUNCTION ResourceManager.release(handle):
  1. Decrement refCount
  2. If refCount <= 0:
     ├─ Destroy GPU resources
     ├─ Set state = Released
     ├─ Remove from cache
     └─ Clean up

FUNCTION ResourceManager.dispose():
  1. Release all resources
  2. Clear all caches
  3. Clear loaders
  4. Mark as disposed
```

### Reference Counting Example

```typescript
// Load resource (refCount = 1)
const handle = await resourceManager.loadMesh('cube.glb');

// Use in component
meshRef.assetId = handle.uri;

// Load again (same URI) - refCount = 2
const handle2 = await resourceManager.loadMesh('cube.glb');

// Release once (refCount = 1)
resourceManager.release(handle);

// Release again (refCount = 0, resource destroyed)
resourceManager.release(handle2);
```

---

## 📦 Mesh Resources

### MeshResource Interface

```typescript
interface IMeshResource {
  /** GPU vertex buffer */
  vertexBuffer: IRHIBuffer | null;

  /** GPU index buffer */
  indexBuffer: IRHIBuffer | null;

  /** Number of indices */
  indexCount: number;

  /** Number of vertices */
  vertexCount: number;

  /** Primitive type */
  primitiveType: 'triangles' | 'lines' | 'points';
}
```

### Loading Implementation

```typescript
async loadMesh(uri: string): Promise<ResourceHandle> {
  this.checkDisposed();

  // Check cache
  let entry = this.meshes.get(uri);
  if (entry) {
    entry.refCount++;
    if (entry.loadPromise) {
      await entry.loadPromise;
    }
    return this.createHandle(uri, ResourceType.Mesh);
  }

  // Create new entry
  entry = {
    data: null,
    state: ResourceState.Loading,
    refCount: 1,
    loadPromise: null,
    error: null,
  };
  this.meshes.set(uri, entry);

  // Start async load
  entry.loadPromise = this.doLoadMesh(uri, entry);
  await entry.loadPromise;

  return this.createHandle(uri, ResourceType.Mesh);
}

protected async doLoadMesh(uri: string, entry: ResourceEntry<MeshResource>): Promise<MeshResource> {
  // Try custom loader first
  const loader = this.loaders.get('mesh');
  if (loader) {
    try {
      const data = (await loader.load(uri, this.device!)) as MeshResource;
      entry.data = data;
      entry.state = ResourceState.Loaded;
      return data;
    } catch (error) {
      entry.state = ResourceState.Failed;
      entry.error = error instanceof Error ? error : new Error(String(error));
      throw entry.error;
    }
  }

  // Default: empty mesh
  const emptyMesh: MeshResource = {
    vertexBuffer: null,
    indexBuffer: null,
    indexCount: 0,
    vertexCount: 0,
    primitiveType: 'triangles',
  };
  entry.data = emptyMesh;
  entry.state = ResourceState.Loaded;
  return emptyMesh;
}
```

### Retrieval

```typescript
getMesh(handle: ResourceHandle): MeshResource | undefined {
  if (handle.type !== ResourceType.Mesh) {
    return undefined;
  }
  const entry = this.meshes.get(handle.uri);
  return entry?.data ?? undefined;
}
```

### Release

```typescript
private releaseMesh(uri: string): void {
  const entry = this.meshes.get(uri);
  if (!entry) return;

  entry.refCount--;
  if (entry.refCount <= 0) {
    // Destroy GPU resources
    if (entry.data) {
      entry.data.vertexBuffer?.destroy();
      entry.data.indexBuffer?.destroy();
    }
    entry.state = ResourceState.Released;
    this.meshes.delete(uri);
  }
}
```

---

## 🖼️ Texture Resources

### TextureResource Interface

```typescript
interface ITextureResource {
  /** GPU texture */
  texture: IRHITexture | null;

  /** Width in pixels */
  width: number;

  /** Height in pixels */
  height: number;

  /** Has mipmaps */
  hasMipmaps: boolean;
}
```

### Loading Implementation

```typescript
async loadTexture(uri: string): Promise<ResourceHandle> {
  this.checkDisposed();

  let entry = this.textures.get(uri);
  if (entry) {
    entry.refCount++;
    if (entry.loadPromise) {
      await entry.loadPromise;
    }
    return this.createHandle(uri, ResourceType.Texture);
  }

  entry = {
    data: null,
    state: ResourceState.Loading,
    refCount: 1,
    loadPromise: null,
    error: null,
  };
  this.textures.set(uri, entry);

  entry.loadPromise = this.doLoadTexture(uri, entry);
  await entry.loadPromise;

  return this.createHandle(uri, ResourceType.Texture);
}

protected async doLoadTexture(uri: string, entry: ResourceEntry<TextureResource>): Promise<TextureResource> {
  const loader = this.loaders.get('texture');
  if (loader) {
    try {
      const data = (await loader.load(uri, this.device!)) as TextureResource;
      entry.data = data;
      entry.state = ResourceState.Loaded;
      return data;
    } catch (error) {
      entry.state = ResourceState.Failed;
      entry.error = error instanceof Error ? error : new Error(String(error));
      throw entry.error;
    }
  }

  // Default: empty texture
  const emptyTexture: TextureResource = {
    texture: null,
    width: 1,
    height: 1,
    hasMipmaps: false,
  };
  entry.data = emptyTexture;
  entry.state = ResourceState.Loaded;
  return emptyTexture;
}
```

### Release

```typescript
private releaseTexture(uri: string): void {
  const entry = this.textures.get(uri);
  if (!entry) return;

  entry.refCount--;
  if (entry.refCount <= 0) {
    // Destroy GPU texture
    if (entry.data?.texture) {
      entry.data.texture.destroy();
    }
    entry.state = ResourceState.Released;
    this.textures.delete(uri);
  }
}
```

---

## 🎨 Material Resources

### MaterialResource Interface

```typescript
interface IMaterialResource {
  /** Shader ID */
  shaderId: string;

  /** Material properties */
  properties: Record<string, unknown>;

  /** Texture references */
  textures: Record<string, string>;  // name -> uri
}
```

### Loading Implementation

```typescript
async loadMaterial(uri: string): Promise<ResourceHandle> {
  this.checkDisposed();

  let entry = this.materials.get(uri);
  if (entry) {
    entry.refCount++;
    if (entry.loadPromise) {
      await entry.loadPromise;
    }
    return this.createHandle(uri, ResourceType.Material);
  }

  entry = {
    data: null,
    state: ResourceState.Loading,
    refCount: 1,
    loadPromise: null,
    error: null,
  };
  this.materials.set(uri, entry);

  entry.loadPromise = this.doLoadMaterial(uri, entry);
  await entry.loadPromise;

  return this.createHandle(uri, ResourceType.Material);
}

protected async doLoadMaterial(uri: string, entry: ResourceEntry<MaterialResource>): Promise<MaterialResource> {
  const loader = this.loaders.get('material');
  if (loader) {
    try {
      const data = (await loader.load(uri, this.device!)) as MaterialResource;
      entry.data = data;
      entry.state = ResourceState.Loaded;
      return data;
    } catch (error) {
      entry.state = ResourceState.Failed;
      entry.error = error instanceof Error ? error : new Error(String(error));
      throw entry.error;
    }
  }

  // Default: empty material
  const emptyMaterial: MaterialResource = {
    shaderId: 'default',
    properties: {},
    textures: {},
  };
  entry.data = emptyMaterial;
  entry.state = ResourceState.Loaded;
  return emptyMaterial;
}
```

### Release

```typescript
private releaseMaterial(uri: string): void {
  const entry = this.materials.get(uri);
  if (!entry) return;

  entry.refCount--;
  if (entry.refCount <= 0) {
    // Materials don't own GPU resources directly
    // Textures are managed separately
    entry.state = ResourceState.Released;
    this.materials.delete(uri);
  }
}
```

---

## 🔌 Loader System

### Loader Interface

```typescript
interface ILoader<T> {
  load(uri: string, device: IRHIDevice): Promise<T>;
}
```

### Custom Loader Example

```typescript
// GLTF Loader
class GLTFLoader implements ILoader<MeshResource> {
  async load(uri: string, device: IRHIDevice): Promise<MeshResource> {
    // 1. Fetch GLTF file
    const response = await fetch(uri);
    const gltf = await response.json();

    // 2. Load buffers
    const bufferPromises = gltf.buffers.map((buf: any) =>
      fetch(buf.uri).then(r => r.arrayBuffer())
    );
    const buffers = await Promise.all(bufferPromises);

    // 3. Parse mesh data
    const meshData = this.parseMesh(gltf, buffers);

    // 4. Create GPU buffers
    const vertexBuffer = device.createBuffer({
      usage: 'vertex',
      data: meshData.vertices
    });

    const indexBuffer = device.createBuffer({
      usage: 'index',
      data: meshData.indices
    });

    return {
      vertexBuffer,
      indexBuffer,
      indexCount: meshData.indices.length,
      vertexCount: meshData.vertices.length / 3,
      primitiveType: 'triangles'
    };
  }

  private parseMesh(gltf: any, buffers: ArrayBuffer[]): any {
    // GLTF parsing logic
    // ...
  }
}

// PNG Loader
class PNGLoader implements ILoader<TextureResource> {
  async load(uri: string, device: IRHIDevice): Promise<TextureResource> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);

    const texture = device.createTexture({
      width: bitmap.width,
      height: bitmap.height,
      format: 'rgba8',
      usage: ['textureBinding']
    });

    device.writeTexture(texture, bitmap);

    return {
      texture,
      width: bitmap.width,
      height: bitmap.height,
      hasMipmaps: false
    };
  }
}

// JSON Material Loader
class JSONMaterialLoader implements ILoader<MaterialResource> {
  async load(uri: string, device: IRHIDevice): Promise<MaterialResource> {
    const response = await fetch(uri);
    const json = await response.json();

    return {
      shaderId: json.shader ?? 'default',
      properties: json.properties ?? {},
      textures: json.textures ?? {}
    };
  }
}
```

### Registration

```typescript
const resourceManager = new ResourceManager(device);

// Register loaders
resourceManager.registerLoader('mesh', new GLTFLoader());
resourceManager.registerLoader('texture', new PNGLoader());
resourceManager.registerLoader('material', new JSONMaterialLoader());

// Or register custom types
resourceManager.registerLoader('audio', new AudioLoader());
resourceManager.registerLoader('font', new FontLoader());
```

---

## 🎯 Usage Patterns

### Basic Usage

```typescript
// Initialize
const resourceManager = new ResourceManager(webglDevice);

// Register loaders
resourceManager.registerLoader('mesh', new GLTFLoader());
resourceManager.registerLoader('texture', new PNGLoader());

// Load resources
const cubeHandle = await resourceManager.loadMesh('models/cube.glb');
const diffuseHandle = await resourceManager.loadTexture('textures/diffuse.png');
const materialHandle = await resourceManager.loadMaterial('materials/standard.json');

// Use in components
scene.world.addComponent(entity, MeshRef, MeshRef.fromData({
  assetId: cubeHandle.uri
}));

scene.world.addComponent(entity, MaterialRef, MaterialRef.fromData({
  assetId: materialHandle.uri
}));

// Release when done
resourceManager.release(cubeHandle);
resourceManager.release(diffuseHandle);
resourceManager.release(materialHandle);
```

### Scene Integration

```typescript
// Scene can own a ResourceManager
class Scene {
  private resourceManager: ResourceManager;

  constructor(options: SceneConfig) {
    // ...
    this.resourceManager = new ResourceManager(options.device);
    this.setupLoaders();
  }

  private setupLoaders(): void {
    this.resourceManager.registerLoader('mesh', new GLTFLoader());
    this.resourceManager.registerLoader('texture', new PNGLoader());
    // ...
  }

  // Load scene with assets
  async loadSceneData(data: ISceneData): Promise<void> {
    // Load all assets referenced in scene
    if (data.assets) {
      for (const asset of data.assets) {
        if (asset.preload) {
          switch (asset.type) {
            case 'mesh':
              await this.resourceManager.loadMesh(asset.uri);
              break;
            case 'texture':
              await this.resourceManager.loadTexture(asset.uri);
              break;
            case 'material':
              await this.resourceManager.loadMaterial(asset.uri);
              break;
          }
        }
      }
    }

    // Then load scene entities
    Scene.fromData(data, { device: this.device });
  }

  dispose(): void {
    this.resourceManager.dispose();
    // ... rest of disposal
  }
}
```

### Component Integration

```typescript
// MeshRef component uses resource handle
class MeshRef extends Component {
  assetId: string = '';

  // Runtime: resolved mesh resource
  private _meshHandle?: ResourceHandle;
  private _meshResource?: MeshResource;

  // Called when component is added to entity
  onAddedToEntity(entity: EntityId, scene: Scene): void {
    // Load mesh
    scene.resourceManager.loadMesh(this.assetId)
      .then(handle => {
        this._meshHandle = handle;
        this._meshResource = scene.resourceManager.getMesh(handle);
      })
      .catch(error => {
        console.error(`Failed to load mesh ${this.assetId}:`, error);
      });
  }

  // Called when component is removed
  onRemovedFromEntity(entity: EntityId, scene: Scene): void {
    if (this._meshHandle) {
      scene.resourceManager.release(this._meshHandle);
      this._meshHandle = undefined;
      this._meshResource = undefined;
    }
  }

  get mesh(): MeshResource | undefined {
    return this._meshResource;
  }
}
```

---

## 📊 Resource States

### State Machine

```typescript
// Initial state
Loading
  ↓ (success)
Loaded
  ↓ (release with refCount > 0)
Loaded (refCount decremented)
  ↓ (release with refCount = 0)
Released

// Error path
Loading
  ↓ (failure)
Failed
  ↓ (retry)
Loading
```

### State Checking

```typescript
// Check if resource is ready
function isResourceReady(resourceManager: ResourceManager, handle: ResourceHandle): boolean {
  const entry = getEntry(resourceManager, handle);
  return entry?.state === ResourceState.Loaded && entry.data !== null;
}

// Wait for resource
async function waitForResource(resourceManager: ResourceManager, handle: ResourceHandle): Promise<void> {
  const entry = getEntry(resourceManager, handle);
  if (entry?.loadPromise) {
    await entry.loadPromise;
  }
}

// Get resource or undefined
function getSafeResource<T>(resourceManager: ResourceManager, handle: ResourceHandle): T | undefined {
  if (!isResourceReady(resourceManager, handle)) {
    return undefined;
  }
  return resourceManager.getMesh(handle) as T;
}
```

---

## 🚫 Error Handling

### Loading Errors

```typescript
try {
  const handle = await resourceManager.loadMesh('missing.glb');
} catch (error) {
  // Handle network errors, parse errors, etc.
  console.error('Load failed:', error);

  // Entry is marked as Failed
  // Can retry by calling loadMesh again
}
```

### Resource Not Found

```typescript
const mesh = resourceManager.getMesh(handle);
if (!mesh) {
  // Resource not loaded or already released
  // Use fallback or placeholder
  mesh = createPlaceholderMesh();
}
```

### Device Not Set

```typescript
const manager = new ResourceManager();
// Later...
try {
  await manager.loadMesh('cube.glb');  // ❌ No device
} catch (error) {
  // Error: device required for loader
}
```

---

## 🎯 Best Practices

### 1. Reference Counting

```typescript
// ✅ GOOD: Balance load/release
const handle = await manager.loadMesh('model.glb');
try {
  // Use resource
} finally {
  manager.release(handle);  // Always release
}

// ❌ BAD: Memory leak
const handle = await manager.loadMesh('model.glb');
// Forgot to release - resource stays in cache forever
```

### 2. Concurrent Loading

```typescript
// ✅ GOOD: Load multiple resources in parallel
const [meshHandle, textureHandle, materialHandle] = await Promise.all([
  manager.loadMesh('cube.glb'),
  manager.loadTexture('diffuse.png'),
  manager.loadMaterial('standard.json')
]);

// ❌ BAD: Sequential loading (slower)
const meshHandle = await manager.loadMesh('cube.glb');
const textureHandle = await manager.loadTexture('diffuse.png');
const materialHandle = await manager.loadMaterial('standard.json');
```

### 3. Error Recovery

```typescript
// ✅ GOOD: Retry on failure
async function loadWithRetry(uri: string, retries = 3): Promise<ResourceHandle> {
  for (let i = 0; i < retries; i++) {
    try {
      return await manager.loadMesh(uri);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 100 * (i + 1)));
    }
  }
  throw new Error('Unreachable');
}
```

### 4. Resource Sharing

```typescript
// ✅ GOOD: Multiple entities share same resource
const handle = await manager.loadMesh('cube.glb');

scene.world.addComponent(entity1, MeshRef, { assetId: handle.uri });
scene.world.addComponent(entity2, MeshRef, { assetId: handle.uri });
scene.world.addComponent(entity3, MeshRef, { assetId: handle.uri });

// Only one copy in memory, refCount = 3
```

---

## 📊 Performance Considerations

### Memory Management

```typescript
// Monitor resource usage
function logResourceStats(manager: ResourceManager): void {
  const stats = manager.getStats();
  console.log(`Meshes: ${stats.meshCount}`);
  console.log(`Textures: ${stats.textureCount}`);
  console.log(`Materials: ${stats.materialCount}`);
  console.log(`Loaders: ${stats.loaderCount}`);
}

// Periodic cleanup
function cleanupUnusedResources(manager: ResourceManager): void {
  // Release resources with refCount = 0
  // (Handled automatically by release())
}
```

### Loading Optimization

```typescript
// Preload common resources
async function preloadResources(manager: ResourceManager): Promise<void> {
  await Promise.all([
    manager.loadMesh('common/cube.glb'),
    manager.loadMesh('common/sphere.glb'),
    manager.loadTexture('common/white.png'),
    manager.loadMaterial('common/default.json')
  ]);
}

// Lazy load rare resources
async function loadOnDemand(manager: ResourceManager, uri: string): Promise<ResourceHandle> {
  // Check if already loaded
  const handle = createHandle(uri, ResourceType.Mesh);
  const existing = manager.getMesh(handle);
  if (existing) return handle;

  // Load only when needed
  return await manager.loadMesh(uri);
}
```

---

## ✅ Compliance Checklist

### ResourceManager
- [ ] Implements IDisposable interface
- [ ] Manages three resource types (mesh, texture, material)
- [ ] Uses reference counting
- [ ] Provides async loading
- [ ] Caches loaded resources
- [ ] Destroys GPU resources on release
- [ ] Handles errors gracefully
- [ ] Supports custom loaders
- [ ] Provides stats/getters

### Resource Types
- [ ] MeshResource has GPU buffers
- [ ] TextureResource has GPU texture
- [ ] MaterialResource has shader + properties
- [ ] All use proper interfaces

### Loader System
- [ ] ILoader interface defined
- [ ] registerLoader method implemented
- [ ] Custom loaders can be registered
- [ ] Default loaders provide fallbacks

### Lifecycle
- [ ] Loading increments refCount
- [ ] Concurrent requests share promise
- [ ] Release decrements refCount
- [ ] Release at 0 destroys resources
- [ ] Dispose clears everything

### Error Handling
- [ ] Failed state tracked
- [ ] Errors propagated
- [ ] Retry possible
- [ ] Fallback resources provided

---

## 📚 Related Documents

- **Scene Architecture**: `architecture-scene-systems` - Scene integration
- **Component Architecture**: `architecture-components` - Component usage
- **Constitution**: `constitution-core-runtime` - Design rules
- **Specification**: `ref-data-models-core` - Resource interfaces