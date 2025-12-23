---
id: "reference-shared-utilities"
type: "reference"
title: "Shared Utilities Reference"
description: "ECS-optimized data structures, GPU memory layout tools, and resource management utilities for the Max runtime"
tags: ["utilities", "ecs", "memory-management", "webgl", "performance"]
related_ids: ["reference-ecs-core", "reference-rhi-pipeline"]
---

## 📋 Overview

This document provides a comprehensive reference for shared utilities used across the Max runtime. These utilities are optimized for ECS (Entity Component System) architecture, GPU memory management, and high-performance scenarios.

**Don't Reinvent**: These utilities are battle-tested and optimized. Use them instead of creating custom implementations.

---

## 🔌 Core Package Utilities

### BitSet

**Purpose**: Efficient bit operations for ECS component masking and set operations.

**Key Interfaces**:
```typescript
class BitSet {
  constructor(capacity: number = 64)

  // Core operations
  set(index: number): this
  clear(index: number): this
  has(index: number): boolean

  // Set operations
  and(other: BitSet): BitSet
  or(other: BitSet): BitSet
  xor(other: BitSet): BitSet
  not(): BitSet

  // Performance
  count(): number
  isEmpty(): boolean
}
```

**Usage Pattern**:
```typescript
// ECS component matching
const componentMask = new BitSet(128);
componentMask.set(5);  // Position component
componentMask.set(10); // Velocity component

// System query
const query = new BitSet(128);
query.set(5);
query.set(10);

if (componentMask.and(query).count() === query.count()) {
  // Entity matches query
}
```

**Performance Notes**:
- O(1) for single bit operations
- O(n) for iteration (n = set size, not capacity)
- Uses Uint32Array internally for compact storage

---

### ObjectPool & ObjectPoolManager

**Purpose**: Reduce memory allocation pressure by reusing objects.

**Key Interfaces**:
```typescript
interface CoreObjectPoolStats {
  poolId: string;
  available: number;
  inUse: number;
  total: number;
  efficiency: number;
}

class ObjectPool<T extends object> {
  constructor(
    name: string,
    factory: () => T,
    reset: (obj: T) => void,
    initialSize: number = 0,
    maxSize: number = 1000
  )

  get(): T
  release(obj: T): boolean
  preAllocate(count: number): void
  warmUp(count: number): { success: boolean; count: number }
  getStatus(): CoreObjectPoolStats
}

class ObjectPoolManager extends EventDispatcher {
  static getInstance(): ObjectPoolManager

  createPool<T extends object>(
    id: string,
    factory: () => T,
    resetFunc: (obj: T) => void,
    options?: ObjectPoolOptions
  ): ObjectPool<T>

  getPool<T extends object>(id: string): ObjectPool<T> | null
  analyzePerformance(force?: boolean): Map<string, CoreObjectPoolStats> | null
}
```

**Usage Pattern**:
```typescript
// Create pool for Transform components
const transformPool = ObjectPoolManager.getInstance().createPool(
  'transform',
  () => ({ position: {x:0,y:0,z:0}, rotation: {x:0,y:0,z:0,w:1}, scale: {x:1,y:1,z:1} }),
  (obj) => {
    obj.position.x = obj.position.y = obj.position.z = 0;
    obj.rotation.x = obj.rotation.y = obj.rotation.z = 0; obj.rotation.w = 1;
    obj.scale.x = obj.scale.y = obj.scale.z = 1;
  },
  { initialCapacity: 100, maxSize: 1000 }
);

// Use in ECS system
const transform = transformPool.get();
// ... use transform ...
transformPool.release(transform);
```

**Critical Constraints**:
- 🚫 **Only supports object types** (no primitives: number, string, boolean)
- 🚫 **Cannot pool null or undefined**
- ✅ **Must call release()** to return objects to pool
- ⚠️ **Verify object origin** - only release objects from the same pool

---

### SparseSet & SparseMap

**Purpose**: O(1) integer set/map operations for ECS entity management.

