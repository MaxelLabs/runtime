---
# Identity
id: "core-object-pool-manager"
type: "reference"
title: "Object Pool Manager - Centralized Pool Management"

# Semantics
description: "Singleton manager for creating, monitoring, and optimizing multiple object pools with event system."

# Graph
context_dependency: ["core-object-pool", "core-event-dispatcher"]
related_ids: ["core-object-pool", "core-time", "core-max-object"]
---

## 🔌 Interface First

### Manager Events
```typescript
enum ObjectPoolManagerEventType {
  POOL_CREATED = 'pool-created',
  POOL_DESTROYED = 'pool-destroyed',
  PERFORMANCE_ANALYSIS = 'performance-analysis',
  MEMORY_WARNING = 'memory-warning',
  ERROR = 'error'
}
```

### Configuration Interface
```typescript
interface ObjectPoolOptions {
  initialCapacity?: number;      // Pre-allocation size
  maxSize?: number;              // Maximum pool size
  logStats?: boolean;            // Enable statistics
  memoryWarningThreshold?: number; // Warning alert level
}
```

### Manager Interface
```typescript
class ObjectPoolManager extends EventDispatcher {
  // Initialization
  static getInstance(): ObjectPoolManager;
  initialize(options?: Partial<ObjectPoolOptions>): void;

  // Pool Management
  registerPool<T>(id: string, pool: ObjectPool<T>): void;
  createPool<T>(id: string, factory, reset, options?): ObjectPool<T>;
  getPool<T>(id: string): ObjectPool<T> | null;
  destroyPool(id: string): boolean;

  // Pool Operations
  updatePoolConfig(id: string, options: Partial<ObjectPoolOptions>): boolean;
  warmUpPool(id: string, count: number): boolean;
  warmUpAllPools(count: number): Map<string, boolean>;

  // Maintenance
  clearAllPools(): void;
  destroyAllPools(): void;

  // Analytics
  getAllPoolStats(detailed?: boolean): Map<string, CoreObjectPoolStats>;
  analyzePerformance(force?: boolean): Map<string, CoreObjectPoolStats> | null;

  // Monitoring
  enableAutoAnalysis(enabled: boolean, interval?: number): void;
  update(): void;
  getTotalObjectCount(): number;
  getTotalInUseCount(): number;

  // Lifecycle
  static destroyInstance(): void;
}
```

## ⚙️ Implementation Logic

### Singleton Pattern
```typescript
Pseudocode:
CLASS ObjectPoolManager:
  private static instance: ObjectPoolManager
  private pools: Map<string, ObjectPool<any>>

  FUNCTION getInstance():
    IF NOT instance:
      instance = new ObjectPoolManager()
    RETURN instance

  private constructor():
    super()  // EventDispatcher
    this.pools = new Map()

  FUNCTION destroyInstance():
    instance.destroyAllPools()
    instance = null
```

### Pool Creation and Registration
```typescript
Pseudocode:
FUNCTION createPool(id, factory, reset, options):
  // Merge options with global
  opts = merge(globalOptions, options)

  // Add namespace if needed
  fullId = id.contains(':') ? id : 'default:' + id

  // Create pool
  pool = new ObjectPool(
    id, factory, reset,
    opts.initialCapacity,
    opts.maxSize
  )

  // Register
  pools.set(fullId, pool)

  // Emit event
  dispatchEvent('pool-created', { poolId: fullId, pool })

  RETURN pool
```

### Performance Analysis Flow
```typescript
Pseudocode:
FUNCTION analyzePerformance(force):
  IF NOT autoAnalysis AND NOT force:
    RETURN null  // Skip if not time

  IF NOT force AND (now - lastAnalysis < interval):
    RETURN null  // Not yet time

  lastAnalysis = now

  // Collect stats from all pools
  stats = []
  totalObjects = 0
  totalActive = 0

  FOR pool IN pools:
    stat = pool.getStatus()
    stats.push(stat)
    totalObjects += stat.total
    totalActive += stat.inUse

    // Check threshold
    IF stat.total > memoryWarningThreshold:
      hasWarning = true

  // Post events
  IF hasWarning:
    dispatchEvent('memory-warning', {
      totalObjects, totalActive, pools: stats
    })

  dispatchEvent('performance-analysis', {
    totalObjects, totalActive, pools: stats, timestamp: now
  })

  RETURN stats
```

### Update Loop (Auto-Analysis)
```typescript
Pseudocode:
FUNCTION update():
  IF this.autoAnalysis:
    this.analyzePerformance()  // Check if time
```

## 📚 Usage Examples

