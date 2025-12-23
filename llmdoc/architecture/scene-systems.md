---
id: "architecture-scene-systems"
type: "architecture"
title: "Scene & Systems Architecture"
description: "Complete documentation of Scene class, ComponentRegistry, and System architecture including Camera, Render, Layout, and Transform systems"
tags: ["scene", "systems", "ecs", "architecture", "scheduler", "rendering"]
context_dependency: ["architecture-components", "constitution-core-runtime"]
related_ids: ["architecture-components", "architecture-resources", "ref-data-models-core"]
---

## 📋 Context & Goal

**Context**: This document describes the refactored Scene management and System architecture, including the new Scene class, ComponentRegistry, and execution flow.

**Goal**: Provide comprehensive reference for Scene lifecycle, System scheduling, and the complete execution pipeline.

**Key Components**:
- Scene class (manages World + Scheduler + RHI Device)
- ComponentRegistry (type mapping for deserialization)
- SystemScheduler (execution stages and dependencies)
- New Systems: CameraSystem, RenderSystem

---

## 🎬 Scene Architecture

### Scene Class Overview

```typescript
interface IScene {
  readonly world: World;
  readonly device: IRHIDevice;
  readonly scheduler: SystemScheduler;

  // Entity management
  createEntity(name?: string): EntityId;
  destroyEntity(entity: EntityId): void;
  addEntity(entity: EntityId): this;
  removeEntity(entity: EntityId): this;

  // Queries
  query(descriptor: QueryDescriptor): Query;
  findEntityByName(name: string): EntityId | null;
  getEntitiesByTag(tag: string): EntityId[];

  // Lifecycle
  update(deltaTime: number): void;
  render(): void;
  dispose(): void;

  // Events
  on<T>(event: SceneEventType, listener: SceneEventListener<T>): void;
  emit<T>(event: SceneEventType, data?: T): void;
}
```

### Scene Implementation

```typescript
export class Scene implements IScene, IDisposable {
  readonly world: World;
  readonly scheduler: SystemScheduler;
  private _device: IRHIDevice | null;
  private _root: EntityId;
  private entities: Set<EntityId>;
  private nameIndex: Map<string, EntityId>;
  private tagIndex: Map<string, Set<EntityId>>;
  private eventListeners: Map<SceneEventType, Set<SceneEventListener>>;
  private _active: boolean;
  private _disposed: boolean;

  constructor(options: SceneConfig = {}) {
    // Generate ID
    this.id = `scene_${++Scene.sceneCounter}`;
    this.name = options.name ?? 'Scene';
    this._active = options.active ?? true;
    this._device = options.device ?? null;

    // Create ECS core
    this.world = new World();
    this.scheduler = new SystemScheduler(this.world);

    // Register required components
    this.registerSceneComponents();

    // Create root entity
    if (options.createRoot !== false) {
      this._root = this.createRootEntity();
    } else {
      this._root = -1 as EntityId;
    }
  }

  private registerSceneComponents(): void {
    this.world.registerComponent(Name);
    this.world.registerComponent(Tag);
    this.world.registerComponent(Disabled);
    this.world.registerComponent(Parent);
    this.world.registerComponent(Children);
    this.world.registerComponent(SceneEntityMetadata);
  }

  private createRootEntity(): EntityId {
    const root = this.world.createEntity();
    this.world.addComponent(root, Name, Name.fromData({ value: '__ROOT__' }));
    this.world.addComponent(
      root,
      SceneEntityMetadata,
      SceneEntityMetadata.fromData({ sceneId: this.id, active: true })
    );
    this.world.addComponent(root, Children, Children.fromData({ entities: [] }));
    this.entities.add(root);
    this.nameIndex.set('__ROOT__', root);
    return root;
  }
}
```

### Scene Lifecycle

```pseudocode
FUNCTION Scene.constructor(options):
  1. Generate unique scene ID
  2. Create World instance
  3. Create SystemScheduler
  4. Register core components (Name, Tag, Parent, Children, etc.)
  5. Create root entity (unless disabled)
  6. Initialize event listeners

FUNCTION Scene.update(deltaTime):
  1. Check if disposed
  2. Check if active
  3. Execute scheduler.update(deltaTime)
  4. Emit update event

FUNCTION Scene.render():
  1. Check if disposed
  2. Check if active and device exists
  3. RenderSystem handles actual rendering (in scheduler)

FUNCTION Scene.dispose():
  1. Emit unload event
  2. Clear all entities (except root)
  3. Destroy root entity
  4. Clear world
  5. Clear event listeners
  6. Clear indexes
  7. Mark as disposed
```

