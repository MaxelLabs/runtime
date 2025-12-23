---
id: "data-models-core"
type: "reference"
title: "Core Data Models & Components"
description: "Specification interfaces and Core component implementations for ECS architecture"
tags: ["ecs", "components", "interfaces", "data-model", "transform", "visual", "physics", "animation"]
related_ids: ["architecture-ecs", "component-lifecycle"]
---

## 📋 Context & Goal

**Context**: This document defines the complete data model for the ECS (Entity-Component-System) architecture, covering specification interfaces and core component implementations.

**Goal**: Provide a comprehensive reference for all data structures, interfaces, and component patterns used throughout the system.

**Prerequisites**:
- Understanding of ECS architecture
- TypeScript interface knowledge
- Component lifecycle concepts

---

## 🔌 Core Interfaces (Specification Layer)

### 1. Transform System

#### ITransform Interface
```typescript
interface ITransform {
  position: Vector3Like;
  rotation: QuaternionLike;
  scale: Vector3Like;
  matrix?: Matrix4Like;
  anchor?: Vector3Like;
  space?: TransformSpace;
}
```

**Purpose**: Defines 3D spatial transformation data
**Usage**: Base for LocalTransform and WorldTransform components

#### Parent/Child Relationships
```typescript
interface IParent {
  entity: number;  // Parent entity ID, -1 for no parent
}

interface IChildren {
  entities: number[];  // Child entity IDs
}
```

### 2. Visual System

#### Mesh & Material References
```typescript
interface IMeshRef {
  assetId: string;
  meshName?: string;
  submeshIndex?: number;
}

interface IMaterialRef {
  assetId: string;
  overrides?: Record<string, unknown>;
  materialEnabled?: boolean;
}
```

#### Texture System
```typescript
interface BaseTextureRef {
  assetId: string;
  slot?: string;
  uvChannel?: number;
  transform?: TextureTransform;
  sampler?: TextureSampler;
  intensity?: number;
}

interface TextureTransform {
  scale?: Vector2Like;
  offset?: Vector2Like;
  rotation?: number;
}

interface TextureSampler {
  wrapS: number;
  wrapT: number;
  minFilter: number;
  magFilter: number;
}
```

#### Visual Properties
```typescript
interface IVisible {
  value: boolean;
}

interface ILayer {
  mask: number;  // 32-bit layer mask
}

interface ICastShadow {
  value: boolean;
}

interface IReceiveShadow {
  value: boolean;
}
```

#### Color
```typescript
interface ColorLike {
  r: number;
  g: number;
  b: number;
  a: number;
}
```

### 3. Data System

#### Metadata & Identification
```typescript
interface IName {
  value: string;
}

interface ITag {
  value: string;
}

interface ITags {
  values: string[];
}

interface IDisabled {
  reason?: string;
}

interface IMetadata {
  name?: string;
  description?: string;
  tags?: string[];
  customData?: Record<string, unknown>;
}

interface IStatic {
  // Marker interface - no fields
}
```

### 4. Physics System

#### Motion Properties
```typescript
interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

interface IMass {
  value: number;
  infinite?: boolean;
}

interface IGravity {
  scale: number;
}

interface IDamping {
  linear: number;
  angular: number;
}
```

### 5. Animation System

#### Animation State
```typescript
interface IAnimationState {
  currentClipId: string;
  time: number;
  speed: number;
  loop: boolean;
  playing: boolean;
}

interface IAnimationClipRef {
  assetId: string;
  duration: number;
}

interface ITimeline {
  currentTime: number;
  duration: number;
  playing: boolean;
  speed: number;
  trackIds: string[];
}

interface ITweenState {
  from: number;
  to: number;
  progress: number;
  duration: number;
  easing: EasingType;
  playing: boolean;
}

type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic';
```

### 6. Math Types

```typescript
interface Vector2Like {
  x: number;
  y: number;
}

interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

interface Vector4Like {
  x: number;
  y: number;
  z: number;
  w: number;
}

interface QuaternionLike {
  x: number;
  y: number;
  z: number;
  w: number;
}

interface Matrix4Like {
  m00: number; m01: number; m02: number; m03: number;
  m10: number; m11: number; m12: number; m13: number;
  m20: number; m21: number; m22: number; m23: number;
  m30: number; m31: number; m32: number; m33: number;
}

interface ColorLike {
  r: number;
  g: number;
  b: number;
  a: number;
}
```

---

## 🏗️ Component Implementations (Core Layer)

### Component Pattern