**Key Interfaces**:
```typescript
class SparseSet {
  constructor(capacity: number = 1024)

  add(value: number): boolean
  remove(value: number): boolean
  has(value: number): boolean

  // Set operations
  intersection(other: SparseSet): SparseSet
  union(other: SparseSet): SparseSet
  difference(other: SparseSet): SparseSet

  // Iteration
  [Symbol.iterator](): Iterator<number>
  forEach(callback: (value: number, index: number) => void): void
}

class SparseMap<T> {
  constructor(capacity: number = 1024)

  set(key: number, value: T): void
  get(key: number): T | undefined
  has(key: number): boolean
  delete(key: number): boolean

  // Iteration
  keys(): number[]
  values(): T[]
  [Symbol.iterator](): Iterator<[number, T]>
}
```

**Usage Pattern**:
```typescript
// Entity management
const activeEntities = new SparseSet(10000);
activeEntities.add(1234);
activeEntities.add(5678);

// Component storage
const positions = new SparseMap<Vector3>(10000);
positions.set(1234, { x: 10, y: 20, z: 0 });

// Fast iteration
for (const entityId of activeEntities) {
  const pos = positions.get(entityId);
  // Process entity...
}
```

**Performance Notes**:
- O(1) add/remove/lookup operations
- Cache-friendly dense array storage
- Ideal for sparse entity-component mappings

---

### Error System

**Purpose**: Centralized error collection and logging.

**Key Interfaces**:
```typescript
interface ErrorInfo {
  message: string;
  component?: string;
  timestamp: number;
  stack?: string;
  level: 'error' | 'warning';
}

interface ErrorConfig {
  maxErrorCount: number;
  maxWarningCount: number;
}

// Global functions
configureErrors(config: Partial<ErrorConfig>): void
logError(message: string, component?: string, error?: Error): never
logWarning(message: string, component?: string): void
clearAll(): void
```

**Usage Pattern**:
```typescript
// Configuration
configureErrors({ maxErrorCount: 500, maxWarningCount: 1000 });

// Error handling
try {
  riskyOperation();
} catch (error) {
  logError('Operation failed', 'ComponentRegistry', error);
}

// Warning for non-critical issues
logWarning('Deprecated API used', 'LegacySystem');

// Check for errors
if (errors.length > 0) {
  console.error('System has', errors.length, 'errors');
}
```

---

### Hierarchy Utilities

**Purpose**: Generic tree operations for scene graphs and entity hierarchies.

**Key Functions**:
```typescript
checkCircularReference<T>(
  node: T,
  potentialAncestor: T,
  getParent: (node: T) => T | null
): boolean

isAncestorOf<T>(
  potentialAncestor: T,
  node: T,
  getParent: (node: T) => T | null
): boolean

getAncestors<T>(
  node: T,
  getParent: (node: T) => T | null
): T[]

findCommonAncestor<T>(
  nodeA: T,
  nodeB: T,
  getParent: (node: T) => T | null
): T | null
```

**Usage Pattern**:
```typescript
// Scene graph validation
const parent = entity.getParent();
if (checkCircularReference(parent, entity, (e) => e.getParent())) {
  throw new Error('Circular reference detected');
}

// Transform hierarchy
const ancestors = getAncestors(entity, (e) => e.getParent());
for (const ancestor of ancestors) {
  // Apply world transforms...
}
```

---

### Time Manager

**Purpose**: Frame-independent timing with time scaling support.

**Key Class**:
```typescript
class Time {
  // Configuration
  timeScale: number = 1.0;
  fixedDeltaTime: number = 0.02;
  maximumDeltaTime: number = 0.3333333;

  // Read-only properties
  deltaTime: number;        // seconds, affected by timeScale
  unscaledDelta: number;    // seconds, unaffected by timeScale
  currentTime: number;      // seconds, affected by timeScale
  timeSinceStartup: number; // seconds, unaffected by timeScale
  frame: number;
  fps: number;

  // Methods
  update(deltaTimeMs: number): void;
  needFixedUpdate(): boolean;
  performFixedUpdate(): void;
  reset(): void;
}
```