---

## 🔗 ComponentRegistry

### Purpose

The ComponentRegistry bridges the gap between **serialized data** (strings) and **runtime components** (classes).

### Interface

```typescript
interface SceneComponentRegistry {
  // Register a component type
  register<T extends Component>(type: string, componentClass: ComponentClass<T>): void;

  // Get component class by type name
  getComponentClass(type: string): ComponentClass | undefined;

  // Create component instance from data
  createComponent(type: string, data: Record<string, unknown>): Component | undefined;

  // Get all registered types
  getRegisteredTypes(): string[];
}
```

### Implementation

```typescript
class ComponentRegistry implements SceneComponentRegistry {
  private registry: Map<string, ComponentClass> = new Map();
  private factories: Map<string, (data: any) => Component> = new Map();

  register<T extends Component>(type: string, componentClass: ComponentClass<T>): void {
    this.registry.set(type, componentClass);
    this.factories.set(type, (data) => componentClass.fromData(data));
  }

  getComponentClass(type: string): ComponentClass | undefined {
    return this.registry.get(type);
  }

  createComponent(type: string, data: Record<string, unknown>): Component | undefined {
    const factory = this.factories.get(type);
    if (!factory) {
      console.warn(`[ComponentRegistry] Unknown component type: ${type}`);
      return undefined;
    }

    try {
      return factory(data);
    } catch (error) {
      console.error(`[ComponentRegistry] Failed to create component ${type}:`, error);
      return undefined;
    }
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.registry.keys());
  }
}

// Global registry instance
const globalRegistry = new ComponentRegistry();

export function getSceneComponentRegistry(): SceneComponentRegistry {
  return globalRegistry;
}
```

### Registration Process

```typescript
// Called during Scene initialization
function registerAllComponents(): void {
  // Transform
  globalRegistry.register('LocalTransform', LocalTransform);
  globalRegistry.register('WorldTransform', WorldTransform);
  globalRegistry.register('Parent', Parent);
  globalRegistry.register('Children', Children);

  // Visual
  globalRegistry.register('MeshRef', MeshRef);
  globalRegistry.register('MaterialRef', MaterialRef);
  globalRegistry.register('TextureRef', TextureRef);
  globalRegistry.register('Visible', Visible);
  globalRegistry.register('Layer', Layer);
  globalRegistry.register('CastShadow', CastShadow);
  globalRegistry.register('ReceiveShadow', ReceiveShadow);

  // Camera
  globalRegistry.register('Camera', Camera);
  globalRegistry.register('CameraTarget', CameraTarget);

  // Light
  globalRegistry.register('DirectionalLight', DirectionalLight);
  globalRegistry.register('PointLight', PointLight);
  globalRegistry.register('SpotLight', SpotLight);
  globalRegistry.register('AmbientLight', AmbientLight);

  // Layout
  globalRegistry.register('Anchor', Anchor);
  globalRegistry.register('FlexContainer', FlexContainer);
  globalRegistry.register('FlexItem', FlexItem);
  globalRegistry.register('LayoutResult', LayoutResult);

  // Animation
  globalRegistry.register('AnimationState', AnimationState);

  // Data
  globalRegistry.register('Name', Name);
  globalRegistry.register('Tag', Tag);
  globalRegistry.register('Disabled', Disabled);
  globalRegistry.register('Static', Static);
}
```

---

## ⚙️ SystemScheduler

### System Execution Stages

```typescript
enum SystemStage {
  FrameStart = 0,   // Input, events
  Update = 1,       // Animation, custom logic
  PostUpdate = 2,   // Transform, layout, camera
  Render = 3,       // Rendering
  FrameEnd = 4      // Cleanup
}
```

### System Metadata

```typescript
interface SystemMetadata {
  name: string;
  description: string;
  stage: SystemStage;
  priority: number;      // Lower = earlier execution
  before?: string[];     // Must run before these systems
  after?: string[];      // Must run after these systems
}

interface ISystem {
  metadata: SystemMetadata;
  initialize?(ctx: SystemContext): Query | undefined;
  execute(ctx: SystemContext, query?: Query): SystemExecutionStats | void;
  dispose?(ctx: SystemContext): void;
}

interface SystemExecutionStats {
  entityCount: number;
  executionTimeMs: number;
  skipped: boolean;
}
```

### Scheduler Implementation

