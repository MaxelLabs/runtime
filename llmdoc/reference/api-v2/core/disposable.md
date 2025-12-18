---
id: "core-disposable"
type: "reference"
title: "Disposable - Resource Lifecycle Management"
description: "IDisposable interface and helper utilities for managing resources that require explicit cleanup."

context_dependency: []
related_ids: ["core-max-object", "core-refer-resource"]
---

## 🔌 Interface First

### Core Interface
```typescript
interface IDisposable {
  dispose(): void;        // Release resources
  isDisposed(): boolean;  // Check disposal state
}
```

### Disposable Base Class
```typescript
abstract class Disposable implements IDisposable {
  protected abstract onDispose(): void;

  dispose(): void;
  isDisposed(): boolean;
}
```

### Utility Functions
```typescript
// Single resource
dispose(disposable: IDisposable | null | undefined): void;

// Batch cleanup
disposeAll(disposables: (IDisposable | null | undefined)[]): void;

// RAII pattern
using<T extends IDisposable, R>(resource: T, fn: (resource: T) => R): R;
usingAsync<T extends IDisposable, R>(resource: T, fn: (resource: T) => Promise<R>): Promise<R>;

// Structure pattern
combineDisposables(...disposables: IDisposable[]): IDisposable;

// Collector
class DisposableCollector implements IDisposable {
  add<T extends IDisposable>(disposable: T): T;
  remove(disposable: IDisposable): boolean;
  dispose(): void;
  get count(): number;
}
```

## ⚙️ Implementation Logic

### Lifecycle Flow
```typescript
Pseudocode:
class Disposable:
  private _disposed = false

  FUNCTION dispose():
    IF _disposed: RETURN
    _disposed = true
    onDispose()  // Abstract hook

  FUNCTION isDisposed():
    RETURN _disposed

  FUNCTION onDispose():
    // Subclass implements resource cleanup
    // Must be idempotent
```

### Using Pattern (RAII)
```typescript
Pseudocode:
FUNCTION using(resource, fn):
  TRY:
    RETURN fn(resource)
  FINALLY:
    IF resource AND NOT resource.isDisposed():
      resource.dispose()
```

### Batch Disposal
```typescript
Pseudocode:
FUNCTION disposeAll(disposables):
  FOR each IN disposables:
    TRY:
      IF each AND NOT each.isDisposed():
        each.dispose()
    CATCH error:
      logError('Disposal failed:', error)
      // Continue with remaining resources
```

## 📚 Usage Examples

### Basic Disposable
```typescript
import { Disposable } from '@maxellabs/core';

class BufferResource extends Disposable {
  private buffer: ArrayBuffer | null;
  private onCleanup: () => void;

  constructor(size: number, onCleanup: () => void) {
    super();
    this.buffer = new ArrayBuffer(size);
    this.onCleanup = onCleanup;
  }

  protected onDispose(): void {
    // Cleanup logic
    this.buffer = null;
    this.onCleanup();
  }

  get data(): Uint8Array | null {
    if (this.isDisposed()) return null;
    return new Uint8Array(this.buffer!);
  }
}

// Usage
const resource = new BufferResource(1024, () => console.log('Cleaned up'));
try {
  // Use resource...
} finally {
  resource.dispose(); // Guaranteed cleanup
}
```

### RAII with using
```typescript
import { using, Disposable } from '@maxellabs/core';

class FileHandle extends Disposable {
  private fd: number | null = null;

  constructor(path: string) {
    super();
    this.fd = openFile(path);
  }

  protected onDispose(): void {
    if (this.fd !== null) {
      closeFile(this.fd);
      this.fd = null;
    }
  }

  read(): Uint8Array {
    if (this.isDisposed()) throw new Error('Disposed');
    return readFromFile(this.fd);
  }
}

// Usage - automatically cleaned up
const result = using(new FileHandle('data.txt'), (file) => {
  return file.read();
});
// file.dispose() was called automatically
```

### Async RAII Pattern
```typescript
import { usingAsync } from '@maxellabs/core';

class NetworkConnection extends Disposable {
  private socket: WebSocket | null = null;

  constructor(url: string) {
    super();
    this.socket = new WebSocket(url);
  }

  protected onDispose(): void {
    this.socket?.close();
    this.socket = null;
  }

  async send(data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Disposed'));
        return;
      }

      this.socket.send(data);
      this.socket.onmessage = () => resolve();
      this.socket.onerror = reject;
    });
  }
}

// Usage
const result = await usingAsync(
  new NetworkConnection('ws://localhost'),
  async (conn) => {
    return await conn.send('hello');
  }
);
// Connection closed automatically
```

