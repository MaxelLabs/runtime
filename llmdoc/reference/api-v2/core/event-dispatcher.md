---
# Identity
id: "core-event-dispatcher"
type: "reference"
title: "Event Dispatcher - Priority-Based Event System"

# Semantics
description: "Advanced event system with priority-based listeners, event bubbling/capturing, and one-time execution support."

# Graph
context_dependency: ["core-max-object"]
related_ids: ["core-ioc-container", "core-transform-component"]
---

## 🔌 Interface First

### Event Listener Interface
```typescript
interface EventListener {
  callback: (event: Event) => void;
  target?: any;              // Context object for 'this' binding
  priority: number;          // Higher = executes first
  once: boolean;             // Auto-remove after execution
}
```

### Event Object Interface
```typescript
interface Event {
  type: string;
  bubbles: boolean;
  data: any;
  target: EventDispatcher;
  currentTarget: EventDispatcher;
  isPropagationStopped(): boolean;
  isImmediatelyStopped(): boolean;
}
```

### Event Dispatcher Class Interface
```typescript
interface IEventDispatcher {
  // Registration
  on(type: string, listener: EventListener): void;
  once(type: string, callback: (event: Event) => void, target?: any, priority?: number): void;
  off(type: string, listener: EventListener): void;

  // Emission
  emit(type: string, data?: any, bubbles?: boolean): boolean;
  dispatchEvent(typeOrEvent: string | Event, data?: any): boolean;

  // Hierarchy
  setParent(parent: EventDispatcher): void;
  addChild(child: EventDispatcher): void;
  removeChild(child: EventDispatcher): void;

  // Control
  pauseEvents(): void;
  resumeEvents(): void;
  enableCapture(enabled: boolean): void;
  enableBubbling(enabled: boolean): void;

  // Inspection
  hasEventListener(type: string): boolean;
  getEventListenerCount(type?: string): number;
}
```

## ⚙️ Implementation Logic

### Event Priority Flow
```typescript
Pseudocode:
FUNCTION dispatchToLocalListeners(event):
  listeners = this.listeners.get(event.type)

  IF listeners IS null:
    RETURN false

  // Create stable copy for iteration
  listenersCopy = Array.from(listeners)

  // Sort by priority (descending)
  listenersCopy.sort((a, b) => b.priority - a.priority)

  FOR listener IN listenersCopy:
    IF event.isImmediatelyStopped():
      BREAK

    TRY:
      IF listener.target:
        listener.callback.call(listener.target, event)
      ELSE:
        listener.callback(event)
    CATCH error:
      console.error(`Event handler error for ${event.type}:`, error)

  RETURN true
```

### Event Bubbling & Capturing
```typescript
Pseudocode:
FUNCTION dispatchEvent(event):
  IF this.paused:
    RETURN false

  // Capture phase (top -> down)
  IF this.captureEnabled AND this.parent AND event.bubbles:
    this.parent.dispatchCaptureEvent(event)

  // Target phase
  success = this.dispatchToLocalListeners(event)

  // Bubble phase (bottom -> up)
  IF this.bubbleEnabled AND event.bubbles AND NOT event.isPropagationStopped() AND this.parent:
    success = this.parent.dispatchBubbleEvent(event) OR success

  // Cleanup
  this.cleanupOnceListeners(event.type)

  RETURN success
```

### One-Time Listener Cleanup
```typescript
Pseudocode:
FUNCTION cleanupOnceListeners(type):
  listeners = this.listeners.get(type)

  IF NOT listeners:
    RETURN

  toRemove = []

  FOR listener IN listeners:
    IF listener.once:
      toRemove.push(listener)

  FOR listener IN toRemove:
    listeners.delete(listener)

  IF listeners.size IS 0:
    this.listeners.delete(type)
```

## 📚 Usage Examples

### Basic Event Flow
```typescript
class Button extends EventDispatcher {
  constructor() {
    super();
    this.setupEvents();
  }

  setupEvents(): void {
    // Priority 10 (highest) - validation
    this.on('click', {
      callback: (event) => {
        if (this.isDisabled) {
          event.stopImmediatePropagation();
          return;
        }
      },
      priority: 10
    });

    // Priority 5 - business logic
    this.on('click', {
      callback: (event) => {
        console.log('Button clicked with data:', event.data);
      },
      priority: 5
    });

    // Priority 0 - analytics (run last)
    this.on('click', {
      callback: (event) => {
        analytics.track('button_click', event.data);
      },
      priority: 0
    });
  }

  click(data: any): void {
    this.emit('click', data, true); // Enable bubbling
  }
}
```

### Event Hierarchy
```typescript
const root = new EventDispatcher('root');
const container = new EventDispatcher('container');
const button = new EventDispatcher('button');

// Build hierarchy
container.setParent(root);
button.setParent(container);

// Global capture (happens at root)
root.on('login_capture', {
  callback: (event) => {
    console.log('CAPTURE - Root sees login first');
  }
});

// Container local listener
container.on('login', {
  callback: (event) => {
    console.log('TARGET - Container handles login');
  }
});

// Bubble up from button
button.on('login', {
  callback: (event) => {
    console.log('TARGET - Button dispatched');
  }
});

// Triggers: capture -> target -> bubble
button.emit('login', { user: 'admin' }, true);
```

### One-Time & Priority System
```typescript
const dispatcher = new EventDispatcher();

// One-time listener (auto-cleanup)
dispatcher.once('data-ready', {
  callback: (event) => {
    console.log('First load data:', event.data);
  },
  priority: 100
});

// Critical handlers first
dispatcher.on('save', {
  callback: (event) => {
    validateOrThrow(event.data);
  },
  priority: 1000
});

// Normal save
dispatcher.on('save', {
  callback: (event) => {
    repository.save(event.data);
  },
  priority: 0
});
```

