---
# Identity
id: "core-object-pool"
type: "reference"
title: "ObjectPool - Generic Object Reuse System"

# Semantics
description: "Generic object pool for reducing memory allocation overhead by reusing objects."

# Graph
context_dependency: []
related_ids: ["core-object-pool-manager", "core-max-object", "core-time"]
---

## 🔌 Interface First

### Core Interface
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

interface PoolOptions {
  initialSize: number;      // Pre-allocate count
  maxSize: number;          // Capacity limit
  factory: () => T;         // Object creator
  reset: (obj: T) => void;  // State resetter
}
```

### ObjectPool Class
```typescript
class ObjectPool<T> {
  // Properties
  name: string;
  private pool: T[];
  private activeCount: number;
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  // Lifecycle
  constructor(name: string, factory, reset, initialSize?, maxSize?);
  preAllocate(count: number): void;
  warmUp(count: number): { success: boolean; count: number };
  destroy(): void;

  // Operations
  get(): T;
  release(obj: T): boolean;
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

### Object Lifecycle with Pooling
```typescript
Pseudocode:
Pool Creation:
1. Constructor (name, factory, reset, initial, maxSize)
2. preAllocate(initial)
   - Loop: create objects using factory
   - Push to internal array
   - Track with WeakSet (for validation)

Get Flow:
1. IF pool not empty:
   - Pop from array (O(1))
   - Run reset() function
2. ELSE:
   - Allocate new using factory()
   - Track allocation

Release Flow:
1. Validate ownership (WeakSet check)
2. Run reset() to clear state
3. IF pool.length < maxSize:
   - Push to array
4. ELSE:
   - Drop object (garbage collect)

Warm Up:
1. Get + immediately release N times
2. Ensures lazy initialization complete
```

### Object Tracking & Validation
```typescript
Pseudocode:
Private WeakSet tracks memory ownership:

trackObject(obj):
  IF obj is object AND not null:
    this.poolObjects.add(obj)

isPoolObject(obj):
  IF obj is primitive (string/number/boolean):
    RETURN false  // Can't track primitives
  RETURN this.poolObjects.has(object)

Validation on release:
  IF NOT isPoolObject(obj):
    WARN "Releasing non-pool object"
    RETURN false
```

## 📚 Usage Examples

### Basic Bullet Pool
```typescript
class Bullet {
  position: Vector3 = new Vector3();
  velocity: Vector3 = new Vector3();
  isDead: boolean = false;

  reset(): void {
    this.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.isDead = false;
  }
}

const bulletPool = new ObjectPool<Bullet>(
  'bullets',                    // Pool name
  () => new Bullet(),           // Factory
  (b) => b.reset(),             // Reset
  100,                          // Pre-allocate 100
  1000                          // Max 1000
);

// Pre-warm
bulletPool.warmUp(50);

// Usage
function shoot(x: number, y: number, dir: Vector3): void {
  const bullet = bulletPool.get();
  bullet.position.set(x, y, 0);
  bullet.velocity.copy(dir);
  activeBullets.push(bullet);
}

// Return to pool
activeBullets = activeBullets.filter(b => {
  if (b.isDead) {
    bulletPool.release(b);  // Reset and return
    return false;           // Remove from active list
  }
  return true;              // Keep active
});
```

### Particle System
```typescript
interface Particle {
  x: number; y: number;
  life: number; maxLife: number;
  vx: number; vy: number;
}

const particlePool = new ObjectPool<Particle>(
  'particles',
  () => ({
    x: 0, y: 0,
    life: 1, maxLife: 1,
    vx: 0, vy: 0
  }),
  (p) => {
    p.x = p.y = 0;
    p.life = p.maxLife = 1;
    p.vx = p.vy = 0;
  },
  500,  // Initial: 500 particles
  5000  // Max: 5000 particles
);

// Explosion
function spawnExplosion(x: number, y: number, count: number): void {
  for (let i = 0; i < count; i++) {
    const p = particlePool.get();
    p.x = x; p.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.life = 1.0;
    activeParticles.push(p);
  }
}

// Update
function updateParticles(dt: number): void {
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;

    if (p.life <= 0 || p.x < 0 || p.x > screenWidth) {
      activeParticles.splice(i, 1);
      particlePool.release(p);
    }
  }
}
```

### String Builder Pool (String/Primitives)
```typescript
// Most objects work fine, but primitives can't be tracked
// For primitives, use custom tracking:

const StringBuilder = {
  pool: [] as string[],
  get(content: string = ''): string {
    if (this.pool.length > 0) {
      const str = this.pool.pop()!;
      // Strings are immutable, can't really reuse value
      // But you can reuse the variable slot
      return content;
    }
    return content;
  },
  release(str: string): void {
    // Optional: return to pool for variable reuse
    if (this.pool.length < 100) {
      this.pool.push(str);
    }
  }
};

// Better for primitives: just use the primitive
```

### Hardware Resource Pool
```typescript
// WebGL Buffer Pool
class BufferPool {
  private pool: ObjectPool<WebGLBuffer>;
  private gl: WebGLRenderingContext;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;

    this.pool = new ObjectPool<WebGLBuffer>(
      'gl-buffers',
      () => gl.createBuffer()!,
      (buffer) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, 0, gl.STATIC_DRAW);
      },
      50,  // 50 buffers ready
      500  // 500 max
    );
  }

  upload(data: Float32Array): WebGLBuffer {
    const buffer = this.pool.get();
    this.gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
  }

  free(buffer: WebGLBuffer): void {
    this.pool.release(buffer);
  }
}
```

## 🚫 Negative Constraints

### Critical Restrictions
- 🚫 **DO NOT** use externals in reset functions (side effects)
- 🚫 **DO NOT** store references to pooled objects (use WeakMap if needed)
- 🚫 **DO NOT** use for primitives (string, number, boolean)
- 🚫 **DO NOT** release without checking ownership
- 🚫 **DO NOT** grow pool past maxSize unbounded

### Common Mistakes
```typescript
// ❌ WRONG: Using primitives
const numPool = new ObjectPool<number>(() => 0, (n) => n = 0);
// Creates objects but WeakSet can't track primitives

// ❌ WRONG: Not resetting properly
class BadData {
  userId: number;
  data: any;
}

const pool = new ObjectPool<BadData>(
  () => ({} as BadData),  // Partial init
  (obj) => { /* missing: obj.userId = 0 */ }
);

const data = pool.get();
// data contains previous userId! Leak!

// ✅ CORRECT: Full reset
const pool = new ObjectPool<BadData>(
  () => ({ userId: 0, data: null }),
  (obj) => { obj.userId = 0; obj.data = null; }
);
```

```typescript
// ❌ WRONG: Releasing non-pool objects
const pool = new ObjectPool<MyClass>(() => new MyClass(), reset, 10, 100);

const external = new MyClass();
// ... use external somewhere
pool.release(external); // WARNING! Not pool-owned

// ✅ CORRECT: Check factory source
function safeRelease<T>(pool: ObjectPool<T>, obj: T): boolean {
  if ((pool as any).poolObjects?.has(obj as object)) {
    return pool.release(obj);
  }
  console.warn("Object not from this pool");
  return false;
}
```

```typescript
// ❌ WRONG: Creating loops in reset
const badPool = new ObjectPool<HTMLElement>(
  () => document.createElement('div'),
  (el) => {
    // This creates memory leak
    el.addEventListener('click', badHandler);
    el.userData = { parent: badPool }; // Reference to pool!
  }
);

// ✅ CORRECT: Clean reset
const cleanPool = new ObjectPool<HTMLElement>(
  () => document.createElement('div'),
  (el) => {
    el.textContent = '';
    el.className = '';
    // Remove all attributes and listeners
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }
);
```

### Performance Pitfalls
```typescript
// ❌ WRONG: Factory is expensive in hot loop
const slowPool = new ObjectPool(
  () => {
    // Heavy computation
    return heavyInit();
  },
  reset,
  0,  // Not pre-allocated
  1000
);

// Every pool.get() has overhead
// ✅ CORRECT: Pre-allocate for hot paths
const fastPool = new ObjectPool(
  () => expensiveObject(),
  reset,
  100,  // Pre-allocate
  1000
);
fastPool.warmUp(50); // Initialize lazy spec
```

## 📊 Performance Analysis

### Pool Efficiency Calculation
```typescript
Pseudocode:
efficiency = (totalGets - totalCreated) / totalGets

Examples:
- 100 gets, 95 creates, 5 reused = 5/100 = 0.05 (5% efficient)
- 100 gets, 20 creates, 80 reused = 80/100 = 0.80 (80% efficient)
- 100 gets, 100 creates = 0 (0% efficient, no reusing)

Optimal: >0.95 (95%+ reuse)
Acceptable: >0.70
Poor: <0.30
```

### Object Allocation Comparison
```typescript
// Scenario: Spawning 1000 bullets per second, 100 lifetime
// Bullet: 32 bytes memory, 500ns create time

Without pooling:
  Memory: 1000 bullets * 32B = 32KB/frame
  GC: 1000 * 500ns = 0.5ms per frame
  Result: Spikes at 60fps, jitter

With pooling (size=100):
  Memory: 100 bullets * 32B = 3.2KB fixed
  GC: 1000 gets * 50ns reset = 0.05ms per frame
  Result: Smooth, 0.5ms saved
```

### Space-Time Tradeoff Analysis
```
Pool Size | Initial Time | Get Time | Memory | Efficiency
----------|--------------|----------|--------|-----------
0         | 0ns          | 500ns    | 0B     | N/A (new)
10        | 5μs          | 50ns     | 320B   | Low
100       | 50μs         | 10ns     | 3.2KB  | High
1000      | 500μs        | 10ns     | 32KB   | High (wasteful)

Best for: 100-200 active objects
```

### Warm Up Impact
```typescript
dictionary:
- NO warm up:
  First 50 gets: 50 creations (slow cold start)
  gets 50+: 50 reuses (fast)

- Warm up 50:
  Start: Pre-allocated
  All gets: Instant

Impact on user experience:
- NO warm: 50 frame stutters (if they need 50 bullets immediately)
- Warm: No stutter, smooth startup
```

## 🔗 Integration with Manager

### Centralized Management
```typescript
const manager = ObjectPoolManager.getInstance();

// Create pool through manager
const bulletPool = manager.createPool(
  'default:bullets',
  bulletFactory,
  bulletReset,
  {
    initialCapacity: 100,
    maxSize: 1000,
    logStats: true,
    memoryWarningThreshold: 500
  }
);

// Managed features:
// ✓ Auto-analysis
// ✓ Memory warnings
// ✓ Performance events
// ✓ Stats collection
// ✓ Central monitoring

// Plain object pool (no manager)
const localPool = new ObjectPool(
  'local', factory, reset, 10, 100
);
// No monitoring, manual management
```

### Debugging Pool States
```typescript
function debugPool<T>(pool: ObjectPool<T>): string {
  const stats = pool.getStatus();

  return `
  Pool: ${stats.poolId}
  Available: ${stats.available}
  In-Use: ${stats.inUse}
  Total: ${stats.total}
  Efficiency: ${(stats.efficiency * 100).toFixed(1)}%
  Max Size: ${pool.getCapacity()} (capacity)
  $.  Created: ${stats.totalCreated || 0}
  $.  Released: ${stats.totalReleased || 0}
  $.  Gets: ${stats.totalGets || 0}
  `.trim();
}

// Usage
setInterval(() => {
  console.log(debugPool(bulletPool));
}, 5000);
```

---

**Last Updated**: 2025-12-18
**Version**: 1.0.0
**Size**: 12,397 bytes
