---
# Identity
id: "core-event"
type: "reference"
title: "Event - Basic Event Object"

# Semantics
description: "Core event object encapsulating event data, propagation control, and metadata for the event dispatcher system."

# Graph
context_dependency: []
related_ids: ["core-event-dispatcher", "core-object-pool"]
---

## 🔌 Interface First

### Event Object Interface
```typescript
interface Event {
  // Core Properties
  type: string | null;          // Event type identifier
  target: any;                  // Original event target
  currentTarget: any;           // Current target in propagation
  bubbles: boolean;             // Enable event bubbling
  data: any;                    // Custom payload

  // Propagation Control
  private propagationStopped: boolean;
  private immediatelyStopped: boolean;
  timestamp: number;

  // Methods
  stopPropagation(): void;
  stopImmediatePropagation(): void;
  isPropagationStopped(): boolean;
  isImmediatelyStopped(): boolean;
  reset(): void;                // For pool reuse
}
```

## ⚙️ Implementation Logic

### Event Creation
```typescript
Pseudocode:
FUNCTION constructor(type, bubbles = false, data):
  this.type = type
  this.bubbles = bubbles
  this.data = data
  this.timestamp = Date.now()
  this.target = null
  this.currentTarget = null

  // Reset flags
  this.propagationStopped = false
  this.immediatelyStopped = false
```

### Propagation Control
```typescript
Pseudocode:
FUNCTION stopPropagation():
  this.propagationStopped = true
  // Does NOT stop current listener

FUNCTION stopImmediatePropagation():
  this.propagationStopped = true
  this.immediatelyStopped = true
  // Stops current listener

FUNCTION isPropagationStopped():
  RETURN this.propagationStopped

FUNCTION isImmediatelyStopped():
  RETURN this.immediatelyStopped
```

### Event Reset (For Pooling)
```typescript
Pseudocode:
FUNCTION reset():
  this.type = null
  this.target = null
  this.currentTarget = null
  this.bubbles = false
  this.data = null
  this.timestamp = 0
  this.propagationStopped = false
  this.immediatelyStopped = false
```

## 📚 Usage Examples

### Basic Event Creation
```typescript
const clickEvent = new Event('click', true, { x: 100, y: 200 });
console.log(clickEvent.type); // 'click'
console.log(clickEvent.bubbles); // true
console.log(clickEvent.data); // { x: 100, y: 200 }
```

### Propagation Control
```typescript
// Scenario: Button click with parent container
const button = new EventDispatcher('button');
const container = new EventDispatcher('container');
button.setParent(container);

button.on('click', {
  callback: (event) => {
    console.log('Button clicked');
    event.stopPropagation(); // Stops bubbling to container
    // But this listener still completes
  }
});

container.on('click', {
  callback: (event) => {
    console.log('Container clicked'); // Never called
  }
});

button.emit('click', null, true);
```

### Immediate Propagation Stop
```typescript
class ValidatedButton extends EventDispatcher {
  constructor() {
    super('validated-button');

    this.on('click', {
      priority: 100, // Highest priority
      callback: (event) => {
        if (!this.validate()) {
          event.stopImmediatePropagation();
          // This listener stops, prevents others from running
          return;
        }
      }
    });

    this.on('click', {
      priority: 50,
      callback: (event) => {
        console.log('This will never run if validation fails');
      }
    });
  }
}
```

### Event Data Patterns
```typescript
// Data transfer pattern
const resourceEvent = new Event('resource-loaded', false, {
  id: 'texture-001',
  url: '/assets/player.png',
  size: 4194304, // 4MB
  mime: 'image/png',
  timestamp: Date.now()
});

// Update event pattern
class StateEvent extends Event {
  constructor(state: Record<string, any>) {
    super('state-change', true, {
      old: null,
      new: state,
      changed: Object.keys(state)
    });
  }
}

// Status event with metadata
const statusEvent = new Event('connection-status', false, {
  status: 'online',
  latency: 45,
  reconnect: false
});
```

## 🚫 Negative Constraints

### Critical Restrictions
- 🚫 **DO NOT** reuse event objects without calling reset()
- 🚫 **DO NOT** modify event.type after creation
- 🚫 **DO NOT** throw in event handlers (handled by dispatcher)
- 🚫 **DO NOT** assume `target` is set (external dependency)
- 🚫 **DO NOT** store event references after dispatch

### Common Mistakes
```typescript
// ❌ WRONG: Event object reuse without reset
const event = new Event('update', false, { value: 1 });

// First dispatch
dispatchEvent(event);

// Second dispatch - old data persists
event.data = { value: 2 };
dispatchEvent(event);
// Event listeners see old type/target values

// ✅ CORRECT: Reset or create new
dispatchEvent(event);
event.reset(); // Clean state

// OR create new
dispatchEvent(new Event('update', false, { value: 2 }));
```

```typescript
// ❌ WRONG: Assuming event order control
const events = new EventDispatcher();

events.on('click', { callback: () => console.log('A') });
events.on('click', { callback: () => console.log('B') });
// Without priority, order is NOT guaranteed

// ✅ CORRECT: Use priority for order
events.on('click', { callback: () => console.log('A'), priority: 10 });
events.on('click', { callback: () => console.log('B'), priority: 5 });
// A always prints before B
```