### Engine Initialization
```typescript
class Engine {
  private pools: ObjectPoolManager;
  private time: Time;

  constructor() {
    this.pools = ObjectPoolManager.getInstance();
    this.time = new Time();

    // Global configuration
    this.pools.initialize({
      initialCapacity: 10,    // Pre-allocate 10 per pool
      maxSize: 1000,          // Max 1000 objects per pool
      logStats: true,
      memoryWarningThreshold: 5000  // Warn at 5k objects
    });

    // Enable auto-analysis every 10 seconds
    this.pools.enableAutoAnalysis(true, 10000);

    // Listen for warnings
    this.pools.on('memory-warning', {
      callback: (event) => {
        console.warn(`Memory Warning: ${event.data.totalObjects} objects`);
        this.optimizePools();
      }
    });
  }

  update(): void {
    // Engine loop
    this.time.update(delta);

    // Update manager for auto-analysis
    this.pools.update();

    // ...
  }

  optimizePools(): void {
    const stats = this.pools.getAllPoolStats();
    for (const [id, stat] of stats) {
      if (stat.efficiency < 0.3) {
        console.log(`Low efficiency pool: ${id}`);
        // Consider reducing maxSize or initialSize
      }
    }
  }
}
```

### Bullet Pool Manager
```typescript
class BulletSystem {
  private poolManager: ObjectPoolManager;
  private bulletPool: ObjectPool<Bullet>;

  constructor() {
    this.poolManager = ObjectPoolManager.getInstance();

    this.bulletPool = this.poolManager.createPool(
      'bullets',                    // ID: "default:bullets"
      () => new Bullet(),           // Factory
      (bullet) => bullet.reset(),   // Reset
      {
        initialCapacity: 50,        // Pre-allocate 50
        maxSize: 200,               // Cap at 200
        logStats: true
      }
    );

    // Pre-heat the pool
    this.bulletPool.warmUp(20);

    // Listen for pool creation success
    this.poolManager.on('pool-created', {
      callback: (event) => {
        console.log(`Pool ready: ${event.data.poolId}`);
      }
    });
  }

  spawn(position: Vector3, direction: Vector3): void {
    const bullet = this.bulletPool.get();
    bullet.position.copy(position);
    bullet.velocity.copy(direction);
    activeBullets.push(bullet);
  }

  update(): void {
    for (let i = activeBullets.length - 1; i >= 0; i--) {
      const bullet = activeBullets[i];
      bullet.update(this.time.deltaTime);

      if (bullet.isDead()) {
        // Return to pool
        if (this.bulletPool.release(bullet)) {
          activeBullets.splice(i, 1);
        }
      }
    }

    // Check pool stats
    if (this.time.frame % 300 === 0) {
      const stats = this.bulletPool.getStatus();
      console.log(
        `Bullets: ${stats.inUse}/${stats.total} ` +
        `(efficiency: ${(stats.efficiency * 100).toFixed(1)}%)`
      );
    }
  }
}
```

### Multi-Pool Audio System
```typescript
class AudioManager {
  private manager: ObjectPoolManager;
  private pools: Map<string, ObjectPool<AudioClip>> = new Map();

  constructor() {
    this.manager = ObjectPoolManager.getInstance();

    // Create pools for different audio types
    this.createPool('sfx-common', 20, 100);
    this.createPool('sfx-weapon', 10, 50);
    this.createPool('music-stem', 5, 20);
  }

  private createPool(id: string, initial: number, max: number): void {
    const pool = this.manager.createPool(
      id,
      () => this.createAudioClip(id),
      (clip) => clip.stopAndReset(),
      { initialCapacity: initial, maxSize: max }
    );

    this.pools.set(id, pool);
    pool.warmUp(initial);
  }

  playSFX(id: string, priority: number = 0): void {
    const pool = this.pools.get(id);
    if (!pool) {
      this.manager.dispatchEvent('error', {
        message: `Pool ${id} not found`
      });
      return;
    }

    const clip = pool.get();
    clip.volume = priority * 0.1;
    clip.play();

    // Auto-return after duration
    clip.onEnded = () => pool.release(clip);
  }

  // Monitor usage
  getDebugInfo(): string {
    return Array.from(this.pools.entries()).map(([id, pool]) => {
      const stats = pool.getStatus();
      return `${id}: ${stats.inUse}/${stats.total} ` +
             `eff:${(stats.efficiency * 100).toFixed(0)}%`;
    }).join('\n');
  }
}
```

