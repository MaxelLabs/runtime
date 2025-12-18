---
# Identity
id: "core-event-dispatcher"
type: "reference"
title: "Event Dispatcher - Priority-Based Event System"
description: "Advanced event system with priority-based listeners, event bubbling/capturing, and dual API for listener registration."

# Graph
context_dependency: ["core-max-object"]
related_ids: ["core-ioc-container", "core-transform-component", "core-entity"]
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

### Event Dispatcher Class Interface (Updated)
```typescript
interface IEventDispatcher {
  // ===== NEW: Dual API for Registration =====

  // Method 1: Full EventListener object (original)
  on(type: string, listener: EventListener): void;

  // Method 2: Convenience functional API (NEW)
  on(type: string, callback: (event: Event) => void, target?: any, priority?: number): void;

  // Once API (symmetric)
  once(type: string, callback: (event: Event) => void, target?: any, priority?: number): void;

  // Removal (dual mode)
  off(type: string, listener: EventListener): void;
  off(type: string, callback: (event: Event) => void, target?: any): void;

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

### Dual Registration API
```typescript
Pseudocode:
FUNCTION on(type, listener, target?, priority?):
  listeners = getOrCreateListeners(type)

  // Detect API mode
  IF typeof listener === 'function':
    // Convenience API: on(type, callback, target, priority)
    eventListener = {
      callback: listener,
      target: target,
      priority: priority || 0,
      once: false
    }
  ELSE:
    // Original API: on(type, ListenerObject)
    eventListener = listener

  listeners.add(eventListener)
```

### Dual Removal API
```typescript
Pseudocode:
FUNCTION off(type, listener, target?):
  listeners = this.listeners.get(type)
  IF listeners IS null: RETURN

  IF typeof listener === 'function':
    // Convenience mode: off(type, callback, target?)
    FOR existing IN listeners:
      IF existing.callback == listener AND
         (target === undefined OR existing.target == target):
        listeners.delete(existing)
        BREAK
  ELSE:
    // Original mode: off(type, ListenerObject)
    listeners.delete(listener)

  IF listeners.size IS 0:
    this.listeners.delete(type)
```

### Event Priority, Bubbling, Capture (Unchanged)
```typescript
Pseudocode:
FUNCTION dispatchEvent(event):
  IF this.paused: RETURN false

  // 1. Capture phase (skip if bubbling disabled)
  IF captureEnabled AND this.parent AND event.bubbles:
    this.parent.dispatchCaptureEvent(event)

  // 2. Target phase
  success = dispatchToLocalListeners(event)

  // 3. Bubble phase
  IF bubbleEnabled AND event.bubbles AND
     NOT event.isPropagationStopped() AND this.parent:
    success = this.parent.dispatchBubbleEvent(event) OR success

  // Cleanup
  this.cleanupOnceListeners(event.type)

  RETURN success
```

### Once Listener Cleanup (Unchanged)
```typescript
Pseudocode:
FUNCTION cleanupOnceListeners(type):
  listeners = this.listeners.get(type)
  IF NOT listeners: RETURN

  FOR listener IN listeners:
    IF listener.once:
      listeners.delete(listener)

  IF listeners.size IS 0:
    this.listeners.delete(type)
```

## 📚 Usage Examples

### Dual API Comparison
```typescript
import { EventDispatcher } from '@maxellabs/core';

const dispatcher = new EventDispatcher();

// ===== BEFORE: Object-based API =====
// Good for complex scenarios, verbose for simple cases
dispatcher.on('player-hit', {
  callback: (event) => {
    console.log('Player took damage:', event.data.damage);
    this.health -= event.data.damage; // 'this' from target
  },
  target: this,           // Context binding
  priority: 20,          // Order control
  once: false            // Multi-fire
});

// ===== NEW: Functional API (Recommended for common use) =====
// Concise, with optional parameters
dispatcher.on('player-hit', (event) => {
  console.log('Player took damage:', event.data.damage);
  this.health -= event.data.damage;
}, this, 20);  // target, priority optional

// ===== Pattern: Mix Both Based on Use Case =====

// Simple callback - use functional API
dispatcher.on('item-collected', (e) => {
  inventory.add(e.data.item);
});

// Complex with validation - use object API
dispatcher.on('save-game', {
  callback: (e) => {
    if (this.validate(e.data)) {
      this.repository.save(e.data);
    }
  },
  priority: 999,
  once: true  // Critical save, only once
});

// Removal examples
const callback = (e) => console.log(e.data);

// Functional removal
dispatcher.on('menu-click', callback);
dispatcher.off('menu-click', callback);

// Object removal (when you stored the listener)
const listener = {
  callback: (e) => console.log(e.data),
  priority: 0,
  once: false
};
dispatcher.on('menu-click', listener);
dispatcher.off('menu-click', listener);
```

### Complete Dual Mode Examples
```typescript
// 1. Priority System - Functional API
class CombatSystem extends EventDispatcher {
  constructor() {
    super();
    this.setupCombatEvents();
  }

