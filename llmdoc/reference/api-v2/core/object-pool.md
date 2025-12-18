---
# Identity
id: "core-object-pool"
type: "reference"
title: "ObjectPool - Generic Object Reuse System"

# Semantics
description: "Generic object pool for reducing memory allocation overhead by reusing objects with type-safe constraints."

# Graph
context_dependency: []
related_ids: ["core-object-pool-manager", "core-max-object", "core-time"]
---

## 🔌 Interface First

### Core Interface (Updated with Type Constraints)
```typescript
interface CoreObjectPoolStats {
  poolId: string;           // Pool identifier
  available: number;        // Free objects waiting
  inUse: number;            // Currently active
  total: number;            // available + inUse
  efficiency: number;       // Reuse ratio (0-1)
  totalGets?: number;       // Lifetime stats
  totalCreated?: number;    // Lifetime stats
  totalReleased?: number;   // Lifetime stats
}

interface PoolOptions<T extends object> {
  initialSize: number;      // Pre-allocate count
  maxSize: number;          // Capacity limit
  factory: () => T;         // Object creator (T extends object)
  reset: (obj: T) => void;  // State resetter
}

// NEW: Generic constraint ensures only objects can be pooled
class ObjectPool<T extends object> {
  // Properties
  name: string;
  private pool: T[];
  private activeCount: number;
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;
  private poolObjects: WeakSet<object>; // Internal tracking

  // Lifecycle
  constructor(name: string, factory: () => T, reset: (obj: T) => void, initialSize?: number, maxSize?: number);
  preAllocate(count: number): void;
  warmUp(count: number): { success: boolean; count: number };
  destroy(): void;

  // Operations
  get(): T;
  release(obj: T): boolean; // Returns false if validation fails
  clear(): void;

  // Analysis
  getStatus(): CoreObjectPoolStats;
  setMaxSize(size: number): void;
  getSize(): number;
  getCapacity(): number;
  getDestroyed(): boolean;
}
```

## ⚙️ Implementation Logic

### Object Lifecycle with Type-Safe Pooling
```typescript
Pseudocode:
Pool Creation:
1. Constructor (name, factory, reset, initial, maxSize)
2. Validate: T extends object (compile-time check)
3. Pre-allocate: create objects using factory
   - Push to internal array
   - Track with WeakSet (for validation)

Get Flow:
1. IF pool not empty:
   - Pop from array (O(1))
   - Run reset() function
2. ELSE:
   - Allocate new using factory()
   - Track allocation
   - Return to caller

Release Flow:
1. Validate ownership using type-safe WeakSet
2. Run reset() to clear state
3. IF pool.length < maxSize:
   - Push to array
4. ELSE:
   - Drop object (garbage collect)

Warm Up:
1. Get + immediately release N times
2. Ensures lazy initialization complete
3. Returns success status
```

### Type Safety & WeakSet Tracking
```typescript
Pseudocode:
Private WeakSet tracks object memory ownership:

trackObject(obj: object):
  IF obj is object AND not null:
    this.poolObjects.add(obj)

isPoolObject(obj): boolean:
  IF obj is null:
    RETURN false
  IF obj is primitive (string/number/boolean):
    RETURN false  // TS compile-time prevents this
  IF typeof obj !== 'object':
    RETURN false
  RETURN this.poolObjects.has(object)

Validation on release(obj: T):
  IF obj is null OR obj is undefined:
    WARN "Releasing null/undefined"
    RETURN false

  // Type guard: T extends object, so TypeScript ensures obj is object
  IF NOT isPoolObject(obj):
    WARN "Object not from this pool or invalid type"
    RETURN false

  RETURN true
```

### Primitive Types - Why Not Supported
```typescript
Constraint Explanation:
class ObjectPool<T extends object>  // Constraint: must be object

// This would compile error:
const badStringPool = new ObjectPool<string>(
  () => "test",
  (s) => (s = ""),
  100,
  1000
);
// ❌ Error: Type 'string' does not satisfy constraint 'object'

// This would compile error:
const badNumberPool = new ObjectPool<number>(
  () => 0,
  (n) => (n = 0)
);
// ❌ Error: Type 'number' does not satisfy constraint 'object'

// Only these work:
const vectorPool = new ObjectPool<Vector3>(...);
const bulletPool = new ObjectPool<Bullet>(...);
const dataPool = new ObjectPool<MyDataClass>(...);
```

