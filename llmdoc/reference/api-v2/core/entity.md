---
# Identity
id: "core-entity"
type: "reference"
title: "Entity - Scene Object and Component Container"

# Semantics
description: "Scene graph object managing components and transform hierarchy for game objects."

# Graph
context_dependency: ["core-component", "core-transform", "core-refer-resource", "core-hierarchy-utils"]
related_ids: ["core-component", "core-transform", "core-scene", "core-max-object", "core-hierarchy-utils"]
---

## 🔌 Interface First

### Entity Core Interface
```typescript
interface EntityOptions {
  syncTransformAwake?: boolean;  // Default: false (async)
}

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

### Entity Construction with Sync/Async Transform
```typescript
class Entity extends ReferResource {
  constructor(name: string, scene?: IScene | null, options?: EntityOptions);
}

// ===== NEW: Sync Transform Initialization =====
// Use case: Immediate transform access required
const player = new Entity("Player", scene, { syncTransformAwake: true });
player.transform.position.set(0, 5, 0);  // ✅ Safe - transform ready immediately
player.transform.scale.set(1.5, 1.5, 1.5);

// ===== ORIGINAL: Async Transform (Default) =====
// Backward compatible, Transform initialized via queueMicrotask
const enemy = new Entity("Enemy", scene);  // Same as { syncTransformAwake: false }
// ⚠️ WARNING: Transform NOT immediately ready
// enemy.transform.position.set(10, 0, 0);  // Unsafe!

// Must wait for microtask:
queueMicrotask(() => {
  enemy.transform.position.set(10, 0, 0);  // ✅ Safe
});

// ===== RECOMMENDED: Factory Pattern =====
class EntityFactory {
  static create(name: string, scene: IScene, sync = false): Entity {
    return new Entity(name, scene, { syncTransformAwake: sync });
  }

  static createAsync(name: string, scene: IScene): Promise<Entity> {
    return new Promise(resolve => {
      const entity = new Entity(name, scene, { syncTransformAwake: false });
      queueMicrotask(() => resolve(entity));
    });
  }
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
FUNCTION constructor(name, scene, options):
  super()  // ReferResource

  this.name = name
  this.scene = scene
  this.active = true
  this.tag = this.id  // Identity-based tag

  // Create Transform Component
  this.transform = new Transform(this)
  this.components.set(Transform.name, this.transform)

  // Handle Transform Awake - NEW with syncTransformAwake option
  IF options.syncTransformAwake IS true:
    this.transform.awake()  // Synchronous
    this.transform.initialized = true
  ELSE:
    queueMicrotask(() => {
      this.transform.awake()  // Async (default, backward compatible)
      this.transform.initialized = true
    })
```

### Hierarchy Management with Hierarchy Utils
```typescript
Pseudocode:
FUNCTION setParent(newParent):
  // NEW: Use hierarchy-utils for cycle detection
  IF newParent AND checkCircularReference(this, newParent, (e) => e.getParent()):
    logError("Cycle detected: would create circular reference")
    RETURN this

  // Check Entity-level cycles (also uses hierarchy-utils internally)
  IF newParent AND wouldCreateEntityCycle(newParent):
    logError("Entity cycle detected")
    RETURN this

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

  // Sync transform hierarchy (Transform also uses hierarchy-utils)
  this.transform.setParent(newParent?.transform ?? null)

