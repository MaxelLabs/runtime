---
# Identity
id: "core-object-pool-manager"
type: "reference"
title: "Object Pool Manager - Centralized Pool Management"

# Semantics
description: "Singleton manager for creating, monitoring, and optimizing multiple object pools with event system and error handling consistency."

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
  ERROR = 'error',
  WARNING = 'warning'  // NEW: For non-fatal issues
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

### Manager Interface (With Error Handling Fixes)
```typescript
class ObjectPoolManager extends EventDispatcher {
  // Initialization
  static getInstance(): ObjectPoolManager;
  initialize(options?: Partial<ObjectPoolOptions>): void;

  // Pool Management
  registerPool<T extends object>(id: string, pool: ObjectPool<T>): void;

  // UPDATED: createPool now throws, not logs
  createPool<T extends object>(
    id: string,
    factory: () => T,
    reset: (obj: T) => void,
    options?: Partial<ObjectPoolOptions>
  ): ObjectPool<T>;

  getPool<T extends object>(id: string): ObjectPool<T> | null;

  // UPDATED: Returns false, logs warning (not error)
  destroyPool(id: string): boolean;

  // Pool Operations
  updatePoolConfig(id: string, options: Partial<ObjectPoolOptions>): boolean;

  // UPDATED: Returns boolean, logs warning on issues
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
CLASS ObjectPoolManager extends EventDispatcher:
  private static instance: ObjectPoolManager
  private pools: Map<string, ObjectPool<object>>
  private globalOptions: Partial<ObjectPoolOptions>
  private autoAnalysis: boolean
  private lastAnalysis: number
  private analysisInterval: number

  FUNCTION getInstance():
    IF NOT instance:
      instance = new ObjectPoolManager()
    RETURN instance

  private constructor():
    super()
    this.pools = new Map()
    this.globalOptions = {}
    this.autoAnalysis = false
    this.lastAnalysis = 0
    this.analysisInterval = 10000

  FUNCTION destroyInstance():
    IF instance:
      instance.destroyAllPools()
      instance = null
```

### Pool Creation and Registration
```typescript
Pseudocode:
FUNCTION createPool(id, factory, reset, options):
  // Precondition: Validate factory and reset
  IF factory === null OR reset === null:
    throw new Error("Factory and reset must be provided")

  // Merge with global configuration
  opts = merge(this.globalOptions, options)

  // Add namespace if no colon present
  fullId = id.contains(':') ? id : 'default:' + id

  // Create pool with type constraint
  pool = new ObjectPool<object>(
    fullId,
    factory,
    reset,
    opts.initialCapacity || 10,
    opts.maxSize || 1000
  )

  // Register
  this.pools.set(fullId, pool)

  // Emit created event
  this.dispatchEvent('pool-created', {
    poolId: fullId,
    pool,
    options: opts
  })

  RETURN pool
```

