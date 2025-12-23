---
# Identity
id: "architecture-system-overview"
type: "architecture"
title: "System Architecture Overview"

# Semantics
description: "Complete system architecture of MaxEllabs runtime engine covering monorepo structure, initialization flow, ECS component system, external APIs, and key design patterns"
tags: ["architecture", "ecs", "monorepo", "initialization", "component-system", "design-patterns"]

# Graph
context_dependency: []
related_ids: ["architecture-ecs-pattern", "reference-component-system", "guide-initialization"]
---

## 🏗️ System Architecture

### Monorepo Hierarchy & Entry Points

```typescript
// Primary Entry Point
@maxellabs/engine
  └─ packages/engine/src/index.ts
      └─ export * from '@maxellabs/core'

// Core Module (Business Logic)
@maxellabs/core
  ├─ packages/core/src/index.ts
  │   ├─ ECS System (World, Entity, Component, Query)
  │   ├─ Base Framework (MaxObject, ReferResource)
  │   ├─ Events System
  │   ├─ Infrastructure (IOC, Canvas Wrapper)
  │   ├─ Utilities
  │   ├─ Component Library
  │   ├─ RHI (Rendering Hardware Interface)
  │   ├─ MMath (Math Library) ← @maxellabs/math
  │   └─ MSpec (Specification) ← @maxellabs/specification
  │
  └─ Dependencies
      ├─ @maxellabs/math (Vector3, Quaternion, Matrix4)
      └─ @maxellabs/specification (Type Interfaces, Data Contracts)

// Specification Layer (Type Contracts)
@maxellabs/specification
  └─ packages/specification/src/index.ts
      ├─ Core (ITransform, Vector3Like, etc.)
      ├─ Common (Visual, Physics, Animation interfaces)
      ├─ Rendering (Pipeline, Shader, Resource specs)
      └─ Workflow (Scene, Asset, Lifecycle specs)
```

### Initialization Flow

```pseudocode
// 1. Engine Entry
function initializeEngine(): Engine {
  // 2. Create WebGL Device (RHI)
  const device = new WebGLDevice(canvas);

  // 3. Create ECS World
  const world = new World();

  // 4. Register Component Types
  world.registerComponent(LocalTransform);
  world.registerComponent(WorldTransform);
  world.registerComponent(MeshRef);
  // ... more components

  // 5. Create Demo Runner (Optional)
  const demo = new DemoRunner(device, world);

  return { world, device, demo };
}

// 6. Runtime Loop
function gameLoop() {
  // Update Systems
  world.update();

  // Render
  device.render(world);

  requestAnimationFrame(gameLoop);
}
```

## 🎮 Component System Architecture

### Type-First Design Pattern

```typescript
// 1. Specification Interface (from @maxellabs/specification)
interface ITransform {
  position: Vector3Like;
  rotation: QuaternionLike;
  scale: Vector3Like;
  matrix?: Matrix4Like;
  anchor?: Vector3Like;
  space?: TransformSpace;
}

// 2. Component Implementation (from @maxellabs/core)
class LocalTransform extends Component implements ITransform {
  position: Vector3Like = { x: 0, y: 0, z: 0 };
  rotation: QuaternionLike = { x: 0, y: 0, z: 0, w: 1 };
  scale: Vector3Like = { x: 1, y: 1, z: 1 };
  matrix?: Matrix4Like;
  anchor?: Vector3Like;
  space?: TransformSpace;

  // 3. Factory Method (Specification → Component)
  static fromData(data: ITransform): LocalTransform {
    const component = new LocalTransform();

    // Null-safe field copying with defaults
    if (data.position) {
      component.position = {
        x: data.position.x ?? 0,
        y: data.position.y ?? 0,
        z: data.position.z ?? 0,
      };
    }

    // Deep copy optional fields
    if (data.matrix !== undefined) {
      component.matrix = { ...data.matrix };
    }

    component.markDirty();
    return component;
  }
}

// 4. Usage in World
const world = new World();
const entity = world.createEntity();

// Component data flows: Specification → fromData() → Component → World
const transformData: ITransform = {
  position: { x: 1, y: 2, z: 3 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 }
};

world.addComponent(entity, LocalTransform, transformData);
```

### Component Categories

