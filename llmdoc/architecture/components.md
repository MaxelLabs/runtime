---
id: "architecture-components"
type: "architecture"
title: "Component Architecture"
description: "Complete component system documentation including Transform, Visual, Camera, Light, Layout, Animation, and Data components with unified fromData() patterns"
tags: ["components", "ecs", "architecture", "fromdata", "design-pattern"]
context_dependency: ["constitution-core-runtime", "architecture-system-overview"]
related_ids: ["ref-data-models-core", "architecture-scene-systems", "architecture-resources"]
---

## 📋 Context & Goal

**Context**: This document describes the refactored component architecture with unified `fromData()` patterns, new component categories (Camera, Light), and compliance with the Constitution.

**Goal**: Provide comprehensive reference for all component implementations, their interfaces, and the standardized factory patterns.

**Key Changes from Previous Version**:
- ✅ Unified `fromData()` pattern across all components
- ✅ New Camera and Light components
- ✅ Strict null safety with `Partial<T>` interfaces
- ✅ Deep copy enforcement for all object references
- ✅ Specification-first type definitions

---

## 🔌 Component Interface Hierarchy

### Base Component Structure

```typescript
// All components extend Component base class
class Component {
  id: string;
  type: string;
  dirty: boolean = false;

  markDirty(): void;
  clone(): this;

  // Static factory method - REQUIRED
  static fromData(data: Partial<TData>): Component;
}
```

### Component Categories

```
Component
├── Transform Components
│   ├── LocalTransform
│   ├── WorldTransform
│   ├── Parent
│   └── Children
│
├── Visual Components
│   ├── MeshRef
│   ├── MaterialRef
│   ├── TextureRef
│   ├── Visible
│   ├── Layer
│   ├── CastShadow
│   └── ReceiveShadow
│
├── Camera Components
│   ├── Camera
│   └── CameraTarget
│
├── Light Components
│   ├── DirectionalLight
│   ├── PointLight
│   ├── SpotLight
│   └── AmbientLight
│
├── Layout Components
│   ├── Anchor
│   ├── FlexContainer
│   ├── FlexItem
│   ├── LayoutResult
│   ├── SizeConstraint
│   ├── Margin
│   └── Padding
│
├── Animation Components
│   ├── AnimationState
│   ├── AnimationClipRef
│   ├── Timeline
│   └── TweenState
│
└── Data Components
    ├── Name
    ├── Tag
    ├── Tags
    ├── Metadata
    ├── Disabled
    └── Static
```

---

## 🏗️ Transform Components

### LocalTransform

**Specification**: `ITransform` from `@maxellabs/specification`

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

**Implementation**:

```typescript
class LocalTransform extends Component implements ITransform {
  position: Vector3Like = { x: 0, y: 0, z: 0 };
  rotation: QuaternionLike = { x: 0, y: 0, z: 0, w: 1 };
  scale: Vector3Like = { x: 1, y: 1, z: 1 };
  matrix?: Matrix4Like;
  anchor?: Vector3Like;
  space?: TransformSpace;

  static fromData(data: Partial<ITransform>): LocalTransform {
    const component = new LocalTransform();

    // Required fields with defaults
    if (data.position) {
      component.position = {
        x: data.position.x ?? 0,
        y: data.position.y ?? 0,
        z: data.position.z ?? 0
      };
    }

    if (data.rotation) {
      component.rotation = {
        x: data.rotation.x ?? 0,
        y: data.rotation.y ?? 0,
        z: data.rotation.z ?? 0,
        w: data.rotation.w ?? 1
      };
    }

    if (data.scale) {
      component.scale = {
        x: data.scale.x ?? 1,
        y: data.scale.y ?? 1,
        z: data.scale.z ?? 1
      };
    }

    // Optional fields with deep copy
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

  clone(): LocalTransform {
    return LocalTransform.fromData({
      position: { ...this.position },
      rotation: { ...this.rotation },
      scale: { ...this.scale },
      matrix: this.matrix ? { ...this.matrix } : undefined,
      anchor: this.anchor ? { ...this.anchor } : undefined,
      space: this.space
    });
  }
}
```

**Design Decisions**:
- ✅ Uses `Partial<ITransform>` for null safety
- ✅ Deep copies all nested objects
- ✅ Provides defaults for missing fields
- ✅ Marks dirty after creation

