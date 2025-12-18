---
# Identity
id: "core-component"
type: "reference"
title: "Component - Entity Component Base Class"

# Semantics
description: "Modular behavior component base with lifecycle management and enabled/disabled states."

# Graph
context_dependency: ["core-refer-resource", "core-entity"]
related_ids: ["core-entity", "core-transform", "core-max-object"]
---

## 🔌 Interface First

### Component Lifecycle States
```typescript
enum ComponentLifecycleState {
  CREATED = 0,      // Constructed, not initialized
  INITIALIZED = 1,  // Added to entity, onAwake called
  ENABLED = 2,      // Active, updates run
  DISABLED = 3,     // Inactive, updates paused
  DESTROYED = 4     // Cleaned up, unusable
}
```

### Component Interface
```typescript
abstract class Component extends ReferResource {
  // Properties
  readonly entity: Entity;
  get enabled(): boolean;

  // Lifecycle
  getLifecycleState(): ComponentLifecycleState;
  setEnabled(value: boolean): void;
  getEnabled(): boolean;

  // Internal (called by engine)
  awake(): void;
  update(deltaTime: number): void;
  lateUpdate(deltaTime: number): void;
  render(): void;

  // Override points
  protected onAwake(): void;
  protected onEnable(): void;
  protected onDisable(): void;
  protected onDestroy(): void;

  // From base classes
  override destroy(): void;
}
```

## ⚙️ Implementation Logic

### Lifecycle Flow
```typescript
Pseudocode:
CONSTRUCTOR:
  super() // ReferResource
  this.enabled = true
  this.lifecycleState = CREATED

awake():
  IF lifecycleState != CREATED:
    RETURN  // Already awake

  lifecycleState = INITIALIZED
  onAwake()  // Subclass init

  IF enabled:
    enable()

enable():
  IF state not in [INITIALIZED, DISABLED]:
    RETURN

  lifecycleState = ENABLED
  onEnable()

disable():
  IF state != ENABLED:
    RETURN

  lifecycleState = DISABLED
  onDisable()

update(delta):
  IF state != ENABLED OR NOT enabled:
    RETURN

  // Subclass update logic
```

### Enable/Disable Cascade
```typescript
Pseudocode:
FUNCTION setEnabled(value):
  IF destroyed:
    RETURN
  IF enabled == value:
    RETURN

  enabled = value

  IF value:
    // Trying to enable
    IF state == DISABLED:
      ENABLED state
      onEnable()
  ELSE:
    // Trying to disable
    IF state == ENABLED:
      DISABLED state
      onDisable()
```

### Destruction Sequence
```typescript
Pseudocode:
FUNCTION destroy():
  IF destroyed():
    RETURN

  // Graceful disable first
  IF lifecycleState == ENABLED:
    disable()

  // Mark destroyed
  lifecycleState = DESTROYED

  // Subclass cleanup
  onDestroy()

  // Chain to parent
  super.destroy()
```

## 📚 Usage Examples

### Visual Component
```typescript
class SpriteRenderer extends Component {
  private texture: Texture | null = null;
  private visible: boolean = true;

  protected onAwake(): void {
    console.log(`${this.entity.name} sprite renderer ready`);
  }

  protected onEnable(): void {
    // Register for rendering
    this.entity.getScene()?.addRenderer(this);
  }

  protected onDisable(): void {
    // Remove from rendering
    this.entity.getScene()?.removeRenderer(this);
  }

  update(deltaTime: number): void {
    if (!this.visible) return;

    // Animation logic
    this.updateAnimation(deltaTime);
  }

  render(): void {
    if (this.visible && this.texture) {
      // Push to render queue
      this.renderSprite();
    }
  }

  protected onDestroy(): void {
    if (this.texture) {
      this.texture.release();
      this.texture = null;
    }
  }

  private updateAnimation(dt: number): void {
    // Animation frame logic
  }

  private renderSprite(): void {
    // Submission to RHI
  }
}

// Usage
const entity = new Entity("Enemy");
const sprite = entity.createComponent(SpriteRenderer);
// Entity's awake() automatically calls component.awake()
```

