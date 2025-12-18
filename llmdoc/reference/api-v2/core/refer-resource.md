---
# Identity
id: "core-refer-resource"
type: "reference"
title: "ReferResource - Reference Counting Resource Base"

# Semantics
description: "Resource base class with automatic reference counting for GPU resources, textures, buffers, and other assets."

# Graph
context_dependency: ["core-max-object"]
related_ids: ["core-max-object", "core-object-pool", "core-entity"]
---

## 🔌 Interface First

### Reference Counting Interface
```typescript
export interface IReferable {
  readonly refCount: number;
  addRef(): number;
  release(): number;
}

// Resource Properties
interface ResourceInfo {
  readonly url: string;        // Asset source
  readonly size: number;       // Memory size in bytes
  readonly isLoaded: boolean;  // Loading state
}
```

### ReferResource Class Interface
```typescript
abstract class ReferResource extends MaxObject implements IReferable {
  // Public - Reference count getter
  readonly refCount: number;

  // Resource Status
  isLoaded: boolean;

  // Protected - Subclass access
  protected url: string;
  protected size: number;

  // Lifecycle (from MaxObject - implements IDisposable)
  dispose(): void;             // NEW: Preferred
  isDisposed(): boolean;       // NEW: Preferred
  destroy(): void;             // Legacy alias
  isDestroyed(): boolean;      // Legacy alias

  // Reference Operations
  addRef(): number;
  release(): number;

  // Resource Interface
  setUrl(url: string): void;
  getUrl(): string;
  setSize(size: number): void;
  getSize(): number;
  loaded(): boolean;
  setLoaded(loaded: boolean): void;

  // Subclass Hook
  protected onResourceDispose(): void;  // Renamed from onResourceDestroy
}
```

## ⚙️ Implementation Logic

### Reference Counting Flow
```typescript
Pseudocode:
CLASS ReferResource:
  private referenceCount: number = 0
  protected isLoaded: boolean = false

  FUNCTION addRef():
    IF isDisposed():
      WARN "Adding ref to destroyed resource"
      RETURN referenceCount

    referenceCount++
    RETURN referenceCount

  FUNCTION release():
    IF isDisposed():
      RETURN 0

    referenceCount = max(0, referenceCount - 1)

    // Auto-dispose when ref count reaches 0 AND loaded
    IF referenceCount == 0 AND isLoaded:
      this.dispose()

    RETURN referenceCount
```

### Disposal Chain
```typescript
Pseudocode:
FUNCTION dispose():
  IF isDisposed():
    RETURN

  IF referenceCount > 0:
    WARN "Disposing resource with active references"

  // Subclass cleanup
  this.onResourceDispose()

  // Reset state
  this.isLoaded = false
  this.referenceCount = 0

  // MaxObject.dispose() - marks disposed flag
  super.dispose()
```

### Resource Loading State Flow
```typescript
Pseudocode:
Creation:
  new Texture() // refCount=0, isLoaded=false

Upload:
  upload() -> isLoaded=true

Usage:
  addRef()    // refCount=1
  addRef()    // refCount=2

Finish:
  release()   // refCount=1
  release()   // refCount=0 AND isLoaded=true

  // Auto-destroy triggered
  destroy() called automatically
```

## 📚 Usage Examples

### Texture Resource Management
```typescript
class Texture extends ReferResource {
  private glTexture: WebGLTexture | null = null;

  constructor() {
    super();
    this.name = "Texture";
  }

  upload(image: HTMLImageElement): void {
    this.glTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    this.setSize(image.width * image.height * 4); // RGBA
    this.setLoaded(true);
    this.addRef(); // Count as "in use"
  }

  protected override onResourceDestroy(): void {
    if (this.glTexture) {
      gl.deleteTexture(this.glTexture);
      this.glTexture = null;
    }
  }
}

// Usage
const texture = new Texture();
texture.setSize(1024 * 1024 * 4); // 4MB
texture.setLoaded(true);

texture.addRef(); // User 1
texture.addRef(); // User 2

// User 1 finished
texture.release(); // refCount=1

// User 2 finished
texture.release(); // refCount=0 -> destroyed
```