### Error Handling Consistency
```typescript
Pseudocode:

// UPDATED: createPool with validation - throws on failure
 FUNCTION createPool(id, factory, reset, options):
  IF typeof id !== 'string' OR id.trim() === '':
    throw new Error("Pool ID must be a non-empty string")

  IF typeof factory !== 'function':
    throw new Error("Factory must be a function")

  IF typeof reset !== 'function':
    throw new Error("Reset must be a function")

  // Check for duplicates
  IF this.pools.has(id):
    throw new Error(`Pool '${id}' already exists`)

  // Try creation
  TRY:
    pool = new ObjectPool(id, factory, reset,
      options.initialCapacity, options.maxSize)
    this.pools.set(id, pool)
    RETURN pool
  CATCH error:
    // Don't log here, just rethrow with context
    throw new Error(`Failed to create pool '${id}': ${error.message}`)

// UPDATED: destroyPool with warning on failure
 FUNCTION destroyPool(id):
  pool = this.pools.get(id)

  IF NOT pool:
    // DON'T use logError - this is a warning, not an exception
    logWarning(`Pool '${id}' not found`, 'ObjectPoolManager')
    RETURN false  // Indicate failure, but allow continued execution

  TRY:
    pool.destroy()
    this.pools.delete(id)

    this.dispatchEvent('pool-destroyed', { poolId: id })
    RETURN true
  CATCH error:
    logWarning(`Error destroying pool '${id}': ${error.message}`, 'ObjectPoolManager')
    RETURN false

// UPDATED: warmUpPool with warning on failure
 FUNCTION warmUpPool(id, count):
  pool = this.pools.get(id)

  IF NOT pool:
    logWarning(`Cannot warm up - pool '${id}' not found`, 'ObjectPoolManager')
    RETURN false

  IF count <= 0:
    logWarning(`Invalid warm-up count: ${count}`, 'ObjectPoolManager')
    RETURN false

  TRY:
    result = pool.warmUp(count)
    RETURN result.success
  CATCH error:
    logWarning(`Warm-up failed for pool '${id}': ${error.message}`, 'ObjectPoolManager')
    RETURN false

// UPDATED: warmUpAllPools with partial failure handling
 FUNCTION warmUpAllPools(count):
  results = new Map()

  FOR poolId IN this.pools.keys():
    results.set(poolId, this.warmUpPool(poolId, count))
    // Note: warmUpPool already handles logging

  RETURN results
```

### Performance Analysis Flow
```typescript
Pseudocode:
FUNCTION analyzePerformance(force):
  IF NOT this.autoAnalysis AND NOT force:
    RETURN null

  // Time-based filtering
  IF NOT force AND (now - this.lastAnalysis < this.interval):
    RETURN null

  this.lastAnalysis = now

  // Collect stats
  stats = new Map()
  totalObjects = 0
  totalActive = 0
  warnings = []

  FOR [poolId, pool] IN this.pools:
    stat = pool.getStatus()
    stats.set(poolId, stat)
    totalObjects += stat.total
    totalActive += stat.inUse

    // Check for issues
    IF stat.total > this.memoryWarningThreshold:
      warnings.push({ poolId, reason: 'size', value: stat.total })

    IF stat.efficiency < 0.2 AND stat.totalGets > 50:
      warnings.push({ poolId, reason: 'efficiency', value: stat.efficiency })

  // Emit performance analysis
  this.dispatchEvent('performance-analysis', {
    totalObjects,
    totalActive,
    pools: stats,
    timestamp: now
  })

  // Emit warnings if any
  IF warnings.length > 0:
    this.dispatchEvent('memory-warning', {
      totalObjects,
      totalActive,
      warnings,
      pools: stats
    })

  RETURN stats
```

### Update Loop (Auto-Analysis)
```typescript
Pseudocode:
FUNCTION update():
  // Minimal overhead check
  IF this.autoAnalysis:
    this.analyzePerformance()  // Only runs if interval met
```

## 📚 Usage Examples