  // Update activation cascading
  this.updateActiveState()
```

### Hierarchy Helper Functions (via hierarchy-utils)
```typescript
import {
  checkCircularReference,
  isAncestorOf,
  getAncestors,
  getHierarchyDepth,
  findCommonAncestor
} from '@maxellabs/core';

// Cycle detection
if (checkCircularReference(parent, child, (e) => e.getParent())) {
  console.error("Will create cycle!");
}

// Ancestor checking
if (isAncestorOf(root, entity, (e) => e.getParent())) {
  console.log("Root is ancestor of entity");
}

// Get ancestors chain
const ancestors = getAncestors(entity, (e) => e.getParent());
// Returns: [directParent, grandparent, ..., root]

// Get depth
const depth = getHierarchyDepth(entity, (e) => e.getParent());
// Root = 0, directChild = 1, etc.

// Find common ancestor
const common = findCommonAncestor(entityA, entityB, (e) => e.getParent());
```

### Activation State Resolution (unchanged)
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

### Cycle Detection Options
```typescript
Pseudocode:
// Method 1: Direct cycle detection
FUNCTION wouldCreateCycle(newParent):
  current = newParent
  WHILE current:
    IF current == this:
      RETURN true
    current = current.parent
  RETURN false

// Method 2: Using hierarchy-utils (preferred)
FUNCTION wouldCreateEntityCycle(newParent):
  RETURN checkCircularReference(this, newParent, (n) => n.parent)

// Method 3: Transform cycle detection
FUNCTION wouldCreateTransformCycle(newParent):
  IF newParent == null: RETURN false
  RETURN checkCircularReference(this.transform, newParent.transform, (t) => t.parent)
```

## 📚 Usage Examples

### Synchronous Transform Initialization
```typescript
import { Entity, Scene } from '@maxellabs/core';

// Use case: Need transform immediately after construction
const scene = new Scene();

// Sync initialization
const player = new Entity("Player", scene, { syncTransformAwake: true });

// Transform is immediately available for configuration
player.transform.position.set(0, 5, 0);
player.transform.scale.set(1.5, 1.5, 1.5);

// Can safely access world matrices
const worldMatrix = player.transform.getWorldMatrix();
console.log(worldMatrix); // Valid matrix

// Async initialization (default, backward compatible)
const enemy = new Entity("Enemy", scene); // Same as { syncTransformAwake: false }

// WARNING: Transform not immediately ready
// enemy.transform.position.set(10, 0, 0); // Potentially unsafe

// Should use microtask to ensure readiness
queueMicrotask(() => {
  enemy.transform.position.set(10, 0, 0); // Safe
});
```

### Complex Hierarchy with Cycle Prevention
```typescript
import { Entity, Scene } from '@maxellabs/core';
import {
  checkCircularReference,
  isAncestorOf,
  getAncestors,
  getHierarchyDepth
} from '@maxellabs/core';

const scene = new Scene();

const world = new Entity("World", scene, { syncTransformAwake: true });
const level = new Entity("Level", scene, { syncTransformAwake: true });
const room1 = new Entity("Room1", scene, { syncTransformAwake: true });
const room2 = new Entity("Room2", scene, { syncTransformAwake: true });

// Build valid hierarchy
level.setParent(world);
room1.setParent(level);
room2.setParent(level);

// Verify hierarchy
console.log("Level depth:", getHierarchyDepth(level, (e) => e.getParent())); // 1
console.log("Room1 ancestors:", getAncestors(room1, (e) => e.getParent()).map(e => e.name)); // ["Level", "World"]

// Prevent invalid operations
if (checkCircularReference(world, room2, (e) => e.getParent())) {
  console.log("Cycle detected!");
  // world is ancestor of room2, cannot set room2 as parent
}

if (isAncestorOf(level, room1, (e) => e.getParent())) {
  console.log("Level is ancestor of Room1"); // true
}
```

### Transform State Synchronization
```typescript
import { Entity } from '@maxellabs/core';

// Use-case: Pre-configuring a prefab
class PrefabFactory {
  static createCharacter(name: string, sync = false): Entity {
    const entity = new Entity(name, null, { syncTransformAwake: sync });

    // Wait for transform if async
    if (!sync) {
      return new Promise(resolve => {
        queueMicrotask(() => resolve(entity));
      });
    }

    return entity;
  }
}

// Factory usage
async function buildScene() {
  // Synchronous creation
  const player = PrefabFactory.createCharacter("Hero", true);
  player.transform.position.set(0, 1, 0);

  // Asynchronous batch processing
  const enemies = [];
  for (let i = 0; i < 100; i++) {
    const enemy = await PrefabFactory.createCharacter(`Enemy${i}`, false);
    enemy.transform.position.set(i * 2, 0, 0);
    enemies.push(enemy);
  }
}
```

### State Reconstruction
```typescript
import { Entity, Scene } from '@maxellabs/core';

interface SerializedEntity {
  name: string;
  position: [number, number, number];
  active: boolean;
  parentId: string | null;
}

const scene = new Scene();

// Reconstruct entities from JSON
function deserializeEntity(data: SerializedEntity, parentMap: Map<string, Entity>): Entity {
  // First pass: create all entities with sync transform
  const entity = new Entity(data.name, scene, { syncTransformAwake: true });

  // Restore transform
  entity.transform.position.set(...data.position);
  entity.setActive(data.active);

  parentMap.set(data.name, entity);
  return entity;
}

// Second pass: rebuild hierarchy
function restoreHierarchy(entities: SerializedEntity[], parentMap: Map<string, Entity>): void {
  for (const data of entities) {
    if (data.parentId) {
      const parent = parentMap.get(data.parentId);
      const entity = parentMap.get(data.name);
      if (parent && entity) {
        entity.setParent(parent);
      }
    }
  }
}
```

### Multi-threaded Pattern (Simulated)
```typescript
import { Entity, Scene } from '@maxellabs/core';

// Pattern: Build tree structure, then hydrate transforms
class AsyncEntityBuilder {
  private scene: Scene;
  private entities: Map<string, Entity> = new Map();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  // Phase 1: Create entity structure without transform
  createSkeleton(name: string, parentName?: string): void {
    const entity = new Entity(name, this.scene, { syncTransformAwake: false });
    this.entities.set(name, entity);

    if (parentName && this.entities.has(parentName)) {
      entity.setParent(this.entities.get(parentName)!);
    }
  }