```typescript
class SystemScheduler {
  private world: World;
  private systems: Map<string, ISystem> = new Map();
  private queries: Map<string, Query> = new Map();
  private stageSystems: Map<SystemStage, string[]> = new Map();
  private executionOrder: string[] = [];

  constructor(world: World) {
    this.world = world;
    // Initialize stage maps
    for (const stage of Object.values(SystemStage)) {
      if (typeof stage === 'number') {
        this.stageSystems.set(stage, []);
      }
    }
  }

  addSystem(system: ISystem): void {
    const name = system.metadata.name;
    this.systems.set(name, system);

    // Add to stage
    const stage = system.metadata.stage;
    const systemsInStage = this.stage Systems StageStage get stage stage stage stage stageSystems = stage     stageSystems  stage stage stage stage stage stage systems stage stage stage  stage   stage stage     stage  stage stage stage: stage    systems = = Query: =   : Query::        Query Query     Query   Query =     Add    System Query Query            stage  stage Query stage  =    Query Query this   stage stage Query systems stage   stage this  systems
    this.executionOrder = this.resolveExecutionOrder();

    // Initialize systems
    for (const name of this.executionOrder) {
      const system = this.systems.get(name)!;
      if (system.initialize) {
        const query = system.initialize({ world: this.world });
        if (query) {
          this.queries.set(name, query);
        }
      }
    }
  }

  private resolveExecutionOrder(): string[] {
    // 1. Group by stage
    const staged: SystemStage[][] = [];
    for (const [stage, names] of this.stageSystems) {
      if (!staged[stage]) staged[stage] = [];
      staged[stage].push(...names);
    }

    // 2. Sort by priority within each stage
    const ordered: string[] = [];
    for (let stage = 0; stage < staged.length; stage++) {
      if (staged[stage]) {
        const names = staged[stage];
        names.sort((a, b) => {
          const sysA = this.systems.get(a)!;
          const sysB = this.systems.get(b)!;
          return sysA.metadata.priority - sysB.metadata.priority;
        });
        ordered.push(...names);
      }
    }

    // 3. Apply dependency constraints
    return this.applyDependencies(ordered);
  }

  private applyDependencies(order: string[]): string[] {
    // Topological sort based on before/after constraints
    const result = [...order];
    let changed = true;

    while (changed) {
      changed = false;
      for (const name of result) {
        const system = this.systems.get(name)!;
        const index = result.indexOf(name);

        // Handle 'after' constraints
        if (system.metadata.after) {
          for (const dep of system.metadata.after) {
            const depIndex = result.indexOf(dep);
            if (depIndex > index) {
              // Move system after its dependency
              result.splice(index, 1);
              result.splice(depIndex, 0, name);
              changed = true;
              break;
            }
          }
        }

        // Handle 'before' constraints
        if (system.metadata.before) {
          for (const dep of system.metadata.before) {
            const depIndex = result.indexOf(dep);
            if (depIndex < index) {
              // Move system before its dependency
              result.splice(index, 1);
              result.splice(depIndex, 0, name);
              changed = true;
              break;
            }
          }
        }
      }
    }

    return result;
  }

  update(deltaTime: number): void {
    const ctx: SystemContext = { world: this.world };

    for (const name of this.executionOrder) {
      const system = this.systems.get(name);
      const query = this.queries.get(name);

      if (!system) continue;

      // Execute system
      const stats = system.execute(ctx, query);

      // Log stats if needed
      if (stats && stats.executionTimeMs > 16) {
        console.warn(`[SystemScheduler] ${name} took ${stats.executionTimeMs.toFixed(2)}ms`);
      }
    }
  }

  dispose(): void {
    for (const [name, system] of this.systems) {
      const query = this.queries.get(name);
      if (system.dispose && query) {
        system.dispose({ world: this.world });
      }
    }
    this.systems.clear();
    this.queries.clear();
    this.stageSystems.clear();
    this.executionOrder = [];
  }

  getStats(): SystemSchedulerStats {
    return {
      systemCount: this.systems.size,
      executionOrder: [...this.executionOrder],
      stages: Array.from(this.stageSystems.entries()).map(([stage, systems]) => ({
        stage: SystemStage[stage],
        systems
      }))
    };
  }
}
```

---

## 🔌 System Implementations

### TransformSystem

**Stage**: PostUpdate
**Priority**: 5 (runs before CameraSystem)

**Responsibilities**:
- Compute world matrices from local transforms
- Handle parent-child hierarchy
- Mark WorldTransform as dirty