### Resource Pool Pattern
```typescript
import { Disposable } from '@maxellabs/core';

class PooledTexture extends Disposable {
  private textureId: number;
  private pool: TexturePool;

  constructor(id: number, pool: TexturePool) {
    super();
    this.textureId = id;
    this.pool = pool;
  }

  protected onDispose(): void {
    // Return to pool instead of destroying
    this.pool.release(this);
  }

  use(): void {
    if (this.isDisposed()) return;
    // Bind texture...
  }
}

class TexturePool {
  private available: PooledTexture[] = [];

  acquire(): PooledTexture {
    return this.available.pop() || new PooledTexture(/* ... */);
  }

  release(texture: PooledTexture): void {
    this.available.push(texture);
  }
}
```

### Disposable Collector
```typescript
import { DisposableCollector } from '@maxellabs/core';

class SystemManager {
  private resources = new DisposableCollector();

  constructor() {
    // Add multiple resources
    this.resources.add(new EventDispatcher());
    this.resources.add(new Timer(1000));
    this.resources.add(new Buffer(1024));
  }

  shutdown(): void {
    // All resources cleaned up in order
    console.log(`Disposing ${this.resources.count} resources`);
    this.resources.dispose();
  }

  // Add resource after creation
  addResource<T extends IDisposable>(resource: T): T {
    return this.resources.add(resource);
  }
}
```

### Combined Disposables
```typescript
import { combineDisposables, dispose } from '@maxellabs/core';

class MultiResourceSystem {
  private cleanup: IDisposable;

  constructor() {
    const resourceA = new ResourceA();
    const resourceB = new ResourceB();
    const resourceC = new ResourceC();

    // Single disposal point
    this.cleanup = combineDisposables(resourceA, resourceB, resourceC);
  }

  shutdown(): void {
    this.cleanup.dispose(); // Disposes all three
  }
}
```

### Async Cleanup Patterns
```typescript
import { Disposable, disposeAll } from '@maxellabs/core';

class AsyncResource extends Disposable {
  private cleanupPromise: Promise<void> | null = null;

  protected async onDispose(): Promise<void> {
    // Async cleanup
    if (this.cleanupPromise) {
      await this.cleanupPromise;
    }

    // Close connections
    await this.closeConnections();

    // Clear data
    await this.clearStorage();
  }

  dispose(): void {
    if (this.isDisposed()) return;

    // Fire and forget async cleanup
    this.onDispose().catch(err => {
      console.error('Async cleanup failed:', err);
    });

    super.dispose();
  }
}

// Usage with Promise wrapper
class AsyncManager {
  async shutdown(): Promise<void> {
    const resources = [res1, res2, res3];
    const promises = resources.map(res => {
      return new Promise<void>(resolve => {
        res.dispose();
        // Wait for async cleanup
        setImmediate(() => resolve());
      });
    });

    await Promise.all(promises);
    console.log('All resources shut down');
  }
}
```

## 🚫 Negative Constraints

### Critical Restrictions
- 🚫 **DO NOT** call `onDispose()` directly (use `dispose()` wrapper)
- 🚫 **DO NOT** allow async in synchronous `dispose()` (use queue)
- 🚫 **DO NOT** dispose without checking `isDisposed()`
- 🚫 **DO NOT** ignore disposal failures silently
- 🚫 **DO NOT** create circular disposable references

### Common Mistakes
```typescript
// ❌ WRONG: Forgetting to dispose
function processFile() {
  const handle = new FileHandle('data.txt');
  // Process...
  // Leak! handle never disposed
}

// ✅ CORRECT: Try-finally guarantee
function processFile() {
  const handle = new FileHandle('data.txt');
  try {
    // Process...
  } finally {
    handle.dispose();
  }
}
```

```typescript
// ❌ WRONG: Async in sync disposal
class BadDisposable extends Disposable {
  protected onDispose(): void {
    await fetch('/cleanup'); // ❌ Syntax error!
  }
}

// ✅ CORRECT: Either sync or queue async
class GoodDisposable extends Disposable {
  private pending: Promise<void>[] = [];

  protected onDispose(): void {
    queueMicrotask(async () => {
      await fetch('/cleanup');
    });
  }

  // Or provide async method for explicit async cleanup
  async disposeAsync(): Promise<void> {
    await fetch('/cleanup');
    this.dispose();
  }
}
```

```typescript
// ❌ WRONG: Disposing twice causing errors
const resource = new MyResource();
resource.dispose();
// Later...
resource.dispose(); // May cause double-free

// ✅ CORRECT: Idempotent disposal
class SafeDisposable extends Disposable {
  protected onDispose(): void {
    if (!this.buffer) return; // Check state
    // Safe cleanup
    this.buffer = null;
  }
}
```