All components follow this pattern:
1. **Extend Component base class**
2. **Implement specification interface**
3. **Provide static fromData() method**
4. **Provide clone() method**

### 1. Transform Components

#### LocalTransform
```typescript
class LocalTransform extends Component implements ITransform {
  position: Vector3Like = { x: 0, y: 0, z: 0 };
  rotation: QuaternionLike = { x: 0, y: 0, z: 0, w: 1 };
  scale: Vector3Like = { x: 1, y: 1, z: 1 };
  matrix?: Matrix4Like;
  anchor?: Vector3Like;
  space?: TransformSpace;

  static fromData(data: ITransform): LocalTransform {
    const component = new LocalTransform();

    // Position with null checks
    if (data.position) {
      component.position = {
        x: data.position.x ?? 0,
        y: data.position.y ?? 0,
        z: data.position.z ?? 0,
      };
    }

    // Rotation with null checks
    if (data.rotation) {
      component.rotation = {
        x: data.rotation.x ?? 0,
        y: data.rotation.y ?? 0,
        z: data.rotation.z ?? 0,
        w: data.rotation.w ?? 1,
      };
    }

    // Scale with null checks
    if (data.scale) {
      component.scale = {
        x: data.scale.x ?? 1,
        y: data.scale.y ?? 1,
        z: data.scale.z ?? 1,
      };
    }

    // Optional fields
    if (data.matrix !== undefined) {
      component.matrix = { ...data.matrix };
    }

    if (data.anchor !== undefined) {
      component.anchor = { ...data.anchor };
    }

    if (data.space !== undefined) {
      component.space = data.space;
    }

    component.markDirty();
    return component;
  }

  override clone(): LocalTransform {
    const cloned = new LocalTransform();
    cloned.position = { ...this.position };
    cloned.rotation = { ...this.rotation };
    cloned.scale = { ...this.scale };
    if (this.matrix) cloned.matrix = { ...this.matrix };
    if (this.anchor) cloned.anchor = { ...this.anchor };
    if (this.space !== undefined) cloned.space = this.space;
    return cloned;
  }
}
```

#### WorldTransform
```typescript
class WorldTransform extends Component implements ITransform {
  position: Vector3Like = { x: 0, y: 0, z: 0 };
  rotation: QuaternionLike = { x: 0, y: 0, z: 0, w: 1 };
  scale: Vector3Like = { x: 1, y: 1, z: 1 };
  matrix?: Matrix4Like;
  space?: TransformSpace;

  static fromData(data: ITransform): WorldTransform {
    // Same pattern as LocalTransform
  }

  override clone(): WorldTransform {
    // Deep copy pattern
  }
}
```

#### Parent & Children
```typescript
class Parent extends Component implements IParent {
  entity: number = NO_PARENT_ENTITY;

  static fromData(data: IParent): Parent {
    const component = new Parent();
    component.entity = data.entity;
    return component;
  }

  override clone(): Parent {
    const cloned = new Parent();
    cloned.entity = this.entity;
    return cloned;
  }
}

class Children extends Component implements IChildren {
  entities: number[] = [];

  static fromData(data: IChildren): Children {
    const component = new Children();
    component.entities = [...data.entities];  // Array spread for copy
    return component;
  }

  override clone(): Children {
    const cloned = new Children();
    cloned.entities = [...this.entities];
    return cloned;
  }
}
```

### 2. Visual Components

#### MeshRef & MaterialRef
```typescript
class MeshRef extends Component implements IMeshRef {
  assetId: string = '';
  meshName?: string;
  submeshIndex?: number;

  static fromData(data: IMeshRef): MeshRef {
    const component = new MeshRef();
    component.assetId = data.assetId;
    if (data.meshName !== undefined) component.meshName = data.meshName;
    if (data.submeshIndex !== undefined) component.submeshIndex = data.submeshIndex;
    return component;
  }

  override clone(): MeshRef {
    const cloned = new MeshRef();
    cloned.assetId = this.assetId;
    if (this.meshName !== undefined) cloned.meshName = this.meshName;
    if (this.submeshIndex !== undefined) cloned.submeshIndex = this.submeshIndex;
    return cloned;
  }
}

class MaterialRef extends Component implements IMaterialRef {
  assetId: string = '';
  overrides?: Record<string, unknown>;
  materialEnabled?: boolean;

  static fromData(data: IMaterialRef): MaterialRef {
    const component = new MaterialRef();
    component.assetId = data.assetId;
    if (data.overrides !== undefined) {
      component.overrides = { ...data.overrides };  // Deep copy
    }
    if (data.materialEnabled !== undefined) {
      component.materialEnabled = data.materialEnabled;
    }
    return component;
  }

  override clone(): MaterialRef {
    const cloned = new MaterialRef();
    cloned.assetId = this.assetId;
    if (this.overrides !== undefined) {
      cloned.overrides = { ...this.overrides };
    }
    if (this.materialEnabled !== undefined) {
      cloned.materialEnabled = this.materialEnabled;
    }
    return cloned;
  }
}
```