**Usage Pattern**:
```typescript
const time = new Time();

// Game loop
function gameLoop(timestamp: number) {
  const deltaMs = timestamp - lastTimestamp;
  time.update(deltaMs);

  // Update logic with frame-independent movement
  position.x += velocity * time.deltaTime;

  // Fixed update for physics
  while (time.needFixedUpdate()) {
    physicsStep(time.fixedDeltaTime);
    time.performFixedUpdate();
  }

  lastTimestamp = timestamp;
  requestAnimationFrame(gameLoop);
}
```

---

## 🧮 Math Extension Utilities

### Type Definitions

**Purpose**: Type-safe math interfaces for GPU-compatible data structures.

**Key Interfaces**:
```typescript
// Vector types
interface Vector2Like { x: number; y: number; }
interface Vector3Like { x: number; y: number; z: number; }
interface Vector4Like { x: number; y: number; z: number; w: number; }

// Matrix types (column-major)
interface Matrix2Like { m00: number; m01: number; m10: number; m11: number; }
interface Matrix3Like { m00: number; m01: number; m02: number; m10: number; m11: number; m12: number; m20: number; m21: number; m22: number; }
interface Matrix4Like { m00: number; m01: number; m02: number; m03: number; m10: number; m11: number; m12: number; m13: number; m20: number; m21: number; m22: number; m23: number; m30: number; m31: number; m32: number; m33: number; }

// Other geometric types
interface QuaternionLike { x: number; y: number; z: number; w: number; }
interface ColorLike { r: number; g: number; b: number; a: number; }
interface Box2Like { min: Vector2Like; max: Vector2Like; }
interface Box3Like { min: Vector3Like; max: Vector3Like; }
```

**Usage Pattern**:
```typescript
// Type-safe function signatures
function transformPoint(matrix: Matrix4Like, point: Vector3Like): Vector3Like {
  return {
    x: matrix.m00 * point.x + matrix.m01 * point.y + matrix.m02 * point.z + matrix.m03,
    y: matrix.m10 * point.x + matrix.m11 * point.y + matrix.m12 * point.z + matrix.m13,
    z: matrix.m20 * point.x + matrix.m21 * point.y + matrix.m22 * point.z + matrix.m23
  };
}
```

---

## 🎨 RHI/WebGL Utilities

### GLUtils

**Purpose**: WebGL format conversion and extension management.

**Key Class**:
```typescript
class WebGLUtils {
  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext, extension?: Record<string, any>)

  // Format conversions
  textureFormatToGL(format: RHITextureFormat): {
    internalFormat: number;
    format: number;
    type: number;
  }

  addressModeToGL(mode: RHIAddressMode): GLenum
  filterModeToGL(mode: RHIFilterMode, useMipmap?: boolean): number
  compareFunctionToGL(func: RHICompareFunction): number
  vertexFormatToGL(format: RHIVertexFormat): { type: number; size: number; normalized: boolean }
  blendFactorToGL(factor: RHIBlendFactor): number
  blendOperationToGL(operation: RHIBlendOperation): number
  primitiveTopologyToGL(topology: RHIPrimitiveTopology): number
  cullModeToGL(mode: RHICullMode): { enable: boolean; mode: number }
  stencilOperationToGL(operation: RHIStencilOperation): number

  // Extension management
  getExtension(name: string): any
}
```

**Usage Pattern**:
```typescript
const glUtils = new WebGLUtils(gl);

// Convert RHI format to WebGL
const glFormat = glUtils.textureFormatToGL(RHITextureFormat.RGBA16_FLOAT);
gl.texImage2D(
  gl.TEXTURE_2D,
  0,
  glFormat.internalFormat,
  width, height,
  0,
  glFormat.format,
  glFormat.type,
  data
);
```

**Performance Notes**:
- Extension loading is cached
- Format conversion includes fallback logic
- WebGL2 features automatically detected