```typescript
// ❌ WRONG: Circular disposal dependency
class A { constructor(private b: B) {} dispose() { this.b.dispose(); } }
class B { constructor(private a: A) {} dispose() { this.a.dispose(); } }

// Leads to infinite recursion
const a = new A(b);
const b = new B(a);
// a.dispose() -> b.dispose() -> a.dispose() -> ...

// ✅ CORRECT: Break cycle manually
class SafeA {
  dispose() { /* only cleanup owned resources */ }
}

class SafeB {
  constructor(private a: SafeA) {}
  dispose() {
    // Don't dispose a - externally managed
    // Clean up only own resources
  }
}
```

### Resource Leak Patterns
```typescript
// ❌ WRONG: Forgetting nested resources
class Container extends Disposable {
  private children: Resource[] = [];

  protected onDispose(): void {
    // Memory leak: children not disposed!
    this.children = [];
  }
}

class GoodContainer extends Disposable {
  private children: Resource[] = [];

  protected onDispose(): void {
    // Dispose all children
    this.children.forEach(child => child.dispose());
    this.children = [];
  }
}
```

## 📊 Performance Analysis

### Memory Overhead
```
Disposable object:
- _disposed flag: 1 byte (with alignment ~8 bytes)
- VTable pointer: 8 bytes
- Total overhead: ~16 bytes per instance

DisposableCollector:
- Array capacity: ~8 bytes + contents
- Per resource: 8 bytes reference
- Total: 16 + 8n bytes
```

### Performance Characteristics
| Operation | Complexity | Notes |
|-----------|------------|-------|
| `dispose()` | O(1) + resource cleanup | Depends on resource type |
| `isDisposed()` | O(1) | Bit check |
| `using()` | O(1) + function time | Try-finally overhead (~30ns) |
| `disposeAll()` | O(n) | Stack traces on failures |

### Cleanup Costs
```typescript
// Disposable overhead: ~5-10ns per check
// Total workflow:
1. Allocate: 0ns (embedded in object)
2. Use: 0ns (no overhead)
3. Dispose: ~10ns + resource cleanup
4. Check: ~5ns (isDisposed)

// Savings vs manual:
// Manual - often forgotten (leaks)
// Disposable - guaranteed cleanup
```

## 🔗 Integration Patterns

### Disposable MaxObject (Base Class)
```typescript
// In max-object.ts:
import { Disposable } from './disposable';

abstract class MaxObject extends Disposable {
  readonly id: string = uuid();

  protected abstract onDestroy(): void;

  protected onDispose(): void {
    this.onDestroy();
  }

  destroy(): void {
    if (!this.isDisposed()) {
      this.dispose();
    }
  }
}
```

### Event System (Resource Cleanup)
```typescript
import { DisposableCollector } from './disposable';

class EventDispatcher extends Disposable {
  private listeners = new Map<string, EventListener[]>();
  private collector = new DisposableCollector();

  on(event: string, listener: EventListener): void {
    this.listeners.get(event)?.push(listener);
    this.collector.add(listener); // Track for cleanup
  }

  protected onDispose(): void {
    // Release all listeners
    this.collector.dispose();
    this.listeners.clear();
  }
}
```

### Object Pool Integration
```typescript
import { Disposable } from './disposable';

class PooledObject extends Disposable {
  private resetCallback: () => void;

  constructor(onReset: () => void) {
    super();
    this.resetCallback = onReset;
  }

  protected onDispose(): void {
    // Return to pool if available
    if (PooledObjectPool.canRelease(this)) {
      PooledObjectPool.release(this);
    } else {
      // Pool full - actually destroy
      this.finalCleanup();
    }
  }

  reset(): void {
    this.resetCallback();
  }
}
```

### Async Cleanup Queue
```typescript
import { Disposable } from './disposable';

class AsyncCleanupQueue {
  private static queue: (() => Promise<void>)[] = [];
  private static running = false;

  static add(task: () => Promise<void>): void {
    this.queue.push(task);
    if (!this.running) {
      this.process();
    }
  }

  private static async process(): Promise<void> {
    this.running = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      try {
        await task();
      } catch (e) {
        console.error('Async cleanup failed:', e);
      }
    }
    this.running = false;
  }
}

// Using in disposable
class AsyncResource extends Disposable {
  protected onDispose(): void {
    AsyncCleanupQueue.add(async () => {
      await this.cleanupAsync();
    });
  }

  private async cleanupAsync(): Promise<void> {
    // Heavy async cleanup...
  }
}
```

---

**Last Updated**: 2025-12-18
**Version**: 1.0.0