### WeakSet Limitations with Primitives
```typescript
Why Primitives Can't Be Tracked:

// WeakSet only holds objects
const weak = new WeakSet();

weak.add("string");  // ❌ Error: Invalid value type
weak.add(123);       // ❌ Error: Invalid value type
weak.add({});        // ✅ Works

// Even if you trick TypeScript:
const objLikeString = new String("test");
weak.add(objLikeString as object);  // ✅ Works but impractical

// Problem:
const value = stringPool.get();  // Returns primitive string
// Cannot track value itself, only variable reference
```

## 📚 Usage Examples

### Object Pools (Valid Patterns)
```typescript
interface GameObject {
  id: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  active: boolean;
}

class GameObjectPool {
  private pool: ObjectPool<GameObject>;

  constructor() {
    this.pool = new ObjectPool<GameObject>(
      'game-objects',
      () => ({
        id: '',
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        active: false
      }),
      (obj) => {
        obj.id = '';
        obj.position.x = obj.position.y = 0;
        obj.velocity.x = obj.velocity.y = 0;
        obj.active = false;
      },
      50,  // Initial
      500  // Max
    );
  }

  spawn(x: number, y: number, vx: number, vy: number): GameObject {
    const obj = this.pool.get();
    obj.id = `go_${performance.now()}_${Math.random()}`;
    obj.position.x = x;
    obj.position.y = y;
    obj.velocity.x = vx;
    obj.velocity.y = vy;
    obj.active = true;
    return obj;
  }

  despawn(obj: GameObject): void {
    if (this.pool.release(obj)) {
      obj.active = false;
    }
  }

  getStats(): void {
    const stats = this.pool.getStatus();
    console.log(`${stats.inUse}/${stats.total} active, efficiency: ${(stats.efficiency * 100).toFixed(1)}%`);
  }
}
```

### Vector3 Pool
```typescript
interface Vector3 {
  x: number;
  y: number;
  z: number;
  set(x: number, y: number, z: number): void;
  copy(v: Vector3): void;
  add(v: Vector3): void;
}

const vector3Pool = new ObjectPool<Vector3>(
  'vectors',
  () => {
    return {
      x: 0, y: 0, z: 0,
      set: function(x, y, z) { this.x = x; this.y = y; this.z = z; },
      copy: function(v) { this.x = v.x; this.y = v.y; this.z = v.z; },
      add: function(v) { this.x += v.x; this.y += v.y; this.z += v.z; }
    };
  },
  (v) => {
    v.x = v.y = v.z = 0;
  },
  1000,  // Pre-allocate 1000
  2000   // Max 2000
);

// Pre-warm to avoid frame hitches
vector3Pool.warmUp(500);

// Usage: Physics calculations
function updatePhysics(entities: Entity[]) {
  for (const entity of entities) {
    const force = vector3Pool.get();
    const acceleration = vector3Pool.get();

    try {
      force.set(0, -9.8 * entity.mass, 0);  // Gravity
      acceleration.copy(force);
      acceleration.x /= entity.mass;        // a = F/m

      entity.velocity.x += acceleration.x * deltaTime;
      entity.velocity.y += acceleration.y * deltaTime;
      entity.velocity.z += acceleration.z * deltaTime;
    } finally {
      // Always release
      vector3Pool.release(force);
      vector3Pool.release(acceleration);
    }
  }
}

// Performance gain: 1000 entities * 2 vectors = 2000 → 4 allocations, 1996 reused
```