### Performance Analysis Dashboard
```typescript
class PerformanceDashboard {
  private manager: ObjectPoolManager;

  constructor() {
    this.manager = ObjectPoolManager.getInstance();

    // Subscribe to analysis events
    this.manager.on('performance-analysis', {
      callback: (event) => {
        this.renderDashboard(event.data);
      }
    });

    // Subscribe to warnings
    this.manager.on('memory-warning', {
      callback: (event) => {
        this.showWarning(event.data);
      }
    });
  }

  private renderDashboard(data: any): void {
    console.clear();
    console.log(`=== Object Pool Dashboard [Frame ${data.timestamp}] ===`);
    console.log(`Total Objects: ${data.totalObjects}`);
    console.log(`In-Use Objects: ${data.totalActive}`);
    console.log('');

    // Table format
    const table = Array.from(data.pools.entries()).map(([id, stat]) => ({
      Pool: id,
      Total: stat.total,
      Active: stat.inUse,
      Wait: stat.available,
      Efficiency: `${(stat.efficiency * 100).toFixed(1)}%`,
      Created: stat.totalCreated || 0,
      Released: stat.totalReleased || 0
    }));

    console.table(table);
  }

  private showWarning(data: any): void {
    console.error(`⚠️ MEMORY WARNING!`);
    console.error(`Total objects: ${data.totalObjects}`);
    console.error(`Active: ${data.totalActive}`);
    console.error(`Check pools:`, data.pools);
  }

  triggerAnalysis(): void {
    const result = this.manager.analyzePerformance(true);
    if (result) {
      console.log('Analysis triggered manually');
    }
  }
}
```

## 🚫 Negative Constraints

### Critical Restrictions
- 🚫 **DO NOT** call `initialize()` multiple times
- 🚫 **DO NOT** manually create pools without manager
- 🚫 **DO NOT** forget event cleanup
- 🚫 **DO NOT** enable auto-analysis in tight loops
- 🚫 **DO NOT** use the same ID for multiple pools

### Common Mistakes
```typescript
// ❌ WRONG: Creating pools directly
const pool = new ObjectPool('myPool', factory, reset);
// Pool never registered, no monitoring

// ✅ CORRECT: Use manager
const manager = ObjectPoolManager.getInstance();
const pool = manager.createPool('myPool', factory, reset);
// Now tracked and monitored
```

```typescript
// ❌ WRONG: Double initialization
const manager = ObjectPoolManager.getInstance();
manager.initialize({ initialCapacity: 10 });
manager.initialize({ initialCapacity: 20 }); // Ignored but confusing

// ✅ CORRECT: Check if initialized
if (!manager['initialized']) {
  manager.initialize({ initialCapacity: 10 });
}
```

```typescript
// ❌ WRONG: Forgetting to release objects
const pool = manager.getPool('bullets');
const bullet = pool.get();
// ... use bullet ...
// Forget release! Memory leak

// ✅ CORRECT: Always pair get/release
const bullet = pool.get();
try {
  // use bullet
} finally {
  pool.release(bullet); // Always release
}
```

```typescript
// ❌ WRONG: Creating too many pools
for (let i = 0; i < 1000; i++) {
  manager.createPool(`pool-${i}`, factory, reset);
}
// Thousands of map entries, overhead

// ✅ CORRECT: Reuse pool names / logical grouping
manager.createPool('particle', factory, reset);
// Single pool for all particles
```

### Event System Pitfalls
```typescript
// ❌ WRONG: Not cleaning up event listeners
manager.on('memory-warning', heavyCallback);
// If manager persists, callback persists
// Memory leak

// ✅ CORRECT: Standard EventDispatcher cleanup
// If using once:
manager.once('memory-warning', heavyCallback); // Auto-cleanup

// Or manually track and clean:
const listeners = new Set();
function setupListener() {
  const listener = { callback: heavyCallback };
  manager.on('memory-warning', listener);
  listeners.add(listener);
}

cleanup() {
  for (const listener of listeners) {
    manager.off('memory-warning', listener);
  }
}
```

## 📊 Performance Analysis

### Manager Per-Frame Cost
```
update() call:
  IF auto-analysis enabled:
    Check timer: ~10ns
    IF interval met:
      Analysis: O(n) pools + event emission
    ELSE:
      0 overhead
  ELSE:
    0 overhead

Total overhead: ~10ns per frame (when idle)
```

### Pool Storage Overhead
```
Per registered pool:
  - Map entry: ~50 bytes overhead
  - Event listener storage: ~30 bytes
  - Async event handling: negligible

100 pools:
  ~8KB overhead
500 pools:
  ~40KB overhead
```

### Analysis Event Cost
```typescript
// Once per 10 seconds (default interval)
analyzePerformance():

- Get all stats: O(n) where n = number of pools
- Calculate totals: O(n)
- Create event payload: O(n)
- Emit events: O(m) where m = listeners

// Typical: 5-10 pools
// Cost: ~5ms - negligible for 10 second interval
```

### Memory Warning System Efficiency
```typescript
Threshold check:
  IF pool.size > threshold:
    hasWarning = true
// O(n) where n = number of pools

once warning fired:
  - Dispatch event: O(1) listeners
  - Callback handling: Depends on logic
```

## 🔗 Architecture Patterns