#### TextureRef (Critical: Deep Copy Pattern)
```typescript
class TextureRef extends Component implements BaseTextureRef {
  assetId: string = '';
  slot?: string;
  uvChannel?: number;
  transform?: TextureTransform;
  sampler?: TextureSampler;
  intensity?: number;

  static fromData(data: BaseTextureRef): TextureRef {
    const component = new TextureRef();
    component.assetId = data.assetId;

    if (data.slot !== undefined) component.slot = data.slot;
    if (data.uvChannel !== undefined) component.uvChannel = data.uvChannel;

    // ⚠️ CRITICAL: Deep copy transform with nested object handling
    if (data.transform !== undefined) {
      component.transform = {
        scale: data.transform.scale ? { ...data.transform.scale } : undefined,
        offset: data.transform.offset ? { ...data.transform.offset } : undefined,
        rotation: data.transform.rotation,  // Primitive value, direct copy
      };
    }

    if (data.sampler !== undefined) {
      component.sampler = { ...data.sampler };
    }

    if (data.intensity !== undefined) {
      component.intensity = data.intensity;
    }

    return component;
  }

  override clone(): TextureRef {
    const cloned = new TextureRef();
    cloned.assetId = this.assetId;
    if (this.slot !== undefined) cloned.slot = this.slot;
    if (this.uvChannel !== undefined) cloned.uvChannel = this.uvChannel;

    if (this.transform !== undefined) {
      cloned.transform = {
        scale: this.transform.scale ? { ...this.transform.scale } : undefined,
        offset: this.transform.offset ? { ...this.transform.offset } : undefined,
        rotation: this.transform.rotation,
      };
    }

    if (this.sampler !== undefined) {
      cloned.sampler = {
        wrapS: this.sampler.wrapS,
        wrapT: this.sampler.wrapT,
        minFilter: this.sampler.minFilter,
        magFilter: this.sampler.magFilter,
      };
    }

    if (this.intensity !== undefined) {
      cloned.intensity = this.intensity;
    }

    return cloned;
  }
}
```

#### Visual Properties
```typescript
class Color extends Component implements ColorLike {
  r: number = 1;
  g: number = 1;
  b: number = 1;
  a: number = 1;

  static fromData(data: ColorLike): Color {
    const component = new Color();
    component.r = data.r;
    component.g = data.g;
    component.b = data.b;
    component.a = data.a;
    return component;
  }

  override clone(): Color {
    const cloned = new Color();
    cloned.r = this.r;
    cloned.g = this.g;
    cloned.b = this.b;
    cloned.a = this.a;
    return cloned;
  }
}

class Visible extends Component implements IVisible {
  value: boolean = true;

  static fromData(data: IVisible): Visible {
    const component = new Visible();
    component.value = data.value;
    return component;
  }

  override clone(): Visible {
    const cloned = new Visible();
    cloned.value = this.value;
    return cloned;
  }
}

class Layer extends Component implements ILayer {
  mask: number = 1;

  static fromData(data: ILayer): Layer {
    const component = new Layer();
    component.mask = data.mask;
    return component;
  }

  override clone(): Layer {
    const cloned = new Layer();
    cloned.mask = this.mask;
    return cloned;
  }
}

class CastShadow extends Component implements ICastShadow {
  value: boolean = true;

  static fromData(data: ICastShadow): CastShadow {
    const component = new CastShadow();
    component.value = data.value;
    return component;
  }

  override clone(): CastShadow {
    const cloned = new CastShadow();
    cloned.value = this.value;
    return cloned;
  }
}

class ReceiveShadow extends Component implements IReceiveShadow {
  value: boolean = true;

  static fromData(data: IReceiveShadow): ReceiveShadow {
    const component = new ReceiveShadow();
    component.value = data.value;
    return component;
  }

  override clone(): ReceiveShadow {
    const cloned = new ReceiveShadow();
    cloned.value = this.value;
    return cloned;
  }
}
```

### 3. Data Components