### Complex Mechanics Object Pool
```typescript
interface Bullet {
  id: string;
  position: Vector3;
  velocity: Vector3;
  damage: number;
  active: boolean;
  owner: string;
  reset(): void;  // Method for manual reset
}

// Method 1: Object with reset method
class BulletImpl implements Bullet {
  id: string = '';
  position: Vector3 = { x: 0, y: 0, z: 0 };
  velocity: Vector3 = { x: 0, y: 0, z: 0 };
  damage: number = 0;
  active: boolean = false;
  owner: string = '';

  reset(): void {
    this.id = '';
    this.position = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.damage = 0;
    this.active = false;
    this.owner = '';
  }
}

const bulletPool = new ObjectPool<Bullet>(
  'bullets',
  () => new BulletImpl(),
  (b) => b.reset(),  // Call instance method
  100,
  2000
);

// Method 2: Functional factory
const bulletPool2 = new ObjectPool<Bullet>(
  'bullets-v2',
  () => ({
    id: `bullet_${Math.random()}`,
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    damage: 0,
    active: false,
    owner: '',
    reset: function() {
      this.id = '';
      this.position = { x: 0, y: 0, z: 0 };
      this.velocity = { x: 0, y: 0, z: 0 };
      this.damage = 0;
      this.active = false;
      this.owner = '';
    }
  }),
  (b) => b.reset(),
  100,
  2000
);

// System usage
class BulletSystem {
  private activeBullets: Bullet[] = [];

  spawnBullet(owner: string, damage: number): Bullet {
    const bullet = bulletPool.get();
    bullet.owner = owner;
    bullet.damage = damage;
    bullet.active = true;
    this.activeBullets.push(bullet);

    // Emit events, play sounds, etc.
    this.events.emit('bullet-spawned', { bullet });
    return bullet;
  }

  update(deltaTime: number): void {
    this.activeBullets = this.activeBullets.filter(bullet => {
      if (!bullet.active || bullet.position.y < -100) {
        // Return to pool
        if (bulletPool.release(bullet)) {
          this.events.emit('bullet-despawned', { bullet });
          return false;  // Remove from active
        }
      }

      // Physics update
      bullet.position.x += bullet.velocity.x * deltaTime;
      bullet.position.y += bullet.velocity.y * deltaTime;
      bullet.position.z += bullet.velocity.z * deltaTime;

      return bullet.active;
    });
  }

  // Performance monitoring
  getRate(): number {
    const stats = bulletPool.getStatus();
    return stats.efficiency; // Good if > 0.8
  }
}
```

### Class Instance Pool
```typescript
import { ObjectPool } from '@maxellabs/core';

class Particle {
  x: number = 0;
  y: number = 0;
  life: number = 1;
  maxLife: number = 1;
  vx: number = 0;
  vy: number = 0;
  color: string = 'white';

  update(dt: number): void {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }

  reset(): void {
    this.x = 0;
    this.y = 0;
    this.life = 1;
    this.maxLife = 1;
    this.vx = 0;
    this.vy = 0;
    this.color = 'white';
  }
}

const particlePool = new ObjectPool<Particle>(
  'particles',
  () => new Particle(),
  (p) => p.reset(),
  500,   // Pre-warm with 500
  5000   // Max 5000 particles
);

// WebGPU/Buffer pool example (still objects)
interface GPUBuffer {
  buffer: WebGLBuffer;
  size: number;
  isFree: boolean;
  reset(): void;
}

const bufferPool = new ObjectPool<GPUBuffer>(
  'gpu-buffers',
  (gl: WebGLRenderingContext) => ({
    buffer: gl.createBuffer()!,
    size: 0,
    isFree: true,
    reset: function() {
      this.size = 0;
      this.isFree = true;
    }
  }),
  (b) => b.reset(),
  10,
  50
);
```

### Class-Based Pool Finder
```typescript
import { ObjectPool } from '@maxellabs/core';

class Shape {
  type: string = '';
  fill(): void {}
}

class Circle extends Shape {
  radius: number = 0;
  override type = 'circle';
  override fill() { /* circle fill */ }
  reset() { this.radius = 0; }
}

class Rectangle extends Shape {
  width: number = 0;
  height: number = 0;
  override type = 'rectangle';
  override fill() { /* rect fill */ }
  reset() { this.width = 0; this.height = 0; }
}

// Keep pools by type
const pools = {
  circle: new ObjectPool<Circle>(
    'circles',
    () => { const c = new Circle(); c.reset(); return c; },
    (c) => c.reset(),
    100,
    1000
  ),
  rect: new ObjectPool<Rectangle>(
    'rects',
    () => { const r = new Rectangle(); r.reset(); return r; },
    (r) => r.reset(),
    100,
    1000
  )
};

// Factory function
function getShapeFromPool(type: 'circle' | 'rectangle'): Shape {
  const pool = type === 'circle' ? pools.circle : pools.rect;
  return pool.get();
}

function releaseShape(shape: Shape): void {
  const pool = shape.type === 'circle' ? pools.circle : pools.rect;
  pool.release(shape as Circle | Rectangle);
}
```