```typescript
class TransformSystem implements ISystem {
  metadata: SystemMetadata = {
    name: 'TransformSystem',
    description: 'Computes world transforms from local transforms and hierarchy',
    stage: SystemStage.PostUpdate,
    priority: 5
  };

  private localQuery?: Query;
  private parentQuery?: Query;

  initialize(ctx: SystemContext): Query | undefined {
    // Query for entities with LocalTransform
    this.localQuery = ctx.world.query({ all: [LocalTransform] });
    return this.localQuery;
  }

  execute(ctx: SystemContext, query?: Query): SystemExecutionStats {
    const startTime = performance.now();
    let entityCount = 0;

    const targetQuery = query ?? this.localQuery;
    if (!targetQuery) return { entityCount: 0, executionTimeMs: 0, skipped: false };

    targetQuery.forEach((entity, components) => {
      const local = components[0] as LocalTransform;

      // Get or create WorldTransform
      let world = ctx.world.getComponent(entity, WorldTransform);
      if (!world) {
        world = new WorldTransform();
        ctx.world.addComponent(entity, WorldTransform, world);
      }

      // Get parent
      const parent = ctx.world.getComponent(entity, Parent);

      if (parent && parent.entity !== null) {
        // Compute world transform with parent
        const parentWorld = ctx.world.getComponent(parent.entity, WorldTransform);
        if (parentWorld) {
          this.composeWithParent(local, parentWorld, world);
        } else {
          // Parent exists but no world transform yet - skip this frame
          return;
        }
      } else {
        // No parent - local = world
        this.copyLocalToWorld(local, world);
      }

      entityCount++;
    });

    return {
      entityCount,
      executionTimeMs: performance.now() - startTime,
      skipped: false
    };
  }

  private composeWithParent(local: LocalTransform, parent: WorldTransform, world: WorldTransform): void {
    // TODO: Implement matrix composition
    // world.matrix = parent.matrix * local.matrix
    // world.position = parent.position + local.position
    // world.rotation = parent.rotation * local.rotation
    // world.scale = parent.scale * local.scale
  }

  private copyLocalToWorld(local: LocalTransform, world: WorldTransform): void {
    world.position = { ...local.position };
    world.rotation = { ...local.rotation };
    world.scale = { ...local.scale };
    if (local.matrix) {
      world.matrix = { ...local.matrix };
    }
    world.markDirty();
  }
}
```

### CameraSystem

**Stage**: PostUpdate
**Priority**: 10 (runs after TransformSystem)

**Responsibilities**:
- Compute View Matrix from WorldTransform
- Compute Projection Matrix from Camera parameters
- Compute ViewProjection Matrix
- Handle CameraTarget (LookAt)

```typescript
class CameraSystem implements ISystem {
  metadata: SystemMetadata = {
    name: 'CameraSystem',
    description: 'Computes camera matrices (view, projection, viewProjection)',
    stage: SystemStage.PostUpdate,
    priority: 10,
    after: ['TransformSystem']
  };

  private cameraQuery?: Query;

  initialize(ctx: SystemContext): Query | undefined {
    // Register CameraMatrices component
    ctx.world.registerComponent(CameraMatrices);

    // Query cameras with world transforms
    this.cameraQuery = ctx.world.query({
      all: [Camera, WorldTransform]
    });

    return this.cameraQuery;
  }

  execute(ctx: SystemContext, query?: Query): SystemExecutionStats {
    const startTime = performance.now();
    let entityCount = 0;

    const cameraQuery = query ?? this.cameraQuery;
    if (!cameraQuery) return { entityCount: 0, executionTimeMs: 0, skipped: false };

    cameraQuery.forEach((entity, components) => {
      const camera = components[0] as Camera;
      const worldTransform = components[1] as WorldTransform;

      // Get or create CameraMatrices
      let matrices = ctx.world.getComponent(entity, CameraMatrices);
      if (!matrices) {
        matrices = new CameraMatrices();
        ctx.world.addComponent(entity, CameraMatrices, matrices);
      }

      // Check for CameraTarget
      const target = ctx.world.getComponent(entity, CameraTarget);

      // Compute matrices
      this.computeViewMatrix(worldTransform, target, matrices);
      this.computeProjectionMatrix(camera, matrices);
      this.computeViewProjectionMatrix(matrices);

      entityCount++;
    });

    return {
      entityCount,
      executionTimeMs: performance.now() - startTime,
      skipped: false
    };
  }

  private computeViewMatrix(
    transform: WorldTransform,
    target: CameraTarget | undefined,
    matrices: CameraMatrices
  ): void {
    if (target) {
      // LookAt mode
      // viewMatrix = lookAt(eye, target, up)
    } else {
      // Inverse of world matrix
      // viewMatrix = inverse(worldMatrix)
    }
  }

  private computeProjectionMatrix(camera: Camera, matrices: CameraMatrices): void {
    if (camera.projectionType === 'perspective') {
      // projectionMatrix = perspective(fov, aspect, near, far)
    } else {
      // projectionMatrix = orthographic(...)
    }
  }

  private computeViewProjectionMatrix(matrices: CameraMatrices): void {
    // viewProjectionMatrix = projectionMatrix * viewMatrix
  }
}
```