### Engine Initialization with Error Handling
```typescript
import { ObjectPoolManager, EventDispatcher } from '@maxellabs/core';

class Engine {
  private pools: ObjectPoolManager;
  private time: Time;

  constructor() {
    this.pools = ObjectPoolManager.getInstance();
    this.time = new Time();

    // Global configuration
    this.pools.initialize({
      initialCapacity: 10,
      maxSize: 1000,
      logStats: true,
      memoryWarningThreshold: 5000
    });

    // Enable continuous monitoring
    this.pools.enableAutoAnalysis(true, 10000);

    // Listen for critical issues
    this.pools.on('memory-warning', {
      callback: (event) => {
        console.warn(`Memory high: ${event.data.totalObjects} objects`);
        this.optimizePools();
      },
      priority: 100
    });

    // Listen for creation success
    this.pools.on('pool-created', {
      callback: (event) => {
        console.log(`Pool ready: ${event.data.poolId}`);
      },
      priority: 0
    });
  }

  // Register bullets with TRY-CATCH for validation
  registerBulletPool(): void {
    try {
      const bulletPool = this.pools.createPool(
        'game:bullets',
        () => ({
          id: '',
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          damage: 0,
          reset: function() {
            this.id = '';
            this.position = { x: 0, y: 0 };
            this.velocity = { x: 0, y: 0 };
            this.damage = 0;
          }
        }),
        (b) => b.reset(),
        { initialCapacity: 50, maxSize: 500, logStats: true }
      );

      // Pre-warm
      this.pools.warmUpPool('game:bullets', 20);

    } catch (error) {
      // Handle creation failure
      console.error('Failed to register bullet pool:', error);
      // Don't crash engine - continue with other systems
    }
  }

  // Update loop
  update(): void {
    this.time.update(delta);

    // Update manager for auto-analysis
    this.pools.update();

    // Check performance periodically
    if (this.time.frame % 600 === 0) { // Every 10s at 60fps
      const stats = this.pools.analyzePerformance(true);
      if (stats) {
        this.reportPerformance(stats);
      }
    }
  }

  // Pool optimization
  optimizePools(): void {
    const stats = this.pools.getAllPoolStats();

    for (const [id, stat] of stats) {
      if (stat.efficiency < 0.3) {
        console.log(`Low efficiency pool: ${id}`);
        this.pools.updatePoolConfig(id, {
          initialCapacity: Math.max(0, stat.total - 20),
          maxSize: Math.max(100, stat.total - 100)
        });
      }
    }
  }

  // Recovery from errors
  emergencyReset(): void {
    console.warn('Emergency pool cleanup triggered');
    this.pools.destroyAllPools();

    // Re-register essential pools
    try {
      this.registerBulletPool();
      this.registerParticlePool();
    } catch (e) {
      console.error('Failed emergency reset:', e);
    }
  }
}
```

### Bullet System with Robust Error Handling
```typescript
class BulletSystem {
  private poolManager: ObjectPoolManager;
  private bulletPool: ObjectPool<Bullet>;
  private activeBullets: Bullet[] = [];

  constructor() {
    this.poolManager = ObjectPoolManager.getInstance();

    try {
      this.bulletPool = this.poolManager.createPool(
        'bullets',
        () => new Bullet(),
        (bullet) => bullet.reset(),
        {
          initialCapacity: 100,
          maxSize: 2000,
          memoryWarningThreshold: 1000
        }
      );

      // Monitor issues (warnings, not just errors)
      this.poolManager.on('memory-warning', {
        callback: (event) => {
          if (event.data.warnings.some(w => w.poolId === 'default:bullets')) {
            this.reduceActiveBullets();
          }
        },
        priority: 0
      });

      this.poolManager.on('pool-destroyed', {
        callback: (event) => {
          if (event.data.poolId === 'default:bullets') {
            console.warn('Bullet pool was destroyed externally');
            this.recreatePool();
          }
        }
      });

      // Warm up for immediate readiness
      this.poolManager.warmUpPool('default:bullets', 50);

    } catch (error) {
      console.error('Failed to create bullet pool:', error);
      // Fail gracefully - system can work without bullets
      this.bulletPool = null;
    }
  }

  spawn(position: Vector3, velocity: Vector3, damage: number): Bullet {
    if (!this.bulletPool) {
      return null; // Graceful failure
    }

    try {
      const bullet = this.bulletPool.get();
      bullet.position.copy(position);
      bullet.velocity.copy(velocity);
      bullet.damage = damage;
      bullet.active = true;
      this.activeBullets.push(bullet);

      return bullet;
    } catch (error) {
      // get() failed - probably out of memory
      console.warn('Failed to spawn bullet:', error);
      // Release oldest bullet if pool is full
      if (this.activeBullets.length > 0) {
        const oldest = this.activeBullets.shift();
        if (oldest) {
          this.bulletPool.release(oldest);
          // Try again
          return this.spawn(position, velocity, damage);
        }
      }
      return null;
    }
  }

  update(deltaTime: number): void {
    if (!this.bulletPool) return;

    for (let i = this.activeBullets.length - 1; i >= 0; i--) {
      const bullet = this.activeBullets[i];

      if (!bullet.active || bullet.isDead()) {
        // Safe release with validation
        if (this.bulletPool.release(bullet)) {
          this.activeBullets.splice(i, 1);
        } else {
          console.warn('Failed to release bullet to pool');
          this.activeBullets.splice(i, 1); // Remove anyway
        }
        continue;
      }

      bullet.update(deltaTime);
    }
  }

  // Debug utility
  getPoolStats(): string {
    if (!this.bulletPool) return 'Pool not available';

    const stats = this.bulletPool.getStatus();
    return `${stats.inUse}/${stats.total} bullets, ` +
           `efficiency: ${(stats.efficiency * 100).toFixed(1)}%`;
  }

  private reduceActiveBullets(): void {
    console.warn('Reducing active bullet count due to memory pressure');
    const toRemove = Math.min(5, Math.floor(this.activeBullets.length / 2));
    for (let i = 0; i < toRemove; i++) {
      const bullet = this.activeBullets.shift();
      if (bullet && this.bulletPool) {
        this.bulletPool.release(bullet);
      }
    }
  }

  private recreatePool(): void {
    console.log('Recreating bullet pool...');
    try {
      this.bulletPool = this.poolManager.createPool(
        'bullets',
        () => new Bullet(),
        (bullet) => bullet.reset(),
        { initialCapacity: 50, maxSize: 1000 }
      );
      this.poolManager.warmUpPool('default:bullets', 20);
    } catch (error) {
      console.error('Failed to recreate bullet pool:', error);
    }
  }
}
```