## 🚫 Negative Constraints

### Critical Restrictions
- 🚫 **DO NOT** use with primitive types (string, number, boolean, symbol)
- 🚫 **DO NOT** use for singleton-like objects with external identity
- 🚫 **DO NOT** modify pooled objects outside reset function
- 🚫 **DO NOT** store references to pooled objects
- 🚫 **DO NOT** forget to release objects (memory leak)

### Common Mistakes (Type Safety)
```typescript
// ❌ WRONG: Primitive type (Compile error)
const badBoolean = new ObjectPool<boolean>(() => true, (b) => {}, 10, 100);
// TS Error: Type 'boolean' does not satisfy constraint 'object'

// ❌ WRONG: String pool
const badString = new ObjectPool<string>(() => "", (s) => "", 10, 100);
// TS Error: Type 'string' does not satisfy constraint 'object'

// ✅ CORRECT: Use strings internally wrapped
interface StringToken {
  value: string;
  reset(): void;
}

const goodString = new ObjectPool<StringToken>(
  () => ({ value: "", reset() { this.value = ""; } }),
  (s) => s.reset()
  // Works: Object wrapping primitive
);
```

```typescript
// ❌ WRONG: Leaking references
class BadSystem {
  private bullets: Bullet[] = [];

  shoot() {
    const bullet = bulletPool.get();
    this.bullets.push(bullet); // OK
    // ...
  }

  cleanup() {
    this.bullets.forEach(b => {
      // Simply clearing array, bullet still alive!
      // 💥 Memory leak: Pool loses track if Bullet is GC'd
    });
    this.bullets = [];
  }
}

// ❌ WRONG: Storing with external identity checking
interface GameObject {
  id: string;
}

const pool = new ObjectPool<GameObject>(() => ({ id: "" }), (o) => { o.id = "" });

const obj1 = pool.get();
obj1.id = "server-id-123";
pool.release(obj1);

// Later, searching for "server-id-123":
// ❌ Will fail - pool reset already cleared it
```

```typescript
// ❌ WRONG: Wrong release validation
const pool = new ObjectPool<SomeObject>(...);

const created = pool.get();

// ❌ Forgetting to release
function missRelease() {
  // Boom! created is lost when function exits
}

// ✅ CORRECT: Always match get/release
function correctFlow() {
  const obj = pool.get();
  try {
    // use obj
  } finally {
    pool.release(obj);  // Guaranteed cleanup
  }
}

// ❌ WRONG: Release without checking
pool.release(someUnknownObject); // Can't be tracked!
```

```typescript
// ❌ WRONG: Creating reference loops
const badPool = new ObjectPool<HTMLElement>(() => document.createElement('div'), (el) => {
  el.addEventListener('click', handler); // Adding external events
  (elas any).parent = badPool; // Circular ref!
});

// ✅ CORRECT: Clean reset only
const goodPool = new ObjectPool<HTMLElement>(() => document.createElement('div'), (el) => {
  // Complete cleanup
  el.textContent = '';
  el.className = '';
  while (el.firstChild) el.removeChild(el.firstChild);
});
```

## 📊 Performance Analysis

### Pool Efficiency Calculation
```typescript
Pseudocode:
efficiency = (totalGets - totalCreated) / totalGets

// Examples:
// 100 gets, 95 creates, 5 reused = 5/100 = 0.05 (5% efficient) ❌ Bad
// 100 gets, 20 creates, 80 reused = 80/100 = 0.80 (80% efficient) ✅ Good
// 100 gets, 100 creates = 0 (0% efficient, no reusing) 💥 Useless

// Optimal: >0.95 (95%+ reuse)
// Acceptable: >0.70
// Poor: <0.30 (consider standard new operator)
```

### Type Safety Impact on Performance
```
Object Pool (T extends object) Costs:

Memory overhead (per pool):
- Base instance: ~200 bytes
- Per pooled object: ~8 bytes for tracking
- WeakSet overhead: ~10 bytes per object

Get operation:
- Array pop: O(1) ~5ns
- Reset function call: depends on complexity
- Total: ~15-50ns (vs 500ns+ for fresh allocation)

Release operation:
- Type validation: O(1) ~5ns
- WeakSet check: O(1) ~10ns
- Array push: O(1) ~5ns
- Total: ~20ns (vs GC inefficiency for new)

Time constraint comparison (for 1000 objects):
- No pool: 500μs allocation + 100ms GC (later)
- With pool: 20μs reset + 0ms GC
```