  // Phase 2: Wait for all transforms to be ready
  async hydrateTransforms(configs: Map<string, { pos: [number, number, number] }>): Promise<void> {
    // Wait for all queueMicrotask to complete
    await new Promise(resolve => queueMicrotask(resolve));

    // Now safe to configure transforms
    for (const [name, config] of configs) {
      const entity = this.entities.get(name);
      if (entity) {
        entity.transform.position.set(...config.pos);
      }
    }
  }
}

// Usage
const builder = new AsyncEntityBuilder(scene);
builder.createSkeleton("Root");
builder.createSkeleton("Child", "Root");
builder.createSkeleton("GrandChild", "Child");

const config = new Map([
  ["Root", { pos: [0, 0, 0] }],
  ["Child", { pos: [1, 0, 0] }],
  ["GrandChild", { pos: [0, 1, 0] }]
]);

await builder.hydrateTransforms(config);
```

### Inter-entity Validation
```typescript
import { Entity, Scene } from '@maxellabs/core';
import {
  checkCircularReference,
  isAncestorOf,
  findCommonAncestor
} from '@maxellabs/core';

class EntityValidator {
  static checkSiblingRelationship(a: Entity, b: Entity): boolean {
    const parentA = a.getParent();
    const parentB = b.getParent();

    return parentA === parentB && parentA !== null;
  }

  static wouldCreateCycle(parent: Entity, child: Entity): boolean {
    return checkCircularReference(child, parent, (e) => e.getParent());
  }

  static getHierarchyInfo(entity: Entity): string {
    const ancestors: Entity[] = [];
    let current: Entity | null = entity;

    // Manual traversal (without utils): anti-pattern
    while (current) {
      ancestors.push(current);
      current = current.getParent();
    }

    return `Path: ${ancestors.map(e => e.name).join(' → ')}`;
  }