### Centralized Pool Dashboard
```typescript
class PerformanceDashboard {
  private manager: ObjectPoolManager;
  private enabled: boolean = false;

  constructor() {
    this.manager = ObjectPoolManager.getInstance();
  }

  enable(): void {
    if (this.enabled) return;

    // Performance analysis events (read only)
    this.manager.on('performance-analysis', {
      callback: (event) => {
        this.renderAnalysis(event.data);
      },
      priority: -1
    });

    // Memory warnings (self-healing trigger)
    this.manager.on('memory-warning', {
      callback: (event) => {
        this.showMemoryAlert(event.data);
        this.autoFixMemory(event.data);
      },
      priority: 100  // High priority to catch early
    });

    // Error tracking (for debugging)
    this.manager.on('error', {
      callback: (event) => {
        console.error('Pool Manager Error:', event.data);
      }
    });

    this.manager.on('warning', {
      callback: (event) => {
        console.warn('Pool Manager Warning:', event.data);
      }
    });

    this.enabled = true;
  }

  disable(): void {
    // Standard EventDispatcher cleanup handled by priority system
    this.enabled = false;
  }

  private renderAnalysis(data: any): void {
    console.group(`Pool Analysis [${data.timestamp}]`);
    console.log(`Total: ${data.totalObjects}, Active: ${data.totalActive}`);

    const table = Array.from(data.pools.entries()).map(([id, stat]) => ({
      Pool: id,
      Active: stat.inUse,
      Total: stat.total,
      Efficiency: `${(stat.efficiency * 100).toFixed(1)}%`,
      Created: stat.totalCreated || 0,
      Released: stat.totalReleased || 0
    }));

    console.table(table);
    console.groupEnd();
  }

  private showMemoryAlert(data: any): void {
    console.groupCollapsed(`⚠️ MEMORY WARNING (${data.totalObjects} objects)`);
    console.log(`Active: ${data.totalActive}`);
    console.table(data.warnings);
    console.trace('Stack trace');
    console.groupEnd();
  }

  private autoFixMemory(data: any): void {
    console.log('Applying auto-fix for memory issues...');

    for (const warning of data.warnings) {
      if (warning.reason === 'size') {
        const pool = this.manager.getPool(warning.poolId);
        if (pool) {
          const current = pool.getCapacity();
          const target = Math.max(100, warning.value * 0.8);
          this.manager.updatePoolConfig(warning.poolId, {
            maxSize: target
          });
          console.log(`Reduced ${warning.poolId} capacity: ${current} → ${target}`);
        }
      } else if (warning.reason === 'efficiency') {
        const pool = this.manager.getPool(warning.poolId);
        if (pool) {
          const stats = pool.getStatus();
          if (stats.available > stats.inUse * 3) {
            // Too much idle capacity
            this.manager.updatePoolConfig(warning.poolId, {
              maxSize: Math.floor(stats.total * 0.7)
            });
            console.log(`Shrunk ${warning.poolId} due to low efficiency`);
          }
        }
      }
    }
  }

  // Manual controls
  forceAnalysis(): void {
    const result = this.manager.analyzePerformance(true);
    if (result) {
      console.log('Manual analysis complete - see console above');
    } else {
      console.log('Analysis skipped (disabled or too soon)');
    }
  }

  getDetailedStatus(): Map<string, CoreObjectPoolStats> {
    return this.manager.getAllPoolStats(true);
  }
}
```