### Error Handling & Resilience
```typescript
class RobustEventSystem extends EventDispatcher {
  dispatchEvent(event: string | Event, data?: any): boolean {
    try {
      return super.dispatchEvent(event, data);
    } catch (error) {
      // Recovery without crashing
      console.error('Event system failure:', error);

      // Fallback notification
      this.emit('system-error', {
        originalEvent: typeof event === 'string' ? event : event.type,
        error: error
      });

      return false;
    }
  }
}
```

## 🚫 Negative Constraints

### Critical Restrictions
- 🚫 **DO NOT** modify listeners during event emission
- 🚫 **DO NOT** rely on listener execution order (except priority)
- 🚫 **DO NOT** create infinite loops via bubbling
- 🚫 **DO NOT** emit events with empty types
- 🚫 **DO NOT** forget to clean up completed events

### Common Mistakes
```typescript
// ❌ WRONG: Modifying listeners during iteration
this.on('click', { callback: () => this.off('click', listener) });

// ❌ WRONG: Expecting synchronous execution order without priority
this.on('event', { callback: () => console.log('1') });
this.on('event', { callback: () => console.log('2') });

// ✅ CORRECT: Use priority for order
this.on('event', { callback: () => console.log('1'), priority: 10 });
this.on('event', { callback: () => console.log('2'), priority: 5 });

// ❌ WRONG: Missing error handling
this.on('critical', { callback: () => { throw new Error('boom'); } });

// ✅ CORRECT: Wrap in try-catch
this.on('critical', {
  callback: (event) => {
    try { dangerousOperation(); }
    catch (e) { console.error('Handler failed:', e); }
  }
});
```

### Performance Warnings
- Heavy recursion in handlers can cause stack overflow
- Too many listeners for single event = slow iteration
- Not using `once()` leads to memory leaks
- Unused capture/bubble phases impact performance

## 🔗 Integration Patterns

### With IOC Container
```typescript
const container = Container.getInstance();

// Singleton event bus
container.registerFactory('event-bus', () => new EventDispatcher('global'));

// Usage
const bus = container.resolve<EventDispatcher>('event-bus');
bus.on('app-start', {
  callback: () => console.log('App initializing...'),
  priority: 100
});
bus.emit('app-start');
```

### With Transform Hierarchy
```typescript
// Sync scene graph events
const root = new TransformComponent();
const child = new TransformComponent();

child.on('transform-changed', {
  callback: () => {
    child.updateWorldMatrix();
    child.emit('world-updated', null, true); // Bubble to parents
  },
  priority: 20
});

root.on('world-updated', {
  callback: (event) => {
    // React to child changes
    root.updateBounds();
  }
});
```

### State Management Example
```typescript
class StateStore extends EventDispatcher {
  private state: Map<string, any> = new Map();

  setState(key: string, value: any): void {
    const old = this.state.get(key);
    this.state.set(key, value);

    // Priority 0: Notify everyone
    this.emit('state-changed', { key, old, new: value });

    // Priority -5: Persistence side effect
    this.on('state-changed', {
      callback: (event) => localStorage.setItem(event.data.key, event.data.new),
      priority: -5,
      once: false
    });
  }
}
```

## 📊 Performance Analysis

### Listener Storage Efficiency
```
Listener Storage: Map<string, Set<EventListener>>
- Event Type Lookup: O(1)
- Add Listener: O(1)
- Remove Listener: O(1)
- Iteration: O(n) where n = listener count
- Sorting: O(n log n) - cached in copy
```

### Event Dispatch Cost
| Phase | Complexity | Notes |
|-------|------------|-------|
| Capture | O(log n) | Tree traversal if bubble enabled |
| Target | O(n log n) | Sort + iteration |
| Bubble | O(log n) | Tree traversal |
| Cleanup | O(n) | Filter once-only listeners |

### Memory Considerations
- Per dispatcher: ~128 bytes + maps
- Per listener: ~64 bytes (1 listener object)
- Event objects: ~96 bytes (created per emit)

### Optimized Patterns
```typescript
// ❌ Inefficient: Creating listeners in hot code
for (let i = 0; i < 1000; i++) {
  this.on('damage', { callback: () => {}, priority: 0 }); // 1000 temporary objects
}

// ✅ Efficient: Reuse listener
const damageHandler = { callback: () => {}, priority: 0 };
for (let i = 0; i < 1000; i++) {
  this.on('damage', damageHandler);
}
```

## 🎯 Usage Guidelines

### Recommended Patterns
1. **High-priority**: Validation, error handling
2. **Mid-priority**: Core processes, business logic
3. **Low-priority**: Analytics, logging, telemetry
4. **Negative priority**: Side effects (persistence, cleanup)

### When to Use Bubbling/Capture
```
Bubbling: ✓ Parent-child relationships
          ✓ Need to react to child events
          ✓ Scene graph updates

Capturing: ✓ Global interception
           ✓ Before-target validation
           ✓ Cross-cutting concerns
```

### Testing Strategy
```typescript
// Mock event testing
test('event flow with priority', () => {
  const dispatcher = new EventDispatcher();
  const executionOrder: number[] = [];

  dispatcher.on('test', {
    callback: () => executionOrder.push(1),
    priority: 10
  }
  );
  dispatcher.on('test', {
    callback: () => executionOrder.push(2),
    priority: 5
  });

  dispatcher.emit('test');

  expect(executionOrder).toEqual([1, 2]);
});
```

---
**Last Updated**: 2025-12-18
**Version**: 1.0.0 (Reflecting priority-based EventListener objects)