### Physics Component
```typescript
class PhysicsBody extends Component {
  private velocity: Vector2 = new Vector2();
  private mass: number = 1.0;

  protected onAwake(): void {
    // Register with physics system
    PhysicsSystem.getInstance().register(this);
  }

  protected onEnable(): void {
    // Active simulation
    PhysicsSystem.getInstance().activate(this);
  }

  protected onDisable(): void {
    // Pause simulation
    PhysicsSystem.getInstance().deactivate(this);
  }

  update(deltaTime: number): void {
    // Apply forces
    this.integrate(deltaTime);

    // Check collisions
    this.checkCollisions();
  }

  lateUpdate(deltaTime: number): void {
    // Resolve collisions after all entities updated
    this.resolveCollisions();
  }

  protected onDestroy(): void {
    PhysicsSystem.getInstance().remove(this);
  }

  private integrate(dt: number): void {
    // Euler integration
    const pos = this.entity.transform.position;
    pos.x += this.velocity.x * dt;
    pos.y += this.velocity.y * dt;
  }

  // ... collision methods
}
```

### State Machine Component
```typescript
class StateMachine extends Component {
  private currentState: string = "";
  private states: Map<string, () => void> = new Map();

  protected onAwake(): void {
    this.registerState("idle", this.onIdle.bind(this));
    this.registerState("walking", this.onWalking.bind(this));
    this.registerState("attacking", this.onAttacking.bind(this));
  }

  protected onEnable(): void {
    this.changeState("idle");
  }

  update(deltaTime: number): void {
    if (this.currentState) {
      const state = this.states.get(this.currentState);
      if (state) state();
    }
  }

  private registerState(name: string, action: () => void): void {
    this.states.set(name, action);
  }

  private changeState(newState: string): void {
    console.log(`State: ${this.currentState} -> ${newState}`);
    this.currentState = newState;
  }

  private onIdle(): void {
    // Idle behavior
  }

  private onWalking(): void {
    // Movement logic
  }

  private onAttacking(): void {
    // Attack logic
  }
}

// Usage
const hero = new Entity("Hero");
hero.createComponent(StateMachine);
```

## 🚫 Negative Constraints

### Critical Restrictions
- 🚫 **DO NOT** call awake() manually (called by Entity)
- 🚫 **DO NOT** directly modify lifecycleState
- 🚫 **DO NOT** access other components in constructor
- 🚫 **DO NOT** forget to call super() in constructor
- 🚫 **DO NOT** perform heavy work in constructor (use onAwake)

### Common Mistakes
```typescript
// ❌ WRONG: Entity access in constructor
class BadComponent extends Component {
  constructor(entity: Entity) {
    super(entity);
    // entity may not be fully initialized
    this.entity.transform.position.set(0, 0, 0); // Race condition
  }
}

// ✅ CORRECT: Use onAwake for initialization
class GoodComponent extends Component {
  constructor(entity: Entity) {
    super(entity);
  }

  protected onAwake(): void {
    // Entity is now fully initialized
    this.entity.transform.position.set(0, 0, 0);
  }
}
```

```typescript
// ❌ WRONG: Manual state management
const comp = new SomeComponent(entity);
entity.addComponent(comp);

// Manually calling lifecycle
(comp as any).awake(); // Wrong! Entity handles this
(comp as any).update(0.016); // Wrong! Engine handles this
```

```typescript
// ❌ WRONG: Forgetting super calls
class ComponentBadCleanup extends Component {
  protected onDestroy(): void {
    // Forgot super.onDestroy()
    // Base cleanup skipped, Entity references remain
  }
}

class ComponentGoodCleanup extends Component {
  protected onDestroy(): void {
    // Cancel async operations
    this.cancelPending();

    // Call parent
    super.onDestroy();
  }
}
```

### Enable State Misunderstandings
```typescript
// ❌ WRONG: Expecting immediate entity activation
const entity = new Entity("Test");
const comp = entity.createComponent(MyComponent);

// comp enabled=true but...
// entity itself might be inactive!

// Getting true from comp.getEnabled() does NOT mean update() runs
if (entity.getActive()) {
  // Only then updates run
}
```

## 📊 Performance Analysis

### Lifecycle State Costs
```
State Check (per frame): O(1) bitwise/enum comparison
Enable/Disable: O(1) + user hooks
Awake: O(1) + onAwake() hook

Memory per component:
- Inherited from ReferResource: +~56 bytes
- Component fields: +~8 bytes
- State enum: +4 bytes
Total: ~68 bytes + base class overhead
```

### Update Loop Overhead
```typescript
// Scenario: 1000 entities, 5 components each = 5000 components

// With enabled check shortcut
function componentUpdate() {
  if (!enabled || state != ENABLED) return; // Fast path
  // ... actual update
}
// Skips: 3600 disabled components
// Executes: 1400 components
// Overhead: ~1400 * 5 instructions = 7000 CPU cycles

// Without check (anti-pattern)
function componentUpdateBad() {
  // Always runs
}
// Executes: 5000 components
// Execution: 5000 * 50 instructions = 250,000 CPU cycles (35x slower due to logic)
```