#### Identification & Metadata
```typescript
class Name extends Component implements IName {
  value: string = '';

  static fromData(data: IName): Name {
    const component = new Name();
    component.value = data.value;
    return component;
  }

  override clone(): Name {
    const cloned = new Name();
    cloned.value = this.value;
    return cloned;
  }
}

class Tag extends Component implements ITag {
  value: string = '';

  static fromData(data: ITag): Tag {
    const component = new Tag();
    component.value = data.value;
    return component;
  }

  override clone(): Tag {
    const cloned = new Tag();
    cloned.value = this.value;
    return cloned;
  }
}

class Tags extends Component implements ITags {
  values: string[] = [];

  static fromData(data: ITags): Tags {
    const component = new Tags();
    component.values = [...data.values];  // Array spread copy
    return component;
  }

  override clone(): Tags {
    const cloned = new Tags();
    cloned.values = [...this.values];
    return cloned;
  }
}

class Metadata extends Component implements IMetadata {
  description?: string;
  tags?: string[];
  customData?: Record<string, unknown>;

  static fromData(data: IMetadata): Metadata {
    const component = new Metadata();
    if (data.name !== undefined) component.name = data.name;
    if (data.description !== undefined) component.description = data.description;
    if (data.tags !== undefined) component.tags = [...data.tags];
    if (data.customData !== undefined) {
      component.customData = { ...data.customData };
    }
    return component;
  }

  override clone(): Metadata {
    const cloned = new Metadata();
    if (this.name !== undefined) cloned.name = this.name;
    if (this.description !== undefined) cloned.description = this.description;
    if (this.tags !== undefined) cloned.tags = [...this.tags];
    if (this.customData !== undefined) {
      cloned.customData = { ...this.customData };
    }
    return cloned;
  }
}

class Disabled extends Component implements IDisabled {
  reason?: string;

  static fromData(data: IDisabled): Disabled {
    const component = new Disabled();
    if (data.reason !== undefined) component.reason = data.reason;
    return component;
  }

  override clone(): Disabled {
    const cloned = new Disabled();
    if (this.reason !== undefined) cloned.reason = this.reason;
    return cloned;
  }
}

// Tag Component (no data fields)
class Static extends Component implements IStatic {
  static fromData(): Static {
    return new Static();
  }

  override clone(): Static {
    return new Static();
  }
}
```

### 4. Physics Components

#### Motion & Forces
```typescript
class Velocity extends Component implements Vector3Like {
  x: number = 0;
  y: number = 0;
  z: number = 0;

  static fromData(data: Vector3Like): Velocity {
    const component = new Velocity();
    component.x = data.x;
    component.y = data.y;
    component.z = data.z;
    return component;
  }

  override clone(): Velocity {
    const cloned = new Velocity();
    cloned.x = this.x;
    cloned.y = this.y;
    cloned.z = this.z;
    return cloned;
  }
}

class Acceleration extends Component implements Vector3Like {
  x: number = 0;
  y: number = 0;
  z: number = 0;

  static fromData(data: Vector3Like): Acceleration {
    const component = new Acceleration();
    component.x = data.x;
    component.y = data.y;
    component.z = data.z;
    return component;
  }

  override clone(): Acceleration {
    const cloned = new Acceleration();
    cloned.x = this.x;
    cloned.y = this.y;
    cloned.z = this.z;
    return cloned;
  }
}

class AngularVelocity extends Component implements Vector3Like {
  x: number = 0;
  y: number = 0;
  z: number = 0;

  static fromData(data: Vector3Like): AngularVelocity {
    const component = new AngularVelocity();
    component.x = data.x;
    component.y = data.y;
    component.z = data.z;
    return component;
  }

  override clone(): AngularVelocity {
    const cloned = new AngularVelocity();
    cloned.x = this.x;
    cloned.y = this.y;
    cloned.z = this.z;
    return cloned;
  }
}

class Mass extends Component implements IMass {
  value: number = 1;
  infinite?: boolean;

  static fromData(data: IMass): Mass {
    const component = new Mass();
    component.value = data.value;
    if (data.infinite !== undefined) {
      component.infinite = data.infinite;
    }
    return component;
  }

  override clone(): Mass {
    const cloned = new Mass();
    cloned.value = this.value;
    if (this.infinite !== undefined) {
      cloned.infinite = this.infinite;
    }
    return cloned;
  }
}

class Gravity extends Component implements IGravity {
  scale: number = 1;

  static fromData(data: IGravity): Gravity {
    const component = new Gravity();
    component.scale = data.scale;
    return component;
  }

  override clone(): Gravity {
    const cloned = new Gravity();
    cloned.scale = this.scale;
    return cloned;
  }
}

class Damping extends Component implements IDamping {
  linear: number = 0.01;
  angular: number = 0.01;

  static fromData(data: IDamping): Damping {
    const component = new Damping();
    component.linear = data.linear;
    component.angular = data.angular;
    return component;
  }

  override clone(): Damping {
    const cloned = new Damping();
    cloned.linear = this.linear;
    cloned.angular = this.angular;
    return cloned;
  }
}
```