### Initialization Pattern
```typescript
// Centralized factory creation

class Engine {
  constructor() {
    // 1. Get manager
    this.pools = ObjectPoolManager.getInstance();

    // 2. Configure
    this.pools.initialize({
      initialCapacity: 16,
      maxSize: 128,
      memoryWarningThreshold: 10000
    });

    // 3. Register pools
    this.registerBulletPool();
    this.registerParticlePool();
    this.registerAudioPool();

    // 4. Pre-warm critical ones
    this.pools.warmUpAllPools(10);
  }

  private registerBulletPool(): void {
    this.pools.createPool('bullets', ...);
  }
}
```

### Hierarchical Pool Management
```typescript
// Master pool manager maintains sub-managers

class Region {
  private poolManager = ObjectPoolManager.getInstance();
  private regionTag: string;

  constructor(tag: string) {
    this.regionTag = tag;
  }

  createPool<T>(name: string, ...): ObjectPool<T> {
    const id = `${this.regionTag}:${name}`;
    return this.poolManager.createPool(id, ...);
  }

  destroyAll(): void {
    // Destroy only this region's pools
    const all = this.poolManager.getAllPoolStats();
    for (const [id] of all) {
      if (id.startsWith(this.regionTag + ':')) {
        this.poolManager.destroyPool(id);
      }
    }
  }
}

// Usage:
const regionA = new Region('sceneA');
regionA.createPool('enemies', ...);
regionA.createPool('effects', ...);

const regionB = new Region('sceneB');
// Different namespaces, same manager
```

### Opt-in Analytics
```typescript
class DevMode {
  constructor(private manager: ObjectPoolManager) {}

  enableAnalytics(): void {
    // Detailed stats
    this.manager.enableAutoAnalysis(true, 5000); // 5s intervals

    // Event subscriptions
    this.manager.on('performance-analysis', {
      callback: this.showAllocationProfile,
      priority: 100
    });

    this.manager.on('memory-warning', {
      callback: this.showMemoryAlert,
      priority: 200
    });
  }

  disableAnalytics(): void {
    this.manager.enableAutoAnalysis(false);
  }

  private showAllocationProfile(event: Event): void {
    const stats = event.data.pools;
    // Generate flame graph, allocation timeline, etc.
  }
}
```

## 🔍 Debugging & Monitoring

### Debug Memory Leak
```typescript
function debugPoolLeaks(manager: ObjectPoolManager): void {
  const stats = manager.getAllPoolStats(true);

  for (const [id, stat] of stats) {
    if (stat.total > 500) {
      console.log(`⚠️ Large pool detected: ${id}`);
      console.log(`   Total: ${stat.total}, In-use: ${stat.inUse}`);
    }

    if (stat.efficiency < 0.2 && stat.totalGets > 50) {
      console.log(`🔄 Low efficiency: ${id}`);
      console.log(`   Efficiency: ${(stat.efficiency * 100).toFixed(1)}%`);
      console.log(`   Check: Leaked objects or poor reset logic`);
    }

    if (stat.inUse > 100) {
      console.log(`🔥 High usage: ${id}`);
      console.log(`   In-use: ${stat.inUse}/${stat.total}`);
    }
  }
}

// Call in debug menu or timeout
setInterval(() => debugPoolLeaks(manager), 30000);
```

### Runtime Configuration Update
```typescript
function tunePoolPerformance(
  manager: ObjectPoolManager,
  poolId: string,
  targetEfficiency: number = 0.8
): void {
  const stats = manager.getPool(poolId)?.getStatus();

  if (!stats) return;

  if (stats.efficiency < targetEfficiency) {
    // Too many allocations - increase initial capacity
    manager.updatePoolConfig(poolId, {
      initialCapacity: stats.totalCreated * 1.2
    });
  } else if (stats.available > stats.inUse * 3) {
    // Too much idle capacity - decrease
    manager.updatePoolConfig(poolId, {
      maxSize: Math.floor(stats.total * 0.7)
    });
  }
}
```

### Visual Pool Inspector
```typescript
class PoolInspector {
  constructor(private manager: ObjectPoolManager) {}

  render(canvas: HTMLCanvasElement): void {
    const stats = this.manager.getAllPoolStats();
    const yStep = 20;
    let y = 20;

    canvas.width = 400;
    canvas.height = Object.keys(stats).length * yStep + 40;

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';

    for (const [id, stat] of stats) {
      // Draw bar: available (blue), in-use (red)
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(100, y, stat.available * 2, 12);

      ctx.fillStyle = '#F44336';
      ctx.fillRect(100 + stat.available * 2, y, stat.inUse * 2, 12);

      ctx.fillStyle = '#fff';
      ctx.fillText(`${id}: ${stat.inUse}/${stat.total}`, 10, y + 11);

      y += yStep;
    }
  }
}
```

---

**Last Updated**: 2025-12-18
**Version**: 1.0.0