### State Transition Performance
```
State Transition Cost:
CREATED -> INITIALIZED: ~20ns (onAwake hook)
INITIALIZED -> ENABLED: ~35ns (onEnable + registration)
ENABLED -> DISABLED: ~15ns (onDisable + deregistration)
DISABLED -> ENABLED: ~35ns (same as previous)

Downside: State changes cause hooks (good for flexibility, but avoid hot loops)
```

## 🔗 Architecture Integration

### Hierarchical Activation
```typescript
// Entity A (active)
//   ├─ Component X (enabled)
//   ├─ Component Y (disabled) - Updates skipped
//   └─ Child Entity B (active)
//        └─ Component Z (enabled)

// Entity A inactive -> all children and components skip updates
// Even if Component Z is enabled
```

### Component Multiton Pattern
```typescript
// Many components of same type per entity
const entity = new Entity("Player");
entity.createComponent(PhysicsBody);
entity.createComponent(SpriteRenderer);
entity.createComponent(StateMachine);

// Each component is unique type
// To get multiple, create separate type:
class PhysicsBody extends Component { ... }
class TriggerBody extends Component { ... }
```

### Inter-Component Communication
```typescript
// ✓ GOOD: Event-based
class AttackComponent extends Component {
  triggerAttack(): void {
    this.entity.emit('attack-start', null, true);
  }
}

class AnimationComponent extends Component {
  protected onAwake(): void {
    this.entity.on('attack-start', {
      callback: () => this.playAttackAnimation(),
      priority: 0
    });
  }
}

// ✅ ALSO GOOD: Direct reference (with care)
class AttackComponent2 extends Component {
  update(): void {
    if (Input.isPressed) {
      const anim = this.entity.getComponent(AnimationComponent);
      anim?.playAnimation('attack');
    }
  }
}

// ❌ BAD: Tight coupling in constructor
class AttackComponent3 extends Component {
  animation: AnimationComponent;

  constructor(entity: Entity) {
    super(entity);
    // Not awake yet, may be null
    this.animation = this.entity.getComponent(AnimationComponent)!; // !
  }
}
```

## 🔍 Lifecycle State Monitoring

### State Transition Tracking
```typescript
class DebugComponent extends Component {
  protected onAwake(): void {
    console.log(`[${this.name}] Awake on ${this.entity.name}`);
  }

  protected onEnable(): void {
    console.log(`[${this.name}] Enabled`);
    console.log(`  Entity active: ${this.entity.getActive()}`);
    console.log(`  Parent active: ${this.entity.getParent()?.getActive()}`);
  }

  protected onDisable(): void {
    console.log(`[${this.name}] Disabled`);
  }

  protected onDestroy(): void {
    console.log(`[${this.name}] Destroyed`);
  }
}
```

### State Query Methods
```typescript
function analyzeComponent(comp: Component): string {
  const state = comp.getLifecycleState();
  const enabled = comp.getEnabled();
  const destroyed = comp.isDestroyed();

  const stateMap = {
    [ComponentLifecycleState.CREATED]: 'Created',
    [ComponentLifecycleState.INITIALIZED]: 'Initialized',
    [ComponentLifecycleState.ENABLED]: 'Enabled',
    [ComponentLifecycleState.DISABLED]: 'Disabled',
    [ComponentLifecycleState.DESTROYED]: 'Destroyed'
  };

  return `
  Component: ${comp.name}
  State: ${stateMap[state]}
  Enabled: ${enabled}
  Destroyed: ${destroyed}
  Can Update: ${enabled && state === ComponentLifecycleState.ENABLED && !destroyed}
  `;
}
```

### Memory Leak Detection
```typescript
class ComponentDebugger {
  private components: Set<Component> = new Set();

  register(comp: Component): void {
    this.components.add(comp);
  }

  scan(): void {
    const leaked: Component[] = [];

    for (const comp of this.components) {
      if (comp.isDestroyed()) {
        continue;
      }

      if (comp.getLifecycleState() === ComponentLifecycleState.ENABLED) {
        // Component is alive, but check if entity exists
        const entity = comp.entity;
        if (!entity || entity.isDestroyed()) {
          leaked.push(comp);
        }
      }
    }

    if (leaked.length > 0) {
      console.warn('Detached components:', leaked.map(c => c.name));
    }
  }
}
```

---

**Last Updated**: 2025-12-18
**Version**: 1.0.0
