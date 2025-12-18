---
# Identity
id: "core-entity"
type: "reference"
title: "Entity - Scene Object and Component Container"

# Semantics
description: "Scene graph object managing components and transform hierarchy for game objects."

# Graph
context_dependency: ["core-component", "core-transform", "core-refer-resource"]
related_ids: ["core-component", "core-transform", "core-scene", "core-max-object"]
---

## 🔌 Interface First

### Entity Core Interface
```typescript
interface EntityProperties {
  name: string;
  readonly id: string;
  readonly tag: string;
  readonly transform: Transform;

  // Activation
  active: boolean;
  getActive(): boolean;
  setActive(value: boolean): void;

  // Hierarchy
  parent: Entity | null;
  children: ReadonlyArray<Entity>;
  scene: IScene | null;

  // Transformation (delegated)
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
}
```

### Component Management Interface
```typescript
interface ComponentSystem {
  // Add component
  addComponent<T extends Component>(component: T): T;

  // Create and add component
  createComponent<T extends Component>(
    componentType: new (entity: Entity) => T
  ): T;

  // Get component
  getComponent<T extends Component>(
    type: new (entity: Entity) => T
  ): T | null;

  // Query components
  hasComponent<T extends Component>(type: new (entity: Entity) => T): boolean;
  getComponents(): Component[];

  // Remove component
  removeComponent<T extends Component>(
    type: new (entity: Entity) => T
  ): this;

  // Find utilities
  findChildrenWithComponent<T extends Component>(
    componentType: new (...args: any[]) => T,
    recursive?: boolean
  ): Entity[];
}
```

## ⚙️ Implementation Logic

### Entity Creation Flow
```typescript
Pseudocode:
FUNCTION constructor(name, scene):
  super()  // ReferResource

  this.name = name
  this.scene = scene
  this.active = true
  this.tag = this.id  // Identity-based tag

  // Create Transform Component
  this.transform = new Transform(this)
  this.components.set(Transform.name, this.transform)
  this.transform.awake()  // Initialize transform

FUNCTION component management:
  addComponent(comp):
    IF comp.type exists:
      WARN "Duplicate component ignored"
      RETURN comp

    this.components.set(comp.type, comp)
    comp.awake()  // Lifecycle entry point
    RETURN comp
```

### Activation State Resolution
```typescript
Pseudocode:
FUNCTION getActive():
  IF !this.active:
    RETURN false

  // Check parent chain
  current = this.parent
  WHILE current:
    IF !current.active:
      RETURN false
    current = current.parent

  RETURN true

FUNCTION setActive(value):
  IF this.active == value:
    RETURN

  this.active = value
  this.updateActiveState()

FUNCTION updateActiveState():
  IS_ACTIVE = this.getActive()

  FOR component IN components:
    IF IS_ACTIVE AND component.enabled:
      component.setEnabled(true)
    ELSE:
      component.setEnabled(false)

  FOR child IN children:
    child.updateActiveState()
```

### Hierarchy Management
```typescript
Pseudocode:
FUNCTION setParent(newParent):
  // Prevent cycles
  IF wouldCreateCycle(newParent):
    RETURN

  // Remove from old parent
  IF this.parent:
    this.parent.children.remove(this)

  // Validate scene consistency
  IF newParent AND this.parent.scene != newParent.scene:
    this.scene = newParent.scene

  // Set parent
  this.parent = newParent

  // Add to parent's children
  IF newParent:
    newParent.children.add(this)

  // Sync transform hierarchy
  this.transform.setParent(newParent?.transform ?? null)

  // Update activation cascading
  this.updateActiveState()
```

### Component Lifecycle Integration
```typescript
Pseudocode:
FUNCTION entity.update(deltaTime):
  IF !this.getActive():
    RETURN

  // Update all enabled components in priority order
  FOR component IN components:
    IF component.getEnabled() AND component.getLifecycleState() == ENABLED:
      component.update(deltaTime)
      component.lateUpdate(deltaTime)

  // Update children
  FOR child IN children:
    IF child.getActive():
      child.update(deltaTime)

FUNCTION entity.destroy():
  IF destroyed:
    RETURN

  // Destroy children first (bottom-up)
  FOR child IN children:
    child.destroy()

  // Destroy all components (except Transform, destroyed last)
  FOR component IN components:
    IF component != transform:
      component.destroy()

  // Finally destroy transform
  transform.destroy()

  components.clear()
  this.removeFromScene()
  super.destroy()
```

## 📚 Usage Examples

### Creating Scene Hierarchy
```typescript
const scene = new Scene();

// Root
const world = new Entity("World", scene);

// Player
const player = new Entity("Player", scene);
player.transform.position.set(0, 1, 0);
player.setParent(world);

// Player parts
const head = new Entity("Head", scene);
head.transform.position.set(0, 1.7, 0);
head.setParent(player);

const hand = new Entity("Hand", scene);
hand.transform.position.set(0.5, 1.2, 0);
hand.setParent(player);

// Result:
// World
//   └─ Player
//       ├─ Head
//       └─ Hand
```

