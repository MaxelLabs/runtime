---
# Identity
id: "core-max-object"
type: "reference"
title: "MaxObject - Base Engine Object Class"

# Semantics
description: "Abstract base class for engine objects providing unique ID generation, name/tag management, and lifecycle tracking."

# Graph
context_dependency: []
related_ids: ["core-component", "core-entity", "core-refer-resource"]
---

## 🔌 Interface First

### Core Interface
```typescript
import { IDisposable } from './disposable';

// MaxObject implements IDisposable interface
interface ObjectIdentity {
  readonly id: string;         // Unique identifier
  tag: string;                 // User-defined tag
  name: string;                // Object name
  readonly createTime: number; // Timestamp of creation
}

// Lifecycle with Disposable pattern
interface Lifecycle extends IDisposable {
  // Inherited from IDisposable:
  isDisposed(): boolean;       // Check disposal state (preferred)
  dispose(): void;             // Release resources

  // MaxObject extensions:
  isDestroyed(): boolean;      // @deprecated - use isDisposed()
  destroy(): void;             // @deprecated - use dispose()
  getId(): string;             // Get unique ID
}

// Protected Interface (for subclasses)
interface ProtectedLifecycle {
  protected type: string;      // Class type name
  protected _disposed: boolean; // Internal disposal flag
  protected onDispose(): void; // Cleanup callback (not "onDestroy")
  protected generateId(): string; // ID generation strategy
  protected static IdGenerator: object; // ID generation tool
}
```

### Key Change: Disposable Integration
```typescript
// NEW: MaxObject now implements IDisposable
abstract class MaxObject implements IDisposable {
  // Direct disposal with idempotent check
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.onDispose();  // Subclass hook
  }

  // Legacy methods (backward compatible)
  destroy(): void { this.dispose(); }
  isDestroyed(): boolean { return this._disposed; }

  // Name matches interface
  isDisposed(): boolean { return this._disposed; }
}
```

## ⚙️ Implementation Logic

### ID Generation Algorithm
```typescript
Pseudocode:
CLASS IdGenerator:
  private static counters: Map<string, number> = {}

  FUNCTION generate(type):
    count = (counters.get(type) ?? 0) + 1
    counters.set(type, count)
    RETURN `${type}_${count}`
    // Output: "Entity_1", "Texture_2", etc.

// MaxObject constructor:
FUNCTION():
  this.type = this.constructor.name
  this.id = IdGenerator.generate(this.type)
```

### Disposal Flow (Disposable Pattern)
```typescript
Pseudocode:
FUNCTION dispose():
  IF this._disposed: RETURN  // Idempotent

  this._disposed = true
  this.onDispose()  // Subclass cleanup

// Legacy methods (backward compatible):
FUNCTION destroy():
  this.dispose()  // Alias for dispose()

FUNCTION isDestroyed():
  RETURN this._disposed  // Same as isDisposed()
```

## 📚 Usage Examples

### Basic Object Creation
```typescript
class GameObject extends MaxObject {
  constructor() {
    super();
    this.name = "Untitled";
  }
}

const obj = new GameObject();
console.log(obj.getId()); // "GameObject_1734612345678_abc1234"
console.log(obj.createTime); // 1734612345678
```

### Resource Management
```typescript
class Texture extends MaxObject {
  protected data: WebGLTexture | null = null;

  constructor() {
    super();
    this.name = "Texture";
    this.tag = "gpu-resource";
  }

  protected onDispose(): void {
    if (this.data) {
      // Release GPU memory
      gl.deleteTexture(this.data);
      this.data = null;
    }
  }

  upload(image: HTMLImageElement): void {
    this.data = gl.createTexture();
    // ...
  }
}

const tex = new Texture();
tex.upload(image);
// Later...
tex.dispose();
// GPU memory automatically freed
```

### Inheritance Chain
```typescript
// MaxObject -> Component -> TransformComponent
class TransformComponent extends Component {
  position: Vector3 = new Vector3();

  protected override onDispose(): void {
    // Chain: Component.onDispose() -> MaxObject.onDispose()
    super.onDispose(); // Call parent cleanup
    this.position = null;
  }
}

const transform = new TransformComponent(entity);
// Unique ID includes full chain
// "TransformComponent_1734612345678_xyz789"
```

## 🚫 Negative Constraints

### Critical Restrictions
- 🚫 **DO NOT** override `constructor` without calling `super()`
- 🚫 **DO NOT** manually set `this.id` (readonly property)
- 🚫 **DO NOT** access `this.destroyed` directly from outside
- 🚫 **DO NOT** forget to call `super.onDispose()` in overrides
- 🚫 **DO NOT** create objects with empty type names