### RenderSystem

**Stage**: Render
**Priority**: 0

**Responsibilities**:
- Collect visible entities
- Sort by render queue
- Submit draw calls to RHI device
- Handle camera selection

```typescript
class RenderSystem implements ISystem {
  metadata: SystemMetadata = {
    name: 'RenderSystem',
    description: 'Renders visible entities using RHI device',
    stage: SystemStage.Render,
    priority: 0
  };

  private renderableQuery?: Query;
  private cameraQuery?: Query;

  initialize(ctx: SystemContext): Query | undefined {
    // Query for renderable entities
    this.renderableQuery = ctx.world.query({
      all: [WorldTransform, MeshRef, MaterialRef],
      none: [Disabled]
    });

    // Query for active cameras
    this.cameraQuery = ctx.world.query({
      all: [Camera, CameraMatrices],
      none: [Disabled]
    });

    return this.renderableQuery;
  }

  execute(ctx: SystemContext, query?: Query): SystemExecutionStats {
    const startTime = performance.now();

    // Find main camera
    const camera = this.findMainCamera(ctx);
    if (!camera) {
      return { entityCount: 0, executionTimeMs: 0, skipped: true };
    }

    // Get camera matrices
    const matrices = ctx.world.getComponent(camera, CameraMatrices);
    if (!matrices) {
      return { entityCount: 0, executionTimeMs: 0, skipped: true };
    }

    // Collect visible entities
    const visibleEntities: EntityId[] = [];
    const renderQuery = query ?? this.renderableQuery;

    if (renderQuery) {
      renderQuery.forEach((entity) => {
        // Frustum culling
        if (this.isEntityVisible(entity, camera, ctx)) {
          visibleEntities.push(entity);
        }
      });
    }

    // Sort by render queue (material, depth, etc.)
    const sorted = this.sortEntities(visibleEntities, ctx);

    // Submit to RHI
    this.submitRenderCalls(sorted, matrices, ctx);

    return {
      entityCount: sorted.length,
      executionTimeMs: performance.now() - startTime,
      skipped: false
    };
  }

  private findMainCamera(ctx: SystemContext): EntityId | null {
    if (!this.cameraQuery) return null;

    let mainCamera: EntityId | null = null;
    let highestPriority = -Infinity;

    this.cameraQuery.forEach((entity, components) => {
      const camera = components[0] as Camera;
      if (camera.isMain && camera.priority > highestPriority) {
        mainCamera = entity;
        highestPriority = camera.priority;
      }
    });

    return mainCamera;
  }

  private isEntityVisible(entity: EntityId, camera: EntityId, ctx: SystemContext): boolean {
    // Frustum culling logic
    // Check if entity bounds intersect camera frustum
    return true;
  }

  private sortEntities(entities: EntityId[], ctx: SystemContext): EntityId[] {
    // Sort by:
    // 1. Material (minimize state changes)
    // 2. Depth (front-to-back or back-to-front)
    // 3. Mesh
    return entities;
  }

  private submitRenderCalls(entities: EntityId[], matrices: CameraMatrices, ctx: SystemContext): void {
    // This is where actual rendering happens
    // 1. Begin frame on device
    // 2. For each entity:
    //    - Get MeshRef and MaterialRef
    //    - Get WorldTransform
    //    - Submit draw call
    // 3. End frame
  }
}
```

### LayoutSystem

**Stage**: PostUpdate
**Priority**: 8

**Responsibilities**:
- Compute layout from FlexContainer/FlexItem
- Compute Anchor constraints
- Update LayoutResult components