### Component Pattern
```typescript
// Create entity with components
const enemy = new Entity("Goblin", scene);

// Add physics
const physics = enemy.createComponent(PhysicsBody);
physics.mass = 50;
physics.velocity.set(10, 0, 0);

// Add rendering
const sprite = enemy.createComponent(SpriteRenderer);
sprite.texture = enemyTexture;

// Add AI
const ai = enemy.createComponent(StateMachine);
ai.changeState("patrol");

// Entity is now:
// Goblin [Transform]
//   ├─ PhysicsBody (mass=50)
//   ├─ SpriteRenderer (texture set)
//   └─ StateMachine (state=patrol)
```

### Query and Manipulation
```typescript
// Find specific component
const rb = enemy.getComponent(PhysicsBody);
if (rb) {
  rb.velocity.x = 5;
}

// Check existence
if (enemy.hasComponent(SpriteRenderer)) {
  console.log("Enemy can render");
}

// Get all components for debug
enemy.getComponents().forEach(c => {
  console.log(`- ${c.name}`);
});

// Find children with specific component
const visibleChildren = enemy.findChildrenWithComponent(SpriteRenderer);
visibleChildren.forEach(child => {
  child.getComponent(SpriteRenderer)?.setVisible(true);
});

// Chain: Get child's specific component
const childHead = enemy.findChild("Head");
const headSprite = childHead?.getComponent(SpriteRenderer);
```

### Scene Loading Pattern
```typescript
class LevelLoader {
  loadLevel(levelData: LevelData): Entity {
    const root = new Entity("LevelRoot");

    // Load entities
    levelData.entities.forEach(data => {
      const entity = new Entity(data.name, scene);
      entity.transform.position.fromArray(data.position);

      // Load components
      data.components.forEach(compData => {
        const comp = entity.createComponent(
          ComponentFactory.get(compData.type)
        );
        comp.load(compData);
      });

      // Add to hierarchy
      if (data.parent) {
        const parent = scene.findEntity(data.parent);
        if (parent) entity.setParent(parent);
      }
    });

    return root;
  }
}
```

### Active State Sync with Scene
```typescript
const scene = new Scene();
const entity = new Entity("ActiveTest", scene);

// Entity is in scene, active
console.log(entity.getActive()); // true
console.log(entity.scene === scene); // true

// Deactivate entity
entity.setActive(false);

// Still in scene, but inactive
console.log(entity.scene === scene); // true
console.log(entity.getActive()); // false (self flag)

// Remove from scene
scene.removeEntity(entity);
console.log(entity.scene); // null
```

## 🚫 Negative Constraints

### Critical Restrictions
- 🚫 **DO NOT** manually modify `components` Map directly
- 🚫 **DO NOT** skip parent chain when checking activation (use `getActive()`, not `property access`)
- 🚫 **DO NOT** create TransformComponent manually (auto-created)
- 🚫 **DO NOT** remove Transform component
- 🚫 **DO NOT** create circular parent-child links
- 🚫 **DO NOT** modify transform directly without using Transform methods

### Common Mistakes
```typescript
// ❌ WRONG: Manual Transform component
const entity = new Entity("Bad");
entity.addComponent(new Transform(entity)); // Warning, double Transform

// ❌ WRONG: Direct activation check
console.log(entity.active); // Always wrong - ignores parent state

// ✅ CORRECT: Always use method
console.log(entity.getActive());

// ❌ WRONG: Modifying Component Map
entity.components.set("Whatever", component); // Direct access

// ✅ CORRECT: Use addComponent/createComponent
entity.addComponent(component);
```

### Hierarchy Pitfalls
```typescript
// ❌ WRONG: Circular reference (detected by code but wasteful)
const parent = new Entity("Parent");
const child = new Entity("Child");
child.setParent(parent);
parent.setParent(child); // Console error, wasted cycle

// ❌ WRONG: Scene inconsistency
const sceneA = new Scene();
const sceneB = new Scene();

const parent = new Entity("P", sceneA);
const child = new Entity("C", sceneB);

child.setParent(parent);
// scene==sceneA but original was sceneB
// Expected behavior but can cause bugs if not aware

// ✅ CORRECT: Set scene explicitly
child.setScene(null);
child.setParent(parent);
// child.scene now matches parent.scene
```

```typescript
// ❌ WRONG: Destroy without parent update
const parent = new Entity("Parent");
const child = new Entity("Child");
child.setParent(parent);

child.destroy();
// Parent still holds reference

// ✅ CORRECT: Hierarchy handles this
// child.setParent(null) automatically called
// or parent.removeChild(child) handles cleanup

// Example wrong usage:
parent.children.indexOf(child); // Continues to exist!
```

## 📊 Performance Analysis

### Entity vs Component Memory
```
Entity:
- Inherited from ReferResource: ~56 bytes
- Components map: ~64 bytes overhead + component storage
- Transform (separate object): ~120 bytes
- Children array: ~16 bytes empty, +8 per child
- Parent reference: 8 bytes
- Scene reference: 8 bytes
- Name string: ~32 bytes avg
- Metadata map: ~16 bytes
Total: ~320 bytes + components + children

Component: ~68 bytes + component specific
```