  setupCombatEvents(): void {
    // High priority: Critical
    this.on('damage', (
      event // callback
    ) => {
      if (this.isInvincible(event.data.source)) {
        event.stopImmediatePropagation();
      }
    }, this, 10); // target, priority

    // Medium priority: Core logic
    this.on('damage', (event) => {
      this.target.health -= event.data.amount;
    }, this, 5);

    // Low priority: Visual feedback
    this.on('damage', (event) => {
      this.showDamageIndicator(event.data.amount);
    }, this, 0);
  }

  // One-time event - Functional
  triggerUltimate(): void {
    this.once('ultimate-ready', (event) => {
      this.activateSuperMode();
    }, this, 100); // High priority
  }
}

// 2. Complex Listed Registration - Object API
class UIEventSystem extends EventDispatcher {
  private analyticsListener = {
    callback: (event: Event) => {
      // Complex analytics tracking
      this.trackEvent('button_click', {
        button: event.data.button,
        timestamp: performance.now(),
        sessionId: this.sessionId
      });
    },
    priority: -10, // Run last
    once: false
  };

  setupUIEvents(): void {
    // Register analytics once
    this.on('ui-interaction', this.analyticsListener);

    // Register validation
    this.on('ui-interaction', {
      callback: (event) => this.validateInput(event.data),
      priority: 100, // Run first
      once: false
    });
  }

  // Cleanup
  destroy(): void {
    this.off('ui-interaction', this.analyticsListener);
  }
}

// 3. Event Bubbling with Functional API
class Component extends EventDispatcher {
  private parent: Component | null = null;

  constructor() {
    super();
    this.setupEventPropagation();
  }

  setupEventPropagation(): void {
    // Listen locally - Functional API
    this.on('click', (event) => {
      console.log(`${this.name} received click`);
    }, this, 5);

    // Parent listens with capture
    if (this.parent) {
      this.parent.on('click_capture', (event) => {
        console.log(`Parent captured click from ${this.name}`);
      }, this, 10);
    }
  }

  click(): void {
    // Enable bubbling
    this.emit('click', { source: this }, true);
  }
}
```

### Removal Scenarios
```typescript
import { EventDispatcher, EventListener } from '@maxellabs/core';

class GameUI extends EventDispatcher {
  private menuButtonHandler = (event: Event) => this.onMenuClick();

  setupButtons(): void {
    // Functional listener (easy to remove)
    this.on('menu-click', this.menuButtonHandler, this);
  }

  teardownButtons(): void {
    // Simple removal
    this.off('menu-click', this.menuButtonHandler, this);
  }

  // Object listener (better for non-class contexts)
  private keyboardListener: EventListener = {
    callback: (e) => {
      if (e.data.key === 'Escape') this.close();
    },
    priority: 1,
    once: false
  };

  setupKeyboard(): void {
    this.on('keydown', this.keyboardListener);
  }

  // Alternative: Anonymous listener with manual tracking
  private anonymousListeners: Set<EventListener> = new Set();

  registerDynamicListener(): void {
    const listener: EventListener = {
      callback: (e) => console.log('Dynamic', e),
      priority: 0,
      once: false
    };

    this.on('dynamic', listener);
    this.anonymousListeners.add(listener);
  }

  clearDynamicListeners(): void {
    for (const listener of this.anonymousListeners) {
      this.off('dynamic', listener);
    }
    this.anonymousListeners.clear();
  }
}
```

### Error Recovery
```typescript
import { EventDispatcher } from '@maxellabs/core';

class RobustDispatcher extends EventDispatcher {
  on(type: string, listener: any, target?: any, priority?: number): void {
    // Wrap for safety
    const safeCallback = (event: Event) => {
      try {
        if (typeof listener === 'function') {
          listener.call(target, event);
        } else {
          listener.callback.call(listener.target || target, event);
        }
      } catch (error) {
        this.emit('error', {
          type,
          error,
          originalEvent: event
        });
        // Continue normally - other handlers unaffected
      }
    };

    if (typeof listener === 'function') {
      super.on(type, safeCallback, target, priority);
    } else {
      super.on(type, {
        callback: safeCallback,
        target: listener.target,
        priority: listener.priority,
        once: listener.once
      });
    }
  }
}
```

## 🚫 Negative Constraints

### Critical Restrictions
- 🚫 **DO NOT** mix calls inappropriately (use functional for simple, object for complex)
- 🚫 **DO NOT** store function references without target for removal
- 🚫 **DO NOT** modify listeners during event dispatch
- 🚫 **DO NOT** ignore event type validation

### Common Mistakes (Dual API)
```typescript
// ❌ WRONG: Target misalignment
const handler = function() { console.log(this); }; // 'this' will be global

dispatcher.on('event', handler, this);  // Missing call() binding

// ✅ CORRECT: Arrow function or explicit binding
const handler = () => console.log(this);  // In constructor/field
dispatcher.on('event', handler, null);   // No target needed