```typescript
class LayoutSystem implements ISystem {
  metadata: SystemMetadata = {
    name: 'LayoutSystem',
    description: 'Computes UI layout from Flex/Anchor components',
    stage: SystemStage.PostUpdate,
    priority: 8
  };

  private containerQuery?: Query;
  private itemQuery?: Query;

  initialize(ctx: SystemContext): Query | undefined {
    // Query for flex containers
    this.containerQuery = ctx.world.query({
      all: [FlexContainer, Children]
    });

    // Query for flex items
    this.itemQuery = ctx.world.query({
      all: [FlexItem]
    });

    return this.containerQuery;
  }

  execute(ctx: SystemContext, query?: Query): SystemExecutionStats {
    const startTime = performance.now();
    let processedCount = 0;

    const containerQuery = query ?? this.containerQuery;
    if (!containerQuery) return { entityCount: 0, executionTimeMs: 0, skipped: false };

    containerQuery.forEach((containerEntity, components) => {
      const flexContainer = components[0] as FlexContainer;
      const children = components[1] as Children;

      // Process each child
      for (const childEntity of children.entities) {
        const flexItem = ctx.world.getComponent(childEntity, FlexItem);
        if (!flexItem) continue;

        // Compute layout
        const layoutResult = this.computeFlexLayout(flexContainer, flexItem);

        // Update or create LayoutResult
        let result = ctx.world.getComponent(childEntity, LayoutResult);
        if (!result) {
          result = new LayoutResult();
          ctx.world.addComponent(childEntity, LayoutResult, result);
        }

        Object.assign(result, layoutResult);
        result.markDirty();

        processedCount++;
      }
    });

    return {
      entityCount: processedCount,
      executionTimeMs: performance.now() - startTime,
      skipped: false
    };
  }

  private computeFlexLayout(container: FlexContainer, item: FlexItem): LayoutResult {
    // Flexbox algorithm implementation
    // Returns: { x, y, width, height }
    return {
      x: 0,
      y: 0,
      width: 100,
      height: 100
    } as LayoutResult;
  }
}
```

---

## 🔄 Complete Execution Flow

### Frame Update Sequence

```pseudocode
FUNCTION Scene.update(deltaTime):
  // Stage 0: FrameStart
  FOR each system IN scheduler.systems:
    IF system.metadata.stage == FrameStart:
      system.execute(ctx)

  // Stage 1: Update
  FOR each system IN scheduler.systems:
    IF system.metadata.stage == Update:
      system.execute(ctx)

  // Stage 2: PostUpdate
  FOR each system IN scheduler.systems:
    IF system.metadata.stage == PostUpdate:
      system.execute(ctx)

  // Stage 3: Render (called separately)
  Scene.render()

FUNCTION Scene.render():
  // Stage 3: Render
  FOR each system IN scheduler.systems:
    IF system.metadata.stage == Render:
      system.execute(ctx)

  // Stage 4: FrameEnd (optional)
  FOR each system IN scheduler.systems:
    IF system.metadata.stage == FrameEnd:
      system.execute(ctx)
```

### Detailed PostUpdate Flow

```
PostUpdate Stage (Priority Order):
├── TransformSystem (Priority: 5)
│   └── Computes WorldTransform from LocalTransform + hierarchy
│
├── LayoutSystem (Priority: 8)
│   └── Computes LayoutResult from Flex/Anchor
│
└── CameraSystem (Priority: 10)
    └── Computes CameraMatrices (view, projection, viewProjection)
        ↓
    Ready for RenderStage
```

### Render Flow

```
Render Stage:
└── RenderSystem (Priority: 0)
    ├── Find main camera (highest priority + isMain)
    ├── Get camera matrices
    ├── Query renderable entities
    ├── Frustum culling
    ├── Sort by material/depth
    ├── Submit to RHI device
    └── End frame
```

---

## 🎯 Entity Lifecycle

### Creation

```typescript
// 1. Create entity
const entity = scene.createEntity('Player');

// 2. Add components
scene.world.addComponent(entity, LocalTransform, LocalTransform.fromData({
  position: { x: 0, y: 0, z: 0 }
}));

scene.world.addComponent(entity, MeshRef, MeshRef.fromData({
  assetId: 'cube-mesh'
}));

scene.world.addComponent(entity, MaterialRef, MaterialRef.fromData({
  assetId: 'default-material'
}));

// 3. Systems automatically process
// TransformSystem computes WorldTransform
// RenderSystem renders entity
```

### Destruction