### WorldTransform

```typescript
class WorldTransform extends Component implements ITransform {
  // Same interface as LocalTransform
  position: Vector3Like = { x: 0, y: 0, z: 0 };
  rotation: QuaternionLike = { x: 0, y: 0, z: 0, w: 1 };
  scale: Vector3Like = { x: 1, y: 1, z: 1 };
  matrix?: Matrix4Like;

  static fromData(data: Partial<ITransform>): WorldTransform {
    // Same pattern as LocalTransform
    const component = new WorldTransform();
    // ... implementation
    return component;
  }
}
```

**Purpose**: Computed by TransformSystem from LocalTransform + hierarchy.

---

## 📷 Camera Components

### Camera

**Specification**: `ICameraData` from `@maxellabs/specification`

```typescript
interface ICameraData {
  projectionType: ProjectionType;  // 'perspective' | 'orthographic'
  fov?: number;
  aspect?: number;
  orthographicSize?: number;
  near: number;
  far: number;
  isMain?: boolean;
  priority?: number;
  clearFlags?: CameraClearFlags;
  backgroundColor?: ColorLike;
  viewport?: [number, number, number, number];
  cullingMask?: number;
}
```

**Implementation**:

```typescript
class Camera extends Component implements ICameraData {
  projectionType: ProjectionType = 'perspective';
  fov: number = Math.PI / 3;  // 60 degrees
  aspect: number = 16 / 9;
  orthographicSize: number = 5;
  near: number = 0.1;
  far: number = 1000;
  isMain: boolean = true;
  priority: number = 0;
  clearFlags: CameraClearFlags = 'color';
  backgroundColor: ColorLike = { r: 0.2, g: 0.2, b: 0.2, a: 1 };
  viewport: [number, number, number, number] = [0, 0, 1, 1];
  cullingMask: number = 0xffffffff;

  static fromData(data: Partial<ICameraData>): Camera {
    const component = new Camera();

    if (data.projectionType !== undefined) {
      component.projectionType = data.projectionType;
    }
    if (data.fov !== undefined) {
      component.fov = data.fov;
    }
    if (data.aspect !== undefined) {
      component.aspect = data.aspect;
    }
    if (data.orthographicSize !== undefined) {
      component.orthographicSize = data.orthographicSize;
    }
    if (data.near !== undefined) {
      component.near = data.near;
    }
    if (data.far !== undefined) {
      component.far = data.far;
    }
    if (data.isMain !== undefined) {
      component.isMain = data.isMain;
    }
    if (data.priority !== undefined) {
      component.priority = data.priority;
    }
    if (data.clearFlags !== undefined) {
      component.clearFlags = data.clearFlags;
    }
    if (data.backgroundColor !== undefined) {
      component.backgroundColor = { ...data.backgroundColor };
    }
    if (data.viewport !== undefined) {
      component.viewport = [...data.viewport] as [number, number, number, number];
    }
    if (data.cullingMask !== undefined) {
      component.cullingMask = data.cullingMask;
    }

    return component;
  }

  clone(): Camera {
    const cloned = new Camera();
    cloned.projectionType = this.projectionType;
    cloned.fov = this.fov;
    cloned.aspect = this.aspect;
    cloned.orthographicSize = this.orthographicSize;
    cloned.near = this.near;
    cloned.far = this.far;
    cloned.isMain = this.isMain;
    cloned.priority = this.priority;
    cloned.clearFlags = this.clearFlags;
    cloned.backgroundColor = { ...this.backgroundColor };
    cloned.viewport = [...this.viewport] as [number, number, number, number];
    cloned.cullingMask = this.cullingMask;
    return cloned;
  }

  // Helper methods
  setPerspective(fov: number, aspect: number, near: number, far: number): this {
    this.projectionType = 'perspective';
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.markDirty();
    return this;
  }

  setOrthographic(size: number, aspect: number, near: number, far: number): this {
    this.projectionType = 'orthographic';
    this.orthographicSize = size;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.markDirty();
    return this;
  }
}
```

**Design Decisions**:
- ✅ Supports both perspective and orthographic projections
- ✅ Viewport normalized [0-1] coordinates
- ✅ Culling mask for layer filtering
- ✅ Priority for multiple cameras