### 5. Animation Components

#### Animation State
```typescript
class AnimationState extends Component implements IAnimationState {
  currentClipId: string = '';
  time: number = 0;
  speed: number = 1;
  loop: boolean = true;
  playing: boolean = false;

  static fromData(data: IAnimationState): AnimationState {
    const component = new AnimationState();
    component.currentClipId = data.currentClipId;
    component.time = data.time;
    component.speed = data.speed;
    component.loop = data.loop;
    component.playing = data.playing;
    return component;
  }

  override clone(): AnimationState {
    const cloned = new AnimationState();
    cloned.currentClipId = this.currentClipId;
    cloned.time = this.time;
    cloned.speed = this.speed;
    cloned.loop = this.loop;
    cloned.playing = this.playing;
    return cloned;
  }
}

class AnimationClipRef extends Component implements IAnimationClipRef {
  assetId: string = '';
  duration: number = 0;

  static fromData(data: IAnimationClipRef): AnimationClipRef {
    const component = new AnimationClipRef();
    component.assetId = data.assetId;
    component.duration = data.duration;
    return component;
  }

  override clone(): AnimationClipRef {
    const cloned = new AnimationClipRef();
    cloned.assetId = this.assetId;
    cloned.duration = this.duration;
    return cloned;
  }
}

class Timeline extends Component implements ITimeline {
  currentTime: number = 0;
  duration: number = 0;
  playing: boolean = false;
  speed: number = 1;
  trackIds: string[] = [];

  static fromData(data: ITimeline): Timeline {
    const component = new Timeline();
    component.currentTime = data.currentTime;
    component.duration = data.duration;
    component.playing = data.playing;
    component.speed = data.speed;
    component.trackIds = [...data.trackIds];
    return component;
  }

  override clone(): Timeline {
    const cloned = new Timeline();
    cloned.currentTime = this.currentTime;
    cloned.duration = this.duration;
    cloned.playing = this.playing;
    cloned.speed = this.speed;
    cloned.trackIds = [...this.trackIds];
    return cloned;
  }
}

class TweenState extends Component implements ITweenState {
  from: number = 0;
  to: number = 0;
  progress: number = 0;
  duration: number = 1;
  easing: EasingType = 'linear';
  playing: boolean = false;

  static fromData(data: ITweenState): TweenState {
    const component = new TweenState();
    component.from = data.from;
    component.to = data.to;
    component.progress = data.progress;
    component.duration = data.duration;
    component.easing = data.easing;
    component.playing = data.playing;
    return component;
  }

  override clone(): TweenState {
    const cloned = new TweenState();
    cloned.from = this.from;
    cloned.to = this.to;
    cloned.progress = this.progress;
    cloned.duration = this.duration;
    cloned.easing = this.easing;
    cloned.playing = this.playing;
    return cloned;
  }
}
```

---

## 🧩 Composition Patterns (Traits)

### Common Trait Patterns

The specification interfaces compose multiple traits:

```typescript
// Base traits used across interfaces
interface Nameable {
  name?: string;
}

interface Describable {
  description?: string;
}

interface Taggable {
  tags?: string[];
}

interface Enableable {
  enabled?: boolean;
}

interface RequiredEnableable {
  enabled: boolean;
}

interface Durable {
  duration?: number;
}

interface Versionable {
  version?: string;
}

interface Auditable {
  createdAt?: string;
  updatedAt?: string;
}

interface Extensible {
  customData?: Record<string, unknown>;
}
```

### Composite Interfaces

```typescript
// Example: Combining traits
interface CommonMetadata extends
  Nameable,
  Describable,
  Versionable,
  Auditable,
  Taggable,
  Extensible
{}
```

---

## 🔄 Data Flow: Interface → Component

### Standard Pattern

```
1. Specification Interface (ITransform)
   ↓
2. JSON/Serialized Data
   ↓
3. Component.fromData(data)
   ↓
4. Component Instance (LocalTransform)
   ↓
5. ECS Registry
```