---

### Std140Layout

**Purpose**: GPU uniform buffer layout calculation for std140 packing rules.

**Key Interfaces**:
```typescript
interface Std140FieldDefinition {
  name: string;
  type: RHIUniformType;
  arrayLength?: number;
}

interface Std140FieldLayout {
  name: string;
  type: RHIUniformType;
  offset: number;
  size: number;
  alignment: number;
  arrayLength?: number;
  arrayStride?: number;
}

interface Std140Layout {
  fields: Std140FieldLayout[];
  totalSize: number;
  fieldMap: Map<string, Std140FieldLayout>;
}

class Std140Calculator {
  static calculateLayout(fields: Std140FieldDefinition[]): Std140Layout
  static createBuffer(layout: Std140Layout): Float32Array
  static writeField(
    buffer: Float32Array | Int32Array | Uint32Array,
    layout: Std140Layout,
    fieldName: string,
    data: number | number[] | Float32Array
  ): void
}
```

**Usage Pattern**:
```typescript
// Define UBO structure
const fields = [
  { name: 'modelMatrix', type: RHIUniformType.MAT4 },
  { name: 'viewMatrix', type: RHIUniformType.MAT4 },
  { name: 'lightPositions', type: RHIUniformType.VEC3, arrayLength: 8 },
];

const layout = Std140Calculator.calculateLayout(fields);
const buffer = Std140Calculator.createBuffer(layout);

// Write data
Std140Calculator.writeField(buffer, layout, 'modelMatrix', modelMatrixData);
Std140Calculator.writeField(buffer, layout, 'lightPositions', lightPositionsData);

// Upload to GPU
gl.bufferData(gl.UNIFORM_BUFFER, buffer, gl.DYNAMIC_DRAW);
```

**Std140 Rules Implemented**:
- Scalars: 4-byte alignment
- Vectors: vec2=8, vec3=16, vec4=16 bytes
- Matrices: 16-byte column alignment
- Arrays: 16-byte element stride
- Structs: Alignment = max member alignment

---

### ResourceTracker

**Purpose**: WebGL resource lifecycle management and leak detection.

**Key Interfaces**:
```typescript
interface IDestroyable {
  destroy(): void;
  label?: string;
}

enum ResourceType {
  BUFFER, TEXTURE, SAMPLER, SHADER, PIPELINE,
  BIND_GROUP, BIND_GROUP_LAYOUT, PIPELINE_LAYOUT,
  QUERY_SET, COMMAND_ENCODER, OTHER
}

interface ResourceStats {
  byType: Record<ResourceType, number>;
  total: number;
  potentialLeaks: number;
}

class ResourceTracker {
  constructor(label?: string, enabled?: boolean)

  register(resource: { destroy(): void }, type?: ResourceType): void
  unregister(resource: { destroy(): void }): boolean
  isRegistered(resource: { destroy(): void }): boolean

  getStats(): ResourceStats
  getResources(type?: ResourceType): IDestroyable[]

  destroyAll(silent?: boolean): number
  reportLeaks(): void

  enable(): void
  disable(): void
}
```

**Usage Pattern**:
```typescript
const tracker = new ResourceTracker('MyRenderer');

// Resources automatically register
const buffer = device.createBuffer(descriptor);
tracker.register(buffer, ResourceType.BUFFER);

// On cleanup
tracker.reportLeaks(); // Check for leaks
tracker.destroyAll();  // Clean shutdown

// Or individual cleanup
buffer.destroy(); // Should call tracker.unregister(buffer)
```

**Resource Destruction Order**:
1. Command Encoders
2. Bind Groups
3. Pipelines
4. Bind Group Layouts
5. Pipeline Layouts
6. Query Sets
7. Shaders
8. Samplers
9. Textures
10. Buffers

---

## 📊 Performance Guidelines

### Memory Management

**Object Pool Strategy**:
- Pre-allocate pools for frequently created/destroyed objects
- Use `warmUp()` during loading screens
- Monitor `efficiency` metric (target > 0.8)