### CameraTarget

```typescript
interface ICameraTarget {
  target: Vector3Like;
  up: Vector3Like;
}

class CameraTarget extends Component implements ICameraTarget {
  target: Vector3Like = { x: 0, y: 0, z: 0 };
  up: Vector3Like = { x: 0, y: 1, z: 0 };

  static fromData(data: Partial<ICameraTarget>): CameraTarget {
    const component = new CameraTarget();
    if (data.target !== undefined) {
      component.target = { ...data.target };
    }
    if (data.up !== undefined) {
      component.up = { ...data.up };
    }
    return component;
  }

  clone(): CameraTarget {
    const cloned = new CameraTarget();
    cloned.target = { ...this.target };
    cloned.up = { ...this.up };
    return cloned;
  }

  setTarget(x: number, y: number, z: number): this {
    this.target.x = x;
    this.target.y = y;
    this.target.z = z;
    this.markDirty();
    return this;
  }
}
```

**Purpose**: Used with Camera for LookAt functionality.

---

## 💡 Light Components

### DirectionalLight

**Specification**: `IDirectionalLightData` from `@maxellabs/specification`

```typescript
interface IDirectionalLightData {
  lightType: LightType.Directional;
  color: ColorLike;
  intensity: number;
  castShadow: boolean;
  shadow: IShadowConfig;
  cullingMask: number;
}

interface IShadowConfig {
  enabled: boolean;
  type: ShadowType;
  resolution: number;
  bias: number;
  normalBias: number;
  strength: number;
  distance: number;
  cascadeCount?: number;
}
```

**Implementation**:

```typescript
class DirectionalLight extends Component implements IDirectionalLightData {
  readonly lightType: LightType.Directional = LightType.Directional;
  color: ColorLike = { r: 1, g: 1, b: 1, a: 1 };
  intensity: number = 1;
  castShadow: boolean = true;
  shadow: IShadowConfig = {
    enabled: false,
    type: 'soft',
    resolution: 1024,
    bias: 0.005,
    normalBias: 0.02,
    strength: 1,
    distance: 50,
    cascadeCount: 4
  };
  cullingMask: number = 0xffffffff;

  static fromData(data: Partial<IDirectionalLightData>): DirectionalLight {
    const component = new DirectionalLight();

    if (data.color !== undefined) {
      component.color = { ...data.color };
    }
    if (data.intensity !== undefined) {
      component.intensity = data.intensity;
    }
    if (data.castShadow !== undefined) {
      component.castShadow = data.castShadow;
    }
    if (data.shadow !== undefined) {
      component.shadow = { ...component.shadow, ...data.shadow };
    }
    if (data.cullingMask !== undefined) {
      component.cullingMask = data.cullingMask;
    }

    return component;
  }

  clone(): DirectionalLight {
    const cloned = new DirectionalLight();
    cloned.color = { ...this.color };
    cloned.intensity = this.intensity;
    cloned.castShadow = this.castShadow;
    cloned.shadow = { ...this.shadow };
    cloned.cullingMask = this.cullingMask;
    return cloned;
  }

  setColor(r: number, g: number, b: number): this {
    this.color.r = r;
    this.color.g = g;
    this.color.b = b;
    this.markDirty();
    return this;
  }
}
```

### PointLight

```typescript
interface IPointLightData {
  lightType: LightType.Point;
  color: ColorLike;
  intensity: number;
  range: number;
  castShadow: boolean;
  shadow: IShadowConfig;
  cullingMask: number;
}

class PointLight extends Component implements IPointLightData {
  readonly lightType: LightType.Point = LightType.Point;
  color: ColorLike = { r: 1, g: 1, b: 1, a: 1 };
  intensity: number = 1;
  range: number = 10;
  castShadow: boolean = false;
  shadow: IShadowConfig = { /* default */ };
  cullingMask: number = 0xffffffff;

  static fromData(data: Partial<IPointLightData>): PointLight {
    const component = new PointLight();
    // ... pattern same as DirectionalLight
    return component;
  }

  clone(): PointLight { /* ... */ }
  setColor(r: number, g: number, b: number): this { /* ... */ }
}
```