### Update Loop Efficiency
```typescript
// Scenario: 1000 entities, 3 components each = 3000 components

// Entity updates:
for (const entity of entities) {
  if (!entity.getActive()) continue; // Fast filter

  // Then iterate components
  for (const comp of entity.getComponents()) {
    if (comp.getEnabled() && comp.getLifecycleState() === 2) {
      comp.update(dt); // 1500 calls (assuming 50% enabled)
    }
  }

  // Children recursion (iterative to avoid stack)
}

// Optimization: This check saves ~50% per frame
```

### Hierarchy Update Cost
```
Level depth vs update cost:

Flat (depth=1):  O(n) where n = entities
Shallow (depth=2-3): O(n) with small constant multiplier
Deep (depth=10+):  O(n) but recursive overhead

Notation: Both O(n) but deep hierarchies incur
more function calls and stack usage.

Optimization: Use iterative recursion for very deep trees
```

## 🔗 Scene Integration

### Entity-Scene Contract
```typescript
interface IScene {
  addEntity(entity: Entity): void;
  removeEntity(entity: Entity): void;
  findEntity(name: string): Entity | null;
}

// Usage
class Scene implements IScene {
  private entities: Map<string, Entity> = new Map();

  addEntity(entity: Entity): void {
    this.entities.set(entity.tag, entity);
    entity.setScene(this);
  }

  removeEntity(entity: Entity): void {
    this.entities.delete(entity.tag);
    entity.setScene(null);
  }

  findEntity(name: string): Entity | null {
    // Search all entities
    for (const entity of this.entities.values()) {
      if (entity.name === name) return entity;
      // Could recurse children...
    }
    return null;
  }
}
```

### Transform Delegation Pattern
```typescript
// Entity delegates transform methods for convenience
class Entity {
  get position() {
    return this.transform.position;
  }

  get rotation() {
    return this.transform.rotation;
  }

  get scale() {
    return this.transform.scale;
  }

  // Direct access same as transform manipulation
  setRotation(q: Quaternion): void {
    this.transform.setWorldQuaternion(q);
  }

  lookAt(target: Vector3): void {
    this.transform.lookAt(target);
  }
}

// Usage
const entity = new Entity("Camera");
entity.position.set(0, 5, 10);  // Shorthand
entity.transform.position.set(0, 5, 10); // Same
```

## 🔍 Debugging & Monitoring

### Entity State Diagnostic
```typescript
function debugEntity(entity: Entity): string {
  let output = `Entity: ${entity.name} (${entity.id})\n`;
  output += `Active: ${entity.getActive()}\n`;
  output += `Destroyed: ${entity.isDestroyed()}\n`;
  output += `Scene: ${entity.getScene()?.name ?? 'null'}\n`;
  output += `Parent: ${entity.getParent()?.name ?? 'root'}\n`;
  output += `Children: ${entity.getChildren().length}\n`;
  output += `Components:\n`;

  entity.getComponents().forEach(comp => {
    const state = ComponentLifecycleState[comp.getLifecycleState()];
    output += `  - ${comp.name}: ${state} (enabled:${comp.getEnabled()})\n`;
  });

  return output;
}

// Usage
console.log(debugEntity(player));

// Output:
// Entity: Player (Entity_1234567890_abc123)
// Active: true
// Destroyed: false
// Scene: MainScene
// Parent: world
// Children: 2
// Components:
//   - Transform: ENABLED (enabled:true)
//   - SpriteRenderer: ENABLED (enabled:true)
//   - PhysicsBody: ENABLED (enabled:true)
```

### Activation Debug
```typescript
function traceActivation(entity: Entity): void {
  console.log(`Checking ${entity.name}:`);

  if (!entity.active) {
    console.log("  ✗ Self inactive");
    return;
  }

  let current = entity.getParent();
  while (current) {
    console.log(`  Parent: ${current.name} active=${current.active}`);
    if (!current.active) {
      console.log("  ✗ Parent inactive yields false");
      return;
    }
    current = current.getParent();
  }

  console.log("  ✓ Fully active");
}

// Example - why getActive() vs entity.active matters:
const world = new Entity("World"); world.setActive(false);
const player = new Entity("Player"); player.setActive(true);
player.setParent(world);

traceActivation(player); // Shows one parent is inactive!
console.log(player.getActive()); // false
console.log(player.active); // true - misleading!
```

### Hierarchy Display
```typescript
function printHierarchy(entity: Entity, indent = 0): void {
  const prefix = "  ".repeat(indent);
  const active = entity.getActive() ? "[A]" : "[I]";
  const compCount = entity.getComponents().length;

  console.log(`${prefix}${entity.name} ${active} (${compCount})`);

  for (const child of entity.getChildren()) {
    printHierarchy(child, indent + 1);
  }
}

// Usage:
printHierarchy(world);
// Output:
// World [A] (1)
//   Player [A] (3)
//     Head [A] (2)
//     Hand [A] (2)
//   Enemy [A] (3)
```

---

**Last Updated**: 2025-12-18
**Version**: 1.0.0