```typescript
// Recursive destruction
scene.destroyEntity(entity);

// 1. Destroy children first
const children = scene.getChildren(entity);
for (const child of children) {
  scene.destroyEntity(child);
}

// 2. Remove from scene
scene.removeEntity(entity);

// 3. Destroy in world
world.destroyEntity(entity);
```

### Hierarchy

```typescript
// Set parent
scene.setParent(child, parent);

// Internally:
// - Adds Parent component to child
// - Adds/updates Children component on parent
// - TransformSystem will compute world transforms
```

---

## 📊 Data Flow: Scene.fromData()

### Deserialization Pipeline

```typescript
static fromData(data: ISceneData, options: Partial<SceneConfig> = {}): Scene {
  // 1. Create scene
  const scene = new Scene({
    name: data.metadata.name,
    active: options.active ?? true,
    device: options.device,
    createRoot: true,
  });

  // 2. Get registry
  const registry = getSceneComponentRegistry();

  // 3. ID mapping
  const entityIdMap: Map<number, EntityId> = new Map();

  // 4. First pass: Create all entities
  for (const entityData of data.entities) {
    const entity = scene.createEntityFromData(entityData, registry);
    entityIdMap.set(entityData.id, entity);
  }

  // 5. Second pass: Establish hierarchy
  for (const entityData of data.entities) {
    if (entityData.parent !== undefined && entityData.parent !== null) {
      const entity = entityIdMap.get(entityData.id);
      const parentEntity = entityIdMap.get(entityData.parent);
      if (entity && parentEntity) {
        scene.setParent(entity, parentEntity);
      }
    }
  }

  // 6. Apply environment
  if (data.environment) {
    scene.applyEnvironment(data.environment);
  }

  // 7. Apply render settings
  if (data.renderSettings) {
    scene.applyRenderSettings(data.renderSettings);
  }

  // 8. Emit event
  scene.emit('dataLoaded', { data, entityCount: entityIdMap.size });

  return scene;
}

private createEntityFromData(entityData: IEntityData, registry: SceneComponentRegistry): EntityId {
  // Create entity with name
  const entity = this.createEntity(entityData.name);

  // Set tag
  if (entityData.tag) {
    this.setEntityTag(entity, entityData.tag);
  }

  // Set active state
  if (entityData.active === false) {
    this.setEntityActive(entity, false);
  }

  // Add components
  for (const componentData of entityData.components) {
    this.addComponentFromData(entity, componentData, registry);
  }

  return entity;
}

private addComponentFromData(
  entity: EntityId,
  componentData: IComponentData,
  registry: SceneComponentRegistry
): void {
  const { type, data, enabled } = componentData;

  // Skip already handled components
  if (type === 'Name' || type === 'Tag') return;

  // Get component class
  const componentClass = registry.getComponentClass(type);
  if (!componentClass) {
    console.warn(`[Scene] Unknown component type: ${type}`);
    return;
  }

  // Create component instance
  const component = registry.createComponent(type, data);
  if (!component) {
    console.warn(`[Scene] Failed to create component: ${type}`);
    return;
  }

  // Handle enabled state
  if (enabled === false && 'enabled' in component) {
    (component as any).enabled = false;
  }

  // Add to entity
  try {
    this.world.addComponent(entity, componentClass, component);
  } catch (error) {
    console.error(`[Scene] Failed to add component ${type} to entity:`, error);
  }
}
```

### Serialization (toData)

```typescript
toData(): ISceneScene {
 {
 {
 scene scene entity to to to scene scene entity entity scene scene scene scene scene entity to to to to scene scene scene to to to scene scene entity to scene to to to to to to scene entity to to entity note note to to scene scene scene the to to to scene scene note the to scene to scene note note note to to note note note note the to scene note note note note note note note note note to scene scene note also also note scene also also note note note note scene also also note note note note also also note note note note note note note note note note also also note note note note also also also note entity scene.world.getComponent(entity, componentClass);
      if serializeComponent(component: // Convert component to POD data
  // data: Record<string, unknown> = {};

 obj = component as Record<string, unknown>;

  for for const key of Object.keys(obj)) {
      if ( typeof value = obj[key];

      // Skip functions and private if (typeof value === 'function') continue);
        // Skip private if ( key.startsWith('_')) continue;

      // Deep copy objects/arrays
      if (value !== null && typeof value === 'object') {
        if (Array.isArray(value)) {
          data[key] = [...value];
        } else {
          data[key] = { ...value };
        }
      } else {
        data[key] = value;
      }
    }

    return data;
  }
```

---