### SpotLight

```typescript
interface ISpotLightData {
  lightType: LightType.Spot;
  color: ColorLike;
  intensity: number;
  range: number;
  innerConeAngle: number;
  outerConeAngle: number;
  castShadow: boolean;
  shadow: IShadowConfig;
  cullingMask: number;
}

class SpotLight extends Component implements ISpotLightData {
  readonly lightType: LightType.Spot = LightType.Spot;
  color: ColorLike = { r: 1, g: 1, b: 1, a: 1 };
  intensity: number = 1;
  range: number = 10;
  innerConeAngle: number = Math.PI / 6;  // 30°
  outerConeAngle: number = Math.PI / 4;  // 45°
  castShadow: boolean = false;
  shadow: IShadowConfig = { /* default */ };
  cullingMask: number = 0xffffffff;

  static fromData(data: Partial<ISpotLightData>): SpotLight {
    const component = new SpotLight();
    // ... pattern same as DirectionalLight
    return component;
  }

  clone(): SpotLight { /* ... */ }
  setColor(r: number, g: number, b: number): this { /* ... */ }
  setConeAngles(inner: number, outer: number): this {
    this.innerConeAngle = inner;
    this.outerConeAngle = outer;
    this.markDirty();
    return this;
  }
}
```

### AmbientLight

```typescript
class AmbientLight extends Component {
  color: ColorLike = { r: 0.1, g: 0.1, b: 0.1, a: 1 };
  intensity: number = 1;

  static fromData(data: Partial<{ color: ColorLike; intensity: number }>): AmbientLight {
    const component = new AmbientLight();
    if (data.color !== undefined) {
      component.color = { ...data.color };
    }
    if (data.intensity !== undefined) {
      component.intensity = data.intensity;
    }
    return component;
  }

  clone(): AmbientLight {
    const cloned = new AmbientLight();
    cloned.color = { ...this.color };
    cloned.intensity = this.intensity;
    return cloned;
  }
}
```

---

## 🎨 Visual Components

### MeshRef

```typescript
interface IMeshRef {
  assetId: string;
  meshName?: string;
  submeshIndex?: number;
}

class MeshRef extends Component implements IMeshRef {
  assetId: string = '';
  meshName?: string;
  submeshIndex?: number;

  static fromData(data: Partial<IMeshRef>): MeshRef {
    const component = new MeshRef();
    if (data.assetId !== undefined) {
      component.assetId = data.assetId;
    }
    if (data.meshName !== undefined) {
      component.meshName = data.meshName;
    }
    if (data.submeshIndex !== undefined) {
      component.submeshIndex = data.submeshIndex;
    }
    return component;
  }

  clone(): MeshRef {
    const cloned = new MeshRef();
    cloned.assetId = this.assetId;
    cloned.meshName = this.meshName;
    cloned.submeshIndex = this.submeshIndex;
    return cloned;
  }
}
```

### MaterialRef

```typescript
interface IMaterialRef {
  assetId: string;
  overrides?: Record<string, unknown>;
  materialEnabled?: boolean;
}

class MaterialRef extends Component implements IMaterialRef {
  assetId: string = '';
  overrides?: Record<string, unknown>;
  materialEnabled: boolean = true;

  static fromData(data: Partial<IMaterialRef>): MaterialRef {
    const component = new MaterialRef();
    if (data.assetId !== undefined) {
      component.assetId = data.assetId;
    }
    if (data.overrides !== undefined) {
      component.overrides = { ...data.overrides };
    }
    if (data.materialEnabled !== undefined) {
      component.materialEnabled = data.materialEnabled;
    }
    return component;
  }

  clone(): MaterialRef {
    const cloned = new MaterialRef();
    cloned.assetId = this.assetId;
    cloned.overrides = this.overrides ? { ...this.overrides } : undefined;
    cloned.materialEnabled = this.materialEnabled;
    return cloned;
  }
}
```

### TextureRef

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

class TextureRef extends Component implements BaseTextureRef {
  assetId: string = '';
  slot?: string;
  uvChannel: number = 0;
  transform: TextureTransform = {
    scale: { x: 1, y: 1 },
    offset: { x: 0, y: 0 },
    rotation: 0
  };
  sampler?: TextureSampler;
  intensity: number = 1;

