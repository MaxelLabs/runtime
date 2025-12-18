---
# Identity
id: "core-ioc-container"
type: "reference"
title: "IOC Container - Thread-Safe Dependency Injection"

# Semantics
description: "Singleton dependency injection container with double-checked locking pattern for thread-safe initialization in concurrent environments."

# Graph
context_dependency: ["core-max-object"]
related_ids: ["core-event-dispatcher", "core-canvas-wrapper"]
---

## 🔌 Interface First

### Core Interfaces

```typescript
// Container Registration Interface
interface ContainerRegistration {
  register<T>(key: string, instance: T): void;
  registerFactory<T>(key: string, factory: () => T): void;
  resolve<T>(key: string): T;
  has(key: string): boolean;
  remove(key: string): void;
  clear(): void;
}

// Thread-Safe Singleton Pattern
interface ThreadSafeSingleton {
  private static instance: Container | null;
  private static isInitializing: boolean;
  getInstance(): Container;
}
```

### Service Key Constants
```typescript
export const ServiceKeys = {
  ENGINE: 'engine',
  RENDER_CONTEXT: 'render_context',
  SCENE_MANAGER: 'scene_manager',
  RESOURCE_MANAGER: 'resource_manager',
  EVENT_MANAGER: 'event_manager',
  INPUT_MANAGER: 'input_manager',
  RENDERER: 'renderer',
  TIME: 'time',
};
```

## ⚙️ Implementation Logic

### Thread-Safe Singleton Pattern
```typescript
Pseudocode:
1. First check (fast path)
   IF instance exists:
     RETURN instance immediately

2. Concurrency protection
   IF isInitializing flag set:
     WHILE isInitializing:
       Spin-wait (yields to event loop)
     RETURN completed instance

3. Set initialization flag
   SET isInitializing = true

4. Double-checked locking
   TRY:
     IF instance still null:
       CREATE new Container()
   FINALLY:
     CLEAR isInitializing flag

5. Return instance
   RETURN instance
```

### Dependency Resolution Flow
```typescript
Pseudocode:
FUNCTION resolve(key):
  // Check instance cache first
  IF services.has(key):
    RETURN services.get(key)

  // Check factory functions
  IF factories.has(key):
    instance = factories.get(key)()
    services.set(key, instance) // Cache for future calls
    RETURN instance

  // Error handling
  THROW Error("Service not registered")
```

## 📚 Usage Examples

### Basic Registration & Resolution
```typescript
// Create container singleton
const container = Container.getInstance();

// Register instance
container.register('logger', new ConsoleLogger());

// Register factory (lazy instantiation)
container.registerFactory('database', () => new DatabaseConnection());

// Resolve services
const logger = container.resolve<Logger>('logger');
const db = container.resolve<DatabaseConnection>('database');
```

### Circular Dependency Prevention
```typescript
// Service A depends on Service B
container.registerFactory('serviceA', () => {
  const serviceB = container.resolve<ServiceB>('serviceB');
  return new ServiceA(serviceB);
});

// Service B depends on Service A
container.registerFactory('serviceB', () => {
  const serviceA = container.resolve<ServiceA>('serviceA');
  return new ServiceB(serviceA);
});

// First call resolves both (order doesn't matter due to factory pattern)
const serviceA = container.resolve<ServiceA>('serviceA');
```

### Lifecycle Management
```typescript
// Check availability
if (container.has('renderer')) {
  const renderer = container.resolve('renderer');
}

// Remove service (for hot-reloading scenarios)
container.remove('renderer');

// Clear all (testing/reset scenarios)
container.clear();
```

## 🚫 Negative Constraints

### Critical Restrictions
- 🚫 **DO NOT** use Container in multi-threaded JavaScript (not supported)
- 🚫 **DO NOT** register factory functions that throw during execution
- 🚫 **DO NOT** bypass singleton pattern via `new Container()`
- 🚫 **DO NOT** store references to Container in circular data structures
- 🚫 **DO NOT** modify resolved instances without container awareness

### Common Mistakes
- ❌ Creating multiple instances manually
- ❌ Forgetting to register services before resolution
- ❌ Using container for transient objects (use factories properly)
- ❌ Long-running factory functions in spin-wait scenarios
- ❌ Ignoring resolution errors in production

### Performance Considerations
- ✅ First call is slower (requires initialization)
- ✅ Subsequent calls are O(1) map lookups
- ✅ Spin-wait only occurs in rare race conditions
- ✅ Factory functions execute once, results cached
- ✅ Memory footprint: 2 Maps + singleton reference

## 🔗 Cross References

### Related Core Components
- **EventDispatcher**: Decoupled event handling via container
- **CanvasWrapper**: Browser validation without tight coupling
- **Transform**: Scene graph management services

### Architecture Patterns
- **Dependency Injection**: Inversion of Control principle
- **Singleton Pattern**: Thread-safe initialization semantics
- **Factory Pattern**: Lazy instantiation strategy

### Error Handling
```typescript
// Always handle resolution failures
try {
  const service = container.resolve('non-existent');
} catch (error) {
  console.error('Service resolution failed:', error.message);
}
```

## 📊 Memory & Performance Analysis

### Memory Footprint
```
Container Instance: ~48 bytes + Maps overhead
Services Map: O(n) where n = registered instances
Factories Map: O(n) where n = registered factories
```

### Performance Characteristics
| Operation | Complexity | Notes |
|-----------|------------|-------|
| `getInstance()` | O(1) | After initialization |
| `register()` | O(1) | Map insertion |
| `resolve()` | O(1) | Map lookup + factory execution |
| `has()` | O(1) | Map lookup |
| `remove()` | O(1) | Map deletion |
| `clear()` | O(n) | Clears both maps |

### Thread Safety Analysis
- **JavaScript Context**: No true threads, but async execution can cause race conditions
- **Solution**: Double-checked locking with `isInitializing` flag prevents duplicate initialization
- **Trade-off**: Spin-wait during concurrent initialization (rare scenario)

## 🎯 When to Use

### Ideal Scenarios
- ✅ Application-level service registration
- ✅ Shared resource management (render context, asset loader)
- ✅ Cross-module dependency resolution
- ✅ Testing (mock injection)
- ✅ Plugin architecture (dynamic service registration)

### When to Avoid
- ❌ Per-entity/temporary services (use direct instantiation)
- ❌ High-frequency creation/destruction (object pools better)
- ❌ Simple dependencies (direct references preferred)
- ❌ No cross-module sharing needed

---
**Last Updated**: 2025-12-18
**Version**: 1.0.0 (Reflecting thread-safe implementation)