```typescript
// Transform Components (Spatial)
LocalTransform    // Local space transform
WorldTransform    // World space transform
Parent            // Parent entity reference
Children          // Child entities list

// Visual Components (Rendering)
MeshRef           // Mesh resource reference
MaterialRef       // Material resource reference
Visible           // Visibility flag
Layer             // Rendering layer
CastShadow        // Shadow casting
ReceiveShadow     // Shadow receiving

// Data Components (State)
Static            // Marker interface (no fields)
AnimationState    // Animation playback state

// Physics Components (Physics)
Collider          // Collision shape
RigidBody         // Physics body properties

// Animation Components
AnimationState    // Animation state management
```

### ECS Architecture (Archetype-Based)

```pseudocode
// Archetype Layout (SoA - Structure of Arrays)
Archetype [Position + Velocity]
├─ entities: [EntityId, EntityId, EntityId]
├─ Position: [{x,y,z}, {x,y,z}, {x,y,z}]
└─ Velocity: [{x,y,z}, {x,y,z}, {x,y,z}]

// World Management
World
├─ ComponentRegistry: Maps ComponentClass → ComponentTypeId
├─ ArchetypeCache: Map<BitMask, Archetype>
├─ EntityLocations: Map<EntityId, {archetype, row}>
└─ QueryCache: Array<Query>

// Query System
Query { all: [Position, Velocity] }
├─ Iterates Archetypes matching mask
├─ Provides (component1, component2) tuples
└─ Fast SoA traversal
```

## 🔌 External API Exposure

### Public API Surface

```typescript
// Primary Engine API
export {
  // ECS Core
  World,
  Entity,
  Component,
  Query,

  // Components (All exported from core/components)
  LocalTransform,
  WorldTransform,
  Parent,
  Children,
  MeshRef,
  MaterialRef,
  Visible,
  Layer,
  CastShadow,
  ReceiveShadow,
  Static,
  AnimationState,
  Collider,
  RigidBody,

  // Base Classes
  MaxObject,
  ReferResource,

  // Events
  EventDispatcher,
  EventType,

  // Infrastructure
  IOCContainer,
  CanvasWrapper,

  // Utilities
  BitSet,
  logError,

  // RHI
  WebGLDevice,
  RenderPass,

  // Namespaced
  MMath,  // Math library
  MSpec   // Specification types
} from '@maxellabs/core';

// Simplified Usage
import { World, LocalTransform, MeshRef } from '@maxellabs/engine';

const world = new World();
const entity = world.createEntity();

world.addComponent(entity, LocalTransform, {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 }
});

world.addComponent(entity, MeshRef, {
  assetId: 'cube-mesh'
});
```

### Internal Component Flow

```pseudocode
// Complete Data Flow
Specification Interface (IMeshRef)
  ↓
User provides data: { assetId: 'cube' }
  ↓
Component.fromData(data: IMeshRef)
  ↓
Creates MeshRef instance with deep-copied fields
  ↓
World.addComponent(entity, MeshRef, instance)
  ↓
ComponentRegistry.getTypeId(MeshRef) → ComponentTypeId
  ↓
World.findOrCreateArchetype([MeshRef, ...])
  ↓
Archetype.addEntity(entity, [meshRefInstance])
  ↓
EntityLocation updated: { archetype, row }
  ↓
Query caches invalidated/updated
```

## 🎯 Key Design Patterns

### 1. Specification-First Architecture

```typescript
// Pattern: Interface → Implementation → Factory
// 1. Specification defines contract
interface IComponent {
  field: Type;
}

// 2. Component implements contract
class ComponentImpl extends Component implements IComponent {
  field: Type = defaultValue;
}

// 3. Factory converts data to instance
static fromData(data: IComponent): ComponentImpl {
  const instance = new ComponentImpl();
  // Safe field copying with null checks
  instance.field = data.field ?? defaultValue;
  return instance;
}
```

### 2. Deep Copy & Reference Isolation

```typescript
// Pattern: Prevent shared references
class ComponentImpl {
  static fromData(data: IComponent): ComponentImpl {
    const instance = new ComponentImpl();

    // ✅ Primitive: Direct assignment
    instance.primitive = data.primitive;

    // ✅ Object: Spread copy (deep)
    if (data.nested) {
      instance.nested = { ...data.nested };
    }

    // ✅ Array: Spread copy
    if (data.array) {
      instance.array = [...data.array];
    }

    // ❌ Wrong: Reference sharing
    // instance.nested = data.nested; // DON'T

    return instance;
  }
}
```

### 3. Null-Safe Field Handling