// OR
dispatcher.on('event', function() { console.log(this); }, this);
```

```typescript
// ❌ WRONG: Priority mismatch
// Called in order: undefined (?) → user listener → analytics
dispatcher.on('save', () => console.log('user'), this);          // priority 0
dispatcher.on('save', () => console.log('analytics'), -100);     // Low priority?
dispatcher.on('save', { callback: () => {}, priority: 50 });     // Mixed

// ✅ CORRECT: Consistent ordering
dispatcher.on('save', { callback: () => {}, priority: 100 });    // Name
dispatcher.on('save', (e) => {}, this, 50);                     // Child
dispatcher.on('save', (e) => {}, this, 0);                      // Last
```

```typescript
// ❌ WRONG: Forget removal of functional listener
class BadExample {
  handler = (e) => {};

  setup() {
    world.on('player-moved', this.handler); // Missing 'this' param!
    // When does it get removed?
  }

  cleanup() {
    world.off('player-moved', this.handler); // Missing this!
    // Removing fails because target doesn't match
  }
}

// ✅ CORRECT: Store for later removal
class GoodExample {
  listener: EventListener = {
    callback: (e) => {},
    priority: 0,
    once: false
  };

  setup() {
    world.on('player-moved', this.listener); // Full object
  }

  cleanup() {
    world.off('player-moved', this.listener); // Exact match works
  }
}
```

```typescript
// ❌ WRONG: Leaking one-time listeners
class Leaky extends EventDispatcher {
  enable() {
    // Add once, but forget to remove listener object
    this.on('toggle', {
      callback: () => this.toggle = false,
      once: true,
      priority: 0
    }, this);
  }

  disable() {
    // This will NOT remove the one-time listener
    this.off('toggle', () => {}, this);
  }
}

// ✅ CORRECT: Either use 'once' or manual management
class Clean extends EventDispatcher {
  toggleFlag = false;

  // Option 1: 'once' only
  enable() {
    this.once('toggle', () => { this.toggleFlag = false; }, this);
  }

  // Option 2: Store and clean
  private toggleListener = {
    callback: () => { this.toggleFlag = false; },
    once: false,  // Not using once
    priority: 0
  };

  setup() {
    this.on('toggle', this.toggleListener);
  }

  cleanup() {
    // Manually remove when done
    this.off('toggle', this.toggleListener);
  }
}
```

## 📊 Performance Analysis

### API Comparison

| Metric | Functional API | Object API |
|--------|---------------|------------|
| **Setup Time** | ~50ns faster | ~50ns slower |
| **Memory** | ~64 bytes | ~72 bytes |
| **Removal (successful)** | O(n) | O(1) |
| **Removal (failed lookup)** | O(n + b) | O(n) |
| **Developer Ergonomics** | Better | Good |

### Removal Time Comparison
```typescript
// Functional API removal requires search
dispatcher.off('event', callback, target);
// → Searches entire Set for callback + target match
// → O(n) where n = listeners for type

// Object API removal is direct
const listener = { callback, target, priority, once };
dispatcher.off('event', listener);
// → O(1) Set delete
```

### When to Use Each
```
Functional API:
- Simple operations (< 3 parameters)
- Short lived listeners
- Don't need unique IDs
- Priority is optional (often 0)
- Typical application logic

Object API:
- Complex configuration
- Long-lived listeners
- Need explicit control (once, priority, target)
- Plugin systems
- Cross-system integration
- When removal needs guaranteed O(1)
```

## 🔗 Integration Patterns

### Entity Component System
```typescript
import { Entity, Component, EventDispatcher } from '@maxellabs/core';

class PhysicsComponent extends Component {
  private velocity = { x: 0, y: 0 };

  onEnable(): void {
    // Clean functional API
    this.entity.on('collision', this.handleCollision, this, 10);
  }

  onDisable(): void {
    // Without target tracking, we need lookup
    // Better: Use BFS pattern for listeners that require removal
  }

  // If you KNOW you added with this:
  private handleCollision = (event: Event) => {
    const other = event.data.other;
    if (other.mass > this.entity.mass) {
      const force = this.calculateRepulsion(other);
      this.velocity.x += force.x;
      this.velocity.y += force.y;
    }
  };
}
```

### Scene Tree Events
```typescript
class SceneRoot extends EventDispatcher {
  private listeners: Map<string, EventListener> = new Map();

  addSystem(name: string, system: System): void {
    const listener: EventListener = {
      callback: (event) => system.update(event.data),
      priority: 0,
      once: false
    };

    this.on('update', listener);
    this.listeners.set(name, listener);
  }

  removeSystem(name: string): void {
    const listener = this.listeners.get(name);
    if (listener) {
      this.off('update', listener);
      this.listeners.delete(name);
    }
  }
}
```

---

**Last Updated**: 2025-12-18
**Version**: 1.2.0 (Added functional API)
**Breaking Changes**: No (backward compatible)