### Material System
```typescript
class Material extends ReferResource {
  private shader: Shader;
  private uniforms: Map<string, any> = new Map();

  constructor(shader: Shader) {
    super();
    this.shader = shader;
    this.name = `Material_${shader.name}`;
  }

  setUniform(name: string, value: any): void {
    this.uniforms.set(name, value);
  }

  use(): void {
    this.addRef(); // Track usage
    shader.use();
    // Apply uniforms
  }

  done(): void {
    this.release(); // Done with material
  }

  protected override onResourceDestroy(): void {
    this.uniforms.clear();
    // Shader is managed separately
  }
}

// Material pool pattern
const materials = new Map<string, Material>();
function getMaterial(id: string): Material {
  let mat = materials.get(id);
  if (!mat) {
    mat = new Material(shader);
    materials.set(id, mat);
  }
  mat.addRef(); // Caller takes ownership
  return mat;
}

function returnMaterial(mat: Material): void {
  mat.release(); // May auto-destroy if unused
}
```

### GPU Resource Pool with Reference Counting
```typescript
class BufferPool {
  private buffers: Map<string, WebGLBuffer> = new Map();
  private refCounts: Map<string, number> = new Map();

  createBuffer(id: string, size: number): WebGLBuffer {
    if (!this.buffers.has(id)) {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, size, gl.DYNAMIC_DRAW);
      this.buffers.set(id, buffer);
      this.refCounts.set(id, 0);
    }

    this.refCounts.set(id, this.refCounts.get(id)! + 1);
    return this.buffers.get(id)!;
  }

  releaseBuffer(id: string): void {
    const count = this.refCounts.get(id);
    if (count !== undefined) {
      const newCount = Math.max(0, count - 1);
      this.refCounts.set(id, newCount);

      if (newCount === 0) {
        // Clean up unused buffer
        const buffer = this.buffers.get(id);
        if (buffer) {
          gl.deleteBuffer(buffer);
          this.buffers.delete(id);
          this.refCounts.delete(id);
        }
      }
    }
  }
}
```

## 🚫 Negative Constraints

### Critical Restrictions
- 🚫 **DO NOT** manually modify `referenceCount`
- 🚫 **DO NOT** call `onResourceDestroy()` directly
- 🚫 **DO NOT** release resource that's not loaded (`isLoaded = false`)
- 🚫 **DO NOT** forget to call `super.destroy()` in overrides
- 🚫 **DO NOT** addRef after calling destroy

### Common Mistakes
```typescript
// ❌ WRONG: Calling private hook directly
const res = new ReferResource();
res.onResourceDestroy(); // Private method!

// ❌ WRONG: Forgetting setLoaded
const tex = new Texture();
tex.addRef(); // Works
tex.release(); // Won't destroy (isLoaded=false)

// ✅ CORRECT: Proper lifecycle
const tex = new Texture();
tex.upload(image); // Sets isLoaded=true
tex.addRef();      // User 1
tex.addRef();      // User 2
tex.release();     // User 1 done
tex.release();     // User 2 done -> destroyed

// ❌ WRONG: Double destroy
tex.destroy();     // First time
tex.destroy();     // Idempotent, but...

// For reference-counted objects, prefer release()
// If manually destroying, clear all references first
```

### Reference Counting Pitfalls
```typescript
// ❌ WRONG: Manual destroy without clearing refs
const tex = new Texture();
tex.addRef(); // refCount=1
tex.destroy(); // Warning logged, but still happens
// Memory leak: if context accesses it later

// ✅ CORRECT: Release all before destroy
const tex = new Texture();
tex.addRef();
// ... use texture ...
tex.release(); // refCount=0, destroys
```

## 📊 Performance Analysis

### Memory Tracking Overhead
```
Per ReferResource impact:
+~16 bytes: referenceCount
+~8 bytes: isLoaded flag
+~8 bytes: url string
+~8 bytes: size number
+~16 bytes: internal set overhead (Map/Set for refs)

Total overhead: ~56 bytes per resource
```

### Reference Count Efficiency
```
Operation Costs:
addRef():     O(1) - integer increment
release():    O(1) - integer decrement + conditional check
destroy():    O(n) - where n = resource-specific cleanup

Best suited for:
- GPU resources (Textures, Buffers)
- Shared materials
- Large assets that shouldn't duplicate
```

### Memory Trend Analysis
```
Scenario: Loading 100 textures, 20MB each

Bad Pattern (No ref counting):
- Leaked textures: 50% = 1GB waste
- Manual tracking required
- No automatic cleanup

Good Pattern (ReferResource):
- Created: 100 * (20MB + 1KB overhead)
- In-use: 60 active
- Auto-released: 40 freed automatically
- Total: 1.2GB + 5.6KB overhead
- Auto-cleanup keeps usage sane
```