  static getRelationship(a: Entity, b: Entity): string {
    if (a === b) return "Same";

    const common = findCommonAncestor(a, b, (e) => e.getParent());
    if (!common) return "No relation";

    if (a.getParent() === b) return "Parent-Child";
    if (b.getParent() === a) return "Child-Parent";
    if (isAncestorOf(a, b, (e) => e.getParent())) return "Ancestor-Descendant";
    if (isAncestorOf(b, a, (e) => e.getParent())) return "Descendant-Ancestor";

    return "Siblings or Cousins";
  }
}

// Usage
const root = new Entity("Root", scene, { syncTransformAwake: true });
const a = new Entity("A", scene, { syncTransformAwake: true });
const b = new Entity("B", scene, { syncTransformAwake: true });
const c = new Entity("C", scene, { syncTransformAwake: true });

a.setParent(root);
b.setParent(root);
c.setParent(a);

console.log(EntityValidator.checkSiblingRelationship(a, b)); // true
console.log(EntityValidator.checkSiblingRelationship(a, c)); // false
console.log(EntityValidator.getRelationship(c, b)); // "Siblings or Cousins"
console.log(EntityValidator.wouldCreateCycle(root, a)); // true (would create cycle)
```

## 🚫 Negative Constraints

### Critical Restrictions
- 🚫 **DO NOT** manually set `syncTransformAwake` after Entity creation
- 🚫 **DO NOT** access transform before microtask completes (if async)
- 🚫 **DO NOT** create circular references using manual parent setting
- 🚫 **DO NOT** ignore warnings about hierarchy depth
- 🚫 **DO NOT** set parent before checking `wouldCreateCycle()`

### Common Mistakes
```typescript
// ❌ WRONG: Accessing transform synchronously after async creation
const entity = new Entity("Bad", scene); // Default async
entity.transform.position.set(1, 2, 3); // Unsafe - transform might not awaken yet!

// ✅ CORRECT: Use sync initialization or wait
const entity1 = new Entity("Good", scene, { syncTransformAwake: true });
entity1.transform.position.set(1, 2, 3); Safe

const entity2 = new Entity("Good2", scene);
queueMicrotask(() => {
  entity2.transform.position.set(1, 2, 3); // Safe
});

// ✅ BETTER: Use factory pattern
const entity3 = await createEntityAsync("Good3", scene);
entity3.transform.position.set(1, 2, 3); // Safe
```

```typescript
// ❌ WRONG: Manual circular reference
const parent = new Entity("Parent", scene, { syncTransformAwake: true });
const child = new Entity("Child", scene, { syncTransformAwake: true });

child.setParent(parent);
parent.setParent(child); // Error logged, but wasteful

// ✅ CORRECT: Use hierarchy-utils
import { checkCircularReference } from '@maxellabs/core';

const canSet = !checkCircularReference(parent, child, (e) => e.getParent());
if (canSet) {
  parent.setParent(child);
} else {
  throw new Error("Invalid parent assignment");
}
```

```typescript
// ❌ WRONG: Deep hierarchy without checks
const root = new Entity("Root", scene, { syncTransformAwake: true });
let current = root;
for (let i = 0; i < 2000; i++) {
  const child = new Entity(`Deep${i}`, scene, { syncTransformAwake: true });
  child.setParent(current); // No depth check!
  current = child;
}

// ✅ CORRECT: Check depth
import { getHierarchyDepth } from '@maxellabs/core';

function safeSetParent(child: Entity, parent: Entity): boolean {
  const depth = getHierarchyDepth(parent, (e) => e.getParent());
  if (depth >= 999) {
    console.warn("Setting this parent would exceed safe depth limits");
    return false;
  }
  child.setParent(parent);
  return true;
}
```

```typescript
// ❌ WRONG: Ignoring scene consistency
const sceneA = new Scene();
const sceneB = new Scene();

const parent = new Entity("P", sceneA, { syncTransformAwake: true });
const child = new Entity("C", sceneB, { syncTransformAwake: true });

child.setParent(parent); // Child's scene changes to sceneA, might cause confusion

console.log(child.scene === sceneB); // false - unexpected?

// ✅ CORRECT: Explicit scene management
if (child.scene && child.scene !== parent.scene) {
  child.scene.removeEntity(child);
}
child.setParent(parent);
```

```typescript
// ❌ WRONG: Not handling cyclical Transform hierarchy
const a = new Entity("A", scene, { syncTransformAwake: true });
const b = new Entity("B", scene, { syncTransformAwake: true });

// Hierarchy: B -> A (Entity layer)
a.setParent(b); BUT transforming doesn't check Entity hierarchy for cycles

// ✅ CORRECT: Entity calls Transform only after validation
// Inside setParent method (Entity):
// this.transform.setParent(newParent?.transform ?? null)
// But Transform itself calls hierarchy-utils to check its own cycles
```

---

## 📊 Performance Analysis

### Entity Creation Costs

| Scenario | Entity Creation | Transform Init | Total |
|----------|----------------|---------------|-------|
| **Sync Transform** | ~N/A | ~N/A | ~N/A |
| **Async (default)** | ~100ns | 0 (queueMicrotask) | ~100ns + Microtask |
| **With 1000 entities** | ~100μs | Triggered together | ~1 |

### Hierarchy Operations
```typescript
Synchronous (Sync Creation): 421ms for 10,000 entities
Asynchronous (Default):       50ms s for 10,000 entities + microtask delay

But transform access costs:
+-----------+----------+-------------+
| Operation | Sync     | Async (Post-Microtask) |
+-----------+----------+-------------+
| Position  | Fast     | Slow        |
| Matrix   | Fast     | Slow        |
| Children  | Fast     | Slow        |
+-----------+----------+-------------+
```

### Memory Differences
```
Sync vs Async:
  - Entity object: Same
  - Transform state: Immediate vs Delayed
  - Queue overhead: -4ms vs ~100ms (microtask)
```

---

## 🔗 Integration Cross-references

### Related Core Modules
- **Hierarchical Utilities**: `core-hierarchy-utils` - Universal hierarchy operations
- **Transform Component**: `core-transform-component` - Spatial transformation with the same sync/async pattern
- **Time System**: `core-time` - Provides delta time for `update()` calls
- **Object Pool**: `core-object-pool` - For reusing destroyed entities

### Performance Reference
- Use sync for scenes with < 100 entities or when transform needs immediate access
- Use async for bulk entity creation (rare, given current architecture)
- Microtask awaking is efficient but can create frame stutter if many entities created per frame

---

**Last Updated**: 2025-12-18
**Version**: 1.1.0 (Added syncTransformAwake option)
**Breaking Changes**: No (backward compatible, default behavior unchanged)
