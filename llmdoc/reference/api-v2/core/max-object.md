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
// Base Object Properties
interface ObjectIdentity {
  readonly id: string;        // Unique identifier
  tag: string;                // User-defined tag
  name: string;               // Object name
  readonly createTime: number; // Timestamp of creation
}

// Lifecycle Interface
interface Lifecycle {
  isDestroyed(): boolean;      // Check destruction state
  destroy(): void;             // Release resources
  getId(): string;             // Get unique ID
}

// Protected Interface (for subclasses)
interface ProtectedLifecycle {
  protected type: string;      // Class type name
  protected destroyed: boolean; // Internal destruction flag
  protected onDestroy(): void; // Cleanup callback
  protected generateId(): string; // ID generation strategy
}
```

## ⚙️ Implementation Logic

### ID Generation Algorithm
```typescript
Pseudocode:
FUNCTION generateId():
  type = this.constructor.name  // e.g., "Entity", "Texture"
  timestamp = Date.now()        // Millisecond precision
  random = Math.random()        // 0-1 random string
  // Format: "EntityType_timestamp_random"
  RETURN `${type}_${timestamp}_${random.substring(2, 9)}`
```

### Destruction Flow
```typescript
Pseudocode:
FUNCTION destroy():
  IF this.destroyed:
    RETURN  // Idempotent

  this.destroyed = true
  this.onDestroy()  // Subclass cleanup

  // Base class does not call super.destroy()
  // Abstract class pattern
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

  protected onDestroy(): void {
    if (this.data) {
      // Release GPU memory
      gl.deleteTexture(this.data);
      this.data = null;
    }
  }

  upload(image: HTMLImageElement): void {
    // Upload texture logic
    this.data = gl.createTexture();
    // ...
  }
}

const tex = new Texture();
tex.upload(image);
// Later...
tex.destroy();
// GPU memory automatically freed
```

### Inheritance Chain
```typescript
// MaxObject -> Component -> TransformComponent
class TransformComponent extends Component {
  position: Vector3 = new Vector3();

  protected override onDestroy(): void {
    // Chain: Component.onDestroy() -> MaxObject.onDestroy()
    super.onDestroy(); // Call parent cleanup
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
- 🚫 **DO NOT** forget to call `super.onDestroy()` in overrides
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

  protected override onDestroy(): void {
    // Always call parent
    super.onDestroy();
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
Operation: generateId()
- Type name lookup: O(1) - cached by constructor.name
- Timestamp: O(1) - Date.now()
- Random string: O(1) - Math.random()
- String concatenation: O(n) where n = ~40 chars
- Total: ~50-100ns equivalent
```

### Memory Footprint
```
Per MaxObject instance:
- id: string - ~40 bytes (16 char type + timestamp + random)
- tag: string - ~16 bytes (avg)
- name: string - ~32 bytes (avg)
- type: string - ~16 bytes (constructor.name)
- createTime: number - 8 bytes
- destroyed: boolean - 1 byte
- Object overhead - ~32 bytes
Total: ~145 bytes per object
```

### Lifecycle Optimization
```typescript
// ✅ Efficient pattern
const pool: MaxObject[] = [];
function createObject<T extends MaxObject>(Type: new () => T): T {
  if (pool.length > 0) {
    const obj = pool.pop()! as T;
    obj.destroyed = false; // Reset if tracking manually
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
// Timestamp + Random + Type ensures uniqueness
// Even in concurrent creation (Event Loop)
const obj1 = new MaxObject(); // _1734612345000_aaa
const obj2 = new MaxObject(); // _1734612345001_bbb
// Millisecond precision + random prevents collision
```

### Destruction Safety Pattern
```typescript
// ✅ Safe cleanup chain:
class ComplexResource extends ReferResource {
  protected data: any;
  protected connections: Set<any>;

  protected override onResourceDestroy(): void {
    // Called by ReferResource.release()
    this.data = null;
    this.connections.clear();
    super.onResourceDestroy(); // Chain maintained
  }
}
```

## 🔍 Debugging Tips

### Object Tracking
```typescript
// Debug creation
const obj = new MaxObject();
console.log(`${obj.name} (${obj.id}) created at ${obj.createTime}`);

// Track destruction
obj.destroy = function() {
  console.log(`Destroying ${this.id}`);
  MaxObject.prototype.destroy.call(this);
};
```

### Memory Leak Detection
```typescript
// Objects not destroyed
const liveObjects: MaxObject[] = [];

const tracker = setInterval(() => {
  const leaked = liveObjects.filter(obj => !obj.isDestroyed());
  if (leaked.length > 1000) {
    console.warn('Memory leak detected:', leaked.length);
  }
}, 5000);
```

### ID Collision Debug
```typescript
// Rare case: Same millisecond creation
const ids = new Set<string>();
function trackId(id: string) {
  if (ids.has(id)) {
    console.error('ID Collision!', id);
  }
  ids.add(id);
});

const obj = new MaxObject();
trackId(obj.getId()); // Verify uniqueness
```

---

**Last Updated**: 2025-12-18
**Version**: 1.0.0