### Integration with DestroySequence
```typescript
class SceneLifecycle {
  private manager = ObjectPoolManager.getInstance();
  private poolsWeCreated: string[] = [];

  // Scene enter
  onEnter(): void {
    // Scene-specific pools
    ['projectiles', 'particles', 'enemies'].forEach((name, index) => {
      const id = `scene:${name}`;

      try {
        this.manager.createPool(id, this.factories[index], this.resets[index], {
          initialCapacity: 50,
          maxSize: 1000
        });

        this.poolsWeCreated.push(id);
        this.manager.warmUpPool(id, 10);
      } catch (error) {
        console.error(`Failed to create pool ${id}:`, error);
        // Continue loading other pools
      }
    });
  }

  // Scene exit - clean up with proper error handling
  onExit(): void {
    let successCount = 0;
    let failureCount = 0;

    for (const poolId of this.poolsWeCreated) {
      // destroyPool returns false but doesn't throw
      if (this.manager.destroyPool(poolId)) {
        successCount++;
      } else {
        failureCount++;
        // Still allow cleanup to continue
      }
    }

    if (failureCount > 0) {
      console.warn(`Scene cleanup: ${successCount} ok, ${failureCount} failed`);
    }

    this.poolsWeCreated = [];
  }

  private factories = [
    () => new Projectile(),
    () => new Particle(),
    () => new Enemy()
  ];

  private resets = [
    (p: Projectile) => p.reset(),
    (p: Particle) => p.reset(),
    (e: Enemy) => e.reset()
  ];
}
```

## 🚫 Negative Constraints

### Critical Restrictions
- 🚫 **DO NOT** call initialize() multiple times (warns if attempted)
- 🚫 **DO NOT** create singleton pools without checking existence
- 🚫 **DO NOT** ignore failed warm-up attempts
- 🚫 **DO NOT** assume auto-analysis runs every frame
- 🚫 **DO NOT** mix error modes - understand what uses throw vs warn

### Common Mistakes
```typescript
// ❌ WRONG: Ignoring creation errors
try {
  // Missing factory validation
  const pool = manager.createPool('bad', null, null);
  // Will throw: Factory and reset must be provided
} catch (e) {
  console.log('Error:', e); // Can be caught, but system halted
}

// ✅ CORRECT: Defensive creation with error handling
try {
  const pool = manager.createPool('good', factory, reset, {
    initialCapacity: 10,
    maxSize: 100
  });
} catch (error) {
  console.error('Pool creation failed:', error);
  // Throw flagged catch - system may need fallback
}
```