### Common Mistakes
```typescript
// ❌ WRONG: Not calling super
class BadObject extends MaxObject {
  constructor() {
    // Missing super() - runtime error
    this.name = "Bad";
  }
}

// ❌ WRONG: Manual ID modification
class WorseObject extends MaxObject {
  constructor() {
    super();
    this.id = "custom"; // Error: readonly property
  }
}

// ✅ CORRECT: Proper inheritance
class GoodObject extends MaxObject {
  constructor() {
    super(); // Always call first
    this.name = "Good";
  }

  protected override onDispose(): void {
    // Always call parent
    super.onDispose();
    // Custom cleanup here
  }
}
```

### Type Name Limitations
```typescript
class MyObject extends MaxObject {
  // Type name used in ID generation
  // If constructor name is empty/minified:
  // ❌ ID: "_1734612345678_abc1234"
  // ✅ Use: class MyObject {}
}
```

## 📊 Performance Analysis

### ID Generation Cost
```
Operation: IdGenerator.generate(type)
- Counter lookup: O(1) - Map.get()
- Counter increment: O(1)
- String format: O(n) where n = ~10-20 chars
- Total: ~20-30ns equivalent (BETTER than timestamp)
```

### Memory Footprint
```
Per MaxObject instance:
- id: string - ~20 bytes ("Entity_1", sequential)
- tag: string - ~16 bytes (avg)
- name: string - ~32 bytes (avg)
- type: string - ~16 bytes (constructor.name)
- createTime: number - 8 bytes
- _disposed: boolean - 1 byte
- Object overhead - ~32 bytes
Total: ~125 bytes per object (~14% reduction from v1.0)
```

### Lifecycle Optimization
```typescript
// ✅ Efficient pattern
const pool: MaxObject[] = [];
function createObject<T extends MaxObject>(Type: new () => T): T {
  if (pool.length > 0) {
    const obj = pool.pop()! as T;
    obj['_disposed'] = false; // Reset if tracking manually
    return obj;
  }
  return new Type();
}

// ❌ Anti-pattern: Creating many temporary objects
for (let i = 0; i < 1000; i++) {
  new MaxObject(); // 145KB memory waste
}
```

## 🔗 Architecture Patterns

### Base Class Hierarchy
```
MaxObject (abstract)
├── Entity (scene object)
├── Component (modular behavior)
├── ReferResource (reference counting)
│   └── Texture/Buffer (GPU resources)
└── EventDispatcher (event system)
```

### ID Uniqueness Guarantee
```typescript
// Type + auto-increment counter ensures global uniqueness
const obj1 = new Entity(); // Entity_1
const obj2 = new Entity(); // Entity_2
const obj3 = new Texture(); // Texture_1 (counter per type)
// Sequential counters, no collisions
```

### Destruction Safety Pattern
```typescript
// ✅ Safe cleanup chain (via MaxObject's onDispose):
class ComplexResource extends MaxObject {
  protected data: any;
  protected connections: Set<any>;

  protected override onDispose(): void {
    // Called by dispose()
    this.data = null;
    this.connections.clear();
    super.onDispose(); // Chain maintained
  }
}
```

## 🔍 Debugging Tips

### Object Tracking
```typescript
// Debug creation
const obj = new MaxObject();
console.log(`${obj.name} (${obj.id}) created at ${obj.createTime}`);

// Track disposal
obj.dispose = function() {
  console.log(`Disposing ${this.id}`);
  MaxObject.prototype.dispose.call(this);
};
```

### Memory Leak Detection
```typescript
// Objects not destroyed
const liveObjects: MaxObject[] = [];

const tracker = setInterval(() => {
  const leaked = liveObjects.filter(obj => !obj.isDisposed());
  if (leaked.length > 1000) {
    console.warn('Memory leak detected:', leaked.length);
  }
}, 5000);
```

### ID Collision Debug
```typescript
// Sequential counters prevent collisions
// But still useful to track all IDs
const ids = new Set<string>();
function trackId(id: string) {
  if (ids.has(id)) {
    console.error('ID Collision!', id); // Should never happen
  }
  ids.add(id);
}

const obj = new MaxObject();
trackId(obj.getId()); // Verify uniqueness
```

---

**Last Updated**: 2025-12-18
**Version**: 1.1.0 (IDisposable integration, IdGenerator optimization)
**Breaking Changes**: Method rename: onDestroy() → onDispose()