```typescript
// Pattern: Defensive fromData implementation
static fromData(data: ITransform): Transform {
  const component = new Transform();

  // Always check existence first
  if (data.position) {
    component.position = {
      x: data.position.x ?? 0,
      y: data.position.y ?? 0,
      z: data.position.z ?? 0
    };
  }

  // Handle optional fields
  if (data.matrix !== undefined) {
    component.matrix = { ...data.matrix };
  }

  // Mark for updates
  component.markDirty();

  return component;
}
```

### 4. SoA (Structure of Arrays) Memory Layout

```typescript
// Pattern: Cache-friendly, batch-optimized
class Archetype {
  // ❌ AoS (Array of Structures) - Bad for cache
  // entities: [{pos: {x,y,z}, vel: {x,y,z}}, ...]

  // ✅ SoA (Structure of Arrays) - Good for cache
  entities: EntityId[] = [];
  position: Vector3Like[] = [];
  velocity: Vector3Like[] = [];

  // Enables SIMD, cache prefetching, batch operations
  update() {
    for (let i = 0; i < this.entities.length; i++) {
      this.position[i].x += this.velocity[i].x;
      // Cache line contains only positions, high locality
    }
  }
}
```

## 🚫 Negative Constraints

### Architecture Violations

```typescript
// ❌ NEVER: Direct specification interface manipulation
class BadComponent {
  static fromData(data: ITransform): BadComponent {
    // WRONG: No null checks
    return {
      position: data.position, // Reference sharing!
      rotation: data.rotation,
      scale: data.scale
    };
  }
}

// ❌ NEVER: Component logic in specification
interface ITransform {
  // WRONG: Specification should be pure data
  calculateMatrix(): Matrix4Like;
}

// ❌ NEVER: Circular dependencies in component flow
// Component.fromData() → World → ComponentRegistry → Component.fromData()

// ❌ NEVER: Mutable default values
class BadComponent extends Component {
  static DEFAULT_POS = { x: 0, y: 0, z: 0 }; // Shared reference!

  position = BadComponent.DEFAULT_POS; // DON'T
}

// ❌ NEVER: Missing fromData method
class IncompleteComponent extends Component {
  // Missing: static fromData(data: IComponent): IncompleteComponent
  // Cannot be used with World.addComponent()
}
```

### Performance Violations

```typescript
// ❌ NEVER: AoS in hot paths
class BadArchetype {
  entities: Array<{ pos: Vector3, vel: Vector3 }> = []; // Cache miss!
}

// ❌ NEVER: Unnecessary allocations in loops
function badUpdate(archetype: Archetype) {
  for (const entity of archetype.entities) {
    const pos = archetype.getComponent(entity, Position); // Allocates!
    // Use direct array access instead
  }
}

// ❌ NEVER: Deep copy in fromData without checks
static fromData(data: IComponent): Component {
  const instance = new Component();
  // WRONG: Always deep copies even for primitives
  instance.field = JSON.parse(JSON.stringify(data.field));
  return instance;
}
```

### Type Safety Violations

```typescript
// ❌ NEVER: Any type in component system
class BadComponent extends Component {
  static fromData(data: any): BadComponent { // No type safety!
    return new BadComponent();
  }
}

// ❌ NEVER: Interface implementation without all fields
class PartialComponent implements ITransform {
  // Missing: rotation, scale, etc.
  position = { x: 0, y: 0, z: 0 };
}

// ❌ NEVER: Component without base class
class OrphanComponent { // Doesn't extend Component
  // Cannot be registered in World
}
```

## 📊 Architecture Summary

| Layer | Responsibility | Key Components |
|-------|---------------|----------------|
| **Specification** | Type contracts, data schemas | ITransform, IMeshRef, Vector3Like |
| **Component** | Data containers, fromData factories | LocalTransform, MeshRef, MaterialRef |
| **ECS Core** | Entity management, Archetype storage | World, Archetype, ComponentRegistry |
| **RHI** | Rendering abstraction | WebGLDevice, RenderPass |
| **Engine** | Public API, orchestration | DemoRunner, Engine entry |

### Design Principles

1. **Type-First**: Interfaces before implementation
2. **Specification-Aligned**: Components match spec interfaces
3. **Null-Safe**: Defensive fromData with defaults
4. **Reference-Isolated**: Deep copy for objects/arrays
5. **SoA Layout**: Cache-friendly memory organization
6. **Factory Pattern**: Static fromData methods for construction
7. **ECS Architecture**: Separation of data and logic

This architecture enables:
- ✅ Type-safe data flow from specification to runtime
- ✅ High-performance batch operations via SoA
- ✅ Flexible component composition via Archetypes
- ✅ Clean separation of concerns across layers
- ✅ Easy extensibility through component registration