## 🔗 Integration Patterns

### With Entity/Component System
```typescript
class SpriteComponent extends Component {
  private texture: Texture | null = null;

  setTexture(tex: Texture): void {
    if (this.texture) {
      this.texture.release(); // Release old
    }
    this.texture = tex;
    if (tex) {
      tex.addRef(); // New reference
    }
  }

  protected override onDestroy(): void {
    super.onDestroy();
    if (this.texture) {
      this.texture.release();
      this.texture = null;
    }
  }
}
```

### With Object Pool (Double-Buffering)
```typescript
// Scene loads texture, object pool reuses it
class TextureCache {
  private cache: Map<string, Texture> = new Map();

  getTexture(url: string): Texture {
    if (!this.cache.has(url)) {
      const tex = new Texture();
      tex.setUrl(url);
      this.cache.set(url, tex);
      // Note: refCount stays 0 for cache
    }

    const tex = this.cache.get(url)!;
    tex.addRef(); // User takes ownership
    return tex;
  }

  unloadUnused(): void {
    for (const [url, tex] of this.cache.entries()) {
      if (tex.refCount === 0) {
        tex.destroy();
        this.cache.delete(url);
      }
    }
  }
}
```

### GPU Resource Management APIs
```typescript
class RenderDevice {
  private textures: Map<string, Texture> = new Map();

  createTexture(id: string, desc: TextureDesc): Texture {
    const texture = new Texture();
    texture.setUrl(id);
    texture.setSize(desc.width * desc.height * 4);
    texture.setLoaded(true);

    this.textures.set(id, texture);
    return texture; // refCount=0
  }

  getTexture(id: string): Texture | null {
    const tex = this.textures.get(id);
    if (tex) {
      tex.addRef(); // External caller
    }
    return tex;
  }

  releaseTexture(id: string): void {
    const tex = this.textures.get(id);
    if (tex) {
      tex.release();
      if (tex.refCount === 0) {
        tex.destroy();
        this.textures.delete(id);
      }
    }
  }
}
```

## 🔍 Debugging & Monitoring

### Reference Tracking
```typescript
function trackResourceUsage<T extends ReferResource>(
  resource: T,
  context: string
): T {
  const originalAddRef = resource.addRef.bind(resource);
  const originalRelease = resource.release.bind(resource);

  resource.addRef = function(): number {
    const result = originalAddRef();
    console.log(`[${context}] addRef -> ${result}`);
    return result;
  };

  resource.release = function(): number {
    const result = originalRelease();
    console.log(`[${context}] release -> ${result}`);
    return result;
  };

  return resource;
}

// Usage
const tracked = trackResourceUsage(texture, "GameRenderer");
tracked.addRef(); // Logs: [GameRenderer] addRef -> 1
```

### Memory Leak Detection
```typescript
class ResourceMonitor {
  private static instance: ResourceMonitor;
  private resources: Set<ReferResource> = new Set();

  track(res: ReferResource): void {
    this.resources.add(res);
  }

  report(): void {
    let leaked = 0;
    const snapshot: string[] = [];

    for (const res of this.resources) {
      if (!res.isDestroyed() && res.refCount > 0) {
        leaked++;
        snapshot.push(`${res.name}: refCount=${res.refCount}`);
      }
    }

    console.log(`Leaked resources: ${leaked}`);
    snapshot.forEach(s => console.log(`  ${s}`));
  }
}

// Detect
setInterval(() => ResourceMonitor.instance.report(), 30000); // Every 30s
```

### Destruction Order Debug
```typescript
class LovelyTexture extends ReferResource {
  constructor(public id: number) {
    super();
  }

  protected override onResourceDestroy(): void {
    console.log(`Texture ${this.id} releasing GPU memory`);
    super.onResourceDestroy();
  }
}

// Monitor order
const tex1 = new LovelyTexture(1);
const tex2 = new LovelyTexture(2);

tex1.addRef(); tex2.addRef();
tex1.release(); // No destruction
tex2.release(); // Texture 2 destroyed
tex1.release(); // Texture 1 destroyed (order preserved)
```

---

**Last Updated**: 2025-12-18
**Version**: 1.0.0