### Example Flow

```typescript
// Step 1: Source data (JSON, API, etc.)
const transformData: ITransform = {
  position: { x: 1, y: 2, z: 3 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
  space: TransformSpace.LOCAL
};

// Step 2: Create component
const transform = LocalTransform.fromData(transformData);

// Step 3: Add to entity
entity.addComponent(transform);

// Step 4: Clone if needed
const cloned = transform.clone();
```

### Deep Copy Verification

For nested objects, always use spread operator or explicit copying:

```typescript
// ✅ CORRECT: Deep copy
component.transform = {
  scale: data.transform.scale ? { ...data.transform.scale } : undefined,
  offset: data.transform.offset ? { ...data.transform.offset } : undefined,
  rotation: data.transform.rotation,
};

// ❌ WRONG: Shallow copy (reference sharing)
component.transform = data.transform;  // Don't do this!
```

---

## ⚠️ Negative Constraints

### 🚫 **DO NOT** - Interface Violations

1. **Never modify specification interfaces in core components**
   - Components implement interfaces, they don't extend them
   - Runtime-only fields (like `dirty` flags) are allowed

2. **Never use Partial<T> in fromData signatures**
   - All fromData methods accept full interface types
   - Handle optional fields with explicit checks

### 🚫 **DO NOT** - Data Integrity Issues

3. **Never share references to nested objects**
   - Always deep copy: `{ ...obj }` for objects
   - Always copy arrays: `[...arr]` for arrays
   - Direct assignment creates reference bugs

4. **Never skip null/undefined checks**
   ```typescript
   // ❌ WRONG
   component.position.x = data.position.x;

   // ✅ CORRECT
   if (data.position) {
     component.position.x = data.position.x ?? 0;
   }
   ```

### 🚫 **DO NOT** - Pattern Violations

5. **Never omit fromData() for components**
   - All components must have static fromData()
   - Even tag components (use empty signature)

6. **Never omit clone() for components**
   - All components must implement clone()
   - Required for entity duplication and pooling

7. **Never use direct assignment for optional fields**
   ```typescript
   // ❌ WRONG
   component.matrix = data.matrix;  // Reference sharing

   // ✅ CORRECT
   if (data.matrix !== undefined) {
     component.matrix = { ...data.matrix };
   }
   ```

### 🚫 **DO NOT** - Type Safety Issues

8. **Never cast unknown data to interfaces**
   - Validate data structure first
   - Use proper type guards

9. **Never ignore the `space` field in ITransform**
   - LocalTransform and WorldTransform must handle `space`
   - Data loss risk identified in audit

10. **Never use fromSpec() vs fromData() inconsistently**
    - All components use `fromData()` naming
    - Maintain API consistency across all modules

---

## 📊 Component Summary Table

| Category | Components | Interface | Key Pattern |
|----------|------------|-----------|-------------|
| **Transform** | LocalTransform, WorldTransform, Parent, Children | ITransform, IParent, IChildren | Null checks + deep copy |
| **Visual** | MeshRef, MaterialRef, TextureRef, Color, Visible, Layer, CastShadow, ReceiveShadow | IMeshRef, IMaterialRef, BaseTextureRef, ColorLike, IVisible, ILayer, ICastShadow, IReceiveShadow | Deep copy for nested objects |
| **Data** | Name, Tag, Tags, Metadata, Disabled, Static | IName, ITag, ITags, IMetadata, IDisabled, IStatic | Array spread, optional fields |
| **Physics** | Velocity, Acceleration, AngularVelocity, Mass, Gravity, Damping | Vector3Like, IMass, IGravity, IDamping | Direct value copy |
| **Animation** | AnimationState, AnimationClipRef, Timeline, TweenState | IAnimationState, IAnimationClipRef, ITimeline, ITweenState | All fields copied |

---

## 🎯 Key Design Decisions

1. **Type-First Architecture**: Interfaces defined before implementations
2. **Specification Alignment**: Components strictly implement specification interfaces
3. **Consistent API**: All components use `fromData()` + `clone()` pattern
4. **Deep Copy Safety**: Nested objects always use spread operator
5. **Null Safety**: All fromData methods handle optional fields gracefully
6. **Trait Composition**: Interfaces compose reusable trait patterns

---

## 🔗 Related Documents

- **Architecture**: ECS architecture and entity lifecycle
- **Component Lifecycle**: Creation, update, and destruction patterns
- **Specification Interfaces**: Detailed interface definitions and contracts