**SparseSet vs Array**:
- Use SparseSet for sparse entity IDs (0-10000 range)
- Use Array for dense, sequential data
- SparseSet: O(1) operations, 4x memory overhead
- Array: O(n) search, minimal overhead

### GPU Memory

**Buffer Management**:
- Use Std140Layout for UBOs to ensure compatibility
- Prefer 16-byte aligned data structures
- Batch buffer updates when possible

**Texture Format Fallbacks**:
- GLUtils automatically handles format degradation
- RGBA8_UNORM is the universal fallback
- Check console warnings for format changes

### Error Handling

**Error System Limits**:
- Default: 1000 errors, 500 warnings
- Old entries are automatically removed
- Use `clearAll()` between scenes/tests

---

## 🚫 Negative Constraints

### Don't Do This

**Object Pool**:
```typescript
// ❌ WRONG - Cannot pool primitives
const numberPool = new ObjectPool<number>(...);

// ❌ WRONG - Forgetting to release
const obj = pool.get();
// ... use obj ...
// Missing: pool.release(obj);

// ❌ WRONG - Releasing to wrong pool
poolA.release(poolB.get());
```

**SparseSet**:
```typescript
// ❌ WRONG - Using non-integer keys
set.add(3.14); // Works but undefined behavior
set.add(-1);   // Works but check capacity

// ❌ WRONG - Not checking capacity
const set = new SparseSet(100);
set.add(1000); // Will grow, but inefficient
```

**Std140Layout**:
```typescript
// ❌ WRONG - Using sampler types in UBO
const fields = [
  { name: 'sampler', type: RHIUniformType.SAMPLER_2D } // Not supported!
];

// ❌ WRONG - Ignoring alignment
const layout = calculateLayout(fields);
// Missing: buffer must be Float32Array with correct size
```

**ResourceTracker**:
```typescript
// ❌ WRONG - Not registering resources
const buffer = gl.createBuffer();
// Missing: tracker.register(buffer, ResourceType.BUFFER);

// ❌ WRONG - Manual destroy without unregister
gl.deleteBuffer(buffer);
// Missing: tracker.unregister(buffer);
```

### Performance Warnings

**Time Manager**:
- Don't call `update()` multiple times per frame
- `maximumDeltaTime` prevents time jumps - don't set too high
- `timeScale = 0` pauses physics but not rendering

**Error System**:
- `logError()` always throws - use for critical errors only
- `logWarning()` for non-fatal issues
- Excessive errors impact performance

**GLUtils**:
- Format conversion includes console warnings - check in production
- Extension loading happens once - cache results
- Fallbacks may impact visual quality

---

## ✅ Best Practices

### When to Use Each Utility

| Problem | Utility | Why |
|---------|---------|-----|
| Component masking | `BitSet` | O(1) operations, compact |
| Object lifecycle | `ObjectPool` | Reduce GC pressure |
| Entity ID tracking | `SparseSet` | O(1) add/remove/lookup |
| Scene hierarchy | `Hierarchy Utils` | Generic, reusable |
| Frame timing | `Time` | Time scaling, fixed updates |
| Error collection | `Error System` | Centralized, configurable |
| GPU buffer layout | `Std140Layout` | std140 compliance |
| Resource leaks | `ResourceTracker` | Automatic detection |

### Integration Checklist

- [ ] Configure error limits for your use case
- [ ] Pre-warm object pools during loading
- [ ] Use ResourceTracker in development builds
- [ ] Validate Std140 layouts before GPU upload
- [ ] Check GLUtils console warnings for format fallbacks
- [ ] Monitor pool efficiency metrics
- [ ] Use Time.deltaTime for all movement calculations

---

## 🔗 Related Documents

- **reference-ecs-core**: ECS architecture and component system
- **reference-rhi-pipeline**: Rendering pipeline and GPU resources
- **architecture-data-flow**: System data flow patterns