### Type Constraint Impact
```
Generics with Constraint vs Without:
- TypeScript: Compile-time check
- Runtime: Zero overhead

vs untyped pools:
const untypedPool = new ObjectPool<any>(() => ({}), (o) => {}, 10, 100);

Benefits:
- Prevents misuse at build time
- IntelliSense for available methods
- Runtime safety via WeakSet
```

### Memory Characteristics
```typescript
// Scenario: Particle System

// Without Pool (10,000 particles, 1000 active per frame):
Total per frame: 1000 * ~64 bytes = 64KB per frame
GC Pressure: High - frequent collection

// With Pool (5000 max, 1000 active):
Total memory: ~320KB fixed, never questioned
GC Pressure: None - no churn

// Burst scenario (explosion = 2000 particles):
// No Pool: 64KB * 2000 = 128KB allocation, system stress
// With Pool: 2000*64 = 128KB, 0 new allocation (pre-allocated)
```

## 🔗 Integration Patterns

### With ObjectPoolManager
```typescript
import { ObjectPoolManager } from '@maxellabs/core';

const manager = ObjectPoolManager.getInstance();
manager.initialize({ initialCapacity: 50, maxSize: 1000, logStats: true });

// Type-safe registration
const bulletPool = manager.createPool<Bullet>(
  'default:bullets',
  () => new Bullet(),
  (b) => b.reset(),
  {
    initialCapacity: 100,
    maxSize: 500,
    logStats: true,
    memoryWarningThreshold: 300
  }
);

// Events for monitoring
manager.on('memory-warning', {
  callback: (event) => {
    // Every pool is object-bound
    console.log(`Warning: ${event.data.totalObjects} pooled objects`);
  }
});
```

### Object Pool Composition
```typescript
interface PooledType {
  reset(): void;
  update(deltaTime: number): void;
}

class BulletSystem {
  private pool: ObjectPool<Bullet>;

  constructor() {
    this.pool = new ObjectPool<Bullet>(
      'bullet-pool',
      () => new Bullet(),
      (b) => b.reset(),
      50,
      500
    );
  }

  // Service implementation
  spawn(initialVelocity: Vector3): Bullet {
    const bullet = this.pool.get();
    bullet.velocity.copy(initialVelocity);
    return bullet;
  }

  updateSystem(deltaTime: number): void {
    // Process all active bullets...
  }
}

// In game context (principal only)
class GameEngine {
  private systems: Map<string, BulletSystem> = new Map();

  createBulletSystem(name: string): BulletSystem {
    const system = new BulletSystem();
    this.systems.set(name, system);
    return system;
  }

  destroyBulletSystem(name: string): void {
    this.systems.delete(name);  // GC will recover memory
  }
}
```

### Cross-System Memory Management
```typescript
// Core system boundaries with pools

class ResourceTracker {
  private pools: Map<string, ObjectPool<any>> = new Map();

  registerPool<T extends object>(id: string, pool: ObjectPool<T>): void {
    this.pools.set(id, pool);

    // Monitor events from pool if using manager
    pool.on('alloc-warning', {
      callback: () => this.emitSystemWarning(id)
    });
  }

  getSystemMemory(): Map<string, number> {
    const meme = new Map();
    for (const [id, pool] of this.pools) {
      const stats = pool.getStatus();
      meme.set(id, stats.total * this.estimateObjectSize(id));
    }
    return meme;
  }

  private estimateObjectSize(id: string): number {
    // Based on object type registry
    return 64; // Estimate for typical particle
  }
}

// Usage
const tracker = new ResourceTracker();
tracker.registerPool('particles', particlePool);
tracker.registerPool('bullets', bulletPool);
```

---

**Last Updated**: 2025-12-18
**Version**: 2.0.0 (Type Safety Constrained)
**Breaking Changes**: Yes
- Generic constraint `<T>` → `<T extends object>`
- Prevents primitive type usage (compile-time)
- Documentation clarifies WeakSet limitations