```typescript
// ❌ WRONG: Treating warnings as errors
class BadHandling {
  constructor() {
    manager.on('warning', {
      callback: () => {
        throw new Error('This breaks flow in warning handler');
      }
    });
  }
}

// ✅ CORRECT: Warning should not stop processing
class GoodHandling {
  constructor() {
    manager.on('warning', {
      callback: (event) => {
        // Log but don't throw
        console.warn(event.data);

        // For memory warnings, attempt recovery
        if (event.data.type === 'memory-warning') {
          // Auto-trim or rellocate
        }
      }
    });
  }
}
```

```typescript
// ❌ WRONG: Assuming warmUp always succeeds
manager.warmUpPool('my-pool', 50); // Returns false silently

// ✅ CORRECT: Always check results
const success = manager.warmUpPool('my-pool', 50);
if (!success) {
  console.warn('Warm-up failed - attempting fallback');
  // Maybe reduce target or wait for GC
}
```

```typescript
// ❌ WRONG: Double initialization
const manager = ObjectPoolManager.getInstance();
manager.initialize({ initialCapacity: 10 });

// Later in code:
manager.initialize({ initialCapacity: 20 }); // What happens?

// ✅ CORRECT: Check if already initialized
const manager = ObjectPoolManager.getInstance();
if (!manager['initialized']) {
  manager.initialize({ initialCapacity: 10 });
}
```

```typescript
// ❌ WRONG: Letting pool destroy fail silently
function cleanup() {
  manager.destroyPool('game-pool'); // Returned false? Ignore!
  // Memory still allocated
}

// ✅ CORRECT: Check and handle
const destroyed = manager.destroyPool('game-pool');
if (!destroyed) {
  console.error('Pool cleanup failed manually required');
}
```

## 📊 Performance Analysis

### Manager Per-Frame Overhead
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

Total overhead (idle): ~10ns per frame (~1.9μs per second)
Total overhead (updating): ~O(n) where n = number of pools
```

### Memory per Pool
```
Per registered pool:
  - Map entry: ~50 bytes overhead
  - Event listener storage: ~30 bytes
  - Async event handling: negligible

10 pools:
  ~800 bytes overhead
100 pools:
  ~8KB overhead
```

### Error vs Warning Performance
```
Primary difference:
- logError() (createPool): Throws → Interrupts flow
- logWarning() (destroy/warmUp): Returns false → Graceful continuation

Performance impact:
- Exceptions: ~100-500μs (stack trace generation)
- Warnings: ~1-5μs (console ouput)
- Returns value check: <1ns

Usage pattern:
- Critical errors: throw (after construction)
- Operational issues: return false + log
```

### Analysis Event Rate
```
Batch:
  Memory Warning Triggers:
    - Pool size threshold: O(n) check
    - Efficiency threshold: O(n) check
    - Total processing: linear with pools

If 10 pools:
  ~1μs to scan and emit events (negligible)

If 100 pools:
  ~10μs (occurs once per analysis interval)
```

### State Machine Flows
```
Critical createPool validation state:
  ┌───────────────┐
  │   Validate    │ ── Syntax Error ──> THROW
  └───────┬───────┘
          │
  ┌───────▼───────┐
  │   Duplicate   │ ── Exists ──> THROW
  └───────┬───────┘
          │
  ┌───────▼───────┐
  │   Creation    │ ── Fail ──> THROW
  └───────┬───────┘
          │
  ┌───────▼───────┐
  │   Success     │
  └───────────────┘

Non-critical operations state:
  ┌──────────┐
  │   Find   │ ── Missing ──> Warn + Return false
  └─────┬────┘
        │
  ┌─────▼──────┐
  │   Action   │ ── Filter ──> Warn + Continue
  └────────────┘
```

## 🔗 Integration Patterns

### Defensive Initialization Pattern
```typescript
const manager = ObjectPoolManager.getInstance();