```typescript
// ❌ WRONG: Modifying event during dispatch
class BadSystem {
  handleEvent(event: Event) {
    if (event.type === 'critical') {
      // This can confuse other listeners
      event.stopPropagation();
      event.type = 'adjusted-critical';
      event.data.adjusted = true;
    }
  }
}

// ✅ CORRECT: Use new events for modifications
handleEvent(event: Event) {
  if (event.type === 'critical') {
    event.stopPropagation();
    // Create adjusted event for downstream
    const adjusted = new Event('adjusted-critical', false, {
      ...event.data,
      adjusted: true
    });
    // Dispatch adjusted separately
    this.dispatchEvent(adjusted);
  }
}
```

## 📊 Performance Analysis

### Event Object Allocation
```
Event Creation Cost:
- New object: ~64 bytes
- 5 property pointers: ~40 bytes
- 2 boolean flags: 2 bytes
- 1 number timestamp: 8 bytes
Total: ~114 bytes per event

With Pooling:
- Pool size: 100 events = 11KB
- Reuse eliminates allocation
- Reset cost: ~1000 CPU cycles
```

### Propagation Stop Impact
```typescript
// Scenario: 500 listeners on event chain
const root = new EventDispatcher('root');
for (let i = 0; i < 500; i++) {
  root.on('event', {
    callback: () => {},
    priority: 500 - i
  });
}

// Early stop saves processing
function earlyStopHandler(event: Event) {
  if (someCondition) {
    event.stopImmediatePropagation();
    // Saves ~499 listener execution
  }
}
```

### Reset vs New Pattern
```typescript
// After 1000 event dispatches:

// Pattern A: New events
Memory: 1000 * 114 bytes = 114KB
Performance: O(n) allocation

// Pattern B: Reset + pool
Memory: 100 * 114 bytes (fixed)
Performance: O(1) reset
GC Pressure: 90% less
```

## 🔗 Event Types & Patterns

### Categorization by Purpose
```typescript
// Input Events
new Event('mouse-down', true, { x, y, button });
new Event('key-press', false, { key, code });

// State Events
new Event('state-change', true, { old, new });
new Event('activation', false, { active });

// Resource Events
new Event('texture-loaded', false, { texture, success });
new Event('download-progress', false, { loaded, total });

// Error Events
new Event('error', false, { message, source });
new Event('warning', false, { code, details });

// Lifecycle Events
new Event('destroy', false, null);
new Event('enable-status', false, { enabled });
```

### Event Naming Conventions
```typescript
// ✅ Hyphenated lowercase
'state-change'
'scene-load'
'connection-status'

// ✅ Past tense for completions
'texture-loaded'
'resource-freed'
'task-completed'

// ❌ Avoid
'update' // Too generic
'info'   // Informative but unclear
'v1'     // Version in name
```

## 🔗 Integration with Dispatcher

### Event Flow through System
```typescript
// 1. Event Creation
const event = new Event('custom', true, data);

// 2. Target Assignment (automatic in dispatcher)
event.target = originalDispatcher;
event.currentTarget = currentDispatcher;

// 3. Listener Execution
// callbacks receive this event object

// 4. Propagation Control
if (/* critical error */) {
  event.stopImmediatePropagation();
}

// 5. Cleanup (in dispatcher)
// event.reset() for pooling if used
```

### Event Type Naming in Dispatcher
```typescript
// Event object types
class GameStateEvent extends Event {
  constructor(state: string) {
    super('game-state', false, { state });
  }

  getState(): string {
    return this.data.state;
  }
}

// Custom event usage
dispatcher.on('game-state', {
  callback: (event: GameStateEvent) => {
    if (event.getState() === 'paused') {
      // Handle pause
    }
  }
});
```

## 🔍 Debugging Events

### Event Debug State
```typescript
function debugEvent(event: Event): string {
  const stopped = event.isPropagationStopped() ? '[STOPPED]' : '';
  const immediate = event.isImmediatelyStopped() ? '[IMMEDIATE]' : '';
  return `Event ${event.type || 'unnamed'} ${stopped} ${immediate} @ ${event.timestamp}`;
}

// Usage in dispatcher
dispatchEvent(event: Event) {
  console.log(`Dispatch: ${debugEvent(event)}`);
  // ... dispatch logic
}
```

### Event Validation
```typescript
function validateEvent(event: Event): boolean {
  // Check required fields
  if (!event.type || event.type.trim() === '') {
    console.error('Invalid event: empty type');
    return false;
  }

  // Check propagation flags consistency
  if (event.isImmediatelyStopped() && !event.isPropagationStopped()) {
    console.warn('Inconsistent flags: immediate=true requires propagation=false');
  }

  return true;
}
```

### Event Timeline Logging
```typescript
const eventLog: { type: string; time: number; data: any }[] = [];

function logEvent(event: Event, phase: 'dispatch' | 'handle' | 'complete') {
  eventLog.push({
    type: event.type || 'unknown',
    time: Date.now(),
    data: {
      phase,
      currentTarget: event.currentTarget?.name || 'unknown',
      bubbles: event.bubbles,
      stop: event.isPropagationStopped()
    }
  });

  // Dump if log gets too large
  if (eventLog.length > 1000) {
    console.table(eventLog);
    eventLog.length = 0;
  }
}
```

---

**Last Updated**: 2025-12-18
**Version**: 1.0.0