  static fromData(data: Partial<BaseTextureRef>): TextureRef {
    const component = new TextureRef();

    if (data.assetId !== undefined) {
      component.assetId = data.assetId;
    }
    if (data.slot !== undefined) {
      component.slot = data.slot;
    }
    if (data.uvChannel !== undefined) {
      component.uvChannel = data.uvChannel;
    }

    // Deep copy transform
    if (data.transform !== undefined) {
      component.transform = {
        scale: data.transform.scale ? { ...data.transform.scale } : { x: 1, y: 1 },
        offset: data.transform.offset ? { ...data.transform.offset } : { x: 0, y: 0 },
        rotation: data.transform.rotation ?? 0
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

  clone(): TextureRef {
    const cloned = new TextureRef();
    cloned.assetId = this.assetId;
    cloned.slot = this.slot;
    cloned.uvChannel = this.uvChannel;
    cloned.transform = {
      scale: { ...this.transform.scale },
      offset: { ...this.transform.offset },
      rotation: this.transform.rotation
    };
    if (this.sampler) {
      cloned.sampler = { ...this.sampler };
    }
    cloned.intensity = this.intensity;
    return cloned;
  }
}
```

**⚠️ Critical Fix**: Previous implementation had incomplete deep copy for `rotation`. Now properly handled.

---

## 📐 Layout Components

### Anchor

```typescript
interface IAnchor {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
}

class Anchor extends Component implements IAnchor {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;

  static fromData(data: Partial<IAnchor>): Anchor {
    const component = new Anchor();
    if (data.minX !== undefined) component.minX = data.minX;
    if (data.maxX !== undefined) component.maxX = data.maxX;
    if (data.minY !== undefined) component.minY = data.minY;
    if (data.maxY !== undefined) component.maxY = data.maxY;
    return component;
  }

  clone(): Anchor {
    const cloned = new Anchor();
    cloned.minX = this.minX;
    cloned.maxX = this.maxX;
    cloned.minY = this.minY;
    cloned.maxY = this.maxY;
    return cloned;
  }
}
```

### FlexContainer

```typescript
interface IFlexContainer {
  direction: FlexDirection;
  wrap: FlexWrap;
  justifyContent: FlexJustify;
  alignItems: FlexAlign;
  alignContent: FlexAlign;
  gap: number;
}

class FlexContainer extends Component implements IFlexContainer {
  direction: FlexDirection = 'row';
  wrap: FlexWrap = 'nowrap';
  justifyContent: FlexJustify = 'flex-start';
  alignItems: FlexAlign = 'stretch';
  alignContent: FlexAlign = 'stretch';
  gap: number = 0;

  static fromData(data: Partial<IFlexContainer>): FlexContainer {
    const component = new FlexContainer();
    if (data.direction !== undefined) component.direction = data.direction;
    if (data.wrap !== undefined) component.wrap = data.wrap;
    if (data.justifyContent !== undefined) component.justifyContent = data.justifyContent;
    if (data.alignItems !== undefined) component.alignItems = data.alignItems;
    if (data.alignContent !== undefined) component.alignContent = data.alignContent;
    if (data.gap !== undefined) component.gap = data.gap;
    return component;
  }

  clone(): FlexContainer {
    const cloned = new FlexContainer();
    cloned.direction = this.direction;
    cloned.wrap = this.wrap;
    cloned.justifyContent = this.justifyContent;
    cloned.alignItems = this.alignItems;
    cloned.alignContent = this.alignContent;
    cloned.gap = this.gap;
    return cloned;
  }
}
```

---

## 🎬 Animation Components

### AnimationState

```typescript
interface IAnimationState {
  currentTime: number;
  speed: number;
  isPlaying: boolean;
  loop: boolean;
  clipName?: string;
}

class AnimationState extends Component implements IAnimationState {
  currentTime: number = 0;
  speed: number = 1;
  isPlaying: boolean = false;
  loop: boolean = true;
  clipName?: string;

  static fromData(data: Partial<IAnimationState>): AnimationState {
    const component = new AnimationState();
    if (data.currentTime !== undefined) component.currentTime = data.currentTime;
    if (data.speed !== undefined) component.speed = data.speed;
    if (data.isPlaying !== undefined) component.isPlaying = data.isPlaying;
    if (data.loop !== undefined) component.loop = data.loop;
    if (data.clipName !== undefined) component.clipName = data.clipName;
    return component;
  }

  clone(): AnimationState {
    const cloned = new AnimationState();
    cloned.currentTime = this.currentTime;
    cloned.speed = this.speed;
    cloned.isPlaying = this.isPlaying;
    cloned.loop = this.loop;
    cloned.clipName = this.clipName;
    return cloned;
  }

  play(): void {
    this.isPlaying = true;
    this.markDirty();
  }

  pause(): void {
    this.isPlaying = false;
    this.markDirty();
  }

  stop(): void {
    this.isPlaying = false;
    this.currentTime = 0;
    this.markDirty();
  }
}
```

---

## 📊 Data Components

### Name, Tag, Disabled, Static

```typescript
// Name Component
class Name extends Component {
  value: string = '';

  static fromData(data: { value: string }): Name {
    const component = new Name();
    component.value = data.value;
    return component;
  }

  clone(): Name {
    const cloned = new Name();
    cloned.value = this.value;
    return cloned;
  }
}

// Tag Component
class Tag extends Component {
  value: string = '';

  static fromData(data: { value: string }): Tag {
    const component = new Tag();
    component.value = data.value;
    return component;
  }

  clone(): Tag {
    const cloned = new Tag();
    cloned.value = this.value;
    return cloned;
  }
}

// Disabled Component (Marker)
class Disabled extends Component {
  // No fields - marker interface

  static fromData(): Disabled {
    return new Disabled();
  }

  clone(): Disabled {
    return new Disabled();
  }
}

// Static Component (Marker)
class Static extends Component {
  // No fields - marker interface

  static fromData(): Static {
    return new Static();
  }

  clone(): Static {
    return new Static();
  }
}
```

**Design Decision**: Marker components use simplified `fromData()` without parameters.

---

## 🏭 Component Registration

### ComponentRegistry

```typescript
class ComponentRegistry {
  private registry: Map<string, ComponentClass> = new Map();
  private factories: Map<string, (data: any) => Component> = new Map();

  register<T extends Component>(type: string, componentClass: ComponentClass<T>): void {
    this.registry.set(type, componentClass);
    this.factories.set(type, (data) => componentClass.fromData(data));
  }

  getComponentClass(type: string): ComponentClass | undefined {
    return this.registry.get(type);
  }

  createComponent(type: string, data: any): Component | undefined {
    const factory = this.factories.get(type);
    return factory ? factory(data) : undefined;
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.registry.keys());
  }
}

// Global registry instance
const globalRegistry = new ComponentRegistry();

// Register all components
export function registerAllComponents(): void {
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

## 🎯 Unified Pattern Summary

### The fromData() Standard

Every component MUST follow this pattern:

```typescript
class ComponentName extends Component implements ISpecificationInterface {
  // 1. Default values
  field: Type = defaultValue;

  // 2. Static factory
  static fromData(data: Partial<ISpecificationInterface>): ComponentName {
    const component = new ComponentName();

    // 3. Null-safe field copying
    if (data.field !== undefined) {
      component.field = data.field;  // Primitives: direct
    }

    // 4. Deep copy for objects
    if (data.nestedObject !== undefined) {
      component.nestedObject = { ...data.nestedObject };
    }

    // 5. Array spread
    if (data.array !== undefined) {
      component.array = [...data.array];
    }

    return component;
  }

  // 6. Clone implementation
  clone(): ComponentName {
    return ComponentName.fromData({
      field: this.field,
      nestedObject: this.nestedObject ? { ...this.nestedObject } : undefined,
      array: this.array ? [...this.array] : undefined
    });
  }
}
```

### Pattern Compliance Checklist

- ✅ **Type-First**: Implements specification interface
- ✅ **Null Safety**: Uses `Partial<T>` parameter
- ✅ **Deep Copy**: `{...obj}`, `[...arr]` for all references
- ✅ **Defaults**: Provides default values for all fields
- ✅ **Dirty Flag**: Calls `markDirty()` when appropriate
- ✅ **Clone**: Implements proper clone method
- ✅ **Consistent**: All components use same pattern

---

## 🚫 Negative Constraints

### Forbidden Patterns

```typescript
// ❌ WRONG: Missing null checks
static fromData(data: ITransform): Transform {
  return {
    position: data.position,  // Crashes if data.position is null
    rotation: data.rotation
  };
}

// ❌ WRONG: Shallow copy
static fromData(data: ITransform): Transform {
  const component = new Transform();
  component.position = data.position;  // Shared reference!
  return component;
}

// ❌ WRONG: Ignoring optional fields
static fromData(data: ICameraData): Camera {
  const component = new Camera();
  component.backgroundColor = data.backgroundColor;  // No deep copy
  return component;
}

// ❌ WRONG: Inconsistent naming
static fromSpec(data: ICameraData): Camera { ... }  // Should be fromData

// ❌ WRONG: Mutable defaults
class BadComponent {
  static DEFAULT_POS = { x: 0, y: 0, z: 0 };  // Shared!
  position = BadComponent.DEFAULT_POS;
}
```

### Common Mistakes

1. **Reference Sharing**: Always deep copy objects/arrays
2. **Missing Checks**: Always check `!== undefined` before assignment
3. **Type Safety**: Never use `any` in component interfaces
4. **Inconsistent Naming**: Always use `fromData()`
5. **Empty Parameters**: Marker components should use `fromData()` without params

---

## 📊 Component Comparison Table

| Component | Spec Interface | Required Fields | Optional Fields | Deep Copy Objects |
|-----------|---------------|-----------------|-----------------|-------------------|
| LocalTransform | ITransform | position, rotation, scale | matrix, anchor, space | ✅ matrix, anchor |
| Camera | ICameraData | projectionType, near, far | fov, aspect, viewport, backgroundColor | ✅ backgroundColor, viewport |
| DirectionalLight | IDirectionalLightData | color, intensity | shadow, cullingMask | ✅ color, shadow |
| MeshRef | IMeshRef | assetId | meshName, submeshIndex | ❌ (primitives only) |
| TextureRef | BaseTextureRef | assetId | transform, sampler | ✅ transform, sampler |
| AnimationState | IAnimationState | currentTime, speed, isPlaying, loop | clipName | ❌ (primitives only) |

---

## 🔄 Data Flow

### Specification → Component → World

```
1. Editor/JSON Data (ITransform)
   ↓
2. Component.fromData(data)
   ↓
3. Component Instance (LocalTransform)
   ↓
4. World.addComponent(entity, LocalTransform, instance)
   ↓
5. Archetype Storage (SoA layout)
   ↓
6. Systems Query & Process
```

### Example Flow

```typescript
// 1. Load from JSON
const transformData: ITransform = {
  position: { x: 10, y: 5, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 }
};

// 2. Create component (with validation)
const transform = LocalTransform.fromData(transformData);

// 3. Add to world
world.addComponent(entity, LocalTransform, transform);

// 4. Query and use
const query = world.query({ all: [LocalTransform] });
query.forEach((entity, [transform]) => {
  // transform is guaranteed to be LocalTransform instance
  console.log(transform.position);
});
```

---

## ✅ Compliance Checklist

### For New Components

- [ ] Extends `Component` base class
- [ ] Implements specification interface from `@maxellabs/specification`
- [ ] Uses `Partial<T>` for `fromData()` parameter
- [ ] Provides default values for all fields
- [ ] Implements `static fromData()` with null checks
- [ ] Implements `clone()` with deep copy
- [ ] Calls `markDirty()` when data changes
- [ ] Uses spread operator for object/array copying
- [ ] No `any` types in implementation
- [ ] Follows naming conventions (PascalCase class, fromData method)

### For Documentation

- [ ] Interface definition first
- [ ] Implementation with comments
- [ ] Design decisions explained
- [ ] Negative constraints listed
- [ ] Example usage provided
- [ ] Cross-references to related docs

---

## 📚 Related Documents

- **Constitution**: `constitution-core-runtime` - All rules must be followed
- **Specification**: `ref-data-models-core` - Interface definitions
- **Scene Architecture**: `architecture-scene-systems` - How components are used
- **Resources**: `architecture-resources` - Resource management
- **Systems**: `architecture-logic-systems` - System execution order