// Guard against multiple init calls
function safeInitialize(options: Partial<ObjectPoolOptions>): void {
  // @ts-ignore - check if initialized using private field
  if (manager['initialized_']) {
    console.warn('Already initialized, skipping');
    return;
  }

  try {
    manager.initialize(options);
  } catch (error) {
    // Should not happen if called correctly
    console.error('Complex init flow failed:', error);
  }
}

safeInitialize({ initialCapacity: 50, maxSize: 1000 });
```

### Extension with Metrics
```typescript
import { EventListener } from '@maxellabs/core';

class PoolMetrics {
  private manager: ObjectPoolManager;
  private metrics: Map<string, any> = new Map();

  constructor() {
    this.manager = ObjectPoolManager.getInstance();
    this.setupMetricsListeners();
  }

  private setupMetricsListeners(): void {
    // Pool creation tracking
    this.manager.on('pool-created', {
      callback: (event) => {
        this.metrics.set(event.data.poolId, {
          created: performance.now(),
          lastAnalysis: 0,
          warnCount: 0
        });
      }
    });

    // Warning tracking
    this.manager.on('warning', {
      callback: (event) => {
        const poolId = event.data.poolId;
        const metric = this.metrics.get(poolId);
        if (metric) {
          metric.warnCount++;
        }
      }
    });

    // Analysis tracking
    this.manager.on('performance-analysis', {
      callback: (event) => {
        const stats = event.data.pools;
        for (const [poolId, stat] of stats) {
          const metric = this.metrics.get(poolId);
          if (metric) {
            metric.lastAnalysis = performance.now();
            metric.efficiency = stat.efficiency;
            metric.total = stat.total;
          }
        }
      }
    });
  }

  getReport(): string {
    const report: string[] = ['=== Pool Metrics Report ==='];
    for (const [id, data] of this.metrics) {
      report.push(`\n${id}:`);
      report.push(`  Warnings: ${data.warnCount}`);
      if (data.lastAnalysis > 0) {
        report.push(`  Efficiency: ${((data.efficiency || 0) * 100).toFixed(1)}%`);
        report.push(`  Total: ${data.total || 0}`);
      }
    }
    return report.join('\n');
  }
}
```

### Scene-Based Pooling
```typescript
class ScenePools {
  private regions: Map<string, string[]> = new Map();

  createRegion(name: string): void {
    this.regions.set(name, []);
  }

  addPool(sceneKey: string, type: string): void {
    const pools = this.regions.get(sceneKey) || [];
    const fullId = `${sceneKey}:${type}`;

    try {
      const manager = ObjectPoolManager.getInstance();
      const pool = manager.createPool(fullId, ...);
      pools.push(fullId);
      this.regions.set(sceneKey, pools);

      manager.warmUpPool(fullId, 10);
    } catch (error) {
      // Log but don't fail scene creation
      console.error(`Failed to create scene pool ${fullId}:`, error);
    }
  }

  destroyRegion(name: string): void {
    const manager = ObjectPoolManager.getInstance();
    const pools = this.regions.get(name) || [];

    let failed = 0;
    for (const poolId of pools) {
      if (!manager.destroyPool(poolId)) {
        failed++;
      }
    }

    if (failed > 0) {
      console.warn(`Region ${name}: ${failed}/${pools.length} pools failed to destroy`);
    }

    this.regions.delete(name);
  }
}
```

---

**Last Updated**: 2025-12-18
**Version**: 1.3.0 (Error Handling Consistency)
**Changes Summary**:
- ✅ `createPool`: Uses `throw Error()` (not logError)
- ✅ `destroyPool`: Uses `logWarning()` + returns false
- ✅ `warmUpPool`: Uses `logWarning()` + returns false
- ✅ `warmUpAllPools`: Handles partial failures
- ✅ Dual API consistency across all failure modes