## 🎨 Event System

### Scene Events

```typescript
type SceneEventType =
  | 'entityAdded'
  | 'entityRemoved'
  | 'componentAdded'
  | 'componentRemoved'
  | 'update'
  | 'load'
  | 'unload'
  | 'dataLoaded'
  | 'environmentChanged'
  | 'renderSettingsChanged';

type SceneEventListener<T = unknown> = (data: T) => void;

interface SceneEventMap {
  entityAdded: { entity: EntityId; name?: string };
  entityRemoved: { entity: EntityId };
  componentAdded: { entity: EntityId; component: Component };
  componentRemoved: { entity: EntityId; component: Component };
  update: { deltaTime: number };
  load: { scene: Scene };
  unload: { scene: Scene };
  dataLoaded: { data: ISceneData; entityCount: number };
  environmentChanged: IEnvironmentData;
  renderSettingsChanged: IRenderSettingsData;
}
```

### Usage Example

```typescript
scene.on('entityAdded', ({ entity, name }) => {
  console.log(`Entity ${name ?? entity} added to scene`);
});

scene.on('update', ({ deltaTime }) => {
  // Custom update logic
});

scene.on('dataLoaded', ({ data, entityCount }) => {
  console.log(`Loaded ${entityCount} entities from scene data`);
});
```

---

## 🚫 Negative Constraints

### Scene Architecture

```typescript
// ❌ FORBIDDEN: Scene directly manipulating RHI
class BadScene {
  render() {
    this.device.clear();  // ❌ Should be in RenderSystem
    this.device.draw();   // ❌ Should be in RenderSystem
  }
}

// ✅ CORRECT: Scene delegates to systems
class GoodScene {
  render() {
    // RenderSystem handles actual rendering
    this.scheduler.update(0);  // Executes RenderSystem
  }
}
```

### System Dependencies

```typescript
// ❌ FORBIDDEN: Circular dependencies
class SystemA implements ISystem {
  metadata = { after: ['SystemB'] };
}

class SystemB implements ISystem {
  metadata = { after: ['SystemA'] };  // ❌ Circular!
}

// ✅ CORRECT: Linear dependencies
class TransformSystem implements ISystem {
  metadata = { priority: 5 };  // Runs early
}

class CameraSystem implements ISystem {
  metadata = {
    priority: 10,
    after: ['TransformSystem']  // Depends on TransformSystem
  };
}
```

### Component Registration

```typescript
// ❌ FORBIDDEN: Components without fromData
class BadComponent extends Component {
  // Missing: static fromData()
}

// ✅ CORRECT: All components implement fromData
class GoodComponent extends Component {
  static fromData(data: Partial<IGoodData>): GoodComponent {
    return new GoodComponent();
  }
}
```

---

## ✅ Compliance Checklist

### Scene Implementation
- [ ] Scene implements IScene interface
- [ ] Scene manages World and Scheduler
- [ ] Scene handles entity lifecycle (create/destroy)
- [ ] Scene provides query methods
- [ ] Scene supports event system
- [ ] Scene supports serialization (fromData/toData)
- [ ] Scene handles RHI device injection
- [ ] Scene disposes cleanly

### ComponentRegistry
- [ ] Registry maps string types to classes
- [ ] Registry provides factory method
- [ ] Registry handles unknown types gracefully
- [ ] All components registered at startup

### SystemScheduler
- [ ] Scheduler resolves execution order
- [ ] Scheduler respects priority
- [ ] Scheduler enforces dependencies
- [ ] Scheduler handles SystemContext
- [ ] Scheduler collects execution stats

### System Implementations
- [ ] TransformSystem computes world transforms
- [ ] CameraSystem computes camera matrices
- [ ] RenderSystem handles rendering
- [ ] LayoutSystem computes UI layout
- [ ] All systems implement ISystem interface
- [ ] All systems provide metadata
- [ ] All systems handle queries properly

### Execution Flow
- [ ] FrameStart stage executes first
- [ ] Update stage executes second
- [ ] PostUpdate stage executes third
- [ ] Render stage executes fourth
- [ ] Systems execute in correct order
- [ ] Dependencies are respected

---

## 📚 Related Documents

- **Component Architecture**: `architecture-components` - Component implementations
- **Resource Management**: `architecture-resources` - Resource loading
- **Constitution**: `constitution-core-runtime` - All rules
- **Specification**: `ref-data-models-core` - Interface definitions
- **System Overview**: `architecture-system-overview` - High-level architecture